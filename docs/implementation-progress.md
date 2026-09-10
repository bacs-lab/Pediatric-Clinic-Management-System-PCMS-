# Implementation Progress

Last updated: 2026-09-10

This is the living checkpoint for PCMS v2 implementation. Every implementation change must update this file in the same work slice, alongside any requirement-specific updates in `docs/requirements-traceability.md`.

## Current Rule

- Update this document after every implemented feature, schema change, auth change, verification change, or production-readiness decision.
- Keep entries concrete: what changed, where it lives, how it was verified, and what remains blocked.
- Do not mark production items complete until the approvals in `docs/production-blockers.md` and `docs/data-readiness-gate.md` are satisfied.

## High-Level Status

| Area                  | Status                    | Evidence                                                                                                                                                                                                                                                                                  | Next Gap                                                                     |
| --------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Repository replatform | Implemented foundation    | Root Next.js app, strict TypeScript, Tailwind, CI scripts, legacy runtime removed from branch                                                                                                                                                                                             | Clean final diff and commit when ready                                       |
| Legacy design reuse   | Implemented foundation    | `src/app/globals.css`, `src/components/app-shell.tsx`, `public/pcms-logo.png`                                                                                                                                                                                                             | More screen-level parity polish after workflow depth is complete             |
| Supabase connection   | Connected                 | Project `PCMS` / ref `ewiwbjzlzeprszstnwpr`; `/api/health/database` has returned `200`                                                                                                                                                                                                    | Stabilize local network/dev-server testing; Supabase CLI still not installed |
| Database schema       | Advisor fixes applied     | Supabase migrations through `20260910050125_require_aal2_for_application_tables`; local SQL mirrored in `supabase/migrations`                                                                                                                                                             | Add transaction-level RLS/integration tests                                  |
| Authentication        | Connected; recovery built | `/login`, `/login/recover`, `/auth/callback`, `/login/update-password`, `/login/mfa`, staff/guardian security pages, Supabase Auth user linked to profile                                                                                                                                 | Verify recovery email and MFA end to end in a connected browser              |
| Authorization/RLS     | AAL2 enforced             | RLS enabled on all public tables; all 19 public application tables have a restrictive AAL2 policy; gated Supabase RLS integration tests cover AAL1 denial and AAL2 role/clinic access; clinical attachment objects require AAL2                                                           | Run live integration suite and verify browser MFA flow                       |
| Read model            | Partial                   | `src/features/pcms/read-model.ts` uses Supabase when configured; guardian names and immunization summaries now come from linked data                                                                                                                                                      | Replace remaining provider/clinician placeholder labels                      |
| Staff workflows       | Partial                   | Server actions and forms for patient, guardian linking, appointment, queue check-in/state, assessment/vitals handoff, clinical draft/finalize/addendum/attachments, vaccination recording, inventory, billing lifecycle, audit logging, admin account/role management, confirmations, MFA | Add browser/E2E coverage after login is verified                             |
| Guardian workflows    | Scaffolded                | `/guardian` supports own profile contact update and renders approved linked children, clinical attachments, clinical records, and statements from Supabase                                                                                                                                | Separate guardian-only browser coverage                                      |
| Reports               | Scaffolded                | CSV report routes for appointments, billing, inventory; CSV injection tests                                                                                                                                                                                                               | Confirm report field definitions with owner and add database-backed tests    |
| Production readiness  | Blocked                   | `docs/production-blockers.md`, `docs/data-readiness-gate.md`                                                                                                                                                                                                                              | Legal/privacy/hosting/retention/recovery/access approvals                    |

## Implemented Checkpoints

### 2026-08-22 - Replatform Foundation

- Created root Next.js App Router application with strict TypeScript, Tailwind, ESLint, Vitest, and production build scripts.
- Removed legacy MERN runtime from this feature branch while preserving recovery through Git history.
- Added governance docs: ADRs, production blockers, data-readiness gate, source conflict register, privacy checklist, operations runbooks, ownership review, and requirements traceability.
- Added CI workflow and verification scripts in `package.json`.

Verification:

- `npm.cmd run verify` passed during implementation.

### 2026-08-22 - Supabase Schema and SSR Foundation

- Added Supabase SSR clients in `src/lib/supabase/*`.
- Added initial normalized schema, enum types, constraints, RLS enablement, RLS policies, indexes, and synthetic clinic seed.
- Added database health endpoint at `/api/health/database`.
- Applied the initial migration to Supabase project `PCMS`.
- Seeded one synthetic clinic.

Supabase state as of this checkpoint:

| Item                | Count / State |
| ------------------- | ------------- |
| Auth users          | 1             |
| Clinics             | 1             |
| Profiles            | 1             |
| Staff memberships   | 2             |
| Patients            | 1             |
| Appointments        | 1             |
| Queue entries       | 1             |
| Inventory items     | 1             |
| Billing records     | 1             |
| Billing adjustments | 1             |

Verification:

- Supabase migration list shows `20260822125539_initial_pcms_v2`.
- Supabase SQL confirmed `appointments` table exists.
- `/api/health/database` returned `200` after migration.

Known issues:

