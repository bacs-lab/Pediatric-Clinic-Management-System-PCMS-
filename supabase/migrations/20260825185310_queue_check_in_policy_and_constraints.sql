create policy "active staff can insert clinic queue"
on public.queue_entries for insert
to authenticated
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

create unique index if not exists queue_entries_appointment_once_idx
on public.queue_entries(appointment_id)
where appointment_id is not null;

create unique index if not exists queue_entries_active_patient_day_idx
on public.queue_entries(clinic_id, service_date, patient_id)
where state in ('waiting', 'assessing', 'consulting', 'billing');
