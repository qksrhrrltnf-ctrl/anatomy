// Live layer of the seismic tower. M (model.mjs) and the kit (iso, holdStill) are inlined before this.
const D = __DATA__;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg.iso-svg");
const world = svg.querySelector(".st-world");
const els = [...world.querySelectorAll(":scope > g.it[data-i]")];
const hangerGroups = [...world.querySelectorAll("[data-hangers]")].map((g) => ({ ids: g.getAttribute("data-hangers").split(" ").map(Number), lines: g.querySelectorAll("path"), dots: g.querySelectorAll("circle") }));
const readout = document.querySelector("[data-readout]");
const chartBox = stage.querySelector("[data-chart]");
const chartSvg = chartBox.querySelector("svg");
const chartBody = chartSvg.querySelector("[data-chart-body]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const S = { N: 10, f: 0.8, zeta: 0.02, iso: false, tmd: false };
let sys = M.systemOf(S);
let res = M.responseOf(sys, S.f);
let X = { re: res.X.re, im: res.X.im };
let REL = { re: res.rel.re, im: res.rel.im };
let phase = 0, last = 0, frame = 0, visible = false, touring = false, tourClock = 0, sweeping = false, sweepClock = 0;
let edu = null;
const AG = 1.6; // drawing: ground shake amplitude (world units, not to scale)
const SWEEP_TIME = 16; // s for 0.2 → 5 Hz

// ---------- shear and translate per item ----------
// A story's columns and braces shear: a point at height z above the story's floor moves along x by
// ub + kappa·z. On the vertical plane through the item that is an exact affine map of the screen.
const ax = D.ax;
const qOf = (Sd) => {
  const Sz = D.az;
  const det = Sd[0] * Sz[1] - Sz[0] * Sd[1];
  return [-Sd[1] / det, Sd[0] / det];
};
const Q = { x: qOf(D.ax), y: qOf(D.ay) };
const f2 = (v) => Math.round(v * 100) / 100;
const f4 = (v) => Math.round(v * 10000) / 10000;
const translate = (u, dz = 0) => `translate(${f2(ax[0] * u + D.az[0] * dz)} ${f2(ax[1] * u + D.az[1] * dz)})`;
function shear(index, ub, kappa) {
  const q = Q[D.live[index].plane];
  const so = D.so[index];
  const qs = q[0] * so[0] + q[1] * so[1];
  const a = 1 + kappa * ax[0] * q[0];
  const b = kappa * ax[1] * q[0];
  const c = kappa * ax[0] * q[1];
  const d = 1 + kappa * ax[1] * q[1];
  const t = ub - kappa * qs;
  return `matrix(${f4(a)} ${f4(b)} ${f4(c)} ${f4(d)} ${f2(ax[0] * t)} ${f2(ax[1] * t)})`;
}
let shownN = -1;
function showStories() {
  if (shownN === S.N) return;
  shownN = S.N;
  els.forEach((el, index) => {
    if (D.live[index].story > S.N) el.setAttribute("display", "none");
    else el.removeAttribute("display");
  });
}
const soft = (x, limit) => limit * Math.tanh(x / limit);
const cmul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
// Displacements this instant, in world units along x: ground, bearings, frame drift at the roof, TMD stroke.
function pose(at) {
  const e = { re: Math.cos(at), im: Math.sin(at) };
  const scale = M.A_SCALE * S.N * D.STORY;
  const xg = AG * Math.sin(at);
  const drift = scale * cmul(X, e).im;
  const bear = sys.iso ? soft((drift * sys.Tb * sys.Tb) / (sys.Ts * sys.Ts), D.BEAR_MAX) : 0;
  const tmd = sys.tmd ? soft(scale * cmul(REL, e).im, D.TMD_STROKE) : 0;
  return { xg, drift, bear, tmd };
}
function draw(at) {
  const { xg, drift, bear, tmd } = pose(at);
  const U = (lv) => (lv < 0 ? xg : xg + bear + (drift * lv) / S.N);
  const dz = D.zLevel[S.N] - D.zLevel[D.NMAX];
  const roof = U(S.N);
  els.forEach((el, index) => {
    const L = D.live[index];
    if (L.story > S.N) return;
    let t;
    if (L.kind === "g") t = translate(xg);
    else if (L.kind === "lev") t = translate(U(L.lv));
    else if (L.kind === "sh") {
      const ub = U(L.lv0);
      t = shear(index, ub, (U(L.lv1) - ub) / L.h);
    } else if (L.kind === "ph") t = translate(roof, dz);
    else {
      t = translate(roof + tmd, dz);
      if (L.kind === "rod") holdStill(el, [f2(ax[0] * tmd), f2(ax[1] * tmd)]);
    }
    el.setAttribute("transform", t);
  });
  // hangers: from the roof frame to the swinging sphere
  const shift = (p, u) => {
    const s = iso(p, D.P);
    return [s[0] + ax[0] * u + D.az[0] * dz, s[1] + ax[1] * u + D.az[1] * dz];
  };
  for (const group of hangerGroups) {
    group.ids.forEach((id, i) => {
      const { top, lug } = D.hangers[id];
      const a = shift(top, roof);
      const b = shift(lug, roof + tmd);
      group.lines[i].setAttribute("d", `M${f2(a[0])} ${f2(a[1])}L${f2(b[0])} ${f2(b[1])}`);
      group.dots[i * 2].setAttribute("cx", f2(a[0]));
      group.dots[i * 2].setAttribute("cy", f2(a[1]));
      group.dots[i * 2 + 1].setAttribute("cx", f2(b[0]));
      group.dots[i * 2 + 1].setAttribute("cy", f2(b[1]));
    });
  }
  return { xg, drift, bear, tmd };
}

// ---------- chart ----------
const CH = { x0: 36, x1: 250, y0: 16, y1: 138, top: 26 };
const fx = (f) => CH.x0 + ((CH.x1 - CH.x0) * Math.log(f / M.RANGE.f[0])) / Math.log(M.RANGE.f[1] / M.RANGE.f[0]);
const hy = (h) => CH.y1 - ((CH.y1 - CH.y0) * Math.min(h, CH.top + 1)) / CH.top;
const curvePath = (list) => list.map(([f, h], i) => `${i ? "L" : "M"}${f2(fx(f))} ${f2(hy(h))}`).join("");
let chartKey = "";
function drawChart() {
  const key = [S.N, S.zeta, S.iso, S.tmd].join();
  if (key !== chartKey) {
    chartKey = key;
    const ticksX = [0.2, 0.5, 1, 2, 5];
    const ticksY = [0, 5, 10, 15, 20, 25];
    const plain = S.iso || S.tmd ? M.curveOf(M.systemOf({ ...S, iso: false, tmd: false }), 300) : null;
    chartBody.innerHTML =
      `<defs><clipPath id="st-ch-clip"><rect x="${CH.x0}" y="${CH.y0 - 4}" width="${CH.x1 - CH.x0}" height="${CH.y1 - CH.y0 + 4}"/></clipPath></defs>` +
      `<rect class="st-ch-band" x="${f2(fx(1))}" y="${CH.y0}" width="${f2(fx(5) - fx(1))}" height="${CH.y1 - CH.y0}"/>` +
      ticksY.map((h) => `<line class="st-ch-grid" x1="${CH.x0}" x2="${CH.x1}" y1="${f2(hy(h))}" y2="${f2(hy(h))}"/><text class="st-ch-tick" x="${CH.x0 - 5}" y="${f2(hy(h) + 3)}" text-anchor="end">${h}</text>`).join("") +
      ticksX.map((f) => `<line class="st-ch-grid" x1="${f2(fx(f))}" x2="${f2(fx(f))}" y1="${CH.y0}" y2="${CH.y1}"/><text class="st-ch-tick" x="${f2(fx(f))}" y="${CH.y1 + 12}" text-anchor="middle">${f}</text>`).join("") +
      `<line class="st-ch-one" x1="${CH.x0}" x2="${CH.x1}" y1="${f2(hy(1))}" y2="${f2(hy(1))}"/>` +
      `<text class="st-ch-label" x="${CH.x0}" y="10">증폭률 H</text><text class="st-ch-label" x="${CH.x1}" y="${CH.y1 + 26}" text-anchor="end">땅의 진동수 f (Hz)</text>` +
      `<text class="st-ch-band-label" x="${f2((fx(1) + fx(5)) / 2)}" y="${CH.y0 + 11}" text-anchor="middle">흔한 지진동</text>` +
      `<g clip-path="url(#st-ch-clip)">${plain ? `<path class="st-ch-plain" d="${curvePath(plain)}"/>` : ""}<path class="st-ch-curve" d="${curvePath(M.curveOf(sys, 360))}"/></g>` +
      `<line class="st-ch-now" data-now-line x1="0" x2="0" y1="${CH.y0}" y2="${CH.y1}"/><circle class="st-ch-dot" data-now r="3.6"/><text class="st-ch-value" data-now-text x="0" y="0"></text>` +
      `<rect class="st-ch-frame" x="${CH.x0}" y="${CH.y0}" width="${CH.x1 - CH.x0}" height="${CH.y1 - CH.y0}"/>`;
  }
  const x = fx(S.f);
  const y = hy(res.H);
  const line = chartBody.querySelector("[data-now-line]");
  line.setAttribute("x1", f2(x));
  line.setAttribute("x2", f2(x));
  const dot = chartBody.querySelector("[data-now]");
  dot.setAttribute("cx", f2(x));
  dot.setAttribute("cy", f2(y));
  const label = chartBody.querySelector("[data-now-text]");
  const right = x < CH.x1 - 60;
  label.setAttribute("x", f2(right ? x + 7 : x - 7));
  label.setAttribute("text-anchor", right ? "start" : "end");
  label.setAttribute("y", f2(Math.max(CH.y0 + 24, Math.min(CH.y1 - 6, y - 7))));
  label.textContent = `${M.fmt.H(res.H)}배`;
}

// ---------- model and text ----------
const Hsay = (h) => `${M.fmt.H(h)}배`;
function refreshModel() {
  sys = M.systemOf(S);
  res = M.responseOf(sys, S.f);
  showStories();
  drawChart();
  status();
  const text = `${M.fmt.hz(S.f)} · 증폭률 ${Hsay(res.H)}`;
  if (readout.textContent !== text) readout.textContent = text;
  stage.toggleAttribute("data-iso", sys.iso);
  stage.toggleAttribute("data-tmd", sys.tmd);
}
function status() {
  if (!edu) return;
  const h = res.H;
  const near = Math.abs(res.r - 1) < 0.15;
  if (h >= 8) edu.status({ level: "danger", text: `공진입니다. 땅의 진동수가 건물의 고유진동수(${M.fmt.hz3(sys.fn)})와 거의 같아 흔들림이 ${Hsay(h)}로 불어났습니다.` });
  else if (h >= 2.5) edu.status({ level: "warn", text: `${near ? "공진 근처입니다" : "흔들림이 커집니다"} · 진동수비 ${res.r.toFixed(2)}, 증폭률 ${Hsay(h)}` });
  else if (h < 0.9) edu.status({ level: "ok", text: `건물이 땅의 흔들림을 따라가지 못해 덜 휩니다 · 진동수비 ${res.r.toFixed(2)}, 증폭률 ${Hsay(h)}` });
  else edu.status({ level: "info", text: `건물이 땅과 거의 함께 움직입니다 · 진동수비 ${res.r.toFixed(2)}, 증폭률 ${Hsay(h)}` });
}

// ---------- loop ----------
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (sweeping) {
    if (!sweepClock) sweepClock = now;
    const u = Math.min(1, (now - sweepClock) / 1000 / SWEEP_TIME);
    setF(M.RANGE.f[0] * Math.pow(M.RANGE.f[1] / M.RANGE.f[0], u), true);
    if (u >= 1) sweeping = false;
  } else if (touring && !calm) {
    if (!tourClock) tourClock = now;
    const u = 0.5 - 0.5 * Math.cos(((now - tourClock) / 1000 / 22) * 2 * Math.PI);
    setF(0.4 * Math.pow(2.6 / 0.4, u), true);
  }
  const k = calm ? 1 : 1 - Math.exp(-dt / 0.7);
  X = { re: X.re + (res.X.re - X.re) * k, im: X.im + (res.X.im - X.im) * k };
  REL = { re: REL.re + (res.rel.re - REL.re) * k, im: REL.im + (res.rel.im - REL.im) * k };
  // reduced motion: one still frame at the moment the roof is furthest out
  if (calm) phase = Math.PI / 2 - Math.atan2(X.im, X.re);
  else phase = (phase + 2 * Math.PI * S.f * dt) % (2 * Math.PI * 1000);
  draw(phase);
  frame = visible && !calm && !document.hidden ? requestAnimationFrame(tick) : 0;
}
const run = () => {
  if (still.matches) {
    last = 0;
    tick(performance.now());
    return;
  }
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};
let soon = 0;
function refreshSoon() {
  if (soon) return;
  soon = setTimeout(() => {
    soon = 0;
    edu?.refresh();
  }, 250);
}
function setF(f, fromFigure) {
  const v = Math.min(M.RANGE.f[1], Math.max(M.RANGE.f[0], f));
  S.f = Math.round(v * 100) / 100;
  refreshModel();
  if (fromFigure) {
    edu?.sync("f", v);
    refreshSoon();
  }
  if (!frame) run();
}
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);
still.addEventListener?.("change", run);
document.addEventListener("visibilitychange", run);

