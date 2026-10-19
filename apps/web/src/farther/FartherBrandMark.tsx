import { cn } from "~/lib/utils";

import { FartherRing } from "./FartherRing";

export function FartherBrandMark({ onBackdrop }: { onBackdrop: boolean }) {
  return (
    <span
      data-farther-brand=""
      className={cn(
        "inline-flex min-w-0 items-center gap-2",
        onBackdrop ? "text-white" : "text-sidebar-foreground",
      )}
    >
      <FartherRing className="size-3.5 shrink-0" />
      <span className="truncate font-farther-mono text-[15px] leading-none tracking-[-0.055em]">
        farther
      </span>
    </span>
  );
}
