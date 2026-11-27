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

test('rejects unknown garment movement types, missing styles and invalid quantities',()=>{
 const out=ledger.normalizeGarmentRows([
  {id:'bad1',type:'Mystery type',style:'PA-1',colour:'Red',size:'20',qty:5},
  {id:'bad2',type:'Production receipt',style:'',colour:'Red',size:'20',qty:5},
  {id:'bad3',type:'Production receipt',style:'PA-1',qty:-1}
 ]);
 assert.deepEqual(out.map(x=>x.ok),[false,false,false]);
 assert.match(out[0].reason,/Unknown garment movement type/);
 assert.match(out[1].reason,/Missing style/);
});

test('reference values are not movement identities; different rows sharing a reference remain distinct',()=>{
 const rows=ledger.normalizeGarmentRows([
  {id:'g-a',reference:'GRN-10',type:'Production receipt',style:'PA-1',colour:'Red',size:'20',qty:5},
  {id:'g-b',reference:'GRN-10',type:'Production receipt',style:'PA-2',colour:'Blue',size:'22',qty:7}
 ]);
 assert.notEqual(rows[0].record.movementId,rows[1].record.movementId);
 assert.equal(ledger.preview([
  {id:'g-a',reference:'GRN-10',type:'Production receipt',style:'PA-1',colour:'Red',size:'20',qty:5},
  {id:'g-b',reference:'GRN-10',type:'Production receipt',style:'PA-2',colour:'Blue',size:'22',qty:7}
 ],[]).duplicates.length,0);
});

test('rows without IDs use content-derived stable IDs, not their array positions',()=>{
 const a={type:'Production receipt',style:'PA-1',colour:'Red',size:'20',qty:5,date:'2026-06-01',reference:'same-ref'};
 const b={type:'Production receipt',style:'PA-2',colour:'Blue',size:'22',qty:7,date:'2026-06-02',reference:'same-ref'};
 const forward=ledger.normalizeGarmentRows([a,b]).map(x=>x.record.movementId).sort();
 const reversed=ledger.normalizeGarmentRows([b,a]).map(x=>x.record.movementId).sort();
 assert.deepEqual(forward,reversed);
 assert.notEqual(ledger.normalizeGarmentRows([a])[0].record.movementId,ledger.normalizeGarmentRows([b])[0].record.movementId);
});

test('material rows reject missing item, missing unit, invalid quantity and unknown direction',()=>{
 const out=ledger.normalizeMaterialRows([
  {id:'m1',item:'',unit:'Kg',direction:'IN',qty:1},
  {id:'m2',item:'Thread',unit:'',direction:'IN',qty:1},
  {id:'m3',item:'Thread',unit:'Kg',direction:'IN',qty:0},
  {id:'m4',item:'Thread',unit:'Kg',direction:'SIDEWAYS',qty:1}
 ]);
 assert.deepEqual(out.map(x=>x.ok),[false,false,false,false]);
});

test('duplicate audit is based on stable movement IDs, not shared references',()=>{
 const report=ledger.preview([
  {id:'same',reference:'REF-1',type:'Production receipt',style:'PA-1',colour:'Red',size:'20',qty:4},
  {id:'same',reference:'REF-2',type:'Production receipt',style:'PA-1',colour:'Blue',size:'22',qty:2}
 ],[]);
 assert.equal(report.duplicates.length,1);
 assert.equal(report.duplicates[0].movementId,'LEGACY-GARMENT:garment:same');
});

test('keeps existing item-name compatibility and units separate',()=>{
 const rows=ledger.normalizeMaterialRows([
  {id:'m1',item:'Cotton Fabric',unit:'Meters',direction:'IN',qty:12},
  {id:'m2',item:'Cotton Fabric',itemId:'MAT-01',unit:'Meters',direction:'IN',qty:8},
  {id:'m3',item:'Cotton Fabric',unit:'Rolls',direction:'IN',qty:2}
 ]).map(x=>x.record);
 assert.equal(ledger.balance(rows,{domain:'material',itemName:'Cotton Fabric',unit:'Meters'}),20);
 assert.equal(ledger.balance(rows,{domain:'material',itemId:'MAT-01',unit:'Meters'}),8);
 assert.equal(ledger.balance(rows,{domain:'material',itemName:'Cotton Fabric',unit:'Rolls'}),2);
});
