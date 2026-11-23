
/* Bridges contractor challan settlements into the supplier payment and TDS registers. */
(()=>{'use strict';
 const read=(k,d=[])=>{try{const x=JSON.parse(localStorage.getItem(k)||JSON.stringify(d));return Array.isArray(x)?x:d}catch(_){return d}};
 const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
 const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
 const fy=date=>{const p=date.split('-').map(Number),y=p[1]>=4?p[0]:p[0]-1;return y+'-'+String(y+1).slice(-2)};
 const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
 window.prasadPrepareContractorPayment=function(job,payment,due){
  let applies=prompt('TDS applicability for this job-work payment? Enter Review, Yes or No. Default is Review.','Review');
  if(applies===null)return null;applies=applies.trim().toLowerCase();
  if(!['review','yes','no'].includes(applies)){alert('Enter Review, Yes or No.');return null}
  let pan='',partyType='Individual / HUF',base=0,rate=1,withheld=0;
  if(applies==='yes'){
   pan=String(prompt('Contractor PAN (required after CA confirms TDS applicability):','')||'').trim().toUpperCase();
   if(!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)){alert('Valid PAN is required. Payment was not recorded.');return null}
   const kind=String(prompt('Contractor constitution: enter Individual / HUF or Other entity.','Individual / HUF')||'').trim();
   if(!['Individual / HUF','Other entity'].includes(kind)){alert('Choose Individual / HUF or Other entity.');return null}
   partyType=kind;rate=partyType==='Individual / HUF'?1:2;
   base=Number(prompt('TDS base excluding separately stated GST (₹):',String(payment.amount))||0);
   if(!Number.isFinite(base)||base<=0||base>due+.009){alert('Enter a positive TDS base not exceeding the remaining challan payable.');return null}
  }
  const payments=read('pa_supplier_payments_v1'),tds=read('pa_tds_entries_v1');
  const ref=String(payment.reference||'').trim().toLowerCase();
  const dup=payments.find(x=>String(x.reference||'').trim().toLowerCase()===ref&&x.id!==payment.id);
  if(dup){alert('This payment reference is already used in the supplier payment register.');return null}
  const prior=payments.filter(x=>x.id!==payment.id&&String(x.tdsPan||'').toUpperCase()===pan&&x.date&&fy(x.date)===fy(payment.date)).reduce((n,x)=>n+Number(x.tdsBase||0),0);
  const legacy=tds.filter(x=>String(x.pan||'').toUpperCase()===pan&&x.financialYear===fy(payment.date)&&(!x.paymentId||!payments.some(p=>p.id===x.paymentId&&Number(p.tdsBase||0)>0))).reduce((n,x)=>n+Number(x.base||0),0);
  const threshold=base>30000||prior+legacy+base>100000;
  if(applies==='yes'&&threshold)withheld=round(base*rate/100);
  const cash=round(Number(payment.amount||0)),settlement=round(cash+withheld);
  if(settlement<=0||settlement>due+.009){alert('Cash plus TDS settlement '+money(settlement)+' exceeds remaining contractor payable '+money(due)+'.');return null}
  const record={id:payment.id,source:'Contractor job-work payment',billId:'',jobId:job.id,contractorId:'',supplier:job.contractor,contractor:job.contractor,invoiceNo:job.challanNo,date:payment.date,amountPaid:cash,tdsWithheld:withheld,tdsBase:applies==='yes'?round(base):0,tdsApplicability:applies==='yes'?'Yes':applies==='no'?'No':'Review',tdsRate:withheld?rate:0,tdsNature:'Job work',tdsPartyType:partyType,tdsPan:pan,mode:'Contractor payment',reference:payment.reference,notes:'Job-work challan '+job.challanNo,createdAt:payment.createdAt};
  const existing=payments.findIndex(x=>x.id===record.id);
  if(existing>=0){const old=payments[existing];if(old.jobId!==record.jobId||old.reference!==record.reference||Number(old.amountPaid)!==record.amountPaid||Number(old.tdsWithheld)!==record.tdsWithheld){alert('Payment ID already exists with different supplier-ledger data. No overwrite was made.');return null}}
  else{payments.push(record);save('pa_supplier_payments_v1',payments)}
  if(withheld>0){
   const old=tds.find(x=>x.paymentId===payment.id);
   if(old&&(Number(old.tds)!==withheld||Number(old.base)!==round(base))){alert('TDS entry mismatch for this payment. Contact support.');return null}
   if(!old){const y=Number(payment.date.slice(0,4)),m=Number(payment.date.slice(5,7)),start=m>=4?y:y-1;tds.push({id:'TDS-'+payment.id,source:'Contractor job-work payment',paymentId:payment.id,billId:'',jobId:job.id,contractorId:'',contractor:job.contractor,pan,billNo:job.challanNo,date:payment.date,gross:settlement,base:round(base),rate,tds:withheld,net:cash,section:payment.date>='2026-04-01'?'Income-tax Act 2025 s.393(1), Table 6(i)':'Income-tax Act 1961 s.194C',quarter:'Q'+(m>=4?Math.floor((m-4)/3)+1:4),financialYear:start+'-'+String(start+1).slice(-2),threshold:true,applicable:true,createdAt:payment.createdAt});save('pa_tds_entries_v1',tds)}
  }
  return {amountPaid:cash,tdsWithheld:withheld,tdsBase:applies==='yes'?round(base):0,tdsApplicability:record.tdsApplicability,tdsRate:record.tdsRate,tdsNature:'Job work',tdsPartyType:partyType,tdsPan:pan,amount:settlement,supplierLedgerSynced:true};
 };
})();
