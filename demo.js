/* ===== Demo-Ansicht der Vereinslösung =====
   Wird nur aktiv, wenn die Adresse mit #demo:<rolle> endet. Alles läuft im Browser mit ERFUNDENEN Daten (Lorem-ipsum-Namen, erfundene Vereine).
   Es gibt keine Verbindung zur echten Datenbank, nichts wird gespeichert, ein Neuladen setzt alles zurück. */
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
/* Rollen, die ein Demo-Link darstellen kann */
const ROLLEN={
  "administrator":{n:"Administrator",rolle:"admin"},
  "jugendleiter":{n:"Jugendleiter",rolle:"jugendleiter"},
  "sportleiter-alle":{n:"Sportlicher Leiter (alle Mannschaften)",art:"sportleiter",teams:"*"},
  "sportleiter-d":{n:"Sportlicher Leiter (nur D1 und D2)",art:"sportleiter",teams:["d1","d2"]},
  "trainer":{n:"Trainer (D1)",art:"trainer",teams:["d1"]},
  "cotrainer":{n:"Co-Trainer (D1)",art:"cotrainer",teams:["d1"]},
  "torwarttrainer":{n:"Torwarttrainer (alle)",art:"torwart",teams:"*"},
  "athletiktrainer":{n:"Athletiktrainer (alle)",art:"athletik",teams:"*"},
  "nur-lesen":{n:"Nur Ansicht (D1)",art:"lesen",teams:["d1"]},
  "platzwart":{n:"Platzwart",rolle:"platzwart"}};
window.__DEMO_ROLLEN=ROLLEN;
const m=/^#demo:([a-z0-9-]{2,30})$/.exec(location.hash||"");
if(!m)return;
const P=ROLLEN[m[1]]||ROLLEN.administrator;
window.__DEMO={key:m[1],label:P.n,roles:ROLLEN};
const EMAIL="demo@beispiel.test";

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
const TEAMS=[["g1","G1","U7"],["f1","F1","U9"],["f2","F2","U9"],["e1","E1","U11"],["e2","E2","U11"],["d1","D1","U13"],["d2","D2","U13"],["c1","C1","U15"],["b1","B1","U17"],["a1","A1","U19"]];
const FORM={g1:["4gg4",4],f1:["5gg5",5],f2:["5gg5",5],e1:["7gg7",7],e2:["7gg7",7],d1:["9gg9",9],d2:["9gg9",9],c1:["11gg11",11],b1:["11gg11",11],a1:["11gg11",11]};

const store=new Map();
const put=(p,d)=>store.set(p,JSON.parse(JSON.stringify(d)));

/* ---------- Mannschaften mit erfundenen Daten ---------- */
TEAMS.forEach(([tid,name],ti)=>{
  const [form,nF]=FORM[tid],cnt=nF+ri(4,6),pl=[];
  for(let i=0;i<cnt;i++){const k=(ti*3+i*5)%FN.length;pl.push({id:"p"+(i+1),slot:i+1,vorname:FN[k],name:LN[(k*7+i+ti)%LN.length],geburtsdatum:(2013-ti%4)+"-"+pad(ri(1,12))+"-"+pad(ri(1,28)),positionen:i===0?["TW"]:shuf(["IV","AV","ZM","OM","ST","FL"]).slice(0,ri(1,2)),torwart:i===0,aktiv:true,nr:i+1})}
  pl.forEach((p)=>put(tid+"__players/"+p.id,p));
  const ids=pl.map((p)=>p.id);
  [-35,-28,-21,-14,-7].forEach((off,i)=>{const d=addD(TODAY,off),sp={};ids.forEach((id)=>{const r=R();sp[id]=r<.75?"x":r<.85?"e":r<.92?"u":"v"});put(tid+"__trainings/t"+i,{id:"t"+i,datum:d,spieler:sp})});
  [-40,-26,-12,-5,4,11,25].forEach((off,i)=>{let d=addD(TODAY,off);while(dow(d)<6)d=addD(d,1);const past=d<TODAY,sp={};
    ids.forEach((id,j)=>{const r=R();sp[id]=past&&r<.7?{status:"k",minuten:Math.round(30*(1+R()))}:{status:past?"t":"n",minuten:0}});
    put(tid+"__games/g"+(i+1),{id:"g"+(i+1),nr:i+1,datum:d,dauer:60,form,gewichtet:true,spielerzahl:nF,gegner:pick(CL),ha:i%2?"A":"H",tore:past?pick([0,1,2,3,4]):null,gt:past?pick([0,1,2,3]):null,wertung:true,spieler:past?sp:{}})});
  put(tid+"__events/e1",{id:"e1",datum:addD(TODAY,6),typ:"Termin",titel:"Elternabend",zeit:"19:00",ort:"Vereinsheim Musterstadt",eltern:true});
  put(tid+"__events/e2",{id:"e2",datum:addD(TODAY,9),typ:"Termin",titel:"Trainersitzung",zeit:"20:00",eltern:false});
  put(tid+"__dienste/d1",{id:"d1",art:"Materialdienst",datum:MON,bis:addD(MON,6),label:"Gruppe 1",spieler:ids.slice(0,2)});
  put(tid+"__todos/t1",{id:"t1",typ:"todo",text:"Lorem ipsum Bälle aufpumpen.",datum:addD(TODAY,3),wer:"Max Mustermann",done:false});
  put(tid+"__todos/t2",{id:"t2",typ:"todo",text:"Dolor sit amet Trikots abholen.",datum:null,wer:null,done:true});
  put(tid+"__notes/n1",{id:"n1",pid:ids[1],datum:addD(TODAY,-10),art:"notiz",kategorie:"Allgemein",text:"Lorem ipsum dolor sit amet, consetetur sadipscing elitr.",sichtbar:false});
  put(tid+"__config/main",{saison:"2026/27",mannschaft:name,kontakte:[{titel:"Trainerteam",zeilen:"Max Mustermann · 0123 456789"}],zaehlendeAbwesenheiten:{e:true,u:true,v:false,t:false},spielformen:[{id:form,name:nF+" gegen "+nF,spieler:nF}],staff:[{id:"s1",name:"Max Mustermann",rolle:"Trainer",owner:true}]});
});

