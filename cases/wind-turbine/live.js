// Wind turbine live layer: rotor spin and pitch, yaw toward the wind (drag), air particles, the power curve,
// and the edu adapter. WT (model.js), RIG/rigItems (rig.js) and G (lathe.mjs) are inlined before this file.
const DATA = __DATA__;
const P = DATA.P;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg.iso-svg");
const rigHost = svg.querySelector(".wt-rig");
const airBack = svg.querySelector(".wt-air-back");
const airFront = svg.querySelector(".wt-air-front");
const arrowEl = svg.querySelector(".wt-arrow");
const chart = stage.querySelector(".wt-chart");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const KIT = { extrude, cylinder, solidSvg, lineSvg, dotsSvg, iso, depthOf, ringOf, ringSeam, ring, segment, fadedSvg };
const S = { v: 8, cp: 0.44, dir: 0, air: true };
let m = WT.model(S);
let edu = null;
let frame = 0, last = 0, visible = false, touring = false, tourClock = 0;
let yaw = DATA.YAW0; // nacelle heading (deg), follows the wind
let pitch = m.pitch; // blade pitch (deg), follows the controller
let rpm = m.rpm; // rotor speed, with the rotor's inertia
let rotorAngle = 0, cupAngle = 0;
let built = { yaw: NaN, pitch: NaN };
const f = WT.fmt;
const windDeg = () => DATA.YAW0 + S.dir;

// ---- the yawing rig: rebuilt only when its heading or the pitch changes; wrappers persist (highlights stay) ----
const wrappers = [...rigHost.children];
let rotorEl = null, cupsEl = null, vaneEl = null;
function buildRig() {
  const result = rigItems((yaw * Math.PI) / 180, pitch, { k: KIT, G, P, A: null });
  result.items.forEach((item, index) => { item.index = index; });
  const sorted = [...result.items].sort((a, b) => a.key - b.key);
  // wrappers were written in sorted order at build time; match them by name and creation order
  const pool = new Map();
  for (const el of wrappers) { const list = pool.get(el.dataset.name) || []; list.push(el); pool.set(el.dataset.name, list); }
  const byIndex = new Map();
  for (const item of result.items) { const list = pool.get(item.name); byIndex.set(item.index, list.shift()); }
  for (const item of sorted) {
    const el = byIndex.get(item.index);
    el.innerHTML = item.svg;
    rigHost.appendChild(el);
  }
  rotorEl = rigHost.querySelector(".wt-rotor");
  cupsEl = rigHost.querySelector(".wt-cups");
  vaneEl = rigHost.querySelector(".wt-vane");
  built = { yaw, pitch };
}

function spin() {
  rotorEl?.setAttribute("transform", `rotate(${rotorAngle.toFixed(2)})`);
  cupsEl?.setAttribute("transform", `rotate(${cupAngle.toFixed(1)})`);
  // the vane points downwind: its tail toward the wind
  vaneEl?.setAttribute("transform", `rotate(${(windDeg() + 180).toFixed(1)})`);
  arrowEl.setAttribute("transform", `rotate(${windDeg().toFixed(1)})`);
}

