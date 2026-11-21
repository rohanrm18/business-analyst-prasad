# Prasad Apparels Business Analyst

A mobile-first installable web app for Prasad Apparels, with a simple navy-and-gold interface.

## Current app features
- Dashboard overview with clear Tally connection status.
- Sales and purchase draft forms saved locally in the current browser/device.
- Apparel-focused stock analysis plan: style, colour, size, fast/slow movers and reorder watchlist.
- Customer and supplier management sections for outstanding, payables, ledgers and follow-ups.
- Business report catalogue for sales, purchases, profit, ageing and inventory.
- Responsive layout and installable PWA support.

## Important: before Tally integration
This version is a front-end preview. It is **not connected to Tally**. Dashboard figures and live balances are not loaded. Local sales/purchase drafts are stored only in browser local storage; they are not accounting vouchers and are not synced to Tally. Do not use it as the accounting record or enter sensitive real financial data until secure backend storage and access controls are implemented.

## Publish this existing repository with GitHub Pages
1. Open this repository's **Settings → Pages**.
2. Under Build and deployment, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then Save.
4. Wait for GitHub Pages to publish, then open the Pages URL on your phone.
5. In Safari, use Share → Add to Home Screen.

Do not create another repository; this project is already `rohanrm18/business-analyst-prasad`.

## Tally connection phase
Before enabling live data or voucher posting, confirm:
- Whether the office computer runs Tally.ERP 9 or TallyPrime and the exact release.
- Which company is to be connected and whether the operator can enable Tally's supported integration interface.
- Whether the office computer can run a small local connector service.

The planned design is an office-side connector that initiates an outbound encrypted connection to an authenticated backend. Never expose Tally's XML/HTTP port directly to the public internet. Implement user roles, least-privilege access, audit logs, backups, validation, and explicit confirmation before posting vouchers. Test against a copy/backup company before live use.

## Reference
The feature direction is inspired by common Tally companion workflows such as live reports, ledger/outstanding review, transaction entry, invoice sharing and team access. This is an independent Prasad Apparels project, not affiliated with Biz Analyst or Tally.
