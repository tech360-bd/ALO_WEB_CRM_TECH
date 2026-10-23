import { Metadata } from 'next';
import Link from 'next/link';
import { StudentJourneyMapDiagram } from '@/components/diagrams';
import { AloCtaLink } from '@/components/website/AloCtaLink';

export const metadata: Metadata = {
  title: 'Student Journey | From Bangladesh to International Campus | ALO Education',
  description: 'Visualize your journey from dreaming of studying abroad to graduation. See how ALO Education supports you at every phase.',
};

export default function StudentJourneyPage() {
  const phases = [
    {
      id: "phase-1",
      title: "Discover",
      timeline: "Month 1-2",
      icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      activities: ["Profile evaluation", "Country & course selection", "Career counseling"],
      aloRole: "We assess your strengths, budget, and aspirations to recommend the best-fit destinations and universities."
    },
    {
      id: "phase-2",
      title: "Apply",
      timeline: "Month 2-4",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      activities: ["Document preparation", "SOP & LOR drafting", "University applications"],
      aloRole: "Our experts meticulously prepare your documents and submit flawless applications to maximize acceptance chances."
    },
    {
      id: "phase-3",
      title: "Admit",
      timeline: "Month 3-5",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      activities: ["Offer letter tracking", "Interview prep", "Finalizing university choice"],
      aloRole: "We help you compare offers, secure scholarships, and meet all conditions for unconditional acceptance."
    },
    {
      id: "phase-4",
      title: "Prepare",
      timeline: "Month 4-6",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      activities: ["Tuition deposit", "Visa documentation", "Financial solvency proof"],
      aloRole: "We guide you through complex financial requirements and ensure your visa file is 100% compliant."
    },
    {
      id: "phase-5",
      title: "Depart",
      timeline: "Month 5-7",
      icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      activities: ["Visa interview", "Flight booking", "Pre-departure briefing"],
      aloRole: "We conduct mock interviews, arrange networking sessions, and prepare you for cultural transition."
    },
    {
      id: "phase-6",
      title: "Arrive",
      timeline: "Month 6-8",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      activities: ["Airport pickup", "Accommodation check-in", "Campus enrollment"],
      aloRole: "Our partner networks ensure a smooth arrival, safe housing, and seamless integration into university life."
    },
    {
      id: "phase-7",
      title: "Succeed",
      timeline: "Ongoing",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      activities: ["Academic support", "Part-time job tips", "Alumni community"],
      aloRole: "We stay connected! ALO is always here for post-arrival support, networking, and future career guidance."
    }
  ];

  return (
    <div className="pt-20 bg-white min-h-screen">
      
      {/* Hero Section */}
      <section className="bg-[var(--alo-brand-pale)] text-[var(--alo-text)] py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero/study-abroad-hero.png')] bg-cover bg-center opacity-10" aria-hidden="true"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Your Journey Starts Here</h1>
          <p className="text-xl md:text-2xl text-[var(--alo-body)] mb-10">
            From dreaming in Bangladesh to graduating on an international campus. We are with you at every step.
          </p>
          
          {/* No fabricated statistics: unverified success rates and invented
              counts are prohibited (content governance). Qualitative,
              truthful value propositions only. */}
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            <div className="bg-white rounded-2xl p-6 border border-[var(--alo-border)] shadow-sm w-40">
              <div className="text-3xl font-bold text-[var(--alo-cta)] mb-2">End-to-End</div>
              <div className="text-sm text-[var(--alo-text-muted)]">Application Support</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-[var(--alo-border)] shadow-sm w-40">
              <div className="text-3xl font-bold text-[var(--alo-cta)] mb-2">8+</div>
              <div className="text-sm text-[var(--alo-text-muted)]">Study Destinations</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-[var(--alo-border)] shadow-sm w-40">
              <div className="text-3xl font-bold text-[var(--alo-cta)] mb-2">Verified</div>
              <div className="text-sm text-[var(--alo-text-muted)]">University Data</div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Map Diagram — sentiment by stage */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--alo-text)] mb-4">The Journey at a Glance</h2>
            <p className="text-lg text-[var(--alo-body)]">Where students feel confident, where it gets hard, and how ALO smooths the trough.</p>
          </div>
          <StudentJourneyMapDiagram />
        </div>
      </section>

      {/* The Journey Timeline */}
      <section className="py-24 bg-[var(--alo-page)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--alo-text)] mb-6">The 7 Phases of Success</h2>
            <p className="text-lg text-[var(--alo-body)]">A structured, proven methodology that eliminates confusion and maximizes your chances of securing admissions and visas.</p>
          </div>

          <div className="max-w-5xl mx-auto space-y-12 md:space-y-0 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute left-[50%] top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--alo-brand)] via-[var(--alo-cta)] to-[var(--alo-brand)] -translate-x-1/2 rounded-full"></div>

            {phases.map((phase, index) => (
              <div key={phase.id} className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''} relative md:py-12`}>
                
                {/* Center Node */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white border-4 border-[var(--alo-brand)] items-center justify-center z-10 shadow-lg">
                  <span className="text-xl font-bold text-[var(--alo-cta)]">{index + 1}</span>
                </div>

                {/* Content Card */}
                <div className="w-full md:w-1/2 flex flex-col items-center text-center md:items-start md:text-left p-6 md:p-8 bg-white rounded-3xl shadow-sm border border-[var(--alo-border)] hover:shadow-xl transition-all relative z-10 group">
                  <div className={`w-14 h-14 rounded-2xl bg-blue-50 text-[var(--alo-brand)] flex items-center justify-center mb-6 group-hover:bg-[var(--alo-brand)] group-hover:text-white transition-colors ${index % 2 === 0 ? 'md:self-end' : ''}`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={phase.icon}></path>
                    </svg>
                  </div>
                  
                  <div className={`w-full flex flex-col ${index % 2 === 0 ? 'md:items-end md:text-right' : ''}`}>
                    <div className="flex items-center gap-3 mb-2 flex-wrap justify-center md:justify-start">
                      <h3 className="text-2xl font-bold text-[var(--alo-text)]">{phase.title}</h3>
                      <span className="bg-orange-50 text-[var(--alo-cta)] text-xs font-bold px-3 py-1 rounded-full">
                        {phase.timeline}
                      </span>
                    </div>
                    
                    <ul className="space-y-2 mb-6 mt-4">
                      {phase.activities.map((activity, i) => (
                        <li key={i} className={`flex items-center gap-2 text-[var(--alo-body)] ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                          <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className={`bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-[var(--alo-brand)] leading-relaxed w-full ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                      <strong>ALO's Role:</strong> {phase.aloRole}
                    </div>
                  </div>
                </div>

                {/* Empty Space for Grid Alignment */}
                <div className="hidden md:block w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--alo-text)] mb-4">Student Success Stories</h2>
            <p className="text-lg text-[var(--alo-body)]">Hear from those who have successfully completed the journey.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-[var(--alo-page)] p-8 rounded-3xl border border-[var(--alo-border)] relative">
                <svg className="w-10 h-10 text-[var(--alo-placeholder)] absolute top-6 right-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-[var(--alo-brand)] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    S
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--alo-text)]">Student Name {item}</h4>
                    <p className="text-sm text-[var(--alo-cta)]">University of Example, UK</p>
                  </div>
                </div>
                <p className="text-[var(--alo-body)] italic">
                  "ALO Education made the entire process seamless. Their guidance during the Visa application phase was exceptional. I highly recommend them to anyone planning to study abroad!"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[var(--alo-brand)] text-white">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Take the First Step?</h2>
          <p className="text-xl text-blue-100 mb-10">
            Let's start your journey today with a free profile evaluation and counseling session.
          </p>
          <AloCtaLink href="/book-consultation">
            Start Your Journey Now
          </AloCtaLink>
        </div>
      </section>

    </div>
  );
}
