// A4 sheet for the servo figure (scripts/print.mjs). Every number comes from model.mjs at the poses below.
import { plant, settled, angleOf, fmt } from "./model.mjs";

const piece = (id) => `[data-piece="${id}"]`;
const set = (values) => `(() => { const set = (id, v) => { const i = document.getElementById('edu-p-' + id); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }; ${Object.entries(values).map(([k, v]) => `set('${k}', ${v});`).join(" ")} return 1; })()`;
const STD = plant({ kp: 0.06, gear: "std", load: 0 });
const LOAD = plant({ kp: 0.06, gear: "std", load: 2 });
const STRONG = plant({ kp: 0.06, gear: "strong", load: 2 });
const t90 = angleOf(1.5);

export default {
  page: "servo-motor-ko-light.html",
  out: "servo-motor",
  reduced: true,
  strip: [".sv-blur"],
  views: {
    rest: { actions: [["wait", 600]] },
    load: { actions: [["eval", set({ load: 2 })], ["wait", 800]], reset: [["eval", set({ load: 0 })], ["wait", 600]] },
    left: { actions: [["eval", set({ pwm: 1.25 })], ["wait", 800]], reset: [["eval", set({ pwm: 1.5 })], ["wait", 600]] },
  },

  name: "서보 모터",
  title: "서보 모터: 펄스 폭으로 각도를 지키는 되먹임 제어",
  number: "기술 3-01",
  tagline: "목표, 센서, 오차, 모터가 이루는 닫힌 고리",
  question: "서보 모터는 어떻게 명령한 각도에 멈춰 설까?",
  lead: "제어 보드가 20 ms마다 1~2 ms 폭의 펄스를 보내면 그 폭이 목표 각도가 됩니다. 출력축 아래의 가변저항이 지금 각도를 재고, 제어 회로는 그 차이(오차)에 P 게인을 곱한 전압으로 모터를 돌립니다. 네 단 기어가 빠른 회전을 느리고 센 회전으로 바꿉니다.",
  quote: "오차가 있어야 힘이 난다",
  numbers: [
    ["1.5", "ms", `펄스 폭 → 목표 ${fmt.deg0(t90)}`],
    [String(Math.round(STD.N)), ":1", "4단 감속비(표준 기어)"],
    [(STD.stall / 0.0981).toFixed(1), "kgf·cm", "멈출 때 토크(약)"],
    [(LOAD.ess).toFixed(1), "°", "2 kg 추를 걸 때 처짐"],
  ],
  spec: [
    ["전원", "6 V"],
    ["펄스", "1.00~2.00 ms → 0~180°, 20 ms 주기"],
    ["감속비", `${fmt.ratio(STD.N)} (10잇 피니언 4단)`],
    ["최고 속도", `${fmt.s60(STD.wMax * 180 / Math.PI)} (약)`],
    ["P 게인", "0.06 V/°"],
    ["처짐 (2 kg)", `${fmt.deg(LOAD.ess)} · 강한 기어 ${fmt.deg(STRONG.ess)}`],
  ],
  why: {
    title: "왜 추를 걸면 처질까?",
    text: `P 제어에서 모터 전압은 오차에 비례합니다. 추를 버티려면 전압이 필요하므로 오차가 조금 남아야 합니다. 2 kg 추(드럼 반지름 5 mm)에는 ${fmt.v(LOAD.vHold)}가 필요해 바늘이 ${fmt.deg(LOAD.ess)} 처진 ${fmt.deg(settled(t90, LOAD))}에서 멈춥니다.`,
  },

  parts: [
    { id: "horn", name: "혼과 지시 바늘", say: "출력축과 함께 돌며 각도판에서 각도를 가리킵니다.", select: piece("horn") },
    { id: "protractor", name: "각도판", say: "0~180° 눈금. 빨간 쐐기가 목표 각도입니다.", select: piece("protractor") },
    { id: "gears", name: "4단 감속 기어", say: "속도를 줄이고 토크를 키웁니다.", select: piece("gears") },
    { id: "motor", name: "직류 모터", say: "오차에 비례한 전압으로 돕니다.", select: piece("motor") },
    { id: "pot", name: "가변저항", say: "출력축 각도를 전압으로 알려 줍니다.", select: piece("pot") },
    { id: "pcb", name: "제어 회로", say: "목표와 지금 각도의 차이로 모터를 구동합니다.", select: piece("pcb") },
    { id: "drum", name: "드럼", say: "줄을 감아 추의 무게를 토크로 바꿉니다.", select: piece("drum") },
    { id: "load", name: "추와 줄", say: "0.25 kg 홈 추를 쌓아 부하를 겁니다.", select: piece("load") },
    { id: "ctrl", name: "제어 보드", say: "손잡이 각도에 맞춰 PWM 펄스를 만듭니다.", select: piece("ctrl") },
    { id: "cable", name: "3선 케이블", say: "전원, 접지, 신호선.", select: piece("cable") },
  ],

  main: { view: "load" },
  inset: { label: "추 없음, 90°", view: "rest" },
  steps: [
    { view: "rest", title: "펄스가 목표를 정함", text: "1.5 ms 펄스는 90°를 뜻합니다.", focus: ["ctrl", "cable", "protractor"] },
    { view: "rest", title: "가변저항이 각도를 잼", text: "출력축과 함께 도는 가변저항이 지금 각도를 알려 줍니다.", focus: ["pot", "horn"] },
    { view: "left", title: "오차만큼 모터를 돌림", text: "목표와 지금의 차이에 P 게인을 곱한 전압으로 모터가 돕니다.", focus: ["pcb", "motor"] },
    { view: "rest", title: "기어가 힘을 키움", text: `네 단 기어가 회전을 ${fmt.ratio(STD.N)}로 줄여 토크를 키웁니다.`, focus: ["gears"] },
    { view: "load", title: "추를 걸면 처짐", text: `2 kg 추에 바늘이 ${fmt.deg(LOAD.ess)} 처집니다.`, focus: ["load", "drum", "horn"] },
  ],
};
