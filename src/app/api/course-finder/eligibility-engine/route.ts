// @ts-nocheck
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimitMiddleware } from '@/lib/rate-limiter';

// ============================================================
// ELIGIBILITY ENGINE API
// Brand: ALO Education — Blue #2563EB, Orange #F97316
// Server-side rule-based eligibility evaluation engine.
// Evaluates a student profile against published/verified courses.
// ============================================================

// ---- Eligibility category constants ----
const ELIGIBLE = 'ELIGIBLE';
const LIKELY_ELIGIBLE = 'LIKELY_ELIGIBLE';
const CONDITIONALLY_ELIGIBLE = 'CONDITIONALLY_ELIGIBLE';
const PARTIALLY_MATCHED = 'PARTIALLY_MATCHED';
const NOT_CURRENTLY_ELIGIBLE = 'NOT_CURRENTLY_ELIGIBLE';
const INSUFFICIENT_INFO = 'INSUFFICIENT_INFO';
const COUNSELLOR_REVIEW_REQUIRED = 'COUNSELLOR_REVIEW_REQUIRED';

const ELIGIBILITY_CATEGORIES = [
  ELIGIBLE,
  LIKELY_ELIGIBLE,
  CONDITIONALLY_ELIGIBLE,
  PARTIALLY_MATCHED,
  NOT_CURRENTLY_ELIGIBLE,
  INSUFFICIENT_INFO,
  COUNSELLOR_REVIEW_REQUIRED,
] as const;

// ---- Requirement result constants ----
const MET = 'MET';
const NOT_MET = 'NOT_MET';
const MISSING_INFO = 'MISSING_INFO';
const CONDITION = 'CONDITION';

// ---- Qualification level hierarchy (lower number = lower level) ----
const QUALIFICATION_LEVELS: Record<string, number> = {
  'high_school': 1,
  'secondary_school': 1,
  'ssce': 1,
  'hsc': 1,
  'a_level': 2,
  'alevel': 2,
  'a-level': 2,
  '12th': 1,
  'intermediate': 1,
  'foundation': 2,
  'diploma': 3,
  'certificate': 3,
  'advanced_diploma': 3,
  'bachelors': 4,
  'bachelor': 4,
  'undergraduate': 4,
  'bsc': 4,
  'ba': 4,
  'beng': 4,
  'bba': 4,
  'llb': 4,
  'mbbs': 4,
  'barch': 4,
  'masters': 5,
  'master': 5,
  'postgraduate': 5,
  'msc': 5,
  'ma': 5,
  'meng': 5,
  'mba': 5,
  'llm': 5,
  'mphil': 5,
  'mpharm': 5,
  'phd': 6,
  'doctorate': 6,
  'dphil': 6,
  'post_doc': 7,
  'postdoctoral': 7,
};

// ---- Study level → minimum required qualification level ----
const STUDY_LEVEL_MIN_QUALIFICATION: Record<string, number> = {
  'foundation': 1,
  'certificate': 1,
  'diploma': 1,
  'undergraduate': 2,
  'bachelors': 2,
  'postgraduate': 4,
  'masters': 4,
  'mba': 4,
  'phd': 5,
  'doctorate': 5,
};

// ---- Normalise a qualification type string to a level number ----
function getQualificationLevel(qualificationType: string): number {
  if (!qualificationType) return 0;
  const key = qualificationType.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim();
  return QUALIFICATION_LEVELS[key] || QUALIFICATION_LEVELS[qualificationType.toLowerCase()] || 0;
}

// ---- Find the student's highest qualification ----
function getHighestQualification(academicProfile: any[]) {
  if (!academicProfile || academicProfile.length === 0) return null;
  let highest = academicProfile[0];
  let highestLevel = getQualificationLevel(highest.qualificationType || '');
  for (let i = 1; i < academicProfile.length; i++) {
    const level = getQualificationLevel(academicProfile[i].qualificationType || '');
    if (level > highestLevel) {
      highestLevel = level;
      highest = academicProfile[i];
    }
  }
  return { ...highest, normalizedLevel: highestLevel };
}

// ---- Normalise GPA to a 4.0 scale ----
function normalizeGpaTo4(gpa: number | null | undefined, gpaScale: number | null | undefined): number | null {
  if (gpa == null || gpa <= 0) return null;
  const scale = gpaScale || 4.0;
  return (gpa / scale) * 4.0;
}

// ---- Convert percentage to approximate 4.0 GPA ----
function percentageToGpa4(percentage: number | null | undefined): number | null {
  if (percentage == null || percentage < 0 || percentage > 100) return null;
  // Common conversion: 90-100=4.0, 80-89=3.5-3.9, 70-79=3.0-3.4, etc.
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.5 + ((percentage - 80) / 10) * 0.4;
  if (percentage >= 70) return 3.0 + ((percentage - 70) / 10) * 0.5;
  if (percentage >= 60) return 2.5 + ((percentage - 60) / 10) * 0.5;
  if (percentage >= 50) return 2.0 + ((percentage - 50) / 10) * 0.5;
  if (percentage >= 40) return 1.5 + ((percentage - 40) / 10) * 0.5;
  return 1.0;
}

// ---- Get the best English test score for a given test type ----
function getBestTestScore(englishTests: any[], testType: string): any {
  if (!englishTests || englishTests.length === 0) return null;
  const matching = englishTests
    .filter(t => (t.testType || '').toLowerCase() === testType.toLowerCase())
    .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
  return matching.length > 0 ? matching[0] : null;
}

// ---- Parse intake months from comma-separated string ----
function parseIntakeMonths(intakeStr: string | null | undefined): string[] {
  if (!intakeStr) return [];
  return intakeStr
    .split(',')
    .map(m => m.trim().toLowerCase())
    .filter(Boolean);
}

