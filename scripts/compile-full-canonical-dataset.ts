import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ukUniversitiesPart1 } from '../src/lib/university-data-uk';
import { ukUniversitiesPart2 } from '../src/lib/university-data-uk2';
import { intlUniversities } from '../src/lib/university-data-intl';

console.log('===== COMPILING 325 UNIVERSITIES & 1,508 COURSES CANONICAL DATASET =====');

const allCatalogUnis = [...ukUniversitiesPart1, ...ukUniversitiesPart2, ...intlUniversities];
console.log(`Loaded catalog institutions count: ${allCatalogUnis.length}`);
