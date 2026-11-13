/**
 * Portal footer context — the single shape both the API and the footer
 * component agree on.
 *
 * `partner` is null for ALO students, ALO employees and every signed-out
 * visitor. It is populated only when the signed-in person belongs to a B2B
 * partner tenant, which is exactly when the partner footer block is added
 * below the general ALO footer.
 */

import type { PartnerBrandingView } from '@/lib/partner/branding';

export type PortalFooterScope = 'student' | 'employee' | 'partner' | 'counselor' | 'guest';

export interface PortalFooterContext {
  scope: PortalFooterScope;
  partner: PartnerBrandingView | null;
}

/**
 * Whether the partner block should be rendered. Both conditions are required:
 * the partner enabled it, and they provided something identifiable — a name or
 * a logo. Anything else would render an empty, unstyled strip.
 */
export function shouldShowPartnerFooter(partner: PartnerBrandingView | null | undefined): partner is PartnerBrandingView {
  if (!partner) return false;
  if (!partner.showInFooter) return false;
  return Boolean(partner.displayName?.trim() || partner.logoUrl);
}
