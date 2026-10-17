'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowRight,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Shield,
  GraduationCap,
  Star,
} from 'lucide-react'

export default function FreeConsultationPage() {
  const { setCurrentView } = useAppStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredCountry: '',
    preferredCourse: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      preferredCountry: '',
      preferredCourse: '',
      message: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Public consultation endpoint — no Authorization header required.
      // Maps the form's `name` field to the API's `firstName` parameter.
      const res = await fetch('/api/public/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.name,
          lastName: '',
          email: formData.email,
          phone: formData.phone,
          preferredCountry: formData.preferredCountry,
          preferredCourse: formData.preferredCourse,
          notes: formData.message,
          source: 'free_consultation',
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Request failed: ${res.status}`)
      }

      const data = await res.json()

      // API returns `deduplicated: true` when an existing lead was found and a
      // note was appended instead of creating a new lead.
      if (data.deduplicated) {
        toast.success(
          data.message ||
            'You already have a consultation request on file. We will contact you soon.'
        )
      } else {
        toast.success(
          'Consultation booked! Our counselor will contact you within 24 hours.'
        )
      }

      // Reset the form fields for the next submission.
      resetForm()
      setSubmitted(true)
    } catch (error) {
      console.error('Failed to submit consultation:', error)
      toast.error(
        error instanceof Error && error.message
          ? `Failed to submit: ${error.message}`
          : 'Failed to submit consultation request. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2332] to-[#0066CC] text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30 mb-3">Free Consultation</Badge>
          <h1 className="text-3xl lg:text-5xl font-bold">Book Your Free Consultation</h1>
          <p className="mt-3 text-gray-300 max-w-2xl">
            Take the first step toward your study abroad journey. Meet with our expert counselors for a free, no-obligation consultation.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 lg:p-8">
                  {submitted ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#1A2332]">Consultation Booked!</h3>
                      <p className="text-[#555555] max-w-md mx-auto">
                        Thank you for booking a free consultation with ALO Education. Our counselor will contact you within 24 hours to schedule your session.
                      </p>
                      <div className="flex flex-wrap justify-center gap-3 mt-4">
                        <Button onClick={() => setCurrentView('home')} className="bg-[#F37021] hover:bg-[#e0651a] text-white">
                          Back to Home
                        </Button>
                        <Button onClick={() => setSubmitted(false)} variant="outline">
                          Book Another
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-[#1A2332] mb-6">Fill in Your Details</h3>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              placeholder="Your full name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            placeholder="+880 1XXX-XXXXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Preferred Country</Label>
                            <Select
                              value={formData.preferredCountry}
                              onValueChange={(v) => setFormData({ ...formData, preferredCountry: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UK">United Kingdom 🇬🇧</SelectItem>
                                <SelectItem value="USA">United States 🇺🇸</SelectItem>
                                <SelectItem value="Canada">Canada 🇨🇦</SelectItem>
                                <SelectItem value="Australia">Australia 🇦🇺</SelectItem>
                                <SelectItem value="Europe">Europe 🇪🇺</SelectItem>
                                <SelectItem value="Malaysia">Malaysia 🇲🇾</SelectItem>
                                <SelectItem value="Not Sure">Not Sure Yet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Preferred Course</Label>
                            <Select
                              value={formData.preferredCourse}
                              onValueChange={(v) => setFormData({ ...formData, preferredCourse: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Computer Science">Computer Science & IT</SelectItem>
                                <SelectItem value="Business">Business & MBA</SelectItem>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Medicine">Medicine & Health</SelectItem>
                                <SelectItem value="Law">Law</SelectItem>
                                <SelectItem value="Arts">Arts & Design</SelectItem>
                                <SelectItem value="Science">Science & Research</SelectItem>
                                <SelectItem value="Not Sure">Not Sure Yet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Message (Optional)</Label>
                          <Textarea
                            id="message"
                            placeholder="Tell us about your goals, questions, or any specific requirements..."
                            rows={4}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="bg-[#F37021] hover:bg-[#e0651a] text-white w-full h-12 text-base"
                          disabled={loading}
                        >
                          {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Booking...</>
                          ) : (
                            <><MessageSquare className="h-4 w-4 mr-2" /> Book Free Consultation</>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* What to Expect */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-[#1A2332]">What to Expect</h3>
                  <ul className="space-y-3">
                    {[
                      'Personalized assessment of your academic profile',
                      'Country and university recommendations',
                      'Course selection guidance',
                      'Scholarship opportunities overview',
                      'Visa process walkthrough',
                      'Career roadmap planning',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#F37021] shrink-0 mt-0.5" />
                        <span className="text-sm text-[#555555]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Why ALO */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-[#F37021]/5 to-[#F37021]/10">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-[#1A2332]">Why Choose ALO Education?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-xl font-bold text-[#F37021]">98%</div>
                      <div className="text-xs text-[#555555]">Visa Success</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-xl font-bold text-[#F37021]">5000+</div>
                      <div className="text-xs text-[#555555]">Students Placed</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-xl font-bold text-[#F37021]">200+</div>
                      <div className="text-xs text-[#555555]">Universities</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-xl font-bold text-[#F37021]">15+</div>
                      <div className="text-xs text-[#555555]">Years Exp.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-lg font-bold text-[#1A2332]">Prefer to Call?</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[#555555]">
                      <Phone className="h-4 w-4 text-[#F37021]" /> +880 1700-000000
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#555555]">
                      <Mail className="h-4 w-4 text-[#F37021]" /> info@aloeducation.com
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#555555]">
                      <Clock className="h-4 w-4 text-[#F37021]" /> Sat-Thu: 9AM-6PM
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
