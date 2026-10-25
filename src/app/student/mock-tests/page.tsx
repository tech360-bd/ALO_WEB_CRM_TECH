import React from 'react';
import { Metadata } from 'next';
import EnglishTestNotice from '@/components/student/EnglishTestNotice';

export const metadata: Metadata = {
  title: 'English Tests | ALO Education Student Portal',
  description: 'Continue to the English Test Platform and review your English preparation progress.',
};

// Practice and real English tests are delivered by the English Test Platform.
// This portal no longer shows simulated mock-test counts or sessions.
export default function StudentMockTestsPage() {
  // src/app/student/layout.tsx already provides the portal chrome. Mounting
  // StudentPortalShell here as well rendered two headers, two sidebars and two
  // footers on /student/mock-tests.
  return <EnglishTestNotice />;
}
