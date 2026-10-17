/**
 * ALO Education Shared Image Mapping & Fallback System
 * This file contains structured mapping of courses, services, timeline steps,
 * destinations, and benefits to high-quality optimized visual assets.
 */

/**
 * Photographic destination cards — real landmark photography stored locally
 * (London, Sydney, Toronto, New York, Dublin, Auckland, Dubai). Prefer these
 * for image-led cards and heroes; the wide "hero-banners" graphics remain
 * only as fallbacks for destinations without a photographic card.
 */
export const DESTINATION_CARD_IMAGES: Record<string, string> = {
  uk: '/images/cards/uk.png',
  'united-kingdom': '/images/cards/uk.png',
  usa: '/images/cards/usa.png',
  'united-states': '/images/cards/usa.png',
  canada: '/images/cards/canada.png',
  australia: '/images/cards/australia.png',
  ireland: '/images/cards/ireland.png',
  'new-zealand': '/images/cards/new-zealand.png',
  dubai: '/images/cards/dubai.png',
  'dubai-uae': '/images/cards/dubai.png',
};

export function destinationCardImage(slug: string, fallback?: string): string {
  return DESTINATION_CARD_IMAGES[slug.toLowerCase()] || fallback || '/images/cards/uk.png';
}

export const IMAGES = {
  // Course/subject related images
  courses: {
    business: '/images/landing/Copy of marvin-meyer-SYTO3xs06fU-unsplash.webp',
    computerScience: '/images/landing/Copy of 2148431342.webp',
    engineering: '/images/landing/Copy of pexels-yankrukov-8199562.webp',
    dataScience: '/images/landing/Copy of 167794.webp',
    cybersecurity: '/images/landing/Copy of pexels-george-pak-7972967.webp',
    healthcare: '/images/landing/Copy of pexels-otherme-583475.webp',
    law: '/images/landing/Copy of pexels-rdne-7092573.webp',
    humanities: '/images/landing/Copy of brooke-cagle-g1Kr4Ozfoac-unsplash.webp',
    socialScience: '/images/landing/Copy of pexels-rdne-7683897.webp',
    naturalScience: '/images/landing/Copy of pexels-jaksonmartins-3101504.webp',
    default: '/images/landing/Copy of 20250902_1557_Smiling Study Partners_remix_01k44xnmncf91b70zs3ewff8kg.webp'
  },
  
  // Service related images
  services: {
    counseling: '/images/landing/Copy of 20250902_1557_Smiling Study Partners_remix_01k44xnmncf91b70zs3ewff8kg.webp',
    selection: '/images/landing/Copy of marvin-meyer-SYTO3xs06fU-unsplash.webp',
    application: '/images/landing/Copy of pexels-george-pak-7972967.webp',
    scholarship: '/images/landing/Copy of 20250902_1604_Team Celebrating Success_remix_01k44y1phqff4adx4kcap3cdyw.webp',
    visa: '/images/landing/Copy of pexels-rdne-7092364.webp',
    departure: '/images/landing/Copy of pexels-yankrukov-8199166.webp',
    accommodation: '/images/landing/Copy of 20250902_1607_Joyful Park Conversation_remix_01k44y8qqzf1fak3kphqyhmj6w.webp',
    financial: '/images/landing/Copy of pexels-yankrukov-8199562.webp',
    career: '/images/landing/Copy of pexels-rdne-7683897.webp',
    default: '/images/landing/Hero Image.webp'
  },

  // Destination banners
  destinations: {
    uk: '/images/hero-banners/UK slide Banner.webp',
    usa: '/images/hero-banners/USA slide Banner.webp',
    canada: '/images/hero-banners/Canada slide Banner.webp',
    australia: '/images/hero-banners/Australia slide Banner.webp',
    newZealand: '/images/hero-banners/New Zealand slide Banner.webp',
    europe: '/images/hero-banners/Europe slide Banner.webp',
    germany: '/images/hero-banners/Europe slide Banner.webp',
    ireland: '/images/hero-banners/Europe slide Banner.webp',
    dubai: '/images/hero-banners/Europe slide Banner.webp',
    default: '/images/hero-banners/UK slide Banner.webp'
  },

  // Why choose us section - 12 unique cards
  whyChoose: [
    '/images/landing/Copy of 20250902_1557_Smiling Study Partners_remix_01k44xnmncf91b70zs3ewff8kg.webp',
    '/images/landing/Copy of marvin-meyer-SYTO3xs06fU-unsplash.webp',
    '/images/landing/Copy of 2148431342.webp',
    '/images/landing/Copy of 20250902_1604_Team Celebrating Success_remix_01k44y1phqff4adx4kcap3cdyw.webp',
    '/images/landing/Copy of pexels-rdne-7092364.webp',
    '/images/landing/Copy of pexels-yankrukov-8199166.webp',
    '/images/landing/Copy of 20250902_1607_Joyful Park Conversation_remix_01k44y8qqzf1fak3kphqyhmj6w.webp',
    '/images/landing/Copy of pexels-yankrukov-8199562.webp',
    '/images/landing/Copy of pexels-rdne-7683897.webp',
    '/images/landing/Copy of pexels-jaksonmartins-3101504.webp',
    '/images/landing/Copy of brooke-cagle-g1Kr4Ozfoac-unsplash.webp',
    '/images/landing/Copy of pexels-otherme-583475.webp'
  ],

  // Journey steps - 12 steps
  journeySteps: [
    '/images/landing/Copy of 20250902_1557_Smiling Study Partners_remix_01k44xnmncf91b70zs3ewff8kg.webp',
    '/images/landing/Copy of marvin-meyer-SYTO3xs06fU-unsplash.webp',
    '/images/landing/Copy of 2148431342.webp',
    '/images/landing/Copy of 20250902_1604_Team Celebrating Success_remix_01k44y1phqff4adx4kcap3cdyw.webp',
    '/images/landing/Copy of pexels-rdne-7092364.webp',
    '/images/landing/Copy of pexels-yankrukov-8199166.webp',
    '/images/landing/Copy of 20250902_1607_Joyful Park Conversation_remix_01k44y8qqzf1fak3kphqyhmj6w.webp',
    '/images/landing/Copy of pexels-yankrukov-8199562.webp',
    '/images/landing/Copy of pexels-rdne-7683897.webp',
    '/images/landing/Copy of pexels-jaksonmartins-3101504.webp',
    '/images/landing/Copy of brooke-cagle-g1Kr4Ozfoac-unsplash.webp',
    '/images/landing/Copy of pexels-otherme-583475.webp'
  ]
};

