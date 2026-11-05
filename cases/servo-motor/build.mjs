// 서보 모터 교육판 (cases/servo-motor). A hobby servo on a test bench with its near walls cut away:
// a DC motor, a four-stage gear train, a potentiometer under the output shaft and the control board,
// a pointer horn over a protractor, a drum that lifts slotted masses over a pulley, and a small
// controller board whose knob sets the PWM pulse. Everything numeric comes from model.mjs.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { pdfButton } from "../../kit/pdf-button.mjs";
import { eduPage } from "../../edu/kit/edu.mjs";
import content from "./ko.mjs";
import { SERVO, GEARSETS, PINION, ratioOf, plant, angleOf, settled, fmt } from "./model.mjs";
import { dirOf, hornSvg as hornOf, sideTeeth as teethOf } from "./shared.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const AUDIT = process.argv.includes("--audit");

const W = 600;
const H = 390;
const AZ = 40;
const EL = 34;

// ---- world layout (1 mm ≈ 2 units, z up) ----
const PLATE = { x: -110, y: -66, w: 234, d: 136, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;
const CASE = { x: -20, y: -40, w: 40, d: 80 };
const WALL = 1.6;
const Z = { floor: 2, base: 4, seam: 14, plate0: 56, plate1: 59, top: 79, ear0: 52, ear1: 56, band: 44, lip: 9 };
const SHAFT = { A: [0, 18], B: [0, -4], M: [0, -22] };
const LEVEL = [61, 65, 69, 73]; // bottom of each stage's big gear
const GEAR_T = [3, 3, 3, 4];
const HORN_Z = 89.6;
const HORN_T = 2.6;
const DRUM_R = SERVO.drum * 2000; // 12 units (6 mm)
const CORD_Z = 83;
const DRUM_Z = 80;
const PRO = { c: SHAFT.A, r0: 26, r1: 46, z: 87, t: 1.6, from: -10, to: 190 };
const CORD_R = 0.45;
const PULLEY = { x: -86, y: SHAFT.A[1] + DRUM_R + CORD_R, r: 7, z: CORD_Z - 7 - CORD_R };
const HANG = { x: PULLEY.x - PULLEY.r - CORD_R, y: PULLEY.y, z0: 32, travel: DRUM_R * Math.PI }; // hook top at 0°
const BOARD = { x: 40, y: -50, w: 66, d: 50, r: 2 };
const BOARD_Z = 6;
const BOARD_T = 1.6;
const BT = BOARD_Z + BOARD_T;
const KNOB = { x: 90, y: -38, r: 6.2, z0: BT + 5, h: 7 };
const OLED = { x: 72, y: -18, w: 28, d: 15 };
const GL = { x: OLED.x + 3, y: OLED.y + 1.8, w: OLED.w - 5.4, d: OLED.d - 3.6 };
const GZ = BT + 5.9;
const PLUG = { x0: 44, x1: 54, y0: -30, y1: -22, z0: BT, z1: BT + 6 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 18, 100], [PULLEY.x, PULLEY.y, PULLEY.z + PULLEY.r + 2], [PULLEY.x - 2, PULLEY.y - 12, PULLEY.z + 10]],
  W,
  H,
  { pad: 22, azimuth: AZ, elevation: EL },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const f2 = (v) => Math.round(v * 100) / 100;
const RAD = Math.PI / 180;

// The model at its defaults (ko.mjs holds the defaults).
const param = (id) => content.params.find((entry) => entry.id === id).value;
const DEF = { pwm: param("pwm"), kp: param("kp"), gear: param("gear"), load: param("load") };
const DEF_P = plant(DEF);
const DEF_TARGET = angleOf(DEF.pwm);
const DEF_TH = settled(DEF_TARGET, DEF_P);

// ---- gear geometry (shared with the page through DATA) ----
function gearTrain(set) {
  const z = GEARSETS[set].teeth;
  const d = (a, b) => Math.hypot(SHAFT[a][0] - SHAFT[b][0], SHAFT[a][1] - SHAFT[b][1]);
  const stages = [["M", "B", d("M", "B")], ["B", "A", d("A", "B")], ["A", "B", d("A", "B")], ["B", "A", d("A", "B")]];
  const out = [];
  stages.forEach(([from, to, dist], i) => {
    const m = (2 * dist) / (PINION + z[i]);
    const rp = (m * PINION) / 2;
    const rg = (m * z[i]) / 2;
    const z0 = LEVEL[i];
    // the driving pinion: the motor's own pinion for stage 1, else the pinion of the previous compound gear
    out.push({ id: i === 0 ? "pm" : `p${i}`, stage: i, kind: "pinion", shaft: from, cx: SHAFT[from][0], cy: SHAFT[from][1], r: rp, teeth: PINION, z0: i === 0 ? Z.plate1 + 1 : LEVEL[i - 1] + GEAR_T[i - 1], z1: z0 + GEAR_T[i] + (i === 3 ? 0 : 0) });
    out.push({ id: `g${i + 1}`, stage: i, kind: "gear", shaft: to, cx: SHAFT[to][0], cy: SHAFT[to][1], r: rg, teeth: z[i], z0, z1: z0 + GEAR_T[i] });
  });
  return out;
}

