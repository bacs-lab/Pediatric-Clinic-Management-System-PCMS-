# PCMS v2

PCMS v2 is a controlled replatform of the Pediatric Clinic Management System from the legacy Vite/React/Express/MongoDB prototype to a strict TypeScript Next.js App Router application with Supabase Auth, PostgreSQL, Row Level Security, and private Storage design.

Production use is blocked until the owner, clinical representative, privacy/security reviewer, and technical reviewer approve the legal, privacy, hosting, retention, recovery, access-control, and operating decisions listed in `docs/production-blockers.md`.

## Baseline

- Legacy baseline: `main` at `e0f0b7461b878f434fc8e89dedca48f18501ed4d`
- Work branch: `feat/pcms-v2-supabase-replatform`
- Legacy recovery: Git history. An annotated `legacy-mern-v1` tag is recommended but has not been created because owner approval is required before adding preservation refs.

## Safety Rules

- Use only synthetic fixtures.
- Do not commit PHI, credentials, database dumps, `.env` files, production endpoints, logs, screenshots with sensitive data, or signed URLs.
- Supabase service-role keys are server-only and must never be exposed through `NEXT_PUBLIC_` variables or browser code.
- Administrative status does not grant clinical access by itself.

## Local Setup

Prerequisites:

- Node.js 22+
- npm 10+
- Supabase CLI compatible with the local config

Commands:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Replace the placeholder values in `.env.local` with the Supabase project URL
and publishable key from Project Settings -> API. The login page is available at
`/login`, and `/api/health/database` reports whether the configured URL/key can
reach Supabase.

Local Supabase workflow:

```bash
supabase start
supabase db reset
npm run supabase:types
```

Verification:

```bash
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
```

## Current Scope

This branch currently contains the Phase 0/Phase 1 foundation plus early functional slices: repository hygiene, Next.js App Router scaffold, reused PCMS visual styling, Supabase SSR helpers, normalized migration, RLS policies, synthetic/Supabase read model, validated server actions for key staff workflows, CSV report exports, CI skeleton, and governance documentation. Remaining workflow depth is tracked in `docs/requirements-traceability.md`.
