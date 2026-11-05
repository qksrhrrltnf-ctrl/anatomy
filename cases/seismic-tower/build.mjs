// 내진·면진 고층 건물 (seismic-tower): a steel braced tower on lead-rubber isolation bearings with a pendulum TMD on the roof.
// Every part is recorded for the audit; the page moves each item by the model (model.mjs): the ground shakes,
// the bearings and each story's columns and braces shear, the floors and the roof translate, the TMD swings.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { eduPage, writePage } from "../../edu/kit/edu.mjs";
import content from "./ko.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const W = 600;
const H = 500;
const NMAX = M.RANGE.N[1];
const STORY = 9;
const SLAB_T = 1.4;
const Z0 = 17.5; // top of the base mat (level 0)
const zLevel = (i) => Z0 + i * STORY;
const ROOF = zLevel(NMAX);

const GROUND = { x: -54, y: -48, w: 108, d: 96, r: 4 };
const ROCK = [-18, -8];
const FOUND = { x: -27, y: -27, w: 54, d: 54, r: 1.5 };
const FOUND_H = 3;
const BEAR_XY = [-17, 0, 17];
const PED_Z = [FOUND_H, FOUND_H + 1.5];
const PLATE_Z0 = [PED_Z[1], PED_Z[1] + 0.8];
const RUBBER = [PLATE_Z0[1], PLATE_Z0[1] + 8];
const LAM = 12; // rubber layers shown (steel shims between them)
const lamZ = (i) => RUBBER[0] + ((RUBBER[1] - RUBBER[0]) * (i + 1)) / (LAM + 1);
const PLATE_Z1 = [RUBBER[1], RUBBER[1] + 0.8];
const BEAR_R = 3.6;
const MAT = { x: -23, y: -23, w: 46, d: 46, r: 1.5 };
const MAT_Z = [PLATE_Z1[1], Z0];
const COL = 19; // column centre lines
const COL_W = 2.4;
const SLAB = { x: -21.5, y: -21.5, w: 43, d: 43, r: 1 };
const CORE = { x: -6, y: -6, w: 12, d: 12, r: 0.6 };
const CUT = [17, 17]; // the bearing shown cut in half

// roof: pendulum TMD in an open frame
const PH = 13; // penthouse posts at ±PH
const PH_TOP = 24;
const HANG = 3.5;
const SPHERE_R = 6;
const SPHERE_Z = 10;
const DAMP_Z = 2.6;
const DAMP = { gland: 7.5, end: 12.5, r: 1.1, rod: 0.45, tip: 1.2 };
const TMD_STROKE = 4.5; // visual limit of the TMD swing (world units)

const P0 = k.fitProjection(
  [...k.boxCorners(GROUND, ROCK[0], 0), ...k.boxCorners(SLAB, 0, ROOF + PH_TOP + 2)],
  W,
  H,
  { pad: 18, azimuth: 58, elevation: 25 },
);
const P = { ...P0, origin: [P0.origin[0] + 52, P0.origin[1]] };
const V = G.viewOf(P);
const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);

const R = A.recorder(P);
const record = R.solid;
const LIVE = []; // one entry per item: how the page moves it
function put(name, ref, svg, shapes, { bias = 0, piece, live = { kind: "g" }, story = 0, move, ride } = {}) {
  const item = R.put({ name, at: ref, bias, svg, shapes, piece, ...(move ? { move, ride } : {}) });
  item.live = { ...live, story };
  return item;
}
function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, { r = 0.3, steps = 2, bevel = 0, extra = "", inner = "", ...rest } = {}) {
  const plan = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r };
  const shape = record(A.slab(plan, z0, z1 - z0, { name, ...(rest.meta ?? {}) }, steps));
  return put(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], rest);
}
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// ---------- static back layer: halo ----------
const back = [`<path class="iso-halo" d="${k.haloOf(GROUND, ROCK[0], -ROCK[0], P)}"/>`];

