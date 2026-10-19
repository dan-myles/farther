import { describe, expect, it } from "vite-plus/test";

import { FARTHER_THREAD_RANK, groupSidebarThreadsByProject } from "./projectGroups";

type Thread = {
  id: string;
  project: string | null;
  rank?: keyof typeof FARTHER_THREAD_RANK;
  at: number;
};

const describeThread = (thread: Thread) => ({
  groupKey: thread.project ?? "",
  label: thread.project ?? "",
  isChat: thread.project === null,
  rank: FARTHER_THREAD_RANK[thread.rank ?? "idle"],
  activity: thread.at,
});

const ids = (threads: ReadonlyArray<Thread>) => threads.map((thread) => thread.id);

describe("groupSidebarThreadsByProject", () => {
  it("orders folders by their latest activity", () => {
    const groups = groupSidebarThreadsByProject(
      [
        { id: "a", project: "paseo", at: 1 },
        { id: "b", project: "farther", at: 3 },
        { id: "c", project: "paseo", at: 2 },
      ],
      describeThread,
    );

    expect(groups.projects.map((group) => group.label)).toEqual(["farther", "paseo"]);
    expect(ids(groups.projects[1]!.threads)).toEqual(["c", "a"]);
  });

  it("puts pinned, then working, then threads needing attention ahead of recent ones", () => {
    const groups = groupSidebarThreadsByProject(
      [
        { id: "recent", project: "farther", at: 9 },
        { id: "attention", project: "farther", rank: "attention", at: 2 },
        { id: "working", project: "farther", rank: "working", at: 3 },
        { id: "pinned", project: "farther", rank: "pinned", at: 1 },
        { id: "older-working", project: "farther", rank: "working", at: 1 },
      ],
      describeThread,
    );

    expect(ids(groups.projects[0]!.threads)).toEqual([
      "pinned",
      "working",
      "older-working",
      "attention",
      "recent",
    ]);
  });

  it("puts project-less threads in chats, sorted the same way", () => {
    const groups = groupSidebarThreadsByProject(
      [
        { id: "a", project: null, at: 1 },
        { id: "b", project: "farther", at: 1 },
        { id: "c", project: null, at: 2 },
        { id: "d", project: null, rank: "working", at: 0 },
      ],
      describeThread,
    );

    expect(ids(groups.chats)).toEqual(["d", "c", "a"]);
    expect(groups.projects.map((group) => group.label)).toEqual(["farther"]);
  });
});
