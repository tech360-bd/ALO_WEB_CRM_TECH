import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import {
  COURSE_COLUMNS,
  VALID_CURRENCIES,
  VALID_STATUSES,
  CURRENCY_FIELDS,
  BOOLEAN_FIELDS,
  NUMBER_FIELDS,
  DATE_FIELDS,
  REQUIRED_FIELDS,
  buildDuplicateKey,
} from '@/lib/crm/import-constants';

interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

function validateRow(
  row: Record<string, string>,
  rowIndex: number,
  existingKeys: Set<string>,
  knownUniversities: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || row[field].trim() === '') {
      errors.push({ row: rowIndex, field, message: `${field} is required`, severity: 'error' });
    }
  }

  // Currency validation
  for (const field of CURRENCY_FIELDS) {
    const val = (row[field] || '').trim().toUpperCase();
    if (val && !VALID_CURRENCIES.includes(val as (typeof VALID_CURRENCIES)[number])) {
      errors.push({
        row: rowIndex,
        field,
        message: `Invalid currency "${val}". Must be one of: ${VALID_CURRENCIES.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Boolean validation
  for (const field of BOOLEAN_FIELDS) {
    const val = (row[field] || '').trim().toUpperCase();
    if (val && val !== 'TRUE' && val !== 'FALSE') {
      errors.push({
        row: rowIndex,
        field,
        message: `Invalid boolean "${val}". Must be TRUE or FALSE`,
        severity: 'error',
      });
    }
  }

  // Date validation
  for (const field of DATE_FIELDS) {
    const val = (row[field] || '').trim();
    if (val) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(val)) {
        errors.push({
          row: rowIndex,
          field,
          message: `Invalid date format "${val}". Must be YYYY-MM-DD`,
          severity: 'error',
        });
      } else {
        const d = new Date(val);
        if (isNaN(d.getTime())) {
          errors.push({
            row: rowIndex,
            field,
            message: `Invalid date "${val}"`,
            severity: 'error',
          });
        }
      }
    }
  }

  // Number validation
  for (const field of NUMBER_FIELDS) {
    const val = (row[field] || '').trim();
    if (val && isNaN(Number(val))) {
      errors.push({
        row: rowIndex,
        field,
        message: `Invalid number "${val}". Must be a numeric value`,
        severity: 'error',
      });
    }
  }

  // Status validation (if status fields are present)
  const statusFields = ['status', 'course_status', 'university_status'];
  for (const field of statusFields) {
    const val = (row[field] || '').trim().toLowerCase();
    if (val && !VALID_STATUSES.includes(val as (typeof VALID_STATUSES)[number])) {
      errors.push({
        row: rowIndex,
        field,
        message: `Invalid status "${val}". Must be one of: ${VALID_STATUSES.join(', ')}`,
        severity: 'warning',
      });
    }
  }

  // Duplicate key check (only if required fields are present)
  const uid = (row['university_id'] || '').trim();
  const cid = (row['course_id'] || '').trim();
  const iyear = (row['intake_year'] || '').trim();
  const imonth = (row['intake_month'] || '').trim();
  if (uid && cid && iyear && imonth) {
    const key = buildDuplicateKey(uid, cid, iyear, imonth);
    if (existingKeys.has(key)) {
      errors.push({
        row: rowIndex,
        field: 'duplicate_key',
        message: `Duplicate row: university_id=${uid}, course_id=${cid}, intake_year=${iyear}, intake_month=${imonth}`,
        severity: 'error',
      });
    }
    existingKeys.add(key);
  }

  // University ID existence check
  if (uid && !knownUniversities.has(uid)) {
    errors.push({
      row: rowIndex,
      field: 'university_id',
      message: `University "${uid}" not found in database. Map it first or it will be created on import.`,
      severity: 'warning',
    });
  }

  // Missing source_url warning
  const sourceUrl = (row['source_url'] || '').trim();
  if (!sourceUrl) {
    errors.push({
      row: rowIndex,
      field: 'source_url',
      message: 'source_url is empty. Course status will be auto-set to "needs_official_source".',
      severity: 'warning',
    });
  }

  return errors;
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { importType, rows, columns } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    // Fetch existing university IDs
    const universities = await db.crmUniversity.findMany({
      select: { universityId: true },
    }) as any[];
    const knownUniversities = new Set<string>(universities.map((u: any) => u.universityId));

    // Fetch existing intake records for duplicate check
    const existingIntakes = await db.crmCourseIntakeFee.findMany({
      select: { universityId: true, courseId: true, intakeYear: true, intakeMonth: true },
    });
    const existingKeys = new Set<string>();
    for (const intake of existingIntakes) {
      existingKeys.add(
        buildDuplicateKey(
          intake.universityId,
          intake.courseId,
          String(intake.intakeYear),
          intake.intakeMonth
        )
      );
    }

    const allErrors: ValidationError[] = [];
    const validRowIndices: number[] = [];
    const warningRowIndices: number[] = [];
    const blockedRowIndices: number[] = [];
    const duplicateRowIndices: number[] = [];

    const csvKeys = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (typeof row !== 'object' || row === null) continue;

      const rowErrors = validateRow(row, i + 1, csvKeys, knownUniversities);

      const hasErrors = rowErrors.some((e) => e.severity === 'error');
      const hasWarnings = rowErrors.some((e) => e.severity === 'warning');
      const isDuplicate = rowErrors.some((e) => e.field === 'duplicate_key');

      if (isDuplicate && hasErrors) {
        duplicateRowIndices.push(i);
      } else if (hasErrors) {
        blockedRowIndices.push(i);
      } else if (hasWarnings) {
        warningRowIndices.push(i);
        validRowIndices.push(i);
      } else {
        validRowIndices.push(i);
      }

      allErrors.push(...rowErrors);
    }

    return NextResponse.json({
      validRows: validRowIndices,
      warningRows: warningRowIndices,
      blockedRows: blockedRowIndices,
      duplicateRows: duplicateRowIndices,
      errors: allErrors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}