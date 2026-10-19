import { describe, expect, it } from "vite-plus/test";

import { resolveChatCanvasLayout } from "~/components/chat/chatCanvasLayout";

import {
  fitFartherEnvironmentPanelWidth,
  resolveFartherEnvironmentPanelDensity,
  resolveFartherEnvironmentPanelLayout,
} from "./environmentPanelLayout";

const lane = { padding: 48, minChatWidth: 640 };

describe("farther environment panel", () => {
  it("reserves a readable chat lane beside the dock at the reference viewport", () => {
    const container = { width: 1440 - 320, height: 900 - 48 };
    const panel = resolveFartherEnvironmentPanelLayout({ container, lane, frame: null })!;
    const { chat } = resolveChatCanvasLayout({
      container,
      preview: null,
      detailsCard: { left: panel.x, right: panel.x + panel.width, bottom: panel.height },
    });

    expect(panel.x + panel.width).toBe(container.width);
    expect(panel.y + panel.height).toBe(container.height);
    expect(chat.left + chat.width).toBeLessThan(panel.x);
    expect(chat.width).toBeGreaterThanOrEqual(lane.minChatWidth);
  });

  it("uses the popover when docking would crowd the conversation", () => {
    expect(
      resolveFartherEnvironmentPanelLayout({
        container: { width: 900, height: 900 },
        lane,
        frame: null,
      }),
    ).toBeNull();
  });

  it("keeps the dock below find and against the bottom while preview overlaps", () => {
    const container = { width: 1120, height: 852 };
    const panel = resolveFartherEnvironmentPanelLayout({
      container,
      lane,
      topInset: 48,
      frame: { x: 800, y: 100, width: 300, height: 400 },
      overlapsDetailsCard: true,
    })!;

    expect(panel.y).toBe(48);
    expect(panel.y + panel.height).toBe(container.height);
    expect(resolveFartherEnvironmentPanelDensity(160, { full: 900, compact: 400 })).toBe("full");
  });

  it("keeps a dragged width between the default and the maximum", () => {
    const container = { width: 2000, height: 900 };
    expect(fitFartherEnvironmentPanelWidth(200, { container, lane })).toBe(320);
    expect(fitFartherEnvironmentPanelWidth(480, { container, lane })).toBe(480);
    expect(fitFartherEnvironmentPanelWidth(900, { container, lane })).toBe(560);
    expect(fitFartherEnvironmentPanelWidth(Number.NaN, { container, lane })).toBe(320);
  });

  it("narrows a stored width that would crowd the chat lane, then pops over", () => {
    const container = { width: 1120, height: 852 };
    const panel = resolveFartherEnvironmentPanelLayout({
      container,
      lane,
      frame: null,
      preferredWidth: 560,
    })!;
    const { chat } = resolveChatCanvasLayout({
      container,
      preview: null,
      detailsCard: { left: panel.x, right: container.width, bottom: panel.height },
      dockedDetailsCard: true,
    });

    expect(panel.width).toBe(400);
    expect(panel.x + panel.width).toBe(container.width);
    expect(chat.width).toBeGreaterThanOrEqual(lane.minChatWidth);
    expect(
      resolveFartherEnvironmentPanelLayout({
        container: { width: 1000, height: 852 },
        lane,
        frame: null,
        preferredWidth: 560,
      }),
    ).toBeNull();
  });
});
