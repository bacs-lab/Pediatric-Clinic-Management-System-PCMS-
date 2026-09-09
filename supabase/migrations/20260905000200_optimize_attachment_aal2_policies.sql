alter policy "aal2 authorized users can read clinical attachments"
on public.clinical_attachments
using (
  (select auth.jwt())->>'aal' = 'aal2'
  and (
    exists (
      select 1
      from public.staff_memberships sm
      join public.profiles p on p.id = sm.profile_id
      where p.user_id = (select auth.uid())
        and p.account_status = 'active'
        and sm.clinic_id = clinical_attachments.clinic_id
        and sm.status = 'active'
        and sm.role in ('doctor', 'secretary', 'staff', 'admin')
    )
    or exists (
      select 1
      from public.patient_guardians pg
      join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
      join public.profiles p on p.id = gp.profile_id
      where pg.patient_id = clinical_attachments.patient_id
        and pg.authorization_status = 'approved'
        and gp.status = 'active'
        and p.account_status = 'active'
        and p.user_id = (select auth.uid())
    )
  )
);

alter policy "aal2 clinical staff can insert clinical attachments"
on public.clinical_attachments
with check (
  (select auth.jwt())->>'aal' = 'aal2'
  and exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    join public.patients patient
      on patient.id = clinical_attachments.patient_id
     and patient.clinic_id = sm.clinic_id
    where p.user_id = (select auth.uid())
      and p.id = clinical_attachments.created_by_profile_id
      and p.account_status = 'active'
      and sm.clinic_id = clinical_attachments.clinic_id
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff')
      and patient.status = 'active'
  )
);

alter policy "aal2 clinical staff can upload clinical objects"
on storage.objects
with check (
  bucket_id = 'clinical-attachments'
  and (select auth.jwt())->>'aal' = 'aal2'
  and exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    join public.patients patient on patient.clinic_id = sm.clinic_id
    where p.user_id = (select auth.uid())
      and p.account_status = 'active'
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff')
      and sm.clinic_id::text = (storage.foldername(name))[1]
      and patient.id::text = (storage.foldername(name))[2]
      and patient.status = 'active'
  )
);

alter policy "aal2 authorized users can download clinical objects"
on storage.objects
using (
  bucket_id = 'clinical-attachments'
  and (select auth.jwt())->>'aal' = 'aal2'
  and exists (
    select 1
    from public.clinical_attachments attachment
    where attachment.storage_bucket = storage.objects.bucket_id
      and attachment.storage_object_path = storage.objects.name
      and (
        exists (
          select 1
          from public.staff_memberships sm
          join public.profiles p on p.id = sm.profile_id
          where p.user_id = (select auth.uid())
            and p.account_status = 'active'
            and sm.clinic_id = attachment.clinic_id
            and sm.status = 'active'
            and sm.role in ('doctor', 'secretary', 'staff', 'admin')
        )
        or exists (
          select 1
          from public.patient_guardians pg
          join public.guardian_profiles gp on gp.id = pg.guardian_profile_id
          join public.profiles p on p.id = gp.profile_id
          where pg.patient_id = attachment.patient_id
            and pg.authorization_status = 'approved'
            and gp.status = 'active'
            and p.account_status = 'active'
            and p.user_id = (select auth.uid())
        )
      )
  )
);

alter policy "aal2 clinical staff can remove orphan clinical objects"
on storage.objects
using (
  bucket_id = 'clinical-attachments'
  and (select auth.jwt())->>'aal' = 'aal2'
  and not exists (
    select 1
    from public.clinical_attachments attachment
    where attachment.storage_bucket = storage.objects.bucket_id
      and attachment.storage_object_path = storage.objects.name
  )
  and exists (
    select 1
    from public.staff_memberships sm
    join public.profiles p on p.id = sm.profile_id
    where p.user_id = (select auth.uid())
      and p.account_status = 'active'
      and sm.status = 'active'
      and sm.role in ('doctor', 'staff')
      and sm.clinic_id::text = (storage.foldername(name))[1]
  )
);
