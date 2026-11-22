# Customer Credit Limit & Sales Control — Workflow Specification

## Purpose

Help Prasad Apparels control customer credit exposure before accepting new orders, dispatching goods or creating invoices. Each customer can have an approved credit limit and credit terms. The app should warn users about overdue invoices and excess exposure, and require authorised approval when policy is exceeded.

This is a product specification and implementation roadmap. It does not mean the feature is already live.

## 1. Customer credit profile

Add a **Credit & Risk** section to each customer profile with:
- Approved credit limit.
- Credit period in days and default payment terms.
- Effective date and optional review/expiry date.
- Credit status: Active, On Hold, Blocked or Review Required.
- Internal notes and reason for the limit.
- Approving person, approval date and last review date.
- Optional customer-specific overdue tolerance and warning thresholds.

New customers should have an unapproved/zero-limit or configurable default status until an authorised user sets their terms. Do not silently grant credit.

## 2. Credit exposure calculation

Show a live customer exposure summary:
- Outstanding invoice balance, including overdue and not-yet-due amounts.
- Confirmed sales orders not yet invoiced, if the business chooses to reserve credit for them.
- Dispatches/invoices in progress where not already counted.
- Approved credit notes and adjustments.
- Unallocated advances/on-account receipts separately and apply them only according to the configured accounting policy.
- Available credit = approved limit minus counted exposure.

Prevent double-counting the same order, invoice and dispatch. Define a single exposure policy and show the calculation breakdown to users. Support a configurable policy for whether open sales orders reserve credit, and whether pending/unconfirmed orders are excluded.

## 3. Checks during the sales workflow

Run a credit check at these points:
- Creating or confirming a sales order.
- Converting an order to a tax invoice.
- Confirming a dispatch, if dispatch is the point goods leave the premises.

Display a clear customer credit panel showing:
- Approved limit.
- Current counted exposure.
- Proposed new sale/order value.
- Projected exposure after this transaction.
- Available credit or excess amount.
- Oldest overdue invoice and total overdue balance.
- Customer credit status and any active hold.

Do not block quotation or draft preparation by default. Apply controls at the configured commitment point so users can prepare a quotation without accidentally authorising a sale.

## 4. Warning and approval rules

Provide configurable policies:
- Warning when exposure reaches a selected percentage of the credit limit (for example 80%).
- Approval required if the proposed transaction exceeds available credit.
- Approval required when an invoice is overdue beyond the customer's allowed tolerance.
- Block new credit sales when the customer is Blocked or On Hold.
- Optional stricter rule for materially overdue balances or repeated late payments.

An authorised approver may approve a specific transaction or grant a temporary exception. Capture approver, date/time, reason, transaction, amount and exception expiry. Do not allow the salesperson who raised the transaction to approve their own override unless the administrator explicitly configures that permission.

If approval is denied or pending, keep the transaction as Draft / Awaiting Credit Approval. Do not silently create an approved order, post an invoice or release a dispatch.

## 5. Payment and exposure refresh

Recalculate exposure whenever:
- A receipt is entered and allocated.
- An invoice is created, edited, cancelled or credited.
- A credit note or approved adjustment is recorded.
- A sales order is confirmed, changed, cancelled or fulfilled.
- A dispatch or return changes the quantities/commitment under the chosen policy.
- A customer limit or credit status changes.

Show the last calculation/update time and source records. Do not assume a bank transfer is received until confirmed and recorded.

## 6. Credit approval centre

Create a **Credit Approvals** queue showing:
- Customer and transaction reference.
- Current exposure, limit and projected exposure.
- Overdue balance and oldest overdue invoice.
- Requested exception amount and reason.
- Requested by and request time.
- Status: Awaiting Approval, Approved, Rejected, Expired or Revoked.

Approvers can open the full customer ledger and transaction before deciding. Approval should apply only to the specified transaction and amount unless a separately recorded customer-limit change is approved.

## 7. Customer risk dashboard

Add smart-dashboard figures and lists:
- Customers over credit limit.
- Customers approaching credit limit.
- Customers with overdue balances.
- Credit approvals pending.
- Customers on hold/blocked.
- Recently approved exceptions.

Allow filters by salesperson, customer, credit status, exposure band and overdue ageing. Show actionable links to the customer ledger, unpaid invoices and approval request.

## 8. Notifications and sales-team visibility

Show in-app warnings to the user creating an order/invoice/dispatch. Optionally notify authorised managers about:
- A customer crossing the warning threshold.
- A customer exceeding the credit limit.
- A new credit approval request.
- A customer becoming materially overdue.

Customer-facing payment reminders belong to the Customer Outstanding & Collections workflow. Do not send customers internal credit-risk notes, approval comments or blocked-status explanations.

## 9. Audit, permissions and safeguards

- Restrict limit changes, credit status changes and overrides to authorised roles.
- Record old and new limits/status, user, timestamp and reason.
- Keep a permanent audit trail of approval decisions and exceptions.
- Require a reason for limit increases, temporary overrides and releasing a hold.
- Allow an administrator to revoke a future exception; do not erase its history.
- Prevent expired approvals from authorising new transactions.
- Show clear warnings when customer data or balances are stale or not synchronised.

## 10. Tally.ERP 9 compatibility

The user uses Tally.ERP 9 with accounting-invoice-only entries. Credit checks should use Prasad Business customer profiles, sales orders, invoices, receipts and allocations. They must not depend on Tally inventory/stock-item fields. Any later Tally import/export or reconciliation must show its source and status; do not claim live Tally sync unless implemented and verified.

## 11. Current architecture and production requirements

The app currently relies substantially on browser-local storage. A local-only prototype cannot safely enforce credit limits across multiple devices or concurrent sales users.

Before live enforcement:
- Use an authenticated shared backend/database as the source of truth.
- Perform exposure calculation and approval checks server-side.
- Use transaction-safe reservations/updates to prevent two users consuming the same available credit simultaneously.
- Apply role-based permissions and server-side audit logs.
- Sync receipts, invoices, orders, credit notes and customer limits reliably.
- Provide backups, recovery and clear conflict handling.

Until these foundations exist, show credit control as a local warning/demo and do not present it as a reliable company-wide restriction.

## 12. Acceptance tests for final app review

1. Set a customer limit and payment terms; verify the customer profile.
2. Create a sale below the warning threshold and verify no unnecessary block.
3. Cross the warning threshold and verify a clear warning.
4. Exceed the available limit and verify the transaction waits for approval.
5. Approve a specific transaction and verify only that transaction is released.
6. Reject an approval and verify the sale remains unapproved.
7. Verify overdue invoices trigger the configured rule.
8. Allocate a receipt and verify exposure and available credit update.
9. Cancel an order and verify reserved exposure is released.
10. Verify invoice, order and dispatch are not double-counted.
11. Test two simultaneous sales against the same remaining credit in the shared backend.
12. Verify expired exceptions cannot be reused.
13. Verify salesperson cannot self-approve when restricted.
14. Verify audit history for limit changes, holds and overrides.
15. Verify dashboard totals reconcile with customer ledgers.

## Design principle

Keep the salesperson's decision simple: **Select Customer → See Credit Position → Create Sale → Get Warning or Approval if Needed → Proceed Only When Authorised.**
