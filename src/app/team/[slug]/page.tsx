import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, BookOpen, GraduationCap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const TEAM_MEMBERS = [
  {
    name: 'Taslima Akter',
    slug: 'taslima-akter',
    role: 'Founder & CEO',
    bio: 'Visionary leader with a passion for making international education accessible to all students. With years of experience in the education consultancy sector, Taslima has helped countless students achieve their dreams of studying abroad.',
    specializations: ['Strategic Planning', 'University Partnerships', 'Student Mentorship'],
    yearsExperience: '10+',
    universitiesExpertise: ['UK', 'USA', 'Australia', 'Canada', 'Europe'],
    languages: ['English', 'Bengali'],
    email: 'taslima@aloeducation.com',
  },
];

export function generateStaticParams() {
  return TEAM_MEMBERS.map((member) => ({
    slug: member.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = TEAM_MEMBERS.find((m) => m.slug === slug);
  if (!member) return { title: 'Member Not Found' };
  return {
    title: `${member.name} - ${member.role} | ALO Education Team`,
    description: member.bio,
  };
}

export default async function TeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = TEAM_MEMBERS.find((m) => m.slug === slug);

  if (!member) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          href="/team" 
          className="inline-flex items-center gap-2 text-sm text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Meet the full team
        </Link>

        <Card className="p-8 border-none shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="h-48 w-48 rounded-full bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-brand-hover)] flex items-center justify-center text-white font-bold text-6xl shadow-lg mb-6">
                {member.name[0]}
              </div>
              <Button asChild className="w-full bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white flex gap-2">
                <Link href="/contact"><Mail className="h-4 w-4" /> Contact {member.name.split(' ')[0]}</Link>
              </Button>
            </div>

            <div className="w-full md:w-2/3">
              <h1 className="text-3xl font-bold text-[var(--alo-text)] mb-2">{member.name}</h1>
              <p className="text-lg font-medium text-[var(--alo-cta)] mb-6">{member.role}</p>
              
              <div className="prose prose-slate max-w-none mb-8">
                <p className="text-[var(--alo-body)] leading-relaxed">{member.bio}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-[var(--alo-text)] flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-[var(--alo-brand)]" /> Specializations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {member.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary" className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-[var(--alo-text)] flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-[var(--alo-brand)]" /> Universities Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {member.universitiesExpertise.map((uni) => (
                      <Badge key={uni} variant="secondary" className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]">
                        {uni}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-[var(--alo-text)] flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4 text-[var(--alo-brand)]" /> Languages & Experience
                  </h3>
                  <p className="text-sm text-[var(--alo-body)] mb-1">
                    <span className="font-medium text-[var(--alo-text)]">Experience:</span> {member.yearsExperience}
                  </p>
                  <p className="text-sm text-[var(--alo-body)]">
                    <span className="font-medium text-[var(--alo-text)]">Languages:</span> {member.languages.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
