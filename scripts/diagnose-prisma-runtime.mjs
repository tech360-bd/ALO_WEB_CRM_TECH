/** Read-only evidence. No DB connections, installs, secrets or env values printed. */
import {createRequire} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import {platform,arch,release} from 'node:os';
const require=createRequire(import.meta.url);
const {getPlatformInfo}=require('@prisma/get-platform');
const names=['prisma','@prisma/client','@prisma/engines','@prisma/engines-version'];
const packages=Object.fromEntries(names.map(name=>[name,JSON.parse(readFileSync(`node_modules/${name}/package.json`,'utf8'))]));
const detected=await getPlatformInfo();
const commit=require('@prisma/engines-version').enginesVersion;
const {PrismaClient,Prisma}=require('@prisma/client');const db=new PrismaClient();
const overrides=['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','NO_PROXY','NODE_EXTRA_CA_CERTS','NODE_TLS_REJECT_UNAUTHORIZED','PRISMA_ENGINES_MIRROR','PRISMA_SCHEMA_ENGINE_BINARY','PRISMA_QUERY_ENGINE_LIBRARY','PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING'];
console.log(JSON.stringify({node:process.version,os:platform(),kernel:release(),architecture:arch(),platform:detected,packages:Object.fromEntries(names.map(name=>[name,packages[name].version])),declaredEngineWrapper:packages['@prisma/engines'].dependencies['@prisma/engines-version'],engineCommit:commit,generatedClient:{versions:Prisma.prismaVersion,provider:db._engineConfig.activeProvider,engineType:db._engineConfig.generator.config.engineType,binaryTargets:db._engineConfig.generator.binaryTargets.map(x=>x.value)},nativeSchemaEnginePresent:existsSync(`node_modules/@prisma/engines/schema-engine-${detected.binaryTarget}`),nativeQueryEnginePresent:existsSync(`node_modules/@prisma/engines/libquery_engine-${detected.binaryTarget}.so.node`),schemaEngineChecksumUrl:`https://binaries.prisma.sh/all_commits/${commit}/${detected.binaryTarget}/schema-engine.gz.sha256`,overridesPresent:Object.fromEntries(overrides.map(k=>[k,Boolean(process.env[k])])),databaseConfiguration:{applicationPresent:Boolean(process.env.DATABASE_URL),testPresent:Boolean(process.env.TEST_DATABASE_URL)}},null,2));
await db.$disconnect();
