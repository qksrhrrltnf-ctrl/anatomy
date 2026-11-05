# edu — 한국어 인터랙티브 교육판 소스

원본 예제(`examples/`)를 고치지 않고, 그 사본 위에 한국어 교육 레이어를 얹은 소스입니다.
완성된 페이지는 사례집에서 볼 수 있습니다: https://qksrhrrltnf-ctrl.github.io/anatomy-casebook/

## 구조

| 경로 | 내용 |
|---|---|
| `kit/` | 공통 교육 레이어: `edu.css`, `edu.js`(런타임), `edu.mjs`(빌드 도우미 `eduPage`, `writePage`, `checkContent`) |
| `<이름>/ko.mjs` | 한국어 콘텐츠: 카드, 부품 설명, 변수, 공식, 단계 가이드, 탐구 질문 |
| `<이름>/build.mjs`, `live.js` | 원본 빌드·동작 스크립트의 사본에 교육 레이어를 연결한 것 |
| `<이름>/verify/` | 검증용 동작 시나리오(`drive.mjs`) |
| `react/` | React 예제 2종(test-rig, spot-plate)의 교육판 껍데기 |
| `react-harness/` | React 예제를 파일 하나짜리 HTML로 묶는 Vite 하네스 |

## 빌드

저장소 루트에서 실행합니다(Node 22 이상).

```sh
node edu/push-button/build.mjs           # SVG 예제, 다크: edu/<이름>/<이름>-ko.html
node edu/push-button/build.mjs --light   # 라이트: <이름>-ko-light.html
cd edu/react-harness && npm install && node build-all.mjs ko   # React 예제 2종
```

검증은 원본과 같은 도구를 씁니다: `scripts/capture.mjs`, `scripts/drive.mjs`, `scripts/lines.mjs`, `--audit`.

## 참고

- 같은 소스를 Windows에서 빌드하면 macOS CI 결과와 부동소수점 끝자리가 다를 수 있습니다(raptor-engine, turning-dial 스트레스 페이지). 그림에는 차이가 없습니다.
- 원본: https://github.com/wheresryan22/anatomy (MIT License)
