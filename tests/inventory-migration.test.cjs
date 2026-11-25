'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { migrate, balances } = require('../inventory-migration.js');

/* The live screens calculate balances with these functions; the canonical ledger must agree with them. */
function extractFunction(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'function ' + name + ' must exist');
  const brace = source.indexOf('{', start);
  let depth = 0, quote = '', escaped = false;
  for (let i = brace; i < source.length; i++) {
    const ch = source[i];
    if (quote) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('Unclosed function ' + name);
}
const legacyGarment = moves => vm.runInNewContext('(' + extractFunction(fs.readFileSync('app.js', 'utf8'), 'stockBalanceRows') + ')', { garmentStockMoves: moves })();
const legacyMaterial = (moves, item, unit) => vm.runInNewContext('(' + extractFunction(fs.readFileSync('erp.js', 'utf8'), 'stockBalance') + ')', { moves })(item, unit);

const garmentMoves = () => [
  { id: 'G1', style: 'PA-101', colour: 'Peach', size: '20', type: 'Opening balance', qty: 50, date: '2026-04-01' },
  { id: 'G2', style: 'PA-101', colour: 'Peach', size: '20', type: 'Production receipt', qty: 100, date: '2026-05-01' },
  { id: 'G3', style: 'PA-101', colour: 'Peach', size: '20', type: 'Dispatch / sale issue', qty: 15, date: '2026-05-10' },
  { id: 'G4', style: 'PA-101', colour: 'Peach', size: '20', type: 'Customer return', status: 'quarantine', qty: 5 },
  { id: 'G5', style: 'PA-101', colour: 'Peach', size: '20', type: 'Customer return', status: 'released', qty: 2 },
  { id: 'G6', style: 'PA-101', colour: 'Navy', size: '22', type: 'Purchase inward', qty: 40 },
  { id: 'G7', style: 'PA-101', colour: 'Navy', size: '22', type: 'Stock adjustment out', qty: 3 },
  { style: 'PA-LEGACY', type: 'Production receipt', qty: 12 }
];
const materialMoves = () => [
  { id: 'M1', item: 'Navy Fabric', unit: 'Meters', direction: 'IN', qty: 100 },
  { id: 'M2', item: 'navy fabric', unit: 'Meters', direction: 'OUT', qty: 25 },
  { id: 'M3', item: 'Navy Fabric', unit: 'Rolls', direction: 'IN', qty: 3 }
];

test('conservation: canonical garment balances equal what the live stock screen shows today', () => {
  const g = garmentMoves();
  const { entries } = migrate({ garmentMoves: g, materialMoves: [] });
  const canon = balances(entries).garment, live = legacyGarment(g);
  assert.equal(canon.length, live.length);
  live.forEach(l => {
    const c = canon.find(x => x.style === l.style && x.colour === l.colour && x.size === l.size);
    assert.ok(c, 'variant present: ' + [l.style, l.colour, l.size].join('/'));
    assert.equal(c.available, l.available);
    assert.equal(c.quarantined, l.quarantined);
  });
});

test('conservation: canonical material balances equal the live inward/outward screen', () => {
  const m = materialMoves();
  const { entries } = migrate({ garmentMoves: [], materialMoves: m });
  const canon = balances(entries).material;
  assert.equal(canon.find(x => x.itemKey === 'navy fabric' && x.unit === 'Meters').balance, legacyMaterial(m, 'Navy Fabric', 'Meters'));
  assert.equal(canon.find(x => x.itemKey === 'navy fabric' && x.unit === 'Rolls').balance, legacyMaterial(m, 'Navy Fabric', 'Rolls'));
  assert.equal(canon.length, 2, 'meters and rolls stay separate; name case and spaces do not split an item');
});

test('known difference: names that differ only by stray spaces are merged by the migration (the live screen shows them as two items)', () => {
  const m = [
    { id: 'S1', item: 'Navy Fabric', unit: 'Meters', direction: 'IN', qty: 100 },
    { id: 'S2', item: 'navy fabric ', unit: 'Meters', direction: 'OUT', qty: 25 }
  ];
  assert.equal(legacyMaterial(m, 'Navy Fabric', 'Meters'), 100, 'live screen today: the trailing-space row is a separate item');
  const canon = balances(migrate({ garmentMoves: [], materialMoves: m }).entries).material;
  assert.equal(canon.length, 1);
  assert.equal(canon[0].balance, 75);
  assert.equal(canon[0].balance, 100 - 25, 'total quantity across the merged rows is conserved');
});

