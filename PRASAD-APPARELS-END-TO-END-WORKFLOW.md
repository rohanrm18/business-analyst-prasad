# Prasad Apparels — End-to-End Operating Workflow

## Product rule

The application follows the real garment-business lifecycle. It is not a set of disconnected forms. Each document has its own purpose, status, quantities and links. A sample is not a sale; a manufacturing order is not a customer sales order; a tax invoice is not proof of dispatch; and a supplier purchase order is not a customer PO.

## Main navigation and plain-language order

1. **Dashboard** — what needs attention today: samples awaiting approval, customer orders due, production delayed, material shortages, QC pending, ready stock, packing pending, invoices due, dispatch pending and collections.
2. **Customers & Sales** — enquiries, customer PO, sample request, quotation/order confirmation, sales order and customer follow-up.
3. **Samples & Styles** — style/design master, sample development, sample versions, measurements, fabric/trim references, photos/documents, submission and approval/revision/rejection.
4. **Production** — manufacturing orders, size plans, BOM, material planning, cutting, stitching/job work, finishing, QC, production holds and finished-goods receipt.
5. **Purchases** — material request, supplier quotation/rate, supplier PO, inward/GRN, quality inspection, accepted stock, supplier bill and supplier payment/TDS review.
6. **Stock** — fabric rolls, accessories, work-in-progress, finished garments, style/colour/size/lot/location balances, reservations, returns and adjustments.
7. **Packing & Dispatch** — pick/reserve, carton-wise packing slip, invoice gate, LR/AWB, E-Way Bill review, transporter/customer copies, courier envelope and delivery follow-up.
8. **Accounts & GST Working** — customer receipts/outstanding, supplier payments, expenses, cash/bank, TDS working and CA-only GST working. No GST filing in the current phase.
9. **Reports** — sales, orders, production efficiency, stock, purchase, customer/supplier balances, style costing and estimated profitability.
10. **Settings & Import** — masters, numbering, access design, historical CSV/XLSX import and later final-phase cloud/security settings.

The UI should use guided action buttons and a single source record rather than asking users to enter the same customer, style, size plan or quantity again.

## End-to-end business flow

### A. Style and sample development

1. Create or select a Style Master: style/design number, garment description/category, target customer segment, base colour, size range, images/reference, fabric and trims, measurement/specification sheet and active/revised/retired state.
2. Record a Sample Request with source (internal development or customer request), customer if applicable, requested date, required-by date, sample type and instructions.
3. Create a Sample Job linked to the style and request. Track sample version, maker/contractor, material issue, cost estimate, completion date and sample photos/measurement notes.
4. Submit the exact sample version for approval. Statuses: Draft, In Progress, Ready for Review, Submitted, Approved, Revision Required, Rejected, Superseded.
5. Approval records who/when/reference and freezes the approved sample version/specification as the production reference. Revision creates a new version; it must not overwrite the approved version.
6. A bulk production order cannot be released until an approved sample/specification exists, unless an authorised documented exception is recorded (e.g. repeat style with an existing approved version).
7. Sample dispatch is a separate non-sale dispatch record. If a sample is chargeable, create a separately identified sample sale/invoice only after the commercial/tax treatment is confirmed; never treat every sample as a normal bulk sale.

### B. Customer enquiry, PO and sales order

1. Create/select Customer Master once; preserve billing and ship-to addresses, GSTIN/contact/payment terms and credit settings.
2. Capture enquiry and quote with style, colour, size quantities, rates, requested delivery date and validity.
3. Capture Customer PO separately from supplier purchase orders. Store PO number/date, required delivery, line-wise style/colour/size quantities, agreed rates/terms and original PO attachment.
4. Convert a confirmed PO into one or more Sales Orders. Each line retains its source PO line and quantity. One PO may have multiple fulfilment orders; remaining quantity/value must be visible.
5. If the customer requests a new style/sample, link the Sample Request to the customer PO/enquiry. A sample approval can then release bulk production.
6. Sales order fulfilment decision:
   - **Ready stock available:** reserve exact style/colour/size/lot quantities.
   - **Insufficient stock:** create a linked Manufacturing Order for the shortage, or an authorised replenishment order if making stock.
   - **Mixed:** reserve available stock and create production only for the balance.
7. Prevent double reservation. Show ordered, reserved, production planned, packed, dispatched, invoiced and remaining quantities separately.

### C. Manufacturing and production

