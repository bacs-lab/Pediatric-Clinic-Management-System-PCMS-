drop policy if exists "guardians can read own guardian profile" on public.guardian_profiles;
drop policy if exists "active staff can read clinic guardian profiles" on public.guardian_profiles;

create policy "authorized users can read guardian profiles"
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
  or exists (
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
