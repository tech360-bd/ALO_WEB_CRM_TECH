import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
try {
  const { Prisma } = require('@prisma/client');
  if (!Prisma?.dmmf?.datamodel?.models?.length) throw new Error('Prisma model metadata is missing');
  const declaration = readFileSync(require.resolve('.prisma/client/index.d.ts'), 'utf8');
  if (/export\s+declare\s+const\s+PrismaClient\s*:\s*any/.test(declaration)) {
    throw new Error('PrismaClient is the ungenerated any-typed placeholder');
  }
  const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
  const expected = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map(match => match[1]);
  const generated = new Set(Prisma.dmmf.datamodel.models.map(model => model.name));
  if (expected.length !== generated.size || expected.some(name => !generated.has(name))) {
    throw new Error('Generated Prisma model list does not match schema');
  }
  console.log(`Verified generated Prisma client: ${generated.size} models`);
} catch (error) {
  console.error(`Prisma client verification failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  console.error('Run npm run db:generate successfully before typecheck/build. A placeholder client is not type safety.');
  process.exitCode = 1;
}
