# Contributing

PCMS v2 changes must be made on feature branches and reviewed before merge.

Rules:

- Use synthetic data only.
- Do not commit `.env` files, dumps, uploads, generated dependency folders, or production endpoints.
- Keep migrations in `supabase/migrations`.
- Add or update tests for authorization, data integrity, exports, and clinical/billing/inventory workflows.
- Update `docs/requirements-traceability.md` when requirement status changes.
- Update `docs/implementation-progress.md` for every implementation change.
- Do not claim production readiness without the approvals listed in `docs/production-blockers.md`.
