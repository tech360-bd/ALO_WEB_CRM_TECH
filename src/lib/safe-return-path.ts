/** Accept only a local, absolute-path return URL. Never redirect to another origin. */
export function safeReturnPath(value: string | null | undefined, fallback = '/student/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = 'https://alo-return.invalid';
    const url = new URL(value, base);
    if (url.origin !== base || !url.pathname.startsWith('/') || url.pathname.startsWith('//')) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function returnPathFromLocation(fallback = '/student/dashboard'): string {
  if (typeof window === 'undefined') return fallback;
  return safeReturnPath(new URLSearchParams(window.location.search).get('next'), fallback);
}
