import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { syntheticReadModel } from "@/features/demo/data";
import type {
  Appointment,
  Assessment,
  AuditEvent,
  BillingRecord,
  ClinicalAttachment,
  Encounter,
  GuardianProfile,
  InventoryItem,
  Patient,
  PatientGuardianLink,
  PcmsReadModel,
  QueueEntry,
  VaccinationRecord,
} from "@/features/demo/types";

type SupabasePatientRow = {
  id: string;
  legal_name: string;
  birth_date: string;
  sex: "female" | "male" | "intersex" | "not_specified";
  status: "active" | "inactive" | "void";
};

type SupabaseGuardianProfileRow = {
  id: string;
  profile_id: string;
  contact_number: string | null;
  status: "active" | "inactive" | "void";
};

type SupabasePatientGuardianRow = {
  id: string;
  patient_id: string;
  guardian_profile_id: string;
  relationship: string;
  authorization_status: PatientGuardianLink["authorizationStatus"];
};

type SupabaseProfileRow = {
  id: string;
  display_name: string;
};

type SupabaseAppointmentRow = {
  id: string;
  patient_id: string;
  provider_profile_id: string | null;
  starts_at: string;
  ends_at: string;
  status: Appointment["status"] | "no_show";
  reason: string | null;
};

type SupabaseQueueRow = {
  id: string;
  queue_number: number;
  patient_id: string;
  appointment_id: string | null;
  state: QueueEntry["state"] | "cancelled";
};

type SupabaseAssessmentRow = {
  id: string;
  patient_id: string;
  queue_entry_id: string | null;
  assessed_by_profile_id: string;
  temperature_c: number | string | null;
  weight_kg: number | string | null;
  height_cm: number | string | null;
  heart_rate_bpm: number | null;
  respiratory_rate_bpm: number | null;
  oxygen_saturation_pct: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  chief_complaint: string;
  notes: string | null;
  handoff_status: Assessment["handoffStatus"];
  created_at: string;
};

type SupabaseEncounterRow = {
  id: string;
  patient_id: string;
  status: Encounter["status"];
  author_profile_id: string;
  diagnosis: string | null;
  notes: string | null;
  updated_at: string;
};

type SupabaseClinicalAddendumRow = {
  encounter_id: string;
};

type SupabaseClinicalAttachmentRow = {
  id: string;
  patient_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number | string;
  created_at: string;
};

type SupabaseInventoryRow = {
  id: string;
  name: string;
  unit: string;
  reorder_level: number | string;
};

type SupabaseInventoryMovementRow = {
  item_id: string;
  quantity_delta: number | string;
};

type SupabaseVaccinationRow = {
  id: string;
  patient_id: string;
  administered_by_profile_id: string;
  inventory_item_id: string | null;
  vaccine_name: string;
  dose_label: string;
  lot_number: string | null;
  administered_at: string;
  route: string | null;
  site: string | null;
  next_due_at: string | null;
  notes: string | null;
  status: "active" | "inactive" | "void";
};

type SupabaseBillingRow = {
  id: string;
  patient_id: string;
  status: BillingRecord["status"];
  total_minor: number;
};

type SupabaseBillingAdjustmentRow = {
  billing_record_id: string;
};

type SupabaseAuditRow = {
  id: string;
  action: string;
  effective_role: string | null;
  resource_type: string;
  resource_id: string | null;
  result: AuditEvent["result"];
  occurred_at: string;
};

function mapPatient(
  row: SupabasePatientRow,
  guardianNamesByPatientId: Map<string, string[]>,
  immunizationsByPatientId: Map<string, string[]>,
): Patient {
  const guardianNames = guardianNamesByPatientId.get(row.id) ?? [];

  return {
    id: row.id,
    name: row.legal_name,
    birthDate: row.birth_date,
    sex: row.sex === "male" ? "male" : "female",
    guardian: guardianNames.length
      ? guardianNames.join(", ")
      : "Linked guardian pending",
    allergies: [],
    immunizations: immunizationsByPatientId.get(row.id) ?? [],
    status: row.status === "active" ? "active" : "inactive",
  };
}

