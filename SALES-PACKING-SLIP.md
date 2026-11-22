# Mandatory Sales Packing Slip & Invoice Dispatch Copies

**Status:** Approved mandatory workflow requirement; not yet confirmed as implemented in the live app.

## Non-negotiable billing gate
A sales tax invoice must not be issued/printed as a completed sale until the order has a completed and approved packing slip. The invoice form must be reached from the approved packing slip/packed order, not bypassed by a direct create-invoice shortcut. Any exceptional override must be permission-controlled, require a reason, and be recorded in the audit trail; do not provide an ordinary-user bypass.

## Packing workflow
1. Select the confirmed customer order and verify customer, delivery address and PO reference.
2. Pick and pack garments by style/item number, colour and size.
3. Record packed quantity per line/size, carton number, carton count, package type and optional weight/dimensions.
4. Validate packed quantities against the order and available finished-goods quantity. Partial packing is supported; over-packing is blocked unless an authorised override with reason is recorded.
5. Save and approve the packing slip. Generate a unique packing slip number and retain its order/customer/date linkage.
6. Only after approval, enable invoice creation for the packed quantities. Prevent invoicing the same packed quantity twice. Partial invoices/dispatches must show packed, previously invoiced, current invoice and balance quantities.
7. Reprints must be marked as copies and must not create a new packing slip or change quantities.

## Required print outputs
The shipment document set must provide:
- **Packing Slip — Carton Copy (1):** print one copy to place inside the carton. Show customer, ship-to address, packing slip number/date, order/PO reference, carton number (e.g. 1 of 3), item/style, description, colour, size and packed quantity. Do not show prices, taxable value, GST, discounts, customer credit or internal costing.
- **Tax Invoice — Shipment Copy (1):** print one copy to accompany the shipment, linked to the approved packing slip and showing the proper tax invoice details and amounts.
- Provide a clear print checklist/status: Carton packing slip printed; invoice shipment copy printed. Reprint controls must show “DUPLICATE / REPRINT” to avoid confusing originals.

## Controls and audit
- Keep packed, invoiced, dispatched, returned and balance quantities separate.
- A packing slip does not itself create a tax invoice, receipt, stock issue or dispatch confirmation.
- If the packed contents change after approval, create a revision/void-and-reissue history; never silently alter the printed record.
- Support carton-wise contents and multiple cartons per packing slip.
- Record who prepared/checked/approved and timestamps when user accounts/roles are available.
- Include packing slips, line details, carton details and invoice links in backup/restore.
- Until authenticated shared storage and transaction-safe quantity locking exist, clearly mark the module as device-local and not safe for simultaneous multi-device packing.

## Acceptance tests
1. Direct invoice creation without approved packing slip is blocked.
2. Complete packing slip for mixed styles/colours/sizes and multiple cartons.
3. Print carton copy with no prices or GST.
4. Print exactly one linked invoice shipment copy.
5. Reprint both documents with duplicate marking and no quantity mutation.
6. Partial packing and partial billing calculate remaining quantities correctly.
7. Attempt to over-pack or invoice the same packed quantity twice and verify blocking.
8. Edit packed contents after approval and verify revision/audit history.
9. Verify backup/restore of packing slip and carton details.

## Daily operator flow
**Customer Order → Pick Garments → Pack by Size/Carton → Approve Packing Slip → Print Carton Copy → Create Tax Invoice → Print Invoice Copy → Dispatch.**
