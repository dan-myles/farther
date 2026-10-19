// The sidebar is a 56px rail plus Paper's 264px list. It can widen a little for
// long titles, but never past the point where it competes with the chat.
const FARTHER_SIDEBAR_MIN_WIDTH = 320;
const FARTHER_SIDEBAR_MAX_WIDTH = 440;

export function fartherSidebarMinimumWidth(upstreamMinimum: number): number {
  return Math.max(FARTHER_SIDEBAR_MIN_WIDTH, upstreamMinimum);
}

export function fartherSidebarMaximumWidth(upstreamMaximum: number, minimum: number): number {
  return Math.max(minimum, Math.min(FARTHER_SIDEBAR_MAX_WIDTH, upstreamMaximum));
}
