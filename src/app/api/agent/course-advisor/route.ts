import { NextResponse } from 'next/server';

/**
 * International Course Advisor: DISABLED (fail closed).
 *
 * This endpoint used to answer from repository-root CSV files, including
 * supervisors.csv (invented academics with invented e-mail addresses at real
 * university domains) and a templated 560-university / 11,200-course set.
 * None of that data is verified, so nothing from it may reach any user,
 * authenticated or not.
 *
 * The handlers deliberately import no catalogue or CSV-reading module and
 * perform no data access. Course discovery and eligibility are served from
 * verified, published records by /api/course-finder and
 * /api/course-finder/eligibility-engine.
 *
 * Evidence: AUDIT/course-finder-2026-10-12/UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md
 */
const DISABLED_BODY = {
  success: false,
  disabled: true,
  code: 'COURSE_ADVISOR_DISABLED_UNVERIFIED_DATA',
  error:
    'The course advisor is unavailable because its data source has not been verified. Use the Course Finder, which shows verified courses only.',
} as const;

function disabled() {
  return NextResponse.json(DISABLED_BODY, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  return disabled();
}

export async function POST() {
  return disabled();
}

export async function PUT() {
  return disabled();
}

export async function PATCH() {
  return disabled();
}

export async function DELETE() {
  return disabled();
}
