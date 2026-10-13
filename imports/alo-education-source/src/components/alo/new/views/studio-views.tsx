'use client';

import dynamic from 'next/dynamic';

// Content Studio views — heavy components, dynamic within group
const VideoStudioPage = dynamic(() => import('@/components/alo/new/pages/video-studio-page').then(m => ({ default: m.VideoStudioPage })), { ssr: false });
const SeoDashboardPage = dynamic(() => import('@/components/alo/new/pages/seo-dashboard-page').then(m => ({ default: m.SeoDashboardPage })), { ssr: false });
const OmnichannelCenter = dynamic(() => import('@/components/alo/new/communication/omnichannel-center').then(m => ({ default: m.OmnichannelCenter })), { ssr: false });

export type StudioViewKey = 'video-studio' | 'seo-dashboard' | 'omnichannel';

interface StudioViewsProps {
  view: StudioViewKey;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
}

export function StudioViews({ view, onBack, onNavigate }: StudioViewsProps) {
  switch (view) {
    case 'video-studio':
      return <VideoStudioPage onBack={onBack} onNavigate={onNavigate} />;
    case 'seo-dashboard':
      return <SeoDashboardPage onBack={onBack} onNavigate={onNavigate} />;
    case 'omnichannel':
      return <OmnichannelCenter onBack={onBack} onNavigate={onNavigate} />;
    default:
      return null;
  }
}
