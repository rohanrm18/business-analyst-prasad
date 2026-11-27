'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function extract(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.ok(start >= 0, 'missing function ' + name);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}
const source = fs.readFileSync('compliance.js', 'utf8');
const records = new Map();
const K = { bills: 'bills', payments: 'payments', tds: 'tds', allocations: 'allocations' };
const context = vm.createContext({
  K,
  R: (key, fallback = []) => records.has(key) ? records.get(key) : fallback,
  gstChecks: () => [],
  money: value => '₹' + Number(value || 0).toFixed(2)
});
vm.runInContext(extract(source, 'monthEndClosingRows'), context);
function reset(data = {}) {
  records.clear();
  for (const [key, value] of Object.entries(data)) records.set(key, value);
}
function byName(rows, name) { return rows.find(row => row.name === name); }

test('month-end checklist identifies missing sales and purchase invoice references', () => {
  reset({
    pa_tax_invoices: [{ id: 'S-1', invoice_date: '2026-11-10', grand_total: 1000, status: 'issued' }],
    bills: [{ id: 'P-1', invoiceDate: '2026-11-12', total: 500 }]
  });
  const rows = context.monthEndClosingRows('2026-11');
  assert.equal(byName(rows, 'Sales invoices & numbering').state, 'REVIEW');
  assert.equal(byName(rows, 'Supplier purchase bills').state, 'REVIEW');
  assert.match(byName(rows, 'Sales invoices & numbering').detail, /missing number\/date/);
  assert.match(byName(rows, 'Supplier purchase bills').detail, /missing invoice number\/date/);
});

test('month-end customer and supplier balances include receipts, approved credits, payments, TDS and advances', () => {
  reset({
    pa_tax_invoices: [{ id: 'S-1', invoice_date: '2026-10-10', grand_total: 10000, status: 'issued' }],
    pa_customer_receipts_v1: [{ date: '2026-11-05', status: 'posted', amount: 6000, allocations: [{ invoiceId: 'S-1', amount: 6000 }] }],
    pa_customer_credit_notes_v1: [{ date: '2026-11-06', invoiceId: 'S-1', amount: 1000, status: 'approved' }],
    bills: [{ id: 'P-1', invoiceDate: '2026-10-12', total: 8000 }],
    payments: [{ billId: 'P-1', date: '2026-11-08', amountPaid: 3000, tdsWithheld: 500 }],
    pa_supplier_advance_allocations_v1: [{ billId: 'P-1', date: '2026-11-09', amount: 1000 }],
    pa_purchase_returns_v1: [{ billId: 'P-1', date: '2026-11-10', amount: 500, status: 'approved' }]
  });
  const rows = context.monthEndClosingRows('2026-11');
  const customer = byName(rows, 'Customer invoice balances');
  const supplier = byName(rows, 'Supplier invoice reconciliation');
  assert.equal(customer.count, 1);
  assert.match(customer.detail, /₹3000\.00/);
  assert.equal(supplier.count, 1);
  assert.match(supplier.detail, /₹3000\.00/);
  assert.equal(supplier.state, 'REVIEW');
});

test('month-end checklist flags unmatched bank rows, statement differences and pending dispatch postings', () => {
  reset({
    pa_bank_reconciliation_rows_v1: [
      { date: '2026-11-03', status: 'unmatched' },
      { date: '2026-11-04', status: 'confirmed' }
    ],
    pa_bank_reconciliation_statements_v1: [{ importedAt: '2026-11-05T10:00:00Z', balanceDifference: 25 }],
    pa_dispatches_v1: [
      { date: '2026-11-06', stockPostingStatus: 'pending' },
      { date: '2026-11-07', stockPostingStatus: 'legacy-unverified' }
    ]
  });
  const rows = context.monthEndClosingRows('2026-11');
  assert.equal(byName(rows, 'Cash & bank movement').state, 'REVIEW');
  assert.match(byName(rows, 'Cash & bank movement').detail, /1 bank row\(s\) unmatched/);
  assert.match(byName(rows, 'Cash & bank movement').detail, /1 statement balance mismatch/);
  assert.equal(byName(rows, 'Dispatch and stock posting').count, 2);
  assert.equal(byName(rows, 'Dispatch and stock posting').state, 'REVIEW');
});

test('month-end checklist keeps GST and TDS explicitly subject to CA review', () => {
  reset({
    tds: [{ id: 'T-1', date: '2026-11-15', applicable: true, tds: 400 }],
    allocations: [{ tdsId: 'T-1', amount: 100 }],
    payments: [{ date: '2026-11-20', amountPaid: 1000, tdsWithheld: 200 }]
  });
  const rows = context.monthEndClosingRows('2026-11');
  assert.equal(byName(rows, 'GST working & source checks').state, 'CA REVIEW REQUIRED');
  assert.equal(byName(rows, 'TDS deductions & allocations').state, 'REVIEW');
  assert.match(byName(rows, 'TDS deductions & allocations').detail, /₹300\.00/);
  assert.match(byName(rows, 'TDS deductions & allocations').detail, /₹200\.00/);
});
