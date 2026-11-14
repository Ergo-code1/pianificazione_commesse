// Ergo Plan – Area Manutenzione
// Dati su Firestore: app/manut (configurazione + attività aperte), manutStorico/{anno} (attività chiuse),
// manutFoto/{id} e manutDoc/{id} (foto e documenti, max ~700 KB ciascuno).
(function(){
const MN={tab:null,f:{imp:'',stato:'',man:'',proc:'',q:'',da:'',a:''},anno:String(new Date().getFullYear()),ready:false,cfgImp:null,cfgTipo:'',ex:null,focus:null,tmpSteps:[],tmpDoc:null};
let M={tipi:[],proc:[],imp:[],ass:[],att:[],anni:[],nextId:1};
const H={};            // storico per anno (cache)
const BL={};           // cache foto/documenti
const STEP_FOTO_MAX=1600;
const e_=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tdy=()=>todayL();
const addM=(d,m)=>{const x=new Date(d+'T12:00:00');const day=x.getDate();x.setDate(1);x.setMonth(x.getMonth()+Number(m));const last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();x.setDate(Math.min(day,last));return isoL(x)};
const fd=d=>d?d.split('-').reverse().join('/'):'—';
const nid=p=>p+(M.nextId++).toString(36)+Math.random().toString(36).slice(2,5);
const TIPI={cal:'Ricorrente a calendario',ultima:'Da ultima chiusura',evento:'A evento'};
const isR=()=>typeof can==='function'&&can('manut');
const me=()=>S.user&&S.user.nome;
const P=id=>M.proc.find(x=>x.id===id),I=id=>M.imp.find(x=>x.id===id),T=id=>M.tipi.find(x=>x.id===id);
const CMP=a=>{const i=I(a.imp);const c=i&&(i.comps||[]).find(x=>x.id===a.comp);return c?c.sigla:''};
const freq=p=>TIPI[p.tipo]+(p.tipo!=='evento'?' · ogni '+p.int+' mesi':'');
function mt(t){const el=document.getElementById('mnToast')||Object.assign(document.body.appendChild(document.createElement('div')),{id:'mnToast',className:'mn-toast'});el.textContent=t;el.hidden=false;clearTimeout(el._t);el._t=setTimeout(()=>el.hidden=true,3200)}

// ---------- persistenza ----------
let svT=null,lastM='';
function saveM(){clearTimeout(svT);svT=setTimeout(()=>{const d=JSON.stringify(M);if(d===lastM)return;lastM=d;
 if(d.length>900000)mt('Attenzione: dati manutenzione vicini al limite di 1 MB');
 window.FBM.save(JSON.parse(d)).catch(er=>mt('Salvataggio manutenzione non riuscito: '+FB.err(er)))},400)}
function onRemote(d){const txt=JSON.stringify(d||{});if(txt===lastM)return;lastM=txt;M=Object.assign({tipi:[],proc:[],imp:[],ass:[],att:[],anni:[],nextId:1},d||{});MN.ready=true;
 const o=document.getElementById('mnOvl');if(o&&!o.hidden)return;
 if(S.tab==='manut'&&!(document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)))draw()}
function start(){if(!window.FBM||window.FBM._u)return;MN.err=null;window.FBM.listen(d=>{if(d===null){MN.ready=true;if(isR()&&!M.tipi.length)seedBase();draw();return}onRemote(d)},er=>{MN.err=FB.err(er);draw()})}
async function storico(y){y=String(y);if(!H[y]){H[y]=await window.FBM.getY(y).catch(er=>{mt('Storico non leggibile: '+FB.err(er));return[]})}return H[y]}
async function blob(col,id){if(!id)return null;if(BL[id])return BL[id];const d=await window.FBM.getBlob(col,id).catch(()=>null);if(d)BL[id]=d;return d}

// ---------- logica ----------
function seedBase(){
 const pr=(cod,desc,norma,tipo,int,steps)=>{const p={id:nid('p'),cod,desc,norma,tipo,int,doc:null,steps:steps.map(x=>({t:x.replace(/\*$/,''),foto:x.endsWith('*')}))};M.proc.push(p);return p.id};
 const a=pr('PM101','Lubrificazione assi robot','Manuale costruttore','ultima',6,['Messa in sicurezza (LOTO)','Lubrificazione riduttori assi 1-6','Controllo giochi e rumorosità','Foto contaore*']);
 const b=pr('PM102','Verifica dispositivi di sicurezza','Dir. 2006/42/CE','cal',12,['Prova arresto di emergenza','Prova barriere / scanner','Verifica recinzioni e interblocchi*']);
 const c=pr('PM201','Pulizia ottiche laser','Manuale costruttore','cal',1,['Spegnimento sorgente','Pulizia lente di protezione*','Verifica allineamento fascio']);
 const d=pr('PM030','Verifica dopo intervento','','evento',0,['Ispezione visiva*','Prova funzionale']);
 M.tipi.push({id:nid('t'),nome:'Robot',procs:[a,b,d]},{id:nid('t'),nome:'Laser',procs:[c,b,d]});saveM()}
function assign(impId,procId,start,man,comp){const a={id:nid('s'),imp:impId,comp:comp||null,proc:procId,start:start||null,man:man||null};M.ass.push(a);if(P(procId).tipo!=='evento'&&start)newAtt(a,start);return a}
function newAtt(s,due){const p=P(s.proc);M.att.push({id:nid('a'),ass:s.id,imp:s.imp,comp:s.comp,proc:s.proc,due,man:s.man,ok:p.steps.map(()=>false),foto:p.steps.map(()=>[]),note:''})}
function status(a){if(a.chiusa)return['Chiusa','var(--ok)','c'];const t=tdy();if(a.due<t)return['Scaduta','var(--accent)','r'];if(a.due<=addM(t,1))return['In scadenza','var(--warn)','g'];return['Pianificata','var(--info)','b']}
const pill=s=>`<span class="pill" style="color:${s[1]}">${s[0]}</span>`;
function impStatus(id){const open=M.att.filter(a=>a.imp===id);
 const evt=M.ass.some(s=>s.imp===id&&P(s.proc)?.tipo==='evento'&&!M.att.some(a=>a.ass===s.id));
 const st=open.map(status);const w=st.find(s=>s[2]==='r')||st.find(s=>s[2]==='g')||(evt&&!open.length?['Attesa evento','var(--off)','n']:null)||['In regola','var(--ok)','v'];
 return{open,w,next:open.map(a=>a.due).sort()[0]}}
const qm=(...s)=>!MN.f.q||s.join(' ').toLowerCase().includes(MN.f.q.toLowerCase());
function attOk(a){const i=I(a.imp),p=P(a.proc);if(!i||!p)return false;const f=MN.f;return(!f.imp||a.imp===f.imp)&&(!f.proc||a.proc===f.proc)&&(!f.man||(f.man==='-'?!a.man:a.man===f.man))&&(!f.stato||status(a)[2]===f.stato)&&qm(i.cod,i.nome,i.cli,CMP(a),p.cod,p.desc)}

// ---------- viste ----------
const SUB_R=[['sit','Situazione'],['att','Attività'],['mie','Le mie'],['imp','Impianti'],['tipi','Componenti'],['proc','Procedure'],['sto','Storico']];
const SUB_M=[['mie','Le mie attività'],['sto','Storico']];
window.vManut=function(){start();draw()};
function draw(){const v=document.getElementById('view');if(!v||S.tab!=='manut')return;
 if(MN.err){v.innerHTML=`<div class="panel"><b>Area manutenzione non accessibile.</b><p class="muted">${e_(MN.err)}. Probabilmente vanno aggiornate le regole di Firestore.</p></div>`;return}
 if(!MN.ready){v.innerHTML='<div class="panel muted">Caricamento manutenzione…</div>';return}
 const subs=isR()?SUB_R:SUB_M;if(!subs.some(s=>s[0]===MN.tab))MN.tab=subs[0][0];
 v.innerHTML=`<div class="mn"><div class="mn-sub" role="tablist">${subs.map(([k,l])=>`<button role="tab" aria-selected="${MN.tab===k}" data-mn-tab="${k}">${l}</button>`).join('')}</div><div id="mnBody"></div></div>`;
 v.querySelectorAll('[data-mn-tab]').forEach(b=>b.onclick=()=>{MN.tab=b.dataset.mnTab;MN.f.stato='';draw()});
 const body=document.getElementById('mnBody');
 const r=({sit:vSit,att:vAtt,mie:vMie,imp:vImp,tipi:vTipi,proc:vProc,sto:vSto})[MN.tab]();
 if(r&&r.then){body.innerHTML='<div class="muted">Caricamento…</div>';r.then(h=>{body.innerHTML=h;after(body)})}else{body.innerHTML=r;after(body)}}
function after(root){labels(root);if(MN.focus){const e=document.getElementById(MN.focus);if(e){e.focus();e.setSelectionRange?.(e.value.length,e.value.length)}MN.focus=null}}
function labels(root){root.querySelectorAll('table').forEach(t=>{const h=[...t.querySelectorAll('thead th')].map(x=>x.textContent);t.querySelectorAll('tbody tr').forEach(r=>[...r.children].forEach((c,i)=>{if(!c.hasAttribute('colspan'))c.setAttribute('data-label',h[i]||'')}))})}

// filtri
const sel=(k,l,o)=>`<label>${l}<select onchange="MNX.f('${k}',this.value)"><option value="">Tutti</option>${o.map(([v,t])=>`<option value="${e_(v)}" ${MN.f[k]===v?'selected':''}>${e_(t)}</option>`).join('')}</select></label>`;
const fImp=()=>sel('imp','Impianto',M.imp.map(i=>[i.id,i.cod+' '+i.nome]));
const fProc=()=>sel('proc','Procedura',M.proc.map(p=>[p.id,p.cod]));
const fMan=(l='Manutentore',none=true)=>sel('man',l,S.persone.map(p=>[p,p]).concat(none?[['-','Da assegnare']]:[]));
const fQ=()=>`<label class="mn-wide">Cerca<input id="mnQ" value="${e_(MN.f.q)}" placeholder="Codice, nome, componente, procedura…" oninput="MNX.q(this.value)"></label>`;
const fRes=()=>`<button class="btn" onclick="MNX.reset()">Azzera filtri</button>`;
const fBox=(h,n)=>`<div class="panel mn-f"><div class="evf">${h}</div>${n!=null?`<div class="muted" style="margin-top:8px">${n}</div>`:''}</div>`;

function vSit(){
 const all=M.imp.map(i=>({i,...impStatus(i.id)}));const c=k=>all.filter(r=>r.w[2]===k).length;
 const rows=all.filter(r=>(!MN.f.stato||r.w[2]===MN.f.stato)&&qm(r.i.cod,r.i.nome,r.i.cli,(r.i.comps||[]).map(x=>x.sigla).join(' ')));
 const k=(l,n,col,key)=>`<button class="mn-kpi" style="border-color:${col}" onclick="MNX.f('stato','${MN.f.stato===key?'':key}')" aria-pressed="${MN.f.stato===key}"><span class="muted">${l}</span><b style="color:${col}">${n}</b></button>`;
 return `<div class="mn-kpis">${k('Scaduti',c('r'),'var(--accent)','r')}${k('In scadenza 30 gg',c('g'),'var(--warn)','g')}${k('Attesa evento',c('n'),'var(--off)','n')}${k('In regola',c('v'),'var(--ok)','v')}</div>
 ${fBox(sel('stato','Stato',[['r','Scaduti'],['g','In scadenza'],['n','Attesa evento'],['v','In regola']])+fQ()+fRes(),rows.length+' impianti')}
 <div class="panel tablewrap mn-t"><table><thead><tr><th>Stato</th><th>Impianto</th><th>Cliente</th><th>Aperte</th><th>Prossima scadenza</th><th></th></tr></thead><tbody>
 ${rows.map(r=>`<tr><td>${pill(r.w)}</td><td><b>${e_(r.i.cod)}</b> ${e_(r.i.nome)}<div class="muted">${(r.i.comps||[]).length} componenti</div></td><td>${e_(r.i.cli)}</td><td class="mono">${r.open.length}</td><td class="mono">${fd(r.next)}</td><td><button class="btn sm" onclick="MNX.impDett('${r.i.id}')">Apri</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Nessun impianto. Aggiungili da «Impianti».</td></tr>'}
 </tbody></table></div>`}

function attTable(list,man){
 return `<div class="panel tablewrap mn-t"><table><thead><tr><th>Stato</th><th>Scadenza</th><th>Impianto</th><th>Procedura</th>${man?'<th>Manutentore</th>':''}<th></th></tr></thead><tbody>
 ${list.sort((a,b)=>a.due<b.due?-1:1).map(a=>{const i=I(a.imp),p=P(a.proc);return `<tr><td>${pill(status(a))}</td><td class="mono">${fd(a.due)}</td><td><b>${e_(i.cod)}</b> ${e_(i.nome)}<div class="muted">${e_(CMP(a))}</div></td><td>${e_(p.cod)} ${e_(p.desc)}</td>${man?`<td>${manSel(a)}</td>`:''}<td><button class="btn pri sm" onclick="MNX.esegui('${a.id}')">Esegui</button></td></tr>`}).join('')||`<tr><td colspan="6" class="muted">Nessuna attività</td></tr>`}
 </tbody></table></div>`}
const manSel=a=>`<select aria-label="Manutentore" onchange="MNX.setMan('${a.id}',this.value)"><option value="">Da assegnare</option>${S.persone.map(p=>`<option ${a.man===p?'selected':''}>${e_(p)}</option>`).join('')}</select>`;
function vAtt(){const l=M.att.filter(attOk);return fBox(fImp()+fProc()+fMan()+sel('stato','Stato',[['r','Scadute'],['g','In scadenza'],['b','Pianificate']])+fQ()+fRes(),l.length+' attività aperte')+attTable(l,true)}
function vMie(){const l=M.att.filter(a=>a.man===me()&&attOk(a));return fBox(fImp()+sel('stato','Stato',[['r','Scadute'],['g','In scadenza'],['b','Pianificate']])+fQ()+fRes(),l.length+' attività assegnate a te')+attTable(l,false)}

function vImp(){
 return `<div class="panel"><h3>Nuovo impianto</h3><div class="evf" style="margin-top:10px"><label>Codice<input id="mnICod" placeholder="IMP-100"></label><label>Nome<input id="mnINome"></label><label>Cliente<input id="mnICli"></label><button class="btn pri" onclick="MNX.addImp()">Aggiungi</button></div></div>
 ${fBox(fQ()+fRes())}
 <div class="panel tablewrap mn-t"><table><thead><tr><th>Codice</th><th>Nome</th><th>Cliente</th><th>Componenti</th><th>Procedure</th><th></th></tr></thead><tbody>
 ${M.imp.filter(i=>qm(i.cod,i.nome,i.cli,(i.comps||[]).map(c=>c.sigla).join(' '))).map(i=>`<tr><td><b>${e_(i.cod)}</b></td><td>${e_(i.nome)}</td><td>${e_(i.cli)}</td><td>${(i.comps||[]).map(c=>e_(c.sigla)).join('<br>')||'—'}</td><td class="mono">${M.ass.filter(a=>a.imp===i.id).length}</td><td><button class="btn pri sm" onclick="MNX.config('${i.id}')">Configura</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">Nessun impianto</td></tr>'}
 </tbody></table></div>`}

function vTipi(){
 return `<div class="panel"><h3>Nuovo tipo di componente</h3><div class="evf" style="margin-top:10px"><label>Nome<input id="mnTNome" placeholder="es. Robot, Laser, Pressa…"></label><button class="btn pri" onclick="MNX.addTipo()">Aggiungi</button></div></div>
 ${M.tipi.map(t=>`<div class="panel" style="margin-top:12px"><div class="row" style="justify-content:space-between"><h3>${e_(t.nome)}</h3><span class="muted">usato in ${M.imp.reduce((n,i)=>n+(i.comps||[]).filter(c=>c.tipo===t.id).length,0)} componenti</span></div>
 <p class="muted">Procedure standard proposte quando aggiungi questo componente:</p><div class="perm">
 ${M.proc.map(p=>`<label><input type="checkbox" ${t.procs.includes(p.id)?'checked':''} onchange="MNX.togTipo('${t.id}','${p.id}',this.checked)"> ${e_(p.cod)} – ${e_(p.desc)}</label>`).join('')||'<span class="muted">Crea prima le procedure</span>'}</div></div>`).join('')}`}

function vProc(){
 return `<div class="row"><button class="btn pri" onclick="MNX.editProc()">+ Nuova procedura</button></div>
 ${M.proc.map(p=>`<div class="panel" style="margin-top:12px"><div class="row" style="justify-content:space-between"><div><h3>${e_(p.cod)} · ${e_(p.desc)}</h3>
 <div class="muted">${freq(p)}${p.norma?' · '+e_(p.norma):''} · ${p.steps.length} passi · assegnata ${M.ass.filter(a=>a.proc===p.id).length} volte</div></div>
 <div class="row">${p.doc?`<button class="btn sm" onclick="MNX.viewDoc('${p.id}')">Documento</button>`:''}<button class="btn sm" onclick="MNX.editProc('${p.id}')">Modifica</button></div></div></div>`).join('')}`}

async function vSto(){
 const y=MN.anno,list=(await storico(y)).filter(a=>{const i=I(a.imp)||{cod:a._imp||'',nome:''};const f=MN.f;
  return (isR()||a.esec===me()||a.man===me())&&(!f.imp||a.imp===f.imp)&&(!f.proc||a.proc===f.proc)&&(!f.man||a.esec===f.man)&&(!f.da||a.chiusa>=f.da)&&(!f.a||a.chiusa<=f.a)&&qm(i.cod,i.nome,a._cmp,a._pcod,a._pdesc,a.note)}).sort((a,b)=>a.chiusa<b.chiusa?1:-1);
 MN._sto=list;
 const anni=[...new Set([...(M.anni||[]),String(new Date().getFullYear())])].sort().reverse();
 return fBox(`<label>Anno<select onchange="MNX.anno(this.value)">${anni.map(a=>`<option ${a===y?'selected':''}>${a}</option>`).join('')}</select></label>`+fImp()+fProc()+(isR()?fMan('Eseguita da',false):'')+
 `<label>Dal<input type="date" value="${MN.f.da}" onchange="MNX.f('da',this.value)"></label><label>Al<input type="date" value="${MN.f.a}" onchange="MNX.f('a',this.value)"></label>`+fQ()+fRes()+`<button class="btn" onclick="MNX.xls()">Esporta Excel</button>`,list.length+' interventi nel '+y)+
 `<div class="panel tablewrap mn-t"><table><thead><tr><th>Data</th><th>Impianto</th><th>Procedura</th><th>Eseguita da</th><th>Passi</th><th>Note</th><th>Foto</th><th></th></tr></thead><tbody>
 ${list.map(a=>`<tr><td class="mono">${fd(a.chiusa)}</td><td><b>${e_(a._imp)}</b><div class="muted">${e_(a._cmp)}</div></td><td>${e_(a._pcod)}</td><td>${e_(a.esec)}</td><td class="mono">${a.ok.filter(Boolean).length}/${a.ok.length}</td><td>${e_(a.note)||'—'}</td><td class="mono">${a.foto.flat().length}</td><td><button class="btn pri sm" onclick="MNX.pdf('${y}','${a.id}')">PDF</button></td></tr>`).join('')||'<tr><td colspan="8" class="muted">Nessun intervento con questi filtri</td></tr>'}
 </tbody></table></div>`}

// ---------- finestre ----------
function ovl(h){let o=document.getElementById('mnOvl');if(!o){o=document.createElement('div');o.id='mnOvl';o.className='mn-ovl';o.onclick=e=>{if(e.target===o)closeO()};document.body.appendChild(o)}
 o.innerHTML=`<div class="mn-box">${h}</div>`;o.hidden=false;labels(o)}
function closeO(){const o=document.getElementById('mnOvl');if(o)o.hidden=true;draw()}

function impDett(id){const i=I(id),ass=M.ass.filter(a=>a.imp===id);
 ovl(`<h2>${e_(i.cod)} · ${e_(i.nome)}</h2><p class="muted">${e_(i.cli)}</p>
 <div class="tablewrap mn-t"><table><thead><tr><th>Componente</th><th>Procedura</th><th>Stato</th><th>Scadenza</th><th>Manutentore</th><th></th></tr></thead><tbody>
 ${ass.map(s=>{const p=P(s.proc),a=M.att.find(x=>x.ass===s.id);
  if(!a)return `<tr><td>${e_(CMP(s))}</td><td><b>${e_(p.cod)}</b> ${e_(p.desc)}</td><td>${pill([p.tipo==='evento'?'Attesa evento':'—','var(--off)'])}</td><td>—</td><td>—</td><td>${p.tipo==='evento'&&isR()?`<button class="btn sm" onclick="MNX.evento('${s.id}')">Registra evento</button>`:''}</td></tr>`;
  return `<tr><td>${e_(CMP(s))}</td><td><b>${e_(p.cod)}</b> ${e_(p.desc)}</td><td>${pill(status(a))}</td><td class="mono">${fd(a.due)}</td><td>${isR()?manSel(a):e_(a.man||'—')}</td><td><button class="btn pri sm" onclick="MNX.esegui('${a.id}')">Esegui</button></td></tr>`}).join('')||'<tr><td colspan="6" class="muted">Nessuna procedura assegnata</td></tr>'}
 </tbody></table></div><div class="row" style="justify-content:flex-end">${isR()?`<button class="btn" onclick="MNX.config('${id}')">Configura</button>`:''}<button class="btn" onclick="MNX.close()">Chiudi</button></div>`)}

function drawCfg(){const i=I(MN.cfgImp);if(!MN.cfgTipo&&M.tipi[0])MN.cfgTipo=M.tipi[0].id;const t=T(MN.cfgTipo);
 const pl=p=>`${e_(p.cod)} – ${e_(p.desc)} <span class="muted">(${freq(p)})</span>`;
 ovl(`<h2>Configura ${e_(i.cod)} · ${e_(i.nome)}</h2>
 <div class="evf"><label>Codice<input value="${e_(i.cod)}" onchange="MNX.impSet('cod',this.value)"></label><label>Nome<input value="${e_(i.nome)}" onchange="MNX.impSet('nome',this.value)"></label><label>Cliente<input value="${e_(i.cli)}" onchange="MNX.impSet('cli',this.value)"></label></div>
 <h3>Componenti</h3>
 ${(i.comps||[]).map(c=>{const ass=M.ass.filter(a=>a.comp===c.id);return `<div class="mn-step"><div class="row" style="justify-content:space-between"><div><b>${e_(c.sigla)}</b> <span class="pill" style="color:var(--info)">${e_(T(c.tipo)?.nome||'')}</span></div><button class="btn sm" onclick="MNX.delComp('${c.id}')">Rimuovi</button></div>
 ${ass.map(a=>`<div class="row" style="font-size:13px"><span style="flex:1">${pl(P(a.proc))}</span><button class="btn sm" onclick="MNX.delAss('${a.id}')">Togli</button></div>`).join('')||'<span class="muted">Nessuna procedura</span>'}
 <div class="row"><select id="mnXp_${c.id}" aria-label="Procedura aggiuntiva" style="flex:1">${M.proc.filter(p=>!ass.some(a=>a.proc===p.id)).map(p=>`<option value="${p.id}">${e_(p.cod)} – ${e_(p.desc)}</option>`).join('')}</select><button class="btn sm" onclick="MNX.addExtra('${c.id}')">+ Procedura</button></div></div>`}).join('')||'<p class="muted">Nessun componente</p>'}
 <h3>Aggiungi componente</h3>
 <div class="evf"><label>Tipo<select onchange="MN_setTipo(this.value)">${M.tipi.map(x=>`<option value="${x.id}" ${x.id===MN.cfgTipo?'selected':''}>${e_(x.nome)}</option>`).join('')}</select></label><label>Sigla / descrizione<input id="mnCSigla" placeholder="es. R3 Robot pallettizzatore"></label></div>
 <div class="muted">Procedure standard del tipo (togli la spunta per escluderle):</div><div class="perm">
 ${t?t.procs.map(pid=>{const p=P(pid);return p?`<label><input type="checkbox" class="mnCP" value="${p.id}" checked> ${pl(p)}</label>`:''}).join('')||'<span class="muted">Nessuna procedura standard</span>':'<span class="muted">Crea prima un tipo in «Componenti»</span>'}</div>
 <div class="evf"><label>Data inizio<input type="date" id="mnCStart" value="${tdy()}"></label><label>Manutentore<select id="mnCMan"><option value="">Da assegnare</option>${S.persone.map(p=>`<option>${e_(p)}</option>`).join('')}</select></label><button class="btn pri" onclick="MNX.addComp()" ${t?'':'disabled'}>Aggiungi componente</button></div>
 <div class="row" style="justify-content:space-between"><button class="btn" onclick="MNX.delImp()">Elimina impianto</button><button class="btn pri" onclick="MNX.close()">Fine</button></div>`)}
window.MN_setTipo=v=>{MN.cfgTipo=v;drawCfg()};

function editProc(id){const p=id?P(id):{cod:'',desc:'',norma:'',tipo:'cal',int:6,steps:[],doc:null};
 MN.tmpSteps=p.steps.map(s=>({...s}));MN.tmpDoc=p.doc;MN.editId=id||null;
 ovl(`<h2>${id?'Modifica':'Nuova'} procedura</h2>
 <div class="evf"><label>Codice<input id="mnPCod" value="${e_(p.cod)}" placeholder="PM001"></label><label>Riferimento normativo<input id="mnPNorma" value="${e_(p.norma)}"></label></div>
 <div class="evf"><label>Descrizione<input id="mnPDesc" value="${e_(p.desc)}"></label></div>
 <div class="evf"><label>Frequenza<select id="mnPTipo">${Object.entries(TIPI).map(([k,v])=>`<option value="${k}" ${p.tipo===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Ogni (mesi)<input id="mnPInt" type="number" min="1" value="${p.int||6}"></label></div>
 <h3>Passi da confermare</h3><div id="mnSteps"></div>
 <div class="evf"><label>Nuovo passo<input id="mnNS" placeholder="Descrizione del passo"></label><label class="mn-chk"><input type="checkbox" id="mnNF"> Foto obbligatoria</label><button class="btn" onclick="MNX.addStep()">Aggiungi passo</button></div>
 <h3>Documento (PDF o immagine, max 700 KB)</h3><input type="file" accept="application/pdf,image/*" onchange="MNX.loadDoc(this)"><div id="mnDocI" class="muted">${MN.tmpDoc?'Allegato: '+e_(MN.tmpDoc.name):'Nessun documento'}</div>
 <div class="row" style="justify-content:space-between">${id?`<button class="btn" onclick="MNX.delProc()">Elimina</button>`:'<span></span>'}<div class="row"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.saveProc()">Salva</button></div></div>`);drawSteps()}
function drawSteps(){const b=document.getElementById('mnSteps');if(b)b.innerHTML=MN.tmpSteps.map((s,k)=>`<div class="row mn-srow"><span class="mono">${k+1}.</span><span style="flex:1">${e_(s.t)}</span>${s.foto?'<span class="pill" style="color:var(--warn)">Foto</span>':''}<button class="btn sm" onclick="MNX.mvStep(${k},-1)" aria-label="Su">↑</button><button class="btn sm" onclick="MNX.rmStep(${k})">Rimuovi</button></div>`).join('')||'<p class="muted">Nessun passo</p>'}

async function drawEx(){const a=M.att.find(x=>x.id===MN.ex);if(!a)return closeO();const p=P(a.proc),i=I(a.imp),st=status(a);
 const done=p.steps.filter((s,k)=>a.ok[k]&&(!s.foto||(a.foto[k]||[]).length)).length;
 const thumbs=await Promise.all(p.steps.map((s,k)=>Promise.all((a.foto[k]||[]).map(id=>blob('manutFoto',id)))));
 const canDo=isR()||a.man===me();
 ovl(`<h2>${e_(p.cod)} · ${e_(p.desc)}</h2><div class="muted">${e_(i.cod)} ${e_(i.nome)} › ${e_(CMP(a))} · scadenza ${fd(a.due)} ${pill(st)}</div>
 ${p.doc?`<div><button class="btn" onclick="MNX.viewDoc('${p.id}')">📄 Apri documento procedura</button></div>`:''}
 ${!canDo?'<div class="muted">Attività assegnata a '+e_(a.man||'nessuno')+': puoi solo consultarla.</div>':''}
 ${p.steps.map((s,k)=>`<div class="mn-step"><label class="mn-chk"><input type="checkbox" ${a.ok[k]?'checked':''} ${canDo?'':'disabled'} onchange="MNX.tick(${k},this.checked)"> <span>${e_(s.t)}</span></label>
 ${s.foto||(a.foto[k]||[]).length?`<div class="row mn-ph">${canDo?`<label class="btn sm">📷 Aggiungi foto<input type="file" accept="image/*" capture="environment" hidden onchange="MNX.foto(${k},this)"></label>`:''}${thumbs[k].map((d,j)=>d?`<span class="mn-th"><img src="${d.data}" alt="Foto passo ${k+1}">${canDo?`<button class="btn sm" aria-label="Elimina foto" onclick="MNX.delFoto(${k},${j})">✕</button>`:''}</span>`:'').join('')}${s.foto&&!(a.foto[k]||[]).length?'<span class="muted">Foto obbligatoria</span>':''}</div>`:''}</div>`).join('')}
 <div class="evf"><label>Note<textarea id="mnNote" rows="3" ${canDo?'':'disabled'} onchange="MNX.note(this.value)">${e_(a.note)}</textarea></label></div>
 <div class="row" style="justify-content:space-between"><span class="muted">${done}/${p.steps.length} passi completati</span><div class="row"><button class="btn" onclick="MNX.pdfOpen()">PDF</button><button class="btn" onclick="MNX.close()">Chiudi</button>${canDo?`<button class="btn pri" ${done<p.steps.length?'disabled':''} onclick="MNX.chiudi()">Chiudi attività</button>`:''}</div></div>`)}

// ---------- foto ----------
function compress(file){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const img=new Image();img.onerror=rej;img.onload=()=>{
 let q=.75,m=STEP_FOTO_MAX,out;const c=document.createElement('canvas');
 for(let n=0;n<6;n++){const sc=Math.min(1,m/Math.max(img.width,img.height));c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);out=c.toDataURL('image/jpeg',q);if(out.length<650000)break;q-=.1;m=Math.round(m*.8)}
 res(out)};img.src=r.result};r.readAsDataURL(file)})}

// ---------- PDF ----------
async function pdf(a,p,i,cmp){
 if(!window.jspdf)return mt('Generatore PDF non caricato');
 const doc=new jspdf.jsPDF({unit:'mm',format:'a4'}),W=210,Mg=15;let y=18;
 const need=h=>{if(y+h>280){doc.addPage();y=18}},line=()=>{doc.setDrawColor(210);doc.line(Mg,y,W-Mg,y);y+=6};
 doc.setFillColor(21,39,79);doc.rect(0,0,W,28,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('Rapporto di intervento',Mg,13);
 doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text((p.cod||'')+' - '+(p.desc||''),Mg,21);doc.text('Ergo Plan',W-Mg,13,{align:'right'});y=38;doc.setTextColor(29,35,33);
 const kv=[['Impianto',i],['Componente',cmp||'-'],['Procedura',(p.cod||'')+' - '+(p.desc||'')],['Riferimento normativo',p.norma||'-'],['Scadenza prevista',fd(a.due)],['Data esecuzione',a.chiusa?fd(a.chiusa):'Non ancora eseguita'],['Eseguita da',a.esec||a.man||'-'],['Esito',a.chiusa?'Completata':'Aperta']];
 doc.setFontSize(10);kv.forEach(([k,v])=>{doc.setFont('helvetica','bold');doc.text(k,Mg,y);doc.setFont('helvetica','normal');const t=doc.splitTextToSize(String(v),125);doc.text(t,Mg+50,y);y+=6*t.length});
 y+=2;line();doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Passi della procedura',Mg,y);y+=7;doc.setFontSize(10);
 for(let k=0;k<p.steps.length;k++){const s=p.steps[k],t=doc.splitTextToSize((k+1)+'. '+s.t,135);need(6*t.length+2);
  doc.setFont('helvetica','normal');doc.text(t,Mg,y);doc.setFont('helvetica','bold');a.ok[k]?doc.setTextColor(47,125,79):doc.setTextColor(196,66,26);
  doc.text(a.ok[k]?'CONFERMATO':'NON CONFERMATO',W-Mg,y,{align:'right'});doc.setTextColor(29,35,33);y+=6*t.length;
  const imgs=(await Promise.all((a.foto[k]||[]).map(id=>blob('manutFoto',id)))).filter(Boolean);
  if(imgs.length){let x=Mg+5;need(42);for(const im of imgs){const pr=doc.getImageProperties(im.data),h=38,w=Math.min(60,h*pr.width/pr.height);if(x+w>W-Mg){x=Mg+5;y+=42;need(42)}doc.addImage(im.data,'JPEG',x,y,w,h);x+=w+4}y+=42}y+=1}
 y+=2;need(20);line();doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Note',Mg,y);y+=7;doc.setFont('helvetica','normal');doc.setFontSize(10);
 const nt=doc.splitTextToSize(a.note||'Nessuna nota',W-2*Mg);need(6*nt.length);doc.text(nt,Mg,y);y+=6*nt.length+14;
 need(25);doc.text('Firma manutentore',Mg,y);doc.text('Firma responsabile',W-Mg-60,y);y+=12;doc.line(Mg,y,Mg+60,y);doc.line(W-Mg-60,y,W-Mg,y);
 const n=doc.getNumberOfPages();for(let k=1;k<=n;k++){doc.setPage(k);doc.setFontSize(8);doc.setTextColor(120);doc.text('Generato il '+fd(tdy())+' - pagina '+k+'/'+n,W-Mg,290,{align:'right'})}
 doc.save(`${(i.split(' ')[0]||'impianto')}_${p.cod}_${a.chiusa||a.due}.pdf`.replace(/[^\w.-]+/g,'_'))}

// ---------- azioni ----------
window.MNX={
 f(k,v){MN.f[k]=v;draw()},q(v){MN.f.q=v;MN.focus='mnQ';draw()},reset(){MN.f={imp:'',stato:'',man:'',proc:'',q:'',da:'',a:''};draw()},
 anno(v){MN.anno=v;draw()},close:closeO,impDett,
 setMan(id,v){const a=M.att.find(x=>x.id===id);a.man=v||null;saveM();mt(v?'Assegnata a '+v:'Assegnazione tolta')},
 evento(sid){const s=M.ass.find(a=>a.id===sid);newAtt(s,tdy());saveM();impDett(s.imp);mt('Evento registrato: attività generata')},
 addImp(){const v=k=>document.getElementById(k).value.trim();if(!v('mnICod'))return mt('Inserisci il codice');const i={id:nid('i'),cod:v('mnICod'),nome:v('mnINome'),cli:v('mnICli'),comps:[]};M.imp.push(i);saveM();MNX.config(i.id)},
 config(id){MN.cfgImp=id;drawCfg()},
 impSet(k,v){I(MN.cfgImp)[k]=v.trim();saveM()},
 delImp(){const i=I(MN.cfgImp);ovl(`<h2>Eliminare ${e_(i.cod)}?</h2><p>Vengono tolti componenti, procedure assegnate e attività aperte. Lo storico resta.</p><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.config('${i.id}')">Annulla</button><button class="btn pri" onclick="MNX.delImpOk()">Elimina</button></div>`)},
 delImpOk(){const id=MN.cfgImp;M.att=M.att.filter(a=>a.imp!==id);M.ass=M.ass.filter(a=>a.imp!==id);M.imp=M.imp.filter(i=>i.id!==id);saveM();closeO();mt('Impianto eliminato')},
 addComp(){const s=document.getElementById('mnCSigla').value.trim();if(!s)return mt('Inserisci la sigla del componente');
  const i=I(MN.cfgImp),c={id:nid('c'),tipo:MN.cfgTipo,sigla:s};(i.comps=i.comps||[]).push(c);
  const st=document.getElementById('mnCStart').value,m=document.getElementById('mnCMan').value||null;const ps=[...document.querySelectorAll('.mnCP:checked')].map(x=>x.value);
  ps.forEach(pid=>assign(i.id,pid,st,m,c.id));saveM();drawCfg();mt('Componente aggiunto con '+ps.length+' procedure')},
 addExtra(cid){const pid=document.getElementById('mnXp_'+cid)?.value;if(!pid)return;assign(MN.cfgImp,pid,tdy(),null,cid);saveM();drawCfg();mt('Procedura aggiunta, prima scadenza oggi')},
 delAss(aid){M.att=M.att.filter(a=>a.ass!==aid);M.ass=M.ass.filter(a=>a.id!==aid);saveM();drawCfg()},
 delComp(cid){const i=I(MN.cfgImp);const ids=M.ass.filter(a=>a.comp===cid).map(a=>a.id);M.att=M.att.filter(a=>!ids.includes(a.ass));M.ass=M.ass.filter(a=>a.comp!==cid);i.comps=i.comps.filter(c=>c.id!==cid);saveM();drawCfg();mt('Componente rimosso (lo storico resta)')},
 addTipo(){const n=document.getElementById('mnTNome').value.trim();if(!n)return;M.tipi.push({id:nid('t'),nome:n,procs:[]});saveM();draw()},
 togTipo(tid,pid,on){const t=T(tid);t.procs=on?[...new Set([...t.procs,pid])]:t.procs.filter(x=>x!==pid);saveM()},
 editProc,addStep(){const t=document.getElementById('mnNS').value.trim();if(!t)return;MN.tmpSteps.push({t,foto:document.getElementById('mnNF').checked});document.getElementById('mnNS').value='';document.getElementById('mnNF').checked=false;drawSteps()},
 rmStep(k){MN.tmpSteps.splice(k,1);drawSteps()},mvStep(k,d){if(k+d<0)return;const s=MN.tmpSteps;[s[k],s[k+d]]=[s[k+d],s[k]];drawSteps()},
 loadDoc(inp){const f=inp.files[0];if(!f)return;if(f.size>700*1024){inp.value='';return mt('Il file supera 700 KB: comprimilo o usa un link')}
  const r=new FileReader();r.onload=()=>{MN.tmpDoc={name:f.name,type:f.type,size:f.size,_data:r.result};document.getElementById('mnDocI').textContent='Allegato: '+f.name+' ('+Math.round(f.size/1024)+' KB)'};r.readAsDataURL(f)},
 async saveProc(){const v=k=>document.getElementById(k).value.trim();if(!v('mnPCod'))return mt('Inserisci il codice');if(!MN.tmpSteps.length)return mt('Aggiungi almeno un passo');
  let d=MN.tmpDoc;if(d&&d._data){const id=nid('d');try{await window.FBM.putBlob('manutDoc',id,{name:d.name,type:d.type,data:d._data});BL[id]={name:d.name,type:d.type,data:d._data};d={id,name:d.name,type:d.type,size:d.size}}catch(er){return mt('Documento non salvato: '+FB.err(er))}}
  const data={cod:v('mnPCod'),desc:v('mnPDesc'),norma:v('mnPNorma'),tipo:v('mnPTipo'),int:Number(v('mnPInt'))||6,steps:MN.tmpSteps,doc:d};
  if(MN.editId){const p=P(MN.editId);if(p.doc&&p.doc.id&&(!d||d.id!==p.doc.id))window.FBM.delBlob('manutDoc',p.doc.id).catch(()=>{});Object.assign(p,data);
   M.att.filter(a=>a.proc===p.id).forEach(a=>{a.ok=p.steps.map((s,k)=>a.ok[k]||false);a.foto=p.steps.map((s,k)=>a.foto[k]||[])})}
  else M.proc.push({id:nid('p'),...data});saveM();closeO();mt('Procedura salvata')},
 delProc(){const p=P(MN.editId);if(M.ass.some(a=>a.proc===p.id))return mt('Procedura assegnata a dei componenti: toglila prima da lì');
  if(p.doc&&p.doc.id)window.FBM.delBlob('manutDoc',p.doc.id).catch(()=>{});M.proc=M.proc.filter(x=>x.id!==p.id);M.tipi.forEach(t=>t.procs=t.procs.filter(x=>x!==p.id));saveM();closeO()},
 async viewDoc(pid){const p=P(pid);const d=await blob('manutDoc',p.doc.id);if(!d)return mt('Documento non trovato');
  if(d.type.startsWith('image'))return ovl(`<h2>${e_(d.name)}</h2><img src="${d.data}" style="max-width:100%" alt="${e_(d.name)}"><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Chiudi</button></div>`);
  const b=await (await fetch(d.data)).blob(),u=URL.createObjectURL(b);
  ovl(`<h2>${e_(d.name)}</h2><iframe class="mn-doc" src="${u}" title="${e_(d.name)}"></iframe><div class="row" style="justify-content:flex-end"><a class="btn" href="${u}" target="_blank" rel="noopener">Apri a schermo intero</a><button class="btn" onclick="MNX.close()">Chiudi</button></div>`)},
 esegui(id){MN.ex=id;drawEx()},
 tick(k,v){const a=M.att.find(x=>x.id===MN.ex);a.ok[k]=v;saveM();drawEx()},
 note(v){const a=M.att.find(x=>x.id===MN.ex);a.note=v;saveM()},
 async foto(k,inp){const f=inp.files[0];if(!f)return;mt('Compressione foto…');try{const data=await compress(f),id=nid('f');
  await window.FBM.putBlob('manutFoto',id,{data,att:MN.ex,anno:tdy().slice(0,4)});BL[id]={data};const a=M.att.find(x=>x.id===MN.ex);(a.foto[k]=a.foto[k]||[]).push(id);saveM();drawEx();mt('Foto salvata ('+Math.round(data.length*.75/1024)+' KB)')}
  catch(er){mt('Foto non salvata: '+FB.err(er))}},
 delFoto(k,j){const a=M.att.find(x=>x.id===MN.ex);const id=a.foto[k][j];a.foto[k].splice(j,1);window.FBM.delBlob('manutFoto',id).catch(()=>{});saveM();drawEx()},
 async chiudi(){const a=M.att.find(x=>x.id===MN.ex),p=P(a.proc),s=M.ass.find(x=>x.id===a.ass),i=I(a.imp);
  const c={...a,chiusa:tdy(),esec:me(),_imp:i.cod+' '+i.nome,_cmp:CMP(a),_pcod:p.cod,_pdesc:p.desc,_norma:p.norma,_steps:p.steps.map(x=>({t:x.t,foto:x.foto}))};const y=c.chiusa.slice(0,4);
  try{const arr=await storico(y);arr.push(c);await window.FBM.saveY(y,arr)}catch(er){return mt('Chiusura non salvata: '+FB.err(er))}
  M.att=M.att.filter(x=>x.id!==a.id);if(!(M.anni||[]).includes(y))(M.anni=M.anni||[]).push(y);
  let msg='Attività chiusa';if(s){if(p.tipo==='cal'){newAtt(s,addM(a.due,p.int));msg+=' · prossima il '+fd(addM(a.due,p.int))}if(p.tipo==='ultima'){newAtt(s,addM(c.chiusa,p.int));msg+=' · prossima il '+fd(addM(c.chiusa,p.int))}if(p.tipo==='evento')msg+=' · in attesa del prossimo evento'}
  saveM();closeO();mt(msg)},
 pdfOpen(){const a=M.att.find(x=>x.id===MN.ex),p=P(a.proc),i=I(a.imp);pdf(a,p,i.cod+' '+i.nome+(i.cli?' ('+i.cli+')':''),CMP(a))},
 async pdf(y,id){const a=(await storico(y)).find(x=>x.id===id);if(!a)return;const p={cod:a._pcod,desc:a._pdesc,norma:a._norma,steps:a._steps||P(a.proc)?.steps||[]};const i=I(a.imp);pdf(a,p,a._imp+(i&&i.cli?' ('+i.cli+')':''),a._cmp)},
 xls(){if(!window.XLSX)return mt('Excel non disponibile');const rows=(MN._sto||[]).map(a=>({Data:fd(a.chiusa),Impianto:a._imp,Cliente:I(a.imp)?.cli||'',Componente:a._cmp,Procedura:a._pcod,Descrizione:a._pdesc,'Eseguita da':a.esec,'Passi confermati':a.ok.filter(Boolean).length+'/'+a.ok.length,Foto:a.foto.flat().length,Note:a.note}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Interventi '+MN.anno);XLSX.writeFile(wb,'Manutenzioni_'+MN.anno+'.xlsx')}
};
})();
