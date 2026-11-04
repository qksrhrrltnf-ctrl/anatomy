// Korean teaching edition of examples/desk-computer (edu-kit). The drawing is the original's, with each part
// wrapped in a [data-piece] group. The live script adds the panel's power switch, a slow-motion factor for the
// CRT's switch-off, character codes in the readout and a key-to-screen signal path; the power now changes only
// from the rocker, the LED, Escape or the panel, so a click (or tap) on the case is free for its tooltip.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { eduPage, writePage } from "../kit/edu.mjs";
import content from "./ko.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 600;
const HEIGHT = 440;

const PLATE = { x: -100, y: -84, w: 210, d: 242, r: 10 };
const PLATE_H = 10;
const FOOT_H = 5;

const CASE = { x: -62, y: -62, w: 124, d: 118, r: 8 };
const FRONT = CASE.y + CASE.d;
const SIDE = CASE.x + CASE.w;
const PLINTH_H = 5;
const TOP = 170;
const SEAM = FRONT - 12;

const BEZEL = { x0: -48, x1: 48, z0: 68, z1: 158, r: 6, depth: 1.6 };
const CRT = { x0: -40, x1: 40, z0: 77, z1: 150, r: 8, depth: 5 };
const GLASS_Y = FRONT - BEZEL.depth - CRT.depth;
const CRT_MID = (CRT.z0 + CRT.z1) / 2;
const SLOT = { x0: 8, x1: 46, z0: 45, z1: 50.5, r: 2.4, depth: 4 };

const KB = { x: -76, y: 84, w: 152, d: 58, r: 4 };
const KB_Z = 1.6;
const KB_TOP = 8.6;
const U = 9.2;
const KEYS_X = -U * 7.5;
const KEYS_Y = 88.5;

const ROWS = [
  [["`", 1], ["1", 1], ["2", 1], ["3", 1], ["4", 1], ["5", 1], ["6", 1], ["7", 1], ["8", 1], ["9", 1], ["0", 1], ["-", 1], ["=", 1], ["Backspace", 2]],
  [["Tab", 1.5], ["q", 1], ["w", 1], ["e", 1], ["r", 1], ["t", 1], ["y", 1], ["u", 1], ["i", 1], ["o", 1], ["p", 1], ["[", 1], ["]", 1], ["\\", 1.5]],
  [["CapsLock", 1.75], ["a", 1], ["s", 1], ["d", 1], ["f", 1], ["g", 1], ["h", 1], ["j", 1], ["k", 1], ["l", 1], [";", 1], ["'", 1], ["Enter", 2.25]],
  [["Shift", 2.25], ["z", 1], ["x", 1], ["c", 1], ["v", 1], ["b", 1], ["n", 1], ["m", 1], [",", 1], [".", 1], ["/", 1], ["ShiftRight", 2.75]],
  [["Alt", 1.5], ["Meta", 1.5], [" ", 9], ["NumpadEnter", 1.5], ["AltRight", 1.5]],
];
const ROW_H = [5.6, 5.2, 4.8, 4.4, 4];

const PORT = { y: 28, z: 9 };
const COIL = { x: 80, z: 3.6, r: 3.2, from: 44, to: 84, turns: 17 };

// The model's numbers, used by the live script, the card and the footer alike.
const MAX_CHARS = 20;
const DOWN = 2.2;
// CRT timetable (seconds): switching on, the picture opens sideways then upwards; switching off it folds to
// a line, the line shrinks to a dot, the dot fades.
const CRT_T = { onH: 0.14, onV: 0.22, offV: 0.1, offH: 0.16, dot: 0.5 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(CASE, 0, TOP)],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 56 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");
const flat = (x0, z0, x1, z1, r, steps = 6) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const onFront = (points, y = FRONT) => k.pathOf(points.map(([x, z]) => at([x, y, z])));
const sideSlot = (y, z0, z1, half = 0.8) => k.pathOf(k.roundedPlan({ x: y - half, y: z0, w: half * 2, d: z1 - z0, r: half }, 4).map(([u, z]) => at([SIDE, u, z])), true);
// One named part. Grouping keeps the painter's order: the children are drawn exactly where they were.
const piece = (id, parts) => `<g data-piece="${id}">${[].concat(parts).join("")}</g>`;

