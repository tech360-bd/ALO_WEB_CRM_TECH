/** Browser controls against actual components with synthetic data only. */
import { chromium, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox','--disable-dev-shm-usage'] });
try {
 const context = await browser.newContext({ acceptDownloads: true, permissions: ['clipboard-read','clipboard-write'] });
 const page = await context.newPage();
 await page.goto('http://127.0.0.1:4173/?modules');
 const studio = page.getByRole('region',{ name:'Diagram Studio' });
 const dir = '_reference_repos/ui-verification/module-results'; mkdirSync(dir,{recursive:true});
 const checks=[];
 for (const type of ['process','journey','flow','timeline','funnel']) {
  await studio.getByRole('combobox',{ name:'Diagram type' }).selectOption(type);
  if(type==='funnel') {
   await expect(studio.getByRole('button',{name:'Download SVG',exact:true})).toBeDisabled();
   await studio.getByRole('textbox',{name:'Funnel data'}).fill('Synthetic enquiries,10\nSynthetic consultations,4\nSynthetic enrolments,1');
  }
  for(const format of ['SVG','PNG']) {
   const pending=page.waitForEvent('download'); await studio.getByRole('button',{name:`Download ${format}`,exact:true}).click(); const file=await pending;
   const path=`${dir}/${type}.${format.toLowerCase()}`;await file.saveAs(path);
   const content=readFileSync(path);
   if(format==='SVG') { expect(content.toString()).toContain('<svg');expect(content.toString()).toContain('font-size'); }
   else expect(content.subarray(1,4).toString()).toBe('PNG');
  }
  await studio.getByRole('button',{name:'Copy SVG',exact:true}).click();
  await expect(studio.getByRole('status')).toHaveText('SVG markup copied.');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('<svg');
  checks.push(`${type}: rendered, SVG and PNG files downloaded, SVG clipboard readback verified`);
 }
 const library=page.getByRole('region',{name:'Marketing library'});
 const pending=page.waitForEvent('download');await library.getByRole('button',{name:'Download the full marketing library as Markdown'}).click();const file=await pending;await file.saveAs(`${dir}/library.md`);
 expect(readFileSync(`${dir}/library.md`,'utf8').length).toBeGreaterThan(1000);
 const copy=library.getByRole('button',{name:/Copy .* campaign kit/}).first();await copy.click();
 expect((await page.evaluate(()=>navigator.clipboard.readText())).length).toBeGreaterThan(50);
 checks.push('Marketing library Markdown download and selected campaign clipboard readback');
 await library.getByRole('textbox',{name:'Headline',exact:true}).fill('Synthetic edited campaign');
 const svgPending=page.waitForEvent('download');await library.getByRole('button',{name:'SVG',exact:true}).click();const edited=await svgPending;await edited.saveAs(`${dir}/edited.svg`);
 expect(readFileSync(`${dir}/edited.svg`,'utf8')).toContain('Synthetic edited campaign');
 checks.push('Campaign headline editing persists into downloaded SVG');
 writeFileSync('AUDIT/module-browser-checks-2026-10-11.json',JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),mode:'isolated real component browser tests; synthetic fixture; not authenticated application or DB/provider tests',checks,artifacts:dir},null,2)+'\n');
 console.log('Module browser exports PASS',checks.length);
} finally { await browser.close(); }
