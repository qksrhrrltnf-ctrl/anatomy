// Korean teaching content for the dial-indicator figure (edu-kit schema: edu/kit/README.md).
// Numbers in braces come from the figure's model when they are shown: {h} {perTurn} {turns} {whole} {deg}
// {ticks} {count} {div} {block} {h0} {rel} {cmp} {drag} {stiff} {zeta} {b1} {b2} {b3}.
// build.mjs writes the page footer (the unit note) from the model defaults.
export default {
  lang: "ko",
  page: {
    title: "다이얼 게이지",
    kicker: "기술·가정 · 제도와 측정",
    heading: "다이얼 게이지: 작은 높이 차를 바늘로 읽기",
    lead: "다이얼 게이지는 측정자의 작은 직선 운동을 바늘의 큰 회전으로 바꾸어 보여 줍니다. 높이를 아는 기준 블록과 비교하면 높이 차이를 바로 읽을 수 있습니다. 그림을 끌어 캐리지를 옮기고, 학습 패널에서 배율과 영점을 바꾸어 보십시오.",
  },
  card: {
    fig: "그림 1",
    title: "다이얼 게이지",
    hint: "끌어서 옮기기 · 다이얼 누르면 영점",
    keys: [
      { mark: "lit", label: "측정자와 바늘: 높이가 바뀌면 움직이는 부분" },
      { mark: "raised", label: "게이지 블록 세 개: 높이 {b1}, {b2}, {b3}" },
    ],
    caption: "정반 위의 다이얼 게이지입니다. 캐리지를 옮기면 측정자가 아래 블록의 높이만큼 오르내리고, 바늘이 같은 양만큼 돕니다. 지금 바늘 한 바퀴는 {perTurn} 이동이고, 한 바퀴를 {count}칸으로 나누므로 눈금 한 칸은 {div}입니다.",
  },
  start: "params",
  questionDelay: 1600,
  partsIntro: "부품을 누르면 그림에서 강조합니다. 한 번 더 누르면 풀립니다. 바늘처럼 가는 부품은 목록에서 고르면 찾기 쉽습니다.",

  parts: [
    { id: "block-1", name: "게이지 블록 1", say: "높이가 {b1}로 정해진 기준 블록입니다. 높이를 정확히 아는 블록과 비교해서 다른 물체의 높이를 잽니다." },
    { id: "block-2", name: "게이지 블록 2", say: "높이가 {b2}인 기준 블록입니다." },
    { id: "block-3", name: "게이지 블록 3", say: "높이가 {b3}인 기준 블록입니다. 세 블록 가운데 가장 낮습니다." },
    { id: "handle", name: "캐리지 손잡이", say: "캐리지를 밀고 당길 때 잡는 손잡이입니다. 미끄러지지 않게 겉면에 널링이 있습니다." },
    { id: "carriage", name: "캐리지", say: "블록을 싣고 레일 위를 미끄러지는 받침대입니다. 이 그림에서는 캐리지 윗면이 높이 0의 기준입니다." },
    { id: "plunger", name: "측정자", say: "블록 윗면에 닿아 함께 오르내리는 가는 막대입니다. 아래 끝의 둥근 접촉자가 측정면에 닿습니다. 지금 측정자 아래의 높이는 {h}입니다.", select: '[data-part="plunger"]' },
    { id: "stem", name: "스템", say: "측정자를 감싸서 위아래로만 곧게 움직이도록 안내하는 통입니다." },
    { id: "needle", name: "바늘", say: "측정자의 오르내림을 회전으로 바꾸어 보여 줍니다. 지금은 {perTurn} 움직이면 한 바퀴 돕니다.", select: '[data-part="needle"],[data-piece="hub"]' },
    { id: "face", name: "눈금판", say: "한 바퀴를 {count}칸으로 나눈 눈금입니다. 지금 한 칸은 {div}입니다. 판에 새겨진 0.01은 실제 게이지에서 한 칸이 0.01 mm라는 표시이고, 이 그림은 px 단위를 씁니다." },
    { id: "bezel", name: "베젤", say: "다이얼 둘레의 널링 테입니다. 이 테를 돌려 눈금 0을 바늘에 맞추는 것을 영점 맞추기라고 합니다. 그림에서는 다이얼을 누르면 영점이 맞춰집니다." },
    { id: "lock", name: "베젤 고정 손잡이", say: "다이얼 옆에 튀어나온 작은 손잡이입니다. 맞춘 영점이 돌아가지 않게 베젤을 고정하는 부분으로 그렸습니다." },
    { id: "arm", name: "팔", say: "클램프에서 다이얼까지 뻗은 막대입니다. 다이얼을 측정할 자리 바로 위에 붙잡아 둡니다." },
    { id: "clamp", name: "클램프", say: "기둥에 팔을 붙잡는 조임쇠입니다. 손나사를 조이면 팔의 높이와 방향이 고정됩니다." },
    { id: "post", name: "기둥", say: "베이스에서 곧게 선 둥근 기둥입니다. 클램프를 오르내려 다이얼 높이를 맞춥니다." },
    { id: "knob", name: "베이스 손잡이", say: "마그네틱 베이스 위의 손잡이입니다. 실제 베이스에서는 이것을 돌려 자석을 붙이거나 뗍니다." },
    { id: "base", name: "마그네틱 베이스", say: "자석의 힘으로 정반에 붙어 기둥과 다이얼 전체를 고정합니다. 게이지가 흔들리면 측정값을 믿을 수 없습니다." },
    { id: "rails", name: "레일과 멈춤 블록", say: "캐리지가 한 방향으로만 곧게 미끄러지도록 안내합니다. 양 끝의 멈춤 블록이 이동 범위를 막습니다." },
    { id: "scale", name: "자", say: "정반 앞쪽에 붙은 눈금 자입니다. 대략적인 위치를 볼 때 쓰고, 높이는 다이얼로 읽습니다." },
    { id: "plate", name: "정반", say: "측정 장치 전체를 받치는 평평한 판입니다. 게이지와 레일이 같은 평면 위에 있어야 높이를 바르게 비교할 수 있습니다." },
  ],

  paramsIntro: "값을 바꾸고 그림을 끌어 캐리지를 옮겨 보십시오. 그림을 누르고 있으면 끌 수 있습니다.",
  params: [
    { id: "block", type: "choice", label: "측정자 아래 블록", value: 1, options: [{ value: 1, label: "블록 1" }, { value: 2, label: "블록 2" }, { value: 3, label: "블록 3" }], help: "그림을 끌거나 화살표 키로 옮겨도 됩니다." },
    { id: "perTurn", type: "range", label: "바늘 1회전당 이동량 L", unit: "px", min: 5, max: 40, step: 1, value: 20, digits: 0, help: "값이 작을수록 바늘이 많이 돌아 작은 차이도 잘 보입니다. 대신 한 바퀴를 넘기 쉬워 회전수를 세어야 합니다." },
    { id: "zero", type: "choice", label: "영점 기준", value: 0, options: [{ value: 0, label: "없음" }, { value: 1, label: "블록 1" }, { value: 2, label: "블록 2" }, { value: 3, label: "블록 3" }], help: "기준 블록에서 눈금 0을 바늘에 맞추면 다른 블록과의 높이 차이를 바로 읽습니다. 없음이면 캐리지 윗면이 0입니다." },
    { id: "hide", type: "toggle", label: "판독값 가리기", value: false, on: "가림", off: "보임", help: "바늘과 눈금만 보고 높이를 읽는 연습을 합니다." },
    { id: "drag", type: "range", label: "측정자 감쇠 c", min: 4, max: 80, step: 2, value: 26, digits: 0, help: "값이 작으면 바늘이 흔들리다 멈춥니다. 바늘이 멈춘 뒤에 읽어야 합니다. 동작 줄이기 설정에서는 바늘이 흔들리지 않습니다." },
  ],
  formulasTitle: "공식으로 계산한 값",
  formulas: [
    { label: "바늘 회전수 n = h ÷ L", text: "{h} ÷ {perTurn} = {turns}바퀴" },
    { label: "바늘 위치", text: "{whole}바퀴 + {deg} · {ticks}칸째" },
    { label: "눈금 한 칸 = L ÷ 칸 수", text: "{perTurn} ÷ {count} = {div}" },
    { label: "비교 측정", text: "{cmp}" },
    { label: "감쇠비 ζ = c ÷ (2√k)", text: "{drag} ÷ (2√{stiff}) = {zeta} (1보다 작으면 흔들리며 멈춤)" },
  ],
  formulaNote: "h는 캐리지 윗면에서 잰 측정자 끝의 높이이고, k는 측정자 스프링의 강성입니다. 값은 캐리지가 멈춘 뒤를 기준으로 계산합니다.",

  steps: [
    {
      title: "높이를 재는 기준",
      text: "정반은 장치 전체를 받치는 평평한 판입니다. 캐리지는 레일을 따라 한 방향으로만 미끄러집니다. 이 그림은 캐리지 윗면을 높이 0으로 잡습니다.",
      focus: ["plate", "rails", "carriage"],
      pose: { block: 1, perTurn: 20, zero: 0, hide: false, drag: 26 },
    },
    {
      title: "게이지를 단단히 고정합니다",
      text: "마그네틱 베이스가 자석의 힘으로 정반에 붙습니다. 기둥과 클램프, 팔이 다이얼을 측정할 자리 위에 붙잡아 둡니다. 게이지가 흔들리면 측정값도 흔들립니다.",
      focus: ["base", "knob", "post", "clamp", "arm"],
      pose: { block: 1, perTurn: 20, zero: 0, hide: false, drag: 26 },
    },
    {
      title: "측정자가 블록에 닿습니다",
      text: "측정자는 스템 안에서 위아래로만 움직입니다. 블록 1이 아래로 오면 측정자 끝이 블록 윗면까지 올라갑니다. 올라간 높이는 {h}입니다.",
      focus: ["plunger", "stem", "block-1"],
      pose: { block: 1, perTurn: 20, zero: 0, hide: false, drag: 26 },
    },
    {
      title: "오르내림이 회전으로 바뀝니다",
      text: "게이지 안에서 측정자의 직선 운동이 바늘의 회전으로 바뀝니다. 이 그림에서는 {perTurn} 움직이면 바늘이 한 바퀴 돕니다. 그래서 바늘은 {h} ÷ {perTurn} = {turns}바퀴 돕니다.",
      focus: ["plunger", "needle", "face"],
      pose: { block: 1, perTurn: 20, zero: 0, hide: false, drag: 26 },
    },
    {
      title: "눈금을 읽습니다",
      text: "눈금판은 한 바퀴를 {count}칸으로 나눕니다. 한 칸은 {perTurn} ÷ {count} = {div}입니다. 블록 2에서 바늘은 {ticks}칸째를 가리키므로 높이는 {ticks} × {div} = {h}입니다.",
      focus: ["needle", "face", "block-2"],
      pose: { block: 2, perTurn: 20, zero: 0, hide: false, drag: 26 },
    },
    {
      title: "비교 측정: 영점 맞추기",
      text: "블록 1 위에서 베젤을 돌려 눈금 0을 바늘에 맞췄습니다. 이제 블록 2로 옮기면 바늘은 블록 1과의 차이만 보여 줍니다. 차이는 {rel}입니다. 높이를 아는 기준 블록과 비교해서 재는 방법을 비교 측정이라고 합니다.",
      focus: ["bezel", "face", "block-1", "block-2"],
      pose: { block: 2, perTurn: 20, zero: 1, hide: false, drag: 26 },
    },
    {
      title: "배율을 바꾸면",
      text: "1회전당 이동량을 {perTurn}로 줄였습니다. 같은 블록 1에서도 바늘은 {turns}바퀴를 돕니다. 바늘 위치만 보면 한 바퀴를 덜 돈 것과 구별할 수 없으므로 회전수를 함께 세어야 합니다.",
      focus: ["needle", "face"],
      pose: { block: 1, perTurn: 10, zero: 0, hide: false, drag: 26 },
    },
  ],

  questions: [
    {
      q: "바늘은 20 px 움직이면 한 바퀴 돕니다. 측정자 아래에 블록 2(높이 {b2})가 오면 바늘은 몇 바퀴 돌까요?",
      choices: [{ label: "0.5바퀴" }, { label: "0.7바퀴", correct: true }, { label: "0.9바퀴" }, { label: "1.4바퀴" }],
      from: { block: 1, perTurn: 20, zero: 0, hide: true, drag: 26 },
      to: { block: 2, hide: false },
      focus: ["needle", "face", "block-2"],
      explain: "회전수는 높이 ÷ 1회전당 이동량입니다. {to.h} ÷ {to.perTurn} = {to.turns}바퀴입니다. 바늘은 {to.count}칸 가운데 {to.ticks}칸째를 가리킵니다.",
    },
    {
      q: "1회전당 이동량을 20 px에서 10 px로 줄이면, 블록 3(높이 {b3}) 위에서 바늘은 어디를 가리킬까요?",
      choices: [{ label: "반 바퀴 자리(25칸째)" }, { label: "1/4바퀴 자리(12.5칸째)" }, { label: "눈금 0 (한 바퀴를 돌아 제자리)", correct: true }, { label: "바늘이 조금도 움직이지 않는다" }],
      from: { block: 3, perTurn: 20, zero: 0, hide: false, drag: 26 },
      to: { block: 3, perTurn: 10 },
      focus: ["needle", "face"],
      explain: "{to.h} ÷ {to.perTurn} = {to.turns}바퀴이므로 바늘은 한 바퀴를 돌아 0으로 돌아옵니다. 바늘 위치만 보면 높이 0과 같아 보입니다. 배율을 키우면 작은 차이를 잘 읽지만, 회전수를 세지 않으면 틀리게 읽습니다.",
    },
    {
      q: "블록 1({b1}) 위에서 영점을 맞췄습니다. 캐리지를 옮겨 블록 3({b3})이 오면 읽음 값은 얼마일까요?",
      choices: [{ label: "+8.0 px" }, { label: "−8.0 px", correct: true }, { label: "+10.0 px" }, { label: "−4.0 px" }],
      from: { block: 1, perTurn: 20, zero: 1, hide: false, drag: 26 },
      to: { block: 3 },
      focus: ["bezel", "face", "block-3"],
      explain: "영점을 맞춘 뒤에는 기준과의 차이만 읽습니다. {to.h} − {to.h0} = {to.rel}입니다. 블록 3이 블록 1보다 낮으므로 부호가 음수입니다.",
    },
  ],
};
