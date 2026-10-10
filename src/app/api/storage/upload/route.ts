import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

// Quarantine this incomplete upload path, not all document services. Previously
// it wrote metadata without bytes and fabricated metadata on DB failure. Wiring
// storage-service requires an approved persistent private root and entity-level
// ownership/visibility mapping; guessing either could lose or expose documents.
export const POST = withAuth(async () => NextResponse.json({
  success: false, status: 'DISABLED',
  error: 'This upload endpoint has no verified persistent file storage workflow. No file was saved.',
}, { status: 503 }));

export const GET = withAuth(async () => NextResponse.json({
  success: false, status: 'DISABLED',
  error: 'Uploads through this endpoint are unavailable pending persistent storage and access-control verification.',
}, { status: 503 }));
