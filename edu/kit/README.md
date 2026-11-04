# edu-kit: Anatomy 교육판(한국어) 공통 레이어

예제 하나를 교육판으로 만들 때 필요한 것은 두 가지뿐입니다.

1. **`ko.mjs`**: 한국어 콘텐츠와 변수 정의(선언형 데이터)
2. **어댑터**: 그림의 라이브 상태를 읽고 쓰는 함수 몇 개(라이브 스크립트 안)

카드·툴팁·강조·부품 목록·변수 패널·단계 가이드·탐구 질문·상태 줄은 모두 kit이 그립니다. 시범 구현은 `edu/push-button/`입니다. 막히면 그 파일을 먼저 여십시오.

| 파일 | 하는 일 |
|---|---|
| `edu.mjs` | 빌드 도우미. `eduPage()`가 페이지 전체(HTML)를 만들고 `checkContent()`가 `ko.mjs`를 검사합니다. |
| `edu.js` | 브라우저 런타임. 전역 `EDU` 하나(`window.EDU`)를 정의합니다. 페이지에 인라인됩니다. |
| `edu.css` | 패널·툴팁·상태 줄·강조 스타일. 원본 `iso` 토큰만 씁니다(다크·라이트 자동). |

## 1. 빌드 (프레임워크 없는 예제)

원본 `examples/<이름>/build.mjs`를 `edu/<이름>/build.mjs`로 복사합니다. 상대 경로 깊이가 같으므로 `../../kit/…`, `../../scripts/…` import는 그대로 둡니다. 원본(`examples/`, `kit/`, `scripts/`)은 고치지 않습니다.

```js
import { eduPage, writePage } from "../kit/edu.mjs";
import content from "./ko.mjs";

// 원본의 상수는 ko.mjs의 기본값에서 가져옵니다 (숫자는 한 곳에서만 나옵니다)
const VOLTS = content.params.find((p) => p.id === "V").value;

const stage = `<div class="iso-stage" tabindex="0" role="button" aria-label="(한국어 설명)">${svg}</div>`;
const html = eduPage({ content, theme, stage, css: CSS, script: kitScript() + live });
writePage(HERE, theme === "light" ? "<이름>-ko-light.html" : "<이름>-ko.html", html);
```

`eduPage(options)`

| 옵션 | 뜻 |
|---|---|
| `content` | `ko.mjs`의 기본 내보내기. 빌드 때 `checkContent()`가 검사하고, 틀리면 무엇이 틀렸는지 적고 빌드를 멈춥니다. |
| `theme` | `"dark"` 또는 `"light"` |
| `stage` | 그림 무대 마크업(`.iso-stage` 안에 svg, canvas 등) |
| `css`, `script` | 예제 CSS, 그리고 `kitScript()`(+`glScript()`) + 라이브 스크립트. kit 런타임은 자동으로 맨 앞에 붙습니다. |
| `head` | 카드 본문에서 무대 앞에 넣을 마크업(예: PDF 버튼) |
| `width` | 페이지 폭(기본 1440). 패널은 400px(1200px 이하에서 340px)이고 그림 열이 나머지를 모두 씁니다. 1000px 이하에서는 패널이 그림 아래로 내려갑니다. |
| `values` | 카드 캡션·범례 속 `{키}` 템플릿의 첫 화면 글자(스크립트가 돌기 전). 예: `{ V: "1.5 V", I: "0.30 A" }`. 런타임이 `refresh()` 때마다 `adapter.values()`로 다시 채웁니다. |
| `figureClass`, `pageClass` | `.edu-figure`, `.edu` 래퍼에 붙일 클래스. 예제 CSS가 `.rp` 같은 클래스에 묶여 있을 때 씁니다. |

결과는 파일 하나입니다. 외부 글꼴·CDN이 없고(맑은 고딕 등 시스템 글꼴), `<html lang="ko">`, 콘텐츠는 `<script type="application/json" id="edu-content">`에 들어갑니다.

## 2. `ko.mjs` 스키마

