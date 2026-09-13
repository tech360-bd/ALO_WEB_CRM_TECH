import React from 'react';
import { Metadata } from 'next';
import { PublicLanguagePrepPage } from '@/components/website/public-pages/PublicPages';

export const metadata: Metadata = {
  title: 'English Test Comparison | IELTS vs PTE vs TOEFL vs Duolingo | ALO Education',
  description: 'Compare IELTS, PTE Academic, TOEFL, Duolingo English Test requirements, scores, costs and acceptance for UK, Canada, Australia, USA universities.',
  alternates: { canonical: 'https://aloeducation.com/language-prep/comparison' },
};

export default function LanguagePrepComparisonPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white pt-20">
      <main className="flex-1">
        <PublicLanguagePrepPage slug="comparison" />
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-black mb-6">English Test Comparison</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'IELTS', score: '6.0 - 7.5', cost: '$215-250', duration: '2h 45m', acceptance: 'UK, CA, AU, US, NZ, IE' },
              { name: 'PTE Academic', score: '58-73', cost: '$200-235', duration: '2h', acceptance: 'UK, AU, CA, US, NZ' },
              { name: 'TOEFL iBT', score: '80-100', cost: '$180-250', duration: '2h', acceptance: 'US, CA, UK, AU' },
              { name: 'Duolingo', score: '105-130', cost: '$59', duration: '1h', acceptance: 'US, UK, CA, AU (selected)' },
            ].map((test) => (
              <div key={test.name} className="border rounded-xl p-6 bg-white shadow-sm">
                <h3 className="font-bold text-lg mb-3">{test.name}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><strong>Score:</strong> {test.score}</li>
                  <li><strong>Cost:</strong> {test.cost}</li>
                  <li><strong>Duration:</strong> {test.duration}</li>
                  <li><strong>Accepted:</strong> {test.acceptance}</li>
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
