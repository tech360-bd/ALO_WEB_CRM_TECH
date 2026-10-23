'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStudentAuth } from '@/app/student/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Send, RotateCcw, ArrowRight, Loader2, RefreshCw, Award, Play
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface QuestionItem {
  id?: string;
  category: string;
  question: string;
  tip?: string;
  researchLabel?: string;
}

export default function StudentAiInterviewPage() {
  const { token } = useStudentAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState('embassy_mock');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const startSession = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/visa/ai-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interviewType }),
      });
      const json = await res.json();
      if (json.success) {
        setSessionId(json.sessionId);
        toast.success(`Practice session started — type ${interviewType} — session saved. No automated assessment is enabled.`);
        // General practice prompts only; these are not official embassy questions or country-specific requirements.
        const baseQuestions: QuestionItem[] = [
          { category: 'Introduction', question: 'Please introduce yourself and summarize your recent education.', researchLabel: 'Practice' },
          { category: 'Country Choice', question: 'What are your main reasons for choosing this study destination?', researchLabel: 'Practice' },
          { category: 'Institution', question: 'What have you learned about your chosen institution, and why does it fit your study plans?', researchLabel: 'Practice' },
          { category: 'Course Choice', question: 'What do you expect to study, and how does it relate to your background or goals?', researchLabel: 'Practice' },
          { category: 'Funding', question: 'How do you plan to fund tuition and living costs? Share only what you are comfortable sharing; never enter account numbers, passwords, or OTPs.', researchLabel: 'Practice' },
          { category: 'Study History', question: 'Is there a gap in your study or work history that you would like to explain?', researchLabel: 'Practice' },
          { category: 'Future Plans', question: 'What are your plans after completing the course?', researchLabel: 'Practice' },
          { category: 'Previous Refusal', question: 'If you have had a visa refusal, how have you addressed the reasons stated in the decision? You may skip sensitive details here.', researchLabel: 'Practice' },
        ];
        setQuestions(baseQuestions);
        setCurrentIdx(0);
        setHistory([]);
        setCompleted(false);
        setFinalResult(null);
      } else {
        toast.error(json.error || 'Unable to start practice session.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to start session');
    } finally {
      setLoading(false);
    }
  }, [token, interviewType]);

  useEffect(() => {
    // Auto-start not — wait for user selection
  }, []);

  const currentQ = questions[currentIdx];

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.error('Enter a practice response. Do not include private banking credentials or unverifiable facts.');
      return;
    }
    if (!sessionId) {
      toast.error('Start a practice session first.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/visa/ai-interview/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: currentQ.question, answer: userAnswer, category: currentQ.category }),
      });
      const json = await res.json();
      if (json.success) {
        const evalFeedback = {
          questionId: currentQ.id || `q${currentIdx}`,
          question: currentQ.question,
          answer: userAnswer,
          score: null,
          strengths: 'Your response has been saved. Automated content assessment is not enabled.',
          improvements: json.flags?.length ? 'This response was short. If you want, add more detail in your own words; never invent facts.' : 'A human officer has not assessed this answer. Keep it truthful and consistent with your actual documents.',
          accentToleranceNote: 'No automated pronunciation, accent, eligibility, or visa scoring is performed. This practice is not an official interview.',
          flags: json.flags || [],
          nextQuestionHint: null,
        };
        setFeedback(evalFeedback);
        setHistory(prev => [...prev, evalFeedback]);
      } else {
        toast.error(json.error || 'Failed to submit answer');
      }
    } catch (err) {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    setFeedback(null);
    setUserAnswer('');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(curr => curr + 1);
    } else {
      // Finish the saved practice transcript; no score is fabricated or submitted by the student.
      try {
        const res = await fetch(`/api/visa/ai-interview/${sessionId}/finish`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error(json.error || 'Unable to finish practice session.');
          return;
        }
        setFinalResult(json);
        setCompleted(true);
        toast.success('Practice transcript saved; officer review is pending. No automated visa assessment was generated.');
      } catch {
        toast.error('Unable to finish practice session.');
      }
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setUserAnswer('');
    setFeedback(null);
    setHistory([]);
    setCompleted(false);
    setFinalResult(null);
    setSessionId(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--alo-text-muted)] text-xs"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Starting private practice session…</div>;
  }

  if (!sessionId) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto text-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2"><Badge className="bg-[var(--alo-brand)]/20 text-[#60a5fa] border-[var(--alo-brand)]/30"><Sparkles className="w-3.5 h-3.5 mr-1" /> AI Simulator</Badge><h1 className="text-2xl font-bold">Visa Mock Interview Practice</h1></div>
            <p className="text-[var(--alo-text-muted)] text-xs mt-1">Practise embassy credibility questions one at a time. The AI is accent-tolerant — it evaluates the meaning, clarity and consistency of your answers, never your accent — and follows up where an answer is incomplete. This is practice only: it cannot guarantee a visa outcome, and a human officer makes the final internal assessment.</p>
          </div>
          <Link href="/student/visa"><Button variant="outline" className="border-white/10 text-[var(--alo-placeholder)] hover:text-white ">Back to Visa Readiness</Button></Link>
        </div>

        <Card className="bg-[var(--alo-text)] border-white/10 text-white">
          <CardHeader><CardTitle className="text-sm">Select Interview Type — 9 Types: Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <select value={interviewType} onChange={e => setInterviewType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white">
              <option value="embassy_mock">Embassy Mock — Common Questions</option>
              <option value="credibility">Credibility Interview — UKVI Style</option>
              <option value="pre_cas">Pre-CAS Interview — University</option>
              <option value="university">University Knowledge — Course Modules</option>
              <option value="sponsor">Sponsor & Funding — Source of Funds</option>
              <option value="study_gap">Study Gap — Work Experience</option>
              <option value="refusal">Refusal History — Improvement Plan</option>
              <option value="english">English Proficiency — Communication</option>
              <option value="final_readiness">Final Readiness — Comprehensive</option>
            </select>
            <Button onClick={startSession} className="w-full bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white flex items-center justify-center gap-2"><Play className="w-4 h-4" /> Start AI Interview Session</Button>
            <p className="text-[11px] text-[var(--alo-text-muted)]">This page uses general practice prompts only; it does not cite official sources or provide AI scoring. Use your own verified facts and never enter passwords, OTPs, account numbers, or fabricated figures.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-white p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2"><Badge className="bg-[var(--alo-brand)]/20 text-[#60a5fa] border-[var(--alo-brand)]/30"><Sparkles className="w-3.5 h-3.5 mr-1" /> AI Simulator — Session {sessionId}</Badge><h1 className="text-2xl font-bold">Visa Mock Interview Practice</h1></div>
          <p className="text-[var(--alo-text-muted)] text-xs mt-1">One general practice question at a time. Responses are saved for officer review; automated language, risk, and eligibility scoring is not enabled.</p>
        </div>
        <Link href="/student/visa"><Button variant="outline" className="border-white/10 text-[var(--alo-placeholder)] hover:text-white ">Back to Visa Readiness</Button></Link>
      </div>

      {!completed ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[var(--alo-text-muted)]"><span>Question {currentIdx + 1} of {questions.length}</span><span>Category: <strong className="text-white">{currentQ?.category}</strong> • Label: {currentQ?.researchLabel || 'Practice'}</span></div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-cta)] transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} /></div>

          <Card className="bg-[var(--alo-text)] border-white/10 text-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--alo-brand)]/20 text-[#60a5fa] flex items-center justify-center flex-shrink-0 mt-0.5"><span className="font-bold text-sm">Q{currentIdx + 1}</span></div>
                <div><h2 className="text-lg font-semibold text-white leading-relaxed">{currentQ?.question}</h2><p className="text-[11px] text-blue-300 mt-2 bg-blue-500/10 p-2.5 rounded-lg border border-[var(--alo-brand)]/20">Counsellor tip: Focus on specific curriculum modules, faculty, research facilities, your legitimate source of funds and your career plan after graduation. Keep every answer truthful and consistent with your documents.</p></div>
              </div>
            </CardContent>
          </Card>

          {!feedback ? (
            <Card className="bg-[var(--alo-text)] border-white/10 text-white">
              <CardContent className="p-6 space-y-4">
                <label className="block text-xs font-medium text-[var(--alo-placeholder)]">Your Answer (Type) — practice only; do not include account numbers, passwords, OTPs, or facts you cannot verify</label>
                <textarea rows={5} value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder="State your clear, genuine answer here — based on your real documents and plans" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--alo-brand)] text-sm" />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] text-[var(--alo-text-muted)]">Audio recording is not available in this practice workflow.</p>
                  <Button onClick={handleSubmitAnswer} disabled={!userAnswer.trim() || submitting} className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white flex items-center gap-2">{submitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving response…</span> : <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Save Practice Response</span>}</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-[var(--alo-text)] to-[#152238] border-emerald-500/30 text-white animate-in fade-in">
              <CardHeader className="p-6 border-b border-white/10 flex flex-row items-center justify-between"><div><Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Saved — human review pending</Badge><CardTitle className="text-base font-bold mt-1">Practice response saved</CardTitle></div><div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">REVIEW</div></CardHeader>
              <CardContent className="p-6 space-y-4">
                <div><p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Status</p><p className="text-sm text-gray-200 mt-1">{feedback.strengths}</p></div>
                <div><p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Practice reminder</p><p className="text-sm text-gray-200 mt-1">{feedback.improvements}</p></div>
                {feedback.flags?.length > 0 && <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-xs text-amber-300">Practice note: {feedback.flags.join(', ')}. You may add more detail in your own words; do not invent information.</div>}
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-[var(--alo-text-muted)]">{feedback.accentToleranceNote}</div>
                <div className="bg-blue-500/10 p-3 rounded-lg border border-[var(--alo-brand)]/20 text-xs text-blue-300">Your saved question and response are for practice only. Automated assessment is not enabled; a human officer must review the session.</div>
                <div className="flex justify-end pt-4 border-t border-white/10"><Button onClick={handleNext} className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white flex items-center gap-2"><span>{currentIdx < questions.length - 1 ? 'Next Practice Question' : 'Finish Practice Session'}</span><ArrowRight className="w-4 h-4" /></Button></div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="bg-[var(--alo-text)] border-white/10 text-white text-center p-8">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-cta)] flex items-center justify-center mx-auto"><Award className="w-8 h-8 text-white" /></div>
            <div><h2 className="text-2xl font-bold">Practice Session Completed</h2><p className="text-[var(--alo-text-muted)] text-xs mt-1">Your transcript has been saved. Automated scoring is not enabled; officer review is pending. This is not an official embassy interview or visa decision.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10"><p className="text-xs text-[var(--alo-text-muted)]">Automated Score</p><p className="text-sm font-bold text-[var(--alo-placeholder)] mt-2">Not calculated</p></div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10"><p className="text-xs text-[var(--alo-text-muted)]">Responses Saved</p><p className="text-2xl font-bold text-white mt-1">{history.length}</p></div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10"><p className="text-xs text-[var(--alo-text-muted)]">Human Review</p><p className="text-sm font-bold text-amber-400 mt-2">{finalResult?.assessmentStatus || 'Pending'}</p></div>
            </div>
            <div className="text-[11px] text-[var(--alo-text-muted)]">No automated assessment or visa decision is made by this practice flow. Share only facts you can verify and never enter banking credentials or OTPs.</div>
            <div className="flex justify-center gap-4 pt-4"><Button onClick={handleRestart} variant="outline" className="border-white/10 text-[var(--alo-placeholder)] flex items-center gap-2"><RotateCcw className="w-4 h-4" /><span>Practice Again</span></Button><Link href="/student/visa"><Button className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white">Return to Visa Center</Button></Link></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
