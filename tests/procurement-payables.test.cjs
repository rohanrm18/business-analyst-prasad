'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function extractFunction(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.ok(start >= 0, 'missing source function ' + name);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}
function loadFunctions(path, names, globals = {}) {
  const source = fs.readFileSync(path, 'utf8');
  const context = vm.createContext({ ...globals });
  vm.runInContext(names.map(name => extractFunction(source, name)).join('\n'), context);
  return context;
}
const erp = loadFunctions('erp.js', ['purchaseOrderApprovalValidation', 'grnReceiptValidation'], {
  norm: value => String(value ?? '').trim().toLowerCase()
});
const supplier = loadFunctions('supplier-ledger.js', ['validateAdvanceAllocation']);

const accessory = { id: 'ACC-1' };
const po = {
  id: 'PO-1', status: 'Draft', orderDate: '2026-11-27',
  lines: [
    { code: 'FAB-PEACH', itemType: 'Fabric', qty: 50, rate: 120, gstPct: 5, unit: 'm' },
    { code: 'ACC-BTN', itemType: 'Accessory', itemId: 'ACC-1', qty: 100, rate: 2, gstPct: 5 }
  ]
};

test('supplier PO approval accepts valid fabric and registered accessory lines', () => {
  assert.equal(erp.purchaseOrderApprovalValidation(po, { id: 'SUP-1' }, [accessory]), '');
});
test('supplier PO approval blocks non-draft, empty and invalid material orders', () => {
  assert.match(erp.purchaseOrderApprovalValidation({ ...po, status: 'Approved' }, { id: 'SUP-1' }, [accessory]), /Only a Draft/);
  assert.match(erp.purchaseOrderApprovalValidation({ ...po, lines: [] }, { id: 'SUP-1' }, [accessory]), /at least one material line/);
  assert.match(erp.purchaseOrderApprovalValidation({ ...po, lines: [{ ...po.lines[0], qty: 0 }] }, { id: 'SUP-1' }, [accessory]), /positive quantity/);
  assert.match(erp.purchaseOrderApprovalValidation({ ...po, lines: [{ ...po.lines[1], itemId: 'UNKNOWN' }] }, { id: 'SUP-1' }, [accessory]), /not linked/);
});
test('supplier PO approval requires a fabric unit and whole accessory pieces', () => {
  assert.match(erp.purchaseOrderApprovalValidation({ ...po, lines: [{ ...po.lines[0], unit: '' }] }, { id: 'SUP-1' }, [accessory]), /needs a unit/);
  assert.match(erp.purchaseOrderApprovalValidation({ ...po, lines: [{ ...po.lines[1], qty: 1.5 }] }, { id: 'SUP-1' }, [accessory]), /whole number/);
});
test('GRN accepts only approved purchase orders and valid dates', () => {
  const line = { itemType: 'Fabric', qty: 50 };
  assert.match(erp.grnReceiptValidation({ status: 'Draft' }, line, 10, '2026-11-27', 'ROLL-1', 0, []), /Only an approved/);
  assert.match(erp.grnReceiptValidation({ status: 'Approved' }, line, 10, '27-11-2026', 'ROLL-1', 0, []), /valid goods-received date/);
  assert.equal(erp.grnReceiptValidation({ status: 'Approved' }, line, 10, '2026-11-27', 'ROLL-1', 0, []), '');
});
test('GRN prevents cumulative over-receipt and duplicate fabric roll numbers', () => {
  const line = { itemType: 'Fabric', qty: 50 };
  assert.match(erp.grnReceiptValidation({ status: 'Part received' }, line, 5, '2026-11-27', 'ROLL-2', 48, []), /cannot exceed the remaining/);
  assert.match(erp.grnReceiptValidation({ status: 'Approved' }, line, 5, '2026-11-27', 'ROLL-1', 0, [{ roll: 'ROLL-1' }]), /unique roll number/);
});
test('accessory GRN requires whole-piece quantities', () => {
  assert.match(erp.grnReceiptValidation({ status: 'Approved' }, { itemType: 'Accessory', qty: 20 }, 1.5, '2026-11-27', '', 0, []), /whole number/);
});
test('supplier advance allocation requires a posted advance journal and matching supplier', () => {
  const advance = { id: 'ADV-1', accountingPosting: 'pending', amount: 5000, supplier: 'Fabric House' };
  const bill = { id: 'BILL-1', poId: 'PO-1', supplier: 'Fabric House' };
  assert.match(supplier.validateAdvanceAllocation(advance, bill, 1000, '2026-11-27', 5000, 5000, []), /no confirmed mapped advance journal/);
  assert.match(supplier.validateAdvanceAllocation({ ...advance, accountingPosting: 'posted' }, { ...bill, supplier: 'Other Supplier' }, 1000, '2026-11-27', 5000, 5000, []), /do not match/);
});
test('supplier advance allocation cannot exceed advance or bill balance and rejects exact duplicates', () => {
  const advance = { id: 'ADV-1', accountingPosting: 'posted', amount: 5000, supplier: 'Fabric House' };
  const bill = { id: 'BILL-1', poId: 'PO-1', supplier: 'Fabric House' };
  const validate = (amount, available, due, existing = []) => supplier.validateAdvanceAllocation(advance, bill, amount, '2026-11-27', available, due, existing);
  assert.match(validate(6000, 5000, 7000), /exceeds the available/);
  assert.match(validate(4000, 5000, 3000), /exceeds the purchase bill outstanding/);
  assert.match(validate(1000, 5000, 5000, [{ paymentId: 'ADV-1', billId: 'BILL-1', date: '2026-11-27', amount: 1000 }]), /already recorded/);
  assert.equal(validate(1000, 5000, 5000), '');
});
