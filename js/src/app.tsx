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
import {
  emptyView,
  resolveView,
  derivedViewOf,
  type DerivedView,
  type RepoView,
  type ViewModel,
} from "./view";
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
  const [viewState, setViewState] = useState<ViewModel<DerivedView>>({
    state: appState,
    model: emptyView,
  });
  function handleError(e: unknown) {
    if (e instanceof Error) {
      updateErrorState(addError(e.message));
    } else {
      updateErrorState(addError("Handled an error without a message"));
    }
    console.error(e);
  }

  useEffect(() => {
    resolveView(repo, appState)
      .then((derived) => setViewState({ state: appState, model: derived }))
      .catch(handleError);
  }, [repo, appState]);

  async function openRepo() {
    if (!window.showDirectoryPicker) {
      throw new Error("This browser does not support window.showDirectoryPicker()");
    }
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
          <h4 className="mb-0">
            {viewState.model.type === "repo" ? viewState.model.name : "rgit-web"}
          </h4>
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
        {viewState.model.type === "repo" && (
          <Repo view={derivedViewOf(viewState, viewState.model)} updateState={updateState} />
        )}
      </main>
    </div>
  );
}

function Repo({ view, updateState }: StandardProps<RepoView>) {
  const nav = <TreeNav view={derivedViewOf(view, view.model.subView)} updateState={updateState} />;
  switch (view.model.subView.type) {
    case "tree":
      return (
        <>
          {nav}
          <Tree view={derivedViewOf(view, view.model.subView)} updateState={updateState} />
        </>
      );
    case "blob":
      return (
        <>
          {nav}
          <BlobComponent view={derivedViewOf(view, view.model.subView)} updateState={updateState} />
        </>
      );
  }
}
