/**
 * scripts/generate-modern-images.ts
 *
 * Generates modern-format (WebP + AVIF) versions of the portrait images
 * in /public/brand/. These are static fallbacks that can be referenced
 * directly (e.g. inside <picture> elements or as og:image alternatives)
 * without going through the next/image optimizer.
 *
 * Run with:  bun run scripts/generate-modern-images.ts
 *            (or `bun run images:modern` via package.json)
 *
 * Output files (alongside the originals):
 *   public/brand/portrait.webp
 *   public/brand/portrait.avif
 *   public/brand/portrait-lifestyle.webp
 *   public/brand/portrait-lifestyle.avif
 */

import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const TARGETS = [
  {
    src: resolve(ROOT, "public/brand/portrait.jpg"),
    webp: resolve(ROOT, "public/brand/portrait.webp"),
    avif: resolve(ROOT, "public/brand/portrait.avif"),
    width: 1280,
    height: 1280,
  },
  {
    src: resolve(ROOT, "public/brand/portrait-lifestyle.jpg"),
    webp: resolve(ROOT, "public/brand/portrait-lifestyle.webp"),
    avif: resolve(ROOT, "public/brand/portrait-lifestyle.avif"),
    width: 960,
    height: 960,
  },
] as const;

async function writeBuf(path: string, buf: Buffer) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buf);
}

async function main() {
  console.log("→ Generating WebP + AVIF versions of portrait images…");
  for (const t of TARGETS) {
    const src = await readFile(t.src);
    const pipeline = sharp(src)
      .resize(t.width, t.height, { fit: "cover", position: sharp.strategy.entropy });

    const [webpBuf, avifBuf] = await Promise.all([
      pipeline.clone().webp({ quality: 85, effort: 4 }).toBuffer(),
      pipeline.clone().avif({ quality: 70, effort: 3 }).toBuffer(),
    ]);

    await Promise.all([writeBuf(t.webp, webpBuf), writeBuf(t.avif, avifBuf)]);

    const origKb = (src.byteLength / 1024).toFixed(1);
    const webpKb = (webpBuf.byteLength / 1024).toFixed(1);
    const avifKb = (avifBuf.byteLength / 1024).toFixed(1);

    console.log(
      `  • ${t.src.split("/").pop()}  jpeg=${origKb}KB → webp=${webpKb}KB (${(
        (webpBuf.byteLength / src.byteLength) *
        100
      ).toFixed(0)}%)  avif=${avifKb}KB (${((avifBuf.byteLength / src.byteLength) * 100).toFixed(
        0
      )}%)`
    );
  }
  console.log("✓ Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
