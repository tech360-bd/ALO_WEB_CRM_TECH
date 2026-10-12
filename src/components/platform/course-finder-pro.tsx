'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Filter, X, GraduationCap, MapPin, Clock, Star, ArrowRight,
  Brain, Sparkles, Bookmark, BookmarkCheck, ChevronDown, ChevronUp,
  Globe, CheckCircle2, AlertCircle, Zap, SlidersHorizontal, Grid3X3, List,
  ArrowLeft, Heart, Share2, ExternalLink, TrendingUp, Shield, Award,
  FileText, ScanLine, ChevronRight, Menu
} from 'lucide-react';

interface Course {
  id: string;
  name: string;
  university: string;
  country: string;
  city: string;
  level: string;
  subject: string;
  duration: string;
  tuition: string;
  currency: string;
  englishReq: string;
  academicReq: string;
  gpaReq: string;
  scholarship: boolean;
  matchScore: number;
  slug: string;
  overview: string;
  modules: string[];
  careerOutcomes: string[];
}

interface CourseFinderProProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

const sampleCourses: Course[] = [
  { id: '1', name: 'MSc Data Science', university: 'University of Manchester', country: 'United Kingdom', city: 'Manchester', level: 'Masters', subject: 'Computer Science', duration: '1 year', tuition: '32,000', currency: 'GBP', englishReq: 'IELTS 6.5 (no band < 6.0)', academicReq: '2:1 or equivalent', gpaReq: '3.0/4.0', scholarship: true, matchScore: 96, slug: 'msc-data-science-university-of-manchester', overview: 'This programme equips you with the skills to extract insights from complex data using statistical and machine learning techniques.', modules: ['Machine Learning', 'Big Data Systems', 'Statistical Methods', 'Data Visualization', 'Deep Learning', 'Applied Data Science Project'], careerOutcomes: ['Data Scientist', 'ML Engineer', 'Data Analyst', 'AI Researcher'] },
  { id: '2', name: 'MBA International Business', university: 'University of Toronto', country: 'Canada', city: 'Toronto', level: 'Masters', subject: 'Business', duration: '2 years', tuition: '62,000', currency: 'CAD', englishReq: 'IELTS 7.0 (no band < 6.5)', academicReq: 'Bachelors with 3+ years work exp', gpaReq: '3.3/4.0', scholarship: true, matchScore: 88, slug: 'mba-international-business-university-of-toronto', overview: 'A transformative MBA program focusing on global business strategy, leadership, and innovation management.', modules: ['Strategic Management', 'Global Marketing', 'Finance', 'Operations', 'Leadership', 'Capstone Project'], careerOutcomes: ['Business Consultant', 'Product Manager', 'Strategy Director', 'Entrepreneur'] },
  { id: '3', name: 'MS Computer Science', university: 'TU Munich', country: 'Germany', city: 'Munich', level: 'Masters', subject: 'Computer Science', duration: '2 years', tuition: '0 (public)', currency: 'EUR', englishReq: 'IELTS 6.5', academicReq: 'CS Bachelors degree', gpaReq: '2.5/4.0', scholarship: true, matchScore: 94, slug: 'ms-computer-science-tu-munich', overview: 'One of Europe top CS programs covering AI, systems, and theoretical foundations with strong industry connections.', modules: ['Artificial Intelligence', 'Operating Systems', 'Distributed Systems', 'Computer Vision', 'Robotics', 'Research Thesis'], careerOutcomes: ['Software Engineer', 'Research Scientist', 'Systems Architect', 'CTO'] },
  { id: '4', name: 'Master of Nursing', university: 'Monash University', country: 'Australia', city: 'Melbourne', level: 'Masters', subject: 'Health & Medicine', duration: '2 years', tuition: '38,000', currency: 'AUD', englishReq: 'IELTS 7.0 (no band < 7.0)', academicReq: 'Bachelor of Nursing', gpaReq: '3.0/4.0', scholarship: false, matchScore: 82, slug: 'master-nursing-monash', overview: 'Advanced nursing practice program with clinical placements in leading hospitals across Australia.', modules: ['Advanced Clinical Practice', 'Health Leadership', 'Research Methods', 'Clinical Placement', 'Public Health', 'Thesis'], careerOutcomes: ['Nurse Practitioner', 'Clinical Nurse Specialist', 'Nurse Manager', 'Health Educator'] },
  { id: '5', name: 'MSc Artificial Intelligence', university: 'University of Edinburgh', country: 'United Kingdom', city: 'Edinburgh', level: 'Masters', subject: 'Computer Science', duration: '1 year', tuition: '38,000', currency: 'GBP', englishReq: 'IELTS 6.5 (no band < 6.0)', academicReq: '2:1 in CS or related', gpaReq: '3.0/4.0', scholarship: true, matchScore: 92, slug: 'msc-ai-university-of-edinburgh', overview: 'World-leading AI research program covering machine learning, NLP, computer vision, and robotics.', modules: ['Machine Learning', 'NLP', 'Computer Vision', 'Reinforcement Learning', 'Ethics in AI', 'MSc Project'], careerOutcomes: ['AI Engineer', 'Research Scientist', 'ML Engineer', 'AI Product Manager'] },
  { id: '6', name: 'MSc Finance', university: 'Imperial College London', country: 'United Kingdom', city: 'London', level: 'Masters', subject: 'Finance', duration: '1 year', tuition: '42,000', currency: 'GBP', englishReq: 'IELTS 7.0 (no band < 6.5)', academicReq: 'First class or 2:1', gpaReq: '3.5/4.0', scholarship: true, matchScore: 85, slug: 'msc-finance-imperial', overview: 'Rigorous quantitative finance program preparing graduates for careers in investment banking, asset management, and fintech.', modules: ['Quantitative Methods', 'Derivatives', 'Portfolio Management', 'Risk Management', 'FinTech', 'Summer Project'], careerOutcomes: ['Investment Banker', 'Portfolio Manager', 'Risk Analyst', 'Quant Trader'] },
  { id: '7', name: 'Master of Engineering', university: 'University of Melbourne', country: 'Australia', city: 'Melbourne', level: 'Masters', subject: 'Engineering', duration: '2 years', tuition: '45,000', currency: 'AUD', englishReq: 'IELTS 6.5 (no band < 6.0)', academicReq: 'Engineering Bachelors', gpaReq: '3.0/4.0', scholarship: true, matchScore: 87, slug: 'master-engineering-melbourne', overview: 'Specialized engineering programs with industry partnerships and research opportunities.', modules: ['Advanced Engineering Design', 'Project Management', 'Specialization Electives', 'Industry Project', 'Research Methods', 'Thesis'], careerOutcomes: ['Senior Engineer', 'Project Manager', 'Engineering Consultant', 'Technical Director'] },
  { id: '8', name: 'MSc Data Analytics', university: 'University College Dublin', country: 'Ireland', city: 'Dublin', level: 'Masters', subject: 'Computer Science', duration: '1 year', tuition: '24,000', currency: 'EUR', englishReq: 'IELTS 6.5', academicReq: '2:1 or equivalent', gpaReq: '3.0/4.0', scholarship: true, matchScore: 90, slug: 'msc-data-analytics-ucd', overview: 'Comprehensive data analytics program with strong industry links in Ireland booming tech sector.', modules: ['Data Mining', 'Statistical Modelling', 'Data Engineering', 'Visualization', 'Business Intelligence', 'Applied Project'], careerOutcomes: ['Data Analyst', 'Business Analyst', 'Analytics Engineer', 'BI Developer'] },
];

