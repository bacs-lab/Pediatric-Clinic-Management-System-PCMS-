revoke all on function public.admin_set_profile_status(uuid, public.lifecycle_status, text) from public;
revoke all on function public.admin_set_staff_membership_status(uuid, public.lifecycle_status, text) from public;
revoke all on function public.admin_grant_staff_role(uuid, public.staff_role, text) from public;
revoke all on function public.admin_set_profile_status(uuid, public.lifecycle_status, text) from anon;
revoke all on function public.admin_set_staff_membership_status(uuid, public.lifecycle_status, text) from anon;
revoke all on function public.admin_grant_staff_role(uuid, public.staff_role, text) from anon;
revoke all on function public.admin_set_profile_status(uuid, public.lifecycle_status, text) from authenticated;
revoke all on function public.admin_set_staff_membership_status(uuid, public.lifecycle_status, text) from authenticated;
revoke all on function public.admin_grant_staff_role(uuid, public.staff_role, text) from authenticated;

drop function if exists public.admin_set_profile_status(uuid, public.lifecycle_status, text);
drop function if exists public.admin_set_staff_membership_status(uuid, public.lifecycle_status, text);
drop function if exists public.admin_grant_staff_role(uuid, public.staff_role, text);

drop policy if exists "profiles can read own profile" on public.profiles;
drop policy if exists "active admins can read clinic profiles" on public.profiles;
drop policy if exists "profiles can read own staff memberships" on public.staff_memberships;
drop policy if exists "active admins can read clinic staff memberships" on public.staff_memberships;

create policy "authorized users can read profiles"
on public.profiles for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (
    clinic_id is not null
    and private.is_clinic_admin(clinic_id)
  )
);

create policy "authorized users can read staff memberships"
on public.staff_memberships for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = staff_memberships.profile_id
      and p.user_id = (select auth.uid())
  )
  or private.is_clinic_admin(clinic_id)
);
