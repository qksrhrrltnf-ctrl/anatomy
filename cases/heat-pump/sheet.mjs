// A4 print sheet for the heat-pump teaching figure (scripts/print.mjs). Numbers are model.js at the default
// heating pose (indoor 20 °C, outdoor 7 °C, compressor 1.0 kW) and the cooling pose (26 °C / 35 °C).
const piece = (id) => `[data-piece="${id}"]`;
const mode = (index) => `(() => { document.querySelectorAll('.edu-seg')[${index}].click(); return 1; })()`;

export default {
  page: "heat-pump-ko-light.html",
  out: "heat-pump",
  reduced: true,
  views: {
    heat: { actions: [["eval", mode(0)], ["wait", 1800]] },
    cool: { actions: [["eval", mode(1)], ["wait", 1800]], reset: [["eval", mode(0)], ["wait", 1800]] },
  },

  name: "히트펌프",
  title: "히트펌프: 열을 만드는 대신 옮기는 기계",
  number: "사례 C-1",
  tagline: "압축, 응축, 팽창, 증발",
  question: "전기 1 kW로 어떻게 열 3.65 kW를 낼까?",
  lead: "압축기가 냉매를 압축하면 뜨거워지고, 팽창 밸브를 지나면 차가워집니다. 차가운 냉매는 바깥 공기에서 열을 흡수하고, 뜨거운 냉매는 실내에 열을 내놓습니다. 사방 밸브로 흐름을 뒤집으면 냉방기가 됩니다.",
  quote: "Q고 = W + Q저",
  numbers: [
    ["3.65", "", "COP (실내 20 °C, 실외 7 °C)"],
    ["3.65", "kW", "실내로 보낸 열"],
    ["2.65", "kW", "바깥 공기에서 가져온 열"],
    ["1.00", "kW", "압축기가 쓴 전기"],
  ],
  spec: [
    ["냉매", "R-32"],
    ["응축 / 증발", "35 °C / −3 °C"],
    ["고압 / 저압", "약 2.09 / 0.64 MPa(게이지)"],
    ["이상 COP", "22.5(공기) · 8.11(냉매)"],
    ["실제 추정", "카르노 COP의 45 %"],
  ],
  why: {
    title: "왜 1보다 클까?",
    text: "히트펌프는 열을 만들지 않고 옮깁니다. 실내로 간 열은 압축기의 전기 1.00 kW와 바깥 공기에서 가져온 2.65 kW를 더한 것이므로 에너지는 보존됩니다.",
  },

  parts: [
    { id: "compressor", name: "압축기", say: "냉매를 압축해 고온·고압 기체로 만듭니다.", select: piece("compressor") },
    { id: "valve4", name: "사방 밸브", say: "뜨거운 냉매를 실내 또는 실외 코일로 보냅니다.", select: `${piece("valve4")}, ${piece("solenoid")}` },
    { id: "iucoil", name: "실내 코일", say: "난방에서는 응축기: 실내에 열을 내놓습니다.", select: piece("iucoil") },
    { id: "eev", name: "전자 팽창 밸브", say: "압력을 낮춰 냉매를 차갑게 만듭니다.", select: piece("eev") },
    { id: "oucoil", name: "실외 코일", say: "난방에서는 증발기: 바깥 공기에서 열을 흡수합니다.", select: piece("oucoil") },
    { id: "accumulator", name: "어큐뮬레이터", say: "압축기에 기체만 들어가게 액체를 거릅니다.", select: piece("accumulator") },
    { id: "gauges", name: "고압·저압 게이지", say: "토출관과 흡입관의 압력을 잽니다.", select: `${piece("gaugehi")}, ${piece("gaugelo")}` },
    { id: "lineset", name: "가스관과 액관", say: "실내기와 실외기를 잇는 냉매 배관입니다.", select: piece("lineset") },
    { id: "fan", name: "실외 팬", say: "바깥 공기를 실외 코일 사이로 보냅니다.", select: `${piece("fan")}, ${piece("fanmotor")}` },
    { id: "iufan", name: "관류 팬", say: "실내 공기를 실내 코일 사이로 보냅니다.", select: piece("iufan") },
  ],

  main: { view: "heat" },
  inset: { label: "냉방", view: "cool" },
  steps: [
    { view: "heat", title: "압축", text: "압축기가 저압 기체를 압축해 35 °C 이상의 고온·고압 기체로 만듭니다.", focus: ["compressor", "gauges"] },
    { view: "heat", title: "응축", text: "실내 코일에서 냉매가 실내 공기에 열 3.65 kW를 내놓고 액체가 됩니다.", focus: ["iucoil", "lineset"] },
    { view: "heat", title: "팽창", text: "팽창 밸브를 지나며 압력이 떨어져 −3 °C까지 차가워집니다.", focus: ["eev"] },
    { view: "heat", title: "증발", text: "실외 코일의 냉매가 7 °C 바깥 공기에서 열 2.65 kW를 흡수해 기체가 됩니다.", focus: ["oucoil", "fan"] },
    { view: "cool", title: "냉방", text: "사방 밸브가 흐름을 뒤집어 실내 코일이 증발기가 됩니다.", focus: ["valve4", "iucoil"] },
  ],
};
