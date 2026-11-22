# Historical Data Migration into Prasad Business

**Approved direction:** Import existing records into Prasad Business after its core workflows are ready. No live Tally connection is required.

## Import areas
- Customers and customer opening balances.
- Suppliers and supplier opening balances.
- Item/style, colour, size, HSN and GST masters.
- Sales invoices and invoice line details.
- Purchase bills and purchase line details.
- Customer receipts and invoice allocations.
- Supplier payments and bill allocations.
- Credit/debit adjustments and returns, with original references.
- Bank/cash opening balances and transaction history.
- Stock opening quantities by item/style/colour/size/location where reliable.
- Expenses and other agreed ledgers.

## Import workflow
1. Download a blank, versioned CSV/XLSX template for each data area.
2. Export historical data from the existing accounting system as spreadsheet/CSV; manually map columns if required.
3. Upload the prepared file.
4. Validate required fields, dates, duplicate document numbers, GSTIN/PAN formats, customer/supplier references, debit/credit direction, quantities and totals.
5. Show a row-by-row preview with errors and warnings; allow download of rejected rows.
6. Require explicit confirmation before importing.
7. Record batch ID, source file name, imported-by identity, timestamp, row counts, totals, skipped rows and errors.
8. Make imports idempotent: re-uploading the same batch must not duplicate records. Provide controlled rollback of an import batch before its records are used in later transactions.
9. Reconcile opening balances and control totals before go-live.

## Cutover controls
- Choose and record a cut-off date.
- Preserve original invoice/bill numbers and dates; never fabricate missing source documents.
- Import opening balances only for periods where full transaction history is not imported. Do not import both full history and duplicate opening balances.
- Validate customer/supplier subledger totals against control accounts and bank opening/closing balances.
- Keep original source files and a signed-off migration report.
- Do not claim migration is complete until all control totals reconcile and the user approves the final report.

## Acceptance tests
- Valid and invalid rows in the same batch.
- Duplicate invoice/payment import detection.
- Missing customer/supplier references.
- Decimal, date and negative-value handling.
- GST and total reconciliation.
- Partial import recovery and rollback.
- Re-import of the same batch does not duplicate records.
- Opening balances do not double count full transaction history.
