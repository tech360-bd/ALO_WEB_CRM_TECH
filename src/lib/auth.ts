import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as any),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const headers = request?.headers || {};
        const forwarded = headers['x-forwarded-for'];
        const ipAddress = String(forwarded || headers['x-real-ip'] || 'unknown').split(',')[0].trim().slice(0, 191) || 'unknown';
        const userAgent = String(headers['user-agent'] || '').slice(0, 512);
        const cutoff = new Date(Date.now() - 15 * 60 * 1000);
        const failures = await db.loginAttempt.count({
          where: { success: false, createdAt: { gte: cutoff }, OR: [{ email }, ...(ipAddress === 'unknown' ? [] : [{ ipAddress }])] },
        });
        if (failures >= 5) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          await db.loginAttempt.create({ data: { email, ipAddress, userAgent, success: false, failureReason: 'user_not_found' } });
          return null;
        }
        if (user.status !== "ACTIVE" || !user.emailVerified) {
          await db.loginAttempt.create({ data: { email, ipAddress, userAgent, success: false, failureReason: user.status !== 'ACTIVE' ? 'account_inactive' : 'email_not_verified' } });
          return null;
        }

        // Passwords must always be verified against a real bcrypt hash. Legacy
        // placeholder passwords are rejected rather than accepted globally.
        let isValid = false;
        try {
          isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        } catch {
          isValid = false;
        }

        if (!isValid) {
          await db.loginAttempt.create({ data: { email, ipAddress, userAgent, success: false, failureReason: 'wrong_password' } });
          return null;
        }

        await db.loginAttempt.create({ data: { email, ipAddress, userAgent, success: true } });

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Audit log
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            resource: "User",
            resourceId: user.id,
            details: JSON.stringify({ email: user.email, role: user.role }),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.status = (user as any).status;
      }
      // Resolve Student identity for STUDENT role (idempotent — only fetches once per token lifetime)
      if (token.role === "STUDENT" && token.id && !token.studentId) {
        try {
          const student = await db.student.findFirst({
            where: { userId: token.id as string },
            select: { id: true, studentId: true },
          });
          if (student) {
            token.studentId = student.id;          // Student.db id (for relations)
            token.studentCode = student.studentId; // AE-YYYYXXXXXX canonical code
          }
        } catch {
          // Non-fatal — session simply won't include studentId
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        if (token.studentId) (session.user as any).studentId = token.studentId;
        if (token.studentCode) (session.user as any).studentCode = token.studentCode;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      // Audit log for logout
      const token = message.token as any;
      if (token?.id) {
        await db.auditLog.create({
          data: {
            userId: token.id,
            action: "LOGOUT",
            resource: "User",
            resourceId: token.id,
          },
        }).catch(() => {});
      }
    },
  },
};

// Helper to get current user from session
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

// Role-based redirect after login
export function getDashboardRoute(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "COUNSELOR":
      return "/counselor/dashboard";
    case "APPLICATION_TEAM":
      return "/crm/dashboard";
    case "VISA_OFFICER":
    case "VISA_INTERVIEW_OFFICER":
      return "/visa/dashboard";
    case "MARKETING_MANAGER":
    case "MARKETING":
      return "/marketing/dashboard";
    case "FINANCE":
      return "/finance/dashboard";
    case "HR_MANAGER":
      return "/hrm/dashboard";
    case "PARTNER":
      return "/partner-admin/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    default:
      return "/dashboard";
  }
}
