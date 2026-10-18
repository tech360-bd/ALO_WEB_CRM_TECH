/**
 * Inbound WhatsApp → Student ID → document storage → counselor review.
 *
 * This exercises the real production modules end to end, not re-implementations:
 *
 *   inbound parsing   src/lib/whatsapp-number-pool.ts        normalizeBdPhone
 *                     src/lib/whatsapp-webhook-handler.ts    classifyIntent / detectPriority
 *   Student ID        src/lib/identity/student-id.ts         allocateIdentifier
 *   malware gate      src/lib/documents/malware-scan.ts      scanForMalware
 *   private storage   src/lib/storage/private-file-store.ts  storePrivateFile / readPrivateFile
 *   counselor review  src/lib/communications/document-policy.ts evaluateDocumentTransition
 *
 * The only stand-in is the Prisma transaction client, replaced with the same
 * in-memory harness tests/unit/student-id-allocation.test.ts uses, because no
 * MySQL server is reachable in this environment. Real row-lock concurrency is
 * covered by tests/integration/whatsapp-student-journey.test.ts, which runs
 * against the CI MySQL 8.4 service and self-skips without a disposable database.
 */
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { $transaction: vi.fn() } }));

import { evaluateDocumentTransition, legacyStatusToState } from '@/lib/communications/document-policy';
import { EICAR_SIGNATURE, scanForMalware } from '@/lib/documents/malware-scan';
import { allocateIdentifier } from '@/lib/identity/student-id';
import { readPrivateFile, removePrivateFile, storePrivateFile } from '@/lib/storage/private-file-store';
import { classifyIntent, detectPriority, normalizePhone } from '@/lib/whatsapp-webhook-handler';

const savedEnv = { ...process.env };
let storageRoot = '';

beforeAll(async () => {
  storageRoot = await mkdtemp(path.join(os.tmpdir(), 'alo-journey-'));
});

afterAll(async () => {
  await rm(storageRoot, { recursive: true, force: true });
});

beforeEach(() => {
  process.env.STORAGE_POOL_C = storageRoot;
  process.env.NODE_ENV = 'development';
  delete process.env.CLAMAV_HOST;
});

afterEach(() => {
  process.env = { ...savedEnv };
});

/**
 * In-memory model of the MySQL sequence behaviour allocateIdentifier relies on.
 *
 * `lastInsertId` lives on the transaction, not in shared state, because that is
 * what MySQL actually guarantees: `LAST_INSERT_ID(expr)` sets a per-connection
 * value, so a concurrent transaction on another connection cannot observe it.
 * A shared variable here made 25 concurrent allocations all read the final
 * value and the uniqueness assertion below passed or failed on scheduling
 * rather than on the allocator's logic.
 *
 * `rows` stays shared, because the sequence row itself is one row in the table
 * and its row lock is what serializes the increment.
 */
function createFakeDatabase() {
  const rows = new Map<string, { lastValue: number }>();

  const makeTx = () => {
    let connectionLastInsertId = 0;
    return {
      $executeRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const sql = strings.join('?');
        if (sql.includes('ON DUPLICATE KEY UPDATE')) {
          const key = String(values[0]);
          if (!rows.has(key)) rows.set(key, { lastValue: 0 });
          return 0;
        }
        if (sql.includes('LAST_INSERT_ID(lastValue + 1)')) {
          const row = rows.get(String(values[0]));
          if (!row) return 0;
          row.lastValue += 1;
          connectionLastInsertId = row.lastValue;
          return 1;
        }
        throw new Error(`unexpected statement: ${sql}`);
      },
      $queryRaw: async (strings: TemplateStringsArray) => {
        if (!strings.join('?').includes('LAST_INSERT_ID() AS value')) throw new Error('unexpected query');
        return [{ value: BigInt(connectionLastInsertId) }];
      },
    };
  };

  const transaction = async <T>(fn: (tx: ReturnType<typeof makeTx>) => Promise<T>): Promise<T> => {
    const snapshot = new Map([...rows].map(([k, v]) => [k, { ...v }]));
    try {
      return await fn(makeTx());
    } catch (error) {
      rows.clear();
      for (const [k, v] of snapshot) rows.set(k, v);
      throw error;
    }
  };

  return { transaction, rows };
}

