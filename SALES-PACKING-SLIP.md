# Mandatory Sales Packing Slip, Invoice Copies & Dispatch Workflow

**Status:** Approved mandatory workflow requirement; implementation must be verified before being described as live.

## Non-negotiable billing gate
A sales tax invoice must not be created/issued as a completed sale until the order has a completed and approved packing slip. Invoice creation must be launched from the approved packing slip/packed order, not bypassed by a direct create-invoice shortcut. Any exceptional override must be permission-controlled, require a reason, and be recorded in the audit trail; do not provide an ordinary-user bypass.

## Packing workflow
1. Select the confirmed customer order and verify customer, billing address, delivery address and PO reference.
2. Pick and pack garments by style/item number, colour and size.
3. Record packed quantity per line/size, carton number, carton count, package type and optional weight/dimensions.
4. Validate packed quantities against the order and available finished-goods quantity. Partial packing is supported; over-packing is blocked unless an authorised override with reason is recorded.
5. Save and approve the packing slip. Generate a unique packing slip number and retain its order/customer/date linkage.
6. Print **one Packing Slip — Carton Copy** and put it inside the carton. This document must not show prices, taxable value, GST, discounts, customer credit or internal costing.
7. Only after approval, enable invoice creation for the packed quantities. Prevent invoicing the same packed quantity twice. Partial invoices/dispatches must show packed, previously invoiced, current invoice and balance quantities.

## Required invoice copies
For every sales tax invoice, provide separately labelled print actions/copies:
- **Invoice — Carton Copy (1):** one invoice copy to place inside the carton.
- **Invoice — Transporter Copy (1):** one invoice copy to hand to the transporter/transport company with the goods.
- **Invoice — Customer Copy:** after the LR/consignment note number is entered and saved, make the customer copy available for dispatch to the customer by courier, WhatsApp or email.

The customer copy must be linked to the exact invoice and dispatch. Do not allow the customer-copy dispatch action to be marked completed until the LR number is recorded (unless the shipment is explicitly marked as self-delivery/no-LR with a reason and authorised user). Store the LR number/date, transporter name and dispatch reference against the invoice.

## Customer invoice delivery after LR entry
After LR number is saved, show a clear customer-copy panel with:
- Preview/download/print customer invoice copy.
- **Courier:** record courier company, tracking/AWB number, booking date and delivery status/reference. Generate a courier envelope/label using the customer's saved delivery contact details.
- **WhatsApp:** open a prefilled share flow with the invoice PDF and customer mobile number when the platform supports it. If direct attachment/send is unavailable, provide a clear manual share/download fallback. Never claim it was sent or delivered unless a connected provider confirms the event.
- **Email:** prepare an email addressed to the customer's saved email with the invoice attached when a configured mail service supports attachments. Otherwise provide a downloadable invoice and prefilled email draft/manual fallback. Never claim it was sent or delivered unless a connected provider confirms the event.
- Record channel, recipient, prepared/sent/delivered/failed status, timestamp and provider reference where available. "Prepared" or a locally opened share sheet must never be shown as "Sent".
- Prevent accidental duplicate sends; allow an intentional resend with confirmation and an audit entry.

## Courier envelope / address label printing
Provide a separate **Print Courier Envelope** action from the customer-copy dispatch panel and customer master. It must print the selected customer's:
- Customer / business name
- Contact person's name (optional)
- Complete delivery address
- Area / city / state
- PIN code (prominent and validated as a six-digit Indian PIN when applicable)
- Mobile number (prominent; allow alternate mobile if saved)

Allow the operator to select a saved delivery address or enter a one-time alternate shipping address without silently overwriting the customer's master address. Preview before print, support reprint marked "COPY" where appropriate, and offer configurable envelope/label paper size, margins, alignment and print scaling. Include a return/from address from company settings; do not invent one if it has not been configured.

## Print and dispatch checklist
Track each output independently:
- Packing Slip — Carton Copy printed (1)
- Invoice — Carton Copy printed (1)
- Invoice — Transporter Copy printed (1)
- LR number recorded
- Customer Invoice Copy prepared/printed
- Customer copy sent by courier / WhatsApp / email (each channel separately, with truthful status)
- Courier envelope/label printed

Reprints must be marked **DUPLICATE / REPRINT** and must not create a new invoice, packing slip, dispatch or alter quantities.

## Controls and audit
- Keep packed, invoiced, dispatched, returned and balance quantities separate.
- A packing slip does not itself create a tax invoice, receipt, stock issue or dispatch confirmation.
- If packed contents change after approval, create a revision/void-and-reissue history; never silently alter the printed record.
- Support carton-wise contents and multiple cartons per packing slip.
- Record who prepared/checked/approved and timestamps when user accounts/roles are available.
- Store invoice-copy print history, LR details, customer-copy channel activity, courier tracking and envelope print history against the dispatch.
- Include packing slips, line details, carton details, invoice links and dispatch records in backup/restore.
- Until authenticated shared storage and transaction-safe quantity locking exist, clearly mark the module as device-local and not safe for simultaneous multi-device packing.

## Acceptance tests
1. Direct invoice creation without approved packing slip is blocked.
2. Complete packing slip for mixed styles/colours/sizes and multiple cartons.
3. Print one carton packing slip without prices or GST.
4. Print one invoice carton copy and one transporter copy, both linked to the same invoice.
5. LR entry unlocks customer invoice-copy dispatch actions.
6. Courier, WhatsApp and email statuses distinguish prepared, sent, delivered and failed accurately.
7. Print courier envelope with name, address, mobile and PIN; verify preview, alignment and alternate address handling.
8. Reprint documents with duplicate marking and no quantity mutation.
9. Partial packing and partial billing calculate remaining quantities correctly.
10. Attempt to over-pack or invoice the same packed quantity twice and verify blocking.
11. Edit packed contents after approval and verify revision/audit history.
12. Verify backup/restore of packing slip, carton, invoice-copy and dispatch details.

## Daily operator flow
**Customer Order → Pick & Pack → Approve Packing Slip → Print 1 Packing Slip Carton Copy → Put inside carton → Create Tax Invoice → Print 1 Invoice Carton Copy + 1 Transporter Copy → Dispatch & enter LR number → Prepare customer invoice copy → Send by courier / WhatsApp / email → Print courier envelope.**


## Current prototype implementation note — 22 November 2026

A first local-device packing-slip gate is now present in `app.js`:
- Saved sales orders show whether an approved packing slip exists.
- The operator must explicitly confirm that garments have been physically picked, checked and packed.
- The app creates a numbered packing-slip record from the saved order and opens a printable **carton copy** showing garment/style/category/colour/size/quantity only, with no prices or GST.
- A tax invoice can be launched from that order only after an approved packing slip exists.
- The invoice is linked to the order and packing-slip record, cannot exceed the packed quantity for a matching item/variant, and the same order cannot be invoiced twice.
- Packing-slip records are included in manual backup/restore; restore checks that each slip links to a saved order and that invoices reference an approved slip.

**Limitations still open:** this is a browser-local prototype, not a shared multi-user packing ledger. It currently approves the entire saved order quantity in one step; partial packing, carton-wise contents, separate packing-slip revision/reversal, user identity/audit permissions, mandatory physical printer confirmation, invoice carton/transporter/customer copy controls, LR-triggered customer copy, courier envelope and E-Way Bill duplex printing are not yet implemented. A browser print dialog opening is not proof that paper physically printed. Do not treat this as production-ready until the remaining controls and device print tests are complete.
