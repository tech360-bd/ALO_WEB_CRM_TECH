import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const {
      applicationId,
      studentName,
      studentEmail,
      selectedDocuments,
      ccEmail,
      customSubject,
      customBody,
      action,
    } = body

    if (!applicationId || !studentEmail || !selectedDocuments?.length || !action) {
      return NextResponse.json(
        { error: 'applicationId, studentEmail, selectedDocuments, and action are required' },
        { status: 400 }
      )
    }

    if (!['draft', 'send'].includes(action)) {
      return NextResponse.json({ error: 'action must be draft or send' }, { status: 400 })
    }

    // Find the application
    const application = await db.application.findUnique({
      where: { applicationId },
      include: { documents: true },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Find the student by Application.studentId (which is Student.id)
    const student = await db.student.findUnique({
      where: { id: application.studentId },
    })

    // Build email content
    let subject: string
    let emailBody: string

    if (customBody) {
      emailBody = customBody
    } else {
      // Auto-generate email body listing selected missing documents
      const selectedDocs = application.documents.filter((d) =>
        selectedDocuments.includes(d.id)
      )

      const docList = selectedDocs
        .map((doc) => `• ${doc.name}`)
        .join('\n')

      const firstName = student?.firstName || studentName?.split(' ')[0] || 'Student'

      emailBody = `Dear ${firstName},

Greetings from ALO Education.

📑 Missing Documents

${docList}

Please submit these documents at your earliest convenience to proceed with your application for ${application.course} at ${application.university}.

If you have already submitted any of these documents, please let us know so we can update your file.

Best regards,
ALO Education Team`
    }

    subject = customSubject || `Missing Documents — ${application.course} at ${application.university}`

    // Create EmailLog record
    const emailLog = await db.emailLog.create({
      data: {
        applicationId,
        studentId: application.studentId,
        toEmail: studentEmail,
        ccEmail: ccEmail || null,
        subject,
        body: emailBody,
        status: action === 'send' ? 'SENT' : 'DRAFT',
        type: 'DOCUMENT_REQUEST',
        sentAt: action === 'send' ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      emailId: emailLog.id,
      status: emailLog.status,
    })
  } catch (error) {
    console.error('[communication/send-email] Error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
