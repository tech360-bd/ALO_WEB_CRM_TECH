import React from 'react';
import { Metadata } from 'next';
import StudentPortalShell from '@/components/student/StudentPortalShell';
import EnglishTestNotice from '@/components/student/EnglishTestNotice';

export const metadata: Metadata = {
  title: 'English Tests | ALO Education Student Portal',
  description: 'Continue to the English Test Platform and review your English preparation progress.',
};

// Practice and real English tests are delivered by the English Test Platform.
// This portal no longer shows simulated mock-test counts or sessions.
export default function StudentMockTestsPage() {
  return (
    <StudentPortalShell>
      <EnglishTestNotice />
    </StudentPortalShell>
  );
}
