import { permanentRedirect } from 'next/navigation';

// Legacy alias retained for inbound links. /eligibility-check is the canonical
// route used by the navbar, homepage, sitemap and related public content.
export default function LegacyEligibilityCheckerPage() {
  permanentRedirect('/eligibility-check');
}
