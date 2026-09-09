import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

type OldCrmImportRow = {
  studentName?: string;
  name?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  passportNumber?: string;
  oldCrmId?: string;
  id?: string;
  dateOfBirth?: string;
  countryInterest?: string;
  courseInterest?: string;
  universityInterest?: string;
  applicationStatus?: string;
  counselorName?: string;
  documents?: unknown[];
  notes?: unknown[];
  communicationHistory?: unknown[];
  paymentStatus?: string;
  visaStatus?: string;
  createdDate?: string;
  updatedDate?: string;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isImportRow(value: unknown): value is OldCrmImportRow {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export const GET = withAuth(
  async (req: Request, auth: AuthContext) => {
    try {
      const batches = await db.importBatch.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          students: {
            take: 100,
          },
        },
      });

      return NextResponse.json({
        success: true,
        batches,
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch import batches' },
        { status: 500 }
      );
    }
  },
  { requireRoles: ['super_admin'] }
);

export const POST = withAuth(
  async (req: Request, auth: AuthContext) => {
    try {
      const body = await req.json();
      const { sourceCrmName = 'Old CRM', fileName = 'old_crm_export.csv', rows = [] } = body;

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No data rows provided for import' },
          { status: 400 }
        );
      }

      // Create Batch
      const batch = await db.importBatch.create({
        data: {
          sourceCrmName,
          fileName,
          totalRows: rows.length,
          createdBy: auth.userId,
          status: 'pending_review',
        },
      });

      let newCount = 0;
      let matchedCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;

      // Existing users for deduplication
      const existingUsers = await db.portalUser.findMany({ where: { userType: 'STUDENT' } });
      const existingProfiles = await db.portalStudentProfile.findMany();

      for (const row of rows) {
        try {
          if (!isImportRow(row)) {
            errorCount++;
            continue;
          }

          const studentName = asString(row.studentName) || asString(row.name);
          const phone = asString(row.phone);
          const email = asString(row.email).toLowerCase();
          const whatsapp = asString(row.whatsapp) || phone;
          const passportNumber = asString(row.passportNumber);
          const oldCrmId = asString(row.oldCrmId) || asString(row.id);

          if (!studentName && !phone && !email) {
            errorCount++;
            continue;
          }

          // Deduplication matching logic
          let matchedStudentId = '';
          let duplicateRiskLevel = 'none';

          const directMatch = existingUsers.find(u =>
            (email && u.email?.toLowerCase() === email.toLowerCase())
          ) || existingProfiles.find(p => passportNumber && p.passportNumber === passportNumber);

          if (directMatch) {
            matchedStudentId = directMatch.id;
            duplicateRiskLevel = 'exact';
            matchedCount++;
          } else {
            const nameMatch = existingProfiles.find(p =>
              studentName && p.fullName?.toLowerCase() === studentName.toLowerCase()
            );
            if (nameMatch) {
              matchedStudentId = nameMatch.id;
              duplicateRiskLevel = 'high';
              duplicateCount++;
            } else {
              newCount++;
            }
          }

          await db.importStagingStudent.create({
            data: {
              batchId: batch.id,
              oldCrmId,
              studentName,
              phone,
              whatsapp,
              email,
              passportNumber,
              dateOfBirth: asString(row.dateOfBirth),
              countryInterest: asString(row.countryInterest),
              courseInterest: asString(row.courseInterest),
              universityInterest: asString(row.universityInterest),
              applicationStatus: asString(row.applicationStatus) || 'new',
              counselorName: asString(row.counselorName),
              documentsJson: JSON.stringify(row.documents || []),
              notesJson: JSON.stringify(row.notes || []),
              communicationJson: JSON.stringify(row.communicationHistory || []),
              paymentStatus: asString(row.paymentStatus) || 'none',
              visaStatus: asString(row.visaStatus) || 'none',
              createdDate: asString(row.createdDate),
              updatedDate: asString(row.updatedDate),
              matchedStudentId,
              duplicateRiskLevel,
              status: 'staging',
              errorDetails: email ? '' : 'Email missing. Portal account cannot be created until Super Admin supplies a verified email.',
            },
          });
        } catch (err: any) {
          errorCount++;
        }
      }

      // Update batch counters
      await db.importBatch.update({
        where: { id: batch.id },
        data: {
          newCount,
          matchedCount,
          duplicateCount,
          errorCount,
        },
      });

      // Audit Log
      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.userId,
          action: 'import.staging.created',
          entityType: 'ImportBatch',
          entityId: batch.id,
          metadata: JSON.stringify({ totalRows: rows.length, newCount, matchedCount }),
          ipAddress: '',
          userAgent: '',
        },
      });

      return NextResponse.json({
        success: true,
        batchId: batch.id,
        summary: {
          totalRows: rows.length,
          newCount,
          matchedCount,
          duplicateCount,
          errorCount,
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to process import preview' },
        { status: 500 }
      );
    }
  },
  { requireRoles: ['super_admin'] }
);

