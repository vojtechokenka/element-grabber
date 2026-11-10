import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [exe, url, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: exe, headless: true });
for (const [name, width, height, colorScheme] of [
  ['desktop-light', 1280, 800, 'light'],
  ['desktop-dark', 1280, 800, 'dark'],
  ['tablet-light', 900, 800, 'light'],
  ['mobile-light', 375, 812, 'light'],
  ['mobile-dark', 375, 812, 'dark'],
]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('requestfailed', (req) => errors.push(`failed ${req.url()}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  const card = page.locator('.mac-card').nth(1);
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const el = document.querySelectorAll('.mac-card')[1];
    const img = [...el.querySelectorAll('.grabber-visual img')].find((i) => getComputedStyle(i).display !== 'none');
    const r = el.getBoundingClientRect();
    const v = img.getBoundingClientRect();
    return {
      card: `${Math.round(r.width)}x${Math.round(r.height)}`,
      image: `${Math.round(v.width)}x${Math.round(v.height)}`,
      src: img.currentSrc.split('/').pop(),
      loaded: img.complete && img.naturalWidth > 0,
      overflowX: document.documentElement.scrollWidth > innerWidth,
    };
  });
  await card.screenshot({ path: path.join(outDir, `site-banner-${name}.png`) });
  console.log(name, JSON.stringify(info), errors.length ? `errors: ${errors.join(' | ')}` : 'no errors');
  await context.close();
}
await browser.close();
