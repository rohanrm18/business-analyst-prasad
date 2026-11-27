(function(root){
 'use strict';
 function applyBackupEntries(storage,entries,clearKeys){
  if(!storage||!Array.isArray(entries)||!Array.isArray(clearKeys))throw new TypeError('Invalid backup restore arguments.');
  const touched=new Set([...clearKeys,...entries.map(x=>x&&x[0])]);
  const before=new Map();
  for(const key of touched)before.set(key,storage.getItem(key));
  try{
   for(const key of clearKeys)storage.removeItem(key);
   for(const pair of entries){
    if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||typeof pair[1]!=='string')throw new TypeError('Invalid backup entry.');
    storage.setItem(pair[0],pair[1]);
   }
  }catch(error){
   let rollbackError=null;
   for(const [key,value] of before){
    try{if(value===null)storage.removeItem(key);else storage.setItem(key,value);}
    catch(e){rollbackError=rollbackError||e;}
   }
   if(rollbackError)throw new Error('Restore failed and rollback was incomplete: '+rollbackError.message,{cause:error});
   throw error;
  }
 }
 const api={applyBackupEntries};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.PrBackupCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