// ---- air: particles carried by the wind, slowed in the rotor's wake ----
const N = 46;
const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const air = Array.from({ length: N }, () => ({ t: -140 + rnd() * 320, w: (rnd() * 2 - 1) * 150, z: DATA.ZHUB + (rnd() * 2 - 1) * 120 }));
const backDots = Array.from({ length: N }, () => { const c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); c.setAttribute("r", "1.1"); c.setAttribute("display", "none"); airBack.appendChild(c); return c; });
const frontDots = Array.from({ length: N }, () => { const c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); c.setAttribute("r", "1.1"); c.setAttribute("display", "none"); airFront.appendChild(c); return c; });
function induction(cp) {
  // actuator-disc theory: Cp = 4a(1 − a)², a in 0 .. 1/3
  let lo = 0, hi = 1 / 3;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (4 * mid * (1 - mid) ** 2 < cp) lo = mid; else hi = mid; }
  return lo;
}
function moveAir(dt) {
  const a = induction(m.cpNow);
  const ang = (windDeg() * Math.PI) / 180;
  const dw = [Math.cos(ang), Math.sin(ang)];
  const uw = [-dw[1], dw[0]];
  const pace = 3.2 * S.v; // drawing units per second
  for (let i = 0; i < N; i++) {
    const p = air[i];
    const inWake = p.t < DATA.ROTOR_S && Math.hypot(p.w, p.z - DATA.ZHUB) < DATA.R;
    p.t -= pace * (inWake ? 1 - 2 * a : 1) * dt;
    if (p.t < -150) { p.t += 320; p.w = (rnd() * 2 - 1) * 150; p.z = DATA.ZHUB + (rnd() * 2 - 1) * 120; }
    const world = [p.t * dw[0] + p.w * uw[0], p.t * dw[1] + p.w * uw[1], p.z];
    const [x, y] = iso(world, P);
    const front = p.t > DATA.ROTOR_S;
    const show = S.air && S.v > 0;
    const on = front ? frontDots[i] : backDots[i];
    const off = front ? backDots[i] : frontDots[i];
    if (!off.hasAttribute("display")) off.setAttribute("display", "none");
    if (!show) { if (!on.hasAttribute("display")) on.setAttribute("display", "none"); continue; }
    if (on.hasAttribute("display")) on.removeAttribute("display");
    on.setAttribute("cx", x.toFixed(1));
    on.setAttribute("cy", y.toFixed(1));
  }
}

// ---- the power curve ----
const CH = DATA.CH;
const cx = (v) => CH.l + ((CH.w - CH.l - CH.r) * v) / CH.vmax;
const cy = (p) => CH.h - CH.b - ((CH.h - CH.t - CH.b) * Math.min(p, CH.pmax)) / CH.pmax;
function drawChart() {
  const vr = WT.vRatedOf(m.cp);
  const bands = [["idle", 0, WT.CUT_IN], ["partial", WT.CUT_IN, vr], ["rated", vr, WT.CUT_OUT], ["storm", WT.CUT_OUT, CH.vmax]];
  chart.querySelector(".wt-ch-bands").innerHTML = bands.map(([r, a, b]) => `<rect class="wt-ch-band" data-r="${r}" x="${cx(a).toFixed(1)}" y="${CH.t}" width="${(cx(b) - cx(a)).toFixed(1)}" height="${CH.h - CH.t - CH.b}"/>`).join("");
  const line = (fn, from = 0, to = CH.vmax) => {
    let d = "";
    for (let v = from; v <= to + 1e-9; v += 0.25) {
      const p = fn(v);
      if (p > CH.pmax) { d += `${d ? "L" : "M"}${cx(v).toFixed(1)} ${cy(CH.pmax).toFixed(1)}`; break; }
      d += `${d ? "L" : "M"}${cx(v).toFixed(1)} ${cy(p).toFixed(1)}`;
    }
    return d;
  };
  chart.querySelector(".wt-ch-betz").setAttribute("d", line((v) => WT.windPower(v) * WT.BETZ));
  chart.querySelector(".wt-ch-wind").setAttribute("d", line((v) => WT.windPower(v) * m.cp));
  let curve = `M${cx(0)} ${cy(0)}L${cx(WT.CUT_IN)} ${cy(0)}`;
  for (let v = WT.CUT_IN; v <= vr; v += 0.25) curve += `L${cx(v).toFixed(1)} ${cy(WT.windPower(v) * m.cp).toFixed(1)}`;
  curve += `L${cx(vr).toFixed(1)} ${cy(WT.RATED).toFixed(1)}L${cx(WT.CUT_OUT)} ${cy(WT.RATED)}L${cx(WT.CUT_OUT)} ${cy(0)}L${cx(CH.vmax)} ${cy(0)}`;
  chart.querySelector(".wt-ch-curve").setAttribute("d", curve);
  const marks = [[WT.CUT_IN, "기동 " + WT.CUT_IN], [vr, "정격 " + vr.toFixed(1)], [WT.CUT_OUT, "정지 " + WT.CUT_OUT]];
  chart.querySelector(".wt-ch-marks").innerHTML =
    marks.map(([v, label], i) => `<path class="wt-ch-mark" d="M${cx(v).toFixed(1)} ${CH.t}V${CH.h - CH.b}"/><text class="wt-ch-mark-label" x="${(cx(v) + 3).toFixed(1)}" y="${CH.t + 10 + (i === 1 ? 12 : 0)}">${label}</text>`).join("") +
    `<text class="wt-ch-key" x="${cx(12).toFixed(1)}" y="${(cy(1.1e6)).toFixed(1)}">점선: ½ρAv³Cp · 붉은 점선: 베츠 한계</text>`;
  const dot = chart.querySelector(".wt-ch-dot");
  dot.setAttribute("cx", cx(m.v).toFixed(1));
  dot.setAttribute("cy", cy(m.P).toFixed(1));
  chart.querySelector(".wt-ch-drop").setAttribute("d", `M${cx(m.v).toFixed(1)} ${cy(m.P).toFixed(1)}V${CH.h - CH.b}`);
}

