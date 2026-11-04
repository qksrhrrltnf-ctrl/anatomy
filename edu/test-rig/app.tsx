// Teaching page for the test rig: the forked figure + edu-kit (via ../react/shell) + the response chart.
import * as React from "react";
import { EduPage, store, value, type Adapter, type EduHandle, type Values } from "../react/shell";
import { StretchArt } from "./art";
import { ResponseChart, type ChartDot, type ChartState } from "./chart";
import content from "./ko.mjs";
import { ARIA_LABEL, LABEL_KO, readoutKo, spokenKo } from "./ko-text";
import type { FrameInfo, RigControl } from "./live";
import { GIVEN, leanFor, one, poseOf, releaseStats, sizeText, theoryOf, tuneOf } from "./rig";
import { pressScript, pullScript, releaseScript, restScript } from "./scripts";
import "./stretch.css";
import "./teach.css";

interface Params {
  k: number;
  zeta: number;
  pull: number;
  compare: boolean;
}

const defaults = Object.fromEntries((content.params as { id: string; value?: unknown }[]).filter((p) => p.value !== undefined).map((p) => [p.id, p.value])) as unknown as Params;

const seconds = (s: number) => `${s.toFixed(2)}초`;
const px = (n: number) => `${one(Math.abs(n))} px`;

function regimeOf(z: number) {
  if (Math.abs(z - 1) < 0.025) return "임계감쇠";
  return z < 1 ? "저감쇠" : "과감쇠";
}

/** Everything the panel, the steps and the questions quote. Model values for the current settings. */
function modelValues(p: Params, live: { size: string; lean: number }): Values {
  const x0 = leanFor(-p.pull);
  const tune = tuneOf(p.k, p.zeta);
  const stats = releaseStats(tune, x0);
  const theory = theoryOf(p.k, p.zeta, x0);
  const c = tune.release[1];
  const force = p.k * Math.abs(x0);
  return {
    k: value(p.k, String(p.k)),
    zeta: value(p.zeta, p.zeta.toFixed(2)),
    c: value(c, c.toFixed(1)),
    w0: value(theory.w0, theory.w0.toFixed(1)),
    T: Number.isFinite(theory.period) ? value(theory.period, seconds(theory.period)) : value(NaN, "진동하지 않습니다"),
    x0: value(Math.abs(x0), px(x0)),
    pull: value(p.pull, `${p.pull} px`),
    force: value(force, `${Math.round(force)} px/s²`),
    over: value(theory.over, p.zeta >= 1 ? "0 px(지나치지 않음)" : `${theory.over.toFixed(1)} px`),
    releasePhrase: value(
      stats.settle,
      p.zeta >= 1 ? `놓으면 쉬는 자리를 지나치지 않고 ${seconds(stats.settle)} 뒤 멈춥니다` : `놓으면 쉬는 자리를 ${theory.over.toFixed(1)} px 지나쳤다가 ${seconds(stats.settle)} 뒤 멈춥니다`,
    ),
    overSim: value(stats.over, `${stats.over.toFixed(1)} px`),
    settle: value(stats.settle, seconds(stats.settle)),
    settleZ2: value(releaseStats(tuneOf(p.k, 2), x0).settle, seconds(releaseStats(tuneOf(p.k, 2), x0).settle)),
    settleZ07: value(releaseStats(tuneOf(p.k, 0.7), x0).settle, seconds(releaseStats(tuneOf(p.k, 0.7), x0).settle)),
    regime: value(NaN, regimeOf(p.zeta)),
    limit: value(GIVEN, `${GIVEN} px`),
    size: value(NaN, live.size),
    lean: value(Math.abs(live.lean), px(live.lean)),
  };
}

const first = modelValues(defaults, { size: "120.0 × 32.0", lean: 0 });

function TestRigTeaching() {
  const control = React.useRef<RigControl>(null);
  const edu = React.useRef<EduHandle | null>(null);
  const params = React.useRef<Params>({ ...defaults });
  const chart = React.useMemo(() => store<ChartState>({ now: { k: defaults.k, zeta: defaults.zeta, from: leanFor(-defaults.pull) }, ghost: null, compare: defaults.compare }), []);
  const dot = React.useRef<ChartDot | null>(null);
  const lastLetGo = React.useRef<ChartState["now"] | null>(null);

  const live = () => {
    const member = control.current?.member();
    if (!member) return { size: "120.0 × 32.0", lean: 0 };
    const pose = poseOf(member);
    return { size: sizeText(pose), lean: member.lean.at };
  };

  const status = () => {
    const handle = edu.current;
    if (!handle) return;
    if (handle.still()) {
      handle.status({ level: "warn", text: "움직임 줄이기 설정이 켜져 있어 그림은 곧바로 쉬는 자리로 돌아갑니다. 아래 그래프로 감쇠비를 비교하십시오." });
      return;
    }
    handle.status({ level: "info", text: "{regime}: {releasePhrase}.", action: { label: "당겼다 놓기", run: () => drop() } });
  };

  const setChart = (patch: Partial<ChartState>) => chart.set({ ...chart.get(), ...patch });
  const fromPull = () => leanFor(-params.current.pull);
  const drop = () => control.current?.play(releaseScript(params.current.pull));

  const adapter = ({ figure }: { figure: HTMLElement }): Adapter => ({
    stage: figure.querySelector<HTMLElement>(".ms")!,
    set(id, next) {
      const p = params.current;
      if (id === "k" || id === "zeta" || id === "pull") {
        (p as unknown as Record<string, number>)[id] = Number(next);
        control.current?.setTune(tuneOf(p.k, p.zeta));
        setChart({ now: { k: p.k, zeta: p.zeta, from: fromPull() } });
      } else if (id === "compare") {
        p.compare = !!next;
        setChart({ compare: p.compare });
      }
      status();
    },
    values: () => modelValues(params.current, live()),
    action(id) {
      if (id === "drop") drop();
    },
    pose(pose) {
      const p = params.current;
      if (pose.reset) {
        control.current?.play(restScript);
        setChart({ ghost: null });
        return;
      }
      if (pose.act === "rest") control.current?.play(restScript);
      else if (pose.act === "press") control.current?.play(pressScript);
      else if (pose.act === "pull") control.current?.play(pullScript(p.pull));
      else if (pose.act === "release") control.current?.play(releaseScript(p.pull));
    },
    tour(on) {
      control.current?.tour(on);
    },
  });

  const onRelease = (lean: number) => {
    const p = params.current;
    const now = { k: p.k, zeta: p.zeta, from: Math.abs(lean) > 0.3 ? lean : fromPull() };
    const before = lastLetGo.current;
    const changed = before && (before.k !== now.k || before.zeta !== now.zeta || Math.abs(before.from - now.from) > 0.3);
    setChart({ now, ghost: changed ? before : chart.get().ghost });
    lastLetGo.current = now;
  };

  const onFrame = (info: FrameInfo) => dot.current?.(info.since, info.lean);

  const figure = (
    <StretchArt
      label={LABEL_KO}
      ariaLabel={ARIA_LABEL}
      readout={readoutKo}
      spoken={spokenKo}
      control={control}
      onUser={() => edu.current?.takeOver()}
      onFrame={onFrame}
      onRelease={onRelease}
      onSettle={() => edu.current?.refresh()}
    />
  );

  return (
    <EduPage
      content={content}
      first={first}
      figure={figure}
      below={<ResponseChart source={chart} dotRef={dot} />}
      adapter={adapter}
      onMount={(handle) => {
        edu.current = handle;
        status();
      }}
    />
  );
}

export default TestRigTeaching;
