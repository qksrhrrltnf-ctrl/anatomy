// "간격 수직선": the six gaps on one line from 0 to 48 px, against merge and 2 × merge. Outside the drawing.
// The zones are the drawing's own rule (rig.ts): gap < merge joins, merge <= gap < 2·merge reaches, beyond is untouched.
// Zones carry direct text labels (identity never by colour alone); marks are dots with a surface ring; the
// handle is draggable and keyboard-free (the panel slider and the figure's keys cover keys).
import * as React from "react";
import { useStore, type store } from "../react/shell";
import { pairSentence, STATE_NAME, stateOf } from "./ko-text";
import { GAPS, MERGE_LEAST, MERGE_MOST } from "./rig";

const HEIGHT = 112;
const PAD = { left: 18, right: 18 };
const LINE_Y = 58;

export function NumberLine({ source, onDrag }: { source: ReturnType<typeof store<number>>; onDrag: (merge: number, done: boolean) => void }) {
  const merge = useStore(source);
  const box = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(600);
  const [hover, setHover] = React.useState<number | null>(null);
  const dragging = React.useRef(false);

  React.useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const fit = () => setWidth(Math.max(260, Math.round(node.clientWidth)));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const span = width - PAD.left - PAD.right;
  const x = (px: number) => PAD.left + (Math.min(MERGE_MOST, Math.max(0, px)) / MERGE_MOST) * span;
  const mergeAt = (clientX: number, rect: DOMRect) => Math.round(Math.min(MERGE_MOST, Math.max(MERGE_LEAST, ((clientX - rect.left - PAD.left) / span) * MERGE_MOST)));
  const twice = 2 * merge;
  const zones = [
    { from: 0, to: merge, kind: "joined", name: "합쳐짐" },
    { from: merge, to: Math.min(twice, MERGE_MOST), kind: "reach", name: "늘어남" },
    { from: Math.min(twice, MERGE_MOST), to: MERGE_MOST, kind: "plain", name: "영향 없음" },
  ].filter((zone) => zone.to - zone.from > 0.01);
  const ticks = [0, 8, 16, 24, 32, 40, 48];
  const read = hover === null ? "점에 마우스를 올리면 그 쌍의 상태를 읽습니다. 손잡이를 끌면 merge가 바뀝니다." : `간격 ${GAPS[hover]} px: ${pairSentence(GAPS[hover]!, merge)}.`;

  return (
    <section className="edu-line" aria-label="간격 수직선">
      <div className="edu-line-head">
        <h3 className="edu-line-title">간격 수직선 · merge {merge} px</h3>
        <p className="edu-line-sub">간격 &lt; merge이면 합쳐지고, merge의 2배({twice} px)보다 작으면 늘어납니다.</p>
      </div>
      <div ref={box} className="edu-line-box">
        <svg
          className="edu-line-svg"
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label={`간격 수직선. merge ${merge} px. ` + GAPS.map((gap) => `간격 ${gap} px ${STATE_NAME[stateOf(gap, merge)]}`).join(", ")}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (Math.abs(event.clientY - rect.top - LINE_Y) > 34) return;
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            onDrag(mergeAt(event.clientX, rect), false);
          }}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            if (dragging.current) {
              onDrag(mergeAt(event.clientX, rect), false);
              return;
            }
            const at = ((event.clientX - rect.left - PAD.left) / span) * MERGE_MOST;
            let best: number | null = null;
            GAPS.forEach((gap, index) => {
              if (Math.abs(gap - at) < 2.5 && (best === null || Math.abs(gap - at) < Math.abs(GAPS[best]! - at))) best = index;
            });
            setHover(best);
          }}
          onPointerUp={(event) => {
            if (!dragging.current) return;
            dragging.current = false;
            onDrag(mergeAt(event.clientX, event.currentTarget.getBoundingClientRect()), true);
          }}
          onPointerLeave={() => setHover(null)}
        >
          {zones.map((zone) => (
            <g key={zone.kind}>
              <rect className="edu-line-zone" data-kind={zone.kind} x={x(zone.from)} y={LINE_Y - 7} width={Math.max(0, x(zone.to) - x(zone.from))} height={14} rx={3} />
              {x(zone.to) - x(zone.from) > 52 ? (
                <text className="edu-line-zone-name" x={(x(zone.from) + x(zone.to)) / 2} y={LINE_Y - 14} textAnchor="middle">
                  {zone.name}
                </text>
              ) : null}
            </g>
          ))}
          {ticks.map((tick) => (
            <text key={tick} className="edu-line-tick" x={x(tick)} y={HEIGHT - 6} textAnchor="middle">
              {tick}
            </text>
          ))}
          {twice <= MERGE_MOST ? <line className="edu-line-twice" x1={x(twice)} x2={x(twice)} y1={LINE_Y - 12} y2={LINE_Y + 12} /> : null}
          {GAPS.map((gap, index) => (
            <g key={gap}>
              <circle className="edu-line-gap" data-kind={stateOf(gap, merge)} data-hover={hover === index ? "" : undefined} cx={x(gap)} cy={LINE_Y} r={4.5} />
              <text className="edu-line-gap-name" x={x(gap)} y={LINE_Y + 24} textAnchor="middle">
                {gap}
              </text>
            </g>
          ))}
          <g className="edu-line-handle">
            <line x1={x(merge)} x2={x(merge)} y1={LINE_Y - 22} y2={LINE_Y + 14} />
            <path d={`M${x(merge) - 6} ${LINE_Y - 30} h12 l-6 8 z`} />
          </g>
        </svg>
      </div>
      <p className="edu-line-read" aria-hidden="true">
        {read}
      </p>
    </section>
  );
}
