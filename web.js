/* ===== U13 Teamzentrale – Web-Variante (Firebase) =====
   Ersetzt die Artifact-Umgebung durch Firebase (Anmeldung + Firestore) und stellt der App dieselbe Schnittstelle bereit
   (window.claude.use("db" | "downloads" | "artifact")). Die Spielerlinks lesen nur das öffentliche, verschlüsselte Fach „pub“. */
(function(){
"use strict";
if(window.__WEBINIT)return;window.__WEBINIT=true;
const CFG=window.U13_FIREBASE||{};
const SDK=(CFG.sdkBase||"https://www.gstatic.com/firebasejs/10.14.1/");
const XIDS=["full","anon","plan","demo"];
window.__WEB=true;
window.__WEB_BASE0=location.origin+location.pathname.replace(/index\.html$/,"");
window.__WEB_BASE=window.__WEB_BASE0;
const H=location.hash;
const isScout=/^#scout\.[A-Za-z0-9_-]{16,}$/.test(H);
window.__SCOUTKEY=isScout?H.slice(7):"";
/* Verein: Jede Mannschaft hat eigene Sammlungen („d1__players“ …). Gemeinsame Sammlungen des Vereins stehen in GLOB. */
const KABKEY=/^#kab\.[A-Za-z0-9_-]{16,}$/.test(H)?H.slice(5):"";
window.__KAB=!!KABKEY;
const TQ=(new URLSearchParams(location.search).get("t")||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const skt=()=>String(window.__SCOUTKEY||"").split("-")[0].toLowerCase().replace(/[^a-z0-9]/g,"");
window.__TID="";
const GLOB=new Set(["verein","mitglieder","plaene","kabinen","kablinks","kabzugang","protokoll","pub","aliasin","aliasauth","ownercheck"]);
const T=(p)=>{const i=p.indexOf("/"),c=i<0?p:p.slice(0,i);return GLOB.has(c)?p:window.__TID+"__"+p};
window.__T=T;
const isKurz=/^#k\/[A-Za-z0-9_-]{4,40}$/.test(H);
const isViewerHash=(/^#[A-Za-z0-9]+\.[A-Za-z0-9_-]{16,}$/.test(H)&&!/^#co[A-Za-z0-9]+\./.test(H)&&!isScout&&!KABKEY)||isKurz;
const cfgOk=()=>!!(CFG.apiKey&&CFG.projectId&&CFG.authDomain&&!/DEIN|EINTRAGEN|XXXX/i.test(CFG.apiKey+CFG.projectId));
const E=(s)=>String(s==null?"":s).replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const clean=(o)=>o==null?o:JSON.parse(JSON.stringify(o));

/* ---------- Download: Datei direkt speichern ---------- */
const MIME={pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",json:"application/json",zip:"application/zip",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};
function nativeSave(o){
  const name=o.filename,data=o.data,ext=String(name).split(".").pop().toLowerCase();
  const blob=data instanceof Blob?data:new Blob([data],{type:MIME[ext]||"application/octet-stream"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;a.style.display="none";document.body.appendChild(a);a.click();
  setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},5000);return Promise.resolve();
}

/* ---------- Öffentliche Link-Fächer lesen (ohne Anmeldung, ohne Firebase-Bibliothek) ---------- */
async function restDoc(id){
  const url="https://firestore.googleapis.com/v1/projects/"+encodeURIComponent(CFG.projectId)+"/databases/(default)/documents/pub/"+encodeURIComponent(id)+"?key="+encodeURIComponent(CFG.apiKey);
  const r=await fetch(url);
  if(r.status===404)return null;
  if(!r.ok)throw new Error("http "+r.status);
  const j=await r.json(),o={};
  Object.keys(j.fields||{}).forEach((k)=>{const v=j.fields[k];o[k]=v.stringValue!=null?v.stringValue:v.integerValue!=null?+v.integerValue:v.booleanValue!=null?v.booleanValue:null});
  return o;
}
async function restBlob(id){
  const m=await restDoc(id);if(!m||typeof m.b!=="string")return null;
  let b=m.b;for(let i=1;i<(m.n||1);i++){const c=await restDoc(id+"~"+i);if(!c)return null;b+=c.b}
  return b;
}
/* ---------- Scouting-Eingabe ohne Anmeldung: nur Schreiben in den Posteingang, abgesichert durch den geheimen Schlüssel im Link ---------- */
const FSB=()=>"https://firestore.googleapis.com/v1/projects/"+encodeURIComponent(CFG.projectId)+"/databases/(default)/documents/";
function toFs(v){if(v==null)return{nullValue:null};if(typeof v==="boolean")return{booleanValue:v};if(typeof v==="number")return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};if(Array.isArray(v))return{arrayValue:{values:v.map(toFs)}};if(typeof v==="object"){const f={};Object.keys(v).forEach((k)=>{f[k]=toFs(v[k])});return{mapValue:{fields:f}}}return{stringValue:String(v)}}
const scoutGet=async()=>{let aus=false;try{const m=await restDoc("scout_"+skt());aus=!!(m&&m.aus)}catch(e){}return{exists:true,data:()=>({kaderAus:aus})}};
window.__scoutDb=()=>scoutDb;
const scoutDb={doc:()=>({get:scoutGet}),collection:(c)=>({doc:(id)=>({get:scoutGet,set:async(o)=>{
  if(c!=="kinbox")throw{code:"unsupported"};
  const f={};Object.keys(o).forEach((k)=>{f[k]=toFs(o[k])});
  const r=await fetch(FSB()+skt()+"__kinbox?documentId="+encodeURIComponent(id)+"&key="+encodeURIComponent(CFG.apiKey),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fields:f})});
  if(!r.ok)throw{code:r.status===403?"permission-denied":"http-"+r.status}}})})};
/* Kurzlinks: Passwort-Paket lesen und (mit Nachweis des alten Passworts) ersetzen, ohne Anmeldung */
{const hd={"Content-Type":"application/json"},K=()=>"key="+encodeURIComponent(CFG.apiKey),fail=(r)=>{throw{code:r.status===403?"permission-denied":"http-"+r.status}};
window.__kurzNet={
  get:(aid)=>restDoc(aid),
  async setPw(aid,t,o){
    let r=await fetch(FSB()+"aliasin/"+encodeURIComponent(aid)+"?"+K(),{method:"PATCH",headers:hd,body:JSON.stringify({fields:{t:{stringValue:t}}})});if(!r.ok)fail(r);
    r=await fetch(FSB()+"pub/"+encodeURIComponent(aid)+"?updateMask.fieldPaths=s&updateMask.fieldPaths=w&updateMask.fieldPaths=v&currentDocument.exists=true&"+K(),{method:"PATCH",headers:hd,body:JSON.stringify({fields:{s:{stringValue:o.s},w:{stringValue:o.w},v:{integerValue:String(o.v|0)}}})});
    fetch(FSB()+"aliasin/"+encodeURIComponent(aid)+"?"+K(),{method:"DELETE"}).catch(()=>{});
    if(!r.ok)fail(r)}};}
window.__webSnap=async function(pid){
  if(!cfgOk())throw new Error("config");
  const sp=String(pid).split("~"),tt=(sp.length>1?sp[0]:TQ).toLowerCase().replace(/[^a-z0-9]/g,""),pp=sp.length>1?sp[1]:String(pid);
  const x=XIDS.indexOf(pp)>=0,b=await restBlob((x?"x_":"p_")+tt+"_"+pp),bg=await restDoc("bg_"+tt),s={p:{},x:{}};
  if(b)(x?s.x:s.p)[pid]=b;
  if(bg)s.bg={L:bg.L||"",D:bg.D||"",i:bg.i||""};
  return s;
};

/* ---------- Anmeldung ---------- */
let fb=null,fs=null,auth=null;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.async=false;s.onload=res;s.onerror=()=>rej(new Error("Konnte "+src+" nicht laden"));document.head.appendChild(s)})}
const CSS='#u13login{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:var(--bg,#f4f5f7);color:var(--tx,#1c1f24);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:auto}'
+'#u13login .lc{width:100%;max-width:400px;background:var(--card,#fff);border:1px solid var(--ln,#e5e7eb);border-radius:16px;padding:22px 20px;box-shadow:0 8px 30px rgba(0,0,0,.08)}'
+'#u13login h1{font-size:20px;margin:0 0 2px}#u13login .sb{color:var(--mu,#6b7280);font-size:13px;margin:0 0 16px}'
+'#u13login input{width:100%;box-sizing:border-box;margin:0 0 10px;padding:10px 12px;font:inherit;color:var(--tx,#1c1f24);background:var(--card,#fff);border:1px solid var(--ln,#d0d5dd);border-radius:10px}'
+'#u13login button{width:100%;box-sizing:border-box;padding:10px 12px;margin:0 0 8px;font:inherit;font-weight:600;border-radius:10px;border:1px solid var(--ln,#d0d5dd);background:var(--card,#fff);color:var(--tx,#1c1f24);cursor:pointer}'
+'#u13login button.pr{background:var(--ac,#2563eb);border-color:var(--ac,#2563eb);color:#fff}#u13login button:disabled{opacity:.55;cursor:default}'
+'#u13login .ln{background:none;border:0;color:var(--ac,#2563eb);font-weight:500;padding:4px 0;margin:0;width:auto;display:inline-block}'
+'#u13login .ms{min-height:20px;font-size:13px;margin:4px 0 10px}#u13login .ms.er{color:var(--r,#d64545)}#u13login .ms.ok{color:var(--g,#22a06b)}'
+'#u13login .or{display:flex;align-items:center;gap:10px;color:var(--mu,#6b7280);font-size:12px;margin:10px 0}#u13login .or:before,#u13login .or:after{content:"";flex:1;border-top:1px solid var(--ln,#e5e7eb)}'
+'#u13out{margin-left:10px;font:inherit;font-size:13px;padding:3px 9px;border-radius:8px;border:1px solid var(--ln,#e5e7eb);background:var(--card,#fff);color:var(--tx,#1c1f24);cursor:pointer;vertical-align:middle}';
const ERR={"auth/invalid-credential":"E-Mail oder Passwort stimmt nicht.","auth/wrong-password":"E-Mail oder Passwort stimmt nicht.","auth/user-not-found":"E-Mail oder Passwort stimmt nicht.","auth/invalid-email":"Diese E-Mail-Adresse ist ungültig.","auth/email-already-in-use":"Zu dieser E-Mail gibt es schon ein Konto. Bitte anmelden.","auth/weak-password":"Das Passwort ist zu kurz (mindestens 6 Zeichen).","auth/too-many-requests":"Zu viele Versuche. Bitte kurz warten und erneut versuchen.","auth/network-request-failed":"Keine Verbindung zum Server.","auth/popup-closed-by-user":"Die Anmeldung wurde abgebrochen.","auth/cancelled-popup-request":"Die Anmeldung wurde abgebrochen.","auth/unauthorized-domain":"Diese Internetadresse ist in Firebase noch nicht freigegeben (Authentication → Einstellungen → Autorisierte Domains).","auth/operation-not-allowed":"Diese Anmeldeart ist in Firebase noch nicht eingeschaltet.","auth/missing-password":"Bitte ein Passwort eingeben.","auth/missing-email":"Bitte eine E-Mail-Adresse eingeben."};
const errTxt=(e)=>ERR[e&&e.code]||("Das hat nicht geklappt"+(e&&(e.code||e.message)?" ("+(e.code||e.message)+")":"")+".");
let ov=null;
function overlay(html){
  if(!document.getElementById("u13css")){const st=document.createElement("style");st.id="u13css";st.textContent=CSS;document.head.appendChild(st)}
  if(!ov){ov=document.createElement("div");ov.id="u13login";(document.body||document.documentElement).appendChild(ov)}
  ov.innerHTML='<div class="lc"><h1>TuS Haltern · Teamzentrale</h1><p class="sb">Nur für das Trainerteam</p>'+html+"</div>";return ov;
}
const hideOverlay=()=>{if(ov){ov.remove();ov=null}};
function showSetup(){overlay('<div class="ms er" style="font-size:15px">Die Verbindung zu Firebase ist noch nicht eingerichtet.</div><p class="sb">Bitte die Datei <b>firebase-config.js</b> mit den Werten aus dem Firebase-Projekt ausfüllen (siehe Anleitung) und die Dateien erneut hochladen.</p>')}
function showDenied(email){
  const o=overlay('<div class="ms er" style="font-size:15px">Dieses Konto ist nicht freigegeben.</div><p class="sb">Angemeldet als <b>'+E(email)+'</b>. Zugriff haben nur Personen, die der Besitzer unter Einstellungen → Mannschaft → „Zugang zur App“ freigegeben hat.</p><button id="u13so">Abmelden</button>');
  o.querySelector("#u13so").onclick=()=>auth.signOut().then(()=>location.reload());
}
function showVerify(user){
  return new Promise((res)=>{
    const o=overlay('<p>Bitte die E-Mail-Adresse <b>'+E(user.email)+'</b> bestätigen. Wir haben dir dazu eine Nachricht geschickt (auch im Spam-Ordner nachsehen).</p><div class="ms" id="vm"></div><button class="pr" id="vok">Ich habe bestätigt</button><button id="vre">Nachricht noch einmal senden</button><button class="ln" id="vso">Abmelden</button>'),m=o.querySelector("#vm");
    o.querySelector("#vok").onclick=async()=>{try{await user.reload();if(auth.currentUser&&auth.currentUser.emailVerified){await auth.currentUser.getIdToken(true);res()}else{m.className="ms er";m.textContent="Noch nicht bestätigt. Bitte zuerst auf den Link in der E-Mail klicken."}}catch(e){m.className="ms er";m.textContent=errTxt(e)}};
    o.querySelector("#vre").onclick=async()=>{try{await user.sendEmailVerification();m.className="ms ok";m.textContent="Gesendet."}catch(e){m.className="ms er";m.textContent=errTxt(e)}};
    o.querySelector("#vso").onclick=()=>auth.signOut().then(()=>location.reload());
  });
}
function showLogin(){
  return new Promise((res)=>{
    const o=overlay('<button class="pr" id="lg">Mit Google anmelden</button><div class="or">oder mit E-Mail</div><input id="le" type="email" autocomplete="username" placeholder="E-Mail" inputmode="email"><input id="lp" type="password" autocomplete="current-password" placeholder="Passwort"><div class="ms" id="lm"></div><button class="pr" id="li">Anmelden</button><button id="lr">Konto anlegen</button><button class="ln" id="lf">Passwort vergessen?</button>'),m=o.querySelector("#lm"),em=o.querySelector("#le"),pw=o.querySelector("#lp");
    const msg=(t,k)=>{m.className="ms"+(k?" "+k:"");m.textContent=t||""};
    const busy=(b)=>o.querySelectorAll("button").forEach((x)=>{x.disabled=b});
    const run=async(f)=>{busy(true);msg("");try{await f()}catch(e){msg(errTxt(e),"er")}busy(false)};
    o.querySelector("#lg").onclick=()=>run(async()=>{const p=new fb.auth.GoogleAuthProvider();try{await auth.signInWithPopup(p)}catch(e){if(e&&(e.code==="auth/popup-blocked"||e.code==="auth/operation-not-supported-in-this-environment")){await auth.signInWithRedirect(p);return}throw e}});
    o.querySelector("#li").onclick=()=>run(async()=>{await auth.signInWithEmailAndPassword(em.value.trim(),pw.value)});
    o.querySelector("#lr").onclick=()=>run(async()=>{const c=await auth.createUserWithEmailAndPassword(em.value.trim(),pw.value);try{await c.user.sendEmailVerification()}catch(e){}});
    o.querySelector("#lf").onclick=()=>run(async()=>{if(!em.value.trim()){msg("Bitte oben die E-Mail-Adresse eintragen.","er");return}await auth.sendPasswordResetEmail(em.value.trim());msg("Nachricht zum Zurücksetzen wurde gesendet.","ok")});
    pw.addEventListener("keydown",(e)=>{if(e.key==="Enter")o.querySelector("#li").click()});
    const un=auth.onAuthStateChanged((u)=>{if(u){un();res()}});
  });
}
const needsVerify=(u)=>u&&!u.emailVerified&&(u.providerData||[]).every((p)=>p&&p.providerId==="password");
function firstUser(){return new Promise((res)=>{const un=auth.onAuthStateChanged((u)=>{un();res(u)})})}

