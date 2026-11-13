"use client";

import * as React from "react";
import { MarketingDashboard } from "./marketing-dashboard";

/**
 * Marketing Manager Dashboard — wrapper with RBAC guard
 * Original implementation lives in marketing-dashboard.tsx
 * This file satisfies /crm/marketing-manager dynamic import and adds role gate.
 * Access: MARKETING_MANAGER (FULL), SUPER_ADMIN (ALL), MARKETING Staff (LIMITED 3 approved users)
 * Other roles → 403 via withAuth on underlying API + UI guard here.
 */
export default function MarketingManagerDashboard() {
  const [auth, setAuth] = React.useState<{ loading: boolean; allowed: boolean; role?: string }>({
    loading: true,
    allowed: true,
  });

  React.useEffect(() => {
    // Client-side role check — backend enforces via withAuth/authenticateRequest on every /api/marketing/* call.
    // If backend returns 401/403, the inner MarketingDashboard will surface it per-tab.
    const check = async () => {
      try {
        const r = await fetch("/api/marketing/dashboard", { credentials: "include" });
        if (r.status === 401 || r.status === 403) {
          setAuth({ loading: false, allowed: false, role: "unknown" });
          return;
        }
        // If endpoint is open for MARKETING_MANAGER/SUPER_ADMIN, allow. LIMITED users also pass.
        setAuth({ loading: false, allowed: true });
      } catch {
        setAuth({ loading: false, allowed: true });
      }
    };
    check();
  }, []);

  if (auth.loading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Loading Marketing Manager dashboard…
      </div>
    );
  }
  if (!auth.allowed) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-xl rounded-2xl border-2 border-crm-danger-border bg-crm-danger-bg p-6 text-center">
          <h2 className="text-lg font-bold text-crm-danger-text">403 — Unauthorized</h2>
          <p className="mt-2 text-sm text-crm-danger-text">
            You do not have permission to access company official Facebook/Instagram/Messenger/social campaign
            controls. This area is restricted to <b>Marketing Manager</b>, <b>3 approved marketing users</b>, and{" "}
            <b>Super Admin</b>.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Employees may use only their own official WhatsApp/email/SMS and assigned conversations. Counselors see
            assigned students only.
          </p>
        </div>
      </div>
    );
  }
  return <MarketingDashboard />;
}
