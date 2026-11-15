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
const PA=a=>a&&a.free?{id:null,cod:'Attività',desc:a.free.titolo,norma:'',tipo:'libera',int:0,steps:a.free.steps||[],doc:null,_d:a.free.desc}:P(a.proc);
const IA=a=>I(a.imp)||{id:'',cod:'Generica',nome:'',cli:'',comps:[]};
const INOME=a=>{const i=I(a.imp);return i?i.cod+' · '+i.nome:''};
const CMP=a=>{const i=I(a.imp);const c=i&&(i.comps||[]).find(x=>x.id===a.comp);return c?c.sigla:''};
const freq=p=>TIPI[p.tipo]+(p.tipo!=='evento'?' · ogni '+p.int+' mesi':'');
function mt(t){const el=document.getElementById('mnToast')||Object.assign(document.body.appendChild(document.createElement('div')),{id:'mnToast',className:'mn-toast'});el.textContent=t;el.hidden=false;clearTimeout(el._t);el._t=setTimeout(()=>el.hidden=true,3200)}

// ---------- persistenza ----------
let svT=null,lastM='';
function saveM(){clearTimeout(svT);svT=setTimeout(()=>{const d=JSON.stringify(M);if(d===lastM)return;lastM=d;
 if(d.length>900000)mt('Attenzione: dati manutenzione vicini al limite di 1 MB');
 window.FBM.save(JSON.parse(d)).catch(er=>mt('Salvataggio manutenzione non riuscito: '+FB.err(er)))},400)}
function onRemote(d){const txt=JSON.stringify(d||{});if(txt===lastM)return;lastM=txt;M=Object.assign({tipi:[],proc:[],imp:[],ass:[],att:[],vis:[],ric:[],anni:[],nextId:1},d||{});M.vis=M.vis||[];M.ric=M.ric||[];M.cat=M.cat||[];migra();M.ass.forEach(s=>{if(s.next===undefined){const a=M.att.find(x=>x.ass===s.id);s.next=a?a.due:(s.start||null);s.last=s.last||null}});MN.ready=true;
 const o=document.getElementById('mnOvl');if(o&&!o.hidden)return;
 if(!(document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)))refresh()}
function start(){if(!window.FBM||window.FBM._u)return;MN.err=null;window.FBM.listen(d=>{if(d===null){MN.ready=true;if(isR()&&!M.tipi.length)seedBase();refresh();return}onRemote(d)},er=>{MN.err=FB.err(er);draw()})}
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
const isStd=a=>{if(a.std===false)return false;const i=I(a.imp),c=i&&(i.comps||[]).find(x=>x.id===a.comp),t=c&&T(c.tipo);return !!(t&&t.procs.includes(a.proc))};
function assign(impId,procId,next,man,comp,std){const a={id:nid('s'),imp:impId,comp:comp||null,proc:procId,next:next||null,last:null,evt:false,man:man||null,std:std!==false};M.ass.push(a);return a}
function newAtt(s,due,vis,man){const p=P(s.proc);const a={id:nid('a'),vis:vis||null,ass:s.id,imp:s.imp,comp:s.comp,proc:s.proc,due,man:man||null,ok:p.steps.map(()=>false),foto:p.steps.map(()=>[]),note:''};M.att.push(a);return a}
function status(a){if(a.chiusa)return['Chiusa','var(--ok)','c'];const t=tdy();if(a.due<t)return['In ritardo','var(--accent)','r'];if(a.due===t)return['Oggi','var(--warn)','g'];return['Pianificata','var(--info)','b']}
const pill=s=>`<span class="pill" style="color:${s[1]}">${s[0]}</span>`;
// stato di una procedura assegnata: serve farla entro la data d?
const planned=s=>M.att.find(a=>a.ass===s.id);
function dueOn(s,d){const p=P(s.proc);if(!p)return false;if(p.tipo==='evento')return !!s.evt;return !s.next||s.next<=d}
function assStatus(s){const p=P(s.proc),t=tdy(),pa=planned(s);
 if(pa)return['Pianificata '+fd(pa.due),'var(--info)','b'];
 if(p.tipo==='evento')return s.evt?['Evento da gestire','var(--accent)','r']:['In attesa di evento','var(--off)','n'];
 if(!s.next)return['Da fare (mai eseguita)','var(--accent)','r'];
 if(s.next<t)return['Scaduta il '+fd(s.next),'var(--accent)','r'];
 if(s.next<=addM(t,1))return['In scadenza il '+fd(s.next),'var(--warn)','g'];
 return['Prossima '+fd(s.next),'var(--ok)','v']}
function impStatus(id){const ass=M.ass.filter(a=>a.imp===id),st=ass.map(assStatus),open=M.att.filter(a=>a.imp===id),imp=I(id);
 if(imp&&!imp.avviato&&!open.length)return{open,w:['Mai pianificato','var(--accent)','r'],next:null,toPlan:ass.length||1,mai:1};
 const w=st.find(x=>x[2]==='r')?['Da pianificare','var(--accent)','r']:st.find(x=>x[2]==='g')?['In scadenza','var(--warn)','g']:st.find(x=>x[2]==='b')?['Pianificato','var(--info)','b']:ass.length&&st.every(x=>x[2]==='n')?['Attesa evento','var(--off)','n']:['In regola','var(--ok)','v'];
 const nx=ass.filter(s=>!planned(s)&&P(s.proc)?.tipo!=='evento').map(s=>s.next||tdy()).sort()[0];
 return{open,w,next:nx,toPlan:st.filter(x=>x[2]==='r'||x[2]==='g').length}}
function migra(){M.imp.forEach(i=>{if(!i.avviato&&(M.vis.some(v=>v.imp===i.id)||M.att.some(a=>a.imp===i.id)||M.ass.some(s=>s.imp===i.id&&s.last)))i.avviato=true})}
const CAT=id=>M.cat.find(c=>c.id===id);
const catPath=id=>{const out=[];let c=CAT(id),n=0;while(c&&n++<20){out.unshift(c.nome);c=CAT(c.par)}return out.join(' › ')};
const catKids=id=>M.cat.filter(c=>(c.par||null)===(id||null));
const catDesc=id=>{const r=new Set([id]);let ch=true;while(ch){ch=false;M.cat.forEach(c=>{if(c.par&&r.has(c.par)&&!r.has(c.id)){r.add(c.id);ch=true}})}return r};
function catOpts(sel,none){const out=[];const walk=(par,d)=>catKids(par).sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(c=>{out.push(`<option value="${c.id}" ${c.id===sel?'selected':''}>${'— '.repeat(d)}${e_(c.nome)}</option>`);walk(c.id,d+1)});walk(null,0);return `<option value="">${none||'— nessuna —'}</option>`+out.join('')}
const qm=(...s)=>!MN.f.q||s.join(' ').toLowerCase().includes(MN.f.q.toLowerCase());
function attOk(a){const i=IA(a),p=PA(a);if(!p)return false;const f=MN.f;return(!f.imp||a.imp===f.imp)&&(!f.proc||a.proc===f.proc)&&(!f.man||(f.man==='-'?!a.man:a.man===f.man))&&(!f.stato||status(a)[2]===f.stato)&&qm(i.cod,i.nome,i.cli,CMP(a),p.cod,p.desc)}

// ---------- viste ----------
const LEAF=['manut','mpers','mimp','mric','msto','cimp','ccat','ctipi','cproc'];
const HEAD={manut:['Pianificazione','Panoramica dell\'anno e calendario. In ogni manutenzione entrano solo le procedure già scadute alla data scelta.'],mpers:['Attività assegnate','Manutenzioni da eseguire, per persona e per impianto.'],mimp:['Impianti','Ultima e prossima manutenzione di ogni impianto. Aprilo per storico, note e ricambi.'],mric:['Ricambi','Ricambi segnalati dai manutentori: segna quelli acquistati.'],msto:['Storico interventi','Attività eseguite, con rapporto PDF ed esportazione Excel.'],cimp:['Impianti','Anagrafica impianti e componenti.'],ccat:['Categorie impianti','Classificazione a livelli (es. Plant › Reparto › Tipologia). Ogni impianto si assegna a una categoria.'],ctipi:['Tipi componente','Le procedure del tipo valgono per tutti i componenti di quel tipo.'],cproc:['Procedure','Modelli di manutenzione: frequenza, passi da confermare, documento.']};
window.vManut=function(){start();if(!LEAF.includes(S.tab)){const v=document.getElementById('view');if(v)v.innerHTML='';return}draw()};
function draw(){const v=document.getElementById('view');if(!v||!LEAF.includes(S.tab))return;
 if(MN.err){v.innerHTML=`<div class="panel"><b>Area manutenzione non accessibile.</b><p class="muted">${e_(MN.err)}. Controlla le regole di Firestore.</p></div>`;return}
 if(!MN.ready){v.innerHTML='<div class="panel muted">Caricamento manutenzione…</div>';return}
 if(MN.tab!==S.tab){MN.tab=S.tab;MN.f={imp:'',stato:'',man:'',proc:'',q:'',da:'',a:'',cat:''};if(S.tab!=='mimp')MN.impSel=null}
 const R=isR(),lib=R?`<button class="btn" onclick="MNX.newLib()">+ Altra attività</button>`:'',act={manut:R?`${lib}<button class="btn pri" onclick="MNX.plan()">+ Pianifica manutenzione</button>`:'',mpers:lib,ccat:`<button class="btn pri" onclick="MNX.catAdd()">+ Livello principale</button>`,mric:R?`<button class="btn" onclick="MNX.ricNew()">+ Aggiungi ricambio</button>`:'',cimp:`<button class="btn pri" onclick="MNX.newImp()">+ Nuovo impianto</button>`,ctipi:`<button class="btn pri" onclick="MNX.newTipo()">+ Nuovo tipo</button>`,cproc:`<button class="btn pri" onclick="MNX.editProc()">+ Nuova procedura</button>`}[S.tab]||'';
 const hd=S.tab==='mimp'&&MN.impSel?null:HEAD[S.tab];
 v.innerHTML=`<div class="mnt">${hd?`<div class="mn-head"><div><h2>${hd[0]}</h2><div class="muted">${hd[1]}</div></div><div class="row">${act}</div></div>`:''}<div id="mnBody"></div></div>`;
 const body=document.getElementById('mnBody');
 const r=({manut:vPian,mpers:vPers,mimp:vImpM,mric:vRic,msto:vSto,cimp:vImp,ccat:vCat,ctipi:vTipi,cproc:vProc})[S.tab]();
 if(r&&r.then){body.innerHTML='<div class="muted">Caricamento…</div>';r.then(h=>{if(document.getElementById('mnBody')===body){body.innerHTML=h;after()}})}else{body.innerHTML=r;after()}}