```js
export default {
  lang: "ko",
  page: { title, kicker, heading, lead, footer },        // 그림 위 머리말, 아래 각주(모델의 단순화 가정을 여기 씁니다)
  card: { fig: "그림 1", title, hint, readout, keys: [{ mark, label }], caption },  // 원본 카드의 한국어판. caption·keys.label에도 {키} 템플릿 사용 가능
  keep: [".pb-glow"],          // 강조할 때 흐리게 하지 않을 요소(빛, 그림자 층 등)
  dim: "tone",                 // 강조 방식: "tone"(기본, 불투명하게 톤만 낮춤) | "fade"(불투명도)
  start: "params",             // 처음 열 탭: params | steps | questions | parts
  autoplay: true,              // 처음에 자동 투어를 켤지(어댑터에 tour가 있을 때)
  questionDelay: 1400,         // 질문: 예측 자세 → 확인 자세까지 기다리는 시간(ms). 질문마다 delay로 덮어씀
  partAttr: "data-piece",      // part.select를 생략했을 때 쓸 속성 이름 (어댑터 partAttr가 우선)

  parts: [{ id, name, say, more?, select? }],   // select는 CSS 선택자. 생략하면 [data-piece="id"]
  params: [
    { id, type: "range", label, unit, min, max, step, value, digits?, help? },
    { id, type: "toggle", label, value, on?, off?, help? },
    { id, type: "choice", label, value, options: [{ value, label }], help? },
    { id, type: "action", label, help? },        // 상태 없는 1회 실행 버튼(동전 넣기, 점화…)
  ],
  paramsIntro, formulasTitle,
  formulas: [{ label, text: "I = V ÷ R = {V} ÷ {R} = {I}" }],
  formulaNote,
  steps: [{ title, text, focus: [partId], pose: { … } }],
  questions: [{ q, choices: [{ label, correct? }], from: { … }, to: { … }, focus, explain, delay? }],
  ui: { … },                   // 버튼 문구 등 기본 한국어 문구 덮어쓰기(edu.js의 UI 참고)
};
```

**템플릿.** 문장 안의 `{키}`(공식, 단계, 질문, 부품 설명, 카드 캡션, 범례)는 어댑터 `values()`가 돌려준 값의 글자(`t`)로 바뀝니다. 질문 해설에서는 `{from.P}`, `{to.P}`(예측 자세·확인 자세에서 잰 값), `{ratio.P}`(to ÷ from, 예: `4배`), `{answer}`(정답 문구)를 씁니다. 숫자와 단위 사이 공백은 자동으로 줄바꿈 없는 공백이 됩니다. **문장 속 숫자는 직접 쓰지 말고 템플릿으로 쓰십시오.** 그래야 모델과 어긋나지 않습니다.

**pose.** 단계와 질문의 `pose`, `from`, `to`는 객체입니다. 키가 변수 id이면 kit이 그 변수를 바꾸고(컨트롤도 따라 움직임), 값이 참인 `action` 변수 id면 그 동작을 실행합니다. 그 밖의 키(`pressed`, `tap`, `apart` 등)는 객체 전체와 함께 `adapter.pose(pose)`로 넘어갑니다. 변수가 먼저 적용되고 그다음 `pose()`가 불립니다. 단계 자세에는 실험에 필요한 변수를 모두 적으십시오(앞 단계에서 바꾼 값이 남지 않게).

**한국어 문체.** 학생 대상 합니다체, 짧은 문장, 교과서 용어(전압, 전류, 저항, 닫힌 회로 …). 조사 문제를 피하려고 템플릿 뒤에는 `입니다`, `의`, `로`(받침 없는 단위 이름에 맞음)처럼 받침과 무관한 말을 붙입니다. 예: `{V}의 전압으로`, `= {I}입니다`. `{P}가`처럼 쓸 때는 단위 이름(와트, 볼트, 암페어)의 받침을 확인하십시오.

## 3. 어댑터 (라이브 스크립트 안)

```js
let edu = null;                       // mount 중에도 set()이 불리므로 edu?.로 부릅니다
edu = EDU.mount({
  stage,                              // 기본: document.querySelector(".iso-stage")
  root,                               // 선택: 부품을 찾을 요소(하나 또는 배열). 기본: stage 안의 모든 <svg>
  partAttr,                           // 선택: "data-piece"(기본) | "data-part" …
  probe,                              // 선택: 그림 층이 pointer-events:none이면 true (툴팁 hit 검사 때만 잠시 켭니다)
  hoverTips,                          // 선택: false면 그림 위 마우스 툴팁을 끕니다(부품 목록은 그대로)
  panel,                              // 선택: 패널 요소. 기본 [data-edu-panel], null이면 패널 없음
  set(id, value, info) { … },         // 필수. 변수 하나를 모델과 그림에 적용. info.initial이면 첫 적용
  values() { return { V: { n: 1.5, t: "1.5 V" }, … }; },   // 템플릿용 값. 숫자 n, 글자 t
  pose(pose) { … },                   // 변수가 아닌 자세 키 처리. pose.reset이면 처음 상태로
  action(id) { … },                   // type: "action" 버튼이 눌렸을 때 (없으면 set(id, true))
  tour(on) { … },                     // 자동 투어 켜기/끄기 (투어 정책 4절)
  takeOver() { … },                   // 선택: 독자가 조작을 시작했을 때 추가로 할 일
  highlight(ids) { … },               // 선택: 강조를 예제 방식으로 직접 그림. null이면 해제
});
```

