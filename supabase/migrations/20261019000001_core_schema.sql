-- GPS Office – core schema
-- Every table here holds or relates to personal data. Access rules (RLS) are
-- in the next migration; nothing is readable until those policies exist.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

create type public.staff_role as enum ('admin', 'staff');

-- Order matters: stages are compared with < and > (e.g. "past CIPO / Intake").
create type public.case_stage as enum (
  'new_enquiry',
  'cipo_intake',
  'documents_outstanding',
  'application_preparation',
  'submitted',
  'approved',
  'closed'
);

create type public.service_level as enum ('standard', 'premium', 'urgent');

create type public.case_priority as enum ('low', 'normal', 'high', 'urgent');

create type public.relationship_type as enum (
  'spouse', 'partner', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other'
);

create type public.dn_type as enum (
  'note', 'email', 'whatsapp', 'call', 'event', 'concern', 'submission'
);

create type public.task_type as enum (
  'general',
  'client_reply',
  'document_chase',
  'embassy_appointment',
  'home_office_deadline',
  'submission',
  'courier',
  'payment_follow_up'
);

create type public.finance_type as enum (
  'quotation',
  'invoice',
  'government_fee',
  'solicitor_fee',
  'courier_charge',
  'deposit',
  'payment',
  'refund'
);

create type public.shipment_direction as enum (
  'from_client', 'to_client', 'to_authority', 'from_authority'
);

create type public.shipment_status as enum (
  'pending', 'in_transit', 'delivered', 'returned', 'lost'
);

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------

