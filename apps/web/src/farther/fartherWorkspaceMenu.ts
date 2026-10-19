import type { ContextMenuItem } from "@t3tools/contracts";

import type { FartherWorkspacesApi } from "./useFartherWorkspaces";
import type { WorkspaceItem } from "./workspaces";

export type FartherWorkspaceMenuId = `farther:move:${string}`;

export function isFartherWorkspaceMenuId(id: string): id is FartherWorkspaceMenuId {
  return id.startsWith("farther:move:");
}

/**
 * "Move to workspace" items for a context menu, plus the handler for a click
 * on one of them. Empty when there is only Personal or the client can't write.
 */
export function fartherWorkspaceMenu(
  api: FartherWorkspacesApi,
  items: readonly WorkspaceItem[],
): {
  items: ContextMenuItem<FartherWorkspaceMenuId>[];
  choose: (id: FartherWorkspaceMenuId) => void;
} {
  const first = items[0];
  if (first === undefined || api.access !== "write" || api.workspaces.length < 2) {
    return { items: [], choose: () => {} };
  }
  const current = api.placementOf(first);
  const label = first.kind === "project" ? "Move project to workspace" : "Move to workspace";
  return {
    items: [
      {
        id: "farther:move:menu",
        label,
        separatorBefore: true,
        children: api.workspaces.map((workspace) => ({
          id: `farther:move:${workspace.id}` as const,
          label: workspace.name,
          checked: workspace.id === current,
        })),
      },
    ],
    choose: (id) => {
      const target = api.workspaces.find((workspace) => `farther:move:${workspace.id}` === id);
      if (target !== undefined && target.id !== current) api.move(items, target);
    },
  };
}
