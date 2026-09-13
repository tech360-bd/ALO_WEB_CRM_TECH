import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const evidenceDir = fs.existsSync(path.join(root, ".current-evidence-dir"))
  ? fs.readFileSync(path.join(root, ".current-evidence-dir"), "utf8").trim()
  : "";
const reportDir = evidenceDir ? path.join(root, evidenceDir, "reports") : root;
fs.mkdirSync(reportDir, { recursive: true });

const excludedDirs = new Set([
  ".git",
  ".next",
  "node_modules",
  ".turbo",
  ".cache",
  "coverage",
  "dist",
]);

function shouldSkip(rel) {
  const parts = rel.split(path.sep);
  if (parts.some((part) => excludedDirs.has(part))) return true;
  if (parts.some((part) => part.startsWith("delivery-evidence-"))) return true;
  if (parts.includes("download") || parts.includes("upload")) return true;
  if (parts.includes("remediation-baseline-2026-07-27")) return true;
  if (parts.includes("remediation-work")) return true;
  if (/\.(zip|tar|gz|db|MySQL|log|tsbuildinfo)$/i.test(rel)) return true;
  if (rel === ".env" || rel === ".env.production") return true;
  return false;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs);
    if (shouldSkip(rel)) continue;
    if (entry.isSymbolicLink()) {
      out.push({ abs, rel, type: "symlink" });
      continue;
    }
    if (entry.isDirectory()) {
      walk(abs, out);
      continue;
    }
    if (entry.isFile()) out.push({ abs, rel, type: "file" });
  }
  return out;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(name, rows) {
  const text = rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
  fs.writeFileSync(path.join(root, name), text);
  fs.writeFileSync(path.join(reportDir, name), text);
}

function relFilesUnder(dir, predicate = () => true) {
  return walk(path.join(root, dir)).filter((f) => predicate(f.rel));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function command(cmd, args) {
  try {
    return execFileSync(cmd, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    return `ERROR: ${error.status ?? "unknown"}`;
  }
}

const pkg = readJson("package.json");
const schemaPath = path.join(root, "prisma/schema.prisma");
const schema = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, "utf8") : "";
const providerMatch = schema.match(/datasource\s+db\s+\{[\s\S]*?provider\s*=\s*"([^"]+)"/);
const models = [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((m) => m[1]);
const datasourceProvider = providerMatch?.[1] ?? "Not found";
const migrationFiles = fs.existsSync(path.join(root, "prisma/migrations"))
  ? fs.readdirSync(path.join(root, "prisma/migrations"), { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, "prisma/migrations", d.name, "migration.sql")))
      .map((d) => d.name)
  : [];

const files = walk(root);
const sourceFiles = files.filter((f) => f.rel.startsWith(`src${path.sep}`));
const apiRoutes = relFilesUnder("src/app/api", (rel) => rel.endsWith(`${path.sep}route.ts`) || rel.endsWith(`${path.sep}route.tsx`));
const pageRoutes = relFilesUnder("src/app", (rel) => rel.endsWith(`${path.sep}page.tsx`) || rel.endsWith(`${path.sep}page.ts`));
const testFiles = files.filter((f) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f.rel) || f.rel.startsWith(`tests${path.sep}`));
const docs = files.filter((f) => /\.(md|mdx|csv)$/i.test(f.rel));
const envFiles = files.filter((f) => /(^|\/)\.env\.example$|(^|\/)env\.example$/i.test(f.rel));
const apiInventoryRows = [["Method", "Route", "File", "Authentication", "Permission", "Scope", "Validation", "Database models", "Audit event", "Test file", "Status"]];

