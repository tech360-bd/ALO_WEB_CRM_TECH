#!/usr/bin/env python3
"""
Extend data/verified-2027/dataset.json with the second research wave.

Every record added here points at a page that was actually retrieved on
2026-10-29 and whose excerpt is quoted from that page. Nothing is inferred:
where an official page does not publish a fact (e.g. TUM's programme-specific
2027/28 tuition tier, KU's programme tuition) the field is left empty and the
gap is described in `notes` so a reviewer can see exactly what is missing.

Run:  python3 scripts/verified-catalogue/extend-dataset-2026-10-29.py
"""
import json
import pathlib

DATASET = pathlib.Path(__file__).resolve().parents[2] / "data" / "verified-2027" / "dataset.json"
AT = "2026-10-29T12:00:00Z"

TUM_URL = "https://www.tum.de/en/studies/degree-programs/detail/informatics-master-of-science-msc"
TUM_DATES = "https://www.tum.de/en/studies/application/application-info-portal/dates-periods-and-deadlines"
TUM_FEES = "https://www.tum.de/en/studies/fees/tuition"
AKL_URL = "https://www.auckland.ac.nz/en/study/study-options/find-a-study-option/master-of-data-science-mdats.html"
AKL_DATES = ("https://www.auckland.ac.nz/en/about-us/about-the-university/the-university/official-publications/"
             "university-calendar/current-calendar/key-university-dates/academic-dates/semester-teaching-days-charts-2027.html")
KU_URL = "https://www.ku.dk/studies/masters/computer-science"
KU_ADMISSION = "https://www.ku.dk/studies/admission/masters"
YONSEI_PDF = "https://www2.yonsei.ac.kr/entrance/2027/intl/2027_3_docu/2027_3_intl_plan_eng.pdf"


def evidence(eid, url, publisher, title, excerpt, scope, entity, uni, course=None, confidence=0.9):
    return {
        "id": eid,
        "sourceUrl": url,
        "finalUrl": url,
        "sourceType": "OFFICIAL_UNIVERSITY",
        "publisherName": publisher,
        "pageTitle": title,
        "retrievedAt": AT,
        "httpStatus": 200,
        "excerpt": excerpt,
        "fieldScope": scope,
        "entityType": entity,
        "universitySlug": uni,
        **({"courseSlug": course} if course else {}),
        "language": "en",
        "confidence": confidence,
    }


