"use client";

import { useCallback, createContext, useContext } from "react";
import { CommandCenter } from "./command-center";
import { SiteChrome } from "./site-chrome";

/**
 * Bridge between the server-rendered page and the client-side Command
 * Center drawer + site chrome (search palette, schedule meeting modal,
 * theme toggle).
 *
 * SECURITY: This component no longer accepts CRM `data` from the server.
 * The public page ships ONLY the launcher button — no inquiries, no
 * opportunities, no contacts, no AI tasks, no meetings. After a user
 * successfully authenticates via the in-drawer login form (POST
 * /api/v1/auth/login), the Command Center fetches dashboard data from
 * /api/v1/admin/dashboard using the signed session cookie.
 *
 * Architecture note: We intentionally render <SiteChrome /> INSIDE this
 * client component rather than accepting it as `children` from the
 * server. In React 19 / Next.js 16, passing a Client Component as
 * `children` from a Server Component across the server/client boundary
 * triggers a "Functions are not valid as a child of Client Components"
 * error. Rendering SiteChrome directly here avoids that issue while
 * still giving SiteChrome access to the CommandCenterOpenContext.
 */

type OpenFn = () => void;

const CommandCenterOpenContext = createContext<OpenFn | null>(null);

/** Hook for any client component to imperatively open the Command Center. */
export function useOpenCommandCenter(): OpenFn | null {
  return useContext(CommandCenterOpenContext);
}

export function CommandCenterBridge() {
  // Open is triggered by dispatching a window event — CommandCenter listens
  // for it internally. This keeps the open state owned by the CommandCenter
  // (good for animation/exit transitions) while still allowing external
  // triggers without prop-drilling setState.
  const open = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("alaminn:open-command-center"));
    }
  }, []);

  return (
    <CommandCenterOpenContext.Provider value={open}>
      <CommandCenter />
      <SiteChrome />
    </CommandCenterOpenContext.Provider>
  );
}