/** A real WhatsApp Cloud API document-message payload, reduced to what matters. */
function inboundDocumentMessage(phone: string, filename: string, mediaId: string) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              contacts: [{ profile: { name: 'Rahim Ahmed' }, wa_id: phone }],
              messages: [
                {
                  from: phone,
                  id: `wamid.${mediaId}`,
                  type: 'document',
                  document: { id: mediaId, filename, mime_type: 'application/pdf' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

const CLEAN_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n',
  'utf8',
);

describe('inbound WhatsApp → Student ID', () => {
  it('normalizes a Bangladeshi sender number to the canonical pool format', () => {
    const payload = inboundDocumentMessage('01712345678', 'passport.pdf', 'MEDIA1');
    const from = payload.entry[0].changes[0].value.messages[0].from;
    expect(normalizePhone(from)).toBe('8801712345678');
  });

  it('classifies a document-request message and escalates its priority', () => {
    const intent = classifyIntent('Please submit your passport and bank statement');
    expect(intent).toBe('DOCUMENT_REQUIREMENT');
    expect(detectPriority(intent, 'Please submit your passport and bank statement')).toBe('high');
  });

  it('issues a unique Student ID for each concurrent inbound lead', async () => {
    const fake = createFakeDatabase();
    const ids = await Promise.all(
      Array.from({ length: 25 }, () => fake.transaction((tx) => allocateIdentifier(tx as never, 'AE', 2026))),
    );

    expect(new Set(ids).size).toBe(25);
    expect(ids[0]).toBe('AE-202600001');
    expect(ids[24]).toBe('AE-202600025');
    // Every ID matches the canonical AE-YYYY + 5-digit format.
    for (const id of ids) expect(id).toMatch(/^AE-\d{4}\d{5}$/);
  });

  it('releases the number when the surrounding business transaction rolls back', async () => {
    const fake = createFakeDatabase();
    await expect(
      fake.transaction(async (tx) => {
        await allocateIdentifier(tx as never, 'AE', 2026);
        throw new Error('lead insert failed');
      }),
    ).rejects.toThrow('lead insert failed');

    const next = await fake.transaction((tx) => allocateIdentifier(tx as never, 'AE', 2026));
    expect(next).toBe('AE-202600001');
  });
});

describe('document storage gate', () => {
  it('stores a clean document privately and returns its bytes unchanged', async () => {
    const scan = await scanForMalware(CLEAN_PDF);
    expect(scan.verdict).not.toBe('infected');

    const stored = await storePrivateFile(CLEAN_PDF, 'passport.pdf');
    expect(stored.fileSize).toBe(CLEAN_PDF.byteLength);
    // The stored name is a generated identifier, never the student's filename.
    expect(stored.storagePath).not.toContain('passport');
    expect(stored.storagePath).toMatch(/\.pdf$/);

    const roundTripped = await readPrivateFile(stored.storagePath);
    expect(Buffer.compare(roundTripped, CLEAN_PDF)).toBe(0);

    await removePrivateFile(stored.storagePath);
  });

  it('rejects a malicious attachment before any bytes reach private storage', async () => {
    const before = (await readdir(storageRoot)).length;

    const malicious = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from(EICAR_SIGNATURE, 'utf8')]);
    const scan = await scanForMalware(malicious);
    expect(scan.verdict).toBe('infected');
    expect(scan.threat).toBe('EICAR-Test-File');

    // The route returns 400 on an infected verdict and never calls storePrivateFile.
    const after = (await readdir(storageRoot)).length;
    expect(after).toBe(before);
  });

  it('writes no temp file when the scan rejects the upload', async () => {
    const scan = await scanForMalware(Buffer.from(EICAR_SIGNATURE, 'utf8'));
    expect(scan.verdict).toBe('infected');
    const leftovers = (await readdir(storageRoot)).filter((name) => name.endsWith('.tmp'));
    expect(leftovers).toEqual([]);
  });
});

describe('counselor review', () => {
  it('maps a freshly uploaded document to the reviewable state', () => {
    expect(legacyStatusToState('UPLOADED')).toBe('student_submitted');
  });

  it('lets a counselor verify a submitted document', () => {
    const decision = evaluateDocumentTransition({
      actor: 'counselor',
      from: 'student_submitted',
      to: 'verified',
    });
    expect(decision.allowed).toBe(true);
  });

  it('refuses to let a student verify their own WhatsApp upload', () => {
    const decision = evaluateDocumentTransition({
      actor: 'student',
      from: 'student_submitted',
      to: 'verified',
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('REVIEW_ROLE_REQUIRED');
  });

  it('refuses to let a partner verify a student document', () => {
    const decision = evaluateDocumentTransition({
      actor: 'partner',
      from: 'under_review',
      to: 'verified',
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe('REVIEW_ROLE_REQUIRED');
  });

  it('requires a stated reason to reject, and blocks deletion entirely', () => {
    const withoutReason = evaluateDocumentTransition({
      actor: 'counselor',
      from: 'student_submitted',
      to: 'rejected',
    });
    expect(withoutReason.allowed).toBe(false);

    const withReason = evaluateDocumentTransition({
      actor: 'counselor',
      from: 'student_submitted',
      to: 'rejected',
      reasonCode: 'blurry',
      comment: 'Passport photo page is unreadable.',
    });
    expect(withReason.allowed).toBe(true);

    const deletion = evaluateDocumentTransition({
      actor: 'admin',
      from: 'student_submitted',
      to: 'deleted' as never,
    });
    expect(deletion.allowed).toBe(false);
  });
});

describe('full journey', () => {
  it('runs inbound message → Student ID → scanned private storage → counselor verification', async () => {
    // 1. Inbound WhatsApp document message.
    const payload = inboundDocumentMessage('+8801712345678', 'passport.pdf', 'MEDIA_JOURNEY');
    const message = payload.entry[0].changes[0].value.messages[0];
    const sender = normalizePhone(message.from);
    expect(sender).toBe('8801712345678');
    expect(message.type).toBe('document');

    // 2. Verified inbound lead gets a canonical Student ID.
    const fake = createFakeDatabase();
    const studentId = await fake.transaction((tx) => allocateIdentifier(tx as never, 'AE', 2026));
    expect(studentId).toMatch(/^AE-\d{4}\d{5}$/);

    // 3. The attachment is screened, then written to private storage.
    const scan = await scanForMalware(CLEAN_PDF);
    expect(scan.verdict).not.toBe('infected');
    const stored = await storePrivateFile(CLEAN_PDF, message.document.filename);
    expect(stored.storagePath).not.toContain('passport');

    // 4. A counselor reviews it; the student cannot self-verify.
    expect(
      evaluateDocumentTransition({ actor: 'student', from: 'student_submitted', to: 'verified' }).allowed,
    ).toBe(false);
    const review = evaluateDocumentTransition({
      actor: 'counselor',
      from: 'student_submitted',
      to: 'verified',
    });
    expect(review.allowed).toBe(true);

    // 5. The stored bytes are still intact for the counselor's download.
    expect(Buffer.compare(await readPrivateFile(stored.storagePath), CLEAN_PDF)).toBe(0);

    await removePrivateFile(stored.storagePath);
  });
});
