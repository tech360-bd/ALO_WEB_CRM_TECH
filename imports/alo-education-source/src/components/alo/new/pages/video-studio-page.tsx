'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Video, FileText, Mic, Image, Subtitles, Music,
  Play, Download, Plus, Clock, CheckCircle2, Edit3, Sparkles,
  TrendingUp, Monitor, Smartphone, Square, Share2, Trash2,
  Copy, Eye, ChevronRight, Wand2, Volume2, Palette,
  Globe, Bot, LayoutTemplate, BarChart3,
  Youtube, Instagram, Facebook, Globe as GlobeIcon, Layers,
  Zap, Timer, Languages, Upload, CheckCircle, AlertCircle,
  Film, Clapperboard, MessageSquare, Star, Users, Target,
  RotateCcw, Save, Settings, ChevronDown, Award, GraduationCap,
  MapPin, DollarSign, Calendar, Briefcase, BookOpen, Megaphone
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
type VideoStatus = 'draft' | 'script' | 'voiceover' | 'footage' | 'editing' | 'published' | 'generating';
type AspectRatio = '16:9' | '9:16' | '1:1';

interface VideoProject {
  id: string;
  title: string;
  topic: string;
  status: VideoStatus;
  aspectRatio: AspectRatio;
  script: string;
  voiceoverUrl: string | null;
  subtitles: SubtitleLine[];
  musicTrack: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  duration: number;
}

interface SubtitleLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  duration: string;
  scenes: TemplateScene[];
  popular?: boolean;
}

interface TemplateScene {
  title: string;
  duration: string;
  type: 'intro' | 'content' | 'cta' | 'data' | 'testimonial' | 'process';
  description: string;
}

interface AvatarOption {
  id: string;
  name: string;
  style: 'professional' | 'casual' | 'animated';
  gender: 'male' | 'female';
}

interface CaptionTrack {
  id: string;
  language: string;
  label: string;
  lines: SubtitleLine[];
}

interface VideoAnalyticsData {
  totalViews: number;
  totalEngagement: number;
  avgCompletionRate: number;
  totalLikes: number;
  totalShares: number;
  platformStats: PlatformStat[];
  topVideos: TopVideo[];
  abTests: ABTest[];
}

interface PlatformStat {
  platform: string;
  views: number;
  engagement: number;
  followers: number;
  icon: React.ElementType;
  color: string;
}

interface TopVideo {
  id: string;
  title: string;
  views: number;
  engagement: number;
  completionRate: number;
  platform: string;
  thumbnail: string;
}

interface ABTest {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
  viewsA: number;
  viewsB: number;
  conversionA: number;
  conversionB: number;
  status: 'running' | 'completed';
  winner?: 'A' | 'B';
}

// ============================================================
// Constants
// ============================================================
const STATUS_STEPS: { key: VideoStatus; label: string; icon: React.ElementType }[] = [
  { key: 'draft', label: 'Draft', icon: Edit3 },
  { key: 'script', label: 'Script', icon: FileText },
  { key: 'voiceover', label: 'Voiceover', icon: Mic },
  { key: 'footage', label: 'Footage', icon: Image },
  { key: 'editing', label: 'Editing', icon: Palette },
  { key: 'published', label: 'Published', icon: CheckCircle2 },
];

const VIDEO_STYLES = [
  { id: 'educational', label: 'Educational', icon: BookOpen, description: 'Academic & informative style' },
  { id: 'promotional', label: 'Promotional', icon: Megaphone, description: 'Marketing & brand focused' },
  { id: 'testimonial', label: 'Testimonial', icon: MessageSquare, description: 'Student success stories' },
  { id: 'campus-tour', label: 'Campus Tour', icon: MapPin, description: 'Virtual campus walkthrough' },
  { id: 'course-overview', label: 'Course Overview', icon: GraduationCap, description: 'Program & curriculum detail' },
  { id: 'visa-guide', label: 'Visa Guide', icon: Globe, description: 'Step-by-step visa process' },
];

const DURATIONS = [
  { value: '15', label: '15 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '120', label: '2 minutes' },
];

const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'bn', label: 'Bengali', flag: '🇧🇩' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { value: 'zh', label: 'Chinese', flag: '🇨🇳' },
];

const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'ava1', name: 'Sarah - Academic Advisor', style: 'professional', gender: 'female' },
  { id: 'ava2', name: 'James - Admissions Officer', style: 'professional', gender: 'male' },
  { id: 'ava3', name: 'Priya - Student Mentor', style: 'casual', gender: 'female' },
  { id: 'ava4', name: 'Rahul - Career Coach', style: 'casual', gender: 'male' },
  { id: 'ava5', name: 'Animated - Grad Cap', style: 'animated', gender: 'female' },
  { id: 'ava6', name: 'Animated - Globe', style: 'animated', gender: 'male' },
];

