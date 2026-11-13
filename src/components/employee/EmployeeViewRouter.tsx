'use client';

import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import EmployeeDashboard from './UnifiedEmployeeDashboard';
import EmployeeProfilePage from './EmployeeProfilePage';
import EmployeeTasksPage from './EmployeeTasksPage';
import EmployeeLeadsPage from './EmployeeLeadsPage';
import EmployeeStudentsPage from './EmployeeStudentsPage';
import EmployeeApplicationsPage from './EmployeeApplicationsPage';
import EmployeeDocumentsPage from './EmployeeDocumentsPage';
import EmployeeMessagesPage from './EmployeeMessagesPage';
import EmployeeWhatsAppPage from './EmployeeWhatsAppPage';
import EmployeeCalendarPage from './EmployeeCalendarPage';
import EmployeeAttendancePage from './EmployeeAttendancePage';
import EmployeeLeavePage from './EmployeeLeavePage';
import EmployeeSalaryPage from './EmployeeSalaryPage';
import EmployeePerformancePage from './EmployeePerformancePage';
import EmployeeReportsPage from './EmployeeReportsPage';
import EmployeeNotificationsPage from './EmployeeNotificationsPage';
import EmployeeSettingsPage from './EmployeeSettingsPage';
import EmployeeHelpPage from './EmployeeHelpPage';

const employeeViewMap: Partial<Record<PortalView, React.ComponentType>> = {
  'employee-dashboard': EmployeeDashboard,
  'employee-profile': EmployeeProfilePage,
  'employee-tasks': EmployeeTasksPage,
  'employee-leads': EmployeeLeadsPage,
  'employee-students': EmployeeStudentsPage,
  'employee-applications': EmployeeApplicationsPage,
  'employee-documents': EmployeeDocumentsPage,
  'employee-messages': EmployeeMessagesPage,
  'employee-whatsapp': EmployeeWhatsAppPage,
  'employee-calendar': EmployeeCalendarPage,
  'employee-attendance': EmployeeAttendancePage,
  'employee-leave': EmployeeLeavePage,
  'employee-salary': EmployeeSalaryPage,
  'employee-performance': EmployeePerformancePage,
  'employee-reports': EmployeeReportsPage,
  'employee-notifications': EmployeeNotificationsPage,
  'employee-settings': EmployeeSettingsPage,
  'employee-help': EmployeeHelpPage,
};

export default function EmployeeViewRouter() {
  const currentView = usePortalStore((s) => s.currentView);

  const ViewComponent = employeeViewMap[currentView] || EmployeeDashboard;
  return <ViewComponent />;
}
