# ADR 0001 / CR-06: Replatform MERN to Next.js and Supabase

Date: 2026-08-22

## Status

Accepted for non-production implementation. Production approval is blocked.

## Context

The legacy implementation is a Vite/React frontend with an Express/Mongoose backend and MongoDB persistence. The reviewed v2 technical direction requires a single strict-TypeScript Next.js App Router application backed by Supabase Auth, PostgreSQL, Row Level Security, and private Storage.

The SRS, SDD, and SPMP contain older MERN technology clauses. The new medical-records stack specification supersedes those architecture clauses while preserving valid functional requirements.

## Decision

Replace the legacy runtime on `feat/pcms-v2-supabase-replatform` with a root Next.js App Router application and versioned Supabase SQL migrations. Keep Git history as the legacy fallback and seek owner approval before creating an annotated `legacy-mern-v1` preservation tag.

## Consequences

- Existing Express/Mongoose runtime files and committed dependencies are removed from the v2 branch.
- Authorization moves from application-centric JWT checks to PostgreSQL RLS plus server-side identity verification.
- Medical, billing, inventory, and audit records default to restrictive deletion behavior.
- Production remains blocked until legal/privacy, Supabase plan/region, retention, recovery, and role-matrix approvals are complete.
