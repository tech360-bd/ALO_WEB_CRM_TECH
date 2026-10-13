'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Send,
  Clock,
  Building2,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

type FAQ = { id: number; question: string; answer: string; category?: string };

export function ContactPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', preferredCountry: '', notes: '' });

  useEffect(() => {
    fetch('/api/faqs')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.faqs)) setFaqs(data.faqs);
        else if (Array.isArray(data)) setFaqs(data);
      })
      .catch(() => {})
      .finally(() => setLoadingFaqs(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    try {
      const res = await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email || undefined,
          phone: form.phone,
          preferredCountry: form.preferredCountry || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setSubmitSuccess(true);
      setForm({ fullName: '', email: '', phone: '', preferredCountry: '', notes: '' });
    } catch {
      setSubmitError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const offices = [
    {
      city: 'Dhaka',
      label: 'Headquarters',
      icon: <Building2 className="h-6 w-6 text-[#F37021]" />,
      address: 'Gulshan-2, Circle Road, Dhaka 1212, Bangladesh',
      phone: '+880 1700-ALOEDU',
      email: 'info@aloeducation.com',
      hours: 'Sat–Thu: 9:00 AM – 6:00 PM',
      whatsapp: 'https://wa.me/8801700000000',
    },
    {
      city: 'Chittagong',
      label: 'Branch Office',
      icon: <MapPin className="h-6 w-6 text-[#0066CC]" />,
      address: 'CDA Avenue, GEC Circle, Chittagong 4000, Bangladesh',
      phone: '+880 1800-ALOEDU',
      email: 'ctg@aloeducation.com',
      hours: 'Sat–Thu: 10:00 AM – 5:00 PM',
      whatsapp: 'https://wa.me/8801800000000',
    },
    {
      city: 'Sylhet',
      label: 'Branch Office',
      icon: <MapPin className="h-6 w-6 text-[#FFB347]" />,
      address: 'Zindabazar Road, Sylhet 3100, Bangladesh',
      phone: '+880 1900-ALOEDU',
      email: 'syl@aloeducation.com',
      hours: 'Sat–Thu: 10:00 AM – 5:00 PM',
      whatsapp: 'https://wa.me/8801900000000',
    },
  ];

  const socials = [
    { icon: <Facebook className="h-5 w-5" />, label: 'Facebook', url: 'https://facebook.com/aloeducation' },
    { icon: <Instagram className="h-5 w-5" />, label: 'Instagram', url: 'https://instagram.com/aloeducation' },
    { icon: <Linkedin className="h-5 w-5" />, label: 'LinkedIn', url: 'https://linkedin.com/company/aloeducation' },
    { icon: <Youtube className="h-5 w-5" />, label: 'YouTube', url: 'https://youtube.com/@aloeducation' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066CC] to-[#101828]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-32 md:py-40 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">Contact Us</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Get in Touch</h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Have a question? We'd love to hear from you. Reach out to any of our offices or fill in the form below.</p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-16 md:py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card className="rounded-2xl shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#101828]">Send Us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#101828] mb-1.5">Full Name *</label>
                        <Input required placeholder="Your full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#101828] mb-1.5">Phone *</label>
                        <Input required type="tel" placeholder="+880 1XXX-XXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#101828] mb-1.5">Email</label>
                        <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#101828] mb-1.5">Preferred Country</label>
                        <Input placeholder="e.g. UK, Canada, Australia" value={form.preferredCountry} onChange={(e) => setForm({ ...form, preferredCountry: e.target.value })} className="rounded-xl" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#101828] mb-1.5">Message</label>
                      <Textarea rows={5} placeholder="Tell us about your study abroad plans..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl resize-none" />
                    </div>
                    {submitSuccess && (
                      <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                        <span className="inline-block w-5 h-5 rounded-full bg-green-100 text-green-600 text-center leading-5 text-xs">✓</span>
                        Message sent successfully! We'll get back to you soon.
                      </p>
                    )}
                    {submitError && <p className="text-sm text-red-500 font-medium">{submitError}</p>}
                    <Button type="submit" disabled={submitting} size="lg" className="w-full sm:w-auto bg-[#F37021] hover:bg-[#F37021]/90 text-white rounded-full px-8">
                      {submitting ? 'Sending...' : 'Send Message'} <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Quick Contact + Social */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-[#F37021] to-[#F37021]/80 text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Contact</h3>
                  <div className="space-y-4">
                    <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-white/10 p-2 rounded-lg transition-colors">
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">WhatsApp: +880 1700-ALOEDU</span>
                    </a>
                    <a href="tel:+8801700000000" className="flex items-center gap-3 hover:bg-white/10 p-2 rounded-lg transition-colors">
                      <Phone className="h-5 w-5" />
                      <span className="text-sm">+880 1700-ALOEDU</span>
                    </a>
                    <a href="mailto:info@aloeducation.com" className="flex items-center gap-3 hover:bg-white/10 p-2 rounded-lg transition-colors">
                      <Mail className="h-5 w-5" />
                      <span className="text-sm">info@aloeducation.com</span>
                    </a>
                    <div className="flex items-center gap-3 p-2">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm">Sat–Thu: 9:00 AM – 6:00 PM</span>
                    </div>
                  </div>
                  {/* Social Links */}
                  <div className="mt-5 pt-4 border-t border-white/20">
                    <p className="text-xs text-white/70 mb-3">Follow us</p>
                    <div className="flex gap-3">
                      {socials.map((s) => (
                        <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors" aria-label={s.label}>
                          {s.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Office Cards */}
              {offices.map((office) => (
                <Card key={office.city} className="rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {office.icon}
                      <div>
                        <h3 className="font-semibold text-[#101828]">{office.city}</h3>
                        <Badge variant="secondary" className="text-xs bg-[#F37021]/10 text-[#F37021] border-0">{office.label}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-[#555555]">
                      <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>{office.address}</span></div>
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4 flex-shrink-0" /><span>{office.phone}</span></div>
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4 flex-shrink-0" /><span>{office.email}</span></div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 flex-shrink-0" /><span>{office.hours}</span></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-[#101828] mb-6 text-center">Our Locations</h2>
          <div className="rounded-2xl overflow-hidden border border-gray-200 h-64 md:h-80 bg-[#F8FAFC] flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-10 w-10 text-[#F37021]/40 mx-auto mb-3" />
              <p className="text-[#555555] text-sm">Interactive map coming soon</p>
              <p className="text-[#555555] text-xs mt-1">Dhaka · Chittagong · Sylhet</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#101828] tracking-tight">Frequently Asked Questions</h2>
            <p className="mt-3 text-[#555555] text-lg">Quick answers to common questions about our services.</p>
          </div>
          {loadingFaqs ? (
            <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full rounded-xl" />))}</div>
          ) : faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {faqs.slice(0, 8).map((faq, i) => (
                <AccordionItem key={faq.id || i} value={`faq-${faq.id || i}`} className="border-gray-100">
                  <AccordionTrigger className="text-left text-[#101828] font-medium hover:text-[#F37021] transition-colors">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-[#555555] leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-[#555555] py-8">No FAQs available yet. Contact us directly with your questions.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[#F37021] to-[#FFB347]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Prefer a Face-to-Face Meeting?</h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">Visit our Dhaka headquarters for a personal consultation with our expert counselors.</p>
          <div className="mt-8">
            <Button onClick={onLeadOpen} size="lg" className="bg-white text-[#F37021] hover:bg-white/90 rounded-full px-8">
              Book an Appointment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
