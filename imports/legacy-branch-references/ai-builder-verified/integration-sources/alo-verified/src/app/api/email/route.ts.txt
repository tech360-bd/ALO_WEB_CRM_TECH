import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// ============================================================
// EMAIL QUEUE API
// ============================================================

// ----------------------------------------------------------
// GET - List email queue items with filters
// ----------------------------------------------------------
export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const priority = searchParams.get('priority') || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    // Date range filter
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) createdAt.lte = new Date(endDate);
      where.createdAt = createdAt;
    }

    const [emails, total] = await Promise.all([
      db.emailQueue.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' as const },
          { createdAt: 'asc' as const },
        ],
      }),
      db.emailQueue.count({ where }),
    ]);

    // Get summary stats
    const stats = await getEmailQueueStats();

    return NextResponse.json({
      emails,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Email Queue API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list email queue' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------
// POST - Add email to queue
// ----------------------------------------------------------
export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, cc, bcc, subject, body: emailBody, templateId, templateData, scheduledAt, priority } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email address is required' },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: 'Email subject is required' },
        { status: 400 }
      );
    }

    if (!emailBody && !templateId) {
      return NextResponse.json(
        { error: 'Email body or template ID is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid recipient email address' },
        { status: 400 }
      );
    }

    // If templateId is provided, resolve template
    let resolvedBody = emailBody;
    if (templateId) {
      const template = await db.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Email template not found' },
          { status: 404 }
        );
      }

      // Apply template variables
      if (templateData && typeof templateData === 'object') {
        resolvedBody = applyTemplateVariables(template.body, templateData);
      } else {
        resolvedBody = template.body;
      }
    }

    // Create email queue item
    const emailQueueItem = await db.emailQueue.create({
      data: {
        to,
        cc: cc || null,
        bcc: bcc || null,
        subject,
        body: resolvedBody || emailBody || '',
        templateId: templateId || null,
        templateData: templateData ? JSON.stringify(templateData) : null,
        status: 'queued',
        priority: priority || 'normal',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Email added to queue',
      email: emailQueueItem,
    }, { status: 201 });
  } catch (error) {
    console.error('[Email Queue API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to add email to queue' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------
// PUT - Process email queue (mark as sending/sent/failed)
// ----------------------------------------------------------
export async function PUT(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, emailId, emailIds, failedReason } = body;

    // Validate action
    const validActions = ['process', 'mark_sent', 'mark_failed', 'retry', 'mark_sending'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Process: pick up next batch of queued emails due for sending
    if (action === 'process') {
      const batchSize = parseInt(body.batchSize) || 10;
      const now = new Date();

      // Find emails that are due (scheduledAt is null or in the past)
      const dueEmails = await db.emailQueue.findMany({
        where: {
          status: 'queued',
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: now } },
          ],
        } as any,
        take: batchSize,
        orderBy: [
          { priority: 'desc' as const },
          { createdAt: 'asc' as const },
        ],
      });

      // Mark them as sending
      const updatedEmails = [];
      for (const email of dueEmails) {
        const updated = await db.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'sending',
            attempts: { increment: 1 },
            lastAttemptAt: new Date(),
          } as any,
        });
        updatedEmails.push(updated);
      }

      // TODO: In production, actually send the emails via SMTP/API here
      // For now, simulate by marking as sent
      for (const email of updatedEmails) {
        await db.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });

        // Create email log entry
        try {
          await db.emailLog.create({
            data: {
              recipientEmail: email.to,
              subject: email.subject,
              body: email.body,
              templateId: email.templateId,
              status: 'sent',
            } as any,
          });
        } catch {
          // Non-critical
        }
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${updatedEmails.length} email(s)`,
        processed: updatedEmails.length,
      });
    }

    // Handle specific email status updates
    const targetIds = emailId ? [emailId] : emailIds;
    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return NextResponse.json(
        { error: 'emailId or emailIds array is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const id of targetIds) {
      const email = await db.emailQueue.findUnique({ where: { id } });
      if (!email) {
        results.push({ id, error: 'Email not found' });
        continue;
      }

      let updateData: any = {};

      switch (action) {
        case 'mark_sending':
          updateData = {
            status: 'sending',
            lastAttemptAt: new Date(),
            attempts: { increment: 1 },
          };
          break;

        case 'mark_sent':
          updateData = {
            status: 'sent',
            sentAt: new Date(),
          };
          // Also create email log
          try {
            await db.emailLog.create({
              data: {
                recipientEmail: email.to,
                subject: email.subject,
                body: email.body,
                templateId: email.templateId,
                status: 'sent',
              } as any,
            });
          } catch {
            // Non-critical
          }
          break;

        case 'mark_failed':
          updateData = {
            status: 'failed',
            failedReason: failedReason || 'Unknown error',
            lastAttemptAt: new Date(),
          };
          // Log failed email
          try {
            await db.emailLog.create({
              data: {
                recipientEmail: email.to,
                subject: email.subject,
                body: email.body,
                templateId: email.templateId,
                status: 'failed',
                error: failedReason || 'Unknown error',
              } as any,
            });
          } catch {
            // Non-critical
          }
          break;

        case 'retry':
          if (email.attempts >= email.maxAttempts) {
            results.push({ id, error: 'Max retry attempts reached' });
            continue;
          }
          updateData = {
            status: 'queued',
          };
          break;
      }

      const updated = await db.emailQueue.update({
        where: { id },
        data: updateData,
      });

      results.push({ id, status: updated.status });
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('[Email Queue API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to process email queue' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------
// DELETE - Cancel queued email
// ----------------------------------------------------------
export async function DELETE(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (!emailId) {
      return NextResponse.json(
        { error: 'emailId query parameter is required' },
        { status: 400 }
      );
    }

    const email = await db.emailQueue.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Can only cancel queued or scheduled emails
    if (!['queued', 'scheduled'].includes(email.status)) {
      return NextResponse.json(
        { error: `Cannot cancel email with status "${email.status}". Only queued/scheduled emails can be cancelled.` },
        { status: 400 }
      );
    }

    await db.emailQueue.update({
      where: { id: emailId },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({
      success: true,
      message: 'Email cancelled',
    });
  } catch (error) {
    console.error('[Email Queue API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel email' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------
// Helper: Get email queue stats
// ----------------------------------------------------------
async function getEmailQueueStats() {
  try {
    const [queued, sending, sent, failed, cancelled] = await Promise.all([
      db.emailQueue.count({ where: { status: 'queued' } }),
      db.emailQueue.count({ where: { status: 'sending' } }),
      db.emailQueue.count({ where: { status: 'sent' } }),
      db.emailQueue.count({ where: { status: 'failed' } }),
      db.emailQueue.count({ where: { status: 'cancelled' } }),
    ]);

    return { queued, sending, sent, failed, cancelled, total: queued + sending + sent + failed + cancelled };
  } catch {
    return { queued: 0, sending: 0, sent: 0, failed: 0, cancelled: 0, total: 0 };
  }
}

// ----------------------------------------------------------
// Helper: Apply template variables
// ----------------------------------------------------------
function applyTemplateVariables(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}
