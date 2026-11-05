// Fiber-optic link: the drawing. One scene per mandrel step (the only part whose shape changes),
// each recorded into its own audit recorder, so every variant is settled and audited as drawn.
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";
import * as A from "../../kit/audit.mjs";
import { MODEL } from "./model.mjs";

export const W = 640;
export const H = 350;
export const AZIMUTH = 62;
export const ELEVATION = 37;

export const PLATE = { x: -244, y: -96, w: 396, d: 188, r: 10 };
const PLATE_H = 10;
const FOOT_H = 5;

// The two cable lines. Cord 1 (the thick demonstration cable with its mid-span window) runs along x
// at Y1, Z1 from the transmitter's adapter to the spool box. Cord 2 (a 3 mm patch cord) leaves the
// spool box at Z2, runs round the stepped mandrel and back along the front to the receiver.
export const Y1 = -46;
export const Z1 = 26;
export const C1 = G.frameOf([0, Y1, Z1], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
export const LAYERS = { jacket: 7.6, aramid: 7.0, coating: 6.2, cladding: 5.4, core: 3.4 };
export const CORD2_R = 2.5;
export const Z2 = 13;
export const XO = 122; // cord 2 leaves the spool box front face here, heading +y
export const YF = 62; // front leg of cord 2, heading −x to the receiver
export const MANDREL = { x: XO - 35, y: YF - 30 };
// Mandrel tiers (radius, bottom, top). Cord 2's centre wraps tier k at radius R + r, so the fibre's
// bend radius is (R + 2.5) / 2 mm at this drawing's 2 units per millimetre: 15, 10, 7.5 and 5 mm.
export const TIERS = [
  { R: 27.5, z0: 3, z1: 10 },
  { R: 17.5, z0: 10, z1: 17 },
  { R: 12.5, z0: 17, z1: 24 },
  { R: 7.5, z0: 24, z1: 34 },
];
export const UNITS_PER_MM = 2;
export const SPOOL_IN_FIBRE = 60; // cord 1's fibre ends at the spool box's −x face
export const SPOOL_OUT_FIBRE = -26;
export const ZO = 18; // height of the spool box OUT port // cord 2's fibre starts at the spool box's front face (y)

// Transmitter along cord 1's axis (s = x).
const TXB = { x: -240, y: -72, w: 110, d: 54, r: 3 };
const BB_H = 4;
const TXBOX = { x: -236, y: -64, w: 34, d: 40, r: 2 };
const LDM = { x: -202, y: -55, w: 12, d: 18, r: 1 };
const LD = { header: [-190, -188.8], can: [-188.8, -182.6], cap: [-182.6, -182] };
export const EMIT = -182;
export const LENS_X = -170; // the holder ring's centre; the lens glass sits on its +x face
export const LENS_R = 5.6;
export const GLASS = [LENS_X + 2.6, LENS_X + 5, 6.4];
export const FOCUS = -156; // the fibre's end face, at the mouth of the adapter sleeve
const TXPLATE = { x: -152, y: -62, w: 4, d: 32, r: 0.6 };
// Cord 1 window (s along x): jacket stops, then aramid, coating, the bare glass, and back.
// Cord 1: TX boot end at −120.4, spool-side boot start at 32.4 (connectors: thread 5.2, nut 5, body 5, boot 10).
export const WIN = { j0: -114.4, a0: -110.4, c0: -106.4, c1: 18.4, a1: 22.4, j1: 26.4 };
const SPOOL = { x: 60, y: -92, w: 72, d: 66, r: 4 };
const SPOOL_H = 40;
const RXB = { x: -150, y: 36, w: 96, d: 52, r: 3 };
const RXBOX = { x: -144, y: 42, w: 42, d: 40, r: 2 };
const RXPLATE = { x: -70, y: YF - 14, w: 4, d: 28, r: 0.6 };
const PDM = { x: -102, y: YF - 10, w: 15.8, d: 20, r: 1 };
const PD = { header: [-86.2, -85], can: [-85, -78], cap: [-78, -77.4] };
export const PD_FACE = -77.4;
export const RX_FIBRE = -73.4; // the receiving fibre's end face (adapter mouth, −x side)
const CLAMPS = [{ x: 46, y: YF }, { x: -6, y: YF }];

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PLATE.x, PLATE.y, 50], [SPOOL.x, SPOOL.y, SPOOL_H + 2], [SPOOL.x + SPOOL.w, SPOOL.y, SPOOL_H], [MANDREL.x, MANDREL.y, 38], [TXBOX.x, TXBOX.y, 42]],
  W,
  H,
  { pad: 18, azimuth: AZIMUTH, elevation: ELEVATION },
);
export const V = G.viewOf(P);
export const KS = G.scaleOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
const ZF = (x, y, z = 0) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const XF = (y, z) => G.frameOf([0, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const NXF = (y, z) => G.frameOf([0, y, z], [-1, 0, 0], [0, -1, 0], [0, 0, 1]);
const f2 = (v) => Math.round(v * 100) / 100;

// The plane of cord 1 that faces the viewer: the ray zigzags in it, so its bounces land on the core's outline.
export const SIDE = G.unit3(G.cross3([1, 0, 0], V));

// Light path coordinate g (world units): 0 at the laser, FOCUS − EMIT at the fibre face, then along cord 1.
export const gOfX = (x) => x - EMIT;
const pulse1 = (s0, s1) => `<path class="fl-pulse" data-g0="${f2(gOfX(s0))}" pathLength="${f2(s1 - s0)}" d="${path3([[s0, Y1, Z1], [s1, Y1, Z1]])}"/>`;

export function scene(bend) {
  const R = A.recorder(P);
  const record = R.solid;
  const put = (piece, name, ref, svg, shapes = [], { bias = 0, ...rest } = {}) => R.put({ piece, name, at: ref, bias, svg, shapes, ...rest });
  const box = (piece, name, plan, z0, z1, style = {}, { steps = 3, bevel = 0.5, extra = "", inner = "", bias = 0 } = {}) => {
    const shape = record(A.slab(plan, z0, z1 - z0, { name }, steps));
    put(piece, name, [plan.x + plan.w / 2, plan.y + plan.d / 2, (z0 + z1) / 2], S(k.slabOf(plan, z0, z1 - z0, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
    return shape;
  };
  const turned = (piece, name, F, profile, style = {}, { extra = "", inner = "", bias = 0, steps, rims, owner, smooth, ref } = {}) => {
    const opts = { ...(steps ? { steps } : {}), ...(rims ? { rims } : {}), ...(smooth !== undefined ? { smooth } : {}) };
    const paths = G.solidOf(profile, F, P, opts);
    const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
    const shape = record(A.solid(F, profile, { name, owner }));
    put(piece, name, ref ?? G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias });
    return shape;
  };
  const disc = (piece, name, F, s0, s1, r, style = {}, options = {}) => turned(piece, name, F, [[s0, r], [s1, r]], style, options);
  const cyl = (piece, name, x, y, r, z0, z1, style = {}, options = {}) => disc(piece, name, ZF(x, y), z0, z1, r, style, options);
  const ringAt = (piece, name, F, s0, s1, rIn, rOut, style = {}, { extra = "", bias = 0, owner } = {}) => {
    const shape = record(A.ring(F, s0, s1, rIn, rOut, { name, owner }));
    put(piece, name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), S(G.ringBand(s0, s1, rIn, rOut, F, P), { tone: "mid", ...style }) + extra, [shape], { bias });
    return shape;
  };
  const back = [];

  // ---------- bench ----------
  back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
  const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
    back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -4, P, 8), { tone: "faint" }) }));
  back.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  back.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  back.push(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }, 8));
  // Ruler strip along the front edge (a distance scale), and the label plate.
  const STRIP = { x: -232, y: PLATE.y + PLATE.d - 14, w: 72, d: 7, r: 1 };
  back.push(`<g data-piece="bench">${S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" })}`);
  const ticks = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y + 0.8, 0.6, [1.8, 3.4], P);
  back.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  const LABEL = { x: -230, y: 46, w: 62, d: 14, r: 1.2 };
  back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.4), 0.8, P, 3), { tone: "faint" }));
  back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 4, LABEL.y + 6.2], 0.8, P, "x"), "FIBER LINK", { size: 4, tone: "lo" }));
  back.push(Ln([30, 22].map((w, i) => k.lineOnTop([LABEL.x + 4, LABEL.y + 8.6 + i * 2.6], [LABEL.x + 4 + w, LABEL.y + 8.6 + i * 2.6], 0.8, P)).join(""), { tone: "lo", free: true }));
  back.push(Dots([at([LABEL.x + LABEL.w - 2.6, LABEL.y + 2.6, 0.8]), at([LABEL.x + LABEL.w - 2.6, LABEL.y + LABEL.d - 2.6, 0.8])], { size: 0.45 }) + `</g>`);

  // ---------- breadboards (optical tables with tapped holes) ----------
  const breadboard = (name, plan) => {
    const holes = [];
    for (let x = plan.x + 6; x <= plan.x + plan.w - 5; x += 8) for (let y = plan.y + 6; y <= plan.y + plan.d - 5; y += 8) holes.push([x, y]);
    box("breadboard", name, plan, 0, BB_H, { tone: "mid" }, { steps: 3, bevel: 0.6, extra: Dots(holes.map(([x, y]) => at([x, y, BB_H])), { size: 0.42, tone: "lo" }), inner: Ln(k.sideSeam(plan, 1.6, P, 3), { tone: "faint" }), bias: -0.5 });
  };
  breadboard("txb", TXB);
  breadboard("rxb", RXB);

  // ---------- transmitter ----------
  // Driver box with its LCD on the front face.
  const lcd = (plan, zLo, zHi, id) => {
    const y = plan.y + plan.d;
    const x0 = plan.x + 3;
    const x1 = plan.x + plan.w - 3;
    const frame = [[x0, y, zLo], [x1, y, zLo], [x1, y, zHi], [x0, y, zHi]];
    const glass = [[x0 + 1.6, y, zLo + 1.6], [x1 - 1.6, y, zLo + 1.6], [x1 - 1.6, y, zHi - 1.6], [x0 + 1.6, y, zHi - 1.6]];
    const m = k.sideMatrix([x0 + 1.6, y], zHi - 1.6, P, "left");
    const w = x1 - x0 - 3.2;
    const h = zHi - zLo - 3.2;
    return `<path class="iso-line" data-tone="lo" d="${path3(frame, true)}"/><path class="fl-lcd" d="${path3(glass, true)}"/><g class="fl-screen" data-screen="${id}" transform="${m}" data-w="${f2(w)}" data-h="${f2(h)}"></g><path class="iso-line" data-tone="mid" d="${path3(glass, true)}"/>`;
  };
  const boxDetail = (plan, z1) => {
    const vents = Array.from({ length: 5 }, (_, i) => k.planOutline({ x: plan.x + 6 + i * 5, y: plan.y + 6, w: 2.2, d: 14, r: 1.1 }, z1, P, 3)).join("");
    const sc = [[plan.x + 2.6, plan.y + 2.6], [plan.x + plan.w - 2.6, plan.y + 2.6], [plan.x + 2.6, plan.y + plan.d - 2.6], [plan.x + plan.w - 2.6, plan.y + plan.d - 2.6]];
    return Ln(vents, { tone: "faint" }) + Dots(sc.map(([x, y]) => at([x, y, z1])), { size: 0.45 });
  };
  box("driver", "tx.box", TXBOX, BB_H, 40, { tone: "mid" }, { bevel: 0.7, inner: Ln(k.sideSeam(TXBOX, 34, P, 3), { tone: "faint" }), extra: boxDetail(TXBOX, 40) + lcd(TXBOX, 14, 34, "tx") });
  // Power LED on the front face, below the LCD.
  {
    const F = G.frameOf([TXBOX.x + TXBOX.w - 6, TXBOX.y + TXBOX.d, 9], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    disc("driver", "tx.led", F, 0, 1.2, 1.5, { tone: "hi" }, { extra: `<circle class="fl-led" data-led="tx" cx="${f2(at(G.pointOf(F, 1.2, 0, 0))[0])}" cy="${f2(at(G.pointOf(F, 1.2, 0, 0))[1])}" r="${f2(1.1 * KS)}"/>` });
  }
  // Laser diode mount: a finned block, the TO-can on its +x face.
  box("laser", "ld.block", LDM, BB_H, 30, { tone: "mid" }, { bevel: 0.5, inner: Ln(k.sideSeam(LDM, 26, P, 3), { tone: "faint" }) });
  for (let i = 0; i < 4; i++) box("laser", `ld.fin${i}`, { x: LDM.x + 1, y: LDM.y + 1.5 + i * 4.3, w: LDM.w - 2, d: 1.6, r: 0.3 }, 30, 35, { tone: "lo" }, { steps: 2, bevel: 0 });
  {
    const F = XF(Y1, Z1);
    disc("laser", "ld.header", F, LD.header[0], LD.header[1], 4.4, { tone: "mid" });
    turned("laser", "ld.can", F, [[LD.can[0], 3.4], [LD.cap[0], 3.4], [LD.cap[0], 1.8], [LD.cap[1], 1.8]], { tone: "hi" }, { inner: Ln(G.arcOf(F, LD.can[0] + 1.4, 3.4, P), { tone: "faint" }), extra: Ln(G.circleOf(F, LD.cap[1], 1.1, P), { tone: "red" }) });
  }
  // Lens on a post: ring holder, glass, collar.
  {
    const F = XF(Y1, Z1);
    cyl("lens", "lens.collar", LENS_X, Y1, 3.4, BB_H, BB_H + 3, { tone: "lo" });
    cyl("lens", "lens.post", LENS_X, Y1, 2, BB_H + 3, Z1 - 8, { tone: "mid" });
    ringAt("lens", "lens.ring", F, LENS_X - 2.6, LENS_X + 2.6, LENS_R, 8, { tone: "mid" }, { extra: Dots([at([LENS_X, Y1, Z1 + 8])], { size: 0.5 }) });
    const g0 = LENS_X + 2.6;
    const lensProfile = [[g0, 0], [g0, 6.4], [g0 + 0.8, 6.4, 1], [g0 + 1.6, 5.2, 1], [g0 + 2.2, 3, 1], [g0 + 2.4, 0]];
    const glass = G.solidOf(lensProfile, F, P);
    const shape = record(A.solid(F, lensProfile, { name: "lens.glass", owner: "lens.ring" }));
    put("lens", "lens.glass", [LENS_X + 3.8, Y1, Z1], `<g class="fl-glass">${S(glass, { tone: "hi" })}</g>`, [shape], { bias: 0.4 });
  }
  // The launch: the focusing cone from the lens to the fibre face is drawn live (the slot "beam").
  put("beam", "beam", [(LENS_X + FOCUS) / 2, Y1, Z1], `<g class="fl-beam" data-beam="tx"></g>`, [record(A.disc(C1, GLASS[1] + 0.1, FOCUS - 0.2, 0.3, { name: "beam.launch", owner: "lens.ring" }))], { bias: 0.6 });
  put("beam", "beam.ld", [(EMIT + LENS_X) / 2, Y1, Z1], `<g class="fl-beam" data-beam="ld"></g>`, [record(A.disc(C1, EMIT + 0.1, LENS_X - 2.7, 0.3, { name: "beam.diverge", owner: "lens.ring" }))], { bias: 0.6 });

  // Adapter plates with FC bulkhead adapters (TX and RX), and their connectors.
  const adapterPlate = (name, plan, zTop, F, sFace, dir, piece = "adapter") => {
    box(piece, `${name}.plate`, plan, BB_H, zTop, { tone: "mid" }, { bevel: 0.4 });
    const holes = [[plan.x + plan.w / 2, plan.y + 3], [plan.x + plan.w / 2, plan.y + plan.d - 3]];
    put(piece, `${name}.screws`, [plan.x + plan.w / 2, plan.y + plan.d / 2, zTop], Dots(holes.map(([x, y]) => at([x, y, zTop])), { size: 0.45 }), [record(A.slab({ x: plan.x + 1, y: plan.y + 1, w: plan.w - 2, d: plan.d - 2, r: 0.4 }, zTop - 0.2, 0.2, { name: `${name}.screws` }))], { bias: 0.1 });
  };
  adapterPlate("tx.adapter", TXPLATE, 42, C1, TXPLATE.x, 1);
  // TX adapter: sleeve through the plate, hex flange on the +x face.
  const fcAdapter = (name, F, face, dir, rSleeve, rHex, piece = "adapter") => {
    // dir: +1 when the connector side is +s from the face.
    const sl = (a, b) => [Math.min(a, b), Math.max(a, b)];
    const [h0, h1] = sl(face, face + dir * 2.4);
    disc(piece, `${name}.hex`, F, h0, h1, rHex, { tone: "mid" }, { steps: 6 });
    const [o0, o1] = sl(face + dir * 2.4, face + dir * 7.6);
    disc(piece, `${name}.thread`, F, o0, o1, rSleeve, { tone: "hi" }, { inner: Ln(G.arcOf(F, (o0 + o1) / 2, rSleeve, P), { tone: "faint" }) });
  };
  fcAdapter("tx.adapter", C1, TXPLATE.x + TXPLATE.w, 1, 5.6, 8.4);
  {
    // Back stub of the sleeve, through the plate to the fibre face.
    disc("adapter", "tx.adapter.back", C1, FOCUS, TXPLATE.x, 4.4, { tone: "hi" });
  }
  // FC connector: knurled coupling nut, body, strain-relief boot.
  const connector = (name, F, s0, dir, { nut, body, boot, piece = "connector", lengths = [6, 7, 14] }) => {
    const sN = [s0, s0 + dir * lengths[0]];
    const sB = [sN[1], sN[1] + dir * lengths[1]];
    const sT = [sB[1], sB[1] + dir * lengths[2]];
    disc(piece, `${name}.nut`, F, Math.min(...sN), Math.max(...sN), nut, { tone: "hi" }, { extra: k.fadedSvg(G.ribsOf(F, Math.min(...sN) + 0.6, Math.max(...sN) - 0.6, nut, 24, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) });
    disc(piece, `${name}.body`, F, Math.min(...sB), Math.max(...sB), body, { tone: "mid" }, { inner: Ln(G.arcOf(F, (sB[0] + sB[1]) / 2, body, P), { tone: "faint" }) });
    const bootProfile = dir > 0 ? [[sT[0], boot[0]], [sT[1], boot[1]]] : [[sT[1], boot[1]], [sT[0], boot[0]]];
    const ribs = [0.25, 0.5, 0.75].map((t) => G.arcOf(F, sT[0] + (sT[1] - sT[0]) * t, boot[0] + (boot[1] - boot[0]) * t, P, { slope: ((boot[1] - boot[0]) / (sT[1] - sT[0])) * dir })).join("");
    turned(piece, `${name}.boot`, F, bootProfile, { tone: "lo" }, { inner: Ln(ribs, { tone: "faint" }) });
    return sT[1];
  };
  const txBootEnd = connector("c1.tx", C1, TXPLATE.x + TXPLATE.w + 7.6, 1, { nut: 9.4, body: 8.4, boot: [8.2, 7.9], lengths: [5, 5, 10] });

  // ---------- cord 1 with its stripped window ----------
  {
    const F = C1;
    const L = LAYERS;
    // Jacket runs, cut into bands so they depth-sort against the lens post and the adapter.
    const jacketRun = (name, s0, s1, cuts) => {
      const edges = [s0, ...cuts, s1];
      for (let i = 0; i < edges.length - 1; i++) {
        const a = edges[i];
        const b = edges[i + 1];
        const first = i === 0;
        const last = i === edges.length - 2;
        const rims = first && last ? "all" : first ? "first" : last ? "last" : "none";
        const shape = record(A.solid(F, [[a, L.jacket], [b, L.jacket]], { name: `${name}#${i}`, owner: "cord1" }));
        put("jacket", `${name}#${i}`, [(a + b) / 2, Y1, Z1], `<g data-run="c1" data-s0="${f2(a)}" data-s1="${f2(b)}">${S(G.solidOf([[a, L.jacket], [b, L.jacket]], F, P, { rims }), { tone: "hi" })}</g>${pulse1(a, b)}`, [shape]);
      }
    };
    jacketRun("c1.jacket.l", txBootEnd, WIN.j0, []);
    // Aramid yarn: a band with helical yarn lines that end on the jacket's cut face and the coating step.
    const yarn = (s0, s1) => {
      const ribs = G.ribsOf(F, s0, s1, L.aramid, 28, P, { twist: 0.9, fade: [0.08, 0.5] });
      return k.fadedSvg(ribs, { tone: "lo" });
    };
    disc("aramid", "c1.aramid.l", F, WIN.j0, WIN.a0, L.aramid, { tone: "mid" }, { extra: yarn(WIN.j0, WIN.a0) + pulse1(WIN.j0, WIN.a0), owner: "cord1" });
    disc("coating", "c1.coating.l", F, WIN.a0, WIN.c0, L.coating, { tone: "hi" }, { owner: "cord1", extra: pulse1(WIN.a0, WIN.c0) });
    // The bare glass: core inside, cladding over it, drawn as glass; the ray lives between them.
    {
      const core = record(A.solid(F, [[WIN.c0, L.core], [WIN.c1, L.core]], { name: "c1.core", owner: "cord1" }));
      put("core", "c1.core", [(WIN.c0 + WIN.c1) / 2, Y1, Z1], `<g class="fl-core">${S(G.solidOf([[WIN.c0, L.core], [WIN.c1, L.core]], F, P), { tone: "mid" })}</g>`, [core], { bias: 0 });
      const clad = record(A.solid(F, [[WIN.c0, L.cladding], [WIN.c1, L.cladding]], { name: "c1.cladding", owner: "cord1" }));
      put("cladding", "c1.cladding", [(WIN.c0 + WIN.c1) / 2, Y1, Z1], `<g class="fl-glass">${S(G.solidOf([[WIN.c0, L.cladding], [WIN.c1, L.cladding]], F, P), { tone: "hi" })}</g><g class="fl-ray" data-ray></g><g class="fl-leak" data-leak></g>`, [clad], { bias: 0.5 });
    }
    disc("coating", "c1.coating.r", F, WIN.c1, WIN.a1, L.coating, { tone: "hi" }, { owner: "cord1", extra: pulse1(WIN.c1, WIN.a1) });
    disc("aramid", "c1.aramid.r", F, WIN.a1, WIN.j1, L.aramid, { tone: "mid" }, { extra: yarn(WIN.a1, WIN.j1) + pulse1(WIN.a1, WIN.j1), owner: "cord1" });
  }
  // Spool box IN adapter and connector (cord 1 enters from −x).
  const spoolInFace = SPOOL.x;
  fcAdapter("spool.in", C1, spoolInFace, -1, 5.6, 8.4, "spool");
  const rxBootStart1 = connector("c1.spool", C1, spoolInFace - 7.6, -1, { nut: 9.4, body: 8.4, boot: [8.2, 7.9], lengths: [5, 5, 10] });
  {
    const F = C1;
    const L = LAYERS;
    const a = WIN.j1;
    const b = rxBootStart1;
    const edges = [a, b];
    for (let i = 0; i < edges.length - 1; i++) {
      const s0 = edges[i];
      const s1 = edges[i + 1];
      const rims = edges.length === 2 ? "all" : i === 0 ? "first" : "last";
      const shape = record(A.solid(F, [[s0, L.jacket], [s1, L.jacket]], { name: `c1.jacket.r#${i}`, owner: "cord1" }));
      put("jacket", `c1.jacket.r#${i}`, [(s0 + s1) / 2, Y1, Z1], `${S(G.solidOf([[s0, L.jacket], [s1, L.jacket]], F, P, { rims }), { tone: "hi" })}${pulse1(s0, s1)}`, [shape]);
    }
  }

  // ---------- spool box ----------
  box("spool", "spool.box", SPOOL, 0, SPOOL_H - 3, { tone: "mid" }, { bevel: 0.8, steps: 4, inner: Ln(k.sideSeam(SPOOL, 6, P, 4), { tone: "faint" }) });
  {
    const LID = k.insetPlan(SPOOL, -0.6);
    const cx = SPOOL.x + 34;
    const cy = SPOOL.y + SPOOL.d / 2;
    const win = Ln(k.ring(cx, cy, 25, SPOOL_H, P, 64), { tone: "lo" }) + Ln(k.ring(cx, cy, 23, SPOOL_H, P, 64), { tone: "faint" });
    const reel = `<path class="fl-well" d="${k.pathOf(Array.from({ length: 64 }, (_, i) => at([cx + 23 * Math.cos((i / 64) * Math.PI * 2), cy + 23 * Math.sin((i / 64) * Math.PI * 2), SPOOL_H])), true)}"/>`;
    const hub = Ln(k.ring(cx, cy, 7, SPOOL_H - 1.5, P, 32) + k.ring(cx, cy, 3, SPOOL_H - 1.5, P, 24), { tone: "mid" }) + Ln([0, 1, 2].map((i) => k.ring(cx + 14 * Math.cos(i * 2.094 + 0.5), cy + 14 * Math.sin(i * 2.094 + 0.5), 3.4, SPOOL_H - 1.5, P, 20)).join(""), { tone: "lo" });
    const sc = k.corners(SPOOL, 3.6);
    box("spool", "spool.lid", LID, SPOOL_H - 3, SPOOL_H, { tone: "hi" }, { bevel: 0.8, steps: 4, extra: reel + hub + win + Dots(sc.map(([x, y]) => at([x, y, SPOOL_H])), { size: 0.45 }) });
    // Label plate on the front face: the spool's length, written live.
    const fy = SPOOL.y + SPOOL.d;
    const plate = { x: SPOOL.x + 6, y: fy, w: 40, d: 0.8, r: 0.3 };
    const text = `<text class="iso-face-text fl-km" data-tone="hi" transform="${k.sideMatrix([plate.x + 3, fy + 0.8], 22.4, P, "left")}" font-size="7" text-anchor="start">${MODEL.L} km</text>`;
    const rules = Ln([k.segment([plate.x + 3, fy + 0.8, 19.4], [plate.x + 26, fy + 0.8, 19.4], P), k.segment([plate.x + 3, fy + 0.8, 17.6], [plate.x + 19, fy + 0.8, 17.6], P)].join(""), { tone: "lo", free: true });
    box("spool", "spool.label", plate, 15, 31, { tone: "lo" }, { steps: 2, bevel: 0, extra: text + rules + Dots([at([plate.x + plate.w - 2.4, fy + 0.8, 28.6]), at([plate.x + plate.w - 2.4, fy + 0.8, 17.4])], { size: 0.45 }) });
    // Handle on the lid.
  }
  // Cord 2 leaves through the OUT adapter on the front face, heading +y.
  const C2 = G.frameOf([XO, 0, ZO], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  fcAdapter("spool.out", C2, SPOOL.y + SPOOL.d, 1, 3.2, 4.8, "spool");
  const c2Start = connector("c2.spool", C2, SPOOL.y + SPOOL.d + 7.6, 1, { nut: 4.6, body: 3.9, boot: [3.7, 3.3], lengths: [5, 5, 9] });

  // ---------- mandrel ----------
  {
    const F = ZF(MANDREL.x, MANDREL.y);
    const profile = [[0, 33], [4, 33]];
    turned("mandrel", "mandrel.base", F, [[0, 33], [3, 33]], { tone: "lo" }, { extra: Dots(G.dotsOf(F, 3, 30.5, 8, P, { all: true }), { size: 0.45 }) });
    void profile;
    TIERS.forEach((t, i) => {
      const lines = Ln(k.ring(MANDREL.x, MANDREL.y, t.R - 1.2, t.z1, P, 48), { tone: "faint" });
      turned("mandrel", `mandrel.t${i}`, F, [[t.z0, t.R], [t.z1, t.R]], { tone: i === bend ? "hi" : "mid" }, { extra: lines });
    });
    cyl("mandrel", "mandrel.knob", MANDREL.x, MANDREL.y, 4.4, 34, 38, { tone: "hi" }, { extra: Ln(k.knurl(MANDREL.x, MANDREL.y, 4.4, 34.4, 37.6, 20, P, 0.3), { tone: "lo" }) });
  }

  // ---------- clamps on cord 2 ----------
  const clampItems = CLAMPS.map((c, i) => {
    const F = XF(c.y, Z2);
    const s0 = c.x - 2;
    const s1 = c.x + 2;
    box("clamp", `clamp${i}.foot`, { x: c.x - 5, y: c.y - 6, w: 10, d: 12, r: 1 }, 0, 1.6, { tone: "lo" }, { bevel: 0 });
    box("clamp", `clamp${i}.stem`, { x: c.x - 2, y: c.y - 2.4, w: 4, d: 4.8, r: 0.6 }, 1.6, Z2 - 4.6, { tone: "mid" }, { bevel: 0 });
    ringAt("clamp", `clamp${i}.ring`, F, s0, s1, CORD2_R, 4.6, { tone: "mid" }, { owner: "cord2" });
    return [s0, s1];
  });

  // ---------- keyboard: the text goes in here ----------
  {
    const KB = { x: -128, y: -24, w: 100, d: 38, r: 3 };
    box("keyboard", "kb.case", KB, 0, 5, { tone: "mid" }, { bevel: 0.8, steps: 4, inner: Ln(k.sideSeam(KB, 1.6, P, 4), { tone: "faint" }), extra: Ln(k.planOutline(k.insetPlan(KB, 2.4), 5, P, 3), { tone: "faint" }) + Dots(k.corners(KB, 1.6).map(([x, y]) => at([x, y, 5])), { size: 0.4 }) });
    const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    const pitch = 9;
    rows.forEach((row, r) => {
      const x0 = KB.x + 5 + r * 3;
      const y = KB.y + 4 + r * pitch;
      [...row].forEach((ch, i) => {
        const plan = { x: x0 + i * pitch, y, w: 7.4, d: 7.2, r: 1.2 };
        const shape = record(A.slab(plan, 5, 3, { name: `kb.key.${ch}` }, 3));
        put("keyboard", `kb.key.${ch}`, [plan.x + 3.7, plan.y + 3.6, 6.5], `<g data-key="${ch}">${S(k.slabOf(plan, 5, 3, P, 3, 0.5), { tone: "hi" })}${Ln(k.planOutline(k.insetPlan(plan, 1.3), 8, P, 3), { tone: "faint" })}</g>`, [shape]);
      });
    });
    const space = { x: KB.x + 26, y: KB.y + 4 + 3 * pitch, w: 44, d: 6.4, r: 1.2 };
    put("keyboard", "kb.key.space", [space.x + 22, space.y + 3.2, 6.5], `<g data-key=" ">${S(k.slabOf(space, 5, 3, P, 3, 0.5), { tone: "hi" })}</g>`, [record(A.slab(space, 5, 3, { name: "kb.key.space" }, 3))]);
    // Cable from the keyboard's left end to the transmitter's front panel, on small bosses at both ends.
    const fk = G.frameOf([KB.x, -8, 2.6], [-1, 0, 0], [0, 1, 0], [0, 0, 1]);
    disc("keyboard", "kb.port", fk, 0, 1.4, 1.9, { tone: "mid" });
    const fx = G.frameOf([-228, TXBOX.y + TXBOX.d, 8], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    disc("driver", "tx.port", fx, 0, 1.6, 2.2, { tone: "mid" });
    const r = 1.1;
    const route = G.fillet([[KB.x - 1.4, -8, 2.6], [KB.x - 10, -8, 2.6], [-150, -8, r + 0.05], [-212, -8, r + 0.05], [-228, -8, 8], [-228, TXBOX.y + TXBOX.d + 1.6 + 3, 8], [-228, TXBOX.y + TXBOX.d + 1.6, 8]], 5, 8, { P, tube: r });
    R.route("kb.cable", route, r, { limp: true, touch: ["stand.plate", "txb"], piece: "keyboard" });
    tubePieces(route, r, P, { maxLength: 14, spacing: 0.8 }).forEach((piece, index) => put("keyboard", `kb.cable:${index}`, piece.mid, tubeSvg(piece, { tone: "mid" }), [A.tube(piece.points, piece.radii)], { route: "kb.cable", chunk: index, bias: 0.05 }));
  }

  // ---------- receiver ----------
  box("receiver", "rx.box", RXBOX, BB_H, 40, { tone: "mid" }, { bevel: 0.7, inner: Ln(k.sideSeam(RXBOX, 34, P, 3), { tone: "faint" }), extra: boxDetail(RXBOX, 40) + lcd(RXBOX, 12, 36, "rx") });
  {
    const F = G.frameOf([RXBOX.x + 5, RXBOX.y + RXBOX.d, 8], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    disc("receiver", "rx.led", F, 0, 1.2, 1.5, { tone: "hi" }, { extra: `<circle class="fl-led" data-led="rx" cx="${f2(at(G.pointOf(F, 1.2, 0, 0))[0])}" cy="${f2(at(G.pointOf(F, 1.2, 0, 0))[1])}" r="${f2(1.1 * KS)}"/>` });
  }
  box("photodiode", "pd.block", PDM, BB_H, 22, { tone: "mid" }, { bevel: 0.5, inner: Ln(k.sideSeam(PDM, 18, P, 3), { tone: "faint" }) });
  {
    const F = XF(YF, Z2);
    disc("photodiode", "pd.header", F, PD.header[0], PD.header[1], 4.4, { tone: "mid" });
    turned("photodiode", "pd.can", F, [[PD.can[0], 3.4], [PD.cap[0], 3.4], [PD.cap[0], 2.2], [PD.cap[1], 2.2]], { tone: "hi" }, { inner: Ln(G.arcOf(F, PD.can[0] + 1.6, 3.4, P), { tone: "faint" }), extra: `<path class="fl-pd" d="${G.circleOf(F, PD.cap[1], 1.4, P)}"/>` });
  }
  put("beam", "beam.rx", [(PD_FACE + RX_FIBRE) / 2, YF, Z2], `<g class="fl-beam" data-beam="rx"></g>`, [record(A.disc(XF(YF, Z2), PD_FACE + 0.1, RX_FIBRE - 0.1, 0.3, { name: "beam.rx", owner: "rx.adapter.plate" }))], { bias: 0.6 });
  adapterPlate("rx.adapter", RXPLATE, 28, XF(YF, Z2), RXPLATE.x, -1);
  fcAdapter("rx.adapter", XF(YF, Z2), RXPLATE.x + RXPLATE.w, 1, 3.2, 4.8);
  disc("adapter", "rx.adapter.back", XF(YF, Z2), RX_FIBRE, RXPLATE.x, 2.6, { tone: "hi" });
  const c2End = connector("c2.rx", XF(YF, Z2), RXPLATE.x + RXPLATE.w + 7.6, 1, { nut: 4.6, body: 3.9, boot: [3.7, 3.3], lengths: [5, 5, 9] });

  // ---------- cord 2: spool OUT → clamp → round the mandrel → clamps → RX ----------
  const tier = TIERS[bend];
  const rho = tier.R + CORD2_R + 0.05;
  const zw = tier.z0 + CORD2_R + 0.05;
  const A0 = [XO, MANDREL.y - 6, zw];
  const B0 = [CLAMPS[0].x + 8, YF, Z2];
  const tangentAngle = (p, sign) => {
    const dx = p[0] - MANDREL.x;
    const dy = p[1] - MANDREL.y;
    const d = Math.hypot(dx, dy);
    return Math.atan2(dy, dx) + sign * Math.acos(Math.min(1, rho / d));
  };
  const th1 = tangentAngle(A0, 1);
  const th2 = tangentAngle(B0, -1);
  // One full turn round the step plus the way round to the out-leg: a helix that rises one cable
  // width (and a little) over the first turn, so the second winding lies on the first.
  const wrap = th2 - th1 + 2 * Math.PI;
  const PITCH = 2 * CORD2_R + 0.6;
  const n = 96;
  const arc = Array.from({ length: n + 1 }, (_, i) => {
    const t = th1 + (wrap * i) / n;
    const turn = Math.min(1, (t - th1) / (2 * Math.PI));
    const z = zw + PITCH * (turn * turn * (3 - 2 * turn));
    return [MANDREL.x + rho * Math.cos(t), MANDREL.y + rho * Math.sin(t), z];
  });
  const raw = [[XO, c2Start, ZO], [XO, c2Start + 7, ZO], A0, ...arc, B0, [c2End, YF, Z2]];
  const route = G.fillet(raw, 9, 10, { P, tube: CORD2_R });
  const total = G.pathLength(route);
  const gaps = clampItems.map(([s0, s1], i) => {
    // arc length where the route passes each clamp ring
    const c = CLAMPS[i];
    let best = 0;
    let bestD = Infinity;
    for (let a = 0; a <= total; a += 0.25) {
      const p = G.pointAlong(route, a);
      const d = Math.hypot(p[0] - c.x, p[1] - c.y, p[2] - Z2);
      if (d < bestD) { bestD = d; best = a; }
    }
    return [best - 2, best + 2];
  }).sort((a, b) => a[0] - b[0]);
  R.route("cord2", route, CORD2_R, { gaps, limp: true, touch: ["mandrel*", "clamp*"], piece: "cord2" });
  // Break the chunks where the helix passes the mandrel's silhouette, so no chunk is both behind and in front of a tier.
  const phiV = Math.atan2(V[1], V[0]);
  const breaks = [];
  for (let a = 0; a <= total; a += 0.2) {
    const p = G.pointAlong(route, a);
    const q = G.pointAlong(route, Math.min(total, a + 0.2));
    if (Math.abs(Math.hypot(p[0] - MANDREL.x, p[1] - MANDREL.y) - rho) > 0.3) continue;
    for (const sil of [phiV + Math.PI / 2, phiV - Math.PI / 2]) {
      const ang = (pt) => Math.atan2(Math.sin(Math.atan2(pt[1] - MANDREL.y, pt[0] - MANDREL.x) - sil), Math.cos(Math.atan2(pt[1] - MANDREL.y, pt[0] - MANDREL.x) - sil));
      if (ang(p) <= 0 && ang(q) > 0) breaks.push(a + 0.1);
    }
  }
  const pieces = tubePieces(route, CORD2_R, P, { maxLength: 6, spacing: 1, gaps, breaks });
  const segs = [];
  pieces.forEach((piece, index) => {
    const flat = piece.points.map(at);
    const loop = piece.to <= gaps[0][0] + 1e-6;
    const a0 = piece.from - (piece.ends[0] ? 0 : 0.5);
    const len = G.pathLength(piece.points);
    const onMandrel = piece.points.every((p) => Math.abs(Math.hypot(p[0] - MANDREL.x, p[1] - MANDREL.y) - rho) < 0.6);
    const attrs = `data-a0="${f2(a0)}"${loop ? "" : " data-fixed"} pathLength="${f2(len)}" d="${k.pathOf(flat)}"`;
    const name = loop ? `c2v${bend}:${index}` : `c2f:${pieces.length - 1 - index}`;
    put("cord2", name, piece.mid, `${tubeSvg(piece, { tone: "hi" })}${onMandrel ? `<path class="fl-glow" ${attrs}/>` : ""}<path class="fl-pulse" data-c2 ${attrs}/>`, [A.tube(piece.points, piece.radii)], { route: "cord2", chunk: index, loop, bias: 0.05 });
  });

  return { R, back, route, total, wrap, rho, zw, gaps, c2Start, c2End, txBootEnd, rxBootStart1 };
}
