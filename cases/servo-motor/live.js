
// ---- servo page script: the model (model.mjs) and the drawing helpers (shared.mjs) are inlined before this ----
const DATA = __DATA__;
const KIT = { ring, lineOnTop, extrude, solidSvg, lineSvg, segment, towardViewer, iso };
const Pk = DATA.P;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const DEG = Math.PI / 180;

// ---- elements ----
const hornEl = svg.querySelector("[data-horn]");
const drumTop = svg.querySelector("[data-drumtop]");
const targetEl = svg.querySelector("[data-target]");
const hangerEl = svg.querySelector("[data-hanger]");
const dropEl = svg.querySelector('[data-cord="drop"]');
const masses = [...svg.querySelectorAll("[data-mass]")];
const pulleyMarks = svg.querySelector("[data-pulley]");
const knobEl = svg.querySelector("[data-knob]");
const oledEl = svg.querySelector("[data-oled]");
let gearEls = {};
function findGears() {
  gearEls = {};
  for (const el of svg.querySelectorAll("[data-gear]")) {
    gearEls[el.getAttribute("data-gear")] = { el, rot: el.querySelector("[data-rot]"), side: el.querySelector("[data-side] path"), blur: el.querySelector("[data-blur]"), vis: 1, lastPhase: null, drawn: null };
  }
}
findGears();

// ---- state ----
const S = { pwm: DATA.def.pwm, kp: DATA.def.kp, gear: DATA.def.gear, load: DATA.def.load };
let p = plant(S);
let target = angleOf(S.pwm);
let st = { th: DATA.def.th, w: 0 };
let out = { volts: 0, tauHand: 0, motorTorque: 0 };
let hand = null; // { at, k, c } while a hand holds the pointer
let twistTimer = 0;
let frame = 0, last = 0, visible = false, touring = false, tourClock = 0;
let edu = null;
let run = { t0: 0, from: st.th, to: target, points: [], stats: null };
let ghost = null;
let runClock = 0;
let ticks = 0;

const train = () => DATA.trains[S.gear];
const teethText = () => GEARSETS[S.gear].teeth.join("×");

// ---- gear phases from the output angle ----
function phases(th) {
  const z = GEARSETS[S.gear].teeth;
  const a4 = -th * DEG;
  const a3 = (-a4 * z[3]) / PINION;
  const a2 = (-a3 * z[2]) / PINION;
  const a1 = (-a2 * z[1]) / PINION;
  const am = (-a1 * z[0]) / PINION;
  return { pm: am, g1: a1, p1: a1, g2: a2, p2: a2, g3: a3, p3: a3, g4: a4 };
}

// ---- drawing ----
const f1 = (v) => Math.round(v * 10) / 10;
function drawGears(th, dt) {
  const ph = phases(th);
  for (const g of train()) {
    const ref = gearEls[g.id];
    if (!ref) continue;
    const a = ph[g.id];
    const moved = ref.lastPhase === null ? 0 : Math.abs(a - ref.lastPhase);
    ref.lastPhase = a;
    // teeth passing per frame: above about half a tooth the eye sees a blur, so the teeth fade into rings
    const perFrame = (moved * g.teeth) / (2 * Math.PI);
    const want = 1 - smooth01((perFrame - 0.3) / 0.5);
    ref.vis = still.matches || !dt ? want : ref.vis + (want - ref.vis) * (1 - Math.exp(-dt / 0.08));
    const vis = Math.max(0, Math.min(1, ref.vis));
    ref.rot.setAttribute("opacity", vis.toFixed(2));
    ref.side.parentNode.setAttribute("opacity", vis.toFixed(2));
    ref.blur.style.opacity = (1 - vis).toFixed(2);
    if (vis > 0.02) {
      ref.rot.setAttribute("transform", planeTurn([g.cx, g.cy, g.z1], [1, 0, 0], [0, 1, 0], a, iso, Pk));
      const key = Math.round(a * 400);
      if (ref.drawn !== key) { ref.drawn = key; ref.side.setAttribute("d", sideTeeth(g, a, KIT, Pk)); }
    }
  }
}
function smooth01(x) { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); }