const REGION = { idle: "기동 전(바람이 약함)", partial: "부분 부하(출력이 v³에 비례)", rated: "정격 출력(피치로 조절)", storm: "정지(폭풍, 깃털 자세)" };
function readoutText() {
  return f.v(m.v) + " · " + f.MW(m.P) + " · " + f.rpm(m.rpm) + " → " + f.rpm(m.genRpm);
}
function status() {
  if (!edu) return;
  if (m.region === "idle") return edu.status({ level: "info", text: "풍속이 기동 풍속 " + f.v(WT.CUT_IN) + "보다 약해 발전하지 않습니다. 로터는 천천히 헛돕니다." });
  if (m.region === "storm") return edu.status({ level: "danger", text: "풍속이 정지 풍속 " + f.v(WT.CUT_OUT) + "를 넘었습니다. 블레이드를 깃털 자세(" + f.deg(m.pitch) + ")로 세우고 로터를 멈춥니다." });
  if (m.region === "rated") return edu.status({ level: "warn", text: "정격 출력 " + f.MW(WT.RATED) + "에 이르렀습니다. 블레이드를 " + f.deg(m.pitch) + " 비틀어 남는 바람 " + f.MW(m.pw * m.cp - WT.RATED) + "를 흘려보냅니다." });
  edu.status({ level: "ok", text: "부분 부하: 바람 일률 " + f.MW(m.pw) + "의 " + Math.round(m.cp * 100) + " %인 " + f.MW(m.P) + "를 전기로 바꿉니다." });
}
function apply() {
  m = WT.model(S);
  if (S.air) stage.setAttribute("data-air", ""); else stage.removeAttribute("data-air");
  const text = readoutText();
  if (readout.textContent !== text) readout.textContent = text;
  drawChart();
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
    // the tour sweeps the wind speed over the curve and swings the wind direction slowly
    const t = tourClock;
    S.v = Math.round((14 + 13 * Math.sin(t * 0.18 - 1.2)) * 2) / 2;
    S.dir = Math.round(22 * Math.sin(t * 0.11));
    edu?.sync("v", S.v);
    edu?.sync("dir", S.dir);
    if (Math.abs(m.v - S.v) > 1e-9) apply();
  }
  const goalYaw = windDeg();
  const goalPitch = m.pitch;
  if (calm) { yaw = goalYaw; pitch = goalPitch; rpm = m.rpm; }
  else {
    const step = 18 * dt; // yaw drive, deg/s (shown faster than a real one)
    yaw += Math.max(-step, Math.min(step, goalYaw - yaw));
    const pstep = (m.region === "storm" ? 30 : 10) * dt; // pitch drive, deg/s
    pitch += Math.max(-pstep, Math.min(pstep, goalPitch - pitch));
    rpm += (m.rpm - rpm) * (1 - Math.exp(-dt / 2.5));
    if (Math.abs(m.rpm - rpm) < 0.01) rpm = m.rpm;
    rotorAngle = (rotorAngle + rpm * 6 * dt) % 360;
    cupAngle = (cupAngle + S.v * 40 * dt) % 360;
    moveAir(dt);
  }
  if (Math.abs(yaw - built.yaw) > 0.05 || Math.abs(pitch - built.pitch) > 0.2) buildRig();
  spin();
  const settled = calm && Math.abs(goalYaw - yaw) < 0.01;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
  if (calm && settled) moveAir(0);
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

