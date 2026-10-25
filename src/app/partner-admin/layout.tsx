import PortalFooter from '@/components/portals/PortalFooter';

/**
 * Partner-admin routes (/partner-admin/*) are real Next.js pages rather than
 * SPA views, so they never had the portal footer. The public footer is
 * suppressed on these routes by public-chrome-policy.ts, which meant these
 * pages had NO footer at all.
 *
 * This layout adds exactly one footer per page: the general ALO footer, plus
 * the partner's own branded block (resolved server-side from the session).
 */
export default function PartnerAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <PortalFooter scope="partner" />
    </div>
  );
}
