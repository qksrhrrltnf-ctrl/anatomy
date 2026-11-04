
// Teaching edition of examples/arcade-cabinet/live.js.
// What changed: physics per coin from one model (g, rolling or sliding), a model-time clock with a time scale,
// a strobe trail, a close-up view, a signal-flow mode, a flickable coin-switch wire, a two-axis draggable stick,
// scenes for the step guide, Korean readouts, and the edu-kit adapter. The idle-tour restart timer is gone.
const D = __DATA__;
const P = D.P;
const K = { iso, pathOf, solidSvg, lineSvg, dotsSvg };
const PARTS = makeParts(K, G, P, { stick: D.stick });
const MODEL = (__MODEL__)(D.model);
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const $ = (sel) => svg.querySelector(sel);
const $$ = (sel) => [...svg.querySelectorAll(sel)];
const at = (p) => iso(p, P);
const readout = document.querySelector("[data-readout]");
const status = document.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let edu = null;

const el = {
  upper: $('[data-part="stick-upper"]'),
  lower: $('[data-part="stick-lower"]'),
  wire: $('[data-part="wire"]'),
  fall: $('[data-part="coin-fall"]'),
  chute: $('[data-part="coin-chute"]'),
  fly: $('[data-part="coin-fly"]'),
  pile: $('[data-part="pile"]'),
  screen: $('[data-part="screen"]'),
  raster: $('[data-part="raster"]'),
  dot: $('[data-part="dot"]'),
  test: $('[data-mode="test"]'),
  attract: $('[data-mode="attract"]'),
  steps: $$("[data-step]"),
  formation: $('[data-part="formation"]'),
  aliens: $$("[data-alien]"),
  ship: $('[data-part="ship"]'),
  shot: $('[data-part="shot"]'),
  boom: $('[data-part="boom"]'),
  score: $('[data-part="score"]'),
  insert: $('[data-part="insert"]'),
  start: $('[data-part="start"]'),
  credit: $('[data-part="credit"]'),
  meter: $('[data-part="meter"]'),
  glass: $('[data-part="glass"]'),
  stack: $$("[data-stack]"),
  fire: $('[data-button="fire"]'),
  p1: $('[data-button="p1"]'),
  lamps: $$(".ac-lamp"),
  leds: $$(".ac-led"),
  marquee: $$('[data-name="marquee.tube"], [data-name="marquee.plexi"], .ac-marquee'),
};
const routes = {};
for (const g of $$("[data-route]")) (routes[g.dataset.route] ??= []).push(g);
for (const list of Object.values(routes)) list.sort((a, b) => a.dataset.chunk - b.dataset.chunk);

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

// ---------------------------------------------------------------- settings (edu-kit params)
const S = { motion: "roll", g: 1, speed: 1, strobe: false, zoom: false, signal: false, stick: "center", theta: 30 };

const FLY = 0.9;
const INSERT = 0.34;
const MECH = 0.42;
const ROLL_AT = FLY + INSERT + MECH;
const FLOOR = MODEL.FLOOR;
const HEATER = 2.2;
const TEST = [1.0, 1.7, 2.3, 2.8];
const ATTRACT_AT = 3.6;
const HKHZ = 15.734;
const STROBE = 0.05; // s of model time between strobe images

const state = {
  power: 0,
  powerAt: -99,
  offAt: -99,
  credits: 0,
  creditsEnd: 0,
  meter: 4127,
  meterEnd: 4127,
  coins: [],
  trails: [], // the last two coins that landed, for the strobe trail (oldest first)
  pile: 0,
  pileSpots: [],
  stack: D.tray.count,
  stick: { x: 0, y: 0, tx: 0, ty: 0 },
  closed: "",
  fire: 0,
  fireHeld: 0,
  pulses: [],
  queue: [],
  wire: { x: 0, v: 0, push: 0 },
  game: null,
  clock: 0,
  hold: null,
  lastMode: "none",
  measured: null,
};

function newGame() {
  return { step: 0, dir: 1, offset: 0, frame: 0, alive: D_FORMATION.map(() => true), shipX: 112, shot: null, boom: null, score: 0, cool: 1.2, userAt: -99, respawn: 0 };
}
const D_FORMATION = SCREEN.FORMATION;

// model-time timers: they follow the time scale, so the cabinet never wakes before the coin reaches the wire
function later(seconds, fn) {
  if (still.matches) return fn();
  state.queue.push({ at: state.clock + seconds, fn });
  run();
}
function runQueue() {
  if (!state.queue.length) return;
  const due = state.queue.filter((q) => q.at <= state.clock);
  if (!due.length) return;
  state.queue = state.queue.filter((q) => q.at > state.clock);
  due.sort((a, b) => a.at - b.at).forEach((q) => q.fn());
}
// real milliseconds for a stretch of model time (for edu-kit's flash)
const realMs = (seconds) => Math.max(250, (seconds / (still.matches ? 1 : S.speed)) * 1000);

const STACK_AT = (n) => [D.tray.x, D.tray.y, 1.6 + (n - 1) * D.tray.step + 0.2];
const SLOT_OUT = [D.slot.x, D.slot.y + 9, D.slot.z];
const SLOT_IN = [D.slot.x, D.slot.y - 12, D.slot.z];
const SN = MODEL.SN;
const CS = MODEL.CS;
const chuteZ = MODEL.chuteZ;
const ROLL_FROM = MODEL.ROLL_FROM;
const END = MODEL.END;

