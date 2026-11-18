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
s=rep(s,'<script src="manutenzione.js','<script>window.betaTap=(()=>{let n=0,t=0;return()=>{const k=Date.now();n=k-t<1500?n+1:1;t=k;if(n>=5){n=0;window.MNX&&MNX.simula&&MNX.simula(true)}}})();</script>\n<script src="manutenzione.js')
open(os.path.join(B,'index.html'),'w',encoding='utf-8').write(s)
m=open(os.path.join(R,'manutenzione.js'),encoding='utf-8').read()
m=m.replace("fetch('manut_std.json","fetch('../manut_std.json").replace("fetch('Procedura_LOTO.pdf","fetch('../Procedura_LOTO.pdf")
m=rep(m,"function start(){","function start(){MN._simT||(MN._simT=setInterval(()=>{if(M.simA&&M.planB===tdy())return clearInterval(MN._simT);if(M.simA){const k=pianSim();if(k>=0){clearInterval(MN._simT);saveM();refresh();mt('Simulazione: '+k+' attività pianificate')}return}simula(false)},5000));")
SIM=r"""

// pianifica la prossima scadenza di ogni procedura (anche fornitore; escluse quelle a evento): una visita per impianto e data, manutentore a caso
function pianSim(){if(!isR()||!MN.base||!MN.mainL||MN.noProc||!M.proc.length||MN.old)return -1;const t=tdy();
 let pool=(PERS()||[]).filter(Boolean);if(!pool.length)pool=[me()||'Manutentore'];const rnd=()=>pool[Math.floor(Math.random()*pool.length)];
 const wk=d=>{const x=new Date(d+'T12:00:00');while(x.getDay()===0||x.getDay()===6)x.setDate(x.getDate()+1);return isoL(x)};
 const g={};let n=0;
 for(const s of M.ass){const p=P(s.proc);if(!p||p._miss||p.tipo==='evento'||!(+p.int))continue;const i=I(s.imp);if(!i||i.dism||planned(s))continue;
const d=wk(s.next&&s.next>t?s.next:addD(t,1));(g[s.imp+'|'+d]=g[s.imp+'|'+d]||[]).push(s)}
 for(const k of Object.keys(g)){const [imp,d]=k.split('|'),man=rnd(),v={id:nid('v'),imp,data:d,man};M.vis.push(v);
  g[k].forEach(s=>{const r=pend(s);if(r){r.due=d;r.vis=v.id;r.man=man}else newAtt(s,d,v.id,man);s.man=man;n++});const i=I(imp);if(!i.avviato)i.avviato=d}
 M.planB=t;if(n)(M.log=M.log||[]).push({t:new Date().toISOString().slice(0,16).replace('T',' '),chi:me()||'sistema',az:'Simulazione',att:null,imp:null,cod:'',man:null,txt:n+' attività pianificate'});return n}
// ===== Ergo Plan Beta: simulazione delle manutenzioni fatte (ultimi 12 mesi, poi aggiornabile a oggi) =====
// Esclude: procedure a evento, interventi con fornitore esterno, impianti dismessi, attività già pianificate da oggi in poi.
async function simula(man){
 if(MN._sim)return;if(!isR())return man&&mt('Solo il responsabile manutenzione può aggiornare la simulazione');
 if(!MN.base||!MN.mainL||MN.noProc||!M.proc.length||MN.old)return man&&mt('Dati non ancora caricati: riprova tra qualche secondo');
 const t=tdy();if(man){if(M.simA===t&&M.planB===t){if(confirm('Simulazione già aggiornata a oggi.\n\nVuoi RIPARTIRE DA ZERO? La Beta viene cancellata e ricopiata da Ergo Plan, poi la simulazione viene rifatta.'))(FB.betaReset?FB.betaReset():Promise.reject(new Error('pagina non aggiornata, ricaricala e riprova'))).catch(er=>alert('Reset non riuscito: '+(er.message||FB.err(er))));return}if(!confirm(M.simA?'Aggiornare la simulazione dal '+fd(M.simA)+' a oggi?':'Eseguire la simulazione degli ultimi 12 mesi?'))return}
 MN._sim=1;try{
 if(M.simA===t){const k=pianSim();saveM();refresh();MN._sim=0;return mt('Simulazione: '+k+' attività pianificate')}
 const from=M.simA?addD(M.simA,1):addM(t,-12);
 let pool=(PERS()||[]).filter(Boolean);if(!pool.length)pool=[...new Set([...M.att.map(a=>a.man),...(M.fatte||[]).map(a=>a.esec||a.man)].filter(Boolean))];if(!pool.length)pool=[me()||'Manutentore'];
 const rnd=()=>pool[Math.floor(Math.random()*pool.length)],wk=d=>{const x=new Date(d+'T12:00:00');while(x.getDay()===0||x.getDay()===6)x.setDate(x.getDate()+1);return isoL(x)};
 const add={},drop=new Set();let n=0;const AS=JSON.parse(JSON.stringify(M.ass)),IM=JSON.parse(JSON.stringify(M.imp)),II=id=>IM.find(x=>x.id===id);
 for(const s of AS){const p=P(s.proc);if(!p||p._miss||p.est||p.tipo==='evento'||!(+p.int))continue;const i=II(s.imp);if(!i||i.dism)continue;
  const pa=M.att.find(a=>a.ass===s.id);if(pa&&pa.due&&pa.due>=t)continue;
  let d=s.next&&s.next>=from?s.next:from,k=0,did=0;
  while(d<=t&&k++<240){const ch=wk(d);if(ch>t)break;const mn=rnd();
   (add[ch.slice(0,4)]=add[ch.slice(0,4)]||[]).push({id:nid('a'),sim:1,vis:null,ass:s.id,imp:s.imp,comp:s.comp||null,proc:s.proc,due:d,man:mn,ok:p.steps.map(()=>true),foto:p.steps.map(()=>[]),note:'',chiusa:ch,esec:mn,parziale:0,_imp:i.cod+' '+i.nome,_cat:null,_cmp:CMP(s),_pcod:p.cod,_pdesc:p.desc,_norma:p.norma||''});
   s.last=ch;s.incompleto=null;s.next=addM(p.tipo==='cal'?d:ch,p.int);d=s.next;n++;did=1;if(!i.avviato||i.avviato>ch)i.avviato=ch}
  if(did&&pa)drop.add(pa.id)}
 for(const y of Object.keys(add)){const arr=await storico(y,true);if(!arr)throw new Error('storico '+y+' non leggibile');
  {const all=arr.concat(add[y]),g={};all.forEach(a=>{const k=String(a.chiusa).slice(5,7);g[k]=(g[k]||0)+JSON.stringify(a).length});const mx=Math.max(...Object.values(g));if(mx>900000)throw new Error('lo storico di un mese del '+y+' supererebbe 1 MB')}}
 for(const y of Object.keys(add).sort()){const arr=H[y];arr.push(...add[y]);await saveYm(y);if(!(M.anni||[]).includes(y))(M.anni=M.anni||[]).push(y)}
 M.ass=AS;M.imp=IM;
 if(drop.size){M.att=M.att.filter(a=>!drop.has(a.id));M.vis=M.vis.filter(v=>M.att.some(a=>a.vis===v.id))}
 M.simA=t;const np=pianSim();(M.log=M.log||[]).push({t:new Date().toISOString().slice(0,16).replace('T',' '),chi:me()||'sistema',az:'Simulazione',att:null,imp:null,cod:'',man:null,txt:n+' attività simulate dal '+fd(from)+' al '+fd(t)});
 saveM();refresh();mt('Simulazione: '+n+' attività fatte dal '+fd(from)+' a oggi, '+Math.max(np,0)+' pianificate')}
 catch(er){mt('Simulazione NON riuscita: '+(er.message||FB.err(er)))}finally{MN._sim=0}}
"""
m=rep(m,"window.MNX=",SIM+"window.MNX=")
m=rep(m,"window.MNX={","window.MNX={simula,")
open(os.path.join(B,'manutenzione.js'),'w',encoding='utf-8').write(m)
man=json.load(open(os.path.join(R,'manifest.webmanifest'),encoding='utf-8'))
man.update(id='/pianificazione_commesse/beta/?app=ergoplanbeta',name='Ergo Plan Beta',short_name='EP Beta',start_url='/pianificazione_commesse/beta/?app=ergoplanbeta',scope='/pianificazione_commesse/beta/')
json.dump(man,open(os.path.join(B,'manifest.webmanifest'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('beta/ generata')
