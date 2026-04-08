import { BlobComponent } from "./blob";
import type { StandardProps } from "../props";
import { setPath, type FileBrowserState } from "../state";
import { viewModel, type FileBrowserView } from "../view";
import { Tree } from "./tree";

export function FileBrowser({
  view,
  updateState,
}: StandardProps<FileBrowserState, FileBrowserView>) {
  const nav = <FileBrowserNav view={view} updateState={updateState} />;
  switch (view.model.inner.type) {
    case "tree":
      return (
        <>
          {nav}
          <Tree view={viewModel(view.state, view.model.inner)} updateState={updateState} />
        </>
      );
    case "blob":
      return (
        <>
          {nav}
          <BlobComponent view={viewModel(view.state, view.model.inner)} updateState={updateState} />
        </>
      );
  }
}

export function FileBrowserNav({
  view,
  updateState,
}: StandardProps<FileBrowserState, FileBrowserView>) {
  const linkClassName = "link-body-emphasis fw-semibold text-decoration-none";
  const rootIcon = <i className="bi bi-house-door-fill" aria-label="root" />;
  return (
    <div className="bg-body-tertiary rounded-3 mb-3 d-flex">
      <div className="p-3">Refnav</div>
      <nav aria-label="tree-breadcrumbs">
        <ol className="breadcrumb p-3 mb-0">
          <li className="breadcrumb-item">
            {view.state.path.length === 0 ? (
              rootIcon
            ) : (
              <a className={linkClassName} href="#" onClick={() => updateState(setPath([]))}>
                {rootIcon}
              </a>
            )}
          </li>
          {view.state.path.slice(0, view.state.path.length - 1).map((component, index) => (
            <li key={component} className="breadcrumb-item">
              <a
                className={linkClassName}
                href="#"
                onClick={() => updateState(setPath(view.state.path.slice(0, index + 1)))}
              >
                {component}
              </a>
            </li>
          ))}
          {view.state.path.length > 0 && (
            <li className="breadcrumb-item">{view.state.path[view.state.path.length - 1]}</li>
          )}
          {view.model.inner.type === "tree" && <li className="breadcrumb-item"></li>}
        </ol>
      </nav>
    </div>
  );
}