const MUSIC_TRACKS = [
  { id: 'inspiring-uplift', name: 'Inspiring Uplift', genre: 'Corporate', duration: '2:30' },
  { id: 'ambient-calm', name: 'Ambient Calm', genre: 'Ambient', duration: '3:15' },
  { id: 'energetic-pop', name: 'Energetic Pop', genre: 'Pop', duration: '2:00' },
  { id: 'piano-emotional', name: 'Piano Emotional', genre: 'Classical', duration: '4:00' },
  { id: 'tech-modern', name: 'Tech Modern', genre: 'Electronic', duration: '2:45' },
  { id: 'acoustic-warm', name: 'Acoustic Warm', genre: 'Acoustic', duration: '3:30' },
];

const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'university-spotlight',
    name: 'University Spotlight',
    description: 'Complete university introduction with programs, campus life, and CTA',
    icon: GraduationCap,
    category: 'Institution',
    duration: '60s',
    popular: true,
    scenes: [
      { title: 'University Intro', duration: '8s', type: 'intro', description: 'Logo, name, location overlay with aerial campus shot' },
      { title: 'Academic Programs', duration: '12s', type: 'data', description: 'Top programs, rankings, and accreditation highlights' },
      { title: 'Campus Life', duration: '15s', type: 'content', description: 'Student activities, facilities, accommodation' },
      { title: 'Student Testimonial', duration: '10s', type: 'testimonial', description: 'Current student sharing their experience' },
      { title: 'Apply Now CTA', duration: '5s', type: 'cta', description: 'Application deadline, ALO Education contact, website' },
    ],
  },
  {
    id: 'student-testimonial',
    name: 'Student Testimonial',
    description: 'Authentic student story from application to graduation',
    icon: MessageSquare,
    category: 'Social Proof',
    duration: '45s',
    popular: true,
    scenes: [
      { title: 'Student Intro', duration: '5s', type: 'intro', description: 'Name, home country, university & program' },
      { title: 'The Journey', duration: '12s', type: 'content', description: 'Why they chose to study abroad, challenges overcome' },
      { title: 'Academic Experience', duration: '10s', type: 'testimonial', description: 'Classroom experience, professors, projects' },
      { title: 'Results & Impact', duration: '10s', type: 'data', description: 'Career outcomes, GPA, skills gained' },
      { title: 'Advice & CTA', duration: '8s', type: 'cta', description: 'Advice for future students + ALO Education referral' },
    ],
  },
  {
    id: 'course-overview',
    name: 'Course Overview',
    description: 'Detailed program breakdown with requirements and career outcomes',
    icon: BookOpen,
    category: 'Academic',
    duration: '90s',
    popular: true,
    scenes: [
      { title: 'Course Introduction', duration: '8s', type: 'intro', description: 'Course name, university, degree level' },
      { title: 'Curriculum Highlights', duration: '15s', type: 'data', description: 'Key modules, electives, specializations' },
      { title: 'Entry Requirements', duration: '12s', type: 'content', description: 'Academic, language, and document requirements' },
      { title: 'Career Outcomes', duration: '10s', type: 'data', description: 'Job roles, salary range, employer partnerships' },
      { title: 'How to Apply', duration: '5s', type: 'cta', description: 'Application steps through ALO Education' },
    ],
  },
  {
    id: 'scholarship-announcement',
    name: 'Scholarship Announcement',
    description: 'Attractive scholarship details with eligibility and deadlines',
    icon: DollarSign,
    category: 'Financial',
    duration: '30s',
    scenes: [
      { title: 'Scholarship Reveal', duration: '6s', type: 'intro', description: 'Scholarship name, amount, and sponsor with animation' },
      { title: 'Eligibility Criteria', duration: '10s', type: 'content', description: 'Academic, nationality, and program requirements' },
      { title: 'Application Process', duration: '8s', type: 'process', description: 'Steps to apply, required documents' },
      { title: 'Deadline & Apply CTA', duration: '6s', type: 'cta', description: 'Countdown, apply link, ALO Education assistance' },
    ],
  },
  {
    id: 'visa-guide',
    name: 'Visa Guide',
    description: 'Step-by-step visa application process with tips',
    icon: Globe,
    category: 'Process',
    duration: '60s',
    scenes: [
      { title: 'Country & Visa Type', duration: '6s', type: 'intro', description: 'Destination country, visa category, and overview' },
      { title: 'Required Documents', duration: '10s', type: 'data', description: 'Checklist of all required documents' },
      { title: 'Step-by-Step Process', duration: '20s', type: 'process', description: 'Application steps with timeline' },
      { title: 'Tips & CTA', duration: '8s', type: 'cta', description: 'Common mistakes to avoid, ALO visa assistance' },
    ],
  },
  {
    id: 'event-promotion',
    name: 'Event Promotion',
    description: 'Webinar, fair, or open day promotion with registration CTA',
    icon: Calendar,
    category: 'Marketing',
    duration: '30s',
    scenes: [
      { title: 'Event Headline', duration: '5s', type: 'intro', description: 'Event name, date, and venue with branded visuals' },
      { title: 'What to Expect', duration: '10s', type: 'content', description: 'Agenda, speakers, activities' },
      { title: 'Who Should Attend', duration: '5s', type: 'data', description: 'Target audience and benefits' },
      { title: 'Register CTA', duration: '5s', type: 'cta', description: 'Registration link, limited seats, free entry' },
    ],
  },
];

