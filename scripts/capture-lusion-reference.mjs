import {chromium,webkit,devices} from 'playwright';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin='https://lusion.co/';
const out='evidence';await fs.mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const fingerprints=[];
for(const url of [origin,origin+'_astro/hoisted.CUO_IjfL.js',origin+'_astro/about.CNa9RfUh.css']){
 try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});const b=Buffer.from(await r.arrayBuffer());fingerprints.push({url,status:r.status,bytes:b.length,sha256:hash(b)});if(r.ok)await fs.writeFile(`${out}/source-${url===origin?'home.html':url.split('/').at(-1)}`,b);}catch(e){fingerprints.push({url,error:String(e)});}
}
await fs.writeFile(`${out}/source-fingerprints.json`,JSON.stringify(fingerprints,null,2));
const configs=[['desktop',chromium,{viewport:{width:1440,height:900},deviceScaleFactor:1}],['iphone-webkit',webkit,{...devices['iPhone 13'],viewport:{width:390,height:844}}],['mobile-chromium',chromium,{...devices['Pixel 7'],viewport:{width:390,height:844}}]];
for(const [label,engine,options] of configs){
 const dir=`${out}/${label}`;await fs.mkdir(dir,{recursive:true});
 let browser,context,page;const log=[],shots=[],errors=[],badRequests=[],resources=[];let start=Date.now();
 try{
  browser=await engine.launch(engine===chromium?{args:['--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']}:{});
  context=await browser.newContext({...options,recordVideo:{dir:`${dir}/video`,size:{width:options.viewport.width,height:options.viewport.height}},reducedMotion:'no-preference'});
  page=await context.newPage();page.setDefaultTimeout(4500);
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)badRequests.push({url:r.url(),status:r.status()});if(/\.js(?:\?|$)|\.css(?:\?|$)|\.buf(?:\?|$)|depth|\.exr(?:\?|$)/.test(r.url()))resources.push({url:r.url(),status:r.status()});});
  async function snap(name){
   const timing=Date.now()-start;
   await page.screenshot({path:`${dir}/${name}.jpg`,type:'jpeg',quality:76,timeout:12000});
   const state=await page.evaluate(()=>({url:location.href,time:performance.now(),viewport:{innerWidth,innerHeight,dpr:devicePixelRatio,touch:navigator.maxTouchPoints,userAgent:navigator.userAgent,visualViewport:visualViewport?{width:visualViewport.width,height:visualViewport.height,offsetTop:visualViewport.offsetTop,scale:visualViewport.scale}:null},scroll:{x:scrollX,y:scrollY,height:document.documentElement.scrollHeight},bodyClass:document.body.className,items:[...document.querySelectorAll('canvas,section,h1,h2,video,[id]')].slice(0,240).map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,id:el.id,cls:typeof el.className==='string'?el.className:'',text:el.matches('h1,h2')?el.textContent:'',rect:{x:r.x,y:r.y,w:r.width,h:r.height},opacity:s.opacity,display:s.display,visibility:s.visibility,transform:s.transform,...(el.tagName==='VIDEO'?{readyState:el.readyState,paused:el.paused,currentTime:el.currentTime,src:el.currentSrc}:{} )};})}));
   await fs.writeFile(`${dir}/${name}.json`,JSON.stringify(state,null,2));shots.push({name,wallClockMs:timing,url:state.url,scroll:state.scroll});return state;
  }
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});
  await snap('00-first');
  await page.waitForTimeout(3000);await snap('01-load-3s');
  await page.waitForTimeout(7000);await snap('02-load-10s');
  await page.waitForTimeout(5000);await snap('03-hero-rest');
  await fs.writeFile(`${dir}/home-dom.html`,await page.content());
  const initial=await page.evaluate(()=>({scripts:[...document.scripts].map(s=>s.src).filter(Boolean),styles:[...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.href),links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent.trim(),href:a.href,cls:a.className})),buttons:[...document.querySelectorAll('button,[role=button]')].map(b=>({text:b.textContent,aria:b.getAttribute('aria-label'),id:b.id,cls:b.className})),fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),webglTest:!!document.createElement('canvas').getContext('webgl')}));
  await fs.writeFile(`${dir}/resources.json`,JSON.stringify(initial,null,2));
  if(label==='desktop')for(const url of [...initial.scripts,...initial.styles]){if(!url.startsWith(origin)||fingerprints.some(f=>f.url===url))continue;try{const r=await context.request.get(url,{timeout:15000});const b=await r.body();fingerprints.push({url,status:r.status(),bytes:b.length,sha256:hash(b)});if(r.ok())await fs.writeFile(`${out}/source-runtime-${url.split('/').at(-1).split('?')[0]}`,b);}catch(e){log.push(String(e));}}
  await page.mouse.move(options.viewport.width*.15,options.viewport.height*.25);await page.mouse.move(options.viewport.width*.8,options.viewport.height*.72,{steps:25});await snap('04-hero-pointer');
  if(label==='desktop')await page.mouse.click(options.viewport.width*.65,options.viewport.height*.55);else await page.touchscreen.tap(options.viewport.width*.65,options.viewport.height*.55);
  await page.waitForTimeout(1200);await snap('05-hero-click');
  // Native wheel on desktop/WebKit; genuine browser-dispatched touch gesture on mobile Chromium.
  let cdp=null;if(label==='mobile-chromium')cdp=await context.newCDPSession(page);
  async function scrollBy(amount){
   if(!cdp){await page.mouse.move(options.viewport.width*.5,options.viewport.height*.6);await page.mouse.wheel(0,amount);return;}
   const x=options.viewport.width*.5,y=options.viewport.height*.8,dy=Math.min(Math.abs(amount),options.viewport.height*.6)*Math.sign(amount);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let n=1;n<=10;n++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-dy*n/10}]});await page.waitForTimeout(22);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  for(let i=0;i<34;i++){
   await scrollBy(options.viewport.height*.85);await page.waitForTimeout(800);const state=await snap(`scroll-${String(i).padStart(2,'0')}`);
   if(new URL(state.url).pathname!=='/'){log.push('Scroll caused route change at '+i);break;}
  }
  await page.mouse.down();await page.waitForTimeout(1400);await snap('06-hold');await page.mouse.up();
  for(let i=0;i<6;i++){await scrollBy(-options.viewport.height*1.1);await page.waitForTimeout(600);await snap(`reverse-${i}`);}
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(10000);
  const menu=page.locator('button,[role=button],a').filter({hasText:/^\s*menu\s*$/i}).first();
  try{if(await menu.count())await menu.click();else await page.locator('[aria-label*=menu i],#header-menu-btn,[class*=menu-toggle]').first().click();await page.waitForTimeout(800);await snap('07-menu');await page.keyboard.press('Escape');}catch(e){log.push('Menu: '+String(e));}
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(10000);
  const project=page.locator('a[href*="/project"]').filter({visible:true}).first();
  try{if(await project.count()){await project.scrollIntoViewIfNeeded({timeout:4000});await project.hover();await page.waitForTimeout(900);await snap('08-card-hover');await project.click();await page.waitForTimeout(1800);await snap('09-project-route');await page.goBack({waitUntil:'domcontentloaded'});await page.waitForTimeout(2000);await snap('10-history-back');}}catch(e){log.push('Project: '+String(e));}
 }catch(e){log.push('FATAL '+String(e));}
 await fs.writeFile(`${dir}/capture-index.json`,JSON.stringify({label,browserVersion:browser?.version(),input:label==='mobile-chromium'?'CDP touch':label==='iphone-webkit'?'wheel at touch-enabled viewport; not a finger-swipe test':'native wheel',log,errors,badRequests,resources,shots},null,2));
 if(context)await context.close();if(browser)await browser.close();
}
await fs.writeFile(`${out}/source-fingerprints.json`,JSON.stringify(fingerprints,null,2));
console.log('Reference collection completed. Inspect pixels and errors before claiming visual success. No application code changed; no deployment performed.');
