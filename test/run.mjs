import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [extSrc, exe, outDir, dsfArg] = process.argv.slice(2);
const dsf = Number(dsfArg || 1);
const work = path.join(outDir, `run-dsf${dsf}`);
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
const ext = path.join(work, 'ext');
fs.cpSync(extSrc, ext, { recursive: true });
const manifestPath = path.join(ext, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.host_permissions = ['<all_urls>'];
fs.writeFileSync(manifestPath, JSON.stringify(manifest));

const HEAD = "Feedback welcome. Missing\na feature or found a bug?\nWrite to me and I'll take a look.";

const HTML = `<!doctype html><html><head><meta charset="utf-8"><title>t</title><link rel="stylesheet" href="/style.css"></head>
<body>
<div id="red"></div>
<button id="hover">x</button>
<button id="open">Open dialog</button>
<a id="card" href="/nowhere"><h2 id="headline">Feedback welcome. Missing<br>a feature or found a bug?<br>Write to me and I'll take a look.</h2><p id="mail">hello@example.com</p></a>
<dialog id="dlg"><a id="dlink" href="/nowhere2"><span id="dtext">Text inside a modal link</span></a></dialog>
<p id="nbsp">Jdu&nbsp;k&nbsp;lesu&#8239;10&#8203;x&shy;y&#8209;z</p>
<div id="tall"></div>
<script src="/page.js"></script>
</body></html>`;

const CSS = `
body { margin: 0; min-height: 2600px; background: #fff; font: 16px sans-serif; }
#red { position: absolute; left: 40px; top: 30px; width: 200px; height: 100px; background: rgb(255, 0, 0); }
#hover { position: absolute; left: 300px; top: 30px; width: 160px; height: 60px; padding: 0; border: 0; border-radius: 0; background: rgb(0, 128, 0); color: transparent; }
#hover:hover { background: rgb(255, 255, 0); }
#open { position: absolute; left: 500px; top: 30px; }
#card { position: absolute; left: 40px; top: 160px; width: 420px; padding: 24px; display: block; background: #222; color: #fff; text-decoration: none; }
#card h2 { margin: 0; font-size: 24px; }
#card p { margin: 12px 0 0; }
#tall { position: absolute; left: 40px; top: 1600px; width: 300px; height: 150px; background: rgb(0, 0, 255); }
#nbsp { position: absolute; left: 540px; top: 200px; margin: 0; }
dialog { padding: 40px; border: 0; }
dialog::backdrop { background: rgba(0, 0, 0, 0.6); }
#dtext { font-size: 20px; }
`;

const JS = `
window.__clicks = 0;
document.addEventListener('click', () => { window.__clicks += 1; });
document.getElementById('open').addEventListener('click', () => document.getElementById('dlg').showModal());
`;

const longColor = (i) => (i === 0 ? [255, 0, 255] : [20 + i * 12, 200 - i * 8, 90]);
const innerColor = (i) => [200 - i * 10, 40 + i * 12, 160];
const wideColor = (i) => [40 + i * 15, 60, 220 - i * 15];
const stripes = (count, color, firstId) =>
  Array.from({ length: count }, (_, i) => `<div${i === 0 && firstId ? ` id="${firstId}"` : ''} style="background:rgb(${color(i).join(',')})"></div>`).join('');

const LONG_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>long</title><style>
body { margin: 0; min-height: 7200px; background: #fff; }
#nav { position: fixed; top: 0; left: 0; right: 0; height: 60px; background: rgb(10, 10, 10); z-index: 10; }
#long { position: absolute; left: 40px; top: 300px; width: 300px; }
#long div { height: 100px; }
#stick { position: sticky; top: 0; z-index: 2; }
#panel { position: fixed; right: 0; top: 80px; box-sizing: border-box; width: 340px; height: 500px; padding: 20px; overflow-x: hidden; overflow-y: auto; background: rgb(30, 30, 30); }
#inner { width: 280px; }
#inner div { height: 100px; }
#wide { position: absolute; left: 40px; top: 2300px; display: flex; width: 2400px; height: 200px; }
#wide div { flex: 0 0 200px; }
</style></head><body>
<div id="nav"></div>
<div id="long">${stripes(18, longColor, 'stick')}</div>
<div id="panel"><div id="inner">${stripes(15, innerColor)}</div></div>
<div id="wide">${stripes(12, wideColor)}</div>
<script>document.getElementById('panel').scrollTop = 130;</script>
</body></html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/style.css') {
    res.writeHead(200, { 'content-type': 'text/css' });
    res.end(CSS);
    return;
  }
  if (url.pathname === '/page.js') {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    res.end(JS);
    return;
  }
  const headers = { 'content-type': 'text/html; charset=utf-8' };
  if (url.pathname === '/csp') {
    headers['content-security-policy'] =
      "default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self'; require-trusted-types-for 'script'";
  }
  res.writeHead(200, headers);
  if (url.pathname === '/long') res.end(LONG_HTML);
  else if (url.pathname === '/dark') res.end(HTML.replace('</head>', '<style>body{background:#0b0b0c}</style></head>'));
  else res.end(HTML);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

const context = await chromium.launchPersistentContext(path.join(work, 'profile'), {
  executablePath: exe,
  headless: true,
  viewport: { width: 1000, height: 700 },
  deviceScaleFactor: dsf,
  args: [
    `--force-device-scale-factor=${dsf}`,
    `--disable-extensions-except=${ext}`,
    `--load-extension=${ext}`,
    '--host-resolver-rules=MAP insecure.test 127.0.0.1',
  ],
});

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? `  ${JSON.stringify(detail)}` : ''}`);
};

const worker = async () => context.serviceWorkers()[0] || context.waitForEvent('serviceworker', { timeout: 15000 });

const browserSession = await context.browser().newBrowserCDPSession();
await browserSession.send('Browser.setPermission', { permission: { name: 'clipboard-read' }, setting: 'granted', origin: base });
const page = context.pages()[0] || (await context.newPage());
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

const activate = async () => {
  const sw = await worker();
  await sw.evaluate(async (url) => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find((t) => t.url === url) || tabs[0];
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['picker.js'] });
  }, page.url());
  await page.waitForTimeout(100);
};

const isActive = () => page.evaluate(() => Boolean(document.querySelector('html > div[popover]')));
const waitDone = async (limit = 40000) => {
  const started = Date.now();
  while (Date.now() - started < limit) {
    if (!(await isActive())) return Date.now() - started;
    await page.waitForTimeout(150);
  }
  return -1;
};
const sentinel = () => page.evaluate(() => navigator.clipboard.writeText('SENTINEL'));
const clipText = async () => (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');
const clipImage = (points = []) =>
  page.evaluate(async (wanted) => {
    const items = await navigator.clipboard.read();
    const item = items.find((i) => i.types.includes('image/png'));
    if (!item) return { types: items.flatMap((i) => i.types) };
    const bitmap = await createImageBitmap(await item.getType('image/png'));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
    return {
      w: bitmap.width,
      h: bitmap.height,
      center: px(bitmap.width >> 1, bitmap.height >> 1),
      tl: px(0, 0),
      br: px(bitmap.width - 1, bitmap.height - 1),
      px: wanted.map(([x, y]) => px(x, y)),
    };
  }, points);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const near = (a, b) => Array.isArray(a) && a.length >= 3 && b.every((value, i) => Math.abs(value - a[i]) <= 2);
const mismatches = (image, expected) =>
  expected.map((color, i) => (near(image.px?.[i], color) ? null : { i, got: image.px?.[i], want: color })).filter(Boolean);
const shot = (name, clip) => page.screenshot({ path: path.join(work, `${name}.png`), clip });
const imageClick = async (x, y, wait = true) => {
  await page.mouse.click(x, y);
  if (wait) return waitDone();
  await page.waitForTimeout(700);
  return -1;
};
const textClick = async (x, y) => {
  await page.keyboard.down('Alt');
  await page.mouse.click(x, y);
  await page.keyboard.up('Alt');
};
const centerOf = (id) =>
  page.evaluate((key) => {
    const r = document.getElementById(key).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }, id);
const scrollOf = () => page.evaluate(() => [scrollX, scrollY]);
const shiftClick = async (x, y) => {
  await page.keyboard.down('Shift');
  await page.mouse.click(x, y);
  await page.keyboard.up('Shift');
  await page.waitForTimeout(200);
};
const dragTo = async (fromX, fromY, toX, toY) => {
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  await page.mouse.move((fromX + toX) / 2, (fromY + toY) / 2);
  await page.mouse.move(toX, toY);
  await page.mouse.up();
  await page.waitForTimeout(200);
};

try {
  await page.goto(`${base}/`);
  await page.bringToFront();

  await sentinel();
  await activate();
  check('1 picker opens', await isActive());
  await page.mouse.move(120, 200);
  await shot('1-hover-headline');
  await shot('design-hint', { x: 150, y: 630, width: 700, height: 70 });
  await shot('design-label', { x: 20, y: 140, width: 520, height: 200 });
  await page.keyboard.down('Alt');
  await page.mouse.move(121, 200);
  await shot('design-hint-shift', { x: 150, y: 630, width: 700, height: 70 });
  await page.keyboard.up('Alt');
  await page.mouse.move(120, 200);
  await textClick(120, 200);
  await page.waitForTimeout(400);
  await shot('1b-toast');
  await shot('design-toast', { x: 150, y: 630, width: 700, height: 70 });
  const t1 = await clipText();
  check('1 headline text copied', t1 === HEAD, t1);
  check('1 link not followed', page.url() === `${base}/`, page.url());
  check('1 page saw no click', (await page.evaluate(() => window.__clicks)) === 0);
  check('1 picker closes after copy', (await waitDone(4000)) >= 0);

  await sentinel();
  await activate();
  await page.mouse.move(121, 201);
  await page.keyboard.press('ArrowUp');
  await page.mouse.move(123, 203);
  await shot('2-parent');
  await textClick(123, 203);
  await page.waitForTimeout(400);
  const t2 = await clipText();
  check('2 parent text copied', t2.includes(HEAD) && t2.includes('hello@example.com'), t2);
  await waitDone();

  await sentinel();
  await activate();
  await page.mouse.move(560, 210);
  const rawText = await page.evaluate(() => document.getElementById('nbsp').innerText);
  await textClick(560, 210);
  await page.waitForTimeout(400);
  const tidied = await clipText();
  check('2 odd spaces and invisible characters cleaned', tidied === 'Jdu k lesu 10xy-z' && rawText !== tidied, { tidied, rawLength: rawText.length });
  await waitDone();

  await sentinel();
  await activate();
  await page.mouse.move(140, 80);
  await imageClick(140, 80);
  const i3 = await clipImage();
  check('3 png size', i3.w === 200 * dsf && i3.h === 100 * dsf, i3);
  check('3 png clean red', same(i3.center, [255, 0, 0, 255]) && same(i3.tl, [255, 0, 0, 255]) && same(i3.br, [255, 0, 0, 255]));

  await sentinel();
  await activate();
  await page.mouse.move(380, 60);
  await imageClick(380, 60);
  const i4 = await clipImage();
  check('4 png without hover state', same(i4.center, [0, 128, 0, 255]), i4);

  await page.mouse.click(540, 40);
  await page.waitForTimeout(200);
  check('5 dialog open', await page.evaluate(() => document.getElementById('dlg').open));
  const clicksBefore = await page.evaluate(() => window.__clicks);
  await sentinel();
  await activate();
  const d = await centerOf('dtext');
  await page.mouse.move(d.x, d.y);
  await shot('5-dialog');
  await textClick(d.x, d.y);
  await page.waitForTimeout(400);
  const t5 = await clipText();
  check('5 modal text copied', t5 === 'Text inside a modal link', t5);
  check('5 modal link not followed', page.url() === `${base}/`, page.url());
  check('5 page saw no click', (await page.evaluate(() => window.__clicks)) === clicksBefore);
  await waitDone();

  await activate();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  check('5 esc closes picker', !(await isActive()));
  check('5 esc keeps dialog open', await page.evaluate(() => document.getElementById('dlg').open));

  await sentinel();
  await activate();
  await page.mouse.move(d.x, d.y);
  await imageClick(d.x, d.y);
  const i5 = await clipImage();
  check('5 modal png size', Math.abs(i5.w - d.w * dsf) <= 1 && Math.abs(i5.h - d.h * dsf) <= 1, { i5, d });
  await page.evaluate(() => document.getElementById('dlg').close());

  await activate();
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(400);
  check('6 wheel scrolls while picking', same(await scrollOf(), [0, 1000]), await scrollOf());
  await sentinel();
  await page.mouse.move(100, 650);
  await page.waitForTimeout(100);
  await shot('6-partly-visible');
  await imageClick(100, 650);
  const i6 = await clipImage();
  check('6 offscreen element fully captured', i6.w === 300 * dsf && i6.h === 150 * dsf && same(i6.center, [0, 0, 255, 255]) && same(i6.br, [0, 0, 255, 255]), i6);
  check('6 scroll position restored', same(await scrollOf(), [0, 1000]), await scrollOf());

  await page.evaluate(() => scrollTo(0, 0));
  await sentinel();
  await activate();
  await page.mouse.move(140, 80);
  await page.keyboard.press('ArrowUp');
  const bodyWidth = await page.evaluate(() => document.body.getBoundingClientRect().width);
  await imageClick(140, 80);
  const i7 = await clipImage([
    [140 * dsf, 80 * dsf],
    [190 * dsf, 1675 * dsf],
    [600 * dsf, 1300 * dsf],
    [50 * dsf, 170 * dsf],
  ]);
  check('7 whole page stitched', i7.h === 2600 * dsf && i7.w === Math.round(bodyWidth * dsf), { w: i7.w, h: i7.h, bodyWidth });
  const bad7 = mismatches(i7, [[255, 0, 0], [0, 0, 255], [255, 255, 255], [34, 34, 34]]);
  check('7 whole page content in place', bad7.length === 0, bad7);
  check('7 scroll position restored', same(await scrollOf(), [0, 0]), await scrollOf());

  await activate();
  const on = await isActive();
  await activate();
  const off = await isActive();
  check('8 shortcut toggles', on && !off, { on, off });

  await page.goto(`${base}/csp`);
  consoleErrors.length = 0;
  await sentinel();
  await activate();
  await page.mouse.move(120, 200);
  await shot('9-csp');
  await textClick(120, 200);
  await page.waitForTimeout(400);
  const t9 = await clipText();
  check('9 strict CSP text copied', t9 === HEAD, t9);
  await waitDone();
  await sentinel();
  await activate();
  await page.mouse.move(140, 80);
  await imageClick(140, 80);
  const i9 = await clipImage();
  check('9 strict CSP png', i9.w === 200 * dsf && same(i9.center, [255, 0, 0, 255]), i9);
  check('9 strict CSP no console errors', consoleErrors.length === 0, consoleErrors);

  await page.goto(`${base}/`);
  await sentinel();
  await page.goto(`http://insecure.test:${port}/`);
  check('10 insecure context', (await page.evaluate(() => isSecureContext)) === false);
  await activate();
  await page.mouse.move(120, 200);
  await textClick(120, 200);
  await page.waitForTimeout(400);
  await shot('10-insecure-text');
  await waitDone();
  await activate();
  await page.mouse.move(140, 80);
  await imageClick(140, 80, false);
  await shot('10-insecure-png');
  await shot('design-error', { x: 150, y: 630, width: 700, height: 70 });
  await page.keyboard.press('Escape');
  await page.goto(`${base}/`);
  const t10 = await clipText();
  check('10 http page text copied (fallback)', t10 === HEAD, t10);

  await page.goto(`${base}/dark`);
  await activate();
  await page.mouse.move(120, 200);
  await shot('design-dark', { x: 0, y: 130, width: 1000, height: 570 });
  await page.keyboard.press('Escape');

  await page.goto(`${base}/long`);
  await sentinel();
  await activate();
  await page.mouse.move(190, 450);
  await page.keyboard.press('ArrowUp');
  const tookA = await imageClick(190, 450);
  const pointsA = Array.from({ length: 18 }, (_, i) => [150 * dsf, (i * 100 + 50) * dsf]).concat([
    [150 * dsf, 705 * dsf],
    [150 * dsf, 1405 * dsf],
  ]);
  const iA = await clipImage(pointsA);
  check('11 long element size', iA.w === 300 * dsf && iA.h === 1800 * dsf, { w: iA.w, h: iA.h, ms: tookA });
  const badA = mismatches(iA, Array.from({ length: 18 }, (_, i) => longColor(i)).concat([longColor(7), longColor(14)]));
  check('11 long element stripes, no nav or sticky repeats', badA.length === 0, badA);
  check('11 scroll restored', same(await scrollOf(), [0, 0]), await scrollOf());
  const afterA = await page.evaluate(() => ({
    navStyle: document.getElementById('nav').getAttribute('style'),
    navOpacity: getComputedStyle(document.getElementById('nav')).opacity,
    stick: getComputedStyle(document.getElementById('stick')).position,
    stickStyle: document.getElementById('stick').getAttribute('style'),
  }));
  check('11 page styles restored', afterA.navStyle === null && afterA.navOpacity === '1' && afterA.stick === 'sticky' && !/position|inset|transition/.test(afterA.stickStyle), afterA);

  await sentinel();
  await activate();
  await page.mouse.move(760, 300);
  await page.keyboard.press('ArrowUp');
  await shot('12-panel-selected');
  const tookB = await imageClick(760, 300);
  const iB = await clipImage(Array.from({ length: 15 }, (_, i) => [140 * dsf, (i * 100 + 50) * dsf]));
  check('12 nested scroller element size', iB.w === 280 * dsf && iB.h === 1500 * dsf, { w: iB.w, h: iB.h, ms: tookB });
  const badB = mismatches(iB, Array.from({ length: 15 }, (_, i) => innerColor(i)));
  check('12 nested scroller stripes', badB.length === 0, badB);
  const panelScroll = await page.evaluate(() => document.getElementById('panel').scrollTop);
  check('12 panel and page scroll restored', panelScroll === 130 && same(await scrollOf(), [0, 0]), { panelScroll, page: await scrollOf() });

  await page.evaluate(() => scrollTo(0, 2200));
  await sentinel();
  await activate();
  await page.mouse.move(300, 200);
  await page.keyboard.press('ArrowUp');
  const tookC = await imageClick(300, 200);
  const iC = await clipImage(Array.from({ length: 12 }, (_, i) => [(i * 200 + 100) * dsf, 100 * dsf]));
  check('13 wide element size', iC.w === 2400 * dsf && iC.h === 200 * dsf, { w: iC.w, h: iC.h, ms: tookC });
  const badC = mismatches(iC, Array.from({ length: 12 }, (_, i) => wideColor(i)));
  check('13 wide element stripes', badC.length === 0, badC);
  check('13 scroll restored', same(await scrollOf(), [0, 2200]), await scrollOf());

  await page.evaluate(() => scrollTo(0, 0));
  await sentinel();
  await activate();
  await page.mouse.move(500, 650);
  const longBody = await page.evaluate(() => document.body.getBoundingClientRect().width);
  const startedD = Date.now();
  await imageClick(500, 650, false);
  await page.waitForTimeout(900);
  await shot('14-progress');
  await shot('design-progress', { x: 150, y: 630, width: 700, height: 70 });
  await waitDone();
  const tookD = Date.now() - startedD;
  const pointsD = [
    [500 * dsf, 30 * dsf],
    [500 * dsf, 730 * dsf],
    [500 * dsf, 660 * dsf],
    [500 * dsf, 1290 * dsf],
    [500 * dsf, 1900 * dsf],
    [500 * dsf, 3000 * dsf],
    ...Array.from({ length: 18 }, (_, i) => [190 * dsf, (300 + i * 100 + 50) * dsf]),
    ...Array.from({ length: 4 }, (_, i) => [(40 + i * 200 + 100) * dsf, 2400 * dsf]),
  ];
  const iD = await clipImage(pointsD);
  check('14 long page size (capture over 5 s)', iD.h === 7200 * dsf && iD.w === Math.round(longBody * dsf) && tookD > 5000, { w: iD.w, h: iD.h, ms: tookD, types: iD.types });
  const badD = mismatches(iD, [
    [10, 10, 10],
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255],
    ...Array.from({ length: 18 }, (_, i) => longColor(i)),
    ...Array.from({ length: 4 }, (_, i) => wideColor(i)),
  ]);
  check('14 long page content, nav only once', badD.length === 0, badD);

  await activate();
  await page.mouse.move(190, 450);
  await page.keyboard.press('ArrowUp');
  await page.mouse.click(190, 450);
  await page.waitForTimeout(900);
  await page.keyboard.press('Escape');
  const cancelTook = await waitDone(5000);
  check('15 esc cancels a running capture and restores', cancelTook >= 0 && same(await scrollOf(), [0, 0]), { cancelTook, scroll: await scrollOf() });

  await page.goto(`${base}/`);
  await page.bringToFront();
  const displayOf = (id) => page.evaluate((key) => getComputedStyle(document.getElementById(key)).display, id);

  await activate();
  await page.mouse.move(140, 80);
  await shot('16-hint-with-remove', { x: 0, y: 630, width: 1000, height: 70 });
  await page.keyboard.press('Delete');
  await page.waitForTimeout(150);
  check('16 delete hides the element, picker stays open', (await displayOf('red')) === 'none' && (await isActive()), await displayOf('red'));
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(150);
  const back = await page.evaluate(() => ({ display: getComputedStyle(document.getElementById('red')).display, style: document.getElementById('red').getAttribute('style') }));
  check('16 undo brings it back and leaves no style behind', back.display === 'block' && back.style === null, back);

  await page.mouse.move(800, 600);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(150);
  const pageShown = await page.evaluate(() => getComputedStyle(document.body).display !== 'none' && getComputedStyle(document.documentElement).display !== 'none');
  check('16 the page itself cannot be removed', pageShown && (await isActive()));
  await page.waitForTimeout(1800);

  const cardBefore = await centerOf('card');
  const mail = await centerOf('mail');
  await page.mouse.move(mail.x, mail.y);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(150);
  const cardAfter = await centerOf('card');
  check('16 backspace removes too, parent shrinks', (await displayOf('mail')) === 'none' && cardAfter.h < cardBefore.h, { before: cardBefore.h, after: cardAfter.h });
  await sentinel();
  await page.mouse.move(120, 200);
  await page.keyboard.press('ArrowUp');
  await imageClick(120, 200);
  const i16 = await clipImage();
  check('16 png of the parent comes without the removed child', Math.abs(i16.w - cardAfter.w * dsf) <= 1 && Math.abs(i16.h - cardAfter.h * dsf) <= 1, { w: i16.w, h: i16.h, card: cardAfter });
  check('16 removed element stays hidden after the picker closes', (await displayOf('mail')) === 'none' && !(await isActive()));

  await page.goto(`${base}/`);
  await page.bringToFront();
  const RED = [255, 0, 0, 255];
  const WHITE = [255, 255, 255];

  await sentinel();
  await activate();
  await page.mouse.move(140, 80);
  await page.keyboard.down('Shift');
  await page.mouse.move(141, 80);
  await shot('17-shift-held');
  await page.keyboard.up('Shift');
  await shiftClick(141, 80);
  check('17 shift+click locks the selection instead of copying', (await isActive()) && (await clipText()) === 'SENTINEL');
  await shot('17-locked');
  await dragTo(240, 80, 190, 80);
  check('17 dragging an edge does not copy', (await isActive()) && (await clipText()) === 'SENTINEL');
  await shot('17-shrunk');
  await page.keyboard.press('Enter');
  await waitDone();
  const i17a = await clipImage();
  check('17 enter copies the shrunk area', i17a.w === 150 * dsf && i17a.h === 100 * dsf && same(i17a.center, RED) && same(i17a.br, RED), i17a);

  await sentinel();
  await activate();
  await page.mouse.move(140, 80);
  await shiftClick(140, 80);
  await dragTo(240, 130, 280, 150);
  await shot('17-grown');
  await page.mouse.click(140, 80);
  await waitDone();
  const i17b = await clipImage([
    [100 * dsf, 50 * dsf],
    [220 * dsf, 50 * dsf],
    [100 * dsf, 110 * dsf],
  ]);
  const bad17b = mismatches(i17b, [[255, 0, 0], WHITE, WHITE]);
  check('17 click inside copies the grown area with its surroundings', i17b.w === 240 * dsf && i17b.h === 120 * dsf && bad17b.length === 0, { w: i17b.w, h: i17b.h, bad17b });

  for (const [name, toX, toY, w, h] of [
    ['sideways', 290, 145, 250, 100],
    ['downwards', 250, 170, 200, 140],
  ]) {
    await sentinel();
    await activate();
    await page.mouse.move(140, 80);
    await shiftClick(140, 80);
    await page.keyboard.down('Shift');
    await dragTo(240, 130, toX, toY);
    await page.keyboard.up('Shift');
    await page.mouse.click(140, 80);
    await waitDone();
    const image = await clipImage();
    check(`17 shift while dragging a corner moves only one edge, ${name}`, image.w === w * dsf && image.h === h * dsf, { w: image.w, h: image.h });
  }

  await sentinel();
  await activate();
  await page.mouse.move(140, 80);
  await shiftClick(140, 80);
  await page.mouse.click(800, 500);
  await page.waitForTimeout(200);
  check('17 click outside unlocks without copying', (await isActive()) && (await clipText()) === 'SENTINEL');
  await page.mouse.move(380, 60);
  await imageClick(380, 60);
  const i17c = await clipImage();
  check('17 picking works again after unlocking', i17c.w === 160 * dsf && i17c.h === 60 * dsf && same(i17c.center, [0, 128, 0, 255]), i17c);

  await activate();
  await page.mouse.move(140, 80);
  await shiftClick(140, 80);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const openAfterFirstEsc = await isActive();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  check('17 esc leaves the locked selection first, then closes', openAfterFirstEsc && !(await isActive()));

  await page.evaluate(() => {
    const frame = document.createElement('iframe');
    frame.id = 'typing';
    frame.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;border:0';
    document.body.append(frame);
    frame.contentDocument.body.contentEditable = 'true';
    frame.contentDocument.body.focus();
  });
  await activate();
  await page.mouse.move(140, 80);
  const focusInFrame = await page.evaluate(() => document.activeElement.id === 'typing');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  check('19 esc closes even when the keyboard focus sits in an iframe', focusInFrame && !(await isActive()));
  if (await isActive()) await activate();
  await page.evaluate(() => {
    document.getElementById('typing').remove();
    window.focus();
  });

  await sentinel();
  await activate();
  await page.mouse.move(140, 80);
  await shiftClick(140, 80);
  await page.mouse.move(240, 80);
  await page.mouse.down();
  await page.mouse.move(200, 80);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await page.waitForTimeout(700);
  check('17 esc in the middle of a drag does not copy', (await isActive()) && (await clipText()) === 'SENTINEL');
  await page.keyboard.press('Escape');

  for (const width of [800, 720]) {
    await page.setViewportSize({ width, height: 700 });
    await activate();
    await page.mouse.move(140, 80);
    await page.waitForTimeout(300);
    await shot(`17-hint-at-${width}`, { x: 0, y: 630, width, height: 70 });
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width: 1000, height: 700 });

  await page.goto(`${base}/long`);
  await page.bringToFront();
  const inner = await page.evaluate(() => {
    const r = document.getElementById('inner').getBoundingClientRect();
    return { left: r.left, right: r.right };
  });
  const stripeX = inner.left + 140;

  await sentinel();
  await activate();
  await page.mouse.move(stripeX, 520);
  await shiftClick(stripeX, 520);
  await dragTo(stripeX, 570, stripeX, 640);
  await shot('18-pulled-out-of-panel');
  await page.keyboard.press('Enter');
  await waitDone();
  const i18a = await clipImage([
    [140 * dsf, 50 * dsf],
    [140 * dsf, 105 * dsf],
    [140 * dsf, 150 * dsf],
  ]);
  const bad18a = mismatches(i18a, [innerColor(5), innerColor(6), WHITE]);
  check('18 area pulled out of a scrolling panel is shot as seen', i18a.w === 280 * dsf && i18a.h === 170 * dsf && bad18a.length === 0, { w: i18a.w, h: i18a.h, bad18a });
  check('18 panel scroll untouched', (await page.evaluate(() => document.getElementById('panel').scrollTop)) === 130);

  await sentinel();
  await activate();
  await page.mouse.move(stripeX, 300);
  await page.keyboard.press('ArrowUp');
  await shiftClick(stripeX, 300);
  await dragTo(inner.right, 300, inner.right - 80, 300);
  await page.keyboard.press('Enter');
  await waitDone();
  const i18b = await clipImage(Array.from({ length: 15 }, (_, i) => [100 * dsf, (i * 100 + 50) * dsf]));
  const bad18b = mismatches(i18b, Array.from({ length: 15 }, (_, i) => innerColor(i)));
  check('18 shrunk element in a panel is still stitched whole', i18b.w === 200 * dsf && i18b.h === 1500 * dsf && bad18b.length === 0, { w: i18b.w, h: i18b.h, bad18b });
  check('18 panel and page scroll restored', (await page.evaluate(() => document.getElementById('panel').scrollTop)) === 130 && same(await scrollOf(), [0, 0]));

  await sentinel();
  await activate();
  await page.mouse.move(190, 450);
  await page.keyboard.press('ArrowUp');
  await shiftClick(190, 450);
  await dragTo(190, 300, 190, 400);
  await page.keyboard.press('Enter');
  await waitDone();
  const i18c = await clipImage(
    Array.from({ length: 17 }, (_, i) => [150 * dsf, (i * 100 + 50) * dsf]).concat([
      [150 * dsf, 605 * dsf],
      [150 * dsf, 1305 * dsf],
    ]),
  );
  const bad18c = mismatches(i18c, Array.from({ length: 17 }, (_, i) => longColor(i + 1)).concat([longColor(7), longColor(14)]));
  check('18 long element cut from the top is stitched from the new edge', i18c.w === 300 * dsf && i18c.h === 1700 * dsf && bad18c.length === 0, { w: i18c.w, h: i18c.h, bad18c });

  await sentinel();
  await activate();
  await page.mouse.move(500, 650);
  await shiftClick(500, 650);
  await dragTo(500, 2, 500, 202);
  await page.keyboard.press('Enter');
  await waitDone();
  const i18d = await clipImage([
    [500 * dsf, 30 * dsf],
    [190 * dsf, 150 * dsf],
    [190 * dsf, 1150 * dsf],
  ]);
  const bad18d = mismatches(i18d, [WHITE, longColor(0), longColor(10)]);
  check('18 page cut from the top comes without the fixed bar', i18d.h === 7000 * dsf && bad18d.length === 0, { w: i18d.w, h: i18d.h, bad18d });
  check('18 scroll restored', same(await scrollOf(), [0, 0]), await scrollOf());
} catch (error) {
  check('run completed', false, String(error?.stack || error));
} finally {
  await context.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed (dsf ${dsf})`);
process.exit(failed.length ? 1 : 0);
