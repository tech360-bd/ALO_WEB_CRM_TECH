'use client';

// ═══════════════════════════════════════════════════════════════
// useCrmLabels — Virtual Editor CRM label overrides (§15)
// ═══════════════════════════════════════════════════════════════
// Super Admins can relabel CRM UI strings (KPI cards, pipeline
// stages, table headers) through /admin/website-cms with content
// type 'crm-label'. Each item's `key` is the stable lookup id
// (e.g. 'crm.kpi.myLeads') and `label` is the display text.
// Consumers pass their compiled-in defaults; published CMS labels
// override them, so the UI is correct even with no CMS data.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';

export type CrmLabelMap = Record<string, string>;

export function useCrmLabels(defaults: CrmLabelMap): CrmLabelMap {
  const [overrides, setOverrides] = useState<CrmLabelMap>({});

  useEffect(() => {
    let cancelled = false;
    fetch('/api/website/cms-content?type=crm-label')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.success || !Array.isArray(j.items)) return;
        const map: CrmLabelMap = {};
        for (const item of j.items) {
          const key = String(item.key || '');
          const label = String(item.label || '');
          if (key && label) map[key] = label;
        }
        if (Object.keys(map).length > 0) setOverrides(map);
      })
      .catch(() => {/* defaults stay */ });
    return () => { cancelled = true; };
  }, []);

  const merged: CrmLabelMap = { ...defaults };
  for (const [k, v] of Object.entries(overrides)) merged[k] = v;
  return merged;
}
