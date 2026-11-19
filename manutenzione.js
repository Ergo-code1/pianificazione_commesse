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
const addD=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+Number(n||0));return isoL(x)};
const avvDef=p=>p.tipo==='evento'?0:(+p.int||1)<=1?7:(+p.int)<=3?15:(+p.int)<=6?30:60;
const avvOf=p=>p.avv!=null&&p.avv!==''?+p.avv:avvDef(p);
const fd=d=>d?d.split('-').reverse().join('/'):'—';
const nid=p=>p+(M.nextId++).toString(36)+Math.random().toString(36).slice(2,5);
const TIPI={cal:'Ricorrente a calendario',ultima:'Da ultima chiusura',evento:'A evento'};
const isR=()=>typeof can==='function'&&can('manut');
const me=()=>S.user&&S.user.nome;
const nk_=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');const sameP=(a,b)=>!!a&&!!b&&nk_(a)===nk_(b);const mine=a=>sameP(a.man,me());
// persone dell'ente corrente (in manutenzione solo quelle del reparto)
const PERS=()=>typeof visPers==='function'?visPers():S.persone;
const P=id=>id?(M.proc.find(x=>x.id===id)||{id,cod:'?',desc:'Procedura mancante',norma:'',tipo:'ultima',int:1,steps:[],doc:null,_miss:1}):undefined,I=id=>M.imp.find(x=>x.id===id),T=id=>M.tipi.find(x=>x.id===id);
const PA0=a=>a&&a.free?{id:null,cod:'Attività',desc:a.free.titolo,norma:'',tipo:'libera',int:0,steps:a.free.steps||[],doc:null,_d:a.free.desc}:P(a.proc);
const PA=a=>{const b=PA0(a);if(!b||!a||!a.sub)return b;return{...b,steps:b.steps.filter((x,k)=>a.sub.includes(k)),_sub:1}};
const IA=a=>I(a.imp)||{id:'',cod:'Generica',nome:'',cli:'',comps:[]};
const INOME=a=>{const i=I(a.imp);return i?i.cod+' · '+i.nome:''};
const CMP=a=>{const i=I(a.imp);const c=i&&(i.comps||[]).find(x=>x.id===a.comp);return c?c.sigla:''};
const freq=p=>TIPI[p.tipo]+(p.tipo!=='evento'?' · ogni '+p.int+' mesi':'');
function mt(t){const el=document.getElementById('mnToast')||Object.assign(document.body.appendChild(document.createElement('div')),{id:'mnToast',className:'mn-toast'});el.textContent=t;el.hidden=false;clearTimeout(el._t);el._t=setTimeout(()=>el.hidden=true,3200)}

// ---------- persistenza ----------
let svT=null,lastM='';
// protezione dati: un'app non aggiornata non può sovrascrivere i dati scritti da una versione più nuova
const myV=()=>typeof VERSIONE!=='undefined'?VERSIONE:'0';
const cmpV=(a,b)=>{const x=String(a||'0').split('.').map(Number),y=String(b||'0').split('.').map(Number);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)-(y[i]||0)}return 0};
function oldApp(){if(!(M.appV&&cmpV(M.appV,myV())>0))return false;MN.old=true;
 try{if(!sessionStorage.getItem('epUpd'+M.appV)){sessionStorage.setItem('epUpd'+M.appV,'1');caches&&caches.keys().then(k=>Promise.all(k.map(x=>caches.delete(x)))).finally(()=>location.replace(location.pathname+'?v='+M.appV));return true}}catch(e){}
 mt('App non aggiornata (v'+myV()+', serve v'+M.appV+'): chiudi e riapri l\'app. Le modifiche non vengono salvate.');return true}
// le procedure stanno in un documento a parte (manutDoc/_proc) per non superare il limite di 1 MB
let lastP='';
const stab=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((r,x)=>(r[x]=v[x],r),{}):v);
const DEF=()=>({tipi:[],proc:[],imp:[],ass:[],att:[],vis:[],ric:[],anni:[],nextId:1});
const curM=()=>{const o=JSON.parse(JSON.stringify(M));delete o.procSep;return o};
function saveM(){if(MN.old||oldApp())return mt('App non aggiornata: modifiche non salvate. Chiudi e riapri l\'app.');
 if(MN.noProc||(M.std1&&!M.proc.length))return mt('Procedure non ancora caricate: modifica non salvata, riprova tra qualche secondo.');
 if(cmpV(myV(),M.appV)>0)M.appV=myV();clearTimeout(svT);svT=setTimeout(doSaveM,400)}
async function doSaveM(){svT=null;if(!MN.base)return;const loc=curM();if(stab(loc)===lastM)return;if(MN.saving){MN.again=1;return}MN.saving=1;
 const b=new Blob([stab(loc)]).size;if(b>950000)mt('Attenzione: dati manutenzione vicini al limite di 1 MB');
 MN.sv={t:new Date().toLocaleTimeString(),st:'in corso',b};
 try{const out=await window.FBM.txMain(MN.base,loc);MN.sv.st='riuscito';
  const now=curM(),mer=window.EPM.mergeVal(loc,now,out);MN.base=out;lastM=stab(out);
  if(stab(mer)!==stab(now)){M=Object.assign(DEF(),mer);refresh()}}
 catch(er){MN.sv.st='NON riuscito: '+FB.err(er);mt('Salvataggio manutenzione NON riuscito ('+FB.err(er)+'): riprovo tra poco');setTimeout(saveM,4000)}
 finally{MN.saving=0;if(MN.again){MN.again=0;saveM()}}}
// recupero procedure perse (v2.8.5-2.8.7): da manutDoc/_proc, oppure ricostruite da manut_std.json con gli stessi id (ordine nei tipi)
async function recProc(){if(MN._rec)return;MN._rec=1;try{
 const L=await (await fetch('manut_std.json?v=2.9.8',{cache:'no-store'})).json();const nk=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const out=[];M.tipi.forEach(t=>{const l=L.filter(x=>nk(x.comp)===nk(t.nome));t.procs.forEach((id,k)=>{const x=l[k];if(x)out.push({id,cod:x.cod,desc:x.desc,norma:x.norma,tipo:x.tipo,int:x.int,min:x.min,avv:x.avv,mat:x.mat,steps:x.steps,doc:x.loto?{id:'dloto',name:'Procedura_LOTO.pdf',type:'application/pdf'}:null})})});
 MN.recP=out}catch(er){mt('Recupero procedure non riuscito: '+(er.message||er));MN.recP=[]}
 MN.stage='procedure recuperate: '+(MN.recP||[]).length;MN._rec=0;const m0=lastM;lastM='';onRemote(JSON.parse(m0||'{}'))}
function onRemote(d){const txt=stab(d||{});if(txt===lastM)return;const loc=MN.base?curM():null;lastM=txt;const keep=M.proc;const srv=JSON.parse(txt);const mer=loc?window.EPM.mergeVal(MN.base,loc,srv):srv;MN.base=srv;M=Object.assign(DEF(),JSON.parse(JSON.stringify(mer)));MN.mainL=true;if(loc&&stab(mer)!==txt&&!svT)saveM();
 let fix=false;if(!M.proc||!M.proc.length){if(keep&&keep.length){M.proc=keep;fix=true}else if(M.std1){if(!MN.procL&&!MN.procTO){MN.stage='attendo procedure…';clearTimeout(MN._to);MN._to=setTimeout(()=>{MN.procTO=1;const m0=lastM;lastM='';onRemote(JSON.parse(m0||'{}'))},4000);return}if(MN.pdoc&&MN.pdoc.length){M.proc=MN.pdoc;fix=true}else if(MN.recP&&MN.recP.length){M.proc=MN.recP;fix=true}else{if(MN.recP===undefined){recProc();MN.stage='recupero procedure…';return}MN.noProc=true}}}
 delete M.procSep;M.vis=M.vis||[];M.ric=M.ric||[];M.cat=M.cat||[];M.fatte=M.fatte||[];if(oldApp())return;migra();if(fix&&isR())setTimeout(()=>{lastM='';saveM()},0);if(isR())setTimeout(restore,0);if(isR()&&!M.std1)setTimeout(importStd,50);if(isR()&&!M.pressaV)setTimeout(updPressa,80);if(isR()&&!M.noUpl1)setTimeout(noUpl,400);if(isR()&&!M.scaf1)setTimeout(addScaf,700);if(isR()&&!M.hb1)setTimeout(addHB,1100);setTimeout(addPC,1500);setTimeout(fixPC,2500);setTimeout(addCP,3500);setTimeout(addMP,4500);if(isR()&&!M.avv1)setTimeout(setAvv,1500);M.ass.forEach(s=>{if(s.next===undefined){const a=M.att.find(x=>x.ass===s.id);s.next=a?a.due:(s.start||null);s.last=s.last||null}});MN.ready=true;
 const o=document.getElementById('mnOvl');if(o&&!o.hidden)return;
 if(!(document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)))refresh()}
function onProc(d){MN.procL=true;MN.pdoc=d&&d.proc||null;if(MN.mainL&&(!M.proc||!M.proc.length)){const m0=lastM;lastM='';onRemote(JSON.parse(m0||'{}'))}}
function start(){if(!window.FBM||window.FBM._u)return;MN.err=null;window.FBM.listenDoc&&window.FBM.listenDoc('manutDoc','_proc',onProc,er=>{MN.procErr=FB.err(er);mt('Procedure non leggibili: '+MN.procErr);onProc(null)});window.FBM.listen(d=>{if(d===null){MN.ready=true;if(isR()&&!M.tipi.length)seedBase();refresh();return}onRemote(d)},er=>{MN.err=FB.err(er);draw()})}
const HB={},HT={};
async function storico(y,force){y=String(y);if(!H[y]||force||Date.now()-(HT[y]||0)>60000){const l=await window.FBM.getY(y).catch(er=>{mt('Storico non leggibile: '+FB.err(er));return null});if(l){const ob=HB[y];HB[y]=JSON.parse(JSON.stringify(l));HT[y]=Date.now();H[y]=H[y]&&ob&&!force?window.EPM.mergeVal(ob,H[y],l):l}else if(!H[y])H[y]=[]}return H[y]}
// salva lo storico dell'anno fondendolo con le chiusure fatte da altri
async function saveYm(y){y=String(y);const loc={att:JSON.parse(JSON.stringify(H[y]||[]))};const out=await window.FBM.txY(y,{att:HB[y]||[]},loc);const now=H[y]||[];H[y]=window.EPM.mergeVal(loc.att,now,out.att||[]);HB[y]=JSON.parse(JSON.stringify(out.att||[]));HT[y]=Date.now();return H[y]}
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
function status(a){if(a.chiusa)return['Chiusa','var(--ok)','c'];if(!a.due)return['Da ripianificare','var(--accent)','r'];const t=tdy();if(a.due<t)return['In ritardo · non conclusa','var(--accent)','r'];if(a.due===t)return['Oggi','var(--warn)','g'];return['Pianificata','var(--info)','b']}
const pill=s=>`<span class="pill" style="color:${s[1]}">${s[0]}</span>`;
// stato di una procedura assegnata: serve farla entro la data d?
const planned=s=>M.att.find(a=>a.ass===s.id&&a.due);
const pend=s=>M.att.find(a=>a.ass===s.id&&!a.due);
const nextWork=d=>{const x=new Date(d+'T12:00:00');do{x.setDate(x.getDate()+1)}while(x.getDay()===0||x.getDay()===6);return isoL(x)};
function LOG(az,a,txt){if(!a)return;M.log=M.log||[];const p=PA(a)||{};M.log.push({t:new Date().toISOString().slice(0,16).replace('T',' '),chi:(S.user&&S.user.nome)||'sistema',az,att:a.id,imp:a.imp||null,cod:(p.cod||'')+' '+(p.desc||''),man:a.man||null,txt:txt||''});if(M.log.length>800)M.log=M.log.slice(-800)}
function restore(){if(M.rip3)return;let n=0;M.att.forEach(a=>{if(!a.due&&!a.sub){a.due=tdy();const v={id:nid('v'),imp:a.imp||null,data:a.due,man:a.man||null,tit:a.free?a.free.titolo:null};M.vis.push(v);a.vis=v.id;LOG('Ripristinata',a,'rimessa '+(a.man?'a '+a.man:'senza nome')+' per oggi (era stata tolta in automatico)');n++}});M.rip3=1;saveM();if(n){refresh();mt(n+' attività tolte in automatico sono state rimesse sulle persone per oggi')}}
function sweep(){let ch=0;const t=tdy();M.att.forEach(a=>{if(a.due&&a.due<t&&!a.ok.some(Boolean)){LOG('Non completata',a,'non eseguita entro il '+fd(a.due)+': torna da ripianificare'+(a.man?' (era di '+a.man+')':''));a.due=null;a.vis=null;ch=1}});if(ch){M.vis=M.vis.filter(v=>M.att.some(a=>a.vis===v.id));saveM();refresh()}}
function dueOn(s,d){const p=P(s.proc);if(!p)return false;if(pend(s))return true;if(p.tipo==='evento')return !!s.evt;return !s.next||s.next<=d}
function assStatus(s){const r=assStatus0(s);if(s.incompleto&&r[2]!=='r')return[r[0]+' · da concludere',r[2]==='v'?'var(--warn)':r[1],r[2]==='v'?'g':r[2]];if(s.incompleto)return[r[0]+' · da concludere',r[1],r[2]];return r}
function assStatus0(s){const p=P(s.proc),t=tdy(),pa=planned(s);
 if(pend(s))return['Da ripianificare','var(--accent)','r'];
 if(pa)return['Pianificata '+fd(pa.due),'var(--info)','b'];
 if(p.tipo==='evento')return s.evt?['Evento da gestire','var(--accent)','r']:['In attesa di evento','var(--off)','n'];
 if(!s.next)return['Da fare (mai eseguita)','var(--accent)','r'];
 if(s.next<t)return['Scaduta il '+fd(s.next),'var(--accent)','r'];
 if(s.next<=addD(t,avvOf(p)))return['In scadenza il '+fd(s.next),'var(--warn)','g'];
 return['Prossima '+fd(s.next),'var(--ok)','v']}
function impStatus(id){const ass=M.ass.filter(a=>a.imp===id),st=ass.map(assStatus),open=M.att.filter(a=>a.imp===id),imp=I(id);
 if(imp&&!imp.avviato&&!open.length)return{open,w:['Mai pianificato','var(--accent)','r'],next:null,toPlan:ass.length||1,mai:1,inc:0};
 const w=st.find(x=>x[2]==='r')?['Da pianificare','var(--accent)','r']:st.find(x=>x[2]==='g')?['In scadenza','var(--warn)','g']:st.find(x=>x[2]==='b')?['Pianificato','var(--info)','b']:ass.length&&st.every(x=>x[2]==='n')?['Attesa evento','var(--off)','n']:['In regola','var(--ok)','v'];
 const nx=ass.filter(s=>!planned(s)&&P(s.proc)?.tipo!=='evento').map(s=>s.next||tdy()).sort()[0];
 return{open,w,next:nx,toPlan:st.filter(x=>x[2]==='r'||x[2]==='g').length,inc:ass.filter(x=>x.incompleto).length}}
// procedure standard (manut_std.json) + Procedura LOTO: caricate una sola volta
async function importStd(){if(M.std1||MN._imp||!isR())return;MN._imp=1;
 try{const L=await (await fetch('manut_std.json?v=2.8.1',{cache:'no-store'})).json();
  let loto=docList().find(d=>/loto/i.test(d.name||''));
  if(!loto){const b=await (await fetch('Procedura_LOTO.pdf',{cache:'no-store'})).blob();
   const data=await new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=ko;r.readAsDataURL(b)});
   const id='dloto';await window.FBM.putBlob('manutDoc',id,{name:'Procedura_LOTO.pdf',type:'application/pdf',data});BL[id]={name:'Procedura_LOTO.pdf',type:'application/pdf',data};
   loto={id,name:'Procedura_LOTO.pdf',type:'application/pdf',size:b.size}}
  if(M.std1)return;
  const nk=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');let n=0,sk=0;
  L.forEach(x=>{let t=M.tipi.find(t=>nk(t.nome)===nk(x.comp));if(!t){t={id:nid('t'),nome:x.comp,procs:[]};M.tipi.push(t)}
   if(M.proc.some(p=>p.cod===x.cod)){sk++;return}
   const p={id:nid('p'),cod:x.cod,desc:x.desc,norma:x.norma,tipo:x.tipo,int:x.int,min:x.min,avv:x.avv,mat:x.mat,steps:x.steps,doc:x.loto?loto:null};M.proc.push(p);t.procs.push(p.id);n++});
  M.std1=true;saveM();refresh();mt(n+' procedure standard caricate e collegate ai tipi componente'+(sk?' ('+sk+' codici già presenti, saltati)':''))}
 catch(er){mt('Caricamento procedure standard non riuscito: '+(er.message||er))}finally{MN._imp=0}}
function skipAss(s){const p=P(s.proc);if(!p)return;if(p.tipo==='evento')s.evt=false;else s.next=addM(tdy(),p.int||1);s.incompleto=null}
// aggiornamento una tantum: procedure «Pressa» riscritte per pressa a iniezione plastica (PM015-PM018)
async function updPressa(){if(M.pressaV||MN._pr||!isR()||!M.proc.length)return;MN._pr=1;try{
 const L=await (await fetch('manut_std.json?v=2.9.8',{cache:'no-store'})).json();if(M.pressaV)return;const loto=docList().find(d=>/loto/i.test(d.name||''));let n=0;
 L.filter(x=>x.comp==='Pressa').forEach(x=>{const p=M.proc.find(q=>q.cod===x.cod&&/^pressa/i.test(q.desc||''));if(!p)return;
  Object.assign(p,{desc:x.desc,norma:x.norma,tipo:x.tipo,int:x.int,min:x.min,avv:x.avv,mat:x.mat,steps:x.steps,doc:x.loto?(p.doc||loto||null):null});
  M.att.filter(a=>a.proc===p.id&&!a.sub).forEach(a=>{a.ok=p.steps.map(()=>false);a.foto=p.steps.map(()=>[])});n++});
 M.pressaV=1;saveM();refresh();if(n)mt(n+' procedure Pressa aggiornate per pressa a iniezione')}catch(er){}finally{MN._pr=0}}
// una tantum: nessuna richiesta di caricare foto o documenti nelle procedure (si aggiungono a mano se servono)
async function noUpl(){if(M.noUpl1||MN._nu||!isR()||!M.proc.length)return;MN._nu=1;try{
 const L=await (await fetch('manut_std.json?v=2.9.8',{cache:'no-store'})).json();if(M.noUpl1)return;
 const RX=/fotograf|\b(caric|alleg)[a-z]*\b[^.\n]{0,30}\b(foto|rapporto|verbale|certificat|document)/i;let n=0;
 M.proc.forEach(p=>{const before=stab(p.steps),len=p.steps.length;
  const x=L.find(q=>q.cod===p.cod&&q.desc===p.desc&&['PM007','PM011','PM018','PM033','PM039','PM043','PM049'].includes(q.cod));
  if(x)p.steps=JSON.parse(JSON.stringify(x.steps));
  p.steps=p.steps.filter(st=>!(RX.test(st.t)&&!(st.i||'').trim())).map(st=>{const o={...st,foto:false};if(o.i){o.i=o.i.split('\n').filter(l=>!RX.test(l)).join('\n').trim();if(!o.i)delete o.i}return o});
  if(stab(p.steps)!==before){n++;if(p.steps.length!==len)M.att.filter(a=>a.proc===p.id&&!a.sub).forEach(a=>{a.ok=p.steps.map(()=>false);a.foto=p.steps.map(()=>[])})}});
 M.noUpl1=1;saveM();refresh();mt(n?n+' procedure ripulite: nessuna richiesta di foto o documenti':'Procedure già senza richieste di foto o documenti')}catch(er){}finally{MN._nu=0}}
// una tantum: tipo «Scaffalature» con le procedure UNI EN 15635 (trimestrale con 2 foto + annuale)
async function addScaf(){if(M.scaf1||MN._sc||!isR()||!M.proc.length)return;if(!M.noUpl1){setTimeout(addScaf,800);return}MN._sc=1;try{
 const L=(await (await fetch('manut_std.json?v=2.9.8',{cache:'no-store'})).json()).filter(x=>x.comp==='Scaffalature');if(M.scaf1||!L.length)return;
 let t=M.tipi.find(x=>/^scaffal/i.test(x.nome||''));if(!t){t={id:nid('t'),nome:'Scaffalature',procs:[]};M.tipi.push(t)}
 const out=[];L.forEach(x=>{if(M.proc.some(p=>p.desc===x.desc))return;const cod=M.proc.some(p=>p.cod===x.cod)?nextCod():x.cod;
  const p={id:nid('p'),cod,desc:x.desc,norma:x.norma,tipo:x.tipo,int:x.int,avv:x.avv,min:x.min,mat:x.mat,steps:JSON.parse(JSON.stringify(x.steps)),doc:null};M.proc.push(p);t.procs.push(p.id);out.push(cod)});
 M.scaf1=1;saveM();refresh();if(out.length)mt('Aggiunte '+out.join(' e ')+' (Scaffalature)')}catch(er){}finally{MN._sc=0}}
// una tantum (v2.14.0): procedure termoregolatori HB-Therm dal manuale
async function addHB(){if(M.hb1||MN._hb||!isR()||!M.proc.length)return;if(!M.scaf1){setTimeout(addHB,900);return}MN._hb=1;try{
 const L=(await (await fetch('manut_std.json?v=2.14.0',{cache:'no-store'})).json()).filter(x=>x.comp==='Termoregolatore HB-Therm');if(M.hb1||!L.length)return;
 const loto=docList().find(d=>/loto/i.test(d.name||''))||null;
 let t=M.tipi.find(x=>/hb.?therm/i.test(x.nome||''));if(!t){t={id:nid('t'),nome:'Termoregolatore HB-Therm',procs:[]};M.tipi.push(t)}
 const out=[];L.forEach(x=>{if(M.proc.some(p=>p.desc===x.desc))return;const cod=M.proc.some(p=>p.cod===x.cod)?nextCod():x.cod;
  const p={id:nid('p'),cod,desc:x.desc,norma:x.norma,tipo:x.tipo,int:x.int,avv:x.avv,min:x.min,mat:x.mat,steps:JSON.parse(JSON.stringify(x.steps)),doc:x.loto&&loto?{id:loto.id,name:loto.name,type:loto.type}:null};M.proc.push(p);t.procs.push(p.id);out.push(cod)});
 M.hb1=1;saveM();refresh();if(out.length)mt('Aggiunte '+out.join(', ')+' (Termoregolatore HB-Therm)')}catch(er){}finally{MN._hb=0}}
// una tantum (v2.14.8): procedure serbatoi in pressione e compressori
async function addPC(){if(M.pc1||MN._pc||!isR()||!M.proc.length)return;if(!M.hb1){setTimeout(addPC,900);return}MN._pc=1;try{
 const TN=['Serbatoio in pressione','Compressore a vite','Essiccatore'];const L=(await (await fetch('manut_std.json?v=2.14.8b',{cache:'no-store'})).json()).filter(x=>TN.includes(x.comp));if(M.pc1||!L.length)return;
 const out=[];TN.forEach(nm=>{let t=M.tipi.find(x=>(x.nome||'').trim().toLowerCase()===nm.toLowerCase());if(!t){t={id:nid('t'),nome:nm,procs:[]};M.tipi.push(t)}
  L.filter(x=>x.comp===nm).forEach(x=>{if(M.proc.some(p=>p.desc===x.desc))return;const cod=M.proc.some(p=>p.cod===x.cod)?nextCod():x.cod;
   const p={id:nid('p'),cod,desc:x.desc,norma:x.norma,tipo:x.tipo,int:x.int,avv:x.avv,min:x.min,mat:x.mat,est:x.est?1:0,steps:JSON.parse(JSON.stringify(x.steps)),doc:null};M.proc.push(p);t.procs.push(p.id);out.push(cod)})});
 M.pc1=1;M.pc2=1;saveM();refresh();if(out.length)mt('Aggiunte '+out.join(', ')+' (serbatoi, compressori, essiccatori)')}catch(er){}finally{MN._pc=0}}
// una tantum: tipo Essiccatore separato, tagliando + F-gas uniti in un solo intervento esterno annuale
async function fixPC(){if(!M.pc1||M.pc2||MN._pc2||!isR()||!M.proc.length)return;MN._pc2=1;try{
 const L=await (await fetch('manut_std.json?v=2.14.8b',{cache:'no-store'})).json();if(M.pc2)return;const S=c=>L.find(x=>x.cod===c);
 const byD=d=>M.proc.find(p=>p.desc===d);const tC=M.tipi.find(x=>(x.nome||'').trim().toLowerCase()==='compressore a vite');
 let tE=M.tipi.find(x=>(x.nome||'').trim().toLowerCase()==='essiccatore');if(!tE){tE={id:nid('t'),nome:'Essiccatore',procs:[]};M.tipi.push(tE)}
 const setSteps=(p,x)=>{Object.assign(p,{desc:x.desc,norma:x.norma,min:x.min,mat:x.mat,steps:JSON.parse(JSON.stringify(x.steps))});M.att.filter(a=>a.proc===p.id).forEach(a=>{a.ok=p.steps.map((s,k)=>(a.ok||[])[k]||false);a.foto=p.steps.map((s,k)=>(a.foto||[])[k]||[])})};
 const e=byD('Essiccatore – Controllo mensile');if(e){M.tipi.forEach(t=>{if(t!==tE)t.procs=t.procs.filter(id=>id!==e.id)});if(!tE.procs.includes(e.id))tE.procs.push(e.id)}
 const c81=byD('Compressore – Controllo e pulizia mensile'),x81=S('PM081');if(c81&&x81)setSteps(c81,{...x81,desc:c81.desc});
 const c82=byD('Compressore – Tagliando (12 mesi o 4000 h)'),x82=S('PM082');if(c82&&x82){setSteps(c82,x82);c82.est=1}
 const f=byD('Essiccatore – Controllo perdite F-gas');if(f){M.tipi.forEach(t=>t.procs=t.procs.filter(id=>id!==f.id));const open=M.att.some(a=>a.proc===f.id);
  if(!open){M.ass=M.ass.filter(a=>a.proc!==f.id);M.proc=M.proc.filter(p=>p.id!==f.id)}}
 M.pc2=1;saveM();refresh();mt('Procedure compressori/essiccatori aggiornate')}catch(er){}finally{MN._pc2=0}}
// una tantum (v2.15.2): procedure carroponte
async function addCP(){if(M.cp1||MN._cp||!isR()||!M.proc.length)return;if(!M.pc1){setTimeout(addCP,900);return}MN._cp=1;try{
 const nm='Carroponte';const L=(await (await fetch('manut_std.json?v=2.15.2',{cache:'no-store'})).json()).filter(x=>x.comp===nm);if(M.cp1||!L.length)return;
 let t=M.tipi.find(x=>(x.nome||'').trim().toLowerCase()===nm.toLowerCase());if(!t){t={id:nid('t'),nome:nm,procs:[]};M.tipi.push(t)}const out=[];
 L.forEach(x=>{if(M.proc.some(p=>p.desc===x.desc))return;const cod=M.proc.some(p=>p.cod===x.cod)?nextCod():x.cod;
  const p={id:nid('p'),cod,desc:x.desc,norma:x.norma,tipo:x.tipo,int:x.int,avv:x.avv,min:x.min,mat:x.mat,est:x.est?1:0,steps:JSON.parse(JSON.stringify(x.steps)),doc:null};M.proc.push(p);if(!x.noTipo)t.procs.push(p.id);out.push(cod)});
 M.cp1=1;saveM();refresh();if(out.length)mt('Aggiunte '+out.join(', ')+' (carroponte)')}catch(er){}finally{MN._cp=0}}

// una tantum (v2.21.0): procedure Moretto (fascicolo MP) e macchine nella categoria «Impianto materia prima (Moretto)»
async function addMP(){if(M.mp1||MN._mp||!isR()||!M.proc.length)return;if(!M.cp1){setTimeout(addMP,900);return}MN._mp=1;try{
 const nk=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');const cat=(M.cat||[]).find(c=>nk(c.nome)===nk('Impianto materia prima (Moretto)'));
 if(!cat)return mt('Categoria «Impianto materia prima (Moretto)» non trovata: procedure Moretto non caricate');
 const L=(await (await fetch('manut_std.json?v=2.21.0',{cache:'no-store'})).json()).filter(x=>x.mp);if(M.mp1||!L.length)return;
 let np=0,ni=0;L.forEach(x=>{let t=M.tipi.find(y=>nk(y.nome)===nk(x.comp));if(!t){t={id:nid('t'),nome:x.comp,procs:[]};M.tipi.push(t)}
  let p=M.proc.find(y=>y.desc===x.desc);if(!p){const cod=M.proc.some(y=>y.cod===x.cod)?nextCod():x.cod;p={id:nid('p'),cod,desc:x.desc,norma:x.norma,tipo:x.tipo,int:x.int,avv:x.avv,min:x.min,mat:x.mat,est:0,steps:JSON.parse(JSON.stringify(x.steps)),doc:null};M.proc.push(p);np++}
  if(!t.procs.includes(p.id))t.procs.push(p.id);
  (x.matr||[]).forEach(m=>{if(M.imp.some(i=>i.cod===m))return;const c={id:nid('c'),tipo:t.id,sigla:x.comp};const i={id:nid('i'),cod:m,nome:x.comp,cli:'',desc:'Moretto',cat:cat.id,comps:[c]};M.imp.push(i);ni++;
   t.procs.filter(id=>M.proc.some(y=>y.id===id)).forEach(pid=>assign(i.id,pid,null,null,c.id))})});
 M.mp1=1;saveM();refresh();mt('Moretto: '+np+' procedure e '+ni+' macchine aggiunte in «'+cat.nome+'»')}catch(er){mt('Caricamento procedure Moretto non riuscito: '+(er.message||er))}finally{MN._mp=0}}
