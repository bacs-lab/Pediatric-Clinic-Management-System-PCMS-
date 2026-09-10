# Production Blockers

Production use, real patient data, and cutover are blocked until these decisions are approved in writing:

See `docs/data-readiness-gate.md` for the required sequence before moving from synthetic local data to real database-backed data.

1. Jurisdiction, responsible organization, privacy contacts, consent/notice model, data-subject request process, retention schedule, and breach response.
2. Whether HIPAA applies. If it applies, the hosted Supabase plan, BAA/add-on, project classification, and customer controls must be confirmed.
3. Supabase region, plan, support level, SSL/network controls, RPO, RTO, PITR, backup restore-test cadence, and written acceptance if remaining on Free tier without leaked-password protection.
4. Final role matrix, guardian identity proofing, and account approval flow. Database-wide AAL2 restrictive RLS was explicitly approved and applied on 2026-09-10.
5. Appointment duration, business hours, holiday handling, cancellation rules, and overlap definition.
6. Clinical record finalization, addendum, void, legal hold, export, and retention rules.
7. Inventory units, lot/expiry handling, reversal behavior, valuation, and stock adjustment permissions.
8. Billing correction/void rules, receipt requirements, and daily export fields.
9. Legacy data migration authorization, mapping, reconciliation, and rollback plan.
10. Incident response, access review, key rotation, monitoring, alerting, and release sign-off.
