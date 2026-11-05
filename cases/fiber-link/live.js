// Fibre-optic link: the live page. Model (model.mjs) and kit functions are inlined before this.
const D = __DATA__;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const NS = "http://www.w3.org/2000/svg";
const S = { msg: D.defaults.msg, theta0: D.defaults.theta0, n2: D.defaults.n2, L: D.defaults.L, bend: D.defaults.bend };
const BENDS = MODEL.BENDS_MM.map(String);
const bendIndex = () => Math.max(0, BENDS.indexOf(String(S.bend)));
let edu = null;
let B = null; // the link budget for the current settings (set in update())
const fmt = (v, d = 1) => (Math.abs(v) < 0.05 && d === 1 ? "0.0" : v.toFixed(d)).replace("-", "−");
const degT = (v, d = 1) => fmt(v, d) + "°";
const dB = (v) => fmt(v, v >= 10 || v <= -10 ? 1 : 2) + " dB";
const dBm = (v) => fmt(v, 1) + " dBm";

// ---------- pulses ----------
const SPEED = 150; // world units per second along the light path (the real light is about 2×10⁸ m/s)
const BIT = 7; // world units per bit on the drawing
const BIG = 100000;
const pulses = [...svg.querySelectorAll(".fl-pulse:not([data-c2])")].map((el) => ({ el, g0: +el.dataset.g0 }));
const c2 = [...svg.querySelectorAll(".fl-pulse[data-c2], .fl-glow")].map((el) => ({ el, a0: +el.dataset.a0, fixed: el.hasAttribute("data-fixed"), glow: el.classList.contains("fl-glow"), bend: +(el.closest("[data-bend]")?.dataset.bend ?? -1) }));
const bendGroups = [...svg.querySelectorAll("[data-bend]")];
const rayG = svg.querySelector("[data-ray]");
const leakG = svg.querySelector("[data-leak]");
const beams = Object.fromEntries([...svg.querySelectorAll("[data-beam]")].map((el) => [el.dataset.beam, el]));
const screens = Object.fromEntries([...svg.querySelectorAll("[data-screen]")].map((el) => [el.dataset.screen, el]));
const kmText = svg.querySelector(".fl-km");
const pdFace = svg.querySelector(".fl-pd");
const tiers = [...svg.querySelectorAll('[data-name^="mandrel.t"] .iso-edge')];
let bits = []; // { te, b, ch, k } in flight: emission time, bit, char index, bit index in the char
let anchorTe = 0;
let pattern = "0 " + BIG;
let txQueue = []; // characters waiting to be sent
let txFree = 0; // time when the laser is free for the next character
let clock = 0;
let rxBits = [];
let rxText = "";
let sentText = "";
let lastChar = null;
let frame = 0, last = 0, visible = false, touring = false, tourAt = 0;
let rxLevel = 0;
let charCount = 0;

