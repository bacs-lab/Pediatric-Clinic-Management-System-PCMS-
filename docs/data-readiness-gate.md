# Data Readiness Gate

The application may be connected to actual infrastructure only in this order:

1. Local Supabase with synthetic seed data.
2. Non-production Supabase project with synthetic or approved anonymized data.
3. Legacy migration rehearsal with authorized export, encrypted handling, mapping, reconciliation, and rollback evidence.
4. Production data only after the approvals in `docs/production-blockers.md` are complete.

Real patient names, contact details, medical history, billing records, uploaded files, IDs, screenshots, logs, and database dumps must not be added to this repository.

Before replacing synthetic data with a real database-backed implementation, every item below must be true:

- Core CRUD and lifecycle flows are implemented as server actions or route handlers with Zod validation.
- Every exposed table has RLS policies and direct negative tests.
- Staff/guardian/admin workflows use Supabase Auth and approved role memberships.
- MFA enrollment and `aal2` gates are implemented for privileged and sensitive actions.
- Clinical records have draft, final, addendum, and void behavior without ordinary hard delete.
- Appointment collision and queue numbering are enforced in PostgreSQL and concurrency-tested.
- Inventory/vaccination movements are atomic ledger operations.
- CSV exports are filtered, audited, and formula-injection safe.
- Private Storage policies and signed URL expiry tests pass.
- Backup/restore, incident response, retention, access review, and rollback runbooks are approved.
