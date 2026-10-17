'use client'

import React from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Shield,
  DollarSign,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Plane,
  Building2,
  Users,
  Clock,
  MapPin,
  Briefcase,
} from 'lucide-react'

interface StudyDestinationPageProps {
  country: 'UK' | 'USA' | 'Canada' | 'Australia' | 'Europe' | 'Malaysia'
}

const countryData: Record<string, {
  flag: string
  gradient: string
  title: string
  subtitle: string
  description: string
  stats: { value: string; label: string }[]
  topUniversities: { name: string; ranking: string }[]
  popularCourses: string[]
  visaSteps: { title: string; desc: string }[]
  costs: { item: string; amount: string }[]
  benefits: string[]
  requirements: string[]
}> = {
  UK: {
    flag: '🇬🇧',
    gradient: 'from-blue-800 to-blue-600',
    title: 'Study in United Kingdom',
    subtitle: 'World-Class Education with Rich Heritage',
    description: 'The UK is home to some of the world\'s oldest and most prestigious universities. With a UK degree, you\'ll gain an internationally recognized qualification that opens doors globally. The UK offers a diverse range of courses, cutting-edge research facilities, and a vibrant multicultural experience.',
    stats: [
      { value: '160+', label: 'Universities' },
      { value: '2,000+', label: 'Students Placed' },
      { value: '£10K-£38K', label: 'Tuition/Year' },
      { value: '20 hrs/wk', label: 'Work Allowed' },
    ],
    topUniversities: [
      { name: 'University of Oxford', ranking: '#1 UK' },
      { name: 'University of Cambridge', ranking: '#2 UK' },
      { name: 'Imperial College London', ranking: '#3 UK' },
      { name: 'University College London', ranking: '#4 UK' },
      { name: 'University of Edinburgh', ranking: '#5 UK' },
      { name: 'University of Manchester', ranking: '#6 UK' },
    ],
    popularCourses: ['Computer Science', 'Business & MBA', 'Engineering', 'Medicine', 'Law', 'Data Science', 'Finance & Accounting', 'Creative Arts'],
    visaSteps: [
      { title: 'Receive CAS', desc: 'Get Confirmation of Acceptance for Studies from your university' },
      { title: 'Prepare Documents', desc: 'Financial proof, academic transcripts, English test results' },
      { title: 'Online Application', desc: 'Complete the UK visa application form and pay fees' },
      { title: 'Biometrics', desc: 'Attend appointment at visa application center' },
      { title: 'Credibility Interview', desc: 'ALO prepares you for the UKVI interview' },
      { title: 'Visa Decision', desc: 'Receive your Tier 4 student visa (98% success with ALO)' },
    ],
    costs: [
      { item: 'Undergraduate Tuition', amount: '£10,000 - £25,000/year' },
      { item: 'Postgraduate Tuition', amount: '£12,000 - £38,000/year' },
      { item: 'Living Expenses', amount: '£1,023 - £1,334/month' },
      { item: 'Visa Application Fee', amount: '£363' },
      { item: 'Health Surcharge', amount: '£470/year' },
    ],
    benefits: [
      'Internationally recognized degrees',
      '2-year post-study work visa (Graduate Route)',
      'Access to world-class research facilities',
      'Multicultural and welcoming environment',
      'Part-time work opportunities during studies',
      'NHS healthcare access',
      'Shorter course durations (3 years UG, 1 year PG)',
      'Rich cultural and historical experience',
    ],
    requirements: [
      'Academic transcripts and certificates',
      'IELTS 6.0-7.0 (varies by university)',
      'Personal statement / Statement of purpose',
      'Two academic references',
      'Financial proof for tuition and living costs',
      'Valid passport',
      'Tuberculosis test (for Bangladesh)',
    ],
  },
  USA: {
    flag: '🇺🇸',
    gradient: 'from-red-800 to-red-600',
    title: 'Study in United States',
    subtitle: 'Innovation Hub with Top-Ranked Universities',
    description: 'The USA hosts more international students than any other country, offering unparalleled academic choices, cutting-edge technology, and research opportunities. From Ivy League institutions to state-of-the-art research universities, the US education system is designed to foster innovation and creativity.',
    stats: [
      { value: '4,000+', label: 'Universities' },
      { value: '1,500+', label: 'Students Placed' },
      { value: '$20K-$60K', label: 'Tuition/Year' },
      { value: 'On-Campus', label: 'Work Allowed' },
    ],
    topUniversities: [
      { name: 'Harvard University', ranking: '#1 USA' },
      { name: 'MIT', ranking: '#2 USA' },
      { name: 'Stanford University', ranking: '#3 USA' },
      { name: 'Columbia University', ranking: '#4 USA' },
      { name: 'University of California Berkeley', ranking: '#5 USA' },
      { name: 'University of Michigan', ranking: '#6 USA' },
    ],
    popularCourses: ['Computer Science', 'Business Administration', 'Engineering', 'Data Science', 'Medicine', 'Law', 'Finance', 'Biotechnology'],
    visaSteps: [
      { title: 'Receive I-20', desc: 'Get Form I-20 from your admitted university' },
      { title: 'Pay SEVIS Fee', desc: 'Pay the Student and Exchange Visitor Information System fee' },
      { title: 'DS-160 Application', desc: 'Complete the online nonimmigrant visa application' },
      { title: 'Visa Interview', desc: 'Attend interview at US embassy with ALO preparation' },
      { title: 'Visa Approval', desc: 'Receive your F-1 student visa' },
      { title: 'Pre-Departure', desc: 'ALO provides comprehensive orientation for US arrival' },
    ],
    costs: [
      { item: 'Undergraduate Tuition', amount: '$20,000 - $50,000/year' },
      { item: 'Postgraduate Tuition', amount: '$25,000 - $60,000/year' },
      { item: 'Living Expenses', amount: '$10,000 - $20,000/year' },
      { item: 'Visa Application Fee', amount: '$185' },
      { item: 'SEVIS Fee', amount: '$350' },
    ],
    benefits: [
      'World\'s best universities and research facilities',
      'OPT and CPT work authorization programs',
      'Diverse academic programs and specializations',
      'Strong emphasis on innovation and entrepreneurship',
      'Campus life with extensive extracurriculars',
      'Access to cutting-edge technology',
      'Global networking opportunities',
      'Optional Practical Training (OPT) up to 3 years for STEM',
    ],
    requirements: [
      'Academic transcripts (GPA 3.0+ recommended)',
      'TOEFL 80-100 or IELTS 6.5-7.0',
      'SAT/ACT for undergraduate, GRE/GMAT for graduate',
      'Statement of purpose and essays',
      'Letters of recommendation',
      'Financial proof / sponsorship letter',
      'Valid passport',
    ],
  },
  Canada: {
    flag: '🇨🇦',
    gradient: 'from-red-700 to-red-500',
    title: 'Study in Canada',
    subtitle: 'Affordable Excellence with Post-Study Work Opportunities',
    description: 'Canada is renowned for its high-quality education, affordable tuition, and welcoming immigration policies. With a post-study work permit of up to 3 years and clear pathways to permanent residency, Canada is an increasingly popular choice for international students seeking a high standard of living and excellent career prospects.',
    stats: [
      { value: '100+', label: 'Universities' },
      { value: '800+', label: 'Students Placed' },
      { value: 'CAD 15K-35K', label: 'Tuition/Year' },
      { value: '20 hrs/wk', label: 'Work Allowed' },
    ],
    topUniversities: [
      { name: 'University of Toronto', ranking: '#1 Canada' },
      { name: 'University of British Columbia', ranking: '#2 Canada' },
      { name: 'McGill University', ranking: '#3 Canada' },
      { name: 'University of Waterloo', ranking: '#4 Canada' },
      { name: 'University of Alberta', ranking: '#5 Canada' },
      { name: 'Western University', ranking: '#6 Canada' },
    ],
    popularCourses: ['Computer Science', 'Engineering', 'Business', 'Nursing', 'Data Analytics', 'Hospitality', 'Health Sciences', 'Environmental Science'],
    visaSteps: [
      { title: 'LOA from DLI', desc: 'Receive Letter of Acceptance from a Designated Learning Institution' },
      { title: 'GIC / Financial Proof', desc: 'Show proof of funds via GIC or bank statements' },
      { title: 'Study Permit Application', desc: 'Apply online or via paper at visa application center' },
      { title: 'Biometrics', desc: 'Provide fingerprints and photograph' },
      { title: 'Medical Exam', desc: 'Complete immigration medical examination' },
      { title: 'Visa Decision', desc: 'Receive your study permit and start your journey' },
    ],
    costs: [
      { item: 'Undergraduate Tuition', amount: 'CAD 15,000 - 35,000/year' },
      { item: 'Postgraduate Tuition', amount: 'CAD 18,000 - 40,000/year' },
      { item: 'Living Expenses', amount: 'CAD 10,000 - 15,000/year' },
      { item: 'Visa Application Fee', amount: 'CAD 150' },
      { item: 'GIC Deposit', amount: 'CAD 20,635' },
    ],
    benefits: [
      'Affordable tuition compared to UK/USA',
      'Post-study work permit up to 3 years',
      'Clear pathway to permanent residency',
      'High quality of life and safety',
      'Multicultural and inclusive society',
      'Free healthcare in most provinces',
      'Bilingual environment (English/French)',
      'Strong job market for graduates',
    ],
    requirements: [
      'Academic transcripts and certificates',
      'IELTS 6.0-6.5 (varies by program)',
      'Statement of purpose',
      'Letters of recommendation',
      'Financial proof (GIC or bank statements)',
      'Medical examination',
      'Valid passport',
    ],
  },
  Australia: {
    flag: '🇦🇺',
    gradient: 'from-green-700 to-green-500',
    title: 'Study in Australia',
    subtitle: 'Quality Education in Stunning Locations',
    description: 'Australia offers a world-class education system with universities consistently ranking in global top 100. Known for its stunning landscapes, vibrant cities, and excellent quality of life, Australia provides international students with a unique combination of academic excellence and lifestyle opportunities.',
    stats: [
      { value: '43', label: 'Universities' },
      { value: '600+', label: 'Students Placed' },
      { value: 'AUD 20K-45K', label: 'Tuition/Year' },
      { value: '48 hrs/fortn', label: 'Work Allowed' },
    ],
    topUniversities: [
      { name: 'University of Melbourne', ranking: '#1 Australia' },
      { name: 'University of Sydney', ranking: '#2 Australia' },
      { name: 'University of Queensland', ranking: '#3 Australia' },
      { name: 'Monash University', ranking: '#4 Australia' },
      { name: 'UNSW Sydney', ranking: '#5 Australia' },
      { name: 'Australian National University', ranking: '#6 Australia' },
    ],
    popularCourses: ['Engineering', 'Business & MBA', 'Nursing', 'IT & Computer Science', 'Hospitality', 'Health Sciences', 'Environmental Science', 'Education'],
    visaSteps: [
      { title: 'Receive CoE', desc: 'Get Confirmation of Enrolment from your university' },
      { title: 'Financial Proof', desc: 'Show sufficient funds for tuition and living costs' },
      { title: 'Online Application', desc: 'Apply for Student Visa (Subclass 500) via ImmiAccount' },
      { title: 'Health Check', desc: 'Complete health examinations with panel physicians' },
      { title: 'Biometrics', desc: 'Provide biometrics at the Australian Visa Application Centre' },
      { title: 'Visa Grant', desc: 'Receive your student visa and prepare for departure' },
    ],
    costs: [
      { item: 'Undergraduate Tuition', amount: 'AUD 20,000 - 45,000/year' },
      { item: 'Postgraduate Tuition', amount: 'AUD 22,000 - 50,000/year' },
      { item: 'Living Expenses', amount: 'AUD 21,041/year (minimum)' },
      { item: 'Visa Application Fee', amount: 'AUD 650' },
      { item: 'Health Insurance (OSHC)', amount: 'AUD 500-600/year' },
    ],
    benefits: [
      'Post-study work visa up to 4 years',
      'High minimum wage for part-time work',
      'Excellent research opportunities',
      'Beautiful natural environment',
      'Strong consumer protection laws',
      'Multicultural society',
      'Regional study bonuses for visa extension',
      'Pathway to permanent residency',
    ],
    requirements: [
      'Academic transcripts',
      'IELTS 6.0-7.0 or PTE Academic',
      'Statement of purpose',
      'Financial capacity evidence',
      'Overseas Student Health Cover (OSHC)',
      'GTE (Genuine Temporary Entrant) statement',
      'Valid passport',
    ],
  },
  Europe: {
    flag: '🇪🇺',
    gradient: 'from-indigo-700 to-indigo-500',
    title: 'Study in Europe',
    subtitle: 'Affordable Tuition with Schengen Access',
    description: 'Europe offers an incredible diversity of educational opportunities, from tuition-free programs in Germany to world-renowned institutions in the Netherlands, Sweden, and Ireland. With a Schengen visa, you can travel across 26 countries, experiencing diverse cultures while earning a prestigious European degree.',
    stats: [
      { value: '500+', label: 'Universities' },
      { value: '400+', label: 'Students Placed' },
      { value: '€0-€15K', label: 'Tuition/Year' },
      { value: '20 hrs/wk', label: 'Work Allowed' },
    ],
    topUniversities: [
      { name: 'TU Munich', ranking: '#1 Germany' },
      { name: 'University of Amsterdam', ranking: '#1 Netherlands' },
      { name: 'Trinity College Dublin', ranking: '#1 Ireland' },
      { name: 'KTH Royal Institute', ranking: '#1 Sweden' },
      { name: 'University of Bologna', ranking: '#1 Italy' },
      { name: 'Sorbonne University', ranking: '#1 France' },
    ],
    popularCourses: ['Engineering', 'Business & Management', 'Computer Science', 'Renewable Energy', 'Data Science', 'Medicine', 'Design', 'International Relations'],
    visaSteps: [
      { title: 'University Admission', desc: 'Receive admission letter from your chosen European university' },
      { title: 'Financial Proof', desc: 'Show blocked account or scholarship proof as required' },
      { title: 'Visa Application', desc: 'Apply at the embassy of your destination country' },
      { title: 'Health Insurance', desc: 'Obtain travel and student health insurance' },
      { title: 'Interview', desc: 'Attend visa interview at the embassy' },
      { title: 'Visa Approval', desc: 'Receive your student visa and Schengen access' },
    ],
    costs: [
      { item: 'Tuition (Germany)', amount: '€0 - €500/semester (public)' },
      { item: 'Tuition (Netherlands)', amount: '€6,000 - €15,000/year' },
      { item: 'Tuition (Ireland)', amount: '€9,000 - €25,000/year' },
      { item: 'Living Expenses', amount: '€700 - €1,200/month' },
      { item: 'Visa Fee', amount: '€60 - €100' },
    ],
    benefits: [
      'Free or low-cost tuition in many countries',
      'Schengen visa for 26-country access',
      'Rich cultural and historical experience',
      'Strong focus on research and innovation',
      'English-taught programs widely available',
      'Post-study work opportunities',
      'High quality of life',
      'Multilingual environment',
    ],
    requirements: [
      'Academic transcripts and certificates',
      'IELTS 6.0-6.5 or equivalent',
      'Motivation letter / SOP',
      'Letters of recommendation',
      'Financial proof or blocked account',
      'Health insurance',
      'Valid passport',
    ],
  },
  Malaysia: {
    flag: '🇲🇾',
    gradient: 'from-yellow-700 to-yellow-500',
    title: 'Study in Malaysia',
    subtitle: 'Affordable Quality Education in Asia',
    description: 'Malaysia has emerged as a top study destination in Asia, offering high-quality education at affordable prices. Many UK, Australian, and US universities have branch campuses in Malaysia, allowing you to earn internationally recognized degrees at a fraction of the cost. With English widely spoken and a vibrant multicultural society, Malaysia provides an excellent gateway to Asian opportunities.',
    stats: [
      { value: '100+', label: 'Universities' },
      { value: '300+', label: 'Students Placed' },
      { value: 'MYR 15K-40K', label: 'Tuition/Year' },
      { value: '20 hrs/wk', label: 'Work Allowed' },
    ],
    topUniversities: [
      { name: 'University of Malaya', ranking: '#1 Malaysia' },
      { name: 'Monash University Malaysia', ranking: 'Branch Campus' },
      { name: 'University of Nottingham Malaysia', ranking: 'Branch Campus' },
      { name: 'Taylor\'s University', ranking: 'Top Private' },
      { name: 'UCSI University', ranking: 'Top Private' },
      { name: 'Swinburne Malaysia', ranking: 'Branch Campus' },
    ],
    popularCourses: ['Business & MBA', 'Engineering', 'Medicine', 'Computer Science', 'Hospitality', 'Pharmacy', 'Architecture', 'Mass Communication'],
    visaSteps: [
      { title: 'University Offer', desc: 'Receive offer letter from your chosen Malaysian institution' },
      { title: 'Visa Application', desc: 'University applies for Student Pass on your behalf' },
      { title: 'Medical Check', desc: 'Complete medical examination in home country' },
      { title: 'Approval Letter', desc: 'Receive Visa Approval Letter (VAL)' },
      { title: 'Arrival in Malaysia', desc: 'Complete immigration clearance at airport' },
      { title: 'Student Pass', desc: 'Receive your Student Pass sticker at the university' },
    ],
    costs: [
      { item: 'Undergraduate Tuition', amount: 'MYR 15,000 - 40,000/year' },
      { item: 'Postgraduate Tuition', amount: 'MYR 20,000 - 50,000/year' },
      { item: 'Living Expenses', amount: 'MYR 1,500 - 2,500/month' },
      { item: 'Visa Processing Fee', amount: 'MYR 300 - 500' },
      { item: 'Medical Insurance', amount: 'MYR 300 - 600/year' },
    ],
    benefits: [
      'Affordable tuition and living costs',
      'Branch campuses of UK/Aus/US universities',
      'English-medium instruction',
      'Cultural diversity and halal food',
      'Gateway to Southeast Asian markets',
      'Warm climate year-round',
      'Low cost of living',
      'Easy visa process',
    ],
    requirements: [
      'Academic transcripts',
      'IELTS 5.5-6.0 or equivalent',
      'Personal statement',
      'Financial proof',
      'Medical examination report',
      'Passport-size photographs',
      'Valid passport (12+ months validity)',
    ],
  },
}

