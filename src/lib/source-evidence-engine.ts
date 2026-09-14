// ALO — Source & Evidence Engine (Part 7 Source Logging)
// Priority: 1 university official, 2 course page, 3 international student page, 4 government/immigration, 5 other trusted.
// Stores sourceUrl, sourceTitle, sourceType, checkedAt, retrievedAt, evidence, contentHash, agentRunId.

export const SOURCE_PRIORITY: Record<string,number> = {
  'official_university': 1, 'official_course_page': 2, 'official_international_page': 3,
  'official_government': 4, 'official_immigration': 4, 'other_trusted': 5, 'third_party': 9
};

export function pickHigherPriority(a:{sourceType:string}, b:{sourceType:string}): string {
  const pa = SOURCE_PRIORITY[a.sourceType] ?? 9; const pb = SOURCE_PRIORITY[b.sourceType] ?? 9;
  return pa <= pb ? a.sourceType : b.sourceType;
}

// Third-party should not override official: enforce in publish check
export function shouldAllowOverride(current: {sourceType:string}, incoming:{sourceType:string}): boolean {
  // only allow if incoming priority <= current (more official or equal)
  return (SOURCE_PRIORITY[incoming.sourceType] ?? 9) <= (SOURCE_PRIORITY[current.sourceType] ?? 9);
}

export async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && (crypto as any).subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b=> b.toString(16).padStart(2,'0')).join('');
  }
  // fallback simple hash (not crypto) for sync env
  let h=0; for (let i=0;i<text.length;i++) h = (h*31 + text.charCodeAt(i)) >>>0; return h.toString(16).padStart(8,'0');
}

export interface EvidenceRecord {
  sourceUrl:string; sourceTitle:string; sourceType:string; pageTitle?:string;
  detectedValue:string; previousValue:string; detectionDate:string; agentRunId?:string; confidence:'HIGH'|'MEDIUM'|'LOW'; contentHash?:string;
}

export function confidenceFor(sourceType:string, hasEvidence:boolean, conflicting:boolean): 'HIGH'|'MEDIUM'|'LOW' {
  if (conflicting) return 'LOW';
  if (!hasEvidence) return 'LOW';
  if (SOURCE_PRIORITY[sourceType] <=3 && hasEvidence) return 'HIGH';
  if (SOURCE_PRIORITY[sourceType] <=5) return 'MEDIUM';
  return 'LOW';
}
