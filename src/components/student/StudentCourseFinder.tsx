'use client';

// ============================================================
// STUDENT COURSE FINDER — real catalogue + real eligibility engine
// (spec s45, s15, s16, s92, s93)
// ============================================================
// This file previously held a 1000-line static MOCK_COURSES list that performed
// NO data fetching and rendered a fabricated "High Chance" admission badge and
// match percentage for invented courses at real universities. That is prohibited
// by s92, and an admission-chance claim is exactly the unverifiable prediction
// s15 and s93 forbid.
//
// It is replaced by the implementation that already existed at
// src/app/student/course-finder/page.tsx, which reads the SAME canonical course
// database as the public finder (/api/courses/search) and scores it with the
// real eligibility engine in src/lib/university-course/eligibility-engine.ts.
// Keeping it here means the portal view map in src/app/page.tsx resolves to the
// real thing without a change to that file, and the standalone route now renders
// this component instead of duplicating it.
//
// One deliberate change from the previous implementation: the student profile no
// longer defaults to invented values (nationality "Bangladeshi", GPA 3.2, IELTS
// 6.5). Scoring against fabricated inputs produces a confident-looking eligibility
// label for a student who never supplied them, so the profile starts EMPTY and
// the engine's own "Missing Information" label is shown until the student enters
// real data.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search,
  MapPin,
  BookmarkPlus,
  GitCompare,
  Send,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import {
  calculateEligibilityScore,
  calculateMatchScore,
  type CourseRequirement,
  type StudentProfileInput,
} from '@/lib/university-course/eligibility-engine';

interface Profile {
  nationality: string;
  highestQualification: string;
  gpa: number | null;
  englishTest: string;
  englishScore: number | null;
  preferredCountry: string;
  preferredSubject: string;
  budgetMax: number | null;
}

/** Empty by design — see the note above about fabricated defaults. */
const EMPTY_PROFILE: Profile = {
  nationality: '',
  highestQualification: '',
  gpa: null,
  englishTest: '',
  englishScore: null,
  preferredCountry: '',
  preferredSubject: '',
  budgetMax: null,
};

const LABEL_STYLE: Record<string, string> = {
  Eligible: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Likely Eligible': 'bg-blue-50 text-blue-700 border-blue-100',
  'Need Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Not Eligible': 'bg-red-50 text-red-700 border-red-200',
  'Missing Information': 'bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]',
};