// ---------- ground block: bedrock and soil, with the instruments on it ----------
box("stand.rock", [GROUND.x, GROUND.y, ROCK[0]], [GROUND.x + GROUND.w, GROUND.y + GROUND.d, ROCK[1]], { tone: "lo" }, {
  r: GROUND.r, steps: 8, piece: "rock", meta: { ground: true },
  inner: Ln(k.sideSeam(GROUND, -13, P, 8), { tone: "faint" }),
});
box("stand.soil", [GROUND.x, GROUND.y, ROCK[1]], [GROUND.x + GROUND.w, GROUND.y + GROUND.d, 0], { tone: "mid" }, {
  r: GROUND.r, steps: 8, bevel: 1.2, piece: "soil", meta: { ground: true },
  inner: Ln(k.sideSeam(GROUND, -4, P, 8), { tone: "faint" }),
  extra: Ln(k.planOutline(k.insetPlan(GROUND, 5), 0, P), { tone: "faint" }) + Dots(k.corners(GROUND, 9).map(([x, y]) => at([x, y, 0])), { size: 0.5 }),
});
// ruler strip along the sway direction, so the reader can see how far things move
const STRIP = { x: -40, y: GROUND.y + GROUND.d - 11, w: 80, d: 6, r: 1 };
{
  const ticks = k.topTicks(STRIP.x + 2, STRIP.x + STRIP.w - 2, 4, 5, STRIP.y, 0.6, [1.8, 3.4], P);
  box("ruler", [STRIP.x, STRIP.y, 0], [STRIP.x + STRIP.w, STRIP.y + STRIP.d, 0.6], { tone: "lo", crease: "none" }, {
    r: 1, steps: 3, piece: "ruler", extra: Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" }) + Ln(k.lineOnTop([0, STRIP.y], [0, STRIP.y + 3.4], 0.6, P), { tone: "hi" }),
  });
}
// label plate with three rule lines
const LABEL = { x: GROUND.x + 6, y: GROUND.y + GROUND.d - 26, w: 20, d: 10, r: 1 };
box("label", [LABEL.x, LABEL.y, 0], [LABEL.x + LABEL.w, LABEL.y + LABEL.d, 0.8], { tone: "mid", crease: "none" }, {
  r: 1, steps: 3, piece: "label",
  extra: Ln(k.planOutline(k.insetPlan(LABEL, 1.4), 0.8, P, 3), { tone: "faint" }) +
    [[3, 15], [5.2, 11], [7.4, 13.5]].map(([dy, len]) => Ln(k.lineOnTop([LABEL.x + 3, LABEL.y + dy], [LABEL.x + 3 + len, LABEL.y + dy], 0.8, P), { tone: "lo", free: true })).join(""),
});
// seismometer: a small case on a pier with a sensor dome
const SEIS = { x: GROUND.x + 10, y: GROUND.y + 12, w: 12, d: 9, r: 1 };
box("seis.pier", [SEIS.x - 1.5, SEIS.y - 1.5, 0], [SEIS.x + SEIS.w + 1.5, SEIS.y + SEIS.d + 1.5, 1.4], { tone: "lo" }, { r: 1.2, steps: 3, piece: "seis" });
box("seis.case", [SEIS.x, SEIS.y, 1.4], [SEIS.x + SEIS.w, SEIS.y + SEIS.d, 6.4], { tone: "mid" }, {
  r: 1, steps: 3, bevel: 0.4, piece: "seis",
  extra: Ln(k.planOutline(k.insetPlan(SEIS, 1.2), 6.4, P, 3), { tone: "faint" }) + Dots(k.corners(SEIS, 1.2).map(([x, y]) => at([x, y, 6.4])), { size: 0.45 }),
});
{
  const cx = SEIS.x + SEIS.w / 2;
  const cy = SEIS.y + SEIS.d / 2;
  const shape = record(A.cylinder(cx, cy, 2.6, 6.4, 1.6, { name: "seis.dome" }));
  put("seis.dome", [cx, cy, 7.2], S(k.cylinder(cx, cy, 2.6, 6.4, 1.6, P, 28, 0.3), { tone: "hi" }) + Ln(k.ring(cx, cy, 1.2, 8, P, 16), { tone: "lo" }), [shape], { piece: "seis" });
}

