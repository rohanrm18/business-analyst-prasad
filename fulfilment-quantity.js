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
 const qcRefs=new Set(qc.map(q=>String(q.receiptRef||''))),moPrefixes=[...ids].map(id=>'PA-QC:QC-'+encodeURIComponent(id)+'-');
 stock.filter(m=>moPrefixes.some(prefix=>String(m.reference||'').startsWith(prefix))&&!qcRefs.has(String(m.reference||''))).forEach(m=>issues.push({type:'orphan-stock-receipt',reference:m.reference,qty:Number(m.qty||0)}));
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


/* Job-work challan reconciliation: contractor returns are WIP outcomes, not finished stock. */
function paFJobworkAudit(challans,moOrders){
 const mos=Array.isArray(moOrders)?moOrders:[],byMo=new Map(mos.map(m=>[String(m.id),m])),rows=Array.isArray(challans)?challans:[],issues=[],seenIds=new Set(),seenNos=new Set(),sentByPlan=new Map();
 rows.forEach(j=>{
  const id=String(j.id||''),no=String(j.challanNo||'').trim().toLowerCase(),mo=byMo.get(String(j.mo||''));
  if(id&&seenIds.has(id))issues.push({type:'duplicate-challan-id',id});else if(id)seenIds.add(id);
  if(no&&seenNos.has(no))issues.push({type:'duplicate-challan-number',challanNo:j.challanNo});else if(no)seenNos.add(no);
  if(!mo){issues.push({type:'missing-manufacturing-order',challanNo:j.challanNo,moId:j.mo});return}
  const sent=Number(j.sent),accepted=Number(j.accepted||0),rejected=Number(j.rejected||0),rework=Number(j.rework||0);
  if(!Number.isInteger(sent)||sent<=0||![accepted,rejected,rework].every(Number.isInteger)||[accepted,rejected,rework].some(n=>n<0)||accepted+rejected+rework>sent){
   issues.push({type:'invalid-return-quantities',challanNo:j.challanNo,sent,accepted,rejected,rework});
  }
  if(j.returned!==undefined&&Number(j.returned)!==accepted+rejected+rework)issues.push({type:'returned-total-mismatch',challanNo:j.challanNo,recorded:Number(j.returned),calculated:accepted+rejected+rework});
  const operation=String(j.operation||'').trim().toLowerCase(),size=String(j.size||'').trim().toLowerCase(),key=[String(mo.id),operation,size].join('¦');
  sentByPlan.set(key,(sentByPlan.get(key)||0)+(Number.isFinite(sent)&&sent>0?sent:0));
 });
 sentByPlan.forEach((sent,key)=>{
  const [moId,operation,size]=key.split('¦'),mo=byMo.get(moId);
  const plan=String(mo?.sizes||'').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean).map(p=>{const z=p.match(/^(.+?)\s*[:=xX-]\s*(\d+)$/);return z?{size:z[1].trim().toLowerCase(),qty:Number(z[2])}:null}).filter(Boolean);
  const target=plan.length?(plan.find(p=>p.size===size)?.qty||0):Number(mo?.qty||0);
  if(sent>target)issues.push({type:'sent-exceeds-operation-plan',moId,operation,size,sent,planned:target});
 });
 return {challanCount:rows.length,issues};
}
if(typeof salesOrderProgressHtml==='function'){
 const paFJobBaseProgress=salesOrderProgressHtml;
 salesOrderProgressHtml=function(o){
  const base=paFJobBaseProgress(o),mos=(paFRead('pa_manufacturing_v1',{orders:[]}).orders||[]).filter(m=>String(m.sourceSalesOrderId||'')===String(o.id)&&!['cancelled','Cancelled'].includes(m.status||'')),ids=new Set(mos.map(m=>String(m.id))),jobs=paFRead('pa_jobwork_challans_v2',[]).filter(j=>ids.has(String(j.mo||''))),audit=paFJobworkAudit(jobs,mos);
  if(!audit.issues.length)return base;
  return base+'<p class="hint" role="status">Job-work reconciliation warning: '+audit.issues.length+' issue(s) found across '+audit.challanCount+' challan(s). Contractor accepted/rework/rejected quantities are not finished stock; only separately QC-accepted and reconciled production receipts count as saleable stock. Review the Contractor job work register.</p>';
 };
}


