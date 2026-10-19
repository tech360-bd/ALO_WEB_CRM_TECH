import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { WEBHOOK_EVENTS } from '@/lib/webhooks';

// ============================================================
// GET /api/webhooks/events — the canonical outbound event catalogue (spec s77)
// ============================================================

export const GET = withAuth(async () => {
  return NextResponse.json({
    success: true,
    events: WEBHOOK_EVENTS,
    signing: {
      algorithm: 'HMAC-SHA256',
      signedPayload: '<x-alo-timestamp>.<raw json body>',
      headers: ['x-alo-event', 'x-alo-delivery', 'x-alo-timestamp', 'x-alo-signature'],
      note: 'Compare the signature in constant time. Reject timestamps older than your tolerance window.',
    },
    delivery: {
      retries: 'exponential backoff 30s, 2m, 8m, 32m, 2h (capped 6h)',
      deadLetter: 'after maxRetries the delivery is marked DEAD and can be replayed',
      idempotency: 'UNIQUE(subscriptionId, eventId) prevents duplicate queueing',
    },
  });
}, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'PARTNER', 'EMPLOYEE'] });
