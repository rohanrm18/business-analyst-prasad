# Customer Outstanding & Collection Management — Workflow Specification

## Purpose

Give Prasad Apparels a reliable customer-wise view of money receivable, invoice ageing, collections and due reminders. The key requirement is to notify customers before and after payment due dates using clear, professional messages, while keeping every reminder and payment allocation traceable.

This document is a product specification and implementation roadmap. It does not mean the feature or live messaging integration is already active.

## 1. Customer outstanding dashboard

Add **Customer Outstanding & Collections** to the main navigation and smart-dashboard quick actions.

Show:
- Total customer outstanding.
- Amount overdue.
- Amount due today.
- Amount due in the next 7 days and 30 days.
- Amount collected this month.
- Customers with the highest overdue balances.
- Recent receipts and upcoming reminders.

Allow filtering by customer, salesperson, invoice date, due date, ageing bucket and status. Dashboard totals must be calculated from saved invoices, credit notes/adjustments and allocated receipts, not manually entered summary figures.

## 2. Customer ledger and invoice-wise balances

For each customer, show:
- Opening balance, if entered and verified.
- Tax invoices and invoice dates.
- Payment due date and agreed credit period.
- Invoice value, credits/adjustments, receipts allocated and remaining balance.
- Unallocated/on-account receipts separately.
- Debit/credit notes and approved write-offs, where supported.
- Last payment date and amount.
- Total outstanding and overdue amount.

Each invoice should have a clear status: Unpaid, Partially Paid, Paid, Overdue, Disputed or On Hold.

Do not mark an invoice paid merely because a receipt exists. Apply receipts through explicit invoice-wise allocation. Prevent allocations from exceeding the available receipt amount or invoice balance unless a controlled adjustment workflow is used.

## 3. Invoice ageing

Calculate ageing using the invoice due date (not only invoice date). Show configurable buckets:
- Not yet due
- 1–30 days overdue
- 31–60 days overdue
- 61–90 days overdue
- More than 90 days overdue

Show both customer-level totals and invoice-level detail. Allow export/print of customer outstanding statements and an ageing report as of a selected date.

If due date or credit terms are missing, flag the record for review rather than silently assuming a credit period.

## 4. Due-date and overdue reminder rules

Allow an authorised user to configure reminder stages, for example:
- Before due date: 3 days before.
- On due date.
- First overdue reminder: 3 days after due date.
- Follow-up: 7 days after due date.
- Further follow-up: every 15 days, with a configurable stop limit.

These are suggested defaults only; make the schedule editable. Support customer-specific exceptions, credit terms, reminder pause dates and disputed/on-hold invoices.

Before any reminder is sent:
- Recalculate the live outstanding balance.
- Exclude invoices already paid or fully adjusted.
- Exclude disputed/on-hold invoices when configured.
- Combine multiple due invoices into one customer summary message where practical.
- Avoid duplicate reminders for the same customer and reminder stage.
- Respect quiet hours, weekends/holidays settings and customer communication preferences.
- Provide a review queue and a clear preview before the first live automation is enabled.

## 5. Customer due notification messages

This is a priority feature.

Support:
- WhatsApp message reminders.
- SMS fallback when configured and permitted.
- Email statement/reminder as an optional channel.
- Manual copy/share of a WhatsApp-ready message if automated messaging is not configured.

Message should be polite, concise and professional, with:
- Prasad Apparels business name.
- Customer name.
- Invoice number(s) and invoice date(s).
- Due date(s).
- Invoice amount and outstanding amount.
- Total amount currently due/overdue.
- Payment instructions or approved payment link, if configured.
- Contact details for questions or payment confirmation.

Example message (values must be filled from verified records):

"Dear [Customer Name], this is a gentle payment reminder from Prasad Apparels. Invoice [Invoice No.] dated [Invoice Date] has an outstanding balance of ₹[Balance], due on [Due Date]. Your total outstanding as of [Date] is ₹[Total Due]. Kindly arrange payment and share the confirmation once paid. If payment has already been made, please ignore this reminder and let us know. Thank you."

For multiple invoices, provide an itemised summary and total. Never send a message containing guessed balances, dates, invoice numbers or bank/payment details.

## 6. Automated sending and customer consent

