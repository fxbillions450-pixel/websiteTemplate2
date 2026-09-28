import { chromium, webkit, devices } from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('evidence', {recursive:true});
const origin='https://www.oshanehoward.com';
for (const [label,engine,options] of [['desktop',chromium,{viewport:{width:1440,height:900}}],['mobile',webkit,{...devices['iPhone 13'],viewport:{width:390,height:844}}]]) {
 const browser=await engine.launch();
 const context=await browser.newContext({...options,recordVideo:{dir:'evidence/videos',size:options.viewport}});
 const page=await context.newPage();
 page.setDefaultTimeout(7000);
 const log=[];
 async function snap(name){
  await page.screenshot({path:`evidence/${label}-${name}.png`,timeout:10000});
  const data=await page.evaluate(()=>({url:location.href,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scrollY},body:document.body.className,scrollHeight:document.documentElement.scrollHeight,items:[...document.querySelectorAll('h1,h2,header,nav,main,section,canvas,[class*=hero],[class*=grid],[class*=explor],[class*=intro],[class*=menu],[class*=drag]')].slice(0,200).map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {tag:el.tagName,cls:el.className,text:el.textContent?.trim().slice(0,100),rect:{x:r.x,y:r.y,w:r.width,h:r.height},transform:s.transform,position:s.position,opacity:s.opacity,font:s.font,fontFamily:s.fontFamily,bg:s.backgroundColor,overflow:s.overflow,display:s.display}})}));
  await fs.writeFile(`evidence/${label}-${name}.json`,JSON.stringify(data,null,2));
 }
 try {
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(9000);
  await snap('01-loaded');
  await fs.writeFile(`evidence/${label}-home.html`,await page.content());
  const resources=await page.evaluate(()=>({scripts:[...document.scripts].map(s=>s.src||s.textContent),css:[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>x.href),links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent.trim().slice(0,80),href:a.href})),fonts:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status}))}));
  await fs.writeFile(`evidence/${label}-resources.json`,JSON.stringify(resources,null,2));
  if(label==='desktop'){
    let i=0;for(const url of resources.css){try{const r=await context.request.get(url);await fs.writeFile(`evidence/source-style-${i++}.css`,await r.text());}catch{}}
    i=0;for(const script of resources.scripts){if(!script.startsWith('https:')) continue; if(/gsap|jquery|webfont|google|facebook|analytics|vimeo/i.test(script))continue;try{const r=await context.request.get(script);const text=await r.text();if(text.length<2500000)await fs.writeFile(`evidence/source-script-${i++}.js`,`// ${script}\n${text}`);}catch{}}
    for(const [i,y] of [100,300,600,1000,1600,2400,4000].entries()){await page.mouse.wheel(0,y);await page.waitForTimeout(1300);await snap(`scroll-${i}`);}
  }else{
    const target=page.getByText(/TAP TO EXPLORE/i).first();
    try{await target.tap({timeout:5000});}catch{await page.touchscreen.tap(195,710);}
    await page.waitForTimeout(2400);await snap('02-after-tap');
  }
  await page.mouse.move(options.viewport.width*.6,options.viewport.height*.55);
  await page.mouse.down();await page.mouse.move(options.viewport.width*.2,options.viewport.height*.3,{steps:20});await page.mouse.up();await page.waitForTimeout(1300);await snap('03-after-drag');
  try{await page.getByText(/^\[?menu\]?$/i).filter({visible:true}).first().click({timeout:4000});}catch{try{await page.locator('[class*=menu-button],[class*=menu-toggle]').first().click({timeout:4000});}catch{}}
  await page.waitForTimeout(1200);await snap('04-menu');
  await page.goto(origin+'/work/tenasati-jewelry',{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(5000);await snap('05-project');
  await fs.writeFile(`evidence/${label}-project.html`,await page.content());
  await page.evaluate(()=>window.scrollTo(0,innerHeight*.8));await page.waitForTimeout(1500);await snap('06-project-scroll');
  await page.goto(origin+'/work-categories/advertising',{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(4500);await snap('07-category');
  await fs.writeFile(`evidence/${label}-category.html`,await page.content());
 } catch(e){log.push(String(e));}
 await fs.writeFile(`evidence/${label}-log.json`,JSON.stringify(log));
 await context.close();await browser.close();
}
