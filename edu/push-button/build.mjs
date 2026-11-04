// Korean teaching edition of examples/push-button (edu-kit). The drawing is the original's;
// what changed: model-driven volts and ohms, latch mode, electrons on the wires, a filament that can burn out.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { eduPage, writePage } from "../kit/edu.mjs";
import content from "./ko.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 600;
const HEIGHT = 380;

const PLATE = { x: -120, y: -62, w: 240, d: 124, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const BASE = { x: -80, y: -20, w: 64, d: 40, r: 3 };
const BASE_H = 8;
const POSTS = [[-70, 0], [-26, 0]];
const POST_TOP = 24;
const STEM = [-48, 0];
const GAP = 7;
const BRIDGE = { x: -73, y: -5, w: 50, d: 10, r: 1.5 };
const BRIDGE_H = 2.5;
const BRIDGE_UP = POST_TOP + GAP;
const FRAME_TOP = 60;
const TOP_PLATE = { x: -82, y: -8, w: 68, d: 16, r: 2 };
const TOP_H = 4;
const CAP_UP = 76;
const CAP_R = 9;
const CAP_H = 6;
const SPRING_R = 4.6;
const SPRING_TURNS = 6;

const HOLDER = { x: 40, y: -44, w: 36, d: 28, r: 3 };
const CELL = [58, -30];
const CELL_R = 11;
const CELL_Z = 4;
const CELL_H = 44;

const SOCKET_BASE = { x: 52, y: 20, w: 28, d: 24, r: 3 };
const SOCKET = [66, 32];
const SOCKET_Z = 6;
const SOCKET_H = 9;
const GLOBE_R = 10;
const GLOBE_Z = SOCKET_Z + SOCKET_H + GLOBE_R - 1;

// The model: one source for the page, the readout, the engraved labels and the Korean text.
const param = (id) => content.params.find((entry) => entry.id === id).value;
const VOLTS = param("V");
const OHMS = param("R");
const AMPS = VOLTS / OHMS;
const RATED_W = 1.8; // the bulb's rated power: 3 V across 5 Ω
const BURN_AT = 2; // the filament breaks above this many times its rated power...
const BURN_TIME = 0.9; // ...held for this long (s)
const SPEED_PER_AMP = 40; // electron dots: viewBox px per second per ampere
const SPACING = 11; // electron dots: gap along the wire, viewBox px
const fmtV = (v) => `${+v.toFixed(1)} V`;
const fmtA = (a) => (a === 0 ? "0 A" : `${a < 0.1 ? a.toFixed(3) : a.toFixed(2)} A`);
const fmtW = (w) => `${w < 10 ? w.toFixed(2) : w.toFixed(1)} W`;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [STEM[0], STEM[1], CAP_UP + CAP_H + 2], [SOCKET[0], SOCKET[1], GLOBE_Z + GLOBE_R]],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 42 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const piece = (id, html) => `<g data-piece="${id}">${html}</g>`;
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 22).sort((a, b) => depth(...a) - depth(...b))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -112, y: PLATE.y + PLATE.d - 13, w: 150, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  const label = { x: 50, y: PLATE.y + PLATE.d - 15, w: 58, d: 9, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid", crease: "none" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 4, label.y + 6], 0.8, P, "x"), `${fmtV(VOLTS)} · ${fmtA(AMPS)}`, { size: 3.4, tone: "lo" }).replace("<text ", '<text data-pb-label="plate" '));
  out.push(D([at([label.x + 2, label.y + 4.5, 0.8]), at([label.x + label.w - 2, label.y + 4.5, 0.8])], { size: 0.4 }));
  return out.join("");
}

const WIRES = [
  [[74, -20, 4], [80, -12, 0.4], [96, -12, 0.4], [96, 52, 0.4], [76, 52, 0.4], [76, 44, 6]],
  [[56, 44, 6], [56, 52, 0.4], [-26, 52, 0.4], [-26, 28, 0.4], [-26, 20, BASE_H]],
  [[-70, 20, BASE_H], [-70, 30, 0.4], [-100, 30, 0.4], [-100, -42, 0.4], [30, -42, 0.4], [30, -20, 0.4], [42, -20, 4]],
];

