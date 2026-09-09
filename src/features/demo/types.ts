export type Role = "doctor" | "secretary" | "staff" | "guardian" | "admin";

export type Patient = {
  id: string;
  name: string;
  birthDate: string;
  sex: "female" | "male";
  guardian: string;
  allergies: string[];
  immunizations: string[];
  status: "active" | "inactive";
};

export type GuardianProfile = {
  id: string;
  profileId: string;
  displayName: string;
  contactNumber: string;
  status: "active" | "inactive";
};

export type PatientGuardianLink = {
  id: string;
  patientId: string;
  guardianProfileId: string;
  relationship: string;
  authorizationStatus: "pending" | "approved" | "rejected" | "revoked";
};

export type Appointment = {
  id: string;
  patientId: string;
  provider: string;
  startsAt: string;
  endsAt: string;
  status: "requested" | "approved" | "checked_in" | "completed" | "cancelled";
  reason: string;
};

export type QueueEntry = {
  id: string;
  queueNumber: number;
  patientId: string;
  appointmentId: string | null;
  state: "waiting" | "assessing" | "consulting" | "billing" | "completed";
};

export type Assessment = {
  id: string;
  patientId: string;
  queueEntryId: string | null;
  assessedBy: string;
  temperatureC: number | null;
  weightKg: number | null;
  heightCm: number | null;
  heartRateBpm: number | null;
  respiratoryRateBpm: number | null;
  oxygenSaturationPct: number | null;
  bloodPressure: string | null;
  chiefComplaint: string;
  notes: string | null;
  handoffStatus:
    | "draft"
    | "ready_for_consult"
    | "in_consult"
    | "completed"
    | "void";
  createdAt: string;
};

export type Encounter = {
  id: string;
  patientId: string;
  status: "draft" | "final" | "void";
  clinician: string;
  diagnosis: string;
  updatedAt: string;
  addendaCount: number;
};

export type ClinicalAttachment = {
  id: string;
  patientId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
};

export type VaccinationRecord = {
  id: string;
  patientId: string;
  administeredBy: string;
  inventoryItemId: string | null;
  vaccineName: string;
  doseLabel: string;
  lotNumber: string | null;
  administeredAt: string;
  route: string | null;
  site: string | null;
  nextDueAt: string | null;
  notes: string | null;
  status: "active" | "inactive" | "void";
};

export type BillingRecord = {
  id: string;
  patientId: string;
  status: "draft" | "issued" | "paid" | "void";
  totalMinor: number;
  adjustmentCount: number;
};

export type AuditEvent = {
  id: string;
  action: string;
  actor: string;
  resource: string;
  result: "success" | "failure" | "denied";
  occurredAt: string;
};

export type PcmsReadModel = {
  source: "synthetic" | "supabase";
  patients: Patient[];
  guardianProfiles: GuardianProfile[];
  patientGuardianLinks: PatientGuardianLink[];
  appointments: Appointment[];
  queueEntries: QueueEntry[];
  assessments: Assessment[];
  encounters: Encounter[];
  clinicalAttachments: ClinicalAttachment[];
  inventoryItems: InventoryItem[];
  vaccinationRecords: VaccinationRecord[];
  billingRecords: BillingRecord[];
  auditEvents: AuditEvent[];
};
