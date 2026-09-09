import { LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { loginAction } from "@/features/auth/actions";
import { getSupabaseConfig } from "@/lib/supabase/config";

const authMessages: Record<string, string> = {
  failed: "The email or password was not accepted by Supabase Auth.",
  invalid: "Enter a valid email and a password with at least 8 characters.",
  recovered: "Password updated. Sign in with the new password.",
  "signed-out": "You have been signed out.",
  "supabase-required":
    "Add real Supabase URL and publishable key values to .env.local before signing in.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const hasSupabase = Boolean(getSupabaseConfig());
  const message = resolvedSearchParams.auth
    ? authMessages[resolvedSearchParams.auth]
    : null;

  return (
    <main className="pcms-shell">
      <section className="mx-auto grid min-h-screen w-full max-w-5xl place-items-center px-4 py-10">
        <div className="grid w-full gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="dashboard-hero">
            <div className="flex items-center gap-4">
              <Image
                src="/pcms-logo.png"
                alt="Kids First Pediatric Clinic"
                width={72}
                height={72}
                priority
              />
              <div>
                <p className="eyebrow">PCMS v2.0</p>
                <h1>Staff Login</h1>
              </div>
            </div>
            <p className="mt-6 max-w-xl text-base leading-7">
              Sign in with a Supabase Auth account linked to an active clinic
              staff profile and membership.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="secondary-btn">
                Home
              </Link>
              <a href="/api/health/database" className="secondary-btn">
                Database Health
              </a>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Sign In</h2>
              <span
                className={
                  hasSupabase ? "status-badge success" : "status-badge warning"
                }
              >
                {hasSupabase ? "Database configured" : "Database missing"}
              </span>
            </div>
            {message ? (
              <div className="mt-4 rounded-md border border-clinic-line bg-white px-3 py-2 text-sm">
                {message}
              </div>
            ) : null}
            <form action={loginAction} className="mt-5 grid gap-4">
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
              <label className="grid gap-1 text-sm">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <button type="submit" className="primary-btn justify-center">
                <LogIn size={18} aria-hidden="true" />
                Sign in
              </button>
            </form>
            {!hasSupabase ? (
              <p className="mt-5 text-sm leading-6">
                Create `.env.local` from `.env.example`, then replace the
                Supabase URL and publishable key placeholders with values from
                your Supabase project API settings.
              </p>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