// Electrons run from the cell's (−) terminal round the loop to its (+) terminal: wire 2 backwards,
// across the bridge, wire 1 backwards, through the bulb, wire 0 backwards. Each segment's dots are
// drawn in the slot of what carries them (a wire, or the moving bridge), so depth order holds.
const BRIDGE_TOP = BRIDGE_UP + BRIDGE_H;
const ELECTRON_ROUTES = [
  [...WIRES[2]].reverse(),
  [[POSTS[0][0], 0, BRIDGE_TOP], [POSTS[1][0], 0, BRIDGE_TOP]],
  [...WIRES[1]].reverse(),
  [...WIRES[0]].reverse(),
];
let runFrom = 0;
const SEGS = ELECTRON_ROUTES.map((route) => {
  const pts = route.map((point) => at(point).map((value) => Math.round(value * 100) / 100));
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const seg = { pts, cum, len: cum[cum.length - 1], from: runFrom };
  runFrom += seg.len;
  return seg;
});
// Shared by the build (first paint) and the page (every frame): where dot j of a segment sits for a phase.
function chargeAt(seg, j, phase, spacing) {
  const u = ((((phase - seg.from) % spacing) + spacing) % spacing) + j * spacing;
  if (u > seg.len) return null;
  let i = 1;
  while (i < seg.pts.length - 1 && seg.cum[i] < u) i++;
  const a = seg.pts[i - 1];
  const b = seg.pts[i];
  const t = (u - seg.cum[i - 1]) / (seg.cum[i] - seg.cum[i - 1] || 1);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function charges(index) {
  const seg = SEGS[index];
  const count = Math.ceil(seg.len / SPACING) + 1;
  const dots = Array.from({ length: count }, (_, j) => {
    const p = chargeAt(seg, j, 0, SPACING);
    return p ? `<circle class="pb-charge" cx="${p[0].toFixed(2)}" cy="${p[1].toFixed(2)}" r="1.45"/>` : `<circle class="pb-charge" cx="0" cy="0" r="1.45" display="none"/>`;
  });
  return `<g class="pb-charges" data-seg="${index}" aria-hidden="true">${dots.join("")}</g>`;
}
const CHARGE_SLOT = { 2: 0, 1: 2, 0: 3 }; // wire index → electron segment

function wires() {
  return WIRES.map((route, index) => {
    const points = route.map(at);
    return `<g class="pb-wire" data-wire="${index}">${k.wireSvg(points[0], points[points.length - 1], { via: points.slice(1, -1), tone: "lo", size: 1.1 })}</g>${charges(CHARGE_SLOT[index])}`;
  }).join("");
}

function holder() {
  const out = [];
  out.push(S(k.slabOf(HOLDER, 0, 4, P, 4, 0.6), { tone: "lo" }));
  out.push(S(k.cylinder(CELL[0], CELL[1], CELL_R + 2, 4, 2, P, 40), { tone: "lo" }));
  for (const [x, y] of [[42, -20], [74, -20]]) {
    out.push(L(k.ring(x, y, 2.4, 4, P, 16), { tone: "mid" }));
    out.push(D([at([x, y, 4])], { size: 0.55 }));
  }
  return out.join("");
}

function cell() {
  const out = [];
  const [x, y] = CELL;
  out.push(S(k.cylinder(x, y, CELL_R, CELL_Z, CELL_H, P, 48, 0.8), { tone: "mid" }));
  out.push(L([CELL_Z + 9, CELL_Z + CELL_H - 8].map((z) => k.sideArc(x, y, CELL_R, z, P, 32)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, 4, CELL_Z + CELL_H, 3, P, 24), { tone: "hi" }));
  out.push(k.faceTextSvg(k.topMatrix([x - 3, y + 8], CELL_Z + CELL_H, P, "x"), fmtV(VOLTS), { size: 2.6, tone: "lo" }).replace("<text ", '<text data-pb-label="cell" '));
  out.push(S(k.slabOf({ x: x + CELL_R - 0.5, y: y + 6, w: 2, d: 4, r: 0.5 }, 4, CELL_H + 2, P, 2), { tone: "hi", crease: "none" }));
  out.push(S(k.slabOf({ x: x + 4, y: y + 6.5, w: CELL_R - 3.5, d: 3, r: 0.5 }, CELL_Z + CELL_H + 1.4, 1.2, P, 2), { tone: "hi", crease: "none" }));
  return out.join("");
}

function socket() {
  const out = [];
  const [x, y] = SOCKET;
  out.push(S(k.slabOf(SOCKET_BASE, 0, SOCKET_Z, P, 4, 0.6), { tone: "mid" }));
  for (const [tx, ty] of [[56, 41], [76, 41]]) {
    out.push(L(k.ring(tx, ty, 2.2, SOCKET_Z, P, 16), { tone: "mid" }));
    out.push(D([at([tx, ty, SOCKET_Z])], { size: 0.55 }));
  }
  out.push(S(k.cylinder(x, y, 6.5, SOCKET_Z, SOCKET_H, P, 36, 0.6), { tone: "mid" }));
  out.push(L([2, 4, 6].map((dz) => k.sideArc(x, y, 6.5, SOCKET_Z + dz, P, 24)).join(""), { tone: "lo" }));
  return out.join("");
}

function globe() {
  const c = at([SOCKET[0], SOCKET[1], GLOBE_Z]);
  const r = P.scale * GLOBE_R;
  const neck = at([SOCKET[0], SOCKET[1], SOCKET_Z + SOCKET_H]);
  const f0 = [c[0] - r * 0.32, c[1] + r * 0.05];
  const f1 = [c[0] + r * 0.32, c[1] + r * 0.05];
  const zig = Array.from({ length: 9 }, (_, i) => [f0[0] + ((f1[0] - f0[0]) * i) / 8, f0[1] + (i % 2 ? -1.6 : 1.6)]);
  // A burnt-out filament: the zigzag parted in the middle, both ends sagging.
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const sag = ([x, y], dy) => [x, y + dy];
  const broken = k.pathOf([...zig.slice(0, 3), sag(zig[3], 0.8), sag(lerp(zig[3], zig[4], 0.1), 4.6)]) + k.pathOf([sag(lerp(zig[4], zig[5], 0.9), 5), sag(zig[5], 1), ...zig.slice(6)]);
  const supports = `M${(neck[0] - 2.4).toFixed(1)} ${neck[1].toFixed(1)}L${f0[0].toFixed(1)} ${f0[1].toFixed(1)}M${(neck[0] + 2.4).toFixed(1)} ${neck[1].toFixed(1)}L${f1[0].toFixed(1)} ${f1[1].toFixed(1)}`;
  return `<g class="pb-globe"><circle class="pb-glass" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r.toFixed(1)}"/><path class="iso-line" data-tone="lo" d="${supports}"/><path class="iso-line pb-filament" data-tone="mid" data-free="both" d="${k.pathOf(zig)}"/><path class="iso-line pb-filament-broken" data-tone="mid" data-free="both" d="${broken}"/><path class="iso-line" data-tone="faint" data-free="both" d="M${(c[0] - r * 0.55).toFixed(1)} ${(c[1] - r * 0.35).toFixed(1)}Q${(c[0] - r * 0.4).toFixed(1)} ${(c[1] - r * 0.7).toFixed(1)} ${(c[0] - r * 0.05).toFixed(1)} ${(c[1] - r * 0.72).toFixed(1)}"/></g>`;
}

function glow() {
  const c = at([SOCKET[0], SOCKET[1], GLOBE_Z]);
  return `<defs><radialGradient id="pb-glow-g"><stop offset="0" class="pb-stop-0"/><stop offset=".35" class="pb-stop-1"/><stop offset="1" class="pb-stop-2"/></radialGradient></defs><circle class="pb-glow" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${(P.scale * 34).toFixed(1)}" fill="url(#pb-glow-g)"/>`;
}

function switchBase() {
  const out = [];
  out.push(S(k.slabOf(BASE, 0, BASE_H, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 3), BASE_H, P, 4), { tone: "faint" }));
  for (const [x] of POSTS) {
    out.push(L(k.ring(x, 20 - 3, 2.4, BASE_H, P, 16), { tone: "mid" }));
    out.push(D([at([x, 17, BASE_H])], { size: 0.55 }));
  }
  return out.join("");
}

