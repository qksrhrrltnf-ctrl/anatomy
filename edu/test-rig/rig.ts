export type Pair = [number, number];
export type Tuning = readonly [number, number];

export interface Spring {
  at: number;
  rate: number;
}

export interface Member {
  swell: Spring;
  lean: Spring;
}

export interface Pose {
  mid: number;
  half: Pair;
  lean: number;
  press: number;
}

export const HALF: Pair = [60, 16];
export const SWELL = 0.08;
export const SWELL_MOST = 6;
export const SWELL_FLOOR = -0.25;
export const RUBBER = 0.55;
const STRETCH = 0.35;
export const STRETCH_MOST = 0.08;
const THIN = 0.5;
const SOFT = 1;
export const GIVE = 14;
export const REACH = 0.15;
export const GIVE_MOST = 0.25;
const QUIET = 0.0005;
// Teaching fork: 960 Hz (was 240 Hz) so the first overshoot lands within 0.1 px of the closed-form value.
const SUB_RATE = 960;
export const FRAME = 1 / 60;

export const PRESS_SPRING: Tuning = [700, 32];
export const HOLD_SPRING: Tuning = [540, 40];
export const RELEASE_SPRING: Tuning = [320, 16];

const LONGEST = Math.max(HALF[0], HALF[1]);
export const SHARE = Math.min(SWELL, SWELL_MOST / LONGEST);
export const GIVEN = Math.min(GIVE, REACH * 2 * LONGEST);
export const ACROSS = (GIVEN * HALF[1]) / LONGEST;

export const zeta = ([stiff, drag]: Tuning) => drag / (2 * Math.sqrt(stiff));

/** The three spring tunings step() uses. The teaching fork swaps in its own release spring. */
export interface Tune {
  press: Tuning;
  hold: Tuning;
  release: Tuning;
}

export const BASE_TUNE: Tune = { press: PRESS_SPRING, hold: HOLD_SPRING, release: RELEASE_SPRING };

/** A release spring from stiffness k and damping ratio z (mass 1): c = 2 z sqrt(k). */
export const releaseOf = (k: number, z: number): Tuning => [k, 2 * z * Math.sqrt(k)];
export const tuneOf = (k: number, z: number): Tune => ({ ...BASE_TUNE, release: releaseOf(k, z) });

function spring(held: Spring, want: number, dt: number, [stiff, drag]: Tuning, calm: boolean) {
  const damping = calm ? 2 * Math.sqrt(stiff) : drag;
  const steps = Math.max(Math.ceil(dt * SUB_RATE - 1e-9), 1);
  const slice = dt / steps;
  for (let step = 0; step < steps; step++) {
    held.rate += (want - held.at) * stiff * slice - held.rate * damping * slice;
    held.at += held.rate * slice;
  }
  if (Math.abs(want - held.at) < QUIET && Math.abs(held.rate) < QUIET) {
    held.at = want;
    held.rate = 0;
  }
}

export function rubberBand(distance: number, limit: number) {
  return limit <= 0 ? 0 : limit * (1 - 1 / (1 + (RUBBER * distance) / limit));
}

const softened = (value: number) => Math.hypot(value, SOFT) - SOFT;

function stretched(lean: number, half: number, grow: number) {
  const most = STRETCH_MOST * grow * half;
  return most * Math.tanh((STRETCH * softened(lean)) / most);
}

export const grownOf = (member: Member) => 1 + SHARE * Math.max(member.swell.at, SWELL_FLOOR);

export const memberAt = (swell = 0, lean = 0): Member => ({ swell: { at: swell, rate: 0 }, lean: { at: lean, rate: 0 } });

export function step(member: Member, held: boolean, pull: number, dt: number, calm = false, tune: Tune = BASE_TUNE) {
  spring(member.swell, held ? 1 : 0, dt, held ? tune.press : tune.release, calm);
  const want = held && !calm ? Math.sign(pull) * rubberBand(Math.abs(pull), GIVEN) : 0;
  spring(member.lean, want, dt, held ? tune.hold : tune.release, calm);
}

export function poseOf(member: Member): Pose {
  const grow = grownOf(member);
  const lean = member.lean.at;
  const stretch = stretched(lean, HALF[0], grow);
  const ratio = 1 + stretch / (grow * HALF[0]);
  return {
    mid: lean - Math.sign(lean) * stretch,
    half: [grow * HALF[0] * ratio, grow * HALF[1] * Math.pow(ratio, -THIN)],
    lean,
    press: Math.min(Math.max(member.swell.at, 0), 1.2),
  };
}

export const carried = (pose: Pose, x: number) => pose.mid + (pose.half[0] / HALF[0]) * x;

export const settled = (member: Member, held: boolean, pull: number) =>
  member.swell.rate === 0 && member.lean.rate === 0 && member.swell.at === (held ? 1 : 0) && (held || member.lean.at === 0) && (held || pull === 0);

export const one = (value: number) => {
  const text = (Math.round(value * 10) / 10).toFixed(1);
  return text === "-0.0" ? "0.0" : text;
};

export const two = (value: number) => (Math.round(value * 100) / 100).toFixed(2);

