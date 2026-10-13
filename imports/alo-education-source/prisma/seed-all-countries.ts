/**
 * ALO Education — Seed all 8 CountryPage records with rich data
 * Usage: bunx tsx prisma/seed-all-countries.ts
 * Idempotent: uses upsert on slug.
 */
import { db } from '../src/lib/db';

// ─── Destination Data ────────────────────────────────────────────────────────

const DESTINATION_DATA: Record<string, {
  name: string;
  flag: string;
  currency: string;
  language: string;
  avgTuition: string;
  avgLiving: string;
  workHours: string;
  intake: string;
  visaType: string;
  desc: string;
  topUnis: string[];
}> = {
  'united-kingdom': {
    name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP (£)', language: 'English',
    avgTuition: '£10,000 - £38,000', avgLiving: '£12,000 - £15,000',
    workHours: '20 hrs/week', intake: 'September, January',
    visaType: 'Student Visa (Tier 4)',
    desc: 'The UK is home to 4 of the world\'s top 10 universities, offering globally recognised degrees, rich cultural heritage, and a post-study work visa of up to 2 years.',
    topUnis: ['University of Oxford', 'University of Cambridge', 'Imperial College London', 'UCL', 'University of Edinburgh'],
  },
  'usa': {
    name: 'United States', flag: '🇺🇸', currency: 'USD ($)', language: 'English',
    avgTuition: '$25,000 - $55,000', avgLiving: '$10,000 - $18,000',
    workHours: '20 hrs/week', intake: 'August, January',
    visaType: 'F-1 Student Visa',
    desc: 'The USA hosts the largest number of top-ranked universities globally, with unmatched research facilities, diverse campus life, and strong industry connections in tech, finance, and healthcare.',
    topUnis: ['MIT', 'Harvard', 'Stanford', 'UC Berkeley', 'Columbia'],
  },
  'canada': {
    name: 'Canada', flag: '🇨🇦', currency: 'CAD ($)', language: 'English/French',
    avgTuition: 'CA$15,000 - CA$35,000', avgLiving: 'CA$10,000 - CA$15,000',
    workHours: '20 hrs/week', intake: 'September, January, May',
    visaType: 'Study Permit',
    desc: 'Canada offers high-quality education at competitive tuition fees, a welcoming multicultural society, and clear pathways to permanent residency after graduation.',
    topUnis: ['U of Toronto', 'UBC', 'McGill', 'U of Alberta', 'U of Waterloo'],
  },
  'australia': {
    name: 'Australia', flag: '🇦🇺', currency: 'AUD ($)', language: 'English',
    avgTuition: 'A$20,000 - A$45,000', avgLiving: 'A$21,000',
    workHours: '48 hrs/fortnight', intake: 'February, July',
    visaType: 'Subclass 500 Student Visa',
    desc: 'Australia boasts 7 universities in the global top 100, beautiful weather, excellent work-life balance, and generous post-study work rights of up to 6 years.',
    topUnis: ['U of Melbourne', 'U of Sydney', 'UNSW', 'U of Queensland', 'Monash'],
  },
  'ireland': {
    name: 'Ireland', flag: '🇮🇪', currency: 'EUR (€)', language: 'English',
    avgTuition: '€10,000 - €25,000', avgLiving: '€12,000',
    workHours: '20 hrs/week', intake: 'September, January',
    visaType: 'Long Stay Study Visa',
    desc: 'Ireland is the European HQ of major tech companies including Google, Apple, and Meta, offering excellent career opportunities for graduates in technology, pharma, and finance sectors.',
    topUnis: ['Trinity College Dublin', 'UCD', 'U of Galway', 'DCU', 'U of Limerick'],
  },
  'new-zealand': {
    name: 'New Zealand', flag: '🇳🇿', currency: 'NZD ($)', language: 'English',
    avgTuition: 'NZ$22,000 - NZ$35,000', avgLiving: 'NZ$15,000',
    workHours: '20 hrs/week', intake: 'February, July',
    visaType: 'Student Visa',
    desc: 'New Zealand offers a safe, beautiful environment with a world-class education system, small class sizes, and generous post-study work visa of up to 3 years.',
    topUnis: ['U of Auckland', 'U of Otago', 'Victoria Wellington', 'U of Canterbury', 'Massey'],
  },
  'germany': {
    name: 'Germany', flag: '🇩🇪', currency: 'EUR (€)', language: 'German/English',
    avgTuition: '€0 - €1,500', avgLiving: '€10,000',
    workHours: '20 hrs/week', intake: 'October, April',
    visaType: 'Student Visa',
    desc: 'Germany offers free or low-cost education at public universities, strong engineering and research programmes, and excellent post-study employment prospects in Europe\'s largest economy.',
    topUnis: ['TU Munich', 'Heidelberg', 'LMU Munich', 'RWTH Aachen', 'Humboldt Berlin'],
  },
  'malaysia': {
    name: 'Malaysia', flag: '🇲🇾', currency: 'MYR (RM)', language: 'English/Malay',
    avgTuition: 'RM 15,000 - RM 50,000', avgLiving: 'RM 1,500/mo',
    workHours: '20 hrs/week', intake: 'September, February',
    visaType: 'Student Pass',
    desc: 'Malaysia offers affordable quality education with branch campuses of top UK and Australian universities, a low cost of living, and a vibrant multicultural student life.',
    topUnis: ['UM', 'USM', 'UKM', 'Monash Malaysia', 'Nottingham Malaysia'],
  },
};

// ─── Slug mapping (DB slug -> DESTINATION_DATA key) ─────────────────────────
const SLUG_MAP: Record<string, string> = {
  'uk': 'united-kingdom',
  'usa': 'usa',
  'canada': 'canada',
  'australia': 'australia',
  'ireland': 'ireland',
  'new-zealand': 'new-zealand',
  'germany': 'germany',
  'malaysia': 'malaysia',
};

