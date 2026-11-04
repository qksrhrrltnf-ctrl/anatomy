// React shell for the edu-kit teaching layer (README §3, "A안": the kit's DOM layer as is).
// React draws the page frame (header, card, empty panel); EDU.mount() fills the panel, tooltip and status line.
// Shared by edu/test-rig and edu/spot-plate. The kit itself (edu/kit) is used unchanged.
import "../kit/edu.css";
import "../kit/edu.js";
import * as React from "react";
import { Plate } from "../../kit/react/draw";

export interface Value {
  n: number;
  t: string;
}
export type Values = Record<string, Value>;

export interface EduHandle {
  refresh(): void;
  status(next: { level?: "ok" | "info" | "warn" | "danger"; text: string; action?: { label: string; run: () => void } } | null): void;
  setParam(id: string, value: unknown): void;
  sync(id: string, value: unknown): void;
  param(id: string): unknown;
  focus(ids: string[] | null): void;
  flash(ids: string[], ms?: number): void;
  hint(text: string): void;
  takeOver(): void;
  autoplay(on?: boolean): boolean | void;
  values(): Values;
  fill(text: string): string;
  still(): boolean;
  destroy(): void;
}

export interface Adapter {
  stage: HTMLElement;
  panel?: HTMLElement | null;
  hoverTips?: boolean;
  set(id: string, value: any, info?: { initial?: boolean }): void;
  values(): Values;
  pose?(pose: Record<string, any>): void;
  action?(id: string): void;
  tour?(on: boolean): void;
  takeOver?(): void;
}

declare global {
  interface Window {
    EDU: { mount(adapter: Adapter, options?: { content?: unknown }): EduHandle; still: MediaQueryList };
  }
}

export interface Content {
  page: { title?: string; kicker?: string; heading?: string; lead?: string; footer?: string; panelLabel?: string };
  card: { fig?: string; title: string; hint?: string; readout?: string; keys?: { mark: string; label: string }[]; caption?: string };
  [key: string]: unknown;
}

/** The same {key} filling the runtime does, for the first paint before EDU.mount (kit: eduPage({ values })). */
export function fillOnce(text: string | undefined, values: Values) {
  if (!text) return "";
  return text.replace(/\{([A-Za-z_]\w*)\}/g, (match, key) => values[key]?.t ?? match).replace(/(\d) (?=[A-Za-zΩ%°µ])/g, "$1 ");
}

interface PageProps {
  content: Content;
  /** values for the first paint of the card (caption, keys) */
  first: Values;
  /** the live figure: rendered inside the card, before the status line */
  figure: React.ReactNode;
  /** anything under the card (a chart outside the drawing) */
  below?: React.ReactNode;
  /** builds the adapter once the figure is on the page */
  adapter: (parts: { figure: HTMLElement; panel: HTMLElement }) => Adapter;
  onMount?: (edu: EduHandle) => void;
  figureClass?: string;
}

/**
 * The teaching page. Renders once and never again (the kit owns the panel, tooltip and status line DOM),
 * mounts the kit after the first commit and destroys it on unmount (StrictMode mounts twice; destroy() makes that clean).
 */
export const EduPage = React.memo(function EduPage({ content, first, figure, below, adapter, onMount, figureClass }: PageProps) {
  const figureRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);
  const latest = React.useRef({ adapter, onMount });
  React.useEffect(() => {
    const figureNode = figureRef.current!;
    const panel = panelRef.current!;
    const made = latest.current.adapter({ figure: figureNode, panel });
    const edu = window.EDU.mount({ ...made, panel }, { content });
    latest.current.onMount?.(edu);
    return () => edu.destroy();
  }, [content]);
  const { page, card } = content;
  return (
    <div className="edu">
      <header className="edu-head">
        {page.kicker ? <p className="edu-kicker">{page.kicker}</p> : null}
        <h1 className="edu-title">{page.heading || card.title}</h1>
        {page.lead ? <p className="edu-lead">{page.lead}</p> : null}
      </header>
      <div className="edu-layout">
        <div ref={figureRef} className={figureClass ? `edu-figure ${figureClass}` : "edu-figure"}>
          <Plate
            fig={card.fig || "그림 1"}
            title={card.title}
            hint={card.hint}
            readout={card.readout || ""}
            keys={(card.keys || []).map((key) => ({ mark: key.mark as never, label: fillOnce(key.label, first) }))}
            caption={fillOnce(card.caption, first)}
          >
            {figure}
            <div className="edu-status" data-edu-status="" role="status" aria-live="polite" />
            <div className="edu-tip" data-edu-tip="" role="tooltip" hidden />
          </Plate>
          {below}
        </div>
        <aside ref={panelRef} className="edu-panel" data-edu-panel="" aria-label={page.panelLabel || "학습 패널"} />
      </div>
      {page.footer ? <footer className="edu-foot">{page.footer}</footer> : null}
    </div>
  );
});

/** A tiny store for state that both the adapter and React pieces outside the figure read. */
export function store<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      if (Object.is(next, value)) return;
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T>(source: ReturnType<typeof store<T>>) {
  return React.useSyncExternalStore(source.subscribe, source.get, source.get);
}

export const value = (n: number, t: string): Value => ({ n, t });