export const sizeText = (pose: Pose) => `${one(pose.half[0] * 2)} × ${one(pose.half[1] * 2)}`;

export function steady(pull: number) {
  const member = memberAt();
  for (let frame = 0; frame < 360; frame++) step(member, true, pull, FRAME);
  return poseOf(member);
}

function pressRun() {
  const member = memberAt();
  let peak = 0;
  let peakAt = 0;
  for (let frame = 1; frame <= 120; frame++) {
    step(member, true, 0, FRAME);
    const tall = poseOf(member).half[1] * 2;
    if (tall > peak) {
      peak = tall;
      peakAt = frame * FRAME;
    }
  }
  return { peak, peakAt };
}

export const STILL_ENOUGH = 0.1;

function releaseRun(pull: number) {
  const member = memberAt();
  for (let frame = 0; frame < 360; frame++) step(member, true, pull, FRAME);
  let swing = 0;
  let swingAt = 0;
  let dip = 0;
  let still = 0;
  for (let frame = 1; frame <= 300; frame++) {
    step(member, false, 0, FRAME);
    const lean = member.lean.at;
    if (-Math.sign(pull) * lean > swing) {
      swing = -Math.sign(pull) * lean;
      swingAt = frame * FRAME;
    }
    dip = Math.max(dip, (1 - grownOf(member)) * 100);
    const pose = poseOf(member);
    const edges = [pose.mid - pose.half[0], pose.mid + pose.half[0], -pose.half[1], pose.half[1]];
    const rest = [-HALF[0], HALF[0], -HALF[1], HALF[1]];
    const off = Math.max(...edges.map((edge, index) => Math.abs(edge - rest[index]!)));
    if (off > STILL_ENOUGH) still = (frame + 1) * FRAME;
  }
  return { swing, swingAt, dip, still };
}

export const DRAG = 80;
export const PULL_MOST = 110;
export const REST: Pose = { mid: 0, half: [HALF[0], HALF[1]], lean: 0, press: 0 };
export const PRESSED = steady(0);
export const PULLED = steady(-DRAG);
export const PULLED_MOST = steady(-PULL_MOST);
export const PRESS_RUN = pressRun();
export const RELEASE_RUN = releaseRun(-DRAG);
export const DIP_MOST = -SWELL_FLOOR * SHARE * 100;
export const SIDE_GROWTH = SHARE * HALF[0];

export function readoutOf(pose: Pose) {
  return `${sizeText(pose)} · lean ${one(Math.abs(pose.lean))} px`;
}

// ---------- teaching fork: release response, measured with the same step() ----------

/** The member held at a steady pull (pressed, leaning after the finger). */
export function steadyMember(pull: number, tune: Tune = BASE_TUNE): Member {
  const member = memberAt();
  for (let frame = 0; frame < 360; frame++) step(member, true, pull, FRAME, false, tune);
  member.swell.rate = 0;
  member.lean.rate = 0;
  return member;
}

/** Steady lean (px, signed) for a pull: the rubber band, x = L (1 - 1 / (1 + 0.55 d / L)). */
export const leanFor = (pull: number) => Math.sign(pull) * rubberBand(Math.abs(pull), GIVEN);

const FINE = 1 / SUB_RATE;

/** Lean after letting go from `from` px at rest, sampled every `every` s for `seconds`. */
export function releaseCurve(tune: Tune, from: number, seconds = 3, every = 1 / 60): number[] {
  const member = memberAt(1, from);
  const out = [from];
  const count = Math.round(seconds / every);
  for (let index = 1; index <= count; index++) {
    step(member, false, 0, every, false, tune);
    out.push(member.lean.at);
  }
  return out;
}

export interface ReleaseStats {
  /** first swing past rest, px (positive) */
  over: number;
  /** time of that swing, s */
  overAt: number;
  /** time after which the lean stays within STILL_ENOUGH (0.1 px), s */
  settle: number;
}

/** Release from `from` px, stepped one sub-step at a time, so the peak is caught exactly. */
export function releaseStats(tune: Tune, from: number, seconds = 8): ReleaseStats {
  const member = memberAt(1, from);
  const side = -Math.sign(from) || 1;
  let over = 0;
  let overAt = 0;
  let settle = 0;
  const count = Math.round(seconds / FINE);
  for (let index = 1; index <= count; index++) {
    step(member, false, 0, FINE, false, tune);
    const lean = member.lean.at;
    if (side * lean > over) {
      over = side * lean;
      overAt = index * FINE;
    }
    if (Math.abs(lean) > STILL_ENOUGH) settle = index * FINE;
  }
  return { over, overAt, settle };
}

export interface Theory {
  /** natural angular frequency, rad/s (mass 1) */
  w0: number;
  /** damped period, s (Infinity when zeta >= 1) */
  period: number;
  /** first overshoot from `from`, px */
  over: number;
}

export function theoryOf(k: number, z: number, from: number): Theory {
  const w0 = Math.sqrt(k);
  if (z >= 1) return { w0, period: Infinity, over: 0 };
  const wd = w0 * Math.sqrt(1 - z * z);
  return { w0, period: (2 * Math.PI) / wd, over: Math.abs(from) * Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z)) };
}
