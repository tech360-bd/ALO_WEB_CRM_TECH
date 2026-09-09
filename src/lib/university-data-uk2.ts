export interface UniData {
  name: string;
  city: string;
  worldRanking: number;
  founded: number;
  type: string;
  ieltsMin: number;
  tuitionRange: string;
  intlStudents: string;
  totalStudents: string;
  scholarships: boolean;
  featured: boolean;
  website: string;
  subjects: string[];
  campuses?: string[];
  country?: string;
}

export const ukUniversitiesPart2: UniData[] = [
  // ==========================================
  // UK UNIVERSITIES PART 2 (#81–#162)
  // ==========================================

  // 81 — NOTE: Anglia Ruskin also appears in Part1 (pos 68). This is the canonical Welsh/regional entry.
  {
    name: "Cardiff University",
    city: "Cardiff",
    worldRanking: 154,
    founded: 1883,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£21,950-£32,450",
    intlStudents: "30%",
    totalStudents: "34,000",
    scholarships: true,
    featured: false,
    website: "https://www.cardiff.ac.uk",
    campuses: ["Cathays Park Campus", "Heath Park Medical Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Engineering", "Computer Science", "Law",
      "Architecture", "Biology", "Media & Communications",
      "Psychology", "Welsh Studies", "Pharmacology",
      "Biomedical Sciences", "History", "Chemistry",
      "Mathematics", "Politics", "Journalism"
    ],
  },

  // 82
  {
    name: "Cardiff Metropolitan University",
    city: "Cardiff",
    worldRanking: 801,
    founded: 1865,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,500-£16,000",
    intlStudents: "18%",
    totalStudents: "11,000",
    scholarships: true,
    featured: false,
    website: "https://www.cardiffmet.ac.uk",
    campuses: ["Llandaff Campus", "Howard Gardens Campus", "Cyncoed Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Art & Design", "Sports Science",
      "Hospitality & Tourism", "Education", "Computer Science",
      "Nursing", "Engineering", "Architecture"
    ],
  },

  // 83
  {
    name: "Swansea University",
    city: "Swansea",
    worldRanking: 298,
    founded: 1920,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£18,200-£26,000",
    intlStudents: "24%",
    totalStudents: "22,000",
    scholarships: true,
    featured: false,
    website: "https://www.swansea.ac.uk",
    campuses: ["Singleton Park Campus", "Bay Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Medicine", "Law",
      "Environmental Science", "Biology", "Chemistry",
      "Geography", "History", "Mathematics", "Psychology",
      "Sports Science", "Welsh Studies", "Business & Management"
    ],
  },

  // 84
  {
    name: "University of South Wales",
    city: "Pontypridd",
    worldRanking: 801,
    founded: 2013,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,500-£16,000",
    intlStudents: "15%",
    totalStudents: "30,000",
    scholarships: true,
    featured: false,
    website: "https://www.southwales.ac.uk",
    campuses: ["Treforest Campus", "Cardiff Campus", "Newport City Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management",
      "Nursing", "Media & Communications", "Law",
      "Art & Design", "Social Work", "Education"
    ],
  },

  // 85
  {
    name: "Bangor University",
    city: "Bangor",
    worldRanking: 641,
    founded: 1884,
    type: "Traditional",
    ieltsMin: 6.0,
    tuitionRange: "£15,500-£18,500",
    intlStudents: "18%",
    totalStudents: "11,000",
    scholarships: true,
    featured: false,
    website: "https://www.bangor.ac.uk",
    campuses: ["Bangor Main Campus", "Menai Campus"],
    country: "United Kingdom",
    subjects: [
      "Environmental Science", "Psychology", "Biology", "Law",
      "Music", "Computer Science", "Education", "Welsh Studies",
      "Ocean Science", "Business & Management"
    ],
  },

  // 86
  {
    name: "Aberystwyth University",
    city: "Aberystwyth",
    worldRanking: 701,
    founded: 1872,
    type: "Traditional",
    ieltsMin: 6.0,
    tuitionRange: "£15,800-£18,000",
    intlStudents: "14%",
    totalStudents: "8,000",
    scholarships: true,
    featured: false,
    website: "https://www.aber.ac.uk",
    campuses: ["Penglais Campus", "Agricultural Campus Aberystwyth"],
    country: "United Kingdom",
    subjects: [
      "Environmental Science", "Biology", "Computer Science", "Law",
      "Political Science", "History", "English Literature",
      "International Politics", "Welsh Studies", "Business & Management"
    ],
  },

  // 87
  {
    name: "Wrexham Glyndŵr University",
    city: "Wrexham",
    worldRanking: 0,
    founded: 2008,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£12,500-£15,000",
    intlStudents: "10%",
    totalStudents: "6,500",
    scholarships: true,
    featured: false,
    website: "https://www.glyndwr.ac.uk",
    campuses: ["Wrexham Campus", "St Asaph Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management",
      "Nursing", "Art & Design", "Sports Science", "Education"
    ],
  },

  // 88
  {
    name: "University of the West of Scotland",
    city: "Paisley",
    worldRanking: 701,
    founded: 1897,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,000-£16,500",
    intlStudents: "16%",
    totalStudents: "17,000",
    scholarships: true,
    featured: false,
    website: "https://www.uws.ac.uk",
    campuses: ["Paisley Campus", "Ayr Campus", "Dumfries Campus", "Hamilton Campus", "London Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management",
      "Nursing", "Media & Communications", "Law",
      "Social Work", "Education", "Sciences"
    ],
  },

  // 89
  {
    name: "Edinburgh Napier University",
    city: "Edinburgh",
    worldRanking: 581,
    founded: 1964,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,700-£19,500",
    intlStudents: "28%",
    totalStudents: "15,000",
    scholarships: true,
    featured: false,
    website: "https://www.napier.ac.uk",
    campuses: ["Craiglockhart Campus", "Sighthill Campus", "Merchiston Campus"],
    country: "United Kingdom",
    subjects: [
      "Computer Science", "Engineering", "Business & Management",
      "Nursing", "Art & Design", "Media & Communications",
      "Law", "Computing", "Environment"
    ],
  },

  // 90
  {
    name: "Glasgow Caledonian University",
    city: "Glasgow",
    worldRanking: 601,
    founded: 1875,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£18,000",
    intlStudents: "18%",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.gcu.ac.uk",
    campuses: ["Glasgow Campus", "London Campus", "New York Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Nursing", "Computer Science",
      "Law", "Sociology", "Public Health", "Fashion"
    ],
  },

  // 91
  {
    name: "University of the Highlands and Islands",
    city: "Inverness",
    worldRanking: 0,
    founded: 2011,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£12,500-£15,000",
    intlStudents: "8%",
    totalStudents: "7,500",
    scholarships: true,
    featured: false,
    website: "https://www.uhi.ac.uk",
    campuses: ["Inverness Campus", "Sabhal Mòr Ostaig (Gaelic)", "Perth College", "Orkney College"],
    country: "United Kingdom",
    subjects: [
      "Environmental Science", "Biology", "Nursing", "History",
      "Music", "Hospitality & Tourism", "Education"
    ],
  },

  // 92
  {
    name: "Queen's University Belfast",
    city: "Belfast",
    worldRanking: 194,
    founded: 1845,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£19,800-£26,000",
    intlStudents: "24%",
    totalStudents: "25,000",
    scholarships: true,
    featured: false,
    website: "https://www.qub.ac.uk",
    campuses: ["Belfast City Campus", "Institute of Clinical Science"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Engineering", "Law", "Computer Science",
      "Biology", "Chemistry", "Physics", "Education",
      "Psychology", "Politics", "History", "Architecture",
      "Business & Management", "Pharmacology"
    ],
  },

  // 93
  {
    name: "Ulster University",
    city: "Belfast",
    worldRanking: 531,
    founded: 1968,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,400-£19,200",
    intlStudents: "20%",
    totalStudents: "27,000",
    scholarships: true,
    featured: false,
    website: "https://www.ulster.ac.uk",
    campuses: ["Belfast Campus", "Jordanstown Campus", "Coleraine Campus", "Magee Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management",
      "Nursing", "Art & Design", "Law",
      "Psychology", "Social Work", "Education"
    ],
  },

  // 94
  {
    name: "Birkbeck University of London",
    city: "London",
    worldRanking: 741,
    founded: 1823,
    type: "Specialized",
    ieltsMin: 6.5,
    tuitionRange: "£16,200-£21,500",
    intlStudents: "22%",
    totalStudents: "17,000",
    scholarships: true,
    featured: false,
    website: "https://www.bbk.ac.uk",
    campuses: ["Malet Street Campus London"],
    country: "United Kingdom",
    subjects: [
      "Law", "Business & Management", "Computer Science",
      "Psychology", "History", "English Literature",
      "Social Sciences", "Philosophy", "Economics"
    ],
  },

  // 95
  {
    name: "University College Birmingham",
    city: "Birmingham",
    worldRanking: 801,
    founded: 1957,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,500-£16,000",
    intlStudents: "15%",
    totalStudents: "7,500",
    scholarships: true,
    featured: false,
    website: "https://www.ucb.ac.uk",
    campuses: ["Birmingham City Centre Campus", "Summer Row Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Hospitality & Tourism", "Nursing",
      "Education", "Sports Science", "Art & Design", "Food Science"
    ],
  },

  // 96 — Note: Birmingham City University also appears as #73 in Part 1
  {
    name: "Royal Academy of Music",
    city: "London",
    worldRanking: 0,
    founded: 1822,
    type: "Specialized",
    ieltsMin: 6.0,
    tuitionRange: "£22,500-£32,000",
    intlStudents: "45%",
    totalStudents: "900",
    scholarships: true,
    featured: false,
    website: "https://www.ram.ac.uk",
    campuses: ["Marylebone Road Campus London"],
    country: "United Kingdom",
    subjects: [
      "Classical Performance", "Composition", "Conducting",
      "Opera Studies", "Jazz Studies"
    ],
  },

  // 97
  {
    name: "Royal College of Music",
    city: "London",
    worldRanking: 0,
    founded: 1882,
    type: "Specialized",
    ieltsMin: 6.5,
    tuitionRange: "£24,000-£35,000",
    intlStudents: "50%",
    totalStudents: "900",
    scholarships: true,
    featured: false,
    website: "https://www.rcm.ac.uk",
    campuses: ["Prince Consort Road Campus London"],
    country: "United Kingdom",
    subjects: [
      "Instrumental Performance", "Vocal Studies", "Composition",
      "Conducting", "Music Theory & Musicology"
    ],
  },

  // 98
  {
    name: "Royal Central School of Speech and Drama",
    city: "London",
    worldRanking: 0,
    founded: 1906,
    type: "Specialized",
    ieltsMin: 7.0,
    tuitionRange: "£22,000-£28,000",
    intlStudents: "20%",
    totalStudents: "1,200",
    scholarships: true,
    featured: false,
    website: "https://www.cssd.ac.uk",
    campuses: ["Swiss Cottage Campus London"],
    country: "United Kingdom",
    subjects: [
      "Acting & Performance", "Drama & Theatre Studies",
      "Stage Design", "Theatre Directing", "Voice Studies"
    ],
  },

  // 99
  {
    name: "Courtauld Institute of Art",
    city: "London",
    worldRanking: 0,
    founded: 1932,
    type: "Specialized",
    ieltsMin: 7.0,
    tuitionRange: "£25,000-£30,000",
    intlStudents: "35%",
    totalStudents: "600",
    scholarships: false,
    featured: false,
    website: "https://courtauld.ac.uk",
    campuses: ["Somerset House Campus London"],
    country: "United Kingdom",
    subjects: [
      "History of Art", "Art Conservation & Restoration",
      "Curatorship & Museum Studies", "Arts Management"
    ],
  },

  // 100
  {
    name: "St George's University of London",
    city: "London",
    worldRanking: 0,
    founded: 1733,
    type: "Specialized",
    ieltsMin: 7.0,
    tuitionRange: "£40,000-£48,000",
    intlStudents: "22%",
    totalStudents: "5,500",
    scholarships: true,
    featured: false,
    website: "https://www.sgul.ac.uk",
    campuses: ["Tooting Campus London"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Biomedical Sciences", "Nursing",
      "Pharmacy", "Healthcare Sciences", "Physiotherapy"
    ],
  },

  // 101
  {
    name: "University of the Arts London",
    city: "London",
    worldRanking: 0,
    founded: 1986,
    type: "Specialized",
    ieltsMin: 6.0,
    tuitionRange: "£18,500-£25,000",
    intlStudents: "35%",
    totalStudents: "19,000",
    scholarships: true,
    featured: false,
    website: "https://www.arts.ac.uk",
    campuses: ["London College of Fashion", "London College of Communication", "Central Saint Martins", "Camberwell College of Arts", "Chelsea College of Arts", "Wimbledon College of Arts"],
    country: "United Kingdom",
    subjects: [
      "Fashion Design", "Graphic Design", "Film & Photography",
      "Fine Art", "Advertising & PR", "Architecture"
    ],
  },

  // 102
  {
    name: "London School of Hygiene & Tropical Medicine",
    city: "London",
    worldRanking: 0,
    founded: 1899,
    type: "Specialized",
    ieltsMin: 7.0,
    tuitionRange: "£24,000-£35,000",
    intlStudents: "55%",
    totalStudents: "4,000",
    scholarships: true,
    featured: false,
    website: "https://www.lshtm.ac.uk",
    campuses: ["Keppel Street Campus London"],
    country: "United Kingdom",
    subjects: [
      "Public Health", "Tropical Medicine", "Epidemiology",
      "Global Health Policy", "Environmental Health"
    ],
  },

  // 103
  {
    name: "Royal Veterinary College",
    city: "London",
    worldRanking: 0,
    founded: 1791,
    type: "Specialized",
    ieltsMin: 7.0,
    tuitionRange: "£32,000-£44,000",
    intlStudents: "18%",
    totalStudents: "3,500",
    scholarships: true,
    featured: false,
    website: "https://www.rvc.ac.uk",
    campuses: ["Camden Town Campus", "Hawkshead Campus Hertfordshire"],
    country: "United Kingdom",
    subjects: [
      "Veterinary Medicine", "Veterinary Nursing",
      "Biological Sciences", "Bioveterinary Sciences"
    ],
  },

  // 104
  {
    name: "Cranfield University",
    city: "Cranfield",
    worldRanking: 319,
    founded: 1946,
    type: "Postgraduate",
    ieltsMin: 6.5,
    tuitionRange: "£22,000-£35,000",
    intlStudents: "45%",
    totalStudents: "5,000",
    scholarships: true,
    featured: false,
    website: "https://www.cranfield.ac.uk",
    campuses: ["Cranfield Campus Bedfordshire", "Shrivenham Campus"],
    country: "United Kingdom",
    subjects: [
      "Aerospace Engineering", "Automotive Engineering", "Data Science",
      "Environmental Science", "Business & Management",
      "Manufacturing Engineering", "Defence Technology"
    ],
  },

  // 105
  {
    name: "University of Buckingham",
    city: "Buckingham",
    worldRanking: 0,
    founded: 1976,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£14,500-£18,500",
    intlStudents: "30%",
    totalStudents: "3,300",
    scholarships: true,
    featured: false,
    website: "https://www.buckingham.ac.uk",
    campuses: ["Buckingham Main Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Law", "Computer Science",
      "Psychology", "English Literature", "History"
    ],
  },

  // 106
  {
    name: "St Mary's University Twickenham",
    city: "London",
    worldRanking: 0,
    founded: 1850,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,500-£16,000",
    intlStudents: "10%",
    totalStudents: "6,000",
    scholarships: true,
    featured: false,
    website: "https://www.stmarys.ac.uk",
    campuses: ["Twickenham Campus London"],
    country: "United Kingdom",
    subjects: [
      "Education", "Sports Science", "Business & Management",
      "History", "Media & Communications", "Nursing"
    ],
  },

  // 107
  {
    name: "Bishop Grosseteste University",
    city: "Lincoln",
    worldRanking: 0,
    founded: 1862,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£12,500-£14,500",
    intlStudents: "5%",
    totalStudents: "2,500",
    scholarships: true,
    featured: false,
    website: "https://www.bishopg.ac.uk",
    campuses: ["Lincoln Main Campus"],
    country: "United Kingdom",
    subjects: [
      "Education", "History", "English Literature",
      "Psychology", "Business & Management", "Sports Science"
    ],
  },

  // 108
  {
    name: "University of Cumbria",
    city: "Carlisle",
    worldRanking: 0,
    founded: 2007,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£12,500-£15,000",
    intlStudents: "6%",
    totalStudents: "10,000",
    scholarships: true,
    featured: false,
    website: "https://www.cumbria.ac.uk",
    campuses: ["Carlisle Fusehill Campus", "Lancaster Campus", "London Campus"],
    country: "United Kingdom",
    subjects: [
      "Nursing", "Education", "Environmental Science",
      "Business & Management", "Sports Science", "Psychology"
    ],
  },

  // 109
  {
    name: "University of Bolton",
    city: "Bolton",
    worldRanking: 801,
    founded: 2004,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£12,500-£15,000",
    intlStudents: "14%",
    totalStudents: "11,000",
    scholarships: true,
    featured: false,
    website: "https://www.bolton.ac.uk",
    campuses: ["Bolton Main Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management",
      "Nursing", "Law", "Psychology"
    ],
  },

  // 110
  {
    name: "University of Bradford",
    city: "Bradford",
    worldRanking: 581,
    founded: 1966,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£16,000-£22,000",
    intlStudents: "28%",
    totalStudents: "13,000",
    scholarships: true,
    featured: false,
    website: "https://www.bradford.ac.uk",
    campuses: ["Bradford City Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management",
      "Chemistry", "Biology", "Nursing", "History",
      "Psychology", "Pharmacy", "Social Work"
    ],
  },

  // 111
  {
    name: "Leeds Trinity University",
    city: "Leeds",
    worldRanking: 0,
    founded: 1966,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£12,500-£14,500",
    intlStudents: "6%",
    totalStudents: "3,000",
    scholarships: true,
    featured: false,
    website: "https://www.leedstrinity.ac.uk",
    campuses: ["Horsforth Campus Leeds"],
    country: "United Kingdom",
    subjects: [
      "Education", "Business & Management", "Psychology",
      "History", "English Literature", "Media & Communications"
    ],
  },

  // 112
  {
    name: "York St John University",
    city: "York",
    worldRanking: 0,
    founded: 1841,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,000-£15,500",
    intlStudents: "10%",
    totalStudents: "7,000",
    scholarships: true,
    featured: false,
    website: "https://www.yorksj.ac.uk",
    campuses: ["York Campus", "London Campus"],
    country: "United Kingdom",
    subjects: [
      "Education", "Business & Management", "Psychology",
      "English Literature", "History", "Media & Communications"
    ],
  },

  // 113
  {
    name: "Liverpool John Moores University",
    city: "Liverpool",
    worldRanking: 581,
    founded: 1823,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£19,500",
    intlStudents: "18%",
    totalStudents: "22,000",
    scholarships: true,
    featured: false,
    website: "https://www.ljmu.ac.uk",
    campuses: ["City Campus Liverpool", "Byrom Street Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Medicine", "Business & Management",
      "Law", "Sports Science", "Media & Communications",
      "Architecture", "Education", "Nursing"
    ],
  },

  // 114
  {
    name: "Liverpool Hope University",
    city: "Liverpool",
    worldRanking: 0,
    founded: 1844,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£12,500-£15,000",
    intlStudents: "8%",
    totalStudents: "5,500",
    scholarships: true,
    featured: false,
    website: "https://www.hope.ac.uk",
    campuses: ["Hope Park Campus", "Creative Campus"],
    country: "United Kingdom",
    subjects: [
      "Education", "Psychology", "Business & Management",
      "English Literature", "History", "Sports Science"
    ],
  },

  // 115
  {
    name: "Edge Hill University",
    city: "Ormskirk",
    worldRanking: 741,
    founded: 1885,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,500-£16,000",
    intlStudents: "8%",
    totalStudents: "10,000",
    scholarships: true,
    featured: false,
    website: "https://www.edgehill.ac.uk",
    campuses: ["Ormskirk Main Campus"],
    country: "United Kingdom",
    subjects: [
      "Education", "Nursing", "Business & Management",
      "Psychology", "Computer Science", "Media & Communications"
    ],
  },

  // 116
  {
    name: "Newman University",
    city: "Birmingham",
    worldRanking: 0,
    founded: 1968,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£12,500-£14,500",
    intlStudents: "5%",
    totalStudents: "3,000",
    scholarships: true,
    featured: false,
    website: "https://newman.ac.uk",
    campuses: ["Bartley Green Campus Birmingham"],
    country: "United Kingdom",
    subjects: [
      "Education", "Psychology", "Sports Science",
      "Business & Management", "History", "Social Work"
    ],
  },

  // 117
  {
    name: "University Academy 92",
    city: "Manchester",
    worldRanking: 0,
    founded: 2017,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,500-£16,000",
    intlStudents: "15%",
    totalStudents: "2,000",
    scholarships: true,
    featured: false,
    website: "https://www.ua92.ac.uk",
    campuses: ["Old Trafford Campus Manchester"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computer Science", "Media & Communications",
      "Sports Science", "Psychology", "Data Science"
    ],
  },

  // 118
  {
    name: "Arden University",
    city: "Coventry",
    worldRanking: 0,
    founded: 2015,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£9,500-£13,000",
    intlStudents: "40%",
    totalStudents: "8,000",
    scholarships: true,
    featured: false,
    website: "https://arden.ac.uk",
    campuses: ["Coventry HQ", "Birmingham Campus", "Manchester Campus", "London Campus", "Leeds Campus", "Bristol Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computer Science", "Psychology",
      "Law", "Data Science", "Finance & Accounting"
    ],
  },

  // 119
  {
    name: "BPP University",
    city: "London",
    worldRanking: 0,
    founded: 1976,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£10,000-£16,500",
    intlStudents: "45%",
    totalStudents: "15,000",
    scholarships: true,
    featured: false,
    website: "https://www.bpp.ac.uk",
    campuses: ["London Campus", "Birmingham Campus", "Manchester Campus", "Leeds Campus", "Bristol Campus", "Liverpool Campus"],
    country: "United Kingdom",
    subjects: [
      "Law", "Business & Management", "Finance & Accounting",
      "Nursing", "Psychology", "Data Science"
    ],
  },

  // 120
  {
    name: "London South Bank University",
    city: "London",
    worldRanking: 801,
    founded: 1892,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,500-£17,500",
    intlStudents: "18%",
    totalStudents: "17,000",
    scholarships: true,
    featured: false,
    website: "https://www.lsbu.ac.uk",
    campuses: ["Borough Road Campus", "Southwark Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Business & Management", "Nursing", "Law",
      "Computer Science", "Architecture", "Social Work", "Psychology"
    ],
  },

  // 121
  {
    name: "Richmond University",
    city: "London",
    worldRanking: 0,
    founded: 1972,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£17,500-£22,000",
    intlStudents: "60%",
    totalStudents: "1,500",
    scholarships: true,
    featured: false,
    website: "https://www.richmond.ac.uk",
    campuses: ["Richmond Campus London", "Kensington Campus London"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "International Relations",
      "Political Science", "Art & Design", "Media & Communications"
    ],
  },

  // 122
  {
    name: "Hult International Business School",
    city: "London",
    worldRanking: 0,
    founded: 1964,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£27,000-£42,000",
    intlStudents: "80%",
    totalStudents: "3,500",
    scholarships: true,
    featured: false,
    website: "https://www.hult.edu",
    campuses: ["London Campus", "Boston Campus", "San Francisco Campus", "Dubai Campus", "Shanghai Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Finance & Accounting",
      "International Business", "Data Science", "Global Marketing"
    ],
  },

  // 123
  {
    name: "London School of Business and Finance",
    city: "London",
    worldRanking: 0,
    founded: 2003,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£8,000-£14,000",
    intlStudents: "70%",
    totalStudents: "10,000",
    scholarships: false,
    featured: false,
    website: "https://www.lsbf.org.uk",
    campuses: ["London City Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Finance & Accounting",
      "Data Science", "International Business"
    ],
  },

  // 124
  {
    name: "London School of Commerce",
    city: "London",
    worldRanking: 0,
    founded: 1999,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£7,500-£12,000",
    intlStudents: "85%",
    totalStudents: "4,000",
    scholarships: false,
    featured: false,
    website: "https://www.lsc.ac.uk",
    campuses: ["London City Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Finance & Accounting",
      "Computer Science", "International Relations"
    ],
  },

  // 125
  {
    name: "University of Sunderland",
    city: "Sunderland",
    worldRanking: 701,
    founded: 1901,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,000-£16,000",
    intlStudents: "22%",
    totalStudents: "17,000",
    scholarships: true,
    featured: false,
    website: "https://www.sunderland.ac.uk",
    campuses: ["Sir Tom Cowie Campus", "City Campus Sunderland", "London Campus"],
    country: "United Kingdom",
    subjects: [
      "Computer Science", "Engineering", "Business & Management",
      "Nursing", "Media & Communications", "Hospitality & Tourism",
      "Law", "Education"
    ],
  },

  // 126
  {
    name: "Institute of Cancer Research",
    city: "London",
    worldRanking: 0,
    founded: 1909,
    type: "Specialized",
    ieltsMin: 7.0,
    tuitionRange: "£28,000-£38,000",
    intlStudents: "40%",
    totalStudents: "500",
    scholarships: true,
    featured: false,
    website: "https://www.icr.ac.uk",
    campuses: ["Chelsea Campus London", "Sutton Campus Surrey"],
    country: "United Kingdom",
    subjects: [
      "Oncology Research", "Biochemistry & Molecular Biology",
      "Cancer Informatics", "Clinical Research"
    ],
  },

  // 127
  {
    name: "University of Chichester",
    city: "Chichester",
    worldRanking: 0,
    founded: 1839,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,000-£15,500",
    intlStudents: "8%",
    totalStudents: "5,500",
    scholarships: true,
    featured: false,
    website: "https://www.chi.ac.uk",
    campuses: ["Chichester Campus", "Bognor Regis Campus"],
    country: "United Kingdom",
    subjects: [
      "Sports Science", "Education", "Music",
      "Art & Design", "Business & Management", "Psychology"
    ],
  },

  // 128
  {
    name: "Plymouth Marjon University",
    city: "Plymouth",
    worldRanking: 0,
    founded: 1840,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,000-£15,500",
    intlStudents: "7%",
    totalStudents: "4,500",
    scholarships: true,
    featured: false,
    website: "https://www.marjon.ac.uk",
    campuses: ["Derriford Campus Plymouth"],
    country: "United Kingdom",
    subjects: [
      "Education", "Sports Science", "Business & Management",
      "Psychology", "Media & Communications", "Nursing"
    ],
  },

  // 129
  {
    name: "Falmouth University",
    city: "Falmouth",
    worldRanking: 0,
    founded: 1902,
    type: "Specialized",
    ieltsMin: 6.0,
    tuitionRange: "£16,500-£20,000",
    intlStudents: "18%",
    totalStudents: "5,500",
    scholarships: true,
    featured: false,
    website: "https://www.falmouth.ac.uk",
    campuses: ["Falmouth Campus", "Penryn Campus"],
    country: "United Kingdom",
    subjects: [
      "Fine Art", "Digital Media", "Graphic Design",
      "Film & Television", "Architecture", "Animation"
    ],
  },

  // 130
  {
    name: "University of Wales Trinity Saint David",
    city: "Carmarthen",
    worldRanking: 0,
    founded: 1822,
    type: "Traditional",
    ieltsMin: 6.0,
    tuitionRange: "£13,000-£16,000",
    intlStudents: "10%",
    totalStudents: "8,500",
    scholarships: true,
    featured: false,
    website: "https://www.uwtsd.ac.uk",
    campuses: ["Carmarthen Campus", "Swansea Campus", "Cardiff Metropolitan School Centres"],
    country: "United Kingdom",
    subjects: [
      "Education", "Art & Design", "Business & Management",
      "History", "Environmental Science", "Architecture"
    ],
  },

  // 131
  {
    name: "University of Law – Birmingham",
    city: "Birmingham",
    worldRanking: 0,
    founded: 2018,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£9,500-£14,000",
    intlStudents: "30%",
    totalStudents: "2,500",
    scholarships: false,
    featured: false,
    website: "https://www.law.ac.uk",
    campuses: ["Birmingham Campus"],
    country: "United Kingdom",
    subjects: [
      "LLB Law", "LLM Legal Practice", "SQE Preparation",
      "Business & Corporate Law"
    ],
  },

  // 132
  {
    name: "University of Law – Manchester",
    city: "Manchester",
    worldRanking: 0,
    founded: 2019,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£9,500-£14,000",
    intlStudents: "28%",
    totalStudents: "2,000",
    scholarships: false,
    featured: false,
    website: "https://www.law.ac.uk",
    campuses: ["Manchester Campus"],
    country: "United Kingdom",
    subjects: [
      "LLB Law", "LLM Legal Practice", "SQE Preparation",
      "Criminal Law"
    ],
  },

  // 133
  {
    name: "University of Law – Bristol",
    city: "Bristol",
    worldRanking: 0,
    founded: 2020,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£9,500-£14,000",
    intlStudents: "25%",
    totalStudents: "1,800",
    scholarships: false,
    featured: false,
    website: "https://www.law.ac.uk",
    campuses: ["Bristol Campus"],
    country: "United Kingdom",
    subjects: [
      "LLB Law", "LLM Legal Practice", "International Business Law",
      "Finance & Commercial Law"
    ],
  },

  // 134
  {
    name: "University of Law – Leeds",
    city: "Leeds",
    worldRanking: 0,
    founded: 2021,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£9,500-£14,000",
    intlStudents: "22%",
    totalStudents: "1,500",
    scholarships: false,
    featured: false,
    website: "https://www.law.ac.uk",
    campuses: ["Leeds Campus"],
    country: "United Kingdom",
    subjects: [
      "LLB Law", "LLM Legal Practice", "Employment Law",
      "Criminal Justice Studies"
    ],
  },

  // 135
  {
    name: "University of Law – Liverpool",
    city: "Liverpool",
    worldRanking: 0,
    founded: 2022,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£9,500-£14,000",
    intlStudents: "20%",
    totalStudents: "1,200",
    scholarships: false,
    featured: false,
    website: "https://www.law.ac.uk",
    campuses: ["Liverpool Campus"],
    country: "United Kingdom",
    subjects: [
      "LLB Law", "LLM Legal Practice", "Maritime Law",
      "International Trade Law"
    ],
  },

  // 136
  {
    name: "University of Law – Guildford",
    city: "Guildford",
    worldRanking: 0,
    founded: 2019,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£9,500-£14,000",
    intlStudents: "25%",
    totalStudents: "2,000",
    scholarships: false,
    featured: false,
    website: "https://www.law.ac.uk",
    campuses: ["Guildford Campus"],
    country: "United Kingdom",
    subjects: [
      "LLB Law", "LLM Legal Practice", "Corporate Law",
      "IP & Technology Law"
    ],
  },

  // 137
  {
    name: "Arden University – Birmingham",
    city: "Birmingham",
    worldRanking: 0,
    founded: 2019,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£9,500-£13,000",
    intlStudents: "40%",
    totalStudents: "2,000",
    scholarships: true,
    featured: false,
    website: "https://arden.ac.uk",
    campuses: ["Birmingham Study Centre"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computer Science", "Psychology",
      "Law", "Data Science"
    ],
  },

  // 138
  {
    name: "Arden University – Manchester",
    city: "Manchester",
    worldRanking: 0,
    founded: 2019,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£9,500-£13,000",
    intlStudents: "38%",
    totalStudents: "2,000",
    scholarships: true,
    featured: false,
    website: "https://arden.ac.uk",
    campuses: ["Manchester Study Centre"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computer Science",
      "Finance & Accounting", "Data Science"
    ],
  },

  // 139
  {
    name: "Arden University – Leeds",
    city: "Leeds",
    worldRanking: 0,
    founded: 2020,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£9,500-£13,000",
    intlStudents: "35%",
    totalStudents: "1,500",
    scholarships: true,
    featured: false,
    website: "https://arden.ac.uk",
    campuses: ["Leeds Study Centre"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Data Science",
      "Computer Science", "Project Management"
    ],
  },

  // 140
  {
    name: "Arden University – Bristol",
    city: "Bristol",
    worldRanking: 0,
    founded: 2021,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£9,500-£13,000",
    intlStudents: "35%",
    totalStudents: "1,200",
    scholarships: true,
    featured: false,
    website: "https://arden.ac.uk",
    campuses: ["Bristol Study Centre"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computer Science",
      "Psychology", "Data Science", "Law"
    ],
  },

  // 141
  {
    name: "University of Buckingham Medical School",
    city: "Buckingham",
    worldRanking: 0,
    founded: 2015,
    type: "Private",
    ieltsMin: 7.0,
    tuitionRange: "£36,000-£50,000",
    intlStudents: "35%",
    totalStudents: "500",
    scholarships: false,
    featured: false,
    website: "https://www.buckingham.ac.uk/departments/medical-school",
    campuses: ["Buckingham Medical Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Biomedical Sciences",
      "Clinical Research", "Anatomy"
    ],
  },

  // 142
  {
    name: "Schiller International University London",
    city: "London",
    worldRanking: 0,
    founded: 1964,
    type: "Private",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£20,000",
    intlStudents: "80%",
    totalStudents: "800",
    scholarships: true,
    featured: false,
    website: "https://www.schiller.edu",
    campuses: ["London Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "International Relations",
      "Computer Science", "Tourism Management"
    ],
  },

  // 143
  {
    name: "University of Sunderland London Campus",
    city: "London",
    worldRanking: 701,
    founded: 2012,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£18,000",
    intlStudents: "70%",
    totalStudents: "4,500",
    scholarships: true,
    featured: false,
    website: "https://www.sunderland.ac.uk/study/london",
    campuses: ["London Canary Wharf Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computer Science", "Nursing",
      "Media & Communications", "Law"
    ],
  },

  // 144
  {
    name: "Coventry University London",
    city: "London",
    worldRanking: 601,
    founded: 2010,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£19,500",
    intlStudents: "75%",
    totalStudents: "5,000",
    scholarships: true,
    featured: false,
    website: "https://www.coventry.ac.uk/london",
    campuses: ["London City Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Finance & Accounting", "Computer Science",
      "International Relations", "Data Science"
    ],
  },

  // 145
  {
    name: "GISMA Business School London",
    city: "London",
    worldRanking: 0,
    founded: 2019,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£14,000-£20,000",
    intlStudents: "85%",
    totalStudents: "2,000",
    scholarships: true,
    featured: false,
    website: "https://www.gisma.com",
    campuses: ["London Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Data Analytics",
      "Digital Transformation", "Finance & Accounting", "Leadership"
    ],
  },

  // 146
  {
    name: "Harper Adams University",
    city: "Newport",
    worldRanking: 0,
    founded: 1901,
    type: "Specialized",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£18,500",
    intlStudents: "10%",
    totalStudents: "5,500",
    scholarships: true,
    featured: false,
    website: "https://www.harper-adams.ac.uk",
    campuses: ["Newport Shropshire Campus"],
    country: "United Kingdom",
    subjects: [
      "Agriculture & Food Production", "Veterinary Physiotherapy",
      "Engineering (Agriculture)", "Rural Business Management",
      "Environmental Sciences", "Animal Science"
    ],
  },

  // 147
  {
    name: "University of Law – Chester",
    city: "Chester",
    worldRanking: 0,
    founded: 2020,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£9,500-£14,000",
    intlStudents: "20%",
    totalStudents: "1,500",
    scholarships: false,
    featured: false,
    website: "https://www.law.ac.uk",
    campuses: ["Chester Campus"],
    country: "United Kingdom",
    subjects: [
      "LLB Law", "LLM Legal Practice",
      "Public Law", "Equity & Trust Law"
    ],
  },

  // 148
  {
    name: "University of Law – East Anglia",
    city: "Norwich",
    worldRanking: 0,
    founded: 2022,
    type: "Private",
    ieltsMin: 6.5,
    tuitionRange: "£9,500-£14,000",
    intlStudents: "18%",
    totalStudents: "800",
    scholarships: false,
    featured: false,
    website: "https://www.law.ac.uk",
    campuses: ["Norwich Campus"],
    country: "United Kingdom",
    subjects: [
      "LLB Law", "LLM Legal Practice",
      "Human Rights Law", "Environmental Law"
    ],
  },
];