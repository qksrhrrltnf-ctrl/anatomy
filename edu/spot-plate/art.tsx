import * as React from "react";
import { Dots, FaceText, Line, Solid } from "../../kit/react/draw";
import { BASE_ART, BOTTLE_ART, DECK_ART, TRAY_ART } from "./geometry";
import { LiquidLive } from "./live";

// Teaching fork of examples/spot-plate/art.tsx: the same parts in the same painting order, split into
// data-piece groups for tooltips and highlights (the upstream data-part groups stay as they were).
function Lit({ id, children }: { id: string; children: React.ReactNode }) {
  return <g data-part={id}>{children}</g>;
}

const BACK = (
  <g key="back">
    <Lit id="frame">
      <path className="iso-halo" d={BASE_ART.halo} />
      <g data-piece="base">
        {BASE_ART.feet.map((parts, index) => (
          <g key={index}>
            {parts.map((paths, piece) => (
              <Solid key={piece} paths={paths} tone={piece ? "mid" : "lo"} crease="faint" />
            ))}
          </g>
        ))}
        <Solid paths={BASE_ART.slab} tone="mid" crease="faint" />
        <Line d={BASE_ART.groove} tone="lo" />
        <Line d={BASE_ART.inlay} tone="faint" />
        <Line d={BASE_ART.screwRings} tone="lo" />
        <Dots points={BASE_ART.screws} size={0.5} tone="mid" />
      </g>
      <g data-piece="plate">
        <Solid className="ml-plate" paths={TRAY_ART.slab} tone="hi" crease="lo" />
        <Line d={TRAY_ART.groove} tone="lo" />
        <Line d={TRAY_ART.inlay} tone="faint" />
      </g>
      <g data-piece="wells">
        {TRAY_ART.wells.map((well, index) => (
          <g key={index}>
            <path className="ml-floor" d={well.opening} />
            {well.wall ? <path className="ml-wall" d={well.wall} /> : null}
            <Line d={well.foot} tone="faint" />
            <Line d={well.opening} tone="mid" />
          </g>
        ))}
      </g>
      <g data-piece="counts">
        <Dots points={TRAY_ART.counts} size={0.55} tone="mid" />
      </g>
      <g data-piece="plate">
        <Line d={TRAY_ART.screwRings} tone="lo" />
        <Dots points={TRAY_ART.screws} size={0.5} tone="mid" />
      </g>
    </Lit>
    <Lit id="apart">
      <g data-piece="rulers">
        <Line d={TRAY_ART.minor} tone="lo" />
        <Line d={TRAY_ART.major} tone="mid" />
        <Line d={TRAY_ART.datum} tone="mid" />
        <Dots points={TRAY_ART.gapMarks} size={0.6} tone="hi" />
      </g>
    </Lit>
  </g>
);

const DECK = (
  <g key="deck">
    <Lit id="frame">
      <g data-piece="deck">
        <Solid paths={DECK_ART.slab} tone="mid" crease="faint" />
        <Line d={DECK_ART.inlay} tone="faint" />
        <Line d={DECK_ART.screwRings} tone="lo" />
        <Dots points={DECK_ART.screws} size={0.45} tone="mid" />
      </g>
      <g data-piece="bottle">
        <Solid paths={BOTTLE_ART.coaster} tone="mid" crease="faint" />
        <Line d={BOTTLE_ART.coasterRing} tone="faint" />
        <Dots points={BOTTLE_ART.coasterDots} size={0.45} tone="mid" />
        <Solid className="ml-bottle" paths={BOTTLE_ART.body} tone="hi" crease="faint" />
        <Line d={BOTTLE_ART.foot} tone="faint" />
        <Line d={BOTTLE_ART.level} tone="lo" />
        <Line d={BOTTLE_ART.shine} tone="mid" />
        <Solid className="ml-bottle" paths={BOTTLE_ART.shoulder} tone="hi" crease="faint" />
        <Solid paths={BOTTLE_ART.neck} tone="mid" crease="faint" />
        <Solid paths={BOTTLE_ART.collar} tone="mid" crease="faint" />
        <Solid paths={BOTTLE_ART.cap} tone="hi" crease="lo" />
        <Line d={BOTTLE_ART.capKnurl} tone="lo" />
        <Line d={BOTTLE_ART.capRing} tone="faint" />
        <Solid paths={BOTTLE_ART.bulb} tone="mid" crease="faint" />
        <Line d={BOTTLE_ART.bulbShine} tone="lo" />
        <Line d={BOTTLE_ART.bulbRing} tone="faint" />
        <Dots points={[BOTTLE_ART.tip]} size={0.45} tone="mid" />
      </g>
    </Lit>
    <Lit id="fan">
      <g data-piece="stops">
        <Line d={DECK_ART.guide} tone="faint" dashed />
        {DECK_ART.stops.map((paths, index) => (
          <Solid key={index} paths={paths} tone="mid" crease="faint" />
        ))}
        <Dots points={DECK_ART.stopTops} size={0.45} tone="hi" />
      </g>
      <g data-piece="protractor">
        <Solid paths={DECK_ART.bandBack} tone="mid" crease="faint" />
        <FaceText transform={DECK_ART.label} size={4.2} tone="lo">
          merge
        </FaceText>
      </g>
      <g data-piece="pivot">
        <Solid paths={DECK_ART.washer} tone="lo" crease="faint" />
      </g>
    </Lit>
  </g>
);

const FRONT = (
  <Lit key="front" id="fan">
    <g data-piece="protractor">
      <Solid paths={DECK_ART.bandFront} tone="mid" crease="faint" />
      <Line d={DECK_ART.bandLine} tone="faint" />
      <Line d={DECK_ART.minor} tone="lo" />
      <Line d={DECK_ART.major} tone="mid" />
      <Dots points={DECK_ART.gapDots} size={0.55} tone="hi" />
      <Dots points={[...DECK_ART.ends, DECK_ART.seam]} size={0.45} tone="mid" />
    </g>
    <g data-piece="pivot">
      <Solid paths={DECK_ART.cap} tone="mid" crease="faint" />
      <Solid paths={DECK_ART.nut} tone="hi" crease="lo" />
      <Line d={DECK_ART.nutKnurl} tone="lo" />
      <Line d={DECK_ART.nutRing} tone="faint" />
      <Dots points={[DECK_ART.pin]} size={0.6} tone="hi" />
    </g>
  </Lit>
);

type LiveProps = Omit<React.ComponentProps<typeof LiquidLive>, "back" | "deck" | "front">;

export function LiquidArt(props: LiveProps) {
  return <LiquidLive {...props} back={BACK} deck={DECK} front={FRONT} />;
}