/* Contractor material custody: separate from on-hand stock until source-ledger cutover. */
function paFJobworkMaterialAudit(challans,movements){
 const jobs=Array.isArray(challans)?challans:[],rows=Array.isArray(movements)?movements:[],jobById=new Map(jobs.map(j=>[String(j.id),j])),issues=[],issuesById=new Set(),movementIds=new Set(),issued=new Map(),returned=new Map();
 rows.forEach((m,index)=>{
  const id=String(m.id||''),kind=String(m.kind||''),issueId=String(m.issueId||'');
  if(!id||movementIds.has(id))issues.push({type:'duplicate-or-missing-movement-id',id,index});else movementIds.add(id);
  if(!['issue','reusable-return','consumed','scrap'].includes(kind)){issues.push({type:'invalid-movement-kind',id,kind});return}
  const qty=Number(m.qty);
  if(!Number.isFinite(qty)||qty<=0){issues.push({type:'invalid-material-quantity',id,qty});return}
  const job=jobById.get(String(m.jobId||''));
  if(!job){issues.push({type:'missing-jobwork-challan',id,jobId:m.jobId});return}
  if(!String(m.itemId||m.item||'').trim()||!String(m.unit||'').trim()){issues.push({type:'missing-material-identity',id});return}
  if(kind==='issue'){
   if(issued.has(id))issues.push({type:'duplicate-material-issue',id});
   issued.set(id,{movement:m,qty,item:String(m.itemId||m.item).trim().toLowerCase(),unit:String(m.unit).trim().toLowerCase(),jobId:String(job.id)});
   return;
  }
  const source=issued.get(issueId);
  if(!source){issues.push({type:'return-without-issue',id,issueId});return}
  if(source.jobId!==String(job.id)||source.item!==String(m.itemId||m.item).trim().toLowerCase()||source.unit!==String(m.unit).trim().toLowerCase())issues.push({type:'material-return-identity-mismatch',id,issueId});
  returned.set(issueId,(returned.get(issueId)||0)+qty);
 });
 const balances=[];
 issued.forEach((x,id)=>{
  const back=returned.get(id)||0,pending=x.qty-back;
  if(back>x.qty+1e-9)issues.push({type:'material-return-exceeds-issue',issueId:id,issued:x.qty,returned:back});
  balances.push({issueId:id,jobId:x.jobId,item:x.movement.item||x.movement.itemId,unit:x.movement.unit,issued:x.qty,returned:back,pending:Math.max(0,pending)});
 });
 return {issueCount:issued.size,balances,issues};
}


/* Contractor rework cycle and operation cost estimate audits. */
function paFJobworkReworkAudit(challans,cycles){
 const jobs=Array.isArray(challans)?challans:[],rows=Array.isArray(cycles)?cycles:[],byJob=new Map(jobs.map(j=>[String(j.id),j])),byCycle=new Map(),issues=[],ids=new Set(),initial=new Map();
 rows.slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||Number(a.cycleNo||0)-Number(b.cycleNo||0)).forEach(c=>{
  const id=String(c.id||''),job=byJob.get(String(c.jobId||'')),qty=Number(c.qty),returned=Number(c.returnedQty||0);
  if(!id||ids.has(id))issues.push({type:'duplicate-or-missing-rework-cycle-id',id});ids.add(id);
  if(!job){issues.push({type:'missing-jobwork-challan',id,jobId:c.jobId});return}
  if(!Number.isInteger(qty)||qty<=0||!Number.isInteger(returned)||returned<0||returned>qty||(c.outcome&&c.outcome!=='Pending'&&returned!==qty))issues.push({type:'invalid-rework-cycle-quantity',id,qty,returned});
  if(!['Pending','Accepted','Rework','Rejected'].includes(c.outcome||'Pending'))issues.push({type:'invalid-rework-outcome',id,outcome:c.outcome});
  if(c.parentCycleId){
   const parent=byCycle.get(String(c.parentCycleId));
   if(!parent||parent.jobId!==c.jobId||parent.outcome!=='Rework')issues.push({type:'invalid-rework-parent',id,parentCycleId:c.parentCycleId});
   else {parent.childQty=(parent.childQty||0)+qty;if(parent.childQty>Number(parent.returnedQty||0))issues.push({type:'rework-child-exceeds-parent-return',id,parentCycleId:parent.id,childQty:parent.childQty,eligible:Number(parent.returnedQty||0)})}
  }else{
   const used=(initial.get(String(job.id))||0)+qty;initial.set(String(job.id),used);
   if(used>Number(job.rework||0))issues.push({type:'rework-cycles-exceed-challan-rework',jobId:job.id,used,eligible:Number(job.rework||0)});
  }
  if(c.outcome==='Pending'&&returned>0)issues.push({type:'pending-cycle-has-returned-quantity',id});
  if(c.outcome!=='Pending'&&returned===0)issues.push({type:'closed-cycle-missing-return-quantity',id});
  byCycle.set(id,c);
 });
 return {cycleCount:rows.length,issues,open:rows.filter(c=>(c.outcome||'Pending')==='Pending').length};
}
function paFOperationCostAudit(costs,challans){
 const jobs=new Map((Array.isArray(challans)?challans:[]).map(j=>[String(j.id),j])),rows=Array.isArray(costs)?costs:[],issues=[],ids=new Set();let total=0;
 rows.forEach(c=>{
  const id=String(c.id||''),job=jobs.get(String(c.jobId||'')),qty=Number(c.qty),rate=Number(c.rate),amount=Number(c.amount);
  if(!id||ids.has(id))issues.push({type:'duplicate-or-missing-operation-cost-id',id});ids.add(id);
  if(!job)issues.push({type:'operation-cost-missing-challan',id,jobId:c.jobId});
  if(!['per-piece','per-lot'].includes(c.basis)||!Number.isFinite(qty)||qty<=0||(c.basis==='per-piece'&&!Number.isInteger(qty))||!Number.isFinite(rate)||rate<0||!Number.isFinite(amount)||Math.abs(amount-(c.basis==='per-piece'?qty*rate:rate))>0.011)issues.push({type:'invalid-operation-cost-calculation',id});
  if(Number.isFinite(amount)&&amount>=0)total+=amount;
 });
 return {recordCount:rows.length,total:Math.round(total*100)/100,issues};
}


