// ============================================================
// ALO Work Classification Engine — 5-State Task Router (§9)
// Classifies every incoming work item into one of:
//   A — AI_AUTOMATABLE       → execute immediately (LOW risk, bounded)
//   B — AI_ASSISTED          → AI drafts, human reviews before send
//   C — HUMAN_REQUIRED       → human does it, AI may prepare context
//   D — HUMAN_APPROVAL_REQUIRED → AI executes but awaits approval before commit
//   E — ESCALATED            → anomaly / high-risk / policy breach → human queue
//
// Rules are deterministic + auditable; LLM is NOT used for classification decision
// to keep it cheap and explainable (LLM only for confidence note via ai-gateway).
// ============================================================

export type WorkClass = 'AI_AUTOMATABLE'|'AI_ASSISTED'|'HUMAN_REQUIRED'|'HUMAN_APPROVAL_REQUIRED'|'ESCALATED';

export interface ClassifyInput {
  workflow: string;
  actionType: string;
  payload?: Record<string, unknown>;
  riskLevel?: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
  requiresExternalSend?: boolean;
  requiresMoneyMovement?: boolean;
  requiresLegalCommitment?: boolean;
  containsPII?: boolean;
  confidence?: number; // 0-100 if available
}

export interface ClassifyResult {
  class: WorkClass;
  reason: string;
  ruleId: string;
  confidence: 'HIGH'|'MEDIUM'|'LOW';
}

// Deterministic rules — ordered (first match wins)
const RULES: Array<{ id: string; test:(i:ClassifyInput)=>boolean; out:WorkClass; reason:string }> = [
  { id:'R-E1', test:i=> i.riskLevel==='CRITICAL' || !!i.requiresMoneyMovement || !!i.requiresLegalCommitment, out:'ESCALATED', reason:'Critical risk / money / legal commitment requires human' },
  { id:'R-E2', test:i=> ['DELETE','DATA_DELETE','ROLE_CHANGE','PERMISSION_CHANGE','VISA_SUBMIT'].includes((i.actionType||'').toUpperCase()), out:'ESCALATED', reason:'Destructive or privileged action' },
  { id:'R-E3', test:i=> (i.confidence!==undefined && i.confidence < 40), out:'ESCALATED', reason:'Low AI confidence (<40) — escalate' },
  { id:'R-D1', test:i=> i.requiresExternalSend===true || ['MESSAGE_SEND_EXTERNAL','WHATSAPP_SEND','EMAIL_SEND','SMS_SEND','PUBLISH'].includes((i.actionType||'').toUpperCase()), out:'HUMAN_APPROVAL_REQUIRED', reason:'External communication needs human approval before send' },
  { id:'R-D2', test:i=> i.riskLevel==='HIGH', out:'HUMAN_APPROVAL_REQUIRED', reason:'High risk → human approval required' },
  { id:'R-C1', test:i=> ['HUMAN_INTERVIEW','COUNSELING_SESSION','VISA_INTERVIEW','PAYMENT_COLLECTION','LEGAL_REVIEW'].includes((i.actionType||'').toUpperCase()), out:'HUMAN_REQUIRED', reason:'Human-only workflow' },
  { id:'R-C2', test:i=> !!i.containsPII && (i.actionType||'').toUpperCase().includes('EXPORT'), out:'HUMAN_REQUIRED', reason:'PII export requires human' },
  { id:'R-B1', test:i=> i.riskLevel==='MEDIUM', out:'AI_ASSISTED', reason:'Medium risk — AI drafts, human reviews' },
  { id:'R-B2', test:i=> ['MESSAGE_DRAFT','SOP_DRAFT','COURSE_MATCH','DOCUMENT_CHECK','LEAD_SCORING_REVIEW'].includes((i.actionType||'').toUpperCase()), out:'AI_ASSISTED', reason:'Draft/review workflow — AI assisted' },
  // default
  { id:'R-A1', test:()=>true, out:'AI_AUTOMATABLE', reason:'Low risk bounded automation — AI can execute' },
];

export function classifyWork(input: ClassifyInput): ClassifyResult {
  for (const r of RULES) {
    if (r.test(input)) {
      const conf: ClassifyResult['confidence'] = r.out==='ESCALATED'?'HIGH': r.out==='AI_AUTOMATABLE'?'HIGH':'MEDIUM';
      return { class: r.out, reason: r.reason, ruleId: r.id, confidence: conf };
    }
  }
  return { class:'ESCALATED', reason:'No rule matched — escalate', ruleId:'R-DEFAULT', confidence:'LOW' };
}

// Helper: map WorkClass → AutomationEvent mode/category + queue decision
export function classToAutomation(class_: WorkClass): { category: string; mode: string; queue: 'AUTO'|'REVIEW'|'HUMAN'|'ESCALATION' } {
  switch(class_) {
    case 'AI_AUTOMATABLE': return { category:'ELIGIBLE_ROUTINE', mode:'AUTOMATED', queue:'AUTO' };
    case 'AI_ASSISTED': return { category:'ELIGIBLE_ROUTINE', mode:'AI_ASSISTED', queue:'REVIEW' };
    case 'HUMAN_REQUIRED': return { category:'HUMAN_REQUIRED', mode:'HUMAN', queue:'HUMAN' };
    case 'HUMAN_APPROVAL_REQUIRED': return { category:'ELIGIBLE_ROUTINE', mode:'PENDING_APPROVAL', queue:'REVIEW' };
    case 'ESCALATED': return { category:'HUMAN_REQUIRED', mode:'ESCALATED', queue:'ESCALATION' };
  }
}
