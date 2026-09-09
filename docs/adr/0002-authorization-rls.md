# ADR 0002: Authorization and RLS Defaults

Date: 2026-08-22

## Status

Proposed pending stakeholder approval.

## Decision

Use database memberships and PostgreSQL RLS as the authorization authority. UI checks are convenience only.

Default roles:

- `doctor`: clinic patient access and clinical authoring/finalization.
- `secretary` / `staff`: appointments, queue, approved demographics, billing, and inventory.
- `guardian`: linked children only, with read-only clinical access subject to release policy.
- `admin`: accounts, roles, status, and configuration; no automatic clinical access.

## Notes

Policies must not use user-editable metadata. If JWT app metadata or custom claims are later used for performance, database checks remain authoritative and revocation behavior must be documented.
