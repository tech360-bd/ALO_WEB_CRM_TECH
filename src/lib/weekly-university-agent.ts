// ALO — Weekly AI University/Course Update Agent (Part 7)
// 12-step workflow: load universities requiring check → official URLs → visit permitted → extract structured → normalize → compare → detect changes → evidence → update_requests → notify Super Admin → wait approval → publish only approved.
// Must NOT invent visa; prefer official government/university international guidance; LOW confidence → NEEDS MANUAL REVIEW.
// Uses existing MonitoringJob + VerificationRun + DataChange + UpdateRequest.

export const WEEKLY_AGENT_STEPS = [
  'Load universities requiring checking',
  'Load their official source URLs',
  'Visit permitted official sources (robots.txt, rate limits, terms respected)',
  'Extract relevant structured information',
  'Normalize information (text/country/currency/qualification)',
  'Compare against current database',
  'Detect changes',
  'Save evidence (sourceUrl, title, evidence, contentHash, agentRunId)',
  'Create update_requests',
  'Notify Super Admin',
  'Wait for human approval',
  'Publish only approved changes',
] as const;

export const AI_MUST_CHECK_FIELDS = [
  'universityName','courseName','courseStatus','course availability','tuition fees','currency','intakes','application deadlines',
  'entry requirements','english requirements','scholarships','application fee','deposit','casNotes','coeNotes','i20Notes',
  'international student eligibility','campus','duration','study mode','international student information','official admission information','country-specific official guidance'
] as const;

export interface ChangeCandidate {
  entityType: 'UNIVERSITY'|'COURSE'; entityId:string; fieldName:string;
  oldValue:string; newValue:string; sourceUrl:string; evidence:string; contentHash?:string; confidence:number; // 0-1
}

export function buildUpdateRequest(candidate: ChangeCandidate, agentRunId:string){
  const needsManual = candidate.confidence < 0.6 || /visa/i.test(candidate.fieldName) && candidate.confidence < 0.85;
  return {
    entityType: candidate.entityType.toLowerCase(), entityId: candidate.entityId, fieldName: candidate.fieldName,
    oldValue: candidate.oldValue, newValue: candidate.newValue, sourceUrl: candidate.sourceUrl, evidence: candidate.evidence,
    confidence: candidate.confidence, status: needsManual ? 'NEEDS_MANUAL_REVIEW' : 'DETECTED', agentRunId
  };
}

// Rate limiting helper: reasonable spacing, backoff, conditional checks
export function sleep(ms:number){ return new Promise(r=> setTimeout(r, ms)); }
export async function fetchWithBackoff(url:string, opts:RequestInit & { attempts?:number; baseDelayMs?:number } = {}){
  const attempts = opts.attempts ?? 3; let delay = opts.baseDelayMs ?? 800;
  for (let i=0;i<attempts;i++){
    try { const res = await fetch(url, opts); if (res.ok) return res; if (res.status===429 || res.status>=500) throw new Error(`HTTP ${res.status}`); return res; } catch(e){ if (i===attempts-1) throw e; await sleep(delay); delay*=2; }
  }
  throw new Error('fetchWithBackoff exhausted');
}

// Schedule helper — uses existing MonitoringJob cron field if present
export function nextWeeklyRun(day:'Sunday'|'Monday'='Sunday', timeUtc:'02:00'='02:00', tz='Asia/Dhaka'){
  // placeholder: return next Sunday 02:00 Dhaka (UTC+6 → 20:00 UTC previous day)
  const now = new Date(); const next = new Date(now); next.setUTCDate(now.getUTCDate()+1);
  return next.toISOString();
}
