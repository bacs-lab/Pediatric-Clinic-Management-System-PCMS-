create policy "active staff can insert clinic billing records"
on public.billing_records for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and sm.clinic_id = billing_records.clinic_id
      and sm.status = 'active'
      and sm.role in ('secretary', 'staff', 'admin')
  )
);
