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

test('production acceptance requires packed good output and exact QC stock receipt',()=>{
 const orders=[{id:'MO-A',style:'PA-A',qty:10}],stages=['Packing'],routes=[{id:'P1',orderId:'MO-A',stage:'Packing',worker:'Pack team',date:'2026-11-26',qtyIn:10,good:5,rejected:2,rework:1}],qc=[{id:'Q1',moId:'MO-A',style:'PA-A',colour:'Navy',size:'24',accepted:4,receiptRef:'PA-QC:Q1'}],stock=[{id:'S1',type:'Production receipt',status:'posted',reference:'PA-QC:Q1',qty:4,style:'PA-A',colour:'Navy',size:'24'}];
 const a=context.paFProductionAcceptanceAudit(orders,stages,routes,qc,stock).orders[0];
 assert.equal(a.packedGood,5);assert.equal(a.verifiedAccepted,4);assert.equal(a.issues.length,0);
});
test('production acceptance blocks QC quantities above packed good output',()=>{
 const orders=[{id:'MO-B',qty:10}],stages=['Packing'],routes=[{id:'P1',orderId:'MO-B',stage:'Packing',worker:'Pack team',date:'2026-11-26',qtyIn:10,good:3,rejected:0,rework:0}],qc=[{id:'Q1',moId:'MO-B',style:'PA-B',colour:'Navy',size:'24',accepted:4,receiptRef:'PA-QC:Q1'}],stock=[{type:'Production receipt',status:'posted',reference:'PA-QC:Q1',qty:4,style:'PA-B',colour:'Navy',size:'24'}];
 const a=context.paFProductionAcceptanceAudit(orders,stages,routes,qc,stock).orders[0];
 assert.equal(a.verifiedAccepted,0);assert.ok(a.issues.some(x=>x.type==='qc-accepted-exceeds-packed'));
});
test('production acceptance excludes QC batches without an exact posted receipt',()=>{
 const orders=[{id:'MO-C',qty:10}],stages=['Packing'],routes=[{id:'P1',orderId:'MO-C',stage:'Packing',worker:'Pack team',date:'2026-11-26',qtyIn:10,good:8,rejected:0,rework:0}],qc=[{id:'Q1',moId:'MO-C',style:'PA-C',colour:'Navy',size:'24',accepted:4,receiptRef:'PA-QC:Q1'}];
 const a=context.paFProductionAcceptanceAudit(orders,stages,routes,qc,[]).orders[0];
 assert.equal(a.verifiedAccepted,0);assert.ok(a.issues.some(x=>x.type==='qc-receipt-reconciliation'));
});
test('production cost per accepted garment uses only verified QC receipt quantity',()=>{
 const costs={orders:[{moId:'MO-A',knownTotal:240,complete:true}]},acceptance={orders:[{moId:'MO-A',packedGood:8,verifiedAccepted:6,acceptedOutputCostReady:true}]};
 assert.equal(context.paFProductionAcceptedCost(costs,acceptance)[0].costPerVerifiedAcceptedPiece,40);
 acceptance.orders[0].acceptedOutputCostReady=false;
 assert.equal(context.paFProductionAcceptedCost(costs,acceptance)[0].costPerVerifiedAcceptedPiece,null);
});

