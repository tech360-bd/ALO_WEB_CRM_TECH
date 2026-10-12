import { NextResponse } from 'next/server';

// This legacy endpoint previously returned a success-shaped JSON object instead
// of file bytes and its signed URL did not authenticate the document owner.
// It is disabled rather than pretending to provide a secure download. Use the
// resource-specific streaming endpoints, which authorize by document id.
const response = () => NextResponse.json({
  success: false,
  error: 'This legacy download endpoint is disabled. Use the resource-specific authenticated document download endpoint.',
}, { status: 410, headers: { 'Cache-Control': 'no-store' } });

export async function GET() {
  return response();
}

export async function POST() {
  return response();
}
