'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Sparkles, Send, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Props {
  caseId?: string;
  onBack?: () => void;
}

const EMPTY_FUNDING_DRAFT = {
  fundingStatus: 'pending_review', sponsor: '', sponsorRelation: '', sponsorOccupation: '', sponsorIncome: '',
  sourceOfFund: '', hasBankStatement: false, hasSolvencyCert: false, sourceOfFundExplanation: '',
  tuitionDeposit: '', livingCostPlan: '', dependentsText: '',
};
const EMPTY_STUDY_GAP_DRAFT = {
  hasStudyGap: '', gapDurationMonths: '0', gapFrom: '', gapTo: '', gapPurpose: '', workExpDuringGap: '',
  explanationClarity: 'unknown', employmentDetails: '', trainingDetails: '', familyReason: '', medicalReason: '',
  visaReason: '', supportingDocumentIds: [] as string[],
};
const EMPTY_REFUSAL_DRAFT = {
  hasVisaRefusal: '', refusalCountry: '', visaType: '', refusalDate: '', refusalReason: '',
  refusalLetterDocumentId: '', previousApplication: '', improvementPlan: '', newExplanation: '',
  officerNote: '', previousRefusalCount: '0', humanReviewStatus: 'pending',
};
const EMPTY_SENSITIVE_DRAFT = {
  seriousMedicalCondition: '', medicalExplanation: '', medicalDocumentId: '', criminalOffense: '',
  criminalExplanation: '', criminalDocumentId: '', officerInternalNote: '', studentSafeNote: '',
};

function documentIdFromDownloadUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const match = /^\/api\/visa\/documents\/([^/]+)\/download$/.exec(value);
  if (!match) return '';
  try { return decodeURIComponent(match[1]); } catch { return ''; }
}