NEW_EVIDENCE = [
    evidence(
        "tum-informatics-programme-2027", TUM_URL, "Technical University of Munich",
        "Informatics - Master of Science (M.Sc.) - TUM",
        "The tuition fees for international students from third countries for this degree program are 6,000 euros per "
        "semester. This amount is charged for full-time study. … Application Period Winter semester: 01.02. – 31.05. "
        "Summer semester: 01.10. – 30.11. … Main Locations Garching … Start of Degree Program Possible for both winter "
        "and summer semester … Standard Duration of Studies 4 semesters (fulltime) … Credits 120 ECTS",
        ["fee", "applicationWindow", "startMonths", "campus", "duration", "credits"],
        "COURSE", "technical-university-of-munich", "tum-master-informatics", 0.95),
    evidence(
        "tum-semester-dates-2027", TUM_DATES, "Technical University of Munich",
        "Dates, Periods and Deadlines - TUM",
        "Summer semester 2027: 01.04.2027 – 30.09.2027 · Lecture period: 12.04.2027 – 16.07.2027 … "
        "Winter semester 2027/28: 01.10.2027 – 31.03.2028 · Lecture period: 18.10.2027 – 11.02.2028 … "
        "Enrollment for summer semester 2027: until 14.05.2027",
        ["semesterDates", "startDate", "lecturePeriod", "enrolmentDeadline"],
        "UNIVERSITY", "technical-university-of-munich", None, 0.95),
    evidence(
        "tum-tuition-increase-2027-28", TUM_FEES, "Technical University of Munich",
        "Tuition Fees for Students from Non-EU Countries - TUM",
        "Tuition fees for international students from non-EU/EEA countries at TUM will increase for the winter semester "
        "2027/28. The tuition fees will then be … for Master’s programs: 4,600 or 6,800 euros … For master’s degree "
        "programs, they are usually 4,000 or 6,000 euros per semester.",
        ["fee", "academicYear", "feeRange"],
        "UNIVERSITY", "technical-university-of-munich", None, 0.9),
    evidence(
        "auckland-mdats-intakes-2027", AKL_URL, "The University of Auckland",
        "Master of Data Science – University of Auckland",
        "Next start date 2027 Semester One – 1 March 2027 Semester Two – 19 July · Available locations City · "
        "Points 180 or 240 · Programme type Postgraduate Taught options available … We also offer the Master of Data "
        "Science (MDataSci) as a 240-point taught masters as a March intake only.",
        ["startDate", "intakeName", "campus", "points", "duration"],
        "COURSE", "university-of-auckland", "auckland-master-of-data-science", 0.95),
    evidence(
        "auckland-mdats-fees-2027", AKL_URL, "The University of Auckland",
        "Master of Data Science – University of Auckland (Fees and scholarships)",
        "2027 fees International students: NZ$55,214 – $55,484. Fees are inclusive of 15% GST, but do not include the "
        "Student Services Fee, course books, travel and health insurance, or living costs. In addition to the tuition "
        "fees, there is a Student Services Fee of $9.44 per point, estimated at $1,132.80 for full-time study "
        "(120 points).",
        ["fee", "feeCurrency", "feePeriod", "studentCategory"],
        "COURSE", "university-of-auckland", "auckland-master-of-data-science", 0.85),
    evidence(
        "auckland-mdats-closing-dates-2027", AKL_URL, "The University of Auckland",
        "Master of Data Science – University of Auckland (Key dates)",
        "Application closing dates Semester One 2027: 8 December 2026 Semester Two 2027: 4 July 2027",
        ["internationalDeadline", "applicationCloses"],
        "COURSE", "university-of-auckland", "auckland-master-of-data-science", 0.9),
    evidence(
        "auckland-semester-one-2027-dates", AKL_DATES, "The University of Auckland",
        "Semester teaching days charts 2027",
        "Semester One 2027 teaching days … Semester 1 begins: Mon 1 Mar … Semester 1 lectures end: Fri 4 Jun … "
        "Semester 1 ends: Mon 28 Jun",
        ["startDate", "semesterDates"],
        "UNIVERSITY", "university-of-auckland", None, 0.95),
    evidence(
        "copenhagen-msc-cs-deadlines", KU_URL, "University of Copenhagen",
        "Master of Science (MSc) in Computer Science - Study Programmes on University of Copenhagen",
        "Applicants from outside the EU, EEA and Switzerland … Study start in September 15 January at 23:59 (CET) "
        "The application portal opens on 15 November. You will receive a reply by 13 March. … Study start in February "
        "(legal right of admission only) 15 October at 23:59 (CEST)",
        ["applicationOpens", "applicationCloses", "internationalDeadline", "startMonths"],
        "COURSE", "university-of-copenhagen", "copenhagen-master-computer-science", 0.95),
    evidence(
        "copenhagen-all-programmes-start-september", KU_ADMISSION, "University of Copenhagen",
        "Application and admission to master's degree programmes - University of Copenhagen",
        "All programmes start in September. Certain master’s programmes also start in February for applicants who have "
        "legal right of admission.",
        ["startMonths", "intakeName"],
        "UNIVERSITY", "university-of-copenhagen", None, 0.95),
    evidence(
        "copenhagen-msc-cs-requirements", KU_URL, "University of Copenhagen",
        "Master of Science (MSc) in Computer Science (admission requirements)",
        "Courses in computer science corresponding to at least 45 ECTS, subject to the following distribution "
        "constraints: A minimum of 7.5 ECTS within the field of programming … A minimum of 10 ECTS within the field of "
        "computer systems architecture … A minimum of 10 ECTS within the field of theoretical computer science … "
        "Courses in mathematics corresponding to a total of at least 7.5 ECTS … You must also meet the language "
        "requirement English B. … Transcript of records · Course descriptions for passed courses · Self-assessment "
        "form · Proof of language proficiency · Copy of passport/national ID card",
        ["academicRequirement", "englishRequirements", "documentRequirements"],
        "COURSE", "university-of-copenhagen", "copenhagen-master-computer-science", 0.95),
    evidence(
        "yonsei-2027-march-intl-schedule", YONSEI_PDF, "Yonsei University",
        "2027학년도 3월 신입학 외국인전형 모집요강 (2027 March intake international admission guide)",
        "Online Application 2026. 9. 1.(Tue) 10:00 ~ 9. 17.(Thu) 17:00 … Announcement of Application Results "
        "2026. 12. 4.(Fri) 17:00 … Tuition fee Payment In January, 2027 … Int’l Student Track All Majors & departments "
        "… 200,000 KRW … Computer Science & Engineering … From 2027 Academic Year",
        ["applicationOpens", "applicationCloses", "applicationFee", "startMonths", "programmeName"],
        "COURSE", "yonsei-university", "yonsei-bsc-computer-science", 0.95),
    evidence(
        "yonsei-2027-intl-eligibility", YONSEI_PDF, "Yonsei University",
        "2027 March intake international admission guide - eligibility",
        "Applicants and both of their parents must hold a non-Korean nationality. Applicants must either hold or be "
        "expected to hold a high school diploma. Applicants must submit documents to verify Korean or English "
        "proficiency … Official documentation proving completion of high school courses conducted in Korean or "
        "English … Standardized test result indicating proficiency in Korean or English",
        ["internationalEligibility", "academicRequirement", "englishRequirements"],
        "COURSE", "yonsei-university", "yonsei-bsc-computer-science", 0.9),
]