let clips = 0;
function recess({ x0, x1, z0, z1, r, depth }, y, back = "", backClass = "pc-well", inside = "") {
  const id = `pc-clip-${clips++}`;
  const ring = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const { sinA } = k.cameraOf(P);
  const tops = [];
  const sides = [[], [], [], []];
  ring.forEach(([ax, az], index) => {
    const [bx, bz] = ring[(index + 1) % ring.length];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / length, -(bx - ax) / length];
    if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - depth, bz]), at([ax, y - depth, az])], true);
    if (nz >= nx) tops.push(quad);
    else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = flat(x0, z0, x1, z1, r);
  return [
    `<clipPath id="${id}"><path transform="${planeOf(y)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    ...sides.map((d, shade) => (d.length ? `<path class="iso-shade" data-shade="${shade}" d="${d.join("")}"/>` : "")),
    `<g transform="${planeOf(y - depth)}"><path class="${backClass}" d="${shape}"/>${back}<path class="iso-line" data-tone="faint" d="${shape}"/></g>`,
    inside,
    `</g>`,
    `<g transform="${planeOf(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  ].join("");
}

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
  const label = { x: -88, y: 144, w: 40, d: 9, r: 1.2 };
  out.push(piece("nameplate", [
    S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }),
    L([30, 22].map((w, i) => k.lineOnTop([label.x + 4, label.y + 3 + i * 3], [label.x + 4 + w, label.y + 3 + i * 3], 0.8, P)).join(""), { tone: "lo", free: true }),
    D([at([label.x + label.w - 3, label.y + label.d / 2, 0.8])], { size: 0.45 }),
  ]));
  return out.join("");
}

function screen() {
  const H = 19;
  const left = -H * 0.61;
  const base = CRT_MID + 2;
  const glyph = (points) => k.pathOf(points.map(([gx, gy]) => [left + gx * H, -(base + gy * H)]), true);
  const logo =
    glyph([[0, 0], [0.37, 1], [0.55, 1], [0.92, 0], [0.71, 0], [0.63, 0.23], [0.29, 0.23], [0.21, 0]]) +
    glyph([[0.35, 0.41], [0.57, 0.41], [0.46, 0.72]]) +
    glyph([[0.68, 1], [0.89, 1], [1.26, 0], [1.05, 0]]);
  const lines = [];
  for (let z = CRT.z0 + 1.2; z < CRT.z1; z += 1.6) lines.push(`M${CRT.x0} ${(-z).toFixed(1)}H${CRT.x1}`);
  const glow = flat(-30, CRT.z0 + 8, 30, CRT.z1 - 8, 26, 10);
  const textX = CRT.x0 + 8;
  const textZ = CRT.z0 + 14;
  const crt = [
    `<path class="pc-glow" d="${glow}"/>`,
    `<path class="pc-scan" d="${lines.join("")}"/>`,
    `<path class="pc-logo" d="${logo}"/>`,
    `<text class="pc-text" data-part="text" x="${textX}" y="${-textZ}" font-size="5.2">&gt; </text>`,
    `<rect class="pc-cursor" data-part="cursor" x="${textX + 6.6}" y="${-textZ - 4.2}" width="3" height="5"/>`,
  ].join("");
  const back = [
    `<g data-part="crt" transform="">${crt}</g>`,
    `<path class="pc-beam" data-part="beam" d="M${CRT.x0 + 4} ${-CRT_MID}H${CRT.x1 - 4}" style="opacity:0"/>`,
    `<circle class="pc-dot" data-part="dot" cx="0" cy="${-CRT_MID}" r="1.4" style="opacity:0"/>`,
    `<path class="iso-line" data-tone="lo" data-free="" d="M${CRT.x0 + 6} ${-(CRT.z1 - 16)}Q${CRT.x0 + 7} ${-(CRT.z1 - 7)} ${CRT.x0 + 16} ${-(CRT.z1 - 6)}"/>`,
  ].join("");
  return piece("screen", recess(BEZEL, FRONT, "", "pc-bezel", recess(CRT, FRONT - BEZEL.depth, back, "pc-glass")));
}

