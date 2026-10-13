'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  CheckCircle,
  FileText,
  PenTool,
  Video,
  Shield,
  Check,
  GraduationCap,
  Languages,
  Briefcase,
  Mic,
  XCircle,
  ArrowRight,
  Phone,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FadeUp({ children, index = 0, className = '' }: { children: React.ReactNode; index?: number; className?: string }) {
  return (
    <motion.div variants={fadeUp} custom={index} className={className}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Tool Cards Data                                              */
/* ------------------------------------------------------------------ */

const HERO_TOOLS = [
  { icon: Search, name: 'Course Finder', oneLiner: 'AI-matched courses' },
  { icon: CheckCircle, name: 'Eligibility Checker', oneLiner: 'Check your eligibility' },
  { icon: FileText, name: 'CV Builder', oneLiner: 'Professional CV in minutes' },
  { icon: PenTool, name: 'SOP Assistant', oneLiner: 'AI-powered statements' },
  { icon: Video, name: 'Interview Practice', oneLiner: 'Practice with AI' },
  { icon: Shield, name: 'Visa Interview', oneLiner: 'Visa prep assistance' },
];

/* ------------------------------------------------------------------ */
/*  SECTION 01 — HERO                                                 */
/* ------------------------------------------------------------------ */

function HeroSection({ onBack }: { onBack: () => void }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#004C99] via-[#0066CC] to-[#0052A3] py-16 sm:py-24 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-[#FFB347] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-0 left-4 sm:left-6 lg:left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0066CC] rounded-md -translate-y-8"
          aria-label="Back to Home"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        {/* Content */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <FadeUp>
            <Badge className="mb-6 bg-white/15 text-white border-white/20 hover:bg-white/20 text-sm px-4 py-1.5">
              🤖 AI-POWERED TOOLS
            </Badge>
          </FadeUp>
          <FadeUp index={1}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.4rem] font-bold text-white leading-tight tracking-tight">
              AI Tools to Supercharge Your{' '}
              <span className="text-[#FFB347]">Study Abroad Journey</span>
            </h1>
          </FadeUp>
          <FadeUp index={2}>
            <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
              From course matching to interview practice — our AI tools handle the heavy lifting so you can focus on what matters.
            </p>
          </FadeUp>
        </div>

        {/* Horizontal scrollable tool cards */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:justify-center lg:flex-wrap lg:overflow-visible">
          {HERO_TOOLS.map((tool, i) => (
            <FadeUp key={tool.name} index={i + 3}>
              <div className="snap-start shrink-0 w-[160px] sm:w-[180px] lg:w-auto lg:flex-1 lg:max-w-[200px] bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors cursor-default">
                <tool.icon className="h-6 w-6 text-[#FFB347] mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">{tool.name}</h3>
                <p className="text-xs text-white/60 leading-snug">{tool.oneLiner}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 02 — AI COURSE FINDER                                     */
/* ------------------------------------------------------------------ */

function CourseFinderSection({ onBack }: { onBack: () => void }) {
  const features = [
    'Personalized matching based on your profile',
    'Compare courses side by side',
    'Scholarship eligibility detection',
    'Career outcome predictions',
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            <FadeUp>
              <Badge className="mb-4 bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 hover:bg-[#0066CC]/15 text-xs font-semibold px-3 py-1">
                AI COURSE FINDER
              </Badge>
            </FadeUp>
            <FadeUp index={1}>
              <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-slate-900 leading-tight">
                Find Your Perfect Course in{' '}
                <span className="text-[#F37021]">3 Minutes</span>
              </h2>
            </FadeUp>
            <FadeUp index={2}>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Our AI analyzes your academic profile, English scores, budget, and career goals to match you with the best courses across 500+ universities in 14 countries.
              </p>
            </FadeUp>
            <FadeUp index={3}>
              <ul className="mt-6 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#F37021] shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>
            </FadeUp>
            <FadeUp index={4}>
              <Button
                className="mt-8 gap-2 font-semibold text-sm bg-[#F37021] text-white hover:bg-[#e06818] active:bg-[#c85a15] shadow-sm shadow-orange-200/50 rounded-lg"
                onClick={onBack}
              >
                Try Course Finder
                <ArrowRight className="h-4 w-4" />
              </Button>
            </FadeUp>
          </div>

          {/* Right mockup */}
          <FadeUp index={2}>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-slate-400 font-medium">AI Course Finder</span>
              </div>

              {/* Mock form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Study Level</label>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">Masters</span>
                    <span className="text-xs text-[#0066CC] font-semibold bg-[#0066CC]/10 px-2 py-0.5 rounded">Selected</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Subject</label>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">Computer Science</span>
                    <span className="text-xs text-[#0066CC] font-semibold bg-[#0066CC]/10 px-2 py-0.5 rounded">Selected</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Destination</label>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">🇬🇧 United Kingdom</span>
                    <span className="text-xs text-[#0066CC] font-semibold bg-[#0066CC]/10 px-2 py-0.5 rounded">Selected</span>
                  </div>
                </div>
              </div>

              {/* Match result */}
              <div className="mt-6 bg-gradient-to-r from-[#0066CC]/10 to-[#0066CC]/5 border border-[#0066CC]/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#0066CC] uppercase tracking-wider">Top Match</span>
                  <span className="text-lg font-bold text-[#0066CC]">94%</span>
                </div>
                <div className="w-full bg-[#0066CC]/20 rounded-full h-2 mb-3">
                  <div className="bg-[#0066CC] rounded-full h-2" style={{ width: '94%' }} />
                </div>
                <p className="text-sm font-medium text-slate-700">MSc Data Science</p>
                <p className="text-xs text-slate-500 mt-0.5">University of Birmingham</p>
              </div>
            </div>
          </FadeUp>
        </SectionReveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 03 — ELIGIBILITY CHECKER                                  */
/* ------------------------------------------------------------------ */

function EligibilitySection() {
  const requirements = [
    { icon: GraduationCap, label: 'Academic', desc: 'Bachelor degree with 2:1 or higher' },
    { icon: Languages, label: 'English', desc: 'IELTS 6.0-7.0 depending on course' },
    { icon: Briefcase, label: 'Experience', desc: 'Some courses require work experience' },
    { icon: FileText, label: 'Documents', desc: 'Transcripts, references, personal statement' },
  ];

  const checks = [
    { label: 'Academic Qualification', met: true },
    { label: 'English Proficiency', met: false },
    { label: 'Work Experience', met: true },
    { label: 'Statement of Purpose', met: true },
    { label: 'Reference Letters', met: true },
  ];

  return (
    <section className="bg-[#F8FAFC] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            <FadeUp>
              <Badge className="mb-4 bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 hover:bg-[#0066CC]/15 text-xs font-semibold px-3 py-1">
                ELIGIBILITY CHECKER
              </Badge>
            </FadeUp>
            <FadeUp index={1}>
              <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-slate-900 leading-tight">
                Check Your Eligibility in{' '}
                <span className="text-[#F37021]">Seconds</span>
              </h2>
            </FadeUp>
            <FadeUp index={2}>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Enter your academic qualifications and English test scores. Our AI instantly checks your eligibility for 500+ courses and tells you exactly what you need.
              </p>
            </FadeUp>
            <FadeUp index={3}>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {requirements.map((r) => (
                  <div key={r.label} className="bg-white border border-slate-200 rounded-xl p-4">
                    <r.icon className="h-5 w-5 text-[#0066CC] mb-2" />
                    <h4 className="text-sm font-semibold text-slate-800">{r.label}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">{r.desc}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
            <FadeUp index={4}>
              <Button className="mt-8 gap-2 font-semibold text-sm bg-[#F37021] text-white hover:bg-[#e06818] active:bg-[#c85a15] shadow-sm shadow-orange-200/50 rounded-lg">
                Check My Eligibility
                <ArrowRight className="h-4 w-4" />
              </Button>
            </FadeUp>
          </div>

          {/* Right — check result visual */}
          <FadeUp index={2}>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-3">
                  <CheckCircle className="h-9 w-9 text-green-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">You meet 4 of 5 requirements</h3>
                <p className="text-sm text-slate-500 mt-1">for MSc Data Science, University of Birmingham</p>
              </div>

              <div className="space-y-3">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3">
                    {c.met ? (
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-[#F37021] shrink-0" />
                    )}
                    <span className="text-sm text-slate-700 font-medium">{c.label}</span>
                    {c.met ? (
                      <span className="ml-auto text-xs text-green-600 font-semibold">Met</span>
                    ) : (
                      <span className="ml-auto text-xs text-[#F37021] font-semibold">Needs attention</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-[#F37021]/10 border border-[#F37021]/20 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="font-semibold text-[#F37021]">1 requirement needs attention:</span>{' '}
                  IELTS score (you have 5.5, need 6.0)
                </p>
              </div>
            </div>
          </FadeUp>
        </SectionReveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 04 — AI CV BUILDER                                        */
/* ------------------------------------------------------------------ */

function CVBuilderSection() {
  const steps = [
    'Enter your education, experience, and skills',
    'AI generates a professional CV draft',
    'Review, edit, and customize',
    'Download in PDF or share directly with universities',
  ];

  const skills = ['Python', 'React', 'SQL', 'Machine Learning', 'Data Analysis', 'TensorFlow'];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            <FadeUp>
              <Badge className="mb-4 bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 hover:bg-[#0066CC]/15 text-xs font-semibold px-3 py-1">
                AI CV BUILDER
              </Badge>
            </FadeUp>
            <FadeUp index={1}>
              <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-slate-900 leading-tight">
                Build a Professional CV for Your{' '}
                <span className="text-[#F37021]">Application</span>
              </h2>
            </FadeUp>
            <FadeUp index={2}>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Our AI CV builder creates a tailored, ATS-optimized CV based on your profile and target course. Used by 5,000+ students.
              </p>
            </FadeUp>
            <FadeUp index={3}>
              <div className="mt-6 space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#0066CC] text-white text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="pt-1">
                      <span className="text-sm font-medium text-slate-700">{step}</span>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
            <FadeUp index={4}>
              <Button className="mt-8 gap-2 font-semibold text-sm bg-[#F37021] text-white hover:bg-[#e06818] active:bg-[#c85a15] shadow-sm shadow-orange-200/50 rounded-lg">
                Build My CV
                <ArrowRight className="h-4 w-4" />
              </Button>
            </FadeUp>
          </div>

          {/* Right — CV mockup */}
          <FadeUp index={2}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
              {/* CV Header */}
              <div className="bg-gradient-to-r from-[#0066CC] to-[#0052A3] px-6 py-5">
                <h3 className="text-lg font-bold text-white">Tahmid Rahman</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  <span className="text-xs text-white/80">tahmid@email.com</span>
                  <span className="text-xs text-white/80">+880 1XXX-XXXXXX</span>
                  <span className="text-xs text-white/80">Dhaka, Bangladesh</span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Education */}
                <div>
                  <h4 className="text-xs font-bold text-[#0066CC] uppercase tracking-wider mb-2">Education</h4>
                  <p className="text-sm font-semibold text-slate-800">BSc Computer Science</p>
                  <p className="text-xs text-slate-500 mt-0.5">University of Dhaka • CGPA 3.7/4.0 • 2019–2023</p>
                </div>

                {/* Experience */}
                <div>
                  <h4 className="text-xs font-bold text-[#0066CC] uppercase tracking-wider mb-2">Experience</h4>
                  <p className="text-sm font-semibold text-slate-800">Junior Developer</p>
                  <p className="text-xs text-slate-500 mt-0.5">TechCorp • 2023–Present</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Developed data pipelines using Python and SQL. Built internal tools with React that improved team efficiency by 30%.
                  </p>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-xs font-bold text-[#0066CC] uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="inline-block bg-[#0066CC]/10 text-[#0066CC] text-xs font-medium px-2.5 py-1 rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </SectionReveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 05 — AI SOP ASSISTANT                                     */
/* ------------------------------------------------------------------ */

function SOPAssistantSection() {
  const steps = [
    'Provide your academic history and goals',
    'AI generates your personalized SOP draft',
    'AI QA checks fact consistency and tone',
    'Human review and final approval',
  ];

  return (
    <section className="bg-[#F8FAFC] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            <FadeUp>
              <Badge className="mb-4 bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 hover:bg-[#0066CC]/15 text-xs font-semibold px-3 py-1">
                AI SOP ASSISTANT
              </Badge>
            </FadeUp>
            <FadeUp index={1}>
              <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-slate-900 leading-tight">
                Craft a Winning{' '}
                <span className="text-[#F37021]">Personal Statement</span>
              </h2>
            </FadeUp>
            <FadeUp index={2}>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Our AI writes a personalized Statement of Purpose based on your academic background, target course, university, and career goals.
              </p>
            </FadeUp>
            <FadeUp index={3}>
              <div className="mt-6 space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#F37021] text-white text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="pt-1">
                      <span className="text-sm font-medium text-slate-700">{step}</span>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
            <FadeUp index={4}>
              <Button className="mt-8 gap-2 font-semibold text-sm bg-[#F37021] text-white hover:bg-[#e06818] active:bg-[#c85a15] shadow-sm shadow-orange-200/50 rounded-lg">
                Write My SOP
                <ArrowRight className="h-4 w-4" />
              </Button>
            </FadeUp>
          </div>

          {/* Right — SOP mockup */}
          <FadeUp index={2}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
              {/* Document header bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-slate-400 font-medium">personal-statement.docx</span>
              </div>

              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Statement</h3>

                <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                  <p>
                    My passion for data science stems from my undergraduate studies in Computer Science at the University of Dhaka, where I graduated with a CGPA of 3.7. During my degree, I was particularly drawn to courses in machine learning and statistical analysis, which laid the foundation for my desire to pursue advanced studies in this rapidly evolving field.
                  </p>
                  <p>
                    Working as a Junior Developer at TechCorp has given me practical experience in building data pipelines and developing analytical tools using Python and SQL. This professional experience has reinforced my belief that data-driven decision making is transforming industries, and I wish to deepen my expertise through the MSc Data Science programme at the University of Birmingham.
                  </p>
                  <p>
                    The University of Birmingham's strong research focus in AI and data analytics, combined with its industry connections, makes it the ideal institution for my postgraduate studies. I am particularly excited about the opportunity to work with faculty members specialising in applied machine learning...
                  </p>
                </div>

                {/* Word count bar */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Word count</span>
                    <span className="text-xs font-semibold text-[#0066CC]">487 / 4,000</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-[#0066CC] rounded-full h-1.5" style={{ width: '12.2%' }} />
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </SectionReveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 06 — INTERVIEW PRACTICE                                   */
/* ------------------------------------------------------------------ */

function InterviewSection() {
  const types = [
    { icon: GraduationCap, title: 'University Interview', desc: 'Practice admission questions' },
    { icon: Shield, title: 'Visa Interview', desc: 'UK/USA/Canada visa prep' },
    { icon: Mic, title: 'English Speaking', desc: 'Improve your speaking confidence' },
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionReveal className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left content */}
          <div>
            <FadeUp>
              <Badge className="mb-4 bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 hover:bg-[#0066CC]/15 text-xs font-semibold px-3 py-1">
                AI INTERVIEW PRACTICE
              </Badge>
            </FadeUp>
            <FadeUp index={1}>
              <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-slate-900 leading-tight">
                Practice University & Visa Interviews{' '}
                <span className="text-[#F37021]">with AI</span>
              </h2>
            </FadeUp>
            <FadeUp index={2}>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Prepare for your university admission interview or visa interview with our AI interviewer. Get instant feedback on your answers.
              </p>
            </FadeUp>
            <FadeUp index={3}>
              <div className="mt-6 grid sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3">
                {types.map((t) => (
                  <div key={t.title} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#0066CC]/30 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#0066CC]/10 shrink-0">
                        <t.icon className="h-5 w-5 text-[#0066CC]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800">{t.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full text-xs font-semibold text-[#0066CC] border-[#0066CC]/30 hover:bg-[#0066CC]/10 hover:text-[#0066CC] rounded-lg"
                    >
                      Start Practice
                    </Button>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          {/* Right — interview mockup */}
          <FadeUp index={2}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
              {/* Interview header */}
              <div className="bg-gradient-to-r from-[#0066CC] to-[#0052A3] px-6 py-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Mic className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Interviewer</h3>
                  <p className="text-xs text-white/70">University Admission Prep</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Question bubble */}
                <div className="bg-slate-50 rounded-2xl rounded-tl-md p-4">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    &ldquo;Why did you choose MSc Data Science at the University of Birmingham? What specific aspects of the programme attracted you?&rdquo;
                  </p>
                </div>

                {/* Recording button */}
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="h-14 w-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 cursor-pointer hover:scale-105 transition-transform">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Click to start recording</span>
                </div>

                {/* Previous score */}
                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Previous answer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#0066CC]">7.5</span>
                    <span className="text-sm text-slate-400">/10</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </SectionReveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 07 — CTA                                                  */
/* ------------------------------------------------------------------ */

function CTASection({ onBack, onLeadOpen }: { onBack: () => void; onLeadOpen?: () => void }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#004C99] via-[#0066CC] to-[#0052A3] py-16 sm:py-20">
      <div className="absolute inset-0 opacity-[0.06]">
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-[#FFB347] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <SectionReveal>
          <FadeUp>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              Ready to Use AI to Find Your{' '}
              <span className="text-[#FFB347]">Perfect Course</span>?
            </h2>
          </FadeUp>
          <FadeUp index={1}>
            <p className="mt-4 text-sm sm:text-base text-white/80 leading-relaxed max-w-xl mx-auto">
              Start your journey today with our AI-powered tools. Get matched with courses, build your application, and prepare for interviews — all in one place.
            </p>
          </FadeUp>
          <FadeUp index={2}>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="gap-2 font-semibold text-sm bg-[#F37021] text-white hover:bg-[#e06818] active:bg-[#c85a15] shadow-lg shadow-orange-900/20 rounded-lg px-6 py-5 sm:py-3"
                onClick={onBack}
              >
                Start Course Finder
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="gap-2 font-semibold text-sm bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white rounded-lg px-6 py-5 sm:py-3"
                onClick={onLeadOpen}
              >
                <Phone className="h-4 w-4" />
                Talk to Expert
              </Button>
            </div>
          </FadeUp>
        </SectionReveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE EXPORT                                                  */
/* ------------------------------------------------------------------ */

export function AIToolsPage({ onBack, onLeadOpen }: { onBack: () => void; onLeadOpen?: () => void }) {
  return (
    <main>
      <HeroSection onBack={onBack} />
      <CourseFinderSection onBack={onBack} />
      <EligibilitySection />
      <CVBuilderSection />
      <SOPAssistantSection />
      <InterviewSection />
      <CTASection onBack={onBack} onLeadOpen={onLeadOpen} />
    </main>
  );
}
