'use client';

import {
  GraduationCap,
  Users,
  Briefcase,
  Shield,
  Lock,
  ShieldCheck,
  EyeOff,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePortalStore, type SelectedPortal } from '@/lib/stores/portal-store';

// ============================================================
// Portal definitions
// ============================================================
interface PortalCard {
  id: SelectedPortal;
  name: string;
  icon: React.ElementType;
  description: string;
  audience: string;
  showRegister: boolean;
  loginView: 'login' | 'employee-login';
  registerView: 'register' | 'employee-login';
}

const PORTALS: PortalCard[] = [
  {
    id: 'student',
    name: 'Student Portal',
    icon: GraduationCap,
    description:
      'For ALO Education students to track applications, upload documents, message counselors, find courses, and manage their study abroad journey.',
    audience: 'Current & prospective students',
    showRegister: true,
    loginView: 'login',
    registerView: 'register',
  },
  {
    id: 'partner',
    name: 'Partner Portal',
    icon: Users,
    description:
      'For approved ALO partners to submit leads, track applications, upload documents, and monitor commission status.',
    audience: 'Approved recruitment partners',
    showRegister: true,
    loginView: 'login',
    registerView: 'register',
  },
  {
    id: 'employee',
    name: 'ALO Employee Portal',
    icon: Briefcase,
    description:
      'For ALO Education employees to manage assigned students, tasks, communication, attendance, and performance.',
    audience: 'ALO Education staff only',
    showRegister: false,
    loginView: 'employee-login',
    registerView: 'employee-login',
  },
  {
    id: 'admin',
    name: 'CRM Admin',
    icon: Shield,
    description:
      'For authorized admin users to manage CRM, users, applications, reports, settings, and system operations.',
    audience: 'Authorized administrators only',
    showRegister: false,
    loginView: 'employee-login',
    registerView: 'employee-login',
  },
];

const TRUST_ITEMS = [
  { icon: Lock, label: '256-bit Encrypted' },
  { icon: ShieldCheck, label: 'RBAC Protected' },
  { icon: EyeOff, label: 'Privacy Mode' },
  { icon: Server, label: 'Audit Logged' },
] as const;

// ============================================================
// Single portal card
// ============================================================
function PortalCardItem({ portal }: { portal: PortalCard }) {
  const { setSelectedPortal, setView } = usePortalStore();
  const Icon = portal.icon;

  const handleLogin = () => {
    setSelectedPortal(portal.id);
    setView(portal.loginView);
  };

  const handleRegister = () => {
    setSelectedPortal(portal.id);
    setView(portal.registerView);
  };

  return (
    <div className="flex flex-col rounded-xl border border-[var(--alo-border)] bg-white p-5 transition-shadow duration-200 hover:shadow-lg">
      {/* Icon */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
        <Icon className="h-5 w-5 text-orange-600" />
      </div>

      {/* Name */}
      <h3 className="mt-4 text-lg font-semibold text-[var(--alo-text)]">
        {portal.name}
      </h3>

      {/* Description */}
      <p className="mt-1 text-sm leading-relaxed text-[var(--alo-text-muted)]">
        {portal.description}
      </p>

      {/* Audience */}
      <p className="mt-2 text-xs text-[var(--alo-text-muted)]">{portal.audience}</p>

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2">
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          onClick={handleLogin}
        >
          Login
        </Button>

        {portal.showRegister && (
          <Button
            variant="outline"
            className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
            onClick={handleRegister}
          >
            Register
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PortalSelector — main export
// ============================================================
export default function PortalSelector() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* ---- Header with logo ---- */}
      <header className="flex justify-center pt-8 pb-2 md:pt-12 md:pb-4">
        <div className="flex items-center gap-3">
          <img
            src="/images/landing/Copy of logo.webp"
            alt="ALO Education"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[var(--alo-text)]">
              ALO Education
            </span>
            <span className="text-xs italic text-orange-500" style={{ fontFamily: 'Georgia, serif' }}>
              Your Dream – Our Commitment
            </span>
          </div>
        </div>
      </header>

      {/* ---- Content area ---- */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pb-12 sm:px-6 lg:px-8">
        {/* Title */}
        <h1 className="mt-6 text-center text-3xl font-bold text-[var(--alo-text)] md:mt-10 md:text-4xl">
          Welcome to ALO Education
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-center text-[var(--alo-text-muted)]">
          Choose your portal to continue
        </p>

        {/* Portal grid */}
        <div className="mt-8 grid w-full grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {PORTALS.map((portal) => (
            <PortalCardItem key={portal.id} portal={portal} />
          ))}
        </div>

        {/* Trust / Security section */}
        <section className="mt-8 flex flex-wrap items-center justify-center gap-4 md:mt-12 md:gap-8">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-xs text-[var(--alo-text-muted)]"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

