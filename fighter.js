import * as THREE from 'three';

// Articulated procedural prototype. Geometry is original and does not include private photos.
export function createFighter(scene,{x,accent,faceLeft=false,character='nirmal'}){
 const group=new THREE.Group();group.position.set(x,0,0);if(faceLeft)group.rotation.y=Math.PI;scene.add(group);
 const isPriya=character==='priya';
 const M=(c,r=.5,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
 const outfit=M(0x151721),pants=M(0x10131b),trim=M(accent,.38,.25),skin=M(isPriya?0x98684f:0x80543e),hair=M(0x090a10,.32),boot=M(0x080a10,.45,.2);
 const rootRig=new THREE.Group();group.add(rootRig);
 const part=(parent,name,geo,material,pos,scale)=>{const o=new THREE.Mesh(geo,material);o.name=name;o.position.set(...pos);if(scale)o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const capsule=(parent,name,material,pos,r,len,scale)=>part(parent,name,new THREE.CapsuleGeometry(r,len,5,10),material,pos,scale);
 // Pelvis and torso rig
 const pelvis=new THREE.Group();pelvis.position.y=1.15;rootRig.add(pelvis);
 part(pelvis,'belt',new THREE.BoxGeometry(.78,.18,.55),trim,[0,0,0]);
 part(pelvis,'buckle',new THREE.BoxGeometry(.16,.16,.06),M(0xd2b7a0,.25,.7),[0,0,.3]);
 const torso=new THREE.Group();torso.position.y=.25;pelvis.add(torso);
 capsule(torso,'torso',outfit,[0,.35,0],.39,.73,[1.05,1.12,.72]);
 part(torso,'jacket stripe',new THREE.BoxGeometry(.09,.92,.045),trim,[isPriya?.24:-.24,.4,.29]);
 const neck=part(torso,'neck',new THREE.CylinderGeometry(.12,.13,.2,12),skin,[0,.98,0]);
 const head=new THREE.Group();head.position.set(0,1.12,0);torso.add(head);
 part(head,'face',new THREE.SphereGeometry(.29,24,20),skin,[0,.12,0],[.86,1.12,.82]);
 part(head,'hair cap',new THREE.SphereGeometry(.305,24,16,0,Math.PI*2,0,Math.PI*.62),hair,[0,.24,-.025],[1.02,1.02,.95]);
 if(isPriya){
   capsule(head,'long hair',hair,[0,-.32,-.13],.12,.72,[1.5,1,.8]);
   part(head,'bindi',new THREE.SphereGeometry(.027,10,8),M(0x251018),[0,.19,.24]);
   part(head,'nose stud',new THREE.SphereGeometry(.025,8,8),trim,[.11,.05,.255]);
 }else{
   part(head,'beard',new THREE.SphereGeometry(.235,18,12),hair,[0,-.02,.12],[1,.62,.72]);
   const lens=M(0x101d2a,.15,.6),silver=M(0xb9c4d0,.2,.7);
   for(const s of [-1,1]){part(head,'sunglass lens',new THREE.BoxGeometry(.19,.105,.035),lens,[s*.105,.17,.265]);part(head,'sunglass rim',new THREE.BoxGeometry(.205,.025,.045),silver,[s*.105,.23,.26]);}
   part(head,'sunglass bridge',new THREE.BoxGeometry(.09,.025,.035),silver,[0,.19,.27]);
 }
 if(isPriya){part(torso,'dragon crest',new THREE.TorusKnotGeometry(.105,.025,48,8),trim,[0,.35,.34]);}
 else {part(torso,'red hood',new THREE.SphereGeometry(.37,18,12,0,Math.PI*2,0,Math.PI*.55),trim,[0,.78,-.12],[1,.8,.75]);part(torso,'dragon crest',new THREE.TorusKnotGeometry(.11,.025,48,8),trim,[0,.35,.34]);}
 const limbs={};
 // Arms pivot at shoulder; forearm and glove follow the upper arm.
 for(const s of [-1,1]){
   const side=s<0?'left':'right',arm=new THREE.Group();arm.position.set(s*.48,.75,0);torso.add(arm);
   capsule(arm,side+' upper arm',outfit,[s*.08,-.23,0],.145,.43);
   const fore=new THREE.Group();fore.position.set(s*.13,-.48,.015);arm.add(fore);
   capsule(fore,side+' forearm',outfit,[0,-.16,0],.13,.34);
   part(fore,side+' glove',new THREE.BoxGeometry(.27,.24,.25),trim,[0,-.4,.1]);
   part(arm,side+' shoulder trim',new THREE.SphereGeometry(.19,14,12),trim,[0,.02,.02],[1,.7,.8]);
   limbs[side+'Arm']=arm;limbs[side+'Forearm']=fore;
 }
 // Legs have hip pivots and articulated lower legs.
 for(const s of [-1,1]){
   const side=s<0?'left':'right',leg=new THREE.Group();leg.position.set(s*.22,-.08,0);pelvis.add(leg);
   capsule(leg,side+' thigh',pants,[0,-.29,0],.19,.52);
   const shin=new THREE.Group();shin.position.y=-.57;leg.add(shin);
   capsule(shin,side+' shin',pants,[0,-.22,0],.15,.38);
   part(shin,side+' boot',new THREE.BoxGeometry(.42,.2,.62),boot,[0,-.5,.12]);
   limbs[side+'Leg']=leg;limbs[side+'Shin']=shin;
 }
 return {
  group,rig:rootRig,parts:limbs,hp:100,power:0,blocking:false,anim:'idle',animTime:0,
  setAnimation(name){this.anim=name;this.animTime=0;},
  animateAttack(kind){this.power=Math.min(100,this.power+(kind==='special'?0:12));this.setAnimation(kind);},
  jump(){this.setAnimation('jump');},
  update(dt){
   this.animTime+=dt;const t=this.animTime;
   const L=limbs.leftArm,R=limbs.rightArm,LL=limbs.leftLeg,RL=limbs.rightLeg;
   // Return smoothly to neutral, then layer a small idle breathing motion.
   const blend=(v,target,k)=>v+(target-v)*Math.min(1,dt*k);
   let la=-.12+Math.sin(t*2)*.035,ra=.12-Math.sin(t*2)*.035,ll=Math.sin(t*2)*.025,rl=-Math.sin(t*2)*.025,torsoLean=Math.sin(t*2)*.012;
   if(this.anim==='punch'){ra=-1.35;torsoLean=.12;if(t>.22)this.anim='idle';}
   if(this.anim==='kick'){rl=-1.18;ll=.18;torsoLean=-.12;if(t>.38)this.anim='idle';}
   if(this.anim==='combo'){ra=-1.5;la=-.55;torsoLean=.22;if(t>.34)this.anim='idle';}
   if(this.anim==='special'){ra=-1.65;la=-1.0;rl=-.55;torsoLean=.25;if(t>.52)this.anim='idle';}
   if(this.anim==='block'){la=-1.05;ra=-1.05;torsoLean=-.04;}
   if(this.anim==='dodge'){torsoLean=.38;la=-.65;ra=-.65;ll=.32;rl=-.32;if(t>.3)this.anim='idle';}
   if(this.anim==='hit'){torsoLean=-.22;la=.65;ra=.65;if(t>.24)this.anim='idle';}
   if(this.anim==='jump'){if(t<.32)this.group.position.y=.55;else{this.group.position.y=Math.max(0,.55-(t-.32)*2);if(t>.6){this.group.position.y=0;this.anim='idle';}}}
   else if(this.anim!=='jump')this.group.position.y=0;
   L.rotation.z=blend(L.rotation.z,la,dt*14);R.rotation.z=blend(R.rotation.z,ra,dt*14);
   limbs.leftForearm.rotation.z=blend(limbs.leftForearm.rotation.z,this.anim==='block'?.18:0,dt*12);limbs.rightForearm.rotation.z=blend(limbs.rightForearm.rotation.z,this.anim==='block'?-.18:0,dt*12);
   LL.rotation.x=blend(LL.rotation.x,ll,dt*12);RL.rotation.x=blend(RL.rotation.x,rl,dt*12);
   this.rig.rotation.z=blend(this.rig.rotation.z,torsoLean,dt*10);
  }
 };
}