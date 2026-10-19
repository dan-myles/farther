import { DEFAULT_SERVER_SETTINGS, ServerSettings } from "@t3tools/contracts";
import { applyServerSettingsPatch as apply } from "@t3tools/shared/serverSettings";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vite-plus/test";

import {
  itemOfThread,
  normalizeWorkspaceName,
  PERSONAL_WORKSPACE_ID,
  readWorkspaceModel,
  resolveActiveWorkspace,
  toSettingsPatch,
  workspaceThreadFilter,
  type CustomWorkspace,
  type WorkspaceId,
} from "./workspaces";

const work: CustomWorkspace = { kind: "custom", id: "work" as WorkspaceId, name: "Work" };
const project = itemOfThread({ environmentId: "env", id: "thread", projectId: "project" }, false);
const chat = itemOfThread({ environmentId: "env", id: "chat", projectId: "scratch" }, true);
const decodeSettings = Schema.decodeSync(ServerSettings);

function create(workspace = work, createdAt = "2026-01-01T00:00:00.000Z") {
  return toSettingsPatch({ type: "create", id: workspace.id, name: workspace.name, createdAt });
}

describe("farther workspaces", () => {
  it("keeps two moves sent from the same stale snapshot", () => {
    const stale = apply(DEFAULT_SERVER_SETTINGS, create());
    const destination = resolveActiveWorkspace(
      readWorkspaceModel(stale.fartherWorkspaces),
      work.id,
    );
    const otherProject = itemOfThread(
      { environmentId: "env", id: "other-thread", projectId: "other-project" },
      false,
    );
    const first = toSettingsPatch({ type: "move", items: [project, chat], to: destination });
    const second = toSettingsPatch({ type: "move", items: [otherProject], to: destination });

    const settings = apply(apply(stale, first), second);
    const model = readWorkspaceModel(settings.fartherWorkspaces);
    expect(model.placementOf(project)).toBe(work.id);
    expect(model.placementOf(otherProject)).toBe(work.id);
    expect(model.placementOf(chat)).toBe(work.id);
  });

  it("writes null when moving to Personal and resolves the item there", () => {
    const initial = apply(DEFAULT_SERVER_SETTINGS, create());
    const moved = apply(
      initial,
      toSettingsPatch({ type: "move", items: [project, chat], to: work }),
    );
    const personal = readWorkspaceModel(moved.fartherWorkspaces).workspaces[0];
    const patch = toSettingsPatch({ type: "move", items: [project, chat], to: personal });
    expect(patch.fartherWorkspaces.projects?.[project.key]).toBeNull();
    expect(patch.fartherWorkspaces.chats?.[chat.key]).toBeNull();

    const model = readWorkspaceModel(apply(moved, patch).fartherWorkspaces);
    expect(model.placementOf(project)).toBe(PERSONAL_WORKSPACE_ID);
    expect(model.placementOf(chat)).toBe(PERSONAL_WORKSPACE_ID);
  });

  it("returns deleted workspace items to Personal despite a late rename or move", () => {
    const initial = apply(DEFAULT_SERVER_SETTINGS, create());
    const moved = apply(
      initial,
      toSettingsPatch({ type: "move", items: [project, chat], to: work }),
    );
    const deleted = apply(moved, toSettingsPatch({ type: "delete", workspace: work }));
    const deletedModel = readWorkspaceModel(deleted.fartherWorkspaces);
    expect(deletedModel.placementOf(project)).toBe(PERSONAL_WORKSPACE_ID);
    expect(deletedModel.placementOf(chat)).toBe(PERSONAL_WORKSPACE_ID);

    const renamed = apply(
      deleted,
      toSettingsPatch({ type: "rename", workspace: work, name: "Late" }),
    );
    const lateMove = apply(renamed, toSettingsPatch({ type: "move", items: [chat], to: work }));
    const model = readWorkspaceModel(lateMove.fartherWorkspaces);
    expect(model.workspaces.map((workspace) => workspace.id)).toEqual([PERSONAL_WORKSPACE_ID]);
    expect(model.placementOf(project)).toBe(PERSONAL_WORKSPACE_ID);
    expect(model.placementOf(chat)).toBe(PERSONAL_WORKSPACE_ID);
    expect(resolveActiveWorkspace(model, work.id).kind).toBe("personal");
  });

  it("reads Personal first, then creation time with id breaking ties", () => {
    const later: CustomWorkspace = { kind: "custom", id: "later" as WorkspaceId, name: "Later" };
    const earlier: CustomWorkspace = {
      kind: "custom",
      id: "earlier" as WorkspaceId,
      name: "Earlier",
    };
    const settings = apply(
      apply(apply(DEFAULT_SERVER_SETTINGS, create(later, "2026-02-01")), create()),
      create(earlier),
    );
    expect(
      readWorkspaceModel(settings.fartherWorkspaces).workspaces.map((workspace) => workspace.id),
    ).toEqual([PERSONAL_WORKSPACE_ID, earlier.id, work.id, later.id]);
  });

  it("normalizes names and rejects empty, over-long, and control-character names", () => {
    expect(normalizeWorkspaceName("  My   workspace  ")).toBe("My workspace");
    expect(normalizeWorkspaceName("   ")).toBeNull();
    expect(normalizeWorkspaceName("x".repeat(32))).toBe("x".repeat(32));
    expect(normalizeWorkspaceName("x".repeat(33))).toBeNull();
    expect(normalizeWorkspaceName("Bad\u0000name")).toBeNull();
    expect(() => toSettingsPatch({ type: "rename", workspace: work, name: "" })).toThrow();
  });

  it("keeps Personal implicit and resolves unknown placements and selections to it", () => {
    const settings = apply(DEFAULT_SERVER_SETTINGS, {
      fartherWorkspaces: {
        spaces: { personal: { name: "Renamed", createdAt: "2026-01-01" } },
        projects: { [project.key]: "missing" },
        chats: { [chat.key]: "missing" },
      },
    });
    const model = readWorkspaceModel(settings.fartherWorkspaces);
    expect(model.workspaces).toEqual([
      { kind: "personal", id: PERSONAL_WORKSPACE_ID, name: "Personal" },
    ]);
    expect(model.placementOf(project)).toBe(PERSONAL_WORKSPACE_ID);
    expect(model.placementOf(chat)).toBe(PERSONAL_WORKSPACE_ID);
    expect(resolveActiveWorkspace(model, null).kind).toBe("personal");
    expect(resolveActiveWorkspace(model, "missing").kind).toBe("personal");
    expect(() => create({ ...work, id: PERSONAL_WORKSPACE_ID })).toThrow();
  });

  it("preserves creation time on rename and tolerates missing stored metadata", () => {
    const initial = apply(DEFAULT_SERVER_SETTINGS, create());
    const renamed = apply(
      initial,
      toSettingsPatch({ type: "rename", workspace: work, name: "New" }),
    );
    expect(renamed.fartherWorkspaces.spaces[work.id]).toEqual({
      name: "New",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const incomplete = decodeSettings({
      fartherWorkspaces: { spaces: { incomplete: {} } },
    });
    expect(
      resolveActiveWorkspace(readWorkspaceModel(incomplete.fartherWorkspaces), "incomplete").name,
    ).toBe("Untitled");
  });

  it("scopes projects and chats by environment and filters each independently", () => {
    const thread = { environmentId: "env", id: "thread", projectId: "project" };
    expect(itemOfThread(thread, false)).toEqual({ kind: "project", key: "env:project" });
    expect(itemOfThread(thread, true)).toEqual({ kind: "chat", key: "env:thread" });
    const settings = apply(
      apply(DEFAULT_SERVER_SETTINGS, create()),
      toSettingsPatch({ type: "move", items: [project], to: work }),
    );
    const model = readWorkspaceModel(settings.fartherWorkspaces);
    const filter = workspaceThreadFilter(model, work, () => false);
    expect(filter(thread)).toBe(true);
    expect(filter({ ...thread, environmentId: "other" })).toBe(false);
    expect(workspaceThreadFilter(model, work, () => true)(thread)).toBe(false);
    expect(workspaceThreadFilter(model, model.workspaces[0], () => true)(thread)).toBe(true);
    const defaultModel = readWorkspaceModel(DEFAULT_SERVER_SETTINGS.fartherWorkspaces);
    expect(
      workspaceThreadFilter(defaultModel, defaultModel.workspaces[0], () => false)(thread),
    ).toBe(true);
  });
});
