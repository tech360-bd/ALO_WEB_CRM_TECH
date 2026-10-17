'use client'

import React from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  GraduationCap,
  Target,
  Eye,
  Heart,
  Users,
  Award,
  Shield,
  Globe,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  Star,
  Building2,
  BookOpen,
  MapPin,
} from 'lucide-react'

const stats = [
  { value: '5,000+', label: 'Students Placed', icon: <GraduationCap className="h-6 w-6" /> },
  { value: '200+', label: 'Partner Universities', icon: <Building2 className="h-6 w-6" /> },
  { value: '6+', label: 'Countries', icon: <MapPin className="h-6 w-6" /> },
  { value: '15+', label: 'Years Experience', icon: <TrendingUp className="h-6 w-6" /> },
]

const values = [
  { icon: <Lightbulb className="h-6 w-6" />, title: 'Innovation', desc: 'We leverage AI and technology to provide smarter, faster education solutions.', color: 'bg-[#F37021]/10 text-[#F37021]' },
  { icon: <Shield className="h-6 w-6" />, title: 'Integrity', desc: 'We maintain the highest standards of honesty and transparency in all our dealings.', color: 'bg-[#0066CC]/10 text-[#0066CC]' },
  { icon: <Award className="h-6 w-6" />, title: 'Excellence', desc: 'We strive for excellence in every service, from counseling to visa support.', color: 'bg-green-600/10 text-green-600' },
  { icon: <Heart className="h-6 w-6" />, title: 'Student-First', desc: 'Every decision we make puts our students\' interests and dreams at the center.', color: 'bg-purple-600/10 text-purple-600' },
]

const team = [
  { name: 'Md. Abdul Karim', role: 'Founder & CEO', bio: '20+ years in international education consulting. Pioneer of tech-driven student placement in Bangladesh.', initials: 'AK' },
  { name: 'Fatima Rahman', role: 'Director of Operations', bio: 'Former British Council advisor with deep expertise in UK university partnerships and admissions.', initials: 'FR' },
  { name: 'Ahmed Hassan', role: 'Head of Visa Services', bio: 'UKVI certified immigration consultant with a 98% visa success rate over 10 years.', initials: 'AH' },
  { name: 'Sarah Chowdhury', role: 'Senior Counselor', bio: 'Masters from University of Oxford. Specializes in scholarship applications and elite university admissions.', initials: 'SC' },
  { name: 'Imran Hossain', role: 'IT & AI Lead', bio: 'Tech innovator in EdTech, building AI-powered matching tools for personalized university recommendations.', initials: 'IH' },
  { name: 'Nadia Islam', role: 'Marketing Director', bio: '10+ years in education marketing, driving brand growth and student engagement across South Asia.', initials: 'NI' },
]

const story = [
  { year: '2009', title: 'Founded in Dhaka', desc: 'ALO Education began with a small office and a big dream of making global education accessible to every student.' },
  { year: '2012', title: 'UK Partnerships', desc: 'Established direct partnerships with 50+ UK universities, becoming a leading UK education consultant in Bangladesh.' },
  { year: '2015', title: 'Expanded to 4 Countries', desc: 'Added USA, Canada, and Australia to our destination portfolio, serving over 1,000 students.' },
  { year: '2018', title: 'Digital Transformation', desc: 'Launched our digital platform and CRM system, streamlining the entire application process for students.' },
  { year: '2021', title: 'AI-Powered Services', desc: 'Introduced AI matching technology for personalized university recommendations and smart document checking.' },
  { year: '2024', title: '5,000+ Students & Counting', desc: 'Reached the milestone of 5,000+ successful student placements with 200+ university partners worldwide.' },
]

export default function AboutPage() {
  const { setCurrentView } = useAppStore()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2332] via-[#1e2d42] to-[#0066CC] text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl space-y-5">
            <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30">About Us</Badge>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              About <span className="text-[#F37021]">ALO Education</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed">
              Bangladesh&apos;s leading education consultancy, dedicated to helping students achieve their dreams of studying at world-class universities. With over 15 years of experience and 5,000+ successful placements, we are the trusted partner for students seeking quality international education.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">Our Purpose</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A2332]">Mission & Vision</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-[#F37021]/5 to-[#F37021]/10">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-[#F37021] rounded-xl flex items-center justify-center text-white">
                  <Target className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-[#1A2332]">Our Mission</h3>
                <p className="text-[#555555] leading-relaxed">
                  To make world-class education accessible to every aspiring student by providing comprehensive, transparent, and personalized guidance throughout their study abroad journey. We believe every student deserves the opportunity to pursue their academic dreams regardless of their background.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-[#0066CC]/5 to-[#0066CC]/10">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-[#0066CC] rounded-xl flex items-center justify-center text-white">
                  <Eye className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-[#1A2332]">Our Vision</h3>
                <p className="text-[#555555] leading-relaxed">
                  To be the most trusted and innovative education consultancy in South Asia, leveraging technology and expert guidance to transform lives through international education. We envision a world where geographical boundaries do not limit educational opportunities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="bg-[#1A2332] text-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 bg-[#F37021]/20 rounded-xl flex items-center justify-center text-[#F37021]">
                  {stat.icon}
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-[#FFB347]">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">Our Journey</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A2332]">Our Story</h2>
            <p className="mt-3 text-[#555555] max-w-xl mx-auto">From a small office to Bangladesh&apos;s leading education consultancy.</p>
          </div>
          <div className="space-y-6">
            {story.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#F37021] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {item.year}
                  </div>
                  {i < story.length - 1 && <div className="w-0.5 flex-1 bg-[#F37021]/20 mt-2" />}
                </div>
                <Card className="border-0 shadow-sm flex-1 mb-0">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-[#1A2332]">{item.title}</h3>
                    <p className="text-sm text-[#555555] mt-1">{item.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">Our Team</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A2332]">Meet Our Expert Team</h2>
            <p className="mt-3 text-[#555555] max-w-2xl mx-auto">Experienced counselors and support staff dedicated to helping you achieve your study abroad goals.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="border-0 shadow-sm hover:shadow-lg transition-all group text-center">
                <CardContent className="p-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#1A2332] to-[#0066CC] rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-4 group-hover:from-[#F37021] group-hover:to-[#e0651a] transition-all">
                    {member.initials}
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A2332]">{member.name}</h3>
                  <p className="text-sm text-[#F37021] font-medium">{member.role}</p>
                  <Separator className="my-3" />
                  <p className="text-sm text-[#555555] leading-relaxed">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">Our Values</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A2332]">What Drives Us Every Day</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-lg transition-all group">
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 ${value.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A2332] mb-2">{value.title}</h3>
                  <p className="text-sm text-[#555555] leading-relaxed">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#F37021] to-[#e0651a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">Ready to Start Your Journey?</h2>
          <p className="text-orange-100 max-w-xl mx-auto">Get free consultation with our expert counselors and take the first step toward your dream university.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => setCurrentView('free-consultation')} className="bg-white text-[#F37021] hover:bg-gray-100 h-12 px-8 font-semibold">
              Get Free Consultation <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button onClick={() => setCurrentView('contact')} variant="outline" className="border-white text-white hover:bg-white/10 h-12 px-8">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
