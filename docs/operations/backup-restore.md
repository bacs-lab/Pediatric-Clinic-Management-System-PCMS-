# Backup and Restore Runbook

Production restore targets are not approved.

Before production:

1. Confirm Supabase plan, region, PITR availability, RPO, and RTO.
2. Schedule restore drills using synthetic or approved non-production data only.
3. Document responsible operator, escalation path, and evidence collection.
4. Validate application startup after restore.
5. Record row counts, financial totals, inventory balances, and audit-event continuity.

No real patient data may be used in local restore tests.