function mapGuardianProfile(
  row: SupabaseGuardianProfileRow,
  displayNameByProfileId: Map<string, string>,
): GuardianProfile {
  return {
    id: row.id,
    profileId: row.profile_id,
    displayName:
      displayNameByProfileId.get(row.profile_id) ?? "Linked guardian",
    contactNumber: row.contact_number ?? "No contact recorded",
    status: row.status === "active" ? "active" : "inactive",
  };
}

function mapPatientGuardianLink(
  row: SupabasePatientGuardianRow,
): PatientGuardianLink {
  return {
    id: row.id,
    patientId: row.patient_id,
    guardianProfileId: row.guardian_profile_id,
    relationship: row.relationship,
    authorizationStatus: row.authorization_status,
  };
}

function mapAppointment(row: SupabaseAppointmentRow): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    provider: row.provider_profile_id ? "Assigned provider" : "Unassigned",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status === "no_show" ? "cancelled" : row.status,
    reason: row.reason ?? "",
  };
}

function mapQueueEntry(row: SupabaseQueueRow): QueueEntry {
  return {
    id: row.id,
    queueNumber: row.queue_number,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    state: row.state === "cancelled" ? "completed" : row.state,
  };
}

function numberOrNull(value: number | string | null) {
  return value === null ? null : Number(value);
}

function mapAssessment(
  row: SupabaseAssessmentRow,
  displayNameByProfileId: Map<string, string>,
): Assessment {
  return {
    id: row.id,
    assessedBy:
      displayNameByProfileId.get(row.assessed_by_profile_id) ??
      "Authorized staff",
    bloodPressure:
      row.blood_pressure_systolic && row.blood_pressure_diastolic
        ? `${row.blood_pressure_systolic}/${row.blood_pressure_diastolic}`
        : null,
    chiefComplaint: row.chief_complaint,
    createdAt: row.created_at,
    handoffStatus: row.handoff_status,
    heartRateBpm: row.heart_rate_bpm,
    heightCm: numberOrNull(row.height_cm),
    notes: row.notes,
    oxygenSaturationPct: row.oxygen_saturation_pct,
    patientId: row.patient_id,
    queueEntryId: row.queue_entry_id,
    respiratoryRateBpm: row.respiratory_rate_bpm,
    temperatureC: numberOrNull(row.temperature_c),
    weightKg: numberOrNull(row.weight_kg),
  };
}

function mapEncounter(
  row: SupabaseEncounterRow,
  addendaCountByEncounterId: Map<string, number>,
): Encounter {
  return {
    id: row.id,
    patientId: row.patient_id,
    status: row.status,
    clinician: "Authorized clinician",
    diagnosis: row.diagnosis ?? row.notes ?? "No clinical text released",
    updatedAt: row.updated_at,
    addendaCount: addendaCountByEncounterId.get(row.id) ?? 0,
  };
}

function mapClinicalAttachment(
  row: SupabaseClinicalAttachmentRow,
): ClinicalAttachment {
  return {
    id: row.id,
    createdAt: row.created_at,
    mimeType: row.mime_type,
    originalFilename: row.original_filename,
    patientId: row.patient_id,
    sizeBytes: Number(row.size_bytes),
  };
}

function mapInventoryItem(
  row: SupabaseInventoryRow,
  onHandByItemId: Map<string, number>,
): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    onHand: onHandByItemId.get(row.id) ?? 0,
    reorderLevel: Number(row.reorder_level),
  };
}

function mapVaccinationRecord(
  row: SupabaseVaccinationRow,
  displayNameByProfileId: Map<string, string>,
): VaccinationRecord {
  return {
    id: row.id,
    administeredAt: row.administered_at,
    administeredBy:
      displayNameByProfileId.get(row.administered_by_profile_id) ??
      "Authorized staff",
    doseLabel: row.dose_label,
    inventoryItemId: row.inventory_item_id,
    lotNumber: row.lot_number,
    nextDueAt: row.next_due_at,
    notes: row.notes,
    patientId: row.patient_id,
    route: row.route,
    site: row.site,
    status: row.status,
    vaccineName: row.vaccine_name,
  };
}

