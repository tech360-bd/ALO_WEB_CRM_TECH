// ALO Education - Supervisor Matcher for MRes/PhD
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { syntheticAgentDataAllowed, syntheticFixturePath } from './synthetic-data-guard';
export interface Supervisor { supervisor_id:string; university_id:string; campus_id:string; name:string; title:string; department:string; research_interests:string; email:string; profile_url:string; available_for_level:string; }
export interface SupervisorMatch { supervisor:Supervisor; matchScore:number; matchedInterests:string[]; reason:string; }
function loadSupervisors(): Supervisor[] { if(!syntheticAgentDataAllowed()) return []; const csvPath=syntheticFixturePath('supervisors.csv'); if(!csvPath||!fs.existsSync(csvPath)) return []; const content=fs.readFileSync(csvPath,'utf-8'); return parse(content,{columns:true,skip_empty_lines:true}); }
export async function findSupervisorsForProfile(params:{ universityId?:string; campusId?:string; researchInterest:string; desiredLevel:'MRes'|'PhD'|string; departmentHint?:string; limit?:number; }):Promise<SupervisorMatch[]>{
  const {universityId,campusId,researchInterest,desiredLevel,departmentHint,limit=5}=params;
  const stopwords=new Set(['in','for','and','the','of','on','with','a','an','to','for','-']);
  const interestsLower=researchInterest.toLowerCase().split(/[,\s]+/).filter(w=> w.length>2 && !stopwords.has(w));
  let supervisors:Supervisor[]=[]; try{ supervisors=loadSupervisors(); }catch{ supervisors=[]; }
  let candidates=supervisors;
  if(universityId){ candidates=candidates.filter(s=>s.university_id===universityId); if(candidates.length===0) candidates=supervisors; }
  if(campusId){ const f=candidates.filter(s=>s.campus_id===campusId); if(f.length>0) candidates=f; }
  candidates=candidates.filter(s=>s.available_for_level.toLowerCase().includes(desiredLevel.toLowerCase())||s.available_for_level.includes('MRes'));
  const scored:SupervisorMatch[]=candidates.map(sup=>{
    const supInterests=sup.research_interests.toLowerCase().split(/[,\s]+/).filter(w=> w.length>2 && !stopwords.has(w));
    const matched=interestsLower.filter(kw=> supInterests.some(si=> si.includes(kw)||kw.includes(si)));
    let deptBonus=0; if(departmentHint && sup.department.toLowerCase().includes(departmentHint.toLowerCase())) deptBonus=10;
    const matchScore=matched.length*20+deptBonus+(sup.title.includes('Professor')?5:0);
    return {supervisor:sup,matchScore,matchedInterests:matched,reason: matched.length>0?`Matched interests: ${matched.join(', ')} in ${sup.department}`:`Available for ${desiredLevel} in ${sup.department} (no direct keyword match, general fit)`};
  });
  scored.sort((a,b)=>b.matchScore-a.matchScore); return scored.slice(0,limit);
}
export async function getSupervisorsForCourse(courseId:string, researchInterest?:string):Promise<SupervisorMatch[]>{
  if(!syntheticAgentDataAllowed()) return []; const csvPath=syntheticFixturePath('courses.csv'); if(!csvPath||!fs.existsSync(csvPath)) return []; const content=fs.readFileSync(csvPath,'utf-8'); const courses:any[]=parse(content,{columns:true,skip_empty_lines:true}); const course=courses.find(c=>c.course_id===courseId); if(!course) return []; const isResearch=course.program_level==='MRes'||course.program_level==='PhD'; if(!isResearch && !researchInterest) return []; return findSupervisorsForProfile({universityId:course.university_id,campusId:course.campus_id,researchInterest:researchInterest||course.subject_area,desiredLevel:course.program_level as any});
}
