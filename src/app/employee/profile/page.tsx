import EmployeeProfilePage from '@/components/employee/EmployeeProfilePage';

// The employee layout (src/app/employee/layout.tsx) already mounts
// EmployeePortalShell. Wrapping the page in a second shell rendered a second
// header, sidebar and footer on the same screen.
export default function EmployeeProfileRoute() {
  return <EmployeeProfilePage />;
}
