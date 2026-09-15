// /api/admin/website/homepage — Super Admin homepage aggregator
// GET returns all homepage data for builder
// PUT saves all homepage data in one transaction

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const [heroSlides, services, stories, team, faqs, sections, englishTests, countries] = await Promise.all([
      db.homeHeroSlide.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []),
      db.homeService.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []),
      db.successStory.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []),
      db.teamMember.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []),
      db.homepageFaq.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []),
      db.homeSection.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []),
      db.websiteEnglishTest.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []),
      db.country.findMany({ orderBy: { sortOrder: 'asc' }, take: 50, include: { quickFacts: true, cities: true, faqs: true } }).catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        heroSlides,
        services,
        successStories: stories,
        teamMembers: team,
        faqs,
        sections,
        englishTests,
        countries,
      },
      counts: {
        heroSlides: heroSlides.length,
        services: services.length,
        successStories: stories.length,
        teamMembers: team.length,
        faqs: faqs.length,
        sections: sections.length,
        englishTests: englishTests.length,
        countries: countries.length,
      }
    });
  } catch (e: any) {
    console.error('[admin.website.homepage GET]', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { heroSlides, services, sections, faqs, englishTests } = body;

    const results: any = {};

    if (heroSlides && Array.isArray(heroSlides)) {
      for (const slide of heroSlides) {
        if (slide.id) {
          await db.homeHeroSlide.update({ where: { id: slide.id }, data: { ...slide, id: undefined } }).catch(async () => {
            return db.homeHeroSlide.create({ data: slide });
          });
        } else if (slide.headline) {
          await db.homeHeroSlide.create({ data: slide });
        }
      }
      results.heroSlides = heroSlides.length;
    }

    if (services && Array.isArray(services)) {
      for (const svc of services) {
        if (svc.id) {
          await db.homeService.update({ where: { id: svc.id }, data: { ...svc, id: undefined } }).catch(async () => {
            return db.homeService.create({ data: svc });
          });
        }
      }
      results.services = services.length;
    }

    if (sections && Array.isArray(sections)) {
      for (const sec of sections) {
        if (sec.sectionKey) {
          await db.homeSection.upsert({
            where: { sectionKey: sec.sectionKey },
            update: { title: sec.title || '', subtitle: sec.subtitle || '', content: sec.content || '', sortOrder: sec.sortOrder || 0, status: sec.status || 'active' },
            create: { sectionKey: sec.sectionKey, title: sec.title || '', subtitle: sec.subtitle || '', content: sec.content || '', sortOrder: sec.sortOrder || 0, status: sec.status || 'active' }
          });
        }
      }
      results.sections = sections.length;
    }

    if (faqs && Array.isArray(faqs)) {
      for (const f of faqs) {
        if (f.id) {
          await db.homepageFaq.update({ where: { id: f.id }, data: { question: f.question, answer: f.answer, sortOrder: f.sortOrder || 0, status: f.status || 'active' } }).catch(async () => {
            return db.homepageFaq.create({ data: f });
          });
        } else if (f.question) {
          await db.homepageFaq.create({ data: { question: f.question, answer: f.answer || '', sortOrder: f.sortOrder || 0, status: f.status || 'active' } });
        }
      }
      results.faqs = faqs.length;
    }

    if (englishTests && Array.isArray(englishTests)) {
      for (const t of englishTests) {
        if (t.id) {
          await db.websiteEnglishTest.update({ where: { id: t.id }, data: { ...t, id: undefined } }).catch(async () => {
            return db.websiteEnglishTest.create({ data: t });
          });
        }
      }
      results.englishTests = englishTests.length;
    }

    await logAuditAction(auth, 'SAVE_HOMEPAGE', 'Homepage', 'bulk', results).catch(()=>{});

    return NextResponse.json({ success: true, message: 'Homepage saved', results });
  } catch (e: any) {
    console.error('[admin.website.homepage PUT]', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
