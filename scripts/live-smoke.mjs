import {chromium,webkit,devices,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base='https://website-template2-kappa.vercel.app';
const expected=JSON.parse(await fs.readFile('public/release.json','utf8')).version;
await fs.mkdir('live-evidence',{recursive:true});
let ready=false;
for(let attempt=0;attempt<40;attempt++){
 try{const response=await fetch(`${base}/release.json?t=${Date.now()}`,{signal:AbortSignal.timeout(8000)});if(response.ok&&(await response.json()).version===expected){ready=true;break;}}catch{}
 await new Promise(resolve=>setTimeout(resolve,3000));
}
if(!ready)throw new Error('Production alias did not reach expected release '+expected);
const report={release:expected,base,checkedAt:new Date().toISOString(),browsers:[]};
try{
 for(const [name,engine,options] of [['desktop',chromium,{viewport:{width:1440,height:900},deviceScaleFactor:1}],['iphone',webkit,{...devices['iPhone 13'],viewport:{width:390,height:844}}]]){
  const browser=await engine.launch({args:name==='desktop'?['--enable-unsafe-swiftshader']:[]});
  const context=await browser.newContext(options);const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const shot=label=>page.screenshot({path:`live-evidence/${name}-${label}.png`});
  const record={name,viewport:options.viewport,checks:[],errors};report.browsers.push(record);
  try{
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await expect(page.locator('.loader')).toHaveCount(0,{timeout:15000});await page.waitForTimeout(1300);await shot('01-intro');
   record.checks.push('Live homepage and loader');
   if(name==='iphone')await page.locator('.explore-trigger').tap();else await page.mouse.wheel(0,1900);
   await expect(page.locator('.home-experience')).toHaveAttribute('data-explored','true');
   await page.waitForTimeout(800);await shot('02-grid');record.checks.push('Desktop wheel / mobile tap zoom-to-grid');
   const before=await page.locator('.home-world').evaluate(el=>getComputedStyle(el).transform);
   // Pointer movement here verifies pan mechanics; iPhone entry above uses a real touch event.
   await page.mouse.move(200,400);await page.mouse.down();await page.mouse.move(100,250,{steps:12});await page.mouse.up();await page.waitForTimeout(500);
   expect(await page.locator('.home-world').evaluate(el=>getComputedStyle(el).transform)).not.toBe(before);
   expect(new URL(page.url()).pathname).toBe('/');record.checks.push('Drag without accidental navigation');
   await page.getByRole('button',{name:'[MENU]',exact:true}).click();await page.waitForTimeout(1200);await shot('03-menu');
   await page.locator('#site-menu nav').getByRole('link',{name:'Entertainment',exact:true}).click();
   await expect(page).toHaveURL(/\/work-categories\/entertainment$/);await expect(page.locator('.route-curtain')).not.toHaveAttribute('data-active','true');await page.waitForTimeout(1000);await shot('04-category');
   record.checks.push('Menu and category route transition');
   await page.locator('.category-open').click();await expect(page).toHaveURL(/\/work\/5e-soirees-de-louange-sandra$/);
   await expect(page.locator('.route-curtain')).not.toHaveAttribute('data-active','true');await page.waitForTimeout(1400);await shot('05-project');
   await page.getByRole('button',{name:'Enlarge cover image',exact:true}).click();await expect(page.getByRole('dialog',{name:'Image viewer'})).toBeVisible();await page.keyboard.press('Escape');
   record.checks.push('Project entry and image viewer');
   await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(2200);await shot('06-next-up');
   await page.locator('.next-project-link').click();await expect(page).toHaveURL(/\/work\/6e-soiree-de-louanges-sandra$/);record.checks.push('Horizontal gallery and next-project navigation');
   await page.goto(base+'/info',{waitUntil:'domcontentloaded'});await page.waitForTimeout(1000);await shot('07-info');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);expect(errors).toEqual([]);record.checks.push('Info, no horizontal overflow, no application exceptions');
  }finally{await context.close();await browser.close();}
 }
}finally{await fs.writeFile('live-evidence/report.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
