# E-Way Bill Applicability — Configurable Rules for Prasad Business

**Status:** Approved requirement and rules reference. This is an operational screening aid, not a legal determination. Re-check the latest Central and destination-State notifications before production release and keep the rules effective-dated/configurable.

## Default threshold checks

- **Inter-State movement:** Flag an e-Way Bill as normally required when consignment value exceeds ₹50,000, subject to Rule 138 exceptions and special cases.
- **Intra-State movement within Maharashtra:** Flag an e-Way Bill as normally required when consignment value exceeds ₹1,00,000. Maharashtra Notification No. 15E/2018-State Tax dated 29 June 2018 exempts intra-State movement of any goods where consignment value does not exceed ₹1 lakh, subject to the notification's scope and other applicable rules.
- The consignment value must be calculated using the applicable statutory definition, including applicable taxes/cess and excluding exempt supply value where the rules require that treatment. Do not simply compare the taxable value or invoice subtotal without checking the statutory basis.

## Important qualifications

- Do not generalise Maharashtra's ₹1 lakh intra-State threshold to other States. Intra-State thresholds and exemptions can differ by State/UT and may change.
- The app must use the dispatch-from State and ship-to State, movement purpose/type, consignment value, goods category, distance/route where relevant, and current effective-dated State notifications.
- Check Rule 138 exceptions and special cases. Some movements may require an e-Way Bill regardless of value; some may be exempt even when the normal threshold is crossed. Job-work movements, specified goods, transport modes and notified routes need rule-specific review.
- An e-Way Bill may also be generated voluntarily below the normal threshold.
- For garment job-work, do not assume the general Maharashtra ₹1 lakh threshold is the only rule: Maharashtra Notification 15E/2018 includes a specific exemption for hank, yarn, fabric and garments transported up to 50 km within Maharashtra for job work, subject to its exact conditions.
- The user-requested ₹50,000 inter-State / ₹1,00,000 Maharashtra intra-State rules are the default screening settings, not a promise that every consignment above/below those amounts has the same legal outcome.

## App workflow and transport copy

1. Calculate and display the consignment value and origin/destination State comparison.
2. Show one of: **Likely Required**, **Likely Not Required Under Configured Threshold**, or **Needs Review / Exception Check**.
3. When likely required, block final dispatch release until a genuine E-Way Bill number/status is linked, or an authorised reviewer records a legally reviewed exception with reason.
4. Include the genuine E-Way Bill number, date, validity, QR/document reference and transporter/vehicle details on the **Invoice — Transporter Copy** when available and legally appropriate. Provide the actual E-Way Bill document as a separate print/attachment as well.
5. If no E-Way Bill is required, print the transporter invoice copy without a fabricated E-Way Bill number and show a clear internal status such as **E-Way Bill not required — reviewed** (do not imply the government generated a bill).
6. If vehicle/transporter details change, prompt for the applicable Part-B update and retain the genuine response/audit trail.
7. Never fabricate an E-Way Bill number, QR code, validity or generated status. Live generation requires an authorised secure GSP integration and explicit user confirmation.

## Sources checked

- CGST Rules, Rule 138 — Central threshold and consignment-value basis: https://cbic-gst.gov.in/ewaybill-rules.html
- Maharashtra Notification No. 15E/2018-State Tax, dated 29 June 2018 — intra-State exemption up to ₹1 lakh and specific job-work movement provision: https://upload.indiacode.nic.in/showfile?actid=AC_MH_166_858_00003_00003_1614164018678&filename=notification_no.15e_of_2018.pdf&type=notification
- GST Council explanation that intra-State thresholds are notified State/UT-wise: https://www.gstcouncil.gov.in/sites/default/files/Agenda/48-agenda.pdf

CA/tax-professional review is required before relying on a rule outcome for a particular dispatch. Keep these rules configurable and update them when official notifications change.
