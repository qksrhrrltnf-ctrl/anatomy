// Heat pump (split air-source, R-32): a Korean teaching figure built from scratch on the Anatomy kit.
// Indoor unit on the left, outdoor unit on a concrete pad on the right, joined by the line set.
// The refrigerant loop is real tube-kit pipework, coloured by phase and temperature, with flow dots;
// the 4-way valve reverses the loop (heating <-> cooling). Numbers come from model.js.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { eduPage, writePage } from "../../edu/kit/edu.mjs";
import content from "./ko.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const MODEL_JS = readFileSync(join(HERE, "model.js"), "utf8");
const HP = new Function(`${MODEL_JS}\nreturn HP;`)();
const param = (id) => content.params.find((entry) => entry.id === id).value;

const W = 820;
const H = 430;
const DEG = Math.PI / 180;

// ---------- world layout (units ≈ px, z up; +x to the lower right, +y to the lower left on screen) ----------
const PLATE = { x: -252, y: -72, w: 500, d: 144, r: 8 };
const PLATE_H = 9;
const FOOT_H = 5;
// indoor unit
const IU = { x: -238, y: -42, w: 146, d: 78, r: 3 };
const IU_FLOOR = 6;
const IU_TOP = 122;
const IU_COIL = { x: -228, y: -34, w: 120, d: 9, r: 0.6 };
const IU_COIL_Z = [12, 106];
const IU_FAN = { y: 6, z: 50, r: 13, x0: -224, x1: -126 };
const IU_HEADER = [-114, -20];
const IU_DIST = [-124, -21.6];
// outdoor unit
const PAD = { x: -8, y: -64, w: 248, d: 128, r: 4 };
const PAD_Z = 4;
const OU = { x: 0, y: -55, w: 230, d: 110, r: 3 };
const OU_FLOOR = 14; // top of the base pan
const OU_COIL = { x: 96, y: -55, w: 132, d: 8, r: 0.6 };
const OU_COIL_Z = [OU_FLOOR, 128];
const OU_HEADER = [101.5, -42];
const OU_DIST = [101.5, -43.6];
const CMP = [62, -14];
const CMP_R = 17;
const ACC = [22, -14];
const ACC_R = 8;
const VALVE = { x: 62, y: -14, z: 116, r: 5.5, x0: 40, x1: 84 };
const PORTS = { E: 46, S: 62, C: 78 };
const GAS_SV = [10, 30, 42];
const LIQ_SV = [10, 46, 24];
const EEV = [40, 46];
const FAN = { x: 162, y: 8, z: 70, r: 44 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [IU.x, IU.y, IU_TOP + 8], [OU.x + OU.w, OU.y, OU_COIL_Z[1]], [62, -14, 160], [IU.x + IU.w, IU.y + IU.d, IU_TOP + 8]],
  W,
  H,
  { pad: 22, azimuth: 60, elevation: 30 },
);
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const FADE = [0.04, 0.42];
const UP = [0, 0, 1];
const vertical = (x, y, z = 0) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const alongX = (y, z, x = 0) => G.frameOf([x, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const alongY = (x, z, y = 0) => G.frameOf([x, y, z], [0, 1, 0], [0, 0, 1], [1, 0, 0]);

// ---------- recorder and drawing helpers (every helper records the true shape it draws) ----------
const R = A.recorder(P);
const { items, nameFor } = R;
const record = R.solid;
function put(piece, ref, svg, { bias = 0, name, shapes = [], seg, flow } = {}) {
  R.put({ piece, at: ref, bias, svg, shapes, name: name ?? nameFor(`${piece}.item`), seg, flow });
}
function box(piece, plan, z, h, { tone = "mid", lit, inner = "", extra = "", bias = 0, name, steps = 3, bevel = 0.5, crease, seg } = {}) {
  const id = nameFor(name ?? `${piece}.box`);
  put(piece, [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], S(k.slabOf(plan, z, h, P, steps, bevel), { tone, lit, inner, crease }) + extra, { bias, name: id, seg, shapes: [record(A.slab(plan, z, h, { name: id }, steps))] });
  return id;
}
function cyl(piece, cx, cy, r, z, h, { tone = "mid", lit, inner = "", extra = "", bias = 0, name, steps = 32, bevel = 0.4, seg } = {}) {
  const id = nameFor(name ?? `${piece}.cyl`);
  put(piece, [cx, cy, z + h / 2], S(k.cylinder(cx, cy, r, z, h, P, steps, bevel), { tone, lit, inner }) + extra, { bias, name: id, seg, shapes: [record(A.cylinder(cx, cy, r, z, h, { name: id }))] });
  return id;
}
function turned(piece, F, profile, { tone = "hi", lit, inner = "", extra = "", bias = 0, name, smooth, owner, seg } = {}) {
  const id = nameFor(name ?? `${piece}.turned`);
  const paths = G.solidOf(profile, F, P, smooth ? { smooth } : {});
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  const shape = record(A.solid(F, profile, { name: id, owner }));
  put(piece, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone, lit, inner }) + extra, { bias, name: id, seg, shapes: [shape] });
  return shape;
}
function discAt(piece, F, s0, s1, r, { tone = "mid", lit, inner = "", extra = "", bias = 0, name, owner, seg, bevel = 0 } = {}) {
  const id = nameFor(name ?? `${piece}.disc`);
  const shape = record(A.disc(F, s0, s1, r, { name: id, owner }));
  put(piece, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), S(G.disc(s0, s1, r, F, P, bevel ? { bevel } : {}), { tone, lit, inner }) + extra, { bias, name: id, seg, shapes: [shape] });
  return shape;
}
function ballAt(piece, centre, r, { tone = "mid", bias = 0, name, owner, seg } = {}) {
  const id = nameFor(name ?? `${piece}.ball`);
  const shape = record(A.ball(centre, r, { name: id, owner }));
  put(piece, centre, S(G.sphereOf(centre, r, P, { steps: G.stepsFor(r, 32) }), { tone }), { bias, name: id, seg, shapes: [shape] });
  return shape;
}
// A saddle pad: a short boss whose base follows a curved host (the raptor's padOn). Returns the face point.
function padOn(piece, host, point, outward, a, h, { tone = "hi", bias = 0.1, name, owner, ring = false, seg } = {}) {
  const hosts = [host].flat();
  const inside = (p) => hosts.some((shape) => A.sdf(shape, p) < 0);
  const axis = G.unit3(outward);
  const F = G.frameAlong(point, axis);
  const start = (angle) => {
    let lo = -2.5 * a;
    let hi = h;
    if (!inside(G.pointOf(F, lo, a, angle))) return 0;
    for (let step = 0; step < 40; step++) {
      const mid = (lo + hi) / 2;
      if (inside(G.pointOf(F, mid, a, angle))) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  const low = Math.min(...Array.from({ length: 48 }, (_, index) => start((index / 48) * Math.PI * 2)));
  const id = nameFor(name ?? `${piece}.pad`);
  const face = ring && G.dot3(axis, V) > 0.15 ? Ln(G.circleOf(F, h, a * 0.55, P, 16), { tone: "faint" }) : "";
  put(piece, G.add3(point, G.mul3(axis, h / 2)), S(G.saddleOf(F, a, start, h, P), { tone }) + face, { bias, name: id, seg, shapes: [record(A.disc(F, low - 0.05, h, a, { name: id, owner, seated: true, cut: hosts }))] });
  return G.add3(point, G.mul3(axis, h));
}

// ---------- refrigerant routes ----------
// seg: which stretch of the loop (its colour comes from STATE[mode][seg]); heat/cool: flow direction along the points.
const ROUTES = [];
const FLOW_SPACING = 9;
function pipe(piece, name, control, r, { seg, heat = 1, cool = 1, bend = 2.6, maxLength = 22, breaks = [], tone = "hi", touch } = {}) {
  const line = G.fillet(control, Math.max(r * bend, 4), 12, { P, tube: r });
  const id = nameFor(`${piece}.${name}`);
  R.route(id, line, r, { owner: id, touch, piece });
  const index = ROUTES.length;
  const route = { id, seg, heat, cool, r, chunks: [] };
  ROUTES.push(route);
  tubePieces(line, r, P, { maxLength, spacing: Math.max(0.8, Math.min(2.2, r * 0.5)), breaks }).forEach((part, chunk) => {
    // flow dots for this chunk: its centreline on screen with 3D arc length from the route's start
    let walked = part.from;
    const pts = part.points.map((point, i) => {
      if (i) walked += G.len3(G.sub3(point, part.points[i - 1]));
      const [sx, sy] = at(point);
      return [+sx.toFixed(2), +sy.toFixed(2), +walked.toFixed(2)];
    });
    const span = pts[pts.length - 1][2] - pts[0][2];
    const count = Math.max(1, Math.ceil(span / FLOW_SPACING) + 1);
    route.chunks.push({ pts, from: pts[0][2], to: pts[pts.length - 1][2] });
    const dots = `<g class="hp-dots" data-r="${index}" data-c="${chunk}" aria-hidden="true">${Array.from({ length: count }, () => `<circle r="${Math.max(0.9, r * KS * 0.42).toFixed(2)}" cx="${pts[0][0]}" cy="${pts[0][1]}" display="none"/>`).join("")}</g>`;
    put(piece, part.mid, tubeSvg(part, { tone }) + dots, { name: `${id}:${chunk}`, seg, shapes: [A.tube(part.points, part.radii)] });
    items[items.length - 1].route = id;
    items[items.length - 1].chunk = chunk;
  });
  return line;
}

// ---------- static base (drawn first, behind everything) ----------
const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
for (const [x, y] of k.corners(PLATE, 22).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
  back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
}
{
  const strip = { x: -238, y: PLATE.y + PLATE.d - 13, w: 150, d: 7, r: 1 };
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
  const label = { x: -78, y: PLATE.y + PLATE.d - 15, w: 56, d: 10, r: 1.2 };
  const rules = [[label.x + 4, label.y + 3, 30], [label.x + 4, label.y + 5.2, 44], [label.x + 4, label.y + 7.4, 22]]
    .map(([x, y, w]) => Ln(k.lineOnTop([x, y], [x + w, y], 0.8, P), { tone: "lo", free: true })).join("");
  back.push(
    S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }),
    Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }),
    Ln(k.corners(PLATE, 10).map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }),
    Dots(k.corners(PLATE, 10).map(([x, y]) => at([x, y, 0])), { size: 0.5 }),
    S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }),
    Ln(ticks.minor, { tone: "lo" }),
    Ln(ticks.major, { tone: "mid" }),
    S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid", crease: "none" }) + Ln(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 2), { tone: "faint" }) + rules,
    Dots([at([label.x + 2, label.y + label.d / 2, 0.8]), at([label.x + label.w - 2, label.y + label.d / 2, 0.8])], { size: 0.4 }),
  );
}
record(A.box([PLATE.x, PLATE.y, -PLATE_H], [PLATE.x + PLATE.w, PLATE.y + PLATE.d, 0], { name: "stand.plate" }));