const EST=p=>p&&p.est?'<span style="color:#8a5300;font-weight:600">🏢 Fornitore esterno</span>':'';
// una tantum: tempo di avviso su tutte le procedure (mensili 7 gg, trimestrali 15, semestrali 30, annuali e oltre 60)
function setAvv(){if(M.avv1||!isR()||!M.proc.length)return;M.proc.forEach(p=>{if(p.avv==null||p.avv==='')p.avv=avvDef(p)});M.avv1=1;saveM()}
function migra(){if(!M.nofoto1){M.proc.forEach(p=>(p.steps||[]).forEach(x=>x.foto=false));M.nofoto1=true;if(isR())setTimeout(saveM,0)}M.imp.forEach(i=>{if(!i.avviato&&(M.vis.some(v=>v.imp===i.id)||M.att.some(a=>a.imp===i.id)||M.ass.some(s=>s.imp===i.id&&s.last)))i.avviato=true})}
const CAT=id=>M.cat.find(c=>c.id===id);
const catPath=id=>{const out=[];let c=CAT(id),n=0;while(c&&n++<20){out.unshift(c.nome);c=CAT(c.par)}return out.join(' › ')};
const catKids=id=>M.cat.filter(c=>(c.par||null)===(id||null));
const catDesc=id=>{const r=new Set([id]);let ch=true;while(ch){ch=false;M.cat.forEach(c=>{if(c.par&&r.has(c.par)&&!r.has(c.id)){r.add(c.id);ch=true}})}return r};
function catOpts(sel,none){const out=[];const walk=(par,d)=>catKids(par).sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(c=>{out.push(`<option value="${c.id}" ${c.id===sel?'selected':''}>${'— '.repeat(d)}${e_(c.nome)}</option>`);walk(c.id,d+1)});walk(null,0);return `<option value="">${none||'— nessuna —'}</option>`+out.join('')}
const qm=(...s)=>!MN.f.q||s.join(' ').toLowerCase().includes(MN.f.q.toLowerCase());
function attOk(a){const i=IA(a),p=PA(a);if(!p)return false;const f=MN.f;return(!f.imp||a.imp===f.imp)&&(!f.proc||a.proc===f.proc)&&(!f.man||(f.man==='-'?!a.man:a.man===f.man))&&(!f.stato||status(a)[2]===f.stato)&&qm(i.cod,i.nome,i.cli,CMP(a),p.cod,p.desc)}

// ---------- viste ----------
const LEAF=['manut','mcar','mpers','mimp','mric','msto','mlog','cimp','ccat','ctipi','cproc'];
const HEAD={mcar:['Carico persone','Ore di manutenzione e di supporto al plant per ogni manutentore, settimana per settimana, dai turni di Turni e ferie.'],manut:['Pianificazione','Panoramica dell\'anno e calendario. In ogni manutenzione entrano solo le procedure già scadute alla data scelta.'],mpers:['Attività assegnate','Manutenzioni da eseguire, per persona e per impianto.'],mimp:['Impianti','Ultima e prossima manutenzione di ogni impianto. Aprilo per storico, note e ricambi.'],mric:['Segnalazioni','Note e ricambi necessari degli impianti, raccolti in un unico punto. Il responsabile segna gli acquisti e archivia.'],mlog:['Registro attività','Tutto quello che è successo alle attività: pianificazioni, assegnazioni, spostamenti, completamenti, attività tornate da ripianificare.'],msto:['Storico interventi','Attività eseguite, con rapporto PDF ed esportazione Excel.'],cimp:['Impianti','Anagrafica impianti e componenti.'],ccat:['Categorie impianti','Classificazione a livelli (es. Plant › Reparto › Tipologia). Ogni impianto si assegna a una categoria.'],ctipi:['Tipi componente','Le procedure del tipo valgono per tutti i componenti di quel tipo.'],cproc:['Procedure','Modelli di manutenzione: frequenza, passi da confermare, documento.']};
window.vManut=function(){start();if(!LEAF.includes(S.tab)){const v=document.getElementById('view');if(v)v.innerHTML='';return}draw()};
function draw(){return(window.KS||(f=>f()))(draw0)}
function draw0(){const v=document.getElementById('view');if(!v||!LEAF.includes(S.tab))return;
 if(MN.err){v.innerHTML=`<div class="panel"><b>Area manutenzione non accessibile.</b><p class="muted">${e_(MN.err)}. Controlla le regole di Firestore.</p></div>`;return}
 if(!MN.ready){v.innerHTML=`<div class="panel muted">Caricamento manutenzione… ${e_(MN.stage||'')}</div>`;setTimeout(()=>{if(!MN.ready)draw()},1500);return}
 if(MN.tab!==S.tab){MN.tab=S.tab;MN.f={imp:'',stato:'',man:'',proc:'',q:'',da:'',a:'',cat:''};if(S.tab!=='mimp')MN.impSel=null}
 const R=isR(),npb=`<button class="btn" onclick="MNX.np()">+ Intervento non programmato</button>`,lib=(R?`<button class="btn" onclick="MNX.newLib()">+ Altra attività</button>`:'')+npb,act={mimp:npb,msto:npb,manut:R?`${lib}<button class="btn" onclick="MNX.auto()">⚙ Pianificazione automatica</button><button class="btn pri" onclick="MNX.plan()">+ Pianifica manutenzione</button>`:npb,mpers:lib+`<button class="btn" onclick="MNX.diag()">Diagnostica</button>`,ccat:`<button class="btn pri" onclick="MNX.catAdd()">+ Livello principale</button>`,mric:'',cimp:`<button class="btn" onclick="MNX.qi()">Inserimento rapido</button><button class="btn pri" onclick="MNX.newImp()">+ Nuovo impianto</button>`,ctipi:`<button class="btn pri" onclick="MNX.newTipo()">+ Nuovo tipo</button>`,cproc:`<button class="btn pri" onclick="MNX.editProc()">+ Nuova procedura</button>`}[S.tab]||'';
 const hd=S.tab==='mimp'&&MN.impSel?null:HEAD[S.tab];
 v.innerHTML=`<div class="mnt">${MN.noProc?'<div class="mn-info" style="border-left-color:var(--accent)">Procedure non trovate: i dati sono in sola lettura. Avvisa l\'assistenza.</div>':''}${hd?`<div class="mn-head"><div><h2>${hd[0]}</h2><div class="muted">${hd[1]}</div></div><div class="row">${act}</div></div>`:''}<div id="mnBody"></div></div>`;
 const body=document.getElementById('mnBody');
 const r=({manut:vPian,mcar:vCar,mpers:vPers,mimp:vImpM,mric:vRic,msto:vSto,mlog:vLog,cimp:vImp,ccat:vCat,ctipi:vTipi,cproc:vProc})[S.tab]();
 if(r&&r.then){body.innerHTML='<div class="muted">Caricamento…</div>';r.then(h=>{if(document.getElementById('mnBody')===body){body.innerHTML=h;after()}})}else{body.innerHTML=r;after()}}
function after(){if(MN.focus){const e=document.getElementById(MN.focus);if(e){e.focus();e.setSelectionRange?.(e.value.length,e.value.length)}MN.focus=null}}

// elementi
const item=(col,title,sub,right,click)=>`<div class="mn-it"${click?` role="button" tabindex="0" onclick="${click}" onkeydown="if(event.key==='Enter')${click}"`:''}><span class="mn-bar" style="background:${col}"></span><div class="mn-c"><div class="mn-t">${title}</div>${sub?`<div class="mn-s">${sub}</div>`:''}</div>${right?`<div class="mn-r" onclick="event.stopPropagation()">${right}</div>`:''}</div>`;
const detH=a=>{const st=a._steps&&a._steps.length?a._steps:(a.np?[]:(P(a.proc)||{}).steps||[]);const n=x=>String(x).replace('.',',');
 const r=[a.np?`<div><b>Causale:</b> ${e_(a.caus)} · <b>Ore:</b> ${n(a.ore)} h</div>`:'',a._free&&a._free.desc&&!a.np?`<div>${e_(a._free.desc)}</div>`:'',
 st.length?`<ol style="margin:4px 0 4px 18px;padding:0">${st.map((x,k)=>`<li>${a.ok&&a.ok[k]?'✓':'✗'} ${e_(x.t)}${a.foto&&(a.foto[k]||[]).length?` <span class="muted">(${a.foto[k].length} foto)</span>`:''}</li>`).join('')}</ol>`:'',
 a._mancanti&&a._mancanti.length?`<div style="color:var(--accent)"><b>Mancanti:</b> ${e_(a._mancanti.join(', '))}</div>`:'',
 a.note?`<div><b>${a.np?'Descrizione':'Note'}:</b> ${e_(a.note)}</div>`:'',
 a.ric&&a.ric.length?`<div><b>Ricambi:</b> ${a.ric.map(x=>e_((x.cod?x.cod+' · ':'')+x.desc+' ×'+n(x.q))).join('; ')}</div>`:'',
 a.oreImp!=null?`<div><b>Ore impianto:</b> ${n(a.oreImp)}${a.oreImpPrec!=null?' (prima '+n(a.oreImpPrec)+')':''}</div>`:'',
 a.oreEl!=null?`<div><b>Ore elemento:</b> ${n(a.oreEl)}</div>`:''].join('');
 return `<details style="flex-basis:100%;width:100%" onclick="event.stopPropagation()"><summary style="cursor:pointer">Dettaglio attività</summary><div style="font-size:13px;padding:4px 0">${r||'<span class="muted">Nessun dettaglio</span>'}</div></details>`};
const list=(arr,empty)=>`<div class="mn-list">${arr.join('')||`<div class="mn-empty muted">${empty}</div>`}</div>`;
const sel=(k,l,o)=>`<label class="mn-fs">${l}<select onchange="MNX.f('${k}',this.value)"><option value="">Tutti</option>${o.map(([v,t])=>`<option value="${e_(v)}" ${MN.f[k]===v?'selected':''}>${e_(t)}</option>`).join('')}</select></label>`;
const fImp=()=>sel('imp','Impianto',M.imp.map(i=>[i.id,i.cod+' '+i.nome]));
const fProc=()=>sel('proc','Procedura',M.proc.map(p=>[p.id,p.cod]));
const fMan=(l='Manutentore',none=true)=>sel('man',l,PERS().map(p=>[p,p]).concat(none?[['-','Da assegnare']]:[]));
const fStato=()=>sel('stato','Stato',[['r','In ritardo'],['g','Oggi'],['b','Pianificate']]);
const fQ=()=>`<label class="mn-fq">Cerca<input id="mnQ" type="search" value="${e_(MN.f.q)}" placeholder="Impianto, componente, procedura…" oninput="MNX.q(this.value)"></label>`;
const anyF=()=>Object.values(MN.f).some(Boolean);
const fBox=(h,n)=>`<div class="mn-fb">${fQ()}${h}${anyF()?`<button class="btn" onclick="MNX.reset()">Azzera</button>`:''}</div>${n!=null?`<div class="mn-cnt muted">${n}</div>`:''}`;
const dot=(t,c)=>`<span class="mn-st" style="color:${c}">${t}</span>`;

const MESI=['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
function yCounts(y,imp){const im=typeof imp==='function'?imp:(x=>!imp||x===imp);const pian=Array(12).fill(0),fatte=Array(12).fill(0);
 M.vis.filter(v=>v.data.startsWith(y)&&im(v.imp)).forEach(v=>pian[+v.data.slice(5,7)-1]++);
 const lo=new Set();M.att.filter(a=>!a.vis&&a.due&&a.due.startsWith(y)&&im(a.imp)).forEach(a=>{const k=a.due+a.imp;if(!lo.has(k)){lo.add(k);pian[+a.due.slice(5,7)-1]++}});
 const dn=new Set();(H[y]||[]).filter(a=>im(a.imp)).forEach(a=>{const k=a.vis||(a.imp+a.chiusa);if(!dn.has(k)){dn.add(k);fatte[+a.chiusa.slice(5,7)-1]++}});
 return{pian,fatte}}
function yearGrid(y,imp,fn,selM){const c=yCounts(y,imp),cur=tdy().slice(0,7);
 return `<div class="mn-yr">${MESI.map((m,k)=>{const ym=y+'-'+String(k+1).padStart(2,'0');return `<button class="mn-mo${ym===selM?' sel':''}${ym===cur?' cur':''}${ym<cur?' past':''}" onclick="MNX.${fn}('${ym}')"><b>${m}</b><span class="${c.pian[k]?'p':''}">${c.pian[k]} pianificate</span><span class="${c.fatte[k]?'f':''}">${c.fatte[k]} fatte</span></button>`}).join('')}</div>`}
function zOk(id){const z=MN.pz;if(!z)return true;const i=id&&I(id);if(z==='_none')return !!i&&!(i.cat&&M.cat.some(c=>c.id===i.cat));return !!i&&catDesc(z).has(i.cat)}
async function vPian(){await EPT.load();const y=MN.anno2||(MN.anno2=tdy().slice(0,4));const cy=tdy().slice(0,4);await storico(y);await storico(cy);
 const t=tdy(),all=M.imp.filter(i=>!i.dism&&zOk(i.id)).map(i=>({i,...impStatus(i.id)}));const ord={r:0,g:1,b:2,n:3,v:4};
 const pianR=all.filter(r=>r.toPlan&&!M.ass.some(s=>s.imp===r.i.id&&pend(s))).sort((a,b)=>ord[a.w[2]]-ord[b.w[2]]||((a.next||'9')<(b.next||'9')?-1:1));
 const ripA=M.att.filter(a=>!a.due&&zOk(a.imp));
 const late=M.att.filter(a=>a.due&&a.due<t&&zOk(a.imp));
 const plan=M.att.filter(a=>a.due&&a.due>=t&&zOk(a.imp));
 const mm=t.slice(0,7),done=(H[cy]||[]).filter(a=>a.chiusa.startsWith(mm)&&zOk(a.imp)).sort((a,b)=>a.chiusa<b.chiusa?1:-1);
 const win=+M.winDays||90,lim=addD(t,win),nextL=M.ass.filter(s=>{const p=P(s.proc);return p&&!p._miss&&p.tipo!=='evento'&&s.next&&s.next>=t&&s.next<=lim&&!planned(s)&&!pend(s)&&I(s.imp)&&!I(s.imp).dism&&zOk(s.imp)}).sort((a,b)=>a.next<b.next?-1:1);
 const docS=M.imp.filter(i=>!i.dism&&zOk(i.id)).flatMap(i=>(i.docs||[]).filter(d=>d.scad&&d.scad<=lim).map(d=>({i,d}))).sort((a,b)=>a.d.scad<b.d.scad?-1:1);
  const box=MN.box||'pian';
 const k=(key,l,n,col,sub)=>`<button class="mn-kpi" style="--c:${col}" onclick="MNX.box('${key}')" aria-pressed="${box===key}"><b>${n}</b><span>${l}</span>${sub?`<span style="font-size:11px">${sub}</span>`:''}</button>`;
 const ripImp=[...new Set(ripA.filter(a=>a.imp).map(a=>a.imp))];
 let lst='',tit='';
 if(box==='pian'){tit='Da pianificare';lst=list(pianR.map(r=>item(r.w[1],`${e_(r.i.cod)} · ${e_(r.i.nome)}`,`${dot(r.w[0],r.w[1])}${r.mai?'<span>mai pianificato</span>':`<span>${r.toPlan} procedure</span>`}${r.next&&!r.mai?`<span>dal ${fd(r.next)}</span>`:''}${r.inc?`<span style="color:var(--warn);font-weight:600">${r.inc} da concludere</span>`:''}`,isR()?`<button class="btn" onclick="event.stopPropagation();MNX.salta('${r.i.id}')">Elimina</button><button class="btn pri" onclick="MNX.plan('${r.i.id}')">Pianifica</button>`:'',`MNX.apriImp('${r.i.id}')`)),'Niente da pianificare 👍')}
 if(box==='rip'){tit='Da ripianificare';lst=list(ripA.map(a=>{const p=PA(a);return item('var(--accent)',`${e_(p.cod)} · ${e_(p.desc)}`,`${dot(a.sub?'Passi mancanti':'Non completata','var(--accent)')}${INOME(a)?`<span>${e_(INOME(a))}</span>`:''}<span class="mn-who${a.man?'':' none'}">👤 ${e_(a.man||'senza nome')}</span>`,isR()?`<button class="btn" onclick="event.stopPropagation();MNX.elimina('${a.id}')">Elimina</button>`+(a.ass?`<button class="btn pri" onclick="MNX.plan('${a.imp}')">Ripianifica</button>`:`<button class="btn pri" onclick="MNX.rip('${a.id}')">Ripianifica</button>`):'',`MNX.esegui('${a.id}')`)}),'Niente da ripianificare 👍')}
 if(box==='prox'){tit=`Prossime scadenze <label class="muted" style="font-size:13px;font-weight:400;margin-left:8px">nei prossimi ${isR()?`<input type="number" min="1" max="730" value="${win}" style="width:70px" onchange="MNX.win(this.value)">`:win} giorni</label>`;lst=(docS.length?`<h4 style="margin:4px 0 6px">Documenti in scadenza</h4>`+list(docS.map(({i,d})=>item(scadCol(d.scad)||'var(--ok)',`📄 ${e_(DTIP[d.tipo]||'Documento')} · ${e_(i.cod)}`,`${dot((d.scad<t?'Scaduto il ':'Scade il ')+fd(d.scad),scadCol(d.scad)||'var(--ok)')}<span>${e_(d.name)}</span>`,`<button class="btn" onclick="MNX.viewBlob('${d.id}')">Apri</button>`,`MNX.apriImp('${i.id}')`)),'')+`<h4 style="margin:12px 0 6px">Procedure</h4>`:'')+list(nextL.map(s=>{const p=P(s.proc),i=I(s.imp),gg=Math.round((new Date(s.next+'T12:00:00')-new Date(t+'T12:00:00'))/864e5),inA=gg<=avvOf(p);
  return item(inA?'var(--warn)':'var(--ok)',`${e_(p.cod)} · ${e_(p.desc)}`,`${dot((inA?'In scadenza':'Scade')+' il '+fd(s.next),inA?'var(--warn)':'var(--ok)')}<span>tra ${gg} giorni</span>${EST(p)}<span>${e_(i.cod)} · ${e_(i.nome)}</span>${CMP(s)?`<span>${e_(CMP(s))}</span>`:''}${p.min?`<span>⏱ ${p.min} min</span>`:''}`,(isR()?`<label class="muted" style="font-size:12px;display:grid;gap:2px" title="Vale per questa procedura su tutti gli impianti">🔔 Avviso (gg)<input type="number" min="0" value="${avvOf(p)}" style="width:70px" onchange="MNX.setAvv('${p.id}',this.value)"></label><button class="btn pri" onclick="MNX.plan('${i.id}')">Pianifica</button>`:`<span class="muted" style="font-size:12px">🔔 ${avvOf(p)} gg</span>`),`MNX.apriImp('${i.id}')`)}),'Nessuna scadenza nei prossimi 90 giorni.')}
 if(box==='late'){tit='In ritardo';lst=attList(late,isR())}
 if(box==='plan'){tit='Pianificate';lst=attList(plan,isR())}
 if(box==='done'){tit='Fatte questo mese';lst=list(done.map(a=>item(a.parziale?'var(--warn)':'var(--ok)',`${e_(a._pcod)} · ${e_(a._pdesc)}`,`<span><b>${fd(a.chiusa)}</b></span>${a._imp?`<span>${e_(a._imp)}</span>`:''}<span>👤 ${e_(a.esec)}</span>${a.parziale?'<span style="color:var(--warn);font-weight:600">chiusa in parte</span>':''}`,`<button class="btn sm" onclick="MNX.pdf('${cy}','${a.id}')">PDF</button>${isR()?`<button class="btn sm" onclick="MNX.riapri('${cy}','${a.id}')">Riapri</button><button class="btn sm" onclick="MNX.elFatta('${cy}','${a.id}')">Elimina</button>`:''}`)),'Nessuna attività completata questo mese.')}
 return anomH()+(M.cat.length?`<div class="row" style="margin-bottom:10px"><label class="mn-fs">Zona<select onchange="MNX.pz(this.value)"><option value="">Tutte</option><option value="_none" ${MN.pz==='_none'?'selected':''}>Senza zona</option>${catOpts(MN.pz||'').replace(/^<option value="">[^<]*<\/option>/,'')}</select></label></div>`:'')+`<div class="mn-kpis mn-k5 mn-k6">${k('pian','Da pianificare',pianR.length,'var(--accent)','impianti')}${k('rip','Da ripianificare',ripA.length,'#b4235a','tolte da te o con passi mancanti')}${k('late','In ritardo',late.length,'var(--warn)','data passata, non concluse')}${k('plan','Pianificate',plan.length,'var(--info)','da oggi in poi')}${k('prox','Prossime scadenze',nextL.length+docS.length,'#2f7d6d','nei prossimi '+win+' giorni')}${k('done','Fatte',done.length,'var(--ok)','questo mese')}</div>
 <div class="mn-calw" style="margin-bottom:14px">${cal()}</div>
 <div class="mn-calw" style="margin-bottom:14px"><div class="mn-calh"><button class="btn" onclick="MNX.anno2(-1)" aria-label="Anno precedente">‹</button><h3>Pianificate e fatte per mese · ${y}</h3><button class="btn" onclick="MNX.anno2(1)" aria-label="Anno successivo">›</button></div>${yearGrid(y,MN.pz?zOk:null,'meseSel',MN.mese)}</div>
 <div><h3 style="margin-bottom:8px">${tit}</h3>${lst}</div>`}
function cal(){const m=MN.mese||(MN.mese=tdy().slice(0,7));const [Y,Mo]=m.split('-').map(Number);
 const first=new Date(Y,Mo-1,1),start=new Date(first);start.setDate(1-((first.getDay()+6)%7));
 const ev={};M.vis.filter(v=>zOk(v.imp)).forEach(v=>(ev[v.data]=ev[v.data]||[]).push(v));
 const loose={};M.att.filter(a=>!a.vis&&a.due&&zOk(a.imp)).forEach(a=>{const k=a.due+'|'+(a.imp||a.id);loose[k]=loose[k]||{data:a.due,imp:a.imp,n:0,man:a.man,tit:a.free?a.free.titolo:null,aid:a.id};loose[k].n++});
 Object.values(loose).forEach(x=>(ev[x.data]=ev[x.data]||[]).push({loose:1,...x}));
 const chip=v=>{const i=I(v.imp)||{cod:v.tit||'Attività',nome:''};if(!v.loose&&!v.imp&&!v.tit){const a0=M.att.find(a=>a.vis===v.id);if(a0&&a0.free)i.cod=a0.free.titolo}const n=v.loose?v.n:M.att.filter(a=>a.vis===v.id).length;const late=v.data<tdy();
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
 if(pend(s))return{s,p,inc:true,why:pend(s).sub?'passi mancanti da completare':'non completata, da rifare'};
 if(dueOn(s,d))return{s,p,inc:true,why:(s.incompleto?'da concludere ('+s.incompleto.passi.length+' passi mancanti dal '+fd(s.incompleto.data)+') · ':'')+p.tipo==='evento'?'evento registrato':!s.next?'mai eseguita':'scaduta il '+fd(s.next)};
 return{s,p,inc:false,why:p.tipo==='evento'?'in attesa di evento':'non ancora: prossima dal '+fd(s.next)}})}
function drawPlan(){const P_=MN.pl;const i=P_.imp&&I(P_.imp);const pv=i?planPreview(i.id,P_.data).filter(x=>!planned(x.s)):[];
 if(P_.sel==null)P_.sel=pv.filter(x=>x.inc).map(x=>x.s.id);const sel=new Set(P_.sel);
 const comps=i?(i.comps||[]):[];const first=i&&!i.avviato;
 const row=x=>`<label class="mn-chk${x.inc?'':' mn-nd'}"><input type="checkbox" ${sel.has(x.s.id)?'checked':''} onchange="MNX.plSel(['${x.s.id}'],this.checked)"> <span><b>${e_(x.p.cod)}</b> ${e_(x.p.desc)} <span class="${x.inc?'mn-due':'muted'}">· ${x.why}</span></span></label>`;
 const cids=new Set(comps.map(c=>c.id)),orf=pv.filter(x=>!cids.has(x.s.comp));
 const blocks=[...comps,...(orf.length?[{id:'__orf',sigla:'Procedure dell\'impianto',tipo:null}]:[])].map(c=>{const l=c.id==='__orf'?orf:pv.filter(x=>x.s.comp===c.id);if(!l.length)return'';const all=l.every(x=>sel.has(x.s.id)),some=l.some(x=>sel.has(x.s.id));
  return `<div class="mn-step"><label class="mn-chk"><input type="checkbox" ${all?'checked':''} ${!all&&some?'data-mixed="1"':''} onchange="MNX.plSel(['${l.map(x=>x.s.id).join("','")}'],this.checked)"> <span><b>${e_(c.sigla)}</b> <span class="muted">· ${e_(T(c.tipo)?.nome||'')} · tutto il componente</span></span></label><div class="mn-checks" style="padding-left:32px">${l.map(row).join('')}</div></div>`}).join('');
 const n=sel.size;
 const yy=P_.data.slice(0,4);
 ovl(`<div class="mn-oh"><h2>Pianifica manutenzione</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div><div class="mn-calh"><button class="btn sm" onclick="MNX.plAnno(-1)" aria-label="Anno precedente">‹</button><h3>${yy}${i?' · '+e_(i.cod):' · tutti gli impianti'}</h3><button class="btn sm" onclick="MNX.plAnno(1)" aria-label="Anno successivo">›</button></div>${yearGrid(yy,P_.imp||null,'plMese',P_.data.slice(0,7))}<div class="muted" style="font-size:12px;margin-top:4px">Tocca un mese per spostare lì la data, poi scegli il giorno.</div></div>
 <div class="evf"><label>Impianto<select onchange="MNX.pl('imp',this.value)"><option value="">— scegli —</option>${M.imp.map(x=>`<option value="${x.id}" ${x.id===P_.imp?'selected':''}>${e_(x.cod)} · ${e_(x.nome)}</option>`).join('')}</select></label>
 <label>Data<input type="date" value="${P_.data}" onchange="MNX.pl('data',this.value)"></label>
 <label>Manutentore<select onchange="MNX.pl('man',this.value,1)"><option value="">Da assegnare</option>${PERS().map(p=>`<option ${P_.man===p?'selected':''}>${e_(p)}</option>`).join('')}</select></label></div>
 ${i?`${first?'<div class="mn-info">Prima manutenzione di questo impianto: dopo averla pianificata, le procedure non scelte verranno richieste in base alla loro frequenza a partire da questa data.</div>':''}
 <div class="muted" style="font-size:13px">Scegli un componente intero o le singole procedure. Sono già spuntate quelle scadute a questa data; puoi aggiungere anche le altre.</div>
 ${blocks||(M.ass.some(x=>x.imp===i.id&&P(x.proc)&&planned(x))?'<div class="muted">Le procedure di questo impianto sono già tutte pianificate: le trovi nel calendario.</div>':`<div class="mn-info" style="border-left-color:var(--warn)">Questo impianto non ha ancora procedure: aggiungi i componenti in Impostazioni → Impianti → Configura.${isR()?` <button class="btn sm" onclick="MNX.config('${i.id}')">Configura ora</button>`:''}</div>`)}`:'<div class="muted">Scegli l\'impianto.</div>'}
 <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" ${n?'':'disabled'} onclick="MNX.planOk()">Pianifica ${n?n+' attività':''}</button></div>`);
 document.querySelectorAll('#mnOvl [data-mixed]').forEach(x=>x.indeterminate=true)}
function visDett(id){const v=M.vis.find(x=>x.id===id);if(!v)return closeO();const i=I(v.imp)||{cod:v.tit||'Attività',nome:''},l=M.att.filter(a=>a.vis===id);
 ovl(`<div class="mn-oh"><h2>Manutenzione ${e_(i.cod)} · ${e_(i.nome)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 ${isR()?`<div class="evf"><label>Data<input type="date" value="${v.data}" onchange="MNX.visSet('${id}','data',this.value)"></label><label>Manutentore<select onchange="MNX.visSet('${id}','man',this.value)"><option value="">Da assegnare</option>${PERS().map(p=>`<option ${v.man===p?'selected':''}>${e_(p)}</option>`).join('')}</select></label></div>`:`<div class="muted">${fd(v.data)} · ${e_(v.man||'da assegnare')}</div>`}
 ${list(l.map(a=>{const p=P(a.proc);return item('var(--info)',`${e_(p.cod)} · ${e_(p.desc)}`,`<span>${e_(CMP(a))}</span><span class="mn-who${a.man?'':' none'}">👤 ${e_(a.man||'senza nome')}</span><span>${a.ok.filter(Boolean).length}/${a.ok.length} passi</span>`,`<button class="btn pri" onclick="MNX.esegui('${a.id}')">Apri</button>`)}),'Tutte le attività sono state chiuse.')}
 <div class="row" style="justify-content:space-between">${isR()?`<button class="btn" onclick="MNX.visDel('${id}')">Annulla manutenzione</button>`:'<span></span>'}<button class="btn" onclick="MNX.close()">Chiudi</button></div>`)}

function attList(l,man){return list(l.sort((a,b)=>(a.due||'0')<(b.due||'0')?-1:1).map(a=>{const i=IA(a),p=PA(a),st=status(a),nd=a.ok.filter(Boolean).length;
 return item(st[1],`${e_(p.cod)} · ${e_(p.desc)}`,`${dot(st[0]+(a.due?' · '+fd(a.due):''),st[1])}<span class="mn-who${a.man?'':' none'}">👤 ${e_(a.man||'senza nome')}</span>${EST(p)}${a.sub?'<span>solo passi mancanti</span>':''}${a.riaperta?'<span style="color:var(--warn);font-weight:600">riaperta</span>':''}${nd?`<span class="mn-prog">${nd}/${a.ok.length} passi fatti</span>`:''}${INOME(a)?`<span>${e_(INOME(a))}</span>`:''}${CMP(a)?`<span>${e_(CMP(a))}</span>`:''}${!man?'':''}`,`${man?manSel(a):''}${man&&isR()?`<button class="btn" onclick="event.stopPropagation();MNX.elimina('${a.id}')">Elimina</button>`:''}<button class="btn pri" onclick="MNX.esegui('${a.id}')">Apri</button>`,`MNX.esegui('${a.id}')`)}),'Nessuna attività.')}
