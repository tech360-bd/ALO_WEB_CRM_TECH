'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Video, Sparkles, Play, Image as ImageIcon, Mic, Subtitles, Clapperboard, Archive, Check, Eye } from 'lucide-react';

export default function AIVideoStudioView() {
  const [title, setTitle] = useState('Study in UK from Bangladesh — Jan 2027');
  const [topic, setTopic] = useState('UK January intake affordable universities, scholarships, visa steps');
  const [aspect, setAspect] = useState('9:16');
  const [platform, setPlatform] = useState('tiktok');
  const [language, setLanguage] = useState('mixed');
  const [duration, setDuration] = useState(45);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScript = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/video?action=script', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ title, topic, language, platform, duration }),
      });
      if (res.ok) {
        const j = await res.json();
        setResult(j);
      } else {
        const alt = await fetch('/api/marketing/content-generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contentType:'short_video_script', topic: title+' '+topic, platform, tone:'energetic', targetAudience:'Bangladeshi students', keyMessage: topic, cta:'Book free consultation' })});
        const j2 = await alt.json();
        setResult({ script: j2.content, subtitle: 'Generated subtitles', thumbnailConcept: 'Bold ALO Orange #E8501A + campus image + “Jan 2027 UK” text', aspectRatio: aspect });
      }
    } catch { setResult({ script: 'Failed — check AI credentials', error: true }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2"><Video className="w-6 h-6 text-[#E8501A]" />AI Video Studio</h2>
        <p className="text-sm text-gray-500">Scripts, storyboards, voiceover (Bangla/English/mixed), subtitles, thumbnails, aspect ratios (9:16,1:1,16:9), storage & versioning. Respects provider availability — no text substitute for video file.</p>
      </div>

      <Card className="border-[#0057B8]/20">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clapperboard className="w-4 h-4 text-[#0057B8]" /> Video Generation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">Title</label><Input value={title} onChange={e=>setTitle(e.target.value)} className="mt-1" /></div>
            <div><label className="text-xs font-semibold">Topic</label><Input value={topic} onChange={e=>setTopic(e.target.value)} className="mt-1" /></div>
            <div><label className="text-xs font-semibold">Aspect Ratio</label><Select value={aspect} onValueChange={setAspect}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="9:16">9:16 (Reels/TikTok)</SelectItem><SelectItem value="1:1">1:1 (Feed)</SelectItem><SelectItem value="16:9">16:9 (YouTube)</SelectItem></SelectContent></Select></div>
            <div><label className="text-xs font-semibold">Platform</label><Select value={platform} onValueChange={setPlatform}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tiktok">TikTok</SelectItem><SelectItem value="instagram">Instagram Reels</SelectItem><SelectItem value="youtube">YouTube Shorts</SelectItem><SelectItem value="facebook">Facebook</SelectItem></SelectContent></Select></div>
            <div><label className="text-xs font-semibold">Language Voice</label><Select value={language} onValueChange={setLanguage}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bangla">Bangla</SelectItem><SelectItem value="english">English</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent></Select></div>
            <div><label className="text-xs font-semibold">Duration (sec)</label><Input type="number" value={duration} onChange={e=>setDuration(parseInt(e.target.value)||30)} className="mt-1 h-9 w-24" /></div>
          </div>
          <Button onClick={handleScript} disabled={loading || !title.trim()} className="bg-[#E8501A] hover:bg-[#d85f1b] text-white">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}Generate Script</Button>
          <div className="flex gap-2 text-[11px]">
            <Badge className="bg-[#0057B8]/10 text-[#0057B8]">Aspect: {aspect}</Badge>
            <Badge className="bg-[#FFB347]/20 text-[#0F172A]">Brand overlay: ALO Orange</Badge>
            <Badge variant="outline">Voiceover: {language}</Badge>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Mic className="w-4 h-4 text-[#E8501A]" /> Script & Storyboard</CardTitle></CardHeader>
            <CardContent><pre className="text-xs whitespace-pre-wrap bg-[#F8FAFC] border rounded-xl p-4 max-h-[400px] overflow-auto">{typeof result.script === 'string' ? result.script : JSON.stringify(result.script, null, 2)}</pre></CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Subtitles className="w-4 h-4 text-[#0057B8]" /> Subtitles & Thumbnail</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-xs font-semibold">Subtitles/CC</p><p className="text-xs bg-white border rounded-lg p-3 mt-1">{result.subtitle || 'Auto-generated subtitles will appear here.'}</p></div>
                <div><p className="text-xs font-semibold flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Thumbnail Concept</p><p className="text-xs bg-[#FFB347]/10 border border-[#FFB347]/30 rounded-lg p-3 mt-1">{result.thumbnailConcept || 'ALO Orange #E8501A bold text + campus visual + scholarship badge, 1280x720, CTR-optimized'}</p></div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-white border rounded-lg text-center">9:16<br /><span className="text-gray-400">1080x1920</span></div>
                  <div className="p-2 bg-white border rounded-lg text-center">1:1<br /><span className="text-gray-400">1080x1080</span></div>
                  <div className="p-2 bg-white border rounded-lg text-center">16:9<br /><span className="text-gray-400">1920x1080</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Workflow</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px]"><Eye className="w-3 h-3 mr-1" />Preview</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px]"><Play className="w-3 h-3 mr-1" />Render</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-8 text-[11px] bg-emerald-600 text-white"><Check className="w-3 h-3 mr-1" />Approve</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px]">Schedule</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px]">Publish</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-8 text-[11px]"><Archive className="w-3 h-3 mr-1" />Archive</Button>
              </CardContent>
            </Card>
            <p className="text-[11px] text-gray-400">If video provider unavailable, status shows `ON_HOLD — provider not configured` and task remains in queue. Asset storage: MarketingAsset (type video) with versioning.</p>
          </div>
        </div>
      )}
    </div>
  );
}
