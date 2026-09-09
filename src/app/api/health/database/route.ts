import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!getSupabaseConfig()) {
    return NextResponse.json(
      {
        configured: false,
        ok: false,
        reason:
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clinics").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      {
        configured: true,
        ok: false,
        reason: error.message,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    configured: true,
    ok: true,
  });
}
