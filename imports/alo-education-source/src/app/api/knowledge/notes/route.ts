import { NextRequest, NextResponse } from 'next/server';

// Knowledge Notes API
// Supports GET (list notes with filters) and POST (create note)

interface KnowledgeNote {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
}

// Simulated notes database
const NOTES_DB: KnowledgeNote[] = [
  { id: '1', title: 'Q1 SEO Strategy Plan', content: 'Focus on increasing organic traffic by 30% through:\n- Improve meta tags across all university pages\n- Add JSON-LD schema to course and scholarship pages\n- Create 15 new blog posts targeting long-tail keywords\n- Fix 14 broken internal links\n- Optimize Core Web Vitals (TTFB, INP)', category: 'Strategy', tags: ['seo', 'q1-2025', 'organic-traffic'], isPinned: true, createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-17T14:30:00Z', authorId: 'user-1', authorName: 'Mike Chen' },
  { id: '2', title: 'Content Calendar Ideas', content: 'Blog topics for January:\n1. Top 10 Scholarships for Indian Students in UK 2025\n2. IELTS vs TOEFL vs Duolingo: Which Test Should You Take?\n3. Student Visa Guide: UK Tier 4 Changes\n4. How to Write a Winning SOP\n5. Cost of Living Comparison: UK vs Australia vs Canada', category: 'Content', tags: ['blog', 'content-calendar', 'january'], isPinned: false, createdAt: '2025-01-14T09:00:00Z', updatedAt: '2025-01-14T09:00:00Z', authorId: 'user-2', authorName: 'Sarah Kim' },
  { id: '3', title: 'Competitor Analysis Notes', content: 'Key findings from competitor audit:\n- IDP has 5200 ranking keywords vs our 1240\n- StudyPortals dominates "study in [country]" terms\n- Leapscholar strong in IELTS/TOEFL content\n- Gap: We need more content on "free education" and "part-time jobs"\n- Opportunity: Duolingo English Test content is underserved', category: 'Research', tags: ['competitors', 'seo', 'analysis'], isPinned: true, createdAt: '2025-01-12T11:00:00Z', updatedAt: '2025-01-16T08:00:00Z', authorId: 'user-1', authorName: 'Mike Chen' },
  { id: '4', title: 'Weekly Marketing Sync Notes', content: 'Action items from 2025-01-13 sync:\n- Sarah: Update social media content calendar\n- Mike: Fix broken links in resources section\n- Priya: Draft scholarship schema markup\n- Rahul: A/B test new CTA on course pages\n- Review: Google Search Console data shows 12% traffic increase', category: 'Meetings', tags: ['weekly-sync', 'action-items'], isPinned: false, createdAt: '2025-01-13T16:00:00Z', updatedAt: '2025-01-13T17:00:00Z', authorId: 'user-3', authorName: 'Priya Sharma' },
  { id: '5', title: 'Schema Markup Implementation', content: 'Priority order for schema implementation:\n1. Course schema on all /courses/* pages\n2. ScholarshipOffer on /scholarships/* pages\n3. FAQPage on /faq and blog posts\n4. CollegeOrUniversity on university profiles\n5. BreadcrumbList on all pages\n\nTesting: Use Google Rich Results Test after each implementation', category: 'SEO', tags: ['schema', 'json-ld', 'technical-seo'], isPinned: true, createdAt: '2025-01-10T10:00:00Z', updatedAt: '2025-01-15T09:00:00Z', authorId: 'user-1', authorName: 'Mike Chen' },
  { id: '6', title: 'Video Content Strategy', content: 'Ideas for YouTube channel:\n- "Day in the Life" series for each destination country\n- Student interview series\n- Quick tips (60s): visa tips, SOP tips, scholarship tips\n- University campus tours (partner with universities)\n- Live Q&A sessions every Thursday', category: 'Ideas', tags: ['video', 'youtube', 'content-strategy'], isPinned: false, createdAt: '2025-01-08T14:00:00Z', updatedAt: '2025-01-08T14:00:00Z', authorId: 'user-2', authorName: 'Sarah Kim' },
];

const VALID_CATEGORIES = ['Strategy', 'SEO', 'Content', 'Meetings', 'Ideas', 'Research'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const category = searchParams.get('category') || 'All';
  const tag = searchParams.get('tag')?.toLowerCase() || '';
  const pinned = searchParams.get('pinned') === 'true';
  const sortBy = searchParams.get('sortBy') || 'updatedAt';
  const order = searchParams.get('order') || 'desc';

  let results = NOTES_DB.filter(note => {
    if (search && !note.title.toLowerCase().includes(search) && !note.content.toLowerCase().includes(search)) return false;
    if (category !== 'All' && note.category !== category) return false;
    if (tag && !note.tags.some(t => t.toLowerCase().includes(tag))) return false;
    if (pinned && !note.isPinned) return false;
    return true;
  });

  // Sort
  results.sort((a, b) => {
    // Pinned always first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    let cmp = 0;
    switch (sortBy) {
      case 'updatedAt': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
      case 'createdAt': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      case 'title': cmp = a.title.localeCompare(b.title); break;
      default: cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return order === 'desc' ? -cmp : cmp;
  });

  // Available tags
  const allTags = [...new Set(NOTES_DB.flatMap(n => n.tags))].sort();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    summary: {
      totalNotes: NOTES_DB.length,
      pinnedCount: NOTES_DB.filter(n => n.isPinned).length,
      categories: VALID_CATEGORIES,
      tags: allTags,
    },
    notes: results,
    count: results.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }

    const newNote: KnowledgeNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      category: category || 'Ideas',
      tags: Array.isArray(tags) ? tags : [],
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: 'current-user',
      authorName: 'Current User',
    };

    // In production, save to database
    NOTES_DB.push(newNote);

    return NextResponse.json({
      message: 'Note created successfully',
      note: newNote,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
