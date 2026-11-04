"use client";

// Teaching fork of examples/spot-plate/live.tsx.
// Changes from the original (edu/spot-plate/설계 참고):
// - hover no longer drives merge (hover is for tooltips); a press-and-drag that starts on the fan does, and the keys do;
// - leaving the figure no longer glides merge back to 20;
// - a control handle (setMerge, tour) for the teaching layer; onUserMerge reports drags and keys to the panel;
// - the tour runs only while the teaching layer says so (kit policy: on at load, off for good once the reader acts);
// - each row of drops sits in one stable <g data-piece="pair-N">, so a highlight survives the drops re-rendering;
// - Korean readout and labels come in through props.
import * as React from "react";
import { IsoFigure } from "../../kit/react/draw";
import { asksForStillness, useReadout } from "../../kit/react/live";
import { keyOf, rowsOf, type GlassShape, type RowShape } from "./drops";
import { fanOf, type FanPose } from "./fan";
import { HEIGHT, MERGE, MERGE_LEAST, MERGE_MOST, MERGE_STEP, ROWS, WIDTH, mergeAtX, roundMerge } from "./rig";

const FOLLOW = 150;
export const GLIDE = 560;
const SETTLED = 0.004;
const TOUR_FIRST = 1800;
const TOUR_TRAVEL = 1400;
const TOUR: { merge: number; hold: number }[] = [
  { merge: MERGE_MOST, hold: 2400 },
  { merge: MERGE_LEAST, hold: 2200 },
  { merge: MERGE, hold: 3800 },
];
const BLADES = ROWS + 1;
/** Where a drag may start: the fan and its scale. */
const FAN = '.ml-blade, .ml-fan-halo, [data-piece="protractor"], [data-piece="pivot"], [data-piece="stops"]';

function Glass({ shape, joined }: { shape: GlassShape; joined: boolean }) {
  const quiet = joined ? "lo" : "faint";
  return (
    <g className="iso-solid ml-glass" data-joined={joined ? "" : undefined}>
      <path className="iso-fill" d={shape.fill} />
      {shape.shades.map((shade, index) => (
        <path key={index} className="iso-shade" data-shade={shade.shade} d={shade.d} />
      ))}
      <path className="iso-top" d={shape.top} />
      <path className="iso-line" data-tone={quiet} d={shape.crease} />
      {shape.bevel ? <path className="iso-line iso-bevel" data-tone={quiet} d={shape.bevel} /> : null}
      <path className="iso-line iso-edge" data-tone={joined ? "hi" : "mid"} d={shape.outline} />
      {shape.shine ? <path className="iso-line ml-shine" data-tone="mid" d={shape.shine} /> : null}
    </g>
  );
}

const Row = React.memo(function Row({ shape }: { shape: RowShape }) {
  return (
    <g data-piece={`pair-${shape.row}`}>
      <g>
        <g>
          {shape.glass.map((glass, index) => (
            <Glass key={index} shape={glass} joined={shape.joined} />
          ))}
        </g>
      </g>
      {shape.neck.length ? (
        <g>
          <g className="ml-neck" data-piece="neck">
            {shape.neck.map((glint, index) => (
              <path key={index} className="iso-line" data-tone="lit" strokeOpacity={glint.alpha < 1 ? glint.alpha : undefined} d={glint.d} />
            ))}
          </g>
        </g>
      ) : null}
    </g>
  );
});

interface BladeNodes {
  group: SVGGElement | null;
  fill: SVGPathElement | null;
  shades: (SVGPathElement | null)[];
  top: SVGPathElement | null;
  crease: SVGPathElement | null;
  outline: SVGPathElement | null;
  line: SVGPathElement | null;
}

const emptyBlade = (): BladeNodes => ({ group: null, fill: null, shades: [null, null, null, null], top: null, crease: null, outline: null, line: null });

function apply(nodes: BladeNodes[], halo: SVGPathElement | null, pose: FanPose) {
  halo?.setAttribute("d", pose.halo);
  pose.blades.forEach((blade, index) => {
    const node = nodes[index];
    if (!node) return;
    node.fill?.setAttribute("d", blade.fill);
    blade.shades.forEach((d, shade) => node.shades[shade]?.setAttribute("d", d));
    node.top?.setAttribute("d", blade.top);
    node.crease?.setAttribute("d", blade.crease);
    node.outline?.setAttribute("d", blade.outline);
    node.line?.setAttribute("d", blade.line);
    if (index < ROWS) {
      if (pose.out[index]) node.group?.setAttribute("data-out", "");
      else node.group?.removeAttribute("data-out");
    }
  });
}

