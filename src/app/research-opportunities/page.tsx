'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ArrowRight } from 'lucide-react';

export default function ResearchOpportunitiesPageRoute() {
  const researchProjects = [
    {
      title: 'PhD in Quantum Machine Learning & AI Optimization',
      university: 'University of Oxford',
      country: 'United Kingdom',
      funding: 'Fully Funded (Stipend + Tuition)',
      deadline: '15 Dec 2026',
      supervisor: 'Prof. Andrew Hamilton',
      type: 'Doctoral Project',
    },
    {
      title: 'MRes in Sustainable Renewable Energy Materials',
      university: 'Technical University of Munich (TUM)',
      country: 'Germany',
      funding: 'Tuition-Free / DAAD Eligible',
      deadline: '31 Jan 2027',
      supervisor: 'Dr. Elena Rostova',
      type: 'Research Master',
    },
    {
      title: 'PhD in Clinical Biomarkers & Genomics',
      university: 'University of Toronto',
      country: 'Canada',
      funding: 'Graduate Teaching Assistantship Available',
      deadline: '01 Mar 2027',
      supervisor: 'Prof. Marcus Vance',
      type: 'Doctoral Project',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pt-20 pb-16 max-w-5xl mx-auto px-4 w-full">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Award className="w-4 h-4" /> MRes, MPhil, PhD & Funded Doctoral Projects
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Postgraduate Research Opportunities</h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm">
            Search verified MRes, MPhil, PhD, DPhil, and DBA programmes, funded doctoral projects, and supervisor-led research opportunities.
          </p>
        </div>

        <div className="space-y-4">
          {researchProjects.map((p, idx) => (
            <Card key={idx} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {p.type}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {p.funding}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{p.title}</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{p.university} • {p.country}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                <span>Supervisor: <strong className="text-slate-800">{p.supervisor}</strong></span>
                <span>Deadline: <strong className="text-slate-800">{p.deadline}</strong></span>
                <a href="/book-consultation?service=research">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold">
                    Request Supervisor Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
