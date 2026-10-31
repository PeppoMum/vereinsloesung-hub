/* ===== Demo-Ansicht der Vereinslösung =====
   Wird nur aktiv, wenn die Adresse mit #demo:<rolle> endet. Alles läuft im Browser mit ERFUNDENEN Daten (Lorem-ipsum-Namen, erfundene Vereine).
   Es gibt keine Verbindung zur echten Datenbank, nichts wird gespeichert, ein Neuladen setzt alles zurück.
   Nichts geht nach draußen: keine Datenbank, keine Benachrichtigung, kein Kalender, kein WhatsApp/E-Mail/Teilen (siehe „Schutz“ unten).
   Die Demo hat einen eigenen Gerätespeicher und berührt nichts, was die echte App auf diesem Gerät gemerkt hat. */
(function(){
"use strict";
const ARTEN=[
  {id:"trainer",name:"Trainer",rechte:["sehen","bearbeiten","einstellungen","notizen","kader","kaderbearb","fachlesen"],gl:["kurz"]},
  {id:"cotrainer",name:"Co-Trainer",rechte:["sehen","bearbeiten","notizen","kader","kaderbearb","fachlesen"],gl:["kurz"]},
  {id:"sportleiter",name:"Sportlicher Leiter",rechte:["sehen","notizen","kader","hinweise"],gl:["plan"]},
  {id:"torwart",name:"Torwarttrainer",rechte:["sehen","tw"],gl:[]},
  {id:"athletik",name:"Athletiktrainer",rechte:["sehen","ath"],gl:[]},
  {id:"lesen",name:"Nur lesen",rechte:["sehen","notizen","kader"],gl:[]},
  {id:"scout",name:"Scout",rechte:["kader","kaderbearb"],gl:[]},
  {id:"platzwart",name:"Platzwart",rechte:[],gl:["plan"]}];
/* Rollen, die ein Demo-Link darstellen kann (konto: Spieler bzw. Eltern mit eigenem Konto, Mannschaft D1) */
const ROLLEN={
  "administrator":{n:"Administrator",rolle:"admin"},
  "jugendleiter":{n:"Jugendleiter",rolle:"jugendleiter"},
  "sportleiter-alle":{n:"Sportlicher Leiter (alle Mannschaften)",art:"sportleiter",teams:"*"},
  "sportleiter-d":{n:"Sportlicher Leiter (nur D1 und D2)",art:"sportleiter",teams:["d1","d2"]},
  "trainer":{n:"Trainer (D1, Stufe Voll)",art:"trainer",teams:["d1"]},
  "trainer-standard":{n:"Trainer (D2, Stufe Standard)",art:"trainer",teams:["d2"]},
  "trainer-basis":{n:"Trainer (E2, Stufe Basis)",art:"trainer",teams:["e2"]},
  "cotrainer":{n:"Co-Trainer (D1)",art:"cotrainer",teams:["d1"]},
  "torwarttrainer":{n:"Torwarttrainer (alle)",art:"torwart",teams:"*"},
  "athletiktrainer":{n:"Athletiktrainer (alle)",art:"athletik",teams:"*"},
  "nur-lesen":{n:"Nur Ansicht (D1)",art:"lesen",teams:["d1"]},
  "scout":{n:"Scout (D1)",art:"scout",teams:["d1"]},
  "platzwart":{n:"Platzwart",rolle:"platzwart"},
  "spieler":{n:"Spieler mit Konto (D1)",konto:"spieler"},
  "eltern":{n:"Eltern mit Konto (D1)",konto:"eltern"}};
window.__DEMO_ROLLEN=ROLLEN;
/* Eingebettete Fenster einer Demo arbeiten mit den Daten des Hauptfensters:
   die Vorschau für Trainer (?vorschau=s|e) und die unsichtbare Vorbereitung der Spieler-/Elternansicht (#demo:vorbereiten). */
let PAR=null;try{if(window.parent!==window&&window.parent.__DEMOSTORE)PAR=window.parent}catch(e){}
const m=/^#demo:([a-z0-9-]{2,30})$/.exec(location.hash||"");
const VSF=!!PAR&&/[?&]vorschau=[se](&|$)/.test(location.search);
if(!m&&!VSF)return;
const PREP=!!PAR&&!!m&&m[1]==="vorbereiten";
/* Die Demo braucht keine echten Zugangswerte. Fehlen sie (z. B. eine Kopie ohne firebase-config.js), bekommt die Seite erfundene,
   damit Spieler-/Elternansicht und Vorschau trotzdem laufen – alle Anfragen beantwortet ohnehin der Demo-Speicher (siehe „Schutz“). */
{const c=window.U13_FIREBASE||{};if(!(c.apiKey&&c.projectId&&c.authDomain)||/DEIN|EINTRAGEN|XXXX/i.test(String(c.apiKey)+c.projectId))window.U13_FIREBASE={apiKey:"demo",projectId:"demo",authDomain:"demo.invalid",appId:"demo"};}

/* ---------- Eigener Gerätespeicher ----------
   Die echte App merkt sich auf dem Gerät z. B. noch nicht gesendete Änderungen und die gewählte Mannschaft. Die Demo darf das weder sehen
   noch verändern: localStorage und sessionStorage zeigen hier auf einen eigenen Bereich (je Rolle, nur in diesem Fenster). Nur die Darstellung
   (Hell/Dunkel) wird einmal übernommen. */
{const RS=(()=>{try{return window.sessionStorage}catch(e){return null}})(),M=new Map();
  const mk=(pre)=>{
    const keys=()=>{const o=[];try{for(let i=0;i<RS.length;i++){const k=RS.key(i);if(k&&k.indexOf(pre)===0)o.push(k.slice(pre.length))}}catch(e){M.forEach((v,k)=>{if(k.indexOf(pre)===0)o.push(k.slice(pre.length))})}return o};
    const g=(k)=>{try{return RS.getItem(pre+k)}catch(e){return M.has(pre+k)?M.get(pre+k):null}};
    const s=(k,v)=>{try{RS.setItem(pre+k,String(v))}catch(e){M.set(pre+k,String(v))}};
    const r=(k)=>{try{RS.removeItem(pre+k)}catch(e){}M.delete(pre+k)};
    return{getItem:(k)=>g(String(k)),setItem:(k,v)=>s(String(k),v),removeItem:(k)=>r(String(k)),clear:()=>keys().forEach(r),key:(i)=>keys()[i]||null,get length(){return keys().length}}};
  const tag=VSF?"vorschau":m[1],th=(()=>{try{return window.localStorage.getItem("u13theme")}catch(e){return null}})();
  const LS=mk("demo."+tag+".l."),SS=mk("demo."+tag+".s.");
  if(th&&LS.getItem("u13theme")==null)LS.setItem("u13theme",th);
  try{Object.defineProperty(window,"localStorage",{configurable:true,get:()=>LS})}catch(e){}
  try{Object.defineProperty(window,"sessionStorage",{configurable:true,get:()=>SS})}catch(e){}}

/* ---------- Schutz: aus der Demo geht nichts nach draußen ----------
   Anfragen an die Datenbank über das Netz (wie sie Spielerlinks und Konten stellen) beantwortet der Demo-Speicher, ohne dass etwas gesendet wird.
   Alles andere außerhalb dieser Seite wird abgewiesen. WhatsApp, E-Mail, Teilen und Kalender gibt es in der Demo nicht. */
const same=(u)=>{try{return new URL(String(u),location.href).origin===location.origin}catch(e){return false}};
const BLOCK=/^(mailto|sms|tel|whatsapp|intent|webcal):|^https?:\/\/([a-z0-9-]+\.)*(wa\.me|whatsapp\.com|t\.me|telegram\.me|signal\.me|accounts\.google\.com|calendar\.google\.com|outlook\.live\.com|outlook\.office\.com)(\/|$)/i;
let noteT=null;
const note=(t)=>{const sh=()=>{let n=document.getElementById("demonote");if(!n){n=document.createElement("div");n.id="demonote";n.setAttribute("role","status");n.style.cssText="position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99999;max-width:min(92vw,460px);background:#7c3aed;color:#fff;font:14px/1.4 system-ui,sans-serif;padding:10px 14px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.25);text-align:center";document.body.appendChild(n)}
  n.textContent=t;n.hidden=false;clearTimeout(noteT);noteT=setTimeout(()=>{n.hidden=true},4500)};if(document.body)sh();else document.addEventListener("DOMContentLoaded",sh)};
window.__demoNote=note;
const toFs=(v)=>{if(v==null)return{nullValue:null};if(typeof v==="boolean")return{booleanValue:v};if(typeof v==="number")return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};if(Array.isArray(v))return{arrayValue:{values:v.map(toFs)}};if(typeof v==="object"){const f={};Object.keys(v).forEach((k)=>{f[k]=toFs(v[k])});return{mapValue:{fields:f}}}return{stringValue:String(v)}};
const fromFs=(v)=>!v?null:v.stringValue!=null?v.stringValue:v.integerValue!=null?+v.integerValue:v.doubleValue!=null?v.doubleValue:v.booleanValue!=null?v.booleanValue:v.timestampValue!=null?v.timestampValue:v.arrayValue?(v.arrayValue.values||[]).map(fromFs):v.mapValue?Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,fromFs(x)])):null;
const ISO=/^\d{4}-\d\d-\d\dT\d\d:\d\d/;
const fields=(o)=>{const f={};Object.keys(o||{}).forEach((k)=>{f[k]=k==="at"&&typeof o[k]==="string"&&ISO.test(o[k])?{timestampValue:o[k]}:toFs(o[k])});return f};
function guard(store,kick){
  const NAME="projects/demo/databases/(default)/documents/";
  const res=(code,body)=>Promise.resolve(new Response(JSON.stringify(body||{}),{status:code,headers:{"Content-Type":"application/json"}}));
  /* Firestore über das Netz (REST): nur der Demo-Speicher antwortet */
  const rest=(u,meth,body)=>{
    const mm=/\/databases\/[^/]+\/documents\/(.+)$/.exec(u.pathname);if(!mm)return res(403,{});
    const key=mm[1].split("/").map(decodeURIComponent).join("/"),seg=key.split("/").length,qs=u.searchParams;
    if(meth==="GET"){
      if(seg%2===0){const d=store.get(key);return d===undefined?res(404,{}):res(200,{name:NAME+key,fields:fields(d)})}
      const dep=seg+1,docs=[];store.forEach((v,k)=>{if(k.indexOf(key+"/")===0&&k.split("/").length===dep)docs.push({name:NAME+k,fields:fields(v)})});return res(200,docs.length?{documents:docs}:{})}
    let b={};try{b=body?JSON.parse(body):{}}catch(e){}
    const o={};Object.keys(b.fields||{}).forEach((k)=>{o[k]=fromFs(b.fields[k])});
    if(meth==="POST"){const id=qs.get("documentId")||Math.random().toString(36).slice(2),k=key+"/"+id;if(store.has(k))return res(409,{});store.set(k,o);kick();return res(200,{name:NAME+k,fields:b.fields||{}})}
    if(meth==="PATCH"){const mask=qs.getAll("updateMask.fieldPaths");if(qs.get("currentDocument.exists")==="true"&&!store.has(key))return res(404,{});
      if(mask.length){const cur={...(store.get(key)||{})};mask.forEach((f)=>{if(f in o)cur[f]=o[f];else delete cur[f]});store.set(key,cur)}else store.set(key,o);kick();return res(200,{name:NAME+key,fields:fields(store.get(key))})}
    if(meth==="DELETE"){store.delete(key);kick();return res(200,{})}
    return res(403,{})};
  const F0=window.fetch.bind(window);
  window.fetch=function(inp,init){
    const url=typeof inp==="string"?inp:inp&&inp.url?inp.url:String(inp);
    if(same(url))return F0(inp,init);
    let u=null;try{u=new URL(url)}catch(e){}
    const meth=String((init&&init.method)||(inp&&typeof inp==="object"&&inp.method)||"GET").toUpperCase();
    if(u&&u.hostname==="firestore.googleapis.com")return rest(u,meth,init&&init.body);
    return Promise.reject(new TypeError("Demo: keine Verbindung nach außen"))};
  try{const XO=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(meth,u){if(!same(u))throw new TypeError("Demo: keine Verbindung nach außen");return XO.apply(this,arguments)}}catch(e){}
  try{navigator.sendBeacon=()=>false}catch(e){}
  for(const C of["WebSocket","EventSource"]){const O=window[C];if(!O)continue;const W=function(u,x){if(!same(String(u).replace(/^ws/i,"http")))throw new TypeError("Demo: keine Verbindung nach außen");return new O(u,x)};W.prototype=O.prototype;try{window[C]=W}catch(e){}}
  /* Skripte und eingebettete Seiten nur von dieser Seite (z. B. keine Google-Anmeldung für den Kalender) */
  for(const [El,a] of[[window.HTMLScriptElement,"src"],[window.HTMLIFrameElement,"src"]]){if(!El)continue;const d=Object.getOwnPropertyDescriptor(El.prototype,a);if(!d||!d.set)continue;
    Object.defineProperty(El.prototype,a,{configurable:true,enumerable:d.enumerable,get:d.get,set(v){if(!same(v)){const me=this;setTimeout(()=>{try{me.dispatchEvent(new Event("error"))}catch(e){}},0);return}d.set.call(this,v)}})}
  {const SA=Element.prototype.setAttribute;Element.prototype.setAttribute=function(n,v){if(String(n).toLowerCase()==="src"&&(this instanceof HTMLScriptElement||this instanceof HTMLIFrameElement)&&!same(v))return;return SA.call(this,n,v)}}
  /* Nachrichten, E-Mail, Teilen, Kalender: nur ein Hinweis */
  const WO=window.open;window.open=function(u){if(u&&BLOCK.test(String(u))){note("In der Demo wird nichts verschickt.");return null}return WO.apply(window,arguments)};
  document.addEventListener("click",(e)=>{const a=e.target&&e.target.closest&&e.target.closest("a[href]");if(a&&BLOCK.test(a.getAttribute("href")||"")){e.preventDefault();e.stopPropagation();note("In der Demo wird nichts verschickt.")}},true);
  try{Object.defineProperty(navigator,"share",{configurable:true,value:()=>{note("In der Demo wird nichts geteilt.");return Promise.reject(Object.assign(new Error("Demo"),{name:"AbortError"}))}})}catch(e){}
  try{Object.defineProperty(navigator,"canShare",{configurable:true,value:()=>false})}catch(e){}
  try{if(window.Notification)Object.defineProperty(Notification,"requestPermission",{configurable:true,value:()=>Promise.resolve("denied")})}catch(e){}
}
if(VSF){const st=PAR.__DEMOSTORE;guard(st,()=>{try{PAR.__DEMOKICK()}catch(e){}});window.__DEMOVS=true;return}

