/* Canonical inventory movement contract.
 * This is a compatibility/preview foundation only: it does not migrate or post
 * existing records. Legacy ledgers remain authoritative until each workflow is
 * explicitly switched and reconciled.
 */
(function(root){
 'use strict';
 const VERSION='1';
 const norm=v=>String(v??'').trim();
 const lower=v=>norm(v).toLowerCase();
 const number=v=>{const n=Number(v);return Number.isFinite(n)?n:NaN};
 const stable=(parts)=>parts.map(v=>encodeURIComponent(norm(v))).join('|');
 function normalizeGarment(row,index){
  const type=norm(row.type),qty=number(row.qty);
  if(!Number.isFinite(qty)||qty<=0)return {ok:false,index,reason:'Quantity must be positive'};
  const out=['Dispatch / sale issue','Stock adjustment out'].includes(type);
  const quarantined=type==='Customer return'&&row.status!=='released';
  const style=norm(row.style),colour=norm(row.colour),size=norm(row.size);
  const sourceId=norm(row.id||row.reference||('legacy-garment-'+index));
  return {ok:true,record:{
   movementId:'LEGACY-GARMENT:'+sourceId,domain:'finished-garment',itemId:style||null,itemName:norm(row.description)||style,
   style,colour,size,unit:'Pcs',quantity:qty,signedQty:out?-qty:qty,
   movementType:type,date:norm(row.date),sourceSystem:'pa_garment_stock_ledger_v1',
   sourceId,sourceRef:norm(row.reference),status:quarantined?'quarantine':norm(row.status)||'posted',
   location:norm(row.location),legacy:true,allocationStatus:style&&colour&&size?'allocated':'unallocated-review'
  }};
 }
 function normalizeMaterial(row,index){
  const qty=number(row.qty),direction=norm(row.direction).toUpperCase();
  if(!Number.isFinite(qty)||qty<=0)return {ok:false,index,reason:'Quantity must be positive'};
  if(!['IN','OUT'].includes(direction))return {ok:false,index,reason:'Direction must be IN or OUT'};
  const item=norm(row.item),unit=norm(row.unit);
  const sourceId=norm(row.id||row.reference||('legacy-material-'+index));
  return {ok:true,record:{
   movementId:'LEGACY-MATERIAL:'+sourceId,domain:'material',itemId:norm(row.itemId)||null,itemName:item,
   style:'',colour:'',size:'',unit,quantity:qty,signedQty:direction==='IN'?qty:-qty,
   movementType:norm(row.purpose)||direction,date:norm(row.date),sourceSystem:'pa_stock_moves_v1',
   sourceId,sourceRef:norm(row.reference),status:'posted',location:norm(row.location),
   legacy:true,allocationStatus:item&&unit?'allocated-by-legacy-name':'unallocated-review'
  }};
 }
 function normalizeGarmentRows(rows){return (Array.isArray(rows)?rows:[]).map(normalizeGarment)}
 function normalizeMaterialRows(rows){return (Array.isArray(rows)?rows:[]).map(normalizeMaterial)}
 function balance(records,match){
  return (Array.isArray(records)?records:[]).reduce((sum,r)=>{
   if(!r||r.domain!==match.domain||r.unit!==match.unit)return sum;
   if(match.domain==='finished-garment'){
    if(lower(r.style)!==lower(match.style)||lower(r.colour)!==lower(match.colour)||lower(r.size)!==lower(match.size))return sum;
   }else if(lower(r.itemId||r.itemName)!==lower(match.itemId||match.itemName))return sum;
   if(r.status==='quarantine')return sum;
   return sum+number(r.signedQty||0);
  },0);
 }
 function preview(garmentRows,materialRows){
  const all=[...normalizeGarmentRows(garmentRows),...normalizeMaterialRows(materialRows)];
  const valid=all.filter(x=>x.ok).map(x=>x.record),invalid=all.filter(x=>!x.ok);
  const seen=new Map(),duplicates=[];
  valid.forEach(r=>{if(seen.has(r.movementId))duplicates.push({movementId:r.movementId,first:seen.get(r.movementId),duplicate:r.sourceSystem});else seen.set(r.movementId,r.sourceSystem)});
  return {version:VERSION,records:valid,invalid,duplicates,unallocated:valid.filter(r=>r.allocationStatus==='unallocated-review').length,
   warning:'Preview only. Do not import this result until source totals, duplicate references, units and unallocated legacy rows are reconciled.'};
 }
 root.PAInventoryLedger={VERSION,normalizeGarmentRows,normalizeMaterialRows,balance,preview};
})(typeof globalThis!=='undefined'?globalThis:this);
