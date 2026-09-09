drop policy if exists "active clinical staff can read clinic assessments" on public.assessments;
drop policy if exists "guardians can read linked child assessments" on public.assessments;

create policy "authorized users can read assessments"
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
  or (
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
  )
);