create table public.staff (
  id uuid primary key references auth.users (id),
  full_name text not null,
  email text not null unique,
  role public.staff_role not null default 'staff',
  active boolean not null default true,
  -- service codes this person specialises in (services.code)
  specialisms text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger staff_updated_at before update on public.staff
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Services, checklists and price list
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null default 'Other',
  description text,
  price_standard numeric(10, 2),
  price_premium numeric(10, 2),
  price_urgent numeric(10, 2),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

create table public.service_checklist_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  label text not null,
  description text,
  required boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_checklist_items_service_idx
  on public.service_checklist_items (service_id, sort_order);

create trigger service_checklist_items_updated_at before update on public.service_checklist_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Office settings (staleness threshold etc.)
-- ---------------------------------------------------------------------------

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

insert into public.app_settings (key, value, description) values
  ('stale_after_days', '7', 'Cases with no activity for this many days are flagged on the dashboard'),
  ('deadline_window_days', '14', 'Dashboard shows deadlines within this many days'),
  ('passport_expiry_warning_days', '180', 'Warn when a passport or document expires within this many days');

-- ---------------------------------------------------------------------------
-- Clients and family links
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  hebrew_name text,
  date_of_birth date,
  nationality text,
  passport_number text,
  passport_expiry date,
  phone text,
  whatsapp text,
  email text,
  address text,
  notes text,
  created_by uuid references public.staff (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_full_name_trgm on public.clients using gin (full_name extensions.gin_trgm_ops);
create index clients_hebrew_name_trgm on public.clients using gin (hebrew_name extensions.gin_trgm_ops);
create index clients_passport_number_idx on public.clients (upper(passport_number));

create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

-- "related_client is the <relationship> of client" – e.g. relationship = 'child'
-- means related_client_id is a child of client_id.
create table public.client_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  related_client_id uuid not null references public.clients (id) on delete cascade,
  relationship public.relationship_type not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint client_links_not_self check (client_id <> related_client_id),
  constraint client_links_unique unique (client_id, related_client_id)
);

create index client_links_related_idx on public.client_links (related_client_id);

-- ---------------------------------------------------------------------------
-- Cases
-- ---------------------------------------------------------------------------

create table public.case_reference_counters (
  year integer primary key,
  last_value integer not null
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default '', -- GPS-26-0001, always set by trigger
  client_id uuid not null references public.clients (id),
  service_id uuid not null references public.services (id),
  title text,
  service_level public.service_level not null default 'standard',
  priority public.case_priority not null default 'normal',
  stage public.case_stage not null default 'new_enquiry',
  assigned_to uuid references public.staff (id),
  manager_id uuid references public.staff (id),
  deadline date,
  ref_home_office text,
  ref_hmpo text,
  ref_uscis text,
  ref_consulate text,
  ref_other text,
  cipo_complete boolean not null default false,
  -- D&N headline fields
  next_action text,
  outstanding text,
  concerns text,
  key_facts text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  last_activity_at timestamptz not null default now(),
  created_by uuid references public.staff (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cases_client_idx on public.cases (client_id);
create index cases_stage_idx on public.cases (stage);
create index cases_assigned_idx on public.cases (assigned_to);
create index cases_deadline_idx on public.cases (deadline) where stage < 'closed';
create index cases_last_activity_idx on public.cases (last_activity_at);

create trigger cases_updated_at before update on public.cases
  for each row execute function public.set_updated_at();

-- Assign GPS-YY-NNNN references, numbered per calendar year (London time).
-- References are always generated and can never be edited.
create function public.assign_case_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  yy integer := extract(year from (now() at time zone 'Europe/London'))::integer;
  n integer;
begin
  if tg_op = 'UPDATE' then
    if new.reference is distinct from old.reference then
      raise exception 'Case references cannot be changed';
    end if;
    return new;
  end if;

  insert into public.case_reference_counters as c (year, last_value)
  values (yy, 1)
  on conflict (year) do update set last_value = c.last_value + 1
  returning c.last_value into n;

  new.reference := 'GPS-' || lpad((yy % 100)::text, 2, '0') || '-' || lpad(n::text, 4, '0');
  return new;
end;
$$;

create trigger cases_assign_reference before insert or update of reference on public.cases
  for each row execute function public.assign_case_reference();

-- Stage rules: a case cannot move past CIPO / Intake until CIPO is complete.
-- cipo_complete itself is only ever set by sync_cipo_complete().
create function public.enforce_case_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.cipo_complete := false;
  elsif new.cipo_complete is distinct from old.cipo_complete
        and coalesce(current_setting('gps.cipo_sync', true), '') <> 'on' then
    new.cipo_complete := old.cipo_complete;
  end if;

  if new.stage > 'cipo_intake' and not new.cipo_complete then
    raise exception 'CIPO must be complete before the case can move past CIPO / Intake'
      using errcode = 'P0001', hint = 'cipo_incomplete';
  end if;

  if new.stage = 'closed' and (tg_op = 'INSERT' or old.stage <> 'closed') then
    new.closed_at := now();
  elsif new.stage <> 'closed' then
    new.closed_at := null;
  end if;

  return new;
end;
$$;

create trigger cases_enforce_rules before insert or update on public.cases
  for each row execute function public.enforce_case_rules();

-- ---------------------------------------------------------------------------
-- People on the case
-- ---------------------------------------------------------------------------

create table public.case_people (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  full_name text not null,
  hebrew_name text,
  date_of_birth date,
  nationality text,
  passport_number text,
  passport_expiry date,
  relationship text,
  is_main_applicant boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index case_people_case_idx on public.case_people (case_id);
create index case_people_passport_idx on public.case_people (upper(passport_number));

create trigger case_people_updated_at before update on public.case_people
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- CIPO – Case Intake, Preparation & Organisation (9 steps per case)
-- ---------------------------------------------------------------------------

create table public.cipo_checks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  step smallint not null check (step between 1 and 9),
  checked boolean not null default false,
  checked_by uuid references public.staff (id),
  checked_at timestamptz,
  note text,
  updated_at timestamptz not null default now(),
  constraint cipo_checks_unique unique (case_id, step)
);

create trigger cipo_checks_updated_at before update on public.cipo_checks
  for each row execute function public.set_updated_at();

-- Every new case gets its nine CIPO steps.
create function public.create_cipo_checks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.cipo_checks (case_id, step)
  select new.id, s from generate_series(1, 9) as s;
  return null;
end;
$$;

create trigger cases_create_cipo after insert on public.cases
  for each row execute function public.create_cipo_checks();

-- Record who ticked each step and when; block re-opening CIPO once the case
-- has moved on.
create function public.stamp_cipo_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_stage public.case_stage;
begin
  if new.case_id <> old.case_id or new.step <> old.step then
    raise exception 'CIPO steps cannot be moved between cases';
  end if;

  if new.checked is distinct from old.checked then
    if new.checked then
      new.checked_by := auth.uid();
      new.checked_at := now();
    else
      select stage into current_stage from public.cases where id = new.case_id;
      if current_stage > 'cipo_intake' then
        raise exception 'CIPO cannot be re-opened after the case has moved past CIPO / Intake'
          using errcode = 'P0001', hint = 'cipo_locked';
      end if;
      new.checked_by := null;
      new.checked_at := null;
    end if;
  else
    new.checked_by := old.checked_by;
    new.checked_at := old.checked_at;
  end if;
  return new;
end;
$$;

create trigger cipo_checks_stamp before update on public.cipo_checks
  for each row execute function public.stamp_cipo_check();

create function public.sync_cipo_complete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('gps.cipo_sync', 'on', true);
  update public.cases c
     set cipo_complete = (
       select count(*) = 9 from public.cipo_checks k
        where k.case_id = new.case_id and k.checked
     )
   where c.id = new.case_id;
  perform set_config('gps.cipo_sync', 'off', true);
  return null;
end;
$$;

create trigger cipo_checks_sync after update of checked on public.cipo_checks
  for each row execute function public.sync_cipo_complete();

-- ---------------------------------------------------------------------------
-- Details & Notes (D&N) log
-- ---------------------------------------------------------------------------

create table public.dn_entries (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  entry_type public.dn_type not null default 'note',
  body text not null check (length(trim(body)) > 0),
  occurred_at timestamptz not null default now(),
  author_id uuid references public.staff (id) default auth.uid(),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dn_entries_case_idx on public.dn_entries (case_id, occurred_at desc);

create trigger dn_entries_updated_at before update on public.dn_entries
  for each row execute function public.set_updated_at();

-- Stage changes are written into the D&N automatically.
create function public.log_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.dn_entries (case_id, entry_type, body, author_id)
  values (
    new.id,
    'event',
    'Stage changed: ' || public.stage_label(old.stage) || ' → ' || public.stage_label(new.stage),
    auth.uid()
  );
  return null;
end;
$$;

create function public.stage_label(s public.case_stage)
returns text
language sql
immutable
set search_path = ''
as $$
  select case s
    when 'new_enquiry' then 'New enquiry'
    when 'cipo_intake' then 'CIPO / Intake'
    when 'documents_outstanding' then 'Documents outstanding'
    when 'application_preparation' then 'Application preparation'
    when 'submitted' then 'Submitted / Awaiting decision'
    when 'approved' then 'Approved / Completed'
    when 'closed' then 'Documents returned / Case closed'
  end;
$$;

create trigger cases_log_stage_change after update of stage on public.cases
  for each row when (old.stage is distinct from new.stage)
  execute function public.log_stage_change();

-- ---------------------------------------------------------------------------
-- Shipments (courier tracking)
-- ---------------------------------------------------------------------------

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  carrier text not null,
  tracking_number text,
  direction public.shipment_direction not null,
  status public.shipment_status not null default 'pending',
  sent_on date,
  delivered_on date,
  notes text,
  created_by uuid references public.staff (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipments_case_idx on public.shipments (case_id);

create trigger shipments_updated_at before update on public.shipments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Documents and file versions
-- ---------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  person_id uuid references public.case_people (id) on delete set null,
  checklist_item_id uuid references public.service_checklist_items (id) on delete set null,
  name text not null,
  category text not null default 'other',
  is_original boolean not null default false,
  received_on date,
  expires_on date,
  returned_to_client boolean not null default false,
  returned_on date,
  return_shipment_id uuid references public.shipments (id) on delete set null,
  notes text,
  created_by uuid references public.staff (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_case_idx on public.documents (case_id);
create index documents_name_trgm on public.documents using gin (name extensions.gin_trgm_ops);
create index documents_expiry_idx on public.documents (expires_on) where expires_on is not null;

create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  version integer not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.staff (id) default auth.uid(),
  uploaded_at timestamptz not null default now(),
  constraint document_versions_unique unique (document_id, version)
);

create index document_versions_document_idx on public.document_versions (document_id, version desc);

-- Number versions automatically and copy case_id from the document.
create function public.prepare_document_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select d.case_id into new.case_id from public.documents d where d.id = new.document_id;
  select coalesce(max(v.version), 0) + 1 into new.version
    from public.document_versions v where v.document_id = new.document_id;
  return new;
end;
$$;

create trigger document_versions_prepare before insert on public.document_versions
  for each row execute function public.prepare_document_version();

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases (id) on delete cascade,
  title text not null,
  details text,
  task_type public.task_type not null default 'general',
  assigned_to uuid references public.staff (id),
  due_date date,
  due_time time,
  done boolean not null default false,
  done_at timestamptz,
  done_by uuid references public.staff (id),
  created_by uuid references public.staff (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_assigned_open_idx on public.tasks (assigned_to, due_date) where not done;
create index tasks_case_idx on public.tasks (case_id);

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create function public.stamp_task_done()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.done and (tg_op = 'INSERT' or not old.done) then
    new.done_at := now();
    new.done_by := auth.uid();
  elsif not new.done then
    new.done_at := null;
    new.done_by := null;
  end if;
  return new;
end;
$$;

create trigger tasks_stamp_done before insert or update of done on public.tasks
  for each row execute function public.stamp_task_done();

-- ---------------------------------------------------------------------------
-- Finance
-- ---------------------------------------------------------------------------

create table public.finance_lines (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  line_type public.finance_type not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'GBP',
  line_date date not null default current_date,
  description text,
  payment_method text,
  created_by uuid references public.staff (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index finance_lines_case_idx on public.finance_lines (case_id);
create index finance_lines_date_idx on public.finance_lines (line_date);

create trigger finance_lines_updated_at before update on public.finance_lines
  for each row execute function public.set_updated_at();

-- Charges  = invoices + government fees + solicitor fees + courier charges
-- Paid     = deposits + payments − refunds
-- Balance  = charges − paid (positive means the client owes GPS)
-- Quotations are recorded for reference and do not affect the balance.
create view public.case_balances
with (security_invoker = true)
as
select
  c.id as case_id,
  coalesce(sum(f.amount) filter (where f.line_type = 'quotation'), 0) as quoted,
  coalesce(sum(f.amount) filter (where f.line_type in ('invoice', 'government_fee', 'solicitor_fee', 'courier_charge')), 0) as charged,
  coalesce(sum(f.amount) filter (where f.line_type in ('deposit', 'payment')), 0)
    - coalesce(sum(f.amount) filter (where f.line_type = 'refund'), 0) as paid,
  coalesce(sum(f.amount) filter (where f.line_type in ('invoice', 'government_fee', 'solicitor_fee', 'courier_charge')), 0)
    - coalesce(sum(f.amount) filter (where f.line_type in ('deposit', 'payment')), 0)
    + coalesce(sum(f.amount) filter (where f.line_type = 'refund'), 0) as balance
from public.cases c
left join public.finance_lines f on f.case_id = c.id
group by c.id;

-- ---------------------------------------------------------------------------
-- Last activity: any change on a case's records counts as activity
-- ---------------------------------------------------------------------------

create function public.touch_case_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.case_id is not null then
    update public.cases set last_activity_at = now() where id = new.case_id;
  end if;
  return null;
end;
$$;

create trigger dn_entries_touch after insert or update on public.dn_entries
  for each row execute function public.touch_case_activity();
create trigger documents_touch after insert or update on public.documents
  for each row execute function public.touch_case_activity();
create trigger document_versions_touch after insert on public.document_versions
  for each row execute function public.touch_case_activity();
create trigger tasks_touch after insert or update on public.tasks
  for each row execute function public.touch_case_activity();
create trigger finance_lines_touch after insert or update on public.finance_lines
  for each row execute function public.touch_case_activity();
create trigger shipments_touch after insert or update on public.shipments
  for each row execute function public.touch_case_activity();
create trigger cipo_checks_touch after update on public.cipo_checks
  for each row execute function public.touch_case_activity();
create trigger case_people_touch after insert or update on public.case_people
  for each row execute function public.touch_case_activity();

-- Direct edits to the case itself also count.
create function public.touch_own_activity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.last_activity_at := now();
  return new;
end;
$$;

create trigger cases_touch_own before update on public.cases
  for each row
  when (old.last_activity_at is not distinct from new.last_activity_at)
  execute function public.touch_own_activity();