const P=PREP?{n:"Vorbereitung",art:"trainer",teams:["d1"]}:ROLLEN[m[1]]||ROLLEN.administrator;
const KONTO=P.konto?P:null;
window.__DEMO={key:m[1],label:P.n,roles:ROLLEN};window.__DEMODB=true;   /* Demo mit eigenem Demo-Speicher (anders als der Link „Demo Trainer“, der nur einen festen Stand zeigt) */
if(KONTO)window.__DEMOKONTO=true;
const EMAIL=PREP?"vorbereitung@beispiel.test":"demo@beispiel.test";

/* ---------- Zufall mit festem Startwert: jede Demo sieht gleich aus ---------- */
let sd=20260901;const R=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const ri=(a,b)=>a+Math.floor(R()*(b-a+1)),pick=(a)=>a[Math.floor(R()*a.length)],shuf=(a)=>a.map((x)=>[R(),x]).sort((p,q)=>p[0]-q[0]).map((x)=>x[1]);
const pad=(n)=>String(n).padStart(2,"0"),iso=(d)=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const addD=(s,n)=>{const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return iso(d)};
const TODAY=iso(new Date());
const dow=(s)=>{const g=new Date(s+"T12:00:00").getDay();return g===0?7:g};
const MON=addD(TODAY,1-dow(TODAY));
const FN="Max Leon Finn Noah Paul Ben Luca Elias Jonas Felix Tim Malte Emil Anton Jan Moritz Lukas Kilian Carl Ole Mats Hugo Levi Niklas".split(" ");
const LN="Muster Beispiel Probe Demo Test Platzhalter Exempel Sample Vorlage Modell Schema Entwurf Beleg Kopie Attrappe Nachbau Muster-Meier Probst Beispieler".split(" ");
const CL="SV Musterstadt|FC Beispieldorf|TuS Platzhausen|SC Testfeld|Spvgg Demotal|BV Probeheim|VfL Zufallsburg|SG Loremberg|DJK Ipsumhagen|FSV Sampledorf|TSV Fiktivstadt|RW Exempelau".split("|");
const TEAMS=[["m1","Minis","U6"],["g1","G1","U7"],["f2","F2","U8"],["f1","F1","U9"],["e2","E2","U10"],["e1","E1","U11"],["d2","D2","U12"],["d1","D1","U13"],["c2","C2","U14"],["c1","C1","U15"],["b1","B1","U17"],["a1","A1","U19"]];
/* Anstoßzeiten am Wochenende je Mannschaft verteilt (für die Kabinen-Automatik); Kleine zuerst */
const ANSTOSS={m1:"09:30",g1:"09:30",f2:"10:00",f1:"10:00",e2:"11:00",e1:"11:00",d2:"12:15",d1:"12:15",c2:"13:30",c1:"13:30",b1:"15:00",a1:"16:30"},anstoss=(tid)=>ANSTOSS[tid]||"10:30";
const FORM={m1:["3gg3",3],g1:["4gg4",4],f1:["5gg5",5],f2:["5gg5",5],e1:["7gg7",7],e2:["7gg7",7],d1:["9gg9",9],d2:["9gg9",9],c1:["11gg11",11],c2:["9gg9",9],b1:["11gg11",11],a1:["11gg11",11]};

/* Erzeugt wird immer (gleicher Zufall), eingebettete Fenster benutzen danach aber die Daten des Hauptfensters (DB unten) */
const store=new Map();
const put=(p,d)=>store.set(p,JSON.parse(JSON.stringify(d)));

