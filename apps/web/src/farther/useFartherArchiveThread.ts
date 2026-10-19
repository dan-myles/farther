import type { ScopedThreadRef } from "@t3tools/contracts";
import {
  isAtomCommandInterrupted,
  settlePromise,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";

import { stackedThreadToast, toastManager } from "~/components/ui/toast";
import { useClientSettings } from "~/hooks/useSettings";
import { useThreadActions } from "~/hooks/useThreadActions";
import { readLocalApi } from "~/localApi";
import { readThreadShell } from "~/state/entities";

/** Archives from a row's hover action, honoring the archive confirmation setting. */
export function useFartherArchiveThread() {
  const { archiveThread } = useThreadActions();
  const confirmThreadArchive = useClientSettings((settings) => settings.confirmThreadArchive);
  return async (threadRef: ScopedThreadRef) => {
    const api = readLocalApi();
    if (confirmThreadArchive && api) {
      const title = readThreadShell(threadRef)?.title ?? "this thread";
      const confirmed = await settlePromise(() =>
        api.dialogs.confirm(`Archive thread "${title}"?`),
      );
      if (confirmed._tag === "Failure" || !confirmed.value) return;
    }
    const result = await archiveThread(threadRef);
    if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
      const error = squashAtomCommandFailure(result);
      toastManager.add(
        stackedThreadToast({
          type: "error",
          title: "Failed to archive thread",
          description: error instanceof Error ? error.message : "An error occurred.",
        }),
      );
    }
  };
}
