'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const ledger=require('../inventory-ledger.js');

test('normalizes finished garments by exact style, colour and size without guessing',()=>{
 const out=ledger.normalizeGarmentRows([
  {id:'g1',type:'Production receipt',style:'PA-101',colour:'Peach',size:'20',qty:25},
  {id:'g2',type:'Dispatch / sale issue',style:'PA-101',colour:'Peach',size:'20',qty:4},
  {id:'g3',type:'Production receipt',style:'PA-101',qty:8}
 ]);
 assert.equal(out[0].record.domain,'finished-garment');
 assert.equal(out[0].record.signedQty,25);
 assert.equal(out[1].record.signedQty,-4);
 assert.equal(out[2].record.allocationStatus,'unallocated-review');
 assert.equal(ledger.balance(out.filter(x=>x.ok).map(x=>x.record),{domain:'finished-garment',style:'PA-101',colour:'Peach',size:'20',unit:'Pcs'}),21);
});

test('keeps quarantined customer returns out of saleable balance',()=>{
 const rows=ledger.normalizeGarmentRows([
  {id:'g1',type:'Production receipt',style:'PA-1',colour:'Blue',size:'22',qty:10},
  {id:'g2',type:'Customer return',status:'pending',style:'PA-1',colour:'Blue',size:'22',qty:3},
  {id:'g3',type:'Customer return',status:'released',style:'PA-1',colour:'Blue',size:'22',qty:2}
 ]).map(x=>x.record);
 assert.equal(ledger.balance(rows,{domain:'finished-garment',style:'PA-1',colour:'Blue',size:'22',unit:'Pcs'}),12);
});

test('normalizes materials with item identity and unit kept separate',()=>{
 const rows=ledger.normalizeMaterialRows([
  {id:'m1',item:'Navy Fabric',unit:'Meters',direction:'IN',qty:100},
  {id:'m2',item:'Navy Fabric',unit:'Meters',direction:'OUT',qty:15},
  {id:'m3',item:'Navy Fabric',unit:'Rolls',direction:'IN',qty:2}
 ]).map(x=>x.record);
 assert.equal(rows[0].domain,'material');
 assert.equal(ledger.balance(rows,{domain:'material',itemName:'Navy Fabric',unit:'Meters'}),85);
 assert.equal(ledger.balance(rows,{domain:'material',itemName:'Navy Fabric',unit:'Rolls'}),2);
});

test('migration preview flags invalid rows, duplicate legacy ids and unallocated garments',()=>{
 const report=ledger.preview([
  {id:'same',type:'Production receipt',style:'PA-1',qty:4},
  {id:'same',type:'Production receipt',style:'PA-2',colour:'Red',size:'20',qty:2},
  {id:'bad',type:'Production receipt',style:'PA-3',qty:0}
 ],[{id:'m1',item:'Thread',unit:'Kg',direction:'IN',qty:1}]);
 assert.equal(report.invalid.length,1);
 assert.equal(report.duplicates.length,1);
 assert.equal(report.unallocated,1);
 assert.match(report.warning,/Preview only/);
});

test('material balance can match legacy item names even when newer rows have item IDs',()=>{
 const rows=ledger.normalizeMaterialRows([
  {id:'m1',item:'Cotton Fabric',unit:'Meters',direction:'IN',qty:12},
  {id:'m2',item:'Cotton Fabric',itemId:'MAT-01',unit:'Meters',direction:'IN',qty:8}
 ]).map(x=>x.record);
 assert.equal(ledger.balance(rows,{domain:'material',itemName:'Cotton Fabric',unit:'Meters'}),20);
 assert.equal(ledger.balance(rows,{domain:'material',itemId:'MAT-01',unit:'Meters'}),8);
});