function computer() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CASE, 0, 8, P)}"/>`];
  out.push(piece("case", [
    S(k.slabOf(k.insetPlan(CASE, 3), 0, PLINTH_H, P, 8), { tone: "lo" }),
    S(k.slabOf(CASE, PLINTH_H, TOP - PLINTH_H, P, 8, 1.6), { tone: "mid" }),
  ]));
  const handle = { x: -42, y: CASE.y + 7, w: 84, d: 11, r: 5.5 };
  out.push(piece("handle", [L(k.planOutline(handle, TOP, P, 8), { tone: "lo" }), L(k.planOutline(k.insetPlan(handle, 2.2), TOP, P, 8), { tone: "faint" })]));
  out.push(piece("vents", L(Array.from({ length: 7 }, (_, i) => k.planOutline({ x: -34, y: CASE.y + 27.3 + i * 3.4, w: 68, d: 1.4, r: 0.7 }, TOP, P, 4)).join(""), { tone: "faint" })));
  const seam = L(k.lineOnTop([CASE.x, SEAM], [SIDE, SEAM], TOP, P) + k.segment([SIDE, SEAM, TOP], [SIDE, SEAM, PLINTH_H], P), { tone: "lo" });
  const rowOf = (from, to) => Array.from({ length: Math.floor((to - from) / 3.2 + 1e-9) + 1 }, (_, i) => from + i * 3.2);
  const sideVents = [
    L(rowOf(CASE.y + 10, CASE.y + 52).map((y) => sideSlot(y, TOP - 48, TOP - 14)).join(""), { tone: "faint" }),
    L(rowOf(CASE.y + 10, CASE.y + 40).map((y) => sideSlot(y, 20, 30)).join(""), { tone: "faint" }),
  ];
  out.push(piece("case", seam));
  out.push(piece("vents", sideVents));
  out.push(piece("case", `<g transform="${planeOf(FRONT)}"><path class="iso-line" data-tone="faint" d="${flat(CASE.x + 4, PLINTH_H + 4, SIDE - 4, TOP - 4, 5)}"/></g>`));
  out.push(screen());
  out.push(piece("floppy", [
    recess(SLOT, FRONT, `<path class="iso-line" data-tone="lo" d="M${SLOT.x0} ${-(SLOT.z0 + 1.6)}H${SLOT.x1}"/>`, "pc-dark"),
    D([at([SLOT.x1 + 4, FRONT, SLOT.z0 - 1])], { size: 0.5, tone: "mid" }),
  ]));
  out.push(piece("speaker", `<g transform="${planeOf(FRONT)}">${L(Array.from({ length: 9 }, (_, i) => flat(-46.7 + i * 3, 42, -45.3 + i * 3, 54, 0.7, 4)).join(""), { tone: "lo" })}</g>`));
  // The LED is a 0.8 dot; a transparent disc around it makes it a target for a click and a tooltip.
  const led = at([-46, FRONT, 36]);
  out.push(`<g data-part="led">${D([led], { size: 0.8, tone: "hi" })}<circle cx="${led[0].toFixed(1)}" cy="${led[1].toFixed(1)}" r="4" fill="transparent" pointer-events="all" data-edu-hit/></g>`);
  out.push(rocker());
  out.push(piece("port", port()));
  return `<g class="pc-computer" data-part="computer">${out.join("")}</g>`;
}

function rocker() {
  const y = CASE.y + 8;
  const out = [S(k.slabOf({ x: SIDE, y, w: 1.2, d: 12, r: 1 }, 12, 15, P, 3), { tone: "mid" })];
  const half = (z, proud) => S(k.slabOf({ x: SIDE + 1.2, y: y + 1.5, w: proud ? 2.4 : 0.8, d: 9, r: 0.6 }, z, 5.6, P, 2), { tone: "mid" });
  out.push(`<g data-rocker="on">${half(13, true)}${half(20.4, false)}</g>`);
  out.push(`<g data-rocker="off" style="display:none">${half(20.4, true)}${half(13, false)}</g>`);
  return piece("rocker", out);
}

function port() {
  const out = [];
  out.push(S(k.slabOf({ x: SIDE - 0.4, y: PORT.y - 1, w: 1.4, d: 10, r: 1 }, PORT.z - 1, 9, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf({ x: SIDE + 1, y: PORT.y, w: 4.4, d: 8, r: 1 }, PORT.z, 7, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: SIDE + 5.4, y: PORT.y + 2, w: 5, d: 4, r: 1.6 }, PORT.z + 1.5, 4, P, 4), { tone: "mid" }));
  out.push(D([at([SIDE + 3.2, PORT.y + 1.6, PORT.z + 7]), at([SIDE + 3.2, PORT.y + 6.4, PORT.z + 7])], { size: 0.4 }));
  return out.join("");
}

