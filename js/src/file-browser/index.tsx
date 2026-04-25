import { BlobComponent } from "./blob";
import type { StandardProps } from "../props";
import { setPath, type FileBrowserState } from "../model/state";
import { viewModel, type FileBrowserView } from "../model/view-model";
import { Tree } from "./tree";
import { RefNav } from "./ref-nav";
import { Folder } from "react-feather";
import { Commit } from "./commit";
import { Link } from "../link";

export function FileBrowser({
  view,
  updateState,
}: StandardProps<FileBrowserState, FileBrowserView>) {
  const nav = <FileBrowserNav view={view} updateState={updateState} />;
  switch (view.derived.inner.type) {
    case "tree":
      return (
        <>
          {nav}
          <Tree
            view={viewModel(view.state, view.derived.inner, view.ephemeral)}
            updateState={updateState}
          />
        </>
      );
    case "blob":
      return (
        <>
          {nav}
          <BlobComponent
            view={viewModel(view.state, view.derived.inner, view.ephemeral)}
            updateState={updateState}
          />
        </>
      );
  }
}

export function FileBrowserNav({
  view,
  updateState,
}: StandardProps<FileBrowserState, FileBrowserView>) {
  const linkClassName = "link-body-emphasis fw-semibold text-decoration-none";
  const rootIcon = <Folder aria-label="root" size={20} style={{ translate: "0 -0.1lh" }} />;
  return (
    <>
      <div className="bg-body-tertiary rounded-3 mb-3 d-flex align-items-center">
        <div className="p-3">
          <RefNav view={view} updateState={updateState} />
        </div>
        {view.state.path.length !== 0 && (
          <nav aria-label="tree-breadcrumbs">
            <ol className="breadcrumb p-3 mb-0">
              <li className="breadcrumb-item">
                <Link className={linkClassName} onClick={() => updateState(setPath([]))}>
                  {rootIcon}
                </Link>
              </li>
              {view.state.path.slice(0, view.state.path.length - 1).map((component, index) => (
                <li key={component} className="breadcrumb-item">
                  <Link
                    className={linkClassName}
                    onClick={() => updateState(setPath(view.state.path.slice(0, index + 1)))}
                  >
                    {component}
                  </Link>
                </li>
              ))}
              {view.state.path.length > 0 && (
                <li className="breadcrumb-item">{view.state.path[view.state.path.length - 1]}</li>
              )}
              {view.derived.inner.type === "tree" && <li className="breadcrumb-item"></li>}
            </ol>
          </nav>
        )}
      </div>
      <div className="bg-body-tertiary rounded-3 mb-3">
        <Commit view={view} updateState={updateState} />
      </div>
    </>
  );
}
