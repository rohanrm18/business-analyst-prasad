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
const source = fs.readFileSync('advanced-workflows.js', 'utf8');
const stores = new Map();
const context = vm.createContext({ read: (key, fallback = []) => stores.has(key) ? stores.get(key) : fallback });
vm.runInContext(['bankSources','bankFP','bankDate','bankAmount'].map(n => extract(source, n)).join('\n'), context);

test('bank matching sources include only valid completed non-cash records', () => {
  stores.clear();
  stores.set('pa_customer_receipts_v1', [
    { id: 'R1', date: '2026-11-01', amount: 1200, customer: 'Buyer', mode: 'Bank', status: 'posted', reference: 'UTR1' },
    { id: 'R2', date: '2026-11-02', amount: 300, customer: 'Buyer', mode: 'Bank', status: 'reversed' },
    { id: 'R3', date: '2026-11-03', amount: 400, customer: 'Buyer', mode: 'Cash', status: 'posted' },
    { id: 'R4', date: '2026-11-04', amount: 500, customer: 'Buyer', mode: 'Bank', status: 'pending' },
    { id: 'R5', date: '2026-02-30', amount: 600, customer: 'Buyer', mode: 'Bank' },
    { id: 'R6', date: '2026-11-06', amount: Infinity, customer: 'Buyer', mode: 'Bank' }
  ]);
  stores.set('pa_supplier_payments_v1', [
    { id: 'P1', date: '2026-11-07', amountPaid: 2500, supplier: 'Supplier', mode: 'NEFT' },
    { id: 'P2', date: '2026-11-08', amountPaid: 0, supplier: 'Supplier', mode: 'NEFT' }
  ]);
  stores.set('pa_supplier_advance_payments_v1', [
    { id: 'A1', date: '2026-11-09', amount: 700, supplier: 'Supplier', mode: 'UPI', status: 'approved' }
  ]);
  const rows = context.bankSources();
  assert.deepEqual(Array.from(rows, x => x.id), ['R1', 'P1', 'A1']);
  assert.equal(rows[0].direction, 'credit');
  assert.equal(rows[1].direction, 'debit');
  assert.equal(rows[0].reference, 'UTR1');
});

test('bank CSV date parser accepts supported day-first and ISO dates', () => {
  assert.equal(context.bankDate('27/11/2026'), '2026-11-27');
  assert.equal(context.bankDate('7-1-2026'), '2026-01-07');
  assert.equal(context.bankDate('2026-11-27'), '2026-11-27');
  assert.equal(context.bankDate('not a date'), '');
});

test('bank amount parser handles Indian separators, rupee sign, negatives and invalid values', () => {
  assert.equal(context.bankAmount('₹1,25,000.50'), 125000.5);
  assert.equal(context.bankAmount('(2,500.00)'), -2500);
  assert.equal(context.bankAmount('-750'), -750);
  assert.equal(context.bankAmount(''), 0);
  assert.ok(Number.isNaN(context.bankAmount('1,2,3.456')));
});

test('bank row fingerprint is stable across whitespace and case in narrative fields', () => {
  const a = { date: '2026-11-27', account: 'Current', debit: 100, credit: 0, reference: ' UTR-9 ', description: ' CASH Deposit ' };
  const b = { date: '2026-11-27', account: 'Current', debit: 100, credit: 0, reference: 'utr-9', description: 'cash deposit' };
  assert.equal(context.bankFP(a), context.bankFP(b));
  assert.notEqual(context.bankFP(a), context.bankFP({ ...b, credit: 1 }));
});
