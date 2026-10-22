-- GPS Office – access control (RLS) and audit log
--
-- Rule: only signed-in, active staff who have passed two-factor
-- authentication (session AAL2) can read or write anything. The anonymous
-- role has no access to any table. Deletes are restricted to admins.

-- ---------------------------------------------------------------------------
-- Helper functions used by policies
-- ---------------------------------------------------------------------------

create function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (
       select 1 from public.staff s
        where s.id = auth.uid() and s.active
     );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (
       select 1 from public.staff s
        where s.id = auth.uid() and s.active and s.role = 'admin'
     );
$$;

-- ---------------------------------------------------------------------------
-- Lock down the anonymous role completely
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from public, anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from public, anon;

grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.stage_label(public.case_stage) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.service_checklist_items enable row level security;
alter table public.app_settings enable row level security;
alter table public.clients enable row level security;
alter table public.client_links enable row level security;
alter table public.case_reference_counters enable row level security; -- no policies: trigger-only
alter table public.cases enable row level security;
alter table public.case_people enable row level security;
alter table public.cipo_checks enable row level security;
alter table public.dn_entries enable row level security;
alter table public.shipments enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.tasks enable row level security;
alter table public.finance_lines enable row level security;

-- ---------------------------------------------------------------------------
-- Case-work tables: staff read/insert/update, admins delete
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'client_links', 'cases', 'case_people', 'shipments',
    'documents', 'document_versions', 'tasks', 'finance_lines'
  ]
  loop
    execute format(
      'create policy "Staff can read" on public.%I for select to authenticated
         using ((select public.is_active_staff()))', t);
    execute format(
      'create policy "Staff can add" on public.%I for insert to authenticated
         with check ((select public.is_active_staff()))', t);
    execute format(
      'create policy "Staff can edit" on public.%I for update to authenticated
         using ((select public.is_active_staff()))
         with check ((select public.is_active_staff()))', t);
    execute format(
      'create policy "Admins can delete" on public.%I for delete to authenticated
         using ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- CIPO rows are created by trigger; staff only tick/untick them.
create policy "Staff can read" on public.cipo_checks for select to authenticated
  using ((select public.is_active_staff()));
create policy "Staff can edit" on public.cipo_checks for update to authenticated
  using ((select public.is_active_staff()))
  with check ((select public.is_active_staff()));

-- D&N: anyone can add; only the author (or an admin) can edit an entry.
create policy "Staff can read" on public.dn_entries for select to authenticated
  using ((select public.is_active_staff()));
create policy "Staff can add" on public.dn_entries for insert to authenticated
  with check ((select public.is_active_staff()) and author_id = (select auth.uid()));
create policy "Authors can edit" on public.dn_entries for update to authenticated
  using ((select public.is_admin()) or ((select public.is_active_staff()) and author_id = (select auth.uid())))
  with check ((select public.is_admin()) or ((select public.is_active_staff()) and author_id = (select auth.uid())));
create policy "Admins can delete" on public.dn_entries for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Configuration tables: staff read, admins write
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['staff', 'services', 'service_checklist_items', 'app_settings']
  loop
    execute format(
      'create policy "Staff can read" on public.%I for select to authenticated
         using ((select public.is_active_staff()))', t);
    execute format(
      'create policy "Admins can add" on public.%I for insert to authenticated
         with check ((select public.is_admin()))', t);
    execute format(
      'create policy "Admins can edit" on public.%I for update to authenticated
         using ((select public.is_admin()))
         with check ((select public.is_admin()))', t);
    execute format(
      'create policy "Admins can delete" on public.%I for delete to authenticated
         using ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- Each person can always read their own staff record (needed before 2FA so
-- the app can tell an inactive account apart from a missing one).
create policy "Staff can read own record" on public.staff for select to authenticated
  using (id = (select auth.uid()));

-- An admin cannot remove their own admin rights or deactivate themselves,
-- so the office can never be left without an admin by accident.
create function public.protect_own_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.id = auth.uid() and (new.role <> 'admin' or not new.active) and old.role = 'admin' then
    raise exception 'You cannot remove your own admin access'
      using errcode = 'P0001', hint = 'own_admin';
  end if;
  return new;
end;
$$;

create trigger staff_protect_own_admin before update on public.staff
  for each row execute function public.protect_own_admin();

-- ---------------------------------------------------------------------------
-- Audit log – written only by triggers, readable by staff, never editable
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id uuid,
  record_key text,
  case_id uuid,
  client_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid,
  changed_at timestamptz not null default now(),
  changed_fields text[],
  old_data jsonb,
  new_data jsonb
);

create index audit_log_case_idx on public.audit_log (case_id, changed_at desc);
create index audit_log_client_idx on public.audit_log (client_id, changed_at desc);
create index audit_log_record_idx on public.audit_log (table_name, record_id);
create index audit_log_changed_at_idx on public.audit_log (changed_at desc);

alter table public.audit_log enable row level security;

create policy "Staff can read" on public.audit_log for select to authenticated
  using ((select public.is_active_staff()));

revoke insert, update, delete, truncate on public.audit_log from authenticated, anon;

create function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  o jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  n jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  r jsonb := coalesce(n, o);
  fields text[];
  -- bookkeeping columns that change constantly and are not meaningful history
  ignored text[] := array['updated_at', 'last_activity_at'];
begin
  if tg_op = 'UPDATE' then
    select array_agg(e.key order by e.key) into fields
      from jsonb_each(n) as e
     where e.key <> all (ignored)
       and (o -> e.key) is distinct from e.value;
    if fields is null then
      return null;
    end if;
  end if;

  insert into public.audit_log (
    table_name, record_id, record_key, case_id, client_id,
    action, changed_by, changed_fields, old_data, new_data
  ) values (
    tg_table_name,
    case when r ? 'id' then (r ->> 'id')::uuid end,
    case when r ? 'key' then r ->> 'key' end,
    case when tg_table_name = 'cases' then (r ->> 'id')::uuid else (r ->> 'case_id')::uuid end,
    case when tg_table_name = 'clients' then (r ->> 'id')::uuid else (r ->> 'client_id')::uuid end,
    tg_op,
    auth.uid(),
    fields,
    o,
    n
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'staff', 'services', 'service_checklist_items', 'app_settings',
    'clients', 'client_links', 'cases', 'case_people', 'cipo_checks',
    'dn_entries', 'shipments', 'documents', 'document_versions',
    'tasks', 'finance_lines'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_row_change()',
      t || '_audit', t);
  end loop;
end;
$$;
