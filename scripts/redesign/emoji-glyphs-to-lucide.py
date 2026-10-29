#!/usr/bin/env python3
"""Second pass: replace the remaining emoji *glyphs* used as UI icons.

Master §10 — "Emojis are optional accents, not the core icon system" and
"Use the same icon for the same action throughout the website and CRM."

Country flags are intentionally preserved: a flag is content, not a glyph.

Each edit below is a literal string swap plus, where needed, one lucide-react
import. No copy, behaviour, data or layout is changed.
"""
import pathlib
import re

# (file, old, new)
EDITS = [
    # ── storage thresholds: coloured dots -> one warning glyph + threshold ──
    ('src/components/alo/views/storage-monitoring.tsx',
     '<span>⚠️ {pool.warningThreshold}%</span>',
     '<span className="inline-flex items-center gap-1"><TriangleAlert className="size-3.5 text-[var(--alo-warning)]" />{pool.warningThreshold}%</span>'),
    ('src/components/alo/views/storage-monitoring.tsx',
     '<span>🟠 {pool.highThreshold}%</span>',
     '<span className="inline-flex items-center gap-1"><TriangleAlert className="size-3.5 text-[var(--alo-cta)]" />{pool.highThreshold}%</span>'),
    ('src/components/alo/views/storage-monitoring.tsx',
     '<span>🔴 {pool.criticalThreshold}%</span>',
     '<span className="inline-flex items-center gap-1"><TriangleAlert className="size-3.5 text-[var(--alo-error)]" />{pool.criticalThreshold}%</span>'),

    # ── visa officer metric row ──────────────────────────────────────────
    ('src/components/visa/VisaOfficerDashboard.tsx',
     '<span>📅 Interview Queue: <strong className="text-[var(--alo-body)]">{interviewQueueCount}</strong></span>',
     '<span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5 text-[var(--alo-text-muted)]" />Interview Queue: <strong className="text-[var(--alo-body)]">{interviewQueueCount}</strong></span>'),
    ('src/components/visa/VisaOfficerDashboard.tsx',
     '<span>🚨 High-Risk Cases: <strong className="text-rose-600">{highRiskCount ?? \'Restricted\'}</strong></span>',
     '<span className="inline-flex items-center gap-1.5"><TriangleAlert className="size-3.5 text-[var(--alo-text-muted)]" />High-Risk Cases: <strong className="text-rose-600">{highRiskCount ?? \'Restricted\'}</strong></span>'),
    ('src/components/visa/VisaOfficerDashboard.tsx',
     '<span>📁 Pending Docs: <strong className="text-amber-600">{docsPendingCount}</strong></span>',
     '<span className="inline-flex items-center gap-1.5"><FolderClock className="size-3.5 text-[var(--alo-text-muted)]" />Pending Docs: <strong className="text-amber-600">{docsPendingCount}</strong></span>'),
    ('src/components/visa/VisaOfficerDashboard.tsx',
     '<span>🧑‍⚕️ Human follow-up: <strong className="text-indigo-600">{metrics.interviewsNeedingHumanFollowUp ?? \'—\'}</strong></span>',
     '<span className="inline-flex items-center gap-1.5"><UserRoundCheck className="size-3.5 text-[var(--alo-text-muted)]" />Human follow-up: <strong className="text-indigo-600">{metrics.interviewsNeedingHumanFollowUp ?? \'—\'}</strong></span>'),

    # ── document version timeline ────────────────────────────────────────
    ('src/components/communication/DocumentVersionTimeline.tsx',
     "label: 'Verified ✓',", "label: 'Verified',"),
    ('src/components/communication/DocumentVersionTimeline.tsx',
     '<p className="font-mono text-[11px] opacity-80 mt-0.5">📎 {ver.fileName}</p>',
     '<p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] opacity-80"><Paperclip className="size-3 shrink-0" />{ver.fileName}</p>'),
    ('src/components/communication/DocumentVersionTimeline.tsx',
     '📄 DOCUMENT REJECTED — Upload a replacement',
     'DOCUMENT REJECTED — Upload a replacement'),
    ('src/components/communication/DocumentVersionTimeline.tsx',
     '⚠️ The rejected document will remain in version history. The student will receive this rejection reason.',
     'The rejected document will remain in version history. The student will receive this rejection reason.'),

    # ── visibility labels already carry a Lucide icon ────────────────────
    ('src/components/communication/UnifiedCommunicationTimeline.tsx',
     "label: 'B2B Confidential 🔒'", "label: 'B2B Confidential'"),
    ('src/components/communication/UnifiedCommunicationTimeline.tsx',
     "label: 'Super Admin 🔐'", "label: 'Super Admin'"),
    ('src/components/communication/UnifiedCommunicationTimeline.tsx',
     '<option value="b2b_confidential">B2B Confidential 🔒</option>',
     '<option value="b2b_confidential">B2B Confidential</option>'),
    ('src/components/communication/UnifiedCommunicationTimeline.tsx',
     '🔒 All communication is logged to database &amp; audit trail',
     'All communication is logged to database &amp; audit trail'),
    ('src/components/communication/CommunicationInbox.tsx',
     "label: 'B2B 🔒'", "label: 'B2B'"),
    ('src/components/communication/CommunicationInbox.tsx',
     "label: 'Super Admin 🔐'", "label: 'Super Admin'"),
    ('src/components/communication/ReplyBox.tsx',
     '<SelectItem value="b2b_confidential">B2B Confidential 🔒</SelectItem>',
     '<SelectItem value="b2b_confidential">B2B Confidential</SelectItem>'),
    ('src/components/communication/VisibilityBadge.tsx',
     "label: 'B2B Confidential 🔒'", "label: 'B2B Confidential'"),
    ('src/components/communication/VisibilityBadge.tsx',
     "label: 'Super Admin 🔐'", "label: 'Super Admin'"),

    # ── offline page ─────────────────────────────────────────────────────
    ('src/app/offline/page.tsx',
     '<span className="text-2xl">📡</span>',
     '<span className="flex size-12 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"><WifiOff className="size-6" /></span>'),

    # ── partner marketing quota rows ─────────────────────────────────────
    ('src/components/partner/MasterPartnerAdminView.tsx',
     '📷 Images: {kpis.marketingQuota.imagesUsed}',
     'Images: {kpis.marketingQuota.imagesUsed}'),
    ('src/components/partner/MasterPartnerAdminView.tsx',
     '🎥 30s Videos: {kpis.marketingQuota.videosUsed}',
     '30s Videos: {kpis.marketingQuota.videosUsed}'),
    ('src/components/partner/MasterPartnerAdminView.tsx',
     "setSeatMsg('✓ Extra seat request sent to ALO Super Admin for approval.');",
     "setSeatMsg('Extra seat request sent to ALO Super Admin for approval.');"),

    # ── governance / certification verdicts ──────────────────────────────
    ('src/components/admin/super-admin-command-center/sections/Governance.tsx',
     '<span className="text-sm text-[var(--cc-green)]">✓ Rules passed</span>',
     '<span className="flex items-center gap-1.5 text-sm text-[var(--cc-green)]"><CheckCircle2 className="size-4" />Rules passed</span>'),
    ('src/components/admin/super-admin-command-center/sections/Governance.tsx',
     '<span className="text-sm text-[var(--cc-orange)]">⚠ Rules warned</span>',
     '<span className="flex items-center gap-1.5 text-sm text-[var(--cc-orange)]"><TriangleAlert className="size-4" />Rules warned</span>'),
    ('src/components/admin/super-admin-command-center/sections/Governance.tsx',
     '<span className="text-sm text-[var(--cc-red)]">✗ Rules blocked</span>',
     '<span className="flex items-center gap-1.5 text-sm text-[var(--cc-red)]"><XCircle className="size-4" />Rules blocked</span>'),
    ('src/components/admin/super-admin-command-center/sections/Departments.tsx',
     '{pass ? "✓ Pass" : "✗ Fail"} (≥ {threshold}%)',
     '{pass ? "Pass" : "Fail"} (≥ {threshold}%)'),

    # ── course detail English-test rows ──────────────────────────────────
    ('src/components/course-finder/course-detail-enhanced.tsx',
     "{ name: 'PTE', score: course.pteMin, icon: '📝' },",
     "{ name: 'PTE', score: course.pteMin, icon: 'FileEdit' },"),
    ('src/components/course-finder/course-detail-enhanced.tsx',
     "{ name: 'Duolingo', score: course.duolingoMin, icon: '🎯' },",
     "{ name: 'Duolingo', score: course.duolingoMin, icon: 'Target' },"),

    # ── marketing automation brand check ─────────────────────────────────
    ('src/app/admin/marketing-automation/page.tsx',
     '✓ Logo Configured', 'Logo Configured'),
    ('src/app/admin/marketing-automation/page.tsx',
     '⚠️ Logo Missing', 'Logo Missing'),

    # ── warning / rejection notes ────────────────────────────────────────
    ('src/components/ai-workforce/AiWorkforceConsole.tsx',
     '<p key={note} className="mt-2 text-xs text-amber-700">⚠ {note}</p>',
     '<p key={note} className="mt-2 flex items-start gap-1.5 text-xs text-amber-700"><TriangleAlert className="mt-0.5 size-3 shrink-0" />{note}</p>'),
    ('src/components/alo/views/counselor-dashboard.tsx',
     '? "⚠ This conversation has breached its first-response SLA — please respond immediately to avoid escalation."',
     '? "This conversation has breached its first-response SLA — please respond immediately to avoid escalation."'),
    ('src/components/alo/views/marketing-dashboard.tsx',
     '<p className="text-[11px] text-red-600 line-clamp-1">⚠ {p.rejectionReason}</p>',
     '<p className="flex items-start gap-1 text-[11px] text-red-600 line-clamp-1"><TriangleAlert className="mt-0.5 size-3 shrink-0" />{p.rejectionReason}</p>'),
    ('src/components/alo/views/marketing-dashboard.tsx',
     'Brand: {p.brandAssetApplied? "✓ Applied":"—"}',
     'Brand: {p.brandAssetApplied ? "Applied" : "—"}'),

    # ── public verified badges ───────────────────────────────────────────
    ('src/components/website/PremiumCountryPage.tsx',
     '<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">✓ Verified {countryData.lastVerifiedAt}</Badge>',
     '<Badge className="gap-1 bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px]"><BadgeCheck className="size-3" />Verified {countryData.lastVerifiedAt}</Badge>'),
    ('src/components/website/PremiumCountryPage.tsx',
     '<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">✓ {countryData.entryRequirements.length} Levels • Verified {countryData.lastVerifiedAt}</Badge>',
     '<Badge className="gap-1 bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px]"><BadgeCheck className="size-3" />{countryData.entryRequirements.length} Levels • Verified {countryData.lastVerifiedAt}</Badge>'),

    # ── DCC certification verdict ────────────────────────────────────────
    ('src/components/alo/views/enterprise-ai-command.tsx',
     'title: json.allPassed ? "DCC Certified ✓" : "DCC Check Failed",',
     'title: json.allPassed ? "DCC Certified" : "DCC Check Failed",'),
    ('src/components/alo/views/enterprise-ai-command.tsx',
     '{dccResult.allPassed ? "DCC Certified ✓" : `DCC Check Failed — ${dccResult.checks.filter((c) => !c.passed).length} criteria not met`}',
     '{dccResult.allPassed ? "DCC Certified" : `DCC Check Failed — ${dccResult.checks.filter((c) => !c.passed).length} criteria not met`}'),
]

