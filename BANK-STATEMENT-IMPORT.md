# Bank Statement Import & Reconciliation — Approved Requirement

**Status:** Approved requirement; not yet a live automatic bank-import feature.

## User workflow
1. Open Bank & Cash → Import Statement.
2. Upload a bank statement PDF or clear photo/image. Support multi-page PDFs and multiple statement pages.
3. Detect bank/account label, statement period, opening/closing balances and transaction rows using document text extraction and OCR where needed.
4. Show a review screen before creating any ledger entries.
5. Let the operator correct date, narration, debit, credit, reference/UTR and transaction type.
6. Match likely entries to existing customer receipts, supplier payments, expenses, transfers and cash/bank records. Show match confidence and the reason for each suggestion.
7. Detect duplicate transactions using account + date + amount + direction + reference and a normalized narration fingerprint. Never silently import a duplicate.
8. After explicit confirmation, post approved rows once to the bank book and reconciliation register. Keep source document reference and row-level audit details.
9. Unmatched items remain in a review queue. Allow split transactions, combined bank charges, transfers between own accounts, reversals and opening/closing balance checks.
10. Allow export of imported rows, reconciliation differences and exceptions.

## Safety and accounting rules
- Uploading a PDF/photo must not directly post unreviewed transactions. OCR can misread dates, decimal points, debit/credit columns and references.
- Keep original debit/credit direction and bank narration. Never guess an uncertain amount or direction.
- Validate transaction totals against statement debit/credit totals and opening + credits - debits = closing balance (subject to bank-specific conventions).
- Distinguish a suggested match from a confirmed match. Never mark a receipt/payment as bank-cleared without an exact confirmed match.
- A statement import is not proof that a customer invoice is settled until the transaction is allocated to the correct customer/invoice and confirmed.
- Support CSV, XLSX and searchable PDF extraction where available; OCR scanned PDF/photo pages. If the app cannot confidently read a document, request a clearer scan or manual correction.
- Store source files securely. Current browser-local storage is not suitable for sensitive bank statements or multi-user financial records; authenticated backend, encrypted attachment storage, access roles, audit and backup are required before real statements are uploaded.

## Acceptance tests
- Import a text PDF, scanned PDF and phone photo.
- Correctly separate debit and credit columns, including negative/parenthesized amounts.
- Handle multi-page statements and repeated page headers.
- Preserve UTR/reference and narration.
- Detect duplicates on re-import.
- Reconcile opening/closing balance and totals; flag mismatches.
- Match an exact customer receipt and supplier payment without auto-confirming.
- Keep ambiguous and unmatched rows in review.
- Confirm import and verify each approved row is posted exactly once.
- Verify backup/restore and access control for source files and parsed rows.

## Product principle
**Upload → Read → Review & Correct → Match → Confirm Import → Reconcile.** No silent posting from OCR.
