import { useEffect, useState } from "react";
import { WebRepo } from "../pkg/rgit_web";
import { Tree } from "./tree";
import { initialAppState, reset, type AppState, type StateTransform } from "./state";
import { initialView, resolveView, type View } from "./view";
import type { StandardProps } from "./props";
import { BlobComponent } from "./blob";

export function App() {
  const [repo, setRepo] = useState<WebRepo | null>(null);
  const [appState, setAppState] = useState<AppState>(initialAppState);
  function updateState(transform: StateTransform) {
    setAppState(transform(appState));
  }
  const [view, setView] = useState<View>(initialView);
  function handleError(e: unknown) {
    console.error(e);
  }

  useEffect(() => {
    resolveView(repo, appState).then(setView).catch(handleError);
  }, [repo, appState]);

  async function openRepo() {
    const handle = await window.showDirectoryPicker();
    const repo = await WebRepo.construct(handle);
    setRepo(repo);
  }
  async function closeRepo() {
    setRepo(null);
    updateState(reset);
  }

  return (
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <header className="d-flex pb-3 mb-5 border-bottom">
        <div className="flex-grow-1">
          <h4 className="mb-0">rgit-web</h4>
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
      <main>{repo && <Repo state={appState} view={view} updateState={updateState} />}</main>
    </div>
  );
}

function Repo({ state, view, updateState }: StandardProps<View>) {
  switch (view.type) {
    case "tree":
      return <Tree state={state} view={view} updateState={updateState} />;
    case "blob":
      return <BlobComponent state={state} view={view} updateState={updateState} />;
  }
}
