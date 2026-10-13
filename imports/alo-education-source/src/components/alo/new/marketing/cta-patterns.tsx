'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Users, Sparkles } from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const CORAL = '#bf4520';
const CORAL_HOVER = '#a33a1a';
const INK = '#2d3142';
const PAPER = '#f5f5f5';

// ── Primary CTA ────────────────────────────────────────────────────────────
interface PrimaryCTAProps {
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function PrimaryCTA({ onClick, label = 'Start Your Application', className = '' }: PrimaryCTAProps) {
  return (
    <Button
      onClick={onClick}
      className={`bg-[${CORAL}] hover:bg-[${CORAL_HOVER}] text-white font-bold text-base px-8 py-4 h-auto ${className}`}
      style={{ backgroundColor: CORAL, borderRadius: '8px' }}
    >
      {label}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  );
}

// ── Secondary CTA ──────────────────────────────────────────────────────────
interface SecondaryCTAProps {
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function SecondaryCTA({ onClick, label = 'Book Free Consultation', className = '' }: SecondaryCTAProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`border-2 border-[${CORAL}] text-[${CORAL}] hover:bg-[${CORAL}] hover:text-white font-semibold text-base px-8 py-4 h-auto ${className}`}
      style={{ borderColor: CORAL, color: CORAL, borderRadius: '8px' }}
    >
      {label}
    </Button>
  );
}

// ── Tertiary CTA ───────────────────────────────────────────────────────────
interface TertiaryCTAProps {
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function TertiaryCTA({ onClick, label = 'Learn More', className = '' }: TertiaryCTAProps) {
  return (
    <button
      onClick={onClick}
      className={`text-[${CORAL}] hover:text-[${CORAL_HOVER}] font-medium text-base underline underline-offset-4 decoration-[${CORAL}]/30 hover:decoration-[${CORAL}] transition-colors ${className}`}
      style={{ color: CORAL }}
    >
      {label} →
    </button>
  );
}

// ── Urgency CTA ────────────────────────────────────────────────────────────
interface UrgencyCTAProps {
  deadline: Date;
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function UrgencyCTA({ deadline, onClick, label = 'Apply Before Deadline', className = '' }: UrgencyCTAProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, deadline.getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const isUrgent = timeLeft.days < 3;

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <Button
        onClick={onClick}
        className="text-white font-bold text-base px-8 py-4 h-auto"
        style={{
          backgroundColor: isUrgent ? '#dc2626' : CORAL,
          borderRadius: '8px',
          animation: isUrgent ? 'pulse 2s infinite' : undefined,
        }}
      >
        <Clock className="mr-2 h-5 w-5" />
        {label}
      </Button>
      <div className="flex items-center gap-1.5">
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hrs' },
          { value: timeLeft.minutes, label: 'Min' },
          { value: timeLeft.seconds, label: 'Sec' },
        ].map((unit, i) => (
          <React.Fragment key={unit.label}>
            {i > 0 && <span className="text-[#9ca3af] text-xs">:</span>}
            <div className="text-center">
              <div
                className="text-lg font-bold font-mono text-[#2d3142]"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {String(unit.value).padStart(2, '0')}
              </div>
              <div className="text-[9px] text-[#9ca3af] uppercase tracking-wider">{unit.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── Value Prop CTA ─────────────────────────────────────────────────────────
interface ValuePropCTAProps {
  count?: number;
  label?: string;
  sublabel?: string;
  onClick?: () => void;
  className?: string;
}

export function ValuePropCTA({
  count = 500,
  label = 'Students',
  sublabel = 'Already Enrolled This Year',
  onClick,
  className = '',
}: ValuePropCTAProps) {
  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-[#2d3142]">
        <Users className="h-5 w-5 text-[#bf4520]" />
        <span className="text-2xl font-bold font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {count.toLocaleString()}+
        </span>
        <span className="text-lg font-medium">{label}</span>
      </div>
      <p className="text-sm text-[#6b7280]">{sublabel}</p>
      <Button
        onClick={onClick}
        className="bg-[#bf4520] hover:bg-[#a33a1a] text-white font-bold px-8 py-3 h-auto"
        style={{ borderRadius: '8px' }}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Join Them Today
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
