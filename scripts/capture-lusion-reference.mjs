import {webkit,devices} from 'playwright';
import fs from 'node:fs/promises';
const out='evidence';await fs.mkdir(out,{recursive:true});
for(const [label,options] of [['desktop',{viewport:{width:1280,height:800},deviceScaleFactor:1}],['mobile',{...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:1}]]){
 const dir=`${out}/${label}`;await fs.mkdir(dir,{recursive:true});
 const browser=await webkit.launch(),context=await browser.newContext({...options,recordVideo:{dir:`${dir}/video`,size:options.viewport},reducedMotion:'no-preference'}),page=await context.newPage();
 page.setDefaultTimeout(5000);const errors=[],log=[],shots=[],start=Date.now();page.on('pageerror',e=>errors.push(e.message));
 async function snap(name){
  let imageOK=true;try{await page.screenshot({path:`${dir}/${name}.jpg`,type:'jpeg',quality:72,timeout:15000});}catch(e){imageOK=false;log.push(name+': '+e.message);}
  const data=await page.evaluate(()=>({url:location.href,time:performance.now(),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,touch:navigator.maxTouchPoints,ua:navigator.userAgent},scrollY,pageTransform:document.querySelector('#page-container')?getComputedStyle(document.querySelector('#page-container')).transform:null,items:[...document.querySelectorAll('#home,#home-hero,#home-reel,#home-featured,#home-goal,#home-goal-image-in,#home-goal-image-out,#end-section,#footer,#scroll-nav-section,#scroll-nav-next-bar-inner,#video-overlay,#header-menu,#canvas')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.id,rect:{x:r.x,y:r.y,w:r.width,h:r.height},transform:s.transform,opacity:s.opacity,display:s.display,visibility:s.visibility};})}));
  await fs.writeFile(`${dir}/${name}.json`,JSON.stringify(data,null,2));shots.push({name,imageOK,ms:Date.now()-start,url:data.url,pageTransform:data.pageTransform});return data;
 }
 try{
  await page.goto('https://lusion.co/',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(23000);await snap('01-hero');
  await page.mouse.move(options.viewport.width*.15,options.viewport.height*.4);await page.mouse.move(options.viewport.width*.85,options.viewport.height*.65,{steps:16});await page.waitForTimeout(1500);await snap('02-hero-pointer');
  if(label==='mobile')await page.touchscreen.tap(options.viewport.width*.6,options.viewport.height*.5);else await page.mouse.click(options.viewport.width*.6,options.viewport.height*.5);
  await page.waitForTimeout(1500);await snap('03-hero-activate');
  let hovered=false,bottomReached=false;
  for(let i=0;i<66;i++){
   await page.keyboard.press('PageDown');await page.waitForTimeout(850);const state=await snap(`forward-${String(i).padStart(2,'0')}`);
   if(new URL(state.url).pathname!=='/'){log.push('Onward navigation reached');break;}
   if(!hovered&&label==='desktop'){
    const rects=await page.locator('#home .project-item').evaluateAll(es=>es.map((e,i)=>{const r=e.getBoundingClientRect();return {i,x:r.x,y:r.y,w:r.width,h:r.height};}));
    const r=rects.find(r=>r.y>60&&r.y+r.h<options.viewport.height&&r.w>100);
    if(r){hovered=true;await page.mouse.move(r.x+r.w*.2,r.y+r.h*.25);await page.waitForTimeout(1000);await snap('04-card-left');await page.mouse.move(r.x+r.w*.8,r.y+r.h*.65);await page.waitForTimeout(1000);await snap('05-card-right');}
   }
   if(i===27||i===46){await page.mouse.move(options.viewport.width*.7,options.viewport.height*.6);await page.mouse.down();await page.waitForTimeout(1400);await snap(`hold-${i}`);await page.mouse.up();await page.waitForTimeout(1200);await snap(`release-${i}`);}
   const end=state.items.find(e=>e.id==='scroll-nav-section');if(end&&end.rect.y+end.rect.h<options.viewport.height+12){bottomReached=true;log.push('Homepage bottom visible at step '+i);break;}
  }
  await page.locator('#header-right-menu-btn').click();await page.waitForTimeout(1000);await snap('06-menu');await page.locator('#header-right-menu-btn').click();await page.waitForTimeout(800);
  if(bottomReached&&label==='desktop'){
   await page.mouse.move(options.viewport.width*.5,options.viewport.height*.65);
   for(let i=0;i<18;i++){await page.mouse.wheel(0,180);await page.waitForTimeout(70);if(new URL(page.url()).pathname!=='/')break;}
   await page.waitForTimeout(1700);await snap('07-overscroll');
   if(new URL(page.url()).pathname!=='/'){await page.goBack({waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(2500);await snap('08-overscroll-back');}
  }
  for(let i=0;i<18;i++){await page.keyboard.press('PageUp');await page.waitForTimeout(750);await snap(`reverse-${String(i).padStart(2,'0')}`);}
 }catch(e){log.push('FATAL '+e.message);}
 await fs.writeFile(`${dir}/capture-index.json`,JSON.stringify({label,browserVersion:browser.version(),input:'Native keyboard range inspection; desktop native wheel overscroll; phone activation uses touchscreen tap, but phone scrolling is keyboard-driven and holds use mouse press. Not physical-phone testing.',errors,log,shots},null,2));
 await context.close();await browser.close();
}
