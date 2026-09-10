import { createHmac, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/types/database.generated";

const shouldRun = process.env.RUN_SUPABASE_INTEGRATION_TESTS === "1";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const runDescribe =
  shouldRun && supabaseUrl && publishableKey && serviceRoleKey
    ? describe
    : describe.skip;

type TestIds = {
  clinicA: string;
  clinicB: string;
  staffProfile: string;
  guardianProfile: string;
  guardianRecord: string;
  patientA: string;
  patientB: string;
  appointmentA: string;
  assessmentA: string;
  queueA: string;
  encounterA: string;
  billingA: string;
  billingAdjustmentA: string;
  auditEventA: string;
  inventoryItemA: string;
  vaccinationA: string;
  clinicalAttachmentA: string;
  clinicalAttachmentB: string;
};

const ids: TestIds = {
  clinicA: randomUUID(),
  clinicB: randomUUID(),
  staffProfile: randomUUID(),
  guardianProfile: randomUUID(),
  guardianRecord: randomUUID(),
  patientA: randomUUID(),
  patientB: randomUUID(),
  appointmentA: randomUUID(),
  assessmentA: randomUUID(),
  queueA: randomUUID(),
  encounterA: randomUUID(),
  billingA: randomUUID(),
  billingAdjustmentA: randomUUID(),
  auditEventA: randomUUID(),
  inventoryItemA: randomUUID(),
  vaccinationA: randomUUID(),
  clinicalAttachmentA: randomUUID(),
  clinicalAttachmentB: randomUUID(),
};

const clinicalObjectPathA = `${ids.clinicA}/${ids.patientA}/${ids.clinicalAttachmentA}.pdf`;
const clinicalObjectPathB = `${ids.clinicB}/${ids.patientB}/${ids.clinicalAttachmentB}.pdf`;
const guardianUploadPath = `${ids.clinicA}/${ids.patientA}/${randomUUID()}.pdf`;

const suffix = randomUUID();
const staffEmail = `pcms-staff-${suffix}@example.test`;
const guardianEmail = `pcms-guardian-${suffix}@example.test`;
const password = `Pcms-${suffix}-Password1!`;

let admin: SupabaseClient<Database>;
let staff: SupabaseClient<Database>;
let aal1Staff: SupabaseClient<Database>;
let guardian: SupabaseClient<Database>;
let staffUserId = "";
let guardianUserId = "";

async function expectNoError(error: { message: string } | null) {
  expect(error?.message).toBeUndefined();
}

function decodeBase32(value: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = value
    .replace(/=+$/g, "")
    .toUpperCase()
    .split("")
    .map((character) =>
      alphabet.indexOf(character).toString(2).padStart(5, "0"),
    )
    .join("");
  const bytes: number[] = [];

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function currentTotp(secret: string) {
  const counter = Math.floor(Date.now() / 30_000);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret))
    .update(counterBuffer)
    .digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code =
    (((digest[offset]! & 0x7f) << 24) |
      ((digest[offset + 1]! & 0xff) << 16) |
      ((digest[offset + 2]! & 0xff) << 8) |
      (digest[offset + 3]! & 0xff)) %
    1_000_000;

  return code.toString().padStart(6, "0");
}

async function elevateToAal2(
  client: SupabaseClient<Database>,
  friendlyName: string,
) {
  const enrollment = await client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });

  expect(enrollment.error).toBeNull();
  const factorId = enrollment.data?.id;
  const secret = enrollment.data?.totp.secret;

  if (!factorId || !secret) {
    throw new Error("MFA enrollment did not return a TOTP factor.");
  }

  const verification = await client.auth.mfa.challengeAndVerify({
    factorId,
    code: currentTotp(secret),
  });

  expect(verification.error).toBeNull();
}

