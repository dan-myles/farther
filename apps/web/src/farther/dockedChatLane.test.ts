import { describe, expect, it } from "vite-plus/test";

import {
  DETAILS_CARD_CLEARANCE,
  resolveChatCanvasLayout,
} from "~/components/chat/chatCanvasLayout";

const container = { width: 1120, height: 848 };
const detailsCard = { left: 800, right: 1120, bottom: 848 };

describe("docked details card", () => {
  it("centers the chat in the lane beside the card", () => {
    const { chat } = resolveChatCanvasLayout({
      container,
      preview: null,
      detailsCard,
      dockedDetailsCard: true,
    });
    const laneRight = detailsCard.left - DETAILS_CARD_CLEARANCE;
    expect(chat.left - 48).toBeCloseTo(laneRight - (chat.left + chat.width));
  });

  it("centers in the full canvas when the card is closed", () => {
    const { chat } = resolveChatCanvasLayout({ container, preview: null, dockedDetailsCard: true });
    expect(chat.left).toBeCloseTo(container.width - (chat.left + chat.width));
  });
});
