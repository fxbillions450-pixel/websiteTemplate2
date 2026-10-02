import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as T from 'three';
import {FrameBudget,createTunnelTiles} from './site/motion-runtime.js';
import {endingPose,composeEmergence} from './site/ending-handoff.js';
const checks=[];
function check(name,fn){fn();checks.push({name,pass:true});}
check('Resolution never changes for stable 60/120 Hz rendering',()=>{for(const ms of [16.67,8.33]){const b=new FrameBudget(1.35);for(let i=0;i<1200;i++)b.sample(ms);assert.equal(b.ratio,1.35);}});
check('Sustained slow frames lower pixel work without changing timeline time',()=>{const b=new FrameBudget(1.35);for(let i=0;i<600;i++)b.sample(35);assert.equal(b.ratio,.85);assert.equal(b.min,.85);});
check('Fast recovery is bounded and gradual',()=>{const b=new FrameBudget(1.35);for(let i=0;i<600;i++)b.sample(35);const low=b.ratio;for(let i=0;i<200;i++)b.sample(16);assert.equal(b.ratio,low);for(let i=0;i<4000;i++)b.sample(16);assert.equal(b.ratio,1.35);});
check('Compilation stalls and invalid timing cannot thrash resolution',()=>{const b=new FrameBudget(1);for(const ms of [0,-1,NaN,Infinity,400,9000])assert.equal(b.sample(ms),false);assert.equal(b.ratio,1);assert.equal(b.samples,0);});
check('Shader transform attributes and instance counts match the authored tunnel',()=>{const scene=new T.Scene(),m=new T.MeshStandardMaterial(),l=new T.MeshBasicMaterial();const tiles=createTunnelTiles(T,scene,m,l);assert.equal(tiles.blocks.count,960);assert.equal(tiles.lights.count,60);const a=tiles.blocks.geometry.getAttribute('aTile');assert.deepEqual([a.getX(959),a.getY(959),a.getZ(959)],[29,3,3.5]);tiles.dispose();});
check('GPU tile updates do not upload new instance matrices',()=>{const tiles=createTunnelTiles(T,new T.Scene(),new T.MeshStandardMaterial(),new T.MeshBasicMaterial());const before=tiles.blocks.instanceMatrix.version;for(let i=0;i<1000;i++)tiles.update(i/1000,i*.1,4.7,.2,.3);assert.equal(tiles.blocks.instanceMatrix.version,before);assert.equal(tiles.blocks.instanceMatrix.usage,T.StaticDrawUsage);tiles.dispose();});
check('Position and normal shader share the same original XYZ rotation',()=>{const m=new T.MeshStandardMaterial(),tiles=createTunnelTiles(T,new T.Scene(),m,new T.MeshBasicMaterial());const shader={uniforms:{},vertexShader:'#include <beginnormal_vertex>\n#include <begin_vertex>'};m.onBeforeCompile(shader);assert(shader.vertexShader.includes('tileBasis*(objectNormal/tileScale)'));assert(shader.vertexShader.includes('tileBasis*(position*tileScale)+tileCenter'));tiles.update(.6,57.36,4.7,1,0);assert.equal(shader.uniforms.uProgress.value,.6);tiles.dispose();});
check('Injected shader preserves a newline before preprocessor directives',()=>{for(const basic of [false,true]){const m=new T.MeshStandardMaterial(),l=new T.MeshBasicMaterial();const tiles=createTunnelTiles(T,new T.Scene(),m,l);const shader={uniforms:{},vertexShader:'#define STANDARD\n#include <beginnormal_vertex>\n#include <begin_vertex>'};(basic?l:m).onBeforeCompile(shader);assert(!/[^\n\r \t]#/.test(shader.vertexShader));tiles.dispose();}});
check('Ending poses stay finite and inside portrait/landscape viewports',()=>{for(const [w,h] of [[320,568],[390,844],[768,1024],[844,390],[1440,900]])for(const post of [0,.2,.7,1.5,3]){const p=endingPose(w,h,post);assert(p.x>=.4&&p.x<=.85);assert(p.y>.4&&p.y<.7);assert(p.scale>.5&&p.scale<1.2);}});
check('Transparent two-pass handoff never duplicates or hides the settled character',()=>{
 const backdrop={visible:true},character={visible:true},glass={visible:true};const bg={},fog={density:.03},scene={background:bg,fog};const passes=[];
 const r={autoClear:true,getClearAlpha:()=>1,setClearAlpha(){},setClearColor(){},clear(){},clearDepth(){},setScissorTest(){},setViewport(){},setScissor(){},render(){passes.push({backdrop:backdrop.visible,character:character.visible,bg:scene.background});}};
 const s={renderer:r,scene,camera:{},width:1280,height:800};composeEmergence(s,backdrop,character,glass,.94);assert.equal(passes.length,2);assert.equal(passes[0].character,false);assert.equal(passes[1].character,true);assert.equal(passes[1].backdrop,false);assert.equal(passes[1].bg,null);assert.equal(scene.background,bg);assert.equal(fog.density,.03);assert.equal(r.autoClear,true);
 passes.length=0;composeEmergence(s,backdrop,character,glass,1);assert.equal(passes.length,1);assert.equal(passes[0].character,true);assert.equal(passes[0].backdrop,false);
 passes.length=0;composeEmergence(s,backdrop,character,glass,.5);assert.equal(passes.length,1);assert.equal(passes[0].backdrop,true);assert.equal(passes[0].bg,bg);
});
const controller=await fs.readFile('site/journey-player.js','utf8');assert(controller.includes('duration: 18'));assert(!controller.includes("overflow='hidden'"));checks.push({name:'18-second timeline retained without scroll locks',pass:true});

// Deliberately simulated scheduling tests: no GPU or device-speed claim.
function makeResizeProbe(){
 const listeners={},queue=new Map();let frame=0,time=100;
 const geometry={top:2000,height:800,range:5600};
 const style={setProperty(){}};const classList={contains(){return false;},toggle(){}};
 const element={style,classList,addEventListener(){},querySelectorAll(){return[];},setAttribute(){}};
 const sticky={...element,get clientHeight(){return geometry.height;}};
 const nodes={'#journey':{...element,getBoundingClientRect(){return{top:geometry.top-env.scrollY};}},'.journey-sticky':sticky,'#journey-range':{get offsetHeight(){return geometry.range;}},'#arrival':element,'#menu':{...element,open:false},'#detail':{...element,open:false},'#tunnel-stage':{...element,dataset:{ready:'true'}},'#pause':element};
 const env={document:{querySelector:s=>nodes[s]||null,body:{classList},documentElement:{style,clientWidth:1280},hidden:false,addEventListener(){}},innerWidth:1280,innerHeight:800,scrollY:4400,performance:{now:()=>time},matchMedia:()=>({matches:false,addEventListener(){}}),ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:f=>{queue.set(++frame,f);return frame;},cancelAnimationFrame:id=>queue.delete(id),addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn)};
 env.window=env;env.scrollTo=({top})=>env.scrollY=top;
 const ctx=vm.createContext(env);vm.runInContext(controller,ctx);env.__journeyPlayer.connectRenderer();
 const fire=(type,payload={})=>(listeners[type]||[]).forEach(fn=>fn(payload));
 fire('wheel',{deltaY:-1});env.__journeyPlayer.step(time);
 return{env,geometry,fire,flush(){const pending=[...queue.values()];queue.clear();pending.forEach(fn=>fn(++time));},step(){env.__journeyPlayer.step(++time);}};
}
for(const timing of ['before','after','none'])check('Viewport scheduling preserves '+(timing==='none'?'position without input':'manual input delivered '+timing+' resize'),()=>{
 const r=makeResizeProbe();r.geometry.top=1664;r.geometry.height=568;r.geometry.range=3976;r.env.innerWidth=320;r.env.innerHeight=568;
 const input=()=>{r.fire('wheel',{deltaY:-1});r.env.scrollTo({top:5072});};
 if(timing==='before')input();r.fire('resize');if(timing==='after')input();r.flush();r.step();assert.equal(r.env.scrollY,timing==='none'?3368:5072);
});
await fs.mkdir('evidence',{recursive:true});await fs.writeFile('evidence/performance-unit.json',JSON.stringify({passed:checks.length,failed:0,checks},null,2));console.log(`${checks.length} runtime checks passed`);
