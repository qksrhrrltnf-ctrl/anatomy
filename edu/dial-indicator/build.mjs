// Korean teaching edition of examples/dial-indicator (edu-kit). The drawing is the original's, with each
// part wrapped in a [data-piece] group; the live script drags instead of hovers, and adds zeroing (the face
// turns in its own plane), needle gearing (px per turn) and the plunger's damping as variables.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { eduPage, writePage } from "../kit/edu.mjs";
import content from "./ko.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const param = (id) => content.params.find((entry) => entry.id === id).value;

const WIDTH = 600;
const HEIGHT = 380;

const PLATE = { x: -128, y: -64, w: 262, d: 128, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

const MAG = { x: -112, y: -20, w: 44, d: 40, r: 3 };
const MAG_H = 24;
const POST = [-98, 0];
const POST_TOP = 122;
const CLAMP_Z = 100;

const DIAL = [58, 0];
const DIAL_R = 20;
const DIAL_Z = 82;
const DIAL_H = 10;
const DIAL_TOP = DIAL_Z + DIAL_H;
const PER_TURN = param("perTurn");
const TICKS = 50;
const STIFF = 420;
const DRAG = param("drag");

const RAIL_FROM = 2;
const RAIL_TO = 124;
const CARRIAGE = { x: -28, y: -24, w: 56, d: 48, r: 3 };
const CARRIAGE_Z = 3;
const CARRIAGE_TOP = 8;
const BLOCKS = [18, 14, 10];
const BLOCK_W = 15.6;
const STEP = 16;
const TIP_R = 2.6;
const CENTRE = -24 + BLOCK_W / 2;
const STOPS = BLOCKS.map((_, index) => DIAL[0] - CENTRE - STEP * index);
const REACH = [STOPS[STOPS.length - 1] - 6, STOPS[0] + 6];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [POST[0], POST[1], POST_TOP + 2], [DIAL[0] + DIAL_R, 0, DIAL_TOP]],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 42 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
// One named part. Grouping keeps the painter's order: the children are drawn exactly where they were.
const piece = (id, parts, extra = "") => `<g data-piece="${id}"${extra}>${[].concat(parts).join("")}</g>`;

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const base = [];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    base.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    base.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  base.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  base.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  base.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  base.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  out.push(piece("plate", base));
  const scale = [];
  const strip = { x: -110, y: PLATE.y + PLATE.d - 15, w: 230, d: 7, r: 1 };
  scale.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  scale.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  scale.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  out.push(piece("scale", scale));
  return out.join("");
}