`values()`는 **움직임이 끝난 뒤의 모델 값**을 돌려주어야 합니다. 질문은 자세를 바꾼 즉시 값을 재기 때문입니다. 화면 모서리 판독값(`[data-readout]`)은 원본처럼 지금 움직이는 부품의 위치에서 계산합니다. 둘이 다를 수 있는 값은 키를 나눕니다(시범: `Inow` = 지금, `Iend` = 멈춘 뒤).

`EDU.mount()`가 돌려주는 핸들:

| 메서드 | 뜻 |
|---|---|
| `refresh()` | 템플릿 글자(공식, 단계 문장, 툴팁)를 다시 채웁니다. 모델이 바뀌면(닫힘/열림 전환 등) 부르십시오. 매 프레임 부르지 마십시오. |
| `sync(id, value)` | 그림 쪽 조작(끌기, 키)으로 바뀐 값을 패널에 반영합니다. 컨트롤과 공식만 움직이고 `adapter.set`은 **부르지 않습니다**(되먹임 없음). |
| `setParam(id, value)` | 프로그램이 변수를 바꿉니다(`adapter.set` 호출). |
| `status({ level, text, action? } \| null)` | 그림 아래 상태 줄. level: `ok`·`info`·`warn`·`danger`. `action: { label, run }`이면 버튼이 붙습니다. 같은 내용이면 DOM을 건드리지 않습니다. |
| `focus(ids)` | 안내용 강조(단계와 같은 층). |
| `flash(ids, ms)` | 일시 강조. 단계 강조 위에 잠깐 겹치고 저절로 풀립니다. |
| `sequence([ids…], { each, loop })` | 순차 강조(키보드 → 케이블 → 본체 → 화면). 멈추는 함수를 돌려줍니다. |
| `hint(text)` | 카드 왼쪽 아래 조작 안내를 바꿉니다(모드에 따라). |
| `takeOver()` | 그림을 직접 조작하는 핸들러(누르기, 끌기, 키) 맨 앞에서 부르십시오. 투어를 끄고 자동 재생 스위치도 끕니다. |
| `autoplay(on?)` | 자동 재생 상태 읽기/쓰기 |
| `values()`, `fill(text)`, `still()` | 값 표, 템플릿 채우기, 동작 줄이기 설정 여부 |
| `destroy()` | 리스너, 타이머, rAF, 툴팁·상태 줄(kit이 만든 것), 패널 내용, 강조 속성을 모두 정리합니다. |

**두 번 붙지 않습니다.** 같은 `stage`에 `mount`를 다시 부르면 처음 핸들을 그대로 돌려줍니다. React StrictMode에서는 `useEffect(() => { const edu = EDU.mount(adapter, { content }); return () => edu.destroy(); }, [])`처럼 정리 함수에서 `destroy()`를 부르면 두 번째 마운트가 깨끗하게 붙습니다. React 페이지는 `eduPage()`를 쓰지 않으므로 `edu.css`를 따로 넣고, `options.content`로 콘텐츠를 넘기고, 패널 자리(`[data-edu-panel]` 또는 `adapter.panel`)를 만들어 두십시오. 툴팁·상태 줄 요소가 없으면 kit이 만들고 `destroy()` 때 지웁니다.

### 강조(하이라이트)

우선순위: 마우스 올림 > `flash`/`sequence` > 부품 목록 선택 > 단계·질문 강조.

기본 강조는 DOM 쓰기를 최소로 합니다. 루트(svg)에 `data-edu-focus`, 대상 부품 요소에 `data-edu-on`, 그 조상에 `data-edu-path`만 붙이고, 경로 옆의 형제들은 CSS가 흐리게 합니다. 그룹이 수백 개인 그림(오락기 1 MB)도 마우스를 움직일 때 속성 몇 개만 바뀝니다. 툴팁 hit 검사는 `elementsFromPoint` + `closest(모든 부품 선택자)` 위임 방식이고, rAF로 한 프레임에 한 번만 합니다.