- Supabase CLI is not installed locally.
- Supabase changelog fetch could not be checked through the available web tool because the endpoint returns `text/markdown`.
- Local dev-server network checks may intermittently return `TypeError: fetch failed`; Supabase MCP SQL checks succeed.

### 2026-08-22 - Auth and Staff Account

- Added `/login` with Supabase email/password login.
- Added logout action in staff shell.
- Added `AuthHashHandler` to capture Supabase hash redirects.
- Added `/login/update-password` for password recovery flows.
- Linked `benedictneildaculabacud@gmail.com` to an active profile in `PCMS Synthetic Clinic`.
- Granted active `staff` and `admin` memberships.

Verification:

- Supabase SQL confirmed active profile and roles `{staff,admin}`.
- `/login` and `/login/update-password` returned `200`.
- `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run test` passed after recovery-flow implementation.

Remaining:

- User must complete password recovery and verify login in the browser.
- Add automated Supabase Auth/RLS integration tests.

### 2026-08-22 - UI, Read Model, and Early Workflows

- Reused PCMS legacy visual direction with pastel/glass styling and logo.
- Added app shell, navigation, status pills, data table, workflow feedback, and dashboard pages.
- Added staff pages for patients, appointments, queue, clinical records, vaccinations, billing, inventory, reports, audit, and admin.
- Added guardian portal route.
- Added synthetic/Supabase read model with fallback.
- Added server actions and forms for:
  - Patient registration
  - Guardian profile contact update
  - Patient-guardian linking
  - Appointment request
  - Appointment status update
  - Queue check-in
  - Queue state update
  - Clinical draft creation
  - Clinical finalization
  - Clinical addendum creation
  - Inventory item creation
  - Inventory movement recording
  - Billing record creation
  - Billing status update
  - Billing correction and void recording
  - TOTP MFA challenge and staff enrollment
- Inventory read model computes stock on hand from `inventory_movements`.

Verification:

- `npm.cmd run verify` passed after workflow implementation.
- Route checks returned `200` for key staff pages and CSV endpoints during implementation.
- Current tests: 4 test files; 23 local tests pass and 3 Supabase integration tests skip unless explicitly enabled.

Remaining:

- Add transaction-level tests against Supabase for write workflows.
- Confirm receipt/export fields with the owner.

### 2026-08-26 - Advisor-Fix RLS and Index Migrations

- Applied Supabase migration `20260825170415_advisor_fix_rls_indexes`.
- Added local migration `supabase/migrations/20260825170415_advisor_fix_rls_indexes.sql`.
- Added missing policies for `clinics`, `guardian_profiles`, `patient_guardians`, `demographic_change_requests`, `clinical_addenda`, and `clinical_attachments`.
- Consolidated duplicate permissive SELECT policies for `patients`, `appointments`, `encounters`, and `billing_records`.
- Removed the duplicate ordinary audit read deny policy that was being reported as permissive-policy noise.
- Added covering foreign-key indexes for appointment, billing, clinical, demographic-change, inventory, guardian-linking, queue, and audit relationships.
- Applied Supabase migration `20260825170649_consolidate_guardian_profiles_select_policy`.
- Added local migration `supabase/migrations/20260825170649_consolidate_guardian_profiles_select_policy.sql`.
- Consolidated guardian profile SELECT access into one policy for own-guardian and active-staff clinic reads.

Verification:

- Supabase migration list shows `20260822125539_initial_pcms_v2`, `20260825170415_advisor_fix_rls_indexes`, and `20260825170649_consolidate_guardian_profiles_select_policy`.
- Supabase security advisor no longer reports RLS-enabled tables without policies.
- Supabase performance advisor no longer reports missing FK indexes or multiple permissive policies.

Remaining:

- Supabase Auth leaked-password protection remains disabled and must be enabled in the Supabase dashboard: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
- Performance advisor still reports unused-index INFO notices because the database has almost no operational rows. Keep the indexes until real workflow load proves they are unnecessary.
- Add automated staff/guardian RLS tests before treating authorization as complete.

### 2026-08-26 - Billing Create Workflow and Synthetic Operational Data

- Applied Supabase migration `20260825172158_billing_record_create_policy`.
- Added local migration `supabase/migrations/20260825172158_billing_record_create_policy.sql`.
- Added an authenticated insert policy for `billing_records` for active `secretary`, `staff`, and `admin` memberships.
- Added `billingRecordSchema`, `createBillingRecordAction`, billing insert types, and a billing page create form.
- Added validation coverage for non-negative billing totals in minor currency units.
- Seeded safe synthetic operational records in Supabase:
  - Patient: `Synthetic Patient One`
  - Appointment: `2026-08-27 09:00 Asia/Manila`, approved well-child visit
  - Inventory item: `Synthetic Pediatric Syringe`, opening stock 100 pieces
  - Billing record: issued PHP 750.00

Verification:

- Supabase SQL counts: patients `1`, appointments `1`, inventory items `1`, inventory movements `1`, billing records `1`.
- Supabase security advisor remains limited to leaked-password protection disabled.
- Supabase performance advisor remains limited to unused-index INFO notices.

Remaining:

- Browser login still needs to be verified with the user's password/session.
- The MCP SQL wrapper rejected multi-statement role simulation, so the seed was inserted with service-side SQL. The app now has the authenticated UI/action path for creating future billing records after login.

