const fs = require('fs');
const path = require('path');

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx$/.test(e.name)) files.push(p);
  }
})('src/components');

const TW_PREFIX = [
  'bg','text','border','ring','from','via','to','fill','stroke','divide','outline','shadow','rounded',
  'p','px','py','pt','pb','pl','pr','ps','pe','m','mx','my','mt','mb','ml','mr','ms','me',
  'w','h','min-w','min-h','max-w','max-h','size','gap','space','grid','col','row','flex','items',
  'justify','self','place','content','order','font','leading','tracking','truncate','uppercase','lowercase',
  'capitalize','normal-case','italic','underline','line-through','no-underline','decoration','whitespace',
  'break','overflow','overscroll','object','aspect','inset','top','bottom','left','right','z','opacity',
  'transition','duration','delay','ease','animate','scale','rotate','translate','origin','cursor','select',
  'pointer-events','resize','appearance','sr-only','not-sr-only','list','align','table','float','clear',
  'isolation','mix-blend','filter','backdrop','will-change','contain','touch','snap','scroll','accent',
  'caret','columns','basis','grow','shrink','hidden','block','inline','inline-block','inline-flex','contents',
  'static','fixed','absolute','relative','sticky','visible','invisible','antialiased','subpixel-antialiased',
  'dark','group','peer','first','last','odd','even','only','empty','disabled','enabled','checked',
  'indeterminate','default','required','valid','invalid','read-only','open','focus','focus-visible',
  'focus-within','hover','active','visited','target','motion-safe','motion-reduce','print','rtl','ltr',
  'container','prose','not','has','aria','data','supports','min','max','@',
];
function isTailwindToken(t) {
  const bare = t.replace(/^(-?[a-z]+:)+/, '');
  if (TW_PREFIX.includes(bare)) return true;
  for (const p of TW_PREFIX) {
    if (bare.startsWith(p + '-')) return true;
  }
  return false;
}

const counts = new Map();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  // crude className string extraction: any quoted string after className=
  const re = /className=(?:"([^"]*)"|\{'([^']*)'\}|\{`([^`]*)`\})/g;
  let m;
  while ((m = re.exec(src))) {
    const str = m[1] || m[2] || m[3] || '';
    for (const raw of str.split(/[\s{}$()?:'"|]+/)) {
      const t = raw.trim();
      if (!t || t.length < 3) continue;
      if (!/^[a-z][a-z0-9-]*$/.test(t)) continue;
      if (/^(sm|md|lg|xl|2xl)$/.test(t)) continue;
      if (isTailwindToken(t)) continue;
      if (!counts.has(t)) counts.set(t, 0);
      counts.set(t, counts.get(t) + 1);
    }
  }
}

const css = fs.readFileSync('src/app/globals.css', 'utf8');
const missing = [...counts.entries()]
  .filter(([t]) => !new RegExp('\\.' + t.replace(/-/g, '\\-') + '(?![a-z0-9-])').test(css))
  .sort((a, b) => b[1] - a[1]);

console.log('custom-looking class tokens:', counts.size, '| NOT defined in globals.css:', missing.length);
for (const [t, c] of missing.slice(0, 60)) console.log(`${t} (${c})`);
