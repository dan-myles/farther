import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { create } from "zustand";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "~/components/ui/menu";
import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

import {
  useFartherAdoptNewDrafts,
  useFartherWorkspaces,
  type FartherWorkspacesApi,
} from "./useFartherWorkspaces";
import { normalizeWorkspaceName, type CustomWorkspace } from "./workspaces";

type DialogRequest =
  | { kind: "name"; title: string; initial: string; submit: (name: string) => boolean }
  | { kind: "delete"; workspace: CustomWorkspace; confirm: () => void };
const useDialogRequest = create<{ request: DialogRequest | null }>(() => ({ request: null }));
const closeDialog = () => useDialogRequest.setState({ request: null });

function requestCreate(api: FartherWorkspacesApi) {
  useDialogRequest.setState({
    request: { kind: "name", title: "New workspace", initial: "", submit: api.create },
  });
}

function WorkspaceDialogHost() {
  const request = useDialogRequest((state) => state.request);
  useEffect(() => closeDialog, []);
  if (request === null) return null;
  return request.kind === "name" ? (
    <NameDialog request={request} />
  ) : (
    <Dialog open onOpenChange={(open) => !open && closeDialog()}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete “{request.workspace.name}”?</DialogTitle>
          <DialogDescription>
            Its projects and chats move back to Personal. Nothing else is deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              request.confirm();
              closeDialog();
            }}
          >
            Delete workspace
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function NameDialog({ request }: { request: Extract<DialogRequest, { kind: "name" }> }) {
  const [name, setName] = useState(request.initial);
  const valid = normalizeWorkspaceName(name) !== null;
  return (
    <Dialog open onOpenChange={(open) => !open && closeDialog()}>
      <DialogPopup className="sm:max-w-sm">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (request.submit(name)) closeDialog();
          }}
        >
          <DialogHeader>
            <DialogTitle>{request.title}</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <Input
              autoFocus
              aria-label="Workspace name"
              placeholder="work"
              maxLength={32}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </DialogPanel>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

/** "Personal ▾" in the sidebar header: switch, create, rename, delete. */
export function FartherWorkspaceSwitcher() {
  const api = useFartherWorkspaces();
  useFartherAdoptNewDrafts(api);
  if (api.access === "none") return null;
  const { active, workspaces, access } = api;
  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              data-farther-workspace-switcher=""
              className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1 text-sidebar-foreground outline-hidden hover:bg-sidebar-row-hover focus-visible:ring-2 focus-visible:ring-ring"
            />
          }
        >
          <span className="truncate text-[15px] leading-[22px] font-medium tracking-[-0.01em]">
            {active.name}
          </span>
          <ChevronDownIcon aria-hidden className="size-3 shrink-0 text-sidebar-muted-foreground" />
        </MenuTrigger>
        <MenuPopup align="start" className="min-w-48">
          {workspaces.map((workspace) => (
            <MenuItem key={workspace.id} onClick={() => api.switchTo(workspace)}>
              <CheckIcon className={cn(workspace.id !== active.id && "invisible")} />
              {workspace.name}
            </MenuItem>
          ))}
          {access === "write" ? (
            <>
              <MenuSeparator />
              <MenuItem onClick={() => requestCreate(api)}>
                <PlusIcon />
                New workspace…
              </MenuItem>
              {active.kind === "custom" ? (
                <>
                  <MenuItem
                    onClick={() =>
                      useDialogRequest.setState({
                        request: {
                          kind: "name",
                          title: "Rename workspace",
                          initial: active.name,
                          submit: (name) => api.rename(active, name),
                        },
                      })
                    }
                  >
                    Rename “{active.name}”…
                  </MenuItem>
                  <MenuItem
                    variant="destructive"
                    onClick={() =>
                      useDialogRequest.setState({
                        request: {
                          kind: "delete",
                          workspace: active,
                          confirm: () => api.remove(active),
                        },
                      })
                    }
                  >
                    Delete “{active.name}”…
                  </MenuItem>
                </>
              ) : null}
            </>
          ) : null}
        </MenuPopup>
      </Menu>
      <WorkspaceDialogHost />
    </>
  );
}

/** Page dots at the bottom of the sidebar, one per workspace, plus "+". */
export function FartherWorkspaceDots() {
  const api = useFartherWorkspaces();
  if (api.access === "none") return null;
  const { workspaces, active, access } = api;
  return (
    <div
      data-farther-workspace-dots=""
      className="relative flex h-9 shrink-0 items-center justify-center"
    >
      <div role="tablist" aria-label="Workspaces" className="flex items-center gap-1">
        {workspaces.map((workspace) => {
          const selected = workspace.id === active.id;
          return (
            <Tooltip key={workspace.id}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={workspace.name}
                    onClick={() => api.switchTo(workspace)}
                    className="flex size-4 cursor-pointer items-center justify-center rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  />
                }
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    selected ? "bg-sidebar-foreground" : "bg-sidebar-muted-foreground/45",
                  )}
                />
              </TooltipTrigger>
              <TooltipPopup side="top">{workspace.name}</TooltipPopup>
            </Tooltip>
          );
        })}
      </div>
      {access === "write" ? (
        <button
          type="button"
          aria-label="New workspace"
          onClick={() => requestCreate(api)}
          className="absolute right-2 flex size-6 cursor-pointer items-center justify-center rounded-md text-sidebar-muted-foreground outline-hidden hover:bg-sidebar-row-hover hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PlusIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
