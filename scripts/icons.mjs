#!/usr/bin/env node
/**
 * pnpm icons
 *
 * Redraws every icon from public/logo.svg: logo.png (1024 px), favicon.ico
 * (16, 32, and 48 px), favicon.png, favicon-16x16.png, favicon-32x32.png,
 * apple-touch-icon.png (180 px, on a solid background because iOS rounds the
 * corners itself), and the 192 and 512 px android-chrome icons. Run it after
 * changing the logo.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (file) => join(root, 'public', file);
const svg = readFileSync(pub('logo.svg'));
const { colors } = (await import(new URL('../src/site.config.ts', import.meta.url).href)).siteConfig;

// Rasterise from the vector at a density high enough for the target size.
const render = (size) =>
  sharp(svg, { density: Math.max(72, Math.ceil((size / 64) * 72 * 2)) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

const files = {
  'logo.png': 1024,
  'favicon.png': 32,
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512
};
for (const [file, size] of Object.entries(files)) writeFileSync(pub(file), await render(size));

// iOS masks the icon itself, so fill the transparent corners with paper.
writeFileSync(
  pub('apple-touch-icon.png'),
  await sharp(await render(180)).flatten({ background: colors.paper }).png({ compressionLevel: 9 }).toBuffer()
);

// An ICO file is a small directory of PNG images.
const icoSizes = [16, 32, 48];
const images = await Promise.all(icoSizes.map(render));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(icoSizes[i], entry);
  header.writeUInt8(icoSizes[i], entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
writeFileSync(pub('favicon.ico'), Buffer.concat([header, ...images]));

console.log(`icons: ${Object.keys(files).length + 2} files written from public/logo.svg`);
