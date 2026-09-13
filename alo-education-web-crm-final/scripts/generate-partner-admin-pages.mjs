import fs from 'fs';
import path from 'path';

const routes = [
  'company-profile',
  'users',
  'users/create',
  'roles',
  'students',
  'leads',
  'applications',
  'documents',
  'course-finder',
  'marketing-studio',
  'content-generator',
  'image-generator',
  'video-generator',
  'social-scheduler',
  'mock-tests',
  'interview-prep',
  'voucher-codes',
  'usage-quota',
  'reports',
  'support-request',
  'settings'
];

const basePath = path.join(process.cwd(), 'src/app/partner-admin');

routes.forEach((r) => {
  const dir = path.join(basePath, r);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, 'page.tsx');
  const routePath = `/partner-admin/${r}`;
  const code = `import MasterPartnerAdminView from '@/components/partner/MasterPartnerAdminView';

export default function PartnerAdmin${r.replace(/[^a-zA-Z0-9]/g, '_')}Page() {
  return <MasterPartnerAdminView currentPath="${routePath}" />;
}
`;

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Generated: ${filePath}`);
});
