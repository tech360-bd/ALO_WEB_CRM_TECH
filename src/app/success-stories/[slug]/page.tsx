import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Quote, Award, BookOpen, User, Building2, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const SUCCESS_STORIES = [
  {
    slug: 'tushar-imran-nahid',
    name: 'Tushar Imran Nahid',
    course: 'BSc Business Management',
    university: 'Ravensbourne University London',
    scholarship: '£2,000 International Award',
    challenge: 'Overcoming technical issues during the visa process which caused unexpected delays and stress.',
    quote: 'I have recently received my UK student visa for my BSc in Business Management with International Year at Ravensbourne University London. Due to some technical issues, the process took a little longer than expected and both I and my family were quite stressed. However, ALO Education Consultancy gave me full support, courage, and proper guidance throughout the entire journey. I am extremely satisfied with their service and professionalism. I highly recommend everyone to apply for their visa through ALO Education. They are simply the best!',
    advisor: 'Taslima Akter',
    timeline: [
      { step: 'Initial Enquiry', date: 'March 2023', description: 'Contacted ALO for UK study options.' },
      { step: 'University Selection', date: 'April 2023', description: 'Selected Ravensbourne University.' },
      { step: 'Application Submitted', date: 'May 2023', description: 'Applied for BSc Business Management.' },
      { step: 'Offer Received', date: 'June 2023', description: 'Received conditional offer.' },
      { step: 'Visa Approved', date: 'August 2023', description: 'Successfully received UK student visa.' },
      { step: 'Enrollment', date: 'September 2023', description: 'Started classes in London.' },
    ],
  },
  {
    slug: 'ummaye-mayesha-mannan',
    name: 'Ummaye Mayesha Mannan',
    course: 'MRes Leadership and Management',
    university: 'University of Derby',
    scholarship: 'Vice-Chancellor Scholarship',
    challenge: 'Securing a research-focused Master\'s program with specific career alignment.',
    quote: 'I recently received my UK student visa for Master of Research in Leadership and Management at University of Derby. ALO Education Consultancy provided full support, guidance, and encouragement throughout. I\'m extremely satisfied with their professionalism and highly recommend their services.',
    advisor: 'Taslima Akter',
    timeline: [
      { step: 'Initial Enquiry', date: 'February 2023', description: 'Discussed research aspirations.' },
      { step: 'Application Submitted', date: 'April 2023', description: 'Submitted research proposal and application.' },
      { step: 'Offer & Scholarship', date: 'May 2023', description: 'Received offer with scholarship.' },
      { step: 'Visa Approved', date: 'July 2023', description: 'Visa successfully granted.' },
      { step: 'Enrollment', date: 'September 2023', description: 'Joined University of Derby.' },
    ],
  },
];

export function generateStaticParams() {
  return SUCCESS_STORIES.map((story) => ({
    slug: story.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = SUCCESS_STORIES.find((s) => s.slug === slug);
  if (!story) return { title: 'Story Not Found' };
  return {
    title: `${story.name}'s Success Story | ALO Education`,
    description: `Read how ${story.name} secured admission at ${story.university} with ALO Education.`,
  };
}

export default async function SuccessStoryDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = SUCCESS_STORIES.find((s) => s.slug === slug);

  if (!story) {
    notFound();
  }

  const relatedStories = SUCCESS_STORIES.filter(s => s.slug !== story.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-white pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          href="/success-stories" 
          className="inline-flex items-center gap-2 text-sm text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all stories
        </Link>

        <div className="bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-3xl p-8 md:p-12 text-white mb-10 shadow-xl relative overflow-hidden">
          <Quote className="absolute -right-6 -bottom-6 h-48 w-48 text-white/10 rotate-12" />
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-white flex items-center justify-center text-[var(--alo-brand)] font-bold text-5xl shadow-lg border-4 border-white/20 shrink-0">
              {story.name[0]}
            </div>
            <div>
              <div className="flex gap-1 mb-4 justify-center md:justify-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-[var(--alo-cta)] text-[var(--alo-cta)]" />
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center md:text-left">{story.name}</h1>
              <p className="text-[var(--alo-brand-pale)] text-lg text-center md:text-left flex flex-col md:flex-row md:items-center gap-2">
                <span><BookOpen className="inline h-4 w-4 mr-1"/> {story.course}</span>
                <span className="hidden md:inline">•</span>
                <span><Building2 className="inline h-4 w-4 mr-1"/> {story.university}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2 space-y-8">
            <Card className="p-8 border-[var(--alo-border)] shadow-sm relative">
              <Quote className="absolute top-6 left-6 h-8 w-8 text-[var(--alo-brand)]/20" />
              <p className="text-lg text-[var(--alo-body)] italic leading-relaxed pt-8">
                "{story.quote}"
              </p>
            </Card>

            <div>
              <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-4">The Journey</h2>
              <Card className="p-6 border-[var(--alo-border)] shadow-sm">
                <div className="space-y-6">
                  {story.timeline.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-[var(--alo-cta)] mt-1.5" />
                        {index !== story.timeline.length - 1 && (
                          <div className="w-px h-full bg-[var(--alo-page)] my-1" />
                        )}
                      </div>
                      <div className="pb-2">
                        <span className="text-xs font-semibold text-[var(--alo-brand)] bg-[var(--alo-brand-pale)] px-2 py-1 rounded-full mb-1 inline-block">
                          {item.date}
                        </span>
                        <h4 className="font-bold text-[var(--alo-text)]">{item.step}</h4>
                        <p className="text-sm text-[var(--alo-body)] mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-[var(--alo-page)] border-none">
              <h3 className="font-bold text-[var(--alo-text)] mb-4">Highlights</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[var(--alo-text-muted)] font-semibold uppercase mb-1 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-[var(--alo-cta)]" /> Scholarship
                  </p>
                  <p className="text-sm font-medium text-[var(--alo-text)]">{story.scholarship}</p>
                </div>
                
                <div>
                  <p className="text-xs text-[var(--alo-text-muted)] font-semibold uppercase mb-1 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[var(--alo-brand)]" /> ALO Advisor
                  </p>
                  <p className="text-sm font-medium text-[var(--alo-text)]">{story.advisor}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-[var(--alo-brand)] text-white border-none text-center">
              <h3 className="font-bold mb-2">Start Your Own Journey</h3>
              <p className="text-[var(--alo-brand-pale)] text-sm mb-4">
                Let our experts help you achieve your study abroad dreams just like {story.name.split(' ')[0]}.
              </p>
              <Link href="/eligibility-check">
                <Button className="w-full bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white">
                  Check Your Eligibility
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        {relatedStories.length > 0 && (
          <div className="border-t border-[var(--alo-border)] pt-10">
            <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-6">More Success Stories</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedStories.map((rs) => (
                <Card key={rs.slug} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-brand-hover)] flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {rs.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--alo-text)]">{rs.name}</h4>
                      <p className="text-xs text-[var(--alo-brand)] line-clamp-1">{rs.course}</p>
                    </div>
                  </div>
                  <Link href={`/success-stories/${rs.slug}`}>
                    <Button variant="outline" className="w-full ">Read Full Story</Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
