/** Shared, validated WhatsApp Cloud API configuration. */

export function getWhatsAppGraphVersion(env: NodeJS.ProcessEnv = process.env): string | null {
  // Keep the historical `WHATSAPP_API_VERSION` alias and v22 default; the
  // deployment examples may override this with the currently configured Graph API version.
  const configured = (env.WHATSAPP_GRAPH_VERSION || env.WHATSAPP_GRAPH_API_VERSION || env.WHATSAPP_API_VERSION || 'v22.0').trim();
  if (!/^v\d+\.\d+$/.test(configured)) return null;
  return configured;
}

export function getWhatsAppGraphUrl(path: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const version = getWhatsAppGraphVersion(env);
  if (!version) return null;
  const safePath = path.replace(/^\/+/, '');
  if (!safePath || safePath.split('/').some((part) => !part || part === '.' || part === '..')) return null;
  return `https://graph.facebook.com/${version}/${safePath}`;
}

export function getWhatsAppAccessToken(env: NodeJS.ProcessEnv = process.env): string | null {
  const token = (env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_TOKEN || '').trim();
  return token || null;
}