let drawnHorn = NaN;
function drawHorn(th) {
  const key = Math.round(th * 20) / 20;
  if (key === drawnHorn) return;
  drawnHorn = key;
  hornEl.innerHTML = hornSvg(key, DATA.shaftA, DATA.horn, KIT, Pk);
  const [cx, cy] = DATA.shaftA;
  drumTop.setAttribute("transform", planeTurn([cx, cy, DATA.drum.top], [1, 0, 0], [0, 1, 0], -key * DEG, iso, Pk));
  // the cord winds on the drum: the hanger rises r·θ, the pulley turns with it
  const lift = DATA.drum.r * Math.max(0, key) * DEG;
  hangerEl.setAttribute("transform", translateAlong(Pk, [0, 0, lift]));
  const H = DATA.hang;
  const a = iso([H.x, H.y, DATA.pulley.z], Pk);
  const b = iso([H.x, H.y, H.z0 + 2.6 + lift], Pk);
  dropEl.setAttribute("d", `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`);
  pulleyMarks.setAttribute("transform", planeTurn([DATA.pulley.x, DATA.pulley.y + 2.4, DATA.pulley.z], [1, 0, 0], [0, 0, 1], (lift / DATA.pulley.r), iso, Pk));
}
function drawTarget() {
  const [cx, cy] = DATA.pro.c;
  targetEl.setAttribute("transform", planeTurn([cx, cy, DATA.pro.z + DATA.pro.t], [1, 0, 0], [0, 1, 0], -target * DEG, iso, Pk));
}
function drawKnob() {
  const K = DATA.knob;
  const a = Math.PI / 2 - ((S.pwm - 1.5) / 0.5) * (135 * DEG);
  const z = K.z0 + K.h;
  knobEl.setAttribute("d", lineOnTop([K.x, K.y], [K.x + (K.r - 1.4) * Math.cos(a), K.y + (K.r - 1.4) * Math.sin(a)], z, Pk));
}
function drawMasses() {
  const n = Math.round(S.load / 0.25);
  masses.forEach((el, i) => { if (i < n) el.removeAttribute("display"); else el.setAttribute("display", "none"); });
}
// OLED: the pulse as the board sends it (0–2.5 ms shown), its width and the angle it asks for
function drawOled() {
  const O = DATA.oled;
  const w = O.w, d = O.d;
  const x0 = 1.2, x1 = w - 1.2, base = d - 1.6, top = d - 5.6;
  const sx = (ms) => x0 + ((x1 - x0) * ms) / 2.5;
  const grid = [1, 2].map((ms) => `M${sx(ms).toFixed(2)} ${top - 0.6}V${base}`).join("");
  const wave = `M${x0} ${base}H${sx(0.15).toFixed(2)}V${top}H${sx(0.15 + S.pwm).toFixed(2)}V${base}H${x1}`;
  oledEl.innerHTML = `<path class="sv-grid" d="${grid}M${x0} ${base}H${x1}"/><path class="sv-wave" d="${wave}"/><text x="1.2" y="3.2">${S.pwm.toFixed(2)}ms</text><text x="${(w - 1.2).toFixed(2)}" y="3.2" text-anchor="end">${Math.round(target)}°</text>`;
}

