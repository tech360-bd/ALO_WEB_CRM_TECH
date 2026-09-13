// Eligibility and AI Match Score Engine per spec sections 17, 18, 40
// Calculates eligibility based on student profile vs course requirements
// No fake data, no guarantee admission/visa

export interface StudentProfileInput {
  nationality?: string;
  educationCountry?: string;
  highestQualification?: string; // SSC, HSC, Bachelor, Masters
  gpa?: number;
  gpaScale?: string; // 4.0, 5.0, 100%
  englishTest?: string; // IELTS, PTE, TOEFL, Duolingo, MOI
  englishScore?: number;
  englishListening?: number;
  englishReading?: number;
  englishWriting?: number;
  englishSpeaking?: number;
  studyGap?: number; // months
  workExperience?: number; // months
  backlogs?: number;
  budgetMin?: number;
  budgetMax?: number;
  preferredCountry?: string;
  preferredSubject?: string;
  preferredIntake?: string; // September, January, May
}

export interface CourseRequirement {
  academicReq?: string;
  minGpa?: number;
  gpaScale?: string;
  backlogAllowed?: number;
  workExperienceRequired?: boolean;
  portfolioRequired?: boolean;
  interviewRequired?: boolean;
  ieltsOverall?: number;
  ieltsMinBand?: number;
  pteOverall?: number;
  toeflOverall?: number;
  detOverall?: number;
  moiAccepted?: boolean;
}

export type EligibilityLabel = 'Eligible' | 'Likely Eligible' | 'Need Review' | 'Not Eligible' | 'Missing Information';

export function calculateEligibilityScore(profile: StudentProfileInput, courseReq: CourseRequirement, course: any): { score: number; label: EligibilityLabel; missing: string[]; reasons: string[] } {
  const missing: string[] = [];
  const reasons: string[] = [];
  let score = 50; // base

  // Check qualification
  if (!profile.highestQualification) {
    missing.push('Highest qualification');
    score -= 10;
  } else {
    reasons.push(`Qualification: ${profile.highestQualification}`);
    score += 10;
  }

  // GPA check
  if (profile.gpa && courseReq.minGpa) {
    const normalizedGpa = normalizeGpa(profile.gpa, profile.gpaScale || '4.0');
    const normalizedReq = normalizeGpa(courseReq.minGpa, courseReq.gpaScale || '4.0');
    if (normalizedGpa >= normalizedReq) {
      reasons.push(`GPA meets requirement: ${profile.gpa} >= ${courseReq.minGpa}`);
      score += 15;
    } else {
      reasons.push(`GPA below requirement: ${profile.gpa} < ${courseReq.minGpa} — needs review`);
      score -= 10;
      missing.push(`GPA requirement: need ${courseReq.minGpa}, have ${profile.gpa}`);
    }
  } else if (!profile.gpa) {
    missing.push('GPA/CGPA');
    score -= 5;
  }

  // English test check
  if (profile.englishTest && profile.englishScore && courseReq) {
    const test = profile.englishTest.toLowerCase();
    let meetsEnglish = false;
    if (test.includes('ielts') && courseReq.ieltsOverall) {
      meetsEnglish = profile.englishScore >= courseReq.ieltsOverall;
      if (meetsEnglish) {
        reasons.push(`English: ${profile.englishTest} ${profile.englishScore} meets ${courseReq.ieltsOverall}`);
        score += 15;
      } else {
        reasons.push(`English: ${profile.englishTest} ${profile.englishScore} below ${courseReq.ieltsOverall}`);
        missing.push(`English: need ${courseReq.ieltsOverall}, have ${profile.englishScore}`);
        score -= 10;
      }
    } else if (test.includes('pte') && courseReq.pteOverall) {
      meetsEnglish = profile.englishScore >= courseReq.pteOverall;
      if (meetsEnglish) score += 15; else { score -= 10; missing.push(`PTE need ${courseReq.pteOverall}`); }
    } else if (test.includes('moi') && courseReq.moiAccepted) {
      reasons.push('MOI accepted for this course where verified');
      score += 10;
    } else {
      reasons.push(`English test ${profile.englishTest} — check specific course requirements, acceptance varies`);
      score += 5;
    }
  } else {
    missing.push('English test score');
    score -= 5;
  }

  // Study gap
  if (profile.studyGap && profile.studyGap > 60) {
    reasons.push(`Study gap ${Math.round(profile.studyGap/12)} years — requires explanation and work experience evidence`);
    if (!profile.workExperience) missing.push('Work experience evidence for study gap');
    score -= 5;
  }

  // Budget
  if (profile.budgetMax && course.tuitionFee) {
    if (profile.budgetMax >= course.tuitionFee) {
      reasons.push(`Budget matches tuition: ${profile.budgetMax} >= ${course.tuitionFee}`);
      score += 10;
    } else {
      reasons.push(`Budget below tuition: ${profile.budgetMax} < ${course.tuitionFee} — scholarship may help`);
      missing.push('Budget — scholarship guidance recommended');
      score -= 5;
    }
  }

  // Preferred country/subject match
  if (profile.preferredCountry && course.country) {
    if (profile.preferredCountry.toLowerCase() === course.country.toLowerCase() || course.country.toLowerCase().includes(profile.preferredCountry.toLowerCase())) {
      reasons.push(`Preferred country matches: ${profile.preferredCountry}`);
      score += 10;
    }
  }
  if (profile.preferredSubject && course.subjectArea) {
    if (course.subjectArea.toLowerCase().includes(profile.preferredSubject.toLowerCase())) {
      reasons.push(`Preferred subject matches: ${profile.preferredSubject}`);
      score += 10;
    }
  }

  // Clamp score 0-100
  score = Math.max(0, Math.min(100, score));

  let label: EligibilityLabel = 'Need Review';
  if (missing.length > 2) label = 'Missing Information';
  else if (score >= 85) label = 'Eligible';
  else if (score >= 70) label = 'Likely Eligible';
  else if (score >= 50) label = 'Need Review';
  else label = 'Not Eligible';

  return { score, label, missing, reasons };
}

