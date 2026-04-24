import { useEffect, useState } from "react";
import {
  addError,
  emptyErrorState,
  fromUrl,
  initialAppState,
  initialFileBrowserState,
  reset,
  resetErrors,
  toUrl,
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
import { fakeViewModel } from "./fake-view";
import { CommitView } from "./commit-view";
import { assertNever } from "./helpers/assert-never";
import { useHashLocation } from "./use-hash-location";
import { Repo } from "../pkg/rgit_web";

export function App() {
  const development = (import.meta as any).env.NODE_ENV === "development";
  const [fake, setFake] = useState(development);
  const [repo, setRepo] = useState<{ repo: Repo; name: string } | null>(null);
  const [hash, navigate] = useHashLocation();
  const [errorState, setErrorState] = useState<ErrorState>(emptyErrorState);
  const [viewState, setViewState] = useState<ViewModel<AppState, DerivedView>>(
    viewModel(initialAppState, emptyView),
  );

  function updateState(mutator: Mutator<AppState>) {
    navigate(toUrl(produce(fromUrl(hash), mutator)));
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
    if (fake) {
      setViewState(fakeViewModel);
    } else {
      const state = fromUrl(hash);
      resolveView(repo, state)
        .then((modelOrMutator) => {
          if (typeof modelOrMutator === "function") {
            updateState(modelOrMutator);
          } else {
            setViewState({ state, model: modelOrMutator });
          }
        })
        .catch(handleError);
    }
  }, [fake, repo, hash]);

  async function openRepo() {
    if (!window.showDirectoryPicker) {
      throw new Error("This browser does not support window.showDirectoryPicker()");
    }
    const handle = await window.showDirectoryPicker();
    const repo = await Repo.construct(handle);
    setRepo({ repo, name: handle.name });
    updateState(() => initialFileBrowserState);
    updateErrorState(resetErrors());
  }
  async function closeRepo() {
    setFake(false);
    setRepo(null);
    updateState(reset());
    updateErrorState(resetErrors());
  }

  return (
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <header className="d-flex flex-wrap pb-3 mb-5 border-bottom">
        <div className="flex-grow-1">
          <h4 className="mb-0">
            {viewState.model.type === "repo" ? viewState.model.name : "rgit-web"}
          </h4>
        </div>
        {development && (
          <div>
            <button className="btn btn-secondary me-3" onClick={() => setFake(true)}>
              Use fake data
            </button>
          </div>
        )}
        <div>
          {repo === null && !fake ? (
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
          <RepoView view={viewModel(viewState.state, viewState.model)} updateState={updateState} />
        )}
      </main>
    </div>
  );
}

function RepoView({ view, updateState }: StandardProps<AppState, RepoView>) {
  switch (view.state.type) {
    case "initial":
      return <></>;
    case "file browser": {
      if (view.model.inner.type !== "file browser") {
        throw new Error("unreachable");
      }
      return (
        <FileBrowser view={viewModel(view.state, view.model.inner)} updateState={updateState} />
      );
    }
    case "commit view": {
      if (view.model.inner.type !== "commit view") {
        throw new Error("unreachable");
      }
      return (
        <CommitView view={viewModel(view.state, view.model.inner)} updateState={updateState} />
      );
    }
  }
  assertNever(view.state);
}
