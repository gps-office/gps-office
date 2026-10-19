-- Database tests: access rules, CIPO gating, references, audit, balances.
-- Run with supabase/tests/run-local.sh (local throwaway database only).

\set ON_ERROR_STOP 1

-- Test fixtures (as superuser) ------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'staff@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'former@test.local');
insert into public.staff (id, full_name, email, role, active) values
  ('00000000-0000-0000-0000-00000000000a', 'Admin', 'admin@test.local', 'admin', true),
  ('00000000-0000-0000-0000-00000000000b', 'Staff', 'staff@test.local', 'staff', true),
  ('00000000-0000-0000-0000-00000000000c', 'Former', 'former@test.local', 'staff', false);

create schema tests;
create function tests.act_as(uid text, aal text) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', uid, 'aal', aal, 'role', 'authenticated')::text, false);
$$;
grant usage on schema tests to authenticated, anon;

-- 1. Anonymous role has no table access ---------------------------------------
set role anon;
do $$ begin
  begin
    perform 1 from public.clients;
    raise exception 'FAIL: anon could read clients';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 2. Signed in but without 2FA (aal1): sees nothing, cannot write -------------
select tests.act_as('00000000-0000-0000-0000-00000000000b', 'aal1');
set role authenticated;
do $$ begin
  begin
    insert into public.clients (full_name) values ('Should Fail');
    raise exception 'FAIL: aal1 session could insert a client';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.services) <> 0 then
    raise exception 'FAIL: aal1 session could read services';
  end if;
  -- but may read their own staff row
  if (select count(*) from public.staff) <> 1 then
    raise exception 'FAIL: aal1 session should see only own staff row';
  end if;
end $$;
reset role;

-- 3. Staff with 2FA: create client and case, reference numbering --------------
select tests.act_as('00000000-0000-0000-0000-00000000000b', 'aal2');
set role authenticated;
do $$
declare
  cl uuid; c1 uuid; c2 uuid; r1 text; r2 text; yy text;
begin
  insert into public.clients (full_name, hebrew_name, passport_number)
  values ('Sarah Cohen', 'שרה כהן', '123456789') returning id into cl;

  insert into public.cases (client_id, service_id, reference)
  values (cl, (select id from public.services where code = 'british_passport'), 'HACKED')
  returning id, reference into c1, r1;
  insert into public.cases (client_id, service_id)
  values (cl, (select id from public.services where code = 'euss'))
  returning id, reference into c2, r2;

  yy := lpad((extract(year from now() at time zone 'Europe/London')::int % 100)::text, 2, '0');
  if r1 <> 'GPS-' || yy || '-0001' or r2 <> 'GPS-' || yy || '-0002' then
    raise exception 'FAIL: references were % and %', r1, r2;
  end if;

  if (select count(*) from public.cipo_checks where case_id = c1) <> 9 then
    raise exception 'FAIL: CIPO steps not created';
  end if;

  -- reference cannot be edited
  begin
    update public.cases set reference = 'GPS-00-9999' where id = c1;
    raise exception 'FAIL: reference was editable';
  exception when raise_exception then
    if sqlerrm not like 'Case references cannot be changed%' then raise; end if;
  end;

  -- 4. CIPO gating ------------------------------------------------------------
  update public.cases set stage = 'cipo_intake' where id = c1;
  begin
    update public.cases set stage = 'documents_outstanding' where id = c1;
    raise exception 'FAIL: moved past CIPO while incomplete';
  exception when raise_exception then
    if sqlerrm not like 'CIPO must be complete%' then raise; end if;
  end;

  -- cannot fake cipo_complete directly
  update public.cases set cipo_complete = true where id = c1;
  if (select cipo_complete from public.cases where id = c1) then
    raise exception 'FAIL: cipo_complete could be set directly';
  end if;

  update public.cipo_checks set checked = true where case_id = c1 and step <= 8;
  if (select cipo_complete from public.cases where id = c1) then
    raise exception 'FAIL: CIPO complete after 8 steps';
  end if;
  update public.cipo_checks set checked = true where case_id = c1 and step = 9;
  if not (select cipo_complete from public.cases where id = c1) then
    raise exception 'FAIL: CIPO not complete after 9 steps';
  end if;
  if exists (select 1 from public.cipo_checks where case_id = c1
             and (checked_by is distinct from auth.uid() or checked_at is null)) then
    raise exception 'FAIL: CIPO ticks not stamped with who/when';
  end if;

  update public.cases set stage = 'documents_outstanding' where id = c1;

  begin
    update public.cipo_checks set checked = false where case_id = c1 and step = 3;
    raise exception 'FAIL: CIPO re-opened after moving on';
  exception when raise_exception then
    if sqlerrm not like 'CIPO cannot be re-opened%' then raise; end if;
  end;

  if (select count(*) from public.dn_entries
      where case_id = c1 and entry_type = 'event' and body like 'Stage changed:%') <> 2 then
    raise exception 'FAIL: stage changes not written to D&N';
  end if;

  -- 5. D&N author must be self ------------------------------------------------
  begin
    insert into public.dn_entries (case_id, body, author_id)
    values (c1, 'Spoofed', '00000000-0000-0000-0000-00000000000a');
    raise exception 'FAIL: could write D&N as someone else';
  exception when insufficient_privilege then null;
  end;
  insert into public.dn_entries (case_id, entry_type, body) values (c1, 'call', 'Client called');

  -- 6. Finance balance --------------------------------------------------------
  insert into public.finance_lines (case_id, line_type, amount) values
    (c1, 'quotation', 500), (c1, 'invoice', 300), (c1, 'government_fee', 100),
    (c1, 'deposit', 150), (c1, 'payment', 100), (c1, 'refund', 20);
  if (select row(quoted, charged, paid, balance)::text from public.case_balances where case_id = c1)
     <> '(500.00,400.00,230.00,170.00)' then
    raise exception 'FAIL: balance was %',
      (select row(quoted, charged, paid, balance)::text from public.case_balances where case_id = c1);
  end if;

  -- 7. Document versions ------------------------------------------------------
  declare d uuid; v int;
  begin
    insert into public.documents (case_id, name, category, is_original)
    values (c1, 'Passport', 'passport', true) returning id into d;
    insert into public.document_versions (document_id, case_id, version, storage_path, file_name)
    values (d, c2, 99, 'cases/x/1', 'a.pdf');
    insert into public.document_versions (document_id, case_id, version, storage_path, file_name)
    values (d, c2, 99, 'cases/x/2', 'b.pdf') returning version into v;
    if v <> 2 or exists (select 1 from public.document_versions where document_id = d and case_id <> c1) then
      raise exception 'FAIL: version numbering / case_id copy';
    end if;
  end;

  -- 8. Staff cannot delete or change configuration ----------------------------
  delete from public.clients where id = cl;
  if not exists (select 1 from public.clients where id = cl) then
    raise exception 'FAIL: staff could delete a client';
  end if;
  update public.staff set role = 'admin' where id = auth.uid();
  if (select role from public.staff where id = auth.uid()) <> 'staff' then
    raise exception 'FAIL: staff could promote themselves';
  end if;
  update public.services set price_standard = 1 where code = 'euss';
  if (select price_standard from public.services where code = 'euss') is not null then
    raise exception 'FAIL: staff could change prices';
  end if;

  -- 9. Audit log: readable, not writable --------------------------------------
  if (select count(*) from public.audit_log where case_id = c1 and table_name = 'cases') < 3 then
    raise exception 'FAIL: case changes not audited';
  end if;
  if exists (select 1 from public.audit_log where case_id = c1 and changed_by is distinct from auth.uid()) then
    raise exception 'FAIL: audit changed_by not recorded';
  end if;
  if not exists (select 1 from public.audit_log where table_name = 'clients' and client_id = cl) then
    raise exception 'FAIL: client insert not audited';
  end if;
  begin
    insert into public.audit_log (table_name, action) values ('x', 'INSERT');
    raise exception 'FAIL: staff could write audit log';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.audit_log;
    raise exception 'FAIL: staff could delete audit log';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 10. Inactive staff see nothing ----------------------------------------------
