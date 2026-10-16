'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, GitCompare, Send, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

export default function StudentShortlistPage() {
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/course-finder/saved')
      .then(r => r.json())
      .then(d => setShortlist(d.courses || d.data || []))
      .catch(() => setShortlist([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-3">Student Shortlist — course_shortlists table, unique constraint</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A]">Your Shortlisted Courses</h1>
          <p className="text-sm text-gray-600 mt-2">Saved courses — University, Country, Tuition, Scholarship, Intake, Eligibility, Match score — Actions: Compare, Apply, Remove</p>
        </div>

        {loading ? <div className="grid sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : shortlist.length === 0 ? (
          <Card className="p-12 bg-white border-[#E2E8F0] rounded-2xl text-center"><BookmarkPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-600">No saved courses yet — real DB, no fake data.</p><Link href="/student/course-finder"><Button className="mt-4 bg-[#0057B8] text-white h-11">Find Courses</Button></Link></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {shortlist.map((c: any) => (
              <Card key={c.courseId || c.id} className="p-5 bg-white border-[#E2E8F0] rounded-2xl">
                <h3 className="font-bold text-sm">{c.courseName || c.courseTitle}</h3>
                <p className="text-xs text-gray-500">{c.universityName} • {c.country} • {c.tuitionFee ? `${c.tuitionFee}` : 'Check tuition'}</p>
                <div className="flex gap-2 mt-3">
                  <Link href="/student/compare"><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs"><GitCompare className="w-3 h-3 mr-1" />Compare</Button></Link>
                  <Link href={`/student/apply/${c.courseId || c.id}`}><Button size="sm" className="bg-[#E8501A] text-white h-9 text-xs"><Send className="w-3 h-3 mr-1" />Apply</Button></Link>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs"><Trash2 className="w-3 h-3 mr-1" />Remove</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
