'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const store = new Map();
const context = vm.createContext({
  localStorage: {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key)
  },
  alert: () => {},
  confirm: () => true,
  prompt: () => '0',
  console
});
vm.runInContext(fs.readFileSync('fulfilment-quantity.js', 'utf8'), context, { filename: 'fulfilment-quantity.js' });

function put(key, value) { store.set(key, JSON.stringify(value)); }
function reset() { store.clear(); }

test('stock balance subtracts dispatch and adjustments, and excludes quarantined returns', () => {
  const rows = [
    { style: 'D100', colour: 'Navy', size: '20', qty: 200, type: 'Production receipt' },
    { style: 'D100', colour: 'Navy', size: '20', qty: 30, type: 'Dispatch / sale issue' },
    { style: 'D100', colour: 'Navy', size: '20', qty: 20, type: 'Stock adjustment out' },
    { style: 'D100', colour: 'Navy', size: '20', qty: 10, type: 'Customer return', status: 'quarantine' },
    { style: 'D100', colour: 'Navy', size: '20', qty: 5, type: 'Customer return', status: 'released' }
  ];
  assert.equal(context.paFStockBalance(rows, 'd100¦navy¦20'), 155);
});

test('open approved packing reservations are reduced only by linked posted dispatch stock issues', () => {
  reset();
  put('pa_packing_slips_v1', [
    { id: 'PS-1', orderId: 'SO-1', status: 'approved', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 120 }] },
    { id: 'PS-DRAFT', orderId: 'SO-2', status: 'draft', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 50 }] }
  ]);
  put('pa_tax_invoices', [{ id: 'INV-1', packing_slip_id: 'PS-1', status: 'issued' }]);
  put('pa_garment_stock_ledger_v1', [
    { type: 'Dispatch / sale issue', dispatchId: 'DSP-1', invoiceId: 'INV-1', itemNumber: 'D100', colour: 'Navy', size: '20', qty: 20 }
  ]);
  const reservations = context.paFReservations('SO-2');
  const held = reservations.get('d100¦navy¦20');
  assert.equal(held.total, 100);
  assert.equal(held.otherOrders, 100);
  assert.equal(held.currentOrder, 0);
});

test('available-to-reserve is physical saleable stock less other orders reservations, variant by variant', () => {
  reset();
  put('pa_packing_slips_v1', [
    { id: 'PS-1', orderId: 'SO-1', status: 'approved', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 120 }] }
  ]);
  put('pa_tax_invoices', []);
  put('pa_garment_stock_ledger_v1', [
    { type: 'Production receipt', itemNumber: 'D100', colour: 'Navy', size: '20', qty: 150 },
    { type: 'Production receipt', itemNumber: 'D100', colour: 'Navy', size: '22', qty: 40 }
  ]);
  const reservations = context.paFReservations('SO-2');
  const navy20 = context.paFAvailableToReserve({ itemNumber: 'D100', colour: 'Navy', size: '20' }, 'SO-2', context.paFStockRows(), reservations);
  const navy22 = context.paFAvailableToReserve({ itemNumber: 'D100', colour: 'Navy', size: '22' }, 'SO-2', context.paFStockRows(), reservations);
  assert.equal(navy20.physical, 150);
  assert.equal(navy20.otherOrders, 120);
  assert.equal(navy20.free, 30);
  assert.equal(navy22.free, 40);
});


test('dispatch reservation validation counts issues across every invoice linked to the same packing slip', () => {
  reset();
  put('pa_packing_slips_v1', [
    { id: 'PS-1', number: 'PA-PS-1', orderId: 'SO-1', status: 'approved', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 100 }] }
  ]);
  put('pa_tax_invoices', [
    { id: 'INV-1', packing_slip_id: 'PS-1', status: 'issued', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 60 }] },
    { id: 'INV-2', packing_slip_id: 'PS-1', status: 'issued', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 40 }] }
  ]);
  put('pa_garment_stock_ledger_v1', [
    { type: 'Dispatch / sale issue', dispatchId: 'DSP-1', invoiceId: 'INV-1', itemNumber: 'D100', colour: 'Navy', size: '20', qty: 60 }
  ]);
  assert.equal(context.paFValidateDispatchReservation(
    { id: 'INV-2', packing_slip_id: 'PS-1', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 40 }] },
    { id: 'DSP-2' },
    [{ itemIndex: 0, qty: 40 }]
  ), true);
  assert.equal(context.paFValidateDispatchReservation(
    { id: 'INV-2', packing_slip_id: 'PS-1', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 40 }] },
    { id: 'DSP-3' },
    [{ itemIndex: 0, qty: 41 }]
  ), false);
});

test('dispatch reservation validation rejects fractional, zero, negative and invalid item allocations', () => {
  reset();
  put('pa_packing_slips_v1', [
    { id: 'PS-1', orderId: 'SO-1', status: 'approved', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 10 }] }
  ]);
  put('pa_tax_invoices', [{ id: 'INV-1', packing_slip_id: 'PS-1', status: 'issued', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 10 }] }]);
  for (const allocation of [{ itemIndex: 0, qty: 1.5 }, { itemIndex: 0, qty: 0 }, { itemIndex: 0, qty: -1 }, { itemIndex: 9, qty: 1 }]) {
    assert.equal(context.paFValidateDispatchReservation(
      { id: 'INV-1', packing_slip_id: 'PS-1', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 10 }] },
      { id: 'DSP-X' },
      [allocation]
    ), false);
  }
});
