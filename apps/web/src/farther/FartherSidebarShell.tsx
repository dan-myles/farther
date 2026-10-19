import type { ReactNode } from "react";

import { isElectron } from "~/env";

import { FartherRail } from "./FartherRail";

// Stand-ins for macOS's window controls so the web build previews the desktop
// title bar. Fixed so a collapsed sidebar's clipping doesn't cut them.
function FartherTrafficLights() {
  return (
    <div
      aria-hidden
      data-farther-traffic-lights=""
      className="pointer-events-none fixed top-5 left-5 z-50 flex gap-2"
    >
      <span className="size-3 rounded-full bg-[#ff5f57]" />
      <span className="size-3 rounded-full bg-[#febc2e]" />
      <span className="size-3 rounded-full bg-[#28c840]" />
    </div>
  );
}

export function FartherSidebarShell({ children }: { children: ReactNode }) {
  return (
    <div data-farther-sidebar="" className="flex h-full min-h-0 w-full">
      {isElectron ? null : <FartherTrafficLights />}
      <FartherRail />
      <div data-farther-sidebar-panel="" className="flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