/* ---------- Mannschaften mit erfundenen Daten ---------- */
TEAMS.forEach(([tid,name],ti)=>{
  const [form,nF]=FORM[tid],cnt=nF+ri(4,6),pl=[];
  for(let i=0;i<cnt;i++){const k=(ti*3+i*5)%FN.length;pl.push({id:"p"+(i+1),slot:i+1,vorname:FN[k],name:LN[(k*7+i+ti)%LN.length],geburtsdatum:(2013-ti%4)+"-"+pad(ri(1,12))+"-"+pad(ri(1,28)),positionen:i===0?["TW"]:shuf(["IV","AV","ZM","OM","ST","FL"]).slice(0,ri(1,2)),torwart:i===0,aktiv:true,nr:i+1})}
  pl.forEach((p)=>put(tid+"__players/"+p.id,p));
  const ids=pl.map((p)=>p.id);
  [-35,-28,-21,-14,-7].forEach((off,i)=>{const d=addD(TODAY,off),sp={};ids.forEach((id)=>{const r=R();sp[id]=r<.75?"x":r<.85?"e":r<.92?"u":"v"});put(tid+"__trainings/t"+i,{id:"t"+i,datum:d,spieler:sp})});
  const gl=[];
  [-54,-40,-26,-12,-5,4,11,25].forEach((off,i)=>{let d=addD(TODAY,off);while(dow(d)<6)d=addD(d,1);const past=d<TODAY,sp={};
    ids.forEach((id,j)=>{const r=R();sp[id]=past&&r<.7?{status:"k",minuten:Math.round(30*(1+R()))}:{status:past?"t":"n",minuten:0}});
    const noRes=/^[fgm]/.test(tid),to=past&&!noRes?pick([0,1,2,3,4]):null,gg=past&&!noRes?pick([0,1,2,3]):null;if(past&&!noRes)gl.push([d,to,gg]);   /* F- und G-Jugend: Spiele ohne Wertung, keine Ergebnisse */
    put(tid+"__games/g"+(i+1),{id:"g"+(i+1),nr:i+1,datum:d,art:/^[fgm]/.test(tid)?"Turnier":"Meisterschaft",dauer:60,form,gewichtet:true,spielerzahl:nF,gegner:pick(CL),ha:i%2?"A":"H",tore:to,gt:gg,wertung:true,spieler:past?sp:{}})});
  /* weitere gespielte Spiele, damit jede Mannschaft 9 Ergebnisse für die Formkurve hat */
  for(let k=0;!/^[fgm]/.test(tid)&&gl.length<9;k++){let d=addD(TODAY,-61-7*k);while(dow(d)<6)d=addD(d,1);const to=pick([0,1,2,3,4]),gg=pick([0,1,2,3]),sp={};ids.forEach((id)=>{sp[id]={status:R()<.7?"k":"t",minuten:30}});gl.push([d,to,gg]);
    put(tid+"__games/gv"+k,{id:"gv"+k,nr:20+k,art:"Meisterschaft",datum:d,dauer:60,form,gewichtet:true,spielerzahl:nF,gegner:pick(CL),ha:k%2?"A":"H",tore:to,gt:gg,wertung:true,spieler:sp})}
  /* Termine bis Ende Dezember (Auswertungen zählen trotzdem nur bis heute) */
  {const END=TODAY.slice(0,4)+"-12-31";let n=0,gi=8;
   for(let d=addD(TODAY,1);d<=END;d=addD(d,1)){const w=dow(d);
    if(w===2||w===4){put(tid+"__trainings/tf"+(n++),{id:"tf"+n,datum:d,spieler:{}})}
    if(w===6&&Math.round((new Date(d+"T12:00:00")-new Date(TODAY+"T12:00:00"))/864e5/7)%2===ti%2&&d>addD(TODAY,26)&&d<=TODAY.slice(0,4)+"-12-20"){put(tid+"__games/g"+gi,{id:"g"+gi,nr:gi,datum:d,art:/^[fgm]/.test(tid)?"Turnier":"Meisterschaft",dauer:60,form,gewichtet:true,spielerzahl:nF,gegner:pick(CL),ha:gi%2?"A":"H",tore:null,gt:null,wertung:true,spieler:{}});gi++}}
   const Y=TODAY.slice(0,4);
   [[Y+"-11-12","Termin","Elternabend","19:00",true],[Y+"-11-21","Turnier","Hallenturnier Musterstadt","10:00",true],[Y+"-12-04","Termin","Trainersitzung","20:00",false],[Y+"-12-12","Turnier","Nikolausturnier","09:30",true],[Y+"-12-18","Termin","Weihnachtsfeier","18:00",true]].forEach((e,i)=>{if(e[0]>TODAY)put(tid+"__events/ef"+i,{id:"ef"+i,datum:e[0],typ:e[1],titel:e[2],zeit:e[3],ort:e[4]?"Vereinsheim Musterstadt":"",eltern:e[4]})})}
  {const bet=.7+R()*.25,zt=.55+R()*.35;put(tid+"__vstat/main",{tid,ak:TEAMS[ti][2],n:cnt,tr:5,sp:gl.length,bet,betl:bet,zeit:zt,min:40,low:ri(0,2),lt:addD(TODAY,-7),ls:gl.length?gl.sort().slice(-1)[0][0]:null,naechste:[],fbet:bet>.9?4:bet>.8?3:2,fzeit:zt>.7?4:zt>.6?3:2,form:gl.slice().sort((x,y)=>y[0].localeCompare(x[0])).slice(0,5).map((g)=>g[1]>g[2]?"S":g[1]<g[2]?"N":"U").join(""),at:new Date().toISOString(),upd:new Date().toISOString()})}
  put(tid+"__events/e1",{id:"e1",datum:addD(TODAY,6),typ:"Termin",titel:"Elternabend",zeit:"19:00",ort:"Vereinsheim Musterstadt",eltern:true});
  put(tid+"__events/e2",{id:"e2",datum:addD(TODAY,9),typ:"Termin",titel:"Trainersitzung",zeit:"20:00",eltern:false});
  put(tid+"__dienste/d1",{id:"d1",art:"Materialdienst",datum:MON,bis:addD(MON,6),label:"Gruppe 1",spieler:ids.slice(0,2)});
  put(tid+"__todos/t1",{id:"t1",typ:"todo",text:"Lorem ipsum Bälle aufpumpen.",datum:addD(TODAY,3),wer:"Max Mustermann",done:false});
  put(tid+"__todos/t2",{id:"t2",typ:"todo",text:"Dolor sit amet Trikots abholen.",datum:null,wer:null,done:true});
  put(tid+"__notes/n1",{id:"n1",pid:ids[1],datum:addD(TODAY,-10),art:"notiz",kategorie:"Allgemein",text:"Lorem ipsum dolor sit amet, consetetur sadipscing elitr.",sichtbar:false});
  /* Kaderplanung für die kommende Saison + Scouting-Datenbank (erfundene Personen) */
  {const n0=+TEAMS[ti][2].slice(1),n=Math.min(19,n0+1),sa="2027/28",plid="kp"+tid,pt=n%2===0?n+1:n-1,auto=Array.from(new Set([n-1,n,pt])).filter((x)=>x>=6&&x<=19);
   const TWn=n<=10?0:2,POS=n<=11?[...(TWn?[["Torwart",TWn,1]]:[]),["Abwehr",4,0],["Mittelfeld",5,0],["Angriff",3,0]]:[["Torwart",2,1],["Innenverteidiger",n<=13?3:4,0],["Außenverteidiger",n<=13?2:4,0],["Zentrales MF",n<=13?4:5,0],["Außenmittelfeld",0,0],["Flügel",3,0],["Stürmer",2,0]];
   const lk=(id,name,c,z)=>({id,name,c,z:z||0});
   const plan={id:plid,name:"U"+n+" "+sa,stufe:"U"+n,saison:sa,ziel:{f:n<=11?12:n<=13?14:18,t:TWn},min:{f:n<=11?11:n<=13?13:17,t:TWn?1:0},max:{f:n<=11?14:n<=13?16:20,t:TWn},frist:"2028-04-30",fristName:"Go/No-Go-Entscheidung",
    pos:POS.map((x,i)=>({id:"x"+i,name:x[0],soll:x[1],tw:!!x[2]})),
    status:[lk("go","Fest eingeplant (Go)","g",1),lk("gof","Wackelkandidat (Go mit Frist)","y",1),lk("ngf","Entwicklungsfall (No-Go mit Frist)","o",1),lk("ng","Keine Perspektive (No-Go)","r",0)],
    rollen:[{id:"an",name:"Ankerspieler",c:"g"},{id:"st",name:"Startelf",c:"b"},{id:"sr",name:"Startelf bis Rotation",c:"ac"},{id:"rp",name:"Rotation, großes Entwicklungspotenzial",c:"p"},{id:"ro",name:"Rotation",c:"be"}],
    phasen:[lk("be","Im Blick","b"),lk("ka","Kontakt & Gespräch","ac"),lk("pe","Probetraining eingeladen","y"),lk("pa","Probetraining","o"),lk("en","Entscheidungsfindung","y"),lk("zu","Zusage","g",1),{id:"ab",name:"Absage",c:"r",z:0,aus:1}],
    prios:[{id:"a",name:"A – Wunschspieler",c:"n1"},{id:"b",name:"B – hoch",c:"n2"},{id:"c",name:"C – mittel",c:"n3"},{id:"d",name:"D – niedrig",c:"n4"}],
    wk:[{id:"zu",name:"Zugesagt",c:"g",p:100,z:1},{id:"sw",name:"Sehr wahrscheinlich",c:"g",p:80},{id:"wa",name:"Wahrscheinlich",c:"y",p:60},{id:"un",name:"Unsicher",c:"o",p:40},{id:"en",name:"Eher nicht",c:"r",p:20},{id:"ab",name:"Abgang / Absage",c:"gr",p:0,a:1}],
    krit:[{id:"te",name:"Technik"},{id:"ta",name:"Taktik"},{id:"at",name:"Athletik"},{id:"pe",name:"Persönlichkeit"}]};
   put(tid+"__kplan/"+plid,plan);
   const posNames=POS.map((x)=>x[0]),mk=(id,o)=>put(tid+"__kperson/"+id,Object.assign({id,typ:"extern",vorname:"",name:"",geb:"",verein:"",mannschaft:"",nr:"",fuss:"",groesse:"",telM:"",telV:"",mail:"",adresse:"",pos:{},kr:{},manuell:null,staerken:"",schwaechen:"",notiz:"",beob:[],kontakt:[],probe:[],plans:{}},o));
   /* eigene Spieler: bleiben sie? */
   pl.forEach((pp,i)=>{const r=R(),wk=r<.55?"sw":r<.75?"wa":r<.9?"un":"zu";mk("kq_e"+pp.id,{typ:"eigen",sid:pp.id,pos:{[pp.torwart&&TWn?posNames[0]:posNames[(TWn?1:0)+i%(posNames.length-(TWn?1:0))]]:2},plans:{[plid]:{status:r<.8?"go":r<.92?"gof":"ngf",rolle:pick(["an","st","sr","rp","ro"]),wk,phase:"",prio:"",kontakt:false,wunsch:"",next:{}}}})});
   /* gescoutete Spieler: Jahrgänge nach Regel sichtbar, zwei bewusst außerhalb */
   const ages=auto.concat([n+3<=19?n+3:n-3,n-3>=6?n-3:n+4]);
   ages.forEach((a,i)=>{for(let k=0;k<(i<auto.length?3:1);k++){const id="kq_x"+i+"_"+k,vor=pick(FN),nach=pick(LN),r=R(),ph=pick(["be","be","ka","pe","pa","en","zu"]),by=2028-a,inP=i<auto.length&&k<2;
      mk(id,{vorname:vor,name:nach+" (Demo)",geb:by+"-"+pad(ri(1,12))+"-"+pad(ri(1,28)),verein:pick(CL),mannschaft:"U"+(a-1)+" / "+pick(["1","2"]),nr:String(ri(2,18)),fuss:pick(["rechts","links","beidfüßig"]),groesse:String(ri(140,175)),
        pos:{[pick(posNames)]:2},kr:{te:ri(5,9),ta:ri(4,9),at:ri(4,9),pe:ri(5,9)},staerken:"Lorem ipsum: schnell, gutes Auge.",schwaechen:"Dolor sit amet: Zweikampfverhalten.",notiz:"Erfundene Demo-Person.",
        beob:[{id:"b"+id,datum:addD(TODAY,-ri(5,40)),bew:ri(5,9),text:"Beispielhafte Beobachtung (erfunden).",von:"Demo-Scout"}],
        plans:inP?{[plid]:{phase:ph,prio:pick(["a","b","c"]),rolle:"",kontakt:r<.3,wunsch:"",next:{}}}:{}})}});
   put(tid+"__kobs/ko1",{id:"ko1",verein:CL[ti%CL.length],mannschaft:"U"+(n-1),datum:addD(TODAY,ri(2,9)),zeit:"11:00",entf:ri(5,40)+" km",status:"geplant",blick:"Beispiel: Rechtsverteidiger beobachten",notiz:"",personIds:[]});
   put(tid+"__kobs/ko2",{id:"ko2",verein:CL[(ti+4)%CL.length],mannschaft:"U"+n,datum:addD(TODAY,-ri(6,20)),zeit:"10:00",entf:ri(5,40)+" km",status:"erledigt",blick:"",notiz:"Erledigt (erfunden)",personIds:[]})}
  put(tid+"__config/main",{saison:"2026/27",mannschaft:name,kontakte:[{titel:"Trainerteam",zeilen:"Max Mustermann · 0123 456789"}],zaehlendeAbwesenheiten:{e:true,u:true,v:false,t:false},spielformen:[{id:form,name:nF+" gegen "+nF,spieler:nF}],staff:[{id:"s1",name:"Max Mustermann",rolle:"Trainer",owner:true}]});
});

