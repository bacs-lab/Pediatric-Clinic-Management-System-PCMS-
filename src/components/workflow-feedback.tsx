const workflowMessages: Record<string, string> = {
  "admin-required": "An active admin membership is required for this action.",
  "attachment-invalid":
    "Choose a valid PDF, JPEG, or PNG clinical attachment up to 10 MB.",
  "attachment-upload-failed": "The clinical attachment could not be stored.",
  "attachment-uploaded": "Clinical attachment uploaded securely.",
  "auth-required": "Sign in before changing clinic records.",
  "clinical-staff-required":
    "An active doctor or clinical staff membership is required for this action.",
  invalid: "Review the submitted fields and try again.",
  "mfa-required": "Complete MFA verification before this sensitive action.",
  saved: "Change saved.",
  "service-role-required":
    "A server-only Supabase service-role key is required for this admin action.",
  "staff-required": "An active staff membership is required for this action.",
  "supabase-required":
    "Supabase is required before this action can persist data.",
  "write-failed": "The database rejected this change.",
};

export function WorkflowFeedback({ value }: { value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="panel text-sm" role="status">
      {workflowMessages[value] ?? "Workflow status updated."}
    </div>
  );
}
