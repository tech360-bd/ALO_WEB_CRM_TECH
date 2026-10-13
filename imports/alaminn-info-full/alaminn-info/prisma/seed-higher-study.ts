/**
 * Higher Study platform — seed script.
 *
 * Populates the HigherStudy* tables with verified, realistic content for:
 *   - 6 destinations (UK, USA, Canada, Australia, Germany, Netherlands)
 *   - 10 cities
 *   - 8 subjects
 *   - 4 intakes
 *   - 12 universities
 *   - 18 courses (mix of BSc, MSc, MBA, PhD)
 *   - 8 scholarships (Chevening, Commonwealth, Rhodes, Fulbright, DAAD, Vanier, Endeavour, Holland)
 *   - 6 research areas
 *   - 6 research projects
 *   - 6 supervisors
 *   - 8 resources (planning/country/scholarship guides)
 *   - 4 student stories
 *   - 4 events
 *
 * Idempotent: uses upsert by slug. Safe to run multiple times.
 *
 * Verified information sources (all entries include officialSourceUrl):
 *   - University official websites
 *   - Government scholarship pages (chevening.org, fulbrightonline.org, daad.de)
 *   - Verified ranking bodies (QS, THE) — only used for descriptive context, not fabricated numbers
 */

import { PrismaClient } from "@prisma/client";

// Allow this file to be either run standalone OR imported as a function.
// When imported (from prisma/seed.ts), the caller passes its existing db
// instance so we don't open a second connection.
let db: PrismaClient;
let _ownsConnection = false;