/* ---------- FUSSBALL.DE (erfundene Daten: Spielplan, Tabelle, Abweichungen zum Ausprobieren) ---------- */
{
  const NAMES=["SV Musterstadt","FC Beispieldorf","TuS Platzhausen","SC Testfeld","Spvgg Demotal","BV Probeheim","VfL Zufallsburg","SG Loremberg"];
  const fdid=(t)=>"DEMO"+t.toUpperCase()+"00000000000000000000";
  const gamesOf=(tid)=>[...store.entries()].filter(([k])=>k.indexOf(tid+"__games/")===0).map(([,v])=>v).sort((a,b)=>a.datum.localeCompare(b.datum));
  TEAMS.forEach(([tid])=>gamesOf(tid).forEach((g,i)=>{g.nr=i+1;put(tid+"__games/"+g.id,g)}));   /* Spielnummern fortlaufend nach Datum */
  const idx={v:1,stand:new Date(Date.now()-2*36e5).toISOString(),aktiv:true,teams:{}};
  [["a1",true,2],["b1",true,1],["c1",true,6],["c2",true,3],["d1",true,3],["d2",true,5],["e1",true,4],["e2",true,7],["f1",false,0],["f2",false,0],["g1",false,0],["m1",false,0]].forEach(([tid,liga,platz])=>{   /* Tabellen für alle Mannschaften bis einschließlich U10 (und D1/D2) */
    const AK={a:["Bezirksliga A-Junioren","A-Junioren"],b:["Kreisliga A B-Junioren","B-Junioren"],c:["Kreisliga B C-Junioren","C-Junioren"],m:["Spielfest","Bambini"],d:["Kreisliga B D-Junioren","D-Junioren"],e:["Kreisliga C E-Junioren","E-Junioren"],f:["Spielfest","F-Junioren"],g:["Spielfest","Bambini"]}[tid[0]];
    const cfg=store.get(tid+"__config/main");
    cfg.fd={team:"https://www.fussball.de/mannschaft/demo/-/saison/2627/team-id/"+fdid(tid)+"#!/",liga:liga?"https://www.fussball.de/spieltagsuebersicht/demo/-/staffel/DEMOSTAFFEL#!/":""};put(tid+"__config/main",cfg);
    const own="TuS Musterstadt "+tid.toUpperCase(),gs=gamesOf(tid),sp=[],fut=gs.filter((g)=>g.datum>=TODAY);
    gs.forEach((g,i)=>{
      const past=g.datum<TODAY,h=g.ha==="H",f={id:"DG"+tid+i,d:g.datum,z:anstoss(tid),wett:liga?AK[0]:"Spielfest",alt:AK[1],heim:h?own:g.gegner,gast:h?g.gegner:own,st:"",ht:null,gt:null,ort:"Sportanlage Musterstadt, Beispielweg 1, 12345 Musterstadt",ortUrl:"",h};
      if(past){f.ht=h?g.tore:g.gt;f.gt=h?g.gt:g.tore;g.fd=f.id}
      else{const k=fut.indexOf(g);
        if(k===0){g.fd=f.id;f.z="11:00"}                 /* verknüpft, Anstoß wird still ergänzt */
        else if(k===1){/* unverknüpft, gleicher Tag und Gegner: wird still verbunden */}
        else if(k===2&&tid==="d1"){g.fd=f.id;f.d=addD(g.datum,1);f.z="11:00"}   /* verlegt: App fragt */
        else if(k===3&&tid==="d1"){const o=NAMES.find((n)=>n!==g.gegner&&n!==NAMES[0]&&n!==own);f.heim=h?own:o;f.gast=h?o:own}  /* gleicher Tag, anderer Gegner: App fragt */}
      put(tid+"__games/"+g.id,g);sp.push(f)});
    if(tid==="d1"){const last=fut[fut.length-1],d=addD(last?last.datum:TODAY,14);sp.push({id:"DG"+tid+"neu",d,z:"10:30",wett:"Kreisliga B D-Junioren",alt:"D-Junioren",heim:NAMES[3],gast:own,st:"",ht:null,gt:null,ort:"Sportplatz Testfeld, Probeweg 2",ortUrl:"",h:false});
      sp.push({id:"DG"+tid+"fr",d:addD(d,7),z:"11:00",wett:"Freundschaftsspiele",alt:"D-Junioren",heim:own,gast:NAMES[6],st:"",ht:null,gt:null,ort:"",ortUrl:"",h:true})}
    sp.sort((a,b)=>(a.d+a.z).localeCompare(b.d+b.z));
    const opps=NAMES.filter((n)=>n!==NAMES[0]).slice(0,7),tab=[own].concat(opps).map((t,i)=>({team:t,sp:6,s:0,u:0,n:0,tore:"",diff:0,pkt:0,auf:false,ab:false}));
    const order=tab.slice(1);order.splice(platz-1,0,tab[0]);
    const T=liga?order.map((r,i)=>{const N=9,w=Math.max(0,N-3-i),u=i%3===0?1:0,l=N-w-u;return{p:i+1,team:r.team,sp:N,s:w,u,n:Math.max(0,l),tore:(w*2+u+3)+":"+(l*2+u+2),diff:(w*2+u+3)-(l*2+u+2),pkt:w*3+u,auf:i===0,ab:i===order.length-1}}):[];
    put("fussball/"+fdid(tid),{v:1,id:fdid(tid),tids:[tid],abgeholt:idx.stand,geaendert:idx.stand,fehler:null,eigen:own,spiele:sp,tabelle:T,tabelleStand:idx.stand,hash:"demo"+tid});
    idx.teams[fdid(tid)]={tids:[tid],ok:true,fehler:null,abgeholt:idx.stand,geaendert:idx.stand,nSpiele:sp.length,nTabelle:T.length,eigen:own}});
  /* Vereinsspielplan: alle Heimspiele der nächsten 14 Tage (Jugend aus den Demo-Spielen, dazu Senioren und Alte Herren) */
  {const bis=addD(TODAY,14),vs=[];
    TEAMS.forEach(([tid,name,ak])=>gamesOf(tid).filter((g)=>g.ha==="H"&&g.datum>=TODAY&&g.datum<=bis).forEach((g)=>vs.push({id:"DV"+g.id,d:g.datum,z:anstoss(tid),heim:"TuS Musterstadt "+tid.toUpperCase(),gast:g.gegner||NAMES[1],mannschaft:ak||name,wett:"Kreisliga",ort:"Sportanlage Musterstadt, Beispielweg 1, 12345 Musterstadt"})));
    [[2,"15:00","TuS Musterstadt","SC Testfeld","Herren","Kreisliga A"],[2,"12:45","TuS Musterstadt II","BV Probeheim 2","Herren","Kreisliga C"],[6,"19:00","TuS Musterstadt","SG Loremberg","Alte Herren","Freundschaftsspiele"],[9,"15:00","TuS Musterstadt","VfL Zufallsburg","Herren","Kreisliga A"]]
      .forEach(([n,z,heim,gast,mannschaft,wett],i)=>vs.push({id:"DVS"+i,d:addD(TODAY,n),z,heim,gast,mannschaft,wett,ort:"Sportanlage Musterstadt, Beispielweg 1, 12345 Musterstadt"}));
    vs.sort((x,y)=>(x.d+x.z).localeCompare(y.d+y.z));
    put("fussball/verein",{v:1,vereinId:"DEMOVEREIN0000000000000000000000",abgeholt:idx.stand,geaendert:idx.stand,fehler:null,eigen:"TuS Musterstadt",spiele:vs,hash:"demoverein"});
    idx.verein={ok:true,fehler:null,abgeholt:idx.stand,nSpiele:vs.length}}
  put("fussball/_index",idx);
  /* Nutzungsstufen (Demo): D1 voll wie bisher, D2 und E1 Standard, E2 Basis */
  [["d2","standard"],["e1","standard"],["e2","basis"]].forEach(([tid,st])=>{const c=store.get(tid+"__config/main");if(c){c.stufe=st;put(tid+"__config/main",c)}const v=store.get(tid+"__vstat/main");if(v){v.st=st;put(tid+"__vstat/main",v)}});

  /* Kennzahlen: nächste Spiele (mit Ort) für Übersicht und Wochenende */
  TEAMS.forEach(([tid])=>{const vs=store.get(tid+"__vstat/main");if(!vs)return;
    vs.naechste=gamesOf(tid).filter((g)=>g.datum>=TODAY).slice(0,8).map((g)=>({d:g.datum,z:anstoss(tid),g:g.gegner,h:g.ha,o:"Sportanlage Musterstadt",a:"Meisterschaft"}));if(tid==="a1"||tid==="d1"){const g0=vs.naechste.find((g)=>g.h==="H");if(g0)g0.p=tid==="a1"?"Kunstrasen":"Naturrasen"}put(tid+"__vstat/main",vs)});
}


