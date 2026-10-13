import type { ArticleItem } from "@/components/site/sections/insights";
import type { ProjectItem } from "@/components/site/sections/ecosystem";
import type { ResourceItem } from "@/components/site/sections/resources";
import { PROFILE, NAV_LINKS, ECOSYSTEM } from "@/lib/site-data";

// Re-export types from section components so consumers can pass typed data
export type { ArticleItem } from "@/components/site/sections/insights";
export type { ProjectItem } from "@/components/site/sections/ecosystem";
export type { ResourceItem } from "@/components/site/sections/resources";

const BASE_URL = "https://alaminn.info";

/** Props accepted by the top-level <JsonLd /> component. */
export interface JsonLdProps {
  articles: ArticleItem[];
  projects: ProjectItem[];
  resources: ResourceItem[];
}

// ---------------------------------------------------------------------------
// Schema generators — each returns a plain object conforming to schema.org
// ---------------------------------------------------------------------------

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Alaminn.info",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.svg`,
    description:
      "Premium executive authority platform for Al Aminn — Executive Operations Leader, Sales Strategist, Education-Business Growth Specialist and AI-Powered Systems Builder",
    founder: {
      "@type": "Person",
      name: "Al Aminn",
      jobTitle:
        "Executive Operations Leader, Sales Strategist & AI-Powered Systems Builder",
      url: BASE_URL,
    },
    member: ECOSYSTEM.filter(
      (e) => e.status === "active" || e.status === "connected"
    ).map((entity) => ({
      "@type": "Organization",
      name: entity.name,
      description: entity.problem,
    })),
    sameAs: [] as string[],
  };
}

function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Al Aminn",
    url: BASE_URL,
    jobTitle:
      "Executive Operations Leader, Sales Strategist, Education-Business Growth Specialist and AI-Powered Systems Builder",
    worksFor: {
      "@type": "Organization",
      name: "Alaminn.info",
    },
    image: `${BASE_URL}/al-aminn-profile.jpg`,
    email: "hello@alaminn.info",
    description: PROFILE.supporting,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
    knowsLanguage: PROFILE.languages,
    knowsAbout: [
      "Business Operations",
      "Sales Strategy",
      "International Education",
      "University Partnerships",
      "AI Automation",
      "CRM Systems",
      "Digital Transformation",
      "Bangladesh Market",
    ],
    sameAs: [] as string[],
  };
}

function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Alaminn.info",
    url: BASE_URL,
    description: PROFILE.promise,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function breadcrumbSchema() {
  const items = [
    { name: "Home", url: BASE_URL },
    ...NAV_LINKS.map((link) => ({
      name: link.label,
      url: `${BASE_URL}${link.href}`,
    })),
  ];

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

function profilePageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${PROFILE.name} — ${PROFILE.platform}`,
    url: `${BASE_URL}#about`,
    description: PROFILE.supporting,
    mainEntity: {
      "@type": "Person",
      name: PROFILE.name,
      jobTitle: PROFILE.positioning,
      url: BASE_URL,
    },
  };
}

function articleSchemas(articles: ArticleItem[]) {
  return articles.map((article) => {
    const datePublished =
      typeof article.publishedAt === "string"
        ? article.publishedAt
        : article.publishedAt instanceof Date
          ? article.publishedAt.toISOString()
          : new Date().toISOString();

    // dateModified — only emitted if the article row carries updatedAt.
    // The ArticleItem type declares updatedAt as optional; page.tsx already
    // passes the full Prisma row (which includes updatedAt), so this is
    // populated for every real article and omitted cleanly otherwise.
    let dateModified: string | undefined;
    if (article.updatedAt) {
      dateModified =
        typeof article.updatedAt === "string"
          ? article.updatedAt
          : article.updatedAt instanceof Date
            ? article.updatedAt.toISOString()
            : undefined;
    }

    // keywords — schema.org expects either a string or an array of strings.
    // The Article model stores tags as a comma-separated string; split into
    // an array when present, otherwise fall back to the category.
    const keywords: string | string[] = article.tags
      ? article.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : article.category;

    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type":
        article.category === "executive-leadership" ? "Article" : "BlogPosting",
      headline: article.title,
      description: article.summary,
      articleBody: article.body || article.summary,
      author: {
        "@type": "Person",
        name: article.author || PROFILE.name,
        url: BASE_URL,
      },
      datePublished,
      dateModified,
      articleSection: article.category.replace(/-/g, " "),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${BASE_URL}#insights-${article.slug}`,
      },
      url: `${BASE_URL}#insights-${article.slug}`,
      // Personal site → publisher is the Person, not an Organization.
      publisher: {
        "@type": "Person",
        name: PROFILE.name,
        url: BASE_URL,
      },
      keywords,
      wordCount: article.readingMinutes
        ? article.readingMinutes * 250
        : undefined,
      inLanguage: "en",
    };

    // Strip undefined values so the JSON-LD payload stays clean.
    for (const key of Object.keys(schema)) {
      if (schema[key] === undefined) delete schema[key];
    }

    return schema;
  });
}