for (const route of apiRoutes) {
  const src = fs.readFileSync(route.abs, "utf8");
  const methods = [...src.matchAll(/export\s+(?:async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE)/g)].map((m) => m[1]);
  const routePath = "/" + path.dirname(path.relative(path.join(root, "src/app"), route.abs))
    .replaceAll(path.sep, "/")
    .replace(/^api/, "api")
    .replace(/\([^)]+\)\//g, "")
    .replace(/\[[^\]]+\]/g, "{param}");
  const auth = /withAuth|requireAuth|getServerSession|auth\(/.test(src) ? "YES" : "UNKNOWN_OR_PUBLIC";
  const permission = /permission|hasPermission|requirePermission|RBAC|role/i.test(src) ? "REFERENCED" : "NOT_FOUND";
  const validation = /zod|safeParse|parse\(|validate/i.test(src) ? "REFERENCED" : "NOT_FOUND";
  const dbModels = [...new Set([...src.matchAll(/prisma\.([a-zA-Z]\w*)/g)].map((m) => m[1]))].join(";");
  const audit = /audit|AuditLog|auditLog/i.test(src) ? "REFERENCED" : "NOT_FOUND";
  const test = testFiles.find((t) => t.rel.toLowerCase().includes(path.basename(path.dirname(route.abs)).toLowerCase()))?.rel ?? "Not found";
  for (const method of methods.length ? methods : ["UNKNOWN"]) {
    apiInventoryRows.push([method, routePath, route.rel, auth, permission, "See route implementation", validation, dbModels || "Not found", audit, test, "INSPECTED"]);
  }
}

const pageInventoryRows = [["Route", "File", "Authentication required", "RBAC", "Status"]];
for (const page of pageRoutes) {
  const src = fs.readFileSync(page.abs, "utf8");
  const dir = path.dirname(path.relative(path.join(root, "src/app"), page.abs));
  const route = "/" + (dir === "." ? "" : dir.replaceAll(path.sep, "/").replace(/\([^)]+\)\//g, "").replace(/\[[^\]]+\]/g, "{param}"));
  pageInventoryRows.push([
    route === "/" ? "/" : route,
    page.rel,
    /withAuth|requireAuth|getServerSession|portalAuth|auth\(/.test(src) ? "YES_OR_CLIENT_GATED" : "NO_OR_UNKNOWN",
    /permission|role|RBAC|Forbidden|403/i.test(src) ? "REFERENCED" : "NOT_FOUND",
    "INSPECTED",
  ]);
}

const modelRows = [["Model", "Purpose", "Relations", "Indexes or uniques", "Where used", "Status"]];
for (const model of models) {
  const block = schema.match(new RegExp(`model\\s+${model}\\s+\\{[\\s\\S]*?\\n\\}`))?.[0] ?? "";
  const relations = [...block.matchAll(/@relation/g)].length;
  const indexes = [...block.matchAll(/@@(?:index|unique)|@unique/g)].length;
  const lower = model[0].toLowerCase() + model.slice(1);
  const used = files
    .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f.rel))
    .filter((f) => {
      const body = fs.readFileSync(f.abs, "utf8");
      return body.includes(`prisma.${lower}`) || body.includes(model);
    })
    .slice(0, 12)
    .map((f) => f.rel)
    .join(";");
  modelRows.push([model, "See prisma/schema.prisma", relations, indexes, used || "Not found", used ? "USED_OR_REFERENCED" : "UNREFERENCED_BY_SEARCH"]);
}

const docRows = [["File", "Title", "Section count", "Word count", "Size in bytes", "SHA-256", "Actual project references verified", "Status"]];
for (const doc of docs) {
  const body = fs.readFileSync(doc.abs, "utf8");
  docRows.push([
    doc.rel,
    (body.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(doc.rel)).trim(),
    (body.match(/^#{1,6}\s+/gm) ?? []).length,
    (body.match(/\b[\w'-]+\b/g) ?? []).length,
    fs.statSync(doc.abs).size,
    sha256(doc.abs),
    /src\/|prisma\/|\/api\/|\/admin|\/student|\/partner|DATABASE_URL|npm run/.test(body) ? "YES" : "LIMITED",
    "INVENTORIED",
  ]);
}

const fileRows = [["Relative path", "File type", "Size in bytes", "SHA-256", "Module", "Purpose", "Source package included", "Production package included", "Secret scan result"]];
for (const file of files) {
  const moduleName = file.rel.split(path.sep)[0] || ".";
  const size = fs.statSync(file.abs).size;
  const body = size < 2_000_000 ? fs.readFileSync(file.abs, "utf8") : "";
  const secretHit = /(AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{20,}|xox[baprs]-|BEGIN PRIVATE KEY|password\s*=\s*["'][^"']+["']|DATABASE_URL=.*:\/\/[^:\s]+:[^@\s]+@)/i.test(body)
    ? "POTENTIAL_SECRET_PATTERN"
    : "PASS";
  fileRows.push([file.rel, path.extname(file.rel) || "none", size, sha256(file.abs), moduleName, "Project file", "YES", file.rel.startsWith("src/") || file.rel.startsWith("public/") || file.rel.startsWith("prisma/") || file.rel === "package.json" ? "YES" : "CONTEXTUAL", secretHit]);
}

const envRows = [["Variable", "Purpose", "Required", "Default", "Used in files", "Safe to expose", "Production required", "Missing"]];
const envNames = new Set();
for (const envFile of envFiles) {
  const body = fs.readFileSync(envFile.abs, "utf8");
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (m) envNames.add(m[1]);
  }
}
for (const file of files.filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f.rel))) {
  const body = fs.readFileSync(file.abs, "utf8");
  for (const m of body.matchAll(/process\.env\.([A-Z0-9_]+)/g)) envNames.add(m[1]);
}
for (const name of [...envNames].sort()) {
  const used = files
    .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs|md|example)$/.test(f.rel))
    .filter((f) => fs.readFileSync(f.abs, "utf8").includes(name))
    .slice(0, 18)
    .map((f) => f.rel)
    .join(";");
  envRows.push([name, "Environment configuration", /SECRET|DATABASE_URL|TOKEN|KEY|PASSWORD|URL|SMTP|WHATSAPP|META|OPENAI|AI/.test(name) ? "YES_OR_PROVIDER_DEPENDENT" : "OPTIONAL_OR_CONTEXTUAL", "See .env.example", used || "Not found", name.startsWith("NEXT_PUBLIC_") ? "YES" : "NO", /DATABASE_URL|SECRET|AUTH|SESSION/.test(name) ? "YES" : "CONFIGURATION_DEPENDENT", envFiles.some((f) => fs.readFileSync(f.abs, "utf8").includes(name)) ? "NO" : "YES"]);
}

const providerRows = [["Category", "Provider", "Code implemented", "Credentials configured", "OAuth authorized", "Scopes granted", "App review", "Business verification", "Webhook registered", "Webhook verified", "Live API verified", "Last successful sync", "Status", "External action"]];
const providerDefs = [
  ["Communication Providers", "Meta / Facebook"],
  ["Communication Providers", "WhatsApp Business Cloud"],
  ["Communication Providers", "Instagram Business"],
  ["Communication Providers", "Email"],
  ["Communication Providers", "SMS"],
  ["Communication Providers", "Telegram"],
  ["Communication Providers", "LinkedIn"],
  ["Communication Providers", "TikTok"],
  ["Communication Providers", "YouTube comments"],
  ["Communication Providers", "Google Business Profile"],
  ["Communication Providers", "X"],
  ["Communication Providers", "Website chat"],
  ["Analytics Providers", "Google Analytics 4"],
  ["Analytics Providers", "Meta insights"],
];
const allCodeText = files.filter((f) => /\.(ts|tsx|js|jsx|mjs|md)$/.test(f.rel)).map((f) => fs.readFileSync(f.abs, "utf8")).join("\n");
for (const [category, provider] of providerDefs) {
  const keyword = provider.split(" ")[0].replace("/", "");
  const implemented = new RegExp(keyword, "i").test(allCodeText) ? "YES_OR_REFERENCED" : "NOT_FOUND";
  providerRows.push([category, provider, implemented, "NO_REAL_CREDENTIALS_IN_DELIVERY", "NOT_LIVE_VERIFIED", "NOT_LIVE_VERIFIED", "NOT_VERIFIED", "NOT_VERIFIED", /webhook/i.test(allCodeText) ? "CODE_REFERENCED" : "NOT_FOUND", "NOT_LIVE_VERIFIED", "NOT_LIVE_VERIFIED", "Not found", "REQUIRES_EXTERNAL_PROVIDER_AUTHORIZATION", "Authorize official provider account and configure env secrets"]);
}

const permissionRows = [["Permission or role", "Source", "Status"]];
for (const role of ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "BRANCH_MANAGER", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "FINANCE", "MARKETING", "FRONT_DESK", "SUPPORT_STAFF", "PARTNER", "STUDENT", "UNIVERSITY_PARTNER"]) {
  permissionRows.push([role, schema.includes(role) || allCodeText.includes(role) ? "schema_or_code" : "Not found", schema.includes(role) || allCodeText.includes(role) ? "REFERENCED" : "NOT_FOUND"]);
}

