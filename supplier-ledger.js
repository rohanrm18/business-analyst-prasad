/* Invoice-wise supplier settlement + contractor TDS bridge for Prasad Apparels.
   Uses the existing purchase-bill, supplier-payment and TDS storage keys. */
(()=>{'use strict';
const $=id=>document.getElementById(id), read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}}, save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fyq=date=>{const [y,m]=date.split('-').map(Number),fy=m>=4?y:y-1,q=m>=4?Math.floor((m-4)/3)+1:4;return {quarter:'Q'+q,financialYear:fy+'-'+String(fy+1).slice(-2)};};
const isContractWork=n=>['Job work','Contract service'].includes(n);
function enhance(){
 const form=$('supplier-payment-form');if(!form||form.dataset.tdsEnhanced)return;form.dataset.tdsEnhanced='1';
 const billSelect=form.elements.billId,paid=form.elements.amountPaid,tdsField=form.elements.tdsWithheld;
 if(!billSelect||!paid||!tdsField)return;
 const panel=document.createElement('div');panel.id='supplier-tds-panel';panel.innerHTML=
 '<div class="invoice-section-title">Automatic TDS calculation · contractor / job-work payments</div>'+
 '<label>Payment nature<select id="sp-nature"><option value="Goods purchase">Goods purchase</option><option value="Job work">Job work</option><option value="Contract service">Contract service</option><option value="Other">Other</option></select></label>'+
 '<div class="two"><label>TDS applicability<select id="sp-applicable"><option value="Review">Review with CA</option><option value="Yes">Yes — confirmed</option><option value="No">No</option></select></label><label>Supplier constitution<select id="sp-type"><option value="Individual / HUF">Individual / HUF · 1%</option><option value="Other entity">Other entity · 2%</option></select></label></div>'+
 '<div class="two"><label>Supplier PAN<input id="sp-pan" maxlength="10" placeholder="ABCDE1234F"></label><label>TDS base ₹<input id="sp-base" type="number" min="0" step="0.01" value="0"></label></div>'+
 '<p class="hint" id="sp-tds-preview">TDS is not calculated until the payment nature and applicability are confirmed. Goods purchases are not automatically treated as contractor payments.</p>';
 const tdsLabel=tdsField.closest('label');tdsField.readOnly=true;tdsField.setAttribute('aria-readonly','true');if(tdsLabel){tdsLabel.firstChild.textContent='Auto TDS withheld ₹ (calculated)';}
 const modeLabel=form.elements.mode?.closest('label');if(modeLabel)modeLabel.parentElement.insertAdjacentElement('afterend',panel);else form.appendChild(panel);
 const bills=read('pa_purchase_bills_v1',[]),payments=read('pa_supplier_payments_v1',[]),tds=read('pa_tds_entries_v1',[]),contractors=read('pa_contractors_v1',[]);
 function currentBill(){return bills.find(b=>b.id===billSelect.value);}
 function outstanding(b){const ps=payments.filter(p=>p.billId===b.id);return Math.max(0,Number(b.total||0)-ps.reduce((n,p)=>n+Number(p.amountPaid||0)+Number(p.tdsWithheld||0),0));}
 function remainingBase(b){const used=payments.filter(p=>p.billId===b.id).reduce((n,p)=>n+Number(p.tdsBase||0),0);return Math.max(0,Number(b.taxable||b.total||0)-used);}
 function priorBase(b,pan,date){const q=fyq(date);return tds.filter(t=>t.financialYear===q.financialYear&&((pan&&String(t.pan||'').toUpperCase()===pan)||(!pan&&String(t.contractor||'').trim().toLowerCase()===String(b.supplier||'').trim().toLowerCase()))).reduce((n,t)=>n+Number(t.base||0),0);}
 function calc(){
  const b=currentBill(),nature=$('sp-nature').value,applies=$('sp-applicable').value,type=$('sp-type').value,pan=$('sp-pan').value.trim().toUpperCase(),base=Number($('sp-base').value||0),date=form.elements.date.value,rate=type==='Individual / HUF'?1:2;
  const eligible=!!b&&isContractWork(nature)&&applies==='Yes'&&/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)&&date&&base>0;
  const prior=b&&date?priorBase(b,pan,date):0,threshold=base>30000||prior+base>100000,amount=eligible&&threshold?round(base*rate/100):0;
  tdsField.value=amount.toFixed(2);
  const preview=$('sp-tds-preview');
  if(!isContractWork(nature))preview.textContent='TDS is not auto-applied to this payment nature. Select Job work / Contract service only when that describes the transaction.';
  else if(applies!=='Yes')preview.textContent='Choose “Yes — confirmed” only after confirming applicability with your accountant. No TDS is calculated yet.';
  else if(!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan))preview.textContent='Enter the supplier PAN to calculate. PAN-missing cases require separate CA review; no rate is guessed.';
  else if(!base||base<0)preview.textContent='Enter the TDS base excluding GST separately shown on the invoice.';
  else if(!threshold)preview.textContent='Indicative threshold not crossed: single payment ₹30,000 or annual aggregate ₹1,00,000. No TDS suggested on the entered figures.';
  else preview.textContent='Indicative TDS '+rate+'% = '+money(amount)+' on base '+money(base)+'. Prior FY base found: '+money(prior)+'. Verify section, threshold, PAN consequences and timing with your CA.';
  return {b,nature,applies,type,pan,base,rate,amount,prior,threshold};
 }
 const match=()=>{const b=currentBill();if(!b)return;const c=contractors.find(x=>(b.gstin&&x.gstin&&String(x.gstin).toUpperCase()===String(b.gstin).toUpperCase())||String(x.name||'').trim().toLowerCase()===String(b.supplier||'').trim().toLowerCase());if(c){if(c.pan)$('sp-pan').value=String(c.pan).toUpperCase();if(c.type)$('sp-type').value=c.type==='Individual / HUF'?'Individual / HUF':'Other entity';}
  const base=remainingBase(b);$('sp-base').value=base.toFixed(2);calc();};
 [billSelect,form.elements.date,$('sp-nature'),$('sp-applicable'),$('sp-type'),$('sp-pan'),$('sp-base')].forEach(el=>el&&el.addEventListener('change',()=>{if(el===billSelect)match();else calc();}));
 $('sp-pan').addEventListener('input',calc);$('sp-base').addEventListener('input',calc);match();
}
document.addEventListener('submit',e=>{
 const form=e.target;if(!form||form.id!=='supplier-payment-form')return;
 e.preventDefault();e.stopImmediatePropagation();
 const bills=read('pa_purchase_bills_v1',[]),payments=read('pa_supplier_payments_v1',[]),tds=read('pa_tds_entries_v1',[]);
 const b=bills.find(x=>x.id===form.elements.billId.value),cash=Number(form.elements.amountPaid.value||0),d= form.elements.date.value;
 const nature=$('sp-nature')?.value||'Goods purchase',applies=$('sp-applicable')?.value||'Review',type=$('sp-type')?.value||'Individual / HUF',pan=($('sp-pan')?.value||'').trim().toUpperCase(),base=Number($('sp-base')?.value||0),rate=type==='Individual / HUF'?1:2;
 if(!b||!d||!Number.isFinite(cash)||cash<0){alert('Select an invoice and enter a valid payment date and cash amount.');return;}
 const priorPayments=payments.filter(p=>p.billId===b.id),due=Math.max(0,Number(b.total||0)-priorPayments.reduce((n,p)=>n+Number(p.amountPaid||0)+Number(p.tdsWithheld||0),0));
 const usedBase=priorPayments.reduce((n,p)=>n+Number(p.tdsBase||0),0),baseLeft=Math.max(0,Number(b.taxable||b.total||0)-usedBase);
 let withheld=0;
 if(applies==='Yes'){
  if(!isContractWork(nature)){alert('Automatic contractor TDS is available only for Job work or Contract service.');return;}
  if(!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)){alert('Enter a valid supplier PAN before calculating TDS. If PAN is unavailable, ask your CA to review the applicable rate.');return;}
  if(!Number.isFinite(base)||base<=0||base>baseLeft+.009){alert('TDS base must be positive and cannot exceed the remaining taxable invoice base of '+money(baseLeft)+'.');return;}
  const q=fyq(d),prior=tds.filter(t=>t.financialYear===q.financialYear&&String(t.pan||'').toUpperCase()===pan).reduce((n,t)=>n+Number(t.base||0),0);
  if(base>30000||prior+base>100000)withheld=round(base*rate/100);
 } else if(base>0){alert('Clear the TDS base or choose “Yes — confirmed” after CA review.');return;}
 if(cash+withheld<=0||cash+withheld>due+.009){alert('Cash paid plus TDS withheld must be positive and cannot exceed invoice outstanding '+money(due)+'.');return;}
 const id='SP-'+Date.now()+'-'+Math.floor(Math.random()*10000),payment={id,billId:b.id,supplier:b.supplier,invoiceNo:b.invoiceNo,date:d,amountPaid:round(cash),tdsWithheld:round(withheld),tdsBase:withheld?round(base):0,tdsRate:withheld?rate:0,tdsNature:nature,tdsPartyType:type,tdsPan:pan,mode:form.elements.mode.value,reference:form.elements.reference.value,notes:form.elements.notes.value,createdAt:new Date().toISOString()};
 payments.push(payment);save('pa_supplier_payments_v1',payments);
 if(withheld>0){const q=fyq(d),after=d>='2026-04-01';tds.push({id:'TDS-'+id,source:'Supplier invoice payment',paymentId:id,billId:b.id,jobId:'',contractorId:'',contractor:b.supplier,pan,billNo:b.invoiceNo,date:d,gross:round(cash+withheld),base:round(base),rate,tds:withheld,net:round(cash),section:after?'Income-tax Act 2025 s.393(1), Table 6(i)':'Income-tax Act 1961 s.194C',...q,threshold:true,applicable:true,createdAt:new Date().toISOString()});save('pa_tds_entries_v1',tds);}
 alert('Payment saved against '+b.invoiceNo+'. Cash: '+money(cash)+'. TDS: '+money(withheld)+'. Supplier outstanding and TDS register updated.');
 location.reload();
},true);
const oldRender=window.render;window.render=function(){oldRender();enhance();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();