test('variant production acceptance isolates packing and QC by size and colour',()=>{
 const orders=[{id:'MO-V',style:'PA-V',colour:'Navy',sizes:'20:6,22:4',qty:10}],stages=['Packing'],routes=[{id:'P20',orderId:'MO-V',stage:'Packing',size:'20',colour:'Navy',worker:'Pack',date:'2026-11-26',qtyIn:6,good:5,rejected:1,rework:0},{id:'P22',orderId:'MO-V',stage:'Packing',size:'22',colour:'Navy',worker:'Pack',date:'2026-11-26',qtyIn:4,good:4,rejected:0,rework:0}],qc=[{id:'Q20',moId:'MO-V',style:'PA-V',colour:'Navy',size:'20',accepted:5,receiptRef:'R20'},{id:'Q22',moId:'MO-V',style:'PA-V',colour:'Navy',size:'22',accepted:3,receiptRef:'R22'}],stock=[{type:'Production receipt',status:'posted',reference:'R20',qty:5,style:'PA-V',colour:'Navy',size:'20'},{type:'Production receipt',status:'posted',reference:'R22',qty:3,style:'PA-V',colour:'Navy',size:'22'}];
 const a=context.paFProductionVariantAcceptanceAudit(orders,stages,routes,qc,stock).orders[0];assert.equal(a.packedBySize['20'],5);assert.equal(a.packedBySize['22'],4);assert.equal(a.verifiedBySize['20'],5);assert.equal(a.verifiedBySize['22'],3);assert.equal(a.issues.length,0);
});
test('variant production acceptance blocks size substitution even when MO total is within capacity',()=>{
 const orders=[{id:'MO-W',style:'PA-W',colour:'Navy',sizes:'20:6,22:4',qty:10}],stages=['Packing'],routes=[{id:'P20',orderId:'MO-W',stage:'Packing',size:'20',colour:'Navy',worker:'Pack',date:'2026-11-26',qtyIn:6,good:6,rejected:0,rework:0},{id:'P22',orderId:'MO-W',stage:'Packing',size:'22',colour:'Navy',worker:'Pack',date:'2026-11-26',qtyIn:4,good:0,rejected:4,rework:0}],qc=[{id:'Q22',moId:'MO-W',style:'PA-W',colour:'Navy',size:'22',accepted:1,receiptRef:'RW'}],stock=[{type:'Production receipt',status:'posted',reference:'RW',qty:1,style:'PA-W',colour:'Navy',size:'22'}];
 const a=context.paFProductionVariantAcceptanceAudit(orders,stages,routes,qc,stock).orders[0];assert.ok(a.issues.some(x=>x.type==='variant-qc-accepted-exceeds-packed'));assert.equal(a.verifiedBySize['22'],0);
});
test('variant production acceptance flags legacy unallocated routing entries',()=>{
 const orders=[{id:'MO-X',style:'PA-X',colour:'Navy',sizes:'20:2',qty:2}],routes=[{id:'P',orderId:'MO-X',stage:'Packing',worker:'Pack',date:'2026-11-26',qtyIn:2,good:2,rejected:0,rework:0}];
 const a=context.paFProductionVariantAcceptanceAudit(orders,['Packing'],routes,[],[]).orders[0];assert.ok(a.issues.some(x=>x.type==='routing-size-missing'));assert.equal(a.verifiedBySize['20'],0);
});

test('multi-colour size matrix reconciles packing and QC by exact colour-size',()=>{const orders=[{id:'MO-M',style:'PA-M',qty:4,variantPlan:'Navy|20:2; Peach|20:2'}],routes=[{id:'a',orderId:'MO-M',stage:'Packing',colour:'Navy',size:'20',worker:'P',date:'2026-11-26',qtyIn:2,good:2,rejected:0,rework:0},{id:'b',orderId:'MO-M',stage:'Packing',colour:'Peach',size:'20',worker:'P',date:'2026-11-26',qtyIn:2,good:2,rejected:0,rework:0}],qc=[{id:'q1',moId:'MO-M',style:'PA-M',colour:'Navy',size:'20',accepted:2,receiptRef:'r1'},{id:'q2',moId:'MO-M',style:'PA-M',colour:'Peach',size:'20',accepted:2,receiptRef:'r2'}],stock=[{type:'Production receipt',status:'posted',reference:'r1',qty:2,style:'PA-M',colour:'Navy',size:'20'},{type:'Production receipt',status:'posted',reference:'r2',qty:2,style:'PA-M',colour:'Peach',size:'20'}];const a=context.paFProductionVariantAcceptanceAudit(orders,['Packing'],routes,qc,stock).orders[0];assert.equal(a.verifiedByVariant['navy¦20'],2);assert.equal(a.verifiedByVariant['peach¦20'],2);assert.equal(a.issues.length,0);});
test('multi-colour matrix blocks cross-colour substitution',()=>{const orders=[{id:'MO-N',style:'PA-N',qty:4,variantPlan:'Navy|20:2; Peach|20:2'}],routes=[{id:'a',orderId:'MO-N',stage:'Packing',colour:'Navy',size:'20',worker:'P',date:'2026-11-26',qtyIn:2,good:2,rejected:0,rework:0},{id:'b',orderId:'MO-N',stage:'Packing',colour:'Peach',size:'20',worker:'P',date:'2026-11-26',qtyIn:2,good:0,rejected:2,rework:0}],qc=[{id:'q',moId:'MO-N',colour:'Peach',size:'20',accepted:1,receiptRef:'r'}],stock=[{type:'Production receipt',status:'posted',reference:'r',qty:1,style:'PA-N',colour:'Peach',size:'20'}];const a=context.paFProductionVariantAcceptanceAudit(orders,['Packing'],routes,qc,stock).orders[0];assert.ok(a.issues.some(x=>x.type==='variant-qc-accepted-exceeds-packed'));assert.equal(a.verifiedByVariant['peach¦20'],0);});
test('multi-colour matrix total must equal MO quantity',()=>{const a=context.paFProductionVariantAcceptanceAudit([{id:'MO-O',qty:5,variantPlan:'Navy|20:2; Peach|20:2'}],['Packing'],[],[],[]).orders[0];assert.ok(a.issues.some(x=>x.type==='variant-plan-total-mismatch'));});

