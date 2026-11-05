// A4 print sheet for the fibre-optic link teaching figure (scripts/print.mjs).
// Numbers are model.mjs at the default pose: n1 1.48, n2 1.46, launch 12°, 20 km, 10 mm mandrel step.
const piece = (id) => `[data-piece="${id}"]`;
const set = (id, v) => `(() => { const i = document.getElementById('edu-p-${id}'); i.value = ${v}; i.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`;

export default {
  page: "fiber-link-ko-light.html",
  out: "fiber-link",
  reduced: true,
  views: {
    rest: {},
    leak: { actions: [["eval", set("theta0", 22)], ["wait", 500]], reset: [["eval", set("theta0", 12)], ["wait", 500]] },
  },

  name: "광섬유 통신",
  title: "광섬유 통신: 빛으로 글자 보내기",
  number: "사례 E-1",
  tagline: "전반사, 감쇠, 휨 손실",
  question: "빛은 어떻게 유리 실 속에 갇혀 멀리 갈까?",
  lead: "코어(n₁ 1.48)를 굴절률이 조금 작은 클래딩(n₂ 1.46)이 감쌉니다. 경계에 임계각보다 비스듬히 온 빛은 모두 반사되어 코어를 따라갑니다. 글자는 ASCII 8비트로 바뀌어 빛 펄스로 가고, 거리와 휨만큼 약해진 빛이 수신기에서 다시 글자가 됩니다.",
  quote: "θc = arcsin(n₂ ÷ n₁)",
  numbers: [
    ["80.6", "°", "임계각 (n₂ 1.46)"],
    ["14.0", "°", "수용각 (NA 0.243)"],
    ["0.2", "dB/km", "광섬유 감쇠 (약)"],
    ["−6.8", "dBm", "20 km 뒤 받는 빛"],
  ],
  spec: [
    ["코어 / 클래딩", "n₁ 1.48 / n₂ 1.46"],
    ["송신 출력", "0 dBm (1 mW)"],
    ["손실 (20 km)", "광섬유 4.0 + 연결 2.0 + 휨 0.77 dB"],
    ["수신 감도", "약 −25 dBm (여유 18.2 dB)"],
    ["H의 ASCII", "72 = 01001000"],
  ],
  why: {
    title: "왜 휘면 샐까?",
    text: "급하게 휜 곳의 바깥쪽 경계에서는 빛이 더 가파르게 부딪쳐 임계각보다 작아집니다. 그래서 반지름 5 mm로 한 바퀴 감으면 약 10 dB(9/10)가 새어 나갑니다.",
  },

  parts: [
    { id: "keyboard", name: "키보드", say: "보낼 글자를 넣습니다.", select: piece("keyboard") },
    { id: "driver", name: "송신 회로", say: "글자를 8비트로 바꾸어 레이저를 켜고 끕니다.", select: piece("driver") },
    { id: "laser", name: "레이저 다이오드", say: "빛 펄스를 냅니다.", select: piece("laser") },
    { id: "lens", name: "렌즈", say: "빛을 모아 코어 끝에 넣습니다.", select: piece("lens") },
    { id: "cladding", name: "클래딩과 코어", say: "벗긴 부분: 코어 속 빛이 전반사됩니다.", select: `${piece("cladding")}, ${piece("core")}` },
    { id: "jacket", name: "피복·아라미드·코팅", say: "유리를 지키고 당기는 힘을 받습니다.", select: `${piece("jacket")}, ${piece("aramid")}, ${piece("coating")}` },
    { id: "spool", name: "광섬유 릴 상자", say: "먼 거리(20 km)를 감아 둔 광섬유입니다.", select: piece("spool") },
    { id: "mandrel", name: "계단형 맨드릴", say: "반지름별 휨 손실을 시험합니다.", select: piece("mandrel") },
    { id: "photodiode", name: "포토다이오드", say: "빛 펄스를 전류 펄스로 바꿉니다.", select: piece("photodiode") },
    { id: "receiver", name: "수신 회로", say: "8비트씩 묶어 글자로 되돌립니다.", select: piece("receiver") },
  ],

  main: { view: "rest" },
  inset: { label: "입사각 22°", view: "leak" },
  steps: [
    { view: "rest", title: "글자가 비트로", text: "H는 ASCII 72, 2진수 01001000입니다. 1이면 레이저가 켜집니다.", focus: ["keyboard", "driver", "laser"] },
    { view: "rest", title: "렌즈로 넣기", text: "렌즈가 빛을 입사각 12°로 모아 코어에 넣습니다. 수용각 14.0°보다 작습니다.", focus: ["lens", "laser"] },
    { view: "rest", title: "전반사", text: "코어 속 빛이 경계에 81.9°로 부딪칩니다. 임계각 80.6°보다 커서 모두 반사됩니다.", focus: ["cladding"] },
    { view: "leak", title: "입사각이 크면", text: "입사각 22°에서는 경계 입사각 75.3°가 임계각보다 작아 빛이 새어 나갑니다.", focus: ["cladding", "lens"] },
    { view: "rest", title: "받아서 되돌리기", text: "20 km와 휨을 지난 빛 −6.8 dBm을 포토다이오드가 받아 다시 HI로 읽습니다.", focus: ["spool", "mandrel", "photodiode", "receiver"] },
  ],
};
