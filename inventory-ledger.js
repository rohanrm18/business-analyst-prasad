/* Canonical inventory movement contract.
 * Strict, deterministic preview/normalization only. Legacy ledgers remain authoritative
 * until each workflow is explicitly switched and reconciled.
 */
(function(root){
 'use strict';
 const VERSION='2';
 const norm=v=>String(v??'').trim();
 const lower=v=>norm(v).toLowerCase();
 const number=v=>{const n=Number(v);return Number.isFinite(n)?n:NaN};
 const GARMENT_IN=new Set(['Opening balance','Production receipt','Purchase inward','Customer return','Stock adjustment in']);
 const GARMENT_OUT=new Set(['Dispatch / sale issue','Stock adjustment out']);
 function stableValue(value){
  if(Array.isArray(value))return '['+value.map(stableValue).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stableValue(value[k])).join(',')+'}';
  return JSON.stringify(value);
 }
 function hash(value){
  const text=typeof value==='string'?value:stableValue(value);let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(36);
 }
 function sourceIdentity(row,ledger,occurrences){
  const explicit=norm(row&&row.id);
  if(explicit)return ledger+':'+explicit;
  const fingerprint=stableValue(row||{}),base=ledger+':content:'+hash(fingerprint);
  const count=(occurrences.get(base)||0)+1;occurrences.set(base,count);
  return base+(count>1?':'+count:'');
 }
 function normalizeGarment(row,index,occurrences){
  row=row&&typeof row==='object'?row:{};
  const type=norm(row.type),qty=number(row.qty),style=norm(row.style),colour=norm(row.colour),size=norm(row.size);
  if(!style)return {ok:false,index,reason:'Missing style'};
  if(!Number.isFinite(qty)||qty<=0)return {ok:false,index,reason:'Quantity must be positive'};
  if(!GARMENT_IN.has(type)&&!GARMENT_OUT.has(type))return {ok:false,index,reason:'Unknown garment movement type: '+(type||'(blank)')};
  const sourceId=sourceIdentity(row,'garment',occurrences),out=GARMENT_OUT.has(type);
  const quarantined=type==='Customer return'&&row.status!=='released';
  return {ok:true,record:{
   movementId:'LEGACY-GARMENT:'+sourceId,domain:'finished-garment',itemId:style,itemName:norm(row.description)||style,
   style,colour,size,unit:'Pcs',quantity:qty,signedQty:out?-qty:qty,
   movementType:type,date:norm(row.date),sourceSystem:'pa_garment_stock_ledger_v1',
   sourceId,sourceRef:norm(row.reference),status:quarantined?'quarantine':norm(row.status)||'posted',
   location:norm(row.location),legacy:true,allocationStatus:colour&&size?'allocated':'unallocated-review'
  }};
 }
 function normalizeMaterial(row,index,occurrences){
  row=row&&typeof row==='object'?row:{};
  const qty=number(row.qty),direction=norm(row.direction).toUpperCase(),item=norm(row.item),unit=norm(row.unit);
  if(!item)return {ok:false,index,reason:'Missing material item'};
  if(!unit)return {ok:false,index,reason:'Missing material unit'};
  if(!Number.isFinite(qty)||qty<=0)return {ok:false,index,reason:'Quantity must be positive'};
  if(!['IN','OUT'].includes(direction))return {ok:false,index,reason:'Direction must be IN or OUT'};
  const sourceId=sourceIdentity(row,'material',occurrences);
  return {ok:true,record:{
   movementId:'LEGACY-MATERIAL:'+sourceId,domain:'material',itemId:norm(row.itemId)||null,itemName:item,
   style:'',colour:'',size:'',unit,quantity:qty,signedQty:direction==='IN'?qty:-qty,
   movementType:norm(row.purpose)||direction,date:norm(row.date),sourceSystem:'pa_stock_moves_v1',
   sourceId,sourceRef:norm(row.reference),status:'posted',location:norm(row.location),
   legacy:true,allocationStatus:'allocated-by-legacy-name'
  }};
 }
 function normalizeRows(rows,ledger,normalizer){
  const occurrences=new Map();
  return (Array.isArray(rows)?rows:[]).map((row,index)=>normalizer(row,index,occurrences));
 }
 function normalizeGarmentRows(rows){return normalizeRows(rows,'garment',normalizeGarment)}
 function normalizeMaterialRows(rows){return normalizeRows(rows,'material',normalizeMaterial)}
 function balance(records,match){
  return (Array.isArray(records)?records:[]).reduce((sum,r)=>{
   if(!r||r.domain!==match.domain||r.unit!==match.unit)return sum;
   if(match.domain==='finished-garment'){
    if(lower(r.style)!==lower(match.style)||lower(r.colour)!==lower(match.colour)||lower(r.size)!==lower(match.size))return sum;
   }else if(match.itemId?lower(r.itemId)!==lower(match.itemId):lower(r.itemName)!==lower(match.itemName))return sum;
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
   warning:'Preview only. Do not import this result until source totals, duplicate IDs, units and unallocated legacy rows are reconciled.'};
 }
 root.PAInventoryLedger={VERSION,normalizeGarmentRows,normalizeMaterialRows,balance,preview};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.PAInventoryLedger;
})(typeof globalThis!=='undefined'?globalThis:this);
