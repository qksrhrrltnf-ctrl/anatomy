// Korean teaching content for the heat-pump figure (edu-kit schema: edu/kit/README.md).
// Numbers in braces come from model.js at the moment they are shown.
const piece = (id) => `[data-piece="${id}"]`;
const HEAT = { mode: "heat", Tin: 20, Tout: 7, W: 1 };

export default {
  lang: "ko",
  page: {
    title: "히트펌프",
    kicker: "고등학교 기술·가정 · 에너지와 수송 기술",
    heading: "히트펌프: 열을 만드는 대신 옮기는 기계",
    lead: "히트펌프는 냉매를 압축하고 팽창시키며 한 바퀴 돌려, 차가운 쪽의 열을 따뜻한 쪽으로 옮깁니다. 사방 밸브 하나로 흐름을 뒤집으면 같은 기계가 난방기도, 냉방기도 됩니다. 실내·실외 온도와 압축기 전력을 바꾸어 이상 COP와 실제 COP가 어떻게 달라지는지, 쓴 전기보다 많은 열이 어디에서 오는지 확인해 보십시오.",
    footer: "모델: 응축 온도는 열을 받는 쪽 공기보다 15 K 높고, 증발 온도는 열을 내주는 쪽 공기보다 10 K 낮다고 가정합니다(응축·증발 온도 차는 최소 20 K). 실제 COP는 냉매 온도 사이 카르노 COP의 45 %로 어림합니다. 압력은 R-32 포화 압력의 근사식(0 °C와 40 °C 값으로 맞춘 클라우지우스-클라페이롱 식)이며 게이지 압력입니다. 성에 제거, 압축기 효율 변화, 배관 압력 손실은 넣지 않았습니다. 냉매 점의 속도는 실제보다 훨씬 느리게 그렸고 압축기 전력에 비례합니다.",
  },
  card: {
    fig: "그림 1",
    title: "히트펌프",
    hint: "사방 밸브를 눌러 난방·냉방 바꾸기",
    readout: "난방 · COP 3.65",
    keys: [
      { mark: "red", label: "붉은색: 고온·고압 냉매(압축기에서 나온 기체, 응축기)" },
      { mark: "blue", label: "푸른색: 저온·저압 냉매(팽창 밸브를 지난 냉매, 증발기)" },
      { mark: "lit", label: "밝은 상자: 사방 밸브 코일, 전기가 흐르면(난방) 밝아집니다" },
      { mark: "dim", label: "흰 핀: 0 °C 아래로 차가워진 실외 코일에 낀 서리" },
    ],
    caption: "왼쪽은 실내기, 오른쪽은 실외기입니다. 지금은 {mode} 운전입니다. 실내 코일은 {indoorCoil}, 실외 코일은 {outdoorCoil} 역할을 합니다. 압축기가 전기 {W}를 쓰는 동안 응축기는 {Qhot}의 열을 내놓고, 증발기는 바깥(또는 실내) 공기에서 {Qcold}의 열을 흡수합니다. 실제 추정 COP는 {cop}입니다.",
  },
  keep: [],
  questionDelay: 1600,
  start: "params",
  partsIntro: "부품 이름을 누르면 그림에서 강조됩니다. 가는 관은 그림에서 맞히기 어려우니 목록에서 고르십시오.",

  parts: [
    { id: "compressor", name: "압축기", say: "저압 기체 냉매를 빨아들여 압축합니다. 압력이 높아지면 온도도 올라가 {Tcond} 정도의 고온·고압 기체가 됩니다. 전기 {W}를 씁니다.", select: piece("compressor") },
    { id: "accumulator", name: "어큐뮬레이터", say: "흡입관에 달린 통입니다. 미처 증발하지 못한 액체 냉매를 걸러, 압축기에는 기체만 들어가게 합니다.", select: piece("accumulator") },
    { id: "valve4", name: "사방 밸브", say: "네 개의 관이 이어진 밸브입니다. 안쪽 미끄럼판이 움직여 압축기에서 나온 뜨거운 냉매를 실내 코일(난방) 또는 실외 코일(냉방)로 보냅니다. 눌러서 바꿀 수 있습니다.", select: piece("valve4") },
    { id: "solenoid", name: "사방 밸브 코일(솔레노이드)", say: "전기가 흐르면 작은 파일럿 밸브를 움직여 사방 밸브를 바꿉니다. 이 모형에서는 난방일 때 전기가 흐릅니다.", select: piece("solenoid") },
    { id: "discharge", name: "토출관", say: "압축기에서 사방 밸브로 가는 관입니다. 늘 가장 뜨겁고 압력이 높은 냉매가 지나갑니다.", select: piece("discharge") },
    { id: "suction", name: "흡입관", say: "사방 밸브에서 어큐뮬레이터를 거쳐 압축기로 돌아오는 굵은 관입니다. 늘 저압 기체가 지나갑니다.", select: piece("suction") },
    { id: "gaugehi", name: "고압 게이지", say: "토출관의 압력을 잽니다. 지금 약 {pHigh}(게이지 압력)이며, 응축 온도 {Tcond}에서 R-32가 끓는 압력입니다.", select: piece("gaugehi") },
    { id: "gaugelo", name: "저압 게이지", say: "흡입관의 압력을 잽니다. 지금 약 {pLow}이며, 증발 온도 {Tevap}에서 R-32가 끓는 압력입니다.", select: piece("gaugelo") },
    { id: "eev", name: "전자 팽창 밸브", say: "좁은 틈으로 냉매를 통과시켜 압력을 확 낮춥니다. 압력이 낮아지면 끓는점도 낮아져 냉매가 {Tevap}까지 차가워집니다. 위의 코일(스테핑 모터)이 열림 정도를 조절합니다.", select: piece("eev") },
    { id: "oucoil", name: "실외 코일(실외 열교환기)", say: "얇은 알루미늄 핀 사이로 구리관이 지그재그로 지나갑니다. 지금은 {outdoorCoil} 역할을 합니다.", select: piece("oucoil") },
    { id: "fan", name: "실외 팬", say: "바깥 공기를 실외 코일 사이로 빨아들여 열을 주고받게 합니다.", select: `${piece("fan")}, ${piece("fanmotor")}` },
    { id: "iucoil", name: "실내 코일(실내 열교환기)", say: "실내 공기와 냉매가 열을 주고받는 곳입니다. 지금은 {indoorCoil} 역할을 합니다.", select: piece("iucoil") },
    { id: "iufan", name: "관류 팬과 모터", say: "긴 원통형 팬이 실내 공기를 코일 사이로 지나가게 해 위쪽 토출구로 내보냅니다.", select: piece("iufan") },
    { id: "drainpan", name: "드레인 팬", say: "냉방 때 차가운 실내 코일에 맺힌 물방울(응축수)을 받아 밖으로 내보냅니다.", select: piece("drainpan") },
    { id: "headers", name: "헤더와 분배기", say: "코일 앞의 굵은 세로관(헤더)은 기체 냉매를 여러 관으로 나누고 모읍니다. 아래의 작은 분배기는 액체 쪽 냉매를 나눕니다.", select: `${piece("iheader")}, ${piece("idist")}, ${piece("oheader")}, ${piece("odist")}` },
    { id: "lineset", name: "배관(가스관과 액관)", say: "실내기와 실외기를 잇는 두 관입니다. 굵은 가스관에는 기체가, 가는 액관에는 액체(또는 액체와 기체가 섞인) 냉매가 흐릅니다.", select: piece("lineset") },
    { id: "valves", name: "서비스 밸브", say: "배관이 실외기에 이어지는 곳의 밸브입니다. 설치할 때 열고, 수리할 때 닫아 냉매를 실외기 안에 가두어 둡니다.", select: `${piece("gasvalve")}, ${piece("liqvalve")}` },
    { id: "pipes", name: "실외기 안 배관", say: "사방 밸브와 실외 코일, 서비스 밸브, 팽창 밸브를 잇는 관입니다.", select: `${piece("gaspipes")}, ${piece("liquidpipes")}` },
    { id: "control", name: "제어 기판", say: "온도 센서 값을 읽어 압축기 속도(인버터), 팽창 밸브 열림, 사방 밸브 코일을 조절합니다.", select: piece("control") },
    { id: "frames", name: "틀과 받침", say: "실내기와 실외기의 틀, 실외기를 받치는 콘크리트 받침과 방진 고무발입니다.", select: `${piece("iuframe")}, ${piece("ouframe")}, ${piece("louver")}, ${piece("pad")}` },
  ],

  paramsIntro: "값을 바꾸면 게이지 바늘, 냉매 점의 속도, 판독값이 모델대로 바뀝니다. 그림의 사방 밸브를 눌러도 난방과 냉방이 바뀝니다.",
  params: [
    { id: "mode", type: "choice", label: "운전", value: "heat", options: [{ value: "heat", label: "난방" }, { value: "cool", label: "냉방" }], help: "사방 밸브가 냉매가 도는 방향을 뒤집습니다." },
    { id: "Tin", type: "range", label: "실내 온도", unit: "°C", min: 16, max: 30, step: 1, value: 20, digits: 0 },
    { id: "Tout", type: "range", label: "실외 온도", unit: "°C", min: -15, max: 40, step: 1, value: 7, digits: 0, help: "난방 성능 시험의 기준 실외 온도는 7 °C, 냉방은 35 °C입니다." },
    { id: "W", type: "range", label: "압축기 소비 전력 W", unit: "kW", min: 0.5, max: 2.5, step: 0.1, value: 1, digits: 1, help: "인버터가 압축기 회전 속도를 바꾸어 전력을 조절합니다." },
    { id: "flow", type: "toggle", label: "냉매 흐름 보기", value: true, on: "켬", off: "끔" },
  ],
  formulasTitle: "모델로 계산한 값",
  formulas: [
    { label: "이상 COP (실내·실외 공기 온도 사이)", text: "{idealAirText}" },
    { label: "냉매 온도 (코일 온도 차 가정)", text: "응축 {Tcond} = T고 + 15 K, 증발 {Tevap} = T저 − 10 K" },
    { label: "이상 COP (냉매 온도 사이)", text: "{idealRefText}" },
    { label: "실제 추정 COP", text: "COP ≈ {eta} × {idealRef} = {cop}" },
    { label: "에너지 보존", text: "Q고 = W + Q저 = {W} + {Qcold} = {Qhot}" },
    { label: "게이지 압력 (R-32 포화 압력)", text: "고압 약 {pHigh} · 저압 약 {pLow}" },
  ],
  formulaNote: "T고는 열을 받는 쪽, T저는 열을 내주는 쪽의 절대온도(K)입니다. 난방이면 T고가 실내, 냉방이면 T고가 실외입니다. 난방 COP는 T고 ÷ (T고 − T저), 냉방 COP는 T저 ÷ (T고 − T저)입니다. 45 %는 실제 공기열원 히트펌프가 카르노 COP의 약 40~50 %에 이른다는 자료에서 고른 가정입니다.",

  steps: [
    {
      title: "냉매가 한 바퀴 돕니다",
      text: "실내기와 실외기 사이를 냉매가 끊임없이 돕니다. 순서는 압축기 → 사방 밸브 → 응축기 → 팽창 밸브 → 증발기 → 다시 압축기입니다. 붉은 관은 뜨겁고 압력이 높은 냉매, 푸른 관은 차갑고 압력이 낮은 냉매입니다.",
      focus: ["compressor", "valve4", "iucoil", "eev", "oucoil"],
      pose: { ...HEAT },
    },
    {
      title: "압축기: 압력을 높이면 뜨거워집니다",
      text: "압축기는 저압 기체를 눌러 부피를 줄입니다. 압력이 {pLow}에서 {pHigh}로 높아지면서 냉매는 실내 공기보다 뜨거운 {Tcond} 이상의 기체가 됩니다. 이때 쓰는 전기가 {W}입니다.",
      focus: ["compressor", "discharge", "gaugehi"],
      pose: { ...HEAT },
    },
    {
      title: "사방 밸브: 뜨거운 냉매를 실내로",
      text: "난방에서는 사방 밸브의 코일에 전기가 흘러 밸브 안 미끄럼판이 옮겨집니다. 압축기에서 나온 뜨거운 냉매가 가스관을 따라 실내기로 갑니다.",
      focus: ["valve4", "solenoid", "lineset"],
      pose: { ...HEAT },
    },
    {
      title: "실내 코일 = 응축기: 열을 내놓습니다",
      text: "뜨거운 냉매가 실내 코일을 지나며 실내 공기에 열을 주고 식어서 액체가 됩니다(응축). 관류 팬이 데워진 공기를 위로 내보냅니다. 실내로 들어가는 열은 {Qhot}입니다.",
      focus: ["iucoil", "iufan", "headers"],
      pose: { ...HEAT },
    },
    {
      title: "팽창 밸브: 압력을 낮추면 차가워집니다",
      text: "액관을 따라 돌아온 액체 냉매가 팽창 밸브의 좁은 틈을 지나면 압력이 {pLow}로 떨어집니다. 압력이 낮으면 끓는점이 낮아지므로 냉매 일부가 끓으며 {Tevap}까지 차가워집니다.",
      focus: ["eev", "lineset", "gaugelo"],
      pose: { ...HEAT },
    },
    {
      title: "실외 코일 = 증발기: 바깥 공기에서 열을 가져옵니다",
      text: "바깥 공기가 {Tout}이어도 냉매는 그보다 차가운 {Tevap}입니다. 열은 따뜻한 곳에서 차가운 곳으로 흐르므로, 바깥 공기의 열 {Qcold}가 냉매로 들어가 냉매가 모두 끓어 기체가 됩니다.",
      focus: ["oucoil", "fan"],
      pose: { ...HEAT },
    },
    {
      title: "다시 압축기로: 에너지 보존",
      text: "기체가 된 냉매는 어큐뮬레이터를 거쳐 압축기로 돌아갑니다. 실내로 나간 열은 바깥에서 가져온 열과 압축기 전기의 합입니다: {Qhot} = {Qcold} + {W}. 그래서 COP가 1보다 큽니다(지금 {cop}).",
      focus: ["accumulator", "suction", "compressor"],
      pose: { ...HEAT },
    },
    {
      title: "사방 밸브를 돌리면 냉방",
      text: "냉방에서는 사방 밸브가 흐름을 뒤집습니다. 이제 뜨거운 냉매가 실외 코일로 가서 바깥으로 열을 버리고, 실내 코일은 {Tevap}까지 차가워져 실내의 열 {Qcold}를 빼앗습니다. 코일의 역할이 서로 바뀌었습니다.",
      focus: ["valve4", "iucoil", "oucoil"],
      pose: { mode: "cool", Tin: 26, Tout: 35, W: 1 },
    },
    {
      title: "추운 날에는 COP가 떨어집니다",
      text: "바깥이 {Tout}까지 추워지면 냉매는 {Tevap}까지 차가워져야 열을 가져올 수 있습니다. 압축기가 더 큰 온도 차를 끌어올려야 하므로 COP가 {cop}로 떨어집니다. 실외 코일에는 서리도 낍니다(흰 핀). 그래도 COP가 1보다 크므로 같은 전기로 전기 난로보다 많은 열을 냅니다.",
      focus: ["oucoil", "compressor", "gaugelo"],
      pose: { mode: "heat", Tin: 20, Tout: -10, W: 1 },
    },
  ],

  questions: [
    {
      q: "히트펌프는 쓴 전기보다 몇 배나 많은 열을 실내로 보냅니다. 이것은 에너지 보존 법칙에 어긋납니까?",
      choices: [
        { label: "어긋난다. 에너지가 저절로 생긴다" },
        { label: "어긋나지 않는다. 나머지 열은 바깥 공기에서 옮겨 온다", correct: true },
        { label: "어긋나지 않는다. 전기가 열로 바뀔 때 몇 배로 불어난다" },
      ],
      from: { ...HEAT },
      to: { ...HEAT },
      focus: ["oucoil", "compressor", "iucoil"],
      explain: "Q고 = W + Q저입니다. 그림의 값: {to.Qhot} = {to.W} + {to.Qcold}. 실외 코일 속 냉매({to.Tevap})가 바깥 공기({to.Tout})보다 차가워서 바깥의 열이 냉매로 들어옵니다. 히트펌프는 열을 만들지 않고 옮기므로, 들어온 에너지(전기 + 바깥 열)와 나간 에너지(실내로 간 열)가 같습니다.",
    },
    {
      q: "실외 온도가 7 °C에서 −10 °C로 내려가면 난방 COP는 어떻게 됩니까?",
      choices: [{ label: "커진다" }, { label: "작아진다", correct: true }, { label: "그대로다" }],
      from: { ...HEAT },
      to: { mode: "heat", Tin: 20, Tout: -10, W: 1 },
      focus: ["oucoil", "gaugelo"],
      explain: "열을 끌어올리는 온도 차가 커지면 같은 열을 옮기는 데 일이 더 듭니다. 그림의 값: COP {from.cop} → {to.cop} ({ratio.cop}). 저압 게이지도 {from.pLow}에서 {to.pLow}로 내려갑니다.",
    },
    {
      q: "난방 중에 사방 밸브를 냉방으로 바꾸면 실내 코일은 어떻게 됩니까?",
      choices: [{ label: "더 뜨거워진다" }, { label: "차가워진다", correct: true }, { label: "그대로다" }],
      from: { ...HEAT },
      to: { mode: "cool", Tin: 20, Tout: 7, W: 1 },
      focus: ["iucoil", "valve4"],
      explain: "사방 밸브가 냉매가 도는 방향을 뒤집어, 팽창 밸브를 지난 차가운 냉매가 실내 코일로 들어갑니다. 실내 코일은 응축기에서 증발기로 바뀌어 {to.Tevap}까지 차가워집니다. 실내 코일의 역할: {from.indoorCoil} → {to.indoorCoil}.",
    },
    {
      q: "실내·실외 공기 사이의 이상 COP는 실제 COP보다 훨씬 큽니다. 가장 큰 까닭은 무엇입니까?",
      choices: [
        { label: "코일에서 열이 건너가려면 냉매가 공기보다 더 뜨겁거나 더 차가워야 하기 때문이다", correct: true },
        { label: "전선에서 전기가 새기 때문이다" },
        { label: "냉매가 관 밖으로 조금씩 새기 때문이다" },
      ],
      from: { ...HEAT },
      to: { ...HEAT },
      focus: ["iucoil", "oucoil", "compressor"],
      explain: "실내 공기는 {to.Tin}, 바깥 공기는 {to.Tout}이지만 냉매는 응축 {to.Tcond}, 증발 {to.Tevap} 사이를 오가야 합니다. 그래서 냉매 온도 사이의 이상 COP가 {to.idealRef}로 줄고, 압축기 마찰·전동기 손실 같은 손실까지 더해 실제는 약 {to.cop}입니다. 공기 사이 이상 COP: {to.idealAir}.",
    },
  ],
};
