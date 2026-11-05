// The tower's one model: the build (first paint, ko.mjs ranges) and the page (every frame) both use it.
// A lumped shear building: N stories of mass m_s in series with story stiffness k_s, so the tower is
// one mass N·m_s on one spring k_s/N, and its natural period grows with N (T ≈ 0.1·N s, the rule of thumb).
// Optional base isolation is a second spring (the bearings) in series; optional TMD is a tuned second mass.

export const STORY_MASS = 600; // t per story: a 25 m × 25 m floor at about 1 t/m²
export const T_PER_STORY = 0.1; // s per story: T ≈ 0.1·N (FEMA 454, ch. 4)
export const STORY_K = STORY_MASS * 1000 * Math.pow((2 * Math.PI) / T_PER_STORY, 2); // N/m, so that T = 0.1·N exactly
export const T_BEARING = 2.5; // s: the isolation layer alone under a rigid building (about 2–3 s in practice)
export const ZETA_BEARING = 0.15; // lead-rubber bearings: about 15 % effective damping
export const MU = 0.02; // TMD mass ÷ building mass
export const RANGE = { N: [3, 15], f: [0.2, 5], zeta: [2, 20] };
export const A_SCALE = 0.005; // drawing: frame drift at the roof = 0.5 % of the height per unit of H

const c = (re, im = 0) => ({ re, im });
const add = (a, b) => c(a.re + b.re, a.im + b.im);
const sub = (a, b) => c(a.re - b.re, a.im - b.im);
const mul = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a, b) => {
  const d = b.re * b.re + b.im * b.im;
  return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
export const abs = (a) => Math.hypot(a.re, a.im);

/** The system for N stories, damping ratio zeta (0..1), isolation and TMD switches. */
export function systemOf({ N, zeta, iso, tmd }) {
  const m = N * STORY_MASS; // t
  const k = STORY_K / N; // N/m
  const Ts = 2 * Math.PI * Math.sqrt((m * 1000) / k); // = 0.1·N s
  const fs = 1 / Ts;
  const Tb = iso ? T_BEARING : 0;
  const T = Math.sqrt(Ts * Ts + Tb * Tb); // series springs, one mass: T² adds
  const fn = 1 / T;
  const shareB = (Tb * Tb) / (T * T); // share of the deformation taken by the bearings
  const shareS = 1 - shareB; // share taken by the frame
  const zs = iso ? zeta * shareS + ZETA_BEARING * shareB : zeta; // strain-energy weighted damping
  const q = 1 / (1 + MU); // Den Hartog: f_d = f_n / (1 + μ)
  const zd = Math.sqrt((3 * MU) / (8 * Math.pow(1 + MU, 3)));
  return { N, zeta, iso, tmd, m, k, Ts, fs, Tb, T, fn, shareB, shareS, zs, md: MU * m, q, fd: fn * q, zd };
}

/** Steady response to a ground shake at f Hz: X (frame drift ÷ static drift, complex) and the TMD's stroke. */
export function responseOf(sys, f) {
  const r = f / sys.fn;
  const bare = 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * sys.zs * r, 2));
  let X;
  let rel = c(0);
  if (!sys.tmd) X = div(c(1), c(1 - r * r, 2 * sys.zs * r));
  else {
    // dimensionless 2-DOF: main k = m = ω_n = 1, TMD mass μ tuned to q·ω_n with damping ratio zd
    const kd = MU * sys.q * sys.q;
    const cd = 2 * sys.zd * MU * sys.q;
    const link = c(kd, r * cd);
    const own = c(kd - MU * r * r, r * cd);
    const main = c(1 + kd - r * r, r * (2 * sys.zs + cd));
    X = div(c(1), sub(main, div(mul(link, link), own)));
    rel = sub(mul(div(link, own), X), X);
  }
  return { r, X, H: abs(X), bare, rel, R: abs(rel) };
}

/** The amplification curve on a log frequency axis, for the chart. */
export function curveOf(sys, count = 360) {
  const [f0, f1] = RANGE.f;
  return Array.from({ length: count + 1 }, (_, i) => {
    const f = f0 * Math.pow(f1 / f0, i / count);
    return [f, responseOf(sys, f).H];
  });
}

export const fmt = {
  hz: (f) => `${f.toFixed(2)} Hz`,
  hz3: (f) => `${f < 1 ? f.toFixed(3) : f.toFixed(2)} Hz`,
  s: (t) => `${t.toFixed(2)} s`,
  H: (h) => (h >= 10 ? h.toFixed(1) : h >= 1 ? h.toFixed(2) : h.toFixed(3)),
  pct: (z) => `${(z * 100).toFixed(z < 0.1 ? 1 : 0)} %`,
  t: (m) => `${Math.round(m).toLocaleString("en-US")} t`,
  MN: (k) => `${Math.round(k / 1e6).toLocaleString("en-US")} MN/m`,
};
