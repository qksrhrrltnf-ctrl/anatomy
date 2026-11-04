// Korean readout, screen-reader text and the per-pair state the teaching page quotes.
import { GAPS, ROWS, joinedAt, neckOf, roundMerge, seenGapOf } from "./rig";

const listKo = (values: readonly number[]) => values.join(", ");

export const readoutKo = (merge: number) => {
  const shown = roundMerge(merge);
  return `merge ${shown} px · ${ROWS}쌍 중 ${joinedAt(shown).length}쌍 합쳐짐`;
};

export function spokenKo(merge: number) {
  const shown = roundMerge(merge);
  const joined = joinedAt(shown);
  const apart = GAPS.filter((gap) => gap >= shown);
  const head = `merge ${shown} px: ${ROWS}쌍 중 ${joined.length}쌍 합쳐짐`;
  if (!joined.length) return `${head}. 모두 떨어져 있습니다`;
  if (!apart.length) return `${head}. 모든 간격이 합쳐졌습니다`;
  return `${head}. 합쳐진 간격 ${listKo(joined)} px, 떨어진 간격 ${listKo(apart)} px`;
}

export type PairState = "joined" | "kiss" | "reach" | "plain";

export const stateOf = (gap: number, merge: number): PairState => (gap < merge ? "joined" : gap === merge ? "kiss" : gap < 2 * merge ? "reach" : "plain");

export const STATE_NAME: Record<PairState, string> = { joined: "합쳐짐", kiss: "맞닿음", reach: "늘어남", plain: "영향 없음" };

export const fixed = (value: number) => `${value.toFixed(1)} px`;

/** One sentence for a pair at a whole-px merge, numbers from the drawing's own formulas. */
export function pairSentence(gap: number, merge: number) {
  const state = stateOf(gap, merge);
  if (state === "joined") return `한 덩어리로 합쳐져 있습니다(목 너비 ${fixed(neckOf(gap, merge))})`;
  if (state === "kiss") return "한 점에서 맞닿아 있지만 합쳐짐으로 세지 않습니다";
  if (state === "reach") return `떨어져 있지만 서로를 향해 늘어나, 보이는 간격이 ${fixed(seenGapOf(gap, merge))}입니다`;
  return "영향을 받지 않아 둥근 모양 그대로입니다";
}

export const ARIA_LABEL = "merge 값, 픽셀 단위. 화살표 키로 바꿉니다.";

export const LABEL_KO = `실험대 위의 반점판. 판에 홈 여섯 개가 있고, 홈마다 반지름 30과 22인 유리 방울 한 쌍이 ${listKo(GAPS)} px 간격으로 놓여 있습니다. 홈 옆의 눈금자가 간격을 잽니다. 오른쪽 스포이트 병 옆에는 간격마다 하나씩, 필러 게이지 날 여섯 개가 피벗에 묶여 0에서 48 px까지 눈금이 있는 각도기 위를 돕니다. 맨 위의 날이 merge입니다. 부채가 펼쳐질 때 각 날은 자기 간격에서 멈추고, 그 간격의 방울 쌍은 하나의 유리 덩어리로 이어집니다.`;
