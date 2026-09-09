"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { mfaCodeSchema } from "@/features/demo/validation";
import { createClient } from "@/lib/supabase/client";

type ChallengeState = "loading" | "ready" | "verified" | "blocked";

export function MfaChallenge() {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<ChallengeState>("loading");

  useEffect(() => {
    let active = true;

    async function startChallenge() {
      const supabase = createClient();
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (!active) {
        return;
      }

      if (aal.error) {
        setMessage("MFA session check failed. Sign in again.");
        setState("blocked");
        return;
      }

      if (aal.data.currentLevel === "aal2") {
        router.replace("/staff");
        return;
      }

      const factors = await supabase.auth.mfa.listFactors();

      if (!active) {
        return;
      }

      if (factors.error) {
        setMessage("MFA factors could not be loaded.");
        setState("blocked");
        return;
      }

      const factor = factors.data.totp.find(
        (item) => item.status === "verified",
      );

      if (!factor) {
        setMessage("No verified authenticator factor is linked.");
        setState("blocked");
        return;
      }

      const challenge = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

      if (!active) {
        return;
      }

      if (challenge.error) {
        setMessage("MFA challenge could not be started.");
        setState("blocked");
        return;
      }

      setFactorId(factor.id);
      setChallengeId(challenge.data.id);
      setState("ready");
    }

    void startChallenge();

    return () => {
      active = false;
    };
  }, [router]);

  async function verifyCode() {
    const parsed = mfaCodeSchema.safeParse({ code });

    if (!parsed.success || !factorId || !challengeId) {
      setMessage("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setMessage("");
    const supabase = createClient();
    const verify = await supabase.auth.mfa.verify({
      challengeId,
      factorId,
      code: parsed.data.code,
    });

    if (verify.error) {
      setMessage("Authenticator code was not accepted.");
      return;
    }

    setState("verified");
    router.replace("/staff");
    router.refresh();
  }

  return (
    <section className="panel w-full">
      <div className="panel-header">
        <div>
          <p className="eyebrow">PCMS v2.0</p>
          <h1 className="text-3xl">Authenticator Check</h1>
        </div>
        <span className="metric-card-icon">
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
      </div>
      {message ? (
        <div className="mt-4 rounded-md border border-clinic-line bg-white px-3 py-2 text-sm">
          {message}
        </div>
      ) : null}
      <div className="mt-5 grid gap-4">
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
            disabled={state !== "ready"}
          />
        </label>
        <button
          type="button"
          className="primary-btn justify-center"
          onClick={verifyCode}
          disabled={state !== "ready"}
        >
          Verify
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/login" className="secondary-btn">
          Back to login
        </Link>
        <span className="status-badge">
          {state === "loading"
            ? "Preparing challenge"
            : state === "verified"
              ? "Verified"
              : state === "blocked"
                ? "Action needed"
                : "Ready"}
        </span>
      </div>
    </section>
  );
}
