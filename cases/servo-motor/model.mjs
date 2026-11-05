// Servo model: one source for the figure, the readout, the formulas, the chart and the Korean text.
// Pure functions, no imports: build.mjs imports it, and the page inlines it with `export` stripped.
// Units: angles in degrees at the interface, SI inside (rad, s, N·m, V, kg, m).

export const SERVO = {
  supply: 6.0, // V, the servo's supply (about 4.8–7.2 V for an MG996R-class servo)
  ke: 0.00441, // V·s/rad = N·m/A, motor constant (no-load about 13,000 rpm at 6 V)
  ra: 3.0, // Ω, armature resistance (stall current about 2 A)
  jm: 5e-7, // kg·m², rotor and first gear (chosen so the motion is easy to follow)
  eta: 0.7, // gear train efficiency
  bf: 0.002, // N·m·s/rad, viscous friction at the output
  jl: 2e-5, // kg·m², horn, pointer and drum
  drum: 0.005, // m, drum radius (the cord winds on it)
  g: 9.81,
  pulse: [1.0, 2.0], // ms that map to 0° and 180°
  span: 180,
  stops: [-6, 186], // mechanical end stops, degrees
  frame: 20, // ms, PWM period (50 Hz)
};

// Gear sets: four stages, each a 10-tooth pinion driving a bigger gear. The drawn tooth counts are these.
export const GEARSETS = {
  fast: { label: "빠른 기어", teeth: [32, 31, 32, 31] },
  std: { label: "표준 기어", teeth: [38, 37, 38, 38] },
  strong: { label: "강한 기어", teeth: [45, 45, 44, 45] },
};
export const PINION = 10;
export const ratioOf = (set) => GEARSETS[set].teeth.reduce((n, z) => (n * z) / PINION, 1);

const RAD = Math.PI / 180;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** PWM pulse width (ms) → commanded angle (deg). */
export const angleOf = (ms) => ((clamp(ms, SERVO.pulse[0], SERVO.pulse[1]) - SERVO.pulse[0]) / (SERVO.pulse[1] - SERVO.pulse[0])) * SERVO.span;
export const pulseOf = (deg) => SERVO.pulse[0] + (deg / SERVO.span) * (SERVO.pulse[1] - SERVO.pulse[0]);

/** Everything that follows from the settings: gains, inertia, limits. kp in V/°, load in kg. */
export function plant({ kp, gear, load }) {
  const S = SERVO;
  const N = ratioOf(gear);
  const G = (N * S.eta * S.ke) / S.ra; // N·m of output torque per volt
  const b = (N * N * S.eta * S.ke * S.ke) / S.ra + S.bf; // back-EMF damping at the output
  const J = S.jm * N * N + S.jl + load * S.drum * S.drum;
  const tauL = load * S.g * S.drum; // N·m, the weight on the drum
  const kRad = kp / RAD; // V/rad
  const stall = G * S.supply; // N·m with the full supply across a stopped motor
  const wMax = (G * S.supply) / b; // rad/s, no load
  const wn = Math.sqrt((G * kRad) / J);
  const zeta = b / (2 * Math.sqrt(G * kRad * J));
  // Steady-state error under a constant load: the motor must keep pushing τL, so V = τL / G = kp·e.
  const vHold = tauL / G;
  const ess = vHold / kp; // degrees (if it fits under the supply)
  return { N, G, b, J, tauL, kRad, stall, wMax, wn, zeta, vHold, ess, overload: tauL >= stall };
}

/** One integration step of the closed loop. state: { th (deg), w (deg/s) }; hand: optional { at (deg), k (N·m/rad) }. */
export function step(state, target, p, dt, hand = null) {
  const S = SERVO;
  const n = Math.max(1, Math.ceil(dt / 0.0005));
  const h = dt / n;
  let { th, w } = state;
  let volts = 0;
  let tauHand = 0;
  for (let i = 0; i < n; i++) {
    const e = target - th;
    volts = clamp(p.kRad * e * RAD, -S.supply, S.supply);
    tauHand = hand ? hand.k * (hand.at - th) * RAD - hand.c * w * RAD : 0;
    const torque = p.G * volts - p.b * w * RAD - p.tauL + tauHand;
    w += ((torque / p.J) / RAD) * h;
    th += w * h;
    if (th < S.stops[0]) { th = S.stops[0]; if (w < 0) w = 0; }
    if (th > S.stops[1]) { th = S.stops[1]; if (w > 0) w = 0; }
  }
  return { th, w, volts, tauHand, motorTorque: p.G * volts - p.b * w * RAD };
}

/** The settled angle for a target: the loop holds where kp·e·G = τL (or stalls against the supply). */
export function settled(target, p) {
  const S = SERVO;
  if (p.overload) return S.stops[0];
  const e = Math.min(p.ess, (S.supply / p.kRad) / RAD);
  return clamp(target - e, S.stops[0], S.stops[1]);
}

/** Simulates a step from `from` to `to` (deg) and measures it. Same step() the figure runs. */
export function response(from, to, p, { seconds = 2, dt = 1 / 240 } = {}) {
  let state = { th: from, w: 0 };
  const points = [from];
  let peak = from;
  for (let t = dt; t <= seconds + 1e-9; t += dt) {
    state = step(state, to, p, dt);
    points.push(state.th);
    peak = to >= from ? Math.max(peak, state.th) : Math.min(peak, state.th);
  }
  const final = settled(to, p);
  const travel = Math.abs(final - from) || 1;
  const over = Math.max(0, (to >= from ? peak - final : final - peak));
  const band = Math.max(1, 0.02 * Math.abs(to - from));
  let settle = 0;
  for (let i = points.length - 1; i >= 0; i--) {
    if (Math.abs(points[i] - final) > band) { settle = (i + 1) * dt; break; }
  }
  return { points, dt, peak, over, overPct: (over / travel) * 100, settle, final, ess: to - final };
}

// Text helpers (Korean page): numbers with their units, one decimal where it matters.
export const fmt = {
  deg: (v) => (Math.abs(v) < 0.05 ? "0.0°" : `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}°`),
  deg0: (v) => `${Math.round(v) < 0 ? "−" : ""}${Math.abs(Math.round(v))}°`,
  ms: (v) => `${v.toFixed(2)} ms`,
  v: (v) => (Math.abs(v) < 0.005 ? "0.00 V" : `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)} V`),
  nm: (v) => `${v.toFixed(2)} N·m`,
  kgcm: (v) => `${(v / 0.0981).toFixed(1)} kgf·cm`,
  kg: (v) => `${+v.toFixed(2)} kg`,
  kp: (v) => `${v.toFixed(2)} V/°`,
  dps: (v) => `${Math.round(v)}°/s`,
  s60: (v) => `${(60 / v).toFixed(2)} s/60°`,
  ratio: (v) => `1:${Math.round(v)}`,
  pct: (v) => `${Math.round(v)}%`,
  sec: (v) => `${v.toFixed(2)}초`,
};
