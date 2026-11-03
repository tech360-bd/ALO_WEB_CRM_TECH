import ContactHubView from '@/components/contacts/contact-hub-view';

export const metadata = {
  title: 'Company Contact Registry | ALO Education',
  description: 'Central, permission-scoped ALO Education contact registry',
};

export default function ContactsPage() {
  return <ContactHubView view="list" />;
}
