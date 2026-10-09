import { cache } from 'react';
import { db } from '@/lib/db';

export const PUBLIC_SCHOLARSHIP_STATUSES = ['active', 'PUBLISHED', 'OPEN', 'CLOSED', 'UPCOMING'];
export const getPublishedService = cache((slug: string) => db.service.findFirst({
  where: { slug, status: 'PUBLISHED' }, include: { faqs: { where: { status: "active" }, orderBy: { sortOrder: 'asc' } } },
}));
export const getPublishedScholarship = cache((slug: string) => db.scholarship.findFirst({
  where: { slug, status: { in: PUBLIC_SCHOLARSHIP_STATUSES } }, include: { faqs: { where: { status: "active" }, orderBy: { sortOrder: 'asc' } } },
}));
export const getPublishedResource = cache((slug: string, category: string) => db.resource.findFirst({
  where: { slug, status: 'PUBLISHED', category: { is: { slug: category, status: 'ACTIVE' } } },
  include: { category: true, faqs: { where: { status: "active" }, orderBy: { sortOrder: 'asc' } } },
}));
