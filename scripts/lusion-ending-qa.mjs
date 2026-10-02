import {chromium,webkit,devices} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const label=process.env.LAB_ENGINE||'desktop';const engine=label==='webkit'?webkit:chromium;
const browser=await engine.launch(label==='webkit'?{}:{...(process.env.LAB_CHROMIUM?{executablePath:process.env.LAB_CHROMIUM}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const options={...(label==='mobile'?devices['Pixel 7']:{}),viewport:label==='desktop'?{width:1280,height:800}:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'no-preference'};
const context=await browser.newContext(options),page=await context.newPage();page.setDefaultTimeout(20000);
const dir='evidence/ending';await fs.mkdir(dir,{recursive:true});
const checks=[],errors=[],samples=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const read=()=>page.evaluate(()=>({player:window.__journeyPlayer,character:window.__motionLab?.emergence,stats:window.__motionLab?.performance.stages['tunnel-stage'],y:scrollY,h:innerHeight,scrollHeight:document.documentElement.scrollHeight,stage:document.querySelector('#tunnel-stage').getBoundingClientRect().toJSON(),continuation:document.querySelector('#continuation').getBoundingClientRect().toJSON()}));
const snap=async name=>page.screenshot({path:`${dir}/${label}-${name}.png`,timeout:30000});
const seek=async(p,post=0)=>{await page.mouse.wheel(0,-1);await page.evaluate(({p,post})=>{const t=window.__journeyPlayer.telemetry;scrollTo({top:t.top+p*t.span+post*t.height,behavior:'instant'});},{p,post});await page.waitForFunction(p=>Math.abs(window.__motionLab.progress-p)<.001,p);await page.waitForTimeout(250);};
async function check(name,fn){try{await fn();checks.push({name,pass:true});console.log('PASS',label,name);}catch(e){checks.push({name,pass:false,error:e.message});throw e;}}
async function visibleCharacter(name){
 const s=await read(),image=PNG.sync.read(await snap(name)),c=s.character;
 assert(c?.visible,'character is live');assert(c.transparentCanvas,'transparent canvas, not an opaque cover');
 const cx=c.center.x+s.stage.left,cy=c.center.y+s.stage.top;
 assert(cx>0&&cx<image.width&&cy>0&&cy<image.height,'character center inside screen');
 let bright=0,pixels=0;const dx=Math.max(15,image.width*.075),dy=Math.max(20,image.height*.12);
 for(let y=Math.max(0,Math.floor(cy-dy));y<Math.min(image.height,cy+dy);y++)for(let x=Math.max(0,Math.floor(cx-dx));x<Math.min(image.width,cx+dx);x++){const i=(y*image.width+x)*4;if(image.data[i]>145&&image.data[i+1]>145&&image.data[i+2]>145)bright++;pixels++;}
 assert(bright>150,`Expected visible suit pixels near actual projected character: ${bright}/${pixels}`);samples.push({name,state:s,brightSuitPixels:bright});return s;
}
try{
 await page.goto(process.env.LAB_URL||'http://127.0.0.1:4173/',{waitUntil:'load'});
 await page.evaluate(()=>scrollTo(0,document.querySelector('#journey').offsetTop-80));await page.waitForFunction(()=>window.__motionLab?.ready['tunnel-stage']);
 await check('Autoplay still waits for natural full-viewport entry',async()=>{const s=await read();await page.waitForTimeout(500);assert.equal((await read()).y,s.y);assert(!(await read()).player.auto);assert.equal(s.player.duration,18);});
 await check('Exit is a separate character pass crossing the contracting frame',async()=>{await seek(.94);const s=await visibleCharacter('crossing');assert(s.character.progress>0&&s.character.progress<1);assert.equal(await page.locator('.journey-sticky').evaluate(e=>getComputedStyle(e).position),'sticky');});
 await check('Unattended playback stops with the astronaut visibly settled, not covered',async()=>{
  await page.evaluate(()=>scrollTo(0,document.querySelector('#journey').offsetTop-20));await page.waitForFunction(()=>window.__journeyPlayer.mode==='before');await page.mouse.wheel(0,24);await page.waitForFunction(()=>window.__journeyPlayer.auto);
  await page.waitForFunction(()=>window.__journeyPlayer.progress===1&&!window.__journeyPlayer.auto,null,{timeout:30000});
  const s=await visibleCharacter('settled');assert(s.character.settled&&s.character.backdropGone);assert(s.scrollHeight-s.y-s.h>s.h);assert(!page.url().includes('#arrival'));
 });
 await check('Stopping scroll holds the same live character and document position',async()=>{const a=await read();await page.waitForTimeout(3000);const b=await visibleCharacter('held');assert.equal(a.y,b.y);assert.equal(a.character.characterId,b.character.characterId);assert.deepEqual(a.character.center,b.character.center);assert(!b.player.auto);assert(b.stats.renders-a.stats.renders<=2);});
 await check('Downward wheel reveals normal page content while the character remains visible',async()=>{const a=await read();await page.mouse.wheel(0,Math.floor(a.h*.68));await page.waitForFunction(y=>scrollY>y+150,a.y);await page.waitForTimeout(300);const b=await visibleCharacter('continued');assert.equal(b.player.progress,1);assert(!b.player.auto);assert(b.continuation.top<b.h);assert.equal(a.character.characterId,b.character.characterId);assert(!await page.locator('#content').evaluate(e=>e.inert));});
 if(label==='mobile')await check('A real browser-dispatched touch swipe continues below the cinematic boundary',async()=>{const a=await read(),cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:100,y:660}]});for(let n=1;n<=12;n++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:100,y:660-260*n/12}]});await page.waitForTimeout(22);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(y=>scrollY>y+80,a.y);assert.equal((await read()).player.progress,1);assert(!(await read()).player.auto);await cdp.detach();});
 await check('Orientation changes preserve the after-scroll position, not snap back to the ending',async()=>{await seek(1,.65);const a=await read();await page.setViewportSize({width:844,height:390});await page.waitForTimeout(400);const b=await visibleCharacter('landscape');assert(Math.abs(b.player.postViewport-a.player.postViewport)<.025);assert(!b.player.auto);await page.setViewportSize(options.viewport);await page.waitForTimeout(350);});
 await check('Character stays on page during continued reading and then leaves by native scrolling',async()=>{await seek(1,1.35);await visibleCharacter('page-content');await page.mouse.wheel(0,5000);await page.waitForTimeout(500);const b=await read();assert(b.stage.bottom<=1,'Character canvas must fully release before the last footer, not remain pinned');assert(!b.player.auto);assert.notEqual(await page.locator('body').evaluate(e=>getComputedStyle(e).overflowY),'hidden');});
 await check('Upward travel reverses page handoff and returns into the original tunnel',async()=>{await seek(1,.15);await page.mouse.wheel(0,-600);await page.waitForFunction(()=>window.__journeyPlayer.progress<.97);const a=await read();await page.waitForTimeout(1000);const b=await read();assert(b.player.reverse&&!b.player.auto);assert(b.player.progress<=a.player.progress+.001);await snap('reverse');});
 await check('Ending fits narrow phones, portrait tablets and wide screens',async()=>{for(const [w,h] of [[320,568],[768,1024],[1440,900]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(250);await seek(1);await visibleCharacter(`fit-${w}x${h}`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}});
 await check('No transport controls, duplicate canvas or renderer errors',async()=>{assert.equal(await page.locator('#journey button,#journey input').count(),0);assert.equal(await page.locator('#tunnel-stage canvas').count(),1);assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.__motionLab.errors),[]);});
}catch(e){console.error('FAIL',e.message);if(!checks.some(c=>!c.pass))checks.push({name:'setup',pass:false,error:e.message});samples.push({name:'failure',state:await read().catch(()=>null)});await snap('failure').catch(()=>{});}
finally{const result={engine:label,sourceCommit:process.env.GITHUB_SHA||null,checks,errors,samples,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length};await fs.writeFile(`${dir}/results.json`,JSON.stringify(result,null,2));await context.close();await browser.close();if(result.failed)process.exitCode=1;}
