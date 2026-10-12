import { afterEach, beforeEach, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { assertNoPublicUploads } from '../../scripts/lib/public-upload-guard.mjs';
let root;
beforeEach(()=>{root=mkdtempSync(path.join(tmpdir(),'alo-package-fixture-'));});
afterEach(()=>rmSync(root,{recursive:true,force:true}));
it('accepts curated public assets without uploads',()=>{
  mkdirSync(path.join(root,'images'));writeFileSync(path.join(root,'images','synthetic.txt'),'synthetic');
  expect(()=>assertNoPublicUploads(root)).not.toThrow();
});
it.each(['uploads','Uploads','public/uploads','public/public/uploads'])('blocks %s without reading, moving or deleting bytes',relative=>{
  const dir=path.join(root,relative);mkdirSync(dir,{recursive:true});const file=path.join(dir,'synthetic.txt');writeFileSync(file,'synthetic');
  expect(()=>assertNoPublicUploads(root)).toThrow('packaging blocked');expect(existsSync(file)).toBe(true);
});
it('blocks an empty uploads directory rather than silently blessing it',()=>{
  mkdirSync(path.join(root,'uploads'));expect(()=>assertNoPublicUploads(root)).toThrow('packaging blocked');
});
it('rejects asset symlinks that could alias private storage',()=>{
  symlinkSync(path.join(root,'not-followed'),path.join(root,'alias'));
  expect(()=>assertNoPublicUploads(root)).toThrow('packaging blocked');
});
it('accepts a not-yet-created public target',()=>{expect(()=>assertNoPublicUploads(path.join(root,'missing'))).not.toThrow();});
