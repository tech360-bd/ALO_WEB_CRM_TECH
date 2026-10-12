import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-webgl', '--font-render-hinting=none', '--disable-features=FontationsFontBackend', '--use-gl=angle', '--use-angle=swiftshader', '--no-zygote'] });
const dir=process.env.REFERENCE_ARTIFACT_DIR || '_reference_repos/ui-verification/results';mkdirSync(dir,{recursive:true});
const context=await browser.newContext({acceptDownloads:true}); const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(process.env.REFERENCE_COMPONENT_URL || 'http://127.0.0.1:4173');
await expect(page.getByRole('textbox',{name:'Headline',exact:true})).toBeVisible();
await expect(page.locator('figure img')).toBeVisible();
for (const format of ['square','portrait','story','landscape']) {
 await page.getByRole('combobox',{name:'Format',exact:true}).selectOption(format);
 await expect(page.locator('figure img')).toBeVisible();
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'SVG',exact:true}).click();const download=await pending;await download.saveAs(`${dir}/${format}.svg`);
 expect(readFileSync(`${dir}/${format}.svg`,'utf8')).toContain('DRAFT · HUMAN REVIEW REQUIRED');
}
await page.getByRole('combobox',{name:'Format',exact:true}).selectOption('square');
const pending=page.waitForEvent('download');await page.getByRole('button',{name:'PNG',exact:true}).click();const png=await pending;await png.saveAs(`${dir}/square.png`);expect(readFileSync(`${dir}/square.png`).subarray(1,4).toString()).toBe('PNG');
await page.getByRole('textbox',{name:'Verified destination URL (optional for draft)',exact:true}).fill('javascript:alert(1)');await expect(page.getByRole('button',{name:'SVG',exact:true})).toBeDisabled();
await page.getByRole('button',{name:'Reset draft'}).click();
const stage=page.getByRole('combobox',{name:'Stage for Synthetic application — not a real student',exact:true});
await stage.selectOption('DOCUMENTS_PENDING');await expect(stage).toHaveValue('DOCUMENTS_PENDING');
await stage.selectOption('SUCCESS');await expect(page.getByRole('status').filter({hasText:'Synthetic forbidden transition'})).toBeVisible();await expect(stage).toHaveValue('DOCUMENTS_PENDING');
const screenshots=[];
for (const width of [1440,768,390]) {await page.setViewportSize({width,height:900});await page.screenshot({path:`${dir}/ui-${width}.png`,fullPage:true});screenshots.push(`ui-${width}.png`);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
const unique=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length});expect(unique).toBe(true);expect(errors).toEqual([]);
const writeEvidence=async()=>writeFileSync('AUDIT/supplied-reference-ui-verification-2026-10-10.json',JSON.stringify({date:new Date().toISOString(),mode:'isolated browser component harness; synthetic fixtures; no Next.js authentication/database/provider verification',browser:await browser.version(),checks:['four SVG formats downloaded with draft watermark','real canvas PNG downloaded','unsafe destination disables export','stage selector persistence callback success','failed stage persistence preserves previous stage','pointer drag into an empty registered column invokes persistence callback','mobile/tablet/desktop document has no horizontal overflow','all rendered IDs unique','zero uncaught browser page errors'],screenshots,artifactLocation:dir},null,2)+'\n');
await page.setViewportSize({width:1440,height:900});
const handle=page.getByRole('button',{name:'Move Synthetic application — not a real student',exact:true});
const target=page.locator('div.min-w-\\[220px\\]').filter({has:page.locator('span').filter({hasText:/^READY TO SUBMIT$/})});
await handle.scrollIntoViewIfNeeded();
const from=await handle.boundingBox();const to=await target.boundingBox();
await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(from.x+from.width/2+10,from.y+from.height/2,{steps:3});await page.mouse.move(to.x+to.width/2,to.y+100,{steps:12});await page.mouse.up();
await expect(stage).toHaveValue('READY_TO_SUBMIT');
await writeEvidence();await browser.close();console.log('Browser component checks PASS');
