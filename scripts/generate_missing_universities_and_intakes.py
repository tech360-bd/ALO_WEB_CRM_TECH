#!/usr/bin/env python3
"""
Generate missing universities for ALO Education to satisfy:
- UK 140 (already have, low to high rank)
- Australia 40 (currently 20 used from 25 defined, need +20 to reach 40)
- Other every country min 20: Malaysia (exists 25 but not used), Sweden, Brazil, Russia, India, China, South Africa (missing)

Also generate courses Foundation->PhD and intakes every month Jan 2027 to Jan 2028 (13 months) for ALL courses.

This script:
1. Generates src/lib/university-data-brics.ts with 6 countries + extends Australia
2. Updates src/lib/all-universities.ts to include new slices
3. Regenerates universities.csv, courses.csv, course_intakes.csv, course_requirements.csv, english_requirements.csv, tuition_fees.csv
   with proper counts and every-month intakes.

Run: python3 scripts/generate_missing_universities_and_intakes.py
"""
import csv, random, pathlib, re, json
import sys as _alo_sys, pathlib as _alo_pathlib
_alo_sys.path.insert(0, str(_alo_pathlib.Path(__file__).resolve().parent / "lib"))
from synthetic_output_guard import refuse_permanently
refuse_permanently('generate_missing_universities_and_intakes.py', 'historical generator that rewrites src/lib/ source files and repo-root CSVs with invented universities and intakes.')
from collections import defaultdict, Counter

ROOT = pathlib.Path(".")
# Ensure running from repo root
if not (ROOT / "src/lib/all-universities.ts").exists():
    # try parent
    ROOT = pathlib.Path("/home/user/alo_education_z....ai")
    import os
    os.chdir(ROOT)

print(f"Working in {ROOT}")

# 1. Check existing all-universities.ts
all_uni_path = ROOT / "src/lib/all-universities.ts"
old_all_text = all_uni_path.read_text()
print("Old all-universities.ts length", len(old_all_text))

# 2. Create new university data file for missing countries + Australia extra
# We'll create src/lib/university-data-brics.ts

