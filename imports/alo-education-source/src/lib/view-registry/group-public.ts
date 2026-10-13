/**
 * Group A: Public-facing pages (about, contact, services, info, legal)
 * These are lightweight static/semi-static pages with minimal dependencies.
 */

export async function loadPublicView(view: string): Promise<{ component: React.ComponentType<any>; needsSlug?: boolean } | null> {
  let mod: any;
  switch (view) {
    case 'about':
      mod = await import('@/components/platform/about-page');
      return { component: mod.AboutPage };
    case 'contact':
      mod = await import('@/components/platform/contact-page');
      return { component: mod.ContactPage };
    case 'services':
      mod = await import('@/components/platform/services-page');
      return { component: mod.ServicesPage };
    case 'scholarships':
      mod = await import('@/components/platform/scholarships-page');
      return { component: mod.ScholarshipsPage };
    case 'info-center':
      mod = await import('@/components/platform/student-info-center');
      return { component: mod.StudentInfoCenter };
    case 'blog':
      mod = await import('@/components/platform/blog-page');
      return { component: mod.BlogPage };
    case 'success-stories':
      mod = await import('@/components/platform/success-stories-page');
      return { component: mod.SuccessStoriesPage };
    case 'faq':
      mod = await import('@/components/platform/faq-page');
      return { component: mod.FaqPage };
    case 'destinations':
      mod = await import('@/components/platform/destinations-page');
      return { component: mod.DestinationsPage };
    case 'universities':
      mod = await import('@/components/platform/universities-page');
      return { component: mod.UniversitiesPage };
    case 'resources':
      mod = await import('@/components/platform/resources-page');
      return { component: mod.ResourcesPage };
    case 'exams':
      mod = await import('@/components/platform/exams-page');
      return { component: mod.ExamsPage };
    case 'events':
      mod = await import('@/components/platform/events-page');
      return { component: mod.EventsPage };
    case 'news':
      mod = await import('@/components/platform/news-page');
      return { component: mod.NewsPage };
    case 'careers':
      mod = await import('@/components/platform/careers-page');
      return { component: mod.CareersPage };
    case 'partners':
      mod = await import('@/components/platform/partners-page');
      return { component: mod.PartnersPage };
    case 'country':
      mod = await import('@/components/alo/new/pages/country-page');
      return { component: mod.CountryPage, needsSlug: true };
    default:
      return null;
  }
}
