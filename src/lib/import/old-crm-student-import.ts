import { normalizeStudentRow } from '@/lib/import-normalizers';

export type ImportListItem = { text: string; sender?: string; channel?: string; originalDate?: string };
export type ImportedDocumentReference = { name: string; fileName: string; category: string };

const FIELD_ALIASES: Record<string, string> = {
  oldcrmid: 'oldCrmId', sourcecrmid: 'oldCrmId', legacyid: 'oldCrmId', crmstudentid: 'oldCrmId',
  studentname: 'studentName', fullname: 'studentName', name: 'studentName', applicantname: 'studentName',
  phone: 'phone', mobile: 'phone', mobilenumber: 'phone', contactnumber: 'phone',
  whatsapp: 'whatsapp', whatsappnumber: 'whatsapp', whatsappno: 'whatsapp',
  email: 'email', emailaddress: 'email',
  passport: 'passportNumber', passportnumber: 'passportNumber', passportno: 'passportNumber',
  dateofbirth: 'dateOfBirth', dob: 'dateOfBirth', birthdate: 'dateOfBirth',
  countryinterest: 'countryInterest', country: 'countryInterest', destination: 'countryInterest',
  courseinterest: 'courseInterest', course: 'courseInterest', program: 'courseInterest', programme: 'courseInterest',
  universityinterest: 'universityInterest', university: 'universityInterest', institution: 'universityInterest',
  applicationstatus: 'applicationStatus', appstatus: 'applicationStatus',
  counselorname: 'counselorName', counsellorname: 'counselorName', counselor: 'counselorName', counsellor: 'counselorName',
  documents: 'documents', document: 'documents', attachments: 'documents',
  notes: 'notes', internalnotes: 'notes',
  communicationhistory: 'communicationHistory', communications: 'communicationHistory', messages: 'communicationHistory', timeline: 'communicationHistory',
  paymentstatus: 'paymentStatus',
  visastatus: 'visaStatus',
  createddate: 'createdDate', createdat: 'createdDate', createdon: 'createdDate',
  updateddate: 'updatedDate', updatedat: 'updatedDate', modifieddate: 'updatedDate',
};

export function textValue(value: unknown, maxLength = 4000): string {
  if (value === null || value === undefined) return '';
  let text = '';
  if (value instanceof Date) text = value.toISOString();
  else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') text = String(value);
  else if (Array.isArray(value)) text = value.map((item) => textValue(item, 1000)).filter(Boolean).join(', ');
  else if (typeof value === 'object' && 'text' in value && typeof (value as { text?: unknown }).text === 'string') text = (value as { text: string }).text;
  return text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
}

function headerKey(value: unknown): string {
  return textValue(value, 191).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeImportRow(raw: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [header, value] of Object.entries(raw)) {
    const canonical = FIELD_ALIASES[headerKey(header)];
    if (canonical && (fields[canonical] === undefined || fields[canonical] === '')) fields[canonical] = value;
  }
  const normalized = normalizeStudentRow({
    oldCrmId: textValue(fields.oldCrmId, 191),
    studentName: textValue(fields.studentName, 191),
    phone: textValue(fields.phone, 80),
    whatsapp: textValue(fields.whatsapp, 80),
    email: textValue(fields.email, 191),
    passportNumber: textValue(fields.passportNumber, 80),
    dateOfBirth: textValue(fields.dateOfBirth, 80),
    countryInterest: textValue(fields.countryInterest, 191),
    courseInterest: textValue(fields.courseInterest, 191),
    universityInterest: textValue(fields.universityInterest, 191),
  });
  const extras = {
    applicationStatus: textValue(fields.applicationStatus, 191),
    counselorName: textValue(fields.counselorName, 191),
    documents: sanitizeDocumentReferences(fields.documents),
    notes: sanitizeTextList(fields.notes, 'note'),
    communicationHistory: sanitizeTextList(fields.communicationHistory, 'message'),
    paymentStatus: textValue(fields.paymentStatus, 191),
    visaStatus: textValue(fields.visaStatus, 191),
    createdDate: textValue(fields.createdDate, 80),
    updatedDate: textValue(fields.updatedDate, 80),
  };
  return { ...normalized, ...extras };
}

function toArray(value: unknown, kind: 'note' | 'message' | 'document'): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  const text = textValue(value, 100000);
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
  } catch { /* plain old-CRM text is a valid single item */ }
  const delimiter = kind === 'document' ? /[;\n]+/ : /\n+/;
  return text.split(delimiter).map((item) => item.trim()).filter(Boolean);
}

export function sanitizeTextList(value: unknown, kind: 'note' | 'message'): ImportListItem[] {
  return toArray(value, kind).slice(0, 500).map((item) => {
    if (typeof item === 'string' || typeof item === 'number') return { text: textValue(item, 10000) };
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { text: '' };
    const record = item as Record<string, unknown>;
    return {
      text: textValue(record.text ?? record.message ?? record.body ?? record.note ?? record.content ?? record.description, 10000),
      sender: textValue(record.senderName ?? record.sender ?? record.author ?? record.from, 191),
      channel: textValue(record.channel ?? record.type, 80),
      originalDate: textValue(record.createdAt ?? record.date ?? record.timestamp, 80),
    };
  }).filter((item) => item.text);
}

export function sanitizeDocumentReferences(value: unknown): ImportedDocumentReference[] {
  return toArray(value, 'document').slice(0, 250).map((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      const raw = textValue(item, 1000);
      const fileName = safeFileName(raw);
      return { name: fileName || 'Legacy document reference', fileName, category: 'other' };
    }
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { name: '', fileName: '', category: 'other' };
    const record = item as Record<string, unknown>;
    const rawFileName = textValue(record.fileName ?? record.name ?? record.title ?? record.filename, 1000);
    const fileName = safeFileName(rawFileName);
    const name = textValue(record.title ?? record.name ?? fileName, 191) || fileName || 'Legacy document reference';
    const category = textValue(record.category ?? record.type ?? record.documentType, 80).toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'other';
    return { name: name.slice(0, 191), fileName: fileName.slice(0, 191), category };
  }).filter((item) => item.name || item.fileName);
}

function safeFileName(value: string): string {
  const noQuery = value.split(/[?#]/, 1)[0];
  const base = noQuery.split(/[\\/]/).pop() || '';
  return base.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 191);
}

export function parseJsonArray(value: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function validIsoDate(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeHeader(value: unknown): string {
  return FIELD_ALIASES[headerKey(value)] || '';
}

export function sanitizeStatusNote(value: string, maxLength = 191): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
}
