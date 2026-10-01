import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Student Visa Support Services | ALO Education Bangladesh',
  description: 'Expert student visa support for UK, USA, Canada, Australia, and more with a 98% success rate.',
};

const visaCountries = [
  { name: 'United Kingdom', slug: 'united-kingdom', flag: '🇬🇧', type: 'Tier 4 / Student Visa', processing: '3-4 weeks', fee: '£490' },
  { name: 'USA', slug: 'usa', flag: '🇺🇸', type: 'F-1 Student Visa', processing: 'Varies', fee: '$185 + SEVIS' },
  { name: 'Canada', slug: 'canada', flag: '🇨🇦', type: 'Study Permit', processing: '4-8 weeks', fee: 'CAD 150' },
  { name: 'Australia', slug: 'australia', flag: '🇦🇺', type: 'Subclass 500', processing: '4-6 weeks', fee: 'AUD 710' },
  { name: 'Ireland', slug: 'ireland', flag: '🇮🇪', type: 'Stamp 2', processing: '4-8 weeks', fee: '€60' },
  { name: 'New Zealand', slug: 'new-zealand', flag: '🇳🇿', type: 'Fee Paying Student', processing: '4-6 weeks', fee: 'NZD 375' },
  { name: 'Germany', slug: 'germany', flag: '🇩🇪', type: 'National Visa', processing: '4-8 weeks', fee: '€75' },
  { name: 'Dubai/UAE', slug: 'dubai-uae', flag: '🇦🇪', type: 'Student Residence Visa', processing: '2-4 weeks', fee: 'Varies' },
];

const VisaSupportPage = () => {
  return (
    <main className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="bg-[#0B5ED7] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Expert Student Visa Support</h1>
          <p className="text-xl max-w-3xl mx-auto mb-10">
            Join thousands of successful students. With our 98% visa success rate and 2000+ processed applications, your dream of studying abroad is closer than you think.
          </p>
          <button className="bg-[#F97316] hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Book Free Visa Consultation
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Choose Your Destination</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visaCountries.map((country) => (
            <div key={country.slug} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{country.flag}</span>
                <h3 className="text-xl font-bold text-gray-900">{country.name}</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <p><strong>Visa Type:</strong> {country.type}</p>
                <p><strong>Processing:</strong> {country.processing}</p>
                <p><strong>Fee Range:</strong> {country.fee}</p>
              </div>
              <Link
                href={`/visa-support/${country.slug}`}
                className="block text-center w-full bg-blue-50 text-[#0B5ED7] hover:bg-[#0B5ED7] hover:text-white font-medium py-2 rounded transition-colors"
              >
                View Visa Guide
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default VisaSupportPage;
