import {chromium,webkit,devices} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const label=process.env.LAB_ENGINE||'desktop', engine=label==='webkit'?webkit:chromium;
const browser=await engine.launch(label==='webkit'?{}:{...(process.env.LAB_CHROMIUM?{executablePath:process.env.LAB_CHROMIUM}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({...(label==='mobile'?devices['Pixel 7']:{}),viewport:label==='desktop'?{width:1280,height:800}:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'no-preference'});
const page=await context.newPage();page.setDefaultTimeout(20000);
const errors=[],checks=[],samples=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await fs.mkdir('evidence/performance',{recursive:true});
async function check(name,fn){try{await fn();checks.push({name,pass:true});console.log('PASS',label,name);}catch(e){checks.push({name,pass:false,error:e.message});throw e;}}
const read=()=>page.evaluate(()=>({journey:window.__journeyPlayer,graphics:window.__motionLab.performance}));
const seek=async p=>{await page.evaluate(p=>{dispatchEvent(new WheelEvent('wheel',{deltaY:-1}));const j=document.querySelector('#journey'),h=document.querySelector('.journey-sticky').clientHeight;scrollTo({top:j.offsetTop+p*(document.querySelector('#journey-range').offsetHeight-h),behavior:'instant'});},p);await page.waitForFunction(p=>Math.abs(window.__motionLab.progress-p)<.0005,p);await page.waitForTimeout(300);};
try{
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:4173/',{waitUntil:'load'});
 await check('Precompiled hero starts without shader exceptions',async()=>{await page.waitForFunction(()=>window.__motionLab?.ready['hero-stage']);assert.equal(await page.evaluate(()=>window.__motionLab.version),'lusion-lab-fluidity-003');});
 await page.evaluate(()=>scrollTo(0,document.querySelector('#journey').offsetTop-80));
 await check('Tunnel is prewarmed before full-viewport autoplay starts',async()=>{await page.waitForFunction(()=>window.__motionLab.ready['tunnel-stage']);assert.equal((await read()).journey.auto,false);});
 await seek(.6);
 await check('GPU tunnel and character render without compile errors',async()=>{const s=(await read()).graphics.stages['tunnel-stage'];assert(s.renders>0);assert(s.triangles>10000);assert(s.draws<35);assert.deepEqual(errors,[]);samples.push({name:'tunnel',stats:s});});
 await check('Stationary tunnel stops drawing instead of burning GPU time',async()=>{await page.waitForTimeout(500);const a=(await read()).graphics.stages['tunnel-stage'];await page.waitForTimeout(650);const b=(await read()).graphics.stages['tunnel-stage'];assert(b.renders-a.renders<=1);assert.equal(b.resizes,a.resizes);samples.push({name:'idle',a,b});});
 await check('Offscreen hero does not keep simulating and drawing',async()=>{const a=(await read()).graphics.stages['hero-stage'].renders;await page.waitForTimeout(450);assert.equal((await read()).graphics.stages['hero-stage'].renders,a);});
 await check('Reverse input remains authoritative during visual smoothing',async()=>{await page.mouse.wheel(0,-180);await page.waitForFunction(()=>window.__journeyPlayer.reverse&&!window.__journeyPlayer.auto);await page.waitForTimeout(300);const s=(await read()).journey;assert(Math.abs(s.renderProgress-s.progress)<.002);assert(!s.auto);});
 await check('Portrait, tablet, narrow phone and landscape viewports do not clip the ending',async()=>{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[844,390],[1440,900]]){
   await page.setViewportSize({width,height});
   // Wait for actual controller + canvas resize, not an arbitrary 220ms delay.
   await page.waitForFunction(({width,height})=>{const p=window.__journeyPlayer,s=document.querySelector('#tunnel-stage canvas').getBoundingClientRect();return !p.resizing&&Math.abs(p.telemetry.height-height)<1&&Math.abs(s.width-width)<1&&Math.abs(s.height-height)<1;},{width,height});
   await seek(1);
   const box=await page.evaluate(()=>{const a=document.querySelector('#arrival'),f=a.querySelector('.arrival-footer'),title=a.querySelector('h1'),s=document.querySelector('.journey-sticky'),c=document.querySelector('#tunnel-stage canvas');const r=e=>{const x=e.getBoundingClientRect();return {left:x.left,top:x.top,right:x.right,bottom:x.bottom,width:x.width,height:x.height};};return {viewport:[innerWidth,innerHeight],body:document.documentElement.scrollWidth,arrival:r(a),footer:r(f),title:r(title),stage:r(s),canvas:r(c)};});
   assert(box.body<=width+1);assert(box.footer.bottom<=height+1);assert(box.footer.top>=0);assert(box.title.top>=-1);assert(box.title.bottom<=box.footer.top+1);assert(Math.abs(box.stage.height-height)<=1);assert(Math.abs(box.canvas.width-width)<=1);samples.push({name:'viewport',...box});
  }
  await page.screenshot({path:`evidence/performance/${label}-responsive-ending.png`});
 });
 await check('Native reverse scrolling still works after multiple orientation changes',async()=>{await page.mouse.wheel(0,-500);await page.waitForFunction(()=>window.__journeyPlayer.progress<.98);assert(!(await read()).journey.auto);});
 await check('Renderer resolution stays within its documented bounds',async()=>{for(const stage of Object.values((await read()).graphics.stages)){assert(stage.pixelRatio>=.85);assert(stage.pixelRatio<=1.7);}assert.deepEqual(errors,[]);});
}catch(e){console.error(e.message);if(!checks.some(c=>!c.pass))checks.push({name:'setup',pass:false,error:e.message});samples.push({name:'failure',state:await read().catch(()=>null)});}
finally{const result={engine:label,sourceCommit:process.env.GITHUB_SHA||null,checks,errors,samples,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length};await fs.writeFile('evidence/performance/results.json',JSON.stringify(result,null,2));await context.close();await browser.close();if(result.failed)process.exitCode=1;}
