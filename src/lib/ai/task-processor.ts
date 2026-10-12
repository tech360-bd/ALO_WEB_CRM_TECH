import { orchestrate } from './orchestrator';
import type { RequestPriority, AutomationClass } from './types';
import { db } from '@/lib/db';

function mapPriorityToRequestPriority(priority: number): RequestPriority {
  if (priority <= 1) return 'critical';
  if (priority <= 3) return 'high';
  if (priority <= 6) return 'normal';
  return 'low';
}

class TaskProcessor {
  private static MAX_CONCURRENT = 3;
  private static MAX_BATCH_SIZE = 10;
  private processing: Set<string> = new Set();

  /**
   * Process the next batch of QUEUED AI tasks through the orchestrator.
   * Respects MAX_CONCURRENT concurrency and processes up to `limit` tasks.
   */
  async processNext(
    limit: number = TaskProcessor.MAX_BATCH_SIZE,
  ): Promise<{ processed: number; completed: number; failed: number }> {
    const queued = await db.aiTask.findMany({
      where: { status: 'QUEUED' },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });

    if (queued.length === 0) {
      return { processed: 0, completed: 0, failed: 0 };
    }

    console.log(`[TaskProcessor] Starting batch of ${queued.length}`);

    const results = { processed: 0, completed: 0, failed: 0 };
    const slots = TaskProcessor.MAX_CONCURRENT - this.processing.size;
    const batch = queued.slice(0, Math.max(0, slots));

    const promises = batch.map((task) => this.processTask(task));
    const batchResults = await Promise.allSettled(promises);

    for (const r of batchResults) {
      results.processed++;
      if (r.status === 'fulfilled' && r.value === 'completed') {
        results.completed++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Process up to MAX_BATCH_SIZE tasks, respecting MAX_CONCURRENT.
   */
  async processBatch(): Promise<{
    processed: number;
    completed: number;
    failed: number;
  }> {
    return this.processNext(TaskProcessor.MAX_BATCH_SIZE);
  }

  /**
   * Get current queue statistics from DB + in-flight tracking.
   */
  async getQueueStats(): Promise<{
    queued: number;
    running: number;
    processing: number;
  }> {
    const [queued, running] = await Promise.all([
      db.aiTask.count({ where: { status: 'QUEUED' } }),
      db.aiTask.count({ where: { status: 'RUNNING' } }),
    ]);

    return {
      queued,
      running,
      processing: this.processing.size,
    };
  }

  /**
   * Clear the in-flight tracking set for graceful shutdown.
   */
  cleanup(): void {
    this.processing.clear();
  }

  // ------------------------------------------------------------------
  // Private
  // ------------------------------------------------------------------

  private async processTask(
    task: Awaited<
      ReturnType<typeof db.aiTask.findMany>
    >[number],
  ): Promise<'completed' | 'failed'> {
    // a) Task already read from DB
    // b) Skip if already in-flight
    if (this.processing.has(task.id)) {
      return 'failed';
    }

    this.processing.add(task.id);

    try {
      // c) Set status to RUNNING, set startedAt
      await db.aiTask.update({
        where: { id: task.id },
        data: { status: 'RUNNING', startedAt: new Date() },
      });

      // d) Parse input JSON
      let parsedInput: Record<string, unknown> = {};
      try {
        parsedInput =
          typeof task.input === 'string'
            ? JSON.parse(task.input)
            : ((task.input as unknown) as Record<string, unknown>);
      } catch {
        parsedInput = {};
      }

      // e) Resolve agent code & department code
      let agentCode: string | undefined;
      let departmentCode: string | undefined;

      if (task.agentId) {
        const agent = await db.aiAgent.findUnique({
          where: { id: task.agentId },
          select: { code: true },
        });
        if (agent && agent.code) agentCode = agent.code;
      }

      if (task.departmentId) {
        const department = await db.aiDepartment.findUnique({
          where: { id: task.departmentId },
          select: { code: true },
        });
        if (department && department.code) departmentCode = department.code;
      }

      // f) Map numeric priority to RequestPriority
      const priority = mapPriorityToRequestPriority(
        typeof task.priority === 'number' ? task.priority : 5,
      );

      // g) Extract userId from metadata if available
      const metadata =
        typeof task.metadata === 'string'
          ? JSON.parse(task.metadata)
          : (task.metadata as Record<string, unknown> | null) ?? {};
      const userId = metadata.userId as string | undefined;

      // Call orchestrator — pass existingTaskId to avoid duplicate AiTask creation
      const result = await orchestrate({
        taskType: task.type as string,
        input: parsedInput,
        departmentCode,
        agentCode,
        priority,
        userId,
        automationClass: task.automationClass as AutomationClass,
        requiresApproval: task.requiresApproval ?? false,
        existingTaskId: task.id,
      });

      // h) The orchestrator already updated the task status (COMPLETED or FAILED)
      //    No need to update again — just log and return.
      if (result.success !== false) {
        console.log(`[TaskProcessor] Task ${task.id} → COMPLETED (orchestrator handled)`);
        return 'completed';
      } else {
        // Orchestrator already set FAILED status; only update if it somehow didn't
        const current = await db.aiTask.findUnique({
          where: { id: task.id },
          select: { status: true },
        });
        if (current && current.status === 'RUNNING') {
          await db.aiTask.update({
            where: { id: task.id },
            data: {
              status: 'FAILED',
              error: result.error ?? 'Orchestration returned failure',
            },
          });
        }
        console.log(
          `[TaskProcessor] Task ${task.id} → FAILED: ${result.error ?? 'unknown'}`,
        );
        return 'failed';
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      try {
        await db.aiTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', error: errorMessage },
        });
      } catch {
        // Best-effort DB update — don't mask the original error
      }

      console.log(`[TaskProcessor] Task ${task.id} → FAILED: ${errorMessage}`);
      return 'failed';
    } finally {
      // i) Always remove from in-flight tracking
      this.processing.delete(task.id);
    }
  }
}

/** Singleton task processor instance */
export const taskProcessor = new TaskProcessor();
