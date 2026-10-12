// Generates the pixel-art animated SVGs used in README.md.
// Usage: node tools/generate-art.js [outDir]   (default: ./assets)
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || path.join(__dirname, '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- 5x7 pixel font ---------- */
const F = {
  A: '01110,10001,10001,11111,10001,10001,10001',
  B: '11110,10001,10001,11110,10001,10001,11110',
  C: '01110,10001,10000,10000,10000,10001,01110',
  D: '11110,10001,10001,10001,10001,10001,11110',
  E: '11111,10000,10000,11110,10000,10000,11111',
  F: '11111,10000,10000,11110,10000,10000,10000',
  G: '01110,10001,10000,10111,10001,10001,01110',
  H: '10001,10001,10001,11111,10001,10001,10001',
  I: '11111,00100,00100,00100,00100,00100,11111',
  K: '10001,10010,10100,11000,10100,10010,10001',
  L: '10000,10000,10000,10000,10000,10000,11111',
  M: '10001,11011,10101,10101,10001,10001,10001',
  N: '10001,11001,10101,10011,10001,10001,10001',
  O: '01110,10001,10001,10001,10001,10001,01110',
  P: '11110,10001,10001,11110,10000,10000,10000',
  R: '11110,10001,10001,11110,10100,10010,10001',
  S: '01110,10001,10000,01110,00001,10001,01110',
  T: '11111,00100,00100,00100,00100,00100,00100',
  U: '10001,10001,10001,10001,10001,10001,01110',
  V: '10001,10001,10001,10001,10001,01010,00100',
  W: '10001,10001,10001,10101,10101,11011,10001',
  Y: '10001,10001,01010,00100,00100,00100,00100',
  0: '01110,10001,10011,10101,11001,10001,01110',
  1: '00100,01100,00100,00100,00100,00100,01110',
  2: '01110,10001,00001,00110,01000,10000,11111',
  3: '11110,00001,00001,01110,00001,00001,11110',
  5: '11111,10000,11110,00001,00001,10001,01110',
  6: '00110,01000,10000,11110,10001,10001,01110',
  9: '01110,10001,10001,01111,00001,00010,01100',
  '.': '00000,00000,00000,00000,00000,00110,00110',
  '-': '00000,00000,00000,11111,00000,00000,00000',
  ' ': '00000,00000,00000,00000,00000,00000,00000',
};

/* ---------- helpers ---------- */
const rect = (x, y, w, h, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;

// bitmap rows -> merged horizontal runs of rects
function bitmap(rows, pal, px, ox, oy) {
  let out = '';
  rows.forEach((r, y) => {
    let x = 0;
    while (x < r.length) {
      const c = r[x];
      if (!pal[c]) { x++; continue; }
      let e = x;
      while (e < r.length && r[e] === c) e++;
      out += rect(ox + x * px, oy + y * px, (e - x) * px, px, pal[c]);
      x = e;
    }
  });
  return out;
}

// text -> array of per-letter svg strings; mk(i, inner) can wrap each letter
function text(str, px, x, y, fill, mk = (i, s) => s) {
  const out = [];
  [...str].forEach((ch, i) => {
    const g = F[ch];
    if (!g) throw new Error('missing glyph: ' + ch + ' in "' + str + '"');
    out.push(mk(i, bitmap(g.split(','), { 1: fill }, px, x + i * 6 * px, y)));
  });
  return out.join('');
}
const textW = (s, px) => s.length * 6 * px - px;

// seeded RNG so output is stable between runs
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const REDUCE = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}';
const head = (w, h, title, css, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}" shape-rendering="crispEdges">
<title>${title}</title>
<style>${css}${REDUCE}</style>
<defs>${defs}</defs>`;

/* =========================================================
   1. BANNER  (1200 x 400)
   ========================================================= */
function banner() {
  const W = 1200, H = 400, GROUND = 340;
  const BLUE = '#0066CC', DBLUE = '#0052A3', TEAL = '#19D3C5', YEL = '#FFD966', ORG = '#FFB020';

  // floors: each one drops in at its own point of a 14s cycle
  const FLOORS = 5, FH = 44, BX = 760, BW = 160;
  let floorCss = '';
  for (let i = 0; i < FLOORS; i++) {
    const p = 6 + i * 13;
    floorCss += `@keyframes f${i}{0%,${p - 1}%{opacity:0;transform:translateY(-40px)}${p + 3}%{opacity:1;transform:translateY(4px)}${p + 5}%{transform:translateY(0)}90%{opacity:1;transform:none}95%,100%{opacity:0}}
.f${i}{animation:f${i} 14s steps(5,end) infinite}`;
  }

  const css = `
@keyframes tw{0%{opacity:1}50%{opacity:.2}}
@keyframes drop{0%{opacity:0;transform:translateY(-70px)}8%{opacity:1;transform:translateY(8px)}10%{transform:translateY(0)}88%{opacity:1}94%,100%{opacity:0}}
@keyframes pop{0%{opacity:0}1%{opacity:1}90%{opacity:1}91%,100%{opacity:0}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes cloud{from{transform:translateX(-200px)}to{transform:translateX(1300px)}}
@keyframes road{from{transform:translateX(0)}to{transform:translateX(-64px)}}
@keyframes win{0%,60%{opacity:1}61%,100%{opacity:.25}}
@keyframes trolley{0%,35%{transform:translateX(0)}60%,80%{transform:translateX(116px)}100%{transform:translateX(0)}}
@keyframes hook{0%{transform:translateY(0)}15%,22%{transform:translateY(194px)}35%,60%{transform:translateY(0)}68%,74%{transform:translateY(22px)}82%,100%{transform:translateY(0)}}
@keyframes ld{0%,19%{opacity:0}20%,72%{opacity:1}73%,100%{opacity:0}}
@keyframes pc{0%,19%{opacity:1}20%,97%{opacity:0}98%,100%{opacity:1}}
.tw{animation:tw 2.4s steps(1) infinite}
.l{animation:drop 12s steps(6,end) infinite backwards}
.t{animation:pop 12s steps(1,end) infinite backwards}
.cur{animation:blink 1s steps(1) infinite}
.cl{animation:cloud 70s linear infinite}
.road{animation:road 1s steps(4) infinite}
.win{animation:win 3s steps(1) infinite}
.trolley{animation:trolley 10s steps(24) infinite}
.hook{animation:hook 10s steps(30) infinite}
.ld{animation:ld 10s steps(1) infinite}
.pc{animation:pc 10s steps(1) infinite}
.beacon{animation:blink 1.2s steps(1) infinite}
${floorCss}`;

  const defs = `
<pattern id="grass" width="16" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#19D3C5"/><rect x="8" width="8" height="8" fill="#12A89C"/></pattern>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect y="3" width="4" height="1" fill="#000" opacity=".14"/></pattern>
<clipPath id="jib"><rect x="-300" y="70" width="600" height="400"/></clipPath>`;

  let s = head(W, H, 'IntoAEC Demo Booking Page - animated pixel art banner', css, defs);

  // sky bands
  [[0, 120, '#0B1020'], [120, 80, '#0E1532'], [200, 60, '#121A3C'], [260, 50, '#172250'], [310, 30, '#1C2A5E']]
    .forEach(([y, h, c]) => (s += rect(0, y, W, h, c)));

  // stars
  for (let i = 0; i < 46; i++) {
    const x = Math.round(rnd() * 296) * 4, y = Math.round(rnd() * 70) * 4;
    const sz = rnd() > 0.8 ? 6 : 4;
    s += rect(x, y, sz, sz, rnd() > 0.7 ? '#9FE8FF' : '#FFFFFF', `class="tw" style="animation-delay:-${(rnd() * 2.4).toFixed(2)}s"`);
  }

  // moon
  s += bitmap(
    ['...XXX...', '.XXXXXXX.', '.XXcXXXX.', 'XXXXXXXXX', 'XXXXXXcXX', 'XcXXXXXXX', '.XXXXXcX.', '.XXXXXXX.', '...XXX...'],
    { X: '#FFF3B0', c: '#E6D58A' }, 6, 600, 34);

  // clouds
  const cloud = ['....XXXX......', '..XXXXXXXX.XX.', 'XXXXXXXXXXXXXX', '.XXXXXXXXXXXX.'];
  s += `<g class="cl" style="animation-delay:-12s">${bitmap(cloud, { X: '#1F2D5C' }, 8, 0, 130)}</g>`;
  s += `<g class="cl" style="animation-delay:-48s">${bitmap(cloud, { X: '#1F2D5C' }, 6, 0, 205)}</g>`;

  // ground + road dashes
  s += rect(0, GROUND, W, 60, '#101A38');
  s += rect(0, GROUND, W, 8, 'url(#grass)');
  let dashes = '';
  for (let x = -64; x < W + 64; x += 64) dashes += rect(x, 376, 32, 6, '#2B3B6E');
  s += `<g class="road">${dashes}</g>`;

  /* ---- title (left) ---- */
  const title = 'INTOAEC';
  const tx = 60, ty = 92, tpx = 12;
  const letters = [...title].map((ch, i) => {
    const col = i < 4 ? '#FFFFFF' : TEAL;
    const gl = F[ch].split(',');
    const x = tx + i * 6 * tpx;
    const inner = bitmap(gl, { 1: DBLUE }, tpx, x + 6, ty + 6) + bitmap(gl, { 1: col }, tpx, x, ty);
    return `<g class="l" style="animation-delay:${(i * 0.12).toFixed(2)}s">${inner}</g>`;
  }).join('');
  s += letters;

  // subtitle typewriter
  const sub = 'DEMO BOOKING PAGE', spx = 5, sy = 205;
  s += text(sub, spx, tx + 2, sy, '#9FB4E8', (i, g) => `<g class="t" style="animation-delay:${(1 + i * 0.07).toFixed(2)}s">${g}</g>`);
  s += rect(tx + 2 + textW(sub, spx) + 12, sy, spx * 3, spx * 7, TEAL, 'class="cur"');

  // pagespeed tag line
  const tag = 'PAGESPEED 100', ppx = 4, py = 262;
  s += rect(tx, py - 14, textW(tag, ppx) + 56, ppx * 7 + 28, '#0F2A24');
  s += rect(tx, py - 14, 4, ppx * 7 + 28, '#0CCE6B');
  s += text(tag, ppx, tx + 28, py, '#0CCE6B', (i, g) => `<g class="t" style="animation-delay:${(2.6 + i * 0.07).toFixed(2)}s">${g}</g>`);

  /* ---- building ---- */
  for (let i = 0; i < FLOORS; i++) {
    const y = GROUND - FH * (i + 1);
    let fl = rect(BX, y, BW, FH, DBLUE) + rect(BX + 4, y + 4, BW - 8, FH - 8, BLUE) + rect(BX, y + FH - 4, BW, 4, '#003F82');
    [22, 68, 114].forEach((wx, k) => {
      const delay = (-((i * 3 + k) * 0.7) % 3).toFixed(2);
      fl += rect(BX + wx, y + 12, 24, 20, YEL, `class="win" style="animation-delay:${delay}s"`);
      fl += rect(BX + wx, y + 12, 24, 3, '#E0B94A');
    });
    s += `<g class="f${i}">${fl}</g>`;
  }

  /* ---- crane ---- */
  const TX = 990;
  // tower lattice
  s += rect(TX, 70, 4, GROUND - 70, ORG) + rect(TX + 12, 70, 4, GROUND - 70, ORG);
  for (let y = 78; y < GROUND; y += 16) s += rect(TX + 4, y, 8, 4, '#C98200');
  // spire + beacon
  s += rect(TX + 6, 38, 4, 22, ORG) + rect(TX + 4, 28, 8, 8, '#FF4D4D', 'class="beacon"');
  // cab
  s += rect(TX - 8, 52, 32, 22, ORG) + rect(TX - 2, 57, 14, 10, '#0B1020') + rect(TX - 8, 70, 32, 4, '#C98200');
  // jib
  s += rect(690, 60, 400, 8, ORG) + rect(690, 68, 400, 3, '#C98200');
  for (let x = 694; x < 990; x += 16) s += rect(x, 72, 4, 4, '#C98200');
  // counterweight
  s += rect(1040, 68, 36, 28, '#5B6B9A') + rect(1040, 76, 36, 4, '#4A5885') + rect(1040, 88, 36, 4, '#4A5885');

  // pile of crates
  const crate = (x, y, cls = '') =>
    `<g${cls ? ` class="${cls}"` : ''}>${rect(x, y, 24, 24, '#8A4F1C')}${rect(x + 2, y + 2, 20, 20, '#C77D2E')}${rect(x + 10, y + 2, 4, 20, '#8A4F1C')}${rect(x + 2, y + 10, 20, 4, '#8A4F1C')}</g>`;
  s += crate(700, 316) + crate(724, 316) + crate(712, 292, 'pc');

  // trolley + hook + load
  s += `<g transform="translate(724 0)"><g class="trolley">
    <g clip-path="url(#jib)"><g class="hook">
      ${rect(-1, -300, 2, 374, '#C9D3F5')}
      <g class="ld">${rect(-12, 74, 24, 24, '#8A4F1C')}${rect(-10, 76, 20, 20, '#C77D2E')}${rect(-2, 76, 4, 20, '#8A4F1C')}${rect(-10, 84, 20, 4, '#8A4F1C')}</g>
      ${rect(-4, 70, 8, 6, '#C9D3F5')}
    </g></g>
    ${rect(-8, 71, 16, 7, '#C98200')}
  </g></g>`;

  // scanlines
  s += rect(0, 0, W, H, 'url(#scan)');
  return s + '</svg>';
}

/* =========================================================
   2. PAGESPEED  (900 x 360)
   ========================================================= */
function pagespeed() {
  const W = 900, H = 360, GREEN = '#0CCE6B';
  const css = `
@keyframes fill{0%{opacity:0}1%{opacity:1}88%{opacity:1}89%,100%{opacity:0}}
@keyframes pulse{0%,49%{opacity:1}50%,100%{opacity:.55}}
.b{animation:fill 9s steps(1,end) infinite backwards}
.v{animation:pulse 1.4s steps(1) infinite}
.ok{animation:fill 9s steps(1,end) infinite backwards}`;
  let s = head(W, H, 'Lighthouse mobile results: performance 100, all Core Web Vitals green', css);
  s += rect(0, 0, W, H, '#0B1020') + rect(0, 0, W, 4, GREEN) + rect(0, H - 4, W, 4, GREEN);
  s += rect(0, 0, 4, H, '#16204A') + rect(W - 4, 0, 4, H, '#16204A');

  s += text('LIGHTHOUSE MOBILE', 5, 36, 30, '#FFFFFF');
  s += text('ALL VITALS GREEN', 3, 36, 76, '#6B7BB8');

  const rows = [
    ['PERFORMANCE', '100'],
    ['FCP', '1.1S'],
    ['LCP', '1.6S'],
    ['TBT', '0MS'],
    ['CLS', '0'],
  ];
  const BARX = 260, BLK = 20, N = 20, ROW0 = 116, GAP = 44;
  rows.forEach(([lab, val], r) => {
    const y = ROW0 + r * GAP;
    s += text(lab, 3, 36, y + 1, '#C9D3F5');
    for (let k = 0; k < N; k++) {
      s += rect(BARX + k * BLK, y, 16, 20, '#16204A');
      s += rect(BARX + k * BLK, y, 16, 20, GREEN, `class="b" style="animation-delay:${(0.3 + r * 0.45 + k * 0.06).toFixed(2)}s"`);
      s += rect(BARX + k * BLK, y, 16, 4, '#5CF0A4', `class="b" style="animation-delay:${(0.3 + r * 0.45 + k * 0.06).toFixed(2)}s"`);
    }
    const vd = (0.3 + r * 0.45 + N * 0.06).toFixed(2);
    s += `<g class="b" style="animation-delay:${vd}s"><g class="${r === 0 ? 'v' : ''}">${text(val, 4, 690, y - 4, r === 0 ? '#FFFFFF' : GREEN)}</g></g>`;
    // check mark
    s += `<g class="ok" style="animation-delay:${(+vd + 0.15).toFixed(2)}s">${bitmap(['.....X', '....XX', 'X..XX.', 'XXXX..', '.XX...'], { X: GREEN }, 4, 836, y)}</g>`;
  });
  s += text('MEASURED LOCALLY WITH LIGHTHOUSE', 2, 36, H - 30, '#4A5885');
  return s + '</svg>';
}

/* =========================================================
   3. FLOW  (900 x 230)
   ========================================================= */
function flow() {
  const W = 900, H = 230, GREEN = '#0CCE6B', BLUE = '#0066CC', TEAL = '#19D3C5';
  const css = `
@keyframes pop{0%{opacity:0}1%{opacity:1}92%{opacity:1}93%,100%{opacity:0}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:.2}}
@keyframes cursor{0%{transform:translate(70px,60px)}30%{transform:translate(0,0)}38%{transform:translate(0,0)}60%,100%{transform:translate(70px,60px)}}
@keyframes press{0%,38%{transform:translateY(0)}41%,46%{transform:translateY(5px)}49%,100%{transform:translateY(0)}}
@keyframes ring{0%,38%{opacity:0;transform:scale(.4)}39%{opacity:1;transform:scale(.6)}50%{opacity:0;transform:scale(1.5)}100%{opacity:0}}
@keyframes cell{0%,45%{opacity:0}46%,92%{opacity:1}93%,100%{opacity:0}}
@keyframes sel{0%,49%{fill:#0CCE6B}50%,100%{fill:#FFD966}}
.p{animation:pop 6s steps(1,end) infinite backwards}
.ar{animation:blink 1s steps(1) infinite}
.cursor{animation:cursor 6s steps(14) infinite}
.press{animation:press 6s steps(1) infinite}
.ring{animation:ring 6s steps(5) infinite;transform-box:fill-box;transform-origin:center}
.cell{animation:cell 6s steps(1,end) infinite backwards}
.sel{animation:cell 6s steps(1,end) infinite backwards, sel 1s steps(1) infinite}`;
  let s = head(W, H, 'How it works: fast page, visitor clicks, TidyCal calendar loads on demand', css);
  s += rect(0, 0, W, H, '#0B1020') + rect(0, 0, W, 4, BLUE) + rect(0, H - 4, W, 4, BLUE);

  const PY = 28, PH = 140, PW = 240, P = [30, 330, 630];
  P.forEach((x) => (s += rect(x, PY, PW, PH, '#16204A') + rect(x + 4, PY + 4, PW - 8, PH - 8, '#101A38')));
  ['1 FAST LOAD', '2 CLICK', '3 CALENDAR'].forEach((t, i) => {
    const w = textW(t, 3);
    s += text(t, 3, P[i] + (PW - w) / 2, PY + PH + 22, i === 0 ? GREEN : i === 1 ? '#FFD966' : TEAL);
  });

  // arrows between panels
  [270, 570].forEach((x, i) => {
    s += `<g class="ar" style="animation-delay:${i * 0.5}s">${bitmap(['X.....', 'XX....', 'XXX...', 'XXXX..', 'XXX...', 'XX....', 'X.....'], { X: '#6B7BB8' }, 4, x + 18, PY + 56)}</g>`;
  });

  /* panel 1: page loading */
  const x1 = P[0];
  s += rect(x1 + 14, PY + 14, PW - 28, 18, '#1C2A5E');
  [0, 1, 2].forEach((i) => (s += rect(x1 + 22 + i * 14, PY + 19, 8, 8, ['#FF5F56', '#FFBD2E', '#27C93F'][i])));
  const lines = [[160, BLUE], [200, '#2B3B6E'], [120, '#2B3B6E'], [180, '#2B3B6E']];
  lines.forEach(([w, c], i) => {
    s += rect(x1 + 24, PY + 44 + i * 16, w, 10, '#16204A');
    s += rect(x1 + 24, PY + 44 + i * 16, w, 10, c, `class="p" style="animation-delay:${(0.2 + i * 0.25).toFixed(2)}s"`);
  });
  s += text('33 KB', 3, x1 + 24, PY + 112, GREEN, (i, g) => `<g class="p" style="animation-delay:${(1.2 + i * 0.1).toFixed(2)}s">${g}</g>`);

  /* panel 2: button + cursor */
  const x2 = P[1], bx = x2 + 10, by = PY + 40, bw = PW - 20, bh = 56;
  s += rect(bx, by + 6, bw, bh, '#003F82'); // shadow base
  s += `<g class="press">${rect(bx, by, bw, bh, BLUE)}${rect(bx, by, bw, 4, '#3D8CE6')}${text('BOOK A DEMO', 3, bx + (bw - textW('BOOK A DEMO', 3)) / 2, by + 18, '#FFFFFF')}</g>`;
  // click ring
  s += `<g class="ring">${rect(x2 + 108, PY + 60, 24, 24, 'none', 'stroke="#FFD966" stroke-width="4"')}</g>`;
  // cursor
  const cur = ['X.........', 'XX........', 'XXX.......', 'XXXX......', 'XXXXX.....', 'XXXXXX....', 'XXXXXXX...', 'XXXXX.....', 'XX.XX.....', 'X..XX.....', '....XX....'];
  s += `<g class="cursor"><g transform="translate(${x2 + 118} ${PY + 66})">${bitmap(cur, { X: '#000' }, 4, 3, 3)}${bitmap(cur, { X: '#FFFFFF' }, 4, 0, 0)}</g></g>`;

  /* panel 3: calendar */
  const x3 = P[2];
  s += rect(x3 + 14, PY + 14, PW - 28, 30, TEAL) + text('TIDYCAL', 3, x3 + 24, PY + 19, '#0B1020');
  s += rect(x3 + 176, PY + 8, 6, 12, '#FFFFFF') + rect(x3 + 200, PY + 8, 6, 12, '#FFFFFF');
  const COLS = 6, ROWS = 3, CW = 30, CH = 22;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = x3 + 22 + c * (CW + 4), cy = PY + 54 + r * (CH + 6);
      const sel = r === 1 && c === 3;
      s += rect(cx, cy, CW, CH, '#1C2A5E');
      const d = (3.0 + (r * COLS + c) * 0.05).toFixed(2);
      s += rect(cx, cy, CW, CH, sel ? GREEN : '#2B3B6E', `class="${sel ? 'sel' : 'cell'}" style="animation-delay:${d}s"`);
    }
  }
  return s + '</svg>';
}

/* =========================================================
   4. DIVIDER (900 x 44)  - builder sprite running along a dotted path
   ========================================================= */
function divider() {
  const W = 900, H = 44;
  const css = `
@keyframes run{from{transform:translateX(-40px)}to{transform:translateX(900px)}}
@keyframes a{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes b{0%,49%{opacity:0}50%,100%{opacity:1}}
.run{animation:run 9s linear infinite}
.fa{animation:a .45s steps(1) infinite}
.fb{animation:b .45s steps(1) infinite}`;
  let s = head(W, H, 'Animated pixel divider - a builder running along a path', css);
  for (let x = 0; x < W; x += 16) s += rect(x, 38, 8, 4, '#3B6FD1', 'opacity=".45"');
  const pal = { Y: '#FFD966', y: '#E0B94A', S: '#F2C094', K: '#181C39', B: '#0066CC', b: '#0052A3', O: '#FF8A00' };
  const top = ['..YYYY..', '.YYYYYY.', 'yyyyyyyy', '..SSSS..', '..SKSK..', '..SSSS..', 'OBBBBBBO', 'SBBBBBBS', '.bbbbbb.'];
  const legA = ['..KK.KK.', '.KK...KK'];
  const legB = ['...KK...', '...KK...'];
  const px = 3, ox = 0, oy = 38 - 11 * px;
  s += `<g class="run"><g transform="translate(0 ${oy})">`
    + bitmap(top, pal, px, ox, 0)
    + `<g class="fa">${bitmap(legA, pal, px, ox, top.length * px)}</g>`
    + `<g class="fb">${bitmap(legB, pal, px, ox, top.length * px)}</g>`
    + `</g></g>`;
  return s + '</svg>';
}

const files = { 'banner.svg': banner(), 'pagespeed.svg': pagespeed(), 'flow.svg': flow(), 'divider.svg': divider() };
for (const [n, c] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, n), c);
  console.log(n, (c.length / 1024).toFixed(1) + ' KB');
}
