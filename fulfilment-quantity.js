/* Finished-garment reservation and order variant reconciliation.
   Packing reserves stock; dispatch stock-ledger issues consume that reservation. */
const PA_FULFILMENT_RESERVATION_VERSION='1';
function paFRead(key,fallback=[]){try{const x=JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));return x??fallback}catch(_){return fallback}}
function paFNorm(v){return String(v??'').trim().toLowerCase()}
function paFKey(x){return [x.style??x.designNumber??x.itemNumber??'',x.colour??'',x.size??''].map(paFNorm).join('¦')}
function paFStyle(x){return String(x.designNumber||x.itemNumber||x.style||'').trim()}
function paFStockRows(){return paFRead('pa_garment_stock_ledger_v1',[])}
function paFSlipRows(){return paFRead('pa_packing_slips_v1',[]).filter(s=>s&&s.status==='approved')}
function paFInvoiceRows(){return paFRead('pa_tax_invoices',[]).filter(v=>v&&v.status!=='reversed')}
function paFDispatchRows(){return paFRead('pa_dispatches_v1',[])}
function paFStockBalance(rows,key){return rows.reduce((n,m)=>{if(paFKey(m)!==key)return n;const q=Number(m.qty||0);if(!Number.isFinite(q))return n;if(m.type==='Dispatch / sale issue'||m.type==='Stock adjustment out')return n-q;if(m.type==='Customer return'&&m.status!=='released')return n;return n+q},0)}
function paFDispatchBySlip(){
 const invoices=paFInvoiceRows(),slips=paFSlipRows(),bySlip=new Map();
 invoices.forEach(v=>{if(v.packing_slip_id)bySlip.set(String(v.packing_slip_id),v)});
 const consumed=new Map(),moves=paFStockRows().filter(m=>m.type==='Dispatch / sale issue'&&m.dispatchId&&m.invoiceId);
 moves.forEach(m=>{const inv=invoices.find(v=>String(v.id)===String(m.invoiceId));if(!inv||!inv.packing_slip_id)return;const key=String(inv.packing_slip_id)+'¦'+paFKey(m);consumed.set(key,(consumed.get(key)||0)+Number(m.qty||0))});
 return {bySlip,consumed,slips};
}
function paFReservations(excludeOrderId){
 const {consumed,slips}=paFDispatchBySlip(),reserved=new Map();
 slips.forEach(s=>(s.items||[]).forEach(it=>{
  const key=paFKey(it);if(!key.replace(/¦/g,''))return;
  const slipKey=String(s.id)+'¦'+key,packed=Number(it.qty||0),dispatched=Number(consumed.get(slipKey)||0);
  const open=Math.max(0,packed-dispatched);if(!open)return;
  const orderId=String(s.orderId);
  const bucket=reserved.get(key)||{total:0,otherOrders:0,currentOrder:0};
  bucket.total+=open;if(excludeOrderId!==undefined&&orderId===String(excludeOrderId))bucket.currentOrder+=open;else bucket.otherOrders+=open;
  reserved.set(key,bucket);
 }));
 return reserved;
}
function paFAvailableToReserve(item,orderId,stockRows,reservations){
 const key=paFKey({style:paFStyle(item),colour:item.colour,size:item.size}),physical=paFStockBalance(stockRows,key),held=reservations.get(key)||{total:0,otherOrders:0,currentOrder:0};
 return {key,physical,reserved:held.total,otherOrders:held.otherOrders,currentOrder:held.currentOrder,free:physical-held.total};
}
function paFConfirmPackingSlip(orderId){
 const orders=Array.isArray(savedOrders)?savedOrders:[],o=orders.find(x=>String(x.id)===String(orderId));
 if(!o){alert('Sales order not found.');return}
 if(!Array.isArray(o.items)||!o.items.length||o.items.some(x=>!Number.isInteger(Number(x.qty))||Number(x.qty)<=0)){alert('Order has no valid whole-piece packing quantities.');return}
 const grouped=new Map();
 o.items.forEach(x=>{const style=paFStyle(x),key=paFKey({style,colour:x.colour,size:x.size});if(!style||!String(x.colour||'').trim()||!String(x.size||'').trim()){grouped.set('INVALID:'+grouped.size,{invalid:true});return}if(!grouped.has(key))grouped.set(key,{name:x.name||'',itemNumber:style,category:x.category||'',colour:x.colour||'',size:x.size||'',qty:0});grouped.get(key).qty+=Number(x.qty)});
 if([...grouped.values()].some(x=>x.invalid)){alert('Packing blocked: every order line must have a style/design code, colour and size so stock can be reserved accurately. Correct the sales order first.');return}
 const slips=paFSlipRows(),prior=slips.filter(s=>String(s.orderId)===String(orderId)),selected=[],stockRows=paFStockRows(),reservations=paFReservations(orderId);
 for(const [key,item] of grouped){
  const already=prior.reduce((n,s)=>n+(s.items||[]).filter(x=>paFKey(x)===key).reduce((m,x)=>m+Number(x.qty||0),0),0),remaining=Math.max(0,item.qty-already);
  if(!remaining)continue;
  const stock=paFAvailableToReserve(item,orderId,stockRows,reservations);
  const ownAlready=stock.currentOrder;
  const allowed=Math.min(remaining,Math.max(0,stock.physical-stock.otherOrders-ownAlready));
  if(allowed<=0){alert('Packing blocked for '+item.itemNumber+' / '+item.colour+' / '+item.size+'. Saleable stock '+stock.physical+' pcs; other orders already reserve '+stock.otherOrders+' pcs; your open reservation '+ownAlready+' pcs. No free pieces remain.');return}
  const raw=prompt('Carton '+(paFRead('pa_packing_slips_v1',[]).filter(s=>String(s.orderId)===String(orderId)).length+1)+' — '+(item.name||item.itemNumber)+' / '+item.colour+' / '+item.size+'\nRemaining to pack: '+remaining+' pcs. Unreserved stock available: '+allowed+' pcs. Enter quantity for this carton (0 to skip):',String(Math.min(remaining,allowed)));
  if(raw===null)return;const q=Number(raw);
  if(!Number.isInteger(q)||q<0||q>remaining||q>allowed){alert('Enter a whole quantity from 0 to '+Math.min(remaining,allowed)+'. Packing cannot exceed unreserved saleable stock.');return}
  if(q)selected.push({...item,qty:q});
 }
 if(!selected.length){alert('No remaining quantity selected for this carton.');return}
 if(!confirm('Confirm physically picked, checked and packed '+selected.reduce((n,x)=>n+x.qty,0)+' pieces? This approves a stock reservation; stock will be deducted only when dispatched.'))return;
 const all=paFRead('pa_packing_slips_v1',[]),slip={id:'PS-'+Date.now(),number:'PA-PS-'+new Date().getFullYear()+'-'+String(all.length+1).padStart(4,'0'),cartonNo:all.filter(s=>String(s.orderId)===String(orderId)).length+1,orderId:o.id,customer:o.party,date:new Date().toISOString().slice(0,10),notes:o.notes||'',items:selected,status:'approved',approvedAt:new Date().toISOString(),reservationVersion:PA_FULFILMENT_RESERVATION_VERSION};
 all.push(slip);localStorage.setItem('pa_packing_slips_v1',JSON.stringify(all));if(typeof render==='function')render();if(typeof printPackingSlip==='function')printPackingSlip(slip);
 alert('Packing slip approved. '+selected.reduce((n,x)=>n+x.qty,0)+' pcs are now reserved. Stock will reduce only on dispatch.'); 
}
if(typeof confirmPackingSlip==='function')confirmPackingSlip=paFConfirmPackingSlip;

