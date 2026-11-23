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
| Mandatory packing slip | Packing confirmation and printable carton copy before any sales invoice | First local prototype implemented: order-linked packing confirmation, price/GST-free printout, invoice gate, packed-quantity cap and backup/restore validation. Partial packing, revisions, permissions, physical print confirmation and shared ledger remain incomplete |\n| Dispatch | Partial/size-wise dispatch, packing list, delivery challan, transporter/LR, delivery proof and returns | Invoice-linked transporter/LR/AWB, customer copy after LR, duplex transporter print review and retry-safe stock issue posting are implemented locally. Partial order fulfilment is supported by separate packing slips/invoices; multiple dispatch records against one invoice, delivery proof/returns, secure shared files, automatic courier/WhatsApp/email delivery and live GSP remain incomplete |
| E-Way Bill | Direct generation through authorised GSP, with review and explicit confirmation | Approved workflow is documented in README; not implemented, not connected to GSP and must not create dummy numbers |
| Customer ledger & collections | Invoice-wise balances, receipts, allocations, ageing and statements | Local invoice-wise receipts/allocations, ageing, credit notes, disputes/holds and collection promise dates exist; no shared ledger, automatic bank feed or automatic message delivery |
| Due notifications | Reminders before/on/after due date; WhatsApp fallback and official automatic WhatsApp | Collection workflow documented; WhatsApp server foundation exists, but live Meta setup and ledger scheduler are not connected |
| Credit control | Customer credit limit, warnings, approvals and overdue control | Specification recorded in CUSTOMER-CREDIT-CONTROL.md; not reliable company-wide until shared backend and server-side checks exist |
| Style cost history | Add verified per-piece cost versions by style, optional colour/size and effective date; preserve prior versions. Local entry/history screen exists; profitability report now consumes effective-dated style costs, but costs are not automatically reconciled to supplier bills or production batches |
| Customer profitability | Profit by customer, style and month; rankings and collection behaviour | Local estimate report implemented for saved tax invoices and effective-dated style costs. Shows covered-sales gross profit and missing-cost coverage; not audited/net profit and not reconciled to returns, credit notes, Tally or shared data |
| Purchase cost history | Simple purchase-cost entry, style/variant cost history and landed-cost allocation | Specification recorded in PURCHASE-COST-AND-STYLE-HISTORY.md; entry screens and costing engine not yet implemented |
| Garment stock control | Track finished stock by style/colour/size, inward, production, reservation, dispatch, returns and physical counts | Local garment movement ledger exists; QC-passed production receipts, quarantined customer returns, dispatch stock issues and physical-count variance posting are now connected. Still local; purchase inward, all production and all return paths are not fully auto-posted; no cloud concurrency or valuation |
| Supplier procurement | Supplier master, supplier PO, inward GRN, inspection, accepted/rejected quantities, purchase bills, invoice-wise supplier payments and TDS working | Local linked path now connects supplier master PAN/constitution, approved PO/GRN selection on reviewed purchase bills, duplicate GRN-link prevention, invoice-wise payments and TDS CA working. Still browser-local; PO advances can be applied to linked bills through a local allocation register without double-counting cash; shared accounts reconciliation is incomplete |
| Photo purchase entry | Photograph supplier bill and OCR fields | OCR-assisted local entry exists; line extraction needs human review and is not guaranteed |
| Supplier payments | Allocate payments invoice-wise and show supplier balances | Local supplier-ledger/payment workflow code exists; a separate manual chart of accounts, balanced journal, reversal and manual-only statement snapshots were added; automatic posting from sales/purchase/receipt/payment/expense/stock and complete company financial statements are still missing |
| TDS | Calculate working TDS for relevant contractor/job-work payments and send working to CA | Local TDS register and CA handover workbook exist; CA must verify applicability; no statutory filing |
| GST for CA | Prepare GST working, summaries and review exports for CA | Local GST working screen and CSV exports exist; currently limited to local saved sales invoices and reviewed purchase bills, with basic checks. It is not complete GST reconciliation or a portal-ready return |
| GST filing | Automatic or manual filing | **Explicitly out of scope now. No portal filing or return submission. May be considered later only with approval.** |
| Fabric/materials | Fabric rolls, meters, lots, colours, cutting issue/return/wastage, accessories | Existing local fabric/trim ledgers and BOM reservations exist; new cutting-batch meter reconciliation records issued/used/wastage/returned. The new cutting batch register is not yet posting into the fabric-roll ledger; local only |
| BOM | Style BOM, size-wise material use, pre-cut shortage gate | Local approved BOM snapshots, size-plan checks, material shortage gate and all-or-nothing MO reservations are present. Still device-local and not a server-enforced shared ledger |
| Purchase planning | Calculate material shortages against open production orders | Initial local planning exists; depends on local BOM/movement data and is not a complete procurement engine |
| Production | Track production stages, order progress, holds/problems, job work and returns | Local stage tracker, job-work challan register, cutting reconciliation and size-wise QC batches are present; accepted QC pieces post once to garment stock and full inspection marks the MO Completed. Full operation-stage reconciliation, material challans, rework loops, wages and integrated costing remain incomplete |
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

## Consolidated multi-module backup and restore validation — 23 November 2026
- Audited the actual browser-local storage keys across the main app, ERP/procurement, manufacturing/BOM, supplier settlements, contractor/job-work and TDS/CA handover modules.
- The final restore handler is installed by compliance.js after the base app and ERP scripts, so it previously bypassed their earlier record checks. Hardened this final active handler to validate the combined allow-list, JSON types for every module's array/object records, manufacturing object structure, customer-master uniqueness/credit settings, style-cost review/reversal metadata, and invoice-to-approved-packing-slip links before replacing any device data.
- The complete manual backup key chain now includes the app, ERP, dispatch and compliance module keys. Dispatch records and customer masters are included in new backups. Restore remains a local-device replacement operation and requires confirmation.
- Verification: app.js, erp.js, compliance.js, supplier-ledger.js and tds-ca-handover.js syntax checks passed; dashboard smoke checks passed; style-cost action rendering check passed; index and service-worker asset versions are aligned. Full restore simulation with real user records, all edge-case migrations and browser/device regression tests remain pending.
- Security limitation: backup files are not encrypted and local records are not protected by server-enforced roles. Keep backup files private and do not treat local review metadata as secure authorisation.
- Compatibility follow-up: older manufacturing backup records may omit the optional `samples` array; restore now accepts that legacy shape while still requiring a valid `orders` array.