function paFProductionCostAudit(orders,cuts,trimMoves,jobs,jobCosts,materialRates,extraCosts){
 const os=Array.isArray(orders)?orders:[],cs=Array.isArray(cuts)?cuts:[],tm=Array.isArray(trimMoves)?trimMoves:[],js=Array.isArray(jobs)?jobs:[],jc=Array.isArray(jobCosts)?jobCosts:[],rs=Array.isArray(materialRates)?materialRates:[],xs=Array.isArray(extraCosts)?extraCosts:[];
 const result=os.filter(o=>o&&!['Cancelled','cancelled'].includes(o.status||'')).map(o=>{
  const mo=String(o.id),rateMap=new Map(rs.filter(r=>String(r.moId)===mo).map(r=>[String(r.materialType)+'|'+String(r.materialId),Number(r.rate)])),materials=[],missing=[];let materialTotal=0;
  const fabric=new Map();cs.filter(c=>String(c.moId||c.orderId)===mo).forEach(c=>{const id=String(c.rollId||''),qty=Number(c.used||0)+Number(c.wastage??c.waste??0);if(qty>0)fabric.set(id,(fabric.get(id)||0)+qty)});
  fabric.forEach((qty,id)=>{const rate=rateMap.get('Fabric|'+id);if(rate===undefined||!Number.isFinite(rate)||rate<0)missing.push({type:'Fabric',id,qty,unit:'m'});else{const amount=qty*rate;materialTotal+=amount;materials.push({type:'Fabric',id,qty,unit:'m',rate,amount})}});
  const accessories=new Map();tm.filter(t=>String(t.orderId||'')===mo).forEach(t=>{const id=String(t.itemId||'');if(id)accessories.set(id,(accessories.get(id)||0)+(t.kind==='OUT'?Number(t.qty||0):-Number(t.qty||0)))});
  accessories.forEach((qty,id)=>{if(qty<=0)return;const rate=rateMap.get('Accessory|'+id);if(rate===undefined||!Number.isFinite(rate)||rate<0)missing.push({type:'Accessory',id,qty,unit:'pcs'});else{const amount=qty*rate;materialTotal+=amount;materials.push({type:'Accessory',id,qty,unit:'pcs',rate,amount})}});
  const moJobs=js.filter(j=>String(j.mo||'')===mo),jobIds=new Set(moJobs.map(j=>String(j.id))),op=jc.filter(c=>jobIds.has(String(c.jobId))),operationTotal=op.reduce((n,c)=>n+Math.max(0,Number(c.amount)||0),0),extra=xs.filter(c=>String(c.moId)===mo),extraTotal=extra.reduce((n,c)=>n+Math.max(0,Number(c.amount)||0),0),planned=Number(o.qty||0),known=materialTotal+operationTotal+extraTotal;
  return {moId:mo,style:o.style||'',plannedQty:planned,materials,missing,materialTotal:Math.round(materialTotal*100)/100,operationCount:op.length,operationTotal:Math.round(operationTotal*100)/100,extraCount:extra.length,extraTotal:Math.round(extraTotal*100)/100,knownTotal:Math.round(known*100)/100,costPerPlannedPiece:planned>0&&!missing.length?Math.round(known/planned*100)/100:null,complete:missing.length===0};
 });
 return {orders:result,knownTotal:Math.round(result.reduce((n,o)=>n+o.knownTotal,0)*100)/100,uncostedMaterials:result.reduce((n,o)=>n+o.missing.length,0)};
}

