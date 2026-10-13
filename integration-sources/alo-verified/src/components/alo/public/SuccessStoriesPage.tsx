'use client'

import React from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  ArrowRight,
  GraduationCap,
  MapPin,
  Quote,
  ChevronRight,
} from 'lucide-react'

const stories = [
  {
    name: 'Rahim Ahmed',
    course: 'MSc Computer Science',
    university: 'University of Manchester',
    country: 'UK',
    flag: '🇬🇧',
    quote: 'ALO Education made my dream of studying in the UK a reality. From university selection to visa guidance, their support was exceptional. I especially appreciated the UKVI interview preparation — it gave me the confidence I needed. Now I\'m working as a software engineer in London!',
    year: '2023',
  },
  {
    name: 'Fatima Begum',
    course: 'MBA',
    university: 'University of Sydney',
    country: 'Australia',
    flag: '🇦🇺',
    quote: 'The visa guidance was exceptional. I got my approval on the first attempt! ALO Education\'s counselors were patient and thorough in helping me prepare all my documents. I highly recommend them to anyone looking to study in Australia.',
    year: '2023',
  },
  {
    name: 'Karim Hassan',
    course: 'BEng Mechanical Engineering',
    university: 'University of Toronto',
    country: 'Canada',
    flag: '🇨🇦',
    quote: 'From application to arrival, ALO was with me every step of the way. They helped me secure a scholarship worth CAD 15,000, which made a huge difference. The pre-departure briefing was incredibly helpful for settling in.',
    year: '2024',
  },
  {
    name: 'Nusrat Jahan',
    course: 'MSc Data Science',
    university: 'Imperial College London',
    country: 'UK',
    flag: '🇬🇧',
    quote: 'I was nervous about the whole process, but ALO Education made it so smooth. Their AI-powered university matching helped me find the perfect program. The counselor even helped me with my personal statement, which I believe was key to my admission.',
    year: '2024',
  },
  {
    name: 'Imran Chowdhury',
    course: 'MSc Renewable Energy',
    university: 'TU Munich',
    country: 'Germany',
    flag: '🇩🇪',
    quote: 'Studying in Germany was always my dream, but the process seemed complicated. ALO Education simplified everything — from university applications to the visa process. And the best part? My tuition is free! I only pay a semester fee of €150.',
    year: '2024',
  },
  {
    name: 'Taslima Akter',
    course: 'Bachelor of Nursing',
    university: 'Monash University Malaysia',
    country: 'Malaysia',
    flag: '🇲🇾',
    quote: 'As a female student, safety was my top priority. ALO Education recommended Malaysia, and it was the best decision. The cost of living is affordable, the education quality is excellent (Monash is a top Australian university), and I feel completely safe here.',
    year: '2023',
  },
  {
    name: 'Sakib Rahman',
    course: 'MS Computer Engineering',
    university: 'University of California, Berkeley',
    country: 'USA',
    flag: '🇺🇸',
    quote: 'Getting into UC Berkeley seemed impossible, but ALO Education believed in me from the start. They helped me craft a compelling application, prepared me for the visa interview, and even connected me with alumni. I\'m now on OPT working in Silicon Valley!',
    year: '2023',
  },
  {
    name: 'Maliha Islam',
    course: 'MA International Relations',
    university: 'University of Amsterdam',
    country: 'Netherlands',
    flag: '🇳🇱',
    quote: 'ALO Education opened my eyes to European universities. The Netherlands offers excellent English-taught programs at a fraction of the cost. With the Schengen visa, I can travel across Europe. It\'s been the most enriching experience of my life.',
    year: '2024',
  },
  {
    name: 'Arif Hossain',
    course: 'PhD Biotechnology',
    university: 'University of Cambridge',
    country: 'UK',
    flag: '🇬🇧',
    quote: 'ALO Education helped me secure a fully-funded PhD position at Cambridge. Their scholarship support team was instrumental in my Gates Cambridge application. I\'m now doing cutting-edge research and loving every moment.',
    year: '2024',
  },
]

export default function SuccessStoriesPage() {
  const { setCurrentView } = useAppStore()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2332] to-[#0066CC] text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30 mb-3">Success Stories</Badge>
          <h1 className="text-3xl lg:text-5xl font-bold">Student Success Stories</h1>
          <p className="mt-3 text-gray-300 max-w-2xl">
            Read inspiring stories from students who have achieved their study abroad dreams with ALO Education.
          </p>
        </div>
      </section>

      {/* Featured Story */}
      <section className="bg-[#F7F9FC] py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-[#F37021]/5 to-[#0066CC]/5 overflow-hidden">
            <CardContent className="p-8 lg:p-10">
              <div className="flex items-center gap-2 mb-4">
                <Quote className="h-6 w-6 text-[#F37021]" />
                <Badge className="bg-[#F37021] text-white">Featured Story</Badge>
              </div>
              <p className="text-lg text-[#1A2332] leading-relaxed italic">
                &ldquo;{stories[0].quote}&rdquo;
              </p>
              <div className="mt-6 pt-6 border-t flex items-center gap-4">
                <div className="w-14 h-14 bg-[#F37021] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {stories[0].name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-[#1A2332]">{stories[0].name}</p>
                  <p className="text-sm text-[#555555]">{stories[0].course}</p>
                  <p className="text-sm text-[#F37021]">{stories[0].university} {stories[0].flag}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* All Stories */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#1A2332]">More Success Stories</h2>
            <p className="mt-2 text-[#555555]">Every story represents a dream fulfilled</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.slice(1).map((story, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-[#FFB347] text-[#FFB347]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#555555] leading-relaxed italic line-clamp-4">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1A2332] rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {story.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1A2332]">{story.name}</p>
                        <p className="text-xs text-[#555555]">{story.course}</p>
                        <p className="text-xs text-[#F37021]">{story.flag} {story.university}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#1A2332] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '5,000+', label: 'Students Placed' },
              { value: '98%', label: 'Visa Success Rate' },
              { value: '200+', label: 'University Partners' },
              { value: '6', label: 'Countries' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-[#FFB347]">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#F37021] to-[#e0651a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">Write Your Success Story</h2>
          <p className="text-orange-100 max-w-xl mx-auto">
            Join thousands of students who have achieved their dreams with ALO Education.
          </p>
          <Button onClick={() => setCurrentView('free-consultation')} className="bg-white text-[#F37021] hover:bg-gray-100 h-12 px-8 font-semibold">
            Start Your Journey <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </section>
    </div>
  )
}
