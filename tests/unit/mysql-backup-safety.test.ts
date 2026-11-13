import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
let root: string;
let backup: string;
let env: NodeJS.ProcessEnv;
const script = resolve('scripts/backup-mysql.sh');
beforeEach(() => {
 root = mkdtempSync(join(tmpdir(),'alo-backup-test-')); backup = join(root,'private'); const bin = join(root,'bin'); mkdirSync(bin);
 writeFileSync(join(bin,'mysqldump'), `#!/usr/bin/env bash\nprintf '%s\\n' "$@" > "$BACKUP_TEST_ARGV"\nstat -c '%a' "\${1#--defaults-extra-file=}" > "$BACKUP_TEST_MODE"\nif [ "$BACKUP_TEST_RESULT" = empty ]; then exit 0; fi\nprintf '%s\\n' '-- isolated fixture only' 'CREATE TABLE fixture (id INT);'\nif [ "$BACKUP_TEST_RESULT" = fail ]; then exit 9; fi\n`,{mode:0o700});
 env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, BACKUP_DIR: backup, DATABASE_URL: 'mysql://dummy-user:dummy-backup-password@db.invalid:3307/isolated_backup', BACKUP_TEST_ARGV: join(root,'argv'), BACKUP_TEST_MODE: join(root,'mode'), BACKUP_TEST_RESULT: 'ok' };
});
afterEach(() => rmSync(root,{recursive:true,force:true}));
const run = () => spawnSync('bash',[script],{env,encoding:'utf8'});
describe('private MySQL backup failure and credential controls', () => {
 it('rejects missing configuration instead of silently selecting a production database', () => { delete env.DATABASE_URL; delete env.DB_DATABASE; delete env.DB_NAME; delete env.DB_USERNAME; delete env.DB_USER; const result=run(); expect(result.status).not.toBe(0); expect(result.stdout).not.toContain('Created gzip-verified'); expect(readdirSync(backup)).toEqual([]); });
 it('fails when mysqldump fails even though gzip successfully writes an archive', () => { env.BACKUP_TEST_RESULT='fail'; const result=run(); expect(result.status).not.toBe(0); expect(result.stdout).not.toContain('Created gzip-verified'); expect(readdirSync(backup)).toEqual([]); });
 it('rejects an empty SQL stream', () => { env.BACKUP_TEST_RESULT='empty'; const result=run(); expect(result.status).not.toBe(0); expect(readdirSync(backup)).toEqual([]); });
 it('creates a nonempty gzip and checksum with private modes and no password in argv', () => {
  const result=run(); expect(result.status).toBe(0); const files=readdirSync(backup); expect(files).toHaveLength(2);
  const archive=files.find(name=>name.endsWith('.sql.gz'))!; const path=join(backup,archive);
  expect(gunzipSync(readFileSync(path)).toString()).toContain('CREATE TABLE fixture');
  expect(spawnSync('sha256sum',['--check',path+'.sha256'],{encoding:'utf8'}).status).toBe(0);
  expect(statSync(path).mode & 0o777).toBe(0o600); expect(statSync(backup).mode & 0o777).toBe(0o700); expect(readFileSync(join(root,'mode'),'utf8').trim()).toBe('600');
  const argv=readFileSync(join(root,'argv'),'utf8'); expect(argv).not.toContain('dummy-backup-password'); expect(argv.split('\n')[0]).toMatch(/^--defaults-extra-file=/); expect(argv).toContain('isolated_backup');
  expect(result.stdout+result.stderr).not.toContain('dummy-backup-password'); expect(result.stdout).toContain('restoration has not been tested'); expect(files.some(name=>/partial|mysql-client/.test(name))).toBe(false);
 });
 it('does not overwrite an existing backup across repeated runs', () => { expect(run().status).toBe(0); expect(run().status).toBe(0); expect(readdirSync(backup).filter(name=>name.endsWith('.sql.gz'))).toHaveLength(2); });
});