function paFProductionRouteAudit(orders,stages,rows,today){
 const os=Array.isArray(orders)?orders:[],ss=Array.isArray(stages)?stages:[],rs=Array.isArray(rows)?rows:[],day=String(today||new Date().toISOString().slice(0,10)),issues=[],byOrder=new Map(),seen=new Set(),validById=new Map(),normalInputs=new Map(),reworkInputs=new Map();
 os.forEach(o=>byOrder.set(String(o.id),{orderId:String(o.id),style:o.style||'',plannedQty:Number(o.qty||0),stages:ss.map(stage=>({stage,input:0,good:0,rejected:0,rework:0,reworkPending:0,workers:{}}))}));
 const addIssue=(r,message)=>issues.push({id:r?.id||'',orderId:r?.orderId||'',message});
 rs.forEach(r=>{
  const id=String(r?.id||''),mo=String(r?.orderId||''),stage=String(r?.stage||''),si=ss.indexOf(stage),input=Number(r?.qtyIn),outputs=[r?.good,r?.rejected,r?.rework].map(Number),sum=outputs.reduce((n,x)=>n+x,0);
  let error='',parent=null;
  if(!id)error='Missing route entry ID';
  else if(seen.has(id))error='Duplicate route entry ID';
  else {seen.add(id);}
  if(!error&&!byOrder.has(mo))error='Manufacturing order not found';
  if(!error&&si<0)error='Unknown production stage';
  if(!error&&!String(r?.worker||'').trim())error='Worker / contractor is required';
  if(!error&&(!/^\d{4}-\d{2}-\d{2}$/.test(String(r?.date||''))||r.date>day))error='Invalid or future production date';
  if(!error&&(!Number.isInteger(input)||input<1||!outputs.every(Number.isInteger)||outputs.some(x=>x<0)||sum>input))error='Enter whole-piece quantities; good + rejected + rework cannot exceed input';
  if(!error&&r.reworkOfId){parent=validById.get(String(r.reworkOfId));if(!parent||String(parent.orderId)!==mo||parent.stage!==stage)error='Rework must link to an earlier valid batch from the same order and stage';else if(input>Number(parent.rework||0)-(reworkInputs.get(String(parent.id))||0))error='Rework input exceeds the parent batch rework balance';}
  if(!error&&!r.reworkOfId){const order=byOrder.get(mo),prior=si===0?order.plannedQty:order.stages[si-1].good,key=mo+'|'+stage,used=normalInputs.get(key)||0;if(input>prior-used)error='Input exceeds available quantity from the previous stage (available '+Math.max(0,prior-used)+')';}
  if(error){addIssue(r,error);return;}
  validById.set(id,r);
  if(parent)reworkInputs.set(String(parent.id),(reworkInputs.get(String(parent.id))||0)+input);
  else normalInputs.set(mo+'|'+stage,(normalInputs.get(mo+'|'+stage)||0)+input);
  const sr=byOrder.get(mo).stages[si],worker=String(r.worker).trim(),w=sr.workers[worker]||(sr.workers[worker]={input:0,good:0,rejected:0,rework:0});
  sr.input+=input;sr.good+=Number(r.good);sr.rejected+=Number(r.rejected);sr.rework+=Number(r.rework);
  w.input+=input;w.good+=Number(r.good);w.rejected+=Number(r.rejected);w.rework+=Number(r.rework);
 });
 byOrder.forEach(o=>o.stages.forEach(s=>{const valid=[...validById.values()].filter(r=>String(r.orderId)===o.orderId&&r.stage===s.stage);s.reworkPending=Math.max(0,valid.reduce((n,r)=>n+Number(r.rework||0),0)-valid.filter(r=>r.reworkOfId).reduce((n,r)=>n+Math.max(0,Number(r.qtyIn)||0),0));}));
 return {orders:[...byOrder.values()],issues,validCount:validById.size,invalidCount:issues.length};
}

function paFProductionAcceptanceAudit(orders,stages,routeRows,qcBatches,stockRows){
 const os=Array.isArray(orders)?orders:[],routes=paFProductionRouteAudit(os,stages,routeRows),result=[];
 os.forEach(o=>{
  const id=String(o.id),route=routes.orders.find(x=>x.orderId===id),packed=Number(route?.stages.find(x=>x.stage==='Packing')?.good||0),qc=(Array.isArray(qcBatches)?qcBatches:[]).filter(q=>String(q.moId)===id),accepted=qc.reduce((n,q)=>n+Math.max(0,Number(q.accepted)||0),0),receipt=paFQcReceiptAudit(qc,stockRows,[id]),issues=[];
  if(routes.issues.some(x=>String(x.orderId)===id))issues.push({type:'invalid-routing'});
  if(accepted>packed)issues.push({type:'qc-accepted-exceeds-packed',accepted,packed});
  if(receipt.issues.length)issues.push({type:'qc-receipt-reconciliation',count:receipt.issues.length});
  const verified=issues.length?0:Math.min(packed,receipt.verifiedAccepted);
  result.push({moId:id,packedGood:packed,qcAccepted:accepted,verifiedAccepted:verified,issues,acceptedOutputCostReady:verified>0});
 });
 return {orders:result,issues:result.flatMap(x=>x.issues.map(i=>({...i,moId:x.moId})))};
}

function paFProductionAcceptedCost(costAudit,acceptanceAudit){
 const costs=costAudit?.orders||[],acceptance=acceptanceAudit?.orders||[];
 return costs.map(c=>{const a=acceptance.find(x=>String(x.moId)===String(c.moId)),ready=!!c.complete&&!!a&&a.acceptedOutputCostReady&&Number(a.verifiedAccepted)>0;return {...c,packedGoodQty:Number(a?.packedGood||0),verifiedAcceptedQty:Number(a?.verifiedAccepted||0),costPerVerifiedAcceptedPiece:ready?Math.round(Number(c.knownTotal)/Number(a.verifiedAccepted)*100)/100:null};});
}


