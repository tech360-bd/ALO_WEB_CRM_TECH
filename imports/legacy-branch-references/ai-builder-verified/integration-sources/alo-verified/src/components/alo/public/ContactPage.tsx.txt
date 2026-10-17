'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
} from 'lucide-react'

const contactInfo = [
  { icon: <MapPin className="h-5 w-5" />, title: 'Office Address', lines: ['House 12, Road 27, Banani', 'Dhaka 1213, Bangladesh'], color: 'bg-[#F37021]/10 text-[#F37021]' },
  { icon: <Phone className="h-5 w-5" />, title: 'Phone', lines: ['+880 1700-000000', '+880 1800-000000'], color: 'bg-[#0066CC]/10 text-[#0066CC]' },
  { icon: <Mail className="h-5 w-5" />, title: 'Email', lines: ['info@aloeducation.com', 'admissions@aloeducation.com'], color: 'bg-green-600/10 text-green-600' },
  { icon: <MessageSquare className="h-5 w-5" />, title: 'WhatsApp', lines: ['+880 1700-000000', 'Chat with us anytime'], color: 'bg-emerald-600/10 text-emerald-600' },
  { icon: <Clock className="h-5 w-5" />, title: 'Business Hours', lines: ['Sat-Thu: 9:00 AM - 6:00 PM', 'Friday: Closed'], color: 'bg-purple-600/10 text-purple-600' },
]

const faqs = [
  { q: 'How long does it take to get a response?', a: 'We typically respond within 24 hours on business days. For urgent queries, please call us directly or use our WhatsApp line for instant support.' },
  { q: 'Can I visit your office without an appointment?', a: 'Yes, walk-ins are welcome during business hours. However, we recommend booking a free consultation in advance to ensure a counselor is available for you.' },
  { q: 'Do you charge for the initial consultation?', a: 'No, our first consultation is completely free. We assess your profile, discuss your options, and provide guidance at no cost.' },
  { q: 'Which countries do you help students apply to?', a: 'We assist students with applications to the UK, USA, Canada, Australia, Malaysia, and various European countries including Germany, Netherlands, and Ireland.' },
  { q: 'How do I track my application status?', a: 'Once enrolled, you will receive access to our student portal where you can track your application status in real-time, upload documents, and communicate with your counselor.' },
]

const socialLinks = [
  { icon: <Facebook className="h-5 w-5" />, label: 'Facebook', href: '#', color: 'hover:bg-blue-600' },
  { icon: <Instagram className="h-5 w-5" />, label: 'Instagram', href: '#', color: 'hover:bg-pink-600' },
  { icon: <Twitter className="h-5 w-5" />, label: 'Twitter', href: '#', color: 'hover:bg-sky-500' },
  { icon: <Linkedin className="h-5 w-5" />, label: 'LinkedIn', href: '#', color: 'hover:bg-blue-700' },
  { icon: <Youtube className="h-5 w-5" />, label: 'YouTube', href: '#', color: 'hover:bg-red-600' },
]

export default function ContactPage() {
  const { setCurrentView } = useAppStore()
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source: 'contact_form' }),
      })
      setSubmitted(true)
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2332] via-[#1e2d42] to-[#0066CC] text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30 mb-4">Contact Us</Badge>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            Get In Touch <span className="text-[#F37021]">With Us</span>
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto text-lg">
            Have questions about studying abroad? We&apos;re here to help. Reach out and our expert team will respond within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 lg:p-8">
                  {submitted ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#1A2332]">Message Sent!</h3>
                      <p className="text-[#555555] max-w-md mx-auto">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                      <Button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: '', message: '' }) }} variant="outline" className="mt-4">
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-[#1A2332] mb-2">Send Us a Message</h3>
                      <p className="text-sm text-[#555555] mb-6">Fill out the form and we&apos;ll get back to you promptly.</p>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input id="name" placeholder="Your full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input id="email" type="email" placeholder="your.email@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" placeholder="+880 1XXX-XXXXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject *</Label>
                            <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                              <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General Inquiry</SelectItem>
                                <SelectItem value="uk-study">Study in UK</SelectItem>
                                <SelectItem value="usa-study">Study in USA</SelectItem>
                                <SelectItem value="canada-study">Study in Canada</SelectItem>
                                <SelectItem value="australia-study">Study in Australia</SelectItem>
                                <SelectItem value="visa-help">Visa Assistance</SelectItem>
                                <SelectItem value="scholarship">Scholarship Info</SelectItem>
                                <SelectItem value="partnership">Partner Inquiry</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Message *</Label>
                          <Textarea id="message" placeholder="Tell us about your inquiry..." rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
                        </div>
                        <Button type="submit" className="bg-[#F37021] hover:bg-[#e0651a] text-white w-full h-12 text-base font-semibold" disabled={loading}>
                          {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Sending...</> : <><Send className="h-5 w-5 mr-2" /> Send Message</>}
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Info Cards */}
            <div className="lg:col-span-2 space-y-4">
              {contactInfo.map((info, i) => (
                <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`w-11 h-11 ${info.color} rounded-xl flex items-center justify-center shrink-0`}>
                      {info.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A2332] text-sm">{info.title}</p>
                      {info.lines.map((line, j) => (
                        <p key={j} className="text-sm text-[#555555]">{line}</p>
                      ))}
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
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-center">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-500">Map</p>
                <p className="text-sm text-gray-400">House 12, Road 27, Banani, Dhaka 1213</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Social Media */}
      <section className="bg-white pb-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-[#1A2332] mb-6">Follow Us On Social Media</h3>
          <div className="flex justify-center gap-4">
            {socialLinks.map((s, i) => (
              <a key={i} href={s.href} aria-label={s.label} className={`w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 transition-all ${s.color} hover:text-white`}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* FAQ Section */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">FAQ</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Frequently Asked Questions</h2>
            <p className="mt-3 text-[#555555]">Quick answers to common queries about our services.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-white rounded-xl border-0 shadow-sm px-6">
                <AccordionTrigger className="text-left text-[#1A2332] font-semibold hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[#555555] pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  )
}
