import { cache } from 'react';
import { db } from '@/lib/db';
import { hasCurrentScholarshipSourceVerification } from '@/lib/scholarships/status-engine';
import { publicScholarshipWhere, PUBLIC_SCHOLARSHIP_STATUSES } from '@/lib/public-catalog';

export { PUBLIC_SCHOLARSHIP_STATUSES };
export const getPublishedService = cache((slug: string) => db.service.findFirst({
  where: { slug, status: 'PUBLISHED' }, include: { faqs: { where: { status: "active" }, orderBy: { sortOrder: 'asc' } } },
}));
export const getPublishedScholarship = cache(async (slug: string) => {
  const scholarship = await db.scholarship.findFirst({
    where: { slug, ...publicScholarshipWhere() },
    include: { faqs: { where: { status: "active" }, orderBy: { sortOrder: 'asc' } } },
  });
  return scholarship && hasCurrentScholarshipSourceVerification({
    verificationStatus: scholarship.verificationStatus,
    lastVerifiedAt: scholarship.lastVerifiedAt,
    officialSourceUrl: scholarship.officialSourceUrl,
  }) ? scholarship : null;
});
export const getPublishedResource = cache((slug: string, category: string) => db.resource.findFirst({
  where: { slug, status: 'PUBLISHED', category: { is: { slug: category, status: 'ACTIVE' } } },
  include: { category: true, faqs: { where: { status: "active" }, orderBy: { sortOrder: 'asc' } } },
}));
