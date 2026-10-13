/**
 * Vitest shared setup — runs before every test file in every environment.
 *
 * Under the default 'node' environment this file is essentially a no-op:
 * the @testing-library/jest-dom matchers are only registered when a DOM is
 * actually present (i.e. when a test file opts into jsdom via the
 * `// @vitest-environment jsdom` pragma).
 *
 * This keeps node-only unit tests fast and free of unrelated DOM globals,
 * while still giving component tests the full set of jest-dom matchers
 * (toBeInTheDocument, toHaveTextContent, …) when they need them.
 */

// Only register jest-dom matchers when a DOM exists. Under jsdom, `window`
// is defined; under node, it isn't.
if (typeof window !== "undefined") {
  // @ts-expect-error — @testing-library/jest-dom/vitest has no exported types
  // for the side-effect import; it augments vitest's `expect` in place.
  await import("@testing-library/jest-dom/vitest");
}

// Suppress noisy console.warn from env() dev-fallback path during tests.
// We exercise that path explicitly in tests/lib/env.test.ts; silencing the
// warning keeps the test runner output focused on actual failures.
const origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === "string" && first.includes("[env] WARNING: AUTH_SECRET not set")) {
    return;
  }
  origWarn(...args);
};
