// Heat pump live layer: refrigerant flow dots, fans, gauge needles, the 4-way valve toggle, and the edu adapter.
// HP (model.js) is inlined before this file; kit globals (iso, ...) come from kitScript().
const DATA = __DATA__;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const P = DATA.P;
const S = { mode: "heat", Tin: 20, Tout: 7, W: 1, flow: true };
let m = HP.model(S);
let edu = null;
let frame = 0, last = 0, visible = false, touring = false, tourClock = 0;
let swing = 1; // +1 heating ... -1 cooling, eased: the flow slows, stops and reverses when the valve switches
let speed = 0; // dot speed, units/s, follows the compressor power
let fanAngle = 0, iuPhase = 0;
const needles = DATA.gauges.map((g) => ({ g, el: svg.querySelector(`.hp-needle[data-gauge="${g.name}"]`), value: 0 }));
const routes = DATA.routes.map((route, index) => ({
  ...route,
  phase: 0,
  chunks: route.chunks.map((chunk, c) => ({ ...chunk, dots: [...svg.querySelectorAll(`.hp-dots[data-r="${index}"][data-c="${c}"] circle`)] })),
}));
const rotor = svg.querySelector(".hp-rotor");
const ribsHost = svg.querySelector(".hp-iufan-ribs");
const f = HP.fmt;

// ---- flow dots: positions by 3D arc length along each route, so they run through every chunk joint ----
function pointAt(pts, s) {
  let i = 1;
  while (i < pts.length - 1 && pts[i][2] < s) i++;
  const a = pts[i - 1], b = pts[i];
  const t = (s - a[2]) / (b[2] - a[2] || 1);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function drawDots() {
  if (!S.flow) return;
  const sp = DATA.spacing;
  for (const route of routes) {
    const base = ((route.phase % sp) + sp) % sp;
    for (const chunk of route.chunks) {
      const n0 = Math.ceil((chunk.from - base) / sp);
      chunk.dots.forEach((dot, j) => {
        const s = base + (n0 + j) * sp;
        if (s > chunk.to + 0.5) { if (!dot.hasAttribute("display")) dot.setAttribute("display", "none"); return; }
        const [x, y] = pointAt(chunk.pts, Math.min(s, chunk.to));
        if (dot.hasAttribute("display")) dot.removeAttribute("display");
        dot.setAttribute("cx", x.toFixed(2));
        dot.setAttribute("cy", y.toFixed(2));
      });
    }
  }
}
// ---- the cross-flow fan's blades: visible axial lines on its drum, fading toward the limbs ----
const V = DATA.V;
function drawRibs() {
  const F = DATA.iufan.F;
  const count = 30;
  const groups = new Map();
  for (let i = 0; i < count; i++) {
    const a = iuPhase + (i / count) * Math.PI * 2;
    const n = [F.u[0] * Math.cos(a) + F.v[0] * Math.sin(a), F.u[1] * Math.cos(a) + F.v[1] * Math.sin(a), F.u[2] * Math.cos(a) + F.v[2] * Math.sin(a)];
    const facing = n[0] * V[0] + n[1] * V[1] + n[2] * V[2];
    const t = Math.max(0, Math.min(1, (facing - 0.1) / 0.45));
    const alpha = Math.round(t * t * (3 - 2 * t) * 20) / 20;
    if (alpha < 0.05) continue;
    const r = DATA.iufan.r;
    const p0 = iso([DATA.iufan.x0, F.o[1] + n[1] * r, F.o[2] + n[2] * r], P);
    const p1 = iso([DATA.iufan.x1, F.o[1] + n[1] * r, F.o[2] + n[2] * r], P);
    groups.set(alpha, (groups.get(alpha) || "") + `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`);
  }
  let html = "";
  for (const [alpha, d] of groups) html += `<g opacity="${alpha}"><path class="iso-line" data-tone="lo" d="${d}"/></g>`;
  ribsHost.innerHTML = html;
}
function drawNeedles(snap) {
  const target = { hi: m.pHigh, lo: m.pLow };
  for (const needle of needles) {
    const goal = Math.max(0, Math.min(needle.g.range, target[needle.g.name]));
    needle.value = snap ? goal : needle.value + (goal - needle.value) * 0.12;
    if (Math.abs(goal - needle.value) < 1e-3) needle.value = goal;
    const a = needle.g.start + (needle.g.sweep * needle.value) / needle.g.range;
    const { cx, cy, len } = needle.g;
    needle.el.setAttribute("d", `M${cx} ${cy}L${(cx + len * Math.cos(a)).toFixed(2)} ${(cy + len * Math.sin(a)).toFixed(2)}`);
  }
  return needles.every((needle) => Math.abs(needle.value - Math.max(0, Math.min(needle.g.range, target[needle.g.name]))) < 1e-3);
}
function readoutText() {
  return (m.heat ? "난방" : "냉방") + " · COP " + f.cop(m.cop) + " · " + (m.heat ? "난방 " : "냉방 ") + f.kW(m.useful);
}
function status() {
  if (!edu) return;
  if (m.dAir <= 0) return edu.status({ level: "info", text: (m.heat ? "실외가 실내보다 따뜻합니다. 열이 저절로 들어오므로 난방이 필요 없습니다." : "실외가 실내보다 시원합니다. 창문만 열어도 열이 빠져나갑니다.") + " 모델은 최소 온도 차 " + HP.LIFT_MIN + " K로 계산합니다." });
  if (m.heat && m.Tout <= -5) return edu.status({ level: "warn", text: "바깥이 " + f.C(m.Tout) + "입니다. 실외 코일({Tevap})에 서리가 끼어(그림의 흰 핀) 공기가 잘 지나가지 못하므로, 실제 기기는 가끔 냉방 방향으로 돌려 서리를 녹입니다(제상 운전).".replace("{Tevap}", f.C(m.Tevap)) });
  edu.status({ level: "ok", text: "COP " + f.cop(m.cop) + " · 전기 1 kW마다 " + (m.heat ? "실내로 " : "실내에서 ") + f.cop(m.cop) + " kW의 열을 " + (m.heat ? "보냅니다." : "빼냅니다.") });
}
function apply() {
  m = HP.model(S);
  stage.setAttribute("data-mode", S.mode);
  if (m.heat) stage.setAttribute("data-energized", ""); else stage.removeAttribute("data-energized");
  if (S.flow) stage.setAttribute("data-flow", ""); else stage.removeAttribute("data-flow");
  // rime on the outdoor coil: only while it is the evaporator below 0 °C
  const frost = m.heat ? Math.max(0, Math.min(1, (-m.Tevap - 5) / 15)) : 0;
  stage.style.setProperty("--hp-frost", frost.toFixed(2));
  const text = readoutText();
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-label", "히트펌프 절개 모형, " + text + ". 사방 밸브를 누르거나 스페이스 키를 누르면 난방과 냉방이 바뀝니다.");
  status();
  edu?.refresh();
  run();
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) {
    tourClock += dt;
    if (tourClock > 7) { tourClock = 0; S.mode = S.mode === "heat" ? "cool" : "heat"; edu?.sync("mode", S.mode); apply(); }
  }
  const want = m.heat ? 1 : -1;
  swing = calm ? want : swing + (want - swing) * (1 - Math.exp(-dt / 0.45));
  if (Math.abs(want - swing) < 0.002) swing = want;
  const goal = calm ? 0 : 16 * S.W;
  speed = speed + (goal - speed) * (1 - Math.exp(-dt / 0.6));
  if (Math.abs(goal - speed) < 0.02) speed = goal;
  for (const route of routes) {
    const reversible = route.heat !== route.cool;
    route.phase += (reversible ? speed * swing * route.heat : speed) * dt;
  }
  drawDots();
  if (!calm) {
    fanAngle = (fanAngle + 260 * S.W * dt) % 360;
    rotor.setAttribute("transform", `rotate(${fanAngle.toFixed(1)} ${DATA.fan.cx} ${DATA.fan.cy})`);
    iuPhase = (iuPhase + 3.2 * S.W * dt) % (Math.PI * 2);
    drawRibs();
  }
  const settled = drawNeedles(calm);
  const idle = calm && settled && !touring;
  frame = visible && !idle ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
function toggle() {
  S.mode = S.mode === "heat" ? "cool" : "heat";
  edu?.sync("mode", S.mode);
  apply();
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("click", (event) => {
  if (!event.target.closest('[data-piece="valve4"],[data-piece="solenoid"]')) return;
  edu?.takeOver();
  toggle();
});
stage.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") { event.preventDefault(); edu?.takeOver(); if (!event.repeat) toggle(); }
});

