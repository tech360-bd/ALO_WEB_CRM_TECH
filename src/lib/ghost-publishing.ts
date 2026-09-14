// ============================================================
// Ghost — Independent publishing, memberships, subscriptions & newsletters
// Source: TryGhost/Ghost (55.3k★ 54004 commits, 12k forks, Node/Ember)
//   ghost/core, koenig editor, Content + Admin APIs, tiers, newsletters,
//   TryGhost/SDK, member attribution.
// ALO use: publish MASTER_BLOGS_DATA + NewsArticle + scholarships/events as
//   Ghost posts + newsletters + member tiers (free student vs premium test-prep).
// Reuses: BlogPost, NewsArticle, MarketingCampaign, CrmAuditLog
// Env: GHOST_URL, GHOST_ADMIN_API_KEY (id:secret hex), GHOST_CONTENT_API_KEY
// ============================================================
import { db } from '@/lib/db';
import crypto from 'crypto';

const GHOST_URL = process.env.GHOST_URL || '';
const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_API_KEY || '';
const GHOST_CONTENT_KEY = process.env.GHOST_CONTENT_API_KEY || '';

function makeGhostAdminToken(): string | null {
  if (!GHOST_ADMIN_KEY || !GHOST_ADMIN_KEY.includes(':')) return null;
  const [id, secretHex] = GHOST_ADMIN_KEY.split(':');
  const secret = Buffer.from(secretHex, 'hex');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', kid: id, typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 5 * 60, aud: '/admin/' })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export type GhostPostInput = {
  title: string;
  slug: string;
  html: string; // Koenig-compatible HTML (ghost converts)
  excerpt?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  newsletter?: boolean; // send as newsletter
};

/**
 * Publish or update a post via Ghost Admin API.
 * Graceful when GHOST_URL not set (logs and returns local id).
 */
export async function ghostPublishPost(input: GhostPostInput, actorId: string): Promise<{ id: string; url: string; published: boolean }> {
  const token = makeGhostAdminToken();

  if (GHOST_URL && token) {
    try {
      const body = {
        posts: [{
          title: input.title,
          slug: input.slug,
          html: input.html,
          status: input.status || 'draft',
          tags: (input.tags || []).map(name => ({ name })),
          excerpt: input.excerpt,
        }],
      };
      const res = await fetch(`${GHOST_URL.replace(/\/$/, '')}/ghost/api/admin/posts/?source=html`, {
        method: 'POST',
        headers: { Authorization: `Ghost ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json: any = await res.json().catch(()=>({}));
      const post = json.posts?.[0];
      if (post?.id) {
        // Trigger newsletter if requested
        if (input.newsletter && post.id) {
          await fetch(`${GHOST_URL.replace(/\/$/, '')}/ghost/api/admin/posts/${post.id}/email/`, {
            method: 'PUT',
            headers: { Authorization: `Ghost ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }).catch(()=>{});
        }
        await db.crmAuditLog.create({ data: { action: 'GHOST_POST_PUBLISHED', entityType: 'GhostPost', entityId: post.id, actorId, details: JSON.stringify({ slug: input.slug, status: input.status }), createdAt: new Date() } as any }).catch(()=>{});
        return { id: post.id, url: post.url || `${GHOST_URL}/${input.slug}/`, published: post.status === 'published' };
      }
    } catch (e: any) {
      console.warn('[ghost] publish failed:', e?.message);
    }
  }

  // Fallback: treat as local draft (ALO CMS remains source of truth)
  const localId = `ghost_local_${input.slug}`;
  await db.crmAuditLog.create({ data: { action: 'GHOST_POST_LOCAL_DRAFT', entityType: 'GhostPost', entityId: localId, actorId, details: JSON.stringify({ slug: input.slug }), createdAt: new Date() } as any }).catch(()=>{});
  return { id: localId, url: `/blog/${input.slug}`, published: false };
}

export async function ghostListPosts(limit = 20): Promise<{ posts: { id: string; title: string; slug: string; url: string; publishedAt?: string }[] }> {
  if (GHOST_URL && GHOST_CONTENT_KEY) {
    try {
      const r = await fetch(`${GHOST_URL.replace(/\/$/, '')}/ghost/api/content/posts/?key=${GHOST_CONTENT_KEY}&limit=${limit}&fields=title,slug,url,published_at`);
      const j: any = await r.json().catch(()=>null);
      if (j?.posts) return { posts: j.posts.map((p: any) => ({ id: p.id, title: p.title, slug: p.slug, url: p.url, publishedAt: p.published_at })) };
    } catch {}
  }
  return { posts: [] };
}
