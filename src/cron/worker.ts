/**
 * ALO Education Background Worker / Cron Scheduler
 * Handles SLA monitoring, Agent task queues, and scheduled jobs
 * Usage: npx tsx src/cron/worker.ts
 */

import { db } from "@/lib/db";
import cronParser from "cron-parser";// Helper to wait
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function processSLAEvents() {
    try {
        console.log(`[SLA] Checking for overdue SLA events...`);
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

        // Find unresolved SLA events where first message was >30 mins ago and not yet escalated
        const overdueEvents = await db.slaEvent.findMany({
            where: {
                resolvedAt: null,
                escalatedAt: null,
                firstMessageAt: { lt: thirtyMinutesAgo }
            }
        });

        for (const event of overdueEvents) {
            console.log(`[SLA Escalation] Escalating event ${event.id} for student ${event.studentId}`);
            await db.slaEvent.update({
                where: { id: event.id },
                data: {
                    escalatedAt: now,
                    escalatedToRole: "branch_manager",
                    eventType: "breached"
                }
            });

            // Create notification or task for branch manager
            await db.portalNotification.create({
                data: {
                    userId: event.escalatedToId || "branch-mgr",
                    title: "⚠️ 30-Min SLA Breached",
                    message: `Conversation with student ${event.studentId} exceeded 30-minute SLA window. Escalated to Branch Manager.`,
                    type: "SLA_BREACH",
                    isRead: false,
                }
            }).catch(() => {});
        }
    } catch (e) {
        console.error("[SLA Error]", e);
    }
}

async function processAgentSchedules() {
    try {
        const now = new Date();
        const schedules = await db.agentSchedule.findMany({
            where: { isActive: true }
        });

        for (const sched of schedules) {
            try {
                // Parse cron in context of its timezone (default Asia/Dhaka)
                const interval = cronParser.parse(sched.cronExpression, { tz: sched.timezone });
                
                // If it never ran, or if current time is past nextRunAt
                if (!sched.lastRunAt || (sched.nextRunAt && now >= sched.nextRunAt)) {
                    console.log(`[Agent Cron] Triggering schedule: ${sched.name} for Agent ${sched.agentId}`);
                    
                    // 1. Create the task
                    await db.agentTask.create({
                        data: {
                            taskCode: `TSK-CRON-${Date.now()}`,
                            agentId: sched.agentId,
                            triggeredBy: "system_cron",
                            triggerType: "cron",
                            input: sched.inputPayload,
                            output: "",
                            status: "pending",
                            entityType: "schedule",
                            entityId: sched.id,
                            errorMessage: ""
                        }
                    });

                    // 2. Update next run time
                    const nextDate = interval.next().toDate();
                    await db.agentSchedule.update({
                        where: { id: sched.id },
                        data: {
                            lastRunAt: now,
                            nextRunAt: nextDate
                        }
                    });
                }
            } catch (cronErr) {
                console.error(`[Agent Cron] Invalid cron expression for schedule ${sched.id}:`, cronErr);
            }
        }
    } catch (e) {
        console.error("[Agent Cron Error]", e);
    }
}

async function processWhatsAppFollowUps() {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Find unread student messages older than 1 hour without reply
        const unrepliedMessages = await db.studentMessage.findMany({
            where: {
                isRead: false,
                createdAt: { lt: oneHourAgo }
            },
            take: 20
        });

        for (const msg of unrepliedMessages) {
            // Check if follow-up task exists
            const existingTask = await db.counselorTask.findFirst({
                where: {
                    studentId: msg.studentId,
                    type: "WhatsApp Follow-up",
                    status: "pending"
                }
            });

            if (!existingTask && msg.studentId) {
                await db.counselorTask.create({
                    data: {
                        employeeId: "emp-counselor",
                        studentId: msg.studentId,
                        type: "WhatsApp Follow-up",
                        title: `Follow up on unread message from ${msg.senderName || 'student'}`,
                        priority: "HIGH",
                        status: "pending",
                        dueDate: now.toISOString()
                    }
                }).catch(() => {});
            }
        }
    } catch (e) {
        console.error("[WhatsApp FollowUp Error]", e);
    }
}

async function main() {
    console.log("🚀 ALO Education Worker Started.");
    console.log("Monitoring SLA, Agent Schedules, and WhatsApp Follow-Ups...");

    // Run indefinitely
    while (true) {
        await Promise.allSettled([
            processSLAEvents(),
            processAgentSchedules(),
            processWhatsAppFollowUps()
        ]);
        
        // Wait 60 seconds before next polling cycle
        await delay(60000);
    }
}

main().catch(err => {
    console.error("Worker crashed:", err);
    process.exit(1);
});
