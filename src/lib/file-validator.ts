// ============================================================
// Secure File Validator
// Validates MIME type, extension, file size before storage
// Auto-detects document type from filename heuristics
// ============================================================

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedDocType?: string;
  sanitizedName?: string;
}

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
};

const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'sh', 'cmd', 'php', 'js', 'ts', 'py', 'rb', 'pl',
  'ps1', 'vbs', 'jar', 'dll', 'msi', 'app', 'deb', 'rpm', 'dmg',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function validateFile(
  fileName: string,
  mimeType: string,
  fileSize: number
): FileValidationResult {
  const ext = (fileName.split('.').pop() || '').toLowerCase().trim();

  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File type .${ext} is not permitted for security reasons.` };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: `File exceeds maximum allowed size of 20 MB.` };
  }

  const allowedExts = ALLOWED_MIME_TYPES[mimeType];
  if (!allowedExts) {
    return { valid: false, error: `MIME type "${mimeType}" is not permitted.` };
  }

  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `File extension ".${ext}" does not match declared MIME type "${mimeType}".`,
    };
  }

  const detectedDocType = detectDocumentType(fileName);
  const sanitizedName = sanitizeFileName(fileName);

  return { valid: true, detectedDocType, sanitizedName };
}

function detectDocumentType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('passport')) return 'passport';
  if (lower.includes('ielts')) return 'ielts_certificate';
  if (lower.includes('pte')) return 'pte_certificate';
  if (lower.includes('toefl')) return 'toefl_certificate';
  if (lower.includes('duolingo') || lower.includes(' det')) return 'duolingo_certificate';
  if (lower.includes('transcript')) return 'academic_transcript';
  if (lower.includes('degree') && lower.includes('cert')) return 'degree_certificate';
  if (lower.includes('sop') || lower.includes('personal_statement')) return 'sop';
  if (lower.includes('cv') || lower.includes('resume')) return 'cv';
  if (lower.includes('bank') || lower.includes('statement')) return 'bank_statement';
  if (lower.includes('offer')) return 'offer_letter';
  if (lower.includes('cas')) return 'cas';
  if (lower.includes('coe')) return 'coe';
  if (lower.includes('i20') || lower.includes('i-20')) return 'i20';
  if (lower.includes('visa')) return 'visa_document';
  if (lower.includes('nid') || lower.includes('national_id')) return 'nid';
  if (lower.includes('photo') || lower.includes('portrait')) return 'photograph';
  return 'unknown';
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
    .substring(0, 200);
}