// ---------- outdoor unit: pad, feet, base pan, back panel, coil ----------
box("pad", PAD, 0, PAD_Z, { tone: "lo", name: "stand.pad", steps: 4, bevel: 0.8, inner: Ln(k.sideSeam(PAD, 2, P, 4), { tone: "faint" }) });
for (const [x, y] of k.corners(OU, 14)) cyl("ouframe", x, y, 5, PAD_Z, OU_FLOOR - 6 - PAD_Z, { tone: "lo", name: "ouframe.foot", steps: 24 });
box("ouframe", OU, OU_FLOOR - 6, 6, {
  tone: "mid",
  name: "ouframe.pan",
  steps: 4,
  bevel: 0.6,
  extra: Ln(k.planOutline(k.insetPlan(OU, 4), OU_FLOOR, P, 3), { tone: "faint" }) + Dots(k.corners(OU, 6).map(([x, y]) => at([x, y, OU_FLOOR])), { size: 0.45 }),
});
{
  const panel = { x: 0, y: -55, w: 94, d: 4, r: 0.8 };
  const ribs = [16, 40, 64].map((x) => k.segment([x, panel.y + panel.d, OU_FLOOR], [x, panel.y + panel.d, 130], P)).join("");
  box("ouframe", panel, OU_FLOOR, 130 - OU_FLOOR, { tone: "lo", name: "ouframe.back", inner: Ln(ribs, { tone: "faint" }), bevel: 0.4 });
}
// control box on the back panel (inverter board)
{
  const cb = { x: 36, y: -51, w: 34, d: 7, r: 1 };
  const slots = [0, 1, 2, 3].map((i) => k.planOutline({ x: cb.x + 6 + i * 6, y: cb.y + 2, w: 3, d: 3, r: 1 }, 106, P, 2)).join("");
  box("control", cb, 76, 30, { tone: "mid", name: "control.box", inner: Ln(k.sideSeam(cb, 100, P, 3), { tone: "faint" }), extra: Ln(slots, { tone: "lo" }) + Dots([at([cb.x + 2.4, cb.y + cb.d - 1.6, 106]), at([cb.x + cb.w - 2.4, cb.y + cb.d - 1.6, 106])], { size: 0.45 }) });
}

