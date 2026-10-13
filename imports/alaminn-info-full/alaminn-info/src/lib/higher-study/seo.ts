/**
 * Higher Study SEO helpers — Next.js Metadata + JSON-LD builders.
 * --------------------------------------------------------------------
 * Builds:
 *  - Next.js 16 `Metadata` objects (title, description, canonical,
 *    OpenGraph, Twitter card, robots, alternates) for Higher Study pages.
 *  - schema.org JSON-LD structured data for universities, courses,
 *    scholarships, breadcrumbs, FAQs and the Alaminn.info Organization.
 *
 * All canonical URLs are absolute (Next.js requires `alternates.canonical`
 * to be a URL or URL object) and rooted at `https://alaminn.info`.
 *
 * The structured-data builders return plain objects (no React); the
 * calling page wraps them in `<script type="application/ld+json">`.
 */

import type { Metadata } from "next";

import type {
  BreadcrumbItem,
  Course,
  FaqItem,
  HigherStudyMetadataOptions,
  Scholarship,
  University,
} from "@/lib/higher-study/types";

/** Root URL for canonical links and JSON-LD `@id` references. */
export const HIGHER_STUDY_BASE_URL = "https://alaminn.info";

/** Default OG image used by Higher Study pages if none is provided. */
export const HIGHER_STUDY_DEFAULT_OG_IMAGE =
  "https://alaminn.info/brand/portrait.jpg";

// ─── Next.js Metadata builder ────────────────────────────────────────

/**
 * Build a Next.js `Metadata` object for a Higher Study page. Sets title
 * (with the `%s · Al Aminn` template applied by the root layout),
 * description, canonical URL, OpenGraph, Twitter card, robots directives
 * and hreflang alternates.
 *
 * Pass `noindex: true` for staged / draft pages (e.g. comparison views
 * that depend on session state) to keep them out of the index.
 */
export function buildHigherStudyMetadata(
  opts: HigherStudyMetadataOptions,
): Metadata {
  const canonical = opts.path
    ? `${HIGHER_STUDY_BASE_URL}${opts.path}`
    : HIGHER_STUDY_BASE_URL;

  const image = opts.image || HIGHER_STUDY_DEFAULT_OG_IMAGE;
  const type = opts.type || "website";

  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: canonical,
      siteName: "Alaminn.info",
      type,
      locale: "en_US",
      images: [
        {
          url: image,
          width: 1280,
          height: 720,
          alt: opts.title,
        },
      ],
      ...(type === "article" && opts.publishedTime
        ? { publishedTime: opts.publishedTime }
        : {}),
      ...(type === "article" && opts.modifiedTime
        ? { modifiedTime: opts.modifiedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
    robots: opts.noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
  };
}

// ─── JSON-LD builders ────────────────────────────────────────────────

/**
 * Build a schema.org `CollegeOrUniversity` JSON-LD object for a
 * Higher Study university detail page. Includes name, URL, logo,
 * website, founding date (if known), address (country/city) and
 * department list (when available).
 */
export function buildUniversityJsonLd(university: University): Record<string, unknown> {
  const url = `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${university.slug}`;
  const sameAs: string[] = [];
  if (university.officialWebsite) sameAs.push(university.officialWebsite);
  if (university.officialSourceUrl) sameAs.push(university.officialSourceUrl);

  const address: Record<string, unknown> = { "@type": "PostalAddress" };
  if (university.country?.name) address.addressCountry = university.country.name;
  if (university.city?.name) address.addressLocality = university.city.name;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "@id": `${url}#university`,
    name: university.officialName,
    url,
    ...(university.logoUrl ? { logo: { "@type": "ImageObject", url: university.logoUrl } } : {}),
    ...(university.officialWebsite ? { sameAs } : {}),
    ...(university.establishedYear
      ? { foundingDate: String(university.establishedYear) }
      : {}),
    ...(university.overview ? { description: university.overview } : {}),
    ...(university.institutionType
      ? { additionalType: university.institutionType }
      : {}),
  };

  if (Object.keys(address).length > 1) {
    jsonLd.address = address;
  }

  // Parse rankings if available.
  if (university.rankingsJson) {
    try {
      const rankings = JSON.parse(university.rankingsJson) as Array<{
        provider?: string;
        rank?: string | number;
        year?: string | number;
        source?: string;
      }>;
      if (Array.isArray(rankings) && rankings.length > 0) {
        jsonLd.award = rankings
          .filter((r) => r.provider && r.rank)
          .map((r) => `${r.provider} ${r.rank}${r.year ? ` (${r.year})` : ""}`);
      }
    } catch {
      // Malformed rankings JSON — silently drop, do not poison the JSON-LD.
    }
  }

  return jsonLd;
}

/**
 * Build a schema.org `Course` JSON-LD object for a Higher Study course
 * detail page. Includes the course title, description, provider
 * (university), duration, study mode and a link to the official page.
 */
