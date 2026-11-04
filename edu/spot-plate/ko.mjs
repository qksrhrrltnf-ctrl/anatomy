// Korean teaching content for the spot-plate figure (edu-kit schema: edu/kit/README.md).
// Braced keys come from the drawing's own formulas (app.tsx values()): {merge} {joined} {joinedList} {reachList}
// {plainList} {twice} {bladesOut} {pairGap} {pairState}, and per pair {state0}…{state5} {seen0}…{seen5} {neck0}…{neck5}.
// The merging here is a graphics technique (distance field + smooth union), not a physics simulation; the page says so.

const pair = (row, gap) => ({
  id: `pair-${row}`,
  name: `방울 쌍 · 간격 ${gap} px`,
  say: `반지름 30과 22인 유리 방울을 ${gap} px 떼어 놓았습니다. 지금은 {state${row}}.`,
});

export default {
  lang: "ko",
  page: {
    title: "반점판 · 교육판",
    kicker: "중학교 과학 · 물질의 상태 / 정보 · 그래픽스",
    heading: "반점판: 두 방울은 언제 하나가 되는가",
    lead: "반점판의 홈 여섯 개에 유리 방울이 두 개씩 놓여 있습니다. 쌍마다 간격이 다릅니다. merge 값을 바꾸면 가까운 쌍부터 하나로 이어집니다. 어느 간격에서 합쳐지는지 먼저 예측해 보십시오.",
    footer: "이 그림의 합쳐짐은 물리 계산이 아니라 컴퓨터 그래픽스 기법(거리장과 부드러운 합집합)입니다. 실제 물방울은 서로 닿아야 합쳐지고, 합쳐지게 하는 힘은 표면장력입니다. 숫자는 모두 그림을 그리는 같은 식에서 계산했습니다.",
  },
  card: {
    fig: "그림 7",
    title: "반점판",
    hint: "부채를 끌어 merge를 바꾸십시오",
    readout: "merge 20 px · 6쌍 중 3쌍 합쳐짐",
    keys: [
      { mark: "raised", label: "합쳐진 쌍: 하나의 유리 덩어리 (R30 + R22)" },
      { mark: "edge", label: "목: 두 방울이 이어진 잘록한 곳" },
      { mark: "lit", label: "merge 날" },
    ],
    caption:
      "홈 여섯 개에 유리 방울 쌍을 4 px에서 44 px까지 서로 다른 간격으로 놓았습니다. 쌍마다 하나의 거리장으로 그리므로, 간격이 merge보다 작은 쌍은 한 덩어리로 이어집니다. 오른쪽 부채가 merge를 정하고, 날마다 자기 간격에서 멈춥니다. 지금 merge {merge}에서는 {joinedPhrase}.",
  },
  questionDelay: 1600,
  start: "params",

  partsIntro: "부품을 누르면 그림에서 강조합니다. 방울 쌍의 설명은 지금 merge 값에 따라 바뀝니다.",
  parts: [
    pair(0, 4),
    pair(1, 10),
    pair(2, 16),
    pair(3, 24),
    pair(4, 32),
    pair(5, 44),
    { id: "neck", name: "목", say: "두 방울이 이어진 잘록한 부분에 그린 반짝임입니다. 합쳐진 쌍에만 나타납니다." },
    { id: "wells", name: "홈 6개", say: "방울 쌍을 하나씩 담는 길쭉한 홈입니다. 모든 홈의 크기가 같습니다." },
    { id: "rulers", name: "간격 눈금자", say: "홈 옆의 눈금입니다. 큰 방울 가장자리에서 시작해 짧은 눈금 2 px, 긴 눈금 8 px 간격으로 48 px까지 잽니다. 밝은 점이 그 쌍의 간격입니다." },
    { id: "counts", name: "홈 번호 점", say: "홈 아래 점의 개수가 홈 번호입니다. 점 1개는 간격 4 px, 점 6개는 간격 44 px 홈입니다." },
    { id: "plate", name: "반점판", say: "작은 홈이 여러 개 파인 실험용 판입니다. 실험실에서 시약 방울을 나눠 담을 때 씁니다." },
    { id: "lead", name: "merge 날", say: "가장 위의 밝은 날입니다. 펼쳐진 각도가 merge 값({merge})을 나타냅니다. 이 날이 아래 날들을 밀어 펼칩니다. 이 날을 끌어 merge를 바꿀 수 있습니다." },
    { id: "blades", name: "필러 게이지 날 6개", say: "날마다 한 간격을 맡습니다. 날은 자기 간격에서 멈추므로, 펼쳐진 날의 수({bladesOut}개)가 합쳐진 쌍의 수와 같습니다." },
    { id: "stops", name: "멈춤 핀", say: "데크 위의 작은 핀입니다. 날이 자기 간격의 각도에서 멈추는 자리를 표시합니다." },
    { id: "protractor", name: "각도기 눈금 띠", say: "부채 둘레의 반원 띠입니다. 0에서 48 px까지 짧은 눈금 2 px, 긴 눈금 8 px 간격이며, 밝은 점은 여섯 간격의 자리입니다." },
    { id: "pivot", name: "피벗", say: "날들을 한데 묶어 돌게 하는 축과 너트입니다." },
    { id: "deck", name: "데크", say: "부채와 병을 올려 둔 받침판입니다." },
    { id: "bottle", name: "스포이트 병", say: "방울을 떨어뜨리는 병입니다. 실험실 분위기를 위한 소품이며 계산에는 쓰이지 않습니다." },
    { id: "base", name: "받침대", say: "반점판과 데크를 함께 받치는 판과 다리입니다." },
  ],

  paramsIntro: "merge는 그림이 두 방울을 얼마나 멀리서부터 이어 그릴지 정하는 값입니다. 물리량이 아니라 그림 기법의 조절값입니다.",
  params: [
    { id: "merge", type: "range", label: "merge", unit: "px", min: 0, max: 48, step: 1, value: 20, digits: 0, help: "간격이 이 값보다 작은 쌍은 하나로 합쳐집니다. 간격이 이 값의 2배보다 작으면 떨어져 있어도 서로를 향해 늘어납니다." },
    {
      id: "pair",
      type: "choice",
      label: "살펴볼 쌍",
      value: 3,
      options: [
        { value: 0, label: "4" },
        { value: 1, label: "10" },
        { value: 2, label: "16" },
        { value: 3, label: "24" },
        { value: 4, label: "32" },
        { value: 5, label: "44" },
      ],
      help: "간격(px)을 고르면 그 쌍을 그림에서 강조하고, 아래 ‘고른 쌍’ 줄에 상태를 계산해 보여 줍니다.",
    },
  ],
  formulasTitle: "그림의 식으로 계산한 값",
  formulas: [
    { label: "합쳐지는 조건", text: "간격 < merge = {merge} → {joinedSet}" },
    { label: "늘어나는 구간", text: "merge ≤ 간격 < 2 × merge = {twice} → {reachList}" },
    { label: "영향 없는 쌍", text: "간격 ≥ {twice} → {plainList}" },
    { label: "고른 쌍", text: "간격 {pairGap}: {pairState}" },
    { label: "펼쳐진 날", text: "{bladesOut}개 = 합쳐진 쌍의 수" },
  ],
  formulaNote: "늘어난 쌍의 보이는 간격은 2√(merge × (간격 − merge))입니다. 이 규칙은 두 방울이 마주 보는 축 위에서 그림의 식을 풀어 얻은 것입니다. 실제 물방울에는 이런 문턱이 없습니다.",

  steps: [
    {
      title: "반점판과 방울 쌍",
      text: "반점판의 홈 여섯 개에 유리 방울이 두 개씩 놓여 있습니다. 큰 방울의 반지름은 30, 작은 방울은 22입니다. 두 방울 사이의 간격은 홈마다 4, 10, 16, 24, 32, 44 px로 다릅니다. 지금은 merge가 {merge}라 모든 방울이 따로 떨어져 있습니다.",
      focus: ["pair-0", "pair-1", "pair-2", "pair-3", "pair-4", "pair-5", "rulers"],
      pose: { merge: 0, pace: "slow" },
    },
    {
      title: "그림은 거리로 모양을 정합니다",
      text: "그림은 판 위의 점마다 가장 가까운 방울 가장자리까지의 거리를 계산합니다. 방울 안쪽은 거리를 음수로 셉니다. 거리가 0보다 작은 곳을 유리로 칠하면 방울 모양이 됩니다. 이렇게 점마다 거리를 매긴 것을 거리장이라고 합니다.",
      focus: ["pair-0"],
      pose: { merge: 0 },
    },
    {
      title: "merge를 키우면 가까운 쌍부터",
      text: "merge를 {merge}로 올렸습니다. 그림은 두 방울 사이의 거리장을 merge만큼 깎아 내려 가까운 쌍부터 잇습니다. 간격이 merge보다 작은 {joinedList} 쌍이 한 덩어리가 되었습니다. 부채에서도 날 {bladesOut}개가 펼쳐졌습니다.",
      focus: ["pair-0", "pair-1", "pair-2", "blades"],
      pose: { merge: 20, pace: "slow" },
    },
    {
      title: "문턱에서는 맞닿기만 합니다",
      text: "merge를 간격과 같은 {merge}로 맞췄습니다. 간격 24 px 쌍은 {state3}. 합쳐지는 조건은 ‘간격이 merge보다 작다’이기 때문입니다.",
      focus: ["pair-3"],
      pose: { merge: 24, pace: "slow" },
    },
    {
      title: "문턱을 넘으면 한 덩어리",
      text: "merge를 1 px 올려 {merge}로 했습니다. 이제 간격 24 px 쌍도 {state3}. 합쳐진 쌍은 모두 {joined}쌍입니다.",
      focus: ["pair-3"],
      pose: { merge: 25 },
    },
    {
      title: "떨어져 있어도 늘어나는 구간",
      text: "merge {merge}에서 간격 44 px 쌍을 보십시오. 이 쌍은 {state5}. 간격이 merge의 2배({twice})보다 작으면 이렇게 서로를 향해 늘어납니다.",
      focus: ["pair-5"],
      pose: { merge: 32, pace: "slow" },
    },
    {
      title: "필러 게이지 부채 읽기",
      text: "필러 게이지(틈새 게이지)는 얇은 날을 틈에 끼워 틈의 크기를 재는 도구입니다. 이 그림의 부채는 날의 두께 대신 펼쳐진 각도로 간격을 나타냅니다. 맨 위의 merge 날이 펼쳐지면서 아래 날들을 밀고, 각 날은 자기 간격의 멈춤 핀에서 멈춥니다. merge가 {merge}이면 날 {bladesOut}개가 모두 펼쳐지고 여섯 쌍이 모두 합쳐집니다. 간격이 작은 쌍은 잘록한 목마저 사라져 둥근 덩어리가 됩니다.",
      focus: ["blades", "lead", "stops", "protractor"],
      pose: { merge: 48, pace: "slow" },
    },
    {
      title: "실제 물방울과 다른 점",
      text: "실제 물방울은 떨어져 있을 때 서로를 향해 늘어나지 않습니다. 두 방울이 닿는 순간 표면장력이 겉넓이를 줄이는 쪽으로 작용해 하나의 둥근 방울로 합칩니다. 이 그림의 merge는 그런 힘이 아니라, 화면에서 방울이 녹아 붙는 듯 보이게 하는 그래픽 기법의 조절값입니다. 목의 반짝임도 계산된 빛이 아니라 잘록한 곳에 그린 선입니다.",
      focus: ["neck", "pair-0", "pair-1", "pair-2"],
      pose: { merge: 20, pace: "slow" },
    },
  ],

  questions: [
    {
      q: "merge를 20 px에서 33 px로 올리면 합쳐진 쌍은 모두 몇 쌍이 됩니까?",
      choices: [{ label: "3쌍" }, { label: "4쌍" }, { label: "5쌍", correct: true }, { label: "6쌍" }],
      from: { merge: 20 },
      to: { merge: 33, pace: "slow" },
      focus: ["pair-3", "pair-4", "blades"],
      explain: "합쳐지는 조건은 ‘간격 < merge’입니다. merge {to.merge}보다 작은 간격은 {to.joinedList}로 {to.joined}쌍입니다. 간격 32 px 쌍은 32 < 33이라 합쳐지고, 44 px 쌍은 아직 떨어져 있습니다. 부채의 날도 {to.bladesOut}개가 펼쳐집니다.",
    },
    {
      q: "간격 24 px 쌍이 합쳐진 쌍으로 세어지려면 merge가 최소 얼마여야 합니까? (1 px 단위)",
      choices: [{ label: "12 px" }, { label: "24 px" }, { label: "25 px", correct: true }, { label: "48 px" }],
      from: { merge: 24 },
      to: { merge: 25 },
      focus: ["pair-3"],
      explain: "merge가 {from.merge}일 때 이 쌍은 {from.state3}. 간격이 merge보다 작아야 하므로 1 px 단위로는 {to.merge}부터 한 덩어리가 됩니다. 이때 이 쌍은 {to.state3}.",
    },
    {
      q: "merge를 32 px로 하면 간격 44 px 쌍은 어떻게 보입니까?",
      choices: [{ label: "한 덩어리로 합쳐집니다" }, { label: "떨어져 있지만 서로를 향해 늘어납니다", correct: true }, { label: "아무 변화가 없습니다" }],
      from: { merge: 0 },
      to: { merge: 32, pace: "slow" },
      focus: ["pair-5"],
      explain: "44는 32보다 크므로 합쳐지지 않습니다. 하지만 merge의 2배인 {to.twice}보다 작으므로 두 방울이 서로를 향해 늘어납니다. 보이는 간격은 2√(32 × (44 − 32)) = {to.seen5}로, 처음 44 px보다 좁아졌습니다.",
    },
    {
      q: "실제로 가까이 있는 두 물방울이 하나로 합쳐지는 까닭으로 알맞은 것은 무엇입니까?",
      choices: [
        { label: "두 물방울 사이 거리가 merge 값보다 작아서" },
        { label: "두 물방울이 닿으면 표면장력이 겉넓이를 줄이는 쪽으로 작용해서", correct: true },
        { label: "중력이 두 물방울을 서로 끌어당겨서" },
      ],
      from: { merge: 20 },
      to: { merge: 48, pace: "slow" },
      focus: ["pair-0"],
      explain: "실제 물방울은 서로 닿아야 합쳐집니다. 닿은 뒤에는 표면장력이 겉넓이를 가장 작게 하려고 두 방울을 하나의 둥근 방울로 만듭니다. merge는 그림을 그리는 식의 조절값일 뿐이고, 실제 물방울에는 이런 문턱 거리가 없습니다. 큰 merge에서 둥글게 뭉친 모양은 실제로 합쳐진 물방울과 겉모습이 닮았을 뿐입니다.",
    },
  ],
};
