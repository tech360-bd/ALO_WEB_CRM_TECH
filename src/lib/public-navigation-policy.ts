export interface PublicNavigationLink {
    label: string;
    href: string;
}
/** CMS may add destination links; it cannot remove required destinations or
 * introduce script/external/traversal targets into the shared public header. */
export function mergePublicDestinations(required: readonly PublicNavigationLink[], candidates: unknown): PublicNavigationLink[] {
    const pinned = required.filter(link => link.href !== '/destinations');
    const more = required.find(link => link.href === '/destinations');
    const result = [...pinned];
    const seen = new Set(result.map(link => link.href));
    if (Array.isArray(candidates))
        for (const item of candidates.slice(0, 100)) {
            if (!item || typeof item !== 'object' || typeof item.label !== 'string' || typeof item.href !== 'string')
                continue;
            const label = item.label.trim();
            if (!label || label.length > 80)
                continue;
            try {
                const url = new URL(item.href, 'https://aloeducation.com');
                if (!['https://aloeducation.com', 'https://www.aloeducation.com'].includes(url.origin) || url.username || url.password || url.search || url.hash || !/^\/destinations\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url.pathname) || seen.has(url.pathname))
                    continue;
                result.push({ label, href: url.pathname });
                seen.add(url.pathname);
            }
            catch { /* Reject malformed published navigation; keep the required links. */ }
        }
    if (more)
        result.push(more);
    return result;
}