1. Manufacturing Order (MO) must identify its source: Customer Sales Order, Stock Replenishment, Sample/Development, or Rework. Link the originating record and exact approved style/sample version.
2. Capture style, colour, size-wise quantity plan, target dates, priority, production location, in-house/job-work routing, responsible person and approved BOM.
3. BOM/material planning calculates fabric meters and accessories by style/size plus approved wastage. Compare requirements with usable stock and show shortages.
4. Create purchase requisitions only for shortages; group by supplier/material. Convert approved requisition to Supplier PO.
5. Supplier PO → physical GRN → quality inspection → accepted/rejected/pending quantities. Only accepted quantities enter usable raw-material stock.
6. Production issue reserves/issues material against the MO. Track issued, consumed, reusable return, wastage and rejection separately.
7. Track stages with quantities, not just a single status: planning, material ready, cutting, stitching, job work outward/return, finishing, accessories, ironing, QC, rework and completed. Each stage update records completed quantity, date, operator/contractor, rate/cost where relevant and source challan.
8. Stage quantities cannot exceed the MO size-wise balance. Outsourced job-work outward and inward must reconcile; unreturned quantity remains with contractor/in transit.
9. QC classifies passed, rework and rejected pieces. Rework creates a linked rework task; rejected goods do not become saleable stock.
10. Only QC-passed finished pieces are received into finished-goods stock by exact style/colour/size/lot/location. WIP and finished goods must never double-count the same pieces.
11. Production holds capture reason, owner, expected resolution and resolution history. Delayed orders appear on dashboard.

### D. Packing, invoice and dispatch

1. Pick from reserved finished stock; verify exact order line/size/colour quantities.
2. Support partial packing into multiple cartons and multiple packing slips against the order. Each carton slip has its own contents; packed quantity cannot exceed order quantity or available/reserved stock.
3. Packing confirmation is mandatory before billing. Revisions/cancellations must reverse/release the original quantities with a reason; do not overwrite history.
4. Create invoice from the approved packed quantities, linked to customer PO, sales order, packing slip(s) and dispatch allocation. Prevent over-invoicing and duplicate billing.
5. Record carton count and invoice copy designations. GST working is for CA review only in this phase; no portal filing.
6. Create one or more dispatches as required. Record transporter/LR or courier/AWB, booking date, tracking and delivery proof. Partial dispatch is allowed and remaining quantities stay open.
7. E-Way Bill applicability is checked against effective-dated jurisdiction rules and consignment facts; no fabricated number or QR. If legally required, transporter print remains blocked until genuine official document is linked.
8. Physical dispatch is the stock-out event. Invoice creation alone must not reduce physical stock. Link the stock movement to the dispatch to prevent double deduction.
9. Customer invoice copy is available for share after dispatch/LR data is recorded. Sharing uses manual download/share until an approved provider confirms delivery.
10. Delivery, short delivery, damage, customer return and credit-note review are separately tracked. Returned pieces enter quarantine until inspection.

### E. Accounts, payments and profitability

- Customer receipts are separate from invoices and allocated invoice-wise; allocations cannot exceed receipt amount or invoice residual.
- Supplier cash payments, TDS working and purchase advances are separate events; no over-settlement of the invoice residual. CA validates statutory applicability/rates/thresholds.
- Expenses, cash and bank movements are separately recorded with supporting references.
- Style cost history is effective-dated and source-labelled. Estimated profitability must identify missing costs and must not be presented as audited actual profit.
- GST screens provide working/reports for the CA only; filing is not in scope now.

## Shared document and status links

Customer enquiry → Sample Request (if needed) → Approved Sample Version → Customer PO → Sales Order → Stock Reservation and/or Manufacturing Order → Material Requisition → Supplier PO → GRN → QC → Raw Material Stock → Production Stage Ledger → Finished Goods QC/Receipt → Packing Slip(s) → Tax Invoice(s) → Dispatch(es) → Delivery/Returns → Customer Receipt/Allocation.

For own-stock replenishment, the Manufacturing Order starts from a Stock Replenishment plan and later finished stock can be reserved for customer orders. A sample-only job stays in Samples and does not create saleable finished stock unless it is explicitly approved as a production quantity.

## User experience standards

- Use the same names throughout the app: Customer PO vs Supplier PO; Sales Order vs Manufacturing Order; Sample Request vs Sample Job; Packing Slip vs Invoice vs Dispatch.
- Every list has search, filters, status, due date and a clear next action.
- Each detail page shows a simple progress timeline and linked documents.
- Show quantities in pieces/meters as appropriate, and always by style/colour/size where relevant.
- One-tap "Create next step" actions should prefill linked information and retain the source references.
- Block unsafe transitions with a plain-language explanation and a route to resolve the issue.
- Keep a full change/reversal history; never silently edit a posted stock or financial event.
- Local prototype data is not shared across devices. Cloud sync, server-side access enforcement, backup and recovery are reserved for the final phase as directed.

## Implementation and acceptance checklist

- [ ] Style master and versioned approved sample workflow.
- [ ] Customer enquiry/quotation/customer PO workflow.
- [ ] Sales order to stock reservation / manufacturing shortage split.
- [ ] Manufacturing order source and size-wise quantity ledger.
- [ ] BOM, procurement, GRN and QC integration.
- [ ] Stage-wise production, job-work reconciliation, rework and production costing.
- [ ] QC-passed finished stock receipt.
- [ ] Multiple carton packing slips and partial invoice/dispatch allocations.
- [ ] Dispatch is the only physical sales stock-out event.
- [ ] Returns, quarantine and restock/rework decisions.
- [ ] Invoice/receipt/supplier payment allocation safeguards.
- [ ] Unified dashboard and navigation with role-specific views.
- [ ] Historical import with preview, duplicate checks, reconciliation and rollback.
- [ ] Consolidated end-to-end regression tests before final cloud/security phase.