const lengths = () => {
  const v = bendIndex();
  const spool = D.spoolVis + D.spoolPerKm * S.L;
  const gOut = D.gSpoolIn + spool;
  const gC2 = gOut + D.c2Lead;
  const total = D.totals[v];
  const gRX = gC2 + total + D.c2Tail;
  return { v, spool, gOut, gC2, total, gRX, gPD: gRX + D.pdGap };
};
function buildPattern() {
  // Bits sorted by emission time, newest first: the train laid out from its tail (newest bit's back edge).
  if (!bits.length) { pattern = "0 " + BIG; return; }
  const newest = bits.reduce((a, b) => (b.te > a.te ? b : a));
  anchorTe = newest.te;
  const list = [...bits].sort((a, b) => b.te - a.te);
  const runs = [];
  let pos = 0;
  let on = true;
  let cur = 0;
  const push = (state, len) => {
    if (len <= 0) return;
    if (state === on) cur += len;
    else { runs.push(cur); on = state; cur = len; }
  };
  for (const bit of list) {
    const start = SPEED * (anchorTe - bit.te);
    push(false, start - pos);
    push(bit.b === 1, BIT);
    pos = start + BIT;
  }
  runs.push(cur);
  if (!on) runs.push(0);
  if (runs.length % 2) runs.push(BIG); else runs[runs.length - 1] += BIG;
  pattern = runs.map((r) => r.toFixed(2)).join(" ");
  for (const p of pulses) p.el.style.strokeDasharray = pattern;
  for (const p of c2) p.el.style.strokeDasharray = pattern;
  for (const el of rayPulseEls) el.style.strokeDasharray = pattern;
}
const tailAt = (t) => SPEED * (t - anchorTe) - BIT;
function drawPulses(t) {
  const tail = tailAt(t);
  for (const p of pulses) p.el.style.strokeDashoffset = (-(tail - p.g0)).toFixed(2);
  const len = lengths();
  for (const p of c2) {
    if (p.bend >= 0 && p.bend !== len.v) continue;
    const a = p.a0 + (p.fixed ? len.total - D.totals[D.defaultBend] : 0);
    p.el.style.strokeDashoffset = (-(tail - (len.gC2 + a))).toFixed(2);
  }
  for (const el of rayPulseEls) el.style.strokeDashoffset = (-(tail - +el.dataset.g0)).toFixed(2);
}
// Is a lit bit at light-path position g at time t?
function litAt(g, t) {
  for (const bit of bits) {
    const head = SPEED * (t - bit.te);
    if (bit.b && g <= head && g > head - BIT) return true;
  }
  return false;
}

