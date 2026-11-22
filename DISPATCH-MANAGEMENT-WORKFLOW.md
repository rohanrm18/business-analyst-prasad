# Dispatch Management — Workflow Specification

## Purpose

Add a dispatch workspace to Prasad Business so Prasad Apparels can pack, document, release and track customer deliveries. Dispatch records must connect to the relevant customer PO, sales order, tax invoice and E-Way Bill where applicable.

This is a product specification and implementation roadmap. It does not mean the feature is already live in the app. An approved packing slip is mandatory before sales billing; see `SALES-PACKING-SLIP.md`.

## 1. Where users start

- Add **Dispatch Management** to the main navigation and smart-dashboard quick actions.
- Allow users to create a dispatch from a confirmed sales order or saved tax invoice.
- Show the originating customer, customer PO reference, order/invoice number and delivery address.
- Allow a dispatch against an order before invoicing only where the business workflow permits it; clearly mark invoice linkage as pending.
- Prevent accidental duplicate dispatch creation from repeated taps.

## 2. Multiple and partial dispatches

- Support multiple dispatches against one sales order or invoice.
- Allow partial shipment by item, style, colour and size.
- Show ordered, previously dispatched, current dispatch, returned/adjusted and balance quantities.
- Warn if a user tries to dispatch more than the remaining eligible quantity.
- Require an authorised override and reason for exceptional over-dispatch; record the user and timestamp.
- Do not count the same quantity twice when an order, invoice and dispatch are linked.
- Keep dispatch quantities separate from invoice quantities; a dispatch record must not silently create or change a tax invoice.

## 3. Packing and garment details

Each dispatch should support:
- Style/item code and description.
- Colour, size and quantity, including size-wise breakdowns.
- Unit of measure and optional batch/lot reference.
- Number of cartons/boxes/bags.
- Package type and carton-wise contents where needed.
- Gross weight, net weight and optional dimensions.
- Packing notes, special handling and customer instructions.
- Optional packing photos or supporting attachment, subject to secure file storage being available.

Generate a packing list from the saved dispatch data.

## 4. Delivery and transport documents

Capture the fields relevant to the shipment:
- Delivery challan number and date, with configurable numbering.
- Dispatch date and time.
- Dispatch-from address and ship-to/delivery address.
- Customer contact and delivery contact.
- Transport mode: road, rail, air, ship or other.
- Transporter name and transporter ID/GSTIN where applicable.
- Vehicle number and vehicle type for road movement.
- LR/GR/consignment note number and date, where applicable.
- Approximate distance in kilometres where required for E-Way Bill data.
- Driver/contact details only if operationally needed; restrict access to personal data.

Do not make optional transport fields mandatory for every mode. Validate according to the selected movement type and current applicable rules.

## 5. E-Way Bill connection

- Show the linked E-Way Bill number, status and validity on the dispatch screen when one exists.
- Reuse verified E-Way Bill data; never invent or display a dummy number as genuine.
- Before dispatch confirmation, warn or block when an E-Way Bill appears legally required but is missing, invalid, expired or inconsistent. Provide an authorised review/exception path rather than making the app a legal decision-maker.
- Check that invoice value, parties, origin/destination and transport information are consistent with the E-Way Bill.
- If the vehicle or transport details change after E-Way Bill generation, guide the user to the applicable Part-B/update process through the authorised integration.
- Record every E-Way Bill update response and error against the dispatch.
- Live generation and updates require the separately approved authorised GSP integration; until configured, show preview/status guidance only.

## 6. Dispatch statuses and tracking

Use clear statuses:
- Draft
- Packing
- Ready for Dispatch
- Dispatched
- In Transit
- Delivered
- Partially Delivered
- Delivery Exception
- Returned
- Cancelled

Track status history with date/time and user. Allow delivery confirmation with receiver name, delivery date/time, notes and proof-of-delivery attachment where available. Record shortages, damage, refusal and returns separately, with quantity and reason.

## 7. Documents and sharing

Provide printable/downloadable documents with separate copy tracking:
- Packing Slip — Carton Copy (1), placed inside the carton; no prices or GST.
- Tax Invoice — Carton Copy (1), placed inside the carton.
- Tax Invoice — Transporter Copy (1), handed to the transporter.
- Customer Tax Invoice Copy, made available after LR/consignment number is entered and saved.
- Delivery challan, dispatch summary and packing list as applicable.
- Courier envelope/address label for the customer.

After LR entry, provide customer invoice-copy delivery actions: courier, WhatsApp and email. Courier records company, AWB/tracking number, booking date and status. WhatsApp/email must use the saved customer contact and invoice attachment where supported; otherwise provide a clear manual download/share fallback. Record prepared/sent/delivered/failed separately and never claim sent or delivered without provider confirmation. Prevent accidental duplicate sends and log intentional resends.

