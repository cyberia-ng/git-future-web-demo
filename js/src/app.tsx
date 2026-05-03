import { useEffect, useReducer, useState } from "react";
import { fromUrl, initialFileBrowserState, reset, toUrl, type AppState } from "./model/state";
import {
  emptyView,
  resolveView,
  viewModel,
  type DerivedView,
  type RepoView,
} from "./model/view-model";
import type { StandardProps } from "./props";
import { Errors } from "./errors";
import { FileBrowser } from "./file-browser/index";
import { CommitView } from "./commit-view";
import { assertNever } from "./helpers/assert-never";
import { useHashLocation } from "./use-hash-location";
import { Repo } from "../pkg/git_async_web";
import { DiffWorkerHandle } from "./worker/handler";
import {
  addError,
  emptyEphemeralState,
  resetEphemeral,
  type EphemeralState,
} from "./model/ephemeral";
import type { Mutator } from "./model/mutator";
import { produce } from "immer";
import { createPortal } from "react-dom";

type RepoState = {
  repo: Repo;
  diffWorker: DiffWorkerHandle;
  name: string;
};
export function App({ repoControlRoot }: { repoControlRoot: Element }) {
  const [repo, setRepo] = useState<RepoState | null>(null);
  const [hash, navigate] = useHashLocation();
  const [ephemeralState, updateEphemeralState] = useReducer<
    EphemeralState,
    [Mutator<EphemeralState>]
  >(produce, emptyEphemeralState);
  const [derivedView, setDerivedView] = useState<DerivedView>(emptyView);
  const [appState, setAppState] = useState<AppState>(fromUrl(hash));

  function stateNavigate(mutator: Mutator<AppState>) {
    navigate(toUrl(produce(fromUrl(hash), mutator)));
  }
  function handleError(e: unknown) {
    if (e instanceof Error) {
      updateEphemeralState(addError(e.message));
    } else {
      updateEphemeralState(addError("Handled an error without a message"));
    }
    console.error(e);
  }

  useEffect(() => {
    const newState = fromUrl(hash);
    resolveView(repo, newState)
      .then(([derivedViewOrMutator, effect]) => {
        if (typeof derivedViewOrMutator === "function") {
          stateNavigate(derivedViewOrMutator);
        } else {
          setDerivedView(derivedViewOrMutator);
          setAppState(newState);
          updateEphemeralState(resetEphemeral);
          if (effect !== undefined) {
            effect(updateEphemeralState).catch(handleError);
          }
        }
      })
      .catch(handleError);
  }, [repo, hash]);

  function onOpenRepo(repoState: RepoState) {
    setRepo(repoState);
    stateNavigate(() => initialFileBrowserState);
    updateEphemeralState(resetEphemeral);
  }
  function closeRepo() {
    setRepo(null);
    stateNavigate(reset());
    updateEphemeralState(resetEphemeral);
  }

  return (
    <>
      {createPortal(
        <RepoControl
          repoState={repo}
          onOpen={onOpenRepo}
          onError={handleError}
          onClose={closeRepo}
        />,
        repoControlRoot,
      )}
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <main>
          {repo === null && !window.showDirectoryPicker && (
            <div className="alert alert-warning alert-dismissible" role="alert">
              This browser does not support the{" "}
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker">
                window.showDirectoryPicker API
              </a>
              . Opening a repository will be slow.
            </div>
          )}
          <Errors state={ephemeralState.errors} updateErrorState={updateEphemeralState} />
          {derivedView.type === "repo" && (
            <RepoView
              view={viewModel(appState, derivedView, ephemeralState)}
              updateState={stateNavigate}
            />
          )}
        </main>
      </div>
    </>
  );
}

function RepoView({ view, updateState }: StandardProps<AppState, RepoView, EphemeralState>) {
  switch (view.state.type) {
    case "initial":
      return <></>;
    case "file browser": {
      if (view.derived.inner.type !== "file browser") {
        throw new Error("unreachable");
      }
      return (
        <FileBrowser
          view={viewModel(view.state, view.derived.inner, view.ephemeral)}
          updateState={updateState}
        />
      );
    }
    case "commit view": {
      if (view.derived.inner.type !== "commit view") {
        throw new Error("unreachable");
      }
      return (
        <CommitView
          view={viewModel(view.state, view.derived.inner, view.ephemeral)}
          updateState={updateState}
        />
      );
    }
  }
  assertNever(view.state);
}

function RepoControl({
  repoState: repoState,
  onOpen,
  onError,
  onClose,
}: {
  repoState: RepoState | null;
  onOpen: (repoState: RepoState) => void;
  onError: (e: unknown) => void;
  onClose: () => void;
}) {
  if (repoState !== null) {
    async function closeRepo() {
      repoState?.repo.close();
      repoState?.diffWorker.close();
      onClose();
    }
    return (
      <div className="d-flex align-items-center">
        <div className="me-3">{repoState.name}</div>
        <button onClick={() => closeRepo().catch(onError)} className="btn btn-secondary">
          Close repo
        </button>
      </div>
    );
  }
  if (window.showDirectoryPicker !== undefined) {
    async function openRepo() {
      const handle = await window.showDirectoryPicker();
      const repo = await Repo.construct(handle);
      const diffWorker = await DiffWorkerHandle.init({
        type: "handle",
        handle,
      });
      onOpen({ repo, diffWorker, name: handle.name });
    }
    return (
      <button onClick={() => openRepo().catch(onError)} className="btn btn-primary">
        Open repo
      </button>
    );
  } else {
    async function openRepo(files: FileList) {
      const first = files[0];
      if (first === undefined) {
        throw new Error("empty directory tree");
      }
      const rootName = first.webkitRelativePath.split("/")[0]!;
      const repo = await Repo.construct(files);
      const diffWorker = await DiffWorkerHandle.init({
        type: "file list",
        files,
      });
      onOpen({ repo, diffWorker, name: rootName });
    }
    return (
      <input
        className="btn btn-primary"
        type="file"
        {...{ webkitdirectory: "" }}
        onChange={(e) => openRepo(e.target.files!).catch(onError)}
      />
    );
  }
}