const keyList = [];
function keyboard() {
  const out = [`<path class="iso-halo" d="${k.haloOf(KB, 0, 4, P)}"/>`];
  const body = [];
  for (const [x, y] of byDepth(k.corners(KB, 8))) body.push(S(k.cylinder(x, y, 2.8, 0, KB_Z, P, 16), { tone: "lo" }));
  body.push(S(k.slabOf(KB, KB_Z, KB_TOP - KB_Z, P, 6, 1), { tone: "mid" }));
  const well = { x: KEYS_X - 1.4, y: KEYS_Y - 1.4, w: U * 15 + 2.8, d: U * 5 + 2.8, r: 2 };
  body.push(L(k.planOutline(well, KB_TOP, P, 4), { tone: "lo" }));
  body.push(D([at([KB.x + 4, KB.y + 2.4, KB_TOP]), at([KB.x + KB.w - 4, KB.y + 2.4, KB_TOP])], { size: 0.45 }));
  out.push(piece("keyboard", body));
  ROWS.forEach((row, r) => {
    let x = KEYS_X;
    for (const [code, width] of row) {
      const plan = { x: x + 0.7, y: KEYS_Y + r * U + 0.7, w: width * U - 1.4, d: U - 1.4, r: 1.4 };
      const h = ROW_H[r];
      const index = keyList.length;
      keyList.push(code);
      const dish = code === " " ? k.planOutline(k.insetPlan(plan, 1.8), KB_TOP + h, P, 3) : k.planOutline(k.insetPlan(plan, 1.6), KB_TOP + h, P, 3);
      out.push(`<g class="pc-key" data-key="${index}">${S(k.slabOf(plan, KB_TOP, h, P, 3, 0.4), { tone: "mid", crease: "faint" })}${L(dish, { tone: "faint" })}</g>`);
      x += width * U;
    }
  });
  out.push(piece("keyboard", S(k.slabOf({ x: KB.x + KB.w, y: 90, w: 4, d: 4, r: 1.5 }, 2.5, 4, P, 4), { tone: "mid" })));
  return out.join("");
}

function cable() {
  const out = [];
  const curve = (points) => k.pathOf(points.map((point) => at(point)));
  const start = [COIL.x + COIL.r, COIL.from, COIL.z];
  const end = [COIL.x + COIL.r, COIL.to, COIL.z];
  const near = curve([[SIDE + 10.4, PORT.y + 4, PORT.z + 3.5], [SIDE + 14, PORT.y + 6, PORT.z + 2.4], [SIDE + 17, PORT.y + 9.5, PORT.z - 1], [SIDE + 19.6, PORT.y + 13, COIL.z + 1.6], start]);
  const far = curve([end, [COIL.x + 2.6, COIL.to + 3, COIL.z + 0.2], [KB.x + KB.w + 6.4, 91.4, 4.4], [KB.x + KB.w + 4, 92, 4.5]]);
  out.push(`<path class="iso-line pc-cord" data-tone="mid" d="${near}"/>`);
  const spring = k.coil(COIL.from, COIL.to, [COIL.x, COIL.z], COIL.r, COIL.turns, "y", P);
  out.push(L(spring.back, { tone: "lo" }), L(spring.front, { tone: "mid" }));
  out.push(`<path class="iso-line pc-cord" data-tone="mid" d="${far}"/>`);
  // the cord is a 1 px line: a wide transparent stroke along it makes it easy to point at
  const hit = (d) => `<path d="${d}" fill="none" stroke="transparent" stroke-width="7" pointer-events="stroke" data-edu-hit/>`;
  out.push(hit(near), hit(k.pathOf([at(start), at(end)])), hit(far));
  return piece("cord", out);
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "1984년 무렵의 일체형 데스크 컴퓨터가 받침판 위에 있습니다. 키 큰 본체 앞면에 CRT 화면이 박혀 있고 화면에는 Anthropic 로고와 입력 프롬프트가 보입니다. 화면 아래에 플로피 디스크 슬롯과 스피커 그릴, 옆면에 통풍구와 로커 스위치가 있으며, 키보드는 코일 케이블로 옆면 포트에 이어져 있습니다.",
  body: [plate(), computer(), keyboard(), cable()],
});

