import {expect,test} from '@playwright/test';

test('sideways source photos are rendered upright everywhere they appear',async({page})=>{
  await page.goto('/work/masterclass-festival-gospel-2026');
  await expect(page.locator('.project-cover [data-rotation="90"]')).toBeVisible();
  await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0);
  await expect(page.locator('.project-rail [data-rotation="90"]')).toHaveCount(8);

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

