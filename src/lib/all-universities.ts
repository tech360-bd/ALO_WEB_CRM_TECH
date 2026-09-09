import { ukUniversitiesPart1 } from './university-data-uk';
import { ukUniversitiesPart2 } from './university-data-uk2';
import {
  usUniversities,
  canadaUniversities,
  australiaUniversities,
  germanyUniversities,
  newZealandUniversities,
  irelandUniversities,
  netherlandsUniversities
} from './university-data-intl';
import {
  uaeUniversities,
  franceUniversities,
  italyUniversities,
  maltaUniversities,
  cyprusUniversities,
  southKoreaUniversities
} from './university-data-extended';

export interface UniversityRecord {
  name: string;
  slug: string;
  city: string;
  country: string;
  worldRanking?: number;
  founded?: number;
  type?: string;
  ieltsMin?: number;
  tuitionRange?: string;
  intlStudents?: string;
  totalStudents?: string;
  scholarships?: boolean;
  featured?: boolean;
  website?: string;
  subjects?: string[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Slice to target counts: UK (140), USA (20), Canada (20), Australia (20), Ireland (20), New Zealand (20), Germany (20), Netherlands (20), UAE (20), France (20), Italy (20), Malta (20), Cyprus (20), South Korea (20)
const ukCombined = [...ukUniversitiesPart1, ...ukUniversitiesPart2];
const slicedUk = ukCombined.slice(0, 140).map((u) => ({ ...u, country: 'United Kingdom' }));
const slicedUs = usUniversities.slice(0, 20).map((u) => ({ ...u, country: 'United States' }));
const slicedCanada = canadaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Canada' }));
const slicedAustralia = australiaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Australia' }));
const slicedGermany = germanyUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Germany' }));
const slicedNetherlands = netherlandsUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Netherlands' }));
const slicedNewZealand = newZealandUniversities.slice(0, 20).map((u) => ({ ...u, country: 'New Zealand' }));
const slicedIreland = irelandUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Ireland' }));
const slicedUae = uaeUniversities.slice(0, 20).map((u) => ({ ...u, country: 'UAE' }));
const slicedFrance = franceUniversities.slice(0, 20).map((u) => ({ ...u, country: 'France' }));
const slicedItaly = italyUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Italy' }));
const slicedMalta = maltaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Malta' }));
const slicedCyprus = cyprusUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Cyprus' }));
const slicedSouthKorea = southKoreaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'South Korea' }));

const rawDataset: any[] = [
  ...slicedUk,
  ...slicedUs,
  ...slicedCanada,
  ...slicedAustralia,
  ...slicedIreland,
  ...slicedNewZealand,
  ...slicedGermany,
  ...slicedUae,
  ...slicedFrance,
  ...slicedNetherlands,
  ...slicedItaly,
  ...slicedMalta,
  ...slicedCyprus,
  ...slicedSouthKorea
];

export const ALL_400_UNIVERSITIES: UniversityRecord[] = rawDataset.map((u) => ({
  ...u,
  slug: slugify(u.name),
}));

export function getAllUniversities(): UniversityRecord[] {
  return ALL_400_UNIVERSITIES;
}

export function getAllUniversitySlugs(): { slug: string }[] {
  return ALL_400_UNIVERSITIES.map((u) => ({ slug: u.slug }));
}

export function getUniversityBySlug(slug: string): UniversityRecord | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().trim();
  return (
    ALL_400_UNIVERSITIES.find((u) => u.slug === clean) ||
    ALL_400_UNIVERSITIES.find(
      (u) =>
        u.name.toLowerCase() === clean.replace(/-/g, ' ') ||
        slugify(u.name) === clean
    )
  );
}