### 2026-08-26 - Clinical Draft, Finalize, and Addendum Workflow

- Applied Supabase migration `20260825182217_clinical_encounter_write_policies`.
- Added local migration `supabase/migrations/20260825182217_clinical_encounter_write_policies.sql`.
- Added RLS policies for active clinical staff to insert draft encounters and finalize only draft encounters.
- Applied Supabase migration `20260825182432_clinical_addenda_final_only_policy`.
- Added local migration `supabase/migrations/20260825182432_clinical_addenda_final_only_policy.sql`.
- Tightened addendum RLS so clinical addenda can only be inserted for final encounters.
- Added `encounterDraftSchema`, `clinicalAddendumSchema`, clinical server actions, encounter/addendum database types, and clinical page forms.
- Updated the read model to count addenda per encounter.
- Seeded safe synthetic clinical records in Supabase:
  - One draft encounter
  - One finalized encounter
  - One addendum linked to the finalized encounter

Verification:

- Supabase SQL counts: draft encounters `1`, final encounters `1`, clinical addenda `1`.
- Supabase security advisor remains limited to leaked-password protection disabled.
- Supabase performance advisor remains limited to unused-index INFO notices.

Remaining:

- Add transaction-level tests for draft creation, finalization immutability, and final-only addenda once the Supabase test harness is in place.
- Add void lifecycle controls if the owner confirms who may void clinical records.

### 2026-08-26 - Guardian Profile and Child-Linking Workflow

- Applied Supabase migration `20260825183136_guardian_profile_linking_policies`.
- Added local migration `supabase/migrations/20260825183136_guardian_profile_linking_policies.sql`.
- Updated guardian-profile SELECT RLS so active staff can see same-clinic guardian profiles before a child link exists.
- Added guardian self-service insert policy for own `guardian_profiles` rows.
- Added `guardianProfileSchema`, `patientGuardianLinkSchema`, guardian profile/link database types, and validation coverage.
- Added `upsertGuardianProfileAction` for guardian contact maintenance.
- Added `createPatientGuardianLinkAction` for staff patient-to-guardian linking with pending/approved/rejected/revoked status.
- Updated the Supabase read model to load guardian profiles, patient guardian links, and profile display names.
- Updated `/guardian` to render approved linked children from real `patient_guardians` data instead of the old hardcoded synthetic guardian filter.
- Updated `/staff/patients` with a guardian-linking form and guardian names in the patient table.
- Seeded one safe synthetic guardian profile and one approved patient link.

Verification:

- Supabase SQL counts: guardian profiles `1`, patient guardian links `1`, approved guardian links `1`.
- Supabase security advisor remains limited to leaked-password protection disabled.
- Supabase performance advisor remains limited to unused-index INFO notices.

Remaining:

- Browser login still needs to be verified with separate guardian-only and staff accounts.
- Add RLS integration tests proving guardians can only see approved linked children and linked clinical/billing records.

### 2026-08-26 - Gated Supabase RLS Integration Tests

- Added `tests/integration/supabase-rls.test.ts`.
- Added `npm run test:integration`.
- Added `RUN_SUPABASE_INTEGRATION_TESTS=0` to `.env.example`.
- Integration suite creates temporary staff and guardian Auth users, two clinics, linked/unlinked patients, appointment, final encounter, billing, and inventory records when enabled.
- Integration assertions cover:
  - Active staff can read same-clinic patients but not another clinic's patient.
  - Guardians can read approved linked patient, appointment, final encounter, and billing records.
  - Guardians cannot read unrelated inventory rows.
  - Staff write policies allow draft encounter creation, finalization, and final encounter addenda.

Verification:

- `npm.cmd run test` passed with 19 local tests and 3 gated integration tests skipped.
- `npm.cmd run test:integration` passed in gated mode with 3 tests skipped.
- Live integration execution is intentionally blocked until `RUN_SUPABASE_INTEGRATION_TESTS=1` and `SUPABASE_SERVICE_ROLE_KEY` are supplied.

Remaining:

- Run `npm.cmd run test:integration` with a service-role key against a non-production Supabase project before production approval.
- Add server-action/browser E2E coverage after login is verified.

### 2026-08-26 - Queue Check-In Workflow

- Applied Supabase migration `20260825185310_queue_check_in_policy_and_constraints`.
- Added local migration `supabase/migrations/20260825185310_queue_check_in_policy_and_constraints.sql`.
- Added staff insert RLS for `queue_entries`.
- Added unique queue constraints so one appointment can only be queued once and one patient can only have one active queue entry per clinic service day.
- Added `queueCheckInSchema`, `checkInQueueAction`, queue insert database types, appointment-linked queue read-model fields, and a staff queue check-in form.
- Queue check-in supports walk-ins and appointment-linked arrivals.
- Appointment-linked check-in validates appointment clinic, patient, and `requested`/`approved` status before queue insertion.
- Queue numbers are assigned from the current highest clinic/day queue number using the Asia/Manila service date.
- Appointment-linked check-in updates the appointment to `checked_in`.
- Extended the gated Supabase RLS integration test to prove active staff can insert queue entries through RLS.
- Seeded one safe synthetic waiting queue entry linked to the synthetic appointment.