/* ---------- Verein, Rollen, Personen ---------- */
put("verein/main",{name:"TuS Musterstadt (Demo)",saison:"2026/27",teams:TEAMS.map(([id,name,ak])=>({id,name,ak,aktiv:true})),arten:ARTEN,bereiche:[{id:"mini",name:"Minis bis U13",teams:["g1","f1","f2","e1","e2","d1","d2"]},{id:"gross",name:"U14 bis U19",teams:["c1","b1","a1"]}],settings:{ausgrauenTage:42,erinnerungTage:21,loeschMonate:24},kontakteVerein:[]});
const memDoc=(email,name,art,teams)=>{const a=ARTEN.find((x)=>x.id===art),all=TEAMS.map((t)=>t[0]),tl=teams==="*"?all:teams,tr={};tl.forEach((t)=>{tr[t]=a.rechte.slice()});return{email,name,rolle:"team",zu:[{art,teams:teams==="*"?[]:tl,...(teams==="*"?{alle:true}:{})}],tr,g:a.gl.slice(),kader:{}}};
if(P.rolle==="admin"||P.rolle==="jugendleiter"||P.rolle==="platzwart")put("mitglieder/"+EMAIL,{email:EMAIL,name:"Demo-Person",rolle:P.rolle,zu:[],tr:{},g:P.rolle==="platzwart"?[]:["plan","kurz"],kader:{}});
else put("mitglieder/"+EMAIL,memDoc(EMAIL,"Demo-Person",P.art,P.teams));
[["erika.beispiel@beispiel.test","Erika Beispiel","trainer",["d2"]],["jonas.probe@beispiel.test","Jonas Probe","cotrainer",["d1"]],["lena.muster@beispiel.test","Lena Muster","sportleiter",["e1","e2"]]].forEach(([e,n,a,t])=>put("mitglieder/"+e,memDoc(e,n,a,t)));
put("mitglieder/ina.demo@beispiel.test",{email:"ina.demo@beispiel.test",name:"Ina Demo",rolle:"jugendleiter",zu:[],tr:{},g:["plan","kurz"],kader:{}});

/* ---------- Platzplan (Standardwoche) ---------- */
const PL=[{id:"p1",name:"Kunstrasen",typ:"platz",viertel:true},{id:"p2",name:"Rasenplatz",typ:"platz",viertel:true},{id:"h1",name:"Sporthalle",typ:"halle",felder:3}];
const slots=[];let sn=0;
const sl=(tid,platz,tag,von,bis,teil)=>slots.push({id:"s"+(++sn),tid,art:"Training",platz,tag,von,bis,teil:teil||[1,2,3,4],pid:"sommer"});
[["g1",1,"16:00","17:00",[1]],["f1",1,"16:00","17:00",[2]],["f2",1,"16:00","17:00",[3,4]],["e1",1,"17:00","18:30",[1,2]],["e2",1,"17:00","18:30",[3,4]],["d1",2,"17:30","19:00",[1,2]],["d2",2,"17:30","19:00",[3,4]],["c1",1,"18:30","20:00",[1,2,3,4]],["b1",2,"19:00","20:30",[1,2]],["a1",2,"19:00","20:30",[3,4]]].forEach(([t,p,v,b,te],i)=>{[1,3].forEach((tg)=>sl(t,"p"+p,tg+(i%2),v,b,te))});
sl("g1","h1",5,"16:00","17:30",[1]);sl("f1","h1",5,"16:00","17:30",[2]);sl("f2","h1",5,"16:00","17:30",[3]);sl("e1","h1",5,"17:30","19:00",[1,2,3]);
put("plaene/platz",{plaetze:PL,kabinen:["0","1","2","3","4"],extern:[],stdKabine:{g1:"1",f1:"1",f2:"2",e1:"2",e2:"3",d1:"3",d2:"4",c1:"4",b1:"0",a1:"0"},stdKabineTag:{},slots,plans:[{id:"sommer",name:"Sommerplan"},{id:"winter",name:"Winterplan"}],aktiv:"sommer",aus:[]});
/* Zwei Spiele an Wochentagen (heute bzw. morgen), damit der Hinweis in der Demo zu sehen ist */
let hd=TODAY;if(dow(hd)>5)hd=addD(hd,8-dow(hd));
put("kabinen/"+hd,{datum:hd,eintraege:[{id:"k1",kabine:"1",art:"Heim",tid:"d1",von:"18:00",bis:"20:15",txt:"gegen "+CL[0]},{id:"k2",kabine:"2",art:"Gast",fremd:CL[0],von:"18:00",bis:"20:15",txt:"bei D1"}]});

