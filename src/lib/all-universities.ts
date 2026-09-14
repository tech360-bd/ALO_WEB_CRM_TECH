import { ukUniversitiesPart1 } from './university-data-uk';
import { ukUniversitiesPart2 } from './university-data-uk2';
import {
  usUniversities,
  canadaUniversities,
  australiaUniversities,
  germanyUniversities,
  malaysiaUniversities,
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
import {
  swedenUniversities,
  brazilUniversities,
  russiaUniversities,
  indiaUniversities,
  chinaUniversities,
  southAfricaUniversities
} from './university-data-brics';

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

// Slice to target counts: UK (140), USA (20), Canada (20), Australia (40), Ireland (20), New Zealand (20), Germany (20), Malaysia (20), Netherlands (20), UAE (20), France (20), Italy (20), Malta (20), Cyprus (20), South Korea (20), Sweden (20), Brazil (20), Russia (20), India (20), China (20), South Africa (20) — Every month Jan2027-Jan2028
const ukCombined = [...ukUniversitiesPart1, ...ukUniversitiesPart2].sort((a, b) => {
  const ra = (a.worldRanking as number) || 9999;
  const rb = (b.worldRanking as number) || 9999;
  // treat 0 as unranked -> put at end
  const va = ra === 0 ? 9999 : ra;
  const vb = rb === 0 ? 9999 : rb;
  return va - vb;
});
const slicedUk = ukCombined.slice(0, 140).map((u) => ({ ...u, country: 'United Kingdom' }));
const slicedUs = usUniversities.slice(0, 20).map((u) => ({ ...u, country: 'United States' }));
const slicedCanada = canadaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Canada' }));
const slicedAustralia = australiaUniversities.slice(0, 40).map((u) => ({ ...u, country: 'Australia' }));
const slicedGermany = germanyUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Germany' }));
const slicedMalaysia = malaysiaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Malaysia' }));
const slicedNetherlands = netherlandsUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Netherlands' }));
const slicedNewZealand = newZealandUniversities.slice(0, 20).map((u) => ({ ...u, country: 'New Zealand' }));
const slicedIreland = irelandUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Ireland' }));
const slicedUae = uaeUniversities.slice(0, 20).map((u) => ({ ...u, country: 'UAE' }));
const slicedFrance = franceUniversities.slice(0, 20).map((u) => ({ ...u, country: 'France' }));
const slicedItaly = italyUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Italy' }));
const slicedMalta = maltaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Malta' }));
const slicedCyprus = cyprusUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Cyprus' }));
const slicedSouthKorea = southKoreaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'South Korea' }));
const slicedSweden = swedenUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Sweden' }));
const slicedBrazil = brazilUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Brazil' }));
const slicedRussia = russiaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Russia' }));
const slicedIndia = indiaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'India' }));
const slicedChina = chinaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'China' }));
const slicedSouthAfrica = southAfricaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'South Africa' }));

const rawDataset: any[] = [
  ...slicedUk,
  ...slicedUs,
  ...slicedCanada,
  ...slicedAustralia,
  ...slicedIreland,
  ...slicedNewZealand,
  ...slicedGermany,
  ...slicedMalaysia,
  ...slicedUae,
  ...slicedFrance,
  ...slicedNetherlands,
  ...slicedItaly,
  ...slicedMalta,
  ...slicedCyprus,
  ...slicedSouthKorea,
  ...slicedSweden,
  ...slicedBrazil,
  ...slicedRussia,
  ...slicedIndia,
  ...slicedChina,
  ...slicedSouthAfrica
];

export const ALL_400_UNIVERSITIES: UniversityRecord[] = rawDataset.map((u) => ({
  ...u,
  slug: slugify(u.name),
}));
export const ALL_UNIVERSITIES = ALL_400_UNIVERSITIES; // alias for new count 560
export const TOTAL_UNIVERSITIES = ALL_400_UNIVERSITIES.length;

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

