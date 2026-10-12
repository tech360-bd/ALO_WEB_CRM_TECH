/**
 * AloCtaLink — public-site call-to-action link built on the ALO button
 * design system (src/components/ui/button.tsx: 12 variants × 7 sizes,
 * ALO brand palette).
 *
 * Public pages previously hand-rolled raw <Link> classNames for CTAs,
 * which drifted from the design system. This component is the single
 * public CTA: same variants, same sizes, consistent focus rings, with an
 * optional trailing arrow. Variants map to the design system:
 *   cta (orange, primary action) · brand (blue) · outline (secondary)
 *   ghost · link — sizes xs…xl (xl = 52px public CTA height).
 */

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ButtonVariant, ButtonSize } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AloCtaLink({
  href,
  children,
  variant = 'default',
  size = 'xl',
  className,
  showArrow = true,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  showArrow?: boolean;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'children' | 'className'>) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn('font-bold shadow-lg transition-shadow hover:shadow-xl', className)}
    >
      <Link href={href} {...props}>
        {children}
        {showArrow ? <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" /> : null}
      </Link>
    </Button>
  );
}

export default AloCtaLink;
