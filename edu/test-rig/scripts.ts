// One-shot hand scripts for steps, questions and the "당겼다 놓기" button (live.tsx plays them).
import type { Hand, Script } from "./live";
import { PROBE_HOME } from "./view";

const H = PROBE_HOME;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const ease = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const RAMP = 0.6;

/** Let go and bring the finger home. */
export const restScript: Script = (t, start) => {
  if (t < 0.5) return { held: false, grab: H, finger: start.finger };
  if (t < 1.1) return { held: false, grab: H, finger: start.finger + (H - start.finger) * ease((t - 0.5) / 0.6) };
  return t < 1.2 ? { held: false, grab: H, finger: H } : null;
};

/** Press at home and hold. */
export const pressScript: Script = (t, start) => {
  if (!start.held && Math.abs(start.finger - H) > 0.5 && t < 0.4) return { held: false, grab: H, finger: H };
  return t < 0.5 ? { held: true, grab: H, finger: H } : null;
};

/** Press (if not pressed) and pull `d` px to the left, then hold. */
function pulling(d: number, t: number, start: Hand): { hand: Hand; done: number } {
  const from = start.held ? start.finger - H : 0;
  const lead = start.held ? 0 : 0.25;
  const hand = { held: true, grab: H, finger: H + from + (-d - from) * ease((t - lead) / RAMP) };
  return { hand, done: lead + RAMP };
}

export const pullScript = (d: number): Script => (t, start) => {
  const { hand, done } = pulling(d, t, start);
  return t < done + 0.1 ? hand : null;
};

/** Pull `d` px (unless already there), hold a moment, let go, wait, bring the finger home. */
export const releaseScript = (d: number): Script => (t, start) => {
  const ready = start.held && Math.abs(start.finger - H + d) < 1;
  const { hand, done } = pulling(d, t, start);
  const letGo = ready ? 0.3 : done + 0.45;
  if (t < letGo) return ready ? { held: true, grab: H, finger: H - d } : hand;
  const away = H - d;
  if (t < letGo + 0.9) return { held: false, grab: H, finger: away };
  if (t < letGo + 1.6) return { held: false, grab: H, finger: away + (H - away) * ease((t - letGo - 0.9) / 0.6) };
  return t < letGo + 1.7 ? { held: false, grab: H, finger: H } : null;
};
