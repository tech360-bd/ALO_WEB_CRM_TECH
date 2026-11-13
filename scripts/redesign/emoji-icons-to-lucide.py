#!/usr/bin/env python3
"""Replace emoji used as the *icon system* with Lucide glyph names.

Master design system §10: "Emojis are optional accents, not the core icon
system" and "Do not put emojis in every headline, every CRM navigation item or
every card." The super-admin command centers, several communication surfaces
and a few dashboards were carrying emoji strings as nav/section/stat icons.

Country flags are deliberately left alone: a flag is content (the country
identity), not a UI glyph, and Lucide has no flag set.

The script only rewrites `icon: "…"` data fields and inline glyph spans — no
copy, no behaviour, no data.
"""
import pathlib
import re

# emoji -> Lucide export name
GLYPH = {
    '📊': 'BarChart3', '📈': 'TrendingUp', '📉': 'TrendingDown',
    '🎯': 'Target', '📝': 'FileEdit', '📄': 'FileText', '📋': 'ClipboardList',
    '📚': 'BookOpen', '🎓': 'GraduationCap', '👥': 'Users', '🤝': 'Handshake',
    '💰': 'Wallet', '📣': 'Megaphone', '🛂': 'Stamp', '🔒': 'Lock', '🔐': 'ShieldCheck',
    '🏛️': 'Landmark', '💬': 'MessageSquare', '✅': 'CheckCircle2', '❓': 'CircleHelp',
    '🌐': 'Globe', '🌍': 'Globe', '💼': 'Briefcase', '🔧': 'Wrench',
    '📱': 'Smartphone', '⚡': 'Zap', '🤖': 'Bot', '📜': 'ScrollText',
    '🔍': 'Search', '⚙️': 'Settings', '🧠': 'Brain', '📦': 'Package',
    '📅': 'CalendarDays', '🌊': 'Waves', '🛡️': 'Shield', '🏅': 'Award',
    '🛎️': 'BellRing', '🌟': 'Star', '🧭': 'Compass', '🦶': 'Footprints',
    '🏷️': 'Tag', '🏷': 'Tag', '📎': 'Paperclip', '📡': 'RadioTower',
    '📷': 'Camera', '🎥': 'Clapperboard', '📁': 'FolderOpen', '🚨': 'Siren',
    '🧑‍⚕️': 'Stethoscope', '🗣️': 'Languages', '🗓️': 'CalendarCheck',
    '✈️': 'Plane', '🧑‍💼': 'UserCog', '📖': 'BookMarked',
}

# emoji -> (replacement text) for inline status glyphs inside copy
INLINE = {
    '⚠️': '',   # replaced by an explicit Lucide icon at the call site
    '🚨': '',
    '📎': '',
    '📄': '',
}

FILES = [
    'src/components/admin/SuperAdminCrmCommandCenter.tsx',
    'src/components/admin/SuperAdminMasterCommandCenter.tsx',
    'src/components/admin/super-admin-command-center/SuperAdminCommandCenter.tsx',
    'src/components/admin/super-admin-command-center/ai-eos/AiEosMasterBlueprint.tsx',
    'src/components/admin/SuperAdminWebsiteCmsHub.tsx',
    'src/components/admin/ManagedContentManager.tsx',
]


def main() -> None:
    pattern = re.compile('|'.join(re.escape(k) for k in sorted(GLYPH, key=len, reverse=True)))
    for rel in FILES:
        path = pathlib.Path(rel)
        if not path.exists():
            print(f'  missing:   {rel}')
            continue
        src = path.read_text()
        # Only the `icon: "…"` data fields carry the glyph system.
        out = re.sub(
            r'icon:\s*"([^"]*)"',
            lambda m: 'icon: "%s"' % pattern.sub(lambda g: GLYPH[g.group(0)], m.group(1)),
            src,
        )
        if out == src:
            print(f'  unchanged: {rel}')
            continue
        path.write_text(out)
        print(f'  patched:   {rel}')


if __name__ == '__main__':
    main()
