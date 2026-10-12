'use client';

import StudentVisaReadiness from '@/components/student/StudentVisaReadiness';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** Legacy portal view now shares the student-scoped, database-backed visa view. */
export default function StudentVisaCenter() {
  return (
    <div className="space-y-4">
      <StudentVisaReadiness />
      <div className="flex justify-end">
        <Button asChild variant="outline" className="border-slate-200 bg-white">
          <Link href="/student/visa-interview-practice">Open visa interview practice</Link>
        </Button>
      </div>
    </div>
  );
}
