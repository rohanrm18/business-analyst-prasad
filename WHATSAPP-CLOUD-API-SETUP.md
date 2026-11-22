# Prasad Apparels — WhatsApp Cloud API Setup Checklist

## Current status

The repository contains the server-side WhatsApp Cloud API queue, customer opt-in table, scheduled sender and signed webhook handler. It is **not connected to a live Meta account and is not deployed**. Real automatic reminders remain disabled until the steps below and the secure customer-ledger integration are complete.

## Step 1 — Prepare Meta assets

Use Meta's official WhatsApp Business Platform documentation:
https://developers.facebook.com/documentation/business-messaging/whatsapp/overview

You will need:
- A Meta account with access to a Meta business portfolio.
- A WhatsApp Business Account (WABA).
- A business phone number connected to the Cloud API.
- A Meta developer app with WhatsApp product enabled.
- A system-user access token with the permissions required for the selected API operations.
- An approved payment-reminder message template.

Recommendation: use a separate business number for the API unless you deliberately complete Meta's supported coexistence onboarding for an existing WhatsApp Business app number. Do not migrate your everyday number without reviewing the consequences first.

## Step 2 — Test with Meta's test number

1. Open Meta for Developers and create/select the business app.
2. Add the WhatsApp product and open its API setup page.
3. Use the temporary test number and temporary token only for the initial test.
4. Add your own phone as an allowed test recipient.
5. Send Meta's sample template and confirm it arrives.
6. Do not use the temporary token for production; it expires and is intended for setup/testing.

## Step 3 — Connect the real business number

1. Add/register the business phone number in WhatsApp Manager / Cloud API setup.
2. Complete the phone verification and required business/account checks.
3. Create a system user in the Meta business portfolio and grant only the assets/permissions required.
4. Generate the required token. Store it only as a Cloudflare Worker secret.
5. Keep the phone number ID and WABA ID available for configuration. Never paste access tokens or app secrets into GitHub, this chat, screenshots or the browser app.

## Step 4 — Create the payment reminder template

Create a template in WhatsApp Manager, submit it for review and wait for approval. Example body:

"Hello {{1}}, this is a payment reminder from Prasad Apparels. Invoice {{2}} has an outstanding balance of {{3}}, due on {{4}}. Your total outstanding is {{5}}. If you have already paid, please ignore this message and share the payment reference. Thank you."

Use a suitable approved template category as determined by Meta, select the required language, and record the exact template name and parameter order. The application must send only an approved template for business-initiated reminders.

## Step 5 — Configure Cloudflare securely

1. Create the D1 database and replace the placeholder database ID in `cloudflare/wrangler.toml`.
2. Apply `cloudflare/whatsapp-schema.sql`.
3. Set secrets using Wrangler:
   - `SYNC_TOKEN`
   - `WHATSAPP_SERVICE_TOKEN`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_VERIFY_TOKEN`
   - `WHATSAPP_APP_SECRET`
4. Confirm `WHATSAPP_GRAPH_API_VERSION` is a currently supported version for the Meta app.
5. Deploy the Worker and confirm `GET /health` responds.
6. Set the Meta webhook callback to `https://YOUR-WORKER-DOMAIN/api/whatsapp/webhook`, enter the same verify token and subscribe to the WhatsApp message/status events.
7. Send a test reminder only to an opted-in test contact and confirm the webhook updates the message status.

Never expose `WHATSAPP_SERVICE_TOKEN` to browser JavaScript, localStorage, GitHub Pages or a mobile app. Only a trusted backend may call the internal reminder endpoints.

## Step 6 — Complete the missing Prasad Business integration

The app currently stores invoices, customers and receipts in browser localStorage. The Cloudflare Worker does not yet read or reconcile those records. Before automatic due reminders can be enabled, the project must add:
- Authenticated user login and role permissions.
- Shared customer, invoice, receipt and invoice-allocation records in a backend database.
- A server-side due-date/ageing calculation using invoice-wise balances after receipts and credits.
- Customer reminder preferences, quiet hours, opt-in evidence and opt-out handling.
- A scheduler that selects due invoices, groups them per customer and creates reminder jobs with a fresh balance snapshot.
- Idempotency, audit history and administrator pause controls.
- A reviewed manual WhatsApp share action on each customer statement / due reminder.

Do not send reminders from the current browser-local data or infer delivery from an API response. A provider acceptance response means the request was accepted; the signed webhook is used for later sent/delivered/read/failed status.

## Step 7 — Go-live checklist

- [ ] Meta business portfolio and WABA ready.
- [ ] Business phone number connected and verified.
- [ ] Approved reminder template in every required language.
- [ ] Customer opt-in evidence captured.
- [ ] D1 migration applied and Worker deployed.
- [ ] Secrets stored only in Cloudflare.
- [ ] Meta webhook verified and status callbacks received.
- [ ] Secure shared invoice/receipt backend completed.
- [ ] Due reminder scheduler tested against sample invoices.
- [ ] Duplicate prevention, opt-out, quiet hours and pause tested.
- [ ] Manual WhatsApp sharing available as fallback.
- [ ] Admin explicitly enables live sending after test approval.

## Cost and policy note

The official WhatsApp Business Platform is not guaranteed to be free. Meta's current pricing, template rules, message limits and account requirements apply. Review the current Meta pricing page before enabling real reminders.
