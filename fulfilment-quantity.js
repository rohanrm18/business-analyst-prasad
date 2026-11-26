/* Finished-garment reservation and order variant reconciliation.
   Packing reserves stock; dispatch stock-ledger issues consume that reservation. */
const PA_FULFILMENT_RESERVATION_VERSION='1';
function paFRead(key,fallback=[]){try{const x=JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));return x??fallback}catch(_){return fallback}}
function paFNorm(v){return String(v??'').trim().toLowerCase()}
function paFKey(x){return [x.style??x.designNumber??x.itemNumber??'',x.colour??'',x.size??''].map(paFNorm).join('¦')}
function paFStyle(x){return String(x.designNumber||x.itemNumber||x.style||'').trim()}
function paFStockRows(){return paFRead('pa_garment_stock_ledger_v1',[])}

function paFQcReceiptAudit(qcBatches,stockRows,moIds){
 const ids=new Set((moIds||[]).map(String)),qc=(Array.isArray(qcBatches)?qcBatches:[]).filter(q=>ids.has(String(q.moId||''))&&Number(q.accepted||0)>0),stock=(Array.isArray(stockRows)?stockRows:[]).filter(x=>x&&x.type==='Production receipt'&&x.status==='posted'),byRef=new Map();
 stock.forEach(x=>{const ref=String(x.reference||'');if(!ref)return;const list=byRef.get(ref)||[];list.push(x);byRef.set(ref,list)});
 const seen=new Set(),issues=[];let verifiedAccepted=0,expectedAccepted=0;
 qc.forEach(q=>{
  const ref=String(q.receiptRef||'');expectedAccepted+=Number(q.accepted||0);
  if(!ref){issues.push({type:'missing-reference',batchId:q.id,qty:Number(q.accepted||0)});return}
  if(seen.has(ref)){issues.push({type:'duplicate-qc-reference',reference:ref});return}seen.add(ref);
  const matches=byRef.get(ref)||[];
  if(matches.length!==1){issues.push({type:matches.length?'duplicate-stock-receipt':'missing-stock-receipt',reference:ref,qty:Number(q.accepted||0)});return}
  const m=matches[0],same=Number(m.qty)===Number(q.accepted)&&paFNorm(m.style)===paFNorm(q.style)&&paFNorm(m.colour)===paFNorm(q.colour)&&paFNorm(m.size)===paFNorm(q.size);
  if(!same){issues.push({type:'receipt-mismatch',reference:ref,expected:Number(q.accepted||0),actual:Number(m.qty||0)});return}
  verifiedAccepted+=Number(q.accepted||0);
 });
 const qcRefs=new Set(qc.map(q=>String(q.receiptRef||'')));
 stock.filter(m=>String(m.reference||'').startsWith('PA-QC:')&&!qcRefs.has(String(m.reference||''))).forEach(m=>issues.push({type:'orphan-stock-receipt',reference:m.reference,qty:Number(m.qty||0)}));
 return {expectedAccepted,verifiedAccepted,issues};
}

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
 const blank=()=>({style:'',colour:'',size:'',ordered:0,planned:0,produced:0,producedSplit:true,qcAccepted:0,qcRework:0,qcRejected:0,qcInspected:0,cutPieces:0,stitching:0,jobworkSent:0,jobworkAccepted:0,jobworkRework:0,jobworkRejected:0,fabricBom:0,accessoryBom:0,accessoryIssued:0,accessoryReturned:0,fabricIssued:0,fabricUsed:0,fabricWaste:0,fabricReturned:0,packed:0,invoiced:0,dispatched:0});
 const get=x=>{const key=keyOf(x);if(!rows.has(key))rows.set(key,{...blank(),style:paFStyle(x),colour:String(x.colour||''),size:String(x.size||'')});return rows.get(key)};
 const add=(x,field,value)=>{const r=get(x);r[field]+=Number(value||0);};
 (order.items||[]).forEach(x=>{get(x).ordered+=Number(x.qty||0)});
 const mos=(paFRead('pa_manufacturing_v1',{orders:[]}).orders||[]),active=mos.filter(m=>String(m.sourceSalesOrderId||'')===orderId&&!['cancelled','Cancelled'].includes(m.status||''));
 const parsePlan=m=>String(m.sizes||'').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean).map(p=>{const z=p.match(/^(.+?)\s*[:=xX-]\s*(\d+)$/);return z?{size:z[1].trim(),qty:Number(z[2])}:null}).filter(Boolean);
 active.forEach(m=>{
  const plan=parsePlan(m),stages=m.progress||{},quality=Number(stages['Quality Check']||stages.quality||0),stitch=Number(stages.Stitching||0);
  const stageRow=get({style:m.style,colour:m.colour,size:'Unallocated'});stageRow.produced+=quality;stageRow.stitching+=stitch;
  if(plan.length)plan.forEach(p=>{const r=get({style:m.style,colour:m.colour,size:p.size});r.planned+=p.qty;r.producedSplit=false;});
  else stageRow.planned+=Number(m.qty||0);
  const components=(m.bomSnapshot&&Array.isArray(m.bomSnapshot.components))?m.bomSnapshot.components:[];
  components.forEach(x=>{
   const componentColour=x.colour||m.colour||'',field=x.kind==='Fabric'?'fabricBom':'accessoryBom';
   if(x.size){const qty=plan.find(p=>paFNorm(p.size)===paFNorm(x.size))?.qty;if(qty!==undefined)add({style:m.style,colour:componentColour,size:x.size},field,qty*Number(x.perPiece||0)*(1+Number(x.wastePct||0)/100));}
   else {const qty=Number(m.qty||0);if(plan.length)plan.forEach(p=>add({style:m.style,colour:componentColour,size:p.size},field,p.qty*Number(x.perPiece||0)*(1+Number(x.wastePct||0)/100)));else add({style:m.style,colour:componentColour,size:'Unallocated'},field,qty*Number(x.perPiece||0)*(1+Number(x.wastePct||0)/100));}
  });
 });
 const moById=new Map(active.map(m=>[String(m.id),m])),moIds=new Set(active.map(m=>String(m.id)));
 const qc=paFRead('pa_mfg_qc_v1',[]);
 qc.filter(q=>moIds.has(String(q.moId||''))).forEach(q=>{const m=moById.get(String(q.moId)),size=q.size||'Unallocated';const variant={style:q.style||m?.style,colour:q.colour||m?.colour,size};add(variant,'qcAccepted',q.accepted);add(variant,'qcRework',q.rework);add(variant,'qcRejected',q.rejected);add(variant,'qcInspected',q.inspected);});
 const cuts=paFRead('pa_cutting_batches_v1',[]);
 cuts.filter(x=>moIds.has(String(x.moId||''))).forEach(x=>{
  const m=moById.get(String(x.moId)),variant={style:x.style||m?.style,colour:x.colour||m?.colour,size:x.size||'Unallocated'};
  add(variant,'cutPieces',x.pieces);add(variant,'fabricIssued',x.issued);add(variant,'fabricUsed',x.used);add(variant,'fabricWaste',x.wastage);add(variant,'fabricReturned',x.returned);
 });
 const trimMoves=paFRead('pa_trim_moves_v1',[]);
 active.forEach(m=>trimMoves.filter(t=>String(t.orderId||'')===String(m.id)).forEach(t=>{const variant={style:m.style,colour:m.colour,size:t.size||'Unallocated'},field=t.kind==='OUT'?'accessoryIssued':'accessoryReturned';add(variant,field,t.qty);}));
 const jobs=paFRead('pa_jobwork_challans_v2',[]);
 jobs.filter(j=>moIds.has(String(j.mo||''))).forEach(j=>{
  const m=moById.get(String(j.mo)),variant={style:j.style||m?.style,colour:j.colour||m?.colour,size:j.size||'Unallocated'};
  add(variant,'jobworkSent',j.sent);add(variant,'jobworkAccepted',j.accepted);add(variant,'jobworkRework',j.rework);add(variant,'jobworkRejected',j.rejected);
 });
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
  const fmt=n=>Number(n||0).toLocaleString('en-IN'),table='<div class="tablewrap" style="overflow-x:auto"><table><thead><tr><th>Style</th><th>Colour</th><th>Size</th><th>Ordered</th><th>MO planned</th><th>Produced*</th><th>Cut pcs</th><th>Stitching stage</th><th>Job sent</th><th>Job accepted</th><th>Job rework</th><th>Job rejected</th><th>QC inspected</th><th>QC accepted</th><th>QC rework</th><th>QC rejected</th><th>BOM fabric m</th><th>BOM accessories pcs</th><th>Accessories issued pcs</th><th>Accessories returned pcs</th><th>Fabric issued m</th><th>Fabric used m</th><th>Fabric waste m</th><th>Fabric returned m</th><th>Packed</th><th>Invoiced</th><th>Dispatched</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.style)+'</td><td>'+esc(r.colour)+'</td><td>'+esc(r.size)+'</td><td>'+fmt(r.ordered)+'</td><td>'+fmt(r.planned)+'</td><td>'+(r.producedSplit?fmt(r.produced):'—')+'</td><td>'+fmt(r.cutPieces)+'</td><td>'+fmt(r.stitching)+'</td><td>'+fmt(r.jobworkSent)+'</td><td>'+fmt(r.jobworkAccepted)+'</td><td>'+fmt(r.jobworkRework)+'</td><td>'+fmt(r.jobworkRejected)+'</td><td>'+fmt(r.qcInspected)+'</td><td>'+fmt(r.qcAccepted)+'</td><td>'+fmt(r.qcRework)+'</td><td>'+fmt(r.qcRejected)+'</td><td>'+fmt(r.fabricBom)+'</td><td>'+fmt(r.accessoryBom)+'</td><td>'+fmt(r.accessoryIssued)+'</td><td>'+fmt(r.accessoryReturned)+'</td><td>'+fmt(r.fabricIssued)+'</td><td>'+fmt(r.fabricUsed)+'</td><td>'+fmt(r.fabricWaste)+'</td><td>'+fmt(r.fabricReturned)+'</td><td>'+fmt(r.packed)+'</td><td>'+fmt(r.invoiced)+'</td><td>'+fmt(r.dispatched)+'</td></tr>').join('')+'</tbody></table></div><p class="hint">Variant reconciliation uses linked local order, MO, QC, packing, invoice and posted dispatch records. *Produced is the recorded Quality Check stage quantity; Cutting and job-work records without a garment size are shown under Unallocated, never guessed into a size. BOM fabric requirement is estimated from the locked MO BOM; actual issue, used, wastage and reusable return come from posted cutting batches. Stitching is the MO cumulative stage figure; contractor job-work is shown separately and must not be added to it without checking for overlap. Review legacy records and unallocated quantities.</p>';
  return base+'<section class="card"><h3>Variant-wise fulfilment reconciliation</h3>'+table+'</section>';
 };
}

