import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string, searchRegex: RegExp, replacement: string) {
  const p = path.join(process.cwd(), filePath);
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  fs.writeFileSync(p, content.replace(searchRegex, replacement), 'utf8');
}

// In auth-middleware.ts, we could update the AuthenticatedHandler to take an optional third arg
let amPath = 'src/lib/auth-middleware.ts';
let amContent = fs.readFileSync(amPath, 'utf8');
amContent = amContent.replace(
  /type AuthenticatedHandler = \(\s*request: Request,\s*auth: AuthContext\s*\) => Promise<NextResponse>;/,
  'type AuthenticatedHandler = (request: Request, auth: AuthContext, context?: any) => Promise<NextResponse>;'
);
amContent = amContent.replace(
  /return async \(request: Request\): Promise<NextResponse> => \{/,
  'return async (request: Request, context?: any): Promise<NextResponse> => {'
);
amContent = amContent.replace(
  /return handler\(request, auth\);/g,
  'return handler(request, auth, context);'
);
fs.writeFileSync(amPath, amContent);

// Also VisaCase schema didn't have 'status', so let's see what fields are available by grep