Verification:

- Supabase migration list includes `20260825185310_queue_check_in_policy_and_constraints`.
- Supabase SQL counts: queue entries `1`, waiting queue entries `1`, checked-in appointments `1`.
- Supabase security advisor remains limited to leaked-password protection disabled.
- Supabase performance advisor remains limited to unused-index INFO notices.

Remaining:

- Add transaction/retry coverage for simultaneous queue check-ins that race on daily queue number assignment.
- Run live integration tests with a service-role key against a non-production Supabase project before production approval.

### 2026-08-26 - Billing Correction and Void Lifecycle

- Applied Supabase migration `20260825190103_billing_adjustment_lifecycle`.
- Added local migration `supabase/migrations/20260825190103_billing_adjustment_lifecycle.sql`.
- Added append-only `billing_adjustments` with correction/void type, previous/new status, previous/new total, actor, clinic, reason, and timestamps.
- Enabled RLS for billing adjustments.
- Added staff/secretary/admin insert policy for same-clinic billing adjustments.
- Added read policy for same-clinic billing staff and approved linked guardians.
- Added `billingCorrectionSchema`, `billingVoidSchema`, `correctBillingRecordAction`, and `voidBillingRecordAction`.
- Removed direct `void` from ordinary billing status changes; voids now require the dedicated reasoned void form.
- Updated the billing read model and staff billing page to show adjustment counts.
- Extended validation tests and gated Supabase RLS tests for billing adjustments.
- Seeded one safe synthetic billing correction adjustment and updated the synthetic bill total to PHP 800.00.

Verification:

- Supabase migration list includes `20260825190103_billing_adjustment_lifecycle`.
- Supabase SQL seed result: billing adjustments seeded `1`, billing records corrected `1`.
- Supabase SQL counts: billing records `1`, billing adjustments `1`, corrected synthetic billing total `80000`.
- Supabase security advisor remains limited to leaked-password protection disabled.
- Supabase performance advisor remains limited to unused-index INFO notices.

Remaining:

- The correction/void UI writes adjustment history and then updates the billing row in two application calls; add a database transaction/RPC before production if strict atomicity is required.
- Confirm receipt numbering, receipt printing, and daily billing export fields with the owner.

### 2026-08-26 - Auth Password Protection Free-Tier Mitigation

- Checked the available Supabase connector capabilities for Auth security configuration.
- Attempted to open the Supabase dashboard security page through the browser connector, but no controllable browser is available in this session.
- Re-ran the Supabase security advisor for project `ewiwbjzlzeprszstnwpr`.
- Advisor still reports `auth_leaked_password_protection` as `WARN`.
- Confirmed from Supabase documentation and pricing that leaked-password protection is available on Pro plan and above, and is not included on the Free plan.
- Added application-side password hardening for password setup/reset:
  - Minimum 12 characters.
  - Requires lowercase, uppercase, number, and symbol characters.
  - Rejects whitespace.
  - Rejects common project/domain/password fragments such as `password`, `admin`, `clinic`, `pediatric`, `supabase`, and `pcms`.
- Updated `/login/update-password` UI constraints and validation copy.
- Added validation tests for the Free-tier password controls.

Decision:

- Supabase Free tier cannot satisfy the leaked-password advisor directly.
- Continue development and synthetic-data testing on Free tier with compensating app controls.
- For real patient data or production use, either upgrade to a plan with leaked-password protection or obtain written owner/security acceptance of this residual risk.
- Relevant Supabase docs: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
- Relevant Supabase pricing: https://supabase.com/pricing.

Verification:

- `tests/validation.test.ts` covers strong password acceptance and weak/common password rejection.
- Supabase security advisor is expected to keep reporting `auth_leaked_password_protection` while the project remains on Free tier.

### 2026-08-26 - Live Supabase Integration Test Readiness Check

- Checked local environment configuration for live integration prerequisites.
- `.env.example` documents `SUPABASE_SERVICE_ROLE_KEY` and `RUN_SUPABASE_INTEGRATION_TESTS=0`.
- `.env.local` does not currently contain `SUPABASE_SERVICE_ROLE_KEY`.
- Live Supabase integration tests cannot be run yet because the gated suite requires `RUN_SUPABASE_INTEGRATION_TESTS=1` and a service-role key.

Required external action:

- Use a non-production Supabase project for live integration execution.
- Add `SUPABASE_SERVICE_ROLE_KEY` only to `.env.local`; never commit it.
- Set `RUN_SUPABASE_INTEGRATION_TESTS=1` only when intentionally running the live test suite.

Verification after owner action:

- Run `npm.cmd run test:integration`.
- Document pass/fail result here before production approval.

### 2026-08-27 - TOTP MFA Enrollment and Challenge UI