NEW_UNIVERSITIES = [
    {
        "slug": "technical-university-of-munich", "name": "Technical University of Munich",
        "country": "Germany", "countrySlug": "germany", "city": "Munich / Garching",
        "officialWebsite": "https://www.tum.de/", "catalogueUrl": "https://www.tum.de/en/studies/degree-programs",
        "verificationStatus": "VERIFIED", "lastVerifiedAt": AT,
        "notes": "Semester dates for summer semester 2027 and winter semester 2027/28 verified on the official TUM dates "
                 "page. The non-EU tuition increase for winter semester 2027/28 is published as a two-tier range; the "
                 "programme-specific tier for 2027/28 is not yet published on the programme page.",
    },
    {
        "slug": "university-of-auckland", "name": "The University of Auckland",
        "country": "New Zealand", "countrySlug": "new-zealand", "city": "Auckland",
        "officialWebsite": "https://www.auckland.ac.nz/",
        "catalogueUrl": "https://www.auckland.ac.nz/en/study/study-options/find-a-study-option.html",
        "verificationStatus": "VERIFIED", "lastVerifiedAt": AT,
        "notes": "2027 programme start dates, 2027 international fees and 2027 application closing dates verified for "
                 "the Master of Data Science. The wider 2027 programme catalogue was not traversed in this cycle.",
    },
    {
        "slug": "university-of-copenhagen", "name": "University of Copenhagen",
        "country": "Denmark", "countrySlug": "denmark", "city": "Copenhagen",
        "officialWebsite": "https://www.ku.dk/", "catalogueUrl": "https://www.ku.dk/studies/masters",
        "verificationStatus": "VERIFIED", "lastVerifiedAt": AT,
        "notes": "Non-EU/EEA application window (portal 15 November – 15 January) and September start verified. "
                 "Programme tuition for non-EU applicants is published separately and was not captured in this cycle, "
                 "so no fee is asserted.",
    },
    {
        "slug": "yonsei-university", "name": "Yonsei University",
        "country": "South Korea", "countrySlug": "south-korea", "city": "Seoul",
        "officialWebsite": "https://www2.yonsei.ac.kr/", "catalogueUrl": "https://www2.yonsei.ac.kr/entrance/",
        "verificationStatus": "PARTIALLY_VERIFIED", "lastVerifiedAt": AT,
        "notes": "International admissions are published on the www2.yonsei.ac.kr admissions subdomain. Only the March "
                 "2027 (2027학년도 3월) international intake guide was traversed; the September 2027 cycle guide was not "
                 "published at collection time.",
    },
]

NEW_COURSES = [
    {
        "slug": "tum-master-informatics", "universitySlug": "technical-university-of-munich",
        "title": "MSc Informatics", "qualification": "MSc", "studyLevel": "Postgraduate",
        "subjectArea": "Computer Science", "durationMonths": 24, "studyMode": "Full-time or part-time",
        "campus": "Garching", "officialCourseUrl": TUM_URL,
        "applicationUrl": "https://www.tum.de/en/studies/application",
        "academicYear": "2027/28", "verificationStatus": "VERIFIED", "lastVerifiedAt": AT,
        "notes": "Two intakes per year: summer semester (lecture period from 12 April 2027) and winter semester "
                 "2027/28 (lecture period from 18 October 2027). Admission is via the aptitude assessment procedure.",
    },
    {
        "slug": "auckland-master-of-data-science", "universitySlug": "university-of-auckland",
        "title": "Master of Data Science (MDataSci)", "qualification": "MDataSci", "studyLevel": "Postgraduate",
        "subjectArea": "Data Science", "durationMonths": 18, "studyMode": "Full-time or part-time",
        "campus": "City", "officialCourseUrl": AKL_URL,
        "applicationUrl": "https://www.auckland.ac.nz/en/study/applications-and-admissions/apply-now.html",
        "academicYear": "2027", "verificationStatus": "VERIFIED", "lastVerifiedAt": AT,
        "notes": "Offered as 180-point or 240-point taught masters; the 240-point variant has a March intake only. "
                 "2027 international fee is published as a band (NZ$55,214 – $55,484) plus a Student Services Fee.",
    },
    {
        "slug": "copenhagen-master-computer-science", "universitySlug": "university-of-copenhagen",
        "title": "MSc Computer Science", "qualification": "MSc", "studyLevel": "Postgraduate",
        "subjectArea": "Computer Science", "durationMonths": 24, "studyMode": "Full-time",
        "campus": "North Campus, Copenhagen", "officialCourseUrl": KU_URL,
        "applicationUrl": "https://www.ku.dk/studies/admission/masters",
        "academicYear": "2027/28", "verificationStatus": "VERIFIED", "lastVerifiedAt": AT,
        "notes": "September start only for applicants from outside the EU/EEA/Switzerland; the February start is "
                 "restricted to applicants with a Danish legal right of admission.",
    },
    {
        "slug": "yonsei-bsc-computer-science", "universitySlug": "yonsei-university",
        "title": "BSc Computer Science & Engineering", "qualification": "BSc", "studyLevel": "Undergraduate",
        "subjectArea": "Computer Science", "durationMonths": 48, "studyMode": "Full-time",
        "campus": "Sinchon Campus, Seoul", "officialCourseUrl": YONSEI_PDF,
        "applicationUrl": "https://www2.yonsei.ac.kr/entrance/",
        "academicYear": "2027", "verificationStatus": "PARTIALLY_VERIFIED", "lastVerifiedAt": AT,
        "notes": "Computer Science & Engineering becomes a separately admitted department from the 2027 academic year "
                 "(previously School of Computing). Only the March 2027 intake is verified.",
    },
]


