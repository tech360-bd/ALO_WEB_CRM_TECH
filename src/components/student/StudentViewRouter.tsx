'use client';

import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import StudentDashboard from './StudentDashboard';
import StudentProfilePage from './StudentProfilePage';
import StudentCourseFinder from './StudentCourseFinder';
import StudentCompare from './StudentCompare';
import StudentApplications from './StudentApplications';
import StudentDocuments from './StudentDocuments';
import StudentMessages from './StudentMessages';
import StudentVisaCenter from './StudentVisaCenter';
import StudentScholarships from './StudentScholarships';
import StudentAppointments from './StudentAppointments';
import StudentAiMatch from './StudentAiMatch';
import StudentPayments from './StudentPayments';
import { StudentNotifications } from './StudentNotifications';
import { StudentSettings, StudentHelpCenter, StudentReferrals } from './StudentMorePages';
import StudentSopCvStudio from './StudentSopCvStudio';

const studentViewMap: Partial<Record<PortalView, React.ComponentType>> = {
  'student-dashboard': StudentDashboard,
  'student-profile': StudentProfilePage,
  'student-course-finder': StudentCourseFinder,
  'student-favorites': StudentCompare,
  'student-compare': StudentCompare,
  'student-applications': StudentApplications,
  'student-applications-detail': StudentApplications,
  'student-documents': StudentDocuments,
  'student-messages': StudentMessages,
  'student-visa': StudentVisaCenter,
  'student-scholarships': StudentScholarships,
  'student-appointments': StudentAppointments,
  'student-ai-advisor': StudentAiMatch,
  'student-recommendations': StudentAiMatch,
  'student-payments': StudentPayments,
  'student-notifications': StudentNotifications,
  'student-settings': StudentSettings,
  'student-help': StudentHelpCenter,
  'student-sop': StudentSopCvStudio,
  'student-cv': StudentSopCvStudio,
  'student-interviews': StudentHelpCenter,
  'student-referrals': StudentReferrals,
  'student-events': StudentHelpCenter,
  'student-onboarding': StudentHelpCenter,
};

export default function StudentViewRouter() {
  const currentView = usePortalStore((s) => s.currentView);

  const ViewComponent = studentViewMap[currentView] || StudentDashboard;
  return <ViewComponent />;
}