function insertCoin({ t = 0, from = null } = {}) {
  if (state.stack <= 0) state.stack = D.tray.count;
  const start = from || STACK_AT(state.stack);
  if (!from) {
    state.stack--;
    showStack();
  }
  const k = MODEL.kin(S.g, S.motion);
  state.coins.push({ t, from: start, k, landAt: pileSpot(state.pile + state.coins.length, k.landY), switched: false, landed: false, rollAt: null, dropAt: null });
  edu?.refresh();
  run();
}
function pileSpot(i, landY) {
  const a = i * 2.39996;
  const r = Math.min(5, 1.1 * Math.sqrt(i));
  const lo = MODEL.BACK;
  const hi = D.box.y1 - 0.7 - PARTS.COIN_R - 0.3;
  return [D.slot.x + Math.cos(a) * r * 1.2, Math.max(lo, Math.min(hi, landY + Math.sin(a) * r)), FLOOR + Math.floor(i / 12) * PARTS.COIN_T];
}
function coinPose(c, time = c.t) {
  let t = time;
  const k = c.k;
  if (t < FLY) {
    const s = smooth(0, 1, t / FLY);
    const mid = [(c.from[0] + SLOT_OUT[0]) / 2, (c.from[1] + SLOT_OUT[1]) / 2, Math.max(c.from[2], SLOT_OUT[2]) + 26];
    const a = lerp3(c.from, mid, s);
    const b = lerp3(mid, SLOT_OUT, s);
    const p = lerp3(a, b, s);
    const turn = smooth(0.15, 0.85, t / FLY);
    return { layer: "fly", p, axis: norm(lerp3([0, 0, 1], [1, 0, 0], turn)), spin: s * 7, stage: "fly" };
  }
  t -= FLY;
  if (t < INSERT) return { layer: "fly", clip: "door", p: lerp3(SLOT_OUT, SLOT_IN, smooth(0, 1, t / INSERT)), axis: [1, 0, 0], spin: 7, stage: "insert" };
  t -= INSERT;
  if (t < MECH) return { layer: "none", stage: "mech" };
  t -= MECH;
  if (t < k.T) {
    const s = 0.5 * k.a * t * t;
    const y = ROLL_FROM - s * CS;
    const p = [D.slot.x, y - PARTS.COIN_R * SN, chuteZ(y) + PARTS.COIN_R * CS];
    // rolling turns the coin by s / R; a frictionless slide does not turn it at all
    return { layer: "chute", clip: p[1] + PARTS.COIN_R > D.mech.y0 ? "mech" : null, p, axis: [1, 0, 0], spin: 7 + (k.roll ? s / PARTS.COIN_R : 0), stage: "roll", tt: t, speed: k.a * t };
  }
  t -= k.T;
  const land = c.landAt;
  const spinEnd = 7 + (k.roll ? MODEL.ROLL_LEN / PARTS.COIN_R : 0);
  if (t < k.td) {
    const share = t / k.td;
    const p = [END[0] + (land[0] - END[0]) * share, END[1] + (land[1] - END[1]) * share, END[2] - k.v * SN * t - 0.5 * k.g * t * t];
    return { layer: "fall", p, axis: [1, 0, 0], spin: spinEnd + (k.roll ? t * 20 : 0), stage: "drop", tt: t };
  }
  const tl = t - k.td;
  const tip = smooth(0, 0.16, tl);
  const lie = [land[0], land[1], land[2] + PARTS.COIN_R * (1 - tip)];
  return { layer: "fall", p: lie, axis: norm(lerp3([1, 0, 0], [0, 0, 1], tip)), spin: spinEnd, settled: tl > 0.22, stage: "drop", tt: k.td };
}

const CLIP_DOOR = (() => {
  const a = at([D.slot.x, D.slot.y, -100]);
  const b = at([D.slot.x, D.slot.y, 300]);
  return `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${b[0] + 400} ${b[1]}L${a[0] + 400} ${a[1]}Z`;
})();
const CLIP_MECH = (() => {
  const a = at([D.slot.x, D.mech.y0, -100]);
  const b = at([D.slot.x, D.mech.y0, 300]);
  return `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${b[0] - 400} ${b[1]}L${a[0] - 400} ${a[1]}Z`;
})();
svg.querySelector("defs") || svg.insertAdjacentHTML("afterbegin", "<defs></defs>");
svg.querySelector("defs").insertAdjacentHTML("beforeend", `<clipPath id="ac-clip-door"><path d="${CLIP_DOOR}"/></clipPath><clipPath id="ac-clip-mech"><path d="${CLIP_MECH}"/></clipPath>`);

// A strobe image: the coin's body only (no face marks, so no new texture lines for the line-end check).
function ghost(pose, old) {
  const F = G.frameAlong(pose.p, pose.axis);
  const body = solidSvg(G.disc(-PARTS.COIN_T / 2, PARTS.COIN_T / 2, PARTS.COIN_R, F, P, { steps: 28 }), { tone: "hi" });
  return `<g class="ac-ghost"${old ? " data-old" : ""}>${body}</g>`;
}
// Images every STROBE s of model time from the moment the coin leaves the mech, up to `upto`.
function trailOf(c, upto, old, out) {
  const end = ROLL_AT + c.k.T + c.k.td;
  for (let t = ROLL_AT; t <= Math.min(upto, end) + 1e-9; t += STROBE) {
    const pose = coinPose(c, t);
    if (pose.layer === "chute" || pose.layer === "fall") out[pose.layer] += pose.clip ? `<g clip-path="url(#ac-clip-${pose.clip})">${ghost(pose, old)}</g>` : ghost(pose, old);
  }
}
function drawCoins() {
  const out = { fly: "", chute: "", fall: "" };
  if (S.strobe) {
    const live = state.coins.filter((c) => !c.landed);
    state.trails.forEach((c, i) => trailOf(c, Infinity, i < state.trails.length - 1 || live.length > 0, out));
    for (const c of live) trailOf(c, c.t, false, out);
  }
  for (const c of state.coins) {
    const pose = coinPose(c);
    if (pose.layer === "none") continue;
    const coin = PARTS.coin(pose.p, pose.axis, pose.spin);
    out[pose.layer] += pose.clip ? `<g clip-path="url(#ac-clip-${pose.clip})">${coin}</g>` : coin;
  }
  for (const key of ["fly", "chute", "fall"]) if (el[key].innerHTML !== out[key]) el[key].innerHTML = out[key];
}
function showStack() {
  el.stack.forEach((g, i) => (g.style.display = i < state.stack ? "" : "none"));
}
function drawPile() {
  let out = "";
  for (let i = 0; i < state.pile; i++) out += PARTS.coin(state.pileSpots[i] || pileSpot(i, MODEL.kin().landY), [0, 0, 1], i * 1.7, { lit: false });
  el.pile.innerHTML = out;
}

