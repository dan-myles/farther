import { DETAILS_CARD_CLEARANCE } from "~/components/chat/chatCanvasLayout";
import type {
  resolveThreadDetailsCardDensity,
  resolveThreadDetailsCardLayout,
} from "~/components/chat/threadDetailsCardLayout";

export const resolveFartherEnvironmentPanelDensity: typeof resolveThreadDetailsCardDensity = () =>
  "full";

export function resolveFartherEnvironmentPanelLayout({
  container,
  lane,
  topInset = 0,
}: Parameters<typeof resolveThreadDetailsCardLayout>[0]) {
  const width = 320;
  const x = container.width - width;
  const height = container.height - topInset;
  if (x - DETAILS_CARD_CLEARANCE - lane.padding < lane.minChatWidth || height < 160) return null;
  return { x, right: 0, width, y: topInset, height };
}
