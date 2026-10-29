import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SocialAccountActions from '@/components/employee/SocialAccountActions';

export const dynamic = "force-dynamic";

// Employee Dashboard → My Accounts → Connected Accounts
// Employee connects own accounts via official OAuth; can request official account access (admin approval)

const OWN_PLATFORMS = [
  { id: "facebook", name: "Facebook", provider: "facebook_page" },
  { id: "instagram", name: "Instagram Business", provider: "instagram" },
  { id: "linkedin", name: "LinkedIn", provider: "linkedin" },
  { id: "youtube", name: "YouTube", provider: "youtube" },
  { id: "tiktok", name: "TikTok", provider: "tiktok" },
  { id: "x", name: "X (Twitter)", provider: "x" },
  { id: "telegram", name: "Telegram", provider: "telegram" },
  { id: "pinterest", name: "Pinterest", provider: "pinterest" },
];

export default async function EmployeeMyAccountsPage() {
  const session = await getServerSession(authOptions as any) as any;
  const userId = (session?.user as any)?.id || (session?.user as any)?.email;
  if (!userId) {
    return <div className="p-8 text-red-600">Please login — employee session required.</div>;
  }

  // Fetch Employee + CommunicationProfile + owned SocialAccounts
  let employee: any = null;
  let commProfile: any = null;
  let owned: any[] = [];
  try {
    employee = await (db as any).employee.findFirst({ where: { userId } }).catch(() => null) || await (db as any).employee.findFirst({ where: { email: userId } }).catch(() => null);
    const empId = employee?.employeeId || employee?.id;
    if (empId) {
      commProfile = await (db as any).employeeCommunicationProfile.findUnique({ where: { employeeId: empId } }).catch(() => null);
      owned = await (db as any).socialAccountOwnership.findMany({ where: { employeeId: empId }, include: { socialAccount: true } }).catch(() => []);
      // Also check SocialConnectedAccount legacy
      if (!owned.length) {
        const legacy = await (db as any).socialConnectedAccount.findMany({ where: { employeeId: empId } }).catch(() => []);
        owned = legacy.map((r: any) => ({ socialAccount: r }));
      }
    }
  } catch {}

  const ownedByProvider = new Map(owned.map((o: any) => [(o.socialAccount?.provider || o.provider), o]));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">My Accounts — Connected Accounts</h1>
      <p className="text-sm text-[var(--alo-body)] mt-1">Connect your own accounts via official OAuth. Request access to official accounts (admin approval). Tokens encrypted, never in .env.</p>
      {employee && <div className="mt-2 text-xs text-[var(--alo-text-muted)]">Employee: {employee.name || employee.email} • {employee.employeeId || employee.id} • CommProfile: {commProfile ? "yes" : "none (will be created on connect)"}</div>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {OWN_PLATFORMS.map(p => {
          const entry = ownedByProvider.get(p.provider);
          const acc = entry?.socialAccount || entry;
          const connected = !!acc;
          const status = acc?.status || acc?.connectedStatus || (connected ? "connected" : "disconnected");
          return (
            <div key={p.id} className={`border rounded-lg p-4 ${connected ? "border-green-300 bg-green-50" : "border-[var(--alo-border)] bg-white"}`}>
              <div className="flex justify-between">
                <div className="font-semibold">{p.name}</div>
                <span className={`text-xs px-2 py-1 rounded ${connected ? "bg-green-600 text-white" : "bg-slate-200"}`}>{status}</span>
              </div>
              {connected && (
                <div className="mt-2 text-xs space-y-1">
                  <div>Account: {acc.assetName || acc.accountName || acc.assetId || acc.accountId || "—"}</div>
                  <div>Token: {acc.tokenExpiresAt ? `expires ${new Date(acc.tokenExpiresAt).toLocaleDateString()}` : "no expiry"} • {acc.grantedPermissions ? `perms ${JSON.stringify(acc.grantedPermissions).slice(0,80)}` : ""}</div>
                  <div>Last sync: {acc.lastSyncAt ? new Date(acc.lastSyncAt).toLocaleString() : "—"}</div>
                </div>
              )}
              <SocialAccountActions connected={connected} accountId={acc?.id} />
              <div className="mt-2 text-xs text-[var(--alo-text-muted)]">OAuth uses official flows with <code>state</code> + PKCE, encrypted with <code>ENCRYPTION_KEY</code>, audit logged. Disconnect revokes at provider.</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border rounded p-4 bg-[var(--alo-page)] text-xs">
        <div className="font-semibold">Official WhatsApp (shared inbox)</div>
        <div className="mt-1">WhatsApp access is limited to operator-configured sender records and requires current provider verification. Your assignment: {commProfile?.whatsappNumberId || "none"} • Access: {commProfile?.whatsappAccess ? "yes" : "no"} • Assigned pages: {commProfile?.assignedPages ? JSON.stringify(JSON.parse(commProfile.assignedPages).slice(0,3)) : "—"}</div>
        <div className="mt-1">Official inbox: <code>/api/whatsapp/webhook</code> verifies <code>WHATSAPP_VERIFY_TOKEN</code> + <code>WHATSAPP_APP_SECRET</code> HMAC, routes via <code>UccRoutingRule</code>, ownership via <code>UccConversation.assignedToUserId</code>.</div>
      </div>

      <div className="mt-4 text-xs text-[var(--alo-text-muted)]">
        Reuses <code>Employee</code> + <code>EmployeeCommunicationProfile</code> + <code>SocialAccountOwnership</code> + <code>SocialIntegration/SocialAccount</code> — no duplicate employee table. See <code>docs/ENVIRONMENT_VARIABLES.md</code> Phase 8.
      </div>
    </div>
  );
}
