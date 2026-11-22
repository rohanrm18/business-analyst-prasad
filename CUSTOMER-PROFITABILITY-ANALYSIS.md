# Customer Profitability & Sales Analysis — Workflow Specification

## Purpose

Help Prasad Apparels understand which customers, styles and sales relationships generate the strongest gross profit, not merely the highest sales turnover. Show customer-wise sales, gross profit, margin, outstanding, payment behaviour and best-selling styles in one analysis workspace.

This is a product specification and implementation roadmap. It does not mean the feature is already live.

## 1. Customer profitability dashboard

Add **Customer Profitability** to the main navigation and smart-dashboard quick actions.

Top-level metrics:
- Net sales for selected period.
- Gross profit for selected period.
- Overall gross margin percentage.
- Outstanding receivables.
- Overdue receivables.
- Collections received in the period.
- Average collection delay.
- Number of profitable, low-margin and loss-making customers (only where cost data is complete).

Filters:
- Date range and financial year.
- Customer / customer group.
- Salesperson.
- Product/style, category, colour and size.
- Invoice status and payment status.
- Include/exclude cancelled invoices and credit notes using consistent rules.

Every figure must be traceable to underlying invoice, credit note, cost and receipt records.

## 2. Customer-wise sales and profit table

For each customer show:
- Customer name and code.
- Invoice count.
- Gross sales.
- Discounts and credit notes/returns.
- Net sales excluding GST.
- Cost of goods sold (COGS).
- Gross profit.
- Gross margin percentage.
- Outstanding balance.
- Overdue balance.
- Collection delay / days to pay.
- Last invoice date and last payment date.
- Best-selling styles by quantity and sales value.
- Profitability rank for the selected period.

Formulas:
- Net sales = taxable invoice sales less discounts/credit notes/returns, excluding GST.
- Gross profit = net sales minus matched cost of goods sold.
- Gross margin % = gross profit ÷ net sales × 100; show N/A when net sales are zero.
- Outstanding = invoice receivables less allocated receipts and approved credits/adjustments.
- Rank by gross profit by default, with options to rank by margin, net sales and collection performance.

Clearly label gross profit as a gross trading measure, not net profit. Do not silently deduct overhead, finance costs, salaries or tax unless a separate cost allocation module is later implemented.

## 3. Reliable cost of goods sold (critical)

Profit cannot be calculated accurately from sales invoices alone. The app must capture or import a verified product cost.

Support:
- Style/item-wise purchase or production cost.
- Optional size/colour-specific cost where costs differ.
- Cost effective date / cost history so older sales use the appropriate cost.
- Landed-cost components only when recorded and allocated under a documented policy.
- Manual cost entry with source, date and authorised user.
- Future purchase/production cost imports, with review before applying.
- Cost corrections with audit trail and reason.

Costing method must be selected and documented (for example weighted average or specific batch cost) before live gross profit reporting. Do not mix costing methods in one report without clearly identifying them.

If cost is missing or incomplete:
- Mark profit and margin as **Cost Missing / Incomplete**.
- Do not display zero cost as 100% profit.
- Exclude incomplete rows from ranked profitability totals or show them in a separate incomplete-data section.
- Show the percentage/value of sales covered by verified cost data.

## 4. Style and product performance

Provide style-wise analysis:
- Style/item code and description.
- Category, colour and size.
- Quantity sold and returned.
- Net sales value.
- Verified cost and gross profit.
- Gross margin percentage.
- Number of customers buying the style.
- Top customers for each style.
- Ranking by quantity, sales value and gross profit.

For Prasad Apparels, support garment size-wise breakdowns and style/model codes. Identify top-selling styles by quantity separately from most profitable styles by gross profit.

## 5. Customer payment behaviour

Calculate collection performance from invoice due dates and allocated receipt dates:
- Average days from invoice to payment.
- Average days overdue at collection.
- On-time payment percentage.
- Overdue invoice count and amount.
- Oldest unpaid invoice age.
- Partial-payment history.
- Customer payment trend over time.

For fully paid invoices, calculate actual payment delay using allocated receipts and the chosen allocation convention. For partly paid invoices, show the paid portion's collection timing and the remaining unpaid ageing separately. Do not treat an unallocated advance as payment against a specific invoice unless explicitly allocated.

