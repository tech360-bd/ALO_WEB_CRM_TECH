import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentProfile {
  academicLevel: string;
  gpa: number | null;
  ieltsOverall: number | null;
  ieltsMin: number | null;
  workExperienceYears: number | null;
  hasPortfolio: boolean | null;
  studyGapMonths: number;
}

interface RequirementCheck {
  name: string;
  label: string;
  passed: boolean;
  icon: string;
  detail: string;
  required: string;
  provided: string;
  weight: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse IELTS score from a free-text requirement string */
function parseIeltsFromRequirement(text: string): { overall: number | null; min: number | null } {
  const overallMatch = text.match(/(?:overall|total)\s*(?:IELTS\s*)?(?:score\s*of\s*|:\s*|=\s*|\b)(\d+\.?\d*)/i);
  const minMatch = text.match(/(?:minimum|no\s*band\s*less\s*than|each\s*band|in\s*each|all\s*components?|no\s*component\s*below)\s*(?:IELTS\s*)?(?:\d+\.?\d*\s*)?(\d+\.?\d*)/i);

  // Fallback: find any IELTS number patterns
  const anyNumbers = text.match(/IELTS[^\d]*(\d+\.?\d*)/gi);
  let overall: number | null = overallMatch ? parseFloat(overallMatch[1]) : null;
  let min: number | null = minMatch ? parseFloat(minMatch[1]) : null;

  // If no specific match, try to extract from patterns like "IELTS 6.5" or "IELTS 6.5 with no band below 6.0"
  if (overall === null && anyNumbers && anyNumbers.length > 0) {
    const nums = anyNumbers.map((n) => parseFloat(n.replace(/[^\d.]/g, '')));
    overall = nums[0];
    if (nums.length > 1 && min === null) min = nums[1];
  }

  return { overall, min };
}

/** Parse GPA/percentage requirement from free text */
function parseGpaRequirement(text: string): { gpa: number | null; isPercentage: boolean } {
  // Pattern: "GPA 3.0" or "CGPA 3.5/4.0" or "3.2/4.0"
  const gpaMatch = text.match(/(?:GPA|CGPA)\s*(?:of\s*)?(\d+\.?\d*)(?:\s*[/\\]\s*(?:4(?:\.0)?|5(?:\.0)?))?/i);
  // Pattern: "60%" or "second class" or "2:1" or "2.1"
  const pctMatch = text.match(/(\d+)\s*%/);
  const classMatch = text.match(/(first\s*class|upper\s*second|2[.:]1|lower\s*second|2[.:]2|third\s*class|pass|merit|distinction)/i);

  if (gpaMatch) {
    return { gpa: parseFloat(gpaMatch[1]), isPercentage: false };
  }
  if (pctMatch) {
    return { gpa: parseFloat(pctMatch[1]), isPercentage: true };
  }
  if (classMatch) {
    const cls = classMatch[1].toLowerCase();
    const classMap: Record<string, number> = {
      'first class': 65, 'distinction': 70, 'merit': 60,
      'upper second': 55, '2:1': 55, '2.1': 55,
      'lower second': 45, '2:2': 45, '2.2': 45,
      'third class': 35, 'pass': 35,
    };
    return { gpa: classMap[cls] ?? null, isPercentage: true };
  }
  return { gpa: null, isPercentage: false };
}

/** Parse work experience requirement (years) */
function parseWorkExperience(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:\+?\s*)?(?:years?|yrs?)\b/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Parse study gap tolerance from backlog policy or academic requirement */
function parseMaxGap(text: string): number | null {
  const match = text.match(/(?:gap|break)\s*(?:of\s*)?(?:up\s*to\s*)?(?:maximum\s*)?(\d+)\s*(?:\+?\s*)?(?:years?|months?|yrs?)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = (text.match(/(?:gap|break)[^\d]*(\d+)\s*\+?\s*(years?|months?|yrs?)/i) ?? [])[1]?.toLowerCase();
    return unit?.startsWith('month') ? val : val * 12;
  }
  return null;
}

/** Parse maximum backlogs allowed */
function parseMaxBacklogs(text: string): number | null {
  const match = text.match(/(?:maximum|max|up\s*to)\s*(\d+)\s*(?:\+?\s*)?(?:backlogs?|active\s*backlogs?|live\s*backlogs?|arrears?)/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Level hierarchy for academic matching */
const LEVEL_HIERARCHY: Record<string, number> = {
  'high_school': 1, 'ssc': 1, 'secondary': 1, 'a-level': 2, 'hsc': 2, 'higher_secondary': 2,
  'foundation': 2, 'diploma': 2, 'certificate': 2,
  'bachelors': 3, 'bachelor': 3, 'undergraduate': 3, 'bsc': 3, 'ba': 3, 'btech': 3, 'beng': 3,
  'masters': 4, 'master': 4, 'postgraduate': 4, 'msc': 4, 'ma': 4, 'mtech': 4, 'meng': 4, 'mba': 4,
  'phd': 5, 'doctorate': 5, 'doctoral': 5,
};

const COURSE_LEVEL_MAP: Record<string, string> = {
  'undergraduate': 'bachelors', 'postgraduate': 'masters', 'pg': 'masters',
  'ug': 'bachelors', 'foundation': 'foundation', 'diploma': 'diploma',
  'phd': 'phd', 'doctorate': 'phd', 'pre-masters': 'bachelors', 'pre-sessional': 'bachelors',
};

/** Check academic level match */
function checkAcademicLevel(studentLevel: string, courseLevel: string): { passed: boolean; detail: string } {
  const studentNorm = LEVEL_HIERARCHY[studentLevel.toLowerCase().replace(/[-\s]/g, '_')] ?? 0;
  const courseNormKey = COURSE_LEVEL_MAP[courseLevel.toLowerCase().replace(/[-\s]/g, '_')] ?? courseLevel.toLowerCase();
  const courseNorm = LEVEL_HIERARCHY[courseNormKey] ?? 3;

  if (studentNorm === 0) {
    return { passed: false, detail: `Could not match your academic level "${studentLevel}" to course requirements.` };
  }

  if (studentNorm >= courseNorm) {
    return { passed: true, detail: `Your academic level meets the ${courseLevel} requirement.` };
  }
  if (studentNorm === courseNorm - 1) {
    return { passed: false, detail: `You are one level below the required ${courseLevel} qualification. Consider a foundation or pre-master's programme.` };
  }
  return { passed: false, detail: `The course requires a ${courseLevel} qualification, but your current level is lower.` };
}

// ─── Main POST Handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseSlug, profile } = body as { courseSlug: string; profile: StudentProfile };

    if (!courseSlug || !profile) {
      return NextResponse.json(
        { error: 'courseSlug and profile are required' },
        { status: 400 }
      );
    }

    // Fetch course from DB
    const course = await db.coursePage.findFirst({
      where: { slug: courseSlug, approvalStatus: 'PUBLISHED' },
      select: {
        name: true,
        slug: true,
        level: true,
        englishRequirement: true,
        academicRequirement: true,
        gpaRequirement: true,
        workExperience: true,
        portfolioRequired: true,
        backlogPolicy: true,
        interviewRequired: true,
        universitySlug: true,
        university: { select: { name: true, slug: true } },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // ─── Run Eligibility Checks ─────────────────────────────────────────────
    const requirements: RequirementCheck[] = [];
    let academicScore = 0;
    let englishScore = 0;
    let academicMax = 0;
    let englishMax = 0;
    const recommendations: string[] = [];

    // 1) Academic Level
    if (course.level || course.academicRequirement) {
      academicMax += 30;
      const result = checkAcademicLevel(profile.academicLevel, course.level || 'bachelors');
      requirements.push({
        name: 'academic_level',
        label: 'Academic Level',
        passed: result.passed,
        icon: 'GraduationCap',
        detail: result.detail,
        required: course.level || 'As specified',
        provided: profile.academicLevel,
        weight: 30,
      });
      if (result.passed) academicScore += 30;
      else if (result.detail.includes('one level')) {
        academicScore += 15;
        recommendations.push('Consider a foundation or pathway programme to meet the academic level requirement.');
      } else {
        recommendations.push('Your academic qualification does not meet the minimum requirement. A foundation or pre-master\'s course may help.');
      }
    }

    // 2) GPA / Percentage
    if (course.gpaRequirement || course.academicRequirement) {
      academicMax += 30;
      const reqText = course.gpaRequirement || course.academicRequirement || '';
      const parsed = parseGpaRequirement(reqText);

      if (parsed.gpa !== null && profile.gpa !== null) {
        let passed = false;
        if (parsed.isPercentage) {
          // Assuming student provides percentage (0-100) or GPA on 4.0 scale
          passed = profile.gpa >= parsed.gpa;
        } else {
          // GPA scale — assume 4.0 scale
          const studentGpa = profile.gpa > 4 ? (profile.gpa / 100) * 4 : profile.gpa;
          passed = studentGpa >= parsed.gpa;
        }

        const studentDisplay = profile.gpa > 4 ? `${profile.gpa}%` : `${profile.gpa}/4.0`;
        const reqDisplay = parsed.isPercentage ? `${parsed.gpa}%` : `${parsed.gpa}/4.0`;

        requirements.push({
          name: 'gpa',
          label: 'GPA / Percentage',
          passed,
          icon: 'Award',
          detail: passed
            ? `Your ${studentDisplay} meets the minimum requirement of ${reqDisplay}.`
            : `Your ${studentDisplay} is below the required ${reqDisplay}.`,
          required: reqDisplay,
          provided: studentDisplay,
          weight: 30,
        });
        if (passed) {
          academicScore += 30;
        } else {
          const ratio = Math.min(profile.gpa / parsed.gpa, 1);
          academicScore += Math.round(30 * ratio);
          recommendations.push(`Improve your GPA/percentage to at least ${reqDisplay} to strengthen your application.`);
        }
      } else if (profile.gpa !== null) {
        // No parseable requirement — give full marks
        requirements.push({
          name: 'gpa',
          label: 'GPA / Percentage',
          passed: true,
          icon: 'Award',
          detail: `Your GPA (${profile.gpa}) looks good. No specific numeric requirement found.`,
          required: 'Not specified',
          provided: `${profile.gpa}`,
          weight: 30,
        });
        academicScore += 30;
      } else {
        academicMax -= 30; // No data, don't penalize
      }
    }

    // 3) English (IELTS)
    if (course.englishRequirement) {
      englishMax += 25;
      const ieltsReq = parseIeltsFromRequirement(course.englishRequirement);

      if (ieltsReq.overall !== null && profile.ieltsOverall !== null) {
        const overallPassed = profile.ieltsOverall >= ieltsReq.overall;
        requirements.push({
          name: 'ielts_overall',
          label: 'IELTS Overall',
          passed: overallPassed,
          icon: 'Languages',
          detail: overallPassed
            ? `Your IELTS ${profile.ieltsOverall} meets the minimum ${ieltsReq.overall}.`
            : `Your IELTS ${profile.ieltsOverall} is below the required ${ieltsReq.overall}.`,
          required: `${ieltsReq.overall}`,
          provided: `${profile.ieltsOverall}`,
          weight: 15,
        });
        if (overallPassed) englishScore += 15;
        else {
          const ratio = Math.min(profile.ieltsOverall / ieltsReq.overall, 1);
          englishScore += Math.round(15 * ratio);
          recommendations.push(`Your IELTS overall score needs to be at least ${ieltsReq.overall}. Consider retaking the test or enrolling in an English preparation course.`);
        }
      } else if (profile.ieltsOverall !== null) {
        requirements.push({
          name: 'ielts_overall',
          label: 'IELTS Overall',
          passed: true,
          icon: 'Languages',
          detail: `IELTS ${profile.ieltsOverall} submitted. Specific requirement could not be parsed from course data.`,
          required: 'Not parsed',
          provided: `${profile.ieltsOverall}`,
          weight: 15,
        });
        englishScore += 15;
      } else {
        englishMax -= 15;
      }

      // IELTS minimum band
      if (ieltsReq.min !== null && profile.ieltsMin !== null) {
        englishMax += 10;
        const minPassed = profile.ieltsMin >= ieltsReq.min;
        requirements.push({
          name: 'ielts_min',
          label: 'IELTS Minimum Band',
          passed: minPassed,
          icon: 'Target',
          detail: minPassed
            ? `All your bands meet the minimum ${ieltsReq.min}.`
            : `You have a band below ${ieltsReq.min}.`,
          required: `${ieltsReq.min}`,
          provided: `${profile.ieltsMin}`,
          weight: 10,
        });
        if (minPassed) englishScore += 10;
        else {
          const ratio = Math.min(profile.ieltsMin / ieltsReq.min, 1);
          englishScore += Math.round(10 * ratio);
          recommendations.push(`Ensure no IELTS band is below ${ieltsReq.min}. Focus on your weakest skill.`);
        }
      }
    }

    // 4) Work Experience
    if (course.workExperience) {
      const reqYears = parseWorkExperience(course.workExperience);
      if (reqYears !== null) {
        const studentYears = profile.workExperienceYears ?? 0;
        const passed = studentYears >= reqYears;
        requirements.push({
          name: 'work_experience',
          label: 'Work Experience',
          passed,
          icon: 'Briefcase',
          detail: passed
            ? `Your ${studentYears} year(s) of experience meets the ${reqYears}-year requirement.`
            : `The course requires at least ${reqYears} year(s) of work experience. You have ${studentYears}.`,
          required: `${reqYears} year(s)`,
          provided: `${studentYears} year(s)`,
          weight: 15,
        });
        if (!passed) {
          recommendations.push(`Gain at least ${reqYears} year(s) of relevant work experience to meet this requirement.`);
        }
      } else {
        // Free text work exp requirement — just display it
        if (profile.workExperienceYears !== null && profile.workExperienceYears > 0) {
          requirements.push({
            name: 'work_experience',
            label: 'Work Experience',
            passed: true,
            icon: 'Briefcase',
            detail: `You have ${profile.workExperienceYears} year(s) of experience. Requirement: ${course.workExperience}`,
            required: course.workExperience,
            provided: `${profile.workExperienceYears} year(s)`,
            weight: 10,
          });
        }
      }
    }

    // 5) Portfolio
    if (course.portfolioRequired) {
      const passed = profile.hasPortfolio === true;
      requirements.push({
        name: 'portfolio',
        label: 'Portfolio',
        passed,
        icon: 'FolderOpen',
        detail: passed
          ? 'You have a portfolio ready.'
          : 'This course requires a portfolio. Prepare one before applying.',
        required: 'Yes',
        provided: profile.hasPortfolio ? 'Yes' : 'No',
        weight: 10,
      });
      if (!passed) {
        recommendations.push('Prepare a strong portfolio showcasing your relevant work, projects, or creative pieces.');
      }
    }

    // 6) Study Gap (from backlog policy or academic requirement)
    const gapText = course.backlogPolicy || course.academicRequirement || '';
    const maxGap = parseMaxGap(gapText);
    if (maxGap !== null && profile.studyGapMonths > 0) {
      const passed = profile.studyGapMonths <= maxGap;
      requirements.push({
        name: 'study_gap',
        label: 'Study Gap',
        passed,
        icon: 'Clock',
        detail: passed
          ? `Your ${profile.studyGapMonths}-month gap is within the accepted limit.`
          : `Your ${profile.studyGapMonths}-month gap exceeds the ${maxGap}-month limit. Consider explaining this in your personal statement.`,
        required: `Max ${maxGap} months`,
        provided: `${profile.studyGapMonths} months`,
        weight: 10,
      });
      if (!passed) {
        recommendations.push('A study gap beyond the accepted limit may need justification. Include relevant activities (work, courses, volunteering) in your application.');
      }
    }

    // ─── Calculate Scores ──────────────────────────────────────────────────
    const totalMax = academicMax + englishMax || 100;
    const totalScore = academicScore + englishScore;
    const academicPct = academicMax > 0 ? Math.round((academicScore / academicMax) * 100) : 0;
    const englishPct = englishMax > 0 ? Math.round((englishScore / englishMax) * 100) : 0;
    const overallPct = Math.round((totalScore / totalMax) * 100);

    const failedCount = requirements.filter((r) => !r.passed).length;
    const totalCount = requirements.length;

    let eligible: boolean;
    let status: 'ELIGIBLE' | 'CONDITIONAL' | 'NOT_ELIGIBLE';

    if (failedCount === 0) {
      eligible = true;
      status = 'ELIGIBLE';
    } else if (failedCount <= 2 && overallPct >= 60) {
      eligible = false;
      status = 'CONDITIONAL';
    } else {
      eligible = false;
      status = 'NOT_ELIGIBLE';
    }

    // Add general recommendations based on status
    if (status === 'CONDITIONAL') {
      recommendations.unshift('You are close to meeting all requirements. With a few improvements, you could be eligible.');
    } else if (status === 'NOT_ELIGIBLE' && overallPct >= 40) {
      recommendations.unshift('Consider pathway or foundation programmes that can lead to this course.');
    } else if (status === 'NOT_ELIGIBLE') {
      recommendations.unshift('This course may not be the best match. Use the Course Finder to explore similar programmes with lower entry requirements.');
    }

    // Add interview note if required
    if (course.interviewRequired) {
      recommendations.push('Note: This course requires an interview as part of the admission process.');
    }

    return NextResponse.json({
      eligible,
      status,
      course: {
        name: course.name,
        slug: course.slug,
        level: course.level,
        university: course.university?.name,
        universitySlug: course.university?.slug,
      },
      scores: {
        academic: academicPct,
        english: englishPct,
        overall: overallPct,
      },
      requirements,
      recommendations: [...new Set(recommendations)], // deduplicate
    });
  } catch (error) {
    console.error('Eligibility check API error:', error);
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
