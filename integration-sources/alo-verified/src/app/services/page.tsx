import Link from 'next/link'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle2, ChevronRight, Headphones } from 'lucide-react'
import { SERVICES } from '@/lib/services-data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services — ALO Education',
  description:
    '14 premium services from ALO Education: personalized counseling, university selection, course matching, application assistance, SOP & CV support, document checking, visa guidance, interview preparation, English test preparation, financial planning, scholarship guidance, pre-departure orientation, post-arrival support, and career counseling.',
  keywords: ['study abroad services', 'education consultancy', 'visa guidance', 'ALO Education'],
  openGraph: {
    title: 'Services — ALO Education',
    description: '14 premium services to guide you from counseling to arrival.',
    type: 'website',
  },
}

export default function ServicesPage() {
  return (
    <PublicSiteLayout>
      {/* Hero */}
      <section
        className="text-white py-14 lg:py-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0057B8 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Badge
            className="mb-4 border"
            style={{ background: 'rgba(232,80,26,0.15)', color: '#FFB347', borderColor: 'rgba(232,80,26,0.3)' }}
          >
            Our Services
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
            Comprehensive <span style={{ color: '#FFB347' }}>Education Services</span>
          </h1>
          <p className="mt-3 text-gray-200 max-w-2xl text-base lg:text-lg">
            14 premium services that take you from your first consultation to your first week on
            campus. We do not promise visa approval or admission — we prepare you as strongly and
            accurately as possible, and we tell you the truth up front.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((s) => {
              const Icon = s.icon
              return (
                <Card
                  key={s.slug}
                  className="border-0 shadow-sm hover:shadow-lg transition-all group flex flex-col overflow-hidden"
                >
                  <div className="h-1.5" style={{ background: s.color }} />
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: `${s.color}15` }}
                    >
                      <Icon className="h-7 w-7" style={{ color: s.color }} />
                    </div>
                    <h3 className="text-lg font-bold text-[#1A2332] group-hover:text-[#E8501A] transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-sm text-[#555555] mt-2">{s.shortDescription}</p>
                    <ul className="mt-4 space-y-1.5 text-xs text-[#555555]">
                      {s.whatAloDoes.slice(0, 3).map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: s.color }} />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-4">
                      <Link href={`/services/${s.slug}`}>
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-semibold text-sm group/btn"
                          style={{ color: s.color }}
                        >
                          Learn More
                          <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge
              className="mb-3"
              style={{ background: 'rgba(232,80,26,0.1)', color: '#E8501A', border: 0 }}
            >
              How It Works
            </Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Your Journey in 4 Simple Steps</h2>
            <p className="text-[#555555] mt-2">We handle the complexity so you can focus on your dreams.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Free Consultation', desc: 'Book a free session with a certified counselor to discuss your goals.' },
              { step: 2, title: 'Personalized Plan', desc: 'We create a tailored roadmap based on your academic profile and budget.' },
              { step: 3, title: 'Application & Visa', desc: 'We handle your university applications and prepare your visa-stage documents.' },
              { step: 4, title: 'Pre-Departure & Beyond', desc: 'Orientation, travel, and post-arrival support until you settle in.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #E8501A 0%, #FFB347 100%)' }}
                >
                  <span className="text-lg font-bold">{s.step}</span>
                </div>
                <div className="mt-2 text-xs font-bold" style={{ color: '#E8501A' }}>
                  STEP {s.step}
                </div>
                <h4 className="font-semibold text-[#1A2332] mt-1">{s.title}</h4>
                <p className="text-xs text-[#555555] mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="text-white py-14"
        style={{ background: 'linear-gradient(135deg, #E8501A 0%, #FFB347 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
            <Headphones className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold">Start Your Free Consultation</h2>
          <p className="text-orange-50 max-w-xl mx-auto">
            Our core services are free for students — funded by our partner universities. Book a
            consultation and we&apos;ll start your journey today.
          </p>
          <Link href="/book-consultation">
            <Button className="h-12 px-8 bg-white text-[#E8501A] hover:bg-gray-50 font-semibold">
              Book Free Consultation <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicSiteLayout>
  )
}
