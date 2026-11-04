// Korean teaching content for the ripple tank (edu-kit schema: edu/kit/README.md).
// {key}: filled at run time from the page's model (adapter.values → model.mjs valuesOf).
// {{key}}: filled once by build.mjs from the drawing's geometry and the model (lamp height, magnification…).
// Ranges, defaults and the numbers in the answer choices come from model.mjs, so nothing here is typed twice.
import * as M from "./model.mjs";

const optics = { magnification: 1, caustic: 0 }; // nodal counts depend on λ and d only
const nodal = (f, dCm, h) => M.stateAt(f, dCm * 10, h, optics).nodal;
const base = { f: 16, d: 5, h: 6, sources: 2, guide: false, freeze: false };
const sel = (id) => `[data-part="${id}"]`;

const Q1 = { from: { ...base, f: 20, d: 4 }, to: { ...base, f: 20, d: 8, guide: true } };
const Q2 = { from: { ...base, f: 8, d: 5 }, to: { ...base, f: 24, d: 5, guide: true } };
const Q3 = { from: { ...base, f: 8, d: 6.5, h: 6 }, to: { ...base, f: 8, d: 6.5, h: 3, guide: true } };
const N = (pose) => nodal(pose.f, pose.d, pose.h);

export default {
  lang: "ko",
  page: {
    title: "물결통 · 교육판",
    kicker: "중학교 과학 · 파동 / 고등학교 물리학 · 파동의 간섭과 굴절",
    heading: "물결통으로 보는 파동의 간섭",
    lead: "접촉구가 물을 두드리면 물결이 퍼져 나갑니다. 진동수, 파원 간격, 수심을 바꾸며 파장과 마디선이 어떻게 달라지는지 살펴보십시오. 그림의 수조 위를 끌거나 학습 패널의 슬라이더를 움직이면 됩니다.",
    footer: "모델: 물결의 속력은 중력과 표면장력을 함께 넣은 분산 관계 ω² = (gk + σk³/ρ) tanh kh로 계산합니다. 수심 슬라이더는 계산에 쓰는 물의 깊이만 바꾸고, 그림 속 물 높이는 그대로 둡니다. 감쇠는 맑은 물의 점성만 넣었으므로 실제 수조보다 물결이 멀리 갑니다. 파원을 1개로 바꾸면 두 번째 물결은 수조 전체에서 함께 약해집니다(실제로는 마지막 물결이 퍼져 나가며 사라집니다).",
  },
  card: {
    fig: "그림 3",
    title: "물결통",
    hint: "수조 위를 끌어 진동수·간격 · 화살표 키",
    keys: [
      { mark: "lit", label: "같은 위상으로 움직이는 두 접촉구: 파원" },
      { mark: "raised", label: "다리 위의 수조, 브리지와 진동 막대" },
      { mark: "flat", label: "{{paperDown}} 아래의 종이: 무늬가 {{mag}}배로 비칩니다" },
    ],
    caption:
      "스트로보 빛으로 본 물결통입니다. 진동 막대에 달린 접촉구가 깊이 {h}의 물을 같은 위상으로 두드립니다. 램프는 접촉구보다 {seen} 낮은 진동수로 깜박이므로 물결이 천천히 퍼지는 것처럼 보입니다. 이렇게 작은 물결은 중력과 표면장력이 함께 되돌리므로 ω² = (gk + σk³/ρ) tanh kh를 따릅니다. 지금 진동수 {f}에서 파장은 {lambda}이고, 마루는 1초에 {v} 나아갑니다. 두 파원까지의 거리 차가 반 파장의 홀수 배인 곳에서는 물결이 서로 지워지므로, 간격이 d인 두 파원은 마디선을 2⌊d/λ + ½⌋개 만듭니다. {Nsay} 물결의 마루는 약한 볼록렌즈처럼 빛을 굴절시켜, 물 위 {{lampUp}}의 램프 빛을 물 아래 {{paperDown}}의 종이에 {{mag}}배 크기의 밝은 줄무늬로 비춥니다. 줄무늬 사이의 회색 띠가 마디선입니다. 수조 벽 안쪽의 경사 해변은 물결을 흡수해 반사를 막습니다.",
  },
  partAttr: "data-part",
  start: "params",
  questionDelay: 2200,

  parts: [
    { id: "dipper-far", name: "파원 A (뒤 접촉구)", say: "진동 막대에 달린 작은 공입니다. 1초에 {f}의 진동수로 물을 두드려 동그란 물결을 만듭니다." },
    { id: "dipper-near", name: "파원 B (앞 접촉구)", say: "파원 A와 같은 막대에 달려 늘 같은 위상으로 움직입니다. 파원을 1개로 하면 이 공이 물 위로 들립니다. 끌면 간격이 바뀝니다." },
    { id: "bar", name: "진동 막대", say: "모터의 떨림을 두 접촉구에 똑같이 전합니다. 막대 위 눈금으로 접촉구 간격을 맞춥니다. 지금 간격은 {d}입니다." },
    { id: "eccentric", name: "편심 바퀴", say: "무게중심이 축에서 벗어난 바퀴입니다. 한 바퀴 돌 때마다 막대를 한 번 들었다 놓으므로, 회전수가 곧 진동수입니다." },
    { id: "motor", name: "진동 모터", say: "막대 위에 얹힌 작은 모터입니다. 1초에 돌아가는 횟수가 접촉구의 진동수({f})가 됩니다." },
    { id: "spring", name: "코일 스프링", say: "진동 막대를 브리지에 매달아 줍니다. 막대가 위아래로 자유롭게 떨 수 있게 합니다." },
    { id: "bridge", name: "브리지", say: "수조 위를 가로지르는 보입니다. 스프링과 진동 막대를 받칩니다." },
    { id: "water", name: "물", say: "깊이 {h}의 물입니다. 물결의 속력은 수심과 진동수에 따라 달라집니다. 지금 속력은 {v}입니다.", select: ".rt-water" },
    { id: "beach", name: "경사 해변", say: "수조 벽 안쪽의 비탈진 흡수재입니다. 벽에 닿은 물결을 흡수해 반사파가 무늬를 흐리지 않게 합니다.", select: ".rt-beach" },
    { id: "tank", name: "유리 바닥 수조", say: "바닥이 유리라서 위에서 비춘 빛이 물을 지나 아래 종이까지 내려갑니다." },
    { id: "legs", name: "다리와 수평 나사", say: "다리 아래 나사를 돌려 수조를 수평으로 맞춥니다. 수조가 기울면 한쪽이 얕아져 그쪽 물결의 파장이 짧아집니다." },
    { id: "lamp", name: "스트로보 램프", say: "1초에 {lamp}의 진동수로 깜박입니다. 물결보다 조금 느리게 깜박여서 물결이 천천히 퍼지는 것처럼 보입니다." },
    { id: "lamp-stand", name: "램프 기둥과 팔", say: "램프를 물 위 {{lampUp}} 높이에 붙잡아 둡니다." },
    { id: "paper", name: "종이 스크린", say: "물결의 마루가 렌즈처럼 빛을 모아 밝은 줄무늬를 비춥니다. 무늬는 실제보다 {{mag}}배 크게 보입니다. 지금 종이 위 파장은 {proj}입니다.", select: ".rt-sheet, .rt-tape" },
    { id: "guide", name: "마디선 (예측)", say: "두 파원까지의 거리 차가 반 파장의 홀수 배인 점을 이은 곡선입니다. 물이 거의 출렁이지 않아 회색 띠로 보입니다. {Nline}" },
    { id: "knob", name: "진동수 손잡이", say: "돌려서 진동수를 {{fMin}}에서 {{fMax}} 사이로 정합니다." },
    { id: "meter", name: "진동수 계기", say: "바늘이 지금 진동수 {f}를 가리킵니다." },
    { id: "switch", name: "전원 스위치와 표시등", say: "장치 전체의 전원을 켜고 끕니다. 표시등이 켜져 있으면 전기가 들어온 상태입니다." },
    { id: "box", name: "조절 상자", say: "모터와 램프에 전기를 보내고 진동수를 정합니다." },
    { id: "cable", name: "전선", say: "조절 상자에서 모터와 램프로 전기를 보냅니다." },
    { id: "ruler", name: "눈금자", say: "종이 위 무늬의 간격을 잴 수 있습니다. 잰 길이를 {{mag}}으로 나누면 물 위의 실제 길이가 됩니다." },
    { id: "base", name: "받침판", say: "장치 전체를 받치는 판입니다. 종이 스크린이 이 위에 붙어 있습니다." },
    { id: "label", name: "이름판", say: "장치 이름이 새겨진 판입니다." },
  ],
  partsIntro: "부품을 누르면 그림에서 강조합니다. 한 번 더 누르면 풀립니다. 전선이나 마디선처럼 가는 부품은 이 목록에서 고르는 편이 쉽습니다.",

  paramsIntro: "슬라이더를 움직이거나 그림의 수조 위를 끌어 보십시오. 접촉구를 끌면 간격이 바뀝니다. 값을 바꾸면 새 물결이 접촉구에서부터 퍼져 나가므로, 무늬가 다 바뀔 때까지 1~2초 기다리십시오.",
  params: [
    { id: "f", type: "range", label: "진동수 f", unit: "Hz", min: M.RANGE.frequency[0], max: M.RANGE.frequency[1], step: 0.5, value: base.f, digits: 1, help: "접촉구가 1초에 물을 두드리는 횟수입니다. 높이면 파장이 짧아집니다." },
    { id: "d", type: "range", label: "파원 간격 d", unit: "cm", min: M.RANGE.spacing[0] / 10, max: M.RANGE.spacing[1] / 10, step: 0.1, value: base.d, digits: 1, help: "두 접촉구 사이의 거리입니다. 넓히면 마디선이 늘어납니다." },
    { id: "h", type: "range", label: "수심 h", unit: "mm", min: M.DEPTH[0], max: M.DEPTH[1], step: 0.5, value: base.h, digits: 1, help: "계산에 쓰는 물의 깊이입니다. 그림 속 물 높이는 그대로입니다. 진동수가 낮을 때 효과가 큽니다." },
    { id: "sources", type: "choice", label: "파원 수", value: base.sources, options: [{ value: 1, label: "1개" }, { value: 2, label: "2개" }], help: "1개로 하면 앞 접촉구가 물 위로 들립니다." },
    { id: "guide", type: "toggle", label: "예측 마디선 겹쳐 보기", value: base.guide, help: "공식으로 계산한 마디선을 파란 점선으로 겹쳐 보여 줍니다. 값을 바꾼 직후에는 물결이 따라오는 동안 잠깐 어긋납니다." },
    { id: "freeze", type: "toggle", label: "물결 멈춰 보기", value: base.freeze, help: "램프 깜박임을 진동수에 딱 맞춥니다. 물결이 멈춘 것처럼 보입니다." },
  ],
  formulasTitle: "공식으로 계산한 값",
  formulas: [
    { label: "파장", text: "λ = v ÷ f = {v} ÷ {f} ≈ {lambda}" },
    { label: "분산 관계 (모델)", text: "ω² = (gk + σk³/ρ) · tanh kh, 수심 h = {h}" },
    { label: "마디선 수", text: "{Nline}" },
    { label: "종이 위 파장", text: "λ × {{mag}} = {proj}" },
    { label: "겉보기 진동수 (스트로보)", text: "f − f램프 = {f} − {lamp} = {seen}" },
  ],
  formulaNote: "⌊ ⌋는 소수점 아래를 버린다는 뜻입니다. 표의 d/λ + ½도 버림으로 적었습니다.",

  steps: [
    {
      title: "물결 만들기",
      text: "모터가 돌면 편심 바퀴가 진동 막대를 흔듭니다. 막대에 달린 접촉구가 1초에 {f}의 진동수로 물을 두드리면 동그란 물결이 퍼져 나갑니다. 지금은 파원이 하나입니다.",
      focus: ["motor", "eccentric", "bar", "dipper-far"],
      pose: { ...base, sources: 1 },
    },
    {
      title: "빛으로 물결 보기",
      text: "물결의 마루는 볼록렌즈처럼 빛을 굴절시켜 한곳으로 모읍니다. 그래서 아래 종이에 밝은 줄이 생깁니다. 램프는 {lamp}로 깜박여서 물결이 느리게 움직이는 것처럼 보여 줍니다. 종이 위 무늬는 실제보다 {{mag}}배 큽니다.",
      focus: ["lamp", "water", "paper"],
      pose: { ...base, sources: 1 },
    },
    {
      title: "진동수와 파장",
      text: "진동수를 {f}로 높였습니다. 파장이 {lambda}로 짧아졌습니다. 물결의 속력 v, 진동수 f, 파장 λ 사이에는 v = fλ가 성립합니다. 지금 속력은 {v}입니다.",
      focus: ["knob", "meter", "paper"],
      pose: { ...base, sources: 1, f: 24 },
    },
    {
      title: "수심과 파장",
      text: "진동수 {f}에서 물을 {h}로 얕게 했습니다. 얕은 물에서는 물결이 느려집니다({{v8h6}} → {v}). 진동수는 그대로이므로 파장이 {{l8h6}}에서 {lambda}로 짧아집니다. 물결이 깊은 곳에서 얕은 곳으로 비스듬히 들어가면, 이렇게 속력이 바뀌면서 나아가는 방향이 꺾입니다. 이것이 물결파의 굴절입니다. 진동수가 높은 짧은 물결은 수심의 영향을 거의 받지 않습니다(28 Hz에서 {{l28h6}} → {{l28h3}}).",
      focus: ["water", "legs"],
      pose: { ...base, sources: 1, f: 8, h: 3 },
    },
    {
      title: "두 파원의 간섭",
      text: "접촉구를 2개로 했습니다. 두 물결이 만나면 마루와 마루가 겹치는 곳은 더 크게 출렁입니다(보강 간섭). 마루와 골이 겹치는 곳은 서로 지워집니다(상쇄 간섭).",
      focus: ["dipper-far", "dipper-near"],
      pose: { ...base },
    },
    {
      title: "마디선",
      text: "늘 지워져 잔잔한 점들을 이으면 곡선이 됩니다. 이 곡선이 마디선입니다. 두 파원까지의 거리 차가 반 파장의 홀수 배(½λ, 1½λ, 2½λ …)인 곳입니다. 간격 {d}, 파장 {lambda}이면 {Nline}입니다. 파란 점선이 공식으로 예측한 위치입니다.",
      focus: ["guide"],
      pose: { ...base, guide: true },
    },
    {
      title: "간격을 넓히면",
      text: "간격을 {d}로 넓혔습니다. 마디선이 {N}개로 늘었습니다. 두 파원까지의 거리 차는 간격 d보다 클 수 없습니다. 그래서 거리 차가 ½λ, 1½λ, … 중 몇 개까지 될 수 있는지, 곧 d/λ가 마디선 수를 정합니다.",
      focus: ["bar", "dipper-far", "dipper-near", "guide"],
      pose: { ...base, guide: true, d: 7 },
    },
  ],

  questions: [
    {
      q: `진동수 ${Q1.from.f} Hz, 간격 ${Q1.from.d} cm에서 마디선은 ${N(Q1.from)}개입니다. 간격을 ${Q1.to.d} cm로 두 배 넓히면 마디선은 몇 개가 됩니까?`,
      choices: [
        { label: `${N(Q1.from)}개 (그대로)` },
        { label: `${2 * N(Q1.from)}개 (2배)` },
        { label: `${N(Q1.to)}개`, correct: true },
        { label: `${4 * N(Q1.from)}개 (4배)` },
      ],
      from: Q1.from,
      to: Q1.to,
      focus: ["dipper-far", "dipper-near", "guide"],
      explain: "진동수가 그대로이므로 파장도 {to.lambda}로 그대로입니다. d/λ = {to.d} ÷ {to.lambda} ≈ {to.dr}이고, ½을 더하면 {to.dl}, 버림하면 {to.fl}입니다. 양쪽에 {to.fl}개씩이므로 마디선은 {to.N}개입니다. ½을 더해 버림하는 계산이라서 간격을 2배로 해도 마디선이 꼭 2배가 되지는 않습니다.",
    },
    {
      q: `간격 ${Q2.from.d} cm, 진동수 ${Q2.from.f} Hz에서 마디선은 ${N(Q2.from)}개입니다. 진동수를 ${Q2.to.f} Hz로 3배 높이면 마디선은 몇 개가 됩니까?`,
      choices: [
        { label: `${N(Q2.from)}개 (그대로)` },
        { label: `${2 * N(Q2.from)}개` },
        { label: `${N(Q2.to)}개`, correct: true },
        { label: `${3 * N(Q2.from)}개 (3배)` },
      ],
      from: Q2.from,
      to: Q2.to,
      focus: ["knob", "guide"],
      explain: "파장이 {from.lambda}에서 {to.lambda}로 짧아집니다. 진동수는 3배인데 파장은 3분의 1보다 덜 짧아집니다. 짧은 물결일수록 표면장력 때문에 조금 더 빨리 나아가기 때문입니다({from.v} → {to.v}). d/λ ≈ {to.dr}, ½을 더하면 {to.dl}, 버림하면 {to.fl}이므로 마디선은 {to.N}개입니다.",
    },
    {
      q: `진동수 ${Q3.from.f} Hz, 간격 ${Q3.from.d} cm, 수심 ${Q3.from.h} mm에서 마디선은 ${N(Q3.from)}개입니다. 물을 ${Q3.to.h} mm로 얕게 하면 마디선은 어떻게 됩니까?`,
      choices: [
        { label: `줄어든다 (${N(Q3.from) - 2}개)` },
        { label: `그대로다 (${N(Q3.from)}개)` },
        { label: `늘어난다 (${N(Q3.to)}개)`, correct: true },
      ],
      from: Q3.from,
      to: Q3.to,
      focus: ["water", "guide"],
      explain: "얕은 물에서 물결은 {from.v}에서 {to.v}로 느려집니다. 진동수는 그대로이므로 파장이 {from.lambda}에서 {to.lambda}로 짧아집니다(λ = v ÷ f). 그래서 d/λ + ½도 커지고({from.dl} → {to.dl}), 버림한 값이 하나 늘어납니다({from.fl} → {to.fl}). 마디선은 양쪽에 하나씩 늘어 {to.N}개가 됩니다.",
    },
  ],
};
