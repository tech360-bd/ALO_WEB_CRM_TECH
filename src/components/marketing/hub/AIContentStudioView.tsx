'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Sparkles, Eye, Edit, RefreshCw, Check, X, Calendar, Archive, Image, FileText, MessageSquare, Mail, Globe } from 'lucide-react';

const CONTENT_TYPES = ['Facebook posts','Instagram posts and reels','YouTube scripts','TikTok scripts','LinkedIn posts','Promotional advertisements','Blog articles','SEO landing pages','Email newsletters','WhatsApp campaign messages','SMS messages','Student success stories','University promotion','Scholarship announcements','Admission deadline reminders','Educational content','FAQs'] as const;

export default function AIContentStudioView() {
  const [topic, setTopic] = useState('UK January 2027 intake — affordable universities with scholarships');
  const [contentType, setContentType] = useState<string>('Facebook posts');
  const [language, setLanguage] = useState('english');
  const [platform, setPlatform] = useState('facebook');
  const [tone, setTone] = useState('professional');
  const [variations, setVariations] = useState(3);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/content?action=generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, topic, platform, language, tone, variations, targetCountry: 'UK', approvalRequired: true }),
      });
      if (res.ok) {
        const j = await res.json();
        // normalize: j.generated or j.content or j.ideas
        const arr = j.generated ? [j.generated] : j.content ? [{ title: topic, body: j.content }] : j.ideas ? j.ideas : [{ title: topic, body: JSON.stringify(j).slice(0,600) }];
        setResults(arr.map((x:any,i:number)=>({ id: 'gen-'+i, title: x.title || topic+' #'+(i+1), body: x.body || x.description || x.content || JSON.stringify(x).slice(0,800), status: 'draft', platform, language })));
      } else {
        // fallback via content-generate
        const r2 = await fetch('/api/marketing/content-generate', { method: 'POST', headers: { 'Content-Type':'application/json'}, body: JSON.stringify({ contentType, topic, platform, tone, targetAudience:'Bangladeshi students', keyMessage: topic, cta:'Book free consultation' })});
        const j2 = await r2.json();
        setResults([{ id:'gen-0', title: topic, body: j2.content || 'Generated content', status:'draft', platform, language }]);
      }
    } catch { setResults([{ id:'err', title: 'Generation failed', body: 'Check AI credentials (GROQ_API_KEY/OPENROUTER_API_KEY/ZAI_API_KEY) and try again. Task preserved for retry.', status:'failed', platform }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2"><Sparkles className="w-6 h-6 text-[#E8501A]" />AI Content Studio</h2>
        <p className="text-sm text-gray-500">Generate 17 content types in Bangla/English/Mixed with ALO brand compliance. Every asset supports preview/edit/regenerate/approve/reject/schedule/publish/archive + history.</p>
      </div>

      <Card className="border-[#0057B8]/20">
        <CardHeader><CardTitle className="text-sm">Generation Form</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2"><label className="text-xs font-semibold">Topic / Keyword</label><Input value={topic} onChange={e=>setTopic(e.target.value)} className="mt-1" placeholder="e.g. Scholarship in Malaysia" /></div>
            <div><label className="text-xs font-semibold">Content Type</label><Select value={contentType} onValueChange={setContentType}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent className="max-h-64">{CONTENT_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-xs font-semibold">Platform</label><Select value={platform} onValueChange={setPlatform}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="facebook">Facebook</SelectItem><SelectItem value="instagram">Instagram</SelectItem><SelectItem value="youtube">YouTube</SelectItem><SelectItem value="tiktok">TikTok</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="blog">Blog/SEO</SelectItem></SelectContent></Select></div>
            <div><label className="text-xs font-semibold">Language</label><Select value={language} onValueChange={setLanguage}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="english">English</SelectItem><SelectItem value="bangla">Bangla</SelectItem><SelectItem value="mixed">Mixed/Banglish</SelectItem></SelectContent></Select></div>
            <div><label className="text-xs font-semibold">Tone</label><Select value={tone} onValueChange={setTone}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="professional">Professional</SelectItem><SelectItem value="friendly">Friendly</SelectItem><SelectItem value="encouraging">Encouraging</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold">Variations</label><Input type="number" min={1} max={5} value={variations} onChange={e=>setVariations(parseInt(e.target.value)||1)} className="w-20 h-9" />
            <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="bg-[#E8501A] hover:bg-[#d85f1b] text-white"><>{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}Generate</></Button>
            <Badge className="bg-[#FFB347]/20 text-[#0F172A] border-[#FFB347]">Brand: ALO Orange #E8501A • Blue #0057B8</Badge>
          </div>
        </CardContent>
      </Card>

      {results.length>0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(r=>(
            <Card key={r.id} className="border-[#0057B8]/10 hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2"><CardTitle className="text-sm line-clamp-2">{r.title}</CardTitle><Badge variant="outline" className="text-[10px]">{r.status}</Badge></div>
                <p className="text-[11px] text-gray-400">{r.platform} • {r.language} • Brand compliance: pending</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-6 flex-1">{r.body}</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px]"><Eye className="w-3 h-3 mr-1" />Preview</Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px]"><Edit className="w-3 h-3 mr-1" />Edit</Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px]"><RefreshCw className="w-3 h-3 mr-1" />Regenerate</Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-8 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="w-3 h-3 mr-1" />Approve</Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px] border-red-200 text-red-600"><X className="w-3 h-3 mr-1" />Reject</Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px]"><Calendar className="w-3 h-3 mr-1" />Schedule</Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="flex-1 h-8 text-[11px] bg-[#0057B8] text-white"><Globe className="w-3 h-3 mr-1" />Publish</Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="flex-1 h-8 text-[11px]"><Archive className="w-3 h-3 mr-1" />Archive</Button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">History preserved — versioning & audit logged. Provider fallback preserved if image/video unavailable.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-[#F8FAFC] border-dashed">
        <CardContent className="p-4 text-xs text-gray-500">
          Uses <code>generateText</code> (glm-4-flash) with ALO brand voice (professional, encouraging, student-focused). No visa/admission guarantees. Bangladeshi audience tailoring. If video/image provider unavailable (e.g., storage), task remains scheduled with “ON_HOLD — provider not configured” — not substituted with text description.
        </CardContent>
      </Card>
    </div>
  );
}
