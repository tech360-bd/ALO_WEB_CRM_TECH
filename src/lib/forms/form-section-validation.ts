import { getFormSection, visibleFields, type FormSectionKey } from './application-form-schema';

/** Shared by counselor capture, student saves and the server-side apply gate. */
export function isFormSectionComplete(key: FormSectionKey, data: unknown): boolean {
  const section = getFormSection(key);
  if (!section || !data || typeof data !== 'object' || Array.isArray(data)) return false;
  const payload = data as Record<string, unknown>;
  const rows = section.repeatable && Array.isArray(payload.entries) ? payload.entries : [payload];
  if (!rows.length) return false;
  return rows.every((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
    const values = row as Record<string, unknown>;
    return visibleFields(section, values).filter((field) => field.required).every((field) => {
      const value = values[field.name];
      if (field.type === 'checkbox') return value === true;
      if (typeof value !== 'string' && typeof value !== 'number') return false;
      const text = String(value).trim();
      if (!text || (field.options && !field.options.includes(text))) return false;
      if (field.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
      if (field.type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text));
      return true;
    });
  });
}
