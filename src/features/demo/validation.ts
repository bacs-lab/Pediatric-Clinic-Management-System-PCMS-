import { z } from "zod";
import {
  CLINICAL_ATTACHMENT_MAX_BYTES,
  CLINICAL_ATTACHMENT_MIME_TYPES,
} from "@/lib/clinical-attachments";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export const passwordRecoverySchema = z.object({
  email: z.string().trim().email(),
});

const commonPasswordFragments = [
  "password",
  "qwerty",
  "letmein",
  "admin",
  "welcome",
  "clinic",
  "pediatric",
  "supabase",
  "pcms",
] as const;

const strongPasswordSchema = z
  .string()
  .min(12)
  .max(200)
  .refine((value) => /[a-z]/.test(value), {
    message: "Password must include a lowercase letter.",
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: "Password must include an uppercase letter.",
  })
  .refine((value) => /\d/.test(value), {
    message: "Password must include a number.",
  })
  .refine((value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value), {
    message: "Password must include a symbol.",
  })
  .refine((value) => !/\s/.test(value), {
    message: "Password must not contain spaces.",
  })
  .refine(
    (value) => {
      const normalized = value.toLowerCase();

      return !commonPasswordFragments.some((fragment) =>
        normalized.includes(fragment),
      );
    },
    { message: "Password must not contain common password words." },
  );

export const passwordUpdateSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(12).max(200),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const mfaFactorSchema = z.object({
  factorId: z.string().min(1),
});

export const adminProfileStatusSchema = z.object({
  profileId: z.string().uuid(),
  reason: z.string().trim().min(5).max(300),
  status: z.enum(["active", "inactive"]),
});

export const adminStaffMembershipStatusSchema = z.object({
  membershipId: z.string().uuid(),
  reason: z.string().trim().min(5).max(300),
  status: z.enum(["active", "inactive"]),
});

export const adminStaffRoleGrantSchema = z.object({
  profileId: z.string().uuid(),
  reason: z.string().trim().min(5).max(300),
  role: z.enum(["doctor", "secretary", "staff", "admin"]),
});

export const demographicCorrectionSchema = z.object({
  patientId: z.string().min(1),
  reason: z.string().min(8).max(500),
  requestedChanges: z.string().min(3).max(1000),
});

export const guardianProfileSchema = z.object({
  contactNumber: z.string().trim().min(7).max(40),
});

export const patientGuardianLinkSchema = z.object({
  patientId: z.string().min(1),
  guardianProfileId: z.string().min(1),
  relationship: z.string().trim().min(2).max(80),
  authorizationStatus: z.enum(["pending", "approved", "rejected", "revoked"]),
});

export const patientRegistrationSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  birthDate: z.coerce.date(),
  sex: z.enum(["female", "male", "intersex", "not_specified"]),
});

export const appointmentRequestSchema = z
  .object({
    patientId: z.string().min(1),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reason: z.string().min(3).max(300),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: "Appointment end must be after start.",
    path: ["endsAt"],
  });

export const appointmentStatusSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum([
    "requested",
    "approved",
    "checked_in",
    "completed",
    "cancelled",
    "no_show",
  ]),
});

export const queueStateSchema = z.object({
  queueEntryId: z.string().min(1),
  state: z.enum([
    "waiting",
    "assessing",
    "consulting",
    "billing",
    "completed",
    "cancelled",
  ]),
});

export const queueCheckInSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().optional(),
});

const optionalVitalsNumber = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().finite().optional(),
);

const optionalVitalsInteger = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().int().optional(),
);

