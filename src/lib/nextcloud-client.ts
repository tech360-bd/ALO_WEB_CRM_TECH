// ============================================================
// Nextcloud — ☁️ safe home for all your data (36.8k★ 90501 commits)
//   Nextcloud server: WebDAV, sharing, OCM, file sync, office badges,
//   safe home for data — apps/files, lib Filesystem.
// ALO use: counselor ↔ student file hub — share offer letters, CAS docs,
//   financial proof checklists via WebDAV; OCM sharing for partner docs.
// Reuses: FileMetadata + FileEvent + StudentDocument + CrmAuditLog
// Env: NEXTCLOUD_URL, NEXTCLOUD_USERNAME, NEXTCLOUD_PASSWORD (or NEXTCLOUD_APP_TOKEN)
// ============================================================

const NC_URL = process.env.NEXTCLOUD_URL || '';
const NC_USER = process.env.NEXTCLOUD_USERNAME || process.env.NEXTCLOUD_USER || '';
const NC_PASS = process.env.NEXTCLOUD_PASSWORD || process.env.NEXTCLOUD_APP_TOKEN || process.env.NEXTCLOUD_APP_PASSWORD || '';

function ncHeaders(extra?: Record<string,string>): Record<string,string> {
  const auth = Buffer.from(`${NC_USER}:${NC_PASS}`).toString('base64');
  return { Authorization: `Basic ${auth}`, 'OCS-APIRequest': 'true', ...(extra||{}) };
}

function webdavBase(): string {
  return `${NC_URL.replace(/\/$/, '')}/remote.php/dav/files/${encodeURIComponent(NC_USER)}`;
}

/**
 * Upload a file to Nextcloud WebDAV.
 * Returns WebDAV path + share URL base. Caller persists FileMetadata separately.
 */
export async function nextcloudUpload(remotePath: string, content: Buffer, contentType = 'application/octet-stream'): Promise<{ path: string; status: number }> {
  if (!NC_URL || !NC_USER || !NC_PASS) throw new Error('NEXTCLOUD_URL/USERNAME/PASSWORD not configured');
  const safePath = remotePath.replace(/^\/+/, '');
  const url = `${webdavBase()}/${safePath.split('/').map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, { method: 'PUT', headers: ncHeaders({ 'Content-Type': contentType, 'Content-Length': String(content.length) }), body: content as any });
  if (!res.ok && res.status !== 201 && res.status !== 204) {
    const t = await res.text().catch(()=> '');
    throw new Error(`Nextcloud PUT ${res.status}: ${t.slice(0, 400)}`);
  }
  return { path: safePath, status: res.status };
}

export async function nextcloudDownload(remotePath: string): Promise<Buffer> {
  if (!NC_URL || !NC_USER || !NC_PASS) throw new Error('NEXTCLOUD_URL not configured');
  const url = `${webdavBase()}/${remotePath.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, { method: 'GET', headers: ncHeaders() });
  if (!res.ok) throw new Error(`Nextcloud GET ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

export async function nextcloudList(remoteDir = ''): Promise<{ name: string; href: string; isDir: boolean; size?: number; modified?: string }[]> {
  if (!NC_URL || !NC_USER || !NC_PASS) throw new Error('NEXTCLOUD_URL not configured');
  const url = `${webdavBase()}/${remoteDir.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, { method: 'PROPFIND', headers: ncHeaders({ Depth: '1', 'Content-Type': 'application/xml' }), body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/><d:getcontentlength/><d:getlastmodified/><d:resourcetype/></d:prop></d:propfind>` });
  const xml = await res.text().catch(()=> '');
  // Minimal parse: extract href + displayname
  const items: any[] = [];
  const re = /<d:href>([^<]+)<\/d:href>[\s\S]*?<d:displayname>([^<]*)<\/d:displayname>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    items.push({ href: decodeURIComponent(m[1]), name: m[2], isDir: /<d:collection\/>/.test(m[0]) });
  }
  return items;
}

/**
 * Create a public share link via OCS Share API (like Nextcloud sharing: Init)
 */
export async function nextcloudCreateShare(remotePath: string, opts?: { password?: string; expireDate?: string; permissions?: number }): Promise<{ shareUrl: string; token: string }> {
  if (!NC_URL || !NC_USER || !NC_PASS) throw new Error('NEXTCLOUD_URL not configured');
  const body = new URLSearchParams({
    path: `/${remotePath.replace(/^\/+/, '')}`,
    shareType: '3', // public link
    permissions: String(opts?.permissions ?? 1), // 1 = read
    ...(opts?.password ? { password: opts.password } : {}),
    ...(opts?.expireDate ? { expireDate: opts.expireDate } : {}),
  });
  const res = await fetch(`${NC_URL.replace(/\/$/, '')}/ocs/v2.php/apps/files_sharing/api/v1/shares`, {
    method: 'POST',
    headers: ncHeaders({ 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'OCS-APIRequest': 'true' }),
    body: body.toString(),
  });
  const json: any = await res.json().catch(async ()=> ({ ocs: { data: { url: `${NC_URL}/s/${encodeURIComponent(remotePath)}`, token: 'fallback' } } }));
  const data = json.ocs?.data || json.data || json;
  return { shareUrl: data.url || `${NC_URL}/s/${data.token || ''}`, token: data.token || '' };
}

export async function nextcloudHealth(): Promise<{ configured: boolean; reachable: boolean; version?: string }> {
  if (!NC_URL) return { configured: false, reachable: false };
  try {
    const r = await fetch(`${NC_URL.replace(/\/$/, '')}/status.php`, { headers: { Accept: 'application/json' } });
    const j: any = await r.json().catch(()=>null);
    return { configured: true, reachable: r.ok, version: j?.version };
  } catch { return { configured: true, reachable: false }; }
}
