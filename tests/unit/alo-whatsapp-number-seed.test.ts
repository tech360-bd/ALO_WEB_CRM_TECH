import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Acceptance criteria C — official number registry seed. */
const sql = readFileSync(path.join(process.cwd(), 'database/seed_alo_whatsapp_numbers.sql'), 'utf8');

const rowPattern = /^\s*\('(alo-wa-\d{11})',\s*'(0\d{10})',\s*'(8801\d{9})',\s*'([^']*)',\s*'([^']*)',[^\n]*?'disconnected',\s*'active',\s*(\d),\s*(\d),\s*(\d),\s*(\d),/gm;
const rows = [...sql.matchAll(rowPattern)].map((match) => ({
  id: match[1],
  phone: match[2],
  normalized: match[3],
  displayName: match[4],
  ownerType: match[5],
  isDefault: Number(match[6]),
  isComplaint: Number(match[7]),
  isFollowUp: Number(match[8]),
  is247: Number(match[9]),
}));

const code = sql.replace(/--[^\n]*/g, '');
const upsert = /ON DUPLICATE KEY UPDATE([\s\S]*)$/i.exec(code)?.[1] || '';

describe('ALO official WhatsApp number registry seed', () => {
  it('contains exactly the 20 requested, unique number records', () => {
    expect(rows).toHaveLength(20);
    expect(new Set(rows.map((row) => row.phone)).size).toBe(20);
    expect(rows[0].phone).toBe('01805020100');
    expect(rows[19].phone).toBe('01805020119');
    expect(rows.every((row) => row.normalized === `880${row.phone.slice(1)}`)).toBe(true);
  });

  it('configures the main number as default, complaint and follow-up sender', () => {
    const main = rows.find((row) => row.phone === '01805020100');
    expect(main?.ownerType).toBe('ALO_MAIN');
    expect(main).toMatchObject({ isDefault: 1, isComplaint: 1, isFollowUp: 1, is247: 0 });
  });

  it('configures the COO number as the urgent 24/7 support contact only', () => {
    const coo = rows.find((row) => row.phone === '01805020101');
    expect(coo?.ownerType).toBe('COO');
    expect(coo).toMatchObject({ is247: 1, isDefault: 0, isComplaint: 0, isFollowUp: 0 });
  });

  it('leaves the 18 employee-pool numbers unassigned and unconnected', () => {
    const pool = rows.filter((row) => row.ownerType === 'EMPLOYEE');
    expect(pool).toHaveLength(18);
    expect(pool.every((row) => row.isDefault === 0 && row.isComplaint === 0 && row.isFollowUp === 0 && row.is247 === 0)).toBe(true);
    expect((sql.match(/'disconnected'/g) || []).length).toBeGreaterThanOrEqual(20);
    expect(sql).not.toContain("'connected'");
  });

  it('inserts no Meta identifiers, tokens or claimed connectivity', () => {
    expect(sql).not.toMatch(/'metaPhoneNumberId'\s*,\s*'\S+'/);
    // Each INSERT row has two consecutive empty Meta identifier fields.
    expect((sql.match(/'', '', '', '', '', '', 'disconnected'/g) || []).length).toBe(20);
    expect(code).not.toMatch(/EAAC|Bearer\s+\w|access_token\s*=|WHATSAPP_ACCESS_TOKEN=/i);
  });

  it('is idempotent and never overwrites configured values with blank defaults', () => {
    expect(sql).toMatch(/ON DUPLICATE KEY UPDATE/i);
    for (const column of [
      'metaPhoneNumberId', 'metaBusinessAccountId', 'connectionStatus', 'employeeOwnerId',
      'employeeOwnerName', 'branch', 'department', 'activeStatus',
      'isDefaultSender', 'isComplaintSender', 'isFollowUpSender', 'isSupport247',
    ]) {
      expect(new RegExp(`\`${column}\`\\s*=`, 'i').test(upsert), column).toBe(false);
    }
    expect(upsert).toMatch(/`id`\s*=\s*`id`/);
  });

  it('does not contain DROP, TRUNCATE or DELETE statements', () => {
    expect(code).not.toMatch(/\b(DROP\s+TABLE|TRUNCATE|DELETE\s+FROM)\b/i);
  });
});
