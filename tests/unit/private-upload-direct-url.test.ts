/** Requests are synthetic; these are real proxy calls, not deployed HTTP proof. */
import { expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
vi.mock('next-auth/jwt',()=>({ getToken: vi.fn() }));
import proxy, { config } from '@/proxy';
it.each(['/_next/static/..%2F..%2Fuploads/synthetic.pdf','/favicon.ico%2F..%2Fuploads%2Fsynthetic.pdf','/uploads','/UPLOADS/synthetic.pdf','/%75ploads/synthetic.pdf','/%2575ploads/synthetic.pdf','/uploads%2Fsynthetic.pdf','/uploads%5Csynthetic.pdf','/a/%2e%2e/uploads/synthetic.pdf','/%E0%A4%A','/_next/image?url=%2Fuploads%2Fsynthetic.png&w=64&q=75','/_next/image?url=https%3A%2F%2Fself.invalid%2Fuploads%2Fsynthetic.png&w=64&q=75','/_next/image?url=%2Fok.png&url=%2Fuploads%2Fsynthetic.png&w=64&q=75','/uploads/synthetic.pdf','/uploads/synthetic.jpg','/uploads/nested/fixture.png','/public/uploads/fixture.pdf','/public/public/uploads/fixture.jpg'])('matcher includes and proxy denies direct URL %s',async pathname=>{
  expect(unstable_doesMiddlewareMatch({config,nextConfig:{},url:`https://synthetic.invalid${pathname}`})).toBe(true);
  for (const method of ['GET','HEAD']) {
    const response=await proxy(new NextRequest(`https://synthetic.invalid${pathname}`,{method}));
    expect(response.status).toBe(403);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(await response.text()).toBe('');
  }
});
it('does not deny a curated public image outside uploads',async()=>{
  expect((await proxy(new NextRequest('https://synthetic.invalid/images/fixture.jpg'))).status).toBe(200);
});