const MOCK_ANALYTICS: VideoAnalyticsData = {
  totalViews: 45820,
  totalEngagement: 3847,
  avgCompletionRate: 72,
  totalLikes: 2150,
  totalShares: 890,
  platformStats: [
    { platform: 'YouTube', views: 22100, engagement: 1890, followers: 5200, icon: Youtube, color: '#FF0000' },
    { platform: 'Facebook', views: 12400, engagement: 1050, followers: 3800, icon: Facebook, color: '#1877F2' },
    { platform: 'Instagram', views: 8200, engagement: 720, followers: 6400, icon: Instagram, color: '#E4405F' },
    { platform: 'Website', views: 3120, engagement: 187, followers: 0, icon: GlobeIcon, color: '#0052B8' },
  ],
  topVideos: [
    { id: 'tv1', title: 'UK Top Universities 2025 Guide', views: 12400, engagement: 980, completionRate: 78, platform: 'YouTube', thumbnail: '/vid/uk.jpg' },
    { id: 'tv2', title: 'Australia Visa Changes Explained', views: 8900, engagement: 720, completionRate: 82, platform: 'YouTube', thumbnail: '/vid/aus.jpg' },
    { id: 'tv3', title: 'Scholarships for Bangladeshi Students', views: 6200, engagement: 540, completionRate: 71, platform: 'Facebook', thumbnail: '/vid/sch.jpg' },
    { id: 'tv4', title: 'Campus Tour - University of Melbourne', views: 5100, engagement: 380, completionRate: 85, platform: 'Instagram', thumbnail: '/vid/mel.jpg' },
    { id: 'tv5', title: 'How to Write a Winning SOP', views: 4300, engagement: 310, completionRate: 68, platform: 'YouTube', thumbnail: '/vid/sop.jpg' },
  ],
  abTests: [
    { id: 'ab1', name: 'UK Uni Promo - Title', variantA: 'Top 10 UK Universities', variantB: 'Best UK Universities for 2025', viewsA: 1200, viewsB: 1350, conversionA: 4.2, conversionB: 5.1, status: 'completed', winner: 'B' },
    { id: 'ab2', name: 'Visa Guide - Thumbnail', variantA: 'Document-style cover', variantB: 'Person with passport', viewsA: 800, viewsB: 850, conversionA: 3.8, conversionB: 3.5, status: 'completed', winner: 'A' },
    { id: 'ab3', name: 'Scholarship - CTA', variantA: 'Apply Now', variantB: 'Check Eligibility', viewsA: 600, viewsB: 620, conversionA: 6.1, conversionB: 0, status: 'running' },
  ],
};

const MOCK_PROJECTS: VideoProject[] = [
  {
    id: 'v1', title: 'UK Top Universities 2025', topic: 'Study in UK', status: 'published',
    aspectRatio: '16:9', script: 'Discover the top UK universities...', voiceoverUrl: '/audio/uk-promo.mp3',
    subtitles: [{ id: 's1', text: 'Discover the top UK universities', startTime: 0, endTime: 3 }],
    musicTrack: 'inspiring-uplift', thumbnailUrl: null, createdAt: '2025-01-15', updatedAt: '2025-01-20', duration: 60,
  },
  {
    id: 'v2', title: 'Australia Visa Changes', topic: 'Visa Guide', status: 'editing',
    aspectRatio: '9:16', script: 'Major changes to Australia student visa...', voiceoverUrl: '/audio/aus-visa.mp3',
    subtitles: [], musicTrack: 'ambient-calm', thumbnailUrl: null, createdAt: '2025-01-18', updatedAt: '2025-01-19', duration: 45,
  },
  {
    id: 'v3', title: 'How to Write a Winning SOP', topic: 'Application Tips', status: 'voiceover',
    aspectRatio: '16:9', script: 'Your Statement of Purpose is the most important...', voiceoverUrl: null,
    subtitles: [], musicTrack: null, thumbnailUrl: null, createdAt: '2025-01-20', updatedAt: '2025-01-20', duration: 90,
  },
  {
    id: 'v4', title: 'Scholarships for Bangladeshi Students', topic: 'Scholarships', status: 'script',
    aspectRatio: '1:1', script: 'Great scholarship opportunities await...', voiceoverUrl: null,
    subtitles: [], musicTrack: null, thumbnailUrl: null, createdAt: '2025-01-21', updatedAt: '2025-01-21', duration: 30,
  },
];