## Additional workflows added — 23 November 2026

A local **Business Control Centre** was added in `advanced-workflows.js` and linked from More. These are implemented local prototypes, not proof of production readiness:

- **Customer returns:** select the original invoice and billed line; return quantity is capped by invoiced quantity less earlier non-cancelled returns; goods enter garment-stock quarantine; QC can mark Restock, Rework or Reject; Restock releases the corresponding quarantine movement; an issued credit note is linked to the original invoice and existing receivables credit-note register.
- **Contractor job-work challans:** record contractor, operation, manufacturing reference, style/colour/size, pieces sent, accepted/rejected/rework quantities, piece rate, advance, extras, deductions and payments. Accepted pieces drive payable. Payment cannot exceed calculated payable; challan cannot close until sent pieces reconcile to accepted + rejected + rework.
- **Manual accounting foundation:** chart of accounts, balanced manual journal entry, reversal-only corrections and trial-balance/P&L/balance snapshots sourced only from those manual journals. This is not a complete double-entry accounting system: invoice, receipt, purchase bill, supplier payment, credit note, stock valuation and expense automatic postings are not yet connected; P&L/balance sheet and locked-period enforcement are not yet complete. CA must approve the chart.
- **Reusable size sets:** save named size ranges for later use. They are not yet connected to every sales-order, stock, production and packing line as a live size-by-colour matrix.
- **Physical stock counts:** compare counted quantity with the local garment stock ledger and post a referenced adjustment movement for the variance.
- **Purchase returns / debit-note register:** capture supplier, original bill/GRN reference, item, quantity, unit, amount and reason. This is not yet integrated with supplier bill balances, supplier ledger or GST working.
- **Customer price lists:** effective-dated customer/style/colour/size rates can be saved. Invoice auto-pricing and repeat-order history integration are still pending.
- **Collection promise dates:** save invoice-linked promised payment dates and follow-up notes. No automatic WhatsApp/SMS sending or delivery tracking is enabled.

The new registers are included in manual backup keys and the active restore validator checks their JSON types before replacing local data. Manual backup remains a device-local JSON export; it is not encrypted cloud backup.

### Remaining critical gaps after this tranche

1. Partial packing and multiple cartons; partial/multiple dispatches with invoice/order quantity reconciliation.
2. Size × colour matrix must be connected directly to sales orders, stock, manufacturing and packing.
3. Cutting plan, fabric issue/consumption/wastage/return reconciliation and contractor material challans.
4. Contractor payable/payment ledger must be reconciled to supplier payments, advances, production costs and style profitability.
5. Returns need credit-note reversal/cancellation controls, refund/credit carry-forward handling, and complete GST/CA review workflow.
6. Purchase return/debit note must adjust supplier balances, accepted stock and CA GST working.
7. Invoice discounts, freight, extra charges, rounding, price-list lookup and customer repeat-order history.
8. Full double-entry ledger, opening balances, automatic balanced postings from every source transaction, journal reversal, trial balance, P&L, balance sheet, bank book, cheque handling, loans/capital/drawings, fixed assets/depreciation and period locking.
9. Financial-year setup and continuous document-number series across every document type; invoice numbering exists locally but no server-enforced gap-free numbering.
10. Global search, comprehensive duplicate checks, validated master/opening-stock import and export, branded print acceptance, additional management reports.
11. Cloud database, secure login, server-enforced roles, identity-backed audit log, automated encrypted backup and tested restore remain deliberately scheduled for the final foundation phase.
12. Consolidated browser/device and end-to-end regression testing is still required. Syntax and local module-load smoke checks are not equivalent to real business acceptance.

**Safety note:** The manual journal view must not be represented as the company's complete trial balance. The application remains a local prototype and must not replace Tally/statutory books or be used as the only record system until all release gates pass.


### Dispatch-to-stock posting integration — 23 November 2026

New dispatch records now attempt a retry-safe physical stock issue when the LR/dispatch is saved. The app checks invoice garment lines for style, colour, size and whole-piece quantities; checks saleable stock; stores a pending dispatch reference before posting; posts each invoice line with a stable dispatch/item reference; and marks stock as posted only after the stock ledger write succeeds. Re-saving a pending dispatch retries without duplicating already-posted movements. A shortage blocks dispatch stock posting. Older dispatch records without a stock-posting marker are labelled legacy-unverified and are not automatically posted, to avoid double deduction where a user may already have made a manual issue.

This is still one full dispatch per invoice. Partial/multiple dispatch allocation and carton-level quantities remain unimplemented. Dispatch-to-stock posting needs a real browser regression test with opening stock, multiple invoice lines, retry after interruption, and legacy records before acceptance.


### Production QC and cutting reconciliation added — 23 November 2026

- **Production QC batches:** select a manufacturing order and size; record accepted, rework and rejected whole pieces; cumulative inspected quantity cannot exceed the MO quantity and cannot exceed the recorded Quality Check stage completion. Only accepted pieces post to saleable garment stock as a Production receipt. A stable MO/date/size/batch reference makes a retry after an interrupted save idempotent. When the full MO quantity has been inspected, the MO is marked Completed, allowing the existing reservation cleanup to release remaining material reservations.
- **Cutting reconciliation:** record MO, style, fabric, lot/shade, pieces cut, metres issued/used/wasted/returned. The form requires issued metres to equal used + wastage + returned within 0.001 m. This is a reconciliation register only; it is not yet connected to the fabric-roll stock issue/return ledger.

Both registers are included in manual backup and restore validation. Multi-stage rework loops, operation-level job-work material transfers and live fabric-roll posting remain pending.


### Search, duplicate scan and exports added — 23 November 2026

The Business Control Centre now includes:
- Global local-record search across customers, suppliers, customer POs, sales orders, invoices, manufacturing orders, dispatches, supplier POs/bills, returns and job-work challans.
- A duplicate scan for customer mobile/GSTIN, supplier GSTIN, customer PO, invoice number, LR, AWB and customer receipt reference. It flags possible duplicates for review; it does not merge or delete records.
- Formula-injection-safe CSV exports for customer, supplier, sales order, tax invoice, garment stock and job-work challan registers.

