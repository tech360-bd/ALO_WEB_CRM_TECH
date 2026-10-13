/**
 * global-error.tsx — the topmost error boundary in Next.js App Router.
 *
 * It catches errors that escape the root layout itself (e.g. a throw
 * inside layout.tsx, ThemeProvider crash, font loading failure). For
 * that reason it replaces the root layout entirely and must include
 * its own <html> and <body> tags.
 *
 * Keep this minimal: no shared chrome, no fonts, no ThemeProvider —
 * only enough inline styling to render a legible error page when the
 * rest of the app is broken.
 *
 * Must be a client component.
 */
"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          backgroundColor: "#ffffff",
          color: "#0a0a0a",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <div
            aria-hidden="true"
            style={{
              margin: "0 auto 1.5rem",
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "9999px",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
            }}
          >
            ⚠
          </div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              margin: "0 0 0.75rem",
            }}
          >
            Application error
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#525252", lineHeight: 1.6, margin: "0 0 1rem" }}>
            A critical error occurred and the page could not be rendered. The
            team has been notified. You can try reloading the page, or return to
            the home page.
          </p>
          {error?.digest ? (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.75rem",
                color: "#737373",
                margin: "0 0 1.5rem",
              }}
            >
              Error ID: {error.digest}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                backgroundColor: "#0a0a0a",
                color: "#ffffff",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                backgroundColor: "transparent",
                color: "#0a0a0a",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                border: "1px solid #e5e5e5",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