// ---------- foundation, pedestals and bearings ----------
box("found", [FOUND.x, FOUND.y, 0], [FOUND.x + FOUND.w, FOUND.y + FOUND.d, FOUND_H], { tone: "lo" }, { r: FOUND.r, steps: 4, bevel: 0.5, piece: "found" });
for (const [bx, by] of byDepth(BEAR_XY.flatMap((x) => BEAR_XY.map((y) => [x, y])))) {
  const cut = bx === CUT[0] && by === CUT[1];
  box("ped", [bx - 4.6, by - 4.6, PED_Z[0]], [bx + 4.6, by + 4.6, PED_Z[1]], { tone: "lo" }, { r: 0.5, steps: 2, piece: "found" });
  const plate = (z0, z1, level) => {
    const live = level === 0 ? { kind: "lev", lv: 0 } : { kind: "g" };
    if (!cut) return box(level === 0 ? "bear.top" : "bear.bottom", [bx - 4.1, by - 4.1, z0], [bx + 4.1, by + 4.1, z1], { tone: "mid" }, { r: 0.4, piece: "bearing", live, extra: Dots([[bx - 3.1, by + 3.1], [bx + 3.1, by + 3.1], [bx + 3.1, by - 3.1]].map(([x, y]) => at([x, y, z1])), { size: 0.4 }) });
    // the cut bearing's plates keep their back half
    return box(level === 0 ? "cut.top" : "cut.bottom", [bx - 4.1, by - 4.1, z0], [bx + 4.1, by, z1], { tone: "mid" }, { r: 0.4, piece: "bearing", live, extra: Dots([[bx - 3.1, by - 3.1], [bx + 3.1, by - 3.1]].map(([x, y]) => at([x, y, z1])), { size: 0.4 }) });
  };
  plate(...PLATE_Z0, -1);
  const shear = { kind: "sh", lv0: -1, lv1: 0, z0: RUBBER[0], h: RUBBER[1] - RUBBER[0], plane: "x", o: [bx, by, RUBBER[0]] };
  if (!cut) {
    const shape = record(A.cylinder(bx, by, BEAR_R, RUBBER[0], RUBBER[1] - RUBBER[0], { name: "bear.rubber" }));
    const laminations = Array.from({ length: LAM }, (_, i) => k.sideArc(bx, by, BEAR_R, lamZ(i), P, 28)).join("");
    put("bear.rubber", [bx, by, (RUBBER[0] + RUBBER[1]) / 2], S(k.cylinder(bx, by, BEAR_R, RUBBER[0], RUBBER[1] - RUBBER[0], P, 36), { tone: "mid", inner: Ln(laminations, { tone: "lo" }) }), [shape], { piece: "bearing", live: shear });
  } else {
    // back half of the rubber, then its section: rubber layers, steel shims and the lead plug in the middle
    const half = Array.from({ length: 25 }, (_, i) => [bx + BEAR_R * Math.cos(Math.PI + (i / 24) * Math.PI), by + BEAR_R * Math.sin(Math.PI + (i / 24) * Math.PI)]);
    const shape = record(A.extruded(half, RUBBER[0], RUBBER[1] - RUBBER[0], { name: "cut.rubber" }));
    const z0 = RUBBER[0];
    const z1 = RUBBER[1];
    const face = path3([[bx - BEAR_R, by, z0], [bx + BEAR_R, by, z0], [bx + BEAR_R, by, z1], [bx - BEAR_R, by, z1]], true);
    const lead = path3([[bx - 1.1, by, z0], [bx + 1.1, by, z0], [bx + 1.1, by, z1], [bx - 1.1, by, z1]], true);
    const shims = Array.from({ length: LAM }, (_, i) => lamZ(i)).map((z) => path3([[bx - BEAR_R, by, z], [bx - 1.1, by, z]]) + path3([[bx + 1.1, by, z], [bx + BEAR_R, by, z]])).join("");
    const svg = S(k.extrude(half, z0, z1 - z0, P), { tone: "mid" }) + `<path class="st-cut" d="${face}"/>` + Ln(shims, { tone: "mid" }) + `<g data-piece="lead"><path class="st-lead" d="${lead}"/></g>`;
    put("cut.rubber", [bx, by - 1, (z0 + z1) / 2], svg, [shape], { piece: "bearing", live: shear });
  }
  plate(...PLATE_Z1, 0);
}
box("mat", [MAT.x, MAT.y, MAT_Z[0]], [MAT.x + MAT.w, MAT.y + MAT.d, MAT_Z[1]], { tone: "mid" }, {
  r: MAT.r, steps: 4, bevel: 0.6, piece: "mat", live: { kind: "lev", lv: 0 },
  inner: Ln(k.sideSeam(MAT, MAT_Z[0] + 1.4, P, 4), { tone: "faint" }),
  extra: Ln(k.planOutline(k.insetPlan(MAT, 2.2), MAT_Z[1], P, 4), { tone: "faint" }),
});

