"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getHashParams() {
  if (!window.location.hash.startsWith("#")) {
    return null;
  }

  return new URLSearchParams(window.location.hash.slice(1));
}

export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hashParams = getHashParams();
    const accessToken = hashParams?.get("access_token");
    const refreshToken = hashParams?.get("refresh_token");
    const error = hashParams?.get("error");
    const type = hashParams?.get("type");

    if (error) {
      window.history.replaceState(null, "", window.location.pathname);
      router.replace("/login?auth=failed");
      return;
    }

    if (!accessToken || !refreshToken) {
      return;
    }

    const supabase = createClient();

    void supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then(({ error: sessionError }) => {
        window.history.replaceState(null, "", window.location.pathname);

        if (sessionError) {
          router.replace("/login?auth=failed");
          return;
        }

        router.replace(
          type === "recovery" ? "/login/update-password" : "/staff",
        );
      });
  }, [router]);

  return null;
}