// ---------- the ray in the core, leaks, beams ----------
const at = (p) => iso(p, D.P);
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const axisPoint = (x, y) => add([x, D.Y1, D.Z1], D.SIDE, y);
let rayPulseEls = [];
function el(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent.append(node);
  return node;
}
function drawRay() {
  rayG.replaceChildren();
  leakG.replaceChildren();
  const { theta1, phi, tir } = B;
  const R = tir ? 1 : reflectance(MODEL.n1, S.n2, phi);
  const rc = D.core;
  const slope = Math.tan((theta1 * Math.PI) / 180);
  const x0 = D.win.c0;
  const x1 = D.win.c1;
  // Unfold the zigzag from the fibre face (centre, heading +SIDE).
  const yAt = (x) => {
    if (slope < 1e-6) return 0;
    const u = (x - D.focus) * slope + rc; // phase so that y = 0 at the face, rising
    const period = 4 * rc;
    const m = ((u % period) + period) % period;
    return m < 2 * rc ? m - rc : 3 * rc - m;
  };
  const bounces = [];
  if (slope > 1e-6) {
    const step = (2 * rc) / slope;
    let x = D.focus + rc / slope;
    let n = 0;
    while (x < x1) { if (x > x0) bounces.push({ x, n }); x += step; n++; }
    var before = bounces.length ? bounces[0].n : Math.floor((x1 - D.focus - rc / slope) / step) + 1;
  } else var before = 0;
  // The window shows what happens to the light that reaches it: its intensity is set to 1 at the window
  // (light launched outside the acceptance cone has already been losing some at every bounce before it).
  void before;
  let I = 1;
  const legs = [x0, ...bounces.map((b) => b.x), x1];
  rayPulseEls = [];
  for (let i = 0; i < legs.length - 1; i++) {
    const a = legs[i];
    const b = legs[i + 1];
    const pts = [a, (a + b) / 2, b].map((x) => at(axisPoint(x, yAt(x))));
    const d = "M" + pts.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L");
    const op = Math.max(0.04, I);
    el("path", { class: "fl-rayline", d, opacity: (0.55 * op).toFixed(3) }, rayG);
    rayPulseEls.push(el("path", { class: "fl-raypulse", d, pathLength: (b - a).toFixed(2), "data-g0": (b === a ? 0 : a - D.emit).toFixed(2), opacity: op.toFixed(3) }, rayG));
    if (i < bounces.length && !tir) {
      // Refracted ray leaving through the cladding at its true angle, fading out in the air.
      const bx = bounces[i].x;
      const side = Math.sign(yAt(bx - 0.01) || 1);
      const tt = refracted(MODEL.n1, S.n2, phi);
      const along = Math.tan((tt * Math.PI) / 180);
      const out = D.clad - rc;
      const p0 = at(axisPoint(bx, side * rc));
      const p1 = at(axisPoint(bx + out * along, side * D.clad));
      const p2 = at(axisPoint(bx + (out + 9) * along, side * (D.clad + 9)));
      const leak = (1 - R) * I;
      el("path", { class: "fl-leakline", d: `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)}L${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`, opacity: Math.min(1, 0.25 + leak * 1.6).toFixed(3) }, leakG);
      const grad = "fl-fade-" + i;
      const defs = el("defs", {}, leakG);
      const lg = el("linearGradient", { id: grad, gradientUnits: "userSpaceOnUse", x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] }, defs);
      el("stop", { offset: 0, "stop-color": "var(--fl-light)", "stop-opacity": Math.min(1, 0.25 + leak * 1.6).toFixed(3) }, lg);
      el("stop", { offset: 1, "stop-color": "var(--fl-light)", "stop-opacity": 0 }, lg);
      el("path", { class: "fl-leakfade", d: `M${p1[0].toFixed(2)} ${p1[1].toFixed(2)}L${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`, stroke: `url(#${grad})` }, leakG);
      I *= R;
    }
  }
  buildPattern();
}
const circle3 = (x, r, y = D.Y1, z = D.Z1, n = 40) => Array.from({ length: n }, (_, i) => {
  const t = (i / n) * Math.PI * 2;
  return at([x, y + r * Math.cos(t) * 0, z]).map((v, j) => v);
});
function cone(apex, baseX, r, y, z) {
  const pts = [at(apex)];
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    pts.push(at([baseX, y + r * Math.cos(t), z + r * Math.sin(t)]));
  }
  const hull = hullOf2(pts);
  return "M" + hull.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
}
function hullOf2(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper = [];
  for (const q of p.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
void circle3;
function drawBeams() {
  const [g0, g1, gr] = D.glass;
  const rb = Math.min(gr - 0.4, Math.max(0.15, (D.focus - g1) * Math.tan((S.theta0 * Math.PI) / 180)));
  beams.tx.replaceChildren();
  beams.ld.replaceChildren();
  beams.rx.replaceChildren();
  el("path", { class: "fl-cone", d: cone([D.focus, D.Y1, D.Z1], g1, rb, D.Y1, D.Z1) }, beams.tx);
  el("path", { class: "fl-cone", d: cone([D.emit, D.Y1, D.Z1], D.lensX - 2.6, Math.min(D.lensR - 0.3, rb * 0.9), D.Y1, D.Z1) }, beams.ld);
  const ra = Math.max(0.3, (D.rxFibre - D.pdFace) * Math.tan((B.acc * Math.PI) / 180));
  el("path", { class: "fl-cone", d: cone([D.rxFibre, D.YF, D.Z2], D.pdFace + 0.1, ra, D.YF, D.Z2) }, beams.rx);
}

// ---------- displays ----------
function screenText(name, lines) {
  const g = screens[name];
  if (!g) return;
  const w = +g.dataset.w;
  const h = +g.dataset.h;
  const key = JSON.stringify(lines);
  if (g.dataset.key === key) return;
  g.dataset.key = key;
  g.replaceChildren();
  const size = h / 3.4;
  lines.forEach((line, i) => {
    const t = el("text", { x: (w * 0.06).toFixed(2), y: (size * (1.15 + i * 1.12)).toFixed(2), "font-size": (line.size ? size * line.size : size).toFixed(2) }, g);
    for (const part of line.parts) {
      const span = el("tspan", part.on ? { class: "fl-on" } : {}, t);
      span.textContent = part.t;
    }
  });
}
const bin8 = (code) => code.toString(2).padStart(8, "0");
function drawScreens(t) {
  // TX: the message with the character on the laser, and its bits with the bit on the laser now.
  const sending = bits.filter((b) => b.te <= t && t < b.te + BIT / SPEED);
  const cur = sending[0];
  const shown = sentText.slice(-9);
  const offset = sentText.length - shown.length;
  const parts = [...shown].map((ch, i) => ({ t: ch === " " ? "·" : ch, on: cur && cur.ch === offset + i }));
  const code = cur ? cur.code : lastChar ? lastChar.charCodeAt(0) : null;
  const bitParts = code === null ? [{ t: "--------" }] : bin8(code).split("").map((c, i) => ({ t: c, on: cur && i === cur.k }));
  screenText("tx", [{ parts: parts.length ? parts : [{ t: "TYPE" }] }, { parts: bitParts }, { parts: [{ t: code === null ? "" : "ASCII " + code }], size: 0.8 }]);
  const recent = rxText.slice(-9);
  const pending = rxBits.length % 8 ? rxBits.slice(rxBits.length - (rxBits.length % 8)).join("") : "";
  screenText("rx", [{ parts: [{ t: recent || "_" }] }, { parts: [{ t: (pending + "--------").slice(0, 8) }] }, { parts: [{ t: dBm(B.Prx) }], size: 0.8 }]);
}

// ---------- keyboard ----------
const keyEls = Object.fromEntries([...svg.querySelectorAll("[data-key]")].map((el) => [el.dataset.key, el]));
const keyTimers = {};
function pressKey(ch) {
  const el = keyEls[ch.toUpperCase()];
  if (!el || still.matches) return;
  el.setAttribute("transform", D.keyDown);
  clearTimeout(keyTimers[ch]);
  keyTimers[ch] = setTimeout(() => el.removeAttribute("transform"), 160);
}

// ---------- sending ----------
function send(text) {
  for (const ch of text) if (ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) < 127) txQueue.push(ch);
  run();
}
function pump(t) {
  while (txQueue.length && txFree <= t + 1e-9) {
    const ch = txQueue.shift();
    pressKey(ch);
    const code = ch.charCodeAt(0);
    const start = Math.max(t, txFree);
    const index = sentText.length;
    sentText += ch;
    lastChar = ch;
    const salt = index;
    bitsOf(ch).forEach((b, k) => bits.push({ te: start + (k * BIT) / SPEED, b, ch: index, k, code, salt, got: false }));
    txFree = start + (8 * BIT) / SPEED + (2 * BIT) / SPEED; // two idle bit times between characters
    buildPattern();
  }
}
function receiveBits(t) {
  const len = lengths();
  let changed = false;
  for (const bit of bits) {
    if (bit.got) continue;
    if (SPEED * (t - bit.te) - BIT / 2 >= len.gPD) {
      bit.got = true;
      const flip = hash01(bit.k + 8 * bit.salt, 7) < B.ber;
      rxBits.push(flip ? 1 - bit.b : bit.b);
      if (rxBits.length % 8 === 0) {
        const last8 = rxBits.slice(-8);
        rxText += decode(last8);
        changed = true;
      }
    }
  }
  // Forget bits that have passed the photodiode by a long way.
  const before = bits.length;
  bits = bits.filter((bit) => !bit.got || SPEED * (t - bit.te) - BIT < len.gPD + 40);
  if (bits.length !== before) buildPattern();
  if (changed) edu?.refresh();
}
function setLights(t) {
  const len = lengths();
  const tx = litAt(10, t);
  const rx = litAt(len.gRX + 2, t);
  if (tx) stage.setAttribute("data-tx", ""); else stage.removeAttribute("data-tx");
  if (rx) stage.setAttribute("data-rx", ""); else stage.removeAttribute("data-rx");
  const level = Math.max(0.15, Math.min(1, 1 + B.Prx / 40));
  stage.style.setProperty("--fl-rx", (rx ? level : 0).toFixed(2));
  stage.style.setProperty("--fl-tx", tx ? "1" : "0");
  stage.style.setProperty("--fl-c2", Math.max(0.3, Math.min(1, 1 + (B.Prx + B.bend) / 50)).toFixed(2));
  stage.style.setProperty("--fl-c2b", Math.max(0.25, Math.min(1, 1 + B.Prx / 50)).toFixed(2));
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  clock += dt;
  if (touring && clock >= tourAt && !txQueue.length && !bits.length) { rxText = ""; rxBits = []; sentText = ""; send(S.msg); tourAt = Infinity; }
  if (touring && tourAt === Infinity && !bits.length && !txQueue.length) tourAt = clock + 1.6;
  pump(clock);
  receiveBits(clock);
  drawPulses(clock);
  setLights(clock);
  drawScreens(clock);
  writeReadout();
  const busy = bits.length || txQueue.length || touring;
  frame = visible && busy ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (still.matches) { settleNow(); return; }
  if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); }
}
// Reduced motion (and questions): deliver everything at once.
function settleNow() {
  pump(clock + 1e6);
  for (const bit of bits) bit.te -= 1e6;
  receiveBits(clock);
  bits = [];
  buildPattern();
  drawPulses(clock);
  setLights(clock);
  drawScreens(clock);
  writeReadout();
}
function writeReadout() {
  const sending = txQueue.length || bits.some((b) => !b.got);
  const text = sending ? "보내는 중 · 수신 " + dBm(B.Prx) : rxText ? "받음 “" + rxText.slice(-8) + "” · " + dBm(B.Prx) : "대기 · 수신 " + dBm(B.Prx);
  if (readout.textContent !== text) readout.textContent = text;
}

