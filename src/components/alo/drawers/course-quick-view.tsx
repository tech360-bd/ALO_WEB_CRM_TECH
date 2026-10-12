'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  X,
  MapPin,
  GraduationCap,
  DollarSign,
  Clock,
  Calendar,
  Languages,
  Award,
  FileText,
  Briefcase,
  CheckCircle,
  XCircle,
  Bookmark,
  GitCompareArrows,
  ArrowRight,
  Globe,
  Star,
  ChevronRight,
} from 'lucide-react';

// ─── TypeScript Interfaces ──────────────────────────────────────────────────

export interface CourseData {
  name: string;
  university: string;
  city: string;
  country: string;
  flag: string;
  degree: string;
  duration: string;
  tuition: string;
  tuitionPer: string;
  intake: string;
  ieltsScore: string;
  ieltsType: string;
  academicReq: string;
  scholarship: string;
  scholarshipAmount: string;
  scholarshipEligible: boolean;
  matchScore: number;
  careerOutcomes: string[];
  documents: string[];
  description: string;
  image?: string;
}

export interface CourseQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseData | null;
}

// ─── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.12,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.12 } },
};

// ─── Component ──────────────────────────────────────────────────────────────

export function CourseQuickView({
  open,
  onOpenChange,
  course,
}: CourseQuickViewProps) {
  // Match score ring gradient for the large circular indicator
  const matchRingGradient = useMemo(() => {
    const score = course?.matchScore ?? 0;
    return `conic-gradient(#0066CC 0deg, #0066CC ${
      (score / 100) * 360
    }deg, #E5E5E5 ${(score / 100) * 360}deg, #E5E5E5 360deg)`;
  }, [course?.matchScore]);

  if (!course) return null;

  const imgSrc = course.image || '/images/alo/universities/uk-campus-01.webp';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-[520px] sm:max-w-[560px] p-0 gap-0 overflow-hidden lg:h-screen h-[90vh] rounded-none"
      >
        {/* Accessibility: hidden title + description for screen readers */}
        <SheetTitle className="sr-only">{course.name}</SheetTitle>
        <SheetDescription className="sr-only">
          Quick view details for {course.name} at {course.university}
        </SheetDescription>

        <div className="flex h-full flex-col">
          {/* ── Scrollable Content ─────────────────────────────────────── */}
          <ScrollArea className="flex-1 alo-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={course.name}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col"
              >
                {/* ── Hero Image ─────────────────────────────────────── */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={imgSrc}
                    alt={`${course.university} campus`}
                    fill
                    className="object-cover"
                    sizes="560px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Close button overlay — top right */}
                  <button
                    type="button"
                    aria-label="Close drawer"
                    onClick={() => onOpenChange(false)}
                    className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/90 transition-colors hover:bg-black/60 hover:text-white focus-ring"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Degree badge on image */}
                  <div className="absolute bottom-3 left-4">
                    <Badge className="bg-alo-orange text-white border-0 text-xs font-semibold px-2.5 py-1">
                      <GraduationCap className="h-3.5 w-3.5 mr-1" />
                      {course.degree}
                    </Badge>
                  </div>
                </div>

                {/* ── Course Name + University ─────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 pt-5 pb-3">
                  <h2 className="text-xl font-bold leading-tight text-foreground">
                    {course.name}
                  </h2>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 shrink-0 text-alo-blue" />
                    <span className="font-medium text-foreground">{course.university}</span>
                    <span className="text-muted-foreground">·</span>
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {course.city}, {course.country} {course.flag}
                    </span>
                  </p>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Match Score + Description Row ───────────────────── */}
                <motion.div variants={itemVariants} className="flex items-start gap-5 px-5 py-4">
                  {/* Large circular match score */}
                  <div className="shrink-0 self-center">
                    <div
                      className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full"
                      style={{ background: matchRingGradient }}
                    >
                      <div className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-alo-white shadow-sm">
                        <span className="text-2xl font-extrabold leading-none text-alo-blue">
                          {course.matchScore}%
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="min-w-0 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                    {course.description}
                  </p>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Key Facts Grid (3 columns) ──────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Key Facts
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-alo-gray-medium/60 bg-alo-gray-light/50 p-3 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-alo-blue-light">
                        <DollarSign className="h-4.5 w-4.5 text-alo-blue" />
                      </div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Tuition
                      </p>
                      <p className="text-sm font-bold text-foreground leading-tight">
                        {course.tuition}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        per {course.tuitionPer}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-alo-gray-medium/60 bg-alo-gray-light/50 p-3 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-alo-blue-light">
                        <Clock className="h-4.5 w-4.5 text-alo-blue" />
                      </div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Duration
                      </p>
                      <p className="text-sm font-bold text-foreground leading-tight">
                        {course.duration}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Full-time</p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-alo-gray-medium/60 bg-alo-gray-light/50 p-3 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-alo-blue-light">
                        <Calendar className="h-4.5 w-4.5 text-alo-blue" />
                      </div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Intake
                      </p>
                      <p className="text-sm font-bold text-foreground leading-tight">
                        {course.intake}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Available</p>
                    </div>
                  </div>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Entry Requirements ──────────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Entry Requirements
                  </h3>
                  <div className="space-y-3">
                    {/* IELTS Score */}
                    <div className="flex items-start gap-3 rounded-xl border border-alo-gray-medium/60 bg-alo-gray-light/30 p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-alo-blue-light">
                        <Languages className="h-4.5 w-4.5 text-alo-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">English Language</p>
                        <p className="mt-0.5 text-sm font-bold text-alo-blue">
                          {course.ieltsType} {course.ieltsScore}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Minimum required score
                        </p>
                      </div>
                    </div>

                    {/* Academic Requirements */}
                    <div className="flex items-start gap-3 rounded-xl border border-alo-gray-medium/60 bg-alo-gray-light/30 p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-alo-blue-light">
                        <GraduationCap className="h-4.5 w-4.5 text-alo-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          Academic Requirement
                        </p>
                        <p className="mt-0.5 text-sm text-foreground font-medium">
                          {course.academicReq}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Scholarship Section ─────────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Scholarship
                  </h3>
                  <div className="rounded-xl border border-alo-sunshine/40 bg-alo-sunshine-light/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-alo-sunshine/20">
                          <Award className="h-5 w-5 text-alo-orange" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">
                            {course.scholarship}
                          </p>
                          <p className="mt-0.5 text-base font-extrabold text-alo-orange">
                            {course.scholarshipAmount}
                          </p>
                        </div>
                      </div>
                      {course.scholarshipEligible ? (
                        <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[11px] font-semibold text-emerald-700">
                            Eligible
                          </span>
                        </div>
                      ) : (
                        <div className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2.5 py-1">
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-[11px] font-semibold text-red-600">
                            Check
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Career Outcomes ─────────────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Career Outcomes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {course.careerOutcomes.map((career) => (
                      <motion.div
                        key={career}
                        variants={scaleInVariants}
                        className="inline-flex items-center gap-1.5 rounded-full border border-alo-blue/20 bg-alo-blue-light/60 px-3 py-1.5"
                      >
                        <Briefcase className="h-3.5 w-3.5 text-alo-blue" />
                        <span className="text-xs font-medium text-alo-blue">
                          {career}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Required Documents ──────────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 py-4 pb-6">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Required Documents
                  </h3>
                  <div className="space-y-2">
                    {course.documents.map((doc) => (
                      <motion.div
                        key={doc}
                        variants={itemVariants}
                        className="flex items-center gap-3 rounded-lg border border-alo-gray-medium/40 bg-alo-white p-2.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-alo-gray-light">
                          <FileText className="h-4 w-4 text-alo-gray" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {doc}
                        </span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Bottom spacer so last content isn't hidden behind sticky bar */}
                <div className="h-4" />
              </motion.div>
            </AnimatePresence>
          </ScrollArea>

          {/* ── Sticky Bottom Bar ─────────────────────────────────────── */}
          <div className="shrink-0 border-t border-alo-gray-medium/60 bg-alo-white px-5 py-3">
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 border-alo-gray-medium text-sm font-semibold text-foreground hover:bg-alo-gray-light"
                aria-label="Compare this course"
              >
                <GitCompareArrows className="h-4 w-4" />
                <span className="hidden sm:inline">Compare</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 border-alo-gray-medium text-sm font-semibold text-foreground hover:bg-alo-gray-light"
                aria-label="Save this course"
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>

              <Button
                size="sm"
                className="ml-auto h-10 w-full max-w-[220px] gap-2 bg-alo-orange text-sm font-bold text-white hover:bg-alo-orange-dark"
                aria-label="Apply now for this course"
              >
                Apply Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
