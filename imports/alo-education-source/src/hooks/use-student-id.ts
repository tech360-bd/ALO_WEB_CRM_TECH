"use client";

import * as React from "react";

/**
 * Hook to get the current authenticated student ID.
 * 
 * This replaces all hardcoded student IDs (like "cmr267b3c001osnf1ypg8fptd")
 * with the actual logged-in student's ID, resolved from the server session.
 * 
 * Returns:
 *   - studentId: string | null  (null while loading or if not authenticated)
 *   - loading: boolean
 */

export function useStudentId() {
  const [studentId, setStudentId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStudentId() {
      try {
        // Try sessionStorage first (set by app-shell on login)
        const stored = typeof window !== "undefined" ? sessionStorage.getItem("alo-current-user") : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.studentId) {
            setStudentId(parsed.studentId);
            setLoading(false);
            return;
          }
          if (parsed.id) {
            // User is logged in but we need their student record
            const res = await fetch(`/api/students?userId=${parsed.id}`, { cache: "no-store" });
            if (res.ok) {
              const data = await res.json();
              if (data.student?.id) {
                setStudentId(data.student.id);
                setLoading(false);
                return;
              }
            }
          }
        }

        // Fallback: try to get from /api/auth/session
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          if (session?.user?.id) {
            // Look up student by userId
            const studentRes = await fetch(`/api/students?userId=${session.user.id}`, { cache: "no-store" });
            if (studentRes.ok) {
              const data = await studentRes.json();
              if (data.student?.id) {
                setStudentId(data.student.id);
                // Cache for future use
                sessionStorage.setItem("alo-current-user", JSON.stringify({ ...session.user, studentId: data.student.id }));
                setLoading(false);
                return;
              }
            }
          }
        }

        // If nothing works, set null (student pages should show "not logged in" state)
        setStudentId(null);
      } catch {
        setStudentId(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentId();
  }, []);

  return { studentId, loading };
}
