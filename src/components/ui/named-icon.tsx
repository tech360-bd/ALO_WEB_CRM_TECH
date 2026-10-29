"use client";

import * as React from "react";
import * as LucideIcons from "lucide-react";

/**
 * The single canonical Lucide-by-name resolver (Master design system §10).
 *
 * Several surfaces — the ALO component kit, the super-admin command centers,
 * the public views — address icons by string name (module maps, category
 * maps, CMS records). Before this module existed there were two byte-identical
 * copies of the resolver (`alo/shared.tsx` and `alo/ui.tsx`) plus a number of
 * ad-hoc local copies, so the same glyph could render at different stroke
 * weights or fall back differently on a typo.
 *
 * One implementation, one fallback (`Circle`), imported everywhere. Emoji are
 * never used as the icon system: they remain content only (country flags).
 */
export type NamedIconProps = {
  /** Lucide export name, e.g. "GraduationCap". Unknown names fall back to Circle. */
  name: string;
  className?: string;
  /** Accessible label; when omitted the glyph is decorative (aria-hidden). */
  label?: string;
};

export function NamedIcon({ name, className, label }: NamedIconProps) {
  const registry = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ className?: string }> | undefined
  >;
  const Cmp = registry[name] ?? LucideIcons.Circle;
  if (label) return <Cmp className={className} aria-label={label} role="img" />;
  return <Cmp className={className} aria-hidden="true" />;
}

export default NamedIcon;
