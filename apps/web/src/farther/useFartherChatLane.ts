import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export const FARTHER_ENVIRONMENT_PANEL_DRAG_EVENT = "farther:environment-panel-drag";

interface ChatLane {
  readonly left: number;
  readonly width: number;
  readonly insetStart: number;
  readonly insetEnd: number;
}

// Everything positioned from --chat-lane-inset-*. The timeline moves its content
// box, not the scroller, so the scrollbar stays put and the scroller clips the slide.
const LANE_TARGETS =
  ".messages-timeline-scroll > *, [data-chat-composer-stack], .chat-banner-lane, .chat-scroll-to-bottom";
const LANE_ANIMATION_ID = "farther-chat-lane";

type PanelState = "open" | "closed" | "none";

function readPanelState(canvas: HTMLElement): PanelState {
  const panel = canvas.querySelector('[data-thread-details-panel="inline"]');
  if (!panel) return "none";
  return panel.hasAttribute("data-farther-open") ? "open" : "closed";
}

/**
 * Slides the chat lane with the docked environment panel and lets a panel
 * resize drag move the lane without re-rendering the conversation.
 */
export function useFartherChatLane(
  canvasRef: RefObject<HTMLElement | null>,
  chat: ChatLane,
  resolveChat: (cardLeft: number) => ChatLane,
) {
  const latest = useRef({ chat, resolveChat });
  useLayoutEffect(() => {
    latest.current = { chat, resolveChat };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onDrag = (event: Event) => {
      const cardLeft = (event as CustomEvent<number | null>).detail;
      const lane = cardLeft === null ? latest.current.chat : latest.current.resolveChat(cardLeft);
      canvas.style.setProperty("--chat-lane-inset-start", `${lane.insetStart}px`);
      canvas.style.setProperty("--chat-lane-inset-end", `${lane.insetEnd}px`);
    };
    canvas.addEventListener(FARTHER_ENVIRONMENT_PANEL_DRAG_EVENT, onDrag);
    return () => canvas.removeEventListener(FARTHER_ENVIRONMENT_PANEL_DRAG_EVENT, onDrag);
  }, [canvasRef]);

  const settled = useRef<{ center: number; panel: PanelState } | null>(null);
  const center = chat.left + chat.width / 2;
  // Runs every commit so the panel state never goes stale between lane moves.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const panel = readPanelState(canvas);
    const previous = settled.current;
    settled.current = { center, panel };
    // Only an open/close toggle animates. Window resizes, drags, previews, and the
    // dock giving way to the popover all move the lane in place.
    if (
      !previous ||
      previous.panel === "none" ||
      panel === "none" ||
      previous.panel === panel ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    for (const target of canvas.querySelectorAll<HTMLElement>(LANE_TARGETS)) {
      const running = target
        .getAnimations()
        .filter((animation) => animation.id === LANE_ANIMATION_ID);
      // A toggle mid-slide continues from where the lane is drawn now.
      const drawnOffset = running.length
        ? Number.parseFloat(getComputedStyle(target).translate) || 0
        : 0;
      for (const animation of running) animation.cancel();
      const shift = previous.center - center + drawnOffset;
      if (Math.abs(shift) < 0.5) continue;
      target.animate([{ translate: `${shift}px 0` }, { translate: "0 0" }], {
        id: LANE_ANIMATION_ID,
        duration: 220,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
      });
    }
  });
}