// ---------------------------------------------------------------- coin-switch wire
const WIRE_RATIO = D.wire.length / (D.slot.x - D.wire.from[0]);
const WIRE_MAX = 1.2 * WIRE_RATIO;
const wireTip = (x) => {
  const from = D.wire.from;
  const angle = Math.atan2(x, D.wire.length);
  return [from[0] + D.wire.length * Math.cos(angle), from[1], from[2] - D.wire.length * Math.sin(angle)];
};
// a wide transparent stroke over the thin wire, so a finger or a mouse can hit it (not an .iso-line)
const wireHit = (() => {
  const a = at(D.wire.from);
  const b = at(wireTip(0));
  return `<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}" fill="none" stroke="transparent" stroke-width="7" pointer-events="stroke" data-edu-hit/>`;
})();
function wireStep(dt, push) {
  const w = state.wire;
  if (push > w.x) {
    w.x = push;
    w.v = 0;
  } else {
    const k = 900;
    const c = 9;
    for (let i = 0; i < 4; i++) {
      const h = dt / 4;
      w.v += (-k * w.x - c * w.v) * h;
      w.x += w.v * h;
    }
    if (Math.abs(w.x) < 1e-3 && Math.abs(w.v) < 1e-2) (w.x = 0), (w.v = 0);
  }
  el.wire.innerHTML = lineSvg(pathOf([at(D.wire.from), at(wireTip(w.x))]), { tone: Math.abs(w.x) > 0.3 ? "lit" : "hi", free: "end" }) + wireHit;
  return w.x !== 0;
}
function wirePush() {
  let push = 0;
  const wz = D.wire.from[2];
  const wy = D.wire.from[1];
  for (const c of state.coins) {
    const pose = coinPose(c);
    if (pose.stage !== "roll") continue;
    const dy = wy - pose.p[1];
    if (Math.abs(dy) >= PARTS.COIN_R) continue;
    const low = pose.p[2] - Math.sqrt(PARTS.COIN_R ** 2 - dy * dy);
    push = Math.max(push, Math.min(1.2, wz - low));
  }
  return Math.max(0, push) * WIRE_RATIO;
}
function pulse(route, delay = 0, seconds = 0.5) {
  if (!routes[route]) return;
  state.pulses.push({ route, t: -delay, seconds });
  run();
}
function drawPulses(dt) {
  const hot = new Set();
  state.pulses = state.pulses.filter((p) => {
    p.t += dt;
    if (p.t < 0) return true;
    const list = routes[p.route];
    const at = (p.t / p.seconds) * (list.length + 1);
    list.forEach((g, i) => Math.abs(i - at + 0.5) < 1.1 && hot.add(g));
    return p.t < p.seconds * 1.25;
  });
  for (const list of Object.values(routes)) for (const g of list) g.toggleAttribute("data-hot", hot.has(g));
  return state.pulses.length > 0;
}

// ---------------------------------------------------------------- one pulse: what a coin (or a flicked wire) does
const SIGNAL = [
  { at: 0, ids: ["switch", "coin"], text: "① 동전이 코인 스위치 와이어를 밉니다. 접점이 닫혀 펄스가 1개 생깁니다." },
  { at: 0.7, ids: ["wire-meter", "meter"], route: "wire.meter", text: "② 펄스가 미터 배선을 따라 코인 미터로 갑니다. 숫자가 1 오릅니다." },
  { at: 1.6, ids: ["wire-coin", "edge", "pcb"], route: "wire.coin", text: "③ 같은 펄스가 코인 신호선을 따라 게임 보드로 갑니다. 보드가 크레딧을 1 셉니다." },
  { at: 2.6, ids: ["relay"], wake: true, text: "④ 첫 펄스가 전원 릴레이를 붙잡습니다(래치). 표시등이 켜집니다." },
  { at: 3.3, ids: ["mains", "xfmr", "psu"], route: "cable.mains", text: "⑤ 릴레이를 지난 교류가 변압기와 전원 공급 장치로 갑니다." },
  { at: 4.1, ids: ["power", "edge"], route: "cable.power", text: "⑥ 직류 전원이 보드로 들어갑니다. 보드가 자체 시험을 시작합니다." },
  { at: 4.9, ids: ["cable-video", "chassis"], route: "cable.video", text: "⑦ 보드가 만든 화면 신호가 모니터 섀시로 갑니다." },
  { at: 5.7, ids: ["flyback", "anode-lead", "neck"], routes: ["lead.anode", "cable.neck"], text: "⑧ 섀시가 브라운관에 높은 전압과 전자총 신호를 보냅니다. 히터가 데워지면 그림이 나타납니다." },
];
function bumpMeter() {
  state.meter++;
  el.meter.textContent = String(state.meter).padStart(6, "0");
  edu?.refresh();
}
function countPulse() {
  state.meterEnd++;
  state.creditsEnd++;
  const wake = !state.power && !state.waking;
  if (wake) state.waking = true;
  if (!S.signal) {
    // the original timing
    bumpMeter();
    pulse("wire.coin", 0, 0.45);
    pulse("wire.meter", 0, 0.25);
    if (wake) {
      later(0.42, () => {
        setPower(1);
        pulse("cable.power", 0, 0.5);
        pulse("cable.video", 0.5, 0.5);
      });
    }
    later(0.45, () => {
      state.credits++;
      showCredit();
      edu?.refresh();
    });
    return;
  }
  // signal-flow mode: the same events, spread out and named one at a time
  const steps = SIGNAL.filter((s) => wake || s.at < 2.5);
  steps.forEach((s, i) => {
    const next = steps[i + 1];
    const span = (next ? next.at : s.at + 1) - s.at;
    later(s.at, () => {
      if (s.route) pulse(s.route, 0, 0.8);
      for (const r of s.routes || []) pulse(r, 0, 0.8);
      if (s.route === "wire.meter") later(0.8, bumpMeter);
      if (s.route === "wire.coin") later(0.8, () => { state.credits++; showCredit(); edu?.refresh(); });
      if (s.wake) setPower(1);
      edu?.flash(s.ids, realMs(span));
      edu?.status({ level: "info", text: s.text });
    });
  });
  later((steps[steps.length - 1].at || 0) + 1.6, () => statusLine());
}

