import {expect,test} from '@playwright/test';

test('menu links are individually positioned and animate as one active choice',async({page,isMobile})=>{
  await page.goto('/');
  await expect(page.locator('.loader')).toHaveCount(0,{timeout:12000});
  await page.getByRole('button',{name:'[MENU]',exact:true}).click();

  const menu=page.getByRole('dialog',{name:'Site navigation'});
  const links=menu.locator('nav a');
  await expect(links).toHaveCount(6);
  await expect(menu.locator('.menu-line')).toHaveCount(6);

  const boxes=await links.evaluateAll(items=>items.map(item=>{
    const box=item.getBoundingClientRect();
    return {top:box.top,bottom:box.bottom,left:box.left,right:box.right};
  }));
  for(let index=1;index<boxes.length;index++)expect(boxes[index].top).toBeGreaterThanOrEqual(boxes[index-1].bottom-1);
  expect(boxes.at(-1)!.bottom).toBeLessThan(page.viewportSize()!.height-35);

  if(isMobile){
    await expect(menu.locator('.menu-preview')).toBeHidden();
  }else{
    const preview=await menu.locator('.menu-preview').boundingBox();
    expect(preview!.x).toBeGreaterThanOrEqual(boxes[0].right-2);
  }

  const active=links.filter({hasText:'Editorial'});
  if(isMobile)await active.focus();else await active.hover();
  await expect(active).toHaveCSS('opacity','1');
  await expect(links.filter({hasText:'Entertainment'})).toHaveCSS('opacity','0.22');
  expect(await active.evaluate(item=>getComputedStyle(item).transform)).not.toBe('none');
  await expect(active.locator('.menu-arrow')).toHaveCSS('opacity','1');
  await page.screenshot({path:`test-results/menu-${isMobile?'mobile':'desktop'}.png`});
});
