import {expect,test} from '@playwright/test';
import {access} from 'node:fs/promises';
import path from 'node:path';

const galleries=[
  {slug:'5e-soirees-de-louange-sandra',count:14,rotated:[]},
  {slug:'6e-soiree-de-louanges-sandra',count:19,rotated:[]},
  {slug:'7e-soiree-de-louange-sandra',count:15,rotated:[]},
  {slug:'masterclass-festival-gospel-2026',count:24,rotated:['01','04','12','13','23']},
];

for(const gallery of galleries){
  test(`${gallery.slug} shows complete, uncropped photographs`,async({page})=>{
    await page.goto(`/work/${gallery.slug}`);

    const images=page.locator('.project-cover .media img,.gallery-frame .media img');
    await expect(images).toHaveCount(gallery.count);
    const previews=await images.evaluateAll(items=>items.map(item=>{
      const image=item as HTMLImageElement;
      return {src:new URL(image.src).pathname,fit:getComputedStyle(image).objectFit};
    }));
    expect(previews.every(preview=>preview.fit==='contain')).toBe(true);
    expect(new Set(previews.map(preview=>preview.src)).size).toBe(gallery.count);
    for(const preview of previews){
      await expect(access(path.join(process.cwd(),'public',preview.src.replace(/^\//,'')))).resolves.toBeUndefined();
    }

    const rotated=await page.locator('.project-cover [data-rotation="90"] img,.gallery-frame [data-rotation="90"] img').evaluateAll(items=>
      items.map(item=>item.getAttribute('src')?.match(/\/(\d+)\.jpg$/)?.[1]),
    );
    expect(rotated).toEqual(gallery.rotated);
  });
}
