'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import {
  BookOpen, Globe, Award, Clock, Target, CheckCircle2,
  ArrowRight, Phone, ChevronDown, ChevronUp, Star, TrendingUp
} from 'lucide-react'

const testTypes = [
  { id: 'ielts', name: 'IELTS', fullName: 'International English Language Testing System', color: '#E4002B' },
  { id: 'pte', name: 'PTE', fullName: 'Pearson Test of English', color: '#0066CC' },
  { id: 'toefl', name: 'TOEFL', fullName: 'Test of English as a Foreign Language', color: '#0066CC' },
  { id: 'duolingo', name: 'Duolingo', fullName: 'Duolingo English Test', color: '#58CC02' },
]

const scoreRequirements = [
  { country: 'UK', ielts: '6.0 - 7.5', pte: '54 - 73', toefl: '78 - 110', duolingo: '95 - 130', popular: true },
  { country: 'USA', ielts: '6.0 - 7.0', pte: '53 - 68', toefl: '80 - 100', duolingo: '100 - 125', popular: true },
  { country: 'Canada', ielts: '6.0 - 7.0', pte: '54 - 65', toefl: '80 - 100', duolingo: '105 - 125', popular: true },
  { country: 'Australia', ielts: '6.0 - 7.5', pte: '50 - 72', toefl: '78 - 110', duolingo: '95 - 130', popular: false },
  { country: 'Germany', ielts: '6.0 - 7.0', pte: '56 - 67', toefl: '80 - 100', duolingo: '95 - 120', popular: false },
  { country: 'Malaysia', ielts: '5.0 - 6.5', pte: '42 - 58', toefl: '60 - 80', duolingo: '85 - 110', popular: false },
]

const testFormats: Record<string, { sections: Array<{ name: string; duration: string; description: string }> }> = {
  ielts: {
    sections: [
      { name: 'Listening', duration: '30 mins', description: '4 sections, 40 questions based on recorded conversations and monologues' },
      { name: 'Reading', duration: '60 mins', description: '3 sections, 40 questions from academic texts' },
      { name: 'Writing', duration: '60 mins', description: '2 tasks: describe visual data (150 words) + essay (250 words)' },
      { name: 'Speaking', duration: '11-14 mins', description: '3-part face-to-face interview with examiner' },
    ]
  },
  pte: {
    sections: [
      { name: 'Speaking & Writing', duration: '54-67 mins', description: 'Personal intro, read aloud, repeat sentence, describe image, re-tell lecture, essay' },
      { name: 'Reading', duration: '29-30 mins', description: 'Multiple choice, re-order paragraphs, fill in blanks' },
      { name: 'Listening', duration: '30-43 mins', description: 'Summarize spoken text, multiple choice, fill blanks, write from dictation' },
    ]
  },
  toefl: {
    sections: [
      { name: 'Reading', duration: '54-72 mins', description: '30-40 questions from 3-4 academic passages' },
      { name: 'Listening', duration: '41-57 mins', description: '28-39 questions from lectures, conversations, discussions' },
      { name: 'Speaking', duration: '17 mins', description: '4 tasks: express opinion, summarize reading/listening' },
      { name: 'Writing', duration: '50 mins', description: '2 tasks: integrated (185+ words) + independent (300+ words)' },
    ]
  },
  duolingo: {
    sections: [
      { name: 'Adaptive Test', duration: '45 mins', description: 'Computer-adaptive questions assessing reading, writing, listening, and speaking' },
      { name: 'Video Interview & Writing Sample', duration: '10 mins', description: 'Respond to open-ended prompts (sent to institutions)' },
    ]
  },
}

const preparationTips = [
  { title: 'Start Early', description: 'Begin preparation at least 3-6 months before your test date. Consistent daily practice is better than cramming.', icon: Clock },
  { title: 'Practice Regularly', description: 'Take full-length practice tests under timed conditions. Familiarize yourself with the test format and question types.', icon: Target },
  { title: 'Focus on Weak Areas', description: 'Identify your weak sections through practice tests and allocate more time to improve those areas.', icon: TrendingUp },
  { title: 'Build Vocabulary', description: 'Read academic texts, newspapers, and journals. Learn 10-15 new words daily and use them in sentences.', icon: BookOpen },
  { title: 'Improve Listening Skills', description: 'Watch English movies, TED talks, and podcasts. Practice note-taking while listening.', icon: Globe },
  { title: 'Writing Practice', description: 'Write essays on various topics. Get feedback from teachers or use online tools for grammar checking.', icon: Award },
]

