import { NextRequest, NextResponse } from "next/server";
import { aiChat, extractJson } from "@/lib/ai";
import { db } from "@/lib/db";

// POST — AI document classification + OCR extraction
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { documentId, fileName, documentText } = body;

  if (!documentId || !fileName) {
    return NextResponse.json({ error: "documentId and fileName required" }, { status: 400 });
  }

  const systemPrompt = `You are the ALO Education AI Document Classifier. Analyze the uploaded document and classify it.

Document filename: ${fileName}
Document text (OCR): ${documentText || "No OCR text available — classify by filename only"}

Classify into one of these types:
PASSPORT, NID, BIRTH_CERT, SSC, HSC, DIPLOMA, BACHELOR, MASTERS, TRANSCRIPT, RECOMMENDATION, CV, EMPLOYMENT_LETTER, OFFER_LETTER, CAS, COE, VISA, IELTS, TOEFL, PTE, MOI, POLICE_CLEARANCE, MEDICAL, BANK_STATEMENT, FINANCIAL_AFFIDAVIT, SPONSOR_LETTER, PHOTO, SIGNATURE, UNKNOWN

Also extract any available data:
- fullName, dob, gender, nationality
- passportNumber, issueDate, expiryDate
- institution, certificateNumber, cgpa, percentage
- bandScore, testType
- accountNumber, bankName, branch

Return ONLY valid JSON:
{
  "detectedType": "<TYPE>",
  "confidence": <0-1>,
  "extractedData": {
    "fullName": "...",
    "dob": "...",
    "passportNumber": "...",
    "institution": "...",
    "cgpa": "...",
    "bandScore": "...",
    "accountNumber": "..."
  },
  "ocrText": "<summarized OCR text>"
}`;

  const raw = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Classify this document and extract data." },
  ], { temperature: 0.2 });

  const parsed = extractJson(raw);

  const classification = await db.aiDocumentClassification.create({
    data: {
      documentId,
      detectedType: parsed?.detectedType || "UNKNOWN",
      confidence: parsed?.confidence || 0.5,
      extractedData: JSON.stringify(parsed?.extractedData || {}),
      ocrText: parsed?.ocrText || raw.slice(0, 500),
      autoFilled: false,
      humanVerified: false,
    },
  });

  await db.auditLog.create({
    data: { action: "AI_ACTION", resource: "AiDocumentClassification", resourceId: classification.id, details: JSON.stringify({ detectedType: parsed?.detectedType, confidence: parsed?.confidence }) },
  });

  return NextResponse.json({
    classification,
    detectedType: parsed?.detectedType || "UNKNOWN",
    confidence: parsed?.confidence || 0.5,
    extractedData: parsed?.extractedData || {},
    message: `Document classified as ${parsed?.detectedType || "UNKNOWN"} with ${Math.round((parsed?.confidence || 0.5) * 100)}% confidence.`,
  });
}