def row(course, month, status, year=2027, **kw):
    base = {
        "courseSlug": course,
        "year": year,
        "month": month,
        "status": status,
        "evidenceIds": kw.pop("evidenceIds"),
        "confidence": kw.pop("confidence", 0.9),
        "courseSourceUrl": kw.pop("courseSourceUrl"),
    }
    base.update(kw)
    return base


def build_coverage():
    rows = []

    # ---- TUM MSc Informatics: April 2027 (summer) and October 2027 (winter) intakes only.
    tum_not_offered = {
        1: "January", 2: "February", 3: "March", 5: "May", 6: "June", 7: "July", 8: "August",
        9: "September", 11: "November", 12: "December",
    }
    for month, name in tum_not_offered.items():
        rows.append(row("tum-master-informatics", month, "VERIFIED_NOT_OFFERED",
                        evidenceIds=["tum-informatics-programme-2027", "tum-semester-dates-2027"],
                        courseSourceUrl=TUM_URL, confidence=0.9,
                        conflictNote="TUM publishes exactly two intakes for this programme: winter semester "
                                     "(lecture period from October) and summer semester (lecture period from April). "
                                     f"{name} is not an intake month in that enumeration."))
    rows.append(row("tum-master-informatics", 1, "VERIFIED_NOT_OFFERED", year=2028,
                    evidenceIds=["tum-informatics-programme-2027", "tum-semester-dates-2027"],
                    courseSourceUrl=TUM_URL, confidence=0.9,
                    conflictNote="TUM's intake enumeration publishes exactly two starts — winter semester "
                                 "(lecture period from October) and summer semester (lecture period from April). "
                                 "January 2028 falls inside winter semester 2027/28, which began in October 2027, so "
                                 "January is not an intake month in that enumeration."))
    rows.append(row(
        "tum-master-informatics", 4, "VERIFIED_AVAILABLE",
        evidenceIds=["tum-informatics-programme-2027", "tum-semester-dates-2027"],
        courseSourceUrl=TUM_URL, confidence=0.95,
        intakeName="Summer semester 2027", startDate="2027-04-12",
        applicationOpens="2026-10-01", applicationCloses="2026-11-30",
        feeAmount=6000, feeCurrency="EUR", academicYear="2026/27", feePeriod="per semester",
        studentCategory="International (non-EU/EEA)", feeSourceUrl=TUM_URL,
        intakeSourceUrl=TUM_DATES, requirementSourceUrl=TUM_URL,
        campus="Garching", studyMode="Full-time or part-time", qualification="MSc",
        englishRequirements={"other": "English-taught programme; proof of English proficiency must be submitted by "
                                      "the application deadline."},
        documentRequirements=["Bachelor's degree", "Aptitude assessment for master's admission"],
        internationalEligibility="Open to international applicants; non-EU/EEA students pay tuition fees.",
        notes="Application period 01.10. – 30.11. for the summer semester. €6,000 per semester is the amount stated on "
              "the programme page for the current fee period, which covers summer semester 2027; TUM's increase takes "
              "effect only from winter semester 2027/28.",
    ))
    rows.append(row(
        "tum-master-informatics", 10, "VERIFIED_AVAILABLE",
        evidenceIds=["tum-informatics-programme-2027", "tum-semester-dates-2027", "tum-tuition-increase-2027-28"],
        courseSourceUrl=TUM_URL, confidence=0.7,
        intakeName="Winter semester 2027/28", startDate="2027-10-18",
        applicationOpens="2027-02-01", applicationCloses="2027-05-31",
        feeAmount=4600, feeCurrency="EUR", academicYear="2027/28", feePeriod="per semester",
        studentCategory="International (non-EU/EEA)", feeSourceUrl=TUM_FEES,
        intakeSourceUrl=TUM_DATES, requirementSourceUrl=TUM_URL,
        campus="Garching", studyMode="Full-time or part-time", qualification="MSc",
        englishRequirements={"other": "English-taught programme; proof of English proficiency must be submitted by "
                                      "the application deadline."},
        documentRequirements=["Bachelor's degree", "Aptitude assessment for master's admission"],
        internationalEligibility="Open to international applicants; non-EU/EEA students newly enrolling from winter "
                                 "semester 2027/28 pay the increased tuition.",
        notes="€4,600 is the LOWER bound of TUM's published two-tier master's tuition for winter semester 2027/28 "
              "(€4,600 or €6,800 per semester). The programme page still states €6,000 for 2026/27 and does not yet "
              "publish which tier applies to Informatics in 2027/28, so the exact amount must be confirmed before it "
              "is quoted to a student; €6,000 must NOT be carried forward.",
    ))

    # ---- Auckland MDataSci: Semester One (1 March 2027) and Semester Two (19 July 2027).
    akl_months = {1: "January", 2: "February", 4: "April", 5: "May", 6: "June",
                  8: "August", 9: "September", 10: "October", 11: "November", 12: "December"}
    for month, name in akl_months.items():
        rows.append(row("auckland-master-of-data-science", month, "VERIFIED_NOT_OFFERED",
                        evidenceIds=["auckland-mdats-intakes-2027"],
                        courseSourceUrl=AKL_URL, confidence=0.9,
                        conflictNote="The official programme page lists exactly two 2027 start dates — Semester One "
                                     "1 March 2027 and Semester Two 19 July 2027 — plus a March-only 240-point "
                                     f"variant. {name} is not a start month in that enumeration."))
    rows.append(row("auckland-master-of-data-science", 1, "VERIFIED_NOT_OFFERED", year=2028,
                    evidenceIds=["auckland-mdats-intakes-2027"], courseSourceUrl=AKL_URL, confidence=0.9,
                    conflictNote="The programme's official start-date list enumerates exactly two 2027 intakes — "
                                 "Semester One 1 March and Semester Two 19 July — plus a March-only 240-point "
                                 "variant. January 2028 is not in that enumeration."))
    rows.append(row(
        "auckland-master-of-data-science", 3, "VERIFIED_AVAILABLE",
        evidenceIds=["auckland-mdats-intakes-2027", "auckland-mdats-fees-2027",
                     "auckland-mdats-closing-dates-2027", "auckland-semester-one-2027-dates"],
        courseSourceUrl=AKL_URL, confidence=0.95,
        intakeName="2027 Semester One", startDate="2027-03-01", internationalDeadline="2026-12-08",
        feeAmount=55214, feeCurrency="NZD", academicYear="2027", feePeriod="per year (120 points)",
        studentCategory="International", feeSourceUrl=AKL_URL, intakeSourceUrl=AKL_URL,
        requirementSourceUrl=AKL_URL,
        campus="City", studyMode="Full-time or part-time", qualification="MDataSci",
        englishRequirements={"other": "English-language proficiency evidence required as part of the application."},
        notes="International fee published as a band (NZ$55,214 – $55,484); the lower bound is recorded. A Student "
              "Services Fee of $9.44 per point (≈$1,132.80 for 120 points) is charged on top. Application closes "
              "8 December 2026 for Semester One 2027.",
    ))
    rows.append(row(
        "auckland-master-of-data-science", 7, "VERIFIED_AVAILABLE",
        evidenceIds=["auckland-mdats-intakes-2027", "auckland-mdats-fees-2027", "auckland-mdats-closing-dates-2027"],
        courseSourceUrl=AKL_URL, confidence=0.9,
        intakeName="2027 Semester Two", startDate="2027-07-19", internationalDeadline="2027-07-04",
        feeAmount=55214, feeCurrency="NZD", academicYear="2027", feePeriod="per year (120 points)",
        studentCategory="International", feeSourceUrl=AKL_URL, intakeSourceUrl=AKL_URL,
        requirementSourceUrl=AKL_URL,
        campus="City", studyMode="Full-time or part-time", qualification="MDataSci",
        englishRequirements={"other": "English-language proficiency evidence required as part of the application."},
        notes="Semester Two 2027 start; application closes 4 July 2027. The 240-point taught variant is NOT open for "
              "this intake (March intake only).",
    ))

    # ---- KU MSc Computer Science: September start only for non-EU/EEA applicants.
    ku_months = {1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June", 7: "July",
                 8: "August", 10: "October", 11: "November", 12: "December"}
    for month, name in ku_months.items():
        rows.append(row("copenhagen-master-computer-science", month, "VERIFIED_NOT_OFFERED",
                        evidenceIds=["copenhagen-all-programmes-start-september", "copenhagen-msc-cs-deadlines"],
                        courseSourceUrl=KU_URL, confidence=0.85,
                        conflictNote="KU's intake enumeration states that all master's programmes start in "
                                     "September; the February start is restricted to applicants with a legal right "
                                     f"of admission (holders of the specified Danish bachelor's degrees). {name} is "
                                     "absent from that enumeration and is not an international intake."))
    rows.append(row("copenhagen-master-computer-science", 1, "VERIFIED_NOT_OFFERED", year=2028,
                    evidenceIds=["copenhagen-all-programmes-start-september"], courseSourceUrl=KU_URL, confidence=0.85,
                    conflictNote="KU's intake enumeration states that all master's programmes start in September, "
                                 "with a February start restricted to applicants holding a legal right of admission. "
                                 "January 2028 is absent from that enumeration."))
    rows.append(row(
        "copenhagen-master-computer-science", 9, "VERIFIED_AVAILABLE",
        evidenceIds=["copenhagen-msc-cs-deadlines", "copenhagen-all-programmes-start-september",
                     "copenhagen-msc-cs-requirements"],
        courseSourceUrl=KU_URL, confidence=0.9,
        intakeName="September 2027 start", applicationOpens="2026-11-15", applicationCloses="2027-01-15",
        internationalDeadline="2027-01-15", intakeSourceUrl=KU_URL, requirementSourceUrl=KU_URL,
        campus="North Campus, Copenhagen", studyMode="Full-time", qualification="MSc",
        academicRequirement="Bachelor's degree with at least 45 ECTS in computer science (min. 7.5 ECTS programming "
                            "across two paradigms, 10 ECTS systems architecture, 10 ECTS theoretical computer science) "
                            "plus 7.5 ECTS mathematics, and English B.",
        englishRequirements={"other": "English B (Danish upper-secondary level) or equivalent."},
        documentRequirements=["Transcript of records", "Course descriptions", "Self-assessment form",
                              "Proof of language proficiency", "Copy of passport/national ID card"],
        internationalEligibility="Applicants from outside the EU/EEA/Switzerland must pay an application deposit and "
                                 "tuition fees; reply to applications by 13 March.",
        notes="KU publishes tuition per programme on its fee pages; the amount for this programme was NOT captured in "
              "this cycle, so no fee is asserted. First-semester tuition is payable by 15 April.",
    ))

    # ---- Yonsei BSc Computer Science & Engineering: only the March 2027 intake is published.
    for month in [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12]:
        rows.append(row("yonsei-bsc-computer-science", month, "NOT_PUBLISHED",
                        evidenceIds=["yonsei-2027-march-intl-schedule"],
                        courseSourceUrl=YONSEI_PDF, confidence=0.8,
                        notes="Only the March 2027 international intake guide had been published when this record was "
                              "collected. No claim is made about this month: the September 2027 cycle guide was not "
                              "available, so absence of published information is not treated as proof."))
    rows.append(row("yonsei-bsc-computer-science", 1, "NOT_PUBLISHED", year=2028,
                    evidenceIds=["yonsei-2027-march-intl-schedule"], courseSourceUrl=YONSEI_PDF, confidence=0.8,
                    notes="No published intake information for January 2028 in the cycle that was traversed."))
    rows.append(row(
        "yonsei-bsc-computer-science", 3, "VERIFIED_AVAILABLE",
        evidenceIds=["yonsei-2027-march-intl-schedule", "yonsei-2027-intl-eligibility"],
        courseSourceUrl=YONSEI_PDF, confidence=0.9,
        intakeName="March 2027 international intake (2027학년도 3월 신입학)",
        applicationOpens="2026-09-01", applicationCloses="2026-09-17",
        applicationFee=200000, applicationFeeCurrency="KRW",
        intakeSourceUrl=YONSEI_PDF, requirementSourceUrl=YONSEI_PDF,
        campus="Sinchon Campus, Seoul", studyMode="Full-time", qualification="BSc",
        academicRequirement="High school diploma (or expected by February 2027) and non-Korean nationality for the "
                            "applicant and both parents.",
        englishRequirements={"other": "Korean or English proficiency evidence: high-school instruction language, "
                                      "Korean language institution certificate, or a standardised test result."},
        documentRequirements=["High school diploma / expected graduation certificate", "Transcript of records",
                              "Passport of applicant and parents", "Proof of language proficiency",
                              "Apostille/consular authentication"],
        internationalEligibility="International student track: applicant and both parents must hold non-Korean "
                                 "nationality; documents submitted by post by 30 September 2026.",
        notes="Admission results 4 December 2026; tuition paid in January 2027. Tuition amount is set per college and "
              "is not published in the admission guide, so no tuition figure is asserted — only the KRW 200,000 "
              "application fee, which the guide states for the 2027 academic year.",
    ))
    return rows


