'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { Cookie, Shield, BarChart3, Megaphone, Settings, Mail, Phone, Clock } from 'lucide-react'

const cookieTypes = [
  {
    category: 'Essential Cookies',
    icon: Shield,
    color: '#0066CC',
    description: 'These cookies are strictly necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms.',
    cookies: [
      { name: 'alo_session', purpose: 'Maintains your logged-in session', duration: 'Session', canDisable: false },
      { name: 'alo_csrf', purpose: 'Protects against Cross-Site Request Forgery attacks', duration: 'Session', canDisable: false },
      { name: 'alo_consent', purpose: 'Stores your cookie consent preferences', duration: '1 year', canDisable: false },
      { name: 'alo_locale', purpose: 'Remembers your language preference', duration: '1 year', canDisable: false },
    ]
  },
  {
    category: 'Analytics Cookies',
    icon: BarChart3,
    color: '#F37021',
    description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.',
    cookies: [
      { name: '_ga', purpose: 'Google Analytics - distinguishes unique visitors', duration: '2 years', canDisable: true },
      { name: '_ga_*', purpose: 'Google Analytics - maintains session state', duration: '2 years', canDisable: true },
      { name: 'alo_analytics', purpose: 'Internal analytics tracking - page views and interactions', duration: '2 years', canDisable: true },
    ]
  },
  {
    category: 'Marketing Cookies',
    icon: Megaphone,
    color: '#FFB347',
    description: 'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device.',
    cookies: [
      { name: '_fbp', purpose: 'Facebook pixel - tracks conversions for Facebook ads', duration: '3 months', canDisable: true },
      { name: '_gcl_au', purpose: 'Google Ads - tracks conversions for Google Ads', duration: '3 months', canDisable: true },
      { name: 'alo_referral', purpose: 'Tracks which partner or campaign referred you to our site', duration: '30 days', canDisable: true },
    ]
  },
  {
    category: 'Functional Cookies',
    icon: Settings,
    color: '#1A2332',
    description: 'These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.',
    cookies: [
      { name: 'alo_preferences', purpose: 'Stores your site preferences and customization', duration: '1 year', canDisable: true },
      { name: 'alo_chat', purpose: 'Maintains live chat widget state and history', duration: 'Session', canDisable: true },
    ]
  },
]

export default function CookiePolicyPage() {
  const { setCurrentView } = useAppStore()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F9FC' }}>
      {/* Header */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0066CC 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(243,112,33,0.2)' }}>
            <Cookie className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Cookie Policy</h1>
          <p className="text-blue-100 text-lg">Last updated: March 4, 2026</p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1A2332' }}>What Are Cookies?</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
              </p>
              <p className="text-gray-600 leading-relaxed">
                At ALO Education, we use cookies and similar tracking technologies to provide you with a better browsing experience, analyze site traffic, and understand how our services are being used. This policy explains what cookies we use, why we use them, and how you can manage your preferences.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8" style={{ color: '#1A2332' }}>Types of Cookies We Use</h2>
          
          <div className="space-y-6">
            {cookieTypes.map((type, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3" style={{ backgroundColor: '#F7F9FC' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: type.color + '20' }}>
                      <type.icon className="w-5 h-5" style={{ color: type.color }} />
                    </div>
                    <CardTitle className="text-lg" style={{ color: '#1A2332' }}>{type.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-600 text-sm mb-4">{type.description}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                          <th className="text-left py-2 pr-4 font-medium" style={{ color: '#1A2332' }}>Cookie</th>
                          <th className="text-left py-2 pr-4 font-medium" style={{ color: '#1A2332' }}>Purpose</th>
                          <th className="text-left py-2 pr-4 font-medium" style={{ color: '#1A2332' }}>Duration</th>
                          <th className="text-center py-2 font-medium" style={{ color: '#1A2332' }}>Can Disable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {type.cookies.map((cookie, j) => (
                          <tr key={j} className="border-b last:border-0" style={{ borderColor: '#F3F4F6' }}>
                            <td className="py-2 pr-4 font-mono text-xs" style={{ color: '#F37021' }}>{cookie.name}</td>
                            <td className="py-2 pr-4 text-gray-600">{cookie.purpose}</td>
                            <td className="py-2 pr-4 text-gray-600">{cookie.duration}</td>
                            <td className="py-2 text-center">
                              {cookie.canDisable ? (
                                <Badge variant="outline" className="text-xs">Yes</Badge>
                              ) : (
                                <Badge className="text-xs" style={{ backgroundColor: '#0066CC', color: 'white' }}>No</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Use Cookies */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1A2332' }}>Why We Use Cookies</h2>
              <div className="space-y-4">
                {[
                  { title: 'Security', desc: 'To protect your account and data from unauthorized access and CSRF attacks.' },
                  { title: 'Performance', desc: 'To analyze how our website is used so we can improve speed, functionality, and user experience.' },
                  { title: 'Personalization', desc: 'To remember your preferences, language, and settings for a tailored experience.' },
                  { title: 'Communication', desc: 'To facilitate live chat support and ensure seamless interaction with our team.' },
                  { title: 'Marketing', desc: 'To measure the effectiveness of our advertising campaigns and show relevant content.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: '#F37021' }} />
                    <div>
                      <h3 className="font-medium" style={{ color: '#1A2332' }}>{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How to Manage Cookies */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1A2332' }}>How to Manage Cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You can control and manage cookies in various ways. Please note that removing or blocking cookies can impact your user experience and parts of our website may no longer be fully accessible.
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F7F9FC' }}>
                  <h3 className="font-medium mb-2" style={{ color: '#1A2332' }}>Browser Settings</h3>
                  <p className="text-gray-600 text-sm">Most browsers allow you to control cookies through their settings. You can set your browser to refuse all cookies, accept only first-party cookies, or delete cookies when you close your browser.</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F7F9FC' }}>
                  <h3 className="font-medium mb-2" style={{ color: '#1A2332' }}>Cookie Consent Banner</h3>
                  <p className="text-gray-600 text-sm">When you first visit our website, a cookie consent banner allows you to accept or customize your cookie preferences for non-essential cookies.</p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#F7F9FC' }}>
                  <h3 className="font-medium mb-2" style={{ color: '#1A2332' }}>Opt-Out Links</h3>
                  <p className="text-gray-600 text-sm">For third-party analytics and advertising cookies, you can opt out directly through the respective providers: Google Analytics Opt-out, Facebook Pixel Opt-out.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card style={{ backgroundColor: '#1A2332' }}>
            <CardContent className="p-6 md:p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-4">Questions About Our Cookie Policy?</h2>
              <p className="text-gray-300 mb-6">If you have any questions about our use of cookies, please contact us.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" onClick={() => setCurrentView('contact')}>
                  <Mail className="w-4 h-4 mr-2" /> Contact Us
                </Button>
                <a href="mailto:privacy@aloeducation.com" className="text-sm" style={{ color: '#FFB347' }}>
                  privacy@aloeducation.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