/**
 * Gets a unique image for a study course based on keywords in title/subject
 */
export function getCourseImage(subject: string = ''): string {
  const s = subject.toLowerCase();
  if (s.includes('comput') || s.includes('soft') || s.includes('tech') || s.includes('cyber') || s.includes('code')) {
    return IMAGES.courses.computerScience;
  }
  if (s.includes('data') || s.includes('analyt') || s.includes('stat') || s.includes('math')) {
    return IMAGES.courses.dataScience;
  }
  if (s.includes('business') || s.includes('mba') || s.includes('manage') || s.includes('admin') || s.includes('market') || s.includes('finance') || s.includes('account')) {
    return IMAGES.courses.business;
  }
  if (s.includes('engine') || s.includes('mechan') || s.includes('electr') || s.includes('civil') || s.includes('construct')) {
    return IMAGES.courses.engineering;
  }
  if (s.includes('health') || s.includes('medic') || s.includes('nurs') || s.includes('pharm') || s.includes('bio')) {
    return IMAGES.courses.healthcare;
  }
  if (s.includes('law') || s.includes('legal') || s.includes('court') || s.includes('crim')) {
    return IMAGES.courses.law;
  }
  if (s.includes('art') || s.includes('design') || s.includes('media') || s.includes('journal') || s.includes('communic') || s.includes('architect')) {
    return IMAGES.courses.humanities;
  }
  if (s.includes('psych') || s.includes('soci') || s.includes('educ') || s.includes('teach')) {
    return IMAGES.courses.socialScience;
  }
  return IMAGES.courses.default;
}

/**
 * Gets a unique service image based on service slug or title keywords
 */
export function getServiceImage(slug: string = '', title: string = ''): string {
  const s = (slug + ' ' + title).toLowerCase();
  if (s.includes('counsel') || s.includes('personal')) return IMAGES.services.counseling;
  if (s.includes('select') || s.includes('choos')) return IMAGES.services.selection;
  if (s.includes('apply') || s.includes('applic') || s.includes('document')) return IMAGES.services.application;
  if (s.includes('scholar') || s.includes('fund') || s.includes('aid')) return IMAGES.services.scholarship;
  if (s.includes('visa') || s.includes('checklist') || s.includes('immig')) return IMAGES.services.visa;
  if (s.includes('depart') || s.includes('travel') || s.includes('brief')) return IMAGES.services.departure;
  if (s.includes('accom') || s.includes('hous') || s.includes('stay')) return IMAGES.services.accommodation;
  if (s.includes('bank') || s.includes('financ') || s.includes('loan') || s.includes('money')) return IMAGES.services.financial;
  if (s.includes('career') || s.includes('job') || s.includes('placement') || s.includes('work')) return IMAGES.services.career;
  return IMAGES.services.default;
}

/**
 * Gets a unique destination image based on country name
 */
export function getDestinationImage(country: string = ''): string {
  const c = country.toLowerCase();
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('brit')) return IMAGES.destinations.uk;
  if (c.includes('us') || c.includes('united states') || c.includes('america')) return IMAGES.destinations.usa;
  if (c.includes('canada')) return IMAGES.destinations.canada;
  if (c.includes('australia')) return IMAGES.destinations.australia;
  if (c.includes('new zealand') || c.includes('nz')) return IMAGES.destinations.newZealand;
  if (c.includes('germany')) return IMAGES.destinations.germany;
  if (c.includes('ireland')) return IMAGES.destinations.ireland;
  if (c.includes('dubai') || c.includes('uae') || c.includes('emirates')) return IMAGES.destinations.dubai;
  return IMAGES.destinations.europe;
}

/**
 * Returns a fallback campus/university image based on university name/id
 */
export function getUniversityCampusImage(uniId: string = '', name: string = ''): string {
  // Hash the name to pick a stable index from whyChoose image list to ensure uniqueness
  const key = uniId + name;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % IMAGES.whyChoose.length;
  return IMAGES.whyChoose[idx];
}
