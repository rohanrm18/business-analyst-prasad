# Prasad Business — Master Requirements Register & Usability Audit

## Purpose

This is the master checklist of requirements approved for Prasad Apparels Business Analyst. It separates working prototype code from specifications, foundations and features that still need implementation. A file or roadmap entry is not proof that a feature is complete.

## Non-negotiable business rules

1. **Prasad Business is the intended primary business system.** Do not make completion dependent on Tally. The user will migrate/import required historical information from Tally after Prasad Business is ready.
2. Build validated CSV/XLSX migration templates, row-level preview, duplicate prevention, control-total reconciliation and controlled rollback. No live Tally integration or voucher posting is part of the approved plan.
3. Do not invent sales, stock, tax, payment, cost, profit, E-Way Bill or message-delivery figures. Show source, sync time and incomplete-data warnings.
4. Local browser records are device-specific until secure shared storage, authentication, sync, backup and recovery are completed.
5. **GST is for CA working only in the current phase. No GST portal filing, return submission or automatic filing.** Automatic filing can be considered later as a separate approved phase.
6. TDS is internal working and CA handover only; no statutory TDS return filing.
7. WhatsApp automatic reminders remain disabled until official Meta onboarding, consent, secure shared ledgers, scheduling and delivery-status testing are complete.
8. Final end-to-end testing should be done as one consolidated review after the approved feature set is gathered.

## End-to-end operating workflow

The canonical business lifecycle and document handoffs are defined in [PRASAD-APPARELS-END-TO-END-WORKFLOW.md](PRASAD-APPARELS-END-TO-END-WORKFLOW.md). This is the target workflow, not a claim that every step is already implemented. It separates samples, customer sales orders, manufacturing orders, supplier procurement, stock, packing, invoices and dispatch, and defines the required links and quantity controls.

Current manufacturing screen is only a basic local prototype: it has a simple production order form, sample status form and stage quantity updates. It does not yet enforce approved sample versions, link customer POs/sales orders to manufacturing orders, reconcile job-work, post QC-passed finished stock, or coordinate partial fulfilment. These remain implementation work.

## Requirement-by-requirement status

Status meanings:
- **Prototype present:** some screen/code exists, but not yet accepted as production-ready.
- **Specification recorded:** workflow is documented; do not represent it as a live screen.
- **Foundation only:** technical groundwork exists, but the business workflow is not connected or deployed.
- **Not complete:** needs implementation, integration or verification.

