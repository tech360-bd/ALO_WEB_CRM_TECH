import ContactHubView from '@/components/contacts/contact-hub-view';

export const metadata = { title: 'Contact consent ledger | ALO Education' };

export default async function ContactConsentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = params.contactId;
  const contactId = typeof value === 'string' ? value : '';
  return <ContactHubView view="consent" contactId={contactId} />;
}
