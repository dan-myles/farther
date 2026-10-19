export type FartherThreadGroup<Thread> = Readonly<{
  key: string;
  label: string;
  threads: ReadonlyArray<Thread>;
}>;

export type FartherSidebarGroups<Thread> = Readonly<{
  projects: ReadonlyArray<FartherThreadGroup<Thread>>;
  chats: ReadonlyArray<Thread>;
}>;

/** Lower ranks sort first inside a folder; activity breaks ties, newest first. */
export const FARTHER_THREAD_RANK = { pinned: 0, working: 1, attention: 2, idle: 3 } as const;

export type FartherThreadPlacement = Readonly<{
  groupKey: string;
  label: string;
  isChat: boolean;
  rank: number;
  activity: number;
}>;

type Placed<Thread> = { thread: Thread; rank: number; activity: number };

const byRankThenActivity = <Thread>(a: Placed<Thread>, b: Placed<Thread>) =>
  a.rank - b.rank || b.activity - a.activity;

/**
 * Splits the sidebar's threads into project folders and project-less chats.
 * Inside each, pinned threads lead, then working ones, then ones waiting on the
 * user, then the rest by activity. Folders follow their latest activity, so a
 * stale pin never holds a quiet project at the top.
 */
export function groupSidebarThreadsByProject<Thread>(
  threads: ReadonlyArray<Thread>,
  describe: (thread: Thread) => FartherThreadPlacement,
): FartherSidebarGroups<Thread> {
  const projects = new Map<
    string,
    { key: string; label: string; activity: number; threads: Placed<Thread>[] }
  >();
  const chats: Placed<Thread>[] = [];
  for (const thread of threads) {
    const { groupKey, label, isChat, rank, activity } = describe(thread);
    const placed = { thread, rank, activity };
    if (isChat) {
      chats.push(placed);
      continue;
    }
    const existing = projects.get(groupKey);
    if (existing) {
      existing.threads.push(placed);
      existing.activity = Math.max(existing.activity, activity);
    } else {
      projects.set(groupKey, { key: groupKey, label, activity, threads: [placed] });
    }
  }
  const unwrap = (placed: Placed<Thread>[]) =>
    placed.toSorted(byRankThenActivity).map((entry) => entry.thread);
  return {
    projects: [...projects.values()]
      .toSorted((a, b) => b.activity - a.activity)
      .map(({ key, label, threads: placed }) => ({ key, label, threads: unwrap(placed) })),
    chats: unwrap(chats),
  };
}
