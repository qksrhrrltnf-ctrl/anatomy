// A4 print sheet for the wind-turbine teaching figure (scripts/print.mjs). Numbers are model.js at
// v = 8 m/s, Cp = 0.44 (the figure's default) and at 18 m/s (rated, pitched).
const piece = (id) => `[data-piece="${id}"]`;
const set = (v, dir) => `(() => { const s = (id, x) => { const i = document.getElementById('edu-p-' + id); i.value = x; i.dispatchEvent(new Event('input', { bubbles: true })); }; s('v', ${v}); s('cp', 0.44); s('dir', ${dir}); return 1; })()`;

export default {
  page: "wind-turbine-ko-light.html",
  out: "wind-turbine",
  reduced: true,
  layers: ".wt-stage > svg.iso-svg",
  strip: [".wt-air"],
  views: {
    rest: { actions: [["eval", set(8, 0)], ["wait", 800]] },
    side: { actions: [["eval", set(8, -30)], ["wait", 800]], reset: [["eval", set(8, 0)], ["wait", 800]] },
    rated: { actions: [["eval", set(18, 0)], ["wait", 800]], reset: [["eval", set(8, 0)], ["wait", 800]] },
  },

  name: "풍력 발전기",
  title: "풍력 발전기: 바람의 운동 에너지를 전기로",
  number: "사례 C-2",
  tagline: "½ρAv³Cp, 베츠 한계, 피치",
  question: "풍속이 2배가 되면 전기는 몇 배?",
  lead: "블레이드가 바람의 운동 에너지 일부를 회전으로 바꾸고, 기어박스가 느린 회전을 100배 빠르게 높여 발전기를 돌립니다. 출력은 풍속의 세제곱으로 늘다가 정격에서 멈추고, 그 위에서는 블레이드를 비틀어 바람을 흘려보냅니다.",
  quote: "P = ½ρAv³Cp",
  numbers: [
    ["2.00", "MW", "8 m/s 바람이 가진 일률"],
    ["0.88", "MW", "Cp 0.44일 때 출력"],
    ["0.593", "", "베츠 한계 16/27"],
    ["13.6 → 1,358", "rpm", "로터 → 발전기 (1 : 100)"],
  ],
  spec: [
    ["로터 지름", "90 m (2 MW급)"],
    ["정격 출력", "2.0 MW (약 10.5 m/s부터)"],
    ["기동 / 정지 풍속", "3.5 / 25 m/s"],
    ["증속비", "1 : 100"],
    ["18 m/s 피치각", "약 20°"],
  ],
  why: {
    title: "왜 59 %가 한계일까?",
    text: "로터가 바람을 완전히 멈추면 뒤의 공기가 빠지지 않아 새 바람이 들어오지 못합니다. 바람을 1/3로 늦출 때 얻는 몫이 가장 크고, 그 값이 16/27입니다.",
  },

  parts: [
    { id: "rotor", name: "블레이드", say: "바람에 양력을 받아 로터를 돌립니다.", select: piece("rotor") },
    { id: "hub", name: "허브와 스피너", say: "블레이드를 붙잡고 피치각을 돌립니다.", select: piece("hub") },
    { id: "shaft", name: "저속축과 주 베어링", say: "느리고 큰 토크를 기어박스로 전합니다.", select: `${piece("shaft")}, ${piece("bearing")}` },
    { id: "gearbox", name: "증속 기어박스", say: "회전 속도를 100배로 높입니다.", select: piece("gearbox") },
    { id: "brake", name: "고속축과 브레이크", say: "발전기로 빠른 회전을 전하고, 멈출 때 잡아 줍니다.", select: piece("brake") },
    { id: "generator", name: "발전기", say: "전자기 유도로 전기를 만듭니다.", select: piece("generator") },
    { id: "yaw", name: "요 구동기", say: "나셀을 바람 쪽으로 돌립니다.", select: piece("yaw") },
    { id: "met", name: "풍속계와 풍향계", say: "바람의 세기와 방향을 잽니다.", select: piece("met") },
    { id: "tower", name: "탑과 요 베어링", say: "나셀을 높이 받치고, 꼭대기에서 돌게 합니다.", select: piece("tower") },
    { id: "transformer", name: "변압기", say: "발전기 전압을 송전 전압으로 높입니다.", select: piece("transformer") },
  ],

  main: { view: "rest" },
  inset: { label: "정격 18 m/s · 피치 약 20°", view: "rated" },
  steps: [
    { view: "rest", title: "바람의 일률", text: "8 m/s 바람이 로터 원판을 지나며 2.00 MW의 일률을 나릅니다.", focus: ["rotor"] },
    { view: "side", title: "증속", text: "로터 13.6 rpm을 기어박스가 1,358 rpm으로 높입니다.", focus: ["shaft", "gearbox"] },
    { view: "side", title: "발전", text: "발전기가 0.88 MW를 만들고 변압기가 전압을 높입니다.", focus: ["generator", "brake"] },
    { view: "rated", title: "피치", text: "정격 위에서는 블레이드를 비틀어 출력을 2.0 MW로 지킵니다.", focus: ["rotor", "hub"] },
    { view: "side", title: "요", text: "바람 방향이 바뀌면 요 구동기가 나셀을 돌립니다.", focus: ["yaw", "met"] },
  ],
};
