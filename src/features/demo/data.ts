import type {
  Appointment,
  Assessment,
  AuditEvent,
  BillingRecord,
  Encounter,
  GuardianProfile,
  InventoryItem,
  Patient,
  PatientGuardianLink,
  PcmsReadModel,
  QueueEntry,
  Role,
  VaccinationRecord,
} from "@/features/demo/types";

export const roles: Array<{ role: Role; label: string; scope: string }> = [
  {
    role: "doctor",
    label: "Doctor",
    scope: "Clinical authoring and clinic patient access",
  },
  {
    role: "secretary",
    label: "Secretary",
    scope: "Appointments, queue, billing, inventory",
  },
  { role: "staff", label: "Staff", scope: "Approved operational workflows" },
  { role: "guardian", label: "Guardian", scope: "Linked children only" },
  { role: "admin", label: "Admin", scope: "Accounts and configuration only" },
];

export const patients: Patient[] = [
  {
    id: "pat-001",
    name: "Synthetic Patient A",
    birthDate: "2021-03-12",
    sex: "female",
    guardian: "Synthetic Guardian A",
    allergies: ["Peanut"],
    immunizations: ["MMR", "Varicella"],
    status: "active",
  },
  {
    id: "pat-002",
    name: "Synthetic Patient B",
    birthDate: "2019-11-04",
    sex: "male",
    guardian: "Synthetic Guardian B",
    allergies: [],
    immunizations: ["DTaP", "IPV"],
    status: "active",
  },
  {
    id: "pat-003",
    name: "Synthetic Patient C",
    birthDate: "2023-07-28",
    sex: "female",
    guardian: "Synthetic Guardian A",
    allergies: ["Latex"],
    immunizations: ["Hepatitis B"],
    status: "active",
  },
];

export const appointments: Appointment[] = [
  {
    id: "apt-001",
    patientId: "pat-001",
    provider: "Dr. Synthetic",
    startsAt: "2026-08-24T01:00:00.000Z",
    endsAt: "2026-08-24T01:30:00.000Z",
    status: "approved",
    reason: "Well-child visit",
  },
  {
    id: "apt-002",
    patientId: "pat-002",
    provider: "Dr. Synthetic",
    startsAt: "2026-08-24T02:00:00.000Z",
    endsAt: "2026-08-24T02:30:00.000Z",
    status: "requested",
    reason: "Follow-up",
  },
];

export const guardianProfiles: GuardianProfile[] = [
  {
    id: "gua-001",
    profileId: "pro-guardian-a",
    displayName: "Synthetic Guardian A",
    contactNumber: "+63 900 000 0001",
    status: "active",
  },
  {
    id: "gua-002",
    profileId: "pro-guardian-b",
    displayName: "Synthetic Guardian B",
    contactNumber: "+63 900 000 0002",
    status: "active",
  },
];

export const patientGuardianLinks: PatientGuardianLink[] = [
  {
    id: "pgl-001",
    patientId: "pat-001",
    guardianProfileId: "gua-001",
    relationship: "Mother",
    authorizationStatus: "approved",
  },
  {
    id: "pgl-002",
    patientId: "pat-002",
    guardianProfileId: "gua-002",
    relationship: "Father",
    authorizationStatus: "approved",
  },
  {
    id: "pgl-003",
    patientId: "pat-003",
    guardianProfileId: "gua-001",
    relationship: "Mother",
    authorizationStatus: "approved",
  },
];

export const queueEntries: QueueEntry[] = [
  {
    id: "que-001",
    queueNumber: 1,
    patientId: "pat-001",
    appointmentId: "apt-001",
    state: "assessing",
  },
  {
    id: "que-002",
    queueNumber: 2,
    patientId: "pat-002",
    appointmentId: "apt-002",
    state: "waiting",
  },
  {
    id: "que-003",
    queueNumber: 3,
    patientId: "pat-003",
    appointmentId: null,
    state: "waiting",
  },
];

