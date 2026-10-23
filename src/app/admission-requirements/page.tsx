import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'University Admission Requirements | ALO Education Bangladesh',
  description: 'Explore comprehensive admission requirements by study level and destination country for international students.',
};

const AdmissionRequirementsPage = () => {
  return (
    <main className="pt-20 pb-16 min-h-screen bg-[var(--alo-page)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--alo-text)] mb-4">University Admission Requirements</h1>
          <p className="text-lg text-[var(--alo-body)] max-w-3xl mx-auto">
            Discover the requirements for studying abroad. Select your study level below to see what you need to apply to top universities around the world.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 sm:p-10">
            <h2 className="text-2xl font-bold text-[var(--alo-brand)] mb-6">Undergraduate (BSc/BA/BEng)</h2>
            <div className="space-y-8">
              <div className="border-b border-[var(--alo-border)] pb-6">
                <h3 className="text-xl font-semibold text-[var(--alo-text)] mb-3">United Kingdom 🇬🇧</h3>
                <ul className="list-disc list-inside text-[var(--alo-body)] space-y-2">
                  <li><strong>Qualifications:</strong> HSC/A-Levels or equivalent</li>
                  <li><strong>Minimum GPA:</strong> GPA 4.0+ in HSC or BBC in A-Levels</li>
                  <li><strong>English Test:</strong> IELTS 6.0 (No band less than 5.5)</li>
                  <li><strong>Documents:</strong> Transcripts, Passport, Academic References, Personal Statement</li>
                </ul>
              </div>
              <div className="border-b border-[var(--alo-border)] pb-6">
                <h3 className="text-xl font-semibold text-[var(--alo-text)] mb-3">USA 🇺🇸 & Canada 🇨🇦</h3>
                <ul className="list-disc list-inside text-[var(--alo-body)] space-y-2">
                  <li><strong>Qualifications:</strong> Grade 12 / HSC</li>
                  <li><strong>Minimum GPA:</strong> GPA 4.0+ or equivalent</li>
                  <li><strong>English Test:</strong> IELTS 6.5 (No band less than 6.0) or TOEFL equivalent</li>
                  <li><strong>Documents:</strong> Transcripts, SAT/ACT (optional for some), SOP, LORs</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--alo-text)] mb-3">Australia 🇦🇺 & New Zealand 🇳🇿</h3>
                <ul className="list-disc list-inside text-[var(--alo-body)] space-y-2">
                  <li><strong>Qualifications:</strong> HSC/A-Levels</li>
                  <li><strong>Minimum GPA:</strong> GPA 4.0+</li>
                  <li><strong>English Test:</strong> IELTS 6.0 - 6.5</li>
                  <li><strong>Documents:</strong> Transcripts, Passport, SOP</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[var(--alo-brand)] mt-12 mb-6">Postgraduate (MSc/MBA/MA)</h2>
            <div className="space-y-8">
              <div className="border-b border-[var(--alo-border)] pb-6">
                <h3 className="text-xl font-semibold text-[var(--alo-text)] mb-3">United Kingdom 🇬🇧 & Ireland 🇮🇪</h3>
                <ul className="list-disc list-inside text-[var(--alo-body)] space-y-2">
                  <li><strong>Qualifications:</strong> Bachelor&apos;s degree (3 or 4 years)</li>
                  <li><strong>Minimum GPA:</strong> CGPA 2.8 - 3.0+ (out of 4.0)</li>
                  <li><strong>English Test:</strong> IELTS 6.5 (No band less than 6.0)</li>
                  <li><strong>Documents:</strong> Degree Certificate, Transcripts, CV, 2 LORs, SOP</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--alo-text)] mb-3">USA 🇺🇸, Canada 🇨🇦 & Australia 🇦🇺</h3>
                <ul className="list-disc list-inside text-[var(--alo-body)] space-y-2">
                  <li><strong>Qualifications:</strong> 4-year Bachelor&apos;s degree</li>
                  <li><strong>Minimum GPA:</strong> CGPA 3.0+ (out of 4.0)</li>
                  <li><strong>English Test:</strong> IELTS 6.5 - 7.0</li>
                  <li><strong>Documents:</strong> Degree Certificate, GRE/GMAT (if required), CV, LORs, SOP</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-[var(--alo-brand)] rounded-xl text-white text-center p-10">
          <h2 className="text-3xl font-bold mb-4">Are you eligible?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Find out if you meet the entry requirements for your dream university. Take our quick eligibility check today!
          </p>
          <Link
            href="/eligibility-check"
            className="inline-block bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Check Eligibility
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AdmissionRequirementsPage;