The courier envelope/label must print customer/business name, optional contact person, complete delivery address, city/state, PIN code and mobile number. Support saved or one-time alternate delivery addresses, preview, configurable paper size/alignment/scaling, and a return address from configured company settings. Do not overwrite the customer master address silently.

## 8. Dashboard and search

Add dashboard figures and quick views for:
- Ready to dispatch
- Dispatched today
- In transit
- Delivery overdue / exception
- Pending quantities by customer or order

Provide search and filters by customer, PO number, sales order, invoice, challan number, date range, transporter and status.

## 9. Audit, permissions and safeguards

- Keep an audit trail for creation, edits, approval, dispatch confirmation, delivery confirmation, cancellation and overrides.
- Preserve prior values for important changes.
- Restrict cancellation, quantity overrides and sensitive transport edits to authorised roles.
- Require a reason for cancellation and exceptional quantity changes.
- Do not delete a dispatch that has already been used for accounting, compliance or customer documentation; use a controlled cancellation/reversal history.

## 10. Mandatory packing-slip and invoice sequence

Dispatch must use the approved packing slip and the linked invoice. The packing slip is a prerequisite to sales billing, not an optional dispatch attachment. Print one packing-slip carton copy and place it inside the carton. Print two invoice copies: one Invoice — Carton Copy to place inside the carton, and one Invoice — Transporter Copy to hand to the transporter. After LR number entry, enable the Customer Invoice Copy for courier, WhatsApp or email. Also provide courier-envelope printing with customer name, address, mobile number and PIN code. The packing slip carton copy must not show prices or GST. Invoice quantities must be drawn from approved packed quantities and must not be invoiced twice. See `SALES-PACKING-SLIP.md` for complete rules and acceptance tests.

## 11. Current architecture and production requirements

The app currently has substantial browser-local storage. A local-only implementation can support a prototype, but it is not sufficient for reliable multi-device dispatch operations or secure document storage.

Before live business use, provide:
- Authenticated backend APIs and role-based access.
- Shared database with transaction-safe quantity allocation to prevent double dispatch.
- Secure attachment storage with access controls.
- Backups and tested restore.
- Server-side audit history and validation.
- Reliable numbering that avoids duplicate challan numbers across devices.

Until those foundations are implemented, label local-only records and document storage clearly and include backup/restore limitations.

## 12. Acceptance tests for the final app review

1. Create one dispatch from an order and verify customer PO/order/invoice references.
2. Create two partial dispatches and verify the remaining quantity after each.
3. Dispatch several sizes/colours and verify size-wise totals and packing list.
4. Attempt to over-dispatch and verify warning, authorised override and audit reason.
5. Link an E-Way Bill and verify consistency warnings and validity display.
6. Change vehicle details and verify the Part-B/update guidance or authorised GSP response.
7. Print/export a delivery challan and packing list with correct business/customer details.
8. Mark a delivery partially delivered, record shortage/damage and verify balances.
9. Confirm a delivery and attach proof of delivery where supported.
10. Cancel a draft and a confirmed dispatch and verify the correct controlled workflow.
11. Verify dashboard counts, search and filters.
12. Verify no dispatch quantity is double-counted across order, invoice and dispatch records.
13. Verify local-only limitations are visible until secure cloud sync and storage are live.

## Design principle

Keep the daily workflow simple: **Select Customer Order → Pick & Pack by Size/Carton → Approve Packing Slip → Print Carton Copy → Create Sales Invoice → Print Invoice Copy → Dispatch → Track Delivery.**

## 13. Transporter invoice copy and E-Way Bill print

The **Invoice — Transporter Copy** must include the genuine E-Way Bill number and relevant date/validity/QR reference when an E-Way Bill has been generated and linked. Also provide a separate print/attachment of the actual E-Way Bill document for the transporter. Never invent an E-Way Bill number, QR code or generated status. If no E-Way Bill is legally required, show an internal reviewed status and do not print a dummy number.

Use the configurable screening defaults in [E-Way Bill Applicability](E-WAY-BILL-APPLICABILITY.md):
- Inter-State movement: normally flag when consignment value exceeds ₹50,000.
- Intra-State movement within Maharashtra: normally flag when consignment value exceeds ₹1,00,000, reflecting Maharashtra Notification No. 15E/2018-State Tax dated 29 June 2018.
- Other States/UTs must use their own effective-dated intra-State thresholds and exemptions; never apply Maharashtra's ₹1 lakh threshold nationwide.

Check consignment value on the statutory basis, movement purpose, goods, route/distance, transport mode and applicable exceptions. Some special movements may require an E-Way Bill regardless of value, and some may be exempt. Treat the threshold result as an applicability warning/review aid, not a legal guarantee. Final dispatch release should require a genuine E-Way Bill when required or an authorised, reasoned and audited exception review. Live generation requires the authorised GSP integration and explicit confirmation.

## 14. Duplex print — E-Way Bill on the back of the Transporter Invoice Copy