| Area | Owner requirement | Repository status / truth |
|---|---|---|
| Smart dashboard | Easy home screen with important figures and quick actions | Prototype dashboard exists; live verified company figures and complete quick actions are not yet connected |
| Easy everyday use | Anyone should be able to use it without technical knowledge | Not complete; this audit defines the required usability standard below |
| Phone + desktop | Use on Android/iPhone and office Windows computer | Responsive PWA foundation exists; real device/print acceptance is pending |
| Historical data migration | Import existing Tally records after Prasad Business is ready | Import specification recorded; templates, validation, idempotent import, reconciliation and rollback still need implementation. No live Tally integration planned |
| Sales orders | Create orders, scan garment barcode, share order summary | Local draft/order prototype and barcode scan/share foundation exist; no verified shared customer/style master or Tally posting |
| Sales tax invoices | Create GST tax invoices with CGST/SGST/IGST, print/share, convert from approved packing slip | Local invoice prototype now requires an approved packing slip linked to a saved order, caps billed quantities to packed quantities and prevents repeat billing of the same order. Item rows now capture Design Number, Category, HSN Code, quantity and Piece Amount; design/category/HSN/piece amount appear on the invoice and dispatch print copies. Buyer mobile and PIN are now carried into invoice print/share and dispatch invoice copy where entered. The duplex Transporter Copy front now also shows Design Number, Category, HSN Code, Piece Amount, buyer mobile/PIN and place of supply. Still local-only and missing production copy controls |
| Customer PO | Record customer's PO, attach original, convert to orders and track balance | Specification recorded in CUSTOMER-PO-WORKFLOW.md; full linked UI/workflow not confirmed complete |
| Mandatory packing slip | Packing confirmation and printable carton copy before any sales invoice | First local prototype implemented: order-linked packing confirmation, price/GST-free printout, invoice gate, packed-quantity cap and backup/restore validation. Partial packing, revisions, permissions, physical print confirmation and shared ledger remain incomplete |\n| Dispatch | Partial/size-wise dispatch, packing list, delivery challan, transporter/LR, delivery proof and returns | First local workflow implemented: invoice-linked transporter/LR/AWB fields, customer copy unlock after LR, carton/customer invoice copy print, courier envelope with buyer mobile/PIN, and duplex transporter print gated by genuine E-Way Bill attachment or reasoned not-required review. Partial/multiple dispatch, delivery proof/returns, secure shared files, automatic courier/WhatsApp/email delivery and live GSP remain incomplete |
| E-Way Bill | Direct generation through authorised GSP, with review and explicit confirmation | Approved workflow is documented in README; not implemented, not connected to GSP and must not create dummy numbers |
| Customer ledger & collections | Invoice-wise balances, receipts, allocations, ageing and statements | Workflow specification recorded; full shared ledger/reconciliation is not complete |
| Due notifications | Reminders before/on/after due date; WhatsApp fallback and official automatic WhatsApp | Collection workflow documented; WhatsApp server foundation exists, but live Meta setup and ledger scheduler are not connected |
| Credit control | Customer credit limit, warnings, approvals and overdue control | Specification recorded in CUSTOMER-CREDIT-CONTROL.md; not reliable company-wide until shared backend and server-side checks exist |
| Style cost history | Add verified per-piece cost versions by style, optional colour/size and effective date; preserve prior versions. Local entry/history screen exists; profitability report now consumes effective-dated style costs, but costs are not automatically reconciled to supplier bills or production batches |
| Customer profitability | Profit by customer, style and month; rankings and collection behaviour | Local estimate report implemented for saved tax invoices and effective-dated style costs. Shows covered-sales gross profit and missing-cost coverage; not audited/net profit and not reconciled to returns, credit notes, Tally or shared data |
| Purchase cost history | Simple purchase-cost entry, style/variant cost history and landed-cost allocation | Specification recorded in PURCHASE-COST-AND-STYLE-HISTORY.md; entry screens and costing engine not yet implemented |
| Garment stock control | Track finished stock by style/colour/size, inward, production, reservation, dispatch, returns and physical counts | Specification recorded in GARMENT-STOCK-INVENTORY-CONTROL.md; complete movement ledger and shared stock UI not yet implemented |
| Supplier procurement | Supplier master, supplier PO, inward GRN, inspection, accepted/rejected quantities, purchase bills, invoice-wise supplier payments and TDS working | Local linked path now connects supplier master PAN/constitution, approved PO/GRN selection on reviewed purchase bills, duplicate GRN-link prevention, invoice-wise payments and TDS CA working. Still browser-local; PO advances can be applied to linked bills through a local allocation register without double-counting cash; shared accounts reconciliation is incomplete |
| Photo purchase entry | Photograph supplier bill and OCR fields | OCR-assisted local entry exists; line extraction needs human review and is not guaranteed |
| Supplier payments | Allocate payments invoice-wise and show supplier balances | Local supplier-ledger/payment workflow code exists; requires reconciliation and testing before accounts reliance |
| TDS | Calculate working TDS for relevant contractor/job-work payments and send working to CA | Local TDS register and CA handover workbook exist; CA must verify applicability; no statutory filing |
| GST for CA | Prepare GST working, summaries and review exports for CA | Local GST working screen and CSV exports exist; currently limited to local saved sales invoices and reviewed purchase bills, with basic checks. It is not complete GST reconciliation or a portal-ready return |
| GST filing | Automatic or manual filing | **Explicitly out of scope now. No portal filing or return submission. May be considered later only with approval.** |
| Fabric/materials | Fabric rolls, meters, lots, colours, cutting issue/return/wastage, accessories | Initial local traceability code exists; not a reconciled shared stock ledger |
| BOM | Style BOM, size-wise material use, pre-cut shortage gate | Initial local BOM and cutting gate are present in prototype; no stock reservation or shared ledger yet |
| Purchase planning | Calculate material shortages against open production orders | Initial local planning exists; depends on local BOM/movement data and is not a complete procurement engine |
| Production | Track production stages, order progress, holds/problems, job work and returns | Initial local production tracker and job-work challan/TDS screens exist; full stage quantity reconciliation, wages, QC, rework and costing are incomplete |
| Labels/barcodes | Integrated garment label printing and barcode history/scan bridge | Initial label centre and barcode workflows exist; thermal printer alignment/direct Bluetooth reliability still needs device testing |
| Cloud sync | Share data between office and phones | Cloudflare Worker/D1 snapshot foundation exists only; encryption/decryption, device identity, real application data sync and deployment are not complete |
| Security | One app with individual accounts and Owner-controlled Owner/Accountant/CA/Manager/Worker permissions, MFA, session control, audit and secure recovery | D1 security schema migration and detailed specification added; authentication, MFA, server-side permission enforcement, deployment and acceptance testing are NOT complete. Browser-local data remains unsuitable for secure multi-user financial use |
| Reports | Sales, purchases, customer/supplier balances, stock, GST, TDS and profit | Some local reports/exports exist; not all are reconciled to one verified data source |

### GRN quality inspection guard — 23 Nov 2026

- Rejected QC quantities now require an inspection finding / rejection reason before the inspection can be saved.
- Inspection history distinguishes accepted stock postings from rejected-only / zero-accepted QC records, so a rejected-only inspection is not mislabeled as stock posted.
- This is a browser-local validation improvement; it does not replace server-side transaction controls or the final end-to-end QC and stock reconciliation tests.

## Supplier workflow implementation note

Supplier Master now captures PAN and constitution for TDS working defaults. Reviewed supplier bills can be linked to an approved PO and its GRN; a GRN cannot be linked to multiple bills. Invoice-wise payments and confirmed contractor/job-work TDS are saved against the supplier bill and included in CA working. PO-level advances can now be applied to a purchase bill only when supplier names match and the bill carries a PO link. Allocations reduce bill outstanding without creating another cash payment or changing the original PO payment total. Allocation is still browser-local and requires end-to-end reconciliation/testing; legacy advance data is not silently rewritten. All these records remain browser-local until secure shared storage and reconciliation are implemented.

## GST scope — current approved boundary

The menu and labels must say **GST Working for CA**, not imply GST filing.

Current permitted purpose:
- Prepare monthly working from saved Prasad Business sales invoices and reviewed supplier purchase bills.
- Show outward taxable value and CGST/SGST/IGST totals.
- Show an indicative purchase-tax summary for CA review.
- Run basic data-quality checks such as missing invoice fields, GSTIN format, mixed IGST/CGST/SGST and total arithmetic.
- Export working CSVs and a data-quality review file for the CA.
- Clearly show the selected tax month and source record counts.