/* ---------- Verein, Rollen, Personen ---------- */
put("verein/main",{name:"TuS Musterstadt (Demo)",saison:"2026/27",teams:TEAMS.map(([id,name,ak])=>({id,name,ak,aktiv:true})),arten:ARTEN,bereiche:[{id:"mini",name:"Minis bis U13",teams:["m1","g1","f1","f2","e1","e2","d1","d2"]},{id:"gross",name:"U14 bis U19",teams:["c2","c1","b1","a1"]}],settings:{ausgrauenTage:42,erinnerungTage:21,loeschMonate:24},kontakteVerein:[],fussball:{vereinLink:"https://www.fussball.de/verein/demo/-/id/DEMOVEREIN0000000000000000000000#!/"}});
const memDoc=(email,name,art,teams)=>{const a=ARTEN.find((x)=>x.id===art),all=TEAMS.map((t)=>t[0]),tl=teams==="*"?all:teams,tr={};tl.forEach((t)=>{tr[t]=a.rechte.slice()});return{email,name,rolle:"team",zu:[{art,teams:teams==="*"?[]:tl,...(teams==="*"?{alle:true}:{})}],tr,g:a.gl.slice(),kader:{}}};
if(KONTO){/* Spieler und Eltern sind keine Mitglieder des Vereins: sie kommen über ihr Konto (siehe „Konten“ unten) */}
else if(P.rolle==="admin"||P.rolle==="jugendleiter"||P.rolle==="platzwart")put("mitglieder/"+EMAIL,{email:EMAIL,name:"Demo-Person",rolle:P.rolle,zu:[],tr:{},g:P.rolle==="platzwart"?[]:["plan","kurz"],kader:{}});
else put("mitglieder/"+EMAIL,memDoc(EMAIL,"Demo-Person",P.art,P.teams));
[["erika.beispiel@beispiel.test","Erika Beispiel","trainer",["d2"]],["jonas.probe@beispiel.test","Jonas Probe","cotrainer",["d1"]],["lena.muster@beispiel.test","Lena Muster","sportleiter",["e1","e2"]]].forEach(([e,n,a,t])=>put("mitglieder/"+e,memDoc(e,n,a,t)));
put("mitglieder/ina.demo@beispiel.test",{email:"ina.demo@beispiel.test",name:"Ina Demo",rolle:"jugendleiter",zu:[],tr:{},g:["plan","kurz"],kader:{}});

/* ---------- Platzplan (Standardwoche) ---------- */
const PL=[{id:"p1",name:"Kunstrasen",typ:"platz",viertel:true},{id:"p2",name:"Rasenplatz",typ:"platz",viertel:true},{id:"h1",name:"Sporthalle",typ:"halle",felder:3}];
const slots=[];let sn=0;
const sl=(tid,platz,tag,von,bis,teil)=>slots.push({id:"s"+(++sn),tid,art:"Training",platz,tag,von,bis,teil:teil||[1,2,3,4],pid:"sommer"});
[["m1",1,"15:30","16:30",[1]],["g1",1,"16:00","17:00",[1]],["c2",1,"18:30","20:00",[1,2,3,4]],["f1",1,"16:00","17:00",[2]],["f2",1,"16:00","17:00",[3,4]],["e1",1,"17:00","18:30",[1,2]],["e2",1,"17:00","18:30",[3,4]],["d1",2,"17:30","19:00",[1,2]],["d2",2,"17:30","19:00",[3,4]],["c1",1,"18:30","20:00",[1,2,3,4]],["b1",2,"18:30","20:00",[3,4]],["a1",2,"19:00","20:30",[3,4]]].forEach(([t,p,v,b,te],i)=>{[1,3].forEach((tg)=>sl(t,"p"+p,tg+(i%2),v,b,te))});
slots.forEach((x)=>{if(x.tid==="b1"||x.tid==="d2")x.teilen=true});   /* B1 und D2 teilen sich montags/mittwochs kurz die Hälfte 2 */
sl("g1","h1",5,"16:00","17:30",[1]);sl("f1","h1",5,"16:00","17:30",[2]);sl("f2","h1",5,"16:00","17:30",[3]);sl("e1","h1",5,"17:30","19:00",[1,2,3]);
/* Beispiel: Kabine 3 donnerstags gesperrt (Lauftreff) – die D1 teilt sich dann Kabine 0 mit der A1; weitere Mannschaften außerhalb der App */
put("plaene/platz",{plaetze:PL,kabinen:["0","1","2","3","4"],extern:[{id:"x1",name:"1. Senioren",eigene:true,fd:"Herren · TuS Musterstadt"},{id:"x2",name:"Alte Herren",fd:"Alte Herren · TuS Musterstadt"}],kabSperren:[{id:"ks1",kabine:"3",tag:4,grund:"Lauftreff"}],stdKabine:{m1:"1",c2:"4",g1:"1",f1:"1",f2:"2",e1:"2",e2:"3",d1:"3",d2:"4",c1:"4",b1:"0",a1:"0"},stdKabineTag:{},slots,plans:[{id:"sommer",name:"Sommerplan"},{id:"winter",name:"Winterplan"}],aktiv:"sommer",aus:[]});
/* Platz frei / übernommen: E1 sagt das nächste Training auf dem Kunstrasen ab, D1 übernimmt ein Viertel zusätzlich, ein Viertel bleibt frei */
{const e1=slots.find((x)=>x.tid==="e1"&&x.platz==="p1"&&x.art==="Training");
  if(e1){let d=TODAY;for(let i=0;i<8&&dow(d)!==e1.tag;i++)d=addD(d,1);if(d===TODAY&&e1.bis<new Date().toTimeString().slice(0,5))d=addD(d,7);
    const up=new Date().toISOString();
    put("pfrei/f~"+e1.id+"~"+d,{slot:e1.id,datum:d,tid:"e1",platz:"p1",teil:e1.teil.slice(),von:e1.von,bis:e1.bis,up,by:"Lena Muster"});
    put("pnahme/"+d+"~"+e1.id+"~1",{datum:d,tid:"d1",platz:"p1",v:1,von:e1.von,bis:e1.bis,art:"Zusätzlich",qs:e1.id,up,by:"Jonas Probe"})}}
