-- Consolidate duplicate read policies flagged by Supabase advisors.
drop policy if exists "guardians can read approved linked children" on public.patients;
drop policy if exists "active staff can read clinic patients" on public.patients;

create policy "authorized users can read patients"
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
  or exists (
    select 1
    from public.patient_guardians pg
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where pg.patient_id = patients.id
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "active staff can read clinic appointments" on public.appointments;
drop policy if exists "guardians can read approved linked appointments" on public.appointments;

create policy "authorized users can read appointments"
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
  or exists (
    select 1
    from public.patient_guardians pg
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where pg.patient_id = appointments.patient_id
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "active clinical staff can read clinic encounters" on public.encounters;
drop policy if exists "guardians can read final linked encounters" on public.encounters;

create policy "authorized users can read encounters"
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
  or (
    encounters.status = 'final'
    and exists (
      select 1
      from public.patient_guardians pg
      join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
      join public.profiles p on p.id = gp.profile_id
      where pg.patient_id = encounters.patient_id
        and pg.authorization_status = 'approved'
        and p.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "active staff can read clinic billing records" on public.billing_records;
drop policy if exists "guardians can read approved linked billing records" on public.billing_records;

create policy "authorized users can read billing records"
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
  or exists (
    select 1
    from public.patient_guardians pg
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where pg.patient_id = billing_records.patient_id
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "deny ordinary audit reads" on public.audit_events;

create policy "authorized users can read clinics"
on public.clinics for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.clinic_id = clinics.id
      and p.account_status = 'active'
  )
  or exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = clinics.id
      and sm.status = 'active'
  )
  or exists (
    select 1
    from public.patient_guardians pg
    join public.patients patient on patient.id = pg.patient_id
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where patient.clinic_id = clinics.id
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

create policy "guardians can read own guardian profile"
on public.guardian_profiles for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = guardian_profiles.profile_id
      and p.user_id = (select auth.uid())
      and guardian_profiles.status = 'active'
  )
);

create policy "guardians can update own guardian profile"
on public.guardian_profiles for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = guardian_profiles.profile_id
      and p.user_id = (select auth.uid())
      and guardian_profiles.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = guardian_profiles.profile_id
      and p.user_id = (select auth.uid())
  )
);

create policy "active staff can read clinic guardian profiles"
on public.guardian_profiles for select
to authenticated
using (
  exists (
    select 1
    from public.patient_guardians pg
    join public.patients patient on patient.id = pg.patient_id
    join public.staff_memberships sm on sm.clinic_id = patient.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where pg.guardian_profile_id = guardian_profiles.id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "authorized users can read patient guardians"
on public.patient_guardians for select
to authenticated
using (
  exists (
    select 1
    from public.guardian_profiles gp
    join public.profiles p on p.id = gp.profile_id
    where gp.id = patient_guardians.guardian_profile_id
      and p.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.patients patient
    join public.staff_memberships sm on sm.clinic_id = patient.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where patient.id = patient_guardians.patient_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "active staff can insert patient guardians"
on public.patient_guardians for insert
to authenticated
with check (
  exists (
    select 1
    from public.patients patient
    join public.staff_memberships sm on sm.clinic_id = patient.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where patient.id = patient_guardians.patient_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
);

create policy "active staff can update patient guardians"
on public.patient_guardians for update
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    join public.staff_memberships sm on sm.clinic_id = patient.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where patient.id = patient_guardians.patient_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.patients patient
    join public.staff_memberships sm on sm.clinic_id = patient.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where patient.id = patient_guardians.patient_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
);

create policy "authorized users can read demographic change requests"
on public.demographic_change_requests for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = demographic_change_requests.requester_profile_id
      and p.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.patients patient
    join public.staff_memberships sm on sm.clinic_id = patient.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where patient.id = demographic_change_requests.patient_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
);

create policy "authorized users can insert demographic change requests"
on public.demographic_change_requests for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = demographic_change_requests.requester_profile_id
      and p.user_id = (select auth.uid())
  )
);

create policy "active staff can update demographic change requests"
on public.demographic_change_requests for update
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    join public.staff_memberships sm on sm.clinic_id = patient.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where patient.id = demographic_change_requests.patient_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.patients patient
    join public.staff_memberships sm on sm.clinic_id = patient.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where patient.id = demographic_change_requests.patient_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
);

