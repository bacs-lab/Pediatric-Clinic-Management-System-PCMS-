drop policy if exists "authorized users can read guardian profiles" on public.guardian_profiles;

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
    from public.profiles guardian_profile
    join public.staff_memberships sm on sm.clinic_id = guardian_profile.clinic_id
    join public.profiles staff_profile on staff_profile.id = sm.profile_id
    where guardian_profile.id = guardian_profiles.profile_id
      and staff_profile.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('doctor', 'secretary', 'staff')
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

create policy "guardians can insert own guardian profile"
on public.guardian_profiles for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = guardian_profiles.profile_id
      and p.user_id = (select auth.uid())
      and guardian_profiles.status = 'active'
  )
);
