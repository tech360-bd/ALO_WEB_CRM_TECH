import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// WhatsApp document upload — auto-detects document type and matches to student
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, fileName, fileType, fileSize, documentText } = body;

  if (!phone || !fileName) {
    return NextResponse.json({ error: "Phone and fileName are required" }, { status: 400 });
  }

  // 1. Match sender by phone to student
  let student = await db.student.findFirst({ where: { mobile: phone } });
  let lead = await db.lead.findFirst({ where: { phone } });
  let leadId = lead?.id || null;
  let studentId = student?.id || null;

  // 2. If no profile exists, create Lead + Student Profile + Student ID
  if (!student && !lead) {
    const count = await db.lead.count();
    lead = await db.lead.create({
      data: {
        leadId: `ALO-L-${(10001 + count + 1).toString()}`,
        fullName: `WhatsApp Doc ${phone.slice(-4)}`,
        phone,
        source: "WHATSAPP",
        sourceDetail: "WhatsApp document upload",
        notes: `Auto-created from WhatsApp document upload: ${fileName}`,
        status: "NEW",
        welcomeSent: false,
      },
    });
    leadId = lead.id;

    const studentCount = await db.student.count();
    student = await db.student.create({
      data: {
        studentId: `AE-${new Date().getFullYear()}${(100001 + studentCount).toString()}`,
        firstName: "WhatsApp",
        lastName: phone.slice(-4),
        fullName: `WhatsApp ${phone.slice(-4)}`,
        email: `wa_${phone.slice(-4)}@aloeducation.com`,
        mobile: phone,
        nationality: "Bangladeshi",
        leadId: lead.id,
        profileCompletion: 5,
        status: "ACTIVE",
      },
    });
    studentId = student.id;
  }

  // 3. Detect document type
  const fileNameLower = fileName.toLowerCase();
  let docCategory = "OTHER";
  let docName = fileName;

  if (/passport/.test(fileNameLower)) { docCategory = "PASSPORT"; docName = "Passport"; }
  else if (/certificate|cert|ssc|hsc|degree/.test(fileNameLower)) { docCategory = "ACADEMIC_CERT"; docName = "Academic Certificate"; }
  else if (/transcript|marksheet|result/.test(fileNameLower)) { docCategory = "TRANSCRIPT"; docName = "Academic Transcript"; }
  else if (/bank|statement|finance/.test(fileNameLower)) { docCategory = "BANK_STATEMENT"; docName = "Bank Statement"; }
  else if (/ielts|pte|toefl|duolingo|english/.test(fileNameLower)) { docCategory = "IELTS_CERT"; docName = "English Test Certificate"; }
  else if (/visa/.test(fileNameLower)) { docCategory = "VISA_DOC"; docName = "Visa Document"; }
  else if (/offer|admission/.test(fileNameLower)) { docCategory = "OTHER"; docName = "Offer Letter"; }
  else if (/cas|coe|i20/.test(fileNameLower)) { docCategory = "OTHER"; docName = "CAS/COE/I-20"; }
  else if (/receipt|payment|invoice/.test(fileNameLower)) { docCategory = "OTHER"; docName = "Payment Receipt"; }
  else if (/cv|resume/.test(fileNameLower)) { docCategory = "CV"; docName = "CV/Resume"; }
  else if (/sop|statement/.test(fileNameLower)) { docCategory = "SOP"; docName = "Statement of Purpose"; }

  // 4. If document type unclear, ask user to confirm
  if (docCategory === "OTHER" && !/offer|cas|coe|i20|receipt|payment|invoice/.test(fileNameLower)) {
    return NextResponse.json({
      needsConfirmation: true,
      message: "I received your document but couldn't determine the type. Please reply with the document type (e.g., passport, transcript, bank statement, IELTS certificate, CV, SOP, offer letter, etc.)",
      suggestedTypes: ["Passport", "Academic Certificate", "Transcript", "Bank Statement", "English Test Certificate", "CV", "SOP", "Visa Document", "Offer Letter"],
    });
  }

  // 5. Save document to student profile
  const document = await db.document.create({
    data: {
      studentId: studentId!,
      category: docCategory,
      name: docName,
      required: true,
      fileName,
      fileType: fileType || "application/pdf",
      fileSize: fileSize || 0,
      storagePath: `/private/docs/${studentId}/${docCategory.toLowerCase()}.pdf`,
      status: "UPLOADED",
      uploadedAt: new Date(),
    },
  });

  // 6. Save to CRM timeline
  await db.timelineEvent.create({
    data: {
      studentId,
      type: "DOC_UPLOADED",
      title: `${docName} uploaded via WhatsApp`,
      description: `Document "${fileName}" uploaded from WhatsApp number ${phone}`,
    },
  });

  // 7. Audit log
  await db.auditLog.create({
    data: {
      action: "DOC_UPLOAD",
      resource: "Document",
      resourceId: document.id,
      details: JSON.stringify({ phone, fileName, docCategory, studentId, autoCreated: !leadId }),
    },
  });

  return NextResponse.json({
    success: true,
    document,
    studentId,
    leadId,
    docCategory,
    autoCreated: !leadId,
    message: `Document "${docName}" uploaded successfully and attached to your profile. Our application team will review it within 24 hours.`,
  });
}