- `dim: "tone"`(기본): 흐린 부품도 **불투명**합니다. 선은 `lo`/`faint`로, 면은 종이색 쪽으로 톤만 낮춥니다. 그래서 겹친 솔리드 뒤가 비쳐 보이지 않고 깊이 순서가 그대로입니다. 빨강·초록·파랑 토큰과 `--edu-flow`도 낮아집니다.
- `dim: "fade"`: 불투명도를 낮춥니다(뒤가 비칩니다). 엑스선처럼 보여 주고 싶을 때만 쓰십시오.
- 예제 고유 색(`--pb-glow` 같은 변수)은 tone이 모릅니다. 그런 요소는 `keep`에 넣거나 예제 CSS에 `[data-edu-focus="tone"] [data-edu-path]>…` 규칙을 추가하거나, `adapter.highlight(ids)`로 직접 처리하십시오.
- 부품 안에서 숨겨 둔 요소는 `visibility:hidden`이 아니라 `display:none`으로 숨기십시오. 숨긴 요소도 경계 상자에 들어가 툴팁 위치가 엉뚱해집니다.
- **0.6 px 선 부품**(전선, 스프링)은 마우스로 맞히기 어렵습니다. 부품 목록에서 고를 수 있다는 점을 `partsIntro`에 적고, 필요하면 같은 그룹 안에 투명한 넓은 hit 선을 넣으십시오: `<path d="(같은 경로)" fill="none" stroke="transparent" stroke-width="8" pointer-events="stroke" data-edu-hit/>`. `iso-line` 클래스를 붙이지 않으면 선 끝 검사에도 걸리지 않습니다.

## 4. 표준 정책

**투어.** 원본의 "몇 초 뒤 투어 재개"는 교육판에서 쓰지 않습니다. 단계·질문 자세를 덮어쓰기 때문입니다.
- 처음 열면 투어가 돕니다(`autoplay`, 동작 줄이기 설정이면 돌지 않음).
- 독자가 그림·패널·단계·질문 중 무엇이든 건드리면 kit이 `adapter.tour(false)`를 부르고 끝입니다. 다시 켜지는 것은 패널의 "자동 재생" 스위치뿐입니다.
- 어댑터 쪽에서는 `touring = false`로 시작하고, 원본의 재개 타이머(`idleTimer`)를 지우고, 그림 핸들러에서 `edu.takeOver()`를 부르십시오.

**조작과 툴팁의 분리.** 마우스 올림이 곧 조작인 원본(다이얼 게이지: hover로 캐리지 이동, 데스크 컴퓨터: 본체 클릭으로 전원)은 툴팁과 부딪힙니다. 교육판에서는
- hover = 툴팁·강조만, 조작 = 끌기·클릭·키·패널 컨트롤로 나눕니다. 원본의 hover 이동은 "끌기"로 바꾸고(포인터 캡처), 같은 값은 슬라이더로도 둡니다.
- 클릭 하나로 바뀌던 상태(전원)는 `action`이나 `toggle` 변수로도 패널에 둡니다.
- kit은 버튼을 누른 채 움직이는 동안 툴팁을 띄우지 않고, 터치에서는 8 px 넘게 움직였거나 0.5초 넘게 누른 경우(끌기)에는 탭 툴팁을 띄우지 않습니다.
- 그래도 충돌하면 `hoverTips: false`로 그림 위 툴팁을 끄고 부품 목록만 쓰십시오.

**키 우선순위.** 그림의 키(`stage`에 포커스)가 먼저입니다. kit은 문서 수준에서 Escape만 듣고, ① 이미 `preventDefault()`된 키, ② 포커스가 stage 안에 있는 키는 무시합니다. 그림이 Escape를 쓰면 `preventDefault()`하십시오. kit의 Escape는 부품 목록 선택과 `flash`를 풉니다. 패널 안의 화살표 키(탭, 선택지, 슬라이더)는 각 컨트롤이 처리합니다.

**동작 줄이기.** `prefers-reduced-motion`이면 투어가 없고, 질문 확인 지연이 250 ms로 줄고, 패널 전환 효과가 꺼집니다. 그림 쪽(흐름 점, 깜박임)은 어댑터가 `edu.still()`이나 원본의 `still`로 멈춥니다. 입력에는 계속 반응해야 합니다.

**숫자.** 슬라이더, 판독값, 공식, 문장, 그림에 새겨진 라벨의 숫자는 모두 같은 모델에서 나와야 합니다. 그림 기하를 다시 만들어야 하는 변수(경사각 등)는 슬라이더로 만들지 말고 공식 패널(계산만)로 보여 주십시오.

## 5. 예제를 고를 때의 원칙

