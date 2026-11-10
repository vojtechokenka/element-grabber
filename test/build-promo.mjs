import { chromium } from 'playwright-core';
import path from 'node:path';

const [projectDir, exe] = process.argv.slice(2);
const out = path.join(projectDir, 'store');

const FLIP =
  'M360-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h160v80H200v560h160v80Zm80 80v-880h80v880h-80Zm160-80v-80h80v80h-80Zm0-640v-80h80v80h-80Zm160 640v-80h80q0 33-23.5 56.5T760-120Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80q33 0 56.5 23.5T840-760h-80Z';

const icon = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 96 96"><rect width="96" height="96" rx="21.5" fill="#146ef5"/><g transform="translate(18 18) scale(0.0625)"><path transform="translate(0 960)" fill="#fff" d="${FLIP}"/></g></svg>`;

const MOUSE =
  '<svg width="10" height="14" viewBox="0 0 10 14" fill="none"><path d="M5 .75A4.25 4.25 0 0 1 9.25 5v4a4.25 4.25 0 0 1-8.5 0V5A4.25 4.25 0 0 1 5 .75Z" stroke="currentColor" stroke-width="1.2"/><path d="M5 .75A4.25 4.25 0 0 0 .75 5v1.25H5Z" fill="currentColor"/></svg>';
const UP = '<svg width="16" height="16" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/></svg>';
const DOWN = '<svg width="16" height="16" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>';

const BASE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #0b0b0c; color: #fff; font-family: Inter, system-ui, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
  svg { display: block; }
  .pick { position: relative; border: 1.5px dashed #146ef5; }
  .chip { position: absolute; left: -1.5px; bottom: calc(100% + 5px); display: flex; gap: 7px; padding: 6px 8px; border-radius: 7px; background: #146ef5; font-size: 12px; font-weight: 600; line-height: 1; white-space: nowrap; letter-spacing: 0; }
  .chip span { color: rgba(255, 255, 255, 0.6); font-weight: 500; }
  .bar { display: flex; align-items: center; gap: 2px; padding: 5px; border-radius: 12px; background: #146ef5; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35); font-size: 12px; font-weight: 500; line-height: 1; white-space: nowrap; }
  .item { display: flex; align-items: center; gap: 8px; padding: 5px 10px 5px 5px; border-radius: 8px; color: rgba(255, 255, 255, 0.6); }
  .item.live { background: rgba(255, 255, 255, 0.1); color: #fff; }
  .keys { display: flex; gap: 3px; }
  .key { display: flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 6px; background: rgba(255, 255, 255, 0.12); color: #fff; font-size: 11px; font-weight: 600; }
  .key.glyph { width: 22px; padding: 0; }
`;

const small = `<html><head><style>${BASE}
  body { width: 440px; height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .pick { margin-top: 44px; padding: 7px 16px 9px; }
  .word { font-size: 36px; font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; white-space: nowrap; }
</style></head><body>
  ${icon(64)}
  <div class="pick"><div class="chip">h1.title <span>SIZE</span></div><div class="word">Element Grabber</div></div>
</body></html>`;

const marquee = `<html><head><style>${BASE}
  body { width: 1400px; height: 560px; display: grid; grid-template-columns: 1fr 620px; align-items: center; column-gap: 72px; padding: 0 96px; }
  h1 { margin: 30px 0 18px; font-size: 68px; font-weight: 700; line-height: 1; letter-spacing: -0.03em; white-space: nowrap; }
  p { margin: 0; max-width: 500px; font-size: 26px; line-height: 1.35; color: rgba(255, 255, 255, 0.7); }
  .stage { display: flex; flex-direction: column; align-items: center; gap: 30px; }
  .card { width: 620px; padding: 44px 40px 40px; background: #1c1c1e; }
  .tag { display: inline-block; padding: 7px 10px; border-radius: 4px; background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.6); font-size: 13px; }
  .pick { margin-top: 38px; }
  .headline { font-size: 34px; font-weight: 500; line-height: 1.18; letter-spacing: -0.02em; }
  .mail { margin-top: 22px; color: rgba(255, 255, 255, 0.6); font-size: 17px; }
</style></head><body>
  <div>
    ${icon(88)}
    <h1>Element Grabber</h1>
    <p>Copy any element on a page as a PNG. Or just its text.</p>
  </div>
  <div class="stage">
    <div class="card">
      <span class="tag">Contact</span>
      <div class="pick"><div class="chip">h2.headline <span>SIZE</span></div><div class="headline">Feedback welcome. Missing a feature or found a bug?</div></div>
      <div class="mail">hello@example.com</div>
    </div>
    <div class="bar">
      <div class="item live"><div class="keys"><span class="key">${MOUSE}</span></div><span>Click to copy as PNG</span></div>
      <div class="item"><div class="keys"><span class="key">Alt</span><span class="key">${MOUSE}</span></div><span>To copy text</span></div>
      <div class="item"><div class="keys"><span class="key glyph">${UP}</span><span class="key glyph">${DOWN}</span></div><span>Go through HTML</span></div>
      <div class="item"><div class="keys"><span class="key">Esc</span></div><span>Close</span></div>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch({ executablePath: exe, headless: true });
for (const [name, html, width, height] of [
  ['promo-small-440x280.png', small, 440, 280],
  ['promo-marquee-1400x560.png', marquee, 1400, 560],
]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const fontOk = await page.evaluate(() => document.fonts.check('700 36px Inter'));
  await page.evaluate(() => {
    for (const pick of document.querySelectorAll('.pick')) {
      const rect = pick.getBoundingClientRect();
      pick.querySelector('.chip span').textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    }
  });
  await page.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width, height } });
  console.log(`${name} written, Inter loaded: ${fontOk}`);
  await context.close();
}
await browser.close();
