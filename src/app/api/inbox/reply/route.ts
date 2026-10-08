import { NextResponse } from 'next/server';

/**
 * Legacy inbox reply endpoint disabled: it previously persisted a local message
 * and returned success without contacting an authorized channel provider.
 * Use the conversation-scoped UCC /reply endpoint instead.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'This legacy send endpoint is disabled. Use the assigned conversation’s provider-backed UCC reply endpoint.',
    },
    { status: 410, headers: { Allow: 'POST' } },
  );
}
