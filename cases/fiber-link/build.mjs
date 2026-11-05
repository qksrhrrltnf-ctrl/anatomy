// Korean teaching edition: a fibre-optic link on a bench (new figure, edu-kit layer).
// node cases/fiber-link/build.mjs [--light] [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import * as A from "../../kit/audit.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { eduPage, writePage } from "../../edu/kit/edu.mjs";
import content from "./ko.mjs";
import { MODEL, budget } from "./model.mjs";
import * as GEO from "./geometry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const auditing = process.argv.includes("--audit");
const { P, KS } = GEO;
const at = (p) => k.iso(p, P);
const f2 = (v) => Math.round(v * 100) / 100;

// One scene per mandrel step; the page draws the default scene and slots the other steps' cord 2
// chunks next to the same neighbours. Every scene is settled and (with --audit) audited on its own.
const flagBend = process.argv.find((a) => a.startsWith("--bend="));
const DEFAULT = flagBend ? +flagBend.slice(7) : MODEL.bend;
const scenes = GEO.TIERS.map((_, bend) => {
  const sc = GEO.scene(bend);
  A.settle(sc.R, P);
  sc.R.items.sort((a, b) => a.key - b.key);
  return sc;
});
const wraps = scenes.map((sc) => (sc.wrap * 180) / Math.PI);

// Merge: the default scene's order for everything that is the same in every step; each step's loop
// chunks go into the slot its own settled order asks for: after every item it must cover and before
// every item that must cover it (screen boxes that overlap), keeping the chunks' own order.
const main = scenes[DEFAULT];
const isLoop = (item) => item.route === "cord2" && item.loop;
const order = main.R.items.filter((item) => !isLoop(item)).map((item) => ({ item, before: [] }));
const indexByName = new Map(order.map((entry, index) => [entry.item.name, index]));
const boxOf = new Map();
const box = (item) => {
  if (!boxOf.has(item)) boxOf.set(item, A.markupBox(item.svg));
  return boxOf.get(item);
};
const meets = (a, b) => {
  const p = box(a);
  const q = box(b);
  return p && q && p[0] < q[2] && q[0] < p[2] && p[1] < q[3] && q[1] < p[3];
};
let mismatch = 0;
let conflicts = 0;
scenes.forEach((sc, bend) => {
  const list = sc.R.items;
  const slots = new Map();
  let floor = 0;
  list.forEach((item, at) => {
    if (!isLoop(item)) {
      if (!indexByName.has(item.name)) mismatch++;
      return;
    }
    let lo = floor;
    let hi = order.length;
    list.forEach((other, j) => {
      if (isLoop(other) || !meets(item, other)) return;
      const pos = indexByName.get(other.name);
      if (j < at) lo = Math.max(lo, pos + 1);
      else hi = Math.min(hi, pos);
    });
    if (lo > hi) { conflicts++; console.log(`slot conflict: ${item.name} needs after ${lo - 1}, before ${hi}`); }
    floor = lo;
    if (!slots.has(lo)) slots.set(lo, []);
    slots.get(lo).push(item);
  });
  for (const [pos, items] of slots) {
    if (pos >= order.length) order.push({ item: null, before: [{ bend, items }] });
    else order[pos].before.push({ bend, items });
  }
});
if (mismatch) console.log(`order merge: ${mismatch} items missing from the default scene`);
// The order each step is drawn in on the page: the default scene's non-loop items, that step's loop
// chunks in their slots. The audit re-keys every scene to this order, so it checks what the page draws.
const pageRank = (bend) => {
  const names = [];
  for (const entry of order) {
    for (const run of entry.before) if (run.bend === bend) names.push(...run.items.map((item) => item.name));
    if (entry.item) names.push(entry.item.name);
  }
  return new Map(names.map((name, index) => [name, index]));
};
if (auditing) {
  let failed = 0;
  scenes.forEach((sc, bend) => {
    console.log(`\n=== mandrel step ${bend} (${MODEL.BENDS_MM[bend]} mm, wrap ${wraps[bend].toFixed(1)}°) ===`);
    const rank = pageRank(bend);
    for (const item of sc.R.items) item.key = rank.get(item.name);
    const result = A.audit(sc.R, P, { cover: ["beam*"] });
    console.log(A.report(result));
    const n = A.failures(result);
    failed += n;
    console.log(n ? `audit failed: ${n} problems` : "audit passed");
  });
  console.log(failed ? `\nfiber-link audit failed: ${failed} problems in all` : "\nfiber-link audit passed (4 mandrel steps)");
  process.exitCode = failed ? 1 : 0;
}


