const JSON_HEADERS = {"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});}
async function authorized(request,env,secretName="SYNC_TOKEN"){
  const header=request.headers.get("authorization")||"";
  const supplied=header.startsWith("Bearer ")?header.slice(7):"";
  const expected=env[secretName]||"";
  if(!expected||!supplied)return false;
  const enc=new TextEncoder();
  const a=await crypto.subtle.digest("SHA-256",enc.encode(supplied));
  const b=await crypto.subtle.digest("SHA-256",enc.encode(expected));
  const x=new Uint8Array(a),y=new Uint8Array(b);
  let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];
  return diff===0;
}
function validKey(value){return typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);}
function validPhone(value){return typeof value==="string"&&/^[1-9][0-9]{7,14}$/.test(value);}
function safeText(value,max=500){return typeof value==="string"&&value.trim().length>0&&value.length<=max;}
async function hmacHex(secret,raw){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(raw)));
  return Array.from(sig,b=>b.toString(16).padStart(2,"0")).join("");
}
function constantTimeEqual(a,b){if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function templatePayload(job,phone){
  const values=JSON.parse(job.parameters_json);
  return {messaging_product:"whatsapp",to:phone,type:"template",template:{name:job.template_name,language:{code:job.language_code},components:[{type:"body",parameters:values.map(text=>({type:"text",text:String(text)}))}]}};
}
async function processWhatsAppQueue(env){
  if(!env.DB||!env.WHATSAPP_ACCESS_TOKEN||!env.WHATSAPP_PHONE_NUMBER_ID)return;
  const jobs=await env.DB.prepare("SELECT j.id,j.customer_ref,j.template_name,j.language_code,j.parameters_json,j.retry_count,c.phone_e164 FROM wa_reminder_jobs j JOIN wa_customer_contacts c ON c.customer_ref=j.customer_ref WHERE j.status='queued' AND j.scheduled_at<=? AND c.opted_in=1 ORDER BY j.scheduled_at LIMIT 10").bind(new Date().toISOString()).all();
  for(const job of jobs.results||[]){
    const claimed=await env.DB.prepare("UPDATE wa_reminder_jobs SET status='sending',updated_at=? WHERE id=? AND status='queued'").bind(new Date().toISOString(),job.id).run();
    if(!claimed.meta||claimed.meta.changes!==1)continue;
    try{
      const version=env.WHATSAPP_GRAPH_API_VERSION||"v27.0";
      const response=await fetch("https://graph.facebook.com/"+version+"/"+env.WHATSAPP_PHONE_NUMBER_ID+"/messages",{method:"POST",headers:{"authorization":"Bearer "+env.WHATSAPP_ACCESS_TOKEN,"content-type":"application/json"},body:JSON.stringify(templatePayload(job,job.phone_e164))});
      const data=await response.json().catch(()=>({}));
      if(response.ok&&data.messages&&data.messages[0]&&data.messages[0].id){
        await env.DB.prepare("UPDATE wa_reminder_jobs SET status='accepted',provider_message_id=?,provider_response=?,updated_at=? WHERE id=?").bind(data.messages[0].id,JSON.stringify(data).slice(0,4000),new Date().toISOString(),job.id).run();
      }else{
        const retryable=response.status===429||response.status>=500;
        const retry=retryable&&Number(job.retry_count)<2;
        await env.DB.prepare("UPDATE wa_reminder_jobs SET status=?,retry_count=retry_count+1,scheduled_at=?,provider_response=?,updated_at=? WHERE id=?").bind(retry?"queued":"failed",retry?new Date(Date.now()+Math.pow(2,Number(job.retry_count)+1)*60000).toISOString():new Date().toISOString(),JSON.stringify(data).slice(0,4000),new Date().toISOString(),job.id).run();
      }
    }catch(error){
      const retry=Number(job.retry_count)<2;
      await env.DB.prepare("UPDATE wa_reminder_jobs SET status=?,retry_count=retry_count+1,scheduled_at=?,provider_response=?,updated_at=? WHERE id=?").bind(retry?"queued":"failed",retry?new Date(Date.now()+Math.pow(2,Number(job.retry_count)+1)*60000).toISOString():new Date().toISOString(),String(error).slice(0,1000),new Date().toISOString(),job.id).run();
    }
  }
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==="GET"&&url.pathname==="/health")return reply({ok:true,service:"Prasad Business API",whatsapp:"server integration foundation; requires Meta credentials and customer consent"});
    if(url.pathname==="/api/whatsapp/webhook"&&request.method==="GET"){
      const mode=url.searchParams.get("hub.mode"),token=url.searchParams.get("hub.verify_token"),challenge=url.searchParams.get("hub.challenge");
      if(mode==="subscribe"&&env.WHATSAPP_VERIFY_TOKEN&&token===env.WHATSAPP_VERIFY_TOKEN)return new Response(challenge||"",{status:200,headers:{"content-type":"text/plain"}});
      return reply({error:"Webhook verification failed"},403);
    }
    if(url.pathname==="/api/whatsapp/webhook"&&request.method==="POST"){
      if(!env.WHATSAPP_APP_SECRET||!env.DB)return reply({error:"Webhook is not configured"},503);
      const raw=await request.text();
      const signature=(request.headers.get("x-hub-signature-256")||"").replace(/^sha256=/,"");
      const expected=await hmacHex(env.WHATSAPP_APP_SECRET,raw);
      if(!constantTimeEqual(signature,expected))return reply({error:"Invalid webhook signature"},401);
      let body;try{body=JSON.parse(raw);}catch{return reply({error:"Invalid JSON"},400);}
      for(const entry of body.entry||[])for(const change of entry.changes||[]){
        const value=change.value||{};
        for(const status of value.statuses||[]){
          const state=["sent","delivered","read","failed"].includes(status.status)?status.status:"unknown";
          await env.DB.prepare("UPDATE wa_reminder_jobs SET status=?,provider_response=?,updated_at=? WHERE provider_message_id=?").bind(state,JSON.stringify(status).slice(0,4000),new Date().toISOString(),status.id).run();
        }
        for(const message of value.messages||[]){
          const bodyText=String(message.text&&message.text.body||"").trim().toUpperCase();
          if(["STOP","UNSUBSCRIBE","OPT OUT","OPTOUT"].includes(bodyText)){
            const waId=String(message.from||"");
            await env.DB.prepare("UPDATE wa_customer_contacts SET opted_in=0,consent_updated_at=? WHERE phone_e164=?").bind(new Date().toISOString(),waId).run();
          }
        }
      }
      return reply({ok:true});
    }
    if(!["POST","GET"].includes(request.method))return reply({error:"Method not allowed"},405);
    if(url.pathname!=="/api/sync"&&url.pathname!=="/api/latest"&&url.pathname!=="/api/whatsapp/consent"&&url.pathname!=="/api/whatsapp/reminders")return reply({error:"Not found"},404);
    if(!await authorized(request,env,url.pathname.startsWith("/api/whatsapp/")?"WHATSAPP_SERVICE_TOKEN":"SYNC_TOKEN"))return reply({error:"Unauthorized"},401);
    if(!env.DB)return reply({error:"Database binding is missing"},503);
    if(request.method==="POST"&&url.pathname==="/api/sync"){
      const length=Number(request.headers.get("content-length")||0);
      if(length>1400000)return reply({error:"Payload too large"},413);
      let raw;try{raw=await request.text();}catch{return reply({error:"Invalid request body"},400);}
      if(raw.length>1400000)return reply({error:"Payload too large"},413);
      let body;try{body=JSON.parse(raw);}catch{return reply({error:"Invalid JSON"},400);}
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
    if(request.method==="POST"&&url.pathname==="/api/whatsapp/consent"){
      let body;try{body=await request.json();}catch{return reply({error:"Invalid JSON"},400);}
      const {customer_ref,phone_e164,opted_in,consent_source}=body||{};
      if(!safeText(customer_ref,120)||!validPhone(phone_e164)||typeof opted_in!=="boolean")return reply({error:"customer_ref, valid E.164 phone digits and opted_in boolean are required"},400);
      if(opted_in&&!safeText(consent_source,300))return reply({error:"Record the source of customer opt-in before enabling reminders"},400);
      const now=new Date().toISOString();
      await env.DB.prepare("INSERT INTO wa_customer_contacts (customer_ref,phone_e164,opted_in,consent_source,consent_updated_at) VALUES (?,?,?,?,?) ON CONFLICT(customer_ref) DO UPDATE SET phone_e164=excluded.phone_e164,opted_in=excluded.opted_in,consent_source=excluded.consent_source,consent_updated_at=excluded.consent_updated_at").bind(customer_ref,phone_e164,opted_in?1:0,opted_in?consent_source:"customer opt-out",now).run();
      if(!opted_in)await env.DB.prepare("UPDATE wa_reminder_jobs SET status='cancelled',updated_at=? WHERE customer_ref=? AND status='queued'").bind(now,customer_ref).run();
      return reply({ok:true,customer_ref,opted_in});
    }
    if(request.method==="POST"&&url.pathname==="/api/whatsapp/reminders"){
      let body;try{body=await request.json();}catch{return reply({error:"Invalid JSON"},400);}
      const {reminder_id,customer_ref,invoice_ref,stage,template_name,language_code,parameters,scheduled_at}=body||{};
      if(!safeText(reminder_id,160)||!safeText(customer_ref,120)||!safeText(invoice_ref,120)||!safeText(stage,40)||!safeText(template_name,120)||!safeText(language_code,20)||!Array.isArray(parameters)||parameters.length>10||!parameters.every(v=>(typeof v==="string"||typeof v==="number")&&String(v).length<=500))return reply({error:"Invalid reminder fields or template parameters"},400);
      const contact=await env.DB.prepare("SELECT opted_in FROM wa_customer_contacts WHERE customer_ref=?").bind(customer_ref).first();
      if(!contact||contact.opted_in!==1)return reply({error:"Customer has not opted in to WhatsApp reminders"},409);
      const when=scheduled_at?new Date(scheduled_at):new Date();
      if(Number.isNaN(when.getTime()))return reply({error:"Invalid scheduled_at"},400);
      const now=new Date().toISOString();
      try{
        await env.DB.prepare("INSERT INTO wa_reminder_jobs (id,customer_ref,invoice_ref,stage,template_name,language_code,parameters_json,status,scheduled_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'queued',?,?,?)").bind(reminder_id,customer_ref,invoice_ref,stage,template_name,language_code,JSON.stringify(parameters),when.toISOString(),now,now).run();
      }catch(error){
        if(String(error).toLowerCase().includes("unique"))return reply({ok:true,duplicate:true,reminder_id});
        throw error;
      }
      return reply({ok:true,queued:true,reminder_id,status:"queued"},202);
    }
    return reply({error:"Not found"},404);
  },
  async scheduled(event,env,ctx){ctx.waitUntil(processWhatsAppQueue(env));}
};
