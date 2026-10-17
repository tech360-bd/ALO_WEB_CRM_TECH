'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { Database, Eye, Lock, Trash2, Share2, FileText, UserCheck, Shield, Clock, Mail } from 'lucide-react'

const dataCategories = [
  { category: 'Personal Information', examples: ['Name, email, phone number', 'Date of birth, nationality, gender', 'Passport and NID details', 'Address and contact information'], icon: UserCheck },
  { category: 'Academic Information', examples: ['Education history and qualifications', 'GPA and test scores (IELTS/PTE/TOEFL)', 'Institution details and transcripts', 'Course preferences'], icon: FileText },
  { category: 'Application Data', examples: ['University and course selections', 'Application status and progress', 'Submitted documents', 'Visa application details'], icon: FileText },
  { category: 'Financial Information', examples: ['Payment history and receipts', 'Fee structures and quotations', 'Scholarship applications', 'Refund requests'], icon: Database },
  { category: 'Communication Data', examples: ['Email correspondence', 'WhatsApp messages', 'Portal messages and chat logs', 'Call records and notes'], icon: Database },
  { category: 'Technical Data', examples: ['IP address and browser type', 'Pages visited and time spent', 'Device information', 'Cookie preferences'], icon: Database },
]

const retentionPeriods = [
  { type: 'Active Student Records', period: 'Duration of engagement + 5 years', reason: 'Regulatory compliance and future service needs' },
  { type: 'Application Records', period: '7 years from application date', reason: 'University and immigration record requirements' },
  { type: 'Financial Records', period: '7 years from transaction date', reason: 'Tax and regulatory compliance' },
  { type: 'Communication Logs', period: '3 years from last interaction', reason: 'Quality assurance and dispute resolution' },
  { type: 'Marketing Data', period: '2 years or until consent withdrawal', reason: 'Consent-based marketing activities' },
  { type: 'Technical Logs', period: '1 year', reason: 'Security and performance monitoring' },
]

const studentRights = [
  { right: 'Right to Access', desc: 'You can request a copy of all personal data we hold about you. We will provide this within 30 days of your request.', icon: Eye },
  { right: 'Right to Rectification', desc: 'You can request correction of any inaccurate or incomplete personal data we hold about you.', icon: FileText },
  { right: 'Right to Erasure', desc: 'You can request deletion of your personal data, subject to legal retention requirements and ongoing service obligations.', icon: Trash2 },
  { right: 'Right to Restrict Processing', desc: 'You can request that we limit how we use your data in certain circumstances, such as when you contest accuracy.', icon: Lock },
  { right: 'Right to Data Portability', desc: 'You can request your data in a structured, commonly used, and machine-readable format.', icon: Database },
  { right: 'Right to Object', desc: 'You can object to processing of your data for direct marketing purposes or processing based on legitimate interests.', icon: Shield },
]