// ---- Normalise month names for comparison ----
function normaliseMonth(month: string): string {
  if (!month) return '';
  const m = month.trim().toLowerCase();
  const monthMap: Record<string, string> = {
    'jan': 'january', 'january': 'january', '1': 'january', '01': 'january',
    'feb': 'february', 'february': 'february', '2': 'february', '02': 'february',
    'mar': 'march', 'march': 'march', '3': 'march', '03': 'march',
    'apr': 'april', 'april': 'april', '4': 'april', '04': 'april',
    'may': 'may', '5': 'may', '05': 'may',
    'jun': 'june', 'june': 'june', '6': 'june', '06': 'june',
    'jul': 'july', 'july': 'july', '7': 'july', '07': 'july',
    'aug': 'august', 'august': 'august', '8': 'august', '08': 'august',
    'sep': 'september', 'september': 'september', '9': 'september', '09': 'september',
    'oct': 'october', 'october': 'october', '10': 'october',
    'nov': 'november', 'november': 'november', '11': 'november',
    'dec': 'december', 'december': 'december', '12': 'december',
    'fall': 'september', 'autumn': 'september', 'spring': 'january', 'summer': 'may', 'winter': 'january',
  };
  return monthMap[m] || m;
}

// ---- Currency rate approximations to GBP (for budget comparison) ----
const CURRENCY_TO_GBP: Record<string, number> = {
  'gbp': 1.0,
  'usd': 0.79,
  'eur': 0.86,
  'aud': 0.52,
  'cad': 0.58,
  'nzd': 0.47,
  'sgd': 0.59,
  'inr': 0.0095,
  'pkr': 0.0028,
  'bdt': 0.0065,
  'myr': 0.17,
  'cny': 0.11,
  'jpy': 0.0053,
  'aed': 0.22,
};

function convertToGbp(amount: number | null, currency: string | null): number | null {
  if (amount == null || amount <= 0) return null;
  const rate = CURRENCY_TO_GBP[(currency || '').toLowerCase()];
  if (!rate) return amount; // unknown currency, return as-is
  return amount * rate;
}

// ---- Build a single requirement check result ----
function makeRequirement(
  name: string,
  universityRequirement: string | null | undefined,
  studentValue: string | null | undefined,
  result: string,
  source: string = 'course',
  lastVerifiedAt: string | Date | null = null,
  action: string | null = null
) {
  return {
    name,
    universityRequirement: universityRequirement ?? null,
    studentValue: studentValue ?? null,
    result,
    source,
    lastVerifiedAt: lastVerifiedAt ? new Date(lastVerifiedAt).toISOString() : null,
    action: action ?? null,
  };
}

// ---- Build an improvement plan item ----
function makeImprovement(
  currentGap: string,
  requiredAction: string,
  estimatedTimeline: string,
  recommendedAlternative: string | null = null
) {
  return {
    currentGap,
    requiredAction,
    estimatedTimeline,
    recommendedAlternative,
  };
}

