import { NextResponse } from "next/server";
import { UccService } from "@/lib/communication/ucc-service";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status") || undefined;
      const channel = searchParams.get("channel") || undefined;
      const assignedToId = searchParams.get("assignedToId") || undefined;

      const conversations = await UccService.getConversations({
        status,
        channel,
        assignedToId,
      });

      return NextResponse.json({ success: true, data: conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json(
        { success: false, error: "Internal Server Error" },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      if (!body.threadId || !body.content || !body.recipientContact) {
        return NextResponse.json(
          { success: false, error: "Missing required fields" },
          { status: 400 }
        );
      }

      const message = await UccService.sendOutboundMessage({
        threadId: body.threadId,
        content: body.content,
        senderUserId: auth.userId,
        recipientContact: body.recipientContact,
      });

      return NextResponse.json({ success: true, data: message });
    } catch (error: any) {
      console.error("Error sending message:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to send message" },
        { status: 500 }
      );
    }
  })(request);
}
