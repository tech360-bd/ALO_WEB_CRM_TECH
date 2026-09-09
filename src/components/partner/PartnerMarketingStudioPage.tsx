'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Sparkles, Image as ImageIcon, Video, Send, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerMarketingStudioPage() {
  const [idea, setIdea] = useState('');
  const [country, setCountry] = useState('UK');
  const [platform, setPlatform] = useState('facebook');
  const [generatedDraft, setGeneratedDraft] = useState<any | null>(null);

  // Quota states
  const imageLimit = 15;
  const imageUsed = 6;
  const videoLimit = 10;
  const videoUsed = 3;

  const handleGenerate = () => {
    if (!idea.trim()) {
      toast.error('Please enter a marketing idea or topic.');
      return;
    }

    if (imageUsed >= imageLimit) {
      toast.error('Monthly image quota finished. Request extra quota from ALO Education.');
      return;
    }

    setGeneratedDraft({
      caption: `🎓 Study in ${country} Sep 2025 Intake! Up to £7,500 Scholarships available at top UK universities. Get expert guidance & visa support from ALO Education partner network.`,
      hashtags: `#StudyAbroad #${country}Education #Scholarships2025 #ALOEducation #UniversityAdmission`,
      imagePrompt: `Professional poster of Bangladeshi student holding books in front of classic UK university architecture with ALO Education logo in top corner.`,
      videoScript: `[0-5s]: "Dreaming of studying in the UK in 2025?"\n[5-15s]: "Get up to £7,500 scholarships at top UK universities with expert guidance from ALO Education."\n[15-30s]: "Apply today! DM or WhatsApp us for instant assessment."`,
      ctaText: 'Apply Now on WhatsApp',
    });

    toast.success('AI Marketing Draft Generated (1 Image Quota Used)!');
  };

  return (
    <div className="space-y-6 bg-slate-50/50 min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            B2B Partner AI Marketing Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate branded social media captions, posters &amp; 30s video scripts. Enforced monthly ALO quota: 15 Images / 10 Videos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
            Quota: {imageUsed}/{imageLimit} Images • {videoUsed}/{videoLimit} Videos (30s max)
          </Badge>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (col-span-6): Campaign Input */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Campaign Details &amp; Idea</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Destination Country:</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white">
                    <option value="UK">United Kingdom</option>
                    <option value="USA">USA</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Target Platform:</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full h-8 text-xs border border-slate-200 rounded px-2 bg-white">
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok / Shorts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Marketing Topic / Campaign Idea:</label>
                <Textarea
                  placeholder="e.g. Promote UK Sep 2025 intake with £7,500 scholarships for Bangladeshi students..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-[90px] text-xs bg-slate-50"
                />
              </div>

              <Button className="w-full h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleGenerate}>
                <Sparkles className="w-4 h-4 mr-1" /> Generate AI Draft (Consumes 1 Image Quota)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (col-span-6): AI Draft Result */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Generated Marketing Draft</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {generatedDraft ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Social Caption:</span>
                    <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">{generatedDraft.caption}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Hashtags:</span>
                    <p className="p-2 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-lg font-mono text-[11px]">{generatedDraft.hashtags}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 block mb-1">30-Second Video Script:</span>
                    <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 whitespace-pre-line">{generatedDraft.videoScript}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Send className="w-3.5 h-3.5 mr-1" /> Submit for Approval &amp; Schedule
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-slate-400">
                  Fill in your campaign idea and click &quot;Generate AI Draft&quot; to preview social media copy and video script.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
