'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Target, MapPin, GraduationCap, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CrmEnglishPrepCounselorView() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      setLoading(true);
      const res = await fetch('/api/language-prep/leads?limit=50');
      const data = await res.json();
      if (data.success) setLeads(data.leads || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = leads.filter(l =>
    !search ||
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) ||
    l.testName?.toLowerCase().includes(search.toLowerCase()) ||
    l.countryName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0F172A]">CRM — English Prep Leads & Counselor View</h1>
            <p className="text-xs text-slate-500">Counselor view: destination, university, course, required test, current/target, status, test date, missing action — CRM integration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search name, phone, test, country..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-xl border-[#E2E8F0] text-xs w-64" />
          </div>
          <Button onClick={fetchLeads} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold h-9 rounded-xl text-xs">Refresh</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <h2 className="font-bold text-sm">Language Prep Leads ({filtered.length}) — source=language_prep source_section tracked</h2>
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading leads...</div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-2xl">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#0F172A]">No language prep leads yet</p>
              <p className="text-xs text-slate-500 mt-1">Leads will appear here after form submission on /language-prep pages — stored with source language_prep and source_section</p>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {filtered.map((lead: any) => (
                <Card key={lead.id} className="p-4 bg-white border border-[#E2E8F0] rounded-2xl hover:border-[#2563EB]/30 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-[#0F172A]">{lead.name}</h3>
                        <Badge className="bg-blue-50 text-[#2563EB] border-blue-100 text-[10px]">{lead.testName || '—'}</Badge>
                        <Badge className="bg-[#F8FAFC] border border-[#E2E8F0] text-slate-600 text-[10px]">{lead.sourceSection || lead.source || 'language_prep'}</Badge>
                        <span className="text-[11px] text-slate-500">{lead.phone}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-[11px]">
                        <div><span className="text-slate-400 block">Destination</span><span className="font-semibold">{lead.countryName || '—'}</span></div>
                        <div><span className="text-slate-400 block">University</span><span className="font-semibold">{lead.universityName || '—'}</span></div>
                        <div><span className="text-slate-400 block">Course</span><span className="font-semibold">{lead.courseName || '—'}</span></div>
                        <div><span className="text-slate-400 block">Intake</span><span className="font-semibold">{lead.intake || '—'}</span></div>
                        <div><span className="text-slate-400 block">Current</span><span className="font-bold text-[#2563EB]">{lead.currentScore || '—'}</span></div>
                        <div><span className="text-slate-400 block">Target</span><span className="font-bold text-emerald-600">{lead.targetScore || '—'}</span></div>
                        <div><span className="text-slate-400 block">Status</span><span className="font-semibold">{lead.status || 'new'}</span></div>
                        <div><span className="text-slate-400 block">Created</span><span className="font-semibold">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}</span></div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{lead.notes || ''}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-7 text-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg">View</Button>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-7 text-[10px] bg-white border-[#E2E8F0] rounded-lg">Contact</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
            <h3 className="font-bold text-sm text-[#0F172A] mb-3">Counselor View Fields — Required</h3>
            <ul className="text-[11px] text-slate-600 space-y-2 list-disc pl-4">
              <li>Destination (countryName)</li>
              <li>University (universityName)</li>
              <li>Course (courseName)</li>
              <li>Required Test (testName / testId)</li>
              <li>Current Score (currentScore)</li>
              <li>Target Score (targetScore)</li>
              <li>Status (new/contacted/qualified/converted)</li>
              <li>Test Date (if provided)</li>
              <li>Missing Action (counselor note)</li>
              <li>Source: language_prep, Source Section: e.g. ielts_final_cta</li>
            </ul>
          </Card>

          <Card className="p-5 bg-amber-50 border-amber-200 rounded-2xl">
            <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> CRM Integration Notes</h4>
            <ul className="text-[11px] text-amber-800 mt-2 space-y-1.5 list-disc pl-4">
              <li>Lead created via POST /api/language-prep/leads with dedup 24h phone+test</li>
              <li>Fallback to LeadForm + MarketingLead + PortalAuditLog LANGUAGE_PREP_LEAD_CREATED</li>
              <li>Do not create duplicate leads unnecessarily — check 24h window</li>
              <li>Store name/phone/email/country/university/course/test/target/current/intake source=language_prep source_section</li>
              <li>Counselor can view but not edit verification fields — Super Admin full</li>
            </ul>
          </Card>

          <Card className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
            <h4 className="font-bold text-xs text-[#0F172A]">Internal Linking — SEO</h4>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <a href="/language-prep" className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB]">Language Prep Landing</a>
              <a href="/language-prep/comparison" className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB]">Comparison</a>
              <a href="/course-finder" className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB]">Course Finder</a>
              <a href="/destinations" className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB]">Destinations</a>
              <a href="/scholarships" className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB]">Scholarships</a>
              <a href="/visa" className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] hover:border-[#2563EB]">Visa Support</a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
