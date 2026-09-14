#!/usr/bin/env python3
"""
ALO Full Dataset Generator — UK 140, Australia 40, Others 20, Every Month Jan2027-Jan2028, Foundation->PhD
Regenerates:
- src/lib/university-data-brics.ts (Sweden, Brazil, Russia, India, China, South Africa)
- Extends src/lib/university-data-intl.ts australiaUniversities (+15)
- Updates src/lib/all-universities.ts
- Regenerates universities.csv, courses.csv, course_intakes.csv, course_requirements.csv, english_requirements.csv, tuition_fees.csv
"""
import pathlib, csv, re, random
from collections import defaultdict

ROOT = pathlib.Path("/home/user/alo_education_z....ai")
import os
os.chdir(ROOT)

# Load existing data to get IDs
uni_csv = ROOT / "universities.csv"
course_csv = ROOT / "courses.csv"

# Read existing universities to keep
existing_unis = []
with open(uni_csv, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        existing_unis.append(row)
print(f"Existing unis: {len(existing_unis)}")
existing_ids = [u['university_id'] for u in existing_unis]
max_id_num = max(int(u.split('-')[-1]) for u in existing_ids)
print(f"max id num {max_id_num}")

# Data for new universities — as defined in previous file, but we will embed here again for generation
# We'll also generate Australia extra 15
australia_extra = [
    ("University of Canberra", "Canberra", 403, 1967, "Public", 6.5, "AUD 35,000 – AUD 45,000", "2,200", "16,000", "https://www.canberra.edu.au", ["Business & Management", "Computer Science", "Health", "Education", "Environmental Science", "Law", "Engineering", "Data Science"]),
    ("Victoria University", "Melbourne", 650, 1990, "Public", 6.0, "AUD 28,000 – AUD 35,000", "4,500", "43,000", "https://www.vu.edu.au", ["Business & Management", "Engineering", "Health", "Education", "Computer Science", "Law", "Hospitality", "Engineering"]),
    ("Western Sydney University", "Sydney", 384, 1989, "Public", 6.5, "AUD 32,000 – AUD 40,000", "5,200", "47,000", "https://www.westernsydney.edu.au", ["Medicine", "Engineering", "Business & Management", "Law", "Computer Science", "Health", "Education", "Environmental Science"]),
    ("Murdoch University", "Perth", 580, 1973, "Public", 6.0, "AUD 30,000 – AUD 38,000", "3,800", "23,000", "https://www.murdoch.edu.au", ["Environmental Science", "Business & Management", "Health", "Engineering", "Computer Science", "Law", "Psychology", "Education"]),
    ("James Cook University", "Townsville", 412, 1970, "Public", 6.0, "AUD 32,000 – AUD 40,000", "2,800", "22,000", "https://www.jcu.edu.au", ["Medicine", "Environmental Science", "Engineering", "Business & Management", "Computer Science", "Health", "Law", "Data Science"]),
    ("Charles Sturt University", "Bathurst", 801, 1989, "Public", 6.0, "AUD 28,000 – AUD 35,000", "9,500", "45,000", "https://www.csu.edu.au", ["Business & Management", "Health", "Education", "Engineering", "Computer Science", "Law", "Environmental Science", "Psychology"]),
    ("Australian Catholic University", "Melbourne", 701, 1991, "Public", 6.5, "AUD 30,000 – AUD 38,000", "3,200", "34,000", "https://www.acu.edu.au", ["Health", "Education", "Business & Management", "Law", "Psychology", "Computer Science", "Environmental Science", "Engineering"]),
    ("Southern Cross University", "Lismore", 801, 1994, "Public", 6.0, "AUD 28,000 – AUD 34,000", "1,800", "17,000", "https://www.scu.edu.au", ["Environmental Science", "Health", "Business & Management", "Engineering", "Computer Science", "Law", "Education", "Psychology"]),
    ("Federation University Australia", "Ballarat", 801, 1870, "Public", 6.0, "AUD 28,000 – AUD 33,000", "2,500", "20,000", "https://www.federation.edu.au", ["Engineering", "Business & Management", "Health", "Computer Science", "Environmental Science", "Education", "Law", "Psychology"]),
    ("University of the Sunshine Coast", "Sippy Downs", 701, 1996, "Public", 6.0, "AUD 28,000 – AUD 34,000", "1,200", "18,000", "https://www.usc.edu.au", ["Health", "Environmental Science", "Business & Management", "Computer Science", "Engineering", "Education", "Law", "Data Science"]),
    ("Edith Cowan University", "Perth", 601, 1991, "Public", 6.0, "AUD 32,000 – AUD 40,000", "3,800", "30,000", "https://www.ecu.edu.au", ["Computer Science", "Engineering", "Business & Management", "Health", "Education", "Law", "Psychology", "Environmental Science"]),
    ("University of Southern Queensland", "Toowoomba", 801, 1967, "Public", 6.0, "AUD 26,000 – AUD 32,000", "5,200", "26,000", "https://www.usq.edu.au", ["Business & Management", "Engineering", "Health", "Education", "Computer Science", "Law", "Environmental Science", "Psychology"]),
    ("Central Queensland University", "Rockhampton", 801, 1992, "Public", 6.0, "AUD 28,000 – AUD 34,000", "6,500", "35,000", "https://www.cqu.edu.au", ["Engineering", "Business & Management", "Health", "Education", "Computer Science", "Law", "Environmental Science", "Data Science"]),
    ("Torrens University Australia", "Adelaide", 1000, 2013, "Private", 6.0, "AUD 30,000 – AUD 38,000", "7,500", "19,000", "https://www.torrens.edu.au", ["Business & Management", "Health", "Hospitality", "Design", "Computer Science", "Engineering", "Education", "Law"]),
    ("University of Notre Dame Australia", "Fremantle", 801, 1989, "Private", 6.0, "AUD 32,000 – AUD 40,000", "2,100", "12,000", "https://www.nd.edu.au", ["Medicine", "Law", "Business & Management", "Health", "Education", "Psychology", "Computer Science", "Engineering"]),
]

brics = {
    "Sweden": [
        ("Lund University", "Lund", 75, 1666, "Public", 6.5, "SEK 120,000 – SEK 180,000", "4,200", "42,000", "https://www.lu.se", ["Medicine", "Engineering", "Law", "Computer Science", "Business & Management", "Data Science", "Environmental Science", "Psychology"]),
        ("Uppsala University", "Uppsala", 105, 1477, "Public", 6.5, "SEK 110,000 – SEK 170,000", "3,800", "45,000", "https://www.uu.se", ["Medicine", "Law", "Engineering", "Computer Science", "Business & Management", "Environmental Science", "Psychology", "History"]),
        ("KTH Royal Institute of Technology", "Stockholm", 73, 1827, "Public", 6.5, "SEK 130,000 – SEK 190,000", "5,100", "18,000", "https://www.kth.se", ["Engineering", "Computer Science", "Architecture", "Data Science", "Artificial Intelligence", "Mechanical Engineering", "Electrical Engineering", "Mathematics"]),
        ("Stockholm University", "Stockholm", 128, 1878, "Public", 6.5, "SEK 90,000 – SEK 150,000", "3,500", "33,000", "https://www.su.se", ["Law", "Business & Management", "Computer Science", "Psychology", "Environmental Science", "Economics", "History", "Biology"]),
        ("Chalmers University of Technology", "Gothenburg", 129, 1829, "Public", 6.5, "SEK 125,000 – SEK 185,000", "3,200", "11,000", "https://www.chalmers.se", ["Engineering", "Architecture", "Computer Science", "Data Science", "Mechanical Engineering", "Civil Engineering", "Physics", "Chemistry"]),
        ("University of Gothenburg", "Gothenburg", 187, 1891, "Public", 6.5, "SEK 95,000 – SEK 145,000", "2,900", "37,000", "https://www.gu.se", ["Medicine", "Business & Management", "Law", "Computer Science", "Psychology", "Environmental Science", "Education", "Economics"]),
        ("Linköping University", "Linköping", 320, 1969, "Public", 6.5, "SEK 85,000 – SEK 135,000", "2,100", "32,000", "https://www.liu.se", ["Engineering", "Computer Science", "Business & Management", "Medicine", "Education", "Data Science", "Environmental Science", "Psychology"]),
        ("Umeå University", "Umeå", 365, 1965, "Public", 6.5, "SEK 85,000 – SEK 130,000", "1,800", "34,000", "https://www.umu.se", ["Medicine", "Computer Science", "Environmental Science", "Business & Management", "Psychology", "Education", "Law", "Engineering"]),
        ("Karolinska Institute", "Stockholm", 6, 1810, "Public", 6.5, "SEK 150,000 – SEK 220,000", "2,400", "6,500", "https://www.ki.se", ["Medicine", "Biology", "Pharmacy", "Nursing", "Public Health", "Biochemistry", "Neuroscience", "Data Science"]),
        ("Stockholm School of Economics", "Stockholm", 450, 1909, "Private", 7.0, "SEK 180,000 – SEK 250,000", "1,200", "2,400", "https://www.hhs.se", ["Business & Management", "Economics", "Finance & Accounting", "Data Science", "International Relations", "Law", "Computer Science", "Entrepreneurship"]),
        ("Luleå University of Technology", "Luleå", 600, 1971, "Public", 6.0, "SEK 80,000 – SEK 120,000", "900", "14,000", "https://www.ltu.se", ["Engineering", "Computer Science", "Business & Management", "Environmental Science", "Architecture", "Data Science", "Physics", "Mechanical Engineering"]),
        ("Örebro University", "Örebro", 700, 1999, "Public", 6.0, "SEK 75,000 – SEK 115,000", "800", "17,000", "https://www.oru.se", ["Medicine", "Law", "Business & Management", "Computer Science", "Psychology", "Education", "Engineering", "Environmental Science"]),
        ("Mid Sweden University", "Sundsvall", 850, 1993, "Public", 6.0, "SEK 70,000 – SEK 110,000", "600", "13,000", "https://www.miun.se", ["Engineering", "Computer Science", "Business & Management", "Environmental Science", "Psychology", "Education", "Law", "Data Science"]),
        ("Malmö University", "Malmö", 720, 1998, "Public", 6.0, "SEK 80,000 – SEK 125,000", "1,100", "24,000", "https://www.mau.se", ["Computer Science", "Business & Management", "Health", "Education", "Engineering", "Media & Communications", "Law", "Environmental Science"]),
        ("Karlstad University", "Karlstad", 800, 1977, "Public", 6.0, "SEK 75,000 – SEK 115,000", "700", "16,000", "https://www.kau.se", ["Computer Science", "Business & Management", "Engineering", "Psychology", "Education", "Environmental Science", "Law", "Data Science"]),
        ("Linnaeus University", "Växjö", 780, 2010, "Public", 6.0, "SEK 80,000 – SEK 120,000", "1,300", "31,000", "https://www.lnu.se", ["Computer Science", "Business & Management", "Engineering", "Environmental Science", "Psychology", "Education", "Law", "Data Science"]),
        ("University of Borås", "Borås", 900, 1977, "Public", 6.0, "SEK 70,000 – SEK 105,000", "500", "11,000", "https://www.hb.se", ["Engineering", "Business & Management", "Computer Science", "Design", "Environmental Science", "Law", "Education", "Psychology"]),
        ("Mälardalen University", "Västerås", 880, 1977, "Public", 6.0, "SEK 75,000 – SEK 115,000", "800", "16,000", "https://www.mdu.se", ["Engineering", "Computer Science", "Business & Management", "Health", "Education", "Environmental Science", "Data Science", "Mathematics"]),
        ("Jönköping University", "Jönköping", 650, 1977, "Private", 6.5, "SEK 100,000 – SEK 150,000", "1,500", "12,000", "https://www.ju.se", ["Business & Management", "Engineering", "Computer Science", "Health", "Education", "Law", "Data Science", "International Relations"]),
        ("Swedish University of Agricultural Sciences", "Uppsala", 280, 1977, "Public", 6.5, "SEK 90,000 – SEK 140,000", "1,000", "4,000", "https://www.slu.se", ["Environmental Science", "Biology", "Veterinary Science", "Engineering", "Computer Science", "Agriculture", "Data Science", "Ecology"]),
    ],
    "Brazil": [
        ("University of São Paulo", "São Paulo", 85, 1934, "Public", 6.0, "BRL 10,000 – BRL 30,000", "5,000", "97,000", "https://www.usp.br", ["Medicine", "Engineering", "Law", "Computer Science", "Business & Management", "Data Science", "Biology", "Economics"]),
        ("University of Campinas", "Campinas", 210, 1966, "Public", 6.0, "BRL 8,000 – BRL 25,000", "3,200", "34,000", "https://www.unicamp.br", ["Engineering", "Computer Science", "Medicine", "Business & Management", "Data Science", "Biology", "Chemistry", "Physics"]),
        ("Federal University of Rio de Janeiro", "Rio de Janeiro", 350, 1920, "Public", 6.0, "BRL 5,000 – BRL 20,000", "2,800", "67,000", "https://www.ufrj.br", ["Medicine", "Engineering", "Law", "Computer Science", "Business & Management", "Environmental Science", "Economics", "History"]),
        ("São Paulo State University", "São Paulo", 480, 1976, "Public", 6.0, "BRL 6,000 – BRL 18,000", "2,100", "50,000", "https://www.unesp.br", ["Engineering", "Computer Science", "Business & Management", "Environmental Science", "Law", "Education", "Medicine", "Data Science"]),
        ("Federal University of Minas Gerais", "Belo Horizonte", 550, 1927, "Public", 6.0, "BRL 5,000 – BRL 15,000", "1,900", "49,000", "https://www.ufmg.br", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Environmental Science", "Economics", "Biology"]),
        ("Pontifical Catholic University of Rio de Janeiro", "Rio de Janeiro", 600, 1940, "Private", 6.5, "BRL 30,000 – BRL 60,000", "2,500", "15,000", "https://www.puc-rio.br", ["Business & Management", "Engineering", "Computer Science", "Law", "Economics", "International Relations", "Design", "Data Science"]),
        ("Federal University of Rio Grande do Sul", "Porto Alegre", 580, 1934, "Public", 6.0, "BRL 5,000 – BRL 12,000", "1,600", "31,000", "https://www.ufrgs.br", ["Engineering", "Computer Science", "Medicine", "Law", "Business & Management", "Environmental Science", "Economics", "Psychology"]),
        ("University of Brasília", "Brasília", 670, 1962, "Public", 6.0, "BRL 5,000 – BRL 15,000", "1,400", "31,000", "https://www.unb.br", ["Law", "Engineering", "Computer Science", "Business & Management", "International Relations", "Medicine", "Environmental Science", "Economics"]),
        ("Federal University of São Carlos", "São Carlos", 750, 1968, "Public", 6.0, "BRL 4,000 – BRL 10,000", "900", "16,000", "https://www.ufscar.br", ["Engineering", "Computer Science", "Business & Management", "Environmental Science", "Education", "Data Science", "Physics", "Chemistry"]),
        ("Pontifical Catholic University of São Paulo", "São Paulo", 800, 1946, "Private", 6.0, "BRL 25,000 – BRL 50,000", "1,100", "27,000", "https://www.pucsp.br", ["Law", "Business & Management", "Computer Science", "Economics", "Psychology", "Education", "International Relations", "Media & Communications"]),
        ("Federal University of Pernambuco", "Recife", 780, 1946, "Public", 6.0, "BRL 5,000 – BRL 12,000", "1,200", "30,000", "https://www.ufpe.br", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Environmental Science", "Economics", "History"]),
        ("Federal University of Paraná", "Curitiba", 820, 1912, "Public", 6.0, "BRL 5,000 – BRL 10,000", "1,000", "31,000", "https://www.ufpr.br", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Environmental Science", "Economics", "Biology"]),
        ("Federal University of Ceará", "Fortaleza", 850, 1954, "Public", 6.0, "BRL 4,000 – BRL 10,000", "800", "26,000", "https://www.ufc.br", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Economics", "Environmental Science", "Education"]),
        ("Fluminense Federal University", "Niterói", 900, 1960, "Public", 6.0, "BRL 4,000 – BRL 10,000", "700", "28,000", "https://www.uff.br", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Economics", "Environmental Science", "Psychology"]),
        ("University of Fortaleza", "Fortaleza", 950, 1973, "Private", 6.0, "BRL 20,000 – BRL 40,000", "600", "28,000", "https://www.unifor.br", ["Business & Management", "Engineering", "Computer Science", "Law", "Medicine", "Architecture", "Design", "Data Science"]),
        ("Mackenzie Presbyterian University", "São Paulo", 1000, 1952, "Private", 6.0, "BRL 22,000 – BRL 45,000", "800", "45,000", "https://www.mackenzie.br", ["Engineering", "Computer Science", "Business & Management", "Law", "Architecture", "Economics", "Psychology", "Design"]),
        ("Federal University of Goiás", "Goiânia", 880, 1960, "Public", 6.0, "BRL 5,000 – BRL 12,000", "700", "27,000", "https://www.ufg.br", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Environmental Science", "Economics", "Education"]),
        ("Federal University of Santa Catarina", "Florianópolis", 620, 1960, "Public", 6.0, "BRL 5,000 – BRL 15,000", "1,300", "30,000", "https://www.ufsc.br", ["Engineering", "Computer Science", "Medicine", "Law", "Business & Management", "Environmental Science", "Economics", "Design"]),
        ("State University of Maringá", "Maringá", 920, 1969, "Public", 6.0, "BRL 4,000 – BRL 10,000", "500", "20,000", "https://www.uem.br", ["Engineering", "Computer Science", "Business & Management", "Environmental Science", "Medicine", "Law", "Education", "Psychology"]),
        ("Federal University of Bahia", "Salvador", 840, 1946, "Public", 6.0, "BRL 5,000 – BRL 12,000", "1,000", "27,000", "https://www.ufba.br", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Environmental Science", "Economics", "History"]),
    ],
    "Russia": [
        ("Lomonosov Moscow State University", "Moscow", 75, 1755, "Public", 6.0, "RUB 300,000 – RUB 500,000", "6,500", "38,000", "https://www.msu.ru", ["Medicine", "Law", "Engineering", "Computer Science", "Business & Management", "Physics", "Data Science", "International Relations"]),
        ("Saint Petersburg State University", "Saint Petersburg", 242, 1724, "Public", 6.0, "RUB 250,000 – RUB 450,000", "4,200", "32,000", "https://www.spbu.ru", ["Law", "International Relations", "Computer Science", "Business & Management", "Medicine", "Engineering", "Economics", "History"]),
        ("Novosibirsk State University", "Novosibirsk", 228, 1958, "Public", 6.0, "RUB 200,000 – RUB 350,000", "1,800", "8,000", "https://www.nsu.ru", ["Physics", "Computer Science", "Mathematics", "Biology", "Engineering", "Data Science", "Chemistry", "Economics"]),
        ("Tomsk State University", "Tomsk", 264, 1878, "Public", 6.0, "RUB 180,000 – RUB 300,000", "1,500", "15,000", "https://www.tsu.ru", ["Computer Science", "Engineering", "Business & Management", "Law", "Medicine", "Environmental Science", "Data Science", "Physics"]),
        ("Moscow Institute of Physics and Technology", "Moscow", 281, 1951, "Public", 6.5, "RUB 300,000 – RUB 500,000", "1,200", "7,000", "https://www.mipt.ru", ["Physics", "Computer Science", "Engineering", "Mathematics", "Data Science", "Artificial Intelligence", "Electrical Engineering", "Mechanical Engineering"]),
        ("Higher School of Economics", "Moscow", 305, 1992, "Public", 6.5, "RUB 350,000 – RUB 600,000", "4,500", "35,000", "https://www.hse.ru", ["Business & Management", "Economics", "Computer Science", "Law", "International Relations", "Data Science", "Finance & Accounting", "Psychology"]),
        ("Kazan Federal University", "Kazan", 370, 1804, "Public", 6.0, "RUB 180,000 – RUB 300,000", "2,800", "32,000", "https://www.kpfu.ru", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Environmental Science", "Economics", "Biology"]),
        ("Ural Federal University", "Yekaterinburg", 516, 1920, "Public", 6.0, "RUB 150,000 – RUB 280,000", "2,200", "35,000", "https://www.urfu.ru", ["Engineering", "Computer Science", "Business & Management", "Medicine", "Environmental Science", "Economics", "Law", "Data Science"]),
        ("People's Friendship University of Russia", "Moscow", 392, 1960, "Public", 6.0, "RUB 250,000 – RUB 400,000", "7,500", "31,000", "https://www.rudn.ru", ["Medicine", "Engineering", "Law", "International Relations", "Computer Science", "Business & Management", "Environmental Science", "Economics"]),
        ("Far Eastern Federal University", "Vladivostok", 631, 1899, "Public", 6.0, "RUB 150,000 – RUB 250,000", "3,500", "23,000", "https://www.dvfu.ru", ["Engineering", "Computer Science", "Business & Management", "Medicine", "International Relations", "Environmental Science", "Law", "Economics"]),
        ("MISIS University", "Moscow", 500, 1918, "Public", 6.0, "RUB 200,000 – RUB 350,000", "1,800", "8,500", "https://www.misis.ru", ["Engineering", "Computer Science", "Data Science", "Physics", "Business & Management", "Environmental Science", "Mechanical Engineering", "Electrical Engineering"]),
        ("Lobachevsky University", "Nizhny Novgorod", 700, 1916, "Public", 6.0, "RUB 150,000 – RUB 250,000", "900", "27,000", "https://www.unn.ru", ["Computer Science", "Engineering", "Business & Management", "Law", "Medicine", "Environmental Science", "Economics", "Data Science"]),
        ("Siberian Federal University", "Krasnoyarsk", 750, 2006, "Public", 6.0, "RUB 140,000 – RUB 220,000", "1,500", "31,000", "https://www.sfu-kras.ru", ["Engineering", "Computer Science", "Business & Management", "Environmental Science", "Law", "Economics", "Medicine", "Data Science"]),
        ("Southern Federal University", "Rostov-on-Don", 780, 1915, "Public", 6.0, "RUB 130,000 – RUB 210,000", "1,200", "25,000", "https://www.sfedu.ru", ["Engineering", "Computer Science", "Business & Management", "Law", "Environmental Science", "Economics", "Education", "Data Science"]),
        ("Peter the Great St. Petersburg Polytechnic University", "Saint Petersburg", 400, 1899, "Public", 6.0, "RUB 180,000 – RUB 320,000", "4,500", "30,000", "https://www.spbstu.ru", ["Engineering", "Computer Science", "Business & Management", "Medicine", "Environmental Science", "Economics", "Architecture", "Data Science"]),
        ("ITMO University", "Saint Petersburg", 350, 1900, "Public", 6.5, "RUB 200,000 – RUB 350,000", "3,200", "13,000", "https://www.itmo.ru", ["Computer Science", "Engineering", "Data Science", "Physics", "Business & Management", "Artificial Intelligence", "Electrical Engineering", "Mathematics"]),
        ("MGIMO University", "Moscow", 345, 1944, "Public", 6.5, "RUB 400,000 – RUB 650,000", "1,500", "9,000", "https://www.mgimo.ru", ["International Relations", "Law", "Business & Management", "Economics", "Computer Science", "Journalism", "Political Science", "Data Science"]),
        ("MEPhI National Research Nuclear University", "Moscow", 450, 1942, "Public", 6.0, "RUB 180,000 – RUB 300,000", "1,000", "7,500", "https://www.mephi.ru", ["Engineering", "Physics", "Computer Science", "Data Science", "Electrical Engineering", "Mechanical Engineering", "Environmental Science", "Business & Management"]),
        ("Bauman Moscow State Technical University", "Moscow", 320, 1830, "Public", 6.0, "RUB 220,000 – RUB 380,000", "2,000", "19,000", "https://www.bmstu.ru", ["Engineering", "Computer Science", "Mechanical Engineering", "Electrical Engineering", "Data Science", "Physics", "Business & Management", "Architecture"]),
        ("Sechenov First Moscow State Medical University", "Moscow", 850, 1758, "Public", 6.0, "RUB 300,000 – RUB 500,000", "2,200", "18,000", "https://www.sechenov.ru", ["Medicine", "Pharmacy", "Nursing", "Biology", "Public Health", "Computer Science", "Data Science", "Biochemistry"]),
    ],
    "India": [
        ("Indian Institute of Science", "Bangalore", 155, 1909, "Public", 6.5, "INR 200,000 – INR 400,000", "800", "4,000", "https://www.iisc.ac.in", ["Computer Science", "Engineering", "Data Science", "Physics", "Biology", "Mathematics", "Environmental Science", "Artificial Intelligence"]),
        ("IIT Bombay", "Mumbai", 118, 1958, "Public", 6.5, "INR 200,000 – INR 300,000", "2,500", "11,000", "https://www.iitb.ac.in", ["Engineering", "Computer Science", "Business & Management", "Data Science", "Physics", "Mechanical Engineering", "Electrical Engineering", "Mathematics"]),
        ("IIT Delhi", "New Delhi", 123, 1961, "Public", 6.5, "INR 200,000 – INR 300,000", "2,800", "11,000", "https://www.iitd.ac.in", ["Engineering", "Computer Science", "Business & Management", "Data Science", "Physics", "Mechanical Engineering", "Electrical Engineering", "Mathematics"]),
        ("IIT Madras", "Chennai", 148, 1959, "Public", 6.5, "INR 190,000 – INR 280,000", "2,200", "10,000", "https://www.iitm.ac.in", ["Engineering", "Computer Science", "Data Science", "Physics", "Business & Management", "Mechanical Engineering", "Electrical Engineering", "Ocean Engineering"]),
        ("University of Delhi", "New Delhi", 407, 1922, "Public", 6.5, "INR 50,000 – INR 150,000", "5,500", "33,000", "https://www.du.ac.in", ["Law", "Business & Management", "Computer Science", "Economics", "History", "Psychology", "Environmental Science", "Mathematics"]),
        ("IIT Kharagpur", "Kharagpur", 222, 1951, "Public", 6.5, "INR 180,000 – INR 270,000", "2,000", "10,000", "https://www.iitkgp.ac.in", ["Engineering", "Computer Science", "Business & Management", "Data Science", "Physics", "Mechanical Engineering", "Electrical Engineering", "Law"]),
        ("IIT Kanpur", "Kanpur", 222, 1959, "Public", 6.5, "INR 190,000 – INR 280,000", "1,900", "9,500", "https://www.iitk.ac.in", ["Engineering", "Computer Science", "Business & Management", "Data Science", "Physics", "Mechanical Engineering", "Electrical Engineering", "Mathematics"]),
        ("University of Mumbai", "Mumbai", 580, 1857, "Public", 6.0, "INR 40,000 – INR 120,000", "3,500", "49,000", "https://www.mu.ac.in", ["Business & Management", "Computer Science", "Law", "Medicine", "Engineering", "Economics", "Psychology", "Environmental Science"]),
        ("Jawaharlal Nehru University", "New Delhi", 520, 1969, "Public", 6.5, "INR 1,000 – INR 10,000", "800", "8,500", "https://www.jnu.ac.in", ["International Relations", "Law", "Economics", "Computer Science", "Environmental Science", "History", "Psychology", "Data Science"]),
        ("University of Calcutta", "Kolkata", 800, 1857, "Public", 6.0, "INR 30,000 – INR 100,000", "2,200", "22,000", "https://www.caluniv.ac.in", ["Law", "Business & Management", "Computer Science", "Economics", "History", "Psychology", "Environmental Science", "Medicine"]),
        ("Banaras Hindu University", "Varanasi", 600, 1916, "Public", 6.0, "INR 20,000 – INR 80,000", "1,800", "30,000", "https://www.bhu.ac.in", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Environmental Science", "Economics", "Biology"]),
        ("Amity University", "Noida", 1000, 2005, "Private", 6.0, "INR 200,000 – INR 400,000", "6,500", "35,000", "https://www.amity.edu", ["Business & Management", "Engineering", "Computer Science", "Law", "Medicine", "Architecture", "Design", "Data Science"]),
        ("VIT Vellore", "Vellore", 700, 1984, "Private", 6.0, "INR 180,000 – INR 350,000", "5,800", "36,000", "https://www.vit.ac.in", ["Engineering", "Computer Science", "Business & Management", "Law", "Medicine", "Design", "Data Science", "Mechanical Engineering"]),
        ("BITS Pilani", "Pilani", 881, 1964, "Private", 6.5, "INR 200,000 – INR 450,000", "2,400", "14,000", "https://www.bits-pilani.ac.in", ["Engineering", "Computer Science", "Business & Management", "Data Science", "Physics", "Chemistry", "Economics", "Mathematics"]),
        ("Manipal Academy of Higher Education", "Manipal", 750, 1953, "Private", 6.0, "INR 250,000 – INR 500,000", "5,200", "28,000", "https://www.manipal.edu", ["Medicine", "Engineering", "Business & Management", "Computer Science", "Law", "Architecture", "Design", "Data Science"]),
        ("Jamia Millia Islamia", "New Delhi", 600, 1920, "Public", 6.0, "INR 10,000 – INR 50,000", "1,500", "22,000", "https://www.jmi.ac.in", ["Law", "Engineering", "Computer Science", "Business & Management", "History", "Psychology", "Environmental Science", "Education"]),
        ("University of Hyderabad", "Hyderabad", 650, 1974, "Public", 6.5, "INR 20,000 – INR 80,000", "1,200", "5,000", "https://www.uohyd.ac.in", ["Computer Science", "Engineering", "Business & Management", "Economics", "History", "Psychology", "Environmental Science", "Data Science"]),
        ("Aligarh Muslim University", "Aligarh", 700, 1920, "Public", 6.0, "INR 15,000 – INR 60,000", "1,600", "31,000", "https://www.amu.ac.in", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Environmental Science", "Economics", "History"]),
        ("Anna University", "Chennai", 400, 1978, "Public", 6.0, "INR 50,000 – INR 120,000", "1,800", "29,000", "https://www.annauniv.edu", ["Engineering", "Computer Science", "Business & Management", "Architecture", "Data Science", "Environmental Science", "Mechanical Engineering", "Electrical Engineering"]),
        ("Jadavpur University", "Kolkata", 800, 1955, "Public", 6.0, "INR 5,000 – INR 40,000", "1,100", "13,000", "https://www.jaduniv.edu.in", ["Engineering", "Computer Science", "Business & Management", "Law", "History", "Economics", "Environmental Science", "Psychology"]),
    ],
    "China": [
        ("Tsinghua University", "Beijing", 14, 1911, "Public", 6.5, "CNY 30,000 – CNY 60,000", "4,500", "50,000", "https://www.tsinghua.edu.cn", ["Engineering", "Computer Science", "Business & Management", "Architecture", "Data Science", "Physics", "Economics", "Law"]),
        ("Peking University", "Beijing", 14, 1898, "Public", 6.5, "CNY 30,000 – CNY 60,000", "5,200", "44,000", "https://www.pku.edu.cn", ["Medicine", "Law", "Business & Management", "Computer Science", "Economics", "History", "Environmental Science", "Psychology"]),
        ("Fudan University", "Shanghai", 39, 1905, "Public", 6.5, "CNY 28,000 – CNY 55,000", "3,800", "32,000", "https://www.fudan.edu.cn", ["Medicine", "Business & Management", "Computer Science", "Law", "Economics", "Environmental Science", "Psychology", "Data Science"]),
        ("Zhejiang University", "Hangzhou", 47, 1897, "Public", 6.5, "CNY 28,000 – CNY 50,000", "6,800", "55,000", "https://www.zju.edu.cn", ["Engineering", "Computer Science", "Medicine", "Business & Management", "Law", "Environmental Science", "Data Science", "Economics"]),
        ("Shanghai Jiao Tong University", "Shanghai", 46, 1896, "Public", 6.5, "CNY 30,000 – CNY 60,000", "4,200", "46,000", "https://www.sjtu.edu.cn", ["Engineering", "Computer Science", "Medicine", "Business & Management", "Law", "Data Science", "Physics", "Economics"]),
        ("USTC", "Hefei", 82, 1958, "Public", 6.5, "CNY 25,000 – CNY 45,000", "1,500", "16,000", "https://www.ustc.edu.cn", ["Physics", "Computer Science", "Engineering", "Mathematics", "Data Science", "Chemistry", "Biology", "Environmental Science"]),
        ("Nanjing University", "Nanjing", 133, 1902, "Public", 6.5, "CNY 25,000 – CNY 50,000", "3,200", "35,000", "https://www.nju.edu.cn", ["Computer Science", "Business & Management", "Law", "Medicine", "Environmental Science", "Economics", "History", "Data Science"]),
        ("Wuhan University", "Wuhan", 194, 1893, "Public", 6.0, "CNY 20,000 – CNY 40,000", "3,500", "53,000", "https://www.whu.edu.cn", ["Medicine", "Engineering", "Computer Science", "Law", "Business & Management", "Environmental Science", "Economics", "History"]),
        ("Sun Yat-sen University", "Guangzhou", 260, 1924, "Public", 6.0, "CNY 22,000 – CNY 42,000", "4,800", "64,000", "https://www.sysu.edu.cn", ["Medicine", "Business & Management", "Computer Science", "Law", "Engineering", "Environmental Science", "Economics", "Psychology"]),
        ("Harbin Institute of Technology", "Harbin", 174, 1920, "Public", 6.5, "CNY 28,000 – CNY 55,000", "2,800", "35,000", "https://www.hit.edu.cn", ["Engineering", "Computer Science", "Business & Management", "Architecture", "Data Science", "Physics", "Mechanical Engineering", "Electrical Engineering"]),
        ("Tongji University", "Shanghai", 192, 1907, "Public", 6.0, "CNY 25,000 – CNY 45,000", "4,500", "35,000", "https://www.tongji.edu.cn", ["Engineering", "Architecture", "Computer Science", "Business & Management", "Environmental Science", "Law", "Economics", "Data Science"]),
        ("Beijing Normal University", "Beijing", 247, 1902, "Public", 6.0, "CNY 20,000 – CNY 35,000", "2,200", "24,000", "https://www.bnu.edu.cn", ["Education", "Psychology", "Computer Science", "Business & Management", "Environmental Science", "History", "Economics", "Law"]),
        ("Xiamen University", "Xiamen", 352, 1921, "Public", 6.0, "CNY 20,000 – CNY 35,000", "3,000", "30,000", "https://www.xmu.edu.cn", ["Business & Management", "Computer Science", "Law", "Economics", "Environmental Science", "Medicine", "Engineering", "History"]),
        ("HUST", "Wuhan", 158, 1952, "Public", 6.0, "CNY 22,000 – CNY 40,000", "3,800", "55,000", "https://www.hust.edu.cn", ["Engineering", "Computer Science", "Medicine", "Business & Management", "Law", "Environmental Science", "Economics", "Data Science"]),
        ("South China University of Technology", "Guangzhou", 336, 1952, "Public", 6.0, "CNY 20,000 – CNY 35,000", "2,500", "45,000", "https://www.scut.edu.cn", ["Engineering", "Computer Science", "Business & Management", "Architecture", "Environmental Science", "Law", "Economics", "Data Science"]),
        ("Tianjin University", "Tianjin", 307, 1895, "Public", 6.0, "CNY 22,000 – CNY 40,000", "2,200", "31,000", "https://www.tju.edu.cn", ["Engineering", "Computer Science", "Business & Management", "Architecture", "Environmental Science", "Law", "Economics", "Data Science"]),
        ("Beihang University", "Beijing", 242, 1952, "Public", 6.5, "CNY 25,000 – CNY 45,000", "2,000", "30,000", "https://www.buaa.edu.cn", ["Engineering", "Computer Science", "Business & Management", "Data Science", "Physics", "Mechanical Engineering", "Electrical Engineering", "Mathematics"]),
        ("Southeast University", "Nanjing", 355, 1902, "Public", 6.0, "CNY 20,000 – CNY 35,000", "2,800", "32,000", "https://www.seu.edu.cn", ["Engineering", "Computer Science", "Business & Management", "Architecture", "Environmental Science", "Law", "Economics", "Data Science"]),
        ("Nankai University", "Tianjin", 315, 1919, "Public", 6.0, "CNY 20,000 – CNY 35,000", "2,400", "26,000", "https://www.nankai.edu.cn", ["Business & Management", "Computer Science", "Law", "Medicine", "Environmental Science", "Economics", "History", "Data Science"]),
        ("Xi'an Jiaotong University", "Xi'an", 269, 1896, "Public", 6.0, "CNY 22,000 – CNY 40,000", "3,500", "48,000", "https://www.xjtu.edu.cn", ["Engineering", "Computer Science", "Medicine", "Business & Management", "Law", "Environmental Science", "Economics", "Data Science"]),
    ],
    "South Africa": [
        ("University of Cape Town", "Cape Town", 171, 1829, "Public", 6.5, "ZAR 60,000 – ZAR 120,000", "4,500", "29,000", "https://www.uct.ac.za", ["Medicine", "Engineering", "Business & Management", "Law", "Computer Science", "Environmental Science", "Economics", "Data Science"]),
        ("University of the Witwatersrand", "Johannesburg", 264, 1922, "Public", 6.5, "ZAR 55,000 – ZAR 110,000", "5,200", "40,000", "https://www.wits.ac.za", ["Medicine", "Engineering", "Business & Management", "Law", "Computer Science", "Environmental Science", "Economics", "History"]),
        ("Stellenbosch University", "Stellenbosch", 283, 1918, "Public", 6.5, "ZAR 50,000 – ZAR 100,000", "3,800", "32,000", "https://www.sun.ac.za", ["Engineering", "Business & Management", "Medicine", "Law", "Computer Science", "Environmental Science", "Economics", "Agriculture"]),
        ("University of Pretoria", "Pretoria", 323, 1908, "Public", 6.0, "ZAR 45,000 – ZAR 95,000", "6,500", "53,000", "https://www.up.ac.za", ["Medicine", "Engineering", "Business & Management", "Law", "Computer Science", "Environmental Science", "Economics", "Education"]),
        ("University of Johannesburg", "Johannesburg", 363, 2005, "Public", 6.0, "ZAR 40,000 – ZAR 80,000", "5,800", "50,000", "https://www.uj.ac.za", ["Engineering", "Business & Management", "Computer Science", "Law", "Medicine", "Environmental Science", "Economics", "Education"]),
        ("University of KwaZulu-Natal", "Durban", 445, 2004, "Public", 6.0, "ZAR 40,000 – ZAR 75,000", "4,200", "46,000", "https://www.ukzn.ac.za", ["Medicine", "Engineering", "Business & Management", "Law", "Computer Science", "Environmental Science", "Economics", "Education"]),
        ("University of the Western Cape", "Cape Town", 601, 1960, "Public", 6.0, "ZAR 35,000 – ZAR 65,000", "2,500", "23,000", "https://www.uwc.ac.za", ["Law", "Business & Management", "Computer Science", "Medicine", "Environmental Science", "Education", "Economics", "Psychology"]),
        ("Rhodes University", "Grahamstown", 701, 1904, "Public", 6.5, "ZAR 50,000 – ZAR 90,000", "1,500", "8,000", "https://www.ru.ac.za", ["Law", "Business & Management", "Computer Science", "Environmental Science", "History", "Psychology", "Economics", "Education"]),
        ("North-West University", "Potchefstroom", 801, 2004, "Public", 6.0, "ZAR 35,000 – ZAR 70,000", "3,200", "64,000", "https://www.nwu.ac.za", ["Engineering", "Business & Management", "Computer Science", "Law", "Medicine", "Environmental Science", "Economics", "Education"]),
        ("University of South Africa", "Pretoria", 1000, 1873, "Public", 6.0, "ZAR 20,000 – ZAR 40,000", "8,000", "300,000", "https://www.unisa.ac.za", ["Business & Management", "Law", "Computer Science", "Education", "Environmental Science", "Economics", "Psychology", "Engineering"]),
        ("Nelson Mandela University", "Port Elizabeth", 1001, 2005, "Public", 6.0, "ZAR 35,000 – ZAR 65,000", "2,800", "28,000", "https://www.mandela.ac.za", ["Engineering", "Business & Management", "Computer Science", "Law", "Medicine", "Environmental Science", "Education", "Economics"]),
        ("University of Fort Hare", "Alice", 1200, 1916, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "900", "13,000", "https://www.ufh.ac.za", ["Law", "Business & Management", "Computer Science", "Environmental Science", "Education", "Economics", "Psychology", "History"]),
        ("University of Limpopo", "Polokwane", 1200, 2005, "Public", 6.0, "ZAR 30,000 – ZAR 60,000", "1,100", "23,000", "https://www.ul.ac.za", ["Medicine", "Business & Management", "Computer Science", "Law", "Environmental Science", "Economics", "Education", "Psychology"]),
        ("Tshwane University of Technology", "Pretoria", 1000, 2004, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "3,500", "60,000", "https://www.tut.ac.za", ["Engineering", "Computer Science", "Business & Management", "Environmental Science", "Law", "Education", "Economics", "Design"]),
        ("Durban University of Technology", "Durban", 1000, 2002, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "2,200", "33,000", "https://www.dut.ac.za", ["Engineering", "Business & Management", "Computer Science", "Environmental Science", "Law", "Education", "Economics", "Design"]),
        ("Central University of Technology", "Bloemfontein", 1200, 1981, "Public", 6.0, "ZAR 30,000 – ZAR 50,000", "1,200", "21,000", "https://www.cut.ac.za", ["Engineering", "Computer Science", "Business & Management", "Environmental Science", "Law", "Education", "Economics", "Health"]),
        ("Cape Peninsula University of Technology", "Cape Town", 1000, 2005, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "1,800", "33,000", "https://www.cput.ac.za", ["Engineering", "Business & Management", "Computer Science", "Environmental Science", "Health", "Education", "Economics", "Design"]),
        ("University of Zululand", "KwaDlangezwa", 1200, 1960, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "1,000", "17,000", "https://www.unizulu.ac.za", ["Education", "Business & Management", "Computer Science", "Law", "Environmental Science", "Economics", "Psychology", "History"]),
        ("Walter Sisulu University", "Mthatha", 1200, 2005, "Public", 6.0, "ZAR 30,000 – ZAR 50,000", "1,500", "24,000", "https://www.wsu.ac.za", ["Medicine", "Engineering", "Business & Management", "Computer Science", "Law", "Environmental Science", "Education", "Economics"]),
        ("Sefako Makgatho University", "Ga-Rankuwa", 1200, 2014, "Public", 6.0, "ZAR 35,000 – ZAR 60,000", "800", "7,000", "https://www.smu.ac.za", ["Medicine", "Pharmacy", "Nursing", "Computer Science", "Business & Management", "Environmental Science", "Public Health", "Data Science"]),
    ],
}

# Now we need to:
# - Generate src/lib/university-data-brics.ts
# - Append Australia extra to intl file
# - Update all-universities.ts

# Generate BRICS file
brics_path = ROOT / "src/lib/university-data-brics.ts"
with open(brics_path, 'w', encoding='utf-8') as f:
    f.write('export interface UniData {\n  name: string;\n  city: string;\n  worldRanking: number;\n  founded: number;\n  type: string;\n  ieltsMin: number;\n  tuitionRange: string;\n  intlStudents: string;\n  totalStudents: string;\n  scholarships: boolean;\n  featured: boolean;\n  website: string;\n  subjects: string[];\n}\n\n')
    for country_key, unis in brics.items():
        var_name = country_key.replace('-','').lower() + "Universities"
        # map country_key to var: sweden->swedenUniversities, south-africa -> southAfricaUniversities
        mapping = {
            "sweden": "swedenUniversities",
            "brazil": "brazilUniversities",
            "russia": "russiaUniversities",
            "india": "indiaUniversities",
            "china": "chinaUniversities",
            "south-africa": "southAfricaUniversities",
            "South Africa": "southAfricaUniversities",
        }
        # our dict keys are lower case without hyphen: "sweden", "brazil", "russia", "india", "china", "south-africa"
        if country_key == "south-africa":
            var_name = "southAfricaUniversities"
        elif country_key == "sweden":
            var_name = "swedenUniversities"
        elif country_key == "brazil":
            var_name = "brazilUniversities"
        elif country_key == "russia":
            var_name = "russiaUniversities"
        elif country_key == "india":
            var_name = "indiaUniversities"
        elif country_key == "china":
            var_name = "chinaUniversities"
        f.write(f"export const {var_name}: UniData[] = [\n")
        for (name, city, ranking, founded, typ, ielts, tuition, intlS, totalS, website, subjects) in unis:
            subjects_str = ", ".join(f'"{s}"' for s in subjects)
            f.write(f'  {{ name: "{name}", city: "{city}", worldRanking: {ranking}, founded: {founded}, type: "{typ}", ieltsMin: {ielts}, tuitionRange: "{tuition}", intlStudents: "{intlS}", totalStudents: "{totalS}", scholarships: true, featured: {"true" if ranking < 200 else "false"}, website: "{website}", subjects: [{subjects_str}] }},\n')
        f.write("];\n\n")

print(f"Generated {brics_path}")

# Now update australiaUniversities in src/lib/university-data-intl.ts to add extra 15
intl_path = ROOT / "src/lib/university-data-intl.ts"
intl_text = intl_path.read_text()
# Find australiaUniversities array end
# It has 25 entries, we need to add 15 more before the closing ];
# Locate the block
import re
pattern = r'(export const australiaUniversities: UniData\[\] = \[)(.*?)(\];)'
m = re.search(pattern, intl_text, flags=re.DOTALL)
if m:
    before = intl_text[:m.end(2)]
    after = intl_text[m.start(3):]
    # Generate entries for extra
    extra_str = ""
    for (name, city, ranking, founded, typ, ielts, tuition, intlS, totalS, website, subjects) in australia_extra:
        subjects_str = ", ".join(f'"{s}"' for s in subjects)
        extra_str += f'  {{ name: "{name}", city: "{city}", worldRanking: {ranking}, founded: {founded}, type: "{typ}", ieltsMin: {ielts}, tuitionRange: "{tuition}", intlStudents: "{intlS}", totalStudents: "{totalS}", scholarships: true, featured: false, website: "{website}", subjects: [{subjects_str}] }},\n'
    # simpler: replace
    old_block = m.group(0)
    new_block = m.group(1) + m.group(2) + extra_str + m.group(3)
    new_intl_text = intl_text.replace(old_block, new_block, 1)
    intl_path.write_text(new_intl_text)
    print("Updated australiaUniversities with +15")
else:
    print("Failed to find australiaUniversities")

# Update all-universities.ts
all_path = ROOT / "src/lib/all-universities.ts"
all_text = all_path.read_text()
# Need to add imports for malaysia, sweden, brazil, russia, india, china, southAfrica
# Current imports:
# from './university-data-intl' includes us, canada, australia, germany, newZealand, ireland, netherlands
# Need to add malaysiaUniversities there, and from extended, plus from brics

# Add malaysia to intl import
old_import_intl = "import {\n  usUniversities,\n  canadaUniversities,\n  australiaUniversities,\n  germanyUniversities,\n  newZealandUniversities,\n  irelandUniversities,\n  netherlandsUniversities\n} from './university-data-intl';"
new_import_intl = "import {\n  usUniversities,\n  canadaUniversities,\n  australiaUniversities,\n  germanyUniversities,\n  malaysiaUniversities,\n  newZealandUniversities,\n  irelandUniversities,\n  netherlandsUniversities\n} from './university-data-intl';"
if old_import_intl in all_text:
    all_text = all_text.replace(old_import_intl, new_import_intl)
    print("Updated intl import to include malaysia")

# Add import for brics
old_import_extended = "import {\n  uaeUniversities,\n  franceUniversities,\n  italyUniversities,\n  maltaUniversities,\n  cyprusUniversities,\n  southKoreaUniversities\n} from './university-data-extended';"
new_import_extended = "import {\n  uaeUniversities,\n  franceUniversities,\n  italyUniversities,\n  maltaUniversities,\n  cyprusUniversities,\n  southKoreaUniversities\n} from './university-data-extended';\nimport {\n  swedenUniversities,\n  brazilUniversities,\n  russiaUniversities,\n  indiaUniversities,\n  chinaUniversities,\n  southAfricaUniversities\n} from './university-data-brics';"
if old_import_extended in all_text:
    all_text = all_text.replace(old_import_extended, new_import_extended)
    print("Added brics import")

# Update slicing comment and code
old_comment = "// Slice to target counts: UK (140), USA (20), Canada (20), Australia (20), Ireland (20), New Zealand (20), Germany (20), Netherlands (20), UAE (20), France (20), Italy (20), Malta (20), Cyprus (20), South Korea (20)"
new_comment = "// Slice to target counts: UK (140), USA (20), Canada (20), Australia (40), Ireland (20), New Zealand (20), Germany (20), Malaysia (20), Netherlands (20), UAE (20), France (20), Italy (20), Malta (20), Cyprus (20), South Korea (20), Sweden (20), Brazil (20), Russia (20), India (20), China (20), South Africa (20) — Every month Jan2027-Jan2028"
if old_comment in all_text:
    all_text = all_text.replace(old_comment, new_comment)
    print("Updated comment")

# Update slicing code
old_sliced = """const slicedUs = usUniversities.slice(0, 20).map((u) => ({ ...u, country: 'United States' }));
const slicedCanada = canadaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Canada' }));
const slicedAustralia = australiaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Australia' }));
const slicedGermany = germanyUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Germany' }));
const slicedNetherlands = netherlandsUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Netherlands' }));
const slicedNewZealand = newZealandUniversities.slice(0, 20).map((u) => ({ ...u, country: 'New Zealand' }));
const slicedIreland = irelandUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Ireland' }));
const slicedUae = uaeUniversities.slice(0, 20).map((u) => ({ ...u, country: 'UAE' }));
const slicedFrance = franceUniversities.slice(0, 20).map((u) => ({ ...u, country: 'France' }));
const slicedItaly = italyUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Italy' }));
const slicedMalta = maltaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Malta' }));
const slicedCyprus = cyprusUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Cyprus' }));
const slicedSouthKorea = southKoreaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'South Korea' }));"""

new_sliced = """const slicedUs = usUniversities.slice(0, 20).map((u) => ({ ...u, country: 'United States' }));
const slicedCanada = canadaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Canada' }));
const slicedAustralia = australiaUniversities.slice(0, 40).map((u) => ({ ...u, country: 'Australia' }));
const slicedGermany = germanyUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Germany' }));
const slicedMalaysia = malaysiaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Malaysia' }));
const slicedNetherlands = netherlandsUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Netherlands' }));
const slicedNewZealand = newZealandUniversities.slice(0, 20).map((u) => ({ ...u, country: 'New Zealand' }));
const slicedIreland = irelandUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Ireland' }));
const slicedUae = uaeUniversities.slice(0, 20).map((u) => ({ ...u, country: 'UAE' }));
const slicedFrance = franceUniversities.slice(0, 20).map((u) => ({ ...u, country: 'France' }));
const slicedItaly = italyUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Italy' }));
const slicedMalta = maltaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Malta' }));
const slicedCyprus = cyprusUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Cyprus' }));
const slicedSouthKorea = southKoreaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'South Korea' }));
const slicedSweden = swedenUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Sweden' }));
const slicedBrazil = brazilUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Brazil' }));
const slicedRussia = russiaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'Russia' }));
const slicedIndia = indiaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'India' }));
const slicedChina = chinaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'China' }));
const slicedSouthAfrica = southAfricaUniversities.slice(0, 20).map((u) => ({ ...u, country: 'South Africa' }));"""

if old_sliced in all_text:
    all_text = all_text.replace(old_sliced, new_sliced)
    print("Updated slicing")

# Update rawDataset
old_raw = """const rawDataset: any[] = [
  ...slicedUk,
  ...slicedUs,
  ...slicedCanada,
  ...slicedAustralia,
  ...slicedIreland,
  ...slicedNewZealand,
  ...slicedGermany,
  ...slicedUae,
  ...slicedFrance,
  ...slicedNetherlands,
  ...slicedItaly,
  ...slicedMalta,
  ...slicedCyprus,
  ...slicedSouthKorea
];"""

new_raw = """const rawDataset: any[] = [
  ...slicedUk,
  ...slicedUs,
  ...slicedCanada,
  ...slicedAustralia,
  ...slicedIreland,
  ...slicedNewZealand,
  ...slicedGermany,
  ...slicedMalaysia,
  ...slicedUae,
  ...slicedFrance,
  ...slicedNetherlands,
  ...slicedItaly,
  ...slicedMalta,
  ...slicedCyprus,
  ...slicedSouthKorea,
  ...slicedSweden,
  ...slicedBrazil,
  ...slicedRussia,
  ...slicedIndia,
  ...slicedChina,
  ...slicedSouthAfrica
];"""

if old_raw in all_text:
    all_text = all_text.replace(old_raw, new_raw)
    print("Updated rawDataset")

# Update export constant name from 400 to 560
old_export = "export const ALL_400_UNIVERSITIES: UniversityRecord[] = rawDataset.map((u) => ({\n  ...u,\n  slug: slugify(u.name),\n}));"
new_export = "export const ALL_400_UNIVERSITIES: UniversityRecord[] = rawDataset.map((u) => ({\n  ...u,\n  slug: slugify(u.name),\n}));\nexport const ALL_UNIVERSITIES = ALL_400_UNIVERSITIES; // alias for new count 560\nexport const TOTAL_UNIVERSITIES = ALL_400_UNIVERSITIES.length;"
if old_export in all_text:
    all_text = all_text.replace(old_export, new_export)
    print("Updated export")

all_path.write_text(all_text)
print("Wrote all-universities.ts")

print("Done TS updates")