test('no loss: every valid legacy row becomes exactly one entry; invalid rows are reported, never dropped silently', () => {
  const g = garmentMoves().concat([
    { id: 'BAD1', style: '', type: 'Production receipt', qty: 5 },
    { id: 'BAD2', style: 'PA-9', type: 'Production receipt', qty: -4 },
    { id: 'BAD3', style: 'PA-9', type: 'Mystery type', qty: 4 }
  ]);
  const m = materialMoves().concat([{ id: 'BADM', item: 'Thread', unit: '', direction: 'IN', qty: 1 }]);
  const r = migrate({ garmentMoves: g, materialMoves: m });
  assert.equal(r.entries.length, garmentMoves().length + materialMoves().length);
  assert.equal(r.rejected.length, 4);
  assert.equal(r.entries.length + r.rejected.length, g.length + m.length);
  assert.deepEqual(r.rejected.map(x => x.ledger).sort(), ['garment', 'garment', 'garment', 'material']);
});

test('idempotent: running the migration twice does not double count', () => {
  const input = { garmentMoves: garmentMoves(), materialMoves: materialMoves() };
  const first = migrate(input);
  const second = migrate({ ...input, existing: first.entries });
  assert.equal(second.added, 0);
  assert.equal(second.skipped, first.entries.length);
  assert.deepEqual(balances(second.entries), balances(first.entries));
});

test('incremental: only rows added after the first run are migrated on the second run', () => {
  const g = garmentMoves();
  const first = migrate({ garmentMoves: g, materialMoves: [] });
  g.push({ id: 'G9', style: 'PA-101', colour: 'Peach', size: '20', type: 'Dispatch / sale issue', qty: 10 });
  const second = migrate({ garmentMoves: g, materialMoves: [], existing: first.entries });
  assert.equal(second.added, 1);
  const peach = balances(second.entries).garment.find(x => x.colour === 'Peach' && x.size === '20');
  assert.equal(peach.available, 50 + 100 - 15 + 2 - 10);
});

test('rows without an id: identical rows are all kept, and a re-run still adds nothing', () => {
  const g = [
    { style: 'PA-5', colour: 'Red', size: '18', type: 'Production receipt', qty: 10, date: '2026-06-01' },
    { style: 'PA-5', colour: 'Red', size: '18', type: 'Production receipt', qty: 10, date: '2026-06-01' }
  ];
  const first = migrate({ garmentMoves: g, materialMoves: [] });
  assert.equal(first.entries.length, 2);
  assert.equal(balances(first.entries).garment[0].available, 20);
  const again = migrate({ garmentMoves: g, materialMoves: [], existing: first.entries });
  assert.equal(again.added, 0);
});

test('legacy garment rows with no colour or size stay unallocated; nothing is guessed', () => {
  const { entries } = migrate({ garmentMoves: [{ style: 'PA-LEGACY', type: 'Production receipt', qty: 12 }], materialMoves: [] });
  assert.equal(entries[0].colour, '');
  assert.equal(entries[0].size, '');
  const rows = balances(entries).garment;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].available, 12);
});

test('the two ledgers never cross-post: a material row is not turned into garment stock', () => {
  const { entries } = migrate({
    garmentMoves: [{ id: 'G1', style: 'PA-101', colour: 'Peach', size: '20', type: 'Production receipt', qty: 30 }],
    materialMoves: [{ id: 'M1', item: 'PA-101 Peach Size 20', unit: 'Pcs', direction: 'IN', qty: 50 }]
  });
  const b = balances(entries);
  assert.equal(b.garment.length, 1);
  assert.equal(b.garment[0].available, 30);
  assert.equal(b.material.length, 1);
  assert.equal(b.material[0].balance, 50);
});

test('the migration never changes the input rows', () => {
  const g = garmentMoves(), m = materialMoves();
  const before = JSON.stringify([g, m]);
  migrate({ garmentMoves: g, materialMoves: m });
  assert.equal(JSON.stringify([g, m]), before);
});
