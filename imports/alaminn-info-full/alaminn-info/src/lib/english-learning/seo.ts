/**
 * English Learning SEO helpers — Next.js Metadata + JSON-LD builders.
 * --------------------------------------------------------------------
 * Mirrors `src/lib/higher-study/seo.ts`. Builds:
 *  - Next.js 16 `Metadata` objects (title, description, canonical,
 *    OpenGraph, Twitter card, robots) for English Learning pages.
 *  - schema.org JSON-LD structured data for the Organization, courses,
 *    breadcrumbs and FAQs.
 */

import type { Metadata } from "next";

import type {
  BreadcrumbItem,
  Course,
  EnglishLearningMetadataOptions,
  FaqItem,
} from "@/lib/english-learning/types";

/** Root URL for canonical links and JSON-LD `@id` references. */
export const ENGLISH_LEARNING_BASE_URL = "https://alaminn.info";

/** Default OG image used by English Learning pages. */
export const ENGLISH_LEARNING_DEFAULT_OG_IMAGE =
  "https://alaminn.info/brand/portrait.jpg";

// ─── Next.js Metadata builder ────────────────────────────────────────

export function buildEnglishLearningMetadata(
  opts: EnglishLearningMetadataOptions,
): Metadata {
  const canonical = opts.path
    ? `${ENGLISH_LEARNING_BASE_URL}${opts.path}`
    : `${ENGLISH_LEARNING_BASE_URL}/english-learning`;

  const image = opts.image || ENGLISH_LEARNING_DEFAULT_OG_IMAGE;
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
 * Build a schema.org `Course` JSON-LD object for an English Learning
 * course detail page. Includes title, description, provider, level,
 * duration and a price offer if available.
 */
export function buildCourseJsonLd(course: Course): Record<string, unknown> {
  const url = `${ENGLISH_LEARNING_BASE_URL}/english-learning/courses/${course.slug}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${url}#course`,
    name: course.title,
    url,
    ...(course.summary ? { description: course.summary } : {}),
    ...(course.description ? { text: course.description } : {}),
    ...(course.durationWeeks
      ? {
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: `PT${course.durationWeeks * (course.hoursPerWeek || 4)}H`,
          },
        }
      : {}),
    educationalLevel: course.level,
  };

  jsonLd.provider = {
    "@type": "Organization",
    name: "Alaminn.info English Learning",
    url: `${ENGLISH_LEARNING_BASE_URL}/english-learning`,
  };

  if (course.officialSourceUrl) {
    jsonLd.sameAs = [course.officialSourceUrl];
  }

  if (course.priceUsd != null) {
    jsonLd.offers = {
      "@type": "Offer",
      price: String(course.priceUsd),
      priceCurrency: course.currency || "USD",
      url,
      availability: "https://schema.org/InStock",
    };
  }

  if (course.certificationType) {
    jsonLd.hasCredential = {
      "@type": "EducationalOccupationalCredential",
      name: course.certificationType,
      ...(course.passScore != null
        ? { recognizedBy: { "@type": "Organization", name: "Alaminn.info" } }
        : {}),
    };
  }

  return jsonLd;
}

/**
 * Build a schema.org `BreadcrumbList` JSON-LD object.
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
 * Build a schema.org `FAQPage` JSON-LD object.
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
 * Build a schema.org `Organization` JSON-LD object for the English
 * Learning platform. Used as the publisher reference on detail pages
 * and as a standalone block on the English Learning home page.
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${ENGLISH_LEARNING_BASE_URL}/english-learning#organization`,
    name: "Alaminn.info English Learning",
    url: `${ENGLISH_LEARNING_BASE_URL}/english-learning`,
    parentOrganization: {
      "@type": "Organization",
      name: "Alaminn.info",
      url: ENGLISH_LEARNING_BASE_URL,
    },
    logo: {
      "@type": "ImageObject",
      url: `${ENGLISH_LEARNING_BASE_URL}/logo.svg`,
    },
    description:
      "English Learning platform on Alaminn.info — IELTS, TOEFL, PTE, Duolingo, GRE and GMAT preparation courses, practice tests, 1:1 tutors and study resources, with referral handoff to ALO Education for paid course packages and tutor bookings.",
    knowsAbout: [
      "IELTS Academic preparation",
      "TOEFL iBT preparation",
      "PTE Academic preparation",
      "Duolingo English Test",
      "GRE Verbal",
      "GMAT Verbal",
      "Academic English",
      "English grammar",
      "English writing",
      "English speaking",
    ],
    areaServed: "Global",
    sameAs: [
      "https://aloeducation.com",
      "https://english.aloeducation.com",
      `${ENGLISH_LEARNING_BASE_URL}/higher-study`,
    ],
  };
}

// ─── Convenience: render JSON-LD as a script tag string ─────────────

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