function paFProductionBomVariantQuantity(component,order){
 const variants=paFParseProductionVariantPlan(order),hasMatrix=!!String(order?.variantPlan||'').trim()||(Array.isArray(order?.variants)&&order.variants.length>0),colour=String(component?.garmentColour||'').trim().toLowerCase(),size=String(component?.size||'').trim().toLowerCase();
 if(!hasMatrix&&!variants.length){if(size){const m=String(order?.sizes||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean).map(x=>{const z=x.match(/^(.+?)\s*[:=xX-]\s*(\d+)$/);return z?{size:z[1].trim(),qty:Number(z[2])}:null}).filter(Boolean);const hit=m.find(x=>x.size.toLowerCase()===size);return {valid:!!hit,qty:hit?.qty??null,byVariant:{},reason:hit?'':'Size not found in MO size plan'};}return {valid:true,qty:Number(order?.qty||0),byVariant:{},reason:''};}
 const plan=paFProductionVariantMaterialPlan(order);if(!plan.valid)return {valid:false,qty:null,byVariant:{},reason:plan.issues.join('; ')};
 const selected=variants.filter(v=>(!colour||v.colour.toLowerCase()===colour)&&(!size||v.size.toLowerCase()===size));
 if(!selected.length)return {valid:false,qty:null,byVariant:{},reason:'No planned colour-size cell matches this BOM component.'};
 const byVariant={};selected.forEach(v=>byVariant[paFVariantKey(v.colour,v.size)]=v.qty);
 return {valid:true,qty:selected.reduce((n,v)=>n+v.qty,0),byVariant,reason:''};
}

function paFProductionVariantCostAudit(orders,cuts,trimMoves,jobs,jobCosts,materialRates,extraCosts,acceptanceAudit){
 const os=Array.isArray(orders)?orders:[],cs=Array.isArray(cuts)?cuts:[],tm=Array.isArray(trimMoves)?trimMoves:[],js=Array.isArray(jobs)?jobs:[],jc=Array.isArray(jobCosts)?jobCosts:[],rs=Array.isArray(materialRates)?materialRates:[],xs=Array.isArray(extraCosts)?extraCosts:[],accepted=acceptanceAudit?.orders||[];
 return os.filter(o=>!['Cancelled','cancelled'].includes(o.status||'')).map(o=>{
  const mo=String(o.id),plan=paFProductionVariantMaterialPlan(o),cells=plan.rows.map(v=>({colour:v.colour,size:v.size,key:paFVariantKey(v.colour,v.size),plannedQty:v.qty,materials:0,operations:0,other:0,knownTotal:0,issues:[]})),byKey=new Map(cells.map(v=>[v.key,v])),rates=new Map(rs.filter(r=>String(r.moId)===mo).map(r=>[String(r.materialType)+'|'+String(r.materialId),Number(r.rate)])),issue=(v,type,detail)=>v.issues.push({type,detail}),find=(colour,size)=>byKey.get(paFVariantKey(colour,size));
  if(!plan.valid)cells.forEach(v=>issue(v,'invalid-variant-plan',plan.issues.join('; ')));
  cs.filter(x=>String(x.moId||x.orderId)===mo).forEach(x=>{const qty=Number(x.used||0)+Number(x.wastage??x.waste??0);if(qty<=0)return;const v=find(x.garmentColour||x.colour||o.colour,x.size);if(!v){cells.forEach(y=>issue(y,'fabric-cost-unallocated',String(x.id||x.rollId||'cut row')));return;}const rate=rates.get('Fabric|'+String(x.rollId||''));if(!Number.isFinite(rate)||rate<0){issue(v,'fabric-rate-missing',String(x.rollId||''));return;}v.materials+=qty*rate;});
  tm.filter(x=>String(x.orderId||'')===mo).forEach(x=>{const qty=(x.kind==='OUT'?1:-1)*Number(x.qty||0);if(qty<=0)return;const v=find(x.garmentColour||x.colour||o.colour,x.size);if(!v){cells.forEach(y=>issue(y,'accessory-cost-unallocated',String(x.id||x.itemId||'')));return;}const rate=rates.get('Accessory|'+String(x.itemId||''));if(!Number.isFinite(rate)||rate<0){issue(v,'accessory-rate-missing',String(x.itemId||''));return;}v.materials+=qty*rate;});
  const jm=new Map(js.filter(x=>String(x.mo||'')===mo).map(x=>[String(x.id),x]));jc.filter(x=>jm.has(String(x.jobId))).forEach(x=>{const j=jm.get(String(x.jobId)),v=find(j.colour||o.colour,j.size);if(!v){cells.forEach(y=>issue(y,'job-cost-unallocated',String(x.jobId)));return;}v.operations+=Math.max(0,Number(x.amount)||0);});
  const extras=xs.filter(x=>String(x.moId)===mo),shared=extras.filter(x=>!String(x.colour||'').trim()||!String(x.size||'').trim()),direct=extras.filter(x=>String(x.colour||'').trim()&&String(x.size||'').trim());
  direct.forEach(x=>{const v=find(x.colour,x.size);if(!v){cells.forEach(y=>issue(y,'extra-cost-variant-invalid',String(x.id||x.category||'')));return;}v.other+=Math.max(0,Number(x.amount)||0);});
  const sharedTotal=shared.reduce((n,x)=>n+Math.max(0,Number(x.amount)||0),0);if(sharedTotal>0){if(!plan.valid)cells.forEach(v=>issue(v,'shared-cost-cannot-allocate','Invalid variant plan'));else cells.forEach(v=>v.other+=sharedTotal*v.plannedQty/plan.total);}
  const a=accepted.find(x=>String(x.moId)===mo),verified=a?.verifiedByVariant||{};
  cells.forEach(v=>{v.materials=Math.round(v.materials*100)/100;v.operations=Math.round(v.operations*100)/100;v.other=Math.round(v.other*100)/100;v.knownTotal=Math.round((v.materials+v.operations+v.other)*100)/100;v.verifiedAcceptedQty=Number(verified[v.key]||0);v.complete=v.issues.length===0&&!!a&&!a.issues?.length;v.costPerVerifiedAcceptedPiece=v.complete&&v.verifiedAcceptedQty>0?Math.round(v.knownTotal/v.verifiedAcceptedQty*100)/100:null;});
  return {moId:mo,validPlan:plan.valid,variants:cells,knownTotal:Math.round(cells.reduce((n,v)=>n+v.knownTotal,0)*100)/100};
 });
}