// ---------- the tower: N stories of columns, X braces and a core between floor slabs ----------
const COLS = [[-COL, -COL], [0, -COL], [COL, -COL], [COL, 0], [COL, COL], [0, COL], [-COL, COL], [-COL, 0]];
const FACES = [
  { plane: "x", fixed: -COL, along: "x" }, // y = −19 (back)
  { plane: "x", fixed: COL, along: "x" }, // y = +19 (front)
  { plane: "y", fixed: -COL, along: "y" }, // x = −19 (back)
  { plane: "y", fixed: COL, along: "y" }, // x = +19 (front)
];
const pointOn = (face, a, z) => (face.along === "x" ? [a, face.fixed, z] : [face.fixed, a, z]);
for (let i = 1; i <= NMAX; i++) {
  const zb = zLevel(i - 1);
  const zt = zLevel(i) - SLAB_T;
  const live = (plane, o) => ({ kind: "sh", lv0: i - 1, lv1: i, z0: zb, h: zt - zb, plane, o });
  for (const [cx, cy] of COLS) {
    const h = COL_W / 2;
    box("col", [cx - h, cy - h, zb], [cx + h, cy + h, zt], { tone: "mid" }, { r: 0.2, piece: "column", story: i, live: live("x", [cx, cy, zb]) });
  }
  // core walls with a door on the front face
  const door = path3([[-2, CORE.y + CORE.d, zb], [2, CORE.y + CORE.d, zb], [2, CORE.y + CORE.d, zb + 5.6], [-2, CORE.y + CORE.d, zb + 5.6]], true);
  const doorX = path3([[CORE.x + CORE.w, -2.4, zb], [CORE.x + CORE.w, 1.6, zb], [CORE.x + CORE.w, 1.6, zb + 5.6], [CORE.x + CORE.w, -2.4, zb + 5.6]], true);
  box("core", [CORE.x, CORE.y, zb], [CORE.x + CORE.w, CORE.y + CORE.d, zt], { tone: "lo" }, { r: CORE.r, steps: 2, piece: "core", story: i, live: live("x", [0, 0, zb]), extra: Ln(door + doorX, { tone: "faint" }) });
  // X braces in both bays of every face: pin dots at the four ends and the crossing
  for (const face of FACES) {
    for (const [a0, a1] of [[-COL, 0], [0, COL]]) {
      const s0 = a0 + COL_W / 2;
      const s1 = a1 - COL_W / 2;
      const ends = [pointOn(face, s0, zb), pointOn(face, s1, zt), pointOn(face, s1, zb), pointOn(face, s0, zt)];
      const mid = pointOn(face, (s0 + s1) / 2, (zb + zt) / 2);
      const axisA = G.sub3(ends[1], ends[0]);
      const axisB = G.sub3(ends[3], ends[2]);
      const normal = face.along === "x" ? [0, 1, 0] : [1, 0, 0];
      const brace = (p, q, axis) => record(A.orientedBox(G.lerp3(p, q, 0.5), [axis, normal, G.cross3(axis, normal)], [G.len3(axis) / 2 - 0.35, 0.35, 0.35], { name: "brace" }));
      const svg = `<path class="iso-line st-brace" data-tone="mid" d="${path3([ends[0], ends[1]])}${path3([ends[2], ends[3]])}"/>` + Dots([...ends, mid].map(at), { size: 0.55, tone: "hi" });
      put("brace", mid, svg, [brace(ends[0], ends[1], axisA), brace(ends[2], ends[3], axisB)], { piece: "brace", story: i, live: live(face.plane, mid.map((v, n) => (n === 2 ? zb : v))) });
    }
  }
  // the floor slab on top of this story (the roof when i = N)
  const top = zLevel(i);
  box("slab", [SLAB.x, SLAB.y, top - SLAB_T], [SLAB.x + SLAB.w, SLAB.y + SLAB.d, top], { tone: "mid" }, {
    r: SLAB.r, steps: 3, bevel: 0.35, piece: "slab", story: i, live: { kind: "lev", lv: i },
    extra: Dots(k.corners(SLAB, 1.4).map(([x, y]) => at([x, y, top])), { size: 0.4 }),
  });
}

