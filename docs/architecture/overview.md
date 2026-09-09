# Architecture Overview

PCMS v2 is a single root Next.js App Router application.

```text
Browser
  -> Next.js Server Components / Route Handlers / Server Actions
  -> Supabase Auth for identity and MFA
  -> Supabase PostgreSQL with RLS as authorization authority
  -> Supabase private Storage for clinical attachments
```

Key paths:

- `src/app`: route tree and pages
- `src/lib/supabase`: SSR browser/server/proxy clients
- `src/lib/auth`: server-side identity and AAL gates
- `src/lib/reports`: CSV export helpers
- `supabase/migrations`: schema and RLS authority
- `docs`: decisions, traceability, operations, security

The application must not trust UI route guards for authorization. Database policies and validated server-side identity checks are the enforcement boundary.
