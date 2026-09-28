import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',fullyParallel:false,workers:2,retries:0,timeout:35000,
  expect:{timeout:10000},reporter:[['list'],['html',{open:'never'}],['json',{outputFile:'test-results/results.json'}]],
  use:{baseURL:process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:3000',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900},launchOptions:{args:['--enable-unsafe-swiftshader']}}},
    {name:'iphone-webkit',use:{...devices['iPhone 13'],viewport:{width:390,height:844}}},
  ],
  webServer:process.env.PLAYWRIGHT_BASE_URL?undefined:{command:'npm start',url:'http://127.0.0.1:3000',reuseExistingServer:!process.env.CI,timeout:60000},
});
