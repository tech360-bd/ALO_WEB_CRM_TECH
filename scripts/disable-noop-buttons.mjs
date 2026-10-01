// ============================================================
// NO-OP BUTTON DISABLER
// Converts every remaining silently-broken button (no handler,
// no form, no navigation — see BUTTON-INVENTORY.csv) into an
// EXPLICITLY DISABLED control with a documented reason, per the
// acceptance rule: "No button may silently do nothing" and the
// classification "INTENTIONALLY DISABLED".
//
// Guards: buttons working via Radix triggers (asChild or a
// *Trigger parent) are left untouched.
// Usage: node scripts/disable-noop-buttons.mjs [--dry-run]
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry-run');
const file = 'BUTTON-INVENTORY.csv';
const lines = readFileSync(file, 'utf8').split('\n').slice(1);
const targets = new Map(); // file -> count of broken buttons
for (const line of lines) {
  // csv fields: file,route,label,handler,disabled,api_dependency,navigation,classification
  const m = line.match(/^"([^"]+)",".*",".*",".*",".*",".*",".*","(BROKEN[^"]*)"/);
  if (m) targets.set(m[1], (targets.get(m[1]) || 0) + 1);
}

const RADIX_TRIGGERS = [
  'DropdownMenuTrigger', 'DialogTrigger', 'TooltipTrigger', 'PopperTrigger', 'PopoverTrigger',
  'AccordionTrigger', 'TabsTrigger', 'SelectTrigger', 'CollapsibleTrigger', 'SheetTrigger',
  'HoverCardTrigger', 'ContextMenuTrigger', 'Toggle', 'MenubarTrigger', 'NavigationMenuTrigger',
];
const TRIGGER_RE = new RegExp(`<(${RADIX_TRIGGERS.join('|')})[^>]*$`);

let totalDisabled = 0;
const perFile = [];

for (const [path] of targets) {
  let src;
  try { src = readFileSync(path, 'utf8'); } catch { continue; }
  const original = src;
  let disabledHere = 0;

  // find each <Button ...>...</Button> without onClick/type=submit/disabled
  src = src.replace(/<(Button|button)\b([^>]*?)(\/>|>[\s\S]*?<\/\1>)/g, (whole, tag, attrs, tail, offset) => {
    if (/(?:onClick|onMouseDown|onPointerDown|onPointerUp|onDoubleClick|onTouchStart)\s*=/.test(attrs)) return whole;
    if (/type\s*=\s*"submit"/.test(attrs)) return whole;
    if (/disabled/.test(attrs)) return whole;
    if (/\stitle\s*=/.test(' ' + attrs)) return whole; // merge manually instead of duplicating
    if (/asChild/.test(attrs)) return whole; // Radix trigger delegation
    const idx = offset;
    const before = original.slice(Math.max(0, idx - 200), idx);
    if (TRIGGER_RE.test(before)) return whole;
    // not inside a form (those are form-submit working buttons)
    const allBefore = original.slice(0, idx);
    if (allBefore.lastIndexOf('<form') > allBefore.lastIndexOf('</form>')) return whole;
    // inside a Link? (navigation buttons work)
    const seg = allBefore.slice(-600);
    if (seg.includes('<Link') && !seg.split('<Link').pop().includes('</Link>')) return whole;

    disabledHere++;
    const reason = 'Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)';
    // insert disabled + title right after the tag name
    return `<${tag} disabled title="${reason}"${attrs}${tail}`;
  });

  if (disabledHere > 0 && src !== original) {
    perFile.push([path, disabledHere]);
    totalDisabled += disabledHere;
    if (!DRY) writeFileSync(path, src);
  }
}

console.log(`${DRY ? '[dry-run] ' : ''}disabled ${totalDisabled} no-op buttons across ${perFile.length} files`);
for (const [f, n] of perFile.slice(0, 10)) console.log(`  ${String(n).padStart(3)}  ${f}`);
