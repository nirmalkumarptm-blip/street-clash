import * as THREE from 'three';
import { createArena } from './world.js';
import { createFighter } from './fighter.js';

const canvas=document.querySelector('#game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x080910);scene.fog=new THREE.Fog(0x080910,20,45);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,100);camera.position.set(0,7,18);camera.lookAt(0,1.8,0);
createArena(scene);
const player=createFighter(scene,{x:-3.8,accent:0xff294d,character:'nirmal'});
const rival=createFighter(scene,{x:3.8,accent:0xe52cff,faceLeft:true,character:'priya'});
const $=s=>document.querySelector(s);
const tagline=$('#tagline');
const ui={menu:$('#menu'),hud:$('#hud'),controls:$('#touchControls'),status:$('#status'),clock:$('#clock')};
let running=false,roundTime=180,last=0,roundsP=0,roundsR=0,move=0,keys={},roundEnded=false;
let soundEnabled=true,vibrationEnabled=true,language='en';
let playerCooldown=0,rivalCooldown=0,aiThink=0,aiBlock=0,aiDodge=0,comboCount=0,comboTimer=0,dodgeCooldown=0;
const comboUI=$('#combo'),effects=[];let audioCtx=null;
function sound(freq=150,duration=.08,type='square',gain=.035){if(!soundEnabled)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(35,freq*.48),audioCtx.currentTime+duration);g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}catch(e){}}
function impact(target,strong=false){const pos=target.group.position.clone();pos.y+=1.65;pos.x+=(target===rival?-.35:.35);const material=new THREE.MeshBasicMaterial({color:strong?0xffd34e:0xff6b9b,transparent:true,opacity:1});const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(strong?.28:.18,1),material);mesh.position.copy(pos);scene.add(mesh);effects.push({mesh,life:.24,max:.24});}
function updateEffects(dt){for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.mesh.scale.multiplyScalar(1+dt*5);e.mesh.material.opacity=Math.max(0,e.life/e.max);if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1);}}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function showStatus(text,ms=900){ui.status.textContent=text;if(ms) setTimeout(()=>{if(ui.status.textContent===text)ui.status.textContent='';},ms);}
function updateHUD(){
 $('#hp1').style.width=player.hp+'%';$('#hp2').style.width=rival.hp+'%';
 $('#rounds1').textContent='ROUNDS '+roundsP;$('#rounds2').textContent='ROUNDS '+roundsR;
 $('#power1').style.width=player.power+'%';$('#power2').style.width=rival.power+'%';
 $('#powerText').textContent='POWER '+Math.floor(player.power)+'%';
}
function startMatch(){comboCount=0;comboTimer=0;if(audioCtx?.state==='suspended')audioCtx.resume();ui.menu.classList.add('hidden');ui.hud.classList.remove('hidden');ui.controls.classList.remove('hidden');ui.status.classList.remove('hidden');running=true;startRound(true);}
function startRound(first=false){comboCount=0;comboTimer=0;comboUI.classList.add('hidden');roundEnded=false;roundTime=180;player.hp=100;rival.hp=100;player.power=0;rival.power=0;player.blocking=false;rival.blocking=false;player.group.position.set(-3.8,0,0);rival.group.position.set(3.8,0,0);player.group.rotation.y=0;rival.group.rotation.y=Math.PI;player.setAnimation('idle');rival.setAnimation('idle');playerCooldown=rivalCooldown=0;updateHUD();$('#clock').textContent='180';showStatus(first?'ROUND 1':`ROUND ${roundsP+roundsR+1}`,1100);setTimeout(()=>showStatus('FIGHT!',800),1050);}
function endRound(reason='TIME UP'){
 if(roundEnded)return;roundEnded=true;player.blocking=false;rival.blocking=false;
 let winner=player.hp===rival.hp?'DRAW':player.hp>rival.hp?'NIRMAL WINS':'PRIYA WINS';
 if(player.hp>rival.hp)roundsP++;else if(rival.hp>player.hp)roundsR++;
 updateHUD();showStatus(`${reason} — ${winner}`,1700);
 setTimeout(()=>{if(roundsP>=2||roundsR>=2){
 running=false;
 const winner=roundsP>=2?'NIRMAL':'PRIYA';
 $('#resultTitle').textContent=winner+' WINS!';
 $('#resultSub').textContent='MATCH COMPLETE  •  '+roundsP+' - '+roundsR;
 $('#resultPanel').classList.remove('hidden');
 $('#rematchBtn').classList.remove('hidden');
 return;
 }startRound();},1900);
}
function hit(attacker,target,kind){
 if(!running||roundEnded)return;
 const cost=kind==='special'?100:0;if(cost&&attacker.power<cost)return;
 if(cost)attacker.power=0;else attacker.power=clamp(attacker.power+(kind==='kick'?15:10),0,100);
 attacker.animateAttack(kind);sound(kind==='special'?260:kind==='kick'?190:145,kind==='special'?.2:.09,kind==='special'?'sawtooth':'square',kind==='special'?.06:.035);
 const distance=Math.abs(attacker.group.position.x-target.group.position.x);
 const reach=kind==='special'?3.1:kind==='kick'?2.65:kind==='combo'?2.35:2.15;
 if(distance>reach){updateHUD();return;}
 const dodged=target.dodgeTime>0;
 if(dodged){showStatus(target===player?'DODGE!':'PRIYA DODGED!',450);sound(330,.06,'sine',.02);updateHUD();return;}
 const blocked=target.blocking;
 const damage=kind==='special'?30:kind==='kick'?14:kind==='combo'?12:9;
 if(blocked){sound(95,.07,'triangle',.025);target.hp=clamp(target.hp-damage*.18,0,100);target.power=clamp(target.power+8,0,100);target.setAnimation('block');}
 else {sound(kind==='special'?420:230,.12,'sawtooth',.045);impact(target,kind==='special');if(attacker===player){comboCount=comboTimer>0?comboCount+1:1;comboTimer=1.35;if(comboCount>=2){comboUI.textContent=`${comboCount} HIT COMBO`;comboUI.classList.remove('hidden');}}target.hp=clamp(target.hp-damage,0,100);target.power=clamp(target.power+12,0,100);target.setAnimation('hit');target.group.position.x+=Math.sign(target.group.position.x-attacker.group.position.x)*.22;}
 updateHUD();if(target.hp<=0)endRound('KNOCKOUT');
}
function action(name){
 if(!running||roundEnded)return;
 const localFighter=onlineMode&&onlineRole==='guest'?rival:player;
 const enemy=localFighter===player?rival:player;
 if(onlineMode&&onlineSocket?.connected) onlineSocket.emit('player-input',{room:window.SC_ROOM,data:{action:name}});
 if(name==='punch'&&playerCooldown<=0){hit(localFighter,enemy,'punch');playerCooldown=.32;}
 if(name==='kick'&&playerCooldown<=0){hit(localFighter,enemy,'kick');playerCooldown=.58;}
 if(name==='special'&&localFighter.power>=100&&playerCooldown<=0){hit(localFighter,enemy,'special');playerCooldown=.9;}
 if(name==='block'){localFighter.blocking=true;localFighter.setAnimation('block');}
 if(name==='jump'&&localFighter.anim!=='jump')localFighter.jump();
 if(name==='dodge'&&dodgeCooldown<=0){localFighter.dodgeTime=.32;localFighter.setAnimation('dodge');localFighter.group.position.x=clamp(localFighter.group.position.x+(enemy.group.position.x>localFighter.group.position.x?-1:1)*.85,-7,7);dodgeCooldown=1.15;sound(390,.08,'sine',.025);showStatus('DODGE',350);}
}
$('#startBtn').addEventListener('click',startMatch);
$('#settingsBtn').addEventListener('click',()=>$('#settingsPanel').classList.toggle('hidden'));
$('#closeSettings').addEventListener('click',()=>$('#settingsPanel').classList.add('hidden'));
$('#soundToggle').addEventListener('change',e=>{soundEnabled=e.target.checked;});
$('#vibrationToggle').addEventListener('change',e=>{vibrationEnabled=e.target.checked;});
$('#languageSelect').addEventListener('change',e=>{
 language=e.target.value;
 $('#startBtn').textContent=language==='ta'?'சண்டையை தொடங்கு':'START FIGHT';
 $('#settingsBtn').textContent=language==='ta'?'அமைப்புகள்':'SETTINGS';
 tagline.textContent=language==='ta'?'சண்டைக்கு தயாராகுங்கள்':'ENTER THE UNDERGROUND';
});
function rematch(){roundsP=roundsR=0;$('#rematchBtn').classList.add('hidden');$('#resultPanel').classList.add('hidden');startRound(true);running=true;}
$('#rematchBtn').addEventListener('click',rematch);
$('#resultRematch').addEventListener('click',rematch);
$('#resultMenu').addEventListener('click',()=>{$('#resultPanel').classList.add('hidden');$('#menuBtn').click();});
$('#menuBtn').addEventListener('click',()=>{$('#resultPanel').classList.add('hidden');running=false;ui.menu.classList.remove('hidden');ui.hud.classList.add('hidden');ui.controls.classList.add('hidden');ui.status.classList.add('hidden');$('#rematchBtn').classList.add('hidden');roundsP=roundsR=0;});
document.querySelectorAll('[data-action]').forEach(b=>{const a=b.dataset.action;b.addEventListener('pointerdown',e=>{e.preventDefault();action(a)});const release=()=>{if(a==='block'){const f=onlineMode&&onlineRole==='guest'?rival:player;f.blocking=false;f.setAnimation('idle');if(onlineMode&&onlineSocket?.connected)onlineSocket.emit('player-input',{room:window.SC_ROOM,data:{action:'release-block'}});}};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('pointerleave',release);});
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if(e.repeat)return;if(k==='j')action('punch');if(k==='k')action('kick');if(k==='l')action('block');if(k==='u')action('special');if(k==='i')action('dodge');if(e.code==='Space')action('jump');});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys[k]=false;if(k==='l'){const f=onlineMode&&onlineRole==='guest'?rival:player;f.blocking=false;f.setAnimation('idle');if(onlineMode&&onlineSocket?.connected)onlineSocket.emit('player-input',{room:window.SC_ROOM,data:{action:'release-block'}});}});
const stick=$('#joystick'),knob=$('#knob');let stickId=null;
stick.addEventListener('pointerdown',e=>{stickId=e.pointerId;stick.setPointerCapture(stickId);stickMove(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)stickMove(e)});const resetStick=()=>{stickId=null;move=0;knob.style.transform='translate(0,0)'};stick.addEventListener('pointerup',resetStick);stick.addEventListener('pointercancel',resetStick);
function stickMove(e){const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),s=Math.min(1,42/(len||1));move=dx/42*s;knob.style.transform=`translate(${dx*s}px,${dy*s}px)`;}
function updateAI(dt){if(!running||roundEnded)return;aiThink-=dt;const dist=Math.abs(rival.group.position.x-player.group.position.x);if(dist>2.0)rival.group.position.x-=Math.sign(rival.group.position.x-player.group.position.x)*dt*2.35;
 else if(dist<1.25)rival.group.position.x+=Math.sign(rival.group.position.x-player.group.position.x)*dt*1.15;
 rival.group.position.x=clamp(rival.group.position.x,-7,7);
 if(aiDodge>0){aiDodge-=dt;}
 if(aiBlock>0){aiBlock-=dt;if(aiBlock<=0){rival.blocking=false;rival.setAnimation('idle');}}
 if(aiThink<=0){aiThink=.35+Math.random()*.35;if(dist<2.7&&rivalCooldown<=0){if((player.anim==='punch'||player.anim==='kick'||player.anim==='combo')&&Math.random()<.38){rival.dodgeTime=.28;rival.setAnimation('dodge');rival.group.position.x=clamp(rival.group.position.x+(rival.group.position.x>player.group.position.x?1:-1)*.7,-7,7);showStatus('PRIYA DODGED!',350);}else if(player.anim==='punch'||player.anim==='kick'||player.anim==='combo'){rival.blocking=true;rival.setAnimation('block');aiBlock=.42;}else if(rival.power>=100){hit(rival,player,'special');rivalCooldown=1.1;}else{hit(rival,player,Math.random()>.55?'kick':'punch');rivalCooldown=.72;}}else if(Math.random()<.12&&dist<3.5){rival.blocking=true;rival.setAnimation('block');aiBlock=.3;}}
}

