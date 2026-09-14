import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { isHR, isSuperAdmin } from "@/lib/hrms/rbac";

export async function GET(req: Request) {
  return withAuth(async (request, auth) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || auth.userId;
    const employeeId = url.searchParams.get("employeeId") || "";

    // Login security: employee sees own only, HR/Super sees all
    const isOwner = userId === auth.userId;
    const canViewAll = isHR(auth) || isSuperAdmin(auth);
    if (!isOwner && !canViewAll) return NextResponse.json({ success:false, error:"Access denied to security logs" }, { status:403 });

    let targetUserId = userId;
    if (employeeId) {
      const hr = await (db as any).employeeHR.findFirst({ where:{ employeeId }}).catch(()=>null);
      if (hr) targetUserId = hr.userId;
    }

    const [loginSecurity, extended, sessions, failed] = await Promise.all([
      (db as any).loginSecurity.findMany({ where:{ userId: targetUserId }, orderBy:{ loginTime:'desc' }, take:50 }).catch(()=>[]),
      (db as any).hrmLoginSecurityExtended.findMany({ where:{ userId: targetUserId }, orderBy:{ loginAt:'desc' }, take:50 }).catch(()=>[]),
      (db as any).portalSession.findMany({ where:{ userId: targetUserId }, orderBy:{ createdAt:'desc' }, take:20 }).catch(()=>[]),
      (db as any).employeeLoginLog.findMany({ where:{ userId: targetUserId }, orderBy:{ loginAt:'desc' }, take:50 }).catch(()=>[]),
      // (db as any).employeeSecurityEvent.findMany({ where:{ employeeId }, orderBy:{ createdAt:'desc' }, take:20 }).catch(()=>[]),
    ]);

    // Merge extended + legacy
    const merged = [
      ...extended.map((e:any)=> ({ id:e.id, ipAddress:e.ipAddress, browser:e.browser, os:e.operatingSystem||e.os, device:e.device, location:[e.city,e.country].filter(Boolean).join(', ')||e.location, loginAt:e.loginAt, logoutAt:e.logoutAt, success:e.success, failureReason:e.failureReason, sessionId:e.sessionId, fingerprint:e.deviceFingerprint })),
      ...loginSecurity.map((l:any)=> ({ id:l.id, ipAddress:l.ipAddress, browser:l.browser, os:l.operatingSystem, device:l.deviceFingerprint, location:l.location, loginAt:l.loginTime, logoutAt:l.logoutTime, success:l.sessionStatus!=='FAILED', sessionId:l.id })),
      ...failed.map((f:any)=> ({ id:f.id, ipAddress:f.ipAddress, browser:f.browser, os:f.os, device:f.device, location:f.location, loginAt:f.loginAt, logoutAt:f.logoutAt, success:f.success, failureReason:f.failureReason, sessionId:f.sessionId })),
    ].sort((a,b)=> new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime()).slice(0,50);

    return NextResponse.json({ success:true, data:{ logs: merged, sessions, extendedCount: extended.length, legacyCount: loginSecurity.length }});
  })(req);
}

export async function POST(req: Request) {
  return withAuth(async (request, auth) => {
    // record login event (called from login flow or manually)
    const body = await request.json().catch(()=>({}));
    const { ipAddress, browser, os, device, location, success, failureReason } = body;
    const ip = ipAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const ua = request.headers.get('user-agent') || '';
    // Respect note: never capture webcam without permission — no camera code here by design
    const hr = await (db as any).employeeHR.findUnique({ where:{ userId: auth.userId }}).catch(()=>null);
    const rec = await (db as any).hrmLoginSecurityExtended.create({ data:{
      userId: auth.userId,
      employeeId: hr?.employeeId||"",
      ipAddress: ip,
      browser: browser||"",
      operatingSystem: os||"",
      device: device||"",
      deviceFingerprint: body.fingerprint||"",
      location: location||"",
      city: body.city||"",
      country: body.country||"",
      success: success!==false,
      failureReason: failureReason||"",
      sessionId: auth.sessionId||"",
    }}).catch(()=>null);

    await (db as any).loginSecurity.create({ data:{
      userId: auth.userId,
      ipAddress: ip,
      browser: browser||"",
      operatingSystem: os||"",
      deviceFingerprint: body.fingerprint||"",
      location: location||"",
      sessionStatus: success===false ? 'FAILED' : 'ACTIVE',
      failedAttempts: success===false?1:0,
    }}).catch(()=>{});

    return NextResponse.json({ success:true, data: rec, note:"Webcam capture disabled — browser permission required, see security docs" });
  })(req);
}