brics_data = {
    "sweden": [
        ("Lund University", "Lund", 75, 1666, "Public", 6.5, "SEK 120,000 – SEK 180,000", "4,200", "42,000"),
        ("Uppsala University", "Uppsala", 105, 1477, "Public", 6.5, "SEK 110,000 – SEK 170,000", "3,800", "45,000"),
        ("KTH Royal Institute of Technology", "Stockholm", 73, 1827, "Public", 6.5, "SEK 130,000 – SEK 190,000", "5,100", "18,000"),
        ("Stockholm University", "Stockholm", 128, 1878, "Public", 6.5, "SEK 90,000 – SEK 150,000", "3,500", "33,000"),
        ("Chalmers University of Technology", "Gothenburg", 129, 1829, "Public", 6.5, "SEK 125,000 – SEK 185,000", "3,200", "11,000"),
        ("University of Gothenburg", "Gothenburg", 187, 1891, "Public", 6.5, "SEK 95,000 – SEK 145,000", "2,900", "37,000"),
        ("Linköping University", "Linköping", 320, 1969, "Public", 6.5, "SEK 85,000 – SEK 135,000", "2,100", "32,000"),
        ("Umeå University", "Umeå", 365, 1965, "Public", 6.5, "SEK 85,000 – SEK 130,000", "1,800", "34,000"),
        ("Karolinska Institute", "Stockholm", 6, 1810, "Public", 6.5, "SEK 150,000 – SEK 220,000", "2,400", "6,500"),
        ("Stockholm School of Economics", "Stockholm", 450, 1909, "Private", 7.0, "SEK 180,000 – SEK 250,000", "1,200", "2,400"),
        ("Luleå University of Technology", "Luleå", 600, 1971, "Public", 6.0, "SEK 80,000 – SEK 120,000", "900", "14,000"),
        ("Örebro University", "Örebro", 700, 1999, "Public", 6.0, "SEK 75,000 – SEK 115,000", "800", "17,000"),
        ("Mid Sweden University", "Sundsvall", 850, 1993, "Public", 6.0, "SEK 70,000 – SEK 110,000", "600", "13,000"),
        ("Malmö University", "Malmö", 720, 1998, "Public", 6.0, "SEK 80,000 – SEK 125,000", "1,100", "24,000"),
        ("Karlstad University", "Karlstad", 800, 1977, "Public", 6.0, "SEK 75,000 – SEK 115,000", "700", "16,000"),
        ("Linnaeus University", "Växjö", 780, 2010, "Public", 6.0, "SEK 80,000 – SEK 120,000", "1,300", "31,000"),
        ("University of Borås", "Borås", 900, 1977, "Public", 6.0, "SEK 70,000 – SEK 105,000", "500", "11,000"),
        ("Mälardalen University", "Västerås", 880, 1977, "Public", 6.0, "SEK 75,000 – SEK 115,000", "800", "16,000"),
        ("Jönköping University", "Jönköping", 650, 1977, "Private", 6.5, "SEK 100,000 – SEK 150,000", "1,500", "12,000"),
        ("Swedish University of Agricultural Sciences", "Uppsala", 280, 1977, "Public", 6.5, "SEK 90,000 – SEK 140,000", "1,000", "4,000"),
    ],
    "brazil": [
        ("University of São Paulo", "São Paulo", 85, 1934, "Public", 6.0, "BRL 10,000 – BRL 30,000", "5,000", "97,000"),
        ("University of Campinas", "Campinas", 210, 1966, "Public", 6.0, "BRL 8,000 – BRL 25,000", "3,200", "34,000"),
        ("Federal University of Rio de Janeiro", "Rio de Janeiro", 350, 1920, "Public", 6.0, "BRL 5,000 – BRL 20,000", "2,800", "67,000"),
        ("São Paulo State University", "São Paulo", 480, 1976, "Public", 6.0, "BRL 6,000 – BRL 18,000", "2,100", "50,000"),
        ("Federal University of Minas Gerais", "Belo Horizonte", 550, 1927, "Public", 6.0, "BRL 5,000 – BRL 15,000", "1,900", "49,000"),
        ("Pontifical Catholic University of Rio de Janeiro", "Rio de Janeiro", 600, 1940, "Private", 6.5, "BRL 30,000 – BRL 60,000", "2,500", "15,000"),
        ("Federal University of Rio Grande do Sul", "Porto Alegre", 580, 1934, "Public", 6.0, "BRL 5,000 – BRL 12,000", "1,600", "31,000"),
        ("University of Brasília", "Brasília", 670, 1962, "Public", 6.0, "BRL 5,000 – BRL 15,000", "1,400", "31,000"),
        ("Federal University of São Carlos", "São Carlos", 750, 1968, "Public", 6.0, "BRL 4,000 – BRL 10,000", "900", "16,000"),
        ("Pontifical Catholic University of São Paulo", "São Paulo", 800, 1946, "Private", 6.0, "BRL 25,000 – BRL 50,000", "1,100", "27,000"),
        ("Federal University of Pernambuco", "Recife", 780, 1946, "Public", 6.0, "BRL 5,000 – BRL 12,000", "1,200", "30,000"),
        ("Federal University of Paraná", "Curitiba", 820, 1912, "Public", 6.0, "BRL 5,000 – BRL 10,000", "1,000", "31,000"),
        ("Federal University of Ceará", "Fortaleza", 850, 1954, "Public", 6.0, "BRL 4,000 – BRL 10,000", "800", "26,000"),
        ("Fluminense Federal University", "Niterói", 900, 1960, "Public", 6.0, "BRL 4,000 – BRL 10,000", "700", "28,000"),
        ("University of Fortaleza", "Fortaleza", 950, 1973, "Private", 6.0, "BRL 20,000 – BRL 40,000", "600", "28,000"),
        ("Mackenzie Presbyterian University", "São Paulo", 1000, 1952, "Private", 6.0, "BRL 22,000 – BRL 45,000", "800", "45,000"),
        ("Federal University of Goiás", "Goiânia", 880, 1960, "Public", 6.0, "BRL 5,000 – BRL 12,000", "700", "27,000"),
        ("Federal University of Santa Catarina", "Florianópolis", 620, 1960, "Public", 6.0, "BRL 5,000 – BRL 15,000", "1,300", "30,000"),
        ("State University of Maringá", "Maringá", 920, 1969, "Public", 6.0, "BRL 4,000 – BRL 10,000", "500", "20,000"),
        ("Federal University of Bahia", "Salvador", 840, 1946, "Public", 6.0, "BRL 5,000 – BRL 12,000", "1,000", "27,000"),
    ],
    "russia": [
        ("Lomonosov Moscow State University", "Moscow", 75, 1755, "Public", 6.0, "RUB 300,000 – RUB 500,000", "6,500", "38,000"),
        ("Saint Petersburg State University", "Saint Petersburg", 242, 1724, "Public", 6.0, "RUB 250,000 – RUB 450,000", "4,200", "32,000"),
        ("Novosibirsk State University", "Novosibirsk", 228, 1958, "Public", 6.0, "RUB 200,000 – RUB 350,000", "1,800", "8,000"),
        ("Tomsk State University", "Tomsk", 264, 1878, "Public", 6.0, "RUB 180,000 – RUB 300,000", "1,500", "15,000"),
        ("Moscow Institute of Physics and Technology", "Moscow", 281, 1951, "Public", 6.5, "RUB 300,000 – RUB 500,000", "1,200", "7,000"),
        ("National Research University Higher School of Economics", "Moscow", 305, 1992, "Public", 6.5, "RUB 350,000 – RUB 600,000", "4,500", "35,000"),
        ("Kazan Federal University", "Kazan", 370, 1804, "Public", 6.0, "RUB 180,000 – RUB 300,000", "2,800", "32,000"),
        ("Ural Federal University", "Yekaterinburg", 516, 1920, "Public", 6.0, "RUB 150,000 – RUB 280,000", "2,200", "35,000"),
        ("People's Friendship University of Russia", "Moscow", 392, 1960, "Public", 6.0, "RUB 250,000 – RUB 400,000", "7,500", "31,000"),
        ("Far Eastern Federal University", "Vladivostok", 631, 1899, "Public", 6.0, "RUB 150,000 – RUB 250,000", "3,500", "23,000"),
        ("National University of Science and Technology MISIS", "Moscow", 500, 1918, "Public", 6.0, "RUB 200,000 – RUB 350,000", "1,800", "8,500"),
        ("Lobachevsky University", "Nizhny Novgorod", 700, 1916, "Public", 6.0, "RUB 150,000 – RUB 250,000", "900", "27,000"),
        ("Siberian Federal University", "Krasnoyarsk", 750, 2006, "Public", 6.0, "RUB 140,000 – RUB 220,000", "1,500", "31,000"),
        ("Southern Federal University", "Rostov-on-Don", 780, 1915, "Public", 6.0, "RUB 130,000 – RUB 210,000", "1,200", "25,000"),
        ("Peter the Great St. Petersburg Polytechnic University", "Saint Petersburg", 400, 1899, "Public", 6.0, "RUB 180,000 – RUB 320,000", "4,500", "30,000"),
        ("ITMO University", "Saint Petersburg", 350, 1900, "Public", 6.5, "RUB 200,000 – RUB 350,000", "3,200", "13,000"),
        ("Moscow State Institute of International Relations", "Moscow", 345, 1944, "Public", 6.5, "RUB 400,000 – RUB 650,000", "1,500", "9,000"),
        ("National Research Nuclear University MEPhI", "Moscow", 450, 1942, "Public", 6.0, "RUB 180,000 – RUB 300,000", "1,000", "7,500"),
        ("Bauman Moscow State Technical University", "Moscow", 320, 1830, "Public", 6.0, "RUB 220,000 – RUB 380,000", "2,000", "19,000"),
        ("Sechenov University", "Moscow", 850, 1758, "Public", 6.0, "RUB 300,000 – RUB 500,000", "2,200", "18,000"),
    ],
    "india": [
        ("Indian Institute of Science", "Bangalore", 155, 1909, "Public", 6.5, "INR 200,000 – INR 400,000", "800", "4,000"),
        ("Indian Institute of Technology Bombay", "Mumbai", 118, 1958, "Public", 6.5, "INR 200,000 – INR 300,000", "2,500", "11,000"),
        ("Indian Institute of Technology Delhi", "New Delhi", 123, 1961, "Public", 6.5, "INR 200,000 – INR 300,000", "2,800", "11,000"),
        ("Indian Institute of Technology Madras", "Chennai", 148, 1959, "Public", 6.5, "INR 190,000 – INR 280,000", "2,200", "10,000"),
        ("University of Delhi", "New Delhi", 407, 1922, "Public", 6.5, "INR 50,000 – INR 150,000", "5,500", "33,000"),
        ("Indian Institute of Technology Kharagpur", "Kharagpur", 222, 1951, "Public", 6.5, "INR 180,000 – INR 270,000", "2,000", "10,000"),
        ("Indian Institute of Technology Kanpur", "Kanpur", 222, 1959, "Public", 6.5, "INR 190,000 – INR 280,000", "1,900", "9,500"),
        ("University of Mumbai", "Mumbai", 580, 1857, "Public", 6.0, "INR 40,000 – INR 120,000", "3,500", "49,000"),
        ("Jawaharlal Nehru University", "New Delhi", 520, 1969, "Public", 6.5, "INR 1,000 – INR 10,000", "800", "8,500"),
        ("University of Calcutta", "Kolkata", 800, 1857, "Public", 6.0, "INR 30,000 – INR 100,000", "2,200", "22,000"),
        ("Banaras Hindu University", "Varanasi", 600, 1916, "Public", 6.0, "INR 20,000 – INR 80,000", "1,800", "30,000"),
        ("Amity University", "Noida", 1000, 2005, "Private", 6.0, "INR 200,000 – INR 400,000", "6,500", "35,000"),
        ("Vellore Institute of Technology", "Vellore", 700, 1984, "Private", 6.0, "INR 180,000 – INR 350,000", "5,800", "36,000"),
        ("Birla Institute of Technology and Science", "Pilani", 881, 1964, "Private", 6.5, "INR 200,000 – INR 450,000", "2,400", "14,000"),
        ("Manipal Academy of Higher Education", "Manipal", 750, 1953, "Private", 6.0, "INR 250,000 – INR 500,000", "5,200", "28,000"),
        ("Jamia Millia Islamia", "New Delhi", 600, 1920, "Public", 6.0, "INR 10,000 – INR 50,000", "1,500", "22,000"),
        ("University of Hyderabad", "Hyderabad", 650, 1974, "Public", 6.5, "INR 20,000 – INR 80,000", "1,200", "5,000"),
        ("Aligarh Muslim University", "Aligarh", 700, 1920, "Public", 6.0, "INR 15,000 – INR 60,000", "1,600", "31,000"),
        ("Anna University", "Chennai", 400, 1978, "Public", 6.0, "INR 50,000 – INR 120,000", "1,800", "29,000"),
        ("Jadavpur University", "Kolkata", 800, 1955, "Public", 6.0, "INR 5,000 – INR 40,000", "1,100", "13,000"),
    ],
    "china": [
        ("Tsinghua University", "Beijing", 14, 1911, "Public", 6.5, "CNY 30,000 – CNY 60,000", "4,500", "50,000"),
        ("Peking University", "Beijing", 14, 1898, "Public", 6.5, "CNY 30,000 – CNY 60,000", "5,200", "44,000"),
        ("Fudan University", "Shanghai", 39, 1905, "Public", 6.5, "CNY 28,000 – CNY 55,000", "3,800", "32,000"),
        ("Zhejiang University", "Hangzhou", 47, 1897, "Public", 6.5, "CNY 28,000 – CNY 50,000", "6,800", "55,000"),
        ("Shanghai Jiao Tong University", "Shanghai", 46, 1896, "Public", 6.5, "CNY 30,000 – CNY 60,000", "4,200", "46,000"),
        ("University of Science and Technology of China", "Hefei", 82, 1958, "Public", 6.5, "CNY 25,000 – CNY 45,000", "1,500", "16,000"),
        ("Nanjing University", "Nanjing", 133, 1902, "Public", 6.5, "CNY 25,000 – CNY 50,000", "3,200", "35,000"),
        ("Wuhan University", "Wuhan", 194, 1893, "Public", 6.0, "CNY 20,000 – CNY 40,000", "3,500", "53,000"),
        ("Sun Yat-sen University", "Guangzhou", 260, 1924, "Public", 6.0, "CNY 22,000 – CNY 42,000", "4,800", "64,000"),
        ("Harbin Institute of Technology", "Harbin", 174, 1920, "Public", 6.5, "CNY 28,000 – CNY 55,000", "2,800", "35,000"),
        ("Tongji University", "Shanghai", 192, 1907, "Public", 6.0, "CNY 25,000 – CNY 45,000", "4,500", "35,000"),
        ("Beijing Normal University", "Beijing", 247, 1902, "Public", 6.0, "CNY 20,000 – CNY 35,000", "2,200", "24,000"),
        ("Xiamen University", "Xiamen", 352, 1921, "Public", 6.0, "CNY 20,000 – CNY 35,000", "3,000", "30,000"),
        ("Huazhong University of Science and Technology", "Wuhan", 158, 1952, "Public", 6.0, "CNY 22,000 – CNY 40,000", "3,800", "55,000"),
        ("South China University of Technology", "Guangzhou", 336, 1952, "Public", 6.0, "CNY 20,000 – CNY 35,000", "2,500", "45,000"),
        ("Tianjin University", "Tianjin", 307, 1895, "Public", 6.0, "CNY 22,000 – CNY 40,000", "2,200", "31,000"),
        ("Beihang University", "Beijing", 242, 1952, "Public", 6.5, "CNY 25,000 – CNY 45,000", "2,000", "30,000"),
        ("Southeast University", "Nanjing", 355, 1902, "Public", 6.0, "CNY 20,000 – CNY 35,000", "2,800", "32,000"),
        ("Nankai University", "Tianjin", 315, 1919, "Public", 6.0, "CNY 20,000 – CNY 35,000", "2,400", "26,000"),
        ("Xi'an Jiaotong University", "Xi'an", 269, 1896, "Public", 6.0, "CNY 22,000 – CNY 40,000", "3,500", "48,000"),
    ],
    "south-africa": [
        ("University of Cape Town", "Cape Town", 171, 1829, "Public", 6.5, "ZAR 60,000 – ZAR 120,000", "4,500", "29,000"),
        ("University of the Witwatersrand", "Johannesburg", 264, 1922, "Public", 6.5, "ZAR 55,000 – ZAR 110,000", "5,200", "40,000"),
        ("Stellenbosch University", "Stellenbosch", 283, 1918, "Public", 6.5, "ZAR 50,000 – ZAR 100,000", "3,800", "32,000"),
        ("University of Pretoria", "Pretoria", 323, 1908, "Public", 6.0, "ZAR 45,000 – ZAR 95,000", "6,500", "53,000"),
        ("University of Johannesburg", "Johannesburg", 363, 2005, "Public", 6.0, "ZAR 40,000 – ZAR 80,000", "5,800", "50,000"),
        ("University of KwaZulu-Natal", "Durban", 445, 2004, "Public", 6.0, "ZAR 40,000 – ZAR 75,000", "4,200", "46,000"),
        ("University of the Western Cape", "Cape Town", 601, 1960, "Public", 6.0, "ZAR 35,000 – ZAR 65,000", "2,500", "23,000"),
        ("Rhodes University", "Grahamstown", 701, 1904, "Public", 6.5, "ZAR 50,000 – ZAR 90,000", "1,500", "8,000"),
        ("North-West University", "Potchefstroom", 801, 2004, "Public", 6.0, "ZAR 35,000 – ZAR 70,000", "3,200", "64,000"),
        ("University of South Africa", "Pretoria", 1000, 1873, "Public", 6.0, "ZAR 20,000 – ZAR 40,000", "8,000", "300,000"),
        ("Nelson Mandela University", "Port Elizabeth", 1001, 2005, "Public", 6.0, "ZAR 35,000 – ZAR 65,000", "2,800", "28,000"),
        ("University of Fort Hare", "Alice", 1200, 1916, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "900", "13,000"),
        ("University of Limpopo", "Polokwane", 1200, 2005, "Public", 6.0, "ZAR 30,000 – ZAR 60,000", "1,100", "23,000"),
        ("Tshwane University of Technology", "Pretoria", 1000, 2004, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "3,500", "60,000"),
        ("Durban University of Technology", "Durban", 1000, 2002, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "2,200", "33,000"),
        ("Central University of Technology", "Bloemfontein", 1200, 1981, "Public", 6.0, "ZAR 30,000 – ZAR 50,000", "1,200", "21,000"),
        ("Cape Peninsula University of Technology", "Cape Town", 1000, 2005, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "1,800", "33,000"),
        ("University of Zululand", "KwaDlangezwa", 1200, 1960, "Public", 6.0, "ZAR 30,000 – ZAR 55,000", "1,000", "17,000"),
        ("Walter Sisulu University", "Mthatha", 1200, 2005, "Public", 6.0, "ZAR 30,000 – ZAR 50,000", "1,500", "24,000"),
        ("Sefako Makgatho University", "Ga-Rankuwa", 1200, 2014, "Public", 6.0, "ZAR 35,000 – ZAR 60,000", "800", "7,000"),
    ],
}