const practiceResources = [
  { name: 'IELTS Official Practice Materials', type: 'IELTS', url: '#', free: false },
  { name: 'PTE Official Practice App', type: 'PTE', url: '#', free: true },
  { name: 'TOEFL Practice Online', type: 'TOEFL', url: '#', free: false },
  { name: 'Duolingo Practice Test', type: 'Duolingo', url: '#', free: true },
  { name: 'ALO Mock Test Series', type: 'All', url: '#', free: true },
  { name: 'British Council IELTS Prep', type: 'IELTS', url: '#', free: true },
]

const faqItems = [
  { q: 'Which English test should I take?', a: 'It depends on your target university and country. IELTS is widely accepted globally, especially in UK and Australia. TOEFL is preferred by many US universities. PTE is gaining acceptance and offers faster results. Duolingo is convenient and affordable, accepted by a growing number of institutions.' },
  { q: 'How long are test scores valid?', a: 'Most English test scores are valid for 2 years from the test date. IELTS, TOEFL, and PTE scores expire after 2 years. Duolingo scores are also valid for 2 years.' },
  { q: 'Can I retake the test if I\'m not satisfied with my score?', a: 'Yes, you can retake any English test. There is no limit on attempts for IELTS or TOEFL. PTE can be retaken after 5 days. Duolingo can be retaken after 30 days. Check specific test policies for detailed retake rules.' },
  { q: 'What is the minimum score required for student visas?', a: 'Requirements vary by country: UK Student Visa requires IELTS 4.0 (B1 level) or equivalent. However, universities typically require higher scores (6.0-7.5 for IELTS). Check with your target university for specific requirements.' },
  { q: 'How much does each test cost?', a: 'IELTS: approximately $215-250, TOEFL: approximately $185-300, PTE: approximately $200-250, Duolingo: approximately $59. Prices vary by location.' },
  { q: 'Should I take the Academic or General version?', a: 'For university admission, you must take the Academic version of IELTS or TOEFL. The General version is for immigration and work purposes. PTE Academic and Duolingo only have academic versions.' },
]

