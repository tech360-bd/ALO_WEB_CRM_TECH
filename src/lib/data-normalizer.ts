// ALO Education — Data Normalization Engine
// Automatically normalizes harmless formatting differences across university, course, and country CSV imports

export interface NormalizationResult<T> {
  original: T;
  normalized: T;
  changesMade: { field: string; from: any; to: any }[];
  requiresReview: boolean;
}

// Standard Qualification Mapping
const QUALIFICATION_MAP: Record<string, string> = {
  'm.sc.': 'MSc',
  'msc': 'MSc',
  'master of science': 'MSc',
  'm.a.': 'MA',
  'ma': 'MA',
  'master of arts': 'MA',
  'b.sc.': 'BSc',
  'bsc': 'BSc',
  'bachelor of science': 'BSc',
  'b.a.': 'BA',
  'ba': 'BA',
  'bachelor of arts': 'BA',
  'ph.d.': 'PhD',
  'phd': 'PhD',
  'doctor of philosophy': 'PhD',
  'm.res': 'MRes',
  'mres': 'MRes',
  'master of research': 'MRes',
  'm.phil': 'MPhil',
  'mphil': 'MPhil',
  'master of philosophy': 'MPhil',
  'hnd': 'HND',
  'higher national diploma': 'HND',
};

// ISO Country Code Mapping
const COUNTRY_ISO_MAP: Record<string, string> = {
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'northern ireland': 'GB',
  'united states': 'US',
  'usa': 'US',
  'us': 'US',
  'canada': 'CA',
  'australia': 'AU',
  'ireland': 'IE',
  'republic of ireland': 'IE',
  'new zealand': 'NZ',
  'germany': 'DE',
  'netherlands': 'NL',
  'sweden': 'SE',
  'finland': 'FI',
  'denmark': 'DK',
  'france': 'FR',
  'italy': 'IT',
  'spain': 'ES',
  'austria': 'AT',
  'belgium': 'BE',
  'switzerland': 'CH',
  'poland': 'PL',
  'hungary': 'HU',
  'czech republic': 'CZ',
  'lithuania': 'LT',
  'latvia': 'LV',
  'cyprus': 'CY',
  'malta': 'MT',
  'malaysia': 'MY',
  'singapore': 'SG',
  'united arab emirates': 'AE',
  'uae': 'AE',
  'dubai': 'AE',
  'saudi arabia': 'SA',
  'japan': 'JP',
  'south korea': 'KR',
  'china': 'CN',
  'hong kong': 'HK',
};

// Currency Code Mapping
const CURRENCY_MAP: Record<string, string> = {
  'pound sterling': 'GBP',
  'pound': 'GBP',
  '£': 'GBP',
  'gbp': 'GBP',
  'us dollar': 'USD',
  '$': 'USD',
  'usd': 'USD',
  'canadian dollar': 'CAD',
  'ca$': 'CAD',
  'cad': 'CAD',
  'australian dollar': 'AUD',
  'a$': 'AUD',
  'aud': 'AUD',
  'euro': 'EUR',
  '€': 'EUR',
  'eur': 'EUR',
  'uae dirham': 'AED',
  'aed': 'AED',
};

export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  let sanitized = text.trim();
  if (/^[=+\-@]/.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }
  return sanitized.replace(/\s+/g, ' ');
}

export function normalizeQualification(qualification: string): string {
  const clean = normalizeText(qualification).toLowerCase();
  return QUALIFICATION_MAP[clean] || normalizeText(qualification);
}

export function normalizeCountryIso(countryName: string): string {
  const clean = normalizeText(countryName).toLowerCase();
  return COUNTRY_ISO_MAP[clean] || normalizeText(countryName).toUpperCase();
}

export function normalizeCurrency(currency: string): string {
  const clean = normalizeText(currency).toLowerCase();
  return CURRENCY_MAP[clean] || normalizeText(currency).toUpperCase();
}

