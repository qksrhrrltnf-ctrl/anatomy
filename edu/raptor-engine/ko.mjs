// Korean teaching content for the Raptor 2 figure (edu-kit schema: edu/kit/README.md).
// Numbers in braces come from the figure's model (live.js values()) at the moment they are shown.
// Fixed reference values ({Pc0} {F0} {dry} …) are the build's constants, passed through the same values() table.
const piece = (id) => `.it[data-piece="${id}"]`;
const named = (...names) => names.map((name) => `.it[data-name^="${name}"]`).join(",");

// The model's reference values: build.mjs reads them from here (one source for the drawing, the readout and the text).
// From the original figure (examples/raptor-engine/build.mjs, sheet.mjs): chamber pressure, sea-level thrust, nozzle exit,
// dry mass, mixture ratio, propellant temperatures. Secondary sources (footer): sea-level Isp, lowest throttle.
export const MODEL = {
  chamberBar: 300, // bar, main chamber at 100 %
  seaLevelTf: 230, // tf at 100 %
  exitM: 1.3, // m, nozzle exit diameter
  dryKg: 1630, // kg, dry mass
  mix: 3.6, // oxygen : methane by mass
  tLox: -183, // °C
  tCh4: -162, // °C
  ispSl: 347, // s, sea level at 100 % (Wikipedia "SpaceX Raptor", citing SpaceX, 2024-08-03)
  thrMin: 40, // %, lowest throttle (Wikipedia "SpaceX Raptor", citing Elon Musk, 2020-08-18)
  preburnerPc: 0.13, // share of chamber pressure while only the preburners burn (live.js PREBURNER_PC)
};
const MDOT0 = (MODEL.seaLevelTf * 1000) / MODEL.ispSl; // kg/s at 100 %
const kg = (value) => `${Math.round(value).toLocaleString("en-US")} kg`;

