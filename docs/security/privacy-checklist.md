# Security and Privacy Checklist

- [x] Remove committed dependency tree from v2 branch.
- [x] Remove committed user-local `.claude/settings.local.json`.
- [x] Restore `docs/` as a trackable documentation location.
- [x] Add `.env` and dump/upload/export ignores.
- [x] Add Supabase RLS-enabled initial tables.
- [x] Avoid user-editable metadata for authorization.
- [x] Add CSV formula-injection protection utility.
- [x] Add Free-tier compensating password controls for Supabase Auth leaked-password protection gap.
- [ ] Run a full repository and history secret/PHI scan.
- [ ] Generate Supabase types from a verified local reset.
- [ ] Add direct RLS negative tests.
- [x] Add TOTP enrollment/challenge UI and support procedure.
- [ ] Add private Storage bucket and object policies.
- [ ] Configure immutable external audit retention if approved.
