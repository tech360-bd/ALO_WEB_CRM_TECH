/**
 * ALO AI Workforce — security controls (§15, §22, §36).
 *
 * Covers the attack surface the acceptance suite exercises:
 *  - prompt injection in untrusted free text,
 *  - secret extraction attempts and secret leakage in logs/telemetry,
 *  - privilege-escalation attempts expressed as tool arguments,
 *  - filesystem / shell / schema access attempts,
 *  - malicious file metadata.
 */

const INJECTION_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: 'IGNORE_INSTRUCTIONS', pattern: /\b(ignore|disregard|forget)\b[^.\n]{0,40}\b(previous|prior|above|all)\b[^.\n]{0,20}\b(instruction|prompt|rule|direction)/i },
  { id: 'ROLE_OVERRIDE', pattern: /\b(you are now|act as|pretend to be|from now on you)\b/i },
  { id: 'SYSTEM_PROMPT_EXFIL', pattern: /\b(reveal|print|show|repeat|output)\b[^.\n]{0,30}\b(system prompt|your instructions|initial prompt)\b/i },
  { id: 'SECRET_EXFIL', pattern: /\b(api[_\s-]?key|secret|password|credential|token|\.env|environment variable)\b[^.\n]{0,30}\b(show|print|reveal|list|give|send|what)\b/i },
  { id: 'SECRET_EXFIL_REVERSE', pattern: /\b(show|print|reveal|list|give|send|what is)\b[^.\n]{0,30}\b(api[_\s-]?key|secret|password|credential|access token|\.env)\b/i },
  { id: 'TOOL_OVERRIDE', pattern: /\b(grant|give|enable|allow)\b[^.\n]{0,30}\b(yourself|you)\b[^.\n]{0,30}\b(tool|permission|admin|access)\b/i },
  // Direct tool invocation demanded from free text: tools are called by ALO
  // skills, never by instruction embedded in untrusted content.
  { id: 'TOOL_INVOCATION_DEMAND', pattern: /\b(use|call|invoke|execute|run)\b[^.\n]{0,20}\b(the\s+)?tool\b|\b(use|call|invoke|run)\s+[a-z]+(?:\.[a-z_]+){1,3}\b/i },
  { id: 'PRIVILEGE_ESCALATION', pattern: /\b(make me|set my role to|elevate|promote me to)\b[^.\n]{0,20}\b(admin|super.?admin|root|superuser)\b/i },
  { id: 'AUDIT_DISABLE', pattern: /\b(disable|turn off|stop|bypass|skip)\b[^.\n]{0,20}\b(audit|logging|log|telemetry)\b/i },
  { id: 'SHELL_EXECUTION', pattern: /\b(rm\s+-rf|curl\s+http|wget\s+http|bash\s+-c|child_process|exec\(|spawn\()/i },
  { id: 'SQL_INJECTION', pattern: /(\bunion\b\s+\bselect\b|;\s*drop\s+table|--\s*$|\bor\b\s+1\s*=\s*1)/i },
  { id: 'PATH_TRAVERSAL', pattern: /(\.\.\/){2,}|\/etc\/(passwd|shadow)|file:\/\/\//i },
  { id: 'SCHEMA_MUTATION', pattern: /\b(alter|drop|truncate)\s+(table|database|schema)\b/i },
  { id: 'CROSS_TENANT', pattern: /\b(all|every|other)\s+(students?|users?|partners?|leads?)\b[^.\n]{0,30}\b(records?|data|documents?|passwords?)\b/i },
  { id: 'CROSS_TENANT_REVERSE', pattern: /\b(records?|data|documents?|profiles?|details)\b[^.\n]{0,30}\b(of|for)\b[^.\n]{0,20}\b(all|every|other)\s+(students?|users?|partners?|leads?|customers?)\b/i },
];

const SECRET_PATTERNS: RegExp[] = [
  /\b(sk|pk|rk)-[A-Za-z0-9_-]{12,}/g,
  /\bBearer\s+[A-Za-z0-9._-]{12,}/gi,
  /\b[A-Za-z0-9_]*(?:API_KEY|APIKEY|SECRET|PASSWORD|PASSWD|TOKEN|PRIVATE_KEY)[A-Za-z0-9_]*\s*[:=]\s*["']?[^\s"']{4,}/gi,
  /\bmysql:\/\/[^\s"']+/gi,
  /\bpostgres(?:ql)?:\/\/[^\s"']+/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
];

export interface InjectionFinding {
  id: string;
  path: string;
  excerpt: string;
}

export interface ScreeningResult {
  sanitized: Record<string, unknown>;
  findings: InjectionFinding[];
  blocked: boolean;
}

function neutralize(text: string, findings: InjectionFinding[], path: string): string {
  let out = text;
  for (const { id, pattern } of INJECTION_PATTERNS) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const global = new RegExp(pattern.source, flags);
    out = out.replace(global, (match) => {
      findings.push({ id, path, excerpt: match.slice(0, 120) });
      return '[blocked-instruction]';
    });
  }
  return out;
}

/**
 * Walk an untrusted object and neutralise embedded instructions.
 * Returns a sanitised copy — the original text is never forwarded to a runtime.
 */
export function screenForInjection(value: Record<string, unknown>): ScreeningResult {
  const findings: InjectionFinding[] = [];
  const walk = (node: unknown, path: string): unknown => {
    if (typeof node === 'string') return neutralize(node, findings, path);
    if (Array.isArray(node)) return node.map((item, index) => walk(item, `${path}[${index}]`));
    if (node && typeof node === 'object' && !(node instanceof Date)) {
      return Object.fromEntries(Object.entries(node as Record<string, unknown>).map(([key, item]) => [key, walk(item, path ? `${path}.${key}` : key)]));
    }
    return node;
  };
  const sanitized = walk(value, '') as Record<string, unknown>;
  const critical = new Set(['PRIVILEGE_ESCALATION', 'AUDIT_DISABLE', 'SHELL_EXECUTION', 'SCHEMA_MUTATION', 'SECRET_EXFIL', 'SECRET_EXFIL_REVERSE']);
  return { sanitized, findings, blocked: findings.some((finding) => critical.has(finding.id)) };
}

/** Detect injection in a single string without modifying it. */
export function detectInjection(text: string): InjectionFinding[] {
  const findings: InjectionFinding[] = [];
  for (const { id, pattern } of INJECTION_PATTERNS) {
    if (pattern.test(text)) findings.push({ id, path: '', excerpt: text.slice(0, 120) });
  }
  return findings;
}

/** Remove anything that looks like a credential before persistence or display. */
export function redactSecrets(value: string): string {
  let out = String(value ?? '');
  for (const pattern of SECRET_PATTERNS) out = out.replace(pattern, '[redacted-secret]');
  return out;
}

export function redactDeep<T>(value: T): T {
  if (typeof value === 'string') return redactSecrets(value) as unknown as T;
  if (Array.isArray(value)) return value.map((item) => redactDeep(item)) as unknown as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        /password|secret|token|apikey|api_key|passwordhash|otp/i.test(key) ? '[redacted-secret]' : redactDeep(item),
      ])
    ) as unknown as T;
  }
  return value;
}

