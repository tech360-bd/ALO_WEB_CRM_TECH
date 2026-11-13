import type { TopicAreaSeed } from './catalogue-types';

/**
 * Business topic catalogue.
 *
 * These are *categories for structured discovery*, not claims that any target
 * university supervises them. Each problem carries an explicit evidence route;
 * no statistics, authors or findings are invented here. Generated candidates
 * inherit `PROVISIONAL_UNVERIFIED` novelty status.
 */
export const BUSINESS_TOPIC_AREAS: TopicAreaSeed[] = [
  {
    code: 'BUS-AI-TRANSFORMATION',
    discipline: 'BUSINESS',
    name: 'AI adoption and organisational transformation',
    subfield: 'Information systems / organisational change',
    summary:
      'How organisations adopt, govern and reorganise around artificial intelligence, and with what consequences for work, decision-making and performance.',
    keywords: ['artificial intelligence', 'AI adoption', 'digital transformation', 'organisational change', 'governance', 'work design'],
    problems: [
      {
        id: 'adoption-gap',
        statement:
          'Organisations report AI experimentation but struggle to convert pilots into durable, governed operating practice.',
        plain:
          'Many organisations try AI tools, but few turn those trials into everyday, accountable ways of working. Why?',
        evidence:
          'Evidence route: peer-reviewed information-systems studies, official enterprise-technology adoption surveys and documented organisational case reports. No adoption statistic is asserted until retrieved.',
        question:
          'Which organisational capabilities and governance arrangements explain the transition from AI pilots to durable operational practice?',
      },
      {
        id: 'worker-agency',
        statement:
          'The introduction of AI decision support reshapes discretion, accountability and skill use among professional workers.',
        plain:
          'When AI tools advise professionals, who really decides, who is accountable, and what happens to expertise?',
        evidence:
          'Evidence route: workplace ethnographies, labour-force surveys and regulator guidance on automated decision-making.',
        question:
          'How does AI decision support redistribute discretion and accountability among professional workers?',
      },
    ],
    theories: [
      'Socio-technical systems theory',
      'Technology acceptance and use models (with stated limitations)',
      'Institutional theory and organisational legitimacy',
      'Dynamic capabilities',
    ],
    methods: ['INTERVIEWS_THEMATIC', 'CASE_STUDY', 'MIXED_METHODS', 'SURVEY_STATISTICS'],
    dataSources: 'Semi-structured interviews with adopters and non-adopters; organisational documents; technology adoption panel data; procurement records.',
    risks: 'Access to organisations may fail; self-reported adoption may be inflated; single-case findings do not generalise.',
    ethics: 'Informed consent, anonymity of employers, avoidance of commercially sensitive disclosure, data minimisation, no automated profiling of employees.',
    contributions: 'A mid-range explanation of how governance and work design mediate AI adoption outcomes, plus a validated capability framework.',
    searchStrategy:
      'Search Scopus, Web of Science, EBSCO Business Source and Google Scholar for ("artificial intelligence" OR "AI adoption") AND (governance OR "organisational change" OR "work design"), 2018–current; log queries, dates and inclusion decisions.',
  },
  {
    code: 'BUS-DIGITAL-MODELS',
    discipline: 'BUSINESS',
    name: 'Digital business models and innovation',
    subfield: 'Strategy / entrepreneurship',
    summary:
      'How digital platforms, servitisation and data-enabled business models create, capture and distribute value, including their limits.',
    keywords: ['business model', 'digital platform', 'servitisation', 'value capture', 'platform governance', 'innovation'],
    problems: [
      {
        id: 'value-capture',
        statement:
          'Firms investing in digital servitisation frequently fail to translate customer value into defensible revenue and margin.',
        plain:
          'Companies add digital services, but do they actually make sustainable money from them?',
        evidence:
          'Evidence route: firm-level financial data, documented servitisation cases and peer-reviewed business-model literature.',
        question:
          'What business-model configurations allow digital servitisation to produce defensible, sustained value capture?',
      },
      {
        id: 'platform-dependence',
        statement:
          'Small firms’ dependence on dominant digital platforms creates asymmetric exposure to changes in ranking, fees and data access.',
        plain:
          'Small businesses depend on big platforms. What happens when the platform changes the rules?',
        evidence:
          'Evidence route: platform policy archives, SME surveys and regulator market studies.',
        question:
          'How do small firms experience and respond to asymmetric platform governance, and which capabilities reduce their exposure?',
      },
    ],
    theories: ['Business model canvas and its critiques', 'Transaction cost economics', 'Resource-based view', 'Platform governance theory'],
    methods: ['CASE_STUDY', 'INTERVIEWS_THEMATIC', 'ARCHIVAL_SECONDARY', 'DESIGN_SCIENCE'],
    dataSources: 'Firm interviews; platform terms and policy change logs; company accounts; SME survey microdata if licensed.',
    risks: 'Commercial confidentiality; survivor bias; platform data access may be denied.',
    ethics: 'Anonymisation of commercially sensitive data, clear distinction between public and private data, GDPR-compliant storage.',
    contributions: 'A tested configuration model linking servitisation design choices to value capture and a platform-dependence capability account.',
    searchStrategy:
      'Search Scopus, Web of Science and EBSCO for ("business model" OR servitisation) AND (platform OR "value capture") AND (SME OR firm), plus regulatory market studies from the CMA and Ofcom where relevant.',
  },
  {
    code: 'BUS-ACCOUNTING-GOVERNANCE',
    discipline: 'BUSINESS',
    name: 'Accounting, auditing and corporate governance',
    subfield: 'Accounting / governance',
    summary:
      'How reporting, assurance and governance mechanisms shape accountability and decision quality, including in emerging and digital contexts.',
    keywords: ['audit quality', 'corporate governance', 'earnings management', 'reporting', 'disclosure', 'internal control'],
    problems: [
      {
        id: 'audit-disclosure',
        statement:
          'Changes in audit-market structure and disclosure rules alter audit quality and the informativeness of reported risks in ways that are not well understood.',
        plain:
          'Do new audit disclosure rules actually tell investors more about risk?',
        evidence:
          'Evidence route: regulator inspection reports, mandatory disclosure filings and peer-reviewed archival accounting research.',
        question:
          'How do expanded audit-risk disclosures affect information asymmetry and audit quality in listed firms?',
      },
      {
        id: 'board-capability',
        statement:
          'Board composition reforms intended to improve monitoring may have unintended effects on strategic capability and risk-taking.',
        plain:
          'Do independent boards supervise better, or just differently?',
        evidence:
          'Evidence route: governance codes, company filings, board-level panel datasets and causal-inference studies.',
        question:
          'What are the joint effects of board independence and sector expertise on monitoring quality and strategic risk-taking?',
      },
    ],
    theories: ['Agency theory', 'Stakeholder theory', 'Signalling theory', 'Institutional theory'],
    methods: ['ARCHIVAL_SECONDARY', 'ECONOMETRICS', 'LONGITUDINAL_COMPARATIVE', 'CASE_STUDY'],
    dataSources: 'Annual reports, regulatory filings, audit-inspection reports, governance databases, listed-company panel data.',
    risks: 'Data licences; endogeneity; measurement error in audit quality; regulatory changes confound time-series.',
    ethics: 'Public-interest research using public filings; no confidential client data; careful treatment of identifiable individuals in governance datasets.',
    contributions: 'Causal evidence on disclosure or board reform effects, with a clear account of mechanism and boundary conditions.',
    searchStrategy:
      'Search Web of Science, Scopus and SSRN for (audit quality OR "key audit matters") AND (disclosure OR governance), plus FRC/FRC-equivalent inspection reports and official company registers.',
  },
  {
    code: 'BUS-FINANCE-FINTECH',
    discipline: 'BUSINESS',
    name: 'Finance, fintech, financial inclusion and risk',
    subfield: 'Finance / financial services',
    summary:
      'How digital finance changes access, pricing, risk and consumer protection, with attention to exclusion and regulatory arbitrage.',
    keywords: ['fintech', 'financial inclusion', 'credit risk', 'mobile money', 'consumer credit', 'regulation'],
    problems: [
      {
        id: 'inclusion-paradox',
        statement:
          'Digital financial services can widen access while simultaneously creating new forms of exclusion and vulnerability.',
        plain:
          'Mobile finance reaches more people, but who is left behind or put at risk?',
        evidence:
          'Evidence route: household surveys, regulator financial-inclusion reports and peer-reviewed empirical finance research.',
        question:
          'Under what conditions do digital finance products improve financial inclusion without increasing exploitative debt or exclusion?',
      },
      {
        id: 'algorithmic-credit',
        statement:
          'Algorithmic credit scoring changes the distribution of credit and the transparency of refusal in ways that are difficult for consumers to contest.',
        plain:
          'When software decides loans, how can borrowers understand or challenge the decision?',
        evidence:
          'Evidence route: regulatory decisions, credit-market data and explainability studies; subject to data-protection constraints.',
        question:
          'How do algorithmic credit-scoring practices affect access, pricing and contestability for under-served borrowers?',
      },
    ],
    theories: ['Information asymmetry', 'Behavioural finance', 'Financial exclusion and capability frameworks', 'Regulatory theory'],
    methods: ['ECONOMETRICS', 'ARCHIVAL_SECONDARY', 'SURVEY_STATISTICS', 'EXPERIMENT_BEHAVIOURAL'],
    dataSources: 'Regulator statistical releases, credit-reference microdata (licensed), household surveys, product-level rate data.',
    risks: 'Microdata access and cost; fairness and privacy constraints; fast-moving regulation.',
    ethics: 'No re-identification of borrowers; statistical disclosure control; approval from data owners; transparent handling of protected characteristics.',
    contributions: 'Empirical evidence separating inclusion benefits from harm, plus an assessable contestability framework for digital credit.',
    searchStrategy:
      'Search Scopus, Web of Science, RePEc and SSRN for (fintech OR "digital credit") AND ("financial inclusion" OR "credit risk"), plus FCA/Bank of England/World Bank official statistics.',
  },
  {
    code: 'BUS-MARKETING-CONSUMER',
    discipline: 'BUSINESS',
    name: 'Marketing, consumer behaviour and digital marketing',
    subfield: 'Marketing',
    summary:
      'How digital channels, personalisation and social proof shape consumer attention, trust and welfare.',
    keywords: ['consumer behaviour', 'digital marketing', 'personalisation', 'trust', 'social media', 'vulnerability'],
    problems: [
      {
        id: 'personalisation-trust',
        statement:
          'Personalisation improves relevance but can reduce trust when consumers perceive surveillance or manipulation.',
        plain:
          'Smart ads can feel helpful or creepy. Where is the line, and what happens to trust?',
        evidence:
          'Evidence route: experimental consumer studies, platform ad-transparency archives and consumer-protection enforcement records.',
        question:
          'How do personalisation intensity and transparency cues jointly affect consumer trust and engagement?',
      },
      {
        id: 'influencer-disclosure',
        statement:
          'Influencer marketing disclosure rules are inconsistently applied, leaving consumers unable to identify paid persuasion.',
        plain:
          'Sponsored content is not always obvious. Do current disclosure practices protect consumers?',
        evidence:
          'Evidence route: content audits, regulator rulings and experimental disclosure studies.',
        question:
          'How effective are disclosure formats at enabling consumers to recognise and evaluate influencer persuasion?',
      },
    ],
    theories: ['Persuasion knowledge model', 'Privacy calculus', 'Social exchange theory', 'Service-dominant logic'],
    methods: ['EXPERIMENT_BEHAVIOURAL', 'SURVEY_STATISTICS', 'ARCHIVAL_SECONDARY', 'MIXED_METHODS'],
    dataSources: 'Online experiments, survey panels, public ad libraries, regulator enforcement notices, content samples.',
    risks: 'Panel quality; demand effects; platform access changes; ethical sensitivity of deception in experiments.',
    ethics: 'Informed consent, debriefing, no vulnerable-participant targeting without safeguards, adherence to advertising and data-protection rules.',
    contributions: 'A causal account of how transparency design changes persuasion knowledge and trust, with practical disclosure guidance.',
    searchStrategy:
      'Search Scopus and Web of Science for (personalisation OR "influencer marketing") AND (trust OR disclosure OR persuasion), plus ASA rulings and platform ad-library documentation.',
  },
  {
    code: 'BUS-HRM-WELLBEING',
    discipline: 'BUSINESS',
    name: 'Human resource management, leadership and employee wellbeing',
    subfield: 'HRM / organisational behaviour',
    summary:
      'How work design, management practice and digital monitoring affect wellbeing, retention and performance.',
    keywords: ['employee wellbeing', 'leadership', 'work design', 'hybrid work', 'algorithmic management', 'retention'],
    problems: [
      {
        id: 'hybrid-boundaries',
        statement:
          'Hybrid work has blurred temporal and spatial boundaries in ways that affect recovery, inclusion and career progression unevenly.',
        plain:
          'Working from home and office at different times helps some people and disadvantages others. How?',
        evidence:
          'Evidence route: longitudinal employee surveys, organisational HR records (with consent) and peer-reviewed work-design studies.',
        question:
          'How do hybrid-work arrangements affect psychological detachment, inclusion and progression, and for whom?',
      },
      {
        id: 'algorithmic-management',
        statement:
          'Algorithmic management of frontline work can improve coordination while intensifying control and eroding employee voice.',
        plain:
          'Software that schedules and rates workers may be efficient, but what does it do to workers’ say and wellbeing?',
        evidence:
          'Evidence route: workplace studies, union/regulator reports and platform-worker surveys.',
        question:
          'What forms of algorithmic management preserve worker voice and wellbeing without undermining operational coordination?',
      },
    ],
    theories: ['Job demands–resources model', 'Psychological contract', 'Self-determination theory', 'Labour process theory'],
    methods: ['SURVEY_STATISTICS', 'INTERVIEWS_THEMATIC', 'LONGITUDINAL_COMPARATIVE', 'MIXED_METHODS'],
    dataSources: 'Multi-wave employee surveys, HR and scheduling records under data-sharing agreements, interviews with workers and managers.',
    risks: 'Employer gatekeeping; common-method bias; attrition; power asymmetry in access.',
    ethics: 'Voluntary participation independent of line management, anonymity in small teams, no performance data that could identify individuals, ethics approval.',
    contributions: 'Evidence on which work-design and management choices protect wellbeing while sustaining performance, with practical safeguards.',
    searchStrategy:
      'Search PsycINFO, Scopus and Web of Science for ("hybrid work" OR "algorithmic management") AND (wellbeing OR voice OR retention), plus official labour-market and health-and-safety guidance.',
  },
  {
    code: 'BUS-ENTREPRENEURSHIP-SME',
    discipline: 'BUSINESS',
    name: 'Entrepreneurship, SMEs and international business',
    subfield: 'Entrepreneurship / SME',
    summary:
      'How new ventures and SMEs access resources, internationalise and survive under uncertainty, including in emerging economies.',
    keywords: ['entrepreneurship', 'SME', 'internationalisation', 'finance', 'resilience', 'networks'],
    problems: [
      {
        id: 'sme-finance-gap',
        statement:
          'Productive SMEs face persistent finance gaps that are not fully explained by credit risk and that constrain growth and resilience.',
        plain:
          'Good small firms still struggle to get finance. Is it risk, information, or how lenders are organised?',
        evidence:
          'Evidence route: official SME finance surveys, lender data and peer-reviewed SME finance studies.',
        question:
          'Which information and institutional mechanisms explain persistent finance gaps for productive SMEs?',
      },
      {
        id: 'internationalisation-readiness',
        statement:
          'Digital channels lower the cost of international market entry but create new capability and compliance requirements for small firms.',
        plain:
          'Selling abroad online is easier to start but harder to do well. Which capabilities matter?',
        evidence:
          'Evidence route: firm-level export data, trade-support programme records and case evidence.',
        question:
          'Which capabilities and support arrangements enable small firms to sustain digital internationalisation rather than merely start it?',
      },
    ],
    theories: ['Resource-based view', 'Effectuation', 'Institutional voids', 'Internationalisation process theory'],
    methods: ['SURVEY_STATISTICS', 'CASE_STUDY', 'ECONOMETRICS', 'MIXED_METHODS'],
    dataSources: 'SME surveys, company registries, lender programme data, trade-support records, interviews.',
    risks: 'SME survey access and response rates; survival bias; owner-manager time constraints.',
    ethics: 'Commercial confidentiality, informed consent, careful handling of financial vulnerability, secure retention.',
    contributions: 'A tested explanation of the mechanisms sustaining (or blocking) SME growth and internationalisation, with policy relevance.',
    searchStrategy:
      'Search Scopus, Web of Science and EBSCO for (SME OR entrepreneurship) AND ("finance gap" OR internationalisation), plus official SME statistics and development-bank enterprise surveys.',
  },
  {
    code: 'BUS-INTERNATIONAL-MANAGEMENT',
    discipline: 'BUSINESS',
    name: 'International management and strategy',
    subfield: 'International business',
    summary:
      'How multinationals and globally distributed teams coordinate, govern and legitimise activity across institutional contexts.',
    keywords: ['multinational', 'subsidiary', 'global strategy', 'institutional distance', 'deglobalisation', 'governance'],
    problems: [
      {
        id: 'subsidiary-autonomy',
        statement:
          'Tensions between global integration and local responsiveness are reshaping subsidiary autonomy under geopolitical and sustainability pressures.',
        plain:
          'Multinationals must standardise and adapt at the same time. How do local units negotiate that?',
        evidence:
          'Evidence route: subsidiary-level survey data, corporate disclosures and comparative case studies.',
        question:
          'How do geopolitical and sustainability pressures reconfigure subsidiary autonomy and mandate in multinational firms?',
      },
      {
        id: 'global-team-coordination',
        statement:
          'Globally distributed teams rely on digital coordination that can reproduce or mitigate institutional and linguistic asymmetries.',
        plain:
          'Remote global teams can include or exclude people depending on how they coordinate. What makes the difference?',
        evidence:
          'Evidence route: team-level observational studies, communication-log research under consent and interview evidence.',
        question:
          'Which coordination practices reduce participation asymmetries in globally distributed teams?',
      },
    ],
    theories: ['Integration–responsiveness framework', 'Institutional theory', 'Resource dependence', 'Practice theory'],
    methods: ['CASE_STUDY', 'INTERVIEWS_THEMATIC', 'SURVEY_STATISTICS', 'LONGITUDINAL_COMPARATIVE'],
    dataSources: 'Comparative firm cases, manager interviews, subsidiary survey data, public corporate filings.',
    risks: 'Access across countries; language barriers; confidential strategy data; comparative validity.',
    ethics: 'Cross-border data transfer compliance, anonymisation, consent across languages, attention to power in interviews.',
    contributions: 'A context-sensitive account of how firms reconcile integration and local legitimacy under new pressures.',
    searchStrategy:
      'Search Scopus and Web of Science for (multinational OR subsidiary) AND (autonomy OR "institutional distance"), plus official trade and investment statistics for context.',
  },
  {
    code: 'BUS-SUPPLY-CHAIN',
    discipline: 'BUSINESS',
    name: 'Supply chain management and operations',
    subfield: 'Operations / supply chain',
    summary:
      'How supply networks build resilience, transparency and sustainability under disruption and regulatory pressure.',
    keywords: ['supply chain resilience', 'visibility', 'supplier risk', 'logistics', 'traceability', 'operations'],
    problems: [
      {
        id: 'visibility-resilience',
        statement:
          'Firms invest in supply-chain visibility but often lack the capability to act on what they see during compound disruptions.',
        plain:
          'Knowing where goods are is not the same as being able to respond when things go wrong. What is missing?',
        evidence:
          'Evidence route: operations survey data, firm disclosures, disruption case records and peer-reviewed modelling studies.',
        question:
          'Which visibility and decision-making capabilities convert supply-chain information into effective disruption response?',
      },
      {
        id: 'traceability-incentives',
        statement:
          'Supplier traceability requirements can improve transparency while imposing disproportionate costs on smaller suppliers.',
        plain:
          'Supply-chain tracking rules may help consumers but hurt small suppliers. How should they be designed?',
        evidence:
          'Evidence route: regulatory requirements, supplier surveys, audit records and documented compliance cases.',
        question:
          'How should traceability requirements be designed to improve transparency without excluding capable smaller suppliers?',
      },
    ],
    theories: ['Dynamic capabilities', 'Transaction cost economics', 'Stakeholder theory', 'Complex adaptive systems'],
    methods: ['SURVEY_STATISTICS', 'MIXED_METHODS', 'CASE_STUDY', 'RELIABILITY_OPTIMISATION'],
    dataSources: 'Procurement and shipment records under agreement, supplier surveys, public compliance data, interviews.',
    risks: 'Commercial sensitivity; incomplete shipment data; supplier survey fatigue.',
    ethics: 'Confidentiality, supplier consent, no exposure of commercially sensitive pricing, secure data handling.',
    contributions: 'A capability model for disruption response and evidence-based traceability design principles.',
    searchStrategy:
      'Search Scopus and Web of Science for ("supply chain resilience" OR traceability) AND (visibility OR supplier), plus official customs, trade and regulatory data.',
  },
  {
    code: 'BUS-ESG-SUSTAINABILITY',
    discipline: 'BUSINESS',
    name: 'ESG, sustainability and responsible business',
    subfield: 'Sustainability / business ethics',
    summary:
      'How firms measure, govern and communicate environmental and social performance, and where those practices fall short.',
    keywords: ['ESG', 'sustainability reporting', 'greenwashing', 'responsible business', 'assurance', 'transition'],
    problems: [
      {
        id: 'esg-assurance',
        statement:
          'ESG ratings and sustainability assurance vary enough that stakeholders cannot reliably compare firms’ performance.',
        plain:
          'Two agencies can score the same company differently. What does that mean for accountability?',
        evidence:
          'Evidence route: rating-methodology documents, academic concordance studies and regulator consultations.',
        question:
          'What drives divergence between ESG ratings and assurance practices, and with what consequences for accountability?',
      },
      {
        id: 'transition-capability',
        statement:
          'Decarbonisation commitments frequently lack the operational and financial capabilities required to deliver them.',
        plain:
          'Companies promise net zero. Do they have the capability to deliver?',
        evidence:
          'Evidence route: disclosed transition plans, capital-expenditure data and independent progress assessments.',
        question:
          'Which organisational and financial capabilities distinguish credible decarbonisation commitments from symbolic ones?',
      },
    ],
    theories: ['Legitimacy theory', 'Stakeholder theory', 'Institutional isomorphism', 'Resource-based view'],
    methods: ['ARCHIVAL_SECONDARY', 'MIXED_METHODS', 'CASE_STUDY', 'ECONOMETRICS'],
    dataSources: 'Sustainability reports, CDP/regulatory disclosures, ratings datasets, transition plans, interviews.',
    risks: 'Data comparability; rating licensing; selection bias; fast-changing disclosure rules.',
    ethics: 'Distinguish public commitments from confidential plans, avoid defamatory inference, transparent scoring rules.',
    contributions: 'Evidence on credibility mechanisms and a framework for evaluating transition capability.',
    searchStrategy:
      'Search Scopus and Web of Science for ("ESG rating" OR "sustainability assurance" OR "transition plan") AND (credibility OR governance), plus official disclosure regulations.',
  },
  {
    code: 'BUS-ANALYTICS-DECISION',
    discipline: 'BUSINESS',
    name: 'Business analytics and decision sciences',
    subfield: 'Decision sciences / analytics',
    summary:
      'How data, models and decision-support systems improve or distort managerial judgement, including under uncertainty.',
    keywords: ['business analytics', 'decision support', 'forecasting', 'uncertainty', 'behavioural operations', 'data quality'],
    problems: [
      {
        id: 'model-reliance',
        statement:
          'Managers over- or under-rely on analytical models depending on how uncertainty and provenance are communicated.',
        plain:
          'Dashboards can be trusted too much or ignored. What presentation helps people judge properly?',
        evidence:
          'Evidence route: controlled decision experiments, field studies of analytics adoption and model-governance guidance.',
        question:
          'How does the representation of uncertainty and data provenance affect managerial reliance on analytics?',
      },
      {
        id: 'data-quality-decisions',
        statement:
          'Unmeasured data-quality degradation produces confident but wrong operational decisions.',
        plain:
          'Bad data can look clean. How do organisations detect it before decisions go wrong?',
        evidence:
          'Evidence route: data-quality audits, operations case studies and simulation of decision rules.',
        question:
          'Which practical indicators allow organisations to detect decision-relevant data-quality degradation early?',
      },
    ],
    theories: ['Behavioural decision theory', 'Naturalistic decision making', 'Organisational information processing', 'Decision quality frameworks'],
    methods: ['EXPERIMENT_BEHAVIOURAL', 'DESIGN_SCIENCE', 'SURVEY_STATISTICS', 'NUMERICAL_SIMULATION'],
    dataSources: 'Decision experiments, anonymised operational datasets, model outputs, manager interviews.',
    risks: 'Experimental artificiality; access to operational data; model validation constraints.',
    ethics: 'Anonymisation, transparency about simulated conditions, GDPR-compliant experimental data, no deceptive practices without debrief.',
    contributions: 'Evidence on uncertainty communication and a validated early-warning approach to data-quality decay.',
    searchStrategy:
      'Search Scopus and Web of Science for ("decision support" OR analytics) AND (uncertainty OR "data quality") AND (manager OR judgement), plus professional-body guidance on model risk.',
  },
  {
    code: 'BUS-INNOVATION-PRODUCTIVITY',
    discipline: 'BUSINESS',
    name: 'Innovation, productivity and technology management',
    subfield: 'Innovation management',
    summary:
      'How firms and regions convert research, technology and organisational change into productivity and inclusive growth.',
    keywords: ['innovation', 'productivity', 'technology management', 'R&D', 'absorptive capacity', 'diffusion'],
    problems: [
      {
        id: 'diffusion-gap',
        statement:
          'The UK productivity gap is partly associated with slow diffusion of proven management and technology practices across firms.',
        plain:
          'Good practices exist, but many firms do not adopt them. Why, and what helps?',
        evidence:
          'Evidence route: official productivity statistics, firm-level adoption surveys and peer-reviewed diffusion research. The “UK productivity gap” is a framing to be evidenced, not assumed.',
        question:
          'Which mechanisms accelerate the adoption of proven productivity practices among lagging firms?',
      },
      {
        id: 'r-and-d-absorptive',
        statement:
          'Public R&D support may increase spending without building the absorptive capacity needed to commercialise knowledge.',
        plain:
          'Funding research does not automatically turn into useful innovation. Which capabilities are missing?',
        evidence:
          'Evidence route: innovation survey microdata, programme evaluations and firm case evidence.',
        question:
          'How do publicly supported R&D programmes affect absorptive capacity and subsequent innovation outcomes?',
      },
    ],
    theories: ['Absorptive capacity', 'National innovation systems', 'Technology diffusions curves', 'Dynamic capabilities'],
    methods: ['ECONOMETRICS', 'SURVEY_STATISTICS', 'CASE_STUDY', 'LONGITUDINAL_COMPARATIVE'],
    dataSources: 'Innovation surveys, programme administrative data, firm accounts, interviews with adopters and intermediaries.',
    risks: 'Attribution and selection bias; data access; lag between innovation and productivity outcomes.',
    ethics: 'Confidential firm data, statistical disclosure control, transparent handling of programme records.',
    contributions: 'Causal or mechanism-level evidence on diffusion support and absorptive capacity, with policy implications.',
    searchStrategy:
      'Search Scopus, Web of Science and RePEc for (productivity OR innovation) AND (diffusion OR "absorptive capacity"), plus ONS and Innovate UK official publications.',
  },
];
