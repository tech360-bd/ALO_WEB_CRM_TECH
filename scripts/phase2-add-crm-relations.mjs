// Phase 2 — Add Prisma relations between CrmUniversity, CrmCourse, CrmCourseIntakeFee,
// CrmCourseRequirement, CrmScholarship, CrmCommission, CrmImportBatch, CrmImportError.
//
// Reads prisma/schema.prisma, finds each model block, and inserts relation fields + indexes
// immediately before the closing brace.
//
// Also marks CrmCourse.courseId as @unique (the duplicate CRS-0007 was already renamed to CRS-0007-B).
//
// Idempotent: if a relation field already exists, it does not add it again.

import { readFile, writeFile } from 'node:fs/promises';

const SCHEMA = '/home/z/my-project/prisma/schema.prisma';

const content = await readFile(SCHEMA, 'utf8');

const RELATIONS = {
  CrmUniversity: `
  // Relations
  courses         CrmCourse[]
  intakeFees      CrmCourseIntakeFee[]
  requirements    CrmCourseRequirement[]
  scholarships    CrmScholarship[]
  commissions     CrmCommission[]
`,
  CrmCourse: `
  // Relations
  university       CrmUniversity       @relation(fields: [universityId], references: [universityId])
  intakeFees       CrmCourseIntakeFee[]
  requirements     CrmCourseRequirement[]
  scholarships     CrmScholarship[]
  commissions      CrmCommission[]

  @@index([universityId])
  @@index([courseTitle])
  @@index([subjectArea])
  @@index([studyLevel])
`,
  CrmCourseIntakeFee: `
  // Relations
  course            CrmCourse     @relation(fields: [courseId], references: [courseId])
  university        CrmUniversity  @relation(fields: [universityId], references: [universityId])

  @@index([courseId])
  @@index([universityId])
  @@index([intakeYear, intakeMonth])
  @@index([status])
`,
  CrmCourseRequirement: `
  // Relations
  course            CrmCourse     @relation(fields: [courseId], references: [courseId])
  university        CrmUniversity @relation(fields: [universityId], references: [universityId])

  @@index([courseId])
  @@index([universityId])
`,
  CrmScholarship: `
  // Relations — courseId is optional (a scholarship may be university-wide)
  course            CrmCourse?    @relation(fields: [courseId], references: [courseId])
  university        CrmUniversity @relation(fields: [universityId], references: [universityId])

  @@index([courseId])
  @@index([universityId])
  @@index([status])
`,
  CrmCommission: `
  // Relations
  course                  CrmCourse     @relation(fields: [courseId], references: [courseId])
  university              CrmUniversity @relation(fields: [universityId], references: [universityId])

  @@index([courseId])
  @@index([universityId])
  @@index([intakeYear, intakeMonth])
`,
  CrmImportBatch: `
  // Relations
  errors            CrmImportError[]
`,
  CrmImportError: `
  // Relations
  batch         CrmImportBatch @relation(fields: [batchId], references: [id])

  @@index([batchId])
`,
};

function findModelBlock(content, modelName) {
  const re = new RegExp(`model\\s+${modelName}\\s*\\{`, 'g');
  const m = re.exec(content);
  if (!m) return null;
  // Find matching close brace
  let depth = 1;
  let i = m.index + m[0].length;
  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    i++;
  }
  return { start: m.index, openBraceEnd: m.index + m[0].length, closeBraceStart: i - 1, end: i };
}

let newContent = content;
const changed = [];

for (const [modelName, relations] of Object.entries(RELATIONS)) {
  const block = findModelBlock(newContent, modelName);
  if (!block) {
    console.log(`  ✗ ${modelName} not found`);
    continue;
  }
  // Check if relations already exist
  const blockContent = newContent.slice(block.openBraceEnd, block.closeBraceStart);
  if (blockContent.includes('// Relations')) {
    console.log(`  ⊙ ${modelName} already has relations — skipping`);
    continue;
  }
  // Insert relations block before the closing brace
  // Add a newline before the relations block
  const insertText = '\n' + relations + '\n';
  newContent = newContent.slice(0, block.closeBraceStart) + insertText + newContent.slice(block.closeBraceStart);
  changed.push(modelName);
  console.log(`  ✓ ${modelName}: relations added`);
}

// Mark CrmCourse.courseId as @unique
const courseBlock = findModelBlock(newContent, 'CrmCourse');
if (courseBlock) {
  const courseContent = newContent.slice(courseBlock.openBraceEnd, courseBlock.closeBraceStart);
  if (courseContent.includes('courseId          String   @unique')) {
    console.log('  ⊙ CrmCourse.courseId already marked @unique');
  } else {
    const oldLine = 'courseId          String';
    const newLine = 'courseId          String   @unique';
    if (courseContent.includes(oldLine)) {
      newContent = newContent.slice(0, courseBlock.openBraceEnd) + courseContent.replace(oldLine, newLine) + newContent.slice(courseBlock.closeBraceStart);
      console.log('  ✓ CrmCourse.courseId marked @unique');
      changed.push('CrmCourse.courseId @unique');
    } else {
      console.log('  ? Could not find CrmCourse.courseId field to mark @unique');
    }
  }
}

await writeFile(SCHEMA, newContent, 'utf8');
console.log(`\n[phase2-schema] ${changed.length} changes applied: ${changed.join(', ')}`);