test('variant material plan aggregates size demand across colours and rejects duplicate cells',()=>{const a=context.paFProductionVariantMaterialPlan({id:'MO-MAT',qty:9,variantPlan:'Navy|20:2,22:3; Peach|20:4'});assert.equal(a.valid,true);assert.equal(a.qtyBySize['20'],6);assert.equal(a.qtyBySize['22'],3);assert.equal(a.total,9);const b=context.paFProductionVariantMaterialPlan({qty:5,variantPlan:'Navy|20:2; navy|20:3'});assert.equal(b.valid,false);assert.ok(b.issues.some(x=>x.includes('Duplicate')));});

test('variant manufacturing costs reconcile separately by colour and size',()=>{
 const orders=[{id:'MO-COST',qty:3,variants:[{colour:'Navy',size:'20',qty:1},{colour:'Peach',size:'20',qty:2}]}];
 const cuts=[{moId:'MO-COST',rollId:'R1',garmentColour:'Navy',size:'20',used:1},{moId:'MO-COST',rollId:'R1',garmentColour:'Peach',size:'20',used:2}];
 const trims=[{orderId:'MO-COST',itemId:'T1',garmentColour:'Navy',size:'20',kind:'OUT',qty:2},{orderId:'MO-COST',itemId:'T1',garmentColour:'Peach',size:'20',kind:'OUT',qty:3}];
 const jobs=[{id:'J1',mo:'MO-COST',colour:'Navy',size:'20'},{id:'J2',mo:'MO-COST',colour:'Peach',size:'20'}],jobCosts=[{jobId:'J1',amount:20},{jobId:'J2',amount:40}];
 const rates=[{moId:'MO-COST',materialType:'Fabric',materialId:'R1',rate:10},{moId:'MO-COST',materialType:'Accessory',materialId:'T1',rate:5}],extra=[{moId:'MO-COST',amount:90}],k1=context.paFVariantKey('Navy','20'),k2=context.paFVariantKey('Peach','20');
 const acceptance={orders:[{moId:'MO-COST',verifiedByVariant:{[k1]:1,[k2]:2},issues:[]}]};
 const out=context.paFProductionVariantCostAudit(orders,cuts,trims,jobs,jobCosts,rates,extra,acceptance)[0];
 assert.equal(out.knownTotal,205);assert.equal(out.variants.find(x=>x.colour==='Navy').knownTotal,70);assert.equal(out.variants.find(x=>x.colour==='Peach').knownTotal,135);
 assert.equal(out.variants.find(x=>x.colour==='Navy').costPerVerifiedAcceptedPiece,70);assert.equal(out.variants.find(x=>x.colour==='Peach').costPerVerifiedAcceptedPiece,67.5);
});
test('variant costing blocks unallocated material movements',()=>{
 const orders=[{id:'MO-MISS',qty:1,variants:[{colour:'Navy',size:'20',qty:1}]}],acceptance={orders:[{moId:'MO-MISS',verifiedByVariant:{'navy¦20':1},issues:[]}]};
 const out=context.paFProductionVariantCostAudit(orders,[{moId:'MO-MISS',rollId:'R1',used:2}],[],[],[],[{moId:'MO-MISS',materialType:'Fabric',materialId:'R1',rate:10}],[],acceptance)[0];
 assert.ok(out.variants[0].issues.some(x=>x.type==='fabric-cost-unallocated'));assert.equal(out.variants[0].costPerVerifiedAcceptedPiece,null);
});

