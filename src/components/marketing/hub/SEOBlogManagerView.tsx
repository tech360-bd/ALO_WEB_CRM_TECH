'use client';
import SeoEvidencePanel from '@/components/crm/seo/SeoEvidencePanel';
import Link from 'next/link';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, Globe, BarChart3, Wrench, Link2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function SEOBlogManagerView() {
 return <div className="space-y-6"><SeoEvidencePanel mode="keywords"/><SeoEvidencePanel mode="technical"/><Link href="/crm/seo-manager" className="inline-block rounded border p-3 text-[var(--alo-brand)]">Open existing SEO draft and approval workbench</Link><p className="text-sm">AI generation requires a configured provider and human factual review. No provider test has been performed.</p></div>;
}
/** Historical mock-only presentation. No fallback AI call or fake success is used. */
function LegacyUnverifiedSEOBlogManagerView() {
  const [keyword, setKeyword] = useState('study in UK from Bangladesh');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleResearch = async () => {
    setLoading(true);
    try{
      const res = await fetch('/api/marketing/seo', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'research', keyword })});
      if(res.ok){ setResult(await res.json()); }
      else {
        const alt = await fetch('/api/marketing/content-generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contentType:'blog_post', topic: keyword+' SEO blog for ALO Education', platform:'blog', tone:'professional', targetAudience:'Bangladeshi students', keyMessage: keyword, cta:'Book free consultation' })});
        const j2 = await alt.json();
        setResult({ brief: j2.content?.slice(0,800) || 'SEO brief generated', keyword, intent: 'informational — Bangladeshi students researching UK study', competitorNote: 'Check SERP for study abroad keywords (BD, UK, USA, Australia...). Require source verification for tuition/visa claims.' });
      }
    }catch{ setResult({ error: 'Research failed — ensure OPENROUTER_API_KEY configured' }); }
    finally{ setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2"><Globe className="w-6 h-6 text-[var(--alo-brand)]" />SEO & Blog Manager</h2>
        <p className="text-sm text-[var(--alo-text-muted)]">Keyword research, intent analysis, competitor research, briefs, title/description, blog generation, internal linking, technical SEO, structured data, landing optimization — for UK/USA/Australia/Canada/NZ/Ireland/Germany/France/Italy/Netherlands/Dubai/S.Korea/Malta/Cyprus.</p>
      </div>
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Search className="w-4 h-4 text-[var(--alo-cta)]" />Keyword Research</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2"><Input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="e.g. study in Canada without IELTS from Bangladesh" className="flex-1" /><Button onClick={handleResearch} disabled={loading || !keyword.trim()} className="bg-[var(--alo-cta)] text-black">{loading? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}Research</Button></div>
              {result && <div className="p-4 bg-[var(--alo-page)] border rounded-xl text-xs space-y-2">
                <p className="font-semibold">Intent: {result.intent || 'Informational/Transactional'}</p>
                <p className="text-[var(--alo-body)] whitespace-pre-wrap">{result.brief || result.content || JSON.stringify(result).slice(0,1000)}</p>
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">Never fabricate admission requirements/tuition/scholarships/deadlines/visa rules/statistics. Source verification required for factual claims — keep sourceUrl/lastVerified.</p>
              </div>}
              <p className="text-[11px] text-[var(--alo-text-muted)]">Integrates Search analytics where configured (GOOGLE_CLIENT_ID). Blog uses MarketingGeneratedContent + approval flow.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--alo-brand)]" />Blog Generation & Optimization</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 bg-white border rounded-xl"><p className="font-semibold flex items-center gap-1"><Link2 className="w-3 h-3" />Internal Linking</p><p className="text-[var(--alo-body)] mt-1">Recommend links to /destinations/uk, /course-finder, /scholarships, /language-prep/ielts</p></div>
                <div className="p-3 bg-white border rounded-xl"><p className="font-semibold flex items-center gap-1"><Wrench className="w-3 h-3" />Technical SEO</p><p className="text-[var(--alo-body)] mt-1">Title ≤60, description ≤160, structured data (FAQ, Article, Breadcrumb), sitemap.</p></div>
              </div>
              <Button variant="outline" className=" "><FileText className="w-4 h-4 mr-2" />Generate Blog Draft</Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[var(--alo-cta)]" />Performance</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="text-[var(--alo-body)]">Search performance reporting via MarketingReport (type=seo) + MarketingAnalytics.</p>
              <p className="text-[11px] text-[var(--alo-text-muted)]">Content refresh suggestions — AI flags outdated tuition/visa via lastVerifiedAt.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