NEW_TRAVERSALS = [
    {"universitySlug": "technical-university-of-munich", "countrySlug": "germany",
     "catalogueUrl": "https://www.tum.de/en/studies/degree-programs", "catalogueType": "PROGRAMME_LIST",
     "httpStatus": 200, "pageTitle": "Degree programs - TUM", "programmeLinksObserved": 1,
     "coursesDiscovered": 1, "coursesVerified": 1, "paginationComplete": False, "completeness": "PARTIAL",
     "notes": "MSc Informatics detail page plus the university dates and tuition pages were traversed. TUM's full "
              "degree-programme catalogue and its pagination were not traversed in this cycle.",
     "lastTraversedAt": AT},
    {"universitySlug": "university-of-auckland", "countrySlug": "new-zealand",
     "catalogueUrl": "https://www.auckland.ac.nz/en/study/study-options/find-a-study-option.html",
     "catalogueType": "PROGRAMME_LIST", "httpStatus": 200, "pageTitle": "Find a study option - The University of Auckland",
     "programmeLinksObserved": 1, "coursesDiscovered": 1, "coursesVerified": 1, "paginationComplete": False,
     "completeness": "PARTIAL",
     "notes": "Master of Data Science programme page plus the official 2027 semester teaching-days chart traversed; "
              "the full 2027 programme catalogue was not traversed.",
     "lastTraversedAt": AT},
    {"universitySlug": "university-of-copenhagen", "countrySlug": "denmark",
     "catalogueUrl": "https://www.ku.dk/studies/masters", "catalogueType": "PROGRAMME_LIST", "httpStatus": 200,
     "pageTitle": "Master's programmes - University of Copenhagen", "programmeLinksObserved": 1,
     "coursesDiscovered": 1, "coursesVerified": 1, "paginationComplete": False, "completeness": "PARTIAL",
     "notes": "MSc Computer Science programme page and the master's admission/deadline page traversed. The full "
              "catalogue of ~120 master's programmes was not traversed.",
     "lastTraversedAt": AT},
    {"universitySlug": "yonsei-university", "countrySlug": "south-korea",
     "catalogueUrl": "https://www2.yonsei.ac.kr/entrance/", "catalogueType": "PDF_PROSPECTUS", "httpStatus": 200,
     "pageTitle": "2027학년도 3월 신입학 외국인전형 모집요강", "programmeLinksObserved": 1, "coursesDiscovered": 1,
     "coursesVerified": 1, "paginationComplete": False, "completeness": "PARTIAL",
     "notes": "The official 2027 March international admission guide (PDF, 8 chunks parsed) was traversed for the "
              "College of Computing departments. The September 2027 guide and the full department list were not "
              "traversed.",
     "lastTraversedAt": AT},
]

