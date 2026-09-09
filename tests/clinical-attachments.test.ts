import { describe, expect, it } from "vitest";
import {
  buildClinicalAttachmentObjectPath,
  CLINICAL_ATTACHMENT_SIGNED_URL_SECONDS,
  formatClinicalAttachmentSize,
  hasAllowedClinicalAttachmentSignature,
  normalizeClinicalAttachmentFilename,
} from "@/lib/clinical-attachments";

describe("clinical attachments", () => {
  it("builds opaque clinic and patient scoped object paths", () => {
    expect(
      buildClinicalAttachmentObjectPath(
        "clinic-id",
        "patient-id",
        "object-id",
        "application/pdf",
      ),
    ).toBe("clinic-id/patient-id/object-id.pdf");
  });

  it("normalizes original filenames without using them in object paths", () => {
    expect(
      normalizeClinicalAttachmentFilename(" ../lab\\result.pdf\u0000 "),
    ).toBe(".._lab_result.pdf");
    expect(normalizeClinicalAttachmentFilename("\u0000\u001f")).toBe(
      "clinical-attachment",
    );
  });

  it("checks signatures for each accepted media type", () => {
    expect(
      hasAllowedClinicalAttachmentSignature(
        "application/pdf",
        [0x25, 0x50, 0x44, 0x46, 0x2d],
      ),
    ).toBe(true);
    expect(
      hasAllowedClinicalAttachmentSignature("image/jpeg", [0xff, 0xd8, 0xff]),
    ).toBe(true);
    expect(
      hasAllowedClinicalAttachmentSignature(
        "image/png",
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      ),
    ).toBe(true);
    expect(
      hasAllowedClinicalAttachmentSignature(
        "application/pdf",
        [0x3c, 0x73, 0x76, 0x67, 0x3e],
      ),
    ).toBe(false);
  });

  it("keeps signed links short-lived and formats file sizes", () => {
    expect(CLINICAL_ATTACHMENT_SIGNED_URL_SECONDS).toBe(60);
    expect(formatClinicalAttachmentSize(512)).toBe("512 B");
    expect(formatClinicalAttachmentSize(1536)).toBe("1.5 KB");
    expect(formatClinicalAttachmentSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
