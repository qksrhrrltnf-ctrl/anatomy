// The coin's physics, one source for the build (first-paint caption) and the page (inlined by toString()).
// World unit = 5 mm (a 24.26 mm quarter is 2 × 2.426 units across); GRAV 1962 units/s² = 9.81 m/s².
export function makeModel(M) {
  const GRAV = 1962;
  const MM = 5;
  const R = M.coinR;
  const ANGLE = Math.atan(M.chute.slope);
  const SN = Math.sin(ANGLE);
  const CS = Math.cos(ANGLE);
  const chuteZ = (y) => M.chute.z0 - M.chute.slope * (M.chute.y0 - y);
  const ROLL_FROM = M.mech.y0;
  const ROLL_LEN = (ROLL_FROM - M.chute.y1) / CS;
  const FLOOR = M.box.z0 + 0.7 + M.coinT / 2;
  const EDGE_Z = FLOOR + R;
  const END = [M.slotX, M.chute.y1 - R * SN, chuteZ(M.chute.y1) + R * CS];
  const BACK = M.box.y0 + 0.7 + R + 0.3; // nearest the coin's centre can land to the cash box's back wall
  const SWITCH_S = (ROLL_FROM - (M.wireY + R * SN)) / CS; // roll distance when the coin's edge reaches the wire
  const BETA = { roll: 0.5, slide: 0 }; // I / (m R²): a uniform disc rolls with ½, a frictionless slide has 0

  function kin(gScale = 1, motion = "roll") {
    const g = GRAV * gScale;
    const beta = BETA[motion] ?? 0.5;
    const a = (g * SN) / (1 + beta);
    const T = Math.sqrt((2 * ROLL_LEN) / a);
    const v = a * T;
    const drop = END[2] - EDGE_Z;
    const td = (-v * SN + Math.sqrt((v * SN) ** 2 + 2 * g * drop)) / g;
    const tf = Math.sqrt((2 * drop) / g);
    const reach = v * CS * td;
    const landY = END[1] - reach;
    const vImpact = Math.hypot(v * CS, v * SN + g * td);
    return { g, beta, a, T, v, td, tf, reach, landY, wallHit: landY < BACK, tSwitch: Math.sqrt((2 * SWITCH_S) / a), vImpact, roll: beta > 0 };
  }
  // calculation only: the same roll length on another slope (the drawing stays at its built angle)
  function onSlope(deg, gScale = 1, motion = "roll") {
    const rad = (deg * Math.PI) / 180;
    const g = GRAV * gScale;
    const a = (g * Math.sin(rad)) / (1 + (BETA[motion] ?? 0.5));
    const T = Math.sqrt((2 * ROLL_LEN) / a);
    return { a, T, v: a * T, mu: Math.tan(rad) / 3 };
  }
  // units → SI for the text
  const ms2 = (u) => (u * MM) / 1000;
  const m = (u) => (u * MM) / 1000;
  const cm = (u) => (u * MM) / 10;
  return {
    GRAV, MM, SN, CS, ANGLE_DEG: (ANGLE * 180) / Math.PI, ROLL_FROM, ROLL_LEN, FLOOR, EDGE_Z, END, BACK, chuteZ, kin, onSlope, ms2, m, cm,
    DROP: END[2] - EDGE_Z,
    WALL: END[1] - BACK,
  };
}