async function cleanup() {
  if (!admin) {
    return;
  }

  await admin.storage
    .from("clinical-attachments")
    .remove([clinicalObjectPathA, clinicalObjectPathB, guardianUploadPath]);
  await admin
    .from("clinical_attachments")
    .delete()
    .in("id", [ids.clinicalAttachmentA, ids.clinicalAttachmentB]);

  await admin
    .from("clinical_addenda")
    .delete()
    .eq("encounter_id", ids.encounterA);
  await admin.from("encounters").delete().eq("id", ids.encounterA);
  await admin
    .from("billing_adjustments")
    .delete()
    .eq("id", ids.billingAdjustmentA);
  await admin.from("audit_events").delete().eq("id", ids.auditEventA);
  await admin.from("billing_records").delete().eq("id", ids.billingA);
  await admin.from("queue_entries").delete().eq("id", ids.queueA);
  await admin.from("assessments").delete().eq("id", ids.assessmentA);
  await admin.from("vaccination_records").delete().eq("id", ids.vaccinationA);
  await admin.from("appointments").delete().eq("id", ids.appointmentA);
  await admin
    .from("inventory_movements")
    .delete()
    .eq("item_id", ids.inventoryItemA);
  await admin.from("inventory_items").delete().eq("id", ids.inventoryItemA);
  await admin.from("patient_guardians").delete().eq("patient_id", ids.patientA);
  await admin.from("guardian_profiles").delete().eq("id", ids.guardianRecord);
  await admin.from("patients").delete().in("id", [ids.patientA, ids.patientB]);
  await admin
    .from("staff_memberships")
    .delete()
    .in("profile_id", [ids.staffProfile, ids.guardianProfile]);
  await admin
    .from("profiles")
    .delete()
    .in("id", [ids.staffProfile, ids.guardianProfile]);
  await admin.from("clinics").delete().in("id", [ids.clinicA, ids.clinicB]);

  if (staffUserId) {
    await admin.auth.admin.deleteUser(staffUserId);
  }
  if (guardianUserId) {
    await admin.auth.admin.deleteUser(guardianUserId);
  }
}

