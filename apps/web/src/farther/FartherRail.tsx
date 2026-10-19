import { useLocation, useNavigate } from "@tanstack/react-router";
import { ChartNoAxesColumnIcon, ClockIcon, SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PullRequestGlyph } from "~/components/pullRequest/pullRequestIcons";
import { readPullRequestListPreferences } from "~/components/pullRequest/pullRequestListPreferences";
import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { usePullRequestsSupported } from "~/state/environments";

import { FartherRing } from "./FartherRing";

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            aria-current={active ? "page" : undefined}
            onClick={onClick}
            data-farther-rail-button=""
            className={cn(
              "flex size-9 cursor-pointer items-center justify-center rounded-lg text-sidebar-muted-foreground outline-hidden transition-colors hover:bg-sidebar-row-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-[18px]",
              active && "bg-sidebar-row-selected text-sidebar-foreground",
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipPopup side="right">{label}</TooltipPopup>
    </Tooltip>
  );
}

// The rail is the vertical half of farther's inverted-L frame: app-level
// destinations that upstream keeps in the sidebar footer menu.
export function FartherRail() {
  const navigate = useNavigate();
  const pathname = useLocation({ select: (location) => location.pathname });
  const pullRequestsSupported = usePullRequestsSupported();
  const onSettings = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <nav
      aria-label="App"
      data-farther-rail=""
      className="flex w-14 shrink-0 flex-col items-center justify-between pt-[var(--workspace-topbar-height)] pb-3"
    >
      <div className="flex flex-col items-center gap-1">
        <RailButton
          label="Threads"
          active={!onSettings && pathname !== "/pull-requests" && pathname !== "/usage"}
          onClick={() => void navigate({ to: "/" })}
        >
          <FartherRing />
        </RailButton>
        {pullRequestsSupported ? (
          <RailButton
            label="Pull requests"
            active={pathname === "/pull-requests"}
            onClick={() =>
              void navigate({ to: "/pull-requests", search: readPullRequestListPreferences() })
            }
          >
            <PullRequestGlyph.pullRequest />
          </RailButton>
        ) : null}
        <RailButton
          label="Automations"
          active={pathname === "/settings/scheduled-tasks"}
          onClick={() => void navigate({ to: "/settings/scheduled-tasks" })}
        >
          <ClockIcon />
        </RailButton>
        <RailButton
          label="Usage"
          active={pathname === "/usage"}
          onClick={() => void navigate({ to: "/usage" })}
        >
          <ChartNoAxesColumnIcon />
        </RailButton>
      </div>
      <RailButton
        label="Settings"
        active={onSettings && pathname !== "/settings/scheduled-tasks"}
        onClick={() => void navigate({ to: "/settings" })}
      >
        <SettingsIcon />
      </RailButton>
    </nav>
  );
}
