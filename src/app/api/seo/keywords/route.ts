import { NextRequest, NextResponse } from 'next/server';

// SEO Keyword Tracking API
// Supports GET (list keywords with filters) and POST (add/update keywords)

interface KeywordEntry {
  keyword: string;
  position: number;
  prevPosition: number;
  volume: number;
  difficulty: number;
  url: string;
  ctr: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

// Simulated keyword data (in production, this would come from a SEO API like Ahrefs/Semrush)
const KEYWORDS_DB: KeywordEntry[] = [
  { keyword: 'study in uk', position: 3, prevPosition: 5, volume: 18100, difficulty: 72, url: '/uk', ctr: 12.4, change: 2, trend: 'up' },
  { keyword: 'study in australia', position: 5, prevPosition: 7, volume: 14800, difficulty: 68, url: '/australia', ctr: 8.2, change: 2, trend: 'up' },
  { keyword: 'study in canada', position: 7, prevPosition: 6, volume: 12100, difficulty: 65, url: '/canada', ctr: 6.1, change: -1, trend: 'down' },
  { keyword: 'study abroad consultants', position: 2, prevPosition: 3, volume: 9900, difficulty: 58, url: '/services', ctr: 15.8, change: 1, trend: 'up' },
  { keyword: 'IELTS preparation', position: 4, prevPosition: 4, volume: 8100, difficulty: 45, url: '/exams/ielts', ctr: 9.5, change: 0, trend: 'stable' },
  { keyword: 'SOP writing tips', position: 1, prevPosition: 2, volume: 6600, difficulty: 35, url: '/resources/sop-guide', ctr: 22.1, change: 1, trend: 'up' },
  { keyword: 'student visa uk', position: 6, prevPosition: 8, volume: 5400, difficulty: 62, url: '/uk/visa', ctr: 7.3, change: 2, trend: 'up' },
  { keyword: 'scholarships for indian students', position: 8, prevPosition: 12, volume: 4400, difficulty: 55, url: '/scholarships', ctr: 4.8, change: 4, trend: 'up' },
  { keyword: 'MBA in UK', position: 3, prevPosition: 4, volume: 3600, difficulty: 60, url: '/uk/mba', ctr: 11.2, change: 1, trend: 'up' },
  { keyword: 'MS in Canada', position: 9, prevPosition: 11, volume: 2900, difficulty: 50, url: '/canada/ms', ctr: 3.9, change: 2, trend: 'up' },
  { keyword: 'education consultants near me', position: 12, prevPosition: 15, volume: 2400, difficulty: 40, url: '/contact', ctr: 2.8, change: 3, trend: 'up' },
  { keyword: 'university application deadline', position: 5, prevPosition: 5, volume: 2200, difficulty: 38, url: '/resources', ctr: 8.6, change: 0, trend: 'stable' },
  { keyword: 'study in germany free tuition', position: 15, prevPosition: 18, volume: 4100, difficulty: 52, url: '/germany', ctr: 1.4, change: 3, trend: 'up' },
  { keyword: 'duolingo english test accepted', position: 8, prevPosition: 6, volume: 3200, difficulty: 42, url: '/exams/duolingo', ctr: 5.2, change: -2, trend: 'down' },
  { keyword: 'post study work visa uk', position: 4, prevPosition: 5, volume: 2800, difficulty: 48, url: '/uk/psw', ctr: 10.5, change: 1, trend: 'up' },
  { keyword: 'study in new zealand', position: 6, prevPosition: 9, volume: 1800, difficulty: 35, url: '/new-zealand', ctr: 6.8, change: 3, trend: 'up' },
  { keyword: 'chevening scholarship', position: 2, prevPosition: 3, volume: 5200, difficulty: 55, url: '/scholarships/chevening', ctr: 18.3, change: 1, trend: 'up' },
  { keyword: 'PTE academic test', position: 11, prevPosition: 14, volume: 1600, difficulty: 38, url: '/exams/pte', ctr: 3.2, change: 3, trend: 'up' },
  { keyword: 'UK university ranking', position: 7, prevPosition: 8, volume: 3800, difficulty: 65, url: '/uk/rankings', ctr: 5.6, change: 1, trend: 'up' },
  { keyword: 'study abroad without ielts', position: 10, prevPosition: 13, volume: 2100, difficulty: 42, url: '/resources/no-ielts', ctr: 4.1, change: 3, trend: 'up' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const sortBy = searchParams.get('sortBy') || 'position';
  const order = searchParams.get('order') || 'asc';
  const minVolume = parseInt(searchParams.get('minVolume') || '0');
  const maxDifficulty = parseInt(searchParams.get('maxDifficulty') || '100');

  let results = KEYWORDS_DB.filter(kw => {
    if (search && !kw.keyword.toLowerCase().includes(search)) return false;
    if (kw.volume < minVolume) return false;
    if (kw.difficulty > maxDifficulty) return false;
    return true;
  });

  // Sort
  results.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'position': cmp = a.position - b.position; break;
      case 'volume': cmp = b.volume - a.volume; break;
      case 'difficulty': cmp = a.difficulty - b.difficulty; break;
      case 'change': cmp = b.change - a.change; break;
      default: cmp = a.position - b.position;
    }
    return order === 'asc' ? cmp : -cmp;
  });

  // Summary stats
  const summary = {
    totalKeywords: KEYWORDS_DB.length,
    top10Count: KEYWORDS_DB.filter(k => k.position <= 10).length,
    top3Count: KEYWORDS_DB.filter(k => k.position <= 3).length,
    improvedCount: KEYWORDS_DB.filter(k => k.change > 0).length,
    declinedCount: KEYWORDS_DB.filter(k => k.change < 0).length,
    stableCount: KEYWORDS_DB.filter(k => k.change === 0).length,
    avgPosition: parseFloat((KEYWORDS_DB.reduce((s, k) => s + k.position, 0) / KEYWORDS_DB.length).toFixed(1)),
    avgCtr: parseFloat((KEYWORDS_DB.reduce((s, k) => s + k.ctr, 0) / KEYWORDS_DB.length).toFixed(1)),
    totalVolume: KEYWORDS_DB.reduce((s, k) => s + k.volume, 0),
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    summary,
    keywords: results,
    count: results.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, url } = body;

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    // In production, this would add to database and trigger position tracking
    const newEntry: KeywordEntry = {
      keyword,
      position: 0, // Not yet tracked
      prevPosition: 0,
      volume: 0,
      difficulty: 0,
      url: url || '/',
      ctr: 0,
      change: 0,
      trend: 'stable',
    };

    return NextResponse.json({
      message: 'Keyword added to tracking',
      keyword: newEntry,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
