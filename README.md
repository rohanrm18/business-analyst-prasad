# Prasad Apparels Business Analyst — starter

This is a mobile-first installable PWA prototype with the selected navy-and-gold design.

## Important status
- The figures are fictional demo values.
- It is NOT connected to Tally ERP 9.
- The voucher screen only shows a local draft preview; it does NOT create or post Tally vouchers.
- Do not enter real customer, supplier, or financial data into this prototype.

## Test locally
Open `index.html` in a browser. Service-worker installation requires HTTPS or localhost.

## Publish from an iPhone
A simple phone-friendly route is GitHub Pages:
1. Sign in to GitHub in Safari and create a new public repository named `prasad-apparels-business-analyst`.
2. Upload the contents of this folder (not the enclosing folder) to the repository.
3. In repository Settings → Pages, choose Deploy from a branch, select `main` and `/ (root)`, then Save.
4. Open the published HTTPS address in Safari on your iPhone.
5. Tap Share → Add to Home Screen.

GitHub's mobile interface may make multi-file uploads awkward. If so, use GitHub's web upload flow or a ZIP extraction/file manager app.

## Before real Tally integration
The office Windows PC must be available. We will need to confirm the exact Tally.ERP 9 release, company configuration, and whether XML/HTTP integration is enabled. A secure office-side connector should initiate an outbound encrypted connection; never expose Tally's port directly to the public internet. Add authenticated API endpoints, authorization, audit logging, backups, and validation before enabling voucher creation.