const PHRASES = ["hello, claude", "what is a crt?", "draw it isometric"];

const live = `
const P = ${JSON.stringify(P)};
const KEYS = ${JSON.stringify(keyList)};
const PHRASES = ${JSON.stringify(PHRASES)};
const MAX_CHARS = ${MAX_CHARS}, CRT_MID = ${CRT_MID}, TEXT_X = ${CRT.x0 + 8};
const CRT_T = ${JSON.stringify(CRT_T)};
const SHIFTED = { "~": "\`", "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", ")": "0", "_": "-", "+": "=", "{": "[", "}": "]", "|": "\\\\", ":": ";", '"': "'", "<": ",", ">": ".", "?": "/" };
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const keyEls = KEYS.map((_, i) => svg.querySelector('[data-key="' + i + '"]'));
const textEl = svg.querySelector('[data-part="text"]');
const cursor = svg.querySelector('[data-part="cursor"]');
const crt = svg.querySelector('[data-part="crt"]');
const beam = svg.querySelector('[data-part="beam"]');
const dot = svg.querySelector('[data-part="dot"]');
const glass = svg.querySelector(".pc-glass");
const led = svg.querySelector('[data-part="led"]');
const rockerOn = svg.querySelector('[data-rocker="on"]');
const rockerOff = svg.querySelector('[data-rocker="off"]');
const readout = document.querySelector("[data-readout]");
const status = document.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const DOWN = ${DOWN};
const down = axisVector(P, [0, 0, -1]);

const keyState = KEYS.map(() => ({ at: 0, held: 0 }));
const active = new Set();
let line = "", lastKey = "", lastChar = "", power = 1, powerClock = 9, keysTyped = 0;
let SLOW = 1, codeMode = "char", flowOn = false, stopFlow = null;
// The idle tour starts only when edu-kit says so (adapter.tour), and stops for good once the reader acts.
let frame = 0, previous = 0, visible = false, touring = false;
let tour = { phrase: 0, step: "type", index: 0, wait: 1.4 };
let edu = null;
let note = null;

const indexOf = (code) => KEYS.indexOf(code);
const NAMES = { " ": "스페이스", backspace: "지우기", return: "줄 바꿈" };
const bin8 = (code) => code.toString(2).padStart(8, "0");
function press(code, hold = 0.09) {
  const i = indexOf(code);
  if (i < 0) return;
  keyState[i].held = hold;
  active.add(i);
  run();
}
// Signal path, key to screen, once per keystroke when "신호 흐름 보기" is on.
function flow() {
  if (!flowOn || !edu) return;
  const path = [["keyboard", "keys"], ["cord"], ["port"], ["case"], ["screen", "crt-text"]];
  if (still.matches) { edu.flash(path.flat(), 900); return; }
  stopFlow?.();
  stopFlow = edu.sequence(path, { each: Math.round(180 * SLOW) });
}
function type(char) {
  // The original model: with the power off nothing happens, not even the key going down.
  if (!power) { say({ level: "info", text: "전원이 꺼져 있어 입력되지 않습니다. 로커 스위치나 패널의 전원을 켜십시오." }); return; }
  const lower = char.toLowerCase();
  const code = SHIFTED[char] || lower;
  if (indexOf(code) < 0) return;
  if (SHIFTED[char] || char !== lower) press("Shift", 0.14);
  press(code);
  keysTyped++;
  lastKey = char === " " ? " " : char;
  lastChar = char;
  if (line.length < MAX_CHARS) { line += char; say(line.length === MAX_CHARS ? { level: "info", text: "한 줄이 가득 찼습니다(" + MAX_CHARS + "자). Enter로 줄을 비우십시오." } : null); }
  else say({ level: "info", text: "한 줄이 가득 찼습니다(" + MAX_CHARS + "자). 키는 눌렸지만 글자는 더 기억되지 않습니다." });
  write();
  flow();
}
function erase() { if (!power) return; press("Backspace"); lastKey = "backspace"; line = line.slice(0, -1); say(null); write(); flow(); }
function enter() { if (!power) return; press("Enter"); lastKey = "return"; line = ""; say(null); write(); flow(); }
function keyText() {
  if (!lastKey) return "";
  const name = NAMES[lastKey];
  if (lastKey === "backspace" || lastKey === "return") return " · " + name;
  if (codeMode === "char") return " · 마지막 키 " + (name || lastKey);
  const code = lastChar.charCodeAt(0);
  return " · " + (name || lastChar) + " = " + (codeMode === "dec" ? code : bin8(code));
}
function write() {
  textEl.textContent = "> " + line;
  cursor.setAttribute("x", String(TEXT_X + textEl.getComputedTextLength() + 0.4));
  const text = power ? "켜짐 · " + line.length + "자" + keyText() : "꺼짐";
  if (readout.textContent !== text) readout.textContent = text;
  edu?.refresh();
}
function say(next) { note = next; edu?.status(note); }
function setPower(next) {
  if (next === power) return;
  power = next;
  // Reduced motion skips the switch-off picture, unless the reader has asked for slow motion.
  powerClock = still.matches && SLOW <= 1 ? 9 : 0;
  rockerOn.style.display = power ? "" : "none";
  rockerOff.style.display = power ? "none" : "";
  led.style.opacity = power ? "" : "0.15";
  status.textContent = power ? "컴퓨터가 켜졌습니다." : "컴퓨터가 꺼졌습니다.";
  say(null);
  write();
  run();
}
// The figure's own switches (rocker, LED, Escape, the tour) go through the panel so its toggle follows.
function switchPower(next) { setPower(next); edu?.sync("power", !!next); }
const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
function crtFrame() {
  const t = powerClock;
  const T = CRT_T;
  let sx = 1, sy = 1, beamAt = 0, dotAt = 0, lit = power;
  if (power) {
    if (t < T.onH) { sx = ease(t / T.onH); sy = 0.012; beamAt = 1; }
    else if (t < T.onH + T.onV) { sy = 0.012 + 0.988 * ease((t - T.onH) / T.onV); beamAt = 1 - ease((t - T.onH) / T.onV); }
  } else {
    if (t < T.offV) { sy = 1 - 0.988 * ease(t / T.offV); beamAt = ease(t / T.offV); lit = 1; }
    else if (t < T.offV + T.offH) { sy = 0.012; sx = 1 - ease((t - T.offV) / T.offH); beamAt = 1; lit = 1; }
    else { sx = 0; sy = 0; dotAt = Math.max(0, 1 - (t - T.offV - T.offH) / T.dot); }
  }
  crt.setAttribute("transform", "translate(0 " + -CRT_MID + ") scale(" + sx.toFixed(3) + " " + sy.toFixed(3) + ") translate(0 " + CRT_MID + ")");
  beam.setAttribute("transform", "translate(0 " + -CRT_MID + ") scale(" + Math.max(sx, 0.001).toFixed(3) + " 1) translate(0 " + CRT_MID + ")");
  beam.style.opacity = beamAt.toFixed(2);
  dot.style.opacity = dotAt.toFixed(2);
  glass.toggleAttribute("data-on", !!lit);
  return t > Math.max(T.onH + T.onV, T.offV + T.offH + T.dot) + 0.04;
}
function tourStep(dt) {
  tour.wait -= dt;
  if (tour.wait > 0) return;
  const phrase = PHRASES[tour.phrase];
  if (tour.step === "type") {
    if (tour.index < phrase.length) { type(phrase[tour.index++]); tour.wait = 0.09 + Math.random() * 0.11 + (phrase[tour.index - 1] === " " ? 0.08 : 0); }
    else { tour.step = "erase"; tour.wait = 2.4; }
  } else if (tour.step === "erase") {
    if (line.length) { erase(); tour.wait = 0.055; }
    else if (tour.phrase === PHRASES.length - 1) { tour.step = "off"; tour.wait = 0.9; }
    else { tour.phrase++; tour.index = 0; tour.step = "type"; tour.wait = 0.7; }
  } else if (tour.step === "off") { switchPower(0); tour.step = "on"; tour.wait = 1.6; }
  else if (tour.step === "on") { switchPower(1); tour = { phrase: 0, step: "type", index: 0, wait: 1.4 }; }
}
function tick(now) {
  const dt = previous ? Math.min((now - previous) / 1000, 1 / 30) : 1 / 60;
  previous = now;
  const calm = still.matches;
  if (touring) tourStep(dt);
  powerClock += dt / SLOW;
  const settledCrt = crtFrame();
  for (const i of active) {
    const s = keyState[i];
    s.held = Math.max(0, s.held - dt);
    const want = s.held > 0 ? DOWN : 0;
    s.at = calm ? want : s.at + (want - s.at) * (1 - Math.exp(-dt / (want ? 0.025 : 0.07)));
    if (Math.abs(want - s.at) < 0.01) s.at = want;
    keyEls[i].setAttribute("transform", "translate(" + (down[0] * s.at).toFixed(2) + " " + (down[1] * s.at).toFixed(2) + ")");
    keyEls[i].toggleAttribute("data-down", s.at > 0.6);
    if (!s.held && s.at === 0) active.delete(i);
  }
  const busy = touring || active.size || !settledCrt;
  frame = visible && busy ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { previous = 0; frame = requestAnimationFrame(tick); } }
// The reader takes over: the tour stops and its half-typed line goes.
function stopTour() {
  if (!touring) return;
  touring = false;
  tour = { phrase: 0, step: "type", index: 0, wait: 1.4 };
  line = "";
  lastKey = "";
  lastChar = "";
  write();
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key;
  if (key === "Tab") return;
  if (key === "Process" || /[\\u3131-\\u318e\\uac00-\\ud7a3]/.test(key)) { say({ level: "warn", text: "영문 자판으로 바꾸어 입력하십시오. 이 키보드에는 한글 키가 없습니다." }); return; }
  edu?.takeOver();
  if (key === "Escape") { event.preventDefault(); switchPower(power ? 0 : 1); return; }
  if (key === "Backspace") { event.preventDefault(); erase(); return; }
  if (key === "Enter") { event.preventDefault(); enter(); return; }
  if (key === "Shift") { press(event.code === "ShiftRight" ? "ShiftRight" : "Shift", 0.14); return; }
  if (key.length === 1) { event.preventDefault(); type(key); }
});
svg.addEventListener("click", (event) => {
  const key = event.target.closest("[data-key]");
  if (key) {
    edu?.takeOver();
    const code = KEYS[Number(key.dataset.key)];
    if (code.length === 1) type(code);
    else if (code === "Backspace") erase();
    else if (code === "Enter" || code === "NumpadEnter") enter();
    else press(code);
    stage.focus({ preventScroll: true });
    return;
  }
  // Only the rocker and the LED switch the power; the case itself is free for its tooltip.
  if (event.target.closest('[data-piece="rocker"],[data-part="led"]')) { edu?.takeOver(); switchPower(power ? 0 : 1); }
  stage.focus({ preventScroll: true });
});

edu = EDU.mount({
  stage,
  set(id, value, info = {}) {
    if (id === "power") {
      if (info.initial) { power = value ? 1 : 0; powerClock = 9; }
      else setPower(value ? 1 : 0);
    }
    if (id === "slow") SLOW = value;
    if (id === "code") { codeMode = value; write(); }
    if (id === "flow") { flowOn = !!value; if (!flowOn) { stopFlow?.(); stopFlow = null; } }
    run();
  },
  pose(pose) {
    stopTour();
    if (pose.reset) { line = ""; lastKey = ""; lastChar = ""; say(null); write(); }
    if ("text" in pose) { line = String(pose.text).slice(0, MAX_CHARS); say(null); write(); }
    if ("type" in pose) for (const c of String(pose.type)) type(c);
    run();
  },
  tour(on) {
    if (on) { touring = true; tour = { phrase: 0, step: "type", index: 0, wait: 1.4 }; line = ""; switchPower(1); write(); }
    else stopTour();
    run();
  },
  values() {
    const code = lastChar ? lastChar.charCodeAt(0) : NaN;
    const r = (v) => String(+v.toFixed(2)) + " s";
    return {
      chars: { n: line.length, t: line.length + "자" },
      bytes: { n: line.length, t: line.length + "바이트" },
      bits: { n: line.length * 8, t: line.length * 8 + "비트" },
      max: { n: MAX_CHARS, t: String(MAX_CHARS) },
      char: lastChar ? (lastChar === " " ? "스페이스" : "'" + lastChar + "'") : "—",
      code: { n: code, t: lastChar ? String(code) : "—" },
      bin: lastChar ? bin8(code) : "—",
      ascii: lastChar ? (lastChar === " " ? "스페이스" : "'" + lastChar + "'") + " → " + code + " → " + bin8(code) : "글자를 쳐 보십시오",
      power: power ? "켜짐" : "꺼짐",
      slow: { n: SLOW, t: SLOW + "배" },
      tV: { n: CRT_T.offV * SLOW, t: r(CRT_T.offV * SLOW) },
      tH: { n: CRT_T.offH * SLOW, t: r(CRT_T.offH * SLOW) },
      tD: { n: CRT_T.dot * SLOW, t: r(CRT_T.dot * SLOW) },
      tOnH: { n: CRT_T.onH * SLOW, t: r(CRT_T.onH * SLOW) },
      tOnV: { n: CRT_T.onV * SLOW, t: r(CRT_T.onV * SLOW) },
      nkeys: { n: KEYS.length, t: String(KEYS.length) },
      down: { n: DOWN, t: String(DOWN) },
    };
  },
});
write();
crtFrame();
`;