const testRows = [["Test file", "Suite", "Module", "Test count", "Passed", "Failed", "Skipped", "Last run", "Status"]];
for (const test of testFiles) {
  const body = fs.readFileSync(test.abs, "utf8");
  testRows.push([test.rel, test.rel.includes("e2e") ? "e2e" : test.rel.includes("integration") ? "integration" : "unit", test.rel.split(path.sep)[0], (body.match(/\b(it|test)\s*\(/g) ?? []).length, "Not run in inventory", "Not run in inventory", "Not run in inventory", "Not run in inventory", "DISCOVERED"]);
}

writeCsv("FILE_MANIFEST.csv", fileRows);
writeCsv("API_INVENTORY.csv", apiInventoryRows);
writeCsv("PAGE_ROUTE_INVENTORY.csv", pageInventoryRows);
writeCsv("DATABASE_MODEL_INVENTORY.csv", modelRows);
writeCsv("DATABASE_MIGRATION_INVENTORY.csv", [["Migration", "File", "Status"], ...migrationFiles.map((m) => [m, `prisma/migrations/${m}/migration.sql`, "FOUND"])]);
writeCsv("DOCUMENTATION_INVENTORY.csv", docRows);
writeCsv("TEST_INVENTORY.csv", testRows);
writeCsv("ENVIRONMENT_VARIABLE_INVENTORY.csv", envRows);
writeCsv("PROVIDER_INTEGRATION_MATRIX.csv", providerRows);
writeCsv("PERMISSION_INVENTORY.csv", permissionRows);

const snapshot = `# Pre-Verification Snapshot

Generated: ${new Date().toISOString()}

## Active Project

- Root: ${root}
- Package manager detected: ${fs.existsSync(path.join(root, "package-lock.json")) ? "npm (package-lock.json present)" : fs.existsSync(path.join(root, "bun.lock")) ? "bun" : "unknown"}
- Additional lockfiles present: ${["package-lock.json", "bun.lock", "yarn.lock", "pnpm-lock.yaml"].filter((f) => fs.existsSync(path.join(root, f))).join(", ") || "none"}
- Node.js: ${command("node", ["-v"])}
- npm: ${command("npm", ["-v"])}
- Next.js package range: ${pkg.dependencies?.next ?? pkg.devDependencies?.next ?? "Not found"}
- Next.js installed: ${command("node", ["-p", "require('next/package.json').version"])}
- Prisma CLI: ${command("npx", ["prisma", "--version"]).split("\n").find((line) => line.startsWith("prisma")) ?? "See prisma --version output"}
- Prisma Client installed: ${command("node", ["-p", "require('@prisma/client/package.json').version"])}
- Database provider: ${datasourceProvider}
- Git status captured: ${command("git", ["status", "--short"]).split("\n").filter(Boolean).length} changed/untracked rows

## Counts

- Project file count: ${files.length}
- Source file count: ${sourceFiles.length}
- API route file count: ${apiRoutes.length}
- API endpoint row count: ${apiInventoryRows.length - 1}
- Page route count: ${pageRoutes.length}
- Test file count: ${testFiles.length}
- Prisma model count: ${models.length}
- Documentation/inventory file count: ${docs.length}
- Migration count: ${migrationFiles.length}

## Notes

- Previous reports are treated as untrusted unless current code and command results verify them.
- Real provider credentials are not present in the delivery tree and live provider authorization is not verified.
- Current production database provider in schema is ${datasourceProvider}; production MySQL/MySQL cannot be claimed without a separate live/disposable engine test.
`;

fs.writeFileSync(path.join(root, "PRE_VERIFICATION_SNAPSHOT.md"), snapshot);
fs.writeFileSync(path.join(reportDir, "PRE_VERIFICATION_SNAPSHOT.md"), snapshot);
console.log(snapshot);
