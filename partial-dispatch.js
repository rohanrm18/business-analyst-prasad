
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
  let history='';ds.forEach(d=>{let detail='Legacy full invoice';if(Array.isArray(d.items))detail=d.items.map(x=>'line '+(x.itemIndex+1)+': '+x.qty+' pcs').join(', ');history+='<p><b>'+esc(d.lr||d.id)+'</b> · '+esc(d.lrDate||'')+' · '+detail+' · '+esc(d.stockPostingStatus||'legacy-unverified')+(d.stockPostingStatus==='pending'?' <button type="button" data-pa-multi-retry="'+esc(d.id)+'">Retry stock posting</button>':'')+' <button type="button" data-pa-multi-print="'+esc(v.id)+'" data-dispatch="'+esc(d.id)+'">Print dispatch annexure</button></p>'});
  let form='';
  if(remaining.some(x=>x>0))form='<form class="pa-multi-form" data-invoice="'+esc(v.id)+'"><h4>Allocate next dispatch</h4>'+lines+'<label>Transporter<input name="transporter" required></label><label>LR / Consignment number<input name="lr" required></label><label>LR date<input name="lrDate" type="date" required value="'+new Date().toISOString().slice(0,10)+'"></label><label>Cartons<input name="cartons" type="number" min="1" step="1" value="1" required></label><label>E-Way Bill status<select name="ewb"><option value="pending">Pending review</option><option value="required">Required</option><option value="not_required">Reviewed — not required</option></select></label><label>Official document / not-required reason<input name="reason"></label><label>Attach official E-Way Bill<input name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp"></label><button class="primary" type="submit">Save partial dispatch</button></form>';
  out+='<section class="card"><h3>'+esc(v.invoice_no)+' · '+esc(v.buyer_name)+'</h3><p>'+done+' / '+total+' pcs dispatched · '+(total-done)+' pcs remaining</p>'+history+form+'</section>';
 });
 return '<div class="heading"><div><small>PACKING → BILLING → TRANSPORT</small><h2>Dispatch & LR</h2></div><span class="tag">LOCAL</span></div><p class="hint">Multiple partial dispatches. Each allocation is limited to the remaining invoice quantity and posts a separate stock issue.</p>'+(out||'<div class="empty">No invoices available.</div>');
}

function paMultiPrint(invoiceId,dispatchId){
 const invoice=taxInvoices.find(v=>v.id===invoiceId),d=paDispatches.find(x=>x.id===dispatchId);if(!invoice||!d)return;
 if(d.ewb==='pending'||(d.ewb==='required'&&!d.file)||(d.ewb==='not_required'&&!String(d.reason||'').trim())){alert('Complete E-Way Bill review for this dispatch before printing.');return}
 let rows='';(d.items||[]).forEach(x=>{const it=invoice.items[x.itemIndex];if(it)rows+='<tr><td>'+esc(it.name||'')+'</td><td>'+esc(it.designNumber||it.itemNumber||'')+'</td><td>'+esc(it.colour||'')+'</td><td>'+esc(it.size||'')+'</td><td>'+x.qty+'</td></tr>'});
 const back=d.ewb==='required'?'<iframe src="'+d.file+'" style="width:100%;height:265mm;border:0"></iframe>':'<h2>E-Way Bill Not Required</h2><p>'+esc(d.reason)+'</p>';
 const w=window.open('','_blank');if(!w){alert('Allow pop-ups to print.');return}
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:10mm}body{font:12px Arial}.side{height:277mm;box-sizing:border-box;page-break-after:always}.mark{text-align:center;border:1px solid;padding:8px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #aaa;padding:7px}</style></head><body><section class="side"><div class="mark">DISPATCH QUANTITY ANNEXURE — NOT A NEW TAX INVOICE</div><h2>'+esc(invoice.seller_name)+'</h2><p>Invoice '+esc(invoice.invoice_no)+' · '+esc(invoice.invoice_date)+' · Buyer '+esc(invoice.buyer_name)+'</p><p>'+esc(invoice.buyer_address||'')+'</p><p>Transporter '+esc(d.transporter)+' · LR '+esc(d.lr)+' · '+esc(d.lrDate)+' · Cartons '+Number(d.cartons||1)+'</p><table><tr><th>Item</th><th>Design</th><th>Colour</th><th>Size</th><th>Qty dispatched</th></tr>'+rows+'</table><p>Original invoice total: '+money(invoice.grand_total)+'. This annexure lists only the quantities moving under this LR.</p></section><section class="side"><div class="mark">BACK — '+(d.ewb==='required'?'OFFICIAL E-WAY BILL':'E-WAY BILL NOT REQUIRED')+'</div>'+back+'</section><script>window.onload=()=>setTimeout(()=>window.print(),900)<\/script></body></html>');w.document.close()
}

function paMultiBind(){
 document.querySelectorAll('[data-pa-multi-retry]').forEach(b=>b.onclick=()=>{const d=paDispatches.find(x=>x.id===b.dataset.paMultiRetry),invoice=d&&taxInvoices.find(v=>v.id===d.invoiceId);if(invoice&&paMultiStock(invoice,d)){render();alert('Stock posting confirmed.')}});
 document.querySelectorAll('[data-pa-multi-print]').forEach(b=>b.onclick=()=>paMultiPrint(b.dataset.paMultiPrint,b.dataset.dispatch));
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
