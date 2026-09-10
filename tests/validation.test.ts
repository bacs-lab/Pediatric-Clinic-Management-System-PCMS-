import { describe, expect, it } from "vitest";
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
  demographicCorrectionSchema,
  encounterFinalizeSchema,
  guardianProfileSchema,
  inventoryItemSchema,
  inventoryMovementSchema,
  loginSchema,
  mfaCodeSchema,
  mfaFactorSchema,
  patientGuardianLinkSchema,
  passwordRecoverySchema,
  passwordUpdateSchema,
  patientRegistrationSchema,
  queueCheckInSchema,
  queueStateSchema,
  vaccinationRecordSchema,
} from "@/features/demo/validation";

describe("domain validation", () => {
  it("validates login credentials", () => {
    expect(
      loginSchema.safeParse({
        email: "staff@example.test",
        password: "synthetic-password",
      }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({
        email: "not-an-email",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("requires matching password updates", () => {
    expect(
      passwordUpdateSchema.safeParse({
        password: "Generated!Passphrase42",
        confirmPassword: "Generated!Passphrase42",
      }).success,
    ).toBe(true);
    expect(
      passwordUpdateSchema.safeParse({
        password: "Generated!Passphrase42",
        confirmPassword: "Different!Passphrase42",
      }).success,
    ).toBe(false);
  });

  it("validates password recovery email addresses", () => {
    expect(
      passwordRecoverySchema.safeParse({ email: "staff@example.test" }).success,
    ).toBe(true);
    expect(
      passwordRecoverySchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("requires hardened password updates on free Supabase tier", () => {
    expect(
      passwordUpdateSchema.safeParse({
        password: "shortA1!",
        confirmPassword: "shortA1!",
      }).success,
    ).toBe(false);

    expect(
      passwordUpdateSchema.safeParse({
        password: "passwordPassword1!",
        confirmPassword: "passwordPassword1!",
      }).success,
    ).toBe(false);

    expect(
      passwordUpdateSchema.safeParse({
        password: "NoSymbolPassword42",
        confirmPassword: "NoSymbolPassword42",
      }).success,
    ).toBe(false);

    expect(
      passwordUpdateSchema.safeParse({
        password: "No Spaces!Allowed42",
        confirmPassword: "No Spaces!Allowed42",
      }).success,
    ).toBe(false);
  });

  it("validates MFA codes and factor identifiers", () => {
    expect(mfaCodeSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(mfaCodeSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(mfaCodeSchema.safeParse({ code: "abcdef" }).success).toBe(false);
    expect(mfaFactorSchema.safeParse({ factorId: "factor-001" }).success).toBe(
      true,
    );
    expect(mfaFactorSchema.safeParse({ factorId: "" }).success).toBe(false);
  });

  it("validates admin account and role management inputs", () => {
    const profileId = "11111111-1111-4111-8111-111111111111";
    const membershipId = "22222222-2222-4222-8222-222222222222";

    expect(
      adminProfileStatusSchema.safeParse({
        profileId,
        reason: "Owner approved status change",
        status: "inactive",
      }).success,
    ).toBe(true);

    expect(
      adminStaffMembershipStatusSchema.safeParse({
        membershipId,
        reason: "Temporary access suspension",
        status: "active",
      }).success,
    ).toBe(true);

    expect(
      adminStaffRoleGrantSchema.safeParse({
        profileId,
        reason: "Assigned clinical workflow access",
        role: "doctor",
      }).success,
    ).toBe(true);

    expect(
      adminStaffRoleGrantSchema.safeParse({
        profileId,
        reason: "Invalid",
        role: "guardian",
      }).success,
    ).toBe(false);
  });

  it("rejects appointment end times before start times", () => {
    const result = appointmentRequestSchema.safeParse({
      patientId: "pat-001",
      startsAt: "2026-08-24T02:00:00.000Z",
      endsAt: "2026-08-24T01:30:00.000Z",
      reason: "Follow-up",
    });

    expect(result.success).toBe(false);
  });

  it("requires demographic correction reasons", () => {
    const result = demographicCorrectionSchema.safeParse({
      patientId: "pat-001",
      reason: "short",
      requestedChanges: "Correct address line.",
    });

    expect(result.success).toBe(false);
  });

  it("requires finalization attestation for immutable encounters", () => {
    const result = encounterFinalizeSchema.safeParse({
      encounterId: "enc-001",
      diagnosis: "Synthetic final diagnosis",
      clinicianAttestation:
        "I understand this final record cannot be overwritten.",
    });

    expect(result.success).toBe(true);
  });

  it("validates clinical draft and addendum text", () => {
    expect(
      encounterDraftSchema.safeParse({
        patientId: "pat-001",
        notes: "Synthetic draft clinical note.",
      }).success,
    ).toBe(true);

    expect(
      clinicalAddendumSchema.safeParse({
        encounterId: "enc-001",
        reason: "Clarification",
        body: "Synthetic addendum text.",
      }).success,
    ).toBe(true);

    expect(
      clinicalAddendumSchema.safeParse({
        encounterId: "enc-001",
        reason: "bad",
        body: "no",
      }).success,
    ).toBe(false);
  });

  it("validates clinical attachment metadata", () => {
    expect(
      clinicalAttachmentUploadSchema.safeParse({
        patientId: "pat-001",
        originalFilename: "laboratory-result.pdf",
        mimeType: "application/pdf",
        sizeBytes: 512000,
      }).success,
    ).toBe(true);

    expect(
      clinicalAttachmentUploadSchema.safeParse({
        patientId: "pat-001",
        originalFilename: "unsafe.svg",
        mimeType: "image/svg+xml",
        sizeBytes: 512000,
      }).success,
    ).toBe(false);

    expect(
      clinicalAttachmentUploadSchema.safeParse({
        patientId: "pat-001",
        originalFilename: "too-large.pdf",
        mimeType: "application/pdf",
        sizeBytes: 10 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false);
  });

  it("validates guardian profile and child-link requests", () => {
    expect(
      guardianProfileSchema.safeParse({
        contactNumber: "+63 900 000 0001",
      }).success,
    ).toBe(true);

    expect(
      patientGuardianLinkSchema.safeParse({
        patientId: "pat-001",
        guardianProfileId: "gua-001",
        relationship: "Mother",
        authorizationStatus: "approved",
      }).success,
    ).toBe(true);

    expect(
      patientGuardianLinkSchema.safeParse({
        patientId: "pat-001",
        guardianProfileId: "gua-001",
        relationship: "x",
        authorizationStatus: "active",
      }).success,
    ).toBe(false);
  });

  it("rejects zero inventory ledger movement", () => {
    const result = inventoryMovementSchema.safeParse({
      itemId: "inv-001",
      quantityDelta: 0,
      reason: "No-op adjustment",
    });

    expect(result.success).toBe(false);
  });

  it("accepts patient registration inputs", () => {
    const result = patientRegistrationSchema.safeParse({
      legalName: "Synthetic Child",
      birthDate: "2024-01-15",
      sex: "female",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid operational status changes", () => {
    expect(
      appointmentStatusSchema.safeParse({
        appointmentId: "apt-001",
        status: "archived",
      }).success,
    ).toBe(false);
    expect(
      queueStateSchema.safeParse({
        queueEntryId: "que-001",
        state: "triaged",
      }).success,
    ).toBe(false);
    expect(
      billingStatusSchema.safeParse({
        billingId: "bil-001",
        status: "refunded",
      }).success,
    ).toBe(false);
    expect(
      billingStatusSchema.safeParse({
        billingId: "bil-001",
        status: "void",
      }).success,
    ).toBe(false);
  });

  it("accepts queue check-in inputs", () => {
    expect(
      queueCheckInSchema.safeParse({
        patientId: "pat-001",
        appointmentId: "apt-001",
      }).success,
    ).toBe(true);

    expect(
      queueCheckInSchema.safeParse({
        patientId: "pat-001",
      }).success,
    ).toBe(true);

    expect(
      queueCheckInSchema.safeParse({
        patientId: "",
        appointmentId: "apt-001",
      }).success,
    ).toBe(false);
  });

  it("validates assessment vitals and handoff inputs", () => {
    expect(
      assessmentVitalsSchema.safeParse({
        patientId: "pat-001",
        queueEntryId: "que-001",
        temperatureC: "37.1",
        weightKg: "16.4",
        heightCm: "101.2",
        heartRateBpm: "96",
        respiratoryRateBpm: "24",
        oxygenSaturationPct: "99",
        bloodPressureSystolic: "92",
        bloodPressureDiastolic: "58",
        chiefComplaint: "Well-child intake",
        handoffStatus: "ready_for_consult",
      }).success,
    ).toBe(true);

    expect(
      assessmentVitalsSchema.safeParse({
        patientId: "pat-001",
        temperatureC: "29.9",
        bloodPressureSystolic: "92",
        chiefComplaint: "Invalid vitals",
      }).success,
    ).toBe(false);

    expect(
      assessmentHandoffSchema.safeParse({
        assessmentId: "asm-001",
        handoffStatus: "in_consult",
      }).success,
    ).toBe(true);

    expect(
      assessmentHandoffSchema.safeParse({
        assessmentId: "asm-001",
        handoffStatus: "void",
      }).success,
    ).toBe(false);
  });

  it("requires non-negative inventory reorder levels", () => {
    const result = inventoryItemSchema.safeParse({
      name: "Synthetic Supply",
      unit: "box",
      reorderLevel: -1,
    });

    expect(result.success).toBe(false);
  });

  it("validates vaccination record inputs", () => {
    expect(
      vaccinationRecordSchema.safeParse({
        patientId: "pat-001",
        inventoryItemId: "inv-001",
        vaccineName: "Synthetic Vaccine A",
        doseLabel: "Dose 1",
        lotNumber: "SYN-001",
        administeredAt: "2026-08-30T09:00",
        route: "IM",
        site: "Left deltoid",
        nextDueAt: "2026-09-30",
        notes: "No reaction observed.",
      }).success,
    ).toBe(true);

    expect(
      vaccinationRecordSchema.safeParse({
        patientId: "pat-001",
        vaccineName: "A",
        doseLabel: "",
        administeredAt: "2026-08-30T09:00",
      }).success,
    ).toBe(false);

    expect(
      vaccinationRecordSchema.safeParse({
        patientId: "pat-001",
        vaccineName: "Synthetic Vaccine A",
        doseLabel: "Dose 1",
        administeredAt: "2026-08-30T09:00",
        nextDueAt: "2026-08-29",
      }).success,
    ).toBe(false);
  });

  it("accepts non-negative billing totals in minor units", () => {
    expect(
      billingRecordSchema.safeParse({
        patientId: "pat-001",
        totalMinor: "125000",
        status: "issued",
      }).success,
    ).toBe(true);

    expect(
      billingRecordSchema.safeParse({
        patientId: "pat-001",
        totalMinor: "-1",
        status: "issued",
      }).success,
    ).toBe(false);
  });

  it("requires reasoned billing correction and void inputs", () => {
    expect(
      billingCorrectionSchema.safeParse({
        billingId: "bil-001",
        totalMinor: "90000",
        status: "issued",
        reason: "Corrected service total",
      }).success,
    ).toBe(true);

    expect(
      billingCorrectionSchema.safeParse({
        billingId: "bil-001",
        totalMinor: "90000",
        status: "void",
        reason: "Invalid status",
      }).success,
    ).toBe(false);

    expect(
      billingVoidSchema.safeParse({
        billingId: "bil-001",
        confirmationText: "VOID",
        reason: "Duplicate bill",
      }).success,
    ).toBe(true);

    expect(
      billingVoidSchema.safeParse({
        billingId: "bil-001",
        confirmationText: "void",
        reason: "Duplicate bill",
      }).success,
    ).toBe(false);

    expect(
      billingVoidSchema.safeParse({
        billingId: "bil-001",
        confirmationText: "VOID",
        reason: "bad",
      }).success,
    ).toBe(false);
  });
});