// ─── Why Study data per destination key ──────────────────────────────────────

const WHY_STUDY: Record<string, Array<{ title: string; description: string; icon: string }>> = {
  'united-kingdom': [
    { title: 'World-Class Universities', description: 'The UK has 4 of the world\'s top 10 universities and over 70 in the top 700 QS rankings. Degrees are globally recognised and respected by employers in every industry.', icon: '🎓' },
    { title: 'Post-Study Work Visa (2 Years)', description: 'The Graduate Route visa allows international students to stay and work in the UK for up to 2 years after graduation (3 years for PhD holders), providing valuable global work experience.', icon: '💼' },
    { title: 'Shorter Programmes, Lower Costs', description: 'UK undergraduate degrees are typically 3 years and master\'s programmes 1 year — significantly shorter than in the US or Canada, reducing both tuition and living expenses.', icon: '⏱️' },
    { title: 'Cultural Diversity & Heritage', description: 'With students from over 200 countries, the UK offers a truly multicultural experience alongside centuries of history, world-class museums, and vibrant arts scenes.', icon: '🌍' },
    { title: 'National Health Service (NHS)', description: 'International students in the UK can access healthcare through the NHS by paying a small Immigration Health Surcharge as part of their visa application.', icon: '🏥' },
    { title: 'Strong Industry Connections', description: 'UK universities have deep partnerships with leading employers. Many programmes include sandwich years, internships, and live industry projects that boost employability.', icon: '🔗' },
  ],
  'usa': [
    { title: 'World\'s Top University System', description: 'The US dominates global university rankings with 30+ institutions in the top 100. American degrees carry unmatched prestige and open doors to careers worldwide.', icon: '🏆' },
    { title: 'Optional Practical Training (OPT)', description: 'F-1 students can work for up to 12 months in their field after graduation (36 months for STEM degrees), gaining invaluable US work experience.', icon: '💼' },
    { title: 'Cutting-Edge Research & Innovation', description: 'US universities lead global research in AI, biotechnology, aerospace, and more. Students learn from Nobel laureates and industry pioneers.', icon: '🔬' },
    { title: 'Flexible Curriculum', description: 'American universities allow students to explore different subjects before declaring a major, with interdisciplinary studies and double-major options widely available.', icon: '📚' },
    { title: 'Massive Scholarship Pool', description: 'US universities offer billions in financial aid annually. Many institutions provide merit-based and need-based scholarships specifically for international students.', icon: '💰' },
    { title: 'Diverse Campus Life', description: 'With over 1 million international students, US campuses offer vibrant multicultural communities, 1,000+ student organisations, and world-class sports facilities.', icon: '🌍' },
  ],
  'canada': [
    { title: 'Affordable World-Class Education', description: 'Canadian university tuition is significantly lower than the US and UK, while maintaining world-class academic standards with 4 universities in the global top 50.', icon: '💰' },
    { title: 'Post-Graduation Work Permit (PGWP)', description: 'Canada offers an open work permit of up to 3 years after graduation — one of the most generous post-study work policies in the world.', icon: '💼' },
    { title: 'Pathway to Permanent Residency', description: 'Canada has clear immigration pathways for international graduates through Express Entry and Provincial Nominee Programs, making it a top destination for settlement.', icon: '🏠' },
    { title: 'Safe & Welcoming Society', description: 'Consistently ranked among the safest countries globally, Canada embraces multiculturalism and has a large South Asian diaspora community.', icon: '🤝' },
    { title: 'Bilingual Advantage', description: 'Studying in Canada offers opportunities to learn both English and French, with many programmes available in both official languages.', icon: '🗣️' },
    { title: 'Strong Co-op Programmes', description: 'Canadian universities like Waterloo and U of Toronto offer industry-leading co-op programmes that alternate study terms with paid work placements.', icon: '🔗' },
  ],
  'australia': [
    { title: 'Top 100 University Powerhouse', description: 'Australia has 7 universities in the QS top 100 and 15 in the top 300, offering consistently high-quality education across a wide range of disciplines.', icon: '🎓' },
    { title: 'Generous Post-Study Work Rights', description: 'Graduates can stay and work in Australia for 2–6 years depending on their qualification level and study location (regional areas offer extended stays).', icon: '💼' },
    { title: 'High Quality of Life', description: 'Australia ranks in the top 10 for quality of life globally, with beautiful beaches, excellent healthcare, a sunny climate, and vibrant multicultural cities.', icon: '☀️' },
    { title: 'Work While Studying', description: 'International students can work up to 48 hours per fortnight during term time and unlimited hours during breaks, helping offset living costs.', icon: '⏱️' },
    { title: 'Research Excellence', description: 'Australian universities are world leaders in research across medicine, environmental science, engineering, and marine biology, with strong industry funding.', icon: '🔬' },
    { title: 'Vocational & Academic Pathways', description: 'Australia offers seamless pathways from vocational education (TAFE) to university degrees, and many programmes include practical placements and industry certifications.', icon: '🔗' },
  ],
  'ireland': [
    { title: 'European Tech Hub', description: 'Ireland is home to the European headquarters of Google, Meta, Apple, Microsoft, and hundreds of other tech companies, creating massive employment opportunities for graduates.', icon: '💻' },
    { title: 'English-Speaking EU Country', description: 'As the only English-speaking country in the EU, Ireland offers access to the European job market without a language barrier while studying in English.', icon: '🗣️' },
    { title: 'Stay Back Visa (1-2 Years)', description: 'The Third Level Graduate Programme allows non-EU graduates to stay and work in Ireland for 1-2 years, with many transitioning to full employment and residency.', icon: '💼' },
    { title: 'Pharmaceutical & Medical Hub', description: 'Ireland is the world\'s 3rd largest exporter of pharmaceuticals, with 9 of the top 10 global pharma companies having operations there.', icon: '💊' },
    { title: 'Friendly & Safe', description: 'Ireland consistently ranks as one of the friendliest and safest countries in the world, with a warm, welcoming culture that makes international students feel at home.', icon: '🤝' },
    { title: 'Growing Research Investment', description: 'Irish universities have seen significant government and EU research investment, with strong programmes in data science, AI, and sustainability.', icon: '🔬' },
  ],
  'new-zealand': [
    { title: 'Safe & Peaceful Environment', description: 'New Zealand consistently ranks as one of the safest and most peaceful countries globally, with a low crime rate and stunning natural landscapes.', icon: '🏞️' },
    { title: 'Post-Study Work Visa (3 Years)', description: 'International graduates can stay and work in New Zealand for up to 3 years, with clear pathways to residency through the Skilled Migrant Category.', icon: '💼' },
    { title: 'World-Class Education System', description: 'All 8 New Zealand universities rank in the QS top 500, with a focus on practical, research-informed teaching and small class sizes.', icon: '🎓' },
    { title: 'Work-Life Balance Culture', description: 'New Zealanders value work-life balance, and this extends to student life — a supportive environment where you can excel academically while enjoying outdoor adventures.', icon: '⚖️' },
    { title: 'Affordable Living Costs', description: 'Compared to Australia, the UK, and the US, New Zealand offers a more affordable cost of living while maintaining a high standard of living.', icon: '💰' },
    { title: 'Specialised Programmes', description: 'New Zealand excels in specialised fields like agriculture, environmental science, tourism management, and indigenous studies (Māori culture).', icon: '🌱' },
  ],
  'germany': [
    { title: 'Tuition-Free Education', description: 'Most public universities in Germany charge no tuition fees for international students — only a small semester contribution of €100-€350 covering admin and transport.', icon: '💰' },
    { title: 'Europe\'s Largest Economy', description: 'Germany is the economic powerhouse of Europe, home to global brands like BMW, Siemens, SAP, and Bosch, offering exceptional career opportunities for graduates.', icon: '🏭' },
    { title: '18-Month Job Seeker Visa', description: 'After graduation, international students receive an 18-month residence permit to find employment in Germany — one of the most generous post-study policies in Europe.', icon: '💼' },
    { title: 'Engineering Excellence', description: 'German universities are world-renowned for engineering, automotive, mechanical, and electrical engineering programmes with strong industry partnerships.', icon: '⚙️' },
    { title: 'Growing English-Taught Programmes', description: 'Germany now offers over 1,800 English-taught programmes at master\'s and PhD level, making it accessible without prior German language skills.', icon: '🗣️' },
    { title: 'Strong Research Infrastructure', description: 'With organisations like Max Planck, Fraunhofer, and the Helmholtz Association, Germany offers unmatched research opportunities and funding for doctoral students.', icon: '🔬' },
  ],
  'malaysia': [
    { title: 'Incredibly Affordable', description: 'Malaysia offers tuition fees 50-70% lower than the UK or Australia, with living costs as low as RM 1,500/month, making it one of the most budget-friendly study destinations.', icon: '💰' },
    { title: 'International Branch Campuses', description: 'Malaysia hosts branch campuses of top universities including Monash, Nottingham, and Southampton, allowing students to earn a UK/Australian degree at a fraction of the cost.', icon: '🎓' },
    { title: 'Fast-Track Degrees', description: 'Many Malaysian institutions offer 2+1 or 3+0 programmes, allowing students to complete part of their degree locally and transfer abroad, or earn the full degree in Malaysia.', icon: '⏱️' },
    { title: 'Multicultural Hub', description: 'With Malay, Chinese, Indian, and indigenous cultures coexisting harmoniously, Malaysia offers a rich multicultural experience with amazing food and festivals year-round.', icon: '🌍' },
    { title: 'Growing Tech & Business Sector', description: 'Malaysia\'s rapidly growing digital economy and position as a regional business hub create strong internship and career opportunities for graduates.', icon: '💻' },
    { title: 'Simple Student Pass Process', description: 'Malaysia\'s student visa process is relatively straightforward and fast, with ALO Education providing full support for applications and documentation.', icon: '📋' },
  ],
};

