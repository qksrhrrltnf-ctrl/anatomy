// Teaching page for the spot plate: the forked figure + edu-kit (via ../react/shell) + the gap number line.
import * as React from "react";
import { EduPage, store, value, type Adapter, type EduHandle, type Values } from "../react/shell";
import { LiquidArt } from "./art";
import content from "./ko.mjs";
import { ARIA_LABEL, LABEL_KO, STATE_NAME, fixed, pairSentence, readoutKo, spokenKo, stateOf } from "./ko-text";
import { GLIDE, type PlateControl } from "./live";
import { NumberLine } from "./numberline";
import { GAPS, joinedAt, neckOf, roundMerge, seenGapOf } from "./rig";
import "./spot-plate.css";
import "./teach.css";

const param = (id: string) => (content.params as { id: string; value: unknown }[]).find((p) => p.id === id)!.value;
const MERGE0 = param("merge") as number;
const PAIR0 = param("pair") as number;

const list = (gaps: readonly number[]) => `${gaps.join(", ")} px`;

/** Model values at a whole-px merge (what the figure shows once the motion ends). */
function modelValues(merge: number, row: number): Values {
  const m = roundMerge(merge);
  const joined = joinedAt(m);
  const reach = GAPS.filter((gap) => stateOf(gap, m) === "reach");
  const plain = GAPS.filter((gap) => stateOf(gap, m) === "plain");
  const out: Values = {
    merge: value(m, `${m} px`),
    joined: value(joined.length, String(joined.length)),
    joinedList: value(joined.length, joined.length ? list(joined) : "없음"),
    joinedSet: value(joined.length, joined.length ? `간격 ${list(joined)} (${joined.length}쌍)` : "없음 (0쌍)"),
    joinedPhrase: value(
      joined.length,
      joined.length === 0
        ? "합쳐진 쌍이 없어 날이 하나도 펼쳐지지 않았습니다"
        : `간격 ${list(joined)} 쌍이 합쳐져 날 ${joined.length}개가 펼쳐져 있습니다`,
    ),
    reachList: value(reach.length, reach.length ? reach.map((gap) => `간격 ${gap} px(보이는 간격 ${fixed(seenGapOf(gap, m))})`).join(", ") : "없음"),
    plainList: value(plain.length, plain.length ? `간격 ${list(plain)}` : "없음"),
    twice: value(2 * m, `${2 * m} px`),
    bladesOut: value(joined.length, String(joined.length)),
    pairGap: value(GAPS[row]!, `${GAPS[row]} px`),
    pairState: value(NaN, `${STATE_NAME[stateOf(GAPS[row]!, m)]}. ${pairSentence(GAPS[row]!, m)}`),
  };
  GAPS.forEach((gap, index) => {
    out[`state${index}`] = value(NaN, pairSentence(gap, m));
    const seen = seenGapOf(gap, m);
    out[`seen${index}`] = value(seen, fixed(seen));
    const neck = gap < m ? neckOf(gap, m) : 0;
    out[`neck${index}`] = value(neck, fixed(neck));
  });
  return out;
}

/** Steps and questions glide merge at this pace (ms), slower than a drag (150) and quicker than the tour (560). */
const STEP_PACE = 300;

const first = modelValues(MERGE0, PAIR0);

function SpotPlateTeaching() {
  const control = React.useRef<PlateControl>(null);
  const edu = React.useRef<EduHandle | null>(null);
  const state = React.useRef({ merge: MERGE0, pair: PAIR0 });
  const line = React.useMemo(() => store<number>(MERGE0), []);
  const mounted = React.useRef(false);

  const adapter = ({ figure }: { figure: HTMLElement }): Adapter => ({
    stage: figure.querySelector<HTMLElement>(".ml")!,
    set(id, next, info) {
      if (id === "merge") {
        state.current.merge = roundMerge(Number(next));
        line.set(state.current.merge);
        control.current?.setMerge(state.current.merge);
      } else if (id === "pair") {
        state.current.pair = Number(next);
        if (!info?.initial && mounted.current) edu.current?.focus([`pair-${state.current.pair}`]);
      }
    },
    values: () => modelValues(state.current.merge, state.current.pair),
    pose(pose) {
      if (pose.reset) {
        control.current?.setMerge(MERGE0, GLIDE);
        return;
      }
      if (pose.pace === "slow" && typeof pose.merge === "number") control.current?.setMerge(pose.merge, STEP_PACE);
    },
    tour(on) {
      control.current?.tour(on);
    },
  });

  // the reader moved merge from the figure: move the panel slider and the text, without calling set() back
  const fromFigure = (merge: number) => {
    if (merge === state.current.merge) return;
    state.current.merge = merge;
    line.set(merge);
    edu.current?.sync("merge", merge);
  };

  const figure = (
    <LiquidArt
      label={LABEL_KO}
      ariaLabel={ARIA_LABEL}
      readout={readoutKo}
      spoken={spokenKo}
      control={control}
      onUser={() => edu.current?.takeOver()}
      onUserMerge={fromFigure}
      onTourMerge={fromFigure}
      onSettle={() => edu.current?.refresh()}
    />
  );

  return (
    <EduPage
      content={content}
      first={first}
      figure={figure}
      below={
        <NumberLine
          source={line}
          onDrag={(merge) => {
            edu.current?.takeOver();
            edu.current?.setParam("merge", merge);
          }}
        />
      }
      adapter={adapter}
      onMount={(handle) => {
        edu.current = handle;
        mounted.current = true;
      }}
    />
  );
}

export default SpotPlateTeaching;