// heat-exchanger coil: a fin pack between two tube sheets, fins as lines edge to edge on the faces you see
function coil(piece, plan, z0, z1, { seg, sheets = "x" } = {}) {
  const front = plan.y + plan.d;
  const fins = [];
  for (let x = plan.x + 2.2; x < plan.x + plan.w - 1.5; x += 2.4) fins.push(k.segment([x, front, z0], [x, front, z1], P));
  const id = box(piece, plan, z0, z1 - z0, { tone: "mid", name: `${piece}.fins`, seg, inner: Ln(fins.join(""), { tone: "faint" }), bevel: 0.3, steps: 2, crease: "lo" });
  // tube sheets
  const sheetL = { x: plan.x - 2, y: plan.y - 1, w: 2, d: plan.d + 1, r: 0.4 };
  const sheetR = { x: plan.x + plan.w, y: plan.y - 1, w: 2, d: plan.d + 1, r: 0.4 };
  const rows = [];
  for (let z = z0 + 8; z < z1 - 4; z += 9) rows.push(z);
  const xR = sheetR.x + sheetR.w;
  const bends = rows.map((z, i) => k.sideRing([xR, plan.y + plan.d * (i % 2 ? 0.3 : 0.7), z], 1.4, "x", P)).join("");
  box(piece, sheetL, z0, z1 - z0 + 2, { tone: "mid", name: `${piece}.sheet`, bevel: 0.3, steps: 2 });
  box(piece, sheetR, z0, z1 - z0 + 2, { tone: "mid", name: `${piece}.sheet`, bevel: 0.3, steps: 2, extra: Ln(bends, { tone: "lo" }) });
  return id;
}
coil("oucoil", OU_COIL, OU_COIL_Z[0], OU_COIL_Z[1], { seg: "ocoil" });

// ---------- compressor (rotary, on rubber grommets) ----------
const CMPF = vertical(CMP[0], CMP[1], OU_FLOOR);
const DOME = 11;
const SHELL_TOP = 54; // s of the shell's dome start
const domeProfile = (s0, s1, r, h, steps = 14) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const t = (i / steps) * (Math.PI / 2);
    return [s0 + h * Math.sin(t), r * Math.cos(t), i && i < steps ? 1 : 0];
  });