export default function VisaInterviewWorkspace({ caseId, onBack }: Props) {
  const { token } = usePortalStore();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [caseAccess, setCaseAccess] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'interview' | 'funding' | 'study_gap' | 'refusal' | 'sensitive' | 'checklist' | 'readiness' | 'notes' | 'tasks' | 'timeline'>('interview');

  const [activeInterview, setActiveInterview] = useState<any>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [recordedAnswer, setRecordedAnswer] = useState('');
  const [liveTranscript, setLiveTranscript] = useState<any[]>([]);
  const [practiceQuestionDraft, setPracticeQuestionDraft] = useState('');
  const [practiceQuestionCategory, setPracticeQuestionCategory] = useState('general');
  const [humanScore, setHumanScore] = useState('');
  const [humanReadiness, setHumanReadiness] = useState('human_review_required');
  const [humanAssessmentText, setHumanAssessmentText] = useState('');
  const [savingInterview, setSavingInterview] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [officerNoteText, setOfficerNoteText] = useState('');
  const [officerNoteVisibility, setOfficerNoteVisibility] = useState('internal_only');
  const [studentFeedbackText, setStudentFeedbackText] = useState('');
  const [fundingReview, setFundingReview] = useState<any>(null);
  const [fundingDraft, setFundingDraft] = useState<any>({ ...EMPTY_FUNDING_DRAFT });
  const [studyGapReview, setStudyGapReview] = useState<any>(null);
  const [studyGapDraft, setStudyGapDraft] = useState<any>({ ...EMPTY_STUDY_GAP_DRAFT });
  const [refusalReview, setRefusalReview] = useState<any>(null);
  const [refusalDraft, setRefusalDraft] = useState<any>({ ...EMPTY_REFUSAL_DRAFT });
  const [sensitiveReview, setSensitiveReview] = useState<any>(null);
  const [sensitiveDraft, setSensitiveDraft] = useState<any>({ ...EMPTY_SENSITIVE_DRAFT });
  const [savingReviewKey, setSavingReviewKey] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentRequestDraft, setDocumentRequestDraft] = useState({ documentName: '', category: 'general', reason: '', description: '', dueDate: '', priority: 'medium', studentVisible: true, counselorVisible: true });
  const [savingDocumentRequest, setSavingDocumentRequest] = useState(false);
  const [documentReviewDraft, setDocumentReviewDraft] = useState<{ document: any; action: 'reject' | 'needs-update' | null }>({ document: null, action: null });
  const [documentReviewReason, setDocumentReviewReason] = useState('');
  const [documentReviewerNote, setDocumentReviewerNote] = useState('');
  const [savingDocumentReview, setSavingDocumentReview] = useState(false);
  const [readiness, setReadiness] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskDraft, setTaskDraft] = useState({ taskType: 'DOCUMENT_REQUEST', title: '', description: '', assignee: 'student', dueDate: '', priority: 'medium' });
  const [savingTask, setSavingTask] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setCaseData(null);
    setCaseAccess({});
    setActiveInterview(null);
    setInterviewId(null);
    setQuestions([]);
    setLiveTranscript([]);
    setFundingReview(null);
    setFundingDraft({ ...EMPTY_FUNDING_DRAFT });
    setStudyGapReview(null);
    setStudyGapDraft({ ...EMPTY_STUDY_GAP_DRAFT });
    setRefusalReview(null);
    setRefusalDraft({ ...EMPTY_REFUSAL_DRAFT });
    setSensitiveReview(null);
    setSensitiveDraft({ ...EMPTY_SENSITIVE_DRAFT });
    setChecklist([]);
    setDocuments([]);
    setReadiness(null);
    setNotes([]);
    setTasks([]);
    setTimeline([]);
    if (!caseId || !token) {
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const caseRes = await fetch(`/api/visa/cases/${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null));
      if (!caseRes?.data || caseRes.viewScope !== 'full') return;
      const access = caseRes.access || {};
      setCaseData(caseRes.data);
      setCaseAccess(access);
      setOfficerNoteVisibility(access.notesInternalCreate ? 'internal_only' : access.notesCreate ? 'counselor_visible' : 'internal_only');

      const [fundingRes, gapRes, refusalRes, sensitiveRes, documentsRes, readinessRes, notesRes, tasksRes] = await Promise.all([
        access.riskDetails ? fetch(`/api/visa/funding-review/${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null)) : Promise.resolve(null),
        access.riskDetails ? fetch(`/api/visa/study-gap-review/${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null)) : Promise.resolve(null),
        access.riskDetails ? fetch(`/api/visa/refusal-review/${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null)) : Promise.resolve(null),
        access.sensitiveDetails ? fetch(`/api/visa/sensitive-review/${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null)) : Promise.resolve(null),
        access.documents ? fetch(`/api/visa/documents?caseId=${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null)) : Promise.resolve(null),
        access.readiness ? fetch(`/api/visa/readiness/${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null)) : Promise.resolve(null),
        access.notes ? fetch(`/api/visa/notes/${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null)) : Promise.resolve(null),
        access.tasks ? fetch(`/api/visa/tasks?caseId=${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null)) : Promise.resolve(null),
      ]);

      const funding = fundingRes?.data ?? null;
      setFundingReview(funding);
      if (funding) setFundingDraft({
        ...EMPTY_FUNDING_DRAFT,
        fundingStatus: funding.fundingStatus || 'pending_review',
        sponsor: funding.sponsor || '',
        sponsorRelation: funding.sponsorRelation || '',
        sponsorOccupation: funding.sponsorOccupation || '',
        sponsorIncome: funding.sponsorIncome || '',
        sourceOfFund: funding.sourceOfFund || '',
        hasBankStatement: Boolean(funding.hasBankStatement),
        hasSolvencyCert: Boolean(funding.hasSolvencyCert),
        sourceOfFundExplanation: funding.sourceOfFundExplanation || '',
        tuitionDeposit: funding.tuitionDeposit || '',
        livingCostPlan: funding.livingCostPlan || '',
        dependentsText: Array.isArray(funding.dependents) ? funding.dependents.join('\n') : '',
      });
      const study = gapRes?.data ?? null;
      setStudyGapReview(study);
      if (study) setStudyGapDraft({
        ...EMPTY_STUDY_GAP_DRAFT,
        hasStudyGap: typeof study.hasStudyGap === 'boolean' ? (study.hasStudyGap ? 'yes' : 'no') : '',
        gapDurationMonths: String(study.gapDurationMonths ?? 0),
        gapFrom: study.gapFrom || '',
        gapTo: study.gapTo || '',
        gapPurpose: study.gapPurpose || '',
        workExpDuringGap: study.workExpDuringGap || '',
        explanationClarity: study.explanationClarity || 'unknown',
        employmentDetails: study.employmentDetails || '',
        trainingDetails: study.trainingDetails || '',
        familyReason: study.familyReason || '',
        medicalReason: study.medicalReason || '',
        visaReason: study.visaReason || '',
        supportingDocumentIds: Array.isArray(study.supportingDocuments) ? study.supportingDocuments.map((document: any) => document.id).filter(Boolean) : [],
      });
      const refusal = refusalRes?.data ?? null;
      setRefusalReview(refusal);
      if (refusal) setRefusalDraft({
        ...EMPTY_REFUSAL_DRAFT,
        hasVisaRefusal: typeof refusal.hasVisaRefusal === 'boolean' ? (refusal.hasVisaRefusal ? 'yes' : 'no') : '',
        refusalCountry: refusal.refusalCountry || '',
        visaType: refusal.visaType || '',
        refusalDate: refusal.refusalDate || '',
        refusalReason: refusal.refusalReason || '',
        refusalLetterDocumentId: documentIdFromDownloadUrl(refusal.refusalLetterDownloadUrl),
        previousApplication: refusal.previousApplication || '',
        improvementPlan: refusal.improvementPlan || '',
        newExplanation: refusal.newExplanation || '',
        officerNote: refusal.officerNote || '',
        previousRefusalCount: String(refusal.previousRefusalCount ?? 0),
        humanReviewStatus: refusal.humanReviewStatus || 'pending',
      });
      const sensitive = sensitiveRes?.data ?? null;
      setSensitiveReview(sensitive);
      if (sensitive) setSensitiveDraft({
        ...EMPTY_SENSITIVE_DRAFT,
        seriousMedicalCondition: typeof sensitive.seriousMedicalCondition === 'boolean' ? (sensitive.seriousMedicalCondition ? 'yes' : 'no') : '',
        medicalExplanation: sensitive.medicalExplanation || '',
        medicalDocumentId: documentIdFromDownloadUrl(sensitive.medicalDocumentDownloadUrl),
        criminalOffense: typeof sensitive.criminalOffense === 'boolean' ? (sensitive.criminalOffense ? 'yes' : 'no') : '',
        criminalExplanation: sensitive.criminalExplanation || '',
        criminalDocumentId: documentIdFromDownloadUrl(sensitive.criminalDocumentDownloadUrl),
        officerInternalNote: sensitive.officerInternalNote || '',
        studentSafeNote: sensitive.studentSafeNote || '',
      });
      setChecklist(Array.isArray(caseRes.data.checklist) ? caseRes.data.checklist : []);
      setDocuments(Array.isArray(documentsRes?.documents) ? documentsRes.documents : Array.isArray(documentsRes?.data) ? documentsRes.data : []);
      setReadiness(readinessRes?.data ?? null);
      setNotes(Array.isArray(notesRes?.notes) ? notesRes.notes : Array.isArray(notesRes?.data) ? notesRes.data : []);
      setTasks(Array.isArray(tasksRes?.tasks) ? tasksRes.tasks : Array.isArray(tasksRes?.data) ? tasksRes.data : []);

      if (access.interviews) {
        const interviewRes = await fetch(`/api/visa/interviews?caseId=${encodeURIComponent(caseId)}`, { headers }).then(r => r.json().catch(() => null));
        const interviewList = Array.isArray(interviewRes?.data) ? interviewRes.data : [];
        const currentInterview = interviewList.find((interview: any) => String(interview.status).toLowerCase() !== 'cancelled') || null;
        const savedQuestions = Array.isArray(currentInterview?.questions) ? currentInterview.questions : [];
        const savedAnswers = Array.isArray(currentInterview?.answers) ? currentInterview.answers : [];
        setActiveInterview(currentInterview);
        setInterviewId(typeof currentInterview?.id === 'string' ? currentInterview.id : null);
        setQuestions(savedQuestions);
        setLiveTranscript(savedAnswers.map((answer: any) => ({
          questionId: answer.questionId,
          question: answer.question,
          answer: answer.answer,
          category: answer.category || 'general',
        })));
        const firstUnanswered = savedQuestions.findIndex((question: any) => !savedAnswers.some((answer: any) => answer.questionId === question.id));
        setCurrentQuestionIndex(firstUnanswered);
        setHumanScore(String(currentInterview?.status).toLowerCase() === 'completed' && Number.isFinite(Number(currentInterview?.overallScore)) ? String(currentInterview.overallScore) : '');
        setHumanReadiness(['ready', 'needs_practice', 'needs_documents', 'high_risk', 'human_review_required'].includes(String(currentInterview?.readiness).toLowerCase()) ? String(currentInterview.readiness).toLowerCase() : 'human_review_required');
        setHumanAssessmentText(String(currentInterview?.finalAssessment || currentInterview?.officerNotes || ''));
      }

      if (access.timeline) {
        const timelineRes = await fetch(`/api/visa/cases/${encodeURIComponent(caseId)}/timeline`, { headers }).then(r => r.json().catch(() => null));
        setTimeline(Array.isArray(timelineRes?.events) ? timelineRes.events : []);
      }
    } catch (err) {
      console.error('Failed to load visa interview workspace:', err);
      toast.error('Visa case details could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [caseId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const interviewCompleted = String(activeInterview?.status || '').toLowerCase() === 'completed';
  const noteVisibilityOptions = [
    ...(caseAccess.notesInternalCreate ? [
      { value: 'internal_only', label: 'Internal only' },
      { value: 'visa_team_only', label: 'Visa team only' },
    ] : []),
    ...(caseAccess.notesCreate ? [
      { value: 'counselor_visible', label: 'Counselor visible' },
      { value: 'application_team_visible', label: 'Application team visible' },
    ] : []),
    ...(caseAccess.superAdmin ? [{ value: 'super_admin_only', label: 'Super admin only' }] : []),
  ];
  const canCreateOfficerNote = noteVisibilityOptions.length > 0;
  const canAssessInterview = Boolean(caseAccess.interviewFinish && activeInterview && !interviewCompleted);

  const handleStartInterview = async () => {
    if (!caseAccess.interviewCreate) {
      toast.error('You do not have permission to start an interview for this case.');
      return;
    }
    if (!caseId || savingInterview) return;
    setSavingInterview(true);
    try {
      const res = await fetch('/api/visa/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caseId, interviewType: 'embassy_mock', difficulty: 'standard', language: 'english' }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.data?.id) {
        toast.error(result?.error || 'Practice interview could not be started.');
        return;
      }
      setActiveInterview(result.data);
      setInterviewId(result.data.id);
      setQuestions([]);
      setLiveTranscript([]);
      setCurrentQuestionIndex(-1);
      setHumanScore('');
      setHumanReadiness('human_review_required');
      setHumanAssessmentText('');
      toast.success('Practice interview session created. Add saved practice prompts before recording answers.');
      await fetchAll();
    } catch {
      toast.error('Practice interview could not be started.');
    } finally {
      setSavingInterview(false);
    }
  };

  const handleSavePracticeQuestion = async () => {
    if (!caseAccess.interviewUpdate) {
      toast.error('You do not have permission to update this interview.');
      return;
    }
    if (!interviewId || !practiceQuestionDraft.trim() || savingQuestion) return;
    setSavingQuestion(true);
    try {
      const res = await fetch(`/api/visa/interviews/${encodeURIComponent(interviewId)}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: practiceQuestionCategory, question: practiceQuestionDraft.trim(), difficulty: activeInterview?.difficulty || 'standard', language: activeInterview?.language || 'english', questionType: 'custom', followUps: [] }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.data?.id) {
        toast.error(result?.error || 'Practice prompt could not be saved.');
        return;
      }
      const savedQuestion = result.data;
      setQuestions((current) => [...current, savedQuestion]);
      setCurrentQuestionIndex(questions.length);
      setPracticeQuestionDraft('');
      toast.success('Practice prompt saved to this interview.');
    } catch {
      toast.error('Practice prompt could not be saved.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleRecordAnswer = async () => {
    if (!caseAccess.interviewUpdate) {
      toast.error('You do not have permission to record an interview response.');
      return;
    }
    const currentQuestion = questions[currentQuestionIndex];
    if (!interviewId || !currentQuestion || !recordedAnswer.trim() || savingAnswer) {
      if (!recordedAnswer.trim()) toast.error('Record the student response before saving.');
      return;
    }
    if (String(activeInterview?.status).toLowerCase() === 'completed') {
      toast.error('Completed interviews are read-only.');
      return;
    }
    setSavingAnswer(true);
    try {
      const res = await fetch(`/api/visa/interviews/${encodeURIComponent(interviewId)}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId: currentQuestion.id, answer: recordedAnswer.trim() }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.data?.id) {
        toast.error(result?.error || 'Response could not be saved.');
        return;
      }
      const savedAnswer = result.data;
      setLiveTranscript((current) => [...current, { questionId: savedAnswer.questionId, question: savedAnswer.question, answer: savedAnswer.answer, category: savedAnswer.category }]);
      setRecordedAnswer('');
      const answered = new Set([...liveTranscript.map((entry) => entry.questionId), savedAnswer.questionId]);
      const nextIndex = questions.findIndex((question) => !answered.has(question.id));
      setCurrentQuestionIndex(nextIndex);
      toast.success(nextIndex === -1 ? 'Response saved. All saved prompts have a recorded answer; an officer may now enter the human assessment.' : 'Response saved to the interview transcript.');
    } catch {
      toast.error('Response could not be saved.');
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleCalculateReadiness = async () => {
    if (!caseAccess.readinessUpdate) {
      toast.error('You do not have permission to refresh this case-record completion indicator.');
      return;
    }
    try {
      const res = await fetch(`/api/visa/readiness/${encodeURIComponent(caseId || '')}/calculate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'Readiness completion indicator could not be refreshed.');
        return;
      }
      toast.success('Case-record completion indicator refreshed. It is not an eligibility assessment, approval prediction, or guarantee.');
      await fetchAll();
    } catch {
      toast.error('Readiness completion indicator could not be refreshed.');
    }
  };

  const handleSaveOfficerNote = async () => {
    const canCreateSelectedVisibility = ['internal_only', 'visa_team_only'].includes(officerNoteVisibility)
      ? caseAccess.notesInternalCreate
      : caseAccess.notesCreate;
    if (!canCreateSelectedVisibility) {
      toast.error('You do not have permission to create a note with this visibility.');
      return;
    }
    if (!officerNoteText.trim()) {
      toast.error('Note content required.');
      return;
    }
    try {
      const res = await fetch('/api/visa/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caseId, content: officerNoteText, visibility: officerNoteVisibility, noteType: 'officer_note' }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(result?.error || 'Note could not be saved.');
        return;
      }
      toast.success('Visa officer note saved.');
      setOfficerNoteText('');
      await fetchAll();
    } catch {
      toast.error('Note could not be saved.');
    }
  };

  const handleSendStudentFeedback = async () => {
    if (!caseAccess.studentFeedback) {
      toast.error('You do not have permission to approve student-safe feedback.');
      return;
    }
    if (!studentFeedbackText.trim()) {
      toast.error('Enter student-safe feedback before approving it for the portal.');
      return;
    }
    try {
      const res = await fetch(`/api/visa/cases/${encodeURIComponent(caseId || '')}/student-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ supportiveText: studentFeedbackText.trim(), nextSteps: '', missingDocs: [], practiceTips: '', approved: true }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(result?.error || 'Approved feedback could not be shared to the student portal.');
        return;
      }
      toast.success('Approved feedback was saved to the student portal. No external message was sent.');
      setStudentFeedbackText('');
      await fetchAll();
    } catch {
      toast.error('Approved feedback could not be shared to the student portal.');
    }
  };

  const saveReview = async (key: string, route: string, body: Record<string, unknown>) => {
    if (!caseId || savingReviewKey) return;
    setSavingReviewKey(key);
    try {
      const res = await fetch(route, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'The review could not be saved.');
        return;
      }
      toast.success('Review saved for human case review. No visa decision or automated outcome was produced.');
      await fetchAll();
    } catch {
      toast.error('The review could not be saved.');
    } finally {
      setSavingReviewKey(null);
    }
  };

  const handleSaveFundingReview = async () => {
    if (!caseAccess.riskUpdate) return toast.error('You do not have permission to update funding review details.');
    const dependents = fundingDraft.dependentsText.split(/\r?\n/).map((entry: string) => entry.trim()).filter(Boolean);
    if (dependents.length > 20) return toast.error('List no more than 20 dependents.');
    await saveReview('funding', `/api/visa/funding-review/${encodeURIComponent(caseId || '')}`, {
      fundingStatus: fundingDraft.fundingStatus,
      sponsor: fundingDraft.sponsor,
      sponsorRelation: fundingDraft.sponsorRelation,
      sponsorOccupation: fundingDraft.sponsorOccupation,
      sponsorIncome: fundingDraft.sponsorIncome,
      sourceOfFund: fundingDraft.sourceOfFund,
      hasBankStatement: fundingDraft.hasBankStatement,
      hasSolvencyCert: fundingDraft.hasSolvencyCert,
      sourceOfFundExplanation: fundingDraft.sourceOfFundExplanation,
      tuitionDeposit: fundingDraft.tuitionDeposit,
      livingCostPlan: fundingDraft.livingCostPlan,
      dependents,
    });
  };

  const handleSaveStudyGapReview = async () => {
    if (!caseAccess.riskUpdate) return toast.error('You do not have permission to update study-history review details.');
    if (!['yes', 'no'].includes(studyGapDraft.hasStudyGap)) return toast.error('Select whether a study-history gap is recorded.');
    const duration = Number(studyGapDraft.gapDurationMonths);
    if (!Number.isInteger(duration) || duration < 0 || duration > 600) return toast.error('Enter a duration from 0 to 600 months.');
    const body: Record<string, unknown> = {
      hasStudyGap: studyGapDraft.hasStudyGap === 'yes',
      gapDurationMonths: duration,
      gapFrom: studyGapDraft.gapFrom,
      gapTo: studyGapDraft.gapTo,
      gapPurpose: studyGapDraft.gapPurpose,
      workExpDuringGap: studyGapDraft.workExpDuringGap,
      explanationClarity: studyGapDraft.explanationClarity,
      employmentDetails: studyGapDraft.employmentDetails,
      trainingDetails: studyGapDraft.trainingDetails,
      familyReason: studyGapDraft.familyReason,
      visaReason: studyGapDraft.visaReason,
    };
    if (caseAccess.sensitiveDetails && caseAccess.sensitiveUpdate) body.medicalReason = studyGapDraft.medicalReason;
    if (caseAccess.documents && caseAccess.documentsDownload && caseAccess.sensitiveDetails) body.supportingDocumentIds = studyGapDraft.supportingDocumentIds;
    await saveReview('study-gap', `/api/visa/study-gap-review/${encodeURIComponent(caseId || '')}`, body);
  };

  const handleSaveRefusalReview = async () => {
    if (!caseAccess.riskUpdate) return toast.error('You do not have permission to update refusal-history review details.');
    if (!['yes', 'no'].includes(refusalDraft.hasVisaRefusal)) return toast.error('Select whether a prior visa refusal is recorded.');
    const refusalCount = Number(refusalDraft.previousRefusalCount);
    if (!Number.isInteger(refusalCount) || refusalCount < 0 || refusalCount > 50) return toast.error('Enter a refusal count from 0 to 50.');
    const body: Record<string, unknown> = {
      hasVisaRefusal: refusalDraft.hasVisaRefusal === 'yes',
      refusalCountry: refusalDraft.refusalCountry,
      visaType: refusalDraft.visaType,
      refusalDate: refusalDraft.refusalDate,
      refusalReason: refusalDraft.refusalReason,
      previousApplication: refusalDraft.previousApplication,
      improvementPlan: refusalDraft.improvementPlan,
      newExplanation: refusalDraft.newExplanation,
      officerNote: refusalDraft.officerNote,
      previousRefusalCount: refusalCount,
      humanReviewStatus: refusalDraft.humanReviewStatus,
    };
    if (refusalDraft.refusalLetterDocumentId) body.refusalLetterDocumentId = refusalDraft.refusalLetterDocumentId;
    await saveReview('refusal', `/api/visa/refusal-review/${encodeURIComponent(caseId || '')}`, body);
  };

  const handleSaveSensitiveReview = async () => {
    if (!caseAccess.sensitiveDetails || !caseAccess.sensitiveUpdate) return toast.error('Both sensitive-view and sensitive-update permissions are required.');
    if (!['yes', 'no'].includes(sensitiveDraft.seriousMedicalCondition) || !['yes', 'no'].includes(sensitiveDraft.criminalOffense)) {
      return toast.error('Record a yes or no response for both restricted review flags.');
    }
    const body: Record<string, unknown> = {
      medicalExplanation: sensitiveDraft.medicalExplanation,
      criminalExplanation: sensitiveDraft.criminalExplanation,
      officerInternalNote: sensitiveDraft.officerInternalNote,
      studentSafeNote: sensitiveDraft.studentSafeNote,
    };
    if (['yes', 'no'].includes(sensitiveDraft.seriousMedicalCondition)) body.seriousMedicalCondition = sensitiveDraft.seriousMedicalCondition === 'yes';
    if (['yes', 'no'].includes(sensitiveDraft.criminalOffense)) body.criminalOffense = sensitiveDraft.criminalOffense === 'yes';
    if (sensitiveDraft.medicalDocumentId) body.medicalDocumentId = sensitiveDraft.medicalDocumentId;
    if (sensitiveDraft.criminalDocumentId) body.criminalDocumentId = sensitiveDraft.criminalDocumentId;
    await saveReview('sensitive', `/api/visa/sensitive-review/${encodeURIComponent(caseId || '')}`, body);
  };

  const handleCreateTask = async () => {
    if (!caseAccess.tasksCreate) {
      toast.error('You do not have permission to create a task for this case.');
      return;
    }
    if (!caseId || !taskDraft.title.trim() || savingTask) return;
    setSavingTask(true);
    try {
      const res = await fetch('/api/visa/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          caseId,
          taskType: taskDraft.taskType,
          title: taskDraft.title.trim(),
          description: taskDraft.description.trim(),
          assignee: taskDraft.assignee,
          dueDate: taskDraft.dueDate ? new Date(`${taskDraft.dueDate}T00:00:00.000Z`).toISOString() : undefined,
          priority: taskDraft.priority,
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'Task could not be created.');
        return;
      }
      toast.success('Visa case task created. No external message was sent.');
      setTaskDraft({ taskType: 'DOCUMENT_REQUEST', title: '', description: '', assignee: 'student', dueDate: '', priority: 'medium' });
      await fetchAll();
    } catch {
      toast.error('Task could not be created.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    if (!caseAccess.tasksUpdate || savingTaskId) return;
    setSavingTaskId(taskId);
    try {
      const res = await fetch(`/api/visa/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'Task status could not be updated.');
        return;
      }
      toast.success('Task status updated.');
      await fetchAll();
    } catch {
      toast.error('Task status could not be updated.');
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleCreateDocumentRequest = async () => {
    if (!caseAccess.documentsRequest) {
      toast.error('You do not have permission to request a visa document.');
      return;
    }
    if (!caseId || !documentRequestDraft.documentName.trim() || savingDocumentRequest) return;
    setSavingDocumentRequest(true);
    try {
      const res = await fetch('/api/visa/documents/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          caseId,
          documentName: documentRequestDraft.documentName.trim(),
          category: documentRequestDraft.category,
          reason: documentRequestDraft.reason.trim(),
          description: documentRequestDraft.description.trim(),
          dueDate: documentRequestDraft.dueDate ? new Date(`${documentRequestDraft.dueDate}T00:00:00.000Z`).toISOString() : undefined,
          priority: documentRequestDraft.priority,
          studentVisible: documentRequestDraft.studentVisible,
          counselorVisible: documentRequestDraft.counselorVisible,
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'Document request could not be saved.');
        return;
      }
      toast.success('Document request saved to the authorized case workflow. No external message was sent.');
      setDocumentRequestDraft({ documentName: '', category: 'general', reason: '', description: '', dueDate: '', priority: 'medium', studentVisible: true, counselorVisible: true });
      await fetchAll();
    } catch {
      toast.error('Document request could not be saved.');
    } finally {
      setSavingDocumentRequest(false);
    }
  };

  const handleDocumentReview = async (document: any, action: 'approve' | 'reject' | 'needs-update') => {
    if (!caseAccess.documentsReview) {
      toast.error('You do not have permission to review visa documents.');
      return;
    }
    if (action !== 'approve') {
      setDocumentReviewDraft({ document, action });
      setDocumentReviewReason('');
      setDocumentReviewerNote('');
      return;
    }
    setSavingDocumentReview(true);
    try {
      const res = await fetch(`/api/visa/documents/${encodeURIComponent(document.id)}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewerNote: '' }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'Document approval could not be saved.');
        return;
      }
      toast.success('Document review saved. Its private file and version history are retained.');
      await fetchAll();
    } catch {
      toast.error('Document approval could not be saved.');
    } finally {
      setSavingDocumentReview(false);
    }
  };

  const handleSubmitDocumentReview = async () => {
    const { document, action } = documentReviewDraft;
    if (!caseAccess.documentsReview || !document || !action || !documentReviewReason.trim() || savingDocumentReview) return;
    setSavingDocumentReview(true);
    try {
      const res = await fetch(`/api/visa/documents/${encodeURIComponent(document.id)}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: documentReviewReason.trim(), reviewerNote: documentReviewerNote.trim() }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'Document review could not be saved.');
        return;
      }
      toast.success('Document replacement guidance was saved in the student portal. No external message was sent.');
      setDocumentReviewDraft({ document: null, action: null });
      setDocumentReviewReason('');
      setDocumentReviewerNote('');
      await fetchAll();
    } catch {
      toast.error('Document review could not be saved.');
    } finally {
      setSavingDocumentReview(false);
    }
  };

  const handleFinalize = async () => {
    if (!caseAccess.interviewFinish) {
      toast.error('You do not have permission to record the human interview assessment.');
      return;
    }
    if (!interviewId || !activeInterview) {
      toast.error('Start a practice interview before recording an assessment.');
      return;
    }
    if (String(activeInterview.status).toLowerCase() === 'completed') {
      toast.error('This interview is already completed and cannot be edited here.');
      return;
    }
    if (liveTranscript.length === 0) {
      toast.error('Record at least one answer against a saved practice prompt before completing the interview.');
      return;
    }
    const score = Number(humanScore);
    if (humanScore.trim() === '' || !Number.isFinite(score) || score < 0 || score > 100) {
      toast.error('Enter a human officer assessment score from 0 to 100.');
      return;
    }
    setSavingAssessment(true);
    try {
      const res = await fetch(`/api/visa/interviews/${encodeURIComponent(interviewId)}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ overallScore: score, readiness: humanReadiness, officerNotes: humanAssessmentText.trim(), finalAssessment: humanAssessmentText.trim() }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        toast.error(result?.error || 'Human assessment could not be saved.');
        return;
      }
      toast.success('Human officer assessment saved to the completed practice interview. This is not a visa decision or guarantee.');
      await fetchAll();
    } catch {
      toast.error('Human assessment could not be saved.');
    } finally {
      setSavingAssessment(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--alo-text-muted)]"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /><p className="text-xs">Loading case and interview records…</p></div>;
  }

  if (!caseId) {
    return <div className="p-8 text-center text-[var(--alo-text-muted)] text-xs">Open a case from the Visa case list to access this workspace.</div>;
  }

  if (!caseData) {
    return <div className="p-8 text-center text-[var(--alo-text-muted)] text-xs">Visa case is unavailable or outside the authorized case scope.</div>;
  }

  if (!caseAccess.interviews) {
    return <div className="p-8 text-center text-[var(--alo-text-muted)] text-xs">Visa interview access is not granted for this account.</div>;
  }

  return (
    <div className="space-y-6 bg-[var(--alo-page)]/50 min-h-screen p-4 lg:p-6 text-[var(--alo-text)]">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          {onBack ? <Button variant="outline" size="sm" onClick={onBack} className=" "><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</Button> : <Link href="/employee/visa-cases"><Button variant="outline" size="sm" className=" "><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Cases</Button></Link>}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Visa Interview Workspace ({caseData.caseCode})</h1>
              <Badge className="bg-indigo-100 text-indigo-800 text-xs">{caseData.currentStage}</Badge>
              <Badge className="bg-[var(--alo-surface-muted)] text-[var(--alo-body)] text-[11px]">Student ID: {caseData.studentId}</Badge>
            </div>
            <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">Student: <strong className="text-[var(--alo-text)]">{caseData.studentName}</strong> • Destination: <strong className="text-indigo-600">{caseData.destinationCountry}</strong> • University: {caseData.university} • Course: {caseData.course} • Intake: {caseData.intake} • Counselor: {caseData.counselorName} • App Officer: {caseData.applicationOfficerId}</p>
          </div>
        </div>
        {caseAccess.readinessUpdate && <div className="flex items-center gap-2">
          <Button onClick={handleCalculateReadiness} size="sm" variant="outline" className=" "><Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Recalculate Completion</Button>
        </div>}
      </div>

      <div className="flex border-b gap-1 overflow-x-auto bg-white p-1 rounded-xl">
        {[
          { key: 'interview', label: 'Interview & Transcript', allowed: caseAccess.interviews },
          { key: 'funding', label: 'Funding / Sponsor Review', allowed: caseAccess.riskDetails },
          { key: 'study_gap', label: 'Study History Review', allowed: caseAccess.riskDetails },
          { key: 'refusal', label: 'Refusal History Review', allowed: caseAccess.riskDetails },
          { key: 'sensitive', label: 'Restricted Medical / Criminal', allowed: caseAccess.sensitiveDetails },
          { key: 'checklist', label: 'Visa Checklist', allowed: caseAccess.documents },
          { key: 'readiness', label: 'Case Completion', allowed: caseAccess.readiness },
          { key: 'notes', label: 'Officer Notes', allowed: caseAccess.notes || caseAccess.notesCreate || caseAccess.notesInternalCreate },
          { key: 'tasks', label: 'Tasks', allowed: caseAccess.tasks },
          { key: 'timeline', label: 'Visa Timeline', allowed: caseAccess.timeline },
        ].filter(tab => tab.allowed).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-[var(--alo-body)] hover:bg-[var(--alo-surface-muted)]'}`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-white border">
              <CardHeader className="p-4 border-b"><CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--alo-text-muted)]">Visa case summary</CardTitle></CardHeader>
              <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div><span className="text-[var(--alo-text-muted)] block">University</span><span className="font-semibold">{caseData.university}</span></div>
                <div><span className="text-[var(--alo-text-muted)] block">Course</span><span className="font-semibold">{caseData.course}</span></div>
                <div><span className="text-[var(--alo-text-muted)] block">Intake</span><span className="font-semibold">{caseData.intake}</span></div>
                <div><span className="text-[var(--alo-text-muted)] block">Destination</span><span className="font-semibold text-indigo-600">{caseData.destinationCountry}</span></div>
                <div><span className="text-[var(--alo-text-muted)] block">Student ID</span><span className="font-mono text-[11px]">{caseData.studentId}</span></div>
                <div><span className="text-[var(--alo-text-muted)] block">Case Code</span><span className="font-mono text-[11px]">{caseData.caseCode}</span></div>
                <div><span className="text-[var(--alo-text-muted)] block">Counselor</span><span className="font-semibold">{caseData.counselorName}</span></div>
              </CardContent>
            </Card>

            <Card className="bg-white border-indigo-200">
              <CardHeader className="p-4 border-b bg-indigo-50/50 flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold">Practice Interview & Saved Prompts</CardTitle>
                  <p className="text-xs text-[var(--alo-body)] mt-1">Preparation only — not an embassy interview, visa decision, or guarantee. Questions and responses are saved to this case's interview record for human review.</p>
                  {activeInterview && <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Interview {activeInterview.id} · {activeInterview.interviewType} · {activeInterview.status}</p>}
                </div>
                {!activeInterview && caseAccess.interviewCreate && <Button size="sm" disabled={savingInterview} onClick={handleStartInterview} className="shrink-0 bg-indigo-600 text-white">{savingInterview ? 'Starting…' : 'Start Practice Interview'}</Button>}
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {activeInterview && !interviewCompleted && caseAccess.interviewUpdate && (
                  <div className="rounded-lg border bg-[var(--alo-page)] p-3 space-y-3">
                    <div>
                      <p className="text-xs font-semibold">Add a saved practice prompt</p>
                      <p className="text-[11px] text-[var(--alo-text-muted)]">Only prompts saved to this interview can be answered here. No dynamic or unsaved AI-generated follow-ups are shown.</p>
                    </div>
                    <Textarea aria-label="Practice prompt" placeholder="Enter a practice question to save to this interview" rows={2} value={practiceQuestionDraft} onChange={(event) => setPracticeQuestionDraft(event.target.value)} className="text-xs bg-white" />
                    <div className="flex flex-wrap gap-2 items-center">
                      <select aria-label="Prompt category" value={practiceQuestionCategory} onChange={(event) => setPracticeQuestionCategory(event.target.value)} className="bg-white border rounded-lg px-2.5 py-1.5 text-xs">
                        <option value="general">General</option>
                        <option value="country_motivation">Country motivation</option>
                        <option value="university_knowledge">University knowledge</option>
                        <option value="course_knowledge">Course knowledge</option>
                        <option value="funding">Funding</option>
                        <option value="sponsor">Sponsor</option>
                        <option value="study_gap">Study history</option>
                        <option value="future_plan">Future plan</option>
                        <option value="refusal">Previous refusal</option>
                      </select>
                      <Button type="button" variant="outline" size="sm" disabled={savingQuestion || !practiceQuestionDraft.trim()} onClick={handleSavePracticeQuestion}>{savingQuestion ? 'Saving…' : 'Save Prompt'}</Button>
                    </div>
                  </div>
                )}

                {currentQuestion ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                      <p className="text-[11px] font-bold uppercase text-indigo-700">Saved prompt {currentQuestionIndex + 1} of {questions.length} · {currentQuestion.category}</p>
                      <p className="text-sm font-semibold text-[var(--alo-text)] mt-1">{currentQuestion.question}</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold" htmlFor="visa-interview-response">Student response</label>
                      <Textarea id="visa-interview-response" placeholder="Enter the student's response for the transcript. Do not score accent or grammar automatically." rows={4} value={recordedAnswer} onChange={(event) => setRecordedAnswer(event.target.value)} className="text-xs bg-[var(--alo-page)]" disabled={interviewCompleted || savingAnswer || !caseAccess.interviewUpdate} />
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" disabled={!caseAccess.interviewUpdate || savingAnswer || interviewCompleted || !recordedAnswer.trim()} className="bg-indigo-600 text-white" onClick={handleRecordAnswer}>{savingAnswer ? 'Saving…' : 'Save Response to Transcript'}</Button>
                    </div>
                  </div>
                ) : activeInterview ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-[var(--alo-text-muted)]">
                    {interviewCompleted ? 'This interview is completed and read-only.' : questions.length ? 'All saved prompts have a recorded response.' : 'No saved practice prompts yet. Add a prompt above before recording a response.'}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-[var(--alo-text-muted)]">No practice interview session is saved for this case.</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border">
              <CardHeader className="p-4 border-b"><CardTitle className="text-xs font-bold uppercase">J. Live Transcript — {liveTranscript.length} entries</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-3">
                {liveTranscript.length === 0 ? <div className="text-xs text-[var(--alo-text-muted)] p-4 text-center border-dashed border rounded-lg">No interview responses have been recorded yet.</div> : liveTranscript.map((t, idx) => (
                  <div key={idx} className="p-3 bg-[var(--alo-page)] rounded-lg border space-y-1 text-xs"><div className="flex items-center justify-between"><span className="font-bold text-indigo-900">Q: {t.question}</span><Badge variant="outline" className="text-[11px] bg-white">{t.category}</Badge></div><p className="text-[var(--alo-body)] italic">A: "{t.answer}"</p></div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-white border">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-xs font-bold uppercase">Human Officer Assessment</CardTitle>
                <p className="text-xs text-[var(--alo-text-muted)]">No automatic score is generated. An authorized officer records the assessment after reviewing saved answers.</p>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {interviewCompleted ? (
                  <div className="rounded-lg border bg-[var(--alo-page)] p-4 space-y-2 text-xs">
                    <p><span className="font-semibold">Officer-recorded preparation score:</span> {activeInterview.overallScore} / 100</p>
                    <p><span className="font-semibold">Internal preparation status:</span> {activeInterview.readiness}</p>
                    {activeInterview.finalAssessment && <p className="whitespace-pre-wrap"><span className="font-semibold">Assessment:</span> {activeInterview.finalAssessment}</p>}
                    <p className="text-[var(--alo-text-muted)]">This is an internal preparation assessment, not a visa decision or prediction.</p>
                  </div>
                ) : caseAccess.interviewFinish ? (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="visa-human-score" className="text-xs font-semibold">Human officer score (0–100)</label>
                      <input id="visa-human-score" type="number" min={0} max={100} step={1} required value={humanScore} onChange={(event) => setHumanScore(event.target.value)} className="w-full rounded-md border bg-[var(--alo-page)] px-3 py-2 text-sm" disabled={!activeInterview || !caseAccess.interviewFinish || savingAssessment} />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="visa-human-readiness" className="text-xs font-semibold">Internal preparation assessment</label>
                      <select id="visa-human-readiness" value={humanReadiness} onChange={(event) => setHumanReadiness(event.target.value)} className="w-full rounded-md border bg-[var(--alo-page)] px-3 py-2 text-xs" disabled={!activeInterview || !caseAccess.interviewFinish || savingAssessment}>
                        <option value="human_review_required">Human review required</option>
                        <option value="needs_practice">More practice recommended</option>
                        <option value="needs_documents">Document follow-up needed</option>
                        <option value="high_risk">Escalate for additional human review</option>
                        <option value="ready">Preparation review recorded — not an outcome decision</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="visa-human-assessment" className="text-xs font-semibold">Human officer assessment / internal notes</label>
                      <Textarea id="visa-human-assessment" rows={3} value={humanAssessmentText} onChange={(event) => setHumanAssessmentText(event.target.value)} placeholder="Record the officer's review of the saved practice answers" className="text-xs bg-[var(--alo-page)]" disabled={!activeInterview || !caseAccess.interviewFinish || savingAssessment} />
                    </div>
                    <Button disabled={!caseAccess.interviewFinish || !activeInterview || interviewCompleted || savingAssessment || liveTranscript.length === 0 || humanScore.trim() === ''} onClick={handleFinalize} className="w-full bg-indigo-600 text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {savingAssessment ? 'Saving assessment…' : 'Save Human Assessment & Complete Interview'}
                    </Button>
                    <p className="text-[11px] text-[var(--alo-text-muted)]">At least one answer to a saved practice prompt is required. The score and status are recorded as internal preparation data only; no visa or admission decision is made.</p>
                  </>
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-xs text-[var(--alo-text-muted)]">Human assessment editing is restricted to accounts with the interview-finish permission.</p>
                )}
              </CardContent>
            </Card>

            {caseAccess.studentFeedback && (
              <Card className="bg-white border">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-sm font-bold">Approved student feedback</CardTitle>
                  <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Share clear, actionable guidance through the student portal. Keep internal risk notes and outcome guarantees out of student feedback.</p>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  <Textarea
                    aria-label="Student-safe feedback"
                    placeholder="Write supportive, specific next steps for the student."
                    rows={3}
                    value={studentFeedbackText}
                    onChange={(event) => setStudentFeedbackText(event.target.value)}
                    className="text-xs bg-[var(--alo-page)]"
                  />
                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!studentFeedbackText.trim()} onClick={handleSendStudentFeedback}>
                    <Send className="mr-1 h-3.5 w-3.5" /> Approve & share in student portal
                  </Button>
                  <p className="text-[11px] text-[var(--alo-text-muted)]">The feedback is saved to the portal; this action does not send an external message.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'funding' && (
        <Card className="border bg-white">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold">Financial and sponsor review</CardTitle>
            <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Financial information is restricted to authorized case staff. Review prompts are not an automated risk score or decision.</p>
          </CardHeader>
          <CardContent className="space-y-4 p-4 text-xs">
            {!fundingReview && <p className="rounded-lg border border-dashed p-4 text-[var(--alo-text-muted)]">No funding review has been recorded for this case.</p>}
            {caseAccess.riskUpdate ? (
              <div className="grid gap-3 rounded-lg border bg-[var(--alo-page)] p-4 md:grid-cols-2">
                <label className="space-y-1"><span className="font-semibold">Funding review status</span><select value={fundingDraft.fundingStatus} onChange={(event) => setFundingDraft((current: any) => ({ ...current, fundingStatus: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="pending">Pending</option><option value="pending_review">Pending review</option><option value="complete">Complete</option><option value="verified">Verified by officer</option><option value="needs_update">Needs update</option></select></label>
                <label className="space-y-1"><span className="font-semibold">Primary sponsor</span><input maxLength={191} value={fundingDraft.sponsor} onChange={(event) => setFundingDraft((current: any) => ({ ...current, sponsor: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Sponsor relationship</span><input maxLength={191} value={fundingDraft.sponsorRelation} onChange={(event) => setFundingDraft((current: any) => ({ ...current, sponsorRelation: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Occupation</span><input maxLength={191} value={fundingDraft.sponsorOccupation} onChange={(event) => setFundingDraft((current: any) => ({ ...current, sponsorOccupation: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Income details</span><input maxLength={191} value={fundingDraft.sponsorIncome} onChange={(event) => setFundingDraft((current: any) => ({ ...current, sponsorIncome: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Source of funds</span><input maxLength={500} value={fundingDraft.sourceOfFund} onChange={(event) => setFundingDraft((current: any) => ({ ...current, sourceOfFund: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Tuition deposit</span><input maxLength={191} value={fundingDraft.tuitionDeposit} onChange={(event) => setFundingDraft((current: any) => ({ ...current, tuitionDeposit: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Source-of-funds explanation</span><Textarea maxLength={4000} rows={3} value={fundingDraft.sourceOfFundExplanation} onChange={(event) => setFundingDraft((current: any) => ({ ...current, sourceOfFundExplanation: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Living-cost plan</span><Textarea maxLength={4000} rows={3} value={fundingDraft.livingCostPlan} onChange={(event) => setFundingDraft((current: any) => ({ ...current, livingCostPlan: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Dependents (one per line)</span><Textarea maxLength={4000} rows={2} value={fundingDraft.dependentsText} onChange={(event) => setFundingDraft((current: any) => ({ ...current, dependentsText: event.target.value }))} className="bg-white" /></label>
                <div className="flex flex-wrap gap-4 md:col-span-2">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={fundingDraft.hasBankStatement} onChange={(event) => setFundingDraft((current: any) => ({ ...current, hasBankStatement: event.target.checked }))} /> Bank statement evidence marked available</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={fundingDraft.hasSolvencyCert} onChange={(event) => setFundingDraft((current: any) => ({ ...current, hasSolvencyCert: event.target.checked }))} /> Solvency evidence marked available</label>
                </div>
                <div className="flex justify-end md:col-span-2"><Button size="sm" disabled={savingReviewKey !== null} onClick={handleSaveFundingReview} className="bg-indigo-600 text-white">{savingReviewKey === 'funding' ? 'Saving review…' : 'Save funding review'}</Button></div>
              </div>
            ) : fundingReview && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1 rounded-lg border bg-[var(--alo-page)] p-3"><h2 className="font-bold">Sponsor profile</h2><p>Sponsor: {fundingReview.sponsor || 'Not recorded'}</p><p>Relationship: {fundingReview.sponsorRelation || 'Not recorded'}</p><p>Occupation: {fundingReview.sponsorOccupation || 'Not recorded'}</p><p>Income: {fundingReview.sponsorIncome || 'Not recorded'}</p><p>Source of funds: {fundingReview.sourceOfFund || 'Not recorded'}</p><p>Explanation: {fundingReview.sourceOfFundExplanation || 'Not recorded'}</p></div>
                <div className="space-y-1 rounded-lg border bg-[var(--alo-page)] p-3"><h2 className="font-bold">Funding evidence</h2><p>Status: {fundingReview.fundingStatus}</p><p>Bank statement: {fundingReview.hasBankStatement ? 'Recorded' : 'Not recorded'}</p><p>Solvency: {fundingReview.hasSolvencyCert ? 'Recorded' : 'Not recorded'}</p><p>Tuition deposit: {fundingReview.tuitionDeposit || 'Not recorded'}</p><p>Review prompt: {fundingReview.riskWarning || 'Human review required'}</p><p>Living-cost plan: {fundingReview.livingCostPlan || 'Not recorded'}</p></div>
              </div>
            )}
            {Array.isArray(fundingReview?.sponsorDocuments) && fundingReview.sponsorDocuments.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3"><h2 className="font-semibold">Linked sponsor documents</h2>{fundingReview.sponsorDocuments.map((document: any) => <div key={document.id}><a href={document.downloadUrl} className="font-semibold text-indigo-700 underline">Open private document</a></div>)}</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'study_gap' && (
        <Card className="border bg-white">
          <CardHeader className="border-b p-4"><CardTitle className="text-sm font-bold">Study history review</CardTitle><p className="mt-1 text-xs text-[var(--alo-text-muted)]">Record the student’s explanation and evidence for human review. No automated risk or eligibility decision is generated.</p></CardHeader>
          <CardContent className="space-y-4 p-4 text-xs">
            {!studyGapReview && <p className="rounded-lg border border-dashed p-4 text-[var(--alo-text-muted)]">No study-history review has been recorded for this case.</p>}
            {caseAccess.riskUpdate ? (
              <div className="grid gap-3 rounded-lg border bg-[var(--alo-page)] p-4 md:grid-cols-2">
                <label className="space-y-1"><span className="font-semibold">Study gap recorded?</span><select value={studyGapDraft.hasStudyGap} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, hasStudyGap: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="">Select a response</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label className="space-y-1"><span className="font-semibold">Duration (months)</span><input type="number" min={0} max={600} step={1} value={studyGapDraft.gapDurationMonths} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, gapDurationMonths: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">From</span><input maxLength={80} value={studyGapDraft.gapFrom} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, gapFrom: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">To</span><input maxLength={80} value={studyGapDraft.gapTo} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, gapTo: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Explanation clarity</span><select value={studyGapDraft.explanationClarity} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, explanationClarity: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="unknown">Unknown</option><option value="clear">Clear</option><option value="partial">Partial</option><option value="unclear">Unclear</option></select></label>
                <label className="space-y-1"><span className="font-semibold">Purpose</span><input maxLength={4000} value={studyGapDraft.gapPurpose} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, gapPurpose: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Work or other activity during the period</span><Textarea maxLength={4000} rows={2} value={studyGapDraft.workExpDuringGap} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, workExpDuringGap: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1"><span className="font-semibold">Employment details</span><Textarea maxLength={4000} rows={2} value={studyGapDraft.employmentDetails} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, employmentDetails: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1"><span className="font-semibold">Training details</span><Textarea maxLength={4000} rows={2} value={studyGapDraft.trainingDetails} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, trainingDetails: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1"><span className="font-semibold">Family reason</span><Textarea maxLength={4000} rows={2} value={studyGapDraft.familyReason} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, familyReason: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1"><span className="font-semibold">Visa or other explanation</span><Textarea maxLength={4000} rows={2} value={studyGapDraft.visaReason} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, visaReason: event.target.value }))} className="bg-white" /></label>
                {caseAccess.sensitiveDetails && caseAccess.sensitiveUpdate && <label className="space-y-1 md:col-span-2"><span className="font-semibold">Medical details (restricted)</span><Textarea maxLength={4000} rows={2} value={studyGapDraft.medicalReason} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, medicalReason: event.target.value }))} className="bg-white" /></label>}
                {caseAccess.sensitiveDetails && !caseAccess.sensitiveUpdate && studyGapReview?.medicalReason && <p className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-900"><span className="font-semibold">Restricted medical details:</span> {studyGapReview.medicalReason}</p>}
                {caseAccess.documents && caseAccess.documentsDownload && caseAccess.sensitiveDetails && (
                  <label className="space-y-1 md:col-span-2"><span className="font-semibold">Supporting private documents</span><select multiple value={studyGapDraft.supportingDocumentIds} onChange={(event) => setStudyGapDraft((current: any) => ({ ...current, supportingDocumentIds: Array.from(event.target.selectedOptions, (option) => option.value) }))} className="min-h-24 w-full rounded-md border bg-white px-3 py-2">{documents.map((document: any) => <option key={document.id} value={document.id}>{document.fileName || document.category} · {document.category}</option>)}</select></label>
                )}
                <div className="flex justify-end md:col-span-2"><Button size="sm" disabled={savingReviewKey !== null} onClick={handleSaveStudyGapReview} className="bg-indigo-600 text-white">{savingReviewKey === 'study-gap' ? 'Saving review…' : 'Save study-history review'}</Button></div>
              </div>
            ) : studyGapReview && (
              <div className="space-y-2 rounded-lg border bg-[var(--alo-page)] p-4"><p>Study gap recorded: {studyGapReview.hasStudyGap ? 'Yes' : 'No'}</p><p>Duration: {studyGapReview.gapDurationMonths} months</p><p>Period: {studyGapReview.gapFrom || 'Not recorded'} – {studyGapReview.gapTo || 'Not recorded'}</p><p>Purpose: {studyGapReview.gapPurpose || 'Not recorded'}</p><p>Work/activity: {studyGapReview.workExpDuringGap || 'Not recorded'}</p><p>Explanation clarity: {studyGapReview.explanationClarity || 'Unknown'}</p><p>Review status: {studyGapReview.riskFlag || 'Human review required'}</p>{caseAccess.sensitiveDetails && studyGapReview.medicalReason && <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-900"><span className="font-semibold">Restricted medical details:</span> {studyGapReview.medicalReason}</p>}</div>
            )}
            {Array.isArray(studyGapReview?.supportingDocuments) && studyGapReview.supportingDocuments.length > 0 && <div className="space-y-2 rounded-lg border p-3"><h2 className="font-semibold">Linked supporting documents</h2>{studyGapReview.supportingDocuments.map((document: any) => <div key={document.id}><a href={document.downloadUrl} className="font-semibold text-indigo-700 underline">Open private document</a></div>)}</div>}
          </CardContent>
        </Card>
      )}

      {activeTab === 'refusal' && (
        <Card className="border bg-white">
          <CardHeader className="border-b p-4"><CardTitle className="text-sm font-bold">Prior visa refusal review</CardTitle><p className="mt-1 text-xs text-[var(--alo-text-muted)]">Record known history and the officer’s review. A missing review does not establish a clear immigration history.</p></CardHeader>
          <CardContent className="space-y-4 p-4 text-xs">
            {!refusalReview && <p className="rounded-lg border border-dashed p-4 text-[var(--alo-text-muted)]">No refusal-history review has been recorded for this case.</p>}
            {caseAccess.riskUpdate ? (
              <div className="grid gap-3 rounded-lg border bg-[var(--alo-page)] p-4 md:grid-cols-2">
                <label className="space-y-1"><span className="font-semibold">Prior refusal recorded?</span><select value={refusalDraft.hasVisaRefusal} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, hasVisaRefusal: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="">Select a response</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label className="space-y-1"><span className="font-semibold">Country</span><input maxLength={191} value={refusalDraft.refusalCountry} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, refusalCountry: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Visa type</span><input maxLength={100} value={refusalDraft.visaType} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, visaType: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Refusal date</span><input type="date" value={refusalDraft.refusalDate} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, refusalDate: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Number of prior refusals</span><input type="number" min={0} max={50} step={1} value={refusalDraft.previousRefusalCount} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, previousRefusalCount: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" /></label>
                <label className="space-y-1"><span className="font-semibold">Human review status</span><select value={refusalDraft.humanReviewStatus} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, humanReviewStatus: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="pending">Pending review</option><option value="reviewed">Reviewed by officer</option><option value="needs_super_review">Senior review requested</option></select></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Refusal reason</span><Textarea maxLength={5000} rows={3} value={refusalDraft.refusalReason} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, refusalReason: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Previous application summary</span><Textarea maxLength={5000} rows={2} value={refusalDraft.previousApplication} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, previousApplication: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Changes or improvements since the refusal</span><Textarea maxLength={5000} rows={2} value={refusalDraft.improvementPlan} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, improvementPlan: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Current explanation</span><Textarea maxLength={5000} rows={2} value={refusalDraft.newExplanation} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, newExplanation: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Internal officer note</span><Textarea maxLength={5000} rows={2} value={refusalDraft.officerNote} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, officerNote: event.target.value }))} className="bg-white" /></label>
                {caseAccess.documents && <label className="space-y-1 md:col-span-2"><span className="font-semibold">Link a stored private refusal letter (optional)</span><select value={refusalDraft.refusalLetterDocumentId} onChange={(event) => setRefusalDraft((current: any) => ({ ...current, refusalLetterDocumentId: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="">Keep current link / no change</option>{documents.map((document: any) => <option key={document.id} value={document.id}>{document.fileName || document.category} · {document.category}</option>)}</select></label>}
                <div className="flex justify-end md:col-span-2"><Button size="sm" disabled={savingReviewKey !== null} onClick={handleSaveRefusalReview} className="bg-indigo-600 text-white">{savingReviewKey === 'refusal' ? 'Saving review…' : 'Save refusal review'}</Button></div>
              </div>
            ) : refusalReview && (
              <div className="space-y-2 rounded-lg border bg-[var(--alo-page)] p-4"><p>Prior refusal recorded: {refusalReview.hasVisaRefusal ? 'Yes' : 'No'}</p><p>Country: {refusalReview.refusalCountry || 'Not recorded'}</p><p>Visa type: {refusalReview.visaType || 'Not recorded'}</p><p>Date: {refusalReview.refusalDate || 'Not recorded'}</p><p>Reason: {refusalReview.refusalReason || 'Not recorded'}</p><p>Improvement plan: {refusalReview.improvementPlan || 'Not recorded'}</p><p>Human review status: {refusalReview.humanReviewStatus}</p>{refusalReview.refusalLetterDownloadUrl && <a href={refusalReview.refusalLetterDownloadUrl} className="font-semibold text-indigo-700 underline">Open private refusal letter</a>}</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'sensitive' && (
        <Card className="border-rose-200 bg-white">
          <CardHeader className="border-b bg-rose-50/40 p-4"><CardTitle className="text-sm font-bold text-rose-900">Restricted medical and criminal review</CardTitle><p className="mt-1 text-xs text-rose-800">This restricted section is available only with explicit permission. Views and changes are audited. Sensitive details are not sent externally.</p></CardHeader>
          <CardContent className="space-y-4 p-4 text-xs">
            {!sensitiveReview && <p className="rounded-lg border border-dashed p-4 text-[var(--alo-text-muted)]">No restricted review has been recorded for this case.</p>}
            {caseAccess.sensitiveDetails && caseAccess.sensitiveUpdate ? (
              <div className="grid gap-3 rounded-lg border border-rose-200 bg-rose-50/30 p-4 md:grid-cols-2">
                <label className="space-y-1"><span className="font-semibold">Serious medical condition recorded?</span><select value={sensitiveDraft.seriousMedicalCondition} onChange={(event) => setSensitiveDraft((current: any) => ({ ...current, seriousMedicalCondition: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="">Select a response</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label className="space-y-1"><span className="font-semibold">Criminal offense recorded?</span><select value={sensitiveDraft.criminalOffense} onChange={(event) => setSensitiveDraft((current: any) => ({ ...current, criminalOffense: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="">Select a response</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Medical explanation</span><Textarea maxLength={5000} rows={3} value={sensitiveDraft.medicalExplanation} onChange={(event) => setSensitiveDraft((current: any) => ({ ...current, medicalExplanation: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Criminal-history explanation</span><Textarea maxLength={5000} rows={3} value={sensitiveDraft.criminalExplanation} onChange={(event) => setSensitiveDraft((current: any) => ({ ...current, criminalExplanation: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Internal officer note</span><Textarea maxLength={5000} rows={2} value={sensitiveDraft.officerInternalNote} onChange={(event) => setSensitiveDraft((current: any) => ({ ...current, officerInternalNote: event.target.value }))} className="bg-white" /></label>
                <label className="space-y-1 md:col-span-2"><span className="font-semibold">Student-safe note (not published by this action)</span><Textarea maxLength={2000} rows={2} value={sensitiveDraft.studentSafeNote} onChange={(event) => setSensitiveDraft((current: any) => ({ ...current, studentSafeNote: event.target.value }))} className="bg-white" /></label>
                {caseAccess.documents && caseAccess.documentsDownload && <>
                  <label className="space-y-1"><span className="font-semibold">Stored private medical evidence</span><select value={sensitiveDraft.medicalDocumentId} onChange={(event) => setSensitiveDraft((current: any) => ({ ...current, medicalDocumentId: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="">Keep current link / no change</option>{documents.filter((document: any) => /medical|sensitive/i.test(document.category)).map((document: any) => <option key={document.id} value={document.id}>{document.fileName || document.category}</option>)}</select></label>
                  <label className="space-y-1"><span className="font-semibold">Stored private criminal-history evidence</span><select value={sensitiveDraft.criminalDocumentId} onChange={(event) => setSensitiveDraft((current: any) => ({ ...current, criminalDocumentId: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2"><option value="">Keep current link / no change</option>{documents.filter((document: any) => /criminal|sensitive/i.test(document.category)).map((document: any) => <option key={document.id} value={document.id}>{document.fileName || document.category}</option>)}</select></label>
                </>}
                <div className="flex justify-end md:col-span-2"><Button size="sm" disabled={savingReviewKey !== null} onClick={handleSaveSensitiveReview} className="bg-rose-700 text-white">{savingReviewKey === 'sensitive' ? 'Saving restricted review…' : 'Save restricted review'}</Button></div>
              </div>
            ) : sensitiveReview && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-lg border bg-[var(--alo-page)] p-3"><h2 className="font-bold">Medical review</h2><p>Condition recorded: {sensitiveReview.seriousMedicalCondition ? 'Yes' : 'No'}</p><p className="whitespace-pre-wrap">Explanation: {sensitiveReview.medicalExplanation || 'Not recorded'}</p>{sensitiveReview.medicalDocumentDownloadUrl && <a href={sensitiveReview.medicalDocumentDownloadUrl} className="font-semibold text-indigo-700 underline">Open private medical document</a>}</div>
                <div className="space-y-2 rounded-lg border bg-[var(--alo-page)] p-3"><h2 className="font-bold">Criminal-history review</h2><p>Offense recorded: {sensitiveReview.criminalOffense ? 'Yes' : 'No'}</p><p className="whitespace-pre-wrap">Explanation: {sensitiveReview.criminalExplanation || 'Not recorded'}</p>{sensitiveReview.criminalDocumentDownloadUrl && <a href={sensitiveReview.criminalDocumentDownloadUrl} className="font-semibold text-indigo-700 underline">Open private document</a>}</div>
                <div className="space-y-2 rounded-lg border bg-[var(--alo-page)] p-3 md:col-span-2"><h2 className="font-bold">Officer handling</h2><p className="whitespace-pre-wrap">Internal note: {sensitiveReview.officerInternalNote || 'Not recorded'}</p><p className="whitespace-pre-wrap">Student-safe note: {sensitiveReview.studentSafeNote || 'Not recorded'}</p><p>Human review required: {sensitiveReview.humanReviewRequired ? 'Yes' : 'No'}</p></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'checklist' && (
        <Card className="border bg-white">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold">Visa document checklist and private uploads</CardTitle>
            <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Document files remain in authenticated private storage. Review actions retain prior versions and create an audit record.</p>
          </CardHeader>
          <CardContent className="space-y-6 p-4">
            {caseAccess.documentsRequest && (
              <div className="grid gap-3 rounded-lg border bg-[var(--alo-page)] p-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="font-semibold">Document requested</span>
                  <input maxLength={191} value={documentRequestDraft.documentName} onChange={(event) => setDocumentRequestDraft((current) => ({ ...current, documentName: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">Category</span>
                  <select value={documentRequestDraft.category} onChange={(event) => setDocumentRequestDraft((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2">
                    <option value="general">General</option><option value="passport">Passport</option><option value="academic">Academic</option><option value="financial">Financial</option><option value="sponsor">Sponsor</option><option value="study_gap">Study history</option><option value="refusal">Refusal history</option><option value="other">Other</option>
                    {caseAccess.sensitiveDetails && <><option value="medical">Medical (restricted)</option><option value="criminal">Criminal (restricted)</option></>}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">Priority</span>
                  <select value={documentRequestDraft.priority} onChange={(event) => setDocumentRequestDraft((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">Due date</span>
                  <input type="date" value={documentRequestDraft.dueDate} onChange={(event) => setDocumentRequestDraft((current) => ({ ...current, dueDate: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="font-semibold">Student-safe reason</span>
                  <Textarea maxLength={1000} rows={2} value={documentRequestDraft.reason} onChange={(event) => setDocumentRequestDraft((current) => ({ ...current, reason: event.target.value }))} className="bg-white" />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="font-semibold">Internal request details</span>
                  <Textarea maxLength={1500} rows={2} value={documentRequestDraft.description} onChange={(event) => setDocumentRequestDraft((current) => ({ ...current, description: event.target.value }))} className="bg-white" />
                </label>
                <div className="flex flex-wrap gap-4 md:col-span-2">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={documentRequestDraft.studentVisible} onChange={(event) => setDocumentRequestDraft((current) => ({ ...current, studentVisible: event.target.checked }))} /> Visible in student portal</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={documentRequestDraft.counselorVisible} onChange={(event) => setDocumentRequestDraft((current) => ({ ...current, counselorVisible: event.target.checked }))} /> Visible to assigned counselor</label>
                </div>
                <div className="flex justify-end md:col-span-2">
                  <Button size="sm" disabled={!documentRequestDraft.documentName.trim() || savingDocumentRequest} onClick={handleCreateDocumentRequest} className="bg-indigo-600 text-white">
                    {savingDocumentRequest ? 'Saving request…' : 'Request document'}
                  </Button>
                </div>
              </div>
            )}

            <section className="space-y-2" aria-label="Visa checklist items">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--alo-body)]">Checklist items</h2>
              {checklist.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-[var(--alo-text-muted)]">No checklist items have been added to this case.</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b bg-[var(--alo-page)] text-left text-[var(--alo-text-muted)]"><th className="p-2">Document item</th><th className="p-2">Category</th><th className="p-2">Required</th><th className="p-2">Status</th><th className="p-2">Deadline</th></tr></thead>
                    <tbody>{checklist.map((row: any) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="p-2 font-semibold">{row.item || row.documentName}</td>
                        <td className="p-2 text-[var(--alo-text-muted)]">{row.category}</td>
                        <td className="p-2">{row.isRequired ? 'Mandatory' : 'Optional'}</td>
                        <td className="p-2"><Badge className="text-[11px]">{String(row.status).replaceAll('_', ' ')}</Badge></td>
                        <td className="p-2">{row.deadline ? new Date(row.deadline).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="space-y-2" aria-label="Uploaded visa documents">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--alo-body)]">Uploaded documents</h2>
              {documents.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-[var(--alo-text-muted)]">No private document uploads are recorded for this case.</div>
              ) : documents.map((document: any) => {
                const status = String(document.status || '').toLowerCase();
                const immutable = ['approved', 'verified', 'locked'].includes(status);
                return (
                  <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-[var(--alo-page)] p-3">
                    <div>
                      <p className="font-semibold">{document.fileName || document.category}</p>
                      <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{document.category} · Version {document.version} · {document.fileSize} bytes</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">{status.replaceAll('_', ' ')}</Badge>
                      {document.downloadUrl && <a href={document.downloadUrl} className="text-xs font-semibold text-indigo-700 underline">Download securely</a>}
                      {caseAccess.documentsReview && !immutable && (
                        <>
                          <Button size="sm" variant="outline" disabled={savingDocumentReview} onClick={() => handleDocumentReview(document, 'approve')}>Approve</Button>
                          <Button size="sm" variant="outline" disabled={savingDocumentReview} onClick={() => handleDocumentReview(document, 'needs-update')}>Request update</Button>
                          <Button size="sm" variant="outline" disabled={savingDocumentReview} onClick={() => handleDocumentReview(document, 'reject')}>Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>

            {documentReviewDraft.document && documentReviewDraft.action && (
              <div role="dialog" aria-modal="true" aria-labelledby="document-review-title" className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                <h2 id="document-review-title" className="font-semibold">{documentReviewDraft.action === 'reject' ? 'Reject document version' : 'Request a replacement version'}</h2>
                <p className="mt-1 text-xs text-[var(--alo-body)]">{documentReviewDraft.document.fileName}. Student-facing guidance must be clear and must not disclose internal notes.</p>
                <label className="mt-3 block space-y-1">
                  <span className="text-xs font-semibold">Reason for the student</span>
                  <Textarea maxLength={1000} rows={3} value={documentReviewReason} onChange={(event) => setDocumentReviewReason(event.target.value)} className="bg-white" />
                </label>
                <label className="mt-3 block space-y-1">
                  <span className="text-xs font-semibold">Internal reviewer note</span>
                  <Textarea maxLength={1000} rows={2} value={documentReviewerNote} onChange={(event) => setDocumentReviewerNote(event.target.value)} className="bg-white" />
                </label>
                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" variant="outline" disabled={savingDocumentReview} onClick={() => setDocumentReviewDraft({ document: null, action: null })}>Cancel</Button>
                  <Button size="sm" disabled={!documentReviewReason.trim() || savingDocumentReview} onClick={handleSubmitDocumentReview} className="bg-indigo-600 text-white">{savingDocumentReview ? 'Saving review…' : 'Save review'}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'readiness' && (
        <Card className="bg-white border">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold">Case-record completion indicator</CardTitle>
              <p className="text-xs text-[var(--alo-text-muted)] mt-1">A summary of recorded case information only — not eligibility, visa readiness, an approval prediction, or a guarantee.</p>
            </div>
            {caseAccess.readinessUpdate && <Button onClick={handleCalculateReadiness} size="sm" className=" bg-indigo-600 text-white">Recalculate from records</Button>}
          </CardHeader>
          <CardContent className="p-4">
            {readiness && typeof readiness.overallScore === 'number' ? (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-2">
                <p className="text-xs font-bold uppercase text-indigo-900">Recorded information completeness</p>
                <p className="text-3xl font-extrabold text-indigo-700">{readiness.overallScore} / 100</p>
                <p className="text-xs text-indigo-900">Required checklist documents recorded as approved: {readiness.documentsReady ?? 0} of {readiness.documentsTotal ?? 0}.</p>
                <p className="text-[11px] text-[var(--alo-body)]">{readiness.interpretation || 'Checklist completion indicator only; not an eligibility assessment, approval prediction, or guarantee.'}</p>
              </div>
            ) : readiness?.recalculationRequired ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">This saved report uses an older calculation method. Its score is withheld; recalculate from current case records to create a current completion indicator.</div>
            ) : readiness ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-[var(--alo-text-muted)]">No current numeric completion indicator is available. Recalculate only if you have the required permission.</div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-[var(--alo-text-muted)]">No readiness assessment has been recorded for this case.</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'notes' && (
        <Card className="border bg-white">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold">Visa officer notes</CardTitle>
            <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Visibility is enforced by the server. Student-safe feedback is approved and shared separately.</p>
          </CardHeader>
          <CardContent className="space-y-4 p-4 text-xs">
            {canCreateOfficerNote && (
              <div className="space-y-2">
                <Textarea
                  aria-label="Officer note"
                  placeholder="Record a concise case note for the selected audience."
                  rows={3}
                  value={officerNoteText}
                  onChange={(event) => setOfficerNoteText(event.target.value)}
                  className="bg-[var(--alo-page)]"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <select
                    aria-label="Note visibility"
                    value={officerNoteVisibility}
                    onChange={(event) => setOfficerNoteVisibility(event.target.value)}
                    className="rounded-lg border bg-[var(--alo-page)] px-2.5 py-1.5 text-xs font-medium"
                  >
                    {noteVisibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <Button size="sm" disabled={!officerNoteText.trim()} className=" bg-indigo-600 text-white" onClick={handleSaveOfficerNote}>
                    Save note
                  </Button>
                </div>
              </div>
            )}
            {caseAccess.notes && (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {notes.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-[var(--alo-text-muted)]">No officer notes are recorded for this case.</div>
                ) : notes.map((note: any) => (
                  <div key={note.id} className="rounded-lg border bg-[var(--alo-page)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{note.officerName || 'Visa Officer'}</span>
                      <Badge variant="outline" className="text-[11px]">{note.visibility.replaceAll('_', ' ')}</Badge>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{note.content}</p>
                    <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{new Date(note.createdAt).toLocaleString()} · {note.commentType || note.noteType}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'tasks' && (
        <Card className="border bg-white">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-sm font-bold">Visa case tasks</CardTitle>
            <p className="mt-1 text-xs text-[var(--alo-text-muted)]">Tasks are assigned only to people linked to this case. Creating a task does not send an external message.</p>
          </CardHeader>
          <CardContent className="space-y-4 p-4 text-xs">
            {caseAccess.tasksCreate && (
              <div className="grid gap-3 rounded-lg border bg-[var(--alo-page)] p-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="font-semibold">Task title</span>
                  <input value={taskDraft.title} maxLength={191} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">Task type</span>
                  <select value={taskDraft.taskType} onChange={(event) => setTaskDraft((current) => ({ ...current, taskType: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2">
                    <option value="DOCUMENT_REQUEST">Document request</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="BANK_REVIEW">Bank review</option>
                    <option value="SPONSOR_REVIEW">Sponsor review</option>
                    <option value="REFUSAL_REVIEW">Refusal review</option>
                    <option value="STUDY_GAP_REVIEW">Study-history review</option>
                    <option value="COUNSELOR_ACTION">Counselor action</option>
                    <option value="APPLICATION_ACTION">Application action</option>
                    <option value="STUDENT_ACTION">Student action</option>
                    <option value="SENIOR_REVIEW">Senior review</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">Owner</span>
                  <select value={taskDraft.assignee} onChange={(event) => setTaskDraft((current) => ({ ...current, assignee: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2">
                    <option value="student">Student</option>
                    {caseData.visaOfficerId && <option value="visa_officer">Assigned visa officer</option>}
                    {caseData.counselorId && <option value="counselor">Assigned counselor</option>}
                    {caseData.applicationOfficerId && <option value="application_officer">Assigned application officer</option>}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">Priority</span>
                  <select value={taskDraft.priority} onChange={(event) => setTaskDraft((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">Due date</span>
                  <input type="date" value={taskDraft.dueDate} onChange={(event) => setTaskDraft((current) => ({ ...current, dueDate: event.target.value }))} className="w-full rounded-md border bg-white px-3 py-2" />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="font-semibold">Task details</span>
                  <Textarea rows={2} maxLength={2000} value={taskDraft.description} onChange={(event) => setTaskDraft((current) => ({ ...current, description: event.target.value }))} className="bg-white" />
                </label>
                <div className="md:col-span-2 flex justify-end">
                  <Button size="sm" disabled={!taskDraft.title.trim() || savingTask} onClick={handleCreateTask} className="bg-indigo-600 text-white">
                    {savingTask ? 'Saving task…' : 'Create task'}
                  </Button>
                </div>
              </div>
            )}
            {tasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-[var(--alo-text-muted)]">No active tasks are recorded for this case.</div>
            ) : tasks.map((task: any) => {
              const owner = task.assignedTo === caseData.studentId || task.assignedTo === 'student' ? 'Student'
                : task.assignedTo === caseData.visaOfficerId ? 'Assigned visa officer'
                  : task.assignedTo === caseData.counselorId ? 'Assigned counselor'
                    : task.assignedTo === caseData.applicationOfficerId ? 'Assigned application officer' : 'Case owner';
              return (
                <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-[var(--alo-page)] p-3">
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{task.taskType.replaceAll('_', ' ')} · {owner} · {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'} · Priority {task.priority}</p>
                    {task.description && <p className="mt-1 whitespace-pre-wrap text-[11px] text-[var(--alo-body)]">{task.description}</p>}
                  </div>
                  {caseAccess.tasksUpdate ? (
                    <select aria-label={`Status for ${task.title}`} value={String(task.status).toLowerCase()} disabled={savingTaskId === task.id} onChange={(event) => handleUpdateTaskStatus(task.id, event.target.value)} className="rounded-md border bg-white px-2 py-1.5 text-xs">
                      <option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                    </select>
                  ) : <Badge className="text-[11px]">{task.status.replaceAll('_', ' ')}</Badge>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {activeTab === 'timeline' && (
        <Card className="bg-white border"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Visa case timeline</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">{timeline.length === 0 ? <div className="p-8 text-center text-[var(--alo-text-muted)] border-dashed border rounded-lg">No timeline events have been recorded for this case.</div> : timeline.map((ev: any, idx: number) => (<div key={idx} className="p-2 bg-[var(--alo-page)] rounded border"><span className="font-bold">{ev.stage}</span> — {ev.title} — {ev.description} — {new Date(ev.createdAt).toLocaleString()}</div>))}</CardContent>
        </Card>
      )}
    </div>
  );
}
