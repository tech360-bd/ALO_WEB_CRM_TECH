'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, Star, Award, Shield, Quote
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const CORAL = '#bf4520';
const INK = '#2d3142';
const PAPER = '#f5f5f5';

// ── Trust Bar (Partner Logos) ──────────────────────────────────────────────
interface TrustBarProps {
  universities?: string[];
  className?: string;
}

const DEFAULT_UNIS = [
  'University of Oxford', 'University of Cambridge', 'Imperial College London',
  'UCL', 'King\'s College London', 'University of Edinburgh',
  'University of Manchester', 'University of Bristol', 'LSE',
  'University of Warwick', 'University of Glasgow', 'University of Leeds',
];

export function TrustBar({ universities = DEFAULT_UNIS, className = '' }: TrustBarProps) {
  return (
    <div className={`py-6 ${className}`}>
      <p className="text-center text-xs text-[#9ca3af] uppercase tracking-wider mb-4">
        Trusted by students at leading universities
      </p>
      <div className="flex items-center justify-center flex-wrap gap-4 md:gap-6">
        {universities.map((uni, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-[#6b7280] hover:text-[#2d3142] transition-colors"
          >
            <div className="w-8 h-8 bg-[#f5f5f5] rounded-[4px] flex items-center justify-center text-xs font-bold text-[#9ca3af]">
              {uni.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <span className="text-xs font-medium hidden md:inline">{uni}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Testimonial Carousel ───────────────────────────────────────────────────
interface Testimonial {
  name: string;
  country: string;
  flag: string;
  university: string;
  course: string;
  text: string;
  rating: number;
  avatarUrl?: string;
}

interface TestimonialCarouselProps {
  testimonials?: Testimonial[];
  className?: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Ahmed Al-Rashid',
    country: 'UAE',
    flag: '🇦🇪',
    university: 'University of Manchester',
    course: 'MSc Computer Science',
    text: 'ALO made my dream of studying in the UK a reality. From IELTS prep to visa support, they handled everything. I got my offer in just 3 weeks!',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    country: 'India',
    flag: '🇮🇳',
    university: 'UCL',
    course: 'MSc Management',
    text: 'The counselors at ALO are incredibly knowledgeable. They helped me find the perfect program and even secured a partial scholarship. Forever grateful!',
    rating: 5,
  },
  {
    name: 'Carlos Mendoza',
    country: 'Mexico',
    flag: '🇲🇽',
    university: 'University of Edinburgh',
    course: 'MSc Data Science',
    text: 'I was worried about the visa process, but ALO\'s step-by-step guidance made it stress-free. Their AI tools for document checking were a game-changer.',
    rating: 5,
  },
  {
    name: 'Fatima Hassan',
    country: 'Egypt',
    flag: '🇪🇬',
    university: 'King\'s College London',
    course: 'MA Education',
    text: 'From my first consultation to enrollment day, ALO was with me every step. They even helped me find accommodation in London. Highly recommend!',
    rating: 4,
  },
  {
    name: 'Yuki Tanaka',
    country: 'Japan',
    flag: '🇯🇵',
    university: 'Imperial College',
    course: 'PhD Physics',
    text: 'As a PhD applicant, I needed specialized guidance. ALO connected me with the right supervisor and helped craft my research proposal. Exceptional service!',
    rating: 5,
  },
];

export function TestimonialCarousel({ testimonials = DEFAULT_TESTIMONIALS, className = '' }: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);
  const len = testimonials.length;

  const next = useCallback(() => setCurrent(c => (c + 1) % len), [len]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + len) % len), [len]);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  const t = testimonials[current];

  return (
    <div className={`py-8 ${className}`}>
      <div className="max-w-2xl mx-auto text-center">
        <Quote className="h-8 w-8 text-[#bf4520]/20 mx-auto mb-4" />
        <p className="text-lg md:text-xl text-[#2d3142] leading-relaxed mb-6">
          &ldquo;{t.text}&rdquo;
        </p>
        <div className="flex items-center justify-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < t.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#e5e7eb]'}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={t.avatarUrl} />
            <AvatarFallback className="text-sm bg-[#bf4520]/10 text-[#bf4520]" style={{ borderRadius: '6px' }}>
              {t.flag}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="text-sm font-semibold text-[#2d3142]">{t.name}</div>
            <div className="text-xs text-[#6b7280]">{t.university} · {t.course}</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={prev} className="p-1 text-[#9ca3af] hover:text-[#2d3142] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? 'w-6 bg-[#bf4520]' : 'w-1.5 bg-[#e5e7eb]'
                }`}
              />
            ))}
          </div>
          <button onClick={next} className="p-1 text-[#9ca3af] hover:text-[#2d3142] transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────
interface StatsBarProps {
  stats?: { value: string; label: string }[];
  className?: string;
}

const DEFAULT_STATS = [
  { value: '500+', label: 'Students Enrolled' },
  { value: '50+', label: 'Partner Universities' },
  { value: '18', label: 'Countries Served' },
  { value: '98%', label: 'Visa Success Rate' },
];

export function StatsBar({ stats = DEFAULT_STATS, className = '' }: StatsBarProps) {
  return (
    <div className={`py-6 bg-[#2d3142] ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-center flex-wrap gap-6 md:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-white/60 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Certification Badge ────────────────────────────────────────────────────
interface CertificationBadgeProps {
  name?: string;
  issuer?: string;
  className?: string;
}

export function CertificationBadge({
  name = 'British Council Certified',
  issuer = 'British Council',
  className = '',
}: CertificationBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] px-4 py-2 rounded-[6px] ${className}`}>
      <Award className="h-5 w-5 text-[#22c55e]" />
      <div>
        <div className="text-sm font-semibold text-[#166534]">{name}</div>
        <div className="text-[10px] text-[#15803d]/60">Issued by {issuer}</div>
      </div>
    </div>
  );
}

// ── Guarantee Seal ─────────────────────────────────────────────────────────
interface GuaranteeSealProps {
  text?: string;
  className?: string;
}

export function GuaranteeSeal({
  text = 'Money-Back Guarantee',
  className = '',
}: GuaranteeSealProps) {
  return (
    <div className={`inline-flex items-center gap-2 bg-[#eff6ff] border border-[#bfdbfe] px-4 py-2 rounded-[6px] ${className}`}>
      <Shield className="h-5 w-5 text-[#3b82f6]" />
      <div>
        <div className="text-sm font-semibold text-[#1e40af]">{text}</div>
        <div className="text-[10px] text-[#1e40af]/60">Full refund if not satisfied</div>
      </div>
    </div>
  );
}
