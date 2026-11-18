#!/usr/bin/env python3
# Genera beta/ (Ergo Plan Beta) dai file di produzione. Rilanciare dopo ogni modifica a index.html / manutenzione.js.
# Dati Beta su Firestore: collezioni beta_* (utenti condivisi). La produzione viene solo LETTA (copia iniziale).
import os,re,json
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));B=os.path.join(R,'beta');os.makedirs(B,exist_ok=True)
def rep(s,a,b,n=1):
    c=s.count(a)
    if (n and c!=n) or c==0: raise SystemExit(f'make_beta: atteso {n} x {a[:60]!r}, trovati {c}')
    return s.replace(a,b)
s=open(os.path.join(R,'index.html'),encoding='utf-8').read()
s=s.replace('Ergo Plan','Ergo Plan Beta')
for f in ['favicon.png','apple-touch-icon.png','icon-192.png']:s=s.replace('"'+f+'"','"../'+f+'"')
s=rep(s,'register("sw.js"','register("../sw.js"')
# tutte le collezioni (tranne utenti) con prefisso beta_
s=rep(s,'getDocs}','getDocs}',1)
s=s.replace('doc(db,','bdoc(db,').replace('collection(db,','bcol(db,')
s=rep(s,"const app=initializeApp(cfg)","const BC=c=>c==='utenti'?c:'beta_'+c,bdoc=(d,c,...r)=>doc(d,BC(c),...r),bcol=(d,c)=>collection(d,BC(c));\nconst app=initializeApp(cfg)")
# primo avvio: copia (sola lettura) la produzione nelle collezioni beta_
s=rep(s,"""if(!snap.exists()){if(un!=='admin')return blocco("L'amministratore deve aprire l'app la prima volta.");""",
"""if(!snap.exists()){if(un!=='admin')return blocco("L'amministratore deve aprire Ergo Plan Beta la prima volta.");
   if(FB._init)return;FB._init=1;$('#app').innerHTML='<div class="login"><h1>Ergo Plan Beta</h1><span class="muted" id="biM">Copia dei dati di Ergo Plan…</span></div>';
   try{await FB.betaInit(t=>{const m=document.getElementById('biM');if(m)m.textContent=t})}catch(er){FB._init=0;return blocco('Copia dei dati non riuscita: '+FB.err(er)+'. Controlla le regole Firestore (blocco beta_) e riapri.')}
   return;""")
s=rep(s,"window.FB={msg:'',key:null,","""window.FB={msg:'',key:null,
 // Beta: copia la produzione (solo lettura) in beta_*; app/stato per ultimo
 async betaReset(){window.__rip=1;$('#app').innerHTML='<div class="login"><h1>Ergo Plan Beta</h1><span class="muted">Cancellazione della Beta in corso…</span></div>';try{unsub&&unsub();unsub=null}catch(e){}try{window.FBM&&FBM.stop&&FBM.stop()}catch(e){}
  for(const c of ['manutStorico','manutDoc','manutFoto']){const qs=await getDocs(bcol(db,c));for(const x of qs.docs)await deleteDoc(x.ref)}
  await deleteDoc(bdoc(db,'app','manut'));await deleteDoc(bdoc(db,'app','stato'));location.reload()},
 async betaInit(prog){const P=[['manutStorico'],['manutDoc'],['manutFoto']];
  for(const [c] of P){prog('Copia '+c+'…');const qs=await getDocs(collection(db,c));for(const x of qs.docs)await setDoc(bdoc(db,c,x.id),x.data())}
  prog('Copia manutenzioni…');const m=await getDoc(doc(db,'app','manut'));if(m.exists())await setDoc(bdoc(db,'app','manut'),m.data());
  prog('Copia pianificazione…');const st=await getDoc(doc(db,'app','stato'));if(!st.exists())throw new Error('dati di Ergo Plan non trovati');await setDoc(bdoc(db,'app','stato'),st.data())},""")
