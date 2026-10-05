(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const dots = [...document.querySelectorAll('.slide-dot')];
  const labels = ['EL SALÓN', 'EL JARDÍN', 'LOS ESPACIOS'];
  const pause = document.querySelector('#pause-slides');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gallery = document.querySelector('#gallery');
  let current = 0;
  let paused = motion.matches;
  let interval = null;
  let galleryOpen = false;
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
    dots.forEach((dot, i) => {
      dot.classList.toggle('selected', i === current);
      dot.setAttribute('aria-pressed', String(i === current));
    });
    document.querySelector('#photo-number').textContent = String(current + 1).padStart(2, '0');
    document.querySelector('#photo-label').textContent = labels[current];
  }
  function timer() {
    clearInterval(interval);
    interval = null;
    if (!paused && !document.hidden && !galleryOpen) interval = setInterval(() => show(current + 1), 7000);
  }
  function updatePause() {
    pause.setAttribute('aria-label', paused ? 'Reanudar fotografías' : 'Pausar fotografías');
    pause.querySelector('use').setAttribute('href', paused ? '#play' : '#pause');
    timer();
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); timer(); }));
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  document.addEventListener('visibilitychange', timer);
  motion.addEventListener('change', () => { paused = motion.matches; updatePause(); });
  document.querySelector('#open-gallery').addEventListener('click', () => {
    gallery.showModal(); galleryOpen = true; document.body.classList.add('dialog-open'); timer();
  });
  document.querySelector('#close-gallery').addEventListener('click', () => gallery.close());
  gallery.addEventListener('click', event => {
    if (event.target === gallery) {
      const r = gallery.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) gallery.close();
    }
  });
  gallery.addEventListener('close', () => { galleryOpen = false; document.body.classList.remove('dialog-open'); timer(); });
  document.querySelector('#year').textContent = new Date().getFullYear();
  updatePause();

  // Dense character particles gather into the photo, logo and live links.
  // The canvas is decorative; links and their accessible names stay intact.
  function assembleFromAscii() {
    if (motion.matches) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'ascii-entrance';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.append(canvas);
    const context = canvas.getContext('2d');
    if (!context) { canvas.remove(); return; }
    const width = innerWidth, height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const selectors = ['.brand', 'h1', '.intro', '.primary-link', '.visit-links', '.discover-link', '.social-section', '.contact-details'];
    const targets = selectors.flatMap(selector => [...document.querySelectorAll(selector)])
      .map((el, index) => ({ el, at: 1.88 + Math.min(index, 9) * .065, cells: [] }));
    targets.forEach(target => target.el.classList.add('ascii-fragment'));
    document.documentElement.classList.add('ascii-starting');
    const bits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=<>[]{}()/\\|!?;:.,~_-';
    const ramp = ' .,:;i!lI+~_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
    const cellWidth = 3, cellHeight = 5;
    const clamp = n => Math.max(0, Math.min(1, n));
    const ease = n => 1 - (1 - clamp(n)) ** 4;
    const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
    let finished = false, frame = 0, lastDraw = 0, started = 0;
    let photo = null;
    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      targets.forEach(target => target.el.classList.add('ascii-in'));
      document.documentElement.classList.remove('ascii-starting');
      canvas.remove();
      clearTimeout(failsafe);
      removeEventListener('resize', finish);
      removeEventListener('scroll', finish);
      removeEventListener('pointerdown', finish);
      removeEventListener('keydown', finish);
      motion.removeEventListener('change', finish);
      document.removeEventListener('visibilitychange', onVisibility);
    }
    function onVisibility() { if (document.hidden) finish(); }
    const failsafe = setTimeout(finish, 5500);
    addEventListener('resize', finish, { once: true });
    addEventListener('scroll', finish, { once: true, passive: true });
    addEventListener('pointerdown', finish, { once: true, passive: true });
    addEventListener('keydown', finish, { once: true });
    motion.addEventListener('change', finish);
    document.addEventListener('visibilitychange', onVisibility);
    function rasterize(target) {
      const rect = target.el.getBoundingClientRect();
      if (rect.top > height || rect.bottom < 0) return;
      const x0 = Math.max(0, Math.floor(rect.left / cellWidth) - 1);
      const y0 = Math.max(0, Math.floor(rect.top / cellHeight) - 1);
      const x1 = Math.min(Math.ceil(width / cellWidth), Math.ceil(rect.right / cellWidth) + 1);
      const y1 = Math.min(Math.ceil(height / cellHeight), Math.ceil(rect.bottom / cellHeight) + 1);
      const pw = (x1 - x0) * cellWidth, ph = (y1 - y0) * cellHeight;
      if (pw <= 0 || ph <= 0) return;
      const mask = document.createElement('canvas'); mask.width = pw; mask.height = ph;
      const c = mask.getContext('2d', { willReadFrequently: true });
      if (!c) return;
      const ox = x0 * cellWidth, oy = y0 * cellHeight;
      const color = target.el.closest('.scene') ? '#f6f1e8' : '#6c202b';
      c.fillStyle = color; c.strokeStyle = color;
      if (target.el.matches('.primary-link, .visit-links, .discover-link, .social-section')) {
        c.lineWidth = 1.5;
        c.strokeRect(rect.left - ox + 1, rect.top - oy + 1, rect.width - 2, rect.height - 2);
      }
      const walker = document.createTreeWalker(target.el, NodeFilter.SHOW_TEXT);
      for (let node; (node = walker.nextNode());) {
        const style = getComputedStyle(node.parentElement);
        c.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        c.textBaseline = 'middle';
        const range = document.createRange();
        for (let i = 0; i < node.nodeValue.length; i++) {
          const char = node.nodeValue[i]; if (/\s/.test(char)) continue;
          range.setStart(node, i); range.setEnd(node, i + 1);
          const box = range.getBoundingClientRect();
          c.fillText(char, box.left - ox, box.top + box.height / 2 - oy);
        }
      }
      const logo = target.el.querySelector('.brand-symbol');
      if (logo) {
        const box = logo.getBoundingClientRect(), scale = Math.min(box.width / 120, box.height / 100);
        c.save(); c.translate(box.left - ox + (box.width - 120 * scale) / 2, box.top - oy + (box.height - 100 * scale) / 2);
        c.scale(scale, scale); c.lineWidth = 5.2; c.lineCap = 'round'; c.lineJoin = 'round';
        c.stroke(new Path2D(document.querySelector('#palapa path').getAttribute('d'))); c.restore();
      }
      const data = c.getImageData(0, 0, pw, ph).data;
      for (let y = 0; y < ph; y += cellHeight) for (let x = 0; x < pw; x += cellWidth) {
        let coverage = 0;
        for (let yy = 0; yy < cellHeight; yy += 2) for (let xx = 0; xx < cellWidth; xx += 2) {
          if (x + xx < pw && y + yy < ph) coverage += data[((y + yy) * pw + x + xx) * 4 + 3] / 255;
        }
        if (coverage < .5) continue;
        const seed = hash(x + ox, y + oy);
        const angle = hash(y + oy, x + ox) * Math.PI * 2;
        const distance = 24 + seed * (width < 761 ? 70 : 135);
        target.cells.push({
          x: x + ox, y: y + oy, char: ramp[Math.min(ramp.length - 1, 28 + Math.floor(coverage * 3))], color, seed,
          dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance,
          delay: seed * .28, index: Math.floor(seed * bits.length)
        });
      }
    }
    function samplePhoto() {
      const scene = document.querySelector('.scene').getBoundingClientRect();
      const img = slides[0]; if (!img.complete || !img.naturalWidth) return;
      const visible = Math.min(scene.height, height - scene.top);
      const cols = Math.max(1, Math.min(190, Math.floor(scene.width / 4)));
      const cw = scene.width / cols;
      const rows = Math.max(1, Math.min(Math.floor(24000 / cols), Math.ceil(visible / (cw * 1.5))));
      const ch = visible / rows;
      const sample = document.createElement('canvas'); sample.width = cols; sample.height = rows;
      const c = sample.getContext('2d', { willReadFrequently: true }); if (!c) return;
      const scale = Math.max(scene.width / img.naturalWidth, scene.height / img.naturalHeight);
      const sw = scene.width / scale, sh = visible / scale;
      c.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - scene.height / scale) / 2, sw, sh, 0, 0, cols, rows);
      const pixels = c.getImageData(0, 0, cols, rows).data;
      const palette = Array.from({ length: 12 }, (_, i) => {
        const lum = i / 11;
        return `rgb(${Math.round(112 + lum * 135)},${Math.round(78 + lum * 155)},${Math.round(58 + lum * 140)})`;
      });
      const groups = palette.map(() => []);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const lum = clamp(((pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255 - .04) * 1.12);
        const char = ramp[Math.floor(lum * (ramp.length - 1))];
        if (char === ' ') continue;
        const seed = hash(x, y), angle = hash(y + 31, x + 19) * Math.PI * 2;
        const distance = 18 + seed * Math.min(scene.width * .22, 185);
        groups[Math.round(lum * 11)].push({
          x: scene.left + x * cw, y: scene.top + y * ch, char, seed,
          dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance,
          delay: .08 + seed * .32, index: Math.floor(seed * bits.length),
          dissolve: 1.64 + (x / cols * .38 + y / rows * .32) + seed * .18
        });
      }
      photo = { scene, visible, cw, ch, palette, groups };
    }
    function draw(now) {
      if (finished) return;
      frame = requestAnimationFrame(draw);
      if (now - lastDraw < 33) return;
      lastDraw = now;
      const t = (now - started) / 1000;
      const tick = Math.floor(t * 28);
      context.clearRect(0, 0, width, height);
      if (photo && t < 3.28) {
        context.save();
        context.beginPath(); context.rect(photo.scene.left, photo.scene.top, photo.scene.width, photo.visible); context.clip();
        context.globalAlpha = 1 - ease((t - 1.62) / 1.62);
        context.fillStyle = '#231e18'; context.fillRect(photo.scene.left, photo.scene.top, photo.scene.width, photo.visible);
        context.font = `${(photo.ch * .84).toFixed(1)}px ui-monospace,monospace`; context.textBaseline = 'top';
        for (let i = 0; i < photo.groups.length; i++) {
          context.fillStyle = photo.palette[i];
          for (const cell of photo.groups[i]) {
            const departure = clamp((t - cell.dissolve) / .85);
            if (departure === 1) continue;
            const gather = ease((t - cell.delay) / 1.1);
            const spread = (1 - gather) + departure ** 2 * .24;
            context.globalAlpha = (.25 + gather * .7) * (1 - departure);
            const changing = gather < .97 || departure > .12;
            context.fillText(changing ? bits[(tick + cell.index) % bits.length] : cell.char,
              cell.x + cell.dx * spread, cell.y + cell.dy * spread);
          }
        }
        context.restore();
      }
      context.font = '5.5px ui-monospace,monospace'; context.textBaseline = 'top';
      for (const target of targets) {
        if (t >= target.at && !target.revealed) { target.el.classList.add('ascii-in'); target.revealed = true; }
        for (const cell of target.cells) {
          const gone = target.at + cell.seed * .32;
          const departure = clamp((t - gone) / .36);
          if (departure === 1) continue;
          const gather = ease((t - cell.delay) / 1.16);
          const spread = 1 - gather + departure ** 2 * .14;
          context.globalAlpha = (.15 + gather * .8) * (1 - departure);
          const changing = gather < .97 || departure > .15;
          context.fillStyle = changing && cell.color === '#6c202b' ? '#a98b52' : cell.color;
          context.fillText(changing ? bits[(tick + cell.index) % bits.length] : cell.char,
            cell.x + cell.dx * spread, cell.y + cell.dy * spread);
        }
      }
      context.globalAlpha = 1;
      if (t > 3.45) finish();
    }
    Promise.all([
      Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 700))]),
      Promise.race([slides[0].decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 700))])
    ]).then(() => {
      if (finished) return;
      try { targets.forEach(rasterize); samplePhoto(); started = performance.now(); frame = requestAnimationFrame(draw); }
      catch { finish(); }
    });
  }
  assembleFromAscii();
})();
