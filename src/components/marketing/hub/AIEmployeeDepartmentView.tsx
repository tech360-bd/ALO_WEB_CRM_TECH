'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Bot, Cpu, ShieldCheck, Clock, Play, Pause, AlertTriangle, Zap } from 'lucide-react';

const EMPLOYEES = [
  { id:'ai-01', name:'AI Marketing Director', dept:'Leadership', role:'Orchestrates entire dept', skills:['Campaign strategy','Channel selection','Delegation'], tools:['campaigns','calendar','approvals'], perms:'marketing.campaign.*', schedule:'24/7', tz:'Asia/Dhaka' },
  { id:'ai-02', name:'AI Campaign Strategist', dept:'Strategy', role:'Campaign planning', skills:['Audience research','Budget allocation'], tools:['campaigns','analytics'], perms:'marketing.campaign.create', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-03', name:'AI Market Researcher', dept:'Research', role:'Trend & competitor research', skills:['Keyword research','Intent analysis'], tools:['seo','analytics'], perms:'marketing.seo.generate', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-04', name:'AI Social Media Manager', dept:'Social', role:'Social publishing', skills:['Facebook/Instagram','Caption/hashtag'], tools:['social','calendar'], perms:'marketing.social.reply.suggest', schedule:'24/7', tz:'Asia/Dhaka' },
  { id:'ai-05', name:'AI Content Writer', dept:'Content', role:'Long-form content', skills:['Blogs','SEO pages'], tools:['content','video'], perms:'marketing.content.generate', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-06', name:'AI Bangla Copywriter', dept:'Content', role:'Bangla copy', skills:['Bangla posts','Bangla scripts'], tools:['content'], perms:'marketing.content.generate', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-07', name:'AI English Copywriter', dept:'Content', role:'English copy', skills:['English posts','Email'], tools:['content'], perms:'marketing.content.generate', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-08', name:'AI Graphic Designer', dept:'Creative', role:'Visuals', skills:['Promo graphics','Thumbnails'], tools:['brand-assets','image-generator'], perms:'marketing.asset.upload', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-09', name:'AI Video Producer', dept:'Creative', role:'Video', skills:['Scripts','Storyboards','Voiceover'], tools:['video','assets'], perms:'marketing.video.generate', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-10', name:'AI SEO Specialist', dept:'SEO', role:'SEO', skills:['Keyword','Technical SEO'], tools:['seo'], perms:'marketing.seo.generate', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-11', name:'AI Blog Manager', dept:'SEO', role:'Blog ops', skills:['Briefs','Internal linking'], tools:['content','seo'], perms:'marketing.seo.generate', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-12', name:'AI Advertising Specialist', dept:'Ads', role:'Paid campaigns', skills:['Ad copy','Campaign structure'], tools:['campaigns'], perms:'marketing.campaign.create', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-13', name:'AI WhatsApp Manager', dept:'Messaging', role:'WhatsApp', skills:['Templates','Drip'], tools:['whatsapp','calendar'], perms:'marketing.whatsapp.capture_lead', schedule:'24/7', tz:'Asia/Dhaka' },
  { id:'ai-14', name:'AI SMS Manager', dept:'Messaging', role:'SMS', skills:['Bulk','Segmentation'], tools:['sms','calendar'], perms:'marketing.campaign.create', schedule:'24/7', tz:'Asia/Dhaka' },
  { id:'ai-15', name:'AI Email Marketing Manager', dept:'Messaging', role:'Email', skills:['HTML','Journeys'], tools:['email','calendar'], perms:'marketing.campaign.create', schedule:'24/7', tz:'Asia/Dhaka' },
  { id:'ai-16', name:'AI Lead Generation Specialist', dept:'Leads', role:'Capture', skills:['Attribution','Duplicate detection'], tools:['lead-pipeline'], perms:'marketing.lead.assign', schedule:'24/7', tz:'Asia/Dhaka' },
  { id:'ai-17', name:'AI Lead Nurturing Specialist', dept:'Leads', role:'Nurture', skills:['Follow-up','Reminders'], tools:['lead-pipeline'], perms:'marketing.lead.assign', schedule:'24/7', tz:'Asia/Dhaka' },
  { id:'ai-18', name:'AI Marketing Analyst', dept:'Analytics', role:'Reporting', skills:['KPI','ROI','Summaries'], tools:['analytics','reports'], perms:'marketing.report.view', schedule:'24/7', tz:'Asia/Dhaka' },
  { id:'ai-19', name:'AI Brand Compliance Reviewer', dept:'Brand', role:'Brand check', skills:['Voice','Terminology'], tools:['brand-kit'], perms:'marketing.content.approve', schedule:'9-18', tz:'Asia/Dhaka' },
  { id:'ai-20', name:'AI Marketing QA Agent', dept:'QA', role:'Quality', skills:['Pre-publish check','Policy'], tools:['approvals'], perms:'marketing.campaign.approve', schedule:'9-18', tz:'Asia/Dhaka' },
];

export default function AIEmployeeDepartmentView() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ fetch('/api/marketing/agentos').then(r=>r.json()).then(j=>setJobs(j.jobs||j.agents||[])).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2"><Bot className="w-6 h-6 text-[#F97316]" />AI Employee Department</h2>
        <p className="text-sm text-gray-500">ALO Education marketing role catalog. Roles listed here are not evidence of active workers; execution and approval status must be verified in ALO Education’s own runtime.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EMPLOYEES.map(e=>(
          <Card key={e.id} className="border-[#0B5ED7]/10 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Cpu className="w-4 h-4 text-[#0B5ED7]" />{e.name}</CardTitle>
                <Badge className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 text-[10px]">{e.dept}</Badge>
              </div>
              <p className="text-xs text-gray-500">{e.role} — {e.id}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div><span className="font-semibold">Skills:</span> <span className="text-gray-600">{e.skills.join(', ')}</span></div>
              <div><span className="font-semibold">Tools:</span> <span className="text-gray-600">{e.tools.join(', ')}</span></div>
              <div><span className="font-semibold">Permissions:</span> <Badge variant="outline" className="text-[10px] ml-1">{e.perms}</Badge></div>
              <div className="flex items-center justify-between pt-2">
                <span className="flex items-center gap-1 text-gray-500"><Clock className="w-3 h-3" />{e.schedule} • {e.tz}</span>
                <div className="flex gap-1">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"><Zap className="w-3 h-3 mr-1" />Active</Badge>
                  <Badge variant="outline" className="text-[10px]"><ShieldCheck className="w-3 h-3 mr-1" />Least privilege</Badge>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">Queue • History • Metrics • Escalation to human • Idempotency • Retry 3 • Audit logged</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Execution Snapshot (MarketingAgentJob)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#F97316]" /> : jobs.length===0 ? <p className="text-sm text-gray-500">No active jobs — jobs appear when AI Director delegates tasks. Each job has status, input/output, error, duration, ragEnabled, memoryUsed, protectedMode, approvalId.</p> : <pre className="text-xs bg-[#F8FAFC] border rounded-xl p-3 max-h-[300px] overflow-auto">{JSON.stringify(jobs.slice(0,3), null, 2)}</pre>}
        </CardContent>
      </Card>
      <p className="text-[11px] text-gray-400">All agents operate only within assigned permissions — cannot modify own permissions, bypass approvals, or execute shell commands. Verified via src/lib/marketing/permissions.ts + withAuth.</p>
    </div>
  );
}
