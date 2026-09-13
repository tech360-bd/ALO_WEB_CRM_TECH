'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Building2, Award, Globe, GraduationCap, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  sourceType: string; // university, course, scholarship, service, resource, language_test, country
  sourceId?: string;
  sourceSlug: string;
  country?: string;
  universityId?: string;
  subjectArea?: string;
  studyLevel?: string;
  title?: string;
}

const TYPE_ICON: Record<string, any> = {
  course: GraduationCap,
  university: Building2,
  scholarship: Award,
  resource: BookOpen,
  service: Globe,
  faq: HelpCircle,
  country: Globe,
  language_test: BookOpen,
};

const TYPE_LINK: Record<string, (slug: string) => string> = {
  course: (s) => `/course/${s}`,
  university: (s) => `/universities/${s}`,
  scholarship: (s) => `/scholarships/${s}`,
  resource: (s) => `/resources/${s}`,
  service: (s) => `/services/${s}`,
  faq: (s) => `/faqs#${s}`,
  country: (s) => `/destinations/${s}`,
  language_test: (s) => `/language-prep/${s}`,
};

export default function RelatedContentEngine({ sourceType, sourceId = '', sourceSlug, country, universityId, subjectArea, studyLevel, title = 'Related Information' }: Props) {
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('sourceType', sourceType);
    if (sourceId) params.set('sourceId', sourceId);
    params.set('sourceSlug', sourceSlug);
    if (country) params.set('country', country);
    if (universityId) params.set('universityId', universityId);
    if (subjectArea) params.set('subjectArea', subjectArea);
    if (studyLevel) params.set('studyLevel', studyLevel);
    params.set('limit', '8');

    fetch(`/api/related-content?${params.toString()}`)
      .then(r => r.json())
      .then(d => setRelated(d.related || []))
      .catch(() => setRelated([]))
      .finally(() => setLoading(false));
  }, [sourceType, sourceId, sourceSlug, country, universityId, subjectArea, studyLevel]);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (related.length === 0) {
    return (
      <Card className="p-6 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl">
        <p className="text-sm text-gray-600">No related content yet. Related content engine will populate based on country, university, course, study level, subject, tags priority: exact relationship → same university → same country → same subject → same destination → same tag/category.</p>
        <div className="flex gap-2 mt-4">
          <Link href="/course-finder"><Button size="sm" className="bg-[#0057B8] text-white h-11">Find Courses</Button></Link>
          <Link href="/book-consultation"><Button size="sm" variant="outline" className="border-[#E2E8F0] h-11">Book Consultation</Button></Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#0F172A]">{title}</h3>
        <Badge className="bg-[#F8FAFC] text-gray-600 border-[#E2E8F0] text-[10px]">{related.length} related items — DB-driven</Badge>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {related.slice(0, 8).map((item: any, i: number) => {
          const Icon = TYPE_ICON[item.type] || BookOpen;
          const linkFn = TYPE_LINK[item.type] || ((s: string) => `/${item.type}/${s}`);
          const href = linkFn(item.slug);
          return (
            <Link key={i} href={href}>
              <Card className="p-4 bg-white border-[#E2E8F0] hover:border-[#0057B8] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center"><Icon className="w-4 h-4 text-[#0057B8]" /></div>
                    <Badge className="bg-[#F8FAFC] text-gray-600 border-[#E2E8F0] text-[10px]">{item.relation?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-[#0F172A] line-clamp-2 mb-1">{item.title}</h4>
                  {item.subtitle && <p className="text-xs text-gray-500 line-clamp-1">{item.subtitle}</p>}
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#0057B8]">View Details <ArrowRight className="w-3 h-3" /></div>
              </Card>
            </Link>
          );
        })}
      </div>
      {related.length > 4 && (
        <div className="text-center pt-2">
          <Link href={`/course-finder?university=${universityId || ''}&country=${country || ''}`}><Button variant="outline" className="border-[#E2E8F0] text-xs h-11">View More Related Information</Button></Link>
        </div>
      )}
    </div>
  );
}
