import { MetadataRoute } from 'next';

/**
 * robots.txt for https://aloeducation.com.
 *
 * Two jobs, and they pull in opposite directions, so the list below is
 * deliberately explicit rather than pattern-based:
 *
 *   1. Let Google index every public marketing page — country, course,
 *      university, scholarship, visa, IELTS, blog and guide URLs are the
 *      inventory that Search Console reports on.
 *   2. Keep authenticated and staff surfaces out of the index. Crawling them
 *      wastes crawl budget on pages that render a login redirect, and worse,
 *      `/review/[token]` URLs are capability links whose token is the
 *      authorisation — having Googlebot request them puts a live token in a
 *      crawl log.
 *
 * The previous version disallowed only `/api/`, `/crm/`, `/admin/`,
 * `/partner-admin/` and `/employee/`. That left `/counselor/`, `/super-admin/`,
 * `/dashboard/`, `/application-manager/`, `/student/`, `/partner/`,
 * `/parent-portal/`, `/university-portal/`, `/review/` and `/user-guide/` fully
 * crawlable. This file closes that gap.
 *
 * robots.txt is a crawl directive, NOT an access control. Every route listed
 * here must also be authenticated in code — disallowing it does not protect it.
 */

/** Authenticated portals and staff surfaces. Never index, never crawl. */
const INTERNAL_PATHS = [
  '/api/',
  // Admin / staff
  '/admin/',
  '/crm/',
  '/super-admin/',
  '/counselor/',
  '/employee/',
  '/application-manager/',
  '/dashboard/',
  '/hr/',
  '/hrm/',
  '/user-guide/',
  // Tenant + applicant portals
  '/partner/',
  '/partner-admin/',
  '/student/',
  '/parent-portal/',
  '/university-portal/',
  '/portal/',
  // Token-bearing capability links — see the file header.
  '/review/',
];

/**
 * Utility pages with no indexable content. Disallowed to keep crawl budget on
 * the marketing inventory and to avoid thin-content reports in Search Console.
 * `/login` and `/register` are intentionally NOT here: they are legitimate
 * public entry points that users search for, and blocking them would produce
 * "indexed, though blocked by robots.txt" warnings instead.
 */
const UTILITY_PATHS = ['/offline', '/forgot-password', '/reset-password', '/verify-email'];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...INTERNAL_PATHS, ...UTILITY_PATHS],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    // A non-zero crawl delay is NOT set: Google ignores the directive and for a
    // legitimate crawler it would only slow indexing of new course and
    // university pages.
  };
}
