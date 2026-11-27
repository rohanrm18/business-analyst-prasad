'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function extract(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.ok(start >= 0, 'missing ' + name);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unterminated ' + name);
}
const source = fs.readFileSync('app.js', 'utf8');
const names = ['arInvoices','arInvoiceTotal','arReceived','arCredited','arBal','arDue','arCaseFor','arOpen','arReminderStage'];
const state = vm.createContext({
  taxInvoices: [],
  arOpening: [],
  arReceipts: [],
  arCreditNotes: [],
  arStatusEvents: [],
  Date
});
vm.runInContext(names.map(name => extract(source, name)).join('\n'), state);

test('customer outstanding nets only active receipts and approved credit notes', () => {
  const invoice = { id: 'INV-AR-1', grand_total: 10000, buyer_name: 'Buyer A', invoice_date: '2026-11-01', due_date: '2026-11-20', status: 'issued' };
  state.taxInvoices = [invoice];
  state.arReceipts = [
    { id: 'RC-1', status: 'posted', allocations: [{ invoiceId: invoice.id, amount: 2500 }] },
    { id: 'RC-2', status: 'reversed', allocations: [{ invoiceId: invoice.id, amount: 1000 }] }
  ];
  state.arCreditNotes = [
    { invoiceId: invoice.id, status: 'approved', amount: 500 },
    { invoiceId: invoice.id, status: 'pending_ca_review', amount: 1000 },
    { invoiceId: invoice.id, status: 'draft', amount: 500 },
    { invoiceId: invoice.id, status: 'reversed', amount: 250 }
  ];
  assert.equal(state.arInvoiceTotal(invoice), 10000);
  assert.equal(state.arReceived(invoice), 2500);
  assert.equal(state.arCredited(invoice), 500);
  assert.equal(state.arBal(invoice), 7000);
  assert.equal(state.arOpen().length, 1);
});

test('reversed invoices have zero receivable and opening balances use their own amount', () => {
  const reversed = { id: 'INV-AR-2', grand_total: 4000, buyer_name: 'Buyer B', status: 'reversed' };
  const opening = { id: 'OPEN-AR-1', opening_balance: true, openingAmount: 3000, grand_total: 0, buyer_name: 'Buyer C', status: 'opening' };
  state.taxInvoices = [reversed];
  state.arOpening = [opening];
  state.arReceipts = [];
  state.arCreditNotes = [];
  assert.equal(state.arInvoiceTotal(reversed), 0);
  assert.equal(state.arBal(reversed), 0);
  assert.equal(state.arInvoiceTotal(opening), 3000);
  assert.equal(state.arBal(opening), 3000);
  assert.equal(state.arOpen().length, 1);
});

test('disputed and on-hold status is taken from the latest invoice event', () => {
  const invoice = { id: 'INV-AR-3', grand_total: 500, buyer_name: 'Buyer D', due_date: '2026-11-27' };
  state.taxInvoices = [invoice];
  state.arOpening = [];
  state.arReceipts = [];
  state.arCreditNotes = [];
  state.arStatusEvents = [
    { invoiceId: invoice.id, status: 'disputed', reason: 'Quantity query' },
    { invoiceId: invoice.id, status: 'on_hold', reason: 'Awaiting confirmation' }
  ];
  assert.equal(state.arCaseFor(invoice).status, 'on_hold');
  assert.equal(state.arCaseFor(invoice).reason, 'Awaiting confirmation');
});

test('collection reminder schedule follows due-date and overdue milestones', () => {
  const due = '2026-11-27';
  const invoice = { id: 'INV-AR-4', due_date: due };
  const originalNow = Date.now;
  const base = new Date(due + 'T00:00:00').getTime();
  Date.now = () => base;
  // arAge uses new Date().setHours; freeze the Date constructor for deterministic calendar tests.
  const FixedDate = class extends Date { constructor(...args) { super(...(args.length ? args : [base])); } static now(){ return base; } };
  state.Date = FixedDate;
  assert.equal(state.arReminderStage(invoice), 'Due today');
  assert.equal(state.arReminderStage({ due_date: '2026-11-24' }), '3 days overdue');
  assert.equal(state.arReminderStage({ due_date: '2026-11-20' }), '7 days overdue');
  assert.equal(state.arReminderStage({ due_date: '2026-11-12' }), '15-day overdue follow-up');
  assert.equal(state.arReminderStage({ due_date: '2026-11-30' }), '3 days before due');
  Date.now = originalNow;
});