- Verified current Supabase MFA documentation for TOTP enrollment, challenge, verification, factor listing, and AAL checks.
- Added `/login/mfa` challenge screen backed by `supabase.auth.mfa.listFactors()`, `challenge()`, and `verify()`.
- Updated `loginAction` to redirect enrolled users to `/login/mfa` when Supabase reports `currentLevel = aal1` and `nextLevel = aal2`.
- Updated `AppShell` to redirect staff users with an MFA-upgradable session to `/login/mfa` before rendering staff modules.
- Added `/staff/security` with TOTP enrollment, QR code display, manual secret display, enrollment verification, factor listing, and factor removal.
- Added `/guardian/security` so guardians can enroll and manage TOTP factors before accessing linked-child data.
- Added server-side guardian portal MFA gating: unauthenticated users are redirected to login, users without a verified TOTP factor are redirected to `/guardian/security`, and users with an enrolled factor but `aal1` session are redirected to `/login/mfa`.
- Added `mfaCodeSchema` and `mfaFactorSchema` validation.
- Added validation coverage for 6-digit MFA codes and factor identifiers.
- Added `docs/operations/mfa-support.md` with enrollment, login challenge, lost-authenticator, and service-role restrictions.

Verification:

- Supabase docs confirm TOTP MFA API is free and enabled by default.
- Local validation tests cover MFA code and factor input shape.
- Browser enrollment/challenge still needs manual verification after login because no controllable browser is available in this session.

Remaining:

- Verify full browser flow with the staff account: enroll factor at `/staff/security`, sign out, sign in, complete `/login/mfa`.
- Verify full browser flow with a guardian account: enroll factor at `/guardian/security`, open `/guardian`, complete `/login/mfa` when challenged.
- Decide whether MFA should be enforced directly in database RLS before production or kept as SSR/UI gate plus Supabase session AAL checks.

### 2026-08-27 - Staff MFA Enrollment Gate

- Updated `AppShell` so staff data modules require a verified TOTP factor before rendering.
- `/staff/security` is allowed to render without an existing factor so staff users have an enrollment path.
- Enrolled staff sessions that are still `aal1` continue to redirect to `/login/mfa`.
- Guardian MFA enrollment gating remains in `src/app/guardian/page.tsx`.
- Attempted to apply a database-wide restrictive `aal2` RLS migration across all public application tables, but the remote migration was blocked by approval review because it can lock out authenticated sessions that have not completed MFA.

Decision pending:

- Database-enforced MFA is the stronger production posture, but it has broad blast radius. Applying it to Supabase project `ewiwbjzlzeprszstnwpr` requires explicit owner approval.

Verification:

- `npm.cmd run format:write` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test` passed with 23 local tests and 3 gated integration tests skipped.
- `npm.cmd run test:integration` passed in gated mode with 3 tests skipped.
- `npm.cmd run build` passed.

### 2026-08-29 - Assessment Vitals and Handoff Workflow

- Applied Supabase migration `20260828163612_assessment_vitals_workflow`.
- Added local migration `supabase/migrations/20260828163612_assessment_vitals_workflow.sql`.
- Added `assessment_handoff_status` enum and `assessments` table with:
  - Clinic, patient, queue entry, and assessed-by profile references.
  - Pediatric intake vitals fields for temperature, weight, height, heart rate, respiratory rate, oxygen saturation, and paired blood pressure.
  - Chief complaint, notes, handoff status, and timestamps.
  - Clinical bounds and blood-pressure pair constraints.
- Enabled RLS on `assessments`.
- Added clinical-staff insert/update policies and guardian linked-child read access.
- Applied Supabase migration `20260828164634_consolidate_assessments_select_policy`.
- Added local migration `supabase/migrations/20260828164634_consolidate_assessments_select_policy.sql`.
- Consolidated staff and guardian assessment SELECT access into one policy to avoid multiple permissive policy advisor warnings.
- Added `assessmentVitalsSchema` and `assessmentHandoffSchema`.
- Added `createAssessmentAction` and `updateAssessmentHandoffAction`.
- Updated the clinical page with assessment/vitals capture and handoff update controls.
- Updated the Supabase read model and synthetic fallback data to include assessments.
- Extended the gated Supabase RLS integration harness for assessment read/write coverage.
- Seeded one safe synthetic remote assessment linked to the synthetic patient and queue entry.

Verification:

- Supabase migration list includes `20260828163612_assessment_vitals_workflow` and `20260828164634_consolidate_assessments_select_policy`.
- Supabase SQL count: assessments `1`.
- Supabase security advisor remains limited to the accepted Free-tier leaked-password warning.
- Supabase performance advisor no longer reports multiple permissive assessment SELECT policies; unused-index INFO notices remain expected on the small synthetic dataset.
- `npm.cmd run format:write` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test` passed with 24 local tests and 3 gated integration tests skipped.
- `npm.cmd run test:integration` passed in gated mode with 3 tests skipped.
- `npm.cmd run build` passed.

Remaining:

- Add live service-role integration execution against a non-production project.
- Add browser/E2E coverage for assessment capture after login and MFA are verified.

### 2026-08-30 - Vaccination Recording Workflow

- Applied Supabase migration `20260830052834_vaccination_recording_workflow`.
- Added local migration `supabase/migrations/20260830052834_vaccination_recording_workflow.sql`.
- Added `vaccination_records` with:
  - Clinic, patient, administered-by profile, and optional inventory item references.
  - Vaccine name, dose label, lot number, administration timestamp, route, site, next due date, notes, status, and created timestamp.
  - Field length checks and next-due date validation.