function after(){if(MN.focus){const e=document.getElementById(MN.focus);if(e){e.focus();e.setSelectionRange?.(e.value.length,e.value.length)}MN.focus=null}}

// elementi
const item=(col,title,sub,right,click)=>`<div class="mn-it"${click?` role="button" tabindex="0" onclick="${click}" onkeydown="if(event.key==='Enter')${click}"`:''}><span class="mn-bar" style="background:${col}"></span><div class="mn-c"><div class="mn-t">${title}</div>${sub?`<div class="mn-s">${sub}</div>`:''}</div>${right?`<div class="mn-r" onclick="event.stopPropagation()">${right}</div>`:''}</div>`;
const list=(arr,empty)=>`<div class="mn-list">${arr.join('')||`<div class="mn-empty muted">${empty}</div>`}</div>`;
const sel=(k,l,o)=>`<label class="mn-fs">${l}<select onchange="MNX.f('${k}',this.value)"><option value="">Tutti</option>${o.map(([v,t])=>`<option value="${e_(v)}" ${MN.f[k]===v?'selected':''}>${e_(t)}</option>`).join('')}</select></label>`;
const fImp=()=>sel('imp','Impianto',M.imp.map(i=>[i.id,i.cod+' '+i.nome]));
const fProc=()=>sel('proc','Procedura',M.proc.map(p=>[p.id,p.cod]));
const fMan=(l='Manutentore',none=true)=>sel('man',l,S.persone.map(p=>[p,p]).concat(none?[['-','Da assegnare']]:[]));
const fStato=()=>sel('stato','Stato',[['r','In ritardo'],['g','Oggi'],['b','Pianificate']]);
const fQ=()=>`<label class="mn-fq">Cerca<input id="mnQ" type="search" value="${e_(MN.f.q)}" placeholder="Impianto, componente, procedura…" oninput="MNX.q(this.value)"></label>`;
const anyF=()=>Object.values(MN.f).some(Boolean);
const fBox=(h,n)=>`<div class="mn-fb">${fQ()}${h}${anyF()?`<button class="btn" onclick="MNX.reset()">Azzera</button>`:''}</div>${n!=null?`<div class="mn-cnt muted">${n}</div>`:''}`;
const dot=(t,c)=>`<span class="mn-st" style="color:${c}">${t}</span>`;

