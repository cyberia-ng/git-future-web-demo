import { useEffect, useState } from "react";
import { WebRepo } from "../pkg/rgit_web";
import {
  addError,
  emptyErrorState,
  initialAppState,
  initialFileBrowserState,
  reset,
  resetErrors,
  type AppState,
  type ErrorState,
  type Mutator,
} from "./state";
import {
  emptyView,
  resolveView,
  viewModel,
  type DerivedView,
  type RepoView,
  type ViewModel,
} from "./view";
import type { StandardProps } from "./props";
import { Errors } from "./errors";
import { produce } from "immer";
import { FileBrowser } from "./file-browser/index";

export function App() {
  const [repo, setRepo] = useState<{ repo: WebRepo; name: string } | null>(null);
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [errorState, setErrorState] = useState<ErrorState>(emptyErrorState);
  const [viewState, setViewState] = useState<ViewModel<AppState, DerivedView>>(
    viewModel(appState, emptyView),
  );

  function updateState(mutator: Mutator<AppState>) {
    setAppState(produce(appState, mutator));
  }
  function updateErrorState(mutator: Mutator<ErrorState>) {
    setErrorState(produce(errorState, mutator));
  }
  function handleError(e: unknown) {
    if (e instanceof Error) {
      updateErrorState(addError(e.message));
    } else {
      updateErrorState(addError("Handled an error without a message"));
    }
    console.error(e);
  }

  useEffect(() => {
    resolveView(repo, appState, updateState)
      .then((model) => model && setViewState({ state: appState, model }))
      .catch(handleError);
  }, [repo, appState]);

  async function openRepo() {
    if (!window.showDirectoryPicker) {
      throw new Error("This browser does not support window.showDirectoryPicker()");
    }
    const handle = await window.showDirectoryPicker();
    const repo = await WebRepo.construct(handle);
    setRepo({ repo, name: handle.name });
    updateState(() => initialFileBrowserState);
    updateErrorState(resetErrors());
  }
  async function closeRepo() {
    setRepo(null);
    updateState(reset());
    updateErrorState(resetErrors());
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
          {viewState.state.type === "initial" ? (
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
          <Repo view={viewModel(viewState.state, viewState.model)} updateState={updateState} />
        )}
      </main>
    </div>
  );
}

function Repo({ view, updateState }: StandardProps<AppState, RepoView>) {
  switch (view.state.type) {
    case "initial":
      return <></>;
    case "file browser": {
      if (view.model.inner.type !== "file browser") {
        throw new Error("unreachable");
      }
      return (
        <FileBrowser
          view={viewModel(view.state.inner, view.model.inner)}
          updateState={updateState}
        />
      );
    }
  }
}