// ---------- direct manipulation: drag the chart, arrow keys on the figure ----------
function fFromChart(event) {
  const box = chartSvg.getBoundingClientRect();
  const vb = chartSvg.viewBox.baseVal;
  const x = ((event.clientX - box.left) / box.width) * vb.width;
  const u = Math.min(1, Math.max(0, (x - CH.x0) / (CH.x1 - CH.x0)));
  return M.RANGE.f[0] * Math.pow(M.RANGE.f[1] / M.RANGE.f[0], u);
}
let dragging = false;
chartSvg.addEventListener("pointerdown", (event) => {
  if (event.button > 0) return;
  edu?.takeOver();
  sweeping = false;
  dragging = true;
  chartSvg.setPointerCapture?.(event.pointerId);
  setF(fFromChart(event), true);
  event.preventDefault();
});
chartSvg.addEventListener("pointermove", (event) => {
  if (dragging) setF(fFromChart(event), true);
});
const endDrag = () => {
  if (!dragging) return;
  dragging = false;
  edu?.refresh();
};
chartSvg.addEventListener("pointerup", endDrag);
chartSvg.addEventListener("pointercancel", endDrag);
stage.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  edu?.takeOver();
  sweeping = false;
  const step = event.shiftKey ? 0.25 : 0.05;
  setF(Math.round((S.f + (event.key === "ArrowRight" ? step : -step)) * 100) / 100, true);
});

