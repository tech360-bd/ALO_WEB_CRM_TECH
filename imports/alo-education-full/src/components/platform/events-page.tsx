'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Globe,
  GraduationCap,
  ArrowRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const UPCOMING_EVENTS = [
  {
    id: 1,
    title: 'UK University Fair 2025 — Dhaka',
    date: 'March 22, 2025',
    time: '10:00 AM – 4:00 PM',
    location: 'Radisson Blu Dhaka Water Garden',
    type: 'Fair',
    format: 'In-Person',
    description: 'Meet representatives from 25+ top UK universities including Russell Group institutions. Get on-the-spot assessments, scholarship info, and application guidance.',
    universities: ['University of Manchester', 'University of Bristol', 'University of Sheffield', 'Queen Mary University'],
    featured: true,
    spotsLeft: 45,
  },
  {
    id: 2,
    title: 'Australia Study Abroad Webinar',
    date: 'April 5, 2025',
    time: '7:00 PM – 8:30 PM (BST)',
    location: 'Online — Zoom',
    type: 'Webinar',
    format: 'Online',
    description: 'Explore Australian education opportunities with representatives from Group of Eight universities. Learn about post-study work visas and scholarship options.',
    universities: ['University of Melbourne', 'University of Sydney', 'UNSW Sydney'],
    featured: false,
    spotsLeft: 120,
  },
  {
    id: 3,
    title: 'New Zealand Info Session — Chittagong',
    date: 'April 12, 2025',
    time: '2:00 PM – 5:00 PM',
    location: 'The Peninsula Chittagong',
    type: 'Info Session',
    format: 'In-Person',
    description: 'Discover New Zealand\'s world-class education system. Learn about visa requirements, tuition fees, and lifestyle for Bangladeshi students.',
    universities: ['University of Auckland', 'AUT University', 'University of Otago'],
    featured: false,
    spotsLeft: 80,
  },
  {
    id: 4,
    title: 'IELTS Preparation Masterclass',
    date: 'April 18, 2025',
    time: '6:00 PM – 8:00 PM (BST)',
    location: 'Online — Zoom',
    type: 'Workshop',
    format: 'Online',
    description: 'Free masterclass by British Council certified IELTS trainer. Tips for scoring 7.0+ in all bands with practice strategies and mock test techniques.',
    universities: [],
    featured: true,
    spotsLeft: 200,
  },
  {
    id: 5,
    title: 'Canada Express Entry & Study Pathway Seminar',
    date: 'May 3, 2025',
    time: '11:00 AM – 1:00 PM',
    location: 'ALO Education Office, Gulshan-2, Dhaka',
    type: 'Seminar',
    format: 'In-Person',
    description: 'Comprehensive seminar on Canadian study permits, Express Entry immigration pathway, and DLI-listed universities for Bangladeshi students.',
    universities: ['University of Toronto', 'University of British Columbia', 'McGill University'],
    featured: false,
    spotsLeft: 30,
  },
  {
    id: 6,
    title: 'Ireland Education Fair 2025',
    date: 'May 15, 2025',
    time: '10:00 AM – 3:00 PM',
    location: 'Le Meridien Dhaka',
    type: 'Fair',
    format: 'In-Person',
    description: 'Connect with Ireland\'s leading universities and colleges. Learn about the Third Level Graduate Scheme and work opportunities in Ireland.',
    universities: ['Trinity College Dublin', 'UCD', 'University of Galway', 'DCU'],
    featured: false,
    spotsLeft: 60,
  },
];

const PAST_EVENTS = [
  {
    id: 101,
    title: 'UK University Fair 2024 — Dhaka',
    date: 'November 15, 2024',
    attendees: 850,
    type: 'Fair',
    format: 'In-Person',
  },
  {
    id: 102,
    title: 'US Visa & Study Workshop',
    date: 'October 20, 2024',
    attendees: 320,
    type: 'Workshop',
    format: 'Online',
  },
  {
    id: 103,
    title: 'Australia Education Roadshow',
    date: 'September 8, 2024',
    attendees: 560,
    type: 'Fair',
    format: 'In-Person',
  },
  {
    id: 104,
    title: 'Scholarship Masterclass Webinar',
    date: 'August 12, 2024',
    attendees: 410,
    type: 'Webinar',
    format: 'Online',
  },
];

const EVENT_TYPES = ['All', 'Fair', 'Webinar', 'Info Session', 'Workshop', 'Seminar'];

const TYPE_COLORS: Record<string, string> = {
  Fair: 'bg-[#0052B8] text-white',
  Webinar: 'bg-purple-600 text-white',
  'Info Session': 'bg-emerald-600 text-white',
  Workshop: 'bg-amber-600 text-white',
  Seminar: 'bg-rose-600 text-white',
};

