import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
} from "@/lib/rate-limiter";

export const authOptions: NextAuthOptions = {
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase();

        // ─── Rate limit check ───────────────────────────────────
        const rateCheck = checkLoginRateLimit(email);
        if (!rateCheck.allowed) {
          throw new Error(
            `ACCOUNT_LOCKED:${rateCheck.retryAfterSeconds}`
          );
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          recordFailedLogin(email);
          return null;
        }
        if (user.status !== "ACTIVE") {
          recordFailedLogin(email);
          return null;
        }

        // Check password
        let isValid = false;
        if (user.passwordHash === "alo-temporary") {
          // Seeded users must set a real password on first login
          // For dev-only: accept 'changeme' to trigger password change flow
          isValid = credentials.password === "changeme";
        } else {
          isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        }

        if (!isValid) {
          const result = recordFailedLogin(email);
          if (result.locked) {
            throw new Error(
              `ACCOUNT_LOCKED:${result.retryAfterSeconds}`
            );
          }
          return null;
        }

        // Successful login — reset rate limit
        resetLoginRateLimit(email);

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
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
          requiresPasswordChange: user.passwordHash === "alo-temporary",
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
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
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
  return null; // Will be replaced by getServerSession in server components
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
