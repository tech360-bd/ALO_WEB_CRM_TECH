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
  Building2,
  Users,
} from 'lucide-react';
import Image from 'next/image';

// ─── TypeScript Interface ───────────────────────────────────────────────────

export interface UniversityCardData {
  name: string;
  city: string;
  country: string;
  flag: string;
  ranking: string;
  courses: string;
  tuitionRange: string;
  scholarships: string;
  subjects: string[];
  matchScore?: number;
  image?: string;
  logo?: string;
}

export interface UniversityCardProps {
  university: UniversityCardData;
  onQuickView: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function UniversityCard({ university, onQuickView }: UniversityCardProps) {
  const imgSrc = university.image || '/images/alo/universities/uk-campus-01.webp';

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

        {/* Match Score — top right */}
        {university.matchScore && university.matchScore > 0 && (
          <div
            className={cn(
              'absolute top-2.5 right-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full'
            )}
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
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
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
          </p>
        </div>

        {/* Info Grid: 4 columns */}
        <div className="grid grid-cols-4 gap-1">
          <UniStatItem
            icon={TrendingUp}
            label="Ranking"
            value={university.ranking}
          />
          <UniStatItem
            icon={BookOpen}
            label="Courses"
            value={university.courses}
          />
          <UniStatItem
            icon={GraduationCap}
            label="Tuition"
            value={university.tuitionRange}
          />
          <UniStatItem
            icon={Award}
            label="Scholarships"
            value={university.scholarships}
          />
        </div>

        {/* Popular Subjects */}
        {university.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {university.subjects.slice(0, 3).map((subject) => (
              <Badge
                key={subject}
                variant="outline"
                className="border-alo-blue/20 bg-alo-blue-light text-alo-blue text-[11px] font-medium"
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
            Explore University
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>

          <motion.button
            type="button"
            aria-label="Save university"
            className={cn(
              'ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-alo-gray-medium bg-alo-white text-alo-gray focus-ring'
            )}
            whileHover={{ backgroundColor: '#F7F7F7' }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function UniStatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <Icon className="h-3.5 w-3.5 text-alo-blue" />
      <p className="text-[10px] leading-none text-muted-foreground">{label}</p>
      <p className="truncate text-[11px] font-bold text-foreground">{value}</p>
    </div>
  );
}
