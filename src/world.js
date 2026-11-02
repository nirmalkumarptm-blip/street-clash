import * as THREE from 'three';
export function createArena(scene){
 scene.add(new THREE.HemisphereLight(0x9aaaff,0x24101b,1.8));
 const red=new THREE.PointLight(0xff153b,70,25);red.position.set(-5,6,2);scene.add(red);
 const pink=new THREE.PointLight(0xff20c8,60,25);pink.position.set(5,6,-2);scene.add(pink);
 const key=new THREE.DirectionalLight(0xffffff,2);key.position.set(0,10,8);key.castShadow=true;scene.add(key);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(34,22),new THREE.MeshStandardMaterial({color:0x171922,roughness:.4,metalness:.3}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(34,34,0x9c183b,0x38303c);grid.position.y=.02;scene.add(grid);
 // Glowing octagonal combat boundary and corner lights
 const ring=new THREE.Mesh(new THREE.RingGeometry(7.35,7.48,8),new THREE.MeshBasicMaterial({color:0xff315f,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.035;scene.add(ring);
 for(const x of [-7.2,7.2]){const beacon=new THREE.PointLight(x<0?0xff1748:0xd52cff,18,9);beacon.position.set(x,2,1);scene.add(beacon);const orb=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),new THREE.MeshBasicMaterial({color:x<0?0xff315f:0xe64cff}));orb.position.set(x,3.9,-6.7);scene.add(orb);}
 // Audience spot beams add depth to the underground venue
 for(const x of [-9,-3,3,9]){const spot=new THREE.SpotLight(x<0?0xff244f:0xe52cff,22,18,Math.PI/7,.6,1.4);spot.position.set(x,8,-5);spot.target.position.set(x*.55,0,0);scene.add(spot,spot.target);}
 const railMat=new THREE.MeshStandardMaterial({color:0x8b1837,metalness:.5});
 for(let x=-15;x<=15;x+=3){const post=new THREE.Mesh(new THREE.BoxGeometry(.12,5,.12),railMat);post.position.set(x,2.5,-7);scene.add(post);}
 for(let y=1;y<=4;y++){const rail=new THREE.Mesh(new THREE.BoxGeometry(30,.045,.08),railMat);rail.position.set(0,y,-7);scene.add(rail);}
 for(let i=0;i<30;i++){const h=1+Math.random()*1.5;const crowd=new THREE.Mesh(new THREE.BoxGeometry(.4,h,.35),new THREE.MeshStandardMaterial({color:i%3?0x202431:0x4a1c35}));crowd.position.set(-14+i*.95,h/2,-8);scene.add(crowd);}
}