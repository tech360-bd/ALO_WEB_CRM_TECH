import { db } from '../src/lib/db';
async function main() {
  console.log('=== STATS ===');
  console.log('Universities:', await db.crmUniversity.count());
  console.log('Courses:', await db.crmCourse.count());
  console.log('Course Intake Fees:', await db.crmCourseIntakeFee.count());
  console.log('FAQs:', await db.homepageFaq.count());
  console.log('Success Stories:', await db.successStory.count());
  console.log('Team Members:', await db.teamMember.count());
  console.log('Scholarships:', await db.crmScholarship.count());
  console.log('Lead Forms:', await db.leadForm.count());
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