select tests.act_as('00000000-0000-0000-0000-00000000000c', 'aal2');
set role authenticated;
do $$ begin
  if (select count(*) from public.clients) <> 0 or (select count(*) from public.cases) <> 0 then
    raise exception 'FAIL: inactive staff can read data';
  end if;
end $$;
reset role;

-- 11. Admin: can delete, can manage staff, cannot remove own admin ------------
select tests.act_as('00000000-0000-0000-0000-00000000000a', 'aal2');
set role authenticated;
do $$ begin
  update public.services set price_standard = 120 where code = 'euss';
  if (select price_standard from public.services where code = 'euss') <> 120 then
    raise exception 'FAIL: admin could not set price';
  end if;
  begin
    update public.staff set role = 'staff' where id = auth.uid();
    raise exception 'FAIL: admin removed own admin rights';
  exception when raise_exception then
    if sqlerrm not like 'You cannot remove your own admin access%' then raise; end if;
  end;
  update public.staff set active = false where email = 'staff@test.local';
  update public.staff set active = true where email = 'staff@test.local';

  delete from public.dn_entries where body = 'Client called';
  if exists (select 1 from public.dn_entries where body = 'Client called') then
    raise exception 'FAIL: admin could not delete';
  end if;
  if not exists (select 1 from public.audit_log where table_name = 'dn_entries' and action = 'DELETE') then
    raise exception 'FAIL: delete not audited';
  end if;

  -- Case-level cascade delete keeps the audit trail
  delete from public.cases where reference like '%-0002';
  if not exists (select 1 from public.audit_log where table_name = 'cases' and action = 'DELETE') then
    raise exception 'FAIL: case delete not audited';
  end if;
end $$;
reset role;

-- 12. Storage: bucket private, staff can upload, aal1 cannot ------------------
do $$ begin
  if (select public from storage.buckets where id = 'case-documents') then
    raise exception 'FAIL: bucket is public';
  end if;
end $$;
select tests.act_as('00000000-0000-0000-0000-00000000000b', 'aal2');
set role authenticated;
insert into storage.objects (bucket_id, name) values ('case-documents', 'cases/a/b/c');
reset role;
select tests.act_as('00000000-0000-0000-0000-00000000000b', 'aal1');
set role authenticated;
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('case-documents', 'cases/a/b/d');
    raise exception 'FAIL: aal1 could upload';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from storage.objects) <> 0 then
    raise exception 'FAIL: aal1 could list files';
  end if;
end $$;
reset role;

select 'security tests passed' as result;
