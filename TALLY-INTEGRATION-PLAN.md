# Prasad Business Analyst — Tally integration preparation

## Supported Tally installations

The integration is being prepared for both:
- Tally.ERP 9
- TallyPrime

Both products provide XML-over-HTTP integration. The first connector implementation should use the common XML interface rather than assume that every report, field, or voucher feature is identical between releases. Keep version-specific request templates and response parsers behind separate adapters.

Official references:
- Tally.ERP 9 XML interface: https://help.tallysolutions.com/article/DeveloperReference/integration-capabilities/using_XML_interface.htm
- Tally.ERP 9 integration capabilities: https://help.tallysolutions.com/article/DeveloperReference/integration-capabilities/introduction.htm
- TallyPrime XML integration: https://help.tallysolutions.com/xml-integration/
- TallyPrime integration prerequisites: https://help.tallysolutions.com/pre-requisites-for-integrations/

## Architecture (planned)

```
Prasad Business Analyst (phone / browser)
              |
       HTTPS + sign-in
              |
   Authenticated application API
              |
       outbound-only secure
       connector session
              |
   Office Windows connector
       |              |
   Tally.ERP 9    TallyPrime
   XML/HTTP       XML/HTTP
   local port     local port
```

GitHub Pages can host the static web app, but it cannot host the private API or the always-running office connector. Those are separate deployment components and must be configured before live sync.

## Security requirements

- Never expose Tally's XML/HTTP port directly to the public internet.
- The Windows connector should initiate an outbound encrypted connection to the API.
- Keep Tally reachable only from the office computer / trusted local network.
- Store connector credentials securely on Windows; never put API secrets in browser JavaScript or this repository.
- Authenticate users and enforce owner/accounts/staff permissions on the API.
- Log sync activity and voucher actions; redact credentials and sensitive data from logs.
- Back up the Tally company before testing.
- Begin with read-only reports. Enable voucher creation only after mapping, validation, duplicate prevention, and user confirmation have been tested.

## Initial read-only scope

1. Detect the selected Tally installation and confirm the local XML endpoint responds.
2. Read the loaded company name and confirm the user selected the intended company.
3. Read ledgers and closing balances.
4. Read sales and purchase vouchers for a selected date range.
5. Read stock groups, stock items, units, and available closing quantities.
6. Reconcile totals against the same reports inside Tally before showing dashboard values.

The app must show the source company, selected financial year/date range, last successful sync time, and a visible stale/offline warning.

## Later write scope (disabled initially)

- Sales and purchase voucher drafts.
- Preview the exact voucher, party ledger, stock items, quantities, tax ledgers, and totals before posting.
- Require explicit user confirmation.
- Use an idempotency/reference key and verify the resulting voucher in Tally.
- Never silently post a draft or retry a write without checking whether the first attempt succeeded.

## Information needed at the office before connection

Record these details without sharing passwords or company data in chat:
- Windows version and whether Tally runs on the same PC as the connector.
- Exact Tally.ERP 9 release/build and exact TallyPrime release/build.
- Whether both are installed on the same Windows PC or on separate PCs.
- Which version currently opens the active Prasad Apparels company data.
- Whether the Tally company is single-user or accessed over a LAN.
- Whether the Tally XML/HTTP listener can be enabled by the office administrator (commonly port 9000; confirm the actual configured port).

Do not send passwords, license keys, customer ledgers, or company backups here.

## Current app status

The front-end is a pre-integration preview. Dashboard metrics are placeholders; sales/purchase forms save local drafts in the browser only. No Tally company has been connected, no live data has been read, and no vouchers have been posted.
