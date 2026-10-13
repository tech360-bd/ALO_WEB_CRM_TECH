'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PiggyBank,
  GraduationCap,
  Home,
  Utensils,
  Bus,
  Gamepad2,
  ArrowRightLeft,
  TrendingDown,
  Info,
} from 'lucide-react';

/**
 * Study Cost Planner Widget
 *
 * Inspired by Studytra's BudgetPlanner:
 * - Country-specific cost defaults (Germany, USA, Canada, UK, Australia)
 * - Slider-based cost adjustment
 * - INR conversion with live rates
 * - Category-wise breakdown with tips
 * - Monthly & yearly totals
 */

// ─── Country Data ────────────────────────────────────────────────────────────

const COUNTRIES = [
  { id: 'de', flag: '🇩🇪', name: 'Germany', currency: 'EUR', symbol: '€', inrRate: 90.5, color: '#1a3a8c' },
  { id: 'us', flag: '🇺🇸', name: 'United States', currency: 'USD', symbol: '$', inrRate: 83.2, color: '#991b1b' },
  { id: 'ca', flag: '🇨🇦', name: 'Canada', currency: 'CAD', symbol: 'CA$', inrRate: 61.8, color: '#c2410c' },
  { id: 'uk', flag: '🇬🇧', name: 'United Kingdom', currency: 'GBP', symbol: '£', inrRate: 105.4, color: '#1d4ed8' },
  { id: 'au', flag: '🇦🇺', name: 'Australia', currency: 'AUD', symbol: 'A$', inrRate: 54.6, color: '#065f46' },
] as const;

const DEFAULTS: Record<string, Record<string, number>> = {
  de: { tuition: 500, rent: 700, food: 250, transport: 90, entertainment: 160 },
  us: { tuition: 2500, rent: 1200, food: 400, transport: 120, entertainment: 230 },
  ca: { tuition: 2000, rent: 1100, food: 350, transport: 100, entertainment: 200 },
  uk: { tuition: 1800, rent: 1000, food: 320, transport: 110, entertainment: 220 },
  au: { tuition: 2200, rent: 1150, food: 380, transport: 130, entertainment: 240 },
};

const CATEGORIES = [
  { key: 'tuition', label: 'Tuition / Sem', emoji: '🎓', Icon: GraduationCap, max: 6000, tip: 'Apply for DAAD, Chevening, or country-specific scholarships to cut tuition' },
  { key: 'rent', label: 'Rent & Utilities', emoji: '🏠', Icon: Home, max: 4000, tip: 'Student dormitories are 30–50% cheaper than private rent' },
  { key: 'food', label: 'Food & Groceries', emoji: '🍱', Icon: Utensils, max: 2000, tip: 'Cook at home 5 days/week — saves 60% vs eating out' },
  { key: 'transport', label: 'Transport', emoji: '🚌', Icon: Bus, max: 500, tip: 'Semester transport passes are often included in tuition' },
  { key: 'entertainment', label: 'Entertainment', emoji: '🎮', Icon: Gamepad2, max: 1000, tip: 'Use student discounts on museums, streaming, and sports' },
] as const;

