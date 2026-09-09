import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const total = await db.crmUniversity.count();
  const published = await db.crmUniversity.count({ where: { status: 'active' } });
  const searchable = await db.crmUniversity.count({ where: { status: 'active' } });
  
  // Universities with complete fields (defined as name, country, city, description not empty)
  const completeFields = await db.crmUniversity.count({
    where: {
      name: { not: '' },
      country: { not: '' },
      city: { not: '' },
      description: { not: null }
    }
  });

  // Universities with courses
  const universities = await db.crmUniversity.findMany({
    include: { _count: { select: { courses: true } } }
  });
  const withCourses = universities.filter(u => u._count.courses > 0).length;

  console.log('Total Universities:', total);
  console.log('Published Universities (status: active):', published);
  console.log('Publicly Searchable Universities:', searchable);
  console.log('Universities with Complete Fields (name, country, city, desc):', completeFields);
  console.log('Universities with Courses:', withCourses);
}

main().then(() => db.$disconnect()).catch(console.error);
