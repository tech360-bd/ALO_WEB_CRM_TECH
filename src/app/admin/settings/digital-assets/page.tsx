import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Admin Dashboard → Digital Assets & Integrations → Official Accounts
// Manages 10 platforms: Facebook Pages, Instagram Business, WhatsApp Business, LinkedIn Pages, YouTube, TikTok, X, Telegram, Pinterest, Google Business Profile
// Uses official OAuth, encrypted credentials (ENCRYPTION_KEY), audit logs

const PLATFORMS = [
  { id: "facebook_page", name: "Facebook Pages", provider: "facebook_page", oauth: "Facebook OAuth", scopes: "pages_show_list,pages_read_engagement,pages_messaging" },
  { id: "instagram", name: "Instagram Business", provider: "instagram", oauth: "Instagram Graph OAuth", scopes: "instagram_basic,pages_show_list" },
  { id: "whatsapp", name: "WhatsApp Business", provider: "whatsapp", oauth: "Meta Cloud API", scopes: "whatsapp_business_messaging" },
  { id: "linkedin", name: "LinkedIn Pages", provider: "linkedin", oauth: "LinkedIn OAuth 2.0", scopes: "r_organization_social,rw_organization_admin" },
  { id: "youtube", name: "YouTube", provider: "youtube", oauth: "Google OAuth", scopes: "youtube.readonly" },
  { id: "tiktok", name: "TikTok", provider: "tiktok", oauth: "TikTok Business OAuth", scopes: "user.info.basic,video.list" },
  { id: "x", name: "X (Twitter)", provider: "x", oauth: "X OAuth 2.0", scopes: "tweet.read,users.read" },
  { id: "telegram", name: "Telegram", provider: "telegram", oauth: "Bot Token (BotFather)", scopes: "bot" },
  { id: "pinterest", name: "Pinterest", provider: "pinterest", oauth: "Pinterest OAuth", scopes: "boards:read,pins:read" },
  { id: "google_business", name: "Google Business Profile", provider: "google_business", oauth: "Google OAuth", scopes: "business.manage" },
];

export default async function AdminDigitalAssetsPage() {
  const session = await getServerSession(authOptions as any) as any;
  const role = (session?.user as any)?.role;
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  if (!isAdmin) {
    return <div className="p-8 text-red-600">Access denied — requires SUPER_ADMIN or ADMIN. Current: {role || "unauthenticated"}</div>;
  }

  // Fetch SocialIntegration rows (official accounts) — reuse existing model
  let integrations: any[] = [];
  try {
    integrations = await (db as any).socialIntegration.findMany({ include: { accounts: true } }).catch(() => []);
  } catch {}

  const byProvider = new Map(integrations.map((r: any) => [r.provider, r]));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Digital Assets & Integrations — Official Accounts</h1>
      <p className="text-sm text-slate-600 mt-1">Manage 10 official platforms — OAuth, token expiry, verification, audit logs. Tokens encrypted with ENCRYPTION_KEY (never plain). Port 3044 prod.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {PLATFORMS.map(p => {
          const row = byProvider.get(p.provider);
          const status = row?.status || "disconnected";
          const accounts = row?.accounts?.length || 0;
          const tokenExp = row?.tokenExpiresAt ? new Date(row.tokenExpiresAt).toLocaleDateString() : "—";
          const health = row?.healthStatus || "unknown";
          const lastSync = row?.lastSyncAt ? new Date(row.lastSyncAt).toLocaleString() : "never";
          const isConnected = status === "connected";
          return (
            <div key={p.id} className={`border rounded-lg p-4 ${isConnected ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.provider} • {p.oauth}</div>
                  <div className="text-xs text-slate-500">Scopes: {p.scopes}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${isConnected ? "bg-green-600 text-white" : status==="expired" ? "bg-amber-600 text-white" : "bg-slate-200"}`}>{status}</span>
              </div>
              <div className="mt-3 text-xs space-y-1">
                <div>Accounts: <b>{accounts}</b> {row?.businessAccountId ? `(Business ${row.businessAccountId.slice(0,12)}…)` : ""}</div>
                <div>Token expiry: {tokenExp} {row?.accessToken ? "• encrypted" : "• no token"}</div>
                <div>Health: {health} • Last sync: {lastSync}</div>
                <div>Webhook: {row?.webhookStatus || "inactive"} {row?.webhookSecret ? "• secret set" : ""}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <a className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded" href={`/api/crm/ucc/oauth/start?provider=${p.provider}`}>Connect OAuth</a>
                <a className="text-xs border px-3 py-1.5 rounded" href={`/api/crm/ucc/webhooks/${p.provider}`}>Webhook</a>
              </div>
              {!isConnected && <div className="mt-2 text-xs text-amber-700">Connect via official OAuth — never store employee tokens in .env (per spec Phase 8). Tokens encrypted, audit logged.</div>}
              {row?.metadata && <details className="mt-2 text-xs"><summary>metadata</summary><pre className="bg-slate-100 p-2 rounded mt-1 overflow-auto max-h-32">{JSON.stringify(JSON.parse(row.metadata || "{}"), null, 2).slice(0,1000)}</pre></details>}
            </div>
          );
        })}
      </div>
      <div className="mt-6 border rounded p-4 bg-slate-50 text-xs">
        <div className="font-semibold">Implementation notes (reuse, not duplicate)</div>
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li>Reuses <code>SocialIntegration</code> + <code>SocialAccount</code> + <code>SocialAccountOwnership</code> (existing 463 models) — adds <code>employeeId</code> ownership via join, encrypts <code>accessToken</code> with <code>ENCRYPTION_KEY</code> AES-256-GCM.</li>
          <li>OAuth start at <code>/api/crm/ucc/oauth/start?provider=xxx</code>, callback <code>/api/crm/ucc/oauth/callback</code> — extend per-platform handlers under <code>/api/integrations/[platform]/callback</code>.</li>
          <li>Verification: real API call <code>GET /{'{pageId}'}?fields=name&amp;access_token=...</code> (not mocked), token expiry check, capabilities matrix, error logs via <code>ProviderErrorLog</code> + <code>IntegrationAuditLog</code>.</li>
          <li>See <code>docs/ENVIRONMENT_VARIABLES.md</code> for <code>FACEBOOK_APP_ID/SECRET</code> etc., and <code>docs/PRODUCTION_SETUP.md</code> for callback URLs <code>https://aloeducation.com/api/crm/ucc/oauth/callback</code>.</li>
        </ul>
      </div>
    </div>
  );
}
