import { useEffect, useState } from "react";
import { WebRepo } from "../pkg/rgit_web";
import { Tree, TreeNav } from "./tree";
import {
  addError,
  emptyErrorState,
  initialAppState,
  type AppState,
  type ErrorState,
  type ErrorStateTransform,
  type StateTransform,
} from "./state";
import { emptyView, resolveView, type RepoView, type View } from "./view";
import type { StandardProps } from "./props";
import { BlobComponent } from "./blob";
import { Errors } from "./errors";

export function App() {
  const [repo, setRepo] = useState<{ repo: WebRepo; name: string } | null>(null);
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [errorState, setErrorState] = useState<ErrorState>(emptyErrorState);
  function updateState(transform: StateTransform) {
    setAppState(transform(appState));
  }
  function updateErrorState(transform: ErrorStateTransform) {
    setErrorState(transform(errorState));
  }
  const [view, setView] = useState<View>(emptyView);
  function handleError(e: unknown) {
    if (e instanceof Error) {
      updateErrorState(addError(e.message));
    } else {
      updateErrorState(addError("Handled an error without a message"));
    }
    console.error(e);
  }

  useEffect(() => {
    resolveView(repo, appState).then(setView).catch(handleError);
  }, [repo, appState]);

  async function openRepo() {
    const handle = await window.showDirectoryPicker();
    const repo = await WebRepo.construct(handle);
    setRepo({ repo, name: handle.name });
    updateState(() => initialAppState);
    updateErrorState(() => emptyErrorState);
  }
  async function closeRepo() {
    setRepo(null);
    updateState(() => initialAppState);
    updateErrorState(() => emptyErrorState);
  }

  return (
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <header className="d-flex pb-3 mb-5 border-bottom">
        <div className="flex-grow-1">
          <h4 className="mb-0">{view.type === "repo" ? view.name : "rgit-web"}</h4>
        </div>
        <div>
          {repo === null ? (
            <button onClick={() => openRepo().catch(handleError)} className="btn btn-primary">
              Open repo
            </button>
          ) : (
            <button onClick={() => closeRepo().catch(handleError)} className="btn btn-secondary">
              Close repo
            </button>
          )}
        </div>
      </header>
      <main>
        <Errors state={errorState} updateErrorState={updateErrorState} />
        {view.type === "repo" && <Repo state={appState} view={view} updateState={updateState} />}
      </main>
    </div>
  );
}

function Repo({ state, view, updateState }: StandardProps<RepoView>) {
  const nav = <TreeNav state={state} view={view.subView} updateState={updateState} />;
  switch (view.subView.type) {
    case "tree":
      return (
        <>
          {nav}
          <Tree state={state} view={view.subView} updateState={updateState} />
        </>
      );
    case "blob":
      return (
        <>
          {nav}
          <BlobComponent state={state} view={view.subView} updateState={updateState} />
        </>
      );
  }
}
