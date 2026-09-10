do $$
declare
  application_table text;
begin
  foreach application_table in array array[
    'appointments',
    'assessments',
    'audit_events',
    'billing_adjustments',
    'billing_records',
    'clinical_addenda',
    'clinical_attachments',
    'clinics',
    'demographic_change_requests',
    'encounters',
    'guardian_profiles',
    'inventory_items',
    'inventory_movements',
    'patient_guardians',
    'patients',
    'profiles',
    'queue_entries',
    'staff_memberships',
    'vaccination_records'
  ]
  loop
    execute format(
      'drop policy if exists "require aal2 for authenticated access" on public.%I',
      application_table
    );

    execute format(
      'create policy "require aal2 for authenticated access" on public.%I as restrictive for all to authenticated using (((select auth.jwt())->>''aal'') = ''aal2'') with check (((select auth.jwt())->>''aal'') = ''aal2'')',
      application_table
    );
  end loop;
end
$$;
