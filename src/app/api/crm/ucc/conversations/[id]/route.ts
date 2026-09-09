import { NextResponse } from "next/server";
import { UccService } from "@/lib/communication/ucc-service";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, auth) => {
    try {
      const messages = await UccService.getMessagesForThread(params.id);
      return NextResponse.json({ success: true, data: messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { success: false, error: "Internal Server Error" },
        { status: 500 }
      );
    }
  })(request);
}