The search and exports work only with records available in this browser's local storage. This is not server-wide search, and CSV export is not a validated Excel/XLSX import workflow.


### Partial carton packing and invoice-per-carton added — 23 November 2026

Sales orders now support repeated partial packing slips. Each packing confirmation asks for a whole-piece quantity per style/category/colour/size line, calculates remaining quantity across previously approved slips, and blocks over-packing. Each slip is identified as a carton. The billing workflow selects an approved packing slip that has not already been invoiced, pre-fills only that carton’s lines and quantities, and allows a separate invoice for each approved slip. The sales order remains at its original ordered quantity and shows cumulative packed pieces plus whether an unbilled carton is ready.

This enables partial order fulfilment as separate packed cartons and invoices. It does not yet support multiple dispatch records against one invoice, a carton-content scan/verification ledger, or automatic reconciliation of delivered quantities/returns against the original customer PO. Browser testing is required for multiple lines, duplicate style variants, several cartons, invoice-per-slip uniqueness and backup/restore.


### Live stock-state synchronization hardening — 23 November 2026

QC receipts, customer-return restock releases, physical stock-count adjustments and dispatch stock issues now update both the persisted garment-stock ledger and the current in-memory stock array used by the Inventory screen. This prevents the dashboard/stock screen from showing stale balances immediately after one of these workflows posts a movement. The full stock ledger still requires end-to-end tests for retry, restore, multiple variants and negative-stock prevention.


### Financial-year, cheque, capital and local reports added — 23 November 2026

- **Financial-year register:** non-overlapping start/end date ranges can be created and locked/unlocked with a reason. The lock is enforced in the new Business Control Centre forms (returns, job work, QC, cutting, stock counts, purchase returns, manual journals, customer prices, cheques and capital/loan entries). Existing sales, invoice, purchase, dispatch, GST and legacy forms are not all period-lock aware. Year-end carry-forward is not implemented.
- **Document sequences:** new Business Control Centre document types use saved per-financial-year local sequences. Existing invoice numbering remains its own local series. This is not server-enforced gap-free multi-user numbering.
- **Cheque register:** received/issued cheques and post-dated, deposited, cleared, bounced and cancelled statuses can be recorded. Bounced-cheque accounting reversal and bank feed are not connected.
- **Loans, capital and drawings:** manual records can be entered; they are not automatically posted to the double-entry ledger.
- **Local reports:** slow-moving style stock, contractor acceptance/rejection/rework and payable summaries, and receivables due within 30 days. The receivables view is not a complete cash-flow forecast; supplier payables and bank balances are excluded.


### Validated CSV import added — 23 November 2026

The Import Masters tab now provides customer-master and opening-garment-stock CSV templates, CSV parsing with quoted-field support, row-level preview and validation, explicit confirmation before saving, customer duplicate checks, and protection against a second opening-balance import for a style/colour/size already carrying an opening balance. Opening stock imports are posted as traceable Opening balance movements and update the live Inventory screen.

Only CSV is supported in this local prototype. XLSX/Excel and PDF extraction, supplier-master import, full import history/rollback and shared multi-user import locking remain pending.


### Credit-note CA review gate — 23 November 2026

A customer return now creates a **pending CA-review credit-note draft** from the original invoice line. Pending drafts do not reduce customer outstanding. A separate explicit “CA reviewed — issue credit note” action records a reviewer name (local, not identity-verified) and only then marks the credit note approved so the receivables ledger deducts it. CA must still verify GST treatment and issue requirements; there is no GST filing or portal integration.


### Size × colour sales-order matrix added — 23 November 2026

A matrix entry screen now lets the user choose a saved size set, enter one or more colours, and enter whole-piece quantities by colour and size. Each non-zero cell becomes a standard sales-order line, saved to the existing sales-order register. These lines flow into the existing sales-order production planning and partial packing/invoice workflows and carry style/colour/size keys used by garment stock. The matrix creates a new sales order; it does not amend an existing order or convert a customer PO. Changing an order after production starts still needs manager approval and a secure audit trail.


### Guarded sales-order and invoice cancellations — 23 November 2026

- Sales-order cancellation now requires a reason and confirmation, retains the order record, and is blocked if a linked manufacturing order, approved packing slip, invoice or dispatch already exists. A cancelled order cannot be reopened through the status selector; create a new order/reference instead.
- Invoice cancellation now retains the invoice number and marks the invoice REVERSED with reason and local timestamp. It is blocked if dispatch, customer receipt/payment allocation, any credit note or customer return exists. Reversed invoices are hidden from the dispatch queue and excluded from receivables. No stock is reversed because dispatch must not have occurred.
- Cancellation reviewer identity is not authenticated; a secure identity-backed audit log is still part of the final cloud/security phase.


### Contractor payment ledger hardening — 23 Nov 2026

- Contractor challan reconciliation and contractor cash payments are now separate actions. Returned accepted/rejected/rework quantities and approved extras/deductions are updated independently from payment entry.
- Each new contractor payment stores its own payment ID, date, unique reference, amount and timestamp. References already used on another contractor payment are blocked; payment amounts cannot exceed the current unpaid contractor payable.
- The system blocks a quantity/charge update that would reduce the payable below payments already recorded. Challan close still requires sent pieces to reconcile exactly to accepted + rejected + rework.
- Legacy cumulative paid totals are preserved; they are not silently rewritten into invented payment references.
- This remains device-local. It is not yet posted into the supplier payable ledger or double-entry accounts, and browser-local identity/audit is not secure.


### Production rework re-inspection — 23 Nov 2026

- Production QC now distinguishes initial inspection from rework re-inspection. Re-inspection quantities are capped to the outstanding rework balance for the same manufacturing order and size.
- Rework accepted pieces post a separate idempotent production-receipt reference; rework and rejects do not enter saleable stock.
- Rework can return for another rework cycle. The manufacturing order is marked Completed only after initial QC covers the order quantity and no rework remains; it is marked Rework while pieces remain outstanding.
- This is still a local QC workflow and requires consolidated testing with real size plans, stage quantities, stock ledger and manufacturing status transitions.