export default {
  lang: "ko",
  page: {
    title: "랩터 2 로켓엔진",
    kicker: "고등학교 통합과학·물리학 · 힘과 운동 / 화학 반응",
    heading: "로켓엔진은 어떻게 힘을 낼까",
    lead: "랩터 2는 액체 메탄과 액체 산소를 태우는 로켓엔진입니다. 두 액체를 펌프로 밀어 넣어 높은 압력에서 태우고, 뜨거운 가스를 노즐로 내뿜어 힘을 냅니다. 그림을 눌러 엔진을 분해해 보고, 학습 패널에서 스로틀을 바꾸어 압력과 추력이 어떻게 달라지는지 확인해 보십시오.",
    footer: `모델: 연소실 압력은 스로틀에 비례하고, 추진제 유량은 연소실 압력에 비례한다고 가정합니다(목이 막힌 노즐). 추력 = 진공 추력 × (압력 ÷ 정격 압력) − 대기압 × 노즐 출구 넓이입니다. 정격 압력 ${MODEL.chamberBar} bar, 해수면 추력 ${MODEL.seaLevelTf} tf, 출구 지름 ${MODEL.exitM} m, 혼합비 ${MODEL.mix} : 1, 건조 질량 ${MODEL.dryKg.toLocaleString("en-US")} kg은 그림의 기준값입니다. 정격 유량 약 ${Math.round(MDOT0)} kg/s는 해수면 비추력 약 ${MODEL.ispSl} s로 계산했습니다(출처: 위키백과 "SpaceX Raptor" 판본 비교표, SpaceX 2024-08-03 게시물 인용). 스로틀 하한 약 ${MODEL.thrMin} %는 위키백과 "SpaceX Raptor" 정보상자(Elon Musk 2020-08-18 게시물 인용)를 따랐습니다. 두 값 모두 2차 출처입니다. 화염의 길이와 폭은 그림을 위한 근사입니다. 라이트 테마에서는 화염이 붉은 잉크처럼 보이므로 다크 테마로 보기를 권합니다.`,
  },
  card: {
    fig: "그림 1",
    title: "랩터 2 · 시험대",
    readout: "1,630 kg · 정지",
    keys: [
      { mark: "blue", label: "파란 선: 산소가 지나는 부품(흐름 강조)" },
      { mark: "green", label: "초록 선: 메탄이 지나는 부품(흐름 강조)" },
    ],
    caption: "랩터 2는 SpaceX가 만든 전유량 다단 연소 엔진입니다. 액체 산소와 메탄을 질량비 {mix}로 쓰고, 기준값은 주연소실 압력 {Pc0}, 해수면 추력 {F0}, 엔진만의 질량 {dry}입니다. 산소는 모두 산소 과잉 예연소기를 지나며 산소 펌프를 돌리고, 메탄은 모두 연료 과잉 예연소기를 지나며 메탄 펌프를 돌립니다. 두 뜨거운 가스가 주연소실에서 만나므로 주연소실에는 점화기가 없습니다. 지금 스로틀 {thr}에서 압력은 {Pc}, 추력은 {F}입니다. 짐벌 위의 하중계가 연소 중인 엔진의 추력을 잽니다.",
  },
  start: "params",
  autoplay: true,
  questionDelay: 3000,

  partsIntro: "부품을 누르면 그림에서 강조합니다. 한 번 더 누르면 풀립니다. 가는 관은 그림에서 맞히기 어려우니 이 목록에서 고르십시오.",
  parts: [
    // detail parts first: when two selectors match the same group, the first one in this list wins
    { id: "loadcell", name: "하중계", say: "시험대 가로보에 달린 힘 센서입니다. 엔진이 위로 미는 힘, 곧 추력을 잽니다. 지금 읽는 값은 {load}입니다.", select: named("stand.loadcell") },
    { id: "actuator", name: "짐벌 작동기", say: "엔진을 밀고 당겨 방향을 트는 막대 두 개입니다. 로켓은 이렇게 엔진 방향을 바꾸어 조종합니다.", select: named("stand.actuator") },
    { id: "feed", name: "메탄 공급관", say: "시험대 위쪽에서 메탄 터보펌프 입구로 액체 메탄을 보내는 관입니다.", select: '.it[data-name="stand.feed"],.it[data-name^="stand.feed:"],.it[data-name^="stand.feed."]' },
    { id: "loxtap", name: "산소 분기관", say: "산소 덕트에서 산소를 조금 떼어 연료 과잉 예연소기로 보냅니다.", select: named("plumbing.lox-to-frpb") },
    { id: "jacket", name: "냉각 재킷 메탄관", say: "노즐과 연소실 벽을 식히며 데워진 메탄을 두 예연소기로 보냅니다. 대부분은 연료 과잉 예연소기로, 조금은 산소 과잉 예연소기로 갑니다.", select: named("plumbing.jacket-") },
    { id: "igniter", name: "점화기 관", say: "두 예연소기의 점화기로 이어지는 가는 관입니다. 엔진에서 점화기가 있는 곳은 예연소기 두 곳뿐입니다.", select: named("plumbing.igniter") },
    { id: "purge", name: "퍼지관", say: "점화 전과 정지 뒤에 관 속에 남은 추진제를 불어 내는 관입니다.", select: named("plumbing.purge") },
    { id: "sense", name: "감지관과 블록", say: "엔진 여러 곳의 압력을 블록 하나로 모아 제어기가 읽게 합니다.", select: named("plumbing.sense", "plumbing.block", "plumbing.port", "plumbing.pigtail", "plumbing.socket") },

    { id: "gimbal", name: "짐벌과 추력 퍽", say: "엔진이 내는 힘을 시험대로 전하는 연결부입니다. 짐벌이 엔진 방향을 조금씩 틀어 로켓의 방향을 조종합니다.", select: piece("gimbal") },
    { id: "otp", name: "산소 터보펌프", say: "액체 산소의 압력을 연소실 압력보다 높게 올리는 펌프입니다. 산소 과잉 예연소기의 뜨거운 가스가 터빈을 돌려 펌프를 움직입니다.", select: piece("otp") },
    { id: "orpb", name: "산소 과잉 예연소기", say: "산소 전부와 메탄 조금을 먼저 태웁니다. 산소가 훨씬 많아 너무 뜨겁지 않은 가스가 나오고, 이 가스가 산소 펌프의 터빈을 돌립니다.", select: piece("orpb") },
    { id: "lox", name: "산소 덕트와 주산소밸브", say: "산소 펌프에서 나온 액체 산소를 산소 과잉 예연소기로 보내는 굵은 관입니다. 밸브가 산소의 흐름을 열고 닫습니다.", select: piece("lox") },
    { id: "controller", name: "엔진 제어기와 배선", say: "밸브를 정해진 순서대로 열고 센서 값을 읽어 점화 과정을 진행하는 컴퓨터입니다. 배선 {cables}이 밸브와 점화기로 이어집니다.", select: piece("controller") },
    { id: "chamber", name: "분사기와 주연소실", say: "두 예연소기에서 온 뜨거운 가스가 분사기를 지나 만나서 탑니다. 지금 압력은 {Pc}입니다. 이미 뜨거운 가스가 만나므로 점화기가 따로 없습니다.", select: piece("chamber") },
    { id: "hotgas", name: "고온가스 매니폴드", say: "연료 과잉 예연소기에서 나온 뜨거운 가스를 주연소실 분사기로 옮기는 짧고 굵은 관입니다.", select: piece("hotgas") },
    { id: "ftp", name: "메탄 터보펌프와 연료 과잉 예연소기", say: "액체 메탄의 압력을 올리는 펌프와, 메탄 전부와 산소 조금을 태우는 예연소기입니다. 메탄이 많은 뜨거운 가스가 이 펌프의 터빈을 돌립니다.", select: piece("ftp") },
    { id: "downcomer", name: "다운커머와 주연료밸브", say: "메탄을 노즐 아래쪽 매니폴드로 내려보내는 관입니다. 메탄은 타기 전에 노즐과 연소실 벽 속을 지나며 벽을 식힙니다.", select: piece("downcomer") },
    { id: "plumbing", name: "배관", say: "가는 관 {lines}입니다. 감지관 {senses}는 압력을 재려고 블록 하나로 모이고, 나머지 {others}는 추진제 공급관, 퍼지관, 점화기 관입니다.", select: piece("plumbing") },
    { id: "nozzle", name: "노즐", say: "출구 지름 {exit}인 종 모양 관입니다. 뜨거운 가스를 넓히며 소리보다 빠르게 내보내 압력을 속도로 바꿉니다. 벽 속을 흐르는 메탄이 노즐을 식힙니다.", select: piece("nozzle") },
    { id: "stand", name: "시험대", say: "엔진을 노즐이 아래로 향하게 매달아 붙잡는 틀입니다. 위쪽 가로보에 하중계와 짐벌 작동기가 달려 있습니다.", select: piece("stand") },
  ],

  paramsIntro: "점화한 뒤 스로틀을 바꾸어 보십시오. 압력이 몇 분의 1초에 걸쳐 따라가고, 화염과 판독값이 함께 바뀝니다. 엔진이 꺼져 있으면 목표값만 바뀝니다.",
  params: [
    { id: "thr", type: "range", label: "스로틀 (연소실 압력)", unit: "%", min: MODEL.thrMin, max: 100, step: 5, value: 100, digits: 0, help: `랩터는 정격 압력의 약 ${MODEL.thrMin} %까지 줄일 수 있다고 알려져 있습니다(2차 출처, 아래 각주).` },
    { id: "path", type: "choice", label: "흐름 강조", value: "none", options: [{ value: "none", label: "없음" }, { value: "o2", label: "산소" }, { value: "ch4", label: "메탄" }, { value: "both", label: "둘 다" }], help: "산소(파랑)와 메탄(초록)이 지나는 부품을 색으로 표시합니다." },
    { id: "strip", type: "range", label: "떼어 낸 묶음", unit: "개", min: 0, max: 10, step: 1, value: 0, digits: 0, help: "노즐부터 바깥쪽 묶음을 하나씩 떼어 냅니다. 엔진이 타는 동안에는 떼어 낼 수 없습니다." },
  ],
  formulasTitle: "공식으로 계산한 값",
  formulas: [
    { label: "연소실 압력", text: "Pc = {Pc0} × {thr} = {Pc}" },
    { label: "추력 (해수면)", text: "F = {vac} × (Pc ÷ {Pc0}) − {back} = {F} ({FkN})" },
    { label: "추진제 유량 (약)", text: "ṁ = {mdot0} × (Pc ÷ {Pc0}) = {mdot} · 산소 {mox} + 메탄 {mch4}" },
    { label: "비추력", text: "Isp = F ÷ (ṁ × g) = {isp}" },
    { label: "추력 ÷ 엔진 무게", text: "{F} ÷ {dryT} = {twr}" },
    { label: "떼어 낸 묶음", text: "{strip} · 마지막: {stripLast}" },
  ],
  formulaNote: "{back}는 대기압(101,325 Pa)이 지름 {exit} 노즐 출구를 미는 힘입니다. 진공에서는 이 힘이 없어 정격 압력에서 추력이 {vac}가 됩니다. 1 tf는 질량 1톤인 물체가 받는 중력의 크기로, 약 9.8 kN입니다.",

  steps: [
    {
      title: "시험대에 매달린 엔진",
      text: "랩터 2는 액체 메탄과 액체 산소를 태우는 로켓엔진입니다. 노즐이 아래를 향하게 시험대에 매달려 있습니다. 엔진만의 질량은 {dry}입니다. 엔진이 내는 힘은 짐벌을 지나 위쪽 하중계로 전해집니다.",
      focus: ["gimbal", "loadcell"],
      pose: { thr: 100, path: "none", strip: 0, fire: false },
    },
    {
      title: "두 액체 추진제",
      text: "연료는 {tCh4}의 액체 메탄이고, 산화제는 {tLox}의 액체 산소입니다. 둘 다 아주 차가운 액체입니다. 추진제마다 터보펌프가 하나씩 있어 압력을 연소실보다 높게 올립니다. 산소 펌프는 가운데에, 메탄 펌프는 오른쪽 옆에 있습니다.",
      focus: ["otp", "ftp"],
      pose: { thr: 100, path: "both", strip: 10, fire: false },
    },
    {
      title: "메탄이 노즐을 식힙니다",
      text: "메탄은 타기 전에 다운커머를 따라 노즐 아래쪽까지 내려갑니다. 그다음 노즐과 연소실 벽 속을 지나 올라오면서 벽의 열을 가져갑니다. 그래서 수천 도의 가스가 지나가도 벽이 녹지 않습니다.",
      focus: ["downcomer", "nozzle", "jacket"],
      pose: { thr: 100, path: "ch4", strip: 10, fire: false },
    },
    {
      title: "예연소기가 펌프를 돌립니다",
      text: "산소는 모두 산소 과잉 예연소기에서 메탄 조금과 먼저 탑니다. 메탄은 모두 연료 과잉 예연소기에서 산소 조금과 먼저 탑니다. 이렇게 나온 뜨거운 가스가 각 펌프의 터빈을 돌립니다. 추진제가 모두 터빈을 지나므로 이 방식을 전유량 다단 연소라고 합니다.",
      focus: ["orpb", "ftp"],
      pose: { thr: 100, path: "both", strip: 10, fire: false },
    },
    {
      title: "점화 ① 예냉",
      text: "점화하기 전에 차가운 추진제를 조금 흘려 펌프와 관을 미리 식힙니다. 관이 따뜻하면 액체가 관 속에서 갑자기 끓어 펌프가 망가질 수 있기 때문입니다. 노즐 아래로 차가운 증기가 흘러나옵니다.",
      focus: ["nozzle"],
      pose: { thr: 100, path: "none", strip: 0, fire: true, hold: "chill" },
    },
    {
      title: "점화 ② 예연소기 점화",
      text: "제어기가 두 예연소기의 점화기를 켭니다. 터빈이 돌기 시작하고 펌프가 추진제를 밀어 넣습니다. 연소실 압력이 약 {Pcpre}까지 오르고, 노즐 끝에 주황빛 불꽃이 보입니다.",
      focus: ["orpb", "ftp", "controller"],
      pose: { thr: 100, path: "none", strip: 0, fire: true, hold: "spin" },
    },
    {
      title: "점화 ③ 주연소",
      text: "두 예연소기의 뜨거운 가스가 주연소실에서 만나 탑니다. 압력이 {Pc}까지 오르고 불꽃 색이 바뀝니다. 주연소실에는 점화기가 없습니다. 만나는 두 가스가 이미 뜨거워서 저절로 타기 때문입니다.",
      focus: ["chamber", "hotgas"],
      pose: { thr: 100, path: "none", strip: 0, fire: true, hold: null },
    },
    {
      title: "추력: 작용과 반작용",
      text: "노즐은 뜨거운 가스를 넓히며 소리보다 빠르게 아래로 내뿜습니다. 엔진이 가스를 아래로 미는 힘이 작용이고, 가스가 엔진을 위로 미는 힘이 반작용입니다. 두 힘은 크기가 같고 방향이 반대입니다. 하중계가 이 힘 {F}를 읽습니다. 엔진 무게의 약 {twr}입니다.",
      focus: ["nozzle", "loadcell"],
      pose: { thr: 100, path: "none", strip: 0, fire: true, hold: null },
    },
    {
      title: "스로틀로 힘 조절하기",
      text: "스로틀을 줄이면 펌프가 추진제를 덜 보내고 연소실 압력이 낮아집니다. 지금 압력은 {Pc}이고 추력은 {F}입니다. 화염이 짧아져 바닥에 닿지 않고, 노즐 테두리도 어두워집니다. 실험 탭에서 직접 바꾸어 보십시오.",
      focus: ["chamber", "nozzle"],
      pose: { thr: 40, path: "none", strip: 0, fire: true, hold: null },
    },
  ],

  questions: [
    {
      q: "엔진이 뜨거운 가스를 아래로 내뿜습니다. 이때 엔진은 어느 쪽으로 힘을 받습니까?",
      choices: [{ label: "위쪽", correct: true }, { label: "아래쪽" }, { label: "힘을 받지 않는다" }, { label: "옆쪽" }],
      from: { thr: 100, path: "none", strip: 0, fire: false },
      to: { thr: 100, path: "none", strip: 0, fire: true, hold: null },
      focus: ["nozzle", "loadcell"],
      explain: "엔진이 가스를 아래로 미는 것이 작용입니다. 가스도 엔진을 같은 크기로 위로 밉니다. 이것이 반작용, 곧 추력입니다. 그래서 하중계는 엔진이 위로 밀어 올리는 힘을 잽니다. 하중계 값: {from.load} → {to.load}. 로켓이 공기가 없는 우주에서도 날 수 있는 것은 바깥 공기를 미는 것이 아니라 자기가 내뿜는 가스를 밀기 때문입니다.",
    },
    {
      q: "엔진이 스로틀 100 %로 타고 있습니다. 스로틀을 50 %로 낮추면 추력은 어떻게 됩니까?",
      choices: [{ label: "정확히 절반이 된다" }, { label: "절반보다 조금 작아진다", correct: true }, { label: "절반보다 조금 커진다" }, { label: "그대로다" }],
      from: { thr: 100, path: "none", strip: 0, fire: true, hold: null },
      to: { thr: 50, path: "none", strip: 0, fire: true, hold: null },
      focus: ["chamber", "nozzle"],
      explain: "압력이 절반이 되면 가스가 노즐을 미는 힘도 절반이 됩니다. 하지만 바깥 공기가 노즐 출구를 거꾸로 미는 힘 {back}는 그대로입니다. 그래서 추력은 절반보다 조금 작아집니다. 그림의 값: {from.F} → {to.F} ({ratio.F}). 진공에서 쓰는 엔진에는 이 손실이 없습니다.",
    },
    {
      q: "주연소실에는 점화기가 없습니다. 그런데도 주연소실에서 불이 붙는 까닭은 무엇입니까?",
      choices: [{ label: "예연소기에서 이미 탄 뜨거운 가스가 만나기 때문이다", correct: true }, { label: "노즐로 공기가 들어오기 때문이다" }, { label: "펌프의 마찰열 때문이다" }, { label: "액체 산소가 저절로 불붙기 때문이다" }],
      from: { thr: 100, path: "none", strip: 0, fire: true, hold: "spin" },
      to: { thr: 100, path: "none", strip: 0, fire: true, hold: null },
      focus: ["orpb", "ftp", "chamber"],
      delay: 5500,
      explain: "산소가 많은 뜨거운 가스와 메탄이 많은 뜨거운 가스가 주연소실에서 만납니다. 두 가스는 이미 뜨거워서 만나자마자 나머지가 탑니다. 점화기는 예연소기 두 곳에만 있습니다. 예연소기 단계의 압력 {from.Pcpre}가 주연소에서 {to.Pc}까지 오르는 것을 그림의 판독값으로 확인하십시오.",
    },
    {
      q: "랩터는 스로틀 100 %에서 1초에 약 {mdot0}의 추진제를 씁니다. 이 가운데 산소는 대략 얼마입니까?",
      choices: [{ label: `약 ${kg(MDOT0 / (MODEL.mix + 1))}` }, { label: `약 ${kg(MDOT0 / 2)}` }, { label: `약 ${kg((MDOT0 * MODEL.mix) / (MODEL.mix + 1))}`, correct: true }, { label: `약 ${kg(MDOT0 * 0.9)}` }],
      from: { thr: 100, path: "none", strip: 0 },
      to: { thr: 100, path: "o2", strip: 0 },
      focus: ["otp", "orpb", "lox"],
      explain: "산소와 메탄을 질량비 {mix}로 섞습니다. 전체를 4.6으로 나누면 산소가 3.6, 곧 약 {oxShare}입니다. 그래서 산소 유량은 {to.mox}입니다. 메탄(CH₄) 16 g을 완전히 태우려면 산소(O₂) 64 g이 필요하므로 완전 연소의 질량비는 4 : 1입니다. 랩터는 그보다 메탄을 조금 더 넣습니다.",
    },
  ],
};