const MESI=['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
function yCounts(y,imp){const pian=Array(12).fill(0),fatte=Array(12).fill(0);
 M.vis.filter(v=>v.data.startsWith(y)&&(!imp||v.imp===imp)).forEach(v=>pian[+v.data.slice(5,7)-1]++);
 const lo=new Set();M.att.filter(a=>!a.vis&&a.due.startsWith(y)&&(!imp||a.imp===imp)).forEach(a=>{const k=a.due+a.imp;if(!lo.has(k)){lo.add(k);pian[+a.due.slice(5,7)-1]++}});
 const dn=new Set();(H[y]||[]).filter(a=>!imp||a.imp===imp).forEach(a=>{const k=a.vis||(a.imp+a.chiusa);if(!dn.has(k)){dn.add(k);fatte[+a.chiusa.slice(5,7)-1]++}});
 return{pian,fatte}}
function yearGrid(y,imp,fn,selM){const c=yCounts(y,imp),cur=tdy().slice(0,7);
 return `<div class="mn-yr">${MESI.map((m,k)=>{const ym=y+'-'+String(k+1).padStart(2,'0');return `<button class="mn-mo${ym===selM?' sel':''}${ym===cur?' cur':''}${ym<cur?' past':''}" onclick="MNX.${fn}('${ym}')"><b>${m}</b><span class="${c.pian[k]?'p':''}">${c.pian[k]} pianificate</span><span class="${c.fatte[k]?'f':''}">${c.fatte[k]} fatte</span></button>`}).join('')}</div>`}
async function vPian(){const y=MN.anno2||(MN.anno2=tdy().slice(0,4));await storico(y);
 const all=M.imp.map(i=>({i,...impStatus(i.id)}));const ord={r:0,g:1,b:2,n:3,v:4};
 const rows=all.filter(r=>r.toPlan).sort((a,b)=>ord[a.w[2]]-ord[b.w[2]]||((a.next||'9')<(b.next||'9')?-1:1));
 return `<div class="mn-calw" style="margin-bottom:14px"><div class="mn-calh"><button class="btn" onclick="MNX.anno2(-1)" aria-label="Anno precedente">‹</button><h3>${y}</h3><button class="btn" onclick="MNX.anno2(1)" aria-label="Anno successivo">›</button></div>${yearGrid(y,null,'meseSel',MN.mese)}</div>
 <div class="mn-dash"><div class="mn-calw">${cal()}</div>
 <div><h3 style="margin-bottom:8px">Da pianificare <span class="mn-n">${rows.length}</span></h3>
 ${list(rows.map(r=>item(r.w[1],`${e_(r.i.cod)} · ${e_(r.i.nome)}`,`${dot(r.w[0],r.w[1])}${r.mai?'<span>nessuna manutenzione ancora pianificata</span>':`<span>${r.toPlan} procedure da fare</span>`}${r.next&&!r.mai?`<span>dal ${fd(r.next)}</span>`:''}`,isR()?`<button class="btn pri" onclick="MNX.plan('${r.i.id}')">Pianifica</button>`:'',`MNX.apriImp('${r.i.id}')`)),'Niente da pianificare 👍')}</div></div>`}
function cal(){const m=MN.mese||(MN.mese=tdy().slice(0,7));const [Y,Mo]=m.split('-').map(Number);
 const first=new Date(Y,Mo-1,1),start=new Date(first);start.setDate(1-((first.getDay()+6)%7));
 const ev={};M.vis.forEach(v=>(ev[v.data]=ev[v.data]||[]).push(v));
 const loose={};M.att.filter(a=>!a.vis).forEach(a=>{const k=a.due+'|'+(a.imp||a.id);loose[k]=loose[k]||{data:a.due,imp:a.imp,n:0,man:a.man,tit:a.free?a.free.titolo:null,aid:a.id};loose[k].n++});
 Object.values(loose).forEach(x=>(ev[x.data]=ev[x.data]||[]).push({loose:1,...x}));
 const chip=v=>{const i=I(v.imp)||{cod:v.tit||'Attività',nome:''};const n=v.loose?v.n:M.att.filter(a=>a.vis===v.id).length;const late=v.data<tdy();
  return `<button class="mn-chip" ${v.loose?'':`draggable="true" ondragstart="event.dataTransfer.setData('text/plain','${v.id}')"`} style="--c:${late?'var(--accent)':'var(--info)'}" onclick="event.stopPropagation();${v.loose?(v.imp?`MNX.impDett('${v.imp}')`:`MNX.esegui('${v.aid}')`):`MNX.visDett('${v.id}')`}" title="${e_(i.cod+' '+i.nome)}"><b>${e_(i.cod)}</b> <span>${n} att.${v.man?' · '+e_(v.man.split(' ')[0]):''}</span></button>`};
 let cells='',agenda='';const t=tdy();
 for(let d=0;d<42;d++){const x=new Date(start);x.setDate(start.getDate()+d);const iso=isoL(x),inM=x.getMonth()===Mo-1;
  cells+=`<div class="mn-day${inM?'':' out'}${iso===t?' today':''}" ondragover="event.preventDefault();this.classList.add('drop')" ondragleave="this.classList.remove('drop')" ondrop="event.preventDefault();MNX.drop(event.dataTransfer.getData('text/plain'),'${iso}')" onclick="MNX.plan(null,'${iso}')" title="Pianifica il ${fd(iso)}"><span class="mn-dn">${x.getDate()}</span>${(ev[iso]||[]).map(chip).join('')}</div>`;
  if(inM&&ev[iso])agenda+=`<div class="mn-ag"><b>${x.toLocaleDateString('it-IT',{weekday:'short',day:'numeric'})}</b>${ev[iso].map(chip).join('')}</div>`}
 const mn=new Date(Y,Mo-1,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'});
 return `<div class="mn-calh"><button class="btn" onclick="MNX.mese(-1)" aria-label="Mese precedente">‹</button><h3>${mn}</h3><button class="btn" onclick="MNX.mese(1)" aria-label="Mese successivo">›</button><button class="btn sm" onclick="MNX.mese(0)">Oggi</button></div>
 <div class="mn-cal"><div class="mn-wd">${['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(x=>`<span>${x}</span>`).join('')}</div><div class="mn-grid">${cells}</div></div>
 <div class="mn-agenda">${agenda||'<div class="muted">Nessuna manutenzione pianificata questo mese.</div>'}</div>
 <div class="muted" style="font-size:12px;margin-top:6px">Clicca un giorno per pianificare una manutenzione · trascina una manutenzione su un altro giorno per spostarla (o aprila e cambia la data).</div>`}

function planPreview(imp,d){return M.ass.filter(s=>s.imp===imp&&P(s.proc)).map(s=>{const p=P(s.proc),pa=planned(s);
 if(pa)return{s,p,inc:false,why:'già pianificata il '+fd(pa.due)};
 if(dueOn(s,d))return{s,p,inc:true,why:p.tipo==='evento'?'evento registrato':!s.next?'mai eseguita':'scaduta il '+fd(s.next)};
 return{s,p,inc:false,why:p.tipo==='evento'?'in attesa di evento':'non ancora: prossima dal '+fd(s.next)}})}
function drawPlan(){const P_=MN.pl;const i=P_.imp&&I(P_.imp);const pv=i?planPreview(i.id,P_.data).filter(x=>!planned(x.s)):[];
 if(P_.sel==null)P_.sel=pv.filter(x=>x.inc).map(x=>x.s.id);const sel=new Set(P_.sel);
 const comps=i?(i.comps||[]):[];const first=i&&!i.avviato;
 const row=x=>`<label class="mn-chk${x.inc?'':' mn-nd'}"><input type="checkbox" ${sel.has(x.s.id)?'checked':''} onchange="MNX.plSel(['${x.s.id}'],this.checked)"> <span><b>${e_(x.p.cod)}</b> ${e_(x.p.desc)} <span class="${x.inc?'mn-due':'muted'}">· ${x.why}</span></span></label>`;
 const blocks=comps.map(c=>{const l=pv.filter(x=>x.s.comp===c.id);if(!l.length)return'';const all=l.every(x=>sel.has(x.s.id)),some=l.some(x=>sel.has(x.s.id));
  return `<div class="mn-step"><label class="mn-chk"><input type="checkbox" ${all?'checked':''} ${!all&&some?'data-mixed="1"':''} onchange="MNX.plSel(['${l.map(x=>x.s.id).join("','")}'],this.checked)"> <span><b>${e_(c.sigla)}</b> <span class="muted">· ${e_(T(c.tipo)?.nome||'')} · tutto il componente</span></span></label><div class="mn-checks" style="padding-left:32px">${l.map(row).join('')}</div></div>`}).join('');
 const n=sel.size;
 const yy=P_.data.slice(0,4);
 ovl(`<div class="mn-oh"><h2>Pianifica manutenzione</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div><div class="mn-calh"><button class="btn sm" onclick="MNX.plAnno(-1)" aria-label="Anno precedente">‹</button><h3>${yy}${i?' · '+e_(i.cod):' · tutti gli impianti'}</h3><button class="btn sm" onclick="MNX.plAnno(1)" aria-label="Anno successivo">›</button></div>${yearGrid(yy,P_.imp||null,'plMese',P_.data.slice(0,7))}<div class="muted" style="font-size:12px;margin-top:4px">Tocca un mese per spostare lì la data, poi scegli il giorno.</div></div>
 <div class="evf"><label>Impianto<select onchange="MNX.pl('imp',this.value)"><option value="">— scegli —</option>${M.imp.map(x=>`<option value="${x.id}" ${x.id===P_.imp?'selected':''}>${e_(x.cod)} · ${e_(x.nome)}</option>`).join('')}</select></label>
 <label>Data<input type="date" value="${P_.data}" onchange="MNX.pl('data',this.value)"></label>
 <label>Manutentore<select onchange="MNX.pl('man',this.value,1)"><option value="">Da assegnare</option>${S.persone.map(p=>`<option ${P_.man===p?'selected':''}>${e_(p)}</option>`).join('')}</select></label></div>
 ${i?`${first?'<div class="mn-info">Prima manutenzione di questo impianto: dopo averla pianificata, le procedure non scelte verranno richieste in base alla loro frequenza a partire da questa data.</div>':''}
 <div class="muted" style="font-size:13px">Scegli un componente intero o le singole procedure. Sono già spuntate quelle scadute a questa data; puoi aggiungere anche le altre.</div>
 ${blocks||'<div class="muted">Nessuna procedura disponibile: sono già tutte pianificate.</div>'}`:'<div class="muted">Scegli l\'impianto.</div>'}
 <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" ${n?'':'disabled'} onclick="MNX.planOk()">Pianifica ${n?n+' attività':''}</button></div>`);
 document.querySelectorAll('#mnOvl [data-mixed]').forEach(x=>x.indeterminate=true)}
function visDett(id){const v=M.vis.find(x=>x.id===id);if(!v)return closeO();const i=I(v.imp),l=M.att.filter(a=>a.vis===id);
 ovl(`<div class="mn-oh"><h2>Manutenzione ${e_(i.cod)} · ${e_(i.nome)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 ${isR()?`<div class="evf"><label>Data<input type="date" value="${v.data}" onchange="MNX.visSet('${id}','data',this.value)"></label><label>Manutentore<select onchange="MNX.visSet('${id}','man',this.value)"><option value="">Da assegnare</option>${S.persone.map(p=>`<option ${v.man===p?'selected':''}>${e_(p)}</option>`).join('')}</select></label></div>`:`<div class="muted">${fd(v.data)} · ${e_(v.man||'da assegnare')}</div>`}
 ${list(l.map(a=>{const p=P(a.proc);return item('var(--info)',`${e_(p.cod)} · ${e_(p.desc)}`,`<span>${e_(CMP(a))}</span><span>${a.ok.filter(Boolean).length}/${a.ok.length} passi</span>`,`<button class="btn pri" onclick="MNX.esegui('${a.id}')">Apri</button>`)}),'Tutte le attività sono state chiuse.')}
 <div class="row" style="justify-content:space-between">${isR()?`<button class="btn" onclick="MNX.visDel('${id}')">Annulla manutenzione</button>`:'<span></span>'}<button class="btn" onclick="MNX.close()">Chiudi</button></div>`)}

function attList(l,man){return list(l.sort((a,b)=>a.due<b.due?-1:1).map(a=>{const i=IA(a),p=PA(a),st=status(a),nd=a.ok.filter(Boolean).length;
 return item(st[1],`${e_(p.cod)} · ${e_(p.desc)}`,`${dot(st[0]+' · '+fd(a.due),st[1])}${nd?`<span class="mn-prog">${nd}/${a.ok.length} passi fatti</span>`:''}${INOME(a)?`<span>${e_(INOME(a))}</span>`:''}${CMP(a)?`<span>${e_(CMP(a))}</span>`:''}${!man?'':''}`,`${man?manSel(a):''}<button class="btn pri" onclick="MNX.esegui('${a.id}')">Apri</button>`,`MNX.esegui('${a.id}')`)}),'Nessuna attività.')}
const manSel=a=>`<select class="mn-man" aria-label="Manutentore" onchange="MNX.setMan('${a.id}',this.value)"><option value="">— Da assegnare —</option>${S.persone.map(p=>`<option ${a.man===p?'selected':''}>${e_(p)}</option>`).join('')}</select>`;
function split(l,assign){const pr=l.filter(a=>!a.free),al=l.filter(a=>a.free);
 return (pr.length?`<h3 class="mn-sec">Attività preventive <span class="mn-n">${pr.length}</span></h3><div class="mn-list">${grouped(pr,assign)}</div>`:'')+(al.length?`<h3 class="mn-sec">Altre attività <span class="mn-n">${al.length}</span></h3>${attList(al,assign)}`:'')||'<div class="mn-empty muted">Nessuna attività.</div>'}
function grouped(l,assign){const g={};l.forEach(a=>(g[a.imp||'']=g[a.imp||'']||[]).push(a));
 const ids=Object.keys(g).sort((x,y)=>{const m=k=>g[k].map(a=>a.due).sort()[0];return m(x)<m(y)?-1:1});
 return ids.map(id=>{const i=I(id)||{cod:'—',nome:'',cli:''},arr=g[id],mans=[...new Set(arr.map(a=>a.man||''))];
  return `<div class="mn-grp"><div class="mn-gh"><div><h3>${e_(i.cod)} · ${e_(i.nome)}</h3><div class="muted" style="font-size:13px">${i.cli?e_(i.cli)+' · ':''}${arr.length} attività${mans.length===1&&mans[0]?' · tutte a '+e_(mans[0]):''}</div></div>
  ${assign&&id?`<label class="mn-fs" style="display:grid;gap:4px;font-size:12px;color:var(--muted)">Assegna tutto l'impianto a<select onchange="MNX.setManImp('${id}',this.value,'${arr.map(a=>a.id).join(',')}')"><option value="">— scegli —</option>${S.persone.map(p=>`<option>${e_(p)}</option>`).join('')}<option value="-">Nessuno (togli)</option></select></label>`:''}</div>
  ${attList(arr,assign)}</div>`}).join('')||'<div class="mn-empty muted">Nessuna attività.</div>'}
function vAtt(){const l=M.att.filter(attOk);return fBox(fStato()+fMan()+fImp(),l.length+' attività in '+new Set(l.map(a=>a.imp)).size+' impianti · assegna la singola attività o tutto l\'impianto')+`<div class="mn-list">${grouped(l,true)}</div>`}
function vMie(){const l=M.att.filter(a=>a.man===me()&&attOk(a));return fBox(fStato(),l.length+' attività assegnate a te')+`<div class="mn-list">${grouped(l,false)}</div>`}

function vImp(){const l=M.imp.filter(i=>qm(i.cod,i.nome,i.cli,catPath(i.cat),(i.comps||[]).map(c=>c.sigla).join(' ')));
 return fBox('',null)+list(l.map(i=>item('var(--info)',`${e_(i.cod)} · ${e_(i.nome)}`,`${i.cat?`<span>${e_(catPath(i.cat))}</span>`:''}<span>${e_(i.cli||'—')}</span><span>${(i.comps||[]).map(c=>e_(c.sigla)).join(', ')||'nessun componente'}</span><span>${M.ass.filter(a=>a.imp===i.id).length} procedure</span>`,`<button class="btn pri" onclick="MNX.config('${i.id}')">Configura</button>`,`MNX.config('${i.id}')`)),'Nessun impianto: crea il primo con «+ Nuovo impianto».')}

function vTipi(){return list(M.tipi.map(t=>item('var(--hi)',e_(t.nome),`<span>${t.procs.map(id=>P(id)?.cod).filter(Boolean).join(', ')||'nessuna procedura standard'}</span><span>usato in ${M.imp.reduce((n,i)=>n+(i.comps||[]).filter(c=>c.tipo===t.id).length,0)} componenti</span>`,`<button class="btn" onclick="MNX.editTipo('${t.id}')">Modifica</button>`,`MNX.editTipo('${t.id}')`)),'Nessun tipo di componente.')}

function vProc(){return list(M.proc.map(p=>item('var(--ink)',`${e_(p.cod)} · ${e_(p.desc)}`,`<span>${freq(p)}</span>${p.norma?`<span>${e_(p.norma)}</span>`:''}<span>${p.steps.length} passi</span>${p.doc?'<span>📄 documento</span>':''}<span>usata ${M.ass.filter(a=>a.proc===p.id).length} volte</span>`,`<button class="btn" onclick="MNX.editProc('${p.id}')">Modifica</button>`,`MNX.editProc('${p.id}')`)),'Nessuna procedura.')}

async function vSto(){
 const y=MN.anno,list_=(await storico(y)).filter(a=>{const f=MN.f;
  return (isR()||a.esec===me()||a.man===me())&&(!f.imp||a.imp===f.imp)&&(!f.proc||a.proc===f.proc)&&(!f.man||a.esec===f.man)&&(!f.da||a.chiusa>=f.da)&&(!f.a||a.chiusa<=f.a)&&qm(a._imp,a._cmp,a._pcod,a._pdesc,a.note)}).sort((a,b)=>a.chiusa<b.chiusa?1:-1);
 MN._sto=list_;
 const anni=[...new Set([...(M.anni||[]),String(new Date().getFullYear())])].sort().reverse();
 return fBox(`<label class="mn-fs">Anno<select onchange="MNX.anno(this.value)">${anni.map(a=>`<option ${a===y?'selected':''}>${a}</option>`).join('')}</select></label>`+fImp()+(isR()?fMan('Eseguita da',false):'')+`<label class="mn-fs">Dal<input type="date" value="${MN.f.da}" onchange="MNX.f('da',this.value)"></label><label class="mn-fs">Al<input type="date" value="${MN.f.a}" onchange="MNX.f('a',this.value)"></label>`,
  `${list_.length} interventi nel ${y} · <button class="btn sm" onclick="MNX.xls()">Esporta Excel</button>`)+
 list(list_.map(a=>{const ok=a.ok.filter(Boolean).length;return item('var(--ok)',`${e_(a._pcod)} · ${e_(a._pdesc)}`,`<span><b>${fd(a.chiusa)}</b></span><span>${e_(a._imp)}${a._cmp?' › '+e_(a._cmp):''}</span><span>${e_(a.esec)}</span><span>${ok}/${a.ok.length} passi</span>${a.foto.flat().length?`<span>${a.foto.flat().length} foto</span>`:''}${a.note?`<span class="mn-note">«${e_(a.note)}»</span>`:''}`,`<button class="btn pri" onclick="MNX.pdf('${y}','${a.id}')">PDF</button>`)}),'Nessun intervento con questi filtri.')}

// --- Attività assegnate (manutenzione)
function vPers(){const R=isR()||(typeof isAdm_==='function'&&isAdm_());
 const PL=R?[...new Set([...S.persone.filter(p=>typeof pArea==='function'&&pArea(p)==='man'),...M.att.map(a=>a.man).filter(Boolean)])]:[me()];
 if(R)PL.push('');
 if(!PL.includes(MN.pSel))MN.pSel=R?PL[0]:me();
 const l=M.att.filter(a=>(a.man||'')===(MN.pSel||''));
 const nm=p=>p||'Da assegnare';
 const side=R?`<aside class="panel pside"><h3 style="margin-bottom:8px">Persone</h3><div class="list">${PL.map(p=>`<button class="pbtn ${p===MN.pSel?'sel':''}" onclick="MNX.pSel('${e_(p)}')"><span class="av">${p?e_(p.split(' ').map(x=>x[0]).join('').slice(0,2)):'?'}</span><span style="min-width:0"><span class="cn">${e_(nm(p))}</span><span class="muted" style="font-size:12px;display:block">${M.att.filter(a=>(a.man||'')===p).length} attività</span></span></button>`).join('')}</div></aside>`:'';
 const sel=R?`<select class="psel" aria-label="Persona" onchange="MNX.pSel(this.value)">${PL.map(p=>`<option value="${e_(p)}" ${p===MN.pSel?'selected':''}>${e_(nm(p))}</option>`).join('')}</select>`:'';
 return `<div class="${R?'grid2':''}">${side}<section>${sel}<h3 style="margin-bottom:10px">${e_(nm(MN.pSel))} <span class="mn-n">${l.length}</span></h3>${split(l,R)}</section></div>`}

// --- Impianti (matrice e scheda)
const lastOf=id=>M.ass.filter(s=>s.imp===id&&s.last).map(s=>s.last).sort().pop()||null;
const nextVis=id=>{const d=[...M.vis.filter(v=>v.imp===id).map(v=>v.data),...M.att.filter(a=>a.imp===id&&!a.vis).map(a=>a.due)].sort();return d[0]||null};
function vImpM(){if(MN.impSel&&I(MN.impSel))return impPage(MN.impSel);
 const ds=MN.f.cat?catDesc(MN.f.cat):null;const l=M.imp.filter(i=>(!ds||ds.has(i.cat))&&qm(i.cod,i.nome,i.cli,catPath(i.cat),(i.comps||[]).map(c=>c.sigla).join(' '))).sort((a,b)=>(catPath(a.cat)||'~').localeCompare(catPath(b.cat)||'~')||a.cod.localeCompare(b.cod));
 let lastP=null;
 return fBox(M.cat.length?`<label class="mn-fs">Categoria<select onchange="MNX.f('cat',this.value)">${catOpts(MN.f.cat,'Tutte')}</select></label>`:'',null)+`<div class="mn-imps">${l.map(i=>{const cp=catPath(i.cat)||'Senza categoria';const h=cp!==lastP&&M.cat.length?`<h3 class="mn-cath">${e_(cp)}</h3>`:'';lastP=cp;return h+(()=>{const st=impStatus(i.id),lt=lastOf(i.id),nx=nextVis(i.id),rc=M.ric.filter(r=>r.imp===i.id&&r.buy&&r.stato!=='ok').length;
  return `<button class="mn-ib" style="--c:${st.w[1]}" onclick="MNX.apriImp('${i.id}')"><span class="mn-ibh"><b>${e_(i.cod)}</b>${dot(st.w[0],st.w[1])}</span><span class="muted">${e_(i.nome)}${i.cli?' · '+e_(i.cli):''}</span>
  <span class="mn-ibr"><span>Ultima</span><b>${lt?fd(lt):'—'}</b></span><span class="mn-ibr"><span>Prossima</span><b>${nx?fd(nx):st.toPlan?'<span style="color:var(--accent)">da pianificare</span>':(st.next?'dal '+fd(st.next):'—')}</b></span>${rc?`<span class="mn-ibr"><span>Ricambi da acquistare</span><b style="color:var(--warn)">${rc}</b></span>`:''}</button>`})()}).join('')||'<div class="mn-empty muted">Nessun impianto. Si aggiungono da Impostazioni → Impianti.</div>'}</div>`}
async function impPage(id){const i=I(id),R=isR();const ys=[...new Set([...(M.anni||[]),tdy().slice(0,4)])];await Promise.all(ys.map(storico));
 const done=ys.flatMap(y=>(H[y]||[]).filter(a=>a.imp===id).map(a=>({...a,_y:y}))).sort((a,b)=>a.chiusa<b.chiusa?1:-1);
 const ass=M.ass.filter(a=>a.imp===id),st=impStatus(id);
 const note=[...M.att.filter(a=>a.imp===id&&a.note).map(a=>({d:a.due,chi:a.man,t:a.note,p:PA(a)?.cod,c:CMP(a),aperta:1})),...done.filter(a=>a.note).map(a=>({d:a.chiusa,chi:a.esec,t:a.note,p:a._pcod,c:a._cmp}))].sort((a,b)=>a.d<b.d?1:-1);
 const ric=M.ric.filter(r=>r.imp===id).sort((a,b)=>(a.stato==='ok')-(b.stato==='ok')||(a.data<b.data?1:-1));
 return `<div class="mn-oh" style="margin-bottom:14px"><div><button class="btn sm" onclick="MNX.impBack()">‹ Tutti gli impianti</button><h2 style="margin-top:8px">${e_(i.cod)} · ${e_(i.nome)}</h2><div class="muted">${i.cat?e_(catPath(i.cat))+' · ':''}${e_(i.cli||'')} · ${(i.comps||[]).map(c=>e_(c.sigla)).join(', ')||'nessun componente'}</div></div>
 <div class="row">${R?`<button class="btn" onclick="MNX.config('${id}')">Configura</button><button class="btn pri" onclick="MNX.plan('${id}')">Pianifica manutenzione</button>`:''}</div></div>
 <div class="mn-kpis"><div class="mn-kpi" style="--c:var(--ok)"><b style="font-size:20px">${lastOf(id)?fd(lastOf(id)):'—'}</b><span>Ultima manutenzione</span></div><div class="mn-kpi" style="--c:var(--info)"><b style="font-size:20px">${nextVis(id)?fd(nextVis(id)):'—'}</b><span>Prossima pianificata</span></div><div class="mn-kpi" style="--c:${st.w[1]}"><b style="font-size:20px">${st.toPlan}</b><span>Procedure da pianificare</span></div><div class="mn-kpi" style="--c:var(--warn)"><b style="font-size:20px">${ric.filter(r=>r.buy&&r.stato!=='ok').length}</b><span>Ricambi da acquistare</span></div></div>
 <div class="mn-det">
 <section class="panel"><h3>Da fare</h3>${list(ass.map(s=>{const p=P(s.proc),x=assStatus(s),a=planned(s);return item(x[1],`${e_(p.cod)} · ${e_(p.desc)}`,`${dot(x[0],x[1])}<span>${e_(CMP(s))}</span>${s.last?`<span>ultima ${fd(s.last)}</span>`:''}`,a?`<button class="btn" onclick="MNX.esegui('${a.id}')">Apri</button>`:p.tipo==='evento'&&R&&!s.evt?`<button class="btn" onclick="MNX.evento('${s.id}')">Registra evento</button>`:'')}),'Nessuna procedura assegnata.')}</section>
 <section class="panel"><h3>Fatte</h3>${list(done.slice(0,30).map(a=>item('var(--ok)',`${e_(a._pcod)} · ${e_(a._pdesc)}`,`<span><b>${fd(a.chiusa)}</b></span><span>${e_(a._cmp)}</span><span>${e_(a.esec)}</span><span>${a.ok.filter(Boolean).length}/${a.ok.length} passi</span>`,`<button class="btn sm" onclick="MNX.pdf('${a._y}','${a.id}')">PDF</button>`)),'Nessuna manutenzione eseguita.')}</section>
 <section class="panel"><h3>Note delle manutenzioni</h3>${note.length?`<div class="mn-notes">${note.map(n=>`<div class="mn-nt"><div class="muted" style="font-size:12px">${fd(n.d)} · ${e_(n.chi||'')} · ${e_(n.p||'')}${n.c?' · '+e_(n.c):''}${n.aperta?' · in corso':''}</div><div>${e_(n.t)}</div></div>`).join('')}</div>`:'<div class="mn-empty muted">Nessuna nota.</div>'}</section>
 <section class="panel"><div class="mn-oh"><h3>Ricambi</h3>${R?`<button class="btn sm" onclick="MNX.ricNew('${id}')">+ Aggiungi</button>`:''}</div>${ricList(ric,true)}</section>
 </div>`}

// --- Categorie
function vCat(){const used=id=>M.imp.filter(i=>i.cat===id).length;
 const node=(c,d)=>{const k=catKids(c.id).sort((a,b)=>a.nome.localeCompare(b.nome));return `<div class="mn-cat" style="--d:${d}"><div class="mn-catr"><input value="${e_(c.nome)}" aria-label="Nome categoria" onchange="MNX.catRen('${c.id}',this.value)"><span class="muted" style="font-size:12px">${used(c.id)} impianti</span><button class="btn sm" onclick="MNX.catAdd('${c.id}')">+ Sotto-livello</button>${!k.length&&!used(c.id)?`<button class="btn sm" onclick="MNX.catDel('${c.id}')" aria-label="Elimina">✕</button>`:''}</div>${k.map(x=>node(x,d+1)).join('')}</div>`};
 const roots=catKids(null).sort((a,b)=>a.nome.localeCompare(b.nome));
 return roots.length?`<div class="panel">${roots.map(c=>node(c,0)).join('')}</div>`:'<div class="mn-empty muted">Nessuna categoria. Crea il primo livello (es. il Plant) con «+ Livello principale».</div>'}

// --- Ricambi
function ricItem(r,showImp){const i=I(r.imp),ok=r.stato==='ok',R=isR();
 const col=!r.buy?'var(--off)':ok?'var(--ok)':'var(--warn)',stt=!r.buy?'Necessario (disponibile)':ok?'Acquistato'+(r.acqData?' il '+fd(r.acqData):''):'Da acquistare';
 return item(col,`${e_(r.desc)}${r.qta?` <span class="muted">× ${e_(r.qta)}</span>`:''}`,`${dot(stt,col)}${showImp&&i?`<span>${e_(i.cod)}${r.comp?' › '+e_((i.comps||[]).find(c=>c.id===r.comp)?.sigla||''):''}</span>`:''}<span>segnalato da ${e_(r.da||'—')} il ${fd(r.data)}</span>`,
 `${R&&r.buy?(ok?`<button class="btn sm" onclick="MNX.ricStato('${r.id}','da')">Riporta da acquistare</button>`:`<button class="btn pri sm" onclick="MNX.ricStato('${r.id}','ok')">Segna acquistato</button>`):''}${R||r.da===me()?`<button class="btn sm" onclick="MNX.ricDel('${r.id}')" aria-label="Elimina">✕</button>`:''}`)}
function ricList(l,showImp){return list(l.map(r=>ricItem(r,showImp)),'Nessun ricambio segnalato.')}
function vRic(){const f=MN.f,st=f.stato||'da';
 const l=M.ric.filter(r=>(st==='tutti'||(st==='da'?r.buy&&r.stato!=='ok':st==='ok'?r.buy&&r.stato==='ok':!r.buy))&&(!f.imp||r.imp===f.imp)&&qm(r.desc,I(r.imp)?.cod,I(r.imp)?.nome,r.da)).sort((a,b)=>a.data<b.data?1:-1);
 const tab=(k,lb,n)=>`<button aria-current="${st===k?'page':'false'}" onclick="MNX.f('stato','${k}')">${lb} <span class="mn-n">${n}</span></button>`;
 return `<div class="mn-seg">${tab('da','Da acquistare',M.ric.filter(r=>r.buy&&r.stato!=='ok').length)}${tab('ok','Acquistati',M.ric.filter(r=>r.buy&&r.stato==='ok').length)}${tab('nec','Necessari',M.ric.filter(r=>!r.buy).length)}${tab('tutti','Tutti',M.ric.length)}</div>`+fBox(fImp(),null)+ricList(l,true)}

// ---------- finestre ----------
function ovl(h){let o=document.getElementById('mnOvl');if(!o){o=document.createElement('div');o.id='mnOvl';o.className='mn-ovl';o.onclick=e=>{if(e.target===o)closeO()};document.body.appendChild(o)}
 o.innerHTML=`<div class="mn-box" role="dialog" aria-modal="true">${h}</div>`;o.hidden=false;o.scrollTop=0}
function closeO(){const o=document.getElementById('mnOvl');if(o)o.hidden=true;refresh()}
function refresh(){if(LEAF.includes(S.tab))draw();else if(S.tab==='persone'&&typeof render==='function')render()}

function impDett(id){const i=I(id),ass=M.ass.filter(a=>a.imp===id);
 ovl(`<div class="mn-oh"><h2>${e_(i.cod)} · ${e_(i.nome)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="muted">${e_(i.cli||'')}</div>
 ${list(ass.map(s=>{const p=P(s.proc),st=assStatus(s),a=planned(s);
  return item(st[1],`${e_(p.cod)} · ${e_(p.desc)}`,`${dot(st[0],st[1])}${CMP(s)?`<span>${e_(CMP(s))}</span>`:''}<span>${freq(p)}</span>${s.last?`<span>ultima ${fd(s.last)}</span>`:''}`,a?`<button class="btn" onclick="MNX.esegui('${a.id}')">Apri</button>`:p.tipo==='evento'&&isR()&&!s.evt?`<button class="btn" onclick="MNX.evento('${s.id}')">Registra evento</button>`:'')}),'Nessuna procedura assegnata.')}
 <div class="row" style="justify-content:space-between">${isR()?`<button class="btn" onclick="MNX.config('${id}')">Configura impianto</button><button class="btn pri" onclick="MNX.plan('${id}')">Pianifica manutenzione</button>`:''}</div>`)}

function drawCfg(){const i=I(MN.cfgImp);if(!MN.cfgTipo&&M.tipi[0])MN.cfgTipo=M.tipi[0].id;const t=T(MN.cfgTipo);
 const pl=p=>`${e_(p.cod)} – ${e_(p.desc)} <span class="muted">(${freq(p)})</span>`;
 ovl(`<div class="mn-oh"><h2>Configura ${e_(i.cod)} · ${e_(i.nome)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="evf"><label>Categoria<select onchange="MNX.impSet('cat',this.value)">${catOpts(i.cat)}</select></label><label>Codice<input value="${e_(i.cod)}" onchange="MNX.impSet('cod',this.value)"></label><label>Nome<input value="${e_(i.nome)}" onchange="MNX.impSet('nome',this.value)"></label><label>Cliente<input value="${e_(i.cli)}" onchange="MNX.impSet('cli',this.value)"></label></div>
 <h3>Componenti</h3>
 ${(i.comps||[]).map(c=>{const ass=M.ass.filter(a=>a.comp===c.id);return `<div class="mn-step"><div class="row" style="justify-content:space-between"><div><b>${e_(c.sigla)}</b> <span class="pill" style="color:var(--info)">${e_(T(c.tipo)?.nome||'')}</span></div><button class="btn sm" onclick="MNX.delComp('${c.id}')">Rimuovi</button></div>
 ${ass.map(a=>`<div class="row" style="font-size:13px"><span style="flex:1">${pl(P(a.proc))}<br>${dot(assStatus(a)[0],assStatus(a)[1])}</span>${P(a.proc).tipo!=='evento'?`<label class="muted" style="font-size:11px;display:grid">Ultima esecuzione<input type="date" value="${a.last||''}" onchange="MNX.setLast('${a.id}',this.value)"></label>`:''}${isStd(a)?'<span class="pill" style="color:var(--off)">dal tipo</span>':`<button class="btn sm" onclick="MNX.delAss('${a.id}')">Togli</button>`}</div>`).join('')||'<span class="muted">Nessuna procedura</span>'}
 <div class="row"><select id="mnXp_${c.id}" aria-label="Procedura aggiuntiva" style="flex:1">${M.proc.filter(p=>!ass.some(a=>a.proc===p.id)).map(p=>`<option value="${p.id}">${e_(p.cod)} – ${e_(p.desc)}</option>`).join('')}</select><button class="btn sm" onclick="MNX.addExtra('${c.id}')">+ Procedura</button></div></div>`}).join('')||'<p class="muted">Nessun componente</p>'}
 <h3>Aggiungi componente</h3>
 <div class="evf"><label>Tipo<select onchange="MN_setTipo(this.value)">${M.tipi.map(x=>`<option value="${x.id}" ${x.id===MN.cfgTipo?'selected':''}>${e_(x.nome)}</option>`).join('')}</select></label><label>Sigla / descrizione<input id="mnCSigla" placeholder="es. R3 Robot pallettizzatore"></label></div>
 <div class="muted">Il componente riceve tutte le procedure del tipo; se le modifichi nel tipo, cambiano su tutti gli impianti:</div><div class="mn-checks">
 ${t?t.procs.map(pid=>{const p=P(pid);return p?`<div class="mn-chk">✓ <span>${pl(p)}</span></div>`:''}).join('')||'<span class="muted">Nessuna procedura standard</span>':'<span class="muted">Crea prima un tipo in «Componenti»</span>'}</div>
 <div class="row"><button class="btn pri" onclick="MNX.addComp()" ${t?'':'disabled'}>Aggiungi componente</button><span class="muted" style="font-size:12px">Le procedure entrano nella prima manutenzione che pianifichi.</span></div>
 <div class="row" style="justify-content:space-between"><button class="btn" onclick="MNX.delImp()">Elimina impianto</button><button class="btn pri" onclick="MNX.close()">Fine</button></div>`)}
window.MN_setTipo=v=>{MN.cfgTipo=v;drawCfg()};

function editProc(id){const p=id?P(id):{cod:'',desc:'',norma:'',tipo:'cal',int:6,steps:[],doc:null};
 MN.tmpSteps=p.steps.map(s=>({...s}));MN.tmpDoc=p.doc;MN.editId=id||null;
 ovl(`<div class="mn-oh"><h2>${id?'Modifica':'Nuova'} procedura</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="evf"><label>Codice<input id="mnPCod" value="${e_(p.cod)}" placeholder="PM001"></label><label>Riferimento normativo<input id="mnPNorma" value="${e_(p.norma)}"></label></div>
 <div class="evf"><label>Descrizione<input id="mnPDesc" value="${e_(p.desc)}"></label></div>
 <div class="evf"><label>Frequenza<select id="mnPTipo">${Object.entries(TIPI).map(([k,v])=>`<option value="${k}" ${p.tipo===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Ogni (mesi)<input id="mnPInt" type="number" min="1" value="${p.int||6}"></label></div>
 <h3>Passi da confermare</h3><div id="mnSteps"></div>
 <div class="evf"><label>Nuovo passo<input id="mnNS" placeholder="Descrizione del passo"></label><label class="mn-chk"><input type="checkbox" id="mnNF"> Foto obbligatoria</label><button class="btn" onclick="MNX.addStep()">Aggiungi passo</button></div>
 <h3>Documento (PDF o immagine, max 700 KB)</h3><input type="file" accept="application/pdf,image/*" onchange="MNX.loadDoc(this)"><div id="mnDocI" class="muted">${MN.tmpDoc?'Allegato: '+e_(MN.tmpDoc.name):'Nessun documento'}</div>
 <div class="row" style="justify-content:space-between">${id?`<button class="btn" onclick="MNX.delProc()">Elimina</button>`:'<span></span>'}<div class="row"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.saveProc()">Salva</button></div></div>`);drawSteps()}
function drawSteps(){const b=document.getElementById('mnSteps');if(b)b.innerHTML=MN.tmpSteps.map((s,k)=>`<div class="row mn-srow"><span class="mono">${k+1}.</span><span style="flex:1">${e_(s.t)}</span>${s.foto?'<span class="pill" style="color:var(--warn)">Foto</span>':''}<button class="btn sm" onclick="MNX.mvStep(${k},-1)" aria-label="Su">↑</button><button class="btn sm" onclick="MNX.rmStep(${k})">Rimuovi</button></div>`).join('')||'<p class="muted">Nessun passo</p>'}

async function drawEx(){const a=M.att.find(x=>x.id===MN.ex);if(!a)return closeO();const p=PA(a),i=IA(a),st=status(a);
 const done=p.steps.filter((s,k)=>a.ok[k]&&(!s.foto||(a.foto[k]||[]).length)).length;
 const thumbs=await Promise.all(p.steps.map((s,k)=>Promise.all((a.foto[k]||[]).map(id=>blob('manutFoto',id)))));
 const canDo=isR()||a.man===me();
 ovl(`<div class="mn-oh"><h2>${e_(p.cod)} · ${e_(p.desc)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="muted">${a.free?'Altra attività':'Attività preventiva'}${INOME(a)?' · '+e_(INOME(a)):''}${CMP(a)?' › '+e_(CMP(a)):''} · ${fd(a.due)} ${pill(st)}</div>${p._d?`<div class="mn-info" style="white-space:pre-line">${e_(p._d)}</div>`:''}
 ${p.doc?`<div><button class="btn" onclick="MNX.viewDoc('${p.id}')">📄 Apri documento procedura</button></div>`:''}
 ${!canDo?'<div class="muted">Attività assegnata a '+e_(a.man||'nessuno')+': puoi solo consultarla.</div>':''}
 ${p.steps.map((s,k)=>`<div class="mn-step"><label class="mn-chk"><input type="checkbox" ${a.ok[k]?'checked':''} ${canDo?'':'disabled'} onchange="MNX.tick(${k},this.checked)"> <span>${e_(s.t)}</span></label>
 ${s.foto||(a.foto[k]||[]).length?`<div class="row mn-ph">${canDo?`<label class="btn sm">📷 Aggiungi foto<input type="file" accept="image/*" capture="environment" hidden onchange="MNX.foto(${k},this)"></label>`:''}${thumbs[k].map((d,j)=>d?`<span class="mn-th"><img src="${d.data}" alt="Foto passo ${k+1}">${canDo?`<button class="btn sm" aria-label="Elimina foto" onclick="MNX.delFoto(${k},${j})">✕</button>`:''}</span>`:'').join('')}${s.foto&&!(a.foto[k]||[]).length?'<span class="muted">Foto obbligatoria</span>':''}</div>`:''}</div>`).join('')}
 <div class="mn-step"><b>Ricambi</b>${M.ric.filter(r=>r.att===a.id).map(r=>`<div class="row" style="font-size:13px"><span style="flex:1">${e_(r.desc)}${r.qta?' × '+e_(r.qta):''} <span class="muted">· ${r.buy?'da acquistare':'necessario'}</span></span>${canDo?`<button class="btn sm" onclick="MNX.ricDel('${r.id}',1)" aria-label="Elimina">✕</button>`:''}</div>`).join('')||'<span class="muted" style="font-size:13px">Nessun ricambio indicato.</span>'}
 ${canDo?`<div class="evf"><label>Ricambio<input id="mnRD" placeholder="es. Cartuccia grasso, guarnizione…"></label><label>Quantità<input id="mnRQ" placeholder="1"></label><label class="mn-chk"><input type="checkbox" id="mnRB" checked> Da acquistare</label><button class="btn" onclick="MNX.ricAdd()">+ Aggiungi ricambio</button></div>`:''}</div>
 <div class="evf"><label>Note<textarea id="mnNote" rows="3" ${canDo?'':'disabled'} onchange="MNX.note(this.value)">${e_(a.note)}</textarea></label></div>
 <div class="row" style="justify-content:space-between"><span class="muted">${done}/${p.steps.length} passi completati</span><div class="row"><button class="btn" onclick="MNX.pdfOpen()">PDF</button><button class="btn" onclick="MNX.close()">Esci</button>${canDo?`<button class="btn pri mn-done" ${done<p.steps.length?'disabled title="Conferma prima tutti i passi"':''} onclick="MNX.chiudi()">✓ Attività completata</button>`:''}</div></div>`)}

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
window.MNP={
 count(p){start();return M.att.filter(a=>a.man===p).length},
 html(p){start();if(!MN.ready)return '';const l=M.att.filter(a=>a.man===p);if(!l.length)return '';
  return `<div class="mn-pers"><h3>🔧 Manutenzioni <span class="mn-n">${l.length}</span></h3><div class="muted" style="font-size:13px">Apri un'attività per vedere i passi da eseguire, confermarli e chiuderla.</div>${split(l,false)}</div>`}
};
window.MNX={
 f(k,v){MN.f[k]=v;draw()},q(v){MN.f.q=v;MN.focus='mnQ';draw()},reset(){MN.f={imp:'',stato:'',man:'',proc:'',q:'',da:'',a:''};draw()},
 anno(v){MN.anno=v;draw()},close:closeO,impDett,
 catAdd(par){const c={id:nid('k'),nome:par?'Nuovo sotto-livello':'Nuovo livello',par:par||null};M.cat.push(c);saveM();draw();setTimeout(()=>{const x=[...document.querySelectorAll('.mn-catr input')].find(e=>e.value===c.nome);if(x){x.focus();x.select()}},30)},
 catRen(id,v){if(v.trim()){CAT(id).nome=v.trim();saveM()}},
 catDel(id){M.cat=M.cat.filter(c=>c.id!==id);saveM();draw()},
 newLib(){ovl(`<div class="mn-oh"><h2>Altra attività</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="muted" style="font-size:13px">Riparazioni, messe a punto o lavori fuori dal piano di manutenzione. L'impianto è facoltativo.</div>
 <div class="evf"><label>Titolo<input id="mnLT" placeholder="es. Riparazione porta sezionale"></label><label>Data<input type="date" id="mnLD" value="${tdy()}"></label><label>Assegnata a<select id="mnLM"><option value="">Da assegnare</option>${S.persone.map(p=>`<option>${e_(p)}</option>`).join('')}</select></label><label>Impianto (facoltativo)<select id="mnLI"><option value="">— nessuno —</option>${M.imp.map(i=>`<option value="${i.id}">${e_(i.cod)} · ${e_(i.nome)}</option>`).join('')}</select></label></div>
 <div class="evf"><label>Descrizione<textarea id="mnLX" rows="3" placeholder="Cosa c'è da fare"></textarea></label></div>
 <div class="evf"><label>Passi da confermare (facoltativi, uno per riga)<textarea id="mnLS" rows="3"></textarea></label></div>
 <label class="mn-chk"><input type="checkbox" id="mnLF"> Richiedi una foto del lavoro eseguito</label>
 <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.newLibOk()">Crea attività</button></div>`)},
 newLibOk(){const g=k=>document.getElementById(k).value.trim();const t=g('mnLT');if(!t)return mt('Scrivi il titolo');
  let steps=g('mnLS').split('\n').map(x=>x.trim()).filter(Boolean).map(x=>({t:x,foto:false}));if(!steps.length)steps=[{t:'Lavoro eseguito',foto:false}];if(document.getElementById('mnLF').checked)steps.push({t:'Foto del lavoro eseguito',foto:true});
  const a={id:nid('a'),vis:null,ass:null,imp:g('mnLI')||null,comp:null,proc:null,free:{titolo:t,desc:g('mnLX'),steps},due:g('mnLD')||tdy(),man:g('mnLM')||null,ok:steps.map(()=>false),foto:steps.map(()=>[]),note:''};
  M.att.push(a);saveM();closeO();mt('Attività creata'+(a.man?' e assegnata a '+a.man:''))},
 fatta(id){const a=M.att.find(x=>x.id===id);if(!a)return;const p=PA(a);MN.ex=id;
  const manca=p.steps.map((s_,k)=>s_.foto&&!(a.foto[k]||[]).length?s_.t:null).filter(Boolean);
  if(manca.length){drawEx();return mt('Manca la foto: '+manca.join(', '))}
  const todo=p.steps.filter((s_,k)=>!a.ok[k]);
  if(!todo.length)return MNX.chiudi();
  ovl(`<div class="mn-oh"><h2>Attività completata?</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div><b>${e_(p.cod)} · ${e_(p.desc)}</b><div class="muted">${e_(INOME(a))}</div></div>
  <div class="muted">Verranno confermati anche questi passi:</div><div class="mn-checks">${todo.map(x=>`<div class="mn-chk">✓ <span>${e_(x.t)}</span></div>`).join('')}</div>
  <div class="evf"><label>Note (facoltative)<textarea id="mnQN" rows="2">${e_(a.note)}</textarea></label></div>
  <div class="row" style="justify-content:space-between"><button class="btn" onclick="MNX.esegui('${id}')">Apri i dettagli</button><div class="row"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri mn-done" onclick="MNX.fattaOk()">✓ Conferma e chiudi</button></div></div>`)},
 fattaOk(){const a=M.att.find(x=>x.id===MN.ex);a.ok=a.ok.map(()=>true);const n=document.getElementById('mnQN');if(n)a.note=n.value;MNX.chiudi()},
 meseSel(ym){MN.mese=ym;draw()},anno2(d){MN.anno2=String(+MN.anno2+d);draw()},
 async plMese(ym){const d=MN.pl.data.slice(8,10);const last=new Date(+ym.slice(0,4),+ym.slice(5,7),0).getDate();MN.pl.data=ym+'-'+String(Math.min(+d,last)).padStart(2,'0');MN.pl.sel=null;await storico(ym.slice(0,4));drawPlan()},
 async plAnno(d){MN.pl.data=String(+MN.pl.data.slice(0,4)+d)+MN.pl.data.slice(4);MN.pl.sel=null;await storico(MN.pl.data.slice(0,4));drawPlan()},
 pSel(p){MN.pSel=p;draw()},apriImp(id){closeO();MN.impSel=id;if(S.tab!=='mimp'){S.tab='mimp';MN.tab='mimp';render()}else draw()},impBack(){MN.impSel=null;draw()},
 ricAdd(){const d=document.getElementById('mnRD').value.trim();if(!d)return mt('Scrivi il ricambio');const a=M.att.find(x=>x.id===MN.ex);
  M.ric.push({id:nid('r'),imp:a.imp,comp:a.comp,att:a.id,proc:a.proc,desc:d,qta:document.getElementById('mnRQ').value.trim(),buy:document.getElementById('mnRB').checked,stato:'da',da:me(),data:tdy()});saveM();drawEx();mt('Ricambio aggiunto')},
 ricNew(imp){ovl(`<div class="mn-oh"><h2>Nuovo ricambio</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="evf"><label>Impianto<select id="mnRI">${M.imp.map(i=>`<option value="${i.id}" ${i.id===imp?'selected':''}>${e_(i.cod)} · ${e_(i.nome)}</option>`).join('')}</select></label><label>Ricambio<input id="mnRD"></label><label>Quantità<input id="mnRQ" placeholder="1"></label><label class="mn-chk"><input type="checkbox" id="mnRB" checked> Da acquistare</label></div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.ricNewOk()">Aggiungi</button></div>`)},
 ricNewOk(){const d=document.getElementById('mnRD').value.trim();if(!d)return mt('Scrivi il ricambio');M.ric.push({id:nid('r'),imp:document.getElementById('mnRI').value,comp:null,att:null,desc:d,qta:document.getElementById('mnRQ').value.trim(),buy:document.getElementById('mnRB').checked,stato:'da',da:me(),data:tdy()});saveM();closeO();mt('Ricambio aggiunto')},
 ricStato(id,st){const r=M.ric.find(x=>x.id===id);r.stato=st;if(st==='ok'){r.acqData=tdy();r.acqDa=me()}else{r.acqData=null;r.acqDa=null}saveM();refresh();mt(st==='ok'?'Segnato come acquistato':'Riportato da acquistare')},
 ricDel(id,ex){M.ric=M.ric.filter(x=>x.id!==id);saveM();ex?drawEx():refresh()},
 mese(d){if(!d){MN.mese=tdy().slice(0,7)}else{const [y,m]=MN.mese.split('-').map(Number);const x=new Date(y,m-1+d,1);MN.mese=isoL(x).slice(0,7)}draw()},
 async plan(imp,data){MN.pl={imp:imp||'',data:data||tdy(),man:'',sel:null};if(imp){const m=M.ass.find(s=>s.imp===imp&&s.man);if(m)MN.pl.man=m.man}await storico(MN.pl.data.slice(0,4));drawPlan()},
 pl(k,v,keep){MN.pl[k]=v;if(!keep)MN.pl.sel=null;drawPlan()},
 plSel(ids,on){const s_=new Set(MN.pl.sel||[]);ids.forEach(x=>on?s_.add(x):s_.delete(x));MN.pl.sel=[...s_];drawPlan()},
 planOk(){const {imp,data,man}=MN.pl;const set=new Set(MN.pl.sel||[]);const inc=M.ass.filter(x=>set.has(x.id)&&!planned(x));if(!inc.length)return;const i=I(imp);
  const v={id:nid('v'),imp,data,man:man||null};M.vis.push(v);inc.forEach(x=>{newAtt(x,data,v.id,man);if(man)x.man=man});
  if(!i.avviato){i.avviato=data;M.ass.filter(x=>x.imp===imp&&!set.has(x.id)&&!x.next&&!planned(x)).forEach(x=>{const p=P(x.proc);if(p&&p.tipo!=='evento')x.next=addM(data,p.int)})}saveM();closeO();mt('Manutenzione pianificata il '+fd(data)+' con '+inc.length+' attività')},
 drop(id,d){const v=M.vis.find(x=>x.id===id);if(!v||v.data===d)return draw();v.data=d;M.att.filter(a=>a.vis===id).forEach(a=>a.due=d);saveM();draw();mt('Manutenzione spostata al '+fd(d))},
 visDett,visSet(id,k,v){const x=M.vis.find(z=>z.id===id);x[k]=v||null;M.att.filter(a=>a.vis===id).forEach(a=>{if(k==='data')a.due=v;else a.man=v||null});saveM();visDett(id)},
 visDel(id){M.att=M.att.filter(a=>a.vis!==id);M.vis=M.vis.filter(v=>v.id!==id);saveM();closeO();mt('Manutenzione annullata: le procedure tornano da pianificare')},
 setLast(aid,v){const s=M.ass.find(x=>x.id===aid),p=P(s.proc);s.last=v||null;s.next=v?addM(v,p.int):null;saveM();drawCfg()},
 setManImp(imp,v,ids){if(!v)return;const set=ids.split(',');M.att.filter(a=>set.includes(a.id)).forEach(a=>a.man=v==='-'?null:v);saveM();refresh();mt(v==='-'?'Assegnazioni tolte':set.length+' attività assegnate a '+v)},
 setMan(id,v){const a=M.att.find(x=>x.id===id);a.man=v||null;saveM();mt(v?'Assegnata a '+v:'Assegnazione tolta')},
 evento(sid){const s=M.ass.find(a=>a.id===sid);s.evt=true;saveM();impDett(s.imp);mt('Evento registrato: la procedura entra nella prossima manutenzione pianificata')},
 newImp(){ovl(`<div class="mn-oh"><h2>Nuovo impianto</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="evf"><label>Categoria<select id="mnICat">${catOpts('')}</select></label><label>Codice<input id="mnICod" placeholder="es. IMP-100"></label><label>Nome<input id="mnINome"></label><label>Cliente<input id="mnICli"></label></div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.addImp()">Crea e configura</button></div>`)},
 newTipo(){ovl(`<div class="mn-oh"><h2>Nuovo tipo di componente</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="evf"><label>Nome<input id="mnTNome" placeholder="es. Robot, Laser, Pressa…"></label></div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.addTipo()">Crea</button></div>`)},
 editTipo(tid){const t=T(tid);ovl(`<div class="mn-oh"><h2>${e_(t.nome)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="evf"><label>Nome<input value="${e_(t.nome)}" onchange="MNX.tipoNome('${tid}',this.value)"></label></div><div class="muted">Procedure del tipo: le ricevono tutti i componenti di questo tipo. Se aggiungi o togli una spunta, la modifica vale subito su tutti gli impianti dove c'è questo componente.</div><div class="mn-checks">${M.proc.map(p=>`<label class="mn-chk"><input type="checkbox" ${t.procs.includes(p.id)?'checked':''} onchange="MNX.togTipo('${t.id}','${p.id}',this.checked)"> <span><b>${e_(p.cod)}</b> ${e_(p.desc)} <span class="muted">· ${freq(p)}</span></span></label>`).join('')||'<span class="muted">Crea prima le procedure</span>'}</div><div class="row" style="justify-content:flex-end"><button class="btn pri" onclick="MNX.close()">Fatto</button></div>`)},
 tipoNome(tid,v){if(v.trim()){T(tid).nome=v.trim();saveM()}},
 addImp(){const v=k=>document.getElementById(k).value.trim();if(!v('mnICod'))return mt('Inserisci il codice');const i={id:nid('i'),cod:v('mnICod'),nome:v('mnINome'),cli:v('mnICli'),cat:document.getElementById('mnICat')?.value||null,comps:[]};M.imp.push(i);saveM();MNX.config(i.id)},
 config(id){MN.cfgImp=id;drawCfg()},
 impSet(k,v){I(MN.cfgImp)[k]=v.trim()||(k==='cat'?null:'');saveM()},
 delImp(){const i=I(MN.cfgImp);ovl(`<h2>Eliminare ${e_(i.cod)}?</h2><p>Vengono tolti componenti, procedure assegnate e attività aperte. Lo storico resta.</p><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.config('${i.id}')">Annulla</button><button class="btn pri" onclick="MNX.delImpOk()">Elimina</button></div>`)},
 delImpOk(){const id=MN.cfgImp;M.att=M.att.filter(a=>a.imp!==id);M.ass=M.ass.filter(a=>a.imp!==id);M.imp=M.imp.filter(i=>i.id!==id);saveM();closeO();mt('Impianto eliminato')},
 addComp(){const s=document.getElementById('mnCSigla').value.trim();if(!s)return mt('Inserisci la sigla del componente');
  const i=I(MN.cfgImp),c={id:nid('c'),tipo:MN.cfgTipo,sigla:s};(i.comps=i.comps||[]).push(c);
  const ps=(T(MN.cfgTipo)?.procs||[]).filter(P);
  ps.forEach(pid=>assign(i.id,pid,null,null,c.id));saveM();drawCfg();mt('Componente aggiunto con '+ps.length+' procedure')},
 addExtra(cid){const pid=document.getElementById('mnXp_'+cid)?.value;if(!pid)return;assign(MN.cfgImp,pid,null,null,cid,false);saveM();drawCfg();mt('Procedura aggiunta solo a questo componente')},
 delAss(aid){M.att=M.att.filter(a=>a.ass!==aid);M.ass=M.ass.filter(a=>a.id!==aid);saveM();drawCfg()},
 delComp(cid){const i=I(MN.cfgImp);const ids=M.ass.filter(a=>a.comp===cid).map(a=>a.id);M.att=M.att.filter(a=>!ids.includes(a.ass));M.ass=M.ass.filter(a=>a.comp!==cid);i.comps=i.comps.filter(c=>c.id!==cid);saveM();drawCfg();mt('Componente rimosso (lo storico resta)')},
 addTipo(){const n=document.getElementById('mnTNome').value.trim();if(!n)return;const t={id:nid('t'),nome:n,procs:[]};M.tipi.push(t);saveM();MNX.editTipo(t.id)},
 togTipo(tid,pid,on){const t=T(tid);let n=0;
  M.imp.forEach(i=>(i.comps||[]).filter(c=>c.tipo===tid).forEach(c=>{const mine=M.ass.filter(a=>a.comp===c.id);
   if(on){if(!mine.some(a=>a.proc===pid)){assign(i.id,pid,null,null,c.id,true);n++}}
   else{const rm=mine.filter(a=>a.proc===pid&&isStd(a)).map(a=>a.id);if(rm.length){M.att=M.att.filter(a=>!rm.includes(a.ass));M.ass=M.ass.filter(a=>!rm.includes(a.id));n++}}}));
  t.procs=on?[...new Set([...t.procs,pid])]:t.procs.filter(x=>x!==pid);saveM();
  mt(n?(on?'Procedura aggiunta a ':'Procedura tolta da ')+n+' componenti'+(on?' (da fare alla prossima manutenzione)':''):'Tipo aggiornato')},
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
 async chiudi(){const a=M.att.find(x=>x.id===MN.ex),p=PA(a),s=M.ass.find(x=>x.id===a.ass),i=IA(a);
  const c={...a,chiusa:tdy(),esec:me(),_imp:a.imp?i.cod+' '+i.nome:'',_cat:a.cat||null,_cmp:CMP(a),_pcod:a.free?'Attività':p.cod,_pdesc:p.desc,_free:a.free||null,_norma:p.norma,_steps:p.steps.map(x=>({t:x.t,foto:x.foto}))};const y=c.chiusa.slice(0,4);
  try{const arr=await storico(y);arr.push(c);await window.FBM.saveY(y,arr)}catch(er){return mt('Chiusura non salvata: '+FB.err(er))}
  M.att=M.att.filter(x=>x.id!==a.id);if(!(M.anni||[]).includes(y))(M.anni=M.anni||[]).push(y);
  let msg='✓ Attività completata';if(s){s.last=c.chiusa;if(p.tipo==='cal'){s.next=addM(s.next&&s.next<=c.chiusa?s.next:c.chiusa,p.int)}else if(p.tipo==='ultima'){s.next=addM(c.chiusa,p.int)}else{s.evt=false}msg+=p.tipo==='evento'?' · in attesa del prossimo evento':' · prossima richiesta dal '+fd(s.next)}
  if(a.vis&&!M.att.some(x=>x.vis===a.vis))M.vis=M.vis.filter(v=>v.id!==a.vis);
  saveM();closeO();mt(msg)},
 pdfOpen(){const a=M.att.find(x=>x.id===MN.ex),p=PA(a),i=IA(a);pdf(a,p,a.imp?i.cod+' '+i.nome+(i.cli?' ('+i.cli+')':''):'—',CMP(a))},
 async pdf(y,id){const a=(await storico(y)).find(x=>x.id===id);if(!a)return;const p={cod:a._pcod,desc:a._pdesc,norma:a._norma,steps:a._steps||P(a.proc)?.steps||[],_d:a._free?.desc};const i=I(a.imp);pdf(a,p,a._imp+(i&&i.cli?' ('+i.cli+')':''),a._cmp)},
 xls(){if(!window.XLSX)return mt('Excel non disponibile');const rows=(MN._sto||[]).map(a=>({Data:fd(a.chiusa),Impianto:a._imp,Cliente:I(a.imp)?.cli||'',Componente:a._cmp,Procedura:a._pcod,Descrizione:a._pdesc,'Eseguita da':a.esec,'Passi confermati':a.ok.filter(Boolean).length+'/'+a.ok.length,Foto:a.foto.flat().length,Note:a.note}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Interventi '+MN.anno);XLSX.writeFile(wb,'Manutenzioni_'+MN.anno+'.xlsx')}
};
})();