const css = `<style>
.pc-well{fill:var(--anatomy-shade-1)}
.pc-bezel{fill:var(--anatomy-top)}
.pc-dark{fill:var(--anatomy-shade-0)}
.pc-glass{fill:var(--anatomy-shade-0);transition:fill .5s var(--anatomy-ease)}
.pc-glass[data-on]{fill:var(--anatomy-lit-shade)}
.pc-glow{fill:var(--anatomy-lit);opacity:.07;filter:blur(6px)}
.pc-scan{fill:none;stroke:var(--anatomy-faint);stroke-width:.5px;vector-effect:non-scaling-stroke;opacity:.7}
.pc-logo{fill:var(--anatomy-lit);fill-rule:evenodd}
.pc-text{fill:var(--anatomy-lit);font-family:var(--anatomy-mono);letter-spacing:.02em}
.pc-cursor{fill:var(--anatomy-lit);animation:pc-blink 1.06s steps(1,end) infinite}
.pc-beam{fill:none;stroke:var(--anatomy-lit);stroke-width:1.4px;vector-effect:non-scaling-stroke;stroke-linecap:round}
.pc-dot{fill:var(--anatomy-lit)}
.pc-cord{stroke-width:1.1px}
.pc-key,[data-piece="rocker"],[data-part="led"]{cursor:pointer}
.pc-key[data-down] .iso-edge{stroke:var(--anatomy-hi)}
[data-part="led"]{transition:opacity .4s var(--anatomy-ease)}
@keyframes pc-blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.pc-cursor{animation:none}}
.pc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.iso-stage{touch-action:pan-y;user-select:none;-webkit-user-select:none}
.iso-stage:focus{outline:none}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
</style>`.replace(/^<style>|<\/style>$/g, "");

