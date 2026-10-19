import type { ReactNode } from "react";

import { FartherRail } from "./FartherRail";

export function FartherSidebarShell({ children }: { children: ReactNode }) {
  return (
    <div data-farther-sidebar="" className="flex h-full min-h-0 w-full">
      <FartherRail />
      <div data-farther-sidebar-panel="" className="flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
