create type public.assessment_handoff_status as enum ('draft', 'ready_for_consult', 'in_consult', 'completed', 'void');

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete restrict,
  queue_entry_id uuid references public.queue_entries(id) on delete set null,
  assessed_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  temperature_c numeric(4,1) check (temperature_c is null or (temperature_c between 30.0 and 45.0)),
  weight_kg numeric(6,2) check (weight_kg is null or (weight_kg > 0 and weight_kg <= 300)),
  height_cm numeric(6,2) check (height_cm is null or (height_cm > 0 and height_cm <= 250)),
  heart_rate_bpm integer check (heart_rate_bpm is null or (heart_rate_bpm between 20 and 250)),
  respiratory_rate_bpm integer check (respiratory_rate_bpm is null or (respiratory_rate_bpm between 5 and 80)),
  oxygen_saturation_pct integer check (oxygen_saturation_pct is null or (oxygen_saturation_pct between 50 and 100)),
  blood_pressure_systolic integer check (blood_pressure_systolic is null or (blood_pressure_systolic between 40 and 250)),
  blood_pressure_diastolic integer check (blood_pressure_diastolic is null or (blood_pressure_diastolic between 20 and 150)),
  chief_complaint text not null check (char_length(chief_complaint) between 3 and 1000),
  notes text check (notes is null or char_length(notes) <= 2000),
  handoff_status public.assessment_handoff_status not null default 'ready_for_consult',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessments_blood_pressure_pair_check check (
    (blood_pressure_systolic is null and blood_pressure_diastolic is null)
    or (blood_pressure_systolic is not null and blood_pressure_diastolic is not null)
  )
);

alter table public.assessments enable row level security;

create index assessments_clinic_id_idx on public.assessments(clinic_id);
create index assessments_patient_id_idx on public.assessments(patient_id);
create index assessments_queue_entry_id_idx on public.assessments(queue_entry_id);
create index assessments_assessed_by_profile_id_idx on public.assessments(assessed_by_profile_id);
create index assessments_handoff_status_idx on public.assessments(handoff_status);
create index assessments_created_at_idx on public.assessments(created_at desc);

create policy "active clinical staff can read clinic assessments"
on public.assessments for select
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
      and sm.clinic_id = assessments.clinic_id
  )
);

create policy "guardians can read linked child assessments"
on public.assessments for select
to authenticated
using (
  handoff_status <> 'void'
  and exists (
    select 1
    from public.profiles p
    join public.guardian_profiles gp on gp.profile_id = p.id
    join public.patient_guardians pg on pg.guardian_profile_id = gp.id
    where p.user_id = (select auth.uid())
      and p.account_status = 'active'
      and gp.status = 'active'
      and pg.authorization_status = 'approved'
      and pg.patient_id = assessments.patient_id
  )
);

create policy "active clinical staff can insert assessments"
on public.assessments for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    join public.staff_memberships sm on sm.profile_id = p.id
    where p.user_id = (select auth.uid())
      and p.id = assessments.assessed_by_profile_id
      and p.account_status = 'active'
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff', 'admin')
      and sm.clinic_id = assessments.clinic_id
  )
  and exists (
    select 1
    from public.patients pa
    where pa.id = assessments.patient_id
      and pa.clinic_id = assessments.clinic_id
      and pa.status = 'active'
  )
  and (
    assessments.queue_entry_id is null
    or exists (
      select 1
      from public.queue_entries qe
      where qe.id = assessments.queue_entry_id
        and qe.clinic_id = assessments.clinic_id
        and qe.patient_id = assessments.patient_id
        and qe.state in ('waiting', 'assessing', 'consulting')
    )
  )
);

create policy "active clinical staff can update assessment handoff"
on public.assessments for update
to authenticated
using (
  handoff_status in ('draft', 'ready_for_consult', 'in_consult')
  and exists (
    select 1
    from public.profiles p
    join public.staff_memberships sm on sm.profile_id = p.id
    where p.user_id = (select auth.uid())
      and p.account_status = 'active'
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff', 'admin')
      and sm.clinic_id = assessments.clinic_id
  )
)
with check (
  handoff_status in ('draft', 'ready_for_consult', 'in_consult', 'completed')
  and exists (
    select 1
    from public.profiles p
    join public.staff_memberships sm on sm.profile_id = p.id
    where p.user_id = (select auth.uid())
      and p.account_status = 'active'
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff', 'admin')
      and sm.clinic_id = assessments.clinic_id
  )
);