/* Dispatch must consume only the reservation belonging to its linked packing slip. */
function paFValidateDispatchReservation(invoice,dispatch,lines){
 if(dispatch&&['posted','legacy-unverified'].includes(dispatch.stockPostingStatus))return true;
 const slipId=String(invoice?.packing_slip_id||'');if(!slipId){alert('Dispatch blocked: invoice is not linked to an approved packing slip. Link/reconcile the source document first.');return false}
 const slip=paFSlipRows().find(s=>String(s.id)===slipId);if(!slip){alert('Dispatch blocked: the linked approved packing slip could not be found.');return false}
 const stock=paFStockRows(),slipInvoiceIds=new Set(paFInvoiceRows().filter(v=>String(v.packing_slip_id||'')===slipId).map(v=>String(v.id))),prior=stock.filter(m=>m.type==='Dispatch / sale issue'&&slipInvoiceIds.has(String(m.invoiceId))&&String(m.dispatchId)!==String(dispatch?.id||'')),needed=new Map();
 lines.forEach(line=>{const index=Number(line.itemIndex),it=invoice.items?.[index],q=Number(line.qty);if(!Number.isInteger(index)||index<0||!it||!Number.isInteger(q)||q<=0){needed.set('INVALID-LINE',Infinity);return}const key=paFKey({style:paFStyle(it),colour:it.colour,size:it.size});needed.set(key,(needed.get(key)||0)+q)});
 if(needed.has('INVALID-LINE')){alert('Dispatch blocked: every dispatch allocation must reference a valid invoice item and a positive whole-piece quantity.');return false}
 for(const [key,q] of needed){
  const packed=(slip.items||[]).filter(x=>paFKey(x)===key).reduce((n,x)=>n+Number(x.qty||0),0),already=prior.filter(m=>paFKey(m)===key).reduce((n,m)=>n+Number(m.qty||0),0),remaining=Math.max(0,packed-already);
  if(q>remaining){alert('Dispatch blocked: '+key.replace(/¦/g,' / ')+' has only '+remaining+' reserved pieces remaining on packing slip '+slip.number+'. Requested '+q+'. Correct the invoice/dispatch allocation first.');return false}
 }
 return true;
}
if(typeof paPostDispatchStock==='function'){
 const paFBasePostDispatchStock=paPostDispatchStock;
 paPostDispatchStock=function(invoice,dispatch){
  if(dispatch?.stockPostingStatus==='posted'||dispatch?.stockPostingStatus==='legacy-unverified')return paFBasePostDispatchStock(invoice,dispatch);
  const lines=(invoice.items||[]).map((x,i)=>({itemIndex:i,qty:Number(x.qty||0)}));
  if(!paFValidateDispatchReservation(invoice,dispatch,lines))return false;
  return paFBasePostDispatchStock(invoice,dispatch);
 };
}
if(typeof paMultiStock==='function'){
 const paFBaseMultiStock=paMultiStock;
 paMultiStock=function(invoice,dispatch){
  if(dispatch?.stockPostingStatus==='posted')return paFBaseMultiStock(invoice,dispatch);
  if(!paFValidateDispatchReservation(invoice,dispatch,dispatch.items||[]))return false;
  return paFBaseMultiStock(invoice,dispatch);
 };
}
