'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import { isPublicChromeRoute } from './public-chrome-policy';

// ─── CMS-managed announcements & banners (Virtual Editor) ─────
// Super Admins publish announcements (dismissible info bar) and
// banners (persistent strip) through /admin/website-cms. Nothing
// renders until an item is published — no placeholder content.
interface PublicAnnouncement {
  id: string;
  label: string;
  data: { message?: string; href?: string; level?: string };
}

function CmsAnnouncements() {
  const [items, setItems] = React.useState<PublicAnnouncement[]>([]);
  const [dismissed, setDismissed] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/website/cms-content?type=announcement')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.success || !Array.isArray(j.items)) return;
        setItems(j.items as PublicAnnouncement[]);
      })
      .catch(() => {/* announcements are optional */ });
    return () => { cancelled = true; };
  }, []);

  const visible = items.filter((a) => !dismissed[a.id] && (a.data?.message || a.label));
  if (visible.length === 0) return null;
  const top = visible[0];
  const level = top.data?.level === 'urgent' ? 'error' : top.data?.level === 'warning' ? 'warning' : 'info';
  const styles: Record<string, string> = {
    info: 'bg-[#0066CC] text-white',
    warning: 'bg-amber-500 text-white',
    error: 'bg-red-600 text-white',
  };
  const message = top.data?.message || top.label;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${styles[level]} text-xs sm:text-sm font-medium px-4 py-2 flex items-center justify-center gap-3`}
    >
      {top.data?.href ? (
        <Link href={top.data.href} className="underline underline-offset-2 hover:opacity-90">
          {message}
        </Link>
      ) : (
        <span>{message}</span>
      )}
      <button
        type="button"
        onClick={() => setDismissed((d) => ({ ...d, [top.id]: true }))}
        aria-label="Dismiss announcement"
        className="ml-2 rounded-full hover:bg-white/20 leading-none px-2 py-0.5"
      >
        ×
      </button>
    </div>
  );
}

function CmsBanner() {
  const [banner, setBanner] = React.useState<PublicAnnouncement | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/website/cms-content?type=banner')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.success || !Array.isArray(j.items) || j.items.length === 0) return;
        setBanner(j.items[0] as PublicAnnouncement);
      })
      .catch(() => {/* banners are optional */ });
    return () => { cancelled = true; };
  }, []);
  if (!banner) return null;
  const message = banner.data?.message || banner.label;
  return (
    <div className="bg-[#F37021] text-black text-xs sm:text-sm font-semibold px-4 py-1.5 text-center">
      {banner.data?.href ? (
        <Link href={banner.data.href} className="hover:underline">{message}</Link>
      ) : (
        message
      )}
    </div>
  );
}

export default function PublicLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = usePortalStore((s) => s.isAuthenticated);
  const pathname = usePathname();
  // One navbar and one footer for every public page. Login, registration,
  // reset and every authenticated portal route render standalone: the public
  // chrome is suppressed by route (see public-chrome-policy.ts) and by session.
  const showPublicChrome = !isAuthenticated && isPublicChromeRoute(pathname);
  return (
    <>
      {showPublicChrome && <CmsAnnouncements />}
      {showPublicChrome && <PublicNavbar />}
      {children}
      {showPublicChrome && <PublicFooter />}
      {showPublicChrome && <CmsBanner />}
    </>
  );
}