const FORBIDDEN_ARG_KEYS = [
  'role', 'roles', 'permission', 'permissions', 'isadmin', 'issuperadmin', 'passwordhash',
  'allowedroles', 'isprotected', 'auditpolicy', 'securitypolicy', '__proto__', 'constructor', 'prototype',
];

export interface ArgumentScreening {
  ok: boolean;
  violations: string[];
}

/**
 * Tool arguments can never carry privilege changes, prototype pollution,
 * filesystem paths or shell content, regardless of which agent supplied them.
 */
export function screenToolArguments(args: Record<string, unknown>): ArgumentScreening {
  const violations: string[] = [];
  const walk = (node: unknown, path: string, depth: number): void => {
    if (depth > 8) {
      violations.push(`${path}: argument nesting exceeds the permitted depth`);
      return;
    }
    if (typeof node === 'string') {
      if (/(\.\.\/)|(^\/(etc|proc|root|home|var)\/)|(^file:\/\/)/.test(node)) violations.push(`${path}: filesystem path arguments are not permitted`);
      if (/(^|[\s;|&])(rm|curl|wget|bash|sh|node|python3?)\s/.test(node)) violations.push(`${path}: shell-like argument rejected`);
      if (/\b(alter|drop|truncate)\s+(table|database|schema)\b/i.test(node)) violations.push(`${path}: schema mutation argument rejected`);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1));
      return;
    }
    if (node && typeof node === 'object') {
      for (const [key, item] of Object.entries(node as Record<string, unknown>)) {
        if (FORBIDDEN_ARG_KEYS.includes(key.toLowerCase())) {
          violations.push(`${path ? `${path}.` : ''}${key}: privilege/structural fields cannot be set through a tool argument`);
          continue;
        }
        walk(item, path ? `${path}.${key}` : key, depth + 1);
      }
    }
  };
  walk(args, '', 0);
  return { ok: violations.length === 0, violations };
}

const DANGEROUS_FILE_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.js', '.mjs', '.php', '.jar', '.scr', '.ps1', '.com', '.dll', '.so',
  // Macro-enabled office documents execute code on open.
  '.docm', '.xlsm', '.pptm', '.dotm', '.xlam', '.xltm', '.potm',
  '.vbs', '.wsf', '.hta', '.msi', '.apk', '.iso',
];

export interface FileScreening {
  ok: boolean;
  reasons: string[];
}

/** Validate untrusted document metadata before an agent may analyse it. */
export function screenFileInput(file: { fileName?: string; mimeType?: string; sizeBytes?: number }): FileScreening {
  const reasons: string[] = [];
  const name = String(file.fileName || '');
  if (!name) reasons.push('File name is required');
  if (/[\u0000-\u001f]/.test(name)) reasons.push('File name contains control characters');
  if (name.includes('..') || name.includes('/') || name.includes('\\')) reasons.push('File name contains path separators');
  const lower = name.toLowerCase();
  for (const extension of DANGEROUS_FILE_EXTENSIONS) {
    if (lower.endsWith(extension)) reasons.push(`Executable file type ${extension} is not accepted`);
  }
  if (/\.(pdf|jpg|jpeg|png|docx?)\.[a-z0-9]{1,5}$/i.test(lower)) reasons.push('Double extension detected');
  if (typeof file.sizeBytes === 'number' && file.sizeBytes > 25 * 1024 * 1024) reasons.push('File exceeds the 25MB analysis limit');
  const mime = String(file.mimeType || '').toLowerCase();
  if (mime && !/^(application\/pdf|image\/(png|jpe?g|webp)|application\/vnd\.openxmlformats|application\/msword|text\/plain)/.test(mime)) {
    reasons.push(`MIME type ${mime} is not accepted for document analysis`);
  }
  return { ok: reasons.length === 0, reasons };
}
