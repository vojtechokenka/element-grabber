import { chromium } from 'playwright-core';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const [projectDir, exe, sharpDir] = process.argv.slice(2);
const out = path.join(projectDir, 'web');
fs.mkdirSync(out, { recursive: true });

const WIDTH = 560;
const HEIGHT = 300;

const FLIP =
  'M360-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h160v80H200v560h160v80Zm80 80v-880h80v880h-80Zm160-80v-80h80v80h-80Zm0-640v-80h80v80h-80Zm160 640v-80h80q0 33-23.5 56.5T760-120Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80q33 0 56.5 23.5T840-760h-80Z';

const THEMES = {
  light: { page: '#ffffff', ink: '#1f2023', line: '#d5d7db', block: '#f0f1f3', photoA: '#cfd6e4', photoB: '#aeb9cf', cursor: '#111111', cursorEdge: '#ffffff' },
  dark: { page: '#050506', ink: '#f2f2f3', line: '#3a3c41', block: '#1a1b1e', photoA: '#3a4152', photoB: '#262b38', cursor: '#ffffff', cursorEdge: '#000000' },
};

const html = (t) => `<html><head><style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap');
  * { box-sizing: border-box; }
  html, body { background: transparent; }
  body { position: relative; width: ${WIDTH}px; height: ${HEIGHT}px; margin: 0; overflow: hidden; font-family: Inter, system-ui, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
  svg { display: block; }
  .page { position: absolute; left: 34px; top: 34px; right: 0; bottom: 0; padding: 20px 26px 0; border-radius: 14px 14px 0 0; background: ${t.page}; overflow: hidden; }
  .nav { display: flex; justify-content: flex-end; gap: 10px; }
  .nav i { width: 30px; height: 7px; border-radius: 4px; background: ${t.line}; }
  .title { margin-top: 18px; padding-left: 56px; display: flex; flex-direction: column; gap: 8px; }
  .title i { height: 13px; border-radius: 4px; background: ${t.ink}; }
  .card { position: relative; margin-top: 36px; display: flex; gap: 16px; padding: 12px; border-radius: 8px; background: ${t.block}; }
  .photo { flex: none; width: 72px; height: 72px; border-radius: 6px; background: linear-gradient(135deg, ${t.photoA}, ${t.photoB}); }
  .lines { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
  .lines i { height: 8px; border-radius: 4px; background: ${t.line}; }
  .lines i:first-child { height: 10px; background: ${t.ink}; }
  .pick { position: absolute; inset: 0; border: 1.5px dashed #146ef5; }
  .chip { position: absolute; left: -1.5px; bottom: calc(100% + 4px); display: flex; gap: 6px; padding: 5px 7px; border-radius: 6px; background: #146ef5; color: #fff; font-size: 10px; font-weight: 600; line-height: 1; white-space: nowrap; }
  .chip span { color: rgba(255, 255, 255, 0.6); font-weight: 500; }
  .cursor { position: absolute; right: 64px; bottom: 4px; }
  .text { margin-top: 20px; display: flex; flex-direction: column; gap: 9px; padding-left: 196px; }
  .text i { height: 7px; border-radius: 4px; background: ${t.line}; }
  .tile { position: absolute; left: 0; top: 4px; filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.22)); }
  .toast { position: absolute; left: 12px; bottom: 14px; display: flex; align-items: center; gap: 6px; padding: 10px 15px 10px 10px; border-radius: 12px; background: #f2f9f6; color: #00844e; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25); font-size: 12px; font-weight: 500; line-height: 1; white-space: nowrap; }
  .mark { display: flex; align-items: center; justify-content: center; width: 24px; height: 22px; border-radius: 6px; background: #00844e; color: #fff; }
  .note { margin-left: 4px; color: #5f6b73; }
</style></head><body>
  <div class="page">
    <div class="nav"><i></i><i></i><i></i><i></i></div>
    <div class="title"><i style="width: 52%"></i><i style="width: 34%"></i></div>
    <div class="card">
      <div class="photo"></div>
      <div class="lines"><i style="width: 46%"></i><i style="width: 92%"></i><i style="width: 84%"></i><i style="width: 38%"></i></div>
      <div class="pick"><div class="chip">div.card <span>SIZE</span></div></div>
      <svg class="cursor" width="22" height="30" viewBox="0 0 22 30"><path d="M3 2v22l5.500-5 3.800 8.500 4-1.800-3.800-8.200H20Z" fill="${t.cursor}" stroke="${t.cursorEdge}" stroke-width="2" stroke-linejoin="round"/></svg>
    </div>
    <div class="text"><i style="width: 100%"></i><i style="width: 90%"></i><i style="width: 64%"></i></div>
  </div>
  <svg class="tile" width="72" height="72" viewBox="0 0 96 96"><rect width="96" height="96" rx="21.5" fill="#146ef5"/><g transform="translate(18 18) scale(0.0625)"><path transform="translate(0 960)" fill="#fff" d="${FLIP}"/></g></svg>
  <div class="toast"><span class="mark"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.3 5 8.8l4.5-5.300" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>PNG copied</span><span class="note">SIZE</span></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: exe, headless: true });
const written = [];
for (const [name, theme] of Object.entries(THEMES)) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setContent(html(theme), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const rect = document.querySelector('.card').getBoundingClientRect();
    const size = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    document.querySelector('.chip span').textContent = size;
    document.querySelector('.note').textContent = size;
  });
  const file = path.join(out, `banner-wide-${name}.png`);
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  written.push(file);
  await context.close();
}
await browser.close();

if (sharpDir) {
  const sharp = createRequire(import.meta.url)(sharpDir);
  for (const file of written) {
    await sharp(file).webp({ quality: 92 }).toFile(file.replace('.png', '.webp'));
  }
}
console.log(written.map((file) => path.basename(file)).join(', '), sharpDir ? '+ webp' : '');