# storico diviso per mese (beta_manutStorico/{anno}_MM): ogni documento resta sotto 1 MB
s=rep(s,"txY:(y,b,l)=>txMerge(bdoc(db,'manutStorico',String(y)),b,l),",
"""txY:async(y,b,l)=>{y=String(y);const mo=a=>String(a&&a.chiusa||'').slice(5,7)||'00',grp=arr=>{const g={};(arr||[]).forEach(a=>(g[mo(a)]=g[mo(a)]||[]).push(a));return g};
  const lg=await getDoc(bdoc(db,'manutStorico',y)),leg=lg.exists()&&((fsDec(lg.data()).att)||[]).length>0;
  const gb=grp(b&&b.att),gl=grp(l&&l.att),out=[];
  for(const m of new Set([...Object.keys(gb),...Object.keys(gl)])){const bb={att:gb[m]||[]},ll={att:gl[m]||[]};
   if(!leg&&stab(bb)===stab(ll)&&FBM._ym&&FBM._ym[y+'_'+m]){out.push(...FBM._ym[y+'_'+m]);continue}
   const r=await txMerge(bdoc(db,'manutStorico',y+'_'+m),bb,ll);FBM._ym=FBM._ym||{};FBM._ym[y+'_'+m]=r.att||[];out.push(...(r.att||[]))}
  if(leg)await setDoc(bdoc(db,'manutStorico',y),{att:[],spostato:1});
  return{att:out}},""")
s=rep(s,"getY:async y=>{const d=fsGet(await getDoc(bdoc(db,'manutStorico',String(y))));return d?(d.att||[]):[]},",
"""getY:async y=>{y=String(y);const ps=['',...Array.from({length:13},(x,i)=>'_'+String(i).padStart(2,'0'))];
  const ds=await Promise.all(ps.map(p=>getDoc(bdoc(db,'manutStorico',y+p)).then(fsGet)));const mp=new Map();FBM._ym=FBM._ym||{};
  ds.forEach((d,i)=>{const a=d?(d.att||[]):[];if(i)FBM._ym[y+ps[i]]=a;a.forEach(x=>mp.set(x.id,x))});return[...mp.values()]},""")
