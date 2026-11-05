// Korean teaching content for the wind-turbine figure (edu-kit schema: edu/kit/README.md).
// Numbers in braces come from model.js at the moment they are shown.
const piece = (id) => `[data-piece="${id}"]`;
const BASE = { v: 8, cp: 0.44, dir: 0 };

export default {
  lang: "ko",
  page: {
    title: "풍력 발전기 · 교육판",
    kicker: "고등학교 기술·가정 · 에너지와 수송 기술",
    heading: "풍력 발전기: 바람의 운동 에너지를 전기로",
    lead: "블레이드는 바람의 운동 에너지 일부를 회전으로 바꾸고, 기어박스가 느린 회전을 빠르게 높여 발전기를 돌립니다. 풍속을 바꾸어 출력이 풍속의 세제곱으로 늘다가 정격에서 멈추는 까닭, 베츠 한계, 강풍에서 블레이드가 비틀어지는(피치) 모습을 확인하고, 그림을 끌어 바람 방향을 바꾸어 보십시오.",
    footer: "모델: 지름 90 m, 정격 2.0 MW의 일반적인 2 MW급 기어식 풍력 발전기를 어림했습니다. 공기 밀도 1.225 kg/m³, 정격 아래에서는 Cp와 날개 끝 속도비(λ = 8)가 일정하다고 보고, 정격 위의 피치각은 출력을 정격으로 묶는 데 필요한 Cp로부터 어림식(0°에서 약 25°)으로 정했습니다. 발전기·기어 효율은 Cp에 포함했습니다. 블레이드는 실제로는 뿌리에서 끝으로 비틀린 날개꼴이지만 그림에서는 납작하게 가늘어지는 판으로 단순화했고, 피치가 커질수록 폭이 좁아 보이게 그렸습니다. 나셀은 내부가 보이도록 실제 비율보다 크게, 탑은 짧게 그렸습니다. 공기 점의 속도는 풍속에 비례하며, 로터 뒤에서는 운동량 이론의 후류 속도 v(1 − 2a)로 느려집니다. 요 회전은 실제(초당 약 0.5°)보다 빠르게 보여 줍니다.",
  },
  card: {
    fig: "그림 1",
    title: "풍력 발전기",
    hint: "끌어서 바람 방향 바꾸기",
    readout: "8.0 m/s · 0.88 MW",
    keys: [
      { mark: "lit", label: "밝은 화살표: 바람이 불어오는 방향(받침 위 눈금판)" },
      { mark: "raised", label: "밝은 몸체: 증속 기어박스" },
      { mark: "dotted", label: "점: 공기의 흐름, 로터 뒤에서 느려집니다" },
    ],
    caption: "지금 풍속은 {v}입니다. 바람이 가진 일률은 {Pw}이고, 블레이드가 그중 Cp {cpNow}만큼을 회전으로 바꾸어 발전기 출력은 {P}입니다. 로터는 {rpm}의 속도로 천천히 돌지만 기어박스가 100배로 높여 발전기는 {genRpm}의 속도로 돕니다. 운전 구간: {region}, 피치각 {pitch}.",
  },
  questionDelay: 2200,
  start: "params",
  partsIntro: "부품 이름을 누르면 그림에서 강조됩니다.",

  parts: [
    { id: "rotor", name: "블레이드", say: "바람이 날개꼴 블레이드에 양력을 만들어 로터를 돌립니다. 지름 90 m, 지금 날개 끝 속도는 {tip}입니다.", select: piece("rotor") },
    { id: "hub", name: "허브와 스피너", say: "블레이드 세 장을 붙잡고 회전을 저속축에 전합니다. 안에 블레이드 각도를 돌리는 피치 구동기가 있습니다(지금 피치각 {pitch}).", select: piece("hub") },
    { id: "shaft", name: "저속축(주축)", say: "로터와 같은 속도({rpm})로 돌며 큰 토크를 기어박스로 전합니다.", select: piece("shaft") },
    { id: "bearing", name: "주 베어링", say: "무거운 로터의 무게와 바람이 미는 힘을 받쳐 줍니다.", select: piece("bearing") },
    { id: "gearbox", name: "증속 기어박스", say: "유성 기어와 평행축 기어로 회전 속도를 100배 높입니다. 저속축 {rpm} → 고속축 {genRpm}.", select: piece("gearbox") },
    { id: "brake", name: "고속축과 디스크 브레이크", say: "기어박스와 발전기를 잇는 빠른 축입니다. 원판 브레이크는 정비하거나 비상일 때 로터를 멈춥니다.", select: piece("brake") },
    { id: "generator", name: "발전기", say: "빠르게 도는 회전자가 코일 속 자기장을 바꾸어 전기를 만듭니다. 지금 출력은 {P}입니다.", select: piece("generator") },
    { id: "bedplate", name: "베드플레이트", say: "나셀 속 모든 장치를 받치는 강철 바닥 틀입니다.", select: piece("bedplate") },
    { id: "yaw", name: "요 구동기", say: "탑 꼭대기의 큰 톱니바퀴(요 베어링)를 돌려 나셀 전체를 바람 쪽으로 돌립니다.", select: piece("yaw") },
    { id: "met", name: "풍속계와 풍향계", say: "나셀 지붕에서 풍속과 바람 방향을 잽니다. 제어반은 이 값으로 피치와 요를 조절합니다.", select: piece("met") },
    { id: "cabinet", name: "제어반", say: "풍속, 회전 속도, 출력을 보고 피치각과 요, 브레이크를 조절합니다.", select: piece("cabinet") },
    { id: "cover", name: "나셀 덮개", say: "장치를 비와 바람에서 지키는 덮개입니다. 그림에서는 가까운 쪽과 윗면을 떼어 냈습니다.", select: piece("cover") },
    { id: "tower", name: "탑과 요 베어링", say: "세 토막의 강철 원통을 이어 세운 탑입니다. 꼭대기의 톱니 달린 요 베어링 위에서 나셀이 돕니다.", select: piece("tower") },
    { id: "windarrow", name: "풍향 화살표", say: "받침 위 눈금판에서 바람이 불어오는 쪽을 가리킵니다. 그림을 끌면 돌아갑니다.", select: piece("windarrow") },
    { id: "pad", name: "기초", say: "탑을 붙잡는 콘크리트 기초입니다. 둘레에 앵커 볼트가 박혀 있습니다.", select: piece("pad") },
    { id: "transformer", name: "변압기", say: "발전기의 낮은 전압(약 690 V)을 송전에 알맞은 높은 전압으로 올립니다.", select: piece("transformer") },
  ],

  paramsIntro: "값을 바꾸면 블레이드 회전과 피치, 공기 흐름, 출력 곡선 위의 점이 모델대로 바뀝니다. 그림을 끌면 바람 방향이 바뀝니다.",
  params: [
    { id: "v", type: "range", label: "풍속 v", unit: "m/s", min: 0, max: 30, step: 0.5, value: 8, digits: 1, help: "기동 풍속 3.5 m/s, 정지 풍속 25 m/s입니다." },
    { id: "cp", type: "range", label: "출력 계수 Cp (블레이드 효율)", unit: "", min: 0.2, max: 0.59, step: 0.01, value: 0.44, digits: 2, help: "베츠 한계 16/27 = 0.593보다 클 수 없습니다. 실제 대형 풍력 발전기는 약 0.45입니다." },
    { id: "dir", type: "range", label: "바람 방향", unit: "°", min: -30, max: 30, step: 1, value: 0, digits: 0, help: "기준 방향에서 돌아간 각입니다. 그림을 끌어도 바뀝니다." },
    { id: "air", type: "toggle", label: "공기 흐름 보기", value: true, on: "켬", off: "끔" },
  ],
  formulasTitle: "모델로 계산한 값",
  formulas: [
    { label: "바람이 가진 일률", text: "P바람 = ½ρAv³ = ½ × 1.225 × {A} × ({v})³ = {Pw}" },
    { label: "베츠 한계", text: "Cp ≤ 16/27 = 0.593 → 최대 {betzP}" },
    { label: "발전기 출력", text: "{Ptext}" },
    { label: "로터 회전 속도", text: "{rpmText}" },
    { label: "증속 기어박스 (1 : 100)", text: "발전기 = 로터 × 100 = {rpm} × 100 = {genRpm}" },
    { label: "피치각 · 운전 구간", text: "{pitch} · {region}" },
  ],
  formulaNote: "A = π × (45 m)² 은 블레이드가 쓸고 지나가는 원의 넓이입니다. 정격 풍속은 Cp에 따라 바뀝니다(지금 {vRated}).",

  steps: [
    {
      title: "바람에는 운동 에너지가 있습니다",
      text: "1초 동안 로터 원판을 지나는 공기의 운동 에너지가 바람의 일률 ½ρAv³입니다. 지금 풍속 {v}에서 {Pw}입니다. 블레이드는 이 중 일부만 회전으로 바꿉니다.",
      focus: ["rotor", "windarrow"],
      pose: { ...BASE },
    },
    {
      title: "블레이드: 양력으로 돕니다",
      text: "블레이드 단면은 비행기 날개와 같은 날개꼴입니다. 바람이 지나가며 양력이 생기고, 그 힘이 로터를 돌립니다. 날개 끝은 {tip}로 바람보다 훨씬 빠르게 움직입니다.",
      focus: ["rotor", "hub"],
      pose: { ...BASE },
    },
    {
      title: "풍속의 세제곱",
      text: "풍속이 {v}이면 바람의 일률은 {Pw}, 출력은 {P}입니다. 풍속이 2배가 되면 일률은 2³ = 8배가 됩니다. 그래서 바람이 센 곳에 풍력 단지를 짓습니다.",
      focus: ["rotor", "generator"],
      pose: { v: 10, cp: 0.44, dir: 0 },
    },
    {
      title: "베츠 한계: 바람을 다 멈출 수는 없습니다",
      text: "로터가 바람을 완전히 멈추면 뒤의 공기가 빠져나가지 못해 새 바람이 들어오지 못합니다. 그래서 어떤 로터도 바람 일률의 16/27(약 59 %)보다 많이 얻을 수 없습니다. 로터 뒤의 공기 점이 느려지는 것을 보십시오.",
      focus: ["rotor"],
      pose: { v: 8, cp: 0.59, dir: 0 },
    },
    {
      title: "저속축과 증속 기어박스",
      text: "로터는 {rpm}의 속도로 느리게 돌지만 힘(토크)이 매우 큽니다. 기어박스가 회전 속도를 100배 높여 발전기를 {genRpm}의 속도로 돌립니다. 속도가 높아지는 만큼 토크는 작아집니다.",
      focus: ["shaft", "bearing", "gearbox"],
      pose: { ...BASE },
    },
    {
      title: "발전기",
      text: "고속축이 발전기를 돌리면 전자기 유도로 전기가 만들어집니다. 지금 출력은 {P}입니다. 탑 아래 변압기가 전압을 높여 전력망으로 보냅니다.",
      focus: ["brake", "generator", "transformer"],
      pose: { ...BASE },
    },
    {
      title: "정격 풍속보다 강하면 피치로 버립니다",
      text: "풍속 {v}에서 바람의 일률은 {Pw}이지만 발전기는 정격 {P}까지만 낼 수 있습니다. 블레이드를 비틀어(피치각 {pitch}) 바람을 일부 흘려보내 출력과 회전 속도를 일정하게 지킵니다.",
      focus: ["rotor", "hub"],
      pose: { v: 18, cp: 0.44, dir: 0 },
    },
    {
      title: "폭풍에서는 멈춥니다",
      text: "풍속이 정지 풍속 25 m/s를 넘으면(지금 {v}) 블레이드를 바람과 나란하게 세우고(피치각 {pitch}) 브레이크로 로터를 세워 기계를 보호합니다. 출력은 {P}입니다.",
      focus: ["rotor", "brake"],
      pose: { v: 27, cp: 0.44, dir: 0 },
    },
    {
      title: "요: 바람을 마주 봅니다",
      text: "바람 방향이 바뀌면 풍향계가 이를 알아채고, 요 구동기가 탑 꼭대기의 톱니를 돌려 나셀이 다시 바람을 마주 보게 합니다. 그림을 끌어 바람 방향을 바꾸어 보십시오.",
      focus: ["yaw", "met", "windarrow"],
      pose: { v: 8, cp: 0.44, dir: -25 },
    },
  ],

  questions: [
    {
      q: "풍속이 5 m/s에서 10 m/s로 2배가 되면 발전기 출력은 몇 배가 됩니까? (두 풍속 모두 정격보다 낮습니다)",
      choices: [{ label: "2배" }, { label: "4배" }, { label: "8배", correct: true }],
      from: { v: 5, cp: 0.44, dir: 0 },
      to: { v: 10, cp: 0.44, dir: 0 },
      focus: ["rotor", "generator"],
      explain: "P = ½ρAv³Cp이므로 출력은 풍속의 세제곱에 비례합니다. 그림의 값: {from.P} → {to.P} ({ratio.P}).",
    },
    {
      q: "블레이드를 아무리 잘 만들어도 Cp를 0.7로 만들 수 없는 까닭은 무엇입니까?",
      choices: [
        { label: "블레이드가 무거워서" },
        { label: "바람을 완전히 멈추면 뒤의 공기가 빠지지 않아 새 바람이 들어오지 못해서", correct: true },
        { label: "발전기가 뜨거워져서" },
      ],
      from: { v: 8, cp: 0.44, dir: 0 },
      to: { v: 8, cp: 0.59, dir: 0 },
      focus: ["rotor"],
      explain: "운동량 이론에서 로터가 바람을 1/3로 늦출 때 얻는 몫이 가장 크며, 그 값이 베츠 한계 16/27 ≈ 0.593입니다. 그림의 값: Cp 0.59일 때 출력 {to.P}, 이론 최대 {to.betzP}.",
    },
    {
      q: "풍속이 15 m/s에서 20 m/s로 세지면 출력은 어떻게 됩니까?",
      choices: [{ label: "약 2.4배가 된다" }, { label: "그대로다", correct: true }, { label: "0이 된다" }],
      from: { v: 15, cp: 0.44, dir: 0 },
      to: { v: 20, cp: 0.44, dir: 0 },
      focus: ["rotor", "hub", "generator"],
      explain: "정격 풍속 위에서는 피치를 키워 남는 바람을 흘려보내므로 출력이 정격에 머뭅니다. 그림의 값: 출력 {from.P} → {to.P}, 피치각 {from.pitch} → {to.pitch}.",
    },
    {
      q: "기어박스를 빼고 발전기를 로터에 바로 연결하면(직접 구동식) 발전기는 어떻게 돌까요?",
      choices: [{ label: "로터처럼 느리게 돈다", correct: true }, { label: "그래도 빠르게 돈다" }, { label: "돌지 않는다" }],
      from: { v: 10, cp: 0.44, dir: 0 },
      to: { v: 10, cp: 0.44, dir: 0 },
      focus: ["gearbox", "generator"],
      explain: "발전기는 로터와 같은 {to.rpm}의 속도로 돕니다(기어박스가 있으면 {to.genRpm}). 느린 회전에서도 전기를 만들려면 자석과 코일(극)을 아주 많이 단 지름이 큰 발전기가 필요합니다. 그래서 직접 구동식은 나셀 앞쪽이 크고 둥급니다.",
    },
  ],
};