// A turned body whose last run closes to the axis gets a stub (a pipe port) of radius rs rising to s = top.
function withStub(profile, rs, top) {
  const out = [];
  for (let i = 0; i < profile.length; i++) {
    const [ps, pr] = profile[i];
    if (i > 0 && pr < rs && profile[i - 1][1] >= rs) {
      const [qs, qr] = profile[i - 1];
      const t = (qr - rs) / (qr - pr);
      out.push([qs + (ps - qs) * t, rs]);
      out.push([top, rs], [top, 0]);
      return out;
    }
    out.push(profile[i]);
  }
  return out;
}
for (const angle of [90, 210, 330]) {
  const [gx, gy] = [CMP[0] + 15 * Math.cos(angle * DEG), CMP[1] + 15 * Math.sin(angle * DEG)];
  cyl("compressor", gx, gy, 3.4, OU_FLOOR, 3, { tone: "lo", name: "compressor.grommet", steps: 20 });
}
discAt("compressor", CMPF, 3, 6, CMP_R + 4, { tone: "mid", name: "compressor.foot", bevel: 0.5 });
const CMP_SHELL = turned("compressor", CMPF, withStub([[6, 0], [6, CMP_R], [SHELL_TOP, CMP_R], ...domeProfile(SHELL_TOP, SHELL_TOP + DOME, CMP_R, DOME).slice(1)], 3.2, SHELL_TOP + DOME + 3.4), {
  tone: "hi",
  name: "compressor.shell",
  inner: Ln(G.arcOf(CMPF, 12, CMP_R, P) + G.arcOf(CMPF, SHELL_TOP, CMP_R, P), { tone: "faint" }),
});
const CMP_TOP = OU_FLOOR + SHELL_TOP + DOME;
// terminal cover on the front of the shell
{
  const angle = 60 * DEG;
  const dir = [Math.cos(angle), Math.sin(angle), 0];
  const p = [CMP[0] + CMP_R * dir[0], CMP[1] + CMP_R * dir[1], OU_FLOOR + 46];
  padOn("compressor", CMP_SHELL, p, dir, 5.2, 4, { tone: "mid", name: "compressor.terminal", ring: true });
}

// ---------- accumulator ----------
const ACCF = vertical(ACC[0], ACC[1], OU_FLOOR);
cyl("accumulator", ACC[0], ACC[1], 6, OU_FLOOR, 3, { tone: "lo", name: "accumulator.pad", steps: 24 });
const capsule = (s0, s1, r, h, steps = 10) => [
  ...Array.from({ length: steps + 1 }, (_, i) => {
    const t = (i / steps) * (Math.PI / 2);
    return [s0 + h * (1 - Math.cos(t)), r * Math.sin(t), i && i < steps ? 1 : 0];
  }),
  ...Array.from({ length: steps + 1 }, (_, i) => {
    const t = (i / steps) * (Math.PI / 2);
    return [s1 - h + h * Math.sin(t), r * Math.cos(t), i && i < steps ? 1 : 0];
  }),
];
const ACC_BODY = turned("accumulator", ACCF, withStub(capsule(3, 51, ACC_R, 6), 3.6, 54), { tone: "hi", name: "accumulator.body", inner: Ln(G.arcOf(ACCF, 9, ACC_R, P) + G.arcOf(ACCF, 45, ACC_R, P), { tone: "faint" }) });
const ACC_TOP = OU_FLOOR + 51;

// ---------- 4-way reversing valve ----------
const VF = alongX(VALVE.y, VALVE.z, 0);
const VALVE_BODY = discAt("valve4", VF, VALVE.x0 + 2, VALVE.x1 - 2, VALVE.r, { tone: "hi", name: "valve4.body", inner: Ln(G.arcOf(VF, VALVE.x0 + 8, VALVE.r, P) + G.arcOf(VF, VALVE.x1 - 8, VALVE.r, P), { tone: "faint" }) });
discAt("valve4", VF, VALVE.x0, VALVE.x0 + 2, VALVE.r + 0.6, { tone: "mid", name: "valve4.cap" });
discAt("valve4", VF, VALVE.x1 - 2, VALVE.x1, VALVE.r + 0.6, { tone: "mid", name: "valve4.cap" });
const portFace = {};
for (const [port, x] of Object.entries(PORTS)) portFace[port] = padOn("valve4", VALVE_BODY, [x, VALVE.y, VALVE.z + VALVE.r], UP, port === "S" ? 3.6 : 3.4, 2.5, { tone: "hi", name: `valve4.port${port}` });
portFace.D = padOn("valve4", VALVE_BODY, [VALVE.x, VALVE.y, VALVE.z - VALVE.r], [0, 0, -1], 3.0, 2.5, { tone: "hi", name: "valve4.portD" });
// pilot valve and its solenoid coil, on the front of the body
const PILOT_Y = VALVE.y + VALVE.r + 2;
discAt("valve4", alongX(PILOT_Y, VALVE.z, 0), 54, 70, 2, { tone: "mid", name: "valve4.pilot" });
const COIL_BOX = { x: 56, y: PILOT_Y + 2, w: 12, d: 7, r: 1 };
box("solenoid", COIL_BOX, VALVE.z - 5, 11, { tone: "mid", name: "solenoid.coil", inner: Ln(k.sideSeam(COIL_BOX, VALVE.z + 2, P, 3), { tone: "faint" }), extra: Dots([at([COIL_BOX.x + 3, COIL_BOX.y + 3.5, VALVE.z + 6]), at([COIL_BOX.x + 9, COIL_BOX.y + 3.5, VALVE.z + 6])], { size: 0.45 }) });

