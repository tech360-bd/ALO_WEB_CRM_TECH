'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MapPin,
  GraduationCap,
  Award,
  BookOpen,
  ArrowRight,
  Heart,
  TrendingUp,
  Wallet,
  Home,
  ExternalLink,
  Star,
} from 'lucide-react';
import Image from 'next/image';

/**
 * Enhanced University Card
 *
 * Inspired by Studytra's UniversitiesPage pattern:
 * - QS Ranking badge (prominent)
 * - Living cost display (monthly estimate)
 * - Programs list (show top 3 programs)
 * - Tuition type indicator (Free/Public vs Paid)
 * - Country flag with color coding
 *
 * Inspired by Nabal Education Figma design:
 * - Clean card layout with image overlay
 * - Subject tags/badges row
 * - Match score ring
 */

// ─── TypeScript Interface ───────────────────────────────────────────────────

export interface EnhancedUniversityCardData {
  name: string;
  city: string;
  country: string;
  flag: string;
  /** QS World University Ranking number */
  qsRanking: number;
  /** Number of courses/programs offered */
  courseCount: number;
  /** Tuition text e.g. "Free (Public)" or "€1,500/year" or "$57,000/year" */
  tuition: string;
  /** Whether tuition is free/public */
  isTuitionFree?: boolean;
  /** Monthly living cost estimate e.g. "€800 - €1,100" */
  livingCost?: string;
  /** Available programs list (show top 3) */
  programs: string[];
  /** Match score 0-100 */
  matchScore?: number;
  /** Popular subjects/tags */
  subjects: string[];
  /** Campus image URL */
  image?: string;
  /** University logo URL */
  logo?: string;
  /** Official website URL */
  websiteUrl?: string;
  /** Whether the university is shortlisted */
  isShortlisted?: boolean;
}

export interface EnhancedUniversityCardProps {
  university: EnhancedUniversityCardData;
  onQuickView: () => void;
  onToggleShortlist?: () => void;
}

// ─── QS Ranking Color Helper ────────────────────────────────────────────────

function getQsRankingStyle(ranking: number) {
  if (ranking <= 50) return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'Top 50' };
  if (ranking <= 100) return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Top 100' };
  if (ranking <= 200) return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Top 200' };
  if (ranking <= 500) return { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300', label: 'Top 500' };
  return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: '' };
}

// ─── Component ──────────────────────────────────────────────────────────────

export function EnhancedUniversityCard({
  university,
  onQuickView,
  onToggleShortlist,
}: EnhancedUniversityCardProps) {
  const imgSrc = university.image || '/images/alo/universities/uk-campus-01.webp';
  const qsStyle = getQsRankingStyle(university.qsRanking);

  return (
    <motion.div
      role="article"
      aria-label={`${university.name} — ${university.city}, ${university.country}`}
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
          alt={`${university.name} campus`}
          fill
          className="img-zoom object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient overlay */}
        <div className="gradient-overlay absolute inset-0" />

        {/* University logo — top left */}
        {university.logo && (
          <div className="absolute top-2.5 left-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
            <Image
              src={university.logo}
              alt={`${university.name} logo`}
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
        )}

        {/* QS Ranking Badge — top right */}
        <div className={cn(
          'absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1 shadow-sm',
          qsStyle.bg, qsStyle.text
        )}>
          <Star className="h-3.5 w-3.5" />
          <span className="text-xs font-bold">#{university.qsRanking}</span>
        </div>

        {/* Tuition Free Badge — bottom left of image */}
        {university.isTuitionFree && (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
            <GraduationCap className="h-3 w-3" />
            Tuition-Free
          </div>
        )}

        {/* Match Score — top right (if no QS ranking) */}
        {!university.qsRanking && university.matchScore && university.matchScore > 0 && (
          <div
            className="absolute top-2.5 right-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full"
            title={`${university.matchScore}% Match`}
            style={{
              background: `conic-gradient(#0066CC ${university.matchScore}%, #E5E5E5 ${university.matchScore}%)`,
            }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-alo-white text-[11px] font-bold text-alo-blue">
              {university.matchScore}%
            </span>
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
        {/* University Name + Location */}
        <div>
          <h3 className="truncate text-sm sm:text-base font-bold text-foreground">
            {university.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {university.city}, {university.country} {university.flag}
            </span>
            {university.websiteUrl && (
              <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-alo-blue opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </p>
        </div>

        {/* Info Grid: Ranking + Courses + Tuition + Living Cost */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <InfoItem
            icon={TrendingUp}
            label="QS Rank"
            value={`#${university.qsRanking}`}
            accent={university.qsRanking <= 100 ? 'emerald' : undefined}
          />
          <InfoItem
            icon={BookOpen}
            label="Programs"
            value={`${university.courseCount}+`}
          />
          <InfoItem
            icon={GraduationCap}
            label="Tuition"
            value={university.tuition}
            accent={university.isTuitionFree ? 'emerald' : undefined}
          />
          {university.livingCost && (
            <InfoItem
              icon={Home}
              label="Living Cost"
              value={university.livingCost}
            />
          )}
        </div>

        {/* Programs List — top 3 from Studytra pattern */}
        {university.programs.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Popular Programs</p>
            <div className="flex flex-wrap gap-1">
              {university.programs.slice(0, 3).map((program) => (
                <Badge
                  key={program}
                  variant="outline"
                  className="border-alo-blue/20 bg-alo-blue-light text-alo-blue text-[10px] font-medium"
                >
                  {program}
                </Badge>
              ))}
              {university.programs.length > 3 && (
                <Badge
                  variant="outline"
                  className="border-alo-gray-medium bg-alo-gray-light text-alo-gray text-[10px] font-medium"
                >
                  +{university.programs.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Subject Tags */}
        {university.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {university.subjects.slice(0, 3).map((subject) => (
              <Badge
                key={subject}
                variant="outline"
                className="border-alo-orange/20 bg-alo-orange-light text-alo-orange text-[10px] font-medium"
              >
                {subject}
              </Badge>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="mt-auto" />

        {/* ── Action Row ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-1">
          <motion.button
            type="button"
            aria-label="Explore university"
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-lg bg-alo-blue px-3 text-xs font-semibold text-white focus-ring'
            )}
            whileHover={{ backgroundColor: '#004C99' }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onQuickView();
            }}
          >
            Explore
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>

          {onToggleShortlist && (
            <motion.button
              type="button"
              aria-label={university.isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border focus-ring',
                university.isShortlisted
                  ? 'border-red-300 bg-red-50 text-red-500'
                  : 'border-alo-gray-medium bg-alo-white text-alo-gray'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleShortlist();
              }}
            >
              <Heart className={cn('h-4 w-4', university.isShortlisted && 'fill-current')} />
            </motion.button>
          )}
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
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: 'emerald';
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn(
        'h-3.5 w-3.5 shrink-0',
        accent === 'emerald' ? 'text-emerald-600' : 'text-alo-blue'
      )} />
      <div className="min-w-0">
        <p className="text-[10px] leading-none text-muted-foreground">{label}</p>
        <p className={cn(
          'truncate text-[11px] font-bold',
          accent === 'emerald' ? 'text-emerald-700' : 'text-foreground'
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}
