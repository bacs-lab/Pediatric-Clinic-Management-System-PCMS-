"use client";

import { ShieldPlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { mfaCodeSchema, mfaFactorSchema } from "@/features/demo/validation";
import { createClient } from "@/lib/supabase/client";

type TotpFactor = {
  id: string;
  friendly_name?: string;
  status: string;
  factor_type: string;
};

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function MfaManagement() {
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadFactors() {
    const supabase = createClient();
    const result = await supabase.auth.mfa.listFactors();

    if (result.error) {
      setMessage("MFA factors could not be loaded.");
      return;
    }

    setFactors(result.data.totp);
  }

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    void supabase.auth.mfa.listFactors().then((result) => {
      if (!active) {
        return;
      }

      if (result.error) {
        setMessage("MFA factors could not be loaded.");
        return;
      }

      setFactors(result.data.totp);
    });

    return () => {
      active = false;
    };
  }, []);

  async function startEnrollment() {
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const result = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "PCMS authenticator",
      issuer: "PCMS",
    });

    setBusy(false);

    if (result.error) {
      setMessage("MFA enrollment could not be started.");
      return;
    }

    setEnrollment({
      factorId: result.data.id,
      qrCode: result.data.totp.qr_code,
      secret: result.data.totp.secret,
    });
  }

  async function verifyEnrollment() {
    const parsed = mfaCodeSchema.safeParse({ code });

    if (!parsed.success || !enrollment) {
      setMessage("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const challenge = await supabase.auth.mfa.challenge({
      factorId: enrollment.factorId,
    });

    if (challenge.error) {
      setBusy(false);
      setMessage("MFA challenge could not be started.");
      return;
    }

    const verify = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code: parsed.data.code,
    });

    setBusy(false);

    if (verify.error) {
      setMessage("Authenticator code was not accepted.");
      return;
    }

    setCode("");
    setEnrollment(null);
    setMessage("Authenticator factor enabled.");
    await loadFactors();
  }

  async function removeFactor(factorId: string) {
    if (
      !window.confirm(
        "Remove this authenticator factor? You may need another verified sign-in method to keep access.",
      )
    ) {
      return;
    }

    const parsed = mfaFactorSchema.safeParse({ factorId });

    if (!parsed.success) {
      setMessage("Choose a valid MFA factor.");
      return;
    }

    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const result = await supabase.auth.mfa.unenroll({
      factorId: parsed.data.factorId,
    });

    setBusy(false);

    if (result.error) {
      setMessage(
        "MFA factor could not be removed. Re-authenticate with MFA first.",
      );
      return;
    }

    setMessage("MFA factor removed.");
    await loadFactors();
  }

  return (
    <div className="grid gap-5">
      {message ? (
        <div className="panel text-sm" role="status">
          {message}
        </div>
      ) : null}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="text-lg font-semibold">Authenticator App</h2>
            <p className="mt-1 text-sm text-clinic-muted">
              TOTP MFA is available on the current Supabase plan.
            </p>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={startEnrollment}
            disabled={busy}
          >
            <ShieldPlus size={18} aria-hidden="true" />
            Enroll
          </button>
        </div>
        {enrollment ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="rounded-md border border-clinic-line bg-white p-3">
              <Image
                src={enrollment.qrCode}
                alt="Authenticator enrollment QR code"
                width={196}
                height={196}
                unoptimized
                className="h-auto w-full"
              />
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span>Manual secret</span>
                <input
                  value={enrollment.secret}
                  readOnly
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>6-digit code</span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.trim())}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={verifyEnrollment}
                  disabled={busy}
                >
                  Verify and Enable
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEnrollment(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2 className="text-lg font-semibold">Linked Factors</h2>
          <span className="status-badge">{factors.length} total</span>
        </div>
        <div className="mt-4 grid gap-2">
          {factors.length ? (
            factors.map((factor) => (
              <div
                key={factor.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-clinic-line bg-white px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-semibold">
                    {factor.friendly_name ?? "Authenticator app"}
                  </span>
                  <span className="ml-2 text-clinic-muted">
                    {factor.status}
                  </span>
                </div>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => void removeFactor(factor.id)}
                  disabled={busy}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-clinic-line bg-white px-3 py-2 text-sm">
              No authenticator factors linked.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
