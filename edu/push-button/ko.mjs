// Korean teaching content for the push-button figure (edu-kit schema: edu/kit/README.md).
// Numbers in braces come from the figure's model at the moment they are shown: {V} {R} {I} {P} {Inow} {Iend} {Pr} {circuit}.
const piece = (id) => `[data-piece="${id}"]`;

export default {
  lang: "ko",
  page: {
    title: "누름 버튼 · 교육판",
    kicker: "중학교 2학년 과학 · 전기와 자기",
    heading: "누름 버튼과 닫힌 회로",
    lead: "전지는 끊어진 곳 없이 고리처럼 이어진 닫힌 회로에서만 전류를 흐르게 합니다. 누름 버튼은 그 고리 중간에 있는 작은 틈입니다. 그림을 누르거나 학습 패널에서 전압과 저항을 바꾸어 전류와 전구 밝기가 어떻게 달라지는지 확인해 보십시오.",
    footer: "모델: 전구 저항은 온도와 관계없이 일정하다고 가정합니다(실제 필라멘트는 뜨거워질수록 저항이 커집니다). 전자의 이동 속도는 실제보다 훨씬 빠르게 그렸고, 점의 속도는 전류에 비례합니다.",
  },
  card: {
    fig: "그림 1",
    title: "누름 버튼",
    hint: "누르고 있기",
    readout: "열림 · 0 A",
    keys: [
      { mark: "lit", label: "누름단추와 구리 다리판: 누르면 움직이는 부분" },
      { mark: "raised", label: "접점 기둥 두 개: 다리판이 닫는 틈" },
      { mark: "blue", label: "파란 점: 전선 속 전자, 전류와 반대 방향으로 움직입니다" },
    ],
    // caption is filled in by build.mjs from the model defaults
  },
  keep: [".pb-glow"],
  questionDelay: 1400,
  start: "params",

  parts: [
    { id: "cap", name: "누름단추", say: "손가락으로 누르는 부분입니다. 아래의 막대와 구리 다리판을 함께 밀어 내립니다.", select: piece("cap") },
    { id: "spring", name: "되돌림 용수철", say: "누르지 않을 때 다리판을 들어 올려 회로를 열어 둡니다. 손을 떼면 다리판을 다시 올립니다.", select: piece("spring") },
    { id: "bridge", name: "구리 다리판", say: "전기가 잘 통하는 구리판입니다. 두 접점 기둥에 함께 닿으면 틈을 이어 회로를 닫습니다.", select: piece("bridge") },
    { id: "contacts", name: "접점 기둥", say: "회로가 끊어진 두 끝입니다. 다리판이 두 기둥에 닿아야 전류가 지나갑니다.", select: piece("contacts") },
    { id: "frame", name: "틀과 받침", say: "전기가 통하지 않는 절연체입니다. 막대가 곧게 오르내리도록 잡아 줍니다.", select: piece("frame") },
    { id: "cell", name: "전지", say: "{V}의 전압으로 회로에 전류를 흐르게 합니다. 위쪽 볼록한 단자가 (+)극입니다.", select: piece("cell") },
    { id: "bulb", name: "전구", say: "가는 필라멘트에 전류가 흐르면 뜨거워져 빛이 납니다. 저항 {R}, 정격 전력 {Pr}입니다.", select: piece("bulb") },
    { id: "wires", name: "전선", say: "전지, 스위치, 전구를 하나의 고리로 잇는 길입니다. 고리가 한 군데라도 끊기면 전류가 흐르지 않습니다.", select: piece("wires") },
  ],

  paramsIntro: "값을 바꾸면 그림과 판독값이 바로 바뀝니다. 그림을 눌러 회로를 닫아 보십시오.",
  params: [
    { id: "V", type: "range", label: "전지 전압 V", unit: "V", min: 1.5, max: 9, step: 0.5, value: 1.5, digits: 1, help: "1.5 V 전지를 2개 직렬로 이으면 3 V입니다." },
    { id: "R", type: "range", label: "전구 저항 R", unit: "Ω", min: 2, max: 20, step: 1, value: 5, digits: 0 },
    { id: "mode", type: "choice", label: "스위치 종류", value: "momentary", options: [{ value: "momentary", label: "순간 스위치" }, { value: "latch", label: "유지(걸쇠) 스위치" }], help: "순간 스위치는 누르는 동안만, 유지 스위치는 한 번 누르면 다시 누를 때까지 닫혀 있습니다." },
    { id: "flow", type: "toggle", label: "전자 이동 보기", value: true, on: "켬", off: "끔" },
    { id: "tap", type: "action", label: "누름단추 한 번 누르기", help: "순간 스위치는 잠깐 켜졌다 꺼지고, 유지 스위치는 켜짐과 꺼짐이 바뀝니다." },
  ],
  formulasTitle: "공식으로 계산한 값",
  formulas: [
    { label: "전류 (스위치를 닫았을 때)", text: "I = V ÷ R = {V} ÷ {R} = {I}" },
    { label: "전력 (전구 밝기)", text: "P = V × I = {V} × {I} = {P}" },
    { label: "지금 흐르는 전류", text: "{Inow} · {circuit}" },
  ],
  formulaNote: "전구의 정격 전력은 {Pr}입니다. 이보다 큰 전력이 걸리면 필라멘트가 너무 뜨거워져 끊어질 수 있습니다.",

  steps: [
    {
      title: "열린 회로",
      text: "용수철이 구리 다리판을 두 접점 기둥 위로 띄워 둡니다. 회로 중간에 틈이 있으니 열린 회로입니다. 전자는 전선 속에 있지만 움직이지 않습니다. 지금 전류는 {Inow}입니다.",
      focus: ["spring", "bridge", "contacts"],
      pose: { V: 1.5, R: 5, mode: "momentary", pressed: false },
    },
    {
      title: "누름단추를 누릅니다",
      text: "누름단추를 누르면 막대와 다리판이 함께 내려가고 용수철이 줄어듭니다. 다리판이 아직 기둥에 닿지 않아 전류는 흐르지 않습니다.",
      focus: ["cap", "spring"],
      pose: { V: 1.5, R: 5, mode: "momentary", pressed: 0.55 },
    },
    {
      title: "다리판이 기둥에 닿습니다",
      text: "다리판이 두 기둥에 동시에 닿습니다. 구리는 전기가 잘 통하므로 틈이 이어져 닫힌 회로가 됩니다.",
      focus: ["bridge", "contacts"],
      pose: { V: 1.5, R: 5, mode: "momentary", pressed: true },
    },
    {
      title: "전류가 흐릅니다",
      text: "전지가 {V}의 전압으로 회로 전체에 전류를 흐르게 합니다. 전류의 세기는 I = V ÷ R = {V} ÷ {R} = {I}입니다. 전류는 전지의 (+)극에서 나와 (−)극으로 들어갑니다. 파란 점(전자)은 그 반대 방향으로 움직입니다.",
      focus: ["cell", "wires"],
      pose: { V: 1.5, R: 5, mode: "momentary", pressed: true, flow: true },
    },
    {
      title: "전구가 켜집니다",
      text: "전류가 전구의 가는 필라멘트를 지나면 필라멘트가 뜨거워져 빛을 냅니다. 이때 전구의 전력은 P = V × I = {V} × {I} = {P}입니다.",
      focus: ["bulb"],
      pose: { V: 1.5, R: 5, mode: "momentary", pressed: true },
    },
    {
      title: "손을 떼면",
      text: "손을 떼면 용수철이 다리판을 다시 들어 올립니다. 회로가 열려 전구가 꺼집니다. 이런 스위치를 순간 스위치라고 합니다. 유지(걸쇠) 스위치는 손을 떼도 닫힌 상태가 그대로 남습니다.",
      focus: ["spring", "bridge"],
      pose: { V: 1.5, R: 5, mode: "momentary", pressed: false },
    },
    {
      title: "전류가 너무 크면",
      text: "전압을 {V}로 높이면 전류는 {I}, 전력은 {P}가 됩니다. 정격 전력 {Pr}보다 훨씬 커서 필라멘트가 녹아 끊어집니다. 필라멘트가 끊어지면 회로가 다시 열려 전류가 흐르지 않습니다.",
      focus: ["bulb"],
      pose: { V: 6, R: 5, mode: "momentary", pressed: true },
    },
  ],

  questions: [
    {
      q: "전압을 2배(1.5 V → 3 V)로 높이면 전구의 전력, 곧 밝기는 어떻게 됩니까?",
      choices: [{ label: "2배" }, { label: "4배", correct: true }, { label: "그대로" }, { label: "절반" }],
      from: { V: 1.5, R: 5, mode: "momentary", pressed: true },
      to: { V: 3, R: 5, mode: "momentary", pressed: true },
      focus: ["bulb"],
      explain: "전압이 2배가 되면 전류도 2배가 됩니다. 그래서 P = V × I는 2 × 2 = 4배입니다. 식으로 쓰면 P = V² ÷ R입니다. 그림의 값: {from.P} → {to.P} ({ratio.P})",
    },
    {
      q: "전압은 3 V 그대로 두고 전구 저항을 5 Ω에서 10 Ω으로 바꾸면 전류는 어떻게 됩니까?",
      choices: [{ label: "2배" }, { label: "절반", correct: true }, { label: "그대로" }, { label: "0 A" }],
      from: { V: 3, R: 5, mode: "momentary", pressed: true },
      to: { V: 3, R: 10, mode: "momentary", pressed: true },
      focus: ["bulb", "wires"],
      explain: "I = V ÷ R이므로 저항이 2배가 되면 전류는 절반이 됩니다. 그림의 값: {from.I} → {to.I} ({ratio.I}). 전류가 줄어 전구도 어두워집니다.",
    },
    {
      q: "유지(걸쇠) 스위치로 바꾸고 누름단추를 한 번 눌렀다 뗍니다. 전구는 어떻게 됩니까?",
      choices: [{ label: "바로 꺼진다" }, { label: "켜진 채로 있다", correct: true }],
      from: { V: 1.5, R: 5, mode: "latch", pressed: false },
      to: { tap: true },
      focus: ["cap", "bridge"],
      explain: "걸쇠가 다리판을 아래에 붙잡아 두어 손을 떼도 닫힌 회로가 유지됩니다. 손을 뗀 뒤 흐르는 전류: {to.Iend}. 한 번 더 누르면 걸쇠가 풀려 회로가 열립니다.",
    },
  ],
};
