'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const store = new Map();
const context = vm.createContext({
  localStorage: {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key)
  },
  alert: () => {},
  confirm: () => true,
  prompt: () => '0',
  console
});
vm.runInContext(fs.readFileSync('fulfilment-quantity.js', 'utf8'), context, { filename: 'fulfilment-quantity.js' });

function put(key, value) { store.set(key, JSON.stringify(value)); }
function reset() { store.clear(); }

test('stock balance subtracts dispatch and adjustments, and excludes quarantined returns', () => {
  const rows = [
    { style: 'D100', colour: 'Navy', size: '20', qty: 200, type: 'Production receipt' },
    { style: 'D100', colour: 'Navy', size: '20', qty: 30, type: 'Dispatch / sale issue' },
    { style: 'D100', colour: 'Navy', size: '20', qty: 20, type: 'Stock adjustment out' },
    { style: 'D100', colour: 'Navy', size: '20', qty: 10, type: 'Customer return', status: 'quarantine' },
    { style: 'D100', colour: 'Navy', size: '20', qty: 5, type: 'Customer return', status: 'released' }
  ];
  assert.equal(context.paFStockBalance(rows, 'd100¦navy¦20'), 155);
});

test('open approved packing reservations are reduced only by linked posted dispatch stock issues', () => {
  reset();
  put('pa_packing_slips_v1', [
    { id: 'PS-1', orderId: 'SO-1', status: 'approved', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 120 }] },
    { id: 'PS-DRAFT', orderId: 'SO-2', status: 'draft', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 50 }] }
  ]);
  put('pa_tax_invoices', [{ id: 'INV-1', packing_slip_id: 'PS-1', status: 'issued' }]);
  put('pa_garment_stock_ledger_v1', [
    { type: 'Dispatch / sale issue', dispatchId: 'DSP-1', invoiceId: 'INV-1', itemNumber: 'D100', colour: 'Navy', size: '20', qty: 20 }
  ]);
  const reservations = context.paFReservations('SO-2');
  const held = reservations.get('d100¦navy¦20');
  assert.equal(held.total, 100);
  assert.equal(held.otherOrders, 100);
  assert.equal(held.currentOrder, 0);
});

test('available-to-reserve is physical saleable stock less other orders reservations, variant by variant', () => {
  reset();
  put('pa_packing_slips_v1', [
    { id: 'PS-1', orderId: 'SO-1', status: 'approved', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 120 }] }
  ]);
  put('pa_tax_invoices', []);
  put('pa_garment_stock_ledger_v1', [
    { type: 'Production receipt', itemNumber: 'D100', colour: 'Navy', size: '20', qty: 150 },
    { type: 'Production receipt', itemNumber: 'D100', colour: 'Navy', size: '22', qty: 40 }
  ]);
  const reservations = context.paFReservations('SO-2');
  const navy20 = context.paFAvailableToReserve({ itemNumber: 'D100', colour: 'Navy', size: '20' }, 'SO-2', context.paFStockRows(), reservations);
  const navy22 = context.paFAvailableToReserve({ itemNumber: 'D100', colour: 'Navy', size: '22' }, 'SO-2', context.paFStockRows(), reservations);
  assert.equal(navy20.physical, 150);
  assert.equal(navy20.otherOrders, 120);
  assert.equal(navy20.free, 30);
  assert.equal(navy22.free, 40);
});


test('dispatch reservation validation counts issues across every invoice linked to the same packing slip', () => {
  reset();
  put('pa_packing_slips_v1', [
    { id: 'PS-1', number: 'PA-PS-1', orderId: 'SO-1', status: 'approved', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 100 }] }
  ]);
  put('pa_tax_invoices', [
    { id: 'INV-1', packing_slip_id: 'PS-1', status: 'issued', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 60 }] },
    { id: 'INV-2', packing_slip_id: 'PS-1', status: 'issued', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 40 }] }
  ]);
  put('pa_garment_stock_ledger_v1', [
    { type: 'Dispatch / sale issue', dispatchId: 'DSP-1', invoiceId: 'INV-1', itemNumber: 'D100', colour: 'Navy', size: '20', qty: 60 }
  ]);
  assert.equal(context.paFValidateDispatchReservation(
    { id: 'INV-2', packing_slip_id: 'PS-1', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 40 }] },
    { id: 'DSP-2' },
    [{ itemIndex: 0, qty: 40 }]
  ), true);
  assert.equal(context.paFValidateDispatchReservation(
    { id: 'INV-2', packing_slip_id: 'PS-1', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 40 }] },
    { id: 'DSP-3' },
    [{ itemIndex: 0, qty: 41 }]
  ), false);
});

