# MFA Support Procedure

This procedure applies to Supabase Auth TOTP factors used by PCMS v2.

## Password Recovery

1. User selects `Forgot password?` on `/login` and submits the account email.
2. PCMS always returns a neutral response that does not disclose whether the account exists.
3. User follows the Supabase recovery email to `/auth/callback`, which exchanges the PKCE code or recovery token and opens `/login/update-password`.
4. User sets a password that satisfies the PCMS password controls.
5. PCMS clears the recovery session and requires a fresh login with the new password.

The deployment's `<PCMS_APP_URL>/auth/callback` URL must be present in the Supabase Auth redirect allow list.

## User Enrollment

1. User signs in with email and password.
2. User opens `/staff/security`.
3. User selects `Enroll`, scans the QR code in an authenticator app, and enters the 6-digit code.
4. PCMS verifies the factor through Supabase Auth and records the session at `aal2`.

## Login Challenge

1. User signs in with email and password.
2. If Supabase reports `currentLevel = aal1` and `nextLevel = aal2`, PCMS redirects to `/login/mfa`.
3. User enters the 6-digit authenticator code.
4. Supabase verifies the challenge and refreshes the session to `aal2`.

## Lost Authenticator

Production support must not remove MFA factors based only on an email or chat request.

Required checks before factor removal:

1. Verify the requester's identity using the clinic-approved identity proofing process.
2. Confirm the account email and role with a clinic administrator.
3. Record the reason, verifier, timestamp, and affected user in the support log.
4. Remove the stale factor from Supabase Dashboard Auth user details or through a server-only admin script using the service-role key.
5. Ask the user to sign in and enroll a new authenticator factor.

## Restrictions

- Service-role keys must remain server-only and must never be placed in browser code or committed files.
- A user with an existing verified factor should only remove it from `/staff/security` after completing MFA for the current session.
- Database-wide restrictive AAL2 RLS was approved and applied on 2026-09-10. Real patient data use remains blocked by the unresolved role-matrix and guardian identity-proofing decisions in `docs/production-blockers.md`.