function setPower(on) {
  if (!!on === !!state.power) return;
  state.power = on ? 1 : 0;
  state.waking = false;
  if (on) {
    state.powerAt = state.clock;
    state.game = newGame();
  } else {
    state.offAt = state.clock;
    state.credits = 0;
    state.creditsEnd = 0;
    showCredit();
  }
  el.leds.forEach((g) => g.toggleAttribute("data-on", !!on));
  el.lamps.forEach((g) => g.toggleAttribute("data-on", !!on));
  status.textContent = on ? "동전이 들어왔습니다. 오락기가 켜지고 브라운관이 데워집니다." : "전원이 꺼졌습니다.";
  edu?.refresh();
  run();
}
function marqueeLevel(t) {
  if (!state.power) return 0;
  if (t < 0.06) return 0;
  if (t < 0.12) return 1;
  if (t < 0.24) return 0;
  if (t < 0.3) return 1;
  if (t < 0.42) return 0.2;
  return 1;
}
function picture() {
  const t = state.hold ?? state.clock - state.powerAt;
  const off = state.clock - state.offAt;
  let bright = 0;
  let sx = 1;
  let sy = 1;
  let dot = 0;
  let mode = "none";
  if (state.power) {
    bright = smooth(0.9, HEATER + 0.4, t);
    mode = t < ATTRACT_AT ? (t > 0.9 ? "test" : "none") : t < ATTRACT_AT + 0.08 ? "none" : "attract";
  } else if (off < 1.2 && state.offAt > 0) {
    bright = 1;
    mode = state.lastMode;
    if (off < 0.09) sx = 1 - 0.99 * smooth(0, 0.09, off);
    else if (off < 0.26) (sx = 0.01), (sy = 1 - smooth(0.09, 0.26, off));
    else (sx = 0), (sy = 0);
    dot = off < 0.2 ? 0 : 1 - smooth(0.26, 1.1, off);
  }
  if (state.power) state.lastMode = mode;
  el.raster.setAttribute("transform", `scale(${Math.max(sx, 0.001).toFixed(3)} ${Math.max(sy, 0.004).toFixed(3)})`);
  el.raster.style.opacity = (sx === 0 ? 0 : bright).toFixed(3);
  el.dot.style.opacity = dot.toFixed(3);
  el.test.style.display = mode === "test" ? "" : "none";
  el.attract.style.display = mode === "attract" ? "" : "none";
  el.steps.forEach((s, i) => (s.style.display = t > TEST[i] ? "" : "none"));
  el.glass.toggleAttribute("data-on", bright > 0.05 && sx > 0);
  const m = marqueeLevel(t);
  el.marquee.forEach((g) => g.toggleAttribute("data-on", m > 0.5));
  const folding = !state.power && off < 1.2 && state.offAt > 0;
  return { mode, t, folding, busy: state.power ? state.hold === null && t < ATTRACT_AT + 0.2 : folding };
}

const SHOT_SPEED = 220;
function gameStep(dt, mode) {
  const g = state.game;
  if (!g || mode !== "attract") return;
  g.step += dt;
  if (g.step > 0.32) {
    g.step = 0;
    g.offset += g.dir * 2;
    if (Math.abs(g.offset) >= 16) g.dir = -g.dir;
    g.frame = 1 - g.frame;
    el.formation.setAttribute("transform", `translate(${g.offset} 0)`);
    for (const a of el.aliens) {
      a.children[0].style.display = g.frame ? "none" : "";
      a.children[1].style.display = g.frame ? "" : "none";
    }
  }
  const user = state.clock - g.userAt < 3;
  if (user) g.shipX += state.stick.x * 420 * dt;
  else {
    const live = D_FORMATION.map((a, i) => (g.alive[i] ? a.x + 5 + g.offset : null)).filter((x) => x !== null);
    const target = live.length ? live[Math.floor((state.clock * 0.37) % live.length)] : 112;
    g.shipX += Math.max(-50 * dt, Math.min(50 * dt, target - g.shipX));
  }
  g.shipX = Math.max(14, Math.min(210, g.shipX));
  el.ship.setAttribute("transform", `translate(${g.shipX.toFixed(1)} ${SCREEN.SHIP_Y})`);
  g.cool -= dt;
  if (!g.shot && ((state.fire > 0 && user) || (!user && g.cool < 0))) {
    g.shot = { x: Math.round(g.shipX), y: SCREEN.SHIP_Y - 6 };
    g.cool = 0.9 + Math.random() * 0.8;
  }
  if (g.shot) {
    g.shot.y -= SHOT_SPEED * dt;
    let hit = -1;
    D_FORMATION.forEach((a, i) => {
      if (!g.alive[i] || hit >= 0) return;
      const x = a.x + g.offset;
      if (g.shot.x >= x && g.shot.x <= x + 10 && g.shot.y <= a.y + 8 && g.shot.y + 5 >= a.y) hit = i;
    });
    if (hit >= 0) {
      g.alive[hit] = false;
      el.aliens[hit].style.display = "none";
      const a = D_FORMATION[hit];
      g.boom = { x: a.x + g.offset, y: a.y, t: 0.22 };
      g.score += a.kind === "eye" ? 30 : 10;
      el.score.setAttribute("d", SCREEN.text(String(g.score).padStart(5, "0"), 16, 20));
      g.shot = null;
    } else if (g.shot.y < 30) g.shot = null;
  }
  el.shot.style.display = g.shot ? "" : "none";
  if (g.shot) el.shot.setAttribute("transform", `translate(${g.shot.x} ${g.shot.y.toFixed(1)})`);
  if (g.boom) {
    g.boom.t -= dt;
    el.boom.style.display = g.boom.t > 0 ? "" : "none";
    el.boom.setAttribute("transform", `translate(${g.boom.x} ${g.boom.y})`);
    if (g.boom.t <= 0) g.boom = null;
  }
  if (g.alive.every((a) => !a)) {
    g.respawn += dt;
    if (g.respawn > 1.2) {
      g.respawn = 0;
      g.alive = g.alive.map(() => true);
      el.aliens.forEach((a) => (a.style.display = ""));
    }
  }
  const blink = Math.floor(state.clock / 0.5) % 2 === 0;
  el.insert.style.display = !state.credits && blink ? "" : "none";
  el.start.style.display = state.credits && blink ? "" : "none";
  el.p1?.toggleAttribute("data-blink", state.credits > 0 && blink);
}
function resetGameScreen() {
  el.formation.setAttribute("transform", "translate(0 0)");
  el.aliens.forEach((a) => {
    a.style.display = "";
    a.children[0].style.display = "";
    a.children[1].style.display = "none";
  });
  el.score.setAttribute("d", SCREEN.text("00000", 16, 20));
  el.shot.style.display = "none";
  el.boom.style.display = "none";
  el.ship.setAttribute("transform", `translate(112 ${SCREEN.SHIP_Y})`);
  el.p1?.removeAttribute("data-blink");
}
let creditShown = -1;
function showCredit() {
  if (creditShown === state.credits) return;
  creditShown = state.credits;
  el.credit.setAttribute("d", SCREEN.text(`CREDIT ${Math.min(9, state.credits)}`, 120, 274));
}