test('dispatch reservation validation rejects fractional, zero, negative and invalid item allocations', () => {
  reset();
  put('pa_packing_slips_v1', [
    { id: 'PS-1', orderId: 'SO-1', status: 'approved', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 10 }] }
  ]);
  put('pa_tax_invoices', [{ id: 'INV-1', packing_slip_id: 'PS-1', status: 'issued', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 10 }] }]);
  for (const allocation of [{ itemIndex: 0, qty: 1.5 }, { itemIndex: 0, qty: 0 }, { itemIndex: 0, qty: -1 }, { itemIndex: 9, qty: 1 }]) {
    assert.equal(context.paFValidateDispatchReservation(
      { id: 'INV-1', packing_slip_id: 'PS-1', items: [{ itemNumber: 'D100', colour: 'Navy', size: '20', qty: 10 }] },
      { id: 'DSP-X' },
      [allocation]
    ), false);
  }
});


test('QC stock audit counts only exact one-to-one accepted batch receipts', () => {
  const qc = [
    { id: 'Q1', moId: 'MO-1', receiptRef: 'PA-QC:1', accepted: 8, style: 'D100', colour: 'Navy', size: '20' },
    { id: 'Q2', moId: 'MO-1', receiptRef: 'PA-QC:2', accepted: 5, style: 'D100', colour: 'Navy', size: '22' },
    { id: 'Q3', moId: 'MO-1', receiptRef: 'PA-QC:3', accepted: 4, style: 'D100', colour: 'Navy', size: '24' }
  ];
  const stock = [
    { type: 'Production receipt', status: 'posted', reference: 'PA-QC:1', qty: 8, style: 'D100', colour: 'Navy', size: '20' },
    { type: 'Production receipt', status: 'posted', reference: 'PA-QC:2', qty: 50, style: 'D100', colour: 'Navy', size: '22' },
    { type: 'Production receipt', status: 'posted', reference: 'PA-QC:QC-MO-1-extra', qty: 99, style: 'D100', colour: 'Navy', size: '24' }
  ];
  const audit = context.paFQcReceiptAudit(qc, stock, ['MO-1']);
  assert.equal(audit.expectedAccepted, 17);
  assert.equal(audit.verifiedAccepted, 8);
  assert.equal(audit.issues.length, 3);
  assert.equal(audit.issues.map(x => x.type).sort().join(','), ['missing-stock-receipt', 'orphan-stock-receipt', 'receipt-mismatch'].sort().join(','));
});

test('QC stock audit ignores other manufacturing orders', () => {
  const audit = context.paFQcReceiptAudit(
    [{ id: 'Q1', moId: 'MO-2', receiptRef: 'PA-QC:2', accepted: 3, style: 'D100', colour: 'Navy', size: '20' }],
    [{ type: 'Production receipt', status: 'posted', reference: 'PA-QC:2', qty: 3, style: 'D100', colour: 'Navy', size: '20' }],
    ['MO-1']
  );
  assert.equal(audit.expectedAccepted, 0);
  assert.equal(audit.verifiedAccepted, 0);
  assert.equal(audit.issues.length, 0);
});


test('job-work audit reconciles cumulative returned pieces without treating them as finished stock', () => {
  const mos = [{ id: 'MO-1', qty: 20, sizes: '20:10, 22:10' }];
  const jobs = [
    { id: 'JW-1', challanNo: 'JW-001', mo: 'MO-1', operation: 'Stitching', size: '20', sent: 8, accepted: 5, rejected: 1, rework: 2, returned: 8 },
    { id: 'JW-2', challanNo: 'JW-002', mo: 'MO-1', operation: 'Stitching', size: '22', sent: 7, accepted: 4, rejected: 1, rework: 1, returned: 6 }
  ];
  const audit = context.paFJobworkAudit(jobs, mos);
  assert.equal(audit.challanCount, 2);
  assert.equal(audit.issues.length, 0);
});

test('job-work audit detects over-return, returned-total mismatch and operation plan excess', () => {
  const mos = [{ id: 'MO-1', qty: 10, sizes: '20:5, 22:5' }];
  const jobs = [
    { id: 'JW-1', challanNo: 'JW-001', mo: 'MO-1', operation: 'Stitching', size: '20', sent: 4, accepted: 3, rejected: 1, rework: 1, returned: 4 },
    { id: 'JW-2', challanNo: 'JW-2', mo: 'MO-1', operation: 'Stitching', size: '20', sent: 3, accepted: 1, rejected: 0, rework: 0, returned: 1 }
  ];
  const types = context.paFJobworkAudit(jobs, mos).issues.map(x => x.type);
  assert.ok(types.includes('invalid-return-quantities'));
  assert.ok(types.includes('returned-total-mismatch'));
  assert.ok(types.includes('sent-exceeds-operation-plan'));
});