// Online room networking: each peer controls one fighter; inputs are relayed by the room server.
let onlineMode=false, onlineSocket=null, onlineRole='host', remoteInput={move:0,actions:[]}, lastNet=0;
window.STREET_CLASH_NET={
 setOnline(socket,role){onlineSocket=socket;onlineRole=role;onlineMode=true;running=true;ui.menu.classList.add('hidden');ui.hud.classList.remove('hidden');ui.controls.classList.remove('hidden');ui.status.classList.remove('hidden');startRound(true);showStatus(role==='host'?'YOU ARE NIRMAL':'YOU ARE PRIYA',1800);},
 receive(msg){
  if(!msg)return;
  if(msg.type==='input'){
   const d=msg.data||{};
   if(d.action){
    const remoteFighter=onlineRole==='host'?rival:player;
    const target=remoteFighter===player?rival:player;
    if(d.action==='punch'||d.action==='kick'||d.action==='special')hit(remoteFighter,target,d.action);
    if(d.action==='block'){remoteFighter.blocking=true;remoteFighter.setAnimation('block');}
    if(d.action==='release-block'){remoteFighter.blocking=false;remoteFighter.setAnimation('idle');}
    if(d.action==='jump')remoteFighter.jump();
    if(d.action==='dodge'){remoteFighter.dodgeTime=.32;remoteFighter.setAnimation('dodge');}
   }
   if(Number.isFinite(d.move))remoteInput.move=d.move;
  }
  if(msg.type==='leave'){showStatus('OPPONENT LEFT THE ROOM',2200);onlineMode=false;onlineSocket=null;}
 },
 leave(){onlineMode=false;onlineSocket=null;remoteInput={move:0,actions:[]};}
};

