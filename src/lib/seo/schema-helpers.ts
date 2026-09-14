// SEO Schema helpers — Article / Breadcrumb / FAQPage / Organization
// FAQPage kept for Bing/AI parsers; Google Search no longer shows FAQ rich results since 7 May 2026.
// Use Schema.org Validator, not Rich Results Test, for FAQ validation.

export interface FAQItem { question: string; answer: string }

export function articleSchema(opts: {
  headline: string;
  description: string;
  slug: string;
  datePublished: string; // ISO
  dateModified?: string;
  authorName?: string;
  imageUrl?: string;
  baseUrl?: string;
}) {
  const base = (opts.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://aloeducation.com").replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline.slice(0, 110),
    description: opts.description.slice(0, 160),
    image: opts.imageUrl ? [opts.imageUrl] : undefined,
    author: { "@type": "Organization", name: opts.authorName || "ALO Education" },
    publisher: {
      "@type": "Organization",
      name: "ALO Education",
      logo: { "@type": "ImageObject", url: `${base}/logo.png` },
    },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    mainEntityOfPage: `${base}/blog/${opts.slug}`,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[], baseUrl?: string) {
  const base = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://aloeducation.com").replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${base}${it.url}`,
    })),
  };
}

export function faqPageSchema(faqs: FAQItem[]) {
  if (!faqs?.length) return null;
  // Note: Google Search discontinued FAQ rich results 7 May 2026; this remains valid Schema.org and useful for Bing/AI.
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function organizationSchema(baseUrl?: string) {
  const base = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://aloeducation.com").replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "ALO Education",
    url: base,
    logo: `${base}/logo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "68/69 Green Road, Concept Tower, Suite 347 (2nd Floor)",
      addressLocality: "Panthapath, Dhaka",
      postalCode: "1205",
      addressCountry: "BD",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+8801327189194",
      contactType: "customer service",
      availableLanguage: ["en", "bn"],
    },
    sameAs: [
      // fill when verified
      // "https://www.facebook.com/aloeducation",
      // "https://www.linkedin.com/company/alo-education",
    ],
  };
}