/* To-Dos und ein Anliegen */
put("todos/demo1",{text:"Lorem ipsum: Trikotsatz für die Saison bestellen",von:EMAIL,vname:"Demo-Person",fuer:EMAIL,fname:"",bis:addD(TODAY,5),done:false,at:new Date().toISOString()});
put("todos/demo2",{text:"Dolor sit amet: Hallenzeiten im Winter abstimmen",von:EMAIL,vname:"Demo-Person",fuer:EMAIL,fname:"",bis:"",done:false,at:new Date().toISOString()});
put("anliegen/demoa1",{id:"demoa1",von:"erika.beispiel@beispiel.test",vname:"Erika Beispiel",r_jl:true,r_ad:true,r_sl:false,art:"platz",betreff:"Rasenplatz am Freitag",text:"Lorem ipsum: Dürfen wir am Freitag zusätzlich den Rasenplatz nutzen?",at:new Date().toISOString(),st:"offen",msgs:[]});
/* Zwei Spiele an Wochentagen (heute bzw. morgen), damit der Hinweis in der Demo zu sehen ist */
let hd=TODAY;if(dow(hd)>5)hd=addD(hd,8-dow(hd));
put("kabinen/"+hd,{datum:hd,eintraege:[{id:"k1",kabine:"1",art:"Heim",tid:"d1",von:"18:00",bis:"20:15",txt:"gegen "+CL[0]},{id:"k2",kabine:"2",art:"Gast",fremd:CL[0],von:"18:00",bis:"20:15",txt:"bei D1"}]});

/* ---------- Weitere Beispiele (D1 Stufe Voll, D2 Stufe Standard) ----------
   Spielerlinks, Hinweise und Aufgaben, Notizen und Ziele, Eingang, Videos, Konten, Abmeldungen, Training bewerten.
   Eigener Zufall, damit die Beispiele oben gleich bleiben. Was die App selbst verschlüsselt (Clip-Kommentare, Antworten auf Aufgaben,
   Abhaken, Eigentraining-Datei), entsteht beim Start (siehe „Beispiele beim Start“ unten). */
