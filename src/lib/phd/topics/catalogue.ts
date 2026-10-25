import { BUSINESS_TOPIC_AREAS } from './catalogue-business';
import { ENGINEERING_TOPIC_AREAS } from './catalogue-engineering';
import type { TopicAreaSeed } from './catalogue-types';

export type { TopicAreaSeed, TopicProblemSeed } from './catalogue-types';

export const TOPIC_CATALOGUE: TopicAreaSeed[] = [
  ...BUSINESS_TOPIC_AREAS,
  ...ENGINEERING_TOPIC_AREAS,
];

const KNOWN_METHOD_CODES = new Set([
  'INTERVIEWS_THEMATIC', 'SURVEY_STATISTICS', 'CASE_STUDY', 'ARCHIVAL_SECONDARY',
  'ECONOMETRICS', 'EXPERIMENT_BEHAVIOURAL', 'MIXED_METHODS', 'DESIGN_SCIENCE',
  'LONGITUDINAL_COMPARATIVE', 'LAB_EXPERIMENT', 'PROTOTYPE_VALIDATION',
  'NUMERICAL_SIMULATION', 'FEA_CFD', 'FIELD_MEASUREMENT', 'MATERIALS_CHARACTERISATION',
  'CONTROL_SYSTEM', 'BENCHMARKING', 'RELIABILITY_OPTIMISATION', 'MIXED_COMPUTATIONAL_EXPERIMENTAL',
]);

export interface CatalogueValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Structural validation of the curated catalogue. This runs in tests and at
 * seed time so a malformed topic area can never reach the database.
 */
export function validateCatalogue(areas: TopicAreaSeed[] = TOPIC_CATALOGUE): CatalogueValidation {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const area of areas) {
    if (seen.has(area.code)) errors.push(`Duplicate area code ${area.code}`);
    seen.add(area.code);
    if (!/^(BUS|ENG)-[A-Z0-9-]+$/.test(area.code)) errors.push(`${area.code}: invalid code`);
    if (area.discipline === 'BUSINESS' && !area.code.startsWith('BUS-')) {
      errors.push(`${area.code}: business area must use BUS- prefix`);
    }
    if (area.discipline === 'ENGINEERING' && !area.code.startsWith('ENG-')) {
      errors.push(`${area.code}: engineering area must use ENG- prefix`);
    }
    if (area.problems.length < 2) errors.push(`${area.code}: at least two problems required`);
    if (area.keywords.length < 3) errors.push(`${area.code}: at least three keywords required`);
    if (area.theories.length < 1) errors.push(`${area.code}: at least one theory required`);
    if (area.methods.length < 1) errors.push(`${area.code}: at least one method required`);
    for (const code of area.methods) {
      if (!KNOWN_METHOD_CODES.has(code)) errors.push(`${area.code}: unknown method ${code}`);
    }
    if (!area.searchStrategy.trim()) errors.push(`${area.code}: search strategy required`);
    if (!area.ethics.trim()) errors.push(`${area.code}: ethics note required`);
  }
  return { valid: errors.length === 0, errors };
}

export function getTopicArea(code: string): TopicAreaSeed | undefined {
  return TOPIC_CATALOGUE.find((area) => area.code === code);
}

export const BUSINESS_AREA_COUNT = BUSINESS_TOPIC_AREAS.length;
export const ENGINEERING_AREA_COUNT = ENGINEERING_TOPIC_AREAS.length;
