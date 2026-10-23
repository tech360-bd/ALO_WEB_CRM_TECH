import { Database, Shield, UserCheck, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Lead Data Usage Policy | ALO Education',
  description: 'How ALO Education collects, uses, stores and deletes lead data — lawful basis, retention, your rights, AE-YYYY000001 lifecycle.',
  alternates: { canonical: 'https://aloeducation.com/lead-data-usage-policy' },
};

export default function LeadDataUsagePolicyPage() {
  return (
    <div className="min-h-screen bg-white pt-8 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Badge className="bg-orange-50 text-[#E8501A] border border-orange-100 mb-4">LEGAL</Badge>
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Lead Data Usage Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: 15 Sep 2026 • Applies to all lead capture (website, WhatsApp 01805020100, Facebook, events)</p>

        <Card className="p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2"><Database className="h-4 w-4 text-[#0057B8]" /> What we collect</h2>
            <p className="text-sm text-slate-700 leading-relaxed mt-2"><code>Lead.leadId = AE-YYYY000001</code> + name, phone, email, preferredCountry/Course/Level/Intake, budget, englishTest, cgpa, source/sourceDetail, utm, notes, rawSubmission. On WhatsApp/Facebook we also store matched <code>LeadOutreach</code> + <code>CommunicationThread</code>. Minimal data principle — only fields needed for counseling.</p>
          </section>
          <section>
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2"><Shield className="h-4 w-4 text-[#0057B8]" /> Lawful basis & purpose</h2>
            <p className="text-sm text-slate-700 leading-relaxed mt-2">Consent (you submitted form/messaged us) + Legitimate interest (provide requested counseling). Purposes: contact attempt (3/7/14/21/25/30 day follow-ups), counselor assignment, course shortlisting, application/visa processing, analytics. No selling to third parties. B2B TYPE1 inbound: partner provides student — visibility follows privacy settings; TYPE2 outbound: ALO submits with attribution.</p>
          </section>
          <section>
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2"><UserCheck className="h-4 w-4 text-[#0057B8]" /> Lifecycle & retention</h2>
            <p className="text-sm text-slate-700 leading-relaxed mt-2"><strong>New Lead → Contact Attempted → Contacted → Consultation Booked/Completed → Qualified → Student Profile Created → ... → Enrolled → Closed</strong> (25 stages). Retention: active leads 24 months, closed 7 years for audit/tax, then anonymized. Backups encrypted, private pools outside <code>public_html</code> (see <code>StoragePool</code>).</p>
          </section>
          <section>
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2"><Clock className="h-4 w-4 text-[#0057B8]" /> Your rights</h2>
            <p className="text-sm text-slate-700 leading-relaxed mt-2">Access, correction, deletion, export, withdraw consent. Email <a href="mailto:info@aloeducation.com" className="text-[#0057B8] underline">info@aloeducation.com</a> with Student/Lead ID. Deletion uses soft-delete + <code>HrmAuditLog</code> + <code>AloAuditLog</code>. Response within 30 days. Personal data access is logged (<code>SensitiveDataRevealLog</code>).</p>
          </section>
          <p className="text-xs text-slate-500 pt-4 border-t">See also Privacy Policy & Communication Policy • DPO: info@aloeducation.com • Barek Mansion-02, Panthapath, Dhaka</p>
        </Card>
      </div>
    </div>
  );
}