Important limitations to disclose:
- Current GST workspace reads locally saved sales tax invoices and reviewed photo purchase bills only.
- It does not yet reconcile the complete Tally sales/purchase books, credit notes, debit notes, sales returns, purchase returns, advances, amendments, reverse charge, e-invoice/IRN data or GSTR-2B/ITC eligibility.
- Current exports are working CSVs, not validated GST portal JSON or an official offline-tool upload file.
- Basic app checks are not GSTN validation and do not determine legal tax treatment.
- CA must reconcile with Tally, source invoices, portal records and applicable GST rules.
- No filing buttons, portal credentials, auto-submit jobs or statements that a return has been filed.
- Automatic GST filing is a later optional phase, not part of the present build.

## Usability requirements — make it simple for anyone

### Navigation
- Keep the smart dashboard as the home screen.
- Use plain labels that match everyday work: **Home, Sales, Purchase, Production, Dispatch, Customers, Suppliers, GST for CA, TDS for CA, Reports**.
- Put less-used setup and integration controls under Settings / More.
- Avoid duplicate menu names and technical terms on the main screen.
- Each screen should have one obvious primary action.

### Guided entry
- Use short step-by-step forms with sensible defaults and examples.
- Mark required fields clearly; explain why a field is needed.
- Use dropdowns/search for customers, suppliers, styles, colours and sizes instead of requiring exact repeated typing.
- Auto-fill known customer, supplier, style and invoice details.
- Offer Save Draft, Review and Confirm as distinct steps for important transactions.
- Show a clear success message and next action after saving.
- Prevent accidental duplicate saves and show a useful correction message.

### Dashboard
- Show only verified figures and their “as of” date / last sync time.
- Separate actual figures from pending, estimated and incomplete data.
- Make each tile open the relevant list/detail.
- Keep quick actions for the most common daily work.
- Never show fake sample values as if they were company data.

### Error prevention
- Validate dates, quantities, rates, GSTIN/PAN formats, totals and duplicate document numbers.
- Warn before deleting, cancelling, bulk printing, dispatching or submitting externally.
- Require a second confirmation for bulk label printing.
- Keep a cancel action during active printing.
- For payments, require explicit invoice allocation and show unallocated advances separately.
- For GST/TDS/E-Way Bill, use review-first workflows and never claim statutory submission without a real government/provider response.

### Accessibility and phone use
- Large readable text, high-contrast controls and comfortable touch targets.
- Forms should fit a phone screen and avoid long crowded pages.
- Keep important actions reachable without horizontal scrolling.
- Use consistent button labels, date formats and Indian currency formatting.
- Provide searchable lists, filters and clear empty states.
- Provide printable/downloadable records where appropriate.

### Trust and support
- Show record source, local/shared status and last sync.
- Use plain-language warnings instead of technical stack traces.
- Make backups and restore understandable, with confirmation and a clear last-backup time.
- Keep an audit history for important edits and approvals.
- Never label a prototype or local-only record as live, synced, filed, delivered or posted to Tally.

## Required final acceptance pass

Before calling the app ready, test as one connected workflow on an Android phone, iPhone and office Windows browser where available:

1. Add a customer and supplier.
2. Enter a customer PO and create a sales order.
3. Scan garment barcodes and verify style/colour/size details.
4. Record supplier PO, inward/GRN, purchase bill and supplier payment.
5. Enter/approve garment costs and confirm historical cost behaviour.
6. Create tax invoice and verify CGST/SGST/IGST calculations and print/share.
7. Prepare GST working exports for CA and verify the no-filing boundary.
8. Prepare TDS working and CA handover.
9. Allocate customer receipts invoice-wise and verify ageing/outstanding.
10. Verify credit warnings and approvals.
11. Prepare and confirm partial dispatch, delivery challan and transport details.
12. Test authorised GSP E-Way Bill integration only after credentials and test approval exist.
13. Verify customer reminder preview, opt-in/opt-out, manual share and official WhatsApp delivery statuses.
14. Verify customer/style/month profitability with complete and missing cost cases.
15. Verify fabric, BOM, production, job-work, QC, stock movement and finished goods do not double-count quantities.
16. Verify style/colour/size stock balances, partial inward, reservations, dispatch-once logic, returns quarantine, transfers and physical-count adjustments against the movement ledger.
16. Verify labels, barcode scans, printer alignment, bulk double-confirmation and cancel-print.
17. Verify dashboard totals against underlying ledgers and exports.
18. Verify role permissions, audit logs, sync conflict handling, backup and restore.
19. Verify no data is silently lost between phone and office computer.
20. Verify no feature claims Tally posting, GST filing, E-Way Bill generation or WhatsApp delivery unless a real integration response confirms it.

## Owner's current approved direction

- Build the complete Prasad Business workflow in priority order.
- Make it a simple mobile-friendly control centre that a non-technical staff member can use.
- Keep Tally.ERP 9 as accounting source of truth; use accounting-invoice-only assumptions.
- GST: working for CA only now; no filing. Automatic filing may be added later if approved.
- TDS: internal working and CA handover only; no statutory filing.
- E-Way Bill: authorised API integration with review and explicit confirmation, when properly onboarded.
- Customer PO, dispatch, outstanding/collections, credit control, customer profitability, style cost history and garment stock control are approved requirements.
- Official WhatsApp Business Platform is the intended automatic reminder channel, with manual share fallback, but live sending remains off until fully configured.
- Gather features first and complete a single consolidated final test pass rather than asking the owner to test after every small change.


## Supplier advance allocation follow-up — 22 Nov 2026
- Added PO advance-to-purchase-bill allocation in the invoice-wise supplier settlement screen. It validates matching supplier names, available unallocated advance and bill outstanding; records a distinct allocation; and reduces invoice outstanding without creating another cash payment.
- Follow-up source review found and fixed an initialization-order issue in the new allocation panel (bill/payment collections are now loaded before the panel builds its options).
- The feature remains browser-local, limited to purchase bills linked to a PO, and needs full browser workflow testing and accounting reconciliation before production use. It does not automatically allocate advances or change the PO cash-payment ledger.