const groupOf = (item) => `<g data-piece="${item.piece}" data-name="${item.name}">${item.svg}</g>`;
const body = [];
for (const entry of order) {
  for (const run of entry.before) body.push(`<g data-bend="${run.bend}"${run.bend === DEFAULT ? "" : ' display="none"'}>${run.items.map(groupOf).join("")}</g>`);
  if (entry.item) body.push(groupOf(entry.item));
}

const svg = k.figureSvg({
  width: GEO.W,
  height: GEO.H,
  label: "작업대 위의 광섬유 통신 링크입니다. 왼쪽 뒤의 송신기에서 레이저 다이오드의 빛을 렌즈로 모아 굵은 케이블의 광섬유에 넣습니다. 케이블 가운데는 피복을 벗겨 코어와 클래딩이 보이고, 그 안에서 빛이 전반사로 지그재그로 나아갑니다. 빛은 광섬유 릴 상자를 지나 가는 패치 코드로 나와 계단 모양 맨드릴을 한 바퀴 반쯤 돌고, 앞쪽의 수신기 포토다이오드에 닿습니다. 송신기와 수신기의 표시창에 보낸 글자와 받은 글자가 나옵니다.",
  body: [...main.back, ...body],
});

// Light-path bookkeeping for the page (world units along the light).
const DATA = {
  P,
  Y1: GEO.Y1, Z1: GEO.Z1, YF: GEO.YF, Z2: GEO.Z2,
  SIDE: GEO.SIDE,
  core: GEO.LAYERS.core, clad: GEO.LAYERS.cladding,
  win: GEO.WIN,
  emit: GEO.EMIT, focus: GEO.FOCUS, lensX: GEO.LENS_X, lensR: GEO.LENS_R, glass: GEO.GLASS,
  rxFibre: GEO.RX_FIBRE, pdFace: GEO.PD_FACE,
  gSpoolIn: GEO.gOfX(GEO.SPOOL_IN_FIBRE),
  spoolVis: 60, spoolPerKm: 1.2,
  c2Lead: main.c2Start - GEO.SPOOL_OUT_FIBRE,
  c2Tail: main.c2End - GEO.RX_FIBRE,
  pdGap: GEO.RX_FIBRE - GEO.PD_FACE,
  totals: scenes.map((sc) => f2(sc.total)),
  wraps: wraps.map(f2),
  defaultBend: DEFAULT,
  keyDown: k.translateAlong(P, [0, 0, -1.4]),
  defaults: { msg: content.params.find((p) => p.id === "msg").value, theta0: MODEL.theta0, n2: MODEL.n2, L: MODEL.L, bend: String(MODEL.BENDS_MM[DEFAULT]) },
};
const modelScript = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const live = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));

const CSS = readFileSync(join(HERE, "fiber.css"), "utf8");
const stage = `<div class="iso-stage fl-stage" tabindex="0" role="group" aria-label="광섬유 통신 링크: 그림을 누른 뒤 영문을 타자하면 그 글자를 빛 펄스로 보냅니다">${svg}</div>`;
const html = eduPage({ content, theme, stage, css: CSS, script: kitScript() + modelScript + live });
writePage(HERE, theme === "light" ? "fiber-link-ko-light.html" : "fiber-link-ko.html", html);
console.log(`${main.R.items.length} items · scale ${KS.toFixed(3)} · wraps ${wraps.map((w) => w.toFixed(1)).join(", ")}°`);
void budget; void G; void at;