// ---- recorder helpers ----
function makeRecorder() {
  const R = A.recorder(P);
  const put = (name, piece, ref, svg, shapes = [], rest = {}) => R.put({ name, piece, at: ref, bias: 0, svg, shapes, ...rest });
  const box = (name, piece, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.4, steps = 2, bevel = 0, extra = "", inner = "", bias = 0, meta = {} } = {}) => {
    const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
    const shape = R.solid(A.slab(plan, z0, z1 - z0, { name, ...meta }, steps));
    put(name, piece, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
    return shape;
  };
  const cyl = (name, piece, cx, cy, r, z0, z1, style = {}, { steps = 32, bevel = 0, extra = "", inner = "", bias = 0, meta = {} } = {}) => {
    const shape = R.solid(A.cylinder(cx, cy, r, z0, z1 - z0, { name, ...meta }));
    put(name, piece, [cx, cy, (z0 + z1) / 2], S(k.cylinder(cx, cy, r, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
    return shape;
  };
  const turned = (name, piece, F, profile, style = {}, { extra = "", inner = "", bias = 0, steps, meta = {} } = {}) => {
    const paths = G.solidOf(profile, F, P, steps ? { steps } : {});
    const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
    const shape = R.solid(A.solid(F, profile, { name, ...meta }));
    put(name, piece, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias });
    return shape;
  };
  const disc = (name, piece, F, s0, s1, r, style = {}, options = {}) => turned(name, piece, F, [[s0, r], [s1, r]], style, options);
  return { R, put, box, cyl, turned, disc };
}

const sideTeeth = (g, phase) => teethOf(g, phase, k, P);
// Top teeth: short radial ticks from the rim in to the root circle, drawn at rest; the page rotates the group.
function topTeeth(g) {
  const depth = Math.min(1.8, g.r * 0.32);
  const ticks = [];
  for (let i = 0; i < g.teeth; i++) {
    const a = (i / g.teeth) * Math.PI * 2;
    ticks.push(k.lineOnTop([g.cx + (g.r - depth) * Math.cos(a), g.cy + (g.r - depth) * Math.sin(a)], [g.cx + g.r * Math.cos(a), g.cy + g.r * Math.sin(a)], g.z1, P));
  }
  const root = k.ring(g.cx, g.cy, g.r - depth, g.z1, P, 48);
  return { ticks: ticks.join(""), root };
}
function gearMarkup(g) {
  const top = topTeeth(g);
  const big = g.kind === "gear";
  const hub = k.ring(g.cx, g.cy, big ? 4.2 : Math.max(1.2, g.r * 0.45), g.z1, P, 24);
  // lightening holes on the big gears: closed slots, so no line ends
  const holes = big && g.r > 12
    ? [0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const rr = (g.r - 2.2 + 5) / 2;
        return k.ring(g.cx + rr * Math.cos(a), g.cy + rr * Math.sin(a), Math.min(2.6, (g.r - 9) / 2.4), g.z1, P, 18);
      }).join("")
    : "";
  const mark = big ? Dots([at([g.cx + (g.r * 0.62), g.cy, g.z1])], { size: 0.75, tone: "hi" }) : "";
  const blur = Ln(k.ring(g.cx, g.cy, g.r * 0.72, g.z1, P, 40) + k.ring(g.cx, g.cy, g.r * 0.86, g.z1, P, 40), { tone: "faint" });
  const solid = S(k.cylinder(g.cx, g.cy, g.r, g.z0, g.z1 - g.z0, P, big ? 56 : 24, 0.3), { tone: big ? "hi" : "mid", crease: "lo" });
  return `${solid}<g class="sv-blur" data-blur>${blur}</g><g class="sv-teeth" data-rot>${Ln(top.ticks + top.root + hub + holes, { tone: "lo" })}${mark}</g><g class="sv-teeth" data-side>${Ln(sideTeeth(g, 0), { tone: "lo" })}</g>`;
}

// ---- the figure ----
function buildFigure(set) {
  const { R, put, box, cyl, turned, disc } = makeRecorder();
  const back = [];

  // Base plate on feet (static, drawn first; recorded as ground)
  back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
  const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -4, P, 8), { tone: "faint" }) }));
  back.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  back.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  back.push(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  R.solid(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }, 8));
  const STRIP = { x: PLATE.x + 16, y: PLATE.y + PLATE.d - 13, w: 102, d: 6, r: 1 };
  back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y, 0.6, [1.8, 3.4], P);
  back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  const LABEL = { x: -2, y: PLATE.y + PLATE.d - 20, w: 34, d: 12, r: 1.2 };
  back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.4), 0.8, P, 3), { tone: "faint" }));
  back.push(Ln([22, 15, 19].map((w, i) => k.lineOnTop([LABEL.x + 4, LABEL.y + 3.2 + i * 2.8], [LABEL.x + 4 + w, LABEL.y + 3.2 + i * 2.8], 0.8, P)).join(""), { tone: "lo", free: true }));
  back.push(Dots([at([LABEL.x + LABEL.w - 2.6, LABEL.y + 2.4, 0.8]), at([LABEL.x + LABEL.w - 2.6, LABEL.y + LABEL.d - 2.4, 0.8])], { size: 0.45 }));
  // halos under the servo, the controller and the pulley tower
  back.push(`<path class="iso-halo" d="${k.haloOf({ x: CASE.x - 2, y: CASE.y - 16, w: CASE.w + 4, d: CASE.d + 32, r: 4 }, 0, 2, P)}"/>`);
  back.push(`<path class="iso-halo" d="${k.haloOf(BOARD, 0, 2, P)}"/>`);

  // ---- servo stand: four hex standoffs under the ears ----
  const EAR_HOLES = [[-10, -48], [10, -48], [-10, 48], [10, 48]];
  for (const [x, y] of EAR_HOLES) cyl("stand.standoff", "stand", x, y, 2.8, 0, Z.ear0 - 1, { tone: "lo" }, { steps: 6 });

  // ---- case ----
  box("case.floor", "case", [CASE.x, CASE.y, Z.floor], [CASE.x + CASE.w, CASE.y + CASE.d, Z.base], { tone: "lo" }, { r: 1.4, steps: 3 });
  for (const [x, y] of EAR_HOLES.map(([x, y]) => [x, y])) void x;
  const wallX = { x: CASE.x, y: CASE.y, w: WALL, d: CASE.d, r: 0.4 };
  const seamX = (z) => path3([[CASE.x + WALL, CASE.y + WALL, z], [CASE.x + WALL, CASE.y + CASE.d, z], [CASE.x, CASE.y + CASE.d, z]]);
  box("case.wall.x", "case", [CASE.x, CASE.y, Z.base], [CASE.x + WALL, CASE.y + CASE.d, Z.top], { tone: "mid" }, {
    extra: Ln(seamX(Z.seam) + seamX(Z.plate1) + k.segment([CASE.x + WALL, CASE.y + WALL, Z.base], [CASE.x + WALL, CASE.y + WALL, Z.top], P), { tone: "faint" }),
  });
  const seamY = (z) => path3([[CASE.x + WALL, CASE.y + WALL, z], [CASE.x + CASE.w, CASE.y + WALL, z], [CASE.x + CASE.w, CASE.y, z]]);
  box("case.wall.y", "case", [CASE.x + WALL, CASE.y, Z.base], [CASE.x + CASE.w, CASE.y + WALL, Z.top], { tone: "mid" }, {
    extra: Ln(seamY(Z.seam) + seamY(Z.plate1) + k.segment([CASE.x + WALL, CASE.y + WALL, Z.base], [CASE.x + WALL, CASE.y + WALL, Z.top], P), { tone: "faint" }),
  });
  box("case.lip.x", "case", [CASE.x + CASE.w - WALL, CASE.y + WALL, Z.base], [CASE.x + CASE.w, CASE.y + CASE.d - WALL, Z.lip], { tone: "mid" });
  box("case.lip.y", "case", [CASE.x + WALL, CASE.y + CASE.d - WALL, Z.base], [CASE.x + CASE.w, CASE.y + CASE.d, Z.lip], { tone: "mid" });
  // corner screws down the case: heads on the wall tops
  for (const [x, y] of [[CASE.x + 0.8, CASE.y + 0.8], [CASE.x + 0.8, CASE.y + CASE.d - 0.8]]) void [x, y];
  put("case.screws", "case", [CASE.x + 1, CASE.y + 1, Z.top], Dots([at([CASE.x + 0.8, CASE.y + 3, Z.top]), at([CASE.x + 0.8, CASE.y + CASE.d - 3, Z.top]), at([CASE.x + CASE.w - 3, CASE.y + 0.8, Z.top])], { size: 0.5, tone: "hi" }), [R.solid(A.box([CASE.x, CASE.y, Z.top], [CASE.x + 1.6, CASE.y + CASE.d, Z.top + 0.05], { name: "case.screws" }))], { bias: 0.2 });
  // ears with rubber grommets, brass eyelets and screws
  for (const sign of [-1, 1]) {
    const y0 = sign < 0 ? CASE.y - 14 : CASE.y + CASE.d;
    box(`case.ear`, "case", [CASE.x, y0, Z.ear0], [CASE.x + CASE.w, y0 + 14, Z.ear1], { tone: "mid" }, { r: 1.6, steps: 3, bevel: 0.3 });
    for (const x of [-10, 10]) {
      const y = sign * 48;
      cyl("case.grommet", "case", x, y, 3.8, Z.ear0 - 1, Z.ear0, { tone: "lo" }, { steps: 28 });
      cyl("case.grommet", "case", x, y, 3.8, Z.ear1, Z.ear1 + 1, { tone: "lo" }, { steps: 28, extra: Ln(k.ring(x, y, 2.6, Z.ear1 + 1, P, 20), { tone: "mid" }) });
      cyl("stand.screw", "stand", x, y, 2.3, Z.ear1 + 1, Z.ear1 + 2.6, { tone: "hi" }, { steps: 20, extra: Ln(k.lineOnTop([x - 1.6, y], [x + 1.6, y], Z.ear1 + 2.6, P) + k.lineOnTop([x, y - 1.6], [x, y + 1.6], Z.ear1 + 2.6, P), { tone: "lo" }) });
    }
  }

  // ---- control board inside the bottom cover ----
  const PCB = { x: CASE.x + WALL + 0.4, y: CASE.y + WALL + 0.4, w: CASE.w - 2 * WALL - 0.8, d: CASE.d - 2 * WALL - 0.8, r: 0.6 };
  box("pcb.board", "pcb", [PCB.x, PCB.y, Z.base], [PCB.x + PCB.w, PCB.y + PCB.d, Z.base + 1.4], { tone: "lo" }, { r: 0.6, steps: 2 });
  const PZ = Z.base + 1.4;
  const chip = (name, x, y, w, d, h, pins = true) => {
    const extra = pins ? Dots(Array.from({ length: Math.max(2, Math.floor(w / 1.27)) }, (_, i) => [x + 0.6 + i * 1.27, y + d + 0.3]).map(([px, py]) => at([px, py, PZ])), { size: 0.25, tone: "lo" }) : "";
    box(name, "pcb", [x, y, PZ], [x + w, y + d, PZ + h], { tone: "hi" }, { r: 0.2, steps: 1, extra });
  };
  chip("pcb.ic", -8, 0, 10, 7, 1.6);
  chip("pcb.fet", 4, -10, 4.6, 3.6, 1.2);
  chip("pcb.fet", 4, -4, 4.6, 3.6, 1.2);
  chip("pcb.fet", -12, -10, 4.6, 3.6, 1.2);
  chip("pcb.fet", -12, -4, 4.6, 3.6, 1.2);
  cyl("pcb.cap", "pcb", 12, 10, 2.4, PZ, PZ + 6.5, { tone: "hi" }, { steps: 24, extra: Ln(k.lineOnTop([10.4, 10], [13.6, 10], PZ + 6.5, P) + k.lineOnTop([12, 8.4], [12, 11.6], PZ + 6.5, P), { tone: "lo" }) });
  cyl("pcb.cap", "pcb", 12, 26, 1.6, PZ, PZ + 3.4, { tone: "hi" }, { steps: 20 });
  box("pcb.res", "pcb", [-14, 22, PZ], [-9, 24.4, PZ + 1.2], { tone: "mid" }, { r: 0.3 });
  box("pcb.res", "pcb", [-14, 27, PZ], [-9, 29.4, PZ + 1.2], { tone: "mid" }, { r: 0.3 });
  {
    const traces = [];
    const pads = [];
    const lane = (pts) => {
      traces.push(k.onTop(pts, PZ + 0.02, P));
      pads.push(at([...pts[0], PZ + 0.02]), at([...pts[pts.length - 1], PZ + 0.02]));
    };
    lane([[-3, 7], [-3, 14], [7, 14], [7, 20]]);
    lane([[2, 0], [2, -2], [6, -2]]);
    lane([[-8, 3], [-10, 3], [-10, -0.4]]);
    lane([[-11.5, 23.2], [-11.5, 16], [-4, 16]]);
    lane([[0, -10], [0, -30], [-6, -30]]);
    lane([[8, -10], [8, -26]]);
    put("pcb.traces", "pcb", [0, 0, PZ + 0.05], Ln(traces.join(""), { tone: "faint" }) + Dots(pads, { size: 0.32, tone: "lo" }), [R.solid(A.box([PCB.x, PCB.y, PZ], [PCB.x + PCB.w, PCB.y + PCB.d, PZ + 0.05], { name: "pcb.traces" }))], { bias: 0.02 });
  }

  // ---- motor ----
  const [mx, my] = SHAFT.M;
  cyl("motor.cap", "motor", mx, my, 10.5, 16, 20, { tone: "lo" }, { steps: 40 });
  cyl("motor.can", "motor", mx, my, 13, 20, Z.plate0, { tone: "mid" }, {
    steps: 56,
    inner: Ln([24, 50].map((z) => k.sideArc(mx, my, 13, z, P, 32)).join(""), { tone: "faint" }),
  });
  // motor tabs down to the board
  box("motor.tab", "motor", [mx + 5, my - 1, PZ], [mx + 6, my + 1, 16], { tone: "hi" }, { r: 0.2, steps: 1 });
  box("motor.tab", "motor", [mx - 6, my - 1, PZ], [mx - 5, my + 1, 16], { tone: "hi" }, { r: 0.2, steps: 1 });

  // ---- potentiometer under the output shaft ----
  const [ax, ay] = SHAFT.A;
  cyl("pot.body", "pot", ax, ay, 8, 22, 32, { tone: "mid" }, { steps: 40, inner: Ln(k.sideArc(ax, ay, 8, 27, P, 28), { tone: "faint" }) });
  cyl("pot.collar", "pot", ax, ay, 4.4, 32, 35, { tone: "lo" }, { steps: 28 });
  cyl("pot.shaft", "pot", ax, ay, 2.2, 35, Z.plate0, { tone: "hi" }, { steps: 20, extra: "" });
  for (const dy of [-3.4, 0, 3.4]) {
    box("pot.tab", "pot", [ax + 7.8, ay + dy - 0.6, 22], [ax + 10.8, ay + dy + 0.6, 23], { tone: "hi" }, { r: 0.2, steps: 1 });
    box("pot.pin", "pot", [ax + 9.8, ay + dy - 0.5, PZ], [ax + 10.8, ay + dy + 0.5, 22], { tone: "hi" }, { r: 0.2, steps: 1 });
  }
  box("pot.bracket", "pot", [ax - 9.5, ay - 10, 18], [ax + 9.5, ay + 10, 22], { tone: "lo" }, { r: 1.2, steps: 3 });
  box("pot.post", "pot", [ax - 9.5, ay - 10, PZ], [ax - 7, ay - 7.5, 18], { tone: "lo" }, { r: 0.3 });
  box("pot.post", "pot", [ax - 9.5, ay + 7.5, PZ], [ax - 7, ay + 10, 18], { tone: "lo" }, { r: 0.3 });

  // ---- gear plate (middle frame top) ----
  const GP = { x: CASE.x + WALL, y: CASE.y + WALL, w: CASE.w - WALL, d: CASE.d - 2 * WALL, r: 0.6 };
  box("gearplate", "case", [GP.x, GP.y, Z.plate0], [GP.x + GP.w, GP.y + GP.d, Z.plate1], { tone: "mid" }, {
    r: 0.6,
    extra: Ln(k.ring(SHAFT.M[0], SHAFT.M[1], 3.4, Z.plate1, P, 20) + k.ring(SHAFT.A[0], SHAFT.A[1], 3.4, Z.plate1, P, 20) + k.ring(SHAFT.B[0], SHAFT.B[1], 2.4, Z.plate1, P, 16), { tone: "lo" }) +
      Dots([at([GP.x + 2.4, GP.y + 2.4, Z.plate1]), at([GP.x + GP.w - 2.4, GP.y + 2.4, Z.plate1]), at([GP.x + 2.4, GP.y + GP.d - 2.4, Z.plate1]), at([GP.x + GP.w - 2.4, GP.y + GP.d - 2.4, Z.plate1])], { size: 0.45 }),
  });

  // ---- gear train ----
  const train = gearTrain(set);
  const gearItems = {};
  for (const g of train) {
    const shape = R.solid(A.cylinder(g.cx, g.cy, g.r, g.z0, g.z1 - g.z0, { name: `gear.${g.id}` }));
    put(`gear.${g.id}`, "gears", [g.cx, g.cy, (g.z0 + g.z1) / 2], gearMarkup(g), [shape], { attrs: ` data-gear="${g.id}"` });
    gearItems[g.id] = g;
  }
  // hubs and spacers between stacked gears so every gear rests on something
  const spacer = (name, shaft, z0, z1, r) => cyl(name, "gears", SHAFT[shaft][0], SHAFT[shaft][1], r, z0, z1, { tone: "lo" }, { steps: 20 });
  spacer("gear.spacer", "B", Z.plate1, LEVEL[0], 3.2); // under g1
  spacer("gear.spacer", "A", Z.plate1, LEVEL[1], 2.6); // output shaft below g2
  spacer("gear.spacer", "B", LEVEL[1] + GEAR_T[1] - 0.0, LEVEL[2], 2.2); // washer under g3 (between g1 pinion top and g3)
  spacer("gear.spacer", "A", LEVEL[2] + GEAR_T[2], LEVEL[3], 2.2); // washer under g4
  // motor shaft under its pinion (from the plate to the pinion)
  // shafts above the stack
  cyl("shaft.b", "gears", SHAFT.B[0], SHAFT.B[1], 1.3, LEVEL[3] + GEAR_T[3] - 0.5, LEVEL[3] + GEAR_T[3] + 1.2, { tone: "hi" }, { steps: 16 });
  cyl("shaft.out", "horn", ax, ay, 3, LEVEL[3] + GEAR_T[3], DRUM_Z, { tone: "hi" }, { steps: 24 });
  cyl("shaft.out", "horn", ax, ay, 3, DRUM_Z + 6, HORN_Z, { tone: "hi" }, { steps: 24, extra: Ln(k.knurl(ax, ay, 3, DRUM_Z + 6, HORN_Z, 10, P, 0.3), { tone: "lo" }) });
  // drum on the output shaft, the cord between its flanges
  const DF = DRUM_R + 1.8;
  cyl("drum.flange", "drum", ax, ay, DF, DRUM_Z, DRUM_Z + 1, { tone: "mid" }, { steps: 48, bevel: 0.3 });
  cyl("drum.core", "drum", ax, ay, DRUM_R, DRUM_Z + 1, DRUM_Z + 5, { tone: "mid" }, { steps: 48 });
  {
    const zt = DRUM_Z + 6;
    const marks = `<g data-drumtop>${Ln(k.ring(ax, ay, 4.2, zt, P, 20), { tone: "lo" })}${Dots([0, 1, 2].map((i) => { const a = (i * 2 * Math.PI) / 3; return at([ax + 9 * Math.cos(a), ay + 9 * Math.sin(a), zt]); }), { size: 0.55, tone: "hi" })}</g>`;
    cyl("drum.flange2", "drum", ax, ay, DF, DRUM_Z + 5, zt, { tone: "mid" }, { steps: 48, bevel: 0.3, extra: marks });
  }
  {
    const route = [[ax, ay + DRUM_R + 0.45, CORD_Z], [PULLEY.x, PULLEY.y + 0.45, CORD_Z]];
    R.route("cord.top", route, 0.45, { piece: "load", limp: true, ends: [false, false], touch: ["drum.core", "pulley.groove", "pulley.flange*"] });
    tubePieces(route, 0.45, P, { maxLength: 12, spacing: 0.5, stripes: false }).forEach((piece, index) => put(`cord.top:${index}`, "load", piece.mid, tubeSvg(piece, { tone: "hi" }), [A.tube(piece.points, piece.radii)], { route: "cord.top", chunk: index }));
  }

  // ---- protractor on two posts ----
  const ringPts = [];
  const N0 = 48;
  for (let i = 0; i <= N0; i++) {
    const a = PRO.from + ((PRO.to - PRO.from) * i) / N0;
    const [dx, dy] = dirOf(a);
    ringPts.push([PRO.c[0] + PRO.r1 * dx, PRO.c[1] + PRO.r1 * dy]);
  }
  for (let i = N0; i >= 0; i--) {
    const a = PRO.from + ((PRO.to - PRO.from) * i) / N0;
    const [dx, dy] = dirOf(a);
    ringPts.push([PRO.c[0] + PRO.r0 * dx, PRO.c[1] + PRO.r0 * dy]);
  }
  const POSTS = [-5, 185].map((a) => {
    const [dx, dy] = dirOf(a);
    return [PRO.c[0] + 36 * dx, PRO.c[1] + 36 * dy];
  });
  for (const [x, y] of POSTS) {
    cyl("protractor.post", "protractor", x, y, 2.4, 1.4, PRO.z - 2.2, { tone: "lo" }, { steps: 20 });
    cyl("protractor.boss", "protractor", x, y, 3.4, PRO.z - 2.2, PRO.z, { tone: "mid" }, { steps: 24 });
    cyl("protractor.foot", "protractor", x, y, 4.6, 0, 1.4, { tone: "lo" }, { steps: 28 });
  }
  {
    const shape = R.solid(A.extruded(ringPts, PRO.z, PRO.t, { name: "protractor" }));
    const zt = PRO.z + PRO.t;
    const tick = k.radialTicks(PRO.c[0], PRO.c[1], PRO.r1 - 0.2, 36, 6, zt, [2.6, 5.4], P, -Math.PI / 2, -Math.PI);
    const zero = { major: [0, 180].map((a) => { const [dx, dy] = dirOf(a); return k.lineOnTop([PRO.c[0] + (PRO.r0 + 0.2) * dx, PRO.c[1] + (PRO.r0 + 0.2) * dy], [PRO.c[0] + (PRO.r1 - 0.2) * dx, PRO.c[1] + (PRO.r1 - 0.2) * dy], zt, P); }).join("") };
    const band = Ln(k.onTop(Array.from({ length: 49 }, (_, i) => { const [dx, dy] = dirOf(PRO.from + ((PRO.to - PRO.from) * i) / 48); return [PRO.c[0] + (PRO.r1 - 5.4) * dx, PRO.c[1] + (PRO.r1 - 5.4) * dy]; }), zt, P), { tone: "faint" });
    const inner = Ln(k.onTop(Array.from({ length: 41 }, (_, i) => {
      const [dx, dy] = dirOf(PRO.from + ((PRO.to - PRO.from) * i) / 40);
      return [PRO.c[0] + (PRO.r0 + 3) * dx, PRO.c[1] + (PRO.r0 + 3) * dy];
    }), zt, P), { tone: "faint" });
    const screws = Dots(POSTS.map(([x, y]) => at([x, y, zt])), { size: 0.55, tone: "hi" });
    // the target marker: a small wedge outside the scale, rotated by the page to the commanded angle
    const [tx, ty] = PRO.c;
    const wedge = k.onTop([[tx - (PRO.r1 - 7.2), ty], [tx - (PRO.r1 - 2.6), ty - 1.8], [tx - (PRO.r1 - 2.6), ty + 1.8]], zt + 0.02, P, true);
    const marker = `<g class="sv-target" data-target><path class="sv-target-fill" d="${wedge}"/><path class="iso-line" data-tone="lit" d="${wedge}"/></g>`;
    put("protractor", "protractor", [PRO.c[0], PRO.c[1] + 30, PRO.z], S(k.extrude(ringPts, PRO.z, PRO.t, P, { convex: false, bevel: 0.4 }), { tone: "mid", className: "sv-acrylic" }) + Ln(tick.minor, { tone: "lo" }) + Ln(tick.major, { tone: "mid" }) + Ln(zero.major, { tone: "hi" }) + inner + band + screws + marker, [shape], { bias: 0 });
  }

  // ---- pulley tower and hanger ----
  const PT = { x: PULLEY.x - 4, y: PULLEY.y - 16, w: 8, d: 8 };
  box("pulley.base", "pulley", [PT.x - 6, PT.y - 6, 0], [PT.x + PT.w + 6, PT.y + PT.d + 6, 3], { tone: "lo" }, { r: 1.4, steps: 3, bevel: 0.3, extra: Dots([[PT.x - 4, PT.y - 4], [PT.x + PT.w + 4, PT.y - 4], [PT.x - 4, PT.y + PT.d + 4], [PT.x + PT.w + 4, PT.y + PT.d + 4]].map(([x, y]) => at([x, y, 3])), { size: 0.45 }) });
  box("pulley.post", "pulley", [PT.x, PT.y, 3], [PT.x + PT.w, PT.y + PT.d, PULLEY.z + 5], { tone: "mid" }, {
    r: 0.8,
    inner: Ln([20, 40, 60].map((z) => k.sideSeam({ ...PT, r: 0.8 }, z, P, 2)).join(""), { tone: "faint" }),
  });
  const AX = G.frameOf([PULLEY.x, PT.y + PT.d, PULLEY.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("pulley.axle", "pulley", AX, 0, PULLEY.y - 2.4 - (PT.y + PT.d), 1.3, { tone: "hi" });
  const PF = G.frameOf([PULLEY.x, PULLEY.y, PULLEY.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("pulley.flange.back", "pulley", PF, -2.4, -1, PULLEY.r + 1.6, { tone: "mid" });
  disc("pulley.groove", "pulley", PF, -1, 1, PULLEY.r, { tone: "lo" });
  // cord: horizontal from the drum to the pulley top, then down the far side to the hook (page rebuilds the drop)
  const flange = disc("pulley.flange", "pulley", PF, 1, 2.4, PULLEY.r + 1.6, { tone: "mid" }, {
    extra: `<g data-pulley>${Ln(G.circleOf(PF, 2.4, 2.4, P, 24), { tone: "lo" })}${Dots([at(G.pointOf(PF, 2.4, 5, 0))], { size: 0.55, tone: "hi" })}</g>`,
  });
  void flange;
  {
    const z = HANG.z0;
    const hz = (dz) => z - dz;
    const HF = G.frameOf([HANG.x, HANG.y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    const shapes = [
      R.solid(A.cylinder(HANG.x, HANG.y, 0.8, hz(26), 26 - 3, { name: "hanger.rod" })),
      R.solid(A.cylinder(HANG.x, HANG.y, 7, hz(28), 2, { name: "hanger.base" })),
      R.solid(A.cylinder(HANG.x, HANG.y, 0.6, hz(3), 4.6, { name: "hanger.hook" })),
    ];
    void HF;
    const masses = [];
    for (let i = 0; i < 8; i++) {
      const z0 = hz(26) + i * 2.8;
      masses.push(`<g data-mass="${i}">${S(k.cylinder(HANG.x, HANG.y, 9, z0, 2.6, P, 40, 0.3), { tone: "hi", inner: "" })}${Ln(k.onTop([[HANG.x - 1, HANG.y], [HANG.x - 1, HANG.y + 8.94], [HANG.x + 1, HANG.y + 8.94], [HANG.x + 1, HANG.y]], z0 + 2.6, P, true), { tone: "lo" })}</g>`);
    }
    const hook = `<path class="iso-line sv-hook" data-tone="hi" d="${path3([[HANG.x, HANG.y, hz(3)], [HANG.x, HANG.y, hz(1)]])}${k.pathOf(Array.from({ length: 24 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 24;
      return at([HANG.x + 1.8 * Math.sin(a), HANG.y, hz(1) + 1.8 - 1.8 * Math.cos(a)]);
    }), true)}"/>`;
    const rod = S(k.cylinder(HANG.x, HANG.y, 0.8, hz(26), 23, P, 14), { tone: "mid" });
    const base = S(k.cylinder(HANG.x, HANG.y, 7, hz(28), 2, P, 36, 0.3), { tone: "mid" });
    put("hanger", "load", [HANG.x, HANG.y, hz(16)], `<g data-hanger>${base}${masses.join("")}${rod}${hook}</g>`, shapes, { bias: 0 });
    // the hanging cord, from the pulley's far rim down to the hook
    put("cord.drop", "load", [HANG.x, HANG.y, (PULLEY.z + z) / 2], `<path class="iso-line sv-cord" data-tone="hi" data-cord="drop" d="${path3([[HANG.x, HANG.y, PULLEY.z], [HANG.x, HANG.y, z + 2.6]])}"/>`, [R.solid(A.cylinder(HANG.x, HANG.y, 0.4, z + 1.6, PULLEY.z - z - 1.6, { name: "cord.drop" }))], { bias: -0.5 });
  }

  // ---- the servo's top cover, taken off and laid upside down on the bench ----
  {
    const CV = { x: 36, y: 22, w: 80, d: 40, r: 3 };
    const cx = CV.x + CV.w / 2;
    const cy = CV.y + CV.d / 2;
    back.push(`<path class="iso-halo" d="${k.haloOf(CV, 0, 2, P)}"/>`);
    box("cover.shell", "cover", [CV.x, CV.y, 0], [CV.x + CV.w, CV.y + CV.d, 7], { tone: "mid" }, {
      r: 3,
      steps: 4,
      bevel: 0.5,
      inner: Ln(k.sideSeam(CV, 3.4, P, 4), { tone: "faint" }),
      extra: Ln(k.planOutline(k.insetPlan(CV, 2), 7, P, 4), { tone: "lo" }) + Dots(k.corners(CV, 4).map(([x, y]) => at([x, y, 7])), { size: 0.55, tone: "hi" }),
    });
    cyl("cover.boss", "cover", cx + 18, cy, 6, 7, 10, { tone: "hi" }, { steps: 40, extra: Ln(k.ring(cx + 18, cy, 3.2, 10, P, 24), { tone: "lo" }) });
    cyl("cover.boss", "cover", cx - 4, cy, 3.4, 7, 9.4, { tone: "hi" }, { steps: 28, extra: Ln(k.ring(cx - 4, cy, 1.4, 9.4, P, 16), { tone: "lo" }) });
    cyl("cover.boss", "cover", cx - 22, cy, 3.4, 7, 9.4, { tone: "mid" }, { steps: 28, extra: Ln(k.ring(cx - 22, cy, 1.6, 9.4, P, 16), { tone: "lo" }) });
  }

  // ---- controller board ----
  for (const [x, y] of k.corners(BOARD, 3.4)) cyl("ctrl.standoff", "ctrl", x, y, 2, 0, BOARD_Z, { tone: "lo" }, { steps: 6 });
  box("ctrl.board", "ctrl", [BOARD.x, BOARD.y, BOARD_Z], [BOARD.x + BOARD.w, BOARD.y + BOARD.d, BT], { tone: "lo" }, {
    r: 2,
    steps: 4,
    extra: Ln(k.corners(BOARD, 3.4).map(([x, y]) => k.ring(x, y, 1.8, BT, P, 14)).join(""), { tone: "mid" }) + Dots(k.corners(BOARD, 3.4).map(([x, y]) => at([x, y, BT])), { size: 0.5, tone: "hi" }),
  });
  box("ctrl.mcu", "ctrl", [60, -44, BT], [70, -34, BT + 1.4], { tone: "hi" }, { r: 0.3, steps: 1, extra: Dots([...Array.from({ length: 7 }, (_, i) => [61 + i * 1.33, -44.4]), ...Array.from({ length: 7 }, (_, i) => [61 + i * 1.33, -33.6])].map(([x, y]) => at([x, y, BT])), { size: 0.25, tone: "lo" }) + Dots([at([61.4, -42.6, BT + 1.4])], { size: 0.4, tone: "lo" }) });
  box("ctrl.usb", "ctrl", [BOARD.x + BOARD.w - 9, -32, BT], [BOARD.x + BOARD.w + 1.2, -24, BT + 3.4], { tone: "hi" }, { r: 0.8, steps: 2, extra: Ln(k.planOutline({ x: BOARD.x + BOARD.w - 7, y: -30.6, w: 7, d: 5.2, r: 0.6 }, BT + 3.4, P, 2), { tone: "lo" }) });
  box("ctrl.reg", "ctrl", [54, -14, BT], [62, -7, BT + 2.2], { tone: "mid" }, { r: 0.3, steps: 1 });
  cyl("ctrl.cap", "ctrl", 50, -40, 2.2, BT, BT + 5, { tone: "hi" }, { steps: 22 });
  put("ctrl.led", "ctrl", [52, -6, BT], `<g class="sv-led">${Dots([at([52, -6, BT + 0.6])], { size: 0.9, tone: "hi" })}</g>`, [R.solid(A.box([51.2, -6.8, BT], [52.8, -5.2, BT + 0.6], { name: "ctrl.led" }))], { bias: 0.1 });
  // header and the servo plug lying on it
  box("ctrl.header", "ctrl", [PLUG.x1, PLUG.y0, BT], [PLUG.x1 + 4, PLUG.y1, BT + 6], { tone: "lo" }, { r: 0.3, steps: 1 });
  box("cable.plug", "cable", [PLUG.x0, PLUG.y0, PLUG.z0], [PLUG.x1, PLUG.y1, PLUG.z1], { tone: "mid" }, {
    r: 0.6,
    steps: 2,
    inner: Ln(k.sideSeam({ x: PLUG.x0, y: PLUG.y0, w: PLUG.x1 - PLUG.x0, d: PLUG.y1 - PLUG.y0, r: 0.6 }, PLUG.z0 + 3, P, 2), { tone: "faint" }),
  });
  // OLED module on four pins, its picture drawn in the plane of its glass by the page
  for (const [x, y] of k.corners({ x: OLED.x, y: OLED.y, w: OLED.w, d: OLED.d }, 1.6)) cyl("oled.pin", "oled", x, y, 0.7, BT, BT + 4, { tone: "hi" }, { steps: 10 });
  box("oled.board", "oled", [OLED.x, OLED.y, BT + 4], [OLED.x + OLED.w, OLED.y + OLED.d, BT + 5.2], { tone: "lo" }, { r: 0.6, steps: 2 });
  {
    const m = k.topMatrix([GL.x, GL.y], GZ + 0.01, P, "x");
    const screen = `<g class="sv-oled" transform="${m}"><rect class="sv-oled-bg" x="0" y="0" width="${GL.w}" height="${GL.d}" rx="0.4"/><g data-oled></g></g>`;
    box("oled.glass", "oled", [GL.x, GL.y, BT + 5.2], [GL.x + GL.w, GL.y + GL.d, GZ], { tone: "mid" }, { r: 0.3, steps: 1, extra: screen });
  }
  // knob (rotary potentiometer) with a pointer the page rebuilds
  box("knob.base", "knob", [KNOB.x - 5.5, KNOB.y - 5.5, BT], [KNOB.x + 5.5, KNOB.y + 5.5, BT + 4], { tone: "mid" }, { r: 0.6, steps: 2, extra: Dots([at([KNOB.x - 4.2, KNOB.y + 5.5, BT + 1.6]), at([KNOB.x + 4.2, KNOB.y + 5.5, BT + 1.6])], { size: 0.35, tone: "hi" }) });
  cyl("knob.nut", "knob", KNOB.x, KNOB.y, 4, BT + 4, KNOB.z0, { tone: "lo" }, { steps: 6 });
  cyl("knob", "knob", KNOB.x, KNOB.y, KNOB.r, KNOB.z0, KNOB.z0 + KNOB.h, { tone: "hi" }, {
    steps: 48,
    bevel: 0.5,
    extra: Ln(k.knurl(KNOB.x, KNOB.y, KNOB.r, KNOB.z0, KNOB.z0 + KNOB.h, 40, P, 0.35), { tone: "lo" }) + `<path class="iso-line" data-tone="lit" data-knob d="${k.lineOnTop([KNOB.x, KNOB.y], [KNOB.x, KNOB.y + KNOB.r - 1.4], KNOB.z0 + KNOB.h, P)}" data-free="end" style="stroke-width:1.1"/>` + Dots([at([KNOB.x, KNOB.y, KNOB.z0 + KNOB.h])], { size: 0.6, tone: "hi" }),
  });

  // ---- servo cable: three wires on edge, from the boot on the far wall to the plug ----
  const BOOT = { x0: -5, x1: 5, y0: CASE.y - 4, y1: CASE.y, z0: 6.6, z1: 14.6 };
  box("cable.boot", "cable", [BOOT.x0, BOOT.y0, BOOT.z0], [BOOT.x1, BOOT.y1, BOOT.z1], { tone: "lo" }, { r: 1.2, steps: 3 });
  const WIRE_Z = [9.1, 10.6, 12.1];
  const WIRE_TONES = ["lo", "mid", "hi"];
  WIRE_Z.forEach((z, i) => {
    const name = `cable.wire${i}`;
    const pts = [[0, BOOT.y0, z], [0, -58, z], [28, -58, z], [28, -26, z], [PLUG.x0, -26, z]];
    const route = G.fillet(pts, 4, 10, { P, tube: 0.7 });
    R.route(name, route, 0.7, { piece: "cable", bundle: "cable", limp: true });
    tubePieces(route, 0.7, P, { maxLength: 14, spacing: 0.7 }).forEach((piece, index) =>
      put(`${name}:${index}`, "cable", piece.mid, tubeSvg(piece, { tone: WIRE_TONES[i] }), [A.tube(piece.points, piece.radii)], { bias: 0.02 * i, route: name, chunk: index, attrs: i === 2 ? ` data-signal` : "" }),
    );
  });

  return { R, back, train, put };
}

// ---- moving parts: horn with its pointer arm, drum, cord. Same code builds the first paint and the page. ----
const HORN = { z: HORN_Z, t: HORN_T, hub: 6.5, arm: 44, tipW: 0.9, baseW: 4.2 };
const hornSvg = (deg) => hornOf(deg, SHAFT.A, HORN, k, P);

// ---- assemble per gear set: same order is required so the page can swap gear markup in place ----
const BUILDS = {};
for (const set of Object.keys(GEARSETS)) BUILDS[set] = buildFigure(set);
// One order for every gear set: settle the biggest gears (they overlap the most), give every set the same keys
// item by item (the sets draw the same items in the same sequence), then the audit checks each set's true shapes.
A.settle(BUILDS.strong.R, P);
const KEYS = BUILDS.strong.R.items.map((item) => item.key);
for (const b of Object.values(BUILDS)) {
  b.R.items.forEach((item, i) => (item.key = KEYS[i]));
  b.R.items.sort((x, y) => x.key - y.key);
}
const sameOrder = new Set(Object.values(BUILDS).map((b) => b.R.items.map((item) => item.name).join("|"))).size === 1;
const MAIN = BUILDS[DEF.gear];
const groups = MAIN.R.items.map((item) => `<g class="it" data-piece="${item.piece}" data-name="${item.name}"${item.attrs ?? ""}>${item.svg}</g>`);
const GEAR_MARKUP = Object.fromEntries(Object.entries(BUILDS).map(([set, b]) => [set, Object.fromEntries(b.R.items.filter((i) => i.name.startsWith("gear.") && /^gear\.(pm|p\d|g\d)$/.test(i.name)).map((i) => [i.name.slice(5), i.svg]))]));
const TRAINS = Object.fromEntries(Object.keys(GEARSETS).map((set) => [set, gearTrain(set)]));

const svg = k.figureSvg({
  width: W,
  height: H,
  label:
    "작업대 위에 서보 모터가 네 개의 육각 기둥 위에 서 있습니다. 앞쪽 두 벽을 잘라 내어 안쪽의 직류 모터, 네 단 감속 기어, 출력축 아래의 가변저항, 바닥의 제어 기판이 보입니다. 출력축 위의 혼에는 긴 지시 바늘과 드럼이 달려 있고, 바늘은 각도판 위를 돕니다. 드럼에 감긴 줄은 왼쪽 도르래를 넘어 추 걸이를 매달고 있습니다. 오른쪽 제어 보드의 손잡이가 PWM 펄스 폭을 정하고, 작은 화면에 펄스 모양이 나옵니다.",
  body: [...MAIN.back, `<g class="sv-items">${groups.join("")}</g>`, `<g class="it" data-piece="horn" data-name="horn" data-horn>${hornSvg(DEF_TH)}</g>`],
});

const DATA = {
  P,
  shaftA: SHAFT.A,
  horn: HORN,
  drum: { r: DRUM_R, cordZ: CORD_Z, top: DRUM_Z + 6 },
  pro: PRO,
  hang: HANG,
  pulley: PULLEY,
  knob: KNOB,
  oled: { ...GL, z: GZ },
  trains: TRAINS,
  gearMarkup: GEAR_MARKUP,
  def: { ...DEF, th: DEF_TH },
};

const CSS = `
.sv-cord{stroke-width:.9}
.sv-hook{stroke-width:.9;fill:none}
.sv-target-fill{fill:var(--sv-target)}
.sv-target .iso-line{stroke:var(--sv-target)}
.iso{--sv-target:#ff6b5a;--sv-oled-bg:#0b0f14;--sv-oled-ink:#7fd3ff;--sv-oled-dim:#2e4a5c}
.iso[data-theme="light"]{--sv-target:#d9412b;--sv-oled-bg:#0f1720;--sv-oled-ink:#62c4ff;--sv-oled-dim:#2c4758}
.sv-oled-bg{fill:var(--sv-oled-bg)}
.sv-oled text{font:600 2.3px/1 var(--anatomy-mono,ui-monospace,monospace);fill:var(--sv-oled-ink)}
.sv-oled .sv-wave{fill:none;stroke:var(--sv-oled-ink);stroke-width:.35;stroke-linejoin:round}
.sv-oled .sv-grid{fill:none;stroke:var(--sv-oled-dim);stroke-width:.2}
.sv-blur{opacity:0}
.sv-acrylic .iso-fill{fill-opacity:.18}.sv-acrylic .iso-top{fill-opacity:.22}.sv-acrylic .iso-shade{fill-opacity:.5}
.iso-stage{touch-action:none}
.iso-stage [data-piece="knob"],.iso-stage [data-horn]{cursor:grab}
.iso-stage.sv-grabbing,.iso-stage.sv-grabbing *{cursor:grabbing}
.sv-chart{margin:16px 0 0;padding:14px 16px 12px;background:var(--anatomy-card);box-shadow:0 0 0 1px var(--anatomy-mid);--c-now:var(--anatomy-strong);--c-target:var(--sv-target);--c-ghost:var(--anatomy-text);--c-grid:color-mix(in srgb,var(--anatomy-mid) 45%,transparent)}
.sv-chart-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 12px}
.sv-chart-title{margin:0;font-size:14px;font-weight:700;color:var(--anatomy-strong)}
.sv-chart-sub{margin:0;font-size:12.5px;color:var(--anatomy-text)}
.sv-chart-legend{display:flex;flex-wrap:wrap;gap:4px 16px;margin:8px 0 2px;padding:0;list-style:none;font-size:12.5px;color:var(--anatomy-text)}
.sv-chart-legend li{display:flex;align-items:center;gap:6px}
.sv-chart-legend svg{width:18px;height:8px;flex:none}
.sv-chart-svg{display:block;width:100%;height:200px;touch-action:pan-y}
.sv-chart-svg .grid{stroke:var(--c-grid);stroke-width:1}
.sv-chart-svg .tick{font:11px/1 var(--anatomy-mono);fill:var(--anatomy-text)}
.sv-chart-svg .axis{font:11.5px/1 var(--edu-font,inherit);fill:var(--anatomy-text)}
.sv-line{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.sv-line[data-kind="now"]{stroke:var(--c-now)}
.sv-line[data-kind="target"]{stroke:var(--c-target);stroke-dasharray:5 4;stroke-width:1.5}
.sv-line[data-kind="ghost"]{stroke:var(--c-ghost);stroke-width:1.5;opacity:.55}
.sv-chart-read{min-height:1.5em;margin:4px 0 0;font-size:12.5px;line-height:1.45;color:var(--anatomy-text);font-variant-numeric:tabular-nums}
@media (max-width:560px){.sv-chart{padding:12px 10px 10px}}
`;

const MODEL_SRC = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const SHARED_SRC = readFileSync(join(HERE, "shared.mjs"), "utf8").replace(/^export /gm, "");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));

const chartHtml = `<section class="sv-chart" aria-label="서보 응답 그래프"><div class="sv-chart-head"><h3 class="sv-chart-title">응답 그래프 · 명령 뒤 각도</h3><p class="sv-chart-sub">목표가 바뀐 순간부터 출력축 각도를 그립니다. 모델이 그림을 움직이는 값 그대로입니다.</p></div><ul class="sv-chart-legend"><li><svg viewBox="0 0 18 8" aria-hidden="true"><path class="sv-line" data-kind="target" d="M1 4h16"/></svg>목표 각도</li><li><svg viewBox="0 0 18 8" aria-hidden="true"><path class="sv-line" data-kind="now" d="M1 4h16"/></svg>실제 각도(지금)</li><li><svg viewBox="0 0 18 8" aria-hidden="true"><path class="sv-line" data-kind="ghost" d="M1 4h16"/></svg>지난번</li></ul><svg class="sv-chart-svg" data-chart viewBox="0 0 600 200" height="200" role="img" aria-label="응답 그래프"></svg><p class="sv-chart-read" data-chart-read>손잡이를 돌리거나 펄스 폭을 바꾸면 그래프가 그려집니다.</p></section>`;

const stageHtml = `<div class="iso-stage" tabindex="0" role="group" aria-label="서보 모터. 오른쪽 제어 보드의 손잡이를 끌어 펄스 폭을 바꾸고, 지시 바늘을 끌어 손으로 비틀어 볼 수 있습니다. 왼쪽·오른쪽 화살표는 펄스 폭을 0.05 ms씩 바꿉니다.">${svg}</div>`;
const firstValues = {
  pwm: fmt.ms(DEF.pwm),
  target: fmt.deg0(DEF_TARGET),
  th: fmt.deg(DEF_TH),
  ratio: fmt.ratio(DEF_P.N),
  kp: fmt.kp(DEF.kp),
  load: fmt.kg(DEF.load),
  loadCase: DEF.load ? `${fmt.kg(DEF.load)}의 추를 들고 있어` : "추를 매달지 않아",
  ess: fmt.deg(DEF_TARGET - DEF_TH),
};
const pdfName = "servo-motor-a4.pdf";
let html = eduPage({ content, theme: THEME, stage: stageHtml, css: CSS, script: kitScript() + MODEL_SRC + SHARED_SRC + LIVE, values: firstValues, head: existsSync(join(HERE, pdfName)) ? pdfButton(pdfName) : "" });
html = html.replace('</div><aside class="edu-panel"', `${chartHtml}</div><aside class="edu-panel"`);
const name = THEME === "light" ? "servo-motor-ko-light.html" : "servo-motor-ko.html";
writeFileSync(join(HERE, name), html);
console.log("wrote", name, `${(html.length / 1024).toFixed(0)} KB`, `${MAIN.R.items.length} items`, `scale ${KS.toFixed(3)}`, `orders ${sameOrder ? "match" : "DIFFER"}`);

if (AUDIT) {
  let failed = 0;
  for (const [set, b] of Object.entries(BUILDS)) {
    console.log(`\n== audit: gear set ${set} (${fmt.ratio(ratioOf(set))})`);
    const result = A.audit(b.R, P, {});
    console.log(A.report(result));
    const n = A.failures(result);
    failed += n;
    console.log(n ? `audit failed: ${n} problems` : "audit passed");
  }
  if (!sameOrder) failed++;
  if (failed) process.exitCode = 1;
}
