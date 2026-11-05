// Drawing helpers shared by build.mjs (first paint) and the page (every frame). No imports:
// the kit (`kk`) and the projection (`Pk`) are passed in, and the page inlines this file with `export` stripped.

const DEG_S = Math.PI / 180;

/** Horn direction in plan for an angle on the protractor: 0° points to −x, 90° to +y, 180° to +x. */
export const dirOf = (deg) => [-Math.cos(deg * DEG_S), Math.sin(deg * DEG_S)];

/** The horn's outline: a round end round the hub, a tapered pointer arm ending on the scale. */
export function hornPolygon(deg, c, H) {
  const [dx, dy] = dirOf(deg);
  const nx = -dy;
  const ny = dx;
  const [cx, cy] = c;
  const pts = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = (Math.PI * i) / steps;
    pts.push([cx + H.hub * (nx * Math.cos(t) - dx * Math.sin(t)), cy + H.hub * (ny * Math.cos(t) - dy * Math.sin(t))]);
  }
  pts.push([cx + dx * 14 - nx * H.baseW, cy + dy * 14 - ny * H.baseW]);
  pts.push([cx + dx * H.arm - nx * H.tipW, cy + dy * H.arm - ny * H.tipW]);
  pts.push([cx + dx * (H.arm + 1.8), cy + dy * (H.arm + 1.8)]);
  pts.push([cx + dx * H.arm + nx * H.tipW, cy + dy * H.arm + ny * H.tipW]);
  pts.push([cx + dx * 14 + nx * H.baseW, cy + dy * 14 + ny * H.baseW]);
  return pts;
}

export function hornSvg(deg, c, H, kk, Pk) {
  const ring = hornPolygon(deg, c, H);
  const [dx, dy] = dirOf(deg);
  const [cx, cy] = c;
  const zt = H.z + H.t;
  const holes = [9, 12.5].map((r) => kk.ring(cx + dx * r, cy + dy * r, 0.9, zt, Pk, 12)).join("");
  const rib = kk.lineOnTop([cx + dx * 17, cy + dy * 17], [cx + dx * (H.arm - 2), cy + dy * (H.arm - 2)], zt, Pk);
  return kk.solidSvg(kk.extrude(ring, H.z, H.t, Pk, { convex: false, bevel: 0.3 }), { tone: "hi", lit: true }) + kk.lineSvg(holes, { tone: "lo" }) + kk.lineSvg(rib, { tone: "lo", free: true });
}

/** Side teeth of a vertical gear: one line per tooth on the side facing the viewer. */
export function sideTeeth(g, phase, kk, Pk) {
  const [vx, vy] = kk.towardViewer(Pk);
  const out = [];
  for (let i = 0; i < g.teeth; i++) {
    const a = phase + (i / g.teeth) * Math.PI * 2;
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    if (nx * vx + ny * vy < 0.18) continue;
    out.push(kk.segment([g.cx + g.r * nx, g.cy + g.r * ny, g.z0 + 0.35], [g.cx + g.r * nx, g.cy + g.r * ny, g.z1 - 0.35], Pk));
  }
  return out.join("");
}

/** SVG matrix that turns a flat drawing in the plane spanned by world axes u, v (through point o) by `angle` (rad, u toward v). */
export function planeTurn(o, u, v, angle, iso, Pk) {
  const p0 = iso(o, Pk);
  const pu = iso([o[0] + u[0], o[1] + u[1], o[2] + u[2]], Pk);
  const pv = iso([o[0] + v[0], o[1] + v[1], o[2] + v[2]], Pk);
  const a = pu[0] - p0[0], b = pu[1] - p0[1], c = pv[0] - p0[0], d = pv[1] - p0[1];
  const det = a * d - b * c;
  const cs = Math.cos(angle), sn = Math.sin(angle);
  // T = M · R · M⁻¹, with M = [[a, c], [b, d]]
  const i11 = d / det, i12 = -c / det, i21 = -b / det, i22 = a / det;
  const r11 = cs * i11 - sn * i21, r12 = cs * i12 - sn * i22, r21 = sn * i11 + cs * i21, r22 = sn * i12 + cs * i22;
  const t11 = a * r11 + c * r21, t12 = a * r12 + c * r22, t21 = b * r11 + d * r21, t22 = b * r12 + d * r22;
  const e = p0[0] - (t11 * p0[0] + t12 * p0[1]);
  const f = p0[1] - (t21 * p0[0] + t22 * p0[1]);
  const r = (x) => Math.round(x * 10000) / 10000;
  return `matrix(${r(t11)} ${r(t21)} ${r(t12)} ${r(t22)} ${r(e)} ${r(f)})`;
}

/** Screen point → world point on the horizontal plane at height z. */
export function onPlane(sx, sy, z, iso, Pk) {
  const o = iso([0, 0, z], Pk);
  const px = iso([1, 0, z], Pk);
  const py = iso([0, 1, z], Pk);
  const a = px[0] - o[0], b = px[1] - o[1], c = py[0] - o[0], d = py[1] - o[1];
  const det = a * d - b * c;
  const x = sx - o[0];
  const y = sy - o[1];
  return [(d * x - c * y) / det, (-b * x + a * y) / det];
}
