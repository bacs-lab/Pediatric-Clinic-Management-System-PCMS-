import { afterEach, describe, expect, it } from "vitest";
import { getPcmsAppUrl } from "@/lib/supabase/config";

const originalAppUrl = process.env.PCMS_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) {
    delete process.env.PCMS_APP_URL;
  } else {
    process.env.PCMS_APP_URL = originalAppUrl;
  }
});

describe("PCMS application URL configuration", () => {
  it("returns a normalized HTTP application origin", () => {
    process.env.PCMS_APP_URL = "https://pcms.example.test/app/path";

    expect(getPcmsAppUrl()).toBe("https://pcms.example.test");
  });

  it("uses localhost when development configuration is missing", () => {
    delete process.env.PCMS_APP_URL;
    expect(getPcmsAppUrl()).toBe("http://localhost:3000");
  });

  it("rejects malformed and non-HTTP URLs", () => {
    process.env.PCMS_APP_URL = "not-a-url";
    expect(getPcmsAppUrl()).toBeNull();

    process.env.PCMS_APP_URL = "ftp://pcms.example.test";
    expect(getPcmsAppUrl()).toBeNull();
  });
});
