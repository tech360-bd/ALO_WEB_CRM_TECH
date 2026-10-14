import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const text=p=>readFileSync(p,'utf8');
test('root runtime and lockfile select only Node 22 and npm',()=>{
 const pkg=JSON.parse(text('package.json'));
 assert.equal(pkg.engines.node,'22.x'); assert.equal(pkg.engines.npm,'>=10');
 assert.deepEqual(JSON.parse(text('package-lock.json')).packages[''].engines,pkg.engines);
 assert.equal(text('.nvmrc').trim(),'22');assert.equal(text('.node-version').trim(),'22');
 assert.match(pkg.scripts.build,/^node scripts\/assert-node22.cjs &&/);
 assert.equal(pkg.scripts.start,'NODE_ENV=production node server.js');
});
test('runtime guard rejects unsupported majors and accepts 22',()=>{
 for(const node of ['16.0.0','18.0.0','20.0.0','21.0.0','23.0.0','24.0.0']) assert.throws(()=>vm.runInNewContext(text('scripts/assert-node22.cjs'),{process:{versions:{node}}}),/22.x only/);
 vm.runInNewContext(text('scripts/assert-node22.cjs'),{process:{versions:{node:'22.22.0'}}});
});
test('startup fails closed and invokes only verified standalone with provider port',()=>{
 const source=text('server.js');let loaded=[];
 const env={PORT:'4321'};
 const run=exists=>vm.runInNewContext(source,{__dirname:'/isolated-app',process:{env},require:id=>{
  loaded.push(id);if(id==='node:path')return {join:(...parts)=>parts.join('/')};
  if(id==='node:fs')return {existsSync:()=>exists};
 }});
 assert.throws(()=>run(false),/Missing verified standalone/);
 loaded=[];run(true);assert.ok(loaded.includes('/isolated-app/.next/standalone/server.js'));
 assert.equal(env.PORT,'4321');assert.equal(env.HOSTNAME,'0.0.0.0');assert.equal(env.NODE_ENV,'production');
 assert.doesNotMatch(source,/require\(['"]next['"]\)|pm2|migrate deploy|db push/);
});
test('deployment validator and development launcher use the current contract',()=>{
 const validator=text('scripts/validate-deployment-config.mjs');
 assert.match(validator,/tests\/runtime-standard.test.mjs/);
 assert.doesNotMatch(validator,/\/root\/|3044|ecosystem|nginx/);
 const dev=text('.zscripts/dev.sh');
 assert.match(dev,/node scripts\/assert-node22.cjs/);
 assert.match(dev,/exec npm run dev/);
 assert.doesNotMatch(dev,/bun|yarn|pnpm/);
 assert.match(text('public_html/.htaccess'),/^# LEGACY \/ NOT USED FOR CURRENT PRODUCTION/);
 assert.ok(text('public_html/.htaccess').split('\n').every(l=>!l.trim()||l.startsWith('#')));
});
test('legacy installers and packagers cannot be mistaken for Hostinger paths',()=>{
 const php=text('install-check.php');
 assert.ok(php.indexOf("exit('Legacy installer disabled.")<php.indexOf("define('BASE_PATH'"));
 for (const path of ['scripts/build-delivery-packages-portable.sh','scripts/build-delivery-packages.sh']) {
  const source=text(path);
  assert.match(source,/^#![^\n]+\n# LEGACY \/ NOT USED FOR CURRENT PRODUCTION\necho .*\nexit 1\n/);
 }
 assert.match(text('HOSTINGER-DEPLOYMENT-GUIDE.md'),/Hostinger \+ Node.js 22.x \+ npm/);
 assert.doesNotMatch(text('HOSTINGER-DEPLOYMENT-GUIDE.md'),/Node >=22|CPANEL_USERNAME|\/root\//);
});