// ---------- teaching layer ----------
edu = EDU.mount({
  stage,
  root: svg,
  set(id, value) {
    if (id === "zeta") S.zeta = value / 100;
    else if (id === "f") S.f = value;
    else if (id === "N") S.N = value;
    else if (id === "iso" || id === "tmd") S[id] = Boolean(value);
    if (id !== "f") sweeping = false;
    refreshModel();
    run();
  },
  pose(p) {
    touring = false;
    sweeping = false;
    if (p.reset) phase = 0;
    run();
  },
  action(id) {
    if (id === "sweep") {
      touring = false;
      sweeping = true;
      sweepClock = 0;
      run();
    }
  },
  tour(on) {
    touring = on;
    tourClock = 0;
    if (on) sweeping = false;
    run();
  },
  values() {
    const r = res;
    const s = sys;
    const kkN = (v) => `${Math.round(v / 1000).toLocaleString("en-US")} kN/m`;
    return {
      N: { n: S.N, t: `${S.N}층` },
      Nn: { n: S.N, t: String(S.N) },
      f: { n: S.f, t: M.fmt.hz(S.f) },
      fs: { n: s.fs, t: M.fmt.hz3(s.fs) },
      Ts: { n: s.Ts, t: M.fmt.s(s.Ts) },
      fn: { n: s.fn, t: M.fmt.hz3(s.fn) },
      T: { n: s.T, t: M.fmt.s(s.T) },
      Tb: { n: M.T_BEARING, t: M.fmt.s(M.T_BEARING) },
      zb: { n: M.ZETA_BEARING, t: M.fmt.pct(M.ZETA_BEARING) },
      zeta: { n: S.zeta, t: M.fmt.pct(S.zeta) },
      zs: { n: s.zs, t: M.fmt.pct(s.zs) },
      r: { n: r.r, t: r.r.toFixed(2) },
      H: { n: r.H, t: Hsay(r.H) },
      Hbare: { n: r.bare, t: M.fmt.H(r.bare) },
      m: { n: s.m, t: M.fmt.t(s.m) },
      k: { n: s.k, t: kkN(s.k) },
      ks: { n: M.STORY_K, t: kkN(M.STORY_K) },
      md: { n: s.md, t: M.fmt.t(s.md) },
      fd: { n: s.fd, t: M.fmt.hz3(s.fd) },
      isoT: s.iso ? `T = √(T₀² + T받침²) = √(${s.Ts.toFixed(2)}² + ${s.Tb.toFixed(2)}²) = ${M.fmt.s(s.T)}, fₙ = ${M.fmt.hz3(s.fn)}` : `면진 끔 → T = T₀ = ${M.fmt.s(s.T)}, fₙ = ${M.fmt.hz3(s.fn)}`,
      tmdT: s.tmd ? `추 ${M.fmt.t(s.md)} · 진동수 ${M.fmt.hz3(s.fd)} · 감쇠비 ${M.fmt.pct(s.zd)} → H = ${Hsay(r.H)}` : `TMD 끔 → H = ${Hsay(r.H)}`,
      isoSay: s.iso ? `켬(받침이 주기를 ${M.fmt.s(s.T)}로 늘림)` : "끔",
      tmdSay: s.tmd ? `켬(추 ${M.fmt.t(s.md)})` : "끔",
    };
  },
});
refreshModel();
draw(phase);
edu?.refresh();
