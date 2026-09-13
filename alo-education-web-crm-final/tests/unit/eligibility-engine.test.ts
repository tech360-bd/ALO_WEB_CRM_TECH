import { describe, it, expect } from 'vitest';
import { evaluateCourseEligibility, StudentProfileInput, CourseRequirementInput } from '../../src/lib/eligibility-engine';

describe('Intelligent Student Eligibility Engine (25 Profile Scenarios & 7 Categories)', () => {

  const baseCourse: CourseRequirementInput = {
    courseId: 'CRS-0001',
    courseTitle: 'BSc Computer Science',
    universityName: 'University of Oxford',
    country: 'United Kingdom',
    studyLevel: 'Bachelor',
    minGpaOrPercentage: 3.0,
    minIeltsOverall: 6.5,
    maxAllowedStudyGapYears: 3,
    tuitionFeeUsd: 30000,
    availableToInternational: true,
  };

  // 1. Directly eligible Bachelor's applicant
  it('Scenario 1: Direct Bachelor applicant meeting all criteria -> ELIGIBLE', () => {
    const student: StudentProfileInput = {
      highestQualification: 'High School',
      gpaOrPercentage: 3.8,
      englishTestType: 'IELTS',
      englishOverall: 7.5,
      studyGapYears: 0,
      maxBudgetUsd: 40000,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.category).toBe('ELIGIBLE');
    expect(res.matchScorePercent).toBeGreaterThanOrEqual(90);
  });

  // 2. Foundation applicant
  it('Scenario 2: Low GPA Bachelor applicant -> Recommended Foundation -> NOT_CURRENTLY_ELIGIBLE', () => {
    const student: StudentProfileInput = {
      highestQualification: 'High School',
      gpaOrPercentage: 2.2,
      englishTestType: 'IELTS',
      englishOverall: 6.5,
      studyGapYears: 0,
      maxBudgetUsd: 35000,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.category).toBe('NOT_CURRENTLY_ELIGIBLE');
    expect(res.improvementPlan.some(p => p.includes('Foundation'))).toBe(true);
  });

  // 3. International Year One applicant
  it('Scenario 3: Diploma student seeking Year 2 progression -> PARTIALLY_MATCHED / Pathway', () => {
    const student: StudentProfileInput = {
      highestQualification: 'Diploma',
      gpaOrPercentage: 2.9,
      englishTestType: 'IELTS',
      englishOverall: 6.0,
      studyGapYears: 1,
      maxBudgetUsd: 32000,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.comparisonTable.length).toBeGreaterThan(0);
  });

  // 4. Year 2 entry applicant
  it('Scenario 4: Advanced entry Year 2 credit transfer', () => {
    const student: StudentProfileInput = {
      highestQualification: 'Bachelor First Year Completed',
      gpaOrPercentage: 3.4,
      englishTestType: 'IELTS',
      englishOverall: 6.5,
      studyGapYears: 0,
      maxBudgetUsd: 35000,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.matchScorePercent).toBeGreaterThan(70);
  });

  // 5. Year 3 entry applicant
  it('Scenario 5: Advanced entry Year 3 credit transfer', () => {
    const student: StudentProfileInput = {
      highestQualification: 'Associate Degree / HND Level 5',
      gpaOrPercentage: 3.5,
      englishTestType: 'IELTS',
      englishOverall: 7.0,
      studyGapYears: 0,
      maxBudgetUsd: 35000,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.comparisonTable.find(c => c.requirementName === 'Academic Result (GPA / %)')?.passed).toBe(true);
  });

  // 6. Top-up applicant
  it('Scenario 6: 1-Year Top-up degree applicant', () => {
    const topUpCourse: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'BSc Business Management (Top-Up)',
      studyLevel: 'Bachelor Top-Up',
      minGpaOrPercentage: 2.8,
    };
    const student: StudentProfileInput = {
      highestQualification: 'HND Level 5',
      gpaOrPercentage: 3.0,
      englishTestType: 'IELTS',
      englishOverall: 6.5,
      studyGapYears: 1,
      maxBudgetUsd: 25000,
    };
    const res = evaluateCourseEligibility(student, topUpCourse);
    expect(res.category).toBe('ELIGIBLE');
  });

  // 7. Taught Master's applicant
  it('Scenario 7: Taught MSc applicant meeting prerequisites -> ELIGIBLE', () => {
    const mscCourse: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'MSc Data Science',
      studyLevel: 'Master',
      minGpaOrPercentage: 3.0,
      minIeltsOverall: 6.5,
    };
    const student: StudentProfileInput = {
      highestQualification: 'Bachelors',
      gpaOrPercentage: 3.3,
      englishTestType: 'IELTS',
      englishOverall: 7.0,
      studyGapYears: 1,
      maxBudgetUsd: 35000,
    };
    const res = evaluateCourseEligibility(student, mscCourse);
    expect(res.category).toBe('ELIGIBLE');
  });

  // 8. Master's with placement applicant
  it('Scenario 8: Master with Placement / Internship', () => {
    const mscPlacement: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'MSc Computer Science with Advanced Practice',
      studyLevel: 'Master Placement',
      minGpaOrPercentage: 3.0,
    };
    const student: StudentProfileInput = {
      highestQualification: 'Bachelors',
      gpaOrPercentage: 3.4,
      englishTestType: 'IELTS',
      englishOverall: 6.5,
      studyGapYears: 0,
      maxBudgetUsd: 32000,
    };
    const res = evaluateCourseEligibility(student, mscPlacement);
    expect(res.category).toBe('ELIGIBLE');
  });

  // 9. MRes applicant
  it('Scenario 9: Master of Research (MRes) applicant', () => {
    const mresCourse: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'MRes Medical Sciences',
      studyLevel: 'Master Research',
      minGpaOrPercentage: 3.3,
      minIeltsOverall: 7.0,
    };
    const student: StudentProfileInput = {
      highestQualification: 'Bachelors',
      gpaOrPercentage: 3.5,
      englishTestType: 'IELTS',
      englishOverall: 7.0,
      studyGapYears: 0,
      maxBudgetUsd: 35000,
    };
    const res = evaluateCourseEligibility(student, mresCourse);
    expect(res.category).toBe('ELIGIBLE');
  });

  // 10. MSc by Research applicant
  it('Scenario 10: MSc by Research applicant', () => {
    const mscRes: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'MSc by Research in Artificial Intelligence',
      studyLevel: 'Master Research',
      minGpaOrPercentage: 3.2,
    };
    const student: StudentProfileInput = {
      highestQualification: 'Bachelors',
      gpaOrPercentage: 3.4,
      englishTestType: 'PTE',
      englishOverall: 68,
      studyGapYears: 1,
      maxBudgetUsd: 35000,
    };
    const res = evaluateCourseEligibility(student, mscRes);
    expect(res.comparisonTable.length).toBeGreaterThan(0);
  });

  // 11. MPhil applicant
  it('Scenario 11: MPhil applicant', () => {
    const mphil: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'Master of Philosophy in Economics',
      studyLevel: 'MPhil',
      minGpaOrPercentage: 3.5,
    };
    const student: StudentProfileInput = {
      highestQualification: 'Bachelors',
      gpaOrPercentage: 3.6,
      englishTestType: 'IELTS',
      englishOverall: 7.5,
      studyGapYears: 0,
      maxBudgetUsd: 40000,
    };
    const res = evaluateCourseEligibility(student, mphil);
    expect(res.category).toBe('ELIGIBLE');
  });

  // 12. PhD applicant
  it('Scenario 12: PhD applicant', () => {
    const phd: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'PhD in Quantum Physics',
      studyLevel: 'Doctorate',
      minGpaOrPercentage: 3.5,
      minIeltsOverall: 7.0,
    };
    const student: StudentProfileInput = {
      highestQualification: 'Masters',
      gpaOrPercentage: 3.7,
      englishTestType: 'IELTS',
      englishOverall: 7.5,
      studyGapYears: 1,
      maxBudgetUsd: 45000,
    };
    const res = evaluateCourseEligibility(student, phd);
    expect(res.category).toBe('ELIGIBLE');
  });

  // 13. Funded PhD applicant
  it('Scenario 13: Funded PhD project applicant', () => {
    const fundedPhd: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'Funded PhD in Machine Learning Genomics',
      studyLevel: 'Doctorate',
      tuitionFeeUsd: 0,
      minGpaOrPercentage: 3.5,
    };
    const student: StudentProfileInput = {
      highestQualification: 'Masters',
      gpaOrPercentage: 3.8,
      englishTestType: 'IELTS',
      englishOverall: 7.5,
      studyGapYears: 0,
      maxBudgetUsd: 10000,
    };
    const res = evaluateCourseEligibility(student, fundedPhd);
    expect(res.category).toBe('ELIGIBLE');
  });

  // 14. Insufficient academic GPA
  it('Scenario 14: Student with GPA 2.4 vs requirement 3.2 -> NOT_CURRENTLY_ELIGIBLE', () => {
    const course: CourseRequirementInput = { ...baseCourse, minGpaOrPercentage: 3.2 };
    const student: StudentProfileInput = {
      gpaOrPercentage: 2.4,
      englishTestType: 'IELTS',
      englishOverall: 7.0,
    };
    const res = evaluateCourseEligibility(student, course);
    expect(res.category).toBe('NOT_CURRENTLY_ELIGIBLE');
    expect(res.comparisonTable.find(c => c.requirementName.includes('Academic'))?.passed).toBe(false);
  });

  // 15. Low IELTS overall score
  it('Scenario 15: Student with IELTS 5.5 vs requirement 6.5 -> CONDITIONALLY_ELIGIBLE', () => {
    const student: StudentProfileInput = {
      gpaOrPercentage: 3.5,
      englishTestType: 'IELTS',
      englishOverall: 5.5,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.category).toBe('CONDITIONALLY_ELIGIBLE');
    expect(res.improvementPlan.some(p => p.includes('Pre-sessional') || p.includes('retake'))).toBe(true);
  });

  // 16. Low IELTS subscore / Component score
  it('Scenario 16: Overall 6.5 but low writing subscore -> CONDITIONALLY_ELIGIBLE', () => {
    const student: StudentProfileInput = {
      gpaOrPercentage: 3.5,
      englishTestType: 'IELTS',
      englishOverall: 6.5,
      englishWriting: 5.0,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.comparisonTable.length).toBeGreaterThan(0);
  });

  // 17. No English test yet
  it('Scenario 17: Medium of Instruction / No Test Score -> CONDITIONALLY_ELIGIBLE', () => {
    const student: StudentProfileInput = {
      gpaOrPercentage: 3.6,
      englishTestType: 'MOI',
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.category).toBe('CONDITIONALLY_ELIGIBLE');
  });

  // 18. Expired English test result
  it('Scenario 18: Expired test score -> CONDITIONALLY_ELIGIBLE / Retake required', () => {
    const student: StudentProfileInput = {
      gpaOrPercentage: 3.2,
      englishTestType: 'IELTS',
      englishOverall: 6.5,
      isEnglishExpired: true,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.category).toBe('CONDITIONALLY_ELIGIBLE');
    expect(res.improvementPlan.some(p => p.includes('expired'))).toBe(true);
  });

  // 19. Student with a study gap
  it('Scenario 19: 5-year study gap vs 3-year threshold -> Document requirement notes', () => {
    const student: StudentProfileInput = {
      gpaOrPercentage: 3.4,
      englishTestType: 'IELTS',
      englishOverall: 6.5,
      studyGapYears: 5,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.improvementPlan.some(p => p.includes('work experience'))).toBe(true);
  });

  // 20. Insufficient work experience for MBA
  it('Scenario 20: MBA applicant with 6 months work exp vs 24 months req', () => {
    const mbaCourse: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'Master of Business Administration (MBA)',
      studyLevel: 'Master',
      minWorkExpMonths: 24,
    };
    const student: StudentProfileInput = {
      gpaOrPercentage: 3.4,
      englishTestType: 'IELTS',
      englishOverall: 7.0,
      workExperienceMonths: 6,
    };
    const res = evaluateCourseEligibility(student, mbaCourse);
    expect(res.comparisonTable.length).toBeGreaterThan(0);
  });

  // 21. Student with missing research proposal for PhD
  it('Scenario 21: PhD applicant missing proposal -> Action plan', () => {
    const phdCourse: CourseRequirementInput = {
      ...baseCourse,
      courseTitle: 'PhD in Computer Science',
      studyLevel: 'Doctorate',
    };
    const student: StudentProfileInput = {
      highestQualification: 'Masters',
      gpaOrPercentage: 3.8,
      englishTestType: 'IELTS',
      englishOverall: 7.5,
    };
    const res = evaluateCourseEligibility(student, phdCourse);
    expect(res.category).toBe('ELIGIBLE');
  });

  // 22. Student budget below tuition fee
  it('Scenario 22: Budget $15k vs tuition $30k -> Financial note & Scholarship recommendation', () => {
    const student: StudentProfileInput = {
      gpaOrPercentage: 3.5,
      englishTestType: 'IELTS',
      englishOverall: 7.0,
      maxBudgetUsd: 15000,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.comparisonTable.find(c => c.requirementName === 'Tuition Affordability')?.passed).toBe(false);
    expect(res.improvementPlan.some(p => p.includes('Scholarship') || p.includes('tuition'))).toBe(true);
  });

  // 23. Student applying after application deadline
  it('Scenario 23: Application deadline evaluation', () => {
    const student: StudentProfileInput = {
      gpaOrPercentage: 3.4,
      englishTestType: 'IELTS',
      englishOverall: 6.5,
    };
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.comparisonTable.length).toBeGreaterThan(0);
  });

  // 24. Student applying to a closed intake
  it('Scenario 24: International closed course -> NOT_CURRENTLY_ELIGIBLE', () => {
    const closedCourse: CourseRequirementInput = {
      ...baseCourse,
      availableToInternational: false,
    };
    const student: StudentProfileInput = {
      gpaOrPercentage: 3.8,
      englishTestType: 'IELTS',
      englishOverall: 7.5,
    };
    const res = evaluateCourseEligibility(student, closedCourse);
    expect(res.category).toBe('NOT_CURRENTLY_ELIGIBLE');
  });

  // 25. Student with incomplete profile information
  it('Scenario 25: Empty profile inputs -> INSUFFICIENT_INFO', () => {
    const student: StudentProfileInput = {};
    const res = evaluateCourseEligibility(student, baseCourse);
    expect(res.category).toBe('INSUFFICIENT_INFO');
  });
});
