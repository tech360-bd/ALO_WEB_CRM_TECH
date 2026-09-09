// @ts-nocheck
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// SMART ELIGIBILITY CHECKER
// Brand: ALO Education — Blue #0057B8, Orange #E8501A
// Rule-based matching against published courses.
// ============================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nationality,
      countryOfResidence,
      highestQualification,
      subject,
      grade,
      gpa,
      graduationYear,
      studyGap,
      englishTest,
      englishScore,
      workExperience,
      preferredCountry,
      preferredLevel,
      preferredSubject,
      budget,
      preferredIntake,
      sessionId,
      userId,
    } = body;

    // Build base WHERE
    const baseWhere = {
      approvalStatus: 'PUBLISHED',
      verificationStatus: 'VERIFIED',
    };

    const andConditions: any[] = [];

    // --- Study level mapping ---
    const levelMap: Record<string, string[]> = {
      'high_school': ['Foundation', 'Diploma', 'Certificate', 'Undergraduate'],
      'bachelors': ['Undergraduate', 'Diploma', 'Certificate'],
      'masters': ['Postgraduate', 'PhD'],
      'phd': ['PhD', 'Postgraduate'],
      'diploma': ['Diploma', 'Certificate', 'Foundation'],
    };

    if (preferredLevel && levelMap[preferredLevel]) {
      andConditions.push({ studyLevel: { in: levelMap[preferredLevel] } });
    } else if (preferredLevel) {
      andConditions.push({ studyLevel: { contains: preferredLevel } });
    }

    // --- Subject area ---
    if (preferredSubject) {
      andConditions.push({ subjectArea: { contains: preferredSubject } });
    }

    // --- Country ---
    if (preferredCountry) {
      andConditions.push({ country: { contains: preferredCountry } });
    }

    // --- Budget (tuition fee max) ---
    if (budget && budget > 0) {
      andConditions.push({
        OR: [
          { tuitionFee: { lte: budget } },
          { tuitionFee: null },
          { scholarshipAvailable: true },
        ],
      });
    }

    // --- English test score matching ---
    if (englishTest && englishScore) {
      const score = parseFloat(englishScore);
      if (englishTest.toLowerCase() === 'ielts') {
        andConditions.push({
          OR: [
            { ieltsMin: { lte: score } },
            { ieltsMin: null },
          ],
        });
      } else if (englishTest.toLowerCase() === 'pte') {
        andConditions.push({
          OR: [
            { pteMin: { lte: score } },
            { pteMin: null },
          ],
        });
      } else if (englishTest.toLowerCase() === 'toefl') {
        andConditions.push({
          OR: [
            { toeflMin: { lte: score } },
            { toeflMin: null },
          ],
        });
      } else if (englishTest.toLowerCase() === 'duolingo') {
        andConditions.push({
          OR: [
            { duolingoMin: { lte: score } },
            { duolingoMin: null },
          ],
        });
      }
    }

    // --- GPA filter ---
    if (gpa && gpa > 0) {
      andConditions.push({
        OR: [
          { gpaMin: { lte: gpa } },
          { gpaMin: null },
        ],
      });
    }

    // --- Intake month ---
    if (preferredIntake) {
      andConditions.push({ intakeMonths: { contains: preferredIntake } });
    }

    const where = {
      ...baseWhere,
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    // Fetch matching courses (limit to 50 for eligibility)
    const courses = await db.crmCourse.findMany({
      where,
      include: {
        university: { select: { name: true, country: true, city: true } },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    // Score each course for match level
    const results = courses.map(course => {
      const reasons: string[] = [];
      let score = 0;

      // Study level match
      if (preferredLevel && levelMap[preferredLevel]) {
        if (levelMap[preferredLevel].includes(course.studyLevel)) {
          score += 30;
          reasons.push(`Study level '${course.studyLevel}' matches your qualification`);
        }
      } else if (preferredLevel && course.studyLevel?.toLowerCase().includes(preferredLevel.toLowerCase())) {
        score += 30;
        reasons.push(`Study level matches`);
      }

      // Subject match
      if (preferredSubject && course.subjectArea?.toLowerCase().includes(preferredSubject.toLowerCase())) {
        score += 25;
        reasons.push(`Subject area '${course.subjectArea}' matches your preference`);
      }

      // Country match
      if (preferredCountry && course.country?.toLowerCase().includes(preferredCountry.toLowerCase())) {
        score += 20;
        reasons.push(`Located in ${course.country}`);
      }

      // Budget match
      if (budget && course.tuitionFee && course.tuitionFee <= budget) {
        score += 15;
        reasons.push(`Tuition fee within your budget`);
      } else if (budget && course.scholarshipAvailable) {
        score += 10;
        reasons.push(`Scholarships may be available to reduce costs`);
      }

      // English test match
      if (englishTest && englishScore) {
        const s = parseFloat(englishScore);
        const testLower = englishTest.toLowerCase();
        if (testLower === 'ielts' && course.ieltsMin && s >= course.ieltsMin) {
          score += 10;
          reasons.push(`Your IELTS score meets the minimum requirement`);
        } else if (testLower === 'pte' && course.pteMin && s >= course.pteMin) {
          score += 10;
          reasons.push(`Your PTE score meets the minimum requirement`);
        } else if (testLower === 'toefl' && course.toeflMin && s >= course.toeflMin) {
          score += 10;
          reasons.push(`Your TOEFL score meets the minimum requirement`);
        } else if (testLower === 'duolingo' && course.duolingoMin && s >= course.duolingoMin) {
          score += 10;
          reasons.push(`Your Duolingo score meets the minimum requirement`);
        }
      }

      // GPA match
      if (gpa && course.gpaMin && gpa >= course.gpaMin) {
        score += 5;
        reasons.push(`Your GPA meets the minimum requirement`);
      }

      // Study gap check (warn if > 2 years)
      if (studyGap && parseInt(studyGap, 10) > 2) {
        reasons.push(`Note: A study gap of ${studyGap} year(s) may require additional documentation`);
        score -= 5;
      }

      // Determine match level
      let matchLevel: 'likely' | 'possible' | 'review';
      if (score >= 60) {
        matchLevel = 'likely';
      } else if (score >= 35) {
        matchLevel = 'possible';
      } else {
        matchLevel = 'review';
      }

      return {
        courseId: course.id,
        courseTitle: course.title,
        universityName: course.university?.name || null,
        country: course.country,
        studyLevel: course.studyLevel,
        subjectArea: course.subjectArea,
        tuitionFee: course.tuitionFee,
        tuitionCurrency: course.tuitionCurrency,
        matchLevel,
        matchScore: score,
        reasons,
        slug: course.slug,
      };
    });

    // Sort by match score descending
    results.sort((a, b) => b.matchScore - a.matchScore);

    const disclaimer =
      'This eligibility check is a general guide based on the information you provided and publicly available course data. ' +
      'It does not guarantee admission. Universities consider many factors including your complete academic history, ' +
      'personal statement, references, and interview performance. Please verify all requirements directly with the university ' +
      'or contact an ALO Education advisor for a comprehensive assessment.';

    // Log the eligibility check
    await db.finderEligibilityResult.create({
      data: {
        sessionId: sessionId || null,
        userId: userId || null,
        responses: JSON.stringify(body),
        results: JSON.stringify(results.slice(0, 20)),
      },
    });

    return NextResponse.json({
      results,
      total: results.length,
      disclaimer,
    });
  } catch (error) {
    console.error('Eligibility API error:', error);
    return NextResponse.json({ error: 'Failed to check eligibility' }, { status: 500 });
  }
}
