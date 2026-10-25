import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Static authorization surface for the PhD APIs.
 *
 * These assertions are deliberately structural: they catch a route that forgets
 * to resolve the actor server-side, a public response that leaks a supervisor's
 * identity, and a student page that is indexable. Behavioural checks live in
 * `tests/integration/phd/services.test.ts`.
 */

const root = process.cwd();

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const phdRoutes = walk(path.join(root, 'src/app/api/phd')).filter((file) => file.endsWith('route.ts'));
// Only the public research-catalogue routes are in scope; /api/research has
// unrelated pre-existing endpoints that are audited elsewhere.
const researchRoutes = walk(path.join(root, 'src/app/api/research/programmes')).filter((file) => file.endsWith('route.ts'));
const studentPages = walk(path.join(root, 'src/app/student/phd')).filter((file) => file.endsWith('page.tsx'));
const sopEntryPages = [path.join(root, 'src/app/student/sop/page.tsx')];

describe('PhD API authorization surface', () => {
  it('has route files to check', () => {
    expect(phdRoutes.length).toBeGreaterThanOrEqual(45);
    expect(researchRoutes.length).toBeGreaterThanOrEqual(2);
    expect(studentPages.length).toBe(11);
    for (const page of sopEntryPages) expect(readFileSync(page, 'utf8').length).toBeGreaterThan(200);
  });

  it('resolves the actor server-side in every PhD route', () => {
    for (const file of phdRoutes) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${path.relative(root, file)} must use phdRoute`).toContain('phdRoute');
      expect(source, `${path.relative(root, file)} must not trust a client user id`).not.toMatch(
        /searchParams\.get\(['"](?:userId|role|actorId)['"]\)/,
      );
      const handlers = [...source.matchAll(/export const (GET|POST|PUT|PATCH|DELETE)/g)].map((match) => match[1]);
      expect(handlers.length, `${path.relative(root, file)} exports at least one handler`).toBeGreaterThan(0);
    }
  });

  it('does not expose a supervisor identity or contact detail publicly', () => {
    const catalogue = readFileSync(path.join(root, 'src/lib/phd/public-catalogue.ts'), 'utf8');
    expect(catalogue).not.toMatch(/contactEmail\s*:/);
    expect(catalogue).not.toMatch(/fullName\s*:\s*true/);

    for (const file of researchRoutes) {
      const source = readFileSync(file, 'utf8');
      expect(source).toMatch(/listPublicProgrammes|getPublicProgramme/);
      expect(source).not.toMatch(/phdSupervisor/);
    }
  });

  it('keeps the public research JSON cacheable but never caches the private workspace', () => {
    for (const file of researchRoutes) {
      const source = readFileSync(file, 'utf8');
      expect(source).toContain("max-age=300");
    }
    const uiSource = readFileSync(path.join(root, 'src/components/phd/ui.tsx'), 'utf8');
    expect(uiSource).toContain("cache: 'no-store'");
  });

  it('marks every student workspace page as non-indexable', () => {
    for (const file of [...studentPages, ...sopEntryPages]) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${path.relative(root, file)} must be noindex`).toContain('robots: { index: false');
    }
  });

  it('exports the mandated SOP filenames from one constant', () => {
    const constants = readFileSync(path.join(root, 'src/lib/phd/sop/constants.ts'), 'utf8');
    expect(constants).toContain("'Student_SOP_Final.docx'");
    expect(constants).toContain("'Student_SOP_Final.pdf'");
    expect(constants).toContain("'Student_SOP_Review_Report.pdf'");
    expect(constants).toContain('SOP_DETECTOR_STATEMENT');
  });

  it('never claims a detector score anywhere in the SOP module or documentation', () => {
    const files = walk(path.join(root, 'src/lib/phd/sop')).filter((file) => file.endsWith('.ts'));
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/guarantee[\s\S]{0,40}(detector|ai[- ]detection)/i);
      expect(source).not.toMatch(/detector score (of|below|under)\s*\d/i);
    }
    const doc = readFileSync(path.join(root, 'docs/phd/SOP-BUILDER.md'), 'utf8');
    expect(doc).toContain('No AI-detector score is measured');
    expect(doc).toContain('**does not**');
    expect(doc).not.toMatch(/we guarantee|guaranteed to pass/i);
  });

  it('registers the PhD maintenance job in the scheduler and its route', () => {
    const registry = readFileSync(path.join(root, 'src/lib/cron/job-registry.ts'), 'utf8');
    const definitions = readFileSync(path.join(root, 'src/cron/cron-definitions.ts'), 'utf8');
    const cronRoute = readFileSync(path.join(root, 'src/app/api/cron/phd-maintenance/route.ts'), 'utf8');
    expect(registry).toContain("key: 'phd-maintenance'");
    expect(definitions).toContain("id: 'phd-maintenance'");
    expect(cronRoute).toContain("handleAuthorizedCronRequest(req, 'phd-maintenance')");
    // A scheduled job must never delete student evidence.
    const handler = readFileSync(path.join(root, 'src/lib/cron/job-handlers.ts'), 'utf8');
    const phdHandler = handler.slice(handler.indexOf('export async function runPhdMaintenance'));
    expect(phdHandler).not.toMatch(/deleteMany|removePrivateFile|unlinkSync|fs\.rm/);
    expect(phdHandler).toContain('report only');
  });
});
