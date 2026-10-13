import { NextRequest, NextResponse } from 'next/server';
import { orchestrate } from '@/lib/ai/orchestrator';
import {
  eventRouter,
  type BusinessEvent,
  type EventType,
} from '@/lib/ai/event-router';
import { taskProcessor } from '@/lib/ai/task-processor';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

type SmokeTestResult = {
  testNumber: number;
  testType: string;
  taskId: string | null;
  status: string;
  success: boolean;
  latencyMs: number;
  tokensUsed: number;
  error?: string;
};

type SmokeTestResponse = {
  smokeTests: SmokeTestResult[];
  eventRouterTest: {
    dispatched: string[];
    queueStats: Record<string, unknown>;
  };
  queueProcessing: {
    processed: number;
    completed: number;
    failed: number;
  };
  totalPassed: number;
  totalFailed: number;
  timestamp: string;
};

const SMOKE_TESTS: {
  testNumber: number;
  testType: string;
  departmentCode: string;
  input: Record<string, unknown>;
  priority: 'normal' | 'low';
}[] = [
  {
    testNumber: 1,
    testType: 'lead_classification',
    departmentCode: 'LEAD_CLASSIFY',
    priority: 'normal',
    input: {
      leadId: 'smoke-test-lead-001',
      fullName: 'Rahim Uddin',
      email: 'rahim@test.com',
      phone: '+8801712345678',
      source: 'WEBSITE',
      preferredCountry: 'UK',
      preferredCourse: 'MBA',
      message: 'I want to study MBA in UK with scholarship',
    },
  },
  {
    testNumber: 2,
    testType: 'lead_scoring',
    departmentCode: 'LEAD_SCORING',
    priority: 'normal',
    input: {
      leadId: 'smoke-test-lead-001',
      fullName: 'Rahim Uddin',
      email: 'rahim@test.com',
      source: 'WEBSITE',
      preferredCountry: 'UK',
      preferredCourse: 'MBA',
    },
  },
  {
    testNumber: 3,
    testType: 'lead_tagging',
    departmentCode: 'LEAD_TAGGING',
    priority: 'normal',
    input: {
      leadId: 'smoke-test-lead-001',
      fullName: 'Rahim Uddin',
      preferredCountry: 'UK',
      preferredCourse: 'MBA',
      source: 'WEBSITE',
    },
  },
  {
    testNumber: 4,
    testType: 'follow_up_draft',
    departmentCode: 'FOLLOWUP_MGMT',
    priority: 'normal',
    input: {
      leadId: 'smoke-test-lead-001',
      fullName: 'Rahim Uddin',
      email: 'rahim@test.com',
      preferredCountry: 'UK',
      preferredCourse: 'MBA',
      source: 'WEBSITE',
    },
  },
  {
    testNumber: 5,
    testType: 'profile_analysis',
    departmentCode: 'STUDENT_SUPPORT',
    priority: 'normal',
    input: {
      studentId: 'smoke-test-student-001',
      fullName: 'Fatima Akter',
      studyDestination: 'UK',
      programTitle: 'MSc Computer Science',
      studyLevel: 'MASTERS',
    },
  },
  {
    testNumber: 6,
    testType: 'application_status_analysis',
    departmentCode: 'APP_PROCESSING',
    priority: 'normal',
    input: {
      applicationId: 'smoke-test-app-001',
      stage: 'DOCUMENTS_PENDING',
      studentName: 'Fatima Akter',
      university: 'University of Manchester',
      course: 'MSc Computer Science',
    },
  },
  {
    testNumber: 7,
    testType: 'missing_requirements_check',
    departmentCode: 'APP_PROCESSING',
    priority: 'normal',
    input: {
      applicationId: 'smoke-test-app-001',
      stage: 'DOCUMENTS_PENDING',
      studentName: 'Fatima Akter',
      university: 'University of Manchester',
      course: 'MSc Computer Science',
    },
  },
  {
    testNumber: 8,
    testType: 'document_classification',
    departmentCode: 'DOC_PROCESSING',
    priority: 'normal',
    input: {
      documentId: 'smoke-test-doc-001',
      category: 'TRANSCRIPT',
      fileName: 'transcript_bsc.pdf',
      studentId: 'smoke-test-student-001',
    },
  },
  {
    testNumber: 9,
    testType: 'content_generation',
    departmentCode: 'CONTENT_PROD',
    priority: 'low',
    input: {
      topic: 'Why Study in UK 2025',
      targetAudience: 'Bangladeshi students',
      format: 'blog_post',
      tone: 'professional',
    },
  },
  {
    testNumber: 10,
    testType: 'report_generation',
    departmentCode: 'ANALYTICS_RPT',
    priority: 'low',
    input: {
      reportType: 'daily_summary',
      date: new Date().toISOString().split('T')[0],
      metrics: ['leads', 'applications', 'conversions'],
    },
  },
];