export default function StudyDestinationPage({ country }: StudyDestinationPageProps) {
  const { setCurrentView } = useAppStore()
  const data = countryData[country]

  if (!data) return null

  return (
    <div>
      {/* Hero */}
      <section className={`bg-gradient-to-br ${data.gradient} text-white py-16 lg:py-24 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-96 h-96 bg-white rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-5xl">{data.flag}</span>
              <Badge className="bg-white/20 text-white border-white/30 px-3">Study Abroad</Badge>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold">{data.title}</h1>
            <p className="text-xl text-white/80">{data.subtitle}</p>
            <p className="text-white/70 leading-relaxed max-w-2xl">{data.description}</p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setCurrentView('free-consultation')}
                className="bg-[#F37021] hover:bg-[#e0651a] text-white h-12 px-8"
              >
                Get Free Counseling <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                onClick={() => setCurrentView('universities')}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 h-12 px-8"
              >
                View Universities
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-white py-10 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {data.stats.map((stat, i) => (
              <div key={i} className="text-center space-y-1">
                <div className="text-2xl lg:text-3xl font-bold text-[#F37021]">{stat.value}</div>
                <div className="text-sm text-[#555555]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Universities */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">Top Universities</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Top Universities in {country}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.topUniversities.map((uni) => (
              <Card key={uni.name} className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group" onClick={() => setCurrentView('universities')}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F37021]/10 rounded-xl flex items-center justify-center text-[#F37021] shrink-0">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1A2332] group-hover:text-[#F37021] transition-colors">{uni.name}</h4>
                    <Badge variant="secondary" className="text-xs mt-1">{uni.ranking}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">Popular Courses</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Popular Courses in {country}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.popularCourses.map((course) => (
              <Card key={course} className="border-0 bg-[#F7F9FC] hover:shadow-md transition-all cursor-pointer group" onClick={() => setCurrentView('courses')}>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-5 w-5 text-[#0066CC] mx-auto mb-2" />
                  <span className="text-sm font-medium text-[#1A2332] group-hover:text-[#F37021] transition-colors">{course}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visa Process */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">Visa Process</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Student Visa Process for {country}</h2>
            <p className="mt-3 text-[#555555]">Our expert visa team guides you through every step with a 98% success rate.</p>
          </div>
          <div className="space-y-4">
            {data.visaSteps.map((step, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-9 h-9 bg-[#F37021] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1A2332]">{step.title}</h4>
                    <p className="text-sm text-[#555555] mt-1">{step.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button
              onClick={() => setCurrentView('visa-guidance')}
              className="bg-[#F37021] hover:bg-[#e0651a] text-white"
            >
              Get Visa Guidance <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Cost of Living */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">Costs</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Cost of Studying in {country}</h2>
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="divide-y">
                {data.costs.map((cost, i) => (
                  <div key={i} className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-[#F37021] shrink-0" />
                      <span className="text-sm font-medium text-[#1A2332]">{cost.item}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#F37021]">{cost.amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits & Requirements */}
      <section className="bg-[#F7F9FC] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Benefits of Studying in {country}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm text-[#555555]">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                  <BookOpen className="h-5 w-5 text-[#0066CC]" />
                  Entry Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#0066CC] shrink-0 mt-0.5" />
                      <span className="text-sm text-[#555555]">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#F37021] to-[#e0651a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">Ready to Study in {country}?</h2>
          <p className="text-orange-100 max-w-xl mx-auto">
            Book a free consultation with our {country} education experts and take the first step toward your dream university.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => setCurrentView('free-consultation')}
              className="bg-white text-[#F37021] hover:bg-gray-100 h-12 px-8 font-semibold"
            >
              Book Free Consultation <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              onClick={() => setCurrentView('student-register')}
              variant="outline"
              className="border-white text-white hover:bg-white/10 h-12 px-8"
            >
              Register Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
