import EmployeeProfilePage from '@/components/employee/EmployeeProfilePage';
import EmployeePortalShell from '@/components/employee/EmployeePortalShell';

export default function EmployeeProfileRoute() {
  return (
    <EmployeePortalShell>
      <EmployeeProfilePage />
    </EmployeePortalShell>
  );
}