### Supplier master CSV import — 23 Nov 2026

- The local import workspace now provides a supplier CSV template and supplier-master import alongside customer and opening-stock imports.
- Supplier rows are previewed before confirmation and validated for required name, 10–15 digit phone, optional GSTIN/PAN formats and supported constitution values.
- Duplicate supplier name, phone, GSTIN or PAN values are blocked against both existing supplier records and rows in the same file. Imported supplier IDs and timestamps are generated locally, then the page reloads so the supplier directory reads the imported records.
- XLSX/PDF import, import history, controlled rollback, supplier-bill reconciliation and multi-device import remain pending.


### Cutting batch to fabric-roll integration — 23 Nov 2026

- Business Control Centre cutting batches now require a selected fabric roll and manufacturing order. The form validates the metre reconciliation and calls the existing fabric inventory/BOM reservation controls before saving.
- Successful batches post the roll issue/consumption/wastage/reusable return into the existing roll-wise fabric cut ledger. A stable source batch ID makes a retry idempotent and detects mismatched repeat payloads.
- Fabric stock availability and BOM reservation are checked by the existing inventory logic; a cutting batch is not saved when the fabric movement cannot be posted.
- Consolidated testing is still required for real roll lots, reservations, returns, cutting, and subsequent material balance reports. This remains local-device data.


### Customer return credit-note issue safeguards — 23 Nov 2026

- A return credit note cannot be issued while the return is still awaiting physical QC. The return must first be marked Restock, Rework or Reject.
- Before issue, the workflow rechecks the original invoice exists and the proposed credit amount does not exceed its current outstanding after receipts and previously approved credits.
- This is a local CA-review acknowledgement, not verified CA identity or statutory GST validation. The CA must still verify the credit-note tax treatment and document requirements.


### Dispatch financial-year lock guard — 23 November 2026

- New LR/dispatch dates are now checked against the local financial-year lock before a dispatch record or physical stock issue can be saved. A locked period blocks the new dispatch entry.
- This does not retroactively validate legacy dispatches, and dispatch still supports only one full dispatch per invoice. Consolidated browser tests and broader period-lock coverage across older sales, invoice, purchase and accounting forms remain outstanding.

## Supplier purchase return → payable integration update (23 November 2026)
- New purchase returns must select an existing supplier purchase bill and match its supplier.
- The entered reference must match the bill number, bill ID or linked GRN number.
- New debit notes are saved as `pending_ca_review`; they do not change supplier payable until the explicit CA-reviewed approval action is confirmed.
- Approval rechecks the current bill balance, prior cash/TDS payments, allocated PO advances and other approved debit notes. Approval is blocked if the debit note would exceed the remaining balance.
- Approved debit notes reduce the invoice-wise supplier outstanding and reduce the available balance for subsequent supplier payments and supplier advance allocations.
- Legacy purchase return records remain visible but are not retroactively applied because they have no verified bill link or CA approval.
- This is a local-device review workflow, not authenticated CA identity or maker-checker enforcement. It does not post a stock return, GST credit/debit note, or double-entry journal. CA must verify the original supplier document and tax treatment.
- Validation performed: JavaScript syntax checks passed for `advanced-workflows.js` and `supplier-ledger.js`. No browser/device workflow test or multi-user test performed.


## Partial and multiple dispatch implementation — 23 November 2026

**Implemented in the local PWA prototype**
- Added `partial-dispatch.js`, loaded after the existing workflow modules and included in the service-worker cache.
- One tax invoice can now have multiple dispatch records. Each record allocates whole-piece quantities against individual invoice line indexes.
- The screen shows ordered, previously dispatched and remaining quantities per line and for the invoice.
- A new dispatch cannot allocate more than the remaining quantity for any invoice line. Legacy records without line allocations are conservatively treated as full-invoice dispatches so old records cannot be dispatched again.
- Each dispatch has its own transporter, LR/date, carton count, E-Way Bill review and official document attachment.
- Stock issue is limited to allocated quantities, validates style/colour/size and available saleable stock, and uses a stable dispatch+invoice-line reference to prevent duplicate stock movements on retry.
- Pending stock postings can be retried; retry checks the stable movement reference before adding a movement again.
- Added a dispatch quantity annexure print for each LR. It is explicitly labelled as an annexure, not a new tax invoice; it identifies only the quantities moving under that LR and places the supplied official E-Way Bill file on the reverse when marked required.
- Added the new module to the JavaScript syntax CI check.

**Verification completed**
- JavaScript syntax check passed using `new Function()` on the complete module.
- Functional simulation passed: existing partial allocation reduced line balance from 5 to 3; second dispatch of 3 reduced balance to zero; stock issue created one movement; retry did not create a duplicate.
- This is a code-level simulation, not a browser/device, printer, tax/legal or production multi-user test.

**Remaining limitations**
- Data remains browser-local; simultaneous users/devices are not coordinated and localStorage is not a transactional database.
- Invoice line allocation is the quantity control; carton-by-carton contents, barcode scan/verification, courier API and proof of physical shipment remain pending.
- Dispatch annexure is not a substitute for the original statutory tax invoice. E-Way Bill applicability, consignment values, exemptions and document validity still require current CA/statutory review and genuine authorised EWB data.
- No real printer/duplex orientation test has been performed.


## Contractor job-work payable → supplier payment/TDS bridge — 23 November 2026

**Implemented in the local prototype**
- Existing contractor challan payments now mirror into `pa_supplier_payments_v1` with the same stable payment ID, contractor, challan reference, date, cash amount and TDS fields.
- Contractor payment reduces challan due by cash paid plus TDS withheld; TDS is not treated as cash paid.
- Default TDS choice is **Review with CA**. The payment flow allows Yes/No only as an explicit user confirmation. A Yes selection requires PAN, contractor constitution and a separately entered TDS base; the prototype uses the existing indicative threshold/rate logic (₹30,000 single payment / ₹1,00,000 annual aggregate; 1% Individual/HUF, 2% other entity) and writes the corresponding TDS entry when the threshold is crossed.
- TDS records link to the contractor challan and payment ID. Supplier-payment and TDS registers already exist in the backup allow-list.
- Supplier payment screen now shows contractor challan payable, settled and due totals by contractor.
- Repeat processing of the same payment ID returns the existing settlement instead of creating duplicate supplier-payment or TDS entries.
- The contractor challan payment reference is checked against supplier payment references as well as other contractor challan payments.

