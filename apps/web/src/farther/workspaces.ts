import { scopedProjectKey, scopedThreadKey } from "@t3tools/client-runtime/environment";
import {
  EnvironmentId,
  ProjectId,
  ThreadId,
  type ServerSettings,
  type ServerSettingsPatch,
} from "@t3tools/contracts";

type Stored = ServerSettings["fartherWorkspaces"];
type StoredPatch = NonNullable<ServerSettingsPatch["fartherWorkspaces"]>;

export type WorkspaceId = string & { readonly __brand: "FartherWorkspaceId" };
export const PERSONAL_WORKSPACE_ID = "personal" as WorkspaceId;
export type Workspace =
  | { readonly kind: "personal"; readonly id: WorkspaceId; readonly name: "Personal" }
  | { readonly kind: "custom"; readonly id: WorkspaceId; readonly name: string };
export type CustomWorkspace = Extract<Workspace, { kind: "custom" }>;

export type WorkspaceItem =
  | { readonly kind: "project"; readonly key: string }
  | { readonly kind: "chat"; readonly key: string };

export interface WorkspaceModel {
  readonly workspaces: readonly [Workspace, ...CustomWorkspace[]];
  readonly placementOf: (item: WorkspaceItem) => WorkspaceId;
}

export type WorkspaceAccess = "none" | "read" | "write";

export type WorkspaceEdit =
  | {
      readonly type: "create";
      readonly id: WorkspaceId;
      readonly name: string;
      readonly createdAt: string;
    }
  | { readonly type: "rename"; readonly workspace: CustomWorkspace; readonly name: string }
  | { readonly type: "delete"; readonly workspace: CustomWorkspace }
  | { readonly type: "move"; readonly items: readonly WorkspaceItem[]; readonly to: Workspace };

const personal: Workspace = { kind: "personal", id: PERSONAL_WORKSPACE_ID, name: "Personal" };

export function readWorkspaceModel(stored: Stored): WorkspaceModel {
  const entries = Object.entries(stored.spaces)
    .filter(([id]) => id !== "" && id !== PERSONAL_WORKSPACE_ID && stored.deleted[id] !== true)
    .sort(([leftId, left], [rightId, right]) => {
      if (left.createdAt !== right.createdAt) return left.createdAt < right.createdAt ? -1 : 1;
      return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
    });
  const custom = entries.map(([id, entry]): CustomWorkspace => ({
    kind: "custom",
    id: id as WorkspaceId,
    name: normalizeWorkspaceName(entry.name) ?? "Untitled",
  }));
  const liveIds = new Set(custom.map((workspace) => workspace.id));
  const parsePlacements = (placements: Stored["projects"]) =>
    new Map(
      Object.entries(placements).flatMap(([key, id]) =>
        id !== null && liveIds.has(id as WorkspaceId) ? [[key, id as WorkspaceId] as const] : [],
      ),
    );
  const projects = parsePlacements(stored.projects);
  const chats = parsePlacements(stored.chats);

  return {
    workspaces: [personal, ...custom],
    placementOf: (item) =>
      (item.kind === "project" ? projects : chats).get(item.key) ?? PERSONAL_WORKSPACE_ID,
  };
}

export function resolveActiveWorkspace(model: WorkspaceModel, storedId: string | null): Workspace {
  return model.workspaces.find((workspace) => workspace.id === storedId) ?? model.workspaces[0];
}

export function normalizeWorkspaceName(input: string): string | null {
  if (/\p{Cc}/u.test(input)) return null;
  const name = input.trim().replace(/\s+/gu, " ");
  return name.length > 0 && name.length <= 32 ? name : null;
}

export function toSettingsPatch(edit: WorkspaceEdit): { fartherWorkspaces: StoredPatch } {
  switch (edit.type) {
    case "create": {
      if (edit.id === PERSONAL_WORKSPACE_ID || edit.id === "") {
        throw new Error("A custom workspace needs a non-reserved id");
      }
      const name = normalizeWorkspaceName(edit.name);
      if (name === null) throw new Error("Invalid workspace name");
      return { fartherWorkspaces: { spaces: { [edit.id]: { name, createdAt: edit.createdAt } } } };
    }
    case "rename": {
      const name = normalizeWorkspaceName(edit.name);
      if (name === null) throw new Error("Invalid workspace name");
      return { fartherWorkspaces: { spaces: { [edit.workspace.id]: { name } } } };
    }
    case "delete":
      // Keeping the marker separate means a stale rename cannot undo deletion.
      return { fartherWorkspaces: { deleted: { [edit.workspace.id]: true } } };
    case "move": {
      const projects: Record<string, string | null> = {};
      const chats: Record<string, string | null> = {};
      for (const item of edit.items) {
        const placements = item.kind === "project" ? projects : chats;
        placements[item.key] = edit.to.kind === "personal" ? null : edit.to.id;
      }
      return {
        fartherWorkspaces: {
          ...(Object.keys(projects).length > 0 ? { projects } : {}),
          ...(Object.keys(chats).length > 0 ? { chats } : {}),
        },
      };
    }
  }
}

export function itemOfThread(
  thread: { environmentId: string; id: string; projectId: string },
  isScratch: boolean,
): WorkspaceItem {
  const environmentId = EnvironmentId.make(thread.environmentId);
  return isScratch
    ? { kind: "chat", key: scopedThreadKey({ environmentId, threadId: ThreadId.make(thread.id) }) }
    : {
        kind: "project",
        key: scopedProjectKey({ environmentId, projectId: ProjectId.make(thread.projectId) }),
      };
}

export function workspaceThreadFilter(
  model: WorkspaceModel,
  active: Workspace,
  isScratch: (thread: { environmentId: string; projectId: string }) => boolean,
): (thread: { environmentId: string; id: string; projectId: string }) => boolean {
  return (thread) => model.placementOf(itemOfThread(thread, isScratch(thread))) === active.id;
}