// ---- Main eligibility evaluation for a single course ----
function evaluateCourse(course: any, profile: any): any {
  const {
    academicProfile,
    englishTests,
    workExperience,
    studyGap,
    studyPreferences,
  } = profile;

  const requirements: any[] = [];
  let matchScore = 0;
  let metCount = 0;
  let notMetCount = 0;
  let missingInfoCount = 0;
  let conditionCount = 0;
  const improvements: any[] = [];
  const isPostgrad = ['postgraduate', 'masters', 'mba', 'phd', 'doctorate'].includes(
    (course.studyLevel || '').toLowerCase()
  );

  // =============================================================
  // 1. ACADEMIC QUALIFICATION MATCH
  // =============================================================
  const highestQual = getHighestQualification(academicProfile);
  const courseStudyLevel = (course.studyLevel || '').toLowerCase();
  const minRequiredLevel = STUDY_LEVEL_MIN_QUALIFICATION[courseStudyLevel] || 0;

  if (!highestQual || !academicProfile || academicProfile.length === 0) {
    requirements.push(
      makeRequirement(
        'Academic Qualification',
        course.studyLevel,
        null,
        MISSING_INFO,
        'course',
        course.lastVerifiedAt,
        'Complete your academic profile to enable qualification matching'
      )
    );
    missingInfoCount++;
  } else if (highestQual.normalizedLevel >= minRequiredLevel) {
    requirements.push(
      makeRequirement(
        'Academic Qualification',
        course.studyLevel,
        highestQual.qualificationType,
        MET,
        'course',
        course.lastVerifiedAt
      )
    );
    metCount++;
    matchScore += 20;
  } else {
    requirements.push(
      makeRequirement(
        'Academic Qualification',
        course.studyLevel,
        highestQual.qualificationType,
        NOT_MET,
        'course',
        course.lastVerifiedAt,
        'You need a higher qualification for this course'
      )
    );
    notMetCount++;
    improvements.push(
      makeImprovement(
        `Your highest qualification (${highestQual.qualificationType}) does not meet the ${course.studyLevel} entry requirement`,
        `Complete a ${course.studyLevel === 'undergraduate' || course.studyLevel === 'bachelors' ? 'Foundation/Diploma' : 'Bachelor/Master'} degree first`,
        '1-4 years depending on qualification needed',
        'Consider a Foundation programme or pathway course at the same university'
      )
    );
  }

  // =============================================================
  // 2. GPA / PERCENTAGE CHECK
  // =============================================================
  if (!highestQual) {
    requirements.push(
      makeRequirement(
        'GPA / Academic Score',
        course.gpaMin != null ? `Minimum ${course.gpaMin}` : (course.academicRequirement || null),
        null,
        MISSING_INFO,
        'course',
        course.lastVerifiedAt,
        'Add your GPA or percentage to your academic profile'
      )
    );
    missingInfoCount++;
  } else if (course.gpaMin == null && !course.academicRequirement) {
    // Course has no GPA requirement specified
    requirements.push(
      makeRequirement(
        'GPA / Academic Score',
        'Not specified',
        highestQual.gpa || highestQual.percentage
          ? `${highestQual.gpa || ''}${highestQual.gpa && highestQual.percentage ? ' / ' : ''}${highestQual.percentage || ''}`
          : null,
        MISSING_INFO,
        'course',
        course.lastVerifiedAt,
        'University has not specified a minimum GPA — contact for clarification'
      )
    );
    missingInfoCount++;
    // Give partial credit since we can't check
    matchScore += 8;
  } else {
    // Try to get student's GPA normalized to 4.0
    const studentGpa4 = normalizeGpaTo4(highestQual.gpa, highestQual.gpaScale)
      || percentageToGpa4(highestQual.percentage)
      || 0;

    // Course gpaMin is typically on a 4.0 scale
    const courseGpaMin = course.gpaMin || 0;

    const studentDisplay = highestQual.gpa
      ? `GPA: ${highestQual.gpa}${highestQual.gpaScale ? `/${highestQual.gpaScale}` : ''}`
      : highestQual.percentage
        ? `Percentage: ${highestQual.percentage}%`
        : null;

    if (studentGpa4 >= courseGpaMin) {
      requirements.push(
        makeRequirement(
          'GPA / Academic Score',
          course.gpaMin != null ? `Minimum GPA ${course.gpaMin}` : (course.academicRequirement || 'Not specified'),
          studentDisplay,
          MET,
          'course',
          course.lastVerifiedAt
        )
      );
      metCount++;
      matchScore += 15;
    } else {
      requirements.push(
        makeRequirement(
          'GPA / Academic Score',
          course.gpaMin != null ? `Minimum GPA ${course.gpaMin}` : (course.academicRequirement || 'Not specified'),
          studentDisplay,
          NOT_MET,
          'course',
          course.lastVerifiedAt,
          'Your academic score is below the minimum requirement'
        )
      );
      notMetCount++;
      improvements.push(
        makeImprovement(
          `Your GPA (~${studentGpa4.toFixed(1)}/4.0) is below the required ${courseGpaMin}`,
          'Retake relevant modules, complete additional qualifications, or provide a strong personal statement',
          '3-12 months',
          'Look for courses with lower GPA requirements or pathway programmes'
        )
      );
    }
  }

  // Also include academicRequirement as an informational note
  if (course.academicRequirement) {
    requirements.push(
      makeRequirement(
        'Academic Requirement (Additional)',
        course.academicRequirement,
        null,
        CONDITION,
        'course',
        course.lastVerifiedAt,
        'Review this specific academic requirement carefully'
      )
    );
    conditionCount++;
  }

  // =============================================================
  // 3. ENGLISH TEST CHECK
  // =============================================================
  const hasAnyEnglishTest = englishTests && englishTests.length > 0;
  const courseRequiresEnglish = course.ieltsMin != null || course.pteMin != null || course.toeflMin != null || course.duolingoMin != null;

  if (!courseRequiresEnglish) {
    // Course has no english requirement — check if student's study level typically needs it
    if (isPostgrad || ['undergraduate', 'bachelors'].includes(courseStudyLevel)) {
      requirements.push(
        makeRequirement(
          'English Language Test',
          'Not specified by university',
          hasAnyEnglishTest ? `${englishTests.length} test(s) on file` : null,
          MISSING_INFO,
          'course',
          course.lastVerifiedAt,
          'University has not listed English requirements — confirm directly'
        )
      );
      missingInfoCount++;
      matchScore += 5; // Can't penalise for missing course data
    }
  } else if (!hasAnyEnglishTest) {
    // Course requires English but student hasn't provided any test
    requirements.push(
      makeRequirement(
        'English Language Test',
        buildEnglishRequirementString(course),
        null,
        NOT_MET,
        'course',
        course.lastVerifiedAt,
        'You need to take an English language test'
      )
    );
    notMetCount++;
    improvements.push(
      makeImprovement(
      `No English test scores provided; course requires ${buildEnglishRequirementString(course)}`,
      'Book and complete an accepted English test (IELTS, PTE, TOEFL, or Duolingo)',
      '2-8 weeks for test, plus preparation time',
      'Consider pre-sessional English courses offered by the university'
    )
    );
  } else {
    // Student has tests — find the best matching one
    const testChecks: { testType: string; minScore: number; studentScore: any; met: boolean; componentResult: string }[] = [];

    // IELTS
    if (course.ieltsMin != null) {
      const test = getBestTestScore(englishTests, 'ielts');
      if (test && test.overallScore != null) {
        const overallMet = test.overallScore >= course.ieltsMin;
        // Check component scores (typical minimum: 0.5 below overall, or 6.0)
        const componentMin = Math.max(course.ieltsMin - 0.5, 5.5);
        let componentResult = '';
        const components = ['listening', 'reading', 'writing', 'speaking'];
        let allComponentsMet = true;
        for (const comp of components) {
          if (test[comp] != null && test[comp] < componentMin) {
            allComponentsMet = false;
            componentResult += `${comp.charAt(0).toUpperCase() + comp.slice(1)}: ${test[comp]} (min ${componentMin}); `;
          }
        }
        testChecks.push({
          testType: 'IELTS',
          minScore: course.ieltsMin,
          studentScore: test,
          met: overallMet && allComponentsMet,
          componentResult: allComponentsMet ? '' : componentResult.trim(),
        });
      }
    }

    // PTE
    if (course.pteMin != null) {
      const test = getBestTestScore(englishTests, 'pte');
      if (test && test.overallScore != null) {
        const overallMet = test.overallScore >= course.pteMin;
        const componentMin = Math.max(course.pteMin - 5, 50);
        let componentResult = '';
        const components = ['listening', 'reading', 'writing', 'speaking'];
        let allComponentsMet = true;
        for (const comp of components) {
          if (test[comp] != null && test[comp] < componentMin) {
            allComponentsMet = false;
            componentResult += `${comp.charAt(0).toUpperCase() + comp.slice(1)}: ${test[comp]} (min ${componentMin}); `;
          }
        }
        testChecks.push({
          testType: 'PTE',
          minScore: course.pteMin,
          studentScore: test,
          met: overallMet && allComponentsMet,
          componentResult: allComponentsMet ? '' : componentResult.trim(),
        });
      }
    }

    // TOEFL
    if (course.toeflMin != null) {
      const test = getBestTestScore(englishTests, 'toefl');
      if (test && test.overallScore != null) {
        const overallMet = test.overallScore >= course.toeflMin;
        const componentMin = Math.max(course.toeflMin - 4, 18);
        let componentResult = '';
        const components = ['listening', 'reading', 'writing', 'speaking'];
        let allComponentsMet = true;
        for (const comp of components) {
          if (test[comp] != null && test[comp] < componentMin) {
            allComponentsMet = false;
            componentResult += `${comp.charAt(0).toUpperCase() + comp.slice(1)}: ${test[comp]} (min ${componentMin}); `;
          }
        }
        testChecks.push({
          testType: 'TOEFL',
          minScore: course.toeflMin,
          studentScore: test,
          met: overallMet && allComponentsMet,
          componentResult: allComponentsMet ? '' : componentResult.trim(),
        });
      }
    }

    // Duolingo
    if (course.duolingoMin != null) {
      const test = getBestTestScore(englishTests, 'duolingo');
      if (test && test.overallScore != null) {
        const overallMet = test.overallScore >= course.duolingoMin;
        const componentMin = Math.max(course.duolingoMin - 10, 100);
        let componentResult = '';
        const components = ['listening', 'reading', 'writing', 'speaking'];
        let allComponentsMet = true;
        for (const comp of components) {
          if (test[comp] != null && test[comp] < componentMin) {
            allComponentsMet = false;
            componentResult += `${comp.charAt(0).toUpperCase() + comp.slice(1)}: ${test[comp]} (min ${componentMin}); `;
          }
        }
        testChecks.push({
          testType: 'Duolingo',
          minScore: course.duolingoMin,
          studentScore: test,
          met: overallMet && allComponentsMet,
          componentResult: allComponentsMet ? '' : componentResult.trim(),
        });
      }
    }

    if (testChecks.length === 0) {
      // Student has tests but none match the types the course accepts
      const studentTestTypes = englishTests.map(t => t.testType).join(', ');
      requirements.push(
        makeRequirement(
          'English Language Test',
          buildEnglishRequirementString(course),
          `Your tests: ${studentTestTypes}`,
          CONDITION,
          'course',
          course.lastVerifiedAt,
          `Your English test type(s) may not be accepted — consider taking one of the accepted tests`
        )
      );
      conditionCount++;
      improvements.push(
        makeImprovement(
          `Your English test type(s) (${studentTestTypes}) may not match the accepted tests for this course`,
          `Take one of the accepted tests: ${buildEnglishRequirementString(course)}`,
          '2-8 weeks',
          'Check if the university accepts alternative tests or offers a waiver'
        )
      );
    } else {
      // Find the best matching test
      const bestMatch = testChecks.find(tc => tc.met);
      if (bestMatch) {
        const scoreStr = `Overall: ${bestMatch.studentScore.overallScore} (min ${bestMatch.minScore})`;
        requirements.push(
          makeRequirement(
            'English Language Test',
            `${bestMatch.testType}: ${bestMatch.minScore} minimum`,
            scoreStr,
            MET,
            'course',
            course.lastVerifiedAt
          )
        );
        metCount++;
        matchScore += 15;
      } else {
        // No test fully meets the requirement — find the closest
        const closest = testChecks.reduce((best, tc) => {
          const gap = tc.minScore - tc.studentScore.overallScore;
          const bestGap = tc.minScore - (best.studentScore?.overallScore || 0);
          return gap < bestGap ? tc : best;
        }, testChecks[0]);

        const scoreStr = `Overall: ${closest.studentScore.overallScore} (min ${closest.minScore})`;
        const componentInfo = closest.componentResult ? ` | Component gaps: ${closest.componentResult}` : '';

        // Determine if it's a close miss (conditional) or far miss (not met)
        const gap = closest.minScore - closest.studentScore.overallScore;
        const isSmallGap = gap <= 0.5 || gap <= 5; // 0.5 for IELTS/PTE, 5 for TOEFL/Duolingo

        if (isSmallGap) {
          requirements.push(
            makeRequirement(
              'English Language Test',
              `${closest.testType}: ${closest.minScore} minimum`,
              scoreStr + componentInfo,
              CONDITION,
              'course',
              course.lastVerifiedAt,
              `Your score is close to the requirement — consider retaking or a pre-sessional English course`
            )
          );
          conditionCount++;
          matchScore += 8;
          improvements.push(
            makeImprovement(
              `Your ${closest.testType} score (${closest.studentScore.overallScore}) is just below the required ${closest.minScore}${componentInfo ? '. ' + closest.componentResult : ''}`,
              'Retake the test or enrol in a pre-sessional English course at the university',
              '4-12 weeks',
              'Some universities accept a pre-sessional English programme instead of a higher test score'
            )
          );
        } else {
          requirements.push(
            makeRequirement(
              'English Language Test',
              `${closest.testType}: ${closest.minScore} minimum`,
              scoreStr + componentInfo,
              NOT_MET,
              'course',
              course.lastVerifiedAt,
              `Your ${closest.testType} score does not meet the requirement — you need to improve significantly`
            )
          );
          notMetCount++;
          improvements.push(
            makeImprovement(
              `Your ${closest.testType} score (${closest.studentScore.overallScore}) is below the required ${closest.minScore}`,
              'Intensive English preparation and retake the test',
              '2-6 months',
              'Consider a pathway programme with integrated English support'
            )
          );
        }
      }
    }
  }

  // =============================================================
  // 4. WORK EXPERIENCE CHECK
  // =============================================================
  if (course.workExperienceRequired === true) {
    const studentWorkMonths = workExperience?.totalMonths || 0;
    const studentWorkRelevant = workExperience?.isRelevant || false;

    // Typical requirement: 1-3 years for MBA, 0-2 for other postgrad
    const requiredMonths = isPostgrad && courseStudyLevel === 'mba' ? 24 : 12;

    if (studentWorkMonths > 0) {
      if (studentWorkMonths >= requiredMonths) {
        requirements.push(
          makeRequirement(
            'Work Experience',
            `Required (${requiredMonths}+ months)`,
            `${studentWorkMonths} months${studentWorkRelevant ? ' (relevant)' : ''}`,
            MET,
            'course',
            course.lastVerifiedAt
          )
        );
        metCount++;
        matchScore += 10;
      } else {
        requirements.push(
          makeRequirement(
            'Work Experience',
            `Required (${requiredMonths}+ months)`,
            `${studentWorkMonths} months${studentWorkRelevant ? ' (relevant)' : ''}`,
            studentWorkRelevant ? CONDITION : NOT_MET,
            'course',
            course.lastVerifiedAt,
            studentWorkRelevant
              ? 'You have relevant but insufficient work experience — may be considered with a strong application'
              : 'You do not have enough work experience for this course'
          )
        );
        if (studentWorkRelevant) {
          conditionCount++;
          matchScore += 5;
        } else {
          notMetCount++;
        }
        improvements.push(
          makeImprovement(
            `You have ${studentWorkMonths} months of work experience but ${requiredMonths}+ are required`,
            `Gain more professional experience or look for courses without a work experience requirement`,
            `${Math.ceil((requiredMonths - studentWorkMonths) / 1)} months`,
            'Consider courses that do not require work experience or accept less'
          )
        );
      }
    } else {
      requirements.push(
        makeRequirement(
        'Work Experience',
        'Required',
        'No work experience reported',
        NOT_MET,
        'course',
        course.lastVerifiedAt,
        'This course requires work experience'
        )
      );
      notMetCount++;
      improvements.push(
        makeImprovement(
          'This course requires work experience which you have not reported',
          'Gain professional work experience before applying',
          '6-24 months',
          'Look for courses without a work experience requirement'
        )
      );
    }
  } else if (course.workExperienceRequired === false || course.workExperienceRequired == null) {
    // Work experience not required — but it's a bonus if the student has it
    const studentWorkMonths = workExperience?.totalMonths || 0;
    if (studentWorkMonths > 0) {
      matchScore += 3; // Small bonus for having work experience
    }
    // Don't add a requirement check for non-mandatory items, but note it
  }

  // =============================================================
  // 5. BUDGET CHECK
  // =============================================================
  const studentBudget = studyPreferences?.maxTuitionBudget;
  const studentBudgetCurrency = studyPreferences?.budgetCurrency;
  const courseFee = course.tuitionFee;
  const courseCurrency = course.tuitionCurrency || 'GBP';

  if (studentBudget != null && studentBudget > 0 && courseFee != null) {
    const budgetGbp = convertToGbp(studentBudget, studentBudgetCurrency);
    const feeGbp = convertToGbp(courseFee, courseCurrency);

    if (budgetGbp != null && feeGbp != null) {
      if (feeGbp <= budgetGbp) {
        requirements.push(
          makeRequirement(
            'Tuition Budget',
            `${courseCurrency} ${courseFee.toLocaleString()} per year`,
            `${studentBudgetCurrency || 'GBP'} ${studentBudget.toLocaleString()} max budget`,
            MET,
            'course',
            course.lastVerifiedAt
          )
        );
        metCount++;
        matchScore += 10;
      } else if (course.university?.scholarships) {
        // Scholarship availability lives on the university record
        // (CrmUniversity.scholarships), not on the course. The previous
        // `course.scholarshipAvailable` check read a column that does not
        // exist, so this branch could never fire.
        requirements.push(
          makeRequirement(
            'Tuition Budget',
            `${courseCurrency} ${courseFee.toLocaleString()} per year`,
            `${studentBudgetCurrency || 'GBP'} ${studentBudget.toLocaleString()} max budget`,
            CONDITION,
            'course',
            course.lastVerifiedAt,
            'Tuition exceeds budget but scholarships may be available'
          )
        );
        conditionCount++;
        matchScore += 5;
        improvements.push(
          makeImprovement(
            `Tuition (${courseCurrency} ${courseFee.toLocaleString()}) exceeds your budget (${studentBudgetCurrency || 'GBP'} ${studentBudget.toLocaleString()})`,
            'Apply for available scholarships or consider a part-time work arrangement',
            'Scholarship deadlines vary — apply early',
            'Look for similar courses at universities with lower fees or stronger scholarship programmes'
          )
        );
      } else {
        requirements.push(
          makeRequirement(
            'Tuition Budget',
            `${courseCurrency} ${courseFee.toLocaleString()} per year`,
            `${studentBudgetCurrency || 'GBP'} ${studentBudget.toLocaleString()} max budget`,
            NOT_MET,
            'course',
            course.lastVerifiedAt,
            'Tuition fee exceeds your budget'
          )
        );
        notMetCount++;
        improvements.push(
          makeImprovement(
            `Tuition (${courseCurrency} ${courseFee.toLocaleString()}) exceeds your budget (${studentBudgetCurrency || 'GBP'} ${studentBudget.toLocaleString()})`,
            'Explore scholarship options, student loans, or consider universities in lower-cost destinations',
            'Varies by funding source',
            'Consider similar courses in countries with lower tuition fees (e.g., Germany, Norway, Malaysia)'
          )
        );
      }
    }
  } else if (courseFee == null) {
    requirements.push(
      makeRequirement(
        'Tuition Budget',
        'Not listed',
        studentBudget ? `${studentBudgetCurrency || 'GBP'} ${studentBudget.toLocaleString()} max budget` : null,
        MISSING_INFO,
        'course',
        course.lastVerifiedAt,
        'Course fee is not listed — contact the university'
      )
    );
    missingInfoCount++;
    matchScore += 3;
  }
  // If student hasn't set a budget, we don't penalise

  // =============================================================
  // 6. STUDY GAP CHECK
  // =============================================================
  const gapMonths = studyGap?.totalMonths || 0;
  const maxGapMonths = isPostgrad ? 60 : 24; // 5 years for postgrad, 2 years for undergrad

  if (gapMonths > maxGapMonths) {
    const gapYears = (gapMonths / 12).toFixed(1);
    const maxGapYears = (maxGapMonths / 12).toFixed(0);
    requirements.push(
      makeRequirement(
        'Study Gap',
        `Max ${maxGapYears} years for ${isPostgrad ? 'postgraduate' : 'undergraduate'}`,
        `${gapYears} year gap${studyGap?.reason ? ` (${studyGap.reason})` : ''}`,
        CONDITION,
        'course',
        course.lastVerifiedAt,
        'Large study gap may need explanation — provide evidence of relevant activity during the gap'
      )
    );
    conditionCount++;
    matchScore += 3;
    if (gapMonths > maxGapMonths * 1.5) {
      improvements.push(
        makeImprovement(
          `Study gap of ${gapYears} years exceeds the typical ${maxGapYears}-year limit`,
          'Prepare a strong justification and supporting evidence (work experience, certifications, volunteer work)',
          'Gather documentation before applying',
          'Some universities are more flexible with gaps — a counsellor can help identify these'
        )
      );
    }
  } else if (gapMonths > 0) {
    // Small gap, not an issue but note it
    matchScore += 3;
  }
  // No gap or gap within limits — no requirement check needed, silent pass

  // =============================================================
  // 7. INTAKE AVAILABILITY CHECK
  // =============================================================
  const preferredIntake = studyPreferences?.preferredIntake;
  const courseIntakes = parseIntakeMonths(course.intakeMonths);

  if (preferredIntake) {
    const normalisedPreferred = normaliseMonth(preferredIntake);
    if (courseIntakes.length === 0) {
      requirements.push(
        makeRequirement(
          'Intake Availability',
          'Not specified',
          `Preferred: ${preferredIntake}`,
          MISSING_INFO,
          'course',
          course.lastVerifiedAt,
          'Contact the university to confirm intake dates'
        )
      );
      missingInfoCount++;
      matchScore += 3;
    } else {
      const normalisedIntakes = courseIntakes.map(m => normaliseMonth(m));
      if (normalisedIntakes.includes(normalisedPreferred)) {
        requirements.push(
          makeRequirement(
            'Intake Availability',
            course.intakeMonths,
            `Preferred: ${preferredIntake} — Available`,
            MET,
            'course',
            course.lastVerifiedAt
          )
        );
        metCount++;
        matchScore += 5;
      } else {
        requirements.push(
          makeRequirement(
            'Intake Availability',
            course.intakeMonths,
            `Preferred: ${preferredIntake} — Not available in this intake`,
            CONDITION,
            'course',
            course.lastVerifiedAt,
            `Your preferred intake (${preferredIntake}) is not available — consider the available intakes: ${course.intakeMonths}`
          )
        );
        conditionCount++;
        matchScore += 2;
        improvements.push(
          makeImprovement(
            `Your preferred intake (${preferredIntake}) is not available for this course`,
            `Apply for the next available intake: ${course.intakeMonths}`,
            'Adjust timeline to match next available intake',
            null
          )
        );
      }
    }
  }
  // No preferred intake set — don't penalise

  // =============================================================
  // 8. PORTFOLIO / INTERVIEW CHECKS (additional)
  // =============================================================
  if (course.portfolioRequired === true) {
    requirements.push(
      makeRequirement(
        'Portfolio',
        'Required',
        null,
        CONDITION,
        'course',
        course.lastVerifiedAt,
        'This course requires a portfolio — prepare one before applying'
      )
    );
    conditionCount++;
  }

  if (course.interviewRequired === true) {
    requirements.push(
      makeRequirement(
        'Interview',
        'Required',
        null,
        CONDITION,
        'course',
        course.lastVerifiedAt,
        'An interview is part of the admission process — prepare accordingly'
      )
    );
    conditionCount++;
  }

  // =============================================================
  // CLASSIFY INTO ELIGIBILITY CATEGORY
  // =============================================================
  const totalChecks = metCount + notMetCount + missingInfoCount + conditionCount;
  const metRatio = totalChecks > 0 ? metCount / totalChecks : 0;
  const hasMandatoryFail = notMetCount > 0;
  const hasConditions = conditionCount > 0;
  const hasMissingInfo = missingInfoCount > 0;
  const profileCompleteness = profile.profileCompleteness || 'partial';

  let category: string;

  // If profile is empty, we can't make a proper determination
  if (profileCompleteness === 'empty' || totalChecks === 0) {
    category = INSUFFICIENT_INFO;
  }
  // Complex/subjective requirements
  else if (course.portfolioRequired === true && course.interviewRequired === true && hasMandatoryFail) {
    category = COUNSELLOR_REVIEW_REQUIRED;
  }
  // If critical mandatory fields are missing
  else if (hasMissingInfo && missingInfoCount >= 2 && !hasMandatoryFail) {
    category = INSUFFICIENT_INFO;
  }
  // Not currently eligible: fails mandatory requirements
  else if (notMetCount >= 2 || (notMetCount >= 1 && metRatio < 0.5)) {
    category = NOT_CURRENTLY_ELIGIBLE;
  }
  // One mandatory fail but otherwise good
  else if (notMetCount === 1 && metRatio >= 0.5) {
    // If the fail is english and it's a small gap, could be conditional
    const englishReq = requirements.find(r => r.name === 'English Language Test' && r.result === NOT_MET);
    if (englishReq && hasConditions) {
      category = CONDITIONALLY_ELIGIBLE;
    } else {
      category = PARTIALLY_MATCHED;
    }
  }
  // No mandatory fails, has conditions
  else if (!hasMandatoryFail && hasConditions) {
    if (metRatio >= 0.7) {
      category = LIKELY_ELIGIBLE;
    } else if (metRatio >= 0.4) {
      category = CONDITIONALLY_ELIGIBLE;
    } else {
      category = PARTIALLY_MATCHED;
    }
  }
  // Some missing info but no fails
  else if (hasMissingInfo && !hasMandatoryFail && !hasConditions) {
    if (metRatio >= 0.7) {
      category = LIKELY_ELIGIBLE;
    } else {
      category = INSUFFICIENT_INFO;
    }
  }
  // All checks met
  else if (notMetCount === 0 && conditionCount === 0 && missingInfoCount === 0) {
    category = ELIGIBLE;
  }
  // Fully met with minor conditions
  else if (notMetCount === 0 && conditionCount <= 2) {
    category = LIKELY_ELIGIBLE;
  }
  // Fallback
  else {
    category = metRatio >= 0.6 ? LIKELY_ELIGIBLE : PARTIALLY_MATCHED;
  }

  // Cap match score at 100
  matchScore = Math.min(100, Math.max(0, Math.round(matchScore)));

  return {
    courseId: course.id,
    courseTitle: course.title,
    universityName: course.university?.name || null,
    country: course.country,
    studyLevel: course.studyLevel,
    qualification: course.qualification,
    tuitionFee: course.tuitionFee,
    tuitionCurrency: course.tuitionCurrency,
    eligibilityCategory: category,
    matchScore,
    requirements,
    improvementPlan: improvements,
    slug: course.slug,
  };
}

