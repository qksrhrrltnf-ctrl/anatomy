// Fiber-optic link: the one model behind the drawing, the readout, the panel and the Korean text.
// Pure functions only, so the page can inline this file and the build can import it.
export const MODEL = {
  n1: 1.48, // core index (step-index fibre)
  n2: 1.46, // cladding index (default)
  theta0: 12, // launch half-angle in air, degrees (default)
  L: 20, // link length on the spool, km (default)
  bend: 1, // mandrel step index (default): 0..3
  BENDS_MM: [15, 10, 7.5, 5], // bend radius of the fibre axis on each mandrel step, mm
  alpha: 0.2, // fibre attenuation, dB/km (single-mode, 1550 nm)
  Ptx: 0, // launched power at the laser, dBm (1 mW)
  conn: 0.5, // loss per mated connector pair, dB
  pairs: 4, // TX→cord 1, cord 1→spool, spool→cord 2, cord 2→RX
  sens: -25, // receiver sensitivity at BER 1e-12, dBm
  Qs: 7.03, // Q at the sensitivity (BER 1e-12)
  ng: 1.468, // group index: 4.9 µs per km
  bendA: 142, // bend loss per full turn: bendA · exp(−bendB · R), dB (R in mm, G.652 at 1550 nm, approximate)
  bendB: 0.53,
};

const RAD = Math.PI / 180;
export const deg = (r) => r / RAD;

/** Critical angle at the core–cladding boundary, measured from the normal (degrees). */
export const critical = (n1, n2) => Math.asin(Math.min(1, n2 / n1)) / RAD;
/** Numerical aperture and the acceptance half-angle in air (degrees). */
export const numAp = (n1, n2) => Math.sqrt(Math.max(0, n1 * n1 - n2 * n2));
export const acceptance = (n1, n2) => Math.asin(Math.min(1, numAp(n1, n2))) / RAD;
/** A ray launched at theta0 (air, from the axis) travels at theta1 in the core and meets the boundary at phi from the normal. */
export function launch(n1, n2, theta0) {
  const theta1 = Math.asin(Math.sin(theta0 * RAD) / n1) / RAD;
  const phi = 90 - theta1;
  const thc = critical(n1, n2);
  return { theta1, phi, thc, tir: phi >= thc - 1e-9 };
}
/** Unpolarised Fresnel reflectance at the core–cladding boundary for incidence phi (degrees from the normal). */
export function reflectance(n1, n2, phi) {
  const ci = Math.cos(phi * RAD);
  const st = (n1 / n2) * Math.sin(phi * RAD);
  if (st >= 1) return 1;
  const ct = Math.sqrt(1 - st * st);
  const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct);
  const rp = (n1 * ct - n2 * ci) / (n1 * ct + n2 * ci);
  return (rs * rs + rp * rp) / 2;
}
/** Refraction angle into the cladding (degrees from the normal), or null under total internal reflection. */
export function refracted(n1, n2, phi) {
  const st = (n1 / n2) * Math.sin(phi * RAD);
  return st >= 1 ? null : Math.asin(st) / RAD;
}
/** Fraction of a uniformly filled launch cone of half-angle theta0 that the fibre accepts (étendue ratio). */
export function coupled(n1, n2, theta0) {
  const na = numAp(n1, n2);
  const s = Math.sin(theta0 * RAD);
  return s <= na ? 1 : (na / s) ** 2;
}
/** Bend loss for one pass round the mandrel: per-turn loss times the wrap (degrees). */
export const bendPerTurn = (Rmm, m = MODEL) => m.bendA * Math.exp(-m.bendB * Rmm);
export const bendLoss = (Rmm, wrapDeg, m = MODEL) => bendPerTurn(Rmm, m) * (wrapDeg / 360);

export const dbm = (mw) => 10 * Math.log10(mw);
export const mw = (dBm) => 10 ** (dBm / 10);

/** The whole link budget. s: { n2, theta0, L, bend }, wraps: degrees of wrap on each mandrel step. */
export function budget(s, wraps, m = MODEL) {
  const ray = launch(m.n1, s.n2, s.theta0);
  const fc = coupled(m.n1, s.n2, s.theta0);
  const launchLoss = -10 * Math.log10(fc);
  const fibre = m.alpha * s.L;
  const conn = m.conn * m.pairs;
  const Rmm = m.BENDS_MM[s.bend];
  const wrap = wraps[s.bend];
  const bend = bendLoss(Rmm, wrap, m);
  const total = launchLoss + fibre + conn + bend;
  const Prx = m.Ptx - total;
  const margin = Prx - m.sens;
  const Q = m.Qs * 10 ** (margin / 10);
  const ber = 0.5 * erfc(Q / Math.SQRT2);
  const delay = s.L * m.ng / 299792.458 * 1e6; // µs
  return { ...ray, na: numAp(m.n1, s.n2), acc: acceptance(m.n1, s.n2), fc, launchLoss, fibre, conn, Rmm, wrap, bend, bendTurn: bendPerTurn(Rmm, m), total, Prx, margin, Q, ber, delay, bendLeak: 1 - 10 ** (-bend / 10) };
}

/** Complementary error function (Abramowitz–Stegun 7.1.26, |error| < 1.5e-7). */
export function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-z * z);
  return x >= 0 ? y : 2 - y;
}

/** ASCII bits of a message, 8 per character, most significant bit first. */
export function bitsOf(text) {
  const out = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0) & 0x7f;
    for (let i = 7; i >= 0; i--) out.push((code >> i) & 1);
  }
  return out;
}
/** Deterministic bit errors: bit i flips when a hash of (i, salt) falls under the BER. */
export function hash01(i, salt) {
  let h = (i * 374761393 + salt * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function receive(bits, ber, salt) {
  return bits.map((b, i) => (hash01(i, salt) < ber ? 1 - b : b));
}
export function decode(bits) {
  let text = "";
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let code = 0;
    for (let j = 0; j < 8; j++) code = (code << 1) | bits[i + j];
    text += code >= 32 && code < 127 ? String.fromCharCode(code) : "?";
  }
  return text;
}