function posts() {
  return POSTS.map(([x, y]) => S(k.cylinder(x, y, 4.5, BASE_H, POST_TOP - 2 - BASE_H, P, 28), { tone: "mid" }) + S(k.cylinder(x, y, 5, POST_TOP - 2, 2, P, 28), { tone: "hi" })).join("");
}

const column = (x0) => S(k.slabOf({ x: x0, y: -6, w: 6, d: 12, r: 1.2 }, BASE_H, FRAME_TOP - BASE_H, P, 3, 0.5), { tone: "mid" });
const COLUMNS = [-80, -22].map((x0) => ({ x0, depth: depth(x0 + 3, 0, 30) })).sort((a, b) => a.depth - b.depth);

function lower() {
  const out = [];
  out.push(S(k.slabOf(BRIDGE, BRIDGE_UP, BRIDGE_H, P, 3, 0.5), { tone: "hi", lit: true }));
  out.push(D([at([BRIDGE.x + 4, 0, BRIDGE_UP + BRIDGE_H]), at([BRIDGE.x + BRIDGE.w - 4, 0, BRIDGE_UP + BRIDGE_H])], { size: 0.5, tone: "lo" }));
  out.push(charges(1)); // electrons crossing the bridge, under the stem
  out.push(S(k.cylinder(STEM[0], STEM[1], 2.2, BRIDGE_UP + BRIDGE_H, CAP_UP - BRIDGE_UP - BRIDGE_H, P, 18), { tone: "hi", crease: "none" }));
  return out.join("");
}

