create schema if not exists private;

create or replace function private.is_clinic_admin(target_clinic_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.staff_memberships sm on sm.profile_id = p.id
    where p.user_id = (select auth.uid())
      and p.account_status = 'active'
      and sm.status = 'active'
      and sm.role = 'admin'
      and sm.clinic_id = target_clinic_id
  );
$$;

revoke all on function private.is_clinic_admin(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_clinic_admin(uuid) to authenticated;

create policy "active admins can read clinic profiles"
on public.profiles for select
to authenticated
using (
  clinic_id is not null
  and private.is_clinic_admin(clinic_id)
);

create policy "active admins can read clinic staff memberships"
on public.staff_memberships for select
to authenticated
using (private.is_clinic_admin(clinic_id));

create or replace function public.admin_set_profile_status(
  target_profile_id uuid,
  next_status public.lifecycle_status,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_profile_id uuid;
  caller_clinic_id uuid;
  current_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select p.id, p.clinic_id
  into caller_profile_id, caller_clinic_id
  from public.profiles p
  where p.user_id = (select auth.uid())
    and p.account_status = 'active'
  limit 1;

  if caller_profile_id is null or caller_clinic_id is null then
    raise exception 'Active clinic profile required' using errcode = '42501';
  end if;

  if not private.is_clinic_admin(caller_clinic_id) then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  select p.account_status
  into current_status
  from public.profiles p
  where p.id = target_profile_id
    and p.clinic_id = caller_clinic_id;

  if current_status is null then
    raise exception 'Profile not found in clinic' using errcode = '42501';
  end if;

  if target_profile_id = caller_profile_id and next_status <> 'active' then
    raise exception 'Admins cannot deactivate their own active profile' using errcode = '42501';
  end if;

  update public.profiles
  set account_status = next_status::text,
      updated_at = now()
  where id = target_profile_id;

  insert into public.audit_events (
    clinic_id,
    actor_profile_id,
    effective_role,
    action,
    resource_type,
    resource_id,
    result,
    reason,
    safe_metadata
  ) values (
    caller_clinic_id,
    caller_profile_id,
    'admin',
    'admin.profile_status_update',
    'profile',
    target_profile_id,
    'success',
    nullif(trim(change_reason), ''),
    jsonb_build_object('previousStatus', current_status, 'nextStatus', next_status::text)
  );

  return target_profile_id;
end;
$$;

create or replace function public.admin_set_staff_membership_status(
  target_membership_id uuid,
  next_status public.lifecycle_status,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_profile_id uuid;
  caller_clinic_id uuid;
  target_profile_id uuid;
  target_role public.staff_role;
  current_status public.lifecycle_status;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select p.id, p.clinic_id
  into caller_profile_id, caller_clinic_id
  from public.profiles p
  where p.user_id = (select auth.uid())
    and p.account_status = 'active'
  limit 1;

  if caller_profile_id is null or caller_clinic_id is null then
    raise exception 'Active clinic profile required' using errcode = '42501';
  end if;

  if not private.is_clinic_admin(caller_clinic_id) then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  select sm.profile_id, sm.role, sm.status
  into target_profile_id, target_role, current_status
  from public.staff_memberships sm
  where sm.id = target_membership_id
    and sm.clinic_id = caller_clinic_id;

  if target_profile_id is null then
    raise exception 'Membership not found in clinic' using errcode = '42501';
  end if;

  if target_profile_id = caller_profile_id and target_role = 'admin' and next_status <> 'active' then
    raise exception 'Admins cannot deactivate their own active admin membership' using errcode = '42501';
  end if;

  update public.staff_memberships
  set status = next_status
  where id = target_membership_id;

  insert into public.audit_events (
    clinic_id,
    actor_profile_id,
    effective_role,
    action,
    resource_type,
    resource_id,
    result,
    reason,
    safe_metadata
  ) values (
    caller_clinic_id,
    caller_profile_id,
    'admin',
    'admin.staff_membership_status_update',
    'staff_membership',
    target_membership_id,
    'success',
    nullif(trim(change_reason), ''),
    jsonb_build_object('role', target_role::text, 'previousStatus', current_status::text, 'nextStatus', next_status::text)
  );

  return target_membership_id;
end;
$$;

create or replace function public.admin_grant_staff_role(
  target_profile_id uuid,
  target_role public.staff_role,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_profile_id uuid;
  caller_clinic_id uuid;
  membership_id uuid;
  previous_status public.lifecycle_status;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select p.id, p.clinic_id
  into caller_profile_id, caller_clinic_id
  from public.profiles p
  where p.user_id = (select auth.uid())
    and p.account_status = 'active'
  limit 1;

  if caller_profile_id is null or caller_clinic_id is null then
    raise exception 'Active clinic profile required' using errcode = '42501';
  end if;

  if not private.is_clinic_admin(caller_clinic_id) then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = target_profile_id
      and p.clinic_id = caller_clinic_id
  ) then
    raise exception 'Profile not found in clinic' using errcode = '42501';
  end if;

  select sm.id, sm.status
  into membership_id, previous_status
  from public.staff_memberships sm
  where sm.clinic_id = caller_clinic_id
    and sm.profile_id = target_profile_id
    and sm.role = target_role;

  if membership_id is null then
    insert into public.staff_memberships (clinic_id, profile_id, role, status)
    values (caller_clinic_id, target_profile_id, target_role, 'active')
    returning id into membership_id;
  else
    update public.staff_memberships
    set status = 'active'
    where id = membership_id;
  end if;

  insert into public.audit_events (
    clinic_id,
    actor_profile_id,
    effective_role,
    action,
    resource_type,
    resource_id,
    result,
    reason,
    safe_metadata
  ) values (
    caller_clinic_id,
    caller_profile_id,
    'admin',
    'admin.staff_role_grant',
    'staff_membership',
    membership_id,
    'success',
    nullif(trim(change_reason), ''),
    jsonb_build_object('profileId', target_profile_id, 'role', target_role::text, 'previousStatus', coalesce(previous_status::text, 'none'), 'nextStatus', 'active')
  );

  return membership_id;
end;
$$;

revoke all on function public.admin_set_profile_status(uuid, public.lifecycle_status, text) from public;
revoke all on function public.admin_set_staff_membership_status(uuid, public.lifecycle_status, text) from public;
revoke all on function public.admin_grant_staff_role(uuid, public.staff_role, text) from public;
grant execute on function public.admin_set_profile_status(uuid, public.lifecycle_status, text) to authenticated;
grant execute on function public.admin_set_staff_membership_status(uuid, public.lifecycle_status, text) to authenticated;
grant execute on function public.admin_grant_staff_role(uuid, public.staff_role, text) to authenticated;
