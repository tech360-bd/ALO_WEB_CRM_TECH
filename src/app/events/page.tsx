import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study Abroad Events & Webinars | ALO Education Bangladesh',
  description: 'Join our exclusive university fairs, visa workshops, and scholarship seminars to kickstart your study abroad journey.',
};

const events = [
  {
    id: 1,
    title: 'UK University Admissions Fair 2024',
    type: 'University Fair',
    date: 'Oct 15, 2024',
    time: '10:00 AM - 5:00 PM',
    venue: 'ALO Education Dhaka Office',
    description: 'Meet representatives from 20+ top UK universities. On-spot assessments available.',
    speakers: 'University Delegates',
    isUpcoming: true,
  },
  {
    id: 2,
    title: 'USA F-1 Visa Interview Masterclass',
    type: 'Visa Workshop',
    date: 'Oct 20, 2024',
    time: '3:00 PM - 5:00 PM',
    venue: 'Online (Zoom)',
    description: 'Learn the secrets to cracking the US student visa interview from ex-visa officers.',
    speakers: 'Mr. Rahman, Senior Visa Expert',
    isUpcoming: true,
  },
  {
    id: 3,
    title: 'Study in Canada: Scholarships & Pathways',
    type: 'Scholarship Seminar',
    date: 'Oct 25, 2024',
    time: '4:00 PM - 6:00 PM',
    venue: 'ALO Education Sylhet Office',
    description: 'Discover how to secure partial and full scholarships for Canadian undergraduate programs.',
    speakers: 'Sarah Jenkins, Canada Education Expert',
    isUpcoming: true,
  },
  {
    id: 4,
    title: 'IELTS Band 8.0 Strategy Session',
    type: 'IELTS Strategy',
    date: 'Nov 02, 2024',
    time: '11:00 AM - 1:00 PM',
    venue: 'Online (Zoom)',
    description: 'Master the IELTS reading and writing modules with proven strategies.',
    speakers: 'Ms. Emily, CELTA Certified Trainer',
    isUpcoming: true,
  },
  {
    id: 5,
    title: 'Australia Spring Intake Counseling',
    type: 'One-on-One Counseling Camp',
    date: 'Sep 10, 2024',
    time: '10:00 AM - 4:00 PM',
    venue: 'ALO Education Dhaka Office',
    description: 'Personalized profile evaluation for Australia February/March intakes.',
    speakers: 'Expert Counselors',
    isUpcoming: false,
  }
];

export default function EventsPage() {
  const upcomingEvents = events.filter(e => e.isUpcoming);
  const pastEvents = events.filter(e => !e.isUpcoming);

  return (
    <main className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="bg-[#0B5ED7] py-16 text-white text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Events & Webinars</h1>
        <p className="text-xl max-w-2xl mx-auto opacity-90">
          Connect with university representatives, gain visa insights, and plan your study abroad journey.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {upcomingEvents.map(event => (
            <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col">
              <div className="p-6 flex-grow">
                <span className="inline-block px-3 py-1 bg-blue-100 text-[#0B5ED7] text-xs font-bold rounded-full mb-4">
                  {event.type}
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <div className="text-sm text-gray-500 mb-4 space-y-1">
                  <p>📅 {event.date} | ⏰ {event.time}</p>
                  <p>📍 {event.venue}</p>
                </div>
                <p className="text-gray-700 mb-4">{event.description}</p>
                <p className="text-sm font-medium text-gray-600">Speakers: {event.speakers}</p>
              </div>
              <div className="p-6 pt-0 mt-auto">
                <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full bg-[#F97316] hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors">
                  Register Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Past Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastEvents.map(event => (
            <div key={event.id} className="bg-gray-100 rounded-xl p-6 border border-gray-200 opacity-80">
              <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full mb-3">
                {event.type}
              </span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
              <p className="text-sm text-gray-500 mb-3">📅 {event.date}</p>
              <p className="text-gray-600 text-sm">{event.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
