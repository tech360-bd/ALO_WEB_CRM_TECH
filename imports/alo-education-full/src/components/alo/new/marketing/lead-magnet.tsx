'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Download, Bell, CheckCircle, FileText, Mail, ArrowRight, Sparkles
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const CORAL = '#bf4520';
const INK = '#2d3142';
const PAPER = '#f5f5f5';

// ── Download Guide ─────────────────────────────────────────────────────────
interface DownloadGuideProps {
  title?: string;
  description?: string;
  className?: string;
  onSubmit?: (email: string) => void;
}

export function DownloadGuide({
  title = 'Free UK Study Guide 2025',
  description = 'Everything you need to know about studying in the UK — from choosing a university to getting your visa. 40+ pages of insider tips.',
  className = '',
  onSubmit,
}: DownloadGuideProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    onSubmit?.(email);
  };

  return (
    <Card className="bg-white border border-[#e5e7eb]" style={{ borderRadius: '8px' }}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#bf4520]/10 rounded-[6px] flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6 text-[#bf4520]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#2d3142] mb-1">{title}</h3>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-4">{description}</p>
            {submitted ? (
              <div className="flex items-center gap-2 text-sm text-[#22c55e]">
                <CheckCircle className="h-4 w-4" />
                Check your inbox for the download link!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-[#f5f5f5] border-[#e5e7eb] flex-1"
                  style={{ borderRadius: '6px' }}
                  required
                />
                <Button
                  type="submit"
                  className="bg-[#bf4520] hover:bg-[#a33a1a] text-white shrink-0"
                  style={{ borderRadius: '6px' }}
                >
                  <Download className="h-4 w-4 mr-1" /> Free
                </Button>
              </form>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Scholarship Alert ──────────────────────────────────────────────────────
interface ScholarshipAlertProps {
  className?: string;
  onSubmit?: (email: string) => void;
}

export function ScholarshipAlert({ className = '', onSubmit }: ScholarshipAlertProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    onSubmit?.(email);
  };

  return (
    <Card className="bg-[#fffbeb] border border-[#fde68a]" style={{ borderRadius: '8px' }}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-[6px] flex items-center justify-center shrink-0">
            <Bell className="h-6 w-6 text-[#f59e0b]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#92400e] mb-1">Get Scholarship Alerts</h3>
            <p className="text-sm text-[#92400e]/70 leading-relaxed mb-4">
              New scholarships matching your profile — delivered to your inbox. Never miss a deadline again.
            </p>
            {submitted ? (
              <div className="flex items-center gap-2 text-sm text-[#22c55e]">
                <CheckCircle className="h-4 w-4" />
                You&apos;re subscribed! Watch for your first alert.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white border-[#fde68a] flex-1"
                  style={{ borderRadius: '6px' }}
                  required
                />
                <Button
                  type="submit"
                  className="bg-[#f59e0b] hover:bg-[#d97706] text-white shrink-0"
                  style={{ borderRadius: '6px' }}
                >
                  <Bell className="h-4 w-4 mr-1" /> Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Eligibility Checker ────────────────────────────────────────────────────
interface EligibilityCheckerProps {
  className?: string;
  onCheck?: (data: { gpa: string; country: string; exam: string; score: string }) => void;
}

export function EligibilityChecker({ className = '', onCheck }: EligibilityCheckerProps) {
  const [gpa, setGpa] = useState('');
  const [country, setCountry] = useState('UK');
  const [exam, setExam] = useState('IELTS');
  const [score, setScore] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleCheck = () => {
    if (!gpa || !score) return;
    const gpaNum = parseFloat(gpa);
    const scoreNum = parseFloat(score);
    const isEligible = gpaNum >= 3.0 && scoreNum >= 6.5;
    setResult(isEligible ? 'eligible' : 'not-eligible');
    onCheck?.({ gpa, country, exam, score });
  };

  return (
    <Card className="bg-white border border-[#e5e7eb]" style={{ borderRadius: '8px' }}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-bold text-[#2d3142] flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#bf4520]" />
          Check Your Eligibility in 2 Minutes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#6b7280] mb-1 block">GPA (out of 4.0)</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="4"
              placeholder="3.5"
              value={gpa}
              onChange={e => setGpa(e.target.value)}
              className="bg-[#f5f5f5] border-[#e5e7eb]"
              style={{ borderRadius: '6px' }}
            />
          </div>
          <div>
            <label className="text-xs text-[#6b7280] mb-1 block">Target Country</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="bg-[#f5f5f5] border-[#e5e7eb]" style={{ borderRadius: '6px' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-[#6b7280] mb-1 block">English Test</label>
            <Select value={exam} onValueChange={setExam}>
              <SelectTrigger className="bg-[#f5f5f5] border-[#e5e7eb]" style={{ borderRadius: '6px' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IELTS">IELTS</SelectItem>
                <SelectItem value="TOEFL">TOEFL</SelectItem>
                <SelectItem value="PTE">PTE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-[#6b7280] mb-1 block">Score</label>
            <Input
              type="number"
              step="0.5"
              min="0"
              placeholder="7.0"
              value={score}
              onChange={e => setScore(e.target.value)}
              className="bg-[#f5f5f5] border-[#e5e7eb]"
              style={{ borderRadius: '6px' }}
            />
          </div>
        </div>
        <Button
          onClick={handleCheck}
          disabled={!gpa || !score}
          className="w-full bg-[#bf4520] hover:bg-[#a33a1a] text-white"
          style={{ borderRadius: '6px' }}
        >
          Check Eligibility <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        {result === 'eligible' && (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[6px] p-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#22c55e] shrink-0" />
            <span className="text-sm text-[#166534]">
              Great news! You appear eligible for programs in {country}. Book a free consultation for personalized recommendations.
            </span>
          </div>
        )}
        {result === 'not-eligible' && (
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[6px] p-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#f59e0b] shrink-0" />
            <span className="text-sm text-[#92400e]">
              You may need additional preparation. Our counselors can create a personalized improvement plan — book a free consultation.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Visa Checklist Download ────────────────────────────────────────────────
interface VisaChecklistProps {
  country?: string;
  className?: string;
  onSubmit?: (email: string) => void;
}

export function VisaChecklist({
  country = 'UK',
  className = '',
  onSubmit,
}: VisaChecklistProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    onSubmit?.(email);
  };

  const CHECKLIST_ITEMS = [
    'Valid passport (6+ months)',
    'CAS letter from university',
    'Financial evidence',
    'English test results',
    'TB test certificate',
    'Academic transcripts',
    'Passport photographs',
    'Visa application form',
  ];

  return (
    <Card className="bg-white border border-[#e5e7eb]" style={{ borderRadius: '8px' }}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-bold text-[#2d3142] flex items-center gap-2">
          <Download className="h-5 w-5 text-[#bf4520]" />
          Free {country} Visa Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-1 mb-4">
          {CHECKLIST_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-[#6b7280]">
              <div className="w-4 h-4 border border-[#e5e7eb] rounded-[2px] shrink-0" />
              {item}
            </div>
          ))}
        </div>
        {submitted ? (
          <div className="flex items-center gap-2 text-sm text-[#22c55e]">
            <CheckCircle className="h-4 w-4" />
            Checklist sent to your email!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[#f5f5f5] border-[#e5e7eb] flex-1"
              style={{ borderRadius: '6px' }}
              required
            />
            <Button
              type="submit"
              className="bg-[#bf4520] hover:bg-[#a33a1a] text-white shrink-0"
              style={{ borderRadius: '6px' }}
            >
              <Download className="h-4 w-4 mr-1" /> Get
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
