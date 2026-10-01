'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Mail, Phone, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PublicNavbar from '@/components/website/PublicNavbar';
import { usePortalStore } from '@/lib/stores/portal-store';

const SERVICE_OPTIONS = [
  'General Consultation',
  'University Selection',
  'Application Assistance',
  'Visa Guidance',
  'Test Preparation (IELTS/TOEFL/PTE)',
  'Scholarship & Financial Planning',
  'SOP/CV Review',
  'Pre-Departure Orientation',
  'Course Finder Help',
  'Eligibility Check',
];

const DESTINATIONS = ['United Kingdom', 'United States', 'Canada', 'Australia', 'Ireland', 'New Zealand', 'Dubai/UAE', 'Germany'];

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

export default function PublicConsultationPage() {
  const setView = usePortalStore((s) => s.setView);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Centralized verified metrics (Part 13) — claims are data-driven, never
  // hardcoded. Falls back to neutral wording when the metrics service is
  // unavailable rather than showing fabricated numbers.
  const [verifiedClaims, setVerifiedClaims] = useState<{ destinations: string; universities: string; courses: string }>({
    destinations: 'Multiple study destinations',
    universities: 'Verified partner universities',
    courses: 'Courses with intake and fee data',
  });
  useEffect(() => {
    let active = true;
    fetch('/api/metrics')
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!active || !res?.data?.metrics) return;
        const m = res.data.metrics;
        setVerifiedClaims({
          destinations: m['countries.total']?.displayValue
            ? `${m['countries.total'].displayValue.replace('+', '')} study destinations`
            : 'Multiple study destinations',
          universities: m['universities.total']?.displayValue
            ? `${m['universities.total'].displayValue} partner universities`
            : 'Verified partner universities',
          courses: m['courses.total']?.displayValue
            ? `${m['courses.total'].displayValue} courses with intake and fee data`
            : 'Courses with intake and fee data',
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    destination: 'United Kingdom',
    service: 'General Consultation',
    preferredDate: '',
    preferredTime: '10:00 AM',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/website/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'consultation_booking',
          leadType: 'consultation',
          status: 'new',
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <main className="pt-8 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-[#F97316] mb-4">
              FREE CONSULTATION
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] mb-4">
              Book Your Free Consultation
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get personalized guidance from our expert counselors. Schedule a free consultation
              today and take the first step toward your international education journey.
            </p>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-green-200 rounded-2xl p-10 text-center shadow-sm"
            >
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Booking Received!</h2>
              <p className="text-slate-600 mb-6">
                Thank you, {form.name}. Our team will contact you within 24 hours to confirm your appointment.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 mb-6 inline-block">
                <p className="text-sm text-slate-500">Your booking reference</p>
                <p className="text-lg font-mono font-bold text-[#0B5ED7]">
                  ALO-{Date.now().toString().slice(-6)}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setView('website')} className="bg-[#0B5ED7] text-white">
                  Back to Home
                </Button>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Book Another
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm"
              >
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-[#0F172A] mb-1.5 block">
                        <User className="inline h-4 w-4 mr-1 text-[#0B5ED7]" /> Full Name *
                      </Label>
                      <Input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Tushar Imran"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#0F172A] mb-1.5 block">
                        <Phone className="inline h-4 w-4 mr-1 text-[#0B5ED7]" /> Phone *
                      </Label>
                      <Input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+880 1XXX-XXXXXX"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-[#0F172A] mb-1.5 block">
                      <Mail className="inline h-4 w-4 mr-1 text-[#0B5ED7]" /> Email *
                    </Label>
                    <Input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      className="h-11"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-[#0F172A] mb-1.5 block">
                        <Globe className="inline h-4 w-4 mr-1 text-[#0B5ED7]" /> Preferred Destination *
                      </Label>
                      <Select value={form.destination} onValueChange={(v) => setForm({ ...form, destination: v })}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DESTINATIONS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#0F172A] mb-1.5 block">
                        Service Needed *
                      </Label>
                      <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-[#0F172A] mb-1.5 block">
                        <Calendar className="inline h-4 w-4 mr-1 text-[#0B5ED7]" /> Preferred Date *
                      </Label>
                      <Input
                        required
                        type="date"
                        value={form.preferredDate}
                        onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#0F172A] mb-1.5 block">
                        <Clock className="inline h-4 w-4 mr-1 text-[#0B5ED7]" /> Preferred Time *
                      </Label>
                      <Select value={form.preferredTime} onValueChange={(v) => setForm({ ...form, preferredTime: v })}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-[#0F172A] mb-1.5 block">
                      Message (optional)
                    </Label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your goals, current academic status, or any specific questions..."
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 bg-[#F97316] text-white font-semibold rounded-xl hover:brightness-110 transition-all"
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      'Book Free Consultation'
                    )}
                  </Button>
                </form>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-[#0B5ED7] to-[#003d80] rounded-2xl p-6 text-white">
                  <h3 className="text-lg font-bold mb-4">Contact Directly</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-blue-100 text-xs">Phone</p>
                      <p className="font-semibold">+88 01805020101-10</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs">Email</p>
                      <p className="font-semibold">info@aloeducation.com</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs">Hours</p>
                      <p className="font-semibold">Sat-Thu: 10 AM - 6 PM</p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-xs">Address</p>
                      <p className="font-semibold text-xs leading-relaxed">
                        Barek Mansion-02 (5th Floor)<br />
                        58/9 Box Culvert Road, Panthapath<br />
                        Dhaka-1205, Bangladesh
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-green-900 mb-2">WhatsApp Us</h3>
                  <p className="text-sm text-green-800 mb-3">Quick response on WhatsApp</p>
                  <a
                    href="https://wa.me/8801805020101?text=I%20want%20to%20book%20a%20consultation"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full bg-[#25D366] text-white hover:brightness-110">
                      Chat on WhatsApp
                    </Button>
                  </a>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-[#F97316] mb-2">Why Choose Us?</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#F97316] mt-0.5 shrink-0" />
                      {verifiedClaims.destinations}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#F97316] mt-0.5 shrink-0" />
                      {verifiedClaims.universities}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#F97316] mt-0.5 shrink-0" />
                      {verifiedClaims.courses}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#F97316] mt-0.5 shrink-0" />
                      Free service for students
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