function normalizeGpa(gpa: number, scale: string): number {
  if (scale === '4.0') return gpa;
  if (scale === '5.0') return (gpa / 5) * 4;
  if (scale === '100%' || scale === '100') return (gpa / 100) * 4;
  return gpa; // fallback
}

export function calculateMatchScore(profile: StudentProfileInput, course: any, eligibilityScore: number): number {
  let match = eligibilityScore * 0.6; // eligibility weight 60%

  // Budget match 15%
  if (profile.budgetMax && course.tuitionFee) {
    if (profile.budgetMax >= course.tuitionFee) match += 15;
    else if (profile.budgetMax >= course.tuitionFee * 0.8) match += 10;
    else match += 5;
  } else {
    match += 7;
  }

  // Country preference 10%
  if (profile.preferredCountry && course.country && profile.preferredCountry.toLowerCase() === course.country.toLowerCase()) match += 10;
  else match += 5;

  // Subject preference 10%
  if (profile.preferredSubject && course.subjectArea && course.subjectArea.toLowerCase().includes(profile.preferredSubject.toLowerCase())) match += 10;
  else match += 5;

  // Intake preference 5%
  if (profile.preferredIntake && course.intakes) {
    const hasIntake = course.intakes.some((i: any) => (i.intakeMonth || '').toLowerCase().includes(profile.preferredIntake!.toLowerCase()));
    if (hasIntake) match += 5;
  }

  return Math.max(0, Math.min(100, Math.round(match)));
}

export function calculateDataQualityScore(university: any, course: any, intakes: any[], entryReqs: any[], englishReqs: any[], scholarships: any[], sourceLogs: any[]): { score: number; grade: string; factors: any } {
  let score = 0;
  const factors: any = {};

  // University relationship 15
  if (course.universityId || course.university) { score += 15; factors.universityRelationship = 'exists'; } else { factors.universityRelationship = 'missing'; }

  // Country relationship 10
  if (course.countryId || course.country) { score += 10; factors.countryRelationship = 'exists'; } else { factors.countryRelationship = 'missing'; }

  // Official source 20
  if (course.sourceUrl || course.officialUrl) { score += 20; factors.officialSource = 'exists'; } else { factors.officialSource = 'missing'; }

  // Last verified date 10
  if (course.lastVerifiedAt) {
    const daysSince = (Date.now() - new Date(course.lastVerifiedAt).getTime()) / (1000*60*60*24);
    if (daysSince < 30) { score += 10; factors.lastVerified = 'recent'; }
    else if (daysSince < 90) { score += 7; factors.lastVerified = 'within 90 days'; }
    else if (daysSince < 180) { score += 5; factors.lastVerified = 'within 180 days'; }
    else { score += 2; factors.lastVerified = 'old'; }
  } else { factors.lastVerified = 'missing'; }

  // Tuition 10
  if (course.tuitionFee || course.yearlyTuition) { score += 10; factors.tuition = 'exists'; } else { factors.tuition = 'missing'; }

  // Intake 10
  if (intakes && intakes.length > 0) { score += 10; factors.intake = `exists ${intakes.length}`; } else { factors.intake = 'missing'; }

  // Entry requirement 10
  if (entryReqs && entryReqs.length > 0) { score += 10; factors.entryRequirement = 'exists'; } else { factors.entryRequirement = 'missing'; }

  // English requirement 10
  if (englishReqs && englishReqs.length > 0) { score += 10; factors.englishRequirement = 'exists'; } else { factors.englishRequirement = 'missing'; }

  // Scholarship 2 (bonus)
  if (scholarships && scholarships.length > 0) { score += 2; factors.scholarship = `exists ${scholarships.length}`; } else { factors.scholarship = 'missing'; }

  // Deadline 3 (bonus)
  if (course.deadline || intakes.some((i:any)=> i.deadline || i.applicationDeadline)) { score += 3; factors.deadline = 'exists'; } else { factors.deadline = 'missing'; }

  score = Math.min(100, score);

  let grade = 'Incomplete';
  if (score >= 90) grade = 'Excellent';
  else if (score >= 70) grade = 'Good';
  else if (score >= 50) grade = 'Needs Review';
  else grade = 'Incomplete';

  return { score, grade, factors };
}
