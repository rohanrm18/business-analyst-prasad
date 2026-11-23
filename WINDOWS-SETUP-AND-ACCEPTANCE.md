# Windows setup & acceptance guide

## Install the app on Windows

1. Open the published Prasad Business Analyst Pages address in Microsoft Edge or Google Chrome.
2. In Edge, open **… → Apps → Install this site as an app**. In Chrome, use **⋮ → Cast, save and share → Install page as app** (wording may vary by browser version).
3. Pin the installed app to Start or the taskbar.
4. Allow downloads and printing when the browser asks. Keep the browser updated.

The app is a Progressive Web App. Installation creates a desktop-style window; it does not create a separate native Windows executable.

## Before entering business data

- The current app is browser-local. Records saved on iPhone, Android and Windows do not automatically sync.
- Do not treat a fresh Windows installation as a copy of the iPhone's data.
- Do not move live sensitive business records to shared cloud storage until the authentication, server-side roles, encrypted storage, audit, backup and restore acceptance tests in SECURITY-AND-ACCESS-CONTROL.md pass.
- Use synthetic test records for the Windows acceptance checks below.

## Windows acceptance checklist

### Screen and navigation
- [ ] Open the app at 1366×768 and 1920×1080.
- [ ] Check Home, Orders, Bills, Production, Dispatch, Parties and More.
- [ ] Check long tables, forms, dialogs and month selectors at 100% and 125% Windows display scaling.
- [ ] Confirm there is no clipped content or horizontal page scrolling except intentionally scrollable data tables.

### Printing
- [ ] Print a sample tax invoice to PDF and check seller/buyer details, item rows, tax breakup, totals and page breaks.
- [ ] Print a packing slip and dispatch/LR annexure; confirm the packing slip remains price-free and the invoice remains a separate document.
- [ ] Print each report to PDF and check that navigation/buttons are not printed.
- [ ] Compare printed totals with the saved source record.

### CSV / Excel
- [ ] Export sample sales, purchase, supplier reconciliation, GST, TDS and month-end CSV files.
- [ ] Open each file in Microsoft Excel; confirm headers, Indian currency amounts, dates, commas and special characters.
- [ ] Confirm leading zeroes in invoice/barcode references are preserved where required. Import CSVs as text columns when Excel would otherwise auto-convert identifiers.
- [ ] Never treat a working CSV as a statutory GST/TDS upload file.

### Barcode scanner and thermal printer
- [ ] Install the Windows printer driver supplied by the printer manufacturer.
- [ ] Connect by USB or Bluetooth and print a Windows test page first.
- [ ] Select the exact label width/height, gap paper, orientation, scale 100% and correct printer.
- [ ] Scan Code 128/EAN/QR labels into the app and confirm the correct garment/style/colour/size is selected.
- [ ] Print at least 10 consecutive labels; check that each label starts at the top, no sticker is split across two labels, and barcode scans reliably.
- [ ] Check feed, cut, darkness, speed and alignment using the printer's driver utility and the actual label stock.

Thermal printer connectivity and barcode scanning depend on the actual printer model, driver, connection type, browser and label stock. The CSS/browser print foundation cannot guarantee gap sensing, cutter control, darkness or millimetre-perfect output. Those settings must be calibrated on the target hardware. The app does not silently claim that a print job has physically completed.

## Current implementation status

- Windows-responsive desktop and browser print stylesheet: implemented.
- Month-end closing checklist and CSV export: implemented in the CA workspace.
- Existing CSV and Excel-compatible working exports: available in relevant modules.
- Windows browser and real printer acceptance: pending physical testing.
- Cross-device shared database, secure login, MFA, role enforcement, cloud backup and tested recovery: final security/cloud phase, not active yet.
