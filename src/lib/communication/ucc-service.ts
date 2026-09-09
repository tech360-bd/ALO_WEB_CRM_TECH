import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class UccService {
  /**
   * Retrieves conversations (threads) for the inbox.
   */
  static async getConversations(filters: {
    status?: string;
    channel?: string;
    assignedToId?: string;
  }) {
    const where: Prisma.CommunicationThreadWhereInput = {};
    
    if (filters.status) where.status = filters.status;
    if (filters.channel) where.channel = filters.channel;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;

    return db.communicationThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    });
  }

  /**
   * Retrieves messages for a specific thread.
   */
  static async getMessagesForThread(threadId: string) {
    return db.communicationMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Handles an incoming message (e.g., from a WhatsApp webhook).
   * Finds or creates a thread and appends the message.
   */
  static async handleIncomingMessage(params: {
    channel: string;
    senderContact: string; // e.g., phone number for WhatsApp
    senderName?: string;
    content: string;
    messageType?: string;
  }) {
    const { channel, senderContact, senderName = "Unknown", content, messageType = "text" } = params;

    // 1. Find existing thread for this contact/channel
    let thread = await db.communicationThread.findFirst({
      where: {
        channel,
        // Using studentId or a custom contact field mapping could be better, but assuming 
        // we can find it via recent messages from this contact for now.
        messages: {
          some: {
            senderContact
          }
        },
        status: 'open'
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // 2. If no thread, create a new one
    if (!thread) {
      thread = await db.communicationThread.create({
        data: {
          channel,
          status: 'open',
          lastMessageAt: new Date(),
          lastMessagePreview: content.substring(0, 50),
          unreadCount: 1,
        }
      });
    } else {
      // Update thread
      thread = await db.communicationThread.update({
        where: { id: thread.id },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: content.substring(0, 50),
          unreadCount: { increment: 1 },
        }
      });
    }

    // 3. Create the message
    const message = await db.communicationMessage.create({
      data: {
        threadId: thread.id,
        channel,
        direction: 'inbound',
        senderContact,
        senderName,
        content,
        messageType,
        messageBody: content,
        status: 'unread',
      }
    });

    return { thread, message };
  }

  /**
   * Sends an outbound message and appends it to a thread.
   */
  static async sendOutboundMessage(params: {
    threadId: string;
    content: string;
    senderUserId: string;
    recipientContact: string;
  }) {
    const thread = await db.communicationThread.findUnique({ where: { id: params.threadId } });
    if (!thread) throw new Error("Thread not found");

    // Here we would integrate with Twilio/Meta API to actually send the message.
    // For now, we assume success and log it.

    const message = await db.communicationMessage.create({
      data: {
        threadId: thread.id,
        channel: thread.channel,
        direction: 'outbound',
        senderUserId: params.senderUserId,
        recipientContact: params.recipientContact,
        content: params.content,
        messageType: 'text',
        messageBody: params.content,
        status: 'sent',
      }
    });

    await db.communicationThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: `You: ${params.content.substring(0, 45)}`,
      }
    });

    return message;
  }
}
