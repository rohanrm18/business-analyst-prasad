# Customer Purchase Order (PO) — Approved Feature Specification

**Purpose:** Record purchase orders received from Prasad Apparels customers. This is separate from supplier purchase orders used to buy fabric/accessories.

**Status:** Approved for the project roadmap; not yet implemented in the application.

## Entry and document attachment
- Add a **Customer PO** option in the customer/sales workflow.
- Capture customer, customer PO number, PO date, delivery/required-by date, validity/expiry, billing and delivery locations, contact, payment terms and customer instructions.
- Attach the customer's original PO as PDF or image where supported. Retain the original file reference and allow the user to open/download it.
- Prevent accidental duplicate PO numbers for the same customer; allow an explicit override with a warning if a customer legitimately reuses a number.

## PO line details
Each line should support style/item code, description, colour, size, ordered quantity, unit, agreed unit rate, discount if applicable, GST/HSN details and line notes. Support size-wise garment quantities and multiple lines.

## Linkage and quantity control
- Convert an approved customer PO into one or more Prasad sales orders.
- Link sales orders and tax invoices back to the originating customer PO.
- Track ordered, allocated/ordered internally, dispatched/supplied, invoiced and pending quantities per PO line (avoid counting the same dispatch/invoice twice).
- Show remaining quantity and value, including partial supplies and partial invoices.
- Warn when a sales order or invoice exceeds the remaining PO quantity/value. Require an authorised override and reason; never silently increase the PO.
- Allow one PO to be fulfilled through multiple orders/invoices, and support a single invoice covering multiple PO references only where the allocation is explicit.

## Statuses and follow-up
Suggested statuses: Draft, Received, Under Review, Confirmed, Partially Supplied, Fully Supplied, Completed, On Hold, Cancelled and Expired. Derive statuses from quantities where possible, while retaining manual review/hold status and audit history.
Provide search/filter by customer, PO number, date, required delivery date and status. Dashboard summaries should show upcoming due dates and overdue pending quantities.

## Outputs and audit
- View, print, export and share a PO acknowledgement/order summary.
- Preserve the uploaded customer PO and a change history for edits, approvals, overrides and linked invoices.
- Include PO records and attachments in a documented backup/restore process.

## Data and implementation safeguards
- Keep customer PO separate from supplier procurement PO records and their GRN/QC workflow.
- Validate customer, PO number/date, line quantities, rates and totals before confirmation.
- Do not claim that a customer PO is a GST invoice or that it has been posted to Tally.
- Current app data is browser-local and does not automatically sync across devices. Do not claim cross-device access or secure document storage until authenticated backend storage, access control, encryption, backups and recovery are implemented.
- Test partial deliveries, multiple invoices, returns/adjustments, over-quantity warnings, duplicate PO numbers, attachments and backup/restore before operational acceptance.
