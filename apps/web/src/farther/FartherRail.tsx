import { useLocation, useNavigate } from "@tanstack/react-router";
import { ClockIcon, HouseIcon, InboxIcon, ListIcon, SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PullRequestGlyph } from "~/components/pullRequest/pullRequestIcons";
import { readPullRequestListPreferences } from "~/components/pullRequest/pullRequestListPreferences";
import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { usePrimaryEnvironment, usePullRequestsSupported } from "~/state/environments";

function RailButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  // Omitted for destinations farther shows before T3 has them.
  onClick?: () => void;
  children: ReactNode;
}) {
  const placeholder = onClick === undefined;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            aria-current={active ? "page" : undefined}
            aria-disabled={placeholder || undefined}
            onClick={onClick}
            data-farther-rail-button=""
            className={cn(
              "flex size-9 items-center justify-center rounded-lg text-sidebar-muted-foreground outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-[18px]",
              placeholder
                ? "cursor-default opacity-45"
                : "cursor-pointer hover:bg-sidebar-row-hover hover:text-sidebar-foreground",
              active && "bg-sidebar-row-selected text-sidebar-foreground",
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipPopup side="right">{placeholder ? `${label} · coming soon` : label}</TooltipPopup>
    </Tooltip>
  );
}

function connectionDotClass(phase: string): string {
  if (phase === "connected") return "bg-success";
  if (phase === "connecting" || phase === "reconnecting") return "bg-warning";
  return "bg-error";
}

function initialsOf(label: string): string {
  const words = label.split(/[\s._-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0]![0]! + words[1]![0]! : label.slice(0, 2);
  return letters.toUpperCase();
}

function EnvironmentBadge({ onClick }: { onClick: () => void }) {
  const environment = usePrimaryEnvironment();
  if (environment === null) return null;
  const phase = environment.connection.phase;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`${environment.label}, ${phase}`}
            onClick={onClick}
            className="relative flex size-7 cursor-pointer items-center justify-center rounded-full bg-sidebar-row-selected font-farther-mono text-[10px] leading-none text-sidebar-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        {initialsOf(environment.label)}
        <span
          aria-hidden
          className={cn(
            "absolute -right-px -bottom-px size-2 rounded-full ring-2 ring-[var(--sidebar)]",
            connectionDotClass(phase),
          )}
        />
      </TooltipTrigger>
      <TooltipPopup side="right">
        {environment.label} · {phase}
      </TooltipPopup>
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
      <div className="flex flex-col items-center gap-1 pt-1">
        <RailButton
          label="Threads"
          active={!onSettings && pathname !== "/pull-requests" && pathname !== "/usage"}
          onClick={() => void navigate({ to: "/" })}
        >
          <HouseIcon />
        </RailButton>
        <RailButton label="Inbox">
          <InboxIcon />
        </RailButton>
        <RailButton
          label="Automations"
          active={pathname === "/settings/scheduled-tasks"}
          onClick={() => void navigate({ to: "/settings/scheduled-tasks" })}
        >
          <ClockIcon />
        </RailButton>
        <RailButton label="Tasks">
          <ListIcon />
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
      </div>
      <div className="flex flex-col items-center gap-3">
        <RailButton
          label="Settings"
          active={
            onSettings &&
            pathname !== "/settings/scheduled-tasks" &&
            pathname !== "/settings/connections"
          }
          onClick={() => void navigate({ to: "/settings" })}
        >
          <SettingsIcon />
        </RailButton>
        <EnvironmentBadge onClick={() => void navigate({ to: "/settings/connections" })} />
      </div>
    </nav>
  );
}
