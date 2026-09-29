import {expect,test} from '@playwright/test';

test('Andy Lorgis branding uses white type on the dark theme',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveAccessibleName('Andy Lorgis — home');
  await expect(page.locator('.home-intro h1')).toHaveAccessibleName('Andy Lorgis');
  await expect(page.locator('.site-header')).toHaveCSS('color','rgb(255, 255, 255)');
  await expect(page.locator('.home-experience')).toHaveCSS('background-color','rgb(0, 0, 0)');
  await expect(page).toHaveTitle('Andy Lorgis');
});