- 변수는 **그림이 실제로 반응하는 것**만 둡니다. 숫자만 바뀌는 슬라이더는 공식 패널로 충분합니다.
- 최소·최대에서 그림이 깨지지 않는 범위를 고르십시오(라벨 폭, 빛 크기, 이동 거리).
- 위험·한계(필라멘트 끊어짐 같은)가 있으면 상태 줄(`warn`/`danger`)로 미리 알리고, 연출은 되돌릴 수 있게(`action` 버튼) 하십시오.
- 단계는 5~7개, 질문은 2~3개. 질문은 "예측 → 그림이 바뀌며 확인"이 되도록 `from`과 `to` 자세를 둡니다. 확인 장면이 애니메이션이면 `delay`를 늘리십시오(랩터 3000 ms 등).
- 모델이 실제와 다르게 단순화된 점(저항 일정 등)은 `page.footer`에 한 줄로 밝힙니다.
- **캡션·설명의 숫자는 모델을 따르거나 기준값임을 밝힙니다.** 카드 캡션, 범례, 부품 설명에 숫자를 쓸 때는 `{키}` 템플릿으로 써서 변수를 바꾸면 따라 바뀌게 하십시오. 고정 숫자가 꼭 필요하면 "처음 값(1.5 V, 5 Ω) 기준"처럼 기준임을 문장에 적으십시오.

## 6. 검증

```sh
node edu/<이름>/build.mjs && node edu/<이름>/build.mjs --light
cd edu/<이름>
node ../../scripts/capture.mjs <이름>-ko.html --out shots/desk.png --select .edu --height 1300 --scale 1
node ../../scripts/capture.mjs <이름>-ko.html --out shots/phone.png --width 390 --select .edu
node ../../scripts/lines.mjs <이름>-ko.html --reduced            # line ends: 0
node ../../scripts/drive.mjs <이름>-ko.html --actions verify/lines.json --height 1300   # 모든 정지 자세에서 선 끝 0
```

- 콘솔 clean, 가로 스크롤 없음: 다크·라이트 × 1440·390.
- **선 끝 검사는 강조를 푼 상태에서** 하십시오. 흐린 요소는 검사 대상에서 빠질 수 있습니다(단계 탭에서 부품 탭으로 옮기면 단계 강조가 풀립니다). 시범의 `verify/lines.json`이 그 순서입니다.
- 변수 최소·최대에서 공식 패널 글자를 `eval`로 읽어 손으로 계산한 값과 맞춰 보십시오(`verify/minmax.json`).
- 키보드: 슬라이더 화살표, 선택지 화살표, 탭 화살표, 그림 Space(`verify/keys.json`). 마운트 가드와 `destroy()`(`verify/api.json`).
- 캡처는 툴팁, 변수 최소·최대, 단계, 질문, 부품, 390px를 모두 Read로 열어 보십시오. 패널이 그림을 가리는지, 글자가 넘치는지, 다크·라이트 대비가 낮은 곳이 없는지 봅니다.
- 원본을 다시 빌드한 뒤 `git status`에 `examples/`가 나오지 않아야 합니다.
- drive의 `click`은 보이지 않는 요소(닫힌 탭, 390px에서 화면 밖)에서 실패할 수 있습니다. 그럴 때는 `["eval", "document.getElementById('edu-tab-steps').click()"]`처럼 누르십시오.

## 변경 이력

kit 수정은 하위 호환을 지킵니다(기존 API와 `ko.mjs` 키는 그대로 동작). 수정할 때마다 한 줄씩 적습니다.

- 2026-11-04 · 시범판(누름 버튼): eduPage, EDU.mount, 패널 4탭, 툴팁, tone 강조, root/probe/partAttr, flash/sequence, sync, action, autoplay, destroy·마운트 가드.
- 2026-11-04 · 카드 캡션과 범례(`card.caption`, `card.keys[].label`)에 `{키}` 템플릿 지원. `eduPage({ values })`로 첫 화면 글자를 채우고, 런타임이 `refresh()` 때 다시 채웁니다. 템플릿이 없는 캡션은 예전처럼 고정 글자입니다.
- 2026-11-04 · 레이아웃: 기본 페이지 폭 1120 → 1440, 패널 340 → 400px(1200px 이하 340px), 패널이 내려가는 폭 920 → 1000px. 그림 열이 남는 폭을 모두 써서 데스크톱에서 그림이 커집니다. `width`를 직접 넘긴 페이지는 그대로입니다. 390px 동작은 같습니다.
- 2026-11-04 · tone 강조 대비: 강조 대상의 톤을 한 단계 올리고(lo→mid, mid→hi, hi→lit, 윤곽이 밝아짐), 다크에서는 흐린 나머지를 한 단계 더 낮춥니다. 흐린 부품은 여전히 불투명합니다.