async function runOrchestrationTest(
  test: (typeof SMOKE_TESTS)[number]
): Promise<SmokeTestResult> {
  const startTime = Date.now();

  try {
    const result = await orchestrate({
      taskType: test.testType,
      input: test.input,
      departmentCode: test.departmentCode,
      priority: test.priority,
      automationClass: 'AI_AUTOMATABLE',
    });

    return {
      testNumber: test.testNumber,
      testType: test.testType,
      taskId: result.taskId ?? null,
      status: result.status,
      success: result.success,
      latencyMs: result.latencyMs,
      tokensUsed: result.tokensUsed ?? 0,
    };
  } catch (err: unknown) {
    return {
      testNumber: test.testNumber,
      testType: test.testType,
      taskId: null,
      status: 'ERROR',
      success: false,
      latencyMs: Date.now() - startTime,
      tokensUsed: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runEventRouterTest(): Promise<{
  dispatched: string[];
  queueStats: Record<string, unknown>;
}> {
  const dispatched: string[] = [];

  try {
    const event: BusinessEvent = {
      type: 'NEW_LEAD' as EventType,
      entityType: 'Lead',
      entityId: 'smoke-test-lead-001',
      data: {
        fullName: 'Rahim Uddin',
        email: 'rahim@test.com',
        phone: '+8801712345678',
        source: 'WEBSITE',
        preferredCountry: 'UK',
        preferredCourse: 'MBA',
        message: 'I want to study MBA',
      },
    };

    const dispatchResult = await eventRouter.dispatch(event);
    dispatched.push(
      typeof dispatchResult === 'string'
        ? dispatchResult
        : JSON.stringify(dispatchResult)
    );
  } catch (err: unknown) {
    dispatched.push(
      `ERROR: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let queueStats: Record<string, unknown> = {};
  try {
    queueStats = await taskProcessor.getQueueStats();
  } catch {
    queueStats = { note: 'Could not retrieve queue stats' };
  }

  return { dispatched, queueStats };
}

async function runQueueProcessing(): Promise<{
  processed: number;
  completed: number;
  failed: number;
}> {
  try {
    const batchResult = await taskProcessor.processBatch();
    return {
      processed: batchResult.processed ?? 0,
      completed: batchResult.completed ?? 0,
      failed: batchResult.failed ?? 0,
    };
  } catch {
    return { processed: 0, completed: 0, failed: 0 };
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const smokeTests: SmokeTestResult[] = [];

  for (const test of SMOKE_TESTS) {
    const result = await runOrchestrationTest(test);
    smokeTests.push(result);
  }

  const eventRouterTest = await runEventRouterTest();

  const queueProcessing = await runQueueProcessing();

  const totalPassed = smokeTests.filter((t) => t.success).length;
  const totalFailed = smokeTests.filter((t) => !t.success).length;

  const response: SmokeTestResponse = {
    smokeTests,
    eventRouterTest,
    queueProcessing,
    totalPassed,
    totalFailed,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
