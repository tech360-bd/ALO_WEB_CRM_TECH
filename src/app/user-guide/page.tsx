import { ALO_CONTACT, ALO_PUBLIC_CONTACT_CTA, ALO_SOCIALS } from '@/lib/alo-site-info';
import { GraduationCap, Users, Building2, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = {
  title: 'User Guide | ALO Education',
  description: 'How to use ALO Education — student, partner, employee portals, enquiries, documents, applications, visa, and payments.',
  alternates: { canonical: 'https://aloeducation.com/user-guide' },
};

const guides = [
  { role: 'Student', href: '/student/login', icon: GraduationCap, steps: ['Submit an enquiry through the contact or consultation form', 'Use the portal and verification instructions provided for your account', 'Complete your profile and upload requested documents through the private student portal', 'Review published course information and confirm requirements with the relevant institution', 'Track available application and visa updates in your portal'] },
  { role: 'Partner', href: '/partner/login', icon: Users, steps: ['Sign in with the partner account assigned to you', 'Submit referrals using the partner portal', 'Review permitted application and document updates', 'Check commission records and supporting statements available to your account', 'Use the portal support options for questions'] },
  { role: 'Employee / Counselor', href: '/employee/login', icon: Building2, steps: ['Activate your employee account using the instructions issued by ALO', 'Review leads, assigned students, tasks, and alerts available within your scope', 'Record case updates in the appropriate CRM workflow', 'Store student documents in approved private storage and follow role-based access rules', 'Refer to HR modules only where your assigned permissions allow'] },
  { role: 'Admin / Super Admin', href: '/admin/login', icon: FileText, steps: ['Use the admin portal assigned to your account', 'Manage users, roles, permissions, and branch access within your authority', 'Review and approve catalogue, communication, and marketing records where permitted', 'Use audit, health, backup, and recovery tools according to deployment procedures', 'Never treat configured integrations as connected until provider status is verified'] },
];

export default function UserGuidePage() {
  return (
    <div className="min-h-screen bg-white pt-8 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Badge className="mb-4 border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">HELP</Badge>
        <h1 className="mb-2 text-3xl font-bold text-[var(--alo-text)]">User Guide</h1>
        <p className="mb-8 max-w-3xl text-sm text-[var(--alo-body)]">
          Choose the portal assigned to your account. For public enquiries, use <a href={ALO_PUBLIC_CONTACT_CTA.href} {...(ALO_CONTACT.hasWhatsApp ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="font-semibold text-[var(--alo-brand)] underline">{ALO_PUBLIC_CONTACT_CTA.label}</a>; provider configuration alone does not establish WhatsApp connectivity.
          {ALO_CONTACT.address && <> Office: {ALO_CONTACT.address}{ALO_CONTACT.mapsUrl && <> • <a href={ALO_CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline">Maps</a></>}</>}
        </p>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card key={guide.role} className="p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--alo-brand)] text-white"><Icon className="h-5 w-5" /></div>
                  <div><h2 className="font-bold text-[var(--alo-text)]">{guide.role}</h2><Link href={guide.href} className="text-xs text-[var(--alo-brand)] underline">{guide.href}</Link></div>
                </div>
                <ol className="space-y-2 text-sm text-[var(--alo-body)]">
                  {guide.steps.map((step, index) => <li key={index} className="flex gap-2"><span className="font-bold text-[var(--alo-brand)]">{index + 1}.</span><span>{step}</span></li>)}
                </ol>
              </Card>
            );
          })}
        </div>

        <Card className="space-y-5 bg-[var(--alo-page)] p-6">
          <h2 className="text-xl font-bold text-[var(--alo-text)]">Privacy, communication, and recovery</h2>
          <div className="space-y-2 text-sm text-[var(--alo-body)]">
            <p>Use the portal associated with your account; do not share another person’s credentials or documents.</p>
            <p>Submit only the information needed for your enquiry. Contact details alone do not authorize promotional messages.</p>
            <p>Follow the deployment’s documented backup and restore process. This guide does not certify that a live backup or recovery test has run.</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/book-consultation" className="inline-flex items-center justify-center rounded-xl bg-[var(--alo-cta)] px-5 py-2.5 text-sm font-bold text-black hover:brightness-110">Request Consultation</Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-[var(--alo-brand)] px-5 py-2.5 text-sm font-bold text-[var(--alo-brand)]">Contact Support</Link>
          </div>
        </Card>

        <p className="mt-6 text-xs text-[var(--alo-text-muted)]">
          Detailed portal guides: <Link href="/privacy-policy" className="underline">Privacy</Link> • <Link href="/communication-policy" className="underline">Communication</Link> • <Link href="/lead-data-usage-policy" className="underline">Lead Data</Link> • <a href={ALO_SOCIALS[0].href} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--alo-brand)]">ALO Education on Facebook</a>
        </p>
      </div>
    </div>
  );
}
