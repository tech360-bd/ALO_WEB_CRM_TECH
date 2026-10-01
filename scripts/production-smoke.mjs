// Read-only anonymous checks. Authenticated role/isolation checks are separate.
const origin = new URL(process.argv[2] || 'https://aloeducation.com');
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error('A credential-free HTTPS origin is required');
}
async function request(path) {
  try {
    return await fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(25000), headers: { 'Cache-Control': 'no-cache' } });
  } catch {
    throw new Error(`HTTPS request failed: ${path} (network/TLS/timeout; response not verified)`);
  }
}
try {
  const health = await request('/api/health');
  if (health.status !== 200 || !health.headers.get('content-type')?.includes('application/json')) throw new Error('Readiness HTTP/JSON check failed');
  const data = await health.json();
  if (data.status !== 'ok' || data.database?.connected !== true) throw new Error('Readiness database check failed');
  console.log('PASS /api/health (database readiness)');
  for (const path of ['/', '/destinations', '/universities', '/course-finder', '/student/login', '/partner/login', '/employee/login']) {
    const res = await request(path);
    if (res.status !== 200 || !res.headers.get('content-type')?.includes('text/html')) throw new Error(`Public page check failed: ${path} HTTP ${res.status}`);
    const html = await res.text();
    if (!/<html[\s>]/i.test(html) || !/ALO/i.test(html)) throw new Error(`Public page identity check failed: ${path}`);
    console.log(`PASS ${path} (HTML/brand only; not interactive verification)`);
  }
  for (const path of ['/api/workforce/metrics', '/api/workforce/approval', '/api/finance', '/api/hr']) {
    const res = await request(path);
    if (![401, 403].includes(res.status)) throw new Error(`Anonymous API access not denied: ${path} HTTP ${res.status}`);
    console.log(`PASS ${path} (anonymous denied)`);
  }
  console.log('Authenticated login, logout, RBAC, object isolation and CRUD remain NOT VERIFIED by this anonymous check.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Smoke test failed');
  process.exitCode = 1;
}
