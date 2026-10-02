/**
 * Regression tests for scripts/ai-workforce/emit-ddl.mjs.
 *
 * Context: the verification-mirror Prisma Client is generated with
 * `engineType = "client"` (query compiler). Such clients expose a *minimal*
 * DMMF — scalar fields carry only `name`/`kind`/`type`. Emitting DDL from that
 * DMMF produced tables with no PRIMARY KEY, no NOT NULL, no defaults and no
 * single-column UNIQUE indexes. The DDL still applied cleanly (524 tables,
 * 0 failures) and only failed much later, at the first `upsert`, with
 * "ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint".
 *
 * These tests lock in the two fixes:
 *   1. `assertFullDmmf` refuses a degraded DMMF loudly.
 *   2. field-level `@unique` is parsed from the schema text, so it survives
 *      regardless of what the generated client reports.
 */
import { describe, it, expect } from 'vitest';
// @ts-expect-error -- plain ESM script without type declarations
import { parseBlockAttributes, assertFullDmmf, emitModel, emitAll } from '../../scripts/ai-workforce/emit-ddl.mjs';

const SCHEMA = `
model Widget {
  id        String   @id @default(cuid())
  slug      String   @unique
  ref       String?  @unique
  tenantId  String
  label     String
  payload   Json?
  createdAt DateTime @default(now())

  @@unique([tenantId, label])
  @@index([tenantId])
}
`;

const widgetModel = {
  name: 'Widget',
  dbName: null,
  fields: [
    { name: 'id', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: true, isUnique: false, hasDefaultValue: true, default: { name: 'cuid', args: [1] }, nativeType: null },
    { name: 'slug', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: false, isUnique: true, hasDefaultValue: false, nativeType: null },
    { name: 'ref', kind: 'scalar', type: 'String', isList: false, isRequired: false, isId: false, isUnique: true, hasDefaultValue: false, nativeType: null },
    { name: 'tenantId', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: false, isUnique: false, hasDefaultValue: false, nativeType: null },
    { name: 'label', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: false, isUnique: false, hasDefaultValue: false, nativeType: null },
    { name: 'payload', kind: 'scalar', type: 'Json', isList: false, isRequired: false, isId: false, isUnique: false, hasDefaultValue: false, nativeType: null },
    { name: 'createdAt', kind: 'scalar', type: 'DateTime', isList: false, isRequired: true, isId: false, isUnique: false, hasDefaultValue: true, default: { name: 'now', args: [] }, nativeType: null },
  ],
};

/** The same model as a query-compiler client would report it. */
const degradedModel = {
  name: 'Widget',
  dbName: null,
  fields: widgetModel.fields.map((f) => ({ name: f.name, kind: f.kind, type: f.type })),
};