// ---- Helper: build a readable English requirement string ----
function buildEnglishRequirementString(course: any): string {
  const parts: string[] = [];
  if (course.ieltsMin != null) parts.push(`IELTS ${course.ieltsMin}`);
  if (course.pteMin != null) parts.push(`PTE ${course.pteMin}`);
  if (course.toeflMin != null) parts.push(`TOEFL ${course.toeflMin}`);
  if (course.duolingoMin != null) parts.push(`Duolingo ${course.duolingoMin}`);
  return parts.length > 0 ? parts.join(' / ') : 'Not specified';
}

// ---- Find alternative routes for a given course ----
async function findAlternativeRoutes(course: any, profile: any, mainResult: any): Promise<any[]> {
  const alternatives: any[] = [];
  const studyLevel = (course.studyLevel || '').toLowerCase();

  // If not eligible, suggest similar courses at the same university or same level elsewhere
  if (
    mainResult.eligibilityCategory === NOT_CURRENTLY_ELIGIBLE ||
    mainResult.eligibilityCategory === PARTIALLY_MATCHED
  ) {
    const altWhere: any = {
      // CrmCourse has no `approvalStatus` column. Published, verified courses
      // are `status: 'active'` + `verificationStatus: 'VERIFIED'`, matching
      // /api/course-finder/[slug] and /api/course-finder/universities.
      status: 'active',
      verificationStatus: 'VERIFIED',
      id: { not: course.id },
    };

    const orConditions: any[] = [];

    // Same university, same study level
    if (course.universityId) {
      orConditions.push({
        universityId: course.universityId,
        studyLevel: course.studyLevel,
      });
    }

    // Same subject area, same study level
    if (course.subjectArea) {
      orConditions.push({
        subjectArea: { contains: course.subjectArea },
        studyLevel: course.studyLevel,
      });
    }

    // Foundation/pathway for undergrad if qualification is the issue
    if (studyLevel === 'undergraduate' || studyLevel === 'bachelors') {
      orConditions.push({ studyLevel: 'Foundation' });
      orConditions.push({ studyLevel: 'Diploma' });
    }

    // Lower-ranked alternative for same subject
    if (orConditions.length > 0) {
      altWhere.OR = orConditions;

      const altCourses = await db.crmCourse.findMany({
        where: altWhere,
        include: { university: { select: { name: true } } },
        take: 3,
        orderBy: { tuitionFee: 'asc' },
      });

      for (const alt of altCourses) {
        const reason = alt.universityId === course.universityId
          ? 'Same university, potentially more accessible requirements'
          : alt.studyLevel === 'Foundation' || alt.studyLevel === 'Diploma'
            ? `Pathway programme leading to ${course.qualification || course.studyLevel}`
            : 'Similar course with different requirements';

        alternatives.push({
          courseTitle: alt.title,
          universityName: alt.university?.name || null,
          reason,
          slug: alt.slug,
        });
      }
    }
  }

  return alternatives;
}