runDescribe("Supabase RLS integration", () => {
  beforeAll(async () => {
    admin = createClient<Database>(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false },
    });
    staff = createClient<Database>(supabaseUrl!, publishableKey!, {
      auth: { persistSession: false },
    });
    aal1Staff = createClient<Database>(supabaseUrl!, publishableKey!, {
      auth: { persistSession: false },
    });
    guardian = createClient<Database>(supabaseUrl!, publishableKey!, {
      auth: { persistSession: false },
    });

    await cleanup();

    const staffCreate = await admin.auth.admin.createUser({
      email: staffEmail,
      email_confirm: true,
      password,
    });
    const guardianCreate = await admin.auth.admin.createUser({
      email: guardianEmail,
      email_confirm: true,
      password,
    });

    if (staffCreate.error || guardianCreate.error) {
      throw new Error(
        staffCreate.error?.message ??
          guardianCreate.error?.message ??
          "Could not create integration users",
      );
    }

    staffUserId = staffCreate.data.user.id;
    guardianUserId = guardianCreate.data.user.id;

    await expectNoError(
      (
        await admin.from("clinics").insert([
          { id: ids.clinicA, name: "Integration Clinic A" },
          { id: ids.clinicB, name: "Integration Clinic B" },
        ])
      ).error,
    );
    await expectNoError(
      (
        await admin.from("profiles").insert([
          {
            id: ids.staffProfile,
            account_status: "active",
            clinic_id: ids.clinicA,
            display_name: "Integration Staff",
            user_id: staffUserId,
          },
          {
            id: ids.guardianProfile,
            account_status: "active",
            clinic_id: ids.clinicA,
            display_name: "Integration Guardian",
            user_id: guardianUserId,
          },
        ])
      ).error,
    );
    await expectNoError(
      (
        await admin.from("staff_memberships").insert([
          {
            clinic_id: ids.clinicA,
            profile_id: ids.staffProfile,
            role: "staff",
            status: "active",
          },
          {
            clinic_id: ids.clinicA,
            profile_id: ids.staffProfile,
            role: "admin",
            status: "active",
          },
        ])
      ).error,
    );
    await expectNoError(
      (
        await admin.from("patients").insert([
          {
            id: ids.patientA,
            birth_date: "2021-01-01",
            clinic_id: ids.clinicA,
            legal_name: "Integration Linked Child",
            sex: "female",
          },
          {
            id: ids.patientB,
            birth_date: "2021-01-02",
            clinic_id: ids.clinicB,
            legal_name: "Integration Hidden Child",
            sex: "male",
          },
        ])
      ).error,
    );
    await expectNoError(
      (
        await admin.from("guardian_profiles").insert({
          id: ids.guardianRecord,
          contact_number: "+63 900 000 0001",
          profile_id: ids.guardianProfile,
          status: "active",
        })
      ).error,
    );
    await expectNoError(
      (
        await admin.from("patient_guardians").insert({
          authorization_status: "approved",
          guardian_profile_id: ids.guardianRecord,
          patient_id: ids.patientA,
          relationship: "Guardian",
        })
      ).error,
    );
    await expectNoError(
      (
        await admin.from("appointments").insert({
          id: ids.appointmentA,
          clinic_id: ids.clinicA,
          created_by_profile_id: ids.staffProfile,
          ends_at: "2026-09-01T01:30:00.000Z",
          patient_id: ids.patientA,
          reason: "Integration appointment",
          starts_at: "2026-09-01T01:00:00.000Z",
          status: "approved",
        })
      ).error,
    );
    await expectNoError(
      (
        await admin.from("encounters").insert({
          id: ids.encounterA,
          author_profile_id: ids.staffProfile,
          clinic_id: ids.clinicA,
          diagnosis: "Integration final diagnosis",
          finalized_at: "2026-09-01T02:00:00.000Z",
          patient_id: ids.patientA,
          status: "final",
        })
      ).error,
    );
    await expectNoError(
      (
        await admin.from("billing_records").insert({
          id: ids.billingA,
          clinic_id: ids.clinicA,
          patient_id: ids.patientA,
          status: "issued",
          total_minor: 50000,
        })
      ).error,
    );
    await expectNoError(
      (
        await admin.from("inventory_items").insert({
          id: ids.inventoryItemA,
          clinic_id: ids.clinicA,
          name: "Integration Supply",
          reorder_level: 5,
          unit: "piece",
        })
      ).error,
    );
    await expectNoError(
      (
        await admin.from("assessments").insert({
          id: ids.assessmentA,
          assessed_by_profile_id: ids.staffProfile,
          blood_pressure_diastolic: 58,
          blood_pressure_systolic: 92,
          chief_complaint: "Integration intake assessment",
          clinic_id: ids.clinicA,
          handoff_status: "ready_for_consult",
          heart_rate_bpm: 96,
          height_cm: 101.2,
          oxygen_saturation_pct: 99,
          patient_id: ids.patientA,
          respiratory_rate_bpm: 24,
          temperature_c: 37.1,
          weight_kg: 16.4,
        })
      ).error,
    );
    await expectNoError(
      (
        await admin.from("vaccination_records").insert({
          id: ids.vaccinationA,
          administered_at: "2026-09-01T02:30:00.000Z",
          administered_by_profile_id: ids.staffProfile,
          clinic_id: ids.clinicA,
          dose_label: "Dose 1",
          inventory_item_id: ids.inventoryItemA,
          lot_number: "INT-LOT-001",
          next_due_at: "2026-10-01",
          patient_id: ids.patientA,
          route: "IM",
          site: "Left deltoid",
          vaccine_name: "Integration Vaccine",
        })
      ).error,
    );

    await expectNoError(
      (await staff.auth.signInWithPassword({ email: staffEmail, password }))
        .error,
    );
    await expectNoError(
      (await aal1Staff.auth.signInWithPassword({ email: staffEmail, password }))
        .error,
    );
    await expectNoError(
      (
        await guardian.auth.signInWithPassword({
          email: guardianEmail,
          password,
        })
      ).error,
    );
    await elevateToAal2(staff, "PCMS integration staff");
    await elevateToAal2(guardian, "PCMS integration guardian");
  }, 60_000);

  afterAll(async () => {
    await cleanup();
  }, 60_000);

  it("denies application table access until the session reaches AAL2", async () => {
    const assurance = await aal1Staff.auth.mfa.getAuthenticatorAssuranceLevel();
    const profiles = await aal1Staff
      .from("profiles")
      .select("id")
      .eq("id", ids.staffProfile);
    const patients = await aal1Staff
      .from("patients")
      .select("id")
      .eq("id", ids.patientA);
    const auditInsert = await aal1Staff.from("audit_events").insert({
      action: "integration.aal1.denied",
      actor_profile_id: ids.staffProfile,
      clinic_id: ids.clinicA,
      effective_role: "staff",
      resource_type: "integration_test",
      result: "success",
    });

    expect(assurance.error).toBeNull();
    expect(assurance.data?.currentLevel).toBe("aal1");
    expect(profiles.error).toBeNull();
    expect(profiles.data).toEqual([]);
    expect(patients.error).toBeNull();
    expect(patients.data).toEqual([]);
    expect(auditInsert.error?.code).toBe("42501");
  });

  it("allows active staff to read only clinic-scoped operational rows", async () => {
    const patients = await staff
      .from("patients")
      .select("id")
      .in("id", [ids.patientA, ids.patientB])
      .order("id");

    expect(patients.error).toBeNull();
    expect(patients.data?.map((patient) => patient.id)).toEqual([ids.patientA]);
  });

  it("allows guardians to read approved linked child data only", async () => {
    const patients = await guardian
      .from("patients")
      .select("id")
      .in("id", [ids.patientA, ids.patientB])
      .order("id");
    const appointments = await guardian
      .from("appointments")
      .select("id")
      .eq("id", ids.appointmentA);
    const encounters = await guardian
      .from("encounters")
      .select("id")
      .eq("id", ids.encounterA);
    const assessments = await guardian
      .from("assessments")
      .select("id")
      .eq("id", ids.assessmentA);
    const billingRecords = await guardian
      .from("billing_records")
      .select("id")
      .eq("id", ids.billingA);
    const vaccinationRecords = await guardian
      .from("vaccination_records")
      .select("id")
      .eq("id", ids.vaccinationA);
    const inventoryItems = await guardian
      .from("inventory_items")
      .select("id")
      .eq("id", ids.inventoryItemA);

    expect(patients.error).toBeNull();
    expect(patients.data?.map((patient) => patient.id)).toEqual([ids.patientA]);
    expect(appointments.data).toHaveLength(1);
    expect(encounters.data).toHaveLength(1);
    expect(assessments.data).toHaveLength(1);
    expect(billingRecords.data).toHaveLength(1);
    expect(vaccinationRecords.data).toHaveLength(1);
    expect(inventoryItems.data).toHaveLength(0);
  });

  it("enforces staff write policies for queue, billing, and clinical rows", async () => {
    const draftEncounterId = randomUUID();
    const addendumId = randomUUID();
    const assessmentId = randomUUID();
    const vaccinationId = randomUUID();
    const queue = await staff
      .from("queue_entries")
      .insert({
        id: ids.queueA,
        appointment_id: ids.appointmentA,
        clinic_id: ids.clinicA,
        patient_id: ids.patientA,
        queue_number: 1,
        service_date: "2026-09-01",
        state: "waiting",
      })
      .select("id")
      .single();

    expect(queue.error).toBeNull();

    const billingAdjustment = await staff
      .from("billing_adjustments")
      .insert({
        id: ids.billingAdjustmentA,
        adjustment_type: "correction",
        actor_profile_id: ids.staffProfile,
        billing_record_id: ids.billingA,
        clinic_id: ids.clinicA,
        new_status: "paid",
        new_total_minor: 50000,
        previous_status: "issued",
        previous_total_minor: 50000,
        reason: "Integration correction",
      })
      .select("id")
      .single();

    expect(billingAdjustment.error).toBeNull();

    const assessment = await staff
      .from("assessments")
      .insert({
        id: assessmentId,
        assessed_by_profile_id: ids.staffProfile,
        chief_complaint: "Integration staff assessment",
        clinic_id: ids.clinicA,
        handoff_status: "ready_for_consult",
        patient_id: ids.patientA,
        queue_entry_id: ids.queueA,
        temperature_c: 37.2,
        weight_kg: 16.5,
      })
      .select("id")
      .single();

    expect(assessment.error).toBeNull();

    const handoff = await staff
      .from("assessments")
      .update({ handoff_status: "in_consult" })
      .eq("id", assessmentId)
      .select("id")
      .single();

    expect(handoff.error).toBeNull();

    const vaccination = await staff
      .from("vaccination_records")
      .insert({
        id: vaccinationId,
        administered_at: "2026-09-01T03:00:00.000Z",
        administered_by_profile_id: ids.staffProfile,
        clinic_id: ids.clinicA,
        dose_label: "Dose 1",
        inventory_item_id: ids.inventoryItemA,
        lot_number: "INT-LOT-002",
        patient_id: ids.patientA,
        route: "IM",
        site: "Right deltoid",
        vaccine_name: "Integration Vaccine",
      })
      .select("id")
      .single();

    expect(vaccination.error).toBeNull();

    const draft = await staff
      .from("encounters")
      .insert({
        id: draftEncounterId,
        author_profile_id: ids.staffProfile,
        clinic_id: ids.clinicA,
        notes: "Integration draft note",
        patient_id: ids.patientA,
        status: "draft",
      })
      .select("id")
      .single();

    expect(draft.error).toBeNull();

    const finalized = await staff
      .from("encounters")
      .update({
        diagnosis: "Integration finalized diagnosis",
        finalized_at: new Date().toISOString(),
        status: "final",
      })
      .eq("id", draftEncounterId)
      .select("id")
      .single();

    expect(finalized.error).toBeNull();

    const addendum = await staff
      .from("clinical_addenda")
      .insert({
        id: addendumId,
        author_profile_id: ids.staffProfile,
        body: "Integration addendum body.",
        encounter_id: draftEncounterId,
        reason: "Integration clarification",
      })
      .select("id")
      .single();

    expect(addendum.error).toBeNull();

    await admin.from("clinical_addenda").delete().eq("id", addendumId);
    await admin.from("encounters").delete().eq("id", draftEncounterId);
    await admin.from("assessments").delete().eq("id", assessmentId);
    await admin.from("vaccination_records").delete().eq("id", vaccinationId);
  });

  it("allows active users to insert own audit events and admins to read clinic audit rows", async () => {
    const auditEvent = await staff
      .from("audit_events")
      .insert({
        id: ids.auditEventA,
        action: "integration.audit_write",
        actor_profile_id: ids.staffProfile,
        clinic_id: ids.clinicA,
        effective_role: "admin",
        resource_type: "integration",
        result: "success",
        safe_metadata: { scope: "rls" },
      })
      .select("id")
      .single();

    expect(auditEvent.error).toBeNull();

    const visibleAuditEvents = await staff
      .from("audit_events")
      .select("id")
      .eq("id", ids.auditEventA);

    expect(visibleAuditEvents.error).toBeNull();
    expect(visibleAuditEvents.data).toHaveLength(1);
  });

  it("allows active admins to read same-clinic account and role state", async () => {
    const profileRows = await staff
      .from("profiles")
      .select("id")
      .in("id", [ids.staffProfile, ids.guardianProfile]);
    const membershipRows = await staff
      .from("staff_memberships")
      .select("profile_id, role")
      .eq("clinic_id", ids.clinicA);

    expect(profileRows.error).toBeNull();
    expect(profileRows.data?.map((profile) => profile.id).sort()).toEqual(
      [ids.guardianProfile, ids.staffProfile].sort(),
    );
    expect(membershipRows.error).toBeNull();
    expect(
      membershipRows.data?.some(
        (membership) =>
          membership.profile_id === ids.staffProfile &&
          membership.role === "admin",
      ),
    ).toBe(true);
  });

  it("enforces private clinical attachment upload and download access", async () => {
    const pdfBytes = new TextEncoder().encode("%PDF-1.7\nIntegration file");
    const staffUpload = await staff.storage
      .from("clinical-attachments")
      .upload(clinicalObjectPathA, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    expect(staffUpload.error).toBeNull();

    const metadataA = await staff
      .from("clinical_attachments")
      .insert({
        id: ids.clinicalAttachmentA,
        clinic_id: ids.clinicA,
        created_by_profile_id: ids.staffProfile,
        mime_type: "application/pdf",
        original_filename: "integration-visible.pdf",
        patient_id: ids.patientA,
        size_bytes: pdfBytes.byteLength,
        storage_bucket: "clinical-attachments",
        storage_object_path: clinicalObjectPathA,
      })
      .select("id")
      .single();

    expect(metadataA.error).toBeNull();

    await expectNoError(
      (
        await admin.storage
          .from("clinical-attachments")
          .upload(clinicalObjectPathB, pdfBytes, {
            contentType: "application/pdf",
            upsert: false,
          })
      ).error,
    );
    await expectNoError(
      (
        await admin.from("clinical_attachments").insert({
          id: ids.clinicalAttachmentB,
          clinic_id: ids.clinicB,
          mime_type: "application/pdf",
          original_filename: "integration-hidden.pdf",
          patient_id: ids.patientB,
          size_bytes: pdfBytes.byteLength,
          storage_bucket: "clinical-attachments",
          storage_object_path: clinicalObjectPathB,
        })
      ).error,
    );

    const guardianMetadata = await guardian
      .from("clinical_attachments")
      .select("id")
      .in("id", [ids.clinicalAttachmentA, ids.clinicalAttachmentB]);
    expect(guardianMetadata.error).toBeNull();
    expect(guardianMetadata.data?.map((item) => item.id)).toEqual([
      ids.clinicalAttachmentA,
    ]);

    const guardianSignedUrl = await guardian.storage
      .from("clinical-attachments")
      .createSignedUrl(clinicalObjectPathA, 60);
    expect(guardianSignedUrl.error).toBeNull();
    expect(guardianSignedUrl.data?.signedUrl).toContain("/object/sign/");

    const hiddenSignedUrl = await guardian.storage
      .from("clinical-attachments")
      .createSignedUrl(clinicalObjectPathB, 60);
    expect(hiddenSignedUrl.error).not.toBeNull();

    const guardianUpload = await guardian.storage
      .from("clinical-attachments")
      .upload(guardianUploadPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });
    expect(guardianUpload.error).not.toBeNull();

    const aal1Staff = createClient<Database>(supabaseUrl!, publishableKey!, {
      auth: { persistSession: false },
    });
    await expectNoError(
      (
        await aal1Staff.auth.signInWithPassword({
          email: staffEmail,
          password,
        })
      ).error,
    );
    const aal1Metadata = await aal1Staff
      .from("clinical_attachments")
      .select("id")
      .eq("id", ids.clinicalAttachmentA);
    expect(aal1Metadata.error).toBeNull();
    expect(aal1Metadata.data).toHaveLength(0);
  });
});
