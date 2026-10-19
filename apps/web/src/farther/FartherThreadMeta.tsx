import { useAtomValue } from "@effect/atom-react";
import { formatDiffCount } from "@t3tools/client-runtime/diff-count";
import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/shell";
import type { ScopedThreadRef, VcsStatusResult } from "@t3tools/contracts";
import * as Option from "effect/Option";
import { AsyncResult } from "effect/reactivity";
import { GitBranchIcon } from "lucide-react";
import { memo } from "react";

import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import { useComposerDraftStore } from "~/composerDraftStore";
import { useEnvironmentQuerySelector } from "~/state/query";
import { environmentThreadShells } from "~/state/threads";
import { vcsEnvironment } from "~/state/vcs";

const selectBranch = (thread: EnvironmentThreadShell | null) => thread?.branch ?? null;
const selectWorktreePath = (thread: EnvironmentThreadShell | null) => thread?.worktreePath ?? null;
const selectCurrentBranch = (result: AsyncResult.AsyncResult<VcsStatusResult, unknown>) =>
  Option.getOrNull(AsyncResult.value(result))?.refName ?? null;
const selectAdditions = (result: AsyncResult.AsyncResult<VcsStatusResult, unknown>) => {
  const status = Option.getOrNull(AsyncResult.value(result));
  return status?.isRepo ? (status.branchChanges ?? status.workingTree).insertions : null;
};
const selectDeletions = (result: AsyncResult.AsyncResult<VcsStatusResult, unknown>) => {
  const status = Option.getOrNull(AsyncResult.value(result));
  return status?.isRepo ? (status.branchChanges ?? status.workingTree).deletions : null;
};

export const FartherThreadMeta = memo(
  function FartherThreadMeta({
    threadRef,
    projectCwd,
  }: {
    threadRef: ScopedThreadRef;
    projectCwd: string | null;
  }) {
    const threadAtom = environmentThreadShells.quietThreadShellAtom(threadRef);
    const serverBranch = useAtomValue(threadAtom, selectBranch);
    const serverWorktreePath = useAtomValue(threadAtom, selectWorktreePath);
    const draftBranch = useComposerDraftStore(
      (store) => store.getDraftThreadByRef(threadRef)?.branch ?? null,
    );
    const draftWorktreePath = useComposerDraftStore(
      (store) => store.getDraftThreadByRef(threadRef)?.worktreePath ?? null,
    );
    const cwd = serverWorktreePath ?? draftWorktreePath ?? projectCwd;
    const statusAtom =
      cwd === null
        ? null
        : vcsEnvironment.status({ environmentId: threadRef.environmentId, input: { cwd } });
    const currentBranch = useEnvironmentQuerySelector(statusAtom, selectCurrentBranch);
    const additions = useEnvironmentQuerySelector(statusAtom, selectAdditions);
    const deletions = useEnvironmentQuerySelector(statusAtom, selectDeletions);
    const branch = serverBranch ?? draftBranch ?? currentBranch;

    if (!branch && additions === null && deletions === null) return null;

    return (
      <li data-farther-thread-meta="" className="min-w-0 max-w-1/2">
        <span className="inline-flex min-w-0 max-w-full items-center gap-3 font-farther-mono text-2xs leading-4 font-normal">
          {branch ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex min-w-0 items-center gap-1.25 text-muted-foreground" />
                }
              >
                <GitBranchIcon
                  aria-hidden
                  className="size-3 shrink-0 text-icon-muted"
                  strokeWidth={1.7}
                />
                <span className="truncate">{branch}</span>
              </TooltipTrigger>
              <TooltipPopup>{branch}</TooltipPopup>
            </Tooltip>
          ) : null}
          {additions !== null && deletions !== null ? (
            <span
              role="group"
              aria-label={`${additions} additions, ${deletions} deletions`}
              className="inline-flex shrink-0 items-center gap-3 tabular-nums"
            >
              <span aria-hidden className="text-diff-addition">
                +{formatDiffCount(additions)}
              </span>
              <span aria-hidden className="text-diff-deletion">
                −{formatDiffCount(deletions)}
              </span>
            </span>
          ) : null}
        </span>
      </li>
    );
  },
  (previous, next) =>
    previous.threadRef.environmentId === next.threadRef.environmentId &&
    previous.threadRef.threadId === next.threadRef.threadId &&
    previous.projectCwd === next.projectCwd,
);