export function buildCourseJsonLd(course: Course): Record<string, unknown> {
  const url = `${HIGHER_STUDY_BASE_URL}/higher-study/courses/${course.slug}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${url}#course`,
    name: course.title,
    url,
    ...(course.overview ? { description: course.overview } : {}),
    ...(course.qualification ? { hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: course.studyMode || "onsite",
      ...(course.duration ? { courseWorkload: course.duration } : {}),
    } } : {}),
  };

  if (course.university) {
    jsonLd.provider = {
      "@type": "CollegeOrUniversity",
      name: course.university.officialName,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${course.university.slug}`,
      ...(course.university.logoUrl
        ? { logo: { "@type": "ImageObject", url: course.university.logoUrl } }
        : {}),
    };
  } else {
    jsonLd.provider = {
      "@type": "Organization",
      name: "Higher Study Platform",
      url: HIGHER_STUDY_BASE_URL,
    };
  }

  if (course.officialSourceUrl) {
    jsonLd.sameAs = [course.officialSourceUrl];
  }

  if (course.tuitionFee != null) {
    jsonLd.offers = {
      "@type": "Offer",
      price: String(course.tuitionFee),
      priceCurrency: course.tuitionCurrency || "USD",
      url,
      availability: "https://schema.org/InStock",
    };
  }

  return jsonLd;
}

/**
 * Build a schema.org `Article` JSON-LD object for a Higher Study
 * scholarship detail page. There is no dedicated schema.org type for
 * scholarships, so we use `Article` with an `about` field describing
 * the funding opportunity. Includes the scholarship name, description,
 * provider, application deadline and a link to the official page.
 */
export function buildScholarshipJsonLd(
  scholarship: Scholarship,
): Record<string, unknown> {
  const url = `${HIGHER_STUDY_BASE_URL}/higher-study/scholarships/${scholarship.slug}`;
  const datePublished = scholarship.createdAt.toISOString();
  const dateModified = scholarship.updatedAt.toISOString();

  const about: Record<string, unknown> = {
    "@type": "Thing",
    name: scholarship.name,
    ...(scholarship.eligibilityCriteria
      ? { description: scholarship.eligibilityCriteria }
      : {}),
  };

  if (scholarship.fundingType) {
    about.identifier = scholarship.fundingType;
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#scholarship`,
    headline: scholarship.name,
    url,
    ...(scholarship.eligibilityCriteria
      ? { description: scholarship.eligibilityCriteria }
      : {}),
    ...(scholarship.fundingAmount ? { articleBody: scholarship.fundingAmount } : {}),
    about,
    datePublished,
    dateModified,
    inLanguage: "en",
    author: {
      "@type": "Organization",
      name: "Alaminn.info Higher Study",
      url: HIGHER_STUDY_BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Alaminn.info",
      url: HIGHER_STUDY_BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${HIGHER_STUDY_BASE_URL}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  if (scholarship.provider) {
    jsonLd.contributor = {
      "@type": "Organization",
      name: scholarship.provider,
    };
  }

  if (scholarship.university) {
    jsonLd.mentions = {
      "@type": "CollegeOrUniversity",
      name: scholarship.university.officialName,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/universities/${scholarship.university.slug}`,
    };
  }

  if (scholarship.deadline) {
    jsonLd.expires = scholarship.deadline.toISOString();
  }

  if (scholarship.officialSourceUrl) {
    jsonLd.sameAs = [scholarship.officialSourceUrl];
  }

  return jsonLd;
}

/**
 * Build a schema.org `BreadcrumbList` JSON-LD object from an ordered
 * list of breadcrumb items. The first item should usually be the
 * Higher Study home (`/higher-study`).
 */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Build a schema.org `FAQPage` JSON-LD object from a list of FAQs.
 * Each entry becomes a `Question` with an `acceptedAnswer`.
 */
export function buildFaqJsonLd(faqs: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Build a schema.org `Organization` JSON-LD object for the Alaminn.info
 * Higher Study platform. Used as the publisher reference on detail
 * pages and as a standalone block on the Higher Study home page.
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${HIGHER_STUDY_BASE_URL}/higher-study#organization`,
    name: "Alaminn.info Higher Study",
    url: `${HIGHER_STUDY_BASE_URL}/higher-study`,
    parentOrganization: {
      "@type": "Organization",
      name: "Alaminn.info",
      url: HIGHER_STUDY_BASE_URL,
    },
    logo: {
      "@type": "ImageObject",
      url: `${HIGHER_STUDY_BASE_URL}/logo.svg`,
    },
    description:
      "Higher Study platform on Alaminn.info — verified university, course, scholarship, PhD and supervisor information across 30 study destinations, with referral handoff to ALO Education for application processing.",
    knowsAbout: [
      "International higher education",
      "University applications",
      "Scholarships",
      "PhD and research opportunities",
      "Academic supervisors",
      "Study destinations",
      "IELTS, PTE, TOEFL English proficiency",
    ],
    areaServed: "Global",
    sameAs: [
      "https://aloeducation.com",
      "https://english.aloeducation.com",
    ],
  };
}

// ─── Convenience: render JSON-LD as a script tag string ─────────────

/**
 * Serialise one or more JSON-LD objects into a single string suitable
 * for embedding inside a `<script type="application/ld+json">` tag's
 * `dangerouslySetInnerHTML` prop. Multiple objects are wrapped in a
 * `@graph` array.
 */
export function serializeJsonLd(
  objects: Record<string, unknown> | Record<string, unknown>[],
): string {
  const arr = Array.isArray(objects) ? objects : [objects];
  if (arr.length === 1) return JSON.stringify(arr[0]);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": arr,
  });
}
