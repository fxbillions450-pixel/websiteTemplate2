import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

test('category fallback keeps text readable and navigation working without WebGL',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  Object.defineProperty(HTMLCanvasElement.prototype,'getContext',{configurable:true,value:function(this:HTMLCanvasElement,kind:string,...args:unknown[]){
   if(kind==='webgl'||kind==='webgl2'||kind==='experimental-webgl')return null;
   return Reflect.apply(original,this,[kind,...args]);
  }});
 });
 await page.goto('/work-categories/advertising');
 const root=page.locator('.category-experience'),canvas=page.locator('.category-canvas');
 await expect(canvas).toHaveAttribute('data-renderer','fallback');
 await expect(canvas).toHaveCSS('opacity','0');
 await expect(root).toHaveCSS('background-color','rgb(227, 185, 166)');
 await expect(page.locator('.category-heading')).toHaveCSS('color','rgb(0, 0, 0)');
 await expect(page.locator('.category-fallback')).toBeVisible();
 await expect(page.getByRole('button',{name:'[MENU]',exact:true})).toHaveCSS('color','rgb(0, 0, 0)');
 await page.getByRole('button',{name:'Next project',exact:true}).click();
 await expect(page.locator('.category-heading-title')).toHaveText('PROJECT EIGHT');
 await expect(root).toHaveCSS('background-color','rgb(239, 208, 165)');
 await page.waitForTimeout(500);
 await fs.mkdir('test-results/screens',{recursive:true});
 await page.screenshot({path:`test-results/screens/${test.info().project.name}-10-fallback.png`});
 await page.locator('.category-open').click();await expect(page).toHaveURL(/\/work\/project-eight$/);
});

test('available WebGL must use the shader renderer rather than silently fall back',async({page})=>{
 await page.goto('/work-categories/advertising');
 await expect(page.locator('.category-experience')).toBeVisible();
 const available=await page.evaluate(()=>{const c=document.createElement('canvas');try{const gl=c.getContext('webgl');if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true;}catch{return false;}});
 const canvas=page.locator('.category-canvas');
 if(available){
  await expect(canvas).toHaveAttribute('data-renderer','webgl');
  await expect(canvas).toHaveCSS('opacity','1');
  await expect(page.locator('.category-fallback')).toHaveCount(0);
  const pixels=await canvas.evaluate(el=>new Promise<number[]>(resolve=>requestAnimationFrame(()=>{const gl=(el as HTMLCanvasElement).getContext('webgl')!;const pixel=new Uint8Array(4);gl.readPixels(3,3,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);resolve([...pixel]);})));
  expect(Math.max(...pixels.slice(0,3))).toBeGreaterThan(80);
 }else{
  test.info().annotations.push({type:'environment',description:'WebGL unavailable: verified readable fallback; GPU effects are not claimed for this browser run.'});
  await expect(canvas).toHaveAttribute('data-renderer','fallback');await expect(canvas).toHaveCSS('opacity','0');
  await expect(page.locator('.category-experience')).toHaveCSS('background-color','rgb(227, 185, 166)');
 }
 await fs.mkdir('test-results/screens',{recursive:true});await page.waitForTimeout(500);
 await page.screenshot({path:`test-results/screens/${test.info().project.name}-11-renderer.png`});
});