**Verification completed**
- Syntax checks passed for `advanced-workflows.js`, `supplier-ledger.js` and `contractor-payables.js`.
- Functional simulation passed for a ₹50,000 job-work payment with a 1% illustrative TDS calculation: ₹50,000 cash + ₹500 TDS = ₹50,500 settlement; a repeated sync kept exactly one supplier payment and one TDS record.
- This is a code-level simulation, not a browser/device, CA, statutory or production multi-user test.

**Remaining limitations**
- TDS applicability, threshold aggregation, section/rate, PAN consequences and treatment must be confirmed by the CA under current law. The app does not file TDS returns or remit TDS.
- This bridge is not yet a complete double-entry posting to contractor expense, TDS payable, cash/bank and advances accounts.
- Data remains device-local. No bank feed, authenticated CA approval, multi-device concurrency control or server-side audit enforcement is present.

## Company-wide financial-year form guard — 23 November 2026

- Added a central capture-phase date guard ahead of individual form handlers, covering the identified sales order, customer PO, invoice, purchase/GRN, supplier payment, customer receipt, manufacturing, stock, dispatch-adjacent and Business Control Centre transaction forms.
- The guard checks the transaction date against locally configured Locked financial-year ranges before the form's save handler runs. Existing entries remain viewable; this guard prevents new submissions in a locked period.
- Existing module-specific checks remain in place. The central guard is a local browser safeguard only, not server-enforced access control or a substitute for a shared company ledger.
- Coverage is based on the current identified form IDs and date field names. Forms without a recognised date field, dynamically introduced forms, edits through non-form actions, and cross-device concurrency still require consolidated regression testing and any necessary follow-up wiring.
- Syntax validation passed for `advanced-workflows.js`. Browser/device regression testing has not yet been performed.

- Follow-up hardening added the size × colour matrix sales-order form to the central guard and updated the Financial Year screen wording so it no longer describes locking as limited only to Business Control Centre forms.

## Configurable automatic-accounting mapping register — 23 November 2026

- Added a posting-mapping workspace inside Business Control Centre → Accounts ledger.
- Supports configurable debit/credit account-code pairs for sales invoices, customer receipts, supplier purchases/payments, contractor job-work, contractor TDS withheld, customer credit notes, purchase returns, stock issues/adjustments, general expenses and bank charges.
- Mappings are selected from the user's own chart of accounts; duplicate event mappings update the existing row, and identical debit/credit accounts are rejected.
- New mappings default to “Draft — CA review required”. A visible status can be set to “CA reviewed” only after the user's CA has confirmed the treatment. This is a user-entered marker, not verified CA identity or approval.
- Mapping register is saved locally, included in the module backup key list and added to validated restore allow-list/type checks.
- No automatic journals are posted from these mappings yet. Tax splitting, GST/TDS calculations, invoice/payment event connectors, stock valuation, accruals and full double-entry reconciliation remain future implementation work. Do not rely on this as a statutory ledger.
- JavaScript syntax validation passed for `advanced-workflows.js` and `compliance.js`. Browser UI, backup/restore round-trip and accounting regression tests remain pending.

## Balanced idempotent mapped-journal posting engine — 23 November 2026

- Added a reusable local posting function, exposed as `window.prasadPostMappedJournal(event, sourceEventId, date, amount, memo, sourceReference)` for subsequent transaction-module integrations.
- The engine requires an existing mapping marked “CA reviewed”, two different account codes that still exist in the chart, a stable source event ID, a valid ISO transaction date, a positive finite amount rounded to paise, and an unlocked financial year.
- It creates exactly two journal lines: debit to the mapped debit account and credit to the mapped credit account. It checks debit and credit equality in paise before saving.
- Stable source type + source event ID makes retries idempotent. A matching retry returns the existing journal; a retry with a changed amount, date or mapped accounts is rejected instead of silently creating a duplicate or changing a posted journal.
- Automatic journal IDs are tied to the source event. Journal metadata retains source type, source ID/reference, amount and account codes for traceability.
- Updated the ledger mapping guidance and PWA asset/cache version.

**Scope and limitations**
- This is the reusable posting engine only. Sales invoice, receipt, purchase bill, supplier payment, contractor/TDS, credit note, stock and expense screens are not yet connected to call it. Do not interpret this as automatic accounting across the business.
- The “CA reviewed” field is still a locally entered status, not authenticated CA approval. Do not activate a mapping until the CA has confirmed the exact accounting basis.
- The engine posts a single two-line amount only. GST/TDS splitting, advance adjustment, inventory valuation, COGS, accruals, multi-line allocations, reversals from source modules and server-side concurrency/uniqueness remain pending.
- Syntax validation passed for `advanced-workflows.js`. Browser/device execution, retry/conflict functional tests, financial-year lock tests and journal report reconciliation remain pending.

## Supplier bill payment → mapped accounting journals — 23 November 2026

- Connected the supplier invoice payment form to the mapped journal engine for the cash portion of a bill payment. When the mapping is locally marked “CA reviewed”, it posts supplier payable Dr / mapped cash-or-bank Cr using the payment's stable ID, payment date and cash amount.
- When TDS is withheld, a separate source event `<payment-id>-TDS` posts supplier payable Dr / mapped TDS payable Cr for the withheld amount. This keeps the cash and TDS credits separate and makes the supplier payable reduction equal cash plus TDS.
- Repeated processing of the same source event is protected by the engine's idempotency check. Payment records retain a small posting-status result for visibility; a missing/unreviewed mapping or any validation error leaves that portion marked pending rather than blocking the supplier payment record.
- The integration deliberately does not post supplier advance allocation as a new payment, because allocation transfers an existing advance and must not create a second cash movement.
- Updated supplier-ledger script cache version and service-worker cache.

