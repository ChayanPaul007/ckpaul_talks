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
  // time-uniform point (index-based, interpolated) and the matching arc-length fraction,
  // so a pathLength=1 stroke revealed to arcAt(pts,u) ends exactly at at(pts,u)
  const ALEN = new WeakMap();
  const cum = (pts) => { let L = ALEN.get(pts); if (!L) { L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); ALEN.set(pts, L); } return L; };
  const idx = (pts, u) => { const x = Math.max(0, Math.min(1, u)) * (pts.length - 1), i = Math.min(Math.floor(x), pts.length - 2); return [i, x - i]; };
  const at = (pts, u) => { const [i, r] = idx(pts, u); return [pts[i][0] + r * (pts[i + 1][0] - pts[i][0]), pts[i][1] + r * (pts[i + 1][1] - pts[i][1])]; };
  const arcAt = (pts, u) => { const L = cum(pts), [i, r] = idx(pts, u); return (L[i] + r * (L[i + 1] - L[i])) / L[L.length - 1]; };
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
      const s1 = ease(clamp(u / 0.8)); setP('ti-tr', arcAt(tr, s1)); setXY('ti-dot', at(tr, s1));
      const o1 = $('ti-o1'), o2 = $('ti-o2');
      if (o1) o1.setAttribute('cx', f(300 + 140 * u)); if (o2) o2.setAttribute('cx', f(560 - 120 * u));
    });
  })();

  // ================= impedance intuition: the same human push, stiff vs compliant robot =================
  (function imp() {
    // the hand moves into the robot by h(t); contact force = kh (h - e). A stiff position loop keeps e = 0,
    // an impedance loop lets e obey M e'' + D e' + K e = f, so the robot yields and comes back.
    const N = 400, kh = 9, M = 1, D = 4.2, K = 6, h = t => 0.9 * Math.exp(-(((t - 3.2) / 0.9) ** 2));
    const E = [0], Fs = [], Fc = [];
    let e = 0, v = 0, dt = 8 / N;
    for (let i = 0; i <= N; i++) {
      const t = i * dt, fc = kh * Math.max(0, h(t) - e);
      Fs.push(kh * h(t)); Fc.push(fc); E[i] = e;
      const a = (fc - D * v - K * e) / M; v += a * dt; e += v * dt;
    }
    const X = u => 60 + u * 540, lane = [100, 285], S = 95;
    let s = '';
    const row = (k, title, sub) => {
      const y = lane[k];
      return txt(0, y - 62, title, { fill: C.navy, size: 22, weight: 600 }) + txt(0, y - 38, sub, { size: 17 })
        + path(`M${X(0)},${y} L${X(1)},${y}`, { stroke: C.mid, w: 1.4, dash: '6 6' })
        + path('', { stroke: k ? C.navy : C.gray, w: 2.6, id: `im-tr${k}` })
        + (k ? path('', { stroke: C.gold, w: 2, id: 'im-spr' }) : '')
        + `<g id="im-hand${k}">${path('M0,0 L0,-30', { stroke: C.gold, w: 3 })}<path d="M0,0 l-7,-12 h14 z" fill="${C.gold}"/><circle cy="-38" r="9" fill="none" stroke="${C.gold}" stroke-width="2"/></g>`
        + dot(`im-ee${k}`, 9, k ? C.navy : C.gray, 'stroke="#fff" stroke-width="2.5"')
        + `<rect x="640" y="${y - 50}" width="22" height="80" fill="${C.panel}" stroke="${C.line}"/><rect id="im-bar${k}" x="640" width="22" fill="${k ? C.navy : C.red}"/>`
        + txt(651, y + 50, 'force', { anchor: 'middle', size: 14 });
    };
    s += row(0, 'Stiff position control', 'robot holds the path: the push meets a wall') + row(1, 'Impedance control', 'robot behaves like a spring–damper: yields, then returns');
    s += txt(X(1), lane[0] + 22, 'desired path', { anchor: 'end', size: 14 });
    put('fig-imp', svg(700, 390, s));
    reg('fig-imp', 7000, u => {
      const i = Math.min(N, Math.round(clamp(u / 0.92) * N)), t = i * dt, x = X(i / N);
      [0, 1].forEach(k => {
        const y = lane[k], dy = k ? E[i] * S : 0;
        const pts = []; for (let j = 0; j <= i; j += 4) pts.push([X(j / N), y + (k ? E[j] * S : 0)]); pts.push([x, y + dy]);
        $(`im-tr${k}`).setAttribute('d', poly(pts)); setXY(`im-ee${k}`, [x, y + dy]);
        // the hand comes down from above and presses on the end effector while h(t) > 0
        const g = $(`im-hand${k}`); g.setAttribute('transform', `translate(${f(x)},${f(y + dy - 11 - 36 * (1 - h(t) / 0.9))})`); g.setAttribute('opacity', h(t) > .05 ? 1 : 0);
        const F = (k ? Fc[i] : Fs[i]) / kh, bh = 80 * clamp(F / 0.9);
        const b = $(`im-bar${k}`); b.setAttribute('y', f(y + 30 - bh)); b.setAttribute('height', f(bh));
      });
      const sp = []; const y1 = lane[1], y2 = lane[1] + E[i] * S, n = 8;
      for (let j = 0; j <= n; j++) sp.push([x + (j % 2 ? 8 : -8) * (j > 0 && j < n), y1 + (y2 - y1) * j / n]);
      $('im-spr').setAttribute('d', poly(sp)); $('im-spr').setAttribute('opacity', Math.abs(y2 - y1) > 4 ? 1 : 0);
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
      const s1 = clamp(u / 0.85); setP('ie-sig', arcAt(ie, s1)); setXY('ie-dot', at(ie, s1));
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
      setP('rs-n', arcAt(naive, sN)); setP('rs-s', arcAt(shaped, s1));
      const pn = at(naive, sN); setXY('rs-nd', pn); $('rs-nd').setAttribute('fill', pn[1] < Y(3.2) ? C.red : C.mid);
      setXY('rs-sd', at(shaped, s1));
      $('rs-nl').setAttribute('opacity', sN > .85 ? 1 : 0);
      $('rs-sw').setAttribute('opacity', s1 > .45 ? 1 : 0);
      $('rs-sl').setAttribute('opacity', s1 > .75 ? 1 : 0);
      const L = 40 + 110 * (0.5 + 0.5 * Math.sin(2 * Math.PI * u * 2));
      $('rs-f').setAttribute('d', `M0,0 L${f(L)},0`); $('rs-fh').setAttribute('transform', `translate(${f(L + 4)},0)`);
    });
  })();

  // ================= tube MPC: a robot writes on a wall; Y planned ahead inside a tube that shrinks at T_max =================
  (function tubempc() {
    const Tm = 4, H = 1.6;                                     // T_max and the MPC look-ahead (in t units)
    const ref = t => 1.9 + 1.5 * Math.sin(0.9 * t + 0.3);       // what the task asks for along Y
    const w = t => t < Tm ? 0.6 : 0.2 + 0.4 * Math.exp(-2.5 * (t - Tm));
    const smin = (a, b) => (a + b - Math.sqrt((a - b) ** 2 + 0.02)) / 2;
    const y = t => smin(ref(t), 3 - w(t) - 0.05);               // plan keeps the whole tube under the limit
    // --- scene: arm, wall (contact along X), hard limit on Y
    const Ys = v => 300 - v * 62, B = [120, 250], L = 255, WX = 606;
    let s = `<defs><pattern id="mp-h" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" stroke="${C.mid}" stroke-width="1.3"/></pattern></defs>`;
    s += `<rect x="${WX}" y="30" width="34" height="276" fill="url(#mp-h)" stroke="${C.mid}"/>` + txt(WX + 17, 22, 'wall', { anchor: 'middle', size: 16 });
    s += path(`M${B[0]},${Ys(3)} L${WX},${Ys(3)}`, { stroke: C.red, w: 1.8, dash: '8 6' }) + txt(B[0], Ys(3) - 10, 'hard limit on Y', { fill: C.red, size: 16 });
    s += txt(WX - 10, 300, 'X: soft contact (fixed-time impedance)', { anchor: 'end', size: 16, fill: C.navy });
    s += `<polyline id="mp-arm" fill="none" stroke="${C.navy}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<rect id="mp-sec" x="${WX - 30}" width="24" rx="12" fill="${C.blue}" opacity=".35" stroke="${C.blue}" stroke-width="1.5"/>`
      + txt(WX - 40, 0, 'tube', { id: 'mp-tl', anchor: 'end', size: 15, fill: C.blue });
    s += `<rect x="${B[0] - 26}" y="${B[1]}" width="52" height="14" fill="${C.navy}"/><circle cx="${B[0]}" cy="${B[1]}" r="9" fill="#fff" stroke="${C.navy}" stroke-width="3"/><circle id="mp-elb" r="7" fill="#fff" stroke="${C.navy}" stroke-width="3"/>`;
    s += dot('mp-tip', 7, C.gold, 'stroke="#fff" stroke-width="2"') + `<path id="mp-f" fill="${C.gold}"/>`;
    s += txt(300, 22, '', { id: 'mp-st', anchor: 'middle', size: 17, fill: C.navy, weight: 600 });
    // --- chart: Y over time with the look-ahead
    const X = t => 40 + t * 66, Y = v => 610 - v * 52;
    let g = axes(X(0), Y(0), X(10.6), Y(4.1), 't', 'Y');
    g += path(`M${X(0)},${Y(3)} L${X(10.3)},${Y(3)}`, { stroke: C.red, w: 1.8 });
    g += path(poly(fnPts(ref, 0, 10.2, 200, X, Y)), { stroke: C.mid, w: 1.4, dash: '3 5' }) + txt(X(10.3), Y(3) - 10, 'task asks for more than is safe', { anchor: 'end', size: 15, fill: C.gray });
    g += `<path id="mp-band" fill="${C.blue}" opacity=".18"/><path id="mp-pband" fill="${C.blue}" opacity=".10"/>`;
    g += path('', { stroke: C.navy, w: 2.6, id: 'mp-traj' }) + path('', { stroke: C.navy, w: 2, dash: '6 5', id: 'mp-pred' });
    g += `<line id="mp-cur" y1="${Y(0)}" y2="${Y(4)}" stroke="${C.gold}" stroke-width="1.4" stroke-dasharray="4 4"/>` + dot('mp-dot', 6.5, C.navy, 'stroke="#fff" stroke-width="2"');
    g += path(`M${X(Tm)},${Y(0)} L${X(Tm)},${Y(3)}`, { stroke: C.gold, w: 1.4, dash: '3 4' }) + `<text x="${X(Tm)}" y="${Y(0) + 24}" font-size="17" fill="${C.gold}" text-anchor="middle"><tspan font-style="italic">T</tspan><tspan font-size="11" dy="4">max</tspan></text>`;
    g += txt(X(0) + 20, Y(4.1) - 14, 'Y over time · solid: done · dashed: MPC look-ahead · band: tube', { size: 15 });
    put('fig-tubempc', svg(760, 650, s + g));
    reg('fig-tubempc', 9000, u => {
      const T = 10.2 * clamp(u / 0.88), n = Math.max(2, Math.round(T * 12));
      const up = [], lo = [], tr = [];
      for (let k = 0; k <= n; k++) { const t = T * k / n; up.push([X(t), Y(y(t) + w(t))]); lo.push([X(t), Y(y(t) - w(t))]); tr.push([X(t), Y(y(t))]); }
      $('mp-band').setAttribute('d', poly(up.concat(lo.reverse())) + 'Z'); $('mp-traj').setAttribute('d', poly(tr));
      const T2 = Math.min(T + H, 10.3), pu = [], pl = [], pr = [];
      for (let k = 0; k <= 20; k++) { const t = T + (T2 - T) * k / 20; pu.push([X(t), Y(y(t) + w(t))]); pl.push([X(t), Y(y(t) - w(t))]); pr.push([X(t), Y(y(t))]); }
      $('mp-pband').setAttribute('d', poly(pu.concat(pl.reverse())) + 'Z'); $('mp-pred').setAttribute('d', poly(pr));
      setXY('mp-dot', [X(T), Y(y(T))]); const c = $('mp-cur'); c.setAttribute('x1', f(X(T))); c.setAttribute('x2', f(X(T)));
      // scene, in sync: the tip writes along the wall; the tube section around it is the same tube
      const tip = [WX - 8, Ys(y(T))], dx = tip[0] - B[0], dy = tip[1] - B[1], d = Math.min(Math.hypot(dx, dy), 2 * L - 1);
      const q = Math.atan2(dy, dx) - Math.acos(d / (2 * L)), el = [B[0] + L * Math.cos(q), B[1] + L * Math.sin(q)];
      $('mp-arm').setAttribute('points', [B, el, tip].map(p => f(p[0]) + ',' + f(p[1])).join(' ')); setXY('mp-elb', el); setXY('mp-tip', tip);
      const sec = $('mp-sec'); sec.setAttribute('y', f(Ys(y(T) + w(T)))); sec.setAttribute('height', f(Ys(y(T) - w(T)) - Ys(y(T) + w(T))));
      const fl = 18 + 8 * Math.sin(5 * T);
      $('mp-f').setAttribute('d', `M${f(tip[0] - 14 - fl)},${f(tip[1] + 24)} h${f(fl)} v-5 l12,8 l-12,8 v-5 h${f(-fl)} z`);
      const tl = $('mp-tl'); tl.setAttribute('x', f(WX - 36)); tl.setAttribute('y', f(Ys(y(T) + w(T)) - 6));
      $('mp-st').textContent = T < Tm ? 'Learning the parameters: wide tube, keep a margin' : 'Parameters learned at T_max: tube shrinks, more room';
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
      const s1 = clamp(u / 0.85); setP('fu-e', arcAt(ep, s1)); const p = at(ep, s1); setXY('fu-d', p);
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
      setP('stt-tr', arcAt(tr, s1)); setXY('stt-dot', pt);
      const cur = $('stt-cur'); cur.setAttribute('x1', f(pt[0])); cur.setAttribute('x2', f(pt[0]));
      const sec = $('stt-sec'); sec.setAttribute('x1', f(pt[0])); sec.setAttribute('x2', f(pt[0])); sec.setAttribute('y1', f(Y(lerp(upT, t)))); sec.setAttribute('y2', f(Y(lerp(loT, t))));
      const ob = $('stt-ob');
      if (t >= 1.5 && t <= 7.2) { ob.setAttribute('opacity', .85); ob.setAttribute('x1', f(X(t))); ob.setAttribute('x2', f(X(t))); ob.setAttribute('y2', f(Y(1.6 + 0.45 * (t - 1.5)))); ob.setAttribute('y1', f(Y(0.5 + 0.45 * (t - 1.5)))); }
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

  // ================= plan A: a person and two mobile arms carry one object, inside a tube =================
  (function team() {
    const ctrl = [[120, 205], [240, 222], [370, 176], [500, 132], [585, 122]];
    const P = cr(ctrl, 30), obs = [372, 92, 30];
    const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
    const half = s => 30 - 14 * s;                                   // tube half-width shrinks once the load is learned
    let s = `<defs><pattern id="tm-h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${C.red}" stroke-width="1.2"/></pattern></defs>`;
    const up = [], lo = [];
    P.forEach((p, i) => { const t = nrm(P[Math.max(0, i - 1)], P[Math.min(P.length - 1, i + 1)]), h = half(i / (P.length - 1)); up.push([p[0] - t[1] * h, p[1] + t[0] * h]); lo.push([p[0] + t[1] * h, p[1] - t[0] * h]); });
    s += `<path d="${poly(up.concat(lo.slice().reverse()))}Z" fill="${C.blue}" opacity=".14"/>` + path(poly(up), { stroke: C.blue, w: 1.3 }) + path(poly(lo), { stroke: C.blue, w: 1.3 });
    s += `<circle cx="${obs[0]}" cy="${obs[1]}" r="${obs[2]}" fill="url(#tm-h)" stroke="${C.red}" stroke-width="1.5"/>` + txt(obs[0] + 38, obs[1] + 5, 'obstacle', { fill: C.red, size: 15 });
    s += `<rect x="${P[P.length - 1][0] - 30}" y="${P[P.length - 1][1] - 30}" width="60" height="60" fill="none" stroke="${C.gold}" stroke-width="1.8" stroke-dasharray="5 4"/>` + txt(P[P.length - 1][0], P[P.length - 1][1] - 38, 'goal', { anchor: 'middle', size: 15 });
    s += `<line id="tm-bar" stroke="${C.ink}" stroke-width="12" stroke-linecap="round" opacity=".8"/>`;
    for (let k = 0; k < 2; k++) s += `<polyline id="tm-arm${k}" fill="none" stroke="${C.navy}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`
      + `<g id="tm-base${k}"><rect x="-26" y="-12" width="52" height="24" rx="5" fill="${C.navy}"/><circle cx="-15" cy="13" r="5" fill="${C.ink}"/><circle cx="15" cy="13" r="5" fill="${C.ink}"/></g>`;
    s += `<g id="tm-hum"><circle r="13" fill="#fff" stroke="${C.gold}" stroke-width="3"/><circle cy="-22" r="8" fill="${C.gold}"/></g><path id="tm-push" fill="${C.gold}"/>`;
    s += txt(10, 22, '', { id: 'tm-st', size: 16, fill: C.navy, weight: 600 });
    s += txt(10, 292, 'human leads · arms yield, but stay inside the tube', { size: 15 });
    put('fig-team', svg(700, 300, s));
    reg('fig-team', 9000, u => {
      const sp = clamp(u / 0.9), i = Math.min(P.length - 2, Math.floor(sp * (P.length - 1))), c0 = at(P, sp);
      const t = nrm(P[i], P[i + 1]), push = 16 * Math.exp(-(((sp - 0.42) / 0.07) ** 2));        // the human's push, absorbed inside the tube
      const c = [c0[0] - t[1] * push, c0[1] + t[0] * push];
      const end = k => [c[0] + t[0] * k, c[1] + t[1] * k];
      const a = end(-85), b = end(85); const bar = $('tm-bar');
      bar.setAttribute('x1', f(a[0])); bar.setAttribute('y1', f(a[1])); bar.setAttribute('x2', f(b[0])); bar.setAttribute('y2', f(b[1]));
      const hp = end(-104); $('tm-hum').setAttribute('transform', `translate(${f(hp[0])},${f(hp[1])})`);
      $('tm-push').setAttribute('d', push > 2 ? `M${f(hp[0] - 6)},${f(hp[1] + 18)} l0,${f(-push - 6)} l-6,8 m6,-8 l6,8` : '');
      $('tm-push').setAttribute('stroke', C.gold); $('tm-push').setAttribute('stroke-width', 3); $('tm-push').setAttribute('fill', 'none');
      [-5, 70].forEach((off, k) => {
        const g = end(off), base = [g[0] - 22, 270], L = 95, dx = g[0] - base[0], dy = g[1] - base[1], d = Math.min(Math.hypot(dx, dy), 2 * L - 1);
        const q = Math.atan2(dy, dx) - Math.acos(d / (2 * L)), el = [base[0] + L * Math.cos(q), base[1] + L * Math.sin(q)];
        $(`tm-arm${k}`).setAttribute('points', [base, el, g].map(p => f(p[0]) + ',' + f(p[1])).join(' '));
        $(`tm-base${k}`).setAttribute('transform', `translate(${f(base[0])},${f(base[1] + 10)})`);
      });
      $('tm-st').textContent = sp < 0.3 ? 'Load: learning its mass (fixed time)…' : 'Load learned · tube shrinks';
    });
  })();

  // ================= plan B: an aerial swarm through a gap, every drone in its own tube =================
  (function swarm() {
    const off = [[0, 0], [-1, -0.9], [-1, 0.9], [-2, -1.8], [-2, 1.8]];          // V formation
    const r = s => 34 - 20 * Math.exp(-(((s - 0.5) / 0.13) ** 2));                 // squeeze through the gap
    const pos = (k, s) => [90 + 520 * s + off[k][0] * r(s), 150 + off[k][1] * r(s)];
    let s = `<defs><pattern id="sw-h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${C.red}" stroke-width="1.2"/></pattern></defs>`;
    s += `<rect x="330" y="20" width="40" height="88" fill="url(#sw-h)" stroke="${C.red}" stroke-width="1.5"/><rect x="330" y="192" width="40" height="88" fill="url(#sw-h)" stroke="${C.red}" stroke-width="1.5"/>`;
    s += `<rect x="590" y="96" width="96" height="108" fill="none" stroke="${C.gold}" stroke-width="1.8" stroke-dasharray="5 4"/>` + txt(638, 90, 'target by T', { anchor: 'middle', size: 15 });
    for (let k = 0; k < off.length; k++) {
      const pts = []; for (let i = 0; i <= 80; i++) pts.push(pos(k, i / 80 * 0.92));
      s += path(poly(pts), { stroke: C.blue, w: 13, op: .16 }) + path(poly(pts), { stroke: C.blue, w: 1, op: .5, dash: '3 5' });
      s += `<g id="sw-d${k}">${[[-8, -8], [8, -8], [-8, 8], [8, 8]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="none" stroke="${k ? C.navy : C.gold}" stroke-width="1.8"/>`).join('')}`
        + `<path d="M-8,-8 L8,8 M8,-8 L-8,8" stroke="${k ? C.navy : C.gold}" stroke-width="2.4"/></g>`;
    }
    s += txt(10, 22, 'Each drone flies inside its own tube', { size: 16, fill: C.navy, weight: 600 });
    s += txt(10, 292, 'tubes never overlap → no collisions, target reached on time', { size: 15 });
    put('fig-swarm', svg(700, 300, s));
    reg('fig-swarm', 8000, u => {
      const sp = clamp(u / 0.9) * 0.92;
      off.forEach((_, k) => { const p = pos(k, sp); $(`sw-d${k}`).setAttribute('transform', `translate(${f(p[0])},${f(p[1])})`); });
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
      setP('sb-ex', arcAt(P.ex, s1)); setP('sb-fi', arcAt(P.fi, s1)); setP('sb-f5', arcAt(P.f5, s1));
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
