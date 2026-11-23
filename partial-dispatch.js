
function paMultiDs(invoiceId){return paDispatches.filter(d=>String(d.invoiceId)===String(invoiceId))}
function paMultiQty(invoice,index){let total=0;paMultiDs(invoice.id).forEach(d=>{if(!Array.isArray(d.items)){total+=Number(invoice.items[index].qty||0);return}d.items.forEach(x=>{if(Number(x.itemIndex)===index)total+=Number(x.qty||0)})});return total}
function paMultiRemain(invoice,index){return Math.max(0,Number(invoice.items[index].qty||0)-paMultiQty(invoice,index))}
function paMultiStock(invoice,d){
 if(d.stockPostingStatus==='posted')return true;
 let rows=[];try{rows=JSON.parse(localStorage.getItem('pa_garment_stock_ledger_v1')||'[]')}catch(e){}
 const adds=[];
 for(const x of d.items){const it=invoice.items[x.itemIndex];if(!it||!Number.isInteger(x.qty)||x.qty<1)return false;const style=String(it.designNumber||it.itemNumber||'').trim(),colour=String(it.colour||'').trim(),size=String(it.size||'').trim();if(!style||!colour||!size){alert('Stock issue blocked: style, colour and size are required on invoice line '+(x.itemIndex+1));return false}const ref='DSP:'+d.id+':'+x.itemIndex;if(!rows.some(m=>m.reference===ref&&m.type==='Dispatch / sale issue'))adds.push({type:'Dispatch / sale issue',date:d.lrDate,style,description:it.name||'',colour,size,qty:x.qty,reference:ref,reason:'Dispatch '+d.lr+' against '+invoice.invoice_no,dispatchId:d.id,invoiceId:invoice.id,createdAt:new Date().toISOString()})}
 const sums={};adds.forEach(x=>{const k=[x.style,x.colour,x.size].join('|');sums[k]=(sums[k]||0)+x.qty});
 for(const k of Object.keys(sums)){const p=k.split('|'),available=paDispatchStockAvailable(rows,p[0],p[1],p[2]);if(available<sums[k]){alert('Insufficient saleable stock for '+k+'. Required '+sums[k]+', available '+available);return false}}
 let pos=paDispatches.findIndex(x=>x.id===d.id);if(pos<0)paDispatches.push(d);else paDispatches[pos]=d;d.stockPostingStatus='pending';paSaveDispatches();
 try{localStorage.setItem('pa_garment_stock_ledger_v1',JSON.stringify(rows.concat(adds)));d.stockPostingStatus='posted';d.stockPostedAt=new Date().toISOString();pos=paDispatches.findIndex(x=>x.id===d.id);paDispatches[pos]=d;paSaveDispatches();return true}catch(e){alert('Dispatch saved with stock issue pending. Retry after storage is available.');return false}
}
function paMultiPage(){
 let out='';
 taxInvoices.filter(v=>v.status!=='reversed').slice().reverse().forEach(v=>{
  const ds=paMultiDs(v.id),remaining=v.items.map((x,i)=>paMultiRemain(v,i)),total=v.items.reduce((n,x)=>n+Number(x.qty||0),0),done=total-remaining.reduce((n,x)=>n+x,0);
  let lines='';
  v.items.forEach((it,i)=>{lines+='<label>'+esc(it.name||'Item')+' · '+esc(it.designNumber||it.itemNumber||'')+' · '+esc(it.colour||'')+' / '+esc(it.size||'')+'<small>Ordered '+it.qty+' · Dispatched '+(it.qty-remaining[i])+' · Remaining '+remaining[i]+'</small><input type="number" name="qty_'+i+'" min="0" max="'+remaining[i]+'" step="1" value="0" '+(remaining[i]?'':'disabled')+'></label>'});
  let history='';ds.forEach(d=>{let detail='Legacy full invoice';if(Array.isArray(d.items))detail=d.items.map(x=>'line '+(x.itemIndex+1)+': '+x.qty+' pcs').join(', ');history+='<p><b>'+esc(d.lr||d.id)+'</b> · '+esc(d.lrDate||'')+' · '+detail+' · '+esc(d.stockPostingStatus||'legacy-unverified')+'</p>'});
  let form='';
  if(remaining.some(x=>x>0))form='<form class="pa-multi-form" data-invoice="'+esc(v.id)+'"><h4>Allocate next dispatch</h4>'+lines+'<label>Transporter<input name="transporter" required></label><label>LR / Consignment number<input name="lr" required></label><label>LR date<input name="lrDate" type="date" required value="'+new Date().toISOString().slice(0,10)+'"></label><label>Cartons<input name="cartons" type="number" min="1" step="1" value="1" required></label><label>E-Way Bill status<select name="ewb"><option value="pending">Pending review</option><option value="required">Required</option><option value="not_required">Reviewed — not required</option></select></label><label>Official document / not-required reason<input name="reason"></label><label>Attach official E-Way Bill<input name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp"></label><button class="primary" type="submit">Save partial dispatch</button></form>';
  out+='<section class="card"><h3>'+esc(v.invoice_no)+' · '+esc(v.buyer_name)+'</h3><p>'+done+' / '+total+' pcs dispatched · '+(total-done)+' pcs remaining</p>'+history+form+'</section>';
 });
 return '<div class="heading"><div><small>PACKING → BILLING → TRANSPORT</small><h2>Dispatch & LR</h2></div><span class="tag">LOCAL</span></div><p class="hint">Multiple partial dispatches. Each allocation is limited to the remaining invoice quantity and posts a separate stock issue.</p>'+(out||'<div class="empty">No invoices available.</div>');
}
function paMultiBind(){
 document.querySelectorAll('.pa-multi-form').forEach(f=>f.onsubmit=e=>{
  e.preventDefault();const invoice=taxInvoices.find(v=>v.id===f.dataset.invoice);if(!invoice)return;const fd=new FormData(f),items=[];
  for(let i=0;i<invoice.items.length;i++){const qty=Number(fd.get('qty_'+i)||0);if(!Number.isInteger(qty)||qty<0||qty>paMultiRemain(invoice,i)){alert('Quantity on line '+(i+1)+' exceeds remaining invoice quantity.');return}if(qty)items.push({itemIndex:i,qty})}
  if(!items.length){alert('Enter at least one quantity.');return}
  const file=f.querySelector('[name=file]').files[0];
  const save=data=>{const d={id:'DSP-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),invoiceId:invoice.id,items,transporter:String(fd.get('transporter')||'').trim(),lr:String(fd.get('lr')||'').trim(),lrDate:String(fd.get('lrDate')||''),cartons:Number(fd.get('cartons')||1),ewb:String(fd.get('ewb')||'pending'),reason:String(fd.get('reason')||'').trim(),updatedAt:new Date().toISOString(),stockPostingStatus:'pending'};if(data)d.file=data;if(!d.transporter||!d.lr||!d.lrDate||!Number.isInteger(d.cartons)||d.cartons<1){alert('Enter transporter, LR, date and carton count.');return}if(typeof awDateAllowed==='function'&&!awDateAllowed(d.lrDate))return;if(d.ewb==='not_required'&&!d.reason){alert('Enter review reason.');return}if(d.ewb==='required'&&(!d.file||!(d.file.startsWith('data:application/pdf;base64,')||d.file.startsWith('data:image/png;base64,')||d.file.startsWith('data:image/jpeg;base64,')||d.file.startsWith('data:image/webp;base64,')))){alert('Attach genuine official E-Way Bill PDF/image.');return}if(!paMultiStock(invoice,d))return;render();alert('Partial dispatch saved and allocated stock issued once.')};
  if(file){if(file.size>1258291){alert('File limit is 1.2 MB.');return}const r=new FileReader();r.onload=()=>save(String(r.result));r.readAsDataURL(file)}else save(null)
 });
}
const paMultiRenderBase=render;
render=function(){if(page==='dispatch'){root.innerHTML=paMultiPage();paMultiBind();return}paMultiRenderBase()};
