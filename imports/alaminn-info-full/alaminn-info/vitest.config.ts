/**
 * Vitest configuration — Alaminn.info V5
 * --------------------------------------
 * Strategy:
 *   - Default environment: 'node' (suitable for pure-function, lib, and API
 *     integration tests that fetch against the running dev server).
 *   - Component tests opt into jsdom per-file via the
 *     `// @vitest-environment jsdom` pragma, and the shared `tests/setup.ts`
 *     registers @testing-library/jest-dom matchers only when a DOM is
 *     actually present (it's a no-op under node).
 *   - Coverage: v8 provider, 40% lines/branches/functions/statements
 *     threshold. This is a realistic starting point for an existing large
 *     codebase; we raise the bar incrementally as more tests land.
 *
 * Path alias: `@/*` → `./src/*` mirrors tsconfig.json so lib imports work
 * inside tests without modification.
 */
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(root, "src"),
    },
  },
  test: {
    // Default environment for all tests. Component tests opt into jsdom via
    // the `// @vitest-environment jsdom` file pragma.
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "dist/**", "out/**"],
    // Single shared setup file. It's a no-op in node env (only registers
    // jest-dom matchers when a DOM is present).
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "html"],
      reportsDirectory: "coverage",
      // Only collect coverage on src/lib + src/app/api (the layers we test).
      // Covering UI components would balloon the denominator and obscure the
      // signal — the 40% threshold is a starting point on the lib layer.
      include: ["src/lib/**", "src/app/api/**"],
      exclude: [
        "src/lib/email/queue.ts",
        "node_modules/**",
        "**/*.d.ts",
        "**/*.config.*",
        "tests/**",
      ],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },
    // Fail fast on unhandled errors; keep a sane per-test timeout for
    // integration tests that hit the dev server.
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
