'use strict';
/* Tests the real invoice calculation and validation code in app.js (extracted as text, not copied). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const src = fs.readFileSync('app.js', 'utf8');

function extractFunction(name) {
  const start = src.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'function ' + name + ' must exist');
  const brace = src.indexOf('{', start);
  let depth = 0, quote = '', escaped = false;
  for (let i = brace; i < src.length; i++) {
    const ch = src[i];
    if (quote) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('Unclosed function ' + name);
}
function extractConstLine(name) {
  const start = src.indexOf('const ' + name + '=');
  assert.notEqual(start, -1, name + ' must exist');
  return src.slice(start, src.indexOf('\n', start));
}

const ctx = vm.createContext({});
vm.runInContext([extractConstLine('GST_STATE_CODES'), extractFunction('gstStateCode'), extractFunction('calculateInvoice'), extractFunction('validateInvoiceDraft')].join('\n'), ctx);

/* Minimal stand-in for the browser FormData used by the invoice form. */
function form(fields, lines) {
  const map = new Map(Object.entries(fields));
  const arr = { item_name: [], item_design_number: [], item_category: [], item_colour: [], item_size: [], item_hsn: [], item_qty: [], item_rate: [], item_discount: [], item_gst: [] };
  lines.forEach(l => {
    arr.item_name.push(l.name ?? 'Kurta set'); arr.item_design_number.push(l.design ?? 'PA-1'); arr.item_category.push(l.category ?? 'Kurta');
    arr.item_colour.push(l.colour ?? 'Red'); arr.item_size.push(l.size ?? '4'); arr.item_hsn.push(l.hsn ?? '6204');
    arr.item_qty.push(String(l.qty ?? 1)); arr.item_rate.push(String(l.rate ?? 100)); arr.item_discount.push(String(l.discount ?? 0)); arr.item_gst.push(String(l.gst ?? 5));
  });
  return { get: k => map.has(k) ? map.get(k) : null, getAll: k => (arr[k.replace('[]', '')] || []).slice() };
}
const base = { seller_gstin: '27ABCDE1234F1Z5', seller_state: 'Maharashtra', place_supply: 'Maharashtra', carton_count: '1' };
const calc = (fields, lines) => ctx.calculateInvoice(form({ ...base, ...fields }, lines));
const close = (a, b) => assert.ok(Math.abs(a - b) < 0.005, a + ' should equal ' + b);

test('same state: tax splits half CGST, half SGST, no IGST', () => {
  const r = calc({}, [{ qty: 10, rate: 500, gst: 5 }]);
  close(r.taxable, 5000); close(r.cgst, 125); close(r.sgst, 125); close(r.igst, 0); close(r.grand_total, 5250);
  assert.equal(r.intra, true);
});

test('other state: whole tax is IGST', () => {
  const r = calc({ place_supply: 'Gujarat' }, [{ qty: 10, rate: 500, gst: 5 }]);
  close(r.igst, 250); close(r.cgst, 0); close(r.sgst, 0); close(r.grand_total, 5250);
  assert.equal(r.intra, false);
});

test('state given as a GST code or short name is read correctly', () => {
  assert.equal(calc({ place_supply: '27' }, [{}]).intra, true);
  assert.equal(calc({ place_supply: 'MH' }, [{}]).intra, true);
  assert.equal(calc({ place_supply: '24' }, [{}]).intra, false);
  assert.equal(calc({ place_supply: 'gujarat' }, [{}]).intra, false);
});

test('discount comes off before tax is worked out', () => {
  const r = calc({}, [{ qty: 4, rate: 1000, discount: 400, gst: 12 }]);
  close(r.taxable, 3600); close(r.cgst + r.sgst, 432); close(r.grand_total, 4032);
});

test('several lines with different GST rates add up', () => {
  const r = calc({}, [{ qty: 2, rate: 1000, gst: 5 }, { qty: 1, rate: 3000, gst: 12 }]);
  close(r.taxable, 5000); close(r.cgst + r.sgst, 100 + 360); close(r.grand_total, 5460);
  assert.equal(r.items.length, 2);
});

test('grand total is rounded to paise', () => {
  const r = calc({}, [{ qty: 3, rate: 333.33, gst: 5 }]);
  assert.equal(r.grand_total, Math.round(r.grand_total * 100) / 100);
});

test('lines with no name or zero quantity are left out', () => {
  const r = calc({}, [{ qty: 0 }, { name: '' }, { qty: 1, rate: 100 }]);
  assert.equal(r.items.length, 1);
});

test('a 0% GST line adds no tax', () => {
  const r = calc({}, [{ qty: 5, rate: 200, gst: 0 }]);
  close(r.cgst + r.sgst + r.igst, 0); close(r.grand_total, 1000);
});

const check = (fields, lines) => { const f = form({ ...base, ...fields }, lines); return ctx.validateInvoiceDraft(ctx.calculateInvoice(f), f); };

test('a correct invoice passes validation', () => { assert.equal(check({}, [{}]), ''); });

test('GSTIN must have 15 characters and a known state code', () => {
  assert.match(check({ seller_gstin: '27ABC' }, [{}]), /GSTIN/);
  assert.match(check({ seller_gstin: '99ABCDE1234F1Z5' }, [{}]), /state code/);
});

test('GSTIN state must match the seller state', () => {
  assert.match(check({ seller_state: 'Gujarat' }, [{}]), /does not match/);
});

test('unknown place of supply is refused, not guessed', () => {
  assert.match(check({ place_supply: 'Atlantis' }, [{}]), /Place of supply/);
});

test('HSN must be 4, 6 or 8 digits', () => {
  assert.match(check({}, [{ hsn: '62' }]), /HSN/);
  assert.match(check({}, [{ hsn: '62abcd' }]), /HSN/);
  assert.equal(check({}, [{ hsn: '62044290' }]), '');
});

test('discount cannot be more than the line amount; GST must be 0 to 100', () => {
  assert.match(check({}, [{ qty: 1, rate: 100, discount: 150 }]), /discount/);
  assert.match(check({}, [{ gst: 150 }]), /GST rate/);
});

test('buyer mobile, PIN and carton count are checked', () => {
  assert.match(check({ buyer_mobile: '12345' }, [{}]), /mobile/);
  assert.match(check({ buyer_pin: '4001' }, [{}]), /PIN/);
  assert.match(check({ carton_count: '0' }, [{}]), /cartons/);
  assert.equal(check({ buyer_mobile: '9876543210', buyer_pin: '400001' }, [{}]), '');
});
