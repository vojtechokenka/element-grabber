import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [projectDir, exe, chosen = 'a'] = process.argv.slice(2);
const BLUE = '#146ef5';

const glyphs = {
  a: ({ ink, tile }) => `
    <g transform="translate(1.5 -3.5)" fill="none" stroke="${ink}" stroke-width="6" stroke-linejoin="round">
      <path d="M22 33v-6a5 5 0 0 1 5-5h6"/>
      <path d="M51 22h6a5 5 0 0 1 5 5v6"/>
      <path d="M22 51v6a5 5 0 0 0 5 5h6"/>
      <path d="M38 22h8M22 38v8M62 38v6M37 62h6"/>
      <path d="M46 46v33l8-7.5 5.500 12.500 6.500-3-5.500-12H72Z" fill="${ink}" stroke="${tile}" stroke-width="5" paint-order="stroke"/>
    </g>`,
  b: ({ ink }) => `
    <g fill="none" stroke="${ink}" stroke-width="6" stroke-linejoin="round">
      <path d="M21 36V26a5 5 0 0 1 5-5h10"/>
      <path d="M60 21h10a5 5 0 0 1 5 5v10"/>
      <path d="M21 60v10a5 5 0 0 0 5 5h10"/>
      <path d="M75 60v10a5 5 0 0 1-5 5H60"/>
    </g>
    <rect x="35" y="35" width="26" height="26" rx="5" fill="${ink}"/>`,
  c: ({ ink, tile }) => `
    <g transform="translate(0 -1)" fill="none" stroke="${ink}" stroke-width="6" stroke-linejoin="round">
      <path d="M20 31v-6a5 5 0 0 1 5-5h6"/>
      <path d="M49 20h6a5 5 0 0 1 5 5v6"/>
      <path d="M20 49v6a5 5 0 0 0 5 5h6"/>
      <path d="M36 20h8M20 36v8"/>
      <circle cx="56" cy="56" r="12" stroke="${tile}" stroke-width="16"/>
      <path d="M65 65l11 11" stroke="${tile}" stroke-width="17" stroke-linecap="round"/>
      <circle cx="56" cy="56" r="12"/>
      <path d="M65 65l11 11" stroke-width="7" stroke-linecap="round"/>
    </g>`,
  e: ({ ink }) => `
    <g transform="translate(18 18) scale(0.0625)">
      <path transform="translate(0 960)" fill="${ink}" d="M360-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h160v80H200v560h160v80Zm80 80v-880h80v880h-80Zm160-80v-80h80v80h-80Zm0-640v-80h80v80h-80Zm160 640v-80h80q0 33-23.5 56.5T760-120Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80q33 0 56.5 23.5T840-760h-80Z"/>
    </g>`,
};

const svg = (variant, size, pad, theme = 'blue') => {
  const tile = size - pad * 2;
  const colors = theme === 'white' ? { ink: BLUE, tile: '#ffffff' } : { ink: '#ffffff', tile: BLUE };
  const radius = tile * 0.2237;
  const edge =
    theme === 'white'
      ? `<rect x="${pad + 0.5}" y="${pad + 0.5}" width="${tile - 1}" height="${tile - 1}" rx="${radius}" fill="none" stroke="rgba(15,23,42,0.12)"/>`
      : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect x="${pad}" y="${pad}" width="${tile}" height="${tile}" rx="${radius}" fill="${colors.tile}"/>${edge}<g transform="translate(${pad} ${pad}) scale(${tile / 96})">${glyphs[variant](colors)}</g></svg>`;
};

const SIZES = [
  [16, 0],
  [32, 1],
  [48, 3],
  [128, 16],
];

const VARIANTS = [
  ['A', 'a', 'blue'],
  ['B', 'b', 'blue'],
  ['C', 'c', 'blue'],
  ['D', 'a', 'white'],
  ['E', 'e', 'blue'],
  ['F', 'e', 'white'],
];

const iconDir = path.join(projectDir, 'icon');
const extIcons = path.join(projectDir, 'extension', 'icons');
fs.mkdirSync(iconDir, { recursive: true });
fs.mkdirSync(extIcons, { recursive: true });

for (const [label, variant, theme] of VARIANTS) {
  fs.writeFileSync(path.join(iconDir, `variant-${label.toLowerCase()}.svg`), svg(variant, 128, 16, theme));
}

const [, chosenVariant, chosenTheme] = VARIANTS.find(([label]) => label.toLowerCase() === chosen.toLowerCase());

const browser = await chromium.launch({ executablePath: exe, headless: true });
const context = await browser.newContext({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
const page = await context.newPage();

for (const [size, pad] of SIZES) {
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(chosenVariant, size, pad, chosenTheme)}</body></html>`);
  await page.screenshot({ path: path.join(extIcons, `icon-${size}.png`), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

const cell = ([label, variant, theme]) => `
  <div class="cell">
    <div class="tag">${label}</div>
    ${svg(variant, 128, 16, theme)}
    <div class="small">${svg(variant, 48, 3, theme)}${svg(variant, 32, 1, theme)}${svg(variant, 16, 0, theme)}</div>
  </div>`;

const sheet = `<html><head><style>
  body { margin: 0; font: 600 13px/1 Inter, system-ui, 'Segoe UI', sans-serif; }
  .row { display: flex; gap: 0; }
  .light { background: #f7f7f8; color: #303233; }
  .dark { background: #202124; color: #e8eaed; }
  .cell { width: 200px; padding: 20px 0 22px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .small { display: flex; align-items: center; gap: 14px; height: 48px; }
  .tag { opacity: 0.7; }
  svg { display: block; }
</style></head><body>
  <div class="row light">${VARIANTS.map(cell).join('')}</div>
  <div class="row dark">${VARIANTS.map(cell).join('')}</div>
</body></html>`;

const sheetWidth = VARIANTS.length * 200;
const sheetContext = await browser.newContext({ viewport: { width: sheetWidth, height: 500 }, deviceScaleFactor: 2 });
const sheetPage = await sheetContext.newPage();
await sheetPage.setContent(sheet);
const height = await sheetPage.evaluate(() => document.body.scrollHeight);
await sheetPage.screenshot({ path: path.join(iconDir, 'variants.png'), clip: { x: 0, y: 0, width: sheetWidth, height } });

await browser.close();
console.log(`icons written for variant ${chosen.toUpperCase()}; sheet height ${height}`);
