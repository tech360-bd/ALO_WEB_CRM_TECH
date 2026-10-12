import { redirect } from 'next/navigation';

/**
 * The previous duplicates screen listed an always-empty result and offered an
 * unaudited merge. Duplicate analysis now lives on the data-review screens;
 * merge is disabled until an audited, transactional workflow is approved.
 */
export default function LegacyUniversityDuplicatesRoute() {
  redirect('/admin/data-review/duplicates');
}
