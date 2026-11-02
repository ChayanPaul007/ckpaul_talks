/* =====================================================================
   Figures for the KFUPM talk -- hand-built SVG.
   Every figure is animated by a small loop engine: each figure registers
   tick(u) with a period; while its slide is on screen, u runs 0 -> 1 and
   repeats (GIF-like). Add ?static to the URL to freeze all figures in
   their final state (used for the PDF export).
   Colours follow css/theme.css.
   ===================================================================== */
(function () {
  const C = { ink:'#1C2430', navy:'#16294A', blue:'#3E5C8A', gold:'#B08A3E', red:'#A63D40',
              gray:'#6B7280', mid:'#9AA3AF', line:'#D9DDE3', panel:'#F4F5F7' };
  const STATIC = /[?&]static\b/.test(location.search);

  // ---------- helpers ----------
  const f = (v) => (+v).toFixed(2);
  const poly = (pts) => 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L');
  function fnPts(fn, a, b, n, X, Y) { const o = []; for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n; o.push([X(t), Y(fn(t))]); } return o; }
  function cr(pts, k = 24) {               // Catmull-Rom through control points
    const o = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      for (let j = 0; j < k; j++) {
        const t = j / k, t2 = t * t, t3 = t2 * t;
        const c = (a, b, c_, d) => 0.5 * ((2 * b) + (-a + c_) * t + (2 * a - 5 * b + 4 * c_ - d) * t2 + (-a + 3 * b - 3 * c_ + d) * t3);
        o.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    o.push(pts[pts.length - 1]); return o;
  }
  const map = (pts, X, Y) => pts.map(p => [X(p[0]), Y(p[1])]);
  const at = (pts, u) => pts[Math.max(0, Math.min(pts.length - 1, Math.round(u * (pts.length - 1))))];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (x) => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const txt = (x, y, s, o = {}) => `<text ${o.id ? `id="${o.id}"` : ''} x="${f(x)}" y="${f(y)}" font-size="${o.size || 17}" fill="${o.fill || C.gray}" text-anchor="${o.anchor || 'start'}" ${o.italic ? 'font-style="italic"' : ''} ${o.weight ? `font-weight="${o.weight}"` : ''} ${o.op !== undefined ? `opacity="${o.op}"` : ''}>${s}</text>`;
  const path = (d, o = {}) => `<path ${o.id ? `id="${o.id}"` : ''} d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.navy}" stroke-width="${o.w || 2}" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''} ${o.prog ? 'pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"' : ''} ${o.cls ? `class="${o.cls}"` : ''} ${o.op !== undefined ? `opacity="${o.op}"` : ''} stroke-linecap="round" stroke-linejoin="round"/>`;
  const dot = (id, r, fill, extra = '') => `<circle id="${id}" r="${r}" fill="${fill}" ${extra}/>`;
  const axes = (x0, y0, x1, y1, lx, ly) => `${path(`M${x0},${y0} L${x1},${y0}`, { stroke: C.mid, w: 1.4 })}<path d="M${x1},${y0} l-8,-4 v8 z" fill="${C.mid}"/>`
    + (y1 !== null ? `${path(`M${x0},${y0} L${x0},${y1}`, { stroke: C.mid, w: 1.4 })}<path d="M${x0},${y1} l-4,8 h8 z" fill="${C.mid}"/>` : '')
    + (lx ? txt(x1 + 6, y0 + 5, lx, { italic: 1 }) : '') + (ly ? txt(x0 - 4, y1 - 8, ly, { italic: 1, anchor: 'middle' }) : '');
  const svg = (w, h, inner, extra = '') => `<svg viewBox="0 0 ${w} ${h}" width="100%" xmlns="http://www.w3.org/2000/svg" ${extra}>${inner}</svg>`;
  const put = (id, s) => { const el = document.getElementById(id); if (el) el.innerHTML = s; return el; };
  const $ = (id) => document.getElementById(id);
  const setP = (id, u) => { const e = $(id); if (e) e.setAttribute('stroke-dashoffset', String(1 - clamp(u))); };
  const setXY = (id, p) => { const e = $(id); if (e) { e.setAttribute('cx', f(p[0])); e.setAttribute('cy', f(p[1])); } };

  // ---------- loop engine ----------
  const figs = [];   // {host, period, tick}
  const reg = (hostId, period, tick) => figs.push({ host: hostId, period, tick });

  // ================= title: tube with a looping trajectory =================
  (function title() {
    const W = 760, H = 900, X = u => 20 + u * 760;
    const cc = u => 470 - 95 * Math.sin(2 * Math.PI * (0.55 * u + 0.08)) - 22 * Math.sin(2 * Math.PI * 1.6 * u);
    const ww = u => 125 - 70 * u;
    const up = fnPts(u => cc(u) - ww(u), 0, 1, 160, X, y => y), lo = fnPts(u => cc(u) + ww(u), 0, 1, 160, X, y => y);
    let s = '';
    for (let k = 1; k < 12; k++) { const u = k / 12; s += `<ellipse cx="${f(X(u))}" cy="${f(cc(u))}" rx="12" ry="${f(ww(u))}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1"/>`; }
    s += path(poly(up), { stroke: '#fff', w: 1.6, op: .55 }) + path(poly(lo), { stroke: '#fff', w: 1.6, op: .55 });
    const tr = fnPts(u => cc(u) + 0.6 * ww(u) * Math.exp(-3.2 * u) * Math.cos(2 * Math.PI * 2.6 * u), 0, 0.9, 260, X, y => y);
    s += path(poly(tr), { stroke: C.gold, w: 2.6, prog: 1, id: 'ti-tr' });
    s += dot('ti-dot', 6, C.gold);
    s += `<circle id="ti-o1" cx="300" cy="170" r="32" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>`;
    s += `<circle id="ti-o2" cx="560" cy="720" r="26" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>`;
    s += `<rect x="${f(X(0.9) - 18)}" y="${f(cc(0.9) - 18)}" width="36" height="36" fill="none" stroke="${C.gold}" stroke-width="1.6"/>`;
    put('fig-title', svg(W, H, s, 'preserveAspectRatio="xMidYMid meet" height="100%"'));
    reg('fig-title', 8000, u => {
      const s1 = ease(clamp(u / 0.8)); setP('ti-tr', s1); setXY('ti-dot', at(tr, s1));
      const o1 = $('ti-o1'), o2 = $('ti-o2');
      if (o1) o1.setAttribute('cx', f(300 + 140 * u)); if (o2) o2.setAttribute('cx', f(560 - 120 * u));
    });
  })();

  // ================= PE vs IE: scrolling oscilloscope + repeated burst =================
  (function peie() {
    const X = t => 70 + t * 66; let s = '';
    s += txt(20, 78, 'PE', { weight: 700 }) + txt(20, 208, 'IE', { weight: 700 });
    s += path('', { stroke: C.mid, w: 2.2, id: 'pe-sig' });
    s += txt(70, 30, 'persistent excitation: needed on every window, for all time', { size: 17 });
    s += `<rect x="${X(0)}" y="168" width="${X(2.3) - X(0)}" height="74" fill="${C.gold}" opacity=".14"/>`;
    const ie = fnPts(t => 205 - 30 * Math.exp(-0.9 * t) * Math.sin(5 * t), 0, 10, 300, X, y => y);
    s += path(poly(ie), { stroke: C.navy, w: 2.4, prog: 1, id: 'ie-sig' }) + dot('ie-dot', 5, C.navy);
    s += txt(X(1.15), 262, '[0, T]', { anchor: 'middle', italic: 1 });
    s += txt(X(2.8), 158, 'initial excitation: once, on [0, T]; contact is then quasi-static', { size: 17 });
    put('fig-peie', svg(760, 275, s));
    reg('fig-peie', 5000, u => {
      const ph = 2 * Math.PI * u * 2;
      const pe = fnPts(t => 70 - 24 * Math.sin(3.1 * t - ph), 0, 10, 240, X, y => y);
      const e = $('pe-sig'); if (e) e.setAttribute('d', poly(pe));
      const s1 = clamp(u / 0.85); setP('ie-sig', s1); setXY('ie-dot', at(ie, s1));
    });
  })();

  // ================= reference shaping: two references driven by the same push =================
  (function refshape() {
    const X = t => 40 + t * 66, Y = v => 300 - v * 62; let s = '';
    s += `<rect x="${X(0)}" y="${Y(3.2)}" width="${X(10.3) - X(0)}" height="${Y(0) - Y(3.2)}" fill="${C.panel}"/>`;
    s += path(`M${X(0)},${Y(3.2)} L${X(10.3)},${Y(3.2)}`, { stroke: C.red, w: 1.8, dash: '8 6' });
    s += txt(X(0), Y(3.2) - 10, 'safe-set boundary', { fill: C.red });
    s += axes(X(0), Y(0), X(10.6), null, 't');
    const naive = map(cr([[0, .3], [1.5, .5], [3, 1.5], [4.5, 2.7], [6, 3.75], [7.2, 4.1]]), X, Y);
    const shaped = map(cr([[0, .3], [1.5, .5], [3, 1.5], [4.4, 2.55], [5.6, 2.97], [7.5, 3.06], [10.2, 3.07]]), X, Y);
    s += path(poly(naive), { stroke: C.mid, w: 2.4, prog: 1, id: 'rs-n' }) + dot('rs-nd', 6, C.mid);
    s += path(poly(shaped), { stroke: C.navy, w: 3, prog: 1, id: 'rs-s' }) + dot('rs-sd', 6.5, C.navy);
    s += txt(X(7.3), Y(4.1) + 5, 'naive admittance: violates', { id: 'rs-nl', op: 0 });
    s += `<g id="rs-sw" opacity="0"><circle cx="${X(4.45)}" cy="${Y(2.58)}" r="6" fill="${C.gold}"/>${path(`M${X(4.45)},${Y(2.58)} L${X(5.3)},${Y(1.35)}`, { stroke: C.gold, w: 1.2 })}`
      + txt(X(5.4), Y(1.3) + 5, 'switch to the stiff model before Φ = 0') + '</g>';
    s += txt(X(6.6), Y(2.6), 'shaped reference', { fill: C.navy, id: 'rs-sl', op: 0 });
    s += `<g transform="translate(${X(0.4)},${Y(0) + 22})">${path('M0,0 L1,0', { stroke: C.navy, w: 2.4, id: 'rs-f' })}<path id="rs-fh" d="M0,0 l-9,-5 v10 z" fill="${C.navy}"/></g>` + txt(X(3.6), Y(0) + 28, 'human force f', { id: 'rs-ft', size: 15 });
    put('fig-refshape', svg(760, 340, s));
    const time = [0, 1.5, 3, 4.5, 6, 7.2];
    reg('fig-refshape', 7000, u => {
      const s1 = clamp(u / 0.8), sN = clamp(s1 / 0.72);
      setP('rs-n', sN); setP('rs-s', s1);
      const pn = at(naive, sN); setXY('rs-nd', pn); $('rs-nd').setAttribute('fill', pn[1] < Y(3.2) ? C.red : C.mid);
      setXY('rs-sd', at(shaped, s1));
      $('rs-nl').setAttribute('opacity', sN > .85 ? 1 : 0);
      $('rs-sw').setAttribute('opacity', s1 > .45 ? 1 : 0);
      $('rs-sl').setAttribute('opacity', s1 > .75 ? 1 : 0);
      const L = 40 + 110 * (0.5 + 0.5 * Math.sin(2 * Math.PI * u * 2));
      $('rs-f').setAttribute('d', `M0,0 L${f(L)},0`); $('rs-fh').setAttribute('transform', `translate(${f(L + 4)},0)`);
    });
  })();

  // ================= tube MPC: block diagram + tube shrinking at T_max (looping) =================
  (function tubempc() {
    const box = (x, y, w, h, t1, t2, col = C.navy, fill = '#fff') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${col}" stroke-width="1.4"/>`
      + txt(x + w / 2, y + h / 2 - (t2 ? 3 : -6), t1, { anchor: 'middle', fill: C.ink, size: 17, weight: t2 ? 600 : 400 })
      + (t2 ? txt(x + w / 2, y + h / 2 + 18, t2, { anchor: 'middle', fill: C.gray, size: 16 }) : '');
    const ar = (d, col = C.gray) => path(d, { stroke: col, w: 1.5 });
    const head = (x, y, dir = 'r', col = C.gray) => dir === 'r' ? `<path d="M${x},${y} l-9,-4.5 v9 z" fill="${col}"/>` : `<path d="M${x},${y} l-4.5,9 h9 z" fill="${col}"/>`;
    let s = '';
    s += `<rect x="10" y="92" width="120" height="60" fill="#fff" stroke="${C.navy}" stroke-width="1.4"/>` + txt(70, 117, 'human /', { anchor: 'middle', fill: C.ink }) + txt(70, 139, 'environment', { anchor: 'middle', fill: C.ink });
    s += box(175, 92, 100, 60, 'channel split', '');
    s += box(320, 30, 250, 66, 'contact direction', 'fixed-time impedance law', C.navy, C.panel);
    s += box(320, 148, 250, 66, 'other directions', 'tube MPC (linear QP)', C.navy, C.panel);
    s += box(630, 92, 110, 60, 'robot', '');
    s += box(320, 262, 250, 50, 'fixed-time estimator Θ̂', '', C.gold);
    s += ar('M130,122 L166,122') + head(175, 122) + `<text x="152" y="110" font-size="16" fill="${C.gray}" text-anchor="middle" font-style="italic">f<tspan font-size="11" dy="4">ext</tspan></text>`;
    s += ar('M275,122 L298,122 L298,63 L311,63') + head(320, 63) + ar('M298,122 L298,181 L311,181') + head(320, 181);
    s += ar('M570,63 L600,63 L600,110 L621,110') + head(630, 110) + ar('M570,181 L600,181 L600,134 L621,134') + head(630, 134);
    s += ar('M570,287 L685,287 L685,161', C.gold) + head(685, 152, 'u', C.gold);
    s += path('M445,262 L445,223', { stroke: C.gold, w: 1.5, dash: '5 4' }) + head(445, 214, 'u', C.gold) + `<text x="456" y="245" font-size="15" fill="${C.gold}">tube shrinks after <tspan font-style="italic">T</tspan><tspan font-size="10" dy="4">max</tspan></text>`;
    // signal pulses travelling along the wires
    s += dot('mp-p1', 4.5, C.navy) + dot('mp-p2', 4.5, C.navy) + dot('mp-p3', 4.5, C.gold);
    const X = t => 40 + t * 66, Y = v => 590 - v * 52, c = t => 1.2 + 0.8 * Math.sin(0.5 * t), Tm = 4;
    const w = t => t < Tm ? 0.55 : 0.22 + 0.33 * Math.exp(-2.5 * (t - Tm));
    let g = axes(X(0), Y(0), X(10.6), null, 't');
    g += path(`M${X(0)},${Y(3)} L${X(10.3)},${Y(3)}`, { stroke: C.red, w: 1.8 }) + txt(X(0), Y(3) - 10, 'hard constraint', { fill: C.red });
    g += `<path id="mp-band" fill="${C.blue}" opacity=".18"/>` + path('', { stroke: C.mid, w: 1.4, dash: '6 5', id: 'mp-tight' });
    g += path('', { stroke: C.navy, w: 2.6, id: 'mp-traj' }) + dot('mp-dot', 6.5, C.navy, 'stroke="#fff" stroke-width="2"');
    g += path(`M${X(Tm)},${Y(0)} L${X(Tm)},${Y(3)}`, { stroke: C.gold, w: 1.6, dash: '3 4' }) + `<text x="${X(Tm)}" y="${Y(0) + 24}" font-size="17" fill="${C.gold}" text-anchor="middle"><tspan font-style="italic">T</tspan><tspan font-size="11" dy="4">max</tspan></text>`;
    g += txt(X(10.3), Y(3) - 10, 'tightened set 𝒱 ⊖ ℰ_b relaxes as the tube shrinks', { anchor: 'end', size: 15 });
    put('fig-tubempc', svg(760, 640, s + g));
    const wire1 = [[275, 122], [298, 122], [298, 63], [570, 63], [600, 63], [600, 110], [630, 110]];
    const wire2 = [[275, 122], [298, 122], [298, 181], [570, 181], [600, 181], [600, 134], [630, 134]];
    const wire3 = [[570, 287], [685, 287], [685, 152]];
    const along = (wire, u) => { // point at fraction u along a polyline
      const seg = []; let L = 0; for (let i = 1; i < wire.length; i++) { const d = Math.hypot(wire[i][0] - wire[i - 1][0], wire[i][1] - wire[i - 1][1]); seg.push(d); L += d; }
      let r = u * L; for (let i = 1; i < wire.length; i++) { if (r <= seg[i - 1]) { const a = r / seg[i - 1]; return [wire[i - 1][0] + a * (wire[i][0] - wire[i - 1][0]), wire[i - 1][1] + a * (wire[i][1] - wire[i - 1][1])]; } r -= seg[i - 1]; }
      return wire[wire.length - 1];
    };
    reg('fig-tubempc', 8000, u => {
      const T = 10.2 * clamp(u / 0.85), n = Math.max(2, Math.round(T * 12));
      const upper = [], lower = [], tight = [], tr = [];
      for (let i = 0; i <= n; i++) { const t = T * i / n; upper.push([X(t), Y(c(t) + w(t))]); lower.push([X(t), Y(c(t) - w(t))]); tight.push([X(t), Y(3 - w(t) - 0.05)]); tr.push([X(t), Y(c(t))]); }
      $('mp-band').setAttribute('d', poly(upper.concat(lower.reverse())) + 'Z');
      $('mp-tight').setAttribute('d', poly(tight)); $('mp-traj').setAttribute('d', poly(tr)); setXY('mp-dot', tr[tr.length - 1]);
      const k = (u * 3) % 1; setXY('mp-p1', along(wire1, k)); setXY('mp-p2', along(wire2, k)); setXY('mp-p3', along(wire3, k));
    });
  })();

  // ================= funnel: error drawn repeatedly inside the funnel =================
  (function funnel() {
    const X = t => 40 + t * 68, Y = e => 190 - e * 68;
    const phi = t => 1.85 * Math.exp(-0.5 * t) + 0.38;
    const ee = t => 1.45 * Math.exp(-0.48 * t) * Math.cos(1.7 * t) + 0.24 * Math.exp(-2.2 * (t - 6.6) ** 2);
    let s = '';
    const band = fnPts(phi, 0, 10, 100, X, Y).concat(fnPts(t => -phi(t), 10, 0, 100, X, Y));
    s += `<path d="${poly(band)}Z" fill="${C.blue}" opacity=".12"/>`;
    s += path(poly(fnPts(phi, 0, 10, 100, X, Y)), { stroke: C.blue, w: 2 }) + path(poly(fnPts(t => -phi(t), 0, 10, 100, X, Y)), { stroke: C.blue, w: 2 });
    s += axes(X(0), Y(0), X(10.4), Y(2.55), 't', 'e') + path(`M${X(0)},${Y(0)} L${X(0)},${Y(-2.4)}`, { stroke: C.mid, w: 1.4 });
    const ep = fnPts(ee, 0, 10, 400, X, Y);
    s += path(poly(ep), { stroke: C.navy, w: 2.8, prog: 1, id: 'fu-e' }) + dot('fu-d', 6.5, C.navy, 'stroke="#fff" stroke-width="2"');
    s += `<line id="fu-c" y1="${Y(2.4)}" y2="${Y(-2.4)}" stroke="${C.gold}" stroke-width="1.2" stroke-dasharray="4 4"/>`;
    s += txt(X(0.5), Y(2.25), 'funnel φ(t): prescribed transient', { fill: C.blue });
    s += txt(X(10), Y(-0.55) + 22, 'prescribed accuracy', { fill: C.blue, anchor: 'end' });
    s += `<g id="fu-k" opacity="0">${path(`M${X(6.3)},${Y(1.15)} L${X(6.6)},${Y(0.42)}`, { stroke: C.gold, w: 1.3 })}${txt(X(6.6), Y(1.25), 'contact: compliant, yet inside the funnel', { anchor: 'end' })}</g>`;
    put('fig-funnel', svg(760, 360, s));
    reg('fig-funnel', 7000, u => {
      const s1 = clamp(u / 0.85); setP('fu-e', s1); const p = at(ep, s1); setXY('fu-d', p);
      const c = $('fu-c'); c.setAttribute('x1', f(p[0])); c.setAttribute('x2', f(p[0]));
      $('fu-k').setAttribute('opacity', s1 > 0.6 ? 1 : 0);
    });
  })();

  // ================= STT: space-time tube + arm workspace, in sync =================
  (function stt() {
    const X = t => 40 + t * 68, Y = p => 380 - p * 62;
    const upP = [[0, 3.0], [1.5, 3.6], [3, 4.2], [5, 4.62], [7, 4.7], [8, 4.4], [9, 3.5], [10, 3.4]];
    const loP = [[0, 1.8], [1.5, 2.4], [3, 3.1], [5, 3.85], [7, 4.25], [8, 3.55], [9, 2.7], [10, 2.8]];
    const trP = [[0, 2.2], [1.5, 3.0], [3, 3.68], [5, 4.25], [7, 4.48], [8, 4.0], [9, 3.12], [10, 3.1]];
    const up = map(cr(upP), X, Y), lo = map(cr(loP), X, Y), tr = map(cr(trP, 40), X, Y);
    let s = `<defs><pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" stroke="${C.mid}" stroke-width="1.3"/></pattern></defs>`;
    s += `<rect x="${X(0)}" y="${Y(5.6)}" width="${X(10.3) - X(0)}" height="${Y(4.85) - Y(5.6)}" fill="url(#hatch)"/>` + path(`M${X(0)},${Y(4.85)} L${X(10.3)},${Y(4.85)}`, { stroke: C.mid, w: 1 });
    s += `<rect x="${X(3.4)}" y="${Y(5.42)}" width="${X(6.9) - X(3.4)}" height="22" fill="#fff"/>` + txt(X(5.15), Y(5.42) + 16, 'near-singular configurations', { anchor: 'middle' });
    s += `<path d="M${X(1.5)},${Y(.5)} L${X(1.5)},${Y(1.6)} L${X(7.2)},${Y(4.165)} L${X(7.2)},${Y(3.065)}Z" fill="${C.red}" opacity=".3"/>` + txt(X(5.1), Y(1.75), 'moving obstacle', { fill: C.red });
    s += `<line id="stt-ob" stroke="${C.red}" stroke-width="7" stroke-linecap="round" opacity=".85"/>`;
    s += `<rect x="${X(8.6)}" y="${Y(3.65)}" width="${X(10.25) - X(8.6)}" height="${Y(2.45) - Y(3.65)}" fill="none" stroke="${C.gold}" stroke-width="1.8"/>` + txt(X(9.42), Y(2.45) + 20, 'target', { anchor: 'middle' });
    s += `<path d="${poly(up.concat(lo.slice().reverse()))}Z" fill="${C.blue}" opacity=".15"/>` + path(poly(up), { stroke: C.blue, w: 1.6 }) + path(poly(lo), { stroke: C.blue, w: 1.6 });
    s += `<line id="stt-sec" stroke="${C.blue}" stroke-width="7" stroke-linecap="round" opacity=".55"/>`;
    s += txt(X(0.15), Y(3.1), 'tube Γ(t)', { fill: C.blue });
    s += axes(X(0), Y(0), X(10.6), Y(5.85), 't', 'p');
    s += path(poly(tr), { stroke: C.navy, w: 2.8, prog: 1, id: 'stt-tr' });
    s += `<line id="stt-cur" y1="${Y(0)}" y2="${Y(5.6)}" stroke="${C.gold}" stroke-width="1.4" stroke-dasharray="4 4"/>`;
    s += dot('stt-dot', 7, C.navy, 'stroke="#fff" stroke-width="2"');
    put('fig-stt-t', svg(760, 420, s));

    const S = 62, O = [190, 205], P = (x, y) => [O[0] + S * x, O[1] - S * y];
    const ee = cr([[1.55, 1.45], [1.95, .55], [1.7, -.55], [1.05, -1.4]], 40);
    let w = `<defs><pattern id="hatch2" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${C.mid}" stroke-width="1.2"/></pattern></defs>`;
    w += `<path d="M${O[0] - 2.6 * S},${O[1]} a${2.6 * S},${2.6 * S} 0 1,0 ${5.2 * S},0 a${2.6 * S},${2.6 * S} 0 1,0 ${-5.2 * S},0 Z M${O[0] - 2.38 * S},${O[1]} a${2.38 * S},${2.38 * S} 0 1,1 ${4.76 * S},0 a${2.38 * S},${2.38 * S} 0 1,1 ${-4.76 * S},0 Z" fill="url(#hatch2)" fill-rule="evenodd" stroke="${C.mid}" stroke-width="1"/>`;
    w += `<circle cx="${O[0]}" cy="${O[1]}" r="${0.42 * S}" fill="url(#hatch2)" stroke="${C.mid}" stroke-width="1"/>`;
    const eeS = ee.map(p => P(p[0], p[1]));
    w += path(poly(eeS), { stroke: C.blue, w: 26, op: .18 }) + path(poly(eeS), { stroke: C.navy, w: 1.6, dash: '6 5' });
    w += path('', { stroke: C.gold, w: 2.2, id: 'ws-trace' });
    w += `<rect x="${eeS[eeS.length - 1][0] - 9}" y="${eeS[eeS.length - 1][1] - 9}" width="18" height="18" fill="none" stroke="${C.gold}" stroke-width="1.8"/>`;
    w += `<circle id="ws-obs" r="${0.25 * S}" fill="${C.red}" opacity=".55"/>`;
    w += `<polyline id="ws-arm" points="" fill="none" stroke="${C.navy}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
    w += `<circle cx="${O[0]}" cy="${O[1]}" r="8" fill="#fff" stroke="${C.navy}" stroke-width="2.5"/><circle id="ws-elb" r="6" fill="#fff" stroke="${C.navy}" stroke-width="2.5"/>`;
    w += txt(O[0], 395, 'hatched: singular configurations (arm stretched / folded)', { anchor: 'middle', size: 15 });
    put('fig-stt-w', svg(380, 410, w));

    const L1 = 1.375, L2 = 1.2;
    const lerp = (A, x) => { // linear interp on sampled CR control arrays (x in t units)
      for (let i = 1; i < A.length; i++) if (x <= A[i][0]) { const a = (x - A[i - 1][0]) / (A[i][0] - A[i - 1][0]); return A[i - 1][1] + a * (A[i][1] - A[i - 1][1]); }
      return A[A.length - 1][1];
    };
    const upT = cr(upP), loT = cr(loP);
    reg('fig-stt-t', 9000, u => {
      const s1 = clamp(u / 0.88), pt = at(tr, s1), t = s1 * 10;
      setP('stt-tr', s1); setXY('stt-dot', pt);
      const cur = $('stt-cur'); cur.setAttribute('x1', f(pt[0])); cur.setAttribute('x2', f(pt[0]));
      const sec = $('stt-sec'); sec.setAttribute('x1', f(pt[0])); sec.setAttribute('x2', f(pt[0])); sec.setAttribute('y1', f(Y(lerp(upT, t)))); sec.setAttribute('y2', f(Y(lerp(loT, t))));
      const ob = $('stt-ob');
      if (t >= 1.5 && t <= 7.2) { ob.setAttribute('opacity', .85); ob.setAttribute('x1', f(X(t))); ob.setAttribute('x2', f(X(t))); ob.setAttribute('y1', f(Y(0.5 + 0.45 * (t - 1.5) / 0.75 * 0.75 / 1))); ob.setAttribute('y2', f(Y(1.6 + 0.45 * (t - 1.5)))); ob.setAttribute('y1', f(Y(0.5 + 0.45 * (t - 1.5)))); }
      else ob.setAttribute('opacity', 0);
      // arm: inverse kinematics (elbow-up) along the end-effector path
      const e = at(ee, s1), r2 = e[0] * e[0] + e[1] * e[1];
      const c2 = clamp((r2 - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1), q2 = -Math.acos(c2);
      const q1 = Math.atan2(e[1], e[0]) - Math.atan2(L2 * Math.sin(q2), L1 + L2 * Math.cos(q2));
      const pts = [O, P(L1 * Math.cos(q1), L1 * Math.sin(q1)), P(e[0], e[1])];
      $('ws-arm').setAttribute('points', pts.map(p => f(p[0]) + ',' + f(p[1])).join(' '));
      setXY('ws-elb', pts[1]);
      $('ws-trace').setAttribute('d', poly(eeS.slice(0, Math.max(2, Math.round(s1 * (eeS.length - 1)) + 1))));
      setXY('ws-obs', P(2.62, -1.2 + 2.6 * s1));
    });
  })();

  // ================= fit: flowing links (CSS loop) =================
  (function fit() {
    const L = [['Fixed-time adaptation', 'certified convergence from initial excitation', 70],
               ['Safety by construction', 'tubes, funnels, tube MPC, invariance', 190],
               ['Observers and sliding modes', 'unknown-input observers, contraction, fixed-time SMC', 310]];
    const R = [['Intelligent manufacturing and robotics', 40], ['Unmanned and aerial systems', 120], ['Smart mobility and logistics', 200],
               ['Robust and sliding-mode control', 280], ['Fault-tolerant control and decision-making', 360]];
    const links = [[0, 0], [0, 1], [1, 0], [1, 1], [1, 2], [2, 3], [2, 4], [2, 0]];
    const xl = 520, xr = 760; let s = '';
    s += txt(xl, 14, 'WHAT I BRING', { anchor: 'end', size: 14, weight: 700 }) + txt(xr + 14, 14, 'CIE RESEARCH THEMES', { size: 14, weight: 700 });
    links.forEach(([a, b]) => { const y1 = L[a][2], y2 = R[b][1], d = `M${xl + 10},${y1} C${xl + 130},${y1} ${xr - 130},${y2} ${xr},${y2}`;
      s += path(d, { stroke: C.line, w: 1.4 }) + path(d, { stroke: C.gold, w: 1.8, dash: '10 22', cls: 'flow' }); });
    L.forEach(([a, b, y]) => { s += txt(xl, y - 4, a, { anchor: 'end', fill: C.navy, size: 21, weight: 600 }) + txt(xl, y + 20, b, { anchor: 'end', size: 16 }) + `<circle cx="${xl + 10}" cy="${y}" r="4" fill="${C.gold}"/>`; });
    R.forEach(([a, y]) => { s += `<circle cx="${xr}" cy="${y}" r="4" fill="${C.navy}"/>` + txt(xr + 14, y + 6, a, { fill: C.ink, size: 20 }); });
    put('fig-fit', svg(1180, 390, s));
  })();

  // ================= backup A: three Lyapunov functions racing to zero =================
  (function stab() {
    const X = t => 70 + t * 250, Y = V => 330 - (Math.log10(Math.max(V, 1e-3)) + 3) * (300 / 5.95);
    const clip = V => (V <= 1e-3 ? 1e-3 : V);
    const fin = t => Math.max(0, Math.sqrt(5) - t) ** 2, fx = (w0) => t => Math.max(0, Math.tan(Math.atan(w0) - t)) ** 2;
    const ex = t => 5 * Math.exp(-4 * t);
    let s = axes(X(0), Y(1e-3), X(2.6), Y(900), 't', 'V(t)');
    [1e-2, 1, 1e2].forEach(v => { s += txt(X(0) - 8, Y(v) + 5, v === 1 ? '1' : v === 1e2 ? '10²' : '10⁻²', { anchor: 'end', size: 14 }) + path(`M${X(0) - 4},${Y(v)} L${X(0)},${Y(v)}`, { stroke: C.mid, w: 1 }); });
    const P = { ex: fnPts(t => clip(ex(t)), 0, 2.5, 300, X, Y), fi: fnPts(t => clip(fin(t)), 0, 2.5, 300, X, Y),
                f5: fnPts(t => clip(fx(Math.sqrt(5))(t)), 0, 2.5, 300, X, Y), f500: fnPts(t => clip(fx(Math.sqrt(500))(t)), 0, 2.5, 300, X, Y) };
    s += path(poly(P.ex), { stroke: C.mid, w: 2.4, prog: 1, id: 'sb-ex' }) + path(poly(P.fi), { stroke: C.gold, w: 2.4, prog: 1, id: 'sb-fi' });
    s += path(poly(P.f5), { stroke: C.navy, w: 2.6, prog: 1, id: 'sb-f5' }) + path(poly(P.f500), { stroke: C.navy, w: 2, dash: '7 5', op: .7 });
    s += dot('sb-dex', 5, C.mid) + dot('sb-dfi', 5, C.gold) + dot('sb-df5', 5.5, C.navy) + dot('sb-d500', 5, C.navy);
    s += path(`M${X(Math.PI / 2)},${Y(1e-3)} L${X(Math.PI / 2)},${Y(900)}`, { stroke: C.red, w: 1.4, dash: '3 4' })
      + `<text x="${X(Math.PI / 2) + 8}" y="${Y(1e-2)}" font-size="15" fill="${C.red}"><tspan font-style="italic">T</tspan><tspan font-size="10" dy="4">max</tspan><tspan dy="-4"> = π/2</tspan></text>`;
    s += txt(X(2.55), Y(200), 'exponential', { anchor: 'end', size: 15 }) + txt(X(2.55), Y(40), 'finite-time', { anchor: 'end', fill: C.gold, size: 15 }) + txt(X(2.55), Y(8), 'fixed-time', { anchor: 'end', fill: C.navy, size: 15 });
    put('fig-stab', svg(760, 370, s));
    reg('fig-stab', 6000, u => {
      const s1 = clamp(u / 0.85);
      setP('sb-ex', s1); setP('sb-fi', s1); setP('sb-f5', s1);
      setXY('sb-dex', at(P.ex, s1)); setXY('sb-dfi', at(P.fi, s1)); setXY('sb-df5', at(P.f5, s1)); setXY('sb-d500', at(P.f500, s1));
    });
  })();

  // ---------- run loops for the figures on the visible slide ----------
  let raf = null, active = [], t0 = 0;
  function frame(ts) {
    active.forEach(fg => { try { fg.tick(((ts - t0) % fg.period) / fg.period); } catch (e) { /* keep running */ } });
    raf = requestAnimationFrame(frame);
  }
  function onSlide(ev) {
    const cur = ev.currentSlide;
    if (raf) cancelAnimationFrame(raf); raf = null;
    active = figs.filter(fg => cur && cur.contains(document.getElementById(fg.host)));
    if (STATIC) { active.forEach(fg => fg.tick(0.999)); }
    else if (active.length) { t0 = performance.now(); raf = requestAnimationFrame(frame); }
    document.body.classList.toggle('hide-footer', !!(cur && cur.hasAttribute('data-nofooter')));
  }
  // initial state: draw every figure fully so nothing is blank before its slide is shown
  figs.forEach(fg => { try { fg.tick(0.999); } catch (e) {} });
  window.__figuresReady = (deck) => { deck.on('ready', onSlide); deck.on('slidechanged', onSlide); };
})();
