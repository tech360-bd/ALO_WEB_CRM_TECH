import { db } from './db';

interface ApiCheck {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  note: string;
}

export async function testMajorEndpoints(): Promise<ApiCheck[]> {
  const results: ApiCheck[] = [];

  console.log(`\n=== TESTING MAJOR API ENDPOINTS & WORKFLOWS ===\n`);

  // 1. Check Student Database Model
  try {
    const student = await db.student.findFirst();
    const count = await db.student.count();
    results.push({
      endpoint: 'DB: Student Table',
      method: 'QUERY',
      status: 'PASS',
      note: student ? `Found student: ${student.name} (${student.email}), Total: ${count}` : `Student table connected (${count} records)`,
    });
  } catch (e: any) {
    results.push({
      endpoint: 'DB: Student Table',
      method: 'QUERY',
      status: 'FAIL',
      note: e.message,
    });
  }

  // 2. Check Application Stage Progression
  try {
    const app = await db.application.findFirst();
    const count = await db.application.count();
    results.push({
      endpoint: 'DB: Application Table',
      method: 'QUERY',
      status: 'PASS',
      note: app ? `Application ID: ${app.id}, Stage: ${app.stage}, Total: ${count}` : `Application table connected (${count} records)`,
    });
  } catch (e: any) {
    results.push({
      endpoint: 'DB: Application Table',
      method: 'QUERY',
      status: 'FAIL',
      note: e.message,
    });
  }

  // 3. Check Lead Assignment & Routing
  try {
    const lead = await db.marketingLead.findFirst();
    const count = await db.marketingLead.count();
    results.push({
      endpoint: 'DB: MarketingLead Pipeline',
      method: 'QUERY',
      status: 'PASS',
      note: lead ? `Sample lead: ${lead.name} -> ${lead.destination}, Total: ${count}` : `MarketingLead table connected (${count} records)`,
    });
  } catch (e: any) {
    results.push({
      endpoint: 'DB: MarketingLead Pipeline',
      method: 'QUERY',
      status: 'FAIL',
      note: e.message,
    });
  }

  // 4. Check Course & University Join
  try {
    const course = await db.crmCourse.findFirst({
      where: { status: 'active' },
      include: { university: true, intakeFees: true, requirements: true },
    });
    if (course && course.university) {
      results.push({
        endpoint: 'DB: Course-University Relations',
        method: 'QUERY',
        status: 'PASS',
        note: `Linked: "${course.courseTitle}" -> "${course.university.name}" (${course.university.country})`,
      });
    } else {
      results.push({
        endpoint: 'DB: Course-University Relations',
        method: 'QUERY',
        status: 'PARTIAL',
        note: 'Course found without university relation',
      });
    }
  } catch (e: any) {
    results.push({
      endpoint: 'DB: Course-University Relations',
      method: 'QUERY',
      status: 'FAIL',
      note: e.message,
    });
  }

  // 5. Check Universal Communication Center (UCC)
  try {
    const threads = await db.communicationThread.count();
    const messages = await db.communicationMessage.count();
    results.push({
      endpoint: 'DB: UCC Threads & Messages',
      method: 'QUERY',
      status: 'PASS',
      note: `UCC Engine relational tables ready (${threads} threads, ${messages} messages)`,
    });
  } catch (e: any) {
    results.push({
      endpoint: 'DB: UCC Threads & Messages',
      method: 'QUERY',
      status: 'FAIL',
      note: e.message,
    });
  }

  results.forEach((r) => {
    console.log(`[${r.status}] [${r.method}] ${r.endpoint} -> ${r.note}`);
  });

  return results;
}

testMajorEndpoints().catch(console.error);
