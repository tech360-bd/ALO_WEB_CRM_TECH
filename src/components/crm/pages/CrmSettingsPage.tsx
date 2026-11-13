'use client';

import { useState } from 'react';
import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Save, Mail, MessageSquare, Smartphone, CreditCard, Shield, Bell, Globe, Building2, Key } from 'lucide-react';

interface SettingField {
  label: string;
  type: 'toggle' | 'text' | 'email' | 'number';
  value: boolean | string;
  description?: string;
}

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  fields: SettingField[];
}

const initialSections: SettingsSection[] = [
  {
    id: 'general', title: 'General Settings', description: 'Company name, timezone, language, and basic configuration.',
    icon: Building2, color: 'text-alo-brand bg-[var(--alo-cta-soft)]',
    fields: [
      { label: 'Company Name', type: 'text', value: 'ALO Education Ltd.' },
      { label: 'Timezone', type: 'text', value: 'Asia/Dhaka (UTC+6)' },
      { label: 'Default Language', type: 'text', value: 'English' },
      { label: 'Currency', type: 'text', value: 'BDT (৳)' },
      { label: 'Enable Maintenance Mode', type: 'toggle', value: false, description: 'Show maintenance page to non-admin users' },
    ],
  },
  {
    id: 'email', title: 'Email Settings', description: 'SMTP configuration for transactional and marketing emails.',
    icon: Mail, color: 'text-[var(--alo-brand)] bg-[var(--alo-brand-pale)]',
    fields: [
      { label: 'SMTP Host', type: 'text', value: 'smtp.gmail.com' },
      { label: 'SMTP Port', type: 'number', value: '587' },
      { label: 'Sender Email', type: 'email', value: 'noreply@aloeducation.com' },
      { label: 'Enable TLS', type: 'toggle', value: true },
      { label: 'Email Notifications', type: 'toggle', value: true, description: 'Send email for critical events' },
    ],
  },
  {
    id: 'sms', title: 'SMS Settings', description: 'SMS gateway configuration for OTP and notifications.',
    icon: MessageSquare, color: 'text-crm-success-text bg-crm-success-bg',
    fields: [
      { label: 'SMS Provider', type: 'text', value: 'BulkSMS BD' },
      { label: 'API Key', type: 'text', value: '••••••••••••' },
      { label: 'Sender ID', type: 'text', value: 'ALOEDU' },
      { label: 'OTP SMS Enabled', type: 'toggle', value: true },
    ],
  },
  {
    id: 'whatsapp', title: 'WhatsApp Settings', description: 'WhatsApp Business API integration for messaging.',
    icon: Smartphone, color: 'text-crm-success-text bg-crm-success-bg',
    fields: [
      { label: 'Business Number', type: 'text', value: '+880 1XXX-XXXXXX' },
      { label: 'API Token', type: 'text', value: '••••••••••••' },
      { label: 'Auto-Reply Enabled', type: 'toggle', value: true },
      { label: 'Template Messages', type: 'toggle', value: true, description: 'Use pre-approved message templates' },
    ],
  },
  {
    id: 'payment', title: 'Payment Gateway', description: 'Configure payment methods and gateway settings.',
    icon: CreditCard, color: 'text-yellow-600 bg-yellow-50',
    fields: [
      { label: 'Gateway Provider', type: 'text', value: 'SSLCommerz' },
      { label: 'Store ID', type: 'text', value: 'aloedu_live' },
      { label: 'Test Mode', type: 'toggle', value: false, description: 'Use sandbox for testing' },
      { label: 'Auto-Reconciliation', type: 'toggle', value: true },
    ],
  },
  {
    id: 'security', title: 'Security Settings', description: 'Password policy, 2FA, session management, and IP restrictions.',
    icon: Shield, color: 'text-crm-danger-text bg-crm-danger-bg',
    fields: [
      { label: 'Enforce 2FA', type: 'toggle', value: true, description: 'Require two-factor authentication for all staff' },
      { label: 'Session Timeout (min)', type: 'number', value: '30' },
      { label: 'Max Login Attempts', type: 'number', value: '5' },
      { label: 'Password Min Length', type: 'number', value: '8' },
      { label: 'IP Whitelist', type: 'toggle', value: false, description: 'Restrict access to whitelisted IPs' },
    ],
  },
  {
    id: 'notifications', title: 'Notification Templates', description: 'Customize notification messages for different events.',
    icon: Bell, color: 'text-[var(--alo-brand)] bg-[var(--alo-brand-pale)]',
    fields: [
      { label: 'Welcome Email Template', type: 'toggle', value: true },
      { label: 'Application Update SMS', type: 'toggle', value: true },
      { label: 'Payment Receipt Email', type: 'toggle', value: true },
      { label: 'Visa Status WhatsApp', type: 'toggle', value: true },
      { label: 'Lead Assignment Notify', type: 'toggle', value: true, description: 'Notify counselor on lead assignment' },
    ],
  },
];

export default function CrmSettingsPage() {
  const { setView } = usePortalStore();
  const [sections, setSections] = useState(initialSections);
  const [saved, setSaved] = useState<string | null>(null);

  const updateField = (sectionId: string, fieldLabel: string, newValue: boolean | string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.map((f) => f.label === fieldLabel ? { ...f, value: newValue } : f) }
          : s
      )
    );
  };

  const handleSave = (sectionId: string) => {
    setSaved(sectionId);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-alo-text">System Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Card key={section.id} className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${section.color}`}>
                  <section.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold text-alo-text">{section.title}</CardTitle>
                  <p className="text-xs text-alo-text-muted mt-1">{section.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {section.fields.map((field) => (
                <div key={field.label} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="text-sm font-medium text-alo-text">{field.label}</label>
                    {field.description && <p className="text-xs text-alo-text-muted">{field.description}</p>}
                  </div>
                  {field.type === 'toggle' ? (
                    <Switch checked={field.value as boolean}
                      onCheckedChange={(v) => updateField(section.id, field.label, v)} />
                  ) : (
                    <Input value={field.value as string} onChange={(e) => updateField(section.id, field.label, e.target.value)}
                      type={field.type} className="max-w-[220px] h-9 text-sm" />
                  )}
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t border-alo-border/50">
                <Button size="sm" className="bg-alo-brand hover:bg-alo-brand-light text-white"
                  onClick={() => handleSave(section.id)}>
                  <Save className="mr-1 h-3.5 w-3.5" />
                  {saved === section.id ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}