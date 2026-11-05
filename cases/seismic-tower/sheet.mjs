// A4 poster of the seismic tower (scripts/print.mjs). Every number comes from model.mjs at the poses below.
import * as M from "./model.mjs";
const piece = (id) => `[data-piece="${id}"]`;
const set = (pairs) => `(() => { const s = (id, v) => { const i = document.getElementById('edu-p-' + id); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }; ${pairs} return 1; })()`;
const base = { N: 10, zeta: 0.02 };
const H = (o, f) => M.responseOf(M.systemOf({ ...base, iso: false, tmd: false, ...o }), f).H;
const fix = M.systemOf({ ...base, iso: false, tmd: false });
const iso = M.systemOf({ ...base, iso: true, tmd: false });

export default {
  page: "seismic-tower-ko-light.html",
  out: "seismic-tower",
  views: {
    res: { actions: [["eval", "document.getElementById('edu-autoplay').click(), 1"], ["eval", set("s('N', 10); s('zeta', 2); s('f', 1);")], ["wait", 600]] },
    iso: { actions: [["eval", "document.getElementById('edu-autoplay').click(), 1"], ["eval", set("s('N', 10); s('zeta', 2); s('f', 1);") ], ["eval", "document.getElementById('edu-p-iso').click(), 1"], ["wait", 600]] },
  },
  name: "내진·면진 건물",
  title: "공진, 면진, 동조 질량 감쇠기",
  number: "기술교육 사례 B-1",
  tagline: "고유진동수와 공진",
  question: "왜 어떤 지진에서는 건물이 크게 흔들리고, 어떤 지진에서는 덜 흔들릴까요?",
  lead: `건물은 질량(바닥판)과 용수철(기둥·가새)로 된 진동계입니다. 10층 건물의 고유 주기는 약 ${fix.Ts.toFixed(1)}초(T ≈ 0.1 × 층수)입니다. 땅이 그 진동수(${fix.fn.toFixed(2)} Hz)로 흔들리면 감쇠비 2 %에서 흔들림이 ${H({}, 1).toFixed(0)}배로 불어납니다(공진). 면진 고무받침은 주기를 ${iso.T.toFixed(2)}초로 늘려 같은 지진의 증폭률을 ${H({ iso: true }, 1).toFixed(2)}배로 낮추고, 옥상의 TMD는 공진 봉우리를 ${H({ tmd: true }, 1).toFixed(1)}배로 누릅니다.`,
  quote: "진동수가 맞으면 작은 흔들림이 커집니다",
  numbers: [
    [H({}, 1).toFixed(0), "배", "공진 때 증폭률 (10층, ζ 2 %)"],
    [fix.Ts.toFixed(1), "s", "10층 건물의 고유 주기"],
    [iso.T.toFixed(2), "s", "면진층을 넣은 주기"],
    ["660", "t", "타이베이 101의 TMD 추(약)"],
  ],
  spec: [["모형", "1자유도 질량-용수철"], ["층 질량", "약 600 t"], ["면진층", "주기 2.5 s, 감쇠 약 15 %"], ["TMD", "건물 질량의 2 %"]],
  parts: [
    { id: "soil", name: "지반", say: "지진 때 흔들리는 땅", select: piece("soil") },
    { id: "found", name: "기초", say: "땅과 함께 흔들리는 콘크리트 판", select: piece("found") },
    { id: "bearing", name: "적층 고무받침", say: "고무와 강판을 겹쳐 옆으로만 부드러움", select: piece("bearing") },
    { id: "lead", name: "납심", say: "찌그러지며 진동 에너지를 열로 바꿈", select: piece("lead") },
    { id: "column", name: "기둥", say: "건물 무게를 받치고 휘며 버팀 (강성 k)", select: piece("column") },
    { id: "brace", name: "X자 가새", say: "칸을 삼각형으로 나누어 강성을 키움", select: piece("brace") },
    { id: "slab", name: "바닥판", say: "층 질량이 모이는 곳 (질량 m)", select: piece("slab") },
    { id: "tmd", name: "TMD 쇠공", say: "건물 진동수에 맞춰 흔들리며 건물을 붙잡음", select: piece("tmd") },
    { id: "damper", name: "오일 댐퍼", say: "추의 움직임을 기름 저항으로 줄임", select: piece("damper") },
  ],
  main: { view: "res" },
};