The user's required default document layout is a **single two-sided sheet**:
- **Front (side 1):** Tax Invoice — Transporter Copy.
- **Back (side 2):** The actual, genuine E-Way Bill document/details, linked to that same invoice/dispatch. Include the official E-Way Bill number, generated date, validity, relevant parties/transport details and the authentic QR code/barcode exactly as supplied by the authorised E-Way Bill service. Do not recreate, approximate or fabricate official QR/barcode data.

Printing requirements:
- Provide a dedicated **Print Transporter Copy (Invoice + E-Way Bill Back)** action.
- Generate a duplex-ready PDF/document with the invoice on page 1 and E-Way Bill on page 2, aligned for front/back printing on one sheet.
- Offer a clear double-sided/duplex print instruction and printer setting guidance; do not assume every printer supports automatic duplex.
- Provide a manual two-pass printing fallback for printers without duplex: print front, reinsert the same sheet in the correct orientation, then print the back. Show a preview/orientation guide to avoid upside-down or misaligned printing.
- Allow print preview, paper size, scaling, margins and back-side alignment adjustment. Preserve the original official E-Way Bill layout and QR readability; do not shrink it below a scannable/readable size.
- If an E-Way Bill is applicable but not yet genuinely generated/linked, do not present the transporter document as complete; show a clear pending warning and prevent the final combined print action until the document is available, except through a logged authorised exception where legally permitted.
- If an E-Way Bill is not required after applicability review, print the invoice on the front and an optional clearly marked **“E-Way Bill Not Required”** review slip on the back, or leave the back blank according to the user's selected print setting. Never print a fake E-Way Bill.
- The Customer Invoice Copy and Invoice — Carton Copy remain separate one-sided copies unless the user explicitly chooses otherwise. The duplex requirement applies to the **Transporter Copy**.
- Keep the E-Way Bill file/document linked to the invoice and dispatch so reprints always use the correct official document.

Acceptance tests:
1. Print preview shows invoice front and genuine E-Way Bill back for the same dispatch.
2. Verify official E-Way Bill number, dates, validity and QR/barcode match the linked generated document exactly.
3. Verify automatic duplex output is correctly oriented and aligned.
4. Verify manual two-pass instructions and orientation guide for a non-duplex printer.
5. Verify a pending/unlinked E-Way Bill cannot be mistaken for a valid transporter copy.
6. Verify the no-E-Way-Bill-required path never fabricates an E-Way Bill and follows the selected blank/review-slip setting.
7. Verify carton and customer invoice copies are not accidentally changed by transporter duplex settings.


## Dispatch module implementation update — 22 November 2026

A first browser-local dispatch workspace has been added after invoice creation. It records transporter, LR/consignment number and date, courier company, AWB/tracking number and booking date. Saving an LR unlocks Customer Copy actions. It provides separate printable Carton and Customer invoice copies, customer invoice share-message preparation, and courier-envelope printing. The return address is read from the saved seller business address; buyer mobile and PIN are now captured on the invoice form and printed on the envelope. Existing invoices created before those fields were added may need the contact details entered again in a future customer-master editor.

The transporter duplex action is blocked until E-Way Bill review is completed. If marked required, the user must attach a genuine official E-Way Bill PDF/image; the original attachment is placed on the reverse side without recreating its QR. If reviewed as not required, a reasoned “E-Way Bill Not Required” slip is printed on the back. The file limit is 1.2 MB and the attachment is stored in this browser's local storage; this is a prototype only and must not be used for sensitive document storage on a shared/public device. Duplex orientation and actual printer output have not been device-tested.

Dispatch records are included in manual backup/restore. Limitations: one dispatch record per invoice, no partial/multiple dispatch allocation, no customer master/alternate address management, no automatic courier booking/tracking API, no automatic WhatsApp/email attachment delivery, no live E-Way Bill generation/GSP, and no shared multi-user ledger or role/audit identity. A prepared share message is not proof of sending/delivery.


## Invoice carton-count field — 22 November 2026

The invoice entry form includes **No. of Packages (Cartons)** as a required whole-number field, defaulting to 1. The saved count is displayed on the main tax invoice, Carton Copy, Customer Copy, Transporter Copy, and the prepared invoice share text. It records physical parcels/cartons, not garment-piece quantity. It is an additional logistics detail and does not replace the GST invoice goods-quantity field. Existing invoices without a saved carton count display 1 as a compatibility fallback; review and correct the count before dispatch if that fallback is not accurate.


## Invoice item detail update — 22 November 2026

The main tax invoice and dispatch Carton/Customer/Transporter print templates now show Design Number, Category, HSN Code, quantity and Piece Amount per item. Piece Amount is the unit rate used in the taxable-value calculation; line discount and GST remain separate. Legacy item-number data is used as a display fallback so older invoices continue to print. Confirm HSN and GST rate with the CA before issue. This update has not yet been physically printer-tested.