// ---------- model → drawing ----------
function update() {
  B = budget({ n2: S.n2, theta0: S.theta0, L: S.L, bend: bendIndex() }, D.wraps);
  const v = bendIndex();
  for (const g of bendGroups) { if (+g.dataset.bend === v) g.removeAttribute("display"); else g.setAttribute("display", "none"); }
  tiers.forEach((edge, i) => edge.setAttribute("data-tone", i === v ? "lit" : "mid"));
  stage.style.setProperty("--fl-glow", Math.min(0.95, B.bendLeak * 1.4).toFixed(3));
  if (kmText.textContent !== S.L + " km") kmText.textContent = S.L + " km";
  drawRay();
  drawBeams();
  drawPulses(clock);
  setLights(clock);
  drawScreens(clock);
  writeReadout();
  status();
}
function status() {
  if (!edu) return;
  const lead = B.tir ? "전반사 · " : "입사각이 커서 빛이 새어 나갑니다 · ";
  if (B.margin < -3) edu.status({ level: "danger", text: lead + "받는 빛 " + dBm(B.Prx) + "이 감도 " + dBm(MODEL.sens) + "보다 약합니다. 비트 오류율 약 " + sci(B.ber) + ": 글자가 깨집니다." });
  else if (B.margin < 3) edu.status({ level: "warn", text: lead + "수신 여유가 " + dB(B.margin) + "뿐입니다. 비트 오류율 약 " + sci(B.ber) + "." });
  else edu.status({ level: B.tir ? "ok" : "warn", text: lead + "수신 " + dBm(B.Prx) + " · 감도보다 " + dB(B.margin) + " 여유가 있습니다." });
}
function sci(x) {
  if (x < 1e-15) return "10⁻¹⁵ 미만";
  const e = Math.floor(Math.log10(x));
  const m = x / 10 ** e;
  const sup = String(e).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  return m.toFixed(1) + "×10" + sup;
}
function predicted() {
  // What the receiver will decode for the panel message, as the model says (questions read this).
  const b = bitsOf(S.msg);
  const salts = [...S.msg].map((_, i) => i);
  const got = b.map((bit, i) => (hash01((i % 8) + 8 * salts[Math.floor(i / 8)], 7) < B.ber ? 1 - bit : bit));
  return decode(got);
}

