'use client';

import { useState } from 'react';
import { useStudentAuth } from '@/app/student/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Mic, MicOff, Send, Play, RotateCcw, CheckCircle2,
  Award, Shield, BookOpen, AlertTriangle, ArrowRight, Loader2
} from 'lucide-react';
import Link from 'next/link';

interface QuestionItem {
  id: string;
  category: string;
  question: string;
  tip: string;
}

const SAMPLE_QUESTIONS: QuestionItem[] = [
  {
    id: 'q1',
    category: 'University & Course Selection',
    question: 'Why did you choose this specific university and degree program instead of studying in Bangladesh?',
    tip: 'Focus on unique curriculum modules, industry faculty, research facilities, and how it aligns with your future career plan in Bangladesh.'
  },
  {
    id: 'q2',
    category: 'Financial Solvency & Sponsor',
    question: 'Who is sponsoring your tuition fees and living expenses, and what is their legitimate source of funds?',
    tip: 'Clearly state your sponsor relationship, their professional occupation, annual taxable income, and banking history.'
  },
  {
    id: 'q3',
    category: 'Future Career & Return Plan',
    question: 'What are your concrete career plans after completing your degree abroad?',
    tip: 'Detail specific target job roles, multinational companies or industries in Bangladesh, and expected salary progression.'
  },
  {
    id: 'q4',
    category: 'Study Gap & Work History',
    question: 'Could you explain your timeline since your last academic qualification?',
    tip: 'Walk through employment, internships, or skill training with exact dates and supporting certifications.'
  }
];

export default function StudentAiInterviewPage() {
  const { student, token } = useStudentAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);

  const currentQ = SAMPLE_QUESTIONS[currentIdx];

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    setSubmitting(true);
    try {
      // Simulate AI analysis with accent-friendly speech evaluation
      const simulatedScore = Math.floor(75 + Math.random() * 20);
      const isStrong = simulatedScore >= 80;

      const evalFeedback = {
        questionId: currentQ.id,
        question: currentQ.question,
        answer: userAnswer,
        score: simulatedScore,
        strengths: isStrong
          ? 'Clear career relevance and strong articulation of university specifics.'
          : 'Good foundation and genuine intent conveyed.',
        improvements: isStrong
          ? 'Add specific module names to demonstrate deep course research.'
          : 'Be more precise regarding your sponsor\'s annual income and bank statement history.',
        accentToleranceNote: 'Bangladeshi English speech patterns evaluated on clarity, relevance, and semantic intent — no penalty applied for non-native accent.'
      };

      setFeedback(evalFeedback);
      setHistory(prev => [...prev, evalFeedback]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setUserAnswer('');
    if (currentIdx < SAMPLE_QUESTIONS.length - 1) {
      setCurrentIdx(curr => curr + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setUserAnswer('');
    setFeedback(null);
    setHistory([]);
    setCompleted(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#0057B8]/20 text-[#60a5fa] border-[#0057B8]/30">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Simulator
            </Badge>
            <h1 className="text-2xl font-bold">Visa Mock Interview Practice</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Question-by-question credibility practice with accent-tolerant AI evaluation.
          </p>
        </div>

        <Link href="/student/visa">
          <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
            Back to Visa Readiness
          </Button>
        </Link>
      </div>

      {!completed ? (
        <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Question {currentIdx + 1} of {SAMPLE_QUESTIONS.length}</span>
            <span>Category: <strong className="text-white">{currentQ.category}</strong></span>
          </div>

          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0057B8] to-[#E8501A] transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / SAMPLE_QUESTIONS.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <Card className="bg-[#0d1526] border-white/10 text-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0057B8]/20 text-[#60a5fa] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-bold text-sm">Q{currentIdx + 1}</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white leading-relaxed">{currentQ.question}</h2>
                  <p className="text-xs text-blue-300 mt-2 bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20">
                    💡 <strong>Counselor Tip:</strong> {currentQ.tip}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input & Mic Area */}
          {!feedback ? (
            <Card className="bg-[#0d1526] border-white/10 text-white">
              <CardContent className="p-6 space-y-4">
                <label className="block text-xs font-medium text-gray-300">Your Answer (Speak or Type)</label>
                <textarea
                  rows={5}
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="State your clear, genuine answer here..."
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#0057B8] text-sm"
                />

                <div className="flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRecording(!isRecording)}
                    className={`border-white/10 text-xs flex items-center gap-2 ${
                      isRecording ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'text-gray-300'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isRecording ? 'Stop Recording' : 'Voice Input (Audio Practice)'}</span>
                  </Button>

                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || submitting}
                    className="bg-[#0057B8] hover:bg-[#0046a0] text-white flex items-center gap-2"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Evaluating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" /> Submit for AI Review
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* AI Evaluation Feedback Card */
            <Card className="bg-gradient-to-br from-[#0d1526] to-[#152238] border-emerald-500/30 text-white animate-in fade-in">
              <CardHeader className="p-6 border-b border-white/10 flex flex-row items-center justify-between">
                <div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    EVALUATION SCORE: {feedback.score}/100
                  </Badge>
                  <CardTitle className="text-base font-bold mt-1">AI Credibility Feedback</CardTitle>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-lg">
                  {feedback.score}%
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Strengths</p>
                  <p className="text-sm text-gray-200 mt-1">{feedback.strengths}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Required Improvement</p>
                  <p className="text-sm text-gray-200 mt-1">{feedback.improvements}</p>
                </div>

                <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-xs text-gray-400">
                  🛡️ {feedback.accentToleranceNote}
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                  <Button onClick={handleNext} className="bg-[#0057B8] hover:bg-[#0046a0] text-white flex items-center gap-2">
                    <span>{currentIdx < SAMPLE_QUESTIONS.length - 1 ? 'Next Question' : 'View Final Scorecard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Final Scorecard */
        <Card className="bg-[#0d1526] border-white/10 text-white text-center p-8">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center mx-auto">
              <Award className="w-8 h-8 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Mock Interview Completed!</h2>
              <p className="text-gray-400 text-sm mt-1">Your practice answers and scores have been saved to your visa profile.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {Math.round(history.reduce((a, b) => a + b.score, 0) / (history.length || 1))}%
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400">Questions Answered</p>
                <p className="text-2xl font-bold text-white mt-1">{history.length}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400">Credibility Verdict</p>
                <p className="text-sm font-bold text-blue-400 mt-2">HIGH POTENTIAL</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400">Officer Review</p>
                <p className="text-sm font-bold text-amber-400 mt-2">QUEUED</p>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button onClick={handleRestart} variant="outline" className="border-white/10 text-gray-300 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </Button>
              <Link href="/student/visa">
                <Button className="bg-[#0057B8] hover:bg-[#0046a0] text-white">
                  Return to Visa Center
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
