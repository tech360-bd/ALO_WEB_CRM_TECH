// Address hygiene, templating, and unsubscribe tokens (src/lib/email-marketing/*).
import { describe, expect, it } from 'vitest';
import { normalizeEmail, parseAddressList } from '@/lib/email-marketing/addresses';
import {
  derivePlainText,
  escapeHtml,
  findPlaceholders,
  htmlToPlainText,
  renderTemplate,
  validateTemplate,
} from '@/lib/email-marketing/templating';
import {
  buildUnsubscribeUrl,
  createUnsubscribeToken,
  UNSUBSCRIBE_TOKEN_TTL_MS,
  verifyUnsubscribeToken,
} from '@/lib/email-marketing/unsubscribe-token';

const SECRET = 'x'.repeat(32);

describe('normalizeEmail', () => {
  it('lower-cases and trims a plain address', () => {
    expect(normalizeEmail('  Student.One+tag@Example.co.uk ')).toBe('student.one+tag@example.co.uk');
  });

  it.each([
    '',
    'no-at-sign',
    '@example.com',
    'a@b',
    'a..b@example.com',
    '.a@example.com',
    'a.@example.com',
    'a b@example.com',
    'a@-example.com',
    'a@example..com',
    'a@example.c',
    'üser@example.com',
    'a@example.com@other.com',
    `${'a'.repeat(65)}@example.com`,
    `x@${'a'.repeat(250)}.com`,
    42,
    null,
  ])('rejects %j', (input) => {
    expect(normalizeEmail(input)).toBeNull();
  });
});

describe('parseAddressList', () => {
  it('splits, normalizes, drops invalid entries, and de-duplicates', () => {
    expect(parseAddressList('a@x.com, bad, A@X.com ,b@y.org')).toEqual(['a@x.com', 'b@y.org']);
  });

  it('returns an empty list for an unset value', () => {
    expect(parseAddressList(undefined)).toEqual([]);
    expect(parseAddressList('')).toEqual([]);
  });
});

describe('templating', () => {
  it('finds distinct placeholder names regardless of spacing', () => {
    expect(findPlaceholders('{{ first_name }} {{email}} {{first_name}}')).toEqual(['first_name', 'email']);
  });

  it('reports the first problem in a template', () => {
    expect(validateTemplate({ subject: '  ', html: '<p>x</p>{{unsubscribe_url}}', text: null })).toEqual({ code: 'SUBJECT_REQUIRED' });
    expect(validateTemplate({ subject: 'Hi', html: '   ', text: null })).toEqual({ code: 'HTML_REQUIRED' });
    expect(validateTemplate({ subject: 'Hi', html: '<p>{{secret_key}}</p>{{unsubscribe_url}}', text: null })).toEqual({
      code: 'UNKNOWN_PLACEHOLDER',
      names: ['secret_key'],
    });
  });

  it('requires the unsubscribe placeholder in the HTML, and in the text part when one is supplied', () => {
    expect(validateTemplate({ subject: 'Hi', html: '<p>no link</p>', text: null })).toEqual({
      code: 'UNSUBSCRIBE_LINK_REQUIRED',
      part: 'html',
    });
    expect(validateTemplate({ subject: 'Hi', html: '<a href="{{unsubscribe_url}}">u</a>', text: 'no link here' })).toEqual({
      code: 'UNSUBSCRIBE_LINK_REQUIRED',
      part: 'text',
    });
  });

  it('accepts a compliant template', () => {
    expect(
      validateTemplate({
        subject: 'Hello {{first_name}}',
        html: '<p>Hi</p><a href="{{unsubscribe_url}}">Unsubscribe</a>',
        text: 'Hi\nUnsubscribe: {{unsubscribe_url}}',
      })
    ).toBeNull();
  });

  it('escapes values in HTML but not in plain text', () => {
    const values = { first_name: '<script>&"x"</script>' };
    expect(renderTemplate('<p>{{first_name}}</p>', values, 'html')).toBe('<p>&lt;script&gt;&amp;&quot;x&quot;&lt;/script&gt;</p>');
    expect(renderTemplate('Hi {{first_name}}', values, 'text')).toBe('Hi <script>&"x"</script>');
  });

  it('renders unknown placeholders as empty rather than leaking template syntax', () => {
    expect(renderTemplate('a{{nope}}b', {}, 'html')).toBe('ab');
  });

  it('escapeHtml covers the five HTML-significant characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('derives a plain-text body that still carries the unsubscribe URL when the link was only an href', () => {
    const text = derivePlainText('<p>Hello there</p><p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>');
    expect(text).toContain('Hello there');
    expect(text).toContain('{{unsubscribe_url}}');
    expect(text).not.toContain('<');
  });

  it('strips script and style blocks from plain-text output', () => {
    expect(htmlToPlainText('<style>p{}</style><script>alert(1)</script><p>Visible</p>')).toBe('Visible');
  });
});

