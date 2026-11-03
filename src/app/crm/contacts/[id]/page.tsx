import ContactHubView from '@/components/contacts/contact-hub-view';

export const metadata = { title: 'Contact profile | ALO Education' };

export default async function ContactProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContactHubView view="detail" contactId={id} />;
}