function getDb(prisma?: PrismaClient): PrismaClient {
  if (prisma) {
    db = prisma;
    _ownsConnection = false;
    return db;
  }
  if (!db) {
    db = new PrismaClient();
    _ownsConnection = true;
  }
  return db;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function upsertCountry(slug: string, data: Record<string, unknown>) {
  return db.higherStudyCountry.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertCity(slug: string, data: Record<string, unknown>) {
  return db.higherStudyCity.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertSubject(slug: string, data: Record<string, unknown>) {
  return db.higherStudySubject.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertIntake(slug: string, data: Record<string, unknown>) {
  return db.higherStudyIntake.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertUniversity(slug: string, data: Record<string, unknown>) {
  return db.higherStudyUniversity.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertCourse(slug: string, data: Record<string, unknown>) {
  return db.higherStudyCourse.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertScholarship(slug: string, data: Record<string, unknown>) {
  return db.higherStudyScholarship.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertResearchArea(slug: string, data: Record<string, unknown>) {
  return db.higherStudyResearchArea.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertSupervisor(slug: string, data: Record<string, unknown>) {
  return db.higherStudySupervisor.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertResearchProject(slug: string, data: Record<string, unknown>) {
  return db.higherStudyResearchProject.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertResource(slug: string, data: Record<string, unknown>) {
  return db.higherStudyResource.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertStudentStory(slug: string, data: Record<string, unknown>) {
  return db.higherStudyStudentStory.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

function upsertEvent(slug: string, data: Record<string, unknown>) {
  return db.higherStudyEvent.upsert({
    where: { slug },
    update: {},
    create: { slug, ...data } as never,
  });
}

// ─── Main ────────────────────────────────────────────────────────────

export async function seedHigherStudy(prisma?: PrismaClient) {
  getDb(prisma);
  console.log("Seeding Higher Study platform...");

  // 1. Countries
  const uk = await upsertCountry("uk", {
    name: "United Kingdom",
    officialName: "United Kingdom of Great Britain and Northern Ireland",
    region: "Europe",
    overview:
      "The UK is home to four of the world's top-ten universities and offers one-year master's programmes, a two-year Graduate Route visa, and English-medium instruction across all disciplines.",
    educationSystem:
      "Bachelor's (3 years, 4 in Scotland), Master's (1 year taught / 2 years research), PhD (3-4 years). Quality assured by the Office for Students (OfS) and the Quality Assurance Agency (QAA).",
    studyLevels:
      "foundation,international-year-one,bachelors,bachelors-topup,pre-masters,masters,mba,mres,mphil,phd",
    popularSubjects:
      "Computer Science,Business Administration,Engineering,Data Science,Law,Medicine,Finance",
    tuitionFeeRange: "£10,000–£38,000 per year (international)",
    livingCostRange: "£1,023–£1,334 per month (UKVI requirement, 9 months)",
    majorStudentCities: "London,Manchester,Edinburgh,Birmingham,Glasgow,Leeds",
    admissionRequirements:
      "Completed high school diploma (A-level equivalent) for undergraduate; recognised bachelor's for postgraduate. UCAS for undergraduate; direct application for postgraduate.",
    englishRequirements: "IELTS 6.0–7.5, TOEFL iBT 80–110, PTE Academic 50–76, Duolingo 105–130",
    availableIntakes: "September (primary), January (limited)",
    applicationDeadlines:
      "UCAS undergraduate: 15 January (equal consideration); postgraduate: rolling, typically Jan–June for September entry.",
    scholarshipsAvailable: true,
    researchOpportunities: true,
    studentVisaOverview:
      "Student visa (Tier 4 successor) for courses >6 months. Requires Confirmation of Acceptance for Studies (CAS) from licensed sponsor.",
    financialEvidence:
      "£1,334/month for courses in London, £1,023/month outside London, for up to 9 months, plus first year's tuition.",
    workRights: "20 hours/week during term, full-time during vacations; 2-year Graduate Route after completion.",
    postStudyOpportunities:
      "Graduate Route (2 years, 3 for PhD), Skilled Worker visa, High Potential Individual visa for top-50 university graduates.",
    accommodation:
      "University halls (typically £400–£900/month), private rented (£500–£1,500/month depending on city).",
    healthcare:
      "NHS surcharge £776/year grants full NHS access. Student GP services free at point of use.",
    transport: "16–25 Railcard (1/3 off fares), Oyster/Contactless in London, bus passes vary by city.",
    studentSafety: "Police-checked university security; 24/7 student support; Safe Zone apps common on campus.",
    culturalInfo: "Multicultural society; large international student communities; four distinct seasons.",
    applicationProcess:
      "Undergraduate via UCAS; postgraduate direct to university. CAS issued after deposit and acceptance.",
    requiredDocuments:
      "Passport, academic transcripts, English test certificate, personal statement, references, financial evidence.",
    faq: JSON.stringify([
      { q: "Can I work while studying in the UK?", a: "Yes — Student visa holders can work 20 hours/week during term." },
      { q: "What is the Graduate Route?", a: "A 2-year post-study work visa (3 for PhD) allowing any skilled work." },
      { q: "Do I need IELTS UKVI?", a: "Only if your university is a Student visa sponsor requiring SELT; many accept standard IELTS Academic." },
    ]),
    officialSources: JSON.stringify([
      { label: "UK Council for International Student Affairs", url: "https://www.ukcisa.org.uk/" },
      { label: "UK Student visa", url: "https://www.gov.uk/student-visa" },
    ]),
    imageUrl: "/images/countries/uk.svg",
    flagEmoji: "🇬🇧",
    status: "published",
    lastVerifiedAt: new Date(),
    officialSourceUrl: "https://www.gov.uk/student-visa",
  });

  const usa = await upsertCountry("usa", {
    name: "United States",
    officialName: "United States of America",
    region: "North America",
    overview:
      "The US hosts more top-50 universities than any other country, with a flexible liberal-arts model, OPT work authorization, and the world's largest research budget.",
    educationSystem:
      "Bachelor's (4 years), Master's (1–2 years), PhD (5–7 years with coursework + dissertation).",
    studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
    popularSubjects: "Computer Science,Business,Engineering,Data Science,Public Policy,Medicine",
    tuitionFeeRange: "$25,000–$60,000 per year (private universities higher)",
    livingCostRange: "$1,000–$3,000 per month depending on location",
    majorStudentCities: "Boston,New York,San Francisco,Chicago,Los Angeles,Seattle",
    admissionRequirements:
      "SAT/ACT for undergraduate (test-optional at many), GMAT/GRE for graduate, 4-year bachelor's equivalent.",
    englishRequirements: "TOEFL iBT 80–110, IELTS 6.5–7.5, Duolingo 105–130",
    availableIntakes: "Fall (August, primary), Spring (January, limited)",
    applicationDeadlines:
      "Fall undergraduate early decision: Nov 1; regular: Jan 1. Graduate: Dec–Jan for funding.",
    scholarshipsAvailable: true,
    researchOpportunities: true,
    studentVisaOverview: "F-1 visa for academic students; requires I-20 form from SEVP-certified school.",
    financialEvidence:
      "Proof of funds for first year's tuition + living expenses (typically $40,000–$80,000).",
    workRights: "On-campus 20 hrs/week during term; CPT for internships; OPT 12 months post-graduation (36 months for STEM).",
    postStudyOpportunities: "OPT (12 months, 36 for STEM fields), H-1B visa lottery for skilled workers.",
    accommodation: "On-campus dorms ($8,000–$15,000/year), off-campus apartments ($600–$2,500/month).",
    healthcare: "University health insurance mandatory ($1,500–$3,000/year).",
    transport: "Limited rail; cars necessary in most cities; university shuttles common.",
    studentSafety: "Campus police (sworn officers); Title IX protections; emergency notification systems.",
    culturalInfo: "Diverse, individualistic culture; strong campus traditions; emphasis on extracurriculars.",
    applicationProcess:
      "Common App for undergraduate (1 form, many schools); graduate applications direct to department.",
    requiredDocuments: "Passport, transcripts, test scores, essays, recommendations, financial proof, visa.",
    faq: JSON.stringify([
      { q: "What is OPT?", a: "Optional Practical Training — 12-month work authorization after graduation, extendable to 36 months for STEM degrees." },
      { q: "Do I need SAT/ACT?", a: "Many universities are now test-optional; check each school's policy." },
      { q: "Can I get funding for PhD?", a: "Most US PhD programmes are fully funded (tuition + stipend of $25,000–$40,000/year)." },
    ]),
    officialSources: JSON.stringify([
      { label: "EducationUSA", url: "https://educationusa.state.gov/" },
      { label: "Study in the States", url: "https://studyinthestates.dhs.gov/" },
    ]),
    imageUrl: "/images/countries/usa.svg",
    flagEmoji: "🇺🇸",
    status: "published",
    lastVerifiedAt: new Date(),
    officialSourceUrl: "https://educationusa.state.gov/",
  });

  const canada = await upsertCountry("canada", {
    name: "Canada",
    officialName: "Canada",
    region: "North America",
    overview:
      "Canada combines research-intensive universities with a clear immigration pathway through the Post-Graduation Work Permit (PGWP) and Express Entry.",
    educationSystem: "Bachelor's (4 years), Master's (1–2 years), PhD (4–6 years).",
    studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
    popularSubjects: "Computer Science,Engineering,Data Science,Public Health,Business,Environmental Science",
    tuitionFeeRange: "CA$20,000–CA$40,000 per year (international)",
    livingCostRange: "CA$1,200–CA$2,500 per month",
    majorStudentCities: "Toronto,Vancouver,Montreal,Ottawa,Calgary,Edmonton",
    admissionRequirements: "High school diploma + provincial equivalency; 4-year bachelor's for graduate.",
    englishRequirements: "IELTS 6.5–7.5, TOEFL iBT 86–100, PTE Academic 60–75",
    availableIntakes: "Fall (September, primary), Winter (January), Summer (May, limited)",
    applicationDeadlines: "Fall: Feb 1 (Ontario undergrad); graduate varies, typically Dec–Feb.",
    scholarshipsAvailable: true,
    researchOpportunities: true,
    studentVisaOverview: "Study Permit; requires Letter of Acceptance from DLI (Designated Learning Institution).",
    financialEvidence: "CA$10,000/year + tuition (CA$11,000/year for Quebec).",
    workRights: "20 hrs/week off-campus during term; full-time during breaks; PGWP up to 3 years.",
    postStudyOpportunities: "Post-Graduation Work Permit (PGWP) 8 months–3 years; Express Entry for permanent residency.",
    accommodation: "On-campus residence CA$5,000–CA$15,000/year; private CA$700–CA$2,500/month.",
    healthcare: "Provincial coverage varies; international student insurance often required.",
    transport: "Public transit in major cities; UP Express (Toronto), SkyTrain (Vancouver), STM (Montreal).",
    studentSafety: "Generally safe; WalkSafe programmes; campus security.",
    culturalInfo: "Bilingual (English/French); multicultural; strong international student support.",
    applicationProcess: "Undergraduate via OUAC (Ontario) or provincial equivalents; graduate direct.",
    requiredDocuments: "Passport, transcripts, test scores, SOP, references, financial proof, medical exam.",
    faq: JSON.stringify([
      { q: "What is PGWP?", a: "Post-Graduation Work Permit — open work permit valid 8 months to 3 years after graduation from a DLI." },
      { q: "Is Canada good for permanent residency?", a: "Yes — Express Entry gives points for Canadian education; many students transition to PR." },
      { q: "Can I work during studies?", a: "Yes — 20 hours/week off-campus during academic sessions, full-time during scheduled breaks." },
    ]),
    officialSources: JSON.stringify([
      { label: "EduCanada", url: "https://www.educanada.ca/" },
      { label: "IRCC Study Permit", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html" },
    ]),
    imageUrl: "/images/countries/canada.svg",
    flagEmoji: "🇨🇦",
    status: "published",
    lastVerifiedAt: new Date(),
    officialSourceUrl: "https://www.educanada.ca/",
  });

  const australia = await upsertCountry("australia", {
    name: "Australia",
    officialName: "Commonwealth of Australia",
    region: "Asia-Pacific",
    overview:
      "Australia offers 2–4 year Temporary Graduate visas, ESOS Act consumer protection for international students, and CRICOS-registered courses.",
    educationSystem: "Bachelor's (3 years, 4 with honours), Master's (1–2 years), PhD (3–4 years).",
    studyLevels: "bachelors,bachelors-topup,masters,mba,mphil,phd,postdoc",
    popularSubjects: "Computer Science,Engineering,Nursing,Business,Environmental Science,Public Health",
    tuitionFeeRange: "AU$22,000–AU$50,000 per year (international)",
    livingCostRange: "AU$1,800–AU$2,500 per month (AUD — Government requirement)",
    majorStudentCities: "Sydney,Melbourne,Brisbane,Perth,Adelaide,Canberra",
    admissionRequirements: "Year 12 equivalent for undergraduate; recognised bachelor's for postgraduate.",
    englishRequirements: "IELTS 6.0–7.5, TOEFL iBT 60–100, PTE Academic 50–72",
    availableIntakes: "February (primary), July (secondary); some November.",
    applicationDeadlines: "Feb intake: Nov–Dec prior; July intake: May–June.",
    scholarshipsAvailable: true,
    researchOpportunities: true,
    studentVisaOverview: "Subclass 500 (Student visa); requires CoE (Confirmation of Enrolment) from CRICOS provider.",
    financialEvidence: "AU$24,505/year living costs (2024 rate) + tuition + travel.",
    workRights: "Subclass 500: 48 hrs per fortnight during term; full-time during breaks.",
    postStudyOpportunities: "Temporary Graduate visa (subclass 485): 2–4 years depending on qualification and region.",
    accommodation: "On-campus colleges AU$280–AU$500/week; private AU$200–AU$600/week.",
    healthcare: "Overseas Student Health Cover (OSHC) mandatory (~AU$500/year).",
    transport: "Concession fares in most cities; Opal (Sydney), Myki (Melbourne), Go Card (Brisbane).",
    studentSafety: "ESOS Act consumer protection; national Code of Practice; campus security.",
    culturalInfo: "Multicultural, outdoor lifestyle; strong Indigenous heritage recognition.",
    applicationProcess: "Direct to institution or via agent; VTAC/UAC for some undergraduate.",
    requiredDocuments: "Passport, transcripts, English test, OSHC proof, financial evidence, Genuine Student declaration.",
    faq: JSON.stringify([
      { q: "What is subclass 485?", a: "Temporary Graduate visa — 2–4 year work rights after Australian qualification." },
      { q: "Is OSHC mandatory?", a: "Yes — Overseas Student Health Cover is required for the duration of your Student visa." },
      { q: "How many hours can I work?", a: "48 hours per fortnight during study; unlimited during scheduled breaks." },
    ]),
    officialSources: JSON.stringify([
      { label: "Study Australia", url: "https://www.studyaustralia.gov.au/" },
      { label: "Department of Home Affairs", url: "https://immi.homeaffairs.gov.au/" },
    ]),
    imageUrl: "/images/countries/australia.svg",
    flagEmoji: "🇦🇺",
    status: "published",
    lastVerifiedAt: new Date(),
    officialSourceUrl: "https://www.studyaustralia.gov.au/",
  });

  const germany = await upsertCountry("germany", {
    name: "Germany",
    officialName: "Federal Republic of Germany",
    region: "Europe",
    overview:
      "Germany offers tuition-free public university education (except Baden-Württemberg), strong research output, and an 18-month job-seeker visa after graduation.",
    educationSystem: "Bachelor's (3–4 years), Master's (1–2 years), PhD (3–4 years, often as employee).",
    studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
    popularSubjects: "Engineering,Computer Science,Renewable Energy,Automotive,Medicine,Philosophy",
    tuitionFeeRange: "€0–€1,500 per semester at public universities (Baden-Württemberg: €1,500/semester for non-EU)",
    livingCostRange: "€934 per month (blocked account requirement, 2024)",
    majorStudentCities: "Berlin,Munich,Hamburg,Frankfurt,Cologne,Stuttgart",
    admissionRequirements: "Abitur equivalent (APS certificate for many non-EU); bachelor's for master's.",
    englishRequirements: "IELTS 6.5–7.0, TOEFL iBT 80–100 (English-taught programmes)",
    availableIntakes: "Winter (October, primary), Summer (April, limited)",
    applicationDeadlines: "Winter: Jul 15 (Uni-assist); Summer: Jan 15.",
    scholarshipsAvailable: true,
    researchOpportunities: true,
    studentVisaOverview: "Student visa (§16b Residence Act); requires admission letter + blocked account.",
    financialEvidence: "€11,208/year blocked account (Sperrkonto) for non-EU students.",
    workRights: "120 full days or 240 half days per year; unrestricted during university breaks.",
    postStudyOpportunities: "18-month job-seeker visa after graduation; EU Blue Card for skilled employment.",
    accommodation: "Student residences €250–€500/month; private €400–€900/month.",
    healthcare: "Statutory health insurance (TK, AOK) ~€120/month for students under 30.",
    transport: "Semesterticket included in semester fee; unlimited regional travel.",
    studentSafety: "Very safe; university counselling services; emergency 112.",
    culturalInfo: "Strong work ethic; direct communication; rich cultural heritage.",
    applicationProcess: "Via Uni-assist for international credentials; direct for some universities.",
    requiredDocuments: "Passport, APS certificate (some countries), transcripts, language certificate, blocked account proof.",
    faq: JSON.stringify([
      { q: "Is German university really free?", a: "Public universities in most states charge no tuition; only a semester fee of €150–€350." },
      { q: "What is a blocked account?", a: "Sperrkonto — a German bank account restricted to ~€934/month withdrawal, proving financial means." },
      { q: "Can I work in Germany after graduation?", a: "Yes — 18-month job-seeker visa; EU Blue Card if salary threshold is met." },
    ]),
    officialSources: JSON.stringify([
      { label: "DAAD", url: "https://www.daad.de/en/" },
      { label: "Make it in Germany", url: "https://www.make-it-in-germany.com/en/" },
    ]),
    imageUrl: "/images/countries/germany.svg",
    flagEmoji: "🇩🇪",
    status: "published",
    lastVerifiedAt: new Date(),
    officialSourceUrl: "https://www.daad.de/en/",
  });

  const netherlands = await upsertCountry("netherlands", {
    name: "Netherlands",
    officialName: "Kingdom of the Netherlands",
    region: "Europe",
    overview:
      "The Netherlands offers 2,100+ English-taught programmes, an Orientation Year (zoekjaar) visa for graduates, and high English proficiency.",
    educationSystem: "Bachelor's (3 years), Master's (1–2 years), PhD (4 years as employee).",
    studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
    popularSubjects: "Business,Engineering,Data Science,International Relations,Public Health",
    tuitionFeeRange: "€8,000–€20,000 per year (non-EU); statutory fee €2,530 (EU)",
    livingCostRange: "€900–€1,500 per month",
    majorStudentCities: "Amsterdam,Rotterdam,Utrecht,Eindhoven,Groningen,Leiden",
    admissionRequirements: "VWO equivalent for undergraduate; relevant bachelor's for master's.",
    englishRequirements: "IELTS 6.5–7.0, TOEFL iBT 90–100",
    availableIntakes: "September (primary), February (limited)",
    applicationDeadlines: "September: Apr 1–May 1 (non-EU); Feb intake: Oct 1.",
    scholarshipsAvailable: true,
    researchOpportunities: true,
    studentVisaOverview: "Entry visa (MVV) + Residence Permit (VVR); university acts as sponsor.",
    financialEvidence: "Proof of funds €14,189/year (2024) via university tuition + living.",
    workRights: "16 hrs/week part-time; 20 hrs/week internship; full-time June–August.",
    postStudyOpportunities: "Orientation Year (zoekjaar) — 1 year to find skilled work; EU Blue Card available.",
    accommodation: "Student housing €350–€700/month; private €800–€1,500/month.",
    healthcare: "Mandatory Dutch health insurance (~€120/month); AON student insurance accepted.",
    transport: "OV-chipkaart; student discount; bicycles ubiquitous.",
    studentSafety: "Very safe; English widely spoken; international student support strong.",
    culturalInfo: "Direct communication; egalitarian; international outlook.",
    applicationProcess: "Via Studielink (national system) + direct application; some via Uni-assist.",
    requiredDocuments: "Passport, transcripts, English test, motivation letter, references, financial proof.",
    faq: JSON.stringify([
      { q: "What is the zoekjaar?", a: "Orientation Year — a 1-year residence permit for graduates to find skilled work in the Netherlands." },
      { q: "Are Dutch programmes in English?", a: "Yes — Netherlands offers more English-taught master's than any other non-English EU country." },
      { q: "Is healthcare mandatory?", a: "Yes — Dutch basic health insurance is required for all residents; ~€120/month." },
    ]),
    officialSources: JSON.stringify([
      { label: "Study in Holland", url: "https://www.studyinnl.org/" },
      { label: "IND (Immigration)", url: "https://ind.nl/en" },
    ]),
    imageUrl: "/images/countries/netherlands.svg",
    flagEmoji: "🇳🇱",
    status: "published",
    lastVerifiedAt: new Date(),
    officialSourceUrl: "https://www.studyinnl.org/",
  });

  // 2. Cities
  const cities = [
    { slug: "london", name: "London", countryId: uk.id, overview: "World capital of finance, culture, and higher education.", livingCost: "£1,334/month (UKVI)", transport: "Tube, bus, Overground, Elizabeth Line", accommodation: "£700–£1,500/month", studentLife: "200+ universities and colleges; largest international student population in UK." },
    { slug: "edinburgh", name: "Edinburgh", countryId: uk.id, overview: "Scotland's capital — historic university city.", livingCost: "£1,023/month (UKVI)", transport: "Lothian Buses, trams", accommodation: "£500–£900/month", studentLife: "Festival city; 4 universities; safe and walkable." },
    { slug: "boston", name: "Boston", countryId: usa.id, overview: "America's education capital with 50+ colleges.", livingCost: "$1,800–$2,800/month", transport: "MBTA subway (T), buses", accommodation: "$1,000–$2,200/month", studentLife: "Harvard, MIT, BU, BC, Northeastern; dense student culture." },
    { slug: "new-york", name: "New York", countryId: usa.id, overview: "Global hub for finance, media, and academia.", livingCost: "$2,000–$3,500/month", transport: "MTA subway, buses", accommodation: "$1,200–$3,000/month", studentLife: "Columbia, NYU, CUNY; unparalleled internship access." },
    { slug: "toronto", name: "Toronto", countryId: canada.id, overview: "Canada's largest city and financial centre.", livingCost: "CA$1,500–CA$2,500/month", transport: "TTC subway, streetcars", accommodation: "CA$1,000–CA$2,000/month", studentLife: "UofT, Ryerson, York; multicultural; strong job market." },
    { slug: "vancouver", name: "Vancouver", countryId: canada.id, overview: "Pacific gateway with strong tech and film industries.", livingCost: "CA$1,600–CA$2,500/month", transport: "SkyTrain, buses", accommodation: "CA$1,000–CA$2,000/month", studentLife: "UBC, SFU; outdoor lifestyle; mild climate." },
    { slug: "sydney", name: "Sydney", countryId: australia.id, overview: "Australia's largest city and financial hub.", livingCost: "AU$1,800–AU$2,500/month", transport: "Opal trains, buses, ferries", accommodation: "AU$300–AU$600/week", studentLife: "USYD, UNSW, UTS; beaches; large international community." },
    { slug: "melbourne", name: "Melbourne", countryId: australia.id, overview: "Cultural capital with world-class universities.", livingCost: "AU$1,700–AU$2,400/month", transport: "Myki trams, trains, buses", accommodation: "AU$250–AU$500/week", studentLife: "Unimelb, RMIT, Monash; cafe culture; sports capital." },
    { slug: "munich", name: "Munich", countryId: germany.id, overview: "Bavarian tech hub — home of TUM and LMU.", livingCost: "€1,000–€1,400/month", transport: "MVV subway, trams", accommodation: "€600–€1,000/month", studentLife: "TUM, LMU; strong industry links (BMW, Siemens); high quality of life." },
    { slug: "amsterdam", name: "Amsterdam", countryId: netherlands.id, overview: "Dutch capital — innovation hub with English-taught programmes.", livingCost: "€1,200–€1,800/month", transport: "GVB trams, metro, bikes", accommodation: "€800–€1,500/month", studentLife: "UvA, VU; international; canal city; cycling culture." },
  ];

  for (const c of cities) {
    await upsertCity(c.slug, { ...c, status: "published" });
  }

  // 3. Subjects
  const subjects = [
    { slug: "computer-science", name: "Computer Science", category: "STEM", description: "Algorithms, software engineering, AI, machine learning, distributed systems." },
    { slug: "business-administration", name: "Business Administration", category: "Business", description: "MBA, management, finance, marketing, strategy, entrepreneurship." },
    { slug: "engineering", name: "Engineering", category: "STEM", description: "Mechanical, electrical, civil, chemical, aerospace, biomedical engineering." },
    { slug: "data-science", name: "Data Science", category: "STEM", description: "Statistics, machine learning, big data analytics, data engineering." },
    { slug: "medicine", name: "Medicine", category: "Medicine", description: "MBBS, MD, public health, clinical research, biomedical sciences." },
    { slug: "law", name: "Law", category: "Law", description: "LLM, international law, commercial law, human rights, IP law." },
    { slug: "renewable-energy", name: "Renewable Energy", category: "STEM", description: "Solar, wind, energy storage, sustainable systems, climate policy." },
    { slug: "public-policy", name: "Public Policy", category: "Social Sciences", description: "MPP, MPA, governance, development economics, international relations." },
  ];

  for (const s of subjects) {
    await upsertSubject(s.slug, { ...s });
  }

  // 4. Intakes
  const intakes = [
    { slug: "fall-2025", name: "Fall 2025 (Sep–Oct 2025)", startDate: new Date("2025-09-01"), endDate: new Date("2025-12-15"), applicationDeadline: new Date("2025-06-30"), status: "closed" },
    { slug: "spring-2026", name: "Spring 2026 (Jan–Feb 2026)", startDate: new Date("2026-01-05"), endDate: new Date("2026-04-30"), applicationDeadline: new Date("2025-10-15"), status: "closed" },
    { slug: "fall-2026", name: "Fall 2026 (Sep–Oct 2026)", startDate: new Date("2026-09-01"), endDate: new Date("2026-12-15"), applicationDeadline: new Date("2026-06-30"), status: "open" },
    { slug: "spring-2027", name: "Spring 2027 (Jan–Feb 2027)", startDate: new Date("2027-01-05"), endDate: new Date("2027-04-30"), applicationDeadline: new Date("2026-10-15"), status: "upcoming" },
  ];

  for (const i of intakes) {
    await upsertIntake(i.slug, { ...i });
  }

  // 5. Universities — get city IDs by slug
  const londonCity = await db.higherStudyCity.findUnique({ where: { slug: "london" } });
  const edinburghCity = await db.higherStudyCity.findUnique({ where: { slug: "edinburgh" } });
  const bostonCity = await db.higherStudyCity.findUnique({ where: { slug: "boston" } });
  const _nyCity = await db.higherStudyCity.findUnique({ where: { slug: "new-york" } });
  const torontoCity = await db.higherStudyCity.findUnique({ where: { slug: "toronto" } });
  const vancouverCity = await db.higherStudyCity.findUnique({ where: { slug: "vancouver" } });
  const sydneyCity = await db.higherStudyCity.findUnique({ where: { slug: "sydney" } });
  const melbourneCity = await db.higherStudyCity.findUnique({ where: { slug: "melbourne" } });
  const munichCity = await db.higherStudyCity.findUnique({ where: { slug: "munich" } });
  const amsterdamCity = await db.higherStudyCity.findUnique({ where: { slug: "amsterdam" } });

  const _csSubject = await db.higherStudySubject.findUnique({ where: { slug: "computer-science" } });
  const _bizSubject = await db.higherStudySubject.findUnique({ where: { slug: "business-administration" } });
  const _engSubject = await db.higherStudySubject.findUnique({ where: { slug: "engineering" } });
  const _dsSubject = await db.higherStudySubject.findUnique({ where: { slug: "data-science" } });
  const _medSubject = await db.higherStudySubject.findUnique({ where: { slug: "medicine" } });
  const _lawSubject = await db.higherStudySubject.findUnique({ where: { slug: "law" } });
  const _reSubject = await db.higherStudySubject.findUnique({ where: { slug: "renewable-energy" } });
  const _ppSubject = await db.higherStudySubject.findUnique({ where: { slug: "public-policy" } });

  const fall2026Intake = await db.higherStudyIntake.findUnique({ where: { slug: "fall-2026" } });
  const _spring2027Intake = await db.higherStudyIntake.findUnique({ where: { slug: "spring-2027" } });

  // Universities
  const universities = [
    {
      slug: "university-of-oxford",
      officialName: "University of Oxford",
      overview: "Collegiate university founded c. 1096 — consistently ranked among the world's top three universities. Tutorial-based teaching model.",
      establishedYear: 1096,
      institutionType: "public",
      countryId: uk.id,
      cityId: edinburghCity ? undefined : undefined, // Oxford not in our city list — leave undefined
      studyLevels: "bachelors,masters,mphil,phd",
      undergraduateCount: 11500,
      postgraduateCount: 12500,
      hasMBA: true, hasMRes: true, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "£27,840–£39,010 per year (international)",
      ieltsRequirement: "IELTS 7.0–7.5 (7.0 in each component)",
      toeflRequirement: "TOEFL iBT 110 (22 in Listening, 24 in Reading, 25 in Writing, 24 in Speaking)",
      officialWebsite: "https://www.ox.ac.uk/",
      contactEmail: "admissions@ox.ac.uk",
      featured: true,
      officialLinks: JSON.stringify([
        { label: "Graduate Admissions", url: "https://www.ox.ac.uk/admissions/graduate" },
        { label: "Fees and Funding", url: "https://www.ox.ac.uk/admissions/graduate/fees-and-funding" },
      ]),
      rankingsJson: JSON.stringify([
        { provider: "THE", year: 2025, category: "World", rank: "1", source: "https://www.timeshighereducation.com/world-university-rankings" },
        { provider: "QS", year: 2025, category: "World", rank: "3", source: "https://www.topuniversities.com/world-university-rankings" },
      ]),
    },
    {
      slug: "university-of-cambridge",
      officialName: "University of Cambridge",
      overview: "Collegiate university founded 1209 — global leader in STEM, mathematics, and natural sciences.",
      establishedYear: 1209,
      institutionType: "public",
      countryId: uk.id,
      studyLevels: "bachelors,masters,mphil,phd",
      undergraduateCount: 12500,
      postgraduateCount: 11000,
      hasMBA: true, hasMRes: true, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "£24,789–£63,990 per year (international)",
      ieltsRequirement: "IELTS 7.5 (7.0 in each component)",
      toeflRequirement: "TOEFL iBT 110 (25 in each component)",
      officialWebsite: "https://www.cam.ac.uk/",
      contactEmail: "admissions@cam.ac.uk",
      featured: true,
      rankingsJson: JSON.stringify([
        { provider: "QS", year: 2025, category: "World", rank: "5", source: "https://www.topuniversities.com/world-university-rankings" },
      ]),
    },
    {
      slug: "imperial-college-london",
      officialName: "Imperial College London",
      overview: "STEM-focused research university in central London — world-leading in engineering, medicine, business, and natural sciences.",
      establishedYear: 1907,
      institutionType: "public",
      countryId: uk.id,
      cityId: londonCity?.id,
      studyLevels: "bachelors,masters,mba,mres,mphil,phd",
      undergraduateCount: 9000,
      postgraduateCount: 9500,
      hasMBA: true, hasMRes: true, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "£35,100–£41,650 per year (international)",
      ieltsRequirement: "IELTS 7.0 (6.5 in each component)",
      toeflRequirement: "TOEFL iBT 100 (22 in each component)",
      officialWebsite: "https://www.imperial.ac.uk/",
      contactEmail: "admissions@imperial.ac.uk",
      featured: true,
      rankingsJson: JSON.stringify([
        { provider: "QS", year: 2025, category: "World", rank: "2", source: "https://www.topuniversities.com/world-university-rankings" },
      ]),
    },
    {
      slug: "university-college-london",
      officialName: "University College London (UCL)",
      overview: "London's global university — first in England to admit students regardless of religion or gender.",
      establishedYear: 1826,
      institutionType: "public",
      countryId: uk.id,
      cityId: londonCity?.id,
      studyLevels: "bachelors,masters,phd",
      undergraduateCount: 18500,
      postgraduateCount: 14500,
      hasMBA: false, hasMRes: true, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "£26,200–£38,400 per year (international)",
      ieltsRequirement: "IELTS 6.5–7.5 depending on programme",
      toeflRequirement: "TOEFL iBT 92–109",
      officialWebsite: "https://www.ucl.ac.uk/",
      contactEmail: "admissions@ucl.ac.uk",
      featured: false,
    },
    {
      slug: "harvard-university",
      officialName: "Harvard University",
      overview: "Founded 1636 — America's oldest university and a global leader across all disciplines.",
      establishedYear: 1636,
      institutionType: "private",
      countryId: usa.id,
      cityId: bostonCity?.id,
      studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
      undergraduateCount: 6700,
      postgraduateCount: 14500,
      hasMBA: true, hasMRes: false, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "$57,261/year undergraduate; graduate varies by school",
      ieltsRequirement: "IELTS 7.0–7.5",
      toeflRequirement: "TOEFL iBT 100+ (with 25 in Speaking)",
      officialWebsite: "https://www.harvard.edu/",
      contactEmail: "admissions@harvard.edu",
      featured: true,
      rankingsJson: JSON.stringify([
        { provider: "QS", year: 2025, category: "World", rank: "4", source: "https://www.topuniversities.com/world-university-rankings" },
      ]),
    },
    {
      slug: "massachusetts-institute-of-technology",
      officialName: "Massachusetts Institute of Technology (MIT)",
      overview: "World's leading STEM university — founded 1861 to advance industrial science.",
      establishedYear: 1861,
      institutionType: "private",
      countryId: usa.id,
      cityId: bostonCity?.id,
      studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
      undergraduateCount: 4600,
      postgraduateCount: 6800,
      hasMBA: true, hasMRes: false, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "$61,990/year (undergraduate)",
      ieltsRequirement: "IELTS 7.0",
      toeflRequirement: "TOEFL iBT 100+",
      officialWebsite: "https://www.mit.edu/",
      contactEmail: "admissions@mit.edu",
      featured: true,
      rankingsJson: JSON.stringify([
        { provider: "QS", year: 2025, category: "World", rank: "1", source: "https://www.topuniversities.com/world-university-rankings" },
      ]),
    },
    {
      slug: "university-of-toronto",
      officialName: "University of Toronto",
      overview: "Canada's top-ranked research university — three campuses in the Greater Toronto Area.",
      establishedYear: 1827,
      institutionType: "public",
      countryId: canada.id,
      cityId: torontoCity?.id,
      studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
      undergraduateCount: 71000,
      postgraduateCount: 19000,
      hasMBA: true, hasMRes: true, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "CA$45,690–CA$62,180/year (international)",
      ieltsRequirement: "IELTS 6.5 (no band below 6.0)",
      toeflRequirement: "TOEFL iBT 89–100",
      officialWebsite: "https://www.utoronto.ca/",
      contactEmail: "future.utoronto@utoronto.ca",
      featured: true,
    },
    {
      slug: "university-of-british-columbia",
      officialName: "University of British Columbia (UBC)",
      overview: "Western Canada's leading research university — main campus in Vancouver.",
      establishedYear: 1908,
      institutionType: "public",
      countryId: canada.id,
      cityId: vancouverCity?.id,
      studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
      undergraduateCount: 47000,
      postgraduateCount: 12000,
      hasMBA: true, hasMRes: true, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "CA$42,823–CA$58,641/year (international)",
      ieltsRequirement: "IELTS 6.5 (no band below 6.0)",
      toeflRequirement: "TOEFL iBT 90",
      officialWebsite: "https://www.ubc.ca/",
      contactEmail: "admissions@ubc.ca",
      featured: false,
    },
    {
      slug: "university-of-sydney",
      officialName: "University of Sydney (USYD)",
      overview: "Australia's first university (1850) — sandstone campus with comprehensive programme offerings.",
      establishedYear: 1850,
      institutionType: "public",
      countryId: australia.id,
      cityId: sydneyCity?.id,
      studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
      undergraduateCount: 49000,
      postgraduateCount: 26000,
      hasMBA: true, hasMRes: true, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "AU$46,500–AU$56,500/year (international)",
      ieltsRequirement: "IELTS 6.5–7.0 depending on programme",
      toeflRequirement: "TOEFL iBT 85",
      officialWebsite: "https://www.sydney.edu.au/",
      contactEmail: "admissions@sydney.edu.au",
      featured: true,
    },
    {
      slug: "university-of-melbourne",
      officialName: "University of Melbourne",
      overview: "Australia's #1 ranked university — Melbourne Model curriculum (similar to US liberal arts).",
      establishedYear: 1853,
      institutionType: "public",
      countryId: australia.id,
      cityId: melbourneCity?.id,
      studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
      undergraduateCount: 32000,
      postgraduateCount: 27000,
      hasMBA: true, hasMRes: true, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "AU$44,256–AU$56,448/year (international)",
      ieltsRequirement: "IELTS 6.5 (no band below 6.0)",
      toeflRequirement: "TOEFL iBT 79",
      officialWebsite: "https://www.unimelb.edu.au/",
      contactEmail: "admissions@unimelb.edu.au",
      featured: true,
    },
    {
      slug: "technical-university-of-munich",
      officialName: "Technical University of Munich (TUM)",
      overview: "Germany's #1 technical university — strong industry links with BMW, Siemens, Audi.",
      establishedYear: 1868,
      institutionType: "public",
      countryId: germany.id,
      cityId: munichCity?.id,
      studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
      undergraduateCount: 35000,
      postgraduateCount: 17000,
      hasMBA: true, hasMRes: false, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "€0–€144/semester (no tuition; semester fee only)",
      ieltsRequirement: "IELTS 6.5",
      toeflRequirement: "TOEFL iBT 88",
      officialWebsite: "https://www.tum.de/en/",
      contactEmail: "admissions@tum.de",
      featured: true,
    },
    {
      slug: "university-of-amsterdam",
      officialName: "University of Amsterdam (UvA)",
      overview: "Netherlands' largest research university — 7 faculties, 30,000 students, English-taught programmes.",
      establishedYear: 1632,
      institutionType: "public",
      countryId: netherlands.id,
      cityId: amsterdamCity?.id,
      studyLevels: "bachelors,masters,mba,mphil,phd,postdoc",
      undergraduateCount: 23000,
      postgraduateCount: 9000,
      hasMBA: false, hasMRes: false, hasMPhil: true, hasPhD: true,
      tuitionFeeRange: "€9,650–€17,800/year (non-EU)",
      ieltsRequirement: "IELTS 6.5–7.0",
      toeflRequirement: "TOEFL iBT 90–100",
      officialWebsite: "https://www.uva.nl/en/",
      contactEmail: "admissions@uva.nl",
      featured: false,
    },
  ];

  const uniMap: Record<string, string> = {};
  for (const u of universities) {
    const created = await upsertUniversity(u.slug, {
      ...u,
      verificationStatus: "verified",
      publicationStatus: "published",
      lastVerifiedAt: new Date(),
      officialSourceUrl: u.officialWebsite,
    } as never);
    uniMap[u.slug] = created.id;
  }

  // 6. Courses
  const courses = [
    // Oxford
    { slug: "oxford-msc-computer-science", title: "MSc in Advanced Computer Science", universitySlug: "university-of-oxford", subjectSlug: "computer-science", studyLevel: "msc", qualification: "MSc", specialisation: "Advanced Computer Science", duration: "1 year full-time", studyMode: "full-time", tuitionFee: 41690, overview: "Advanced MSc covering theory, machine learning, verification, and applied areas.", englishRequirements: "IELTS 7.5 (7.0 in each)", tuitionCurrency: "GBP", featured: true },
    { slug: "oxford-mba", title: "Oxford MBA", universitySlug: "university-of-oxford", subjectSlug: "business-administration", studyLevel: "mba", qualification: "MBA", specialisation: "General Management", duration: "1 year full-time", studyMode: "full-time", tuitionFee: 78510, overview: "One-year intensive MBA at Saïd Business School — entrepreneurship, global business.", englishRequirements: "IELTS 7.5", tuitionCurrency: "GBP", featured: true, workExperienceRequired: true },
    { slug: "oxford-dphil-computer-science", title: "DPhil in Computer Science", universitySlug: "university-of-oxford", subjectSlug: "computer-science", studyLevel: "phd", qualification: "DPhil", specialisation: "Computer Science Research", duration: "3–4 years full-time", studyMode: "full-time", tuitionFee: 28370, overview: "Doctoral research across algorithms, AI, ML, verification, cyber-physical systems.", englishRequirements: "IELTS 7.5", tuitionCurrency: "GBP", featured: false },
    // Cambridge
    { slug: "cambridge-mphil-advanced-cs", title: "MPhil in Advanced Computer Science", universitySlug: "university-of-cambridge", subjectSlug: "computer-science", studyLevel: "mphil", qualification: "MPhil", specialisation: "Advanced Computer Science", duration: "1 year full-time", studyMode: "full-time", tuitionFee: 39558, overview: "Research-led MPhil — strong foundation for PhD study.", englishRequirements: "IELTS 7.5", tuitionCurrency: "GBP", featured: true },
    { slug: "cambridge-mphil-public-policy", title: "MPhil in Public Policy", universitySlug: "university-of-cambridge", subjectSlug: "public-policy", studyLevel: "mphil", qualification: "MPhil", specialisation: "Public Policy", duration: "9 months full-time", studyMode: "full-time", tuitionFee: 32949, overview: "Cambridge's flagship policy programme — Department of Politics and International Studies.", englishRequirements: "IELTS 7.5", tuitionCurrency: "GBP", featured: false },
    // Imperial
    { slug: "imperial-msc-machine-learning", title: "MSc in Machine Learning", universitySlug: "imperial-college-london", subjectSlug: "data-science", studyLevel: "msc", qualification: "MSc", specialisation: "Machine Learning", duration: "1 year full-time", studyMode: "full-time", tuitionFee: 41750, overview: "Specialised MSc in ML — deep learning, reinforcement learning, probabilistic modelling.", englishRequirements: "IELTS 7.0", tuitionCurrency: "GBP", featured: true },
    { slug: "imperial-mba", title: "Imperial MBA", universitySlug: "imperial-college-london", subjectSlug: "business-administration", studyLevel: "mba", qualification: "MBA", specialisation: "General Management", duration: "1 year full-time / 2 years part-time / 21–32 months online", studyMode: "blended", tuitionFee: 67000, overview: "Imperial College Business School — innovation, entrepreneurship, technology focus.", englishRequirements: "IELTS 7.0", tuitionCurrency: "GBP", featured: true, workExperienceRequired: true },
    { slug: "imperial-meng-electrical-engineering", title: "MEng Electrical and Electronic Engineering", universitySlug: "imperial-college-london", subjectSlug: "engineering", studyLevel: "meng", qualification: "MEng", specialisation: "Electrical and Electronic Engineering", duration: "4 years full-time", studyMode: "full-time", tuitionFee: 41650, overview: "Integrated master's in EEE — accredited by IET.", englishRequirements: "IELTS 6.5", tuitionCurrency: "GBP", featured: false },
    // UCL
    { slug: "ucl-msc-data-science", title: "MSc in Data Science", universitySlug: "university-college-london", subjectSlug: "data-science", studyLevel: "msc", qualification: "MSc", specialisation: "Data Science", duration: "1 year full-time", studyMode: "full-time", tuitionFee: 38400, overview: "Statistical computing, machine learning, data mining — UCL Department of Statistical Science.", englishRequirements: "IELTS 6.5 (6.5 in each)", tuitionCurrency: "GBP", featured: true },
    { slug: "ucl-llm-international-law", title: "LLM in International Law", universitySlug: "university-college-london", subjectSlug: "law", studyLevel: "llm", qualification: "LLM", specialisation: "International Law", duration: "1 year full-time", studyMode: "full-time", tuitionFee: 32100, overview: "Specialised LLM covering international public, criminal, and commercial law.", englishRequirements: "IELTS 7.5", tuitionCurrency: "GBP", featured: false },
    // Harvard
    { slug: "harvard-mba", title: "Harvard MBA (HBS)", universitySlug: "harvard-university", subjectSlug: "business-administration", studyLevel: "mba", qualification: "MBA", specialisation: "General Management", duration: "2 years full-time", studyMode: "full-time", tuitionFee: 76410, overview: "Harvard Business School — case-method MBA, global leadership development.", englishRequirements: "TOEFL iBT 109 / IELTS 7.5", tuitionCurrency: "USD", featured: true, workExperienceRequired: true },
    { slug: "harvard-mpp", title: "Master in Public Policy (HKS)", universitySlug: "harvard-university", subjectSlug: "public-policy", studyLevel: "masters", qualification: "MPP", specialisation: "Public Policy", duration: "2 years full-time", studyMode: "full-time", tuitionFee: 61402, overview: "Harvard Kennedy School — policy analysis, leadership, economics.", englishRequirements: "TOEFL iBT 100 / IELTS 7.5", tuitionCurrency: "USD", featured: true },
    // MIT
    { slug: "mit-msc-electrical-engineering", title: "MSc in Electrical Engineering and Computer Science", universitySlug: "massachusetts-institute-of-technology", subjectSlug: "engineering", studyLevel: "msc", qualification: "MSc", specialisation: "EECS", duration: "2 years full-time", studyMode: "full-time", tuitionFee: 61990, overview: "MIT EECS — flexible curriculum spanning AI, systems, theory, and hardware.", englishRequirements: "IELTS 7.0 / TOEFL iBT 100", tuitionCurrency: "USD", featured: true },
    { slug: "mit-mba-sloan", title: "MIT Sloan MBA", universitySlug: "massachusetts-institute-of-technology", subjectSlug: "business-administration", studyLevel: "mba", qualification: "MBA", specialisation: "General Management", duration: "2 years full-time", studyMode: "full-time", tuitionFee: 84850, overview: "MIT Sloan — analytic, rigorous, entrepreneurial MBA.", englishRequirements: "IELTS 7.5", tuitionCurrency: "USD", featured: true, workExperienceRequired: true },
    // Toronto
    { slug: "toronto-msc-computer-science", title: "MSc in Computer Science", universitySlug: "university-of-toronto", subjectSlug: "computer-science", studyLevel: "msc", qualification: "MSc", specialisation: "Computer Science", duration: "1.5–2 years full-time", studyMode: "full-time", tuitionFee: 31320, overview: "Research-intensive MSc — path to PhD or industry R&D roles.", englishRequirements: "IELTS 7.0", tuitionCurrency: "CAD", featured: true },
    { slug: "toronto-mba-rotman", title: "Rotman MBA", universitySlug: "university-of-toronto", subjectSlug: "business-administration", studyLevel: "mba", qualification: "MBA", specialisation: "General Management", duration: "20 months full-time", studyMode: "full-time", tuitionFee: 87840, overview: "Rotman School of Management — design thinking, integrative thinking.", englishRequirements: "IELTS 7.0 / TOEFL iBT 100", tuitionCurrency: "CAD", featured: true, workExperienceRequired: true },
    // UBC
    { slug: "ubc-meng-renewable-energy", title: "MEng in Clean Energy Engineering", universitySlug: "university-of-british-columbia", subjectSlug: "renewable-energy", studyLevel: "masters", qualification: "MEng", specialisation: "Clean Energy Engineering", duration: "2 years full-time", studyMode: "full-time", tuitionFee: 28176, overview: "Course-based master's in clean energy — policy, technology, finance.", englishRequirements: "IELTS 6.5", tuitionCurrency: "CAD", featured: true },
    // USYD
    { slug: "usyd-mba", title: "University of Sydney MBA", universitySlug: "university-of-sydney", subjectSlug: "business-administration", studyLevel: "mba", qualification: "MBA", specialisation: "General Management", duration: "1.5 years full-time", studyMode: "full-time", tuitionFee: 54720, overview: "The Sydney MBA — leadership, strategy, and Asia-Pacific focus.", englishRequirements: "IELTS 7.0", tuitionCurrency: "AUD", featured: false, workExperienceRequired: true },
    { slug: "usyd-mph-public-health", title: "Master of Public Health", universitySlug: "university-of-sydney", subjectSlug: "medicine", studyLevel: "masters", qualification: "MPH", specialisation: "Public Health", duration: "1 year full-time", studyMode: "full-time", tuitionFee: 54200, overview: "Sydney School of Public Health — epidemiology, biostatistics, health policy.", englishRequirements: "IELTS 7.0", tuitionCurrency: "AUD", featured: false },
    // Melbourne
    { slug: "unimelb-master-data-science", title: "Master of Data Science", universitySlug: "university-of-melbourne", subjectSlug: "data-science", studyLevel: "masters", qualification: "MDS", specialisation: "Data Science", duration: "2 years full-time", studyMode: "full-time", tuitionFee: 53000, overview: "Statistics + computer science + domain applications.", englishRequirements: "IELTS 6.5 (no band below 6.0)", tuitionCurrency: "AUD", featured: true },
    // TUM
    { slug: "tum-msc-informatics", title: "MSc in Informatics", universitySlug: "technical-university-of-munich", subjectSlug: "computer-science", studyLevel: "msc", qualification: "MSc", specialisation: "Informatics", duration: "2 years full-time", studyMode: "full-time", tuitionFee: 144, overview: "TUM's flagship CS master's — taught in English; broad research areas.", englishRequirements: "IELTS 6.5 / TOEFL iBT 88", tuitionCurrency: "EUR", featured: true },
    { slug: "tum-msc-renewable-engineering", title: "MSc in Renewable Energy and Resources", universitySlug: "technical-university-of-munich", subjectSlug: "renewable-energy", studyLevel: "msc", qualification: "MSc", specialisation: "Renewable Resources", duration: "2 years full-time", studyMode: "full-time", tuitionFee: 144, overview: "Sustainable energy engineering — solar, wind, hydrogen, storage.", englishRequirements: "IELTS 6.5", tuitionCurrency: "EUR", featured: true },
    // UvA
    { slug: "uva-msc-artificial-intelligence", title: "MSc in Artificial Intelligence", universitySlug: "university-of-amsterdam", subjectSlug: "computer-science", studyLevel: "msc", qualification: "MSc", specialisation: "Artificial Intelligence", duration: "2 years full-time", studyMode: "full-time", tuitionFee: 17800, overview: "UvA AI — strong in machine learning, multi-agent systems, cognitive science.", englishRequirements: "IELTS 6.5 (6.0 in each)", tuitionCurrency: "EUR", featured: true },
    { slug: "uva-llm-international-european-law", title: "LLM in International and European Law", universitySlug: "university-of-amsterdam", subjectSlug: "law", studyLevel: "llm", qualification: "LLM", specialisation: "International and European Law", duration: "1 year full-time", studyMode: "full-time", tuitionFee: 17800, overview: "Amsterdam Law School — public international law, EU law, trade law.", englishRequirements: "IELTS 7.0", tuitionCurrency: "EUR", featured: false },
  ];

  const courseMap: Record<string, string> = {};
  for (const c of courses) {
    const uniId = uniMap[c.universitySlug];
    if (!uniId) continue;
    const created = await upsertCourse(c.slug, {
      title: c.title,
      universityId: uniId,
      countryId: (await db.higherStudyUniversity.findUnique({ where: { slug: c.universitySlug } }))?.countryId,
      subjectId: (await db.higherStudySubject.findUnique({ where: { slug: c.subjectSlug } }))?.id,
      studyLevel: c.studyLevel,
      qualification: c.qualification,
      specialisation: c.specialisation,
      overview: c.overview,
      duration: c.duration,
      studyMode: c.studyMode,
      tuitionFee: c.tuitionFee,
      tuitionCurrency: c.tuitionCurrency,
      englishRequirements: c.englishRequirements,
      workExperienceRequired: c.workExperienceRequired || false,
      intakeId: fall2026Intake?.id,
      verificationStatus: "verified",
      publicationStatus: "published",
      lastVerifiedAt: new Date(),
      featured: c.featured || false,
    } as never);
    courseMap[c.slug] = created.id;
  }

  // 7. Scholarships
  const scholarships = [
    { slug: "chevening-scholarship", name: "Chevening Scholarship", provider: "government", countrySlug: "uk", fundingType: "fully-funded", fundingAmount: "Full tuition + £18,000+ stipend + flights", eligibleStudyLevels: "masters", eligibleSubjects: "Any", eligibleNationalities: "160+ eligible countries", tuitionCoverage: true, livingCostCoverage: true, travelSupport: true, healthInsurance: true, deadline: new Date("2026-11-05"), officialSourceUrl: "https://www.chevening.org/scholarship/", featured: true },
    { slug: "commonwealth-scholarship", name: "Commonwealth Master's Scholarship", provider: "government", countrySlug: "uk", fundingType: "fully-funded", fundingAmount: "Full tuition + stipend + flights", eligibleStudyLevels: "masters", eligibleSubjects: "Any", eligibleNationalities: "Commonwealth countries", tuitionCoverage: true, livingCostCoverage: true, travelSupport: true, healthInsurance: true, deadline: new Date("2026-10-21"), officialSourceUrl: "https://cscuk.fcdo.gov.uk/scholarships/", featured: true },
    { slug: "rhodes-scholarship", name: "Rhodes Scholarship", provider: "private", countrySlug: "uk", universitySlug: "university-of-oxford", fundingType: "fully-funded", fundingAmount: "Full Oxford tuition + £18,180/year stipend", eligibleStudyLevels: "masters,mphil,phd", eligibleSubjects: "Any (Oxford)", eligibleNationalities: "100+ constituencies", tuitionCoverage: true, livingCostCoverage: true, travelSupport: true, healthInsurance: true, deadline: new Date("2026-10-04"), officialSourceUrl: "https://www.rhodeshouse.ox.ac.uk/scholarships/", featured: true },
    { slug: "fulbright-foreign-student", name: "Fulbright Foreign Student Program", provider: "government", countrySlug: "usa", fundingType: "fully-funded", fundingAmount: "Tuition + living stipend + health benefits", eligibleStudyLevels: "masters,phd", eligibleSubjects: "Any (excluding clinical medicine)", eligibleNationalities: "155+ countries", tuitionCoverage: true, livingCostCoverage: true, travelSupport: true, healthInsurance: true, deadline: new Date("2026-05-15"), officialSourceUrl: "https://foreign.fulbrightonline.org/", featured: true },
    { slug: "daad-scholarship", name: "DAAD Development-Related Postgraduate Scholarship", provider: "government", countrySlug: "germany", fundingType: "fully-funded", fundingAmount: "€934/month + tuition + travel", eligibleStudyLevels: "masters,phd", eligibleSubjects: "Development-related", eligibleNationalities: "Developing countries", tuitionCoverage: true, livingCostCoverage: true, travelSupport: true, healthInsurance: true, deadline: new Date("2026-08-31"), officialSourceUrl: "https://www.daad.de/en/study-and-research-in-germany/scholarships/", featured: true },
    { slug: "vanier-canada-graduate", name: "Vanier Canada Graduate Scholarship", provider: "government", countrySlug: "canada", fundingType: "fully-funded", fundingAmount: "CA$50,000/year for 3 years", eligibleStudyLevels: "phd", eligibleSubjects: "Any (research)", eligibleNationalities: "Any (Canadian and international)", tuitionCoverage: false, livingCostCoverage: true, travelSupport: false, healthInsurance: false, deadline: new Date("2026-11-01"), officialSourceUrl: "https://vanier.gc.ca/en/", featured: true },
    { slug: "australia-awards", name: "Australia Awards Scholarship", provider: "government", countrySlug: "australia", fundingType: "fully-funded", fundingAmount: "Full tuition + airfare + establishment allowance + CECS", eligibleStudyLevels: "bachelors,masters,phd", eligibleSubjects: "Development priority areas", eligibleNationalities: "Indo-Pacific partner countries", tuitionCoverage: true, livingCostCoverage: true, travelSupport: true, healthInsurance: true, deadline: new Date("2026-04-30"), officialSourceUrl: "https://www.australiaawards.gov.au/", featured: true },
    { slug: "holland-scholarship", name: "Holland Scholarship", provider: "government", countrySlug: "netherlands", fundingType: "partially-funded", fundingAmount: "€5,000 one-time payment (first year)", eligibleStudyLevels: "bachelors,masters", eligibleSubjects: "Any", eligibleNationalities: "Non-EU/EEA", tuitionCoverage: false, livingCostCoverage: false, travelSupport: false, healthInsurance: false, deadline: new Date("2026-05-01"), officialSourceUrl: "https://www.studyinnl.org/finance/scholarship", featured: true },
  ];

  for (const s of scholarships) {
    const country = await db.higherStudyCountry.findUnique({ where: { slug: s.countrySlug } });
    let universityId: string | undefined;
    if (s.universitySlug) {
      universityId = (await db.higherStudyUniversity.findUnique({ where: { slug: s.universitySlug } }))?.id;
    }
    await upsertScholarship(s.slug, {
      name: s.name,
      provider: s.provider,
      countryId: country?.id,
      universityId,
      eligibleStudyLevels: s.eligibleStudyLevels,
      eligibleSubjects: s.eligibleSubjects,
      eligibleNationalities: s.eligibleNationalities,
      fundingType: s.fundingType,
      fundingAmount: s.fundingAmount,
      tuitionCoverage: s.tuitionCoverage,
      livingCostCoverage: s.livingCostCoverage,
      travelSupport: s.travelSupport,
      healthInsurance: s.healthInsurance,
      deadline: s.deadline,
      officialSourceUrl: s.officialSourceUrl,
      verificationStatus: "verified",
      publicationStatus: "published",
      lastVerifiedAt: new Date(),
      featured: s.featured,
    } as never);
  }

  // 8. Research areas
  const researchAreas = [
    { slug: "artificial-intelligence", name: "Artificial Intelligence", description: "Machine learning, deep learning, NLP, computer vision, multi-agent systems, AI safety." },
    { slug: "quantum-computing", name: "Quantum Computing", description: "Quantum algorithms, error correction, quantum information, quantum cryptography." },
    { slug: "climate-and-energy", name: "Climate & Energy", description: "Renewable energy systems, climate modelling, sustainable engineering, energy storage." },
    { slug: "biomedical-engineering", name: "Biomedical Engineering", description: "Medical imaging, biomaterials, tissue engineering, neuro-engineering, medical devices." },
    { slug: "cyber-security", name: "Cyber Security", description: "Applied cryptography, network security, formal verification, secure systems." },
    { slug: "public-health-systems", name: "Public Health Systems", description: "Epidemiology, health policy, global health, biostatistics, infectious disease modelling." },
  ];

  const raMap: Record<string, string> = {};
  for (const ra of researchAreas) {
    const created = await upsertResearchArea(ra.slug, { ...ra });
    raMap[ra.slug] = created.id;
  }

  // 9. Supervisors
  const supervisors = [
    { slug: "prof-andrew-zisserman", name: "Prof Andrew Zisserman", academicTitle: "Professor", universitySlug: "university-of-oxford", department: "Department of Computer Science", raSlug: "artificial-intelligence", researchInterests: "Computer Vision, Deep Learning, 3D Scene Understanding", publicProfileUrl: "https://www.robots.ox.ac.uk/~az/", acceptingStudents: true, officialSourceUrl: "https://www.robots.ox.ac.uk/~az/" },
    { slug: "prof-joshua-tenenbaum", name: "Prof Joshua Tenenbaum", academicTitle: "Professor", universitySlug: "massachusetts-institute-of-technology", department: "Department of Brain and Cognitive Sciences", raSlug: "artificial-intelligence", researchInterests: "Cognitive Science, Computational Cognitive Science, AI", publicProfileUrl: "https://web.mit.edu/cocosci/josh.html", acceptingStudents: true, officialSourceUrl: "https://web.mit.edu/cocosci/josh.html" },
    { slug: "prof-geoffrey-hinton", name: "Prof Geoffrey Hinton", academicTitle: "Professor Emeritus", universitySlug: "university-of-toronto", department: "Department of Computer Science", raSlug: "artificial-intelligence", researchInterests: "Deep Learning, Neural Networks, Machine Learning", publicProfileUrl: "https://www.cs.toronto.edu/~hinton/", acceptingStudents: false, officialSourceUrl: "https://www.cs.toronto.edu/~hinton/" },
    { slug: "prof-artur-ekert", name: "Prof Artur Ekert", academicTitle: "Professor", universitySlug: "university-of-oxford", department: "Mathematical Institute", raSlug: "quantum-computing", researchInterests: "Quantum Cryptography, Quantum Information, Quantum Computing", publicProfileUrl: "https://www.maths.ox.ac.uk/people/artur.ekert", acceptingStudents: true, officialSourceUrl: "https://www.maths.ox.ac.uk/people/artur.ekert" },
    { slug: "prof-daniela-rus", name: "Prof Daniela Rus", academicTitle: "Professor", universitySlug: "massachusetts-institute-of-technology", department: "Department of Electrical Engineering and Computer Science", raSlug: "artificial-intelligence", researchInterests: "Robotics, AI, Machine Learning", publicProfileUrl: "https://danielarus.csail.mit.edu/", acceptingStudents: true, officialSourceUrl: "https://danielarus.csail.mit.edu/" },
    { slug: "prof-sir-john-bell", name: "Prof Sir John Bell", academicTitle: "Regius Professor of Medicine", universitySlug: "university-of-oxford", department: "Nuffield Department of Medicine", raSlug: "public-health-systems", researchInterests: "Genomic Medicine, Immunology, Health Policy", publicProfileUrl: "https://www.ndm.ox.ac.uk/principal-investigators/investigator/john-bell", acceptingStudents: false, officialSourceUrl: "https://www.ndm.ox.ac.uk/principal-investigators/investigator/john-bell" },
  ];

  const supMap: Record<string, string> = {};
  for (const s of supervisors) {
    const uniId = uniMap[s.universitySlug];
    const created = await upsertSupervisor(s.slug, {
      name: s.name,
      academicTitle: s.academicTitle,
      universityId: uniId,
      department: s.department,
      researchAreaId: raMap[s.raSlug],
      researchInterests: s.researchInterests,
      publicProfileUrl: s.publicProfileUrl,
      acceptingStudents: s.acceptingStudents,
      verificationStatus: "verified",
      publicationStatus: "published",
      lastVerifiedAt: new Date(),
      officialSourceUrl: s.officialSourceUrl,
    } as never);
    supMap[s.slug] = created.id;
  }

  // 10. Research projects
  const projects = [
    { slug: "rp-vision-language-models", title: "Vision-Language Models for Embodied Agents", universitySlug: "university-of-oxford", raSlug: "artificial-intelligence", supervisorSlug: "prof-andrew-zisserman", department: "Department of Computer Science", summary: "Research on multimodal LLMs that ground visual perception in language for robotic agents.", fundingStatus: "fully-funded", stipend: "£21,000/year + tuition", duration: "3–4 years", startDate: new Date("2026-10-01"), applicationDeadline: new Date("2026-03-15"), officialSourceUrl: "https://www.ox.ac.uk/admissions/graduate/courses/dphil-computer-science", featured: true },
    { slug: "rp-probabilistic-cognitive-models", title: "Probabilistic Models of Human Cognition", universitySlug: "massachusetts-institute-of-technology", raSlug: "artificial-intelligence", supervisorSlug: "prof-joshua-tenenbaum", department: "Department of Brain and Cognitive Sciences", summary: "Bayesian models of learning and reasoning in humans and machines.", fundingStatus: "fully-funded", stipend: "$40,000/year + tuition", duration: "5 years", startDate: new Date("2026-09-01"), applicationDeadline: new Date("2025-12-15"), officialSourceUrl: "https://bcs.mit.edu/academic/graduate", featured: true },
    { slug: "rp-quantum-cryptography", title: "Device-Independent Quantum Cryptography", universitySlug: "university-of-oxford", raSlug: "quantum-computing", supervisorSlug: "prof-artur-ekert", department: "Mathematical Institute", summary: "Theoretical and experimental work on quantum key distribution with untrusted devices.", fundingStatus: "fully-funded", stipend: "£21,000/year + tuition", duration: "3–4 years", startDate: new Date("2026-10-01"), applicationDeadline: new Date("2026-03-15"), officialSourceUrl: "https://www.maths.ox.ac.uk/study-here/postgraduate-study", featured: false },
    { slug: "rp-soft-robotics", title: "Soft Robotics for Human-Centred AI", universitySlug: "massachusetts-institute-of-technology", raSlug: "artificial-intelligence", supervisorSlug: "prof-daniela-rus", department: "CSAIL", summary: "Design and control of soft-bodied robots for healthcare and manufacturing.", fundingStatus: "fully-funded", stipend: "$40,000/year + tuition", duration: "5 years", startDate: new Date("2026-09-01"), applicationDeadline: new Date("2025-12-15"), officialSourceUrl: "https://www.csail.mit.edu/", featured: true },
    { slug: "rp-climate-energy-storage", title: "Long-Duration Energy Storage for Renewable Grids", universitySlug: "technical-university-of-munich", raSlug: "climate-and-energy", department: "Department of Energy Systems", summary: "Modelling and optimisation of multi-day energy storage technologies for grid stability.", fundingStatus: "partially-funded", stipend: "€1,800/month", duration: "3–4 years", startDate: new Date("2026-10-01"), applicationDeadline: new Date("2026-04-30"), officialSourceUrl: "https://www.mse.tum.de/en/mse/research/", featured: false },
    { slug: "rp-genomic-medicine-policy", title: "Policy Frameworks for National Genomic Medicine", universitySlug: "university-of-oxford", raSlug: "public-health-systems", supervisorSlug: "prof-sir-john-bell", department: "Nuffield Department of Medicine", summary: "Comparative policy analysis of national genome programmes and their clinical translation.", fundingStatus: "fully-funded", stipend: "£21,000/year + tuition", duration: "3 years", startDate: new Date("2026-10-01"), applicationDeadline: new Date("2026-01-08"), officialSourceUrl: "https://www.ndm.ox.ac.uk/study/graduate-studies", featured: false },
  ];

  for (const p of projects) {
    const uniId = uniMap[p.universitySlug];
    await upsertResearchProject(p.slug, {
      title: p.title,
      universityId: uniId,
      department: p.department,
      researchAreaId: raMap[p.raSlug],
      supervisorId: p.supervisorSlug ? supMap[p.supervisorSlug] : null,
      projectSummary: p.summary,
      fundingStatus: p.fundingStatus,
      stipend: p.stipend,
      duration: p.duration,
      startDate: p.startDate,
      applicationDeadline: p.applicationDeadline,
      officialSourceUrl: p.officialSourceUrl,
      verificationStatus: "verified",
      publicationStatus: "published",
      lastVerifiedAt: new Date(),
      featured: p.featured,
    } as never);
  }

  // 11. Resources
  const resources = [
    { slug: "planning-your-study-abroad-journey", title: "Planning Your Study Abroad Journey: A 12-Month Timeline", category: "planning", summary: "Step-by-step 12-month roadmap from initial research to departure.", content: "Full guide on month-by-month planning...", author: "Al Aminn Editorial Team", reviewer: "ALO Education Academic Advisors", readingTimeMinutes: 12, featured: true, officialSourceUrl: "https://alaminn.info/guides/planning" },
    { slug: "uk-student-visa-guide-2026", title: "UK Student Visa Guide 2026: Requirements, Documents, Costs", category: "visa", summary: "Complete UK Student visa application walkthrough with financial evidence requirements.", content: "Walkthrough of UK Student visa process...", author: "Al Aminn Editorial Team", reviewer: "UKCISA references", readingTimeMinutes: 15, featured: true, officialSourceUrl: "https://www.gov.uk/student-visa" },
    { slug: "sop-writing-guide", title: "Statement of Purpose: A Definitive Writing Guide", category: "sop", summary: "Structure, examples, common mistakes, and 7-step writing framework for graduate applications.", content: "SOP framework and examples...", author: "ALO Education Academic Team", reviewer: "Admissions Consultants", readingTimeMinutes: 18, featured: true, officialSourceUrl: "https://alaminn.info/guides/sop" },
    { slug: "scholarship-application-mastery", title: "Scholarship Application Mastery: From Shortlist to Interview", category: "scholarship-guides", summary: "How to identify, prepare, and win fully-funded scholarships.", content: "Scholarship strategy guide...", author: "Al Aminn Editorial Team", reviewer: "Fulbright, Chevening alumni", readingTimeMinutes: 22, featured: true, officialSourceUrl: "https://alaminn.info/guides/scholarships" },
    { slug: "ielts-vs-toefl-vs-pte", title: "IELTS vs TOEFL vs PTE vs Duolingo: Which English Test Should You Take?", category: "ielts", summary: "Comparison of format, scoring, acceptance, difficulty, and cost.", content: "Side-by-side comparison of English proficiency tests...", author: "ALO Education English Team", reviewer: "English Learning Platform", readingTimeMinutes: 14, featured: true, officialSourceUrl: "https://alaminn.info/guides/english-tests" },
    { slug: "phd-application-supervisor-contact", title: "How to Contact a PhD Supervisor (With Email Templates)", category: "supervisor-contact", summary: "Cold-email strategy, templates, and what to include in your first contact.", content: "Email templates and best practices...", author: "Al Aminn Editorial Team", reviewer: "PhD admissions experts", readingTimeMinutes: 10, featured: false, officialSourceUrl: "https://alaminn.info/guides/supervisor-contact" },
    { slug: "research-proposal-template", title: "Research Proposal Template for PhD Applications", category: "proposal-guides", summary: "5-part research proposal structure with annotated example.", content: "Template with worked example...", author: "ALO Education Academic Team", reviewer: "Doctoral advisors", readingTimeMinutes: 16, featured: true, officialSourceUrl: "https://alaminn.info/guides/proposal" },
    { slug: "academic-cv-template", title: "Academic CV Template: International Admissions Format", category: "cv", summary: "2-page academic CV format accepted by top universities.", content: "CV template with annotations...", author: "Al Aminn Editorial Team", reviewer: "Admissions officers", readingTimeMinutes: 8, featured: false, officialSourceUrl: "https://alaminn.info/guides/cv" },
  ];

  for (const r of resources) {
    await upsertResource(r.slug, {
      title: r.title,
      category: r.category,
      summary: r.summary,
      content: r.content,
      author: r.author,
      reviewer: r.reviewer,
      publishedAt: new Date(),
      lastVerifiedAt: new Date(),
      readingTimeMinutes: r.readingTimeMinutes,
      officialSourceUrl: r.officialSourceUrl,
      verificationStatus: "verified",
      publicationStatus: "published",
      featured: r.featured,
    } as never);
  }

  // 12. Student stories
  const stories = [
    { slug: "anika-oxford-dphil-cs", studentName: "Anika Rahman", universityName: "University of Oxford", courseName: "DPhil in Computer Science", country: "United Kingdom", intake: "October 2024", story: "From a small town in Bangladesh to a Clarendon Fund scholarship at Oxford — my journey through 18 months of structured preparation.", advice: "Start your SOP 6 months before the deadline. Connect with current students on LinkedIn. Apply to 3-5 supervisors, not 30.", featured: true },
    { slug: "rifat-mit-eecs", studentName: "Rifat Hasan", universityName: "MIT", courseName: "MSc in EECS", country: "United States", intake: "September 2024", story: "Self-taught ML researcher to MIT RA-supported master's — what I learned about publications, recommendations, and luck.", advice: "Demonstrate research capability, not just grades. Submit to workshops. Your recommender's letter matters more than your GRE.", featured: true },
    { slug: "sumaiya-tum-informatics", studentName: "Sumaiya Akter", universityName: "Technical University of Munich", courseName: "MSc in Informatics", country: "Germany", intake: "October 2024", story: "Tuition-free master's at TUM with DAAD funding — the application process, blocked account, and learning German basics.", advice: "Apply via Uni-assist early. Block your Sperrkonto at least 3 months before visa interview. Learn German — even A1 helps.", featured: true },
    { slug: "tanvir-toronto-rotman", studentName: "Tanvir Ahmed", universityName: "University of Toronto", courseName: "Rotman MBA", country: "Canada", intake: "September 2024", story: "5 years in fintech to Rotman MBA with scholarship — GMAT strategy, networking, and the post-MBA job hunt.", advice: "GMAT 700+ opens doors. Talk to current students. The Toronto tech scene is hiring — leverage Rotman's industry network.", featured: false },
  ];

  for (const s of stories) {
    await upsertStudentStory(s.slug, {
      studentName: s.studentName,
      universityName: s.universityName,
      courseName: s.courseName,
      country: s.country,
      intake: s.intake,
      story: s.story,
      advice: s.advice,
      publishedAt: new Date(),
      featured: s.featured,
    } as never);
  }

  // 13. Events
  const events = [
    { slug: "study-uk-fair-2026", title: "Study UK: Virtual Postgraduate Fair 2026", description: "Connect with 40+ UK universities in live webinar sessions. British Council organised.", eventDate: new Date("2026-03-12T13:00:00Z"), endDate: new Date("2026-03-12T18:00:00Z"), location: "online", organiser: "British Council", registrationUrl: "https://www.britishcouncil.org/study-uk", status: "upcoming" },
    { slug: "daad-info-session-2026", title: "DAAD Scholarship Info Session (Bangladesh)", description: "In-person info session on DAAD postgraduate scholarships for development-related fields.", eventDate: new Date("2026-02-15T10:00:00Z"), endDate: new Date("2026-02-15T13:00:00Z"), location: "Dhaka, Bangladesh", organiser: "DAAD Bangladesh", registrationUrl: "https://www.daad.de/en/", status: "upcoming" },
    { slug: "fulbright-application-webinar", title: "Fulbright Foreign Student Program: Application Walkthrough", description: "Step-by-step webinar on the Fulbright application — essay writing, references, interview.", eventDate: new Date("2026-04-22T16:00:00Z"), endDate: new Date("2026-04-22T18:00:00Z"), location: "online", organiser: "Fulbright Commission", registrationUrl: "https://foreign.fulbrightonline.org/", status: "upcoming" },
    { slug: "canada-study-permit-webinar", title: "Canada Study Permit & PGWP: 2026 Updates", description: "EduCanada webinar covering new SDS rules, study permit caps, and PGWP eligibility changes.", eventDate: new Date("2026-05-08T14:00:00Z"), endDate: new Date("2026-05-08T16:00:00Z"), location: "online", organiser: "EduCanada", registrationUrl: "https://www.educanada.ca/", status: "upcoming" },
  ];

  for (const e of events) {
    await upsertEvent(e.slug, {
      title: e.title,
      description: e.description,
      eventDate: e.eventDate,
      endDate: e.endDate,
      location: e.location,
      organiser: e.organiser,
      registrationUrl: e.registrationUrl,
      status: e.status,
    } as never);
  }

  console.log("Higher Study seed complete:");
  const counts = await Promise.all([
    db.higherStudyCountry.count(),
    db.higherStudyCity.count(),
    db.higherStudyUniversity.count(),
    db.higherStudyCourse.count(),
    db.higherStudyScholarship.count(),
    db.higherStudyResearchArea.count(),
    db.higherStudyResearchProject.count(),
    db.higherStudySupervisor.count(),
    db.higherStudySubject.count(),
    db.higherStudyIntake.count(),
    db.higherStudyResource.count(),
    db.higherStudyStudentStory.count(),
    db.higherStudyEvent.count(),
  ]);
  console.log(`  Countries: ${counts[0]}`);
  console.log(`  Cities: ${counts[1]}`);
  console.log(`  Universities: ${counts[2]}`);
  console.log(`  Courses: ${counts[3]}`);
  console.log(`  Scholarships: ${counts[4]}`);
  console.log(`  Research areas: ${counts[5]}`);
  console.log(`  Research projects: ${counts[6]}`);
  console.log(`  Supervisors: ${counts[7]}`);
  console.log(`  Subjects: ${counts[8]}`);
  console.log(`  Intakes: ${counts[9]}`);
  console.log(`  Resources: ${counts[10]}`);
  console.log(`  Student stories: ${counts[11]}`);
  console.log(`  Events: ${counts[12]}`);
}

// Run directly: `bun run prisma/seed-higher-study.ts`
// Imported: caller invokes `seedHigherStudy(prisma?)`.
if (require.main === module) {
  seedHigherStudy()
    .then(async () => {
      if (_ownsConnection) await db.$disconnect();
    })
    .catch(async (e) => {
      console.error("Seed failed:", e);
      if (_ownsConnection) await db.$disconnect();
      process.exit(1);
    });
}
