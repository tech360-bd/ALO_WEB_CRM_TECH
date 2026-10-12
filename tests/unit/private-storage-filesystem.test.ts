/** Real isolated filesystem, no database/provider or student records. */
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {readPrivateFile,storePrivateFile,removePrivateFile} from '@/lib/storage/private-file-store';
let directory:string;
beforeEach(async()=>{directory=await mkdtemp(path.join(tmpdir(),'alo-private-fixture-'));await mkdir(path.join(directory,'private'));vi.stubEnv('STORAGE_POOL_C',path.join(directory,'private'));});
afterEach(async()=>{vi.unstubAllEnvs();await rm(directory,{recursive:true,force:true});});
it('stores and reads synthetic bytes under a generated identifier',async()=>{const bytes=Buffer.from('test-only');const stored=await storePrivateFile(bytes,'fixture.pdf');expect(await readPrivateFile(stored.storagePath)).toEqual(bytes);await removePrivateFile(stored.storagePath);await expect(readPrivateFile(stored.storagePath)).rejects.toThrow();});
it.each(['../outside.txt','/outside.txt','..%2foutside.txt','nested/file.pdf','nested\\file.pdf'])('rejects path substitution %s',async name=>{await expect(readPrivateFile(name)).rejects.toThrow();});
it('does not follow a symlink to data outside the private root',async()=>{await writeFile(path.join(directory,'outside.txt'),'must not return');await symlink(path.join(directory,'outside.txt'),path.join(directory,'private','link.pdf'));await expect(readPrivateFile('link.pdf')).rejects.toThrow();});
it('rejects a directory object instead of serving it',async()=>{await mkdir(path.join(directory,'private','directory.pdf'));await expect(readPrivateFile('directory.pdf')).rejects.toThrow();});
it('permits an operator-managed alias to a canonical private directory', async()=>{
  const linked=path.join(directory,'linked'); await symlink(path.join(directory,'private'),linked);
  vi.stubEnv('STORAGE_POOL_C',linked);
  const stored=await storePrivateFile(Buffer.from('synthetic'),'fixture.pdf');
  expect(await readPrivateFile(stored.storagePath)).toEqual(Buffer.from('synthetic'));
  await removePrivateFile(stored.storagePath);
});
it('permits an operator-managed ancestor alias outside web roots', async()=>{
  const linked=path.join(directory,'linked'); await symlink(path.join(directory,'private'),linked);
  vi.stubEnv('STORAGE_POOL_C',path.join(linked,'nested'));
  const stored=await storePrivateFile(Buffer.from('synthetic'),'fixture.pdf');
  expect(await readPrivateFile(stored.storagePath)).toEqual(Buffer.from('synthetic'));
});
it('rejects a private-root alias redirected into the actual public directory',async()=>{
  const linked=path.join(directory,'linked');await symlink(path.join(process.cwd(),'public'),linked);
  vi.stubEnv('STORAGE_POOL_C',linked);
  await expect(storePrivateFile(Buffer.from('synthetic'),'fixture.pdf')).rejects.toThrow('web root');
  await expect(readPrivateFile('fixture.pdf')).rejects.toThrow('web root');
  await expect(removePrivateFile('fixture.pdf')).rejects.toThrow('web root');
});
it('rejects a storage root that contains the web root',async()=>{
  vi.stubEnv('STORAGE_POOL_C',process.cwd());
  await expect(storePrivateFile(Buffer.from('synthetic'),'fixture.pdf')).rejects.toThrow('web root');
});
it.each(['public','public_html','.next'])('rejects private storage under web directory %s in every environment',async web=>{
  vi.stubEnv('STORAGE_POOL_C',path.join(process.cwd(),web,'synthetic-only'));
  await expect(storePrivateFile(Buffer.from('synthetic'),'fixture.pdf')).rejects.toThrow('web root');
});