- Enabled RLS on `vaccination_records`.
- Added a consolidated SELECT policy for clinical staff and approved linked guardians.
- Added clinical-staff INSERT policy with same-clinic patient and optional inventory item validation.
- Added `vaccinationRecordSchema`.
- Added `createVaccinationRecordAction`.
- Updated `/staff/vaccinations` with a vaccination recording form, vaccination record table, and patient immunization summary table.
- Updated the Supabase read model and synthetic fallback data to include vaccination records.
- Patient immunization summaries now derive from real `vaccination_records` when Supabase is configured.
- Vaccination actions write a linked `inventory_movements` row with quantity `-1` when an inventory item is selected.
- Extended the gated Supabase RLS integration harness for vaccination read/write coverage.
- Seeded one safe synthetic remote vaccination record and one linked inventory movement.

Verification:

- Supabase migration list includes `20260830052834_vaccination_recording_workflow`.
- Supabase SQL count: vaccination records `1`; vaccination-linked inventory movements `1`.
- Supabase security advisor remains limited to the accepted Free-tier leaked-password warning.
- Supabase performance advisor reports only expected unused-index INFO notices on the small synthetic dataset.
- `npm.cmd run format:write` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test` passed with 25 local tests and 3 gated integration tests skipped.
- `npm.cmd run test:integration` passed in gated mode with 3 tests skipped.
- `npm.cmd run build` passed.

Remaining:

- Vaccination record insertion and stock consumption are two application calls; add a database transaction/RPC before production if strict atomicity is required.
- Add live service-role integration execution against a non-production project.
- Add browser/E2E coverage for vaccination recording after login and MFA are verified.

### 2026-08-30 - Clear Confirmation Controls

- Added reusable `ConfirmSubmitButton` for form submissions that need an explicit browser confirmation.
- Added confirmation dialogs to:
  - Clinical encounter finalization.
  - Billing correction.
  - Billing void.
- Added MFA factor removal confirmation before calling Supabase unenroll.
- Added server-side `VOID` confirmation text requirement to billing void validation and action parsing.
- Updated the billing void UI so users must enter both a reason and exact `VOID` confirmation text.
- Added validation coverage proving lowercase/incorrect void confirmation is rejected.

Verification:

- `npm.cmd run format:write` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test` passed with 25 local tests and 3 gated integration tests skipped.
- `npm.cmd run test:integration` passed in gated mode with 3 tests skipped.
- `npm.cmd run build` passed.

Remaining:

- Browser/E2E coverage should verify confirmation prompts once login and MFA are verified.
- Future high-impact actions should reuse `ConfirmSubmitButton` and add server-side typed confirmation where bypass would be risky.

### 2026-08-30 - Database-Backed Audit Event Writes

- Applied Supabase migration `20260830060041_audit_event_insert_policy`.
- Added local migration `supabase/migrations/20260830060041_audit_event_insert_policy.sql`.
- Added an authenticated insert policy for `audit_events` that only allows active users to write audit rows for their own profile and clinic.
- Added a server-side `writeAuditEvent` helper in `src/features/pcms/actions.ts`.
- Threaded best-effort audit writes through sensitive/admin workflows:
  - Patient creation.
  - Guardian profile and patient-guardian link updates.
  - Appointment creation and status updates.
  - Queue check-in and queue state changes.
  - Assessment creation and handoff updates.
  - Encounter draft creation, finalization, and addenda.
  - Inventory item and movement creation.
  - Vaccination recording and linked stock consumption.
  - Billing creation, status updates, corrections, and voids.
- Extended the gated Supabase RLS integration suite with authenticated audit insert and admin clinic audit read assertions.

Verification:

- Supabase migration list includes `20260830060041_audit_event_insert_policy`.
- Supabase security advisor remains limited to the accepted Free-tier leaked-password warning.
- Supabase performance advisor reports only expected unused-index INFO notices on the small synthetic dataset.
- `npm.cmd run format:write` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test` passed with 25 local tests and 4 gated integration tests skipped.
- `npm.cmd run test:integration` passed in gated mode with 4 tests skipped.
- `npm.cmd run build` passed.

Remaining:

- Audit writes are best-effort application calls; add a transactional RPC or outbox before production if audit completeness must be guaranteed for every write.
- Run live service-role integration execution against a non-production project.
- Add browser/E2E coverage for audit-visible workflows after login and MFA are verified.

### 2026-08-30 - Database-Backed Admin Account Management

- Applied Supabase migration `20260830063800_admin_account_management`.
- Added local migration `supabase/migrations/20260830063800_admin_account_management.sql`.
- Added private helper `private.is_clinic_admin(uuid)` for admin-scoped RLS checks.
- Added admin read policies for same-clinic `profiles` and `staff_memberships`.
- Applied Supabase migration `20260830064620_admin_account_management_rpc_lockdown`.
- Added local migration `supabase/migrations/20260830064620_admin_account_management_rpc_lockdown.sql`.
- Removed exposed public admin RPCs after Supabase advisors flagged the `SECURITY DEFINER` surface.
- Consolidated profile and staff-membership read policies to avoid duplicate permissive SELECT policy warnings.
- Added server-only Supabase service-role client in `src/lib/supabase/admin.ts`.
- Replaced the synthetic `/staff/admin` page with a database-backed account and role view.
- Added guarded server actions for profile account status updates, staff-membership status updates, and same-clinic staff role grants/reactivation.
- Added audit writes for admin profile status, staff-membership status, and role grant actions.
- Added validation schemas and tests for admin account/role inputs.
- Extended the gated Supabase RLS integration suite to assert active admins can read same-clinic account and role state.

Verification:

- Supabase migration list includes `20260830063800_admin_account_management` and `20260830064620_admin_account_management_rpc_lockdown`.
- Supabase security advisor is back to only the accepted Free-tier leaked-password warning after removing exposed public admin RPCs.
- Supabase performance advisor reports only expected unused-index INFO notices on the small synthetic dataset.
- `npm.cmd run format:write` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run test` passed with 26 local tests and 5 gated integration tests skipped.
- `npm.cmd run test:integration` passed in gated mode with 5 tests skipped.
- `npm.cmd run build` passed.

