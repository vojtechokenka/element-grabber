import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [ext, exe, outDir] = process.argv.slice(2);
const work = path.join(outDir, 'run-action');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });

const HTML = `<!doctype html><html><head><meta charset="utf-8"><title>t</title>
<style>body{margin:0;background:#fff}#red{position:absolute;left:40px;top:30px;width:200px;height:100px;background:rgb(255,0,0)}#txt{position:absolute;left:40px;top:200px;margin:0}</style></head>
<body><div id="red"></div><p id="txt">Real action path</p></body></html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(HTML);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const context = await chromium.launchPersistentContext(path.join(work, 'profile'), {
  executablePath: exe,
  headless: true,
  viewport: { width: 1000, height: 700 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--enable-unsafe-extension-debugging'],
});

const log = (name, ok, detail) => console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? `  ${JSON.stringify(detail)}` : ''}`);

try {
  const sw = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker', { timeout: 15000 }));
  const extensionId = new URL(sw.url()).host;
  const browser = context.browser();
  const browserSession = await browser.newBrowserCDPSession();
  await browserSession.send('Browser.setPermission', { permission: { name: 'clipboard-read' }, setting: 'granted', origin: base });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(`${base}/`);
  await page.bringToFront();
  await page.evaluate(() => navigator.clipboard.writeText('SENTINEL'));

  const pageSession = await context.newCDPSession(page);
  const { targetInfo } = await pageSession.send('Target.getTargetInfo');
  const { targetInfos } = await browserSession.send('Target.getTargets', { filter: [{ type: 'tab' }] });
  console.log('page target:', targetInfo.targetId, 'tab targets:', JSON.stringify(targetInfos.map((t) => [t.type, t.targetId, t.url])));
  const tabTarget = targetInfos.find((t) => t.type === 'tab');
  const trigger = () => browserSession.send('Extensions.triggerAction', { id: extensionId, targetId: tabTarget.targetId });
  const isActive = () => page.evaluate(() => Boolean(document.querySelector('html > div[popover]')));

  await trigger();
  await page.waitForTimeout(300);
  log('action click opens picker (activeTab only)', await isActive());

  await page.mouse.move(60, 208);
  await page.keyboard.down('Alt');
  await page.mouse.click(60, 208);
  await page.keyboard.up('Alt');
  await page.waitForTimeout(400);
  const text = await page.evaluate(() => navigator.clipboard.readText());
  log('text copied', text === 'Real action path', text);
  await page.waitForTimeout(1500);

  await trigger();
  await page.waitForTimeout(300);
  await page.mouse.move(140, 80);
  await page.mouse.click(140, 80);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: path.join(work, 'after-png.png') });
  const image = await page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    const item = items.find((i) => i.types.includes('image/png'));
    if (!item) return { types: items.flatMap((i) => i.types) };
    const bitmap = await createImageBitmap(await item.getType('image/png'));
    return { w: bitmap.width, h: bitmap.height };
  });
  log('png copied with activeTab only', image.w === 200 && image.h === 100, image);
} catch (error) {
  log('run completed', false, String(error?.message || error));
} finally {
  await context.close();
  server.close();
}