// ---------- roof: the pendulum TMD in its frame ----------
const PHL = { kind: "ph" };
for (const [x, y] of [[-PH, -PH], [PH, -PH], [PH, PH], [-PH, PH]]) box("ph.post", [x - 1, y - 1, ROOF], [x + 1, y + 1, ROOF + PH_TOP], { tone: "mid" }, { piece: "tmd-frame", live: PHL });
for (const y of [-PH, PH]) box("ph.beam", [-PH - 1, y - 1, ROOF + PH_TOP], [PH + 1, y + 1, ROOF + PH_TOP + 2], { tone: "mid" }, { piece: "tmd-frame", live: PHL, bevel: 0.3 });
for (const x of [-PH, PH]) box("ph.beam", [x - 1, -PH + 1, ROOF + PH_TOP], [x + 1, PH - 1, ROOF + PH_TOP + 2], { tone: "mid" }, { piece: "tmd-frame", live: PHL, bevel: 0.3 });
for (const y of [-HANG, HANG]) box("ph.hanger-beam", [-PH + 1, y - 0.8, ROOF + PH_TOP], [PH - 1, y + 0.8, ROOF + PH_TOP + 1.6], { tone: "lo" }, { piece: "tmd-frame", live: PHL });
// damper brackets on the roof
for (const side of [-1, 1]) {
  const x0 = side < 0 ? -DAMP.end - 1.4 : DAMP.end;
  box("damp.bracket", [x0, -1.6, ROOF], [x0 + 1.4, 1.6, ROOF + DAMP_Z + 1.6], { tone: "lo" }, { piece: "damper", live: PHL });
}
const TMDL = { kind: "tmd" };
const SPHERE = [0, 0, ROOF + SPHERE_Z];
{
  const shape = record(A.ball(SPHERE, SPHERE_R, { name: "tmd.mass" }));
  const band = G.arcOf(G.frameAlong(SPHERE, [0, 0, 1]), 0, SPHERE_R, P);
  put("tmd.mass", SPHERE, S(G.sphereOf(SPHERE, SPHERE_R, P, { steps: 56 }), { tone: "hi", lit: true, inner: Ln(band, { tone: "faint" }) }), [shape], { piece: "tmd", live: TMDL, move: [TMD_STROKE, 0, 0], ride: "tmd" });
}
box("tmd.yoke", [-DAMP.tip, -1.6, ROOF + DAMP_Z - 1.4], [DAMP.tip, 1.6, ROOF + SPHERE_Z - SPHERE_R], { tone: "mid" }, { piece: "damper", live: TMDL, move: [TMD_STROKE, 0, 0], ride: "tmd" });
const CLIPS = [];
for (const side of [-1, 1]) {
  const F = G.frameOf([0, 0, ROOF + DAMP_Z], [-side, 0, 0], [0, 1, 0], [0, 0, side]);
  // body: from the gland (inner end) to the bracket
  const bodyShape = record(A.disc(F, -DAMP.end, -DAMP.gland, DAMP.r, { name: "damp.body" }));
  const bodyPaths = G.disc(-DAMP.end, -DAMP.gland, DAMP.r, F, P, { bevel: 0.2 });
  const seam = G.arcOf(F, -DAMP.gland - 1.2, DAMP.r, P);
  put("damp.body", G.pointOf(F, -(DAMP.end + DAMP.gland) / 2, 0, 0), S(bodyPaths, { tone: "mid", inner: Ln(seam, { tone: "faint" }) }), [bodyShape], { piece: "damper", live: PHL });
  const rod = G.rodOut(F, -DAMP.gland, -DAMP.tip, DAMP.rod, P, { stroke: TMD_STROKE });
  const id = `st-rod-${side < 0 ? "l" : "r"}`;
  const svg = `<clipPath id="${id}"><path data-hold d="${rod.clip}"/></clipPath><g clip-path="url(#${id})">${S(rod.paths, { tone: "hi" })}</g>`;
  CLIPS.push(id);
  put("damp.rod", G.pointOf(F, -(DAMP.gland + DAMP.tip) / 2, 0, 0), svg, [record(A.slide(F, -DAMP.gland, -DAMP.tip, DAMP.rod, { name: "damp.rod" }))], { piece: "damper", live: { kind: "rod" }, move: [TMD_STROKE, 0, 0], ride: "tmd" });
}

// ---------- settle the painter's keys (at rest and with the TMD swung both ways) ----------
const states = [0, { label: "tmd +", shares: { tmd: 1 } }, { label: "tmd −", shares: { tmd: -1 } }];
A.settle(R, P, { states });
R.items.sort((a, b) => a.key - b.key);