function topPlate() {
  const out = [S(k.slabOf(TOP_PLATE, FRAME_TOP, TOP_H, P, 3, 0.5), { tone: "mid" })];
  out.push(L(k.ring(STEM[0], STEM[1], 3.2, FRAME_TOP + TOP_H, P, 20), { tone: "lo" }));
  out.push(D([at([TOP_PLATE.x + 3, 0, FRAME_TOP + TOP_H]), at([TOP_PLATE.x + TOP_PLATE.w - 3, 0, FRAME_TOP + TOP_H])], { size: 0.5 }));
  return out.join("");
}

function springPath(capBottom) {
  const from = FRAME_TOP + TOP_H + 0.6;
  const to = capBottom - 0.6;
  return Array.from({ length: SPRING_TURNS }, (_, i) => k.ring(STEM[0], STEM[1], SPRING_R, from + ((to - from) * (i + 0.5)) / SPRING_TURNS, P, 24)).join("");
}

function cap() {
  const out = [];
  out.push(S(k.cylinder(STEM[0], STEM[1], CAP_R, CAP_UP, CAP_H, P, 48, 1), { tone: "hi", lit: true }));
  out.push(L(k.knurl(STEM[0], STEM[1], CAP_R, CAP_UP + 0.6, CAP_UP + CAP_H - 1, 54, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(STEM[0], STEM[1], CAP_R - 2.6, CAP_UP + CAP_H, P, 40), { tone: "faint" }));
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "작업대 위의 누름 버튼이 전지 받침의 전지, 소켓의 작은 전구와 함께 하나의 고리로 전선에 이어져 있습니다. 버튼의 열린 틀 안에서 용수철이 막대와 구리 다리판을 두 접점 기둥 위로 띄워 둡니다. 누름단추를 누르면 다리판이 두 기둥에 닿아 회로가 닫히고 전구가 켜집니다.",
  body: [
    plate(),
    glow(),
    piece("wires", wires()),
    piece("cell", holder() + cell()),
    piece("frame", switchBase() + column(COLUMNS[0].x0)),
    piece("contacts", posts()),
    `<g data-piece="bridge" data-move>${lower()}</g>`,
    piece("frame", column(COLUMNS[1].x0) + topPlate()),
    `<g data-piece="spring"><path class="iso-line pb-spring" data-tone="mid" d="${springPath(CAP_UP)}"/></g>`,
    `<g data-piece="cap" data-move>${cap()}</g>`,
    piece("bulb", socket() + globe()),
  ],
});

