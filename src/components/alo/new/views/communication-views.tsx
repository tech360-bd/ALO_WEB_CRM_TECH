'use client';

import dynamic from 'next/dynamic';

const ApplicationCommunication = dynamic(() => import('@/components/alo/new/communication/application-communication').then(m => ({ default: m.ApplicationCommunication })), { ssr: false });

export type CommunicationViewKey = 'app-communication';

interface CommunicationViewsProps {
  view: CommunicationViewKey;
  onBack: () => void;
}

export function CommunicationViews({ view, onBack }: CommunicationViewsProps) {
  switch (view) {
    case 'app-communication':
      return <ApplicationCommunication onBack={onBack} />;
    default:
      return null;
  }
}
