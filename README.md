# Prasad Apparels Business Analyst

A mobile-first installable web app for Prasad Apparels, with a simple navy-and-gold interface.

## Current app features
- Dashboard overview with clear Tally connection status.
- Barcode-assisted Sales Orders: scan a garment label (Code 128, EAN and QR supported by the camera library), add one unit per scan, and adjust quantities.
- Sales order drafts saved locally in the current browser/device; they are not posted to Tally.
- Sales and purchase draft forms saved locally in the current browser/device.
- Apparel-focused stock analysis plan: style, colour, size, fast/slow movers and reorder watchlist.
- Customer and supplier management sections for outstanding, payables, ledgers and follow-ups.
- Business report catalogue for sales, purchases, profit, ageing and inventory.
- Responsive layout and installable PWA support.

## Important: before Tally integration
This version is a front-end preview. It is **not connected to Tally**. Dashboard figures and live balances are not loaded. Local sales/purchase drafts are stored only in browser local storage; they are not accounting vouchers and are not synced to Tally. Do not use it as the accounting record or enter sensitive real financial data until secure backend storage and access controls are implemented.

## Publish this existing repository with GitHub Pages
1. Open this repository's **Settings → Pages**.
2. Under Build and deployment, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then Save.
4. Wait for GitHub Pages to publish, then open the Pages URL on your phone.
5. In Safari, use Share → Add to Home Screen.

Do not create another repository; this project is already `rohanrm18/business-analyst-prasad`.

## Tally connection phase
Before enabling live data or voucher posting, confirm:
- Whether the office computer runs Tally.ERP 9 or TallyPrime and the exact release.
- Which company is to be connected and whether the operator can enable Tally's supported integration interface.
- Whether the office computer can run a small local connector service.

The planned design is an office-side connector that initiates an outbound encrypted connection to an authenticated backend. Never expose Tally's XML/HTTP port directly to the public internet. Implement user roles, least-privilege access, audit logs, backups, validation, and explicit confirmation before posting vouchers. Test against a copy/backup company before live use.

## Reference
The feature direction is inspired by common Tally companion workflows such as live reports, ledger/outstanding review, transaction entry, invoice sharing and team access. This is an independent Prasad Apparels project, not affiliated with Biz Analyst or Tally.

## Tally integration preparation (ERP 9 + TallyPrime)

Both products support XML over HTTP integration. This repository now includes a **local, read-only Windows diagnostic connector** under `connector/`:
- `server.py` sends a company-list export request to the configured local Tally HTTP endpoint.
- `start-connector.bat` starts it with the common default Tally URL `http://127.0.0.1:9000`.
- `README.md` in the connector folder explains the first test.

The connector listens only on `127.0.0.1:8765`; it is intentionally not exposed to the LAN or internet. It does not create, edit, or delete vouchers. It does not reliably identify the exact Tally product build; confirm the version in Tally's About screen. The initial test verifies XML response and company list only.

Official integration references:
- Tally.ERP 9 XML interface: https://help.tallysolutions.com/article/DeveloperReference/integration-capabilities/using_XML_interface.htm
- TallyPrime XML integration: https://help.tallysolutions.com/xml-integration/
- Integration prerequisites: https://help.tallysolutions.com/pre-requisites-for-integrations/

Do not expose port 9000 publicly. Remote access from the phone is a later phase requiring a secured outbound office agent, authenticated backend, encrypted transport, access control and audit logging. Do not enable voucher posting until tested on a backup/test company.


## Free-first cloud sync foundation

The `cloudflare/` folder contains an initial Cloudflare Worker + D1 backend foundation. It has authenticated endpoints for uploading and retrieving encrypted snapshot strings. It does **not** yet connect to Tally, implement encryption/decryption, or provide phone offline sync. Follow `cloudflare/README.md` for setup. Do not upload real accounting data until client-side encryption, device authorization, recovery and backups are implemented and tested.


## Barcode sales orders (preview)
Open the **Orders** tab, enter the customer and date, then tap **Scan item barcode** and allow camera access. Each successful scan adds one unit; scanning the same barcode again increases its quantity. Quantities can be adjusted with plus/minus, and the barcode can also be entered manually. The scanner library is loaded from a public CDN when the camera is started, so internet access is needed for the first scanner load. Barcode-to-stock-item lookup, item rates and customer/item master sync are not connected yet; scanned rows remain local drafts and are not posted to Tally. Label Studio now records each successful print in a local barcode-history list (including barcode, style, model, colour, size and timestamp) and exports `prasad-barcode-history.json`. In the Orders screen, import that JSON once; subsequent scans can resolve the imported style/colour/size details. This is a file-based first bridge, not automatic cloud sync. Existing labels printed before history recording was added cannot be reconstructed from the sequence counter alone.