function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${PROFILE.name}`,
    url: `${BASE_URL}#contact`,
    description: `Get in touch with ${PROFILE.name} for partnerships, consultations, or collaboration inquiries.`,
    mainEntity: {
      "@type": "Person",
      name: PROFILE.name,
      jobTitle: PROFILE.positioning,
      url: BASE_URL,
      email: "hello@alaminn.info",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dhaka",
        addressCountry: "BD",
      },
    },
  };
}

function faqPageSchema() {
  const faqs = [
    {
      question:
        "How can universities partner with Al Aminn for Bangladesh market collaboration?",
      answer:
        "Al Aminn works with universities and education providers to understand the Bangladesh market, build recruitment operations and develop local partnership strategies. Reach out through the contact section to discuss collaboration.",
    },
    {
      question:
        "What services does Al Aminn offer for education businesses?",
      answer:
        "Al Aminn helps education businesses review and improve operations, counselling workflows, sales systems, CRM infrastructure and growth strategy — turning disconnected processes into structured, measurable systems.",
    },
    {
      question:
        "Can founders and businesses work with Al Aminn on growth and automation?",
      answer:
        "Yes. Al Aminn works with businesses and founders to structure operations, sales pipelines, CRM, automation, AI adoption and digital systems for scalable growth.",
    },
    {
      question: "What is the ALO ecosystem and how is it connected?",
      answer:
        "The ALO ecosystem is a connected group of platforms led by Al Aminn, including ALO Education (student services), ALO Labs (AI command center), English AI (language learning), ICLA Global Academy (curriculum), TECH360 (technology delivery) and Alaminn.info (executive platform). Each addresses a specific operational challenge.",
    },
    {
      question:
        "How does Al Aminn approach AI automation and governance?",
      answer:
        "AI adoption is governed through ALO Labs with approval routing, sensitivity tagging, human approval gates and audit logs. The workflow ensures controlled, secure and auditable AI use — never uncontrolled deployment.",
    },
    {
      question:
        "Where is Al Aminn based and what languages does he work in?",
      answer: `Al Aminn is based in ${PROFILE.location} and works in ${PROFILE.languages.join(" and ")}.`,
    },
  ];

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

function itemListSchema(
  projects: ProjectItem[],
  resources: ResourceItem[]
) {
  // Projects ItemList
  const projectsList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Projects & Ecosystem",
    description: "Platforms and projects within the ALO ecosystem.",
    numberOfItems: projects.length,
    itemListElement: projects.map((project, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: project.name,
      url: project.approvedUrl || `${BASE_URL}#projects-${project.slug}`,
      description: project.shortDescription,
    })),
  };

  // Resources ItemList
  const resourcesList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Resources & Guides",
    description:
      "Downloadable resources, guides and tools for operations, sales and growth.",
    numberOfItems: resources.length,
    itemListElement: resources.map((resource, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: resource.title,
      url: `${BASE_URL}#resources-${resource.slug}`,
      description: resource.description,
    })),
  };

  return [projectsList, resourcesList];
}

// ---------------------------------------------------------------------------
// Component — renders all schemas as <script type="application/ld+json">
// ---------------------------------------------------------------------------

export function JsonLd({ articles, projects, resources }: JsonLdProps) {
  const schemas: Record<string, unknown>[] = [
    organizationSchema(),
    personSchema(),
    websiteSchema(),
    breadcrumbSchema(),
    profilePageSchema(),
    contactPageSchema(),
    faqPageSchema(),
    ...articleSchemas(articles),
    ...itemListSchema(projects, resources),
  ];

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