export default function DataUsagePage() {
  const { setCurrentView } = useAppStore()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F9FC' }}>
      {/* Header */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0066CC 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(243,112,33,0.2)' }}>
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Lead Data Usage Policy</h1>
          <p className="text-blue-100 text-lg">Last updated: March 4, 2026</p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1A2332' }}>Our Data Commitment</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                ALO Education is committed to protecting your personal data and being transparent about how we collect, use, and share it. This policy explains our practices regarding lead data — information collected when you express interest in our services through our website, social media, events, or partner referrals.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We comply with applicable data protection laws and follow best practices for data security and privacy. Your trust is important to us, and we handle your information with the utmost care.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What Data We Collect */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8" style={{ color: '#1A2332' }}>What Data We Collect</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {dataCategories.map((cat, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F37021' + '20' }}>
                      <cat.icon className="w-4 h-4" style={{ color: '#F37021' }} />
                    </div>
                    <h3 className="font-semibold text-sm" style={{ color: '#1A2332' }}>{cat.category}</h3>
                  </div>
                  <ul className="space-y-1">
                    {cat.examples.map((ex, j) => (
                      <li key={j} className="text-gray-600 text-xs flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: '#0066CC' }} />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How We Use Lead Data */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1A2332' }}>How We Use Lead Data</h2>
              <p className="text-gray-600 text-sm mb-4">We use your data for the following legitimate purposes:</p>
              <div className="space-y-3">
                {[
                  { purpose: 'Service Delivery', desc: 'To provide you with the education consultancy services you have requested, including matching you with suitable universities and courses.' },
                  { purpose: 'Communication', desc: 'To respond to your inquiries, send you relevant updates about your applications, and provide support throughout your journey.' },
                  { purpose: 'Personalization', desc: 'To tailor our recommendations and services to your specific needs, preferences, and academic profile.' },
                  { purpose: 'Improvement', desc: 'To analyze trends, measure the effectiveness of our services, and improve our website and processes.' },
                  { purpose: 'Compliance', desc: 'To comply with legal obligations, including record-keeping for immigration and education regulatory bodies.' },
                  { purpose: 'Marketing', desc: 'With your consent, to send you information about relevant courses, universities, scholarships, and events.' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: '#F7F9FC' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs" style={{ borderColor: '#F37021', color: '#F37021' }}>{i + 1}</Badge>
                      <h3 className="font-medium text-sm" style={{ color: '#1A2332' }}>{item.purpose}</h3>
                    </div>
                    <p className="text-gray-600 text-xs ml-8">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Retention */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <Clock className="w-6 h-6 shrink-0" style={{ color: '#F37021' }} />
                <h2 className="text-xl font-bold" style={{ color: '#1A2332' }}>Data Retention Policy</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                We retain your data only for as long as necessary to fulfill the purposes for which it was collected:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                      <th className="text-left py-2 pr-4 font-medium" style={{ color: '#1A2332' }}>Data Type</th>
                      <th className="text-left py-2 pr-4 font-medium" style={{ color: '#1A2332' }}>Retention Period</th>
                      <th className="text-left py-2 font-medium" style={{ color: '#1A2332' }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retentionPeriods.map((item, i) => (
                      <tr key={i} className="border-b last:border-0" style={{ borderColor: '#F3F4F6' }}>
                        <td className="py-2 pr-4 font-medium text-gray-700">{item.type}</td>
                        <td className="py-2 pr-4 text-gray-600">{item.period}</td>
                        <td className="py-2 text-gray-500 text-xs">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Sharing */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <Share2 className="w-6 h-6 shrink-0" style={{ color: '#0066CC' }} />
                <h2 className="text-xl font-bold" style={{ color: '#1A2332' }}>Data Sharing with Partners & Universities</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                We may share your data with third parties in the following circumstances:
              </p>
              <div className="space-y-3">
                {[
                  { who: 'Partner Universities', what: 'Academic records, test scores, and application documents as required for admissions processing.', when: 'When you apply through our platform' },
                  { who: 'Partner Agencies', what: 'Basic contact information and study preferences for referral processing.', when: 'When referred by or through a partner' },
                  { who: 'Immigration Authorities', what: 'Passport, financial, and academic documents as required for visa processing.', when: 'When processing your visa application' },
                  { who: 'Service Providers', what: 'Minimum necessary data for email delivery, payment processing, and analytics.', when: 'As needed to provide our services' },
                  { who: 'Legal Authorities', what: 'Any data as required by law, court order, or regulatory request.', when: 'When legally obligated' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: '#F7F9FC' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm" style={{ color: '#1A2332' }}>{item.who}</h3>
                    </div>
                    <p className="text-gray-600 text-xs mb-1"><strong>What:</strong> {item.what}</p>
                    <p className="text-gray-500 text-xs"><strong>When:</strong> {item.when}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-4">
                We do not sell your personal data to any third party under any circumstances.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Student Rights */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8" style={{ color: '#1A2332' }}>Your Rights</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {studentRights.map((right, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0066CC' + '20' }}>
                      <right.icon className="w-4 h-4" style={{ color: '#0066CC' }} />
                    </div>
                    <h3 className="font-semibold text-sm" style={{ color: '#1A2332' }}>{right.right}</h3>
                  </div>
                  <p className="text-gray-600 text-xs">{right.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* GDPR Compliance */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card style={{ borderLeft: '4px solid #0066CC' }}>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <Shield className="w-6 h-6 shrink-0" style={{ color: '#0066CC' }} />
                <h2 className="text-xl font-bold" style={{ color: '#1A2332' }}>GDPR Compliance</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                ALO Education is committed to complying with the General Data Protection Regulation (GDPR) and other applicable data protection laws. Our compliance measures include:
              </p>
              <div className="space-y-2">
                {[
                  'Lawful basis for all data processing activities',
                  'Data Protection Impact Assessments for high-risk processing',
                  'Appropriate technical and organizational security measures',
                  'Data processing agreements with all third-party processors',
                  'Regular staff training on data protection and privacy',
                  'Designated Data Protection Officer for oversight',
                  'Clear procedures for handling data subject requests',
                  'Breach notification procedures within 72 hours',
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <Lock className="w-3 h-3 mt-1 shrink-0" style={{ color: '#22C55E' }} />
                    <p className="text-gray-600 text-sm">{item}</p>
                  </div>
                ))}
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
              <h2 className="text-xl font-bold text-white mb-4">Exercise Your Data Rights</h2>
              <p className="text-gray-300 mb-6">To submit a data subject request or for any privacy concerns, contact our Data Protection Officer.</p>
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
