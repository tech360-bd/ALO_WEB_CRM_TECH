import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const studentId = auth.userId;
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const saved = await db.savedCourse.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, data: saved });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const studentId = auth.userId;
      if (!studentId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const body = await req.json();
      const { courseId, courseName, universityName, country, tuitionFee, level, intake, action } = body;

      const title = courseName || 'Course';

      if (action === 'remove') {
        await db.savedCourse.deleteMany({
          where: {
            studentId,
            OR: [
              { courseName: title },
              { notes: courseId },
            ],
          },
        });
        return NextResponse.json({ success: true, message: 'Removed from shortlist' });
      }

      const existing = await db.savedCourse.findFirst({
        where: {
          studentId,
          OR: [
            { courseName: title },
            { notes: courseId },
          ],
        },
      });

      if (existing) {
        return NextResponse.json({ success: true, message: 'Course already shortlisted', data: existing });
      }

      // Missing values are stored empty rather than defaulted. Inventing a
      // country, fee or intake here would put fabricated data into the student's
      // own shortlist (and later into comparison and finance screens).
      const newSaved = await db.savedCourse.create({
        data: {
          studentId,
          courseName: title,
          universityName: universityName || '',
          country: country || '',
          level: level || '',
          tuitionFee: tuitionFee || '',
          intake: intake || '',
          notes: courseId || '',
        },
      });

      return NextResponse.json({ success: true, message: 'Course added to shortlist', data: newSaved });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}