// ---------------------------------------------------------------- joystick (two axes; the original used one)
const TILT = 0.21;
const SWITCH_NAME = { left: "왼쪽", right: "오른쪽", up: "화면 쪽", down: "몸 쪽" };
const STICK_TARGET = { center: [0, 0], left: [-1, 0], right: [1, 0], push: [0, -1], pull: [0, 1] };
const J = D.stick;
const PIVOT = G.add3(J.o, G.mul3(J.nc, J.pivot));
function ballAt(tx, tv) {
  const a = PARTS.axisOf(tx, tv);
  const t = -J.pivot / G.dot3(a, J.nc);
  return G.add3(PIVOT, G.mul3(a, t + 12.4));
}
let stickShown = null;
function stickStep(dt, calm) {
  const s = state.stick;
  const bx = s.x;
  const by = s.y;
  const f = calm ? 1 : 1 - Math.exp(-dt / 0.05);
  s.x += (s.tx - s.x) * f;
  s.y += (s.ty - s.y) * f;
  if (Math.abs(s.x - s.tx) < 1e-3) s.x = s.tx;
  if (Math.abs(s.y - s.ty) < 1e-3) s.y = s.ty;
  const key = s.x.toFixed(3) + "," + s.y.toFixed(3);
  if (key !== stickShown) {
    stickShown = key;
    const b = at(ballAt(s.x * TILT, s.y * TILT));
    el.upper.innerHTML = PARTS.stickUpper(s.x * TILT, s.y * TILT) + `<circle cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="9" fill="transparent" data-edu-hit/>`;
    el.lower.innerHTML = PARTS.stickLower(s.x * TILT, s.y * TILT);
    const closed = PARTS.switchesClosed(s.x * TILT, s.y * TILT);
    const now = closed.join(",");
    if (now !== state.closed) {
      const before = state.closed.split(",");
      state.closed = now;
      const fresh = closed.filter((id) => !before.includes(id));
      for (const id of fresh) {
        pulse(`wire.stick.${id}`, 0, 0.35);
        pulse("loom", 0.25, 0.6);
      }
      if (fresh.length && S.signal) {
        edu?.flash(["actuator", "wire-stick", "loom", "edge"], realMs(1.4));
        edu?.status({ level: "info", text: `${fresh.map((id) => SWITCH_NAME[id]).join("·")} 마이크로스위치가 닫혔습니다. 신호가 스틱 배선과 하네스를 따라 보드로 갑니다.` });
      }
      edu?.refresh();
    }
  }
  return s.x !== s.tx || s.y !== s.ty || bx !== s.x || by !== s.y;
}
function setStick(x, y, user = true) {
  const r = Math.hypot(x, y);
  if (r > 1) (x /= r), (y /= r);
  state.stick.tx = x;
  state.stick.ty = y;
  if (user && state.game) state.game.userAt = state.clock;
  run();
}
const stickName = (x, y) => (Math.hypot(x, y) < 0.5 ? "center" : Math.abs(x) >= Math.abs(y) ? (x > 0 ? "right" : "left") : y > 0 ? "pull" : "push");
const firePush = axisVector(P, D.stick.nc.map((v) => -v * 1.1));
function fireStep(dt) {
  state.fireHeld = Math.max(0, state.fireHeld - dt);
  const want = state.fireHeld > 0 ? 1 : 0;
  state.fire += (want - state.fire) * (1 - Math.exp(-dt / 0.03));
  if (Math.abs(want - state.fire) < 0.01) state.fire = want;
  el.fire.setAttribute("transform", state.fire ? `translate(${(firePush[0] * state.fire).toFixed(2)} ${(firePush[1] * state.fire).toFixed(2)})` : "");
  el.fire.toggleAttribute("data-down", state.fire > 0.5);
  return state.fire !== want || state.fireHeld > 0;
}

