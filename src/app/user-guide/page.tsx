import { BookOpen, GraduationCap, Users, Building2, Phone, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = {
  title: 'User Guide | ALO Education',
  description: 'How to use ALO Education — student, partner, employee portals, lead journey, documents, applications, visa, payments.',
  alternates: { canonical: 'https://aloeducation.com/user-guide' },
};

const guides = [
  { role: 'Student', href: '/student/login', icon: GraduationCap, steps: ['Create lead via Book Free Consultation or WhatsApp 01805020100', 'Verify OTP, get AE-YYYY000001 Student ID', 'Complete profile (personal, education, passport, English test)', 'Shortlist courses via Course Finder', 'Upload documents (private pool)', 'Track Application → Offer → Deposit → CAS/I-20 → Visa → Enrolled in Timeline'] },
  { role: 'Partner', href: '/partner/login', icon: Users, steps: ['Register → AEP-YYYY0000', 'Refer student → partner_referral', 'Track Applications & document status', 'View Commission claims/statements (own only)', 'Message & support'] },
  { role: 'Employee / Counselor', href: '/employee/login', icon: Building2, steps: ['Activate via email link (ALO-EMP-YYYY0001)', 'Dashboard: leads, students, tasks, SLA 30/20/10', 'Lead → Student → Application → Visa pipeline', 'Upload private docs, internal notes (student never sees)', 'Attendance/Leave/Payroll (final only)'] },
  { role: 'Admin / Super Admin', href: '/admin/login', icon: FileText, steps: ['Executive dashboard, branch overview', 'Manage users/roles/permissions (17+57 perms)', 'Approve university data, marketing, broadcasts', 'Audit logs, login history, health, cron, backup/restore', 'Environment status'] },
];

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-white pt-8 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Badge className="bg-blue-50 text-[#0B5ED7] border border-blue-100 mb-4">HELP</Badge>
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">User Guide</h1>
        <p className="text-sm text-slate-600 mb-8 max-w-3xl">Choose your portal. Every feature is permission-controlled and audit-logged. Support 24/7 via AI Agent, WhatsApp AI <strong>01805020100</strong>, or <a href="https://www.facebook.com/aloeducation" className="text-[#0B5ED7] underline">Facebook</a> • Office: Barek Mansion-02, Panthapath • <a href="https://maps.app.goo.gl/t4w8dRNfH7U4BMBR8" className="text-[#0B5ED7] underline">Maps</a></p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {guides.map(g => {
            const Icon = g.icon;
            return (
              <Card key={g.role} className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-[#0B5ED7] text-white flex items-center justify-center"><Icon className="h-5 w-5" /></div>
                  <div><h2 className="font-bold text-[#0F172A]">{g.role}</h2><Link href={g.href} className="text-xs text-[#0B5ED7] underline">{g.href}</Link></div>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-700">
                  {g.steps.map(s => <li key={s}>{s}</li>)}
                </ol>
              </Card>
            );
          })}
        </div>

        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="font-bold text-[#0F172A] flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#0B5ED7]" /> Quick Tips</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
            <li><strong>Forgot password?</strong> Use Forgot password → OTP/email reset → session regenerated, audit logged.</li>
            <li><strong>Notifications:</strong> In-app + Email + WhatsApp — read/unread, preferences, retry, audit.</li>
            <li><strong>Documents:</strong> Allowed: pdf,jpg,jpeg,png,doc,docx (20 MB), random filenames, private download controller — no predictable public URLs.</li>
            <li><strong>Health:</strong> <code>/health</code> public (no secrets) + <code>/api/health/deep</code> (Super Admin) for DB/storage/cron.</li>
            <li><strong>Backup:</strong> Daily 01:00 via cron — database.sql.gz + application.tar.gz + uploads.tar.gz + manifest + SHA256, outside public_html.</li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/book-consultation" className="inline-flex items-center justify-center bg-[#F97316] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110">Book Free Consultation</Link>
            <Link href="/contact" className="inline-flex items-center justify-center border border-[#0B5ED7] text-[#0B5ED7] px-5 py-2.5 rounded-xl text-sm font-bold">Contact Support</Link>
          </div>
        </Card>

        <p className="text-xs text-slate-500 mt-6">Detailed portal guides: <Link href="/privacy-policy" className="underline">Privacy</Link> • <Link href="/communication-policy" className="underline">Communication</Link> • <Link href="/lead-data-usage-policy" className="underline">Lead Data</Link> • Need help? <a href="https://wa.me/8801805020100" className="text-[#25D366] font-bold">WhatsApp 01805020100</a></p>
      </div>
    </div>
  );
}
