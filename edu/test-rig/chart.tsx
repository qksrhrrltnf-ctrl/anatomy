// "다이얼 게이지 기록": lean after letting go, against time. Outside the drawing (a UI layer under the card).
// Every curve is the rig's own model (rig.ts releaseCurve, the same step() the figure runs); the dot is the figure now.
// Form: line chart (change over time), one y-axis, legend always shown for 2+ series, crosshair + readout on hover,
// a table view. Series colours: reference palette slots 1-3, stepped per theme (validated light #fbfbfa / dark #131313).
import * as React from "react";
import { useStore, type store } from "../react/shell";
import { releaseCurve, releaseStats, tuneOf } from "./rig";

export interface Setting {
  k: number;
  zeta: number;
  /** signed lean at the moment of letting go, px */
  from: number;
}

export interface ChartState {
  now: Setting;
  ghost: Setting | null;
  compare: boolean;
}

export interface ChartDot {
  (since: number | null, lean: number): void;
}

const SECONDS = 3;
const EVERY = 1 / 60;
const Y_MOST = 12;
const HEIGHT = 196;
const PAD = { left: 44, right: 14, top: 24, bottom: 34 };
const COMPARE = [0.2, 1, 2] as const;

const zText = (z: number) => z.toFixed(2);
const sign = (value: number) => (Math.abs(value) < 0.05 ? "0.0" : `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}`);

interface Series {
  key: string;
  name: string;
  setting: Setting;
  points: number[];
  kind: "now" | "ghost" | "c1" | "c2" | "c3";
}

function seriesOf(state: ChartState): Series[] {
  const out: Series[] = [];
  const { now } = state;
  if (state.compare) {
    COMPARE.forEach((z, index) => {
      const setting = { ...now, zeta: z };
      out.push({ key: `c${index}`, name: `ζ ${zText(z)}`, setting, points: releaseCurve(tuneOf(now.k, z), now.from, SECONDS, EVERY), kind: (["c1", "c2", "c3"] as const)[index]! });
    });
  }
  if (state.ghost) out.push({ key: "ghost", name: `지난번 (k ${state.ghost.k}, ζ ${zText(state.ghost.zeta)})`, setting: state.ghost, points: releaseCurve(tuneOf(state.ghost.k, state.ghost.zeta), state.ghost.from, SECONDS, EVERY), kind: "ghost" });
  out.push({ key: "now", name: `지금 설정 (k ${now.k}, ζ ${zText(now.zeta)})`, setting: now, points: releaseCurve(tuneOf(now.k, now.zeta), now.from, SECONDS, EVERY), kind: "now" });
  return out;
}

