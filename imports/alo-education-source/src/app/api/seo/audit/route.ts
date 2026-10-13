import { NextResponse } from 'next/server';

export async function GET() {
  const auditData = {
    timestamp: new Date().toISOString(),
    summary: {
      organicTraffic: 28500,
      domainAuthority: 42,
      backlinks: 1850,
      indexedPages: 342,
      totalPages: 387,
      indexationRate: 88.4,
    },
    coreWebVitals: {
      lcp: { value: 1.8, status: 'good', threshold: '< 2.5s' },
      fid: { value: 45, status: 'good', threshold: '< 100ms' },
      cls: { value: 0.08, status: 'good', threshold: '< 0.1' },
      ttfb: { value: 320, status: 'needs-improvement', threshold: '< 200ms' },
      inp: { value: 120, status: 'needs-improvement', threshold: '< 200ms' },
    },
    topKeywords: [
      { keyword: 'study in uk', position: 3, volume: 18100 },
      { keyword: 'study in australia', position: 5, volume: 14800 },
      { keyword: 'study in canada', position: 7, volume: 12100 },
      { keyword: 'study abroad consultants', position: 2, volume: 9900 },
      { keyword: 'IELTS preparation', position: 4, volume: 8100 },
    ],
    issues: [
      { severity: 'high', message: 'TTFB exceeds 200ms threshold — consider edge caching' },
      { severity: 'medium', message: 'INP of 120ms needs improvement — defer non-critical JS' },
      { severity: 'low', message: '45 URLs not yet indexed by Google' },
    ],
    sitemaps: [
      { url: '/sitemap.xml', status: 'valid', urls: 387 },
      { url: '/sitemap-countries.xml', status: 'valid', urls: 45 },
      { url: '/sitemap-universities.xml', status: 'valid', urls: 124 },
      { url: '/sitemap-courses.xml', status: 'valid', urls: 98 },
      { url: '/sitemap-blog.xml', status: 'warning', urls: 56 },
    ],
    competitors: [
      { name: 'IDP Education', da: 68, traffic: 95000 },
      { name: 'StudyPortals', da: 72, traffic: 120000 },
      { name: 'Y-Axis', da: 45, traffic: 35000 },
    ],
  };

  return NextResponse.json(auditData);
}
