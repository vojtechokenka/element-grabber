(() => {
  if (window.__elementGrabber) {
    window.__elementGrabber();
    return;
  }

  const UI_CSS = `
    .ui { position: fixed; inset: 0; font: 500 12px/1 Inter, system-ui, -apple-system, "Segoe UI", sans-serif; color: #fff; -webkit-font-smoothing: antialiased; }
    .ui.off .box, .ui.off .hint, .ui.off .toast { visibility: hidden; }
    .box { position: fixed; display: none; box-sizing: border-box; border: 1px dashed #146ef5; }
    .box.on { display: block; }
    .ui.alt .box { background: rgba(20, 110, 245, 0.12); }
    .label { position: absolute; left: -1px; bottom: calc(100% + 4px); display: flex; gap: 6px; padding: 5px 7px; border-radius: 6px; background: #146ef5; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .label.inside { top: 4px; bottom: auto; left: 4px; }
    .ui.shift .label:not(.inside), .ui.locked .label:not(.inside) { bottom: calc(100% + 8px); }
    .ui.shift .label.inside, .ui.locked .label.inside { top: 8px; left: 8px; }
    .size { color: rgba(255, 255, 255, 0.6); font-weight: 500; }
    .label.free .name { display: none; }
    .label.free .size { color: #fff; }
    .grow { color: rgba(255, 255, 255, 0.6); font-weight: 500; }
    .grow:empty { display: none; }
    .grip { position: absolute; display: none; }
    .ui.shift .grip, .ui.locked .grip { display: block; }
    .ui.locked .grip { pointer-events: auto; }
    .ui.dragging .grip { pointer-events: none; }
    .grip::after { content: ""; position: absolute; left: 50%; top: 50%; box-sizing: border-box; width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; border: 1px solid #146ef5; background: #fff; }
    .grip.n, .grip.s { left: 8px; right: 8px; height: 11px; cursor: ns-resize; }
    .grip.w, .grip.e { top: 8px; bottom: 8px; width: 11px; cursor: ew-resize; }
    .grip.n { top: -6px; }
    .grip.s { bottom: -6px; }
    .grip.w { left: -6px; }
    .grip.e { right: -6px; }
    .grip.nw, .grip.ne, .grip.sw, .grip.se { width: 15px; height: 15px; }
    .grip.nw, .grip.se { cursor: nwse-resize; }
    .grip.ne, .grip.sw { cursor: nesw-resize; }
    .grip.nw { left: -8px; top: -8px; }
    .grip.ne { right: -8px; top: -8px; }
    .grip.sw { left: -8px; bottom: -8px; }
    .grip.se { right: -8px; bottom: -8px; }
    .bar { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; align-items: center; gap: 2px; box-sizing: border-box; max-width: calc(100vw - 24px); padding: 5px; border-radius: 12px; background: #146ef5; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25); white-space: nowrap; animation: rise 0.18s ease-out; }
    .bar.top { top: 20px; bottom: auto; }
    .item { display: flex; align-items: center; gap: 8px; padding: 5px 10px 5px 5px; border-radius: 8px; color: rgba(255, 255, 255, 0.6); }
    .hint .item.tune, .ui.locked .hint .item:not(.tune) { display: none; }
    .ui.locked .hint .item.tune { display: flex; }
    .ui:not(.alt):not(.shift) .item.image, .ui.alt .item.text, .ui.shift .item.area, .item.copy { background: rgba(255, 255, 255, 0.1); color: #fff; }
    .keys { display: flex; gap: 3px; }
    .key { display: flex; align-items: center; justify-content: center; box-sizing: border-box; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 6px; background: rgba(255, 255, 255, 0.12); color: #fff; font-size: 11px; font-weight: 600; }
    .key svg { display: block; }
    .key.glyph { width: 22px; padding: 0; }
    .toast { display: none; gap: 6px; padding: 10px 15px 10px 10px; background: #f2f9f6; color: #00844e; }
    .mark { background: #00844e; color: #fff; font-weight: 700; }
    .toast .note { color: #5f6b73; }
    .toast.error { background: #fbf3f4; color: #b63842; }
    .toast.error .mark { background: #b63842; }
    .progress { display: none; gap: 6px; padding-left: 10px; box-shadow: none; }
    .ui.capturing .progress { display: flex; }
    .spinner { box-sizing: border-box; width: 12px; height: 12px; border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .note { overflow: hidden; max-width: 320px; margin-left: 4px; color: rgba(255, 255, 255, 0.6); text-overflow: ellipsis; }
    .note:empty { display: none; }
    .ui.toasting .toast { display: flex; }
    .ui.toasting .hint, .ui.done .hint, .ui.done .box { display: none; }
    @keyframes rise { from { opacity: 0; transform: translate(-50%, 6px); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .bar, .spinner { animation: none; } }
    @media (max-width: 820px) { .hint .item.close { display: none; } }
    @media (max-width: 745px) { .hint .item.remove { display: none; } }
  `;

  const PAGE_CSS = `
    html, html * { cursor: crosshair !important; }
    iframe, frame, embed, object { pointer-events: none !important; }
  `;

  const HOST_STYLE = [
    'all: initial',
    'position: fixed',
    'inset: 0',
    'display: block',
    'width: 100vw',
    'height: 100vh',
    'margin: 0',
    'padding: 0',
    'border: 0',
    'background: transparent',
    'overflow: visible',
    'z-index: 2147483647',
    'cursor: crosshair',
    'pointer-events: none',
  ];

  const SVG = 'http://www.w3.org/2000/svg';
  const HIDDEN = { opacity: '0', transition: 'none' };
  const UNSTUCK = { position: 'relative', inset: 'auto', transition: 'none' };
  const SHOT_GAP = 550;
  const MAX_TILES = 60;
  const MAX_SIDE = 32000;
  const MAX_AREA = 2.5e8;
  const PROGRESS_STRIP = 80;
  const MIN_SIDE = 8;
  const NONE = { left: 0, top: 0, right: 0, bottom: 0 };
  const GRIPS = { n: ['top'], s: ['bottom'], w: ['left'], e: ['right'], nw: ['left', 'top'], ne: ['right', 'top'], sw: ['left', 'bottom'], se: ['right', 'bottom'] };
  const MAC = /mac/i.test(navigator.userAgentData?.platform || navigator.platform || '');

  const make = (className, parent, text) => {
    const node = document.createElement('div');
    node.className = className;
    if (text) node.textContent = text;
    parent.append(node);
    return node;
  };

  const icon = (width, height, shapes, viewBox = `0 0 ${width} ${height}`) => {
    const node = document.createElementNS(SVG, 'svg');
    node.setAttribute('width', width);
    node.setAttribute('height', height);
    node.setAttribute('viewBox', viewBox);
    node.setAttribute('fill', 'none');
    for (const shape of shapes) {
      const path = document.createElementNS(SVG, 'path');
      for (const name in shape) path.setAttribute(name, shape[name]);
      node.append(path);
    }
    return node;
  };

  const mouse = () =>
    icon(10, 14, [
      { d: 'M5 .75A4.25 4.25 0 0 1 9.25 5v4a4.25 4.25 0 0 1-8.5 0V5A4.25 4.25 0 0 1 5 .75Z', stroke: 'currentColor', 'stroke-width': '1.2' },
      { d: 'M5 .75A4.25 4.25 0 0 0 .75 5v1.25H5Z', fill: 'currentColor' },
    ]);

  const tick = () =>
    icon(12, 12, [
      { d: 'M2.5 6.3 5 8.8l4.5-5.3', stroke: 'currentColor', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    ]);

  const ARROWS = {
    up: 'M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z',
    down: 'M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z',
  };

  const chevron = (d) => icon(16, 16, [{ d, fill: 'currentColor' }], '0 -960 960 960');

  const host = document.createElement('div');
  host.style.cssText = HOST_STYLE.map((rule) => `${rule} !important`).join('; ');
  const root = host.attachShadow({ mode: 'closed' });
  const uiSheet = new CSSStyleSheet();
  uiSheet.replaceSync(UI_CSS);
  root.adoptedStyleSheets = [uiSheet];
  const ui = make('ui', root);
  const box = make('box', ui);
  const label = make('label', box);
  const labelName = make('name', label);
  const labelSize = make('size', label);
  const labelGrow = make('grow', label);
  const grips = new Map();
  for (const name in GRIPS) grips.set(make(`grip ${name}`, box), GRIPS[name]);
  const hint = make('bar hint', ui);
  const toast = make('bar toast', ui);
  const mark = make('key mark', toast);
  const message = make('message', toast);
  const note = make('note', toast);
  const progress = make('bar progress', ui);
  make('spinner', make('key', progress));
  make('message', progress, 'Capturing, hold on…');
  const progressCount = make('note', progress);
  const cancelItem = make('item', progress);
  make('key', make('keys', cancelItem), 'Esc');
  make('what', cancelItem, 'Cancel');
  const pageSheet = new CSSStyleSheet();
  pageSheet.replaceSync(PAGE_CSS);

  const item = (className, keys, text) => {
    const node = make(`item ${className}`, hint);
    const group = make('keys', node);
    for (const key of keys) {
      if (key === 'mouse') make('key', group).append(mouse());
      else if (ARROWS[key]) make('key glyph', group).append(chevron(ARROWS[key]));
      else make('key', group, key);
    }
    make('what', node, text);
  };

  item('image', ['mouse'], 'Click to copy as PNG');
  item('text', [MAC ? '⌘' : 'Alt', 'mouse'], 'To copy text');
  item('area', [MAC ? '⇧' : 'Shift', 'mouse'], 'To resize');
  item('', ['up', 'down'], 'Go through HTML');
  item('remove', ['Del'], 'Remove');
  item('close', ['Esc'], 'Close');
  item('tune copy', ['Enter'], 'Copy as PNG');
  item('tune', ['mouse'], 'Drag the edges to resize');
  item('tune', [MAC ? '⇧' : 'Shift'], 'All sides');
  item('tune', [MAC ? '⌥' : 'Alt'], 'One axis');
  item('tune', ['Esc'], 'Back');

  let hit = null;
  let current = null;
  let trail = [];
  let point = null;
  let shift = NONE;
  let locked = false;
  let drag = null;
  let press = null;
  let skipClick = false;
  let busy = false;
  let cancelled = false;
  let frame = 0;
  let toastTimer = 0;
  let lastShotAt = 0;
  const patched = new Map();
  const removed = [];

  const swallow = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const parentOf = (node) => node.parentElement || node.getRootNode().host || null;

  const deepest = (x, y) => {
    let node = document.elementFromPoint(x, y);
    while (node?.shadowRoot) {
      const inner = node.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === node || !node.shadowRoot.contains(inner)) break;
      node = inner;
    }
    return node;
  };

  const areaOf = (node) => {
    const rect = node.getBoundingClientRect();
    const left = rect.left + shift.left;
    const top = rect.top + shift.top;
    const right = rect.right + shift.right;
    const bottom = rect.bottom + shift.bottom;
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };

  const draw = () => {
    if (!current || !current.isConnected) {
      box.classList.remove('on');
      return;
    }
    const rect = areaOf(current);
    const tag = current.tagName.toLowerCase();
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
    labelName.textContent = current.id ? `${tag}#${current.id}` : current.classList[0] ? `${tag}.${current.classList[0]}` : tag;
    labelSize.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    label.classList.toggle('inside', rect.top < 30);
    label.classList.toggle('free', shift !== NONE);
    box.classList.add('on');
  };

  const retarget = () => {
    if (!point || busy) return;
    if (!locked) {
      const next = deepest(point.x, point.y);
      if (next !== hit) {
        hit = next;
        current = next;
        trail = [];
      }
    }
    draw();
  };

  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(retarget);
  };

  const say = (text, detail, isError) => {
    clearTimeout(toastTimer);
    mark.replaceChildren(isError ? '!' : tick());
    message.textContent = text;
    note.textContent = detail || '';
    toast.classList.toggle('error', isError);
    ui.classList.add('toasting');
  };

  const flash = (text) => {
    say(text, '', true);
    toastTimer = setTimeout(() => ui.classList.remove('toasting'), 1800);
  };

  const textOf = (node) => {
    if (node.matches('input:not([type="password"]), textarea')) return node.value.trim();
    if (node.matches('select')) return (node.selectedOptions[0]?.text || '').trim();
    if (node.matches('img')) return (node.alt || node.currentSrc || '').trim();
    return (node.innerText ?? node.textContent ?? '').trim();
  };

  const tidy = (text) =>
    text
      .replace(/[   -   　]/g, ' ')
      .replace(/‑/g, '-')
      .replace(/[­​⁠﻿]/g, '');

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {}
    }
    const onCopy = (event) => {
      event.clipboardData.setData('text/plain', text);
      swallow(event);
    };
    document.addEventListener('copy', onCopy, { capture: true, once: true });
    const copied = document.execCommand('copy');
    document.removeEventListener('copy', onCopy, { capture: true });
    if (!copied) throw new Error('Could not copy the text');
  };

  const toBlob = (dataUrl) => {
    const raw = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return new Blob([bytes], { type: 'image/png' });
  };

  const grab = async () => {
    await nextPaint();
    await pause(Math.max(80, lastShotAt + SHOT_GAP - performance.now()));
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const reply = await chrome.runtime.sendMessage({ type: 'capture' });
      lastShotAt = performance.now();
      if (reply?.dataUrl) return createImageBitmap(toBlob(reply.dataUrl));
      if (!/MAX_CAPTURE/.test(reply?.error || '')) throw new Error(reply?.error || 'Capture failed');
      await pause(SHOT_GAP);
    }
    throw new Error('Capture failed');
  };

  const patch = (node, rules) => {
    if (!patched.has(node)) patched.set(node, node.getAttribute('style'));
    for (const name in rules) node.style.setProperty(name, rules[name], 'important');
  };

  const unpatch = () => {
    for (const [node, style] of patched) {
      if (style === null) {
        node.getAttribute('style');
        node.removeAttribute('style');
      } else {
        node.style.cssText = style;
      }
    }
    patched.clear();
  };

  const isClipper = (node, style) => {
    if (node === document.documentElement) return false;
    if (style.overflowX === 'visible' && style.overflowY === 'visible') return false;
    if (node !== document.body) return true;
    const rootStyle = getComputedStyle(document.documentElement);
    return rootStyle.overflowX !== 'visible' || rootStyle.overflowY !== 'visible';
  };

  const chainOf = (node) => {
    const clippers = [];
    let pinned = getComputedStyle(node).position === 'fixed';
    for (let parent = parentOf(node); parent && !pinned; parent = parentOf(parent)) {
      const style = getComputedStyle(parent);
      if (isClipper(parent, style)) clippers.push(parent);
      if (style.position === 'fixed') pinned = true;
    }
    return { clippers, pinned };
  };

  const pinnedLayers = (node) => {
    const layers = { outside: [], fixed: [], sticky: [] };
    const lineage = new Set();
    for (let parent = node; parent; parent = parentOf(parent)) lineage.add(parent);
    const limit = innerWidth * innerHeight * 0.85;
    for (const other of document.querySelectorAll('body *')) {
      const { position } = getComputedStyle(other);
      if (position !== 'fixed' && position !== 'sticky') continue;
      if (lineage.has(other)) continue;
      if (node.contains(other)) {
        layers[position].push(other);
        continue;
      }
      const rect = other.getBoundingClientRect();
      if (rect.width * rect.height < limit) layers.outside.push(other);
    }
    return layers;
  };

  const visiblePart = (node, clippers, reserve) => {
    const view = document.scrollingElement || document.documentElement;
    const rect = areaOf(node);
    let left = Math.max(rect.left, 0);
    let top = Math.max(rect.top, 0);
    let right = Math.min(rect.right, view.clientWidth);
    let bottom = Math.min(rect.bottom, view.clientHeight - reserve);
    for (const clipper of clippers) {
      const edge = clipper.getBoundingClientRect();
      left = Math.max(left, edge.left + clipper.clientLeft);
      top = Math.max(top, edge.top + clipper.clientTop);
      right = Math.min(right, edge.left + clipper.clientLeft + clipper.clientWidth);
      bottom = Math.min(bottom, edge.top + clipper.clientTop + clipper.clientHeight);
    }
    return { rect, left, top, right, bottom };
  };

  const covers = (part) =>
    part.left <= part.rect.left + 0.5 &&
    part.top <= part.rect.top + 0.5 &&
    part.right >= part.rect.right - 0.5 &&
    part.bottom >= part.rect.bottom - 0.5;

  const reveal = (node, chain, x, y) => {
    for (const clipper of chain.clippers) {
      const rect = areaOf(node);
      const edge = clipper.getBoundingClientRect();
      clipper.scrollTo({
        left: clipper.scrollLeft + rect.left + x - edge.left - clipper.clientLeft,
        top: clipper.scrollTop + rect.top + y - edge.top - clipper.clientTop,
        behavior: 'instant',
      });
    }
    if (chain.pinned) return;
    const rect = areaOf(node);
    window.scrollTo({ left: scrollX + rect.left + x, top: scrollY + rect.top + y, behavior: 'instant' });
  };

  const shoot = async (node) => {
    const chain = chainOf(node);
    const layers = pinnedLayers(node);
    const scrolls = [[window, scrollX, scrollY], ...chain.clippers.map((clipper) => [clipper, clipper.scrollLeft, clipper.scrollTop])];
    const view = document.scrollingElement || document.documentElement;
    let canvas = null;
    let context = null;
    let scale = 1;
    let zoom = 1;
    let complete = true;
    let tiles = 0;
    let total = 1;
    let reserve = 0;
    try {
      for (const layer of layers.outside) patch(layer, HIDDEN);
      const tiled = !covers(visiblePart(node, chain.clippers, 0));
      if (tiled) {
        for (const layer of layers.sticky) patch(layer, UNSTUCK);
        if (shift.left || shift.top) for (const layer of layers.fixed) patch(layer, HIDDEN);
        if (view.clientHeight >= 320 && (!chain.pinned || chain.clippers.length)) {
          reserve = PROGRESS_STRIP;
          ui.classList.add('capturing');
        }
      }
      const { width, height } = areaOf(node);
      if (width < 1 || height < 1) throw new Error('Element is not visible');
      if (tiled) {
        reveal(node, chain, 0, 0);
        const first = visiblePart(node, chain.clippers, reserve);
        total = Math.ceil(width / Math.max(1, first.right - first.left)) * Math.ceil(height / Math.max(1, first.bottom - first.top));
      }
      let y = 0;
      rows: while (y < height - 0.5) {
        let x = 0;
        let reached = Infinity;
        while (x < width - 0.5) {
          if (cancelled) throw new Error('Cancelled');
          if (tiled) reveal(node, chain, x, y);
          progressCount.textContent = total > 1 && total <= MAX_TILES ? `${tiles + 1} / ${Math.max(total, tiles + 1)}` : '';
          const shot = await grab();
          const part = visiblePart(node, chain.clippers, reserve);
          if (!canvas) {
            if (part.right <= part.left || part.bottom <= part.top) throw new Error('Element is not visible');
            scale = shot.width / innerWidth;
            const fullWidth = Math.max(1, Math.round(part.rect.right * scale) - Math.round(part.rect.left * scale));
            const fullHeight = Math.max(1, Math.round(part.rect.bottom * scale) - Math.round(part.rect.top * scale));
            zoom = Math.min(1, MAX_SIDE / fullWidth, MAX_SIDE / fullHeight, Math.sqrt(MAX_AREA / (fullWidth * fullHeight)));
            canvas = new OffscreenCanvas(Math.max(1, Math.round(fullWidth * zoom)), Math.max(1, Math.round(fullHeight * zoom)));
            context = canvas.getContext('2d');
            context.imageSmoothingQuality = 'high';
          }
          const originX = Math.round(part.rect.left * scale);
          const originY = Math.round(part.rect.top * scale);
          const sx = Math.max(0, Math.round(part.left * scale));
          const sy = Math.max(0, Math.round(part.top * scale));
          const sw = Math.min(shot.width, Math.round(part.right * scale)) - sx;
          const sh = Math.min(shot.height, Math.round(part.bottom * scale)) - sy;
          if (sw > 0 && sh > 0) context.drawImage(shot, sx, sy, sw, sh, (sx - originX) * zoom, (sy - originY) * zoom, sw * zoom, sh * zoom);
          shot.close();
          tiles += 1;
          if (tiles === 1 && tiled) for (const layer of layers.fixed) patch(layer, HIDDEN);
          const right = part.right - part.rect.left;
          const bottom = part.bottom - part.rect.top;
          if (part.left - part.rect.left > x + 1 || part.top - part.rect.top > y + 1) complete = false;
          if (right <= x + 0.5 || bottom <= y + 0.5 || tiles >= MAX_TILES) {
            complete = false;
            break rows;
          }
          x = right;
          reached = Math.min(reached, bottom);
        }
        y = reached;
      }
    } finally {
      unpatch();
      for (const [target, left, top] of scrolls) target.scrollTo({ left, top, behavior: 'instant' });
    }
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return { blob, complete, width: canvas.width, height: canvas.height };
  };

  const stitch = async (node) => {
    ui.classList.add('off');
    host.style.setProperty('pointer-events', 'auto', 'important');
    host.style.setProperty('cursor', 'progress', 'important');
    try {
      return await shoot(node);
    } finally {
      host.style.setProperty('cursor', 'crosshair', 'important');
      host.style.setProperty('pointer-events', 'none', 'important');
      ui.classList.remove('off', 'capturing');
    }
  };

  const copyImage = async (node) => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('PNG copy works only on https pages');
    let result = null;
    let failure = null;
    const png = stitch(node).then(
      (value) => {
        result = value;
        return value.blob;
      },
      (error) => {
        failure = error;
        throw error;
      },
    );
    try {
      let entry;
      try {
        entry = new ClipboardItem({ 'image/png': png });
      } catch {
        entry = new ClipboardItem({ 'image/png': await png });
      }
      await navigator.clipboard.write([entry]);
    } catch (error) {
      throw failure || error;
    }
    return result;
  };

  const remove = () => {
    if (current === document.documentElement || current === document.body) {
      flash('Cannot remove the whole page');
      return;
    }
    removed.push({
      node: current,
      value: current.style.getPropertyValue('display'),
      priority: current.style.getPropertyPriority('display'),
    });
    current.style.setProperty('display', 'none', 'important');
    hit = null;
    current = null;
    trail = [];
    retarget();
  };

  const restore = () => {
    const last = removed.pop();
    if (!last) return;
    if (last.value) last.node.style.setProperty('display', last.value, last.priority);
    else last.node.style.removeProperty('display');
    if (!last.node.getAttribute('style')) last.node.removeAttribute('style');
    hit = null;
    current = last.node;
    trail = [];
    draw();
  };

  const lock = () => {
    locked = true;
    ui.classList.remove('alt', 'shift');
    ui.classList.add('locked');
    draw();
  };

  const release = () => {
    drag = null;
    labelGrow.textContent = '';
    host.style.setProperty('cursor', 'crosshair', 'important');
    host.style.setProperty('pointer-events', 'none', 'important');
    ui.classList.remove('dragging');
  };

  const unlock = () => {
    if (drag) skipClick = true;
    release();
    locked = false;
    shift = NONE;
    ui.classList.remove('locked');
    hit = null;
    retarget();
  };

  const holds = (node, area, grew) => {
    const rect = node.getBoundingClientRect();
    if (area.left < rect.left - 0.5 || area.top < rect.top - 0.5 || area.right > rect.right + 0.5 || area.bottom > rect.bottom + 0.5) return false;
    return chainOf(node).clippers.every((clipper) => {
      const edge = clipper.getBoundingClientRect();
      const left = edge.left + clipper.clientLeft;
      const top = edge.top + clipper.clientTop;
      if (grew.left && area.left < left - 0.5) return false;
      if (grew.top && area.top < top - 0.5) return false;
      if (grew.right && area.right > left + clipper.clientWidth + 0.5) return false;
      if (grew.bottom && area.bottom > top + clipper.clientHeight + 0.5) return false;
      return true;
    });
  };

  const settle = (grew) => {
    if (!shift.left && !shift.top && !shift.right && !shift.bottom) {
      shift = NONE;
      return;
    }
    const area = areaOf(current);
    let node = current;
    while (node !== document.documentElement && !holds(node, area, grew)) node = parentOf(node) || document.documentElement;
    if (node === current) return;
    const rect = node.getBoundingClientRect();
    shift = { left: area.left - rect.left, top: area.top - rect.top, right: area.right - rect.right, bottom: area.bottom - rect.bottom };
    current = node;
    trail = [];
  };

  const wantsText = (event) => (MAC ? event.metaKey : event.altKey);

  const setMode = (event) => {
    const text = !locked && wantsText(event);
    ui.classList.toggle('alt', text);
    ui.classList.toggle('shift', !locked && !text && event.shiftKey);
  };

  const onDown = (event) => {
    swallow(event);
    skipClick = false;
    press = { x: event.clientX, y: event.clientY };
    if (busy || !locked || event.button !== 0) return;
    const grip = root.elementFromPoint(event.clientX, event.clientY);
    const pull = grips.get(grip);
    if (!pull) return;
    const area = areaOf(current);
    drag = {
      pull,
      start: shift,
      px: event.clientX,
      py: event.clientY,
      dx: pull.includes('left') ? event.clientX - area.left : pull.includes('right') ? event.clientX - area.right : 0,
      dy: pull.includes('top') ? event.clientY - area.top : pull.includes('bottom') ? event.clientY - area.bottom : 0,
    };
    host.style.setProperty('cursor', getComputedStyle(grip).cursor, 'important');
    host.style.setProperty('pointer-events', 'auto', 'important');
    ui.classList.add('dragging');
  };

  const signed = (value) => `${value < 0 ? '−' : '+'}${Math.abs(Math.round(value))}`;

  const resize = () => {
    const { pull, start, all, axis } = drag;
    const view = document.scrollingElement || document.documentElement;
    const rect = current.getBoundingClientRect();
    const from = { left: rect.left + start.left, top: rect.top + start.top, right: rect.right + start.right, bottom: rect.bottom + start.bottom };
    const x = Math.round(Math.min(Math.max(drag.px - drag.dx, 0), view.clientWidth));
    const y = Math.round(Math.min(Math.max(drag.py - drag.dy, 0), view.clientHeight));
    const next = { ...start };
    labelGrow.textContent = '';
    if (!all && !axis) {
      for (const side of pull) {
        if (side === 'left') next.left = Math.min(x, from.right - MIN_SIDE) - rect.left;
        else if (side === 'right') next.right = Math.max(x, from.left + MIN_SIDE) - rect.right;
        else if (side === 'top') next.top = Math.min(y, from.bottom - MIN_SIDE) - rect.top;
        else next.bottom = Math.max(y, from.top + MIN_SIDE) - rect.bottom;
      }
      shift = next;
      return;
    }
    const least = { wide: (MIN_SIDE - (from.right - from.left)) / 2, tall: (MIN_SIDE - (from.bottom - from.top)) / 2 };
    let wide = pull.includes('left') ? from.left - x : pull.includes('right') ? x - from.right : null;
    let tall = pull.includes('top') ? from.top - y : pull.includes('bottom') ? y - from.bottom : null;
    if (all) {
      const both = wide === null ? tall : tall === null ? wide : Math.abs(wide) > Math.abs(tall) ? wide : tall;
      wide = tall = Math.max(both, least.wide, least.tall);
    } else {
      if (wide !== null) wide = Math.max(wide, least.wide);
      if (tall !== null) tall = Math.max(tall, least.tall);
    }
    if (wide !== null) {
      next.left = Math.max(from.left - wide, Math.min(from.left, 0)) - rect.left;
      next.right = Math.min(from.right + wide, Math.max(from.right, view.clientWidth)) - rect.right;
    }
    if (tall !== null) {
      next.top = Math.max(from.top - tall, Math.min(from.top, 0)) - rect.top;
      next.bottom = Math.min(from.bottom + tall, Math.max(from.bottom, view.clientHeight)) - rect.bottom;
    }
    shift = next;
    labelGrow.textContent = `${all || tall === null ? signed(wide) : wide === null ? signed(tall) : `${signed(wide)} × ${signed(tall)}`} px`;
  };

  const tune = (event) => {
    if (!drag) return;
    drag.all = event.shiftKey;
    drag.axis = !event.shiftKey && event.altKey;
    resize();
    draw();
  };

  const onDrag = (event) => {
    swallow(event);
    if (!drag) return;
    drag.px = event.clientX;
    drag.py = event.clientY;
    point = { x: event.clientX, y: event.clientY };
    hint.classList.toggle('top', point.y > innerHeight - 90);
    tune(event);
  };

  const onUp = (event) => {
    swallow(event);
    if (!drag) {
      if (locked && press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 4) skipClick = true;
      return;
    }
    const { start } = drag;
    release();
    skipClick = true;
    settle({ left: shift.left < start.left, top: shift.top < start.top, right: shift.right > start.right, bottom: shift.bottom > start.bottom });
    draw();
  };

  const onMove = (event) => {
    swallow(event);
    setMode(event);
    point = { x: event.clientX, y: event.clientY };
    hint.classList.toggle('top', point.y > innerHeight - 90);
    retarget();
  };

  const onWheel = (event) => {
    if (busy) swallow(event);
  };

  const onKeyUp = (event) => {
    setMode(event);
    tune(event);
    if (event.key === 'Alt') swallow(event);
  };

  const onKey = (event) => {
    setMode(event);
    tune(event);
    if (event.key === 'Alt') {
      swallow(event);
      return;
    }
    if (event.key === 'Escape') {
      swallow(event);
      (event.view || window).addEventListener('keyup', swallow, { capture: true, once: true });
      if (busy) cancelled = true;
      else if (locked) unlock();
      else stop();
      return;
    }
    if (busy) {
      swallow(event);
      return;
    }
    if (locked) {
      if (event.key !== 'Enter') return;
      swallow(event);
      (event.view || window).addEventListener('keyup', swallow, { capture: true, once: true });
      copy(false);
      return;
    }
    if (event.key.toLowerCase() === 'z' && (MAC ? event.metaKey : event.ctrlKey)) {
      swallow(event);
      restore();
      return;
    }
    if (!current) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      swallow(event);
      remove();
    } else if (event.key === 'ArrowUp') {
      swallow(event);
      const parent = parentOf(current);
      if (!parent) return;
      trail.push(current);
      current = parent;
      draw();
    } else if (event.key === 'ArrowDown') {
      swallow(event);
      const child = trail.pop() || current.firstElementChild;
      if (!child) return;
      current = child;
      draw();
    }
  };

  const copy = async (asText) => {
    busy = true;
    try {
      if (!asText) {
        const result = await copyImage(current);
        finish('PNG copied', result.complete ? `${result.width} × ${result.height}` : 'part of it is hidden by the page');
      } else {
        const text = tidy(textOf(current)).trim();
        if (!text) throw new Error('No text in this element');
        await copyText(text);
        finish('Text copied');
      }
    } catch (error) {
      if (cancelled) {
        stop();
        return;
      }
      busy = false;
      flash(error?.message || 'Something went wrong');
    }
  };

  const onClick = (event) => {
    swallow(event);
    if (busy) return;
    if (skipClick) {
      skipClick = false;
      return;
    }
    if (locked) {
      const area = areaOf(current);
      if (event.clientX >= area.left && event.clientX <= area.right && event.clientY >= area.top && event.clientY <= area.bottom) {
        copy(false);
      } else {
        point = { x: event.clientX, y: event.clientY };
        unlock();
      }
      return;
    }
    if (!current) {
      point = { x: event.clientX, y: event.clientY };
      retarget();
    }
    if (!current) return;
    if (wantsText(event)) copy(true);
    else if (event.shiftKey) lock();
    else copy(false);
  };

  const quiet = [
    'mousedown',
    'mouseup',
    'dblclick',
    'auxclick',
    'mouseover',
    'mouseout',
    'mouseenter',
    'mouseleave',
    'pointerover',
    'pointerout',
    'pointerenter',
    'pointerleave',
  ];

  const listeners = [
    ['mousemove', onMove],
    ['pointerdown', onDown],
    ['pointermove', onDrag],
    ['pointerup', onUp],
    ['pointercancel', onUp],
    ['click', onClick],
    ['keydown', onKey],
    ['keyup', onKeyUp],
    ['wheel', onWheel],
    ['scroll', schedule],
    ['resize', schedule],
    ...quiet.map((type) => [type, swallow]),
  ];

  const frames = [];
  for (const frame of document.querySelectorAll('iframe')) {
    try {
      const inner = frame.contentWindow;
      inner.addEventListener('keydown', onKey, true);
      inner.addEventListener('keyup', onKeyUp, true);
      frames.push(inner);
    } catch {}
  }

  const deactivate = () => {
    for (const [type, handler] of listeners) window.removeEventListener(type, handler, true);
    for (const inner of frames) {
      try {
        inner.removeEventListener('keydown', onKey, true);
        inner.removeEventListener('keyup', onKeyUp, true);
      } catch {}
    }
    cancelAnimationFrame(frame);
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((sheet) => sheet !== pageSheet);
    delete window.__elementGrabber;
  };

  const stop = () => {
    cancelled = true;
    deactivate();
    clearTimeout(toastTimer);
    host.remove();
  };

  const finish = (text, detail) => {
    deactivate();
    ui.classList.add('done');
    say(text, detail, false);
    toastTimer = setTimeout(() => host.remove(), 1600);
  };

  for (const [type, handler] of listeners) window.addEventListener(type, handler, { capture: true, passive: false });
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, pageSheet];
  document.documentElement.append(host);
  if (host.showPopover) {
    host.setAttribute('popover', 'manual');
    host.showPopover();
  }
  window.__elementGrabber = stop;
})();
