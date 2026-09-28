import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createStudentSession } from '@/lib/student-auth';

// Rate limiting — in-memory (single-instance) with Redis-ready abstraction.
// SEC-06 fix: extract first IP from x-forwarded-for (trusted proxy chain) and fallback correctly.
const rateLimits = new Map<string, { count: number; expiresAt: number }>();

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim() || 'unknown';
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

async function setStudentPageSessionCookie(response: NextResponse, student: { id: string; email: string; name: string }) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return response;

  const token = await encode({
    token: {
      sub: student.id,
      id: student.id,
      email: student.email,
      name: student.name,
      role: 'STUDENT',
      status: 'ACTIVE',
    },
    secret,
    maxAge: 24 * 60 * 60,
  });
  const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
  response.cookies.set(secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token', token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
  return response;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const now = Date.now();
    
    // Check rate limit
    const rateLimit = rateLimits.get(ip);
    if (rateLimit) {
      if (now > rateLimit.expiresAt) {
        rateLimits.delete(ip);
      } else if (rateLimit.count >= 5) {
        return NextResponse.json({ success: false, error: 'Too many failed attempts. Please try again later.' }, { status: 429 });
      }
    }

    const body = await req.json();
    const { email, phone, password, otpCode, loginMethod } = body;

    if (loginMethod !== 'password' && loginMethod !== 'otp') {
      return NextResponse.json({ success: false, error: 'Invalid login method' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: 'Email or phone required' }, { status: 400 });
    }

    const student = await db.student.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ]
      }
    });

    if (!student) {
      // Increment rate limit on failure
      const limit = rateLimits.get(ip) || { count: 0, expiresAt: now + 15 * 60 * 1000 };
      limit.count += 1;
      rateLimits.set(ip, limit);
      
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if ((student as any).suspended) {
      return NextResponse.json({ success: false, error: 'Account suspended' }, { status: 403 });
    }

    let authSuccess = false;

    if (loginMethod === 'password') {
      if (!password) {
         return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
      }
      if (!student.password) {
          // Increment rate limit
          const limit = rateLimits.get(ip) || { count: 0, expiresAt: now + 15 * 60 * 1000 };
          limit.count += 1;
          rateLimits.set(ip, limit);

         return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      authSuccess = await bcrypt.compare(password, student.password);
    } else {
      if (!otpCode) {
        return NextResponse.json({ success: false, error: 'OTP required' }, { status: 400 });
      }

      if (!student.otpCode || student.otpCode !== otpCode || !student.otpExpiresAt || student.otpExpiresAt < new Date()) {
         // Increment rate limit
         const limit = rateLimits.get(ip) || { count: 0, expiresAt: now + 15 * 60 * 1000 };
         limit.count += 1;
         rateLimits.set(ip, limit);
         return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 401 });
      }

      authSuccess = true;
      
      // Clear OTP
      await db.student.update({
        where: { id: student.id },
        data: { otpCode: null as any, otpExpiresAt: null as any }
      });
    }

    if (!authSuccess) {
       // Increment rate limit
       const limit = rateLimits.get(ip) || { count: 0, expiresAt: now + 15 * 60 * 1000 };
       limit.count += 1;
       rateLimits.set(ip, limit);

       if ((db as any).studentLoginAttempt) {
         await (db as any).studentLoginAttempt.create({
            data: {
               studentId: student.id,
               ipAddress: ip,
               success: false,
               userAgent: req.headers.get('user-agent') || ''
            }
         });
       }

       return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Success! Clear rate limit for this IP
    rateLimits.delete(ip);

    // Create session
    const token = await createStudentSession(student.id, {
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') || ''
    });

    // Update lastLoginAt
    await db.student.update({
      where: { id: student.id },
      data: { lastLoginAt: new Date() }
    });

    if ((db as any).studentLoginAttempt) {
      await (db as any).studentLoginAttempt.create({
        data: {
          studentId: student.id,
          ipAddress: ip,
          success: true,
          userAgent: req.headers.get('user-agent') || ''
        }
      });
    }

    const response = NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        profileComplete: student.profileComplete,
        journeyStage: student.journeyStage
      }
    });
    const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
    response.cookies.set('alo_student_session', token, {
      httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 24 * 60 * 60,
    });
    return setStudentPageSessionCookie(response, student);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
