# Garment Stock & Inventory Control — Prasad Apparels

## Purpose
Provide one clear, auditable quantity ledger for garment stock by style, colour, size and (where practical) batch/lot. This is the operational stock record for Prasad Business. Tally.ERP 9 remains the accounting source of truth and is used in accounting-invoice-only mode; do not assume Tally contains stock-item quantities or garment valuation.

This is an approved workflow specification, not a claim that the complete stock module is already implemented.

## Simple user experience
- Main menu label: **Stock**.
- Dashboard cards: Finished pieces available, reserved for orders, in production, pending inward/QC, low-stock styles and stock discrepancies.
- Every quantity card opens the filtered list behind the number.
- Use guided actions: **Receive**, **Move**, **Issue to Production**, **Complete Production**, **Reserve**, **Dispatch**, **Return**, **Adjust**.
- Search by barcode, style number, colour, size, supplier, PO or customer.
- Use large phone-friendly controls, Indian date/currency formats, clear empty states and plain-language validation.
- Staff should not need to understand accounting or inventory terminology to complete routine actions.

## Stock identity
Each stock unit/quantity record should identify, where applicable:
- Style number and product description.
- Colour and size.
- Barcode/SKU; barcode must resolve to the exact style-colour-size variant.
- Batch/lot or production job reference when traceability is available.
- Unit of measure (pieces for finished garments; meters/rolls for fabric; defined units for accessories).
- Location: warehouse, shop, production floor, job worker or other configured location.
- Source document and date.

Do not merge variants merely because they share a style number. Do not treat a style-only barcode as a unique size/colour barcode if the printed barcode identifies a variant.

## Stock movements and workflows

### 1. Purchase inward
- Link supplier PO, supplier bill and inward/GRN where available.
- Receive actual counted quantities by style/variant, including partial receipts.
- Record accepted, rejected and pending-inspection quantities separately.
- Attach supplier bill/photo and inward evidence.
- Prevent receiving more than ordered without an explicit authorised over-receipt reason.
- A supplier bill alone must not silently increase physical stock unless the user confirms actual receipt.

### 2. Production
- Reserve/issue fabric and accessories to a cutting/production job.
- Record issued, consumed, returned, damaged and wasted quantities separately.
- Record cutting output by style/colour/size.
- Record stage-wise quantities and job-worker outward/return challans.
- Finished goods enter available stock only after production completion and QC acceptance.
- Rework, rejection and shortage must be separate movements with reason and approver.
- Never count the same units in both work-in-progress and finished goods.

### 3. Order reservation
- Reserve available finished goods against an approved customer order.
- Show available, reserved and free-to-promise quantities separately.
- Reservation is not dispatch and not an accounting sale.
- Release reservations when an order is cancelled, changed or expires under an approved rule.
- Prevent double-reserving the same pieces.

### 4. Dispatch and sales
- Dispatch reduces physical available stock only when dispatch is confirmed.
- Support partial dispatch by style/colour/size and multiple dispatches against one order/invoice.
- Link dispatch to customer PO, sales order, invoice, delivery challan and E-Way Bill where applicable.
- Do not reduce stock twice if an invoice and dispatch refer to the same goods; use one defined physical movement event.
- Show ordered, reserved, packed, dispatched and balance quantities separately.

### 5. Returns
- Customer return first enters a quarantine/inspection state, not sellable stock.
- Record return reason, condition, photos and linked invoice/dispatch.
- After inspection, classify as restockable, repair/rework, damaged or rejected.
- Supplier returns reduce stock only after confirmed outward movement.
- Prevent duplicate return entries against the same invoice/dispatch quantity.

### 6. Transfers and adjustments
- Support location-to-location transfers with dispatch and receipt confirmation.
- Adjustments require reason, supporting note/photo and permission.
- Material adjustments require second confirmation and audit trail.
- Never silently overwrite balances; all corrections are reversal plus replacement movement.

