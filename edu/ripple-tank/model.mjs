export const WATER = { depth: 0.006, gravity: 9.81, tension: 0.0728, density: 998, index: 1.333, viscosity: 1.0e-6 };
export const GLASS = 1.52;
export const RANGE = { frequency: [8, 28], spacing: [20, 80] };
export const BEAT = 0.75;
export const SLOPE = 0.03;
export const REACH = 24;

export function omegaOf(k) {
  const { depth, gravity, tension, density } = WATER;
  return Math.sqrt((gravity * k + (tension / density) * k * k * k) * Math.tanh(k * depth));
}

export function wavenumberOf(frequency) {
  const omega = 2 * Math.PI * frequency;
  let low = 1;
  let high = 20000;
  for (let step = 0; step < 60; step++) {
    const mid = (low + high) / 2;
    if (omegaOf(mid) < omega) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function waveOf(frequency) {
  const k = wavenumberOf(frequency);
  const lambda = (2 * Math.PI) / k;
  const speed = (2 * Math.PI * frequency) / k;
  const h = 1e-3 * k;
  const group = (omegaOf(k + h) - omegaOf(k - h)) / (2 * h);
  const { viscosity, depth } = WATER;
  const omega = 2 * Math.PI * frequency;
  const damping = 2 * viscosity * k * k + (k * Math.sqrt((viscosity * omega) / 2)) / Math.sinh(2 * k * depth);
  return { frequency, k, lambda, speed, group, damping, decay: damping / group };
}

export function nodalCount(spacing, lambda) {
  return 2 * Math.floor(spacing / lambda + 0.5);
}

export function nodalVertices(spacing, lambda) {
  const out = [];
  for (let m = 0; (m + 0.5) * lambda < spacing; m++) {
    out.push(((m + 0.5) * lambda) / 2, -((m + 0.5) * lambda) / 2);
  }
  return out.sort((a, b) => a - b);
}

export const magnificationOf = (zLamp, zPaper, zWater) => (zLamp - zPaper) / (zLamp - zWater);

export function causticOf(zLamp, zPaper, zWater, zFloor = zWater, zBed = zFloor) {
  const n = WATER.index;
  const bend = (zWater - zFloor) * (1 - 1 / n) + ((zFloor - zBed) * (n - 1)) / GLASS + (zBed - zPaper) * (n - 1);
  return bend / magnificationOf(zLamp, zPaper, zWater);
}

export const amplitudeOf = (kMm) => SLOPE / kMm;

export const focusOf = (kMm, caustic) => caustic * amplitudeOf(kMm) * kMm * kMm;

export function stateOf(frequency, spacingMm, optics) {
  const wave = waveOf(frequency);
  const lambdaMm = wave.lambda * 1000;
  const kMm = wave.k / 1000;
  const amplitude = amplitudeOf(kMm);
  return {
    frequency,
    spacing: spacingMm,
    lambdaMm,
    kMm,
    speed: wave.speed,
    group: wave.group,
    decay: wave.decay / 1000,
    nodal: nodalCount(spacingMm, lambdaMm),
    strobe: frequency - BEAT,
    amplitude,
    focus: focusOf(kMm, optics.caustic),
    projected: lambdaMm * optics.magnification,
  };
}

// Teaching edition: the water depth is a live variable (3..8 mm keeps every history sample inside PACK).
export const DEPTH = [3, 8];
/** The model at a given depth (mm), leaving WATER.depth as it was. */
export function stateAt(frequency, spacingMm, depthMm, optics) {
  const keep = WATER.depth;
  WATER.depth = depthMm / 1000;
  try {
    return stateOf(frequency, spacingMm, optics);
  } finally {
    WATER.depth = keep;
  }
}
/** d/λ + ½, cut (not rounded) to two decimals, so the shown number never contradicts its floor. */
export const halfOf = (state) => Math.floor((state.spacing / state.lambdaMm + 0.5) * 100) / 100;

/** Everything the teaching panel reads ({key} templates): number n and text t, from one settled state. */
export function valuesOf(m, sources, depthMm, beat) {
  const cm = (mm, digits) => `${(mm / 10).toFixed(digits)} cm`;
  const N = sources === 2 ? m.nodal : 0;
  const ratio = m.spacing / m.lambdaMm;
  const half = halfOf(m);
  return {
    f: { n: m.frequency, t: `${m.frequency.toFixed(1)} Hz` },
    lambda: { n: m.lambdaMm / 10, t: cm(m.lambdaMm, 2) },
    v: { n: m.speed * 100, t: `${(m.speed * 100).toFixed(1)} cm/s` },
    d: { n: m.spacing / 10, t: cm(m.spacing, 1) },
    h: { n: depthMm, t: `${depthMm.toFixed(1)} mm` },
    N: { n: N, t: String(N) },
    dr: { n: ratio, t: (Math.floor(ratio * 100) / 100).toFixed(2) },
    dl: { n: half, t: half.toFixed(2) },
    fl: { n: Math.floor(half), t: String(Math.floor(half)) },
    proj: { n: m.projected / 10, t: cm(m.projected, 2) },
    lamp: { n: m.frequency - beat, t: `${(m.frequency - beat).toFixed(2)} Hz` },
    seen: { n: beat, t: `${beat.toFixed(2)} Hz` },
    sources: { n: sources, t: `${sources}개` },
    Nsay: sources === 2 ? `지금 간격 ${cm(m.spacing, 1)}에서는 ${N}개입니다.` : "지금은 파원이 하나라 마디선이 없습니다.",
    Nline: sources === 2 ? `N = 2⌊d/λ + ½⌋ = 2 × ⌊${half.toFixed(2)}⌋ = ${N}개` : "파원이 하나라 마디선이 없습니다",
  };
}

export const readoutOf = (state, sources = 2) => `f ${state.frequency.toFixed(1)} Hz · λ ${(state.lambdaMm / 10).toFixed(2)} cm · ` + (sources === 1 ? "파원 1개" : `d ${(state.spacing / 10).toFixed(1)} cm · 마디선 ${state.nodal}개`);

export function wordsOf(state, sources = 2, depthMm = WATER.depth * 1000) {
  return `진동수 ${state.frequency.toFixed(1)} 헤르츠, 파장 ${(state.lambdaMm / 10).toFixed(2)} 센티미터, ` + (sources === 1 ? "파원 1개, " : `파원 간격 ${(state.spacing / 10).toFixed(1)} 센티미터, `) + `수심 ${depthMm.toFixed(1)} 밀리미터` + (sources === 1 ? "" : `, 마디선 ${state.nodal}개`);
}

function clippedRunsOf(points, [x0, y0, x1, y1], project) {
  const runs = [];
  let run = [];
  for (const point of points) {
    if (point[0] >= x0 && point[0] <= x1 && point[1] >= y0 && point[1] <= y1) run.push(project(point));
    else if (run.length) {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs.map((points) => points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("")).join("");
}

export function patternOf(state, { xs, inside, lamp, zWater, zPaper }, project, phase = 0, { sources = 2, crests: withCrests = true } = {}) {
  const lift = (lamp[2] - zPaper) / (lamp[2] - zWater);
  const onPaper = ([x, y]) => project([lamp[0] + (x - lamp[0]) * lift, lamp[1] + (y - lamp[1]) * lift, zPaper]);
  const half = state.spacing / 2;
  const nodal = [];
  for (const vertex of sources === 2 ? nodalVertices(state.spacing, state.lambdaMm) : []) {
    const a = Math.abs(vertex);
    const b = Math.sqrt(Math.max(half * half - a * a, 1e-6));
    const points = [];
    for (let index = 0; index <= 240; index++) {
      const t = -4 + (8 * index) / 240;
      points.push([xs + b * Math.sinh(t), Math.sign(vertex) * a * Math.cosh(t)]);
    }
    nodal.push(clippedRunsOf(points, inside, onPaper));
  }
  const crests = [];
  for (const sy of !withCrests ? [] : sources === 2 ? [-half, half] : [-half]) {
    const reach = Math.max(...[inside[0], inside[2]].flatMap((x) => [inside[1], inside[3]].map((y) => Math.hypot(x - xs, y - sy))));
    for (let r = state.lambdaMm * (1 + (((phase / (2 * Math.PI)) % 1) + 1) % 1); r < reach; r += state.lambdaMm) {
      const points = [];
      const steps = Math.max(24, Math.round(r * 1.2));
      for (let index = 0; index <= steps; index++) {
        const a = (index / steps) * 2 * Math.PI;
        points.push([xs + r * Math.cos(a), sy + r * Math.sin(a)]);
      }
      crests.push(clippedRunsOf(points, inside, onPaper));
    }
  }
  return { nodal: nodal.join(""), crests: crests.join("") };
}
