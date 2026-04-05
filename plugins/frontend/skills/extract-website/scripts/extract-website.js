(() => {
  // Config
  const CONTAINER = ['backgroundColor', 'backgroundImage', 'border', 'borderRadius', 'boxShadow'];
  const CONTENT = ['fontSize', 'fontWeight', 'color', 'textDecoration', 'letterSpacing'];
  const SKIP = new Set(['script', 'style', 'noscript', 'link', 'meta', 'head', 'br', 'wbr', 'source']);
  const MEDIA = new Set(['img', 'video', 'svg', 'canvas', 'iframe']);

  // Helpers
  function intersect(a, b) {
    const x = Math.max(a.left, b.left);
    const y = Math.max(a.top, b.top);
    const r = Math.min(a.right, b.right);
    const bot = Math.min(a.bottom, b.bottom);
    if (r <= x || bot <= y) return null;
    return { left: x, top: y, right: r, bottom: bot };
  }

  function getRect(el) {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  }

  function getDirectText(el) {
    let t = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const s = n.textContent.trim();
        if (s) t += (t ? ' ' : '') + s;
      }
    }
    return t.slice(0, 100) || null;
  }

  function getStyle(el, props) {
    const cs = getComputedStyle(el);
    const defaults = {
      backgroundColor: ['rgba(0, 0, 0, 0)', 'transparent'],
      backgroundImage: ['none'],
      border: ['0px none', '0px none rgb', '0px'],
      borderRadius: ['0px', '0px 0px 0px 0px'],
      boxShadow: ['none'],
      fontSize: [],
      fontWeight: ['400', 'normal'],
      color: [],
      textDecoration: ['none'],
      letterSpacing: ['normal', '0px']
    };
    const result = {};
    for (const p of props) {
      const v = cs[p];
      if (!v) continue;
      const d = defaults[p] || [];
      if (d.some(x => v.startsWith(x))) continue;
      result[p] = v;
    }
    return Object.keys(result).length ? result : null;
  }

  // Core — single recursive walk
  function walk(el, clip) {
    const tag = el.tagName.toLowerCase();
    if (SKIP.has(tag)) return [];

    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return [];

    const box = el.getBoundingClientRect();
    const hasBox = box.width > 0 && box.height > 0;

    // Skip elements outside or mostly outside the current clip rect.
    // Catches: off-screen drawers, carousel slides, position:-9999px ghosts,
    // and children that overflow their overflow:hidden parent.
    if (clip && hasBox) {
      const vis = intersect(box, clip);
      if (!vis) return [];
      const visArea = (vis.right - vis.left) * (vis.bottom - vis.top);
      if (visArea < box.width * box.height * 0.1) return [];
    }

    // SVG as single leaf
    if (tag === 'svg' && hasBox) {
      return [{ type: 'leaf', tag: 'svg', rect: getRect(el) }];
    }

    // Tighten clip rect when this element clips its children.
    const ov = cs.overflow;
    const childClip = (ov === 'hidden' || ov === 'clip') ? box : clip;

    // Recurse children first
    const children = [];
    for (const child of el.children) {
      children.push(...walk(child, childClip));
    }

    // No box → pass children through
    if (!hasBox) return children;

    const r = getRect(el);
    const directText = getDirectText(el);
    const visual = getStyle(el, CONTAINER);
    const isMedia = MEDIA.has(tag);

    // Leaf: no child results, has something visible
    if (children.length === 0) {
      if (directText || isMedia || visual) {
        const node = { type: 'leaf', tag, rect: r };
        // When DOM children exist but were all filtered (e.g. overflow:hidden clip),
        // el.innerText would bleed their hidden text up. Use direct text only.
        const fullText = el.children.length === 0
          ? (el.innerText || '').trim().slice(0, 100)
          : directText;
        if (fullText) node.text = fullText;
        if (tag === 'img') { node.src = el.src; if (el.alt) node.alt = el.alt; }
        const s = { ...(getStyle(el, CONTENT) || {}), ...(visual || {}) };
        if (Object.keys(s).length) node.style = s;
        return [node];
      }
      return [];
    }

    // Group: only when has visual style (background/border/shadow) or own direct text alongside children.
    // Pure structural wrappers (no style, no direct text) always pass children through
    // regardless of child count — avoids noise div/body/section wrapper nodes in output.
    if (visual || directText) {
      const node = { type: 'group', tag, rect: r, children };
      if (visual) node.style = visual;
      if (directText) node.text = directText;
      return [node];
    }

    // No visual, no direct text → pass children through
    return children;
  }

  // Run
  window.scrollTo(0, 0);

  // Initial clip: guard horizontal axis only (catches off-screen-left/right fixed/absolute elements).
  // Vertical axis is unlimited — below-fold content is valid and must not be filtered.
  // overflow:hidden parents tighten the clip for their children during recursion.
  const vpClip = { left: 0, top: -999999, right: innerWidth, bottom: 999999 };
  const results = walk(document.body, vpClip);
  const tree = results.length === 1
    ? results[0]
    : { type: 'group', tag: 'body', rect: getRect(document.body), children: results };

  // Output
  const bodyVisual = getStyle(document.body, CONTAINER);
  const output = {
    page: {
      url: location.href,
      title: document.title,
      viewport: { w: innerWidth, h: innerHeight },
      ...(bodyVisual ? { bodyStyle: bodyVisual } : {})
    },
    tree
  };

  const json = JSON.stringify(output, null, 2);
  try {
    typeof copy === 'function' ? copy(json) : navigator.clipboard.writeText(json);
    console.log('✅ Copied!', (json.length / 1024).toFixed(1) + 'KB');
  } catch (e) {
    console.log('📋 Run: copy(_json)');
  }

  window._extracted = output;
  window._json = json;

  const count = (n) => 1 + (n.children || []).reduce((s, c) => s + count(c), 0);
  console.log('🔍 Nodes:', count(tree));

  return output;
})();
