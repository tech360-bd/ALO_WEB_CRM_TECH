/**
 * Group B: Legal/policy pages + detail pages (course-detail, university-detail)
 * These are light pages with minimal shared dependencies.
 */

export async function loadLegalView(view: string): Promise<{ component: React.ComponentType<any>; needsSlug?: boolean } | null> {
  let mod: any;
  switch (view) {
    case 'terms':
      mod = await import('@/components/platform/terms-page');
      return { component: mod.TermsPage };
    case 'privacy':
      mod = await import('@/components/platform/privacy-page');
      return { component: mod.PrivacyPage };
    case 'cookie-policy':
      mod = await import('@/components/platform/cookie-policy-page');
      return { component: mod.CookiePolicyPage };
    case 'course-detail':
      mod = await import('@/components/alo/new/course-finder/course-detail');
      return { component: mod.CourseDetail, needsSlug: true };
    case 'university-detail':
      mod = await import('@/components/alo/new/course-finder/university-detail');
      return { component: mod.UniversityDetail, needsSlug: true };
    case 'app-communication':
      mod = await import('@/components/alo/new/communication/application-communication');
      return { component: mod.ApplicationCommunication };
    default:
      return null;
  }
}