function paFParseProductionVariantPlan(o){
 const rows=[];
 if(Array.isArray(o?.variants)&&o.variants.length)o.variants.forEach(v=>rows.push({colour:String(v.colour||'').trim(),size:String(v.size||'').trim(),qty:Number(v.qty)}));
 else if(String(o?.variantPlan||'').trim())String(o.variantPlan).split(/[;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(g=>{const p=g.split('|');if(p.length!==2){rows.push({colour:'',size:'',qty:NaN});return;}p[1].split(',').map(x=>x.trim()).filter(Boolean).forEach(c=>{const m=c.match(/^(.+?)\s*[:=xX-]\s*(\d+)$/);rows.push(m?{colour:p[0].trim(),size:m[1].trim(),qty:Number(m[2])}:{colour:p[0].trim(),size:'',qty:NaN});});});
 else String(o?.sizes||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(c=>{const m=c.match(/^(.+?)\s*[:=xX-]\s*(\d+)$/);rows.push(m?{colour:String(o?.colour||'').trim(),size:m[1].trim(),qty:Number(m[2])}:{colour:String(o?.colour||'').trim(),size:'',qty:NaN});});
 return rows;
}
function paFVariantKey(colour,size){return paFNorm(colour)+'¦'+paFNorm(size)}
function paFProductionVariantMaterialPlan(o){
 const rows=paFParseProductionVariantPlan(o),issues=[],seen=new Set(),qtyBySize={},qtyByVariant={};
 if(!rows.length)issues.push('A colour-size production plan is required.');
 rows.forEach(v=>{const k=paFVariantKey(v.colour,v.size);if(!v.colour||!v.size||!Number.isSafeInteger(v.qty)||v.qty<1)issues.push('Every variant needs a colour, size and positive whole-piece quantity.');else if(seen.has(k))issues.push('Duplicate colour-size cell: '+v.colour+' / '+v.size);else{seen.add(k);qtyBySize[v.size]=(qtyBySize[v.size]||0)+v.qty;qtyByVariant[k]=v.qty;}});
 const total=rows.reduce((n,v)=>n+(Number.isSafeInteger(v.qty)&&v.qty>0?v.qty:0),0);if(total!==Number(o?.qty||0))issues.push('Variant quantities total '+total+' but the manufacturing order quantity is '+Number(o?.qty||0)+'.');
 return {valid:issues.length===0,rows,qtyBySize,qtyByVariant,total,issues};
}
function paFProductionVariantAcceptanceAudit(orders,stages,routeRows,qcBatches,stockRows){
 const routes=paFProductionRouteAudit(orders,stages,routeRows),out=[];
 (Array.isArray(orders)?orders:[]).forEach(o=>{
  const id=String(o.id),plan=new Map(),issues=[],packedByVariant={},acceptedByVariant={},verifiedByVariant={},rows=(Array.isArray(routeRows)?routeRows:[]).filter(r=>String(r.orderId)===id),planRows=paFParseProductionVariantPlan(o);
  if(!planRows.length)issues.push({type:'missing-variant-plan'});
  planRows.forEach(v=>{const k=paFVariantKey(v.colour,v.size);if(!v.colour||!v.size||!Number.isSafeInteger(v.qty)||v.qty<1||plan.has(k))issues.push({type:'invalid-variant-plan',colour:v.colour,size:v.size});else plan.set(k,{colour:v.colour,size:v.size,qty:v.qty});});
  const total=[...plan.values()].reduce((n,v)=>n+v.qty,0);if(plan.size&&total!==Number(o.qty||0))issues.push({type:'variant-plan-total-mismatch',planned:total,moQty:Number(o.qty||0)});
  rows.forEach(r=>{const k=paFVariantKey(r.colour||o.colour,r.size);if(!r.size)issues.push({type:'routing-size-missing',entryId:r.id});if(!String(r.colour||o.colour||'').trim())issues.push({type:'routing-colour-missing',entryId:r.id});else if(!plan.has(k))issues.push({type:'routing-variant-not-in-plan',entryId:r.id});});
  if(!issues.length){let prior=new Map([...plan].map(([k,v])=>[k,v.qty]));(Array.isArray(stages)?stages:[]).forEach(stage=>{const current=new Map([...plan.keys()].map(k=>[k,0]));rows.filter(r=>r.stage===stage&&!r.reworkOfId).forEach(r=>{const k=paFVariantKey(r.colour||o.colour,r.size);current.set(k,(current.get(k)||0)+Number(r.qtyIn||0));});plan.forEach((v,k)=>{if((current.get(k)||0)>(prior.get(k)||0))issues.push({type:'variant-stage-input-exceeds-previous-good',stage,colour:v.colour,size:v.size});});const good=new Map([...plan.keys()].map(k=>[k,0]));rows.filter(r=>r.stage===stage).forEach(r=>{const k=paFVariantKey(r.colour||o.colour,r.size);good.set(k,(good.get(k)||0)+Number(r.good||0));});prior=good;});}
  plan.forEach((v,k)=>packedByVariant[k]=rows.filter(r=>r.stage==='Packing'&&paFVariantKey(r.colour||o.colour,r.size)===k).reduce((n,r)=>n+Number(r.good||0),0));
  const qc=(Array.isArray(qcBatches)?qcBatches:[]).filter(q=>String(q.moId)===id);qc.forEach(q=>{const k=paFVariantKey(q.colour||o.colour,q.size);acceptedByVariant[k]=(acceptedByVariant[k]||0)+Math.max(0,Number(q.accepted)||0);if(!plan.has(k))issues.push({type:'qc-variant-not-in-plan'});});
  plan.forEach((v,k)=>{if((acceptedByVariant[k]||0)>(packedByVariant[k]||0))issues.push({type:'variant-qc-accepted-exceeds-packed',colour:v.colour,size:v.size,accepted:acceptedByVariant[k],packed:packedByVariant[k]});});
  const receipt=paFQcReceiptAudit(qc,stockRows,[id]);if(receipt.issues.length)issues.push({type:'qc-receipt-reconciliation',count:receipt.issues.length});if(routes.issues.some(x=>String(x.orderId)===id))issues.push({type:'invalid-routing'});
  plan.forEach((v,k)=>verifiedByVariant[k]=issues.length?0:qc.filter(q=>paFVariantKey(q.colour||o.colour,q.size)===k).reduce((n,q)=>n+Math.max(0,Number(q.accepted)||0),0));
  const oneColour=new Set([...plan.values()].map(v=>paFNorm(v.colour))).size<=1,packedBySize={},verifiedBySize={};if(oneColour)plan.forEach((v,k)=>{packedBySize[v.size]=packedByVariant[k]||0;verifiedBySize[v.size]=verifiedByVariant[k]||0;});
  const packedGood=Object.values(packedByVariant).reduce((n,v)=>n+Number(v||0),0),qcAccepted=Object.values(acceptedByVariant).reduce((n,v)=>n+Number(v||0),0),verifiedAccepted=Object.values(verifiedByVariant).reduce((n,v)=>n+Number(v||0),0);out.push({moId:id,colour:o.colour||'',packedGood,qcAccepted,verifiedAccepted,acceptedOutputCostReady:issues.length===0&&verifiedAccepted>0,packedBySize,packedByVariant,acceptedByVariant,verifiedBySize,verifiedByVariant,issues});
 });
 return {orders:out,issues:out.flatMap(x=>x.issues.map(i=>({...i,moId:x.moId})))};
}


function paFProductionVariantMaterialConsumptionAudit(orders,bomRows,cuts,trimMoves,fabricLots,accessoryItems){
 const os=Array.isArray(orders)?orders:[],bs=Array.isArray(bomRows)?bomRows:[],cs=Array.isArray(cuts)?cuts:[],ts=Array.isArray(trimMoves)?trimMoves:[],fl=Array.isArray(fabricLots)?fabricLots:[],ai=Array.isArray(accessoryItems)?accessoryItems:[];
 return os.filter(o=>!['Cancelled','cancelled'].includes(o.status||'')).map(o=>{
  const mo=String(o.id),plan=paFProductionVariantMaterialPlan(o),variants=plan.rows.map(v=>({colour:v.colour,size:v.size,key:paFVariantKey(v.colour,v.size),plannedQty:v.qty,components:[],issues:[]})),issues=[];
  if(!plan.valid)issues.push({type:'invalid-variant-plan',detail:plan.issues.join('; ')});
  const components=bs.filter(x=>!x.moId||String(x.moId)===mo);
  if(!components.length)issues.push({type:'missing-bom',detail:'No BOM components supplied for this MO.'});
  const rollFor=rollId=>fl.find(r=>String(r.id)===String(rollId)),trimFor=itemId=>ai.find(r=>String(r.id)===String(itemId));
  components.forEach((c,index)=>{
   const demand=paFProductionBomVariantQuantity(c,o),kind=String(c.kind||''),materialId=kind==='Fabric'?String(c.code||'').trim().toLowerCase():String(c.itemId||'');
   if(!demand.valid){issues.push({type:'invalid-bom-demand',component:index,detail:demand.reason});return;}
   const targets=variants.filter(v=>Object.prototype.hasOwnProperty.call(demand.byVariant,v.key));
   targets.forEach(v=>{
    const required=demand.byVariant[v.key]*Number(c.perPiece||0)*(1+Number(c.wastePct||0)/100),row={component:index,kind,material:kind==='Fabric'?(c.code||''):((trimFor(c.itemId)?.code)||c.itemId||''),materialId,required,issued:0,returned:0,netIssued:0,used:null,wastage:null,actualRecorded:null,variance:null,status:'REVIEW',issues:[]};
    if(!Number.isFinite(required)||required<0){row.issues.push('Invalid BOM per-piece quantity or waste allowance.');}
    if(kind==='Fabric'){
     const mapped=fl.filter(r=>String(r.code||'').trim().toLowerCase()===materialId&&(!c.colour||paFNorm(r.colour)===paFNorm(c.colour)));
     if(!mapped.length)row.issues.push('No fabric roll maps to this BOM material code and fabric shade.');
     const ids=new Set(mapped.map(r=>String(r.id)));
     const moCuts=cs.filter(x=>String(x.moId||x.orderId)===mo),relevant=moCuts.filter(x=>ids.has(String(x.rollId)));
     moCuts.filter(x=>paFVariantKey(x.garmentColour||x.colour,x.size)===v.key&&!ids.has(String(x.rollId))).forEach(x=>row.issues.push('No fabric roll mapping for movement '+String(x.rollId||x.id||'unknown')+' to this BOM component.'));
     relevant.forEach(x=>{
      if(!String(x.garmentColour||x.colour||'').trim()||!String(x.size||'').trim()){row.issues.push('Fabric movement '+String(x.id||x.rollId)+' lacks garment colour or size; left unallocated.');return;}
      if(paFVariantKey(x.garmentColour||x.colour,x.size)!==v.key)return;
      row.issued+=Number(x.issued||0);row.returned+=Number(x.returned||0);row.used=(row.used||0)+Number(x.used||0);row.wastage=(row.wastage||0)+Number(x.wastage??x.waste??0);
     });
     row.netIssued=row.issued-row.returned;
     row.actualRecorded=row.used===null?null:row.used+(row.wastage||0);
     if(row.actualRecorded===null)row.issues.push('No recorded fabric used quantity; issue is not treated as consumption.');
     else row.variance=row.actualRecorded-required;
    }else if(kind==='Accessory'){
     const relevant=ts.filter(x=>String(x.orderId||'')===mo&&String(x.itemId||'')===String(c.itemId||''));
     relevant.forEach(x=>{
      if(!String(x.garmentColour||x.colour||'').trim()||!String(x.size||'').trim()){row.issues.push('Accessory movement '+String(x.id||x.itemId)+' lacks garment colour or size; left unallocated.');return;}
      if(paFVariantKey(x.garmentColour||x.colour,x.size)!==v.key)return;
      if(x.kind==='OUT')row.issued+=Number(x.qty||0);else if(x.kind==='IN')row.returned+=Number(x.qty||0);
     });
     row.netIssued=row.issued-row.returned;
     row.actualRecorded=null;
     row.variance=row.netIssued-required;
     row.issues.push('Net issued is a custody figure, not proof of physical accessory consumption.');
    }else row.issues.push('Unsupported BOM component kind: '+kind);
    if(row.issues.some(x=>x.includes('lacks garment colour or size')))issues.push({type:'unallocated-movement',component:index,variant:v.key});
    if(row.issues.some(x=>x.startsWith('No fabric roll')))issues.push({type:'missing-material-mapping',component:index,variant:v.key});
    if(row.variance!==null&&Number.isFinite(row.variance)&&Math.abs(row.variance)>0.0001)row.status=row.variance>0?'EXCESS':'SHORT';
    else if(!row.issues.length||row.issues.every(x=>x.includes('custody figure')))row.status='MATCH';
    if(row.issues.length)row.status='REVIEW';
    v.components.push(row);
   });
  });
  const cutRows=cs.filter(x=>String(x.moId||x.orderId)===mo),trimRows=ts.filter(x=>String(x.orderId||'')===mo);
  cutRows.filter(x=>!String(x.garmentColour||x.colour||'').trim()||!String(x.size||'').trim()).forEach(x=>issues.push({type:'unallocated-fabric-movement',detail:String(x.id||x.rollId||'cut row')}));
  trimRows.filter(x=>!String(x.garmentColour||x.colour||'').trim()||!String(x.size||'').trim()).forEach(x=>issues.push({type:'unallocated-accessory-movement',detail:String(x.id||x.itemId||'trim row')}));
  variants.forEach(v=>{v.complete=v.components.length>0&&v.components.every(c=>!c.issues.length&&c.variance!==null);});
  return {moId:mo,validPlan:plan.valid,variants,issues};
 });
}