Remaining:

- Admin write actions require server-only `SUPABASE_SERVICE_ROLE_KEY`; `.env.example` already documents it, but `.env.local` must provide the real key before browser-testing these actions.
- Browser/E2E coverage should verify that non-admin staff cannot access `/staff/admin` data and that admin writes create audit rows.
- Account invitation/user creation still happens through Supabase Auth/dashboard or a future server-only invite workflow; the in-app admin page manages existing clinic profiles and roles.

### 2026-09-05 - Private Clinical Attachment Storage

- Applied Supabase migration `20260905114259_private_clinical_attachment_storage`.
- Added local migration `supabase/migrations/20260905000100_private_clinical_attachment_storage.sql`.
- Created private `clinical-attachments` Storage bucket with a 10 MB object limit and PDF/JPEG/PNG MIME allowlist.
- Added bucket and clinic/patient path constraints to `clinical_attachments` metadata.
- Replaced attachment metadata policies with AAL2-only reads for authorized staff/approved guardians and AAL2-only inserts for active doctor/staff memberships.
- Added AAL2 Storage policies for clinic/patient-scoped uploads, metadata-backed downloads, and rollback cleanup of orphan objects.
- Applied Supabase migration `20260905114430_optimize_attachment_aal2_policies`.
- Added local migration `supabase/migrations/20260905000200_optimize_attachment_aal2_policies.sql`.
- Optimized attachment policy JWT checks after the performance advisor flagged per-row `auth.jwt()` evaluation.
- Added server-side upload validation for file size, MIME type, original filename, and PDF/JPEG/PNG magic bytes.
- Added opaque UUID object paths that do not expose original filenames and cleanup when metadata persistence fails.
- Added audit events for successful/failed uploads and signed-link downloads without recording filenames.
- Added a 60-second signed download route with no-store and no-referrer response controls.
- Added attachment upload/list/download controls to `/staff/clinical` and approved linked-child attachment downloads to `/guardian`.
- Extended the Supabase read model and generated database type shim with clinical attachment metadata.
- Raised the Next.js Server Action/proxy body limits to 11 MB to accommodate the 10 MB file limit plus multipart overhead.
- Added unit coverage for metadata limits, filename normalization, object paths, accepted magic bytes, size display, and signed-link lifetime.
- Extended the gated Supabase integration suite with TOTP elevation and attachment upload/read/signing denial checks.

Verification:

- Supabase migration list includes `20260905114259_private_clinical_attachment_storage` and `20260905114430_optimize_attachment_aal2_policies`.
- SQL inspection confirms the bucket is private, limited to 10 MB, and restricted to PDF/JPEG/PNG.
- SQL inspection confirms two metadata policies, three Storage object policies, and both metadata integrity constraints.
- Supabase security advisor reports only the accepted Free-tier leaked-password warning.
- Supabase performance advisor reports only expected unused-index INFO notices after the AAL2 policy optimization.
- `npm.cmd run verify` passed, including formatting, lint, strict TypeScript, 31 local tests, and the production build.
- `npm.cmd run test:integration` passed in gated mode with 6 tests skipped because live-test credentials are not configured.
- The local dev server started at `http://localhost:3000`, and `/login` returned `200`.

Remaining:

- Run the gated attachment Storage test with `RUN_SUPABASE_INTEGRATION_TESTS=1` and a service-role key against a non-production project.
- Verify staff upload and approved-guardian download in the browser after the login/MFA session is available.
- Browser automation was unavailable in this session, so the signed-in visual click-through remains pending.
- Confirm the production host accepts 11 MB Server Action bodies or replace the server-mediated upload with a direct signed upload flow.

### 2026-09-10 - Database-Wide AAL2 RLS Enforcement

- Received explicit owner approval to enforce AAL2 at the database boundary.
- Applied Supabase migration `20260910050125_require_aal2_for_application_tables`.
- Added local migration `supabase/migrations/20260910000100_require_aal2_for_application_tables.sql`.
- Added one idempotent restrictive `FOR ALL` policy to each of the 19 current public application tables.
- The policy requires the authenticated JWT `aal` claim to equal `aal2` for both row visibility and inserted/updated row checks.
- Kept MFA enrollment and challenge reachable because `/staff/security`, `/guardian/security`, and `/login/mfa` use Supabase Auth APIs without requiring public-table access.
- Service-role administration remains server-only and is not subject to the `authenticated` policy.
- Added a separate AAL1 integration client that asserts profile/patient reads return no rows and audit inserts are rejected before MFA elevation.

