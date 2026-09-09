create policy "active clinical staff can insert draft encounters"
on public.encounters for insert
to authenticated
with check (
  status = 'draft'
  and finalized_at is null
  and voided_at is null
  and void_reason is null
  and exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and p.id = encounters.author_profile_id
      and sm.clinic_id = encounters.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff')
  )
);

create policy "active clinical staff can finalize draft encounters"
on public.encounters for update
to authenticated
using (
  status = 'draft'
  and exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and p.id = encounters.author_profile_id
      and sm.clinic_id = encounters.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff')
  )
)
with check (
  status = 'final'
  and diagnosis is not null
  and finalized_at is not null
  and voided_at is null
  and void_reason is null
);