const CSS = `
.pb-glass{fill:var(--anatomy-paper);fill-opacity:.55;stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;transition:fill .25s var(--anatomy-ease),fill-opacity .25s var(--anatomy-ease)}
.pb-glow{opacity:var(--pb-on,0);pointer-events:none;mix-blend-mode:var(--pb-blend,screen)}
.pb-stop-0{stop-color:var(--pb-glow-0)}.pb-stop-1{stop-color:var(--pb-glow-1)}.pb-stop-2{stop-color:var(--pb-glow-2)}
.iso{--pb-glow-0:#ffd98a;--pb-glow-1:#ffb84a55;--pb-glow-2:#ff9d2a00;--pb-hot:#ffd98a}
.iso[data-theme="light"]{--pb-glow-0:#ffcf6a;--pb-glow-1:#ffb84a40;--pb-glow-2:#ff9d2a00;--pb-hot:#e08a12;--pb-blend:multiply}
.pb-filament{transition:stroke .15s}
.iso-stage[data-on] .pb-filament{stroke:color-mix(in srgb,var(--pb-hot) calc(35% + 65% * var(--pb-level,1)),var(--anatomy-mid));stroke-width:1.2}
.iso-stage[data-on] .pb-glass{fill:var(--pb-glow-0);fill-opacity:calc(.1 + .25 * var(--pb-level,1))}
.iso-stage[data-on] .pb-wire .iso-line{stroke:var(--anatomy-lit)}
.pb-filament-broken{display:none}
.iso-stage[data-burnt] .pb-filament{display:none}
.iso-stage[data-burnt] .pb-filament-broken{display:inline}
.iso-stage[data-burnt] .pb-glass{fill:var(--anatomy-mid);fill-opacity:.18}
.pb-charge{fill:var(--edu-flow);stroke:var(--anatomy-card);stroke-width:.5}
.iso-stage:not([data-flow]) .pb-charges{display:none}
.iso-stage{cursor:pointer;touch-action:manipulation}
`;