/* ---------- Datenbank-Hülle: gleiche Aufrufe wie in der Artifact-Umgebung, mit Mannschafts-Präfix ---------- */
const noWrite=()=>window.__ROLE==="lesen"?Promise.reject({code:"permission-denied"}):null;
function docW(ref){return{get:()=>ref.get(),set:(d)=>noWrite()||ref.set(clean(d)),update:(d)=>noWrite()||ref.update(clean(d)),delete:()=>noWrite()||ref.delete(),onSnapshot:(a,b)=>ref.onSnapshot(a,b),collection:(n)=>colW(ref.collection(n))}}
function colW(ref){return{get:()=>ref.get(),onSnapshot:(a,b)=>ref.onSnapshot(a,b),doc:(id)=>docW(ref.doc(id))}}
const wrap=()=>({collection:(n)=>colW(fs.collection(T(n))),doc:(p)=>docW(fs.doc(T(p)))});

/* ---------- Verein: Rollen, Mannschaften ---------- */
const ROLLEN_V=["admin","jugendleiter","sportleiter","trainer","cotrainer","lesen","scout","platzwart"];
const LEG={admin:"voll",jugendleiter:"voll",sportleiter:"lesen",trainer:"voll",cotrainer:"voll",lesen:"lesen",scout:"scout",platzwart:"lesen"};
const ALLE_TEAMS=["admin","jugendleiter","sportleiter","lesen"];
const STD_TEAMS=[["a1","A1","U19",1],["b1","B1","U17",1],["b2","B2","U16",0],["c1","C1","U15",1],["c2","C2","U14",1],["d1","D1","U13",1],["d2","D2","U12",1],["e1","E1","U11",1],["e2","E2","U10",1],["f1","F1","U9",1],["f2","F2","U8",1],["g","G","U7",1],["minis","Minis","U6",1]];
const lowC=(s)=>String(s||"").trim().toLowerCase();
function showInfo(title,html,btn){
  const o=overlay('<div class="ms er" style="font-size:15px">'+E(title)+'</div><p class="sb">'+html+'</p><button id="u13so">'+(btn||"Abmelden")+'</button>');
  o.querySelector("#u13so").onclick=()=>auth.signOut().then(()=>location.reload());
}
function showClubSetup(email){
  return new Promise((res)=>{
    const o=overlay('<p class="sb" style="margin-top:0">Der Verein ist noch nicht eingerichtet. Du bist als Besitzer eingetragen und legst ihn jetzt an. Mannschaften kannst du später jederzeit ergänzen.</p><label class="sb">Name des Vereins<input id="vn" value="TuS Haltern am See"></label><label class="sb">Saison<input id="vs" value="2026/27"></label><div class="sb"><b>Mannschaften</b></div><div id="vt" style="margin:0 0 10px">'+STD_TEAMS.map((t)=>'<label style="display:flex;gap:8px;align-items:center;margin:2px 0"><input type="checkbox" data-t="'+t[0]+'" checked style="width:auto;margin:0"> '+E(t[1])+' ('+E(t[2])+')'+(t[3]?"":" – derzeit nicht besetzt")+'</label>').join("")+'</div><div class="ms" id="vm"></div><button class="pr" id="vgo">Verein anlegen</button><button class="ln" id="vso">Abmelden</button>'),m=o.querySelector("#vm");
    o.querySelector("#vso").onclick=()=>auth.signOut().then(()=>location.reload());
    o.querySelector("#vgo").onclick=async()=>{
      const teams=STD_TEAMS.filter((t)=>o.querySelector('[data-t="'+t[0]+'"]').checked).map((t)=>({id:t[0],name:t[1],ak:t[2],aktiv:!!t[3]}));
      if(!teams.length){m.className="ms er";m.textContent="Bitte mindestens eine Mannschaft wählen.";return}
      const v={name:o.querySelector("#vn").value.trim()||"Verein",saison:o.querySelector("#vs").value.trim()||"2026/27",teams,settings:{ausgrauenTage:42,erinnerungTage:21,loeschMonate:24},erstellt:new Date().toISOString()};
      try{
        await fs.doc("verein/main").set(v);
        await fs.doc("plaene/platz").set({plaetze:[],kabinen:["0","1","2","3","4"],extern:[{id:"erste",name:"1. Mannschaft"},{id:"ah",name:"Alte Herren"}],stdKabine:{},slots:[]});
        res(v)}catch(e){m.className="ms er";m.textContent=errTxt(e)}};
  });
}
function chooseTeam(V,me,rolle){
  const act=(V.teams||[]);
  const allowed=ALLE_TEAMS.indexOf(rolle)>=0?act:act.filter((t)=>(me.teams||[]).indexOf(t.id)>=0);
  let want=TQ;
  try{want=want||localStorage.getItem("u13team")||""}catch(e){}
  const hit=allowed.find((t)=>t.id===want);
  const first=allowed.find((t)=>t.aktiv!==false)||allowed[0];
  return{allowed,team:hit||first||null};
}
async function clubInit(u){
  const em=lowC(u&&u.email);
  let fixed=null,me=null,V=null,offline=false;
  try{await fs.doc("ownercheck/x").get();fixed=true}catch(e){if(denied(e))fixed=false;else offline=true}
  if(!offline){
    try{const s=await fs.doc("mitglieder/"+em).get();me=s.exists?s.data():null}catch(e){if(!denied(e))offline=true}
    try{const s=await fs.doc("verein/main").get();V=s.exists?s.data():null}catch(e){if(!denied(e))offline=true}
  }
  let cache=null;try{cache=JSON.parse(localStorage.getItem("u13v:"+em)||"null")}catch(e){}
  if(offline){
    if(!cache){showInfo("Keine Verbindung","Die App wurde auf diesem Gerät noch nie online geöffnet. Bitte einmal mit Internet öffnen.","Neu laden");return null}
    fixed=cache.fixed;me=cache.me;V=cache.V;
  }
  if(!V){
    if(!fixed){showInfo(me?"Der Verein ist noch nicht eingerichtet.":"Dieses Konto ist nicht freigegeben.","Angemeldet als <b>"+E(em)+"</b>. "+(me?"Bitte den Besitzer der App fragen.":"Zugriff haben nur Personen, die der Verein freigegeben hat."));return null}
    V=await showClubSetup(em);hideOverlay();
  }
  const rolle=fixed?"admin":(me&&me.rolle);
  if(!rolle||ROLLEN_V.indexOf(rolle)<0){showInfo("Dieses Konto ist nicht freigegeben.","Angemeldet als <b>"+E(em)+"</b>. Zugriff haben nur Personen, die der Verein freigegeben hat.");return null}
  me=me||{email:em,rolle:rolle,teams:[]};
  try{localStorage.setItem("u13v:"+em,JSON.stringify({fixed:!!fixed,me,V}))}catch(e){}
  const ch=chooseTeam(V,me,rolle);
  window.__VEREIN=V;window.__VME={email:em,rolle,teams:me.teams||[],name:me.name||""};window.__VROLLE=rolle;window.__VFIXED=!!fixed;window.__VALLOWED=ch.allowed.map((t)=>t.id);
  if(rolle==="platzwart"){window.__KABACCT=true;return{kabOnly:true}}
  if(!ch.team){showInfo("Du bist noch keiner Mannschaft zugeordnet.","Angemeldet als <b>"+E(em)+"</b>. Bitte die Jugendleitung bitten, dich unter „Personen &amp; Rechte“ einer Mannschaft zuzuordnen.");return null}
  window.__TID=ch.team.id;window.__TEAM=ch.team;window.__WEB_BASE=window.__WEB_BASE0+"?t="+ch.team.id;
  try{localStorage.setItem("u13team",ch.team.id)}catch(e){}
  return{team:ch.team};
}
/* Platzwart-Link: anonyme Anmeldung, dann Eintrag „kabzugang/<uid>“ mit dem geheimen Schlüssel aus dem Link */
async function kabStart(){
  let u=await firstUser();
  try{
    if(!u){await auth.signInAnonymously();u=auth.currentUser}
    await fs.doc("kabzugang/"+u.uid).set({s:KABKEY,at:new Date().toISOString()});
    window.__kabFs=fs;window.__kabUid=u.uid;window.__kabOk=true;
  }catch(e){window.__kabOk=false;window.__kabErr=(e&&e.code)||"fehler"}
  window.__kabReady=true;document.dispatchEvent(new Event("u13kab"));
}

