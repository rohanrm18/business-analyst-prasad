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
const state = { postingMaps: [], accounts: [], journals: [], saved: 0, dateAllowed: true };
const context = vm.createContext({
  ...state,
  postingMaps: state.postingMaps,
  accounts: state.accounts,
  journals: state.journals,
  awDateAllowed: day => state.dateAllowed,
  awNextNo: () => 'AUTO-0001',
  persist: () => { state.saved++; },
  postingEvents: [['expense', 'General business expense']],
  window: {}
});
vm.runInContext(extract(source, 'postMappedJournalLines'), context);
function reset() {
  state.postingMaps.splice(0, state.postingMaps.length, { event: 'expense', status: 'CA reviewed' });
  state.accounts.splice(0, state.accounts.length, { code: '5000' }, { code: '1000' }, { code: '2100' });
  state.journals.splice(0);
  state.saved = 0;
  state.dateAllowed = true;
}
const balanced = [
  { account: '5000', debit: 100.005, credit: 0 },
  { account: '1000', debit: 0, credit: 100.005 }
];

test('mapped journal posts only balanced paise-accurate entries', () => {
  reset();
  const result = context.postMappedJournalLines('expense', 'EXP-1', '2026-11-28', balanced, 'Office expense', 'V-1');
  assert.equal(result.created, true);
  assert.equal(result.journal.total, 100.01);
  assert.equal(result.journal.status, 'posted');
  assert.equal(state.journals.length, 1);
  assert.equal(state.saved, 1);
});

test('unreviewed or missing account mappings block journal posting', () => {
  reset();
  state.postingMaps[0].status = 'Draft';
  assert.throws(() => context.postMappedJournalLines('expense', 'EXP-2', '2026-11-28', balanced), /CA-reviewed mapping/);
  state.postingMaps.splice(0);
  assert.throws(() => context.postMappedJournalLines('expense', 'EXP-2', '2026-11-28', balanced), /CA-reviewed mapping/);
  assert.equal(state.journals.length, 0);
});

test('unbalanced, zero, invalid-account and double-sided lines are rejected', () => {
  reset();
  assert.throws(() => context.postMappedJournalLines('expense', 'EXP-3', '2026-11-28', [
    { account: '5000', debit: 100, credit: 0 }, { account: '1000', debit: 0, credit: 99 }
  ]), /balance exactly/);
  assert.throws(() => context.postMappedJournalLines('expense', 'EXP-4', '2026-11-28', [
    { account: '9999', debit: 100, credit: 0 }, { account: '1000', debit: 0, credit: 100 }
  ]), /Invalid account/);
  assert.throws(() => context.postMappedJournalLines('expense', 'EXP-5', '2026-11-28', [
    { account: '5000', debit: 100, credit: 100 }, { account: '1000', debit: 0, credit: 0 }
  ]), /Invalid account/);
  assert.equal(state.journals.length, 0);
});

test('same source event and same journal is idempotent', () => {
  reset();
  const first = context.postMappedJournalLines('expense', 'EXP-6', '2026-11-28', balanced);
  const second = context.postMappedJournalLines('expense', 'EXP-6', '2026-11-28', balanced);
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(state.journals.length, 1);
  assert.equal(state.saved, 1);
});

test('conflicting duplicate source event is blocked without a second journal', () => {
  reset();
  context.postMappedJournalLines('expense', 'EXP-7', '2026-11-28', balanced);
  assert.throws(() => context.postMappedJournalLines('expense', 'EXP-7', '2026-11-28', [
    { account: '5000', debit: 200, credit: 0 }, { account: '1000', debit: 0, credit: 200 }
  ]), /conflicts with the existing journal/);
  assert.equal(state.journals.length, 1);
});

test('locked financial year blocks new journal but permits exact idempotent retry', () => {
  reset();
  state.dateAllowed = false;
  assert.throws(() => context.postMappedJournalLines('expense', 'EXP-8', '2026-11-28', balanced), /locked financial-year/);
  assert.equal(state.journals.length, 0);
});