## Customer outstanding and collections implementation update — 22 Nov 2026
- Added a browser-local customer receivables screen under **Parties** using saved Prasad sales tax invoices: invoice-wise original value, receipt allocations, remaining balance, customer totals and due-date ageing (not due, due today, 1–30, 31–60, 61–90 and over 90 days).
- Added invoice due-date entry; default due date uses the saved customer credit days (30 days when no customer terms are configured). Existing invoices without a due date fall back to invoice date and should be reviewed.
- Added receipt entry with customer/invoice validation, partial receipts, mode, date, UTR/cheque reference and notes. A receipt is allocated to one invoice per entry; a single bank receipt split across invoices is entered as multiple allocations with the same reference.
- Added customer credit limit and credit-day settings, an over-limit warning at invoice save, and a customer exposure warning in the outstanding view.
- Added collection reminders with upcoming/due/overdue stages, prepared WhatsApp share links and a local reminder activity history. The user must send the message manually.
- Added receipt, credit and reminder records to manual backup/restore.
- **Not production accounting:** all records remain in this browser/device; no Tally import/reconciliation, bank statement matching, opening-balance conversion, credit-note/return/write-off handling, multi-user sync, role-based approvals, audit identity or automatic WhatsApp sending. The receipt form currently supports one invoice allocation per entry. Verify balances against Tally before operational reliance.
- Acceptance testing remains required for partial/full payments, split receipt references, due-date boundaries, over-limit confirmation, backup/restore and WhatsApp handoff.

- Added a reversal action for an incorrectly entered receipt. Reversal requires a reason, retains the original record and restores the invoice balance rather than deleting payment history.

- Follow-up hardening: a single customer receipt can now be allocated across multiple distinct open invoices; each allocation is checked against that invoice's remaining balance, and the receipt total is calculated from allocation rows. Added responsive mobile layout, customer credit-setting auto-fill when editing, due-date validation (cannot precede invoice date), and stricter receipt/credit validation during backup restore. Reminder labels now distinguish the scheduled dates (3 days before, due date, 3 days overdue, 7 days overdue, then every 15 days after day 7) from other upcoming/overdue dates.

## Receivables ledger extension — opening balances and credit adjustments
- Added per-customer, per-reference opening balance entries with original due date; opening items participate in ageing, customer balances, statements and receipt allocation.
- Added reference-only credit note / approved credit adjustment records against a specific open invoice or opening item. Credit adjustments reduce receivables, have reference/reason/date, and can be reversed with a reason. This does not create a GST credit note or post to Tally.
- Opening balance entries can be reversed with a reason only when no receipt or credit adjustment is linked; linked records must be reversed first.
- Receipts, opening balances and credit adjustment records are included in backup/restore. Restore validates invoice references and prevents combined receipts/credit adjustments exceeding original invoice value.
- These are still browser-local controls. No shared backend, bank feed, Tally posting/reconciliation, GST document generation or multi-user permissions are active.
- Added manual bank-statement matching on each customer receipt. A user must compare the receipt against the bank statement, enter the bank reference and confirm; the app records who/when only as a local timestamp (no bank API/feed is connected).

- Added invoice-level collection statuses: Active, Disputed and On Hold. Disputed/on-hold invoices remain visible in outstanding balances but are excluded from collection reminders until resumed. Every status change records a reason and timestamp; backup restore validates invoice references/status values.
- Reminder preparation now blocks paid/disputed/on-hold invoices and duplicate same-invoice/same-stage reminders on the same date. Reminder history records `prepared`, not sent/delivered; the customer still must press Send in WhatsApp.


## Packing-slip gate implementation status — 22 November 2026

A first browser-local prototype has been added to the Sales Orders and GST Tax Invoice workflow. The user must confirm physical packing and approve the packing slip before the app will save an invoice. The approved slip is printed as a price-free carton copy. Invoice lines are checked against packed quantities and one order cannot be invoiced twice. Backup/restore includes packing-slip records and checks invoice-to-slip links. This is not yet the complete dispatch process: partial packing, carton-level allocation, controlled amendments, roles/audit identity, shared storage, two invoice copies, LR workflow, customer courier/WhatsApp/email copy, courier-envelope print and duplex E-Way Bill print remain outstanding. Treat the feature as a prototype until end-to-end device testing is complete.


## Invoice item detail update — 22 November 2026

The sales invoice item entry now uses **Design Number** (with legacy item-number fallback), **Category**, **HSN Code**, **Qty (Pcs)** and **Piece Amount**. Piece Amount is the per-piece rate; taxable line value continues to calculate as quantity × piece amount less the entered line discount, with GST calculated separately. The saved invoice retains legacy `itemNumber` alongside the new `designNumber` for compatibility with packing-slip matching and older records. Main invoice, invoice share text and dispatch invoice copies display the updated item details. Verify HSN and GST rate with the CA before issuing; this is a local prototype, not statutory validation.


## GST goods-invoice copy designation correction — 22 November 2026

