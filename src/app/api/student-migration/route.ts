import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { customInitApp } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  customInitApp();
  try {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decodedToken = await getAuth().verifyIdToken(token);
    
    return NextResponse.json({ status: "success", uid: decodedToken.uid, data: [] });
  } catch (error) {
    return NextResponse.json({ error: "Invalid Session" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  return NextResponse.json({ status: "pending_db_schema_integration" }, { status: 200 });
}
