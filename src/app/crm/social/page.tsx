'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Facebook, Instagram, Linkedin, Mail, MessageSquare } from 'lucide-react';

export default function SocialCommandCenterPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/social/accounts')
      .then(r => r.json())
      .then(d => setStatus(d))
      .catch(() => setStatus({ error: 'fetch failed' }))
      .finally(() => setLoading(false));
  }, []);

  const accounts = status?.accounts || [];

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" /> Social Command Center
        </h1>
        <p className="text-sm text-gray-500">Official ALO accounts — Facebook, Instagram, LinkedIn, Website Chat</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading social accounts…</p>
      ) : accounts.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader><CardTitle className="text-amber-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> CONFIGURATION REQUIRED</CardTitle></CardHeader>
          <CardContent className="text-sm text-amber-900 space-y-2">
            <p>No official social account is connected. This is the expected state until OAuth/Business Integration is completed.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Facebook Page: connect via App Dashboard → Facebook Login → approvals + webhook verify token</li>
              <li>Instagram: Business account linked to Facebook Page → Instagram Graph API</li>
              <li>LinkedIn: Organization admin OAuth</li>
            </ul>
            <p className="font-medium">Never display a fake “connected” status. The API `/api/crm/social/accounts` returns real connection state; until `connectionStatus=connected` this page shows CONFIGURATION REQUIRED.</p>
            <p className="text-xs text-gray-600">Docs: see PROVIDER_INTEGRATION_GUIDE.md and verify each account’s `platform`, `accountId`, `displayName`, `connectionStatus`, `permissions`, `tokenStatus` (never expose token), `lastSync`, `webhookStatus`.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.map((a: any) => (
            <Card key={a.id}>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2">
                {a.platform === 'facebook' && <Facebook className="w-4 h-4" />}
                {a.platform === 'instagram' && <Instagram className="w-4 h-4" />}
                {a.platform === 'linkedin' && <Linkedin className="w-4 h-4" />}
                {a.displayName} <Badge className={a.connectionStatus === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{a.connectionStatus}</Badge>
              </CardTitle></CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-1">
                <p>Platform: {a.platform}</p>
                <p>Account ID: {a.accountId}</p>
                <p>Permissions: {a.permissions || '—'}</p>
                <p>Token: {a.tokenStatus || 'CONFIGURATION REQUIRED'}</p>
                <p>Last sync: {a.lastSync || 'never'}</p>
                <p>Webhook: {a.webhookStatus || 'not verified'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Security</CardTitle></CardHeader>
        <CardContent className="text-xs text-gray-600">
          Official ALO accounts are distinct from employee personal accounts. Employee personal accounts are never used for official sends. Every outgoing official communication is audited with actor, account, and timestamp. Tokens are never exposed — UI shows only `tokenStatus` without value.
        </CardContent>
      </Card>
    </div>
  );
}