// ---- response chart (outside the drawing, in the figure column) ----
const chart = document.querySelector("[data-chart]");
const chartRead = document.querySelector("[data-chart-read]");
const CH = { w: 600, h: 200, l: 46, r: 12, t: 12, b: 32, secs: 2, lo: -10, hi: 190 };
const cx = (t) => CH.l + (Math.min(t, CH.secs) / CH.secs) * (CH.w - CH.l - CH.r);
const cy = (deg) => CH.t + ((CH.hi - Math.max(CH.lo, Math.min(CH.hi, deg))) / (CH.hi - CH.lo)) * (CH.h - CH.t - CH.b);
function niceStep(span) { const raw = span / 4; const p = Math.pow(10, Math.floor(Math.log10(raw))); const m = raw / p; return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p; }
function chartRange() {
  const vals = [run.from, run.to, run.stats ? run.stats.peak : run.to, run.stats ? run.stats.final : run.to, ...run.points.map((q) => q[1])];
  if (ghost) vals.push(...ghost.map((q) => q[1]));
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(3, (hi - lo) * 0.12);
  lo -= pad; hi += pad;
  const stepV = niceStep(hi - lo);
  CH.lo = Math.floor(lo / stepV) * stepV; CH.hi = Math.ceil(hi / stepV) * stepV; CH.step = stepV;
}
function chartFrame() {
  let g = "";
  for (let v = CH.lo; v <= CH.hi + 1e-9; v += CH.step) g += `<line class="grid" x1="${CH.l}" x2="${CH.w - CH.r}" y1="${cy(v).toFixed(1)}" y2="${cy(v).toFixed(1)}"/><text class="tick" x="${CH.l - 6}" y="${cy(v).toFixed(1)}" dy="0.32em" text-anchor="end">${+v.toFixed(2)}°</text>`;
  for (const t of [0, 0.5, 1, 1.5, 2]) g += `<text class="tick" x="${cx(t).toFixed(1)}" y="${CH.h - CH.b + 15}" text-anchor="middle">${t}</text>`;
  g += `<text class="axis" x="${CH.w - CH.r}" y="${CH.h - 2}" text-anchor="end">명령 뒤 시간 (초)</text>`;
  return g;
}
const linePath = (pts) => pts.map(([t, v], i) => `${i ? "L" : "M"}${cx(t).toFixed(1)} ${cy(v).toFixed(1)}`).join("");
let chartDrawn = -1;
function drawChart(force) {
  if (!chart) return;
  const n = run.points.length;
  if (!force && n === chartDrawn) return;
  const width = Math.max(280, Math.round(chart.clientWidth || 600));
  if (width !== CH.w) { CH.w = width; chart.setAttribute("viewBox", `0 0 ${width} ${CH.h}`); }
  chartDrawn = n;
  const tgt = `M${cx(0).toFixed(1)} ${cy(run.to).toFixed(1)}H${cx(CH.secs).toFixed(1)}`;
  chartRange();
  chart.innerHTML = chartFrame() + (ghost ? `<path class="sv-line" data-kind="ghost" d="${linePath(ghost)}"/>` : "") + `<path class="sv-line" data-kind="target" d="${tgt}"/>` + `<path class="sv-line" data-kind="now" d="${linePath(run.points)}"/>`;
}
function chartText() {
  if (!chartRead || !run.stats) return;
  const s = run.stats;
  const text = `${fmt.deg0(run.from)} → ${fmt.deg0(run.to)} · 오버슈트 ${fmt.deg(s.over)} (${fmt.pct(s.overPct)}) · 정착 ${fmt.sec(s.settle)} · 처짐 ${fmt.deg(s.ess)}` + (ghost ? " · 흐린 선은 지난번 응답" : "");
  if (chartRead.textContent !== text) chartRead.textContent = text;
}
function newRun(from = st.th) {
  // keep the last run as a ghost only when it answered the same command (a gain or gear comparison)
  if (run.points.length > 30 && Math.abs(run.from - from) < 1 && Math.abs(run.to - target) < 1) ghost = run.points;
  else if (Math.abs((ghost?.[0]?.[1] ?? 1e9) - from) >= 1 || Math.abs(run.to - target) >= 1) ghost = null;
  run = { t0: 0, from, to: target, points: [[0, from]], stats: response(from, target, p, { seconds: 3 }) };
  runClock = 0;
  drawChart(true);
  chartText();
}