const subjects = ['All', 'Computer Science', 'Business', 'Engineering', 'Health & Medicine', 'Finance', 'Arts & Design', 'Law', 'Social Sciences'];
const levels = ['All', 'Bachelors', 'Masters', 'PhD', 'PG Diploma', 'Foundation'];
const countryFilters = ['All', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Ireland', 'Netherlands', 'New Zealand', 'United States'];
const intakes = ['All', 'Sep 2025', 'Jan 2026', 'May 2026', 'Sep 2026'];

export function CourseFinderPro({ onBack, onNavigate, onLeadOpen }: CourseFinderProProps) {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [level, setLevel] = useState('All');
  const [country, setCountry] = useState('All');
  const [intake, setIntake] = useState('All');
  const [maxTuition, setMaxTuition] = useState([50000]);
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('matchScore');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let results = sampleCourses.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.university.toLowerCase().includes(search.toLowerCase()) && !c.subject.toLowerCase().includes(search.toLowerCase())) return false;
      if (subject !== 'All' && c.subject !== subject) return false;
      if (level !== 'All' && c.level !== level) return false;
      if (country !== 'All' && c.country !== country) return false;
      if (scholarshipOnly && !c.scholarship) return false;
      const tuitionNum = parseInt(c.tuition.replace(/[^0-9]/g, '')) || 0;
      if (tuitionNum > maxTuition[0] && c.tuition !== '0 (public)') return false;
      return true;
    });
    results.sort((a, b) => {
      if (sortBy === 'matchScore') return b.matchScore - a.matchScore;
      if (sortBy === 'tuitionLow') return (parseInt(a.tuition.replace(/[^0-9]/g, '')) || 0) - (parseInt(b.tuition.replace(/[^0-9]/g, '')) || 0);
      if (sortBy === 'tuitionHigh') return (parseInt(b.tuition.replace(/[^0-9]/g, '')) || 0) - (parseInt(a.tuition.replace(/[^0-9]/g, '')) || 0);
      return 0;
    });
    return results;
  }, [search, subject, level, country, intake, maxTuition, scholarshipOnly, sortBy]);

  const toggleSave = useCallback((id: string) => {
    setSavedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }, []);

  const runAiMatch = useCallback(() => {
    setAiLoading(true);
    setAiResult(null);
    setTimeout(() => {
      setAiResult(`Based on your profile analysis:\n\n✅ **Best Match**: ${filtered[0]?.name} at ${filtered[0]?.university} (${filtered[0]?.matchScore}% fit)\n\n⭐ **Alternative Options**:\n${filtered.slice(1, 4).map(c => `- ${c.name} (${c.matchScore}% fit)`).join('\n')}\n\n📊 **Recommendation**: ${filtered[0]?.country} offers the best combination of quality education, post-study work visa, and career opportunities for your profile.\n\n🎬 **Scholarship Alert**: ${filtered.filter(c => c.scholarship).length} of ${filtered.length} matched courses offer scholarship opportunities.`);
      setAiLoading(false);
    }, 2000);
  }, [filtered]);

  const activeFilterCount = [subject !== 'All', level !== 'All', country !== 'All', scholarshipOnly].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-[#101828] via-[#1a1a3e] to-[#0a1628] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30"><Brain className="w-3 h-3 mr-1" /> AI-Powered</Badge>
                <Badge className="bg-white/10 text-gray-300 border-white/10">10,000+ Courses</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Course Finder</h1>
              <p className="text-gray-400 mt-1">Find your perfect course from 500+ universities worldwide</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setShowAiPanel(!showAiPanel)}>
                <Sparkles className="w-4 h-4 mr-2" /> AI Match
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={onLeadOpen}>
                <Zap className="w-4 h-4 mr-2" /> Get Expert Help
              </Button>
            </div>
          </div>
          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses, universities, subjects..." className="pl-12 pr-4 py-4 bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-base rounded-xl focus:ring-orange-500 focus:border-orange-500" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar Filters ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
                <motion.div onClick={e => e.stopPropagation()} className="w-80 h-full bg-white overflow-y-auto p-6" initial={{ x: -320 }} animate={{ x: 0 }}>
                  <FilterSidebar subject={subject} setSubject={setSubject} level={level} setLevel={setLevel} country={country} setCountry={setCountry} maxTuition={maxTuition} setMaxTuition={setMaxTuition} scholarshipOnly={scholarshipOnly} setScholarshipOnly={setScholarshipOnly} />
                </motion.div>
              </motion.aside>
            )}
          </AnimatePresence>

          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 space-y-6">
              <Card className="border-gray-200"><CardContent className="p-5 space-y-5">
                <FilterSidebar subject={subject} setSubject={setSubject} level={level} setLevel={setLevel} country={country} setCountry={setCountry} maxTuition={maxTuition} setMaxTuition={setMaxTuition} scholarshipOnly={scholarshipOnly} setScholarshipOnly={setScholarshipOnly} />
              </CardContent></Card>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(true)}>
                  <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters {activeFilterCount > 0 && <Badge className="ml-1 bg-orange-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFilterCount}</Badge>}
                </Button>
                <span className="text-sm text-gray-500"><span className="font-semibold text-gray-900">{filtered.length}</span> courses found</span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matchScore">Best Match</SelectItem>
                    <SelectItem value="tuitionLow">Tuition: Low to High</SelectItem>
                    <SelectItem value="tuitionHigh">Tuition: High to Low</SelectItem>
                  </SelectContent>
                </Select>
                <div className="hidden sm:flex items-center border rounded-lg p-0.5">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}><Grid3X3 className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}><List className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {/* AI Panel */}
            <AnimatePresence>
              {showAiPanel && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                  <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0"><Sparkles className="w-6 h-6 text-white" /></div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">AI Smart Match</h3>
                          <p className="text-sm text-gray-500 mb-4">Let AI analyze your current filters and recommend the best options.</p>
                          {aiLoading ? (
                            <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
                          ) : aiResult ? (
                            <div className="bg-white rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line border">{aiResult}</div>
                          ) : (
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={runAiMatch}><Brain className="w-4 h-4 mr-2" /> Analyze My Matches</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            {filtered.length === 0 ? (
              <Card className="border-gray-200"><CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search terms.</p>
                <Button variant="outline" onClick={() => { setSearch(''); setSubject('All'); setLevel('All'); setCountry('All'); setScholarshipOnly(false); }}>Clear All Filters</Button>
              </CardContent></Card>
            ) : viewMode === 'grid' ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(c => <CourseCard key={c.id} course={c} saved={savedIds.has(c.id)} onToggleSave={() => toggleSave(c.id)} onExpand={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)} expanded={expandedCourse === c.id} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />)}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(c => <CourseListItem key={c.id} course={c} saved={savedIds.has(c.id)} onToggleSave={() => toggleSave(c.id)} onNavigate={onNavigate} />)}
              </div>
            )}
          </div>

          {/* ── AI Side Panel (Desktop) ── */}
          {showAiPanel && (
            <aside className="hidden xl:block w-80 shrink-0">
              <Card className="sticky top-24 border-orange-200 bg-gradient-to-b from-orange-50 to-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-orange-500" /><h3 className="font-bold">AI Recommendations</h3></div>
                  {aiLoading ? <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : aiResult ? <div className="text-sm text-gray-600 whitespace-pre-line bg-white rounded-lg p-3 border">{aiResult}</div> : <><p className="text-sm text-gray-500 mb-4">Get personalized course recommendations based on your filters.</p><Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={runAiMatch}><Brain className="w-4 h-4 mr-2" /> Analyze Matches</Button></>}
                </CardContent>
              </Card>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSidebar({ subject, setSubject, level, setLevel, country, setCountry, maxTuition, setMaxTuition, scholarshipOnly, setScholarshipOnly }: any) {
  return (<>
    <div><label className="text-sm font-semibold text-gray-900 mb-2 block">Subject</label>
      <Select value={subject} onValueChange={setSubject}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
    </div>
    <div><label className="text-sm font-semibold text-gray-900 mb-2 block">Level</label>
      <Select value={level} onValueChange={setLevel}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
    </div>
    <div><label className="text-sm font-semibold text-gray-900 mb-2 block">Country</label>
      <Select value={country} onValueChange={setCountry}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{countryFilters.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
    </div>
    <div><label className="text-sm font-semibold text-gray-900 mb-2 block">Max Tuition/yr</label>
      <Slider value={maxTuition} onValueChange={setMaxTuition} max={80000} step={5000} className="mt-3" />
      <p className="text-xs text-gray-500 mt-1">Up to £{(maxTuition[0] / 1000).toFixed(0)}K</p>
    </div>
    <div className="flex items-center gap-2"><Checkbox id="sch" checked={scholarshipOnly} onCheckedChange={(v: any) => setScholarshipOnly(!!v)} /><label htmlFor="sch" className="text-sm text-gray-700">Scholarship Available</label></div>
  </>);
}

function CourseCard({ course, saved, onToggleSave, onExpand, expanded, onNavigate, onLeadOpen }: { course: Course; saved: boolean; onToggleSave: () => void; onExpand: () => void; expanded: boolean; onNavigate: (p: string, s?: string) => void; onLeadOpen: () => void; }) {
  return (
    <Card className={`group border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 overflow-hidden ${expanded ? 'ring-2 ring-orange-400' : ''}`}>
      <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-600" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge className={course.matchScore >= 90 ? 'bg-green-100 text-green-700' : course.matchScore >= 80 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}>{course.matchScore}% Match</Badge>
          <button onClick={onToggleSave} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">{saved ? <BookmarkCheck className="w-5 h-5 text-orange-500" /> : <Bookmark className="w-5 h-5 text-gray-400" />}</button>
        </div>
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors cursor-pointer" onClick={() => onNavigate('course', course.slug)}>{course.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{course.university}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="outline" className="text-xs"><MapPin className="w-3 h-3 mr-1" />{course.city}, {course.country.split(' ')[0]}</Badge>
          <Badge variant="outline" className="text-xs"><GraduationCap className="w-3 h-3 mr-1" />{course.level}</Badge>
          <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{course.duration}</Badge>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div><span className="text-lg font-bold text-gray-900">{course.currency === 'GBP' ? '£' : course.currency === 'EUR' ? '€' : course.currency === 'CAD' ? 'C$' : course.currency === 'AUD' ? 'A$' : '$'}{parseInt(course.tuition.replace(/[^0-9]/g, '')).toLocaleString()}</span><span className="text-xs text-gray-400">/year</span></div>
          <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => onNavigate('course', course.slug)}>Details <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
        {course.scholarship && <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5"><Award className="w-3.5 h-3.5" />Scholarship Available</div>}
      </CardContent>
    </Card>
  );
}

function CourseListItem({ course, saved, onToggleSave, onNavigate }: { course: Course; saved: boolean; onToggleSave: () => void; onNavigate: (p: string, s?: string) => void; }) {
  return (
    <Card className="border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1"><Badge className={course.matchScore >= 90 ? 'bg-green-100 text-green-700 text-xs' : 'bg-orange-100 text-orange-700 text-xs'}>{course.matchScore}%</Badge><span className="text-sm text-gray-400">{course.level}</span></div>
          <h3 className="font-bold text-gray-900 truncate cursor-pointer hover:text-orange-600" onClick={() => onNavigate('course', course.slug)}>{course.name}</h3>
          <p className="text-sm text-gray-500">{course.university} &bull; {course.city}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {course.scholarship && <Badge className="bg-green-100 text-green-700"><Award className="w-3 h-3 mr-1" />Scholarship</Badge>}
          <div className="text-right"><p className="font-bold text-gray-900">{course.currency === 'GBP' ? '£' : course.currency === 'EUR' ? '€' : '$'}{parseInt(course.tuition.replace(/[^0-9]/g, '')).toLocaleString()}</p><p className="text-xs text-gray-400">/year &bull; {course.duration}</p></div>
          <button onClick={onToggleSave} className="p-2 hover:bg-gray-100 rounded-lg">{saved ? <BookmarkCheck className="w-5 h-5 text-orange-500" /> : <Bookmark className="w-5 h-5 text-gray-400" />}</button>
        </div>
      </CardContent>
    </Card>
  );
}