// ---------- service valves on their brackets ----------
function serviceValve(piece, centre, flareR, { post = true } = {}) {
  const [x, y, z] = centre;
  const body = { x: x - 5, y: y - 5, w: 10, d: 10, r: 1.2 };
  if (post) box(piece, { x: x - 3, y: y - 3, w: 6, d: 6, r: 0.8 }, OU_FLOOR, z - 6 - OU_FLOOR, { tone: "lo", name: `${piece}.post` });
  box(piece, body, z - 6, 12, { tone: "hi", name: `${piece}.body`, bevel: 0.5, inner: Ln(k.sideSeam(body, z + 2, P, 3), { tone: "faint" }) });
  // stem cap (hex) on the front face, and the flare nut on the line-set side
  const capF = alongY(x, z - 1, y + 5);
  discAt(piece, capF, 0, 3.4, 3, { tone: "mid", name: `${piece}.cap`, extra: Ln(G.circleOf(capF, 3.4, 1.6, P, 16), { tone: "faint" }) });
  const nutF = alongX(y, z, x - 5);
  discAt(piece, nutF, -4, 0, flareR, { tone: "mid", name: `${piece}.flare`, extra: "" });
  return { flare: [x - 9, y, z], top: [x, y, z + 6], side: [x + 5, y, z] };
}
box("gasvalve", { x: 4, y: 21, w: 12, d: 4, r: 0.6 }, OU_FLOOR, GAS_SV[2] + 6 - OU_FLOOR, { tone: "lo", name: "gasvalve.bracket" });
const GSV = serviceValve("gasvalve", GAS_SV, 4.2, { post: false });
const LSV = serviceValve("liqvalve", LIQ_SV, 3.2);

// ---------- electronic expansion valve ----------
const EEVF = vertical(EEV[0], EEV[1], 0);
const EEV_BODY = discAt("eev", EEVF, 16, 34, 4.5, { tone: "hi", name: "eev.body", inner: Ln(G.arcOf(EEVF, 20, 4.5, P), { tone: "faint" }) });
discAt("eev", EEVF, 34, 46, 6.2, { tone: "mid", name: "eev.coil", bevel: 0.5, inner: Ln(G.arcOf(EEVF, 40, 6.2, P), { tone: "faint" }) });
const EEV_IN = padOn("eev", EEV_BODY, [EEV[0] - 4.5, EEV[1], LIQ_SV[2]], [-1, 0, 0], 2.6, 2, { name: "eev.in" });
const EEV_OUT = padOn("eev", EEV_BODY, [EEV[0] + 4.5, EEV[1], LIQ_SV[2]], [1, 0, 0], 2.6, 2, { name: "eev.out" });

// ---------- outdoor header and distributor, on the coil face ----------
const OHF = vertical(OU_HEADER[0], OU_HEADER[1], 0);
discAt("oheader", OHF, 66, 106, 5, { tone: "hi", name: "oheader.body", seg: "oc", inner: Ln(G.arcOf(OHF, 80, 5, P) + G.arcOf(OHF, 94, 5, P), { tone: "faint" }) });
const ODF = vertical(OU_DIST[0], OU_DIST[1], 0);
turned("odist", ODF, [[34, 0], [34, 2.4], [38, 3.4, 1], [44, 3.4, 1], [48, 2.4], [48, 0]], { tone: "hi", name: "odist.body", seg: "ol" });

// ---------- outdoor fan: motor, bracket, rotor (blades turn in their own plane) ----------
box("fanmotor", { x: FAN.x - 6, y: -22, w: 12, d: 12, r: 1 }, OU_FLOOR, FAN.z - 11 - OU_FLOOR, { tone: "lo", name: "fanmotor.bracket" });
const MF = alongY(FAN.x, FAN.z, 0);
discAt("fanmotor", MF, -24, 2, 11, { tone: "mid", name: "fanmotor.body", inner: Ln(G.arcOf(MF, -18, 11, P) + G.arcOf(MF, -4, 11, P), { tone: "faint" }), extra: k.fadedSvg(G.ribsOf(MF, -18, -4, 11, 24, P, { fade: [0.1, 0.55] }), { tone: "lo" }) });
const FAN_FACE = 6;
const FAN_M = k.sideMatrix([0, FAN_FACE], 0, P, "left");
function bladePath(angle) {
  // a swept blade: leading and trailing edges as arcs from hub to tip, in face coordinates (x, -z)
  const pts = [];
  const r0 = 9.5;
  const r1 = FAN.r;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const r = r0 + (r1 - r0) * t;
    const a = angle + (-0.42 + 0.28 * t * t) ;
    pts.push([FAN.x + r * Math.cos(a), -FAN.z + r * Math.sin(a)]);
  }
  for (let i = 10; i >= 0; i--) {
    const t = i / 10;
    const r = r0 + (r1 - r0) * t;
    const a = angle + (0.42 + 0.12 * t) - (1 - t) * 0.2;
    pts.push([FAN.x + r * Math.cos(a), -FAN.z + r * Math.sin(a)]);
  }
  return "M" + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L") + "Z";
}
{
  const blades = [0, 1, 2].map((i) => bladePath((i * 120 - 90) * DEG)).join("");
  const id = "fan.rotor";
  const shape = record(A.ring(MF, 5, 7, 9, FAN.r, { name: id }));
  put("fan", [FAN.x, FAN_FACE, FAN.z], `<g transform="${FAN_M}"><g class="hp-rotor" data-cx="${FAN.x}" data-cy="${-FAN.z}"><path class="hp-blade" d="${blades}"/><path class="iso-line" data-tone="mid" d="${blades}"/></g></g>`, { name: id, shapes: [shape] });
}
discAt("fan", MF, 2, 5, 9, { tone: "mid", name: "fan.hubback" });
discAt("fan", MF, 7, 10, 9, { tone: "hi", name: "fan.hub", bevel: 0.5, extra: Ln(G.circleOf(MF, 10, 4, P, 20), { tone: "faint" }) + Dots(G.dotsOf(MF, 10, 6.4, 5, P, { all: true }), { size: 0.42 }) });

