import { describe, expect, it } from "vite-plus/test";

import { groupSidebarThreadsByProject } from "./projectGroups";

type Thread = { id: string; project: string | null };

const describeThread = (thread: Thread) => ({
  groupKey: thread.project ?? "",
  label: thread.project ?? "",
  isChat: thread.project === null,
});

describe("groupSidebarThreadsByProject", () => {
  it("orders folders by their first thread and keeps thread order inside each", () => {
    const groups = groupSidebarThreadsByProject(
      [
        { id: "a", project: "paseo" },
        { id: "b", project: "farther" },
        { id: "c", project: "paseo" },
        { id: "d", project: "farther" },
      ],
      describeThread,
    );

    expect(groups.projects.map((group) => group.label)).toEqual(["paseo", "farther"]);
    expect(groups.projects[0]!.threads.map((thread) => thread.id)).toEqual(["a", "c"]);
    expect(groups.projects[1]!.threads.map((thread) => thread.id)).toEqual(["b", "d"]);
  });

  it("puts project-less threads in chats, not in a folder", () => {
    const groups = groupSidebarThreadsByProject(
      [
        { id: "a", project: null },
        { id: "b", project: "farther" },
        { id: "c", project: null },
      ],
      describeThread,
    );

    expect(groups.chats.map((thread) => thread.id)).toEqual(["a", "c"]);
    expect(groups.projects.map((group) => group.label)).toEqual(["farther"]);
  });
});
