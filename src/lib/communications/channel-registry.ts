/**
 * CHANNEL & PROVIDER REGISTRY — "CONFIGURATION REQUIRED" HONESTY (spec §122/§123/§159/§163)
 * ========================================================================================
 * The module brief is explicit:
 *
 *   "Do not build fake social-media integrations. Use official APIs/OAuth/business
 *    integrations where available. If a provider requires authorization, API
 *    credentials, webhook verification or business approval, show:
 *    CONFIGURATION REQUIRED — instead of pretending the integration is active."
 *
 * This registry is the single place that answers "is this channel actually live,
 * and if not, exactly what is missing?". It reads credentials from the
 * environment, never from the client, and returns a status the UI renders
 * verbatim. It deliberately contains NO simulated/mock provider.
 *
 * Security (§159): credentials are only ever *checked for presence* here; the
 * values are never returned, logged or sent to the browser. The returned
 * `configuredVariables` list carries names only.
 */

export const CHANNEL_IDS = [
  'whatsapp',
  'whatsapp_business',
  'email',
  'sms',
  'phone',
  'social_facebook',
  'social_instagram',
  'social_linkedin',
  'website_chat',
  'portal_messages',
  'internal_crm',
] as const;
export type ChannelId = (typeof CHANNEL_IDS)[number];

/**
 * `active`               — credentials present; safe to attempt real traffic
 * `configuration_required` — an official integration exists but ALO has not supplied
 *                            credentials/approval yet (this is what the UI must show)
 * `manual`               — works without provider credentials (in-CRM only)
 */
export type ChannelStatus = 'active' | 'configuration_required' | 'manual';

export interface ChannelDefinition {
  id: ChannelId;
  label: string;
  group: 'messaging' | 'voice' | 'social' | 'portal';
  /** Official provider/integration the channel is built on. */
  provider: string;
  /** Env vars that must all be present before the channel may report `active`. */
  requiredEnv: string[];
  /** Extra non-env prerequisites (business approval, webhook verification, OAuth app review). */
  prerequisites: string[];
  /** Every channel except the social ones is available to authorized counselors by default. */
  defaultRoles: Array<'counselor' | 'manager' | 'admin' | 'partner'>;
  /** Spec §161 — only ALO official accounts may be connected here. */
  officialAccountOnly: boolean;
  notes: string;
}

export const CHANNEL_REGISTRY: ChannelDefinition[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    group: 'messaging',
    provider: 'WhatsApp Cloud API (Meta)',
    requiredEnv: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_APP_SECRET'],
    prerequisites: ['Meta Business verification', 'Phone number approved for the Cloud API', 'Webhook subscription verified'],
    defaultRoles: ['counselor', 'manager', 'admin'],
    officialAccountOnly: true,
    notes: 'First-class channel per spec §124: auto-matching, SLA, templates and AI drafts are all wired to it.',
  },
  {
    id: 'whatsapp_business',
    label: 'WhatsApp Business (additional numbers)',
    group: 'messaging',
    provider: 'WhatsApp Cloud API — number pool',
    requiredEnv: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
    prerequisites: ['Each additional number approved under the same Business account'],
    defaultRoles: ['counselor', 'manager', 'admin'],
    officialAccountOnly: true,
    notes: 'Number inventory is managed by src/lib/whatsapp-number-pool.ts.',
  },
  {
    id: 'email',
    label: 'Email',
    group: 'messaging',
    provider: 'SMTP submission',
    requiredEnv: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'],
    prerequisites: ['Sender domain SPF/DKIM aligned to avoid spoofing blocks'],
    defaultRoles: ['counselor', 'manager', 'admin'],
    officialAccountOnly: true,
    notes: 'Delivery is explicit-failure: no logging-only "sent" state (src/lib/email-service.ts).',
  },
  {
    id: 'sms',
    label: 'SMS',
    group: 'messaging',
    provider: 'httpSMS gateway',
    requiredEnv: ['HTTPSMS_API_KEY'],
    prerequisites: ['Sender device/sim registered with the gateway', 'Receipt webhook reachable'],
    defaultRoles: ['counselor', 'manager', 'admin'],
    officialAccountOnly: true,
    notes: 'Receipts and webhook handling live in src/lib/httpsms-*.ts.',
  },
  {
    id: 'phone',
    label: 'Phone calls',
    group: 'voice',
    provider: '3CX telephony',
    requiredEnv: ['THREECX_BASE_URL', 'THREECX_CLIENT_ID', 'THREECX_CLIENT_SECRET'],
    prerequisites: ['PBX admin consent for CRM click-to-call', 'Recording consent policy per destination country'],
    defaultRoles: ['counselor', 'manager', 'admin'],
    officialAccountOnly: true,
    notes: 'Recording, consent and retention rules apply before enabling call recording (spec §144).',
  },
  {
    id: 'social_facebook',
    label: 'Facebook Page inbox',
    group: 'social',
    provider: 'Meta Graph API (Page messaging)',
    requiredEnv: ['META_PAGE_ACCESS_TOKEN', 'META_APP_SECRET', 'META_PAGE_ID'],
    prerequisites: ['App review for pages_messaging', 'Page admin grants ALO the app', 'Webhook verification'],
    defaultRoles: ['manager', 'admin'],
    officialAccountOnly: true,
    notes: 'DMs only — public comments/posts are a marketing function, not the counseling inbox.',
  },
  {
    id: 'social_instagram',
    label: 'Instagram DMs',
    group: 'social',
    provider: 'Meta Graph API (Instagram messaging)',
    requiredEnv: ['META_INSTAGRAM_ACCESS_TOKEN', 'META_APP_SECRET', 'META_INSTAGRAM_ACCOUNT_ID'],
    prerequisites: ['Instagram professional account linked to an ALO Facebook Page', 'App review for instagram_manage_messages'],
    defaultRoles: ['manager', 'admin'],
    officialAccountOnly: true,
    notes: 'Personal Instagram accounts must never be connected (spec §161).',
  },
  {
    id: 'social_linkedin',
    label: 'LinkedIn',
    group: 'social',
    provider: 'LinkedIn Marketing/Share API',
    requiredEnv: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_ORGANIZATION_URN'],
    prerequisites: ['LinkedIn app review', 'Organization page admin approval'],
    defaultRoles: ['manager', 'admin'],
    officialAccountOnly: true,
    notes: 'Messaging consent is restricted by LinkedIn policy; expect read/publish rather than an inbox.',
  },
  {
    id: 'website_chat',
    label: 'Website chat',
    group: 'messaging',
    provider: 'Chatwoot inbox',
    requiredEnv: ['CHATWOOT_BASE_URL', 'CHATWOOT_API_TOKEN', 'CHATWOOT_ACCOUNT_ID'],
    prerequisites: ['Inbox created in the Chatwoot instance', 'Webhook to the CRM configured'],
    defaultRoles: ['counselor', 'manager', 'admin'],
    officialAccountOnly: true,
    notes: 'src/lib/chatwoot-inbox.ts holds the client; conversations land in the unified inbox.',
  },
  {
    id: 'portal_messages',
    label: 'Student portal messages',
    group: 'portal',
    provider: 'ALO CRM (internal)',
    requiredEnv: [],
    prerequisites: [],
    defaultRoles: ['counselor', 'manager', 'admin'],
    officialAccountOnly: false,
    notes: 'Native to this system — no external provider, nothing to configure.',
  },
  {
    id: 'internal_crm',
    label: 'Internal CRM notes',
    group: 'portal',
    provider: 'ALO CRM (internal)',
    requiredEnv: [],
    prerequisites: [],
    defaultRoles: ['counselor', 'manager', 'admin'],
    officialAccountOnly: false,
    notes: 'Internal-only; never visible to students or partners.',
  },
];

