/** Isolated synthetic component harness. Not a production app or auth bypass.
 * Uses esbuild/postcss already present in the toolchain; outputs stay ignored.
 * Run `node scripts/build-reference-components.mjs`, then serve the printed dir.
 */
import esbuild from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const folder = '_reference_repos/ui-verification';
mkdirSync(folder, { recursive: true });
await esbuild.build({ entryPoints: ['tests/browser/reference-components.tsx'], bundle: true, outfile: `${folder}/app.js`, platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'process.env': '{}' }, alias: { '@': './src' } });
const css = await postcss([tailwind()]).process(readFileSync('src/app/globals.css', 'utf8'), { from: 'src/app/globals.css' });
writeFileSync(`${folder}/styles.css`, css.css);
writeFileSync(`${folder}/index.html`, '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>ALO isolated component verification</title><link rel="stylesheet" href="/styles.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
console.log(`Serve ${folder} on port 4173, then run scripts/verify-reference-components.mjs. Synthetic fixtures only.`);
