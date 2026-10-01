// Dependency-free static policy + isolated executable boundary tests. No network,
// host commands or real production branch checkout. Run even if npm/Prisma fails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const text = p => readFileSync(p, 'utf8');
const ci = text('.github/workflows/ci.yml');
const noticeFiles = ['.github/workflows/deploy-production.yml', '.github/workflows/deploy-recovery.yml'];
const predicate = "github.ref == 'refs/heads/main' && github.event_name == 'workflow_dispatch'";
const manifests = JSON.parse(text('docs/deployment-ownership/quarantined-entrypoints.json'));
test('1: Arena pushes and PRs can run CI, which includes safety tests', () => {
  assert.match(ci, /on:\n  push:\n    branches:\n      - main\n      - development\n      - 'arena\/\*\*'\n  pull_request:/);
  assert.ok(ci.includes('node --test tests/deployment-ownership.test.mjs'));
  for (const command of ['npm ci', 'npx prisma validate', 'npx prisma generate', 'npm run lint', 'npm run typecheck', 'npm test', 'npm run build']) assert.ok(ci.includes(command));
});
for (const [label, ref, event, allowed] of [
  ['2: Arena', 'refs/heads/arena/01a0f2b5-alo-education-z-ai', 'workflow_dispatch', false],
  ['3: feature', 'refs/heads/feature/test', 'workflow_dispatch', false],
  ['4: PR', 'refs/pull/19/merge', 'pull_request', false],
  ['4b: PR even with main ref', 'refs/heads/main', 'pull_request', false],
  ['5: main explicit action (refusal notice ONLY)', 'refs/heads/main', 'workflow_dispatch', true],
  ['8: main push cannot select a deployment job', 'refs/heads/main', 'push', false],
  ['8b: development', 'refs/heads/development', 'workflow_dispatch', false],
]) test(label, () => {
  for (const file of noticeFiles) {
    const workflow = text(file);
    assert.ok(workflow.includes(`if: ${predicate}`));
    assert.match(workflow, /on:\n  workflow_dispatch:\npermissions:/);
    assert.equal(ref === 'refs/heads/main' && event === 'workflow_dispatch', allowed);
    // Main eligibility is NOT permission to deploy; the only step refuses.
    assert.match(workflow, /run: \|\n          echo "BLOCKED:.*\n          exit 1\n$/);
    assert.ok(!workflow.includes('environment:'));
  }
});
test('6: every legacy shell boundary refuses all branches BEFORE old overrides/commands', () => {
  const dir = mkdtempSync(join(tmpdir(), 'alo-deployment-guard-'));
  try {
    // git is the only executable available through PATH. Any attempted host
    // side effect would fail; wrappers must exit before reaching any such call.
    writeFileSync(join(dir,'dirname'), '#!/bin/sh\nprintf ".\\n"\n', { mode: 0o700 });
    writeFileSync(join(dir,'git'), '#!/bin/sh\nprintf "%s\\n" "$TEST_BRANCH"\n', { mode: 0o700 });
    for (const entry of manifests.filter(e => e.file.endsWith('.sh'))) {
      const source=text(entry.file);
      assert.match(source, /^#![^\n]+\n# DEPLOYMENT OWNERSHIP QUARANTINE/);
      assert.ok(source.indexOf('exit 1\n# Historical implementation') > 0);
      for (const branch of ['arena/01a0f2b5-alo-education-z-ai','feature/example','development','','main']) {
        const result=spawnSync('/bin/bash',[resolve(entry.file)], { encoding:'utf8', timeout:3000, env:{PATH:dir,TEST_BRANCH:branch,I_UNDERSTAND_THIS_SCRIPT_IS_DEPRECATED_AND_UNSAFE:'yes',GITHUB_REF:'refs/heads/main'} });
        assert.equal(result.status,1,entry.file);
        assert.match(result.stderr,branch==='main'?/DISABLED: legacy/:/BLOCKED: production operations/);
      }
    }
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
test('7: Actions contain only approved CI/diagnostic commands, never active deployment transport', () => {
  assert.deepEqual(readdirSync('.github/workflows').sort(),['ci.yml','deploy-production.yml','deploy-recovery.yml','health-monitor.yml']);
  // The ONLY sanctioned exception to the "no migration execution in Actions"
  // rule: lines explicitly marked as targeting the disposable, localhost-only
  // CI database (the mysql-integration job's throwaway MySQL 8.4 service).
  // Such lines must themselves be migration/verification commands, the file
  // must declare the mysql:8.4 service, and no non-localhost DSN may appear.
  // Production migration remains a human-owned operation outside Actions.
  const EPHEMERAL_MARK = '# ci-ephemeral-db-only: disposable localhost CI database — never production';
  for (const file of readdirSync('.github/workflows')) {
    const source=text(`.github/workflows/${file}`);
    const marked=source.split('\n').filter(l=>l.includes(EPHEMERAL_MARK));
    assert.ok(marked.every(l=>/prisma migrate (deploy|status|diff)|mysql -h 127\.0\.0\.1/.test(l)), `${file}: marked lines must be prisma-migrate/mysql-CLI commands`);
    if (marked.length>0) {
      assert.match(source, /image: mysql:8\.4/, 'ephemeral-db commands require the disposable mysql service');
      const activeForDSN=source.split('\n').filter(l=>!l.trim().startsWith('#')).join('\n');
      assert.doesNotMatch(activeForDSN, /mysql:\/\/[^@/\n]*@(?!127\.0\.0\.1|localhost)[^/\n]+\//, 'no non-localhost database DSNs allowed');
    }
    const active=source.split('\n').filter(l=>!l.trim().startsWith('#') && !l.includes(EPHEMERAL_MARK)).join('\n');
    assert.doesNotMatch(active, /secrets\.|secrets: inherit|environment:|pull_request_target:|workflow_run:|contents: write|id-token: write|self-hosted/);
    assert.doesNotMatch(active, /(?:^|\s)(?:ssh|scp|sftp|lftp|rsync|pm2|systemctl)\s|api\.hostinger|appleboy\/|FTP-Deploy|prisma (?:migrate deploy|db push|db seed)|scripts\/(?:deploy|rollback|restart)\.sh/m);
    const actions=[...active.matchAll(/uses:\s*(\S+)/g)].map(m=>m[1]);
    assert.ok(actions.every(a=>/^actions\/(checkout|setup-node)@[0-9a-f]{40}$/.test(a)));
  }
  const pkg=JSON.parse(text('package.json'));
  assert.ok(!['preinstall','install','postinstall','prebuild','postbuild','pretest','posttest','deploy'].some(k=>k in pkg.scripts));
  assert.doesNotMatch(pkg.scripts.build, /deploy|ssh|ftp|rsync|migrate|db push/);
});
test('8: direct alternate runtime boundaries disabled; container does not migrate at startup', () => {
  for (const entry of manifests.filter(e=>e.file.endsWith('.cjs'))) {
    assert.match(text(entry.file), /^throw new Error\('DISABLED:/);
    const res=spawnSync(process.execPath,[resolve(entry.file)],{encoding:'utf8'});
    assert.equal(res.status,1); assert.match(res.stderr,/DISABLED: legacy PM2/);
  }
  const docker=text('Dockerfile');
  assert.match(docker,/CMD .*DISABLED: legacy production container/);
  assert.doesNotMatch(docker,/^CMD .*prisma/m);
});
