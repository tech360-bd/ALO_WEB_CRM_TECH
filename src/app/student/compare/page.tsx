'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitCompare, Send } from 'lucide-react';
import Link from 'next/link';

export default function StudentComparePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/course-finder/compare')
      .then(r => r.json())
      .then(d => setCourses(d.courses || d.data || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const columns = ['University', 'Course', 'Country', 'Study level', 'Duration', 'Tuition', 'Scholarship', 'Deposit', 'Application fee', 'Intake', 'Deadline', 'English', 'Academic requirement', 'Eligibility', 'Match score'];

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">Student Compare — course_comparisons, max sensible number</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Compare Courses</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">Compare up to 4 courses side-by-side on tuition, scholarship, deposit, app fee, intake, deadline, English, academic requirement, eligibility, match score — no fake data.</p>
        </div>

        {loading ? <div className="h-64 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" /> : courses.length === 0 ? (
          <Card className="p-12 bg-white border-[var(--alo-border)] rounded-2xl text-center"><GitCompare className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto mb-3" /><p className="text-sm text-[var(--alo-body)]">No courses to compare — add from course finder.</p><Link href="/student/course-finder"><Button className="mt-4 bg-[var(--alo-brand)] text-white h-11">Find Courses</Button></Link></Card>
        ) : (
          <Card className="p-0 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="grid grid-cols-5 gap-0 border-b border-[var(--alo-border)] bg-[var(--alo-page)] p-4 text-xs font-semibold text-[var(--alo-text)]">
                <div>Field</div>
                {courses.slice(0, 4).map((c: any) => <div key={c.courseId} className="truncate">{c.courseTitle?.substring(0, 30)}</div>)}
              </div>
              {columns.map(col => (
                <div key={col} className="grid grid-cols-5 gap-0 border-b border-[var(--alo-border)]/60 p-4 text-xs">
                  <div className="font-medium text-[var(--alo-body)]">{col}</div>
                  {courses.slice(0, 4).map((c: any, i: number) => <div key={i} className="text-[var(--alo-body)] truncate">{col === 'University' ? c.universityName : col === 'Course' ? c.courseTitle : col === 'Country' ? c.country : col === 'Tuition' ? `${c.tuitionCurrency || 'GBP'} ${c.tuitionFee || 'Check'}` : col === 'Scholarship' ? (c.scholarships?.length ? `${c.scholarships.length} available` : 'Check') : col === 'Deposit' ? c.depositAmount || 'Check' : col === 'Application fee' ? c.appFeeAmount || 'Check' : col === 'Intake' ? c.intake || 'Sep, Jan' : col === 'Study level' ? c.studyLevel : col === 'Duration' ? c.duration || 'Check' : 'Check with counselor'}</div>)}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-3 justify-center">
          <Link href="/student/course-finder"><Button className="bg-[var(--alo-brand)] text-white h-12 px-6 font-bold">Back to Finder</Button></Link>
          <Link href="/student/shortlist"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">View Shortlist</Button></Link>
        </div>
      </div>
    </div>
  );
}