// ─── Cities data per destination key ─────────────────────────────────────────

const CITIES: Record<string, Array<{ name: string; description: string; universities: string; avgRent: string; image: string }>> = {
  'united-kingdom': [
    { name: 'London', description: 'The UK\'s capital and a global city with world-class universities, diverse culture, and unmatched career opportunities in finance, tech, and the arts.', universities: 'UCL, Imperial, LSE, King\'s College', avgRent: '£1,200-£1,800/mo', image: '/images/alo/countries/uk-landscape.webp' },
    { name: 'Manchester', description: 'A vibrant northern city known for its thriving tech scene, music culture, and two world-class universities.', universities: 'U of Manchester, Manchester Met', avgRent: '£700-£1,000/mo', image: '' },
    { name: 'Edinburgh', description: 'Scotland\'s capital combines medieval charm with a modern, innovative economy. Home to one of the world\'s top 30 universities.', universities: 'U of Edinburgh, Edinburgh Napier', avgRent: '£800-£1,200/mo', image: '' },
    { name: 'Birmingham', description: 'The UK\'s second-largest city offers excellent universities, a diverse student population, and lower living costs than London.', universities: 'U of Birmingham, Aston, BCU', avgRent: '£600-£900/mo', image: '' },
    { name: 'Glasgow', description: 'Scotland\'s largest city is a cultural powerhouse with a thriving music scene, friendly locals, and the Russell Group University of Glasgow.', universities: 'U of Glasgow, Strathclyde, GCU', avgRent: '£600-£850/mo', image: '' },
  ],
  'usa': [
    { name: 'New York City', description: 'The city that never sleeps offers unparalleled access to finance, media, fashion, and tech industries alongside elite universities.', universities: 'Columbia, NYU, CUNY', avgRent: '$1,500-£2,500/mo', image: '/images/hero/USA slide Banner.webp' },
    { name: 'Boston', description: 'America\'s premier university city, home to Harvard and MIT, with a rich history and thriving biotech industry.', universities: 'Harvard, MIT, BU, Northeastern', avgRent: '$1,200-$2,000/mo', image: '' },
    { name: 'San Francisco Bay Area', description: 'The global tech capital offers proximity to Silicon Valley, Stanford, and world-class innovation ecosystems.', universities: 'Stanford, UC Berkeley, SF State', avgRent: '$1,500-$2,500/mo', image: '' },
    { name: 'Chicago', description: 'A major cultural and financial hub in the Midwest with top universities and a diverse, vibrant urban experience.', universities: 'U of Chicago, Northwestern, UIC', avgRent: '$1,000-$1,800/mo', image: '' },
    { name: 'Los Angeles', description: 'Entertainment capital of the world with excellent universities, beautiful weather, and career opportunities in tech, media, and aerospace.', universities: 'UCLA, USC, Caltech', avgRent: '$1,200-$2,000/mo', image: '' },
  ],
  'canada': [
    { name: 'Toronto', description: 'Canada\'s largest city and financial capital is a diverse, multicultural hub with top-ranked universities and booming tech sector.', universities: 'U of Toronto, York U, Ryerson', avgRent: 'CA$1,200-CA$1,800/mo', image: '/images/alo/countries/canada-landscape.webp' },
    { name: 'Vancouver', description: 'Nestled between mountains and ocean, Vancouver offers stunning natural beauty alongside excellent universities and a growing tech industry.', universities: 'UBC, SFU, UVI', avgRent: 'CA$1,100-CA$1,700/mo', image: '' },
    { name: 'Montreal', description: 'A bilingual city with a vibrant arts scene, low tuition fees (especially at McGill), and a strong AI research community.', universities: 'McGill, Concordia, U de Montréal', avgRent: 'CA$700-CA$1,100/mo', image: '' },
    { name: 'Waterloo', description: 'Canada\'s tech talent pipeline, home to the world\'s largest co-op programme at the University of Waterloo.', universities: 'U of Waterloo, Wilfrid Laurier', avgRent: 'CA$700-CA$1,000/mo', image: '' },
  ],
  'australia': [
    { name: 'Melbourne', description: 'Consistently ranked the world\'s most liveable city, Melbourne offers top universities, a thriving arts scene, and excellent coffee culture.', universities: 'U of Melbourne, Monash, RMIT', avgRent: 'A$1,000-A$1,600/mo', image: '/images/alo/countries/australia-landscape.webp' },
    { name: 'Sydney', description: 'Australia\'s largest city offers iconic harbour views, world-class beaches, and prestigious universities alongside strong job opportunities.', universities: 'U of Sydney, UNSW, UTS', avgRent: 'A$1,100-A$1,800/mo', image: '' },
    { name: 'Brisbane', description: 'A sunny, fast-growing city with a strong tech sector, affordable living, and excellent universities including the U of Queensland.', universities: 'U of Queensland, QUT, Griffith', avgRent: 'A$800-A$1,300/mo', image: '' },
    { name: 'Perth', description: 'Western Australia\'s capital offers a relaxed lifestyle, beautiful beaches, and excellent opportunities in mining, engineering, and resources.', universities: 'U of Western Australia, Curtin, Murdoch', avgRent: 'A$700-A$1,100/mo', image: '' },
    { name: 'Adelaide', description: 'A compact, friendly city known for its wine regions, festivals, and lower living costs compared to Sydney and Melbourne.', universities: 'U of Adelaide, UniSA, Flinders', avgRent: 'A$600-A$1,000/mo', image: '' },
  ],
  'ireland': [
    { name: 'Dublin', description: 'Ireland\'s capital is a vibrant tech hub hosting the European HQs of Google, Meta, and Apple, alongside prestigious universities.', universities: 'Trinity College, UCD, DCU', avgRent: '€900-€1,400/mo', image: '' },
    { name: 'Cork', description: 'Ireland\'s second city is a thriving hub for pharmaceutical and tech companies, with a friendly atmosphere and strong university presence.', universities: 'UCC, CIT', avgRent: '€600-€900/mo', image: '' },
    { name: 'Galway', description: 'A charming coastal city known for its arts festivals, traditional music scene, and the prestigious National University of Ireland, Galway.', universities: 'NUIG, GMIT', avgRent: '€600-€850/mo', image: '' },
    { name: 'Limerick', description: 'Home to the University of Limerick, known for its cooperative education programmes and strong sports culture.', universities: 'UL, LIT', avgRent: '€500-€750/mo', image: '' },
  ],
  'new-zealand': [
    { name: 'Auckland', description: 'New Zealand\'s largest city offers a diverse urban experience with excellent universities, harbour views, and a mild climate.', universities: 'U of Auckland, AUT, Massey', avgRent: 'NZ$900-NZ$1,400/mo', image: '/images/hero/New Zealand slide Banner.webp' },
    { name: 'Wellington', description: 'The capital city is known for its arts scene, coffee culture, and being home to Victoria University of Wellington.', universities: 'Victoria Wellington, Massey', avgRent: 'NZ$800-NZ$1,200/mo', image: '' },
    { name: 'Christchurch', description: 'The largest city in the South Island, known as the "Garden City" with a growing tech sector and the U of Canterbury.', universities: 'U of Canterbury, Lincoln, Ara', avgRent: 'NZ$700-NZ$1,000/mo', image: '' },
    { name: 'Dunedin', description: 'A student-focused city home to the University of Otago, New Zealand\'s oldest university, with a vibrant Scottish heritage.', universities: 'U of Otago, Otago Polytechnic', avgRent: 'NZ$600-NZ$900/mo', image: '' },
  ],
  'germany': [
    { name: 'Berlin', description: 'Germany\'s capital is a cultural and tech hotspot with a vibrant startup scene, rich history, and free-tuition universities.', universities: 'TU Berlin, FU Berlin, HU Berlin', avgRent: '€500-€900/mo', image: '/images/hero/Europe slide Banner.webp' },
    { name: 'Munich', description: 'Bavaria\'s capital combines traditional German culture with world-class engineering and business schools, plus proximity to BMW and Siemens.', universities: 'TU Munich, LMU Munich', avgRent: '€700-€1,200/mo', image: '' },
    { name: 'Heidelberg', description: 'A picturesque university town home to Germany\'s oldest university, with a romantic castle backdrop and strong research focus.', universities: 'Heidelberg University', avgRent: '€500-€800/mo', image: '' },
    { name: 'Hamburg', description: 'Germany\'s second-largest city is a major port and media hub with excellent universities and a vibrant cultural scene.', universities: 'U of Hamburg, TUHH, HSU', avgRent: '€500-€850/mo', image: '' },
    { name: 'Aachen', description: 'Home to RWTH Aachen, one of Europe\'s top technical universities, known for engineering excellence and close industry ties.', universities: 'RWTH Aachen, FH Aachen', avgRent: '€400-€700/mo', image: '' },
  ],
  'malaysia': [
    { name: 'Kuala Lumpur', description: 'Malaysia\'s capital is a modern, dynamic city with international branch campuses, excellent shopping, dining, and a thriving tech scene.', universities: 'UM, UKM, Monash Malaysia, Nottingham Malaysia', avgRent: 'RM 1,200-RM 2,000/mo', image: '' },
    { name: 'Penang', description: 'Known as the "Pearl of the Orient", Penang offers great food, a tech manufacturing hub, and Universiti Sains Malaysia.', universities: 'USM, RCSI & UCD Malaysia', avgRent: 'RM 800-RM 1,300/mo', image: '' },
    { name: 'Johor Bahru', description: 'A rapidly growing city near Singapore, home to EduCity with branch campuses of Southampton and Newcastle.', universities: 'Newcastle Malaysia, Southampton Malaysia', avgRent: 'RM 600-RM 1,000/mo', image: '' },
    { name: 'Sarawak', description: 'Borneo\'s largest city offers unique opportunities in environmental science, biodiversity, and tropical medicine research.', universities: 'UNIMAS, Curtin Malaysia', avgRent: 'RM 500-RM 800/mo', image: '' },
  ],
};

