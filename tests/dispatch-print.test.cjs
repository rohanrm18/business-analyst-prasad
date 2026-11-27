'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const dispatch=fs.readFileSync(require.resolve('../dispatch.js'),'utf8');
const partial=fs.readFileSync(require.resolve('../partial-dispatch.js'),'utf8');

function harness(source,start,end,extra={}){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert.ok(a>=0&&b>a,'source function boundaries must exist');
 let html='',closed=false,alerts=[];
 const context={esc:v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),money:v=>'₹'+Number(v||0).toFixed(2),alert:m=>alerts.push(m),window:{open:()=>({document:{write:s=>html=s,close:()=>{closed=true}}})},setTimeout, ...extra};
 vm.createContext(context);vm.runInContext(source.slice(a,b),context);
 return {context,alerts,get html(){return html},get closed(){return closed}};
}
const invoice={id:'I-1',invoice_no:'PA/26-27/001',invoice_date:'2026-11-27',seller_name:'Prasad Apparels',seller_address:'Nashik',seller_gstin:'GSTIN',seller_state:'Maharashtra',buyer_name:'Buyer',buyer_address:'Buyer address',buyer_gstin:'',buyer_mobile:'9999999999',buyer_pin:'422001',place_supply:'Maharashtra',carton_count:2,items:[{name:'Kurta',designNumber:'PA-101',category:'Ethnic',hsn:'6203',colour:'Peach',size:'22',qty:2,rate:500,discount:0,gst:5,taxable:1000,tax:50}],taxable:1000,cgst:25,sgst:25,igst:0,grand_total:1050};

test('customer invoice print includes recipient copy, tax totals and item variant details',()=>{
 const h=harness(dispatch,'function paPrintCopy(v,kind){','function paPrintDuplex(id){');
 h.context.paPrintCopy(invoice,'ORIGINAL FOR RECIPIENT');
 assert.equal(h.closed,true);assert.match(h.html,/ORIGINAL FOR RECIPIENT/);assert.match(h.html,/PA-101/);assert.match(h.html,/Peach/);assert.match(h.html,/22/);assert.match(h.html,/₹1050.00/);assert.match(h.html,/No\. of Packages \(Cartons\): 2/);
});

test('transporter duplex print is blocked until E-Way Bill review is complete',()=>{
 const d={invoiceId:'I-1',ewb:'pending',transporter:'Roadways',lr:'LR-1',reason:''};
 const h=harness(dispatch,'function paPrintDuplex(id){','function paEnvelope(v){',{taxInvoices:[invoice],paGetDispatch:()=>d});
 h.context.paPrintDuplex('I-1');assert.equal(h.html,'');assert.match(h.alerts.join(' '),/E-Way Bill review/);
});

test('transporter duplex print contains front invoice and reviewed not-required back',()=>{
 const d={invoiceId:'I-1',ewb:'not_required',reason:'Threshold checked; not required',transporter:'Roadways',lr:'LR-1',lrDate:'2026-11-27'};
 const h=harness(dispatch,'function paPrintDuplex(id){','function paEnvelope(v){',{taxInvoices:[invoice],paGetDispatch:()=>d});
 h.context.paPrintDuplex('I-1');assert.equal(h.closed,true);assert.match(h.html,/DUPLICATE FOR TRANSPORTER/);assert.match(h.html,/REVIEWED: E-WAY BILL NOT REQUIRED/);assert.match(h.html,/Threshold checked; not required/);assert.match(h.html,/page-break-after:always/);
});

test('partial dispatch print blocks pending E-Way Bill review',()=>{
 const d={id:'D-1',invoiceId:'I-1',ewb:'pending',items:[{itemIndex:0,qty:1}]};
 const h=harness(partial,'function paMultiPrint(invoiceId,dispatchId){','function paMultiBind(){',{taxInvoices:[invoice],paDispatches:[d]});
 h.context.paMultiPrint('I-1','D-1');assert.equal(h.html,'');assert.match(h.alerts.join(' '),/E-Way Bill review/);
});

test('partial dispatch annexure prints only allocated quantities and is not a new tax invoice',()=>{
 const d={id:'D-2',invoiceId:'I-1',ewb:'not_required',reason:'Reviewed',items:[{itemIndex:0,qty:1}],transporter:'Roadways',lr:'LR-2',lrDate:'2026-11-27',cartons:1};
 const h=harness(partial,'function paMultiPrint(invoiceId,dispatchId){','function paMultiBind(){',{taxInvoices:[invoice],paDispatches:[d]});
 h.context.paMultiPrint('I-1','D-2');assert.equal(h.closed,true);assert.match(h.html,/NOT A NEW TAX INVOICE/);assert.match(h.html,/<td>1<\/td>/);assert.match(h.html,/E-WAY BILL NOT REQUIRED/);assert.match(h.html,/Original invoice total/);
});

test('partial dispatch quantities cannot silently overstate remaining invoiced pieces',()=>{
 const h=harness(partial,'function paMultiQty(invoice,index){','function paMultiStock(invoice,d){',{paDispatches:[{invoiceId:'I-1',items:[{itemIndex:0,qty:1}]},{invoiceId:'I-1',items:[{itemIndex:0,qty:0}]}],paMultiDs:id=>[{invoiceId:id,items:[{itemIndex:0,qty:1}]},{invoiceId:id,items:[{itemIndex:0,qty:0}]}]});
 const invoiceCopy={...invoice,items:[{...invoice.items[0],qty:2}]};
 assert.equal(h.context.paMultiQty(invoiceCopy,0),1);assert.equal(h.context.paMultiRemain(invoiceCopy,0),1);
});
