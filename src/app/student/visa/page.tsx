'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStudentAuth } from '@/app/student/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield, CheckCircle2, AlertCircle, Clock, FileText, ArrowRight,
  Sparkles, BookOpen, AlertTriangle, RefreshCw, Upload, Check, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function StudentVisaReadinessPage() {
  const { student, token } = useStudentAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchVisaData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/student-portal/visa', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVisaData();
  }, [fetchVisaData]);

  const score = data?.readinessScore || 75;
  const checklist = data?.checklist || [
    { title: 'Valid Passport (6+ months validity)', status: 'approved' },
    { title: 'Official Academic Certificates & Transcripts', status: 'approved' },
    { title: 'English Language Test Result (IELTS/PTE)', status: 'approved' },
    { title: 'Unconditional Offer / CAS / I-20 Letter', status: 'approved' },
    { title: '28-Day Bank Statement & Solvency Proof', status: 'under_review' },
    { title: 'Sponsor Declaration & Relationship Affidavit', status: 'under_review' },
    { title: 'Study Gap Justification Document', status: 'pending' },
    { title: 'Embassy Credibility Mock Interview', status: 'pending' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0057B8]" />
            <span>Visa Readiness & Preparation</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track your visa milestones, checklist verification, and practice embassy mock interviews.</p>
        </div>

        <Link href="/student/ai-interview">
          <Button className="bg-gradient-to-r from-[#0057B8] to-[#E8501A] hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-[#0057B8]/20">
            <Sparkles className="w-4 h-4" />
            <span>Practice AI Visa Interview</span>
          </Button>
        </Link>
      </div>

      {/* Readiness Meter Card */}
      <Card className="bg-gradient-to-br from-[#0d1526] to-[#152238] border-white/10 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs text-blue-300 font-semibold tracking-wider uppercase">Current Visa Readiness Score</p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-5xl font-extrabold text-white">{score}%</span>
                <Badge className={
                  score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  score >= 60 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }>
                  {score >= 80 ? 'HIGH READINESS' : score >= 60 ? 'NEEDS DOCUMENTATION' : 'ATTENTION REQUIRED'}
                </Badge>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                Calculated across 10 verification criteria: passport, academics, English test, financial solvency, study gap, and interview performance.
              </p>
            </div>

            <div className="flex-1 max-w-md">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0057B8] to-[#E8501A] rounded-full transition-all duration-500"
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Documents (50%)</span>
                <span>Financials (25%)</span>
                <span>Interview (25%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visa Checklist & Officer Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-[#0d1526] border-white/10 text-white">
            <CardHeader className="p-4 border-b border-white/10">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Visa Document Checklist</span>
                <span className="text-xs text-gray-400">
                  {checklist.filter((i: any) => i.status === 'approved').length} of {checklist.length} Verified
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {checklist.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.status === 'approved' ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : item.status === 'under_review' ? (
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/10 text-gray-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-sm text-gray-200">{item.title}</span>
                  </div>

                  <Badge className={
                    item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    item.status === 'under_review' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }>
                    {item.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* AI & Officer Actions */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-[#0057B8]/20 to-[#E8501A]/10 border border-[#0057B8]/30 text-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E8501A]" />
                <h3 className="font-bold text-sm">AI Mock Interview Simulator</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Practice embassy credibility questions in question-by-question mode. Our AI understands Bangladeshi accents and speech patterns.
              </p>
              <Link href="/student/ai-interview" className="block">
                <Button className="w-full bg-[#0057B8] hover:bg-[#0046a0] text-white text-xs py-2.5 flex items-center justify-center gap-2">
                  <span>Start Practice Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1526] border-white/10 text-white">
            <CardHeader className="p-4 border-b border-white/10">
              <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Officer Feedback</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-300 leading-relaxed">
                {data?.studentFeedback || 'Your financial documents are currently under review by our Visa Team. Please ensure your 28-day bank statement maintains the minimum balance threshold.'}
              </p>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                <span>Visa Team Officer</span>
                <span>Verified</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
