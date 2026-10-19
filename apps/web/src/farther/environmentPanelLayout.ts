import { DETAILS_CARD_CLEARANCE } from "~/components/chat/chatCanvasLayout";
import type {
  resolveThreadDetailsCardDensity,
  resolveThreadDetailsCardLayout,
} from "~/components/chat/threadDetailsCardLayout";

export const FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH = 320;
export const FARTHER_ENVIRONMENT_PANEL_MAX_WIDTH = 560;
export const FARTHER_ENVIRONMENT_PANEL_WIDTH_STORAGE_KEY = "farther:environment-panel-width";

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
  const room = container.width - DETAILS_CARD_CLEARANCE - lane.padding - lane.minChatWidth;
  const width = Math.min(preferred, room);
  return width >= FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH ? width : null;
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
