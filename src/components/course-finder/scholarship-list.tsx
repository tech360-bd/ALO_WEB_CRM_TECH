'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Award, Building2, MapPin, Send, SearchX, Globe,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { COUNTRIES, COUNTRY_FLAGS } from './types';
import type { Scholarship } from './types';

const MOCK_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'sch1', universityName: 'University of Melbourne', courseName: 'MSc Data Science',
    scholarshipName: 'Melbourne Graduate Scholarship', amount: 15000, currency: 'AUD', country: 'Australia',
  },
  {
    id: 'sch2', universityName: 'University of Manchester', courseName: 'MBA',
    scholarshipName: 'Manchester Global Excellence Award', amount: 10000, currency: 'GBP', country: 'UK',
  },
  {
    id: 'sch3', universityName: 'University of Toronto', courseName: 'BSc Engineering',
    scholarshipName: 'Lester B. Pearson International Scholarship', amount: 40000, currency: 'CAD', country: 'Canada',
  },
  {
    id: 'sch4', universityName: 'TU Munich', courseName: 'MSc Informatics',
    scholarshipName: 'DAAD Scholarship', amount: 18000, currency: 'EUR', country: 'Germany',
  },
  {
    id: 'sch5', universityName: 'University College Dublin', courseName: 'BBA',
    scholarshipName: 'UCD Global Excellence Scholarship', amount: 5000, currency: 'EUR', country: 'Ireland',
  },
  {
    id: 'sch6', universityName: 'Seoul National University', courseName: 'MA International Studies',
    scholarshipName: 'Korean Government Scholarship (KGSP)', amount: 25000, currency: 'KRW', country: 'South Korea',
  },
  {
    id: 'sch7', universityName: 'University of Auckland', courseName: 'MSc Computer Science',
    scholarshipName: 'Auckland Doctoral Scholarship', amount: 28000, currency: 'NZD', country: 'New Zealand',
  },
  {
    id: 'sch8', universityName: 'Universiti Malaya', courseName: 'MBBS',
    scholarshipName: 'Malaysia International Scholarship', amount: 8000, currency: 'MYR', country: 'Malaysia',
  },
  {
    id: 'sch9', universityName: 'University of Copenhagen', courseName: 'MSc Public Health',
    scholarshipName: 'Copenhagen Global Scholarship', amount: 12000, currency: 'EUR', country: 'Denmark',
  },
];

const MOCK_UNIVERSITY_NAMES = [
  'University of Melbourne',
  'University of Manchester',
  'University of Toronto',
  'TU Munich',
  'University College Dublin',
  'Seoul National University',
  'University of Auckland',
  'Universiti Malaya',
  'University of Copenhagen',
];

function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* University */}
        <p className="text-sm font-medium text-emerald-600">
          {COUNTRY_FLAGS[scholarship.country]} {scholarship.universityName}
        </p>

        {/* Course */}
        <p className="text-xs text-slate-500">{scholarship.courseName}</p>

        {/* Scholarship Name */}
        <h3 className="font-semibold text-slate-900 text-sm leading-snug">
          {scholarship.scholarshipName}
        </h3>

        {/* Amount */}
        <div className="flex items-center gap-2">
          <Award className="size-5 text-emerald-500" />
          <div>
            <span className="text-xl font-bold text-slate-900">
              {scholarship.currency} {scholarship.amount.toLocaleString()}
            </span>
            {scholarship.currency !== 'KRW' && scholarship.currency !== 'JPY' && scholarship.currency !== 'MYR' && (
              <span className="text-xs text-slate-500 ml-1">per year</span>
            )}
          </div>
        </div>

        {/* Enquire */}
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm mt-1"
          onClick={() => toast.success(`Enquiry sent for "${scholarship.scholarshipName}"`)}
        >
          <Send className="size-4 mr-1.5" />
          Enquire
        </Button>
      </CardContent>
    </Card>
  );
}

function ScholarshipCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export function ScholarshipList() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState('all');
  const [universityFilter, setUniversityFilter] = useState('all');

  const fetchScholarships = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (countryFilter !== 'all') params.set('country', countryFilter);
      if (universityFilter !== 'all') params.set('university', universityFilter);

      const res = await fetch(`/api/scholarships?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setScholarships(data.scholarships || []);
    } catch {
      setScholarships(MOCK_SCHOLARSHIPS);
    } finally {
      setLoading(false);
    }
  }, [countryFilter, universityFilter]);

  useEffect(() => { fetchScholarships(); }, [fetchScholarships]);

  const filtered = scholarships.filter((s) => {
    if (countryFilter !== 'all' && s.country !== countryFilter) return false;
    if (universityFilter !== 'all' && s.universityName !== universityFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 mb-1">
            <Award className="size-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Scholarships</h1>
          <p className="text-emerald-100 mt-2 text-sm sm:text-base">
            Find scholarships to fund your international education
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Globe className="size-4 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {COUNTRY_FLAGS[c]} {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={universityFilter} onValueChange={setUniversityFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <Building2 className="size-4 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Universities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {MOCK_UNIVERSITY_NAMES.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(countryFilter !== 'all' || universityFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCountryFilter('all');
                setUniversityFilter('all');
              }}
              className="text-xs text-slate-500"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ScholarshipCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <SearchX className="size-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No scholarships found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'scholarship' : 'scholarships'} available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((sch) => (
                <ScholarshipCard key={sch.id} scholarship={sch} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}