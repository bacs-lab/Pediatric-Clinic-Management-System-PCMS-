import { MfaChallenge } from "@/components/mfa-challenge";

export default function MfaPage() {
  return (
    <main className="pcms-shell">
      <section className="mx-auto grid min-h-screen w-full max-w-xl place-items-center px-4 py-10">
        <MfaChallenge />
      </section>
    </main>
  );
}
