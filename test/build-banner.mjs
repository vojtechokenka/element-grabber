import { chromium } from 'playwright-core';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const [projectDir, exe, sharpDir] = process.argv.slice(2);
const out = path.join(projectDir, 'web');
fs.mkdirSync(out, { recursive: true });

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
  body { position: relative; width: 323px; height: 360px; margin: 0; font-family: Inter, system-ui, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
  svg { display: block; }
  .page { position: absolute; left: 36px; top: 26px; right: 0; bottom: 0; padding: 26px 22px 0; border-radius: 14px; background: ${t.page}; overflow: hidden; }
  .nav { display: flex; justify-content: flex-end; gap: 10px; }
  .nav i { width: 26px; height: 7px; border-radius: 4px; background: ${t.line}; }
  .title { margin-top: 34px; display: flex; flex-direction: column; gap: 8px; }
  .title i { height: 13px; border-radius: 4px; background: ${t.ink}; }
  .card { position: relative; margin-top: 30px; display: flex; gap: 14px; padding: 14px; border-radius: 8px; background: ${t.block}; }
  .photo { flex: none; width: 84px; height: 84px; border-radius: 6px; background: linear-gradient(135deg, ${t.photoA}, ${t.photoB}); }
  .lines { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 6px; }
  .lines i { height: 8px; border-radius: 4px; background: ${t.line}; }
  .lines i:first-child { height: 10px; background: ${t.ink}; }
  .pick { position: absolute; inset: 0; border: 1.5px dashed #146ef5; }
  .chip { position: absolute; left: -1.5px; bottom: calc(100% + 4px); display: flex; gap: 6px; padding: 5px 7px; border-radius: 6px; background: #146ef5; color: #fff; font-size: 10px; font-weight: 600; line-height: 1; white-space: nowrap; }
  .chip span { color: rgba(255, 255, 255, 0.6); font-weight: 500; }
  .cursor { position: absolute; right: 30px; bottom: 6px; }
  .text { margin-top: 22px; display: flex; flex-direction: column; gap: 9px; }
  .text i { height: 7px; border-radius: 4px; background: ${t.line}; }
  .tile { position: absolute; left: 0; top: 0; filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.22)); }
  .toast { position: absolute; left: 10px; bottom: 26px; display: flex; align-items: center; gap: 6px; padding: 10px 15px 10px 10px; border-radius: 12px; background: #f2f9f6; color: #00844e; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25); font-size: 12px; font-weight: 500; line-height: 1; white-space: nowrap; }
  .mark { display: flex; align-items: center; justify-content: center; width: 24px; height: 22px; border-radius: 6px; background: #00844e; color: #fff; }
  .note { margin-left: 4px; color: #5f6b73; }
</style></head><body>
  <div class="page">
    <div class="nav"><i></i><i></i><i></i></div>
    <div class="title"><i style="width: 78%"></i><i style="width: 52%"></i></div>
    <div class="card">
      <div class="photo"></div>
      <div class="lines"><i style="width: 80%"></i><i style="width: 100%"></i><i style="width: 92%"></i><i style="width: 60%"></i></div>
      <div class="pick"><div class="chip">div.card <span>SIZE</span></div></div>
      <svg class="cursor" width="22" height="30" viewBox="0 0 22 30"><path d="M3 2v22l5.5-5 3.800 8.500 4-1.800-3.800-8.200H20Z" fill="${t.cursor}" stroke="${t.cursorEdge}" stroke-width="2" stroke-linejoin="round"/></svg>
    </div>
    <div class="text"><i style="width: 100%"></i><i style="width: 94%"></i><i style="width: 70%"></i></div>
    <div class="text"><i style="width: 96%"></i><i style="width: 88%"></i><i style="width: 100%"></i><i style="width: 64%"></i></div>
  </div>
  <svg class="tile" width="76" height="76" viewBox="0 0 96 96"><rect width="96" height="96" rx="21.5" fill="#146ef5"/><g transform="translate(18 18) scale(0.0625)"><path transform="translate(0 960)" fill="#fff" d="${FLIP}"/></g></svg>
  <div class="toast"><span class="mark"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.3 5 8.8l4.5-5.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>PNG copied</span><span class="note">SIZE</span></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: exe, headless: true });
const written = [];
for (const [name, theme] of Object.entries(THEMES)) {
  const context = await browser.newContext({ viewport: { width: 323, height: 360 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setContent(html(theme), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const rect = document.querySelector('.card').getBoundingClientRect();
    const size = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    document.querySelector('.chip span').textContent = size;
    document.querySelector('.note').textContent = size;
  });
  const file = path.join(out, `banner-${name}.png`);
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: 323, height: 360 } });
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