test('BOM component demand filters exact garment colour and size',()=>{
 const mo={id:'MO-BOM',qty:9,variants:[{colour:'Navy',size:'20',qty:2},{colour:'Navy',size:'22',qty:3},{colour:'Peach',size:'20',qty:4}]};
 assert.equal(context.paFProductionBomVariantQuantity({size:'20'},mo).qty,6);
 assert.equal(context.paFProductionBomVariantQuantity({garmentColour:'Navy',size:'20'},mo).qty,2);
 assert.equal(context.paFProductionBomVariantQuantity({garmentColour:'Peach'},mo).qty,4);
 assert.equal(context.paFProductionBomVariantQuantity({garmentColour:'Black',size:'20'},mo).valid,false);
});

test('variant material audit reconciles fabric used and accessory net issue per exact cell',()=>{
 const mo={id:'MO-USE',qty:3,variants:[{colour:'Navy',size:'20',qty:1},{colour:'Peach',size:'20',qty:2}]};
 const bom=[{kind:'Fabric',code:'F-1',colour:'Ivory',perPiece:1, wastePct:10},{kind:'Accessory',itemId:'T-1',perPiece:2}];
 const cuts=[{moId:'MO-USE',rollId:'R-1',garmentColour:'Navy',size:'20',issued:1.1,used:1,wastage:.1,returned:0},{moId:'MO-USE',rollId:'R-1',garmentColour:'Peach',size:'20',issued:2.2,used:2,wastage:.2,returned:0}];
 const trims=[{orderId:'MO-USE',itemId:'T-1',garmentColour:'Navy',size:'20',kind:'OUT',qty:3},{orderId:'MO-USE',itemId:'T-1',garmentColour:'Navy',size:'20',kind:'IN',qty:1},{orderId:'MO-USE',itemId:'T-1',garmentColour:'Peach',size:'20',kind:'OUT',qty:4}];
 const out=context.paFProductionVariantMaterialConsumptionAudit([mo],bom,cuts,trims,[{id:'R-1',code:'F-1',colour:'Ivory'}],[{id:'T-1',code:'BTN'}])[0];
 const navy=out.variants.find(v=>v.colour==='Navy').components,peach=out.variants.find(v=>v.colour==='Peach').components;
 assert.equal(navy[0].actualRecorded,1.1);assert.equal(navy[0].variance,0);assert.equal(navy[1].netIssued,2);assert.equal(navy[1].variance,0);
 assert.equal(peach[0].actualRecorded,2.2);assert.equal(peach[1].netIssued,4);
});
test('variant material audit never allocates untagged issues or treats fabric issue as consumption',()=>{
 const mo={id:'MO-UNTAG',qty:1,variants:[{colour:'Navy',size:'20',qty:1}]},bom=[{kind:'Fabric',code:'F',perPiece:1}];
 const out=context.paFProductionVariantMaterialConsumptionAudit([mo],bom,[{moId:'MO-UNTAG',rollId:'R',issued:1,returned:0}],[],[{id:'R',code:'F'}],[])[0];
 assert.ok(out.issues.some(x=>x.type==='unallocated-fabric-movement'));
 assert.equal(out.variants[0].components[0].actualRecorded,null);
 assert.equal(out.variants[0].components[0].status,'REVIEW');
});
test('variant material audit flags missing roll mapping and does not cross-allocate colours',()=>{
 const mo={id:'MO-MAP',qty:2,variants:[{colour:'Navy',size:'20',qty:1},{colour:'Peach',size:'20',qty:1}]},bom=[{kind:'Fabric',code:'F',perPiece:1}];
 const out=context.paFProductionVariantMaterialConsumptionAudit([mo],bom,[{moId:'MO-MAP',rollId:'R1',garmentColour:'Navy',size:'20',issued:1,used:1},{moId:'MO-MAP',rollId:'R2',garmentColour:'Peach',size:'20',issued:1,used:1}],[],[{id:'R1',code:'F'}],[])[0];
 assert.equal(out.variants.find(v=>v.colour==='Navy').components[0].actualRecorded,1);
 assert.ok(out.variants.find(v=>v.colour==='Peach').components[0].issues.some(x=>x.includes('No fabric roll')));
});