// ─── FAQs per destination key ─────────────────────────────────────────────────

const FAQS: Record<string, Array<{ question: string; answer: string }>> = {
  'united-kingdom': [
    { question: 'How much does it cost to study in the UK?', answer: 'Tuition fees range from £10,000 to £38,000 per year depending on the university and programme. Living costs average £12,000-£15,000 per year. Cities like London are more expensive, while northern cities like Glasgow and Manchester are more affordable.' },
    { question: 'Can I work while studying in the UK?', answer: 'Yes, international students on a Student Visa can work up to 20 hours per week during term time and full-time during holidays. After graduation, the Graduate Route visa allows you to work for up to 2 years (3 years for PhDs).' },
    { question: 'What are the English language requirements?', answer: 'Most UK universities require IELTS 6.0-7.0 overall (with minimum 5.5-6.0 in each band). Some accept alternative tests like PTE Academic (score 54-65) or TOEFL iBT (72-100).' },
    { question: 'How do I apply to UK universities?', answer: 'For undergraduate programmes, apply through UCAS. For postgraduate programmes, apply directly to the university. ALO Education provides full application support, including document preparation and submission.' },
    { question: 'Is the UK a safe country for international students?', answer: 'Yes, the UK is generally very safe for international students. Universities have dedicated support services, and most cities have large international communities. Campus security is excellent.' },
    { question: 'What is the Graduate Route visa?', answer: 'The Graduate Route is a post-study work visa that allows international students who have completed a degree in the UK to stay and work (or look for work) for up to 2 years. PhD graduates can stay for 3 years.' },
    { question: 'Can I bring my family to the UK while I study?', answer: 'Yes, if you are enrolled on a postgraduate programme (master\'s or PhD) of at least 9 months, you can bring your dependants (spouse/partner and children under 18). Additional financial requirements apply.' },
    { question: 'What scholarships are available for Bangladeshi students in the UK?', answer: 'Popular options include the Chevening Scholarship, Commonwealth Scholarship, and university-specific merit awards. ALO Education helps identify and apply for relevant scholarships to reduce your costs.' },
  ],
  'usa': [
    { question: 'How much does it cost to study in the USA?', answer: 'Tuition ranges from $25,000 to $55,000+ per year for international students. Private universities tend to be more expensive than public ones. Living costs range from $10,000-$18,000 per year depending on the city.' },
    { question: 'What is the F-1 visa and how do I get it?', answer: 'The F-1 visa is the most common student visa for academic programmes. After receiving your I-20 form from your university, you apply at the US embassy with proof of funding, passport, and completed DS-160 form.' },
    { question: 'Can I work in the USA after graduation?', answer: 'Yes, through Optional Practical Training (OPT). You can work for 12 months in your field of study, and STEM graduates can extend this by 24 months for a total of 36 months.' },
    { question: 'What are the English requirements for US universities?', answer: 'Most require TOEFL iBT 80-100 or IELTS 6.5-7.5. Some also accept Duolingo English Test (105-120). Requirements vary significantly by university and programme.' },
    { question: 'Do US universities offer scholarships to international students?', answer: 'Yes, many do. Need-based aid is more common at private universities, while merit-based scholarships are available at most institutions. Some universities are "need-blind" for international students.' },
    { question: 'How do I apply to US universities?', answer: 'Apply through the Common App (undergraduate) or directly to the university (graduate). You\'ll need transcripts, recommendation letters, essays, and standardised test scores (SAT/GRE/GMAT for some programmes).' },
    { question: 'What is the difference between semester and quarter systems?', answer: 'Most US universities use the semester system (2 main terms per year), while some (like Stanford and UChicago) use the quarter system (3 main terms). This affects credit calculations and academic planning.' },
    { question: 'Can I transfer between US universities?', answer: 'Yes, the US has a flexible transfer system. Credits earned at one accredited institution can often be transferred to another, though the receiving university decides which credits to accept.' },
  ],
  'canada': [
    { question: 'How much does it cost to study in Canada?', answer: 'International tuition ranges from CA$15,000 to CA$35,000 per year. Living costs are approximately CA$10,000-CA$15,000 per year. Co-op work terms provide additional income during studies.' },
    { question: 'What is the Post-Graduation Work Permit (PGWP)?', answer: 'The PGWP allows graduates to work in Canada for up to 3 years after completing their programme. The duration depends on the length of your study programme (minimum 8 months).' },
    { question: 'Can I get permanent residency after studying in Canada?', answer: 'Yes! Canada has clear pathways from study permit to PR through Express Entry and Provincial Nominee Programs. Canadian education credentials and Canadian work experience significantly boost your CRS score.' },
    { question: 'What are the English language requirements?', answer: 'Most universities require IELTS 6.0-6.5 overall or TOEFL iBT 80-100. French-language programmes in Quebec may require TEF or TCF scores. PTE Academic is also widely accepted.' },
    { question: 'Do I need to study in French to go to university in Quebec?', answer: 'No, many Quebec universities (including McGill and Concordia) offer programmes entirely in English. Only the University of Montreal and Laval require French proficiency.' },
    { question: 'How does the Canadian university application process work?', answer: 'Applications are made directly to each university or through provincial portals (like OUAC for Ontario). Deadlines vary but are typically January-March for September intake. ALO Education manages the full process.' },
    { question: 'Is healthcare free for international students in Canada?', answer: 'Healthcare coverage varies by province. Some provinces (like Alberta and BC) cover international students under their provincial plans, while others require private health insurance.' },
    { question: 'What are the best cities for international students in Canada?', answer: 'Toronto, Vancouver, Montreal, and Waterloo are the most popular. Each offers a unique blend of academic excellence, career opportunities, and cultural experiences.' },
  ],
  'australia': [
    { question: 'How much does it cost to study in Australia?', answer: 'Tuition ranges from A$20,000 to A$45,000 per year. Living costs average A$21,041 per year (as required by the government for visa purposes), though actual costs vary by city.' },
    { question: 'What is the Subclass 500 Student Visa?', answer: 'The Subclass 500 visa allows you to study full-time in Australia for up to 5 years. You must be enrolled in a registered course, have adequate health insurance (OSHC), and meet financial requirements.' },
    { question: 'How long can I stay and work after graduating?', answer: 'Post-Study Work visa durations are: Bachelor\'s (2 years), Master\'s by coursework (2 years), Master\'s by research (3 years), PhD (4 years). Studying in regional areas can extend this by 1-2 years.' },
    { question: 'What English test scores do Australian universities require?', answer: 'Most require IELTS 6.0-7.0 overall or PTE Academic 50-65. Some accept TOEFL iBT (70-100). Foundation and pathway programmes have lower requirements.' },
    { question: 'Can I work while studying in Australia?', answer: 'Yes, you can work up to 48 hours per fortnight during term time and unlimited hours during scheduled breaks. This helps cover living expenses and provides valuable Australian work experience.' },
    { question: 'What is the GTE/GS requirement?', answer: 'The Genuine Student (GS) requirement assesses whether you genuinely intend to study in Australia. It replaced the GTE in 2024 and considers your study history, financial capacity, and immigration history.' },
    { question: 'Are there scholarships for international students in Australia?', answer: 'Yes, the Australia Awards, Endeavour Scholarships, and university-specific merit scholarships are available. Some regional universities offer significant tuition discounts.' },
    { question: 'Do I need health insurance to study in Australia?', answer: 'Yes, Overseas Student Health Cover (OSHC) is mandatory for the student visa. It covers medical and hospital expenses during your stay. ALO Education can help arrange OSHC.' },
  ],
  'ireland': [
    { question: 'How much does it cost to study in Ireland?', answer: 'Tuition ranges from €10,000 to €25,000 per year. Living costs average around €12,000 per year. Dublin is more expensive, while cities like Limerick and Galway are more affordable.' },
    { question: 'Can I work in Ireland after graduation?', answer: 'Yes, the Third Level Graduate Programme allows you to stay and work for 1 year (or 2 years for masters/PhD graduates). Many graduates transition to full employment and eventually secure permanent residency.' },
    { question: 'What English requirements do Irish universities have?', answer: 'Most require IELTS 6.0-6.5 or equivalent. Some programmes (especially in tech and business) may require higher scores. PTE Academic and TOEFL are also accepted.' },
    { question: 'Is Ireland a good place for tech careers?', answer: 'Absolutely. Ireland hosts the European HQs of Google, Meta, Apple, Microsoft, and hundreds of other tech companies. Graduates with relevant skills are in high demand.' },
    { question: 'What is the cost of living in Dublin for students?', answer: 'Expect to spend €900-€1,400 per month on rent, plus €200-€400 on food and transport. Sharing accommodation significantly reduces costs.' },
    { question: 'How long does the Irish student visa take to process?', answer: 'The Long Stay Study Visa typically takes 4-8 weeks to process. It\'s recommended to apply at least 3 months before your programme start date. ALO Education assists with the full visa process.' },
    { question: 'Can I bring dependants to Ireland on a student visa?', answer: 'For programmes longer than 1 year, you may be able to bring your spouse/partner and children. They will need to apply for a joining family member visa with proof of financial support.' },
    { question: 'What makes Ireland unique compared to the UK for studying?', answer: 'Ireland offers lower tuition fees, access to the EU job market, and a more intimate university experience. The tech industry presence in Dublin rivals London but with a lower cost of living.' },
  ],
  'new-zealand': [
    { question: 'How much does it cost to study in New Zealand?', answer: 'Tuition ranges from NZ$22,000 to NZ$35,000 per year. Living costs average around NZ$15,000 per year. New Zealand is more affordable than Australia while offering a similar quality of life.' },
    { question: 'Can I work in New Zealand after graduating?', answer: 'Yes, the Post-Study Work Visa allows you to stay for up to 3 years. You can also apply for residency through the Skilled Migrant Category if you meet the points threshold.' },
    { question: 'What English requirements do NZ universities have?', answer: 'Most require IELTS 6.0-6.5 overall with no band below 6.0. TOEFL iBT 80-90 and PTE Academic 50-58 are also widely accepted.' },
    { question: 'Is New Zealand safe for international students?', answer: 'New Zealand is one of the safest countries in the world with very low crime rates. It consistently ranks in the Global Peace Index top 5. Universities have excellent student support services.' },
    { question: 'What is the student visa process for New Zealand?', answer: 'Apply online through Immigration New Zealand. You\'ll need an offer of place, proof of funds (NZ$15,000/year + tuition), health insurance, and a return ticket or funds for one.' },
    { question: 'Can I study and work in New Zealand at the same time?', answer: 'Yes, you can work up to 20 hours per week during term time and full-time during scheduled holidays. Your visa will state the work conditions.' },
  ],
  'germany': [
    { question: 'Is university education really free in Germany?', answer: 'Yes, at most public universities, there are no tuition fees for international students — only a semester contribution of €100-€350 which often includes a public transport ticket. Some states (like Baden-Württemberg) charge €1,500/semester for non-EU students.' },
    { question: 'Do I need to know German to study in Germany?', answer: 'Not necessarily. Over 1,800 programmes are taught entirely in English, especially at master\'s level. However, learning German significantly improves your daily life and job prospects.' },
    { question: 'What is the blocked account requirement?', answer: 'Non-EU students must demonstrate financial capacity by depositing approximately €11,208 into a blocked account (Sperrkonto) before getting a visa. This money is released monthly for living expenses.' },
    { question: 'Can I stay in Germany after graduation?', answer: 'Yes, Germany offers an 18-month job seeker visa after graduation. If you find employment relevant to your degree, you can transition to a work visa and eventually permanent residency.' },
    { question: 'What English test scores are needed for English-taught programmes?', answer: 'Most require IELTS 6.0-6.5 or TOEFL iBT 80-90. Some programmes may accept PTE Academic or Cambridge English qualifications.' },
    { question: 'How do I find student accommodation in Germany?', answer: 'Studentenwerk (student services) operates dormitories at affordable rates (€200-€400/month). Private shared flats (WG) cost €300-€600/month. Apply early as housing in cities like Munich and Berlin is competitive.' },
    { question: 'What are the best subjects to study in Germany?', answer: 'Germany excels in Engineering (mechanical, automotive, electrical), Computer Science, Medicine, Natural Sciences, and Business. German engineering degrees are especially highly regarded worldwide.' },
    { question: 'Is the student visa process difficult for Germany?', answer: 'The process requires an appointment at the German embassy, proof of admission, blocked account, health insurance, and academic documents. Processing takes 4-8 weeks. ALO Education provides complete support.' },
  ],
  'malaysia': [
    { question: 'How much does it cost to study in Malaysia?', answer: 'Tuition ranges from RM 15,000 to RM 50,000 per year. Living costs are very low at approximately RM 1,500/month (US$320), including accommodation, food, and transport.' },
    { question: 'Are degrees from Malaysian universities recognised internationally?', answer: 'Yes, degrees from Malaysian public universities and international branch campuses (Monash, Nottingham, Southampton) are fully recognised globally. Malaysia\'s QA system is rigorous.' },
    { question: 'What is the Student Pass and how do I get it?', answer: 'The Student Pass is Malaysia\'s student visa. Your university applies on your behalf through EMGS (Education Malaysia Global Services). Processing takes 3-6 weeks.' },
    { question: 'Can I work while studying in Malaysia?', answer: 'Yes, international students can work up to 20 hours per week during semester breaks and full-time during holidays, with approval from the university and immigration.' },
    { question: 'What are branch campuses and are they worth it?', answer: 'Branch campuses are full campuses of foreign universities (like Monash Australia, Nottingham UK) in Malaysia. You earn the exact same degree at 40-60% of the cost, with options to transfer.' },
    { question: 'What English requirements do Malaysian universities have?', answer: 'Most require IELTS 5.0-6.5 or TOEFL iBT 60-80. Foundation programmes have lower requirements. Many programmes are taught in English.' },
    { question: 'Is Malaysia safe for international students?', answer: 'Yes, Malaysia is generally very safe. The country is politically stable, has a low crime rate in university areas, and offers a warm, welcoming culture. Universities have dedicated international student support.' },
    { question: 'Can I transfer from a Malaysian university to the UK or Australia?', answer: 'Yes, many 2+1 and 1+2 programmes allow you to start in Malaysia and complete your degree in the UK or Australia. This is an excellent way to reduce overall costs while still getting an international degree.' },
  ],
};

