# Prasad Business — Product Direction Decisions

These decisions supersede older roadmap text in this repository wherever it conflicts.

## Main system
Prasad Business is intended to become the primary business system for Prasad Apparels. Do not make completion dependent on Tally.ERP 9, TallyPrime, a Tally connector or Tally voucher posting. Once the Prasad Business application is ready, the user intends to transfer/import the required existing business information from Tally into Prasad Business. Build import templates and validation/migration tools for that future data transfer instead of a live Tally connection.

## Bank statements
The app must accept bank statement PDFs and photos, extract transaction rows with text parsing/OCR, present corrections and likely matches, detect duplicates and reconcile balances. Transactions must remain proposals until the user reviews and explicitly confirms import. OCR must never silently create or clear financial entries.

## Packing before billing
An approved packing slip is mandatory before sales billing. Print one packing-slip carton copy to place inside the carton and one tax invoice copy to accompany the shipment. Invoice creation must be linked to approved packed quantities and prevent double invoicing.

## Data integrity
The existing app has browser-local records. Do not describe local data as shared, centrally backed up or production-secure. Real bank statement storage, multi-user stock/packing and financial records require authenticated shared storage, role controls, encrypted document storage, audit logs, backups and recovery tests.