// ============================================================
// MAIN API HANDLER
// ============================================================
export async function POST(req: Request) {
  try {
    // This endpoint is reachable anonymously (the public /eligibility-check and
    // /ai/course-match pages use it) and writes one assessment row per call, so
    // it is throttled per client IP before any database work happens.
    const limited = rateLimitMiddleware(req, 'lead_create');
    if (limited) return limited;

    const body = await req.json();
    const {
      academicProfile,
      englishTests,
      workExperience,
      studyGap,
      studyPreferences,
      profileCompleteness,
      sessionId,
      userId,
    } = body;

    // ---- Build WHERE clause for course query ----
    const baseWhere: any = {
      // CrmCourse has no `approvalStatus` column — filtering on it made every
      // request throw a Prisma validation error (P2009/P2025 style "Unknown
      // argument"), which surfaced to visitors as a bare 500 on the public
      // /eligibility-check and /ai/course-match tools.
      status: 'active',
      verificationStatus: 'VERIFIED',
    };

    const andConditions: any[] = [];

    // Filter by preferred countries if specified
    if (studyPreferences?.preferredCountries && studyPreferences.preferredCountries.length > 0) {
      andConditions.push({
        country: { in: studyPreferences.preferredCountries },
      });
    }

    // Filter by study level if specified
    if (studyPreferences?.preferredStudyLevel) {
      const preferredLevel = studyPreferences.preferredStudyLevel;
      // Map common user inputs to DB values
      const levelMap: Record<string, string[]> = {
        'foundation': ['Foundation'],
        'undergraduate': ['Undergraduate'],
        'bachelors': ['Undergraduate'],
        'bachelor': ['Undergraduate'],
        'postgraduate': ['Postgraduate'],
        'masters': ['Postgraduate'],
        'master': ['Postgraduate'],
        'mba': ['Postgraduate'],
        'phd': ['PhD'],
        'doctorate': ['PhD'],
        'diploma': ['Diploma'],
        'certificate': ['Certificate'],
      };
      const mappedLevels = levelMap[preferredLevel.toLowerCase()];
      if (mappedLevels) {
        andConditions.push({ studyLevel: { in: mappedLevels } });
      } else {
        andConditions.push({ studyLevel: { contains: preferredLevel } });
      }
    }

    // Filter by subject if specified
    if (studyPreferences?.preferredSubject) {
      andConditions.push({
        OR: [
          { subjectArea: { contains: studyPreferences.preferredSubject } },
          { specialisation: { contains: studyPreferences.preferredSubject } },
        ],
      });
    }

    const where = {
      ...baseWhere,
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    // ---- Fetch courses ----
    const courses = await db.crmCourse.findMany({
      where,
      include: {
        university: {
          select: {
            name: true,
            country: true,
            city: true,
            rankingValue: true,
            rankingProvider: true,
            // CrmUniversity exposes scholarship availability as the boolean
            // `scholarships`. There is no `scholarshipAvailable` column on
            // either CrmUniversity or CrmCourse, so selecting it made the whole
            // query throw and the public eligibility tools return a bare 500.
            scholarships: true,
          },
        },
      },
      take: 100, // Evaluate up to 100, then limit results to 50
      orderBy: { createdAt: 'desc' },
    });

    // ---- Evaluate each course ----
    const profile = {
      academicProfile,
      englishTests,
      workExperience,
      studyGap,
      studyPreferences,
      profileCompleteness,
    };

    const evaluatedResults: any[] = [];

    for (const course of courses) {
      const result = evaluateCourse(course, profile);

      // Find alternative routes for non-eligible courses
      if (
        result.eligibilityCategory !== ELIGIBLE &&
        result.eligibilityCategory !== LIKELY_ELIGIBLE &&
        result.eligibilityCategory !== INSUFFICIENT_INFO
      ) {
        result.alternativeRoutes = await findAlternativeRoutes(course, profile, result);
      } else {
        result.alternativeRoutes = [];
      }

      evaluatedResults.push(result);
    }

    // ---- Sort by matchScore descending ----
    evaluatedResults.sort((a, b) => b.matchScore - a.matchScore);

    // ---- Limit to 50 results ----
    const limitedResults = evaluatedResults.slice(0, 50);

    // ---- Summary statistics ----
    const categoryCounts: Record<string, number> = {};
    for (const cat of ELIGIBILITY_CATEGORIES) {
      categoryCounts[cat] = 0;
    }
    for (const r of limitedResults) {
      if (categoryCounts[r.eligibilityCategory] !== undefined) {
        categoryCounts[r.eligibilityCategory]++;
      }
    }

    // ---- Save assessment to database ----
    // FinderEligibilityResult columns are: studentId, assessmentId, result,
    // eligibleCourses, score. The previous version wrote sessionId/userId/
    // responses/results, none of which exist on the model, so every assessment
    // failed to persist and the whole request 500'd.
    const averageScore = limitedResults.length > 0
      ? Math.round(
          limitedResults.reduce((total, r) => total + (r.matchScore || 0), 0) / limitedResults.length
        )
      : 0;

    const assessment = await db.finderEligibilityResult.create({
      data: {
        studentId: userId || null,
        assessmentId: sessionId || null,
        result: JSON.stringify({
          academicProfile,
          englishTests,
          workExperience,
          studyGap,
          studyPreferences,
          profileCompleteness,
        }),
        eligibleCourses: JSON.stringify(limitedResults),
        score: averageScore,
      },
    });

    // ---- Return response ----
    return NextResponse.json({
      assessmentId: assessment.id,
      results: limitedResults,
      total: limitedResults.length,
      summary: {
        eligible: categoryCounts[ELIGIBLE] || 0,
        likelyEligible: categoryCounts[LIKELY_ELIGIBLE] || 0,
        conditionallyEligible: categoryCounts[CONDITIONALLY_ELIGIBLE] || 0,
        partiallyMatched: categoryCounts[PARTIALLY_MATCHED] || 0,
        notCurrentlyEligible: categoryCounts[NOT_CURRENTLY_ELIGIBLE] || 0,
        insufficientInfo: categoryCounts[INSUFFICIENT_INFO] || 0,
        counsellorReviewRequired: categoryCounts[COUNSELLOR_REVIEW_REQUIRED] || 0,
      },
      disclaimer:
        'This eligibility assessment is generated by a rule-based engine using publicly available course data. ' +
        'It provides an indicative evaluation and does not guarantee admission. Universities consider multiple factors ' +
        'including complete academic history, personal statements, references, and interview performance. ' +
        'Please verify all requirements directly with the university or contact an ALO Education advisor for a comprehensive assessment.',
    });
  } catch (error) {
    console.error('Eligibility Engine API error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate eligibility' },
      { status: 500 }
    );
  }
}
