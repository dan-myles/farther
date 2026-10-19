import { ChevronDownIcon, FolderIcon, PlusIcon } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";

import { useScratchProject } from "~/hooks/useScratchProject";
import { cn } from "~/lib/utils";
import { usePrimaryEnvironmentId } from "~/state/environments";

import { firstValidTimestampMs, resolveSidebarThreadStatus } from "~/components/Sidebar.logic";
import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/models";

import { FARTHER_THREAD_RANK, type FartherSidebarGroups } from "./projectGroups";

const COLLAPSED_PROJECTS_STORAGE_KEY = "farther:sidebar:collapsed-projects";

const FartherGroupedRowContext = createContext(false);

/** True for thread rows rendered inside a farther project folder or the chats list. */
export function useFartherGroupedRow(): boolean {
  return useContext(FartherGroupedRowContext);
}

export function fartherThreadOrder(thread: EnvironmentThreadShell) {
  const status = resolveSidebarThreadStatus(thread);
  const rank =
    thread.pinnedAt !== null
      ? FARTHER_THREAD_RANK.pinned
      : status === "working" || status === "waiting"
        ? FARTHER_THREAD_RANK.working
        : status !== "ready" || thread.hasActionableProposedPlan
          ? FARTHER_THREAD_RANK.attention
          : FARTHER_THREAD_RANK.idle;
  return { rank, activity: firstValidTimestampMs(thread.updatedAt, thread.createdAt) };
}

/**
 * Marks which edges of a scrolling list have rows beyond them, for the CSS fades.
 * Scroll-driven animations would do this without script, but Firefox and Safari
 * don't ship them. Rows are watched too: a folder opening grows the content
 * without resizing the capped list.
 */
function trackScrollEdges(list: HTMLElement | null) {
  if (!list) return;
  const update = () => {
    list.style.setProperty("--farther-scrollbar", `${list.offsetWidth - list.clientWidth}px`);
    list.toggleAttribute("data-more-above", list.scrollTop > 1);
    list.toggleAttribute(
      "data-more-below",
      list.scrollTop + list.clientHeight < list.scrollHeight - 1,
    );
  };
  const resize = new ResizeObserver(update);
  const observeRows = () => {
    resize.disconnect();
    resize.observe(list);
    for (const row of list.children) resize.observe(row);
  };
  const mutations = new MutationObserver(observeRows);
  observeRows();
  mutations.observe(list, { childList: true });
  list.addEventListener("scroll", update, { passive: true });
  return () => {
    resize.disconnect();
    mutations.disconnect();
    list.removeEventListener("scroll", update);
  };
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
      data-farther-section-label={label.toLowerCase()}
      className="flex h-[26px] list-none items-center justify-between px-2.5 text-xs leading-[17px] font-medium text-sidebar-muted-foreground"
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
  onFolderContextMenu: (threads: ReadonlyArray<Thread>, position: { x: number; y: number }) => void;
  renderRow: (thread: Thread) => ReactNode;
}): ReactNode[] {
  const { groups, collapsed, onToggleProject, onAddProject, onFolderContextMenu, renderRow } =
    input;
  const items: ReactNode[] = [];
  items.push(
    <SectionLabel
      key="farther-projects-label"
      label="Projects"
      action={
        <button
          type="button"
          aria-label="Add project"
          onClick={onAddProject}
          className="-mr-1 flex size-5 cursor-pointer items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-row-hover hover:text-sidebar-foreground"
        >
          <PlusIcon className="size-3.5" />
        </button>
      }
    />,
  );
  const folders: ReactNode[] = [];
  for (const group of groups.projects) {
    const isCollapsed = collapsed.has(group.key);
    folders.push(
      <li key={`farther-project:${group.key}`} className="list-none">
        <button
          type="button"
          aria-expanded={!isCollapsed}
          onClick={() => onToggleProject(group.key)}
          onContextMenu={(event) => {
            event.preventDefault();
            onFolderContextMenu(group.threads, { x: event.clientX, y: event.clientY });
          }}
          data-farther-project-row=""
          className="flex h-[30px] w-full cursor-pointer items-center gap-[9px] rounded-[7px] px-2.5 text-left text-[13px] leading-[19px] font-medium text-sidebar-foreground outline-hidden hover:bg-sidebar-row-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <FolderIcon aria-hidden className="size-[15px] shrink-0 text-sidebar-foreground/80" />
          <span className="min-w-0 flex-1 truncate">{group.label}</span>
          <ChevronDownIcon
            aria-hidden
            className={cn(
              "size-3 shrink-0 text-sidebar-muted-foreground transition-transform duration-150 ease-out motion-reduce:transition-none",
              isCollapsed && "-rotate-90",
            )}
          />
        </button>
        <div
          data-farther-project-body=""
          inert={isCollapsed}
          className={cn(
            "grid transition-[grid-template-rows] duration-150 ease-out motion-reduce:transition-none",
            isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
          )}
        >
          <ul
            role="presentation"
            data-farther-project-threads=""
            className="flex min-h-0 flex-col gap-px overflow-hidden"
          >
            <FartherGroupedRowContext.Provider value>
              {group.threads.map(renderRow)}
            </FartherGroupedRowContext.Provider>
          </ul>
        </div>
      </li>,
    );
  }
  // Projects scroll on their own so Chats stays in view under a long list.
  items.push(
    <li key="farther-projects" className="list-none">
      <ul
        role="presentation"
        ref={trackScrollEdges}
        data-farther-projects-scroll=""
        data-farther-scroll=""
        className="flex max-h-[50dvh] flex-col overflow-y-auto overscroll-contain"
      >
        {folders}
      </ul>
    </li>,
  );
  items.push(
    <SectionLabel key="farther-chats-label" label="Chats" action={<FartherNewChatButton />} />,
  );
  if (groups.chats.length > 0) {
    items.push(
      <li key="farther-chats" className="list-none">
        <ul
          role="presentation"
          ref={trackScrollEdges}
          data-farther-chats=""
          data-farther-scroll=""
          className="flex max-h-[24dvh] flex-col gap-px overflow-y-auto overscroll-contain"
        >
          <FartherGroupedRowContext.Provider value>
            {groups.chats.map(renderRow)}
          </FartherGroupedRowContext.Provider>
        </ul>
      </li>,
    );
  }
  return items;
}

function FartherNewChatButton() {
  const primaryEnvironmentId = usePrimaryEnvironmentId();
  const { scratchEnvironmentId, startScratchThread } = useScratchProject();
  const environmentId = scratchEnvironmentId(primaryEnvironmentId);
  return (
    <button
      type="button"
      aria-label="New chat"
      title={
        environmentId === null
          ? "This server can't start chats without a project while its data folder is inside a git checkout."
          : undefined
      }
      disabled={environmentId === null}
      onClick={() => environmentId !== null && void startScratchThread(environmentId)}
      className="-mr-1 flex size-5 cursor-pointer items-center justify-center rounded text-sidebar-muted-foreground hover:bg-sidebar-row-hover hover:text-sidebar-foreground disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent"
    >
      <PlusIcon className="size-3.5" />
    </button>
  );
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
      className="flex size-3 shrink-0 items-center justify-center"
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