**Controls and limitations**
- Map `supplier_payment` to the correct supplier-payable debit and cash/bank credit accounts. Map `tds_withheld` to supplier-payable debit and TDS-payable credit. CA must confirm account treatment before setting either mapping to “CA reviewed”.
- TDS calculation/applicability remains subject to existing CA review workflow; this change only posts the recorded cash/TDS amounts.
- Existing historic payments are not backfilled. No journal is created if a mapping is missing/unreviewed; no automatic retry queue/backfill is implemented yet.
- Contractor job-work payments, procurement PO advances, supplier advance allocations, purchase bills, GST input tax, purchase returns and bank reconciliation are not connected by this change.
- Syntax validation passed for `supplier-ledger.js`. Browser-level payment, TDS, retry, locked-year and trial-balance reconciliation tests remain pending.


## Multi-line mapped accounting journal foundation — 23 November 2026

- Added a second mapped posting API, `window.prasadPostMappedJournalLines(event, sourceEventId, date, lines, memo, sourceReference)`, for source transactions that require multiple debit/credit lines (for example, taxable purchase value plus separately recoverable CGST/SGST/IGST and supplier payable).
- The API requires the event mapping to be locally marked CA reviewed, a stable source event ID, a valid transaction date, 2–100 valid chart accounts/lines, non-negative amounts, no line containing both debit and credit, and exact debit/credit equality to the paise.
- Uses the existing financial-year lock, stable source-event idempotency, and conflict rejection. A matching retry returns the existing journal; a changed date or line/account/amount payload is rejected.
- Added a supplier-advance-allocation mapping category for the future transfer entry (supplier payable Dr / supplier advance asset Cr). This must not create a second cash/bank payment.
- Existing two-line posting API and supplier cash/TDS posting remain unchanged.

**Important limits**
- This is an accounting-engine capability only. The current repository does not expose a complete supplier purchase-bill capture form/source event to connect safely, so purchase bills are not yet automatically posted. No GST amounts or account choices are guessed.
- The multi-line API validates chart membership and balance but relies on the source connector to supply the correct CA-approved account allocation. It does not calculate GST eligibility, tax rates, inventory-vs-expense treatment, reverse charge, or ITC restrictions.
- Supplier advance allocations are not yet journal-posted. Historical purchase bills/payments are not backfilled.
- Syntax validation passed for `advanced-workflows.js`. Browser execution, multi-line retry/conflict tests, account reconciliation and CA review remain pending.


## Supplier purchase bill → GST-separated mapped journal — 23 November 2026

- Connected newly saved, reviewed photo-captured supplier bills to the multi-line mapped accounting API.
- Purchase mapping uses the configured debit account for taxable purchase value and credit account for supplier payable. Added optional, separate Input CGST, Input SGST and Input IGST account-code fields to the mapping register.
- When the mapping is locally marked CA reviewed, each present tax component has its own configured input-tax account, and taxable + CGST + SGST + IGST exactly equals invoice total, a balanced journal is posted: taxable purchase Dr; applicable input GST accounts Dr; supplier payable Cr.
- Bill saves even when automatic posting cannot proceed; it records a pending reason on that bill. Posting failures do not discard the bill.
- Stable bill ID is the journal source ID; the multi-line engine prevents duplicate journal creation on an exact retry and rejects conflicting payloads.
- Only new bills saved after this change are considered. Existing purchase bills are not backfilled. Supplier payments continue to post separately as cash/bank and TDS portions; bill posting does not create a cash payment.
- Supplier advance allocation, purchase returns, freight/discount/cess/rounding lines, reverse charge, ITC eligibility restrictions, inventory-versus-expense policy, and GRN stock valuation remain separate/pending.

**Important controls and limits**
- If the invoice total differs from taxable + CGST + SGST + IGST by more than ₹0.01, posting remains pending; the app does not invent balancing values or accounts.
- Tax account mapping is a configurable chart-code selection, not confirmation of GST input-credit eligibility. CA must confirm account treatment and bill tax data.
- Browser-local only; no server-side concurrency, verified CA identity, backfill or consolidated browser testing.
- Syntax validation passed for `advanced-workflows.js` and `compliance.js`. Browser workflow, tax reconciliation and journal trial-balance tests remain pending.


## Supplier PO advance payment and bill allocation accounting — 23 November 2026

- Added a supplier PO advance payment entry using the supplier master, PO reference, payment date, amount, payment mode and transaction reference. The advance is recorded separately from invoice-wise supplier payments and does not reduce a bill until allocated.
- New advances attempt a mapped journal: Supplier Advances asset Dr / selected Cash or Bank Cr. A locally CA-reviewed `supplier_advance_payment` mapping is required; if unavailable or invalid, the advance remains saved with a pending accounting status and cannot be allocated.
- Advance allocation requires a posted advance journal, matching supplier, PO-linked purchase bill, valid date, available advance and remaining bill balance. It posts Supplier Payable Dr / Supplier Advances Cr as a separate `supplier_advance_allocation` event. It never creates a second cash/bank movement.
- Stable unique IDs are used for advance and allocation journal source events; the multi-line engine retains idempotent retry/conflict handling. The UI shows remaining advance after allocations.
- Legacy advances without a verified mapped advance journal are intentionally not auto-allocated by the new flow. Existing historical allocations are not rewritten.
- This remains local-device accounting. CA must confirm the selected asset, cash/bank and payable accounts. No browser/device, multi-user, bank reconciliation or full trial-balance test has been performed.

- Storage isolation correction: supplier PO advances use dedicated `pa_supplier_advance_payments_v1`; they are not mixed with `pa_procurement_supplier_payments_v1` (formal PO settlement records). This prevents advances from inflating purchase-order paid totals before allocation.

- Supplier invoice payment confirmation now reports separate cash/bank and TDS journal posting statuses, and explicitly warns when either entry remains pending; saving the supplier payment does not falsely imply that its journal posted.


## Manual bank statement reconciliation — 23 November 2026

