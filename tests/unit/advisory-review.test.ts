import { describe, expect, it } from 'vitest';
import {
  reviewCv,
  reviewStatementOfPurpose,
  reviewVisaAnswer,
  scoreFromFindings,
  summariseFindings,
} from '@/lib/advisory-review';

describe('reviewVisaAnswer', () => {
  it('reports an empty answer as a blocking finding', () => {
    const result = reviewVisaAnswer('   ');
    expect(result.wordCount).toBe(0);
    expect(result.completenessScore).toBe(0);
    expect(result.findings.map((finding) => finding.id)).toContain('empty');
  });

  it('flags an answer that omits the course the applicant declared', () => {
    const result = reviewVisaAnswer(
      'I want to study abroad because it will help my career and I have always wanted to travel and see the world.',
      { course: 'MSc Data Science' },
    );
    expect(result.findings.map((finding) => finding.id)).toContain('course-not-mentioned');
  });

  it('does not flag the course when the answer names it', () => {
    const result = reviewVisaAnswer(
      'I chose MSc Data Science because my undergraduate statistics modules showed me I enjoy the modelling side of analysis, and this course builds directly on that.',
      { course: 'MSc Data Science' },
    );
    expect(result.findings.map((finding) => finding.id)).not.toContain('course-not-mentioned');
  });

  it('flags a missing post-study plan only when one was declared', () => {
    const answer = 'I chose this course because the modules match the analytical work I want to do professionally.';
    expect(reviewVisaAnswer(answer, {}).findings.map((f) => f.id)).not.toContain('no-future-plan');
    expect(
      reviewVisaAnswer(answer, { returnPlan: 'Return to Dhaka' }).findings.map((f) => f.id),
    ).toContain('no-future-plan');
  });

  it('accepts an answer that states a future intention', () => {
    const result = reviewVisaAnswer(
      'After I graduate I plan to return to Dhaka and work as a data analyst in the financial services sector.',
      { returnPlan: 'Return to Dhaka' },
    );
    expect(result.findings.map((finding) => finding.id)).not.toContain('no-future-plan');
  });

  it('counts words so length findings are accurate', () => {
    expect(reviewVisaAnswer('one two three').wordCount).toBe(3);
    expect(reviewVisaAnswer('').wordCount).toBe(0);
  });
});

describe('reviewStatementOfPurpose', () => {
  const context = { programme: 'MSc Data Science', university: 'University of Leeds' };

  it('reports an empty draft as blocking', () => {
    const result = reviewStatementOfPurpose('');
    expect(result.completenessScore).toBe(0);
    expect(result.findings.map((finding) => finding.id)).toContain('empty');
  });

  it('treats a missing programme name as an error, not a suggestion', () => {
    const result = reviewStatementOfPurpose('I have always loved computers. '.repeat(60), context);
    const programme = result.findings.find((finding) => finding.id === 'programme-not-named');
    expect(programme?.severity).toBe('error');
  });

  it('flags clichéd phrasing', () => {
    const result = reviewStatementOfPurpose(
      `Since childhood I have been passionate about data. I want to study MSc Data Science at this prestigious world-class university.`,
      context,
    );
    expect(result.findings.map((finding) => finding.id)).toContain('cliches');
  });

  it('rewards a structured statement that names programme and university', () => {
    const body = [
      'My undergraduate degree in statistics gave me a grounding in inference and modelling.',
      'This led me to an internship where I built reporting for a lending book, which is why I want to study MSc Data Science at the University of Leeds specifically.',
      'The programme covers the Bayesian methods I could not study as an undergraduate, and therefore it is the shortest route to the analyst role I am aiming for.',
    ].join('\n\n');
    const result = reviewStatementOfPurpose(`${body} ${'I worked on real portfolio data with a small team. '.repeat(12)}`, context);
    expect(result.findings.map((finding) => finding.id)).not.toContain('programme-not-named');
    expect(result.findings.map((finding) => finding.id)).not.toContain('university-not-named');
    expect(result.findings.map((finding) => finding.id)).not.toContain('structure');
    expect(result.completenessScore).toBeGreaterThan(70);
  });

  it('detects a draft that is a single block of text', () => {
    const result = reviewStatementOfPurpose(`MSc Data Science. ${'I want to study this subject. '.repeat(40)}`, context);
    expect(result.findings.map((finding) => finding.id)).toContain('structure');
  });
});

