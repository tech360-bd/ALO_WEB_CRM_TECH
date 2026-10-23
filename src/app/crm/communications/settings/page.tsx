'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, Lock, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChannelStatusView {
  id: string;
  label: string;
  group: string;
  provider: string;
  status: 'active' | 'configuration_required' | 'manual';
  displayState: string;
  missingVariables: string[];
  prerequisites: string[];
  notes: string;
}

interface ProvidersResponse {
  success: boolean;
  role?: string;
  channels?: ChannelStatusView[];
  summary?: { total: number; active: number; configurationRequired: number; internal: number };
  policy?: { officialAccountsOnly: boolean; personalAccountPolicy: string };
}

/**
 * Spec §122/§159/§163 — the settings screen is where ALO staff find out what is
 * actually connected. Every value here comes from the server's evaluation of the
 * environment: a channel that is not configured says CONFIGURATION REQUIRED and
 * names what is missing. Nothing is ever shown as "connected" optimistically.
 */
export default function CommunicationSettingsPage() {
  const [data, setData] = useState<ProvidersResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/crm/communications/providers')
      .then((response) => response.json())
      .then((json: ProvidersResponse) => {
        if (json?.success) setData(json);
        else setError('Could not load channel status.');
      })
      .catch(() => setError('Could not reach the channel status API.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const badgeFor = (channel: ChannelStatusView) => {
    if (channel.status === 'active') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
          <CheckCircle2 className="w-3 h-3" /> ACTIVE
        </Badge>
      );
    }
    if (channel.status === 'manual') {
      return (
        <Badge variant="outline" className="bg-[var(--alo-surface-muted)] text-[var(--alo-body)] gap-1">
          <Server className="w-3 h-3" /> INTERNAL — NO SETUP REQUIRED
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-900 border-amber-300 gap-1">
        <AlertTriangle className="w-3 h-3" /> CONFIGURATION REQUIRED
      </Badge>
    );
  };

  const grouped = ['messaging', 'voice', 'social', 'portal'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Communication Settings</h1>
          <p className="text-sm text-[var(--alo-text-muted)] mt-1">
            Channels are shown per role and per connected account. A channel without credentials reports{' '}
            <span className="font-semibold">CONFIGURATION REQUIRED</span> and sending on it is blocked server-side —
            the CRM never pretends an integration is live.
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs border rounded px-3 py-1.5 flex items-center gap-1 bg-white hover:bg-[var(--alo-page)]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-sm text-red-800 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </CardContent>
        </Card>
      )}

      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Channels for your role', value: data.summary.total, tone: 'text-[var(--alo-text)]' },
            { label: 'Active', value: data.summary.active, tone: 'text-emerald-700' },
            { label: 'Configuration required', value: data.summary.configurationRequired, tone: 'text-amber-700' },
            { label: 'Internal (no provider)', value: data.summary.internal, tone: 'text-[var(--alo-body)]' },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="py-3">
                <div className={`text-2xl font-bold ${item.tone}`}>{item.value}</div>
                <div className="text-[11px] text-[var(--alo-text-muted)]">{item.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {grouped.map((group) => {
        const channels = (data?.channels || []).filter((channel) => channel.group === group);
        if (channels.length === 0) return null;
        return (
          <Card key={group}>
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm capitalize">{group} channels</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {channels.map((channel) => (
                <div key={channel.id} className="py-3 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{channel.label}</span>
                    {badgeFor(channel)}
                    <span className="text-[11px] text-[var(--alo-text-muted)]">via {channel.provider}</span>
                  </div>
                  <p className="text-xs text-[var(--alo-body)]">{channel.notes}</p>
                  {channel.missingVariables.length > 0 && (
                    <div className="text-[11px] text-amber-800">
                      <span className="font-semibold">Missing configuration:</span>{' '}
                      <span className="font-mono">{channel.missingVariables.join(', ')}</span>
                      <span className="text-[var(--alo-text-muted)]"> — set these in the server environment, never in the browser.</span>
                    </div>
                  )}
                  {channel.prerequisites.length > 0 && (
                    <div className="text-[11px] text-[var(--alo-body)]">
                      <span className="font-semibold">Still required from the provider:</span>{' '}
                      {channel.prerequisites.join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="w-4 h-4" /> Account ownership & token handling
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--alo-body)] space-y-2">
          <p className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-emerald-600" />
            {data?.policy?.personalAccountPolicy ||
              'Employees must not connect personal social accounts to the official ALO engine unless company policy explicitly authorizes it.'}
          </p>
          <p>
            Provider tokens stay on the server. They are never sent to a browser, never logged, and the status API above
            returns only the <span className="font-mono">names</span> of missing variables.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> SLA & escalation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--alo-body)]">
          SLA rules are configurable by channel, priority, student type, application stage, message intent, business
          hours and holiday calendar. The countdown shows <span className="font-mono">RESPONSE DUE IN</span> /{' '}
          <span className="font-mono">OVERDUE BY</span> with normal, warning, overdue and critical states, each with its
          own icon and label so urgency never depends on colour alone. First response, average response, compliance,
          overdue count and escalation count are tracked, and exclusions (provider outage, holiday, duplicate,
          no-response-required, approved leave, wrong assignment) are never counted against a counselor.
        </CardContent>
      </Card>
    </div>
  );
}