const SAVING_TIPS: Record<string, string> = {
  de: 'Public universities in Germany are tuition-free for most programs! You only pay a semester contribution (~€300).',
  us: 'Look for TA/RA positions — they often include tuition waiver + stipend.',
  ca: 'Co-op programs let you earn while you learn, offsetting living costs significantly.',
  uk: 'Consider universities outside London — living costs are 40-60% lower.',
  au: 'Student visa allows 48 hours/fortnight of work — plan part-time income.',
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface StudyCostPlannerProps {
  /** Pre-selected country code */
  defaultCountry?: string;
  /** Compact mode for embedding in dashboards */
  compact?: boolean;
  /** Callback when budget changes */
  onBudgetChange?: (monthly: number, yearly: number, inrMonthly: number) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function StudyCostPlanner({
  defaultCountry = 'uk',
  compact = false,
  onBudgetChange,
}: StudyCostPlannerProps) {
  const [countryId, setCountryId] = useState(defaultCountry);
  const country = COUNTRIES.find(c => c.id === countryId) || COUNTRIES[3]; // default UK
  const defaults = DEFAULTS[countryId] || DEFAULTS.uk;

  const [costs, setCosts] = useState<Record<string, number>>(defaults);

  // Update costs when country changes
  const handleCountryChange = (newId: string) => {
    setCountryId(newId);
    setCosts(DEFAULTS[newId] || DEFAULTS.uk);
  };

  const updateCost = (key: string, value: number) => {
    setCosts(prev => ({ ...prev, [key]: value }));
  };

  // Calculate totals
  const { monthly, yearly, inrMonthly, inrYearly } = useMemo(() => {
    const m = Object.values(costs).reduce((a, b) => a + b, 0);
    const y = m * 12;
    const im = Math.round(m * country.inrRate);
    const iy = im * 12;
    return { monthly: m, yearly: y, inrMonthly: im, inrYearly: iy };
  }, [costs, country.inrRate]);

  // Notify parent
  useMemo(() => {
    onBudgetChange?.(monthly, yearly, inrMonthly);
  }, [monthly, yearly, inrMonthly, onBudgetChange]);

  const tip = SAVING_TIPS[countryId];

  return (
    <Card className="border border-alo-gray-medium/60 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <PiggyBank className="h-5 w-5 text-alo-orange" />
            Study Cost Planner
          </CardTitle>
          <Badge variant="outline" className="border-alo-blue/20 bg-alo-blue-light text-alo-blue text-xs">
            {country.flag} {country.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Country Selector */}
        <Select value={countryId} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground">({c.currency})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Country-specific saving tip */}
        {tip && (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <TrendingDown className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <p className="text-xs text-emerald-800 leading-relaxed">{tip}</p>
          </div>
        )}

        {/* Cost Sliders */}
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const CatIcon = cat.Icon;
            const value = costs[cat.key] ?? 0;
            const pct = Math.round((value / cat.max) * 100);

            return (
              <div key={cat.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <CatIcon className="h-4 w-4 text-alo-blue" />
                    {cat.label}
                  </label>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {country.symbol}{value.toLocaleString()}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">/mo</span>
                  </span>
                </div>
                <Slider
                  value={[value]}
                  min={0}
                  max={cat.max}
                  step={10}
                  onValueChange={([v]) => updateCost(cat.key, v)}
                  className="w-full"
                />
                {/* Mini tip on hover */}
                {!compact && pct > 70 && (
                  <p className="flex items-center gap-1 text-[10px] text-amber-600">
                    <Info className="h-3 w-3" />
                    {cat.tip}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="rounded-xl bg-gradient-to-r from-alo-blue/5 to-alo-orange/5 border border-alo-gray-medium/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Monthly Total</span>
            <span className="text-lg font-bold tabular-nums text-alo-blue">
              {country.symbol}{monthly.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Yearly Total</span>
            <span className="text-lg font-bold tabular-nums text-alo-blue">
              {country.symbol}{yearly.toLocaleString()}
            </span>
          </div>

          {/* INR Conversion */}
          <div className="border-t border-alo-gray-medium/30 pt-3 mt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowRightLeft className="h-3.5 w-3.5 text-alo-orange" />
              <span className="text-xs font-medium text-muted-foreground">Approx. in INR (₹)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Monthly</span>
              <span className="text-base font-bold tabular-nums text-alo-orange">
                ₹{inrMonthly.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Yearly</span>
              <span className="text-base font-bold tabular-nums text-alo-orange">
                ₹{inrYearly.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Exchange rate note */}
          <p className="text-[10px] text-muted-foreground text-right">
            Rate: 1 {country.currency} = ₹{country.inrRate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