function rails() {
  const out = [];
  for (const y of [-20, 15]) {
    out.push(S(k.slabOf({ x: RAIL_FROM, y, w: RAIL_TO - RAIL_FROM, d: 5, r: 1 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
    out.push(D([RAIL_FROM + 6, RAIL_TO - 6].map((x) => at([x, y + 2.5, 3])), { size: 0.4 }));
  }
  for (const x of [RAIL_FROM - 5, RAIL_TO]) {
    out.push(S(k.slabOf({ x, y: -23, w: 5, d: 46, r: 1.2 }, 0, 7, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([x + 2.5, -18, 7]), at([x + 2.5, 18, 7])], { size: 0.45 }));
  }
  return piece("rails", out);
}

function fixture() {
  const out = [];
  out.push(piece("base", [
    S(k.slabOf(MAG, 0, 11, P, 6, 0.8), { tone: "mid" }),
    S(k.slabOf(k.insetPlan(MAG, 0.8), 11, MAG_H - 11, P, 6, 0.8), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(MAG, 3), MAG_H, P), { tone: "faint" }),
    D([at([MAG.x + 5, MAG.y + 5, MAG_H]), at([MAG.x + 5, MAG.y + MAG.d - 5, MAG_H]), at([MAG.x + MAG.w - 5, MAG.y + 5, MAG_H])], { size: 0.45 }),
  ]));
  const knob = [MAG.x + 32, MAG.y + 28];
  out.push(piece("knob", [
    S(k.cylinder(knob[0], knob[1], 6, MAG_H, 4, P, 32), { tone: "mid" }),
    L(k.knurl(knob[0], knob[1], 6, MAG_H, MAG_H + 4, 36, P), { tone: "lo" }),
    L(k.lineOnTop([knob[0], knob[1]], [knob[0] + 6, knob[1]], MAG_H + 4, P), { tone: "hi" }),
    D([at([knob[0], knob[1], MAG_H + 4])], { size: 0.5, tone: "hi" }),
  ]));
  const clamp = { x: POST[0] - 7, y: POST[1] - 7, w: 14, d: 14, r: 2.5 };
  out.push(piece("post", [
    S(k.cylinder(POST[0], POST[1], 5, MAG_H, 4, P, 28), { tone: "mid" }),
    S(k.cylinder(POST[0], POST[1], 3.2, MAG_H + 4, CLAMP_Z - 4 - MAG_H - 4, P, 28), { tone: "mid", crease: "none" }),
    L([60, 80].map((z) => k.sideArc(POST[0], POST[1], 3.2, z, P, 16)).join(""), { tone: "faint" }),
  ]));
  out.push(piece("clamp", S(k.slabOf(clamp, CLAMP_Z - 4, 12, P, 4, 0.6), { tone: "mid" })));
  out.push(piece("post", [
    S(k.cylinder(POST[0], POST[1], 3.2, CLAMP_Z + 8, POST_TOP - CLAMP_Z - 8, P, 28), { tone: "mid", crease: "none" }),
    S(k.cylinder(POST[0], POST[1], 3.8, POST_TOP, 2, P, 28), { tone: "mid" }),
  ]));
  const arm = { x: POST[0] + 7, y: -3, w: DIAL[0] - DIAL_R - POST[0] - 7 + 2, d: 6, r: 2 };
  out.push(piece("arm", [
    S(k.slabOf(arm, CLAMP_Z, 4, P, 4, 0.5), { tone: "mid" }),
    D([at([arm.x + 4, 0, CLAMP_Z + 4]), at([arm.x + arm.w - 5, 0, CLAMP_Z + 4])], { size: 0.45 }),
  ]));
  const thumb = [clamp.x + 7, clamp.y + clamp.d + 3];
  out.push(piece("clamp", [
    S(k.slabOf({ x: thumb[0] - 1.4, y: clamp.y + clamp.d, w: 2.8, d: 3, r: 0.8 }, CLAMP_Z + 1, 4, P, 2), { tone: "mid", crease: "none" }),
    S(k.cylinder(thumb[0], thumb[1] + 1.4, 2.6, CLAMP_Z, 6, P, 20), { tone: "mid" }),
    L(k.knurl(thumb[0], thumb[1] + 1.4, 2.6, CLAMP_Z, CLAMP_Z + 6, 18, P), { tone: "lo" }),
  ]));
  return out.join("");
}

function carriage() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CARRIAGE, 3), CARRIAGE_Z, 0.1, P)}" style="filter:blur(4px)"/>`];
  out.push(piece("carriage", [
    S(k.slabOf(CARRIAGE, CARRIAGE_Z, CARRIAGE_TOP - CARRIAGE_Z, P, 5, 0.6), { tone: "mid" }),
    D([-22, -8, 8, 22].map((x) => at([x, CARRIAGE.y + CARRIAGE.d - 2.6, CARRIAGE_TOP])), { size: 0.4, tone: "lo" }),
    L(k.lineOnTop([CARRIAGE.x, -15.5], [CARRIAGE.x + CARRIAGE.w, -15.5], CARRIAGE_TOP, P), { tone: "faint" }),
    L(k.lineOnTop([CARRIAGE.x, 15.5], [CARRIAGE.x + CARRIAGE.w, 15.5], CARRIAGE_TOP, P), { tone: "faint" }),
  ]));
  BLOCKS.forEach((height, index) => {
    const plan = { x: -24 + STEP * index, y: -12, w: BLOCK_W, d: 24, r: 1 };
    out.push(piece(`block-${index + 1}`, [
      S(k.slabOf(plan, CARRIAGE_TOP, height, P, 3, 0.5), { tone: "hi", crease: "lo" }),
      L(k.planOutline(k.insetPlan(plan, 2), CARRIAGE_TOP + height, P, 3), { tone: "faint" }),
    ]));
  });
  const handle = [CARRIAGE.x + CARRIAGE.w - 8, CARRIAGE.y + CARRIAGE.d + 3];
  out.push(piece("handle", [
    S(k.slabOf({ x: handle[0] - 2, y: CARRIAGE.y + CARRIAGE.d - 1, w: 4, d: 4, r: 1 }, CARRIAGE_Z + 1, 3, P, 2), { tone: "mid", crease: "none" }),
    S(k.cylinder(handle[0], handle[1] + 1, 3, CARRIAGE_Z, 5, P, 20), { tone: "mid" }),
    L(k.knurl(handle[0], handle[1] + 1, 3, CARRIAGE_Z, CARRIAGE_Z + 5, 18, P), { tone: "lo" }),
  ]));
  return out.join("");
}