export default function EnglishPrepPage() {
  const { setCurrentView } = useAppStore()
  const [activeTest, setActiveTest] = useState('ielts')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [consultName, setConsultName] = useState('')
  const [consultPhone, setConsultPhone] = useState('')

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0066CC 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full" style={{ background: '#F37021' }} />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full" style={{ background: '#FFB347' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="text-center">
            <Badge className="mb-4 text-sm" style={{ backgroundColor: '#F37021', color: 'white' }}>English Test Preparation</Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ace Your English Proficiency Test
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Expert preparation for IELTS, PTE, TOEFL & Duolingo. Get the score you need for your dream university.
            </p>
          </div>

          {/* Test Type Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {testTypes.map(test => (
              <button
                key={test.id}
                onClick={() => setActiveTest(test.id)}
                className="px-6 py-3 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: activeTest === test.id ? '#F37021' : 'rgba(255,255,255,0.15)',
                  color: activeTest === test.id ? 'white' : 'white',
                  border: activeTest === test.id ? '2px solid #F37021' : '2px solid rgba(255,255,255,0.3)',
                }}
              >
                {test.name}
              </button>
            ))}
          </div>

          <div className="text-center">
            <p className="text-blue-100 text-lg mb-2">
              {testTypes.find(t => t.id === activeTest)?.fullName}
            </p>
          </div>
        </div>
      </section>

      {/* Score Requirements */}
      <section className="py-16" style={{ backgroundColor: '#F7F9FC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#1A2332' }}>
              Score Requirements by Country
            </h2>
            <p className="text-gray-600 mt-2">Minimum to competitive score ranges for university admission</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm border">
              <thead>
                <tr style={{ backgroundColor: '#1A2332' }}>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Country</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-white">IELTS</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-white">PTE</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-white">TOEFL</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-white">Duolingo</th>
                </tr>
              </thead>
              <tbody>
                {scoreRequirements.map((req, i) => (
                  <tr key={req.country} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {req.country}
                      {req.popular && <Badge className="text-xs" style={{ backgroundColor: '#F37021', color: 'white' }}>Popular</Badge>}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{req.ielts}</td>
                    <td className="px-4 py-3 text-center text-sm">{req.pte}</td>
                    <td className="px-4 py-3 text-center text-sm">{req.toefl}</td>
                    <td className="px-4 py-3 text-center text-sm">{req.duolingo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Test Format Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#1A2332' }}>
              Test Format Overview
            </h2>
            <p className="text-gray-600 mt-2">Understand the structure of each test section</p>
          </div>

          <Tabs value={activeTest} onValueChange={setActiveTest}>
            <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto mb-8">
              {testTypes.map(test => (
                <TabsTrigger key={test.id} value={test.id}>{test.name}</TabsTrigger>
              ))}
            </TabsList>

            {testTypes.map(test => (
              <TabsContent key={test.id} value={test.id}>
                <div className="grid md:grid-cols-2 gap-6">
                  {testFormats[test.id].sections.map((section, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg" style={{ color: '#1A2332' }}>{section.name}</CardTitle>
                          <Badge variant="outline" style={{ borderColor: test.color, color: test.color }}>
                            <Clock className="w-3 h-3 mr-1" />{section.duration}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm">{section.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Preparation Tips */}
      <section className="py-16" style={{ backgroundColor: '#F7F9FC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#1A2332' }}>
              Expert Preparation Tips
            </h2>
            <p className="text-gray-600 mt-2">Proven strategies from our experienced instructors</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {preparationTips.map((tip, i) => (
              <Card key={i} className="hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#FFF3E8' }}>
                    <tip.icon className="w-6 h-6" style={{ color: '#F37021' }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: '#1A2332' }}>{tip.title}</h3>
                  <p className="text-gray-600 text-sm">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Resources */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#1A2332' }}>
              Practice Resources
            </h2>
            <p className="text-gray-600 mt-2">Curated resources to help you prepare effectively</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {practiceResources.map((res, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F0FE' }}>
                      <BookOpen className="w-5 h-5" style={{ color: '#0066CC' }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#1A2332' }}>{res.name}</p>
                      <p className="text-xs text-gray-500">{res.type}</p>
                    </div>
                  </div>
                  {res.free && <Badge className="text-xs" style={{ backgroundColor: '#58CC02', color: 'white' }}>Free</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Book Consultation CTA */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #F37021 0%, #FFB347 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#1A2332' }}>
                Get Personalized Test Prep Guidance
              </h2>
              <p className="text-gray-600 mt-2">Our expert counselors will help you choose the right test and create a study plan</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A2332' }}>Full Name</label>
                <Input
                  value={consultName}
                  onChange={(e) => setConsultName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A2332' }}>Phone Number</label>
                <Input
                  value={consultPhone}
                  onChange={(e) => setConsultPhone(e.target.value)}
                  placeholder="Enter your phone"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" style={{ color: '#1A2332' }}>Preferred Test</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select a test" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ielts">IELTS</SelectItem>
                  <SelectItem value="pte">PTE</SelectItem>
                  <SelectItem value="toefl">TOEFL</SelectItem>
                  <SelectItem value="duolingo">Duolingo</SelectItem>
                  <SelectItem value="not-sure">Not Sure - Need Guidance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full text-white font-semibold py-3"
              style={{ backgroundColor: '#F37021' }}
              onClick={() => {
                if (consultName && consultPhone) {
                  fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      firstName: consultName.split(' ')[0],
                      lastName: consultName.split(' ').slice(1).join(' ') || '',
                      phone: consultPhone,
                      source: 'WEBSITE',
                      notes: 'English test prep consultation request',
                      status: 'new',
                    })
                  }).then(() => {
                    setConsultName('')
                    setConsultPhone('')
                  })
                }
              }}
            >
              Book Free Consultation <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16" style={{ backgroundColor: '#F7F9FC' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#1A2332' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 mt-2">Common questions about English proficiency tests</p>
          </div>

          <div className="space-y-3">
            {faqItems.map((faq, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm pr-4" style={{ color: '#1A2332' }}>{faq.q}</h3>
                    {expandedFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                  </div>
                  {expandedFaq === i && (
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">{faq.a}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Button
              className="text-white font-semibold"
              style={{ backgroundColor: '#0066CC' }}
              onClick={() => setCurrentView('contact')}
            >
              <Phone className="w-4 h-4 mr-2" /> Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
