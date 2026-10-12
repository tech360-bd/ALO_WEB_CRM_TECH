/**
 * Minimal, safe templating for marketing email.
 *
 * Only the placeholders in TEMPLATE_VARIABLES are allowed. Unknown placeholders
 * are rejected when a campaign is created, so raw template syntax can never reach
 * a recipient. HTML values are escaped; plain-text values are not.
 * Every campaign must contain {{unsubscribe_url}} in its HTML and, when a text
 * part is supplied, in that text part too.
 */

export const TEMPLATE_VARIABLES = [
  'email',
  'first_name',
  'last_name',
  'company',
  'campaign_name',
  'unsubscribe_url',
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateValues = Partial<Record<TemplateVariable, string>>;

const PLACEHOLDER = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function findPlaceholders(source: string): string[] {
  const names = new Set<string>();
  for (const match of source.matchAll(PLACEHOLDER)) names.add(match[1]);
  return Array.from(names);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

export type TemplateProblem =
  | { code: 'SUBJECT_REQUIRED' }
  | { code: 'HTML_REQUIRED' }
  | { code: 'UNKNOWN_PLACEHOLDER'; names: string[] }
  | { code: 'UNSUBSCRIBE_LINK_REQUIRED'; part: 'html' | 'text' };

export function validateTemplate(input: { subject: string; html: string; text: string | null }): TemplateProblem | null {
  if (input.subject.trim().length === 0) return { code: 'SUBJECT_REQUIRED' };
  if (input.html.trim().length === 0) return { code: 'HTML_REQUIRED' };

  const text = input.text !== null && input.text.trim().length > 0 ? input.text : null;
  const allowed = new Set<string>(TEMPLATE_VARIABLES);
  const unknown = new Set<string>();
  for (const source of [input.subject, input.html, text ?? '']) {
    for (const name of findPlaceholders(source)) {
      if (!allowed.has(name)) unknown.add(name);
    }
  }
  if (unknown.size > 0) return { code: 'UNKNOWN_PLACEHOLDER', names: Array.from(unknown).sort() };

  if (!findPlaceholders(input.html).includes('unsubscribe_url')) {
    return { code: 'UNSUBSCRIBE_LINK_REQUIRED', part: 'html' };
  }
  if (text !== null && !findPlaceholders(text).includes('unsubscribe_url')) {
    return { code: 'UNSUBSCRIBE_LINK_REQUIRED', part: 'text' };
  }
  return null;
}

export function renderTemplate(source: string, values: TemplateValues, mode: 'html' | 'text'): string {
  return source.replace(PLACEHOLDER, (_whole: string, name: string) => {
    if (!(TEMPLATE_VARIABLES as readonly string[]).includes(name)) return '';
    const raw = values[name as TemplateVariable] ?? '';
    return mode === 'html' ? escapeHtml(raw) : raw;
  });
}

/** Plain-text body derived from HTML. Links are dropped by tag stripping, so the unsubscribe URL is re-added. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Text part used when a campaign has none. Always contains {{unsubscribe_url}}. */
export function derivePlainText(html: string): string {
  const body = htmlToPlainText(html);
  return findPlaceholders(body).includes('unsubscribe_url')
    ? body
    : `${body}\n\nUnsubscribe: {{unsubscribe_url}}`;
}
