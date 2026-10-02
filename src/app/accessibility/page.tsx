import { Accessibility, Eye, Keyboard, Monitor, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Accessibility Statement | ALO Education',
  description: 'Accessibility at ALO Education — WCAG 2.1 AA commitment, keyboard navigation, screen reader support, feedback.',
  alternates: { canonical: 'https://aloeducation.com/accessibility' },
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white pt-8 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 mb-4">ACCESSIBILITY</Badge>
        <h1 className="text-3xl font-bold text-[#0F172A] flex items-center gap-3"><Accessibility className="h-7 w-7 text-[#0B5ED7]" /> Accessibility Statement</h1>
        <p className="text-sm text-slate-500 mt-2 mb-8">We aim to make https://aloeducation.com usable by everyone, including people using assistive technologies. Target: <strong>WCAG 2.1 AA</strong>.</p>

        <Card className="p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2"><Eye className="h-4 w-4 text-[#0B5ED7]" /> What we do</h2>
            <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed mt-2 space-y-1">
              <li>Semantic HTML, landmarks (header/main/nav/footer), skip links, heading hierarchy.</li>
              <li>Color contrast ≥ 4.5:1 — primary #0B5ED7 on white, CTA #F97316 on white with accessible states.</li>
              <li>Alt text on images; Decorative images aria-hidden; Icons with accessible names.</li>
              <li>Responsive layout — tested on phone/tablet/desktop, zoom 200% without horizontal scroll.</li>
              <li>Language: English (en) with lang attribute per region page.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2"><Keyboard className="h-4 w-4 text-[#0B5ED7]" /> Keyboard & screen readers</h2>
            <ul className="list-disc list-inside text-sm text-slate-700 leading-relaxed mt-2 space-y-1">
              <li>All interactive elements reachable by Tab/Shift+Tab, active via Enter/Space, visible focus ring.</li>
              <li>Tested with keyboard-only navigation and NVDA/JAWS conventions.</li>
              <li>Forms have associated &lt;label&gt;, error messages tied via aria-describedby, OTP inputs accessible.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2"><Monitor className="h-4 w-4 text-[#0B5ED7]" /> Known limitations</h2>
            <p className="text-sm text-slate-700 leading-relaxed mt-2">Some third-party embeds (Google Maps, Facebook, calendars) may not be fully AA. Where they lack alternative, we provide text address, WhatsApp <a href="https://wa.me/8801805020100" className="text-[#0B5ED7] underline">01805020100</a>, and phone fallbacks. PDF downloads use accessible templates where available.</p>
          </section>
          <section>
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2"><FileText className="h-4 w-4 text-[#0B5ED7]" /> Feedback</h2>
            <p className="text-sm text-slate-700 leading-relaxed mt-2">Found a barrier? Email <a href="mailto:info@aloeducation.com" className="text-[#0B5ED7] underline">info@aloeducation.com</a> with page URL and issue — we acknowledge within 2 working days and fix accessibility issues prioritized. We re-test on each release and review this statement every 6 months.</p>
          </section>
          <p className="text-xs text-slate-500 pt-4 border-t">Statement date: 15 Sep 2026 • Reviewed: 15 Sep 2026 (Asia/Dhaka) • Created via Next.js with accessible components (Radix/shadcn).</p>
        </Card>
      </div>
    </div>
  );
}
