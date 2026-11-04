// The Raptor's throttle model and its Korean number text. One source for both sides:
// build.mjs evaluates it for the first paint, live.js inlines it for the runtime (values() for the edu-kit).
function raptorModel(M) {
  const g = 9.80665;
  // Atmosphere pushing on the nozzle exit, in tf: the original figure's BACK_TF, same formula.
  const backTf = (101325 * Math.PI * (M.exitM / 2) ** 2) / (g * 1000);
  const vacTf = M.seaLevelTf + backTf;
  const mdot0 = (M.seaLevelTf * 1000) / M.ispSl; // kg/s at 100 %: thrust in kgf over sea-level Isp
  const dryT = M.dryKg / 1000;
  const num = (value, digits = 0) => Number(value).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const minus = (value) => String(value).replace("-", "−");
  const q = (n, t) => ({ n, t });

  // thr: throttle in % of rated chamber pressure
  function at(thr) {
    const pc = thr / 100;
    const Pc = M.chamberBar * pc;
    const F = Math.max(0, vacTf * pc - backTf); // tf, sea level
    const mdot = mdot0 * pc; // a choked throat: flow follows chamber pressure
    const mox = (mdot * M.mix) / (M.mix + 1);
    return { pc, Pc, F, FkN: F * g, mdot, mox, mch4: mdot - mox, isp: (F * 1000) / mdot, twr: F / dryT };
  }

  // s: { thr, load, phase, strip, stripLast }
  function values(s) {
    const m = at(s.thr);
    const load = s.load ? m.F : 0;
    return {
      thr: q(s.thr, `${num(s.thr)} %`),
      Pc: q(m.Pc, `${num(m.Pc)} bar`),
      F: q(m.F, `${num(m.F)} tf`),
      FkN: q(m.FkN, `${num(m.FkN)} kN`),
      mdot: q(m.mdot, `${num(m.mdot)} kg/s`),
      mox: q(m.mox, `${num(m.mox)} kg/s`),
      mch4: q(m.mch4, `${num(m.mch4)} kg/s`),
      isp: q(m.isp, `${num(m.isp)} s`),
      twr: q(m.twr, `${num(m.twr)}배`),
      load: q(load, `${num(load)} tf`),
      Pcpre: q(M.chamberBar * M.preburnerPc, `${num(M.chamberBar * M.preburnerPc)} bar`),
      phase: q(NaN, s.phase || "정지"),
      strip: q(s.strip || 0, `${num(s.strip || 0)}개`),
      stripLast: q(NaN, s.stripLast || "없음"),
      // reference values (rated, from the original figure; mdot0 from the sea-level Isp, see the footer)
      Pc0: q(M.chamberBar, `${num(M.chamberBar)} bar`),
      F0: q(M.seaLevelTf, `${num(M.seaLevelTf)} tf`),
      vac: q(vacTf, `${num(vacTf, 1)} tf`),
      back: q(backTf, `${num(backTf, 1)} tf`),
      mdot0: q(mdot0, `${num(mdot0)} kg/s`),
      dry: q(M.dryKg, `${num(M.dryKg)} kg`),
      dryT: q(dryT, `${num(dryT, 2)} t`),
      exit: q(M.exitM, `${num(M.exitM, 1)} m`),
      mix: q(M.mix, `${num(M.mix, 1)} : 1`),
      oxShare: q((M.mix / (M.mix + 1)) * 100, `${num((M.mix / (M.mix + 1)) * 100)} %`),
      tLox: q(M.tLox, `${minus(num(M.tLox))} °C`),
      tCh4: q(M.tCh4, `${minus(num(M.tCh4))} °C`),
      cables: q(M.cables, `${num(M.cables)}가닥`),
      senses: q(M.senses, `${num(M.senses)}개`),
      others: q(M.others, `${num(M.others)}개`),
      lines: q(M.senses + M.others, `${num(M.senses + M.others)}개`),
    };
  }
  return { at, values, backTf, vacTf, mdot0, num };
}