// ---------- indoor unit: base, back and end panel, post, top plate ----------
box("iuframe", IU, 0, IU_FLOOR, { tone: "mid", name: "iuframe.base", steps: 4, bevel: 0.6, extra: Ln(k.planOutline(k.insetPlan(IU, 4), IU_FLOOR, P, 3), { tone: "faint" }) });
box("iuframe", { x: IU.x, y: IU.y, w: IU.w, d: 5, r: 0.8 }, IU_FLOOR, IU_TOP - IU_FLOOR, { tone: "lo", name: "iuframe.back", bevel: 0.4 });
box("iuframe", { x: IU.x, y: IU.y + 5, w: 5, d: IU.d - 5, r: 0.8 }, IU_FLOOR, IU_TOP - IU_FLOOR, { tone: "lo", name: "iuframe.end", bevel: 0.4 });
box("iuframe", { x: IU.x + IU.w - 5, y: IU.y + IU.d - 5, w: 5, d: 5, r: 0.8 }, IU_FLOOR, IU_TOP - IU_FLOOR, { tone: "mid", name: "iuframe.post", bevel: 0.4 });
{
  const lid = { x: IU.x, y: IU.y, w: IU.w, d: IU.d, r: 3 };
  const slot = { x: IU.x + 12, y: IU.y + 30, w: IU.w - 30, d: 34, r: 2 };
  const vanes = [];
  for (let y = slot.y + 4; y < slot.y + slot.d - 2; y += 5) vanes.push(k.lineOnTop([slot.x, y], [slot.x + slot.w, y], IU_TOP + 5, P));
  box("louver", lid, IU_TOP, 5, { tone: "mid", name: "louver.lid", steps: 4, bevel: 0.8, extra: Ln(k.planOutline(slot, IU_TOP + 5, P, 3), { tone: "lo" }) + Ln(vanes.join(""), { tone: "faint" }) });
}
box("drainpan", { x: -230, y: -36, w: 124, d: 18, r: 1.5 }, IU_FLOOR, 6, { tone: "lo", name: "drainpan.tray", extra: Ln(k.planOutline({ x: -228, y: -34, w: 120, d: 14, r: 1 }, IU_FLOOR + 6, P, 2), { tone: "faint" }) });
coil("iucoil", IU_COIL, IU_COIL_Z[0], IU_COIL_Z[1], { seg: "icoil" });
const IHF = vertical(IU_HEADER[0], IU_HEADER[1], 0);
discAt("iheader", IHF, 64, 104, 5, { tone: "hi", name: "iheader.body", seg: "ig", inner: Ln(G.arcOf(IHF, 78, 5, P) + G.arcOf(IHF, 92, 5, P), { tone: "faint" }) });
const IDF = vertical(IU_DIST[0], IU_DIST[1], 0);
turned("idist", IDF, [[36, 0], [36, 2.4], [40, 3.4, 1], [46, 3.4, 1], [50, 2.4], [50, 0]], { tone: "hi", name: "idist.body", seg: "il" });

// cross-flow fan with its motor and bracket
const IFF = alongX(IU_FAN.y, IU_FAN.z, 0);
discAt("iufan", IFF, IU.x + 5, IU_FAN.x0, 2.4, { tone: "lo", name: "iufan.shaft" });
discAt("iufan", IFF, IU_FAN.x0, IU_FAN.x1, IU_FAN.r, {
  tone: "mid",
  name: "iufan.rotor",
  inner: Ln([IU_FAN.x0 + 1, (IU_FAN.x0 + IU_FAN.x1) / 2, IU_FAN.x1 - 1].map((s) => G.arcOf(IFF, s, IU_FAN.r, P)).join(""), { tone: "lo" }),
  extra: `<g class="hp-iufan-ribs">${k.fadedSvg(G.ribsOf(IFF, IU_FAN.x0 + 1, IU_FAN.x1 - 1, IU_FAN.r, 30, P, { fade: [0.1, 0.55] }), { tone: "lo" })}</g>`,
});
discAt("iufan", IFF, IU_FAN.x1, IU_FAN.x1 + 2, 2.4, { tone: "lo", name: "iufan.shaft" });
discAt("iufan", IFF, IU_FAN.x1 + 2, IU_FAN.x1 + 16, 11, { tone: "mid", name: "iufan.motor", inner: Ln(G.arcOf(IFF, IU_FAN.x1 + 5, 11, P) + G.arcOf(IFF, IU_FAN.x1 + 13, 11, P), { tone: "faint" }) });
box("iufan", { x: IU_FAN.x1 + 4, y: IU_FAN.y - 6, w: 10, d: 12, r: 1 }, IU_FLOOR, IU_FAN.z - 11 - IU_FLOOR, { tone: "lo", name: "iufan.bracket" });

