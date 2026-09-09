create table public.vaccination_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  administered_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  vaccine_name text not null check (char_length(vaccine_name) between 2 and 160),
  dose_label text not null check (char_length(dose_label) between 1 and 80),
  lot_number text check (lot_number is null or char_length(lot_number) <= 120),
  administered_at timestamptz not null default now(),
  route text check (route is null or char_length(route) <= 80),
  site text check (site is null or char_length(site) <= 80),
  next_due_at date check (next_due_at is null or next_due_at >= administered_at::date),
  notes text check (notes is null or char_length(notes) <= 1000),
  status public.lifecycle_status not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.vaccination_records enable row level security;

create index vaccination_records_clinic_id_idx on public.vaccination_records(clinic_id);
create index vaccination_records_patient_id_idx on public.vaccination_records(patient_id);
create index vaccination_records_administered_by_profile_id_idx on public.vaccination_records(administered_by_profile_id);
create index vaccination_records_inventory_item_id_idx on public.vaccination_records(inventory_item_id);
create index vaccination_records_administered_at_idx on public.vaccination_records(administered_at desc);

create policy "authorized users can read vaccination records"
on public.vaccination_records for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    join public.staff_memberships sm on sm.profile_id = p.id
    where p.user_id = (select auth.uid())
      and p.account_status = 'active'
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff', 'admin')
      and sm.clinic_id = vaccination_records.clinic_id
  )
  or (
    status = 'active'
    and exists (
      select 1
      from public.profiles p
      join public.guardian_profiles gp on gp.profile_id = p.id
      join public.patient_guardians pg on pg.guardian_profile_id = gp.id
      where p.user_id = (select auth.uid())
        and p.account_status = 'active'
        and gp.status = 'active'
        and pg.authorization_status = 'approved'
        and pg.patient_id = vaccination_records.patient_id
    )
  )
);

create policy "active clinical staff can insert vaccination records"
on public.vaccination_records for insert
to authenticated
with check (
  status = 'active'
  and exists (
    select 1
    from public.profiles p
    join public.staff_memberships sm on sm.profile_id = p.id
    where p.user_id = (select auth.uid())
      and p.id = vaccination_records.administered_by_profile_id
      and p.account_status = 'active'
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff', 'admin')
      and sm.clinic_id = vaccination_records.clinic_id
  )
  and exists (
    select 1
    from public.patients pa
    where pa.id = vaccination_records.patient_id
      and pa.clinic_id = vaccination_records.clinic_id
      and pa.status = 'active'
  )
  and (
    vaccination_records.inventory_item_id is null
    or exists (
      select 1
      from public.inventory_items ii
      where ii.id = vaccination_records.inventory_item_id
        and ii.clinic_id = vaccination_records.clinic_id
        and ii.status = 'active'
    )
  )
);
