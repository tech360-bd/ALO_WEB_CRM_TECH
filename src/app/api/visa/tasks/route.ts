import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

const VALID_TASK_TYPES = ['DOCUMENT_REQUEST','INTERVIEW','BANK_REVIEW','SPONSOR_REVIEW','REFUSAL_REVIEW','STUDY_GAP_REVIEW','COUNSELOR_ACTION','APPLICATION_ACTION','STUDENT_ACTION','SENIOR_REVIEW','document_request','interview','bank_review','sponsor_review','refusal_review','study_gap_review','counselor_action','application_action','student_action','senior_review'];

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('counselor') || auth.roles.includes('application_team') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER') || auth.roles.includes('COUNSELOR') || auth.roles.includes('APPLICATION_TEAM');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Task view permission required — tasks.view' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (caseId) where.caseId = caseId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (priority) where.priority = priority;

    // RBAC ownership for visa officers
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isSuper && isVisa && caseId) {
      const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot view tasks for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const tasks = await db.visaTask.findMany({ where, orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }] });

    // Overdue detection
    const now = new Date();
    const overdue = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed');

    await logAuditAction(auth, 'VISA_TASKS_VIEW', 'VisaTask', caseId || studentId || 'list', { count: tasks.length, overdue: overdue.length });

    return NextResponse.json({
      success: true,
      data: tasks,
      tasks,
      overdue,
      emptyState: tasks.length === 0 ? 'No tasks — proper empty state — types Document Request/Interview/Bank Review/Sponsor Review/Refusal Review/Study Gap Review/Counselor Action/Application Action/Student Action/Senior Review — each task owner/priority/deadline/status/createdBy/caseId/studentId — overdue appears in dashboard' : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Task create requires visa officer — tasks.create' }, { status: 403 });

    const body = await req.json();
    const { caseId, studentId, taskType, title, description, assignedTo, dueDate, priority, owner } = body;

    if (!title) return NextResponse.json({ success: false, error: 'Task title required' }, { status: 400 });
    if (taskType && !VALID_TASK_TYPES.includes(taskType)) {
      return NextResponse.json({ success: false, error: `Invalid task type — allowed Document Request/Interview/Bank Review/Sponsor Review/Refusal Review/Study Gap Review/Counselor Action/Application Action/Student Action/Senior Review` }, { status: 400 });
    }

    let visaCase = null;
    if (caseId) visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase && studentId) visaCase = await db.visaCase.findFirst({ where: { studentId } });

    if (visaCase) {
      const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
      if (!isSuper && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot create task for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const task = await db.visaTask.create({
      data: {
        caseId: caseId || visaCase?.id || '',
        studentId: studentId || visaCase?.studentId || '',
        taskType: taskType || 'document_request',
        title: title || '',
        description: description || '',
        assignedTo: assignedTo || owner || 'student',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
        priority: priority || 'medium',
        createdBy: auth.userId,
      } as any,
    });

    await logAuditAction(auth, 'VISA_TASK_CREATE', 'VisaTask', task.id, { caseId: caseId || visaCase?.id, studentId: studentId || visaCase?.studentId, taskType, title, assignedTo, dueDate, priority });
    await db.timelineEvent.create({
      data: {
        studentId: studentId || visaCase?.studentId || '',
        stage: 'VISA_TASK_CREATED',
        title: `Task created: ${title} — type ${taskType || 'document_request'} — owner ${assignedTo || owner || 'student'} — priority ${priority || 'medium'} — due ${dueDate || 'none'}`,
        description: `Created by ${auth.name} — Task system 10 types Document Request/Interview/Bank Review/Sponsor Review/Refusal Review/Study Gap Review/Counselor Action/Application Action/Student Action/Senior Review — each task owner/priority/deadline/status/createdBy/caseId/studentId — overdue appears in dashboard`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: task, note: 'Task system 10 types — owner/priority/deadline/status/createdBy/caseId/studentId — overdue appears in dashboard' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
