export type FartherThreadGroup<Thread> = Readonly<{
  key: string;
  label: string;
  threads: ReadonlyArray<Thread>;
}>;

export type FartherSidebarGroups<Thread> = Readonly<{
  projects: ReadonlyArray<FartherThreadGroup<Thread>>;
  chats: ReadonlyArray<Thread>;
}>;

/**
 * Splits the sidebar's already-ordered threads into project folders and
 * project-less chats. Folders keep the order in which their first thread
 * appears, so the most recently active project stays on top, and threads keep
 * upstream's order within a folder.
 */
export function groupSidebarThreadsByProject<Thread>(
  threads: ReadonlyArray<Thread>,
  describe: (thread: Thread) => Readonly<{ groupKey: string; label: string; isChat: boolean }>,
): FartherSidebarGroups<Thread> {
  const projects = new Map<string, { key: string; label: string; threads: Thread[] }>();
  const chats: Thread[] = [];
  for (const thread of threads) {
    const { groupKey, label, isChat } = describe(thread);
    if (isChat) {
      chats.push(thread);
      continue;
    }
    const existing = projects.get(groupKey);
    if (existing) {
      existing.threads.push(thread);
    } else {
      projects.set(groupKey, { key: groupKey, label, threads: [thread] });
    }
  }
  return { projects: [...projects.values()], chats };
}
