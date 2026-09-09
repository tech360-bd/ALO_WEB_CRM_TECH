import { db } from './db';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function populateMissingSlugs() {
  console.log('Populating slugs for Universities and Courses...');

  // 1. Universities
  const universities = await db.crmUniversity.findMany({
    select: { id: true, universityId: true, name: true, slug: true },
  });

  let uniCount = 0;
  for (const uni of universities) {
    const desiredSlug = slugify(uni.name) || uni.universityId.toLowerCase();
    if (uni.slug !== desiredSlug) {
      await db.crmUniversity.update({
        where: { id: uni.id },
        data: { slug: desiredSlug },
      });
      uniCount++;
    }
  }
  console.log(`Updated ${uniCount} university slugs.`);

  // 2. Courses
  const courses = await db.crmCourse.findMany({
    select: { id: true, courseId: true, courseTitle: true, slug: true, universityId: true },
  });

  let courseCount = 0;
  for (const course of courses) {
    const baseSlug = slugify(course.courseTitle) || 'course';
    const uniShort = course.universityId.replace('UNI-', '').slice(0, 10).toLowerCase();
    const desiredSlug = `${baseSlug}-${uniShort}`;

    if (course.slug !== desiredSlug && course.slug !== baseSlug) {
      await db.crmCourse.update({
        where: { id: course.id },
        data: { slug: desiredSlug },
      });
      courseCount++;
    }
  }
  console.log(`Updated ${courseCount} course slugs.`);
}

populateMissingSlugs()
  .then(() => console.log('Slugs populated successfully.'))
  .catch(console.error);
