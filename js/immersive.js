/* THE LAST BIRTHDAY — IMMERSIVE SURVIVAL LAYER v1.5
 * Non-destructive extension of the existing 76-node / 8-ending story.
 * Original reference images are never loaded or packaged by this layer.
 * All movement, enemy pursuit, sound effects, photographs and UI are local.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const TAU=Math.PI*2, MOVE_KEYS=new Set(), STORE='tlb:immersive:settings:v1';
const DIFFICULTY={easy:{speed:.63,sight:4.3,hearing:3.8,search:.06,stun:5.0,battery:.30},normal:{speed:.91,sight:6.5,hearing:6.1,search:.17,stun:3.3,battery:.55},nightmare:{speed:1.36,sight:9.5,hearing:10,search:.39,stun:1.55,battery:.95}};
const SCENE_SPAWN={exterior:[4.5,14.5],foyer:[13.4,12.5],dining:[13.3,4.5],stage:[22.5,4.5],arcade:[22.5,12.5],office:[31.5,12.5],maintenance:[13.4,20.5],archive:[22.5,20.5],tunnel:[31.5,20.5]};
const LOCATIONS={exterior:'CANDLEWICK’S FORECOURT',foyer:'RECEPTION FOYER',dining:'BIRTHDAY AUDITORIUM',stage:'THE MAIN STAGE',arcade:'MIDNIGHT ARCADE',office:'EDWIN’S OFFICE',maintenance:'MAINTENANCE WORKSHOP',archive:'RECORDS ARCHIVE',tunnel:'EAST SERVICE PASSAGE',storage:'UNUSED PARTY ROOM',service:'SERVICE ANNEX'};
const ZONES=[['storage','dining','stage','office'],['exterior','foyer','arcade','office'],['service','maintenance','archive','tunnel']];
function buildMap(){const w=36,h=24,m=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x===0||y===0||x===w-1||y===h-1?1:0));
 for(const x of [9,18,27])for(let y=1;y<h-1;y++)if(![3,4,5,11,12,13,19,20,21].includes(y))m[y][x]=1;
 for(const y of [8,16])for(let x=1;x<w-1;x++)if(![3,4,5,12,13,14,21,22,23,30,31,32].includes(x))m[y][x]=1;
 // Architectural clutter leaves useful sight breaks but never seals off the map.
 for(const [x,y] of [[2,3],[6,5],[11,6],[15,2],[20,6],[24,6],[30,6],[33,3],[4,18],[6,20],[15,18],[20,18],[24,22],[33,19],[29,21]])m[y][x]=2;
 return {w,h,m};}
const MAP=buildMap();
function tile(x,y){return MAP.m[Math.floor(y)]?.[Math.floor(x)]??1;}
function wall(x,y){return tile(x,y)>0;}
function region(x,y){const c=clamp(Math.floor(x/9),0,3),r=clamp(Math.floor(y/8),0,2);return ZONES[r][c];}
function canStand(x,y){const r=.25;return !wall(x-r,y-r)&&!wall(x+r,y+r)&&!wall(x+r,y-r)&&!wall(x-r,y+r);}
function clearSight(x,y,tx,ty){const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy),steps=Math.ceil(d/.14);for(let i=1;i<steps;i++){const p=i/steps;if(wall(x+dx*p,y+dy*p))return false;}return true;}
function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
function pathfind(start,end){const sx=Math.floor(start.x),sy=Math.floor(start.y),gx=Math.floor(end.x),gy=Math.floor(end.y);if(sx===gx&&sy===gy)return [{x:gx+.5,y:gy+.5}];
 const queue=[[sx,sy]],seen=new Set([sy*MAP.w+sx]),prev=new Map();let found=false;
 for(let i=0;i<queue.length&&i<900;i++){const [x,y]=queue[i];if(x===gx&&y===gy){found=true;break;}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*MAP.w+nx;if(!wall(nx+.5,ny+.5)&&!seen.has(k)){seen.add(k);prev.set(k,[x,y]);queue.push([nx,ny]);}}}
 if(!found)return [];let v=[gx,gy],out=[];for(let i=0;i<150;i++){out.push({x:v[0]+.5,y:v[1]+.5});if(v[0]===sx&&v[1]===sy)break;v=prev.get(v[1]*MAP.w+v[0]);if(!v)break;}return out.reverse().slice(1);}
function settingsLoad(){try{return {...{difficulty:'normal',sensitivity:.7,audio:true,motion:true,vibration:true},...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return {difficulty:'normal',sensitivity:.7,audio:true,motion:true,vibration:true}}}
const prefs=settingsLoad();let gameOn=false,dead=false,settingsOpen=false,albumOpen=false,usingTouch=false,frame=0,sceneNode='',last=0,lastStep=0,lastSave=0;
let deathCount=0, sightings=0, startedAt=performance.now(),lastChase=false;
let player={x:4.5,y:14.5,a:-Math.PI/2,p:0,tool:'flashlight',battery:100,film:10,hidden:false,stamina:100,noise:0,moving:false,sprinting:false,photos:[],captured:0};
let bunny={x:22.5,y:4.5,a:0,mode:'roam',path:[],target:null,awake:false,stunned:0,search:0,thinking:0,nextWay:0,walk:0,walkNoise:0};
const patrol=[[22.5,4.5],[22.5,12.5],[31.5,12.5],[22.5,20.5],[13.5,20.5],[13.5,12.5],[13.5,4.5]];
const OBJECTS=[
 {x:4.5,y:10.2,kind:'neon',label:'CANDLEWICK’S'}, {x:4.5,y:11.8,kind:'door',label:'FRONT DOORS'},
 {x:13.6,y:4.2,kind:'table',label:'PARTY SEVEN'}, {x:12.1,y:5.4,kind:'balloon'},
 {x:21.4,y:4.1,kind:'curtain',label:'THE STAGE'}, {x:24.2,y:5.3,kind:'cake'},
 {x:20.5,y:11.0,kind:'arcade',label:'BUNNY BLAST'}, {x:23.8,y:11.3,kind:'arcade',label:'PRIZE DROP'},
 {x:30.9,y:11.1,kind:'desk',label:'OWNER’S DESK'}, {x:32.4,y:13.8,kind:'filing',label:'RECORDS'},
 {x:13.5,y:20.1,kind:'relay',label:'EAST EXIT RELAY'}, {x:20.8,y:20.3,kind:'filing',label:'GUEST REGISTER'},
 {x:31.7,y:20.1,kind:'door',label:'CHAINED EXIT'},
 {x:5.4,y:4.7,kind:'table'}, {x:13.3,y:12.0,kind:'desk',label:'FRONT COUNTER'}
];
const sound={ctx:null,master:null,amb:null,noise:null,enabled:false};
function audioReady(){if(!prefs.audio||sound.enabled)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const ctx=sound.ctx=new A(),master=sound.master=ctx.createGain();master.gain.value=.16;master.connect(ctx.destination);sound.enabled=true;
 const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=(Math.random()*2-1)*.7;
 const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buf;src.loop=true;filter.type='lowpass';filter.frequency.value=480;g.gain.value=.09;src.connect(filter).connect(g).connect(master);src.start();sound.amb=g;sound.noise=src;ctx.resume();}catch(e){console.warn('Ambient audio unavailable',e);}}
function soundCue(type){if(!sound.enabled||!prefs.audio)return;const c=sound.ctx,n=c.currentTime,o=c.createOscillator(),g=c.createGain();o.connect(g).connect(sound.master);
 const defs={step:[58,38,.11,.09],clank:[690,83,.24,.12],click:[440,120,.07,.12],shutter:[1400,130,.13,.23],flash:[1600,110,.22,.18],door:[100,46,.32,.23],alarm:[520,90,.56,.24],scream:[820,1730,1.18,.51]};const d=defs[type]||defs.click;
 o.type=type==='scream'?'sawtooth':type==='clank'?'triangle':'sine';o.frequency.setValueAtTime(d[0],n);o.frequency.exponentialRampToValueAtTime(d[1],n+d[2]);g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(d[3],n+.018);g.gain.exponentialRampToValueAtTime(.0001,n+d[2]);o.start(n);o.stop(n+d[2]+.01);}
const root=$('game');if(!root)return;
const canvas=document.createElement('canvas');canvas.id='imm-world';canvas.setAttribute('aria-label','Immersive first-person world. Click and drag to look around.');const ctx=canvas.getContext('2d',{alpha:false});
$('world').insertAdjacentElement('afterend',canvas);
const ui=document.createElement('div');ui.id='imm-ui';ui.innerHTML=`
 <div id="imm-vignette" aria-hidden="true"></div><div id="imm-hit" aria-hidden="true"></div><div id="imm-flash" aria-hidden="true"></div>
 <div id="imm-center" aria-hidden="true"><i></i></div>
 <div id="imm-room">CANDLEWICK’S FORECOURT</div>
 <div id="imm-prompt" hidden>PRESS E TO INSPECT</div>
 <div id="imm-threat"><span>⚠ PRESENCE</span><div class="imm-meter"><i id="imm-danger-bar"></i></div></div>
 <div id="imm-status"><div class="imm-film">FILM <b id="imm-film-num">10</b>/10</div><div class="imm-power">LIGHT <b id="imm-bat-num">100%</b></div></div>
 <div id="imm-hand"><img src="./assets/hand-firstperson.svg" alt=""/><div id="imm-held"></div></div>
 <div id="imm-toolbar" aria-label="Equipped tools">
  <button data-tool="flashlight" class="active" aria-label="Equip flashlight (F)"><strong>F</strong>🔦<span>LIGHT</span></button>
  <button data-tool="camera" aria-label="Equip camera (C)"><strong>C</strong>📷<span>CAMERA</span></button>
  <button data-tool="photo" aria-label="View photographs (P)"><strong>P</strong>🖼️<span>PHOTOS</span></button>
  <button id="imm-hide" aria-label="Hide (H)"><strong>H</strong>🚪<span>HIDE</span></button>
 </div>
 <button id="imm-gear" aria-label="Survival settings">⚙️ <span>DIFFICULTY</span></button>
 <button id="imm-album" aria-label="Photo gallery">▣ <span>ALBUM</span></button>
 <div id="imm-controls-tip">WASD MOVE · MOUSE LOOK · SHIFT RUN · E INSPECT · SPACE USE · F/C/P EQUIP</div>
 <div id="imm-mobile" aria-label="Touch gameplay controls"><div id="imm-stick"><i id="imm-stick-cap"></i></div><div id="imm-touch-actions"><button id="imm-touch-use">USE</button><button id="imm-touch-hide">HIDE</button><button id="imm-touch-run">RUN</button></div></div>
 <div id="imm-veil" hidden><section id="imm-panel" role="dialog" aria-modal="true"><button id="imm-close" aria-label="Close window">✕</button><div id="imm-panel-body"></div></section></div>
 <div id="imm-start-hint">CLICK THE WORLD TO LOOK AROUND · DRAG ON MOBILE</div>
 <div id="imm-scare" hidden aria-hidden="true"><div class="imm-scare-red"></div><img src="./assets/morrow.webp" alt=""/></div>
 <div id="imm-gameover" hidden role="dialog" aria-modal="true" aria-labelledby="imm-death-title"><div class="imm-death-atmosphere" aria-hidden="true"></div>
 <div class="imm-death-visual" aria-hidden="true"><div class="imm-death-blood"></div><img class="imm-death-figure" src="./assets/morrow.webp" alt=""/><img class="imm-death-reach" src="./assets/hand-firstperson.svg" alt=""/><div class="imm-death-visual-caption">OCTOBER 14, 1983 <span>•</span> CANDLEWICK’S</div></div>
 <section class="imm-death-card"><p class="imm-death-chapter">THE LAST BIRTHDAY · 1983</p><div class="imm-death-rule"></div><h2 id="imm-death-title">GAME <em>OVER</em></h2><p class="imm-death-subtitle" id="imm-death-subtitle">CAUGHT BY MR. MORROW</p><p id="imm-death-detail">His heavy shoes stop inches away. Your flashlight goes dark.</p>
 <div class="imm-death-actions"><button id="imm-again" class="imm-primary-death">RETRY</button><button id="imm-reload">LOAD LAST SAVE</button><button id="imm-menu">MAIN MENU</button><button id="imm-settings">SETTINGS</button></div>
 <div class="imm-death-divider"><span>YOUR LAST MOMENTS</span></div>
 <dl class="imm-death-stats"><div><dt>PLAY TIME</dt><dd id="imm-stat-time">00:00</dd></div><div><dt>AREA</dt><dd id="imm-stat-area">MAIN STAGE</dd></div><div><dt>RECORDS FOUND</dt><dd id="imm-stat-proof">0</dd></div><div><dt>PHOTOS TAKEN</dt><dd id="imm-stat-photo">0</dd></div><div><dt>TIMES SPOTTED</dt><dd id="imm-stat-spotted">0</dd></div><div><dt>DIFFICULTY</dt><dd id="imm-stat-diff">NORMAL</dd></div></dl>
 <button id="imm-evidence" class="imm-death-evidence">▤ EXAMINE YOUR PHOTOGRAPHS &amp; EVIDENCE</button>
 <p class="imm-death-footer" id="imm-death-footer">THE PARTY NEVER REALLY ENDED.</p></section>
 <div class="imm-death-polaroid" aria-hidden="true"><img src="./assets/morrow.webp" alt=""/><span>IT FINDS YOU ANYWAY.</span></div>
 </div>`;
root.append(ui);
const SVGTOOL={flashlight:`<svg viewBox="0 0 180 250"><defs><linearGradient id="ft" x2="1" y2="1"><stop stop-color="#999890"/><stop offset=".5" stop-color="#363b40"/><stop offset="1" stop-color="#11151a"/></linearGradient></defs><path d="M68 10H135L148 81L123 130L121 226L75 232L71 126L53 81Z" fill="url(#ft)" stroke="#111" stroke-width="8"/><path d="M54 15H146L161 73H38Z" fill="#747674" stroke="#1b1a18" stroke-width="7"/><ellipse cx="100" cy="17" rx="47" ry="14" fill="#b4ad91" stroke="#1a1917" stroke-width="7"/><path d="M79 139h36m-35 16h35m-35 16h35" stroke="#7d7e74" stroke-width="4"/></svg>`,camera:`<svg viewBox="0 0 220 180"><defs><linearGradient id="cm" y2="1"><stop stop-color="#8b887b"/><stop offset=".4" stop-color="#272b30"/><stop offset="1" stop-color="#121216"/></linearGradient></defs><path d="M18 41H188Q201 41 201 55V158H10V58Q10 41 18 41Z" fill="url(#cm)" stroke="#09090a" stroke-width="9"/><path d="M40 24h79v18H40Z" fill="#858071"/><rect x="137" y="24" width="31" height="18" rx="3" fill="#b8afa0"/><circle cx="108" cy="101" r="58" fill="#16191e" stroke="#a4a09a" stroke-width="9"/><circle cx="108" cy="101" r="39" fill="#11171b" stroke="#545f60" stroke-width="9"/><circle cx="108" cy="101" r="22" fill="#172b35" stroke="#748687" stroke-width="5"/><path d="M100 87Q115 73 126 83" stroke="#99b4b3" stroke-width="5" fill="none"/></svg>`,photo:`<svg viewBox="0 0 220 210"><path d="M28 16h162v176H28Z" fill="#cfc2a6" stroke="#6d6257" stroke-width="8"/><rect x="42" y="29" width="134" height="121" fill="#3a302d"/><path d="M47 139L83 87L103 111L129 65L174 139Z" fill="#6f6050"/><circle cx="72" cy="66" r="15" fill="#a89e7e"/><path d="M73 169h78" stroke="#766d64" stroke-width="7"/></svg>`};
function renderHeld(){const h=$('imm-held');h.innerHTML=SVGTOOL[player.tool]||SVGTOOL.flashlight;if(player.tool==='photo'&&player.photos[0]){const pic=document.createElement('img');pic.className='imm-held-photo';pic.src=player.photos[0].data;pic.alt='';h.append(pic);}ui.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===player.tool));$('imm-film-num').textContent=player.film;$('imm-bat-num').textContent=Math.ceil(player.battery)+'%';$('imm-hide').classList.toggle('active',player.hidden);}
function toast(message){const p=$('imm-prompt');p.hidden=false;p.textContent=message;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{p.hidden=true},2500);}
function saveSettings(){try{localStorage.setItem(STORE,JSON.stringify(prefs));}catch{}}
function equip(tool){if(!gameOn||dead)return;if(tool==='photo'&&player.photos.length===0){toast('NO PHOTOGRAPHS DEVELOPED YET.');return;}player.tool=tool;renderHeld();soundCue('click');}
function openPanel(type){if(dead)$('imm-gameover').hidden=true;settingsOpen=true;albumOpen=type==='album';$('imm-veil').hidden=false;if(document.pointerLockElement)document.exitPointerLock();const body=$('imm-panel-body');
 if(type==='settings')body.innerHTML=`<p class="imm-kicker">SURVIVAL CONFIGURATION</p><h2>GAME SETTINGS</h2><p>Mr. Morrow has no voice in 1983. His difficulty affects how quickly he patrols, sees movement, searches hiding places and recovers from the flash.</p><label>DIFFICULTY</label><div class="imm-diff-grid">${Object.keys(DIFFICULTY).map(d=>`<button class="imm-diff ${prefs.difficulty===d?'selected':''}" data-diff="${d}">${d.toUpperCase()}<small>${d==='easy'?'Longer flash stuns · gentler search':d==='normal'?'Balanced pursuit and resources':'Fast pursuit · intense searches'}</small></button>`).join('')}</div><label for="imm-sense">LOOK SENSITIVITY: <b id="imm-sense-value">${Math.round(prefs.sensitivity*100)}%</b></label><input id="imm-sense" type="range" min=".2" max="1.8" step=".1" value="${prefs.sensitivity}"/><label class="imm-check"><input id="imm-sound-set" type="checkbox" ${prefs.audio?'checked':''}/> SURVIVAL AUDIO & SCREAM</label><label class="imm-check"><input id="imm-motion-set" type="checkbox" ${prefs.motion?'checked':''}/> CAMERA SHAKE & HEAD BOB</label><p class="imm-small">Your existing story saves, original dialogue, and eight endings are unchanged.</p>`;
 else {body.innerHTML=`<p class="imm-kicker">JUNE MERCER · FILM ARCHIVE</p><h2>THE PHOTOGRAPHS</h2><p>Actual pictures taken with June’s in-game camera. Flash can stun Mr. Morrow for a few seconds.</p><div class="imm-photo-grid">${player.photos.length?player.photos.map((p,i)=>`<button data-photo="${i}" class="imm-photo"><img src="${p.data}" alt="Photo taken in Candlewick’s"/><span>${p.room} · ${p.time}</span></button>`).join(''):'<p>No exposures yet. Equip the camera, aim, and press SPACE or USE.</p>'}</div><div id="imm-photo-large"></div><button id="imm-export-pics">EXPORT PHOTO SHEET</button><button id="imm-open-journal">OPEN STORY EVIDENCE JOURNAL</button>`;}
}
function closePanel(){settingsOpen=false;albumOpen=false;$('imm-veil').hidden=true;if(dead)$('imm-gameover').hidden=false;}
$('imm-close').addEventListener('click',closePanel);
$('imm-veil').addEventListener('click',e=>{if(e.target===$('imm-veil'))closePanel();});
$('imm-panel-body').addEventListener('click',e=>{const d=e.target.closest('[data-diff]');if(d){prefs.difficulty=d.dataset.diff;saveSettings();openPanel('settings');return;}if(e.target.closest('#imm-open-journal')){closePanel();$('journal-button')?.click();return;}const pic=e.target.closest('[data-photo]');if(pic){const p=player.photos[+pic.dataset.photo];$('imm-photo-large').innerHTML=`<img src="${p.data}" alt="Selected photograph"/><p>${p.room} · ${p.time}</p>`;return;}if(e.target.closest('#imm-export-pics')){const out=JSON.stringify({game:'The Last Birthday',photos:player.photos},null,1),u=URL.createObjectURL(new Blob([out],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='JUNE_MERCER_PHOTOGRAPHS.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}});
$('imm-panel-body').addEventListener('input',e=>{if(e.target.id==='imm-sense'){prefs.sensitivity=+e.target.value;$('imm-sense-value').textContent=Math.round(prefs.sensitivity*100)+'%';}if(e.target.id==='imm-sound-set'){prefs.audio=e.target.checked;if(prefs.audio)audioReady();}if(e.target.id==='imm-motion-set')prefs.motion=e.target.checked;saveSettings();});
$('imm-gear').addEventListener('click',()=>openPanel('settings'));$('imm-album').addEventListener('click',()=>openPanel('album'));
ui.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>equip(b.dataset.tool)));
$('imm-hide').addEventListener('click',toggleHide);$('imm-touch-hide').addEventListener('click',toggleHide);$('imm-touch-use').addEventListener('click',useTool);
let touchRun=false;$('imm-touch-run').addEventListener('pointerdown',e=>{e.preventDefault();touchRun=true;});for(const k of ['pointerup','pointercancel','pointerleave'])$('imm-touch-run').addEventListener(k,()=>touchRun=false);
const joystick={x:0,y:0,pid:null};const stick=$('imm-stick');function updateStick(e){const b=stick.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;joystick.x=clamp((e.clientX-cx)/(b.width*.37),-1,1);joystick.y=clamp((e.clientY-cy)/(b.height*.37),-1,1);$('imm-stick-cap').style.transform=`translate(${joystick.x*30}px,${joystick.y*30}px)`;}
stick.addEventListener('pointerdown',e=>{joystick.pid=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);});stick.addEventListener('pointermove',e=>{if(e.pointerId===joystick.pid)updateStick(e);});function releaseStick(e){if(e.pointerId===joystick.pid){joystick.x=joystick.y=0;joystick.pid=null;$('imm-stick-cap').style.transform='translate(0,0)';}}for(const ev of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(ev,releaseStick);
let lookPointer=null,lookLast=null;
canvas.addEventListener('pointerdown',e=>{if(!gameOn||dead||settingsOpen||!$('modal-backdrop').hidden)return;audioReady();if(e.pointerType==='mouse'&&document.pointerLockElement!==canvas){canvas.requestPointerLock?.().catch(()=>{});}else if(e.pointerType!=='mouse')usingTouch=true;lookPointer=e.pointerId;lookLast={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer||!lookLast||document.pointerLockElement===canvas)return;lookDelta(e.clientX-lookLast.x,e.clientY-lookLast.y);lookLast={x:e.clientX,y:e.clientY};});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{if(e.pointerId===lookPointer){lookPointer=null;lookLast=null;}});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&gameOn&&!dead&&!settingsOpen)lookDelta(e.movementX,e.movementY);});
function lookDelta(dx,dy){player.a+=dx*.0026*prefs.sensitivity;player.p=clamp(player.p+dy*.0022*prefs.sensitivity,-.36,.36);}
window.addEventListener('keydown',e=>{if(!gameOn||dead||settingsOpen||!$('modal-backdrop').hidden||/INPUT|TEXTAREA/.test(e.target.tagName))return;const k=e.key.toLowerCase();if(['f','c','p','h','g',' ','e'].includes(k)){e.stopPropagation();}if('wasd'.includes(k)||k==='arrowup'||k==='arrowdown'||k==='arrowleft'||k==='arrowright'||k==='shift'){MOVE_KEYS.add(k);if(k.startsWith('arrow'))e.preventDefault();}
 if(e.repeat)return;if(k==='f'){equip('flashlight');}else if(k==='c'){equip('camera');}else if(k==='p'){equip('photo');}else if(k==='h'){toggleHide();}else if(k===' '){e.preventDefault();useTool();}else if(k==='e'){e.preventDefault();interact();}else if(k==='g'){openPanel('settings');}},true);
window.addEventListener('keyup',e=>MOVE_KEYS.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>MOVE_KEYS.clear());
function toggleHide(){if(!gameOn||dead||settingsOpen)return;const r=region(player.x,player.y),near=OBJECTS.some(o=>['desk','filing','arcade','door'].includes(o.kind)&&Math.hypot(o.x-player.x,o.y-player.y)<2.2);if(!player.hidden&&!near){toast('FIND A CABINET, DESK, OR DOORWAY TO HIDE.');return;}player.hidden=!player.hidden;player.noise=player.hidden?0:4;renderHeld();toast(player.hidden?'STAY STILL. HE IS SEARCHING.':'YOU LEFT YOUR HIDING SPOT.');}
function snapshot(){const s=document.createElement('canvas'),w=608,h=342;s.width=w;s.height=h;const g=s.getContext('2d');g.drawImage(canvas,0,0,w,h);const v=g.createLinearGradient(0,0,0,h);v.addColorStop(0,'#0a090a22');v.addColorStop(1,'#0a090a88');g.fillStyle=v;g.fillRect(0,0,w,h);g.fillStyle='#e3d7b9';g.font='16px Georgia';g.fillText('J. MERCER · 14 OCT 1983',16,h-16);return s.toDataURL('image/jpeg',.74);}
function useTool(){if(!gameOn||dead||settingsOpen)return;audioReady();if(player.tool==='camera')takePhoto();else if(player.tool==='photo')openPanel('album');else {if(player.battery<=0){toast('FLASHLIGHT BATTERY EMPTY.');return;}player.battery-=Math.min(player.battery,.08);$('imm-flash').classList.remove('torch-burst');void $('imm-flash').offsetWidth;$('imm-flash').classList.add('torch-burst');soundCue('click');const d=Math.hypot(player.x-bunny.x,player.y-bunny.y);if(d<3.5){player.noise=8;bunny.mode='investigate';bunny.target={x:player.x,y:player.y};}}renderHeld();}
function takePhoto(){if(player.film<=0){toast('NO FILM LEFT. PHOTOGRAPHS ARE SAVED IN THE ALBUM.');return;}const d=Math.hypot(player.x-bunny.x,player.y-bunny.y),ang=Math.atan2(bunny.y-player.y,bunny.x-player.x),facing=Math.abs(angleDelta(ang,player.a))<.46,visible=clearSight(player.x,player.y,bunny.x,bunny.y);const image=snapshot();player.photos.unshift({data:image,room:LOCATIONS[region(player.x,player.y)],time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});player.photos=player.photos.slice(0,8);player.captured++;player.film--;player.noise=13;soundCue('shutter');soundCue('flash');$('imm-flash').classList.remove('camera-burst');void $('imm-flash').offsetWidth;$('imm-flash').classList.add('camera-burst');
 if(bunny.awake&&d<7.5&&facing&&visible){bunny.stunned=DIFFICULTY[prefs.difficulty].stun;bunny.mode='stunned';bunny.path=[];toast('THE FLASH STOPPED HIM. RUN!');}else toast('PHOTOGRAPH CAPTURED · CHECK YOUR ALBUM');renderHeld();}
function interact(){if(!gameOn||dead||settingsOpen)return;const target=nearestObject(),d=target?Math.hypot(target.x-player.x,target.y-player.y):999;if(target&&d<2.3){soundCue('click');toast(`INSPECTED: ${target.label||target.kind.toUpperCase()}`);const buttons=[...document.querySelectorAll('#choices .choice:not([disabled])')];if(buttons.length===1){buttons[0].click();return;}if(buttons.length>1){const closest=buttons.find(b=>/INSPECT|SEARCH|OPEN|READ|EXAMINE|PHOTOGRAPH|LOOK/i.test(b.textContent));if(closest){closest.focus();document.getElementById('narrative')?.classList.remove('collapsed');toast('SELECT AN ACTION IN THE STORY PANEL');return;}}}
 const buttons=[...document.querySelectorAll('#choices .choice:not([disabled])')];if(buttons.length===1){buttons[0].click();return;}if(buttons.length>1){document.getElementById('narrative')?.classList.remove('collapsed');toast('CHOOSE WHAT JUNE DOES NEXT BELOW.');return;}toast('THERE IS NOTHING TO INTERACT WITH HERE.');}
function nearestObject(){let best=null,d=3.4;for(const o of OBJECTS){const dd=Math.hypot(player.x-o.x,player.y-o.y);if(dd<d){d=dd;best=o;}}return best;}
function ray(x,y,a){const dx=Math.cos(a),dy=Math.sin(a),mx=Math.floor(x),my=Math.floor(y),ddx=Math.abs(1/(dx||1e-7)),ddy=Math.abs(1/(dy||1e-7));let ix=mx,iy=my,stepx=dx<0?-1:1,stepy=dy<0?-1:1,sideX=(dx<0?x-mx:mx+1-x)*ddx,sideY=(dy<0?y-my:my+1-y)*ddy,side=0,t=0;
 for(let i=0;i<55;i++){if(sideX<sideY){t=sideX;sideX+=ddx;ix+=stepx;side=0;}else{t=sideY;sideY+=ddy;iy+=stepy;side=1;}if(wall(ix+.5,iy+.5))break;}
 const hitX=x+dx*t,hitY=y+dy*t,u=side===0?hitY-Math.floor(hitY):hitX-Math.floor(hitX);return {d:Math.max(.08,t),u,side,tile:tile(ix+.5,iy+.5),wx:ix,wy:iy};}
function resize(){const dpr=Math.min(devicePixelRatio||1,1.75),w=Math.max(320,window.innerWidth),h=Math.max(280,window.innerHeight);if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';}return {w,h,dpr};}
const morrowImg=new Image();morrowImg.src='./assets/morrow.webp';
const zBuffer=[];
function roomPalette(id){const pal={exterior:['#080d14','#203039','#545358'],foyer:['#141014','#48403a','#785f4d'],dining:['#1f1010','#50402f','#745b45'],stage:['#100f17','#392936','#79504d'],arcade:['#0b1021','#302f47','#59506c'],office:['#17130d','#373026','#796145'],maintenance:['#0b1315','#354747','#65726a'],archive:['#101012','#37312f','#5d5147'],tunnel:['#130e12','#4d342e','#71433e'],storage:['#14141a','#424045','#51464a'],service:['#0d1218','#3d4748','#656968']};return pal[id]||pal.foyer;}
function drawWorld(t){const {w,h,dpr}=resize();ctx.setTransform(dpr,0,0,dpr,0,0);const room=region(player.x,player.y),pal=roomPalette(room),horizon=h*(.48-player.p)+(prefs.motion?Math.sin(t*7)*Math.min(5,player.moving?3:0):0);
 let sky=ctx.createLinearGradient(0,0,0,horizon+2);sky.addColorStop(0,pal[0]);sky.addColorStop(.65,pal[1]);sky.addColorStop(1,pal[0]);ctx.fillStyle=sky;ctx.fillRect(0,0,w,horizon+3);
 let floor=ctx.createLinearGradient(0,horizon,0,h);floor.addColorStop(0,'#151517');floor.addColorStop(.5,pal[1]);floor.addColorStop(1,'#07090d');ctx.fillStyle=floor;ctx.fillRect(0,horizon,w,h-horizon);
 // Weathered tiles with perspective seams, illuminated puddles and ceiling ribs.
 for(let i=1;i<20;i++){const z=1+i*.6,y=horizon+h/(z*1.6);if(y>h)continue;ctx.strokeStyle=`rgba(165,149,126,${.22/i})`;ctx.lineWidth=i<3?1.4:.7;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 const FOV=Math.PI/2.85,step=w<650?2:2.2,columns=Math.ceil(w/step),depth=[];
 for(let i=0;i<columns;i++){const sx=i*step,rel=sx/w-.5,a=player.a+rel*FOV,r=ray(player.x,player.y,a),d=r.d*Math.cos(rel*FOV),hei=Math.min(h*6,h/(d*.64)),top=horizon-hei*.5,left=sx;
 const v=roomPalette(region(r.wx+.5,r.wy+.5)),shade=clamp(1-d/21,.17,1)*(r.side===1?.72:1)*(r.tile===2?.64:1),base=[parseInt(v[2].slice(1,3),16),parseInt(v[2].slice(3,5),16),parseInt(v[2].slice(5,7),16)];ctx.fillStyle=`rgb(${base.map(q=>Math.round(q*shade)).join(',')})`;ctx.fillRect(left,top,step+1,hei);
 // Physical panel joints, worn wainscoting and dark gouges: rendered at screen resolution.
 const seam=Math.abs(r.u-.5);if(r.u<.027||r.u>.974){ctx.fillStyle=`rgba(0,0,0,${clamp(.30*shade+.2,.15,.5)})`;ctx.fillRect(left,top,step+1,hei);}
 const plankY=top+hei*.68;if(hei>40){ctx.fillStyle=`rgba(12,11,10,${.25*shade})`;ctx.fillRect(left,plankY,step+1,Math.max(1,hei*.012));ctx.fillStyle=`rgba(186,153,101,${shade*.11})`;ctx.fillRect(left,top+hei*.23,step+1,Math.max(1,hei*.006));}
 if(i%3===0&&hei>65){const scratch=(Math.sin(r.wx*83.4+r.wy*57.1+r.u*91.3)*.5+.5);if(scratch>.78){ctx.fillStyle=`rgba(16,13,13,${shade*.24})`;ctx.fillRect(left,top+hei*(.15+scratch*.35),Math.max(1,step*.34),hei*.1);}}
 // Face-toward-light shading. A dim ring surrounds the flashlight beam.
 const distFromAim=Math.abs(rel)*2;const light=player.tool==='flashlight'&&player.battery>0?Math.max(0,1-distFromAim*1.8)*(.20+.48*shade):0;ctx.fillStyle=`rgba(229,207,154,${light})`;ctx.fillRect(left,top,step+1,hei);
 depth.push(d);
 }
 zBuffer.length=0;zBuffer.push(...depth);
 // Fine rain/motes instead of fixed sprite wallpaper.
 ctx.save();for(let i=0;i<70;i++){const x=((i*79.67+(t*(room==='exterior'?70:4))*(.1+i%4*.05))%w),y=((i*173.4+(room==='exterior'?t*90:0))%h);ctx.strokeStyle=room==='exterior'?'#b1b9c11a':'#b5a7911c';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y+(room==='exterior'?11:1));ctx.stroke();}ctx.restore();
 drawObjects(w,h,horizon,FOV);drawBunny(w,h,horizon,FOV,t);
 // Filmic vignette and torch cone; suppress peripheral visibility when batteries fail.
 const lamp=player.tool==='flashlight'&&player.battery>0,g=ctx.createRadialGradient(w*.50,h*.51,0,w*.50,h*.51,Math.max(w,h)*(lamp?.79:.57));g.addColorStop(0,lamp?'#00000002':'#0000002a');g.addColorStop(.39,lamp?'#00000022':'#00000070');g.addColorStop(1,'#000000cd');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 if(player.hidden){ctx.fillStyle='#040405bb';ctx.fillRect(0,0,w,h);ctx.clearRect(w*.38,h*.2,w*.24,h*.5);ctx.strokeStyle='#332927';ctx.lineWidth=18;ctx.strokeRect(w*.38,h*.2,w*.24,h*.5);}
 if(bunny.awake){const d=Math.hypot(player.x-bunny.x,player.y-bunny.y),v=Math.max(0,1-d/7);$('imm-danger-bar').style.width=Math.round(v*100)+'%';$('imm-threat').classList.toggle('visible',v>.04);$('imm-hit').style.opacity=(v*.17).toFixed(2);}else{$('imm-threat').classList.remove('visible');$('imm-hit').style.opacity='0';}
 }
function projectSprite(x,y,w,h,horizon,FOV){const dx=x-player.x,dy=y-player.y,dist=Math.hypot(dx,dy),rel=angleDelta(Math.atan2(dy,dx),player.a);if(Math.abs(rel)>FOV*.78||dist<.1)return null;const sx=w*(.5+rel/FOV),width=h/(dist*.66),wallZ=zBuffer[clamp(Math.floor(sx/(w/(zBuffer.length||1))),0,zBuffer.length-1)]??999;if(dist>wallZ+.27)return null;return {x:sx,y:horizon,scale:width,dist};}
function drawObjects(w,h,horizon,FOV){let arr=OBJECTS.map(o=>({o,p:projectSprite(o.x,o.y,w,h,horizon,FOV)})).filter(v=>v.p).sort((a,b)=>b.p.dist-a.p.dist);for(const {o,p} of arr){const s=clamp(p.scale,.2,h*5);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=clamp(1-p.dist/23,.26,.96);
 if(o.kind==='neon'){ctx.font=`bold ${Math.min(55,s*.42)}px Georgia`;ctx.textAlign='center';ctx.shadowColor='#bd5e4a';ctx.shadowBlur=20;ctx.fillStyle='#da7557';ctx.fillText(o.label,0,-s*.11);ctx.shadowBlur=0;ctx.font=`${s*.17}px Georgia`;ctx.fillStyle='#e8c394';ctx.fillText('CELEBRATION PALACE',0,s*.1);}
 if(o.kind==='door'){ctx.fillStyle='#171314';ctx.strokeStyle='#877363';ctx.lineWidth=Math.max(1,s*.038);ctx.fillRect(-s*.30,-s*.85,s*.6,s*1.25);ctx.strokeRect(-s*.30,-s*.85,s*.6,s*1.25);ctx.fillStyle='#ac8551';ctx.beginPath();ctx.arc(s*.18,-s*.17,s*.035,0,TAU);ctx.fill();ctx.fillStyle='#ae382d';ctx.font=`bold ${s*.1}px Georgia`;ctx.textAlign='center';ctx.fillText(o.label||'EXIT',0,-s*.60);}
 if(o.kind==='filing'||o.kind==='relay'){ctx.fillStyle=o.kind==='relay'?'#394b4c':'#42362f';ctx.strokeStyle='#b49b71';ctx.lineWidth=s*.014;ctx.fillRect(-s*.31,-s*.58,s*.62,s*.82);ctx.strokeRect(-s*.31,-s*.58,s*.62,s*.82);for(let i=0;i<3;i++){ctx.strokeRect(-s*.25,-s*.51+i*s*.23,s*.5,s*.2);ctx.fillStyle='#c0a077';ctx.fillRect(-s*.06,-s*.42+i*s*.23,s*.12,s*.025);}}
 if(o.kind==='arcade'){ctx.fillStyle='#191923';ctx.strokeStyle='#74616b';ctx.lineWidth=s*.02;ctx.beginPath();ctx.moveTo(-s*.30,s*.35);ctx.lineTo(-s*.34,-s*.74);ctx.lineTo(s*.25,-s*.74);ctx.lineTo(s*.32,s*.35);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#9b4258';ctx.fillRect(-s*.26,-s*.68,s*.47,s*.18);ctx.fillStyle='#2e4b72';ctx.fillRect(-s*.25,-s*.42,s*.47,s*.43);ctx.shadowColor='#de6a8f';ctx.shadowBlur=12;ctx.fillStyle='#df8f93';ctx.font=`bold ${s*.13}px Georgia`;ctx.textAlign='center';ctx.fillText(o.label||'ARCADE',0,-s*.55);ctx.shadowBlur=0;}
 if(['table','desk','cake','curtain'].includes(o.kind)){if(o.kind==='curtain'){ctx.fillStyle='#51242f';ctx.fillRect(-s*.55,-s*.96,s*1.1,s*1.22);for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#401e27':'#713a47';ctx.fillRect(-s*.53+i*s*.16,-s*.96,s*.09,s*1.18);}}
 else if(o.kind==='cake'){ctx.fillStyle='#eee2bc';ctx.fillRect(-s*.22,-s*.2,s*.44,s*.29);ctx.fillStyle='#9a5160';ctx.fillRect(-s*.22,s*.01,s*.44,s*.08);for(let i=0;i<5;i++){ctx.fillStyle='#e9d0a1';ctx.fillRect(-s*.18+i*s*.085,-s*.34,s*.02,s*.15);ctx.fillStyle='#dd9347';ctx.beginPath();ctx.ellipse(-s*.17+i*s*.085,-s*.37,s*.015,s*.038,0,0,TAU);ctx.fill();}}
 else{ctx.fillStyle=o.kind==='desk'?'#55402c':'#7c6251';ctx.fillRect(-s*.39,-s*.2,s*.78,s*.16);ctx.fillRect(-s*.35,-s*.05,s*.07,s*.45);ctx.fillRect(s*.29,-s*.05,s*.07,s*.45);}}
 ctx.restore();}}
function drawBunny(w,h,horizon,FOV,t){if(!bunny.awake)return;const p=projectSprite(bunny.x,bunny.y,w,h,horizon,FOV);if(!p)return;const tall=clamp(p.scale*1.55,1,h*5),width=tall*(650/1200),bob=Math.sin(bunny.walk*8)*Math.min(10,tall*.028);ctx.save();if(bunny.mode==='stunned')ctx.globalAlpha=.87;ctx.translate(p.x,horizon+tall*.16+bob);ctx.rotate(bunny.mode==='chase'?Math.sin(t*7)*.018:Math.sin(t*2)*.005);if(morrowImg.complete&&morrowImg.naturalWidth>0){ctx.shadowColor='#000';ctx.shadowBlur=Math.min(55,tall*.14);ctx.drawImage(morrowImg,-width*.5,-tall*.88,width,tall);ctx.shadowBlur=0;}else{ctx.fillStyle='#c1a999';ctx.fillRect(-width*.3,-tall*.6,width*.6,tall*.6);ctx.fillStyle='#0a0b0e';ctx.fillRect(-width*.25,-tall*.48,width*.19,tall*.12);ctx.fillRect(width*.06,-tall*.48,width*.19,tall*.12);}ctx.restore();}
function updateMovement(dt,t){if(player.hidden){player.moving=false;return;}let forward=Number(MOVE_KEYS.has('w')||MOVE_KEYS.has('arrowup'))-Number(MOVE_KEYS.has('s')||MOVE_KEYS.has('arrowdown'))-joystick.y;
 let side=Number(MOVE_KEYS.has('d'))-Number(MOVE_KEYS.has('a'))+joystick.x;
 if(MOVE_KEYS.has('arrowleft'))player.a-=dt*1.9*prefs.sensitivity;if(MOVE_KEYS.has('arrowright'))player.a+=dt*1.9*prefs.sensitivity;
 const l=Math.hypot(forward,side);player.moving=l>.15;player.sprinting=player.moving&&(MOVE_KEYS.has('shift')||touchRun)&&player.stamina>1;player.stamina=clamp(player.stamina+(player.sprinting?-30:19)*dt,0,100);
 if(player.moving){forward/=Math.max(1,l);side/=Math.max(1,l);const sp=player.sprinting?3.28:1.75,dx=(Math.cos(player.a)*forward-Math.sin(player.a)*side)*dt*sp,dy=(Math.sin(player.a)*forward+Math.cos(player.a)*side)*dt*sp;if(canStand(player.x+dx,player.y))player.x+=dx;if(canStand(player.x,player.y+dy))player.y+=dy;
 player.noise=clamp(player.noise+(player.sprinting?12:4)*dt,0,100);if(t-lastStep>(player.sprinting?.27:.48)){soundCue('step');lastStep=t;}}
 else player.noise=Math.max(0,player.noise-7*dt);
 if(player.tool==='flashlight'&&player.battery>0)player.battery=Math.max(0,player.battery-DIFFICULTY[prefs.difficulty].battery*dt);
 if(player.battery===0&&player.tool==='flashlight'){$('imm-bat-num').style.color='#dd6a67';}
 const hand=$('imm-hand');const sway=prefs.motion?Math.sin(t*(player.moving?9:1.8))*Math.min(8,player.moving?8:2):0;hand.style.transform=`translate3d(${clamp(Math.sin(player.a)*15,-16,16)+sway}px,${Math.sin(t*(player.moving?15:1.5))*Math.min(6,player.moving?6:2)}px,0) rotate(${Math.sin(t*2)*1.2}deg)`;
 $('imm-room').textContent=LOCATIONS[region(player.x,player.y)];const o=nearestObject();const near=o&&Math.hypot(o.x-player.x,o.y-player.y)<2.2;if(near&&$('imm-prompt').hidden){$('imm-prompt').textContent='[ E ] '+(o.label||o.kind.toUpperCase());$('imm-prompt').hidden=false;}else if(!near&&$('imm-prompt').textContent.startsWith('[ E ]'))$('imm-prompt').hidden=true;
 $('imm-bat-num').textContent=Math.ceil(player.battery)+'%';}
function updateBunny(dt,t){if(!bunny.awake||dead)return;const df=DIFFICULTY[prefs.difficulty];if(bunny.stunned>0){bunny.stunned=Math.max(0,bunny.stunned-dt);if(!bunny.stunned){bunny.mode='investigate';bunny.target={x:player.x,y:player.y};}return;}
 const dist=Math.hypot(player.x-bunny.x,player.y-bunny.y),visible=dist<df.sight&&clearSight(bunny.x,bunny.y,player.x,player.y),heard=dist<df.hearing*(player.sprinting?1.4:player.moving?.85:.26)+player.noise*.05;
 if(!player.hidden&&(visible||heard)){if(!lastChase)sightings++;bunny.mode='chase';bunny.target={x:player.x,y:player.y};bunny.search=2.7;}
 else if(bunny.mode==='chase'){bunny.search-=dt;if(bunny.search<=0){bunny.mode='investigate';bunny.search=0;}}
 else if(player.hidden&&dist<2.6){bunny.mode='search';bunny.search+=dt;if(bunny.search>1/df.search){scare();return;}}
 else if(bunny.mode==='search'&&!player.hidden){bunny.mode='chase';bunny.target={x:player.x,y:player.y};}
 lastChase=bunny.mode==='chase';
 if(bunny.mode==='roam'&&!bunny.target){bunny.target={x:patrol[bunny.nextWay%patrol.length][0],y:patrol[bunny.nextWay%patrol.length][1]};bunny.nextWay++;}
 const dest=bunny.mode==='chase'&&!player.hidden?{x:player.x,y:player.y}:bunny.target;
 bunny.thinking-=dt;
 if(dest&&bunny.thinking<=0){bunny.path=pathfind(bunny,dest);bunny.thinking=bunny.mode==='chase'?.27:.95;}
 const next=bunny.path[0]||dest;
 if(next){const dd=Math.hypot(next.x-bunny.x,next.y-bunny.y);if(dd<.17){if(bunny.path.length)bunny.path.shift();else{bunny.target=null;if(bunny.mode==='investigate')bunny.mode='roam';}}else{const vx=(next.x-bunny.x)/dd,vy=(next.y-bunny.y)/dd,spd=df.speed*(bunny.mode==='chase'?1.24:bunny.mode==='search'?.46:.72),s=dt*spd;bunny.a=Math.atan2(vy,vx);if(canStand(bunny.x+vx*s,bunny.y))bunny.x+=vx*s;if(canStand(bunny.x,bunny.y+vy*s))bunny.y+=vy*s;bunny.walk+=dt*spd;if(t-bunny.walkNoise>.75){bunny.walkNoise=t;if(dist<12)soundCue('clank');}}}
 if(dist<.63&&!player.hidden){scare();}if(player.hidden&&bunny.mode==='chase'&&dist<2.5){bunny.mode='search';bunny.search=0;}
}
let scareTimer=null;
function reportDeath(){
 const area=LOCATIONS[region(player.x,player.y)]||'UNKNOWN ROOM';
 const minutes=Math.max(0,Math.floor((performance.now()-startedAt)/60000));
 const seconds=Math.max(0,Math.floor((performance.now()-startedAt)/1000)%60);
 const proof=Number(document.getElementById('evidence-count')?.textContent||'0');
 const section=region(player.x,player.y);
 const details={stage:['THE FINAL CURTAIN','The old stage lights burn red. His hand closes around the camera.'],arcade:['NO MORE CREDITS','The cabinets go black, one by one. Heavy shoes scrape against the tiles.'],tunnel:['NO WAY OUT','The exit bends shut. The last thing you see is the rabbit waiting in the doorway.'],maintenance:['SOMEONE IS INSIDE','The hiding place is too shallow. His ruined ear slips into the gap.'],archive:['THE RECORD THAT VANISHED','The folders spill into the dark. The heavy footsteps stop right behind you.']};
 const [subtitle,detail]=details[section]||['CAUGHT BY MR. MORROW','He finds you in the dark. The ruined costume makes no sound.'];
 $('imm-death-subtitle').textContent=subtitle;
 $('imm-death-detail').textContent=detail;
 $('imm-stat-time').textContent=`${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
 $('imm-stat-area').textContent=area;
 $('imm-stat-proof').textContent=String(proof);
 $('imm-stat-photo').textContent=String(player.captured);
 $('imm-stat-spotted').textContent=String(sightings);
 $('imm-stat-diff').textContent=prefs.difficulty.toUpperCase();
 $('imm-death-footer').textContent=deathCount===1?'THE PARTY NEVER REALLY ENDED.':'YOU HAVE BEEN HERE BEFORE.';
 $('imm-gameover').dataset.deathArea=section;
 $('imm-reload').disabled=false;
}
function scare(){
 if(dead||!gameOn)return;
 dead=true;deathCount++;MOVE_KEYS.clear();
 if(document.pointerLockElement)document.exitPointerLock();
 soundCue('alarm');soundCue('scream');
 $('imm-scare').hidden=false;$('imm-scare').classList.remove('run');
 void $('imm-scare').offsetWidth;$('imm-scare').classList.add('run');
 $('imm-scare').classList.toggle('calm',!prefs.motion);
 clearTimeout(scareTimer);
 scareTimer=setTimeout(()=>{
  $('imm-scare').hidden=true;reportDeath();$('imm-gameover').hidden=false;
  $('imm-again').focus({preventScroll:true});
 },prefs.motion?1900:900);
}
function retry(checkpoint=true){
 dead=false;settingsOpen=false;lastChase=false;MOVE_KEYS.clear();
 $('imm-gameover').hidden=true;$('imm-scare').hidden=true;
 const label=($('location-name')?.textContent||'').toLowerCase();
 const lookup={"candlewick’s forecourt":"exterior","reception foyer":"foyer","birthday auditorium":"dining","the midnight arcade":"arcade","edwin candlewick’s office":"office","maintenance workshop":"maintenance","records archive":"archive","the service passage":"tunnel","the last birthday stage":"stage"};
 const area=lookup[label]||'foyer';
 const p=SCENE_SPAWN[area]||SCENE_SPAWN.foyer;
 player.x=p[0];player.y=p[1];player.hidden=false;player.noise=0;player.stamina=100;
 player.battery=Math.max(checkpoint?25:60,player.battery);
 bunny.x=22.5;bunny.y=4.5;bunny.mode='roam';bunny.stunned=4;bunny.path=[];bunny.target=null;bunny.search=0;
 renderHeld();toast('THE PALACE DOES NOT FORGET.');
}
$('imm-again').addEventListener('click',()=>retry(true));
$('imm-reload').addEventListener('click',()=>{
 retry(true);
 // Use the original autosave loader rather than the menu button's stale enabled state.
 $('save-button')?.click();
 const loadAuto=document.querySelector('#modal-body [data-action="load-slot"][data-slot="auto"]');
 if(loadAuto&&!loadAuto.disabled)loadAuto.click();
 else{$('modal-close')?.click();toast('NO AUTOSAVE AVAILABLE.');}
});
$('imm-settings').addEventListener('click',()=>openPanel('settings'));
$('imm-evidence').addEventListener('click',()=>openPanel('album'));
$('imm-menu').addEventListener('click',()=>{
 clearTimeout(scareTimer);dead=false;settingsOpen=false;
 $('imm-gameover').hidden=true;$('imm-scare').hidden=true;
 $('pause-button').click();
 const b=document.querySelector('#modal-body [data-action="menu"]');
 if(b)b.click();else toast('OPEN PAUSE AND SELECT MAIN MENU.');
});
// Add difficulty to both the original title and the original settings modal without modifying their handlers.
const difficultyMenu=document.createElement('button');difficultyMenu.type='button';difficultyMenu.className='menu-choice';difficultyMenu.textContent='SURVIVAL DIFFICULTY  ↗';difficultyMenu.addEventListener('click',()=>openPanel('settings'));document.querySelector('.title-menu')?.appendChild(difficultyMenu);
const obsSettings=new MutationObserver(()=>{const title=$('modal-title')?.textContent||'',body=$('modal-body');if(!body||!(/settings/i.test(title))||body.querySelector('#imm-legacy-settings'))return;const d=document.createElement('div');d.id='imm-legacy-settings';d.innerHTML=`<h3>SURVIVAL MODE</h3><button id="imm-open-legacy" class="outline-button">SELECT EASY · NORMAL · NIGHTMARE</button>`;body.append(d);d.querySelector('button').addEventListener('click',()=>{document.getElementById('modal-close')?.click();openPanel('settings');});});obsSettings.observe($('modal-backdrop'),{childList:true,subtree:true});
// Use chapter changes to activate Mr. Morrow, and scene changes to align his pursuit to story navigation.
const observer=new MutationObserver(()=>syncStory());observer.observe($('play-screen'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
function syncStory(){const active=!$('play-screen').hidden&&$('ending-screen').hidden;gameOn=active;root.classList.toggle('immersive-active',active);ui.classList.toggle('playing',active);
 if(!active){MOVE_KEYS.clear();return;}const location=($('location-name')?.textContent||'').toLowerCase();const labels={'candlewick’s forecourt':'exterior','reception foyer':'foyer','birthday auditorium':'dining','the midnight arcade':'arcade','edwin candlewick’s office':'office','maintenance workshop':'maintenance','records archive':'archive','the service passage':'tunnel','the last birthday stage':'stage'};const found=labels[location]||Object.keys(LOCATIONS).find(k=>LOCATIONS[k].toLowerCase()===location);const node=$('node-title')?.textContent||'';
 if(node!==sceneNode){sceneNode=node;const matched=found||'foyer';const p=SCENE_SPAWN[matched];if(p&&region(player.x,player.y)!==matched){player.x=p[0];player.y=p[1];player.hidden=false;}bunny.awake=matched!=='exterior';if(!bunny.awake){bunny.x=22.5;bunny.y=4.5;}}
 if(!frame){last=performance.now();frame=requestAnimationFrame(tick);}renderHeld();}
function tick(now){frame=requestAnimationFrame(tick);const dt=clamp((now-last)/1000,0,.055),t=now/1000;last=now;
 if(!gameOn||dead||settingsOpen||!$('modal-backdrop').hidden||document.hidden)return;updateMovement(dt,t);updateBunny(dt,t);drawWorld(t);
 if(t-lastSave>3){lastSave=t;try{sessionStorage.setItem('tlb-immersive-location',JSON.stringify({x:player.x,y:player.y,film:player.film,battery:player.battery}));}catch{}}
}
window.addEventListener('resize',()=>{if(gameOn)drawWorld(performance.now()/1000);});
$('new-game')?.addEventListener('click',()=>{startedAt=performance.now();sightings=0;deathCount=0;lastChase=false;player.x=4.5;player.y=14.5;player.a=-Math.PI/2;player.film=10;player.battery=100;player.photos=[];player.captured=0;bunny.x=22.5;bunny.y=4.5;bunny.mode='roam';bunny.target=null;dead=false;},true);
$('continue-game')?.addEventListener('click',()=>{try{const p=JSON.parse(sessionStorage.getItem('tlb-immersive-location')||'{}');if(Number.isFinite(p.x)&&canStand(p.x,p.y)){player.x=p.x;player.y=p.y;}if(Number.isFinite(p.battery))player.battery=p.battery;if(Number.isFinite(p.film))player.film=p.film;}catch{}},true);
renderHeld();syncStory();
})();