function paFOrderVariantRows(order){
 const orderId=String(order.id),keyOf=x=>paFKey({style:paFStyle(x),colour:x.colour,size:x.size}),rows=new Map();
 const get=x=>{const key=keyOf(x);if(!rows.has(key))rows.set(key,{style:paFStyle(x),colour:String(x.colour||''),size:String(x.size||''),ordered:0,planned:0,produced:0,producedSplit:true,qcAccepted:0,packed:0,invoiced:0,dispatched:0});return rows.get(key)};
 (order.items||[]).forEach(x=>{get(x).ordered+=Number(x.qty||0)});
 const mos=paFRead('pa_manufacturing_v1',{orders:[]}).orders||[],active=mos.filter(m=>String(m.sourceSalesOrderId||'')===orderId&&!['cancelled','Cancelled'].includes(m.status||''));
 active.forEach(m=>{
  const plan=String(m.sizes||'').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean),parsed=plan.map(p=>{const z=p.match(/^(.+?)\s*[:=xX-]\s*(\d+)$/);return z?{size:z[1].trim(),qty:Number(z[2])}:null}).filter(Boolean);
  if(parsed.length)parsed.forEach(p=>{const row=get({style:m.style,colour:m.colour,size:p.size});row.planned+=p.qty;row.producedSplit=false;});
  else get({style:m.style,colour:m.colour,size:'Unspecified'}).planned+=Number(m.qty||0);
  const stages=m.progress||{},done=Number(stages['Quality Check']||stages.quality||0);
  if(!parsed.length)get({style:m.style,colour:m.colour,size:'Unspecified'}).produced+=done;
 });
 const qc=paFRead('pa_mfg_qc_v1',[]),moIds=new Set(active.map(m=>String(m.id)));
 qc.filter(q=>moIds.has(String(q.moId||''))).forEach(q=>{const r=get({style:q.style||active.find(m=>String(m.id)===String(q.moId))?.style,colour:q.colour||active.find(m=>String(m.id)===String(q.moId))?.colour,size:q.size});r.qcAccepted+=Number(q.accepted||0)});
 const slips=paFSlipRows().filter(s=>String(s.orderId)===orderId);
 slips.forEach(s=>(s.items||[]).forEach(x=>get(x).packed+=Number(x.qty||0)));
 const invoices=paFInvoiceRows().filter(v=>String(v.order_id||'')===orderId);
 invoices.forEach(v=>(v.items||[]).forEach(x=>get(x).invoiced+=Number(x.qty||0)));
 const invoiceIds=new Set(invoices.map(v=>String(v.id))),moves=paFStockRows().filter(m=>m.type==='Dispatch / sale issue'&&invoiceIds.has(String(m.invoiceId)));
 moves.forEach(m=>get(m).dispatched+=Number(m.qty||0));
 return [...rows.values()].filter(r=>r.style||r.colour||r.size).sort((a,b)=>a.style.localeCompare(b.style)||a.colour.localeCompare(b.colour)||a.size.localeCompare(b.size));
}
if(typeof salesOrderProgressHtml==='function'){
 const paFBaseProgress=salesOrderProgressHtml;
 salesOrderProgressHtml=function(o){
  const base=paFBaseProgress(o),rows=paFOrderVariantRows(o);if(!rows.length)return base;
  const fmt=n=>Number(n||0).toLocaleString('en-IN'),table='<div class="tablewrap" style="overflow-x:auto"><table><thead><tr><th>Style</th><th>Colour</th><th>Size</th><th>Ordered</th><th>MO planned</th><th>Produced*</th><th>QC accepted</th><th>Packed</th><th>Invoiced</th><th>Dispatched</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.style)+'</td><td>'+esc(r.colour)+'</td><td>'+esc(r.size)+'</td><td>'+fmt(r.ordered)+'</td><td>'+fmt(r.planned)+'</td><td>'+fmt(r.produced)+'</td><td>'+fmt(r.qcAccepted)+'</td><td>'+fmt(r.packed)+'</td><td>'+fmt(r.invoiced)+'</td><td>'+fmt(r.dispatched)+'</td></tr>').join('')+'</tbody></table></div><p class="hint">Variant reconciliation uses linked local order, MO, QC, packing, invoice and posted dispatch records. *Produced is the recorded Quality Check stage quantity; MO stage completion is recorded only at whole-MO level; size-level production is shown as — rather than allocating a guessed split. QC, packed, invoiced and dispatched remain size-specific. Review exceptions before relying on legacy records.</p>';
  return base+'<section class="card"><h3>Variant-wise fulfilment reconciliation</h3>'+table+'</section>';
 };
}
