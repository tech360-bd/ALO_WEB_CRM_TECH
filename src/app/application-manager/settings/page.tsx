'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, FileCheck, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div><h1 className="text-xl font-bold text-[var(--alo-text)]">Application Manager Settings</h1><p className="text-sm text-[var(--alo-text-muted)]">Permissions, B2B confidentiality, audit logging, safe status mapping</p></div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
            <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-[var(--alo-brand)]" />Permissions — Existing Naming Verified</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              {['application.view','application.create','application.update','application.delete','application.review_documents','application.submit','application.manage_offer','application.manage_cas_i20_coe','application.manage_deadlines','application.view_b2b','application.manage_b2b','application.view_b2b_commission','application.manage_b2b_providers','application.view_reports','application.export','application.internal_comments'].map(p=>(
                <div key={p} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2.5 flex items-center justify-between"><span className="font-mono text-[var(--alo-text)]">{p}</span><Badge className="bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px]">VERIFIED</Badge></div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Card className="bg-white border-crm-warning-border shadow-sm rounded-xl">
            <CardHeader className="p-4 border-b border-crm-warning-border bg-crm-warning-bg/50 rounded-t-xl"><CardTitle className="text-sm flex items-center gap-2 text-crm-warning-text"><Lock className="w-4 h-4" />B2B Confidentiality — Backend Security</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="bg-crm-warning-bg border border-crm-warning-border rounded-xl p-3"><p className="font-semibold text-crm-warning-text">Fields protected at API/DB response level</p><p className="text-crm-warning-text mt-1">provider name/ID/contact/email/phone/portal URL/credentials/reference/submission method/commission/payment condition/claim stage/internal notes/attachments/agreement/timeline/comments — only APPLICATION_MANAGER/APPLICATION_TEAM/SUPER_ADMIN default, VISA_OFFICER no unless granted, FINANCE only payment/commission status with permission, COUNSELOR/PARTNER/STUDENT/FRONT_DESK/MARKETING/GENERAL_STAFF no.</p></div>
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="font-semibold">Backend enforcement</p><ul className="list-disc ml-4 mt-1 space-y-1 text-[var(--alo-body)]"><li>Unauthorized B2B API returns 403</li><li>Normal application response omits B2B provider fields — not display:none frontend only</li><li>Comments filtered by visibility — B2B_CONFIDENTIAL only authorized</li><li>Timeline anonymized — internal Submitted through B2B Provider X → student-safe Application Submitted</li><li>Credentials never in notifications/templates/portals</li><li>No B2B in logs/analytics/marketing/public pages</li></ul></div>
              <div className="bg-crm-warning-bg border border-crm-warning-border rounded-xl p-3 flex gap-2"><AlertTriangle className="w-4 h-4 text-crm-warning-text flex-shrink-0" /><p className="text-crm-warning-text">All B2B fields encrypted, audit logged with auditId/actorUserId/actorRole/action/entityType/entityId/studentId/before/after/ip/session/createdAt.</p></div>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-12">
          <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
            <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm flex items-center gap-2"><FileCheck className="w-4 h-4 text-[var(--alo-brand)]" />Safe Status Mapping — 30+ Internal Stages → 8 Safe Statuses</CardTitle></CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {[
                  { safe:'DRAFT', stages:'APPLICATION_DRAFT, counseling, research' },
                  { safe:'UNDER_REVIEW', stages:'PROFILE_REVIEW, DOCUMENT_REVIEW, TEAM_REVIEW, active' },
                  { safe:'DOCUMENTS_REQUIRED', stages:'DOCUMENT_COLLECTION, DOCUMENTS_REQUIRED, MORE_DOCUMENTS_REQUESTED' },
                  { safe:'SUBMITTED', stages:'READY_TO_SUBMIT, SUBMITTED_TO_ALO_APPLICATION_TEAM, SUBMITTED_TO_B2B, SUBMITTED_TO_UNIVERSITY, ACKNOWLEDGEMENT_RECEIVED' },
                  { safe:'DECISION_PENDING', stages:'DECISION_PENDING, INTERVIEW_REQUIRED, INTERVIEW_SCHEDULED' },
                  { safe:'OFFER_RECEIVED', stages:'CONDITIONAL_OFFER, UNCONDITIONAL_OFFER, DEPOSIT_PENDING, DEPOSIT_PAID' },
                  { safe:'REJECTED', stages:'REJECTED, WITHDRAWN' },
                  { safe:'DEFERRED', stages:'DEFERRED' },
                  { safe:'VISA_PREPARATION', stages:'CAS_PENDING, CAS_RECEIVED, I20_PENDING, I20_RECEIVED, COE_PENDING, COE_RECEIVED, VISA_HANDOVER_READY, VISA_FILE_CREATED, CLOSED' },
                ].map(m=>(
                  <div key={m.safe} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="font-semibold text-[var(--alo-text)]">{m.safe}</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-1">{m.stages}</p></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