export function ResponseChart({ source, dotRef }: { source: ReturnType<typeof store<ChartState>>; dotRef: React.MutableRefObject<ChartDot | null> }) {
  const state = useStore(source);
  const box = React.useRef<HTMLDivElement>(null);
  const dot = React.useRef<SVGCircleElement>(null);
  const [width, setWidth] = React.useState(600);
  const [hover, setHover] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const fit = () => setWidth(Math.max(260, Math.round(node.clientWidth)));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const series = React.useMemo(() => seriesOf(state), [state]);
  const stats = React.useMemo(() => series.map((entry) => releaseStats(tuneOf(entry.setting.k, entry.setting.zeta), entry.setting.from, 6)), [series]);

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + (t / SECONDS) * plotW;
  const y = (lean: number) => PAD.top + ((Y_MOST - Math.max(-Y_MOST, Math.min(Y_MOST, lean))) / (2 * Y_MOST)) * plotH;
  const pathOf = (points: number[]) => points.map((lean, index) => `${index ? "L" : "M"}${x(index * EVERY).toFixed(1)} ${y(lean).toFixed(1)}`).join("");

  // the live dot follows the figure without a React render
  React.useEffect(() => {
    dotRef.current = (since, lean) => {
      const node = dot.current;
      if (!node) return;
      if (since === null || since > SECONDS) {
        if (node.style.opacity !== "0") node.style.opacity = "0";
        return;
      }
      node.style.opacity = "1";
      node.setAttribute("cx", x(since).toFixed(1));
      node.setAttribute("cy", y(lean).toFixed(1));
    };
    return () => {
      dotRef.current = null;
    };
  });

  const ticksX = [0, 0.5, 1, 1.5, 2, 2.5, 3];
  const ticksY = [-10, -5, 0, 5, 10];
  const at = hover === null ? null : Math.round(hover / EVERY);
  const label = (entry: Series) => entry.name;
  const readout =
    at === null
      ? "그래프 위에 마우스를 올리면 그 순간의 기울기를 읽습니다."
      : `${(at * EVERY).toFixed(2)}초: ` + series.map((entry) => `${label(entry)} ${sign(entry.points[at] ?? 0)} px`).join(" · ");
  const now = series[series.length - 1]!;
  const nowStats = stats[stats.length - 1]!;
  const summary = `놓은 뒤 기울기 그래프. 지금 설정 k ${now.setting.k}, 감쇠비 ${zText(now.setting.zeta)}: ${sign(now.setting.from)} px에서 출발해 ${nowStats.over.toFixed(1)} px 지나쳤다가 ${nowStats.settle.toFixed(2)}초에 멈춥니다.`;

  return (
    <section className="edu-chart" aria-label="다이얼 게이지 기록">
      <div className="edu-chart-head">
        <h3 className="edu-chart-title">다이얼 게이지 기록 · 놓은 뒤 기울기</h3>
        <p className="edu-chart-sub">선은 모델로 계산한 값이고, 점은 지금 그림의 바늘입니다.</p>
      </div>
      <ul className="edu-chart-legend">
        {series.map((entry) => (
          <li key={entry.key}>
            <svg className="edu-chart-key" viewBox="0 0 18 8" aria-hidden="true" focusable="false">
              <path d="M1 4h16" data-kind={entry.kind} />
            </svg>
            {entry.name}
          </li>
        ))}
      </ul>
      <div ref={box} className="edu-chart-box">
        <svg
          className="edu-chart-svg"
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={summary}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const t = ((event.clientX - rect.left - PAD.left) / plotW) * SECONDS;
            setHover(t < 0 || t > SECONDS ? null : t);
          }}
          onPointerLeave={() => setHover(null)}
        >
          {ticksY.map((value) => (
            <g key={value}>
              <line className={value === 0 ? "edu-chart-zero" : "edu-chart-grid"} x1={PAD.left} x2={width - PAD.right} y1={y(value)} y2={y(value)} />
              <text className="edu-chart-tick" x={PAD.left - 6} y={y(value)} dy="0.32em" textAnchor="end">
                {value > 0 ? `+${value}` : value < 0 ? `−${-value}` : "0"}
              </text>
            </g>
          ))}
          {ticksX.map((value) => (
            <text key={value} className="edu-chart-tick" x={x(value)} y={HEIGHT - PAD.bottom + 15} textAnchor="middle">
              {value}
            </text>
          ))}
          <text className="edu-chart-axis" x={width - PAD.right} y={HEIGHT - 3} textAnchor="end">
            놓은 뒤 시간 (초)
          </text>
          <text className="edu-chart-axis" x={4} y={11} textAnchor="start">
            기울기 (px)
          </text>
          {series.map((entry) => (
            <path key={entry.key} className="edu-chart-line" data-kind={entry.kind} d={pathOf(entry.points)} />
          ))}
          {at !== null ? <line className="edu-chart-cross" x1={x(at * EVERY)} x2={x(at * EVERY)} y1={PAD.top} y2={HEIGHT - PAD.bottom} /> : null}
          {at !== null
            ? series.map((entry) => <circle key={entry.key} className="edu-chart-mark" data-kind={entry.kind} cx={x(at * EVERY)} cy={y(entry.points[at] ?? 0)} r={4} />)
            : null}
          <circle ref={dot} className="edu-chart-dot" r={4.5} cx={x(0)} cy={y(0)} style={{ opacity: 0 }} />
        </svg>
      </div>
      <p className="edu-chart-read" aria-hidden="true">
        {readout}
      </p>
      <details className="edu-chart-table">
        <summary>표로 보기</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">곡선</th>
              <th scope="col">출발</th>
              <th scope="col">첫 되튐</th>
              <th scope="col">그때</th>
              <th scope="col">멈춤 (0.1 px 안)</th>
            </tr>
          </thead>
          <tbody>
            {series.map((entry, index) => (
              <tr key={entry.key}>
                <th scope="row">{entry.name}</th>
                <td>{sign(entry.setting.from)} px</td>
                <td>{stats[index]!.over.toFixed(1)} px</td>
                <td>{stats[index]!.over > 0.05 ? `${stats[index]!.overAt.toFixed(2)}초` : "—"}</td>
                <td>{stats[index]!.settle.toFixed(2)}초</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
