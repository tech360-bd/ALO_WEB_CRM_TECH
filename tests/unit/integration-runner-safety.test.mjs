import {expect,it} from 'vitest';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {isolatedDatabaseEnvironment} from '../../scripts/lib/test-database-safety.mjs';
const safe={TEST_DATABASE_URL:'mysql://127.0.0.1/alo_test_unit',DATABASE_URL:'mysql://127.0.0.1/alo_app_unit',ALLOW_DISPOSABLE_DATABASE_TESTS:'1'};
it.each([
 {...safe,TEST_DATABASE_URL:undefined},
 {...safe,TEST_DATABASE_URL:'mysql://remote.invalid/alo_test_unit'},
 {...safe,TEST_DATABASE_URL:'mysql://127.0.0.1/live'},
 {...safe,TEST_DATABASE_URL:'mysql://127.0.0.1/alo_test_unit?socket=/private.sock'},
 {...safe,DATABASE_URL:safe.TEST_DATABASE_URL},
 {...safe,ALLOW_DISPOSABLE_DATABASE_TESTS:undefined},
 {...safe,NODE_ENV:'production'},
 {...safe,ALO_DB_DRIVER:'sqlite'},
 {...safe,DATABASE_URL:'invalid-private-credential'},
])('rejects unsafe configuration before test process/database initialization %#',env=>{
 expect(()=>isolatedDatabaseEnvironment(env)).toThrow();
 const child=spawnSync(process.execPath,['scripts/run-integration-tests.mjs'],{env:{PATH:process.env.PATH,...env},encoding:'utf8'});
 expect(child.status).toBe(1);expect(child.stdout).not.toContain('RUN');expect(child.stderr).not.toContain('mysql://');expect(child.stderr).not.toContain('invalid-private-credential');
});
it('maps only validated disposable target and retains original schema, including setup re-entry',()=>{
 const mapped=isolatedDatabaseEnvironment(safe);expect(mapped.DATABASE_URL).toBe(safe.TEST_DATABASE_URL);expect(mapped.ALO_APPLICATION_DATABASE_SCHEMA).toBe('alo_app_unit');expect(isolatedDatabaseEnvironment(mapped)).toEqual(mapped);
});
it('consultation suite no longer relies on generic DATABASE_URL or table-wide deletes',()=>{
 const source=readFileSync('tests/integration/consultation-workflow.test.ts','utf8');expect(source).toContain('const databaseUrl = testDatabaseUrl()');expect(source).not.toMatch(/deleteMany\(\{\s*\}\)/);expect(source).not.toContain('new PrismaClient()');
});
