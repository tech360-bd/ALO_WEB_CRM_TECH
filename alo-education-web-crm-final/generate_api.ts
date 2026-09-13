import fs from 'fs';
import path from 'path';

function writeRoute(routePath: string, content: string) {
  const fullPath = path.join(process.cwd(), 'src/app/api', routePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

// Write the unified auth helper
const unifiedAuthHelper = `
import { authenticateRequest as authPortal, AuthContext } from '@/lib/auth-middleware';
import { authenticateStudentRequest as authStudent, StudentAuthContext } from '@/lib/student-auth';
import { NextResponse } from 'next/server';

export type UnifiedAuthContext = { type: 'portal'; data: AuthContext } | { type: 'student'; data: StudentAuthContext };

export async function authenticateUnified(req: Request): Promise<UnifiedAuthContext | NextResponse> {
  const isPortalStr = req.headers.get('x-portal-request');
  if (isPortalStr === 'true') {
     const res = await authPortal(req);
     if (res instanceof NextResponse) return res;
     return { type: 'portal', data: res as AuthContext };
  }
  // Try student first
  const studentRes = await authStudent(req);
  if (!(studentRes instanceof NextResponse)) {
    return { type: 'student', data: studentRes };
  }
  const portalRes = await authPortal(req);
  if (!(portalRes instanceof NextResponse)) {
    return { type: 'portal', data: portalRes as AuthContext };
  }
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
`;
fs.mkdirSync(path.join(process.cwd(), 'src/lib'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'src/lib/unified-auth.ts'), unifiedAuthHelper.trim() + '\n', 'utf8');


const applicationsRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';
import { logStudentEvent } from '@/lib/student-auth';

export async function GET(req: Request) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  
  let where: any = {};
  
  if (authRes.type === 'student') {
    where.studentId = authRes.data.studentId;
  } else {
    const portal = authRes.data;
    if (portal.userType === 'partner') {
      where.partnerId = portal.userId;
    } else if (portal.userType === 'counselor') {
      where.counselorId = portal.userId;
    }
  }

  const applications = await db.application.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  const sanitized = applications.map(app => {
    if (authRes.type === 'student' || (authRes.type === 'portal' && !authRes.data.roles.includes('super_admin') && !authRes.data.roles.includes('application_team'))) {
      const { isB2b, b2bType, b2bProviderId, ...rest } = app;
      return rest;
    }
    return app;
  });

  return NextResponse.json({ success: true, data: sanitized });
}

export async function POST(req: Request) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const body = await req.json();
  const applicationCode = \`APP-\${new Date().getFullYear()}-\${Math.floor(Math.random() * 900000) + 100000}\`;

  const newApp = await db.application.create({
    data: {
      ...body,
      applicationCode,
      studentId: authRes.type === 'student' ? authRes.data.studentId : body.studentId,
    }
  });

  if (authRes.type === 'portal') {
    await logAuditAction(authRes.data, 'CREATE_APPLICATION', 'Application', newApp.id);
  } else {
    await logStudentEvent(authRes.data.studentId, 'CREATED_APPLICATION', { applicationId: newApp.id });
  }

  return NextResponse.json({ success: true, data: newApp });
}
`;
writeRoute('applications/route.ts', applicationsRoute);

const applicationByIdRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  if (authRes.type === 'student' || (authRes.type === 'portal' && !authRes.data.roles.includes('super_admin') && !authRes.data.roles.includes('application_team'))) {
    const { isB2b, b2bType, b2bProviderId, ...rest } = app;
    return NextResponse.json({ success: true, data: rest });
  }

  return NextResponse.json({ success: true, data: app });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const body = await req.json();
  const updated = await db.application.update({
    where: { id: params.id },
    data: body
  });

  if (authRes.type === 'portal') {
    await logAuditAction(authRes.data, 'UPDATE_APPLICATION', 'Application', params.id);
  }

  return NextResponse.json({ success: true, data: updated });
}
`;
writeRoute('applications/[id]/route.ts', applicationByIdRoute);


const dashboardRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  const total = await db.application.count();
  const active = await db.application.count({ where: { status: 'active' } });
  return NextResponse.json({ success: true, data: { total, active } });
});
`;
writeRoute('applications/dashboard/route.ts', dashboardRoute);
writeRoute('applications/metrics/route.ts', dashboardRoute); // Duplicate logic for simplicity

const assignRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  const updated = await db.application.update({
    where: { id: params.id },
    data: body
  });
  
  await logAuditAction(auth, 'ASSIGN_APPLICATION', 'Application', params.id, body);
  return NextResponse.json({ success: true, data: updated });
});
`;
writeRoute('applications/[id]/assign/route.ts', assignRoute);

const statusRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  const updated = await db.application.update({
    where: { id: params.id },
    data: {
      stage: body.stage,
      status: body.status,
      safeStatus: body.safeStatus || 'under_review'
    }
  });

  await db.applicationStageHistory.create({
    data: {
      applicationId: params.id,
      stage: body.stage,
      status: 'completed',
      actor: auth.userId
    }
  });

  await logAuditAction(auth, 'UPDATE_STATUS', 'Application', params.id, body);
  return NextResponse.json({ success: true, data: updated });
});
`;
writeRoute('applications/[id]/status/route.ts', statusRoute);

const submitRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  
  const receipt = await db.applicationSubmissionReceipt.create({
    data: {
      applicationId: params.id,
      ...body
    }
  });

  await logAuditAction(auth, 'SUBMIT_APPLICATION', 'Application', params.id, body);
  return NextResponse.json({ success: true, data: receipt });
});
`;
writeRoute('applications/[id]/submit/route.ts', submitRoute);


const offerRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const offers = await db.applicationOffer.findMany({ where: { applicationId: params.id } });
  return NextResponse.json({ success: true, data: offers });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  const body = await req.json();

  if (body.id) {
    const updated = await db.applicationOffer.update({ where: { id: body.id }, data: body });
    return NextResponse.json({ success: true, data: updated });
  } else {
    const created = await db.applicationOffer.create({ data: { applicationId: params.id, ...body } });
    return NextResponse.json({ success: true, data: created });
  }
}
`;
writeRoute('applications/[id]/offer/route.ts', offerRoute);


const casRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  return NextResponse.json({ success: true, data: [] }); // Simplified
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  const body = await req.json();
  
  const updated = await db.application.update({
    where: { id: params.id },
    data: { casI20CoeStatus: body.casI20CoeStatus }
  });
  return NextResponse.json({ success: true, data: updated });
}
`;
writeRoute('applications/[id]/cas-i20-coe/route.ts', casRoute);

const visaRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth, { params }: any) => {
  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const visaCase = await db.visaCase.create({
    data: {
      applicationId: params.id,
      studentId: app.studentId,
      status: 'pending'
    }
  });
  await logAuditAction(auth, 'VISA_HANDOVER', 'Application', params.id);
  return NextResponse.json({ success: true, data: visaCase });
});
`;
writeRoute('applications/[id]/visa-handover/route.ts', visaRoute);


const timelineRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  
  let where: any = { applicationId: params.id };
  if (authRes.type === 'student') {
    where.visibility = { in: ['student', 'public'] };
  }
  
  const events = await db.timelineEvent.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ success: true, data: events });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  const body = await req.json();

  const event = await db.timelineEvent.create({
    data: {
      applicationId: params.id,
      ...body
    }
  });
  return NextResponse.json({ success: true, data: event });
}
`;
writeRoute('applications/[id]/timeline/route.ts', timelineRoute);
writeRoute('applications/[id]/comments/route.ts', timelineRoute.replace(/timelineEvent/g, 'applicationComment').replace(/TimelineEvent/g, 'ApplicationComment'));

const tasksRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  const tasks = await db.applicationTask.findMany();
  return NextResponse.json({ success: true, data: tasks });
});
export const POST = withAuth(async (req, auth) => {
  const body = await req.json();
  const task = await db.applicationTask.create({ data: body });
  return NextResponse.json({ success: true, data: task });
});
`;
writeRoute('applications/tasks/route.ts', tasksRoute);

const taskByIdRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  const task = await db.applicationTask.update({ where: { id: params.id }, data: body });
  return NextResponse.json({ success: true, data: task });
});
`;
writeRoute('applications/tasks/[id]/route.ts', taskByIdRoute);


const deadlinesRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  const records = await db.applicationDeadline.findMany();
  return NextResponse.json({ success: true, data: records });
});
export const POST = withAuth(async (req, auth) => {
  const body = await req.json();
  const record = await db.applicationDeadline.create({ data: body });
  return NextResponse.json({ success: true, data: record });
});
`;
writeRoute('applications/deadlines/route.ts', deadlinesRoute);

const b2bAppRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  if (!auth.roles.includes('super_admin') && !auth.permissions.includes('application.view_b2b')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const apps = await db.b2bApplication.findMany();
  return NextResponse.json({ success: true, data: apps });
});

export const POST = withAuth(async (req, auth) => {
  if (!auth.roles.includes('super_admin') && !auth.permissions.includes('application.view_b2b')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const app = await db.b2bApplication.create({ data: body });
  return NextResponse.json({ success: true, data: app });
});
`;
writeRoute('applications/b2b/route.ts', b2bAppRoute);

const b2bAppByIdRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  if (!auth.roles.includes('super_admin') && !auth.permissions.includes('application.view_b2b')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const app = await db.b2bApplication.update({ where: { id: params.id }, data: body });
  return NextResponse.json({ success: true, data: app });
});
`;
writeRoute('applications/[id]/b2b/route.ts', b2bAppByIdRoute);


const b2bProvRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  const records = await db.b2bProvider.findMany();
  return NextResponse.json({ success: true, data: records });
});
export const POST = withAuth(async (req, auth) => {
  const body = await req.json();
  const record = await db.b2bProvider.create({ data: body });
  return NextResponse.json({ success: true, data: record });
});
`;
writeRoute('b2b/providers/route.ts', b2bProvRoute);

const b2bProvByIdRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  const record = await db.b2bProvider.update({ where: { id: params.id }, data: body });
  return NextResponse.json({ success: true, data: record });
});
`;
writeRoute('b2b/providers/[id]/route.ts', b2bProvByIdRoute);


const reportsRoute = `
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  return NextResponse.json({ success: true, data: { pipeline: {}, conversions: {} } });
});
`;
writeRoute('applications/reports/route.ts', reportsRoute);
writeRoute('applications/reports/generate/route.ts', reportsRoute);

console.log("Done");
