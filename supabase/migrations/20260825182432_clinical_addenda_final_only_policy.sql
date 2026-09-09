drop policy if exists "active clinical staff can insert clinical addenda" on public.clinical_addenda;

create policy "active clinical staff can insert final encounter addenda"
on public.clinical_addenda for insert
to authenticated
with check (
  exists (
    select 1
    from public.encounters encounter
    join public.staff_memberships sm on sm.clinic_id = encounter.clinic_id
    join public.profiles p on p.id = sm.profile_id
    where encounter.id = clinical_addenda.encounter_id
      and encounter.status = 'final'
      and p.id = clinical_addenda.author_profile_id
      and p.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff')
  )
);