// ============================================================
// Sub-Components
// ============================================================

function StatusBadge({ status }: { status: VideoStatus }) {
  const colors: Record<VideoStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    script: 'bg-amber-100 text-amber-700',
    voiceover: 'bg-orange-100 text-orange-700',
    footage: 'bg-sky-100 text-sky-700',
    editing: 'bg-purple-100 text-purple-700',
    published: 'bg-emerald-100 text-emerald-700',
    generating: 'bg-blue-100 text-blue-700',
  };
  return <Badge className={`${colors[status]} border-0 capitalize`}>{status}</Badge>;
}

function AspectRatioIcon({ ratio }: { ratio: AspectRatio }) {
  const icons: Record<AspectRatio, React.ElementType> = { '16:9': Monitor, '9:16': Smartphone, '1:1': Square };
  const Icon = icons[ratio];
  return <Icon className="h-4 w-4 text-gray-500" />;
}

function FormatTime({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return <span>{m}:{s.toString().padStart(2, '0')}</span>;
}

// ============================================================
// AI Video Generator Tab
// ============================================================
function AIVideoGeneratorTab() {
  const [script, setScript] = useState('');
  const [videoStyle, setVideoStyle] = useState('educational');
  const [duration, setDuration] = useState('30');
  const [language, setLanguage] = useState('en');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [usePresenter, setUsePresenter] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('ava1');
  const [musicTrack, setMusicTrack] = useState('inspiring-uplift');
  const [autoSubtitles, setAutoSubtitles] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');

  const generateSteps = [
    'Analyzing script & generating storyboard...',
    'Matching stock footage to scenes...',
    'Generating AI voiceover...',
    usePresenter ? 'Creating AI presenter animation...' : 'Composing video scenes...',
    'Adding background music...',
    autoSubtitles ? 'Generating auto-captions...' : 'Finalizing render...',
    'Encoding final video...',
  ];

  const handleGenerate = useCallback(() => {
    if (!script.trim()) return;
    setIsGenerating(true);
    setGenerationProgress(0);
    let step = 0;
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        const next = prev + Math.random() * 4 + 1;
        if (next >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setGenerationStep('Video generated successfully!');
          return 100;
        }
        const newStep = Math.floor((next / 100) * generateSteps.length);
        if (newStep !== step) {
          step = newStep;
          setGenerationStep(generateSteps[Math.min(newStep, generateSteps.length - 1)]);
        }
        return next;
      });
    }, 200);
  }, [script, usePresenter, autoSubtitles, generateSteps.length]);

  const selectedStyle = VIDEO_STYLES.find(s => s.id === videoStyle);

  return (
    <div className="space-y-6">
      {/* Script Input Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-[#E8501A]" />
            AI Video Generator
            <Badge variant="outline" className="ml-2 text-xs font-normal">Powered by MoneyPrinterTurbo + HeyGen</Badge>
          </CardTitle>
          <p className="text-sm text-gray-500">Transform your script into a professional video with AI voiceover, footage, and captions</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Video Script / Topic</Label>
            <Textarea
              placeholder="Enter your video script or topic here...&#10;&#10;Example: Study in the UK - Discover top universities, affordable tuition, and post-study work opportunities. This guide covers everything from applications to visas."
              className="min-h-[140px] text-sm"
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-400">{script.length} characters</span>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setScript('Welcome to [University Name], where academic excellence meets vibrant campus life.\n\nOur world-class faculty and cutting-edge facilities provide the perfect environment for your academic journey.\n\nWith programs ranked among the top globally, [University Name] opens doors to limitless career opportunities.\n\nApply now through ALO Education and take the first step toward your future.')}>
                <Wand2 className="h-3 w-3 mr-1" /> Load sample script
              </Button>
            </div>
          </div>

          {/* Video Style Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Video Style</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {VIDEO_STYLES.map(style => {
                const Icon = style.icon;
                const isSelected = videoStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setVideoStyle(style.id)}
                    className={`p-3 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                      isSelected ? 'border-[#0052B8] bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${isSelected ? 'text-[#0052B8]' : 'text-gray-500'}`} />
                    <div className={`text-xs font-medium ${isSelected ? 'text-[#0052B8]' : 'text-gray-700'}`}>{style.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.flag} {l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">🖥️ 16:9 Landscape</SelectItem>
                  <SelectItem value="9:16">📱 9:16 Portrait</SelectItem>
                  <SelectItem value="1:1">⬜ 1:1 Square</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Background Music</Label>
              <Select value={musicTrack} onValueChange={setMusicTrack}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MUSIC_TRACKS.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.genre})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Presenter Toggle */}
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Bot className="h-5 w-5 text-[#0052B8]" />
                </div>
                <div>
                  <Label className="text-sm font-medium">AI Presenter (Talking Head)</Label>
                  <p className="text-xs text-gray-500">Add an AI avatar that narrates your script with lip-sync</p>
                </div>
              </div>
              <Switch checked={usePresenter} onCheckedChange={setUsePresenter} />
            </div>
            {usePresenter && (
              <div className="mt-3 pt-3 border-t border-blue-100">
                <Label className="text-xs font-medium mb-2 block">Select Avatar</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVATAR_OPTIONS.map(avatar => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`p-2 rounded-lg border text-left transition-all text-xs ${
                        selectedAvatar === avatar.id ? 'border-[#0052B8] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          avatar.style === 'professional' ? 'bg-[#0052B8]' : avatar.style === 'casual' ? 'bg-[#E8501A]' : 'bg-purple-500'
                        }`}>
                          {avatar.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{avatar.name}</div>
                          <div className="text-gray-400 capitalize">{avatar.style}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Auto Subtitles Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Subtitles className="h-4 w-4 text-gray-600" />
              <Label className="text-sm">Auto-generate subtitles</Label>
            </div>
            <Switch checked={autoSubtitles} onCheckedChange={setAutoSubtitles} />
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-[#0052B8] border-t-transparent rounded-full" />
                <span className="text-sm font-medium text-[#0052B8]">{generationStep}</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
              <span className="text-xs text-gray-500">{Math.round(generationProgress)}% complete</span>
            </div>
          )}

          {!isGenerating && generationProgress >= 100 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">Video generated successfully!</span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" /> Preview</Button>
                <Button size="sm" className="bg-[#0052B8] hover:bg-[#003d8f]"><Download className="h-3 w-3 mr-1" /> Download</Button>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 bg-[#E8501A] hover:bg-[#c74415] text-white font-semibold"
              disabled={!script.trim() || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" /> Generating...</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" /> Generate Video</>
              )}
            </Button>
            <Button size="lg" variant="outline" disabled={!script.trim() || isGenerating}>
              <Save className="h-4 w-4 mr-2" /> Save Draft
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Clapperboard, title: 'Script-to-Video', desc: 'MoneyPrinterTurbo: AI script, footage matching, voiceover, subtitles & music', color: 'text-[#E8501A]' },
          { icon: Bot, title: 'AI Talking Heads', desc: 'HeyGen + InfiniteTalk: Lip-synced avatars with natural expressions', color: 'text-[#0052B8]' },
          { icon: Layers, title: 'Programmatic Video', desc: 'Remotion: React-based video composition & data-driven scenes', color: 'text-purple-600' },
        ].map(item => (
          <Card key={item.title} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <item.icon className={`h-6 w-6 mb-2 ${item.color}`} />
              <div className="font-medium text-sm">{item.title}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Video Templates Tab
// ============================================================
function VideoTemplatesTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customizing, setCustomizing] = useState(false);

  const template = VIDEO_TEMPLATES.find(t => t.id === selectedTemplate);

  const sceneTypeColors: Record<string, string> = {
    intro: 'bg-blue-100 text-blue-700',
    content: 'bg-emerald-100 text-emerald-700',
    cta: 'bg-orange-100 text-orange-700',
    data: 'bg-purple-100 text-purple-700',
    testimonial: 'bg-pink-100 text-pink-700',
    process: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutTemplate className="h-5 w-5 text-[#0052B8]" />
            Video Templates
            <Badge variant="outline" className="ml-2 text-xs font-normal">{VIDEO_TEMPLATES.length} templates</Badge>
          </CardTitle>
          <p className="text-sm text-gray-500">Pre-built video templates for education content — customize and generate in minutes</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VIDEO_TEMPLATES.map(tmpl => {
              const Icon = tmpl.icon;
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg group ${
                    isSelected ? 'border-[#0052B8] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#0052B8]' : 'bg-gray-100 group-hover:bg-gray-200'} transition-colors`}>
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex items-center gap-1">
                      {tmpl.popular && <Badge className="bg-[#E8501A] text-white border-0 text-[10px] px-1.5">Popular</Badge>}
                      <Badge variant="outline" className="text-[10px]">{tmpl.category}</Badge>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{tmpl.name}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tmpl.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Timer className="h-3 w-3" /> {tmpl.duration}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Film className="h-3 w-3" /> {tmpl.scenes.length} scenes
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Template Detail / Scene Editor */}
      {template && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <template.icon className="h-5 w-5 text-[#0052B8]" />
                {template.name} — Scene Breakdown
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(null)}>
                  <ArrowLeft className="h-3 w-3 mr-1" /> Back
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scene Timeline */}
            <div className="space-y-2">
              {template.scenes.map((scene, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0052B8] text-white flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{scene.title}</span>
                      <Badge className={`${sceneTypeColors[scene.type]} border-0 text-[10px]`}>{scene.type}</Badge>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {scene.duration}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{scene.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Template Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">University / Institution</Label>
                <Input placeholder="e.g., University of Oxford" className="text-sm" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Country</Label>
                <Select defaultValue="uk">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="au">🇦🇺 Australia</SelectItem>
                    <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                    <SelectItem value="us">🇺🇸 United States</SelectItem>
                    <SelectItem value="de">🇩🇪 Germany</SelectItem>
                    <SelectItem value="nz">🇳🇿 New Zealand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.flag} {l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Aspect Ratio</Label>
                <Select defaultValue="16:9">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 Landscape</SelectItem>
                    <SelectItem value="9:16">9:16 Portrait</SelectItem>
                    <SelectItem value="1:1">1:1 Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate from Template */}
            <div className="flex gap-3 pt-2">
              <Button size="lg" className="flex-1 bg-[#E8501A] hover:bg-[#c74415] text-white font-semibold">
                <Sparkles className="h-4 w-4 mr-2" /> Generate from Template
              </Button>
              <Button size="lg" variant="outline">
                <Edit3 className="h-4 w-4 mr-2" /> Edit Scenes
              </Button>
              <Button size="lg" variant="outline">
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Caption Generator Tab
// ============================================================
function CaptionGeneratorTab() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [captionsGenerated, setCaptionsGenerated] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState('en');
  const [targetTranslateLang, setTargetTranslateLang] = useState('bn');
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const mockCaptions: SubtitleLine[] = [
    { id: 'c1', text: 'Discover the top UK universities for international students', startTime: 0, endTime: 4 },
    { id: 'c2', text: 'The University of Oxford ranks number one globally', startTime: 4, endTime: 8 },
    { id: 'c3', text: 'With tuition fees starting from £15,000 per year', startTime: 8, endTime: 12 },
    { id: 'c4', text: 'And generous scholarships available for Bangladeshi students', startTime: 12, endTime: 16 },
    { id: 'c5', text: 'The student visa process is straightforward', startTime: 16, endTime: 20 },
    { id: 'c6', text: 'Apply now through ALO Education to start your journey', startTime: 20, endTime: 25 },
  ];

  const [captions, setCaptions] = useState<SubtitleLine[]>([]);

  const handleProcess = useCallback(() => {
    if (!videoUrl.trim()) return;
    setIsProcessing(true);
    setProcessingProgress(0);
    const steps = ['Downloading video...', 'Extracting audio track...', 'Transcribing with AI...', 'Aligning timestamps...', 'Generating captions...'];
    let stepIdx = 0;
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const next = prev + Math.random() * 5 + 2;
        if (next >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setCaptionsGenerated(true);
          setCaptions(mockCaptions);
          return 100;
        }
        const newStep = Math.floor((next / 100) * steps.length);
        if (newStep !== stepIdx) {
          stepIdx = newStep;
          setProcessingStep(steps[Math.min(newStep, steps.length - 1)]);
        }
        return next;
      });
    }, 200);
  }, [videoUrl]);

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleSaveCaption = (id: string) => {
    setCaptions(prev => prev.map(c => c.id === id ? { ...c, text: editText } : c));
    setEditingCaption(null);
  };

  return (
    <div className="space-y-6">
      {/* Video Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Subtitles className="h-5 w-5 text-[#0052B8]" />
            Auto Caption Generator
            <Badge variant="outline" className="ml-2 text-xs font-normal">VideoCaptioner + VoiceStudio</Badge>
          </CardTitle>
          <p className="text-sm text-gray-500">Upload a video or paste a URL to auto-generate accurate captions with AI</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Video URL or Upload</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste YouTube, Vimeo, or direct video URL..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button variant="outline" className="flex-shrink-0">
                <Upload className="h-4 w-4 mr-2" /> Upload File
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Source Language</Label>
              <Select value={captionLanguage} onValueChange={setCaptionLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.flag} {l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Translate To</Label>
              <Select value={targetTranslateLang} onValueChange={setTargetTranslateLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.filter(l => l.value !== captionLanguage).map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-[#0052B8] border-t-transparent rounded-full" />
                <span className="text-sm font-medium text-[#0052B8]">{processingStep}</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>
          )}

          <Button
            size="lg"
            className="w-full bg-[#0052B8] hover:bg-[#003d8f] text-white font-semibold"
            disabled={!videoUrl.trim() || isProcessing}
            onClick={handleProcess}
          >
            {isProcessing ? (
              <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" /> Processing...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Captions</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Caption Editor */}
      {captionsGenerated && captions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Edit3 className="h-5 w-5 text-[#0052B8]" />
                Caption Editor
                <Badge variant="outline" className="text-xs">{captions.length} captions</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> Export SRT</Button>
                <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> Export VTT</Button>
                <Button size="sm" variant="outline"><Languages className="h-3 w-3 mr-1" /> Translate</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Video Preview Placeholder */}
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4">
              <div className="text-center text-white">
                <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-50">Video Preview with Captions</p>
                <div className="mt-4 bg-black/80 px-4 py-2 rounded inline-block">
                  <p className="text-sm">{captions[0]?.text}</p>
                </div>
              </div>
            </div>

            {/* Caption Timeline */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {captions.map((caption, idx) => (
                <div key={caption.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                  <div className="flex-shrink-0 text-xs text-gray-400 font-mono w-20">
                    {formatTimestamp(caption.startTime)}
                  </div>
                  <div className="w-px h-6 bg-gray-300 flex-shrink-0" />
                  {editingCaption === caption.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-sm h-7"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={() => handleSaveCaption(caption.id)}>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCaption(null)}>
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="text-sm truncate">{caption.text}</span>
                      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingCaption(caption.id); setEditText(caption.text); }}>
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex-shrink-0 text-xs text-gray-400 font-mono w-16 text-right">
                    {formatTimestamp(caption.endTime)}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Caption Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label className="text-xs font-medium">Bold text</Label>
                <Switch defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label className="text-xs font-medium">Uppercase</Label>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label className="text-xs font-medium">Word-level timing</Label>
                <Switch defaultChecked={false} />
              </div>
            </div>

            {/* Multi-language Translation */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="h-4 w-4 text-[#0052B8]" />
                <Label className="text-sm font-medium">Multi-Language Translation</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LANGUAGES.map(lang => (
                  <Button key={lang.value} variant="outline" size="sm" className="text-xs justify-start">
                    <span className="mr-1">{lang.flag}</span> {lang.label}
                    {lang.value === captionLanguage && <Badge className="ml-1 bg-[#0052B8] text-white border-0 text-[9px] px-1">Source</Badge>}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Video Analytics Tab
// ============================================================
function VideoAnalyticsTab() {
  const [timeRange, setTimeRange] = useState('30d');
  const data = MOCK_ANALYTICS;

  return (
    <div className="space-y-6">
      {/* Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Views', value: data.totalViews.toLocaleString(), icon: Eye, color: 'text-[#0052B8]', bg: 'bg-blue-50' },
          { label: 'Engagement', value: data.totalEngagement.toLocaleString(), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Completion Rate', value: `${data.avgCompletionRate}%`, icon: Play, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Likes', value: data.totalLikes.toLocaleString(), icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Shares', value: data.totalShares.toLocaleString(), icon: Share2, color: 'text-pink-600', bg: 'bg-pink-50' },
        ].map(kpi => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${kpi.bg} mb-2`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="text-xs text-gray-500">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-[#0052B8]" />
              Platform Distribution
            </CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.platformStats.map(platform => {
              const Icon = platform.icon;
              const maxViews = Math.max(...data.platformStats.map(p => p.views));
              const barWidth = (platform.views / maxViews) * 100;
              return (
                <div key={platform.platform} className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-5 w-5" style={{ color: platform.color }} />
                    <span className="font-medium text-sm">{platform.platform}</span>
                    {platform.followers > 0 && (
                      <span className="text-xs text-gray-400 ml-auto">{platform.followers.toLocaleString()} followers</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Views</span>
                        <span className="font-medium">{platform.views.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: platform.color }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Engagement</span>
                      <span className="font-medium">{platform.engagement.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Eng. Rate</span>
                      <span className="font-medium">{((platform.engagement / platform.views) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Videos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-[#E8501A]" />
            Top Performing Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topVideos.map((video, idx) => (
              <div key={video.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-200 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{video.title}</span>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">{video.platform}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {video.views.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {video.engagement.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Play className="h-3 w-3" /> {video.completionRate}% complete</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0052B8] rounded-full" style={{ width: `${video.completionRate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* A/B Tests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-[#0052B8]" />
            A/B Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.abTests.map(test => (
              <div key={test.id} className="p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-medium text-sm">{test.name}</span>
                    <Badge className={`ml-2 border-0 text-[10px] ${test.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {test.status}
                    </Badge>
                  </div>
                  {test.winner && (
                    <Badge className="bg-[#0052B8] text-white border-0 text-xs">
                      Winner: Variant {test.winner}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Variant A */}
                  <div className={`p-3 rounded-lg ${test.winner === 'A' ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#0052B8] text-white text-xs flex items-center justify-center font-bold">A</div>
                      <span className="text-xs font-medium">{test.variantA}</span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between"><span>Views:</span><span className="font-medium">{test.viewsA.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Conversion:</span><span className="font-medium">{test.conversionA}%</span></div>
                    </div>
                  </div>
                  {/* Variant B */}
                  <div className={`p-3 rounded-lg ${test.winner === 'B' ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#E8501A] text-white text-xs flex items-center justify-center font-bold">B</div>
                      <span className="text-xs font-medium">{test.variantB}</span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between"><span>Views:</span><span className="font-medium">{test.viewsB.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Conversion:</span><span className="font-medium">{test.conversionB > 0 ? `${test.conversionB}%` : '—'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Projects Tab (original, enhanced)
// ============================================================
function ProjectsTab({ projects }: { projects: VideoProject[] }) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Projects', value: projects.length, icon: Film, color: 'text-[#0052B8]', bg: 'bg-blue-50' },
          { label: 'Published', value: projects.filter(p => p.status === 'published').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'In Progress', value: projects.filter(p => !['published', 'draft'].includes(p.status)).length, icon: Edit3, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Drafts', value: projects.filter(p => p.status === 'draft').length, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}><stat.icon className={`h-4 w-4 ${stat.color}`} /></div>
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Projects</CardTitle>
            <Button size="sm" className="bg-[#0052B8] hover:bg-[#003d8f]">
              <Plus className="h-4 w-4 mr-1" /> New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.map(project => (
              <div key={project.id} className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all group">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-24 h-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {project.thumbnailUrl ? (
                      <Image className="h-6 w-6 text-gray-400" />
                    ) : (
                      <Video className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{project.title}</h3>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{project.topic}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><AspectRatioIcon ratio={project.aspectRatio} /> {project.aspectRatio}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> <FormatTime seconds={project.duration} /></span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {project.createdAt}</span>
                      {project.musicTrack && <span className="flex items-center gap-1"><Music className="h-3 w-3" /> Music</span>}
                      {project.voiceoverUrl && <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Voiceover</span>}
                      {project.subtitles.length > 0 && <span className="flex items-center gap-1"><Subtitles className="h-3 w-3" /> {project.subtitles.length} subs</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm"><Edit3 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm"><Copy className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm"><Share2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm"><Trash2 className="h-3 w-3 text-red-500" /></Button>
                  </div>
                </div>

                {/* Status Pipeline */}
                <div className="mt-3 flex items-center gap-1">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = STATUS_STEPS.findIndex(s => s.key === project.status);
                    const isComplete = idx <= currentIdx && currentIdx !== -1;
                    const isCurrent = step.key === project.status;
                    const StepIcon = step.icon;
                    return (
                      <React.Fragment key={step.key}>
                        {idx > 0 && <div className={`flex-1 h-0.5 ${isComplete ? 'bg-[#0052B8]' : 'bg-gray-200'}`} />}
                        <div className={`flex items-center gap-1 text-[10px] ${isComplete ? 'text-[#0052B8]' : 'text-gray-400'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isCurrent ? 'bg-[#0052B8] text-white' : isComplete ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <StepIcon className="h-2.5 w-2.5" />
                          </div>
                          <span className="hidden sm:inline">{step.label}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Main Export
// ============================================================
interface VideoStudioPageProps {
  onBack: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export function VideoStudioPage({ onBack, onNavigate }: VideoStudioPageProps) {
  const [activeTab, setActiveTab] = useState('generator');

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#0052B8] rounded-lg">
                  <Video className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-base">Video Studio</h1>
                  <p className="text-[10px] text-gray-500 -mt-0.5">AI-Powered Video Creation & Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] hidden sm:flex">
                <Sparkles className="h-3 w-3 mr-1 text-[#E8501A]" /> AI Enhanced
              </Badge>
              <Button size="sm" variant="outline">
                <Settings className="h-3 w-3 mr-1" /> Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white shadow-sm h-auto p-1">
            <TabsTrigger value="generator" className="py-2.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white text-xs sm:text-sm">
              <Zap className="h-4 w-4 mr-1 hidden sm:inline" /> AI Generator
            </TabsTrigger>
            <TabsTrigger value="templates" className="py-2.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white text-xs sm:text-sm">
              <LayoutTemplate className="h-4 w-4 mr-1 hidden sm:inline" /> Templates
            </TabsTrigger>
            <TabsTrigger value="captions" className="py-2.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white text-xs sm:text-sm">
              <Subtitles className="h-4 w-4 mr-1 hidden sm:inline" /> Captions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="py-2.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 mr-1 hidden sm:inline" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="projects" className="py-2.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white text-xs sm:text-sm">
              <Film className="h-4 w-4 mr-1 hidden sm:inline" /> Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <AIVideoGeneratorTab />
          </TabsContent>
          <TabsContent value="templates">
            <VideoTemplatesTab />
          </TabsContent>
          <TabsContent value="captions">
            <CaptionGeneratorTab />
          </TabsContent>
          <TabsContent value="analytics">
            <VideoAnalyticsTab />
          </TabsContent>
          <TabsContent value="projects">
            <ProjectsTab projects={MOCK_PROJECTS} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default VideoStudioPage;