# Australia extra 15 to reach 40 (currently 25, need 40 -> 15 more)
australia_extra = [
    ("University of Canberra", "Canberra", 403, 1967, "Public", 6.5, "AUD 35,000 – AUD 45,000", "2,200", "16,000"),
    ("Victoria University", "Melbourne", 650, 1990, "Public", 6.0, "AUD 28,000 – AUD 35,000", "4,500", "43,000"),
    ("Western Sydney University", "Sydney", 384, 1989, "Public", 6.5, "AUD 32,000 – AUD 40,000", "5,200", "47,000"),
    ("Murdoch University", "Perth", 580, 1973, "Public", 6.0, "AUD 30,000 – AUD 38,000", "3,800", "23,000"),
    ("James Cook University", "Townsville", 412, 1970, "Public", 6.0, "AUD 32,000 – AUD 40,000", "2,800", "22,000"),
    ("University of New England", "Armidale", 801, 1938, "Public", 6.0, "AUD 26,000 – AUD 32,000", "1,200", "26,000"),
    ("Charles Sturt University", "Bathurst", 801, 1989, "Public", 6.0, "AUD 28,000 – AUD 35,000", "9,500", "45,000"),
    ("Australian Catholic University", "Melbourne", 701, 1991, "Public", 6.5, "AUD 30,000 – AUD 38,000", "3,200", "34,000"),
    ("Southern Cross University", "Lismore", 801, 1994, "Public", 6.0, "AUD 28,000 – AUD 34,000", "1,800", "17,000"),
    ("Federation University Australia", "Ballarat", 801, 1870, "Public", 6.0, "AUD 28,000 – AUD 33,000", "2,500", "20,000"),
    ("University of the Sunshine Coast", "Sippy Downs", 701, 1996, "Public", 6.0, "AUD 28,000 – AUD 34,000", "1,200", "18,000"),
    ("Edith Cowan University", "Perth", 601, 1991, "Public", 6.0, "AUD 32,000 – AUD 40,000", "3,800", "30,000"),
    ("University of Southern Queensland", "Toowoomba", 801, 1967, "Public", 6.0, "AUD 26,000 – AUD 32,000", "5,200", "26,000"),
    ("Central Queensland University", "Rockhampton", 801, 1992, "Public", 6.0, "AUD 28,000 – AUD 34,000", "6,500", "35,000"),
    ("Torrens University Australia", "Adelaide", 1000, 2013, "Private", 6.0, "AUD 30,000 – AUD 38,000", "7,500", "19,000"),
]

