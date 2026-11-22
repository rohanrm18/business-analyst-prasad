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
