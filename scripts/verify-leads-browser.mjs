/** Actual CRM component with in-memory API stub, NOT MySQL or real-role proof. */
import {chromium, expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 const page=await browser.newPage();
 let lead={id:'synthetic-lead',name:'Synthetic browser lead',phone:'',email:'synthetic@example.test',source:'manual',destination:'',status:'new',createdAt:'2026-10-11T00:00:00Z',updatedAt:'2026-10-11T00:00:00Z'};
 let fail=false;let update=true;const mutations=[];
 await page.route('**/api/leads*',route=>route.fulfill({json:{leads:[{id:'registration-1',leadId:'test-only',fullName:'Synthetic registration enquiry',source:'USER_STUDENT_REGISTRATION',status:'NEW',createdAt:lead.createdAt,counselorId:'synthetic-counselor'}]}}));
 await page.route('**/api/crm/leads*',async route=>{
  if(route.request().method()==='PATCH'){
   const payload=route.request().postDataJSON();mutations.push(payload);
   expect(payload.id).toBe(lead.id);expect(payload.expectedUpdatedAt).toBe(lead.updatedAt);
   if(fail)return route.fulfill({status:409,json:{success:false,error:'Synthetic stale version conflict'}});
   lead={...lead,status:payload.status,updatedAt:new Date(Date.parse(lead.updatedAt)+1000).toISOString()};
   return route.fulfill({json:{success:true,data:lead}});
  }
  return route.fulfill({json:{success:true,data:[lead],total:1,totalPages:1,counts:{all:1,[lead.status]:1},sources:['manual'],capabilities:{create:false,update}}});
 });
 await page.goto('http://127.0.0.1:4173/?leads');
 await expect(page.getByText('Synthetic registration enquiry',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Board view',exact:true}).click();
 const stage=page.getByRole('combobox',{name:'Stage for Synthetic browser lead',exact:true});
 await expect(stage).toBeEnabled();
 expect(await stage.locator('option').allTextContents()).not.toContain('converted');
 await stage.selectOption('contacted');await expect(stage).toHaveValue('contacted');await expect(stage).toBeEnabled();
 await page.reload();await page.getByRole('button',{name:'Board view',exact:true}).click();await expect(stage).toHaveValue('contacted');
 fail=true;await stage.selectOption('qualified');await expect(page.getByRole('status').filter({hasText:'Synthetic stale version conflict'})).toBeVisible();await expect(stage).toHaveValue('contacted');
 fail=false;
 const handle=page.getByRole('button',{name:'Move Synthetic browser lead',exact:true});
 const column=page.locator('div.min-w-\\[220px\\]').filter({has:page.locator('span').filter({hasText:/^qualified$/})});
 await column.scrollIntoViewIfNeeded();await handle.scrollIntoViewIfNeeded();
 const from=await handle.boundingBox();const to=await column.boundingBox();
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(from.x+from.width/2+10,from.y+from.height/2,{steps:3});await page.mouse.move(to.x+to.width/2,to.y+90,{steps:12});await page.mouse.up();
 await expect(stage).toHaveValue('qualified');await expect(stage).toBeEnabled();
 await stage.selectOption('lost');await expect(stage).toHaveValue('lost');await expect(stage).toBeDisabled();
 update=false;lead={...lead,status:'new'};await page.reload();await page.getByRole('button',{name:'Board view',exact:true}).click();await expect(stage).toBeDisabled();
 writeFileSync('AUDIT/leads-browser-checks-2026-10-11.json',JSON.stringify({date:new Date().toISOString(),mode:'actual CrmLeadsPage and registration queue; mocked API in browser memory, no DB or authentication',checks:['registration queue rendered fetched fixture','supported stage selector only','PATCH includes optimistic version','updated stage survives reload from mocked server','409 failure preserves stage','pointer drag persists via PATCH','terminal stage locked','missing update capability disables controls'],mutations:mutations.length},null,2)+'\n');
 console.log('Lead browser contract checks PASS');
} finally {await browser.close();}
