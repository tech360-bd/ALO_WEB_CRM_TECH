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
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">Student Shortlist — course_shortlists table, unique constraint</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Your Shortlisted Courses</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">Saved courses — University, Country, Tuition, Scholarship, Intake, Eligibility, Match score — Actions: Compare, Apply, Remove</p>
        </div>

        {loading ? <div className="grid sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" />)}</div> : shortlist.length === 0 ? (
          <Card className="p-12 bg-white border-[var(--alo-border)] rounded-2xl text-center"><BookmarkPlus className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto mb-3" /><p className="text-sm text-[var(--alo-body)]">No saved courses yet.</p><Link href="/student/course-finder"><Button className="mt-4 bg-[var(--alo-brand)] text-white h-11">Find Courses</Button></Link></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {shortlist.map((c: any) => (
              <Card key={c.courseId || c.id} className="p-5 bg-white border-[var(--alo-border)] rounded-2xl">
                <h3 className="font-bold text-sm">{c.courseName || c.courseTitle}</h3>
                <p className="text-xs text-[var(--alo-text-muted)]">{c.universityName} • {c.country} • {c.tuitionFee ? `${c.tuitionFee}` : 'Check tuition'}</p>
                <div className="flex gap-2 mt-3">
                  <Link href="/student/compare"><Button size="sm" variant="outline" className="border-[var(--alo-border)] h-9 text-xs"><GitCompare className="w-3 h-3 mr-1" />Compare</Button></Link>
                  <Link href={`/student/apply/${c.courseId || c.id}`}><Button size="sm" className="bg-[var(--alo-cta)] text-black h-9 text-xs"><Send className="w-3 h-3 mr-1" />Apply</Button></Link>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="border-[var(--alo-border)] h-9 text-xs"><Trash2 className="w-3 h-3 mr-1" />Remove</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
