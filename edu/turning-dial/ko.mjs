// Korean teaching content for the 3D turning dial (edu-kit schema: edu/kit/README.md).
// {key}: filled at run time from the page (adapter.values). {{key}}: filled once by build.mjs from the
// constants that draw the figure (gear radii, hub radius, fingertip reach).
const name = (n) => `[data-name="${n}"]`;
const starts = (n) => `[data-name^="${n}"]`;
const part = (n) => `[data-part="${n}"]`;
const base = { theta: 0, speed: 0, dir: "cw", lift: false, pod: false, game: "off" };

export default {
  lang: "ko",
  page: {
    title: "번호 다이얼",
    kicker: "중학교 기술 · 기계 요소와 동력 전달 / 고등학교 물리학 · 회전 운동",
    heading: "번호 다이얼로 보는 회전과 톱니바퀴",
    lead: "다이얼을 돌리며 눈금 읽기, 한 덩어리로 함께 도는 물체, 맞물린 톱니바퀴, 조합 자물쇠의 원리를 살펴봅니다. 다이얼을 끌어 돌리거나 학습 패널을 쓰십시오. 실험 탭에는 번호 맞추기 놀이가 있습니다.",
    footer: "모델: 이 그림의 자물쇠 안에는 실제 조합 자물쇠의 번호 바퀴 묶음 대신 반지름 8과 32의 톱니바퀴 한 쌍만 있습니다. 그래서 번호 맞추기 놀이의 1단계는 실제 자물쇠의 여는 규칙으로 판정합니다. 멈춤쇠는 다이얼이 36° 돌 때마다 한 번 흔들리게 단순화했고, 포드가 떨어지는 동작은 실제 낙하 운동을 계산한 것이 아닙니다. 회전 방향은 위에서 내려다본 방향으로 적었습니다.",
  },
  card: {
    fig: "그림 3D",
    title: "번호 다이얼",
    hint: "다이얼 끌어 돌리기 · 화살표 키 · B 포드",
    readout: "눈금 86 · 0.0°",
    keys: [
      { mark: "raised", label: "다이얼과 그 위의 손: 한 덩어리로 도는 물체" },
      { mark: "lit", label: "기준 표시" },
    ],
    caption:
      "문판 위의 번호 다이얼입니다. 눈금이 {{ticks}}칸 있어 한 칸은 {{tick}}입니다. 지금 기준 표시 아래 눈금은 {R}이고, 회전각 θ는 {theta}입니다. 다이얼 위의 작은 로봇 손은 다이얼에 고정되어 함께 돕니다. 다이얼 축의 작은 톱니바퀴(반지름 {{pinionR}})는 판 아래의 큰 톱니바퀴(반지름 {{wheelR}})와 맞물려 있습니다. 그래서 큰 톱니바퀴는 반대 방향으로 {{gear}}배 느리게 돌아 지금 회전각이 {wheel}이고, 그 숫자가 앞쪽 창에 보입니다(창 숫자 {win}). 이 그림은 3D 모드로 그렸습니다. 다이얼 위의 모든 부품을 매 프레임 다시 투영하고 음영을 다시 칠하며, 칠하는 순서는 부품 사이의 분리 평면으로 정합니다.",
  },
  dim: "fade",
  start: "params",
  questionDelay: 1600,

  parts: [
    { id: "dial-body", name: "다이얼 둘레", say: "손가락으로 잡고 돌리는 부분입니다. 미끄러지지 않게 잔 홈(널링)이 파여 있습니다.", select: name("dial.body") },
    { id: "dial-face", name: "눈금판", say: "0부터 99까지 {{ticks}}칸이 새겨져 있습니다. 한 칸은 {{tick}}입니다.", select: name("dial.bevel") },
    { id: "hub", name: "허브", say: "다이얼 가운데의 둥근 축머리입니다. 반지름이 {{hubR}}로, 손끝보다 축에 훨씬 가깝습니다.", select: name("dial.hub") },
    { id: "index", name: "기준 표시", say: "판에 고정된 금색 쐐기입니다. 이 쐐기 아래에 온 눈금이 지금 다이얼 번호입니다. 지금 {R}입니다.", select: part("stand.index") },
    { id: "plate", name: "문판", say: "다이얼을 받치는 판입니다. 앞쪽 작은 창으로 판 아래 큰 톱니바퀴의 숫자가 보입니다.", select: part("stand.plate") },
    { id: "base", name: "받침과 발", say: "장치 전체를 받치는 받침입니다.", select: `${part("stand.base")}, [data-part^="stand.foot."]` },
    { id: "posts", name: "기둥과 와셔", say: "문판을 받침에서 띄워 판 아래에 톱니바퀴가 들어갈 자리를 만듭니다.", select: '[data-part^="stand.post."], [data-part^="stand.washer."]' },
    { id: "pinion", name: "작은 톱니바퀴 (피니언)", say: "다이얼 축에 붙어 다이얼과 함께 돕니다. 반지름 {{pinionR}}입니다. 판 아래에 숨어 있어 목록에서 누르면 비쳐 보입니다.", select: name("lock.pinion") },
    { id: "wheel", name: "큰 톱니바퀴 (번호 바퀴)", say: "반지름 {{wheelR}}로 작은 톱니바퀴의 {{gear}}배입니다. 다이얼이 {{gear}}바퀴 돌 때 반대 방향으로 1바퀴 돕니다. 지금 {wheel} 돌았습니다.", select: `${name("lock.wheel")}, ${name("lock.wheel.hub")}` },
    { id: "pawl", name: "멈춤쇠 (폴)", say: "다이얼 둘레의 홈을 타고 좌우로 흔들립니다. 다이얼이 {{pawlEvery}} 돌 때마다 한 번 왕복합니다.", select: starts("pawl.") },
    { id: "palm", name: "손바닥", say: "로봇 손의 몸통입니다. 허브 위에 고정되어 다이얼과 한 덩어리로 돕니다.", select: name("hand.palm") },
    { id: "cover", name: "덮개판", say: "손바닥 위를 덮는 판입니다. 커넥터와 피스톤이 이 위에 있습니다.", select: name("hand.cover") },
    { id: "connector", name: "커넥터와 단자", say: "전선 세 가닥이 꽂히는 곳입니다. 빨강·파랑 선은 바깥 손가락으로, 초록 선은 단자로 갑니다.", select: `${name("hand.connector")}, ${starts("hand.port.")}, ${name("hand.terminal")}` },
    { id: "clamps", name: "전선 고정쇠", say: "전선이 움직이지 않게 잡아 줍니다.", select: starts("hand.clamp.") },
    { id: "cables", name: "전선", say: "손가락과 단자에 신호를 보내는 선입니다. 다이얼과 함께 돕니다.", select: starts("cable.") },
    { id: "piston", name: "피스톤", say: "실린더 안의 막대가 밀고 당기는 장치입니다. 두 받침 위에 놓여 있습니다.", select: `${starts("hand.piston.")}, ${name("hand.clevis")}, ${starts("hand.saddle.")}` },
    { id: "ball", name: "볼 조인트", say: "둥근 공 모양의 이음매입니다. 여러 방향으로 꺾일 수 있습니다.", select: `${name("hand.ball")}, ${name("hand.ball.post")}` },
    { id: "valve", name: "밸브와 호스", say: "호스로 들어온 흐름을 열고 닫는 장치입니다.", select: `${name("hand.valve")}, ${starts("hand.hose")}` },
    { id: "middle-finger", name: "가운데 손가락", say: "관절 세 개가 한 값으로 함께 굽습니다(지금 {mcp}, {pip}, {dip}). 끝에 초록 LED가 있어 다이얼 면을 비춥니다.", select: starts("hand.f2.") },
    { id: "fingers", name: "바깥 손가락", say: "손끝이 다이얼 면에 닿아 있습니다. 축에서 멀리 있어 다이얼이 돌 때 가장 빠르게 움직이는 부분입니다.", select: `${starts("hand.f1.")}, ${starts("hand.f3.")}` },
    { id: "thumb", name: "엄지", say: "공 모양 관절에 달린 짧은 손가락입니다.", select: starts("hand.thumb.") },
    { id: "pod", name: "포드", say: "손등에 꽂힌 작은 육각 부품입니다. B 키나 패널 스위치로 떼었다 붙일 수 있습니다. 지금 {pod}.", select: starts("hand.pod.") },
  ],
  partsIntro: "부품을 누르면 그림에서 강조하고 나머지는 흐리게 합니다. 판 아래의 톱니바퀴도 이렇게 비쳐 볼 수 있습니다. 한 번 더 누르면 풀립니다.",

  paramsIntro: "다이얼을 끌어 돌리거나 아래 값을 바꾸어 보십시오. 회전각 θ는 위에서 내려다볼 때 시계 방향이 + 입니다.",
  params: [
    { id: "theta", type: "range", label: "회전각 θ", unit: "°", min: -720, max: 720, step: 3.6, value: base.theta, digits: 1, help: "{{tick}}가 눈금 한 칸입니다. 큰 값을 주면 다이얼이 1초에 한 바퀴 빠르기로 돌아갑니다." },
    { id: "speed", type: "range", label: "자동 회전 빠르기 ω", unit: "°/s", min: 0, max: 72, step: 6, value: base.speed, digits: 0, help: "1초에 도는 각도입니다. 0이면 멈춥니다." },
    { id: "dir", type: "choice", label: "자동 회전 방향", value: base.dir, options: [{ value: "cw", label: "시계 방향" }, { value: "ccw", label: "반시계 방향" }], help: "시계 방향으로 돌리면 기준 표시 아래의 눈금 숫자가 줄어듭니다." },
    { id: "lift", type: "toggle", label: "가운데 손가락 들기", value: base.lift, help: "세 관절이 한 값으로 함께 굽습니다." },
    { id: "pod", type: "toggle", label: "포드 떼기", value: base.pod, on: "떨어짐", off: "붙어 있음", help: "손등의 작은 부품이 떨어져 나갑니다. 다시 누르면 제자리로 돌아옵니다." },
    { id: "game", type: "choice", label: "번호 맞추기 놀이", value: base.game, options: [{ value: "off", label: "끔" }, { value: "three", label: "1단계: 세 번호" }, { value: "window", label: "2단계: 창 숫자" }], help: "그림 아래 상태 줄의 안내대로 다이얼을 돌려 멈추십시오. 1단계는 방향을 바꿔 가며 세 번호를, 2단계는 눈금과 창 숫자를 함께 맞춥니다." },
  ],
  formulasTitle: "계산한 값",
  formulas: [
    { label: "눈금 한 칸", text: "360° ÷ {{ticks}}칸 = {{tick}}" },
    { label: "기준 표시 아래 눈금", text: "θ = {theta} → 눈금 {R}" },
    { label: "큰 톱니바퀴", text: "회전각 = −θ × {{pinionR}}/{{wheelR}} = {wheel} · 창 숫자 {win}" },
    { label: "자동 회전", text: "ω = {speed} ({way}) · 한 바퀴 {T} · 1초에 눈금 {perSec}" },
    { label: "선속도 v = rω", text: "손끝(r ≈ {{tipR}}) ÷ 허브 가장자리(r = {{hubR}}) = {{tipRatio}}배 빠름" },
    { label: "손가락 관절", text: "{mcp}, {pip}, {dip}" },
  ],
  formulaNote: "판독값의 각도는 0°~360°로, 여기의 θ는 여러 바퀴를 이어서 적습니다.",

  steps: [
    {
      title: "다이얼과 눈금",
      text: "다이얼에는 0부터 99까지 눈금이 {{ticks}}칸 있습니다. 한 바퀴는 360°이므로 한 칸은 {{tick}}입니다. 판에 고정된 금색 기준 표시 아래의 눈금을 읽습니다. 지금은 {R}입니다.",
      focus: ["dial-face", "index"],
      pose: { ...base },
    },
    {
      title: "회전각과 눈금 읽기",
      text: "다이얼을 시계 방향으로 {theta} 돌렸습니다. 한 칸이 {{tick}}이므로 10칸만큼 돌아 눈금이 {R}이 되었습니다. 시계 방향으로 돌리면 숫자가 줄고, 반시계 방향으로 돌리면 숫자가 늡니다.",
      focus: ["dial-face", "index"],
      pose: { ...base, theta: 36 },
    },
    {
      title: "함께 도는 손",
      text: "다이얼이 {speed}의 빠르기로 돌고 있습니다. 한 바퀴에 {T} 걸립니다. 손은 다이얼에 고정되어 있어서 모든 부품이 같은 시간에 같은 각도만큼 돕니다. 이렇게 모양이 변하지 않고 한 덩어리로 움직이는 물체를 강체라고 합니다. 그래도 축에서 먼 점은 더 긴 원을 그리므로 더 빠릅니다(v = rω). 손끝은 허브 가장자리보다 약 {{tipRatio}}배 빠릅니다.",
      focus: ["palm", "cover", "fingers", "middle-finger", "hub"],
      pose: { ...base, speed: 18 },
    },
    {
      title: "손 위에서 보면",
      text: "손 위에 탄 관찰자를 생각해 봅시다. 관찰자에게는 다이얼과 손이 멈춰 있고, 문판과 기준 표시가 반시계 방향으로 같은 빠르기로 도는 것처럼 보입니다. 운동은 누가 보느냐(기준)에 따라 다르게 보입니다. 이것을 상대 운동이라고 합니다.",
      focus: ["index", "plate", "palm"],
      pose: { ...base, speed: 18 },
    },
    {
      title: "숨은 톱니바퀴",
      text: "판 아래를 들여다봅니다. 다이얼 축의 작은 톱니바퀴(반지름 {{pinionR}})가 큰 톱니바퀴(반지름 {{wheelR}})와 맞물려 있습니다. 맞물린 톱니는 같은 길이만큼 지나가므로, 작은 바퀴가 {{gear}}바퀴 돌 때 큰 바퀴는 1바퀴 돕니다. 맞물린 두 바퀴는 서로 반대 방향으로 돕니다. 다이얼을 {theta} 돌렸더니 큰 바퀴는 {wheel} 돌았고, 창 숫자는 {win}입니다.",
      focus: ["pinion", "wheel"],
      pose: { ...base, theta: 360 },
    },
    {
      title: "멈춤쇠와 손가락 관절",
      text: "왼쪽의 멈춤쇠는 다이얼 둘레의 홈을 타고 흔들립니다. 다이얼이 {{pawlEvery}} 돌 때마다 한 번 왕복합니다. 가운데 손가락은 관절 세 개가 한 값으로 함께 굽습니다. 지금 각 관절은 {mcp}, {pip}, {dip} 굽었습니다. 하나의 입력이 여러 부분을 함께 움직이도록 이어 놓은 것을 연동이라고 합니다.",
      focus: ["pawl", "middle-finger"],
      pose: { ...base, theta: 72, lift: true },
    },
    {
      title: "조합 자물쇠 여는 순서",
      text: "번호 자물쇠는 번호 세 개를 정해진 방향으로 차례로 맞춰야 열립니다. 실제 자물쇠 안에는 홈이 하나씩 파인 번호 바퀴가 여러 장 겹쳐 있습니다. 돌리는 방향을 바꾸면 이미 맞춘 바퀴는 그 자리에 남고 다음 바퀴만 움직입니다. 모든 홈이 한 줄로 서면 걸쇠가 빠져 열립니다. 이 그림의 자물쇠 안에는 번호 바퀴 대신 톱니바퀴 한 쌍만 있으므로, 실험 탭의 번호 맞추기 놀이는 실제 자물쇠의 규칙으로 판정합니다.",
      focus: ["dial-face", "index"],
      pose: { ...base },
    },
  ],

  questions: [
    {
      q: "지금 기준 표시 아래의 눈금은 86입니다. 다이얼을 시계 방향으로 72° 돌리면 눈금은 얼마가 됩니까?",
      choices: [{ label: "66", correct: true }, { label: "76" }, { label: "14" }, { label: "6" }],
      from: { ...base },
      to: { ...base, theta: 72 },
      focus: ["dial-face", "index"],
      explain: "한 칸은 {{tick}}이므로 72° ÷ {{tick}} = 20칸입니다. 시계 방향으로 돌리면 숫자가 줄어들므로 {from.R} − 20 = {to.R}입니다. 6은 반대 방향으로 센 값(86 + 20 = 106 → 6), 14는 각도를 그대로 뺀 값(86 − 72)입니다.",
    },
    {
      q: "다이얼을 시계 방향으로 2바퀴 돌리면 판 아래 큰 톱니바퀴는 어떻게 됩니까?",
      choices: [{ label: "반대 방향으로 반 바퀴", correct: true }, { label: "같은 방향으로 반 바퀴" }, { label: "반대 방향으로 2바퀴" }, { label: "같은 방향으로 8바퀴" }],
      from: { ...base },
      to: { ...base, theta: 720 },
      focus: ["pinion", "wheel"],
      delay: 2800,
      explain: "작은 톱니바퀴의 반지름은 {{pinionR}}, 큰 톱니바퀴는 {{wheelR}}로 {{gear}}배입니다. 맞물린 톱니는 같은 길이만큼 지나가므로 큰 바퀴는 {{gear}}배 느리게 돌아, 2바퀴의 4분의 1인 반 바퀴({to.wheel})를 돕니다. 맞물린 두 바퀴는 반대 방향으로 돕니다. 창 숫자도 {from.win}에서 {to.win}으로 움직였습니다.",
    },
    {
      q: "다이얼이 돌 때 손끝과 허브 가장자리 중 어느 쪽이 더 빠르게 움직입니까?",
      choices: [{ label: "손끝", correct: true }, { label: "허브 가장자리" }, { label: "둘 다 같다" }],
      from: { ...base },
      to: { ...base, speed: 36 },
      focus: ["fingers", "middle-finger", "hub"],
      explain: "다이얼 위의 모든 점은 같은 시간에 같은 각도만큼 돕니다(각속도가 같습니다). 하지만 축에서 먼 점은 한 바퀴에 더 긴 원을 그리므로 더 빠릅니다(v = rω). 손끝은 축에서 약 {{tipR}}, 허브 가장자리는 {{hubR}} 떨어져 있어 손끝이 약 {{tipRatio}}배 빠릅니다. 지금 다이얼은 {to.speed}의 빠르기로 돌고 있습니다.",
    },
  ],
};