- Added a Bank Reconciliation tab in the Business Control Centre with local CSV import for bank statement rows. Required headers: date, description (or narration), debit and credit; optional reference/UTR and account columns.
- Imports validate transaction direction and date, skip exact duplicate statement rows using a stable row fingerprint, and retain statement evidence separately in `pa_bank_reconciliation_rows_v1`.
- Candidate suggestions are limited to same-direction, exact-amount source records within a ±3-day date window. The user must select and confirm a candidate; no match is automatic. A source event cannot be linked to two confirmed statement rows.
- Initial source matching covers customer receipts, invoice-wise supplier cash payments, supplier PO advances and formal PO settlement payments. Cash-mode entries are excluded where the source record contains a cash mode; TDS withholding is not treated as a bank payment.
- The new reconciliation register key is included in the app's manual backup-key inventory so it can be included when the existing backup/export workflow runs.\n- Confirmed matches only create a reconciliation link. They do not edit source payments, customer balances, journals or bank balances. Users can unmatch or exclude a statement row with a reason.
- This is a manual CSV/local-device workflow only. No live bank feed, bank API, automatic journal creation, bank-charge posting, running-balance validation, statement closing-balance reconciliation, split/combined payment matching, cheque clearing automation or cloud sync is implemented.
- Existing customer receipt manual bank-reference confirmation remains available; this new register adds statement-row evidence and supplier-side matching. It does not retroactively reconcile historical records.
- Syntax validation passed for `advanced-workflows.js`. CSV/browser interaction, duplicate-import, ambiguous-match, and end-to-end accounting regression tests remain pending. Review statement candidates carefully before confirming; exact amount/date alone does not prove a bank match.


## Bank statement opening/closing balance controls — 23 November 2026

- Extended the manual CSV statement import with optional opening balance, closing balance and bank-account label.
- Computes statement debit and credit totals from all valid transaction rows and checks opening balance + credits − debits = closing balance to ₹0.01.
- Requires opening and closing balances together or neither. A mismatch is clearly recorded as review-required and shown in the reconciliation summary; it does not silently adjust transactions or block the user from retaining statement evidence.
- Creates a separate statement-import register in `pa_bank_reconciliation_statements_v1`, linked to imported rows by statement ID. It records source filename, account label, import time, valid row count, number of new rows, debit/credit totals and balance-check result.
- Both transaction rows and statement-import metadata are included in the app's backup-key inventory.
- Syntax validation passed for `advanced-workflows.js`. Browser CSV parsing, negative/parenthesized amount formats, duplicate re-import, balance mismatch handling and full backup/restore tests remain pending.
- PDF/photo OCR, multi-page statement extraction, XLSX import, bank book posting, split/combined matching and secure cloud document storage are not implemented. Do not upload real bank statements until authentication, access control and encrypted storage are deployed.


## Bank CSV compatibility hardening — 23 November 2026

- Expanded header recognition for common Indian bank exports: Transaction Date / Value Date, Particulars / Transaction Details, Withdrawal(s) / Deposit(s), Debit / Credit, UTR No., cheque reference and account labels.
- Added strict amount parsing for comma/currency-formatted values and negative or parenthesized amounts. A negative debit is normalized as a credit and a negative credit as a debit; rows with invalid or conflicting directions are rejected rather than guessed.
- Corrected the date parser to reliably accept ISO dates and common day/month/year or month/day/year-shaped slash dates. Ambiguous slash-date ordering remains bank-export dependent; verify the imported dates in the review step.
- Syntax validation passed for `advanced-workflows.js`. Real bank CSV samples from the user's bank, browser import behavior and reconciliation regression tests remain pending.


## Bank reconciliation CSV exports — 23 November 2026

- Added an export-all CSV for imported bank statement rows and a separate open-items CSV containing unmatched and suggested/review rows (excluding confirmed and explicitly excluded items).
- Export includes source statement filename/ID, date, account, narration, reference/UTR, debit, credit, reconciliation status, matched source type/party/ID and exclusion reason.
- CSV values are quoted and embedded quotes escaped; UTF-8 BOM is included for spreadsheet compatibility. Export is read-only and does not change reconciliation status or accounting records.
- JavaScript syntax validation passed for advanced-workflows.js. Browser download behavior and spreadsheet opening remain pending manual regression testing.


## Recorded cash movement report — 23 November 2026

- Added a rolling 30-day and 7-day cash movement summary to Business Control Centre reports using dated, non-reversed customer receipts and recorded supplier invoice payments, supplier advances and formal PO settlement payments.
- Shows customer receipts, supplier outflows and net recorded movement; labels the period and clearly states this is not a bank balance or complete cash-flow statement.
- Known coverage limits are displayed: cash/bank modes are not separated; expenses, transfers, contractor payments and unrecorded transactions may be missing. This is an operational visibility report, not a statutory cash-flow statement.
- JavaScript syntax validation passed for advanced-workflows.js. Browser calculation, source-data overlap and financial regression tests remain pending; verify source payment registers before relying on totals.


## Receivables and supplier payables due forecast — 23 November 2026

- Added a forward-looking due-date planning card to Business Control Centre reports, alongside the historical cash-movement summary.
- Customer inflows use open invoice/opening-balance amounts after allocated receipts and non-pending credit notes, using the existing receivables balance helpers.
- Supplier outflows use purchase-bill totals less recorded invoice payments (including TDS withheld), PO-advance allocations and CA-approved linked purchase returns. Pending debit notes do not reduce the forecast.
- Groups open items into overdue, due in 0–7, 8–30, 31–60, 61–90, after 90 days, and missing due date. Invoice date is shown as an estimate only when no explicit due date exists; no date is fabricated.
- Shows total open receivables, supplier payables and net expected movement, plus up to 30 largest/open due items sorted by due date.
- Explicitly excludes collection promises, contractor challans, expenses, loan instalments, cheque clearing and bank balances. Net expected movement is not available cash or a guaranteed collection forecast.
- JavaScript syntax validation passed for advanced-workflows.js. Browser rendering, invoice/payment data reconciliation, date-bucket calculations and full financial regression tests remain pending. Review source registers and due dates before relying on the forecast.


## Customer collection promise monitoring — 23 November 2026

- Enhanced the collection promise register to show live linked-invoice balance, current promise status (past date, due today, upcoming, settled, or invoice unavailable), and receipt activity recorded since the promise was logged.
- Added summary counts for overdue promises with an invoice still open, promises due today, and promises due within seven days.
- Historical promise entries remain visible; multiple promises for one invoice are not silently merged. Receipt activity since logging is informational and is not treated as a formal receipt-to-promise allocation or proof that a particular promise was fulfilled.
- JavaScript syntax validation passed for advanced-workflows.js. Browser interaction, receipt-date edge cases, multiple-promise scenarios and financial regression tests remain pending.