async function start(){
  if(!cfgOk()){showSetup();return new Promise(()=>{})}
  try{
    for(const f of["firebase-app-compat.js","firebase-auth-compat.js","firebase-firestore-compat.js"])await loadScript(SDK+f);
  }catch(e){overlay('<div class="ms er">Die Firebase-Bausteine konnten nicht geladen werden. Bitte die Internetverbindung prüfen und die Seite neu laden.</div>');return new Promise(()=>{})}
  fb=window.firebase;fb.initializeApp(CFG);auth=fb.auth();fs=fb.firestore();
  try{await fs.enablePersistence({synchronizeTabs:true})}catch(e){}
  if(KABKEY){await kabStart();return new Promise(()=>{})}
  let u=await firstUser();
  if(!u){await showLogin();u=auth.currentUser}
  if(needsVerify(u)){try{await u.reload()}catch(e){}u=auth.currentUser;if(needsVerify(u)){await showVerify(u);u=auth.currentUser}}
  window.__webFs=fs;
  const ci=await clubInit(u);
  if(!ci)return new Promise(()=>{});
  if(ci.kabOnly){hideOverlay();document.documentElement.classList.add("kabmode");window.__KAB=true;window.__kabFs=fs;window.__kabOk=true;window.__kabReady=true;document.dispatchEvent(new Event("u13kab"));addSignOut();return new Promise(()=>{})}
  /* Zugriffstest; bei leerer Mannschaft ein Grundgerüst anlegen, damit die Sicherung eingespielt werden kann */
  try{
    const c=await fs.doc(T("config/main")).get();
    if(!c.exists&&(window.__VROLLE==="admin"||window.__VROLLE==="jugendleiter"||window.__VROLLE==="trainer"))await fs.doc(T("config/main")).set({saison:window.__VEREIN.saison||"2026/27",mannschaft:window.__TEAM.ak||"",zaehlendeAbwesenheiten:{e:true,u:true,v:false,t:false}});
  }catch(e){
    if(denied(e)){showInfo("Kein Zugriff auf diese Mannschaft.","Angemeldet als <b>"+E(u&&u.email)+"</b>.");return new Promise(()=>{})}
    /* offline: weiter, die Daten kommen aus dem Gerätespeicher */
  }
  hideOverlay();addSignOut();
  await afterLogin();
  window.__CLUB=true;document.dispatchEvent(new Event("u13club"));
  return wrap();
}
/* ---------- Nach der Anmeldung: Rolle, Scouting-Schlüssel ---------- */
let scoutKey="";
const rndKey=()=>{const a=new Uint8Array(18);crypto.getRandomValues(a);return window.__TID+"-"+btoa(String.fromCharCode.apply(null,a)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")};
const denied=(e)=>!!(e&&/permission|denied|insufficient/i.test(String(e.code)+" "+String(e.message)));
async function afterLogin(){
  const rolle=window.__VROLLE,owner=rolle==="admin"||rolle==="jugendleiter"||rolle==="trainer";
  window.__webOwner=owner;
  window.__ROLE=LEG[rolle];window.__ACCT=(((auth.currentUser&&auth.currentUser.email)||"")+"").toLowerCase().replace(/[^a-z0-9@._-]/g,"_")||"main";
  if(!owner)document.body.classList.add("co");
  if(window.__ROLE==="scout")document.body.classList.add("scoutonly");
  const lbl={lesen:"· Nur Ansicht",sportleiter:"· Sportlicher Leiter (nur Ansicht)",scout:"· Scouting-Zugang"}[rolle];
  if(lbl){const t=document.querySelector(".top .note");if(t){const sp=document.createElement("span");sp.style.marginLeft="8px";sp.textContent=lbl;t.appendChild(sp)}}
  if(window.__ROLE==="scout"){window.__scoutLink=()=>"(nur für Trainer sichtbar)";return}
  if(window.__ROLE==="lesen"){try{const r=await fs.doc(T("config/scout")).get();scoutKey=(r.exists&&r.data()&&r.data().k)||""}catch(e){}window.__scoutLink=()=>scoutKey?window.__WEB_BASE0+"#scout."+scoutKey:"(nicht verfügbar)";return}
  try{const r=await fs.doc(T("config/scout")).get();let k=r.exists&&r.data()&&r.data().k;if(!k){k=rndKey();await fs.doc(T("config/scout")).set({k})}scoutKey=k}catch(e){}
  window.__scoutLink=()=>scoutKey?window.__WEB_BASE0+"#scout."+scoutKey:"";window.__scoutNew=true;
  let last=null;const tid=window.__TID;
  fs.doc(T("config/main")).onSnapshot((d)=>{const aus=!!(d.exists&&d.data()&&d.data().kaderAus);if(aus===last)return;const first=last===null;last=aus;
    const w=()=>fs.doc("pub/scout_"+tid).set({aus}).catch(()=>{});
    if(first)fs.doc("pub/scout_"+tid).get().then((x)=>{if(!x.exists||!!(x.data()&&x.data().aus)!==aus)w()}).catch(()=>{});else w()},()=>{});
  document.addEventListener("click",async(ev)=>{const b=ev.target.closest&&ev.target.closest("[data-scn]");if(!b)return;
    if(!b.dataset.arm){b.dataset.arm="1";b.textContent="Wirklich neu erzeugen?";return}
    const k=rndKey();try{await fs.doc(T("config/scout")).set({k});scoutKey=k;const i=document.getElementById("sclink");if(i)i.value=window.__scoutLink();b.dataset.arm="";b.textContent="Neu erzeugen";document.dispatchEvent(new Event("u13scoutkey"))}catch(e){b.textContent="Hat nicht geklappt"}});
  if(rolle==="admin")cards();
}
function cards(){
  const put=()=>{
    const m=document.getElementById("etp-m"),sv=document.getElementById("etp-s");if(!m||!sv){setTimeout(put,500);return}
    if(!document.getElementById("u13upd")){
      const c=document.createElement("div");c.className="card";c.id="u13upd";
      c.innerHTML='<h3>Update der App einspielen (GitHub)</h3><p class="note" style="margin-top:0">Nur nötig, wenn Claude dir eine neue ZIP-Datei gibt. Löschen musst du nichts: Gleichnamige Dateien werden beim Hochladen ersetzt.</p><ol style="margin:6px 0 6px 20px;padding:0"><li>Neue ZIP-Datei auf dem Computer entpacken.</li><li>Auf github.com das Repository öffnen → <b>Add file</b> → <b>Upload files</b>.</li><li>Alle Dateien aus dem entpackten Ordner in das Fenster ziehen (den <b>Inhalt</b>, nicht den Ordner selbst; <b>index.html</b> muss ganz oben im Repository liegen, nicht in einem Unterordner).</li><li>Unten <b>Commit changes</b> klicken.</li><li>1–3 Minuten warten (Reiter <b>Actions</b>: grüner Haken). Dann die App neu laden, am iPad und Handy gegebenenfalls zweimal.</li><li>Nur wenn Claude es ausdrücklich sagt: <b>firestore.rules</b> in Firebase unter Firestore → Regeln einfügen und <b>Veröffentlichen</b>.</li></ol><p class="note" style="margin-bottom:0">Deine Daten bleiben bei einem Update unverändert.</p>';
      const sw=document.getElementById("swc");if(sw&&sw.parentNode===sv)sv.insertBefore(c,sw);else sv.appendChild(c);
    }
  };put();
}
function addSignOut(){
  const put=()=>{if(!document.getElementById("u13css")){const st=document.createElement("style");st.id="u13css";st.textContent=CSS;document.head.appendChild(st)}const t=document.querySelector(".top .note")||document.querySelector(".top");if(!t||document.getElementById("u13out"))return;const b=document.createElement("button");b.id="u13out";b.type="button";b.textContent="Abmelden";b.title=(auth.currentUser&&auth.currentUser.email)||"";b.onclick=()=>auth.signOut().then(()=>location.reload());t.appendChild(b)};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",put);else put();setTimeout(put,800);
}

/* ---------- Spielerlinks veröffentlichen (verschlüsselte Fächer in „pub“) ---------- */
const CH=600000;
async function publishSnap(snap){
  const keep=new Set(),put=async(id,b)=>{const parts=[];for(let i=0;i<b.length;i+=CH)parts.push(b.slice(i,i+CH));if(!parts.length)parts.push("");
    keep.add(id);await fs.doc("pub/"+id).set({b:parts[0],n:parts.length});
    for(let i=1;i<parts.length;i++){keep.add(id+"~"+i);await fs.doc("pub/"+id+"~"+i).set({b:parts[i]})}};
  const tid=window.__TID,pre=(k)=>k+"_"+tid+"_";
  for(const pid of Object.keys(snap.p||{}))await put(pre("p")+pid,snap.p[pid]);
  for(const k of Object.keys(snap.x||{}))await put(pre("x")+k,snap.x[k]);
  if(snap.bg){let bg=clean(snap.bg);if(JSON.stringify(bg).length>900000)bg={L:bg.L||"",D:bg.D||"",i:""};keep.add("bg_"+tid);await fs.doc("pub/bg_"+tid).set(bg)}
  keep.add("scout_"+tid);
  const all=await fs.collection("pub").get();
  for(const d of all.docs){const mine=d.id.indexOf(pre("p"))===0||d.id.indexOf(pre("x"))===0||d.id==="bg_"+tid;if(mine&&!keep.has(d.id))await fs.doc("pub/"+d.id).delete()}
  await fs.doc(T("linkmeta/main")).set({u:snap.u,k:snap.k||{},xk:snap.xk||{},fp:snap.fp||"",fa:snap.fa||"",fs:snap.fs||"",dzs:snap.dzs||""});
}
/* Kurzlinks (Trainer): Passwort-Paket veröffentlichen/entfernen; das geheime Zeichen liegt nur für Trainer lesbar in „aliasauth“ */
if(!isViewerHash&&!isScout)window.__kurzTr={
  async put(aid,o,t){await (dbP||(dbP=start()));await fs.doc("aliasauth/"+aid).set({t});await fs.doc("pub/"+aid).set(o.v===2?{s:"",w:"",v:2,i:o.i,k:o.k}:{s:o.s,w:o.w,v:o.v|0})},
  async del(aid){await (dbP||(dbP=start()));await fs.doc("pub/"+aid).delete();await fs.doc("aliasauth/"+aid).delete()}};
/* Trainer-Ansicht: Stand der veröffentlichten Links (für Statusanzeige und Prüfung) */
window.__webOwnerSnap=function(cb){
  if(!fs){const t=setInterval(()=>{if(fs){clearInterval(t);window.__webOwnerSnap(cb)}},300);return}
  let docs=null,meta=null,tm=null;
  const build=()=>{
    if(docs==null||meta==null)return;
    const raw={};docs.forEach((d)=>{raw[d.id]=d.data()});
    const join=(id)=>{const m=raw[id];if(!m||typeof m.b!=="string")return null;let b=m.b;for(let i=1;i<(m.n||1);i++){const c=raw[id+"~"+i];if(!c)return null;b+=c.b}return b};
    const s={u:meta.u||"",k:meta.k||{},xk:meta.xk||{},fp:meta.fp||"",fa:meta.fa||"",fs:meta.fs||"",dzs:meta.dzs||"",p:{},x:{},a:{}},tp="_"+window.__TID+"_";
    Object.keys(raw).forEach((id)=>{if(id.indexOf("~")>=0)return;if(id.slice(0,2)==="a_"){s.a[id]={s:raw[id].s,w:raw[id].w,v:raw[id].v|0};return}if(id.indexOf("p"+tp)===0){const b=join(id);if(b)s.p[id.slice(tp.length+1)]=b}else if(id.indexOf("x"+tp)===0){const b=join(id);if(b)s.x[id.slice(tp.length+1)]=b}});
    window.__webSnapReady=true;cb(s);
  };
  const later=()=>{clearTimeout(tm);tm=setTimeout(build,150)};
  fs.collection("pub").onSnapshot((s)=>{docs=s.docs;later()},()=>{});
  fs.doc(T("linkmeta/main")).onSnapshot((s)=>{meta=s.exists?s.data():{};later()},()=>{});
};

/* ---------- Schnittstelle zur App ---------- */
let dbP=null;
window.claude={use:async function(name){
  if(name==="db")return isScout?scoutDb:isViewerHash?null:(dbP||(dbP=start()));
  if(name==="downloads")return isViewerHash?null:{save:nativeSave};
  if(name==="artifact")return isViewerHash?null:{publish:async(snap)=>{await (dbP||(dbP=start()));return publishSnap(snap)}};
  return null;
}};

/* ---------- Offline-Start (Service Worker) und Installation ---------- */
if("serviceWorker" in navigator&&/^https:|^http:\/\/localhost/.test(location.protocol+"//"+location.hostname)){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}
})();
