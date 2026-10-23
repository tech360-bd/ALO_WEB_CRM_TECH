const DOCUMENT_DOWNLOAD_PATH = /^\/api\/documents\/([a-z0-9_-]{8,128})\/download$/i;
const DOCUMENT_ID = /^[a-z0-9_-]{8,128}$/i;

type DocumentLookupClient = {
  document: {
    findFirst(args: any): Promise<any>;
  };
};

export class PrivateApplicationDocumentError extends Error {
  constructor(message = 'A linked, privately stored student document is required.') {
    super(message);
    this.name = 'PrivateApplicationDocumentError';
  }
}

function documentIdFromInput(value: string): string | null {
  const pathMatch = value.match(DOCUMENT_DOWNLOAD_PATH);
  if (pathMatch) return pathMatch[1];
  return DOCUMENT_ID.test(value) ? value : null;
}

/** Resolve a document id or an existing private-download path against the owning student. */
export async function resolveApplicationDocumentLink(
  client: DocumentLookupClient,
  studentId: string,
  input: string | null | undefined,
): Promise<string> {
  if (input == null || input === '') return '';
  if (typeof input !== 'string') throw new PrivateApplicationDocumentError();
  const id = documentIdFromInput(input);
  if (!id) throw new PrivateApplicationDocumentError('Only an authorized private document record can be linked; arbitrary URLs and storage paths are not accepted.');
  const document = await client.document.findFirst({
    where: { id, studentId, status: { not: 'REJECTED' }, storagePath: { not: null }, mimeType: { not: null }, fileHash: { not: null } },
    select: { id: true, storagePath: true, mimeType: true, fileHash: true, status: true },
  });
  if (!document) throw new PrivateApplicationDocumentError('The private document was not found for this application’s student.');
  return `/api/documents/${document.id}/download`;
}

/** Hide legacy external/public paths instead of returning them in API payloads. */
export async function sanitizeApplicationDocumentLink(
  client: DocumentLookupClient,
  studentId: string,
  value: string | null | undefined,
): Promise<string> {
  try {
    return await resolveApplicationDocumentLink(client, studentId, value);
  } catch {
    return '';
  }
}
