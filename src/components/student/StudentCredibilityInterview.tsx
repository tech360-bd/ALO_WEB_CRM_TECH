'use client';

/**
 * Credibility interview records — /student/credibility-interview
 *
 * Reads GET /api/student/visa-interviews, which returns the mock and credibility
 * interview sessions recorded for the student. Scores are practice scores from
 * our own sessions; they are not a prediction of an embassy decision.
 */

import Link from 'next/link';
import { MessageSquareQuote, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';
import { cn } from '@/lib/utils';

interface Interview {
  id: string;
  interviewType: string;
  difficulty: string;
  language: string;
  status: string;
  scheduledAt: string;
  completedAt: string | null;
  overallScore: number;
  verdict: string;
  readiness: string;
  officerNotes: string;
  finalAssessment: string;
  strengths: string;
  weaknesses: string;
  improvements: string;
  documentsRequired: string;
}

interface InterviewAnswer {
  id: string;
  interviewId: string;
  question: string;
  answer: string;
  followUp: string;
  score: number;
  feedback: string;
  category: string;
}

interface InterviewsResponse {
  success: boolean;
  interviews: Interview[];
  answers: InterviewAnswer[];
  total: number;
}

const TYPE_LABELS: Record<string, string> = {
  embassy_mock: 'Mock embassy interview',
  credibility: 'Credibility interview',
  university_interview: 'University interview',
  pre_cas: 'Pre-CAS interview',
};

export default function StudentCredibilityInterview() {
  const { data, state, error, reload } = useStudentResource<InterviewsResponse>('/api/student/visa-interviews');

  const interviews = data?.interviews ?? [];
  const answers = data?.answers ?? [];

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <PortalPageHeader
          title="Credibility Interview"
          description="Your mock and credibility interview sessions, with the feedback your interviewer recorded."
          action={
            <Button asChild variant="outline" className="h-9 rounded-button border-[var(--alo-border)] bg-white px-4 text-[13px] font-semibold">
              <Link href="/ai/visa-coach">
                <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                Practise with AI Coach
              </Link>
            </Button>
          }
        />

        {state === 'loading' && <PortalLoading label="Loading your interview records…" />}

        {state === 'error' && <PortalError message={error ?? 'Your interview records could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && interviews.length === 0 && (
          <PortalCard>
            <PortalEmpty
              title="No interview sessions yet"
              description="Your counselor schedules a mock credibility interview once your visa file is ready. You can practise questions with the AI coach in the meantime."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild className="h-9 rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-black hover:bg-orange-500">
                    <Link href="/ai/visa-coach">Practise with AI Coach</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-9 rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                    <Link href="/student/messages">Ask to Book a Session</Link>
                  </Button>
                </div>
              }
            />
          </PortalCard>
        )}

        {state === 'ready' && interviews.length > 0 && (
          <div className="space-y-4">
            {interviews.map((interview) => {
              const sessionAnswers = answers.filter((answer) => answer.interviewId === interview.id);
              return (
                <PortalCard
                  key={interview.id}
                  title={TYPE_LABELS[interview.interviewType] ?? interview.interviewType}
                  description={`${interview.difficulty} · ${interview.language} · ${new Date(interview.scheduledAt).toLocaleDateString('en-GB')}`}
                >
                  <div className="grid gap-3 border-b border-[var(--alo-border)] px-5 py-4 sm:grid-cols-3">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Status</p>
                      <div className="mt-1"><StatusBadge value={interview.status} /></div>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Verdict</p>
                      <p className="mt-1 text-[13px] font-semibold text-[var(--alo-text)]">
                        {interview.verdict.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Practice score</p>
                      <p className={cn(
                        'mt-1 text-[20px] font-bold leading-none',
                        interview.overallScore >= 80 ? 'text-emerald-600' : interview.overallScore >= 50 ? 'text-amber-600' : 'text-red-600',
                      )}>
                        {Math.round(interview.overallScore)}
                        <span className="text-[13px] font-medium text-[var(--alo-text-muted)]"> / 100</span>
                      </p>
                    </div>
                  </div>

                  {interview.finalAssessment && (
                    <div className="px-5 py-4">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Overall assessment</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-body)]">{interview.finalAssessment}</p>
                    </div>
                  )}

                  <div className="grid gap-4 border-t border-[var(--alo-border)] px-5 py-4 md:grid-cols-3">
                    {interview.strengths && (
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Strengths</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-body)]">{interview.strengths}</p>
                      </div>
                    )}
                    {interview.weaknesses && (
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-red-700">Needs work</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-body)]">{interview.weaknesses}</p>
                      </div>
                    )}
                    {interview.improvements && (
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">How to improve</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-body)]">{interview.improvements}</p>
                      </div>
                    )}
                  </div>

                  {interview.documentsRequired && (
                    <div className="border-t border-[var(--alo-border)] bg-[var(--alo-page)] px-5 py-3">
                      <p className="text-[12px] font-semibold text-[var(--alo-body)]">Documents to prepare</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--alo-body)]">{interview.documentsRequired}</p>
                    </div>
                  )}

                  {interview.officerNotes && (
                    <div className="border-t border-[var(--alo-border)] px-5 py-3">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Interviewer notes</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-body)]">{interview.officerNotes}</p>
                    </div>
                  )}

                  {sessionAnswers.length > 0 && (
                    <div className="border-t border-[var(--alo-border)]">
                      <p className="px-5 pt-4 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">
                        Questions asked ({sessionAnswers.length})
                      </p>
                      <ul className="divide-y divide-[var(--alo-border)]">
                        {sessionAnswers.map((answer) => (
                          <li key={answer.id} className="px-5 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="flex items-start gap-2 text-[13px] font-semibold text-[var(--alo-text)]">
                                <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-[var(--alo-text-muted)]" aria-hidden="true" />
                                {answer.question}
                              </p>
                              <span className="shrink-0 rounded-full border border-[var(--alo-border)] bg-[var(--alo-page)] px-2 py-0.5 text-[11px] font-semibold text-[var(--alo-body)]">
                                {Math.round(answer.score)} / 100
                              </span>
                            </div>
                            {answer.answer && (
                              <p className="mt-2 rounded-input border border-[var(--alo-border)] bg-[var(--alo-page)] px-3 py-2 text-[13px] leading-relaxed text-[var(--alo-body)]">
                                {answer.answer}
                              </p>
                            )}
                            {answer.followUp && (
                              <p className="mt-2 text-[12px] text-[var(--alo-text-muted)]">
                                <span className="font-semibold">Follow-up: </span>{answer.followUp}
                              </p>
                            )}
                            {answer.feedback && (
                              <p className="mt-2 text-[13px] leading-relaxed text-[var(--alo-body)]">{answer.feedback}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </PortalCard>
              );
            })}

            <p className="text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
              These scores come from our own practice sessions. A visa officer assesses your genuine intent, funding and
              circumstances, and no practice score predicts their decision.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
