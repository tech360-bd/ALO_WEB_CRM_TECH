import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const GET = withStudentAuth(async (request, auth) => {
  try {
    const documents = await db.studentDocument.findMany({
      where: { studentId: auth.studentId },
    });

    const enrichedDocuments = await Promise.all(
      documents.map(async (doc) => {
        const versions = await db.documentVersion.findMany({
          where: { documentId: doc.id },
          orderBy: { versionNumber: 'desc' }
        });
        return { ...doc, versions };
      })
    );

    const groupedByCategory = enrichedDocuments.reduce((acc, doc) => {
      const cat = doc.category || 'uncategorized';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(doc);
      return acc;
    }, {} as Record<string, typeof enrichedDocuments>);

    return NextResponse.json({ success: true, data: groupedByCategory });
  } catch (error) {
    console.error('Documents GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
  }
});

export const POST = withStudentAuth(async () => {
  return NextResponse.json({ success: false, error: 'Document upload should use the upload route' }, { status: 405 });
});
