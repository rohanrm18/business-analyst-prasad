# Windows connector — read-only test

This small Python 3 utility checks whether the selected Tally instance responds to a read-only XML request for the company list.

## Requirements
- Windows office computer with Python 3 installed.
- Tally.ERP 9 **or** TallyPrime running, with the intended company loaded.
- Tally XML/HTTP server enabled. The commonly used default is port 9000; verify the actual setting in Tally before running.
- Keep the connector computer and Tally on the same machine for this first test.

## Run
1. Extract/download this repository on the office Windows computer.
2. Open Command Prompt in the `connector` folder.
3. Run `start-connector.bat`.
4. On that same computer, open `http://127.0.0.1:8765/api/tally/status`.
5. Check `reachable`, `xml_ok`, and the returned company list.

If Tally is using a different port, edit `TALLY_URL` in the batch file before starting.

## Security and limitations
- The service binds only to `127.0.0.1` (loopback). It is not reachable from your phone or other computers.
- It has no authentication because it is strictly local and read-only. Do not change the bind address to `0.0.0.0`, forward the port, or expose it to the internet.
- The XML protocol is supported by both Tally.ERP 9 and TallyPrime. The connector intentionally does not guess the product version from the XML protocol; confirm the running product/version in Tally itself.
- It only probes company-list access. No voucher create/update/delete endpoints exist.
- A later remote/mobile setup needs an authenticated outbound office agent, encrypted transport, user permissions and audit logs. Test writes against a backup/test company before enabling any posting.
