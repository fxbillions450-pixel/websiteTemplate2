import {webkit,devices} from 'playwright';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin='https://lusion.co/',out='evidence';await fs.mkdir(out,{recursive:true});
const fingerprints=[];
for(const url of [origin,origin+'_astro/hoisted.CUO_IjfL.js',origin+'_astro/about.CNa9RfUh.css']){try{const r=await fetch(url,{signal:AbortSignal.timeout(15000)});const b=Buffer.from(await r.arrayBuffer());fingerprints.push({url,status:r.status,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}catch(e){fingerprints.push({url,error:String(e)});}}
await fs.writeFile(`${out}/source-fingerprints.json`,JSON.stringify(fingerprints,null,2));
for(const [label,options] of [['desktop-webkit',{viewport:{width:1280,height:800},deviceScaleFactor:1}],['mobile-webkit',{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1}]]){
 const dir=`${out}/${label}`;await fs.mkdir(dir,{recursive:true});
 const browser=await webkit.launch(),context=await browser.newContext({...options,recordVideo:{dir:`${dir}/video`,size:options.viewport},reducedMotion:'no-preference'}),page=await context.newPage();
 page.setDefaultTimeout(5000);const log=[],errors=[],shots=[];const start=Date.now();
 page.on('pageerror',e=>errors.push(e.message));
 async function snap(name){
  let imageOK=true;try{await page.screenshot({path:`${dir}/${name}.jpg`,type:'jpeg',quality:74,timeout:20000});}catch(e){imageOK=false;log.push(name+': '+e.message);}
  const data=await page.evaluate(()=>({url:location.href,time:performance.now(),viewport:{innerWidth,innerHeight,dpr:devicePixelRatio,touch:navigator.maxTouchPoints,ua:navigator.userAgent},scrollY,bodyHeight:document.documentElement.scrollHeight,pageTransform:getComputedStyle(document.getElementById('page-container')).transform,items:[...document.querySelectorAll('canvas,video,h1,h2,[id]')].filter(e=>e.tagName==='CANVAS'||e.tagName==='VIDEO'||/^(home|header|footer|scroll|video-overlay|preloader|end)/.test(e.id)).slice(0,240).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,id:e.id,cls:typeof e.className==='string'?e.className:'',rect:{x:r.x,y:r.y,w:r.width,h:r.height},transform:s.transform,opacity:s.opacity,display:s.display,visibility:s.visibility,text:e.matches('h1,h2')?e.textContent:undefined};})}));
  await fs.writeFile(`${dir}/${name}.json`,JSON.stringify(data,null,2));shots.push({name,imageOK,wallClockMs:Date.now()-start,url:data.url,pageTransform:data.pageTransform});return data;
 }
 try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(18000);await snap('01-hero');await page.waitForTimeout(6000);await snap('02-hero-idle');
  await page.mouse.move(options.viewport.width*.1,options.viewport.height*.4);await page.mouse.move(options.viewport.width*.85,options.viewport.height*.6,{steps:16});await page.waitForTimeout(1400);await snap('03-hero-pointer');
  if(label.startsWith('mobile'))await page.touchscreen.tap(options.viewport.width*.55,options.viewport.height*.6);else await page.mouse.click(options.viewport.width*.55,options.viewport.height*.6);
  await page.waitForTimeout(1500);await snap('04-hero-click');
  await page.locator('#header-right-menu-btn').click();await page.waitForTimeout(1000);await snap('05-menu-open');await page.locator('#header-right-menu-btn').click();await page.waitForTimeout(1000);await snap('06-menu-closed');
  // The live site's own ScrollPane implements PageDown/PageUp. No engine state or animation settings are modified.
  // On mobile this is a keyboard-driven viewport inspection, NOT proof of physical finger-swipe behavior.
  let openedReel=false,hovered=false;
  for(let i=0;i<42;i++){
   await page.keyboard.press('PageDown');await page.waitForTimeout(1000);let state=await snap(`forward-${String(i).padStart(2,'0')}`);
   if(new URL(state.url).pathname!=='/'){log.push('Onward route reached');break;}
   const reel=page.locator('#home-reel-video-watch-btn'),r=await reel.boundingBox();
   if(!openedReel&&r&&r.y>90&&r.y+r.height<options.viewport.height){openedReel=true;try{await reel.click();await page.waitForTimeout(1000);await snap('07-reel-overlay');const close=page.locator('#video-overlay__mobile-close-btn');if(await close.isVisible())await close.click({force:true});else await page.keyboard.press('Escape');await page.waitForTimeout(800);await snap('08-reel-closed');}catch(e){log.push('Reel: '+e.message);}}
   const card=page.locator('#home .project-item').first(),c=await card.boundingBox();
   if(!hovered&&c&&c.y>30&&c.y+c.height<options.viewport.height){hovered=true;try{await page.mouse.move(c.x+c.width*.2,c.y+c.height*.3);await page.waitForTimeout(800);await snap('09-card-left');await page.mouse.move(c.x+c.width*.8,c.y+c.height*.7);await page.waitForTimeout(800);await snap('10-card-right');}catch(e){log.push('Card: '+e.message);}}
  }
  for(let i=0;i<15;i++){await page.keyboard.press('PageUp');await page.waitForTimeout(800);await snap(`reverse-${String(i).padStart(2,'0')}`);}
  await page.mouse.move(options.viewport.width*.7,options.viewport.height*.65);await page.mouse.down();await page.waitForTimeout(1600);await snap('11-held');await page.mouse.up();await page.waitForTimeout(1500);await snap('12-released');
  // Use an actual project anchor through the current router, preserving the default browser Back path.
  const card=page.locator('#home .project-item').first();
  if(await card.count()){await card.evaluate(e=>e.click());await page.waitForTimeout(3500);await snap('13-project-route');await page.goBack({waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(3000);await snap('14-history-back');}
 }catch(e){log.push('FATAL '+e.message);}
 await fs.writeFile(`${dir}/capture-index.json`,JSON.stringify({label,browserVersion:browser.version(),input:'Native PageDown/PageUp through reference ScrollPane; pointer interactions; phone viewport is not a finger-swipe or physical-device test',log,errors,shots},null,2));
 await context.close();await browser.close();
}
console.log('Capture complete: successful process is not a visual parity result. Inspect pixels and logs.');