// hangers: four lines from the hanger beams to lugs on the sphere, rebuilt by the page as the TMD swings
const HANGERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
  const top = [sx * HANG * 0.9, sy * HANG, ROOF + PH_TOP];
  const dir = G.unit3([sx * 0.45, sy * 0.45, 0.77]);
  return { top, lug: G.add3(SPHERE, G.mul3(dir, SPHERE_R)) };
});
const sphereIndex = R.items.findIndex((item) => item.name === "tmd.mass");
// the two far hangers go behind the sphere, the two near ones in front of it
const hangerSvg = (list) => `<g class="it" data-piece="hanger" data-hangers="${list.join(" ")}">${list.map((i) => `<path class="iso-line" data-tone="mid" d="${path3([HANGERS[i].top, HANGERS[i].lug])}"/>`).join("")}${Dots(list.flatMap((i) => [at(HANGERS[i].top), at(HANGERS[i].lug)]), { size: 0.5, tone: "hi" })}</g>`;
const groups = R.items.map((item, index) => {
  const piece = item.piece ? ` data-piece="${item.piece}"` : "";
  return `${index === sphereIndex ? hangerSvg([0, 1]) : ""}<g class="it"${piece} data-i="${index}">${item.svg}</g>${index === sphereIndex ? hangerSvg([2, 3]) : ""}`;
});

const svg = k.figureSvg({
  width: W,
  height: H,
  label: "땅을 잘라 낸 단면 위에 선 강철 골조 고층 건물입니다. 기초판과 건물 사이에 적층 고무받침 아홉 개가 있고, 앞쪽 하나는 반으로 잘라 고무층과 강판, 가운데 납심을 보여 줍니다. 층마다 기둥 여덟 개, 가운데 코어 벽, 네 면의 X자 가새, 바닥판이 있습니다. 옥상의 틀에는 케이블에 매단 쇠공(동조 질량 감쇠기)과 양옆의 오일 댐퍼가 있습니다.",
  body: [...back, `<g class="st-world">${groups.join("")}</g>`],
});

// ---------- the page ----------
const param = (id) => content.params.find((entry) => entry.id === id).value;
const first = { N: param("N"), f: param("f"), zeta: param("zeta") / 100, iso: param("iso"), tmd: param("tmd") };
const sys0 = M.systemOf(first);
const res0 = M.responseOf(sys0, first.f);

const DATA = {
  P,
  NMAX,
  STORY,
  ROOF,
  SPHERE,
  SPHERE_R,
  TMD_STROKE,
  BEAR_MAX: 11,
  live: R.items.map((item) => item.live),
  hangers: HANGERS,
  ax: k.axisVector(P, [1, 0, 0]),
  ay: k.axisVector(P, [0, 1, 0]),
  az: k.axisVector(P, [0, 0, 1]),
  so: R.items.map((item) => (item.live.o ? at(item.live.o) : null)),
  zLevel: Array.from({ length: NMAX + 1 }, (_, i) => zLevel(i)),
};

const modelScript = `const M = (() => {${readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "")}
return { STORY_MASS, STORY_K, T_BEARING, ZETA_BEARING, MU, RANGE, A_SCALE, systemOf, responseOf, curveOf, abs, fmt };})();
`;
const live = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const CSS = readFileSync(join(HERE, "tower.css"), "utf8");

const chart = `<div class="st-chart" data-chart aria-hidden="false"><svg class="st-chart-svg" viewBox="0 0 260 170" role="img" aria-label="공진 곡선: 가로축은 땅의 진동수, 세로축은 증폭률입니다. 점이 지금 진동수의 증폭률입니다. 끌어서 진동수를 바꿀 수 있습니다."><g data-chart-body></g></svg></div>`;
const stageHtml = `<div class="iso-stage st-stage" tabindex="0" role="group" aria-label="내진·면진 고층 건물. 왼쪽·오른쪽 화살표 키로 지진의 진동수를 바꾸고, 그래프를 끌어도 됩니다.">${svg}${chart}</div>`;
const values = {
  N: `${first.N}층`,
  f: M.fmt.hz(first.f),
  fn: M.fmt.hz3(sys0.fn),
  H: M.fmt.H(res0.H),
  T: M.fmt.s(sys0.T),
  zeta: M.fmt.pct(first.zeta),
};
const html = eduPage({ content, theme, stage: stageHtml, css: CSS, script: kitScript() + modelScript + live, values });
writePage(HERE, theme === "light" ? "seismic-tower-ko-light.html" : "seismic-tower-ko.html", html);
console.log(`${R.items.length} items · scale ${KS.toFixed(3)} · ${(html.length / 1024).toFixed(0)} KB`);

A.auditOrExit(R, P, {});
