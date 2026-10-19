import { useAtomValue } from "@effect/atom-react";
import { AuthSettingsWriteScope } from "@t3tools/contracts";
import * as Schema from "effect/Schema";
import { useEffect, useMemo } from "react";

import { useComposerDraftStore } from "~/composerDraftStore";
import { randomUUID } from "~/lib/utils";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { useUpdatePrimarySettings } from "~/hooks/useSettings";
import { useProjects, useThreadShells } from "~/state/entities";
import { usePrimaryEnvironmentId } from "~/state/environments";
import { primaryServerSettingsAtom } from "~/state/server";
import { useEnvironmentScope } from "~/state/session";

import {
  itemOfThread,
  normalizeWorkspaceName,
  PERSONAL_WORKSPACE_ID,
  readWorkspaceModel,
  resolveActiveWorkspace,
  toSettingsPatch,
  workspaceThreadFilter,
  type CustomWorkspace,
  type Workspace,
  type WorkspaceAccess,
  type WorkspaceEdit,
  type WorkspaceId,
  type WorkspaceItem,
} from "./workspaces";

const ACTIVE_WORKSPACE_STORAGE_KEY = "farther:workspace:active";

type ThreadLike = { environmentId: string; id: string; projectId: string };

function useWorkspaceModel() {
  const stored = useAtomValue(primaryServerSettingsAtom, (settings) => settings.fartherWorkspaces);
  // Every config push rebuilds the settings object; only a real change to this
  // field should rebuild the model and repartition the sidebar.
  const storedJson = JSON.stringify(stored);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readWorkspaceModel(stored), [storedJson]);
}

function useScratchProjectKeys(): ReadonlySet<string> {
  const projects = useProjects();
  return useMemo(
    () =>
      new Set(
        projects
          .filter((project) => project.isScratch === true)
          .map((project) => `${project.environmentId}:${project.id}`),
      ),
    [projects],
  );
}

export function useFartherWorkspaceAccess(): WorkspaceAccess {
  const primaryEnvironmentId = usePrimaryEnvironmentId();
  const canWrite = useEnvironmentScope(primaryEnvironmentId, AuthSettingsWriteScope);
  if (primaryEnvironmentId === null) return "none";
  return canWrite ? "write" : "read";
}

export function useFartherWorkspaces() {
  const model = useWorkspaceModel();
  const access = useFartherWorkspaceAccess();
  const [storedActiveId, setStoredActiveId] = useLocalStorage(
    ACTIVE_WORKSPACE_STORAGE_KEY,
    PERSONAL_WORKSPACE_ID as string,
    Schema.String,
  );
  const active = resolveActiveWorkspace(model, storedActiveId);
  const updateSettings = useUpdatePrimarySettings();
  const write = (edit: WorkspaceEdit) => {
    if (access !== "write") return;
    updateSettings(toSettingsPatch(edit));
  };

  return {
    access,
    workspaces: model.workspaces,
    active,
    placementOf: model.placementOf,
    switchTo: (workspace: Workspace) => setStoredActiveId(workspace.id),
    create: (rawName: string): boolean => {
      const name = normalizeWorkspaceName(rawName);
      if (name === null || access !== "write") return false;
      const id = randomUUID() as WorkspaceId;
      write({ type: "create", id, name, createdAt: new Date().toISOString() });
      // The new id resolves to Personal until the settings echo arrives, then sticks.
      setStoredActiveId(id);
      return true;
    },
    rename: (workspace: CustomWorkspace, rawName: string): boolean => {
      const name = normalizeWorkspaceName(rawName);
      if (name === null) return false;
      write({ type: "rename", workspace, name });
      return true;
    },
    remove: (workspace: CustomWorkspace) => {
      write({ type: "delete", workspace });
      if (active.id === workspace.id) setStoredActiveId(PERSONAL_WORKSPACE_ID);
    },
    move: (items: readonly WorkspaceItem[], to: Workspace) => {
      if (items.length > 0) write({ type: "move", items, to });
    },
  };
}

export type FartherWorkspacesApi = ReturnType<typeof useFartherWorkspaces>;

/** The sidebar's partition predicate. Passes everything when there's nothing to scope. */
export function useFartherWorkspaceThreadFilter(): (thread: ThreadLike) => boolean {
  const model = useWorkspaceModel();
  const access = useFartherWorkspaceAccess();
  const [storedActiveId] = useLocalStorage(
    ACTIVE_WORKSPACE_STORAGE_KEY,
    PERSONAL_WORKSPACE_ID as string,
    Schema.String,
  );
  const scratchProjectKeys = useScratchProjectKeys();
  const active = resolveActiveWorkspace(model, storedActiveId);
  return useMemo(() => {
    if (access === "none" || model.workspaces.length === 1) return () => true;
    return workspaceThreadFilter(model, active, (thread) =>
      scratchProjectKeys.has(`${thread.environmentId}:${thread.projectId}`),
    );
  }, [access, model, active, scratchProjectKeys]);
}

export function useFartherThreadItem(): (thread: ThreadLike) => WorkspaceItem {
  const scratchProjectKeys = useScratchProjectKeys();
  return (thread) =>
    itemOfThread(thread, scratchProjectKeys.has(`${thread.environmentId}:${thread.projectId}`));
}

const seenDraftKeys = new Set<string>();
let seededSeenDrafts = false;

/**
 * A thread started on this device while a custom workspace is active joins that
 * workspace: the chat itself, or its project when the project is new. Runs once
 * per draft, so moving the item back to Personal later sticks.
 */
export function useFartherAdoptNewDrafts(api: FartherWorkspacesApi) {
  const drafts = useComposerDraftStore((store) => store.draftThreadsByThreadKey);
  const threads = useThreadShells();
  const scratchProjectKeys = useScratchProjectKeys();
  const { active, access, placementOf, move } = api;
  useEffect(() => {
    if (!seededSeenDrafts) {
      for (const key of Object.keys(drafts)) seenDraftKeys.add(key);
      seededSeenDrafts = true;
      return;
    }
    for (const [key, draft] of Object.entries(drafts)) {
      if (seenDraftKeys.has(key)) continue;
      seenDraftKeys.add(key);
      if (active.kind !== "custom" || access !== "write") continue;
      const thread = {
        environmentId: draft.environmentId,
        id: draft.threadId,
        projectId: draft.projectId,
      };
      const item = itemOfThread(
        thread,
        scratchProjectKeys.has(`${draft.environmentId}:${draft.projectId}`),
      );
      if (item.kind === "project") {
        const projectHasThreads = threads.some(
          (shell) =>
            shell.environmentId === draft.environmentId && shell.projectId === draft.projectId,
        );
        if (projectHasThreads || placementOf(item) !== PERSONAL_WORKSPACE_ID) continue;
      }
      move([item], active);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts]);
}
