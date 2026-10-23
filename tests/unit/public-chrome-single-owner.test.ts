import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.tsx$/.test(path) ? [path] : [];
  });
}

describe('single owner for site-wide public header/footer', () => {
  const files = sourceFiles('src');
  it.each(['PublicNavbar', 'PublicFooter', 'PublicLayoutWrapper'])(
    'mounts %s exactly once in its shared owner', (component) => {
      const mounts = files.flatMap((path) => {
        const matches = readFileSync(path, 'utf8').match(new RegExp(`<${component}\\b`, 'g')) || [];
        return matches.map(() => path);
      });
      expect(mounts).toEqual([component === 'PublicLayoutWrapper'
        ? 'src/app/layout.tsx'
        : 'src/components/website/PublicLayoutWrapper.tsx']);
    },
  );
  it('does not duplicate the site copyright in individual pages or components', () => {
    const owners = files.filter((path) => /All rights reserved\./.test(readFileSync(path, 'utf8')));
    expect(owners).toEqual(['src/components/website/PublicFooter.tsx']);
  });
});
