import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServiceBySlug, MASTER_SERVICES_DATA } from '@/lib/services-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  Layers,
  Shield,
  Star,
  Users,
  ArrowRight,
} from 'lucide-react';

export async function generateStaticParams() {
  return MASTER_SERVICES_DATA.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: 'Our Services | ALO Education',
      description: 'Comprehensive study abroad services for international students.',
    };
  }

  return {
    title: service.seoTitle,
    description: service.seoDescription,
    alternates: {
      canonical: `https://aloeducation.com/services/${service.slug}`,
    },
    openGraph: {
      title: service.title,
      description: service.seoDescription,
      url: `https://aloeducation.com/services/${service.slug}`,
      images: [{ url: service.heroImage }],
      type: 'website',
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getServiceBySlug(slug);

  if (!s) {
    notFound();
  }

  // Schema.org Service JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.title,
    description: s.longDescription,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'ALO Education Bangladesh',
      url: 'https://aloeducation.com',
    },
    areaServed: 'Bangladesh',
    serviceType: 'Study Abroad Advisory',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex-1 pt-20 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* BREADCRUMB */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
            <a href="/" className="hover:text-[#0057B8]">Home</a>
            <span>›</span>
            <a href="/services" className="hover:text-[#0057B8]">Services</a>
            <span>›</span>
            <span className="text-[#0057B8] font-bold">{s.title}</span>
          </nav>

          {/* HERO BANNER WITH IMAGE */}
          <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-3xl p-8 md:p-12 text-white mb-10 shadow-xl overflow-hidden relative">
            <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <Badge className="bg-[#E8501A] text-white font-bold text-xs px-3 py-1 uppercase">
                  ALO COMPREHENSIVE SERVICE
                </Badge>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{s.title}</h1>
                <p className="text-base text-blue-100 leading-relaxed font-normal">{s.longDescription}</p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <a href="/eligibility-check">
                    <Button className="bg-[#E8501A] text-white hover:bg-[#d44315] font-bold text-sm px-6 py-3 rounded-xl shadow-md">
                      Get Started with Free Consultation
                    </Button>
                  </a>
                  <a href="/book-consultation">
                    <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold text-sm px-6 py-3 rounded-xl">
                      Talk to Senior Advisor
                    </Button>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl max-h-72">
                  <img src={s.heroImage} alt={s.title} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              {/* KEY BENEFITS */}
              <Card className="p-6 border-l-4 border-l-[#0057B8]">
                <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-[#0057B8]" /> What's Included & Key Benefits
                </h3>
                <div className="space-y-3">
                  {s.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-800">
                      <CheckCircle2 className="h-4 w-4 text-[#0057B8] shrink-0 mt-0.5" />
                      <span className="font-semibold">{b}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* STEP BY STEP PROCESS */}
              <Card className="p-6 border-l-4 border-l-[#E8501A]">
                <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                  <Layers className="h-6 w-6 text-[#E8501A]" /> Step-by-Step Service Workflow
                </h3>
                <div className="space-y-4">
                  {s.processSteps.map((step) => (
                    <div key={step.step} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <span className="text-base font-black text-[#E8501A]">0{step.step}</span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{step.title}</h4>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* WHO IS IT FOR & PREREQUISITES */}
              <div className="grid sm:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="font-bold text-[#0F172A] text-sm mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#0057B8]" /> Who Is This For?
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
                    {s.whoIsItFor.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6">
                  <h4 className="font-bold text-[#0F172A] text-sm mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#E8501A]" /> Required Documents
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
                    {s.requiredDocuments.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* SERVICE FAQS */}
              {s.faqs && s.faqs.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-[#0057B8]" /> Frequently Asked Questions
                  </h3>
                  <div className="space-y-3 text-xs">
                    {s.faqs.map((faq, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="font-bold text-slate-900 mb-1">{faq.question}</p>
                        <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* SIDEBAR CTAS */}
            <div className="space-y-6">
              <Card className="p-6 border-2 border-[#0057B8]/20 bg-gradient-to-br from-blue-50/30 to-white">
                <h3 className="font-bold text-[#0F172A] mb-2 text-lg">Book Service Assistance</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Our counselors provide 100% personalized guidance to ensure your study abroad journey is smooth and successful.
                </p>
                <div className="space-y-2.5">
                  <a href="/eligibility-check" className="block w-full">
                    <Button className="w-full bg-[#E8501A] text-white hover:brightness-110 text-xs py-2.5 font-bold">
                      Check Admission Eligibility Free
                    </Button>
                  </a>
                  <a href="/book-consultation" className="block w-full">
                    <Button variant="outline" className="w-full text-xs py-2.5 border-[#0057B8] text-[#0057B8] font-semibold hover:bg-blue-50">
                      Talk to Senior Advisor
                    </Button>
                  </a>
                </div>
              </Card>

              {/* OTHER COMPREHENSIVE SERVICES */}
              <Card className="p-5 bg-white border-slate-200 text-xs">
                <h4 className="font-bold text-slate-900 mb-3">Explore Other Services</h4>
                <div className="space-y-2">
                  {MASTER_SERVICES_DATA.filter((other) => other.slug !== s.slug).slice(0, 5).map((other) => (
                    <a key={other.id} href={`/services/${other.slug}`} className="block p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all font-medium text-slate-800">
                      <span className="text-[#0057B8] font-bold block">{other.title}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{other.shortDesc}</span>
                    </a>
                  ))}
                </div>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
