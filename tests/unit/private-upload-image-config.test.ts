import { expect, it } from 'vitest';
import { hasLocalMatch } from 'next/dist/shared/lib/match-local-pattern';
import { hasRemoteMatch } from 'next/dist/shared/lib/match-remote-pattern';
import config from '../../next.config';
it.each(['/uploads/fixture.png','/public/uploads/fixture.png','/public/public/uploads/fixture.png','/private/fixture.png'])('optimizer config independently rejects %s',url=>{
  expect(hasLocalMatch(config.images?.localPatterns,url)).toBe(false);
});
it.each(['/images/synthetic.png','/icons/synthetic.png','/public/images/synthetic.png'])('optimizer config retains curated path %s',url=>{
  expect(hasLocalMatch(config.images?.localPatterns,url)).toBe(true);
});
it('does not allow optimizer fetching absolute URLs from own domain or arbitrary host',()=>{
  for(const host of ['aloeducation.com','synthetic.e2b.app','localhost']) {
    expect(hasRemoteMatch([],config.images?.remotePatterns||[],new URL(`https://${host}/uploads/synthetic.png`))).toBe(false);
  }
});
