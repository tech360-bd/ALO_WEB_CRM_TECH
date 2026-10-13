'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Cookie,
  Calendar,
  Settings,
  BarChart3,
  Shield,
  Target,
  Monitor,
  ToggleLeft,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const LAST_UPDATED = 'February 1, 2025';

const COOKIE_CATEGORIES = [
  {
    id: 'essential',
    title: 'Essential Cookies',
    icon: Shield,
    required: true,
    description: 'These cookies are strictly necessary for the operation of our website. They enable core functionality such as security, network management, account authentication, and accessibility. You cannot opt out of these cookies.',
    cookies: [
      { name: 'alo_session', purpose: 'Maintains your logged-in session across pages', duration: 'Session', type: 'First-Party' },
      { name: 'alo_csrf', purpose: 'Protects against Cross-Site Request Forgery attacks', duration: 'Session', type: 'First-Party' },
      { name: 'alo_consent', purpose: 'Stores your cookie consent preferences', duration: '1 year', type: 'First-Party' },
      { name: 'alo_lang', purpose: 'Remembers your selected language preference', duration: '1 year', type: 'First-Party' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Performance Cookies',
    icon: BarChart3,
    required: false,
    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. They allow us to measure visit frequency, popular pages, and user journeys to improve our services.',
    cookies: [
      { name: '_ga', purpose: 'Distinguishes unique visitors for Google Analytics reporting', duration: '2 years', type: 'Third-Party (Google)' },
      { name: '_ga_*', purpose: 'Maintains session state for Google Analytics', duration: '2 years', type: 'Third-Party (Google)' },
      { name: '_gid', purpose: 'Distinguishes unique visitors within a 24-hour period', duration: '24 hours', type: 'Third-Party (Google)' },
      { name: 'alo_perf', purpose: 'Tracks page load performance and Core Web Vitals', duration: 'Session', type: 'First-Party' },
    ],
  },
  {
    id: 'functional',
    title: 'Functional Cookies',
    icon: Settings,
    required: false,
    description: 'These cookies enable enhanced functionality and personalization. They remember your choices (such as preferred study destination, saved universities, or comparison lists) to provide a more tailored experience.',
    cookies: [
      { name: 'alo_prefs', purpose: 'Stores your study destination and program preferences', duration: '1 year', type: 'First-Party' },
      { name: 'alo_saved', purpose: 'Remembers your saved universities and courses', duration: '1 year', type: 'First-Party' },
      { name: 'alo_compare', purpose: 'Maintains your university comparison list', duration: 'Session', type: 'First-Party' },
      { name: 'alo_region', purpose: 'Detects and stores your region for localized content', duration: '1 year', type: 'First-Party' },
    ],
  },
  {
    id: 'targeting',
    title: 'Targeting & Advertising Cookies',
    icon: Target,
    required: false,
    description: 'These cookies are used to deliver advertisements that are relevant to you and your interests. They also limit the number of times you see an ad and measure the effectiveness of advertising campaigns. These cookies are usually set by advertising networks with our permission.',
    cookies: [
      { name: '_fbp', purpose: 'Facebook pixel tracking for ad performance measurement', duration: '3 months', type: 'Third-Party (Meta)' },
      { name: '_fbc', purpose: 'Facebook click ID for conversion tracking', duration: '3 months', type: 'Third-Party (Meta)' },
      { name: 'alo_ads', purpose: 'Tracks ad campaign source for attribution', duration: '30 days', type: 'First-Party' },
      { name: 'alo_ref', purpose: 'Stores referral source for partner attribution', duration: '30 days', type: 'First-Party' },
    ],
  },
];

export function CookiePolicyPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
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
          <div className="absolute top-10 right-20 w-64 h-64 rounded-full border-2 border-white" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-6">
            <Cookie className="h-8 w-8" />
            <Badge className="bg-white/20 text-white border-white/30">Legal</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-lg text-white/90 max-w-2xl mb-6">
            This policy explains how ALO Education uses cookies and similar tracking technologies when you visit our website.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-white/80">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Last Updated: {LAST_UPDATED}</span>
          </div>
        </div>
      </section>

      {/* What Are Cookies */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">What Are Cookies?</h2>
          <div className="text-slate-600 text-sm leading-relaxed space-y-4">
            <p>
              Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently, provide a better browsing experience, and enable website owners to understand how their site is being used.
            </p>
            <p>
              Cookies can be &quot;persistent&quot; (they remain on your device until they expire or you delete them) or &quot;session&quot; cookies (they are deleted when you close your browser). Cookies can also be &quot;first-party&quot; (set by the website you are visiting) or &quot;third-party&quot; (set by a different domain).
            </p>
            <p>
              In addition to cookies, we may also use similar technologies such as web beacons (also known as pixel tags or clear GIFs), local storage, and session storage to collect usage information.
            </p>
          </div>
        </div>
      </section>

      {/* Cookie Categories */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Cookie Categories</h2>
          <p className="text-slate-600 mb-8">We classify our cookies into four categories based on their purpose and necessity.</p>

          <div className="space-y-8">
            {COOKIE_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Card key={cat.id} id={cat.id} className="scroll-mt-24">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 rounded-lg bg-[#0052B8]/10">
                        <Icon className="h-6 w-6 text-[#0052B8]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-900">{cat.title}</h3>
                          {cat.required ? (
                            <Badge className="bg-red-100 text-red-700">Always Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">Optional</Badge>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm">{cat.description}</p>
                      </div>
                    </div>

                    {/* Cookie Table */}
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 pr-4 font-semibold text-slate-900">Cookie Name</th>
                            <th className="text-left py-2 pr-4 font-semibold text-slate-900">Purpose</th>
                            <th className="text-left py-2 pr-4 font-semibold text-slate-900">Duration</th>
                            <th className="text-left py-2 font-semibold text-slate-900">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.cookies.map((cookie, i) => (
                            <tr key={i} className="border-b border-slate-100">
                              <td className="py-2 pr-4 font-mono text-xs text-[#0052B8]">{cookie.name}</td>
                              <td className="py-2 pr-4 text-slate-600">{cookie.purpose}</td>
                              <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{cookie.duration}</td>
                              <td className="py-2 text-slate-500 whitespace-nowrap">{cookie.type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Managing Cookies */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <ToggleLeft className="h-7 w-7 text-[#0052B8]" /> Managing Your Cookie Preferences
          </h2>
          <div className="text-slate-600 text-sm leading-relaxed space-y-4">
            <p>
              <strong>Consent Tool:</strong> When you first visit our website, a cookie consent banner allows you to accept or customize your cookie preferences. You can change your preferences at any time by clicking the cookie settings icon in the footer.
            </p>
            <p>
              <strong>Browser Settings:</strong> Most web browsers allow you to control cookies through their settings. You can set your browser to refuse all cookies, accept only first-party cookies, or delete cookies when you close your browser. Note that disabling cookies may affect the functionality of our website.
            </p>
            <p>
              <strong>Opt-Out Links:</strong> For third-party advertising cookies, you can opt out directly:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google Analytics: <span className="text-[#0052B8]">tools.google.com/dlpage/gaoptout</span></li>
              <li>Meta (Facebook) Pixel: <span className="text-[#0052B8]">facebook.com/ads/preferences</span></li>
              <li>Network Advertising Initiative: <span className="text-[#0052B8]">optout.networkadvertising.org</span></li>
            </ul>
          </div>

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <strong>Important:</strong> If you disable essential cookies, some features of our website may not function properly. This includes the ability to log in, submit applications, and access protected areas of the site. We recommend keeping essential cookies enabled at all times.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Do Not Track */}
      <section className="bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Do Not Track (DNT) Signals</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Some browsers send a &quot;Do Not Track&quot; signal to websites. Currently, there is no industry standard for how websites should respond to DNT signals. Our website does not currently change its behavior based on DNT signals. Instead, we honor the cookie preferences you set through our consent tool. We continue to monitor industry developments regarding DNT and may implement support in the future.
          </p>
        </div>
      </section>

      {/* Changes */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Changes to This Cookie Policy</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We may update this Cookie Policy from time to time to reflect changes in the cookies we use or for legal, regulatory, or operational reasons. When we make changes, we will update the &quot;Last Updated&quot; date at the top of this page. We encourage you to review this policy periodically to stay informed about how we use cookies.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0052B8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Questions About Cookies?</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            If you have questions about our use of cookies or this Cookie Policy, please contact us.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={onLeadOpen} className="bg-[#E8501A] hover:bg-[#d04515] text-white px-6">
              Contact Us
            </Button>
            <Button variant="outline" className="border-white/50 text-white hover:bg-white/10 px-6" onClick={() => onNavigate('privacy')}>
              Privacy Policy
            </Button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
