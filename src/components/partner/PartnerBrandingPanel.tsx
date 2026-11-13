'use client';

/**
 * Partner footer branding editor (Partner Super Admin).
 *
 * A B2B partner customises the logo and colour scheme that their own students
 * see in the partner footer block. Nothing here can change ALO Education's own
 * logo, colours or footer copy: the ALO footer is fixed and is always rendered
 * first. This panel only controls the partner block beneath it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RotateCcw, Upload, Palette, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  ALO_BRAND_COLORS,
  PARTNER_BRANDING_LIMITS,
  buildPartnerFooterTheme,
  isHexColor,
  type PartnerBrandingView,
} from '@/lib/partner/branding';
import { usePortalStore } from '@/lib/stores/portal-store';

interface FormState {
  displayName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  websiteUrl: string;
  supportEmail: string;
  supportPhone: string;
  showInFooter: boolean;
}

const EMPTY_FORM: FormState = {
  displayName: '',
  tagline: '',
  logoUrl: '',
  primaryColor: ALO_BRAND_COLORS.primary,
  secondaryColor: ALO_BRAND_COLORS.secondary,
  accentColor: ALO_BRAND_COLORS.accent,
  websiteUrl: '',
  supportEmail: '',
  supportPhone: '',
  showInFooter: true,
};

function toForm(branding: PartnerBrandingView | null): FormState {
  if (!branding) return { ...EMPTY_FORM };
  return {
    displayName: branding.displayName || '',
    tagline: branding.tagline || '',
    logoUrl: branding.logoUrl || '',
    primaryColor: isHexColor(branding.primaryColor) ? branding.primaryColor : ALO_BRAND_COLORS.primary,
    secondaryColor: isHexColor(branding.secondaryColor) ? branding.secondaryColor : ALO_BRAND_COLORS.secondary,
    accentColor: isHexColor(branding.accentColor) ? branding.accentColor : ALO_BRAND_COLORS.accent,
    websiteUrl: branding.websiteUrl || '',
    supportEmail: branding.supportEmail || '',
    supportPhone: branding.supportPhone || '',
    showInFooter: branding.showInFooter,
  };
}

/**
 * Shrinks an uploaded logo to a small square image and returns a data URI.
 * Doing this in the browser keeps the stored payload inside the 96 KB budget,
 * so a partner never has to resize their own artwork.
 */
async function fileToLogoDataUri(file: File): Promise<{ ok: true; value: string } | { ok: false; error: string }> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    return { ok: false, error: 'Upload a PNG, JPEG or WebP image.' };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { ok: false, error: 'Image must be 4 MB or smaller.' };
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('The image could not be decoded.'));
    element.src = dataUrl;
  });

  const max = 320;
  const scale = Math.min(1, max / Math.max(image.width || max, image.height || max));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((image.width || max) * scale));
  canvas.height = Math.max(1, Math.round((image.height || max) * scale));
  const context = canvas.getContext('2d');
  if (!context) return { ok: false, error: 'This browser cannot resize the image; paste an https:// logo URL instead.' };
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.9;
  let output = canvas.toDataURL('image/webp', quality);
  while (output.length > 36_000 && quality > 0.4) {
    quality -= 0.15;
    output = canvas.toDataURL('image/webp', quality);
  }
  const decodedBytes = Math.round((output.length - output.indexOf(',') - 1) * 0.75);
  if (decodedBytes > PARTNER_BRANDING_LIMITS.logoBytes) {
    return { ok: false, error: 'Image is still too large after resizing; paste an https:// logo URL instead.' };
  }
  return { ok: true, value: output };
}

