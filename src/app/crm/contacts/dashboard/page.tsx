import ContactHubView from '@/components/contacts/contact-hub-view';

export const metadata = { title: 'Contact dashboard | ALO Education' };

/**
 * The sixteen contact metrics, each with its own definition, source, date range and
 * branch filter. Values come from live queries; an unavailable metric says so instead
 * of showing a zero.
 */
export default function ContactDashboardPage() {
  return <ContactHubView view="dashboard" />;
}
