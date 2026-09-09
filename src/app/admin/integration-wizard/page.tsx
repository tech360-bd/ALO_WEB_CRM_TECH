import OAuthIntegrationWizard from '@/components/communication/OAuthIntegrationWizard';

export const metadata = {
  title: 'Integration Wizard | ALO Education Admin',
  description: 'Connect official social media, WhatsApp, email, and analytics providers using secure OAuth 2.0 authorization.',
};

export default function IntegrationWizardPage() {
  return <OAuthIntegrationWizard />;
}
