# Prasad Business — Master Requirements Register & Usability Audit

## Purpose

This is the master checklist of requirements approved for Prasad Apparels Business Analyst. It separates working prototype code from specifications, foundations and features that still need implementation. A file or roadmap entry is not proof that a feature is complete.

## Non-negotiable business rules

1. **Tally.ERP 9 is the accounting source of truth.** The business uses accounting-invoice-only entries, not stock-item invoices. Do not assume Tally contains garment-level stock valuation or line-item inventory data.
2. Do not claim Tally is connected until a real, tested integration is deployed and reconciled. The current office connector is a read-only diagnostic foundation.
3. Do not invent sales, stock, tax, payment, cost, profit, E-Way Bill or message-delivery figures. Show source, sync time and incomplete-data warnings.
4. Local browser records are device-specific until secure shared storage, authentication, sync, backup and recovery are completed.
5. **GST is for CA working only in the current phase. No GST portal filing, return submission or automatic filing.** Automatic filing can be considered later as a separate approved phase.
6. TDS is internal working and CA handover only; no statutory TDS return filing.
7. WhatsApp automatic reminders remain disabled until official Meta onboarding, consent, secure shared ledgers, scheduling and delivery-status testing are complete.
8. Final end-to-end testing should be done as one consolidated review after the approved feature set is gathered.

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
| Tally | Tally.ERP 9, accounting-invoice-only; Tally remains accounting source of truth | Read-only local XML diagnostic connector foundation exists; live Tally data sync and voucher posting are not implemented |
| Sales orders | Create orders, scan garment barcode, share order summary | Local draft/order prototype and barcode scan/share foundation exist; no verified shared customer/style master or Tally posting |
| Sales tax invoices | Create GST tax invoices with CGST/SGST/IGST, print/share, convert from sales order | Local-device invoice prototype exists; not connected to Tally or shared database; verify invoice/legal setup before live use |
| Customer PO | Record customer's PO, attach original, convert to orders and track balance | Specification recorded in CUSTOMER-PO-WORKFLOW.md; full linked UI/workflow not confirmed complete |
| Dispatch | Partial/size-wise dispatch, packing list, delivery challan, transporter/LR, delivery proof and returns | Specification recorded in DISPATCH-MANAGEMENT-WORKFLOW.md; full workflow not confirmed complete |
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
| Security | Login, roles, audit, backup, recovery and secure attachments | Not complete; required before live multi-user financial use |
| Reports | Sales, purchases, customer/supplier balances, stock, GST, TDS and profit | Some local reports/exports exist; not all are reconciled to one verified data source |

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
