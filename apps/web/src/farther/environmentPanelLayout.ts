import { DETAILS_CARD_CLEARANCE } from "~/components/chat/chatCanvasLayout";
import type {
  resolveThreadDetailsCardDensity,
  resolveThreadDetailsCardLayout,
} from "~/components/chat/threadDetailsCardLayout";

export const FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH = 320;
export const FARTHER_ENVIRONMENT_PANEL_MAX_WIDTH = 560;
export const FARTHER_ENVIRONMENT_PANEL_WIDTH_STORAGE_KEY = "farther:environment-panel-width";
// A widened panel may squeeze the chat below upstream's lane minimum, to a
// still-comfortable reading width; the default width keeps upstream's rule.
const FARTHER_WIDENED_PANEL_MIN_CHAT_WIDTH = 480;

type PanelLayoutInput = Parameters<typeof resolveThreadDetailsCardLayout>[0];

export const resolveFartherEnvironmentPanelDensity: typeof resolveThreadDetailsCardDensity = () =>
  "full";

/**
 * The widest the dock may be for the preferred width, or null when even the
 * default width would squeeze the chat lane below its minimum (it pops over then).
 */
export function fitFartherEnvironmentPanelWidth(
  preferredWidth: number,
  { container, lane }: Pick<PanelLayoutInput, "container" | "lane">,
) {
  const preferred = Number.isFinite(preferredWidth)
    ? Math.min(
        FARTHER_ENVIRONMENT_PANEL_MAX_WIDTH,
        Math.max(FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH, preferredWidth),
      )
    : FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH;
  const roomFor = (minChatWidth: number) =>
    container.width - DETAILS_CARD_CLEARANCE - lane.padding - minChatWidth;
  if (roomFor(lane.minChatWidth) < FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH) return null;
  return Math.max(
    FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH,
    Math.min(preferred, roomFor(Math.min(lane.minChatWidth, FARTHER_WIDENED_PANEL_MIN_CHAT_WIDTH))),
  );
}

export function resolveFartherEnvironmentPanelLayout({
  container,
  lane,
  topInset = 0,
  preferredWidth = FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH,
}: PanelLayoutInput & { preferredWidth?: number }) {
  const width = fitFartherEnvironmentPanelWidth(preferredWidth, { container, lane });
  const height = container.height - topInset;
  if (width === null || height < 160) return null;
  return { x: container.width - width, right: 0, width, y: topInset, height };
}
