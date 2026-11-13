import PartnerBrandingPanel from '@/components/partner/PartnerBrandingPanel';

export const metadata = {
  title: 'Footer Branding | ALO Education Partner Portal',
  description: 'Customise the logo and colour scheme your students see in their portal footer.',
};

/**
 * /partner-admin/branding
 *
 * Partner Super Admin surface for the B2B footer branding (logo + colours).
 * The ALO footer itself is not editable here — only the partner block that is
 * added beneath it for that partner's students.
 */
export default function PartnerBrandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 lg:p-6">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-extrabold text-alo-text">Footer branding</h1>
        <p className="text-[13px] text-alo-text-secondary">
          Your logo and colours are added to the footer your students see when they sign in to the student
          portal. ALO&apos;s own footer always stays visible above it.
        </p>
      </header>
      <PartnerBrandingPanel />
    </div>
  );
}