test('variant movement guard blocks over-cutting and keeps colour-size quantities separate',()=>{
 const mo={id:'MO-CUT-GUARD',qty:5,variants:[{colour:'Navy',size:'20',qty:2},{colour:'Peach',size:'20',qty:3}]};
 const existing=[{orderId:'MO-CUT-GUARD',garmentColour:'Navy',size:'20',pieces:1},{orderId:'MO-CUT-GUARD',garmentColour:'Peach',size:'20',pieces:2}];
 const navy=context.paFProductionVariantMovementCheck(mo,'Navy','20',1,existing);
 assert.equal(navy.valid,true);assert.equal(navy.remaining,1);
 const over=context.paFProductionVariantMovementCheck(mo,'Navy','20',2,existing);
 assert.equal(over.valid,false);assert.equal(over.remaining,1);
 const peach=context.paFProductionVariantMovementCheck(mo,'Peach','20',1,existing);
 assert.equal(peach.valid,true);assert.equal(peach.remaining,1);
});
test('variant movement guard rejects missing or unknown garment colour-size cells',()=>{
 const mo={id:'MO-CUT-GUARD2',qty:2,variants:[{colour:'Navy',size:'20',qty:2}]};
 assert.equal(context.paFProductionVariantMovementCheck(mo,'','20',1,[]).valid,false);
 assert.equal(context.paFProductionVariantMovementCheck(mo,'Peach','20',1,[]).valid,false);
 assert.equal(context.paFProductionVariantMovementCheck(mo,'Navy','20',0,[]).valid,false);
});

test('cutting handover audit reconciles plan, cut output, cutting good and stitching handover by variant',()=>{
 const mo={id:'MO-HAND',qty:5,variants:[{colour:'Navy',size:'20',qty:2},{colour:'Peach',size:'20',qty:3}]};
 const cuts=[{id:'C1',moId:'MO-HAND',garmentColour:'Navy',size:'20',pieces:2,issued:2.2,used:2,wastage:.1,returned:.1},{id:'C2',moId:'MO-HAND',garmentColour:'Peach',size:'20',pieces:3,issued:3.3,used:3,wastage:.2,returned:.1}];
 const routes=[{orderId:'MO-HAND',stage:'Cutting',colour:'Navy',size:'20',good:2,rejected:0,rework:0},{orderId:'MO-HAND',stage:'Cutting',colour:'Peach',size:'20',good:3,rejected:0,rework:0},{orderId:'MO-HAND',stage:'Stitching',colour:'Navy',size:'20',qtyIn:1},{orderId:'MO-HAND',stage:'Stitching',colour:'Peach',size:'20',qtyIn:3}];
 const out=context.paFProductionCuttingHandoverAudit([mo],cuts,routes)[0];
 const navy=out.variants.find(v=>v.colour==='Navy'),peach=out.variants.find(v=>v.colour==='Peach');
 assert.equal(navy.cutPieces,2);assert.equal(navy.cuttingGood,2);assert.equal(navy.stitchingHandover,1);assert.equal(navy.unhandedGood,1);assert.equal(navy.fabricWastage,.1);
 assert.equal(peach.unhandedGood,0);assert.equal(peach.fabricUsed,3);
 assert.equal(out.issues.length,0);
});
test('cutting handover audit flags overcut, missing cut batch and excess stitching handover',()=>{
 const mo={id:'MO-HAND-ERR',qty:2,variants:[{colour:'Navy',size:'20',qty:2}]};
 const out=context.paFProductionCuttingHandoverAudit([mo],[{moId:'MO-HAND-ERR',garmentColour:'Navy',size:'20',pieces:3}],[{orderId:'MO-HAND-ERR',stage:'Cutting',colour:'Navy',size:'20',good:4},{orderId:'MO-HAND-ERR',stage:'Stitching',colour:'Navy',size:'20',qtyIn:5}])[0];
 assert.ok(out.variants[0].issues.some(x=>x.includes('exceed planned')));
 assert.ok(out.variants[0].issues.some(x=>x.includes('exceeds recorded cut-batch')));
 assert.ok(out.variants[0].issues.some(x=>x.includes('Stitching handover exceeds')));
});
test('cutting handover audit leaves untagged legacy batches unallocated',()=>{
 const mo={id:'MO-HAND-OLD',qty:1,variants:[{colour:'Navy',size:'20',qty:1}]};
 const out=context.paFProductionCuttingHandoverAudit([mo],[{moId:'MO-HAND-OLD',pieces:1} ],[])[0];
 assert.ok(out.issues.some(x=>x.type==='unallocated-cut-batch'));
 assert.equal(out.variants[0].cutPieces,0);
});