B = budget({ n2: S.n2, theta0: S.theta0, L: S.L, bend: bendIndex() }, D.wraps);
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.length === 1 && event.key.charCodeAt(0) >= 32 && event.key.charCodeAt(0) < 127) {
    event.preventDefault();
    edu?.takeOver();
    touring = false;
    send(event.key);
  }
});
stage.addEventListener("pointerdown", () => stage.focus());

edu = EDU.mount({
  stage,
  set(id, value) {
    if (id === "send") return;
    S[id] = id === "msg" || id === "bend" ? value : Number(value);
    update();
    edu?.refresh();
    run();
  },
  action(id) {
    if (id === "send") { touring = false; send(S.msg); }
    if (id === "clear") { rxText = ""; sentText = ""; rxBits = []; lastChar = null; drawScreens(clock); edu?.refresh(); }
  },
  pose(pose) {
    if (pose.reset) { txQueue = []; bits = []; rxBits = []; rxText = ""; sentText = ""; lastChar = null; buildPattern(); }
    if (pose.send) { touring = false; txQueue = []; bits = []; rxBits = []; rxText = ""; sentText = ""; buildPattern(); send(typeof pose.send === "string" ? pose.send : S.msg); }
    update();
    run();
  },
  tour(on) {
    touring = on;
    tourAt = clock + 0.4;
    run();
  },
  values() {
    const sendText = predicted();
    const code = S.msg.charCodeAt(0);
    const ones = bitsOf(S.msg).filter((b) => b).length;
    return {
      n1: { n: MODEL.n1, t: MODEL.n1.toFixed(2) },
      n2: { n: S.n2, t: S.n2.toFixed(3) },
      theta0: { n: S.theta0, t: degT(S.theta0) },
      thc: { n: B.thc, t: degT(B.thc) },
      na: { n: B.na, t: B.na.toFixed(3) },
      acc: { n: B.acc, t: degT(B.acc) },
      th1: { n: B.theta1, t: degT(B.theta1, 2) },
      phi: { n: B.phi, t: degT(B.phi) },
      tirText: B.tir ? "φ ≥ θc 이므로 전반사" : "φ < θc 이므로 일부가 새어 나감",
      tirWord: B.tir ? "전반사되는 모습" : "일부가 새어 나가는 모습",
      fc: { n: B.fc, t: Math.round(B.fc * 100) + "%" },
      launchLoss: { n: B.launchLoss, t: dB(B.launchLoss) },
      alpha: { n: MODEL.alpha, t: MODEL.alpha + " dB/km" },
      L: { n: S.L, t: S.L + " km" },
      fibre: { n: B.fibre, t: dB(B.fibre) },
      conn: { n: B.conn, t: dB(B.conn) },
      nconn: { n: MODEL.pairs, t: MODEL.pairs + "곳" },
      connEach: { n: MODEL.conn, t: dB(MODEL.conn) },
      bendR: { n: B.Rmm, t: B.Rmm + " mm" },
      wrap: { n: B.wrap, t: degT(B.wrap, 0) },
      bendTurn: { n: B.bendTurn, t: dB(B.bendTurn) },
      bend: { n: B.bend, t: dB(B.bend) },
      total: { n: B.total, t: dB(B.total) },
      Ptx: { n: MODEL.Ptx, t: dBm(MODEL.Ptx) },
      Prx: { n: B.Prx, t: dBm(B.Prx) },
      Prxmw: { n: mw(B.Prx), t: (mw(B.Prx) * 1000).toPrecision(3) + " µW" },
      sens: { n: MODEL.sens, t: dBm(MODEL.sens) },
      margin: { n: B.margin, t: dB(B.margin) },
      ber: { n: B.ber, t: sci(B.ber) },
      delay: { n: B.delay, t: B.delay.toFixed(1) + " µs" },
      msg: { n: S.msg.length, t: "“" + S.msg + "”" },
      got: { n: sendText === S.msg ? 1 : 0, t: "“" + sendText + "”" },
      code: { n: code, t: String(code) },
      bin: { n: code, t: bin8(code) },
      ascii: { n: code, t: [...S.msg].map((c) => "'" + c + "' " + c.charCodeAt(0) + " = " + bin8(c.charCodeAt(0))).join(", ") },
      ones: { n: ones, t: ones + "개" },
      nbits: { n: S.msg.length * 8, t: S.msg.length * 8 + "비트" },
      rx: { n: rxText.length, t: rxText ? "“" + rxText.slice(-12) + "”" : "(아직 없음)" },
    };
  },
});
update();
edu.refresh();
