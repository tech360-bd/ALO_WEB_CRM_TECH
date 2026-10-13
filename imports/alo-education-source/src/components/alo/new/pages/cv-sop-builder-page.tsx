'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  FileText,
  PenLine,
  Eye,
  Printer,
  Sparkles,
  ChevronRight,
  Globe,
  GraduationCap,
  BookOpen,
  Target,
  Briefcase,
  MessageSquare,
  Info,
  Download,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────

interface CVData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  objective: string;
  education: { institution: string; degree: string; year: string; gpa: string }[];
  experience: { company: string; role: string; duration: string; description: string }[];
  skills: string[];
  languages: { language: string; proficiency: string }[];
}

interface SOPSection {
  id: string;
  title: string;
  content: string;
  tips: string[];
  minWords: number;
  maxWords: number;
}

interface CvSopBuilderPageProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

// ─── Country-specific tips ────────────────────────────────────────────────

const COUNTRY_CV_TIPS: Record<string, { label: string; tips: string[]; format: string }> = {
  uk: {
    label: 'UK CV Format',
    format: '1-2 pages, no photo, reverse-chronological',
    tips: ['Max 2 pages — 1 page for fresh graduates', 'No photo or personal details (age, marital status)', 'Reverse chronological order', 'Include references (2 academic)', 'Use UK English spelling (e.g., programme, analyse)', 'Professional font: Arial, Calibri, or Times New Roman', 'Include a personal profile/objective at the top'],
  },
  usa: {
    label: 'US Resume Format',
    format: '1 page, no photo, skills-focused',
    tips: ['Strict 1 page for entry-level', 'No photo, age, or marital status (illegal to ask)', 'Accomplishment-focused with quantified results', 'Use action verbs: Led, Developed, Implemented', 'US English spelling (e.g., program, analyze)', 'GPA optional (include if 3.5+)', 'No references on resume — "Available upon request"'],
  },
  germany: {
    label: 'German Lebenslauf',
    format: '1-2 pages, photo recommended, tabular format',
    tips: ['Professional photo is expected (top-right)', 'Include date and place of birth, nationality', 'Tabular/structured format preferred', 'Chronological (not reverse)', 'Include signature at bottom', 'Hobbies/interests section included', 'Very detailed — include all relevant info'],
  },
  canada: {
    label: 'Canadian Resume',
    format: '1-2 pages, no photo, competency-based',
    tips: ['Max 2 pages', 'No photo or personal details', 'Include a summary/profile section', 'Accomplishment-focused, quantified results', 'Canadian spelling follows UK conventions', 'Include volunteer work', 'References on separate page'],
  },
  australia: {
    label: 'Australian Resume/CV',
    format: '2-3 pages, no photo, achievement-focused',
    tips: ['2-3 pages acceptable', 'No photo or personal details', 'Include career objective/summary', 'Achievement-focused with STAR method', 'Australian English spelling', 'Include referees (2-3)', 'Work rights status optional to mention'],
  },
};

const SOP_SECTIONS: SOPSection[] = [
  {
    id: 'intro',
    title: 'Introduction',
    content: '',
    tips: ['Start with a hook — what inspired your interest in the field', 'Briefly state your academic background', 'Mention the program you\'re applying for', 'Keep it engaging and personal, not generic'],
    minWords: 80, maxWords: 150,
  },
  {
    id: 'academic',
    title: 'Academic Background',
    content: '',
    tips: ['Highlight relevant coursework and projects', 'Mention thesis/final year project if applicable', 'Include academic achievements and awards', 'Connect past learning to proposed study', 'Don\'t just list — explain WHY each experience matters'],
    minWords: 100, maxWords: 200,
  },
  {
    id: 'why-course',
    title: 'Why This Course',
    content: '',
    tips: ['Research the specific program curriculum', 'Mention specific modules/professors that interest you', 'Explain how the course fills gaps in your knowledge', 'Show you\'ve done thorough research — not generic praise', 'Connect to your career trajectory'],
    minWords: 100, maxWords: 200,
  },
  {
    id: 'why-university',
    title: 'Why This University',
    content: '',
    tips: ['Mention specific facilities, labs, or research centers', 'Reference faculty members whose work aligns with yours', 'Note university rankings/reputation (briefly)', 'Mention unique opportunities (internships, industry links)', 'Be specific — don\'t just say "prestigious university"'],
    minWords: 80, maxWords: 150,
  },
  {
    id: 'career',
    title: 'Career Goals',
    content: '',
    tips: ['Short-term goals (1-3 years after graduation)', 'Long-term goals (5-10 years)', 'Be realistic and specific about career path', 'Mention how the degree bridges your current position to goals', 'If returning to Bangladesh, explain how you\'ll apply knowledge'],
    minWords: 80, maxWords: 150,
  },
  {
    id: 'conclusion',
    title: 'Conclusion',
    content: '',
    tips: ['Summarize key points briefly', 'Reiterate your enthusiasm and preparedness', 'End on a confident, forward-looking note', 'Don\'t introduce new information', 'Keep it concise — 3-4 sentences'],
    minWords: 40, maxWords: 80,
  },
];