export interface ChannelRuntimeStatus {
  id: ChannelId;
  label: string;
  group: ChannelDefinition['group'];
  provider: string;
  status: ChannelStatus;
  /** Env variable NAMES that are missing (never values). */
  missingVariables: string[];
  /** Prerequisites a human must complete — shown alongside CONFIGURATION REQUIRED. */
  prerequisites: string[];
  /** Ready for the message to be shown in the UI, including the honesty label. */
  displayState: string;
  notes: string;
}

/**
 * Evaluate every channel against the environment.
 *
 * Only the variable NAMES are exposed. Passing `env` explicitly keeps this pure
 * and testable, and prevents accidental reads from `process.env` in a browser
 * bundle.
 */
export function evaluateChannels(env: Record<string, string | undefined> = {}): ChannelRuntimeStatus[] {
  return CHANNEL_REGISTRY.map((channel) => {
    const missingVariables = channel.requiredEnv.filter((name) => {
      const value = env[name];
      return value === undefined || String(value).trim() === '';
    });

    const status: ChannelStatus =
      channel.requiredEnv.length === 0 && channel.prerequisites.length === 0
        ? 'manual'
        : missingVariables.length === 0
          ? 'active'
          : 'configuration_required';

    // The literal string the brief asks the UI to show; kept here so every screen
    // renders identically instead of each inventing its own wording.
    const displayState =
      status === 'active' ? 'ACTIVE' : status === 'manual' ? 'INTERNAL — NO SETUP REQUIRED' : 'CONFIGURATION REQUIRED';

    return {
      id: channel.id,
      label: channel.label,
      group: channel.group,
      provider: channel.provider,
      status,
      missingVariables,
      prerequisites: channel.prerequisites,
      displayState,
      notes: channel.notes,
    };
  });
}

/** Channels that may attempt real provider traffic right now. */
export function activeChannels(statuses: ChannelRuntimeStatus[]): ChannelRuntimeStatus[] {
  return statuses.filter((status) => status.status === 'active');
}

/**
 * Which channels a given role may use (spec §122/§160).
 *
 * `social` channels are manager/admin only by default: the brief forbids giving
 * every employee unrestricted access to company social accounts.
 */
export function channelsForRole(
  role: 'counselor' | 'manager' | 'admin' | 'partner',
  statuses: ChannelRuntimeStatus[]
): ChannelRuntimeStatus[] {
  return statuses.filter((status) => {
    const definition = CHANNEL_REGISTRY.find((entry) => entry.id === status.id);
    if (!definition) return false;
    if (role === 'partner') {
      // Partners get their own workspace (§123): messaging + portal, never the
      // company social accounts or internal-only CRM notes.
      return definition.group === 'messaging' || definition.id === 'portal_messages';
    }
    return definition.defaultRoles.includes(role);
  });
}

/**
 * Guard for outgoing sends: a channel that is not `active` must refuse to send
 * rather than fail silently or, worse, appear to have delivered (spec §173).
 */
export function assertChannelSendable(
  channelId: ChannelId,
  statuses: ChannelRuntimeStatus[]
): { ok: true } | { ok: false; reason: string } {
  const status = statuses.find((entry) => entry.id === channelId);
  if (!status) return { ok: false, reason: 'Unknown channel.' };
  if (status.status === 'active') return { ok: true };
  if (status.status === 'manual') {
    return { ok: false, reason: 'This channel is internal to the CRM and has no outbound provider.' };
  }
  return {
    ok: false,
    reason: `CONFIGURATION REQUIRED — ${status.label} is not connected. Missing: ${status.missingVariables.join(', ')}.`,
  };
}
