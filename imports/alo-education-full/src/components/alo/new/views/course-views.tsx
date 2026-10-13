'use client';

import { CourseFinder } from '@/components/alo/new/course-finder/course-finder';
import { CourseDetail } from '@/components/alo/new/course-finder/course-detail';
import { UniversityDetail } from '@/components/alo/new/course-finder/university-detail';

export type CourseViewKey = 'course-finder' | 'course-detail' | 'university-detail';

interface CourseViewsProps {
  view: CourseViewKey;
  courseSlug?: string;
  universitySlug?: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

export function CourseViews({ view, courseSlug, universitySlug, onBack, onNavigate, onLeadOpen }: CourseViewsProps) {
  switch (view) {
    case 'course-finder':
      return <CourseFinder onBack={onBack} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    case 'course-detail':
      return <CourseDetail courseSlug={courseSlug || ''} onBack={() => onNavigate('course-finder')} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    case 'university-detail':
      return <UniversityDetail universitySlug={universitySlug || ''} onBack={() => onNavigate('course-finder')} onNavigate={onNavigate} onLeadOpen={onLeadOpen} />;
    default:
      return null;
  }
}
