/* Read-only reconciliation for full and partial dispatch stock postings.
 * Does not write to storage or change posting status.
 */
(function(root){
 'use strict';
 const norm=v=>String(v??'').trim();
 const key=v=>norm(v).toLowerCase();
 function auditDispatches(dispatches,invoices,stockRows){
  const ds=Array.isArray(dispatches)?dispatches:[], invs=Array.isArray(invoices)?invoices:[], rows=Array.isArray(stockRows)?stockRows:[];
  const issues=[], expected=new Map(), seenDispatchIds=new Set();
  ds.forEach((d,di)=>{
   const id=norm(d&&d.id);
   if(!id){issues.push({code:'missing-dispatch-id',dispatchIndex:di});return;}
   if(seenDispatchIds.has(id))issues.push({code:'duplicate-dispatch-id',dispatchId:id});
   seenDispatchIds.add(id);
   if(d.stockPostingStatus==='legacy-unverified'){
    issues.push({code:'legacy-unverified',dispatchId:id,severity:'review'});
    return;
   }
   const invoice=invs.find(v=>String(v.id)===String(d.invoiceId));
   if(!invoice){issues.push({code:'missing-invoice',dispatchId:id,invoiceId:norm(d.invoiceId)});return;}
   const selections=Array.isArray(d.items)&&d.items.length?d.items.map(x=>({index:Number(x.itemIndex),qty:Number(x.qty)})):((d.stockPostingStatus==='posted'?invoice.items:[] )||[]).map((x,i)=>({index:i,qty:Number(x.qty)}));
   if(!selections.length){issues.push({code:'no-dispatch-lines',dispatchId:id});return;}
   selections.forEach(sel=>{
    const i=sel.index,it=invoice.items&&invoice.items[i];
    if(!Number.isInteger(i)||i<0||!it||!Number.isInteger(sel.qty)||sel.qty<1){issues.push({code:'invalid-dispatch-line',dispatchId:id,itemIndex:i});return;}
    const style=norm(it.designNumber||it.itemNumber),colour=norm(it.colour),size=norm(it.size),ref='DSP:'+id+':'+i;
    if(!style||!colour||!size){issues.push({code:'incomplete-invoice-variant',dispatchId:id,itemIndex:i,reference:ref});return;}
    if(expected.has(ref)){issues.push({code:'duplicate-expected-reference',dispatchId:id,itemIndex:i,reference:ref});return;}
    expected.set(ref,{dispatchId:id,itemIndex:i,qty:sel.qty,style,colour,size});
   });
  });
  const dispatchRows=rows.filter(r=>norm(r&&r.reference).startsWith('DSP:')&&r.type==='Dispatch / sale issue');
  for(const [ref,e] of expected){
   const matches=dispatchRows.filter(r=>norm(r.reference)===ref);
   if(matches.length===0){issues.push({code:'missing-stock-issue',...e,reference:ref});continue;}
   if(matches.length>1){issues.push({code:'duplicate-stock-issue',...e,reference:ref,count:matches.length});continue;}
   const r=matches[0];
   if(Number(r.qty)!==e.qty||key(r.style)!==key(e.style)||key(r.colour)!==key(e.colour)||key(r.size)!==key(e.size)){
    issues.push({code:'stock-issue-mismatch',...e,reference:ref,actual:{qty:Number(r.qty),style:norm(r.style),colour:norm(r.colour),size:norm(r.size)}});
   }
  }
  dispatchRows.forEach(r=>{const ref=norm(r.reference);if(!expected.has(ref))issues.push({code:'orphan-stock-issue',reference:ref,qty:Number(r.qty),style:norm(r.style),colour:norm(r.colour),size:norm(r.size)});});
  return {dispatches:ds.length,expectedIssues:expected.size,dispatchStockRows:dispatchRows.length,issues,ok:issues.length===0};
 }
 root.PADispatchAudit={auditDispatches};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.PADispatchAudit;
})(typeof globalThis!=='undefined'?globalThis:this);