export function normalizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  const str = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 't'].includes(str);
}

export function normalizeUrl(url: string): string {
  const clean = normalizeText(url);
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
}

export function normalizeCountryRecord(rawRecord: Record<string, any>): NormalizationResult<Record<string, any>> {
  const normalized: Record<string, any> = { ...rawRecord };
  const changesMade: { field: string; from: any; to: any }[] = [];
  let requiresReview = false;

  for (const key of Object.keys(normalized)) {
    if (typeof normalized[key] === 'string') {
      const originalVal = normalized[key];
      const cleanedVal = normalizeText(originalVal);
      if (cleanedVal !== originalVal) {
        changesMade.push({ field: key, from: originalVal, to: cleanedVal });
        normalized[key] = cleanedVal;
      }
    }
  }

  if (normalized.country_code) {
    const origCode = normalized.country_code;
    const normCode = normalizeCountryIso(origCode);
    if (normCode !== origCode) {
      changesMade.push({ field: 'country_code', from: origCode, to: normCode });
      normalized.country_code = normCode;
    }
  }

  if (normalized.currency) {
    const origCurr = normalized.currency;
    const normCurr = normalizeCurrency(origCurr);
    if (normCurr !== origCurr) {
      changesMade.push({ field: 'currency', from: origCurr, to: normCurr });
      normalized.currency = normCurr;
    }
  }

  const substantiveFields = ['visa_guidance', 'post_study_work_guidance', 'scholarship_overview'];
  for (const subField of substantiveFields) {
    if (rawRecord[subField] !== undefined && rawRecord[subField] !== null) {
      requiresReview = true;
    }
  }

  return {
    original: rawRecord,
    normalized,
    changesMade,
    requiresReview,
  };
}

export function normalizeCourseRecord(rawRecord: Record<string, any>): NormalizationResult<Record<string, any>> {
  const normalized: Record<string, any> = { ...rawRecord };
  const changesMade: { field: string; from: any; to: any }[] = [];
  let requiresReview = false;

  for (const key of Object.keys(normalized)) {
    if (typeof normalized[key] === 'string') {
      const originalVal = normalized[key];
      const cleanedVal = normalizeText(originalVal);
      if (cleanedVal !== originalVal) {
        changesMade.push({ field: key, from: originalVal, to: cleanedVal });
        normalized[key] = cleanedVal;
      }
    }
  }

  if (normalized.qualification) {
    const origQual = normalized.qualification;
    const normQual = normalizeQualification(origQual);
    if (normQual !== origQual) {
      changesMade.push({ field: 'qualification', from: origQual, to: normQual });
      normalized.qualification = normQual;
    }
  }

  if (normalized.country) {
    const origCountry = normalized.country;
    const normCountry = normalizeCountryIso(origCountry);
    if (normCountry !== origCountry) {
      changesMade.push({ field: 'country', from: origCountry, to: normCountry });
      normalized.country = normCountry;
    }
  }

  if (normalized.currency) {
    const origCurr = normalized.currency;
    const normCurr = normalizeCurrency(origCurr);
    if (normCurr !== origCurr) {
      changesMade.push({ field: 'currency', from: origCurr, to: normCurr });
      normalized.currency = normCurr;
    }
  }

  if (normalized.official_source_url) {
    const origUrl = normalized.official_source_url;
    const normUrl = normalizeUrl(origUrl);
    if (normUrl !== origUrl) {
      changesMade.push({ field: 'official_source_url', from: origUrl, to: normUrl });
      normalized.official_source_url = normUrl;
    }
  }

  const substantiveFields = ['tuition_fee', 'min_gpa', 'min_ielts', 'deadline', 'available_to_international'];
  for (const subField of substantiveFields) {
    if (rawRecord[subField] !== undefined && rawRecord[subField] !== null) {
      requiresReview = true;
    }
  }

  return {
    original: rawRecord,
    normalized,
    changesMade,
    requiresReview,
  };
}
