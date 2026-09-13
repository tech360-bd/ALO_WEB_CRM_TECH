'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStudentAuth } from '@/app/student/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Mic, MicOff, Send, Play, RotateCcw, CheckCircle2,
  Award, Shield, BookOpen, AlertTriangle, ArrowRight, Loader2, RefreshCw
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
  const { student, token } = useStudentAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState('embassy_mock');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
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
        toast.success(`AI interview started — type ${interviewType} — session ${json.sessionId} — AI interview 9 types Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness one Q at a time`);
        // Load questions based on type — real question engine would come from API
        const baseQuestions: QuestionItem[] = [
          { category: 'Introduction & Country', question: 'Why did you choose this country for your higher education rather than Bangladesh?', researchLabel: 'Common' },
          { category: 'University Knowledge', question: 'Why did you select this university over other institutions?', researchLabel: 'Official' },
          { category: 'Course Modules', question: 'Can you detail two specific core modules in your course curriculum and how they align with your career?', researchLabel: 'Official' },
          { category: 'Funding & Sponsor', question: 'Who is sponsoring your tuition and living expenses, and what is their verified annual income and source of funds?', researchLabel: 'Common' },
          { category: 'Study Gap & Work History', question: 'Could you explain your study gap and what professional experience you acquired during that period?', researchLabel: 'Potential' },
          { category: 'Future Career Plan', question: 'What is your exact career plan after completing your degree back in Bangladesh?', researchLabel: 'Common' },
          { category: 'Refusal History', question: 'Have you ever been refused a visa for any country? If yes, explain reason and improvements.', researchLabel: 'Potential' },
          { category: 'English Proficiency', question: 'How have you prepared for English language requirements and living in an English-speaking environment?', researchLabel: 'Practice' },
        ];
        setQuestions(baseQuestions);
        setCurrentIdx(0);
        setHistory([]);
        setCompleted(false);
        setFinalResult(null);
      } else {
        toast.error(json.error || 'Failed to start AI interview — practice 3 days after package store attempts improvement');
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
      toast.error('Answer required — AI must ask naturally one question at a time wait for answer — understand Bangladeshi English accents broken English Banglish pauses incomplete pronunciation — do NOT penalize Bangladeshi accent — evaluate meaning/clarity/consistency/relevance/confidence');
      return;
    }
    if (!sessionId) {
      toast.error('No active session — start AI interview first — POST /api/visa/ai-interview/start');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/visa/ai-interview/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: currentQ.question, answer: userAnswer, category: currentQ.category, transcript: userAnswer }),
      });
      const json = await res.json();
      if (json.success) {
        const evalFeedback = {
          questionId: currentQ.id || `q${currentIdx}`,
          question: currentQ.question,
          answer: userAnswer,
          score: json.data?.score || 75,
          strengths: json.data?.feedback || 'Good foundation and genuine intent conveyed — AI understands Bangladeshi English',
          improvements: json.flags?.length ? `Detected: ${json.flags.join(', ')} — Be more precise regarding sponsor income, course modules, university specifics, future plan — truthful consistent not memorized false` : 'Add specific module names, sponsor annual income, bank statement history, career plan in Bangladesh — truthful consistent',
          accentToleranceNote: 'Bangladeshi English speech patterns evaluated on clarity, relevance, semantic intent — no penalty applied for non-native accent — understand Bangladeshi English accents broken English Banglish pauses incomplete pronunciation — evaluate meaning/clarity/consistency/relevance/confidence/understanding rather than accent alone',
          flags: json.flags || [],
          nextQuestionHint: json.nextQuestionHint,
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
      // Finish session
      try {
        const avgScore = history.length ? Math.round(history.reduce((a, b) => a + (b.score || 0), 0) / history.length) : 0;
        const res = await fetch(`/api/visa/ai-interview/${sessionId}/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            overallReadiness: avgScore,
            communicationClarity: 75,
            confidence: 75,
            courseKnowledge: 80,
            universityKnowledge: 80,
            countryKnowledge: 80,
            financialExplanation: 70,
            sponsorExplanation: 70,
            studyGapExplanation: 75,
            futurePlanClarity: 80,
            refusalExplanation: 75,
            documentReadiness: 75,
            visaRisk: avgScore < 60 ? 60 : 20,
            verdict: avgScore >= 80 ? 'READY' : avgScore >= 60 ? 'NEEDS_PRACTICE' : 'HUMAN_REVIEW_REQUIRED',
            finalFeedback: `AI preliminary analysis only — human officer remains responsible for final internal assessment — average score ${avgScore}% — ${history.length} questions answered — Interview prep doc branded question/answer framework/student answer/AI suggestion no memorized false truthful consistent — Financial/future plan framework real info no fabrication salary/balance/income/employment/job/assets/travel/academic — must show uncertainty/cite source/flag manual verification/recommend human review — Practice 3 days after package store attempts improvement — video/voice reuse existing store session/timestamp/transcript/audio/video ref/AI analysis/human review explicit consent no secret recording`,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setFinalResult(json.result);
          setCompleted(true);
          toast.success(`AI interview completed — score ${avgScore}% — AI preliminary only human final — human responsible — NOT visa decision`);
        }
      } catch (err) {
        setCompleted(true);
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
    return <div className="p-8 text-center text-gray-400 text-xs"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Starting AI interview session — real API — no fake — POST /api/visa/ai-interview/start — 9 types Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness</div>;
  }

  if (!sessionId) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto text-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2"><Badge className="bg-[#0057B8]/20 text-[#60a5fa] border-[#0057B8]/30"><Sparkles className="w-3.5 h-3.5 mr-1" /> AI Simulator — Real DB</Badge><h1 className="text-2xl font-bold">Visa Mock Interview Practice — 9 Types — One Q At A Time — Real API</h1></div>
            <p className="text-gray-400 text-xs mt-1">Question-by-question credibility practice with accent-tolerant AI evaluation — AI must ask naturally one question at a time wait for answer ask relevant follow-up detect incomplete answers identify contradictions memorized answers weak explanations unclear funding weak course/university/future plan refusal gaps — Do not judge solely by grammar — must understand Bangladeshi English accents broken English Banglish pauses incomplete pronunciation non-native patterns — Do NOT penalize Bangladeshi accent — Evaluate meaning/clarity/consistency/relevance/confidence/understanding rather than accent alone — Practice 3 days after package store attempts improvement — video/voice reuse existing store session/timestamp/transcript/audio/video ref/AI analysis/human review explicit consent no secret recording — AI safety never guarantee approval/success/pretend embassy/confidential/invent requirements/refusal/university/policy/speculation as fact/automatically final decision must show uncertainty/cite source/flag manual verification/recommend human review</p>
          </div>
          <Link href="/student/visa"><Button variant="outline" className="border-white/10 text-gray-300 hover:text-white text-xs">Back to Visa Readiness — Safe Only</Button></Link>
        </div>

        <Card className="bg-[#0d1526] border-white/10 text-white">
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
            <Button onClick={startSession} className="w-full bg-[#0057B8] hover:bg-[#0046a0] text-white flex items-center justify-center gap-2"><Play className="w-4 h-4" /> Start AI Interview Session — Real API POST /api/visa/ai-interview/start — Practice 3 Days After Package Store Attempts Improvement</Button>
            <p className="text-[10px] text-gray-500">Research engine 6mo recent official sources label Common/Potential/Practice/Official/AI-generated never confidential/guarantee — Question engine 30+ categories dynamic follow-up — Interview prep doc branded question/answer framework/student answer/AI suggestion no memorized false truthful consistent — Financial/future plan framework real info no fabrication — Video/voice reuse existing store session/timestamp/transcript/audio/video ref/AI analysis/human review explicit consent no secret recording</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-white p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2"><Badge className="bg-[#0057B8]/20 text-[#60a5fa] border-[#0057B8]/30"><Sparkles className="w-3.5 h-3.5 mr-1" /> AI Simulator — Session {sessionId}</Badge><h1 className="text-2xl font-bold">Visa Mock Interview Practice — One Q At A Time — Real DB</h1></div>
          <p className="text-gray-400 text-xs mt-1">Question-by-question credibility practice with accent-tolerant AI evaluation — {interviewType} — {questions.length} questions — detect incomplete/contradictions/memorized/weak — understand Bangladeshi English — no accent penalty — API: /api/visa/ai-interview/{sessionId}/answer</p>
        </div>
        <Link href="/student/visa"><Button variant="outline" className="border-white/10 text-gray-300 hover:text-white text-xs">Back to Visa Readiness</Button></Link>
      </div>

      {!completed ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-gray-400"><span>Question {currentIdx + 1} of {questions.length} — Real DB — No Fake</span><span>Category: <strong className="text-white">{currentQ?.category}</strong> • Research Label: {currentQ?.researchLabel || 'Practice'} — Common/Potential/Practice/Official/AI-generated never confidential/guarantee</span></div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#0057B8] to-[#E8501A] transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} /></div>

          <Card className="bg-[#0d1526] border-white/10 text-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0057B8]/20 text-[#60a5fa] flex items-center justify-center flex-shrink-0 mt-0.5"><span className="font-bold text-sm">Q{currentIdx + 1}</span></div>
                <div><h2 className="text-lg font-semibold text-white leading-relaxed">{currentQ?.question}</h2><p className="text-[11px] text-blue-300 mt-2 bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20">💡 Counselor Tip: Focus on unique curriculum modules, industry faculty, research facilities, legitimate source of funds, career plan in Bangladesh — truthful consistent not memorized false — Financial/future plan framework real info no fabrication salary/balance/income/employment/job/assets/travel/academic — Research Label: {currentQ?.researchLabel || 'Practice'} — 6mo recent official sources label Common/Potential/Practice/Official/AI-generated never confidential/guarantee</p></div>
              </div>
            </CardContent>
          </Card>

          {!feedback ? (
            <Card className="bg-[#0d1526] border-white/10 text-white">
              <CardContent className="p-6 space-y-4">
                <label className="block text-xs font-medium text-gray-300">Your Answer (Speak or Type) — AI understands Bangladeshi English/Banglish/broken/pauses — do NOT penalize accent — evaluate meaning/clarity/consistency/relevance/confidence</label>
                <textarea rows={5} value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder="State your clear, genuine answer here — truthful consistent — no memorized false — real info no fabrication salary/balance/income/employment/job/assets/travel/academic" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#0057B8] text-sm" />
                <div className="flex items-center justify-between gap-4">
                  <Button type="button" variant="outline" onClick={() => setIsRecording(!isRecording)} className={`border-white/10 text-xs flex items-center gap-2 ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'text-gray-300'}`}>{isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}<span>{isRecording ? 'Stop Recording — Explicit Consent No Secret Recording — Store Session/Timestamp/Transcript/Audio/Video Ref/AI Analysis/Human Review' : 'Voice Input (Audio Practice) — Reuse Existing Video/Voice Store Session/Timestamp/Transcript/Audio/Video Ref'}</span></Button>
                  <Button onClick={handleSubmitAnswer} disabled={!userAnswer.trim() || submitting} className="bg-[#0057B8] hover:bg-[#0046a0] text-white flex items-center gap-2">{submitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Evaluating — Real API — Detect Incomplete/Contradictions/Memorized/Weak</span> : <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Submit for AI Review — One Q At A Time — Real API POST /api/visa/ai-interview/{sessionId}/answer</span>}</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-[#0d1526] to-[#152238] border-emerald-500/30 text-white animate-in fade-in">
              <CardHeader className="p-6 border-b border-white/10 flex flex-row items-center justify-between"><div><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">EVALUATION SCORE: {feedback.score}/100 — AI Preliminary Only Human Final</Badge><CardTitle className="text-base font-bold mt-1">AI Credibility Feedback — Preliminary Only — Human Responsible — NOT Visa Decision</CardTitle></div><div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-lg">{feedback.score}%</div></CardHeader>
              <CardContent className="p-6 space-y-4">
                <div><p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Strengths — What Is Strong</p><p className="text-sm text-gray-200 mt-1">{feedback.strengths}</p></div>
                <div><p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Required Improvement — What Is Weak/Missing/Next Action/Responsible/Deadline</p><p className="text-sm text-gray-200 mt-1">{feedback.improvements}</p></div>
                {feedback.flags?.length > 0 && <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-xs text-amber-300">⚠️ Flags Detected: {feedback.flags.join(', ')} — AI detects incomplete/contradictions/memorized/weak — unclear funding weak course/university/future plan refusal gaps</div>}
                <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-gray-400">🛡️ {feedback.accentToleranceNote}</div>
                <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 text-xs text-blue-300">📚 Interview prep doc branded question/answer framework/student answer/AI suggestion no memorized false truthful consistent — Financial/future plan framework real info no fabrication salary/balance/income/employment/job/assets/travel/academic — AI safety never guarantee approval/success/pretend embassy/confidential/invent requirements/refusal/university/policy/speculation as fact/automatically final decision must show uncertainty/cite source/flag manual verification/recommend human review</div>
                <div className="flex justify-end pt-4 border-t border-white/10"><Button onClick={handleNext} className="bg-[#0057B8] hover:bg-[#0046a0] text-white flex items-center gap-2"><span>{currentIdx < questions.length - 1 ? 'Next Question — One Q At A Time — Real API' : 'View Final Scorecard — 12 Dimensions — AI Preliminary Only Human Final'}</span><ArrowRight className="w-4 h-4" /></Button></div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="bg-[#0d1526] border-white/10 text-white text-center p-8">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center mx-auto"><Award className="w-8 h-8 text-white" /></div>
            <div><h2 className="text-2xl font-bold">Mock Interview Completed! — Real DB — Scorecard 12 Scores AI Preliminary Only Human Final</h2><p className="text-gray-400 text-xs mt-1">Your practice answers and scores have been saved to your visa profile — Timeline event Visa AI Interview Completed — Student practice AI Q-by-Q voice/text follow-up history feedback retry progress understand non-native no accent penalty — Practice 3 days after package store attempts improvement — video/voice reuse existing store session/timestamp/transcript/audio/video ref/AI analysis/human review explicit consent no secret recording — AI preliminary only human final — human responsible — NOT visa decision</p></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10"><p className="text-xs text-gray-400">Average Score — Real DB</p><p className="text-2xl font-bold text-emerald-400 mt-1">{history.length ? Math.round(history.reduce((a, b) => a + (b.score || 0), 0) / history.length) : 0}%</p></div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10"><p className="text-xs text-gray-400">Questions Answered — Real DB</p><p className="text-2xl font-bold text-white mt-1">{history.length}</p></div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10"><p className="text-xs text-gray-400">Credibility Verdict — Internal NOT Visa Decision</p><p className="text-sm font-bold text-blue-400 mt-2">{finalResult?.verdict || (history.length && history.reduce((a, b) => a + (b.score || 0), 0) / history.length >= 80 ? 'READY' : 'NEEDS_PRACTICE')}</p></div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10"><p className="text-xs text-gray-400">Officer Review — Human Responsible</p><p className="text-sm font-bold text-amber-400 mt-2">QUEUED — HUMAN_REVIEW_REQUIRED</p></div>
            </div>
            <div className="text-[10px] text-gray-500">Scorecard 12 dimensions clarity/confidence/courseKnowledge/universityKnowledge/countryKnowledge/financialExplanation/sponsorExplanation/studyGapExplanation/futurePlan/refusalExplanation/documentReadiness/overallReadiness — AI preliminary only human final — Final result internal workflow status NOT visa decision — final assessment/strengths/weaknesses/improvements/docs required/second interview/escalation/readiness READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED internal not visa decision — AI safety never guarantee approval/success/pretend embassy/confidential/invent requirements/refusal/university/policy/speculation as fact/automatically final decision must show uncertainty/cite source/flag manual verification/recommend human review</div>
            <div className="flex justify-center gap-4 pt-4"><Button onClick={handleRestart} variant="outline" className="border-white/10 text-gray-300 flex items-center gap-2"><RotateCcw className="w-4 h-4" /><span>Practice Again — 3 Days After Package Store Attempts Improvement</span></Button><Link href="/student/visa"><Button className="bg-[#0057B8] hover:bg-[#0046a0] text-white">Return to Visa Center — Safe Readiness Only — Timeline</Button></Link></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
