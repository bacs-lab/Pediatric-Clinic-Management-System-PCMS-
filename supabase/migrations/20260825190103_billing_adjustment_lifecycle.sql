create table public.billing_adjustments (
  id uuid primary key default gen_random_uuid(),
  billing_record_id uuid not null references public.billing_records(id) on delete restrict,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  adjustment_type text not null check (adjustment_type in ('correction', 'void')),
  previous_status text not null check (previous_status in ('draft', 'issued', 'paid', 'void')),
  new_status text not null check (new_status in ('draft', 'issued', 'paid', 'void')),
  previous_total_minor integer not null check (previous_total_minor >= 0),
  new_total_minor integer not null check (new_total_minor >= 0),
  reason text not null check (char_length(trim(reason)) >= 5),
  created_at timestamptz not null default now(),
  check (
    (adjustment_type = 'void' and new_status = 'void')
    or (adjustment_type = 'correction' and new_status <> 'void')
  )
);

alter table public.billing_adjustments enable row level security;

create index billing_adjustments_billing_record_id_idx on public.billing_adjustments(billing_record_id);
create index billing_adjustments_clinic_id_idx on public.billing_adjustments(clinic_id);
create index billing_adjustments_actor_profile_id_idx on public.billing_adjustments(actor_profile_id);

create policy "authorized users can read billing adjustments"
on public.billing_adjustments for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = billing_adjustments.clinic_id
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
  or exists (
    select 1
    from public.billing_records br
    join public.patient_guardians pg on pg.patient_id = br.patient_id
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where br.id = billing_adjustments.billing_record_id
      and p.user_id = (select auth.uid())
      and pg.authorization_status = 'approved'
      and gp.status = 'active'
  )
);

create policy "active staff can insert billing adjustments"
on public.billing_adjustments for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and p.id = billing_adjustments.actor_profile_id
      and sm.clinic_id = billing_adjustments.clinic_id
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
  and exists (
    select 1
    from public.billing_records br
    where br.id = billing_adjustments.billing_record_id
      and br.clinic_id = billing_adjustments.clinic_id
  )
);
