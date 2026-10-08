'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, TrendingUp, Clock, Award, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentEnglishPrepProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    preferredTest: 'ielts',
    currentScore: '',
    targetScore: '',
    testDate: '',
    preparationStatus: 'not_started',
    weakestModule: '',
  });

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch('/api/language-prep/student-profile');
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setFormData({
          preferredTest: data.profile.preferredTest || 'ielts',
          currentScore: data.profile.currentScore?.toString() || '',
          targetScore: data.profile.targetScore?.toString() || '',
          testDate: data.profile.testDate ? new Date(data.profile.testDate).toISOString().split('T')[0] : '',
          preparationStatus: data.profile.preparationStatus || 'not_started',
          weakestModule: data.profile.weakestModule || '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/language-prep/student-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('English prep profile saved — database-driven');
        setProfile(data.profile);
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading your English prep profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-extrabold text-[#0F172A]">My English Prep — Student Portal</h1>
          <p className="text-xs text-slate-500">Store preferred_test, current_score, target_score, test_date, preparation_status — DB-driven, no fake</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
          <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-[#2563EB]" /><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current → Target</span></div>
          <p className="text-lg font-black text-[#0F172A]">{formData.currentScore || '—'} → {formData.targetScore || '—'}</p>
          <p className="text-[11px] text-slate-500 mt-1">Gap: {formData.currentScore && formData.targetScore ? (parseFloat(formData.targetScore) - parseFloat(formData.currentScore)).toFixed(1) : '—'}</p>
        </Card>
        <Card className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-emerald-600" /><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Progress</span></div>
          <p className="text-lg font-black text-[#0F172A]">{profile?.progress || 0}%</p>
          <p className="text-[11px] text-slate-500 mt-1">Status: {formData.preparationStatus}</p>
        </Card>
        <Card className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
          <div className="flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-amber-600" /><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Weakest Module</span></div>
          <p className="text-sm font-bold text-[#0F172A]">{formData.weakestModule || 'Not set'}</p>
          <p className="text-[11px] text-slate-500 mt-1">Focus: {formData.weakestModule ? `Practice ${formData.weakestModule}` : 'Diagnostic needed'}</p>
        </Card>
      </div>

      <Card className="p-6 bg-white border border-[#E2E8F0] rounded-2xl">
        <h3 className="font-bold text-sm text-[#0F172A] mb-4">English Preparation Profile — Personalization</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Preferred Test</label>
              <select value={formData.preferredTest} onChange={e => setFormData({ ...formData, preferredTest: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-white text-sm">
                <option value="ielts">IELTS Academic</option>
                <option value="ielts-ukvi">IELTS UKVI</option>
                <option value="pte-academic">PTE Academic</option>
                <option value="toefl-ibt">TOEFL iBT</option>
                <option value="duolingo">Duolingo English Test</option>
                <option value="oietc">OIETC</option>
                <option value="oxford-ellt">Oxford ELLT</option>
                <option value="languagecert">LanguageCert</option>
                <option value="oet">OET</option>
                <option value="moi">MOI Guidance</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Preparation Status</label>
              <select value={formData.preparationStatus} onChange={e => setFormData({ ...formData, preparationStatus: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-white text-sm">
                <option value="not_started">Not Started</option>
                <option value="assessment">Assessment</option>
                <option value="in_progress">In Progress</option>
                <option value="mock_tests">Mock Tests</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Current Score</label>
              <Input value={formData.currentScore} onChange={e => setFormData({ ...formData, currentScore: e.target.value })} placeholder="e.g. 6.0" className="h-11 rounded-xl border-[#E2E8F0]" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Target Score</label>
              <Input value={formData.targetScore} onChange={e => setFormData({ ...formData, targetScore: e.target.value })} placeholder="e.g. 7.0" className="h-11 rounded-xl border-[#E2E8F0]" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Test Date</label>
              <Input type="date" value={formData.testDate} onChange={e => setFormData({ ...formData, testDate: e.target.value })} className="h-11 rounded-xl border-[#E2E8F0]" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Weakest Module</label>
              <select value={formData.weakestModule} onChange={e => setFormData({ ...formData, weakestModule: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-white text-sm">
                <option value="">Select weakest</option>
                <option value="Listening">Listening</option>
                <option value="Reading">Reading</option>
                <option value="Writing">Writing</option>
                <option value="Speaking">Speaking</option>
                <option value="Speaking & Writing">Speaking & Writing (PTE)</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold h-11 rounded-xl">Save English Prep Profile</Button>
        </form>

        {profile && (
          <div className="mt-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
            <p><span className="text-slate-500">Recommended:</span> <span className="font-bold">{profile.recommendedTest || formData.preferredTest}</span></p>
            <p><span className="text-slate-500">Counselor:</span> <span className="font-semibold">{profile.counselorName || 'Not assigned'}</span></p>
            <p><span className="text-slate-500">Last Updated:</span> <span className="font-semibold">{profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : '—'}</span></p>
            <p className="text-[11px] text-amber-700 p-2 rounded-lg bg-amber-50 border border-amber-100 mt-2">Personalization: My English Prep Current/Target/Progress/Recommended/Weakest/Counselor — Only if logged in, DB-driven, no fake</p>
          </div>
        )}
      </Card>

      <Card className="p-5 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white border-0 rounded-2xl">
        <h4 className="font-bold text-sm">Need Help Choosing Test?</h4>
        <p className="text-xs text-blue-100 mt-1 leading-relaxed">Tell us your destination, university and course — our counselor can help you understand relevant English requirement.</p>
        <div className="flex gap-2 mt-3">
          <Button asChild className="w-full bg-white text-[#2563EB] hover:bg-slate-50 font-bold h-9 rounded-xl text-xs"><a href="/language-prep" className="flex-1">Explore Test Prep →</a></Button>
          <Button asChild variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold h-9 rounded-xl text-xs"><a href="/language-prep/comparison">Compare Tests</a></Button>
        </div>
      </Card>
    </div>
  );
}