Verification:

- Remote catalog inspection confirms RLS remains enabled and exactly one valid restrictive AAL2 policy exists on every current public application table.
- A rolled-back remote policy evaluation confirmed the same authenticated user's own profile is hidden at AAL1 (`0` rows) and visible at AAL2 (`1` row).
- Supabase security advisor reports only the accepted Free-tier leaked-password warning.
- Supabase performance advisor reports only expected unused-index INFO notices on the small synthetic dataset.
- `npm.cmd run verify` passed, including formatting, lint, strict TypeScript, 31 local tests, and the production build; 7 live integration tests were gated because `SUPABASE_SERVICE_ROLE_KEY` is not configured.

Remaining:

- Run the gated AAL1/AAL2 integration suite when `SUPABASE_SERVICE_ROLE_KEY` is configured for a non-production project.
- Verify enrollment, challenge, logout, and subsequent login in the browser.
- Every future public application table must receive the same restrictive AAL2 policy in its creation migration.

### 2026-09-10 - Self-Service Password Recovery

- Added `/login/recover` and linked it from the login form.
- Added a validated server action that requests a Supabase password recovery email without disclosing whether an account exists.
- Added `/auth/callback` to exchange SSR PKCE authorization codes and accept recovery token hashes before redirecting to `/login/update-password`.
- Kept the existing root hash handler as compatibility for older implicit recovery links.
- Added validated `PCMS_APP_URL` handling so recovery redirects use a configured HTTP(S) origin instead of an untrusted request host.
- Development falls back to `http://localhost:3000` when `PCMS_APP_URL` is absent; production continues to require an explicit configured origin.
- Updated successful password changes to clear the recovery session and return to login so the new password is exercised explicitly.
- Added the local callback URL to `supabase/config.toml` and documented the hosted Supabase redirect allow-list requirement in `README.md`.
- Added password recovery email validation and application URL configuration tests.

Verification:

- `/login`, `/login/recover`, `/login/update-password`, and `/login/mfa` returned `200` from the running development server.
- The rendered recovery form contains its server action and remains enabled when local development uses the localhost URL fallback.
- `/auth/callback` without a valid code or token returned `307` to `/login?auth=failed`.
- Supabase inspection confirms the staff account is email-confirmed, has a configured password, and has signed in previously.
- Supabase inspection found one unverified TOTP factor and no verified factor; database data remains inaccessible until enrollment is completed at AAL2.
- `npm.cmd run verify` passed, including formatting, lint, strict TypeScript, and the production build; the follow-up URL fallback check passes with 35 local tests and 7 live integration tests gated.

Remaining:

- Add `<PCMS_APP_URL>/auth/callback` to the hosted Supabase Auth redirect URL allow list.
- With a controllable browser connected, request a real recovery email, follow the link, set a new password, sign in, remove or complete the pending TOTP enrollment, and verify the session reaches AAL2.
- Do not mark the browser verification complete until that user-session flow is observed.

## Supabase Advisor Findings

Security advisor findings:

- Resolved: RLS enabled with no policies on `clinical_addenda`, `clinical_attachments`, `clinics`, `demographic_change_requests`, `guardian_profiles`, and `patient_guardians`.
- Accepted Free-tier limitation: leaked password protection is disabled in Supabase Auth and cannot be enabled on the Free plan. App-side password hardening is implemented as a compensating control, but real patient data still requires upgrade or written owner/security risk acceptance. Last checked 2026-08-26.

Performance advisor findings:

- Resolved: missing FK indexes on appointment, billing, clinical, inventory, guardian-linking, queue, and audit relationships.
- Resolved: multiple permissive SELECT policies on `patients`, `appointments`, `encounters`, `billing_records`, `guardian_profiles`, `profiles`, and `staff_memberships`.
- Remaining INFO-only notices: unused-index warnings are expected at this stage because the database has almost no operational rows yet; do not remove foundational indexes only because they are currently unused.

## Requirement Progress Snapshot

| Status                | Requirements                                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Implemented           | REQ-32                                                                                                                                                                                                                                                 |
| Scaffolded            | REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10, REQ-11, REQ-12, REQ-13, REQ-14, REQ-15, REQ-16, REQ-17, REQ-18, REQ-19, REQ-20, REQ-21, REQ-22, REQ-23, REQ-24, REQ-25, REQ-26, REQ-30, REQ-31, REQ-33, REQ-34, REQ-36 |
| Demo UI / Demo export | REQ-27, REQ-28, REQ-29                                                                                                                                                                                                                                 |
| Designed              | None                                                                                                                                                                                                                                                   |
| Planned               | None                                                                                                                                                                                                                                                   |
| Documented            | REQ-35                                                                                                                                                                                                                                                 |

## Immediate Implementation Queue

1. Complete the password-recovery and TOTP AAL2 click-through in a connected browser and document the result here.
2. Run live Supabase integration tests with a service-role key against a non-production project.
3. Confirm receipt/export fields with the owner.
