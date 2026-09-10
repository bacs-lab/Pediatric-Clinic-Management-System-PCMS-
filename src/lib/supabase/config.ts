export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (
    !url ||
    !publishableKey ||
    publishableKey === "replace-with-local-publishable-key"
  ) {
    return null;
  }

  return { publishableKey, url };
}

export function getPcmsAppUrl() {
  const value =
    process.env.PCMS_APP_URL ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "http://localhost:3000");

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL plus NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return config;
}

export function getSupabaseServiceConfig() {
  const config = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !config ||
    !serviceRoleKey ||
    serviceRoleKey === "server-only-local-development-placeholder"
  ) {
    return null;
  }

  return { serviceRoleKey, url: config.url };
}
