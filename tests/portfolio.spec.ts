import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs/promises';
async function boot(page:Page,path='/'){
  await page.goto(path,{waitUntil:'domcontentloaded'});
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.loader')).toHaveCount(0,{timeout:12000});
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(180);
}
async function explore(page:Page){await page.locator('.explore-trigger').click();await expect(page.locator('.home-experience')).toHaveAttribute('data-explored','true');}
async function shot(page:Page,name:string){await fs.mkdir('test-results/screens',{recursive:true});await page.screenshot({path:`test-results/screens/${test.info().project.name}-${name}.png`});}

test('initial fullscreen composition and reversible zoom-to-grid',async({page,isMobile})=>{
  await boot(page);const viewport=page.viewportSize()!;
  await expect(page.locator('.home-tile')).toHaveCount(4);
  await expect(page.locator('.home-experience')).toHaveCSS('background-color','rgb(0, 0, 0)');
  const sources=await page.locator('.home-tile img').evaluateAll(images=>images.map(image=>(image as HTMLImageElement).currentSrc||image.getAttribute('src')));
  expect(new Set(sources).size).toBe(sources.length);
  const before=await page.locator('.home-tile').last().boundingBox();expect(before!.width).toBeGreaterThan(viewport.width*.94);
  await shot(page,'01-intro');await explore(page);
  const after=await page.locator('.home-tile').last().boundingBox();
  expect(after!.width).toBeLessThan(viewport.width*.65);expect(after!.width).toBeGreaterThan(viewport.width*.20);
  const height=await page.evaluate(()=>document.documentElement.scrollHeight);
  if(isMobile)expect(height).toBeLessThanOrEqual(viewport.height+2);else expect(height).toBeGreaterThan(viewport.height*2.5);
  await shot(page,'02-grid');await page.getByRole('button',{name:'[BACK TO INTRO]',exact:true}).click();
  await expect(page.locator('.home-experience')).toHaveAttribute('data-explored','false');
  await expect.poll(async()=>((await page.locator('.home-tile').last().boundingBox())?.width||0)).toBeGreaterThan(viewport.width*.9);
});

test('drag moves the canvas without accidentally opening a project',async({page})=>{
  await boot(page);await explore(page);const viewport=page.viewportSize()!;
  await page.mouse.move(viewport.width*.50,viewport.height*.53);await page.waitForTimeout(500);
  const before=await page.locator('.home-world').evaluate(el=>getComputedStyle(el).transform);
  await page.mouse.down();await page.mouse.move(viewport.width*.25,viewport.height*.37,{steps:18});await page.mouse.up();await page.waitForTimeout(500);
  expect(await page.locator('.home-world').evaluate(el=>getComputedStyle(el).transform)).not.toEqual(before);expect(new URL(page.url()).pathname).toBe('/');
  await shot(page,'03-panned');
});

test('the full menu fits, traps focus, closes with Escape and unlocks content',async({page})=>{
  await boot(page);await page.getByRole('button',{name:'[MENU]',exact:true}).click();
  const menu=page.getByRole('dialog',{name:'Site navigation'});await expect(menu).toBeVisible();
  await expect(menu.locator('nav a')).toHaveCount(6);await page.waitForTimeout(1000);
  const last=await menu.locator('nav a').last().boundingBox();expect(last!.y+last!.height).toBeLessThan(page.viewportSize()!.height-35);
  await expect(page.locator('#page-content')).toHaveAttribute('inert','');
  await shot(page,'04-menu');await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'[MENU]',exact:true})).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#page-content')).not.toHaveAttribute('inert','');
  expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
});