// ---------------------------------------------------------------- readout and status (Korean)
const f2 = (n) => n.toFixed(2);
const f3 = (n) => n.toFixed(3);
let phase = "";
function say(mode, t) {
  let text;
  const coin = state.coins.find((c) => !c.landed);
  if (coin) {
    const pose = coinPose(coin);
    const name = coin.k.roll ? "구름" : "미끄러짐";
    if (pose.stage === "fly") text = `동전 · 지름 ${FIXED.diameter.t} 25센트`;
    else if (pose.stage === "insert") text = "동전 · 투입구로 들어갑니다";
    else if (pose.stage === "mech") text = "메커 · 동전을 검사합니다";
    else if (pose.stage === "roll") text = `${name} · ${f2(pose.tt)} s · ${f2(MODEL.m(pose.speed))} m/s`;
    else text = `낙하 · ${f2(pose.tt)} s`;
  } else if (state.landing && state.clock - state.landing.at < 1.2) text = state.landing.wall ? `벽에 부딪힘 · 수평 ${MODEL.cm(state.landing.reach).toFixed(2)} cm` : `착지 · 수평 ${MODEL.cm(state.landing.reach).toFixed(2)} cm`;
  else if (!state.power) text = state.clock - state.offAt < 1.2 && state.offAt > 0 ? "꺼짐 · 화면이 선으로 접힙니다" : state.waking ? "스위치 · 미터 " + String(state.meter).padStart(6, "0") : `꺼짐 · ${state.pile ? "동전을 하나 더 넣으십시오" : "동전을 넣으십시오"}`;
  else if (mode === "test") text = t < TEST[1] ? "자체 시험" : t < TEST[2] ? "자체 시험 · RAM 정상" : "자체 시험 · RAM 정상 · ROM 정상";
  else if (mode !== "attract") text = `예열 · 히터 ${Math.min(HEATER, t).toFixed(1)} s`;
  else {
    const s = state.stick;
    const dir = s.tx < 0 ? " · 스틱 ←" : s.tx > 0 ? " · 스틱 →" : s.ty < 0 ? " · 스틱 ↑" : s.ty > 0 ? " · 스틱 ↓" : state.fireHeld > 0 ? " · 발사" : "";
    text = `크레딧 ${state.credits} · ${HKHZ} kHz${dir}`;
  }
  if (readout.textContent !== text) readout.textContent = text;
  const now = !state.power ? "off" : mode;
  if (now !== phase) {
    phase = now;
    if (now === "attract") status.textContent = `어트랙트 모드입니다. 크레딧 ${state.credits}.`;
    if (now === "test") status.textContent = "자체 시험 중입니다.";
    edu?.refresh();
  }
}
// the status line under the card when nothing is being narrated
function statusLine() {
  if (!edu) return;
  const k = MODEL.kin(S.g, S.motion);
  if (k.wallHit) edu.status({ level: "warn", text: "미끄러지는 동전은 수평으로 {dx}를 날아가려 하지만 금고 안쪽은 {wall}뿐입니다. 동전이 금고 뒤 벽에 부딪힙니다." });
  else if (S.speed < 1) edu.status({ level: "info", text: "슬로모션 {speed} · 판독값의 시간은 모델 시간입니다." });
  else edu.status(null);
}

// ---------------------------------------------------------------- close-up (viewBox)
const FULL = [0, 0, D.size[0], D.size[1]];
let box = FULL.slice();
let boxAnim = 0;
function setZoom(on, calm = still.matches) {
  const from = box.slice();
  const to = on ? D.zoom : FULL;
  cancelAnimationFrame(boxAnim);
  // the drawing normally spills past its viewBox (halo, shadow); a close-up must clip to the card
  const apply = (b) => {
    box = b;
    svg.setAttribute("viewBox", b.map((v) => +v.toFixed(2)).join(" "));
    stage.toggleAttribute("data-zoom", b.some((v, i) => Math.abs(v - FULL[i]) > 0.01));
  };
  if (calm) return apply(to.slice());
  const t0 = performance.now();
  const step = (now) => {
    const s = smooth(0, 1, (now - t0) / 450);
    apply(from.map((v, i) => v + (to[i] - v) * s));
    if (s < 1) boxAnim = requestAnimationFrame(step);
  };
  boxAnim = requestAnimationFrame(step);
}

// ---------------------------------------------------------------- loop
let frame = 0;
let last = 0;
let visible = false;
let touring = false; // the idle tour starts only when edu-kit says so, and stops for good once the reader acts
let tourClock = 0;
const TOUR = [
  [1.4, () => insertCoin()],
  [9.5, () => press("right", 0.5)],
  [10.4, () => press("left", 0.6)],
  [11.4, () => fireButton()],
  [12.6, () => press("right", 0.35)],
  [13.3, () => fireButton()],
  [15.2, () => insertCoin()],
  [24, () => setPower(0)],
  [27.5, null],
];
let tourIndex = 0;
function tourStep(dt) {
  tourClock += dt;
  while (tourIndex < TOUR.length && tourClock >= TOUR[tourIndex][0]) {
    const action = TOUR[tourIndex][1];
    tourIndex++;
    if (action) action();
    else {
      tourClock = 0;
      tourIndex = 0;
      state.pile = 0;
      state.pileSpots = [];
      state.trails = [];
      state.stack = D.tray.count;
      showStack();
      drawPile();
    }
  }
}
function press(dir, seconds) {
  setStick(dir === "left" ? -1 : 1, 0);
  later(seconds, () => setStick(0, 0, false));
}
function fireButton(seconds = 0.16) {
  state.fireHeld = seconds;
  if (state.game) state.game.userAt = state.clock;
  run();
}

function tick(now) {
  const real = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  const dt = real * (calm ? 1 : S.speed);
  state.clock += dt;
  if (touring) tourStep(dt);
  runQueue();
  for (const c of state.coins) {
    c.t += calm ? 10 : dt;
    const pose = coinPose(c);
    // stopwatch: the model clock when the coin is first seen rolling and first seen falling
    if (pose.stage === "roll" && c.rollAt === null) c.rollAt = state.clock;
    if (pose.stage === "drop" && c.dropAt === null && c.rollAt !== null) {
      c.dropAt = state.clock;
      state.measured = { T: c.dropAt - c.rollAt, step: dt };
      edu?.refresh();
    }
    if (!c.switched && (calm || (pose.stage === "roll" && pose.p[1] < D.wire.from[1]))) {
      c.switched = true;
      countPulse();
    }
    if (!c.landed && (pose.settled || calm)) {
      c.landed = true;
      state.pileSpots[state.pile] = c.landAt;
      state.pile++;
      state.trails = [...state.trails, c].slice(-2);
      // the physical landing point (the pile spreads coins a little around it so they do not stack in one spot)
      state.landing = { at: state.clock, reach: c.k.wallHit ? MODEL.WALL : c.k.reach, wall: c.k.wallHit };
      drawPile();
      edu?.refresh();
    }
  }
  state.coins = state.coins.filter((c) => !c.landed);
  drawCoins();
  const wireBusy = wireStep(dt, wirePush());
  const pulsing = drawPulses(dt);
  const { mode, t, busy } = picture();
  gameStep(dt, mode);
  showCredit();
  const sticking = stickStep(dt, calm);
  const firing = fireStep(dt);
  say(mode, t);
  const alive = touring || state.coins.length || state.queue.length || wireBusy || pulsing || busy || sticking || firing || (state.power && !calm) || (state.landing && state.clock - state.landing.at < 1.3);
  frame = visible && alive ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}
new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);

