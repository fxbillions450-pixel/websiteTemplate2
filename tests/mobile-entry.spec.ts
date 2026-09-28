import {test,expect} from '@playwright/test';
test('physical-style touchscreen tap enters the canvas on first and subsequent visits',async({page,isMobile})=>{
 test.skip(!isMobile,'Touch-specific entry test');
 for(let attempt=0;attempt<3;attempt++){
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.loader')).toHaveCount(0,{timeout:12000});
  await page.locator('.explore-trigger').tap();
  await expect(page.locator('.home-experience')).toHaveAttribute('data-explored','true',{timeout:7000});
  await page.getByRole('button',{name:'[BACK TO INTRO]',exact:true}).tap();
  await expect(page.locator('.home-experience')).toHaveAttribute('data-explored','false');
 }
});