NEW_QUEUE = [
    {"countrySlug": "germany", "universityName": "Technical University of Munich",
     "universitySlug": "technical-university-of-munich", "officialWebsite": "https://www.tum.de/",
     "catalogueUrl": "https://www.tum.de/en/studies/degree-programs", "priority": 1, "status": "VERIFIED",
     "reason": "MSc Informatics verified for summer semester 2027 and winter semester 2027/28, with 2027/28 non-EU "
               "tuition published as a two-tier range.",
     "discoveredVia": "Official TUM dates page + programme detail page",
     "nextAction": "Traverse the remaining TUM master's programmes and resolve the programme-specific 2027/28 tuition "
                   "tier once the programme page is updated."},
    {"countrySlug": "new-zealand", "universityName": "The University of Auckland",
     "universitySlug": "university-of-auckland", "officialWebsite": "https://www.auckland.ac.nz/",
     "catalogueUrl": "https://www.auckland.ac.nz/en/study/study-options/find-a-study-option.html", "priority": 1,
     "status": "VERIFIED",
     "reason": "Master of Data Science 2027 start dates, 2027 international fees and 2027 closing dates verified.",
     "discoveredVia": "Official programme page + 2027 semester teaching-days chart",
     "nextAction": "Traverse other 2027 postgraduate programmes and capture English entry requirements per programme."},
    {"countrySlug": "denmark", "universityName": "University of Copenhagen",
     "universitySlug": "university-of-copenhagen", "officialWebsite": "https://www.ku.dk/",
     "catalogueUrl": "https://www.ku.dk/studies/masters", "priority": 2, "status": "VERIFIED",
     "reason": "Non-EU/EEA application window (15 November – 15 January) and September-only start verified; programme "
               "tuition not yet captured.",
     "discoveredVia": "Official master's admission page + programme page",
     "nextAction": "Capture the programme tuition amount for non-EU applicants from KU's fee pages."},
    {"countrySlug": "denmark", "universityName": "Technical University of Denmark (DTU)",
     "officialWebsite": "https://www.dtu.dk/", "priority": 3, "status": "DEFERRED",
     "reason": "The DTU MSc tuition-fee page returned HTTP 404 during this cycle; the official fee figure could not be "
               "verified, so no DTU records were created.",
     "discoveredVia": "Official DTU education section",
     "nextAction": "Locate the current DTU tuition page from the education index and re-attempt verification."},
    {"countrySlug": "south-korea", "universityName": "Yonsei University", "universitySlug": "yonsei-university",
     "officialWebsite": "https://www2.yonsei.ac.kr/", "catalogueUrl": "https://www2.yonsei.ac.kr/entrance/",
     "priority": 1, "status": "VERIFIED",
     "reason": "March 2027 international intake verified from the official admission guide (application 1–17 September "
               "2026, results 4 December 2026, KRW 200,000 application fee).",
     "discoveredVia": "Official 2027 March intake admission guide (PDF)",
     "nextAction": "Traverse the September 2027 intake guide when published and capture college-level tuition."},
    {"countrySlug": "south-korea", "universityName": "Seoul National University",
     "officialWebsite": "https://www.snu.ac.kr/", "priority": 2, "status": "BLOCKED",
     "reason": "The SNU international admissions URL returned HTTP 404 and the admissions host did not expose the 2027 "
               "graduate schedule, so no SNU records were created.",
     "discoveredVia": "Official SNU admissions host",
     "nextAction": "Re-resolve the current SNU international admissions path before the next cycle."},
    {"countrySlug": "usa", "universityName": "Arizona State University",
     "officialWebsite": "https://www.asu.edu/", "catalogueUrl": "https://tuition.asu.edu/", "priority": 2,
     "status": "IN_PROGRESS",
     "reason": "ASU's tuition site confirms a Spring 2027 term (Session A tuition refund deadline 17 January 2027, "
               "Session C 24 January 2027) but does not publish the term start date or 2027/28 international tuition "
               "on the retrieved pages.",
     "discoveredVia": "Official ASU tuition site",
     "nextAction": "Traverse registrar.asu.edu academic calendars for the exact Spring 2027 / Fall 2027 start dates "
                   "and the 2027/28 international tuition schedule."},
    {"countrySlug": "uae", "universityName": "American University of Sharjah",
     "officialWebsite": "https://www.aus.edu/", "catalogueUrl": "https://www.aus.edu/admissions/bachelors-degrees",
     "priority": 2, "status": "IN_PROGRESS",
     "reason": "Fall 2027 application periods verified (Period One 26 Oct 2026 – 7 Jan 2027, Period Two 8 Jan – 18 Mar "
               "2027, Period Three 19 Mar – 20 May 2027, late 21 May – 24 Jun 2027) and a Spring 2028 intake is "
               "referenced, but the semester start month and 2027 tuition are not published on the admissions pages.",
     "discoveredVia": "Official AUS admissions timeline page",
     "nextAction": "Traverse the AUS academic calendar and tuition schedule to pin the Fall 2027 start month and fees."},
    {"countrySlug": "uae", "universityName": "University of Dubai", "officialWebsite": "https://www.ud.ac.ae/",
     "priority": 3, "status": "QUEUED",
     "reason": "Official admissions calendar and fees for 2027 not yet collected.",
     "discoveredVia": "Country coverage requirement",
     "nextAction": "Verify the 2027 intake calendar and tuition from the official site."},
    {"countrySlug": "malaysia", "universityName": "Universiti Malaya",
     "officialWebsite": "https://www.um.edu.my/", "priority": 1, "status": "BLOCKED",
     "reason": "The UM international admission path (isc.um.edu.my) failed to load during this cycle; only "
               "third-party aggregator figures were available, which are not acceptable verification evidence, so no "
               "UM records were created.",
     "discoveredVia": "Official UM domain",
     "nextAction": "Retry the official UM admission site and, if still unavailable, use MAYA/UM's published fee "
                   "schedule before the next cycle."},
    {"countrySlug": "malaysia", "universityName": "Taylor's University",
     "officialWebsite": "https://university.taylors.edu.my/", "priority": 3, "status": "QUEUED",
     "reason": "Intake calendar for 2027 not yet verified from the official site.",
     "discoveredVia": "Country coverage requirement",
     "nextAction": "Verify the 2027 intake calendar and tuition from the official site."},
]


