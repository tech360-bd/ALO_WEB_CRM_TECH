'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  ArrowLeft,
  Send,
  Save,
  Eye,
  Plus,
  X,
  Check,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  User,
  GraduationCap,
  Mail,
  ChevronDown,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentResult {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  mobile: string;
  studyDestination: string;
  status: string;
}

interface ApplicationResult {
  applicationId: string;
  university: string;
  course: string;
  country: string;
  intake: string;
  studyLevel: string;
  stage: string;
  totalDocs: number;
  missingDocs: number;
  verifiedDocs: number;
}

interface DocumentItem {
  id: string;
  applicationId: string;
  name: string;
  category: string;
  status: 'MISSING' | 'VERIFIED' | 'PENDING_REVIEW';
  notes: string | null;
  requiredBy: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

interface ApplicationCommunicationProps {
  onBack: () => void;
}

// ─── Status Badge Config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  MISSING: {
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/50',
    label: 'Missing',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  VERIFIED: {
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    label: 'Verified',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  PENDING_REVIEW: {
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    label: 'Pending',
    icon: <Clock className="h-3 w-3" />,
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  IDENTITY: 'Identity',
  ENGLISH: 'English Test',
  FINANCIAL: 'Financial',
  ACADEMIC: 'Academic',
  APPLICATION: 'Application',
  CONSENT: 'Consent',
  CUSTOM: 'Custom',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ApplicationCommunication({ onBack }: ApplicationCommunicationProps) {
  // Student search state
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected student & application
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [applications, setApplications] = useState<ApplicationResult[]>([]);
  const [selectedApp, setSelectedApp] = useState<ApplicationResult | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Document selection
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // Custom document
  const [customDocName, setCustomDocName] = useState('');
  const [showCustomDocInput, setShowCustomDocInput] = useState(false);

  // Email
  const [ccEmail, setCcEmail] = useState('alamin@aloeducation.com');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Computed
  const missingDocs = useMemo(() => documents.filter((d) => d.status === 'MISSING'), [documents]);
  const allMissingSelected = useMemo(() => {
    if (missingDocs.length === 0) return false;
    return missingDocs.every((d) => selectedDocIds.has(d.id));
  }, [missingDocs, selectedDocIds]);

  // ─── Search Students ──────────────────────────────────────────────────────

  const searchStudents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setStudentResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/communication/students?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setStudentResults(data.students || []);
      if ((data.students || []).length > 0) {
        setStudentPopoverOpen(true);
      }
    } catch {
      setStudentResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleStudentQueryChange = useCallback((value: string) => {
    setStudentQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchStudents(value), 300);
  }, [searchStudents]);

  const handleSelectStudent = useCallback((student: StudentResult) => {
    setSelectedStudent(student);
    setStudentQuery(student.fullName);
    setStudentPopoverOpen(false);
    setSelectedApp(null);
    setDocuments([]);
    setSelectedDocIds(new Set());
    resetEmail();
    // Load applications
    loadApplications(student.id);
  }, []);

  // ─── Load Applications ────────────────────────────────────────────────────

  const loadApplications = useCallback(async (studentId: string) => {
    try {
      const res = await fetch(`/api/communication/applications?studentId=${encodeURIComponent(studentId)}`);
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      setApplications([]);
    }
  }, []);

  // ─── Select Application & Load Documents ─────────────────────────────────

  const handleSelectApp = useCallback(async (app: ApplicationResult) => {
    setSelectedApp(app);
    setIsLoadingDocs(true);
    setSelectedDocIds(new Set());
    resetEmail();
    try {
      const res = await fetch(`/api/communication/documents?applicationId=${encodeURIComponent(app.applicationId)}`);
      const data = await res.json();
      setDocuments(data.documents || []);
      // Auto-select all missing docs
      const missing = (data.documents || []).filter((d: DocumentItem) => d.status === 'MISSING');
      setSelectedDocIds(new Set(missing.map((d: DocumentItem) => d.id)));
    } catch {
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  // ─── Document Selection ──────────────────────────────────────────────────

  const toggleDoc = useCallback((docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  }, []);

  const selectAllMissing = useCallback(() => {
    setSelectedDocIds(new Set(missingDocs.map((d) => d.id)));
  }, [missingDocs]);

  const clearAll = useCallback(() => {
    setSelectedDocIds(new Set());
  }, []);

  // ─── Add Custom Document ─────────────────────────────────────────────────

  const addCustomDocument = useCallback(() => {
    if (!customDocName.trim() || !selectedApp) return;
    const newDoc: DocumentItem = {
      id: `custom-${Date.now()}`,
      applicationId: selectedApp.applicationId,
      name: customDocName.trim(),
      category: 'CUSTOM',
      status: 'MISSING',
      notes: null,
      requiredBy: null,
      verifiedAt: null,
      verifiedBy: null,
    };
    setDocuments((prev) => [...prev, newDoc]);
    setSelectedDocIds((prev) => new Set([...prev, newDoc.id]));
    setCustomDocName('');
    setShowCustomDocInput(false);
    toast.success(`"${newDoc.name}" added to document list`);
  }, [customDocName, selectedApp]);

  // ─── Email Auto-Generation ───────────────────────────────────────────────

  const resetEmail = useCallback(() => {
    setSubject('');
    setEmailBody('');
  }, []);

  useEffect(() => {
    if (!selectedApp || !selectedStudent) return;
    const selectedDocs = documents.filter((d) => selectedDocIds.has(d.id));
    if (selectedDocs.length === 0) {
      setSubject('');
      setEmailBody('');
      return;
    }
    setSubject(`Action Required: Missing Documents — ${selectedApp.course}`);
    const docList = selectedDocs.map((d) => `• ${d.name}`).join('\n');
    const firstName = selectedStudent.fullName.split(' ')[0];
    setEmailBody(
      `Dear ${firstName},\n\nGreetings from ALO Education.\n\n📑 Missing Documents\n\n${docList}\n\nPlease submit these documents at your earliest convenience to proceed with your application for ${selectedApp.course} at ${selectedApp.university}.\n\nIf you have already submitted any of these documents, please let us know so we can update your file.\n\nBest regards,\nALO Education Team`
    );
  }, [selectedDocIds, documents, selectedApp, selectedStudent]);

  // ─── Send / Save Draft ──────────────────────────────────────────────────

  const handleSend = useCallback(async (action: 'draft' | 'send') => {
    if (!selectedApp || !selectedStudent || selectedDocIds.size === 0) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/communication/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.applicationId,
          studentName: selectedStudent.fullName,
          studentEmail: selectedStudent.email,
          selectedDocuments: Array.from(selectedDocIds),
          ccEmail: ccEmail || undefined,
          customSubject: subject || undefined,
          customBody: emailBody || undefined,
          action,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === 'send' ? 'Email sent successfully!' : 'Draft saved!');
      } else {
        toast.error(data.error || 'Something went wrong');
      }
    } catch {
      toast.error('Failed to process request');
    } finally {
      setIsSending(false);
    }
  }, [selectedApp, selectedStudent, selectedDocIds, ccEmail, subject, emailBody]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#F37021] to-[#FFB347] flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                Application Communication
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Document request & follow-up emails</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* ─── Student Search ─────────────────────────────────────────────── */}
        <SectionCard>
          <SectionLabel icon={<User className="h-4 w-4" />}>Student</SectionLabel>
          <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search student by name or email..."
                  value={studentQuery}
                  onChange={(e) => handleStudentQueryChange(e.target.value)}
                  onFocus={() => studentQuery.trim() && setStudentPopoverOpen(true)}
                  className="pl-10 pr-10 h-11 text-sm"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                )}
                {selectedStudent && !studentPopoverOpen && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command className="rounded-lg">
                <CommandInput placeholder="Type to search..." className="hidden" />
                <CommandList>
                  <CommandEmpty>{isSearching ? 'Searching...' : 'No students found'}</CommandEmpty>
                  <CommandGroup>
                    {studentResults.map((student) => (
                      <CommandItem
                        key={student.id}
                        value={student.fullName}
                        onSelect={() => handleSelectStudent(student)}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                      >
                        <div className="h-8 w-8 rounded-full bg-[#F37021]/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-[#F37021]">
                            {student.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{student.email}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {student.studyDestination}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </SectionCard>

        {/* ─── Application Selector ───────────────────────────────────────── */}
        {selectedStudent && (
          <SectionCard>
            <SectionLabel icon={<GraduationCap className="h-4 w-4" />}>Application</SectionLabel>
            {applications.length === 0 ? (
              <p className="text-sm text-gray-500 py-3">No applications found for this student.</p>
            ) : (
              <div className="space-y-2">
                {applications.map((app) => (
                  <button
                    key={app.applicationId}
                    onClick={() => handleSelectApp(app)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200',
                      'border',
                      selectedApp?.applicationId === app.applicationId
                        ? 'border-[#F37021] bg-orange-50 dark:bg-orange-950/30 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {app.university}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                        <span>{app.course}</span>
                        <span className="text-gray-300">•</span>
                        <span>{app.intake}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.missingDocs > 0 && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 text-[10px] font-medium">
                          {app.missingDocs} missing
                        </Badge>
                      )}
                      {app.verifiedDocs > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] font-medium">
                          {app.verifiedDocs} verified
                        </Badge>
                      )}
                      <ChevronDown className={cn(
                        'h-4 w-4 text-gray-400 transition-transform duration-200',
                        selectedApp?.applicationId === app.applicationId && 'rotate-180'
                      )} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* ─── Missing Documents ──────────────────────────────────────────── */}
        {selectedApp && (
          <SectionCard>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel icon={<FileText className="h-4 w-4" />}>Missing Documents</SectionLabel>
              <span className="text-xs text-gray-500 font-medium">
                {selectedDocIds.size} selected
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllMissing}
                disabled={allMissingSelected}
                className="h-8 text-xs"
              >
                <Check className="h-3 w-3 mr-1.5" />
                Select All Missing
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={selectedDocIds.size === 0}
                className="h-8 text-xs"
              >
                Clear All
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomDocInput(true)}
                className="h-8 text-xs text-[#F37021] border-[#F37021]/30 hover:bg-orange-50"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add Custom Document
              </Button>
            </div>

            {/* Custom document input */}
            {showCustomDocInput && (
              <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                <Input
                  placeholder="Enter document name (e.g., Police Clearance Certificate)"
                  value={customDocName}
                  onChange={(e) => setCustomDocName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomDocument()}
                  className="h-9 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={addCustomDocument}
                  disabled={!customDocName.trim()}
                  className="h-9 bg-[#F37021] hover:bg-[#e5661a] text-white shrink-0"
                >
                  Add
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => { setShowCustomDocInput(false); setCustomDocName(''); }}
                  className="h-9 w-9 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Document list */}
            {isLoadingDocs ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-pulse">
                    <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {documents.map((doc) => {
                  const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.MISSING;
                  const isSelected = selectedDocIds.has(doc.id);
                  const isMissing = doc.status === 'MISSING';

                  return (
                    <div
                      key={doc.id}
                      onClick={() => toggleDoc(doc.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150',
                        'border',
                        isSelected
                          ? 'border-[#F37021]/40 bg-orange-50/80 dark:bg-orange-950/20'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50',
                        isMissing && 'pl-4'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleDoc(doc.id)}
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isSelected && 'border-[#F37021] bg-[#F37021] text-white data-[state=checked]:bg-[#F37021] data-[state=checked]:border-[#F37021]'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        )}>
                          {doc.name}
                        </p>
                        {doc.category !== 'CUSTOM' && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {CATEGORY_LABELS[doc.category] || doc.category}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] font-medium shrink-0 gap-1',
                          statusCfg.bg,
                          statusCfg.color,
                          'hover:' + statusCfg.bg
                        )}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* ─── Email Section ──────────────────────────────────────────────── */}
        {selectedApp && selectedStudent && (
          <SectionCard>
            <SectionLabel icon={<Mail className="h-4 w-4" />}>Email</SectionLabel>

            <div className="space-y-4 mt-3">
              {/* To / CC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">To</Label>
                  <div className="flex items-center h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <Mail className="h-3.5 w-3.5 text-gray-400 mr-2 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {selectedStudent.email}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">CC</Label>
                  <Input
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="cc@example.com"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="h-10 text-sm font-medium"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Message</Label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Email body will be auto-generated from selected documents..."
                  className="min-h-[220px] text-sm leading-relaxed resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleSend('draft')}
                  disabled={isSending || selectedDocIds.size === 0}
                  className="h-10 text-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  disabled={selectedDocIds.size === 0}
                  className="h-10 text-sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={() => handleSend('send')}
                  disabled={isSending || selectedDocIds.size === 0}
                  className="h-10 text-sm bg-[#0066CC] hover:bg-[#0052A3] text-white"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Email
                </Button>
              </div>
            </div>
          </SectionCard>
        )}
      </main>

      {/* ─── Preview Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>Review the email before sending</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">To</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedStudent?.email}</p>
            </div>
            {ccEmail && (
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">CC</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{ccEmail}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Subject</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{subject}</p>
            </div>
            <Separator />
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                {emailBody}
              </pre>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="text-sm">
              Close
            </Button>
            <Button
              onClick={() => {
                setShowPreview(false);
                handleSend('send');
              }}
              disabled={isSending}
              className="text-sm bg-[#0066CC] hover:bg-[#0052A3] text-white"
            >
              {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-sm">
      {children}
    </div>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="text-[#F37021]">{icon}</div>
      <span className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
        {children}
      </span>
    </div>
  );
}
