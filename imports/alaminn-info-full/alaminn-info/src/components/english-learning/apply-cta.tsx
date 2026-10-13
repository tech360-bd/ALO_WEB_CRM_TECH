"use client";

/**
 * ApplyCta — convenience wrapper around ReferralCta pre-configured for
 * course-package applications. Identical UX flow, simpler call site.
 */
import { ReferralCta, type ReferralCtaProps } from "./referral-cta";

export type ApplyCtaProps = Omit<ReferralCtaProps, "referralType">;

export function ApplyCta(props: ApplyCtaProps) {
  return <ReferralCta {...props} referralType="course-package" />;
}