test('job-work audit flags challans with missing manufacturing orders and duplicate references', () => {
  const jobs = [
    { id: 'JW-1', challanNo: 'JW-001', mo: 'MO-1', operation: 'Stitching', sent: 2, accepted: 0, rejected: 0, rework: 0 },
    { id: 'JW-1', challanNo: 'JW-001', mo: 'MO-X', operation: 'Stitching', sent: 2, accepted: 0, rejected: 0, rework: 0 }
  ];
  const types = context.paFJobworkAudit(jobs, [{ id: 'MO-1', qty: 5 }]).issues.map(x => x.type);
  assert.ok(types.includes('duplicate-challan-id'));
  assert.ok(types.includes('duplicate-challan-number'));
  assert.ok(types.includes('missing-manufacturing-order'));
});


test('contractor material custody tracks reusable returns, consumption and outstanding quantity', () => {
  const jobs = [{ id: 'JW-1', challanNo: 'JW-001' }];
  const movements = [
    { id: 'MI-1', kind: 'issue', jobId: 'JW-1', itemId: 'FAB-01', item: 'Peach fabric', unit: 'm', qty: 25 },
    { id: 'MR-1', kind: 'reusable-return', issueId: 'MI-1', jobId: 'JW-1', itemId: 'FAB-01', item: 'Peach fabric', unit: 'm', qty: 4 },
    { id: 'MC-1', kind: 'consumed', issueId: 'MI-1', jobId: 'JW-1', itemId: 'FAB-01', item: 'Peach fabric', unit: 'm', qty: 18 },
    { id: 'MS-1', kind: 'scrap', issueId: 'MI-1', jobId: 'JW-1', itemId: 'FAB-01', item: 'Peach fabric', unit: 'm', qty: 1 }
  ];
  const audit = context.paFJobworkMaterialAudit(jobs, movements);
  assert.equal(audit.issueCount, 1);
  assert.equal(audit.issues.length, 0);
  assert.equal(audit.balances[0].returned, 23);
  assert.equal(audit.balances[0].pending, 2);
});

test('contractor material custody flags over-return, mismatched identity and missing source issue', () => {
  const jobs = [{ id: 'JW-1' }];
  const movements = [
    { id: 'MI-1', kind: 'issue', jobId: 'JW-1', itemId: 'TRIM-1', item: 'Buttons', unit: 'pcs', qty: 100 },
    { id: 'MR-1', kind: 'reusable-return', issueId: 'MI-1', jobId: 'JW-1', itemId: 'TRIM-2', item: 'Buttons', unit: 'pcs', qty: 90 },
    { id: 'MC-1', kind: 'consumed', issueId: 'MI-1', jobId: 'JW-1', itemId: 'TRIM-1', item: 'Buttons', unit: 'pcs', qty: 20 },
    { id: 'MX-1', kind: 'scrap', issueId: 'MISSING', jobId: 'JW-1', itemId: 'TRIM-1', item: 'Buttons', unit: 'pcs', qty: 1 }
  ];
  const types = context.paFJobworkMaterialAudit(jobs, movements).issues.map(x => x.type);
  assert.ok(types.includes('material-return-identity-mismatch'));
  assert.ok(types.includes('material-return-exceeds-issue'));
  assert.ok(types.includes('return-without-issue'));
});

test('contractor rework cycles reconcile repeat work against returned rework quantities',()=>{
 const audit=context.paFJobworkReworkAudit([{id:'JW-1',rework:5}],[
  {id:'RW-1',jobId:'JW-1',qty:3,returnedQty:3,outcome:'Rework',date:'2026-11-01',cycleNo:1},
  {id:'RW-2',jobId:'JW-1',parentCycleId:'RW-1',qty:3,returnedQty:3,outcome:'Accepted',date:'2026-11-02',cycleNo:2}
 ]);
 assert.equal(audit.cycleCount,2);assert.equal(audit.open,0);assert.equal(audit.issues.length,0);
});
test('contractor rework audit blocks initial and repeat-cycle quantity excess',()=>{
 const audit=context.paFJobworkReworkAudit([{id:'JW-1',rework:2}],[
  {id:'RW-1',jobId:'JW-1',qty:3,returnedQty:3,outcome:'Rework',cycleNo:1},
  {id:'RW-2',jobId:'JW-1',parentCycleId:'RW-1',qty:4,returnedQty:0,outcome:'Pending',cycleNo:2}
 ]);
 const types=audit.issues.map(x=>x.type);assert.ok(types.includes('rework-cycles-exceed-challan-rework'));assert.ok(types.includes('rework-child-exceeds-parent-return'));
});
test('operation costing flags fractional piece quantities and mismatched amounts',()=>{
 const audit=context.paFOperationCostAudit([{id:'C1',jobId:'JW-1',basis:'per-piece',qty:1.5,rate:10,amount:15},{id:'C2',jobId:'JW-1',basis:'per-lot',qty:1,rate:20,amount:25}],[{id:'JW-1'}]);
 assert.equal(audit.issues.length,2);
});

