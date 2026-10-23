import { Shield, MessageCircle, Mail, Phone, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Communication Policy | ALO Education',
  description: 'How ALO Education contacts you via WhatsApp, SMS, Email and phone — consent, opt-out, SLA 30/20/10, after-hours 18:00-10:00 Asia/Dhaka.',
  alternates: { canonical: 'https://aloeducation.com/communication-policy' },
};

export default function CommunicationPolicyPage() {
  return (
    <div className="min-h-screen bg-white pt-8 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border border-[var(--alo-border)] mb-4">LEGAL</Badge>
        <h1 className="text-3xl font-bold text-[var(--alo-text)] mb-2">Communication Policy</h1>
        <p className="text-sm text-[var(--alo-text-muted)] mb-8">Last updated: 15 Sep 2026 • Effective for https://aloeducation.com • Contact: info@aloeducation.com / 01805020101</p>

        <Card className="p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="font-bold text-[var(--alo-text)] flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[var(--alo-brand)]" /> Channels</h2>
            <p className="text-sm text-[var(--alo-body)] leading-relaxed mt-2">We contact you only on channels you consented to: <strong>WhatsApp (01805020100 / 8801805020100)</strong>, SMS, Email (noreply@aloeducation.com), Phone, Website chat, Portal messages. Social (Facebook/Instagram) only if you messaged our official page <a href="https://www.facebook.com/aloeducation" className="text-[var(--alo-brand)] underline">facebook.com/aloeducation</a>.</p>
          </section>
          <section>
            <h2 className="font-bold text-[var(--alo-text)] flex items-center gap-2"><Shield className="h-4 w-4 text-[var(--alo-brand)]" /> Consent & Opt-out</h2>
            <p className="text-sm text-[var(--alo-body)] leading-relaxed mt-2">Consent is captured at lead creation (LeadForm, WhatsApp webhook, Facebook lead). You can opt-out any time: reply <strong>STOP</strong> on WhatsApp/SMS, click Unsubscribe in email, or toggle in Student/Partner portal → Notifications. Preferences are stored in <code>CommunicationPreference</code> (whatsappAllowed/smsAllowed/emailAllowed/phoneAllowed/marketingAllowed). Opt-out is honored within 24 hours; transactional messages (CAS/visa/deadline) may still be sent where required by law.</p>
          </section>
          <section>
            <h2 className="font-bold text-[var(--alo-text)] flex items-center gap-2"><Clock className="h-4 w-4 text-[var(--alo-brand)]" /> SLA & After-hours</h2>
            <p className="text-sm text-[var(--alo-body)] leading-relaxed mt-2">Counselor target <strong>30 minutes</strong> → Branch Manager escalation after 30m → CEO after +20m → Urgent +10m. Office hours Asia/Dhaka. <strong>After-hours 18:00–10:00</strong>: you receive one auto-acknowledgement, inquiry is queued for next working period with original time + SLA metadata preserved, no duplicate replies. See <code>CommunicationSlaRule</code> & <code>sla-engine.ts</code>.</p>
          </section>
          <section>
            <h2 className="font-bold text-[var(--alo-text)] flex items-center gap-2"><Mail className="h-4 w-4 text-[var(--alo-brand)]" /> Templates & AI drafts</h2>
            <p className="text-sm text-[var(--alo-body)] leading-relaxed mt-2">WhatsApp/SMS/Email templates are versioned in <code>CommunicationTemplate</code> and require approval if <code>requiresApproval=true</code>. AI suggestions (AI Interview, SOP, reply drafts) are <strong>AI-draft → human-approval → send</strong> (<code>AiReplyDraft</code>, <code>CommunicationDraft</code> with <code>riskLevel</code>). Broadcasting needs approval and honors opt-out &gt;100 gate.</p>
          </section>
          <section>
            <h2 className="font-bold text-[var(--alo-text)] flex items-center gap-2"><Phone className="h-4 w-4 text-[var(--alo-brand)]" /> Calls, Recording & B2B Privacy</h2>
            <p className="text-sm text-[var(--alo-body)] leading-relaxed mt-2">Calls may be recorded with consent (see <code>CallLog</code> / <code>PhoneCallLog</code>). Recordings stored in private pool outside <code>public_html</code> with audit <code>FileEvent</code>. B2B partner students: partner sees only own students/applications/messages/commissions (server-side <code>partner_id</code> filter) — isolation tested.</p>
          </section>
          <p className="text-xs text-[var(--alo-text-muted)] pt-4 border-t">Questions: <a href="/contact" className="text-[var(--alo-brand)] underline">Contact us</a> • See also Privacy Policy, Lead Data Usage Policy.</p>
        </Card>
      </div>
    </div>
  );
}