export const assessmentVitalsSchema = z
  .object({
    patientId: z.string().min(1),
    queueEntryId: z.string().optional(),
    temperatureC: optionalVitalsNumber.refine(
      (value) => value === undefined || (value >= 30 && value <= 45),
      "Temperature must be between 30.0 and 45.0 C.",
    ),
    weightKg: optionalVitalsNumber.refine(
      (value) => value === undefined || (value > 0 && value <= 300),
      "Weight must be greater than 0 and at most 300 kg.",
    ),
    heightCm: optionalVitalsNumber.refine(
      (value) => value === undefined || (value > 0 && value <= 250),
      "Height must be greater than 0 and at most 250 cm.",
    ),
    heartRateBpm: optionalVitalsInteger.refine(
      (value) => value === undefined || (value >= 20 && value <= 250),
      "Heart rate must be between 20 and 250 bpm.",
    ),
    respiratoryRateBpm: optionalVitalsInteger.refine(
      (value) => value === undefined || (value >= 5 && value <= 80),
      "Respiratory rate must be between 5 and 80 bpm.",
    ),
    oxygenSaturationPct: optionalVitalsInteger.refine(
      (value) => value === undefined || (value >= 50 && value <= 100),
      "Oxygen saturation must be between 50 and 100%.",
    ),
    bloodPressureSystolic: optionalVitalsInteger.refine(
      (value) => value === undefined || (value >= 40 && value <= 250),
      "Systolic blood pressure must be between 40 and 250.",
    ),
    bloodPressureDiastolic: optionalVitalsInteger.refine(
      (value) => value === undefined || (value >= 20 && value <= 150),
      "Diastolic blood pressure must be between 20 and 150.",
    ),
    chiefComplaint: z.string().trim().min(3).max(1000),
    notes: z.string().trim().max(2000).optional(),
    handoffStatus: z
      .enum(["draft", "ready_for_consult", "in_consult"])
      .default("ready_for_consult"),
  })
  .refine(
    (value) =>
      (value.bloodPressureSystolic === undefined &&
        value.bloodPressureDiastolic === undefined) ||
      (value.bloodPressureSystolic !== undefined &&
        value.bloodPressureDiastolic !== undefined),
    {
      message: "Blood pressure requires both systolic and diastolic values.",
      path: ["bloodPressureDiastolic"],
    },
  );

export const assessmentHandoffSchema = z.object({
  assessmentId: z.string().min(1),
  handoffStatus: z.enum(["ready_for_consult", "in_consult", "completed"]),
});

export const encounterFinalizeSchema = z.object({
  encounterId: z.string().min(1),
  diagnosis: z.string().min(3).max(2000),
  clinicianAttestation: z.literal(
    "I understand this final record cannot be overwritten.",
  ),
});

export const encounterDraftSchema = z.object({
  patientId: z.string().min(1),
  notes: z.string().trim().min(3).max(4000),
});

export const clinicalAddendumSchema = z.object({
  encounterId: z.string().min(1),
  reason: z.string().trim().min(5).max(500),
  body: z.string().trim().min(5).max(4000),
});

export const clinicalAttachmentUploadSchema = z.object({
  patientId: z.string().min(1),
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.enum(CLINICAL_ATTACHMENT_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(CLINICAL_ATTACHMENT_MAX_BYTES),
});

export const inventoryMovementSchema = z.object({
  itemId: z.string().min(1),
  quantityDelta: z
    .number()
    .finite()
    .refine((value) => value !== 0),
  reason: z.string().min(5).max(300),
});

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(2).max(160),
  unit: z.string().trim().min(1).max(40),
  reorderLevel: z.coerce.number().min(0).max(999999),
});

export const vaccinationRecordSchema = z
  .object({
    patientId: z.string().min(1),
    inventoryItemId: z.string().optional(),
    vaccineName: z.string().trim().min(2).max(160),
    doseLabel: z.string().trim().min(1).max(80),
    lotNumber: z.string().trim().max(120).optional(),
    administeredAt: z.coerce.date(),
    route: z.string().trim().max(80).optional(),
    site: z.string().trim().max(80).optional(),
    nextDueAt: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.date().optional(),
    ),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine(
    (value) =>
      !value.nextDueAt ||
      value.nextDueAt >=
        new Date(value.administeredAt.toISOString().slice(0, 10)),
    {
      message: "Next due date cannot be before administration date.",
      path: ["nextDueAt"],
    },
  );

export const billingStatusSchema = z.object({
  billingId: z.string().min(1),
  status: z.enum(["draft", "issued", "paid"]),
});

export const billingRecordSchema = z.object({
  patientId: z.string().min(1),
  totalMinor: z.coerce.number().int().min(0).max(999999999),
  status: z.enum(["draft", "issued", "paid"]).default("draft"),
});

export const billingCorrectionSchema = z.object({
  billingId: z.string().min(1),
  totalMinor: z.coerce.number().int().min(0).max(999999999),
  status: z.enum(["draft", "issued", "paid"]),
  reason: z.string().trim().min(5).max(300),
});

export const billingVoidSchema = z.object({
  billingId: z.string().min(1),
  confirmationText: z.literal("VOID"),
  reason: z.string().trim().min(5).max(300),
});
