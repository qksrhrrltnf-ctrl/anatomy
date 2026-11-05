// The heat pump's one model: the build (first paint, engraved numbers) and the page (every change) both run this file.
// Plain script, no imports: build.mjs evaluates it with new Function, the page inlines it.
const HP = (() => {
  const K = 273.15;
  // Real air-source heat pumps reach about 40–50 % of the Carnot COP between their refrigerant temperatures;
  // the model takes 45 % (the "realistic fraction"). Sources in 보고서.md.
  const ETA = 0.45;
  // Refrigerant runs hotter than the warm air it heats and colder than the cold air it draws from:
  // condensing about 15 K above the hot-side air, evaporating about 10 K below the cold-side air.
  const COND_UP = 15;
  const EVAP_DOWN = 10;
  // The compressor never lifts less than this (a real unit idles or cycles off below it).
  const LIFT_MIN = 20;
  // R-32 saturation pressure, Clausius–Clapeyron fit through 0 °C (0.813 MPa) and 40 °C (2.478 MPa) absolute.
  const P0 = 0.8131;
  const P40 = 2.4783;
  const B = Math.log(P40 / P0) / (1 / K - 1 / (K + 40));
  const A = Math.log(P0) + B / K;
  const ATM = 0.1013;
  const psat = (celsius) => Math.exp(A - B / (celsius + K)); // MPa absolute
  const gauge = (celsius) => psat(celsius) - ATM; // MPa on a gauge

  function model({ mode = "heat", Tin = 20, Tout = 7, W = 1 } = {}) {
    const heat = mode === "heat";
    const hotAir = heat ? Tin : Tout; // the side that receives heat (condenser coil)
    const coldAir = heat ? Tout : Tin; // the side heat is taken from (evaporator coil)
    const dAir = hotAir - coldAir;
    let Tcond = hotAir + COND_UP;
    let Tevap = coldAir - EVAP_DOWN;
    const clamped = Tcond - Tevap < LIFT_MIN;
    if (clamped) Tcond = Tevap + LIFT_MIN;
    const lift = Tcond - Tevap;
    // Ideal (Carnot) COP between the two air temperatures: the upper limit no machine can pass.
    const idealAir = dAir > 0 ? (heat ? hotAir + K : coldAir + K) / dAir : Infinity;
    // Ideal COP between the refrigerant temperatures, and the realistic estimate from it.
    const idealRef = (heat ? Tcond + K : Tevap + K) / lift;
    const cop = ETA * idealRef;
    const useful = cop * W; // heat delivered (heating) or removed (cooling), kW
    const Qhot = heat ? useful : useful + W; // heat given off by the condenser
    const Qcold = heat ? useful - W : useful; // heat taken in by the evaporator
    return {
      mode, heat, Tin, Tout, W, hotAir, coldAir, dAir, Tcond, Tevap, lift, clamped,
      idealAir, idealRef, cop, useful, Qhot, Qcold,
      pHigh: gauge(Tcond), pLow: gauge(Tevap), ratio: psat(Tcond) / psat(Tevap),
      ETA, COND_UP, EVAP_DOWN, LIFT_MIN, K,
    };
  }
  const n1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
  const n2 = (x) => x.toFixed(2);
  const signed = (x) => (x < 0 ? "−" + Math.abs(Math.round(x)) : String(Math.round(x)));
  const fmt = {
    C: (x) => signed(x) + " °C",
    K: (x) => (Math.round((x) * 10) / 10).toFixed(1) + " K",
    kW: (x) => n2(x) + " kW",
    MPa: (x) => n2(x) + " MPa",
    cop: (x) => (Number.isFinite(x) ? (x >= 10 ? n1(x) : n2(x)) : "한계 없음"),
  };
  return { model, fmt, psat, gauge, ETA, COND_UP, EVAP_DOWN, LIFT_MIN, K };
})();