If due dates or receipt allocations are missing, flag the metric as incomplete rather than inventing payment behaviour.

## 6. Customer ranking and segments

Provide selectable rankings:
- Most profitable customers (gross profit).
- Highest gross margin.
- Highest net sales.
- Best payment discipline.
- Highest overdue exposure.
- Fastest-growing customers.

Optional segments:
- High sales / high profit.
- High sales / low margin.
- Low sales / high margin.
- Overdue / collection risk.
- New or inactive customers.

Use transparent ranking formulas and show the selected period. Do not label a customer "bad" or "risky" solely from a low sales or margin figure; show the underlying measures.

## 7. Reports and drill-down

Allow users to tap a customer and open:
- Sales invoices and credit notes.
- Style/size-wise sales.
- Cost and gross profit breakdown.
- Outstanding invoice list.
- Receipt and allocation history.
- Ageing and payment delay.
- Reminder history from Customer Outstanding & Collections.

Export/print:
- Customer profitability report.
- Customer sales ranking.
- Style profitability report.
- Customer collection performance report.
- Cost completeness / missing-cost report.

## 8. Dashboard insights and alerts

Provide useful, explainable insights such as:
- Customer sales increased/decreased compared with the previous equal period.
- Sales are high but gross margin is below the configured target.
- A previously profitable customer has become overdue.
- A style sells in high volume but produces low gross profit.
- A style/customer has missing cost data.

Show the comparison period and figures behind every insight. Avoid unsupported AI-generated conclusions.

## 9. Audit and safeguards

- Keep source invoice, credit note, receipt and cost references on every report row.
- Record cost changes with old/new value, source, user, timestamp and reason.
- Restrict cost edits and report policy changes to authorised roles.
- Exclude GST from sales/profit calculations unless a separate tax-inclusive view is explicitly selected.
- Handle returns, cancellations, discounts and credit notes consistently.
- Prevent duplicate counting across orders, dispatches and invoices.
- Display report generation date, selected period, cost method and data-completeness status.

## 10. Tally.ERP 9 compatibility

Prasad Apparels uses Tally.ERP 9 with accounting-invoice-only entries. Sales and receivables reporting should use verified Prasad Business invoice, credit-note, receipt and allocation records. Profitability requires separate verified style/product cost records because accounting-only invoice entries may not provide item-level stock valuation.

Do not claim live Tally sync or inventory valuation unless a real integration is implemented and reconciled.

## 11. Current architecture and production requirements

The app currently relies substantially on browser-local storage. Local-only reports are device-specific and cannot guarantee consistent company-wide analytics.

Before relying on this for business decisions:
- Use a secure shared database for customers, invoices, credit notes, receipts, allocations and product costs.
- Reconcile imported records and prevent duplicate entries.
- Calculate profit and rankings consistently in a tested reporting layer.
- Add access controls, audit history, backups and restore.
- Show last sync time and incomplete-data warnings.
- Keep report exports secure and customer data access restricted.

## 12. Acceptance tests for final app review

1. Create invoices for two customers with verified costs and verify net sales, gross profit and margin.
2. Verify GST is excluded from net sales and gross profit.
3. Add discounts, credit notes and returns and verify the net calculation.
4. Verify missing cost never appears as zero-cost/100%-margin profit.
5. Change cost effective dates and verify historical invoice cost treatment.
6. Verify style, colour and size totals reconcile to invoice lines.
7. Allocate partial receipts and verify outstanding and payment delay.
8. Allocate one receipt across multiple invoices without double-counting.
9. Verify unallocated advances remain separate.
10. Verify customer rankings change correctly when period or ranking metric changes.
11. Verify payment delay and overdue figures against invoice due dates and receipt allocations.
12. Verify dashboard totals match drill-down rows and exported reports.
13. Verify cancelled invoices, credit notes and returns are treated consistently.
14. Verify Tally.ERP 9 accounting-only records are not falsely treated as inventory valuation.
15. Verify report completeness, sync time and audit history.

## Design principle

Make the answer easy to understand: **Which Customers Buy Most? → Which Customers Earn Most? → Which Styles Earn Most? → Who Pays on Time? → Where Should We Improve?**
