"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminProfileStatusSchema,
  adminStaffMembershipStatusSchema,
  adminStaffRoleGrantSchema,
  appointmentRequestSchema,
  appointmentStatusSchema,
  assessmentHandoffSchema,
  assessmentVitalsSchema,
  billingCorrectionSchema,
  billingRecordSchema,
  billingStatusSchema,
  billingVoidSchema,
  clinicalAddendumSchema,
  clinicalAttachmentUploadSchema,
  encounterDraftSchema,
  encounterFinalizeSchema,
  guardianProfileSchema,
  inventoryItemSchema,
  inventoryMovementSchema,
  patientGuardianLinkSchema,
  patientRegistrationSchema,
  queueCheckInSchema,
  queueStateSchema,
  vaccinationRecordSchema,
} from "@/features/demo/validation";
import {
  buildClinicalAttachmentObjectPath,
  CLINICAL_ATTACHMENT_BUCKET,
  hasAllowedClinicalAttachmentSignature,
  normalizeClinicalAttachmentFilename,
} from "@/lib/clinical-attachments";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.generated";

type StaffContext = {
  clinicId: string;
  profileId: string;
  role: string;
};

type ProfileContext = {
  clinicId: string | null;
  profileId: string;
};

type AdminContext = StaffContext;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type AuditEventInput = {
  action: string;
  clinicId: string | null;
  effectiveRole: string;
  profileId: string;
  reason?: string | null;
  resourceId?: string | null;
  resourceType: string;
  result?: "success" | "failure" | "denied";
  safeMetadata?: Json;
};

function redirectWithStatus(path: string, status: string): never {
  redirect(`${path}?workflow=${status}`);
}

function valueOf(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function optionalNumber(value: number | undefined) {
  return value ?? null;
}

function optionalText(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

async function writeAuditEvent(
  supabase: SupabaseServerClient,
  event: AuditEventInput,
) {
  try {
    await supabase.from("audit_events").insert({
      action: event.action,
      actor_profile_id: event.profileId,
      clinic_id: event.clinicId,
      effective_role: event.effectiveRole,
      reason: event.reason ?? null,
      resource_id: event.resourceId ?? null,
      resource_type: event.resourceType,
      result: event.result ?? "success",
      safe_metadata: event.safeMetadata ?? {},
    });
  } catch {
    // Audit writes are best-effort until a transactional RPC is introduced.
  }
}

function todayInManila() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Manila",
    year: "numeric",
  }).formatToParts(new Date());
  const byType = new Map(parts.map((part) => [part.type, part.value]));

  return `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`;
}

async function requireStaffContext(path: string): Promise<StaffContext> {
  if (!getSupabaseConfig()) {
    redirectWithStatus(path, "supabase-required");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirectWithStatus(path, "auth-required");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, clinic_id")
    .eq("user_id", claimsData.claims.sub)
    .eq("account_status", "active")
    .maybeSingle();

  if (profileError || !profile?.id || !profile.clinic_id) {
    redirectWithStatus(path, "staff-required");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("staff_memberships")
    .select("id, role")
    .eq("profile_id", profile.id)
    .eq("clinic_id", profile.clinic_id)
    .eq("status", "active")
    .in("role", ["doctor", "secretary", "staff", "admin"])
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership?.id) {
    redirectWithStatus(path, "staff-required");
  }

  return {
    clinicId: profile.clinic_id,
    profileId: profile.id,
    role: membership.role,
  };
}

async function requireClinicalStaffContext(
  path: string,
): Promise<StaffContext> {
  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: aalData, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError || aalData.currentLevel !== "aal2") {
    redirectWithStatus(path, "mfa-required");
  }

  if (context.role === "doctor" || context.role === "staff") {
    return context;
  }

  const { data: clinicalMembership, error } = await supabase
    .from("staff_memberships")
    .select("role")
    .eq("profile_id", context.profileId)
    .eq("clinic_id", context.clinicId)
    .eq("status", "active")
    .in("role", ["doctor", "staff"])
    .limit(1)
    .maybeSingle();

  if (error || !clinicalMembership) {
    redirectWithStatus(path, "clinical-staff-required");
  }

  return { ...context, role: clinicalMembership.role };
}