edu = EDU.mount({
  stage,
  set(id, value) {
    S[id] = value;
    apply();
  },
  pose(pose) {
    touring = false;
    if (pose.reset) Object.assign(S, { mode: "heat", Tin: 20, Tout: 7, W: 1 });
    apply();
  },
  tour(on) {
    touring = on;
    tourClock = 0;
    run();
  },
  values() {
    const K = HP.K;
    const sym = m.heat ? "T고" : "T저";
    const numer = (m.heat ? m.hotAir : m.coldAir) + K;
    const idealAirText = m.dAir > 0
      ? sym + " ÷ (T고 − T저) = " + f.K(numer) + " ÷ " + f.K(m.dAir) + " = " + f.cop(m.idealAir)
      : "실외와 실내의 온도 차가 없거나 거꾸로입니다: 한계 없음";
    const refNumer = (m.heat ? m.Tcond : m.Tevap) + K;
    const idealRefText = (m.heat ? "T응축" : "T증발") + " ÷ (T응축 − T증발) = " + f.K(refNumer) + " ÷ " + f.K(m.lift) + " = " + f.cop(m.idealRef);
    return {
      mode: m.heat ? "난방" : "냉방",
      Tin: { n: m.Tin, t: f.C(m.Tin) },
      Tout: { n: m.Tout, t: f.C(m.Tout) },
      W: { n: m.W, t: f.kW(m.W) },
      Tcond: { n: m.Tcond, t: f.C(m.Tcond) },
      Tevap: { n: m.Tevap, t: f.C(m.Tevap) },
      idealAir: { n: Number.isFinite(m.idealAir) ? m.idealAir : 0, t: f.cop(m.idealAir) },
      idealRef: { n: m.idealRef, t: f.cop(m.idealRef) },
      cop: { n: m.cop, t: f.cop(m.cop) },
      useful: { n: m.useful, t: f.kW(m.useful) },
      Qhot: { n: m.Qhot, t: f.kW(m.Qhot) },
      Qcold: { n: m.Qcold, t: f.kW(m.Qcold) },
      pHigh: { n: m.pHigh, t: f.MPa(m.pHigh) },
      pLow: { n: m.pLow, t: f.MPa(m.pLow) },
      eta: { n: HP.ETA, t: Math.round(HP.ETA * 100) + " %" },
      idealAirText,
      idealRefText,
      indoorCoil: m.heat ? "응축기" : "증발기",
      outdoorCoil: m.heat ? "증발기" : "응축기",
    };
  },
});
drawDots();
drawRibs();
drawNeedles(true);
apply();