For true automatic WhatsApp delivery, integrate through the official WhatsApp Business Platform or an authorised solution provider. A normal WhatsApp personal account or a click-to-chat link does not provide reliable unattended bulk automation.

Requirements:
- Store the customer's approved mobile number and communication preference.
- Record customer consent/opt-in and opt-out status for reminders.
- Use approved WhatsApp message templates for business-initiated messages outside the permitted customer-service window, as required by current WhatsApp rules.
- Use approved provider credentials only on the secure backend; never put tokens or secrets in frontend JavaScript, localStorage or the public GitHub repository.
- Track provider message ID, queued/sent/delivered/failed status, timestamp and failure reason.
- Retry transient failures safely without duplicate customer messages.
- Provide pause, cancel and opt-out controls.
- Keep SMS provider integration optional and subject to applicable Indian sender/template/DLT requirements.
- Do not claim a message was delivered unless the provider returns a delivery status.

Until an official provider is connected and configured, provide a manual WhatsApp share/copy workflow and show automation as Not Connected. Do not simulate successful sending.

## 7. Reminder centre and history

Create a Reminder Centre with:
- Due today
- Due soon
- Overdue
- Ready for review
- Scheduled
- Sent
- Delivered
- Failed
- Paused / opted out

For each reminder, retain customer, invoice references, balance snapshot, message content/template version, channel, scheduled time, sent time, provider status and any failure/retry history.

Allow authorised users to send an individual reminder, select multiple customers for a reviewed batch, reschedule, pause or cancel scheduled reminders. Show a final confirmation before sending a batch.

## 8. Receipt entry and collection tracking

Support receipt entry with:
- Customer, receipt date and amount.
- Mode: cash, bank transfer, cheque, UPI or other.
- Bank/reference/UTR or cheque number where applicable.
- Notes and optional receipt attachment.
- Invoice-wise allocation, including partial payments across multiple invoices.
- Unallocated advance/on-account amount where the customer has paid more than currently due.

Show collection history by customer and date. Generate a receipt voucher for review/print/share. Do not automatically assume a bank credit is a customer receipt without reconciliation or user confirmation.

## 9. Payment links and reconciliation

Optionally support payment links/QR details only after a verified payment provider or bank workflow is configured. Show payment-link status separately from actual received funds. A customer clicking a link or initiating a transfer must not mark an invoice paid; update balances only after confirmed receipt/reconciliation.

## 10. Customer statement and reports

Generate a customer statement for a selected period with:
- Opening balance.
- Invoice/debit entries.
- Receipts and allocations.
- Credit notes/adjustments.
- Closing balance.
- Invoice-wise outstanding and due dates.

Provide downloadable/printable:
- Customer ledger statement.
- Outstanding summary.
- Invoice ageing report.
- Collection register.
- Reminder activity report.

## 11. Safeguards, audit and permissions

- Record who created/edited receipts, allocations, credit adjustments and reminder schedules.
- Keep an audit trail for sent messages, manual reminders, pauses, opt-outs and overrides.
- Require reason and authorised role for write-offs, balance adjustments and reopening a paid invoice.
- Never expose another customer's balance in a reminder or statement.
- Verify customer phone/email before enabling automatic reminders.
- Provide a test-message mode and require explicit administrator activation before live scheduled sending.

## 12. Tally.ERP 9 compatibility

The user uses Tally.ERP 9 with accounting-invoice-only entries. Outstanding and collection tracking should use Prasad Business invoices and receipts as its working records, and must not depend on Tally inventory/stock-item fields. If Tally import/export or reconciliation is added later, show the source and reconciliation status clearly; do not claim live Tally sync unless it is implemented and verified.

## 13. Current architecture and production requirements

The app currently relies substantially on browser-local storage. Local-only data is not sufficient for dependable scheduled reminders, multi-device balances or unattended messaging.

Before live automatic reminders:
- Move customer, invoice, receipt, allocation and reminder records to an authenticated shared backend/database.
- Run reminder scheduling and balance checks server-side.
- Add role-based access, secure logs, backups and recovery.
- Store provider credentials securely on the backend.
- Add provider webhook handling and idempotency to avoid duplicate messages.
- Test message templates, consent, opt-out and delivery callbacks.
- Make all scheduled jobs use a consistent business timezone (India Standard Time) and store timestamps reliably.