export default function PartnerBrandingPanel() {
  const partnerRole = usePortalStore((state) => state.user?.partnerRole);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const canEdit = !partnerRole || partnerRole.toUpperCase() === 'PARTNER_SUPER_ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/partner/branding', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Partner branding could not be loaded.');
      setForm(toForm((payload.branding as PartnerBrandingView | null) ?? null));
      setLoaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Partner branding could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const theme = useMemo(() => buildPartnerFooterTheme(form), [form]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    const result = await fileToLogoDataUri(file);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    update('logoUrl', result.value);
    toast.success('Logo ready — save to publish it.');
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/partner/branding', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Branding could not be saved.');
      setForm(toForm((payload.branding as PartnerBrandingView | null) ?? null));
      setLoaded(true);
      toast.success('Footer branding saved. Your students will see it immediately.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Branding could not be saved.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-8 text-sm text-alo-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your footer branding…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-alo-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-alo-text">
            <Palette className="h-4 w-4 text-alo-brand" /> Footer logo &amp; colour scheme
          </CardTitle>
          <CardDescription className="text-[13px] text-alo-text-secondary">
            This appears <strong>below</strong> the general ALO Education footer, for your own students only.
            ALO students and ALO employees never see it, and it never replaces ALO branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!canEdit && (
            <div className="flex items-start gap-2 rounded-lg border border-crm-warning-border bg-crm-warning-bg p-3 text-[12.5px] text-crm-warning-text">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Only a Partner Super Admin can change these settings. You can review them here.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-lg border border-crm-danger-border bg-crm-danger-bg p-3 text-[12.5px] text-crm-danger-text">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand-display-name">Company name shown in the footer</Label>
              <Input
                id="brand-display-name"
                value={form.displayName}
                maxLength={PARTNER_BRANDING_LIMITS.displayName}
                disabled={!canEdit}
                onChange={(event) => update('displayName', event.target.value)}
                placeholder="e.g. Sunrise Education Consultancy"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-tagline">Short tagline (optional)</Label>
              <Input
                id="brand-tagline"
                value={form.tagline}
                maxLength={PARTNER_BRANDING_LIMITS.tagline}
                disabled={!canEdit}
                onChange={(event) => update('tagline', event.target.value)}
                placeholder="e.g. Guiding students since 2012"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-alo-border bg-alo-page">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Partner logo preview" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-alo-text-muted" aria-hidden="true" />
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => void handleUpload(event.target.files?.[0] || null)}
              />
              <Button type="button" variant="outline" size="sm" disabled={!canEdit} onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" /> Upload logo
              </Button>
              {form.logoUrl ? (
                <Button type="button" variant="ghost" size="sm" disabled={!canEdit} onClick={() => update('logoUrl', '')}>
                  Remove
                </Button>
              ) : null}
            </div>
            <p className="text-[11.5px] text-alo-text-muted">
              PNG, JPEG or WebP. Uploads are resized automatically. You can also paste a public https:// image URL.
            </p>
            <Input
              aria-label="Logo URL"
              value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl}
              disabled={!canEdit}
              onChange={(event) => update('logoUrl', event.target.value)}
              placeholder="https://your-agency.com/logo.png"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {([
              { key: 'primaryColor' as const, label: 'Primary colour' },
              { key: 'secondaryColor' as const, label: 'Secondary colour' },
              { key: 'accentColor' as const, label: 'Accent colour' },
            ]).map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`brand-${key}`}>{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    id={`brand-${key}`}
                    type="color"
                    aria-label={`${label} picker`}
                    value={isHexColor(form[key]) ? form[key] : ALO_BRAND_COLORS.primary}
                    disabled={!canEdit}
                    onChange={(event) => update(key, event.target.value.toUpperCase())}
                    className="h-9 w-10 cursor-pointer rounded border border-alo-border bg-white p-1"
                  />
                  <Input
                    aria-label={`${label} hex value`}
                    value={form[key]}
                    maxLength={7}
                    disabled={!canEdit}
                    onChange={(event) => update(key, event.target.value.toUpperCase())}
                    className="font-mono text-[13px]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="brand-website">Website (optional)</Label>
              <Input
                id="brand-website"
                value={form.websiteUrl}
                disabled={!canEdit}
                onChange={(event) => update('websiteUrl', event.target.value)}
                placeholder="https://your-agency.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-email">Support email (optional)</Label>
              <Input
                id="brand-email"
                type="email"
                value={form.supportEmail}
                maxLength={PARTNER_BRANDING_LIMITS.supportEmail}
                disabled={!canEdit}
                onChange={(event) => update('supportEmail', event.target.value)}
                placeholder="support@your-agency.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-phone">Support phone (optional)</Label>
              <Input
                id="brand-phone"
                value={form.supportPhone}
                maxLength={PARTNER_BRANDING_LIMITS.supportPhone}
                disabled={!canEdit}
                onChange={(event) => update('supportPhone', event.target.value)}
                placeholder="+880…"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-alo-border bg-alo-page p-3">
            <div>
              <p className="text-[13px] font-semibold text-alo-text">Show this block in my students&apos; footer</p>
              <p className="text-[11.5px] text-alo-text-muted">Turn off to show the ALO footer only.</p>
            </div>
            <Switch
              checked={form.showInFooter}
              disabled={!canEdit}
              onCheckedChange={(checked) => update('showInFooter', checked)}
              aria-label="Show partner block in my students' footer"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void save()} disabled={!canEdit || saving}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Save branding
            </Button>
            <Button variant="outline" onClick={() => void load()} disabled={saving}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reload
            </Button>
            {loaded ? <Badge variant="secondary" className="text-[11px]">Saved earlier: reloaded from server</Badge> : null}
          </div>
        </CardContent>
      </Card>

      {/* Live preview of the partner block exactly as students see it */}
      <Card className="overflow-hidden border-alo-border">
        <CardHeader className="border-b border-alo-border bg-alo-page py-2.5">
          <CardTitle className="text-[12px] font-bold uppercase tracking-wide text-alo-text-muted">Live preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 py-3 text-[11.5px] text-alo-text-muted">
            ALO Education footer (fixed) appears above ↓
          </div>
          <section aria-label="Partner footer preview" style={{ backgroundColor: theme.tint }} className="px-4 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Partner logo" className="h-12 w-12 rounded-lg bg-white object-contain p-1" />
                ) : (
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-lg font-heading text-lg font-extrabold"
                    style={{ backgroundColor: theme.primaryColor, color: theme.onPrimary }}
                  >
                    {(form.displayName || 'P').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="font-heading text-sm font-extrabold" style={{ color: theme.primaryColor }}>
                    {form.displayName || 'Your company name'}
                  </p>
                  <p className="text-[12px] text-alo-text-secondary">{form.tagline || 'Your tagline'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[12px]">
                {form.websiteUrl ? <span style={{ color: theme.primaryColor }} className="font-semibold">Website</span> : null}
                {form.supportEmail ? <span style={{ color: theme.primaryColor }} className="font-semibold">{form.supportEmail}</span> : null}
                {form.supportPhone ? <span style={{ color: theme.secondaryColor }} className="font-semibold">{form.supportPhone}</span> : null}
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: theme.accentColor, color: '#000000' }}>
                  ALO Education partner
                </span>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