/* ---------- Mini-Firestore im Speicher ---------- */
const L=new Set();
const norm=(p)=>String(p).replace(/^\/+|\/+$/g,"");
const clone=(x)=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const denyErr=()=>{const e=new Error("Missing or insufficient permissions.");e.code="permission-denied";return e};
const isFixed=P.rolle==="admin";
const snapDoc=(p,d)=>({id:p.split("/").pop(),exists:d!==undefined,data:()=>clone(d)});
const kick=()=>setTimeout(()=>L.forEach((f)=>{try{f()}catch(e){}}),0);
function docRef(path){path=norm(path);return{path,id:path.split("/").pop(),
  async get(){if(path.indexOf("ownercheck/")===0&&!isFixed)throw denyErr();return snapDoc(path,store.get(path))},
  async set(d,o){if(o&&o.merge)store.set(path,{...(store.get(path)||{}),...clone(d)});else store.set(path,clone(d));kick()},
  async update(d){if(!store.has(path)){const e=new Error("nf");e.code="not-found";throw e}store.set(path,{...store.get(path),...clone(d)});kick()},
  async delete(){store.delete(path);kick()},
  onSnapshot(a,b){const cb=typeof a==="function"?a:a&&a.next;let last=null;const run=()=>{const s=JSON.stringify(store.get(path));if(s!==last){last=s;cb&&cb(snapDoc(path,store.get(path)))}};L.add(run);setTimeout(run,0);return()=>L.delete(run)},
  collection(n){return colRef(path+"/"+n)}}}
function colRef(path,flt){path=norm(path);flt=flt||[];
  const rows=()=>{const out=[],dep=path.split("/").length+1;store.forEach((v,k)=>{const p=k.split("/");if(k.indexOf(path+"/")===0&&p.length===dep&&flt.every(([f,o,x])=>{const y=v[f];return o==="=="?y===x:o===">="?y>=x:o==="<="?y<=x:o===">"?y>x:o==="<"?y<x:o==="in"?x.indexOf(y)>=0:true}))out.push({id:p[p.length-1],data:v})});return out};
  const snap=()=>{const docs=rows().map((r)=>snapDoc(path+"/"+r.id,r.data));return{docs,empty:!docs.length,size:docs.length,forEach:(f)=>docs.forEach(f)}};
  return{path,doc:(id)=>docRef(path+"/"+id),where:(f,o,x)=>colRef(path,flt.concat([[f,o,x]])),orderBy(){return this},limit(){return this},
    async get(){if(path==="mitglieder"&&P.rolle!=="admin"&&P.rolle!=="jugendleiter"){throw denyErr()}return snap()},
    onSnapshot(a,b){const cb=typeof a==="function"?a:a&&a.next;let last=null;const run=()=>{const s=JSON.stringify(rows());if(s!==last){last=s;cb&&cb(snap())}};L.add(run);setTimeout(run,0);return()=>L.delete(run)}}}
const user={email:EMAIL,emailVerified:true,isAnonymous:false,uid:"demo-uid",providerData:[{providerId:"password"}],async reload(){},async getIdToken(){return"demo"}};
const auth={currentUser:user,onAuthStateChanged(f){setTimeout(()=>f(user),0);return()=>{}},async signOut(){location.hash="";location.reload()},async signInAnonymously(){return{user}}};
const fsx={doc:docRef,collection:colRef,async enablePersistence(){}};
window.firebase={initializeApp(){},auth:Object.assign(()=>auth,{GoogleAuthProvider:function(){}}),firestore:()=>fsx};

/* ---------- Hinweisleiste oben ---------- */
const bar=()=>{if(document.getElementById("u13demo"))return;
  const st=document.createElement("style");st.textContent="#u13demo{position:sticky;top:0;z-index:9000;background:#7c3aed;color:#fff;font:13px/1.4 system-ui,sans-serif;padding:6px 12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center;text-align:center}#u13demo b{font-weight:700}#u13demo a{color:#fff;text-decoration:underline;cursor:pointer}";document.head.appendChild(st);
  const d=document.createElement("div");d.id="u13demo";d.innerHTML="<span><b>Demo</b> · Ansicht als <b>"+P.n.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</b> · alle Namen und Daten sind erfunden, nichts wird gespeichert</span>";
  document.body.insertBefore(d,document.body.firstChild)};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bar);else bar();
setInterval(bar,1500);
})();
