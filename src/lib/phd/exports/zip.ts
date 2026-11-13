/**
 * Minimal ZIP (store-only) writer used for DOCX/XLSX packaging without adding a
 * runtime dependency. Standards-compliant archives: local headers, central
 * directory and EOCD. Compression is not used, which keeps the implementation
 * small and verifiable; DOCX files remain perfectly valid.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const time = ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((date.getSeconds() / 2) & 0x1f);
  const day = ((date.getFullYear() - 1980) & 0x7f) << 9 | ((date.getMonth() + 1) & 0x0f) << 5 | (date.getDate() & 0x1f);
  return { time, date: day };
}

export interface ZipEntry {
  path: string;
  data: Buffer | string;
}

export function createZip(entries: ZipEntry[], now: Date = new Date()): Buffer {
  const { time, date } = dosDateTime(now);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.path, 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 flag
    local.writeUInt16LE(0, 8); // store
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuffer);

    offset += local.length + nameBuffer.length + data.length;
  }

  const centralBuffer = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuffer, eocd]);
}

export interface ZipReadResult {
  entries: Array<{ path: string; data: Buffer }>;
  valid: boolean;
  error?: string;
}

/** Small reader used by tests and by upload validation for OOXML containers. */
export function readZip(buffer: Buffer): ZipReadResult {
  try {
    const eocdIndex = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (eocdIndex < 0) return { entries: [], valid: false, error: 'EOCD not found' };
    const entryCount = buffer.readUInt16LE(eocdIndex + 10);
    const centralOffset = buffer.readUInt32LE(eocdIndex + 16);
    let cursor = centralOffset;
    const entries: ZipReadResult['entries'] = [];
    for (let i = 0; i < entryCount; i += 1) {
      if (buffer.readUInt32LE(cursor) !== 0x02014b50) return { entries, valid: false, error: 'Bad central directory' };
      const method = buffer.readUInt16LE(cursor + 10);
      const expectedCrc = buffer.readUInt32LE(cursor + 16);
      const compressedSize = buffer.readUInt32LE(cursor + 20);
      const nameLength = buffer.readUInt16LE(cursor + 28);
      const extraLength = buffer.readUInt16LE(cursor + 30);
      const commentLength = buffer.readUInt16LE(cursor + 32);
      const localOffset = buffer.readUInt32LE(cursor + 42);
      const name = buffer.slice(cursor + 46, cursor + 46 + nameLength).toString('utf8');
      if (method !== 0) return { entries, valid: false, error: `Unsupported compression method ${method}` };
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const data = buffer.slice(dataStart, dataStart + compressedSize);
      if ((crc32(data) >>> 0) !== (expectedCrc >>> 0)) {
        return { entries, valid: false, error: `CRC mismatch for ${name}` };
      }
      entries.push({ path: name, data });
      cursor += 46 + nameLength + extraLength + commentLength;
    }
    return { entries, valid: true };
  } catch (error) {
    return { entries: [], valid: false, error: error instanceof Error ? error.message : 'Unknown ZIP error' };
  }
}
