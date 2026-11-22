# Purchase Cost Entry & Style Cost History — Workflow Specification

## Purpose and status

Give Prasad Apparels a simple, auditable way to enter verified garment purchase costs and retain the cost that applied over time. These records will feed Customer Profitability & Sales Analysis.

This is a **workflow specification and implementation roadmap**, not a claim that the screen or calculations are already live.

## 1. Purchase-cost entry

Add **Purchase Cost Entry** under Purchases / More, with a phone-friendly form.

Required fields:
- Supplier.
- Supplier purchase invoice / bill number.
- Purchase date.
- Style / garment code (selected from the style master; allow creation only with the proper permission).
- Garment description.
- Quantity purchased.
- Unit purchase cost excluding recoverable GST.
- Cost currency (INR initially).

Optional fields:
- Colour and size, when the cost differs by variant.
- Supplier batch / lot reference.
- Freight, packing and other directly attributable landed-cost components.
- Non-recoverable tax or charges only where the accountant confirms they belong in inventory cost.
- Bill photo / PDF attachment.
- Notes and source reference.

Show the cost calculation before saving:
- Base purchase value = quantity × unit cost.
- Allocated landed cost per unit = eligible direct charges ÷ eligible quantity.
- Verified landed unit cost = base unit cost + allocated eligible landed cost.

Do not include recoverable GST in garment cost. Do not automatically treat general overhead, penalties, finance charges or unrelated expenses as garment cost. Make every allocation visible and editable before approval.

## 2. Quick manual style-cost entry

Allow an authorised user to add a verified cost without entering a full purchase bill, for example when importing an opening cost list.

Required fields:
- Style code.
- Unit cost (INR, excluding recoverable GST).
- Effective-from date.
- Cost source / reference and reason.

Optional colour/size variant, supplier and notes.

Mark these records as **manual verified cost**, not as a supplier purchase transaction. They must not create a supplier payable or purchase voucher.

## 3. Cost history

Each style (and optional colour/size variant) has a chronological history:
- Effective-from date and, where known, effective-to date.
- Unit cost and cost basis.
- Supplier / purchase bill / batch reference or manual source.
- Landed-cost components and allocation.
- Quantity and purchase date for bill-backed entries.
- Created by, approved by, created timestamp and correction reason.
- Status: Draft, Pending Review, Approved, Superseded or Reversed.

Never overwrite an approved historical cost. A correction creates a new audited version and records the old and new values. Prevent overlapping effective periods for the same style/variant unless an authorised user resolves the conflict.

## 4. Cost matching for profitability

The reporting engine must state the costing method used on every report.

Preferred accuracy order:
1. **Specific batch cost** when the sold garment can be reliably linked to the received batch / lot.
2. **Weighted-average cost** only when a complete, reconciled quantity-and-value stock ledger exists for that same item/variant.
3. **Effective-dated style cost** as a clearly labelled fallback estimate when neither batch traceability nor a reliable weighted-average ledger is available.

Do not silently mix these methods in one total. If effective-dated cost is used, match the latest approved cost effective on or before the sale/invoice date for the exact style and variant. If only a style-level cost exists, disclose that colour/size-specific cost was unavailable.

Because the current app does not yet reconcile finished-garment batches and quantities end to end, an effective-dated style cost alone is a **verified cost reference / estimated COGS**, not proof of actual batch-level cost of goods sold. Reports must label it honestly. Do not call the resulting figure actual gross profit until the required stock/batch linkage and reconciliation are implemented.

For manufactured garments, a purchase cost is not sufficient by itself. The cost basis must include verified BOM material consumption, wastage, job-work/labour and other approved direct production costs, with a documented allocation policy. Until that production-cost sheet is complete, flag manufactured-style costs as incomplete or estimated.

## 5. Profitability report integration

Feed approved costs into Customer Profitability & Sales Analysis:
- Customer-wise gross sales, discounts/returns/credit notes, net sales excluding GST, matched cost, gross profit and margin.
- Style-wise and optional colour/size-wise quantity, sales, cost and profit.
- Month-wise sales and profit using the invoice/sale date and the selected cost policy.
- Cost coverage: value and percentage of sales with approved matched cost.
- Separate sections for missing, pending, estimated and fully traceable costs.

A report row must carry its invoice line, style/variant, matched cost record and costing method references. Reconcile customer/style/month totals to their underlying invoice lines.

## 6. Validation and safeguards

- Unit cost must be a valid non-negative INR amount; zero cost requires an explicit reason and approval and must never be interpreted as a missing cost.
- Quantity must be positive for bill-backed entries.
- Duplicate supplier + bill number + style/variant rows should be detected and reviewed.
- Recoverable GST is excluded from cost.
- Prevent unapproved or reversed costs from entering profitability.
- Missing, conflicting or future-effective cost must be flagged; never substitute zero.
- Show who entered and approved every cost.
- Restrict approval, correction and costing-policy changes by role.
- Maintain audit trail and backup / restore.
- Do not create Tally vouchers automatically in this phase.

## 7. Tally.ERP 9 compatibility

Prasad Apparels uses accounting-invoice-only entries in Tally.ERP 9. This feature is an operational cost sub-ledger in Prasad Business; it does not assume Tally has reliable garment stock valuation or item-level purchase quantities.

A supplier bill entered here is a cost-source record, not a duplicate accounting voucher. Reconcile supplier, bill number, date and amount with the accounting entry in Tally before approval. Do not post the same purchase twice.

## 8. Acceptance tests

1. Enter a supplier bill with multiple styles and verify per-style unit costs.
2. Exclude recoverable GST from unit cost.
3. Allocate eligible freight across quantities and verify the preview.
4. Add a manual cost and confirm it does not create supplier payable.
5. Add a new effective-dated cost and verify earlier sale periods retain their historical matched cost.
6. Verify style-level cost fallback is labelled when variant cost is absent.
7. Verify missing, pending and reversed costs are excluded from complete-profit totals.
8. Detect duplicate bill/style entries.
9. Verify correction creates a new audit record and preserves the old value.
10. Verify customer, style and month reports reconcile to invoice lines.
11. Verify a report distinguishes actual batch cost from effective-dated estimated cost.
12. Verify manufactured styles remain incomplete until approved production-cost components are captured.
13. Verify Tally accounting entries are not duplicated.

## Design principle

**Enter the bill once → assign costs to styles → preserve cost history → match sales to the right cost → show profit only with clear evidence.**