export interface PlateControl {
  setMerge(merge: number, pace?: number): void;
  tour(on: boolean): void;
  /** where merge is heading (the model value once the motion ends) */
  goal(): number;
}

interface Props {
  label: string;
  ariaLabel: string;
  readout: (merge: number) => string;
  spoken: (merge: number) => string;
  control?: React.Ref<PlateControl>;
  onUser?: () => void;
  /** the reader moved merge from the figure (drag, keys): whole px */
  onUserMerge?: (merge: number) => void;
  /** the shown merge came to rest */
  onSettle?: () => void;
  /** the tour moved merge (so the panel and the number line can follow it) */
  onTourMerge?: (merge: number) => void;
  back: React.ReactNode;
  deck: React.ReactNode;
  front: React.ReactNode;
}

export function LiquidLive({ label, ariaLabel, readout, spoken, control, onUser, onUserMerge, onSettle, onTourMerge, back, deck, front }: Props) {
  const { anchor, say } = useReadout<HTMLDivElement>();
  const root = React.useRef<HTMLDivElement | null>(null);
  const blades = React.useRef<BladeNodes[]>(Array.from({ length: BLADES }, emptyBlade));
  const halo = React.useRef<SVGPathElement | null>(null);
  const rest = React.useMemo(() => fanOf(MERGE), []);
  const goal = React.useRef(MERGE);
  const lead = React.useRef(MERGE);
  const shown = React.useRef(MERGE);
  const ease = React.useRef(FOLLOW);
  const frame = React.useRef(0);
  const last = React.useRef(0);
  const dragging = React.useRef(false);
  const touringNow = React.useRef(false);
  const latest = React.useRef({ onUser, onUserMerge, onSettle, onTourMerge, readout });
  latest.current = { onUser, onUserMerge, onSettle, onTourMerge, readout };
  const [quant, setQuant] = React.useState(keyOf(MERGE) / 4);
  const [visible, setVisible] = React.useState(false);
  const [tourOn, setTourOn] = React.useState(false);
  const [held, setHeld] = React.useState(false);

  const rows = React.useMemo(() => rowsOf(quant), [quant]);
  const value = roundMerge(quant);

  const draw = React.useCallback((merge: number) => {
    apply(blades.current, halo.current, fanOf(merge));
    setQuant(keyOf(merge) / 4);
  }, []);

  const stop = React.useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
  }, []);

  const run = React.useCallback(() => {
    if (frame.current) return;
    last.current = 0;
    const tick = (now: number) => {
      const dt = last.current ? Math.min(now - last.current, 64) : 16;
      last.current = now;
      const blend = 1 - Math.exp(-dt / ease.current);
      lead.current += (goal.current - lead.current) * blend;
      shown.current += (lead.current - shown.current) * blend;
      const done = Math.abs(goal.current - lead.current) < SETTLED && Math.abs(goal.current - shown.current) < SETTLED;
      if (done) {
        lead.current = goal.current;
        shown.current = goal.current;
      }
      draw(shown.current);
      frame.current = done ? 0 : requestAnimationFrame(tick);
      if (done) latest.current.onSettle?.();
    };
    frame.current = requestAnimationFrame(tick);
  }, [draw]);

  const aim = React.useCallback(
    (merge: number, pace = FOLLOW) => {
      const next = Math.min(MERGE_MOST, Math.max(MERGE_LEAST, merge));
      ease.current = pace;
      goal.current = next;
      if (asksForStillness()) {
        stop();
        lead.current = next;
        shown.current = next;
        draw(next);
        latest.current.onSettle?.();
        return;
      }
      run();
    },
    [draw, run, stop],
  );

  React.useImperativeHandle(
    control,
    () => ({
      setMerge(merge, pace = FOLLOW) {
        touringNow.current = false;
        aim(merge, pace);
      },
      tour(on) {
        setTourOn(on);
      },
      goal: () => goal.current,
    }),
    [aim],
  );

  React.useEffect(() => stop, [stop]);

  React.useEffect(() => {
    say(readout(value));
  }, [value, say, readout]);

  React.useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => setVisible(Boolean(entries.at(-1)?.isIntersecting)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!visible) stop();
  }, [visible, stop]);

  // Kit tour policy: the tour plays only while the teaching layer has it on; nothing restarts it on a timer.
  React.useEffect(() => {
    if (!tourOn || !visible || asksForStillness()) {
      touringNow.current = false;
      return;
    }
    let timer = 0;
    let step = 0;
    const next = () => {
      const stop = TOUR[step % TOUR.length]!;
      touringNow.current = true;
      aim(stop.merge, GLIDE);
      latest.current.onTourMerge?.(stop.merge);
      step += 1;
      timer = window.setTimeout(next, stop.hold + TOUR_TRAVEL);
    };
    timer = window.setTimeout(next, TOUR_FIRST);
    return () => {
      window.clearTimeout(timer);
      touringNow.current = false;
    };
  }, [tourOn, visible, aim]);

  const mergeAt = (clientX: number) => {
    const svg = root.current?.querySelector("svg");
    const box = svg?.getBoundingClientRect();
    if (!box || !box.width) return null;
    return mergeAtX(((clientX - box.left) / box.width) * WIDTH);
  };

  const takeOver = () => {
    touringNow.current = false;
    latest.current.onUser?.();
  };

  const report = () => latest.current.onUserMerge?.(roundMerge(goal.current));

  const follow = (clientX: number) => {
    const merge = mergeAt(clientX);
    if (merge === null) return;
    aim(merge, FOLLOW);
    report();
  };

  const stepBy = (by: number) => roundMerge(goal.current + by);

  const bindBlade = (index: number) => ({
    group: (node: SVGGElement | null) => {
      blades.current[index]!.group = node;
    },
    path: (key: "fill" | "top" | "crease" | "outline" | "line") => (node: SVGPathElement | null) => {
      blades.current[index]![key] = node;
    },
    shade: (shade: number) => (node: SVGPathElement | null) => {
      blades.current[index]!.shades[shade] = node;
    },
  });

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!dragging.current) return;
    dragging.current = false;
    setHeld(false);
    aim(roundMerge(goal.current), FOLLOW);
    report();
  };

  return (
    <div
      ref={(node) => {
        root.current = node;
        anchor.current = node;
      }}
      className="ml"
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={MERGE_LEAST}
      aria-valuemax={MERGE_MOST}
      aria-valuenow={value}
      aria-valuetext={spoken(value)}
      data-held={held ? "" : undefined}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if (!(event.target as Element).closest?.(FAN)) return;
        takeOver();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragging.current = true;
        setHeld(true);
        follow(event.clientX);
      }}
      onPointerMove={(event) => {
        if (dragging.current && event.currentTarget.hasPointerCapture(event.pointerId)) follow(event.clientX);
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={(event) => {
        let next: number | null = null;
        const big = event.shiftKey ? 4 : 1;
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = stepBy(-MERGE_STEP * big);
        else if (event.key === "ArrowRight" || event.key === "ArrowUp") next = stepBy(MERGE_STEP * big);
        else if (event.key === "PageDown") next = stepBy(-MERGE_STEP * 8);
        else if (event.key === "PageUp") next = stepBy(MERGE_STEP * 8);
        else if (event.key === "Home") next = MERGE_LEAST;
        else if (event.key === "End") next = MERGE_MOST;
        if (next === null) return;
        event.preventDefault();
        takeOver();
        aim(next, FOLLOW);
        report();
      }}
    >
      <IsoFigure width={WIDTH} height={HEIGHT} label={label}>
        {back}
        {rows.map((shape) => (
          <Row key={shape.row} shape={shape} />
        ))}
        {deck}
        <g>
          <g>
            <path ref={(node) => void (halo.current = node)} className="iso-halo ml-fan-halo" d={rest.halo} />
            {rest.blades.map((blade, index) => {
              const bind = bindBlade(index);
              const isLead = index === ROWS;
              return (
                <g
                  key={index}
                  ref={bind.group}
                  className="iso-solid ml-blade"
                  data-piece={isLead ? "lead" : "blades"}
                  data-lead={isLead ? "" : undefined}
                  data-lit={isLead ? "" : undefined}
                  data-out={!isLead && rest.out[index] ? "" : undefined}
                >
                  <path ref={bind.path("fill")} className="iso-fill" d={blade.fill} />
                  {[0, 1, 2, 3].map((shade) => (
                    <path key={shade} ref={bind.shade(shade)} className="iso-shade" data-shade={shade} d={blade.shades[shade] ?? ""} />
                  ))}
                  <path ref={bind.path("top")} className="iso-top" d={blade.top} />
                  <path ref={bind.path("crease")} className="iso-line" data-tone="faint" d={blade.crease} />
                  <path ref={bind.path("outline")} className="iso-line iso-edge" data-tone={isLead ? "hi" : "mid"} d={blade.outline} />
                  <path ref={bind.path("line")} className="iso-line ml-blade-line" data-tone={isLead ? "lit" : "lo"} d={blade.line} />
                </g>
              );
            })}
          </g>
        </g>
        {front}
      </IsoFigure>
    </div>
  );
}