Until these foundations and a messaging provider are configured, reminders must be user-triggered/manual and clearly labelled as such.

## 14. Acceptance tests for final app review

1. Create a customer with agreed credit days and verify due-date calculation.
2. Create invoices with different due dates and verify ageing buckets.
3. Allocate a partial receipt to one invoice and verify the remaining balance.
4. Allocate one receipt across multiple invoices and verify totals.
5. Record an advance receipt and keep the unallocated amount separate.
6. Verify fully paid invoices disappear from the reminder queue.
7. Verify customer-level reminder totals match invoice-level balances.
8. Preview a reminder and verify every field is sourced from the correct customer/invoice.
9. Verify scheduled reminders before due date, on due date and after due date.
10. Verify duplicate prevention, quiet hours, pause, dispute and opt-out handling.
11. Verify manual WhatsApp share/copy works while automation is disconnected.
12. Connect a test provider and verify queued/sent/delivered/failed statuses and safe retry behaviour.
13. Confirm a batch reminder requires review and explicit confirmation.
14. Verify a customer statement and ageing report match ledger balances.
15. Verify dashboard totals and reports reconcile to invoice-wise balances and receipts.
16. Verify no reminder is sent with stale, guessed or already-paid balances.

## Design principle

Make collections easy and trustworthy: **See Who Owes → Open Invoice Details → Preview Due Message → Send/Automate with Consent → Record Receipt → Allocate Payment → Outstanding Updates.**


## Implementation status — 22 Nov 2026
A first browser-local working screen is now present under **Parties** in Prasad Business:
- Customer invoice balances and due-date ageing are calculated from saved sales tax invoices.
- Part-payments are allocated to one invoice per receipt entry. For one bank receipt split across invoices, enter separate allocations with the same reference.
- Customer credit limit and credit days can be configured. The invoice due date defaults to the configured terms (30 days if no terms exist), and a new invoice prompts before exceeding the configured limit.
- Collection reminders can be prepared and shared manually through WhatsApp; reminder actions are recorded locally.
- Receipt, credit and reminder records are included in manual backup/restore.

This is not yet a complete production receivables ledger. It is local to one browser/device, not connected to Tally or bank feeds, and does not include opening balance migration, credit/debit notes, returns, write-offs, multi-user approvals, customer-level phone consent UI or automated WhatsApp sending. Existing invoices without a due date fall back to invoice date. Reconcile all figures with Tally and test with sample transactions before relying on the balances.

### Follow-up improvements
- One receipt can be split across multiple distinct invoices for the same customer; the system sums allocations and validates each against its remaining balance.
- Customer credit settings are loaded when editing an existing customer; invoice due dates cannot be earlier than the invoice date.
- Backup restore validates receipt allocation totals and invoice references plus customer credit settings before replacing local data.
- Reminder schedule labels now distinguish exact scheduled follow-up dates from general upcoming or overdue statuses.

## Additional receivables controls implemented
- Customer opening balances can be entered as separate old-invoice/reference items with an original due date. They participate in ageing, statement totals and receipt allocation.
- A reference-only credit note / approved credit adjustment can be allocated to an open invoice or opening item, with date, reference and reason. It reduces receivables and can be reversed with a reason. This is not a GST credit note and is not posted to Tally.
- Opening items can be reversed only before any receipt or credit adjustment is linked. Backup/restore includes these records and checks that settlements do not exceed original invoice value.
- Current customer receivables data remains local to the browser/device. There is no shared company ledger, automatic bank matching or Tally reconciliation yet.

- Added manual bank statement matching to receipt history. The user checks the statement, enters the bank reference and confirms the match; this is a manual control, not a live bank feed or automatic reconciliation.

### Dispute and collection pause controls
Invoices can be marked Active, Disputed or On Hold with a reason. Disputed/on-hold balances remain in receivables totals and ageing, but are excluded from reminder preparation until resumed. Reminder preparation blocks paid or paused invoices and duplicate invoice/stage/date actions. History records a prepared reminder, not a sent or delivered message.

- Added a CSV export of the receivables register with customer, invoice/opening reference, invoice/due dates, original value, receipts, credit adjustments, balance, overdue days and collection status. CSV cells are quoted and formula-like leading characters are escaped to reduce spreadsheet formula injection risk.
