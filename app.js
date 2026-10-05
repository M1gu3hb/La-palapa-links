/* Jardín La Palapa · página de enlaces (link in bio)
   Fondo con las fotos del jardín que se disuelven en caracteres ASCII, logo que se escribe a mano
   con pluma de oro (animación «Trazo de Oro») y botones con reflejos e íconos dibujados. Sin dependencias. */
(() => {
  'use strict';
  const root = document.documentElement;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = motionQuery.matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const smooth = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const RAMP = ' .·:-=+*#%@';
  const BITS = '01<>/|[]{}$#%&?!*+=~^;:';
  const now = () => performance.now() / 1000;

  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------------------------------------------------------------- botones
  document.querySelectorAll('.btn').forEach((b, i) => {
    b.style.setProperty('--i', i);
    if (!reduce) {
      const g = document.createElement('span'); g.className = 'glyphs'; g.setAttribute('aria-hidden', 'true');
      const n = Math.ceil(b.offsetWidth / 6) * Math.ceil(b.offsetHeight / 10) + 20;
      let s = ''; for (let k = 0; k < n; k++) s += BITS[(Math.random() * BITS.length) | 0];
      g.textContent = s; b.prepend(g);
    }
    if (b.classList.contains('btn-wa')) { const h = document.createElement('span'); h.className = 'halo'; h.setAttribute('aria-hidden', 'true'); b.append(h); }
  });
  // orden de trazo de cada ícono
  document.querySelectorAll('svg').forEach(svg => svg.querySelectorAll('.d').forEach((p, k) => p.style.setProperty('--k', k)));

  // texto que se «descifra» en caracteres
  function scramble(el, dur = 520) {
    if (reduce || !el) return;
    const node = el.firstChild; if (!node || node.nodeType !== 3) return;
    const final = el.dataset.text || (el.dataset.text = node.nodeValue);
    const start = performance.now();
    const step = t => {
      const p = Math.min(1, (t - start) / dur);
      node.nodeValue = [...final].map((c, i) => (c === ' ' || p * final.length > i) ? c : BITS[(Math.random() * BITS.length) | 0]).join('');
      if (p < 1) requestAnimationFrame(step); else node.nodeValue = final;
    };
    requestAnimationFrame(step);
  }

  if (fine && !reduce) {
    document.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        b.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); b.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        b.style.transform = `perspective(700px) rotateX(${((.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - .5) * 9).toFixed(2)}deg) translateZ(4px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
      b.addEventListener('pointerenter', () => scramble(b.querySelector('small') || b.querySelector('strong'), 420));
    });
  }

  // ---------------------------------------------------------------- compartir
  const toast = document.getElementById('toast');
  let toastTimer = 0;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400); }
  document.getElementById('share').addEventListener('click', async () => {
    const data = { title: 'Jardín La Palapa', text: 'Jardín La Palapa · Bodas, XV años y eventos en Tepepan. Cotiza por WhatsApp:', url: location.origin + '/' };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(data.url); say('Enlace copiado');
    } catch (e) { if (e && e.name !== 'AbortError') say('Copia el enlace: ' + data.url); }
  });

  // ---------------------------------------------------------------- fotos de fondo
  const slides = [...document.querySelectorAll('.slide')];
  const capN = document.getElementById('cap-n'), capT = document.getElementById('cap-t');
  let current = 0;
  function showSlide(i) {
    slides[current].classList.remove('on');
    current = i;
    // reinicia el Ken Burns
    const s = slides[current]; s.classList.remove('on'); void s.offsetWidth; s.classList.add('on');
    capN.textContent = String(current + 1).padStart(2, '0'); capT.textContent = s.dataset.label;
  }
  slides.slice(1).forEach(s => { s.loading = 'eager'; });

  // ---------------------------------------------------------------- capa ASCII de fondo
  const cv = document.getElementById('ascii');
  const cx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, cw = 10, ch = 15, cols = 0, rows = 0;
  const ripples = [];
  const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
  let dissolve = null;          // transición foto -> ASCII -> foto
  const sampler = document.createElement('canvas');
  const sctx = sampler.getContext('2d', { willReadFrequently: true });
  const PAL = ['#6e4a2a', '#8c6334', '#ab7f42', '#c99a55', '#dfb86f', '#f0d595', '#fbeec8'];

  function resize() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.25);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cw = Math.max(8, Math.min(13, Math.round(Math.min(W, H) / 42))); ch = Math.round(cw * 1.55);
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.font = `600 ${Math.round(ch * .8)}px ui-monospace, Menlo, Consolas, monospace`;
    cx.textBaseline = 'top';
    if (dissolve) dissolve.grids = dissolve.imgs.map(sample);
    logo.resize();
  }
  // muestrea una foto (con encuadre cover) en la cuadrícula de caracteres
  function sample(img) {
    if (!img || !img.naturalWidth) return null;
    sampler.width = cols; sampler.height = rows;
    const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const sw = W / sc, sh = H / sc;
    sctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, cols, rows);
    const d = sctx.getImageData(0, 0, cols, rows).data;
    const lum = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) lum[i] = (d[i * 4] * .2126 + d[i * 4 + 1] * .7152 + d[i * 4 + 2] * .0722) / 255;
    return lum;
  }
  function field(x, y, t) {
    const nx = x / cols, ny = y / rows, a = cols / rows;
    let v = Math.sin(nx * 8 * a + t * .5 + Math.sin(ny * 6 + t * .35) * 1.6);
    v += Math.sin(ny * 10 - t * .6 + Math.sin(nx * 5 * a - t * .3) * 2);
    v += Math.sin((nx * a + ny) * 6 + t * .3);
    return v / 3 * .5 + .5;
  }
  // zona central donde viven los botones: ahí el ASCII es más tenue
  function quiet(x) {
    if (W < 900) return .9;
    const d = Math.abs(x * cw + cw / 2 - W / 2) / 280;
    return clamp(.25 + smooth(clamp(d - .75)) * .75, .25, 1);
  }
  let t0 = now(), lastDraw = 0, running = true, introState = null;
  function drawAscii(time) {
    const t = time - t0;
    cx.clearRect(0, 0, W, H);
    pointer.x += (pointer.tx - pointer.x) * .25; pointer.y += (pointer.ty - pointer.y) * .25;
    for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t > 2.2) ripples.splice(i, 1);
    const buckets = PAL.map(() => []);
    const tick = Math.floor(t * 16);
    const ambient = W >= 900;
    const mcx = pointer.x / cw, mcy = pointer.y / ch, asp = ch / cw;
    // estado de disolución de foto
    let dA = 0, gridA = null, gridB = null, mix = 0, gather = 1;
    if (dissolve) {
      const k = (time - dissolve.start) / dissolve.dur;
      if (k >= 1) { dissolve.done && dissolve.done(); dissolve = null; }
      else {
        dA = dissolve.intro ? (1 - smooth(seg(k, .55, 1))) : smooth(seg(k, 0, .34)) * (1 - smooth(seg(k, .5, 1)));
        gather = dissolve.intro ? easeOut(seg(k, 0, .5)) : 1;
        [gridA, gridB] = dissolve.grids; mix = dissolve.intro ? 1 : smooth(seg(k, .32, .55));
        if (!dissolve.swapped && k >= (dissolve.intro ? .42 : .4)) { dissolve.swapped = true; dissolve.swap && dissolve.swap(); }
      }
    }
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const h = hash(x, y);
        let lvl = -1, c = '';
        // 1) foto en ASCII durante la transición
        if (dA > .01) {
          const i = y * cols + x;
          const la = gridA ? gridA[i] : 0, lb = gridB ? gridB[i] : 0;
          const L = la * (1 - mix) + lb * mix;
          const v = clamp((L - .05) * 1.15);
          if (v > .06 && h < dA * 1.25) {
            const scr = h > dA || (dissolve && dissolve.intro && hash(y, x) > gather);
            c = scr ? BITS[(tick + ((h * 97) | 0)) % BITS.length] : RAMP[Math.min(RAMP.length - 1, 1 + ((v * (RAMP.length - 1)) | 0))];
            lvl = Math.min(PAL.length - 1, (v * PAL.length) | 0);
            if (dissolve && dissolve.intro && gather < 1) {
              const off = (1 - gather) * (30 + h * 90), ang = hash(y + 7, x) * TAU;
              buckets[lvl].push(c, x * cw + Math.cos(ang) * off, y * ch + Math.sin(ang) * off);
              continue;
            }
          }
        }
        // 2) campo ambiental (solo escritorio) + puntero + toques
        if (lvl < 0) {
          if (!ambient && !ripples.length) continue;
          let v = ambient ? Math.pow(Math.max(0, field(x, y, t) - .48) / .52, 1.5) * .5 * quiet(x) : 0;
          if (pointer.x > -1e3) { const md = Math.hypot(x - mcx, (y - mcy) * asp); v += Math.exp(-md * md / 40) * .7; }
          for (let r = 0; r < ripples.length; r++) {
            const rp = ripples[r], age = t - rp.t, d = Math.hypot(x - rp.x, (y - rp.y) * asp) - age * 30;
            v += Math.exp(-d * d / 6) * (1 - age / 2.2) * .9;
          }
          if (v < .1 || h > .86) continue;
          const k = Math.min(1, v);
          c = (k > .6 && hash(x, y + tick) > .7) ? BITS[(tick + x + y) % BITS.length] : RAMP[Math.min(RAMP.length - 1, 1 + ((k * (RAMP.length - 2)) | 0))];
          lvl = Math.min(PAL.length - 1, (k * (PAL.length - 1)) | 0);
        }
        buckets[lvl].push(c, x * cw, y * ch);
      }
    }
    for (let b = 0; b < buckets.length; b++) {
      const a = buckets[b]; if (!a.length) continue;
      cx.fillStyle = PAL[b];
      for (let i = 0; i < a.length; i += 3) cx.fillText(a[i], a[i + 1], a[i + 2]);
    }
  }
  function startDissolve(nextIndex, intro = false) {
    const from = intro ? null : slides[current], to = slides[nextIndex];
    const go = () => {
      dissolve = {
        start: now(), dur: intro ? 1.7 : 2.1, intro, imgs: [from, to], grids: [from ? sample(from) : null, sample(to)], swapped: false,
        swap: () => { if (intro) root.classList.remove('intro'); else showSlide(nextIndex); },
      };
    };
    if (to.complete && to.naturalWidth) go(); else to.decode().then(go, () => { if (!intro) showSlide(nextIndex); else root.classList.remove('intro'); });
  }

  // ---------------------------------------------------------------- esqueleto de trazo
  // Esqueleto de trazo en el navegador: rasteriza cada pieza del logo, calcula su eje (Zhang-Suen),
  // el grosor (distancia chamfer) y el orden de escritura (recorrido geodésico desde el punto de inicio).
  // Devuelve Float32Array [x, y, r, t] en unidades del logo, ordenado por t (0..1).
  function skeletonOf(path, box, mode, k) {
    const pad = 3, x0 = box[0], y0 = box[1];
    const w = Math.ceil((box[2] - x0) * k) + pad * 2, h = Math.ceil((box[3] - y0) * k) + pad * 2;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.setTransform(k, 0, 0, k, pad - x0 * k, pad - y0 * k); g.fill(path);
    const px = g.getImageData(0, 0, w, h).data, n = w * h;
    const m = new Uint8Array(n); for (let i = 0; i < n; i++) m[i] = px[i * 4 + 3] > 110 ? 1 : 0;
    // distancia chamfer 3-4
    const dt = new Float32Array(n);
    for (let i = 0; i < n; i++) dt[i] = m[i] ? 1e6 : 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; if (!m[i]) continue;
      dt[i] = Math.min(dt[i], dt[i - 1] + 3, dt[i - w] + 3, dt[i - w - 1] + 4, dt[i - w + 1] + 4);
    }
    for (let y = h - 2; y > 0; y--) for (let x = w - 2; x > 0; x--) {
      const i = y * w + x; if (!m[i]) continue;
      dt[i] = Math.min(dt[i], dt[i + 1] + 3, dt[i + w] + 3, dt[i + w + 1] + 4, dt[i + w - 1] + 4);
    }
    // adelgazamiento Zhang-Suen
    const s = m.slice(), del = [];
    for (let changed = true, it = 0; changed && it < 60; it++) {
      changed = false;
      for (let step = 0; step < 2; step++) {
        del.length = 0;
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          const i = y * w + x; if (!s[i]) continue;
          const p2 = s[i - w], p3 = s[i - w + 1], p4 = s[i + 1], p5 = s[i + w + 1], p6 = s[i + w], p7 = s[i + w - 1], p8 = s[i - 1], p9 = s[i - w - 1];
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9; if (B < 2 || B > 6) continue;
          const A = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
          if (A !== 1) continue;
          if (step === 0 ? (p2 * p4 * p6 || p4 * p6 * p8) : (p2 * p4 * p8 || p2 * p6 * p8)) continue;
          del.push(i);
        }
        if (del.length) { changed = true; for (const i of del) s[i] = 0; }
      }
    }
    const sk = []; for (let i = 0; i < n; i++) if (s[i]) sk.push(i);
    if (!sk.length) { let best = 0, bi = 0; for (let i = 0; i < n; i++) if (dt[i] > best) { best = dt[i]; bi = i; } sk.push(bi); s[bi] = 1; }
    const NB = [-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1];
    const deg = i => { let d = 0; for (const o of NB) d += s[i + o]; return d; };
    let ends = sk.filter(i => deg(i) === 1); if (!ends.length) ends = sk;
    const X = i => i % w, Y = i => (i / w) | 0;
    const pick = (arr) => {
      if (mode === 'top') return arr.reduce((a, b) => (Y(b) < Y(a) ? b : a));
      if (mode === 'bottomleft') return arr.reduce((a, b) => (X(b) - .6 * Y(b) < X(a) - .6 * Y(a) ? b : a));
      if (mode === 'center') { let cx = 0, cy = 0; for (const i of sk) { cx += X(i); cy += Y(i); } cx /= sk.length; cy /= sk.length; return sk.reduce((a, b) => ((X(b) - cx) ** 2 + (Y(b) - cy) ** 2 < (X(a) - cx) ** 2 + (Y(a) - cy) ** 2 ? b : a)); }
      return arr.reduce((a, b) => (X(b) + .25 * Y(b) < X(a) + .25 * Y(a) ? b : a));
    };
    // recorrido en anchura sobre el esqueleto (si hay tramos sueltos, se encadenan después)
    const dist = new Float32Array(n).fill(-1);
    let off = 0, start = pick(ends);
    for (;;) {
      const q = [start]; dist[start] = off; let maxd = off;
      for (let qi = 0; qi < q.length; qi++) {
        const i = q[qi];
        for (let k2 = 0; k2 < 8; k2++) {
          const j = i + NB[k2]; if (!s[j] || dist[j] >= 0) continue;
          dist[j] = dist[i] + ((k2 === 0 || k2 === 2 || k2 === 5 || k2 === 7) ? 1.414 : 1);
          if (dist[j] > maxd) maxd = dist[j]; q.push(j);
        }
      }
      const rest = sk.filter(i => dist[i] < 0); if (!rest.length) break;
      off = maxd + 3; start = pick(rest.filter(i => deg(i) <= 1).length ? rest.filter(i => deg(i) <= 1) : rest);
    }
    let max = 0; for (const i of sk) if (dist[i] > max) max = dist[i];
    sk.sort((a, b) => dist[a] - dist[b]);
    const out = new Float32Array(sk.length * 4);
    sk.forEach((i, j) => {
      out[j * 4] = x0 + (X(i) - pad + .5) / k; out[j * 4 + 1] = y0 + (Y(i) - pad + .5) / k;
      out[j * 4 + 2] = dt[i] / 3 / k; out[j * 4 + 3] = max ? dist[i] / max : 1;
    });
    return { pts: out, n: sk.length, len: max / k };
  }

  // ---------------------------------------------------------------- logo: Trazo de Oro
  // El logo se escribe a mano: una pluma de oro deja tinta dorada que se asienta en el vino del logo
  // (misma animación que el GIF 01). Los trazos vienen de assets/logo-palapa.svg; el esqueleto se calcula aquí.
  const logo = (() => {
    const card = document.getElementById('logo-card');
    const cvs = document.getElementById('logo-cv');
    const lc = cvs.getContext('2d');
    const LAG = .16, VX = 44, VY = 64, VS = 1440;
    const KEYS = [[523, 324, 4.4], [866, 762, 4.56], [1342, 690, 4.72], [250, 76, 4.84], [940, 1452, 4.98]];
    let comps = null, sched = null, size = 0, ldpr = 1, s = 1, ox = 0, oy = 0, px = 0;
    let red, gold, shadow, mR, mG, tmp, shn, play = null, idleAt = 0, dirty = false, loaded = false, written = false;
    const mk = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d')]; };

    async function load() {
      const txt = await fetch('./assets/logo-palapa.svg?v=1').then(r => r.text());
      const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
      comps = [];
      for (const p of doc.querySelectorAll('path[data-g]')) {
        const g = p.getAttribute('data-g'), box = p.getAttribute('data-b').split(' ').map(Number), path = new Path2D(p.getAttribute('d'));
        let mode = { roof: 'bottomleft', posts: 'top', flourish: 'center' }[g] || 'left';
        if (g === 'lapalapa' && box[0] > 600 && box[0] < 700) mode = 'top';   // la P se escribe de arriba hacia abajo
        const k = (g === 'quality' || g === 'jardin' || g === 'flourish') ? .6 : .45;
        // se calcula pieza por pieza para no trabar la animación de entrada
        await new Promise(r => setTimeout(r, 0));
        comps.push({ g, path, ...skeletonOf(path, box, mode, k) });
      }
      const G = g => comps.filter(c => c.g === g);
      const J = G('jardin');
      const parts = [
        [[...G('roof'), ...G('posts'), ...G('base')], .2, 1.7, .2, .8],
        [[J[0], J[1], J[2], J[3], J[5], J[4]], 1.5, 2.3, .3, .6],
        [G('lapalapa'), 2.0, 3.3, .25, .7],
        [G('quality'), 3.0, 3.85, .55, .5],
        [G('flourish'), 3.6, 4.2, .9, .3],
      ];
      const map = new Map();
      for (const [arr, t0, t1, overlap, power] of parts) {
        const w = arr.map(c => Math.pow(Math.max(1, c.len), power));
        let acc = 0; const st = w.map(d => { const v = acc; acc += d * (1 - overlap); return v; });
        const total = acc + w[w.length - 1] * overlap, k = (t1 - t0) / total;
        arr.forEach((c, i) => map.set(c, [t0 + st[i] * k, t0 + st[i] * k + w[i] * k, arr === parts[4][0]]));
      }
      const ease = t => -(Math.cos(Math.PI * t) - 1) / 2, eout = t => 1 - Math.pow(1 - t, 3);
      sched = (c, t) => { const r = map.get(c); const k = seg(t, r[0], r[1]); return r[2] ? eout(k) : ease(k); };
      sched.range = c => map.get(c);
      // grupos para el relieve
      const P = () => new Path2D();
      logo.bev = P(); logo.flat = P(); logo.fl = P(); logo.all = P();
      for (const c of comps) {
        if (c.g === 'flourish') { logo.fl.addPath(c.path); continue; }
        logo.all.addPath(c.path);
        (c.g === 'jardin' || c.g === 'quality' ? logo.flat : logo.bev).addPath(c.path);
      }
      loaded = true;
    }
    // pinta el logo completo (vino con relieve, o tinta dorada) en un canvas a resolución de dispositivo
    function paint(x, kind) {
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, px, px);
      x.setTransform(s * ldpr, 0, 0, s * ldpr, ox * ldpr, oy * ldpr);
      const d = 1.3 / (s * ldpr) * Math.min(ldpr, 2);
      const g = x.createLinearGradient(100, 100, 1400, 1400);
      if (kind === 'red') { g.addColorStop(0, '#ad2d38'); g.addColorStop(.5, '#9c2531'); g.addColorStop(1, '#7c1a27'); }
      else { g.addColorStop(0, '#f6e1a2'); g.addColorStop(.35, '#d6aa52'); g.addColorStop(.55, '#f8e6ad'); g.addColorStop(.78, '#bf8c3a'); g.addColorStop(1, '#8a6122'); }
      x.fillStyle = g; x.fill(logo.all);
      const gg = x.createLinearGradient(820, 1410, 1080, 1500); gg.addColorStop(0, '#b8913f'); gg.addColorStop(.5, '#ecd08a'); gg.addColorStop(1, '#a8802f');
      x.fillStyle = gg; x.fill(logo.fl);
      const bev = kind === 'red' ? logo.bev : logo.all;
      x.save(); x.clip(bev); x.filter = `blur(${(1.1 * ldpr).toFixed(1)}px)`;
      x.lineWidth = 2.4 * d; x.strokeStyle = kind === 'red' ? 'rgba(255,190,190,.55)' : 'rgba(255,250,225,.8)'; x.translate(d, d); x.stroke(bev); x.translate(-d, -d);
      x.lineWidth = 2.4 * d; x.strokeStyle = kind === 'red' ? 'rgba(60,6,14,.5)' : 'rgba(90,55,12,.55)'; x.translate(-d, -d); x.stroke(bev);
      x.restore();
      x.save(); x.clip(bev); x.lineWidth = .7 * d; x.strokeStyle = kind === 'red' ? 'rgba(255,236,236,.6)' : 'rgba(255,255,240,.7)'; x.translate(1.5 * d, 1.5 * d); x.stroke(bev); x.restore();
    }
    function resize() {
      if (!loaded) return;
      size = card.clientWidth; ldpr = Math.min(devicePixelRatio || 1, 2); px = Math.round(size * ldpr);
      for (const c of [cvs]) { c.width = px; c.height = px; }
      if (!red) { red = mk(); gold = mk(); shadow = mk(); mR = mk(); mG = mk(); tmp = mk(); shn = mk(); }
      [red, gold, shadow, mR, mG, tmp, shn].forEach(x => { x[0].width = px; x[0].height = px; });
      const inner = size * .84; s = inner / VS;
      ox = (size - inner) / 2 - VX * s; oy = (size - inner) / 2 - VY * s + size * .012;
      paint(red[1], 'red'); paint(gold[1], 'gold');
      // sombra suave pre-calculada (desplazada) para no difuminar en cada cuadro
      const sx = shadow[1]; sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, px, px);
      sx.filter = `blur(${(4.5 * ldpr).toFixed(1)}px)`; sx.globalAlpha = .55; sx.drawImage(red[0], 3.5 * ldpr, 5 * ldpr); sx.filter = 'none'; sx.globalAlpha = 1;
      sx.globalCompositeOperation = 'source-in'; sx.fillStyle = 'rgb(84,28,30)'; sx.fillRect(0, 0, px, px); sx.globalCompositeOperation = 'source-over';
      dirty = written;   // antes de la primera escritura la tarjeta queda vacía
    }
    const toCss = (x, y) => [ox + x * s, oy + y * s];
    function mask(m, prog) {
      m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, px, px);
      m.setTransform(s * ldpr, 0, 0, s * ldpr, ox * ldpr, oy * ldpr); m.fillStyle = '#000';
      const heads = [];
      for (const c of comps) {
        const p = prog(c); if (p <= 0) continue;
        if (p >= 1) { m.fill(c.path); continue; }
        m.save(); m.clip(c.path); m.beginPath();
        const P = c.pts; let hk = -1;
        for (let k = 0; k < c.n; k++) {
          if (P[k * 4 + 3] > p) break;
          const r = P[k * 4 + 2] + 3.4; m.moveTo(P[k * 4] + r, P[k * 4 + 1]); m.arc(P[k * 4], P[k * 4 + 1], r, 0, TAU); hk = k;
        }
        m.fill(); m.restore();
        if (hk >= 0) heads.push([P[hk * 4], P[hk * 4 + 1], p]);
      }
      return heads;
    }
    function comp(layer, m, alpha, withShadow) {
      const [tc, tx] = tmp;
      lc.save(); lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalAlpha = alpha;
      if (withShadow) {
        tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = 'copy'; tx.drawImage(shadow[0], 0, 0);
        tx.globalCompositeOperation = 'destination-in'; tx.drawImage(m[0], 3.5 * ldpr, 5 * ldpr); tx.globalCompositeOperation = 'source-over';
        lc.globalAlpha = alpha * .55; lc.drawImage(tc, 0, 0); lc.globalAlpha = alpha;
      }
      tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalCompositeOperation = 'copy'; tx.drawImage(layer[0], 0, 0);
      tx.globalCompositeOperation = 'destination-in'; tx.drawImage(m[0], 0, 0); tx.globalCompositeOperation = 'source-over';
      lc.drawImage(tc, 0, 0); lc.restore();
    }
    function glowDot(x, y, r, col, a) {
      const g = lc.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.4, `rgba(${col},${a * .45})`); g.addColorStop(1, `rgba(${col},0)`);
      lc.fillStyle = g; lc.beginPath(); lc.arc(x, y, r, 0, TAU); lc.fill();
    }
    function star(x, y, r, rot, a) {
      if (a <= 0 || r <= 0) return;
      lc.save(); lc.translate(x, y); glowDot(0, 0, r * 1.1, '214,160,60', .28 * a); lc.rotate(rot);
      const w = r * .09;
      const rays = (R, col) => { lc.fillStyle = col; lc.beginPath(); lc.moveTo(0, -R); lc.quadraticCurveTo(w, -w, R, 0); lc.quadraticCurveTo(w, w, 0, R); lc.quadraticCurveTo(-w, w, -R, 0); lc.quadraticCurveTo(-w, -w, 0, -R); lc.fill(); };
      rays(r * 1.08, `rgba(176,124,38,${a * .9})`); rays(r, `rgba(246,214,140,${a})`);
      lc.rotate(Math.PI / 4); rays(r * .58, `rgba(176,124,38,${a * .8})`); rays(r * .52, `rgba(250,226,160,${a})`);
      glowDot(0, 0, r * .22, '255,255,255', a);
      lc.restore();
    }
    function shineAt(pos, alpha) {
      const [sc, sx] = shn;
      sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, px, px);
      const ang = -.62, ca = Math.cos(ang), sa = Math.sin(ang), diag = px * 1.42;
      const cx = px / 2 + (pos - .5) * diag * ca * 1.15, cy = px / 2 + (pos - .5) * diag * sa * 1.15, hw = .1 * diag;
      const g = sx.createLinearGradient(cx - ca * hw, cy - sa * hw, cx + ca * hw, cy + sa * hw);
      g.addColorStop(0, 'rgba(255,248,225,0)'); g.addColorStop(.42, 'rgba(255,248,225,.55)'); g.addColorStop(.5, 'rgba(255,248,225,1)'); g.addColorStop(.58, 'rgba(255,248,225,.55)'); g.addColorStop(1, 'rgba(255,248,225,0)');
      sx.fillStyle = g; sx.fillRect(0, 0, px, px);
      sx.globalCompositeOperation = 'destination-in'; sx.drawImage(red[0], 0, 0); sx.globalCompositeOperation = 'source-over';
      lc.save(); lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'lighter'; lc.globalAlpha = alpha; lc.drawImage(sc, 0, 0); lc.restore();
    }
    // chispas doradas que caen de la pluma (sin estado: se recalculan por tiempo)
    function headAt(t) {
      let best = null, bs = -1;
      for (const c of comps) { const r = sched.range(c); if (t >= r[0] && t <= r[1] && r[0] > bs) { best = c; bs = r[0]; } }
      if (!best) return null;
      const p = sched(best, t), P = best.pts; let k = 0;
      while (k + 1 < best.n && P[(k + 1) * 4 + 3] <= p) k++;
      return toCss(P[k * 4], P[k * 4 + 1]);
    }
    function sparks(t) {
      const rate = 80, n = Math.ceil((Math.min(t, 4.2) - .2) * rate);
      for (let k = 0; k < n + 2; k++) {
        const te = .2 + k / rate; if (te > t || te > 4.2) break;
        const r1 = hash(k, 21), r2 = hash(21, k * 1.7), r3 = hash(k * 2.3, 14.7), life = .7 * (.6 + r3 * .6), age = t - te;
        if (age > life) continue;
        const e = headAt(te); if (!e) continue;
        const ang = r1 * TAU, sp = 70 * (.3 + r2) * size / 1080 * 2.4;
        const x = e[0] + Math.cos(ang) * sp * age, y = e[1] + Math.sin(ang) * sp * age + 120 * size / 1080 * 2.4 * age * age;
        const f = 1 - age / life;
        lc.fillStyle = r2 > .5 ? `rgba(196,146,52,${.95 * f})` : `rgba(232,190,96,${.95 * f})`;
        lc.beginPath(); lc.arc(x, y, (.5 + .8 * f) * 1.1, 0, TAU); lc.fill();
      }
    }
    function staticFrame() {
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, px, px);
      lc.globalAlpha = .55; lc.drawImage(shadow[0], 0, 0); lc.globalAlpha = 1;
      lc.drawImage(red[0], 0, 0);
    }
    function draw(time) {
      if (!loaded || !px) return false;
      if (play) {
        const t = time - play.start;
        lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, px, px);
        if (t < 4.6) { mask(mG[1], c => sched(c, t)); comp(gold, mG, 1, false); }
        const heads = mask(mR[1], c => sched(c, t - LAG));
        comp(red, mR, 1, true);
        lc.setTransform(ldpr, 0, 0, ldpr, 0, 0);
        // punta de la pluma
        for (const c of comps) {
          const r = sched.range(c); if (t < r[0] || t > r[1]) continue;
          const p = sched(c, t), P = c.pts; let k = -1;
          for (let i = 0; i < c.n; i++) { if (P[i * 4 + 3] > p) break; k = i; }
          if (k < 0) continue;
          const [X, Y] = toCss(P[k * 4], P[k * 4 + 1]), a = Math.sin(clamp(p) * Math.PI);
          glowDot(X, Y, size * .045, '226,170,70', .38 * a);
          lc.fillStyle = `rgba(255,244,214,${.95 * a})`; lc.beginPath(); lc.arc(X, Y, Math.max(1.6, size * .0065), 0, TAU); lc.fill();
          lc.fillStyle = `rgba(190,136,44,${.9 * a})`; lc.beginPath(); lc.arc(X, Y, Math.max(.8, size * .0032), 0, TAU); lc.fill();
        }
        sparks(t);
        const sh = seg(t, 4.25, 5.1); if (sh > 0 && sh < 1) shineAt(-(Math.cos(Math.PI * sh) - 1) / 2, .95);
        lc.setTransform(ldpr, 0, 0, ldpr, 0, 0);
        for (const [x, y, t0] of KEYS) {
          const k = seg(t, t0, t0 + .75); if (k <= 0 || k >= 1) continue;
          const [X, Y] = toCss(x, y), a = Math.sin(k * Math.PI);
          star(X, Y, size * (.024 + .03 * a), k * 1.2, a);
        }
        if (t > 5.8) { play = null; written = true; idleAt = time + 6; staticFrame(); }
        return true;
      }
      // reposo: cada ~8 s un reflejo y destellos
      if (idleAt && time > idleAt) {
        const t = time - idleAt;
        staticFrame();
        const sh = seg(t, 0, .85); if (sh > 0 && sh < 1) shineAt(-(Math.cos(Math.PI * sh) - 1) / 2, .85);
        lc.setTransform(ldpr, 0, 0, ldpr, 0, 0);
        [0, 2, 4].forEach((i, j) => {
          const k = seg(t, .15 + j * .18, .85 + j * .18); if (k <= 0 || k >= 1) return;
          const [X, Y] = toCss(KEYS[i][0], KEYS[i][1]), a = Math.sin(k * Math.PI); star(X, Y, size * (.02 + .025 * a), k, a);
        });
        if (t > 1.6) { idleAt = time + 8; staticFrame(); }
        return true;
      }
      if (dirty) { staticFrame(); dirty = false; }
      return false;
    }
    function write() { if (loaded && !reduce) { play = { start: now() }; } }
    card.addEventListener('click', () => { if (!play) write(); });
    return { load, resize, draw, write, staticFrame: () => { written = true; staticFrame(); }, get playing() { return !!play || (idleAt && now() > idleAt); }, get loaded() { return loaded; } };
  })();

  // ---------------------------------------------------------------- entrada y loop
  const reveals = [...document.querySelectorAll('.rv')];
  function revealAll(stagger) {
    reveals.forEach((el, i) => {
      const go = () => {
        el.classList.add('in');
        if (el.matches('.btn')) scramble(el.querySelector('.scr'), 560);
        el.querySelectorAll('.soc, .pill').forEach(x => x.classList.add('in'));
      };
      stagger ? setTimeout(go, i * 70) : go();
    });
  }
  function finishIntro() {
    if (!introState || introState.done) return;
    introState.done = true;
    root.classList.remove('intro');
    if (dissolve && dissolve.intro) dissolve = null;
    revealAll(false);
    root.classList.add('go');
    ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(ev => removeEventListener(ev, finishIntro));
  }

  if (reduce) {
    root.classList.add('static');
    reveals.forEach(el => el.classList.add('in'));
    cv.remove();
    logo.load().then(() => { logo.resize(); logo.staticFrame(); addEventListener('resize', () => { logo.resize(); logo.staticFrame(); }); });
    return;
  }

  resize();
  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 120); });
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { pointer.tx = e.clientX; pointer.ty = e.clientY; } }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = -1e4; });
  addEventListener('pointerdown', e => { ripples.push({ x: e.clientX / cw, y: e.clientY / ch, t: now() - t0 }); }, { passive: true });

  let asciiClear = false;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const time = now();
    if (logo.playing) logo.draw(time);                 // el logo va a la tasa del dispositivo
    const needAscii = dissolve || ripples.length || W >= 900;
    if (time - lastDraw < 1 / 30) return;             // el fondo ASCII, máx. 30 fps
    lastDraw = time;
    if (!logo.playing) logo.draw(time);
    if (needAscii) { drawAscii(time); asciiClear = false; }
    else if (!asciiClear) { cx.clearRect(0, 0, W, H); asciiClear = true; }
  }
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { requestAnimationFrame(loop); schedule(); } else clearTimeout(slideTimer);
  });
  let slideTimer = 0;
  function schedule() {
    clearTimeout(slideTimer);
    slideTimer = setTimeout(() => { if (!document.hidden) startDissolve((current + 1) % slides.length); schedule(); }, 9000);
  }

  // Intro: la foto se arma desde caracteres, el logo se escribe con pluma de oro y llegan los botones.
  introState = { done: false };
  root.classList.add('intro');
  const ready = Promise.race([Promise.all([
    document.fonts ? document.fonts.ready : 0,
    slides[0].decode ? slides[0].decode().catch(() => 0) : 0,
  ]), new Promise(r => setTimeout(r, 1400))]);
  const logoReady = logo.load().then(() => true, () => false);
  ready.then(() => {
    resize();
    startDissolve(0, true);
    document.getElementById('logo-card').classList.add('in');
    setTimeout(() => revealAll(true), 650);
    setTimeout(() => { if (!introState.done) { introState.done = true; root.classList.add('go'); } }, 2600);
    requestAnimationFrame(loop);
    schedule();
  });
  // el logo se escribe en cuanto su trazo está listo (no detiene la entrada de la página)
  Promise.all([ready, logoReady]).then(([, ok]) => {
    if (ok) { logo.resize(); setTimeout(() => logo.write(), 380); return; }
    const img = new Image(); img.className = 'logo-img'; img.alt = 'Jardín La Palapa · Quality & Service'; img.src = './assets/logo-palapa.svg';
    document.getElementById('logo-card').append(img);
  });
  ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(ev => addEventListener(ev, finishIntro, { once: true, passive: true }));
  setTimeout(() => { if (root.classList.contains('intro')) finishIntro(); }, 5000);
})();
