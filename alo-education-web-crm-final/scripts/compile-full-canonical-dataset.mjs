import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Load static dataset libraries
import { ukUniversitiesPart1 } from '../src/lib/university-data-uk.js';
import { ukUniversitiesPart2 } from '../src/lib/university-data-uk2.js';
import { intlUniversities } from '../src/lib/university-data-intl.js';

console.log('===== COMPILING 325 UNIVERSITIES & 1,508 COURSES CANONICAL DATASET =====');

// Combine catalog datasets
const allCatalogUnis = [...ukUniversitiesPart1, ...ukUniversitiesPart2, ...intlUniversities];
console.log(`Loaded catalog institutions: ${allCatalogUnis.length}`);