function plunger() {
  const out = [];
  out.push(S(k.cylinder(DIAL[0], DIAL[1], TIP_R, 0, 2.4, P, 20), { tone: "hi", lit: true }));
  out.push(S(k.cylinder(DIAL[0], DIAL[1], 1.4, 2.4, 50, P, 16), { tone: "hi", crease: "none", lit: true }));
  return out.join("");
}

function dial() {
  const out = [];
  const [x, y] = DIAL;
  out.push(piece("stem", [S(k.cylinder(x, y, 2.9, 54, DIAL_Z - 54, P, 20), { tone: "mid" }), L(k.sideArc(x, y, 2.9, 60, P, 12), { tone: "lo" })]));
  out.push(piece("arm", S(k.slabOf({ x: x - DIAL_R - 6, y: -4, w: 8, d: 8, r: 1.5 }, DIAL_Z + 2, CLAMP_Z - DIAL_Z - 2, P, 3, 0.4), { tone: "mid" })));
  out.push(piece("bezel", [
    S(k.cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 64, 0.8), { tone: "hi", crease: "lo" }),
    L(k.knurl(x, y, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3), { tone: "lo" }),
    L(k.sideArc(x, y, DIAL_R, DIAL_TOP - 3.4, P, 40), { tone: "faint" }),
  ]));
  const ticks = k.radialTicks(x, y, DIAL_R - 3, TICKS, 5, DIAL_TOP, [1.3, 2.8], P);
  // The face (ring, ticks and its printed mark) turns in its own plane when the bezel is set to zero.
  out.push(piece("face", [L(k.ring(x, y, DIAL_R - 2.2, DIAL_TOP, P, 64), { tone: "lo" }), L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" })]));
  out.push(piece("lock", [
    S(k.slabOf({ x: x + DIAL_R - 1, y: -2.4, w: 5, d: 4.8, r: 1.2 }, DIAL_Z + 2, 5, P, 3), { tone: "mid" }),
    S(k.slabOf({ x: x + DIAL_R + 3.6, y: -3.2, w: 2.6, d: 6.4, r: 1.2 }, DIAL_Z + 1.2, 6.6, P, 3), { tone: "mid" }),
  ]));
  out.push(piece("hub", L(k.ring(x, y, 1.6, DIAL_TOP, P, 16), { tone: "mid" })));
  out.push(piece("face", k.faceTextSvg(k.topMatrix([x, y + 9], DIAL_TOP, P, "x"), "0.01", { size: 2.4, tone: "lo", anchor: "middle" })));
  return out.join("");
}

const needleAt = (turn) => {
  const angle = turn * Math.PI * 2;
  const [x, y] = DIAL;
  return k.lineOnTop([x - Math.sin(angle) * 3.4, y + Math.cos(angle) * 3.4], [x + Math.sin(angle) * (DIAL_R - 4), y - Math.cos(angle) * (DIAL_R - 4)], DIAL_TOP + 0.2, P);
};

const startX = STOPS[0];
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    `정반 위의 다이얼 게이지입니다. 마그네틱 베이스에 기둥과 팔이 서 있고, 팔 끝의 다이얼에서 측정자가 아래로 내려옵니다. 측정자 아래에는 높이 ${BLOCKS.join(", ")} px인 게이지 블록 세 개를 실은 캐리지가 두 레일을 따라 미끄러집니다. 캐리지가 멈춘 곳에서 측정자는 아래 블록의 높이만큼 오르고 바늘도 같은 양만큼 돕니다.`,
  body: [
    plate(),
    rails(),
    fixture(),
    `<g data-part="carriage" transform="${k.translateAlong(P, [startX, 0, 0])}">${carriage()}</g>`,
    `<g data-part="plunger" transform="${k.translateAlong(P, [0, 0, CARRIAGE_TOP + BLOCKS[0]])}">${plunger()}</g>`,
    dial(),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(BLOCKS[0] / PER_TURN)}" style="stroke-width:1.1"/>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const BLOCKS = ${JSON.stringify(BLOCKS)};
const DIAL = ${JSON.stringify(DIAL)};
const WIDTH = ${WIDTH}, DIAL_R = ${DIAL_R}, DIAL_TOP = ${DIAL_TOP}, STEP = ${STEP}, BLOCK_W = ${BLOCK_W}, TIP_R = ${TIP_R}, BASE = ${CARRIAGE_TOP};
const TICKS = ${TICKS}, STIFF = ${STIFF};
let PER_TURN = ${PER_TURN}, DRAG = ${DRAG};
const REACH = ${JSON.stringify(REACH)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const carriage = svg.querySelector('[data-part="carriage"]');
const plunger = svg.querySelector('[data-part="plunger"]');
const needle = svg.querySelector('[data-part="needle"]');
const faces = [...svg.querySelectorAll('[data-piece="face"]')];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const stops = ${JSON.stringify(STOPS)};
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const heightUnder = (cx) => {
  let top = BASE;
  BLOCKS.forEach((height, index) => {
    const from = cx - 24 + STEP * index, to = from + BLOCK_W;
    if (to > DIAL[0] - TIP_R && from < DIAL[0] + TIP_R) top = Math.max(top, BASE + height);
  });
  return top;
};
const blockUnder = (cx) => BLOCKS.findIndex((_, index) => { const from = cx - 24 + STEP * index; return DIAL[0] >= from && DIAL[0] <= from + BLOCK_W; });
const needleAt = ${needleAt.toString().replace("k.lineOnTop", "lineOnTop")};

// The face's own plane: plan (x, y) at the dial top maps to the screen by origin O and axes AX, AY.
// Turning the face by a (the needle's sense) is O + M R(a) M^-1 (s - O): one SVG matrix.
const O = iso([DIAL[0], DIAL[1], DIAL_TOP], P);
const AX = (() => { const p = iso([DIAL[0] + 1, DIAL[1], DIAL_TOP], P); return [p[0] - O[0], p[1] - O[1]]; })();
const AY = (() => { const p = iso([DIAL[0], DIAL[1] + 1, DIAL_TOP], P); return [p[0] - O[0], p[1] - O[1]]; })();
const SLIDE = axisVector(P, [1, 0, 0]);
function faceMatrix(a) {
  const c = Math.cos(a), s = Math.sin(a);
  const det = AX[0] * AY[1] - AY[0] * AX[1];
  const m00 = AX[0] * c + AY[0] * s, m01 = -AX[0] * s + AY[0] * c;
  const m10 = AX[1] * c + AY[1] * s, m11 = -AX[1] * s + AY[1] * c;
  const a0 = (m00 * AY[1] - m01 * AX[1]) / det, c0 = (-m00 * AY[0] + m01 * AX[0]) / det;
  const b0 = (m10 * AY[1] - m11 * AX[1]) / det, d0 = (-m10 * AY[0] + m11 * AX[0]) / det;
  const e = O[0] - (a0 * O[0] + c0 * O[1]), f = O[1] - (b0 * O[0] + d0 * O[1]);
  return "matrix(" + [a0, b0, c0, d0, e, f].map((v) => v.toFixed(4)).join(" ") + ")";
}

let x = ${startX}, target = x, tip = { at: BASE + BLOCKS[0], rate: 0 };
let face = { at: 0, want: 0 };
let zero = 0, hidden = false, warnBetween = false;
// The idle tour starts only when edu-kit says so (adapter.tour), and stops for good once the reader acts.
let frame = 0, last = 0, clock = 0, touring = false, visible = false;
let syncedBlock = 1;
let edu = null;
const tourAt = (t) => stops[Math.floor(t / 2.2) % stops.length];
const zeroH = () => (zero ? BLOCKS[zero - 1] : null);
const fmt1 = (v) => (Math.abs(v) < 0.05 ? 0 : v).toFixed(1);
const signed = (v) => { const t = fmt1(Math.abs(v)); return t === "0.0" ? "0.0" : (v < 0 ? "−" : "+") + t; };
const trim = (v, digits) => String(+Number(v).toFixed(digits));
const faceWant = () => { const h0 = zeroH(); if (h0 === null) return 0; const turn = h0 / PER_TURN; return (turn - Math.floor(turn)) * Math.PI * 2; };
function aimFace() {
  let want = faceWant();
  while (want - face.at > Math.PI) want -= Math.PI * 2;
  while (want - face.at < -Math.PI) want += Math.PI * 2;
  face.want = want;
}

function draw() {
  carriage.setAttribute("transform", translateAlong(P, [x, 0, 0]));
  plunger.setAttribute("transform", translateAlong(P, [0, 0, tip.at]));
  needle.setAttribute("d", needleAt((tip.at - BASE) / PER_TURN));
  const t = Math.abs(face.at) < 1e-6 ? null : faceMatrix(face.at);
  for (const g of faces) {
    if (t === null) { if (g.hasAttribute("transform")) g.removeAttribute("transform"); }
    else if (g.getAttribute("transform") !== t) g.setAttribute("transform", t);
  }
  const index = blockUnder(x);
  const h = tip.at - BASE;
  const where = index < 0 ? "블록 사이" : "블록 " + (index + 1);
  const value = hidden ? "? px" : zero ? signed(h - zeroH()) + " px (블록 " + zero + " 기준)" : fmt1(h) + " px";
  const text = where + " · " + value;
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(h)));
  stage.setAttribute("aria-valuetext", text.replace(/ px/g, " 픽셀"));
}
// The panel follows the carriage's resting place: the block control when another block comes under the
// plunger, the formulas whenever the height under it changes (a drag can stop half on a block's edge).
let syncedH = heightUnder(target);
function syncBlock() {
  const index = blockUnder(target);
  const h = heightUnder(target);
  if (index >= 0 && index + 1 !== syncedBlock) {
    syncedBlock = index + 1;
    syncedH = h;
    edu?.sync("block", syncedBlock);
    status();
  } else if (h !== syncedH) {
    syncedH = h;
    edu?.refresh();
    status();
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { clock += dt; target = tourAt(clock); }
  x = calm ? target : x + (target - x) * (1 - Math.exp(-dt / 0.28));
  if (Math.abs(target - x) < 0.01) x = target;
  const want = heightUnder(x);
  const drag = calm ? 2 * Math.sqrt(STIFF) : DRAG;
  for (let i = 0; i < 4; i++) { tip.rate += ((want - tip.at) * STIFF - tip.rate * drag) * dt / 4; tip.at += tip.rate * dt / 4; }
  if (Math.abs(want - tip.at) < 0.005 && Math.abs(tip.rate) < 0.005) { tip.at = want; tip.rate = 0; }
  face.at = calm ? face.want : face.at + (face.want - face.at) * (1 - Math.exp(-dt / 0.18));
  if (Math.abs(face.want - face.at) < 1e-4) {
    const norm = ((face.want % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    face.at = face.want = norm;
  }
  draw();
  syncBlock();
  const settled = !touring && x === target && tip.rate === 0 && tip.at === want && face.at === face.want;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, REACH[0], REACH[1]); if (warnBetween) { warnBetween = false; status(); } syncBlock(); run(); };

function status() {
  if (!edu) return;
  if (warnBetween) return edu.status({ level: "warn", text: "측정자가 블록 사이에 있습니다. 블록 위에서 영점을 맞추십시오." });
  const h = heightUnder(target) - BASE;
  const n = h / PER_TURN;
  if (n >= 1 - 1e-9) return edu.status({ level: "info", text: "바늘이 " + Math.floor(n + 1e-9) + "바퀴 이상 돌았습니다. 회전수를 함께 세어야 높이를 바르게 읽습니다." });
  if (zero) return edu.status({ level: "ok", text: "영점: 블록 " + zero + "(" + fmt1(zeroH()) + " px) 기준입니다. 바늘은 이 블록과의 높이 차이를 가리킵니다." });
  edu.status(null);
}
// Zero on the block now under the plunger (a click on the dial, or the 0 key).
function zeroHere() {
  const index = blockUnder(target);
  if (index < 0) { warnBetween = true; status(); return; }
  edu?.setParam("zero", index + 1);
}

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

// Drag, not hover: hover belongs to the parts' tooltips. The pointer's travel along the rail's screen
// direction moves the carriage by the same distance; a click on the dial (no travel) sets zero.
let grab = null;
const DIAL_PARTS = '[data-piece="bezel"],[data-piece="face"],[data-piece="lock"],[data-piece="hub"],[data-part="needle"]';
stage.addEventListener("pointerdown", (event) => {
  if (event.button > 0) return;
  edu?.takeOver();
  grab = { id: event.pointerId, x: event.clientX, y: event.clientY, from: target, dial: !!event.target.closest?.(DIAL_PARTS), moved: false };
  stage.setPointerCapture?.(event.pointerId);
});
stage.addEventListener("pointermove", (event) => {
  if (!grab || grab.id !== event.pointerId) return;
  const dx = event.clientX - grab.x, dy = event.clientY - grab.y;
  if (!grab.moved && Math.hypot(dx, dy) < 4) return;
  if (!grab.moved) { grab.moved = true; stage.setAttribute("data-grab", ""); }
  const scale = svg.getBoundingClientRect().width / WIDTH;
  steer(grab.from + (dx * SLIDE[0] + dy * SLIDE[1]) / ((SLIDE[0] * SLIDE[0] + SLIDE[1] * SLIDE[1]) * scale));
});
const release = (event) => {
  if (!grab || grab.id !== event.pointerId) return;
  const click = !grab.moved && grab.dial && event.type === "pointerup";
  grab = null;
  stage.removeAttribute("data-grab");
  if (click) zeroHere();
};
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);
stage.addEventListener("keydown", (event) => {
  if (event.key === "0" || event.key === "z" || event.key === "Z") { event.preventDefault(); edu?.takeOver(); zeroHere(); return; }
  const here = stops.reduce((best, stop, index) => (Math.abs(stop - target) < Math.abs(stops[best] - target) ? index : best), 0);
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = Math.max(0, here - 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = Math.min(stops.length - 1, here + 1);
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = stops.length - 1;
  if (to === null) return;
  event.preventDefault();
  edu?.takeOver();
  steer(stops[to]);
});

edu = EDU.mount({
  stage,
  set(id, value) {
    if (id === "perTurn") { PER_TURN = value; aimFace(); }
    if (id === "zero") { zero = value; warnBetween = false; aimFace(); }
    if (id === "hide") hidden = !!value;
    if (id === "drag") DRAG = value;
    if (id === "block") { touring = false; syncedBlock = value; target = stops[value - 1]; }
    status();
    draw();
    run();
  },
  pose(pose) {
    touring = false;
    warnBetween = false;
    if (pose.reset) { target = stops[0]; syncedBlock = 1; }
    status();
    run();
  },
  tour(on) {
    touring = on;
    clock = 0;
    run();
  },
  values() {
    // where the carriage comes to rest, not where it is this frame
    const h = heightUnder(target) - BASE;
    const n = h / PER_TURN;
    const whole = Math.floor(n + 1e-9);
    let frac = n - whole;
    if (frac < 1e-9) frac = 0;
    const index = blockUnder(target);
    const h0 = zeroH();
    return {
      h: { n: h, t: fmt1(h) + " px" },
      perTurn: { n: PER_TURN, t: PER_TURN + " px" },
      turns: { n, t: n.toFixed(2) },
      whole: { n: whole, t: String(whole) },
      deg: { n: frac * 360, t: trim(frac * 360, 1) + "°" },
      ticks: { n: frac * TICKS, t: trim(frac * TICKS, 1) },
      count: { n: TICKS, t: String(TICKS) },
      div: { n: PER_TURN / TICKS, t: trim(PER_TURN / TICKS, 2) + " px" },
      block: { n: index + 1, t: index < 0 ? "블록 사이" : "블록 " + (index + 1) },
      h0: { n: h0 ?? NaN, t: h0 === null ? "—" : fmt1(h0) + " px" },
      rel: { n: h0 === null ? NaN : h - h0, t: h0 === null ? "—" : signed(h - h0) + " px" },
      cmp: h0 === null ? "영점을 고르면 계산합니다" : "Δh = h − h₀ = " + fmt1(h) + " px − " + fmt1(h0) + " px = " + signed(h - h0) + " px",
      drag: { n: DRAG, t: String(DRAG) },
      stiff: { n: STIFF, t: String(STIFF) },
      zeta: { n: DRAG / (2 * Math.sqrt(STIFF)), t: (DRAG / (2 * Math.sqrt(STIFF))).toFixed(2) },
      b1: { n: BLOCKS[0], t: fmt1(BLOCKS[0]) + " px" },
      b2: { n: BLOCKS[1], t: fmt1(BLOCKS[1]) + " px" },
      b3: { n: BLOCKS[2], t: fmt1(BLOCKS[2]) + " px" },
    };
  },
});
status();
draw();
`;

const CSS = `
.iso-stage{touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none}
.iso-stage[data-grab]{cursor:grabbing}
.iso-stage [data-piece="bezel"],.iso-stage [data-piece="face"],.iso-stage [data-piece="hub"]{cursor:pointer}
.iso-stage:focus{outline:none}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

const fmt = (v) => v.toFixed(1);
// First paint of the {key} templates in the card; the runtime refills them from adapter.values().
const values = {
  perTurn: `${PER_TURN} px`,
  div: `${+(PER_TURN / TICKS).toFixed(2)} px`,
  count: String(TICKS),
  b1: `${fmt(BLOCKS[0])} px`,
  b2: `${fmt(BLOCKS[1])} px`,
  b3: `${fmt(BLOCKS[2])} px`,
};
const page = {
  ...content.page,
  footer: `단위: 이 그림은 길이를 화면 픽셀(px)로 잽니다. 다이얼 판에 새겨진 0.01은 실제 다이얼 게이지에서 눈금 한 칸이 0.01 mm라는 표시이며, 이 그림의 모델과는 단위가 다릅니다. 이 그림의 기본값에서는 바늘 한 바퀴가 ${PER_TURN} px이고 한 바퀴의 눈금이 ${TICKS}칸이므로 한 칸은 ${+(PER_TURN / TICKS).toFixed(2)} px입니다. 실제 게이지 속의 랙과 기어는 그리지 않았습니다.`,
};
const card = { ...content.card, readout: `블록 1 · ${fmt(BLOCKS[0])} px` };

const stageHtml = `<div class="iso-stage" tabindex="0" role="slider" aria-label="다이얼 게이지: 그림을 끌거나 화살표 키로 캐리지를 옮깁니다. 다이얼을 누르거나 0 키를 누르면 지금 블록에서 영점을 맞춥니다." aria-valuemin="0" aria-valuemax="${Math.max(...BLOCKS)}" aria-valuenow="${BLOCKS[0]}">${svg}</div>`;
const html = eduPage({ content: { ...content, page, card }, theme, stage: stageHtml, css: CSS, script: kitScript() + live, values });
writePage(HERE, theme === "light" ? "dial-indicator-ko-light.html" : "dial-indicator-ko.html", html);
