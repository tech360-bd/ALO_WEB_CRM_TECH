import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
const source = readFileSync('scripts/production-smoke.mjs', 'utf8');
async function run(ready: boolean) {
  const messages: string[] = [];
  const process = { argv: ['node', 'script', 'https://example.invalid'], exitCode: 0 };
  await runInNewContext(`(async()=>{${source}\n})()`, {
    URL, AbortSignal, process,
    console: { log: (...args: unknown[]) => messages.push(args.join(' ')), error: (...args: unknown[]) => messages.push(args.join(' ')) },
    fetch: async (url: URL) => url.pathname === '/api/health' && ready
      ? new Response(JSON.stringify({ status: 'ok', database: { connected: true } }), { headers: { 'Content-Type': 'application/json' } })
      : new Response('Proudly powered by LiteSpeed Web Server', { status: 404 }),
  });
  return { output: messages.join('\n'), exitCode: process.exitCode };
}
describe('production smoke evidence-based diagnosis', () => {
  it('never claims database readiness when health failed and still checks every route', async () => {
    const result = await run(false);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('app/database readiness and the responding origin are NOT VERIFIED');
    expect(result.output).not.toContain('proved the app and database are up');
    expect(result.output).toContain('12/12 anonymous checks failed');
  });
  it('only reports the healthy-app routing diagnosis after actual readiness success', async () => {
    const result = await run(true);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('proved the app and database are up');
    expect(result.output).not.toContain('app/database readiness and the responding origin are NOT VERIFIED');
  });
});