// ---------- gauges (Bourdon tube gauges on tees) ----------
const GAUGES = [];
function gauge(piece, pipeAt, r, { range, name, seg }) {
  // a ball tee on a vertical pipe, a stem toward +y, the gauge case with its dial in the plane y = face
  const [x, y, z] = pipeAt;
  const ball = r + 1.2;
  ballAt(piece, [x, y, z], ball, { tone: "hi", name: `${piece}.tee`, seg });
  const stemF = alongY(x, z, y);
  const stem0 = Math.sqrt(ball * ball - 1.3 * 1.3);
  discAt(piece, stemF, stem0 - 0.05, 8, 1.3, { tone: "mid", name: `${piece}.stem` });
  discAt(piece, stemF, 8, 12, 10.5, { tone: "mid", name: `${piece}.case`, bevel: 0.6 });
  const face = y + 12;
  const M = k.sideMatrix([0, face], 0, P, "left");
  const cx = x;
  const cy = -z;
  const R0 = 8.6;
  const ticks = [];
  const majors = [];
  const sweep = 270 * DEG;
  const start = 135 * DEG;
  const count = range * 5;
  for (let i = 0; i <= count; i++) {
    const a = start + (sweep * i) / count;
    const len = i % 5 ? 1.0 : 1.8;
    const seg2 = `M${(cx + R0 * Math.cos(a)).toFixed(2)} ${(cy + R0 * Math.sin(a)).toFixed(2)}L${(cx + (R0 - len) * Math.cos(a)).toFixed(2)} ${(cy + (R0 - len) * Math.sin(a)).toFixed(2)}`;
    (i % 5 ? ticks : majors).push(seg2);
  }
  const ring = (rr) => `M${cx + rr} ${cy}A${rr} ${rr} 0 1 1 ${cx - rr} ${cy}A${rr} ${rr} 0 1 1 ${cx + rr} ${cy}Z`;
  GAUGES.push({ name, range, cx, cy, start, sweep, len: R0 - 1.4 });
  const svg = `<g transform="${M}"><path class="hp-dial" d="${ring(R0 + 0.4)}"/><path class="iso-line" data-tone="lo" d="${ring(R0)}"/><path class="iso-line" data-tone="lo" d="${ticks.join("")}"/><path class="iso-line" data-tone="mid" d="${majors.join("")}"/><path class="iso-line hp-needle" data-tone="lit" data-free="end" data-gauge="${name}" d="M${cx} ${cy}L${cx} ${cy - 5}"/><circle class="hp-hub" cx="${cx}" cy="${cy}" r="0.9"/></g>`;
  const id = nameFor(`${piece}.face`);
  put(piece, [x, face + 0.2, z], svg, { name: id, bias: 0.2, shapes: [record(A.disc(stemF, 12, 12.3, R0 + 0.4, { name: id }))] });
}

// ---------- the refrigerant loop ----------
// discharge: compressor → 4-way valve D (always hot gas)
const D_FROM = [CMP[0], CMP[1], CMP_TOP + 3.4];
const D_TO = portFace.D;
const TEE_HI = (D_FROM[2] + D_TO[2]) / 2;
const teeOff = (r) => Math.sqrt((r + 1.2) ** 2 - r * r);
pipe("discharge", "discharge", [D_FROM, [CMP[0], CMP[1], TEE_HI - teeOff(2.6)]], 2.6, { seg: "dis" });
pipe("discharge", "discharge", [[CMP[0], CMP[1], TEE_HI + teeOff(2.6)], D_TO], 2.6, { seg: "dis" });
gauge("gaugehi", [CMP[0], CMP[1], TEE_HI], 2.6, { range: 5, name: "hi", seg: "dis" });

// suction: 4-way valve S → accumulator (with the low-side gauge on its drop) → compressor
const S_TOP = 156;
const TEE_LO = 100;
pipe("suction", "suction", [portFace.S, [PORTS.S, VALVE.y, S_TOP], [ACC[0], ACC[1], S_TOP], [ACC[0], ACC[1], TEE_LO + teeOff(3.2)]], 3.2, { seg: "suc" });
pipe("suction", "suction", [[ACC[0], ACC[1], TEE_LO - teeOff(3.2)], [ACC[0], ACC[1], ACC_TOP + 3]], 3.2, { seg: "suc" });
gauge("gaugelo", [ACC[0], ACC[1], TEE_LO], 3.2, { range: 2, name: "lo", seg: "suc" });
{
  const dir = G.unit3([CMP[0] - ACC[0], CMP[1] - ACC[1], 0]);
  const z = OU_FLOOR + 16;
  const a = padOn("accumulator", ACC_BODY, [ACC[0] + ACC_R * dir[0], ACC[1] + ACC_R * dir[1], z], dir, 3.6, 2.5, { name: "accumulator.out" });
  const b = padOn("compressor", CMP_SHELL, [CMP[0] - CMP_R * dir[0], CMP[1] - CMP_R * dir[1], z], G.mul3(dir, -1), 3.6, 2.5, { name: "compressor.suction" });
  pipe("suction", "suction", [a, b], 3.2, { seg: "suc" });
}

