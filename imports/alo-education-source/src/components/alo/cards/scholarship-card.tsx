'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Award,
  MapPin,
  Calendar,
  GraduationCap,
  Globe,
  DollarSign,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

// ─── TypeScript Interface ───────────────────────────────────────────────────

export interface ScholarshipCardData {
  name: string;
  university: string;
  country: string;
  flag: string;
  amount: string;
  eligibility: string[];
  deadline: string;
  degree: string;
  international: boolean;
  source: string;
}

export interface ScholarshipCardProps {
  scholarship: ScholarshipCardData;
  onCheckEligibility: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns true when the deadline is within 30 days → urgent styling */
function isUrgentDeadline(deadline: string): boolean {
  try {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ScholarshipCard({
  scholarship,
  onCheckEligibility,
}: ScholarshipCardProps) {
  const urgent = isUrgentDeadline(scholarship.deadline);

  return (
    <motion.div
      role="article"
      aria-label={`${scholarship.name} — ${scholarship.amount}`}
      tabIndex={0}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-alo-gray-medium/60 bg-alo-white shadow-sm card-lift focus-ring'
      )}
      whileHover={{
        y: -4,
        borderColor: 'rgba(243, 112, 33, 0.3)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* ── Left Orange Accent Border ──────────────────────────────────── */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-alo-orange transition-all duration-300 group-hover:w-1.5'
        )}
      />

      {/* ── Body (with left padding for accent) ────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4 pl-5">
        {/* Header: Name + Award icon */}
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-alo-orange-light">
            <Award className="h-4 w-4 text-alo-orange" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm sm:text-base font-bold leading-snug text-foreground">
              {scholarship.name}
            </h3>
          </div>
        </div>

        {/* University + Country */}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-alo-gray" />
          <span className="truncate">
            {scholarship.university} {scholarship.flag}
          </span>
        </p>

        {/* Amount — large green */}
        <div className="flex items-baseline gap-1.5">
          <DollarSign className="h-5 w-5 text-success" />
          <span className="text-xl sm:text-2xl font-extrabold text-success leading-none">
            {scholarship.amount}
          </span>
        </div>

        {/* Eligibility Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className="border-alo-blue/20 bg-alo-blue-light text-alo-blue text-[11px] font-medium"
          >
            <GraduationCap className="h-3 w-3" />
            {scholarship.degree}
          </Badge>

          <Badge
            variant="outline"
            className={cn(
              'text-[11px] font-medium',
              scholarship.international
                ? 'border-success/20 bg-emerald-50 text-success'
                : 'border-alo-gray-medium bg-alo-gray-light text-alo-gray'
            )}
          >
            <Globe className="h-3 w-3" />
            {scholarship.international ? 'International' : 'Domestic'}
          </Badge>

          {scholarship.eligibility.slice(0, 2).map((e) => (
            <Badge
              key={e}
              variant="outline"
              className="border-alo-gray-medium bg-alo-gray-light text-alo-gray text-[11px] font-medium"
            >
              <CheckCircle className="h-3 w-3" />
              {e}
            </Badge>
          ))}
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-1.5">
          <Calendar
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              urgent ? 'text-destructive' : 'text-alo-gray'
            )}
          />
          <span
            className={cn(
              'text-xs font-medium',
              urgent ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            Deadline:{' '}
            {urgent && (
              <span className="font-bold">Urgent: </span>
            )}
            {scholarship.deadline}
          </span>
        </div>

        {/* Spacer */}
        <div className="mt-auto" />

        {/* ── CTA Button ──────────────────────────────────────────────── */}
        <motion.button
          type="button"
          aria-label="Check eligibility for this scholarship"
          className={cn(
            'flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-alo-orange text-sm font-semibold text-white focus-ring'
          )}
          whileHover={{ backgroundColor: '#D45A10' }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            onCheckEligibility();
          }}
        >
          Check My Eligibility
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
