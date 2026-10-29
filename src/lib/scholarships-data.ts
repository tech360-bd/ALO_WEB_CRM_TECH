export interface ScholarshipRecord {
  id: string;
  slug: string;
  title: string;
  provider: string;
  country: string;
  countryCode: string;
  flag: string;
  awardAmount: string;
  coverageType: 'Full Funding' | 'Partial Tuition' | 'Stipend + Travel' | '100% Tuition Waiver';
  eligibleLevels: string[];
  minGpa: string;
  ieltsRequirement: string;
  deadline: string;
  intakes: string[];
  description: string;
  howToApply: string;
  whenToApply: string;
  whatIsCovered: string[];
  uniqueBenefits: string[];
  workExperienceRequirement: string;
  homeCountryReturnRule: string;
  eligibilityCriteria: string[];
  coveredExpenses: string[];
  applicationSteps: string[];
  officialUrl: string;
  featured: boolean;
}

export function slugifyScholarship(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const MASTER_SCHOLARSHIPS_DATA: ScholarshipRecord[] = [
  {
    id: "sch-uk-01",
    slug: "chevening-scholarship-uk",
    title: "Chevening UK Government Scholarship",
    provider: "UK Foreign, Commonwealth & Development Office (FCDO)",
    country: "United Kingdom",
    countryCode: "UK",
    flag: "🇬🇧",
    awardAmount: "100% Fully Funded (Tuition + Living £1,347/mo + Airfare)",
    coverageType: "Full Funding",
    eligibleLevels: ["Master's (1 Year)"],
    minGpa: "Bachelor CGPA 3.0 / 4.0 or Upper Second-Class Honours",
    ieltsRequirement: "IELTS 6.5 (Min 6.0 each component)",
    deadline: "November 3, 2026",
    intakes: ["September 2027"],
    description: "Chevening is the UK government's flagship global scholarship program. It offers full financial support for a 1-year Master's degree at any top UK university for future leaders and decision-makers.",
    howToApply: "Apply online through the Chevening portal. Submit 4 leadership essays, choose 3 UK university choices, and provide 2 reference letters.",
    whenToApply: "Applications open in August annually and close in early November. Shortlisting occurs in January/February; interviews take place in Dhaka between March and May; final results are announced in June.",
    whatIsCovered: [
      "100% Full University Tuition Fees (No cap for standard courses).",
      "Monthly Living Stipend (£1,347/mo inner London, £1,095/mo outer London).",
      "Return economy flight tickets from Bangladesh to the UK.",
      "Arrival & Departure travel allowances.",
      "Cost of UK Student Visa application & Tuberculosis (TB) test clearance."
    ],
    uniqueBenefits: [
      "Access to exclusive Chevening global alumni network of 55,000+ leaders.",
      "Study at any accredited UK university of your choice.",
      "Full leadership development workshops and networking events at UK Parliament.",
      "No restriction on university subject selection (any field of study allowed)."
    ],
    workExperienceRequirement: "Minimum 2 years (2,800 hours) of full-time or part-time work experience.",
    homeCountryReturnRule: "Must return to Bangladesh for at least 2 years post-graduation.",
    eligibilityCriteria: [
      "Citizen of an eligible Chevening country (Bangladesh included).",
      "Return to Bangladesh for a minimum of two years after award ends.",
      "Hold an undergraduate degree that enables entry to a UK Master's program.",
      "Have at least 2 years (2,800 hours) of work experience.",
      "Apply to 3 eligible UK university courses and receive an unconditional offer."
    ],
    coveredExpenses: [
      "Full university tuition fees.",
      "Monthly living allowance (£1,347/mo London, £1,095/mo non-London).",
      "Return economy flight tickets from Dhaka to London.",
      "Arrival and departure travel grants.",
      "UK Student Visa & TB test fees covered."
    ],
    applicationSteps: [
      "Step 1: Register on the Chevening online application portal.",
      "Step 2: Select 3 eligible UK Master's courses.",
      "Step 3: Write & submit 4 essays (Leadership, Networking, Study in UK, Career Plan).",
      "Step 4: Upload academic transcripts, degree certificates, and 2 references.",
      "Step 5: Attend interview at British High Commission Dhaka if shortlisted."
    ],
    officialUrl: "https://www.chevening.org/apply/",
    featured: true
  },
  {
    id: "sch-uk-02",
    slug: "commonwealth-master-scholarship-uk",
    title: "Commonwealth Master's Scholarship UK",
    provider: "Commonwealth Scholarship Commission (CSC) UK",
    country: "United Kingdom",
    countryCode: "UK",
    flag: "🇬🇧",
    awardAmount: "100% Fully Funded (Tuition + £1,347/mo Stipend + Flights)",
    coverageType: "Full Funding",
    eligibleLevels: ["Master's (1 Year)"],
    minGpa: "First Class Bachelor's Degree (CGPA 3.5+ / 4.0)",
    ieltsRequirement: "IELTS 6.5 - 7.0 overall",
    deadline: "October 17, 2026",
    intakes: ["September 2027"],
    description: "Commonwealth Scholarships are funded by the UK FCDO for high-achieving students from Commonwealth countries who could not otherwise afford to study in the UK.",
    howToApply: "Apply online via the CSC application system and submit through an approved nominating agency in Bangladesh (UGC / Ministry of Education) or eligible university route.",
    whenToApply: "Applications open in September and close in October/November. Nominations sent in December; awards confirmed by April/May for September intake.",
    whatIsCovered: [
      "Approved full university tuition fees.",
      "Stipend (living allowance) of £1,347 per month (£1,652/mo in London).",
      "Return airfare from Bangladesh to UK.",
      "Warm clothing allowance & study travel grant.",
      "Thesis grant toward preparing a dissertation."
    ],
    uniqueBenefits: [
      "Direct focus on Sustainable Development Goals (SDGs).",
      "Covers specialized science, technology, healthcare, and engineering fields.",
      "Full family allowances for eligible scholars with dependents."
    ],
    workExperienceRequirement: "Work experience encouraged; strong development impact statement required.",
    homeCountryReturnRule: "Must return to Bangladesh post-scholarship.",
    eligibilityCriteria: [
      "Citizen or permanent resident of Bangladesh.",
      "Hold a 1st Class or 2:1 Honours Bachelor's Degree.",
      "Demonstrate financial need (unable to study in UK without scholarship).",
      "Provide detailed Development Impact statement."
    ],
    coveredExpenses: [
      "Full tuition fees.",
      "Monthly stipend of £1,347 per month.",
      "Return air travel.",
      "Study travel grant and warm clothing allowance."
    ],
    applicationSteps: [
      "Step 1: Apply online via CSC portal.",
      "Step 2: Submit Development Impact Essay focusing on Bangladesh SDGs.",
      "Step 3: Obtain endorsement from Bangladeshi nominating body.",
      "Step 4: Receive formal award letter from CSC UK."
    ],
    officialUrl: "https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/",
    featured: true
  },
  {
    id: "sch-usa-01",
    slug: "fulbright-foreign-student-program-usa",
    title: "Fulbright Foreign Student Program USA",
    provider: "US Department of State / US Embassy Dhaka",
    country: "United States",
    countryCode: "USA",
    flag: "🇺🇸",
    awardAmount: "Fully Funded (Full Tuition, Monthly Living Stipend, Health & Airfare)",
    coverageType: "Full Funding",
    eligibleLevels: ["Master's (1-2 Years)"],
    minGpa: "Bachelor CGPA 3.2+ / 4.0",
    ieltsRequirement: "TOEFL iBT 80+ / IELTS 6.5+",
    deadline: "June 1, 2027",
    intakes: ["August 2028"],
    description: "The Fulbright Program is the flagship international educational exchange program sponsored by the US government, enabling outstanding graduate students from Bangladesh to study at top US universities.",
    howToApply: "Apply online via the US Embassy Dhaka Fulbright application portal. Submit GRE/TOEFL scores, 3 recommendation letters, and a statement of purpose.",
    whenToApply: "Applications open in February and close in May/June. Shortlisting and panel interviews take place in July/August; university placement occurs from September to March.",
    whatIsCovered: [
      "Full tuition and mandatory university fees.",
      "Monthly living stipend tailored to host US city.",
      "Health and accident insurance (ASPE).",
      "Round-trip airfare ticket from Dhaka to USA.",
      "Pre-academic orientation program in the USA."
    ],
    uniqueBenefits: [
      "Study at elite Ivy League and top research US universities.",
      "J-1 Exchange Visitor Visa status with enrichment seminars across America.",
      "Lifetime membership in the global Fulbright Alumni Association."
    ],
    workExperienceRequirement: "Minimum 2 years of full-time professional experience.",
    homeCountryReturnRule: "2-Year Home-Country Physical Presence requirement (J-1 Visa).",
    eligibilityCriteria: [
      "Bangladeshi citizen residing in Bangladesh.",
      "Completed 4-year Bachelor's degree from recognized university.",
      "Minimum 2 years of professional work experience.",
      "Commitment to return to Bangladesh upon graduation."
    ],
    coveredExpenses: [
      "Full tuition fees.",
      "Monthly living stipend.",
      "ASPE Health Benefits Plan.",
      "Round-trip international flight."
    ],
    applicationSteps: [
      "Step 1: Submit online application on US Embassy portal.",
      "Step 2: Upload 3 recommendation letters and transcripts.",
      "Step 3: Write Personal Statement and Study Objectives.",
      "Step 4: Attend interview at American Center Dhaka if shortlisted."
    ],
    officialUrl: "https://bd.usembassy.gov/education-culture/fulbright-programs/",
    featured: true
  },
  {
    id: "sch-au-01",
    slug: "australia-awards-scholarships",
    title: "Australia Awards Scholarships",
    provider: "Australian Department of Foreign Affairs and Trade (DFAT)",
    country: "Australia",
    countryCode: "AU",
    flag: "🇦🇺",
    awardAmount: "100% Fully Funded (Tuition, AUD $30,000/yr Stipend, OSHC, Flights)",
    coverageType: "Full Funding",
    eligibleLevels: ["Master's (1-2 Years)"],
    minGpa: "Bachelor CGPA 3.0+ / 4.0",
    ieltsRequirement: "IELTS 6.5 (Min 6.0 each band)",
    deadline: "April 30, 2027",
    intakes: ["February 2028"],
    description: "Australia Awards Scholarships provide opportunities for Bangladeshi citizens to undertake full-time Master's study at participating Australian universities.",
    howToApply: "Apply online via the OASIS portal. Submit Development Impact plan aligned with Bangladesh national priority sectors.",
    whenToApply: "Applications open in February and close April 30. Shortlisting in May/June; interviews in Dhaka in July; awards issued August for February intake.",
    whatIsCovered: [
      "Full university tuition fees.",
      "Return economy airfare from Dhaka to Australia.",
      "Establishment allowance (AUD $3,000 single payment).",
      "Contribution to Living Expenses (CLE) paid fortnightly.",
      "Overseas Student Health Cover (OSHC)."
    ],
    uniqueBenefits: [
      "Introductory Academic Program (IAP) prior to formal studies.",
      "Supplementary Academic Support to ensure academic success.",
      "Fieldwork funding for eligible research Master's students."
    ],
    workExperienceRequirement: "Minimum 2 years of post-graduation work experience in relevant sector.",
    homeCountryReturnRule: "Must return to Bangladesh for at least 2 years post-award.",
    eligibilityCriteria: [
      "Citizen of Bangladesh.",
      "Minimum 2 years relevant work experience.",
      "Not be serving military personnel.",
      "Commitment to return to Bangladesh post-graduation."
    ],
    coveredExpenses: [
      "Full tuition fees.",
      "Fortnightly living stipend.",
      "OSHC Health Cover.",
      "Return economy flight."
    ],
    applicationSteps: [
      "Step 1: Register on OASIS online portal.",
      "Step 2: Submit Bangladesh priority sector essay.",
      "Step 3: Upload certified transcripts, IELTS score, and employer endorsement.",
      "Step 4: Interview at Australian High Commission Dhaka."
    ],
    officialUrl: "https://www.dfat.gov.au/people-to-people/australia-awards",
    featured: true
  },
  {
    id: "sch-de-01",
    slug: "daad-epos-scholarship-germany",
    title: "DAAD EPOS Development Scholarships Germany",
    provider: "German Academic Exchange Service (DAAD)",
    country: "Germany",
    countryCode: "DE",
    flag: "🇩🇪",
    awardAmount: "Fully Funded (€934/mo Stipend, Health Insurance, Travel Grant)",
    coverageType: "Full Funding",
    eligibleLevels: ["Master's (12-24 Months)"],
    minGpa: "Bachelor CGPA 3.0+ / 4.0",
    ieltsRequirement: "IELTS 6.0 - 6.5 / German B2 (if German-taught)",
    deadline: "September - November annually",
    intakes: ["October 2027"],
    description: "DAAD EPOS supports foreign graduates from developing countries to pursue Master's degrees at state-recognized German universities.",
    howToApply: "Apply directly to the chosen German university Master's program attaching the DAAD scholarship form and Europass CV.",
    whenToApply: "Deadlines range between August and November depending on university course. Selection made by DAAD committee by February/March.",
    whatIsCovered: [
      "Monthly stipend of €934 for Master's candidates.",
      "Full health, accident, and personal liability insurance coverage.",
      "International travel allowance from Bangladesh to Germany.",
      "Annual study and research subsidy."
    ],
    uniqueBenefits: [
      "Tuition-free education at public German universities.",
      "Free 6-month intensive German language course prior to academic degree.",
      "Subsidized housing and family allowances for qualifying scholars."
    ],
    workExperienceRequirement: "At least 2 years of professional experience post-Bachelor's degree.",
    homeCountryReturnRule: "Targeted at development professionals returning to home country.",
    eligibilityCriteria: [
      "Works for public or private organization in Bangladesh.",
      "Holds 4-year Bachelor's degree.",
      "At least 2 years post-graduation professional work experience.",
      "Academic degree completed within last 6 years."
    ],
    coveredExpenses: [
      "Monthly living stipend (€934/month).",
      "German health & liability insurance.",
      "Travel flight grant.",
      "German language course fees."
    ],
    applicationSteps: [
      "Step 1: Choose eligible EPOS course at German university.",
      "Step 2: Submit DAAD application form directly to university admissions.",
      "Step 3: Attach Europass CV, SOP, and employer reference letter.",
      "Step 4: Receive DAAD award letter upon selection."
    ],
    officialUrl: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    featured: true
  },
  {
    id: "sch-ie-01",
    slug: "ireland-fellows-programme-asia",
    title: "Ireland Fellows Programme — South Asia",
    provider: "Government of Ireland / Irish Aid",
    country: "Ireland",
    countryCode: "IE",
    flag: "🇮🇪",
    awardAmount: "100% Fully Funded (Tuition, €15,000/yr Stipend, Flight & Visa)",
    coverageType: "Full Funding",
    eligibleLevels: ["Master's (1 Year)"],
    minGpa: "Bachelor CGPA 3.0+ / 4.0",
    ieltsRequirement: "IELTS 6.5 (Min 6.0 each band)",
    deadline: "July 28, 2027",
    intakes: ["September 2028"],
    description: "The Ireland Fellows Programme supports early to mid-career professionals from Bangladesh to undertake a fully funded 1-year Master's program in Ireland.",
    howToApply: "Submit Stage 1 preliminary application via Irish Aid portal. Stage 2 requires detailed transcripts, essays, and employer recommendations.",
    whenToApply: "Applications open in June and close in July. Shortlisted candidates sit English test in September and interviews in October.",
    whatIsCovered: [
      "Full university tuition fees for 1-year Master's degree.",
      "Monthly living stipend (€1,200/month).",
      "Return economy flight tickets from Dhaka to Dublin.",
      "Visa application fee waiver and health insurance."
    ],
    uniqueBenefits: [
      "Study in English-speaking EU headquarters hub (Google, Meta, Pfizer).",
      "Full orientation in Dublin with global fellow cohort.",
      "Direct exposure to Irish sustainable innovation."
    ],
    workExperienceRequirement: "2-3 years' substantial work experience in relevant sector.",
    homeCountryReturnRule: "Must return to Bangladesh post-graduation.",
    eligibilityCriteria: [
      "Bangladeshi resident national.",
      "2-3 years relevant work experience.",
      "Bachelor's degree with high academic standing.",
      "No prior Master's degree."
    ],
    coveredExpenses: [
      "Full tuition fees.",
      "Monthly stipend (€1,200/mo).",
      "Return flight tickets.",
      "Visa & Health insurance."
    ],
    applicationSteps: [
      "Step 1: Submit Stage 1 form on Irish Aid site.",
      "Step 2: Complete Stage 2 full application if selected.",
      "Step 3: Complete IELTS and attend embassy interview."
    ],
    officialUrl: "https://www.irishaidfellowships.ie/",
    featured: true
  },
  {
    id: "sch-nz-01",
    slug: "manaaki-new-zealand-scholarship",
    title: "Manaaki New Zealand Government Scholarship",
    provider: "New Zealand Ministry of Foreign Affairs and Trade (MFAT)",
    country: "New Zealand",
    countryCode: "NZ",
    flag: "🇳🇿",
    awardAmount: "100% Fully Funded (Tuition + NZD $531/wk Stipend + OSHC + Flights)",
    coverageType: "Full Funding",
    eligibleLevels: ["Postgraduate Diploma", "Master's", "PhD"],
    minGpa: "Bachelor CGPA 3.0+ / 4.0",
    ieltsRequirement: "IELTS 6.5 (Min 6.0 each band)",
    deadline: "February 28, 2027",
    intakes: ["February 2028"],
    description: "Manaaki New Zealand Scholarships build sustainable development partnerships by funding full tertiary study for Bangladeshi scholars at top New Zealand universities.",
    howToApply: "Complete online eligibility check on Manaaki NZ portal and submit online application with personal essays and study plan.",
    whenToApply: "Applications open in February and close late February. Selection tests occur March/April; interviews in June; awards confirmed August.",
    whatIsCovered: [
      "Full tuition fees.",
      "Living allowance (NZD $531 per week).",
      "Establishment allowance (NZD $3,000 one-off).",
      "Medical and travel insurance.",
      "Return economy air travel."
    ],
    uniqueBenefits: [
      "Study at universities ranked in global top 3%.",
      "Research focus on Climate Change, Renewable Energy, Agriculture, and Disaster Management.",
      "Full support for doctoral thesis expenses."
    ],
    workExperienceRequirement: "1-2 years relevant work experience.",
    homeCountryReturnRule: "Must return to Bangladesh for 2 years post-scholarship.",
    eligibilityCriteria: [
      "Citizen of Bangladesh aged 18 or older.",
      "1-2 years relevant work experience.",
      "Commitment to return home post-study."
    ],
    coveredExpenses: [
      "Full tuition fees.",
      "Weekly stipend (NZD $531/wk).",
      "Establishment grant.",
      "Return flights."
    ],
    applicationSteps: [
      "Step 1: Check eligibility on Manaaki NZ portal.",
      "Step 2: Submit online application with study objectives.",
      "Step 3: Complete psychometric test and interview."
    ],
    officialUrl: "https://www.nzscholarships.govt.nz/",
    featured: true
  },
  {
    id: "sch-alo-01",
    slug: "alo-south-asia-merit-grant",
    title: "ALO Education South Asia Merit Grant",
    provider: "ALO Education Partner Universities Network",
    country: "Global (UK, USA, Canada, Australia)",
    countryCode: "GLOBAL",
    flag: "🌐",
    awardAmount: "£1,000 to £5,000 Tuition Fee Reduction",
    coverageType: "Partial Tuition",
    eligibleLevels: ["Foundation", "Bachelor's", "Master's", "MBA"],
    minGpa: "GPA 3.0+ / 5.0 (HSC) or CGPA 2.75+ / 4.0 (Bachelor's)",
    ieltsRequirement: "IELTS 6.0+ / PTE 54+ / Duolingo 105+",
    deadline: "Rolling / Open year-round",
    intakes: ["September 2026", "January 2027", "May 2027"],
    description: "Exclusive partial tuition grants negotiated directly by ALO Education with over 150 partner universities in the UK, USA, Australia, and Canada for eligible Bangladeshi students.",
    howToApply: "Apply through ALO Education portal. Your counselor will automatically evaluate your academic transcripts and claim scholarship endorsement upon university offer issuance.",
    whenToApply: "Open year-round with rolling university admission intakes (September, January, May).",
    whatIsCovered: [
      "Direct tuition fee reduction (£1,000 - £5,000) credited to university fee invoice.",
      "Automatic application fee waivers at partner universities.",
      "Free visa file processing and SOP editing support by ALO team."
    ],
    uniqueBenefits: [
      "No separate essay or long scholarship application required.",
      "Guaranteed evaluation for all Bangladeshi students applying via ALO.",
      "Can be combined with early bird tuition deposit discounts."
    ],
    workExperienceRequirement: "No work experience required for undergraduate; work exp helpful for Master's.",
    homeCountryReturnRule: "No return home requirement (Students eligible for Post-Study Work Visas).",
    eligibilityCriteria: [
      "Apply through ALO Education authorized counseling portal.",
      "Meet minimum academic admission requirements of host university.",
      "Submit complete application before university priority deadline."
    ],
    coveredExpenses: [
      "Tuition fee discount (£1,000 - £5,000).",
      "Application fee waiver.",
      "Free SOP & visa counseling."
    ],
    applicationSteps: [
      "Step 1: Request consultation with ALO counselor.",
      "Step 2: Upload academic transcripts to ALO portal.",
      "Step 3: Receive offer letter with automatic scholarship discount."
    ],
    officialUrl: "https://aloeducation.com/scholarships",
    featured: true
  }
];

export function getAllScholarships(): ScholarshipRecord[] {
  return MASTER_SCHOLARSHIPS_DATA;
}

export function getScholarshipBySlug(slug: string): ScholarshipRecord | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().trim();
  return MASTER_SCHOLARSHIPS_DATA.find((s) => s.slug === clean || slugifyScholarship(s.title) === clean);
}