// ---- readout and status ----
function readoutText() {
  const err = target - st.th;
  const base = `목표 ${fmt.deg0(target)} · 실제 ${fmt.deg(st.th)}`;
  if (hand) return `${base} · 되돌리는 토크 ${fmt.nm(Math.abs(p.G * out.volts))}`;
  return Math.abs(err) > 0.3 || Math.abs(out.volts) > 0.01 ? `${base} · 모터 ${fmt.v(out.volts)}` : base;
}
let statusKey = "";
function status() {
  if (!edu) return;
  let s;
  if (hand) s = { level: "info", text: `손으로 비트는 중입니다. 오차 ${fmt.deg(target - st.th)}에 모터가 ${fmt.v(out.volts)}로 버팁니다. 놓으면 목표로 돌아갑니다.` };
  else if (p.overload) s = { level: "danger", text: `추의 토크 ${fmt.nm(p.tauL)}가 이 기어의 최대 토크 ${fmt.nm(p.stall)}보다 커서 버티지 못합니다.` };
  else if (Math.abs(p.ess) > 0.05 && p.vHold > SERVO.supply * 0.98) s = { level: "danger", text: "추를 버티려면 6 V보다 큰 전압이 필요합니다. 바늘이 밀려 내려갑니다." };
  else if (run.stats && run.stats.overPct > 12) s = { level: "warn", text: `P 게인 ${fmt.kp(S.kp)}에서 바늘이 목표를 ${fmt.deg(run.stats.over)} 지나칩니다(오버슈트 ${fmt.pct(run.stats.overPct)}).` };
  else if (p.ess > 3) s = { level: "warn", text: `추 때문에 바늘이 목표보다 ${fmt.deg(p.ess)} 처집니다. P 게인이나 감속비를 키우면 줄어듭니다.` };
  else s = { level: "ok", text: `감속비 ${fmt.ratio(p.N)} · 최대 토크 ${fmt.kgcm(p.stall)} · 최고 속도 ${fmt.s60(p.wMax / DEG)}` };
  const key = s.level + s.text;
  if (key === statusKey) return;
  statusKey = key;
  edu.status(s);
}

// ---- the loop ----
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) {
    tourClock += dt;
    const phase = Math.floor(tourClock / 3) % 4;
    const want = [1.0, 1.5, 2.0, 1.5][phase];
    if (Math.abs(want - S.pwm) > 1e-6) { S.pwm = want; edu?.sync("pwm", want); targetChanged(); edu?.refresh(); }
  }
  if (still.matches && !hand) {
    st = { th: settled(target, p), w: 0 };
    out = { volts: Math.max(-SERVO.supply, Math.min(SERVO.supply, S.kp * (target - st.th))), tauHand: 0 };
  } else {
    const r = step(st, target, p, dt, hand);
    st = { th: r.th, w: r.w };
    out = r;
  }
  runClock += dt;
  if (runClock <= CH.secs + 0.02) { run.points.push([runClock, st.th]); drawChart(); }
  drawHorn(st.th);
  drawGears(st.th, dt);
  const text = readoutText();
  if (readout.textContent !== text) readout.textContent = text;
  ticks++;
  if (hand || ticks % 6 === 0) status();
  if (ticks % 30 === 0) edu?.refresh();
  const end = settled(target, p);
  const quiet = !touring && !hand && Math.abs(st.th - end) < 0.02 && Math.abs(st.w) < 0.05 && runClock > CH.secs;
  if (quiet) { st = { th: end, w: 0 }; drawHorn(end); drawGears(end, 0); readout.textContent = readoutText(); status(); edu?.refresh(); }
  frame = visible && !quiet ? requestAnimationFrame(tick) : 0;
}
const go = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };

function targetChanged() {
  target = angleOf(S.pwm);
  drawTarget();
  drawKnob();
  drawOled();
  newRun();
  go();
}
function plantChanged() {
  p = plant(S);
  newRun();
  status();
  go();
}

// ---- direct manipulation: drag the knob (sets the pulse), drag the pointer (a hand twists the horn) ----
let grab = null;
const svgPoint = (event) => {
  const m = svg.getScreenCTM().inverse();
  return [m.a * event.clientX + m.c * event.clientY + m.e, m.b * event.clientX + m.d * event.clientY + m.f];
};
const knobAngle = (event) => {
  const K = DATA.knob;
  const [sx, sy] = svgPoint(event);
  const [x, y] = onPlane(sx, sy, K.z0 + K.h, iso, Pk);
  return Math.atan2(y - K.y, x - K.x);
};
const hornAngle = (event) => {
  const [sx, sy] = svgPoint(event);
  const [x, y] = onPlane(sx, sy, DATA.horn.z + DATA.horn.t, iso, Pk);
  const [ax, ay] = DATA.shaftA;
  let a = Math.atan2(y - ay, -(x - ax)) / DEG;
  if (a < -90) a += 360;
  return Math.max(SERVO.stops[0], Math.min(SERVO.stops[1], a));
};
const HAND = { k: 12, c: 0.9 };
stage.addEventListener("pointerdown", (event) => {
  if (event.button > 0) return;
  const onKnob = event.target.closest?.('[data-piece="knob"]');
  const onHorn = event.target.closest?.('[data-horn],[data-piece="drum"],[data-piece="protractor"]');
  if (!onKnob && !onHorn) return;
  edu?.takeOver();
  touring = false;
  clearTimeout(twistTimer);
  stage.setPointerCapture?.(event.pointerId);
  stage.classList.add("sv-grabbing");
  if (onKnob) grab = { kind: "knob", id: event.pointerId, a: knobAngle(event), pwm: S.pwm };
  else {
    grab = { kind: "horn", id: event.pointerId };
    hand = { at: hornAngle(event), ...HAND };
    newRun();
  }
  event.preventDefault();
  go();
});
stage.addEventListener("pointermove", (event) => {
  if (!grab || grab.id !== event.pointerId) return;
  if (grab.kind === "knob") {
    const a = knobAngle(event);
    let da = a - grab.a;
    if (da > Math.PI) da -= 2 * Math.PI;
    if (da < -Math.PI) da += 2 * Math.PI;
    grab.a = a;
    grab.pwm = Math.max(1, Math.min(2, grab.pwm - (da / (270 * DEG)) * 1.0));
    const v = Math.round(grab.pwm * 100) / 100;
    if (v !== S.pwm) { S.pwm = v; edu?.sync("pwm", v); targetChanged(); edu?.refresh(); }
  } else {
    hand.at = hornAngle(event);
    go();
  }
});
const release = (event) => {
  if (!grab || grab.id !== event.pointerId) return;
  if (grab.kind === "horn") { hand = null; newRun(); }
  grab = null;
  stage.classList.remove("sv-grabbing");
  edu?.refresh();
  go();
};
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 0.05 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -0.05 : 0;
  if (!step) return;
  event.preventDefault();
  edu?.takeOver();
  touring = false;
  const v = Math.round(Math.max(1, Math.min(2, S.pwm + step)) * 100) / 100;
  S.pwm = v;
  edu?.sync("pwm", v);
  targetChanged();
  edu?.refresh();
});

// A hand twists the pointer 30° away from where it stands, holds, then lets go.
function twist() {
  clearTimeout(twistTimer);
  const from = settled(target, p);
  const to = from + (from > 120 ? -30 : 30);
  hand = { at: to, ...HAND };
  newRun();
  go();
  twistTimer = setTimeout(() => { hand = null; newRun(); edu?.refresh(); go(); }, still.matches ? 200 : 900);
}

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) go(); }, { rootMargin: "120px 0px" }).observe(stage);