// ─── Cost data per destination key ───────────────────────────────────────────

const COSTS: Record<string, {
  tuition: string; accommodation: string; food: string; transport: string;
  insurance: string; visa: string; application: string; other: string;
}> = {
  'united-kingdom': {
    tuition: '£10,000 - £38,000/year', accommodation: '£5,000 - £12,000/year', food: '£2,400 - £3,600/year',
    transport: '£800 - £1,500/year', insurance: '£300 - £500/year (IHS)', visa: '£490 (Student Visa)',
    application: '£50 - £100 per university', other: '£500 - £1,000/year (books, supplies, personal)',
  },
  'usa': {
    tuition: '$25,000 - $55,000/year', accommodation: '$8,000 - $15,000/year', food: '$3,000 - $5,000/year',
    transport: '$1,000 - $2,500/year', insurance: '$2,000 - $4,000/year', visa: '$510 (F-1 Visa + SEVIS)',
    application: '$50 - $100 per university', other: '$1,000 - $2,000/year (books, supplies, personal)',
  },
  'canada': {
    tuition: 'CA$15,000 - CA$35,000/year', accommodation: 'CA$6,000 - CA$12,000/year', food: 'CA$3,000 - CA$5,000/year',
    transport: 'CA$1,200 - CA$2,000/year', insurance: 'CA$600 - CA$900/year', visa: 'CA$150 (Study Permit + biometrics)',
    application: 'CA$50 - CA$150 per university', other: 'CA$1,000 - CA$2,000/year (books, supplies, personal)',
  },
  'australia': {
    tuition: 'A$20,000 - A$45,000/year', accommodation: 'A$8,000 - A$15,000/year', food: 'A$4,000 - A$6,000/year',
    transport: 'A$1,500 - A$3,000/year', insurance: 'A$500 - A$700/year (OSHC)', visa: 'A$715 (Subclass 500)',
    application: 'A$50 - A$100 per university', other: 'A$1,500 - A$2,500/year (books, supplies, personal)',
  },
  'ireland': {
    tuition: '€10,000 - €25,000/year', accommodation: '€6,000 - €12,000/year', food: '€2,400 - €3,600/year',
    transport: '€800 - €1,500/year', insurance: '€500 - €1,000/year', visa: '€60 (Study Visa + €300 GNIB)',
    application: '€50 per university', other: '€800 - €1,500/year (books, supplies, personal)',
  },
  'new-zealand': {
    tuition: 'NZ$22,000 - NZ$35,000/year', accommodation: 'NZ$8,000 - NZ$12,000/year', food: 'NZ$3,000 - NZ$5,000/year',
    transport: 'NZ$1,000 - NZ$2,000/year', insurance: 'NZ$500 - NZ$800/year', visa: 'NZ$345 (Student Visa)',
    application: 'NZ$50 - NZ$100 per university', other: 'NZ$1,000 - NZ$2,000/year (books, supplies, personal)',
  },
  'germany': {
    tuition: '€0 - €1,500/semester', accommodation: '€3,000 - €7,000/year', food: '€2,400 - €3,600/year',
    transport: '€0 - €500/year (Semesterticket often included)', insurance: '€1,200 - €1,500/year', visa: '€75 (Student Visa + €60 residence permit)',
    application: 'Free or €50 per university', other: '€500 - €1,000/year (books, supplies, personal)',
  },
  'malaysia': {
    tuition: 'RM 15,000 - RM 50,000/year', accommodation: 'RM 4,800 - RM 9,600/year', food: 'RM 3,600 - RM 6,000/year',
    transport: 'RM 1,200 - RM 2,400/year', insurance: 'RM 500 - RM 1,000/year', visa: 'RM 500 - RM 1,500 (Student Pass via EMGS)',
    application: 'RM 200 - RM 500 per university', other: 'RM 1,500 - RM 3,000/year (books, supplies, personal)',
  },
};

