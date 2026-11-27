'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function extract(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.ok(start >= 0, 'missing ' + name);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unterminated ' + name);
}
function ledgerContext(data) {
  const source = fs.readFileSync('compliance.js', 'utf8');
  const names = ['billPaymentTotals','billOutstanding','tdsAllocated','tdsUnallocated','tdsTotal','depositAllocated','depositUnallocated','allocatedTotal','depositTotal'];
  return vm.createContext({ ...data, ...Object.fromEntries(names.map(n => [n, undefined])) , __load: source, __names: names });
}
const payments = [
  { id: 'PAY-1', billId: 'BILL-1', amountPaid: 4000, tdsWithheld: 200 },
  { id: 'PAY-2', billId: 'BILL-1', amountPaid: 3000, tdsWithheld: 100 },
  { id: 'PAY-3', billId: 'BILL-2', amountPaid: 900, tdsWithheld: 0 }
];
const tds = [{ id: 'TDS-1', applicable: true, tds: 300 }, { id: 'TDS-2', applicable: false, tds: 100 }, { id: 'TDS-3', applicable: true, tds: 0 }];
const deposits = [{ id: 'DEP-1', amount: 500 }, { id: 'DEP-2', amount: 250 }];
const allocations = [
  { tdsId: 'TDS-1', depositId: 'DEP-1', amount: 200 },
  { tdsId: 'TDS-1', depositId: 'DEP-2', amount: 50 },
  { tdsId: 'TDS-2', depositId: 'DEP-1', amount: 100 }
];
const context = ledgerContext({ payments, tds, deposits, allocations });
const source = fs.readFileSync('compliance.js', 'utf8');
const names = ['billPaymentTotals','billOutstanding','tdsAllocated','tdsUnallocated','tdsTotal','depositAllocated','depositUnallocated','allocatedTotal','depositTotal'];
vm.runInContext(names.map(n => extract(source,n)).join('\n'), context);

test('supplier bill outstanding reconciles cash paid plus TDS withheld', () => {
  const totals = context.billPaymentTotals({ id: 'BILL-1', total: 10000 });
  assert.equal(totals.paid, 7000);
  assert.equal(totals.tds, 300);
  assert.equal(context.billOutstanding({ id: 'BILL-1', total: 10000 }), 2700);
});
test('supplier bill outstanding never becomes negative after over-allocation data', () => {
  assert.equal(context.billOutstanding({ id: 'BILL-1', total: 500 }), 0);
});
test('TDS allocated and unallocated balances reconcile without counting non-applicable rows in total', () => {
  assert.equal(context.tdsAllocated(tds[0]), 250);
  assert.equal(context.tdsUnallocated(tds[0]), 50);
  assert.equal(context.tdsTotal(), 300);
});
test('challan deposit allocation and unallocated balance reconcile', () => {
  assert.equal(context.depositAllocated(deposits[0]), 300);
  assert.equal(context.depositUnallocated(deposits[0]), 200);
  assert.equal(context.depositTotal(), 750);
  assert.equal(context.allocatedTotal(), 350);
});
