// ALO — Student Duplicate Engine (weighted, spec § Duplicate Detection)
// NEVER merge on name alone. Returns confidence 0-100 and per-field reasons.
// Levels: MATCHED / POSSIBLE_MATCH / DUPLICATE_RISK / NO_MATCH

export type StudentDuplicateLevel = 'MATCHED' | 'POSSIBLE_MATCH' | 'DUPLICATE_RISK' | 'NO_MATCH';

export interface StudentDuplicateResult {
  level: StudentDuplicateLevel;
  confidence: number; // 0-100
  matchedStudentId?: string;
  reasons: string[]; // e.g. "Phone: MATCH", "Email: MATCH", "Name similarity: 92%"
  action: 'MERGE' | 'CREATE_NEW' | 'REVIEW' | 'IGNORE';
}

export interface StudentIdentity {
  id?: string;
  oldCrmId?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  passportNumber?: string;
  normalizedNameKey?: string;
  studentName?: string;
  dateOfBirth?: string;
}

function nameSimilarity(a:string,b:string): number {
  const ka = (a||'').toLowerCase().replace(/[^a-z]/g,'');
  const kb = (b||'').toLowerCase().replace(/[^a-z]/g,'');
  if (!ka || !kb) return 0;
  if (ka===kb) return 100;
  // Jaccard on bigrams + prefix
  const bigrams = (s:string)=> new Set(Array.from({length: Math.max(1,s.length-1)},(_,i)=> s.slice(i,i+2)));
  const A=bigrams(ka), B=bigrams(kb);
  let inter=0; for (const x of A) if (B.has(x)) inter++;
  const jacc = inter / Math.max(1, A.size + B.size - inter);
  return Math.round(jacc*100);
}

export function scoreStudentDuplicate(
  incoming: StudentIdentity,
  existing: StudentIdentity
): { score:number; reasons:string[] } {
  let score = 0;
  const reasons: string[] = [];
  let passportMatch=false, phoneMatch=false, whatsappMatch=false, emailMatch=false, oldCrmMatch=false;

  if (incoming.oldCrmId && existing.oldCrmId && incoming.oldCrmId === existing.oldCrmId) {
    score += 40; oldCrmMatch=true; reasons.push('oldCrmId: MATCH (VERY HIGH)');
  }
  if (incoming.passportNumber && existing.passportNumber && incoming.passportNumber===existing.passportNumber) {
    score += 38; passportMatch=true; reasons.push('Passport: MATCH (VERY HIGH)');
  }
  if (incoming.phone && existing.phone && incoming.phone===existing.phone) {
    score += 30; phoneMatch=true; reasons.push('Phone: MATCH (HIGH)');
  }
  if (incoming.whatsapp && existing.whatsapp && incoming.whatsapp===existing.whatsapp) {
    score += 28; whatsappMatch=true; reasons.push('WhatsApp: MATCH (HIGH)');
  }
  if (incoming.email && existing.email && incoming.email.toLowerCase()===existing.email.toLowerCase()) {
    score += 30; emailMatch=true; reasons.push('Email: MATCH (HIGH)');
  }
  const nameSim = nameSimilarity(incoming.normalizedNameKey || incoming.studentName || '', existing.normalizedNameKey || existing.studentName || '');
  if (nameSim >= 92) { score += 18; reasons.push(`Name similarity: ${nameSim}%`); }
  else if (nameSim >= 80) { score += 10; reasons.push(`Name similarity: ${nameSim}%`); }
  else if (nameSim >= 60) { reasons.push(`Name similarity: ${nameSim}% (LOW)`); }

  if (incoming.dateOfBirth && existing.dateOfBirth && incoming.dateOfBirth===existing.dateOfBirth) {
    if (nameSim >= 80) { score += 15; reasons.push('DOB: MATCH + Name high → MEDIUM/HIGH'); }
    else { score += 6; reasons.push('DOB: MATCH but name low'); }
  }

  // cap 100
  if (score>100) score=100;
  // safeguard: name-only should remain LOW (per CRITICAL RULE)
  if (!passportMatch && !phoneMatch && !emailMatch && !whatsappMatch && !oldCrmMatch) {
    if (score>35) score = 35; // name-only / dob-only ceiling
    reasons.push('Name-only match capped — no automatic merge');
  }
  return { score, reasons };
}

export function classifyDuplicate(score:number, incoming:StudentIdentity, existing:StudentIdentity): StudentDuplicateResult {
  // weighted thresholds
  let level: StudentDuplicateLevel='NO_MATCH';
  let confidence = score;
  let action: StudentDuplicateResult['action']='CREATE_NEW';
  const base: Pick<StudentDuplicateResult,'level'|'confidence'|'action'> = { level, confidence, action };
  if (score >= 75) { level='MATCHED'; confidence= Math.min(87+ Math.round((score-75)/2.5),98); action='MERGE'; }
  else if (score >= 55) { level='POSSIBLE_MATCH'; confidence=Math.round(60+ (score-55)*0.8); action='REVIEW'; }
  else if (score >= 35) { level='DUPLICATE_RISK'; confidence= score; action='REVIEW'; }
  else { level='NO_MATCH'; action='CREATE_NEW'; }
  return { level, confidence, reasons: [], action }; // reasons filled by caller
}

export function evaluateIncomingVsCandidates(
  incoming: StudentIdentity,
  candidates: StudentIdentity[]
): StudentDuplicateResult & { matchedStudentId?:string; reasons:string[] } {
  if (!candidates.length) return { level:'NO_MATCH', confidence:0, reasons:['No candidates'], action:'CREATE_NEW' };
  let best: { id?:string; score:number; reasons:string[] } = { score:-1, reasons:[] };
  let bestId: string|undefined;
  for (const c of candidates) {
    const { score, reasons } = scoreStudentDuplicate(incoming, c);
    if (score > best.score) { best={ score, reasons }; bestId=c.id; }
  }
  const cls = classifyDuplicate(best.score, incoming, { id: bestId });
  return { ...cls, matchedStudentId: bestId, reasons: best.reasons, confidence: cls.confidence };
}
