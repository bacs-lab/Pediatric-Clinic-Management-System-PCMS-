create extension if not exists btree_gist with schema extensions;

create type public.staff_role as enum ('doctor', 'secretary', 'staff', 'admin');
create type public.lifecycle_status as enum ('active', 'inactive', 'void');
create type public.appointment_status as enum ('requested', 'approved', 'checked_in', 'completed', 'cancelled', 'no_show');
create type public.encounter_status as enum ('draft', 'final', 'void');
create type public.audit_result as enum ('success', 'failure', 'denied');

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  clinic_id uuid references public.clinics(id) on delete restrict,
  display_name text not null,
  account_status public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_memberships (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role public.staff_role not null,
  status public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (clinic_id, profile_id, role)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  legal_name text not null,
  birth_date date not null,
  sex text not null check (sex in ('female', 'male', 'intersex', 'not_specified')),
  status public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guardian_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  contact_number text,
  status public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.patient_guardians (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  guardian_profile_id uuid not null references public.guardian_profiles(id) on delete restrict,
  relationship text not null,
  authorization_status text not null check (authorization_status in ('pending', 'approved', 'rejected', 'revoked')),
  created_at timestamptz not null default now(),
  unique (patient_id, guardian_profile_id)
);

create table public.demographic_change_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  requester_profile_id uuid not null references public.profiles(id) on delete restrict,
  requested_changes jsonb not null,
  status text not null check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewer_profile_id uuid references public.profiles(id) on delete restrict,
  review_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  provider_profile_id uuid references public.profiles(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'requested',
  reason text,
  created_by_profile_id uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.appointments
  add constraint appointments_provider_no_overlap
  exclude using gist (
    provider_profile_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (provider_profile_id is not null and status in ('requested', 'approved', 'checked_in'));

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  service_date date not null,
  queue_number integer not null check (queue_number > 0),
  patient_id uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete restrict,
  state text not null check (state in ('waiting', 'assessing', 'consulting', 'billing', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (clinic_id, service_date, queue_number)
);

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  status public.encounter_status not null default 'draft',
  diagnosis text,
  notes text,
  finalized_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status <> 'final') or finalized_at is not null),
  check ((status <> 'void') or void_reason is not null)
);

create table public.clinical_addenda (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete restrict,
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  name text not null,
  unit text not null,
  reorder_level numeric(12, 3) not null default 0 check (reorder_level >= 0),
  status public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity_delta numeric(12, 3) not null check (quantity_delta <> 0),
  reason text not null,
  related_resource_type text,
  related_resource_id uuid,
  actor_profile_id uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.billing_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  status text not null check (status in ('draft', 'issued', 'paid', 'void')),
  total_minor integer not null default 0 check (total_minor >= 0),
  currency text not null default 'PHP',
  created_at timestamptz not null default now()
);

create table public.clinical_attachments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  storage_bucket text not null,
  storage_object_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_by_profile_id uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_object_path)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  clinic_id uuid references public.clinics(id) on delete restrict,
  actor_profile_id uuid references public.profiles(id) on delete restrict,
  effective_role text,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  result public.audit_result not null,
  reason text,
  correlation_id uuid,
  safe_metadata jsonb not null default '{}'::jsonb
);

create index profiles_clinic_id_idx on public.profiles(clinic_id);
create index staff_memberships_profile_role_idx on public.staff_memberships(profile_id, role, status);
create index patients_clinic_id_idx on public.patients(clinic_id);
create index patient_guardians_patient_idx on public.patient_guardians(patient_id, authorization_status);
create index appointments_clinic_starts_idx on public.appointments(clinic_id, starts_at);
create index queue_entries_clinic_date_idx on public.queue_entries(clinic_id, service_date);
create index encounters_patient_idx on public.encounters(patient_id, status);
create index audit_events_clinic_idx on public.audit_events(clinic_id, occurred_at);
create index audit_events_resource_idx on public.audit_events(resource_type, resource_id, occurred_at);

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_memberships enable row level security;
alter table public.patients enable row level security;
alter table public.guardian_profiles enable row level security;
alter table public.patient_guardians enable row level security;
alter table public.demographic_change_requests enable row level security;
alter table public.appointments enable row level security;
alter table public.queue_entries enable row level security;
alter table public.encounters enable row level security;
alter table public.clinical_addenda enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.billing_records enable row level security;
alter table public.clinical_attachments enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "profiles can update own non-authorization fields"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "profiles can read own staff memberships"
on public.staff_memberships for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = staff_memberships.profile_id
      and p.user_id = (select auth.uid())
  )
);

create policy "guardians can read approved linked children"
on public.patients for select
to authenticated
using (
  exists (
    select 1
    from public.patient_guardians pg
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where pg.patient_id = patients.id
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

create policy "active staff can read clinic patients"
on public.patients for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = patients.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active staff can insert clinic patients"
on public.patients for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = patients.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active staff can update clinic patients"
on public.patients for update
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = patients.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = patients.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active staff can read clinic appointments"
on public.appointments for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = appointments.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "guardians can read approved linked appointments"
on public.appointments for select
to authenticated
using (
  exists (
    select 1
    from public.patient_guardians pg
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where pg.patient_id = appointments.patient_id
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

create policy "active clinical staff can insert appointments"
on public.appointments for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = appointments.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active staff can update clinic appointments"
on public.appointments for update
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = appointments.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = appointments.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active staff can read clinic queue"
on public.queue_entries for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = queue_entries.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active staff can update clinic queue"
on public.queue_entries for update
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = queue_entries.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = queue_entries.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active clinical staff can read clinic encounters"
on public.encounters for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = encounters.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "guardians can read final linked encounters"
on public.encounters for select
to authenticated
using (
  status = 'final'
  and exists (
    select 1
    from public.patient_guardians pg
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where pg.patient_id = encounters.patient_id
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

create policy "active staff can read clinic inventory items"
on public.inventory_items for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = inventory_items.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active staff can insert clinic inventory items"
on public.inventory_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = inventory_items.clinic_id
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
);

create policy "active staff can read clinic inventory movements"
on public.inventory_movements for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = inventory_movements.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active staff can insert clinic inventory movements"
on public.inventory_movements for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = inventory_movements.clinic_id
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
);

create policy "active staff can read clinic billing records"
on public.billing_records for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = billing_records.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "guardians can read approved linked billing records"
on public.billing_records for select
to authenticated
using (
  exists (
    select 1
    from public.patient_guardians pg
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where pg.patient_id = billing_records.patient_id
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

create policy "active staff can update clinic billing records"
on public.billing_records for update
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = billing_records.clinic_id
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = billing_records.clinic_id
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
);

create policy "deny ordinary audit reads"
on public.audit_events for select
to authenticated
using (false);

create policy "active admins can read clinic audit events"
on public.audit_events for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = audit_events.clinic_id
      and sm.status = 'active'
      and sm.role = 'admin'
  )
);
