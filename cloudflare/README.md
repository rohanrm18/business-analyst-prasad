# Prasad Business Analyst — Cloudflare sync foundation

This is a deployment-ready **foundation**, not an active production service. It stores encrypted payload strings only; it does not yet connect to Tally or perform encryption/decryption.

## Endpoints

- `GET /health` — public health check.
- `POST /api/sync` — authenticated snapshot upload.
- `GET /api/latest?company_key=<64-char-sha256-hex>` — authenticated retrieval of the latest ciphertext.

Every sync request requires `Authorization: Bearer <SYNC_TOKEN>`. Configure the token with Wrangler secrets; never put it in this repository or the mobile app. The Worker validates a 64-character lowercase SHA-256 company identifier and limits ciphertext size. It does not accept plaintext report fields.

## Free-tier setup (when the owner is ready)

1. Create a Cloudflare account and install Wrangler on a trusted development computer.
2. From this folder, create a D1 database named `prasad-business-analyst`.
3. Replace the placeholder `database_id` in `wrangler.toml` with the actual ID.
4. Apply `schema.sql` to that D1 database.
5. Set a long random secret using `wrangler secret put SYNC_TOKEN`.
6. Deploy with Wrangler and test only using synthetic ciphertext first.

Do not paste secrets into GitHub, chat, source files, or the browser app. Do not use real accounting data until the office agent has client-side authenticated encryption, key recovery/rotation, device authorization, audit logging, tested backups and a documented recovery procedure.

## Security boundaries and current limitations

- Cloudflare D1 stores the ciphertext string, not readable Tally JSON. Encryption/decryption is **not implemented here**; an authenticated office agent must encrypt before upload and an authorized phone must decrypt after download.
- The initial shared bearer secret is a bootstrap gate, not final multi-user/device security. Production should use per-device credentials, revocation and least-privilege roles.
- No Tally connector, report mapping, offline phone cache, voucher write-back, reminders or team management is connected yet.
- HTTPS is provided by the Cloudflare edge after deployment. Never expose Tally's local XML/HTTP port to the public internet.
- Free-tier quotas and terms can change; monitor usage and keep independent backups.

This foundation intentionally has no endpoint for creating, editing or deleting Tally vouchers.
