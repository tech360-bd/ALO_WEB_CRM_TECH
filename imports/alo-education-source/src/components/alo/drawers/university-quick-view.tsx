'use client';

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
  Users,
  BookOpen,
  TrendingUp,
  Building2,
  Phone,
} from 'lucide-react';

// ─── TypeScript Interfaces ──────────────────────────────────────────────────

export interface UniversityData {
  name: string;
  city: string;
  country: string;
  flag: string;
  ranking: string;
  rankingSource: string;
  students: string;
  courses: string;
  tuitionRange: string;
  scholarships: string;
  accommodation: string;
  subjects: string[];
  description: string;
  campusImage: string;
  logo: string;
  featuredCourses?: {
    name: string;
    degree: string;
    tuition: string;
  }[];
}

export interface UniversityQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  university: UniversityData | null;
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

export function UniversityQuickView({
  open,
  onOpenChange,
  university,
}: UniversityQuickViewProps) {
  if (!university) return null;

  const imgSrc =
    university.campusImage || '/images/alo/universities/uk-campus-01.webp';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-[520px] sm:max-w-[560px] p-0 gap-0 overflow-hidden lg:h-screen h-[90vh] rounded-none"
      >
        {/* Accessibility: hidden title + description for screen readers */}
        <SheetTitle className="sr-only">{university.name}</SheetTitle>
        <SheetDescription className="sr-only">
          Quick view details for {university.name}
        </SheetDescription>

        <div className="flex h-full flex-col">
          {/* ── Scrollable Content ─────────────────────────────────────── */}
          <ScrollArea className="flex-1 alo-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={university.name}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col"
              >
                {/* ── Campus Hero Image ───────────────────────────────── */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={imgSrc}
                    alt={`${university.name} campus`}
                    fill
                    className="object-cover"
                    sizes="560px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Close button — top right */}
                  <button
                    type="button"
                    aria-label="Close drawer"
                    onClick={() => onOpenChange(false)}
                    className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/90 transition-colors hover:bg-black/60 hover:text-white focus-ring"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* University logo — bottom left */}
                  {university.logo && (
                    <div className="absolute bottom-3 left-4 z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-white p-2 shadow-lg">
                      <Image
                        src={university.logo}
                        alt={`${university.name} logo`}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  )}

                  {/* University name overlay */}
                  <div className="absolute bottom-3 left-[76px] right-4 z-10">
                    <h2 className="text-lg font-bold leading-tight text-white drop-shadow-sm">
                      {university.name}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                      <MapPin className="h-3 w-3" />
                      {university.city}, {university.country} {university.flag}
                    </p>
                  </div>
                </div>

                {/* ── Quick Stats Strip ────────────────────────────────── */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-4 border-b border-alo-gray-medium/60 bg-alo-white"
                >
                  <StatBlock
                    icon={TrendingUp}
                    label="Ranking"
                    value={university.ranking}
                    sublabel={university.rankingSource}
                  />
                  <StatBlock
                    icon={Users}
                    label="Students"
                    value={university.students}
                  />
                  <StatBlock
                    icon={BookOpen}
                    label="Courses"
                    value={university.courses}
                  />
                  <StatBlock
                    icon={Award}
                    label="Scholarships"
                    value={university.scholarships}
                  />
                </motion.div>

                {/* ── About Section ────────────────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 py-4">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    About
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {university.description}
                  </p>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Popular Subjects ─────────────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Popular Subjects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {university.subjects.map((subject) => (
                      <motion.div
                        key={subject}
                        variants={scaleInVariants}
                      >
                        <Badge
                          variant="outline"
                          className="border-alo-blue/20 bg-alo-blue-light/60 text-alo-blue text-xs font-medium px-2.5 py-1 hover:bg-alo-blue-light transition-colors cursor-default"
                        >
                          {subject}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Tuition Range ────────────────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tuition Range
                  </h3>
                  <div className="flex items-center gap-3 rounded-xl border border-alo-gray-medium/60 bg-alo-gray-light/30 p-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-alo-blue-light">
                      <DollarSign className="h-5 w-5 text-alo-blue" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {university.tuitionRange}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Per year (varies by course)
                      </p>
                    </div>
                  </div>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Accommodation ────────────────────────────────────── */}
                <motion.div variants={itemVariants} className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Accommodation
                  </h3>
                  <div className="flex items-start gap-3 rounded-xl border border-alo-gray-medium/60 bg-alo-gray-light/30 p-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-alo-blue-light">
                      <Building2 className="h-5 w-5 text-alo-blue" />
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {university.accommodation}
                    </p>
                  </div>
                </motion.div>

                <Separator className="mx-5" />

                {/* ── Featured Courses ─────────────────────────────────── */}
                {university.featuredCourses &&
                  university.featuredCourses.length > 0 && (
                    <motion.div variants={itemVariants} className="px-5 py-4 pb-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Featured Courses
                        </h3>
                        <button
                          type="button"
                          className="flex items-center gap-0.5 text-xs font-semibold text-alo-blue hover:text-alo-blue-dark transition-colors focus-ring rounded"
                        >
                          View All
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        {university.featuredCourses.map(
                          (featuredCourse, idx) => (
                            <motion.div
                              key={featuredCourse.name}
                              variants={itemVariants}
                              className="group flex items-center gap-3 rounded-xl border border-alo-gray-medium/60 bg-alo-white p-3.5 transition-colors hover:border-alo-blue/20 hover:bg-alo-blue-light/30"
                            >
                              {/* Course number */}
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-alo-blue text-sm font-bold text-white">
                                {idx + 1}
                              </div>

                              {/* Course details */}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {featuredCourse.name}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" />
                                    {featuredCourse.degree}
                                  </span>
                                  <span className="text-alo-gray-medium">·</span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {featuredCourse.tuition}
                                  </span>
                                </div>
                              </div>

                              {/* View button */}
                              <button
                                type="button"
                                className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-alo-gray-medium bg-alo-white px-2.5 text-xs font-medium text-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-alo-gray-light focus-ring"
                              >
                                View
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}

                {/* Bottom spacer */}
                <div className="h-4" />
              </motion.div>
            </AnimatePresence>
          </ScrollArea>

          {/* ── Sticky Bottom Bar ─────────────────────────────────────── */}
          <div className="shrink-0 border-t border-alo-gray-medium/60 bg-alo-white px-5 py-3">
            <div className="flex items-center gap-2.5">
              <Button
                size="sm"
                className="h-10 flex-1 gap-2 bg-alo-blue text-sm font-bold text-white hover:bg-alo-blue-dark"
                aria-label="View all courses at this university"
              >
                <BookOpen className="h-4 w-4" />
                View All Courses
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                className="h-10 flex-1 gap-2 bg-alo-orange text-sm font-bold text-white hover:bg-alo-orange-dark"
                aria-label="Contact ALO about this university"
              >
                <Phone className="h-4 w-4" />
                Contact ALO
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatBlock({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-3.5 px-2 text-center border-r border-alo-gray-medium/60 last:border-r-0">
      <Icon className="h-4 w-4 text-alo-blue" />
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-none">
        {label}
      </p>
      <p className="text-sm font-bold text-foreground leading-tight">
        {value}
      </p>
      {sublabel && (
        <p className="text-[9px] text-muted-foreground leading-none">
          {sublabel}
        </p>
      )}
    </div>
  );
}
