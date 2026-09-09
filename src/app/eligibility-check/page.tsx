'use client';

import React, { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertTriangle, ArrowRight, Sparkles, BookOpen, GraduationCap } from 'lucide-react';
import { evaluateCourseEligibility, StudentProfileInput } from '@/lib/eligibility-engine';

export default function EligibilityCheckPageRoute() {
  const [profile, setProfile] = React.useState<StudentProfileInput>({
    highestQualification: 'Bachelors',
    gpaOrPercentage: 3.2,
    englishTestType: 'IELTS',
    englishOverall: 6.5,
    studyGapYears: 1,
    maxBudgetUsd: 30000,
  });

  const [evaluated, setEvaluated] = React.useState(false);

  const sampleCourse = {
    courseId: 'CRS-0001',
    courseTitle: 'MSc Data Science & AI',
    universityName: 'University of Oxford',
    country: 'United Kingdom',
    studyLevel: 'Master',
    minGpaOrPercentage: 3.3,
    minIeltsOverall: 7.0,
    maxAllowedStudyGapYears: 2,
    tuitionFeeUsd: 41000,
    availableToInternational: true,
  };

  const result = evaluateCourseEligibility(profile, sampleCourse);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="flex-1 pt-20 pb-16 max-w-5xl mx-auto px-4 w-full">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-4 h-4" /> AI & Rule-Based Student Eligibility Engine
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Check Your University Eligibility</h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm">
            Enter your academic GPA, IELTS/PTE scores, study gap, and tuition budget to evaluate course entry criteria instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" /> Your Academic & Score Profile
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <Label>Highest Qualification</Label>
                <Input
                  value={profile.highestQualification}
                  onChange={(e) => setProfile({ ...profile, highestQualification: e.target.value })}
                  className="h-9 mt-1 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>GPA or Percentage</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={profile.gpaOrPercentage}
                    onChange={(e) => setProfile({ ...profile, gpaOrPercentage: parseFloat(e.target.value) || 0 })}
                    className="h-9 mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label>English Test Score</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={profile.englishOverall}
                    onChange={(e) => setProfile({ ...profile, englishOverall: parseFloat(e.target.value) || 0 })}
                    className="h-9 mt-1 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Study Gap (Years)</Label>
                  <Input
                    type="number"
                    value={profile.studyGapYears}
                    onChange={(e) => setProfile({ ...profile, studyGapYears: parseInt(e.target.value) || 0 })}
                    className="h-9 mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label>Max Budget (USD/yr)</Label>
                  <Input
                    type="number"
                    value={profile.maxBudgetUsd}
                    onChange={(e) => setProfile({ ...profile, maxBudgetUsd: parseInt(e.target.value) || 0 })}
                    className="h-9 mt-1 text-xs"
                  />
                </div>
              </div>
              <Button onClick={() => setEvaluated(true)} className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-xs mt-2">
                Evaluate Eligibility Match <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> Evaluation Target Course
              </h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {sampleCourse.universityName}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900 text-sm">{sampleCourse.courseTitle}</p>
              <p className="text-slate-600">Location: {sampleCourse.country} • Tuition: USD ${sampleCourse.tuitionFeeUsd.toLocaleString()}/yr</p>
              <p className="text-slate-600">Min Req: GPA {sampleCourse.minGpaOrPercentage} | IELTS {sampleCourse.minIeltsOverall}</p>
            </div>

            <div className="space-y-3 text-xs pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="font-semibold text-blue-900">Result Category:</span>
                <span className="font-bold text-blue-700 uppercase">{result.category} ({result.matchScorePercent}% Match)</span>
              </div>

              <p className="text-slate-600 italic">{result.summaryReason}</p>

              <div className="space-y-2">
                <p className="font-semibold text-slate-800">Requirement Breakdown:</p>
                {result.comparisonTable.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-100">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-slate-900">{item.requirementName}: </span>
                      <span className="text-slate-600">{item.notes}</span>
                    </div>
                  </div>
                ))}
              </div>

              {result.improvementPlan.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] space-y-1">
                  <p className="font-bold text-amber-900">Eligibility Improvement Plan:</p>
                  <ul className="list-disc pl-4 text-amber-800 space-y-1">
                    {result.improvementPlan.map((plan, idx) => (
                      <li key={idx}>{plan}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>

  );
}
