import { NextResponse, type NextRequest } from "next/server";
import {
  CLINICAL_ATTACHMENT_SIGNED_URL_SECONDS,
  normalizeClinicalAttachmentFilename,
} from "@/lib/clinical-attachments";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  if (!getSupabaseConfig()) {
    return NextResponse.json(
      { error: "Storage is unavailable." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  if (claimsData.claims.aal !== "aal2") {
    return NextResponse.json(
      { error: "MFA verification required." },
      { status: 403 },
    );
  }

  const { attachmentId } = await params;
  const { data: attachment, error: attachmentError } = await supabase
    .from("clinical_attachments")
    .select(
      "id, clinic_id, storage_bucket, storage_object_path, original_filename",
    )
    .eq("id", attachmentId)
    .maybeSingle();

  if (attachmentError || !attachment) {
    return NextResponse.json(
      { error: "Attachment not found." },
      { status: 404 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", claimsData.claims.sub)
    .eq("account_status", "active")
    .maybeSingle();

  const { data: membership } = profile
    ? await supabase
        .from("staff_memberships")
        .select("role")
        .eq("profile_id", profile.id)
        .eq("clinic_id", attachment.clinic_id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from(attachment.storage_bucket)
    .createSignedUrl(
      attachment.storage_object_path,
      CLINICAL_ATTACHMENT_SIGNED_URL_SECONDS,
      {
        download: normalizeClinicalAttachmentFilename(
          attachment.original_filename,
        ),
      },
    );

  if (signedUrlError || !signedUrl?.signedUrl) {
    return NextResponse.json(
      { error: "Attachment not found." },
      { status: 404 },
    );
  }

  if (profile) {
    await supabase.from("audit_events").insert({
      action: "clinical_attachment.download",
      actor_profile_id: profile.id,
      clinic_id: attachment.clinic_id,
      effective_role: membership?.role ?? "guardian",
      resource_id: attachment.id,
      resource_type: "clinical_attachment",
      result: "success",
      safe_metadata: {
        signedUrlExpiresInSeconds: CLINICAL_ATTACHMENT_SIGNED_URL_SECONDS,
      },
    });
  }

  const response = NextResponse.redirect(signedUrl.signedUrl, 302);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