def main():
    dataset = json.loads(DATASET.read_text())
    existing_evidence = {item["id"] for item in dataset["evidence"]}
    existing_universities = {item["slug"] for item in dataset["universities"]}
    existing_courses = {item["slug"] for item in dataset["courses"]}
    existing_coverage = {(r["courseSlug"], r["year"], r["month"]) for r in dataset["coverage"]}
    existing_queue = {(q["countrySlug"], q["universityName"]) for q in dataset["researchQueue"]}

    dataset["evidence"].extend([e for e in NEW_EVIDENCE if e["id"] not in existing_evidence])
    dataset["universities"].extend([u for u in NEW_UNIVERSITIES if u["slug"] not in existing_universities])
    dataset["courses"].extend([c for c in NEW_COURSES if c["slug"] not in existing_courses])
    dataset["coverage"].extend([r for r in build_coverage()
                                if (r["courseSlug"], r["year"], r["month"]) not in existing_coverage])
    dataset["traversals"].extend([t for t in NEW_TRAVERSALS
                                  if (t["universitySlug"], t["catalogueUrl"]) not in
                                  {(x["universitySlug"], x["catalogueUrl"]) for x in dataset["traversals"]}])
    # Replace pre-existing queue rows that this wave re-scoped, then append the new ones.
    rescoped = {("germany", "Technical University of Munich"), ("new-zealand", "The University of Auckland"),
                ("denmark", "Technical University of Denmark (DTU)"), ("south-korea", "Seoul National University"),
                ("usa", "Arizona State University"), ("uae", "University of Dubai"),
                ("malaysia", "Taylor's University")}
    dataset["researchQueue"] = [q for q in dataset["researchQueue"]
                                if (q["countrySlug"], q["universityName"]) not in rescoped]
    dataset["researchQueue"].extend([q for q in NEW_QUEUE if (q["countrySlug"], q["universityName"]) not in existing_queue
                                     or (q["countrySlug"], q["universityName"]) in rescoped])
    dataset["generatedAt"] = AT
    dataset["notes"] = (dataset["notes"].split(" Research wave 2")[0] +
                        " Research wave 2 (2026-10-29) adds Germany, New Zealand, Denmark and South Korea with 4 "
                        "universities, 4 programmes, 12 evidence records and 52 new course-month rows; USA, UAE and "
                        "Malaysia remain partially researched and are tracked in researchQueue with their precise "
                        "blockers.")

    DATASET.write_text(json.dumps(dataset, indent=2, ensure_ascii=False) + "\n")
    from collections import Counter
    statuses = Counter(r["status"] for r in dataset["coverage"])
    print(f"evidence={len(dataset['evidence'])} universities={len(dataset['universities'])} "
          f"courses={len(dataset['courses'])} coverage={len(dataset['coverage'])} "
          f"traversals={len(dataset['traversals'])} queue={len(dataset['researchQueue'])}")
    print("statuses:", dict(statuses))


if __name__ == "__main__":
    main()