const SAMPLE_SOPS: Record<string, { country: string; field: string; preview: string }> = {
  'uk-cs': { country: 'UK', field: 'Computer Science', preview: 'The rapid evolution of technology has always fascinated me, from the algorithmic puzzles I first encountered in my HSC Computer Science course to the distributed systems I explored during my undergraduate studies at BUET...' },
  'canada-mba': { country: 'Canada', field: 'MBA', preview: 'Growing up in Dhaka, I witnessed firsthand how strategic business decisions can transform communities. My experience at BRAC, where I managed microfinance operations across 12 branches, ignited my passion for sustainable business models...' },
  'germany-eng': { country: 'Germany', field: 'Mechanical Engineering', preview: 'Bangladesh\'s ready-made garment industry, which accounts for 84% of our exports, faces a critical challenge: sustainable manufacturing processes. This realization drove my decision to pursue a Master\'s in Mechanical Engineering...' },
  'australia-nursing': { country: 'Australia', field: 'Nursing', preview: 'During my clinical placement at Dhaka Medical College Hospital, I cared for a patient whose condition deteriorated rapidly. My quick response and coordination with the medical team saved their life. That moment defined my calling...' },
};

// ─── Component ────────────────────────────────────────────────────────────

export function CvSopBuilderPage({ onBack, onNavigate, onLeadOpen }: CvSopBuilderPageProps) {
  const [activeTab, setActiveTab] = useState('sop');
  const [selectedCountry, setSelectedCountry] = useState('uk');
  const [sopSections, setSopSections] = useState<SOPSection[]>(SOP_SECTIONS.map(s => ({ ...s, content: '' })));
  const [sopAiLoading, setSopAiLoading] = useState<string | null>(null);

  // CV state
  const [cv, setCv] = useState<CVData>({
    fullName: '', email: '', phone: '', address: '', objective: '',
    education: [{ institution: '', degree: '', year: '', gpa: '' }],
    experience: [{ company: '', role: '', duration: '', description: '' }],
    skills: [],
    languages: [{ language: 'Bengali', proficiency: 'Native' }, { language: 'English', proficiency: 'Fluent' }],
  });
  const [newSkill, setNewSkill] = useState('');

  // SOP word count
  const totalWords = useMemo(() => {
    return sopSections.reduce((total, s) => total + s.content.split(/\s+/).filter(w => w).length, 0);
  }, [sopSections]);

  const sectionWords = useCallback((content: string) => {
    return content.split(/\s+/).filter(w => w).length;
  }, []);

  // AI-assisted SOP writing
  const getAiSuggestion = useCallback(async (sectionId: string) => {
    setSopAiLoading(sectionId);
    try {
      const res = await fetch('/api/ai/study-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Help me write the "${SOP_SECTIONS.find(s => s.id === sectionId)?.title}" section of my Statement of Purpose for studying in ${COUNTRY_CV_TIPS[selectedCountry]?.label || 'the UK'}. Give me a template paragraph I can customize.`,
          studentProfile: { name: cv.fullName || 'Student' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const suggestion = data.response || '';
        // Append AI suggestion to section
        setSopSections(prev => prev.map(s =>
          s.id === sectionId ? { ...s, content: s.content ? s.content + '\n\n' + suggestion : suggestion } : s
        ));
      }
    } catch {
      // Silently fail
    } finally {
      setSopAiLoading(null);
    }
  }, [selectedCountry, cv.fullName]);

  const addCvEducation = useCallback(() => {
    setCv(prev => ({ ...prev, education: [...prev.education, { institution: '', degree: '', year: '', gpa: '' }] }));
  }, []);

  const addCvExperience = useCallback(() => {
    setCv(prev => ({ ...prev, experience: [...prev.experience, { company: '', role: '', duration: '', description: '' }] }));
  }, []);

  const addSkill = useCallback(() => {
    if (newSkill.trim()) {
      setCv(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  }, [newSkill]);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white border-b border-[#2d3142]/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#2d3142]/60">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-[#2d3142]">CV & SOP Builder</h1>
              <p className="text-xs text-[#2d3142]/50">Country-specific templates with AI assistance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COUNTRY_CV_TIPS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6 bg-white border border-[#2d3142]/5">
            <TabsTrigger value="sop" className="flex-1 text-xs data-[state=active]:bg-[#bf4520] data-[state=active]:text-white">
              <PenLine className="w-3.5 h-3.5 mr-1" /> SOP Builder
            </TabsTrigger>
            <TabsTrigger value="cv" className="flex-1 text-xs data-[state=active]:bg-[#bf4520] data-[state=active]:text-white">
              <FileText className="w-3.5 h-3.5 mr-1" /> CV Builder
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 text-xs data-[state=active]:bg-[#bf4520] data-[state=active]:text-white">
              <BookOpen className="w-3.5 h-3.5 mr-1" /> Templates
            </TabsTrigger>
          </TabsList>

          {/* ── SOP Builder ────────────────────────────────────────────────── */}
          <TabsContent value="sop" className="space-y-6">
            {/* Country Tips Panel */}
            {COUNTRY_CV_TIPS[selectedCountry] && (
              <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-[#bf4520]" />
                  <h3 className="text-sm font-semibold text-[#2d3142]">
                    SOP Tips for {COUNTRY_CV_TIPS[selectedCountry].label}
                  </h3>
                  <Badge variant="outline" className="text-[10px] border-[#bf4520]/30 text-[#bf4520]">
                    {COUNTRY_CV_TIPS[selectedCountry].format}
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {COUNTRY_CV_TIPS[selectedCountry].tips.map((t, i) => (
                    <li key={i} className="text-xs text-[#2d3142]/60 flex items-start gap-1.5">
                      <span className="text-[#bf4520] mt-0.5">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Word Count Tracker */}
            <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#2d3142]">Word Count</h3>
                <span className={cn('text-lg font-bold', totalWords >= 500 && totalWords <= 1000 ? 'text-emerald-600' : 'text-amber-600')}>
                  {totalWords} words
                </span>
              </div>
              <div className="w-full bg-[#f5f5f5] rounded-full h-2">
                <div
                  className={cn('h-full rounded-full transition-all', totalWords >= 500 && totalWords <= 1000 ? 'bg-emerald-500' : 'bg-amber-500')}
                  style={{ width: `${Math.min((totalWords / 1000) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#2d3142]/30 mt-1">
                <span>0</span>
                <span className="text-emerald-600">500 (min)</span>
                <span>1000 (max)</span>
              </div>
            </div>

            {/* SOP Sections */}
            <div className="space-y-4">
              {sopSections.map((section, idx) => {
                const words = sectionWords(section.content);
                const wordOk = words >= section.minWords && words <= section.maxWords;
                return (
                  <div key={section.id} className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#bf4520] text-white text-xs flex items-center justify-center font-medium">{idx + 1}</span>
                        <h4 className="text-sm font-semibold text-[#2d3142]">{section.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-[10px]', wordOk ? 'border-emerald-300 text-emerald-600' : 'border-amber-300 text-amber-600')}>
                          {words}/{section.minWords}-{section.maxWords}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => getAiSuggestion(section.id)}
                          disabled={sopAiLoading === section.id}
                          className="text-xs text-[#bf4520] hover:text-[#a33d1c] h-7"
                        >
                          {sopAiLoading === section.id ? (
                            <span className="animate-pulse">AI writing...</span>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 mr-1" /> AI Assist
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={section.content}
                      onChange={e => setSopSections(prev => prev.map(s =>
                        s.id === section.id ? { ...s, content: e.target.value } : s
                      ))}
                      placeholder={`Write your ${section.title.toLowerCase()} here...`}
                      className="min-h-[100px] text-sm border-[#2d3142]/10 focus:border-[#bf4520]"
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-medium text-[#2d3142]/40 uppercase">Tips</p>
                      {section.tips.map((tip, i) => (
                        <p key={i} className="text-[11px] text-[#2d3142]/50 flex items-start gap-1">
                          <Info className="w-3 h-3 text-[#bf4520] shrink-0 mt-0.5" />
                          {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SOP Preview */}
            <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#bf4520]" />
                  <h3 className="text-sm font-semibold text-[#2d3142]">Full SOP Preview</h3>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    <Printer className="w-3 h-3 mr-1" /> Print
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    <Download className="w-3 h-3 mr-1" /> Export
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none bg-[#f5f5f5] p-6 rounded-md">
                {sopSections.map((section) => (
                  <div key={section.id} className="mb-4">
                    {section.content && (
                      <>
                        <p className="text-sm font-medium text-[#2d3142]/50 mb-1">{section.title}</p>
                        <p className="text-sm text-[#2d3142] whitespace-pre-wrap">{section.content}</p>
                      </>
                    )}
                  </div>
                ))}
                {totalWords === 0 && (
                  <p className="text-sm text-[#2d3142]/30 italic">Start writing in the sections above to see your SOP here.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── CV Builder ──────────────────────────────────────────────────── */}
          <TabsContent value="cv" className="space-y-6">
            {/* Country CV Tips */}
            {COUNTRY_CV_TIPS[selectedCountry] && (
              <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-[#bf4520]" />
                  <h3 className="text-sm font-semibold text-[#2d3142]">
                    {COUNTRY_CV_TIPS[selectedCountry].label} Guidelines
                  </h3>
                </div>
                <p className="text-xs text-[#bf4520] font-medium mb-2">{COUNTRY_CV_TIPS[selectedCountry].format}</p>
                <div className="flex flex-wrap gap-2">
                  {COUNTRY_CV_TIPS[selectedCountry].tips.map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] bg-[#f5f5f5] text-[#2d3142]/60 border-0">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Info */}
            <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
              <h3 className="text-sm font-semibold text-[#2d3142] mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Full Name" value={cv.fullName} onChange={e => setCv(p => ({ ...p, fullName: e.target.value }))} className="text-sm h-9" />
                <Input placeholder="Email" value={cv.email} onChange={e => setCv(p => ({ ...p, email: e.target.value }))} className="text-sm h-9" />
                <Input placeholder="Phone" value={cv.phone} onChange={e => setCv(p => ({ ...p, phone: e.target.value }))} className="text-sm h-9" />
                <Input placeholder="Address" value={cv.address} onChange={e => setCv(p => ({ ...p, address: e.target.value }))} className="text-sm h-9" />
              </div>
              <Textarea placeholder="Career Objective / Personal Profile" value={cv.objective} onChange={e => setCv(p => ({ ...p, objective: e.target.value }))} className="text-sm mt-3 min-h-[60px]" />
            </div>

            {/* Education */}
            <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#2d3142]">Education</h3>
                <button onClick={addCvEducation} className="text-xs text-[#bf4520] hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="space-y-3">
                {cv.education.map((edu, i) => (
                  <div key={i} className="p-3 rounded-md bg-[#f5f5f5] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium text-[#2d3142]/50">#{i + 1}</span>
                      {cv.education.length > 1 && (
                        <button onClick={() => setCv(p => ({ ...p, education: p.education.filter((_, j) => j !== i) }))} className="text-xs text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Institution" value={edu.institution} onChange={e => setCv(p => ({ ...p, education: p.education.map((ed, j) => j === i ? { ...ed, institution: e.target.value } : ed) }))} className="text-xs h-8" />
                      <Input placeholder="Degree" value={edu.degree} onChange={e => setCv(p => ({ ...p, education: p.education.map((ed, j) => j === i ? { ...ed, degree: e.target.value } : ed) }))} className="text-xs h-8" />
                      <Input placeholder="Year" value={edu.year} onChange={e => setCv(p => ({ ...p, education: p.education.map((ed, j) => j === i ? { ...ed, year: e.target.value } : ed) }))} className="text-xs h-8" />
                      <Input placeholder="GPA/Grade" value={edu.gpa} onChange={e => setCv(p => ({ ...p, education: p.education.map((ed, j) => j === i ? { ...ed, gpa: e.target.value } : ed) }))} className="text-xs h-8" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#2d3142]">Experience</h3>
                <button onClick={addCvExperience} className="text-xs text-[#bf4520] hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="space-y-3">
                {cv.experience.map((exp, i) => (
                  <div key={i} className="p-3 rounded-md bg-[#f5f5f5] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium text-[#2d3142]/50">#{i + 1}</span>
                      {cv.experience.length > 1 && (
                        <button onClick={() => setCv(p => ({ ...p, experience: p.experience.filter((_, j) => j !== i) }))} className="text-xs text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Company" value={exp.company} onChange={e => setCv(p => ({ ...p, experience: p.experience.map((ex, j) => j === i ? { ...ex, company: e.target.value } : ex) }))} className="text-xs h-8" />
                      <Input placeholder="Role" value={exp.role} onChange={e => setCv(p => ({ ...p, experience: p.experience.map((ex, j) => j === i ? { ...ex, role: e.target.value } : ex) }))} className="text-xs h-8" />
                    </div>
                    <Input placeholder="Duration" value={exp.duration} onChange={e => setCv(p => ({ ...p, experience: p.experience.map((ex, j) => j === i ? { ...ex, duration: e.target.value } : ex) }))} className="text-xs h-8" />
                    <Textarea placeholder="Description" value={exp.description} onChange={e => setCv(p => ({ ...p, experience: p.experience.map((ex, j) => j === i ? { ...ex, description: e.target.value } : ex) }))} className="text-xs min-h-[50px]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
              <h3 className="text-sm font-semibold text-[#2d3142] mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {cv.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-[#f5f5f5] text-[#2d3142] border-0 pr-1">
                    {skill}
                    <button onClick={() => setCv(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))} className="ml-1 text-[#2d3142]/30 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add a skill" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className="text-xs h-8" />
                <Button onClick={addSkill} size="sm" className="h-8 bg-[#bf4520] hover:bg-[#a33d1c] text-white text-xs">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
              <h3 className="text-sm font-semibold text-[#2d3142] mb-3">Languages</h3>
              <div className="space-y-2">
                {cv.languages.map((lang, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={lang.language} onChange={e => setCv(p => ({ ...p, languages: p.languages.map((l, j) => j === i ? { ...l, language: e.target.value } : l) }))} className="text-xs h-8 flex-1" />
                    <Select value={lang.proficiency} onValueChange={v => setCv(p => ({ ...p, languages: p.languages.map((l, j) => j === i ? { ...l, proficiency: v } : l) }))}>
                      <SelectTrigger className="h-8 text-xs w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Native">Native</SelectItem>
                        <SelectItem value="Fluent">Fluent</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Basic">Basic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <button
                  onClick={() => setCv(p => ({ ...p, languages: [...p.languages, { language: '', proficiency: 'Intermediate' }] }))}
                  className="text-xs text-[#bf4520] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Language
                </button>
              </div>
            </div>

            {/* CV Preview */}
            <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#bf4520]" />
                  <h3 className="text-sm font-semibold text-[#2d3142]">Live Preview</h3>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    <Printer className="w-3 h-3 mr-1" /> Print
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    <Download className="w-3 h-3 mr-1" /> Export
                  </Button>
                </div>
              </div>
              <div className="bg-[#f5f5f5] p-6 rounded-md max-w-2xl mx-auto">
                {/* Mini CV Preview */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-[#2d3142]">{cv.fullName || 'Your Name'}</h4>
                    <p className="text-xs text-[#2d3142]/50">{[cv.email, cv.phone, cv.address].filter(Boolean).join(' • ')}</p>
                  </div>
                  {cv.objective && (
                    <div>
                      <p className="text-xs font-semibold text-[#bf4520] uppercase mb-1">Objective</p>
                      <p className="text-xs text-[#2d3142]">{cv.objective}</p>
                    </div>
                  )}
                  {cv.education.some(e => e.institution || e.degree) && (
                    <div>
                      <p className="text-xs font-semibold text-[#bf4520] uppercase mb-1">Education</p>
                      {cv.education.filter(e => e.institution || e.degree).map((e, i) => (
                        <div key={i} className="flex justify-between text-xs mb-0.5">
                          <span className="text-[#2d3142]">{e.degree}{e.institution ? ` — ${e.institution}` : ''}</span>
                          <span className="text-[#2d3142]/50">{e.year}{e.gpa ? ` | GPA: ${e.gpa}` : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {cv.experience.some(e => e.company || e.role) && (
                    <div>
                      <p className="text-xs font-semibold text-[#bf4520] uppercase mb-1">Experience</p>
                      {cv.experience.filter(e => e.company || e.role).map((e, i) => (
                        <div key={i} className="mb-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-[#2d3142]">{e.role}{e.company ? ` at ${e.company}` : ''}</span>
                            <span className="text-[#2d3142]/50">{e.duration}</span>
                          </div>
                          {e.description && <p className="text-[11px] text-[#2d3142]/60">{e.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {cv.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#bf4520] uppercase mb-1">Skills</p>
                      <p className="text-xs text-[#2d3142]">{cv.skills.join(', ')}</p>
                    </div>
                  )}
                  {cv.languages.some(l => l.language) && (
                    <div>
                      <p className="text-xs font-semibold text-[#bf4520] uppercase mb-1">Languages</p>
                      <p className="text-xs text-[#2d3142]">{cv.languages.filter(l => l.language).map(l => `${l.language} (${l.proficiency})`).join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Templates Gallery ───────────────────────────────────────────── */}
          <TabsContent value="templates" className="space-y-6">
            <div className="bg-white rounded-lg p-4 border border-[#2d3142]/5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[#bf4520]" />
                <h3 className="text-base font-semibold text-[#2d3142]">Sample SOP Templates</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(SAMPLE_SOPS).map(([key, sop]) => (
                  <div
                    key={key}
                    className="p-4 rounded-lg bg-[#f5f5f5] border border-[#2d3142]/5 hover:border-[#bf4520]/30 cursor-pointer transition-all"
                    onClick={() => {
                      setActiveTab('sop');
                      setSopSections(prev => prev.map(s => {
                        if (s.id === 'intro') return { ...s, content: sop.preview };
                        return s;
                      }));
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] border-[#bf4520]/30 text-[#bf4520]">{sop.country}</Badge>
                      <Badge variant="secondary" className="text-[10px] bg-white text-[#2d3142]/60 border-0">{sop.field}</Badge>
                    </div>
                    <p className="text-sm text-[#2d3142]/70 line-clamp-3">{sop.preview}</p>
                    <p className="text-xs text-[#bf4520] mt-2 flex items-center gap-1">
                      Use as template <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ALO SOP Writing Service CTA */}
            <div className="bg-[#bf4520] rounded-lg p-6 text-center text-white">
              <h3 className="text-lg font-semibold mb-2">Professional SOP Writing Service</h3>
              <p className="text-sm opacity-90 mb-4">Our expert writers create compelling, country-specific SOPs with a 98% acceptance rate.</p>
              <Button onClick={onLeadOpen} className="bg-white text-[#bf4520] hover:bg-white/90">
                Get SOP Writing Help
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