// First paint of the {key} templates in the card; the runtime refills them from adapter.values().
const s = (v) => `${+v.toFixed(2)} s`;
const values = { nkeys: String(keyList.length), max: String(MAX_CHARS), tV: s(CRT_T.offV), tH: s(CRT_T.offH), tD: s(CRT_T.dot) };
const page = {
  ...content.page,
  footer: `모델: 본체 속의 처리 장치와 기억 장치는 그리지 않았습니다. 화면이 꺼지는 단계 시간(세로 접힘 ${s(CRT_T.offV)}, 가로 접힘 ${s(CRT_T.offH)}, 점 사라짐 ${s(CRT_T.dot)})은 이 그림의 연출 시간이며 실제 CRT마다 다릅니다. 문자 코드는 ASCII 기준입니다. 이 그림에서는 전원이 꺼지면 키도 내려가지 않습니다(원본 모델 그대로). 실제 키보드의 키는 전원과 관계없이 눌립니다.`,
};

const stageHtml = `<div class="iso-stage" tabindex="0" role="group" aria-label="데스크 컴퓨터: 그림을 누르고 영문으로 타자하면 화면에 글자가 찍힙니다. Esc 키나 로커 스위치로 전원을 켜고 끕니다.">${svg}<span class="pc-sr" role="status" aria-live="polite" data-status></span></div>`;
const html = eduPage({ content: { ...content, page }, theme, stage: stageHtml, css, script: kitScript() + live, values });
writePage(HERE, theme === "light" ? "desk-computer-ko-light.html" : "desk-computer-ko.html", html);
