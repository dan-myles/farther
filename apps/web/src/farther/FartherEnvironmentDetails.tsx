import { formatDiffCount } from "@t3tools/client-runtime/diff-count";
import {
  AuthTerminalReadScope,
  AuthTerminalOperateScope,
  type EnvironmentId,
  type PullRequestDetail,
  type ResolvedKeybindingsConfig,
  type VcsStatusResult,
} from "@t3tools/contracts";
import * as Option from "effect/Option";
import { AsyncResult } from "effect/reactivity";
import { FileDiffIcon, MonitorIcon, TerminalIcon } from "lucide-react";

import type { ThreadDetailsPanelProps } from "~/components/chat/ThreadDetailsPanel";
import { classifyPullRequestChecks } from "~/components/pullRequest/pullRequestDetail.logic";
import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import { shortcutLabelForCommand } from "~/keybindings";
import { useEnvironment } from "~/state/environments";
import { useEnvironmentQuerySelector } from "~/state/query";
import { useEnvironmentScope } from "~/state/session";
import { vcsEnvironment } from "~/state/vcs";

const statusValue = (result: AsyncResult.AsyncResult<VcsStatusResult, unknown>) =>
  Option.getOrNull(AsyncResult.value(result));
const selectFileCount = (result: AsyncResult.AsyncResult<VcsStatusResult, unknown>) =>
  statusValue(result)?.workingTree.files.length ?? null;
const selectAdditions = (result: AsyncResult.AsyncResult<VcsStatusResult, unknown>) => {
  const status = statusValue(result);
  return status ? (status.branchChanges ?? status.workingTree).insertions : null;
};
const selectDeletions = (result: AsyncResult.AsyncResult<VcsStatusResult, unknown>) => {
  const status = statusValue(result);
  return status ? (status.branchChanges ?? status.workingTree).deletions : null;
};

export function FartherWorkspaceMeta({
  environmentId,
  mode,
  autoLabel,
}: {
  environmentId: EnvironmentId;
  mode: "local" | "worktree";
  autoLabel: string | undefined;
}) {
  const environment = useEnvironment(environmentId);
  return (
    <span data-farther-env-workspace="">
      <MonitorIcon aria-hidden />
      <span>{autoLabel ?? environment?.label ?? "Run on"}</span>
      <span data-farther-env-meta="">{mode}</span>
    </span>
  );
}

export function FartherScriptLabel({ name }: { name: string }) {
  return /^run\b/i.test(name) ? name : `Run ${name}`;
}

export function FartherEditorHint({ keybindings }: { keybindings: ResolvedKeybindingsConfig }) {
  const hint = shortcutLabelForCommand(keybindings, "editor.openFavorite");
  return hint ? <kbd data-farther-env-hint="">{hint}</kbd> : null;
}

export function FartherTerminalRow({ props }: { props: ThreadDetailsPanelProps }) {
  const canRead = useEnvironmentScope(props.environmentId, AuthTerminalReadScope);
  const canWrite = useEnvironmentScope(props.environmentId, AuthTerminalOperateScope);
  if (!props.onToggleTerminal) return null;
  return (
    <button
      type="button"
      data-farther-env-row="terminal"
      disabled={!canRead && !canWrite}
      onClick={props.onToggleTerminal}
    >
      <TerminalIcon aria-hidden />
      <span>Terminal</span>
      <kbd data-farther-env-hint="">
        {shortcutLabelForCommand(props.keybindings, "terminal.toggle")}
      </kbd>
    </button>
  );
}

export function FartherChangesRow({ props }: { props: ThreadDetailsPanelProps }) {
  const atom = props.gitCwd
    ? vcsEnvironment.status({ environmentId: props.environmentId, input: { cwd: props.gitCwd } })
    : null;
  const count = useEnvironmentQuerySelector(atom, selectFileCount);
  const additions = useEnvironmentQuerySelector(atom, selectAdditions);
  const deletions = useEnvironmentQuerySelector(atom, selectDeletions);
  if (!props.isGitRepo) return null;
  const total = (additions ?? 0) + (deletions ?? 0);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            data-farther-env-row="changes"
            disabled={!props.onOpenChanges}
            onClick={props.onOpenChanges}
          />
        }
      >
        <FileDiffIcon aria-hidden />
        <span>
          {count === null
            ? "Changes"
            : count === 0 && total > 0
              ? "Branch changes"
              : `${count} ${count === 1 ? "file" : "files"} changed`}
        </span>
        {additions !== null && deletions !== null ? (
          <span data-farther-env-diff="" className="font-farther-mono">
            <span>+{formatDiffCount(additions)}</span>
            <span>−{formatDiffCount(deletions)}</span>
          </span>
        ) : null}
        {total > 0 ? (
          <span data-farther-env-diff-bar="" aria-hidden>
            <span style={{ flexGrow: additions ?? 0 }} />
            <span style={{ flexGrow: deletions ?? 0 }} />
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipPopup side="left">
        {count === null
          ? "Open changes"
          : `${count} uncommitted ${count === 1 ? "file" : "files"}. Line totals include changes since the base branch.`}
      </TooltipPopup>
    </Tooltip>
  );
}

export function FartherBaseBranch({ status }: { status: VcsStatusResult | null }) {
  const base = status?.pr?.baseRef ?? status?.branchChanges?.baseRef;
  return base ? <span data-farther-env-base="">← {base}</span> : null;
}

export function FartherPrStatus({ detail }: { detail: PullRequestDetail | null }) {
  if (!detail || detail.state !== "open") return null;
  const checks = classifyPullRequestChecks(detail.checks);
  const label = detail.isDraft ? "draft" : checks === "none" ? "open" : checks;
  return <span data-farther-env-pr-status={label}>{label}</span>;
}
