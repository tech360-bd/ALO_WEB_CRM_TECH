'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  SlidersHorizontal,
  X,
  GraduationCap,
  MapPin,
  DollarSign,
  Clock,
  Star,
  Filter,
  ChevronDown,
  BookOpen,
  Globe,
} from 'lucide-react';

/**
 * Enhanced Course Finder Filter Bar
 *
 * Patterns from Studytra:
 * - Country quick-select with flag badges
 * - Field of study pills
 * - Degree level toggle (Bachelor/Master/PhD)
 * - Tuition range filter
 * - IELTS minimum filter
 *
 * Patterns from Nabal Education Figma:
 * - Clean horizontal filter bar
 * - Search with icon
 * - Active filter count badge
 *
 * Patterns from NextStep-Abroad:
 * - Category filter dropdown
 * - Debounced search
 * - View toggle (grid/list)
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const COUNTRIES = [
  { id: 'uk', flag: '🇬🇧', name: 'UK' },
  { id: 'us', flag: '🇺🇸', name: 'USA' },
  { id: 'ca', flag: '🇨🇦', name: 'Canada' },
  { id: 'de', flag: '🇩🇪', name: 'Germany' },
  { id: 'au', flag: '🇦🇺', name: 'Australia' },
  { id: 'ie', flag: '🇮🇪', name: 'Ireland' },
  { id: 'nz', flag: '🇳🇿', name: 'NZ' },
] as const;

const FIELDS = [
  'Computer Science', 'Business', 'Engineering', 'Medicine',
  'Data Science', 'Finance', 'Law', 'Arts', 'Psychology', 'Biology',
] as const;

const DEGREE_LEVELS = ['Bachelor', 'Master', 'PhD', 'Diploma'] as const;

const IELTS_OPTIONS = ['6.0', '6.5', '7.0', '7.5', '8.0'] as const;

const TUITION_RANGES = [
  { id: 'free', label: 'Free / Scholarship', min: 0, max: 0 },
  { id: 'low', label: 'Under €5K/yr', min: 1, max: 5000 },
  { id: 'mid', label: '€5K – €15K/yr', min: 5000, max: 15000 },
  { id: 'high', label: '€15K – €30K/yr', min: 15000, max: 30000 },
  { id: 'premium', label: '€30K+/yr', min: 30000, max: 999999 },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CourseFilterState {
  search: string;
  countries: string[];
  fields: string[];
  degreeLevels: string[];
  ieltsMin: string;
  tuitionRange: string;
}

interface EnhancedCourseFilterBarProps {
  filters: CourseFilterState;
  onFiltersChange: (filters: CourseFilterState) => void;
  resultCount?: number;
  /** Whether to show advanced filters */
  showAdvanced?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function EnhancedCourseFilterBar({
  filters,
  onFiltersChange,
  resultCount,
  showAdvanced = true,
}: EnhancedCourseFilterBarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.countries.length > 0) count++;
    if (filters.fields.length > 0) count++;
    if (filters.degreeLevels.length > 0) count++;
    if (filters.ieltsMin) count++;
    if (filters.tuitionRange) count++;
    return count;
  }, [filters]);

  // Toggle helpers
  const toggleCountry = (id: string) => {
    const updated = filters.countries.includes(id)
      ? filters.countries.filter(c => c !== id)
      : [...filters.countries, id];
    onFiltersChange({ ...filters, countries: updated });
  };

  const toggleField = (field: string) => {
    const updated = filters.fields.includes(field)
      ? filters.fields.filter(f => f !== field)
      : [...filters.fields, field];
    onFiltersChange({ ...filters, fields: updated });
  };

  const toggleDegreeLevel = (level: string) => {
    const updated = filters.degreeLevels.includes(level)
      ? filters.degreeLevels.filter(l => l !== level)
      : [...filters.degreeLevels, level];
    onFiltersChange({ ...filters, degreeLevels: updated });
  };

  const clearAll = () => {
    onFiltersChange({
      search: '',
      countries: [],
      fields: [],
      degreeLevels: [],
      ieltsMin: '',
      tuitionRange: '',
    });
  };

  return (
    <div className="space-y-3">
      {/* ── Main Filter Row ──────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses, universities, or subjects..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 pr-3"
          />
        </div>

        {/* Advanced Filter Toggle */}
        {showAdvanced && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'shrink-0 gap-1.5',
              activeFilterCount > 0 && 'border-alo-blue text-alo-blue'
            )}
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-alo-blue text-white border-0">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Result count */}
        {resultCount !== undefined && (
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {resultCount.toLocaleString()} results
          </span>
        )}
      </div>

      {/* ── Country Quick Select ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <span className="text-xs text-muted-foreground shrink-0 mr-1">
          <Globe className="h-3.5 w-3.5 inline" />
        </span>
        {COUNTRIES.map(c => {
          const isActive = filters.countries.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={cn(
                'shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-alo-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              onClick={() => toggleCountry(c.id)}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Degree Level Toggle ──────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0 mr-1">
          <GraduationCap className="h-3.5 w-3.5 inline" />
        </span>
        {DEGREE_LEVELS.map(level => {
          const isActive = filters.degreeLevels.includes(level);
          return (
            <button
              key={level}
              type="button"
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-alo-orange text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              onClick={() => toggleDegreeLevel(level)}
            >
              {level}
            </button>
          );
        })}
      </div>

      {/* ── Advanced Filters (Collapsible) ───────────────────────── */}
      {isAdvancedOpen && (
        <Card className="border border-alo-gray-medium/60">
          <CardContent className="p-4 space-y-4">
            {/* Field of Study */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-alo-blue" />
                Field of Study
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FIELDS.map(field => {
                  const isActive = filters.fields.includes(field);
                  return (
                    <button
                      key={field}
                      type="button"
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-alo-blue-light text-alo-blue border border-alo-blue/30'
                          : 'bg-gray-50 text-gray-600 border border-transparent hover:border-gray-200'
                      )}
                      onClick={() => toggleField(field)}
                    >
                      {field}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* IELTS + Tuition Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-alo-blue" />
                  Min IELTS Score
                </p>
                <Select
                  value={filters.ieltsMin}
                  onValueChange={(v) => onFiltersChange({ ...filters, ieltsMin: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {IELTS_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>
                        {opt}+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-alo-blue" />
                  Tuition Range
                </p>
                <Select
                  value={filters.tuitionRange}
                  onValueChange={(v) => onFiltersChange({ ...filters, tuitionRange: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {TUITION_RANGES.map(range => (
                      <SelectItem key={range.id} value={range.id}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-alo-gray-medium/30">
                <span className="text-xs text-muted-foreground">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </span>
                <Button variant="ghost" size="sm" className="text-xs text-alo-orange" onClick={clearAll}>
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Active Filter Tags ───────────────────────────────────── */}
      {activeFilterCount > 0 && !isAdvancedOpen && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.countries.map(id => {
            const c = COUNTRIES.find(c => c.id === id);
            return c ? (
              <Badge key={id} className="gap-1 text-[10px] bg-alo-blue-light text-alo-blue border-0">
                {c.flag} {c.name}
                <button type="button" onClick={() => toggleCountry(id)} className="ml-0.5 hover:text-alo-blue/70">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ) : null;
          })}
          {filters.fields.map(f => (
            <Badge key={f} className="gap-1 text-[10px] bg-alo-orange-light text-alo-orange border-0">
              {f}
              <button type="button" onClick={() => toggleField(f)} className="ml-0.5 hover:text-alo-orange/70">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          {filters.degreeLevels.map(l => (
            <Badge key={l} className="gap-1 text-[10px] bg-violet-50 text-violet-700 border-0">
              {l}
              <button type="button" onClick={() => toggleDegreeLevel(l)} className="ml-0.5 hover:text-violet-500">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Default Filter State ────────────────────────────────────────────────────

export const DEFAULT_COURSE_FILTERS: CourseFilterState = {
  search: '',
  countries: [],
  fields: [],
  degreeLevels: [],
  ieltsMin: '',
  tuitionRange: '',
};
