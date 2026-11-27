'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('../backup-core.js');

function memoryStorage(seed={}){
 const data=new Map(Object.entries(seed));
 return {
  getItem:key=>data.has(key)?data.get(key):null,
  setItem(key,value){data.set(String(key),String(value));},
  removeItem:key=>data.delete(key),
  keys:()=>[...data.keys()],
  snapshot:()=>Object.fromEntries(data)
 };
}

test('backup export key list and restore whitelist stay compatible',()=>{
 const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const match=source.match(/function backupKeys\(\)\{([\s\S]*?)\}\s*function downloadBusinessBackup/);
 assert.ok(match,'backupKeys function must remain discoverable for compatibility testing');
 const sandbox={localStorage:{getItem:()=>null},ARK:'pa_ar_receipts_v1',ACK:'pa_ar_credits_v1',AHK:'pa_ar_reminders_v1',AOK:'pa_ar_opening_v1',ANCK:'pa_ar_credit_notes_v1',ASCK:'pa_ar_status_v1'};
 vm.runInNewContext(match[0].replace(/\s*function downloadBusinessBackup[\s\S]*/,'')+';globalThis.keys=backupKeys();',sandbox);
 const restoreStart=source.indexOf('function restoreBusinessBackup');
 const restoreEnd=source.indexOf('\n\nfunction styleCosts',restoreStart);
 const restore=source.slice(restoreStart,restoreEnd);
 const allowedMatch=restore.match(/const allowed=\[(.*?)\],entries=/s);
 assert.ok(allowedMatch,'restore allowlist must remain discoverable');
 const literals=[...allowedMatch[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
 for(const key of sandbox.keys){
  if(key.startsWith('pa_invoice_seq_'))assert.match(key,/^pa_invoice_seq_\d{2}-\d{2}$/);
  else assert.ok(literals.includes(key),'exported key missing from restore allowlist: '+key);
 }
});

test('backup export keys preserve invoice counters and production route history',()=>{
 const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
 const match=source.match(/function backupKeys\(\)\{([\s\S]*?)\}\s*function downloadBusinessBackup/);
 assert.ok(match);
 assert.match(match[0],/pa_invoice_seq_/);
 assert.match(match[0],/pa_production_route_entries_v1/);
});

test('restore applies a valid snapshot and replaces only registered business keys',()=>{
 const storage=memoryStorage({pa_orders:'old-orders',pa_tax_invoices:'old-invoices',unrelated_preference:'keep'});
 const entries=[['pa_orders','[]'],['pa_tax_invoices','[]'],['pa_invoice_seq_26-27','12']];
 core.applyBackupEntries(storage,entries,['pa_orders','pa_tax_invoices','pa_invoice_seq_26-27']);
 assert.deepEqual(storage.snapshot(),{unrelated_preference:'keep',pa_orders:'[]',pa_tax_invoices:'[]','pa_invoice_seq_26-27':'12'});
});

test('failed storage write rolls back every touched key',()=>{
 let calls=0;
 const base=memoryStorage({pa_orders:'before',pa_tax_invoices:'before-invoices',pa_invoice_seq_26-27:'7'});
 const storage={
  getItem:key=>base.getItem(key),
  removeItem:key=>base.removeItem(key),
  setItem(key,value){calls++;if(calls===2)throw new Error('simulated quota failure');base.setItem(key,value);}
 };
 assert.throws(()=>core.applyBackupEntries(storage,[['pa_orders','after'],['pa_tax_invoices','after-invoices']],['pa_orders','pa_tax_invoices']),/simulated quota failure/);
 assert.deepEqual(base.snapshot(),{pa_orders:'before',pa_tax_invoices:'before-invoices',pa_invoice_seq_26-27:'7'});
});

test('malformed restore entries are rejected and existing data is retained',()=>{
 const storage=memoryStorage({pa_orders:'safe'});
 assert.throws(()=>core.applyBackupEntries(storage,[['pa_orders',{}]],['pa_orders']),/Invalid backup entry/);
 assert.equal(storage.getItem('pa_orders'),'safe');
});
