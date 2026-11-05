// The wind turbine's one model: the build (first paint) and the page (every change) both run this file.
// A generic 2 MW class turbine, rotor diameter 90 m (reference values in 보고서.md).
const WT = (() => {
  const RHO = 1.225; // air density at sea level, 15 °C (kg/m³)
  const D = 90; // rotor diameter (m)
  const RADIUS = D / 2;
  const AREA = Math.PI * RADIUS * RADIUS; // swept area (m²)
  const RATED = 2.0e6; // rated electrical power (W)
  const CUT_IN = 3.5; // m/s
  const CUT_OUT = 25; // m/s
  const BETZ = 16 / 27; // 0.593: no rotor can take more than this share of the wind's power
  const TSR = 8; // tip-speed ratio held below rated speed
  const GEAR = 100; // gearbox step-up, 1 : 100
  const PITCH_MAX = 28; // pitch (°) the curve reaches near cut-out
  const FEATHER = 90; // parked: blades edge-on to the wind
  const windPower = (v) => 0.5 * RHO * AREA * v * v * v; // W carried through the rotor disc
  const vRatedOf = (cp) => Math.cbrt(RATED / (0.5 * RHO * AREA * cp));

  function model({ v = 8, cp = 0.44 } = {}) {
    const Cp = Math.min(cp, BETZ);
    const pw = windPower(v);
    const vRated = vRatedOf(Cp);
    const nRated = (TSR * vRated) / (2 * Math.PI * RADIUS) * 60; // rotor rpm at rated
    let region, P, pitch, rpm, cpNow;
    if (v < CUT_IN) {
      region = "idle"; P = 0; pitch = 0; cpNow = 0;
      rpm = v < 1 ? 0 : (TSR * 0.25 * v) / (2 * Math.PI * RADIUS) * 60; // freewheels slowly, not connected
    } else if (v <= vRated) {
      region = "partial"; cpNow = Cp; P = pw * Cp; pitch = 0;
      rpm = (TSR * v) / (2 * Math.PI * RADIUS) * 60;
    } else if (v <= CUT_OUT) {
      region = "rated"; P = RATED; cpNow = RATED / pw; rpm = nRated;
      // pitch needed to spill the extra power: a fitted rule of thumb, 0° at rated speed, about 25° at cut-out
      pitch = PITCH_MAX * Math.pow(1 - cpNow / Cp, 1.5);
    } else {
      region = "storm"; P = 0; cpNow = 0; pitch = FEATHER; rpm = 0;
    }
    const omega = (rpm * 2 * Math.PI) / 60;
    return {
      v, cp: Cp, pw, P, betzP: pw * BETZ, cpNow, region, pitch, rpm, genRpm: rpm * GEAR,
      torque: omega > 0 ? P / omega : 0, genTorque: omega > 0 ? P / (omega * GEAR) : 0,
      vRated, nRated, tipSpeed: omega * RADIUS,
      RHO, D, RADIUS, AREA, RATED, CUT_IN, CUT_OUT, BETZ, TSR, GEAR,
    };
  }
  const fmt = {
    v: (x) => (Math.round(x * 10) / 10).toFixed(1) + " m/s",
    MW: (w) => (w / 1e6).toFixed(2) + " MW",
    kW: (w) => Math.round(w / 1000).toLocaleString("en-US") + " kW",
    rpm: (n) => (n < 100 ? n.toFixed(1) : Math.round(n).toLocaleString("en-US")) + " rpm",
    deg: (x) => Math.round(x) + "°",
    cp: (x) => x.toFixed(3),
  };
  return { model, fmt, windPower, vRatedOf, RHO, D, RADIUS, AREA, RATED, CUT_IN, CUT_OUT, BETZ, TSR, GEAR };
})();
