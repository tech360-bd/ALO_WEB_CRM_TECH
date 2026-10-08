import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('portal and student session hardening', () => {
  it('does not return database session tokens in login JSON', () => {
    const portal = readFileSync('src/app/api/portal-auth/login/route.ts', 'utf8');
    const student = readFileSync('src/app/api/student/auth/login/route.ts', 'utf8');
    expect(portal).toMatch(/alo_portal_session/);
    expect(student).toMatch(/alo_student_session/);
    expect(portal).not.toMatch(/success:\s*true,[\s\S]{0,80}token:\s*sessionToken/);
    expect(student).not.toMatch(/success:\s*true,[\s\S]{0,80}token[,}]/);
  });

  it('sets HttpOnly, SameSite, secure-aware cookies and clears them on logout', () => {
    for (const file of [
      'src/app/api/portal-auth/login/route.ts',
      'src/app/api/student/auth/login/route.ts',
      'src/app/api/portal-auth/logout/route.ts',
      'src/app/api/student/auth/logout/route.ts',
    ]) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).toContain('httpOnly: true');
      expect(source, file).toContain("sameSite: 'lax'");
      expect(source, file).toContain('secure');
    }
  });

  it('supports HttpOnly session cookies while rejecting fabricated bearer values', () => {
    const portalAuth = readFileSync('src/lib/auth-middleware.ts', 'utf8');
    const studentAuth = readFileSync('src/lib/student-auth.ts', 'utf8');
    expect(portalAuth).toContain('alo_portal_session');
    expect(studentAuth).toContain('alo_student_session');
    expect(portalAuth).toContain("bearerToken !== 'null'");
    expect(studentAuth).toContain("bearerToken !== 'null'");
  });

  it('has per-IP/email portal throttling and student failure throttling', () => {
    const portal = readFileSync('src/app/api/portal-auth/login/route.ts', 'utf8');
    const student = readFileSync('src/app/api/student/auth/login/route.ts', 'utf8');
    expect(portal).toContain('loginAttempt.count');
    expect(portal).toContain('failureCount >= 5');
    expect(portal).toContain('status: 429');
    expect(student).toContain('loginAttempt.count');
    expect(student).toContain('Too many failed attempts');
    expect(student).toContain('status: 429');
  });
});