const live = `
const P = ${JSON.stringify(P)};
const TRAVEL = ${GAP};
const STEM = ${JSON.stringify(STEM)};
const FRAME_TOP = ${FRAME_TOP}, TOP_H = ${TOP_H}, CAP_UP = ${CAP_UP}, SPRING_R = ${SPRING_R}, TURNS = ${SPRING_TURNS};
const RATED_W = ${RATED_W}, BURN_AT = ${BURN_AT}, BURN_TIME = ${BURN_TIME}, SPEED_PER_AMP = ${SPEED_PER_AMP}, SPACING = ${SPACING};
const GLOW_R = ${(P.scale * 34).toFixed(1)};
const SEGS = ${JSON.stringify(SEGS)};
${chargeAt.toString()}
const fmtV = ${fmtV.toString()};
const fmtA = ${fmtA.toString()};
const fmtW = ${fmtW.toString()};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const movers = [...svg.querySelectorAll("[data-move]")];
const spring = svg.querySelector(".pb-spring");
const flows = [...svg.querySelectorAll(".pb-wire .iso-line")];
const glowEl = svg.querySelector(".pb-glow");
const plateLabel = svg.querySelector('[data-pb-label="plate"]');
const cellLabel = svg.querySelector('[data-pb-label="cell"]');
const dots = SEGS.map((seg, index) => [...svg.querySelectorAll('.pb-charges[data-seg="' + index + '"] circle')]);
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const S = { V: ${VOLTS}, R: ${OHMS}, mode: "momentary", flow: true };
let target = 0, pos = 0, rate = 0, glowAt = 0, on = false;
// The idle tour starts only when edu-kit says so (adapter.tour), and stops for good once the reader acts.
let frame = 0, last = 0, clock = 0, touring = false, visible = false, held = false;
let latched = false, toggleTo = false, tapping = false, tapTimer = 0;
let burnt = false, stress = 0, flashAge = -1, phase = 0, speed = 0, drawnPhase = NaN;
let edu = null;

const model = () => { const I = S.V / S.R; return { I, P: S.V * I }; };
const live = () => on && !burnt;
// Where the switch ends up once the motion settles (what a question checks), not where it is this frame.
const endClosed = () => !burnt && (tapping ? S.mode === "latch" && toggleTo : target >= 1);
const springPath = (capBottom) => {
  const from = FRAME_TOP + TOP_H + 0.6, to = capBottom - 0.6;
  let d = "";
  for (let i = 0; i < TURNS; i++) d += ring(STEM[0], STEM[1], SPRING_R, from + ((to - from) * (i + 0.5)) / TURNS, P, 24);
  return d;
};
// Brightness follows the bulb's power continuously: level 1 at its rated power.
const levelOf = (watts) => Math.min(1, Math.pow(Math.max(0, watts) / RATED_W, 0.45));
function drawCharges() {
  if (!S.flow || phase === drawnPhase) return;
  drawnPhase = phase;
  SEGS.forEach((seg, index) => dots[index].forEach((dot, j) => {
    const p = chargeAt(seg, j, phase, SPACING);
    // display:none, not visibility:hidden, so a parked dot doesn't stretch the part's bounding box
    if (!p) { if (!dot.hasAttribute("display")) dot.setAttribute("display", "none"); return; }
    if (dot.hasAttribute("display")) dot.removeAttribute("display");
    dot.setAttribute("cx", p[0].toFixed(2));
    dot.setAttribute("cy", p[1].toFixed(2));
  }));
}
function draw() {
  const dz = -TRAVEL * pos;
  const t = translateAlong(P, [0, 0, dz]);
  for (const g of movers) g.setAttribute("transform", t);
  spring.setAttribute("d", springPath(CAP_UP + dz));
  const m = model();
  const level = levelOf(m.P);
  const over = Math.max(0, Math.min(1, (m.P / RATED_W - 1) / 2));
  const flash = flashAge < 0 ? 0 : Math.min(1, flashAge / 0.05) * Math.exp(-Math.max(0, flashAge - 0.05) / 0.16);
  stage.style.setProperty("--pb-on", Math.min(1, glowAt * level + flash).toFixed(3));
  stage.style.setProperty("--pb-level", level.toFixed(3));
  glowEl.setAttribute("r", (GLOW_R * (0.8 + 0.2 * level + 0.18 * over * glowAt + 0.5 * flash)).toFixed(1));
  if (live()) stage.setAttribute("data-on", ""); else stage.removeAttribute("data-on");
  const dashes = live() && !S.flow;
  for (const line of flows) { if (dashes) line.setAttribute("data-flow", ""); else line.removeAttribute("data-flow"); }
  drawCharges();
  const text = burnt ? (on ? "닫힘 · 필라멘트 끊김 · 0 A" : "열림 · 필라멘트 끊김 · 0 A")
    : on ? "닫힘 · " + fmtV(S.V) + " · " + fmtA(m.I)
    : pos > 0.02 ? "누르는 중 · 남은 틈 " + Math.round((1 - pos) * 100) + "%" : "열림 · 0 A";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-pressed", live() ? "true" : "false");
}
function labels() {
  const m = model();
  plateLabel.textContent = fmtV(S.V) + " · " + fmtA(m.I);
  cellLabel.textContent = fmtV(S.V);
}
function status() {
  if (!edu) return;
  const m = model();
  const times = m.P / RATED_W;
  if (burnt) return edu.status({ level: "danger", text: "필라멘트가 끊어졌습니다. 회로가 열려 전류가 흐르지 않습니다.", action: { label: "새 전구로 바꾸기", run: replaceBulb } });
  const lead = live() ? "전력 " : "닫으면 전력 ";
  if (times > BURN_AT) edu.status({ level: "danger", text: lead + fmtW(m.P) + " · 정격의 " + times.toFixed(1) + "배입니다. 필라멘트가 " + (live() ? "곧 " : "") + "끊어집니다." });
  else if (times > 1.0001) edu.status({ level: "warn", text: lead + fmtW(m.P) + " · 정격 " + fmtW(RATED_W) + "보다 큽니다. 필라멘트가 끊어질 수 있습니다." });
  else edu.status({ level: "ok", text: "안전한 범위입니다 · " + (live() ? "" : "닫으면 ") + fmtA(m.I) + ", " + fmtW(m.P) + " (정격 " + fmtW(RATED_W) + ")" });
}
function burn() {
  burnt = true;
  stress = 0;
  flashAge = still.matches ? -1 : 0;
  stage.setAttribute("data-burnt", "");
  status();
  edu?.refresh();
}
function replaceBulb() {
  burnt = false;
  stress = 0;
  flashAge = -1;
  stage.removeAttribute("data-burnt");
  status();
  edu?.refresh();
  run();
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { clock += dt; target = clock % 2.8 > 1.6 && clock % 2.8 < 2.5 ? 1 : 0; }
  if (calm) { pos = target; rate = 0; }
  else {
    const stiff = 520, drag = 30;
    for (let i = 0; i < 4; i++) { rate += ((target - pos) * stiff - rate * drag) * dt / 4; pos += rate * dt / 4; }
    if (pos > 1) { pos = 1; rate = -rate * 0.18; }
    if (pos < 0) { pos = 0; rate = -rate * 0.3; }
  }
  const was = on;
  on = pos > 0.985;
  const m = model();
  const overload = live() && m.P > RATED_W * BURN_AT;
  if (overload) { stress += dt; if (calm || stress >= BURN_TIME) burn(); } else stress = 0;
  const want = live() ? 1 : 0;
  glowAt = calm ? want : glowAt + (want - glowAt) * (1 - Math.exp(-dt / (want ? 0.06 : 0.22)));
  if (Math.abs(want - glowAt) < 0.002) glowAt = want;
  if (flashAge >= 0) { flashAge += dt; if (flashAge > 1) flashAge = -1; }
  // Electrons drift at a speed proportional to the current; they stop the moment the loop opens.
  const drift = live() ? m.I * SPEED_PER_AMP : 0;
  speed = calm ? 0 : speed + (drift - speed) * (1 - Math.exp(-dt / 0.15));
  if (Math.abs(drift - speed) < 0.05) speed = calm ? 0 : drift;
  if (S.flow && speed) phase = (phase + speed * dt) % (SPACING * 1000);
  draw();
  if (was !== on) { status(); edu?.refresh(); }
  const settled = !touring && Math.abs(target - pos) < 1e-3 && Math.abs(rate) < 1e-3 && glowAt === want && flashAge < 0 && !overload && (!S.flow || speed === 0);
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
function press(down) {
  if (down) { held = true; toggleTo = !latched; target = 1; }
  else {
    held = false;
    latched = S.mode === "latch" ? toggleTo : false;
    target = latched ? 1 : 0;
  }
  edu?.refresh();
  run();
}
// One press and release, as a finger would (the "tap" action and the latch question use it).
function tap() {
  tapping = true;
  press(true);
  tapTimer = setTimeout(() => { tapping = false; press(false); }, still.matches ? 150 : 420);
}
function modeChanged() {
  const latch = S.mode === "latch";
  if (!latch && latched && !held) { latched = false; target = 0; }
  edu?.hint(latch ? "눌러서 켜기 · 끄기" : "누르고 있기");
  stage.setAttribute("aria-label", latch
    ? "누름 버튼(유지 스위치): 그림을 누르거나 스페이스 키를 누르면 회로가 닫히고, 한 번 더 누르면 열립니다"
    : "누름 버튼(순간 스위치): 그림을 누르고 있거나 스페이스 키를 누르고 있으면 회로가 닫혀 전구가 켜집니다");
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointerdown", (event) => { if (event.button > 0) return; edu?.takeOver(); stage.setPointerCapture?.(event.pointerId); press(true); });
stage.addEventListener("pointerup", () => { if (held) press(false); });
stage.addEventListener("pointercancel", () => { if (held) press(false); });
stage.addEventListener("keydown", (event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); edu?.takeOver(); if (!event.repeat) press(true); } });
stage.addEventListener("keyup", (event) => { if ((event.key === " " || event.key === "Enter") && held) press(false); });

edu = EDU.mount({
  stage,
  set(id, value) {
    S[id] = value;
    if (id === "V" || id === "R") labels();
    if (id === "mode") modeChanged();
    if (id === "flow") { if (value) stage.setAttribute("data-flow", ""); else stage.removeAttribute("data-flow"); drawnPhase = NaN; }
    status();
    draw();
    run();
  },
  pose(pose) {
    touring = false;
    clearTimeout(tapTimer);
    tapping = false;
    if (burnt) replaceBulb();
    if (pose.reset) { latched = false; held = false; target = 0; }
    if ("pressed" in pose) { latched = false; held = false; target = pose.pressed === true ? 1 : pose.pressed === false ? 0 : Number(pose.pressed); }
    if (pose.tap) tap();
    run();
  },
  action(id) {
    if (id === "tap") { touring = false; clearTimeout(tapTimer); tap(); }
  },
  tour(on) {
    touring = on;
    clock = 0;
    if (!on && !held && !latched && !tapping) target = 0;
    run();
  },
  values() {
    const m = model();
    const now = live() ? m.I : 0;
    const end = endClosed() ? m.I : 0;
    return {
      V: { n: S.V, t: fmtV(S.V) },
      R: { n: S.R, t: S.R + " Ω" },
      I: { n: m.I, t: fmtA(m.I) },
      P: { n: m.P, t: fmtW(m.P) },
      Inow: { n: now, t: fmtA(now) },
      Iend: { n: end, t: fmtA(end) },
      Pr: { n: RATED_W, t: fmtW(RATED_W) },
      circuit: burnt ? "필라멘트가 끊어진 열린 회로" : live() ? "닫힌 회로" : "열린 회로",
    };
  },
});
status();
draw();
`;


const stageHtml = `<div class="iso-stage" tabindex="0" role="button" aria-pressed="false" data-flow aria-label="누름 버튼(순간 스위치): 그림을 누르고 있거나 스페이스 키를 누르고 있으면 회로가 닫혀 전구가 켜집니다">${svg}</div>`;
// First paint before the script runs: the same numbers the model gives at its defaults.
const firstValues = { V: fmtV(VOLTS), R: `${OHMS} Ω`, I: fmtA(AMPS), P: fmtW(VOLTS * AMPS), circuit: "열린 회로" };
const html = eduPage({ content, theme, stage: stageHtml, css: CSS, script: kitScript() + live, values: firstValues });
writePage(HERE, theme === "light" ? "push-button-ko-light.html" : "push-button-ko.html", html);
