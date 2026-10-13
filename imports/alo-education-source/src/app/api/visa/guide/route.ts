import { NextRequest, NextResponse } from 'next/server';

// Visa guide data — comprehensive per-country visa information
const VISA_DATA: Record<string, any> = {
  uk: {
    country: 'United Kingdom', flag: '🇬🇧', visaType: 'Student Visa (formerly Tier 4 General)',
    steps: [
      { title: 'Receive CAS', description: 'University issues Confirmation of Acceptance for Studies', timeline: 'After accepting offer' },
      { title: 'Pay IHS Surcharge', description: 'Pay Immigration Health Surcharge for NHS access', timeline: 'Before visa application' },
      { title: 'Complete Online Application', description: 'Fill visa application on GOV.UK website', timeline: '1-2 hours' },
      { title: 'Book Biometrics', description: 'Schedule appointment at VFS Global', timeline: 'Within 15 days' },
      { title: 'Attend Biometrics', description: 'Provide fingerprints and photograph', timeline: '15 minutes' },
      { title: 'Wait for Decision', description: 'UKVI processes your application', timeline: '3 weeks standard' },
      { title: 'Collect Visa & Travel', description: 'Collect passport from VFS', timeline: '1-2 days after decision' },
    ],
    fees: [
      { item: 'Visa application fee', amount: '£348', amountBDT: 52896 },
      { item: 'IHS (per year)', amount: '£470', amountBDT: 71440 },
      { item: 'VFS service fee', amount: '~৳5,000', amountBDT: 5000 },
      { item: 'TB test', amount: '~৳3,500', amountBDT: 3500 },
    ],
    processingTime: { standard: '3 weeks', priority: '5 working days (+£250)', superPriority: 'Next working day (+£956)' },
    postStudyWork: { visaName: 'Graduate Route', duration: '2 years (3 years for PhD)' },
  },
  usa: {
    country: 'United States', flag: '🇺🇸', visaType: 'F-1 Student Visa',
    steps: [
      { title: 'Receive I-20', description: 'University issues Form I-20', timeline: 'After accepting offer' },
      { title: 'Pay SEVIS Fee', description: 'Pay I-901 SEVIS fee ($185)', timeline: 'Before visa appointment' },
      { title: 'Complete DS-160', description: 'Fill online nonimmigrant visa application', timeline: '1-2 hours' },
      { title: 'Schedule Interview', description: 'Book appointment at US Embassy Dhaka', timeline: 'Wait times vary' },
      { title: 'Attend Visa Interview', description: 'In-person interview with consular officer', timeline: '2-5 minutes' },
      { title: 'Wait for Processing', description: 'Administrative processing if needed', timeline: '1-2 weeks' },
    ],
    fees: [
      { item: 'SEVIS I-901 fee', amount: '$185', amountBDT: 22200 },
      { item: 'DS-160 application fee', amount: '$185', amountBDT: 22200 },
      { item: 'Medical examination', amount: '~৳5,000', amountBDT: 5000 },
    ],
    processingTime: { standard: 'Interview + 1-2 weeks' },
    postStudyWork: { visaName: 'OPT', duration: '12 months (36 months for STEM)' },
  },
  canada: {
    country: 'Canada', flag: '🇨🇦', visaType: 'Study Permit',
    steps: [
      { title: 'Receive LOA', description: 'University issues Letter of Acceptance', timeline: 'After accepting offer' },
      { title: 'Apply Online', description: 'Submit via IRCC portal', timeline: '1-2 hours' },
      { title: 'Provide Biometrics', description: 'Visit VFS Global for fingerprints', timeline: 'Within 30 days' },
      { title: 'Medical Exam', description: 'Panel physician examination if requested', timeline: '1-2 hours' },
      { title: 'Wait for Decision', description: 'IRCC processes application', timeline: '4-8 weeks' },
    ],
    fees: [
      { item: 'Study permit application', amount: 'CAD $150', amountBDT: 13200 },
      { item: 'Biometrics fee', amount: 'CAD $85', amountBDT: 7480 },
      { item: 'Medical examination', amount: '~৳8,000', amountBDT: 8000 },
    ],
    processingTime: { standard: '4-8 weeks', sds: '20 calendar days (Student Direct Stream)' },
    postStudyWork: { visaName: 'PGWP', duration: 'Up to 3 years' },
  },
  australia: {
    country: 'Australia', flag: '🇦🇺', visaType: 'Student Visa (Subclass 500)',
    steps: [
      { title: 'Receive CoE', description: 'University issues Confirmation of Enrolment', timeline: 'After accepting offer' },
      { title: 'Apply Online', description: 'Submit via ImmiAccount', timeline: '2-3 hours' },
      { title: 'Health Examination', description: 'Panel doctor examination', timeline: '1-2 hours' },
      { title: 'Provide Biometrics', description: 'Visit VFS Global', timeline: 'Within 14 days' },
      { title: 'Wait for Decision', description: 'DHA processes application', timeline: '2-4 weeks' },
    ],
    fees: [
      { item: 'Visa application fee', amount: 'AUD $650', amountBDT: 50700 },
      { item: 'OSHC (per year)', amount: 'AUD $500-600', amountBDT: 46800 },
      { item: 'Medical examination', amount: '~৳6,000', amountBDT: 6000 },
    ],
    processingTime: { standard: '2-4 weeks' },
    postStudyWork: { visaName: 'Subclass 485', duration: '2-4 years based on qualification' },
  },
  germany: {
    country: 'Germany', flag: '🇩🇪', visaType: 'Student Visa (National Visa Type D)',
    steps: [
      { title: 'Get Admission Letter', description: 'Receive admission from university', timeline: '4-6 weeks via uni-assist' },
      { title: 'Open Blocked Account', description: 'Open sperrkonto with €11,208/year', timeline: '2-3 weeks' },
      { title: 'Schedule Embassy Appointment', description: 'Book at German Embassy Dhaka', timeline: '2-8 weeks wait' },
      { title: 'Attend Visa Interview', description: 'Submit application and brief interview', timeline: '15-30 minutes' },
      { title: 'Wait for Processing', description: 'Embassy processes application', timeline: '4-8 weeks' },
    ],
    fees: [
      { item: 'Visa application fee', amount: '€75', amountBDT: 9750 },
      { item: 'Blocked account deposit', amount: '€11,208', amountBDT: 1457040 },
    ],
    processingTime: { standard: '4-8 weeks' },
    postStudyWork: { visaName: '18-month Job Seeker Visa', duration: '18 months after graduation' },
  },
};

// GET — Returns visa guide data for all or specific country
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const country = url.searchParams.get('country');

  if (country) {
    const data = VISA_DATA[country.toLowerCase()];
    if (!data) {
      return NextResponse.json({ success: false, error: 'Country not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({
    success: true,
    countries: Object.keys(VISA_DATA),
    data: VISA_DATA,
  });
}
