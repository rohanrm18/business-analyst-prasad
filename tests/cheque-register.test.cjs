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
const context = vm.createContext({});
vm.runInContext(extract(source, 'chequeNextStatuses'), context);

test('post-dated received and issued cheques enter the correct first status', () => {
  assert.deepEqual(Array.from(context.chequeNextStatuses({ kind: 'Received', status: 'Post-dated' })), ['Received', 'Cancelled']);
  assert.deepEqual(Array.from(context.chequeNextStatuses({ kind: 'Issued', status: 'Post-dated' })), ['Issued', 'Cancelled']);
});

test('received cheque can be deposited, bounced or cancelled', () => {
  assert.deepEqual(Array.from(context.chequeNextStatuses({ kind: 'Received', status: 'Received' })), ['Deposited', 'Bounced', 'Cancelled']);
});

test('issued cheque can be cleared, bounced or cancelled', () => {
  assert.deepEqual(Array.from(context.chequeNextStatuses({ kind: 'Issued', status: 'Issued' })), ['Cleared', 'Bounced', 'Cancelled']);
});

test('deposited cheque can be cleared, bounced or cancelled', () => {
  assert.deepEqual(Array.from(context.chequeNextStatuses({ kind: 'Received', status: 'Deposited' })), ['Cleared', 'Bounced', 'Cancelled']);
});

test('cleared, bounced and cancelled cheques are terminal states', () => {
  for (const status of ['Cleared', 'Bounced', 'Cancelled', 'Unknown']) {
    assert.deepEqual(Array.from(context.chequeNextStatuses({ kind: 'Received', status })), []);
  }
});
