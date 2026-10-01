import {chromium,webkit,devices} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const label=process.env.LAB_ENGINE||'desktop', engine=label==='webkit'?webkit:chromium;
const out='evidence';await fs.mkdir(out,{recursive:true});
const browser=await engine.launch(label==='webkit'?{}:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const options=label==='desktop'?{viewport:{width:1280,height:800}}:{...(label==='mobile'?devices['Pixel 7']:{}),viewport:{width:390,height:844},deviceScaleFactor:1};
const context=await browser.newContext({...options,reducedMotion:'no-preference'});
const page=await context.newPage();page.setDefaultTimeout(18000);
const errors=[],checks=[],samples=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.LAB_URL||'http://127.0.0.1:4173/';
const state=()=>page.evaluate(()=>({...window.__journeyPlayer,graphics:window.__motionLab?.progress}));
const snap=async name=>page.screenshot({path:`${out}/${label}-${name}.png`,timeout:30000});
async function check(name,fn){try{await fn();checks.push({name,pass:true});console.log('PASS',label,name);}catch(e){checks.push({name,pass:false,error:e.message});console.error('FAIL',label,name,e.message);throw e;}}
const position=async p=>page.evaluate(p=>{const e=document.querySelector('#journey'),h=document.querySelector('.journey-sticky').clientHeight;window.scrollTo({top:e.offsetTop+p*(e.offsetHeight-h),behavior:'instant'});},p);
function variance(buffer){const p=PNG.sync.read(buffer);let min=255,max=0;for(let n=0;n<p.data.length;n+=128){const v=p.data[n];min=Math.min(min,v);max=Math.max(max,v);}return max-min;}
try {
 await page.goto(url,{waitUntil:'load'});
 await check('Hero renders and palette interaction survives',async()=>{
  await page.waitForFunction(()=>window.__motionLab?.ready['hero-stage']);
  const before=await page.evaluate(()=>window.__motionLab.palette);
  await page.locator('#palette').click();assert.notEqual(await page.evaluate(()=>window.__motionLab.palette),before);
  assert(variance(await page.locator('#hero-stage').screenshot({animations:'disabled',timeout:30000}))>20);await snap('hero');
 });
 await check('No journey transport buttons, slider or percentage exist',async()=>{
  assert.equal(await page.locator('#slow,#scrubber,#progress,#journey-toggle,#journey-leave,#arrival-replay').count(),0);
  assert.equal(await page.locator('#journey button,#journey input').count(),0);
 });
 await check('Scenes menu and depth card still work',async()=>{
  await page.locator('#menu-toggle').click();await page.locator('#menu a[href="#depth"]').click();
  await page.waitForFunction(()=>window.__motionLab?.ready['depth-stage']);
  await page.waitForTimeout(900);await page.locator('#depth-stage').click();
  await page.waitForFunction(()=>document.querySelector('#detail').open);await page.locator('#detail-close').click();
  await page.waitForFunction(()=>!document.querySelector('#detail').open);
 });
 await check('Partial viewport entry causes zero automatic scroll or snapping',async()=>{
  await page.evaluate(()=>document.activeElement.blur());
  const y=await page.evaluate(()=>{const y=document.querySelector('#journey').offsetTop-120;window.scrollTo({top:y,behavior:'instant'});return scrollY;});
  await page.waitForFunction(()=>window.__motionLab?.ready['tunnel-stage']);
  await page.waitForTimeout(650);
  assert(Math.abs(await page.evaluate(()=>scrollY)-y)<1);assert.equal((await state()).starts,0);
  assert.equal(await page.locator('.journey-sticky').evaluate(e=>getComputedStyle(e).position),'sticky');
 });
 await check('Fully visible stage starts at 1x without a positioning switch',async()=>{
  await page.mouse.wheel(0,125);
  await page.waitForFunction(()=>window.__journeyPlayer.auto,{},{timeout:20000});
  const a=await state();await page.waitForTimeout(2100);const b=await state();
  assert(b.progress>a.progress+.06);assert(b.progress<a.progress+.24);
  assert.equal(b.duration,18);assert.equal(b.playbackRate,1);
  assert.equal(await page.locator('.journey-sticky').evaluate(e=>getComputedStyle(e).position),'sticky');
  samples.push({name:'normal-speed',a,b});await snap('autoplay');
 });
 await check('Upward scroll immediately wins and never auto-resumes against the reader',async()=>{
  await page.evaluate(()=>{window.__reverseInput=null;addEventListener('wheel',e=>{if(e.deltaY<0)window.__reverseInput={y:scrollY,time:performance.now()};},{once:true,capture:true});});
  await page.mouse.wheel(0,-240);
  await page.waitForFunction(()=>{const p=window.__journeyPlayer,i=window.__reverseInput;return i&&p.reverse&&!p.auto&&p.telemetry.y<i.y-100;},null,{timeout:15000});
  const b=await state();assert(b.reverse);assert(!b.auto);samples.push({name:'reverse-input',state:b,input:await page.evaluate(()=>window.__reverseInput)});
  await page.waitForTimeout(1400);const c=await state();assert(Math.abs(c.progress-b.progress)<.002);
 });
 await check('Natural rewind can leave the scene into the page above',async()=>{
  for(let n=0;n<6;n++){await page.mouse.wheel(0,-700);await page.waitForTimeout(70);}
  await page.waitForTimeout(300);assert.equal((await state()).progress,0);assert.equal((await state()).fullyVisible,false);
 });
 if(label==='mobile')await check('Native finger-style forward and reverse swipes work',async()=>{
  await page.evaluate(()=>window.scrollTo({top:document.querySelector('#journey').offsetTop-60,behavior:'instant'}));
  const cdp=await context.newCDPSession(page);
  async function swipe(start,end){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:start}]});for(let n=1;n<=12;n++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:start+(end-start)*n/12}]});await page.waitForTimeout(22);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  await swipe(700,420);await page.waitForFunction(()=>window.__journeyPlayer.auto,{},{timeout:15000});
  const a=await state();await swipe(400,720);await page.waitForTimeout(700);const b=await state();assert(b.progress<a.progress||b.progress===0);assert(!b.auto);await cdp.detach();
 });
 await check('Full unattended journey reaches the ending at normal wall-clock speed',async()=>{
  await page.evaluate(()=>window.scrollTo({top:document.querySelector('#journey').offsetTop-12,behavior:'instant'}));
  await page.mouse.wheel(0,15);await page.waitForFunction(()=>window.__journeyPlayer.auto,{},{timeout:20000});
  const start=Date.now(),initial=await state();let b=initial;
  // Record lightweight state only. GPU readback screenshots cannot be inside a
  // wall-clock playback assertion: software rendering can stall while capturing.
  while(Date.now()-start<30000){b=await state();samples.push({elapsedMs:Date.now()-start,progress:b.progress,mode:b.mode,graphics:b.graphics});
   if(b.progress===1)break;await page.waitForTimeout(250);
  }
  const elapsed=Date.now()-start;
  assert.equal(b.progress,1);assert.equal(b.mode,'ended');assert(!b.auto);
  assert(elapsed<27000);assert(elapsed>10000);
  assert.equal(await page.locator('#arrival').evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await page.locator('#content').evaluate(e=>e.inert),false);
  assert.notEqual(await page.locator('body').evaluate(e=>getComputedStyle(e).overflowY),'hidden');
  assert(!page.url().includes('#arrival'));samples.push({name:'full-run',elapsedMs:elapsed,initial,final:b});await snap('ending');
 });
 await check('Scrolling upward from the ending reverses it without Back or Replay',async()=>{
  await page.mouse.wheel(0,-220);await page.waitForFunction(()=>window.__journeyPlayer.progress<.98&&window.__journeyPlayer.reverse,null,{timeout:15000});const b=await state();assert(b.progress<1);assert(b.reverse);assert(!b.auto);
  assert(Number(await page.locator('#arrival').evaluate(e=>getComputedStyle(e).opacity))<.95);await snap('reverse-ending');
 });
 await check('Returning to identical scroll coordinates produces the same 3D frame',async()=>{
  await position(.60);await page.waitForFunction(()=>Math.abs(window.__motionLab.progress-.60)<.001);const a=await page.locator('#tunnel-stage').screenshot({timeout:30000});
  await position(.30);await page.waitForFunction(()=>Math.abs(window.__motionLab.progress-.30)<.001);await position(.60);await page.waitForFunction(()=>Math.abs(window.__motionLab.progress-.60)<.001);const b=await page.locator('#tunnel-stage').screenshot({timeout:30000});
  assert(variance(a)>20);assert(variance(b)>20);const pa=PNG.sync.read(a),pb=PNG.sync.read(b);assert.equal(pa.data.length,pb.data.length);
  let sum=0;for(let i=0;i<pa.data.length;i+=4)sum+=Math.abs(pa.data[i]-pb.data[i]);const diff=sum/(pa.width*pa.height);assert(diff<2,`mean red-channel delta ${diff}`);samples.push({name:'reversible-pixels',meanDelta:diff});
 });
 await check('Resize preserves the manual timeline position',async()=>{
  const a=await state();await page.setViewportSize({width:844,height:390});await page.waitForTimeout(600);const b=await state();samples.push({name:'resize',before:a,after:b});assert(Math.abs(b.progress-a.progress)<.01);assert(!b.auto);
  await snap('landscape');await page.setViewportSize(options.viewport);await page.waitForTimeout(400);
 });
 await check('Original scene phases still render with no transport overlay',async()=>{
  for(const [name,p] of [['dark',.35],['fold',.6],['light',.8]]){await position(p);await page.waitForFunction(p=>Math.abs(window.__motionLab.progress-p)<.001,p);await snap('phase-'+name);assert.equal(await page.locator('#journey button').count(),0);}
 });
 await check('Repeated backward scrolling returns to the previous content without a trap',async()=>{
  for(let n=0;n<14;n++){await page.mouse.wheel(0,-600);await page.waitForTimeout(40);}await page.waitForTimeout(400);
  assert.equal((await state()).progress,0);assert.equal((await state()).fullyVisible,false);assert(!await page.locator('#content').evaluate(e=>e.inert));
 });
 await check('Reduced-motion preference disables autoplay without disabling native navigation',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await position(.5);await page.waitForTimeout(500);const a=await state();await page.waitForTimeout(300);const b=await state();assert(!b.auto);assert(Math.abs(a.progress-b.progress)<.002);
  await page.mouse.wheel(0,-400);await page.waitForTimeout(250);assert((await state()).progress<b.progress);
 });
 await check('No application or graphics errors were captured',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__motionLab.errors),[]);});
} catch(e) { console.error('Stopped after failure to avoid misleading cascading results.'); }
finally {
 const result={engine:label,browser:browser.version(),viewport:options.viewport,sourceCommit:process.env.GITHUB_SHA||null,checks,samples,errors,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length};
 await fs.writeFile(`${out}/results.json`,JSON.stringify(result,null,2));await context.close();await browser.close();
 console.log(JSON.stringify({engine:label,passed:result.passed,failed:result.failed}));if(result.failed)process.exitCode=1;
}
