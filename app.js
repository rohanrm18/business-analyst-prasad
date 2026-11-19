if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
const workspace=document.getElementById('workspace');
const templates={
 sales:['Sales','Create sales voucher','Customer / ledger name','Invoice amount (₹)'],
 purchase:['Purchase','Create purchase voucher','Supplier / ledger name','Bill amount (₹)'],
 parties:['Parties','Party balances will appear here after Tally is connected.',''],
 reports:['Reports','Business reports will appear here after Tally is connected.','']
};
function show(page){
 document.querySelectorAll('.tabbar button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 if(page==='home'){location.hash='';return;}
 const t=templates[page]; if(!t)return;
 workspace.innerHTML=`<div class="section-head"><h3>${t[0]}</h3><span class="demo">NOT CONNECTED</span></div><div style="padding:0 16px 12px"><p style="font-size:13px;color:#667085">${t[1]}</p>${t[2]?`<label style="display:block;font-size:11px;margin:14px 0 5px">${t[2]}</label><input id="party" placeholder="Enter name" style="width:100%;padding:13px;border:1px solid #e1e4e9;border-radius:10px"><label style="display:block;font-size:11px;margin:14px 0 5px">${t[3]}</label><input id="amount" inputmode="decimal" placeholder="0.00" style="width:100%;padding:13px;border:1px solid #e1e4e9;border-radius:10px"><button id="save" style="margin-top:12px;width:100%;padding:13px;background:#182438;color:#e3c783;border:0;border-radius:10px">Save local draft</button><p id="result" style="font-size:11px;color:#8b6e38"></p>`:''}</div>`;
 const save=document.getElementById('save');if(save)save.onclick=()=>{document.getElementById('result').textContent='Draft preview only. This has NOT been saved to Tally.';};
}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.page)));
