import {expect,test} from '@playwright/test';

test('sideways source photos are rendered upright everywhere they appear',async({page})=>{
  await page.goto('/work/masterclass-festival-gospel-2026');
  await expect(page.locator('.project-cover [data-rotation="90"]')).toBeVisible();
  await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0);
  const corrected=page.locator('.project-rail [data-rotation="90"] img');
  await expect(corrected).toHaveCount(5);
  expect(await corrected.evaluateAll(images=>images.map(image=>image.getAttribute('src')?.match(/\/(\d+)\.jpg$/)?.[1]))).toEqual(['01','04','12','13','23']);
  await expect(page.getByAltText(/_MG_0651 93 Edited/).locator('..')).not.toHaveAttribute('data-rotation');
  await expect(page.getByAltText(/_MG_0604 77 Edited/).locator('..')).not.toHaveAttribute('data-rotation');
  await expect(page.getByAltText(/_MG_0661 99 Edited/).locator('..')).not.toHaveAttribute('data-rotation');

  const cover=page.locator('.project-cover [data-rotation="90"]');
  await expect(cover).toHaveCSS('transform',/matrix/);
  const geometry=await cover.evaluate(el=>{
    const box=el.getBoundingClientRect();
    const parent=el.parentElement!.getBoundingClientRect();
    return {width:Math.round(box.width),height:Math.round(box.height),parentWidth:Math.round(parent.width),parentHeight:Math.round(parent.height)};
  });
  expect(geometry).toEqual({width:geometry.parentWidth,height:geometry.parentHeight,parentWidth:geometry.parentWidth,parentHeight:geometry.parentHeight});
  await page.screenshot({path:'test-results/masterclass-orientation.png',fullPage:false});
});

