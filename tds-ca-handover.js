/* CA handover working pack. This is an internal preparation/export tool, not tax-return filing. */
(()=>{'use strict';
const $=id=>document.getElementById(id),read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}},save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const KEY='pa_tds_ca_handover_v1',money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const periodOf=d=>{if(!d)return {fy:'',q:''};const [y,m]=d.split('-').map(Number),fy=m>=4?y:y-1,q=m>=4?Math.floor((m-4)/3)+1:4;return {fy:fy+'-'+String(fy+1).slice(-2),q:'Q'+q};};
const allPeriods=()=>{const t=read('pa_tds_entries_v1',[]),p=read('pa_supplier_payments_v1',[]),set=new Set();[...t.map(x=>x.date),...p.filter(x=>Number(x.tdsWithheld)>0||['Job work','Contract service'].includes(x.tdsNature)).map(x=>x.date)].filter(Boolean).forEach(d=>{const z=periodOf(d);set.add(z.fy+'|'+z.q);});return [...set].sort().reverse();};
const selected=()=>{const s=$('ca-period')?.value||allPeriods()[0]||'';return s.split('|');};
function records(){
 const bills=read('pa_purchase_bills_v1',[]),payments=read('pa_supplier_payments_v1',[]),tds=read('pa_tds_entries_v1',[]);
 const rows=[];
 payments.forEach(p=>{if(!Number(p.tdsWithheld)&&!['Job work','Contract service'].includes(p.tdsNature))return;const bill=bills.find(b=>b.id===p.billId)||{},z=periodOf(p.date),base=Number(p.tdsBase||0),amount=Number(p.tdsWithheld||0);rows.push({date:p.date,supplier:p.supplier||bill.supplier||'',pan:p.tdsPan||'',invoice:p.invoiceNo||bill.invoiceNo||'',invoiceDate:bill.invoiceDate||'',nature:p.tdsNature||'Not recorded',section:amount?'As recorded in TDS register':'CA to confirm',gross:Number(p.amountPaid||0)+amount,base,rate:Number(p.tdsRate||0),tds:amount,net:Number(p.amountPaid||0),mode:p.mode||'',reference:p.reference||'',status:amount>0?'Recorded':'CA REVIEW — no deduction recorded',fy:z.fy,q:z.q,source:'Supplier invoice payment'});});
 tds.filter(t=>t.source!=='Supplier invoice payment').forEach(t=>{const z=periodOf(t.date);rows.push({date:t.date,supplier:t.contractor||'',pan:t.pan||'',invoice:t.billNo||'',invoiceDate:t.date||'',nature:'Job work / contractor bill',section:t.section||'',gross:Number(t.gross||0),base:Number(t.base||0),rate:Number(t.rate||0),tds:Number(t.tds||0),net:Number(t.net??(Number(t.gross||0)-Number(t.tds||0))),mode:'',reference:'',status:t.applicable?'Recorded':'CA REVIEW — applicability',fy:z.fy,q:z.q,source:'Contractor bill'});});
 return rows.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function filtered(){
 const [fy,q]=selected();return records().filter(r=>(!fy||fy==='All'||r.fy===fy)&&(!q||q==='All'||r.q===q));
}
function summary(rows,keyFn){
 const m=new Map();rows.forEach(r=>{const k=keyFn(r);if(!m.has(k))m.set(k,{key:k,count:0,gross:0,base:0,tds:0,net:0});const x=m.get(k);x.count++;x.gross+=r.gross;x.base+=r.base;x.tds+=r.tds;x.net+=r.net;});return [...m.values()];
}
function xml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
function cell(v){const n=typeof v==='number'&&Number.isFinite(v);return '<Cell><Data ss:Type="'+(n?'Number':'String')+'">'+xml(v)+'</Data></Cell>';}
function sheet(name,heads,rows){return '<Worksheet ss:Name="'+xml(name)+'"><Table><Row>'+heads.map(cell).join('')+'</Row>'+rows.map(r=>'<Row>'+r.map(cell).join('')+'</Row>').join('')+'</Table></Worksheet>';}
function exportExcel(){
 const rows=filtered(),[fy,q]=selected(),sup=summary(rows,r=>r.supplier+' | '+r.pan),quarter=summary(rows,r=>r.fy+' '+r.q),review=rows.filter(r=>r.status.includes('REVIEW')||!r.pan);
 const deductor=read('pa_tds_deductor_v1',{}),deposits=read('pa_tds_deposits_v1',[]),allocations=read('pa_tds_allocations_v1',[]),tdsRegister=read('pa_tds_entries_v1',[]);\n const txHeads=['Payment date','Supplier / contractor','PAN','Invoice no','Invoice date','Nature','Section / reference','Gross paid / credited','TDS base','Rate %','TDS deducted','Net cash paid','Payment mode','Reference','Working status','FY','Quarter','Source'];
 const tx=rows.map(r=>[r.date,r.supplier,r.pan,r.invoice,r.invoiceDate,r.nature,r.section,r.gross,r.base,r.rate,r.tds,r.net,r.mode,r.reference,r.status,r.fy,r.q,r.source]);
 const supRows=sup.map(x=>[x.key,x.count,x.gross,x.base,x.tds,x.net]);
 const qRows=quarter.map(x=>[x.key,x.count,x.gross,x.base,x.tds,x.net]);
 const reviewRows=review.map(r=>[r.date,r.supplier,r.pan,r.invoice,r.nature,r.gross,r.base,r.tds,r.status]);
 const book='<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'+
 sheet('Deductor Details',['Field','Value'],[['Legal name',deductor.legalName||''],['Constitution',deductor.constitution||''],['TAN',deductor.tan||''],['Firm PAN',deductor.pan||'']])+\n sheet('TDS Transactions',txHeads,tx)+
 sheet('Supplier Summary',['Supplier | PAN','Records','Gross','TDS base','TDS deducted','Net cash'],supRows)+
 sheet('Quarter Summary',['Period','Records','Gross','TDS base','TDS deducted','Net cash'],qRows)+
 sheet('CA Review Required',['Date','Supplier','PAN','Invoice','Nature','Gross','TDS base','TDS','Review note'],reviewRows)+\n sheet('TDS Challans',['Deposit date','Amount','BSR code','Challan serial','Reference','Allocated amount','Unallocated amount'],deposits.map(d=>{const allocated=allocations.filter(a=>a.depositId===d.id).reduce((n,a)=>n+Number(a.amount||0),0);return [d.date,Number(d.amount||0),d.bsr||'',d.serial||'',d.reference||'',allocated,Math.max(0,Number(d.amount||0)-allocated)];}))+\n sheet('Bill Allocations',['Challan date','BSR','Challan serial','Deduction date','Supplier / contractor','PAN','Bill no','TDS amount','Allocated amount'],allocations.map(a=>{const d=deposits.find(x=>x.id===a.depositId)||{},t=tdsRegister.find(x=>x.id===a.tdsId)||{};return [d.date||'',d.bsr||'',d.serial||'',t.date||'',t.contractor||'',t.pan||'',t.billNo||'',Number(t.tds||0),Number(a.amount||0)];}))+'</Workbook>';
 const blob=new Blob([book],{type:'application/vnd.ms-excel;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Prasad-Apparels-TDS-CA-Working-'+(fy||'All-FY')+'-'+(q||'All-quarters')+'.xls';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function panel(){
 const periods=allPeriods(),recordsNow=records(),[fy,q]=selected(),rows=filtered(),sum=rows.reduce((a,r)=>({gross:a.gross+r.gross,base:a.base+r.base,tds:a.tds+r.tds,net:a.net+r.net}),{gross:0,base:0,tds:0,net:0}),store=read(KEY,{}),key=(fy||'All')+'|'+(q||'All'),state=store[key]||{};
 return '<section class="card" id="tds-ca-handover"><div class="cardhead"><div><h3>TDS working for CA</h3><small>Prepare and share your working records. Your CA alone prepares and files the statutory TDS return.</small></div><span class="tag">CA HANDOVER</span></div><p class="hint"><b>Working only — no Income Tax portal filing or return submission.</b> Figures are based on records entered in this browser. CA must verify section, applicability, rates, thresholds, PAN consequences, timing, challans and final return data.</p>'+
 '<label>Financial year & quarter<select id="ca-period">'+(periods.map(p=>'<option value="'+esc(p)+'" '+(p===key?'selected':'')+'>'+esc(p.replace('|',' · '))+'</option>').join(''))+'<option value="All|All" '+(key==='All|All'?'selected':'')+'>All recorded periods</option></select></label>'+
 '<div class="line"><span>Working records</span><b>'+rows.length+'</b></div><div class="line"><span>Gross payments</span><b>'+money(sum.gross)+'</b></div><div class="line"><span>TDS base</span><b>'+money(sum.base)+'</b></div><div class="line"><span>TDS recorded</span><b>'+money(sum.tds)+'</b></div><div class="line"><span>Net cash paid</span><b>'+money(sum.net)+'</b></div><div class="line"><span>Items needing CA review</span><b>'+rows.filter(r=>r.status.includes('REVIEW')||!r.pan).length+'</b></div>'+
 '<button type="button" class="primary" id="ca-export">Export Excel working file (.xls)</button><p class="hint">The Excel file contains TDS Transactions, Supplier Summary, Quarter Summary and CA Review Required worksheets. Open it in Excel and use Save As .xlsx if your CA requests the newer format.</p>'+
 '<div class="two"><label>Handover status<select id="ca-status"><option value="Not sent">Not sent</option><option value="Sent to CA">Sent to CA</option><option value="CA confirmed">CA confirmed</option></select></label><label>Handover date<input id="ca-date" type="date" value="'+esc(state.sentAt||'')+'"></label></div>'+
 '<label>CA remarks / follow-up notes<textarea id="ca-remarks" rows="3" placeholder="Add CA comments or items to correct">'+esc(state.remarks||'')+'</textarea></label><button type="button" class="secondary" id="ca-save">Save CA handover tracking</button><p class="hint">Status is only your internal handover tracker. “CA confirmed” means the CA acknowledged the working pack; it does not mean a return was filed.</p>'+
 '<div class="line"><span>Saved handover status</span><b>'+esc(state.status||'Not sent')+'</b></div><div class="line"><span>Last handover date</span><b>'+esc(state.sentAt||'—')+'</b></div></section>';
}
function enhance(){
 const page=$('page');if(!page||!page.innerText.includes('Job work & TDS'))return;
 const old=$('tds-ca-handover');if(old)old.remove();page.insertAdjacentHTML('beforeend',panel());
 const select=$('ca-period');if(select)select.onchange=()=>{enhance();};
 const ex=$('ca-export');if(ex)ex.onclick=exportExcel;
 const saveBtn=$('ca-save');if(saveBtn)saveBtn.onclick=()=>{const [fy,q]=selected(),key=(fy||'All')+'|'+(q||'All'),data=read(KEY,{}),status=$('ca-status').value,date=$('ca-date').value;data[key]={status,sentAt:date,remarks:$('ca-remarks').value,updatedAt:new Date().toISOString(),recordCount:filtered().length};save(KEY,data);alert('CA handover tracker saved on this device.');enhance();};
 const status=$('ca-status');if(status){const [fy,q]=selected(),st=read(KEY,{})[(fy||'All')+'|'+(q||'All')]||{};status.value=st.status||'Not sent';}
}
const old=window.render;if(old)window.render=function(){old();enhance();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();