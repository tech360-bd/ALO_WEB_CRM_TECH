/** Browser contract fixtures only; not a measured SEO/provider/DB test. */
import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage();let fail=false;let rows=[];const calls=[];
 await page.route('**/api/seo/**',async route=>{
  const req=route.request();calls.push({url:new URL(req.url()).pathname,method:req.method()});
  if(fail)return route.fulfill({status:503,json:{error:'Synthetic database unavailable'}});
  if(req.url().includes('/health'))return route.fulfill({json:{verification:'configuration_only_not_authenticated_or_operational',sitemap:{moduleImportable:true},robots:{moduleImportable:true},ga4:{configured:false},searchConsole:{configured:false}}});
  if(req.url().includes('/opportunities'))return route.fulfill({json:{opportunitiesCreated:1,skipped:0}});
  if(req.method()==='POST'){const data=req.postDataJSON();expect(data).toEqual({keyword:'synthetic keyword'});rows=[{id:'synthetic',keyword:data.keyword,searchVolume:0,difficulty:0,intent:'INFORMATIONAL',priority:'MEDIUM'}];return route.fulfill({json:{success:true}});}
  return route.fulfill({json:{items:rows,liveProviderVerified:false}});
 });
 await page.goto('http://127.0.0.1:4173/?seo');
 const keywords=page.getByRole('region',{name:'SEO stored keywords'});const technical=page.getByRole('region',{name:'SEO configuration and supplied metrics'});
 await expect(keywords.getByText('No stored keywords match this search.')).toBeVisible();
 await keywords.getByRole('textbox',{name:'New stored keyword'}).fill('synthetic keyword');await keywords.getByRole('button',{name:'Save keyword',exact:true}).click();await expect(keywords.getByRole('cell',{name:'synthetic keyword',exact:true})).toBeVisible();
 await expect(technical.getByText('Search Console: not configured; OAuth grant, property access and live metrics not verified.')).toBeVisible();
 await technical.getByRole('textbox',{name:'Supplied SEO metrics JSON'}).fill('{invalid');await technical.getByRole('button',{name:'Analyze supplied metrics',exact:true}).click();await expect(technical.getByRole('alert')).toHaveText('Supply a valid JSON array of metric rows.');
 await technical.getByRole('textbox',{name:'Supplied SEO metrics JSON'}).fill('[{"query":"synthetic","impressions":100,"clicks":5,"position":8}]');await technical.getByRole('button',{name:'Analyze supplied metrics',exact:true}).click();await expect(technical.getByRole('status')).toContainText('Not a live Search Console fetch.');
 fail=true;await keywords.getByRole('button',{name:'Refresh SEO evidence'}).click();await expect(keywords.getByRole('alert')).toHaveText('Synthetic database unavailable');await expect(keywords.getByRole('cell',{name:'synthetic keyword',exact:true})).toHaveCount(0);
 expect(calls.some(call=>call.url.includes('content-generate'))).toBe(false);
 writeFileSync('AUDIT/seo-browser-checks-2026-10-11.json',JSON.stringify({date:new Date().toISOString(),mode:'real SEO components, mocked browser HTTP, no measured ranks/crawl/DB/provider',checks:['empty store shown without invented rows','keyword POST and reload','configuration-only technical evidence','invalid metric JSON rejected','supplied-metric analysis result accurately labeled','503 clears stale rows and exposes failure','no fallback AI request'],requests:calls.length},null,2)+'\n');console.log('SEO browser contract checks PASS');
}finally{await browser.close();}
