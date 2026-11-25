'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const audit=require('../dispatch-audit.js');

const invoice={id:'INV-1',items:[
 {designNumber:'PA-101',colour:'Peach',size:'20',qty:5},
 {itemNumber:'PA-102',colour:'Blue',size:'22',qty:3}
]};
const full={id:'D-1',invoiceId:'INV-1',stockPostingStatus:'posted'};
const row=(id,reference,qty,style='PA-101',colour='Peach',size='20')=>({id,reference,type:'Dispatch / sale issue',qty,style,colour,size});

test('accepts correctly posted full-invoice dispatch lines',()=>{
 const result=audit.auditDispatches([full],[invoice],[row('s1','DSP:D-1:0',5),row('s2','DSP:D-1:1',3,'PA-102','Blue','22')]);
 assert.equal(result.ok,true);assert.equal(result.expectedIssues,2);assert.deepEqual(result.issues,[]);
});
test('flags missing, duplicate and mismatched stock issue rows',()=>{
 const result=audit.auditDispatches([full],[invoice],[row('s1','DSP:D-1:0',4),row('s2','DSP:D-1:0',5),row('s3','DSP:D-1:1',3,'WRONG','Blue','22')]);
 assert.deepEqual(result.issues.map(x=>x.code),['duplicate-stock-issue','stock-issue-mismatch']);
});
test('audits partial dispatch using selected invoice line indexes and quantities',()=>{
 const partial={id:'D-2',invoiceId:'INV-1',stockPostingStatus:'posted',items:[{itemIndex:1,qty:2}]};
 const result=audit.auditDispatches([partial],[invoice],[row('s1','DSP:D-2:1',2,'PA-102','Blue','22')]);
 assert.equal(result.ok,true);assert.equal(result.expectedIssues,1);
});
test('flags orphan rows, missing invoices and legacy-unverified dispatches',()=>{
 const result=audit.auditDispatches([
  {id:'D-3',invoiceId:'missing',stockPostingStatus:'posted'},
  {id:'D-4',invoiceId:'INV-1',stockPostingStatus:'legacy-unverified'}
 ],[invoice],[row('s1','DSP:OLD:0',1)]);
 assert.deepEqual(result.issues.map(x=>x.code),['missing-invoice','legacy-unverified','orphan-stock-issue']);
});
test('does not mutate supplied records',()=>{
 const dispatches=[full],stock=[row('s1','DSP:D-1:0',5)];
 const before=JSON.stringify([dispatches,stock]);
 audit.auditDispatches(dispatches,[invoice],stock);
 assert.equal(JSON.stringify([dispatches,stock]),before);
});
