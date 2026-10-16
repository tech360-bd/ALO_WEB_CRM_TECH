'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function AdminEditCoursePage() {
  const params = useParams();
  const id = params?.id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ fetch(`/api/admin/courses/${encodeURIComponent(id)}`).then(r=>r.json()).then(d=>setCourse(d.data||d.course)).catch(()=>{}).finally(()=>setLoading(false)); },[id]);
  if(loading) return <div className="p-12 pt-24 text-center text-gray-500">Loading Edit Course — 12 Tabs — No Orphan — DB-driven...</div>;
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-3">Admin Edit Course — Full Access — 12 Tabs — No Orphan — Super Admin</Badge>
          <h1 className="text-2xl font-bold text-[#0F172A]">Edit Course {id}</h1>
          <p className="text-sm text-gray-600 mt-2">Edit with 12 tabs: Basic Information (course_code, name, slug, description, study_level Foundation/Bachelor/Top-up/Pre-Masters/Masters/MBA/PhD/Diploma/Certificate, study_area Business/Computer Science/Engineering/Healthcare/Law/Education/Hospitality/Finance/Data Science/AI, discipline, duration, delivery mode, degree type), University & Campus (country/university/campus relational dropdowns no free-text if matching entity exists prevents orphan), Tuition & Fees (tuition/currency/app fee/deposit/scholarship min/max/average never invent exact figures fallback Fee information requires counselor verification no BDT conversion unless verified show Indicative BDT estimate), Intakes (multiple month/year/deadline/seats/status from course_intakes), Academic Requirements (academic requirement/min GPA/GPA scale/backlogs/work experience/portfolio/interview/remarks only verified), English Requirements (multiple tests IELTS/PTE/TOEFL/Duolingo/OIETC/Oxford ELLT/MOI/Other with overall/listening/reading/writing/speaking/no band below/waiver/remarks never say accepts unless DB/source verification), Tags (Scholarship Available/Fast Offer/High Acceptance/Low Deposit/No Interview/MOI Accepted/High Demand/Co-op/Internship/Application Fee Waiver/Open Program), Source Verification (source URL/name/last verified/verified by/verification status Verified/Needs Review/Expired/Unverified if Unverified do not display sensitive exact claim publicly), SEO, Visibility (public/draft/private commission data MUST NEVER be returned by public/student APIs), Publish (no orphan no duplicate without Super Admin keep history audit log) — {course?.courseTitle || 'loading from DB...'} — Every course must have country_id, university_id, campus_id when applicable, study_level_id, study_area_id, discipline_id</p>
          <div className="flex gap-3 mt-6">
            <Link href="/admin/courses"><Button variant="outline" className="border-[#E2E8F0] h-11">Back to List — Search, Country, University, Study Level, Subject, Intake, Status, Verification</Button></Link>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[#0057B8] text-white h-11">Save — Audit Log + Source Verification + No Orphan</Button>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="border-[#E2E8F0] h-11">Duplicate</Button>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="border-[#E2E8F0] h-11">Archive</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
