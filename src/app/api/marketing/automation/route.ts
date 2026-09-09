import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function hasRole(auth: AuthContext, acceptedRoles: string[]): boolean {
  const normalized = new Set((auth.roles || []).map((role) => role.toUpperCase()));
  return acceptedRoles.some((role) => normalized.has(role.toUpperCase()));
}

function getMarketingAccess(auth: AuthContext) {
  const isSuperAdmin = hasRole(auth, ['SUPER_ADMIN', 'ADMIN']) || auth.userType.toUpperCase() === 'ADMIN';
  const isMarketingManager = hasRole(auth, ['MARKETING_MANAGER']);
  const isApprovedMarketingUser = hasRole(auth, ['MARKETING_STAFF', 'MARKETING']);

  return {
    isSuperAdmin,
    isMarketingManager,
    isApprovedMarketingUser,
    roleLabel: isSuperAdmin ? 'SUPER_ADMIN' : isMarketingManager ? 'MARKETING_MANAGER' : 'MARKETING_STAFF',
  };
}

function providerStatusLabel(input: {
  status?: string | null;
  webhookStatus?: string | null;
  healthStatus?: string | null;
  lastSyncAt?: Date | null;
  tokenExpiresAt?: Date | null;
}) {
  const status = (input.status || '').toLowerCase();
  const webhookStatus = (input.webhookStatus || '').toLowerCase();
  const tokenExpired = input.tokenExpiresAt ? input.tokenExpiresAt.getTime() <= Date.now() : false;

  if (tokenExpired) return 'TOKEN_EXPIRED';
  if (!status || ['disconnected', 'disabled'].includes(status)) return 'NOT_CONFIGURED';
  if (['error', 'connection_error'].includes(status)) return 'CONNECTION_ERROR';
  if (status === 'connected' && webhookStatus !== 'active') return 'PENDING_WEBHOOK_VERIFICATION';
  if (status === 'connected' && !input.lastSyncAt) return 'LIVE_TEST_PENDING';
  if (status === 'connected') return 'CONNECTED';

  return status.toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const access = getMarketingAccess(auth);

    if (!access.isSuperAdmin && !access.isMarketingManager && !access.isApprovedMarketingUser) {
      return NextResponse.json({ error: 'Forbidden. Marketing Manager or approved marketing role required.' }, { status: 403 });
    }

    const [
      activeCampaigns,
      pendingApprovals,
      stagedPosts,
      totalLeads,
      whatsappConversations,
      overdueSlaCount,
      ocrDocumentJobs,
      brandAssets,
      integrations,
      legacyConnectedAccounts,
    ] = await Promise.all([
      db.marketingCampaign.count({ where: { status: 'active' } }),
      db.marketingApproval.count({ where: { status: 'pending' } }),
      db.marketingGeneratedContent.count({ where: { status: 'draft' } }),
      db.marketingLead.count(),
      db.uccConversation.count({ where: { channel: 'whatsapp' } }),
      db.uccConversation.count({ where: { priority: 'urgent' } }),
      db.ocrJob.count(),
      db.marketingAsset.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      db.socialIntegration.findMany({
        select: {
          id: true,
          provider: true,
          name: true,
          status: true,
          webhookStatus: true,
          healthStatus: true,
          lastSyncAt: true,
          tokenExpiresAt: true,
          accounts: {
            select: {
              id: true,
              assetName: true,
              assetType: true,
              status: true,
              isPrimary: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      db.socialConnectedAccount.findMany({
        select: {
          id: true,
          platform: true,
          accountName: true,
          status: true,
          lastSyncAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      success: true,
      userRole: access.roleLabel,
      permissions: {
        canPublishSocial: access.isSuperAdmin || access.isMarketingManager,
        canApproveDrafts: access.isSuperAdmin || access.isMarketingManager,
        canCreateDrafts: true,
        canManageN8n: access.isSuperAdmin || access.isMarketingManager,
      },
      metrics: {
        activeCampaigns,
        pendingApprovals,
        stagedPosts,
        totalLeads,
        whatsappConversations,
        overdueSlaCount,
        ocrDocumentJobs,
      },
      brandAssets,
      providerStatuses: integrations.map((integration) => ({
        id: integration.id,
        provider: integration.provider,
        name: integration.name,
        status: providerStatusLabel(integration),
        webhookStatus: integration.webhookStatus,
        healthStatus: integration.healthStatus,
        lastSyncAt: integration.lastSyncAt,
        accounts: integration.accounts,
      })),
      legacyProviderRecords: legacyConnectedAccounts.map((account) => ({
        id: account.id,
        provider: account.platform,
        name: account.accountName,
        status: account.lastSyncAt && account.status.toLowerCase() === 'connected'
          ? 'LEGACY_CONNECTED_REVIEW_REQUIRED'
          : 'LEGACY_RECORD_REVIEW_REQUIRED',
        lastSyncAt: account.lastSyncAt,
      })),
      brandConfig: {
        primaryColor: '#E8501A',
        backgroundColor: '#FFFFFF',
        accentColor: '#0057B8',
        logoConfigured: brandAssets.some((a) => a.type === 'logo' || a.name.toLowerCase().includes('logo')),
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to load marketing automation dashboard', details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const roles = auth.roles || [];
    const access = getMarketingAccess(auth);

    if (!access.isSuperAdmin && !access.isMarketingManager) {
      return NextResponse.json({ error: 'Forbidden. Marketing Manager or Super Admin approval required for automation actions.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, payload } = body;

    if (action === 'TOGGLE_N8N_WORKFLOW') {
      const audit = await db.integrationAuditLog.create({
        data: {
          actorId: auth.userId,
          actorName: auth.name || auth.email,
          actorRole: roles.join(','),
          action: 'TOGGLE_N8N_WORKFLOW_REQUEST_BLOCKED',
          resourceType: 'n8n_workflow',
          resourceId: payload?.workflowId || 'global',
          newState: JSON.stringify(payload),
          result: 'blocked',
          errorMessage: 'No verified n8n provider integration is configured in this build.',
        },
      });

      return NextResponse.json({
        success: false,
        status: 'REQUIRES_PROVIDER_CONFIGURATION',
        auditId: audit.id,
        message: 'Workflow state was not changed because no verified n8n provider integration is configured.',
      }, { status: 409 });
    }

    if (action === 'UPLOAD_BRAND_LOGO') {
      if (!payload?.fileUrl || typeof payload.fileUrl !== 'string') {
        return NextResponse.json({ success: false, error: 'A validated uploaded file URL is required.' }, { status: 400 });
      }

      const asset = await db.marketingAsset.create({
        data: {
          name: payload?.title || 'Official ALO Education Logo',
          type: 'logo',
          url: payload.fileUrl,
          platform: 'brand',
          category: 'logo',
          createdById: auth.userId,
        },
      });

      return NextResponse.json({ success: true, asset, message: 'Brand logo uploaded and configured.' });
    }

    if (action === 'TRIGGER_COMMENT_AUTOMATION') {
      const keyword = typeof payload?.keyword === 'string' ? payload.keyword.trim() : '';
      if (!keyword) {
        return NextResponse.json({ success: false, error: 'Keyword is required.' }, { status: 400 });
      }

      const providerCount = await db.socialIntegration.count({
        where: {
          provider: { in: ['meta_business', 'facebook_page', 'instagram'] },
          status: 'connected',
          webhookStatus: 'active',
          lastSyncAt: { not: null },
        },
      });

      const draft = await db.marketingGeneratedContent.create({
        data: {
          contentType: 'messenger_reply',
          topic: `Comment keyword trigger: ${keyword}`,
          keywords: JSON.stringify([keyword]),
          platform: 'facebook',
          title: `Draft reply for "${keyword}" comments`,
          body: `Draft only. Requires approved Meta integration and Marketing Manager approval before any public reply or DM is sent.`,
          status: 'pending_approval',
          approvalRequired: true,
          createdById: auth.userId,
        },
      });

      const audit = await db.integrationAuditLog.create({
        data: {
          actorId: auth.userId,
          actorName: auth.name || auth.email,
          actorRole: roles.join(','),
          action: providerCount > 0 ? 'COMMENT_AUTOMATION_DRAFT_CREATED' : 'COMMENT_AUTOMATION_DRAFT_CREATED_PROVIDER_PENDING',
          resourceType: 'MarketingGeneratedContent',
          resourceId: draft.id,
          provider: 'meta',
          channel: 'facebook_comment',
          metadata: JSON.stringify({ keyword, providerReady: providerCount > 0 }),
          result: 'success',
        },
      });

      return NextResponse.json({
        success: true,
        status: providerCount > 0 ? 'DRAFT_CREATED_PENDING_APPROVAL' : 'DRAFT_CREATED_PROVIDER_CONFIGURATION_REQUIRED',
        keywordMatched: keyword,
        draftId: draft.id,
        auditId: audit.id,
        leadCreated: false,
        actionTaken: 'Created an approval-required reply draft only. No public comment, DM, or CRM lead was created.',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Automation action failed', details: getErrorMessage(error) }, { status: 500 });
  }
}
