import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * High-definition StreamSync App Icon generator.
 * Produces pixel-perfect SVG and PNG assets matching the emerald-cyan gradient squircle
 * with the centered radio/broadcast symbol (( · )).
 */
export function getAppIconSVG({ bgPadding = 0, bgColor = null, cornerRadius = 115 } = {}) {
  const size = 512;
  const squircleSize = size - bgPadding * 2;
  const squircleX = bgPadding;
  const squircleY = bgPadding;
  
  // Icon scale inside squircle: ratio ~ 0.56 for optimal visual balance
  const iconTargetSize = squircleSize * 0.56;
  const scale = iconTargetSize / 24;
  const translateX = size / 2;
  const translateY = size / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  ${bgColor ? `<rect width="${size}" height="${size}" rx="0" fill="${bgColor}" />` : ''}
  <!-- Emerald to Cyan Squircle -->
  <rect x="${squircleX}" y="${squircleY}" width="${squircleSize}" height="${squircleSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="url(#streamGrad)" />
  
  <!-- Centered Radio Waves Mark -->
  <g transform="translate(${translateX}, ${translateY}) scale(${scale}) translate(-12, -12)">
    <!-- Center Dot -->
    <circle cx="12" cy="12" r="2.2" fill="#000000" stroke="#000000" stroke-width="0.5" />
    <!-- Inner Waves -->
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Outer Waves -->
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`;
}

function createIcoFromPngs(pngBuffersWithSizes) {
  const count = pngBuffersWithSizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  let currentOffset = 6 + count * 16;

  for (const { size, buffer } of pngBuffersWithSizes) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buffer.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirEntries.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffersWithSizes.map(p => p.buffer)
  ]);
}

async function generateAppIcons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Standard SVG Icon (clean squircle with gradient & radio waves)
  const standardSVG = getAppIconSVG({ bgPadding: 0, cornerRadius: 115 });
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSVG);
  console.log('Saved public/icon.svg');

  // 2. Favicon SVG for browser tab
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSVG);
  console.log('Saved public/favicon.svg');

  // 3. PWA PNG Icons
  // pwa-512x512.png
  await sharp(Buffer.from(standardSVG))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved public/pwa-512x512.png');

  // pwa-192x192.png
  await sharp(Buffer.from(standardSVG))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved public/pwa-192x192.png');

  // apple-touch-icon.png (180x180 for iOS)
  await sharp(Buffer.from(standardSVG))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved public/apple-touch-icon.png');

  // maskable-icon-512x512.png (Safe zone for Android adaptive icon)
  const maskableSVG = getAppIconSVG({ bgPadding: 52, bgColor: '#07090e', cornerRadius: 85 });
  await sharp(Buffer.from(maskableSVG))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));
  console.log('Saved public/maskable-icon-512x512.png');

  // 4. Favicon ICO (16x16, 32x32, 48x48)
  const png16 = await sharp(Buffer.from(standardSVG)).resize(16, 16).png().toBuffer();
  const png32 = await sharp(Buffer.from(standardSVG)).resize(32, 32).png().toBuffer();
  const png48 = await sharp(Buffer.from(standardSVG)).resize(48, 48).png().toBuffer();

  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);

  const icoBuffer = createIcoFromPngs([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 }
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Saved public/favicon.ico');

  // 5. Also update the root scratch script and preview
  console.log('All app icon assets generated successfully!');
}

generateAppIcons().catch(err => {
  console.error('Failed to generate app icons:', err);
  process.exit(1);
});
