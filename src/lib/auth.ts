import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) return null;
        if (user.status !== "ACTIVE") return null;

        // Check password (passwordHash stores bcrypt hash, or "alo-temporary" for seeded users)
        const isValid = user.passwordHash === "alo-temporary"
          ? credentials.password === "alo123" // temporary password for seeded users
          : await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) return null;

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
      // Resolve canonical Student identity once the token has a user id.
      // This runs on every jwt refresh — the Student lookup is cached on
      // the token via `token.studentId` / `token.studentCode` so we don't
      // hit the DB on every request after the first resolve.
      if (token.id && !token.studentId && token.role === "STUDENT") {
        try {
          // Student.userId is not @unique in the schema (a user may have been
          // created before linking to a student). Use findFirst instead of
          // findUnique so the lookup compiles against the actual schema.
          const student = await db.student.findFirst({
            where: { userId: token.id as string },
            select: { id: true, studentId: true },
          });
          if (student) {
            token.studentId = student.id;            // Student.id (CUID — canonical DB identity)
            token.studentCode = student.studentId;   // Student.studentId (AE-YYYYXXXXXX)
          }
        } catch {
          // Ignore lookup failures (e.g. during tests without a DB);
          // the session simply won't have student identity attached.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        // Attach canonical Student identity to the session for STUDENT role users.
        // Other roles (COUNSELOR, ADMIN, etc.) simply have these fields as undefined.
        (session.user as any).studentId = token.studentId;
        (session.user as any).studentCode = token.studentCode;
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
