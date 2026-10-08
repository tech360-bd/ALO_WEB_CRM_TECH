import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface VisaData {
  name: string;
  flag: string;
  type: string;
  requirements: string[];
  documents: string[];
  process: string[];
  processingTime: string;
  fee: string;
  rejectionReasons: string[];
}

const visaDatabase: Record<string, VisaData> = {
  'united-kingdom': {
    name: 'United Kingdom',
    flag: '🇬🇧',
    type: 'Tier 4 (General) Student Visa',
    requirements: ['CAS Letter from University', 'English proficiency (IELTS/UKVI)', 'Maintenance funds'],
    documents: ['Valid Passport', 'CAS Letter', 'Financial Statements', 'TB Test Certificate', 'Academic Transcripts'],
    process: ['Get CAS', 'Pay IHS', 'Fill online application', 'Book appointment', 'Attend VFS'],
    processingTime: '3 to 4 weeks (Standard)',
    fee: '£490',
    rejectionReasons: ['Insufficient funds', 'Incorrect document format', 'Failing credibility interview'],
  },
  'usa': {
    name: 'USA',
    flag: '🇺🇸',
    type: 'F-1 Student Visa',
    requirements: ['I-20 Form from University', 'SEVIS fee paid', 'Proof of funds'],
    documents: ['Valid Passport', 'I-20', 'DS-160 Confirmation', 'Financial Proof', 'Academic Records'],
    process: ['Get I-20', 'Pay SEVIS', 'Fill DS-160', 'Book interview', 'Attend Embassy interview'],
    processingTime: 'Varies by Embassy workload',
    fee: '$185 + $350 SEVIS fee',
    rejectionReasons: ['Lack of home country ties', 'Inadequate funding', 'Unconvincing interview'],
  },
  'canada': {
    name: 'Canada',
    flag: '🇨🇦',
    type: 'Study Permit',
    requirements: ['Letter of Acceptance (LOA)', 'Provincial Attestation Letter (if applicable)', 'Proof of funds (GIC)'],
    documents: ['Valid Passport', 'LOA', 'Financial Proof / GIC', 'Medical Exam', 'Police Clearance'],
    process: ['Get LOA', 'Prepare documents', 'Apply online (IRCC)', 'Give Biometrics', 'Wait for decision'],
    processingTime: '4 to 8 weeks',
    fee: 'CAD 150 + CAD 85 Biometrics',
    rejectionReasons: ['Unclear study purpose', 'Weak financial proof', 'Lack of travel history'],
  },
  'australia': {
    name: 'Australia',
    flag: '🇦🇺',
    type: 'Subclass 500 Student Visa',
    requirements: ['CoE (Confirmation of Enrolment)', 'OSHC (Health Cover)', 'GTE/GS requirement'],
    documents: ['Passport', 'CoE', 'OSHC Proof', 'Financial Capacity Docs', 'English Test Results'],
    process: ['Get CoE', 'Buy OSHC', 'Apply via ImmiAccount', 'Do Medicals/Biometrics', 'Visa Grant'],
    processingTime: '4 to 6 weeks',
    fee: 'AUD 710',
    rejectionReasons: ['Failing GTE/GS requirement', 'Fraudulent documents', 'Insufficient funds'],
  },
  'ireland': {
    name: 'Ireland',
    flag: '🇮🇪',
    type: 'Stamp 2 Student Visa',
    requirements: ['Acceptance Letter', 'Fees paid in full', 'Proof of funds'],
    documents: ['Passport', 'Acceptance Letter', 'Fee Payment Receipt', 'Bank Statements', 'Medical Insurance'],
    process: ['Apply via AVATS', 'Pay Visa Fee', 'Submit documents to VFS', 'Wait for processing'],
    processingTime: '4 to 8 weeks',
    fee: '€60 (Single Entry)',
    rejectionReasons: ['Unexplained gaps in study', 'Inadequate funds', 'No medical insurance'],
  },
  'new-zealand': {
    name: 'New Zealand',
    flag: '🇳🇿',
    type: 'Fee Paying Student Visa',
    requirements: ['Offer of Place', 'Proof of funds (Living Costs)', 'Accommodation guarantee'],
    documents: ['Passport', 'Offer Letter', 'Financial Proof', 'Medical Certificate', 'Police Clearance'],
    process: ['Get Offer', 'Gather documents', 'Apply via INZ portal', 'Pay fees (AIP)', 'Visa Issued'],
    processingTime: '4 to 6 weeks',
    fee: 'NZD 375',
    rejectionReasons: ['Lack of genuine intent', 'Funds not acceptable', 'Health issues'],
  },
  'germany': {
    name: 'Germany',
    flag: '🇩🇪',
    type: 'National Visa (Student)',
    requirements: ['Admission Letter', 'Blocked Account (Sperrkonto)', 'Health Insurance'],
    documents: ['Passport', 'Admission Letter', 'Blocked Account Confirmation', 'Insurance Docs', 'Motivation Letter'],
    process: ['Open Blocked Account', 'Book VFS appointment', 'Submit application', 'Interview'],
    processingTime: '4 to 8 weeks',
    fee: '€75',
    rejectionReasons: ['Late application', 'No blocked account', 'Poor language skills'],
  },
  'dubai-uae': {
    name: 'Dubai/UAE',
    flag: '🇦🇪',
    type: 'Student Residence Visa',
    requirements: ['University Admission', 'Medical Fitness Test', 'Emirates ID application'],
    documents: ['Passport Copy', 'Photos', 'Admission Letter', 'Fee Receipt'],
    process: ['Get Entry Permit', 'Enter UAE', 'Medical Test', 'Apply Emirates ID', 'Visa Stamped'],
    processingTime: '2 to 4 weeks',
    fee: 'Varies by University/Zone',
    rejectionReasons: ['Security rejection', 'Failing medical test'],
  },
};

export function generateStaticParams() {
  return Object.keys(visaDatabase).map((slug) => ({
    country: slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const data = visaDatabase[country];
  if (!data) return { title: 'Not Found' };
  return {
    title: `${data.name} Student Visa Guide | ALO Education`,
    description: `Complete guide for ${data.name} student visa application, requirements, documents, and processing times.`,
  };
}

export default async function CountryVisaPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const data = visaDatabase[country];
  if (!data) return notFound();

  return (
    <main className="pt-20 pb-16 min-h-screen bg-gray-50">
      <div className="bg-[#2563EB] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-4">{data.flag}</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.name} Student Visa Guide</h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90">{data.type}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Key Requirements</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {data.requirements.map((req, i) => <li key={i}>{req}</li>)}
            </ul>
          </section>

          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Document Checklist</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {data.documents.map((doc, i) => <li key={i}>{doc}</li>)}
            </ul>
          </section>

          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Application Process</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {data.process.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </section>

          <section className="bg-red-50 p-8 rounded-xl border border-red-100">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Common Rejection Reasons</h2>
            <ul className="list-disc list-inside space-y-2 text-red-700">
              {data.rejectionReasons.map((reason, i) => <li key={i}>{reason}</li>)}
            </ul>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Facts</h3>
            <div className="space-y-4 mb-8">
              <div>
                <p className="text-sm text-gray-500">Processing Time</p>
                <p className="font-semibold">{data.processingTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Visa Fee</p>
                <p className="font-semibold">{data.fee}</p>
              </div>
            </div>
            <button className="w-full bg-[#F97316] hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors mb-4">
              Book Visa Consultation
            </button>
            <Link href="/visa-support" className="block text-center text-[#2563EB] hover:underline text-sm font-medium">
              &larr; Back to all countries
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
