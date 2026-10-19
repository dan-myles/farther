import { ChevronDownIcon, ChevronRightIcon, FolderIcon, PlusIcon } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";

import type { FartherSidebarGroups } from "./projectGroups";

const COLLAPSED_PROJECTS_STORAGE_KEY = "farther:sidebar:collapsed-projects";

const FartherGroupedRowContext = createContext(false);

/** True for thread rows rendered inside a farther project folder or the chats list. */
export function useFartherGroupedRow(): boolean {
  return useContext(FartherGroupedRowContext);
}

function readCollapsedProjects(): ReadonlySet<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_PROJECTS_STORAGE_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((key) => typeof key === "string") : []);
  } catch {
    return new Set();
  }
}

export function useFartherCollapsedProjects() {
  const [collapsed, setCollapsed] = useState(readCollapsedProjects);
  const toggle = (key: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(COLLAPSED_PROJECTS_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Collapse state is a convenience; losing it on a full quota is fine.
      }
      return next;
    });
  };
  return { collapsed, toggle };
}

function SectionLabel({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <li
      data-farther-section-label=""
      className="flex h-7 list-none items-center justify-between px-2.5 pt-2 text-xs font-medium text-sidebar-muted-foreground"
    >
      <span>{label}</span>
      {action}
    </li>
  );
}

export function renderFartherProjectGroups<Thread>(input: {
  groups: FartherSidebarGroups<Thread>;
  collapsed: ReadonlySet<string>;
  onToggleProject: (key: string) => void;
  onAddProject: () => void;
  renderRow: (thread: Thread) => ReactNode;
}): ReactNode[] {
  const { groups, collapsed, onToggleProject, onAddProject, renderRow } = input;
  const items: ReactNode[] = [];
  if (groups.projects.length > 0) {
    items.push(
      <SectionLabel
        key="farther-projects-label"
        label="Projects"
        action={
          <button
            type="button"
            aria-label="Add project"
            onClick={onAddProject}
            className="flex size-5 cursor-pointer items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-row-hover hover:text-sidebar-foreground"
          >
            <PlusIcon className="size-3.5" />
          </button>
        }
      />,
    );
  }
  for (const group of groups.projects) {
    const isCollapsed = collapsed.has(group.key);
    items.push(
      <li key={`farther-project:${group.key}`} className="list-none">
        <button
          type="button"
          aria-expanded={!isCollapsed}
          onClick={() => onToggleProject(group.key)}
          data-farther-project-row=""
          className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-left text-sm font-medium text-sidebar-foreground outline-hidden hover:bg-sidebar-row-hover focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FolderIcon aria-hidden className="size-4 shrink-0 text-sidebar-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{group.label}</span>
          {isCollapsed ? (
            <span className="flex items-center gap-1 text-xs font-normal text-sidebar-muted-foreground tabular-nums">
              {group.threads.length}
              <ChevronRightIcon aria-hidden className="size-3.5" />
            </span>
          ) : (
            <ChevronDownIcon aria-hidden className="size-3.5 text-sidebar-muted-foreground" />
          )}
        </button>
        {isCollapsed ? null : (
          <ul role="presentation" data-farther-project-threads="" className="flex flex-col gap-px">
            <FartherGroupedRowContext.Provider value>
              {group.threads.map(renderRow)}
            </FartherGroupedRowContext.Provider>
          </ul>
        )}
      </li>,
    );
  }
  if (groups.chats.length > 0) {
    items.push(<SectionLabel key="farther-chats-label" label="Chats" />);
    items.push(
      <li key="farther-chats" className="list-none">
        <ul role="presentation" data-farther-chats="" className="flex flex-col gap-px">
          <FartherGroupedRowContext.Provider value>
            {groups.chats.map(renderRow)}
          </FartherGroupedRowContext.Provider>
        </ul>
      </li>,
    );
  }
  return items;
}

export function FartherStatusMarker({
  status,
}: {
  status: "working" | "waiting" | "approval" | "input" | "failed" | "done" | "woke" | null;
}) {
  return (
    <span
      aria-hidden
      data-farther-status={status ?? "idle"}
      className="flex size-4 shrink-0 items-center justify-center"
    >
      {status === "working" ? (
        <span className="size-2.5 -rotate-45 rounded-full border-[1.5px] border-sidebar-muted-foreground/30 border-t-sidebar-foreground border-r-sidebar-foreground" />
      ) : status === "approval" || status === "input" || status === "woke" ? (
        <span className="size-[7px] rounded-full bg-warning" />
      ) : status === "failed" ? (
        <span className="size-[7px] rounded-full bg-error" />
      ) : status === "done" ? (
        <span className="size-[7px] rounded-full bg-success" />
      ) : status === "waiting" ? (
        <span className="size-[7px] rounded-full border-[1.5px] border-sidebar-muted-foreground" />
      ) : null}
    </span>
  );
}