## Stock calculations
For each exact variant and location:
- On hand = accepted receipts + completed production + accepted restockable returns + transfer-ins − confirmed dispatches − supplier returns − transfer-outs − approved consumption/other issues ± approved adjustments.
- Reserved stock is a subset of on-hand, not an additional quantity.
- Available = on hand − reserved − quarantine/blocked quantity.
- In production, pending inspection and rejected quantities must be shown separately and excluded from available finished goods.
- Every displayed balance must be traceable to its movement history and show its last update/sync time.

## Costing connection
- Link received purchase costs and production/job-work costs to style/variant and batch where possible.
- Preserve cost history and source documents.
- Use actual batch/lot cost only when traceability and quantity reconciliation are complete.
- If only an effective-dated style cost exists, label resulting COGS and gross profit as estimated.
- Missing or ambiguous costs must show **Cost Pending**; never treat missing cost as zero.
- Do not derive garment-level costs from Tally accounting-only vouchers without supporting detail.
- Avoid double-counting fabric, job-work and finished-goods costs.

## Reports
- Stock on hand by style, colour, size, location and batch.
- Available vs reserved vs in-production vs quarantine.
- Stock movement register with source document and user.
- Low-stock and non-moving styles (configurable thresholds and date range).
- Order fulfilment and pending dispatch.
- Production yield, wastage, rejection and rework.
- Stock valuation only when a verified costing method and complete cost coverage exist; otherwise clearly label value as incomplete/estimated.
- Export/print stock sheets and physical-count sheets.

## Physical stock count
- Allow a count session by location/category/style.
- Capture counted quantities without changing live stock until reviewed.
- Show book quantity, counted quantity and variance.
- Require reason and approval for posting adjustments.
- Keep original count, reviewer, approver, timestamp and resulting movements.

## Controls and audit
- Role-based permissions for receive, issue, dispatch, return, adjustment and approval.
- Duplicate document and barcode checks.
- No negative available stock by default; authorised override requires reason and approval.
- Record user, timestamp, device, source document, before/after quantity and reason for every movement.
- Use idempotency keys to prevent duplicate saves/retries.
- Keep a movement ledger; do not edit historical movements in place.
- Show sync status and conflict warnings; do not silently overwrite another device's changes.
- Secure shared backend, authentication, backup and restore are prerequisites for dependable multi-user stock control.

## Tally.ERP 9 boundary
- Tally remains accounting source of truth.
- Use accounting-invoice-only workflow; no assumption of Tally stock items, godowns, batch allocations or inventory vouchers.
- Stock quantities are maintained in Prasad Business and reconciled with sales/purchase accounting documents through explicit references and periodic reports.
- Do not claim automatic Tally stock sync or voucher posting until implemented and reconciled.

## Acceptance tests
1. Receive a partial supplier PO and verify accepted/rejected/pending quantities.
2. Confirm supplier bill without physical receipt does not increase stock.
3. Scan a barcode and verify exact style, colour and size.
4. Issue material to production and reconcile returned, consumed and wasted quantities.
5. Complete production and ensure only QC-accepted pieces enter available finished stock.
6. Reserve the same variant for two orders and prevent over-reservation.
7. Dispatch partially and verify stock decreases once, not once for invoice plus again for dispatch.
8. Process a customer return through quarantine and inspection before restocking.
9. Transfer stock between locations and verify both sides.
10. Perform physical count and approve a variance with full audit history.
11. Verify batch-level actual costing only when traceability is complete; otherwise show estimated or pending cost.
12. Verify all balances reconcile to the movement ledger and remain consistent across devices after sync.
13. Verify Tally.ERP 9 accounting-only assumptions and no fabricated Tally inventory integration.
14. Test phone usability, duplicate taps, offline/retry behaviour, role permissions, backup and restore.

## Status
Approved workflow specification. Stock screens, movement engine, shared ledger, integration and acceptance testing remain to be implemented and verified.