export function EventsPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [filter, setFilter] = useState('All');
  const [registered, setRegistered] = useState<Set<number>>(new Set());

  const filtered = filter === 'All' ? UPCOMING_EVENTS : UPCOMING_EVENTS.filter(e => e.type === filter);

  const handleRegister = (id: number) => {
    setRegistered(prev => new Set(prev).add(id));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Back button */}
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative bg-[#0052B8] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full border-2 border-white" />
          <div className="absolute bottom-10 left-20 w-96 h-96 rounded-full border border-white/50" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-8 w-8" />
            <Badge className="bg-white/20 text-white border-white/30">Events & Webinars</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Your Gateway to<br />Global Education Events
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
            Join our university fairs, webinars, and information sessions. Meet university representatives, attend workshops, and take the next step in your study abroad journey.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-6 py-3 text-base">
              Register for Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="border-white/50 text-white hover:bg-white/10 px-6 py-3 text-base" onClick={() => document.getElementById('upcoming')?.scrollIntoView({ behavior: 'smooth' })}>
              View Upcoming Events
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 mt-10 text-white/80 text-sm">
            <div className="flex items-center gap-2"><Users className="h-4 w-4" /> 2,000+ Annual Attendees</div>
            <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> 6 Countries Covered</div>
            <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> 100+ University Partners</div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section id="upcoming" className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Upcoming Events</h2>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === type
                    ? 'bg-[#0052B8] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0052B8] hover:text-[#0052B8]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Grid */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No events found for this category.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map(event => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Card className={`h-full hover:shadow-lg transition-shadow ${event.featured ? 'ring-2 ring-[#0052B8]' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={TYPE_COLORS[event.type] || 'bg-slate-600 text-white'}>{event.type}</Badge>
                        {event.featured && (
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                            <Star className="h-3 w-3 fill-amber-500" /> Featured
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                      <div className="space-y-2 text-sm text-slate-500 mb-4">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#0052B8]" /> {event.date}</div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#0052B8]" /> {event.time}</div>
                        <div className="flex items-center gap-2">
                          {event.format === 'Online' ? <Video className="h-4 w-4 text-[#0052B8]" /> : <MapPin className="h-4 w-4 text-[#0052B8]" />}
                          {event.location}
                        </div>
                      </div>
                      {event.universities.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-slate-400 mb-1.5">Participating Universities:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {event.universities.slice(0, 3).map(uni => (
                              <span key={uni} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{uni}</span>
                            ))}
                            {event.universities.length > 3 && <span className="text-xs text-slate-400">+{event.universities.length - 3} more</span>}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-xs text-slate-400">{event.spotsLeft} spots left</span>
                        {registered.has(event.id) ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" /> Registered
                          </div>
                        ) : (
                          <Button onClick={() => handleRegister(event.id)} className="bg-[#E8501A] hover:bg-[#d04515] text-white text-sm">
                            Register Free
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Past Events</h2>
          <p className="text-slate-600 mb-8">Browse our previous events and see the impact we&apos;ve made.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PAST_EVENTS.map(event => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-2 text-slate-500">{event.type} · {event.format}</Badge>
                  <h4 className="font-semibold text-slate-900 mb-1 text-sm">{event.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <Calendar className="h-3 w-3" /> {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="h-3 w-3" /> {event.attendees} attendees
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Attend */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Why Attend ALO Events?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Our events are designed to give you direct access to the information and connections you need.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <GraduationCap className="h-8 w-8 text-[#0052B8]" />, title: 'Direct University Access', desc: 'Meet admissions officers face-to-face. Get real answers about programs, entry requirements, and deadlines.' },
              { icon: <Globe className="h-8 w-8 text-[#0052B8]" />, title: 'Multi-Country Insights', desc: 'Compare destinations side by side — UK, Australia, New Zealand, Ireland, USA, and Canada all in one place.' },
              { icon: <CheckCircle2 className="h-8 w-8 text-[#0052B8]" />, title: 'On-Spot Assessments', desc: 'Get your academic profile evaluated instantly. Know your eligibility for programs and scholarships.' },
              { icon: <Users className="h-8 w-8 text-[#0052B8]" />, title: 'Peer Networking', desc: 'Connect with fellow aspiring students, alumni, and education consultants for support and advice.' },
              { icon: <Video className="h-8 w-8 text-[#0052B8]" />, title: 'Flexible Formats', desc: 'Attend in person or online — we host both physical fairs and virtual webinars to suit your schedule.' },
              { icon: <Star className="h-8 w-8 text-[#0052B8]" />, title: 'Exclusive Scholarships', desc: 'Access scholarship opportunities only announced at our events, unavailable through other channels.' },
            ].map((item, i) => (
              <Card key={i} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">{item.icon}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0052B8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Never Miss an Event</h2>
          <p className="text-white/90 max-w-xl mx-auto mb-8">Subscribe to our events newsletter and be the first to know about upcoming fairs, webinars, and info sessions.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-lg text-slate-900 placeholder-slate-400" />
            <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-6 py-3">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
