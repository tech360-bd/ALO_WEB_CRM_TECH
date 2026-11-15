import ContactHubView from '@/components/contacts/contact-hub-view';

export const metadata = { title: 'Identify caller | ALO Education' };

/**
 * Live identification — the screen a counsellor opens while a call or WhatsApp
 * message is still arriving. It answers one question: which verified record is this
 * number, and what is open on it?
 */
export default function ContactIdentifyPage() {
  return <ContactHubView view="identify" />;
}
