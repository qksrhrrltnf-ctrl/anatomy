// Korean teaching content for the desk-computer figure (edu-kit schema: edu/kit/README.md).
// Numbers in braces come from the figure's model when they are shown: {chars} {bytes} {bits} {max} {char}
// {code} {bin} {ascii} {power} {slow} {tV} {tH} {tD} {tOnH} {tOnV} {nkeys} {down}.
// build.mjs writes the page footer (the model's simplifications) from the same constants.
export default {
  lang: "ko",
  page: {
    title: "데스크 컴퓨터 · 교육판",
    kicker: "정보 · 컴퓨터의 구성",
    heading: "데스크 컴퓨터: 입력에서 출력까지",
    lead: "키 하나를 누르면 신호가 케이블을 지나 본체로 가고, 본체는 그 글자를 문자 코드로 바꾸어 기억한 뒤 화면에 그립니다. 그림을 누르고 영문으로 타자해 보십시오. 입력, 처리, 기억, 출력이 한 그림 안에서 이어집니다.",
  },
  card: {
    fig: "그림 2",
    title: "데스크 컴퓨터",
    hint: "누르고 영문 타자 · Esc는 전원",
    readout: "켜짐 · 0자",
    keys: [
      { mark: "lit", label: "화면: Anthropic 로고와 입력한 글자" },
      { mark: "raised", label: "키 {nkeys}개: 누르는 키가 내려갑니다" },
      { mark: "edge", label: "코일 케이블: 키보드에서 본체 옆 포트까지" },
    ],
    caption: "1984년 무렵의 일체형 데스크 컴퓨터입니다. 키 큰 본체에 CRT 화면이 박혀 있고, 그 아래에 플로피 디스크 슬롯과 스피커 그릴이 있습니다. 그림을 누르고 타자하면 누른 키가 내려가고 그 글자가 화면에 찍힙니다. 한 줄에는 {max}자까지 들어갑니다. 전원을 끄면 화면이 {tV} 동안 가로 한 줄로 접히고, {tH} 동안 가운데 점으로 줄어든 뒤 {tD} 동안 사라집니다.",
  },
  start: "params",
  questionDelay: 1400,
  partsIntro: "부품을 누르면 그림에서 강조합니다. 한 번 더 누르면 풀립니다. 표시등과 케이블처럼 작은 부품은 목록에서 고르면 찾기 쉽습니다.",

  parts: [
    { id: "shift", name: "Shift 키", say: "누른 채 다른 키를 치면 대문자나 위쪽 기호가 입력됩니다. 왼쪽과 오른쪽에 하나씩 있습니다.", select: '[data-key="41"],[data-key="52"]' },
    { id: "keys", name: "키", say: "누르면 아래로 내려가며 그 글자의 신호를 보냅니다. 이 키보드에는 키가 {nkeys}개 있습니다.", select: ".pc-key" },
    { id: "keyboard", name: "키보드", say: "글자와 명령을 컴퓨터에 넣는 입력 장치입니다. 오른쪽 옆의 잭에 케이블이 연결됩니다." },
    { id: "cord", name: "코일 케이블", say: "키보드의 신호를 본체로 보내는 전선입니다. 용수철처럼 감겨 있어 늘였다 줄일 수 있습니다." },
    { id: "port", name: "키보드 포트", say: "본체 옆면의 연결 단자입니다. 케이블 끝의 플러그가 여기에 꽂힙니다." },
    { id: "crt-text", name: "입력한 글자와 커서", say: "키보드로 친 글자가 화면에 나타난 모습입니다. 지금 {chars}가 있습니다. 깜박이는 커서가 다음 글자가 올 자리를 알려 줍니다.", select: '[data-part="text"],[data-part="cursor"]' },
    { id: "logo", name: "로고", say: "화면에 표시된 Anthropic 로고입니다. 화면이 켜져 있는 동안 계속 보입니다.", select: ".pc-logo" },
    { id: "screen", name: "CRT 화면", say: "글자와 그림을 빛으로 보여 주는 출력 장치입니다. 음극선관(CRT)은 전자빔으로 형광면을 빠르게 훑어 화면을 그립니다." },
    { id: "led", name: "전원 표시등", say: "전원이 켜져 있으면 밝고, 꺼지면 어두워집니다. 누르면 전원을 켜고 끕니다.", select: '[data-part="led"]' },
    { id: "speaker", name: "스피커 그릴", say: "소리를 내보내는 출력 장치 앞의 구멍입니다. 세로 홈이 나 있습니다." },
    { id: "floppy", name: "플로피 디스크 드라이브", say: "플로피 디스크를 넣는 슬롯입니다. 디스크에 저장한 자료는 전원을 꺼도 남는 보조 기억 장치입니다." },
    { id: "rocker", name: "전원 스위치", say: "한쪽을 누르면 다른 쪽이 올라오는 로커 스위치입니다. 누르면 전원을 켜고 끕니다. 지금은 {power} 상태입니다." },
    { id: "vents", name: "통풍구", say: "본체 안에서 생긴 열을 밖으로 내보내는 틈입니다. 윗면과 옆면에 있습니다." },
    { id: "handle", name: "손잡이 홈", say: "본체 윗면에 파인 홈입니다. 손을 넣어 본체를 들어 옮깁니다." },
    { id: "case", name: "본체", say: "처리 장치, 주기억 장치, 전원 장치가 들어 있는 상자입니다. 이 그림에는 속을 그리지 않았습니다." },
    { id: "nameplate", name: "명판", say: "받침판 앞쪽의 작은 이름표입니다." },
    { id: "plate", name: "받침판", say: "컴퓨터와 키보드를 올려놓은 판입니다. 네 모서리에 다리가 있습니다." },
  ],

  paramsIntro: "그림을 누르고 영문으로 타자해 보십시오. 아래 값이 글자마다 바뀝니다.",
  params: [
    { id: "power", type: "toggle", label: "전원", value: true, on: "켜짐", off: "꺼짐", help: "그림의 로커 스위치나 표시등을 눌러도, Esc 키를 눌러도 바뀝니다." },
    { id: "slow", type: "range", label: "화면 꺼짐·켜짐 느리게 보기", unit: "배", min: 1, max: 10, step: 1, value: 1, digits: 0, help: "그림의 연출 시간에 배율을 곱해 천천히 보여 줍니다. 꺼질 때의 세 단계를 관찰하십시오." },
    { id: "code", type: "choice", label: "판독값 글자 표시", value: "char", options: [{ value: "char", label: "글자" }, { value: "dec", label: "10진 코드" }, { value: "bin", label: "2진 코드" }], help: "컴퓨터는 글자를 숫자(문자 코드)로 바꾸어 처리하고 기억합니다." },
    { id: "flow", type: "toggle", label: "신호 흐름 보기", value: false, on: "켬", off: "끔", help: "글자를 칠 때마다 키보드에서 화면까지 신호가 지나는 부품을 차례로 강조합니다." },
  ],
  formulasTitle: "공식으로 계산한 값",
  formulas: [
    { label: "문자 코드(ASCII): 글자 → 10진 → 2진", text: "{ascii}" },
    { label: "한 줄의 기억 공간", text: "{chars} × 1바이트 = {bytes} = {bits} (최대 {max}자)" },
    { label: "꺼질 때 (느리게 보기 배율 반영)", text: "{slow} · 세로 접힘 {tV} → 가로 접힘 {tH} → 점 사라짐 {tD}" },
    { label: "켜질 때 (배율 반영)", text: "{slow} · 가로 펼침 {tOnH} → 세로 펼침 {tOnV}" },
  ],
  formulaNote: "ASCII 문자 하나는 1바이트(8비트)에 저장합니다. 시간은 이 그림의 연출 시간에 배율을 곱한 값입니다.",

  steps: [
    {
      title: "입력 장치: 키보드",
      text: "키보드는 사람이 컴퓨터에 글자와 명령을 넣는 입력 장치입니다. 키를 누르면 그 키가 아래로 내려가고, 키 아래의 스위치가 어떤 키인지 알리는 신호를 만듭니다.",
      focus: ["keyboard", "keys"],
      pose: { power: true, slow: 1, code: "char", flow: false, reset: true, type: "a" },
    },
    {
      title: "신호가 지나는 길: 케이블과 포트",
      text: "키보드의 신호는 코일 케이블을 따라 본체 옆면의 포트로 들어갑니다. 케이블은 용수철처럼 감겨 있어 키보드를 조금 옮겨도 빠지지 않습니다.",
      focus: ["cord", "port"],
      pose: { power: true, slow: 1, code: "char", flow: false, reset: true, type: "a" },
    },
    {
      title: "처리 장치: 글자를 코드로",
      text: "본체 안의 처리 장치는 글자를 숫자로 바꾸어 다룹니다. 이 숫자를 문자 코드라고 합니다. 방금 친 {char}의 코드는 {code}이고, 2진수로는 {bin}입니다.",
      focus: ["case"],
      pose: { power: true, slow: 1, code: "bin", flow: false, reset: true, type: "a" },
    },
    {
      title: "주기억 장치: 한 줄을 기억합니다",
      text: "입력한 글자는 주기억 장치에 저장됩니다. 지금 줄에는 {chars}가 있고, 글자 하나가 1바이트이므로 {bytes}를 차지합니다. 이 컴퓨터는 한 줄에 {max}자까지만 기억합니다.",
      focus: ["case", "crt-text"],
      pose: { power: true, slow: 1, code: "char", flow: false, reset: true, type: "hello, claude" },
    },
    {
      title: "출력 장치: 화면과 스피커",
      text: "처리한 결과는 출력 장치로 나갑니다. CRT 화면은 기억한 글자를 빛으로 그려 보여 줍니다. 화면 아래의 스피커 그릴은 소리를 내보내는 출력 장치의 구멍입니다.",
      focus: ["screen", "crt-text", "speaker"],
      pose: { power: true, slow: 1, code: "char", flow: false },
    },
    {
      title: "보조 기억 장치: 플로피 디스크",
      text: "주기억 장치의 내용은 전원을 끄면 사라집니다. 오래 남겨야 하는 자료는 플로피 디스크 같은 보조 기억 장치에 저장합니다. 앞면의 가는 슬롯이 디스크를 넣는 곳입니다.",
      focus: ["floppy"],
      pose: { power: true, slow: 1, code: "char", flow: false },
    },
    {
      title: "전원과 화면이 꺼지는 모습",
      text: "로커 스위치로 전원을 끄면 표시등이 어두워집니다. CRT 화면은 먼저 세로로 접혀 가로 한 줄이 되고, 이어 가로로 줄어 가운데 점이 된 뒤 사라집니다. 지금은 {slow} 느리게 보여 줍니다.",
      focus: ["rocker", "led", "screen"],
      pose: { power: false, slow: 6, code: "char", flow: false },
    },
  ],

  questions: [
    {
      q: "전원을 끄면 CRT 화면은 어떻게 사라질까요? 먼저 예측하십시오.",
      choices: [{ label: "위에서부터 아래로 차례로 지워진다" }, { label: "화면 전체가 한꺼번에 어두워진다" }, { label: "가로 한 줄로 접혔다가 가운데 점이 되어 사라진다", correct: true }, { label: "가장자리부터 가운데로 좁아진다" }],
      from: { power: true, slow: 8, code: "char", flow: false },
      to: { power: false, slow: 8 },
      delay: 300,
      focus: ["screen"],
      explain: "그림을 보십시오({to.slow} 느리게 보기). 화면은 {to.tV} 동안 세로로 접혀 한 줄이 되고, {to.tH} 동안 가로로 줄어 점이 된 뒤, {to.tD} 동안 그 점이 사라집니다. CRT는 전자빔을 위아래와 좌우로 흔들어 화면을 그립니다. 전원이 끊기면 위아래로 흔드는 장치가 먼저 멈추어 한 줄이 되고, 좌우로 흔드는 장치까지 멈추면 빔이 가운데 한 점에 모입니다.",
    },
    {
      q: "소문자 a의 문자 코드는 97입니다. Shift를 누른 채 a를 쳐서 대문자 A를 입력하면 코드는 무엇일까요?",
      choices: [{ label: "97 (a와 같다)" }, { label: "98" }, { label: "65", correct: true }, { label: "129" }],
      from: { power: true, slow: 1, code: "dec", flow: false, reset: true, type: "a" },
      to: { type: "A" },
      focus: ["shift", "keys"],
      explain: "컴퓨터는 대문자와 소문자를 다른 글자로 다룹니다. A의 코드는 {to.code}({to.bin})이고 a는 {from.code}({from.bin})입니다. 그림에서 Shift 키와 A 키가 함께 내려간 것을 확인하십시오.",
    },
    {
      q: "화면 줄에 이미 20자가 있습니다. 여기서 키 하나를 더 치면 어떻게 될까요?",
      choices: [{ label: "21번째 글자가 화면에 찍힌다" }, { label: "맨 앞 글자가 지워지고 새 글자가 붙는다" }, { label: "키는 내려가지만 화면에는 더 찍히지 않는다", correct: true }, { label: "컴퓨터가 꺼진다" }],
      from: { power: true, slow: 1, code: "char", flow: false, text: "abcdefghijklmnopqrst" },
      to: { type: "u" },
      focus: ["keys", "crt-text"],
      explain: "이 컴퓨터는 한 줄을 {to.max}자까지만 기억합니다. 키를 눌러 신호는 갔지만 기억할 자리가 없어서 글자가 저장되지 않았습니다. 글자 수는 {from.chars}에서 {to.chars} 그대로입니다.",
    },
  ],
};