s=rep(s,"saveY:async(y,arr)=>RIP()||setDoc(bdoc(db,'manutStorico',String(y)),fsEnc({att:arr})),","saveY:async(y,arr)=>RIP()||FBM.txY(y,{att:[]},{att:arr}),")
# pulsante nascosto: 5 tocchi sul titolo
s=rep(s,"<h1>Ergo Plan Beta <span class=\"rev\">v${VERSIONE}</span></h1><div cl","<h1 onclick=\"window.betaTap&&betaTap()\">Ergo Plan Beta <span class=\"rev\">v${VERSIONE}</span></h1><div cl")
s=re.sub(r'manutenzione\.js\?v=([0-9.]+)',r'manutenzione.js?v=\1b4',s)
s=rep(s,'<script src="manutenzione.js','<script>window.betaTap=(()=>{let n=0,t=0;return()=>{const k=Date.now();n=k-t<1500?n+1:1;t=k;if(n>=5){n=0;window.MNX&&MNX.betaMenu&&MNX.betaMenu()}}})();</script>\n<script src="manutenzione.js')
open(os.path.join(B,'index.html'),'w',encoding='utf-8').write(s)
m=open(os.path.join(R,'manutenzione.js'),encoding='utf-8').read()
m=m.replace("fetch('manut_std.json","fetch('../manut_std.json").replace("fetch('Procedura_LOTO.pdf","fetch('../Procedura_LOTO.pdf")
m=rep(m,"function start(){","function start(){MN._simT||(MN._simT=setInterval(()=>{if(localStorage.getItem('epBetaNoSim')){if(!okB())return;localStorage.removeItem('epBetaNoSim');M.simA=M.planD=tdy();M.noSim=1;saveM();clearInterval(MN._simT);refresh();return mt('Beta allineata a Ergo Plan: nessuna simulazione')}if(M.simA&&M.planD===tdy())return clearInterval(MN._simT);if(M.simA){const k=pianSim();if(k>=0){clearInterval(MN._simT);saveM();refresh();mt('Simulazione: '+k+' attività pianificate')}return}simula(false)},5000));")
SIM=r"""
// ===== Ergo Plan Beta: simulazione =====
const offB=d=>typeof offD==='function'?offD(d):[0,6].includes(new Date(d+'T12:00:00').getDay());
const wkB=d=>{let x=d;while(offB(x))x=addD(x,1);return x};
const nxB=d=>wkB(addD(d,1));
const poolB=()=>{let p=(PERS()||[]).filter(x=>x&&!/yassine|alessandro/i.test(x));if(!p.length)p=[...new Set([...M.att.map(a=>a.man),...(M.fatte||[]).map(a=>a.esec||a.man)].filter(x=>x&&!/yassine|alessandro/i.test(x)))];return p.length?p:[me()||'Manutentore']};
const MINB=p=>(+p.min>0?+p.min:60);let CAPMIN=16*60;const capB=()=>CAPMIN=Math.round((+M.oreG>0?+M.oreG:16)*60);
const okB=()=>isR()&&MN.base&&MN.mainL&&!MN.noProc&&M.proc.length&&!MN.old;
// futuro: ogni procedura ha la sua prossima esecuzione pianificata. Una visita per impianto e mese, max 16 ore di lavoro al giorno (tempo stimato delle procedure, 60 min se manca; festivi esclusi)
function pianSim(){if(!okB())return -1;capB();const t=tdy(),pool=poolB(),rnd=()=>pool[Math.floor(Math.random()*pool.length)],cnt={};
 M.att.forEach(a=>{if(a.due&&a.due>t){const p=PA(a);cnt[a.due]=(cnt[a.due]||0)+(p?MINB(p):60)}});
 const L=[];let n=0;
 for(const s of M.ass){const p=P(s.proc);if(!p||p._miss)continue;const i=I(s.imp);if(!i||i.dism||planned(s))continue;
  if(p.tipo==='evento'){if(!s.evt)continue;L.push({s,d:nxB(t)});continue}if(!(+p.int))continue;
  L.push({s,d:wkB(s.next&&s.next>t?s.next:addD(t,1))})}
 const G={};L.forEach(x=>{const k=x.s.imp+'|'+x.d.slice(0,7);(G[k]=G[k]||[]).push(x)});
 Object.values(G).map(g=>({g,d:g.map(x=>x.d).sort()[0]})).sort((a,b)=>a.d<b.d?-1:1).forEach(({g,d})=>{
  const mins=g.reduce((a,x)=>a+MINB(P(x.s.proc)),0);while((cnt[d]||0)>0&&(cnt[d]||0)+mins>CAPMIN)d=nxB(d);cnt[d]=(cnt[d]||0)+mins;const v={id:nid('v'),imp:g[0].s.imp,data:d,man:rnd()};M.vis.push(v);
  v.sim=1;g.forEach(({s})=>{const r=pend(s);if(r){r.due=d;r.vis=v.id;r.man=v.man;r.sim=1}else newAtt(s,d,v.id,v.man).sim=1;s.man=v.man;n++})});
 M.imp.forEach(i=>{if(!i.dism&&!i.avviato)i.avviato=M.simDa||t});
 M.planD=t;(M.log=M.log||[]).push({t:new Date().toISOString().slice(0,16).replace('T',' '),chi:me()||'sistema',az:'Simulazione',att:null,imp:null,cod:'',man:null,txt:n+' attività pianificate'});return n}
// passato: chiusure simulate fino a oggi, distribuite in modo uniforme sui giorni lavorativi (escluse fornitore ed evento)
async function simula(man){
 if(MN._sim)return;if(!isR())return man&&mt('Solo il responsabile manutenzione può aggiornare la simulazione');
 if(!okB())return man&&mt('Dati non ancora caricati: riprova tra qualche secondo');
 const t=tdy();if(man){const o=prompt('Ore di manutenzione al giorno (attuale: '+(+M.oreG>0?M.oreG:16)+')',String(+M.oreG>0?M.oreG:16));if(o===null)return;const h=parseFloat(String(o).replace(',','.'));if(!(h>0&&h<=200))return mt('Numero di ore non valido');M.oreG=h;
  if(M.simA===t&&M.planD===t&&confirm('Ripianificare il futuro con '+h+' ore al giorno?\n(le attività pianificate dalla simulazione vengono ricalcolate)')){M.att=M.att.filter(a=>!(a.sim&&a.due&&a.due>t&&!a.ok.some(Boolean)));M.vis=M.vis.filter(v=>!v.sim||M.att.some(a=>a.vis===v.id));const k=pianSim();saveM();refresh();return mt('Ripianificate '+k+' attività con '+h+' ore al giorno')}
  if(M.simA===t&&M.planD===t){if(confirm('Simulazione già aggiornata a oggi.\n\nVuoi RIPARTIRE DA ZERO? La Beta viene cancellata e ricopiata da Ergo Plan, poi la simulazione viene rifatta.'))(FB.betaReset?FB.betaReset():Promise.reject(new Error('pagina non aggiornata, ricaricala e riprova'))).catch(er=>alert('Reset non riuscito: '+(er.message||FB.err(er))));return}
  if(M.simA!==t&&!confirm(M.simA?'Aggiornare la simulazione dal '+fd(M.simA)+' a oggi?':'Eseguire la simulazione degli ultimi 12 mesi?'))return}
 MN._sim=1;try{
 if(M.simA===t){const k=pianSim();saveM();refresh();return mt('Simulazione: '+k+' attività pianificate')}
 capB();const first=!M.simA,from=first?addM(t,-12):addD(M.simA,1),pool=poolB(),rnd=()=>pool[Math.floor(Math.random()*pool.length)];
 const AS=JSON.parse(JSON.stringify(M.ass)),IM=JSON.parse(JSON.stringify(M.imp)),II=id=>IM.find(x=>x.id===id);
 const Q=[];
 for(const s of AS){const p=P(s.proc);if(!p||p._miss||p.est||p.tipo==='evento'||!(+p.int))continue;const i=II(s.imp);if(!i||i.dism)continue;
  const pa=M.att.find(a=>a.ass===s.id);if(pa&&pa.due&&pa.due>=t)continue;
  let d=s.next&&s.next>=from?s.next:null;
  if(!d){const span=Math.max(1,Math.min(Math.round(p.int*30.4),365));d=first?addD(from,Math.floor(Math.random()*span)):from}
  if(d<=t)Q.push({s,p,i,d,pa})}
 // capacità giornaliera: quanto basta per distribuire il carico in modo uniforme
 const cnt={},add={},drop=new Set();let n=0;
 while(Q.length){Q.sort((a,b)=>a.d<b.d?-1:1);const q=Q[0];const mi=MINB(q.p);let ch=wkB(q.d<from?from:q.d);while((cnt[ch]||0)+mi>CAPMIN)ch=nxB(ch);
  if(ch>t){Q.shift();continue}cnt[ch]=(cnt[ch]||0)+mi;const {s,p,i}=q,mn=rnd();
  (add[ch.slice(0,4)]=add[ch.slice(0,4)]||[]).push({id:nid('a'),sim:1,vis:null,ass:s.id,imp:s.imp,comp:s.comp||null,proc:s.proc,due:q.d,man:mn,ok:p.steps.map(()=>true),foto:p.steps.map(()=>[]),note:'',chiusa:ch,esec:mn,parziale:0,_imp:i.cod+' '+i.nome,_cat:null,_cmp:CMP(s),_pcod:p.cod,_pdesc:p.desc,_norma:p.norma||''});
  s.last=ch;s.incompleto=null;s.next=addM(p.tipo==='cal'?q.d:ch,p.int);if(!i.avviato||i.avviato>ch)i.avviato=ch;if(q.pa)drop.add(q.pa.id);n++;
  if(s.next<=t)q.d=s.next;else Q.shift()}
 for(const y of Object.keys(add)){const arr=await storico(y,true);if(!arr)throw new Error('storico '+y+' non leggibile');
  {const all=arr.concat(add[y]),g={};all.forEach(a=>{const k=String(a.chiusa).slice(5,7);g[k]=(g[k]||0)+JSON.stringify(a).length});if(Math.max(...Object.values(g))>900000)throw new Error('lo storico di un mese del '+y+' supererebbe 1 MB')}}
 for(const y of Object.keys(add).sort()){const arr=H[y];arr.push(...add[y]);await saveYm(y);if(!(M.anni||[]).includes(y))(M.anni=M.anni||[]).push(y)}
 M.ass=AS;M.imp=IM;if(first)M.simDa=from;
 if(drop.size){M.att=M.att.filter(a=>!drop.has(a.id));M.vis=M.vis.filter(v=>M.att.some(a=>a.vis===v.id))}
 M.simA=t;(M.log=M.log||[]).push({t:new Date().toISOString().slice(0,16).replace('T',' '),chi:me()||'sistema',az:'Simulazione',att:null,imp:null,cod:'',man:null,txt:n+' attività simulate dal '+fd(from)+' al '+fd(t)+' (max '+(CAPMIN/60)+' ore al giorno)'});
 const np=pianSim();saveM();refresh();mt('Simulazione: '+n+' attività fatte dal '+fd(from)+' a oggi, '+Math.max(np,0)+' pianificate')}
 catch(er){mt('Simulazione NON riuscita: '+(er.message||FB.err(er)))}finally{MN._sim=0}}
"""
m=rep(m,"window.MNX=",SIM+"window.MNX=")
m=rep(m,"window.MNX={","window.MNX={simula,")
# Torna alla situazione di Ergo Plan (copia pulita, senza simulazione)
m=rep(m,"window.MNX={","window.MNX={betaBack(){if(!isR())return mt('Solo il responsabile manutenzione');if(!confirm('Tornare alla situazione attuale di Ergo Plan?\\n\\nTutti i dati della Beta (pianificazioni, chiusure, prove) vengono cancellati e ricopiati da Ergo Plan, senza simulazione. Ergo Plan non viene toccato.'))return;try{localStorage.setItem('epBetaNoSim','1')}catch(e){}(FB.betaReset?FB.betaReset():Promise.reject(new Error('ricarica la pagina e riprova'))).catch(er=>alert('Non riuscito: '+(er.message||FB.err(er))))},")
# menu dei 5 tocchi: simulazione oppure ritorno a Ergo Plan
m=rep(m,"window.MNX={","window.MNX={betaMenu(){if(!isR())return mt('Solo il responsabile manutenzione');ovl('<div class=\"mn-oh\"><h2>Ergo Plan Beta</h2><button class=\"btn\" onclick=\"MNX.close()\" aria-label=\"Chiudi\">✕</button></div><button class=\"btn\" onclick=\"MNX.close();MNX.simula(true)\">Simulazione: aggiorna a oggi / ore al giorno</button><button class=\"btn\" onclick=\"MNX.close();MNX.betaBack()\">↺ Torna a Ergo Plan (senza simulazione)</button>')},")
open(os.path.join(B,'manutenzione.js'),'w',encoding='utf-8').write(m)
man=json.load(open(os.path.join(R,'manifest.webmanifest'),encoding='utf-8'))
man.update(id='/pianificazione_commesse/beta/?app=ergoplanbeta',name='Ergo Plan Beta',short_name='EP Beta',start_url='/pianificazione_commesse/beta/?app=ergoplanbeta',scope='/pianificazione_commesse/beta/')
json.dump(man,open(os.path.join(B,'manifest.webmanifest'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('beta/ generata')
