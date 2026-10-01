import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const $=s=>document.querySelector(s),clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n)),mix=(a,b,t)=>a+(b-a)*t,smooth=(a,b,n)=>{const p=clamp((n-a)/(b-a));return p*p*(3-2*p);};
const seedRandom=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
const rand=seedRandom(126);let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,paused=reduced,slow=false,visualTime=0,last=0,raf=0;
const scenes=[],renderers=[];const state={version:'lusion-lab-001',palette:0,phase:'portal',progress:0,ready:{},errors:[]};window.__motionLab=state;
function fail(host,e){state.errors.push(String(e));host.classList.add('error');host.querySelector('.stage-loading').textContent='This scene needs WebGL. Try an up-to-date browser with graphics acceleration enabled.';console.error(e);}
function createStage(host,bg='#111219',fov=36){
 if(new URLSearchParams(location.search).has('no-webgl'))throw new Error('Intentional no-WebGL fallback test');
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(pointer:coarse)').matches?1.35:1.7));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=T.SRGBColorSpace;host.prepend(renderer.domElement);renderers.push(renderer);
 const scene=new T.Scene();scene.background=new T.Color(bg);const camera=new T.PerspectiveCamera(fov,1,.1,180);camera.position.set(0,0,12);
 const envScene=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(envScene,.035);scene.environment=environment.texture;envScene.dispose();pmrem.dispose();
 scene.add(new T.HemisphereLight(0xf1f1ff,0x151321,1.3));const key=new T.DirectionalLight(0xffffff,4);key.position.set(-4,7,9);scene.add(key);const rim=new T.DirectionalLight(0xc0cbff,2);rim.position.set(4,-1,3);scene.add(rim);
 let width=1,height=1;const resize=()=>{width=host.clientWidth;height=host.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(host,'Graphics context lost. Reload to restart the scene.');});
 return {host,renderer,scene,camera,key,rim,render:()=>renderer.render(scene,camera),get width(){return width},get height(){return height},dispose(){observer.disconnect();environment.dispose();renderer.dispose();}};
}
function register(id,builder){const host=$(id),record={host,active:false,api:null};scenes.push(record);const ob=new IntersectionObserver(es=>{for(const e of es){record.active=e.isIntersecting;if(record.active&&!record.api&&!host.classList.contains('error')){try{record.api=builder(host);host.dataset.ready='true';state.ready[host.id]=true;}catch(err){fail(host,err);}}}},{rootMargin:'180px'});ob.observe(host);record.observer=ob;}
function crossGeometry(){
 const points=[[.42,.22],[.43,.36],[.425,.73],[.42,.97],[.405,1.035],[.38,1.055],[.20,1.055],[.175,1.025],[.17,.89],[.17,.54]].map(p=>new T.Vector2(...p));
 const base=new T.LatheGeometry(points,32);const parts=[new T.SphereGeometry(.575,28,20)];
 for(const dir of [new T.Vector3(1,0,0),new T.Vector3(-1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,-1,0),new T.Vector3(0,0,1),new T.Vector3(0,0,-1)]){const g=base.clone();g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir));parts.push(g);}const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());base.dispose();return merged;
}
let paletteAction=()=>{};
function hero(host){
 const s=createStage(host),mobile=s.width<600;const count=mobile?18:32,geometry=crossGeometry();
 const colors=[['#211be9','#e3e4e8','#090a0d','#5550b2'],['#ef5729','#e5cab7','#151012','#edab59'],['#b3c69b','#ebe6d7','#0b2520','#386756']];
 const materials=colors[0].map((color,i)=>new T.MeshPhysicalMaterial({color,roughness:i===1?.24:i===3?.5:.16,metalness:i===2?.65:.12,clearcoat:i===3?.1:1,clearcoatRoughness:.15,envMapIntensity:1.5}));
 const meshes=materials.map(m=>{const mesh=new T.InstancedMesh(geometry,m,count);mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;s.scene.add(mesh);return mesh;});
 const bodies=Array.from({length:count},(_,i)=>{const cols=mobile?3:7,rows=Math.ceil(count/cols);const position=new T.Vector3((i%cols-(cols-1)/2)*(mobile?1.18:1.65),(Math.floor(i/cols)-(rows-1)/2)*(mobile?1.03:1.15),(rand()-.5)*3);const size=mobile?.63+rand()*.13:.77+rand()*.22;return {p:position,home:position.clone(),v:new T.Vector3((rand()-.5)*.3,(rand()-.5)*.3,0),q:new T.Quaternion().setFromEuler(new T.Euler(rand()*4,rand()*4,rand()*4)),w:new T.Vector3((rand()-.5)*.5,(rand()-.5)*.5,(rand()-.5)*.5),size,mat:i%4,proxies:[]};});
 const unit=[new T.Vector3(0,0,0),new T.Vector3(.78,0,0),new T.Vector3(-.78,0,0),new T.Vector3(0,.78,0),new T.Vector3(0,-.78,0),new T.Vector3(0,0,.78),new T.Vector3(0,0,-.78)];
 const pointer={x:100,y:100,speed:0,down:false,valid:false,lastX:0,lastY:0,startX:0,startY:0,moved:false};const ray=new T.Raycaster(),world=new T.Vector3(),plane=new T.Plane(new T.Vector3(0,0,1),-.8),mouse=new T.Vector2(),temp=new T.Vector3(),normal=new T.Vector3(),cross=new T.Vector3(),deltaQ=new T.Quaternion(),dummy=new T.Object3D();let accumulator=0;
 const point=e=>{const r=host.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,s.camera);ray.ray.intersectPlane(plane,world);pointer.speed=clamp(Math.hypot(e.clientX-pointer.lastX,e.clientY-pointer.lastY)/18,0,2);pointer.lastX=e.clientX;pointer.lastY=e.clientY;pointer.valid=true;};
 host.addEventListener('pointermove',e=>{if(e.target.closest('button'))return;point(e);if(pointer.down&&Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>8)pointer.moved=true;});
 host.addEventListener('pointerleave',()=>pointer.valid=false);host.addEventListener('pointercancel',()=>{pointer.valid=false;pointer.down=false;});
 host.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;point(e);Object.assign(pointer,{down:true,startX:e.clientX,startY:e.clientY,moved:false});});
 host.addEventListener('pointerup',e=>{if(e.target.closest('button'))return;if(pointer.down&&!pointer.moved)paletteAction();pointer.down=false;if(e.pointerType==='touch')pointer.valid=false;});
 paletteAction=()=>{state.palette=(state.palette+1)%colors.length;document.documentElement.style.setProperty('--accent',colors[state.palette][0]);for(const b of bodies){temp.copy(b.p).sub(world);if(temp.lengthSq()<.01)temp.set(1,0,0);b.v.addScaledVector(temp.normalize(),2.2);b.w.add(new T.Vector3(rand()-.5,rand()-.5,rand()-.5).multiplyScalar(1.6));}$('#status').textContent='Palette '+(state.palette+1);};
 $('#palette').addEventListener('click',()=>paletteAction());if(mobile)$('#hero-tip').textContent='Tap to change the mood.';
 function physics(h){
  const worldHeight=2*Math.tan(T.MathUtils.degToRad(s.camera.fov)/2)*s.camera.position.z,limitX=worldHeight*s.camera.aspect*.47,limitY=worldHeight*.58;
  for(const b of bodies){b.v.addScaledVector(temp.copy(b.home).sub(b.p),h*.7);b.v.x-=b.p.y*h*.022;b.v.y+=b.p.x*h*.022;
   if(pointer.valid&&!paused){temp.copy(b.p).sub(world);temp.z*=.25;const d=temp.length();if(d<2.4&&d>.05){const force=(1-d/2.4)*(pointer.down?17:5+pointer.speed*8);b.v.addScaledVector(temp.normalize(),h*force);b.w.x+=h*force*temp.y*.32;b.w.y-=h*force*temp.x*.32;}}
   b.v.multiplyScalar(Math.exp(-h*1.15));b.w.multiplyScalar(Math.exp(-h*.25));b.p.addScaledVector(b.v,h);
   for(const [axis,bound] of [['x',limitX],['y',limitY],['z',2.0]])if(Math.abs(b.p[axis])>bound){b.p[axis]=Math.sign(b.p[axis])*bound;b.v[axis]*=-.5;}
   const spin=b.w.length();if(spin>.001){deltaQ.setFromAxisAngle(temp.copy(b.w).normalize(),spin*h);b.q.premultiply(deltaQ).normalize();}
   b.proxies=unit.map(u=>u.clone().multiplyScalar(b.size).applyQuaternion(b.q).add(b.p));
  }
  for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){const a=bodies[i],b=bodies[j];if(a.p.distanceToSquared(b.p)>(a.size+b.size)**2*1.7)continue;let best=0,pa,pb;
   for(let ai=0;ai<7;ai++)for(let bi=0;bi<7;bi++){const r=(ai===0?.57:.41)*a.size+(bi===0?.57:.41)*b.size,d=a.proxies[ai].distanceTo(b.proxies[bi]);if(r-d>best){best=r-d;pa=a.proxies[ai];pb=b.proxies[bi];}}
   if(best>0&&pa&&pb){normal.copy(pb).sub(pa);if(normal.lengthSq()<1e-8)normal.set(1,0,0);normal.normalize();a.p.addScaledVector(normal,-best*.35);b.p.addScaledVector(normal,best*.35);const rel=temp.copy(b.v).sub(a.v).dot(normal);if(rel<0){const impulse=-rel*.66;a.v.addScaledVector(normal,-impulse);b.v.addScaledVector(normal,impulse);cross.crossVectors(temp.copy(pa).sub(a.p),normal);a.w.addScaledVector(cross,-impulse*.4);cross.crossVectors(temp.copy(pb).sub(b.p),normal);b.w.addScaledVector(cross,impulse*.4);}}
  }
 }
 return {...s,tick(dt,time){const target=mobile?11.5:11.3;s.camera.position.z=mix(target+2.5,target,smooth(0,1.8,time));s.camera.lookAt(0,0,0);if(!paused){accumulator+=Math.min(dt,.04);let steps=0;while(accumulator>=1/90&&steps<4){physics(1/90);accumulator-=1/90;steps++;}}pointer.speed*=.9;
  materials.forEach((m,i)=>m.color.lerp(new T.Color(colors[state.palette][i]),1-Math.exp(-dt*6)));meshes.forEach(m=>m.count=0);for(const b of bodies){dummy.position.copy(b.p);dummy.quaternion.copy(b.q);dummy.scale.setScalar(b.size);dummy.updateMatrix();const m=meshes[b.mat];m.setMatrixAt(m.count++,dummy.matrix);}meshes.forEach(m=>m.instanceMatrix.needsUpdate=true);s.render();},dispose(){geometry.dispose();materials.forEach(m=>m.dispose());s.dispose();}};
}
let depthSnapshot=()=>'';
function depth(host){
 const s=createStage(host,'#dbd6ce',35),art=new T.Scene();art.background=new T.Color('#dcd8d0');art.environment=s.scene.environment;
 const camera=new T.PerspectiveCamera(36,4/3,.1,60);camera.position.set(7,4.5,14);camera.lookAt(0,-.3,0);
 art.add(new T.HemisphereLight(0xffffff,0x514767,2.7));const key=new T.DirectionalLight(0xffffff,4.2);key.position.set(-6,8,5);art.add(key);const fill=new T.DirectionalLight(0xa09aff,1.4);fill.position.set(6,3,-2);art.add(fill);
 const ivory=new T.MeshStandardMaterial({color:'#e8ded0',roughness:.48}),blue=new T.MeshPhysicalMaterial({color:'#2613da',roughness:.19,metalness:.25,clearcoat:1}),dark=new T.MeshStandardMaterial({color:'#333348',roughness:.4}),peach=new T.MeshStandardMaterial({color:'#e8a88a',roughness:.5});
 const mesh=(g,m,p)=>{const o=new T.Mesh(g,m);o.position.set(...p);art.add(o);return o;};
 mesh(new T.BoxGeometry(200,.25,120),ivory,[0,-3.1,0]);mesh(new T.BoxGeometry(200,30,.25),ivory,[0,5,-7]);
 mesh(new T.TorusGeometry(2.7,.48,24,80,Math.PI),ivory,[0,0,-1.3]);for(const x of [-2.7,2.7])mesh(new T.CylinderGeometry(.48,.48,3.0,32),ivory,[x,-1.5,-1.3]);
 const knot=mesh(new T.TorusKnotGeometry(1.16,.36,150,24,2,3),blue,[0,.2,.5]);knot.rotation.set(.35,1,.25);
 mesh(new T.CylinderGeometry(1.27,1.27,.45,64),dark,[0,-2.8,.5]);mesh(new T.CylinderGeometry(.93,1.05,1.0,64),peach,[0,-2.17,.5]);
 for(let i=0;i<5;i++)mesh(new T.BoxGeometry(1.7,.48*(i+1),1.3),ivory,[-4.4,-2.82+.24*i,-1+i*.73]);
 mesh(new T.SphereGeometry(.64,40,24),blue,[3.9,-2.32,2.0]);const disc=mesh(new T.TorusGeometry(1.1,.29,24,60),peach,[-3.2,-1.7,2.7]);disc.rotation.set(.8,.1,-.25);
 const rt=new T.WebGLRenderTarget(1024,768,{depthBuffer:true});rt.depthTexture=new T.DepthTexture(1024,768,T.UnsignedIntType);s.renderer.setRenderTarget(rt);s.renderer.render(art,camera);s.renderer.setRenderTarget(null);
 const u={uColor:{value:rt.texture},uDepth:{value:rt.depthTexture},uPointer:{value:new T.Vector2()},uAspect:{value:1},uImageAspect:{value:4/3}};
 const material=new T.ShaderMaterial({uniforms:u,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`precision highp float;uniform sampler2D uColor;uniform sampler2D uDepth;uniform vec2 uPointer;uniform float uAspect;uniform float uImageAspect;varying vec2 vUv;
float nearAmount(vec2 uv){float d=texture2D(uDepth,clamp(uv,.002,.998)).r;float z=.1*60./(60.-d*(60.-.1));return clamp((24.-z)/17.,0.,1.);}
void main(){vec2 uv=vUv;if(uAspect>uImageAspect)uv.y=(uv.y-.5)*uImageAspect/uAspect+.5;else uv.x=(uv.x-.5)*uAspect/uImageAspect+.5;uv=(uv-.5)*.9+.5;vec2 displaced=uv;for(int i=0;i<12;i++){float depth=nearAmount(displaced);vec2 next=uv-uPointer*.055*(depth-.25);displaced=mix(displaced,next,.45);}vec3 color=texture2D(uColor,clamp(displaced,.003,.997)).rgb;gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 s.scene.clear();s.scene.background=new T.Color('#dedbd5');s.scene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));const target=new T.Vector2(),velocity=new T.Vector2();
 const move=e=>{const r=host.getBoundingClientRect();target.set(clamp((e.clientX-r.left)/r.width*2-1,-1,1),clamp(-((e.clientY-r.top)/r.height*2-1),-1,1));};host.addEventListener('pointermove',move);host.addEventListener('pointerleave',()=>target.set(0,0));host.addEventListener('pointercancel',()=>target.set(0,0));
 let start={x:0,y:0};host.addEventListener('pointerdown',e=>start={x:e.clientX,y:e.clientY});host.addEventListener('click',e=>{if(Math.hypot(e.clientX-start.x,e.clientY-start.y)<12||e.detail===0)openDetail();});
 depthSnapshot=()=>{s.render();return s.renderer.domElement.toDataURL('image/png');};
 return {...s,tick(dt){u.uAspect.value=s.width/s.height;const h=Math.min(dt,.03),damping=Math.exp(-h*13);velocity.addScaledVector(target.clone().sub(u.uPointer.value),h*80).multiplyScalar(damping);u.uPointer.value.addScaledVector(velocity,h);if(paused||reduced)u.uPointer.value.set(0,0);s.render();},dispose(){rt.dispose();material.dispose();s.dispose();}};
}
function astronaut(){
 const root=new T.Group(),suit=new T.MeshStandardMaterial({color:'#eeede8',roughness:.48}),joints=new T.MeshStandardMaterial({color:'#20212b',roughness:.6}),visor=new T.MeshPhysicalMaterial({color:'#030610',metalness:.85,roughness:.1,clearcoat:1}),trim=new T.MeshStandardMaterial({color:'#2421cf',roughness:.35});
 const part=(parent,geo,mat,xyz,scale)=>{const m=new T.Mesh(geo,mat);m.position.set(...xyz);if(scale)m.scale.set(...scale);parent.add(m);return m;};
 part(root,new T.CapsuleGeometry(.38,.66,6,16),suit,[0,0,0],[1,1,.74]);part(root,new T.BoxGeometry(.64,.88,.33),joints,[0,.1,-.37]);part(root,new T.BoxGeometry(.38,.24,.08),trim,[0,.2,.31]);
 part(root,new T.SphereGeometry(.43,28,20),suit,[0,.86,0]);part(root,new T.SphereGeometry(.345,28,20),visor,[0,.89,.215],[1,.77,.6]);
 const limbs=[];for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.44,.35,0);root.add(arm);part(arm,new T.CapsuleGeometry(.145,.55,5,14),suit,[0,-.28,0]);part(arm,new T.SphereGeometry(.16,16,12),joints,[0,-.65,0]);part(arm,new T.CapsuleGeometry(.14,.38,5,14),suit,[0,-.9,.1]);part(arm,new T.SphereGeometry(.16,16,12),suit,[0,-1.19,.16]);limbs.push(arm);
 const leg=new T.Group();leg.position.set(side*.24,-.55,0);root.add(leg);part(leg,new T.CapsuleGeometry(.18,.65,6,16),suit,[0,-.45,0]);part(leg,new T.CapsuleGeometry(.19,.2,5,14),joints,[0,-.94,.12],[1,.8,1.4]);limbs.push(leg);}
 return {root,pose(p,t){root.rotation.set(.12+Math.sin(p*6)*.12,.2+Math.sin(p*4)*.45,Math.sin(p*7)*.2);limbs[0].rotation.z=-.8+Math.sin(p*9)*.15;limbs[2].rotation.z=.65+Math.sin(p*9)*.15;limbs[1].rotation.z=-.1;limbs[3].rotation.z=.16;limbs[1].rotation.x=.25+Math.sin(p*7)*.12;limbs[3].rotation.x=-.15;root.position.y=-.25+Math.sin(t*.5)*.07;}};
}
let seekJourney=()=>{};
function tunnel(host){
 const s=createStage(host,'#08090e',49);s.camera.position.set(0,0,11);s.camera.lookAt(0,0,-40);s.scene.fog=new T.FogExp2('#090a11',.024);
 s.key.intensity=3;const mat=new T.MeshStandardMaterial({color:'#171925',metalness:.62,roughness:.37}),box=new T.BoxGeometry(1,1,1),rows=30,columns=32,blocks=new T.InstancedMesh(box,mat,rows*columns);blocks.instanceMatrix.setUsage(T.DynamicDrawUsage);blocks.frustumCulled=false;s.scene.add(blocks);
 const lightMat=new T.MeshBasicMaterial({color:'#b7b5ef'}),lights=new T.InstancedMesh(box,lightMat,60);lights.instanceMatrix.setUsage(T.DynamicDrawUsage);lights.frustumCulled=false;s.scene.add(lights);
 const explorer=astronaut();s.scene.add(explorer.root);
 const shardShape=new T.Shape();shardShape.moveTo(-.5,-.36);shardShape.lineTo(.56,-.25);shardShape.lineTo(-.12,.62);shardShape.closePath();const shardGeo=new T.ExtrudeGeometry(shardShape,{depth:.025,bevelEnabled:false});
 const shardMat=new T.MeshPhysicalMaterial({color:'#e4f4ff',metalness:.25,roughness:.07,transparent:true,opacity:.5,side:T.DoubleSide,clearcoat:1,depthWrite:false}),shardCount=170,glass=new T.InstancedMesh(shardGeo,shardMat,shardCount);glass.frustumCulled=false;glass.instanceMatrix.setUsage(T.DynamicDrawUsage);s.scene.add(glass);
 const rng=seedRandom(735),shards=Array.from({length:shardCount},()=>({x:(rng()-.5)*10,y:(rng()-.5)*8,z:rng(),rx:rng()*6,ry:rng()*6,size:.32+rng()*.55,delay:rng()*.17}));const dummy=new T.Object3D();const journey=$('#journey'),sticky=$('.journey-sticky');let top=0,length=1,p=0,lastWidth=0;
 const measure=()=>{top=journey.getBoundingClientRect().top+scrollY;length=Math.max(1,journey.offsetHeight-sticky.offsetHeight);};measure();const ro=new ResizeObserver(measure);ro.observe(journey);window.addEventListener('resize',measure);
 seekJourney=value=>{measure();window.scrollTo({top:top+clamp(value)*length,behavior:'instant'});};
 let target=0;return {...s,tick(dt,time){if(lastWidth!==s.width){measure();lastWidth=s.width;}target=window.__journeyPlayer?.renderProgress??clamp((scrollY-top)/length);p=target;state.progress=p;time=p*(window.__journeyPlayer?.duration??18);
  const phase=p<.13?'portal':p<.55?'dark tunnel':p<.70?'fold':p<.87?'light tunnel':'glass / emergence';state.phase=phase;$('#phase-name').textContent=phase.toUpperCase()+' / 03';
  const entry=smooth(0,.15,p),bright=smooth(.66,.82,p),exit=smooth(.88,1,p),fold=smooth(.48,.66,p)*(1-smooth(.71,.83,p));
  $('.journey-title').style.opacity=String(1-smooth(.015,.08,p));$('.journey-title').style.transform=`translateY(${-entry*130}px) scale(${1+entry*.2})`;
  const mask=$('#aperture-mask');mask.style.width=mix(s.width<600?68:45,150,entry)+'%';mask.style.height=mix(22,155,entry)+'%';mask.style.opacity=String(1-smooth(.13,.16,p));mask.style.borderRadius=mix(22,0,entry)+'px';
  const background=new T.Color('#080910').lerp(new T.Color('#eeeff3'),bright);s.scene.background.copy(background);s.scene.fog.color.copy(background);s.scene.fog.density=mix(.022,.031,bright);mat.color.set('#171b2a').lerp(new T.Color('#eeeef2'),bright);mat.metalness=mix(.65,.05,bright);mat.roughness=mix(.36,.64,bright);lightMat.color.set('#8e91fa').lerp(new T.Color('#ffffff'),bright);
  s.key.intensity=mix(4.1,5.5,bright);s.camera.fov=mix(49,63,smooth(.08,.35,p))+fold*10;s.camera.aspect=s.width/s.height;s.camera.updateProjectionMatrix();s.camera.rotation.z=fold*.30;
  const travel=p*83+time*.7,radius=mix(4.7,5.6,bright);let idx=0;
  for(let z=0;z<rows;z++){const zz=5-((z*3.6+travel)%108),depth=(5-zz)/108,twist=fold*(depth*2.8+Math.sin(depth*8)*.35),bendX=Math.sin(depth*4.5+p*3)*fold*4,bendY=Math.sin(depth*5.4)*fold*2.5;
   for(let c=0;c<columns;c++){const side=Math.floor(c/8),along=(c%8-3.5)*radius/4;let x=side%2===0?along:(side===1?radius:-radius),y=side%2===0?(side===0?radius:-radius):along;const xx=x*Math.cos(twist)-y*Math.sin(twist),yy=x*Math.sin(twist)+y*Math.cos(twist);
    dummy.position.set(xx+bendX,yy+bendY,zz);dummy.rotation.set(side%2===0?fold*Math.sin(depth*6)*.32:0,side%2?fold*Math.sin(depth*5)*.35:0,twist);dummy.scale.set(side%2===0?radius/4*.96:.36,side%2===0?.36:radius/4*.96,mix(3.36,2.8,bright));dummy.updateMatrix();blocks.setMatrixAt(idx++,dummy.matrix);
   }
  }blocks.instanceMatrix.needsUpdate=true;
  for(let i=0;i<60;i++){const zz=5-((Math.floor(i/2)*3.6+travel)%108);dummy.position.set(i%2===0?-radius*.985:radius*.985,-radius*.72,zz);dummy.rotation.set(0,0,0);dummy.scale.set(.05,.09,1.6);dummy.updateMatrix();lights.setMatrixAt(i,dummy.matrix);}lights.instanceMatrix.needsUpdate=true;
  explorer.root.visible=p>.09;explorer.root.position.x=mix(.45,-.15,exit);explorer.root.position.z=mix(-12,6.6,exit);explorer.root.scale.setScalar(s.width<600?.7:1);explorer.pose(p,time);
  glass.visible=p>.82;const fracture=smooth(.87,.98,p);glass.material.opacity=mix(.42,.08,exit);for(let i=0;i<shardCount;i++){const v=shards[i],f=smooth(v.delay,1,fracture);dummy.position.set(v.x*(1+f*2.8),v.y*(1+f*2.8)-f*f*2,3+v.z*.15+f*5);dummy.rotation.set(v.rx*f*1.5,v.ry*f*1.8,v.rx+f*3);dummy.scale.setScalar(v.size*(1-f*.2));dummy.updateMatrix();glass.setMatrixAt(i,dummy.matrix);}glass.instanceMatrix.needsUpdate=true;
  s.render();},dispose(){ro.disconnect();window.removeEventListener('resize',measure);s.dispose();}};
}
const menu=$('#menu'),detail=$('#detail');let scrollBeforeDialog=0,detailBusy=false;
function syncPause(){document.body.classList.toggle('motion-paused',paused);$('#pause').textContent=paused?'Resume motion':'Pause motion';$('#pause').setAttribute('aria-pressed',String(paused));}syncPause();
$('#pause').addEventListener('click',()=>{paused=!paused;syncPause();});
function openMenu(){scrollBeforeDialog=scrollY;menu.showModal();$('#content').inert=true;document.body.style.overflow='hidden';$('#menu-toggle').setAttribute('aria-expanded','true');$('#menu-close').focus();}
function closeMenu(){if(menu.open)menu.close();$('#content').inert=false;document.body.style.overflow='';$('#menu-toggle').setAttribute('aria-expanded','false');$('#menu-toggle').focus();}
$('#menu-toggle').addEventListener('click',openMenu);$('#menu-close').addEventListener('click',closeMenu);menu.addEventListener('cancel',e=>{e.preventDefault();closeMenu();});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();closeMenu();$(a.getAttribute('href')).scrollIntoView({behavior:reduced?'instant':'smooth'});}));
async function curtain(){const el=$('#curtain');const a=el.animate([{transform:'translateY(100%)'},{transform:'translateY(0%)'}],{duration:reduced?1:420,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});await a.finished;return()=>{a.cancel();el.animate([{transform:'translateY(0%)'},{transform:'translateY(-100%)'}],{duration:reduced?1:540,easing:'cubic-bezier(.65,0,.35,1)',fill:'none'});};}
async function openDetail(){if(detailBusy||detail.open)return;detailBusy=true;scrollBeforeDialog=scrollY;const img=depthSnapshot();const uncover=await curtain();$('#detail-image').src=img;detail.showModal();document.body.style.overflow='hidden';$('#content').inert=true;history.pushState({motionLabDetail:true},'',location.pathname+'#depth-study');uncover();$('#detail-close').focus();detailBusy=false;}
function closeDetail(){if(!detail.open)return;detail.close();$('#content').inert=false;document.body.style.overflow='';window.scrollTo({top:scrollBeforeDialog,behavior:'instant'});$('#depth-stage').focus({preventScroll:true});}
$('#detail-close').addEventListener('click',()=>history.state?.motionLabDetail?history.back():closeDetail());detail.addEventListener('cancel',e=>{e.preventDefault();history.state?.motionLabDetail?history.back():closeDetail();});window.addEventListener('popstate',()=>{if(!history.state?.motionLabDetail)closeDetail();else if(!detail.open){scrollBeforeDialog=scrollY;detail.showModal();document.body.style.overflow='hidden';$('#content').inert=true;}});
register('#hero-stage',hero);register('#depth-stage',depth);register('#tunnel-stage',tunnel);
window.__journeyPlayer?.connectRenderer();
function frame(now){window.__journeyPlayer?.step(now);const dt=Math.min((now-(last||now))/1000,.05);last=now;if(!paused&&!menu.open&&!detail.open)visualTime+=dt*(slow?.16:1);for(const r of scenes)if(r.active&&r.api&&!menu.open&&!detail.open&&!r.host.classList.contains('error')){try{r.api.tick(dt,visualTime);}catch(e){fail(r.host,e);}}raf=requestAnimationFrame(frame);}raf=requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);last=0;if(!document.hidden)raf=requestAnimationFrame(frame);});window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);for(const s of scenes){s.observer.disconnect();s.api?.dispose();}});window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
