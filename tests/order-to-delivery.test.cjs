'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const store = new Map();
const alerts = [];
const context = vm.createContext({
  localStorage: {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key)
  },
  alert: message => alerts.push(String(message)),
  console
});
vm.runInContext(fs.readFileSync('fulfilment-quantity.js', 'utf8'), context, { filename: 'fulfilment-quantity.js' });
vm.runInContext(fs.readFileSync('dispatch-audit.js', 'utf8'), context, { filename: 'dispatch-audit.js' });

const put = (key, value) => store.set(key, JSON.stringify(value));
const get = key => JSON.parse(store.get(key) || '[]');
const stages = ['Cutting', 'Stitching', 'Finishing', 'Ironing', 'Packing'];
const order = { id: 'MO-E2E-1', style: 'PA-E2E-01', qty: 10, colour: 'Peach', sizes: '20:10' };
const routeRows = [
  { id: 'R-CUT', orderId: order.id, stage: 'Cutting', worker: 'Cutting team', date: '2026-11-26', colour: 'Peach', size: '20', qtyIn: 10, good: 10, rejected: 0, rework: 0 },
  { id: 'R-STI', orderId: order.id, stage: 'Stitching', worker: 'Stitching team', date: '2026-11-26', colour: 'Peach', size: '20', qtyIn: 10, good: 9, rejected: 1, rework: 0 },
  { id: 'R-FIN', orderId: order.id, stage: 'Finishing', worker: 'Finishing team', date: '2026-11-26', colour: 'Peach', size: '20', qtyIn: 9, good: 9, rejected: 0, rework: 0 },
  { id: 'R-IRN', orderId: order.id, stage: 'Ironing', worker: 'Ironing team', date: '2026-11-26', colour: 'Peach', size: '20', qtyIn: 9, good: 8, rejected: 1, rework: 0 },
  { id: 'R-PACK', orderId: order.id, stage: 'Packing', worker: 'Packing team', date: '2026-11-26', colour: 'Peach', size: '20', qtyIn: 8, good: 8, rejected: 0, rework: 0 }
];
const qc = [{ id: 'QC-E2E-1', moId: order.id, receiptRef: 'PA-QC:E2E-1', accepted: 8, style: order.style, colour: 'Peach', size: '20' }];
const finishedStock = [{ id: 'FG-E2E-1', type: 'Production receipt', status: 'posted', reference: 'PA-QC:E2E-1', qty: 8, style: order.style, colour: 'Peach', size: '20' }];
const slip = { id: 'PS-E2E-1', number: 'PA-PS-E2E-1', orderId: 'SO-E2E-1', status: 'approved', items: [{ itemNumber: order.style, colour: 'Peach', size: '20', qty: 8 }] };
const invoice = { id: 'INV-E2E-1', packing_slip_id: slip.id, status: 'issued', items: [{ designNumber: order.style, colour: 'Peach', size: '20', qty: 8 }] };

function resetBusinessRecords() {
  store.clear();
  alerts.length = 0;
  put('pa_packing_slips_v1', [slip]);
  put('pa_tax_invoices', [invoice]);
  put('pa_garment_stock_ledger_v1', finishedStock);
}

test('order-to-delivery quantities reconcile from production through QC, packing, invoice and two partial dispatches', () => {
  resetBusinessRecords();

  const production = context.paFProductionVariantAcceptanceAudit([order], stages, routeRows, qc, finishedStock);
  assert.equal(production.issues.length, 0);
  assert.equal(production.orders[0].packedGood, 8);
  assert.equal(production.orders[0].verifiedAccepted, 8);
  assert.equal(production.orders[0].verifiedByVariant['peach¦20'], 8);

  // Invoice quantity must fit the approved packing reservation.
  assert.equal(invoice.items[0].qty, slip.items[0].qty);
  assert.equal(context.paFValidateDispatchReservation(invoice, { id: 'DSP-E2E-1' }, [{ itemIndex: 0, qty: 5 }]), true);

  // First dispatch posts five pieces. The second may dispatch only the three remaining.
  const firstIssue = { id: 'ISSUE-E2E-1', type: 'Dispatch / sale issue', reference: 'DSP:DSP-E2E-1:0', dispatchId: 'DSP-E2E-1', invoiceId: invoice.id, qty: 5, style: order.style, colour: 'Peach', size: '20' };
  put('pa_garment_stock_ledger_v1', [...finishedStock, firstIssue]);
  assert.equal(context.paFValidateDispatchReservation(invoice, { id: 'DSP-E2E-2' }, [{ itemIndex: 0, qty: 3 }]), true);
  assert.equal(context.paFValidateDispatchReservation(invoice, { id: 'DSP-E2E-3' }, [{ itemIndex: 0, qty: 4 }]), false);
  assert.match(alerts.join(' '), /only 3 reserved pieces remaining/);

  const secondIssue = { id: 'ISSUE-E2E-2', type: 'Dispatch / sale issue', reference: 'DSP:DSP-E2E-2:0', dispatchId: 'DSP-E2E-2', invoiceId: invoice.id, qty: 3, style: order.style, colour: 'Peach', size: '20' };
  const allIssues = [firstIssue, secondIssue];
  const dispatches = [
    { id: 'DSP-E2E-1', invoiceId: invoice.id, stockPostingStatus: 'posted', items: [{ itemIndex: 0, qty: 5 }] },
    { id: 'DSP-E2E-2', invoiceId: invoice.id, stockPostingStatus: 'posted', items: [{ itemIndex: 0, qty: 3 }] }
  ];
  const audit = context.PADispatchAudit.auditDispatches(dispatches, [invoice], allIssues);
  assert.equal(audit.ok, true);
  assert.equal(audit.expectedIssues, 2);
  assert.equal(allIssues.reduce((sum, row) => sum + row.qty, 0), invoice.items[0].qty);
});

test('end-to-end production gate rejects QC acceptance that exceeds packed good pieces', () => {
  const invalidQc = [{ ...qc[0], accepted: 9 }];
  const invalidStock = [{ ...finishedStock[0], qty: 9 }];
  const result = context.paFProductionVariantAcceptanceAudit([order], stages, routeRows, invalidQc, invalidStock);
  assert.ok(result.issues.some(issue => issue.type === 'variant-qc-accepted-exceeds-packed'));
  assert.equal(result.orders[0].verifiedAccepted, 0);
});

test('end-to-end dispatch reconciliation detects a missing partial-dispatch stock issue', () => {
  const dispatches = [{ id: 'DSP-E2E-MISSING', invoiceId: invoice.id, stockPostingStatus: 'posted', items: [{ itemIndex: 0, qty: 2 }] }];
  const audit = context.PADispatchAudit.auditDispatches(dispatches, [invoice], []);
  assert.equal(audit.ok, false);
  assert.equal(audit.issues[0].code, 'missing-stock-issue');
});
