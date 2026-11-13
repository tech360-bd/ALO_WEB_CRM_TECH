import { describe, expect, it } from 'vitest';
import { getNavForRole } from '@/lib/portal-nav';

/**
 * Navigation contract.
 *
 * The AI & Interview Intelligence group links to two real routes. It must be
 * present on staff portals and must never be injected into the student portal,
 * which has its own interview preparation surface.
 */
const hrefsFor = (role: string) =>
  getNavForRole(role)
    .flatMap((group) => group.items)
    .flatMap((item) => (item.href ? [item.href] : []));

describe('portal navigation — AI & interview intelligence', () => {
  it('adds the AI command center and interview library to staff portals', () => {
    for (const role of ['counselor', 'admin', 'super-admin', 'admissions', 'visa', 'hr_manager']) {
      const hrefs = hrefsFor(role);
      expect(hrefs, role).toContain('/crm/ai-command-center');
      expect(hrefs, role).toContain('/crm/interview-library');
      expect(hrefs, role).toContain('/crm/interview-practice');
      expect(hrefs, role).toContain('/crm/interview-review');
    }
  });

  it('never injects staff AI tooling into the student portal', () => {
    const hrefs = hrefsFor('student');
    expect(hrefs).not.toContain('/crm/ai-command-center');
    expect(hrefs).not.toContain('/crm/interview-library');
    expect(hrefs).not.toContain('/crm/interview-practice');
    expect(hrefs).not.toContain('/crm/interview-review');
    expect(getNavForRole('student').some((group) => group.title === 'HR Center')).toBe(false);
  });

  it('does not duplicate the AI group when a role already declares it', () => {
    const groups = getNavForRole('counselor').filter((group) => group.title === 'AI & Interview Intelligence');
    expect(groups).toHaveLength(1);
  });

  it('keeps every staff nav href unique', () => {
    const hrefs = hrefsFor('admin');
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