function mapBillingRecord(
  row: SupabaseBillingRow,
  adjustmentCountByBillingId: Map<string, number>,
): BillingRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    status: row.status,
    totalMinor: row.total_minor,
    adjustmentCount: adjustmentCountByBillingId.get(row.id) ?? 0,
  };
}

function mapAuditEvent(row: SupabaseAuditRow): AuditEvent {
  return {
    id: row.id,
    action: row.action,
    actor: row.effective_role ?? "Unknown actor",
    resource: `${row.resource_type}:${row.resource_id ?? "none"}`,
    result: row.result,
    occurredAt: row.occurred_at,
  };
}

export async function getPcmsReadModel(): Promise<PcmsReadModel> {
  if (!getSupabaseConfig()) {
    return syntheticReadModel;
  }

  const supabase = await createClient();

  const [
    patientsResult,
    guardianProfilesResult,
    patientGuardiansResult,
    profilesResult,
    appointmentsResult,
    queueResult,
    assessmentsResult,
    encountersResult,
    addendaResult,
    clinicalAttachmentsResult,
    inventoryResult,
    inventoryMovementResult,
    vaccinationResult,
    billingResult,
    billingAdjustmentResult,
    auditResult,
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("id, legal_name, birth_date, sex, status")
      .order("created_at"),
    supabase
      .from("guardian_profiles")
      .select("id, profile_id, contact_number, status")
      .order("created_at"),
    supabase
      .from("patient_guardians")
      .select(
        "id, patient_id, guardian_profile_id, relationship, authorization_status",
      )
      .order("created_at"),
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("appointments")
      .select(
        "id, patient_id, provider_profile_id, starts_at, ends_at, status, reason",
      )
      .order("starts_at"),
    supabase
      .from("queue_entries")
      .select("id, queue_number, patient_id, appointment_id, state")
      .order("queue_number"),
    supabase
      .from("assessments")
      .select(
        "id, patient_id, queue_entry_id, assessed_by_profile_id, temperature_c, weight_kg, height_cm, heart_rate_bpm, respiratory_rate_bpm, oxygen_saturation_pct, blood_pressure_systolic, blood_pressure_diastolic, chief_complaint, notes, handoff_status, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("encounters")
      .select(
        "id, patient_id, status, author_profile_id, diagnosis, notes, updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase.from("clinical_addenda").select("encounter_id"),
    supabase
      .from("clinical_attachments")
      .select(
        "id, patient_id, original_filename, mime_type, size_bytes, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("inventory_items")
      .select("id, name, unit, reorder_level")
      .order("name"),
    supabase.from("inventory_movements").select("item_id, quantity_delta"),
    supabase
      .from("vaccination_records")
      .select(
        "id, patient_id, administered_by_profile_id, inventory_item_id, vaccine_name, dose_label, lot_number, administered_at, route, site, next_due_at, notes, status",
      )
      .order("administered_at", { ascending: false }),
    supabase
      .from("billing_records")
      .select("id, patient_id, status, total_minor")
      .order("created_at"),
    supabase.from("billing_adjustments").select("billing_record_id"),
    supabase
      .from("audit_events")
      .select(
        "id, action, effective_role, resource_type, resource_id, result, occurred_at",
      )
      .order("occurred_at", { ascending: false }),
  ]);

  const onHandByItemId = new Map<string, number>();
  (
    (inventoryMovementResult.data ?? []) as SupabaseInventoryMovementRow[]
  ).forEach((movement) => {
    onHandByItemId.set(
      movement.item_id,
      (onHandByItemId.get(movement.item_id) ?? 0) +
        Number(movement.quantity_delta),
    );
  });

  const addendaCountByEncounterId = new Map<string, number>();
  ((addendaResult.data ?? []) as SupabaseClinicalAddendumRow[]).forEach(
    (addendum) => {
      addendaCountByEncounterId.set(
        addendum.encounter_id,
        (addendaCountByEncounterId.get(addendum.encounter_id) ?? 0) + 1,
      );
    },
  );

  const displayNameByProfileId = new Map<string, string>();
  ((profilesResult.data ?? []) as SupabaseProfileRow[]).forEach((profile) => {
    displayNameByProfileId.set(profile.id, profile.display_name);
  });

  const adjustmentCountByBillingId = new Map<string, number>();
  (
    (billingAdjustmentResult.data ?? []) as SupabaseBillingAdjustmentRow[]
  ).forEach((adjustment) => {
    adjustmentCountByBillingId.set(
      adjustment.billing_record_id,
      (adjustmentCountByBillingId.get(adjustment.billing_record_id) ?? 0) + 1,
    );
  });

  const vaccinationRecords = (
    (vaccinationResult.data ?? []) as SupabaseVaccinationRow[]
  ).map((vaccination) =>
    mapVaccinationRecord(vaccination, displayNameByProfileId),
  );
  const immunizationsByPatientId = new Map<string, string[]>();
  vaccinationRecords
    .filter((vaccination) => vaccination.status === "active")
    .forEach((vaccination) => {
      immunizationsByPatientId.set(vaccination.patientId, [
        ...(immunizationsByPatientId.get(vaccination.patientId) ?? []),
        `${vaccination.vaccineName} (${vaccination.doseLabel})`,
      ]);
    });

  const guardianProfiles = (
    (guardianProfilesResult.data ?? []) as SupabaseGuardianProfileRow[]
  ).map((profile) => mapGuardianProfile(profile, displayNameByProfileId));
  const guardianNameById = new Map(
    guardianProfiles.map((profile) => [profile.id, profile.displayName]),
  );
  const patientGuardianLinks = (
    (patientGuardiansResult.data ?? []) as SupabasePatientGuardianRow[]
  ).map(mapPatientGuardianLink);
  const guardianNamesByPatientId = new Map<string, string[]>();
  patientGuardianLinks
    .filter((link) => link.authorizationStatus === "approved")
    .forEach((link) => {
      const guardianName =
        guardianNameById.get(link.guardianProfileId) ?? "Linked guardian";
      guardianNamesByPatientId.set(link.patientId, [
        ...(guardianNamesByPatientId.get(link.patientId) ?? []),
        `${guardianName} (${link.relationship})`,
      ]);
    });

  return {
    source: "supabase",
    patients: ((patientsResult.data ?? []) as SupabasePatientRow[]).map(
      (patient) =>
        mapPatient(patient, guardianNamesByPatientId, immunizationsByPatientId),
    ),
    guardianProfiles,
    patientGuardianLinks,
    appointments: (
      (appointmentsResult.data ?? []) as SupabaseAppointmentRow[]
    ).map(mapAppointment),
    queueEntries: ((queueResult.data ?? []) as SupabaseQueueRow[]).map(
      mapQueueEntry,
    ),
    assessments: (
      (assessmentsResult.data ?? []) as SupabaseAssessmentRow[]
    ).map((assessment) => mapAssessment(assessment, displayNameByProfileId)),
    encounters: ((encountersResult.data ?? []) as SupabaseEncounterRow[]).map(
      (encounter) => mapEncounter(encounter, addendaCountByEncounterId),
    ),
    clinicalAttachments: (
      (clinicalAttachmentsResult.data ?? []) as SupabaseClinicalAttachmentRow[]
    ).map(mapClinicalAttachment),
    inventoryItems: (
      (inventoryResult.data ?? []) as SupabaseInventoryRow[]
    ).map((item) => mapInventoryItem(item, onHandByItemId)),
    vaccinationRecords,
    billingRecords: ((billingResult.data ?? []) as SupabaseBillingRow[]).map(
      (bill) => mapBillingRecord(bill, adjustmentCountByBillingId),
    ),
    auditEvents: ((auditResult.data ?? []) as SupabaseAuditRow[]).map(
      mapAuditEvent,
    ),
  };
}

export function formatPatientNameFromReadModel(
  readModel: PcmsReadModel,
  patientId: string,
) {
  return (
    readModel.patients.find((patient) => patient.id === patientId)?.name ??
    "Unknown patient"
  );
}