export const assessments: Assessment[] = [
  {
    id: "asm-001",
    patientId: "pat-001",
    queueEntryId: "que-001",
    assessedBy: "Synthetic Nurse",
    temperatureC: 37.1,
    weightKg: 16.4,
    heightCm: 101.2,
    heartRateBpm: 96,
    respiratoryRateBpm: 24,
    oxygenSaturationPct: 99,
    bloodPressure: "92/58",
    chiefComplaint: "Well-child visit intake",
    notes: "Synthetic vitals captured before consultation.",
    handoffStatus: "ready_for_consult",
    createdAt: "2026-08-24T01:05:00.000Z",
  },
];

export const encounters: Encounter[] = [
  {
    id: "enc-001",
    patientId: "pat-001",
    status: "draft",
    clinician: "Dr. Synthetic",
    diagnosis: "Draft assessment pending finalization",
    updatedAt: "2026-08-22T10:30:00.000Z",
    addendaCount: 0,
  },
  {
    id: "enc-002",
    patientId: "pat-002",
    status: "final",
    clinician: "Dr. Synthetic",
    diagnosis: "Finalized synthetic encounter",
    updatedAt: "2026-08-21T09:10:00.000Z",
    addendaCount: 1,
  },
];

export const inventoryItems: InventoryItem[] = [
  {
    id: "inv-001",
    name: "Synthetic Vaccine A",
    unit: "dose",
    onHand: 12,
    reorderLevel: 10,
  },
  {
    id: "inv-002",
    name: "Synthetic Medicine B",
    unit: "bottle",
    onHand: 5,
    reorderLevel: 8,
  },
  {
    id: "inv-003",
    name: "Synthetic Supply C",
    unit: "box",
    onHand: 18,
    reorderLevel: 6,
  },
];

export const vaccinationRecords: VaccinationRecord[] = [
  {
    id: "vac-001",
    patientId: "pat-001",
    administeredBy: "Dr. Synthetic",
    inventoryItemId: "inv-001",
    vaccineName: "Synthetic Vaccine A",
    doseLabel: "Dose 1",
    lotNumber: "SYN-LOT-001",
    administeredAt: "2026-08-24T02:00:00.000Z",
    route: "IM",
    site: "Left deltoid",
    nextDueAt: "2026-09-24",
    notes: "Synthetic immunization record.",
    status: "active",
  },
];

export const billingRecords: BillingRecord[] = [
  {
    id: "bil-001",
    patientId: "pat-001",
    status: "issued",
    totalMinor: 125000,
    adjustmentCount: 0,
  },
  {
    id: "bil-002",
    patientId: "pat-002",
    status: "paid",
    totalMinor: 75000,
    adjustmentCount: 0,
  },
];

export const auditEvents: AuditEvent[] = [
  {
    id: "aud-001",
    action: "patient.view",
    actor: "Synthetic Secretary",
    resource: "pat-001",
    result: "success",
    occurredAt: "2026-08-22T10:00:00.000Z",
  },
  {
    id: "aud-002",
    action: "clinical.finalize",
    actor: "Dr. Synthetic",
    resource: "enc-002",
    result: "success",
    occurredAt: "2026-08-21T09:10:00.000Z",
  },
];

export const syntheticReadModel: PcmsReadModel = {
  source: "synthetic",
  patients,
  guardianProfiles,
  patientGuardianLinks,
  appointments,
  queueEntries,
  assessments,
  encounters,
  clinicalAttachments: [],
  inventoryItems,
  vaccinationRecords,
  billingRecords,
  auditEvents,
};

export function findPatient(patientId: string) {
  return patients.find((patient) => patient.id === patientId);
}

export function formatPatientName(patientId: string) {
  return findPatient(patientId)?.name ?? "Unknown synthetic patient";
}

export function formatMoney(totalMinor: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(totalMinor / 100);
}