const manSel=a=>`<select class="mn-man" aria-label="Manutentore" onchange="MNX.setMan('${a.id}',this.value)"><option value="">— Da assegnare —</option>${[...PERS(),...(a.man&&!PERS().includes(a.man)?[a.man]:[])].map(p=>`<option ${a.man===p?'selected':''}>${e_(p)}</option>`).join('')}</select>`;
function split(l,assign){const pr=l.filter(a=>!a.free),al=l.filter(a=>a.free);
 return (pr.length?`<h3 class="mn-sec">Attività preventive <span class="mn-n">${pr.length}</span></h3><div class="mn-list">${grouped(pr,assign)}</div>`:'')+(al.length?`<h3 class="mn-sec">Altre attività <span class="mn-n">${al.length}</span></h3>${attList(al,assign)}`:'')||'<div class="mn-empty muted">Nessuna attività.</div>'}
function grouped(l,assign){const g={};l.forEach(a=>(g[a.imp||'']=g[a.imp||'']||[]).push(a));
 const ids=Object.keys(g).sort((x,y)=>{const m=k=>g[k].map(a=>a.due).sort()[0];return m(x)<m(y)?-1:1});
 return ids.map(id=>{const i=I(id)||{cod:'—',nome:'',cli:''},arr=g[id],mans=[...new Set(arr.map(a=>a.man||''))];
  return `<div class="mn-grp"><div class="mn-gh"><div><h3>${e_(i.cod)} · ${e_(i.nome)}</h3><div class="muted" style="font-size:13px">${i.cli?e_(i.cli)+' · ':''}${arr.length} attività${mans.length===1&&mans[0]?' · tutte a '+e_(mans[0]):''}</div></div>
  ${assign&&id?`<label class="mn-fs" style="display:grid;gap:4px;font-size:12px;color:var(--muted)">Assegna tutto l'impianto a<select onchange="MNX.setManImp('${id}',this.value,'${arr.map(a=>a.id).join(',')}')"><option value="">— scegli —</option>${PERS().map(p=>`<option>${e_(p)}</option>`).join('')}<option value="-">Nessuno (togli)</option></select></label>`:''}</div>
  ${attList(arr,assign)}</div>`}).join('')||'<div class="mn-empty muted">Nessuna attività.</div>'}
function vAtt(){const l=M.att.filter(attOk);return fBox(fStato()+fMan()+fImp(),l.length+' attività in '+new Set(l.map(a=>a.imp)).size+' impianti · assegna la singola attività o tutto l\'impianto')+`<div class="mn-list">${grouped(l,true)}</div>`}
function vMie(){const l=M.att.filter(a=>mine(a)&&attOk(a));return fBox(fStato(),l.length+' attività assegnate a te')+`<div class="mn-list">${grouped(l,false)}</div>`}

const tipiOf=i=>[...new Set((i.comps||[]).map(c=>(T(c.tipo)||{}).nome||c.sigla))].sort().join(', ');
const sortI=l=>{const k=MN.sortI||'cod',c=(a,b)=>String(a||'~').localeCompare(String(b||'~'),'it',{numeric:true});return l.slice().sort((a,b)=>k==='nome'?c(a.nome,b.nome)||c(a.cod,b.cod):k==='zona'?c(catPath(a.cat),catPath(b.cat))||c(a.cod,b.cod):k==='tipo'?c(tipiOf(a),tipiOf(b))||c(a.cod,b.cod):c(a.cod,b.cod))};
const fSortI=()=>`<label class="mn-fs">Ordina per<select onchange="MNX.sortI(this.value)">${[['cod','Nome'],['nome','Commessa'],['zona','Zona'],['tipo','Tipo componente']].map(([v,t])=>`<option value="${v}" ${(MN.sortI||'cod')===v?'selected':''}>${t}</option>`).join('')}</select></label>`;
function vImp(){const ds=MN.f.cat?catDesc(MN.f.cat):null;const l=sortI(M.imp.filter(i=>(MN.showD||!i.dism)&&(!ds||ds.has(i.cat))&&qm(i.cod,i.nome,i.cli,i.desc,catPath(i.cat),(i.comps||[]).map(c=>c.sigla).join(' '))));
 return fBox((M.cat.length?`<label class="mn-fs">Zona<select onchange="MNX.f('cat',this.value)">${catOpts(MN.f.cat,'Tutte')}</select></label>`:'')+fSortI()+`<label class="mn-chk" style="font-size:13px"><input type="checkbox" ${MN.showD?'checked':''} onchange="MNX.showD(this.checked)"> Mostra dismessi</label>`,`${l.length} impianti`)+list(l.map(i=>item(i.dism?'var(--off)':'var(--info)',`${e_(i.cod)} · ${e_(i.nome)}`,`${i.dism?`<span style="font-weight:600">dismesso il ${fd(i.dism)}</span>`:''}${i.desc?`<span>${e_(i.desc)}</span>`:''}${i.cat?`<span>${e_(catPath(i.cat))}</span>`:''}<span>${e_(i.cli||'—')}</span><span>${(i.comps||[]).map(c=>e_(c.sigla)).join(', ')||'nessun componente'}</span>${MN.sortI==='tipo'?`<span>tipi: ${e_(tipiOf(i)||'—')}</span>`:''}<span>${M.ass.filter(a=>a.imp===i.id).length} procedure</span>`,`<button class="btn pri" onclick="MNX.config('${i.id}')">Configura</button>`,`MNX.config('${i.id}')`)),'Nessun impianto: crea il primo con «+ Nuovo impianto».')}

function vTipi(){return list(M.tipi.map(t=>item('var(--hi)',e_(t.nome),`<span>${t.procs.map(id=>P(id)?.cod).filter(Boolean).join(', ')||'nessuna procedura standard'}</span><span>usato in ${M.imp.reduce((n,i)=>n+(i.comps||[]).filter(c=>c.tipo===t.id).length,0)} componenti</span>`,`<button class="btn" onclick="MNX.editTipo('${t.id}')">Modifica</button>`,`MNX.editTipo('${t.id}')`)),'Nessun tipo di componente.')}

const procItem=p=>item('var(--ink)',`${e_(p.cod)} · ${e_(p.desc)}`,`${EST(p)}<span>${freq(p)}</span><span>${p.steps.length} passi</span>${p.min?`<span>⏱ ${p.min} min</span>`:''}${p.tipo!=='evento'?`<span>🔔 avviso ${avvOf(p)} gg prima</span>`:''}${p.doc?`<span>📄 ${e_(p.doc.name||'documento')}</span>`:''}<span>usata ${M.ass.filter(a=>a.proc===p.id).length} volte</span>`,`<button class="btn" onclick="MNX.editProc('${p.id}')">Modifica</button>`,`MNX.editProc('${p.id}')`);
const byCod=(a,b)=>String(a.cod).localeCompare(String(b.cod),'it',{numeric:true});
// procedure raggruppate per tipo componente; si apre toccando il gruppo
function vProc(){const q=(MN.f.q||'').toLowerCase(),hit=p=>!q||(p.cod+' '+p.desc).toLowerCase().includes(q);const op=MN.procOpen||(MN.procOpen={});
 const G=M.tipi.map(t=>({id:t.id,nome:t.nome,l:t.procs.map(id=>M.proc.find(p=>p.id===id)).filter(Boolean).sort(byCod)}));
 const inT=new Set(M.tipi.flatMap(t=>t.procs));G.push({id:'_altre',nome:'Altre procedure (non legate a un tipo)',l:M.proc.filter(p=>!inT.has(p.id)).sort(byCod)});
 const gs=G.filter(g=>g.l.length||g.id!=='_altre').map(g=>({...g,f:g.l.filter(hit)})).filter(g=>!q||g.f.length);
 const dl=docList(),od=op._doc!==false;
 const docs=dl.length?`<div class="mn-grp" style="padding:0;gap:0;margin-bottom:12px;border-color:var(--info)"><button class="mn-cfgc" aria-expanded="${od}" onclick="MNX.procOpen('_doc')"><span>${od?'▾':'▸'}</span><b style="flex:1;text-align:left">📄 Documenti comuni</b><span class="muted" style="font-size:12px">${dl.length} documenti</span></button>
  ${od?list(dl.map(d=>{const n=M.proc.filter(p=>p.doc&&p.doc.id===d.id).length;return item('var(--info)',e_(d.name),`<span>usato in ${n} procedure</span>${d.size?`<span>${Math.round(d.size/1024)} KB</span>`:''}`,`<button class="btn" onclick="MNX.viewDocId('${d.id}')">Apri</button><label class="btn pri" style="cursor:pointer">Carica nuova versione<input type="file" accept="application/pdf,image/*" hidden onchange="MNX.docRepl('${d.id}',this)"></label>`,`MNX.viewDocId('${d.id}')`)}),''):''}</div>`:'';
 return fBox('',`${M.proc.length} procedure in ${gs.length} gruppi`)+docs+`
 <div class="mn-list">${gs.map(g=>{const o=q||op[g.id];const mins=g.l.reduce((n,p)=>n+(p.min||0),0);
  return `<div class="mn-grp" style="padding:0;gap:0"><button class="mn-cfgc" aria-expanded="${!!o}" onclick="MNX.procOpen('${g.id}')"><span>${o?'▾':'▸'}</span><b style="flex:1;text-align:left">${e_(g.nome)}</b><span class="muted" style="font-size:12px">${g.l.length} procedure${mins?' · '+mins+' min':''}</span></button>
  ${o?`<div style="padding:0 0 8px">${list(g.f.map(procItem),'Nessuna procedura in questo gruppo.')}${g.id!=='_altre'?`<div class="row" style="padding:8px 12px 0"><button class="btn sm" onclick="MNX.editProc(null,'${g.id}')">+ Procedura per ${e_(g.nome)}</button></div>`:''}</div>`:''}</div>`}).join('')||'<div class="mn-empty muted">Nessuna procedura.</div>'}</div>`}

async function vSto(){
 const y=MN.anno,list_=(await storico(y)).filter(a=>{const f=MN.f;
  return (isR()||sameP(a.esec,me())||sameP(a.man,me()))&&(!f.imp||a.imp===f.imp)&&(!f.proc||a.proc===f.proc)&&(!f.man||a.esec===f.man)&&(!f.da||a.chiusa>=f.da)&&(!f.a||a.chiusa<=f.a)&&qm(a._imp,a._cmp,a._pcod,a._pdesc,a.note)}).sort((a,b)=>a.chiusa<b.chiusa?1:-1);
 MN._sto=list_;
 const anni=[...new Set([...(M.anni||[]),String(new Date().getFullYear())])].sort().reverse();
 return fBox(`<label class="mn-fs">Anno<select onchange="MNX.anno(this.value)">${anni.map(a=>`<option ${a===y?'selected':''}>${a}</option>`).join('')}</select></label>`+fImp()+(isR()?fMan('Eseguita da',false):'')+`<label class="mn-fs">Dal<input type="date" value="${MN.f.da}" onchange="MNX.f('da',this.value)"></label><label class="mn-fs">Al<input type="date" value="${MN.f.a}" onchange="MNX.f('a',this.value)"></label>`,
  `${list_.length} interventi nel ${y} · <button class="btn sm" onclick="MNX.xls()">Esporta Excel</button>`)+
 list(list_.map(a=>{const ok=a.ok.filter(Boolean).length;return item('var(--ok)',`${e_(a._pcod)} · ${e_(a._pdesc)}`,`<span><b>${fd(a.chiusa)}</b></span><span>${e_(a._imp)}${a._cmp?' › '+e_(a._cmp):''}</span><span>${e_(a.esec)}</span>${a.np?`<span>${String(a.ore).replace('.',',')} h</span>${a.ric&&a.ric.length?`<span>ricambi: ${e_(a.ric.map(r=>(r.cod?r.cod+' ':'')+r.desc+' ×'+r.q).join(', '))}</span>`:''}`:`<span>${ok}/${a.ok.length} passi</span>`}${a.parziale?'<span style="color:var(--accent);font-weight:600">chiusa in parte</span>':''}${a.foto.flat().length?`<span>${a.foto.flat().length} foto</span>`:''}${detH(a)}`,`<button class="btn" onclick="MNX.pdf('${y}','${a.id}')">PDF</button>${isR()?`<button class="btn" onclick="MNX.riapri('${y}','${a.id}')">Riapri</button><button class="btn" onclick="MNX.elFatta('${y}','${a.id}')">Elimina</button>`:''}`)}),'Nessun intervento con questi filtri.')}

// --- Attività assegnate (manutenzione)
function vPers(){const R=isR()||(typeof isAdm_==='function'&&isAdm_())||(typeof isResp==='function'&&isResp());
 const PL=R?[...new Set([...PERS().filter(p=>typeof repSez==='function'&&repSez(pEnte(p)).includes('mpers')),...M.att.map(a=>a.man).filter(Boolean)])]:[me()];
 if(R)PL.push('');
 if(!PL.includes(MN.pSel))MN.pSel=R?PL[0]:me();
 const l=M.att.filter(a=>a.due&&(R?(a.man||'')===(MN.pSel||''):mine(a)));
 const nm=p=>p||'Da assegnare';
 const side=R?`<aside class="panel pside"><h3 style="margin-bottom:8px">Persone</h3><div class="list">${PL.map(p=>`<button class="pbtn ${p===MN.pSel?'sel':''}" onclick="MNX.pSel('${e_(p)}')"><span class="av">${p?e_(p.split(' ').map(x=>x[0]).join('').slice(0,2)):'?'}</span><span style="min-width:0"><span class="cn">${e_(nm(p))}</span><span class="muted" style="font-size:12px;display:block">${M.att.filter(a=>a.due&&(a.man||'')===p).length} attività</span></span></button>`).join('')}</div></aside>`:'';
 const sel=R?`<div class="pchips" role="group" aria-label="Persona">${PL.map(p=>`<button aria-pressed="${p===MN.pSel}" onclick="MNX.pSel('${e_(p)}')">${e_(nm(p))} <span class="mn-n">${M.att.filter(a=>a.due&&(a.man||'')===p).length}</span></button>`).join('')}</div>`:'';
 const F=(M.fatte||[]).filter(x=>R?(x.man||'')===(MN.pSel||''):sameP(x.man,me())||sameP(x.esec,me())).sort((a,b)=>a.chiusa<b.chiusa?1:-1);
 const fh=F.length?`<div class="mn-oh mn-sec"><h3>Completate <span class="mn-n">${F.length}</span></h3>${R?`<button class="btn sm" onclick="MNX.togliFatte('${e_(MN.pSel||'')}')">Togli tutte</button>`:''}</div>${list(F.map(x=>item(x.parziale?'var(--warn)':'var(--ok)',`${e_(x.cod)} · ${e_(x.desc)}`,`${dot((x.parziale?'Chiusa in parte':'✓ Completata')+' il '+fd(x.chiusa),x.parziale?'var(--warn)':'var(--ok)')}${x.imp&&I(x.imp)?`<span>${e_(I(x.imp).cod)}${x.cmp?' › '+e_(x.cmp):''}</span>`:''}${x.esec&&x.esec!==x.man?`<span>da ${e_(x.esec)}</span>`:''}`,`<button class="btn sm" onclick="MNX.pdf('${x.y}','${x.id}')">PDF</button>${R?`<button class="btn sm" onclick="MNX.riapri('${x.y}','${x.id}')">Riapri</button><button class="btn sm" onclick="MNX.togliFatta('${x.id}')">Togli</button>`:''}`)),'')}`:'';
 return `<div class="${R?'grid2':''}">${side}<section>${sel}<h3 style="margin-bottom:10px">${e_(nm(MN.pSel))} <span class="mn-n">${l.length}</span></h3>${l.length?split(l,R):(F.length?'':split(l,R))}${fh}</section></div>`}

// --- Impianti (matrice e scheda)
const lastOf=id=>M.ass.filter(s=>s.imp===id&&s.last).map(s=>s.last).sort().pop()||null;
const nextVis=id=>{const d=[...M.vis.filter(v=>v.imp===id).map(v=>v.data),...M.att.filter(a=>a.imp===id&&!a.vis&&a.due).map(a=>a.due)].sort();return d[0]||null};
function vImpM(){if(MN.impSel&&I(MN.impSel))return impPage(MN.impSel);
 const ds=MN.f.cat?catDesc(MN.f.cat):null;const l=M.imp.filter(i=>(MN.showD||!i.dism)&&(!ds||ds.has(i.cat))&&qm(i.cod,i.nome,i.cli,i.desc,catPath(i.cat),(i.comps||[]).map(c=>c.sigla).join(' ')));const gz=!MN.sortI||MN.sortI==='cod'||MN.sortI==='zona';const l2=gz?l.sort((a,b)=>(catPath(a.cat)||'~').localeCompare(catPath(b.cat)||'~')||a.cod.localeCompare(b.cod,'it',{numeric:true})):sortI(l);
 let lastP=null;
 return fBox((M.cat.length?`<label class="mn-fs">Categoria<select onchange="MNX.f('cat',this.value)">${catOpts(MN.f.cat,'Tutte')}</select></label>`:'')+fSortI()+`<label class="mn-chk" style="font-size:13px"><input type="checkbox" ${MN.showD?'checked':''} onchange="MNX.showD(this.checked)"> Mostra dismessi</label>`,null)+`<div class="mn-imps">${l2.map(i=>{const cp=catPath(i.cat)||'Senza categoria';const h=gz&&cp!==lastP&&M.cat.length?`<h3 class="mn-cath">${e_(cp)}</h3>`:'';lastP=cp;return h+(()=>{const st=impStatus(i.id),lt=lastOf(i.id),nx=nextVis(i.id),rc=M.ric.filter(r=>r.imp===i.id&&r.buy&&r.stato!=='ok').length;
  if(i.dism)return `<button class="mn-ib" style="--c:var(--off);opacity:.7" onclick="MNX.apriImp('${i.id}')"><span class="mn-ibh"><b>${e_(i.cod)}</b>${dot('Dismesso il '+fd(i.dism),'var(--off)')}</span><span class="muted">${e_(i.nome)}${i.cli?' · '+e_(i.cli):''}</span><span class="mn-ibr"><span>Ultima</span><b>${lt?fd(lt):'—'}</b></span></button>`;
  return `<button class="mn-ib" style="--c:${st.w[1]}" onclick="MNX.apriImp('${i.id}')"><span class="mn-ibh"><b>${e_(i.cod)}</b>${dot(st.w[0],st.w[1])}</span><span class="muted">${e_(i.nome)}${i.cli?' · '+e_(i.cli):''}</span>
  <span class="mn-ibr"><span>Ultima</span><b>${lt?fd(lt):'—'}</b></span><span class="mn-ibr"><span>Prossima</span><b>${nx?fd(nx):st.toPlan?'<span style="color:var(--accent)">da pianificare</span>':(st.next?'dal '+fd(st.next):'—')}</b></span>${st.inc?`<span class="mn-ibr"><span>Da concludere</span><b style="color:var(--warn)">${st.inc}</b></span>`:''}${rc?`<span class="mn-ibr"><span>Ricambi da acquistare</span><b style="color:var(--warn)">${rc}</b></span>`:''}</button>`})()}).join('')||'<div class="mn-empty muted">Nessun impianto. Si aggiungono da Impostazioni → Impianti.</div>'}</div>`}
async function impPage(id){const i=I(id),R=isR();const ys=[...new Set([...(M.anni||[]),tdy().slice(0,4)])];await Promise.all(ys.map(storico));
 const done=ys.flatMap(y=>(H[y]||[]).filter(a=>a.imp===id).map(a=>({...a,_y:y}))).sort((a,b)=>a.chiusa<b.chiusa?1:-1);
 const ass=i.dism?[]:M.ass.filter(a=>a.imp===id),st=impStatus(id);
 const note=[...M.att.filter(a=>a.imp===id&&a.note).map(a=>({d:a.due,chi:a.man,t:a.note,p:PA(a)?.cod,c:CMP(a),aperta:1})),...done.filter(a=>a.note).map(a=>({d:a.chiusa,chi:a.esec,t:a.note,p:a._pcod,c:a._cmp}))].sort((a,b)=>a.d<b.d?1:-1);
 const ric=M.ric.filter(r=>r.imp===id&&isSeg(r)&&!r.arch).sort((a,b)=>a.data<b.data?1:-1);
 return `<div class="mn-oh" style="margin-bottom:14px"><div><button class="btn sm" onclick="MNX.impBack()">‹ Tutti gli impianti</button><h2 style="margin-top:8px">${e_(i.cod)} · ${e_(i.nome)}</h2><div class="muted">${i.desc?e_(i.desc)+'<br>':''}${i.cat?e_(catPath(i.cat))+' · ':''}${e_(i.cli||'')} · ${(i.comps||[]).map(c=>e_(c.sigla)+(c.ore!=null?' ('+c.ore+' h)':'')).join(', ')||'nessun componente'}${i.oreImp!=null?' · ore impianto <b>'+i.oreImp+'</b>'+(i.oreImpD?' al '+fd(i.oreImpD):''):''}</div></div>
 <div class="row">${i.dism?(R?`<button class="btn pri" onclick="MNX.ripristina('${id}')">Ripristina impianto</button>`:''):`<button class="btn" onclick="MNX.np('${id}')">+ Intervento non programmato</button>${R?`<button class="btn" onclick="MNX.config('${id}')">Configura</button><button class="btn pri" onclick="MNX.plan('${id}')">Pianifica manutenzione</button>`:''}`}</div></div>${i.dism?`<div class="mn-info" style="margin-bottom:14px"><b>Impianto dismesso il ${fd(i.dism)}</b><div style="font-size:13px">Nessuna manutenzione viene più proposta. Restano visibili le manutenzioni fatte.</div></div>`:''}
 <div class="mn-kpis"><div class="mn-kpi" style="--c:var(--ok)"><b style="font-size:20px">${lastOf(id)?fd(lastOf(id)):'—'}</b><span>Ultima manutenzione</span></div><div class="mn-kpi" style="--c:var(--info)"><b style="font-size:20px">${nextVis(id)?fd(nextVis(id)):'—'}</b><span>Prossima pianificata</span></div><div class="mn-kpi" style="--c:${st.w[1]}"><b style="font-size:20px">${st.toPlan}</b><span>Procedure da pianificare</span></div><div class="mn-kpi" style="--c:var(--warn)"><b style="font-size:20px">${ric.filter(r=>r.buy&&r.stato!=='ok').length}</b><span>Ricambi da acquistare</span></div></div>
 <div class="mn-det">
 <section class="panel"><h3>Da fare</h3>${list(ass.map(s=>{const p=P(s.proc),x=assStatus(s),a=planned(s);return item(x[1],`${e_(p.cod)} · ${e_(p.desc)}`,`${dot(x[0],x[1])}<span>${e_(CMP(s))}</span>${s.last?`<span>ultima ${fd(s.last)}</span>`:''}${s.incompleto?`<span style="color:var(--warn)">mancano: ${e_(s.incompleto.passi.join(', '))}</span>`:''}`,a?`<span class="muted" style="font-size:12px">pianificata il ${fd(a.due)}</span><button class="btn" onclick="MNX.esegui('${a.id}')">Apri</button>`:p.tipo!=='evento'&&R?`<label class="muted" style="font-size:11px;display:grid" onclick="event.stopPropagation()">Ultima esecuzione<input type="date" value="${s.last||''}" onchange="MNX.setLast('${s.id}',this.value)"></label>${s.next?`<button class="btn pri" onclick="event.stopPropagation();MNX.planNext('${s.id}')">Pianifica ${fd(s.next)}</button>`:''}`:p.tipo==='evento'&&R&&!s.evt?`<button class="btn" onclick="MNX.evento('${s.id}')">Registra evento</button>`:'')}),'Nessuna procedura assegnata.')}</section>
 <section class="panel"><h3>Fatte</h3>${list(done.slice(0,30).map(a=>item('var(--ok)',`${e_(a._pcod)} · ${e_(a._pdesc)}`,`<span><b>${fd(a.chiusa)}</b></span><span>${e_(a._cmp)}</span><span>${e_(a.esec)}</span>${a.np?`<span>${String(a.ore).replace('.',',')} h</span>${a.ric&&a.ric.length?`<span>${a.ric.length} ricambi</span>`:''}`:`<span>${a.ok.filter(Boolean).length}/${a.ok.length} passi</span>`}${detH(a)}`,`<button class="btn sm" onclick="MNX.pdf('${a._y}','${a.id}')">PDF</button>${R?`<button class="btn sm" onclick="MNX.riapri('${a._y}','${a.id}')">Riapri</button>`:''}`)),'Nessuna manutenzione eseguita.')}</section>
 <section class="panel"><h3>Note delle manutenzioni</h3>${note.length?`<div class="mn-notes">${note.map(n=>`<div class="mn-nt"><div class="muted" style="font-size:12px">${fd(n.d)} · ${e_(n.chi||'')} · ${e_(n.p||'')}${n.c?' · '+e_(n.c):''}${n.aperta?' · in corso':''}</div><div>${e_(n.t)}</div></div>`).join('')}</div>`:'<div class="mn-empty muted">Nessuna nota.</div>'}</section>
 <section class="panel"><div class="mn-oh"><h3>Segnalazioni</h3>${i.dism?'':`<button class="btn sm" onclick="MNX.segNew('${id}')">+ Segnalazione</button>`}</div>${ricList(ric,false)}</section>
 <section class="panel"><div class="mn-oh"><h3>Documenti</h3>${R?`<button class="btn sm" onclick="MNX.idocNew('${id}')">+ Carica documento</button>`:''}</div>${idocList(i,R)}</section>
 </div>${R&&!i.dism?`<div class="row" style="justify-content:flex-end;margin-top:28px;padding-top:14px;border-top:1px solid var(--line)"><button class="btn" style="background:#c62828;border-color:#c62828;color:#fff" onclick="MNX.dismetti('${id}')">Dismetti impianto</button></div>`:''}`}

// --- Registro
const LCOL={Tolta:'var(--accent)',Ripristinata:'var(--info)',Pianificata:'var(--info)',Ripianificata:'var(--info)',Assegnata:'var(--ink)',Spostata:'var(--hi)',Completata:'var(--ok)','Chiusa in parte':'var(--warn)','Non completata':'var(--accent)',Annullata:'var(--off)',Riaperta:'var(--warn)',Creata:'var(--info)',Eliminata:'#b4235a',Saltata:'var(--off)','Non programmato':'var(--hi)'};
function logItem(l){return item(LCOL[l.az]||'var(--off)',`${e_(l.az)} · ${e_(l.cod)}`,`<span><b>${e_(l.t.split(' ')[0].split('-').reverse().join('/'))} ${e_(l.t.split(' ')[1]||'')}</b></span>${l.imp&&I(l.imp)?`<span>${e_(I(l.imp).cod)}</span>`:''}<span>${e_(l.txt)}</span><span class="muted">da ${e_(l.chi)}</span>`,M.att.some(a=>a.id===l.att)?`<button class="btn sm" onclick="MNX.esegui('${l.att}')">Apri</button>`:'')}
function vLog(){const f=MN.f,L=(M.log||[]).filter(l=>(!f.man||l.man===f.man||l.txt.includes(f.man))&&(!f.imp||l.imp===f.imp)&&(!f.stato||l.az===f.stato)&&qm(l.cod,l.txt,l.chi,l.man)).slice().reverse();
 return fBox(sel('stato','Evento',Object.keys(LCOL).map(k=>[k,k]))+fMan('Persona',false)+fImp(),L.length+' eventi')+list(L.slice(0,300).map(logItem),'Nessun evento registrato. Il registro parte da questa versione.')}

// --- Categorie
function vCat(){const used=id=>M.imp.filter(i=>i.cat===id).length;
 const node=(c,d)=>{const k=catKids(c.id).sort((a,b)=>a.nome.localeCompare(b.nome));return `<div class="mn-cat" style="--d:${d}"><div class="mn-catr"><input value="${e_(c.nome)}" aria-label="Nome categoria" onchange="MNX.catRen('${c.id}',this.value)"><span class="muted" style="font-size:12px">${used(c.id)} impianti</span><button class="btn sm" onclick="MNX.catAdd('${c.id}')">+ Sotto-livello</button>${!k.length&&!used(c.id)?`<button class="btn sm" onclick="MNX.catDel('${c.id}')" aria-label="Elimina">✕</button>`:''}</div>${k.map(x=>node(x,d+1)).join('')}</div>`};
 const roots=catKids(null).sort((a,b)=>a.nome.localeCompare(b.nome));
 return roots.length?`<div class="panel">${roots.map(c=>node(c,0)).join('')}</div>`:'<div class="mn-empty muted">Nessuna categoria. Crea il primo livello (es. il Plant) con «+ Livello principale».</div>'}

// --- Segnalazioni (note e ricambi necessari)
const isSeg=r=>r.tipo==='nota'||r.buy;
function ricItem(r,showImp){const i=I(r.imp),ok=r.stato==='ok',R=isR(),nota=r.tipo==='nota',ar=!!r.arch;
 const col=ar?'var(--off)':nota?'var(--info)':!r.buy?'var(--off)':ok?'var(--ok)':'var(--warn)';
 const stt=ar?'Archiviata il '+fd(r.arch)+(r.archDa?' da '+r.archDa:''):nota?'Nota':!r.buy?'Utilizzato':ok?'Acquistato'+(r.acqData?' il '+fd(r.acqData):'')+(r.acqDa?' da '+r.acqDa:''):'Da acquistare';
 const src=r.att?(M.att.find(a=>a.id===r.att)?`<button class="btn sm" onclick="MNX.esegui('${r.att}')">Apri attività</button>`:`<span>da attività ${e_(r.pcod||(P(r.proc)||{}).cod||'')}</span>`):'';
 return item(col,`${nota?'📝 ':'🔧 '}${e_(r.desc)}${r.qta&&!nota?` <span class="muted">× ${e_(r.qta)}</span>`:''}`,`${dot(stt,col)}${showImp&&i?`<span>${e_(i.cod)}${r.comp?' › '+e_((i.comps||[]).find(c=>c.id===r.comp)?.sigla||''):''}</span>`:''}<span>${nota?'scritta':'chiesto'} da ${e_(r.da||'—')} il ${fd(r.data)}</span>`,
 `${src}${R&&!ar&&!nota&&r.buy?(ok?`<button class="btn sm" onclick="MNX.ricStato('${r.id}','da')">Riporta da acquistare</button>`:`<button class="btn pri sm" onclick="MNX.ricStato('${r.id}','ok')">Segna acquistato</button>`):''}${R&&isSeg(r)?(ar?`<button class="btn sm" onclick="MNX.segArch('${r.id}',0)">Ripristina</button>`:`<button class="btn sm" onclick="MNX.segArch('${r.id}',1)">Archivia</button>`):''}${!ar&&isSeg(r)&&(R||r.da===me())?`<button class="btn sm" onclick="MNX.segEd('${r.id}')">Modifica</button>`:''}${!ar&&(R||r.da===me())?`<button class="btn sm" onclick="MNX.ricDel('${r.id}')" aria-label="Elimina">✕</button>`:''}`)}
function ricList(l,showImp){return list(l.map(r=>ricItem(r,showImp)),'Nessuna segnalazione.')}
function vRic(){const f=MN.f,st=f.stato||'aperte',ds=f.cat?catDesc(f.cat):null;
 const base=M.ric.filter(r=>isSeg(r)&&(!ds||ds.has(I(r.imp)?.cat))&&(!f.imp||r.imp===f.imp)&&qm(r.desc,I(r.imp)?.cod,I(r.imp)?.nome,r.da));
 const flt={aperte:r=>!r.arch,note:r=>!r.arch&&r.tipo==='nota',da:r=>!r.arch&&r.tipo!=='nota'&&r.stato!=='ok',ok:r=>!r.arch&&r.tipo!=='nota'&&r.stato==='ok',arch:r=>!!r.arch};
 const l=base.filter(flt[st]||flt.aperte).sort((a,b)=>a.data<b.data?1:-1);
 const tab=(k,lb)=>`<button aria-current="${st===k?'page':'false'}" onclick="MNX.f('stato','${k}')">${lb} <span class="mn-n">${base.filter(flt[k]).length}</span></button>`;
 return `<div class="mn-oh" style="margin-bottom:10px"><div class="mn-seg">${tab('aperte','Aperte')}${tab('note','Note')}${tab('da','Ricambi da acquistare')}${tab('ok','Ricambi acquistati')}${tab('arch','Archiviate')}</div><button class="btn pri" onclick="MNX.segNew()">+ Nuova segnalazione</button></div>`+fBox((M.cat.length?`<label class="mn-fs">Zona<select onchange="MNX.f('cat',this.value)">${catOpts(f.cat,'Tutte')}</select></label>`:'')+fImp(),`${l.length} voci`)+ricList(l,true)}

// ---------- finestre ----------
function ovl(h){let o=document.getElementById('mnOvl');if(!o){o=document.createElement('div');o.id='mnOvl';o.className='mn-ovl';o.onpointerdown=e=>{o._d=e.target===o};o.onclick=e=>{const d=o._d;o._d=false;if(e.target===o&&d&&!o.querySelector('.mn-qi'))closeO()};document.body.appendChild(o)}
 const fu=h.includes('<h2>Pianificazione automatica</h2>');o.style.padding=fu?'0':'';o.innerHTML=`<div class="mn-box${fu?' mn-full':''}" role="dialog" aria-modal="true">${h}</div>`;o.hidden=false;o.scrollTop=0}
function closeO(){const o=document.getElementById('mnOvl');if(o)o.hidden=true;refresh()}
function refresh(){if(LEAF.includes(S.tab))draw();else if(typeof render==='function'&&S.user&&(S.tab==='persone'||MN._myN!==myCount())){MN._myN=myCount();render()}}
const myCount=()=>M.att.filter(a=>a.due&&mine(a)).length;
window.MNP_mine=()=>{start();return MN.ready?myCount():0};

function impDett(id){const i=I(id),ass=M.ass.filter(a=>a.imp===id);
 ovl(`<div class="mn-oh"><h2>${e_(i.cod)} · ${e_(i.nome)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="muted">${e_(i.cli||'')}</div>
 ${list(ass.map(s=>{const p=P(s.proc),st=assStatus(s),a=planned(s);
  return item(st[1],`${e_(p.cod)} · ${e_(p.desc)}`,`${dot(st[0],st[1])}${CMP(s)?`<span>${e_(CMP(s))}</span>`:''}<span>${freq(p)}</span>${s.last?`<span>ultima ${fd(s.last)}</span>`:''}`,a?`<button class="btn" onclick="MNX.esegui('${a.id}')">Apri</button>`:p.tipo==='evento'&&isR()&&!s.evt?`<button class="btn" onclick="MNX.evento('${s.id}')">Registra evento</button>`:'')}),'Nessuna procedura assegnata.')}
 <div class="row" style="justify-content:space-between">${isR()?`<button class="btn" onclick="MNX.config('${id}')">Configura impianto</button><button class="btn pri" onclick="MNX.plan('${id}')">Pianifica manutenzione</button>`:''}</div>`)}

function drawCfg(){const i=I(MN.cfgImp);if(!MN.cfgTipo&&M.tipi[0])MN.cfgTipo=M.tipi[0].id;const t=T(MN.cfgTipo);
 const pl=p=>`${e_(p.cod)} – ${e_(p.desc)} <span class="muted">(${freq(p)})</span>`;
 ovl(`<div class="mn-oh"><h2>Configura ${e_(i.cod)} · ${e_(i.nome)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="evf"><label>Categoria<select onchange="MNX.impSet('cat',this.value)">${catOpts(i.cat)}</select></label><label>Nome<input value="${e_(i.cod)}" onchange="MNX.impSet('cod',this.value)"></label><label>Commessa<input value="${e_(i.nome)}" onchange="MNX.impSet('nome',this.value)"></label><label>Cliente<input value="${e_(i.cli)}" onchange="MNX.impSet('cli',this.value)"></label><label style="grid-column:1/-1">Descrizione<input value="${e_(i.desc||'')}" onchange="MNX.impSet('desc',this.value)"></label></div>
 <h3>Elementi presenti</h3><div class="muted" style="font-size:13px">Spunta i tipi di componente che ci sono in questo impianto: vengono aggiunti con le loro procedure.</div>
 <div class="mn-checks" style="columns:2 200px">${M.tipi.map(t=>{const n=(i.comps||[]).filter(c=>c.tipo===t.id).length;return `<label class="mn-chk" style="break-inside:avoid"><input type="checkbox" ${n?'checked':''} onchange="MNX.togEl('${t.id}',this.checked)"> <span>${e_(t.nome)}${n>1?` <span class="mn-n">${n}</span>`:''}</span></label>`}).join('')||'<span class="muted">Crea prima i tipi in «Tipi componente»</span>'}</div>
 <h3>Componenti dell'impianto</h3>
 ${(i.comps||[]).map(c=>{const ass=M.ass.filter(a=>a.comp===c.id),op=(MN.cfgOpen||{})[c.id];return `<div class="mn-step" style="padding:0"><button class="mn-cfgc" aria-expanded="${!!op}" onclick="MNX.cfgOpen('${c.id}')"><span>${op?'▾':'▸'}</span><b style="flex:1;text-align:left">${e_(c.sigla)}</b><span class="muted" style="font-size:12px">${ass.length} procedure</span></button>
 ${op?`<div style="padding:0 12px 12px;display:grid;gap:8px"><div class="row"><label style="flex:1;display:grid;gap:4px;font-size:12px;color:var(--muted)">Descrizione<input value="${e_(c.sigla)}" onchange="MNX.compRen('${c.id}',this.value)"></label><span class="pill" style="color:var(--info)">${e_(T(c.tipo)?.nome||'')}</span><button class="btn sm" onclick="MNX.delComp('${c.id}')">Rimuovi</button></div>
 ${ass.map(a=>`<div class="row" style="font-size:13px"><span style="flex:1">${pl(P(a.proc))}<br>${dot(assStatus(a)[0],assStatus(a)[1])}</span>${P(a.proc).tipo!=='evento'?`<label class="muted" style="font-size:11px;display:grid">Ultima esecuzione<input type="date" value="${a.last||''}" onchange="MNX.setLast('${a.id}',this.value)"></label>${(()=>{const pa=planned(a);return pa?`<span class="muted" style="font-size:11px;align-self:end">pianificata il ${fd(pa.due)}</span>`:a.next?`<button class="btn sm" style="align-self:end" title="Pianifica il prossimo intervento in base alla cadenza" onclick="MNX.planNext('${a.id}')">Pianifica ${fd(a.next)}</button>`:''})()}`:''}${isStd(a)?'<span class="pill" style="color:var(--off)">dal tipo</span>':`<button class="btn sm" onclick="MNX.delAss('${a.id}')">Togli</button>`}</div>`).join('')||'<span class="muted">Nessuna procedura</span>'}
 <div class="row"><select id="mnXp_${c.id}" aria-label="Procedura aggiuntiva" style="flex:1">${M.proc.filter(p=>!ass.some(a=>a.proc===p.id)).map(p=>`<option value="${p.id}">${e_(p.cod)} – ${e_(p.desc)}</option>`).join('')}</select><button class="btn sm" onclick="MNX.addExtra('${c.id}')">+ Procedura</button></div></div>`:''}</div>`}).join('')||'<p class="muted">Nessun componente: spuntali sopra.</p>'}
 <details><summary class="muted" style="cursor:pointer">Aggiungi un altro componente (es. un secondo robot)</summary>
 <div class="evf"><label>Tipo<select onchange="MN_setTipo(this.value)">${M.tipi.map(x=>`<option value="${x.id}" ${x.id===MN.cfgTipo?'selected':''}>${e_(x.nome)}</option>`).join('')}</select></label><label>Sigla / descrizione<input id="mnCSigla" placeholder="es. R3 Robot pallettizzatore"></label></div>
 <div class="muted">Il componente riceve tutte le procedure del tipo; se le modifichi nel tipo, cambiano su tutti gli impianti:</div><div class="mn-checks">
 ${t?t.procs.map(pid=>{const p=P(pid);return p?`<div class="mn-chk">✓ <span>${pl(p)}</span></div>`:''}).join('')||'<span class="muted">Nessuna procedura standard</span>':'<span class="muted">Crea prima un tipo in «Componenti»</span>'}</div>
 <div class="row"><button class="btn pri" onclick="MNX.addComp()" ${t?'':'disabled'}>Aggiungi componente</button><span class="muted" style="font-size:12px">Le procedure entrano nella prima manutenzione che pianifichi.</span></div></details>
 <div class="row" style="justify-content:space-between"><button class="btn" onclick="MNX.delImp()">Elimina impianto</button><button class="btn pri" onclick="MNX.close()">Fine</button></div>`)}
const DTIP={vpv:'Verbale di prima verifica',ce:'Dichiarazione CE / libretto',tar:'Certificato di taratura',vper:'Verbale di verifica periodica',alt:'Altro'};
const scadCol=d=>{if(!d)return '';const t=tdy();return d<t?'var(--accent)':d<=addD(t,60)?'var(--warn)':''};
function idocList(i,R){const l=(i.docs||[]).slice().sort((a,b)=>(a.data||'')<(b.data||'')?1:-1);return list(l.map(d=>{const c=(i.comps||[]).find(x=>x.id===d.comp),sc=scadCol(d.scad);
 return item(sc||'var(--info)',`${e_(DTIP[d.tipo]||'Documento')}${c?' · '+e_(c.sigla):''}`,`<span>📄 ${e_(d.name)}</span>${d.data?`<span>del ${fd(d.data)}</span>`:''}${d.scad?`<span style="${sc?'color:'+sc+';font-weight:600':''}">scade il ${fd(d.scad)}</span>`:''}${d.size?`<span>${Math.round(d.size/1024)} KB</span>`:''}`,`<button class="btn sm" onclick="MNX.viewBlob('${d.id}')">Apri</button>${R?`<label class="btn sm" style="cursor:pointer">Nuova versione<input type="file" accept="application/pdf,image/*" hidden onchange="MNX.idocRepl('${i.id}','${d.id}',this)"></label><button class="btn sm" onclick="MNX.idocEd('${i.id}','${d.id}')">Modifica</button><button class="btn sm" onclick="MNX.idocDel('${i.id}','${d.id}')">Elimina</button>`:''}`)}),'Nessun documento (verbali, dichiarazioni CE, tarature…).')}
function idocForm(imp,d){const i=I(imp);ovl(`<div class="mn-oh"><h2>${d?'Modifica documento':'Carica documento'} · ${e_(i.cod)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="evf"><label>Tipo<select id="mnDT">${Object.entries(DTIP).map(([k,v])=>`<option value="${k}" ${(d?d.tipo:'vpv')===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Componente (facoltativo)<select id="mnDC"><option value="">— tutto l'impianto —</option>${(i.comps||[]).map(c=>`<option value="${c.id}" ${d&&d.comp===c.id?'selected':''}>${e_(c.sigla)}</option>`).join('')}</select></label></div>
 <div class="evf"><label>Data documento<input type="date" id="mnDD" value="${d?d.data||'':''}"></label><label>Scadenza (facoltativa)<input type="date" id="mnDS" value="${d?d.scad||'':''}"></label></div>
 ${d?'':`<div class="evf"><label>File (PDF o immagine, max 700 KB)<input type="file" id="mnDF" accept="application/pdf,image/*"></label></div>`}
 <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" id="mnDOk" onclick="MNX.idocOk('${imp}',${d?`'${d.id}'`:'null'})">Salva</button></div>`)}
const cfgOrRef=()=>{const o=document.getElementById('mnOvl');if(o&&!o.hidden&&MN.cfgImp&&o.querySelector('.mn-cfgc'))drawCfg();else refresh()};
window.MN_setTipo=v=>{MN.cfgTipo=v;drawCfg()};

const nextCod=()=>{const n=M.proc.map(p=>/^PM0*(\d+)$/i.exec(String(p.cod||'').trim())).filter(Boolean).map(m=>+m[1]);return 'PM'+String((n.length?Math.max(...n):0)+1).padStart(3,'0')};
function editProc(id,forTipo){const t0=forTipo&&T(forTipo);const p=id?P(id):{cod:nextCod(),desc:t0?t0.nome+' – ':'',norma:'',tipo:'cal',int:6,min:'',mat:'',steps:[],doc:null};MN.newTipo=id?null:(t0?t0.id:null);
 MN.tmpSteps=p.steps.map(s=>({...s}));MN.tmpDoc=p.doc;MN.editId=id||null;
 ovl(`<div class="mn-oh"><h2>${id?'Modifica':'Nuova'} procedura</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="evf"><label>Codice${id?'':' <span class="muted" style="font-weight:400">(proposto, modificabile)</span>'}<input id="mnPCod" value="${e_(p.cod)}" placeholder="PM001"></label><label>Riferimento normativo<input id="mnPNorma" value="${e_(p.norma)}"></label></div>
 <div class="evf"><label>Descrizione<input id="mnPDesc" value="${e_(p.desc)}"></label></div>
 <div class="evf"><label>Frequenza<select id="mnPTipo">${Object.entries(TIPI).map(([k,v])=>`<option value="${k}" ${p.tipo===k?'selected':''}>${v}</option>`).join('')}</select></label><label>Ogni (mesi)<input id="mnPInt" type="number" min="1" value="${p.int||6}"></label><label>Tempo stimato (minuti)<input id="mnPMin" type="number" min="0" value="${p.min||''}"></label><label>Avviso (giorni prima della scadenza)<input id="mnPAvv" type="number" min="0" value="${id?avvOf(p):15}"></label></div>
 <div class="evf"><label>Materiali, attrezzature e DPI<textarea id="mnPMat" rows="4">${e_(p.mat||'')}</textarea></label></div>
 <label class="mn-chk" style="margin:4px 0 10px"><input type="checkbox" id="mnPEst" ${p.est?'checked':''}> 🏢 Intervento fornitore esterno obbligatorio</label>
 <h3>Passi da confermare</h3><div id="mnSteps"></div>
 <div class="mn-step"><label>Nuovo passo<input id="mnNS" placeholder="Descrizione del passo"></label><label>Istruzioni del passo<textarea id="mnNI" rows="3" placeholder="Come eseguire il passo (una riga per istruzione)"></textarea></label><div class="row"><label class="mn-chk"><input type="checkbox" id="mnNF"> Foto obbligatoria</label><button class="btn" onclick="MNX.addStep()">Aggiungi passo</button></div></div>
 <h3>Documento (PDF o immagine, max 700 KB)</h3>${docOpts()}<input type="file" accept="application/pdf,image/*" onchange="MNX.loadDoc(this)"><div id="mnDocI" class="muted">${MN.tmpDoc?'Allegato: '+e_(MN.tmpDoc.name):'Nessun documento'}</div>
 ${p.doc&&p.doc.id?(()=>{const n=M.proc.filter(x=>x.doc&&x.doc.id===p.doc.id).length;return `<div class="mn-info"><b>Modificare il documento per tutte le procedure?</b><div style="font-size:13px">Carica la nuova versione di «${e_(p.doc.name)}»: sostituisce il file in tutte le ${n} procedure che lo usano (resta un solo file).</div><label class="btn sm" style="width:fit-content;cursor:pointer;margin-top:6px">Carica nuova versione<input type="file" accept="application/pdf,image/*" hidden onchange="MNX.docRepl('${p.doc.id}',this)"></label></div>`})():''}
 <div class="row" style="justify-content:space-between">${id?`<button class="btn" onclick="MNX.delProc()">Elimina</button>`:'<span></span>'}<div class="row"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.saveProc()">Salva</button></div></div>`);drawSteps()}
function drawSteps(){const b=document.getElementById('mnSteps');if(b)b.innerHTML=MN.tmpSteps.map((s,k)=>`<div class="mn-srow" style="display:grid;gap:4px;padding:6px 0"><div class="row"><span class="mono">${k+1}.</span><input style="flex:1" value="${e_(s.t)}" aria-label="Passo ${k+1}" onchange="MNX.stSet(${k},'t',this.value)"><label class="mn-chk" style="font-size:12px!important"><input type="checkbox" ${s.foto?'checked':''} onchange="MNX.stSet(${k},'foto',this.checked)"> Foto</label><button class="btn sm" onclick="MNX.mvStep(${k},-1)" aria-label="Su">↑</button><button class="btn sm" onclick="MNX.rmStep(${k})">Rimuovi</button></div><textarea rows="${Math.min(8,Math.max(2,(s.i||'').split('\n').length))}" aria-label="Istruzioni passo ${k+1}" placeholder="Istruzioni del passo" onchange="MNX.stSet(${k},'i',this.value)">${e_(s.i||'')}</textarea></div>`).join('')||'<p class="muted">Nessun passo</p>'}
// documenti già caricati: si collegano senza ricaricarli
const docList=()=>{const m={};M.proc.forEach(p=>{if(p.doc&&p.doc.id)m[p.doc.id]=p.doc});return Object.values(m)};
const docUsed=(id,except)=>M.proc.some(p=>p!==except&&p.doc&&p.doc.id===id);
function docOpts(){const l=docList();return l.length?`<label class="muted" style="display:grid;gap:4px;font-size:12px">Usa un documento già caricato<select onchange="MNX.pickDoc(this.value)"><option value="">—</option>${l.map(d=>`<option value="${d.id}" ${MN.tmpDoc&&MN.tmpDoc.id===d.id?'selected':''}>${e_(d.name)}</option>`).join('')}</select></label><div class="muted" style="font-size:12px">oppure carica un nuovo file:</div>`:''}

async function drawEx(){const a=M.att.find(x=>x.id===MN.ex);if(!a)return closeO();const p=PA(a),i=IA(a),st=status(a);
 const done=p.steps.filter((s,k)=>a.ok[k]&&(!s.foto||(a.foto[k]||[]).length)).length;
 const thumbs=await Promise.all(p.steps.map((s,k)=>Promise.all((a.foto[k]||[]).map(id=>blob('manutFoto',id)))));
 const canDo=isR()||mine(a);
 ovl(`<div class="mn-oh"><h2>${e_(p.cod)} · ${e_(p.desc)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="muted">👤 ${e_(a.man||'senza nome')} · ${a.free?'Altra attività':'Attività preventiva'}${a.sub?' (solo passi mancanti)':''}${INOME(a)?' · '+e_(INOME(a)):''}${CMP(a)?' › '+e_(CMP(a)):''} · ${fd(a.due)} ${pill(st)}</div>${p._d?`<div class="mn-info" style="white-space:pre-line">${e_(p._d)}</div>`:''}${(()=>{const s0=M.ass.find(x=>x.id===a.ass);return s0&&s0.incompleto?`<div class="mn-info" style="border-left-color:var(--warn)">Da concludere: la volta precedente (${fd(s0.incompleto.data)}) mancavano ${e_(s0.incompleto.passi.join(', '))}.</div>`:''})()}
 ${p.min||p.mat?`<div class="mn-info" style="white-space:pre-line">${p.min?`<b>Tempo stimato:</b> ${p.min} minuti\n`:''}${e_(p.mat||'')}</div>`:''}
 ${p.doc?`<div><button class="btn" onclick="MNX.viewDoc('${p.id}')">📄 Apri ${e_(p.doc.name||'documento procedura')}</button></div>`:''}
 ${!canDo?'<div class="muted">Attività assegnata a '+e_(a.man||'nessuno')+': puoi solo consultarla.</div>':''}
 ${p.steps.map((s,k)=>`<div class="mn-step"><label class="mn-chk"><input type="checkbox" ${a.ok[k]?'checked':''} ${canDo?'':'disabled'} onchange="MNX.tick(${k},this.checked)"> <span>${e_(s.t)}</span></label>${s.i?`<details class="mn-ist"><summary>Istruzioni</summary><div style="white-space:pre-line">${e_(s.i)}</div></details>`:''}
 ${s.foto||(a.foto[k]||[]).length?`<div class="row mn-ph">${canDo?`<label class="btn sm">📷 Aggiungi foto<input type="file" accept="image/*" capture="environment" hidden onchange="MNX.foto(${k},this)"></label>`:''}${thumbs[k].map((d,j)=>d?`<span class="mn-th"><img src="${d.data}" alt="Foto passo ${k+1}">${canDo?`<button class="btn sm" aria-label="Elimina foto" onclick="MNX.delFoto(${k},${j})">✕</button>`:''}</span>`:'').join('')}${s.foto&&!(a.foto[k]||[]).length?'<span class="muted">Foto obbligatoria</span>':''}</div>`:''}</div>`).join('')}
 <div class="mn-step"><b>Ricambi utilizzati</b>${M.ric.filter(r=>r.att===a.id&&r.tipo!=='nota').map(r=>`<div class="row" style="font-size:13px"><span style="flex:1">${e_(r.desc)}${r.qta?' × '+e_(r.qta):''}</span>${canDo?`<label class="mn-chk" style="font-size:12px!important"><input type="checkbox" ${r.buy?'checked':''} onchange="MNX.ricBuy('${r.id}',this.checked)"> Da riacquistare</label>`:`<span class="muted">${r.buy?'da riacquistare':''}</span>`}${r.buy&&r.stato==='ok'?`<span style="color:var(--ok);font-weight:600;font-size:12px">acquistato${r.acqData?' il '+fd(r.acqData):''}${r.acqDa?' da '+e_(r.acqDa):''}</span>`:''}${canDo?`<button class="btn sm" onclick="MNX.ricDel('${r.id}',1)" aria-label="Elimina">✕</button>`:''}</div>`).join('')||'<span class="muted" style="font-size:13px">Nessun ricambio utilizzato.</span>'}
 ${canDo?`<div class="evf"><label>Ricambio utilizzato<input id="mnRD" placeholder="es. Cartuccia grasso, guarnizione…"></label><label>Quantità<input id="mnRQ" placeholder="1"></label><label class="mn-chk" title="Spunta se il ricambio va riacquistato"><input type="checkbox" id="mnRB"> Da riacquistare</label><button class="btn" onclick="MNX.ricAdd()">+ Aggiungi ricambio</button></div>`:''}</div>
 <div class="mn-step"><div class="mn-oh"><b>Segnalazioni per l'impianto</b>${canDo?`<button class="btn sm" onclick="MNX.segNew(null,'${a.id}')">+ Segnala nota</button>`:''}</div>${(()=>{const L=M.ric.filter(r=>r.att===a.id&&r.tipo==='nota');return L.length?L.map(r=>`<div style="font-size:13px;margin-top:4px">📝 ${e_(r.desc)} <span class="muted">· ${e_(r.da||'')} ${fd(r.data)}${r.arch?' · archiviata':''}</span>${!r.arch&&(isR()||r.da===me())?` <button class="btn sm" onclick="MNX.segEd('${r.id}',1)">Modifica</button>`:''}</div>`).join(''):'<div class="muted" style="font-size:13px">Usa «Segnala nota» per un problema da far vedere a tutti (resta nelle Segnalazioni). Le note sotto restano solo in questa attività.</div>'})()}</div>
 ${(()=>{const L=(M.log||[]).filter(l=>l.att===a.id||l.att===a.orig).slice().reverse();return L.length?`<details class="mn-step"><summary><b>Cronologia</b> <span class="muted">${L.length} eventi</span></summary><div class="mn-checks" style="margin-top:6px">${L.map(l=>`<div style="font-size:13px"><b>${e_(l.t.split(' ')[0].split('-').reverse().join('/'))}</b> · ${e_(l.az)} · ${e_(l.txt)} <span class="muted">(${e_(l.chi)})</span></div>`).join('')}</div></details>`:''})()}
 <div class="evf"><label>Note<textarea id="mnNote" rows="3" ${canDo?'':'disabled'} onchange="MNX.note(this.value)">${e_(a.note)}</textarea></label></div>
 <div class="row" style="justify-content:space-between"><span class="muted">${done}/${p.steps.length} passi completati</span><div class="row"><button class="btn" onclick="MNX.pdfOpen()">PDF</button>${isR()&&a.due?`<button class="btn" onclick="MNX.togli('${a.id}')" title="Toglie l'attività dal calendario e dalla persona: va in Da ripianificare">Togli e ripianifica</button>`:''}<button class="btn" onclick="MNX.close()">Esci</button>${canDo&&done>0&&done<p.steps.length?`<button class="btn" onclick="MNX.chiudi(1)" title="I passi non fatti restano da ripianificare">Chiudi con passi mancanti</button>`:''}${canDo?`<button class="btn pri mn-done" ${done<p.steps.length?'disabled title="Conferma prima tutti i passi"':''} onclick="MNX.chiudi()">✓ Attività completata</button>`:''}</div></div>`)}

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
window.__MNT={get M(){return M},MN,saveM,storico,saveYm,H};// solo per test/diagnostica
window.MNP={
 count(p){start();return M.att.filter(a=>a.due&&sameP(a.man,p)).length},
 html(p){start();if(MN.err)return `<div class="mn-pers mn-info" style="border-left-color:var(--accent)">🔧 Manutenzioni non leggibili: ${e_(MN.err)}. Avvisa l'amministratore (regole di Firestore).</div>`;if(!MN.ready)return '';const l=M.att.filter(a=>a.due&&sameP(a.man,p));if(!l.length)return '';
  return `<div class="mn-pers"><h3>🔧 Manutenzioni <span class="mn-n">${l.length}</span></h3><div class="muted" style="font-size:13px">Apri un'attività per vedere i passi da eseguire, confermarli e chiuderla.</div>${split(l,false)}</div>`}
};
// --- Intervento non programmato
const NPC=['Manutenzione preventiva','Manutenzione straordinaria','Manutenzione predittiva','Assistenza produzione','Setup/Messa a punto','Costruzione/montaggio/cablaggio','Supporto fornitore','Programmazione','Gestione RDA/ricambi e documentazione manutenzione'];
function drawNP(){const n=MN.np,i=I(n.imp);const ass=i?M.ass.filter(s=>s.imp===i.id&&(!n.el||s.comp===n.el)&&P(s.proc)&&!P(s.proc)._miss):[];const el=i&&n.el&&(i.comps||[]).find(c=>c.id===n.el);
 ovl(`<div class="mn-oh"><h2>Intervento non programmato</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="evf"><label>Impianto<select onchange="MNX.npSet('imp',this.value)"><option value="">— scegli —</option>${M.imp.map(x=>`<option value="${x.id}" ${x.id===n.imp?'selected':''}>${e_(x.cod)} · ${e_(x.nome)}</option>`).join('')}</select></label>${i&&(i.comps||[]).length?`<label>Elemento (facoltativo)<select onchange="MNX.npSet('el',this.value)"><option value="">— tutto l'impianto —</option>${i.comps.map(c=>`<option value="${c.id}" ${c.id===n.el?'selected':''}>${e_(c.sigla)}</option>`).join('')}</select></label>`:''}<label>Data<input type="date" value="${n.data}" onchange="MNX.npSet('data',this.value||'${tdy()}')"></label>
 <label>Causale<select onchange="MNX.npSet('caus',this.value)"><option value="">— scegli —</option>${NPC.map(x=>`<option ${x===n.caus?'selected':''}>${e_(x)}</option>`).join('')}</select></label>
 <label>Ore impiegate<input type="number" min="0.5" step="0.5" inputmode="decimal" placeholder="min 0,5" value="${e_(n.ore)}" onchange="MNX.npSet('ore',this.value)"></label></div>
 ${n.caus===NPC[0]?`<div class="evf"><label>Preventiva eseguita<select onchange="MNX.npSet('ass',this.value)"><option value="">${i?(ass.length?'— scegli —':'nessuna preventiva su questo impianto'):'scegli prima l\'impianto'}</option>${ass.map(s=>{const p=P(s.proc);return `<option value="${s.id}" ${s.id===n.ass?'selected':''}>${e_(p.cod)} · ${e_(p.desc)}${CMP(s)?' · '+e_(CMP(s)):''}${s.next?' (scad. '+fd(s.next)+')':''}</option>`}).join('')}</select></label></div>`:''}
 <div class="evf"><label>Descrizione<textarea rows="3" placeholder="Cosa è stato fatto" onchange="MNX.npSet('desc',this.value)">${e_(n.desc)}</textarea></label></div>
 <div><div class="mn-oh"><b>Ricambi utilizzati</b><button class="btn sm" onclick="MNX.npRic(-1)">+ Ricambio</button></div>${n.ric.map((r,k)=>`<div class="row" style="gap:6px;margin-top:6px"><input style="width:110px" placeholder="Codice" value="${e_(r.cod)}" onchange="MNX.npRic(${k},'cod',this.value)"><input style="flex:1;min-width:120px" placeholder="Descrizione" value="${e_(r.desc)}" onchange="MNX.npRic(${k},'desc',this.value)"><input type="number" min="0" step="any" style="width:70px" aria-label="Quantità" value="${e_(r.q)}" onchange="MNX.npRic(${k},'q',this.value)"><button class="btn sm" onclick="MNX.npRic(${k},'del')">✕</button></div>`).join('')||'<div class="muted" style="font-size:13px">Nessun ricambio</div>'}</div>
 ${i?`<div class="evf"><label>Ore lavorate impianto (facoltativo)${i.oreImp!=null?` · ultime ${i.oreImp}${i.oreImpD?' il '+fd(i.oreImpD):''}`:''}<input type="number" min="0" step="any" inputmode="decimal" value="${e_(n.oreImp)}" onchange="MNX.npSet('oreImp',this.value)"></label>${el?`<label>Ore ${e_(el.sigla)} (facoltativo)${el.ore!=null?` · attuali ${el.ore}`:''}<input type="number" min="0" step="any" inputmode="decimal" value="${e_(n.oreEl)}" onchange="MNX.npSet('oreEl',this.value)"></label>`:''}</div><div class="muted" style="font-size:12px">Le ore impianto aggiornano tutti gli elementi con la differenza; le ore scritte sull'elemento diventano il suo riferimento.</div>`:''}
 <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.npOk()">Registra</button></div>`)}
function qiEx(){const q=MN.qi,fz=q.fz||'';const IM=M.imp.filter(i=>!i.dism);if(fz==='_all')return sortI(IM.slice());if(fz==='_none')return sortI(IM.filter(i=>!i.cat||!M.cat.some(c=>c.id===i.cat)));if(fz){const ds=catDesc(fz);return sortI(IM.filter(i=>ds.has(i.cat)))}return sortI(IM.filter(i=>!q.cat||q.cat==='_new'?q.cat!=='_new':i.cat===q.cat))}
function drawQI(){const q=MN.qi,T_=M.tipi,EX=qiEx();const sc0=document.getElementById('mnQiS'),st0=sc0?sc0.scrollTop:0,o0=document.getElementById('mnOvl'),ot0=o0?o0.scrollTop:0;
 ovl(`<div class="mn-oh"><h2>Inserimento rapido impianti</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="evf"><label>Zona (per tutti gli impianti)<select onchange="MNX.qiSet('cat',this.value)">${catOpts(q.cat==='_new'?'':q.cat).replace('</option>','</option><option value="_new" '+(q.cat==='_new'?'selected':'')+'>+ Nuova zona…</option>')}</select></label>${q.cat==='_new'?`<label>Nome nuova zona<input value="${e_(q.nc)}" onchange="MNX.qiSet('nc',this.value)"></label>`:''}</div>
 <style>.mn-qi td input:not([type=checkbox]),.mn-qi td select{border:1px solid var(--line)!important;background:var(--surface)!important;padding:5px 7px}.mn-qi td input[type=checkbox]{width:20px!important;height:20px}.mn-qi td select{width:150px!important;min-width:150px}.mn-qi td{padding:3px 4px}.mn-qi th{vertical-align:bottom}</style><div id="mnQiS" style="overflow:auto;max-height:calc(100vh - 230px)"><table class="mn-qi" style="border-collapse:collapse;font-size:13px;min-width:100%"><thead><tr style="position:sticky;top:0;background:var(--surface)"><th style="text-align:left;padding:4px">Nome</th><th style="text-align:left;padding:4px">Descrizione</th><th style="text-align:left;padding:4px">Commessa</th><th style="text-align:left;padding:4px">Zona</th><th style="text-align:left;padding:4px">Cliente</th>${T_.map(t=>`<th style="padding:4px;font-weight:600;writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap" title="Clic per spuntare tutta la colonna">${e_(t.nome)} <input type="checkbox" aria-label="Tutti ${e_(t.nome)}" onchange="MNX.qiCol('${t.id}',this.checked)"></th>`).join('')}<th></th></tr></thead>
 <tbody>${q.rows.map((r,k)=>`<tr><td style="padding:2px"><input style="width:100px" value="${e_(r.cod)}" onchange="MNX.qiRow(${k},'cod',this.value)" onpaste="MNX.qiGrid(event,${k},'cod')"></td><td style="padding:2px"><input style="width:320px" value="${e_(r.desc||'')}" onchange="MNX.qiRow(${k},'desc',this.value)" onpaste="MNX.qiGrid(event,${k},'desc')"></td><td style="padding:2px"><input style="width:120px" value="${e_(r.nome)}" onchange="MNX.qiRow(${k},'nome',this.value)" onpaste="MNX.qiGrid(event,${k},'nome')"></td><td style="padding:2px"><select aria-label="Zona" style="max-width:150px" onchange="MNX.qiRow(${k},'cat',this.value)">${catOpts(r.cat||'','↑ come in alto')}</select></td><td style="padding:2px"><input style="width:110px" value="${e_(r.cli)}" onchange="MNX.qiRow(${k},'cli',this.value)" onpaste="MNX.qiGrid(event,${k},'cli')"></td>${T_.map(t=>`<td style="text-align:center"><input type="checkbox" ${r.t[t.id]?'checked':''} aria-label="${e_(t.nome)}" onchange="MNX.qiRow(${k},'t',['${t.id}',this.checked])"></td>`).join('')}<td><button class="btn sm" onclick="MNX.qiRow(${k},'del')" aria-label="Togli riga">✕</button></td></tr>`).join('')}${M.imp.length?`<tr><td colspan="${T_.length+6}" style="padding:10px 4px 4px;font-weight:600">Già inseriti · <select aria-label="Filtro zona già inseriti" style="font-weight:400" onchange="MNX.qiSet('fz',this.value)"><option value="" ${!q.fz?'selected':''}>come zona in alto</option><option value="_all" ${q.fz==='_all'?'selected':''}>Tutte le zone</option><option value="_none" ${q.fz==='_none'?'selected':''}>Senza zona</option>${catOpts(q.fz||'').replace(/^<option value="">[^<]*<\/option>/,'')}</select> <span class="muted" style="font-weight:400">${EX.length} impianti · spunta per aggiungere</span></td></tr>`:''}${EX.map(i=>`<tr style="background:var(--hover,rgb(0 0 0/.03))"><td style="padding:4px"><b>${e_(i.cod)}</b></td><td style="padding:2px"><input style="width:320px" value="${e_(i.desc||'')}" aria-label="Descrizione" onchange="MNX.qiEd('${i.id}','desc',this.value)"></td><td style="padding:2px"><input style="width:120px" value="${e_(i.nome)}" aria-label="Commessa" onchange="MNX.qiEd('${i.id}','nome',this.value)"></td><td style="padding:2px"><select aria-label="Zona" style="max-width:150px" onchange="MNX.qiEd('${i.id}','cat',this.value)">${catOpts(i.cat||'','— senza zona —')}</select></td><td style="padding:2px"><input style="width:110px" value="${e_(i.cli||'')}" aria-label="Cliente" onchange="MNX.qiEd('${i.id}','cli',this.value)"></td>${T_.map(t=>{const has=(i.comps||[]).some(c=>c.tipo===t.id);return `<td style="text-align:center">${has?`<button type="button" title="Presente · clic per togliere" aria-label="Togli ${e_(t.nome)}" onclick="MNX.qiDel('${i.id}','${t.id}')" style="cursor:pointer;border:0;padding:0;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:5px;background:var(--ok);color:#fff;font-weight:700">✓</button>`:`<input type="checkbox" aria-label="Aggiungi ${e_(t.nome)}" onchange="MNX.qiAdd('${i.id}','${t.id}',this.checked)">`}</td>`}).join('')}<td></td></tr>`).join('')}</tbody></table></div>
 ${q.paste?`<div class="evf"><label>Incolla l'elenco, una riga per impianto. Da Excel (colonne separate) o con «;»: Nome | Descrizione | Commessa | Cliente. Testo semplice: il primo pezzo è il nome, il resto la descrizione<textarea id="mnQiP" rows="10"></textarea></label></div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.qiPaste(false)">Annulla</button><button class="btn pri" onclick="MNX.qiPasteOk()">Aggiungi righe</button></div>`:''}<div class="row" style="justify-content:space-between"><div class="row"><button class="btn" onclick="MNX.qiRow(-1)">+ Riga</button><button class="btn" onclick="MNX.qiPaste(true)">Incolla elenco</button></div><div class="row"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.qiOk()">Crea impianti</button></div></div>
 <div class="muted" style="font-size:12px">Ogni spunta aggiunge un componente di quel tipo con le sue procedure. Sugli impianti già inseriti la spunta aggiunge subito il componente (✓ verde = presente: cliccalo per toglierlo con le sue procedure); per togliere o duplicare usa «Configura».</div>`);
 const o=document.getElementById('mnOvl');const box=o&&o.firstElementChild;if(box){box.style.width='100%';box.style.maxWidth='none';box.style.minHeight='calc(100vh - 24px)';box.style.alignContent='start'}if(o){o.style.padding='12px'}const sc=document.getElementById('mnQiS');if(sc)sc.scrollTop=st0;if(o)o.scrollTop=ot0}
// ---------- turni da «Turni e ferie» + pianificazione automatica + carico persone (v2.23.0) ----------
// Il riepilogo turni lo scrive l'app Turni e ferie (ergoplan/rep_<id>, un doc per reparto di ingegneria e manutenzione).
// «Sincronizza turni» lo legge con un utente di Turni e ferie e lo copia in Ergo Plan (manutDoc/_turni), visibile a tutti.
const AP_WORK=['M','P','N','G'],AP_SV={MSV:'M',SV:'G'},AP_LAB={M:'Mattina',P:'Pomeriggio',N:'Notte',G:'Giornata'},AP_GG=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const AP={step:'par',res:null};
const apNk=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
function apGuess(n){const L=S.persone||[],k=apNk(n),w=k.split(' ').sort().join(' ');return L.find(p=>apNk(p)===k)||L.find(p=>apNk(p).split(' ').sort().join(' ')===w)||L.find(p=>{const q=apNk(p).split(' ');return q.length>1&&q.every(x=>k.split(' ').includes(x))})||''}
// --- riepilogo turni (cache condivisa) ---
const EPT={d:null,ld:0,
 async load(force){if(this.d&&!force&&Date.now()-this.ld<300000)return this.d;try{const x=await window.FBM.getBlob('manutDoc','_turni');this.d=x||null;this.ld=Date.now()}catch(e){}return this.d},
 rows(){const T=this.d;if(!T||!T.p)return[];return Object.entries(T.p).map(([k,x])=>({k,n:x.n,rep:x.rep,ep:({...((M.autoP||{}).map||{}),...((AP.p||{}).map||{})})[x.n]||x.ep||apGuess(x.n),s:String(x.s||'').split(','),t:String(x.t||'').split(',')}))},
 idx(d){const T=this.d;if(!T)return -1;const i=Math.round((new Date(d+'T12:00:00')-new Date(T.da+'T12:00:00'))/864e5);return i>=0&&i<T.n?i:-1},
 row(ep){return this.rows().find(r=>r.ep&&sameP(r.ep,ep))},
 // turno lavorato (M/P/N/G) o '' se assente/riposo/fuori periodo
 work(r,d){const i=this.idx(d);if(!r||i<0)return'';const s=r.s[i]||'',t=r.t[i]||'';if(AP_SV[s])return AP_SV[s];return AP_WORK.includes(s)&&t.startsWith(s)?s:''},
 // MSV/SV: turno nello stabilimento di Settimo Vittone
 sv(r,d){const i=this.idx(d);return !!(r&&i>=0&&AP_SV[r.s[i]||''])},
 // assenza da mostrare (ferie, mutua, corso…): testo o ''
 abs(r,d){const i=this.idx(d);if(!r||i<0)return'';const s=r.s[i]||'',t=r.t[i]||'';if(!t||AP_SV[s]||AP_WORK.includes(s)&&t.startsWith(s))return'';return t}};
window.EPT={abs:(p,d)=>EPT.abs(EPT.row(p),d),load:f=>EPT.load(f),ready:()=>!!EPT.d};
async function tfLogin(){const u=prompt('Utente dell\'app Turni e ferie (serve solo per leggere i turni):');if(!u)return false;const pw=prompt('Password di '+u+':');if(!pw)return false;
 try{await window.FBM.tfLogin(u.trim(),pw);return true}catch(er){mt('Accesso a Turni e ferie non riuscito: '+FB.err(er));return false}}
async function syncTurni(){if(!isR())return mt('Solo il responsabile può sincronizzare');mt('Leggo i turni…');let x;
 try{x=await window.FBM.tfRead()}catch(er){if(er&&er.code==='tf-login'){if(!await tfLogin())return;try{x=await window.FBM.tfRead()}catch(e2){return mt('Turni non leggibili: '+FB.err(e2))}}else return mt('Turni non leggibili: '+FB.err(er))}
 if(!x||!x.p)return mt('Riepilogo non trovato: in Turni e ferie un responsabile o l\'admin deve salvare una modifica (serve la Rev. 15.9.1)');
 const map=(M.autoP||{}).map||{};Object.values(x.p).forEach(r=>{r.ep=map[r.n]||apGuess(r.n)});
 try{await window.FBM.putBlob('manutDoc','_turni',{...x,sinc:new Date().toISOString(),da_chi:me()||''});EPT.d=x;EPT.ld=Date.now()}catch(er){return mt('Turni non salvati in Ergo Plan: '+FB.err(er))}
 mt('Turni sincronizzati: '+Object.keys(x.p).length+' persone, aggiornati in Turni e ferie il '+new Date(x.agg).toLocaleString('it-IT'));refresh();if(document.getElementById('mnOvl')&&!document.getElementById('mnOvl').hidden&&AP.p)drawAP()}
const tAge=()=>{const T=EPT.d;if(!T)return'<span style="color:var(--accent)">Turni mai sincronizzati</span>';const h=(Date.now()-new Date(T.sinc||T.agg))/36e5;
 return `<span class="muted" style="${h>24?'color:var(--accent)':''}">Turni sincronizzati il ${new Date(T.sinc||T.agg).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'})}${h>24?' · da aggiornare':''}</span>`};
// --- parametri ---
function apDef(){const t=tdy(),o=M.autoP||{};return{da:o.da&&o.da>=t?o.da:t,a:o.a&&o.a>t?o.a:addM(t,2),cat:o.cat!=null?o.cat:(MN.pz&&MN.pz!=='_none'?MN.pz:''),rep:o.rep||'',
 pm:o.pm!=null?o.pm:50,maxT:o.maxT||1,maxF:o.maxF||3,tol:o.tol!=null?o.tol:15,turni:o.turni||['N','P','M','G'],gg:o.gg||[0,1,2,3,4,5,6],ggPref:o.ggPref||[6,0],
 est:!!o.est,evt:o.evt!==false,map:o.map||{},pp:o.pp||{},minDef:o.minDef||30,prioZ:o.prioZ||[],prioI:o.prioI||[],excI:o.excI||[],excC:o.excC||[],unFermo:!!o.unFermo,pctT:o.pctT||60,xPrio:o.xPrio!=null?o.xPrio:1,maxW:o.maxW!=null?o.maxW:1,imp:'',soloAuto:o.soloAuto!==false}}
const cNome=c=>c?(c.nome||(T(c.tipo)||{}).nome||'Componente'):'';
// priorità: 0 impianto prioritario, 1 zona prioritaria, 2 gli altri
const prioOf=(o,i)=>(o.prioI||[]).includes(i.id)?0:(o.prioZ||[]).some(z=>catDesc(z).has(i.cat))?1:2;
const PPof=(o,ep)=>{const x=(o.pp||{})[ep]||{};return{pm:x.pm!=null?x.pm:o.pm,prev:x.prev!==false,off:!!x.off,zone:Array.isArray(x.zone)?x.zone:[],ded:Array.isArray(x.ded)?x.ded:[]}};
// impianti su cui la persona può fare manutenzione: zone scelte (con le sottozone); nessuna zona = tutti
const canImp=(q,i)=>!q.zone.length||q.zone.some(z=>catDesc(z).has(i.cat));
const zTop=z=>z.filter(id=>{const c=CAT(id);return c&&!(c.par&&z.includes(c.par))});
const zoneTxt=q=>!q.zone.length?'Tutti':zTop(q.zone).map(z=>catPath(z)).filter(Boolean).join(', ')||'Tutti';
const isManR=r=>/manutenz/i.test(r.rep||'');
const repRows=o=>EPT.rows().filter(r=>isManR(r)&&(!o.rep||r.rep===o.rep)&&r.ep);
const minOf=(p,o)=>+p.min||(o||M.autoP||{}).minDef||30;
// --- simulazione: non scrive nulla ---
function apSim(o){const res={vis:[],skip:[],carico:{},pers:[]};const svC=M.cat.find(c=>!c.par&&/settimo/i.test(c.nome||'')),svZ=svC?catDesc(svC.id):new Set();
 const zone=o.cat?catDesc(o.cat):null,imps=M.imp.filter(i=>!i.dism&&(o.imp?i.id===o.imp:(!zone||zone.has(i.cat))&&!(o.excI||[]).includes(i.id)));
 const pers=repRows(o).filter(r=>{const q=PPof(o,r.ep);return !q.off&&q.prev&&q.pm>0}).map(r=>({r,ep:r.ep,q:PPof(o,r.ep),cap:Math.round(8*60*PPof(o,r.ep).pm/100)}));res.pers=pers;
 const wkC={},dPr={},wkOf=d=>{const x=new Date(d+'T12:00:00');return addD(d,-((x.getDay()+6)%7))},used={},cntT={},cntF={},TMAX=480,usedT={},capT={},allM=repRows(o).filter(r=>!PPof(o,r.ep).off);const capTurno=(d,t)=>{const k=d+'|'+t;if(capT[k]==null)capT[k]=allM.filter(r=>EPT.work(r,d)===t).length*480*Math.min(100,Math.max(0,+o.pctT||0))/100;return capT[k]};
 // ore già occupate da manutenzioni pianificate prima (non toccate)
 M.att.forEach(a=>{if(!a.due||a.chiusa||!a.man||a.due<o.da||a.due>o.a)return;const k=a.man+'|'+a.due;used[k]=(used[k]||0)+minOf(PA(a)||{},o)});
 const dueOf=s=>{const p=P(s.proc);if(pend(s))return tdy();if(p.tipo==='evento')return s.evt?tdy():null;return s.next||tdy()};
 const days=[];for(let d=o.da;d<=o.a;d=addD(d,1))days.push(d);
 const groups=[];
 imps.forEach(i=>{let it=M.ass.filter(s=>s.imp===i.id&&P(s.proc)&&!P(s.proc)._miss&&!planned(s)).map(s=>({s,p:P(s.proc),due:dueOf(s)})).filter(x=>x.due&&x.due<=o.a&&!(x.s.comp&&(o.excC||[]).includes(i.id+'|'+x.s.comp)));
  it.filter(x=>x.p.est&&!o.est).forEach(x=>res.skip.push({i,p:x.p,why:'fornitore esterno'}));it=it.filter(x=>!x.p.est||o.est);
  it.filter(x=>x.p.tipo==='evento'&&!o.evt).forEach(x=>res.skip.push({i,p:x.p,why:'a evento'}));it=it.filter(x=>x.p.tipo!=='evento'||o.evt);
  it.sort((a,b)=>a.due<b.due?-1:1);while(it.length){const d0=it[0].due,lim=o.unFermo&&!it[0].p.est?o.a:addD(d0<o.da?o.da:d0,o.tol);const ex=!!it[0].p.est,sel=x=>x.due<=lim&&(!o.unFermo||!!x.p.est===ex);const g=it.filter(sel);it=it.filter(x=>!sel(x));const TMAX=480,ch=[];g.slice().sort((a,b)=>minOf(b.p,o)-minOf(a.p,o)).forEach(x=>{const m=minOf(x.p,o),c=ch.find(c=>c.min+m<=TMAX);if(c){c.it.push(x);c.min+=m}else ch.push({it:[x],min:m})});const sib={};const nF=groups.filter(x=>x.i===i).length;ch.forEach(c=>groups.push({i,nF,pr:prioOf(o,i),it:c.it,due:d0,min:c.min,sib,parti:ch.length}))}});
 // prima gli impianti prioritari, poi le zone prioritarie, poi gli altri; a pari priorità la scadenza più vicina
 // equilibrio: giro = n° del fermo sull'impianto; i prioritari possono avere al massimo xPrio passaggi in più degli altri
 const giro=g=>Math.max(0,g.nF-(g.pr<2?Math.max(0,+o.xPrio||0):0));
 groups.sort((a,b)=>giro(a)-giro(b)||a.pr-b.pr||(a.due<b.due?-1:a.due>b.due?1:b.min-a.min));
 const tOrd=t=>{const k=o.turni.indexOf(t);return k<0?99:k};
 groups.forEach(g=>{const from=addD(g.due,-o.tol)<o.da?o.da:addD(g.due,-o.tol),to=addD(g.due,o.tol);let best=null;
  const dedP=pers.filter(x=>x.q.ded.includes(g.i.id));g.dedN=dedP.map(x=>x.ep);
  // impianto dedicato: prima solo le persone dedicate, entro la finestra; se nessuna è libera, tutti gli altri
  for(const PL of dedP.length?[dedP,pers]:[pers]){best=null;
  for(const d of days){if(PL===dedP&&d>to)break;if(d<from)continue;if(g.pr<2){const W=wkC[wkOf(d)],D=dPr[d];if(D&&D.size&&!D.has(g.i.id))continue;if(+o.maxW>0&&W&&!W.has(g.i.id)&&W.size>=+o.maxW)continue}const wd=new Date(d+'T12:00:00').getDay();if(!o.gg.includes(wd)||(!(cntF[d]&&cntF[d].has(g.i.id))&&(cntF[d]?cntF[d].size:0)>=o.maxF))continue;
   for(const x of PL){if(PL!==dedP&&!canImp(x.q,g.i))continue;const t=EPT.work(x.r,d);if(!t||!o.turni.includes(t))continue;if(EPT.sv(x.r,d)&&!svZ.has(g.i.cat))continue;const k=d+'|'+t,u=used[x.ep+'|'+d]||0,nT=cntT[k]||new Set();
    if(!nT.has(x.ep)&&nT.size>=o.maxT)continue;// la % è un'indicazione: un lavoro iniziato si finisce anche se occupa tutto il turno; non se ne aggiunge un altro oltre la quota
    if(u>0&&(u+g.min>x.cap||u+g.min>TMAX))continue;if((usedT[k]||0)+g.min>capTurno(d,t))continue;
    const sc=(d>to?1000:0)+(g.min>x.cap?Math.min(20,(g.min-x.cap)/30):0)+(o.ggPref.includes(wd)?0:40)+tOrd(t)*10+((res.carico[x.ep]||0)/Math.max(x.cap,1))*5+days.indexOf(d)*0.5+(d<g.due?3:0)-(g.sib[d]?6:0);
    if(!best||sc<best.sc)best={sc,d,t,x}}
   if(best&&best.sc<40&&d>=g.due)break}
  if(best)break}
  if(!best){g.it.forEach(x=>res.skip.push({i:g.i,p:x.p,why:!pers.some(y=>canImp(y.q,g.i))?'nessun manutentore abilitato a questo impianto':'nessun manutentore libero nel periodo'}));return}
  const k=best.d+'|'+best.t;(cntT[k]=cntT[k]||new Set()).add(best.x.ep);used[best.x.ep+'|'+best.d]=(used[best.x.ep+'|'+best.d]||0)+g.min;usedT[k]=(usedT[k]||0)+g.min;(cntF[best.d]=cntF[best.d]||new Set()).add(g.i.id);if(g.pr<2){const wk=wkOf(best.d);(wkC[wk]=wkC[wk]||new Set()).add(g.i.id);(dPr[best.d]=dPr[best.d]||new Set()).add(g.i.id)}g.sib[best.d]=1;
  res.carico[best.x.ep]=(res.carico[best.x.ep]||0)+g.min;
  res.vis.push({pr:g.pr,ded:g.dedN.length?(g.dedN.includes(best.x.ep)?1:-1):0,dedN:g.dedN,imp:g.i.id,data:best.d,turno:best.t,man:best.x.ep,min:g.min,due:g.due,late:best.d>g.due,ids:g.it.map(x=>x.s.id)})});
 res.vis.sort((a,b)=>a.data<b.data?-1:a.data>b.data?1:a.turno<b.turno?-1:1);return res}
// --- pianificazioni esistenti nel periodo (da oggi), stessa zona/impianto: per cancellarle e rifare ---
function apEsist(o){const t=tdy(),da=o.da>t?o.da:t,zone=o.cat?catDesc(o.cat):null;const L=[],bloc=[];
 M.vis.forEach(v=>{if(!v.data||v.data<da||v.data>o.a)return;const i=I(v.imp);if(!i)return;if(o.imp?v.imp!==o.imp:zone&&!zone.has(i.cat))return;if(o.soloAuto&&!v.auto)return;
  const aa=M.att.filter(a=>a.vis===v.id);(aa.some(a=>a.chiusa||(a.ok||[]).some(Boolean))?bloc:L).push(v)});return{L,bloc,da}}
// --- maschera parametri ---
function drawAP(){const ov=document.getElementById('mnOvl'),sc=ov&&!ov.hidden?[ov.scrollTop,ov.querySelector('.mn-box')?.scrollTop||0,ov.querySelector('.aptab')?.parentNode.scrollLeft||0]:null;drawAP0();if(sc){const o2=document.getElementById('mnOvl');o2.scrollTop=sc[0];const b=o2.querySelector('.mn-box');if(b)b.scrollTop=sc[1];const t=o2.querySelector('.aptab');if(t)t.parentNode.scrollLeft=sc[2]}}
function drawAP0(){const o=AP.p;if(AP.step==='res')return drawAPres();
 const reps=[...new Set(EPT.rows().filter(isManR).map(r=>r.rep))],rows=EPT.rows().filter(r=>isManR(r)&&(!o.rep||r.rep===o.rep));
 const chk=(v,l,arr)=>`<label class="mn-chk" style="display:inline-flex!important;margin-right:10px"><input type="checkbox" ${o[arr].includes(v)?'checked':''} onchange="MNX.apArr('${arr}',${typeof v==='number'?v:`'${v}'`},this.checked)"> ${l}</label>`;
 const num=(k,l,min,max,s)=>`<label>${l}<input type="number" min="${min}" max="${max}" value="${o[k]}" onchange="MNX.apSet('${k}',+this.value)">${s?`<span class="muted" style="font-size:12px">${s}</span>`:''}</label>`;
 const q_=s=>e_(s).replace(/'/g,"\\'");
 const prow=r=>{const ep=r.ep,q=PPof(o,ep||'');return `<tr><td class="l">${e_(r.n)}</td><td class="l"><select onchange="MNX.apMap('${q_(r.n)}',this.value)"><option value="">— non abbinata —</option>${(S.persone||[]).map(p=>`<option ${p===ep?'selected':''}>${e_(p)}</option>`).join('')}</select></td>
  ${ep?`<td class="c"><input type="number" min="0" max="100" step="5" value="${q.pm}" ${q.off||!q.prev?'disabled':''} onchange="MNX.apPP('${q_(ep)}','pm',+this.value)"><span class="muted"> / ${100-q.pm}</span></td>
  <td class="c"><input type="checkbox" ${q.prev&&!q.off?'checked':''} ${q.off?'disabled':''} onchange="MNX.apPP('${q_(ep)}','prev',this.checked)"></td><td class="l" style="font-size:12px"><button class="btn sm" style="width:100%;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${e_(zoneTxt(q))}" ${q.off||!q.prev?'disabled':''} onclick="MNX.apZ('${q_(ep)}')">${q.zone.length?zTop(q.zone).length+' zone':'Tutti'} ✎</button></td><td class="l" style="font-size:12px"><button class="btn sm" style="width:100%;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${e_(q.ded.map(x=>I(x)).filter(Boolean).map(i=>i.cod).join(', '))}" ${q.off||!q.prev?'disabled':''} onclick="MNX.apD('${q_(ep)}')">${q.ded.length?q.ded.length+' imp.':'—'} ✎</button></td><td class="c"><input type="checkbox" ${q.off?'checked':''} onchange="MNX.apPP('${q_(ep)}','off',this.checked)"></td>`:'<td colspan="5" class="muted">abbina a una persona</td>'}</tr>${ep&&AP.dOpen===ep?`<tr><td colspan="7" style="background:var(--bg);padding:8px 12px"><b>Impianti dedicati a ${e_(ep)}</b> <span class="muted">(quando sono da fare li fa lui/lei, se in turno nella finestra di tolleranza)</span>
  <input type="search" placeholder="Cerca impianto…" style="width:100%;margin:6px 0" oninput="const q=this.value.toLowerCase();this.nextElementSibling.querySelectorAll('[data-q]').forEach(r=>r.hidden=!!q&&!r.dataset.q.includes(q))">
  <div style="max-height:220px;overflow:auto;font-size:13px">${M.imp.filter(i=>!i.dism).sort((a,b)=>(a.cod||'').localeCompare(b.cod||'')).map(i=>`<label class="mn-chk" data-q="${e_((i.cod+' '+i.nome+' '+(catPath(i.cat)||'')).toLowerCase())}"><input type="checkbox" ${q.ded.includes(i.id)?'checked':''} onchange="MNX.apDset('${q_(ep)}','${i.id}',this.checked)"> <span><b>${e_(i.cod)}</b> ${e_(i.nome)} <span class="muted">${e_(catPath(i.cat)||'')}</span></span></label>`).join('')}</div>
  <div class="row" style="justify-content:flex-end;margin-top:4px"><button class="btn sm pri" onclick="MNX.apD('${q_(ep)}')">Fatto</button></div></td></tr>`:''}${ep&&AP.zOpen===ep?`<tr><td colspan="7" style="background:var(--bg);padding:8px 12px"><b>Impianti di ${e_(ep)}</b> <span class="muted">(nessuna zona scelta = tutti gli impianti)</span><div style="columns:2;font-size:13px;margin-top:4px">${zoneTree().map(c=>`<label class="mn-chk" style="padding-left:${c.d*16}px"><input type="checkbox" ${q.zone.includes(c.id)?'checked':''} onchange="MNX.apZset('${q_(ep)}','${c.id}',this.checked)"> ${e_(c.nome)}</label>`).join('')||'<span class="muted">Nessuna zona definita</span>'}</div><div class="row" style="justify-content:flex-end;margin-top:4px"><button class="btn sm" onclick="MNX.apZset('${q_(ep)}','*',false)">Tutti</button><button class="btn sm pri" onclick="MNX.apZ('${q_(ep)}')">Fatto</button></div></td></tr>`:''}`};
 function zoneTree(){const out=[];const walk=(par,d)=>catKids(par).sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(c=>{out.push({id:c.id,nome:c.nome,d});walk(c.id,d+1)});walk(null,0);return out}
 ovl(`<div class="mn-oh"><h2>Pianificazione automatica</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="muted" style="font-size:13px">Scegli i parametri e premi «Simula»: vedi la proposta, poi decidi se confermarla o rifarla. Finché non confermi non viene salvato nulla.</div>
 <div class="mn-step"><b>1 · Manutentori e turni</b>
  <div class="row"><button class="btn" onclick="MNX.syncT()">🔄 Sincronizza turni</button>${tAge()}</div>
  ${EPT.d?`<div class="evf"><label>Reparto<select onchange="MNX.apSet('rep',this.value)">${reps.length>1?'<option value="">Tutti i reparti di manutenzione</option>':''}${reps.map(r=>`<option ${o.rep===r?'selected':''}>${e_(r)}</option>`).join('')}</select></label>
  ${num('pm','% del turno per manutenzione (predefinita)',0,100,'indicativa: il resto è supporto al plant; un lavoro iniziato si finisce anche oltre la quota')}</div>
  <style>.aptab{width:100%;min-width:760px;border-collapse:collapse;table-layout:fixed;font-size:13px}.aptab th{font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);padding:6px 4px;text-align:center;vertical-align:bottom}.aptab th.l,.aptab td.l{text-align:left}.aptab td{padding:6px 4px;border-top:1px solid var(--line);vertical-align:middle}.aptab td.c{text-align:center;white-space:nowrap}.aptab select{width:100%;min-width:0}.aptab select.apsv{width:auto}.aptab input[type=number]{width:56px}.aptab input[type=checkbox]{width:18px;height:18px;margin:0}</style>
  <div style="overflow-x:auto"><table class="aptab"><colgroup><col style="width:17%"><col style="width:20%"><col style="width:14%"><col style="width:10%"><col style="width:14%"><col style="width:14%"><col style="width:11%"></colgroup><thead><tr><th class="l">Turni e ferie</th><th class="l">Persona Ergo Plan</th><th>% manut. / supporto</th><th>Preventiva</th><th class="l">Impianti</th><th class="l">Dedicato a</th><th>Escludi da tutto</th></tr></thead><tbody>${rows.map(prow).join('')||'<tr><td colspan="7" class="muted">Nessuna persona</td></tr>'}</tbody></table></div>
  <div class="muted" style="font-size:12px">Preventiva tolta: la persona non riceve manutenzioni programmate ma resta nel carico come supporto. Escludi da tutto: nessuna attività automatica e fuori dal carico. Impianti: le zone su cui la persona può fare manutenzione (✎ per sceglierle); senza zone, tutti gli impianti. Dedicato a: impianti che, quando sono da fare, vanno a quella persona (se non è in turno entro la tolleranza li fa un altro, segnalato).</div>`:''}
 </div>
 <div class="mn-step"><b>2 · Cosa pianificare</b><div class="evf">
  <label>Dal<input type="date" value="${o.da}" onchange="MNX.apSet('da',this.value)"></label><label>Al<input type="date" value="${o.a}" onchange="MNX.apSet('a',this.value)"></label>
  <label>Impianti (zona)<select onchange="MNX.apSet('cat',this.value)">${catOpts(o.cat,'Tutti gli impianti')}</select></label>
  <label>Solo un impianto<select onchange="MNX.apSet('imp',this.value)"><option value="">— tutti quelli della zona —</option>${M.imp.filter(i=>!i.dism).sort((a,b)=>(a.cod||'').localeCompare(b.cod||'')).map(i=>`<option value="${i.id}" ${o.imp===i.id?'selected':''}>${e_(i.cod+' · '+i.nome)}</option>`).join('')}</select></label>
  ${num('tol','Tolleranza sulla scadenza (± giorni)',0,60,'raggruppa le procedure vicine in un solo fermo')}
  ${num('maxW','Impianti prioritari fermi max a settimana',0,20,'0 = nessun limite; mai due impianti prioritari fermi lo stesso giorno; vale per impianti e zone prioritarie')}
  ${num('xPrio','Passaggi in più per gli impianti prioritari',0,20,'nel periodo: un impianto non torna una volta in più finché gli altri non hanno avuto il loro passaggio; i prioritari possono averne fino a questo numero in più')}
  ${num('minDef','Durata se la procedura non la indica (min)',5,480)}</div>
  <label class="mn-chk"><input type="checkbox" ${o.unFermo?'checked':''} onchange="MNX.apSet('unFermo',this.checked)"> Un solo fermo per macchina: tutte le manutenzioni interne del periodo insieme</label>
  <label class="mn-chk"><input type="checkbox" ${o.est?'checked':''} onchange="MNX.apSet('est',this.checked)"> Includi gli interventi con fornitore esterno</label>
  <details ${AP.prOpen==='x'?'open':''} ontoggle="MNX.apPr('x',this.open)"><summary style="cursor:pointer">Esclusi dal giro: <b id="apXs">${o.excI.length+o.excC.length?o.excI.length+' impianti, '+o.excC.length+' macchine':'nessuno'}</b></summary>
   <div style="font-size:13px;margin-top:6px"><b>Zone intere</b><div style="columns:2;margin-top:4px">${zoneTree().map(c=>{const L=M.imp.filter(i=>!i.dism&&catDesc(c.id).has(i.cat));const on=L.length&&L.every(i=>o.excI.includes(i.id));return `<label class="mn-chk" style="padding-left:${c.d*16}px"><input type="checkbox" ${on?'checked':''} ${L.length?'':'disabled'} onchange="MNX.apXZ('${c.id}',this.checked)"> ${e_(c.nome)} <span class="muted">(${L.length})</span></label>`}).join('')||'<span class="muted">Nessuna zona definita</span>'}</div></div>
   <input type="search" placeholder="Cerca impianto o macchina…" style="width:100%;margin:6px 0" oninput="const q=this.value.toLowerCase();this.nextElementSibling.querySelectorAll('[data-q]').forEach(r=>r.hidden=!!q&&!r.dataset.q.includes(q))">
   <div style="max-height:260px;overflow:auto;font-size:13px">${M.imp.filter(i=>!i.dism).sort((a,b)=>(a.cod||'').localeCompare(b.cod||'')).map(i=>{const ex=o.excI.includes(i.id),k=(i.cod+' '+i.nome+' '+(catPath(i.cat)||'')).toLowerCase();return `<div data-q="${e_(k+' '+(i.comps||[]).map(cNome).join(' ').toLowerCase())}"><label class="mn-chk"><input type="checkbox" ${ex?'checked':''} onchange="MNX.apX('${i.id}','',this.checked,this)"> <span><b>${e_(i.cod)}</b> ${e_(i.nome)} <span class="muted">${e_(catPath(i.cat)||'')}</span></span></label>${(i.comps||[]).map(c=>`<label class="mn-chk" style="padding-left:24px"><input type="checkbox" ${ex||o.excC.includes(i.id+'|'+c.id)?'checked':''} ${ex?'disabled':''} onchange="MNX.apX('${i.id}','${c.id}',this.checked)"> ${e_(cNome(c))}</label>`).join('')}</div>`}).join('')}</div></details>
  <label class="mn-chk"><input type="checkbox" ${o.evt?'checked':''} onchange="MNX.apSet('evt',this.checked)"> Includi le procedure a evento già segnalate</label>
 </div>
 ${(()=>{const E=apEsist(o);return `<div class="mn-step" style="border-left:3px solid var(--accent)"><b>Pianificazioni già presenti</b> <span class="muted" style="font-size:12px">dal ${fd(E.da)} al ${fd(o.a)}, ${o.imp?'impianto '+e_((I(o.imp)||{}).cod||''):o.cat?'zona '+e_(catPath(o.cat)):'tutti gli impianti'}</span>
  <div>${E.L.length} manutenzioni pianificate${E.bloc.length?` · <span class="muted">${E.bloc.length} già iniziate (non si cancellano)</span>`:''}</div>
  <label class="mn-chk"><input type="checkbox" ${o.soloAuto?'checked':''} onchange="MNX.apSet('soloAuto',this.checked)"> Solo quelle create dalla pianificazione automatica</label>
  <div class="row"><button class="btn" style="color:var(--accent)" ${E.L.length?'':'disabled'} onclick="MNX.apDel()">🗑 Cancella queste ${E.L.length} pianificazioni</button><span class="muted" style="font-size:12px">le procedure tornano da pianificare; poi puoi rifare «Simula»</span></div></div>`})()}
 <div class="mn-step"><b>3 · Supporto alla produzione e fermi</b><div class="evf">
  ${num('maxT','Manutentori in programmata per turno (max)',1,10,'gli altri del turno restano su guasti e cambi')}
  ${num('pctT','Ore di manutenzione per turno (% delle ore disponibili)',0,100,'ore disponibili = manutentori in turno × 8 h; il resto resta per guasti, cambi e supporto')}
  ${num('maxF','Impianti fermi per manutenzione al giorno (max)',1,20)}</div>
  <div>Turni utilizzabili <span class="muted" style="font-size:12px">(preferenza: ${o.turni.map(t=>AP_LAB[t]).join(' › ')})</span><br>${AP_WORK.map(t=>chk(t,AP_LAB[t],'turni')).join('')}</div>
  <div>Giorni utilizzabili<br>${[1,2,3,4,5,6,0].map(d=>chk(d,AP_GG[d],'gg')).join('')}</div>
  <div>Giorni preferiti per i fermi <span class="muted" style="font-size:12px">(meno produzione)</span><br>${[1,2,3,4,5,6,0].map(d=>chk(d,AP_GG[d],'ggPref')).join('')}</div>
 </div>
 <div class="mn-step"><b>4 · Priorità</b> <span class="muted" style="font-size:12px">pianificate per prime, quando i manutentori non bastano per tutto</span>
  <details ${AP.prOpen==='z'?'open':''} ontoggle="MNX.apPr('z',this.open)"><summary style="cursor:pointer">Zone prioritarie: <b>${zTop(o.prioZ).length?e_(zTop(o.prioZ).map(z=>catPath(z)).join(', ')):'nessuna'}</b></summary><div style="columns:2;font-size:13px;margin-top:4px">${zoneTree().map(c=>`<label class="mn-chk" style="padding-left:${c.d*16}px"><input type="checkbox" ${o.prioZ.includes(c.id)?'checked':''} onchange="MNX.apPZ('${c.id}',this.checked)"> ${e_(c.nome)}</label>`).join('')||'<span class="muted">Nessuna zona definita</span>'}</div></details>
  <details ${AP.prOpen==='i'?'open':''} ontoggle="MNX.apPr('i',this.open)"><summary style="cursor:pointer">Impianti prioritari: <b id="apPIs">${o.prioI.length?o.prioI.map(id=>I(id)).filter(Boolean).map(i=>e_(i.cod)).join(', '):'nessuno'}</b></summary>
   <input type="search" placeholder="Cerca impianto…" style="width:100%;margin:6px 0" oninput="const q=this.value.toLowerCase();this.nextElementSibling.querySelectorAll('[data-q]').forEach(r=>r.hidden=!!q&&!r.dataset.q.includes(q))">
   <div style="max-height:240px;overflow:auto;font-size:13px">${M.imp.filter(i=>!i.dism).sort((a,b)=>(a.cod||'').localeCompare(b.cod||'')).map(i=>`<label class="mn-chk" data-q="${e_((i.cod+' '+i.nome+' '+(catPath(i.cat)||'')).toLowerCase())}"><input type="checkbox" ${o.prioI.includes(i.id)?'checked':''} onchange="MNX.apPI('${i.id}',this.checked)"> <span><b>${e_(i.cod)}</b> ${e_(i.nome)} <span class="muted">${e_(catPath(i.cat)||'')}</span></span></label>`).join('')}</div></details>
 </div>
 <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn" onclick="MNX.apSave()">Salva parametri</button><button class="btn pri" ${EPT.d?'':'disabled'} onclick="MNX.apRun()">Simula</button></div>`)}
function drawAPres(){const r=AP.res,o=AP.p;const by={};r.vis.forEach(v=>(by[v.data]=by[v.data]||[]).push(v));
 const tot=r.vis.reduce((t,v)=>t+v.ids.length,0),late=r.vis.filter(v=>v.late).length,sk={};r.skip.forEach(x=>(sk[x.why]=sk[x.why]||[]).push(x));
 ovl(`<div class="mn-oh"><h2>Proposta di pianificazione</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="mn-info">${r.vis.length} fermi impianto · ${tot} procedure · dal ${fd(o.da)} al ${fd(o.a)}${late?` · <b style="color:var(--accent)">${late} oltre la scadenza</b>`:''}<br><span class="muted" style="font-size:12px">${o.maxT} per turno in programmata; max ${o.maxF} fermi al giorno. Il carico completo è nella pagina «Carico persone».</span></div>
 <div><b>Manutenzione aggiunta per persona</b><div class="row" style="gap:6px 14px;font-size:13px">${r.pers.map(x=>`<span>${e_(x.ep)} (${PPof(o,x.ep).pm}%): <b>${hh(r.carico[x.ep]||0)}</b></span>`).join('')}</div></div>
 <div class="mn-list">${Object.keys(by).sort().map(d=>`<div style="padding:6px 0;border-top:1px solid var(--line)"><b>${AP_GG[new Date(d+'T12:00:00').getDay()]} ${fd(d)}</b>${by[d].map(v=>{const i=I(v.imp);return `<div style="display:grid;grid-template-columns:90px 1fr auto;gap:8px;font-size:13px;padding:2px 0"><span>${AP_LAB[v.turno]}</span><span>${v.pr<2?'<b style="color:var(--warn)" title="'+(v.pr?'zona':'impianto')+' prioritario">★</b> ':''}${e_(i.cod)} · ${e_(i.nome)} <span class="muted">· ${v.ids.length} proc. · ${v.min} min · scad. ${fd(v.due)}</span>${v.late?' <span style="color:var(--accent)">dopo la scadenza</span>':''}${v.ded<0?' <span style="color:var(--accent)">dedicato a '+e_(v.dedN.join(', '))+' (non disponibile)</span>':''}</span><span>${v.ded>0?'👤 ':''}${e_(v.man)}</span></div>`}).join('')}</div>`).join('')||'<div class="mn-empty muted">Niente da pianificare con questi parametri</div>'}</div>
 ${r.skip.length?`<details><summary style="cursor:pointer;color:var(--accent)">${r.skip.length} procedure non pianificate</summary><div style="font-size:13px">${Object.entries(sk).map(([k,l])=>`<div style="margin-top:6px"><b>${e_(k)}</b> (${l.length})<br><span class="muted">${l.slice(0,40).map(x=>e_(x.i.cod+' '+x.p.cod)).join(', ')}${l.length>40?'…':''}</span></div>`).join('')}</div></details>`:''}
 <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.apBack()">↺ Rifai con altri parametri</button><button class="btn pri" ${r.vis.length?'':'disabled'} onclick="MNX.apOk()">Conferma e pianifica</button></div>`)}
const hh=m=>(Math.round(m/6)/10).toString().replace('.',',')+' h';
// --- anomalie: manutenzioni pianificate con persona non in turno ---
function anomalie(){if(!EPT.d)return[];const t=tdy();return M.vis.filter(v=>v.data>=t&&v.man).map(v=>{const r=EPT.row(v.man);if(!r||EPT.idx(v.data)<0)return null;
 if(!M.att.some(a=>a.vis===v.id&&!a.chiusa))return null;const w=EPT.work(r,v.data);if(w&&(!v.turno||v.turno===w))return null;
 return{v,why:w?'in turno '+AP_LAB[w]+' invece di '+AP_LAB[v.turno]:(EPT.abs(r,v.data)||'riposo')}}).filter(Boolean)}
function anomH(){const L=anomalie();if(!L.length)return'';return `<div class="mn-info" style="border-left-color:var(--accent)"><b>${L.length} manutenzioni con il manutentore non disponibile</b>${L.slice(0,15).map(x=>{const i=I(x.v.imp);return `<div style="font-size:13px;cursor:pointer" onclick="MNX.visDett('${x.v.id}')">${fd(x.v.data)} · ${e_(i?i.cod+' '+i.nome:'')} · ${e_(x.v.man)}: <b>${e_(x.why)}</b></div>`}).join('')}${L.length>15?'<div class="muted">…</div>':''}</div>`}
// --- pagina «Carico persone» ---
async function vCar(){if(!isR())return '<div class="panel muted">Pagina riservata al responsabile della manutenzione.</div>';await EPT.load();
 const o=apDef(),t=tdy();MN.car=MN.car||{da:t,sett:8};const C=MN.car;const lun=d=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()-((x.getDay()+6)%7));return isoL(x)};
 const w0=lun(C.da),W=[...Array(C.sett)].map((_,k)=>addD(w0,k*7));
 const rows=repRows(o).filter(r=>!PPof(o,r.ep).off);
 const cell=(r,w)=>{let ore=0,man=0,ass=0;for(let k=0;k<7;k++){const d=addD(w,k);if(EPT.work(r,d))ore+=8;else if(EPT.abs(r,d))ass++}
  M.att.forEach(a=>{if(a.due&&!a.chiusa&&a.due>=w&&a.due<=addD(w,6)&&sameP(a.man,r.ep))man+=minOf(PA(a)||{},o)/60});
  const q=PPof(o,r.ep),tg=ore*q.pm/100,pc=ore?Math.round(man/ore*100):0,col=!ore?'var(--off)':man>tg*1.1?'var(--accent)':man<tg*0.5&&q.prev?'var(--warn)':'var(--ok)';
  return `<td style="padding:4px 6px;border-left:1px solid var(--line);font-size:12px;white-space:nowrap"><div><b style="color:${col}">${String(Math.round(man*10)/10).replace('.',',')} h</b> manut.</div><div class="muted">${String(Math.round((ore-man)*10)/10).replace('.',',')} h supporto</div><div class="muted">${ore} h turno · ${pc}%${ass?` · <span style="color:var(--accent)">${ass} gg assente</span>`:''}</div></td>`};
 return `<div class="row" style="margin-bottom:10px"><button class="btn" onclick="MNX.syncT()">🔄 Sincronizza turni</button>${tAge()}</div>
 <div class="row" style="margin-bottom:10px"><label>Dalla settimana del <input type="date" value="${C.da}" onchange="MNX.car('da',this.value)"></label><label>Settimane <input type="number" min="1" max="26" value="${C.sett}" style="width:60px" onchange="MNX.car('sett',+this.value)"></label><span class="muted" style="font-size:12px">Reparto: ${e_(o.rep||'manutenzione')} · obiettivo per persona dai parametri della pianificazione automatica</span></div>
 ${!EPT.d?'<div class="mn-empty muted">Sincronizza i turni per vedere il carico.</div>':`<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%"><thead><tr><th style="text-align:left;padding:4px 6px">Persona</th>${W.map(w=>`<th style="padding:4px 6px;font-size:12px;border-left:1px solid var(--line)">${fd(w).slice(0,5)}</th>`).join('')}</tr></thead>
 <tbody>${rows.map(r=>{const q=PPof(o,r.ep);return `<tr style="border-top:1px solid var(--line)"><td style="padding:4px 6px"><b>${e_(r.ep)}</b><div class="muted" style="font-size:12px">${q.prev?q.pm+'% manut. / '+(100-q.pm)+'% supporto':'solo supporto'}${q.zone.length?' · '+e_(zoneTxt(q)):''}</div></td>${W.map(w=>cell(r,w)).join('')}</tr>`}).join('')||`<tr><td class="muted">Nessuna persona</td></tr>`}</tbody></table></div>
 <div class="muted" style="font-size:12px;margin-top:6px">Ore turno = giorni lavorati × 8 h. Manutenzione = durata delle procedure pianificate nella settimana. Supporto = il resto (guasti, cambi modello, produzione). Rosso: oltre l'obiettivo; giallo: meno della metà.</div>`}`}
const APX={
 async auto(){AP.p=apDef();AP.step='par';AP.res=null;AP.zOpen=null;await EPT.load(true);drawAP0()},
 syncT(){return syncTurni()},
 apSet(k,v){AP.p[k]=v;drawAP()},
 apArr(k,v,on){const l=AP.p[k].filter(x=>x!==v);if(on)l.push(v);if(k==='turni')l.sort((a,b)=>AP_WORK.indexOf(a)-AP_WORK.indexOf(b));AP.p[k]=l;drawAP()},
 apMap(n,v){AP.p.map={...AP.p.map,[n]:v};drawAP()},
 apX(i,c,on,el){const o=AP.p;if(c){const k=i+'|'+c;o.excC=o.excC.filter(x=>x!==k);if(on)o.excC.push(k)}else{o.excI=o.excI.filter(x=>x!==i);if(on)o.excI.push(i);const d=el&&el.closest('[data-q]');if(d)d.querySelectorAll('label+label input').forEach(x=>{x.disabled=on;if(on)x.checked=true;else x.checked=o.excC.includes(i+'|'+x.getAttribute('onchange').split("'")[3])})}
  const b=document.getElementById('apXs');if(b)b.textContent=o.excI.length+o.excC.length?o.excI.length+' impianti, '+o.excC.length+' macchine':'nessuno'},
 apDel(){const o=AP.p,E=apEsist(o);if(!E.L.length)return;if(MN.old||MN.noProc)return mt('Dati non modificabili ora: riprova');
  if(!confirm('Cancellare '+E.L.length+' manutenzioni pianificate dal '+fd(E.da)+' al '+fd(o.a)+'?\n\nLe procedure tornano da pianificare (le eventuali chiusure già fatte non vengono toccate).'))return;
  const ids=new Set(E.L.map(v=>v.id));M.att.filter(a=>ids.has(a.vis)).forEach(a=>LOG('Annullata',a,'manutenzione del '+fd(a.due)+' annullata · cancellazione pianificazione'));
  M.att=M.att.filter(a=>!ids.has(a.vis));M.vis=M.vis.filter(v=>!ids.has(v.id));saveM();mt('Cancellate '+E.L.length+' pianificazioni');drawAP()},
 apPr(k,on){if(on)AP.prOpen=k;else if(AP.prOpen===k)AP.prOpen=null},
 apXZ(id,on){const o=AP.p,ids=M.imp.filter(i=>!i.dism&&catDesc(id).has(i.cat)).map(i=>i.id);o.excI=o.excI.filter(x=>!ids.includes(x));if(on)o.excI.push(...ids);AP.prOpen='x';drawAP()},
 apPZ(id,on){const fam=[...catDesc(id)];let z=AP.p.prioZ.filter(y=>!fam.includes(y));if(on)z.push(...fam);else{let c=CAT(id);while(c&&c.par){const p_=c.par;z=z.filter(y=>y!==p_);c=CAT(p_)}}AP.p.prioZ=z;drawAP()},
 apPI(id,on){const l=AP.p.prioI.filter(x=>x!==id);if(on)l.push(id);AP.p.prioI=l;const s=document.getElementById('apPIs');if(s){s.textContent=l.length?l.map(x=>I(x)).filter(Boolean).map(i=>i.cod).join(', '):'nessuno'}else drawAP()},
 apD(ep){AP.dOpen=AP.dOpen===ep?null:ep;AP.zOpen=null;drawAP()},
 apDset(ep,id,on){const pp={...AP.p.pp},x={...(pp[ep]||{})};const l=(Array.isArray(x.ded)?x.ded:[]).filter(y=>y!==id);if(on)l.push(id);x.ded=l;pp[ep]=x;AP.p.pp=pp;
  const b=document.querySelector(`[onclick="MNX.apD('${ep.replace(/'/g,"\\'")}')"]`);if(b)b.textContent=(l.length?l.length+' imp.':'—')+' ✎'},
 apZ(ep){AP.dOpen=null;AP.zOpen=AP.zOpen===ep?null:ep;drawAP()},
 apZset(ep,id,on){const pp={...AP.p.pp},x={...(pp[ep]||{})};const fam=id==='*'?[]:[...catDesc(id)];let z=Array.isArray(x.zone)?x.zone.filter(y=>!fam.includes(y)):[];if(id==='*')z=[];else if(on)z.push(...fam);else{let c=CAT(id);while(c&&c.par){const p_=c.par;z=z.filter(y=>y!==p_);c=CAT(p_)}}x.zone=z;pp[ep]=x;AP.p.pp=pp;drawAP()},
 apPP(ep,k,v){const pp={...AP.p.pp},x={...(pp[ep]||{})};x[k]=v;pp[ep]=x;AP.p.pp=pp;drawAP()},
 apSave(){M.autoP=JSON.parse(JSON.stringify(AP.p));saveM();mt('Parametri salvati')},
 apRun(){const o=AP.p;if(!EPT.d)return mt('Sincronizza prima i turni');if(o.a<o.da)return mt('Il periodo non è valido');if(!o.turni.length||!o.gg.length)return mt('Scegli almeno un turno e un giorno');
  const r=apSim(o);if(!r.pers.length)return mt('Nessun manutentore disponibile per la preventiva');AP.res=r;AP.step='res';drawAP0()},
 apBack(){AP.step='par';drawAP0()},
 apOk(){const r=AP.res;if(!r||!r.vis.length)return;if(MN.old||MN.noProc)return mt('Dati non modificabili ora: riprova');let n=0,f=0;
  r.vis.forEach(x=>{const i=I(x.imp);if(!i||i.dism)return;const ss=M.ass.filter(s=>x.ids.includes(s.id)&&!planned(s));if(!ss.length)return;
   const v={id:nid('v'),imp:x.imp,data:x.data,man:x.man,turno:x.turno,auto:true};M.vis.push(v);f++;
   ss.forEach(s=>{const p0=pend(s);let a;if(p0){p0.due=x.data;p0.vis=v.id;p0.man=x.man;a=p0}else a=newAtt(s,x.data,v.id,x.man);s.man=x.man;LOG(p0?'Ripianificata':'Pianificata',a,'il '+fd(x.data)+' ('+AP_LAB[x.turno]+') a '+x.man+' · pianificazione automatica');n++});
   if(!i.avviato)i.avviato=x.data});
  M.autoP=JSON.parse(JSON.stringify(AP.p));saveM();closeO();mt('Pianificati '+f+' fermi con '+n+' procedure')},
 car(k,v){MN.car[k]=v;draw()}
};
window.MNX={
 // --- eliminazioni dalla pianificazione
 elimina(id){const a=M.att.find(x=>x.id===id);if(!a)return;const p=PA(a),s0=a.ass&&M.ass.find(x=>x.id===a.ass),pp=s0&&P(s0.proc);
  ovl(`<div class="mn-oh"><h2>Eliminare l'attività?</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div><b>${e_(p.cod)} · ${e_(p.desc)}</b><div class="muted">${INOME(a)?e_(INOME(a))+' · ':''}${a.due?fd(a.due):'da ripianificare'} · 👤 ${e_(a.man||'senza nome')}</div></div>
  <div class="muted" style="font-size:13px">L'attività viene tolta da calendario, liste e persone, con passi spuntati, foto e note.</div>
  ${pp&&pp.tipo!=='evento'?`<label class="mn-chk"><input type="checkbox" id="mnElSk" checked> <span>Salta anche questa scadenza: la procedura tornerà da pianificare tra ${pp.int} mesi (${fd(addM(tdy(),pp.int))}). Se togli la spunta torna subito in «Da pianificare».</span></label>`:''}
  <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" style="background:#b4235a;border-color:#b4235a" onclick="MNX.eliminaOk('${id}')">Elimina</button></div>`)},
 eliminaOk(id){const a=M.att.find(x=>x.id===id);if(!a)return closeO();const sk=document.getElementById('mnElSk');const s0=a.ass&&M.ass.find(x=>x.id===a.ass);
  LOG('Eliminata',a,(a.due?'era pianificata il '+fd(a.due):'era da ripianificare')+(a.man?' (di '+a.man+')':'')+(sk&&sk.checked?' · scadenza saltata':''));
  if(s0&&sk&&sk.checked)skipAss(s0);
  (a.foto||[]).flat().forEach(f=>window.FBM.delBlob&&window.FBM.delBlob('manutFoto',f).catch(()=>{}));
  M.att=M.att.filter(x=>x.id!==id);if(a.vis&&!M.att.some(x=>x.vis===a.vis))M.vis=M.vis.filter(v=>v.id!==a.vis);
  M.ric=(M.ric||[]).filter(r=>r.att!==id||r.buy||r.tipo==='nota');saveM();closeO();mt('Attività eliminata')},
 salta(imp){const i=I(imp),st=impStatus(imp);const l=M.ass.filter(s=>s.imp===imp&&!planned(s)&&!pend(s)&&(st.mai||['r','g'].includes(assStatus(s)[2])));
  if(!l.length)return mt('Nessuna procedura da pianificare su questo impianto');
  ovl(`<div class="mn-oh"><h2>Eliminare da «Da pianificare»</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div><b>${e_(i.cod)} · ${e_(i.nome)}</b></div>
  <div class="muted" style="font-size:13px">Le procedure scelte saltano questa scadenza: tornano da pianificare alla prossima (procedure «a evento»: al prossimo evento registrato). Le procedure restano sui componenti.</div>
  <div class="mn-checks">${l.map(s=>{const p=P(s.proc);return `<label class="mn-chk"><input type="checkbox" data-sk="${s.id}" checked> <span>${e_(p.cod)} · ${e_(p.desc)}${CMP(s)?' · '+e_(CMP(s)):''} <span class="muted">(${p.tipo==='evento'?'a evento':'prossima: '+fd(addM(tdy(),p.int))})</span></span></label>`}).join('')}</div>
  <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" style="background:#b4235a;border-color:#b4235a" onclick="MNX.saltaOk('${imp}')">Elimina le scelte</button></div>`)},
 saltaOk(imp){const ids=[...document.querySelectorAll('[data-sk]')].filter(x=>x.checked).map(x=>x.dataset.sk);if(!ids.length)return closeO();const i=I(imp);
  ids.forEach(id=>{const s=M.ass.find(x=>x.id===id);if(!s)return;skipAss(s);const p=P(s.proc);(M.log=M.log||[]).push({t:new Date().toISOString().slice(0,16).replace('T',' '),chi:me()||'sistema',az:'Saltata',att:null,imp,cod:p.cod+' '+p.desc,man:null,txt:'scadenza eliminata da «Da pianificare»'})});
  if(i&&!i.avviato)i.avviato=tdy();saveM();closeO();mt(ids.length+' procedure tolte da «Da pianificare»')},
 async elFatta(y,id){const arr=await storico(y,true),c=arr.find(x=>x.id===id);if(!c)return mt('Intervento non trovato');
  ovl(`<div class="mn-oh"><h2>Eliminare l'intervento fatto?</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div><b>${e_(c._pcod)} · ${e_(c._pdesc)}</b><div class="muted">${fd(c.chiusa)}${c._imp?' · '+e_(c._imp):''} · 👤 ${e_(c.esec)}</div></div>
  <div class="muted" style="font-size:13px">L'intervento sparisce dallo storico e dalle «Fatte». La procedura torna alla scadenza che aveva prima di questa chiusura.</div>
  <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" style="background:#b4235a;border-color:#b4235a" onclick="MNX.elFattaOk('${y}','${id}')">Elimina</button></div>`)},
 async elFattaOk(y,id){const arr=await storico(y,true),c=arr.find(x=>x.id===id);if(!c)return closeO();
  try{H[y]=arr.filter(x=>x.id!==id);await saveYm(y)}catch(er){return mt('Non eliminato: '+FB.err(er))}
  const s0=c.ass&&M.ass.find(x=>x.id===c.ass);if(s0&&c._prev&&s0.last===c.chiusa)Object.assign(s0,c._prev);
  M.fatte=(M.fatte||[]).filter(x=>x.id!==id);(M.log=M.log||[]).push({t:new Date().toISOString().slice(0,16).replace('T',' '),chi:me()||'sistema',az:'Eliminata',att:id,imp:c.imp||null,cod:(c._pcod||'')+' '+(c._pdesc||''),man:c.man||null,txt:'intervento fatto il '+fd(c.chiusa)+' eliminato dallo storico'});
  saveM();closeO();mt('Intervento eliminato')},
 async diag(){const sz=o=>Math.round(new Blob([JSON.stringify(o||{})]).size/1024)+' KB';const {proc,...rest}=M;
  const mans={};M.att.filter(a=>a.due).forEach(a=>{const k=a.man||'(senza nome)';mans[k]=(mans[k]||0)+1});
  let srv='—';try{const d=await window.FBM.getMain();const l=(d&&d.att||[]).filter(a=>a.due);const sm={};l.forEach(a=>{const k=a.man||'(senza nome)';sm[k]=(sm[k]||0)+1});srv=`${sz(d)} · ${l.length} attività pianificate<br>${Object.entries(sm).map(([k,v])=>e_(k)+': '+v).join('<br>')||'nessuna'}`}catch(er){srv='lettura non riuscita: '+e_(FB.err(er))}
  ovl(`<div class="mn-oh"><h2>Diagnostica manutenzione</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
  <div class="mn-step" style="font-size:13px;line-height:1.6"><b>Versione:</b> ${e_(myV())} · <b>Utente:</b> «${e_(me())}» · <b>Responsabile manutenzione:</b> ${isR()?'sì':'no'}<br>
  <b>Dati principali in memoria:</b> ${sz(rest)} (limite 1024 KB) · <b>Procedure:</b> ${sz({proc})} (${M.proc.length}) ${MN.procErr?' · errore: '+e_(MN.procErr):''}<br>
  <b>Documenti impianti:</b> ${M.imp.reduce((n,i)=>n+(i.docs||[]).length,0)} · ${Math.round(M.imp.reduce((n,i)=>n+(i.docs||[]).reduce((m,d)=>m+(d.size||0),0),0)/1024)} KB · <b>Documenti procedure:</b> ${docList().length} · ${Math.round(docList().reduce((m,d)=>m+(d.size||0),0)/1024)} KB (spazio Firebase gratuito 1 GB)<br>
  <b>Ultimo salvataggio:</b> ${MN.sv?`${MN.sv.t} · ${Math.round(MN.sv.b/1024)} KB · ${e_(MN.sv.st)}`:'nessuno da questa apertura'}<br>
  <b>Attività pianificate qui:</b> ${M.att.filter(a=>a.due).length}<br>${Object.entries(mans).map(([k,v])=>'«'+e_(k)+'»: '+v).join('<br>')}<br>
  <b>Sul server adesso:</b> ${srv}</div><div class="muted" style="font-size:12px">Fai uno screenshot di questa finestra (sul tuo PC e sul telefono del manutentore).</div>`)},
 f(k,v){MN.f[k]=v;draw()},pz(v){MN.pz=v||'';draw()},sortI(v){MN.sortI=v;draw()},q(v){MN.f.q=v;MN.focus='mnQ';draw()},reset(){MN.f={imp:'',stato:'',man:'',proc:'',q:'',da:'',a:''};draw()},
 anno(v){MN.anno=v;draw()},close:closeO,impDett,
 catAdd(par){const c={id:nid('k'),nome:par?'Nuovo sotto-livello':'Nuovo livello',par:par||null};M.cat.push(c);saveM();draw();setTimeout(()=>{const x=[...document.querySelectorAll('.mn-catr input')].find(e=>e.value===c.nome);if(x){x.focus();x.select()}},30)},
 catRen(id,v){if(v.trim()){CAT(id).nome=v.trim();saveM()}},
 catDel(id){M.cat=M.cat.filter(c=>c.id!==id);saveM();draw()},
 newLib(){ovl(`<div class="mn-oh"><h2>Altra attività</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
 <div class="muted" style="font-size:13px">Riparazioni, messe a punto o lavori fuori dal piano di manutenzione. L'impianto è facoltativo.</div>
 <div class="evf"><label>Titolo<input id="mnLT" placeholder="es. Riparazione porta sezionale"></label><label>Data<input type="date" id="mnLD" value="${tdy()}"></label><label>Assegnata a<select id="mnLM"><option value="">Da assegnare</option>${PERS().map(p=>`<option>${e_(p)}</option>`).join('')}</select></label><label>Impianto (facoltativo)<select id="mnLI"><option value="">— nessuno —</option>${M.imp.map(i=>`<option value="${i.id}">${e_(i.cod)} · ${e_(i.nome)}</option>`).join('')}</select></label></div>
 <div class="evf"><label>Descrizione<textarea id="mnLX" rows="3" placeholder="Cosa c'è da fare"></textarea></label></div>
 <div class="evf"><label>Passi da confermare (facoltativi, uno per riga)<textarea id="mnLS" rows="3"></textarea></label></div>
 <label class="mn-chk"><input type="checkbox" id="mnLF"> Richiedi una foto del lavoro eseguito</label>
 <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.newLibOk()">Crea attività</button></div>`)},
 newLibOk(){const g=k=>document.getElementById(k).value.trim();const t=g('mnLT');if(!t)return mt('Scrivi il titolo');
  let steps=g('mnLS').split('\n').map(x=>x.trim()).filter(Boolean).map(x=>({t:x,foto:false}));if(!steps.length)steps=[{t:'Lavoro eseguito',foto:false}];if(document.getElementById('mnLF').checked)steps.push({t:'Foto del lavoro eseguito',foto:true});
  const a={id:nid('a'),vis:null,ass:null,imp:g('mnLI')||null,comp:null,proc:null,free:{titolo:t,desc:g('mnLX'),steps},due:g('mnLD')||tdy(),man:g('mnLM')||null,ok:steps.map(()=>false),foto:steps.map(()=>[]),note:''};
  M.att.push(a);LOG('Creata',a,'il '+fd(a.due)+(a.man?' a '+a.man:' senza nome'));saveM();closeO();mt('Attività creata'+(a.man?' e assegnata a '+a.man:''))},
 // --- Intervento non programmato (v2.11.0)
 np(imp){const i0=imp&&I(imp);MN.np={imp:imp||'',el:'',data:tdy(),caus:'',ass:'',desc:'',ric:[],ore:'',oreImp:'',oreEl:''};drawNP()},
 npSet(k,v){const n=MN.np;n[k]=v;if(k==='imp'){n.ass='';n.el='';n.oreEl=''}if(k==='el'){n.ass='';n.oreEl=''}if(k==='imp'||k==='caus'||k==='el')drawNP()},
 npComp(id,v){MN.np.comp[id]=v},
 npRic(k,f,v){if(k<0){MN.np.ric.push({cod:'',desc:'',q:1});return drawNP()}if(f==='del'){MN.np.ric.splice(k,1);return drawNP()}MN.np.ric[k][f]=v},
 npOk(conf){const n=MN.np,i=I(n.imp),num=x=>x===''||x==null?null:Number(String(x).replace(',','.'));
  if(!i)return mt('Scegli l\'impianto');if(!n.caus)return mt('Scegli la causale');
  const ore=num(n.ore);if(ore==null||isNaN(ore))return mt('Scrivi le ore impiegate');if(ore<0.5)return mt('Ore impiegate: minimo 0,5');
  const prev=MN.npS=n.caus===NPC[0]&&n.ass?M.ass.find(s=>s.id===n.ass):null;if(n.caus===NPC[0]&&!prev)return mt('Scegli la manutenzione preventiva');
  const oi=num(n.oreImp);if(oi!=null&&(isNaN(oi)||oi<0))return mt('Ore impianto non valide');
  const R=isR()||(typeof isAdm_==='function'&&isAdm_())||(typeof isResp==='function'&&isResp());
  if(oi!=null&&i.oreImp!=null&&oi<i.oreImp&&!R)return mt('Ore impianto inferiori alle precedenti ('+i.oreImp+'): può inserirle solo il responsabile o l\'admin');
  {const v=num(n.oreEl);if(v!=null&&(isNaN(v)||v<0))return mt('Ore elemento non valide')}
  const ric=n.ric.filter(r=>(r.cod||'').trim()||(r.desc||'').trim());if(ric.some(r=>!(r.desc||'').trim()))return mt('Ricambi: scrivi la descrizione');if(ric.some(r=>!(Number(r.q)>0)))return mt('Ricambi: quantità non valida');
  if(prev&&!conf){const p=P(prev.proc),nx=p.tipo==='evento'?null:addM(n.data,p.int);
   return ovl(`<div class="mn-oh"><h2>Confermi?</h2><button class="btn" onclick="MNX.npBack()" aria-label="Chiudi">✕</button></div><div><b>${e_(p.cod)} · ${e_(p.desc)}</b>${CMP(prev)?' · '+e_(CMP(prev)):''}</div><div class="muted" style="font-size:13px">La preventiva viene segnata come eseguita il ${fd(n.data)} e ${nx?'ripianificata dal '+fd(nx):'resta in attesa del prossimo evento'}.${M.att.some(a=>a.ass===prev.id)?' L\'attività già aperta per questa procedura viene tolta.':''}</div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.npBack()">Indietro</button><button class="btn pri" onclick="MNX.npSave()">Conferma</button></div>`)}
  MNX.npSave()},
 npBack(){drawNP()},
 async npSave(){if(MN.npBusy)return;MN.npBusy=1;try{await MNX.npSave0()}finally{MN.npBusy=0}},
 async npSave0(){const n=MN.np,i=I(n.imp),num=x=>x===''||x==null?null:Number(String(x).replace(',','.'));const s=n.caus===NPC[0]&&n.ass?M.ass.find(x=>x.id===n.ass):null,p=s&&P(s.proc);
  const ore=num(n.ore),oi=num(n.oreImp),pOi=i.oreImp!=null?i.oreImp:null;
  const ric=n.ric.filter(r=>(r.cod||'').trim()||(r.desc||'').trim()).map(r=>({cod:(r.cod||'').trim(),desc:r.desc.trim(),q:Number(r.q)}));
  const compOre={},oe=num(n.oreEl);if(n.el&&oe!=null)compOre[n.el]=oe;
  const c={id:nid('a'),np:1,caus:n.caus,vis:null,ass:s?s.id:null,imp:i.id,comp:s?s.comp:(n.el||null),proc:s?s.proc:null,due:n.data,man:me(),ok:[],foto:[],note:n.desc,chiusa:n.data,esec:me(),parziale:0,ore,ric,oreImp:oi,oreImpPrec:pOi,compOre,oreEl:n.el&&oe!=null?oe:null,
   _imp:i.cod+' '+i.nome,_cmp:s?CMP(s):(n.el?((i.comps||[]).find(x=>x.id===n.el)||{}).sigla||'':''),_pcod:'Non programmato',_pdesc:n.caus+(p?' · '+p.cod+' '+p.desc:''),_free:{titolo:n.caus,desc:n.desc},_steps:[]};
  const y=n.data.slice(0,4);
  try{const arr=await storico(y,true);arr.push(c);await saveYm(y)}catch(er){return mt('Intervento NON salvato: '+FB.err(er))}
  if(!(M.anni||[]).includes(y))(M.anni=M.anni||[]).push(y);
  // ore impianto ed elementi
  const d=oi!=null&&pOi!=null?oi-pOi:0;
  (i.comps||[]).forEach(cp=>{if(compOre[cp.id]!=null)cp.ore=compOre[cp.id];else if(oi!=null)cp.ore=cp.ore!=null?Math.round((cp.ore+d)*10)/10:oi});
  if(oi!=null){i.oreImp=oi;i.oreImpD=n.data}
  if(s){c._prev={last:s.last,next:s.next,evt:s.evt,incompleto:s.incompleto||null};const me_=H[y].find(x=>x.id===c.id);if(me_){me_._prev=c._prev;saveYm(y).catch(()=>{})}
   s.last=n.data;s.incompleto=null;if(p.tipo==='evento')s.evt=false;else s.next=addM(n.data,p.int);
   const op=M.att.filter(a=>a.ass===s.id);M.att=M.att.filter(a=>a.ass!==s.id);op.forEach(a=>{if(a.vis&&!M.att.some(x=>x.vis===a.vis))M.vis=M.vis.filter(v=>v.id!==a.vis)})}
  (M.fatte=M.fatte||[]).push({id:c.id,y,imp:i.id,man:me(),esec:me(),chiusa:n.data,parziale:0,cod:c._pcod,desc:c._pdesc,cmp:c._cmp,np:1,caus:n.caus,ore});
  LOG('Non programmato',c,n.caus+' · '+String(ore).replace('.',',')+' h'+(oi!=null?' · ore impianto '+oi:'')+' · da '+me());
  saveM();closeO();mt('✓ Intervento registrato'+(s?' · preventiva ripianificata'+(s.next&&p.tipo!=='evento'?' dal '+fd(s.next):''):''))},
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
 rip(id){const a=M.att.find(x=>x.id===id),p=PA(a);ovl(`<div class="mn-oh"><h2>Ripianifica</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div><b>${e_(p.cod)} · ${e_(p.desc)}</b><div class="muted">${e_(INOME(a))}</div></div><div class="mn-checks">${p.steps.map(x=>`<div class="mn-chk">• <span>${e_(x.t)}</span></div>`).join('')}</div>
  <div class="evf"><label>Data<input type="date" id="mnRpD" value="${tdy()}"></label><label>Manutentore<select id="mnRpM"><option value="">Senza nome (da assegnare)</option>${PERS().map(n=>`<option>${e_(n)}</option>`).join('')}</select></label></div>
  <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.ripOk('${id}')">Ripianifica</button></div>`)},
 ripOk(id){const a=M.att.find(x=>x.id===id);a.due=document.getElementById('mnRpD').value||tdy();a.man=document.getElementById('mnRpM').value||null;const v={id:nid('v'),imp:a.imp||null,data:a.due,man:a.man,tit:a.free?a.free.titolo:null};M.vis.push(v);a.vis=v.id;LOG('Ripianificata',a,'il '+fd(a.due)+(a.man?' a '+a.man:' senza nome'));saveM();closeO();mt('Ripianificata il '+fd(a.due))},
 box(k){MN.box=k;draw()},
 togliFatta(id){M.fatte=M.fatte.filter(x=>x.id!==id);saveM();refresh()},
 togliFatte(p){const n=M.fatte.filter(x=>(x.man||'')===p).length;M.fatte=M.fatte.filter(x=>(x.man||'')!==p);saveM();refresh();mt(n+' completate tolte dalla lista (restano nello storico)')},
 togli(id){const a=M.att.find(x=>x.id===id);ovl(`<div class="mn-oh"><h2>Togliere l'attività?</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div>${e_(PA(a).cod)} · ${e_(PA(a).desc)} <div class="muted">${fd(a.due)} · 👤 ${e_(a.man||'senza nome')}</div></div><div class="muted" style="font-size:13px">Esce dal calendario e dalla lista della persona e va in «Da ripianificare». Passi, foto e note restano.</div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.esegui('${id}')">Annulla</button><button class="btn pri" onclick="MNX.togliOk('${id}')">Togli</button></div>`)},
 togliOk(id){const a=M.att.find(x=>x.id===id);LOG('Tolta',a,'tolta dal '+fd(a.due)+(a.man?' e da '+a.man:'')+': da ripianificare');a.due=null;const ov=a.vis;a.vis=null;if(ov&&!M.att.some(x=>x.vis===ov))M.vis=M.vis.filter(v=>v.id!==ov);saveM();closeO();mt('Attività tolta: è in Da ripianificare')},
 async riapri(y,id){await storico(y);const arr=H[y]||[],c=arr.find(x=>x.id===id);if(!c)return;if(c.np)return mt('Intervento non programmato: non si riapre (si può eliminare)');const p=c._steps?{desc:c._pdesc,cod:c._pcod}:PA(c);
  ovl(`<div class="mn-oh"><h2>Riaprire l'attività?</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div><b>${e_(p.cod)} · ${e_(p.desc)}</b><div class="muted">${c._imp?e_(c._imp)+' · ':''}chiusa il ${fd(c.chiusa)} da ${e_(c.esec)}</div></div>
  <div class="muted" style="font-size:13px">Torna tra le attività da fare con i passi già spuntati, le foto e le note. Lo scadenziario della procedura torna com'era prima della chiusura.</div>
  <div class="evf"><label>Nuova data<input type="date" id="mnRoD" value="${tdy()}"></label><label>Manutentore<select id="mnRoM"><option value="">Senza nome</option>${PERS().map(n=>`<option ${n===c.esec?'selected':''}>${e_(n)}</option>`).join('')}</select></label></div>
  <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.riapriOk('${y}','${id}')">Riapri</button></div>`)},
 async riapriOk(y,id){const arr=H[y]||[],c=arr.find(x=>x.id===id);if(!c)return;const d=document.getElementById('mnRoD').value||tdy(),m=document.getElementById('mnRoM').value||null;
  const s0=M.ass.find(x=>x.id===c.ass);if(s0&&c._prev)Object.assign(s0,c._prev);
  const a={id:c.id,vis:null,ass:c.ass,imp:c.imp,comp:c.comp,proc:c.proc,free:c.free||c._free||null,sub:c.sub||null,due:d,man:m,ok:c.ok,foto:c.foto,note:c.note||'',riaperta:tdy()};
  if(a.free&&!a.free.steps&&c._steps)a.free.steps=c._steps;
  const v={id:nid('v'),imp:a.imp||null,data:d,man:m,tit:a.free?a.free.titolo:null};M.vis.push(v);a.vis=v.id;
  try{H[y]=arr.filter(x=>x.id!==id);await saveYm(y)}catch(er){return mt('Non riaperta: '+FB.err(er))}
  M.fatte=(M.fatte||[]).filter(x=>x.id!==id);M.att.push(a);LOG('Riaperta',a,'per il '+fd(d)+(m?' a '+m:''));saveM();closeO();mt('Attività riaperta per il '+fd(d))},
 meseSel(ym){MN.mese=ym;draw()},anno2(d){MN.anno2=String(+MN.anno2+d);draw()},
 async plMese(ym){const d=MN.pl.data.slice(8,10);const last=new Date(+ym.slice(0,4),+ym.slice(5,7),0).getDate();MN.pl.data=ym+'-'+String(Math.min(+d,last)).padStart(2,'0');MN.pl.sel=null;await storico(ym.slice(0,4));drawPlan()},
 async plAnno(d){MN.pl.data=String(+MN.pl.data.slice(0,4)+d)+MN.pl.data.slice(4);MN.pl.sel=null;await storico(MN.pl.data.slice(0,4));drawPlan()},
 pSel(p){MN.pSel=p;draw()},apriImp(id){closeO();MN.impSel=id;if(S.tab!=='mimp'){S.tab='mimp';MN.tab='mimp';render()}else draw()},impBack(){MN.impSel=null;draw()},
 ricAdd(){const d=document.getElementById('mnRD').value.trim();if(!d)return mt('Scrivi il ricambio');const a=M.att.find(x=>x.id===MN.ex);
  M.ric.push({id:nid('r'),imp:a.imp,comp:a.comp,att:a.id,proc:a.proc,desc:d,qta:document.getElementById('mnRQ').value.trim(),buy:document.getElementById('mnRB').checked,stato:'da',da:me(),data:tdy()});saveM();drawEx();mt('Ricambio aggiunto')},
 ricBuy(id,v){const x=M.ric.find(y=>y.id===id);if(!x)return;x.buy=!!v;if(v&&x.stato!=='ok')x.stato='da';saveM();mt(v?'Segnato da riacquistare':'Tolto da riacquistare')},
 ricNew(imp){ovl(`<div class="mn-oh"><h2>Nuovo ricambio</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="evf"><label>Impianto<select id="mnRI">${M.imp.map(i=>`<option value="${i.id}" ${i.id===imp?'selected':''}>${e_(i.cod)} · ${e_(i.nome)}</option>`).join('')}</select></label><label>Ricambio<input id="mnRD"></label><label>Quantità<input id="mnRQ" placeholder="1"></label><label class="mn-chk"><input type="checkbox" id="mnRB" checked> Da acquistare</label></div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.ricNewOk()">Aggiungi</button></div>`)},
 ricNewOk(){const d=document.getElementById('mnRD').value.trim();if(!d)return mt('Scrivi il ricambio');M.ric.push({id:nid('r'),imp:document.getElementById('mnRI').value,comp:null,att:null,desc:d,qta:document.getElementById('mnRQ').value.trim(),buy:document.getElementById('mnRB').checked,stato:'da',da:me(),data:tdy()});saveM();closeO();mt('Ricambio aggiunto')},
 segEd(id,ex){const x=M.ric.find(y=>y.id===id);if(!x)return;MN._segEx=!!ex;MNX.segNew(x.imp,x.att,id)},
 segNew(imp,att,eid){const E=eid&&M.ric.find(y=>y.id===eid);const a=att&&M.att.find(x=>x.id===att);imp=imp||(a&&a.imp)||'';const IL=M.imp.filter(i=>!i.dism).sort((x,y)=>(x.cod||'').localeCompare(y.cod||''));
  const comps=id=>((I(id)||{}).comps||[]).map(c=>`<option value="${c.id}" ${(E?E.comp===c.id:a&&a.comp===c.id)?'selected':''}>${e_(c.sigla)}</option>`).join('');
  window.__segC=comps;window.__segI=z=>{const ds=z?catDesc(z):null;return '<option value="">— scegli —</option>'+IL.filter(i=>!ds||ds.has(i.cat)).map(i=>`<option value="${i.id}">${e_(i.cod)} · ${e_(i.nome)}</option>`).join('')};ovl(`<div class="mn-oh"><h2>${E?'Modifica segnalazione':'Nuova segnalazione'}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div>
  <div class="row" style="margin-bottom:10px"><label class="mn-chk"><input type="radio" name="mnST" value="nota" ${!E||E.tipo==='nota'?'checked':''} onchange="document.getElementById('mnSQw').hidden=true"> 📝 Nota</label><label class="mn-chk"><input type="radio" name="mnST" value="ric" ${E&&E.tipo!=='nota'?'checked':''} onchange="document.getElementById('mnSQw').hidden=false"> 🔧 Ricambio necessario</label></div>
  ${M.cat.length?`<div class="evf"><label>Zona<select id="mnSZ" onchange="document.getElementById('mnSI').innerHTML=window.__segI(this.value);document.getElementById('mnSC').innerHTML='<option value=\\'\\'>— tutto l\\'impianto —</option>'">${catOpts('','Tutte le zone')}</select></label></div>`:''}<div class="evf"><label>Impianto<select id="mnSI" onchange="document.getElementById('mnSC').innerHTML='<option value=\\'\\'>— tutto l\\'impianto —</option>'+window.__segC(this.value)"><option value="">— scegli —</option>${IL.map(i=>`<option value="${i.id}" ${i.id===imp?'selected':''}>${e_(i.cod)} · ${e_(i.nome)}</option>`).join('')}</select></label><label>Componente (facoltativo)<select id="mnSC"><option value="">— tutto l'impianto —</option>${imp?comps(imp):''}</select></label></div>
  <div class="evf"><label>Testo / ricambio<textarea id="mnSD" rows="3" placeholder="es. Perdita olio sotto il cilindro di chiusura">${E?e_(E.desc):''}</textarea></label></div><div class="evf" id="mnSQw" ${E&&E.tipo!=='nota'?'':'hidden'}><label>Quantità<input id="mnSQ" placeholder="1" value="${E?e_(E.qta||''):''}"></label></div>
  <div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.segOk(${att?`'${att}'`:'null'}${E?`,'${E.id}'`:''})">Salva</button></div>`)},
 segOk(att,eid){const g=k=>document.getElementById(k),imp=g('mnSI').value,d=g('mnSD').value.trim(),t=document.querySelector('input[name=mnST]:checked').value;if(!imp)return mt('Scegli l\'impianto');if(!d)return mt('Scrivi il testo');
  if(eid){const x=M.ric.find(y=>y.id===eid);if(x){Object.assign(x,{tipo:t==='nota'?'nota':'ric',imp,comp:g('mnSC').value||null,desc:d,qta:t==='nota'?'':g('mnSQ').value.trim(),buy:t!=='nota',mod:tdy(),modDa:me()});if(t!=='nota'&&!x.stato)x.stato='da'}saveM();closeO();if(att&&MN._segEx&&M.att.find(y=>y.id===att))MNX.esegui(att);else refresh();MN._segEx=0;return mt('Segnalazione modificata')}
  const a=att&&M.att.find(x=>x.id===att);M.ric.push({id:nid('r'),tipo:t==='nota'?'nota':'ric',imp,comp:g('mnSC').value||null,att:att||null,proc:a?a.proc:null,pcod:a?(P(a.proc)||{}).cod||null:null,desc:d,qta:t==='nota'?'':g('mnSQ').value.trim(),buy:t!=='nota',stato:'da',da:me(),data:tdy()});saveM();closeO();if(att)MNX.esegui(att);else refresh();mt('Segnalazione salvata')},
 segArch(id,v){if(!isR())return;const x=M.ric.find(y=>y.id===id);if(!x)return;if(v){x.arch=tdy();x.archDa=me()}else{x.arch=null;x.archDa=null}saveM();refresh();mt(v?'Archiviata':'Ripristinata')},
 ricStato(id,st){const r=M.ric.find(x=>x.id===id);r.stato=st;if(st==='ok'){r.acqData=tdy();r.acqDa=me()}else{r.acqData=null;r.acqDa=null}saveM();refresh();mt(st==='ok'?'Segnato come acquistato':'Riportato da acquistare')},
 ricDel(id,ex){M.ric=M.ric.filter(x=>x.id!==id);saveM();ex?drawEx():refresh()},
 mese(d){if(!d){MN.mese=tdy().slice(0,7)}else{const [y,m]=MN.mese.split('-').map(Number);const x=new Date(y,m-1+d,1);MN.mese=isoL(x).slice(0,7)}draw()},
 async plan(imp,data){MN.pl={imp:imp||'',data:data||tdy(),man:'',sel:null};if(imp){const m=M.ass.find(s=>s.imp===imp&&s.man);if(m)MN.pl.man=m.man}await storico(MN.pl.data.slice(0,4));drawPlan()},
 pl(k,v,keep){MN.pl[k]=v;if(!keep)MN.pl.sel=null;drawPlan()},
 plSel(ids,on){const s_=new Set(MN.pl.sel||[]);ids.forEach(x=>on?s_.add(x):s_.delete(x));MN.pl.sel=[...s_];drawPlan()},
 planOk(){const {imp,data,man}=MN.pl;const set=new Set(MN.pl.sel||[]);const inc=M.ass.filter(x=>set.has(x.id)&&!planned(x));if(!inc.length)return;const i=I(imp);
  const v={id:nid('v'),imp,data,man:man||null};M.vis.push(v);inc.forEach(x=>{const r=pend(x);let a;if(r){r.due=data;r.vis=v.id;r.man=man||null;a=r}else a=newAtt(x,data,v.id,man);LOG(r?'Ripianificata':'Pianificata',a,'il '+fd(data)+(man?' a '+man:' senza nome'));if(man)x.man=man});
  if(!i.avviato){i.avviato=data;M.ass.filter(x=>x.imp===imp&&!set.has(x.id)&&!x.next&&!planned(x)).forEach(x=>{const p=P(x.proc);if(p&&p.tipo!=='evento')x.next=addM(data,p.int)})}saveM();closeO();mt('Manutenzione pianificata il '+fd(data)+' con '+inc.length+' attività')},
 drop(id,d){const v=M.vis.find(x=>x.id===id);if(!v||v.data===d)return draw();M.att.filter(a=>a.vis===id).forEach(a=>LOG('Spostata',a,'dal '+fd(v.data)+' al '+fd(d)));v.data=d;M.att.filter(a=>a.vis===id).forEach(a=>a.due=d);saveM();draw();mt('Manutenzione spostata al '+fd(d))},
 visDett,visSet(id,k,v){const x=M.vis.find(z=>z.id===id);M.att.filter(a=>a.vis===id).forEach(a=>LOG(k==='data'?'Spostata':'Assegnata',a,k==='data'?'dal '+fd(x.data)+' al '+fd(v):(v?'a '+v:'tolto il nome')));x[k]=v||null;M.att.filter(a=>a.vis===id).forEach(a=>{if(k==='data')a.due=v;else a.man=v||null});saveM();visDett(id)},
 visDel(id){M.att.filter(a=>a.vis===id).forEach(a=>LOG('Annullata',a,'manutenzione del '+fd(a.due)+' annullata'));M.att=M.att.filter(a=>a.vis!==id);M.vis=M.vis.filter(v=>v.id!==id);saveM();closeO();mt('Manutenzione annullata: le procedure tornano da pianificare')},
 idocNew(imp){idocForm(imp,null)},idocEd(imp,did){const d=(I(imp).docs||[]).find(x=>x.id===did);if(d)idocForm(imp,d)},
 async idocOk(imp,did){const i=I(imp);if(!i)return;const g=k=>document.getElementById(k);const meta={tipo:g('mnDT').value,comp:g('mnDC').value||null,data:g('mnDD').value||null,scad:g('mnDS').value||null};
  if(did){const d=(i.docs||[]).find(x=>x.id===did);if(d)Object.assign(d,meta);saveM();closeO();refresh();return mt('Documento aggiornato')}
  const f=g('mnDF').files[0];if(!f)return mt('Scegli il file');if(f.size>700*1024)return mt('Il file supera 700 KB: comprimilo');g('mnDOk').disabled=true;
  const data=await new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=ko;r.readAsDataURL(f)}).catch(()=>null);if(!data){g('mnDOk').disabled=false;return mt('File non leggibile')}
  const id=nid('d');try{await window.FBM.putBlob('manutDoc',id,{name:f.name,type:f.type,data});BL[id]={name:f.name,type:f.type,data}}catch(er){g('mnDOk').disabled=false;return mt('Documento non salvato: '+FB.err(er))}
  (i.docs=i.docs||[]).push({id,...meta,name:f.name,type:f.type,size:f.size});saveM();closeO();refresh();mt('Documento caricato')},
 idocRepl(imp,did,inp){const i=I(imp),d=i&&(i.docs||[]).find(x=>x.id===did),f=inp.files[0];if(!d||!f)return;if(f.size>700*1024){inp.value='';return mt('Il file supera 700 KB: comprimilo')}
  const r=new FileReader();r.onload=async()=>{try{await window.FBM.putBlob('manutDoc',did,{name:f.name,type:f.type,data:r.result});BL[did]={name:f.name,type:f.type,data:r.result};Object.assign(d,{name:f.name,type:f.type,size:f.size});saveM();refresh();mt('Nuova versione caricata')}catch(er){mt('Documento non sostituito: '+FB.err(er))}};r.readAsDataURL(f)},
 idocDel(imp,did){const i=I(imp),d=i&&(i.docs||[]).find(x=>x.id===did);if(!d||!confirm('Eliminare il documento «'+d.name+'»?'))return;i.docs=i.docs.filter(x=>x.id!==did);saveM();window.FBM.delBlob('manutDoc',did).catch(()=>{});delete BL[did];refresh();mt('Documento eliminato')},
 async viewBlob(id){const d=await blob('manutDoc',id);if(!d)return mt('Documento non trovato');if(d.type.startsWith('image'))return ovl(`<h2>${e_(d.name)}</h2><img src="${d.data}" style="max-width:100%" alt="${e_(d.name)}"><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Chiudi</button></div>`);
  const b=await (await fetch(d.data)).blob(),u=URL.createObjectURL(b);ovl(`<h2>${e_(d.name)}</h2><iframe class="mn-doc" src="${u}" title="${e_(d.name)}"></iframe><div class="row" style="justify-content:flex-end"><a class="btn" href="${u}" target="_blank" rel="noopener">Apri a schermo intero</a><button class="btn" onclick="MNX.close()">Chiudi</button></div>`)},
 showD(v){MN.showD=!!v;draw()},
 dismetti(id){const i=I(id);if(!i)return;const att=M.att.filter(a=>a.imp===id);const vis=M.vis.filter(v=>v.imp===id);
  if(!confirm('Dismettere '+i.cod+'?\n\nVerranno eliminate '+att.length+' attività aperte o pianificate'+(vis.length?' ('+vis.length+' manutenzioni in calendario)':'')+'.\nLe manutenzioni già fatte restano nello storico.\nL\'impianto si potrà ripristinare.'))return;
  att.forEach(a=>LOG('Annullata',a,'impianto dismesso'));M.att=M.att.filter(a=>a.imp!==id);M.vis=M.vis.filter(v=>v.imp!==id);i.dism=tdy();saveM();refresh();mt(i.cod+' dismesso: '+att.length+' attività eliminate')},
 ripristina(id){const i=I(id);if(!i||!confirm('Ripristinare '+i.cod+'? Le sue procedure tornano tra quelle da pianificare.'))return;i.dism=null;saveM();refresh();mt(i.cod+' ripristinato')},
 planNext(aid){const s=M.ass.find(x=>x.id===aid);if(!s||!s.next)return mt('Inserisci prima la data dell\'ultima esecuzione');if(planned(s))return mt('Già pianificata');const d=s.next;
  let v=M.vis.find(x=>x.imp===s.imp&&x.data===d&&!x.tit);if(!v){v={id:nid('v'),imp:s.imp,data:d,man:s.man||null};M.vis.push(v)}
  const r=pend(s);let a;if(r){r.due=d;r.vis=v.id;r.man=v.man;a=r}else a=newAtt(s,d,v.id,v.man);LOG(r?'Ripianificata':'Pianificata',a,'il '+fd(d)+(v.man?' a '+v.man:' senza nome'));saveM();cfgOrRef();mt('Pianificata il '+fd(d)+(d<tdy()?' (data già passata: risulta in ritardo)':''))},
 setLast(aid,v){const s=M.ass.find(x=>x.id===aid),p=P(s.proc);s.last=v||null;s.next=v?addM(v,p.int):null;saveM();cfgOrRef()},
 setManImp(imp,v,ids){if(!v)return;const set=ids.split(',');M.att.filter(a=>set.includes(a.id)).forEach(a=>{LOG('Assegnata',a,v==='-'?'tolto il nome':'a '+v);a.man=v==='-'?null:v});saveM();refresh();mt(v==='-'?'Assegnazioni tolte':set.length+' attività assegnate a '+v)},
 setMan(id,v){const a=M.att.find(x=>x.id===id);LOG('Assegnata',a,v?'a '+v:'tolto il nome'+(a.man?' (era '+a.man+')':''));a.man=v||null;saveM();mt(v?'Assegnata a '+v:'Assegnazione tolta')},
 evento(sid){const s=M.ass.find(a=>a.id===sid);s.evt=true;saveM();impDett(s.imp);mt('Evento registrato: la procedura entra nella prossima manutenzione pianificata')},
 // --- Inserimento rapido impianti (v2.12.0)
 qi(){const r=()=>({cod:'',nome:'',cli:'',t:{}});MN.qi={cat:'',nc:'',rows:[r(),r(),r(),r(),r()],add:{}};drawQI()},
 qiSet(k,v){MN.qi[k]=v;if(k==='cat'||k==='fz')drawQI()},
 qiRow(k,f,v){const q=MN.qi;if(k<0){q.rows.push({cod:'',nome:'',cli:'',t:{}});return drawQI()}if(f==='del'){q.rows.splice(k,1);return drawQI()}if(f==='t'){q.rows[k].t[v[0]]=v[1];return}q.rows[k][f]=v},
 qiCol(tid,on){MN.qi.rows.forEach(r=>{if((r.cod||'').trim())r.t[tid]=on});const t=T(tid);let n=0,np=0;
  if(on&&t){const ex=qiEx().filter(i=>!(i.comps||[]).some(c=>c.tipo===tid));if(ex.length&&!confirm('Aggiungere '+t.nome+' a '+ex.length+' impianti già inseriti mostrati in tabella?')){drawQI();return}
   const ps=(t.procs||[]).filter(x=>M.proc.some(p=>p.id===x));ex.forEach(i=>{const c={id:nid('c'),tipo:tid,sigla:t.nome};(i.comps=i.comps||[]).push(c);ps.forEach(pid=>{assign(i.id,pid,null,null,c.id);np++});n++});if(n)saveM()}
  drawQI();if(n)mt(t.nome+' aggiunto a '+n+' impianti con '+np+' procedure')},
 qiEd(id,f,v){const i=I(id);if(!i)return;i[f]=f==='cat'?(v||null):v.trim();saveM();mt('Salvato')},
 qiDel(id,tid){const i=I(id),t=T(tid);if(!i||!t)return;const cs=(i.comps||[]).filter(c=>c.tipo===tid).map(c=>c.id);const ids=M.ass.filter(a=>a.imp===id&&cs.includes(a.comp)).map(a=>a.id);const op=M.att.filter(a=>ids.includes(a.ass)).length;
  if(!confirm('Togliere '+t.nome+' da '+i.cod+'?\nVengono tolte '+ids.length+' procedure'+(op?' e '+op+' attività aperte':'')+'. Lo storico resta.'))return;
  const gone=new Set(M.att.filter(a=>ids.includes(a.ass)&&a.vis).map(a=>a.vis));M.att=M.att.filter(a=>!ids.includes(a.ass));M.vis=M.vis.filter(v=>!gone.has(v.id)||M.att.some(a=>a.vis===v.id));M.ass=M.ass.filter(a=>!ids.includes(a.id));i.comps=i.comps.filter(c=>!cs.includes(c.id));saveM();drawQI();mt(t.nome+' tolto da '+i.cod)},
 qiAdd(id,tid,on){const i=I(id),t=T(tid);if(!on||!i||!t||(i.comps||[]).some(c=>c.tipo===tid))return;const c={id:nid('c'),tipo:tid,sigla:t.nome};(i.comps=i.comps||[]).push(c);const ps=(t.procs||[]).filter(x=>M.proc.some(p=>p.id===x));ps.forEach(pid=>assign(i.id,pid,null,null,c.id));saveM();drawQI();mt(t.nome+' aggiunto a '+i.cod+' con '+ps.length+' procedure')},
 qiGrid(ev,k,f){const tx=(ev.clipboardData||window.clipboardData).getData('text');if(!/[\t\n]/.test(tx.replace(/\r?\n$/,'')))return;ev.preventDefault();const F=['cod','desc','nome','cli'],c0=F.indexOf(f),q=MN.qi;
  tx.replace(/\r?\n$/,'').split(/\r?\n/).forEach((l,j)=>{const r=q.rows[k+j]||(q.rows[k+j]={cod:'',nome:'',desc:'',cli:'',t:{}});l.split('\t').forEach((v,x)=>{const ff=F[c0+x];if(ff)r[ff]=v.replace(/\s+/g,' ').trim()})});drawQI();mt('Incollate '+tx.trim().split(/\r?\n/).length+' righe')},
 qiPaste(on){MN.qi.paste=on;drawQI()},
 qiPasteOk(){const q=MN.qi,tx=(document.getElementById('mnQiP')||{}).value||'';const used=new Set([...M.imp.map(i=>nk_(i.cod)),...q.rows.filter(r=>(r.cod||'').trim()).map(r=>nk_(r.cod))]);let n=0,d=0;
  const tab=/\t/.test(tx),sc=!tab&&/;/.test(tx);const nw=tx.split(/\r?\n/).filter(l=>l.trim()).map(l=>{if(tab||sc){const f=l.split(tab?'\t':';').map(x=>x.replace(/\s+/g,' ').trim());let c=f[0]||'',c0=c,j=2;if(!c)return null;while(used.has(nk_(c)))c=c0+' ('+j+++')';if(c!==c0)d++;used.add(nk_(c));n++;return{cod:c,desc:f[1]||'',nome:f[2]||'',cli:f[3]||'',t:{}}}l=l.replace(/\s+/g,' ').trim();let k=l.indexOf(' - '),cod,rest;if(k>0){cod=l.slice(0,k).trim();rest=l.slice(k+3).trim()}else{const m=l.match(/^(\S+)\s*(.*)$/);cod=m[1];rest=m[2]}let c=cod,j=2;while(used.has(nk_(c))){c=cod+' ('+j+++')';}if(c!==cod)d++;used.add(nk_(c));n++;return{cod:c,nome:'',desc:rest,cli:'',t:{}}});
  q.rows=[...q.rows.filter(r=>(r.cod||'').trim()||(r.nome||'').trim()||(r.desc||'').trim()),...nw.filter(Boolean)];q.paste=false;drawQI();mt(n+' righe aggiunte'+(d?' · '+d+' nomi doppi rinominati con (2)':'')+': controlla e premi «Crea impianti»')},
 qiOk(){const q=MN.qi,rows=q.rows.filter(r=>(r.cod||'').trim()||(r.nome||'').trim()||(r.desc||'').trim());const adds=Object.entries(q.add).flatMap(([id,o])=>Object.keys(o).filter(t=>o[t]).map(t=>[id,t]));if(!rows.length&&!adds.length)return mt('Nessun impianto o componente da aggiungere');
  if(rows.some(r=>!(r.cod||'').trim()))return mt('Manca il nome su una riga');
  const cods=rows.map(r=>nk_(r.cod));const dup=rows.find((r,k)=>cods.indexOf(nk_(r.cod))!==k||M.imp.some(i=>nk_(i.cod)===nk_(r.cod)));if(dup)return mt('Nome già presente: '+dup.cod.trim());
  let cat=q.cat||null;if(q.cat==='_new'){const nm=(q.nc||'').trim();if(!nm)return mt('Scrivi il nome della nuova zona');const c={id:nid('k'),nome:nm,par:null};M.cat.push(c);cat=c.id}
  let nc=0,np=0;rows.forEach(r=>{const i={id:nid('i'),cod:r.cod.trim(),nome:(r.nome||'').trim(),cli:(r.cli||'').trim(),desc:(r.desc||'').trim(),cat:(r.cat&&M.cat.some(c=>c.id===r.cat))?r.cat:cat,comps:[]};M.imp.push(i);
   M.tipi.filter(t=>r.t[t.id]).forEach(t=>{const c={id:nid('c'),tipo:t.id,sigla:t.nome};i.comps.push(c);nc++;(t.procs||[]).filter(id=>M.proc.some(p=>p.id===id)).forEach(pid=>{assign(i.id,pid,null,null,c.id);np++})})});
  adds.forEach(([id,tid])=>{const i=I(id),t=T(tid);if(!i||!t||(i.comps||[]).some(c=>c.tipo===tid))return;const c={id:nid('c'),tipo:tid,sigla:t.nome};(i.comps=i.comps||[]).push(c);nc++;(t.procs||[]).filter(x=>M.proc.some(p=>p.id===x)).forEach(pid=>{assign(i.id,pid,null,null,c.id);np++})});
  saveM();closeO();mt((rows.length?rows.length+' impianti creati, ':'')+nc+' componenti e '+np+' procedure aggiunti')},
 newImp(){ovl(`<div class="mn-oh"><h2>Nuovo impianto</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="evf"><label>Categoria<select id="mnICat">${catOpts('')}</select></label><label>Nome<input id="mnICod" placeholder="es. Isola 64"></label><label>Commessa<input id="mnINome"></label><label>Cliente<input id="mnICli"></label><label>Descrizione<input id="mnIDesc"></label></div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.addImp()">Crea e configura</button></div>`)},
 newTipo(){ovl(`<div class="mn-oh"><h2>Nuovo tipo di componente</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="evf"><label>Nome<input id="mnTNome" placeholder="es. Robot, Laser, Pressa…"></label></div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.close()">Annulla</button><button class="btn pri" onclick="MNX.addTipo()">Crea</button></div>`)},
 editTipo(tid){const t=T(tid);ovl(`<div class="mn-oh"><h2>${e_(t.nome)}</h2><button class="btn" onclick="MNX.close()" aria-label="Chiudi">✕</button></div><div class="evf"><label>Nome<input value="${e_(t.nome)}" onchange="MNX.tipoNome('${tid}',this.value)"></label></div><div class="muted">Procedure del tipo: le ricevono tutti i componenti di questo tipo. Se aggiungi o togli una spunta, la modifica vale subito su tutti gli impianti dove c'è questo componente.</div><div class="mn-checks">${M.proc.map(p=>`<label class="mn-chk"><input type="checkbox" ${t.procs.includes(p.id)?'checked':''} onchange="MNX.togTipo('${t.id}','${p.id}',this.checked)"> <span><b>${e_(p.cod)}</b> ${e_(p.desc)} <span class="muted">· ${freq(p)}</span></span></label>`).join('')||'<span class="muted">Crea prima le procedure</span>'}</div><div class="row" style="justify-content:flex-end"><button class="btn pri" onclick="MNX.close()">Fatto</button></div>`)},
 tipoNome(tid,v){if(v.trim()){T(tid).nome=v.trim();saveM()}},
 addImp(){const v=k=>document.getElementById(k).value.trim();if(!v('mnICod'))return mt('Inserisci il nome');const i={id:nid('i'),cod:v('mnICod'),nome:v('mnINome'),cli:v('mnICli'),desc:v('mnIDesc'),cat:document.getElementById('mnICat')?.value||null,comps:[]};M.imp.push(i);saveM();MNX.config(i.id)},
 config(id){MN.cfgImp=id;MN.cfgOpen={};drawCfg()},
 cfgOpen(cid){MN.cfgOpen=MN.cfgOpen||{};MN.cfgOpen[cid]=!MN.cfgOpen[cid];drawCfg()},
 compRen(cid,v){const c=(I(MN.cfgImp).comps||[]).find(x=>x.id===cid);if(c&&v.trim()){c.sigla=v.trim();saveM()}},
 togEl(tid,on){const i=I(MN.cfgImp),t=T(tid);if(!i||!t)return;
  if(on){const c={id:nid('c'),tipo:tid,sigla:t.nome};(i.comps=i.comps||[]).push(c);const ps=(t.procs||[]).filter(id=>M.proc.some(p=>p.id===id));ps.forEach(pid=>assign(i.id,pid,null,null,c.id));saveM();drawCfg();return mt(t.nome+' aggiunto con '+ps.length+' procedure')}
  const cs=(i.comps||[]).filter(c=>c.tipo===tid),ids=new Set(M.ass.filter(a=>cs.some(c=>c.id===a.comp)).map(a=>a.id)),open=M.att.filter(a=>ids.has(a.ass)).length;
  ovl(`<div class="mn-oh"><h2>Togliere ${e_(t.nome)}?</h2><button class="btn" onclick="MNX.config('${i.id}')" aria-label="Chiudi">✕</button></div><div>${cs.map(c=>e_(c.sigla)).join(', ')}</div><div class="muted" style="font-size:13px">Vengono tolti ${cs.length>1?'i componenti':'il componente'} con le procedure${open?` e ${open} attività aperte`:''}. Lo storico resta.</div><div class="row" style="justify-content:flex-end"><button class="btn" onclick="MNX.config('${i.id}')">Annulla</button><button class="btn pri" onclick="MNX.togElOk('${tid}')">Togli</button></div>`)},
 togElOk(tid){const i=I(MN.cfgImp);const cs=(i.comps||[]).filter(c=>c.tipo===tid).map(c=>c.id);const ids=M.ass.filter(a=>cs.includes(a.comp)).map(a=>a.id);M.att=M.att.filter(a=>!ids.includes(a.ass));M.ass=M.ass.filter(a=>!cs.includes(a.comp));i.comps=i.comps.filter(c=>!cs.includes(c.id));saveM();drawCfg();mt('Tolto')},
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
 win(v){M.winDays=Math.min(730,Math.max(1,Number(v)||90));saveM();draw();mt('Prossime scadenze: '+M.winDays+' giorni (salvato)')},
 setAvv(pid,v){const p=P(pid);if(!p||p._miss)return;p.avv=Math.max(0,Number(v)||0);saveM();draw();mt('Avviso di '+p.cod+': '+p.avv+' giorni prima (su tutti gli impianti)')},
 procOpen(g){MN.procOpen=MN.procOpen||{};MN.procOpen[g]=g==='_doc'?MN.procOpen[g]===false:!MN.procOpen[g];draw()},
 editProc,addStep(){const t=document.getElementById('mnNS').value.trim();if(!t)return;const i=document.getElementById('mnNI').value.trim();MN.tmpSteps.push(i?{t,foto:document.getElementById('mnNF').checked,i}:{t,foto:document.getElementById('mnNF').checked});document.getElementById('mnNS').value='';document.getElementById('mnNI').value='';document.getElementById('mnNF').checked=false;drawSteps()},
 stSet(k,f,v){const s=MN.tmpSteps[k];if(!s)return;if(f==='t'){v=String(v).trim();if(!v)return drawSteps()}if(f==='i'){v=String(v).trim();if(!v){delete s.i;return}}s[f]=v},
 docRepl(id,inp){const f=inp.files[0];if(!f)return;if(f.size>700*1024){inp.value='';return mt('Il file supera 700 KB: comprimilo')}
  const r=new FileReader();r.onload=async()=>{try{await window.FBM.putBlob('manutDoc',id,{name:f.name,type:f.type,data:r.result});BL[id]={name:f.name,type:f.type,data:r.result};
   let n=0;M.proc.forEach(p=>{if(p.doc&&p.doc.id===id){p.doc={...p.doc,name:f.name,type:f.type,size:f.size};n++}});if(MN.tmpDoc&&MN.tmpDoc.id===id)MN.tmpDoc={...MN.tmpDoc,name:f.name,type:f.type,size:f.size};
   saveM();if(S.tab==='cproc'&&document.getElementById('mnOvl')?.hidden!==false)draw();const el=document.getElementById('mnDocI');if(el)el.textContent='Allegato: '+f.name+' (nuova versione)';mt('Documento sostituito in '+n+' procedure')}catch(er){mt('Documento non sostituito: '+FB.err(er))}};r.readAsDataURL(f)},
 pickDoc(id){if(!id)return;const d=docList().find(x=>x.id===id);if(!d)return;MN.tmpDoc=d;document.getElementById('mnDocI').textContent='Collegato: '+d.name+' (stesso file, non duplicato)'},
 rmStep(k){MN.tmpSteps.splice(k,1);drawSteps()},mvStep(k,d){if(k+d<0)return;const s=MN.tmpSteps;[s[k],s[k+d]]=[s[k+d],s[k]];drawSteps()},
 loadDoc(inp){const f=inp.files[0];if(!f)return;if(f.size>700*1024){inp.value='';return mt('Il file supera 700 KB: comprimilo o usa un link')}
  const r=new FileReader();r.onload=()=>{MN.tmpDoc={name:f.name,type:f.type,size:f.size,_data:r.result};document.getElementById('mnDocI').textContent='Allegato: '+f.name+' ('+Math.round(f.size/1024)+' KB)'};r.readAsDataURL(f)},
 async saveProc(){const v=k=>document.getElementById(k).value.trim();if(!v('mnPCod'))return mt('Inserisci il codice');if(!MN.tmpSteps.length)return mt('Aggiungi almeno un passo');
  let d=MN.tmpDoc;if(d&&d._data){const id=nid('d');try{await window.FBM.putBlob('manutDoc',id,{name:d.name,type:d.type,data:d._data});BL[id]={name:d.name,type:d.type,data:d._data};d={id,name:d.name,type:d.type,size:d.size}}catch(er){return mt('Documento non salvato: '+FB.err(er))}}
  const data={cod:v('mnPCod'),desc:v('mnPDesc'),norma:v('mnPNorma'),tipo:v('mnPTipo'),int:Number(v('mnPInt'))||6,min:Number(v('mnPMin'))||0,avv:Math.max(0,Number(v('mnPAvv'))||0),mat:v('mnPMat'),est:document.getElementById('mnPEst').checked?1:0,steps:MN.tmpSteps,doc:d};
  if(MN.editId){const p=P(MN.editId);if(p.doc&&p.doc.id&&(!d||d.id!==p.doc.id)&&!docUsed(p.doc.id,p))window.FBM.delBlob('manutDoc',p.doc.id).catch(()=>{});Object.assign(p,data);
   M.att.filter(a=>a.proc===p.id).forEach(a=>{a.ok=p.steps.map((s,k)=>a.ok[k]||false);a.foto=p.steps.map((s,k)=>a.foto[k]||[])})}
  else{if(M.proc.some(x=>x.cod===data.cod))return mt('Codice '+data.cod+' già usato: scegline un altro');const np={id:nid('p'),...data};M.proc.push(np);if(MN.newTipo&&T(MN.newTipo)){MNX.togTipo(MN.newTipo,np.id,true);(MN.procOpen=MN.procOpen||{})[MN.newTipo]=true}}saveM();closeO();mt('Procedura salvata')},
 delProc(){const p=P(MN.editId);if(M.ass.some(a=>a.proc===p.id))return mt('Procedura assegnata a dei componenti: toglila prima da lì');
  if(p.doc&&p.doc.id&&!docUsed(p.doc.id,p))window.FBM.delBlob('manutDoc',p.doc.id).catch(()=>{});M.proc=M.proc.filter(x=>x.id!==p.id);M.tipi.forEach(t=>t.procs=t.procs.filter(x=>x!==p.id));saveM();closeO()},
 viewDocId(id){const p=M.proc.find(x=>x.doc&&x.doc.id===id);if(p)MNX.viewDoc(p.id)},
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
 async chiudi(part){const a=M.att.find(x=>x.id===MN.ex),p=PA(a),s=M.ass.find(x=>x.id===a.ass),i=IA(a);
  const fatto=k=>a.ok[k]&&(!p.steps[k].foto||(a.foto[k]||[]).length),orig=a.sub||p.steps.map((x,k)=>k),miss=orig.filter((o,k)=>!fatto(k));
  if(part){if(!miss.length)part=0;else a.ok=a.ok.map((v,k)=>fatto(k))}
  const c={...a,parziale:part?1:0,_mancanti:part?p.steps.filter((x,k)=>!fatto(k)).map(x=>x.t):null,chiusa:tdy(),esec:me(),_imp:a.imp?i.cod+' '+i.nome:'',_cat:a.cat||null,_cmp:CMP(a),_pcod:a.free?'Attività':p.cod,_pdesc:p.desc,_free:a.free||null,_norma:p.norma,_steps:p.steps.map(x=>({t:x.t,foto:x.foto}))};const y=c.chiusa.slice(0,4);
  try{const arr=await storico(y,true);arr.push(c);await saveYm(y)}catch(er){return mt('Chiusura non salvata: '+FB.err(er))}
  M.att=M.att.filter(x=>x.id!==a.id);if(!(M.anni||[]).includes(y))(M.anni=M.anni||[]).push(y);
  (M.fatte=M.fatte||[]).push({id:c.id,y,imp:a.imp||null,man:a.man||me(),esec:me(),chiusa:c.chiusa,parziale:part?1:0,cod:c._pcod,desc:c._pdesc,cmp:CMP(a)});
  LOG(part?'Chiusa in parte':'Completata',a,(part?'mancano: '+c._mancanti.join(', '):'tutti i passi confermati')+' · da '+me());
  if(part&&!s){const r={id:nid('a'),vis:null,ass:null,imp:a.imp,comp:a.comp,proc:null,free:a.free||null,sub:miss,due:null,man:a.man||null,ok:miss.map(()=>false),foto:miss.map(()=>[]),note:'',orig:a.id};M.att.push(r);
   if(a.vis&&!M.att.some(x=>x.vis===a.vis))M.vis=M.vis.filter(x=>x.id!==a.vis);saveM();closeO();return mt('Chiusa in parte: i passi mancanti sono in «Da pianificare»')}
  let msg=part?'Chiusa in parte':'✓ Attività completata';if(s){c._prev={last:s.last,next:s.next,evt:s.evt,incompleto:s.incompleto||null};try{const arr=H[y];const me_=arr&&arr.find(x=>x.id===c.id);if(me_)me_._prev=c._prev;saveYm(y).catch(()=>{})}catch(e){}s.last=c.chiusa;s.incompleto=part?{data:c.chiusa,passi:c._mancanti}:null;if(p.tipo==='cal'){s.next=addM(s.next&&s.next<=c.chiusa?s.next:c.chiusa,p.int)}else if(p.tipo==='ultima'){s.next=addM(c.chiusa,p.int)}else{s.evt=false}msg+=p.tipo==='evento'?' · in attesa del prossimo evento':(part?' · i passi mancanti restano da concludere, prossima manutenzione dal ':' · prossima richiesta dal ')+fd(s.next)}
  if(a.vis&&!M.att.some(x=>x.vis===a.vis))M.vis=M.vis.filter(v=>v.id!==a.vis);
  saveM();closeO();mt(msg)},
 pdfOpen(){const a=M.att.find(x=>x.id===MN.ex),p=PA(a),i=IA(a);pdf(a,p,a.imp?i.cod+' '+i.nome+(i.cli?' ('+i.cli+')':''):'—',CMP(a))},
 async pdf(y,id){const a=(await storico(y)).find(x=>x.id===id);if(!a)return;const p={cod:a._pcod,desc:a._pdesc,norma:a._norma,steps:a._steps||P(a.proc)?.steps||[],_d:a._free?.desc};const i=I(a.imp);pdf(a,p,a._imp+(i&&i.cli?' ('+i.cli+')':''),a._cmp)},
 xls(){if(!window.XLSX)return mt('Excel non disponibile');const rows=(MN._sto||[]).map(a=>({Data:fd(a.chiusa),Impianto:a._imp,Cliente:I(a.imp)?.cli||'',Componente:a._cmp,Procedura:a._pcod,Descrizione:a._pdesc,'Eseguita da':a.esec,'Passi confermati':a.ok.filter(Boolean).length+'/'+a.ok.length,Foto:a.foto.flat().length,Note:a.note}));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Interventi '+MN.anno);XLSX.writeFile(wb,'Manutenzioni_'+MN.anno+'.xlsx')}
};
Object.assign(window.MNX,APX);
})();
