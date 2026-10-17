'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BookOpen, Plus, Edit, Save, Search, Globe, Award, CheckCircle2, AlertTriangle,
  FileText, BarChart3, MapPin, HelpCircle, Library, Star, Link2, ShieldCheck, Eye, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'basic' | 'format' | 'modules' | 'scoring' | 'acceptance' | 'requirements' | 'prep' | 'faqs' | 'resources' | 'success' | 'seo' | 'sources' | 'publish';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'basic', label: 'Basic', icon: FileText },
  { id: 'format', label: 'Format', icon: BookOpen },
  { id: 'modules', label: 'Modules', icon: BarChart3 },
  { id: 'scoring', label: 'Scoring', icon: Award },
  { id: 'acceptance', label: 'Acceptance', icon: MapPin },
  { id: 'requirements', label: 'Requirements', icon: Globe },
  { id: 'prep', label: 'Prep Process', icon: Library },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'resources', label: 'Resources', icon: Link2 },
  { id: 'success', label: 'Success', icon: Star },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'sources', label: 'Sources', icon: ShieldCheck },
  { id: 'publish', label: 'Publish', icon: Eye },
];

export default function AdminLanguageTestsView() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '', slug: '', shortName: '', provider: '', officialUrl: '', testType: 'english_proficiency',
    description: '', longDescription: '', durationMinutes: '', durationDisplay: '',
    scoringSystem: '', resultTimeline: '', costSummary: '', validitySummary: '',
    format: '', bestFor: '', acceptanceSummary: '', difficultyLevel: 'Intermediate',
    sourceUrl: '', sourceName: '', verifiedBy: '', verificationStatus: 'pending', lastVerifiedAt: '',
    seoTitle: '', seoDescription: '', canonicalUrl: '', isPopular: false, isFeatured: false, isPublished: true, sortOrder: '0',
  });

  useEffect(() => {
    fetchTests();
  }, []);

  async function fetchTests() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/language-prep/tests');
      const data = await res.json();
      if (data.success) setTests(data.tests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (t: any) => {
    setActiveTest(t);
    setFormData({
      name: t.name || '',
      slug: t.slug || '',
      shortName: t.shortName || '',
      provider: t.provider || '',
      officialUrl: t.officialUrl || t.sourceUrl || '',
      testType: t.testType || 'english_proficiency',
      description: t.description || '',
      longDescription: t.longDescription || t.description || '',
      durationMinutes: t.durationMinutes?.toString() || '',
      durationDisplay: t.durationDisplay || '',
      scoringSystem: t.scoringSystem || '',
      resultTimeline: t.resultTimeline || '',
      costSummary: t.costSummary || '',
      validitySummary: t.validitySummary || '',
      format: t.format || '',
      bestFor: t.bestFor || '',
      acceptanceSummary: t.acceptanceSummary || '',
      difficultyLevel: t.difficultyLevel || 'Intermediate',
      sourceUrl: t.sourceUrl || '',
      sourceName: t.sourceName || '',
      verifiedBy: t.verifiedBy || '',
      verificationStatus: t.verificationStatus || 'pending',
      lastVerifiedAt: t.lastVerifiedAt ? new Date(t.lastVerifiedAt).toISOString().split('T')[0] : '',
      seoTitle: t.seoTitle || '',
      seoDescription: t.seoDescription || '',
      canonicalUrl: t.canonicalUrl || '',
      isPopular: !!t.isPopular,
      isFeatured: !!t.isFeatured,
      isPublished: t.isPublished !== false,
      sortOrder: t.sortOrder?.toString() || '0',
    });
    setIsEditing(true);
    setActiveTab('basic');
  };

  const handleNew = () => {
    setActiveTest(null);
    setFormData({
      name: '', slug: '', shortName: '', provider: '', officialUrl: '', testType: 'english_proficiency',
      description: '', longDescription: '', durationMinutes: '', durationDisplay: '',
      scoringSystem: '', resultTimeline: 'Check current provider information', costSummary: 'Check current provider information', validitySummary: 'Check current provider information',
      format: 'Computer-based', bestFor: '', acceptanceSummary: '', difficultyLevel: 'Intermediate',
      sourceUrl: '', sourceName: '', verifiedBy: '', verificationStatus: 'pending', lastVerifiedAt: new Date().toISOString().split('T')[0],
      seoTitle: '', seoDescription: '', canonicalUrl: '', isPopular: false, isFeatured: false, isPublished: true, sortOrder: '0',
    });
    setIsEditing(true);
    setActiveTab('basic');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/language-prep/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Test ${formData.name} saved`);
        setIsEditing(false);
        fetchTests();
      } else {
        toast.error(data.error || 'Save failed — DB may need migration');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredTests = tests.filter(t =>
    !searchQuery ||
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.provider?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-screen text-[#0F172A]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0057B8] text-white flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Language Tests Admin — CRUD</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage 15 tests: IELTS, PTE, TOEFL, Duolingo, OIETC, Oxford ELLT, LanguageCert, Kaplan, OET, GRE, GMAT, SAT, ACT, MOI + SEO + Sources + Publish • Super Admin full access</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search tests..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 rounded-xl border-[#E2E8F0] text-xs w-48" />
          </div>
          <Button onClick={handleNew} className="bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-9 rounded-xl text-xs"><Plus className="w-4 h-4 mr-1" /> New Test</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left — Test list */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="font-bold text-sm">Tests ({filteredTests.length}/15)</h2>
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading tests...</div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {filteredTests.map((t: any) => (
                <Card key={t.id || t.slug} className={`p-4 bg-white border rounded-2xl hover:border-[#0057B8]/30 transition cursor-pointer ${activeTest?.slug === t.slug ? 'border-[#0057B8] ring-1 ring-[#0057B8]/20' : 'border-[#E2E8F0]'}`} onClick={() => handleEdit(t)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">{t.name}</h3>
                        {t.isPopular && <Badge className="bg-[#E8501A] text-white text-[9px]">Popular</Badge>}
                        {t.verificationStatus === 'verified' ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">Verified</Badge> : <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px]">{t.verificationStatus || 'pending'}</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-1">/{t.slug} • {t.provider}</p>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{t.description?.slice(0,100)}</p>
                      <div className="flex gap-1.5 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]">{t.scoringSystem?.slice(0,20) || 'Scoring N/A'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]">{t.durationDisplay || 'Duration N/A'}</span>
                      </div>
                    </div>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card className="p-4 bg-amber-50 border-amber-200 rounded-2xl">
            <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Verification Rule</h4>
            <p className="text-[11px] text-amber-800 mt-1.5 leading-relaxed">
              Every factual field must have source_url, source_name, verified_by, verification_status, last_verified_at. If not verified: hide or show "Check official provider information" — Do not invent pricing, result time, acceptance, requirements.
            </p>
          </Card>
        </div>

        {/* Right — Editor with tabs */}
        <div className="lg:col-span-7">
          {isEditing ? (
            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                <h3 className="font-bold text-sm">{activeTest ? `Edit ${activeTest.name}` : 'Create New Test'}</h3>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="h-8 text-xs">Cancel</Button>
                  <Button type="submit" className="bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-8 rounded-xl text-xs"><Save className="w-3.5 h-3.5 mr-1" /> Save Test</Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-1 p-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition ${activeTab === tab.id ? 'bg-[#0057B8] text-white' : 'bg-white border border-[#E2E8F0] text-slate-600 hover:border-[#0057B8]'}`}
                  >
                    <tab.icon className="w-3 h-3" /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto text-xs">
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="font-semibold">Test Name *</label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="IELTS Academic" /></div>
                      <div><label className="font-semibold">Slug *</label><Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="ielts" /></div>
                      <div><label className="font-semibold">Short Name</label><Input value={formData.shortName} onChange={e => setFormData({ ...formData, shortName: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="IELTS" /></div>
                      <div><label className="font-semibold">Provider</label><Input value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="British Council / IDP / Cambridge" /></div>
                      <div className="col-span-2"><label className="font-semibold">Official URL</label><Input value={formData.officialUrl} onChange={e => setFormData({ ...formData, officialUrl: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="https://ielts.org" /></div>
                      <div><label className="font-semibold">Test Type</label>
                        <select value={formData.testType} onChange={e => setFormData({ ...formData, testType: e.target.value })} className="w-full mt-1 h-9 px-3 rounded-xl border border-[#E2E8F0] bg-white">
                          <option value="english_proficiency">English Proficiency</option>
                          <option value="selt">SELT (UKVI)</option>
                          <option value="academic">Academic Test (GRE/GMAT/SAT/ACT)</option>
                          <option value="healthcare">Healthcare (OET)</option>
                          <option value="moi_guidance">MOI Guidance (Not Test)</option>
                        </select>
                      </div>
                      <div><label className="font-semibold">Difficulty</label>
                        <select value={formData.difficultyLevel} onChange={e => setFormData({ ...formData, difficultyLevel: e.target.value })} className="w-full mt-1 h-9 px-3 rounded-xl border border-[#E2E8F0] bg-white">
                          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                        </select>
                      </div>
                      <div className="col-span-2"><label className="font-semibold">Short Description</label><textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full mt-1 p-2 rounded-xl border border-[#E2E8F0] bg-white" placeholder="IELTS Academic — 4-module test..." /></div>
                      <div className="col-span-2"><label className="font-semibold">Long Description</label><textarea value={formData.longDescription} onChange={e => setFormData({ ...formData, longDescription: e.target.value })} rows={4} className="w-full mt-1 p-2 rounded-xl border border-[#E2E8F0] bg-white" placeholder="Detailed test overview..." /></div>
                    </div>
                  </div>
                )}

                {activeTab === 'format' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="font-semibold">Duration Minutes</label><Input type="number" value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="165" /></div>
                      <div><label className="font-semibold">Duration Display</label><Input value={formData.durationDisplay} onChange={e => setFormData({ ...formData, durationDisplay: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="2h 45m" /></div>
                      <div className="col-span-2"><label className="font-semibold">Format</label><Input value={formData.format} onChange={e => setFormData({ ...formData, format: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="Paper-based and Computer-based, 4 modules" /></div>
                      <div className="col-span-2"><label className="font-semibold">Best For</label><textarea value={formData.bestFor} onChange={e => setFormData({ ...formData, bestFor: e.target.value })} rows={2} className="w-full mt-1 p-2 rounded-xl border border-[#E2E8F0] bg-white" placeholder="UK, Australia, Canada, USA..." /></div>
                    </div>
                  </div>
                )}

                {activeTab === 'scoring' && (
                  <div className="space-y-4">
                    <div><label className="font-semibold">Scoring System</label><Input value={formData.scoringSystem} onChange={e => setFormData({ ...formData, scoringSystem: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="Band 0-9 (0.5 increments)" /></div>
                    <div><label className="font-semibold">Result Timeline — If not verified, use "Check current provider information"</label><Input value={formData.resultTimeline} onChange={e => setFormData({ ...formData, resultTimeline: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="Paper: 13 days, Computer: 3-5 days" /></div>
                    <div><label className="font-semibold">Cost Summary — If not verified, use "Check current provider information"</label><Input value={formData.costSummary} onChange={e => setFormData({ ...formData, costSummary: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="Check current provider information" /></div>
                    <div><label className="font-semibold">Validity Summary</label><Input value={formData.validitySummary} onChange={e => setFormData({ ...formData, validitySummary: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="2 years" /></div>
                    <div><label className="font-semibold">Acceptance Summary — Disclaimer: Acceptance varies</label><textarea value={formData.acceptanceSummary} onChange={e => setFormData({ ...formData, acceptanceSummary: e.target.value })} rows={3} className="w-full mt-1 p-2 rounded-xl border border-[#E2E8F0] bg-white" placeholder="Widely accepted for UK, Canada, Australia..." /></div>
                    <p className="text-[11px] text-amber-700 p-2 rounded-lg bg-amber-50 border border-amber-100">Do not claim universal acceptance. Always disclaimer: Acceptance varies by university, course and visa route.</p>
                  </div>
                )}

                {activeTab === 'modules' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500">Modules managed via separate API /api/admin/language-prep/modules — Coming soon: CRUD for EnglishPrepModule with sortOrder, duration, skillsAssessed, questionFormat, commonChallenges, preparationTips, source verification.</p>
                    <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center">
                      <BarChart3 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold">Module Editor</p>
                      <p className="text-[11px] text-slate-500 mt-1">IELTS: Listening 30m 40q, Reading 60m 40q, Writing 60m 2 tasks, Speaking 11-14m — PTE: Speaking & Writing 54-67m, Reading 29-30m, Listening 30-43m — etc. Dynamic per test, not reuse IELTS modules for all.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'acceptance' && (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center">
                    <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">Acceptance Editor — Country-specific</p>
                    <p className="text-[11px] text-slate-500 mt-1">Manage EnglishPrepAcceptance: countryName, countrySlug, isAccepted, summary, requirements, visaRelevance, sourceUrl, sourceName, lastVerifiedAt, verificationStatus. Disclaimer: Acceptance varies.</p>
                  </div>
                )}

                {activeTab === 'requirements' && (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center">
                    <Globe className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">Requirements Editor</p>
                    <p className="text-[11px] text-slate-500 mt-1">EnglishPrepRequirement: country, university, course, studyLevel, testName, minOverall, minComponent, waiverAvailable, remarks, sourceUrl, lastVerifiedAt — If not available: "Requirement not available in database. Check university course page."</p>
                  </div>
                )}

                {activeTab === 'faqs' && (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center">
                    <HelpCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">FAQ Editor — 15-20 per test</p>
                    <p className="text-[11px] text-slate-500 mt-1">EnglishPrepFaq: question, answer, category, sourceUrl, lastVerifiedAt, isPublished, sortOrder. Test-specific, not generic.</p>
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="space-y-3">
                    <div><label className="font-semibold">SEO Title — Detail: {'{Test Name} Preparation | Requirements, Format & Study Abroad Guidance | ALO Education'}</label><Input value={formData.seoTitle} onChange={e => setFormData({ ...formData, seoTitle: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="IELTS Preparation | Requirements, Format & Study Abroad Guidance | ALO Education" /></div>
                    <div><label className="font-semibold">SEO Description</label><textarea value={formData.seoDescription} onChange={e => setFormData({ ...formData, seoDescription: e.target.value })} rows={3} className="w-full mt-1 p-2 rounded-xl border border-[#E2E8F0] bg-white" placeholder="Prepare for IELTS..." /></div>
                    <div><label className="font-semibold">Canonical URL</label><Input value={formData.canonicalUrl} onChange={e => setFormData({ ...formData, canonicalUrl: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="https://aloeducation.com/language-prep/ielts" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2"><input type="checkbox" checked={formData.isPopular} onChange={e => setFormData({ ...formData, isPopular: e.target.checked })} /><label className="font-semibold">Is Popular (badge)</label></div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={formData.isFeatured} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} /><label className="font-semibold">Is Featured</label></div>
                    </div>
                  </div>
                )}

                {activeTab === 'sources' && (
                  <div className="space-y-4">
                    <div><label className="font-semibold">Source URL * — Every factual field must have source</label><Input value={formData.sourceUrl} onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail" /></div>
                    <div><label className="font-semibold">Source Name *</label><Input value={formData.sourceName} onChange={e => setFormData({ ...formData, sourceName: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="IELTS Official - British Council" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="font-semibold">Verified By</label><Input value={formData.verifiedBy} onChange={e => setFormData({ ...formData, verifiedBy: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="admin@aloeducation.com" /></div>
                      <div><label className="font-semibold">Last Verified At</label><Input type="date" value={formData.lastVerifiedAt} onChange={e => setFormData({ ...formData, lastVerifiedAt: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" /></div>
                    </div>
                    <div><label className="font-semibold">Verification Status</label>
                      <select value={formData.verificationStatus} onChange={e => setFormData({ ...formData, verificationStatus: e.target.value })} className="w-full mt-1 h-9 px-3 rounded-xl border border-[#E2E8F0] bg-white">
                        <option value="pending">Pending</option><option value="verified">Verified</option><option value="outdated">Outdated</option><option value="requires_verification">Requires Verification</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-amber-700 p-2 rounded-lg bg-amber-50 border border-amber-100">If verificationStatus != verified, public UI must show "Check current provider information" or "Information requires verification" — never invent data.</p>
                  </div>
                )}

                {activeTab === 'publish' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={formData.isPublished} onChange={e => setFormData({ ...formData, isPublished: e.target.checked })} /><label className="font-semibold">Is Published (visible on public site)</label></div>
                    <div><label className="font-semibold">Sort Order</label><Input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: e.target.value })} className="mt-1 h-9 rounded-xl border-[#E2E8F0]" placeholder="0 = first" /></div>
                    <Card className="p-4 bg-emerald-50 border-emerald-200 rounded-xl">
                      <h4 className="font-bold text-xs text-emerald-900">Publish Checklist</h4>
                      <ul className="text-[11px] text-emerald-800 mt-2 space-y-1 list-disc pl-4">
                        <li>Basic info filled, no lorem, no fake</li>
                        <li>Source URL + Name + Verified By + Last Verified At + Status</li>
                        <li>SEO Title: {'{Test Name} Preparation | Requirements, Format & Study Abroad Guidance | ALO Education'}</li>
                        <li>Is Popular badge only if verified</li>
                        <li>MOI flagged as moi_guidance not english_proficiency</li>
                        <li>No fake testimonials, pricing, result time, acceptance</li>
                        <li>Acceptance disclaimer present</li>
                        <li>Visa careful — never "IELTS mandatory everywhere"</li>
                      </ul>
                    </Card>
                  </div>
                )}

                {(activeTab === 'prep' || activeTab === 'resources' || activeTab === 'success') && (
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] text-center">
                    <Library className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">{activeTab.toUpperCase()} Editor</p>
                    <p className="text-[11px] text-slate-500 mt-1">This tab manages {activeTab} data via dedicated APIs — to be implemented with same verification rules. Only approved success stories with consent_status=approved status=published.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="h-9 rounded-xl text-xs">Cancel</Button>
                <Button type="submit" className="bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-9 rounded-xl text-xs"><Save className="w-4 h-4 mr-1" /> Save Test</Button>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm">Select a test to edit its 13 tabs</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">Basic / Format / Modules / Scoring / Acceptance / Requirements / Prep / FAQs / Resources / Success / SEO / Sources / Publish — Super Admin full access, source verification every factual field.</p>
              <Button onClick={handleNew} className="mt-4 bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-9 rounded-xl text-xs"><Plus className="w-4 h-4 mr-1" /> Create New Test</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
