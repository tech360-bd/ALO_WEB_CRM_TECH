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
    <div className="min-h-screen bg-slate-50 pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          href="/team" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B5ED7] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Meet the full team
        </Link>

        <Card className="p-8 border-none shadow-md bg-white">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="h-48 w-48 rounded-full bg-gradient-to-br from-[#0B5ED7] to-[#003d80] flex items-center justify-center text-white font-bold text-6xl shadow-lg mb-6">
                {member.name[0]}
              </div>
              <Button className="w-full bg-[#0B5ED7] hover:bg-[#003d80] text-white flex gap-2">
                <Mail className="h-4 w-4" /> Contact {member.name.split(' ')[0]}
              </Button>
            </div>

            <div className="w-full md:w-2/3">
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">{member.name}</h1>
              <p className="text-lg font-medium text-[#F97316] mb-6">{member.role}</p>
              
              <div className="prose prose-slate max-w-none mb-8">
                <p className="text-slate-600 leading-relaxed">{member.bio}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-[#0B5ED7]" /> Specializations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {member.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary" className="bg-blue-50 text-[#0B5ED7]">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-[#0B5ED7]" /> Universities Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {member.universitiesExpertise.map((uni) => (
                      <Badge key={uni} variant="secondary" className="bg-orange-50 text-[#F97316]">
                        {uni}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4 text-[#0B5ED7]" /> Languages & Experience
                  </h3>
                  <p className="text-sm text-slate-600 mb-1">
                    <span className="font-medium text-slate-800">Experience:</span> {member.yearsExperience}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Languages:</span> {member.languages.join(', ')}
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