# lucide-react symbol needed per file for the new glyphs
IMPORTS = {
    'src/components/alo/views/storage-monitoring.tsx': ['TriangleAlert'],
    'src/components/visa/VisaOfficerDashboard.tsx': ['CalendarClock', 'TriangleAlert', 'FolderClock', 'UserRoundCheck'],
    'src/components/communication/DocumentVersionTimeline.tsx': ['Paperclip'],
    'src/app/offline/page.tsx': ['WifiOff'],
    'src/components/admin/super-admin-command-center/sections/Governance.tsx': ['CheckCircle2', 'TriangleAlert', 'XCircle'],
    'src/components/ai-workforce/AiWorkforceConsole.tsx': ['TriangleAlert'],
    'src/components/alo/views/marketing-dashboard.tsx': ['TriangleAlert'],
    'src/components/website/PremiumCountryPage.tsx': ['BadgeCheck'],
}


def add_imports(src: str, names) -> str:
    m = re.search(r'^import \{([^}]*)\} from [\'"](lucide-react|@/components/ui/named-icon)[\'"];', src, re.M)
    if m:
        existing = {n.strip() for n in m.group(1).split(',') if n.strip()}
        merged = list(existing | set(names))
        return src[:m.start()] + "import { " + ", ".join(sorted(merged)) + " } from 'lucide-react';" + src[m.end():]
    # no lucide import yet — insert after the leading directive/comment block
    lines = src.split('\n')
    at = 0
    for i, line in enumerate(lines[:12]):
        if line.startswith("'use client'") or line.startswith('"use client"'):
            at = i + 1
    lines.insert(at, "import { " + ", ".join(names) + " } from 'lucide-react';")
    return '\n'.join(lines)


def main() -> None:
    touched = {}
    for rel, old, new in EDITS:
        path = pathlib.Path(rel)
        if not path.exists():
            print(f'  missing: {rel}')
            continue
        src = path.read_text()
        if old not in src:
            print(f'  MISS     {rel}: {old[:60]!r}')
            continue
        path.write_text(src.replace(old, new))
        touched.setdefault(rel, 0)
        touched[rel] += 1

    for rel, names in IMPORTS.items():
        path = pathlib.Path(rel)
        if not path.exists() or rel not in touched:
            continue
        src = path.read_text()
        if any(n in src for n in names):
            # symbol already referenced (maybe already imported); ensure import
            if re.search(r'^import \{[^}]*' + re.escape(names[0]) + r'[^}]*\} from \'lucide-react\';', src, re.M):
                continue
        path.write_text(add_imports(src, names))
        print(f'  imports  {rel}: {", ".join(names)}')

    for rel, count in sorted(touched.items()):
        print(f'  patched  {rel} ({count})')
    print(f'\n{len(touched)} file(s), {sum(touched.values())} glyph replacement(s).')


if __name__ == '__main__':
    main()
