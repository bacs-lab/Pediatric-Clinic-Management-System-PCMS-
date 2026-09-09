create policy "active users can insert own audit events"
on public.audit_events for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.id = audit_events.actor_profile_id
      and p.account_status = 'active'
      and (
        audit_events.clinic_id is null
        or p.clinic_id = audit_events.clinic_id
      )
  )
);