// ---------------------------------------------------------------- scenes (step guide and questions)
function clearAll() {
  state.coins = [];
  state.trails = [];
  state.queue = [];
  state.pulses = [];
  state.pile = 0;
  state.pileSpots = [];
  state.stack = D.tray.count;
  state.hold = null;
  state.waking = false;
  state.fireHeld = 0;
  state.measured = null;
  state.landing = null;
  state.wire.x = 0;
  state.wire.v = 0;
  if (state.power) {
    state.power = 0;
    el.leds.forEach((g) => g.removeAttribute("data-on"));
    el.lamps.forEach((g) => g.removeAttribute("data-on"));
  }
  state.offAt = -99;
  state.credits = 0;
  state.creditsEnd = 0;
  state.meterEnd = state.meter;
  state.game = null;
  state.stick.tx = STICK_TARGET[S.stick][0];
  state.stick.ty = STICK_TARGET[S.stick][1];
  resetGameScreen();
  showStack();
  drawPile();
  showCredit();
  drawPulses(0);
}
function powerOnAt(t, credits = 1) {
  state.power = 1;
  state.powerAt = state.clock - t;
  state.game = newGame();
  state.credits = credits;
  state.creditsEnd = credits;
  el.leds.forEach((g) => g.setAttribute("data-on", ""));
  el.lamps.forEach((g) => g.setAttribute("data-on", ""));
  showCredit();
}
function landed(n = 1) {
  const k = MODEL.kin(S.g, S.motion);
  for (let i = 0; i < n; i++) {
    state.pileSpots[state.pile] = pileSpot(state.pile, k.landY);
    state.pile++;
  }
  state.stack = Math.max(0, D.tray.count - n);
  showStack();
  drawPile();
}
const SCENES = {
  off() {},
  slot() { insertCoin(); },
  // from just before the coin leaves the mech
  chute() {
    state.stack = D.tray.count - 1;
    showStack();
    insertCoin({ t: ROLL_AT - 0.12, from: SLOT_OUT });
  },
  drop() {
    state.stack = D.tray.count - 1;
    showStack();
    insertCoin({ t: ROLL_AT + MODEL.kin(S.g, S.motion).T * 0.8, from: SLOT_OUT });
    state.coins[state.coins.length - 1].switched = true;
  },
  flick() { flick(); },
  power() {
    landed(1);
    countPulse();
  },
  test() {
    landed(1);
    powerOnAt(2.9);
    state.hold = 2.9;
  },
  attract() {
    landed(1);
    powerOnAt(ATTRACT_AT + 1.5);
  },
  poweroff() {
    landed(1);
    powerOnAt(ATTRACT_AT + 1.5);
    state.lastMode = "attract";
    picture();
    later(0.6, () => setPower(0));
  },
};
function scene(name) {
  // a question's second run keeps the first coin's strobe trail, faint, for comparison
  const keep = name === "chute" || name === "drop" ? state.coins.find((c) => !c.landed && c.t > ROLL_AT) || state.trails[state.trails.length - 1] : null;
  clearAll();
  if (keep) state.trails = [keep];
  (SCENES[name] || SCENES.off)();
  picture();
  statusLine();
  edu?.refresh();
  run();
}

// ---------------------------------------------------------------- direct handling
function flick() {
  state.wire.x = WIRE_MAX;
  state.wire.v = 0;
  countPulse();
  run();
}
stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key;
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (key === "c" || key === "C" || key === "5") {
    event.preventDefault();
    edu?.takeOver();
    insertCoin();
  } else if (key === "f" || key === "F") {
    event.preventDefault();
    edu?.takeOver();
    flick();
  } else if (arrows[key]) {
    event.preventDefault();
    edu?.takeOver();
    setStick(...arrows[key]);
    const name = stickName(...arrows[key]);
    S.stick = name;
    edu?.sync("stick", name);
  } else if (key === " " || key === "Enter") {
    event.preventDefault();
    edu?.takeOver();
    fireButton(0.5);
  } else if (key === "Escape") {
    event.preventDefault();
    edu?.takeOver();
    setPower(0);
  }
});
stage.addEventListener("keyup", (event) => {
  if (event.key.startsWith("Arrow")) {
    setStick(0, 0, false);
    S.stick = "center";
    edu?.sync("stick", "center");
  }
  if (event.key === " " || event.key === "Enter") state.fireHeld = Math.min(state.fireHeld, 0.06);
});
svg.addEventListener("click", (event) => {
  if (dragged) return;
  const hit = event.target.closest('[data-part="tray"], [data-name^="door"], [data-name^="coin.switch"], [data-part="wire"], [data-button="fire"]');
  if (!hit) return;
  edu?.takeOver();
  if (hit.matches('[data-name^="coin.switch"], [data-part="wire"]')) flick();
  else if (hit.matches('[data-button="fire"]')) fireButton(0.3);
  else insertCoin();
  stage.focus({ preventScroll: true });
});
// drag the ball: the pointer's offset from the ball, in the screen directions of world +x and the panel's slope
let drag = null;
let dragged = false;
const ORIGIN = at(ballAt(0, 0));
const along = (dir) => {
  const p = at(G.add3(ballAt(0, 0), dir));
  return [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];
};
const UX = along([1, 0, 0]);
const UV = along(J.dc);
const LEVER = G.len3(G.sub3(ballAt(0, 0), PIVOT));
function svgPoint(event) {
  const m = svg.getScreenCTM();
  if (!m) return null;
  const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}
el.upper.addEventListener("pointerdown", (event) => {
  if (event.button > 0) return;
  event.preventDefault();
  edu?.takeOver();
  drag = { id: event.pointerId };
  dragged = false;
  try {
    stage.setPointerCapture(event.pointerId);
  } catch {}
  stage.setAttribute("data-dragging", "");
});
stage.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const q = svgPoint(event);
  if (!q) return;
  dragged = true;
  const dx = q[0] - ORIGIN[0];
  const dy = q[1] - ORIGIN[1];
  // solve dx,dy = α·UX + β·UV (world units at the ball), then angle ≈ offset / lever length
  const det = UX[0] * UV[1] - UX[1] * UV[0];
  const alpha = (dx * UV[1] - dy * UV[0]) / det;
  const beta = (UX[0] * dy - UX[1] * dx) / det;
  setStick(alpha / LEVER / TILT, beta / LEVER / TILT);
  const name = stickName(state.stick.tx, state.stick.ty);
  if (name !== S.stick) {
    S.stick = name;
    edu?.sync("stick", name);
  }
});
const endDrag = (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  drag = null;
  stage.removeAttribute("data-dragging");
  setStick(0, 0, false);
  S.stick = "center";
  edu?.sync("stick", "center");
  setTimeout(() => (dragged = false), 0);
};
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