create policy "authorized users can read clinical addenda"
on public.clinical_addenda for select
to authenticated
using (
  exists (
    select 1
    from public.encounters encounter
    join public.staff_memberships sm on sm.clinic_id = encounter.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where encounter.id = clinical_addenda.encounter_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
  or exists (
    select 1
    from public.encounters encounter
    join public.patient_guardians pg on pg.patient_id = encounter.patient_id
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where encounter.id = clinical_addenda.encounter_id
      and encounter.status = 'final'
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

create policy "active clinical staff can insert clinical addenda"
on public.clinical_addenda for insert
to authenticated
with check (
  exists (
    select 1
    from public.encounters encounter
    join public.staff_memberships sm on sm.clinic_id = encounter.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where encounter.id = clinical_addenda.encounter_id
      and p.id = clinical_addenda.author_profile_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff')
  )
);

create policy "authorized users can read clinical attachments"
on public.clinical_attachments for select
to authenticated
using (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = clinical_attachments.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
  )
  or exists (
    select 1
    from public.patient_guardians pg
    join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
    join public.profiles p on p.id = gp.profile_id
    where pg.patient_id = clinical_attachments.patient_id
      and pg.authorization_status = 'approved'
      and p.user_id = (select auth.uid())
  )
);

create policy "active staff can insert clinical attachments"
on public.clinical_attachments for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and p.id = clinical_attachments.created_by_profile_id
      and sm.clinic_id = clinical_attachments.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff')
  )
);

-- Cover foreign keys called out by Supabase performance advisors.
create index if not exists appointments_patient_id_idx on public.appointments(patient_id);
create index if not exists appointments_created_by_profile_id_idx on public.appointments(created_by_profile_id);
create index if not exists audit_events_actor_profile_id_idx on public.audit_events(actor_profile_id);
create index if not exists billing_records_clinic_id_idx on public.billing_records(clinic_id);
create index if not exists billing_records_patient_id_idx on public.billing_records(patient_id);
create index if not exists clinical_addenda_author_profile_id_idx on public.clinical_addenda(author_profile_id);
create index if not exists clinical_addenda_encounter_id_idx on public.clinical_addenda(encounter_id);
create index if not exists clinical_attachments_clinic_id_idx on public.clinical_attachments(clinic_id);
create index if not exists clinical_attachments_created_by_profile_id_idx on public.clinical_attachments(created_by_profile_id);
create index if not exists clinical_attachments_patient_id_idx on public.clinical_attachments(patient_id);
create index if not exists demographic_change_requests_patient_id_idx on public.demographic_change_requests(patient_id);
create index if not exists demographic_change_requests_requester_profile_id_idx on public.demographic_change_requests(requester_profile_id);
create index if not exists demographic_change_requests_reviewer_profile_id_idx on public.demographic_change_requests(reviewer_profile_id);
create index if not exists encounters_author_profile_id_idx on public.encounters(author_profile_id);
create index if not exists encounters_clinic_id_idx on public.encounters(clinic_id);
create index if not exists inventory_items_clinic_id_idx on public.inventory_items(clinic_id);
create index if not exists inventory_movements_actor_profile_id_idx on public.inventory_movements(actor_profile_id);
create index if not exists inventory_movements_clinic_id_idx on public.inventory_movements(clinic_id);
create index if not exists inventory_movements_item_id_idx on public.inventory_movements(item_id);
create index if not exists patient_guardians_guardian_profile_id_idx on public.patient_guardians(guardian_profile_id);
create index if not exists queue_entries_appointment_id_idx on public.queue_entries(appointment_id);
create index if not exists queue_entries_patient_id_idx on public.queue_entries(patient_id);
