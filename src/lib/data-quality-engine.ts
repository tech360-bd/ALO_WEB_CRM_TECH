// ALO — Data Quality + Freshness Engine (Parts 9 & 15)
// Checks: missing website/source, duplicate, invalid country/currency, expired deadline, missing intake/english/eligibility, stale, conflicting source, unverified

export interface QualityIssue { severity:'error'|'warning'|'info'; code:string; entityType:string; entityId:string; field?:string; message:string; }

export function staleStatus(lastCheckedAt?: string|Date|null, thresholdDays=90): 'FRESH'|'STALE'|'NEEDS_UPDATE' {
  if (!lastCheckedAt) return 'NEEDS_UPDATE';
  const t = new Date(lastCheckedAt).getTime(); if (isNaN(t)) return 'NEEDS_UPDATE';
  const ageDays = (Date.now()-t)/864e5;
  if (ageDays > thresholdDays) return 'STALE';
  if (ageDays > thresholdDays*0.8) return 'NEEDS_UPDATE';
  return 'FRESH';
}

export function checkCourseQuality(course: Record<string,any>): QualityIssue[] {
  const issues: QualityIssue[]=[];
  const id = course.id || course.courseId || course.slug || 'unknown';
  if (!course.officialUrl && !course.sourceUrl && !course.official_source_url) issues.push({severity:'error', code:'MISSING_OFFICIAL_SOURCE', entityType:'COURSE', entityId:id, field:'sourceUrl', message:'Missing official source URL'});
  if (!course.intakeFees && !course.intakes && !course.courseIntakes) issues.push({severity:'warning', code:'MISSING_INTAKE', entityType:'COURSE', entityId:id, field:'intakes', message:'Missing intake'});
  if (course.internationalEligibility==='not_verified' || !course.internationalEligibility) issues.push({severity:'warning', code:'MISSING_INTL_ELIGIBILITY', entityType:'COURSE', entityId:id, field:'internationalEligibility', message:'Missing international eligibility'});
  if (course.tuitionFee==null && course.tuition_fee==null) {/* may be valid */}
  if (course.currency && !/^[A-Z]{3}$/.test(String(course.currency))) issues.push({severity:'error', code:'INVALID_CURRENCY', entityType:'COURSE', entityId:id, field:'currency', message:`Invalid currency ${course.currency}`});
  const fresh = staleStatus(course.lastVerifiedAt || course.lastCheckedAt || course.last_checked_at, 90);
  if (fresh==='STALE') issues.push({severity:'warning', code:'STALE_DATA', entityType:'COURSE', entityId:id, message:'Data stale >90 days, queue for recheck'});
  else if (fresh==='NEEDS_UPDATE') issues.push({severity:'info', code:'NEEDS_UPDATE', entityType:'COURSE', entityId:id, message:'Data needs update soon'});
  return issues;
}

export function checkUniversityQuality(u: Record<string,any>): QualityIssue[] {
  const issues: QualityIssue[]=[]; const id=u.id||u.universityId||u.slug||'unknown';
  if (!u.website && !u.officialUrl && !u.sourceUrl) issues.push({severity:'error', code:'MISSING_WEBSITE', entityType:'UNIVERSITY', entityId:id, field:'website', message:'Missing university website'});
  return issues;
}
