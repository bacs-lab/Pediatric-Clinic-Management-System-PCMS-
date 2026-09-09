import { KeyRound } from "lucide-react";
import Link from "next/link";
import { updatePasswordAction } from "@/features/auth/actions";

const authMessages: Record<string, string> = {
  failed:
    "Supabase could not update the password. Use a fresh recovery link and try again.",
  invalid:
    "Passwords must match and use at least 12 characters with uppercase, lowercase, number, and symbol characters.",
};

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
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
              <h1 className="text-3xl">Set Password</h1>
            </div>
            <span className="metric-card-icon">
              <KeyRound size={20} aria-hidden="true" />
            </span>
          </div>
          {message ? (
            <div className="mt-4 rounded-md border border-clinic-line bg-white px-3 py-2 text-sm">
              {message}
            </div>
          ) : null}
          <form action={updatePasswordAction} className="mt-5 grid gap-4">
            <label className="grid gap-1 text-sm">
              <span>New password</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;\\|,.<>/?`~])\S{12,}"
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Confirm password</span>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;\\|,.<>/?`~])\S{12,}"
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <button type="submit" className="primary-btn justify-center">
              Save password
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