Dispatch print actions now distinguish the statutory goods-invoice copy designations described in CGST Rule 48(1): **Original for Recipient** (the carton copy), **Duplicate for Transporter** (the front of the duplex transporter document), and **Triplicate for Supplier** (internal supplier copy). The customer share print is clearly labelled as a copy/reproduction of the Original for Recipient, not as a fourth statutory original. Dispatch invoice printouts also include seller state, place of supply, due date, buyer GSTIN, piece amount, discount, GST rate, taxable value and tax amount where stored. Main invoice print is labelled Original for Recipient. This is a software layout alignment only; CA must verify applicability, e-invoice requirements and final invoice particulars before live use. Official reference: CBIC GST invoice rules, Rule 48 (https://cbic-gst.gov.in/gst-invoice-rules.html). Payment QR is deferred until official bank/UPI details are supplied; no QR is fabricated.


## Invoice input validation hardening — 22 November 2026

The sales tax invoice form now requires an HSN/SAC entry in 4, 6 or 8 digit numeric form for each line and validates item description, positive quantity, non-negative piece amount, discount not exceeding gross line amount, GST rate between 0 and 100, seller state/place of supply, carton count as a positive whole number, optional buyer mobile as 10–15 digits, and optional Indian PIN as 6 digits. This is input-format validation only: it does not verify HSN classification, GST rate, GSTIN registration/status, place-of-supply treatment, tax exemptions or legal invoice applicability. CA review remains required. Invalid entries are blocked before local invoice save.


## GST state-code consistency hardening — 22 November 2026

- Added an India GST state/UT code reference for common state names and abbreviations. Invoice tax-split classification now prefers the supplier GSTIN's first two-digit registration-state code compared with the entered place-of-supply state code, rather than relying only on free-text spelling equality. This correctly handles equivalent entries such as the GST code `27` and `Maharashtra` when the place-of-supply field is a recognised state name/code.
- Supplier GSTIN format now requires a two-digit numeric prefix and 15 total alphanumeric characters; when the seller state name is recognised, its state code must match the GSTIN prefix. Buyer GSTIN format receives the same structural check.
- Invoice saving now blocks when the seller state, seller GSTIN state code or place-of-supply state/UT cannot be mapped to the supported GST state/UT reference; it no longer falls back to free-text equality for unknown locations. This avoids silently saving a tax split based on spelling differences or unsupported territory labels. Add or verify any special/other-territory treatment with the CA before enabling it.
- This is a consistency aid only, not GSTIN checksum/registration verification or a legal place-of-supply determination. CA must review the tax split, place of supply, exemptions and applicable rules before issue. No GST filing is enabled.


## Supplier TDS annual-threshold aggregation safeguard — 23 November 2026

- Confirmed contractor/job-work payment base amounts are now retained on the supplier payment record whenever TDS applicability has been explicitly confirmed, including payments where the indicative annual/single-payment threshold is not yet crossed.
- Subsequent threshold calculations aggregate those confirmed bases across the financial year by supplier PAN, while retaining compatibility with older TDS register entries and avoiding double-counting entries linked to payment records that already carry the base.
- This improves cumulative tracking only. It does not decide legal applicability, classify a transaction, determine statutory thresholds/rates, or replace CA review. Older below-threshold payments that were not previously stored with a TDS base cannot be reconstructed automatically.

## Supplier advance settlement safeguard — 22 November 2026
- Supplier payment posting now subtracts PO advance allocations already applied to a purchase bill when calculating its remaining payable balance. This prevents a subsequent cash/TDS settlement from ignoring an earlier advance allocation and exceeding the bill's net outstanding amount.
- The control remains browser-local. Reconcile supplier advances, purchase bills, TDS timing and ledger balances with the CA before operational reliance; advance payments may themselves require separate TDS review depending on the facts and applicable law.


## Supplier advance and style-cost backup coverage — 22 November 2026
- Manual business backups now include supplier advance-to-bill allocations and effective-dated style cost history. Restore allow-list accepts both datasets and applies the existing array-shape validation before replacing records. Compliance backup wrapper inherits the expanded allowed-key list.
- Backups remain manual, browser-local and unencrypted; store them in a private secure location. Restore replaces local records and should be preceded by a fresh backup.


## Security foundation update (2026-11-22)

- Added `cloudflare/migrations/0002_security.sql` for individual users, per-user permissions, sessions, login throttling, audit events and recovery-code hashes.
- Added `SECURITY-AND-ACCESS-CONTROL.md` with the one-app role matrix, deny-by-default rules and mandatory go-live acceptance tests.
- Updated README to make the security boundary explicit.
- **Not yet implemented/deployed:** authentication endpoints, password verification, MFA enrollment/verification, session middleware, server-side business API authorisation, D1 migration execution, encryption/key management, frontend login/permission UI, and end-to-end security tests.
- Existing browser-local business records and shared-token sync foundation must not be described as production-secure. Real financial data must remain out of shared deployment until all controls are implemented and tested.


## Garment stock movement ledger — 22 November 2026

- Replaced the stock-analysis placeholder with a working device-local garment stock ledger grouped by design/style, colour and size.
- Supports opening balances, production receipts, purchase inward, dispatch/sale issues, customer returns, and reason-required positive/negative stock adjustments.
- Dispatch/sale issues and stock-adjustment-out movements are blocked when they exceed the available saleable quantity for that exact style/colour/size.
- Customer returns enter a separate quarantine balance and do not become saleable until an explicit QC-pass release action is confirmed.
- Shows saleable pieces, quarantined returns, variant balances and movement history. Each movement stores its date, style, colour, size, quantity, reference, reason and timestamp.
- This is a standalone manual ledger prototype. It is not yet automatically posted by manufacturing, GRN, packing or dispatch; avoid entering the same source movement twice. It is browser-local and not a production shared stock ledger. Opening quantities must be physically reconciled; valuation, reservations, carton-level allocation, stock costing and cross-module automatic posting remain future work.

- The garment stock movement array is also included in the existing manual backup export and restore allow-list, with array-shape validation. Cloud backups remain deferred to the final infrastructure phase.


## Customer directory implementation — 2026-11-22
- Implemented a device-local customer directory in the Parties screen with create/edit, name duplicate prevention, mobile/PIN/GSTIN format checks, address, state/city, credit days and credit limit.
- Customer master records are included in the manual JSON backup key list and procurement ERP restore allow-list.
- This is a local directory only: it does not yet auto-fill sales orders/invoices, merge legacy spellings, sync across devices, enforce user roles, or verify GSTIN registration. Existing receivables remain a separate ledger pending controlled migration/linking.


## Customer purchase order implementation — 2026-11-22
- Added a customer PO register reachable from Sales Orders. Capture customer, buyer PO number, PO date, required delivery date, status, terms and multiple style/colour/size/quantity/rate lines.
- Prevent duplicate PO numbers for the same customer. Only Confirmed POs can convert; conversion creates one linked sales order and prevents duplicate conversion. PO remains a separate record and conversion does not create an invoice, packing slip, production order or dispatch.
- Customer PO records are included in manual JSON backup and restore allow-lists with array validation.
- Local prototype limitation: no customer PO document attachment, partial conversion, PO amendment/revision history, automatic stock allocation, automatic manufacturing order creation, server sync or multi-user approval yet. Sales order conversion is one-time and full-quantity.


## Sales order to manufacturing order link — 22 November 2026
- Added per-line production planning actions to saved customer sales orders. The app displays ordered quantity, linked production quantity and remaining unplanned quantity for each sales-order line.
- A user can create a Manufacturing Order directly from an open sales-order line, choose a whole-piece quantity up to the remaining unplanned demand, and retain links to the sales order, source line index, customer, originating customer PO and PO number where present.
- Duplicate/over-planning is guarded per sales-order line; closed/cancelled or delivered orders cannot create new production. Cancelled manufacturing orders are excluded from planned quantity.
- Manufacturing Orders remain visible in the existing Production screen and continue to use the existing stage-progress workflow. Independent stock-replenishment and sample-related production orders remain possible.
- Important boundary: this link does not calculate stock shortages, reserve stock, split available stock vs production, validate approved sample versions/BOM/material availability, or post finished goods to stock. Stock allocation and automatic inventory posting remain later work. Records remain browser-local; no server sync or role enforcement.


## Approved sample version control and production reference — 22 November 2026
- Sample creation now creates a numbered draft version per style (V1, V2, etc.); it no longer allows a sample to be directly created as Approved. Drafts move through Submitted for approval and explicit confirmation before approval.
- Approval records a timestamp and local-user placeholder, and the approved version is retained unchanged. A revision creates a new draft version linked to the previous version rather than overwriting the approved reference.
- Manufacturing orders can select an approved sample version matching the entered style. If no approved sample is selected, a documented repeat-style/approval exception reason is required. Sales-order-linked manufacturing also selects a matching approved sample or requires a documented exception; the chosen sample ID/version is stored on the MO.
- Existing historical sample and MO records are retained. Existing older sample records without version/approval metadata are not treated as valid approved references until reviewed/re-entered.
- Local prototype limitation: approval identity is not authenticated, and there is no role separation, photo/spec/measurement attachment, digital signature, immutable server audit, BOM validation or cloud sync. The exception field is a local record, not a secure approval workflow. CA/security phase remains later; no live user testing/build confirmation yet.


## Manufacturing Order BOM and material availability link — 22 November 2026
- Connected each Manufacturing Order card to the existing style BOM and fabric/accessory stock ledgers. The MO view now displays BOM material requirements, recorded available quantity and shortage per material, with a direct route to BOM and purchase planning.
- Size-wise BOM requirements now require a valid size plan: each entry must be a positive whole-piece quantity, sizes cannot be duplicated, and the size quantities must add exactly to the MO total. Common all-size BOM rows continue to calculate from total MO quantity without requiring a size plan.
- Material checks aggregate BOM rows by material identity so duplicate component rows do not each compare against the same full stock balance independently.
- Fabric and accessory quantities already issued to a particular MO are included in that MO's available material calculation. Automated purchase planning adds back net issues to open MOs when comparing full-order demand, avoiding counting already-issued material as both consumed stock and a second full requirement.
- Cutting stage updates in Manufacturing and the separate cutting entry screen are blocked when the BOM is missing, size plan is invalid, or grouped material availability is insufficient. Purchase planning continues to group open-MO shortages and create vendor requests.
- Limitations: BOM remains style-level and editable live (no approved/version-locked BOM snapshot on each MO); material checks are availability checks, not reservations; material issue/consumption and purchase posting are not fully automated; existing BOM rows are not migrated to versioned approvals. Fabric and accessory balances remain browser-local and must be physically reconciled. No live testing or CI/build confirmation yet.


## Approved BOM revision control and Manufacturing Order snapshot — 22 November 2026
- Style BOM components are grouped into explicit revisions (V1, V2, etc.) with Draft and Approved states. Existing unversioned BOM rows are preserved and migrated to Draft V1 for review; they are not silently treated as approved.
- A draft revision can be edited by adding/removing its components. Explicit approval locks all its component rows. Approved rows cannot be removed through the BOM screen. Adding a component after approval starts the next draft revision for that style.
- New stock-replenishment and customer-sales-order Manufacturing Orders capture an immutable local copy of the currently approved BOM components and revision metadata at creation. Material calculations use the order's saved snapshot, so later BOM revisions do not silently alter an existing order.
- Existing Manufacturing Orders without a snapshot can lock the currently approved style revision when cutting is first attempted; if none is approved, cutting remains blocked until a valid approved BOM is attached through the controlled workflow. This legacy first-cut lock should be reviewed against the actual order/style before use.
- BOM approval and snapshot records are stored in the existing `pa_style_bom_v1` and `pa_manufacturing_v1` local browser records, both already covered by the manual backup. No new backup key was introduced.
- Limitations: approval identity and timestamps are local-device data, not secure multi-user approvals; no role enforcement or immutable server audit; no formal BOM revision comparison screen; no automatic attachment of a revised BOM to an already-created MO. Functional simulation and live UI/build tests remain pending.


## Manufacturing material reservations and issue controls — 22 November 2026
- Added a material reservation ledger inside the existing `pa_manufacturing_v1` record, covered by existing manual backup/restore.
- An MO can reserve all remaining BOM materials atomically against its locked BOM snapshot and valid size plan. If any material is short after other active reservations, no reservation is saved. The same recorded stock cannot be reserved by two different active MOs.
- MO cards show issued, reserved and remaining material quantities, with explicit reserve-all and release actions. Released reservations no longer reduce stock available to other orders.
- Fabric cutting issue and accessory OUT movements now require an active matching MO reservation and cannot exceed its remaining reserved quantity. Existing reusable fabric returns and accessory IN returns remain recorded and quantity-checked.
- Purchase planning displays active reservations separately while retaining aggregate stock/demand shortage calculation. Reservations do not themselves deduct physical stock; issues do.
- This remains a browser-local prototype. Existing pre-reservation issue history is retained; old orders may require review before new issues. Reservation identity/approval is not secure, and no multi-device concurrency, server audit, role enforcement or physical stock reconciliation is implemented.
- Consolidated acceptance testing remains pending for two-order contention, partial issues, returns, release, closed orders, procurement calculations and backup/restore.

- Follow-up safeguard: active reservations are automatically released when an MO is marked Completed, Cancelled or Delivered; closed orders cannot create new reservations. MO material status distinguishes fully issued from merely reserved.


## GRN quality-inspection stock posting retry protection — 22 November 2026
- Confirmed the existing procurement path: approved PO line → GRN receipt → pending quality inspection → accepted/rejected quantities. Accepted fabric is posted to the fabric-roll register; accepted accessories are posted as accessory inward movements. Rejected quantities do not enter usable stock.
- Strengthened accepted-stock posting with a stable inspection ID derived from the GRN and next inspection sequence. A retry after a page interruption reuses the same ID until the inspection record is saved.
- Fabric GRN stock records retain QC posting IDs and quantities; accessory inward movements retain the QC posting ID. Replaying the same inspection cannot add the accepted quantity twice.
- This protects the local browser prototype against duplicate retries within its sequential save flow. It is not a substitute for a server-side transaction/unique constraint in the later multi-user cloud phase.
- Focused executable tests against the actual extracted production posting function passed: fabric first acceptance, same-inspection retry (no duplicate meters), second partial fabric inspection (correct cumulative meters), accessory acceptance and same-inspection retry (no duplicate pieces). ERP JavaScript syntax and cache-version consistency also passed.
- Remaining acceptance tests: rejected-only inspection, interrupted-save retry through the full browser form/localStorage flow, PO over-receipt prevention, procurement backup/restore and physical stock reconciliation. No live browser/device test or hosted build is claimed.


## Unit-safe stock movement balances — 23 November 2026
- Corrected the general inward/outward movement register so balances are grouped by both item name and unit of measure. Meters, pieces, kilograms, rolls, boxes, sets and dozens can no longer be combined into one displayed balance merely because their item names match.
- Outward movement validation now checks the available balance for the exact item-and-unit pair and reports the unit in the shortage warning. Existing movement records are preserved; no historical quantities are converted or silently rewritten.
- Updated the ERP script and service-worker cache versions.
- Verification: ERP JavaScript syntax passed; source checks confirm item grouping, displayed balances and outward checks all use the unit-aware balance function. Full browser workflow, legacy-data reconciliation and physical stock count remain pending.


## Goods receipt validation hardening — 23 November 2026
- Centralised GRN receipt validation and require the linked PO to be Approved or Part received before accepting a receipt; cancelled, draft or otherwise unapproved POs cannot receive goods.
- Require a valid receipt date, positive quantity, and enforce remaining PO line quantity. Fabric requires a unique roll number; accessory receipt quantities must be whole pieces.
- Preserves existing GRN and QC records; this is a validation guard, not a supplier-return or PO amendment workflow.
- Verification: ERP JavaScript syntax passed; focused validation tests passed for normal receipt, over-receipt, cancelled PO, duplicate fabric roll, fractional accessory quantity and missing date. Browser/localStorage integration, backup/restore and end-to-end procurement tests remain pending.


## Supplier advance allocation validation — 23 November 2026
- Hardened the advance-to-invoice allocation form with strict calendar-date validation, positive finite amount checks, validation of the source advance amount, and explicit checks against both unallocated advance and remaining invoice balance.
- Added duplicate protection for an exact repeated payment-to-bill allocation (same source advance, bill, date and amount). Existing valid allocation records are preserved; this does not merge supplier advances or create a cash payment.
- Verification: supplier-ledger JavaScript syntax passed and seven focused helper tests passed (valid allocation, invalid calendar date, zero amount, advance over-allocation, bill over-allocation, supplier mismatch and exact duplicate). Browser/localStorage workflow tests remain pending; supplier identity is currently matched by normalized supplier name because legacy bill and advance records do not consistently carry a shared supplier ID.


## Supplier PO payment validation — 23 November 2026
- Supplier-level PO payments now require a real calendar date and a positive finite amount before saving.
- Duplicate non-empty payment references are blocked per supplier, reducing accidental double-entry of the same bank/cheque/UPI transaction. Payments without a reference remain allowed because cash and other legitimate transactions may not have one.
- Existing outstanding-balance cap remains in force; no payment can exceed the recorded supplier PO outstanding.
- Verification: ERP JavaScript syntax passed. Browser/localStorage payment workflow and migration scenarios remain pending.


## GRN calendar-date validation — 23 November 2026
- Tightened goods-received date validation to reject impossible calendar dates (for example, 30 February), not merely strings that resemble YYYY-MM-DD and are loosely parsed by JavaScript.
- The validation requires the parsed date to round-trip to the exact entered ISO calendar date; existing receipt quantities, rolls and inspection records are unchanged.
- Verification: ERP JavaScript syntax passed; focused helper tests passed for valid date, impossible date, malformed date, valid approved PO receipt, unapproved PO, over-receipt, duplicate fabric roll and fractional accessory quantity. Full browser/stock integration tests remain pending.


## Supplier payment mode validation — 23 November 2026
- Supplier-level PO payment entry now requires a recognised payment mode: Bank transfer / NEFT / RTGS, UPI, Cash, Cheque or Other. The selected value is saved as the canonical method field.
- Existing positive-amount, strict calendar-date, supplier selection, duplicate-reference and supplier-outstanding checks remain in place.
- Verification: ERP JavaScript syntax passed; focused payment validation checks cover each supported method, missing/unknown method, invalid date, zero/negative amount and duplicate supplier reference. Browser/localStorage and legacy-data integration remain pending.


## Purchase Order approval validation — 23 November 2026
- Draft PO approval now checks supplier existence, strict real calendar order date, at least one line, material code, positive quantity, finite non-negative rate, GST percentage from 0–100, supported material type, accessory whole-piece quantity and a live accessory-master link. Fabric lines must include a unit.
- Approval remains confirmation-based; cancelled/previously approved POs cannot be approved through this Draft-only path.
- Verification: ERP JavaScript syntax passed; focused helper tests cover valid fabric/accessory POs, missing supplier, invalid date, empty lines, zero quantity, negative rate, out-of-range GST, fractional accessory quantity, unsupported material and missing accessory master link. Browser workflow and legacy PO migration tests remain pending.


## Purchase cost entry and effective-dated style cost history — 23 November 2026
- Added a phone-friendly Purchase Cost & Style History screen under More.
- Supports supplier-bill cost references and manual verified opening costs, style plus optional colour/size, supplier/reference, effective date, quantity for bill-backed entries, unit cost, eligible direct freight and recoverable GST shown separately.
- Shows a landed unit-cost preview using entered freight divided by bill quantity. Recoverable GST is excluded from the garment cost calculation.
- Requires a source reference for bill-backed costs, positive whole bill quantity, valid non-future effective date and a reason for zero-cost entries. Detects duplicate supplier + bill + style/variant records.
- New entries are saved as Pending Review and are not eligible for the existing profitability matcher until an authorised approval workflow is implemented. A cost reference does not create a supplier payable, purchase voucher or Tally entry.
- Added the cost-history key to manual backup and restore allow-lists.
- Verification: app.js syntax passed before commit; app script cache version updated to v48 and service-worker cache to v82. Profitability matching was tightened to use Approved costs only; bill-backed landed unit cost (base cost plus allocated eligible freight) is the matched cost, with recoverable GST excluded.
- Limitations: no approval/reversal UI or role enforcement yet; no supplier-master picker or bill attachment; cost history is local to this device; freight allocation is a simple quantity allocation; manufactured-style BOM, labour, wastage and job-work costs are not complete. Full backup/restore, profitability matching and browser/device tests remain pending.

## Style cost review, reversal and backup integrity — 23 November 2026
- Added a review action for Pending Review style-cost records. A reviewer must confirm that the source bill/reference was checked before marking the record Approved; approved records then become eligible for the existing estimate-only profitability matcher.
- Added a reversal action for Approved cost records. Reversal requires a reason and confirmation, preserves the original record, records local reversal metadata and excludes the reversed record from future profitability matching. Historical invoices are not rewritten.
- The review/reversal metadata is stored locally and uses a generic local reviewer label. This is a workflow safeguard only, not secure owner/accountant authentication, maker-checker separation or server-enforced authorisation. Do not treat it as production approval control until the later identity and role-security phase is complete.
- Hardened backup restore validation for style-cost history: unique nonblank IDs, style, strict real calendar effective date, recognised status, finite non-negative cost fields, and required approval/reversal metadata. Invalid records are rejected before any current device data is changed.
- Corrected customer-master restore support: the customer master is an array and is now included in the restore allow-list and array validation, with duplicate ID/name and credit-setting checks.
- Added dispatch records to the manual business backup key list so they are included in new backups.
- Verification: app.js JavaScript syntax passed after both changes; app asset cache advanced to v49; service-worker cache advanced to v83. GitHub Actions validation and Pages deployment are pending verification. No live browser/device workflow or real backup/restore simulation is claimed.

## Smart dashboard live local metrics — 23 November 2026
- Replaced placeholder dashboard figures with calculations from saved local tax invoices, customer invoice/opening-balance receivables and garment stock movement records.
- Dashboard now shows today's invoiced sales, open customer outstanding, overdue receivables, saleable stock pieces, active sales orders, active manufacturing orders and zero/negative stock variants.
- Recent activity combines saved sales orders and tax invoices. Quick actions remain available for sales orders, purchase drafts, stock and customer records.
- Dashboard figures are explicitly described as device-local and based only on saved records. Zero-stock alerts are shown; reorder thresholds are not configured, and invoice records are not represented as a complete accounting ledger.
- Verification: app.js syntax passed; app asset cache advanced to v50 and service-worker cache to v84. CI and Pages deployment are pending final status check. No browser/device test or real-data reconciliation is claimed.
