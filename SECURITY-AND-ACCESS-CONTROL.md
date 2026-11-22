# Prasad Business — Security & Access-Control Specification

## Approved access model

One application, individual accounts, role-based and owner-controlled permissions. The app name remains undecided. Label printing remains a separate worker-facing app; it must not receive or expose business financial data.

| Role | Default access |
|---|---|
| Owner | All business modules, figures, settings, user administration and recovery controls |
| Accountant | Accounts, payments and reports only where explicitly granted |
| CA | GST working and approved accounting reports only |
| Manager | Assigned orders, stock, production and dispatch operations |
| Worker | No main-app access unless the Owner explicitly invites and authorises the account |

All permissions are deny-by-default. User role and permission claims sent by the browser are never trusted. Every protected API request must authenticate the session and enforce permissions on the server. The Owner can grant/revoke module permissions; no user can promote themselves or grant permissions.

## Required controls

- Unique account per person; no shared staff passwords.
- Passwords stored only as salted, slow password hashes (PBKDF2 or a reviewed equivalent), never plaintext.
- MFA required for Owner and privileged administrators. Use TOTP or a reviewed passkey provider; recovery codes are single-use and hashed.
- Short-lived sessions, idle timeout, absolute expiry, logout and owner-triggered revocation of sessions/devices.
- Login throttling, temporary lockout, generic login errors and security-event audit.
- HTTPS for every client/server connection; encrypted database/storage and encrypted backups.
- Server-side authorisation for every read, write, export, report, backup and restore operation.
- Append-only audit records for login, denied access, user/role changes, exports, financial edits, backup/restore and sensitive settings.
- Owner recovery procedure with verified identity, offline recovery codes and tested restore; never a universal hard-coded bypass.
- Sensitive exports and backup downloads require re-authentication and audit.
- Label Studio must use a separate, restricted data/API boundary and must never receive sales totals, purchase totals, customer balances, supplier balances, margins, profit or accounting reports.
- Automatic logout on inactivity and session invalidation when an account is suspended or permissions are revoked.

## D1 migration added

`0002_security.sql` defines the user, per-user permission, session, login-throttling, audit-log and recovery-code tables. It is a database schema foundation only; it does not itself activate login or secure existing browser-local records.

## Current implementation status — do not overstate

The current PWA still stores most operational and financial records in browser localStorage. The existing Cloudflare Worker sync foundation uses a shared service token and encrypted-payload snapshot endpoint; it is not a multi-user authentication system. The migration must be applied to a real D1 database, and authentication/session/MFA/permission middleware must be implemented and deployed before real financial records are moved to shared cloud storage.

The current app must not be represented as production-secure or multi-user-ready. Do not upload real financial documents or expose real sales/purchase/profit data to staff until the complete controls are deployed and independently tested.

## Mandatory acceptance tests before go-live

1. Unauthenticated requests cannot read or change any business data.
2. Accountant, CA, Manager and Worker cannot access routes outside their permissions, including by calling APIs directly.
3. Changing browser role values or request payloads cannot elevate access.
4. Owner MFA is required; invalid/replayed TOTP and used recovery codes are rejected.
5. Login throttling and lockout work; no user enumeration through error messages.
6. Idle expiry, absolute expiry, logout, suspension and owner session revocation all invalidate sessions server-side.
7. Every denied access and privileged action creates an audit record.
8. Export, backup and restore endpoints enforce permissions and re-authentication.
9. Cross-user/company data access is blocked at the database/API boundary.
10. Label Studio cannot query or infer private financial data.
11. Backup restore, key rotation and account recovery are tested using synthetic data before production.
