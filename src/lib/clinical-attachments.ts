export const CLINICAL_ATTACHMENT_BUCKET = "clinical-attachments";
export const CLINICAL_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const CLINICAL_ATTACHMENT_SIGNED_URL_SECONDS = 60;

export const CLINICAL_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type ClinicalAttachmentMimeType =
  (typeof CLINICAL_ATTACHMENT_MIME_TYPES)[number];

const extensionByMimeType: Record<ClinicalAttachmentMimeType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export function normalizeClinicalAttachmentFilename(filename: string) {
  const normalized = filename
    .replace(/[\\/]/g, "_")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 255);

  return normalized || "clinical-attachment";
}

export function buildClinicalAttachmentObjectPath(
  clinicId: string,
  patientId: string,
  objectId: string,
  mimeType: ClinicalAttachmentMimeType,
) {
  return `${clinicId}/${patientId}/${objectId}.${extensionByMimeType[mimeType]}`;
}

export function hasAllowedClinicalAttachmentSignature(
  mimeType: ClinicalAttachmentMimeType,
  bytes: ArrayLike<number>,
) {
  const startsWith = (signature: readonly number[]) =>
    signature.every((byte, index) => bytes[index] === byte);

  if (mimeType === "application/pdf") {
    return startsWith([0x25, 0x50, 0x44, 0x46, 0x2d]);
  }

  if (mimeType === "image/jpeg") {
    return startsWith([0xff, 0xd8, 0xff]);
  }

  return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

export function formatClinicalAttachmentSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