const fmtOf = () => {
  const end = settled(target, p);
  const ess = target - end;
  const stats = run.stats || response(run.from, target, p, { seconds: 3 });
  const z = GEARSETS[S.gear].teeth;
  const volts = Math.max(-SERVO.supply, Math.min(SERVO.supply, S.kp * (target - st.th)));
  return {
    pwm: { n: S.pwm, t: fmt.ms(S.pwm) },
    target: { n: target, t: fmt.deg0(target) },
    th: { n: st.th, t: fmt.deg(st.th) },
    thEnd: { n: end, t: fmt.deg(end) },
    err: { n: target - st.th, t: fmt.deg(target - st.th) },
    volts: { n: volts, t: fmt.v(volts) },
    v30: { n: S.kp * 30, t: fmt.v(Math.min(SERVO.supply, S.kp * 30)) },
    kp: { n: S.kp, t: fmt.kp(S.kp) },
    load: { n: S.load, t: fmt.kg(S.load) },
    loadCase: S.load ? `${fmt.kg(S.load)}의 추를 들고 있어` : "추를 매달지 않아",
    thP: { n: st.th, t: st.th < -0.05 ? `(${fmt.deg(st.th)})` : fmt.deg(st.th) },
    ratio: { n: p.N, t: fmt.ratio(p.N) },
    teeth: { n: z.reduce((a, b) => a * b, 1), t: z.join("×") },
    stall: { n: p.stall, t: fmt.nm(p.stall) },
    stallKg: { n: p.stall / 0.0981, t: fmt.kgcm(p.stall) },
    dps: { n: p.wMax / DEG, t: fmt.dps(p.wMax / DEG) },
    s60: { n: (60 * DEG) / p.wMax, t: fmt.s60(p.wMax / DEG) },
    tauL: { n: p.tauL, t: `${p.tauL.toFixed(3)} N·m` },
    hold: { n: p.vHold, t: fmt.v(p.vHold) },
    ess: { n: ess, t: fmt.deg(ess) },
    essP: { n: p.ess, t: fmt.deg(p.ess) },
    stopNote: { n: 0, t: Math.abs(p.ess - ess) > 0.05 ? ` (끝 멈춤 ${fmt.deg0(SERVO.stops[0])}에 걸려 실제 처짐은 ${fmt.deg(ess)})` : "" },
    os: { n: stats.overPct, t: `${fmt.deg(stats.over)} (${fmt.pct(stats.overPct)})` },
    settle: { n: stats.settle, t: fmt.sec(stats.settle) },
    G: { n: p.G, t: `${p.G.toFixed(3)} N·m/V` },
  };
};

edu = EDU.mount({
  stage,
  set(id, value, info) {
    if (id === "twist") { if (value) twist(); return; }
    S[id] = value;
    if (id === "pwm") { if (!info?.initial) targetChanged(); }
    else if (id === "gear") {
      for (const [gid, html] of Object.entries(DATA.gearMarkup[value])) {
        const ref = gearEls[gid];
        if (ref) ref.el.innerHTML = html;
      }
      findGears();
      plantChanged();
    } else if (id === "load") { drawMasses(); plantChanged(); }
    else plantChanged();
  },
  action(id) { if (id === "twist") { touring = false; twist(); } },
  pose(pose) {
    touring = false;
    clearTimeout(twistTimer);
    hand = null;
    if (pose.reset) { st = { th: settled(target, p), w: 0 }; }
    if ("start" in pose) { st = { th: pose.start, w: 0 }; ghost = null; run.points = []; newRun(pose.start); }
    else newRun();
    if (pose.twist) twist();
    go();
  },
  tour(on) { touring = on; tourClock = 0; go(); },
  values: fmtOf,
});
drawTarget();
drawKnob();
drawOled();
drawMasses();
newRun();
status();
go();
