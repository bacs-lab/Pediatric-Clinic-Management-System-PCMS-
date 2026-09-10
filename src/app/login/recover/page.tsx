import { Mail } from "lucide-react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { getPcmsAppUrl, getSupabaseConfig } from "@/lib/supabase/config";

const authMessages: Record<string, string> = {
  failed: "The recovery email could not be sent. Wait briefly and try again.",
  invalid: "Enter a valid email address.",
  unavailable:
    "Password recovery is not configured. Set PCMS_APP_URL to this application's public origin.",
};

export default async function RecoverPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const canRecover = Boolean(getSupabaseConfig() && getPcmsAppUrl());
  const message = resolvedSearchParams.auth
    ? authMessages[resolvedSearchParams.auth]
    : null;

  return (
    <main className="pcms-shell">
      <section className="mx-auto grid min-h-screen w-full max-w-xl place-items-center px-4 py-10">
        <section className="panel w-full">
          <div className="panel-header">
            <div>
              <p className="eyebrow">PCMS v2.0</p>
              <h1 className="text-3xl">Recover Password</h1>
            </div>
            <span className="metric-card-icon">
              <Mail size={20} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-sm leading-6">
            Enter the email address assigned to your PCMS account.
          </p>
          {message ? (
            <div className="mt-4 rounded-md border border-clinic-line bg-white px-3 py-2 text-sm">
              {message}
            </div>
          ) : null}
          <form action={requestPasswordResetAction} className="mt-5 grid gap-4">
            <label className="grid gap-1 text-sm">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="primary-btn justify-center"
              disabled={!canRecover}
            >
              Send recovery link
            </button>
          </form>
          <Link href="/login" className="secondary-btn mt-4 justify-center">
            Back to login
          </Link>
        </section>
      </section>
    </main>
  );
}