// ---- drag: the pointer's spot on the pad's plane sets where the wind comes from ----
function floorAngle(event) {
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const q = pt.matrixTransform(svg.getScreenCTM().inverse());
  const { sinA, cosA, sinE, cosE, k } = cameraOf(P);
  const a = (q.x - P.origin[0]) / k;
  const b = ((q.y - P.origin[1]) / k + DATA.PAD_H * cosE) / sinE;
  const x = a * sinA + b * cosA;
  const y = -a * cosA + b * sinA;
  return (Math.atan2(y, x) * 180) / Math.PI;
}
let grab = null;
function steer(dir) {
  touring = false;
  S.dir = Math.max(-DATA.DIR_RANGE, Math.min(DATA.DIR_RANGE, Math.round(dir)));
  edu?.sync("dir", S.dir);
  edu?.refresh();
  run();
}
svg.addEventListener("pointerdown", (event) => {
  if (event.button > 0) return;
  edu?.takeOver();
  grab = { id: event.pointerId, moved: false, x: event.clientX, y: event.clientY };
  svg.setPointerCapture?.(event.pointerId);
});
svg.addEventListener("pointermove", (event) => {
  if (!grab || grab.id !== event.pointerId) return;
  if (!grab.moved && Math.hypot(event.clientX - grab.x, event.clientY - grab.y) < 4) return;
  if (!grab.moved) { grab.moved = true; stage.setAttribute("data-grab", ""); }
  let rel = floorAngle(event) - DATA.YAW0;
  rel = ((rel + 540) % 360) - 180;
  steer(rel);
});
const release = (event) => { if (!grab || grab.id !== event.pointerId) return; grab = null; stage.removeAttribute("data-grab"); };
svg.addEventListener("pointerup", release);
svg.addEventListener("pointercancel", release);
stage.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  edu?.takeOver();
  steer(S.dir + (event.key === "ArrowRight" ? -5 : 5));
});

edu = EDU.mount({
  stage,
  root: svg,
  set(id, value) {
    S[id] = value;
    apply();
  },
  pose(pose) {
    touring = false;
    if (pose.reset) Object.assign(S, { v: 8, cp: 0.44, dir: 0 });
    apply();
  },
  tour(on) {
    touring = on;
    tourClock = 0;
    run();
  },
  values() {
    const vr = m.vRated;
    const Ptext = m.region === "partial"
      ? "P = P바람 × Cp = " + f.MW(m.pw) + " × " + m.cp.toFixed(2) + " = " + f.MW(m.P)
      : m.region === "rated"
        ? "정격 " + f.MW(WT.RATED) + "로 제한 (P바람 × Cp = " + f.MW(m.pw * m.cp) + ", 지금 Cp " + f.cp(m.cpNow) + ")"
        : "0 MW (" + (m.region === "idle" ? "기동 풍속 " + f.v(WT.CUT_IN) + " 미만" : "정지 풍속 " + f.v(WT.CUT_OUT) + " 초과") + ")";
    const rpmText = m.region === "partial"
      ? "n = λv ÷ (2πR) × 60 = 8 × " + m.v.toFixed(1) + " ÷ (2π × 45) × 60 = " + f.rpm(m.rpm)
      : m.region === "rated"
        ? "정격 회전 " + f.rpm(m.rpm) + " 유지 (λ = 8, 정격 풍속 " + f.v(vr) + ")"
        : f.rpm(m.rpm) + " (" + (m.region === "idle" ? "발전기와 분리, 헛돎" : "브레이크로 멈춤") + ")";
    return {
      v: { n: m.v, t: f.v(m.v) },
      P: { n: m.P, t: f.MW(m.P) },
      Pw: { n: m.pw, t: f.MW(m.pw) },
      betzP: { n: m.betzP, t: f.MW(m.betzP) },
      cp: { n: m.cp, t: m.cp.toFixed(2) },
      cpNow: { n: m.cpNow, t: f.cp(m.cpNow) },
      rpm: { n: m.rpm, t: f.rpm(m.rpm) },
      genRpm: { n: m.genRpm, t: f.rpm(m.genRpm) },
      pitch: { n: m.pitch, t: f.deg(m.pitch) },
      tip: { n: m.tipSpeed, t: Math.round(m.tipSpeed) + " m/s" },
      vRated: { n: vr, t: f.v(vr) },
      A: { n: WT.AREA, t: Math.round(WT.AREA).toLocaleString("en-US") + " m²" },
      region: REGION[m.region],
      Ptext,
      rpmText,
    };
  },
});
buildRig();
moveAir(0);
spin();
apply();
