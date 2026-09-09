export interface UniData {
  name: string;
  city: string;
  worldRanking: number;
  founded: number;
  type: string; // "Russell Group", "Red Brick", "Plate Glass", "Modern", "Specialized"
  ieltsMin: number;
  tuitionRange: string; // e.g. "£15,000-£35,000"
  intlStudents: string; // e.g. "12,000"
  totalStudents: string; // e.g. "35,000"
  scholarships: boolean;
  featured: boolean;
  website: string;
  subjects: string[]; // authentic faculty/department areas → each generates 9 degree programs
  campuses?: string[];
  country?: string;
}

export const ukUniversitiesPart1: UniData[] = [
  // ======================================================
  // RUSSELL GROUP UNIVERSITIES (#1-#24)
  // ======================================================

  // 1
  {
    name: "University of Oxford",
    city: "Oxford",
    worldRanking: 4,
    founded: 1096,
    type: "Russell Group",
    ieltsMin: 7.5,
    tuitionRange: "£35,000-£49,000",
    intlStudents: "12,000",
    totalStudents: "26,000",
    scholarships: true,
    featured: true,
    website: "https://www.ox.ac.uk",
    campuses: ["Oxford Main Campus", "Radcliffe Hospital Campus", "Saïd Business School", "Blavatnik School of Government"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Law", "Philosophy, Politics & Economics", "Mathematics",
      "Physics", "Chemistry", "Biology", "English Literature",
      "History", "Computer Science", "Biochemistry", "Engineering Science",
      "Economics", "Psychology", "Neuroscience", "Theology & Religion",
      "International Relations", "Earth Sciences", "Business Administration", "Fine Art",
      "Architecture & Urban Planning", "Education", "Artificial Intelligence", "Data Science"
    ],
  },

  // 2
  {
    name: "University of Cambridge",
    city: "Cambridge",
    worldRanking: 5,
    founded: 1209,
    type: "Russell Group",
    ieltsMin: 7.5,
    tuitionRange: "£35,000-£52,000",
    intlStudents: "11,000",
    totalStudents: "24,000",
    scholarships: true,
    featured: true,
    website: "https://www.cam.ac.uk",
    campuses: ["Cambridge Main Campus", "Addenbrooke's Hospital", "Cambridge Judge Business School"],
    country: "United Kingdom",
    subjects: [
      "Mathematics", "Physics", "Engineering", "Medicine", "Computer Science",
      "History", "Economics", "Chemistry", "Law", "Biology",
      "Architecture", "Earth Sciences", "Geography", "Philosophy",
      "Biochemistry", "Psychology", "Linguistics", "Music",
      "Education", "Astrophysics", "Management Studies", "Natural Sciences"
    ],
  },

  // 3
  {
    name: "Imperial College London",
    city: "London",
    worldRanking: 6,
    founded: 1907,
    type: "Russell Group",
    ieltsMin: 7.0,
    tuitionRange: "£38,000-£52,000",
    intlStudents: "16,000",
    totalStudents: "22,000",
    scholarships: true,
    featured: true,
    website: "https://www.imperial.ac.uk",
    campuses: ["South Kensington Campus", "Hammersmith Hospital Campus", "White City Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Medicine", "Computer Science", "Mathematics", "Physics",
      "Chemistry", "Data Science", "Artificial Intelligence", "Bioengineering",
      "Mechanical Engineering", "Civil Engineering", "Electrical Engineering",
      "Chemical Engineering", "Materials Science", "Environmental Science",
      "Business & Management", "Molecular Biology", "Neuroscience"
    ],
  },

  // 4
  {
    name: "University College London (UCL)",
    city: "London",
    worldRanking: 9,
    founded: 1826,
    type: "Russell Group",
    ieltsMin: 7.0,
    tuitionRange: "£26,000-£42,000",
    intlStudents: "18,000",
    totalStudents: "46,000",
    scholarships: true,
    featured: true,
    website: "https://www.ucl.ac.uk",
    campuses: ["Bloomsbury Main Campus", "Royal Free Hospital Campus", "UCL East Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Law", "Engineering", "Architecture", "Psychology",
      "Economics", "Computer Science", "Political Science", "Biochemistry",
      "Neuroscience", "Pharmacy", "Dentistry", "Optometry",
      "Earth Sciences", "Anthropology", "Archaeology", "Geography",
      "Education", "Fine Art", "Biomedical Sciences", "Population Health"
    ],
  },

  // 5
  {
    name: "London School of Economics (LSE)",
    city: "London",
    worldRanking: 56,
    founded: 1895,
    type: "Russell Group",
    ieltsMin: 7.0,
    tuitionRange: "£26,000-£34,000",
    intlStudents: "11,000",
    totalStudents: "12,000",
    scholarships: true,
    featured: true,
    website: "https://www.lse.ac.uk",
    campuses: ["Houghton Street Campus"],
    country: "United Kingdom",
    subjects: [
      "Economics", "Political Science", "Law", "Finance & Accounting",
      "International Relations", "Sociology", "History", "Media & Communications",
      "Statistics", "Philosophy", "Anthropology", "Development Studies",
      "Management Information Systems", "Social Policy", "Human Geography"
    ],
  },

  // 6
  {
    name: "University of Edinburgh",
    city: "Edinburgh",
    worldRanking: 22,
    founded: 1583,
    type: "Russell Group",
    ieltsMin: 7.0,
    tuitionRange: "£26,000-£36,000",
    intlStudents: "14,000",
    totalStudents: "44,000",
    scholarships: true,
    featured: true,
    website: "https://www.ed.ac.uk",
    campuses: ["Central Area Campus", "Little France Medical Campus", "Easter Bush Vet Campus", "King's Buildings"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Law", "Engineering", "Computer Science", "English Literature",
      "History", "Political Science", "Biology", "Veterinary Science",
      "Architecture", "Earth Sciences", "Psychology", "Business & Management",
      "Philosophy", "Chemistry", "Mathematics", "Divinity & Religious Studies",
      "Education", "Data Science", "Artificial Intelligence", "Cognitive Science"
    ],
  },

  // 7
  {
    name: "University of Manchester",
    city: "Manchester",
    worldRanking: 32,
    founded: 1824,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£25,000-£38,000",
    intlStudents: "16,000",
    totalStudents: "44,000",
    scholarships: true,
    featured: true,
    website: "https://www.manchester.ac.uk",
    campuses: ["Oxford Road Campus", "Manchester Royal Infirmary", "Whitworth Art Gallery"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Medicine", "Business & Management",
      "Chemistry", "Physics", "Mathematics", "Data Science",
      "Materials Science", "Chemical Engineering", "Environmental Science",
      "Law", "Psychology", "Architecture", "Biomedical Science",
      "Economics", "Social Sciences", "Earth & Environmental Sciences", "Life Sciences"
    ],
  },

  // 8
  {
    name: "King's College London",
    city: "London",
    worldRanking: 40,
    founded: 1829,
    type: "Russell Group",
    ieltsMin: 7.0,
    tuitionRange: "£25,000-£42,000",
    intlStudents: "14,000",
    totalStudents: "35,000",
    scholarships: true,
    featured: true,
    website: "https://www.kcl.ac.uk",
    campuses: ["Strand Campus", "Guy's Campus", "St Thomas' Hospital", "Denmark Hill", "Waterloo Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Law", "Psychology", "Nursing", "Biology",
      "International Relations", "Chemistry", "Physics",
      "Dentistry", "Biomedical Science", "War Studies & Security",
      "Neuroscience", "History", "Digital Humanities",
      "Business Management", "Pharmacy", "Mental Health"
    ],
  },

  // 9
  {
    name: "University of Bristol",
    city: "Bristol",
    worldRanking: 55,
    founded: 1876,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£24,000-£36,000",
    intlStudents: "9,000",
    totalStudents: "29,000",
    scholarships: true,
    featured: true,
    website: "https://www.bristol.ac.uk",
    campuses: ["Clifton Campus", "Langford Veterinary Campus", "Temple Quarter Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Law", "Mathematics", "Physics", "Computer Science",
      "Medicine", "Chemistry", "Psychology", "Economics", "Architecture",
      "Veterinary Science", "Biochemistry", "Neuroscience",
      "Earth Sciences", "Education", "Social Sciences"
    ],
  },

  // 10
  {
    name: "University of Warwick",
    city: "Coventry",
    worldRanking: 64,
    founded: 1965,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£24,000-£36,000",
    intlStudents: "10,000",
    totalStudents: "28,000",
    scholarships: true,
    featured: true,
    website: "https://warwick.ac.uk",
    campuses: ["Coventry Main Campus", "London Campus (WBS)"],
    country: "United Kingdom",
    subjects: [
      "Mathematics", "Economics", "Business & Management", "Computer Science",
      "Engineering", "Law", "Political Science", "Data Science",
      "Philosophy", "Statistics", "Chemistry", "Physics",
      "Psychology", "Sociology", "Theatre & Performance Studies", "History"
    ],
  },

  // 11
  {
    name: "University of Glasgow",
    city: "Glasgow",
    worldRanking: 76,
    founded: 1451,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£22,000-£35,000",
    intlStudents: "10,000",
    totalStudents: "36,000",
    scholarships: true,
    featured: true,
    website: "https://www.gla.ac.uk",
    campuses: ["Gilmorehill Campus", "Garscube Campus (Vet Medicine)", "Queen Elizabeth University Hospital"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Law", "Engineering", "Biology", "Chemistry",
      "Physics", "English Literature", "History", "Veterinary Medicine",
      "Psychology", "Economics", "Computer Science", "Mathematics",
      "Architecture", "Social Sciences", "Philosophy", "Dentistry"
    ],
  },

  // 12
  {
    name: "University of Birmingham",
    city: "Birmingham",
    worldRanking: 84,
    founded: 1900,
    type: "Russell Group",
    ieltsMin: 6.0,
    tuitionRange: "£22,000-£34,000",
    intlStudents: "8,500",
    totalStudents: "38,000",
    scholarships: true,
    featured: true,
    website: "https://www.birmingham.ac.uk",
    campuses: ["Edgbaston Campus", "Selly Oak Campus", "Dubai Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Medicine", "Computer Science", "Business & Management",
      "Law", "Psychology", "Chemistry", "Physics",
      "Materials Science", "Biochemistry", "Sport & Exercise Science",
      "Political Science", "Environmental Science", "Mathematics", "History",
      "Social Policy", "Education"
    ],
  },

  // 13
  {
    name: "University of Leeds",
    city: "Leeds",
    worldRanking: 86,
    founded: 1904,
    type: "Russell Group",
    ieltsMin: 6.0,
    tuitionRange: "£23,000-£35,000",
    intlStudents: "10,000",
    totalStudents: "39,000",
    scholarships: true,
    featured: true,
    website: "https://www.leeds.ac.uk",
    campuses: ["Leeds City Centre Campus", "Leeds Teaching Hospitals"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Medicine", "Environmental Science",
      "Psychology", "Computer Science", "Law", "Chemistry",
      "Architecture", "Sociology", "Food Science & Nutrition", "Languages",
      "Geography", "Dentistry", "Pharmacy", "Education", "Mathematics"
    ],
  },

  // 14
  {
    name: "University of Sheffield",
    city: "Sheffield",
    worldRanking: 104,
    founded: 1905,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£22,000-£34,000",
    intlStudents: "9,000",
    totalStudents: "30,000",
    scholarships: true,
    featured: true,
    website: "https://www.sheffield.ac.uk",
    campuses: ["Western Bank Campus", "St George's Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Medicine", "Computer Science", "Architecture",
      "Psychology", "Biology", "Chemistry", "Data Science",
      "Economics", "Mathematics", "History", "Sociology",
      "Urban Planning & Design", "Landscape Architecture", "Law", "Physics"
    ],
  },

  // 15
  {
    name: "University of Nottingham",
    city: "Nottingham",
    worldRanking: 108,
    founded: 1798,
    type: "Russell Group",
    ieltsMin: 6.0,
    tuitionRange: "£22,000-£35,000",
    intlStudents: "10,000",
    totalStudents: "35,000",
    scholarships: true,
    featured: true,
    website: "https://www.nottingham.ac.uk",
    campuses: ["University Park", "Jubilee Campus", "Medical School Campus", "Sutton Bonington Agricultural Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Engineering", "Business & Management", "Computer Science",
      "Law", "Pharmacy", "Psychology", "Economics",
      "Architecture", "Chemistry", "Life Sciences", "Education",
      "Political Science", "Agricultural Sciences", "History", "Mathematics"
    ],
  },

  // 16
  {
    name: "University of Southampton",
    city: "Southampton",
    worldRanking: 80,
    founded: 1862,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£22,000-£34,000",
    intlStudents: "8,500",
    totalStudents: "25,000",
    scholarships: true,
    featured: true,
    website: "https://www.southampton.ac.uk",
    campuses: ["Highfield Campus", "Southampton Science Park", "Winchester School of Art"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Medicine", "Electrical Engineering",
      "Mechanical Engineering", "Physics", "Data Science", "Chemistry",
      "Biomedical Engineering", "Ocean Science", "Mathematics", "Finance",
      "Clinical Neuroscience", "Arts & Design", "Social Sciences"
    ],
  },

  // 17
  {
    name: "University of Liverpool",
    city: "Liverpool",
    worldRanking: 176,
    founded: 1881,
    type: "Red Brick",
    ieltsMin: 6.0,
    tuitionRange: "£20,000-£32,000",
    intlStudents: "8,000",
    totalStudents: "33,000",
    scholarships: true,
    featured: true,
    website: "https://www.liverpool.ac.uk",
    campuses: ["Liverpool City Campus", "Aintree University Hospital", "Brownlow Hill"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Engineering", "Computer Science", "Business & Management",
      "Law", "Architecture", "Biology", "Chemistry",
      "Archaeology", "History", "Psychology", "Veterinary Science",
      "Mathematics", "Physics", "Environmental Science"
    ],
  },

  // 18
  {
    name: "University of Newcastle",
    city: "Newcastle",
    worldRanking: 122,
    founded: 1834,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£22,000-£34,000",
    intlStudents: "7,500",
    totalStudents: "29,000",
    scholarships: true,
    featured: true,
    website: "https://www.ncl.ac.uk",
    campuses: ["Newcastle City Centre Campus", "NUMED Medicine Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Engineering", "Computer Science", "Architecture",
      "Biology", "Civil Engineering", "Psychology", "Environmental Science",
      "Geography", "Education", "Languages", "Chemistry",
      "Mathematics", "Biomedical Sciences", "Law", "Data Science"
    ],
  },

  // 19
  {
    name: "Durham University",
    city: "Durham",
    worldRanking: 78,
    founded: 1832,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£23,000-£35,000",
    intlStudents: "5,500",
    totalStudents: "19,000",
    scholarships: true,
    featured: true,
    website: "https://www.durham.ac.uk",
    campuses: ["Durham City Campus", "Queen's Campus Stockton"],
    country: "United Kingdom",
    subjects: [
      "Law", "Economics", "English Literature", "History",
      "Physics", "Chemistry", "Mathematics", "Political Science",
      "Education", "Theology & Religion", "Anthropology",
      "Engineering", "Psychology", "Business & Management", "Geography"
    ],
  },

  // 20
  {
    name: "University of Exeter",
    city: "Exeter",
    worldRanking: 153,
    founded: 1955,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£22,000-£34,000",
    intlStudents: "6,500",
    totalStudents: "30,000",
    scholarships: true,
    featured: true,
    website: "https://www.exeter.ac.uk",
    campuses: ["Streatham Campus", "St Luke's Campus", "Penryn Campus Cornwall"],
    country: "United Kingdom",
    subjects: [
      "Environmental Science", "Business & Management", "Engineering", "Medicine",
      "Psychology", "Biology", "Sports Science", "English Literature",
      "Politics", "Law", "Arabic & Islamic Studies", "History",
      "Data Science", "Film & Visual Studies", "Economics", "Mathematics"
    ],
  },

  // 21
  {
    name: "Queen Mary University of London",
    city: "London",
    worldRanking: 120,
    founded: 1785,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£23,000-£35,000",
    intlStudents: "9,000",
    totalStudents: "28,000",
    scholarships: true,
    featured: false,
    website: "https://www.qmul.ac.uk",
    campuses: ["Mile End Campus", "Whitechapel Medical Campus", "Lincoln's Inn Fields Law Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Law", "Engineering", "Computer Science",
      "Biology", "Chemistry", "English Literature", "Political Science",
      "Geography", "Mathematics", "History", "Business & Management",
      "Dentistry", "Physics", "Drama", "Economics"
    ],
  },

  // 22
  {
    name: "University of York",
    city: "York",
    worldRanking: 167,
    founded: 1963,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£21,000-£33,000",
    intlStudents: "5,000",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.york.ac.uk",
    campuses: ["Heslington West Campus", "Heslington East Campus"],
    country: "United Kingdom",
    subjects: [
      "Biology", "Chemistry", "Psychology", "English Literature",
      "History", "Computer Science", "Environmental Science", "Physics",
      "Music", "Politics", "Education", "Social Policy",
      "Management", "Data Science"
    ],
  },

  // 23
  {
    name: "University of St Andrews",
    city: "St Andrews",
    worldRanking: 95,
    founded: 1413,
    type: "Russell Group",
    ieltsMin: 7.0,
    tuitionRange: "£25,000-£36,000",
    intlStudents: "5,000",
    totalStudents: "11,000",
    scholarships: true,
    featured: false,
    website: "https://www.st-andrews.ac.uk",
    campuses: ["North Haugh Campus", "Medical School"],
    country: "United Kingdom",
    subjects: [
      "International Relations", "English Literature", "History", "Computer Science",
      "Psychology", "Biology", "Mathematics", "Economics",
      "Chemistry", "Physics", "Philosophy", "Theology",
      "Management", "Medieval Studies", "Film Studies"
    ],
  },

  // 24
  {
    name: "University of Bath",
    city: "Bath",
    worldRanking: 166,
    founded: 1966,
    type: "Plate Glass",
    ieltsMin: 6.5,
    tuitionRange: "£22,000-£33,000",
    intlStudents: "5,500",
    totalStudents: "19,000",
    scholarships: true,
    featured: false,
    website: "https://www.bath.ac.uk",
    campuses: ["Claverton Down Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Business & Management", "Computer Science", "Architecture",
      "Psychology", "Sports Science", "Mathematics", "Chemistry",
      "Physics", "Economics", "Education", "International Development"
    ],
  },

  // 25
  {
    name: "Lancaster University",
    city: "Lancaster",
    worldRanking: 132,
    founded: 1964,
    type: "Plate Glass",
    ieltsMin: 6.5,
    tuitionRange: "£21,000-£32,000",
    intlStudents: "5,000",
    totalStudents: "15,000",
    scholarships: true,
    featured: false,
    website: "https://www.lancaster.ac.uk",
    campuses: ["Lancaster Main Campus", "Lancaster Ghana Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Environmental Science", "Computer Science",
      "Psychology", "Sociology", "Data Science", "Law", "Engineering",
      "History", "Politics", "Languages", "Education", "Mathematics"
    ],
  },

  // 26
  {
    name: "University of Surrey",
    city: "Guildford",
    worldRanking: 244,
    founded: 1966,
    type: "Plate Glass",
    ieltsMin: 6.5,
    tuitionRange: "£20,000-£30,000",
    intlStudents: "5,000",
    totalStudents: "16,000",
    scholarships: true,
    featured: false,
    website: "https://www.surrey.ac.uk",
    campuses: ["Guildford Main Campus", "Surrey Research Park"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Hospitality & Tourism", "Data Science",
      "Physics", "Chemistry", "Business & Management", "Electrical Engineering",
      "Veterinary Medicine", "Nursing", "Psychology", "Civil Engineering"
    ],
  },

  // 27
  {
    name: "Loughborough University",
    city: "Loughborough",
    worldRanking: 212,
    founded: 1909,
    type: "Plate Glass",
    ieltsMin: 6.5,
    tuitionRange: "£22,000-£32,000",
    intlStudents: "4,500",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.lboro.ac.uk",
    campuses: ["Loughborough Main Campus", "Loughborough London Campus"],
    country: "United Kingdom",
    subjects: [
      "Sports Science", "Engineering", "Business & Management", "Architecture",
      "Computer Science", "Mechanical Engineering", "Data Science", "Media & Communications",
      "Mathematics", "Chemistry", "Design & Technology", "Social Sciences"
    ],
  },

  // 28
  {
    name: "University of Reading",
    city: "Reading",
    worldRanking: 229,
    founded: 1892,
    type: "Red Brick",
    ieltsMin: 6.5,
    tuitionRange: "£20,000-£30,000",
    intlStudents: "5,500",
    totalStudents: "23,000",
    scholarships: true,
    featured: false,
    website: "https://www.reading.ac.uk",
    campuses: ["Whiteknights Campus", "London Road Campus"],
    country: "United Kingdom",
    subjects: [
      "Environmental Science", "Business & Management", "Finance & Accounting",
      "Biology", "Chemistry", "Physics", "Mathematics", "Law",
      "Psychology", "Agriculture", "Architecture", "Education", "Meteorology"
    ],
  },

  // 29
  {
    name: "University of Sussex",
    city: "Brighton",
    worldRanking: 218,
    founded: 1961,
    type: "Plate Glass",
    ieltsMin: 6.5,
    tuitionRange: "£21,000-£31,000",
    intlStudents: "5,000",
    totalStudents: "18,000",
    scholarships: true,
    featured: false,
    website: "https://www.sussex.ac.uk",
    campuses: ["Falmer Campus"],
    country: "United Kingdom",
    subjects: [
      "Media & Communications", "International Relations", "Biology", "Chemistry",
      "Psychology", "English Literature", "Computer Science", "Political Science",
      "Law", "Physics", "Mathematics", "Engineering", "Social Work"
    ],
  },

  // 30
  {
    name: "University of Aberdeen",
    city: "Aberdeen",
    worldRanking: 208,
    founded: 1495,
    type: "Russell Group",
    ieltsMin: 6.5,
    tuitionRange: "£20,000-£32,000",
    intlStudents: "5,000",
    totalStudents: "16,000",
    scholarships: true,
    featured: false,
    website: "https://www.abdn.ac.uk",
    campuses: ["King's College Campus", "Foresterhill Medical Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Law", "Engineering", "Environmental Science",
      "Biology", "Chemistry", "Physics", "Mathematics",
      "Business & Management", "Psychology", "Divinity", "Education"
    ],
  },

  // 31
  {
    name: "University of Dundee",
    city: "Dundee",
    worldRanking: 318,
    founded: 1967,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£19,000-£30,000",
    intlStudents: "4,000",
    totalStudents: "16,000",
    scholarships: true,
    featured: false,
    website: "https://www.dundee.ac.uk",
    campuses: ["Dundee City Campus", "Ninewells Medical Campus", "Duncan of Jordanstone Art College"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Computer Science", "Art & Design", "Law",
      "Biology", "Engineering", "Psychology", "Data Science",
      "Dentistry", "Nursing", "Architecture", "Education"
    ],
  },

  // 32
  {
    name: "University of Kent",
    city: "Canterbury",
    worldRanking: 336,
    founded: 1965,
    type: "Plate Glass",
    ieltsMin: 6.5,
    tuitionRange: "£19,000-£29,000",
    intlStudents: "5,500",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.kent.ac.uk",
    campuses: ["Canterbury Campus", "Medway Campus", "Brussels Campus", "Paris Campus"],
    country: "United Kingdom",
    subjects: [
      "Computer Science", "Law", "Business & Management", "Psychology",
      "English Literature", "History", "Data Science", "International Relations",
      "Biosciences", "Physics", "Engineering", "Architecture"
    ],
  },

  // 33
  {
    name: "University of East Anglia (UEA)",
    city: "Norwich",
    worldRanking: 342,
    founded: 1963,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£19,000-£29,000",
    intlStudents: "4,000",
    totalStudents: "17,000",
    scholarships: true,
    featured: false,
    website: "https://www.uea.ac.uk",
    campuses: ["Norwich Main Campus", "Bob Champion Research Centre"],
    country: "United Kingdom",
    subjects: [
      "Environmental Science", "English Literature", "Biology", "Medicine",
      "Psychology", "Computer Science", "International Relations", "Chemistry",
      "Law", "Business & Management", "Education", "History"
    ],
  },

  // 34
  {
    name: "University of Essex",
    city: "Colchester",
    worldRanking: 359,
    founded: 1964,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£19,000-£28,000",
    intlStudents: "4,500",
    totalStudents: "17,000",
    scholarships: true,
    featured: false,
    website: "https://www.essex.ac.uk",
    campuses: ["Colchester Campus", "Southend Campus", "Loughton Campus"],
    country: "United Kingdom",
    subjects: [
      "Political Science", "Sociology", "Economics", "Law",
      "Computer Science", "Data Science", "International Relations", "Psychology",
      "Mathematics", "History", "Literature", "Business & Management"
    ],
  },

  // 35
  {
    name: "University of Leicester",
    city: "Leicester",
    worldRanking: 285,
    founded: 1921,
    type: "Red Brick",
    ieltsMin: 6.0,
    tuitionRange: "£19,000-£29,000",
    intlStudents: "4,500",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.le.ac.uk",
    campuses: ["University Road Campus", "Leicester Royal Infirmary"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Engineering", "Law", "Physics",
      "Biology", "Chemistry", "Computer Science", "History",
      "Psychology", "Business & Management", "Archaeology", "Mathematics"
    ],
  },

  // 36
  {
    name: "University of Strathclyde",
    city: "Glasgow",
    worldRanking: 251,
    founded: 1796,
    type: "Plate Glass",
    ieltsMin: 6.5,
    tuitionRange: "£20,000-£31,000",
    intlStudents: "6,000",
    totalStudents: "23,000",
    scholarships: true,
    featured: false,
    website: "https://www.strath.ac.uk",
    campuses: ["John Anderson Campus Glasgow"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Business & Management", "Computer Science", "Law",
      "Pharmacy", "Chemistry", "Physics", "Architecture",
      "Mathematics", "Education", "Social Work", "Data Science"
    ],
  },

  // 37
  {
    name: "Heriot-Watt University",
    city: "Edinburgh",
    worldRanking: 235,
    founded: 1821,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£19,000-£28,000",
    intlStudents: "6,500",
    totalStudents: "12,000",
    scholarships: true,
    featured: false,
    website: "https://www.hw.ac.uk",
    campuses: ["Edinburgh Campus", "Dubai Campus", "Malaysia Campus", "Scottish Borders Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management", "Architecture",
      "Mathematics", "Data Science", "Mechanical Engineering", "Civil Engineering",
      "Artificial Intelligence", "Environmental Science", "Petroleum Engineering"
    ],
  },

  // 38
  {
    name: "University of Stirling",
    city: "Stirling",
    worldRanking: 431,
    founded: 1967,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£16,000-£24,000",
    intlStudents: "3,500",
    totalStudents: "14,000",
    scholarships: true,
    featured: false,
    website: "https://www.stir.ac.uk",
    campuses: ["Stirling Main Campus"],
    country: "United Kingdom",
    subjects: [
      "Sports Science", "Psychology", "Environmental Science", "Business & Management",
      "Education", "Media & Communications", "Data Science", "Nursing",
      "Social Policy", "Film Studies", "Politics"
    ],
  },

  // 39
  {
    name: "Aston University",
    city: "Birmingham",
    worldRanking: 441,
    founded: 1966,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£18,000-£27,000",
    intlStudents: "4,000",
    totalStudents: "14,000",
    scholarships: true,
    featured: false,
    website: "https://www.aston.ac.uk",
    campuses: ["Aston Triangle Campus Birmingham"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Computer Science", "Pharmacy",
      "Biology", "Data Science", "Finance & Accounting", "Psychology",
      "Law", "Optometry", "Languages", "Social Sciences"
    ],
  },

  // 40
  {
    name: "University of Hull",
    city: "Hull",
    worldRanking: 521,
    founded: 1927,
    type: "Red Brick",
    ieltsMin: 6.0,
    tuitionRange: "£16,000-£24,000",
    intlStudents: "3,000",
    totalStudents: "16,000",
    scholarships: true,
    featured: false,
    website: "https://www.hull.ac.uk",
    campuses: ["Hull City Campus", "Scarborough Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management", "Environmental Science",
      "Psychology", "History", "Law", "Nursing",
      "Social Work", "Mathematics", "Politics"
    ],
  },

  // 41
  {
    name: "Brunel University London",
    city: "Uxbridge",
    worldRanking: 341,
    founded: 1966,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£19,000-£28,000",
    intlStudents: "5,000",
    totalStudents: "15,000",
    scholarships: true,
    featured: false,
    website: "https://www.brunel.ac.uk",
    campuses: ["Uxbridge Main Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management", "Data Science",
      "Law", "Sports Science", "Mechanical Engineering", "Civil Engineering",
      "Design", "Media & Communications", "Social Sciences"
    ],
  },

  // 42
  {
    name: "City University of London",
    city: "London",
    worldRanking: 328,
    founded: 1894,
    type: "Red Brick",
    ieltsMin: 6.5,
    tuitionRange: "£19,000-£29,000",
    intlStudents: "5,500",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.city.ac.uk",
    campuses: ["Northampton Square Campus London"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Law", "Computer Science", "Media & Communications",
      "Engineering", "Data Science", "Psychology", "Finance & Accounting",
      "Optometry", "Nursing", "Social Sciences", "Mathematics"
    ],
  },

  // 43
  {
    name: "University of Westminster",
    city: "London",
    worldRanking: 651,
    founded: 1838,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£24,000",
    intlStudents: "6,000",
    totalStudents: "19,000",
    scholarships: true,
    featured: false,
    website: "https://www.westminster.ac.uk",
    campuses: ["Regent Street Campus", "Cavendish Campus", "Harrow Campus"],
    country: "United Kingdom",
    subjects: [
      "Media & Communications", "Architecture", "Business & Management", "Law",
      "Art & Design", "Computer Science", "International Relations", "Hospitality & Tourism",
      "Fashion", "Music", "Nursing", "Psychology"
    ],
  },

  // 44
  {
    name: "Nottingham Trent University",
    city: "Nottingham",
    worldRanking: 595,
    founded: 1992,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£24,000",
    intlStudents: "4,500",
    totalStudents: "32,000",
    scholarships: true,
    featured: false,
    website: "https://www.ntu.ac.uk",
    campuses: ["City Campus", "Clifton Campus", "Brackenhurst Agricultural Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Art & Design", "Architecture", "Computer Science",
      "Engineering", "Law", "Psychology", "Nursing",
      "Fashion", "Sciences", "Education", "Social Sciences"
    ],
  },

  // 45
  {
    name: "Sheffield Hallam University",
    city: "Sheffield",
    worldRanking: 601,
    founded: 1843,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£22,000",
    intlStudents: "4,000",
    totalStudents: "31,000",
    scholarships: true,
    featured: false,
    website: "https://www.shu.ac.uk",
    campuses: ["City Campus Sheffield", "Collegiate Campus Sheffield"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Computer Science", "Nursing",
      "Art & Design", "Architecture", "Sports Science", "Education",
      "Law", "Social Work", "Psychology", "Health Sciences"
    ],
  },

  // 46
  {
    name: "University of Huddersfield",
    city: "Huddersfield",
    worldRanking: 621,
    founded: 1825,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£22,000",
    intlStudents: "3,500",
    totalStudents: "22,000",
    scholarships: true,
    featured: false,
    website: "https://www.hud.ac.uk",
    campuses: ["Queensgate Campus Huddersfield"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Computer Science", "Music",
      "Chemistry", "Architecture", "Education", "Law",
      "Nursing", "Social Sciences", "Art & Design"
    ],
  },

  // 47
  {
    name: "Leeds Beckett University",
    city: "Leeds",
    worldRanking: 651,
    founded: 1824,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£22,000",
    intlStudents: "3,500",
    totalStudents: "25,000",
    scholarships: true,
    featured: false,
    website: "https://www.leedsbeckett.ac.uk",
    campuses: ["City Campus Leeds", "Headingley Campus Leeds"],
    country: "United Kingdom",
    subjects: [
      "Sports Science", "Business & Management", "Civil Engineering", "Architecture",
      "Media & Communications", "Hospitality & Tourism", "Nursing", "Education",
      "Law", "Social Work", "Psychology"
    ],
  },

  // 48
  {
    name: "Manchester Metropolitan University",
    city: "Manchester",
    worldRanking: 601,
    founded: 1824,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£23,000",
    intlStudents: "4,000",
    totalStudents: "34,000",
    scholarships: true,
    featured: false,
    website: "https://www.mmu.ac.uk",
    campuses: ["All Saints Campus", "Brooks Building Campus", "Birley Campus"],
    country: "United Kingdom",
    subjects: [
      "Art & Design", "Architecture", "Business & Management", "Computer Science",
      "Engineering", "Nursing", "Education", "Psychology",
      "Law", "Social Sciences", "Sports Science", "Fashion"
    ],
  },

  // 49
  {
    name: "University of Salford",
    city: "Salford",
    worldRanking: 721,
    founded: 1896,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£23,000",
    intlStudents: "3,500",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.salford.ac.uk",
    campuses: ["Salford Quays Campus"],
    country: "United Kingdom",
    subjects: [
      "Media & Communications", "Computer Science", "Engineering", "Business & Management",
      "Architecture", "Nursing", "Data Science", "Psychology",
      "Social Work", "Education", "Law"
    ],
  },

  // 50
  {
    name: "University of Central Lancashire (UCLan)",
    city: "Preston",
    worldRanking: 701,
    founded: 1828,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£21,000",
    intlStudents: "3,500",
    totalStudents: "30,000",
    scholarships: true,
    featured: false,
    website: "https://www.uclan.ac.uk",
    campuses: ["Preston Main Campus", "Burnley Campus", "Cyprus Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Engineering", "Business & Management", "Computer Science",
      "Law", "Nursing", "Data Science", "Sports Science",
      "Art & Design", "Social Work", "Education", "Psychology"
    ],
  },

  // 51
  {
    name: "University of Portsmouth",
    city: "Portsmouth",
    worldRanking: 541,
    founded: 1992,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£23,000",
    intlStudents: "4,000",
    totalStudents: "25,000",
    scholarships: true,
    featured: false,
    website: "https://www.port.ac.uk",
    campuses: ["Portsmouth Main Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Computer Science", "Business & Management", "Law",
      "Psychology", "Biology", "Data Science", "Civil Engineering",
      "Nursing", "Architecture", "Criminology"
    ],
  },

  // 52
  {
    name: "University of Brighton",
    city: "Brighton",
    worldRanking: 581,
    founded: 1859,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£22,000",
    intlStudents: "3,500",
    totalStudents: "21,000",
    scholarships: true,
    featured: false,
    website: "https://www.brighton.ac.uk",
    campuses: ["Moulsecoomb Campus", "Falmer Campus", "Eastbourne Campus"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Nursing", "Engineering", "Art & Design",
      "Architecture", "Environmental Science", "Business & Management", "Education",
      "Pharmacy", "Psychology", "Law"
    ],
  },

  // 53
  {
    name: "Bournemouth University",
    city: "Bournemouth",
    worldRanking: 801,
    founded: 1992,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£22,000",
    intlStudents: "3,500",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.bournemouth.ac.uk",
    campuses: ["Talbot Campus", "Lansdowne Campus"],
    country: "United Kingdom",
    subjects: [
      "Media & Communications", "Business & Management", "Hospitality & Tourism",
      "Computer Science", "Law", "Health Sciences", "Engineering",
      "Art & Design", "Psychology", "Social Sciences"
    ],
  },

  // 54
  {
    name: "Coventry University",
    city: "Coventry",
    worldRanking: 601,
    founded: 1843,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£24,000",
    intlStudents: "6,000",
    totalStudents: "35,000",
    scholarships: true,
    featured: true,
    website: "https://www.coventry.ac.uk",
    campuses: ["Coventry City Campus", "Coventry London Campus", "Scarborough Campus"],
    country: "United Kingdom",
    subjects: [
      "Automotive Engineering", "Computer Science", "Business & Management",
      "Architecture", "Nursing", "Education", "Psychology",
      "Art & Design", "International Relations", "Sports Science",
      "Environmental Science", "Law", "Data Science"
    ],
  },

  // 55
  {
    name: "De Montfort University",
    city: "Leicester",
    worldRanking: 651,
    founded: 1870,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£22,000",
    intlStudents: "3,500",
    totalStudents: "25,000",
    scholarships: true,
    featured: false,
    website: "https://www.dmu.ac.uk",
    campuses: ["Leicester City Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Technology", "Arts & Design",
      "Health & Life Sciences", "Law", "Education", "Computer Science",
      "Media & Communications", "Nursing"
    ],
  },

  // 56
  {
    name: "Northumbria University",
    city: "Newcastle",
    worldRanking: 601,
    founded: 1992,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£22,000",
    intlStudents: "4,000",
    totalStudents: "35,000",
    scholarships: true,
    featured: false,
    website: "https://www.northumbria.ac.uk",
    campuses: ["City Campus Newcastle", "Coach Lane Campus", "London Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Law", "Art & Design",
      "Architecture", "Health Sciences", "Computer Science", "Education",
      "Sports Science", "Psychology", "Social Sciences"
    ],
  },

  // 57
  {
    name: "University of Greenwich",
    city: "London",
    worldRanking: 701,
    founded: 1890,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£20,000",
    intlStudents: "4,000",
    totalStudents: "22,000",
    scholarships: true,
    featured: false,
    website: "https://www.gre.ac.uk",
    campuses: ["Greenwich Campus", "Medway Campus", "Avery Hill Campus"],
    country: "United Kingdom",
    subjects: [
      "Engineering", "Business & Management", "Computing", "Architecture",
      "Education", "Social Sciences", "Health Sciences", "Pharmacy",
      "Mathematics", "Law"
    ],
  },

  // 58
  {
    name: "Kingston University London",
    city: "London",
    worldRanking: 701,
    founded: 1899,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£21,000",
    intlStudents: "4,000",
    totalStudents: "18,000",
    scholarships: true,
    featured: false,
    website: "https://www.kingston.ac.uk",
    campuses: ["Kingston Hill Campus", "Penrhyn Road Campus", "Knights Park Campus"],
    country: "United Kingdom",
    subjects: [
      "Art & Design", "Business & Management", "Law", "Engineering",
      "Computer Science", "Health Sciences", "Nursing", "Architecture",
      "Media & Communications", "Social Sciences"
    ],
  },

  // 59
  {
    name: "Teesside University",
    city: "Middlesbrough",
    worldRanking: 801,
    founded: 1930,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£14,000-£19,000",
    intlStudents: "2,500",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.tees.ac.uk",
    campuses: ["Middlesbrough Campus", "Darlington Campus", "Hartlepool Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Computing", "Health Sciences",
      "Arts", "Education", "Law", "Social Sciences", "Nursing"
    ],
  },

  // 60
  {
    name: "University of Lincoln",
    city: "Lincoln",
    worldRanking: 601,
    founded: 1992,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,500-£21,000",
    intlStudents: "3,000",
    totalStudents: "16,000",
    scholarships: true,
    featured: false,
    website: "https://www.lincoln.ac.uk",
    campuses: ["Brayford Pool Campus", "Riseholme Agricultural Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Computing", "Arts",
      "Health Sciences", "Life Sciences", "Law", "Architecture",
      "Agriculture", "Psychology", "Social Work"
    ],
  },

  // 61
  {
    name: "University of Plymouth",
    city: "Plymouth",
    worldRanking: 601,
    founded: 1992,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£15,000-£22,000",
    intlStudents: "3,500",
    totalStudents: "23,000",
    scholarships: true,
    featured: false,
    website: "https://www.plymouth.ac.uk",
    campuses: ["Drake Circus Campus", "Exeter Campuses"],
    country: "United Kingdom",
    subjects: [
      "Marine Sciences", "Engineering", "Business & Management", "Medicine",
      "Education", "Art & Design", "Law", "Computing",
      "Environmental Science", "Psychology", "Nursing"
    ],
  },

  // 62
  {
    name: "Keele University",
    city: "Keele",
    worldRanking: 431,
    founded: 1949,
    type: "Plate Glass",
    ieltsMin: 6.0,
    tuitionRange: "£16,500-£23,000",
    intlStudents: "3,500",
    totalStudents: "13,000",
    scholarships: true,
    featured: false,
    website: "https://www.keele.ac.uk",
    campuses: ["Keele Campus Staffordshire"],
    country: "United Kingdom",
    subjects: [
      "Medicine", "Business & Management", "Humanities", "Sciences",
      "Law", "Education", "Social Sciences", "Nursing",
      "Psychology", "Computer Science"
    ],
  },

  // 63
  {
    name: "University of the West of England (UWE Bristol)",
    city: "Bristol",
    worldRanking: 601,
    founded: 1992,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£22,000",
    intlStudents: "4,000",
    totalStudents: "30,000",
    scholarships: true,
    featured: false,
    website: "https://www.uwe.ac.uk",
    campuses: ["Frenchay Campus", "City Campus Bristol", "Glenside Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Computing", "Education",
      "Health Sciences", "Art & Design", "Architecture", "Law",
      "Social Sciences", "Nursing", "Environmental Science"
    ],
  },

  // 64
  {
    name: "Middlesex University London",
    city: "London",
    worldRanking: 801,
    founded: 1878,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£21,000",
    intlStudents: "5,000",
    totalStudents: "22,000",
    scholarships: true,
    featured: false,
    website: "https://www.mdx.ac.uk",
    campuses: ["Hendon Campus", "Dubai Campus", "Mauritius Campus", "Malta Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Law", "Engineering", "Art & Design",
      "Health Sciences", "Computing", "Social Sciences", "Education",
      "Psychology", "Nursing", "Architecture"
    ],
  },

  // 65
  {
    name: "University of Gloucestershire",
    city: "Cheltenham",
    worldRanking: 801,
    founded: 1990,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£13,500-£18,000",
    intlStudents: "2,000",
    totalStudents: "11,000",
    scholarships: true,
    featured: false,
    website: "https://www.glos.ac.uk",
    campuses: ["Francis Close Hall", "Park Campus", "Oxstalls Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Sports Science", "Education", "Computing",
      "Media & Communications", "Environment", "Social Work", "Art & Design"
    ],
  },

  // 66
  {
    name: "University of Hertfordshire",
    city: "Hatfield",
    worldRanking: 801,
    founded: 1952,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,000-£21,000",
    intlStudents: "4,000",
    totalStudents: "24,000",
    scholarships: true,
    featured: false,
    website: "https://www.herts.ac.uk",
    campuses: ["College Lane Campus", "de Havilland Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Engineering", "Computer Science", "Nursing",
      "Pharmacy", "Law", "Education", "Psychology",
      "Art & Design", "Life Sciences"
    ],
  },

  // 67
  {
    name: "Oxford Brookes University",
    city: "Oxford",
    worldRanking: 601,
    founded: 1865,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,500-£22,000",
    intlStudents: "4,500",
    totalStudents: "18,000",
    scholarships: true,
    featured: false,
    website: "https://www.brookes.ac.uk",
    campuses: ["Headington Campus", "Wheatley Campus", "Harcourt Hill Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Architecture", "Engineering", "Nursing",
      "Law", "Psychology", "Social Work", "Education",
      "Hospitality & Tourism", "Art & Design", "Computer Science"
    ],
  },

  // 68
  {
    name: "Anglia Ruskin University",
    city: "Cambridge",
    worldRanking: 801,
    founded: 1858,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£14,500-£17,500",
    intlStudents: "8,000",
    totalStudents: "35,000",
    scholarships: true,
    featured: false,
    website: "https://www.aru.ac.uk",
    campuses: ["Cambridge Campus", "Chelmsford Campus", "London Campus", "Peterborough Campus"],
    country: "United Kingdom",
    subjects: [
      "Computer Science", "Business & Management", "Engineering", "Psychology",
      "Art & Design", "Law", "Nursing", "Medicine",
      "Education", "Social Work", "Health Sciences"
    ],
  },

  // 69
  {
    name: "University of Bedfordshire",
    city: "Luton",
    worldRanking: 801,
    founded: 1882,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£13,000-£18,000",
    intlStudents: "3,000",
    totalStudents: "18,000",
    scholarships: true,
    featured: false,
    website: "https://www.beds.ac.uk",
    campuses: ["Luton Campus", "Bedford Campus", "Milton Keynes Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computer Science", "Nursing", "Education",
      "Social Work", "Law", "Psychology", "Media & Communications"
    ],
  },

  // 70
  {
    name: "University of East London",
    city: "London",
    worldRanking: 801,
    founded: 1898,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£13,000-£18,000",
    intlStudents: "4,000",
    totalStudents: "25,000",
    scholarships: true,
    featured: false,
    website: "https://www.uel.ac.uk",
    campuses: ["Stratford Campus", "Docklands Campus", "Walthamstow Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computing", "Nursing", "Psychology",
      "Architecture", "Education", "Social Work", "Law",
      "Engineering", "Art & Design"
    ],
  },

  // 71
  {
    name: "London Metropolitan University",
    city: "London",
    worldRanking: 801,
    founded: 2002,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£13,000-£18,000",
    intlStudents: "4,500",
    totalStudents: "18,000",
    scholarships: true,
    featured: false,
    website: "https://www.londonmet.ac.uk",
    campuses: ["Holloway Road Campus", "Aldgate Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computing", "Law", "Nursing",
      "Education", "Social Work", "Art & Design", "Engineering"
    ],
  },

  // 72
  {
    name: "University of West London",
    city: "London",
    worldRanking: 801,
    founded: 1860,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£13,500-£19,000",
    intlStudents: "3,500",
    totalStudents: "14,000",
    scholarships: true,
    featured: false,
    website: "https://www.uwl.ac.uk",
    campuses: ["Ealing Campus", "Brentford Campus", "Reading Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computing", "Hospitality & Tourism", "Nursing",
      "Law", "Music", "Education", "Psychology"
    ],
  },

  // 73
  {
    name: "Birmingham City University",
    city: "Birmingham",
    worldRanking: 801,
    founded: 1992,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£13,500-£18,000",
    intlStudents: "3,500",
    totalStudents: "26,000",
    scholarships: true,
    featured: false,
    website: "https://www.bcu.ac.uk",
    campuses: ["City Centre Campus", "Eastside Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computing", "Engineering", "Art & Design",
      "Architecture", "Law", "Nursing", "Education",
      "Media & Communications", "Social Sciences"
    ],
  },

  // 74
  {
    name: "University of Wolverhampton",
    city: "Wolverhampton",
    worldRanking: 801,
    founded: 1992,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£13,000-£17,500",
    intlStudents: "2,500",
    totalStudents: "20,000",
    scholarships: true,
    featured: false,
    website: "https://www.wlv.ac.uk",
    campuses: ["City Campus", "Telford Campus", "Walsall Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computing", "Engineering", "Nursing",
      "Law", "Education", "Social Sciences", "Art & Design"
    ],
  },

  // 75
  {
    name: "Staffordshire University",
    city: "Stoke-on-Trent",
    worldRanking: 801,
    founded: 1914,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£13,000-£17,000",
    intlStudents: "2,000",
    totalStudents: "13,000",
    scholarships: true,
    featured: false,
    website: "https://www.staffs.ac.uk",
    campuses: ["Stoke Campus", "London Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Computing", "Engineering", "Nursing",
      "Law", "Education", "Social Sciences", "Psychology"
    ],
  },

  // 76
  {
    name: "Canterbury Christ Church University",
    city: "Canterbury",
    worldRanking: 801,
    founded: 1962,
    type: "Modern",
    ieltsMin: 5.5,
    tuitionRange: "£13,000-£17,000",
    intlStudents: "1,800",
    totalStudents: "19,000",
    scholarships: true,
    featured: false,
    website: "https://www.canterbury.ac.uk",
    campuses: ["Canterbury Campus", "Broadstairs Campus", "Medway Campus"],
    country: "United Kingdom",
    subjects: [
      "Education", "Nursing", "Business & Management", "Computing",
      "Law", "Social Work", "Health Sciences", "Arts"
    ],
  },

  // 77
  {
    name: "University for the Creative Arts",
    city: "Farnham",
    worldRanking: 801,
    founded: 1965,
    type: "Specialized",
    ieltsMin: 6.0,
    tuitionRange: "£16,000-£22,000",
    intlStudents: "2,500",
    totalStudents: "8,000",
    scholarships: true,
    featured: false,
    website: "https://www.uca.ac.uk",
    campuses: ["Farnham Campus", "Canterbury Campus", "Rochester Campus", "Epsom Campus"],
    country: "United Kingdom",
    subjects: [
      "Fine Art", "Fashion Design", "Photography", "Graphic Design",
      "Architecture", "Film & TV Production", "Animation"
    ],
  },

  // 78
  {
    name: "Ravensbourne University London",
    city: "London",
    worldRanking: 801,
    founded: 1962,
    type: "Specialized",
    ieltsMin: 6.0,
    tuitionRange: "£16,000-£22,000",
    intlStudents: "2,000",
    totalStudents: "4,500",
    scholarships: true,
    featured: false,
    website: "https://www.ravensbourne.ac.uk",
    campuses: ["Greenwich Peninsula Campus London"],
    country: "United Kingdom",
    subjects: [
      "Fashion Design", "Digital Media", "Graphic Design",
      "Broadcast & Media Production", "Architecture & Interiors", "Animation"
    ],
  },

  // 79
  {
    name: "Goldsmiths University of London",
    city: "London",
    worldRanking: 401,
    founded: 1891,
    type: "Red Brick",
    ieltsMin: 6.5,
    tuitionRange: "£18,000-£26,000",
    intlStudents: "4,000",
    totalStudents: "11,000",
    scholarships: true,
    featured: false,
    website: "https://www.gold.ac.uk",
    campuses: ["New Cross Campus London"],
    country: "United Kingdom",
    subjects: [
      "Fine Art", "Music", "Media & Communications", "Design",
      "Psychology", "Sociology", "Computing", "English Literature",
      "Drama & Theatre", "Anthropology", "Education", "Law"
    ],
  },

  // 80
  {
    name: "University of Suffolk",
    city: "Ipswich",
    worldRanking: 0,
    founded: 2016,
    type: "Modern",
    ieltsMin: 6.0,
    tuitionRange: "£13,000-£15,000",
    intlStudents: "800",
    totalStudents: "5,500",
    scholarships: true,
    featured: false,
    website: "https://www.uos.ac.uk",
    campuses: ["Ipswich Waterfront Campus"],
    country: "United Kingdom",
    subjects: [
      "Business & Management", "Nursing", "Psychology", "Computing", "Education"
    ],
  },
];