export const PATCH = withAuth(
  async (req: Request, auth: AuthContext) => {
    try {
      const body = await req.json();
      const { batchId, action = 'approve' } = body;

      const batch = await db.importBatch.findUnique({
        where: { id: batchId },
        include: { students: true },
      });

      if (!batch) {
        return NextResponse.json(
          { success: false, error: 'Import batch not found' },
          { status: 404 }
        );
      }

      if (action === 'approve') {
        const year = new Date().getFullYear();
        let importedCount = 0;
        let skippedCount = 0;
        const existingYearStudentCount = await db.portalStudentProfile.count({
          where: { studentId: { startsWith: `AE-${year}` } },
        });

        await db.$transaction(async (tx) => {
        for (const st of batch.students) {
          if (st.status === 'imported') continue;

          let studentProfileId = st.matchedStudentId;

          if (!studentProfileId) {
            if (!st.email) {
              await tx.importStagingStudent.update({
                where: { id: st.id },
                data: {
                  status: 'needs_review',
                  errorDetails: 'Email missing. Super Admin must add a verified email before portal-user creation.',
                },
              });
              skippedCount++;
              continue;
            }

            const studentCode = `AE-${year}${String(existingYearStudentCount + importedCount + 1).padStart(6, '0')}`;

            const newUser = await tx.portalUser.create({
              data: {
                email: st.email,
                passwordHash: '',
                name: st.studentName,
                userType: 'STUDENT',
                status: 'pending_activation',
                firstLoginRequired: true,
                emailVerified: false,
              },
            });

            const newProfile = await tx.portalStudentProfile.create({
              data: {
                userId: newUser.id,
                studentId: studentCode,
                fullName: st.studentName,
                passportNumber: st.passportNumber,
                preferredCountry: st.countryInterest,
                preferredSubject: st.courseInterest,
                counselorName: st.counselorName,
              },
            });

            studentProfileId = newProfile.id;
          }

          // Mark staging record as imported
          await tx.importStagingStudent.update({
            where: { id: st.id },
            data: { status: 'imported' },
          });

          importedCount++;
        }

        await tx.importBatch.update({
          where: { id: batch.id },
          data: { status: skippedCount > 0 ? 'partially_approved' : 'approved' },
        });

        // Audit Log
        await tx.portalAuditLog.create({
          data: {
            actorUserId: auth.userId,
            action: 'import.batch.approved',
            entityType: 'ImportBatch',
            entityId: batch.id,
            metadata: JSON.stringify({ importedCount, skippedCount }),
            ipAddress: '',
            userAgent: '',
          },
        });
        });

        return NextResponse.json({
          success: true,
          message: `Imported ${importedCount} student records from batch. ${skippedCount} rows require review before portal activation.`,
          importedCount,
          skippedCount,
        });
      }

      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to approve import batch' },
        { status: 500 }
      );
    }
  },
  { requireRoles: ['super_admin'] }
);