test('stitching-finishing audit reconciles worker output and downstream handovers per variant',()=>{
 const mo={id:'MO-SF',qty:4,variants:[{colour:'Navy',size:'20',qty:2},{colour:'Peach',size:'20',qty:2}]};
 const routes=[
  {orderId:'MO-SF',stage:'Stitching',colour:'Navy',size:'20',qtyIn:2,good:2,rejected:0,rework:0},
  {orderId:'MO-SF',stage:'Stitching',colour:'Peach',size:'20',qtyIn:2,good:1,rejected:0,rework:1},
  {orderId:'MO-SF',stage:'Finishing',colour:'Navy',size:'20',qtyIn:1,good:1,rejected:0,rework:0},
  {orderId:'MO-SF',stage:'Finishing',colour:'Peach',size:'20',qtyIn:1,good:1,rejected:0,rework:0},
  {orderId:'MO-SF',stage:'Ironing',colour:'Navy',size:'20',qtyIn:1},
  {orderId:'MO-SF',stage:'Stitching',colour:'Peach',size:'20',qtyIn:1,good:1,rework:0,reworkOfId:'R1'}
 ];
 const out=context.paFProductionStitchingFinishingAudit([mo],routes)[0],navy=out.variants.find(v=>v.colour==='Navy'),peach=out.variants.find(v=>v.colour==='Peach');
 assert.equal(navy.goodAwaitingFinishing,1);assert.equal(navy.goodAwaitingIroning,0);
 assert.equal(peach.stitchingRework,1);assert.equal(peach.goodAwaitingFinishing,0);
 assert.equal(out.issues.length,0);
});
test('stitching-finishing audit flags over-handover and excess stage output',()=>{
 const mo={id:'MO-SF-ERR',qty:2,variants:[{colour:'Navy',size:'20',qty:2}]};
 const out=context.paFProductionStitchingFinishingAudit([mo],[
  {orderId:'MO-SF-ERR',stage:'Stitching',colour:'Navy',size:'20',qtyIn:2,good:3},
  {orderId:'MO-SF-ERR',stage:'Finishing',colour:'Navy',size:'20',qtyIn:4,good:5},
  {orderId:'MO-SF-ERR',stage:'Ironing',colour:'Navy',size:'20',qtyIn:6}
 ])[0];
 assert.ok(out.variants[0].issues.some(x=>x.includes('Stitching good output exceeds')));
 assert.ok(out.variants[0].issues.some(x=>x.includes('Finishing input exceeds')));
 assert.ok(out.variants[0].issues.some(x=>x.includes('Finishing good output exceeds')));
 assert.ok(out.variants[0].issues.some(x=>x.includes('Ironing input exceeds')));
});
test('stitching-finishing audit leaves legacy untagged production rows unallocated',()=>{
 const mo={id:'MO-SF-OLD',qty:1,variants:[{colour:'Navy',size:'20',qty:1}]};
 const out=context.paFProductionStitchingFinishingAudit([mo],[{orderId:'MO-SF-OLD',stage:'Stitching',qtyIn:1,good:1}])[0];
 assert.ok(out.issues.some(x=>x.type==='unallocated-stage-entry'));
 assert.equal(out.variants[0].stitchingGood,0);
});
