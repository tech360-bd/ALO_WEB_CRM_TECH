import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: Request, context: any) => {
  try {
    const params = await context.params;
    const { id } = params;

    const batch = await db.importBatch.findUnique({
      where: { id },
      include: {
        students: true,
      },
    });

    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    const duplicateMatches: any[] = [];
    
    // Simulating finding potential matches in DB for duplicates for rich preview
    // In a real application, you might cache this or do specific queries
    for (const staged of batch.students) {
      if (staged.email || staged.phone || staged.whatsapp || staged.passportNumber) {
         const match = await db.student.findFirst({
           where: {
             OR: [
               ...(staged.email ? [{ email: staged.email }] : []),
               ...(staged.phone ? [{ phone: staged.phone }] : []),
             ],
           },
         });
         
         if (match) {
           duplicateMatches.push({
             stagedStudent: staged,
             existingStudent: match,
           });
         }
      }
    }

    return NextResponse.json({ 
      success: true, 
      preview: {
        totalRows: batch.totalRows,
        newCount: batch.newCount,
        matchedCount: batch.matchedCount,
        duplicateCount: batch.duplicateCount,
        errorCount: batch.errorCount,
        stagedStudentsSample: batch.students.slice(0, 10),
        duplicateMatches,
        validationErrors: [] // Add your validation logic here if any
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
