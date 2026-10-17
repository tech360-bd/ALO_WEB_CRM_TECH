'use client'

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ArrowRight, ArrowLeft, CheckCircle2, Info, AlertTriangle, XCircle,
  HelpCircle, Clock, FileText, FolderOpen, Lightbulb,
  type LucideIcon,
} from 'lucide-react'
import { getServiceBySlug, getRelatedServices, type ServiceDetail } from '@/lib/services-data'

function MissingInfo({ label }: { label: string }) {
  return (
    <div className="text-sm italic text-[#888] flex items-start gap-2">
      <Info className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{label} Information not currently verified. Please check with an ALO Education counselor.</span>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="border-b border-gray-50">
        <CardTitle className="flex items-center gap-2 text-lg text-[#1A2332]">
          <Icon className="h-5 w-5" style={{ color: '#0057B8' }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  )
}

function ListOrMissing({
  items,
  emptyLabel,
  icon: Icon,
  color = '#0057B8',
}: {
  items: string[]
  emptyLabel: string
  icon: LucideIcon
  color?: string
}) {
  if (items.length === 0) {
    return <MissingInfo label={emptyLabel} />
  }
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[#1A2332]">
          <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ServiceDetail({ service }: { service: ServiceDetail }) {
  const Icon = service.icon
  const related = getRelatedServices(service.relatedSlugs)

  return (
    <PublicSiteLayout>
      {/* Header */}
      <section
        className="text-white py-12 lg:py-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0057B8 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-xs mb-4">
            <Link href="/services" className="text-gray-300 hover:text-white inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> All Services
            </Link>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0"
              style={{ background: service.color }}
            >
              <Icon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <Badge
                className="mb-2 border"
                style={{ background: 'rgba(232,80,26,0.15)', color: '#FFB347', borderColor: 'rgba(232,80,26,0.3)' }}
              >
                ALO Service
              </Badge>
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight">{service.title}</h1>
              <p className="mt-3 text-gray-200 max-w-2xl text-base lg:text-lg">
                {service.shortDescription}
              </p>
            </div>
            <Link href="/book-consultation">
              <Button className="h-12 px-5 text-white font-semibold" style={{ background: '#E8501A' }}>
                Book Consultation <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <SectionCard title="What This Service Is" icon={Info}>
              <p className="text-sm text-[#1A2332] leading-relaxed">{service.whatItIs}</p>
            </SectionCard>

            <SectionCard title="Why Students Need It" icon={Lightbulb}>
              <ListOrMissing items={service.whyNeeded} emptyLabel="Why-need" icon={CheckCircle2} />
            </SectionCard>

            <SectionCard title="Who It&apos;s For" icon={CheckCircle2}>
              <ListOrMissing items={service.whoItsFor} emptyLabel="Audience" icon={CheckCircle2} color="#10B981" />
            </SectionCard>

            <SectionCard title="What ALO Does" icon={Info}>
              <ListOrMissing items={service.whatAloDoes} emptyLabel="What ALO does" icon={CheckCircle2} color="#E8501A" />
            </SectionCard>

            <SectionCard title="Step-by-Step Process" icon={FileText}>
              {service.process.length === 0 ? (
                <MissingInfo label="Process" />
              ) : (
                <ol className="space-y-3">
                  {service.process.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: '#0057B8' }}
                      >
                        {i + 1}
                      </div>
                      <div className="text-sm text-[#1A2332] pt-1">{step}</div>
                    </li>
                  ))}
                </ol>
              )}
            </SectionCard>

            <SectionCard title="Required Information" icon={Info}>
              <ListOrMissing items={service.requiredInfo} emptyLabel="Required information" icon={Info} />
            </SectionCard>

            <SectionCard title="Documents Needed" icon={FolderOpen}>
              <ListOrMissing items={service.documentsNeeded} emptyLabel="Documents" icon={FolderOpen} color="#10B981" />
            </SectionCard>

            <SectionCard title="Timeline" icon={Clock}>
              <p className="text-sm text-[#1A2332] leading-relaxed">{service.timeline}</p>
            </SectionCard>

            <SectionCard title="What Students Receive" icon={CheckCircle2}>
              <ListOrMissing items={service.studentsReceive} emptyLabel="Deliverable" icon={CheckCircle2} color="#10B981" />
            </SectionCard>

            {/* Not Guaranteed — always shown, especially prominent for visa-guidance */}
            <Card className="border-2 border-amber-200 bg-amber-50/50 shadow-sm">
              <CardHeader className="border-b border-amber-100">
                <CardTitle className="flex items-center gap-2 text-lg text-[#7a4a00]">
                  <AlertTriangle className="h-5 w-5" style={{ color: '#E8501A' }} />
                  What ALO Does NOT Guarantee
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ListOrMissing
                  items={service.notGuaranteed}
                  emptyLabel="Disclaimer"
                  icon={XCircle}
                  color="#E8501A"
                />
                {service.slug === 'visa-guidance' && (
                  <div className="mt-4 p-3 bg-white border border-amber-200 rounded text-xs text-[#555555]">
                    <strong className="text-[#7a4a00]">Official-source disclaimer:</strong>{' '}
                    Visa requirements are set by the destination country&apos;s immigration authority
                    and may change. ALO Education does not, and cannot, guarantee any visa outcome.
                    Always confirm current requirements on the official immigration website
                    (e.g. gov.uk for the UK Student Route, travel.state.gov for US F-1, IRCC for
                    Canada, homeaffairs.gov.au for Australia) before submitting your application.
                  </div>
                )}
              </CardContent>
            </Card>

            <SectionCard title="Common Mistakes" icon={AlertTriangle}>
              <ListOrMissing items={service.commonMistakes} emptyLabel="Common mistakes" icon={AlertTriangle} color="#E8501A" />
            </SectionCard>

            <SectionCard title="FAQ" icon={HelpCircle}>
              {service.faq.length === 0 ? (
                <MissingInfo label="FAQ" />
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {service.faq.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-sm font-semibold text-[#1A2332]">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-[#555555]">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </SectionCard>

            {related.length > 0 && (
              <SectionCard title="Related Services" icon={Info}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {related.map((r) => {
                    const RIcon = r.icon
                    return (
                      <Link
                        key={r.slug}
                        href={`/services/${r.slug}`}
                        className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-all block group"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${r.color}15` }}
                          >
                            <RIcon className="h-4 w-4" style={{ color: r.color }} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-[#1A2332] group-hover:text-[#E8501A] transition-colors line-clamp-1">
                              {r.title}
                            </h4>
                            <p className="text-xs text-[#555555] line-clamp-1">{r.shortDescription}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card
              className="border-0 shadow-md text-white"
            >
              <CardContent className="p-6" style={{ background: 'linear-gradient(135deg, #E8501A 0%, #FFB347 100%)', borderRadius: '0.75rem' }}>
                <h3 className="font-bold text-lg">Need this service?</h3>
                <p className="text-sm text-orange-50 mt-1">
                  Book a free consultation with an ALO Education counselor to get started.
                </p>
                <Link href="/book-consultation">
                  <Button className="mt-4 w-full h-12 bg-white text-[#E8501A] hover:bg-gray-50 font-semibold">
                    Book Consultation <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b border-gray-50">
                <CardTitle className="text-lg text-[#1A2332]">At a glance</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#888]">Service</span>
                  <span className="font-medium text-[#1A2332] text-right">{service.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888]">Timeline</span>
                  <span className="font-medium text-[#1A2332] text-right max-w-[60%]">{service.timeline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888]">Cost</span>
                  <span className="font-medium text-[#1A2332] text-right">Free for students</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-[#1A2332] text-sm">Disclaimer</h3>
                <p className="text-xs text-[#555555] mt-2 leading-relaxed">
                  Service descriptions outline what ALO Education does and does not do. We do not
                  guarantee visa approval, university admission, scholarship selection, job
                  placement, loan approval, or any specific test score. Outcomes depend on the
                  relevant authority (university, embassy, scholarship provider, bank, test
                  provider, employer) and on your own preparation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  )
}

export default function ServiceDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  if (!slug) {
    notFound()
  }

  const service = getServiceBySlug(slug)

  if (!service) {
    notFound()
  }

  return <ServiceDetail service={service} />
}
