import * as Schema from "effect/Schema";
import { useLayoutEffect, useRef } from "react";

import { useChatCanvas } from "~/components/chat/ChatCanvasContext";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { useResizeDrag } from "~/hooks/useResizeDrag";

import {
  FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH,
  FARTHER_ENVIRONMENT_PANEL_MAX_WIDTH,
  FARTHER_ENVIRONMENT_PANEL_WIDTH_STORAGE_KEY,
  fitFartherEnvironmentPanelWidth,
} from "./environmentPanelLayout";
import { FARTHER_ENVIRONMENT_PANEL_DRAG_EVENT } from "./useFartherChatLane";

export function useFartherEnvironmentPanelWidth() {
  return useLocalStorage(
    FARTHER_ENVIRONMENT_PANEL_WIDTH_STORAGE_KEY,
    FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH,
    Schema.Finite,
  );
}

/**
 * Sits on the docked panel's left border. Drag frames write the panel width and
 * the chat lane insets straight to the DOM; the width is committed once on release
 * so the conversation does not re-render per pointer move.
 */
export function FartherEnvironmentPanelResizeHandle() {
  const canvas = useChatCanvas();
  const [width, setWidth] = useFartherEnvironmentPanelWidth();
  const latestCanvas = useRef(canvas);
  useLayoutEffect(() => {
    latestCanvas.current = canvas;
  });
  const { refresh, ...handlers } = useResizeDrag<HTMLDivElement>((event) => {
    const handle = event.currentTarget;
    const panel = handle.parentElement;
    const canvasElement = panel?.closest<HTMLElement>("[data-chat-canvas]");
    if (!panel || !canvasElement || !latestCanvas.current) return null;
    const renderedWidth = panel.style.width;
    let current = panel.getBoundingClientRect().width;
    const reportLane = (cardLeft: number | null) =>
      canvasElement.dispatchEvent(
        new CustomEvent(FARTHER_ENVIRONMENT_PANEL_DRAG_EVENT, { detail: cardLeft }),
      );
    handle.dataset.dragging = "";
    return {
      width: current,
      edge: "left",
      resize(value) {
        const layout = latestCanvas.current;
        const next = layout ? fitFartherEnvironmentPanelWidth(value, layout) : null;
        if (next === null || !layout) return current;
        current = next;
        panel.style.width = `${current}px`;
        reportLane(layout.container.width - current);
        return current;
      },
      finish(finalWidth, moved) {
        if (moved) setWidth(finalWidth);
      },
      cleanup() {
        delete handle.dataset.dragging;
        // React only rewrites styles whose rendered value changed, so hand the
        // DOM back in its rendered state before the commit lands.
        panel.style.width = renderedWidth;
        reportLane(null);
      },
    };
  });
  // The fit depends on the canvas width, which can change mid-drag.
  useLayoutEffect(refresh, [canvas?.container.width, refresh]);
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize environment panel"
      aria-valuemin={FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH}
      aria-valuemax={FARTHER_ENVIRONMENT_PANEL_MAX_WIDTH}
      aria-valuenow={width}
      data-farther-env-resize=""
      onDoubleClick={() => setWidth(FARTHER_ENVIRONMENT_PANEL_DEFAULT_WIDTH)}
      {...handlers}
    />
  );
}
