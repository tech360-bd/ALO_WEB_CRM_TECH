import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const countryVisaSteps: Record<string, any[]> = {
  canada: [
    { step: 1, title: "Select course and university", detail: "Shortlist based on eligibility, budget, intake, and career goals." },
    { step: 2, title: "Check eligibility", detail: "Verify academic, English, and visa-history requirements with ALO counselor." },
    { step: 3, title: "Prepare documents", detail: "Collect academic transcripts, English score, passport, CV, SOP, and references." },
    { step: 4, title: "Submit application", detail: "ALO application team submits to the university on your behalf." },
    { step: 5, title: "Receive offer", detail: "Conditional or unconditional offer letter from the university." },
    { step: 6, title: "Meet offer conditions", detail: "Satisfy any academic or English conditions stated in the offer." },
    { step: 7, title: "Pay deposit", detail: "Pay the required tuition deposit to confirm your place." },
    { step: 8, title: "Receive LOA (Letter of Acceptance)", detail: "University issues your Letter of Acceptance or PAL (Provincial Attestation Letter) for visa application." },
    { step: 9, title: "Prepare financial documents", detail: "Arrange bank statement (GIC for SDS), sponsor documents, and source-of-fund proof." },
    { step: 10, title: "Medical exam", detail: "Complete immigration medical exam from a panel physician." },
    { step: 11, title: "Submit study permit application", detail: "File your Canada study permit application online or via VFS." },
    { step: 12, title: "Biometrics appointment", detail: "Attend fingerprint and photo appointment at the VFS centre." },
    { step: 13, title: "Visa decision", detail: "Receive study permit decision — approved or refused." },
    { step: 14, title: "Pre-departure", detail: "Book flights, arrange accommodation, and attend ALO pre-departure briefing." },
  ],
  australia: [
    { step: 1, title: "Select course and university", detail: "Shortlist based on eligibility, budget, intake, and career goals." },
    { step: 2, title: "Check eligibility", detail: "Verify academic, English, and Genuine Student (GS) requirements." },
    { step: 3, title: "Prepare documents", detail: "Collect academic transcripts, English score, passport, CV, SOP, and references." },
    { step: 4, title: "Submit application", detail: "ALO application team submits to the university on your behalf." },
    { step: 5, title: "Receive offer", detail: "Conditional or unconditional offer letter from the university." },
    { step: 6, title: "Meet offer conditions", detail: "Satisfy any academic or English conditions stated in the offer." },
    { step: 7, title: "Pay deposit", detail: "Pay the required tuition deposit to confirm your place." },
    { step: 8, title: "Receive CoE (Confirmation of Enrolment)", detail: "University issues your CoE — required for Australian student visa application." },
    { step: 9, title: "Prepare financial documents", detail: "Arrange bank statement, sponsor documents, and source-of-fund proof." },
    { step: 10, title: "Health check and OSHC", detail: "Complete health examination and arrange Overseas Student Health Cover." },
    { step: 11, title: "Submit visa application (Subclass 500)", detail: "File your Australian student visa application online via ImmiAccount." },
    { step: 12, title: "Biometrics appointment", detail: "Attend biometrics collection at the VFS centre." },
    { step: 13, title: "Visa decision", detail: "Receive visa decision — approved or refused." },
    { step: 14, title: "Pre-departure", detail: "Book flights, arrange accommodation, and attend ALO pre-departure briefing." },
  ],
  usa: [
    { step: 1, title: "Select course and university", detail: "Shortlist based on eligibility, budget, intake, and career goals." },
    { step: 2, title: "Check eligibility", detail: "Verify academic, English, SAT/GRE/GMAT, and visa-history requirements." },
    { step: 3, title: "Prepare documents", detail: "Collect academic transcripts, English score, passport, CV, SOP, and recommendations." },
    { step: 4, title: "Submit application", detail: "ALO application team submits to the university on your behalf." },
    { step: 5, title: "Receive offer", detail: "Conditional or unconditional offer letter (I-20) from the university." },
    { step: 6, title: "Meet offer conditions", detail: "Satisfy any academic or English conditions stated in the offer." },
    { step: 7, title: "Pay deposit and SEVIS fee", detail: "Pay the required tuition deposit and SEVIS I-901 fee." },
    { step: 8, title: "Receive I-20 form", detail: "University issues your Form I-20 — required for F-1 visa application." },
    { step: 9, title: "Prepare financial documents", detail: "Arrange bank statement, sponsor documents, and source-of-fund proof." },
    { step: 10, title: "Complete DS-160 visa application", detail: "Fill out the DS-160 online nonimmigrant visa application form." },
    { step: 11, title: "Schedule visa interview", detail: "Schedule your F-1 visa interview at the US Embassy." },
    { step: 12, title: "Attend visa interview", detail: "Attend the in-person visa interview at the US Embassy in Dhaka." },
    { step: 13, title: "Visa decision", detail: "Receive visa decision — approved or refused." },
    { step: 14, title: "Pre-departure", detail: "Book flights, arrange accommodation, and attend ALO pre-departure briefing." },
  ],
  ireland: [
    { step: 1, title: "Select course and university", detail: "Shortlist based on eligibility, budget, intake, and career goals." },
    { step: 2, title: "Check eligibility", detail: "Verify academic, English, and visa-history requirements with ALO counselor." },
    { step: 3, title: "Prepare documents", detail: "Collect academic transcripts, English score, passport, CV, SOP, and references." },
    { step: 4, title: "Submit application", detail: "ALO application team submits to the university on your behalf." },
    { step: 5, title: "Receive offer", detail: "Conditional or unconditional offer letter from the university." },
    { step: 6, title: "Meet offer conditions", detail: "Satisfy any academic or English conditions stated in the offer." },
    { step: 7, title: "Pay deposit", detail: "Pay the required tuition deposit to confirm your place." },
    { step: 8, title: "Receive offer/visa support letter", detail: "University issues your offer letter and visa support letter for Irish visa application." },
    { step: 9, title: "Prepare financial documents", detail: "Arrange bank statement, sponsor documents, and source-of-fund proof." },
    { step: 10, title: "Submit visa application (INIS)", detail: "File your Long Stay Study Visa application online via INIS/AVATS." },
    { step: 11, title: "Register with INIS/IRP", detail: "After arrival, register with INIS for Irish Residence Permit (IRP)." },
    { step: 12, title: "Biometrics appointment", detail: "Attend biometrics at the VFS centre in Dhaka." },
    { step: 13, title: "Visa decision", detail: "Receive visa decision — approved or refused." },
    { step: 14, title: "Pre-departure", detail: "Book flights, arrange accommodation, and attend ALO pre-departure briefing." },
  ],
  "new-zealand": [
    { step: 1, title: "Select course and university", detail: "Shortlist based on eligibility, budget, intake, and career goals." },
    { step: 2, title: "Check eligibility", detail: "Verify academic, English, and visa-history requirements with ALO counselor." },
    { step: 3, title: "Prepare documents", detail: "Collect academic transcripts, English score, passport, CV, SOP, and references." },
    { step: 4, title: "Submit application", detail: "ALO application team submits to the university on your behalf." },
    { step: 5, title: "Receive offer", detail: "Conditional or unconditional offer letter from the university." },
    { step: 6, title: "Meet offer conditions", detail: "Satisfy any academic or English conditions stated in the offer." },
    { step: 7, title: "Pay deposit", detail: "Pay the required tuition deposit to confirm your place." },
    { step: 8, title: "Receive offer/visa support letter", detail: "University issues your offer letter and visa support letter for New Zealand visa application." },
    { step: 9, title: "Prepare financial documents", detail: "Arrange bank statement, sponsor documents, and source-of-fund proof." },
    { step: 10, title: "Medical and police certificate", detail: "Complete health examination and obtain police clearance certificate." },
    { step: 11, title: "Submit student visa application", detail: "File your Fee Paying Student Visa application online via Immigration NZ." },
    { step: 12, title: "Biometrics if required", detail: "Attend biometrics if requested by Immigration NZ." },
    { step: 13, title: "Visa decision", detail: "Receive visa decision — approved or refused." },
    { step: 14, title: "Pre-departure", detail: "Book flights, arrange accommodation, and attend ALO pre-departure briefing." },
  ],
  dubai: [
    { step: 1, title: "Select course and university", detail: "Shortlist based on eligibility, budget, intake, and career goals." },
    { step: 2, title: "Check eligibility", detail: "Verify academic, English, and visa-history requirements with ALO counselor." },
    { step: 3, title: "Prepare documents", detail: "Collect academic transcripts, English score, passport, CV, SOP, and references." },
    { step: 4, title: "Submit application", detail: "ALO application team submits to the university on your behalf." },
    { step: 5, title: "Receive offer", detail: "Conditional or unconditional offer letter from the university." },
    { step: 6, title: "Meet offer conditions", detail: "Satisfy any academic or English conditions stated in the offer." },
    { step: 7, title: "Pay deposit", detail: "Pay the required tuition deposit to confirm your place." },
    { step: 8, title: "University sponsors student visa", detail: "University initiates student residence visa sponsorship through the UAE government." },
    { step: 9, title: "Prepare financial documents", detail: "Arrange bank statement, sponsor documents, and source-of-fund proof." },
    { step: 10, title: "Medical fitness test", detail: "Complete medical fitness test in UAE after arrival (blood test and chest X-ray)." },
    { step: 11, title: "Apply for Emirates ID", detail: "Apply for Emirates ID card after visa stamping." },
    { step: 12, title: "Visa stamping", detail: "Visa is stamped on passport by the UAE immigration authority." },
    { step: 13, title: "Visa decision", detail: "Student residence visa issued — approved or refused." },
    { step: 14, title: "Pre-departure", detail: "Book flights, arrange accommodation, and attend ALO pre-departure briefing." },
  ],
};

async function main() {
  console.log("Fixing country-specific visa processes...");
  for (const [slug, steps] of Object.entries(countryVisaSteps)) {
    const country = await db.countryPage.findUnique({ where: { slug } });
    if (!country) { console.log(`  ${slug}: not found`); continue; }
    await db.countryPage.update({
      where: { slug },
      data: { visaProcess: JSON.stringify(steps) },
    });
    console.log(`  ${slug}: ✅ Visa process updated (${steps.length} country-specific steps)`);
  }
  console.log("Done!");
}

main().catch(console.error).finally(() => db.$disconnect());