// ---------------------------------------------------------------- edu-kit adapter
const MOTION_NAME = { roll: "구름", slide: "미끄러짐" };
const STAGE_NAME = { fly: "투입구로 날아가는 중입니다", insert: "투입구로 들어가는 중입니다", mech: "메커 안에서 검사받고 있습니다", roll: "경사로를 내려가고 있습니다", drop: "금고로 떨어지고 있습니다" };
const v = (n, t) => ({ n, t });
// numbers the text quotes that are fixed by the drawing (same strings the build put in the first paint)
const FIXED = {
  height: v(MODEL.cm(D.height), `${Math.round(MODEL.cm(D.height))} cm`),
  diameter: v(PARTS.COIN_R * 2 * MODEL.MM, `${(PARTS.COIN_R * 2 * MODEL.MM).toFixed(2)} mm`),
  mechToBox: v(MODEL.cm(D.mech.z0 - D.box.z1), `${Math.round(MODEL.cm(D.mech.z0 - D.box.z1))} cm`),
  heater: v(HEATER, `${HEATER} s`),
  res: `${SCREEN.W} × ${SCREEN.H}`,
  khz: v(HKHZ, `${HKHZ} kHz`),
};
edu = EDU.mount({
  stage,
  set(id, value) {
    S[id] = value;
    if (id === "zoom") setZoom(value);
    if (id === "strobe") drawCoins();
    if (id === "stick") setStick(...STICK_TARGET[value]);
    if (id === "speed" || id === "motion" || id === "g") statusLine();
    if (id === "signal" && !value) statusLine();
    run();
  },
  action(id) {
    if (id === "insert") insertCoin();
    if (id === "flick") flick();
    if (id === "off") setPower(0);
  },
  pose(pose) {
    touring = false;
    if (pose.reset) return scene("off");
    if (pose.scene) scene(pose.scene);
  },
  tour(on) {
    touring = on;
    tourClock = 0;
    tourIndex = 0;
    if (on) scene("off");
    run();
  },
  values() {
    const k = MODEL.kin(S.g, S.motion);
    const th = MODEL.onSlope(S.theta, S.g, S.motion);
    const coin = state.coins.find((c) => !c.landed);
    const stageName = coin ? STAGE_NAME[coinPose(coin).stage] : state.pile ? "금고에 들어갔습니다" : "받침 위에 있습니다";
    const pic = picture();
    const screenMode = !state.power ? (pic.folding ? "선으로 접히고 있습니다" : "꺼져 있습니다") : pic.mode === "attract" ? "어트랙트 모드입니다" : pic.mode === "test" ? "자체 시험 중입니다" : "예열 중입니다";
    const closed = state.closed ? state.closed.split(",").map((id) => SWITCH_NAME[id]).join("·") : "없음";
    const m = state.measured;
    return {
      angle: v(MODEL.ANGLE_DEG, `${Math.round(MODEL.ANGLE_DEG)}°`),
      sin: v(SN, f2(SN)),
      g: v(MODEL.ms2(k.g), `${f2(MODEL.ms2(k.g))} m/s²`),
      motionName: MOTION_NAME[S.motion],
      onePlusBeta: v(1 + k.beta, String(1 + k.beta)),
      a: v(MODEL.ms2(k.a), `${f2(MODEL.ms2(k.a))} m/s²`),
      L: v(MODEL.cm(MODEL.ROLL_LEN), `${f2(MODEL.cm(MODEL.ROLL_LEN))} cm`),
      T: v(k.T, `${f3(k.T)} s`),
      Tmeas: m ? v(m.T, `${f3(m.T)} s`) : v(NaN, "아직 없음"),
      Tstep: m ? v(m.step, `${f3(m.step)} s`) : v(NaN, "—"),
      v: v(MODEL.m(k.v), `${f2(MODEL.m(k.v))} m/s`),
      h: v(MODEL.cm(MODEL.DROP), `${f2(MODEL.cm(MODEL.DROP))} cm`),
      td: v(k.td, `${f3(k.td)} s`),
      tf: v(k.tf, `${f3(k.tf)} s`),
      dx: v(MODEL.cm(k.reach), `${f2(MODEL.cm(k.reach))} cm`),
      wall: v(MODEL.cm(MODEL.WALL), `${f2(MODEL.cm(MODEL.WALL))} cm`),
      landing: k.wallHit ? "금고 뒤 벽에 부딪힙니다" : "금고 바닥에 떨어집니다",
      vImpact: v(MODEL.m(k.vImpact), `${f2(MODEL.m(k.vImpact))} m/s`),
      tSwitch: v(k.tSwitch, `${f3(k.tSwitch)} s`),
      mu: v(Math.tan(MODEL.ANGLE_DEG * Math.PI / 180) / 3, f3(Math.tan(MODEL.ANGLE_DEG * Math.PI / 180) / 3)),
      theta: v(S.theta, `${S.theta}°`),
      aTheta: v(MODEL.ms2(th.a), `${f2(MODEL.ms2(th.a))} m/s²`),
      TTheta: v(th.T, `${f3(th.T)} s`),
      vTheta: v(MODEL.m(th.v), `${f2(MODEL.m(th.v))} m/s`),
      muTheta: v(th.mu, f3(th.mu)),
      speed: v(S.speed, S.speed === 1 ? "1배" : `${S.speed}배`),
      meter: v(state.meterEnd, String(state.meterEnd).padStart(6, "0")),
      credits: v(state.creditsEnd, String(state.creditsEnd)),
      pile: v(state.pile, String(state.pile)),
      power: state.power || state.waking || state.creditsEnd > 0 ? "켜짐" : "꺼짐",
      coinStage: stageName,
      screenMode,
      switches: closed,
      count: v(D.tray.count, String(D.tray.count)),
      ...FIXED,
    };
  },
});

showStack();
drawPile();
showCredit();
wireStep(0, 0);
stickStep(0, true);
picture();
say("none", 0);
statusLine();
