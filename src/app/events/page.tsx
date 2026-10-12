import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Study Abroad Events & Webinars | ALO Education Bangladesh',
  description: 'Browse published ALO Education events and request attendance information.',
};

type PublicEvent = { id: string; slug: string; title: string; description: string; eventDate: Date; location: string; eventType: string };

export default async function EventsPage() {
  let events: PublicEvent[] = [];
  let unavailable = false;
  try {
    events = await db.eventPage.findMany({
      where: { status: 'PUBLISHED', eventDate: { gte: new Date() } },
      orderBy: [{ isFeatured: 'desc' }, { eventDate: 'asc' }],
      take: 50,
      select: { id: true, slug: true, title: true, description: true, eventDate: true, location: true, eventType: true },
    });
  } catch {
    unavailable = true;
  }
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-24">
      <h1 className="text-3xl font-bold text-slate-900">Events & Webinars</h1>
      <p className="mt-3 text-slate-600">Upcoming published ALO Education events. Ask our team about attendance and availability.</p>
      {events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 p-6" role="status">
          <p>{unavailable ? 'Events are temporarily unavailable. Please contact our team.' : 'No upcoming events have been published yet.'}</p>
          <Button asChild className="mt-4"><Link href="/book-consultation">Contact ALO Education</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-blue-700">{event.eventType}</p>
              <h2 className="mt-2 text-xl font-semibold">{event.title}</h2>
              <p className="mt-3 text-sm text-slate-600">{event.description}</p>
              <p className="mt-4 text-sm"><time dateTime={event.eventDate.toISOString()}>{event.eventDate.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' })} (Bangladesh time)</time></p>
              <p className="mt-1 text-sm">{event.location}</p>
              <Button asChild className="mt-4"><Link href={`/book-consultation?event=${encodeURIComponent(event.slug)}`}>Ask about this event</Link></Button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
