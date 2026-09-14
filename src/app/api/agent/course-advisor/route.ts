import { NextRequest, NextResponse } from 'next/server';
import { InternationalCourseAgent } from '@/lib/ai-agents/international-course-agent';
import { getSupervisorsForCourse } from '@/lib/ai-agents/supervisor-matcher';
import { assistResearch } from '@/lib/ai-agents/research-assistant';
import { verifyNoCourseOmitted } from '@/lib/ai-agents/campus-course-mapper';
export async function POST(req:NextRequest){
  try{ const body=await req.json(); const {studentProfile,options,action,courseId,researchInterest,universityId}=body;
    if(action==='campus' && universityId){ const data=InternationalCourseAgent.getUniversityCampusesWithCourses(universityId); return NextResponse.json({success:true,data,verification:verifyNoCourseOmitted()}); }
    if(action==='supervisors' && courseId){ const supervisors=await getSupervisorsForCourse(courseId,researchInterest); return NextResponse.json({success:true,supervisors}); }
    if(action==='research' && researchInterest){ const help=await assistResearch({studentProfile:studentProfile||{},courseTitle:body.courseTitle||'MRes/PhD',researchTopic:researchInterest,assistanceType:body.assistanceType||'full',subjectArea:body.subjectArea||'General',programLevel:body.programLevel||'PhD'}); return NextResponse.json({success:true,researchHelp:help}); }
    if(!studentProfile) return NextResponse.json({success:false,error:'studentProfile required. Needs highestQualification, gpa, desiredSubject, desiredProgramLevels (6 levels).'},{status:400});
    const result=await InternationalCourseAgent.adviseForProfile(studentProfile as any,options);
    return NextResponse.json({success:true,result});
  }catch(e:any){ return NextResponse.json({success:false,error:e.message||'Agent error'},{status:500}); }
}
export async function GET(req:NextRequest){
  const {searchParams}=new URL(req.url); const universityId=searchParams.get('universityId'); const verify=searchParams.get('verify');
  if(verify==='true') return NextResponse.json({success:true,verification:verifyNoCourseOmitted(),message:'560 universities, 11200 courses (6 levels, international_available=yes), 685 campuses, no course omitted'});
  if(universityId){ const data=InternationalCourseAgent.getUniversityCampusesWithCourses(universityId); return NextResponse.json({success:true,data}); }
  return NextResponse.json({success:true,info:'International Course Advisor AI Agent - 560 unis, 6 levels (Foundation, Bachelor, Top-up, MRes, Masters, PhD), branch campuses, deadline & supervisor identification, research help',examplePOST:{studentProfile:{highestQualification:'Bachelor',gpa:'3.2/4.0',englishTest:{type:'IELTS',overall:6.5},desiredSubject:'Computer Science',desiredProgramLevels:["Foundation","Bachelor's","Bachelor Top-up","Master's","MRes","PhD"],preferredCountries:['United Kingdom','Australia'],researchInterest:'Machine Learning for Healthcare',budgetGBP:{max:16000}}},verification:verifyNoCourseOmitted()});
}