describe('unsubscribe tokens', () => {
  it('round-trips the email and campaign id', () => {
    const token = createUnsubscribeToken({ email: 'ann@example.com', campaignId: 'camp1' }, SECRET, 1_000);
    expect(verifyUnsubscribeToken(token, SECRET, 2_000)).toEqual({ ok: true, email: 'ann@example.com', campaignId: 'camp1' });
  });

  it('accepts a token with no campaign id', () => {
    const token = createUnsubscribeToken({ email: 'ann@example.com' }, SECRET, 1_000);
    expect(verifyUnsubscribeToken(token, SECRET, 2_000)).toEqual({ ok: true, email: 'ann@example.com', campaignId: null });
  });

  it('rejects a tampered payload', () => {
    const token = createUnsubscribeToken({ email: 'ann@example.com', campaignId: 'c' }, SECRET, 1_000);
    const [payload, signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ e: 'victim@example.com', c: 'c', x: 9e15 })).toString('base64url');
    expect(verifyUnsubscribeToken(`${forged}.${signature}`, SECRET, 2_000)).toEqual({ ok: false, reason: 'bad_signature' });
    expect(payload.length).toBeGreaterThan(0);
  });

  it('rejects a token signed with a different secret', () => {
    const token = createUnsubscribeToken({ email: 'ann@example.com' }, SECRET, 1_000);
    expect(verifyUnsubscribeToken(token, 'y'.repeat(32), 2_000)).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('expires after the TTL', () => {
    const token = createUnsubscribeToken({ email: 'ann@example.com' }, SECRET, 0);
    expect(verifyUnsubscribeToken(token, SECRET, UNSUBSCRIBE_TOKEN_TTL_MS)).toMatchObject({ ok: true });
    expect(verifyUnsubscribeToken(token, SECRET, UNSUBSCRIBE_TOKEN_TTL_MS + 1)).toEqual({ ok: false, reason: 'expired' });
  });

  it('fails closed when the secret is missing or shorter than 32 characters', () => {
    expect(verifyUnsubscribeToken('a.b', null, 0)).toEqual({ ok: false, reason: 'config' });
    expect(verifyUnsubscribeToken('a.b', 'short', 0)).toEqual({ ok: false, reason: 'config' });
    expect(() => createUnsubscribeToken({ email: 'ann@example.com' }, 'short', 0)).toThrow('EMAIL_UNSUBSCRIBE_SECRET_INVALID');
  });

  it.each([undefined, 42, '', 'abc', 'a.b.c', '.sig', 'payload.'])('treats %j as malformed', (token) => {
    expect(verifyUnsubscribeToken(token, SECRET, 0)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('builds a public URL with the token percent-encoded', () => {
    const url = buildUnsubscribeUrl({ baseUrl: 'https://app.example', secret: SECRET, email: 'ann@example.com', campaignId: 'c1' });
    expect(url.startsWith('https://app.example/api/email/unsubscribe?t=')).toBe(true);
    const token = decodeURIComponent(url.split('?t=')[1]);
    expect(verifyUnsubscribeToken(token, SECRET)).toMatchObject({ ok: true, email: 'ann@example.com', campaignId: 'c1' });
  });
});
