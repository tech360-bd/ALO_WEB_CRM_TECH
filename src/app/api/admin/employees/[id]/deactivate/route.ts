// ============================================================
// POST /api/admin/employees/[id]/deactivate
// Deactivate an employee without deleting employee or CRM history.
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { logSecurityAudit } from '@/lib/access-control/central-security-engine';
import { buildDeactivationPlan } from '@/lib/employees/lifecycle';

const DEACTIVATION_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']);
class ReassignmentRequiredError extends Error {}
class ReassignmentTargetUnavailableError extends Error {}

async function handlePost(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase()));
  if (![...roles].some((role) => DEACTIVATION_ROLES.has(role))) {
    return NextResponse.json({ success: false, error: 'HR or administrator access is required.' }, { status: 403 });
  }

  try {
    const { id } = await context!.params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'A valid request body is required.' }, { status: 400 });
    }
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const reassignTo = typeof body.reassignTo === 'string' ? body.reassignTo.trim() : '';
    if (reason.length > 1000 || reassignTo.length > 191) {
      return NextResponse.json({ success: false, error: 'Reason or reassignment target is too long.' }, { status: 400 });
    }

    const employee = await db.employee.findUnique({ where: { id } });
    if (!employee) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    if (String(employee.status).toUpperCase() === 'TERMINATED') {
      return NextResponse.json({
        success: false,
        code: 'ALREADY_TERMINATED',
        error: 'Employee is already terminated; history is preserved.',
      }, { status: 409 });
    }

    const plan = buildDeactivationPlan(employee.employeeId || employee.id, employee.status, reason);
    if (!plan.ok) return NextResponse.json({ success: false, error: plan.error }, { status: 400 });

    const portalUser = employee.userId
      ? await db.portalUser.findUnique({ where: { id: employee.userId } }).catch(() => null)
      : await db.portalUser.findUnique({ where: { email: employee.email.toLowerCase() } }).catch(() => null);
    const legacyUser = await db.user.findUnique({ where: { email: employee.email.toLowerCase() } }).catch(() => null);
    if (portalUser && portalUser.userType !== 'EMPLOYEE') {
      return NextResponse.json({ success: false, error: 'Linked portal account is not an employee.' }, { status: 409 });
    }
    if (legacyUser && ['STUDENT', 'PARTNER'].includes(legacyUser.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'Linked legacy account is not an employee.' }, { status: 409 });
    }

    let reassignmentTarget: { id: string; userId: string; name: string; role: string } | null = null;
    let reassignmentLoginActive = false;
    if (reassignTo) {
      const target = await db.employee.findUnique({
        where: { id: reassignTo },
        select: { id: true, userId: true, name: true, role: true, status: true },
      });
      if (!target || target.id === employee.id || target.status.toLowerCase() !== 'active') {
        return NextResponse.json({ success: false, error: 'Reassignment target must be a different active employee.' }, { status: 409 });
      }
      const targetUser = await db.portalUser.findUnique({
        where: { id: target.userId },
        select: { id: true, status: true, emailVerified: true },
      });
      if (!targetUser || targetUser.status.toLowerCase() !== 'active' || !targetUser.emailVerified) {
        return NextResponse.json({ success: false, error: 'Reassignment target does not have an active, verified login.' }, { status: 409 });
      }
      reassignmentLoginActive = true;
      reassignmentTarget = { id: target.id, userId: targetUser.id, name: target.name, role: target.role };
    }

    const identityIds = [...new Set([employee.id, employee.userId, employee.employeeId].filter((value): value is string => !!value))];
    const auditNow = new Date();
    const result = await db.$transaction(async (tx) => {
      // Revoke both the CRM projection and the authenticating principal. A
      // revoked session alone is insufficient because the user could log in
      // again while PortalUser.status remains active.
      await tx.employee.update({ where: { id }, data: { status: 'terminated' } });
      if (portalUser) await tx.portalUser.update({ where: { id: portalUser.id }, data: { status: 'terminated' } });
      if (legacyUser) await tx.user.update({ where: { id: legacyUser.id }, data: { status: 'TERMINATED' } });

      const sessions = portalUser
        ? await tx.portalSession.updateMany({ where: { userId: portalUser.id, revokedAt: null }, data: { revokedAt: auditNow } })
        : { count: 0 };
      const activationTokens = employee.userId
        ? await tx.employeeActivationToken.updateMany({ where: { employeeId: employee.userId, status: 'active' }, data: { status: 'expired' } })
        : { count: 0 };
      const featureRules = await tx.featureAccessRule.updateMany({
        where: { ownerId: { in: identityIds }, ownerType: 'user', isEnabled: true },
        data: { isEnabled: false },
      });
      const temporaryPermissions = await tx.employeeTemporaryPermission.updateMany({
        where: { employeeId: { in: identityIds }, OR: [{ isActive: true }, { active: true }] },
        data: { isActive: false, active: false },
      });
      const devices = await tx.employeeDevice.updateMany({
        where: { employeeId: { in: identityIds }, status: { not: 'returned' } },
        data: { status: 'return_pending' },
      });
      const communicationProfiles = await tx.employeeCommunicationProfile.updateMany({
        where: { employeeId: { in: identityIds } },
        data: {
          status: 'offboarded',
          whatsappAccess: false,
          facebookAccess: false,
          instagramAccess: false,
          emailAccess: false,
          channelPermissions: '{}',
          assignedPages: '[]',
          offboardedAt: auditNow,
          offboardedById: auth.userId,
          offboardingNote: reason,
        },
      });
      const personalAccounts = await tx.socialAccountOwnership.updateMany({
        where: { ownerEmployeeId: { in: identityIds }, accountType: 'EMPLOYEE_PERSONAL' },
        data: {
          ownerEmployeeId: null,
          permissions: '[]',
          connectionStatus: 'DISCONNECTED',
          tokenStatus: 'REVOKED',
          webhookStatus: 'INACTIVE',
          requiresConfig: true,
        },
      });

      if (!reassignmentTarget) {
        const [students, applications, leads, partnerLeads, tasks, communicationTasks, threads, conversations, approvals, approvalQueueItems, escalations, communicationEscalations] = await Promise.all([
          tx.student.count({ where: { counselorId: employee.id } }),
          tx.application.count({ where: { counselorId: employee.id } }),
          tx.lead.count({ where: { counselorId: employee.id } }),
          tx.partnerLead.count({ where: { assignedCounselorId: employee.id } }),
          tx.task.count({ where: { assigneeId: { in: identityIds }, status: { not: 'COMPLETED' } } }),
          tx.communicationTask.count({ where: { assignedTo: { in: identityIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
          tx.communicationThread.count({ where: { assignedToId: { in: identityIds }, status: { not: 'closed' } } }),
          employee.userId ? tx.uccConversation.count({ where: { assignedToUserId: employee.userId, status: { not: 'closed' } } }) : 0,
          tx.approvalRequest.count({ where: { assignedToId: { in: identityIds }, status: 'pending' } }),
          tx.approvalQueueItem.count({ where: { assignedTo: { in: identityIds }, status: { in: ['PENDING', 'RECHECK_REQUESTED'] } } }),
          tx.escalationEvent.count({ where: { OR: [{ counselorId: { in: identityIds } }, { supervisorId: { in: identityIds } }], status: { in: ['OPEN', 'ACKNOWLEDGED'] } } }),
          tx.communicationEscalation.count({ where: { toUserId: { in: identityIds }, status: 'pending' } }),
        ]);
        const assignedWorkCount = students + applications + leads + partnerLeads + tasks + communicationTasks + threads + conversations + approvals + approvalQueueItems + escalations + communicationEscalations;
        if (assignedWorkCount > 0) throw new ReassignmentRequiredError('Unresolved assigned work exists; supply a different active, verified employee before deactivation.');
      }

      if (reassignmentTarget) {
        const freshTarget = await tx.employee.findUnique({ where: { id: reassignmentTarget.id }, select: { id: true, status: true, userId: true } });
        const freshUser = freshTarget?.userId ? await tx.portalUser.findUnique({ where: { id: freshTarget.userId }, select: { id: true, status: true, emailVerified: true } }) : null;
        if (!freshTarget || freshTarget.status.toLowerCase() !== 'active' || !freshUser || freshUser.status.toLowerCase() !== 'active' || !freshUser.emailVerified) {
          throw new ReassignmentTargetUnavailableError('Reassignment target must remain active with a verified login throughout deactivation.');
        }
      }

      let reassigned = 0;
      if (reassignmentTarget && reassignmentLoginActive) {
        const students = await tx.student.findMany({ where: { counselorId: employee.id }, select: { id: true } });
        if (students.length) {
          await tx.student.updateMany({
            where: { counselorId: employee.id },
            data: { counselorId: reassignmentTarget.id, counselorName: reassignmentTarget.name },
          });
          for (const item of students) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'student',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                assignedStudents: JSON.stringify([item.id]),
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += students.length;
        }

        const applications = await tx.application.findMany({ where: { counselorId: employee.id }, select: { id: true } });
        if (applications.length) {
          await tx.application.updateMany({
            where: { counselorId: employee.id },
            data: { counselorId: reassignmentTarget.id, counselorName: reassignmentTarget.name },
          });
          for (const item of applications) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'application',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                assignedApplications: JSON.stringify([item.id]),
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += applications.length;
        }

        const leads = await tx.lead.findMany({ where: { counselorId: employee.id }, select: { id: true } });
        if (leads.length) {
          await tx.lead.updateMany({ where: { counselorId: employee.id }, data: { counselorId: reassignmentTarget.id } });
          for (const item of leads) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'lead',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                assignedLeads: JSON.stringify([item.id]),
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += leads.length;
        }

        const partnerLeads = await tx.partnerLead.findMany({ where: { assignedCounselorId: employee.id }, select: { id: true } });
        if (partnerLeads.length) {
          await tx.partnerLead.updateMany({
            where: { assignedCounselorId: employee.id },
            data: { assignedCounselorId: reassignmentTarget.id, assignedCounselorName: reassignmentTarget.name },
          });
          for (const item of partnerLeads) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'partner_lead',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += partnerLeads.length;
        }

        const communicationTasks = await tx.communicationTask.findMany({
          where: { assignedTo: { in: identityIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
          select: { id: true },
        });
        if (communicationTasks.length) {
          await tx.communicationTask.updateMany({
            where: { assignedTo: { in: identityIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
            data: { assignedTo: reassignmentTarget.id },
          });
          for (const item of communicationTasks) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'communication_task',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += communicationTasks.length;
        }

        const approvalRequests = await tx.approvalRequest.findMany({
          where: { assignedToId: { in: identityIds }, status: 'pending' },
          select: { id: true },
        });
        if (approvalRequests.length) {
          await tx.approvalRequest.updateMany({
            where: { assignedToId: { in: identityIds }, status: 'pending' },
            data: { assignedToId: reassignmentTarget.userId, assignedToName: reassignmentTarget.name },
          });
          for (const item of approvalRequests) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'pending_approval',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += approvalRequests.length;
        }

        const approvalQueueItems = await tx.approvalQueueItem.findMany({
          where: { assignedTo: { in: identityIds }, status: { in: ['PENDING', 'RECHECK_REQUESTED'] } },
          select: { id: true },
        });
        if (approvalQueueItems.length) {
          await tx.approvalQueueItem.updateMany({
            where: { assignedTo: { in: identityIds }, status: { in: ['PENDING', 'RECHECK_REQUESTED'] } },
            data: { assignedTo: reassignmentTarget.userId },
          });
          for (const item of approvalQueueItems) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'approval_queue_item',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += approvalQueueItems.length;
        }

        const escalationEvents = await tx.escalationEvent.findMany({
          where: { OR: [{ counselorId: { in: identityIds } }, { supervisorId: { in: identityIds } }], status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
          select: { id: true },
        });
        if (escalationEvents.length) {
          await tx.escalationEvent.updateMany({ where: { counselorId: { in: identityIds }, status: { in: ['OPEN', 'ACKNOWLEDGED'] } }, data: { counselorId: reassignmentTarget.id } });
          await tx.escalationEvent.updateMany({ where: { supervisorId: { in: identityIds }, status: { in: ['OPEN', 'ACKNOWLEDGED'] } }, data: { supervisorId: reassignmentTarget.id } });
          for (const item of escalationEvents) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'escalation',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += escalationEvents.length;
        }

        const communicationEscalations = await tx.communicationEscalation.findMany({
          where: { toUserId: { in: identityIds }, status: 'pending' },
          select: { id: true },
        });
        if (communicationEscalations.length) {
          await tx.communicationEscalation.updateMany({
            where: { toUserId: { in: identityIds }, status: 'pending' },
            data: { toUserId: reassignmentTarget.userId },
          });
          for (const item of communicationEscalations) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'escalation',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += communicationEscalations.length;
        }

        const tasks = await tx.task.findMany({ where: { assigneeId: { in: identityIds }, status: { not: 'COMPLETED' } }, select: { id: true } });
        if (tasks.length) {
          await tx.task.updateMany({ where: { assigneeId: { in: identityIds }, status: { not: 'COMPLETED' } }, data: { assigneeId: reassignmentTarget.userId } });
          for (const item of tasks) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'task',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                assignedTasks: JSON.stringify([item.id]),
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += tasks.length;
        }

        const threads = await tx.communicationThread.findMany({
          where: { assignedToId: { in: identityIds }, status: { not: 'closed' } },
          select: { id: true },
        });
        if (threads.length) {
          await tx.communicationThread.updateMany({
            where: { assignedToId: { in: identityIds }, status: { not: 'closed' } },
            data: { assignedToId: reassignmentTarget.id, assignedToName: reassignmentTarget.name },
          });
          for (const item of threads) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'message',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += threads.length;
        }

        const conversations = employee.userId
          ? await tx.uccConversation.findMany({
              where: { assignedToUserId: employee.userId, status: { not: 'closed' } },
              select: { id: true },
            })
          : [];
        if (conversations.length) {
          await tx.uccConversation.updateMany({
            where: { assignedToUserId: employee.userId, status: { not: 'closed' } },
            data: { assignedToUserId: reassignmentTarget.userId, assignedRole: reassignmentTarget.role },
          });
          for (const item of conversations) {
            await tx.employeeReassignment.create({
              data: {
                fromEmployeeId: employee.id,
                toEmployeeId: reassignmentTarget.id,
                employeeId: employee.id,
                entityType: 'whatsapp_conversation',
                entityId: item.id,
                reason,
                assignedBy: auth.userId,
                createdBy: auth.userId,
                reassignedBy: auth.userId,
                status: 'completed',
                completedAt: auditNow,
              },
            });
          }
          reassigned += conversations.length;
        }
      }

      await logSecurityAudit({
        actorId: auth.userId,
        actorRole: [...roles].join(','),
        action: 'EMPLOYEE_DEACTIVATED',
        targetType: 'Employee',
        targetId: id,
        oldValue: JSON.stringify({ status: employee.status }),
        newValue: JSON.stringify({
          status: 'terminated',
          revocations: {
            sessions: sessions.count,
            activationTokens: activationTokens.count,
            featureRules: featureRules.count,
            temporaryPermissions: temporaryPermissions.count,
            devices: devices.count,
            communicationProfiles: communicationProfiles.count,
            personalAccounts: personalAccounts.count,
          },
          reassigned,
          preservedHistories: plan.preservedHistories,
        }),
      }, tx);

      const executed = {
        login: 'terminated',
        sessions: sessions.count,
        api_tokens: {
          status: 'NOT_CONFIGURED_IN_CURRENT_SCHEMA',
          providerRevocation: 'not performed by this local workflow',
        },
        whatsapp_access: {
          employeeProfilesOffboarded: communicationProfiles.count,
          providerTokenRevocation: 'not performed by this local workflow',
        },
        social_access: {
          employeeProfilesOffboarded: communicationProfiles.count,
          personalAccountsDisconnected: personalAccounts.count,
          officialProviderGrantRevocation: 'not performed by this local workflow',
        },
        email_integration_access: {
          employeeProfilesOffboarded: communicationProfiles.count,
          providerCredentialRevocation: 'not performed by this local workflow',
        },
        temporary_permissions: temporaryPermissions.count,
        ai_permissions: {
          featureAccessRulesDisabled: featureRules.count,
          dedicatedAiRuleCount: 'not separately measured',
        },
        device_access: devices.count,
        activation_tokens: activationTokens.count,
        feature_rules: featureRules.count,
        provider_token_revocation: 'not_performed_by_this_local_workflow',
      };

      return {
        executed: {
          login: executed.login,
          sessions: executed.sessions,
          api_tokens: executed.api_tokens,
          whatsapp_access: executed.whatsapp_access,
          social_access: executed.social_access,
          email_integration_access: executed.email_integration_access,
          temporary_permissions: executed.temporary_permissions,
          ai_permissions: executed.ai_permissions,
          device_access: executed.device_access,
          activation_tokens: executed.activation_tokens,
          feature_rules: executed.feature_rules,
          provider_token_revocation: executed.provider_token_revocation,
        },
        reassigned,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Employee access was revoked; local history was retained.',
      executed: result.executed,
      reassignedTo: reassignmentTarget?.id || null,
      reassignedEntities: result.reassigned,
      preservedHistories: plan.preservedHistories,
    });
  } catch (error) {
    if (error instanceof ReassignmentRequiredError) {
      return NextResponse.json({ success: false, code: 'REASSIGNMENT_REQUIRED', error: error.message }, { status: 409 });
    }
    if (error instanceof ReassignmentTargetUnavailableError) {
      return NextResponse.json({ success: false, code: 'REASSIGNMENT_TARGET_UNAVAILABLE', error: error.message }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Employee deactivation could not be completed.' }, { status: 503 });
  }
}

export const POST = withAuth(handlePost);