let sd2=20261028;const R2=()=>{sd2|=0;sd2=sd2+0x6D2B79F5|0;let t=Math.imul(sd2^sd2>>>15,1|sd2);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const key16=()=>{let s="";for(let i=0;i<16;i++)s+=String.fromCharCode(Math.floor(R2()*256));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const hexN=(n)=>{let s="";for(let i=0;i<n;i++)s+=Math.floor(R2()*16).toString(16);return s};
const plOf=(tid)=>[...store.entries()].filter(([k])=>k.indexOf(tid+"__players/")===0).map(([,v])=>v).sort((a,b)=>a.slot-b.slot);
const ago=(h)=>new Date(Date.now()-h*36e5).toISOString();
const mkey=(e)=>String(e).toLowerCase().replace(/[.]/g,"_").replace(/@/g,"_at_");
const SEED={},BWTG=["Einsatz","Technik","Zweikampf","Spielintelligenz","Verhalten"];   /* Rohstoff für „Beispiele beim Start“ */
["d1","d2"].forEach((tid)=>{
  const pl=plOf(tid),ids=pl.map((p)=>p.id),voll=tid==="d1",cfg=store.get(tid+"__config/main"),S=SEED[tid]={links:{},hn:[],kom:[],abh:[],antw:[]},nm=(i)=>pl[i].vorname;
  /* Spielerlinks (alle aktiv), Teamlink und Demo Spielerlink */
  pl.forEach((p)=>{const k=key16();S.links[p.id]=k;put(tid+"__links/"+p.id,{id:p.id,key:k,aktiv:true})});
  put(tid+"__links/xplan",{id:"xplan",key:key16(),aktiv:true});
  if(voll)put(tid+"__links/xdemosp",{id:"xdemosp",key:key16(),aktiv:true});
  /* Hinweise und Aufgaben (Termine → 📌 Hinweise; im Link „Hinweise & Aufgaben“, Antworten und Abhaken siehe unten) */
  const H=[
    {id:"dh1",text:"Zum Heimspiel bitte **30 Minuten vor Anstoß** da sein.",farbe:"blau",wo:"alle"},
    {id:"dh2",text:"Schienbeinschoner nicht vergessen!",farbe:"gruen",wo:"alle",fuer:"s"},
    {id:"dh3",text:"Fahrgemeinschaften zum Auswärtsspiel bitte in der Elterngruppe absprechen.",farbe:"gelb",wo:"alle",fuer:"e"},
    {id:"dh4",text:"Schau dir bis Freitag das *Video vom letzten Spiel* an. Was ist dir aufgefallen?\n• Wo standen wir zu weit weg?\n• Was hat gut geklappt?",farbe:"blau",wo:"alle",art:"a",bis:addD(TODAY,4),rp:"a",rk:key16(),rs:hexN(64)},
    {id:"dh5",text:"Bitte die **Einverständniserklärung** für das Hallenturnier unterschrieben mitbringen.",farbe:"gelb",wo:"alle",art:"c",bis:addD(TODAY,7),rp:"t",rk:key16()},
    {id:"dh6",text:"Extra-Training Torschuss am Samstag um 10 Uhr.",farbe:"rot",wo:"alle",an:ids.slice(1,4)},
    {id:"dh7",text:"Beispiel für einen Hinweis nur im Terminplan: In den Ferien ist kein Training.",farbe:"blau",wo:"plan",pm:[TODAY.slice(0,7)]},
    {id:"dh8",text:"Trikot nach dem Spiel bitte waschen und zum nächsten Training mitbringen.",farbe:"gruen",wo:"alle",art:"c",von:addD(TODAY,-20),bis:addD(TODAY,-6)}];
  H.forEach((n)=>{["von","bis","fuer","art","an","pw","rp","rk","rs"].forEach((k)=>{if(n[k]===undefined)n[k]=null});n.pm=n.pm||[]});
  S.hn=H;
  S.abh=[["dh5",[1,2,4,5,7]],["dh8",[1,2,3,4,6,8,9]]];
  S.antw=[["dh4",1,"Wir standen beim Gegentor viel zu weit auseinander."],["dh4",3,"Das Pressing vorne hat gut geklappt!"],["dh4",5,"Ich war nach dem Ballverlust zu langsam zurück."],["dh5",2,"Mache ich, bringe ich am Donnerstag mit."]];
  Object.assign(cfg,{hinweise:H,aufgQuote:true},voll?{videos:true,abm:true,bw:{win:10,tags:["Einsatz","Technik","Zweikampf","Spielintelligenz","Verhalten"]}}:{});
  /* Eingang: Nachrichten von Spielern und Eltern (eine schon beantwortet) */
  [["df1",30,"Frage","Wann beginnt das Hallentraining?",1,"s","Ab November immer donnerstags. Bis dann!"],["df2",5,"Idee","Können wir im Training mal ein kleines Turnier spielen?",2,"s"],["df3",28,"Anliegen","Wir sind in den Herbstferien eine Woche verreist.",3,"e"]]
    .forEach(([id,h,art,text,i,ro,an])=>put(tid+"__fbin/"+id,{id,at:ago(h),art,text,von:ro==="e"?"Elternteil von "+nm(i):nm(i),rolle:ro,pid:ids[i],r:hexN(32),gelesen:!!an,...(an?{antwort:an,antwortVon:"Max Mustermann",antwortAm:ago(h-3)}:{})}));
  /* Notizen und Entwicklungsziele (mit Schrift und Aufzählung), Beobachtungen nur intern */
  const N=[[1,-12,"ziel",true,"**Ziel bis zur Winterpause:** schwächerer Fuß\n• jeden Tag 10 Minuten Wand-Pässe links\n• im Training bewusst links abschließen"],[1,-30,"notiz",true,"Sehr gute Entwicklung im Spielaufbau, *weiter so*!"],[2,-8,"notiz",false,"Gespräch mit den Eltern wegen Schulstress geführt, Training vorerst nur zweimal pro Woche."],
    [3,-18,"ziel",true,"Kopfballspiel verbessern: Absprung und Timing."],[4,-5,"notiz",true,"__Kapitän__ beim letzten Spiel, hat das super gemacht."],[5,-22,"ziel",false,"Mehr Mut im Eins-gegen-Eins."],[6,-3,"notiz",true,"Toller Einsatz im Training, auch bei Regen."],[7,-40,"ziel",true,"Ausdauer: bis zu den Herbstferien zweimal pro Woche laufen."]];
  if(voll){N.forEach(([i,d,art,sb,text],k)=>put(tid+"__notes/dn"+k,{id:"dn"+k,pid:ids[i],datum:addD(TODAY,d),art,sichtbar:sb,text,autor:k%2?"Erika Beispiel":"Max Mustermann"}));
    put(tid+"__notes/dnb1",{id:"dnb1",pid:ids[2],datum:addD(TODAY,-6),art:"beobachtung",anlass:"Training",sichtbar:false,text:"Nur intern: wirkte unkonzentriert, nach dem Training kurz nachfragen."});
    put(tid+"__notes/dnt1",{id:"dnt1",pid:"team",datum:addD(TODAY,-2),art:"notiz",sichtbar:false,ort:"start",text:"**Diese Woche:** Fokus auf Umschalten nach Ballverlust.\n• Dienstag: Pressing-Spielformen\n• Donnerstag: Abschlussspiel"});
    put(tid+"__notes/dnt2",{id:"dnt2",pid:"team",datum:addD(TODAY,-9),art:"notiz",sichtbar:false,ort:"allg",text:"Hallenzeiten im Winter: Freitag 16 bis 17:30 Uhr in der Sporthalle."})}
  else put(tid+"__notes/dn0",{id:"dn0",pid:ids[1],datum:addD(TODAY,-7),art:"notiz",sichtbar:true,text:"Gute Fortschritte beim Passspiel."});
  if(!voll){put(tid+"__config/main",cfg);return}
  /* Videos: drei Clips (einer mit Aufgabe und Frist, einer nur für drei Spieler) und ganze Spiele */
  const C=[{id:"dc1",titel:"Pressing nach Ballverlust",aufgabe:"Wohin hättest du nach dem Ballverlust laufen müssen?",an:"alle",frist:addD(TODAY,1)+"T18:00",at:ago(20)},
    {id:"dc2",titel:"Torchance nach Flanke",aufgabe:"",an:ids.slice(1,4),frist:"",at:ago(70)},
    {id:"dc3",titel:"Spielaufbau über außen",aufgabe:"Was macht der Außenverteidiger in der Szene gut?",an:"alle",frist:"",at:ago(150)}].map((c)=>({...c,url:"https://example.com/",bis:"",s:hexN(32),ck:key16()}));
  C.forEach((c)=>put(tid+"__clips/"+c.id,c));
  S.clips=C;
  S.kom=[["dc1","dk1",{p:ids[2],n:nm(2),t:"Ich hätte sofort nach innen laufen müssen."},6],["dc1","dk2",{p:ids[3],n:nm(3),t:"Zu spät umgeschaltet. Beim nächsten Mal schneller zurück."},4],["dc1","dk3",{p:"T",n:"Max Mustermann",tr:true,r:"dk1",t:"Genau richtig erkannt!"},3],
    ["dc2","dk4",{p:ids[1],n:nm(1),t:"Der Laufweg an den zweiten Pfosten war gut."},60],["dc2","dk5",{p:"T",n:"Erika Beispiel",tr:true,r:"dk4",t:"Stark gemacht, weiter so!"},58],
    ["dc3","dk6",{p:ids[4],n:nm(4),t:"Er schaut vor der Ballannahme über die Schulter."},100],["dc3","dk7",{p:ids[1],n:nm(1),t:"Er spielt den Ball schnell und flach weiter."},96]];
  [...store.entries()].filter(([k,g])=>k.indexOf(tid+"__games/")===0&&g.tore!=null&&g.datum<TODAY).sort((a,b)=>b[1].datum.localeCompare(a[1].datum)).slice(0,4).forEach(([k,g])=>{g.video="https://example.com/";put(k,g)});
  /* Konten: zwei Spieler mit Eltern verknüpft, zwei Anfragen, Mannschaftslink und ein Spielerlink, Abmeldungen */
  [[2,"spieler",nm(2)],[2,"eltern","Sabine "+pl[2].name],[3,"eltern","Thomas "+pl[3].name],[5,"spieler",nm(5)]].forEach(([i,rolle,name],k)=>{const e="konto"+(k+1)+"@beispiel.test";
    put("kverkn/"+tid+"~"+ids[i]+"~"+mkey(e),{tid,pid:ids[i],email:e,rolle,name,pn:pl[i].vorname+" "+pl[i].name,at:addD(TODAY,-25+k)+"T18:00:00.000Z"})});
  put("kanfr/dka1",{tid,name:"Petra "+pl[6].name,rolle:"eltern",kind:pl[6].vorname+" "+pl[6].name,email:"petra@beispiel.test",at:ago(5)});
  put("kanfr/dka2",{tid,name:nm(7),rolle:"spieler",kind:pl[7].vorname+" "+pl[7].name,email:"spieler8@beispiel.test",at:ago(26)});
  put("mteinl/"+hexN(24),{tid,aktiv:true,bis:0,am:addD(TODAY,-30)+"T10:00:00.000Z"});
  put("spielereinl/"+hexN(24),{tid,pid:ids[4],n:pl[4].vorname+" "+pl[4].name,aktiv:true,bis:0,am:addD(TODAY,-3)+"T10:00:00.000Z"});
  {let tr=addD(TODAY,1);while(dow(tr)!==2&&dow(tr)!==4)tr=addD(tr,1);
    put("kabm/dab1",{tid,pid:ids[4],k:"d"+tr.replace(/-/g,"")+"_0",grund:"Arzttermin",name:"Elternteil von "+nm(4),von:Date.parse(tr+"T17:30:00")})}
  put("kabw/daw1",{tid,pid:ids[6],von:addD(TODAY,10),bis:addD(TODAY,17),grund:"Familienurlaub",name:"Elternteil von "+nm(6)});
  if(KONTO){const p=pl[1];put("kverkn/"+tid+"~"+p.id+"~"+mkey(EMAIL),{tid,pid:p.id,email:EMAIL,rolle:KONTO.konto,name:KONTO.konto==="spieler"?p.vorname:"Demo-Elternteil",pn:p.vorname+" "+p.name,at:addD(TODAY,-14)+"T18:00:00.000Z"});S.konto=p.id}
  /* Training bewerten: Tipps der letzten Trainings */
  [...store.entries()].filter(([k,t])=>k.indexOf(tid+"__trainings/t")===0&&/^t\d$/.test(t.id)).forEach(([,t],i)=>{const taps={},amp={},ts=Date.parse(t.datum+"T18:00:00");
    ids.forEach((pid,j)=>{if((t.spieler||{})[pid]!=="x")return;const n=(i+j)%3;if(n===0)return;taps[pid]=[[ts+j*6e4,n===1?1:-1,BWTG[(i+j)%BWTG.length]]];if(j%4===0)amp[pid]=[["g","y","r"][(i+j)%3],ts]});
    put(tid+"__tipps/"+t.id+"_demo",{id:t.id+"_demo",tid:t.id,datum:t.datum,vk:"demo",taps,amp})});
  put(tid+"__config/main",cfg);
});

/* ---------- Mini-Firestore im Speicher ----------
   DB: die Demo-Daten dieses Fensters; eingebettete Fenster (Vorbereitung) teilen sie mit dem Hauptfenster. */
const DB=PAR?PAR.__DEMOSTORE:store;
if(PREP)DB.set("mitglieder/"+EMAIL,memDoc(EMAIL,"Vorbereitung","trainer",["d1"]));
const L=new Set();
const norm=(p)=>String(p).replace(/^\/+|\/+$/g,"");
const clone=(x)=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const denyErr=()=>{const e=new Error("Missing or insufficient permissions.");e.code="permission-denied";return e};
const isFixed=P.rolle==="admin";
const snapDoc=(p,d)=>({id:p.split("/").pop(),exists:d!==undefined,data:()=>clone(d)});
const kick=PAR?()=>{try{PAR.__DEMOKICK()}catch(e){}}:()=>setTimeout(()=>L.forEach((f)=>{try{f()}catch(e){}}),0);
if(!PAR){window.__DEMOSTORE=DB;window.__DEMOKICK=kick}
function docRef(path){path=norm(path);return{path,id:path.split("/").pop(),
  async get(){if(path.indexOf("ownercheck/")===0&&!isFixed)throw denyErr();return snapDoc(path,DB.get(path))},
  async set(d,o){if(o&&o.merge)DB.set(path,{...(DB.get(path)||{}),...clone(d)});else DB.set(path,clone(d));kick()},
  async update(d){if(!DB.has(path)){const e=new Error("nf");e.code="not-found";throw e}DB.set(path,{...DB.get(path),...clone(d)});kick()},
  async delete(){DB.delete(path);kick()},
  onSnapshot(a,b){const cb=typeof a==="function"?a:a&&a.next;let last=null;const run=()=>{const s=JSON.stringify(DB.get(path));if(s!==last){last=s;cb&&cb(snapDoc(path,DB.get(path)))}};lsn(run);setTimeout(run,0);return()=>uls(run)},
  collection(n){return colRef(path+"/"+n)}}}
/* Beobachter: im eingebetteten Fenster beim Hauptfenster angemeldet (dort wird bei jeder Änderung geprüft) */
const lsn=(f)=>{if(PAR){f.__prep=1;PAR.__DEMOLSN.add(f)}else L.add(f)},uls=(f)=>{if(PAR)PAR.__DEMOLSN.delete(f);else L.delete(f)};
if(!PAR)window.__DEMOLSN=L;
function colRef(path,flt){path=norm(path);flt=flt||[];
  const rows=()=>{const out=[],dep=path.split("/").length+1;DB.forEach((v,k)=>{const p=k.split("/");if(k.indexOf(path+"/")===0&&p.length===dep&&flt.every(([f,o,x])=>{const y=v[f];return o==="=="?y===x:o===">="?y>=x:o==="<="?y<=x:o===">"?y>x:o==="<"?y<x:o==="in"?x.indexOf(y)>=0:true}))out.push({id:p[p.length-1],data:v})});return out};
  const snap=()=>{const docs=rows().map((r)=>snapDoc(path+"/"+r.id,r.data));return{docs,empty:!docs.length,size:docs.length,forEach:(f)=>docs.forEach(f),docChanges:()=>docs.map((d)=>({type:"added",doc:d}))}};
  return{path,doc:(id)=>docRef(path+"/"+id),where:(f,o,x)=>colRef(path,flt.concat([[f,o,x]])),orderBy(){return this},limit(){return this},
    async get(){if(path==="mitglieder"&&P.rolle!=="admin"&&P.rolle!=="jugendleiter"){throw denyErr()}return snap()},
    onSnapshot(a,b){const cb=typeof a==="function"?a:a&&a.next;let last=null;const run=()=>{const s=JSON.stringify(rows());if(s!==last){last=s;cb&&cb(snap())}};lsn(run);setTimeout(run,0);return()=>uls(run)}}}
const user={email:EMAIL,emailVerified:true,isAnonymous:false,uid:"demo-uid",providerData:[{providerId:"password"}],async reload(){},async getIdToken(){return"demo"},async getIdTokenResult(){return{authTime:new Date().toISOString()}},async delete(){}};
/* Spieler und Eltern: erst wenn die Ansicht vorbereitet ist (siehe unten), geht die Anmeldung weiter */
let ready=Promise.resolve();
const auth={currentUser:user,onAuthStateChanged(f){ready.then(()=>setTimeout(()=>f(user),0));return()=>{}},async signOut(){location.reload()},async signInAnonymously(){return{user}},async setPersistence(){}};
const batch=()=>{const l=[];const b={set(r,d,o){l.push(()=>r.set(d,o));return b},update(r,d){l.push(()=>r.update(d));return b},delete(r){l.push(()=>r.delete());return b},async commit(){for(const f of l)await f()}};return b};
const fsx={doc:docRef,collection:colRef,batch,async enablePersistence(){},async clearPersistence(){},async terminate(){}};
window.firebase={initializeApp(){},auth:Object.assign(()=>auth,{GoogleAuthProvider:function(){},Auth:{Persistence:{SESSION:"session",LOCAL:"local"}}}),firestore:()=>fsx};
guard(DB,kick);

/* ---------- Spieler und Eltern mit Konto ----------
   Ihre Ansicht entsteht aus dem verschlüsselten Stand, den die Trainer-App veröffentlicht. Dafür läuft die Trainer-App von D1 kurz unsichtbar
   in einem eingebetteten Fenster (#demo:vorbereiten) mit denselben Demo-Daten; danach öffnet sich hier die Seite wie für ein echtes Konto. */
if(KONTO){
  const pid=(SEED.d1||{}).konto,done=()=>{const kv=DB.get("kview/d1~"+pid);return!!(kv&&kv.k&&DB.get("pub/p_d1_"+pid))};
  ready=new Promise((res)=>{
    const go=()=>{
      const w=document.createElement("div");w.id="demoprep";w.style.cssText="position:fixed;inset:0;z-index:8000;display:flex;align-items:center;justify-content:center;background:var(--bg,#f5f6f8);color:var(--tx,#111);font:16px/1.4 system-ui,sans-serif;padding:24px;text-align:center";
      w.innerHTML="<div><b>Demo wird vorbereitet …</b><div style=\"margin-top:6px;opacity:.7\">Die Seite für "+(KONTO.konto==="spieler"?"Spieler":"Eltern")+" entsteht gerade aus den Beispieldaten der Mannschaft D1.</div></div>";
      document.body.appendChild(w);
      const f=document.createElement("iframe");f.title="Vorbereitung";f.setAttribute("aria-hidden","true");f.tabIndex=-1;f.style.cssText="position:fixed;left:-20000px;top:0;width:1280px;height:900px;border:0";
      f.src=location.pathname+location.search+"#demo:vorbereiten";document.body.appendChild(f);
      const t0=Date.now(),chk=()=>{if(done()){setTimeout(()=>{f.remove();L.forEach((x)=>{if(x.__prep)L.delete(x)});w.remove();res()},300);return}
        if(Date.now()-t0>60000){w.innerHTML="<div><b>Die Demo konnte nicht vorbereitet werden.</b><div style=\"margin-top:6px\">Bitte die Seite neu laden.</div></div>";return}setTimeout(chk,300)};chk()};
    if(document.body)go();else document.addEventListener("DOMContentLoaded",go)});
}

/* ---------- Beispiele beim Start ----------
   Was die App verschlüsselt, wird hier mit den Bausteinen der App selbst erzeugt, sobald sie geladen ist: Kommentare zu Clips,
   Antworten auf Aufgaben, wer eine Aufgabe abgehakt hat, ein Eigentraining-Plan mit Datei. Danach werden die Links (nur im Demo-Speicher) veröffentlicht,
   damit Vorschau, Konten und Demo Spielerlink sofort gehen. */
const T2=(tid,p)=>tid+"__"+p;
async function seedTeam(tid){
  const S=SEED[tid],lk=window.__lk;if(!S||!lk||DB.get("demoseed/"+tid))return;DB.set("demoseed/"+tid,{at:Date.now()});
  const sig=async(s)=>{const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return[...new Uint8Array(h)].map((x)=>x.toString(16).padStart(2,"0")).join("")};
  const pn=(pid)=>{const p=DB.get(T2(tid,"players/"+pid));return p?p.vorname:""};
  for(const [c,id,o,h] of S.kom){const cl=(S.clips||[]).find((x)=>x.id===c);if(cl)DB.set(T2(tid,"kom/"+cl.s+"/m/"+id),{b:await lk.seal(cl.ck,{r:"",...o}),at:ago(h)})}
  for(const [hid,idx] of S.abh){const ids=Object.keys(S.links);for(const i of idx){const pid=ids[i];if(pid)DB.set("aufg/"+await sig("aufg|"+hid+"|"+pid+"|"+S.links[pid])+"/m/x",{d:true})}}
  for(const [hid,i,t] of S.antw){const n=S.hn.find((x)=>x.id===hid),pid=Object.keys(S.links)[i];if(!n||!pid)continue;
    const path=n.rp==="t"?await sig("aufg|r"+hid+"|"+pid+"|"+S.links[pid]):n.rs;
    DB.set("antw/"+path+"/m/a"+hid+i,{b:await lk.seal(n.rk,{p:pid,n:pn(pid),ro:"s",t}),at:ago(10+i*3)})}
  if(S.clips){/* Eigentraining (nur Stufe Voll): ein Plan mit zwei Stufen als Bild, für zwei Spieler freigegeben */
    try{const cv=document.createElement("canvas");cv.width=600;cv.height=420;const g=cv.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,600,420);g.fillStyle="#004aad";g.font="bold 30px sans-serif";g.fillText("Demo: Kräftigung zu Hause",30,56);
      g.fillStyle="#222";g.font="22px sans-serif";["Stufe 1: je 3 × 20 Sekunden","• Unterarmstütz","• Kniebeugen","• Seitstütz links und rechts","Stufe 2: je 3 × 40 Sekunden"].forEach((l,i)=>g.fillText(l,30,120+i*48));
      const d=cv.toDataURL("image/png"),fid="0123456789abcdef01234567",k=key16(),blob=await lk.seal(k,{n:"Kraeftigung.png",t:"image/png",d});
      DB.set(T2(tid,"etdatei/"+fid+"_0"),{b:blob});
      DB.set(T2(tid,"etplan/dep1"),{titel:"Kräftigung zu Hause",hinweis:"Jede Übung sauber ausführen, lieber kürzer als schlampig.",f:{id:fid,k,name:"Kraeftigung.png",typ:"image/png",size:d.length,parts:1},stufen:[{n:"Stufe 1"},{n:"Stufe 2"}],am:ago(240)});
      const ids=Object.keys(S.links);[[ids[1],0,[1,3]],[ids[3],1,[2,5]]].forEach(([pid,st,tage],i)=>DB.set(T2(tid,"etzu/dez"+i),{pid,plan:"dep1",st,von:addD(TODAY,-7),bis:addD(TODAY,42),tage,ab:null,am:ago(200)}))}catch(e){}}
  kick();
}
/* Läuft in jeder Rolle, sobald die App da ist; veröffentlicht wird nur, wer die Links der Mannschaft verwaltet (wie in der echten App) */
{let n=0;const t=setInterval(async()=>{if(++n>240){clearInterval(t);return}
  if(!window.__lk||typeof D==="undefined"||!D.ready)return;clearInterval(t);
  try{await seedTeam("d1");await seedTeam("d2")}catch(e){}
  const tid=window.__TID;if(!tid||window.__ROLE!=="voll"||!window.__lkPublish)return;
  for(let i=0;i<60&&!(window.__links&&Object.keys(window.__links).length);i++)await new Promise((r)=>setTimeout(r,250));
  if(SEED[tid])setTimeout(()=>{try{window.__lkPublish(false)}catch(e){}},500)},250)}

/* ---------- Hinweisleiste oben ---------- */
if(PREP)return;
const bar=()=>{if(document.getElementById("u13demo"))return;
  const st=document.createElement("style");st.textContent="#u13demo{position:relative;z-index:9000;background:#7c3aed;color:#fff;font:13px/1.4 system-ui,sans-serif;padding:6px 12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center;text-align:center}#u13demo b{font-weight:700}#u13demo a{color:#fff;text-decoration:underline;cursor:pointer}";document.head.appendChild(st);
  const d=document.createElement("div");d.id="u13demo";d.innerHTML="<span><b>Demo</b> · Ansicht als <b>"+P.n.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</b> · alle Namen und Daten sind erfunden, nichts wird gespeichert oder verschickt</span>";
  document.body.insertBefore(d,document.body.firstChild);
  const fitD=()=>document.documentElement.style.setProperty("--demoh","0px");fitD();window.addEventListener("resize",fitD);setTimeout(fitD,300);setTimeout(fitD,1500)};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bar);else bar();
setInterval(bar,1500);
})();