describe('reviewCv', () => {
  it('flags every missing section on an empty profile', () => {
    const result = reviewCv({});
    const ids = result.findings.map((finding) => finding.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'missing-fullName',
        'missing-email',
        'missing-phone',
        'missing-education',
        'missing-experience',
        'missing-skills',
        'missing-achievements',
        'missing-languages',
      ]),
    );
    // 3 errors (60) + 2 warnings (20) + 3 suggestions (12) = 92 penalty.
    expect(result.completenessScore).toBe(8);
    expect(result.findings).toHaveLength(8);
  });

  it('accepts a complete profile without findings', () => {
    const result = reviewCv({
      fullName: 'Ayesha Rahman',
      email: 'ayesha@example.com',
      phone: '+880 1711 000000',
      education: [{ institution: 'University of Dhaka', qualification: 'BSc Statistics', startDate: '2019', endDate: '2023' }],
      experience: [{ role: 'Data Intern', organisation: 'Bank', startDate: '2022', endDate: '2022', summary: 'Built weekly reporting for a lending portfolio used by the risk team.' }],
      skills: ['Python'],
      achievements: ['Departmental scholarship'],
      languages: ['Bangla (native)'],
    });
    expect(result.findings).toEqual([]);
    expect(result.completenessScore).toBe(100);
  });

  it('rejects a malformed email address', () => {
    const result = reviewCv({ email: 'ayesha@example' });
    expect(result.findings.map((finding) => finding.id)).toContain('invalid-email');
  });

  it('flags education entries missing dates, since gaps are checked', () => {
    const result = reviewCv({
      education: [{ institution: 'University of Dhaka', qualification: 'BSc Statistics' }],
    });
    expect(result.findings.map((finding) => finding.id)).toContain('education-dates-0');
  });

  it('flags an experience entry that is only a job title', () => {
    const result = reviewCv({
      experience: [{ role: 'Intern', organisation: 'Bank', startDate: '2022', endDate: '2022', summary: '' }],
    });
    expect(result.findings.map((finding) => finding.id)).toContain('experience-summary-0');
  });

  it('treats an empty experience array as a missing section but not an invalid one', () => {
    const result = reviewCv({ experience: [] });
    expect(result.findings.map((finding) => finding.id)).toContain('missing-experience');
    expect(result.findings.map((finding) => finding.id)).not.toContain('experience-summary-0');
  });
});

describe('scoreFromFindings', () => {
  it('never returns a score outside 0–100', () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      id: `f${index}`,
      severity: 'error' as const,
      label: 'x',
      detail: 'y',
    }));
    expect(scoreFromFindings(many)).toBe(0);
    expect(scoreFromFindings([])).toBe(100);
  });

  it('weights errors above warnings above suggestions', () => {
    const make = (severity: 'error' | 'warning' | 'info') => [{ id: 'a', severity, label: 'x', detail: 'y' }];
    const errorScore = scoreFromFindings(make('error'));
    const warningScore = scoreFromFindings(make('warning'));
    const infoScore = scoreFromFindings(make('info'));
    expect(errorScore).toBeLessThan(warningScore);
    expect(warningScore).toBeLessThan(infoScore);
  });
});

describe('summariseFindings', () => {
  it('counts each severity separately', () => {
    const summary = summariseFindings([
      { id: '1', severity: 'error', label: 'a', detail: 'b' },
      { id: '2', severity: 'error', label: 'a', detail: 'b' },
      { id: '3', severity: 'warning', label: 'a', detail: 'b' },
      { id: '4', severity: 'info', label: 'a', detail: 'b' },
    ]);
    expect(summary).toEqual({ errors: 2, warnings: 1, info: 1 });
  });
});
