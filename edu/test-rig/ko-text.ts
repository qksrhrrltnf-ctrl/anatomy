// Korean readout and screen-reader text for the test rig (the English ones stay in rig.ts / live.tsx upstream).
import { one, poseOf, sizeText, type Member, type Pose } from "./rig";

export const readoutKo = (pose: Pose) => `크기 ${sizeText(pose)} · 기울기 ${one(Math.abs(pose.lean))} px`;

export function spokenKo(member: Member, pull: number, held: boolean) {
  const pose = poseOf(member);
  const size = sizeText(pose).replace(" × ", " 곱하기 ");
  const state = held ? "누르는 중" : member.swell.at === 0 && member.lean.at === 0 ? "쉬는 중" : "되돌아오는 중";
  return `${state}: 크기 ${size} 픽셀, ${one(Math.abs(pull))} px 당김, ${one(Math.abs(pose.lean))} px 기울어짐`;
}

export const ARIA_LABEL = "시험대 위 유리 버튼입니다. 스페이스로 누르거나 놓고, 화살표로 손가락을 움직여 당깁니다.";

export const LABEL_KO =
  "유리 버튼 시험대. 120 × 32 크기의 유리 버튼이 캐리지 위에 놓여 있고, 캐리지는 프레임 안의 가이드 로드 두 개 위를 미끄러집니다. 양 끝의 용수철 네 개가 캐리지를 쉬는 자리에 붙잡습니다. 뒤쪽 레일에 매달린 손가락 프로브가 내려와 버튼을 누르고, 레일을 따라 움직여 당깁니다. 버튼은 당길수록 덜 따라오며 기울어지고, 프레임 끝의 다이얼 게이지가 기울기를 읽습니다. 놓으면 용수철이 버튼을 되돌리는데, 쉬는 자리를 한 번 지나쳤다가 돌아옵니다.";
