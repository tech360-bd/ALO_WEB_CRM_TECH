"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Admin layout — auth-guards every /admin/* route (except /admin/login).
 *
 * Strategy: a lightweight session probe via /api/v1/auth/session. If
 * unauthenticated AND not on /admin/login, redirect to /admin/login.
 * The actual data endpoints also enforce authz server-side, so this
 * probe is just for UX (avoid flashing protected content).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [checked, setChecked] = useState(isLogin); // skip check on login page

  useEffect(() => {
    if (isLogin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/auth/session", { credentials: "include" });
        if (!res.ok) throw new Error("no session");
        const env = await res.json();
        if (!env?.data?.user) throw new Error("no session");
      } catch {
        if (!cancelled) router.replace("/admin/login");
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isLogin, router]);

  // Login page renders without the shell
  if (isLogin) return <>{children}</>;

  // Avoid flash of unauthenticated content while checking
  if (!checked) return null;

  return <AdminShell>{children}</AdminShell>;
}