function parseNumber(value: string): number | null {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Adapt the form state to the engine's input. `null` means "not supplied" here,
 * but the engine treats a present key as supplied, so nulls are dropped rather
 * than passed through — otherwise an empty GPA field would be scored as a real
 * value instead of contributing to "Missing Information".
 */
function toProfileInput(profile: Profile): StudentProfileInput {
  const input: StudentProfileInput = {};
  if (profile.nationality.trim()) input.nationality = profile.nationality.trim();
  if (profile.highestQualification.trim()) input.highestQualification = profile.highestQualification.trim();
  if (profile.gpa !== null) input.gpa = profile.gpa;
  if (profile.englishTest.trim()) input.englishTest = profile.englishTest.trim();
  if (profile.englishScore !== null) input.englishScore = profile.englishScore;
  if (profile.preferredCountry.trim()) input.preferredCountry = profile.preferredCountry.trim();
  if (profile.preferredSubject.trim()) input.preferredSubject = profile.preferredSubject.trim();
  if (profile.budgetMax !== null) input.budgetMax = profile.budgetMax;
  return input;
}

/** Narrow an unknown requirements payload to the engine's shape without casting blindly. */
function toRequirements(course: Record<string, unknown>): CourseRequirement {
  const raw = course.requirements;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const requirement: CourseRequirement = {};
  const num = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  const str = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value : undefined;
  const bool = (value: unknown): boolean | undefined => (typeof value === 'boolean' ? value : undefined);

  requirement.academicReq = str(source.academicReq);
  requirement.minGpa = num(source.minGpa);
  requirement.gpaScale = str(source.gpaScale);
  requirement.backlogAllowed = num(source.backlogAllowed);
  requirement.workExperienceRequired = bool(source.workExperienceRequired);
  requirement.portfolioRequired = bool(source.portfolioRequired);
  requirement.interviewRequired = bool(source.interviewRequired);
  requirement.ieltsOverall = num(source.ieltsOverall);
  requirement.ieltsMinBand = num(source.ieltsMinBand);
  requirement.pteOverall = num(source.pteOverall);
  requirement.toeflOverall = num(source.toeflOverall);
  requirement.detOverall = num(source.detOverall);
  requirement.moiAccepted = bool(source.moiAccepted);
  return requirement;
}

export default function StudentCourseFinder() {
  const [courses, setCourses] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [search, setSearch] = useState('');

  // Has the student actually supplied anything to score against?
  const hasProfile =
    profile.highestQualification.trim() !== '' ||
    profile.gpa !== null ||
    profile.englishScore !== null;

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (profile.preferredCountry.trim()) params.set('country', profile.preferredCountry.trim());
      params.set('limit', '24');

      const res = await fetch(`/api/courses/search?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setCourses([]);
        setLoadError(json?.error || `Course search failed with status ${res.status}.`);
        return;
      }
      const data = Array.isArray(json?.data) ? json.data : [];

      // Score against the real engine, but only when there is a real profile.
      // Without one, an eligibility percentage would be invented from nothing.
      const enriched = data.map((course: Record<string, unknown>) => {
        if (!hasProfile) return { ...course, eligibility: null, matchScore: null };
        const eligibility = calculateEligibilityScore(toProfileInput(profile), toRequirements(course), course);
        const matchScore = calculateMatchScore(toProfileInput(profile), course, eligibility.score);
        return { ...course, eligibility, matchScore };
      });
      setCourses(enriched);
    } catch (error) {
      setCourses([]);
      setLoadError(error instanceof Error ? error.message : 'Could not reach the course catalogue.');
    } finally {
      setLoading(false);
    }
  }, [search, profile, hasProfile]);

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses, reloadKey]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--alo-border)] bg-white p-6 shadow-sm sm:p-8">
        <Badge className="mb-3 border-[var(--alo-brand)]/20 bg-[var(--alo-brand)]/10 text-xs text-[var(--alo-brand)]">
          Same catalogue as the public finder · scored against your own profile
        </Badge>
        <h1 className="mb-2 text-2xl font-bold text-[var(--alo-text)] sm:text-3xl">Find courses</h1>
        <p className="max-w-3xl text-sm text-[var(--alo-body)]">
          Results come from the live course database. Eligibility is calculated from the details you
          enter below — nationality, qualification, GPA, English test and score, budget and
          preferences. Labels are Eligible, Likely Eligible, Need Review, Not Eligible and Missing
          Information. <strong className="font-semibold">An eligibility label is never a guarantee
          of admission or of a visa.</strong>
        </p>

        {!hasProfile && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <Info className="mt-0.5 size-4 shrink-0" />
            Enter at least your qualification, GPA or English score to see eligibility labels. Until
            then every course is shown as <strong className="font-semibold">Missing Information</strong>{' '}
            rather than being scored against details you have not given.
          </p>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="cf-qual" className="text-xs font-semibold">Highest qualification</Label>
            <Input
              id="cf-qual"
              placeholder="e.g. Bachelor"
              value={profile.highestQualification}
              onChange={(e) => setProfile({ ...profile, highestQualification: e.target.value })}
              className="h-10 border-[var(--alo-border)] bg-white text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-gpa" className="text-xs font-semibold">GPA / CGPA</Label>
            <Input
              id="cf-gpa"
              placeholder="e.g. 3.2"
              value={profile.gpa ?? ''}
              onChange={(e) => setProfile({ ...profile, gpa: parseNumber(e.target.value) })}
              className="h-10 border-[var(--alo-border)] bg-white text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-test" className="text-xs font-semibold">English test</Label>
            <Input
              id="cf-test"
              placeholder="e.g. IELTS"
              value={profile.englishTest}
              onChange={(e) => setProfile({ ...profile, englishTest: e.target.value })}
              className="h-10 border-[var(--alo-border)] bg-white text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-score" className="text-xs font-semibold">English score</Label>
            <Input
              id="cf-score"
              placeholder="e.g. 6.5"
              value={profile.englishScore ?? ''}
              onChange={(e) => setProfile({ ...profile, englishScore: parseNumber(e.target.value) })}
              className="h-10 border-[var(--alo-border)] bg-white text-sm"
            />
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="cf-country" className="text-xs font-semibold">Preferred country</Label>
            <Input
              id="cf-country"
              placeholder="e.g. United Kingdom"
              value={profile.preferredCountry}
              onChange={(e) => setProfile({ ...profile, preferredCountry: e.target.value })}
              className="h-10 border-[var(--alo-border)] bg-white text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-subject" className="text-xs font-semibold">Preferred subject</Label>
            <Input
              id="cf-subject"
              placeholder="e.g. Business"
              value={profile.preferredSubject}
              onChange={(e) => setProfile({ ...profile, preferredSubject: e.target.value })}
              className="h-10 border-[var(--alo-border)] bg-white text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-budget" className="text-xs font-semibold">Budget max (tuition)</Label>
            <Input
              id="cf-budget"
              placeholder="e.g. 20000"
              value={profile.budgetMax ?? ''}
              onChange={(e) => setProfile({ ...profile, budgetMax: parseNumber(e.target.value) })}
              className="h-10 border-[var(--alo-border)] bg-white text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-nat" className="text-xs font-semibold">Nationality</Label>
            <Input
              id="cf-nat"
              placeholder="e.g. Bangladeshi"
              value={profile.nationality}
              onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
              className="h-10 border-[var(--alo-border)] bg-white text-sm"
            />
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border-[var(--alo-border)] bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--alo-text-muted)]" />
            <Input
              placeholder="Search the live course catalogue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-[var(--alo-border)] bg-white pl-9"
              aria-label="Search courses"
            />
          </div>
          <Button onClick={() => void fetchCourses()} className="h-11 bg-[var(--alo-brand)] text-white">
            Search
          </Button>
        </div>
      </Card>

      {loadError && (
        <Card className="rounded-2xl border-2 border-amber-200 bg-white p-10 text-center">
          <AlertTriangle className="mx-auto mb-3 size-10 text-amber-500" />
          <p className="text-sm font-semibold text-[var(--alo-text)]">Course search unavailable</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-[var(--alo-text-muted)]">{loadError}</p>
          <p className="mx-auto mt-2 max-w-md text-[11px] text-[var(--alo-text-muted)]">
            No results are being shown because the catalogue could not be reached — this is not an
            empty result set.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="mr-1.5 size-3.5" />
            Try again
          </Button>
        </Card>
      )}

      {!loadError && loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-[var(--alo-border)] bg-white" />
          ))}
        </div>
      )}

      {!loadError && !loading && courses.length === 0 && (
        <Card className="rounded-2xl border-[var(--alo-border)] bg-white p-12 text-center">
          <Search className="mx-auto mb-3 size-12 text-[var(--alo-placeholder)]" />
          <p className="text-sm text-[var(--alo-body)]">
            No published courses match your current filters.
          </p>
          <p className="mx-auto mt-1 max-w-md text-[11px] text-[var(--alo-text-muted)]">
            Only published, verified courses with a public university are listed, so a course that is
            still being verified will not appear here.
          </p>
        </Card>
      )}

      {!loadError && !loading && courses.length > 0 && (
        <>
          <p className="text-sm text-[var(--alo-text-muted)]">
            {courses.length} course{courses.length === 1 ? '' : 's'} from the live catalogue
            {hasProfile ? ' · scored against your profile' : ' · enter your profile to see eligibility'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => {
              const c = course as Record<string, any>;
              const eligibility = c.eligibility as
                | { label: string; score: number; reasons: string[]; missing: string[] }
                | null;
              const matchScore = c.matchScore as number | null;
              const courseId = String(c.courseId ?? c.id ?? '');
              const intakes = Array.isArray(c.intakes) ? c.intakes : [];
              const scholarships = Array.isArray(c.scholarships) ? c.scholarships : [];

              return (
                <Card
                  key={courseId}
                  className="flex h-full flex-col justify-between rounded-2xl border-[var(--alo-border)] bg-white p-5 transition-all hover:border-[var(--alo-brand)] hover:shadow-md"
                >
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                      {eligibility ? (
                        <Badge className={`text-[11px] ${LABEL_STYLE[eligibility.label] ?? LABEL_STYLE['Missing Information']}`}>
                          {eligibility.label} — {eligibility.score}%
                        </Badge>
                      ) : (
                        <Badge className={`text-[11px] ${LABEL_STYLE['Missing Information']}`}>
                          Missing Information
                        </Badge>
                      )}
                      {matchScore !== null ? (
                        <Badge className="border-[var(--alo-border)] bg-[var(--alo-page)] text-[11px]">
                          Match {matchScore}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] text-[var(--alo-text-muted)]">
                          match needs profile
                        </Badge>
                      )}
                    </div>

                    <h3 className="mb-1 line-clamp-2 text-sm font-bold text-[var(--alo-text)]">
                      {String(c.courseTitle ?? c.name ?? 'Untitled course')}
                    </h3>
                    <p className="mb-2 flex items-center gap-1 text-xs text-[var(--alo-body)]">
                      <MapPin className="size-3" />
                      {String(c.university?.name ?? c.universityName ?? 'University not recorded')}
                      {c.country ? ` • ${String(c.country)}` : ''}
                    </p>

                    <div className="space-y-1 rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-[11px]">
                      {eligibility ? (
                        <>
                          <p>
                            <strong className="font-semibold">Eligibility:</strong>{' '}
                            {eligibility.reasons.slice(0, 2).join(' • ') || 'No reasons recorded'}
                          </p>
                          {eligibility.missing.length > 0 && (
                            <p className="text-amber-700">
                              <strong className="font-semibold">Missing:</strong>{' '}
                              {eligibility.missing.join(', ')}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[var(--alo-body)]">
                          <strong className="font-semibold">Eligibility:</strong> not calculated —
                          enter your qualification, GPA or English score above.
                        </p>
                      )}
                      <p>
                        <strong className="font-semibold">Tuition:</strong>{' '}
                        {c.currency ? `${String(c.currency)} ` : ''}
                        {c.tuitionFee != null && Number(c.tuitionFee) > 0
                          ? String(c.tuitionFee)
                          : 'not recorded'}{' '}
                        • <strong className="font-semibold">Scholarship:</strong>{' '}
                        {scholarships.length > 0 ? `${scholarships.length} available` : 'check with ALO'}{' '}
                        • <strong className="font-semibold">Intake:</strong>{' '}
                        {intakes[0]?.intakeMonth || 'not recorded'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Link href={`/student/course/${courseId}`} className="block">
                      <Button className="h-11 w-full bg-[var(--alo-brand)] text-xs font-bold text-white">
                        View course + eligibility
                      </Button>
                    </Link>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="h-9 border-[var(--alo-border)] text-[11px]">
                        <BookmarkPlus className="mr-1 size-3" />
                        Save
                      </Button>
                      <Link href="/student/compare">
                        <Button variant="outline" size="sm" className="h-9 w-full border-[var(--alo-border)] text-[11px]">
                          <GitCompare className="mr-1 size-3" />
                          Compare
                        </Button>
                      </Link>
                      <Link href={`/student/apply/${courseId}`}>
                        <Button variant="outline" size="sm" className="h-9 w-full border-[var(--alo-border)] text-[11px]">
                          <Send className="mr-1 size-3" />
                          Apply
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-[11px] text-[var(--alo-body)]">
            Eligibility and match scores are operational guidance calculated from the requirements
            recorded in ALO&apos;s catalogue and the profile you entered. They are not an admission
            decision, not a visa assessment, and not a guarantee. Final requirements are set by the
            university and confirmed by ALO before submission.
          </p>
        </>
      )}
    </div>
  );
}