// Korean names and short readouts for the figure's own corner readout and aria text (live.js, via build.mjs).
export const pieces = {
  gimbal: { name: "짐벌과 추력 퍽", say: "짐벌 · 추력을 시험대로 전달" },
  otp: { name: "산소 터보펌프", say: "산소 터보펌프 · 산소 과잉 가스로 회전" },
  orpb: { name: "산소 과잉 예연소기", say: "산소 과잉 예연소기 · 산소 전부" },
  lox: { name: "산소 덕트와 주산소밸브", say: "산소 덕트 · 펌프에서 예연소기로" },
  chamber: { name: "분사기와 주연소실", say: "주연소실 · 점화기 없음" },
  nozzle: { name: "노즐", say: "노즐 · 메탄으로 냉각" },
  ftp: { name: "메탄 터보펌프와 연료 과잉 예연소기", say: "메탄 터보펌프 · 연료 과잉 가스로 회전" },
  hotgas: { name: "고온가스 매니폴드", say: "고온가스 매니폴드 · 연료 과잉 가스를 분사기로" },
  downcomer: { name: "다운커머와 주연료밸브", say: "다운커머 · 메탄을 냉각 재킷으로" },
  plumbing: { name: "배관", say: "배관" },
  controller: { name: "엔진 제어기와 배선", say: "엔진 제어기" },
  stand: { name: "시험대", say: "" },
};
