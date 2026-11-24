'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function extractFunction(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'function ' + name + ' must exist');
  const brace = source.indexOf('{', start);
  let depth = 0, quote = '', escaped = false;
  for (let i = brace; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('Unclosed function ' + name);
}

const appSource = fs.readFileSync('app.js', 'utf8');
const erpSource = fs.readFileSync('erp.js', 'utf8');
const garmentFn = extractFunction(appSource, 'stockBalanceRows');
const materialFn = extractFunction(erpSource, 'stockBalance');

test('garment ledger balances each style/colour/size independently', () => {
  const moves = [
    { style: 'PA-101', colour: 'Peach', size: '20', type: 'Production receipt', qty: 100 },
    { style: 'PA-101', colour: 'Peach', size: '20', type: 'Dispatch / sale issue', qty: 15 },
    { style: 'PA-101', colour: 'Peach', size: '20', type: 'Customer return', status: 'quarantine', qty: 5 },
    { style: 'PA-101', colour: 'Peach', size: '20', type: 'Customer return', status: 'released', qty: 2 },
    { style: 'PA-101', colour: 'Navy', size: '20', type: 'Production receipt', qty: 40 }
  ];
  const rows = vm.runInNewContext('(' + garmentFn + ')', { garmentStockMoves: moves })();
  const peach = rows.find(x => x.style === 'PA-101' && x.colour === 'Peach' && x.size === '20');
  const navy = rows.find(x => x.colour === 'Navy');
  assert.equal(peach.available, 87);
  assert.equal(peach.quarantined, 5);
  assert.equal(navy.available, 40);
});

test('legacy garment rows without colour or size remain unallocated, not guessed', () => {
  const rows = vm.runInNewContext('(' + garmentFn + ')', { garmentStockMoves: [{ style: 'PA-LEGACY', qty: 12, type: 'Production receipt' }] })();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].style, 'PA-LEGACY');
  assert.equal(rows[0].colour, '');
  assert.equal(rows[0].size, '');
  assert.equal(rows[0].available, 12);
});

test('material ledger matches case-insensitive typed item and keeps units separate', () => {
  const moves = [
    { item: 'Navy Fabric', unit: 'Meters', direction: 'IN', qty: 100 },
    { item: 'navy fabric', unit: 'Meters', direction: 'OUT', qty: 25 },
    { item: 'Navy Fabric', unit: 'Rolls', direction: 'IN', qty: 3 }
  ];
  const fn = vm.runInNewContext('(' + materialFn + ')', { moves });
  assert.equal(fn('NAVY FABRIC', 'Meters'), 75);
  assert.equal(fn('Navy Fabric', 'Rolls'), 3);
});

test('material-name ledger and garment variant ledger are distinct models; no implicit cross-posting', () => {
  const materialMoves = [{ item: 'PA-101 Peach Size 20', unit: 'Pcs', direction: 'IN', qty: 50 }];
  const garmentMoves = [{ style: 'PA-101', colour: 'Peach', size: '20', type: 'Production receipt', qty: 30 }];
  const materialBalance = vm.runInNewContext('(' + materialFn + ')', { moves: materialMoves })('PA-101 Peach Size 20', 'Pcs');
  const garmentRows = vm.runInNewContext('(' + garmentFn + ')', { garmentStockMoves: garmentMoves })();
  assert.equal(materialBalance, 50);
  assert.equal(garmentRows[0].available, 30);
  assert.notEqual(materialBalance, garmentRows[0].available);
});
