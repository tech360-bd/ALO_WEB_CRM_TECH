'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Heart,
  Bookmark,
  GitCompareArrows,
  ArrowRight,
  GraduationCap,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Languages,
  Award,
} from 'lucide-react';
import Image from 'next/image';

// ─── TypeScript Interface ───────────────────────────────────────────────────

export interface CourseCardData {
  name: string;
  university: string;
  city: string;
  country: string;
  flag: string;
  tuition: string;
  intake: string;
  ielts: string;
  duration: string;
  scholarship: boolean;
  matchScore: number;
  image?: string;
}

export interface CourseCardProps {
  course: CourseCardData;
  onQuickView: () => void;
  onSave?: () => void;
  onCompare?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CourseCard({ course, onQuickView, onSave, onCompare }: CourseCardProps) {
  const imgSrc = course.image || '/images/alo/universities/uk-campus-01.webp';

  return (
    <motion.div
      role="article"
      aria-label={`${course.name} at ${course.university}`}
      tabIndex={0}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-alo-gray-medium/60 bg-alo-white shadow-sm card-lift focus-ring cursor-pointer'
      )}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onQuickView}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onQuickView();
        }
      }}
    >
      {/* ── Image Section ─────────────────────────────────────────────── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-xl">
        <Image
          src={imgSrc}
          alt={`${course.university} campus`}
          fill
          className="img-zoom object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient overlay */}
        <div className="gradient-overlay absolute inset-0" />

        {/* Course name on image */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-bold leading-tight text-white line-clamp-2">
            {course.name}
          </h3>
        </div>

        {/* Save / Heart button — top right */}
        {onSave && (
          <motion.button
            type="button"
            aria-label="Save course"
            className={cn(
              'absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm focus-ring'
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
          >
            <Heart className="h-4 w-4 text-alo-gray" />
          </motion.button>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        {/* University + Location row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {course.university}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {course.city} {course.flag}
              </span>
            </p>
          </div>

          {/* Match Score badge */}
          {course.matchScore > 0 && (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
                'bg-alo-blue'
              )}
              title={`${course.matchScore}% Match`}
              style={{
                background: `conic-gradient(#0066CC ${course.matchScore}%, #E5E5E5 ${course.matchScore}%)`,
              }}
            >
              <span className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-alo-white text-[11px] font-bold text-alo-blue">
                {course.matchScore}%
              </span>
            </div>
          )}
        </div>

        {/* Info Grid: 2×2 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <InfoItem icon={DollarSign} label="Tuition" value={course.tuition} />
          <InfoItem icon={Calendar} label="Intake" value={course.intake} />
          <InfoItem icon={Languages} label="IELTS" value={course.ielts} />
          <InfoItem icon={Clock} label="Duration" value={course.duration} />
        </div>

        {/* Scholarship Badge */}
        {course.scholarship && (
          <Badge className="w-fit bg-alo-sunshine text-alo-black border-0 text-[11px] font-semibold">
            <Award className="h-3 w-3" />
            Scholarship Available
          </Badge>
        )}

        {/* Spacer */}
        <div className="mt-auto" />

        {/* ── Action Buttons ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-1">
          {onCompare && (
            <motion.button
              type="button"
              aria-label="Compare course"
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-lg border border-alo-gray-medium bg-alo-white px-2.5 text-xs font-medium text-alo-gray focus-ring'
              )}
              whileHover={{ backgroundColor: '#F7F7F7' }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onCompare();
              }}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </motion.button>
          )}

          {onSave && (
            <motion.button
              type="button"
              aria-label="Save course"
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-lg border border-alo-gray-medium bg-alo-white px-2.5 text-xs font-medium text-alo-gray focus-ring'
              )}
              whileHover={{ backgroundColor: '#F7F7F7' }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </motion.button>
          )}

          <motion.button
            type="button"
            aria-label="View course details"
            className={cn(
              'ml-auto flex h-8 items-center gap-1.5 rounded-lg bg-alo-orange px-3 text-xs font-semibold text-white focus-ring'
            )}
            whileHover={{ backgroundColor: '#D45A10' }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onQuickView();
            }}
          >
            View Details
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-alo-blue" />
      <div className="min-w-0">
        <p className="text-[10px] leading-none text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
