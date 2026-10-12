import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { communicationScope } from '@/lib/communication/access-scope';
import { createCommunication, CHANNELS } from '@/lib/communication/unified-engine';

/** Authenticated intake. Public provider traffic belongs to verified webhook routes. */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== 'string' || !body.message.trim() || body.message.length > 10000 ||
      typeof body.threadId !== 'string' || !body.threadId) {
      return NextResponse.json({ success: false, error: 'An accessible threadId and message are required.' }, { status: 400 });
    }
    const scope = await communicationScope(auth);
    const thread = await db.communicationThread.findFirst({ where: { AND: [{ id: body.threadId }, scope.threads] } });
    if (!thread) return NextResponse.json({ success: false, error: 'Thread not found.' }, { status: 404 });
    if (scope.staff && !scope.master && !auth.permissions.includes('communication.reply')) {
      return NextResponse.json({ success: false, error: 'Reply permission required.' }, { status: 403 });
    }
    const result = await createCommunication({
      threadId: thread.id,
      channel: thread.channel,
      messageBody: body.message.trim(), senderUserId: auth.userId, senderName: auth.name,
      studentId: thread.studentId || undefined, partnerId: thread.partnerId || undefined,
      applicationId: thread.applicationId || undefined, leadId: thread.leadId || undefined,
      documentId: thread.documentId || undefined, visaFileId: thread.visaFileId || undefined,
      campaignId: thread.campaignId || undefined, taskId: thread.taskId || undefined,
      b2bProviderId: thread.b2bProviderId || undefined,
      visibility: thread.visibility as Parameters<typeof createCommunication>[0]['visibility'],
      createdBy: auth.actorUserId, assignedTo: thread.assignedToId, direction: 'inbound',
    });
    return NextResponse.json({ success: true, messageId: result.message.id, threadId: result.thread.id, deliveryStatus: result.message.deliveryStatus }, { status: 201 });
  } catch (error) {
    console.error('[unified-communication] save failed', error);
    return NextResponse.json({ success: false, error: 'Communication could not be saved.' }, { status: 500 });
  }
}
export async function GET() {
  return NextResponse.json({ success: true, supportedChannels: CHANNELS, intake: 'Authenticated thread messages; external channels require verified provider webhooks.' });
}