describe('emit-ddl: degraded DMMF guard', () => {
  it('accepts a full DMMF', () => {
    expect(() => assertFullDmmf({ datamodel: { models: [widgetModel] } }, '@prisma/client')).not.toThrow();
  });

  it('rejects a query-compiler DMMF instead of silently emitting broken DDL', () => {
    expect(() => assertFullDmmf({ datamodel: { models: [degradedModel] } }, '.prisma-sqlite/client')).toThrow(
      /degraded/i,
    );
  });

  it('names the missing metadata and the remedy', () => {
    let message = '';
    try {
      assertFullDmmf({ datamodel: { models: [degradedModel] } }, '.prisma-sqlite/client');
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('isId');
    expect(message).toContain('isRequired');
    expect(message).toContain('isUnique');
    expect(message).toContain('--client');
  });

  it('rejects a DMMF with no scalar fields at all', () => {
    expect(() => assertFullDmmf({ datamodel: { models: [] } }, 'x')).toThrow(/no scalar fields/i);
  });
});

describe('emit-ddl: block attribute parsing', () => {
  const attrs = parseBlockAttributes(SCHEMA).get('Widget');

  it('captures field-level @unique from the schema text', () => {
    expect(attrs.fieldUniques).toEqual(['slug', 'ref']);
  });

  it('captures compound @@unique separately', () => {
    expect(attrs.uniques).toEqual([['tenantId', 'label']]);
  });

  it('captures @@index', () => {
    expect(attrs.indexes).toEqual([['tenantId']]);
  });

  it('does not mistake @@unique for a field-level @unique', () => {
    expect(attrs.fieldUniques).not.toContain('tenantId');
  });

  it('does not treat the @id field as unique-by-text', () => {
    expect(attrs.fieldUniques).not.toContain('id');
  });
});

describe('emit-ddl: sqlite output', () => {
  const attrs = parseBlockAttributes(SCHEMA).get('Widget');
  const sql = emitModel(widgetModel, attrs, 'sqlite', { relaxNotNull: true });

  it('emits a primary key', () => {
    expect(sql).toMatch(/"id" TEXT NOT NULL PRIMARY KEY/);
  });

  it('emits a unique index for every single-column @unique', () => {
    expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "Widget_slug_key" ON "Widget" ("slug");');
    expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "Widget_ref_key" ON "Widget" ("ref");');
  });

  it('emits the compound unique index', () => {
    expect(sql).toContain('"Widget_tenantId_label_key" ON "Widget" ("tenantId", "label")');
  });

  it('emits the non-unique index', () => {
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS "Widget_tenantId_idx" ON "Widget" ("tenantId");');
  });

  it('maps Json onto a TEXT-affinity column for the mirror client', () => {
    expect(sql).toMatch(/"payload" TEXT/);
    expect(sql).not.toContain('JSONB');
  });

  it('keeps scalar defaults', () => {
    expect(sql).toMatch(/"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP/);
  });

  it('is idempotent at the statement level', () => {
    for (const statement of sql.split('\n').filter((l: string) => l.startsWith('CREATE'))) {
      expect(statement).toContain('IF NOT EXISTS');
    }
  });

  it('does not duplicate a unique index when a field is both @unique and in @@unique', () => {
    const schema = 'model W {\n  id String @id\n  a  String @unique\n\n  @@unique([a])\n}\n';
    const model = {
      name: 'W',
      dbName: null,
      fields: [
        { name: 'id', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: true, isUnique: false, hasDefaultValue: false, nativeType: null },
        { name: 'a', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: false, isUnique: true, hasDefaultValue: false, nativeType: null },
      ],
    };
    const out = emitModel(model, parseBlockAttributes(schema).get('W'), 'sqlite', { relaxNotNull: true });
    const occurrences = out.split('\n').filter((l: string) => l.includes('"W_a_key"')).length;
    expect(occurrences).toBe(1);
  });
});

describe('emit-ddl: mysql LOB defaults', () => {
  const schema = `
model Audit {
  id       String @id
  oldValue String @default(dbgenerated("(\\_utf8mb4'{}')")) @db.LongText
  note     String @default(dbgenerated("(\\_utf8mb4'')")) @db.Text
}
`;
  const model = {
    name: 'Audit',
    dbName: null,
    fields: [
      { name: 'id', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: true, isUnique: false, hasDefaultValue: false, nativeType: ['String', []] },
      { name: 'oldValue', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: false, isUnique: false, hasDefaultValue: true, default: { name: 'dbgenerated', args: ["(_utf8mb4'{}')"] }, nativeType: ['LongText', []] },
      { name: 'note', kind: 'scalar', type: 'String', isList: false, isRequired: true, isId: false, isUnique: false, hasDefaultValue: true, default: { name: 'dbgenerated', args: ["(_utf8mb4'')"] }, nativeType: ['Text', []] },
    ],
  };

  it('uses MySQL expression defaults for TEXT/LONGTEXT', () => {
    const sql = emitModel(model, parseBlockAttributes(schema).get('Audit'), 'mysql', {});
    expect(sql).toContain("`oldValue` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}')");
    expect(sql).toContain("`note` TEXT NOT NULL DEFAULT (_utf8mb4'')");
  });
});

describe('emit-ddl: mysql output', () => {
  const attrs = parseBlockAttributes(SCHEMA).get('Widget');
  const sql = emitModel(widgetModel, attrs, 'mysql', {});

  it('emits inline UNIQUE INDEX entries for single-column @unique', () => {
    expect(sql).toContain('UNIQUE INDEX `Widget_slug_key`(`slug`)');
    expect(sql).toContain('UNIQUE INDEX `Widget_ref_key`(`ref`)');
  });

  it('emits a primary key clause', () => {
    expect(sql).toMatch(/PRIMARY KEY \(`id`\)/);
  });

  it('keeps NOT NULL on required columns', () => {
    expect(sql).toMatch(/`tenantId` VARCHAR\(191\) NOT NULL/);
  });
});

describe('emit-ddl: emitAll', () => {
  it('emits every model it is given and reports the count', () => {
    const out = emitAll({
      dmmf: { datamodel: { models: [widgetModel] } },
      schemaText: SCHEMA,
      dialect: 'sqlite',
      relaxNotNull: true,
    });
    expect(out).toContain('-- Models: 1');
    expect(out).toContain('CREATE TABLE IF NOT EXISTS "Widget"');
  });

  it('honours the model filter', () => {
    const out = emitAll({
      dmmf: { datamodel: { models: [widgetModel] } },
      schemaText: SCHEMA,
      dialect: 'sqlite',
      filter: (m: { name: string }) => m.name.startsWith('Awf'),
      relaxNotNull: true,
    });
    expect(out).toContain('-- Models: 0');
    expect(out).not.toContain('CREATE TABLE');
  });
});
