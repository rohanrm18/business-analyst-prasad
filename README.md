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
\n\n### Share sales orders\nSaved sales orders include a Share / WhatsApp action. On supported phones it opens the native share sheet (WhatsApp, Messages, email and other installed apps); otherwise it opens WhatsApp with a prefilled order summary. Shared summaries show customer, date, item names, barcode values, quantities and notes. They are order summaries, not GST invoices.\n

## ERP expansion — Windows + phone foundation

The app now includes an initial unified operations layer:
- **Inward/outward movement register:** dated IN/OUT records with purpose, party/location, reference/challan, lot/batch note, unit and a calculated balance per entered item name. Outward entries are blocked when they exceed that recorded balance.
- **Production control tower:** order-stage overview plus an issue/hold register for material shortage, quality, machine, contractor, approval, alteration, transport and quantity problems. Open holds can be marked resolved.
- **Integrated garment label centre:** save label batches and reprint them from inside this same app. Label layouts include Prasad Apparels, style, product, colour, size, optional MRP and Code 128 barcode generation. Barcode rendering loads JsBarcode from a public CDN; internet is required when printing. Print through the browser/system print dialog and select the correct thermal printer, paper size and darkness/alignment settings.
- **Wider desktop layout:** responsive workspace for Windows screens, tablets and phones.

### Important limits — this is not yet a complete live ERP

These additions are a first operational foundation, not a completed production-grade system. Records still live in the current browser/device local storage. They do **not** automatically synchronize between Windows and phones. Use the backup/restore function to move a snapshot manually, and do not treat separate browser copies as one shared database.

The movement register currently calculates balances by the exact item text entered; it is not yet linked to supplier purchase orders, GRNs, material masters, warehouse/bin/lot stock, production consumption, finished-goods SKUs, sales dispatch or accounting. Do not use these balances as audited stock figures yet. The production hold tracker records exceptions, but full stage-to-stage quantity reconciliation, bundles, job-work challans, material issue/return, wages, QC/rework and production costing are still to be implemented. Label printing is integrated in the app, but direct Bluetooth printer control from every browser/device is not guaranteed; the current method uses the system print dialog.

### Remaining build plan

1. Shared data foundation, business masters, login/roles, audit trail, secure cloud sync and validated backup/recovery.
2. Item/style/size/colour/material masters, suppliers, customers, workers, contractors, warehouses and BOM/size-set costing.
3. Purchase orders, inward GRN, inspection/accepted/rejected quantities, purchase invoices/returns, supplier balances and raw-material stock ledger.
4. Production routing and size-wise plans, material reservation/issue/return, cutting markers, bundles, stitching, in-house work and outsourced challans/receipts/shortages.
5. Finishing, accessories, ironing, measurement/QC, alteration/rework, packing, cartons, barcode labels and QC-approved finished-goods stock.
6. Sales quotations/orders, finished-stock reservation, picking, dispatch challans/LR/e-way-bill workflow, GST invoices, returns, collections and customer balances.
7. Expenses, cash/bank, worker/contractor payments, cost sheets, stock valuation, profit reports, GST checks and then Tally integration.

Do not connect Tally or enable voucher posting until the operational workflows, security, audit and test-company validation are complete.


## Fabric, cutting and accessory traceability

The unified app now has an initial material-tracking workflow:
- Fabric inward in **meters**, with type (plain, design/jacquard, printed), item code, design/print reference, unique roll number, colour/shade, width, GSM, supplier and supplier lot.
- Cutting issue linked to a production order and exact fabric roll. Records meters issued, consumed, reusable leftover returned, wastage/scrap, marker reference and pieces cut. Validation requires consumed + returned + wastage to reconcile to issued meters; only reusable returned meters increase the roll balance.
- Button, brooch and other trim item codes with garment category, colour/finish, size/specification and opening/inward quantity.
- Order-wise accessory issue and unused return, with category matching and an expected requirement check based on order quantity × pieces per garment.
- These records are included in local backup/restore.

This is still a local-first foundation. The fabric and trim ledgers are not yet connected to formal purchase orders/GRNs, full BOM reservations, barcode scanning, warehouse locations or multi-device shared stock. The current category match is a text match and requires the operator to enter the same approved category wording. Those integrations and user/device synchronization remain in the next development stages.


## Style BOM and pre-cut material gate

The **Bill of Materials (BOM)** page is available from More. Add one component row per style for every required material:
- Fabric: fabric item code, optional shade, meters required per garment and wastage percentage. Available meters are totalled from matching inward fabric rolls, less cutting issues and reusable returns.
- Buttons, brooches and other accessories: select the registered accessory item and enter pieces required per garment plus any allowance.
- For a production order, the system multiplies per-garment usage by the order quantity and applies the wastage allowance. It displays required quantity, current available quantity and shortage for each BOM component.
- The cutting form now blocks a cutting entry if the order has no matching style BOM or any BOM component is short.
- BOM records are included in manual backup/restore.

Important operating rule: use the same style identifier in the BOM and production order, register fabric inward against the exact fabric item code (and shade where specified), and create accessory masters before adding them to a BOM. Add multiple BOM rows for multiple fabrics, button types, brooches or other trims.

This is an initial local-device BOM control. It is not yet a reserved/committed stock ledger, multi-user shared stock, purchase/GRN-linked material planning, size-specific BOM, or full production costing. BOM availability is a live check against the current local fabric and accessory balances; it does not reserve materials when the check is run.
