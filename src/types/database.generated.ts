export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: { id: string; name: string; status: string; created_at: string };
        Insert: {
          id?: string;
          name: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          clinic_id: string | null;
          display_name: string;
          account_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          clinic_id?: string | null;
          display_name: string;
          account_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          clinic_id?: string | null;
          display_name?: string;
          account_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_memberships: TableDef<
        {
          id: string;
          clinic_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["staff_role"];
          status: Database["public"]["Enums"]["lifecycle_status"];
          created_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          profile_id: string;
          role: Database["public"]["Enums"]["staff_role"];
          status?: Database["public"]["Enums"]["lifecycle_status"];
          created_at?: string;
        }
      >;
      guardian_profiles: TableDef<
        {
          id: string;
          profile_id: string;
          contact_number: string | null;
          status: Database["public"]["Enums"]["lifecycle_status"];
          created_at: string;
        },
        {
          id?: string;
          profile_id: string;
          contact_number?: string | null;
          status?: Database["public"]["Enums"]["lifecycle_status"];
          created_at?: string;
        },
        {
          contact_number?: string | null;
          status?: Database["public"]["Enums"]["lifecycle_status"];
        }
      >;
      patient_guardians: TableDef<
        {
          id: string;
          patient_id: string;
          guardian_profile_id: string;
          relationship: string;
          authorization_status: "pending" | "approved" | "rejected" | "revoked";
          created_at: string;
        },
        {
          id?: string;
          patient_id: string;
          guardian_profile_id: string;
          relationship: string;
          authorization_status: "pending" | "approved" | "rejected" | "revoked";
          created_at?: string;
        },
        {
          relationship?: string;
          authorization_status?:
            | "pending"
            | "approved"
            | "rejected"
            | "revoked";
        }
      >;
      patients: TableDef<
        {
          id: string;
          clinic_id: string;
          legal_name: string;
          birth_date: string;
          sex: "female" | "male" | "intersex" | "not_specified";
          status: Database["public"]["Enums"]["lifecycle_status"];
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          legal_name: string;
          birth_date: string;
          sex: "female" | "male" | "intersex" | "not_specified";
          status?: Database["public"]["Enums"]["lifecycle_status"];
          created_at?: string;
          updated_at?: string;
        }
      >;
      appointments: TableDef<
        {
          id: string;
          clinic_id: string;
          patient_id: string;
          provider_profile_id: string | null;
          starts_at: string;
          ends_at: string;
          status: Database["public"]["Enums"]["appointment_status"];
          reason: string | null;
          created_by_profile_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          patient_id: string;
          provider_profile_id?: string | null;
          starts_at: string;
          ends_at: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          reason?: string | null;
          created_by_profile_id?: string | null;
          created_at?: string;
        },
        {
          status?: Database["public"]["Enums"]["appointment_status"];
        }
      >;
      queue_entries: TableDef<
        {
          id: string;
          clinic_id: string;
          service_date: string;
          queue_number: number;
          patient_id: string;
          appointment_id: string | null;
          state:
            | "waiting"
            | "assessing"
            | "consulting"
            | "billing"
            | "completed"
            | "cancelled";
          created_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          service_date: string;
          queue_number: number;
          patient_id: string;
          appointment_id?: string | null;
          state?:
            | "waiting"
            | "assessing"
            | "consulting"
            | "billing"
            | "completed"
            | "cancelled";
          created_at?: string;
        },
        {
          state?:
            | "waiting"
            | "assessing"
            | "consulting"
            | "billing"
            | "completed"
            | "cancelled";
        }
      >;
      assessments: TableDef<
        {
          id: string;
          clinic_id: string;
          patient_id: string;
          queue_entry_id: string | null;
          assessed_by_profile_id: string;
          temperature_c: number | null;
          weight_kg: number | null;
          height_cm: number | null;
          heart_rate_bpm: number | null;
          respiratory_rate_bpm: number | null;
          oxygen_saturation_pct: number | null;
          blood_pressure_systolic: number | null;
          blood_pressure_diastolic: number | null;
          chief_complaint: string;
          notes: string | null;
          handoff_status: Database["public"]["Enums"]["assessment_handoff_status"];
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          patient_id: string;
          queue_entry_id?: string | null;
          assessed_by_profile_id: string;
          temperature_c?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          heart_rate_bpm?: number | null;
          respiratory_rate_bpm?: number | null;
          oxygen_saturation_pct?: number | null;
          blood_pressure_systolic?: number | null;
          blood_pressure_diastolic?: number | null;
          chief_complaint: string;
          notes?: string | null;
          handoff_status?: Database["public"]["Enums"]["assessment_handoff_status"];
          created_at?: string;
          updated_at?: string;
        },
        {
          handoff_status?: Database["public"]["Enums"]["assessment_handoff_status"];
          updated_at?: string;
        }
      >;
      encounters: TableDef<
        {
          id: string;
          clinic_id: string;
          patient_id: string;
          author_profile_id: string;
          status: Database["public"]["Enums"]["encounter_status"];
          diagnosis: string | null;
          notes: string | null;
          finalized_at: string | null;
          voided_at: string | null;
          void_reason: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          patient_id: string;
          author_profile_id: string;
          status?: Database["public"]["Enums"]["encounter_status"];
          diagnosis?: string | null;
          notes?: string | null;
          finalized_at?: string | null;
          voided_at?: string | null;
          void_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          status?: Database["public"]["Enums"]["encounter_status"];
          diagnosis?: string | null;
          notes?: string | null;
          finalized_at?: string | null;
          voided_at?: string | null;
          void_reason?: string | null;
          updated_at?: string;
        }
      >;
      clinical_addenda: TableDef<
        {
          id: string;
          encounter_id: string;
          author_profile_id: string;
          reason: string;
          body: string;
          created_at: string;
        },
        {
          id?: string;
          encounter_id: string;
          author_profile_id: string;
          reason: string;
          body: string;
          created_at?: string;
        }
      >;
      clinical_attachments: TableDef<
        {
          id: string;
          clinic_id: string;
          patient_id: string;
          storage_bucket: string;
          storage_object_path: string;
          original_filename: string;
          mime_type: string;
          size_bytes: number;
          created_by_profile_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          patient_id: string;
          storage_bucket: string;
          storage_object_path: string;
          original_filename: string;
          mime_type: string;
          size_bytes: number;
          created_by_profile_id?: string | null;
          created_at?: string;
        }
      >;
      inventory_items: TableDef<
        {
          id: string;
          clinic_id: string;
          name: string;
          unit: string;
          reorder_level: number;
          status: Database["public"]["Enums"]["lifecycle_status"];
          created_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          name: string;
          unit: string;
          reorder_level?: number;
          status?: Database["public"]["Enums"]["lifecycle_status"];
          created_at?: string;
        }
      >;
      inventory_movements: TableDef<
        {
          id: string;
          clinic_id: string;
          item_id: string;
          quantity_delta: number;
          reason: string;
          related_resource_type: string | null;
          related_resource_id: string | null;
          actor_profile_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          item_id: string;
          quantity_delta: number;
          reason: string;
          related_resource_type?: string | null;
          related_resource_id?: string | null;
          actor_profile_id?: string | null;
          created_at?: string;
        }
      >;
      vaccination_records: TableDef<
        {
          id: string;
          clinic_id: string;
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
          status: Database["public"]["Enums"]["lifecycle_status"];
          created_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          patient_id: string;
          administered_by_profile_id: string;
          inventory_item_id?: string | null;
          vaccine_name: string;
          dose_label: string;
          lot_number?: string | null;
          administered_at?: string;
          route?: string | null;
          site?: string | null;
          next_due_at?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["lifecycle_status"];
          created_at?: string;
        }
      >;
      billing_records: TableDef<
        {
          id: string;
          clinic_id: string;
          patient_id: string;
          status: "draft" | "issued" | "paid" | "void";
          total_minor: number;
          currency: string;
          created_at: string;
        },
        {
          id?: string;
          clinic_id: string;
          patient_id: string;
          status?: "draft" | "issued" | "paid" | "void";
          total_minor?: number;
          currency?: string;
          created_at?: string;
        },
        {
          status?: "draft" | "issued" | "paid" | "void";
        }
      >;
      billing_adjustments: TableDef<
        {
          id: string;
          billing_record_id: string;
          clinic_id: string;
          actor_profile_id: string;
          adjustment_type: "correction" | "void";
          previous_status: "draft" | "issued" | "paid" | "void";
          new_status: "draft" | "issued" | "paid" | "void";
          previous_total_minor: number;
          new_total_minor: number;
          reason: string;
          created_at: string;
        },
        {
          id?: string;
          billing_record_id: string;
          clinic_id: string;
          actor_profile_id: string;
          adjustment_type: "correction" | "void";
          previous_status: "draft" | "issued" | "paid" | "void";
          new_status: "draft" | "issued" | "paid" | "void";
          previous_total_minor: number;
          new_total_minor: number;
          reason: string;
          created_at?: string;
        }
      >;
      audit_events: TableDef<{
        id: string;
        occurred_at: string;
        clinic_id: string | null;
        actor_profile_id: string | null;
        effective_role: string | null;
        action: string;
        resource_type: string;
        resource_id: string | null;
        result: Database["public"]["Enums"]["audit_result"];
        reason: string | null;
        correlation_id: string | null;
        safe_metadata: Json;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      staff_role: "doctor" | "secretary" | "staff" | "admin";
      lifecycle_status: "active" | "inactive" | "void";
      appointment_status:
        | "requested"
        | "approved"
        | "checked_in"
        | "completed"
        | "cancelled"
        | "no_show";
      assessment_handoff_status:
        | "draft"
        | "ready_for_consult"
        | "in_consult"
        | "completed"
        | "void";
      encounter_status: "draft" | "final" | "void";
      audit_result: "success" | "failure" | "denied";
    };
    CompositeTypes: Record<string, never>;
  };
};
