// Wind turbine (2 MW class, upwind, pitch-regulated, geared): a Korean teaching figure built from scratch.
// A model turbine on a concrete pad on a bench plate. The nacelle is cut open on the near side to show the
// drivetrain; it yaws to follow the wind (drag), and the blades pitch toward feather above rated speed.
// Numbers come from model.js; the yawing geometry from rig.js (the same code redraws it in the page).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { eduPage, writePage } from "../../edu/kit/edu.mjs";
import content from "./ko.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = process.argv.includes("--light") ? "light" : "dark";
const read = (file) => readFileSync(join(HERE, file), "utf8");
const MODEL_JS = read("model.js");
const RIG_JS = read("rig.js");
const WT = new Function(`${MODEL_JS}\nreturn WT;`)();
const { RIG, rigItems } = new Function(`${RIG_JS}\nreturn { RIG, rigItems };`)();
const param = (id) => content.params.find((entry) => entry.id === id).value;
const DEG = Math.PI / 180;

const W = 640;
const H = 600;
const AZIMUTH = 45;
const YAW0 = AZIMUTH - 52; // the rotor faces the wind; at rest the wind comes from here (degrees)
const DIR_RANGE = 30; // the wind-direction control turns the wind this far either way

const PLATE = { x: -100, y: -100, w: 200, d: 200, r: 10 };
const PLATE_H = 9;
const FOOT_H = 5;
const PAD_R = 54;
const PAD_H = 8;
const DIAL = [36, 48];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, RIG.ZHUB + RIG.R + 4], [RIG.ROTOR_AT * Math.cos(YAW0 * DEG) - RIG.R * Math.sin(YAW0 * DEG) * 1.05, RIG.R * Math.cos(YAW0 * DEG) * 1.05, RIG.ZHUB], [RIG.ROTOR_AT * Math.cos(YAW0 * DEG) + RIG.R * Math.sin(YAW0 * DEG) * 1.05, -RIG.R * Math.cos(YAW0 * DEG) * 1.05, RIG.ZHUB], [-90 * RIG.NS, 0, RIG.ZTOP + 50 * RIG.NS]],
  W,
  H,
  { pad: 16, azimuth: AZIMUTH, elevation: 24 },
);
const V = G.viewOf(P);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const UPF = G.frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const flatMatrix = (c) => {
  const p0 = at(c), px = at([c[0] + 1, c[1], c[2]]), py = at([c[0], c[1] + 1, c[2]]);
  return `matrix(${(px[0] - p0[0]).toFixed(4)} ${(px[1] - p0[1]).toFixed(4)} ${(py[0] - p0[0]).toFixed(4)} ${(py[1] - p0[1]).toFixed(4)} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
};

// ---------- the static scene (drawn behind the yawing rig), each item with its recorded shape ----------
function staticScene() {
  const list = [];
  const put = (piece, name, svg, shape) => list.push({ piece, name, svg, shape });
  const halo = `<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`;
  const feet = k.corners(PLATE, 22)
    .sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))
    .map(([x, y]) => S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }) + S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }))
    .join("");
  const strip = { x: PLATE.x + 12, y: PLATE.y + PLATE.d - 13, w: 120, d: 7, r: 1 };
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
  const label = { x: PLATE.x + PLATE.w - 66, y: PLATE.y + PLATE.d - 16, w: 52, d: 10, r: 1.2 };
  const rules = [[30], [44], [22]].map(([w], i) => Ln(k.lineOnTop([label.x + 4, label.y + 3 + i * 2.2], [label.x + 4 + w, label.y + 3 + i * 2.2], 0.8, P), { tone: "lo", free: true })).join("");
  put("base", "stand.plate",
    halo + feet + S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }) + Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }) +
      Ln(k.corners(PLATE, 10).map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }) + Dots(k.corners(PLATE, 10).map(([x, y]) => at([x, y, 0])), { size: 0.5 }) +
      S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }) + Ln(ticks.minor, { tone: "lo" }) + Ln(ticks.major, { tone: "mid" }) +
      S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid", crease: "none" }) + Ln(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 2), { tone: "faint" }) + rules,
    A.box([PLATE.x, PLATE.y, -PLATE_H], [PLATE.x + PLATE.w, PLATE.y + PLATE.d, 0], { name: "stand.plate" }));
  // pad-mounted transformer behind the tower, cooling fins on the face you see
  const TR = { x: -86, y: -88, w: 30, d: 22, r: 1.5 };
  const fins = [];
  for (let x = TR.x + 3; x < TR.x + TR.w - 2; x += 3) fins.push(k.segment([x, TR.y + TR.d, 2], [x, TR.y + TR.d, 16], P));
  put("transformer", "transformer.box", S(k.slabOf(TR, 0, 20, P, 3, 0.6), { tone: "mid", inner: Ln(fins.join("") + k.sideSeam(TR, 16, P, 3) + k.sideSeam(TR, 2, P, 3), { tone: "faint" }) }) + Dots([at([TR.x + 3, TR.y + 3, 20]), at([TR.x + TR.w - 3, TR.y + TR.d - 3, 20])], { size: 0.45 }), A.slab(TR, 0, 20, { name: "transformer.box" }, 3));
  // concrete pad with the wind-direction dial engraved on its top
  const dialTicks = k.radialTicks(0, 0, DIAL[1] - 0.5, 72, 6, PAD_H, [1.6, 3.4], P);
  put("pad", "stand.pad",
    S(k.cylinder(0, 0, PAD_R, 0, PAD_H, P, 96, 0.8), { tone: "lo" }) + Ln(k.ring(0, 0, DIAL[1], PAD_H, P, 96) + k.ring(0, 0, DIAL[0], PAD_H, P, 96), { tone: "lo" }) + Ln(dialTicks.minor, { tone: "lo" }) + Ln(dialTicks.major, { tone: "mid" }) +
      Dots(Array.from({ length: 12 }, (_, i) => at([20 * Math.cos((i * 30 + 15) * DEG), 20 * Math.sin((i * 30 + 15) * DEG), PAD_H])), { size: 0.45 }),
    A.cylinder(0, 0, PAD_R, 0, PAD_H, { name: "stand.pad" }));
  // the wind arrow on the dial: it turns in the pad's plane, so the page rotates it with a transform
  const arrow = `M${DIAL[1] + 4} -3L${DIAL[0] + 9} -3L${DIAL[0] + 9} -7L${DIAL[0] - 2} 0L${DIAL[0] + 9} 7L${DIAL[0] + 9} 3L${DIAL[1] + 4} 3Z`;
  put("windarrow", "windarrow.plate", `<g transform="${flatMatrix([0, 0, PAD_H + 0.4])}"><g class="wt-arrow" transform="rotate(${YAW0})"><path class="wt-arrow-fill" d="${arrow}"/><path class="iso-line" data-tone="lit" d="${arrow}"/></g></g>`, A.ring(G.frameOf([0, 0, PAD_H], [0, 0, 1], [1, 0, 0], [0, 1, 0]), 0, 0.4, DIAL[0] - 2, DIAL[1] + 4, { name: "windarrow.plate" }));
  // tower: a tapered steel tube on its base flange, three sections, a door at the foot, the yaw ring on top
  const TF = G.frameOf([0, 0, PAD_H], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const top = RIG.ZTOP - PAD_H;
  const rAt = (s) => 12.5 - (4.5 * (s - 3)) / (top - 6);
  // three turned solids (base flange, conical shell, yaw ring), so each keeps its own outline
  const coneProfile = [[3, 0], [3, rAt(3)], [top - 3, rAt(top - 3)], [top - 3, 0]];
  const seams = [55, 105].map((s) => G.arcOf(TF, s, rAt(s), P, { slope: -4.5 / (top - 6) })).join("");
  const towerShape = A.solid(TF, coneProfile, { name: "tower.shell" });
  const bolts = Dots(G.dotsOf(TF, 3, 15, 20, P, { fade: [0.04, 0.42] }), { size: 0.42 });
  put("tower", "tower.flange", S(G.disc(0, 3, 17, TF, P, { bevel: 0.5 }), { tone: "mid" }) + bolts, A.disc(TF, 0, 3, 17, { name: "tower.flange" }));
  put("tower", "tower.shell", S(G.solidOf(coneProfile, TF, P), { tone: "mid", inner: Ln(seams, { tone: "faint" }) }), towerShape);
  const teeth = k.fadedSvg(G.ribsOf(TF, top - 2.6, top - 0.2, 11, 44, P, { fade: [0.1, 0.55] }), { tone: "lo" });
  put("tower", "tower.yawring", S(G.disc(top - 3, top, 11, TF, P), { tone: "mid" }) + teeth, A.disc(TF, top - 3, top, 11, { name: "tower.yawring" }));
  // door on the tower foot, facing the viewer
  const doorDir = [Math.cos(AZIMUTH * DEG), Math.sin(AZIMUTH * DEG), 0];
  const DF = G.frameOf([0, 0, 0], doorDir, [-doorDir[1], doorDir[0], 0], [0, 0, 1]);
  const doorPoly = [[-3.2, PAD_H + 6], [3.2, PAD_H + 6], [3.2, PAD_H + 20], [-3.2, PAD_H + 20]];
  // the door is a thin prism standing just proud of the shell (rim on the curved surface)
  const doorS0 = Math.sqrt(rAt(18) ** 2 - 3.2 ** 2) - 0.2;
  put("tower", "tower.door", S(G.prismOf(DF, doorPoly, doorS0, rAt(6) + 0.8, P), { tone: "hi" }), A.prism(DF, doorPoly, doorS0, rAt(6) + 0.8, { name: "tower.door", seated: true, cut: [towerShape] }));
  return list;
}

// ---------- assemble one pose: static scene, then the yawing rig sorted by depth ----------
function scene(yawDeg, pitch, R) {
  const statics = staticScene();
  const rig = rigItems(yawDeg * DEG, pitch, { k, G, P, A });
  rig.items.sort((a, b) => a.key - b.key);
  const ordered = [...statics, ...rig.items];
  if (R) ordered.forEach((item, index) => R.put({ piece: item.piece, key: index, at: [0, 0, 0], svg: item.svg, name: item.name, shapes: item.shape ? [R.solid(item.shape)] : [] }));
  return { statics, rig };
}

const v0 = param("v");
const cp0 = param("cp");
const first = WT.model({ v: v0, cp: cp0 });
const { statics, rig } = scene(YAW0, first.pitch, null);
const group = (item) => `<g data-piece="${item.piece}" data-name="${item.name}">${item.svg}</g>`;
const LABEL =
  "콘크리트 받침 위에 선 2 MW급 풍력 발전기의 모형입니다. 탑 꼭대기의 나셀은 가까운 쪽 덮개를 떼어 내부가 보입니다. 앞쪽부터 블레이드 세 장과 허브, 저속축과 주 베어링, 증속 기어박스, 브레이크 원판, 발전기가 한 줄로 놓여 있고, 바닥의 요 구동기, 지붕의 풍속계와 풍향계, 제어반이 있습니다. 받침 윗면에는 바람이 불어오는 방향을 가리키는 화살표가 있습니다.";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${LABEL}"><g class="wt-back">${statics.map(group).join("")}</g><g class="wt-air wt-air-back" aria-hidden="true"></g><g class="wt-rig">${rig.items.map(group).join("")}</g><g class="wt-air wt-air-front" aria-hidden="true"></g></svg>`;

// ---------- the power curve chart (a UI inset under the figure, drawn from the same model) ----------
const CH = { w: 600, h: 170, l: 46, r: 14, t: 14, b: 34, vmax: 30, pmax: 2.6e6 };
const cx = (v) => CH.l + ((CH.w - CH.l - CH.r) * v) / CH.vmax;
const cy = (p) => CH.h - CH.b - ((CH.h - CH.t - CH.b) * Math.min(p, CH.pmax)) / CH.pmax;
function chartSvg() {
  const axis = `<path class="wt-ch-axis" d="M${CH.l} ${CH.t}V${CH.h - CH.b}H${CH.w - CH.r}"/>`;
  const xt = [0, 5, 10, 15, 20, 25, 30].map((v) => `<path class="wt-ch-tick" d="M${cx(v)} ${CH.h - CH.b}v4"/><text class="wt-ch-label" x="${cx(v)}" y="${CH.h - CH.b + 15}" text-anchor="middle">${v}</text>`).join("");
  const yt = [0, 0.5, 1, 1.5, 2, 2.5].map((mw) => `<path class="wt-ch-grid" d="M${CH.l} ${cy(mw * 1e6)}H${CH.w - CH.r}"/><text class="wt-ch-label" x="${CH.l - 6}" y="${cy(mw * 1e6) + 3.5}" text-anchor="end">${mw}</text>`).join("");
  const names = `<text class="wt-ch-label" x="${CH.w - CH.r}" y="${CH.h - 4}" text-anchor="end">풍속 (m/s)</text><text class="wt-ch-label" x="${CH.l - 38}" y="${CH.t - 2}">출력 (MW)</text>`;
  return `<svg class="wt-chart" viewBox="0 0 ${CH.w} ${CH.h}" role="img" aria-label="출력 곡선: 풍속에 따른 발전기 출력"><g class="wt-ch-bands"></g>${yt}${axis}${xt}${names}<path class="wt-ch-betz" d=""/><path class="wt-ch-wind" d=""/><path class="wt-ch-curve" d=""/><g class="wt-ch-marks"></g><path class="wt-ch-drop" d=""/><circle class="wt-ch-dot" r="4.5" cx="0" cy="0"/></svg>`;
}

const CSS = read("wind-turbine.css");
const DATA = { P, V, YAW0, DIR_RANGE, AZIMUTH, PAD_H, CH, ROTOR_S: RIG.ROTOR_AT, ZHUB: RIG.ZHUB, R: RIG.R };
// lathe.mjs inside the page, wrapped so its helpers don't collide with the kit's globals
const latheSrc = readFileSync(join(HERE, "../../kit/lathe.mjs"), "utf8").replace(/^import .*$/m, "").replace(/^export /gm, "");
const LATHE = `const G = (() => {\n${latheSrc}\nreturn { frameOf, pointOf, solidOf, disc, arcOf, ribsOf, dotsOf, circleOf, prismOf };\n})();`;
const LIVE = [LATHE, MODEL_JS, RIG_JS, read("live.js").replace("__DATA__", JSON.stringify(DATA))].join("\n");
const f = WT.fmt;
const firstValues = { v: f.v(first.v), P: f.MW(first.P), rpm: f.rpm(first.rpm), genRpm: f.rpm(first.genRpm), pitch: f.deg(first.pitch), region: "부분 부하", cpNow: f.cp(first.cpNow) };
const stage = `<div class="iso-stage wt-stage" tabindex="0" role="group" aria-label="풍력 발전기 모형입니다. 그림을 끌거나 왼쪽·오른쪽 화살표 키로 바람 방향을 바꾸면 나셀이 따라 돕니다.">${svg}${chartSvg()}</div>`;
const html = eduPage({ content, theme: THEME, stage, css: CSS, script: kitScript() + "\n" + LIVE, values: firstValues });
writePage(HERE, THEME === "light" ? "wind-turbine-ko-light.html" : "wind-turbine-ko.html", html);
console.log(`${(html.length / 1024).toFixed(0)} KB`, `${statics.length + rig.items.length} items`);

// ---------- audit: the pose at rest and the two ends of the yaw range, in the page's own draw order ----------
if (process.argv.includes("--audit")) {
  for (const [label, yaw, pitch] of [["rest", YAW0, first.pitch], [`yaw −${DIR_RANGE}°`, YAW0 - DIR_RANGE, 0], [`yaw +${DIR_RANGE}°`, YAW0 + DIR_RANGE, 0], ["feathered", YAW0, 90]]) {
    const R = A.recorder(P);
    scene(yaw, pitch, R);
    console.log(`--- ${label}`);
    A.auditOrExit(R, P, { allow: [["rotor.blades", "hub.spinner"]] });
  }
}