## Cash and bank movement breakdown — 23 November 2026

- Expanded the rolling 30-day / 7-day recorded movement report to separate cash, bank/UPI/cheque and other/unspecified payment modes for both receipts and outflows.
- Supplier invoice payments now use the recorded cash amount (amountPaid) when that field exists, including a legitimate zero-cash / TDS-only settlement; legacy rows fall back to amount only when amountPaid is absent. TDS withheld is not counted as cash paid.
- Contractor/job-work payments are labelled separately within the supplier payment outflow source. Supplier advances and formal PO settlements remain separate source categories.
- The report continues to be an operational register summary, not a bank balance or complete cash-flow statement. It cannot establish cleared funds; unknown payment modes remain in Other. Check source-register overlap before relying on totals.
- JavaScript syntax validation passed for advanced-workflows.js. Browser calculations, representative mixed-mode records, zero-cash TDS cases and source-overlap regression tests remain pending.


## Cheque register safeguards — 23 November 2026

- New cheque records validate number, party, date and positive amount; duplicate cheque number + bank + direction is blocked (received and issued are distinct directions).
- Corrected initial status for non-future received cheques: they start as Received, not Issued. Future-dated cheques start as Post-dated.
- Added controlled status paths: Post-dated → Received / Issued or Cancelled; Received → Deposited / Bounced / Cancelled; Issued → Cleared / Bounced / Cancelled; Deposited → Cleared / Bounced / Cancelled. Cleared, bounced and cancelled are terminal in this register; replacement cheques require a new record.
- Status history stores timestamp and optional note. These are operational records only; they do not verify bank clearance, post journals or automatically reverse payments.
- JavaScript syntax validation passed. Browser interaction, legacy cheque status compatibility and workflow regression tests remain pending.


## Capital and loan movement summary — 23 November 2026

- Capital register now summarizes capital introduced, owner drawings, net owner capital movement, loans received and repayments recorded.
- Loan movements are grouped by lender / bank account reference, with received, repaid and net movement shown per reference. Loan entries require a reference to avoid silently combining unrelated loans.
- Amounts are rounded to paise and inputs are validated; date is checked against the local financial-year lock.
- Important limits: net loan movement is only an estimate from manually recorded totals; repayments are not split into principal and interest, no lender statement or bank reconciliation is performed, and no automatic double-entry journal is posted. Browser interaction and regression testing remain pending.


## Manual accounting ledger hardening — 23 November 2026

- Manual journal entries now validate account selection, non-negative finite amounts, one-sided debit/credit per line, at least two lines, and exact debit/credit equality to the paise. Future-dated entries are blocked.
- Manual journal numbers now use the shared local JV document sequence per financial year instead of array-length numbering.
- Reversal creates a separate opposite journal dated today in the current open financial period; the financial-year lock is checked before reversal. A reversal journal itself cannot be reversed again, preventing accidental reversal chains.
- Chart-of-account creation validates code format, name and account type, and prevents case-insensitive duplicate codes.
- Syntax validation passed. UI interaction, legacy numbering compatibility, and regression tests remain pending. This remains local-only accounting and is not a complete double-entry system until source workflows and secure shared storage are integrated.


## Physical stock count accuracy correction — 23 November 2026

- Physical stock count's system quantity now follows the main garment stock ledger's saleable-stock rule: dispatches and stock-out movements reduce stock; opening, production, purchase and stock-in movements increase it; customer returns remain excluded from saleable quantity until their status is released by QC.
- Style, colour and size inputs are trimmed consistently before matching and posting the variance. Non-future dates, whole-piece counts and financial-year lock are enforced.
- This corrects a prior mismatch where quarantined customer returns could be included in the count's system quantity and create an incorrect adjustment. Syntax validation passed; browser and regression testing remain pending.


## Partial dispatch integrity safeguards — 23 November 2026

- Partial dispatch creation now rejects duplicate transporter + LR/consignment references, future dispatch dates, malformed dates, invalid E-Way Bill status values and invalid carton counts.
- A dispatch marked `posted` is no longer trusted blindly: the linked stock-ledger movement for every dispatch line is checked for the matching source reference, movement type and quantity. If any movement is missing or inconsistent, the record is returned to pending so the existing retry path can repair the posting rather than silently treating it as complete.
- JavaScript syntax validation passed. Browser-level multi-dispatch, retry-after-storage-failure and legacy-record regression tests remain outstanding; this is not proof of end-to-end dispatch correctness.

- Follow-up hardening: the retry/posted check now requires exactly one matching stock-ledger row per dispatch line. If duplicate or quantity-mismatched rows already exist, it stops and asks for reconciliation instead of adding another movement and risking a double stock issue.


## Sales and purchase operational reports — 23 November 2026

- Business Control Centre reports now include non-reversed tax-invoice count, invoice grand total, taxable line value and invoiced pieces; top-10 sales by style/item reference and customer; and supplier-bill totals with recorded cash/bank payments, TDS withheld, allocated supplier advances and CA-approved purchase debit notes.
- Sales line values use the stored taxable amount when available, otherwise quantity × rate less line discount. Sales returns / credit notes are explicitly not netted from the sales report.
- Purchase residual is labelled indicative because overlap between local payment, advance and debit-note registers still requires bill-by-bill reconciliation. This is not an audited P&L, GST return or ITC claim.
- Syntax validation passed. Representative data, browser rendering and reconciliation regression tests remain pending.


## 23 November 2026 — Production and QC operational report
- Added a Production & QC Control card to the Business Control Centre reports.
- Summarises non-cancelled manufacturing orders and planned pieces, recorded QC accepted/rework/rejected entries, fabric issued/used/wastage/returned, cut batches pending fabric-ledger posting, and cutting quantity mismatches.
- Explicitly labels QC numbers as inspection-event totals because rework re-inspections may count the same physical pieces again. It does not claim unique finished-piece output, MO completion, or saleable stock certification.
- Updated `advanced-workflows.js` asset version to v40 and service-worker cache to `prasad-analyst-v139-production-report`.
- JavaScript syntax check passed using `new Function()` before commit. GitHub Actions validation and Pages deployment for the latest commits were queued/in progress at audit update time; do not treat this as browser/regression-tested or production-ready.
