import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [extSrc, exe, siteDir, outDir, workDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const work = path.join(workDir, 'store-shots');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
const ext = path.join(work, 'ext');
fs.cpSync(extSrc, ext, { recursive: true });
const manifestPath = path.join(ext, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.host_permissions = ['<all_urls>'];
fs.writeFileSync(manifestPath, JSON.stringify(manifest));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(siteDir, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(siteDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const session = async (name, colorScheme, run) => {
  const context = await chromium.launchPersistentContext(path.join(work, `profile-${name}`), {
    executablePath: exe,
    headless: true,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    colorScheme,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  try {
    const page = context.pages()[0] || (await context.newPage());
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await page.bringToFront();
    const activate = async () => {
      const sw = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker', { timeout: 15000 }));
      await sw.evaluate(async (url) => {
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find((t) => t.url === url) || tabs[0];
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['picker.js'] });
      }, page.url());
      await page.waitForTimeout(150);
    };
    await run(page, activate);
  } finally {
    await context.close();
  }
};

const centerOf = async (page, selector) => {
  const box = await page.locator(selector).first().boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
};

const frame = async (page, selector, offset = 120) => {
  await page.evaluate(
    ([sel, top]) => {
      const rect = document.querySelector(sel).getBoundingClientRect();
      window.scrollTo({ top: scrollY + rect.top - top, behavior: 'instant' });
    },
    [selector, offset],
  );
  await page.waitForTimeout(500);
};

try {
  await session('dark', 'dark', async (page, activate) => {
    await frame(page, '.plugin__card', 60);
    await activate();
    const spot = await centerOf(page, '#plugin-heading');
    await page.mouse.move(spot.x, spot.y);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'screenshot-1-pick.png') });
    await page.mouse.click(spot.x, spot.y);
    await page.waitForFunction(() => !document.querySelector('html > div[popover]') || true, null, { timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, 'screenshot-3-copied.png') });
  });

  await session('light', 'light', async (page, activate) => {
    await frame(page, '.plugin__card', 60);
    await activate();
    const spot = await centerOf(page, '#plugin-heading');
    await page.keyboard.down('Alt');
    await page.mouse.move(spot.x, spot.y);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'screenshot-2-text.png') });
    await page.keyboard.up('Alt');
    await page.keyboard.press('Escape');
  });
  console.log('store screenshots written');
} catch (error) {
  console.log('FAILED', String(error?.stack || error));
} finally {
  server.close();
}
