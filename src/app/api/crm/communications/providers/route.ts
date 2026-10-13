import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  evaluateChannels,
  channelsForRole,
  activeChannels,
  CHANNEL_REGISTRY,
} from '@/lib/communications/channel-registry';

// ============================================================
// CHANNEL / PROVIDER STATUS — spec §122, §123, §159, §163
// GET /api/crm/communications/providers
//
// Answers one question honestly for the UI: "which channels can actually carry
// traffic right now?" A channel whose credentials are absent reports
// CONFIGURATION REQUIRED with the names of the missing settings and the
// business prerequisite a human still has to complete — never a fake "connected"
// state. Only variable NAMES are returned; values are never read out.
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (_req, auth) => {
    try {
      // AuthContext carries a role list (a user may hold several roles); the
      // highest-privilege one decides which channels are in scope.
      const roles = (auth.roles || []).map((value) => String(value).toLowerCase());
      const isPartner = roles.some((value) => value.includes('partner') || value === 'agent');
      const normalizedRole: 'counselor' | 'manager' | 'admin' | 'partner' = isPartner
        ? 'partner'
        : roles.some((value) => value.includes('admin'))
          ? 'admin'
          : roles.some((value) => value.includes('manager') || value.includes('director') || value.includes('ceo'))
            ? 'manager'
            : 'counselor';

      const all = evaluateChannels(process.env as Record<string, string | undefined>);
      // §122/§123: the workspace shows the channels this role is authorized for.
      const visible = channelsForRole(normalizedRole, all);

      return NextResponse.json({
        success: true,
        role: normalizedRole,
        channels: visible.map((channel) => ({
          id: channel.id,
          label: channel.label,
          group: channel.group,
          provider: channel.provider,
          status: channel.status,
          displayState: channel.displayState,
          missingVariables: channel.missingVariables,
          prerequisites: channel.prerequisites,
          notes: channel.notes,
        })),
        // Counts let a dashboard say "4 channels need setup" without re-deriving it.
        summary: {
          total: visible.length,
          active: activeChannels(visible).length,
          configurationRequired: visible.filter((channel) => channel.status === 'configuration_required').length,
          internal: visible.filter((channel) => channel.status === 'manual').length,
        },
        // §161: only ALO official accounts may ever be connected here.
        policy: {
          officialAccountsOnly: true,
          personalAccountPolicy:
            'Employees must not connect a personal social account to the official ALO engine unless company policy explicitly authorizes it.',
          registrySize: CHANNEL_REGISTRY.length,
        },
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Failed to evaluate channel configuration' }, { status: 500 });
    }
  })(request);
}
