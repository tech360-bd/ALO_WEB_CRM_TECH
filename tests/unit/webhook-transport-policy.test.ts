import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
const resolver=vi.hoisted(()=>vi.fn());
vi.mock('node:dns/promises',()=>({lookup:resolver}));
import { resolveWebhookTarget, secureWebhookFetch } from '@/lib/webhooks/transport';
beforeEach(()=>{vi.stubEnv('WEBHOOK_PRIVATE_HOST_ALLOWLIST','');vi.stubEnv('NODE_ENV','test');resolver.mockReset();});
afterEach(()=>vi.unstubAllEnvs());
describe('webhook egress target policy',()=>{
 it.each(['http://127.0.0.1/hook','https://169.254.169.254/latest','https://[::1]/hook','https://[::ffff:127.0.0.1]/hook'])('rejects private and metadata literal target %s',async url=>{await expect(resolveWebhookTarget(url)).rejects.toThrow('WEBHOOK_PRIVATE_TARGET_REJECTED');});
 it('rejects a public-looking hostname resolving to any private address',async()=>{resolver.mockResolvedValue([{address:'93.184.216.34',family:4},{address:'10.0.0.2',family:4}]);await expect(resolveWebhookTarget('https://hooks.provider.test/alo')).rejects.toThrow('WEBHOOK_PRIVATE_TARGET_REJECTED');});
 it('returns the checked public address for connection pinning',async()=>{resolver.mockResolvedValue([{address:'93.184.216.34',family:4}]);const target=await resolveWebhookTarget('https://hooks.provider.test/alo');expect(target.address).toEqual({address:'93.184.216.34',family:4});expect(resolver).toHaveBeenCalledTimes(1);});
 it('rejects embedded credentials and insecure production URLs',async()=>{await expect(resolveWebhookTarget('https://dummy-user:dummy-password@hooks.provider.test')).rejects.toThrow('WEBHOOK_TARGET_REJECTED');vi.stubEnv('NODE_ENV','production');await expect(resolveWebhookTarget('http://hooks.provider.test')).rejects.toThrow('WEBHOOK_HTTPS_REQUIRED');});
 it('uses an exact server-side private host allowlist, never a wildcard',async()=>{vi.stubEnv('WEBHOOK_PRIVATE_HOST_ALLOWLIST','*');await expect(resolveWebhookTarget('http://127.0.0.1/hook')).rejects.toThrow();vi.stubEnv('WEBHOOK_PRIVATE_HOST_ALLOWLIST','127.0.0.1');expect((await resolveWebhookTarget('http://127.0.0.1/hook')).address.address).toBe('127.0.0.1');});
 it('sends a real local diagnostic request and does not follow redirects',async()=>{
  vi.stubEnv('WEBHOOK_PRIVATE_HOST_ALLOWLIST','127.0.0.1');let hits=0;let received='';
  const server=createServer((request,response)=>{hits++;request.on('data',chunk=>{received+=chunk;});request.on('end',()=>{response.writeHead(302,{Location:'/must-not-follow'});response.end('redirect refused');});});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const address=server.address();if(!address||typeof address==='string')throw new Error('Test server unavailable');const result=await secureWebhookFetch(`http://127.0.0.1:${address.port}/hook`,{headers:{'content-type':'application/json'},body:'{"diagnostic":true}',signal:AbortSignal.timeout(3000)});expect(result.status).toBe(302);expect(await result.text()).toBe('redirect refused');expect(hits).toBe(1);expect(received).toBe('{"diagnostic":true}');}finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
 });
});