// 4-way valve C ↔ outdoor coil header (hot gas when cooling, cool gas when heating)
const C_TOP = 146;
pipe("gaspipes", "outdoor-gas", [portFace.C, [PORTS.C, VALVE.y, C_TOP], [PORTS.C, OU_HEADER[1], C_TOP], [OU_HEADER[0], OU_HEADER[1], C_TOP], [OU_HEADER[0], OU_HEADER[1], 106]], 3.0, { seg: "oc", heat: -1, cool: 1 });
// 4-way valve E ↔ gas service valve: the turn toward the front happens inside a brazed elbow
const E_TOP = 138;
const ELBOW_R = 4.2;
ballAt("gaspipes", [PORTS.E, VALVE.y, E_TOP], ELBOW_R, { tone: "hi", name: "gaspipes.elbow", seg: "ig" });
pipe("gaspipes", "valve-gas", [portFace.E, [PORTS.E, VALVE.y, E_TOP - teeOff(3.0)]], 3.0, { seg: "ig", heat: 1, cool: -1 });
pipe("gaspipes", "valve-gas", [[PORTS.E, VALVE.y + teeOff(3.0), E_TOP], [PORTS.E, GAS_SV[1], E_TOP], [GSV.top[0], GAS_SV[1], E_TOP], GSV.top], 3.0, { seg: "ig", heat: 1, cool: -1 });
// line set: indoor gas header ↔ gas service valve, indoor distributor ↔ liquid service valve
pipe("lineset", "gas", [[IU_HEADER[0], IU_HEADER[1], 64], [IU_HEADER[0], IU_HEADER[1], GAS_SV[2]], [-56, IU_HEADER[1], GAS_SV[2]], [-56, GAS_SV[1], GAS_SV[2]], GSV.flare], 3.0, { seg: "ig", heat: -1, cool: 1 });
pipe("lineset", "liquid", [[IU_DIST[0], IU_DIST[1], 36], [IU_DIST[0], IU_DIST[1], LIQ_SV[2]], [-74, IU_DIST[1], LIQ_SV[2]], [-74, LIQ_SV[1], LIQ_SV[2]], LSV.flare], 2.0, { seg: "il", heat: 1, cool: -1 });
// liquid service valve → expansion valve → outdoor distributor
pipe("liquidpipes", "liquid-in", [LSV.side, EEV_IN], 2.0, { seg: "il", heat: 1, cool: -1 });
pipe("liquidpipes", "liquid-out", [EEV_OUT, [OU_DIST[0], EEV[1], LIQ_SV[2]], [OU_DIST[0], OU_DIST[1], LIQ_SV[2]], [OU_DIST[0], OU_DIST[1], 34]], 2.0, { seg: "ol", heat: 1, cool: -1 });

// ---------- settle depth, emit ----------
A.settle(R, P);
items.sort((a, b) => a.key - b.key);
const attr = (text) => String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const groups = items.map((item) => `<g data-piece="${item.piece}" data-name="${attr(item.name)}"${item.seg ? ` data-seg="${item.seg}"` : ""}>${item.seg ? `<g class="hp-b"><g class="hp-c">${item.svg}</g></g>` : item.svg}</g>`);

const LABEL =
  "공기열원 히트펌프(분리형 냉난방기)의 절개 모형입니다. 왼쪽에는 실내기가 있고 그 안에 실내 코일, 드레인 팬, 관류 팬과 모터가 있습니다. 오른쪽 콘크리트 받침 위의 실외기에는 압축기, 어큐뮬레이터, 사방 밸브, 전자 팽창 밸브, 서비스 밸브 두 개, 실외 코일과 축류 팬이 있습니다. 가스관과 액관이 두 기기를 잇고, 냉매가 관을 따라 돕니다. 고압 게이지와 저압 게이지가 압축기의 토출관과 흡입관에 달려 있습니다.";
const svg = k.figureSvg({ width: W, height: H, label: LABEL, body: [...back, ...groups] });

// ---------- page ----------
// Refrigerant state per stretch of the loop and mode: hot gas, warm liquid, cold two-phase, cool gas.
const STATE = {
  heat: { dis: "hot", suc: "cool", oc: "cool", ig: "hot", il: "warm", ol: "cold", icoil: "hot", ocoil: "cold" },
  cool: { dis: "hot", suc: "cool", oc: "hot", ig: "cool", il: "cold", ol: "warm", icoil: "cold", ocoil: "hot" },
};
const stateCss = Object.entries(STATE)
  .flatMap(([mode, segs]) => Object.entries(segs).map(([seg, state]) => `.hp-stage[data-mode="${mode}"] [data-seg="${seg}"]{--hp-c:var(--hp-${state})}`))
  .join("\n");
const CSS = readFileSync(join(HERE, "heat-pump.css"), "utf8") + "\n" + stateCss;
const DATA = {
  routes: ROUTES.map(({ seg, heat, cool, r, chunks }) => ({ seg, heat, cool, chunks: chunks.map(({ pts, from, to }) => ({ pts, from, to })) })),
  spacing: FLOW_SPACING,
  gauges: GAUGES,
  fan: { cx: FAN.x, cy: -FAN.z },
  iufan: { F: IFF, x0: IU_FAN.x0 + 1, x1: IU_FAN.x1 - 1, r: IU_FAN.r },
  P,
  V,
  state: STATE,
};
const defaults = { mode: param("mode"), Tin: param("Tin"), Tout: param("Tout"), W: param("W") };
const first = HP.model(defaults);
const f = HP.fmt;
const firstValues = {
  mode: first.heat ? "난방" : "냉방",
  Tin: f.C(first.Tin), Tout: f.C(first.Tout), W: f.kW(first.W), cop: f.cop(first.cop), Qhot: f.kW(first.Qhot), Qcold: f.kW(first.Qcold), useful: f.kW(first.useful),
  indoorCoil: first.heat ? "응축기" : "증발기", outdoorCoil: first.heat ? "증발기" : "응축기",
};
const LIVE = MODEL_JS + "\n" + readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const stage = `<div class="iso-stage hp-stage" tabindex="0" role="group" data-mode="${defaults.mode}" aria-label="히트펌프 절개 모형입니다. 사방 밸브(코일이 달린 밸브)를 누르거나 스페이스 키를 누르면 난방과 냉방이 바뀝니다.">${svg}</div>`;
const html = eduPage({ content, theme: THEME, stage, css: CSS, script: kitScript() + "\n" + LIVE, values: firstValues });
writePage(HERE, THEME === "light" ? "heat-pump-ko-light.html" : "heat-pump-ko.html", html);
console.log(`${(html.length / 1024).toFixed(0)} KB`, `${items.length} items`, `${ROUTES.length} routes`);
A.auditOrExit(R, P);
