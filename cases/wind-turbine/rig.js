// The part of the turbine that yaws: bedplate, drivetrain, nacelle shell, met mast, hub and rotor.
// Plain script shared by build.mjs (first paint and the audit, with a recorder) and the page (rebuilt when it yaws).
// L = { k, G, P, A? }: the kit, lathe.mjs, the projection, and audit.mjs in the build only.
const RIG = {
  NS: 1.4, // the nacelle is drawn larger than true scale so its drivetrain reads (the numbers below are before it)
  ZTOP: 165, // top of the tower (yaw bearing face)
  ZC: 22, // shaft axis above the bedplate
  ROTOR_S: 50, // rotor plane along the axis
  R: 140, // blade tip radius (drawing units, not scaled)
  HUB_R: 14,
};
RIG.ZHUB = RIG.ZTOP + RIG.ZC * RIG.NS;
RIG.ROTOR_AT = RIG.ROTOR_S * RIG.NS;

function rigItems(yaw, pitch, L) {
  const { k, G, P, A } = L;
  const out = [];
  const d = [Math.cos(yaw), Math.sin(yaw), 0];
  const u = [-Math.sin(yaw), Math.cos(yaw), 0];
  const O = [0, 0, RIG.ZTOP];
  const N = RIG.NS;
  const W = (s, w, h) => [O[0] + N * (s * d[0] + w * u[0]), O[1] + N * (s * d[1] + w * u[1]), O[2] + N * h];
  const Z = (h) => RIG.ZTOP + N * h;
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (dd, style) => k.lineSvg(dd, style);
  const AX = G.frameOf(W(0, 0, RIG.ZC), d, u, [0, 0, 1]);
  const depth = (p) => k.depthOf(p, P);
  // Painter's order in ranks that hold for every heading in the yaw range (the rotor always faces the viewer's
  // side): far wall, bedplate, rear wall and roof, things standing on the floor, the drivetrain rear to front,
  // the blades, the spinner. Within a rank, by depth.
  let rank = 0;
  const put = (piece, name, at, svg, shape, bias = 0) => out.push({ piece, name, key: rank * 10000 + depth(at) + bias, svg, shape });
  // a box in the nacelle frame: s along the axis, w across, h up from the bedplate base
  const ringAt = (s0, s1, w0, w1, r = 1, steps = 3) => k.ringOf({ x: s0, y: w0, w: s1 - s0, d: w1 - w0, r }, steps).map(([s, w]) => [O[0] + N * (s * d[0] + w * u[0]), O[1] + N * (s * d[1] + w * u[1])]);
  const box = (piece, name, s0, s1, w0, w1, h0, h1, { tone = "mid", r = 1, bevel = 0.4, inner = "", extra = "", bias = 0, lit } = {}) => {
    const ring = ringAt(s0, s1, w0, w1, r);
    put(piece, name, W((s0 + s1) / 2, (w0 + w1) / 2, (h0 + h1) / 2), S(k.extrude(ring, Z(h0), N * (h1 - h0), P, { bevel }), { tone, inner, lit }) + extra, A && A.extruded(ring, Z(h0), N * (h1 - h0), { name }), bias);
  };
  const turned = (piece, name, raw, { tone = "hi", inner = "", extra = "", bias = 0, lit, smooth } = {}) => {
    const profile = raw.map(([ps, pr, flag]) => (flag ? [ps * N, pr * N, flag] : [ps * N, pr * N]));
    const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
    put(piece, name, G.pointOf(AX, mid, 0, 0), S(G.solidOf(profile, AX, P, smooth ? { smooth } : {}), { tone, inner, lit }) + extra, A && A.solid(AX, profile, { name }), bias);
  };
  const disc = (piece, name, s0, s1, r, opts = {}) => turned(piece, name, [[s0, 0], [s0, r], [s1, r], [s1, 0]], opts);
  const vcyl = (piece, name, s, w, r, h0, h1, { tone = "mid", extra = "", bias = 0 } = {}) => {
    const [x, y] = W(s, w, 0);
    put(piece, name, [x, y, Z((h0 + h1) / 2)], S(k.cylinder(x, y, r * N, Z(h0), N * (h1 - h0), P, 24, 0.3), { tone }) + extra, A && A.cylinder(x, y, r * N, Z(h0), N * (h1 - h0), { name }), bias);
  };

  // --- far side wall, bedplate (main frame), rear wall and roof rim (the near side and the top are cut away) ---
  const wallLines = [-40, -16, 8].map((s) => k.segment(W(s, -14, 0), W(s, -14, 34), P)).join("");
  box("cover", "cover.wall", -62, 36, -16, -14, 0, 34, { tone: "lo", r: 0.5, bevel: 0.3, inner: Ln(wallLines, { tone: "faint" }) });
  const bedSeam = k.ringSeam ? Ln(k.ringSeam(ringAt(-62, 38, -14, 14, 1.5), Z(2), P), { tone: "faint" }) : "";
  rank = 1;
  box("bedplate", "bedplate.frame", -62, 38, -14, 14, 0, 4, { tone: "lo", r: 1.5, inner: bedSeam });
  rank = 1.5;
  box("cover", "cover.rear", -62, -60, -14, 14, 4, 34, { tone: "lo", r: 0.5, bevel: 0.3 });
  box("cover", "cover.roof", -62, -48, -14, 14, 34, 36, { tone: "mid", r: 0.6, bevel: 0.3 });
  rank = 2;
  // yaw drives: motor and gear head on the bedplate, their pinions reach down to the ring gear
  for (const w of [-10, 10]) {
    vcyl("yaw", "yaw.motor", 0, w, 2.6, 4, 10, { tone: "mid", extra: Ln(k.ring(...W(0, w, 0).slice(0, 2), 1.4 * N, Z(10), P, 14), { tone: "faint" }) });
    vcyl("yaw", "yaw.cap", 0, w, 1.6, 10, 11.5, { tone: "hi" });
  }
  // control cabinet against the far wall, ahead of the gearbox
  const cabLines = Ln(k.segment(W(-20, -8, 4), W(-20, -8, 24), P) + k.segment(W(-14, -8, 4), W(-14, -8, 24), P), { tone: "faint" });
  box("cabinet", "cabinet.box", -22, -12, -14, -8, 4, 24, { tone: "mid", r: 0.6, inner: cabLines, extra: k.dotsSvg([k.iso(W(-21, -8, 21), P), k.iso(W(-13, -8, 21), P)], { size: 0.4 }) });

  const zc = RIG.ZC;
  // pedestals stand on the floor (rank 2); the drivetrain bodies come after them, rear to front (rank 3)
  // generator on two pedestals, cooling ribs between its end bells
  rank = 2;
  for (const s of [-54, -32]) box("generator", "generator.pedestal", s - 2.5, s + 2.5, -6, 6, 4, zc - 10.9, { tone: "lo", r: 0.5 });
  rank = 3;
  turned("generator", "generator.body", [[-58, 0], [-58, 8], [-56, 11], [-27, 11], [-25, 8], [-25, 0]], {
    tone: "mid",
    inner: Ln(G.arcOf(AX, N * (-54), N * (11), P) + G.arcOf(AX, N * (-29), N * (11), P), { tone: "faint" }),
    extra: k.fadedSvg(G.ribsOf(AX, N * -54, N * -29, N * 11, 28, P, { fade: [0.1, 0.55] }), { tone: "lo" }),
  });
  disc("brake", "brake.coupling", -25, -22, 4, { tone: "mid" });
  disc("brake", "brake.shaft", -22, -16.6, 2.2, { tone: "hi" });
  disc("brake", "brake.disc", -16.6, -15.4, 7.5, { tone: "hi", extra: "" });
  disc("brake", "brake.shaft2", -15.4, -10, 2.2, { tone: "hi" });
  // gearbox: planetary front stage and parallel rear stages in one casing, on two pedestals
  rank = 2;
  for (const s of [-6, 6]) box("gearbox", "gearbox.pedestal", s - 2.5, s + 2.5, -7, 7, 4, zc - 12.4, { tone: "lo", r: 0.5 });
  rank = 3;
  turned("gearbox", "gearbox.case", [[-10, 0], [-10, 9], [-7, 12.5], [9, 12.5], [12, 9.5], [12, 0]], {
    tone: "hi",
    lit: true,
    inner: Ln(G.arcOf(AX, N * (-2), N * (12.5), P) + G.arcOf(AX, N * (4), N * (12.5), P), { tone: "faint" }),
    extra: k.dotsSvg(G.dotsOf(AX, N * 12, N * 7.5, 8, P, { fade: [0.04, 0.42] }), { size: 0.42 }),
  });
  disc("shaft", "shaft.rear", 12, 24, 4, { tone: "hi" });
  // main bearing: housing on its pedestal
  rank = 2;
  box("bearing", "bearing.pedestal", 24, 32, -6, 6, 4, zc - 7.9, { tone: "lo", r: 0.5 });
  rank = 3;
  disc("bearing", "bearing.housing", 24, 32, 8, { tone: "mid", inner: Ln(G.arcOf(AX, N * (28), N * (8), P), { tone: "faint" }) });
  disc("shaft", "shaft.front", 32, 40, 4, { tone: "hi" });

  // --- met mast on the rear roof: cup anemometer and wind vane ---
  rank = 2;
  vcyl("met", "met.mast", -55, -6, 0.8, 36, 48, { tone: "mid" });
  vcyl("met", "met.mast2", -55, 6, 0.8, 36, 46, { tone: "mid" });

  // cup anemometer and vane: they turn in horizontal planes, so the page spins them with a transform
  const flat = (c) => {
    const p0 = k.iso(c, P), px = k.iso([c[0] + 1, c[1], c[2]], P), py = k.iso([c[0], c[1] + 1, c[2]], P);
    return `matrix(${(px[0] - p0[0]).toFixed(4)} ${(px[1] - p0[1]).toFixed(4)} ${(py[0] - p0[0]).toFixed(4)} ${(py[1] - p0[1]).toFixed(4)} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
  };
  const cupsAt = W(-55, -6, 48);
  cupsAt[2] += 0.6;
  const arms = [0, 1, 2].map((i) => { const a = (i * 2 * Math.PI) / 3; return `M0 0L${(4.2 * Math.cos(a)).toFixed(2)} ${(4.2 * Math.sin(a)).toFixed(2)}`; }).join("");
  const cups = [0, 1, 2].map((i) => { const a = (i * 2 * Math.PI) / 3; return `<circle class="wt-cup" cx="${(4.2 * Math.cos(a)).toFixed(2)}" cy="${(4.2 * Math.sin(a)).toFixed(2)}" r="1.3"/>`; }).join("");
  put("met", "met.anemometer", cupsAt, `<g transform="${flat(cupsAt)}"><g class="wt-cups"><path class="iso-line" data-tone="mid" d="${arms}"/>${cups}<circle class="wt-cup" cx="0" cy="0" r="0.9"/></g></g>`, A && A.disc(G.frameOf(cupsAt, [0, 0, 1], [1, 0, 0], [0, 1, 0]), -0.6, 0.6, 5.5, { name: "met.anemometer" }), 0.3);
  const vaneAt = W(-55, 6, 46);
  vaneAt[2] += 0.6;
  const vane = "M-5 -0.5L3 -0.5L3 -2.2L6.5 0L3 2.2L3 0.5L-5 0.5L-6.5 2L-7.5 2L-6.2 0L-7.5 -2L-6.5 -2Z";
  put("met", "met.vane", vaneAt, `<g transform="${flat(vaneAt)}"><g class="wt-vane"><path class="wt-vane-fill" d="${vane}"/><path class="iso-line" data-tone="mid" d="${vane}"/></g></g>`, A && A.disc(G.frameOf(vaneAt, [0, 0, 1], [1, 0, 0], [0, 1, 0]), -0.6, 0.6, 7.6, { name: "met.vane" }), 0.3);

  // --- hub: spinner (nose cone) on the shaft ---
  const nose = 26;
  const spin = [[40, 0], [40, RIG.HUB_R - 1]];
  for (let i = 0; i <= 16; i++) {
    const t = (i / 16) * (Math.PI / 2);
    spin.push([44 + nose * Math.sin(t), RIG.HUB_R * Math.cos(t), i && i < 16 ? 1 : 0]);
  }
  spin[2][2] = 0;
  // blades sit in the rotor plane; the spinner is drawn over their roots
  const blade = bladeSvg(yaw, pitch, L);
  rank = 4;
  put("rotor", "rotor.blades", W(RIG.ROTOR_S, 0, zc), blade.svg, A && A.ring(AX, RIG.ROTOR_AT - 1, RIG.ROTOR_AT + 1, RIG.HUB_R * N - 0.6, RIG.R, { name: "rotor.blades" }), 0);
  rank = 5;
  turned("hub", "hub.spinner", spin, { tone: "hi", inner: Ln(G.arcOf(AX, N * (46), N * (RIG.HUB_R * 0.995), P, { slope: -0.1 }), { tone: "faint" }) });
  return { items: out, rotor: blade };
}

// The three blades as flat tapered planforms in the rotor plane. The planform narrows as the blade pitches
// toward feather (its chord turns into the wind), so feathered blades read edge-on.
function bladeSvg(yaw, pitch, L) {
  const { k, P } = L;
  const d = [Math.cos(yaw), Math.sin(yaw), 0];
  const u = [-Math.sin(yaw), Math.cos(yaw), 0];
  const c = [RIG.ROTOR_AT * d[0], RIG.ROTOR_AT * d[1], RIG.ZHUB];
  const p0 = k.iso(c, P);
  const pa = k.iso([c[0] + u[0], c[1] + u[1], c[2]], P);
  const pb = k.iso([c[0], c[1], c[2] - 1], P); // local y points down
  const M = `matrix(${(pa[0] - p0[0]).toFixed(4)} ${(pa[1] - p0[1]).toFixed(4)} ${(pb[0] - p0[0]).toFixed(4)} ${(pb[1] - p0[1]).toFixed(4)} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
  const squeeze = Math.max(0.1, Math.cos((pitch * Math.PI) / 180));
  const r0 = (RIG.HUB_R - 2) * RIG.NS;
  const R = RIG.R;
  const chordAt = (r) => {
    const t = (r - r0) / (R - r0);
    return (t < 0.12 ? 11 + (18 - 11) * (t / 0.12) : 18 - 14 * Math.pow((t - 0.12) / 0.88, 0.8)) * squeeze;
  };
  const shape = (angle) => {
    const lead = [];
    const trail = [];
    for (let i = 0; i <= 24; i++) {
      const r = r0 + ((R - r0) * i) / 24;
      const ch = chordAt(r);
      // the leading edge is straighter; the trailing edge carries most of the chord
      lead.push([r, -ch * 0.3]);
      trail.push([r, ch * 0.7]);
    }
    const tip = [R + 1.2, 0.15 * squeeze];
    const pts = [...lead, tip, ...trail.reverse()];
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    return "M" + pts.map(([r, w]) => `${(r * ca - w * sa).toFixed(2)} ${(r * sa + w * ca).toFixed(2)}`).join("L") + "Z";
  };
  const blades = [0, 1, 2].map((i) => shape(-Math.PI / 2 + (i * 2 * Math.PI) / 3));
  const svg = `<g transform="${M}"><g class="wt-rotor"><path class="wt-blade" d="${blades.join("")}"/><path class="iso-line wt-blade-edge" data-tone="hi" d="${blades.join("")}"/></g></g>`;
  return { svg, M };
}