function frame(t){requestAnimationFrame(frame);const dt=Math.min(.04,(t-(last||t))/1000);last=t;player.update(dt);rival.update(dt);playerCooldown=Math.max(0,playerCooldown-dt);rivalCooldown=Math.max(0,rivalCooldown-dt);dodgeCooldown=Math.max(0,dodgeCooldown-dt);player.dodgeTime=Math.max(0,(player.dodgeTime||0)-dt);rival.dodgeTime=Math.max(0,(rival.dodgeTime||0)-dt);if(comboTimer>0){comboTimer-=dt;if(comboTimer<=0){comboCount=0;comboUI.classList.add('hidden');}}updateEffects(dt);
 if(running&&!roundEnded){const dir=(keys.a||keys.arrowleft?-1:0)+(keys.d||keys.arrowright?1:0)+move;
 const localFighter=onlineMode&&onlineRole==='guest'?rival:player;
 const remoteFighter=localFighter===player?rival:player;
 localFighter.group.position.x=clamp(localFighter.group.position.x+dir*dt*5,-7,7);
 if(onlineMode){
  remoteFighter.group.position.x=clamp(remoteFighter.group.position.x+(remoteInput.move||0)*dt*5,-7,7);
  if(onlineSocket?.connected&&t-lastNet>50){lastNet=t;onlineSocket.emit('player-input',{room:window.SC_ROOM,data:{move:dir}});}
 }else{updateAI(dt);}roundTime=Math.max(0,roundTime-dt);ui.clock.textContent=String(Math.ceil(roundTime)).padStart(3,'0');if(roundTime<=0)endRound('TIME UP');}
 camera.position.x+=(player.group.position.x*.1-camera.position.x)*dt*1.3;camera.lookAt(camera.position.x*.12,1.8,0);renderer.render(scene,camera);}
requestAnimationFrame(frame);addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