test('category navigation is a real route with working next/previous and project transitions',async({page})=>{
  await boot(page);await page.getByRole('button',{name:'[MENU]',exact:true}).click();
  await page.locator('#site-menu nav').getByRole('link',{name:'Entertainment',exact:true}).click();
  await expect(page).toHaveURL(/\/work-categories\/entertainment$/);await expect(page.locator('.route-curtain')).not.toHaveAttribute('data-active','true');
  await expect(page.locator('.category-experience')).toBeVisible();const title=await page.locator('.category-heading-title').textContent();
  await page.getByRole('button',{name:'Next project',exact:true}).click();await expect(page.locator('.category-heading-title')).not.toHaveText(title!);
  await shot(page,'05-category');
  await page.getByRole('button',{name:'Previous project',exact:true}).click();await expect(page.locator('.category-heading-title')).toHaveText(title!);
  await page.locator('.category-open').click();await expect(page).toHaveURL(/\/work\/5e-soirees-de-louange-sandra$/);
  await expect(page.locator('.route-curtain')).not.toHaveAttribute('data-active','true');await expect(page.locator('.project-copy h1')).toHaveText('5e soirées de louange Sandra');
  await page.goBack();await expect(page).toHaveURL(/\/work-categories\/entertainment$/);await expect(page.locator('.category-canvas')).toBeVisible();
});

test('horizontal project filmstrip follows vertical scrolling with a mobile-specific intro',async({page,isMobile})=>{
  await boot(page,'/work/5e-soirees-de-louange-sandra');await page.waitForTimeout(1300);await shot(page,'06-project-intro');
  const rail=page.locator(isMobile?'.project-film':'.project-rail');
  const before=await rail.evaluate(el=>getComputedStyle(el).transform);
  const scrollTo=await page.locator('.project-film-section').evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
  await page.evaluate(y=>window.scrollTo(0,y+650),isMobile?scrollTo:0);await page.waitForTimeout(1800);
  const after=await rail.evaluate(el=>getComputedStyle(el).transform);expect(after).not.toBe(before);
  if(isMobile){const intro=await page.locator('.project-intro').boundingBox();expect(intro!.y).toBeLessThan(-100);}
  await shot(page,'07-horizontal-gallery');
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(1800);
  await expect(page.locator('.next-project-link')).toBeVisible();const next=await page.locator('.next-project-link').boundingBox();expect(next!.x).toBeLessThan(page.viewportSize()!.width);
  await shot(page,'08-next-up');await page.locator('.next-project-link').click();await expect(page).toHaveURL(/\/work\/6e-soiree-de-louanges-sandra$/);
});

test('lightbox opens, changes images, closes and restores scrolling',async({page})=>{
  await boot(page,'/work/5e-soirees-de-louange-sandra');await page.getByRole('button',{name:'Enlarge cover image',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Image viewer'})).toBeVisible();await expect(page.locator('.lightbox-controls span')).toContainText('_MG_9491 · 1 / 14');
  await page.getByRole('button',{name:'Next image',exact:true}).click();await expect(page.locator('.lightbox-controls span')).toContainText('_MG_9801 · 2 / 14');
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Image viewer'})).not.toBeVisible();
  expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
});

test('all routes load without application errors or missing local media requests',async({page})=>{
  const errors:string[]=[],badAssets:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).pathname.startsWith('/assets/'))badAssets.push(r.url());});
  for(const path of ['/','/work/7e-soiree-de-louange-sandra','/work/masterclass-festival-gospel-2026','/work-categories/editorial','/work-categories/portrait','/work-categories/entertainment','/work-categories/exhibitions','/info']){
    await boot(page,path);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  }
  await shot(page,'09-info');expect(errors).toEqual([]);expect(badAssets).toEqual([]);
});

test('reduced motion does not trap project content in a horizontal viewport',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await boot(page,'/work/5e-soirees-de-louange-sandra');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);await expect(page.locator('.gallery-frame')).toHaveCount(13);
  await page.locator('.next-project-link').scrollIntoViewIfNeeded();await expect(page.locator('.next-project-link')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
});

test('responsive resizing preserves the application and leaves the menu usable',async({page})=>{
  await boot(page);await explore(page);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);
  await page.getByRole('button',{name:'[MENU]',exact:true}).click();await page.waitForTimeout(900);
  await expect(page.locator('#site-menu nav a').last()).toBeVisible();
  await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(600);
  await expect(page.locator('.home-experience')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
});
