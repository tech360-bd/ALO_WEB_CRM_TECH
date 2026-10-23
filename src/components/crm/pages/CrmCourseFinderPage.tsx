'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Search, SlidersHorizontal, Star, GraduationCap, MapPin,
  Globe, Clock, BookOpen, Award, ChevronLeft, ChevronRight,
} from 'lucide-react';

interface CourseData {
  id: string;
  courseId: string;
  courseTitle: string;
  studyLevel: string;
  programLevel: string;
  subjectArea: string;
  universityId: string;
  durationMonths: number;
  university?: { name: string; country: string; city: string; worldRanking: number; ranking: number };
  tuition: number;
  tuitionCurrency: string;
  intakeMonth: string;
  ieltsRequired: number;
  ieltsMinBand: number;
  pteRequired: number;
}

const COUNTRIES = [
  'all', 'United Kingdom', 'Australia', 'Canada', 'United States',
  'Germany', 'New Zealand', 'Ireland', 'Malaysia',
];
const LEVELS = ['all', 'Undergraduate', 'Postgraduate', 'Foundation', 'PhD'];
const SUBJECTS = ['all', 'Computer Science', 'Business', 'Engineering', 'Data Science', 'Finance', 'Biomedical Science', 'Law', 'Artificial Intelligence'];

export default function CrmCourseFinderPage() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [level, setLevel] = useState('all');
  const [subject, setSubject] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search) params.set('search', search);
        if (country !== 'all') params.set('country', country);
        if (level !== 'all') params.set('level', level);
        if (subject !== 'all') params.set('subject', subject);
        const res = await fetch(`/api/crm/courses?${params}`);
        const data = await res.json();
        if (data.success) {
          setCourses(data.data);
          setTotalPages(data.pagination.pages);
          setTotal(data.pagination.total);
        }
      } catch { /* keep existing data */ }
      setLoading(false);
    };
    fetchData();
  }, [search, country, level, subject, page]);

  const currencySymbol = (c: string) => {
    const map: Record<string, string> = { GBP: '£', AUD: 'A$', CAD: 'C$', EUR: '€', NZD: 'NZ$', MYR: 'RM', USD: '$' };
    return map[c] || c;
  };

  const countryFlag = (c: string) => {
    const map: Record<string, string> = {
      'United Kingdom': '🇬🇧', 'Australia': '🇦🇺', 'Canada': '🇨🇦',
      'United States': '🇺🇸', 'Germany': '🇩🇪', 'New Zealand': '🇳🇿',
      'Ireland': '🇮🇪', 'Malaysia': '🇲🇾',
    };
    return map[c] || '🌍';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Course Finder</h1>
          <p className="text-sm text-alo-text-secondary mt-1">
            {total} courses across 72 universities in 8 countries
          </p>
        </div>
        <Badge variant="brand" className="text-xs w-fit">
          <GraduationCap className="w-3 h-3 mr-1" /> Live Database
        </Badge>
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4 text-alo-text-muted" />
            <span className="text-sm font-semibold text-alo-text">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
              <Input placeholder="Search courses or universities..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={country} onValueChange={(v) => { setCountry(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c === 'all' ? 'All Countries' : `${countryFlag(c)} ${c}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={(v) => { setLevel(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>{l === 'all' ? 'All Levels' : l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={subject} onValueChange={(v) => { setSubject(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border border-alo-border rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="border border-alo-border rounded-xl">
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-alo-text-muted/30 mx-auto mb-3" />
            <p className="text-alo-text font-medium">No courses found</p>
            <p className="text-sm text-alo-text-muted mt-1">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {courses.map((course) => (
              <Card key={course.id} className="bg-white rounded-xl border border-alo-border hover:border-alo-brand/30 hover:shadow-sm transition-all">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {course.university && (
                          <span className="text-xs text-alo-text-muted">
                            {countryFlag(course.university.country)} {course.university.name}
                            {course.university.worldRanking > 0 && (
                              <Badge variant="muted" className="ml-1 text-[11px]">QS #{course.university.worldRanking}</Badge>
                            )}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-alo-text mb-1.5 leading-snug">
                        {course.courseTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-alo-text-secondary">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />{course.programLevel}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />{course.studyLevel}
                        </span>
                        {course.subjectArea && (
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />{course.subjectArea}
                          </span>
                        )}
                        {course.durationMonths > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{course.durationMonths} months
                          </span>
                        )}
                        {course.intakeMonth && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{course.intakeMonth} intake
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-6 shrink-0">
                      {course.ieltsRequired > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-alo-text-muted">IELTS</p>
                          <p className="text-sm font-bold text-alo-text">{course.ieltsRequired}</p>
                          <p className="text-[11px] text-alo-text-muted">min {course.ieltsMinBand}/band</p>
                        </div>
                      )}
                      {course.tuition > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-alo-text-muted">Tuition/yr</p>
                          <p className="text-sm font-bold text-alo-brand">
                            {currencySymbol(course.tuitionCurrency)}{course.tuition.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-alo-text-muted">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}