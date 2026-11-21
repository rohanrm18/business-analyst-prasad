const JSON_HEADERS = {"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});}
async function authorized(request,env){
  const header=request.headers.get("authorization")||"";
  const supplied=header.startsWith("Bearer ")?header.slice(7):"";
  if(!env.SYNC_TOKEN||!supplied)return false;
  const enc=new TextEncoder();
  const a=await crypto.subtle.digest("SHA-256",enc.encode(supplied));
  const b=await crypto.subtle.digest("SHA-256",enc.encode(env.SYNC_TOKEN));
  const x=new Uint8Array(a),y=new Uint8Array(b);
  let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];
  return diff===0;
}
function validKey(value){return typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==="GET"&&url.pathname==="/health")return reply({ok:true,service:"Prasad encrypted sync API",mode:"foundation"});
    if(!["POST","GET"].includes(request.method))return reply({error:"Method not allowed"},405);
    if(url.pathname!=="/api/sync"&&url.pathname!=="/api/latest")return reply({error:"Not found"},404);
    if(!await authorized(request,env))return reply({error:"Unauthorized"},401);
    if(!env.DB)return reply({error:"Database binding is missing"},503);
    if(request.method==="POST"&&url.pathname==="/api/sync"){
      const length=Number(request.headers.get("content-length")||0);
      if(length>1400000)return reply({error:"Payload too large"},413);
      let body;try{body=await request.json();}catch{return reply({error:"Invalid JSON"},400);}
      const {company_key,encrypted_payload}=body||{};
      if(!validKey(company_key))return reply({error:"company_key must be a SHA-256 hex identifier"},400);
      if(typeof encrypted_payload!=="string"||encrypted_payload.length<16||encrypted_payload.length>1300000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encrypted_payload))return reply({error:"encrypted_payload must be base64 ciphertext within the size limit"},400);
      const now=new Date().toISOString();
      await env.DB.prepare("INSERT INTO sync_snapshots (company_key, encrypted_payload, synced_at) VALUES (?, ?, ?) ON CONFLICT(company_key) DO UPDATE SET encrypted_payload=excluded.encrypted_payload, synced_at=excluded.synced_at").bind(company_key,encrypted_payload,now).run();
      return reply({ok:true,synced_at:now,stored:"ciphertext"});
    }
    if(request.method==="GET"&&url.pathname==="/api/latest"){
      const key=url.searchParams.get("company_key");
      if(!validKey(key))return reply({error:"A valid company_key is required"},400);
      const row=await env.DB.prepare("SELECT encrypted_payload, synced_at FROM sync_snapshots WHERE company_key=?").bind(key).first();
      if(!row)return reply({found:false});
      return reply({found:true,encrypted_payload:row.encrypted_payload,synced_at:row.synced_at});
    }
    return reply({error:"Not found"},404);
  }
};