async function requireProfileContext(path: string): Promise<ProfileContext> {
  if (!getSupabaseConfig()) {
    redirectWithStatus(path, "supabase-required");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirectWithStatus(path, "auth-required");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, clinic_id")
    .eq("user_id", claimsData.claims.sub)
    .eq("account_status", "active")
    .maybeSingle();

  if (profileError || !profile?.id) {
    redirectWithStatus(path, "profile-required");
  }

  return { clinicId: profile.clinic_id, profileId: profile.id };
}

async function requireAdminContext(path: string): Promise<AdminContext> {
  const context = await requireStaffContext(path);

  if (context.role === "admin") {
    return context;
  }

  const supabase = await createClient();
  const { data: adminMembership, error } = await supabase
    .from("staff_memberships")
    .select("id")
    .eq("profile_id", context.profileId)
    .eq("clinic_id", context.clinicId)
    .eq("role", "admin")
    .eq("status", "active")
    .maybeSingle();

  if (error || !adminMembership) {
    redirectWithStatus(path, "admin-required");
  }

  return { ...context, role: "admin" };
}

export async function createPatientAction(formData: FormData) {
  const path = "/staff/patients";
  const parsed = patientRegistrationSchema.safeParse({
    legalName: valueOf(formData, "legalName"),
    birthDate: valueOf(formData, "birthDate"),
    sex: valueOf(formData, "sex"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      clinic_id: context.clinicId,
      legal_name: parsed.data.legalName,
      birth_date: parsed.data.birthDate.toISOString().slice(0, 10),
      sex: parsed.data.sex,
    })
    .select("id")
    .single();

  if (error || !patient) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "patient.create",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: patient.id,
    resourceType: "patient",
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function upsertGuardianProfileAction(formData: FormData) {
  const path = "/guardian";
  const parsed = guardianProfileSchema.safeParse({
    contactNumber: valueOf(formData, "contactNumber"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireProfileContext(path);
  const supabase = await createClient();
  const { data: guardianProfile, error } = await supabase
    .from("guardian_profiles")
    .upsert(
      {
        profile_id: context.profileId,
        contact_number: parsed.data.contactNumber,
        status: "active",
      },
      { onConflict: "profile_id" },
    )
    .select("id")
    .single();

  if (error || !guardianProfile) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "guardian_profile.upsert",
    clinicId: context.clinicId,
    effectiveRole: "guardian",
    profileId: context.profileId,
    resourceId: guardianProfile.id,
    resourceType: "guardian_profile",
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function createPatientGuardianLinkAction(formData: FormData) {
  const path = "/staff/patients";
  const parsed = patientGuardianLinkSchema.safeParse({
    patientId: valueOf(formData, "patientId"),
    guardianProfileId: valueOf(formData, "guardianProfileId"),
    relationship: valueOf(formData, "relationship"),
    authorizationStatus: valueOf(formData, "authorizationStatus"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: patientGuardianLink, error } = await supabase
    .from("patient_guardians")
    .upsert(
      {
        patient_id: parsed.data.patientId,
        guardian_profile_id: parsed.data.guardianProfileId,
        relationship: parsed.data.relationship,
        authorization_status: parsed.data.authorizationStatus,
      },
      { onConflict: "patient_id,guardian_profile_id" },
    )
    .select("id")
    .single();

  if (error || !patientGuardianLink) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "patient_guardian.upsert",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: patientGuardianLink.id,
    resourceType: "patient_guardian",
    safeMetadata: {
      authorizationStatus: parsed.data.authorizationStatus,
    },
  });

  revalidatePath(path);
  revalidatePath("/guardian");
  redirectWithStatus(path, "saved");
}

export async function createAppointmentAction(formData: FormData) {
  const path = "/staff/appointments";
  const parsed = appointmentRequestSchema.safeParse({
    patientId: valueOf(formData, "patientId"),
    startsAt: valueOf(formData, "startsAt"),
    endsAt: valueOf(formData, "endsAt"),
    reason: valueOf(formData, "reason"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: context.clinicId,
      patient_id: parsed.data.patientId,
      starts_at: parsed.data.startsAt.toISOString(),
      ends_at: parsed.data.endsAt.toISOString(),
      reason: parsed.data.reason,
      created_by_profile_id: context.profileId,
    })
    .select("id")
    .single();

  if (error || !appointment) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "appointment.create",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: appointment.id,
    resourceType: "appointment",
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const path = "/staff/appointments";
  const parsed = appointmentStatusSchema.safeParse({
    appointmentId: valueOf(formData, "appointmentId"),
    status: valueOf(formData, "status"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.appointmentId);

  if (error) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "appointment.status_update",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: parsed.data.appointmentId,
    resourceType: "appointment",
    safeMetadata: { status: parsed.data.status },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function updateQueueStateAction(formData: FormData) {
  const path = "/staff/queue";
  const parsed = queueStateSchema.safeParse({
    queueEntryId: valueOf(formData, "queueEntryId"),
    state: valueOf(formData, "state"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { error } = await supabase
    .from("queue_entries")
    .update({ state: parsed.data.state })
    .eq("id", parsed.data.queueEntryId);

  if (error) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "queue.state_update",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: parsed.data.queueEntryId,
    resourceType: "queue_entry",
    safeMetadata: { state: parsed.data.state },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function checkInQueueAction(formData: FormData) {
  const path = "/staff/queue";
  const appointmentId = valueOf(formData, "appointmentId");
  const parsed = queueCheckInSchema.safeParse({
    patientId: valueOf(formData, "patientId"),
    appointmentId: appointmentId || undefined,
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const serviceDate = todayInManila();

  if (parsed.data.appointmentId) {
    const { data: appointment, error: appointmentLookupError } = await supabase
      .from("appointments")
      .select("id, clinic_id, patient_id, status")
      .eq("id", parsed.data.appointmentId)
      .maybeSingle();

    if (
      appointmentLookupError ||
      !appointment ||
      appointment.clinic_id !== context.clinicId ||
      appointment.patient_id !== parsed.data.patientId ||
      !["approved", "requested"].includes(appointment.status)
    ) {
      redirectWithStatus(path, "invalid");
    }
  }

  const { data: latestQueue, error: latestQueueError } = await supabase
    .from("queue_entries")
    .select("queue_number")
    .eq("clinic_id", context.clinicId)
    .eq("service_date", serviceDate)
    .order("queue_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestQueueError) {
    redirectWithStatus(path, "write-failed");
  }

  const { data: queueEntry, error: queueError } = await supabase
    .from("queue_entries")
    .insert({
      appointment_id: parsed.data.appointmentId ?? null,
      clinic_id: context.clinicId,
      patient_id: parsed.data.patientId,
      queue_number: (latestQueue?.queue_number ?? 0) + 1,
      service_date: serviceDate,
      state: "waiting",
    })
    .select("id")
    .single();

  if (queueError || !queueEntry) {
    redirectWithStatus(path, "write-failed");
  }

  if (parsed.data.appointmentId) {
    const { error: appointmentError } = await supabase
      .from("appointments")
      .update({ status: "checked_in" })
      .eq("id", parsed.data.appointmentId);

    if (appointmentError) {
      redirectWithStatus(path, "write-failed");
    }

    revalidatePath("/staff/appointments");
  }

  await writeAuditEvent(supabase, {
    action: "queue.check_in",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: queueEntry.id,
    resourceType: "queue_entry",
    safeMetadata: {
      appointmentLinked: Boolean(parsed.data.appointmentId),
      serviceDate,
    },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function createAssessmentAction(formData: FormData) {
  const path = "/staff/clinical";
  const queueEntryId = valueOf(formData, "queueEntryId");
  const parsed = assessmentVitalsSchema.safeParse({
    patientId: valueOf(formData, "patientId"),
    queueEntryId: queueEntryId || undefined,
    temperatureC: valueOf(formData, "temperatureC"),
    weightKg: valueOf(formData, "weightKg"),
    heightCm: valueOf(formData, "heightCm"),
    heartRateBpm: valueOf(formData, "heartRateBpm"),
    respiratoryRateBpm: valueOf(formData, "respiratoryRateBpm"),
    oxygenSaturationPct: valueOf(formData, "oxygenSaturationPct"),
    bloodPressureSystolic: valueOf(formData, "bloodPressureSystolic"),
    bloodPressureDiastolic: valueOf(formData, "bloodPressureDiastolic"),
    chiefComplaint: valueOf(formData, "chiefComplaint"),
    notes: valueOf(formData, "notes") || undefined,
    handoffStatus: valueOf(formData, "handoffStatus") || "ready_for_consult",
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();

  const { data: patient, error: patientLookupError } = await supabase
    .from("patients")
    .select("id, clinic_id, status")
    .eq("id", parsed.data.patientId)
    .maybeSingle();

  if (
    patientLookupError ||
    !patient ||
    patient.clinic_id !== context.clinicId ||
    patient.status !== "active"
  ) {
    redirectWithStatus(path, "invalid");
  }

  if (parsed.data.queueEntryId) {
    const { data: queueEntry, error: queueLookupError } = await supabase
      .from("queue_entries")
      .select("id, clinic_id, patient_id, state")
      .eq("id", parsed.data.queueEntryId)
      .maybeSingle();

    if (
      queueLookupError ||
      !queueEntry ||
      queueEntry.clinic_id !== context.clinicId ||
      queueEntry.patient_id !== parsed.data.patientId ||
      !["waiting", "assessing", "consulting"].includes(queueEntry.state)
    ) {
      redirectWithStatus(path, "invalid");
    }
  }

  const { data: assessment, error } = await supabase
    .from("assessments")
    .insert({
      assessed_by_profile_id: context.profileId,
      blood_pressure_diastolic: optionalNumber(
        parsed.data.bloodPressureDiastolic,
      ),
      blood_pressure_systolic: optionalNumber(
        parsed.data.bloodPressureSystolic,
      ),
      chief_complaint: parsed.data.chiefComplaint,
      clinic_id: context.clinicId,
      handoff_status: parsed.data.handoffStatus,
      heart_rate_bpm: optionalNumber(parsed.data.heartRateBpm),
      height_cm: optionalNumber(parsed.data.heightCm),
      notes: optionalText(parsed.data.notes),
      oxygen_saturation_pct: optionalNumber(parsed.data.oxygenSaturationPct),
      patient_id: parsed.data.patientId,
      queue_entry_id: parsed.data.queueEntryId ?? null,
      respiratory_rate_bpm: optionalNumber(parsed.data.respiratoryRateBpm),
      temperature_c: optionalNumber(parsed.data.temperatureC),
      weight_kg: optionalNumber(parsed.data.weightKg),
    })
    .select("id")
    .single();

  if (error || !assessment) {
    redirectWithStatus(path, "write-failed");
  }

  if (parsed.data.queueEntryId) {
    const nextQueueState =
      parsed.data.handoffStatus === "in_consult" ? "consulting" : "assessing";
    const { error: queueError } = await supabase
      .from("queue_entries")
      .update({ state: nextQueueState })
      .eq("id", parsed.data.queueEntryId);

    if (queueError) {
      redirectWithStatus(path, "write-failed");
    }

    revalidatePath("/staff/queue");
  }

  await writeAuditEvent(supabase, {
    action: "assessment.create",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: assessment.id,
    resourceType: "assessment",
    safeMetadata: { handoffStatus: parsed.data.handoffStatus },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function updateAssessmentHandoffAction(formData: FormData) {
  const path = "/staff/clinical";
  const parsed = assessmentHandoffSchema.safeParse({
    assessmentId: valueOf(formData, "assessmentId"),
    handoffStatus: valueOf(formData, "handoffStatus"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: assessment, error: assessmentLookupError } = await supabase
    .from("assessments")
    .select("id, queue_entry_id")
    .eq("id", parsed.data.assessmentId)
    .maybeSingle();

  if (assessmentLookupError || !assessment) {
    redirectWithStatus(path, "invalid");
  }

  const { error } = await supabase
    .from("assessments")
    .update({
      handoff_status: parsed.data.handoffStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.assessmentId);

  if (error) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "assessment.handoff_update",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: parsed.data.assessmentId,
    resourceType: "assessment",
    safeMetadata: { handoffStatus: parsed.data.handoffStatus },
  });

  if (assessment.queue_entry_id) {
    const queueStateByHandoff = {
      completed: "consulting",
      in_consult: "consulting",
      ready_for_consult: "assessing",
    } as const;
    const { error: queueError } = await supabase
      .from("queue_entries")
      .update({ state: queueStateByHandoff[parsed.data.handoffStatus] })
      .eq("id", assessment.queue_entry_id);

    if (queueError) {
      redirectWithStatus(path, "write-failed");
    }

    revalidatePath("/staff/queue");
  }

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function createEncounterDraftAction(formData: FormData) {
  const path = "/staff/clinical";
  const parsed = encounterDraftSchema.safeParse({
    patientId: valueOf(formData, "patientId"),
    notes: valueOf(formData, "notes"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: encounter, error } = await supabase
    .from("encounters")
    .insert({
      clinic_id: context.clinicId,
      patient_id: parsed.data.patientId,
      author_profile_id: context.profileId,
      status: "draft",
      notes: parsed.data.notes,
    })
    .select("id")
    .single();

  if (error || !encounter) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "encounter.draft_create",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: encounter.id,
    resourceType: "encounter",
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function finalizeEncounterAction(formData: FormData) {
  const path = "/staff/clinical";
  const parsed = encounterFinalizeSchema.safeParse({
    encounterId: valueOf(formData, "encounterId"),
    diagnosis: valueOf(formData, "diagnosis"),
    clinicianAttestation: valueOf(formData, "clinicianAttestation"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { error } = await supabase
    .from("encounters")
    .update({
      diagnosis: parsed.data.diagnosis,
      status: "final",
      finalized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.encounterId)
    .eq("status", "draft");

  if (error) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "encounter.finalize",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: parsed.data.encounterId,
    resourceType: "encounter",
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function createClinicalAddendumAction(formData: FormData) {
  const path = "/staff/clinical";
  const parsed = clinicalAddendumSchema.safeParse({
    encounterId: valueOf(formData, "encounterId"),
    reason: valueOf(formData, "reason"),
    body: valueOf(formData, "body"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: addendum, error } = await supabase
    .from("clinical_addenda")
    .insert({
      encounter_id: parsed.data.encounterId,
      author_profile_id: context.profileId,
      reason: parsed.data.reason,
      body: parsed.data.body,
    })
    .select("id")
    .single();

  if (error || !addendum) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "clinical_addendum.create",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    reason: parsed.data.reason,
    resourceId: addendum.id,
    resourceType: "clinical_addendum",
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function uploadClinicalAttachmentAction(formData: FormData) {
  const path = "/staff/clinical";
  const attachment = formData.get("attachment");

  if (!(attachment instanceof File)) {
    redirectWithStatus(path, "attachment-invalid");
  }

  const originalFilename = normalizeClinicalAttachmentFilename(attachment.name);
  const parsed = clinicalAttachmentUploadSchema.safeParse({
    patientId: valueOf(formData, "patientId"),
    originalFilename,
    mimeType: attachment.type,
    sizeBytes: attachment.size,
  });

  if (!parsed.success) {
    redirectWithStatus(path, "attachment-invalid");
  }

  const signature = new Uint8Array(await attachment.slice(0, 8).arrayBuffer());

  if (!hasAllowedClinicalAttachmentSignature(parsed.data.mimeType, signature)) {
    redirectWithStatus(path, "attachment-invalid");
  }

  const context = await requireClinicalStaffContext(path);
  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, clinic_id, status")
    .eq("id", parsed.data.patientId)
    .maybeSingle();

  if (
    patientError ||
    !patient ||
    patient.clinic_id !== context.clinicId ||
    patient.status !== "active"
  ) {
    redirectWithStatus(path, "attachment-invalid");
  }

  const objectPath = buildClinicalAttachmentObjectPath(
    context.clinicId,
    patient.id,
    randomUUID(),
    parsed.data.mimeType,
  );
  const { error: uploadError } = await supabase.storage
    .from(CLINICAL_ATTACHMENT_BUCKET)
    .upload(objectPath, attachment, {
      cacheControl: "0",
      contentType: parsed.data.mimeType,
      upsert: false,
    });

  if (uploadError) {
    await writeAuditEvent(supabase, {
      action: "clinical_attachment.upload",
      clinicId: context.clinicId,
      effectiveRole: context.role,
      profileId: context.profileId,
      resourceType: "clinical_attachment",
      result: "failure",
      safeMetadata: {
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
      },
    });
    redirectWithStatus(path, "attachment-upload-failed");
  }

  const { data: metadata, error: metadataError } = await supabase
    .from("clinical_attachments")
    .insert({
      clinic_id: context.clinicId,
      created_by_profile_id: context.profileId,
      mime_type: parsed.data.mimeType,
      original_filename: parsed.data.originalFilename,
      patient_id: patient.id,
      size_bytes: parsed.data.sizeBytes,
      storage_bucket: CLINICAL_ATTACHMENT_BUCKET,
      storage_object_path: objectPath,
    })
    .select("id")
    .single();

  if (metadataError || !metadata) {
    await supabase.storage
      .from(CLINICAL_ATTACHMENT_BUCKET)
      .remove([objectPath]);
    await writeAuditEvent(supabase, {
      action: "clinical_attachment.upload",
      clinicId: context.clinicId,
      effectiveRole: context.role,
      profileId: context.profileId,
      resourceType: "clinical_attachment",
      result: "failure",
      safeMetadata: {
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
      },
    });
    redirectWithStatus(path, "attachment-upload-failed");
  }

  await writeAuditEvent(supabase, {
    action: "clinical_attachment.upload",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: metadata.id,
    resourceType: "clinical_attachment",
    safeMetadata: {
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
    },
  });

  revalidatePath(path);
  revalidatePath("/guardian");
  redirectWithStatus(path, "attachment-uploaded");
}

export async function createInventoryItemAction(formData: FormData) {
  const path = "/staff/inventory";
  const parsed = inventoryItemSchema.safeParse({
    name: valueOf(formData, "name"),
    unit: valueOf(formData, "unit"),
    reorderLevel: valueOf(formData, "reorderLevel"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("inventory_items")
    .insert({
      clinic_id: context.clinicId,
      name: parsed.data.name,
      unit: parsed.data.unit,
      reorder_level: parsed.data.reorderLevel,
    })
    .select("id")
    .single();

  if (error || !item) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "inventory_item.create",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: item.id,
    resourceType: "inventory_item",
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function createInventoryMovementAction(formData: FormData) {
  const path = "/staff/inventory";
  const parsed = inventoryMovementSchema.safeParse({
    itemId: valueOf(formData, "itemId"),
    quantityDelta: Number(valueOf(formData, "quantityDelta")),
    reason: valueOf(formData, "reason"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: movement, error } = await supabase
    .from("inventory_movements")
    .insert({
      clinic_id: context.clinicId,
      item_id: parsed.data.itemId,
      quantity_delta: parsed.data.quantityDelta,
      reason: parsed.data.reason,
      actor_profile_id: context.profileId,
    })
    .select("id")
    .single();

  if (error || !movement) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "inventory_movement.create",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    reason: parsed.data.reason,
    resourceId: movement.id,
    resourceType: "inventory_movement",
    safeMetadata: { quantityDelta: parsed.data.quantityDelta },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function createVaccinationRecordAction(formData: FormData) {
  const path = "/staff/vaccinations";
  const inventoryItemId = valueOf(formData, "inventoryItemId");
  const parsed = vaccinationRecordSchema.safeParse({
    patientId: valueOf(formData, "patientId"),
    inventoryItemId: inventoryItemId || undefined,
    vaccineName: valueOf(formData, "vaccineName"),
    doseLabel: valueOf(formData, "doseLabel"),
    lotNumber: valueOf(formData, "lotNumber") || undefined,
    administeredAt: valueOf(formData, "administeredAt"),
    route: valueOf(formData, "route") || undefined,
    site: valueOf(formData, "site") || undefined,
    nextDueAt: valueOf(formData, "nextDueAt"),
    notes: valueOf(formData, "notes") || undefined,
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();

  const { data: patient, error: patientLookupError } = await supabase
    .from("patients")
    .select("id, clinic_id, status")
    .eq("id", parsed.data.patientId)
    .maybeSingle();

  if (
    patientLookupError ||
    !patient ||
    patient.clinic_id !== context.clinicId ||
    patient.status !== "active"
  ) {
    redirectWithStatus(path, "invalid");
  }

  let linkedInventoryName: string | null = null;
  if (parsed.data.inventoryItemId) {
    const { data: inventoryItem, error: inventoryLookupError } = await supabase
      .from("inventory_items")
      .select("id, clinic_id, name, status")
      .eq("id", parsed.data.inventoryItemId)
      .maybeSingle();

    if (
      inventoryLookupError ||
      !inventoryItem ||
      inventoryItem.clinic_id !== context.clinicId ||
      inventoryItem.status !== "active"
    ) {
      redirectWithStatus(path, "invalid");
    }

    linkedInventoryName = inventoryItem.name;
  }

  const { data: vaccinationRecord, error } = await supabase
    .from("vaccination_records")
    .insert({
      administered_at: parsed.data.administeredAt.toISOString(),
      administered_by_profile_id: context.profileId,
      clinic_id: context.clinicId,
      dose_label: parsed.data.doseLabel,
      inventory_item_id: parsed.data.inventoryItemId ?? null,
      lot_number: optionalText(parsed.data.lotNumber),
      next_due_at: parsed.data.nextDueAt
        ? parsed.data.nextDueAt.toISOString().slice(0, 10)
        : null,
      notes: optionalText(parsed.data.notes),
      patient_id: parsed.data.patientId,
      route: optionalText(parsed.data.route),
      site: optionalText(parsed.data.site),
      vaccine_name: parsed.data.vaccineName,
    })
    .select("id")
    .single();

  if (error || !vaccinationRecord) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "vaccination_record.create",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: vaccinationRecord.id,
    resourceType: "vaccination_record",
    safeMetadata: {
      inventoryLinked: Boolean(parsed.data.inventoryItemId),
    },
  });

  if (parsed.data.inventoryItemId) {
    const { data: movement, error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        actor_profile_id: context.profileId,
        clinic_id: context.clinicId,
        item_id: parsed.data.inventoryItemId,
        quantity_delta: -1,
        reason: `Vaccination administered: ${linkedInventoryName ?? parsed.data.vaccineName}`,
        related_resource_id: vaccinationRecord.id,
        related_resource_type: "vaccination_record",
      })
      .select("id")
      .single();

    if (movementError || !movement) {
      redirectWithStatus(path, "write-failed");
    }

    await writeAuditEvent(supabase, {
      action: "inventory_movement.vaccination_consumption",
      clinicId: context.clinicId,
      effectiveRole: context.role,
      profileId: context.profileId,
      reason: `Vaccination administered: ${linkedInventoryName ?? parsed.data.vaccineName}`,
      resourceId: movement.id,
      resourceType: "inventory_movement",
      safeMetadata: { vaccinationRecordId: vaccinationRecord.id },
    });

    revalidatePath("/staff/inventory");
  }

  revalidatePath(path);
  revalidatePath("/guardian");
  redirectWithStatus(path, "saved");
}

export async function updateBillingStatusAction(formData: FormData) {
  const path = "/staff/billing";
  const parsed = billingStatusSchema.safeParse({
    billingId: valueOf(formData, "billingId"),
    status: valueOf(formData, "status"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { error } = await supabase
    .from("billing_records")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.billingId);

  if (error) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "billing_record.status_update",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: parsed.data.billingId,
    resourceType: "billing_record",
    safeMetadata: { status: parsed.data.status },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function correctBillingRecordAction(formData: FormData) {
  const path = "/staff/billing";
  const parsed = billingCorrectionSchema.safeParse({
    billingId: valueOf(formData, "billingId"),
    totalMinor: valueOf(formData, "totalMinor"),
    status: valueOf(formData, "status"),
    reason: valueOf(formData, "reason"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: billingRecord, error: billingLookupError } = await supabase
    .from("billing_records")
    .select("id, clinic_id, status, total_minor")
    .eq("id", parsed.data.billingId)
    .maybeSingle();

  if (
    billingLookupError ||
    !billingRecord ||
    billingRecord.clinic_id !== context.clinicId ||
    billingRecord.status === "void"
  ) {
    redirectWithStatus(path, "invalid");
  }

  const { error: adjustmentError } = await supabase
    .from("billing_adjustments")
    .insert({
      adjustment_type: "correction",
      actor_profile_id: context.profileId,
      billing_record_id: billingRecord.id,
      clinic_id: context.clinicId,
      new_status: parsed.data.status,
      new_total_minor: parsed.data.totalMinor,
      previous_status: billingRecord.status,
      previous_total_minor: billingRecord.total_minor,
      reason: parsed.data.reason,
    });

  if (adjustmentError) {
    redirectWithStatus(path, "write-failed");
  }

  const { error: billingError } = await supabase
    .from("billing_records")
    .update({
      status: parsed.data.status,
      total_minor: parsed.data.totalMinor,
    })
    .eq("id", billingRecord.id);

  if (billingError) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "billing_record.correct",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    reason: parsed.data.reason,
    resourceId: billingRecord.id,
    resourceType: "billing_record",
    safeMetadata: {
      newStatus: parsed.data.status,
      newTotalMinor: parsed.data.totalMinor,
      previousStatus: billingRecord.status,
      previousTotalMinor: billingRecord.total_minor,
    },
  });

  revalidatePath(path);
  revalidatePath("/guardian");
  redirectWithStatus(path, "saved");
}

export async function voidBillingRecordAction(formData: FormData) {
  const path = "/staff/billing";
  const parsed = billingVoidSchema.safeParse({
    billingId: valueOf(formData, "billingId"),
    confirmationText: valueOf(formData, "confirmationText"),
    reason: valueOf(formData, "reason"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: billingRecord, error: billingLookupError } = await supabase
    .from("billing_records")
    .select("id, clinic_id, status, total_minor")
    .eq("id", parsed.data.billingId)
    .maybeSingle();

  if (
    billingLookupError ||
    !billingRecord ||
    billingRecord.clinic_id !== context.clinicId ||
    billingRecord.status === "void"
  ) {
    redirectWithStatus(path, "invalid");
  }

  const { error: adjustmentError } = await supabase
    .from("billing_adjustments")
    .insert({
      adjustment_type: "void",
      actor_profile_id: context.profileId,
      billing_record_id: billingRecord.id,
      clinic_id: context.clinicId,
      new_status: "void",
      new_total_minor: billingRecord.total_minor,
      previous_status: billingRecord.status,
      previous_total_minor: billingRecord.total_minor,
      reason: parsed.data.reason,
    });

  if (adjustmentError) {
    redirectWithStatus(path, "write-failed");
  }

  const { error: billingError } = await supabase
    .from("billing_records")
    .update({ status: "void" })
    .eq("id", billingRecord.id);

  if (billingError) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "billing_record.void",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    reason: parsed.data.reason,
    resourceId: billingRecord.id,
    resourceType: "billing_record",
    safeMetadata: {
      previousStatus: billingRecord.status,
      totalMinor: billingRecord.total_minor,
    },
  });

  revalidatePath(path);
  revalidatePath("/guardian");
  redirectWithStatus(path, "saved");
}

export async function createBillingRecordAction(formData: FormData) {
  const path = "/staff/billing";
  const parsed = billingRecordSchema.safeParse({
    patientId: valueOf(formData, "patientId"),
    totalMinor: valueOf(formData, "totalMinor"),
    status: valueOf(formData, "status") || "draft",
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireStaffContext(path);
  const supabase = await createClient();
  const { data: billingRecord, error } = await supabase
    .from("billing_records")
    .insert({
      clinic_id: context.clinicId,
      patient_id: parsed.data.patientId,
      total_minor: parsed.data.totalMinor,
      status: parsed.data.status,
      currency: "PHP",
    })
    .select("id")
    .single();

  if (error || !billingRecord) {
    redirectWithStatus(path, "write-failed");
  }

  await writeAuditEvent(supabase, {
    action: "billing_record.create",
    clinicId: context.clinicId,
    effectiveRole: context.role,
    profileId: context.profileId,
    resourceId: billingRecord.id,
    resourceType: "billing_record",
    safeMetadata: {
      status: parsed.data.status,
      totalMinor: parsed.data.totalMinor,
    },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function updateProfileAccountStatusAction(formData: FormData) {
  const path = "/staff/admin";
  const parsed = adminProfileStatusSchema.safeParse({
    profileId: valueOf(formData, "profileId"),
    reason: valueOf(formData, "reason"),
    status: valueOf(formData, "status"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireAdminContext(path);
  const admin = createAdminClient();

  if (!admin) {
    redirectWithStatus(path, "service-role-required");
  }

  if (
    context.profileId === parsed.data.profileId &&
    parsed.data.status !== "active"
  ) {
    redirectWithStatus(path, "invalid");
  }

  const { data: targetProfile, error: lookupError } = await admin
    .from("profiles")
    .select("id, account_status, clinic_id")
    .eq("id", parsed.data.profileId)
    .eq("clinic_id", context.clinicId)
    .maybeSingle();

  if (lookupError || !targetProfile) {
    redirectWithStatus(path, "invalid");
  }

  const { error } = await admin
    .from("profiles")
    .update({
      account_status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.profileId)
    .eq("clinic_id", context.clinicId);

  if (error) {
    redirectWithStatus(path, "write-failed");
  }

  await admin.from("audit_events").insert({
    action: "admin.profile_status_update",
    actor_profile_id: context.profileId,
    clinic_id: context.clinicId,
    effective_role: "admin",
    reason: parsed.data.reason,
    resource_id: parsed.data.profileId,
    resource_type: "profile",
    result: "success",
    safe_metadata: {
      nextStatus: parsed.data.status,
      previousStatus: targetProfile.account_status,
    },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function updateStaffMembershipStatusAction(formData: FormData) {
  const path = "/staff/admin";
  const parsed = adminStaffMembershipStatusSchema.safeParse({
    membershipId: valueOf(formData, "membershipId"),
    reason: valueOf(formData, "reason"),
    status: valueOf(formData, "status"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireAdminContext(path);
  const admin = createAdminClient();

  if (!admin) {
    redirectWithStatus(path, "service-role-required");
  }

  const { data: membership, error: lookupError } = await admin
    .from("staff_memberships")
    .select("id, profile_id, role, status, clinic_id")
    .eq("id", parsed.data.membershipId)
    .eq("clinic_id", context.clinicId)
    .maybeSingle();

  if (lookupError || !membership) {
    redirectWithStatus(path, "invalid");
  }

  if (
    membership.profile_id === context.profileId &&
    membership.role === "admin" &&
    parsed.data.status !== "active"
  ) {
    redirectWithStatus(path, "invalid");
  }

  const { error } = await admin
    .from("staff_memberships")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.membershipId)
    .eq("clinic_id", context.clinicId);

  if (error) {
    redirectWithStatus(path, "write-failed");
  }

  await admin.from("audit_events").insert({
    action: "admin.staff_membership_status_update",
    actor_profile_id: context.profileId,
    clinic_id: context.clinicId,
    effective_role: "admin",
    reason: parsed.data.reason,
    resource_id: parsed.data.membershipId,
    resource_type: "staff_membership",
    result: "success",
    safe_metadata: {
      nextStatus: parsed.data.status,
      previousStatus: membership.status,
      role: membership.role,
    },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}

export async function grantStaffRoleAction(formData: FormData) {
  const path = "/staff/admin";
  const parsed = adminStaffRoleGrantSchema.safeParse({
    profileId: valueOf(formData, "profileId"),
    reason: valueOf(formData, "reason"),
    role: valueOf(formData, "role"),
  });

  if (!parsed.success) {
    redirectWithStatus(path, "invalid");
  }

  const context = await requireAdminContext(path);
  const admin = createAdminClient();

  if (!admin) {
    redirectWithStatus(path, "service-role-required");
  }

  const { data: targetProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", parsed.data.profileId)
    .eq("clinic_id", context.clinicId)
    .maybeSingle();

  if (profileLookupError || !targetProfile) {
    redirectWithStatus(path, "invalid");
  }

  const { data: existingMembership, error: membershipLookupError } = await admin
    .from("staff_memberships")
    .select("id, status")
    .eq("clinic_id", context.clinicId)
    .eq("profile_id", parsed.data.profileId)
    .eq("role", parsed.data.role)
    .maybeSingle();

  if (membershipLookupError) {
    redirectWithStatus(path, "write-failed");
  }

  const previousStatus = existingMembership?.status ?? "none";
  const mutation = existingMembership
    ? admin
        .from("staff_memberships")
        .update({ status: "active" })
        .eq("id", existingMembership.id)
        .select("id")
        .single()
    : admin
        .from("staff_memberships")
        .insert({
          clinic_id: context.clinicId,
          profile_id: parsed.data.profileId,
          role: parsed.data.role,
          status: "active",
        })
        .select("id")
        .single();

  const { data: membership, error } = await mutation;

  if (error || !membership) {
    redirectWithStatus(path, "write-failed");
  }

  await admin.from("audit_events").insert({
    action: "admin.staff_role_grant",
    actor_profile_id: context.profileId,
    clinic_id: context.clinicId,
    effective_role: "admin",
    reason: parsed.data.reason,
    resource_id: membership.id,
    resource_type: "staff_membership",
    result: "success",
    safe_metadata: {
      nextStatus: "active",
      previousStatus,
      profileId: parsed.data.profileId,
      role: parsed.data.role,
    },
  });

  revalidatePath(path);
  redirectWithStatus(path, "saved");
}