test('production cost roll-up values fabric used plus wastage and net accessory issues',()=>{
 const r=context.paFProductionCostAudit([{id:'MO-1',style:'PA-1',qty:10}],[{moId:'MO-1',rollId:'R1',used:8,wastage:2,returned:1}],[{orderId:'MO-1',itemId:'A1',kind:'OUT',qty:20},{orderId:'MO-1',itemId:'A1',kind:'IN',qty:2}],[{id:'JW-1',mo:'MO-1'}],[{jobId:'JW-1',amount:50}],[{moId:'MO-1',materialType:'Fabric',materialId:'R1',rate:10},{moId:'MO-1',materialType:'Accessory',materialId:'A1',rate:2}],[{moId:'MO-1',amount:30}]);
 const m=r.orders[0];assert.equal(m.materialTotal,136);assert.equal(m.operationTotal,50);assert.equal(m.extraTotal,30);assert.equal(m.knownTotal,216);assert.equal(m.costPerPlannedPiece,21.6);assert.equal(m.complete,true);
});
test('production costing flags unpriced materials instead of treating them as zero cost',()=>{
 const r=context.paFProductionCostAudit([{id:'MO-2',qty:5}],[{moId:'MO-2',rollId:'R2',used:4,wastage:1}],[],[],[],[],[]);
 assert.equal(r.orders[0].complete,false);assert.equal(r.orders[0].missing.length,1);assert.equal(r.orders[0].costPerPlannedPiece,null);
});
test('production routing accepts sequential stage output and rework returns',()=>{
 const orders=[{id:'MO-RT',style:'PA-RT',qty:10}],stages=['Cutting','Stitching','Finishing'],rows=[
 {id:'R1',orderId:'MO-RT',stage:'Cutting',worker:'A',date:'2026-11-25',qtyIn:10,good:8,rejected:0,rework:2},
 {id:'R2',orderId:'MO-RT',stage:'Cutting',worker:'A',date:'2026-11-25',qtyIn:2,good:1,rejected:1,rework:0,reworkOfId:'R1'},
 {id:'R3',orderId:'MO-RT',stage:'Stitching',worker:'B',date:'2026-11-26',qtyIn:9,good:8,rejected:1,rework:0}
 ];
 const a=context.paFProductionRouteAudit(orders,stages,rows,'2026-11-26');
 assert.equal(a.invalidCount,0);assert.equal(a.orders[0].stages[0].good,9);assert.equal(a.orders[0].stages[0].reworkPending,0);assert.equal(a.orders[0].stages[1].good,8);
});
test('production routing blocks excess upstream quantity, fractional pieces and future dates',()=>{
 const a=context.paFProductionRouteAudit([{id:'MO-RT2',qty:10}],['Cutting','Stitching'],[
 {id:'R1',orderId:'MO-RT2',stage:'Cutting',worker:'A',date:'2026-11-26',qtyIn:10,good:7,rejected:1,rework:2},
 {id:'R2',orderId:'MO-RT2',stage:'Stitching',worker:'B',date:'2026-11-26',qtyIn:8,good:8,rejected:0,rework:0},
 {id:'R3',orderId:'MO-RT2',stage:'Cutting',worker:'C',date:'2026-11-27',qtyIn:0.5,good:0.5,rejected:0,rework:0}
 ],'2026-11-26');
 assert.equal(a.invalidCount,2);assert.ok(a.issues.some(x=>x.id==='R2'&&x.message.includes('available 7')));assert.ok(a.issues.some(x=>x.id==='R3'));
});
test('production routing prevents rework batches from exceeding parent rework balance',()=>{
 const a=context.paFProductionRouteAudit([{id:'MO-RT3',qty:5}],['Cutting'],[
 {id:'R1',orderId:'MO-RT3',stage:'Cutting',worker:'A',date:'2026-11-26',qtyIn:5,good:3,rejected:0,rework:2},
 {id:'R2',orderId:'MO-RT3',stage:'Cutting',worker:'B',date:'2026-11-26',qtyIn:3,good:3,rejected:0,rework:0,reworkOfId:'R1'}
 ],'2026-11-26');
 assert.equal(a.invalidCount,1);assert.ok(a.issues[0].message.includes('rework balance'));
});