// ─── Main seed function ──────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding all 8 CountryPage records with rich data...\n');

  for (const [dbSlug, destKey] of Object.entries(SLUG_MAP)) {
    const dest = DESTINATION_DATA[destKey];
    const whyStudy = WHY_STUDY[destKey];
    const cities = CITIES[destKey];
    const faqs = FAQS[destKey];
    const costs = COSTS[destKey];

    if (!dest || !whyStudy || !cities || !faqs || !costs) {
      console.error(`⚠️  Missing data for ${dbSlug} (${destKey}), skipping...`);
      continue;
    }

    const quickFacts = JSON.stringify({
      currency: dest.currency,
      language: dest.language,
      avgTuition: dest.avgTuition,
      avgLiving: dest.avgLiving,
      workHours: dest.workHours,
      intake: dest.intake,
      visaType: dest.visaType,
      topUniversities: dest.topUnis,
      costs: costs,
    });

    const result = await db.countryPage.upsert({
      where: { slug: dbSlug },
      update: {
        intro: dest.desc,
        quickFacts,
        whyStudy: JSON.stringify(whyStudy),
        cities: JSON.stringify(cities),
        faqs: JSON.stringify(faqs),
      },
      create: {
        slug: dbSlug,
        name: dest.name,
        shortName: dest.name.replace('United ', '').replace('Kingdom', 'UK').replace('States', 'US').replace('New ', 'NZ '),
        flag: dest.flag,
        capital: '',
        currency: dest.currency,
        intro: dest.desc,
        quickFacts,
        whyStudy: JSON.stringify(whyStudy),
        cities: JSON.stringify(cities),
        faqs: JSON.stringify(faqs),
      },
    });

    const wsCount = JSON.parse(result.whyStudy).length;
    const ciCount = JSON.parse(result.cities).length;
    const faCount = JSON.parse(result.faqs).length;
    console.log(`  ✅ ${dbSlug}: ${wsCount} whyStudy, ${ciCount} cities, ${faCount} FAQs updated.`);
  }

  console.log('\n✨ Country seeding complete!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => db.$disconnect());
