import type { StandardProps } from "./props";
import { appendPath, setPath } from "./state";
import type { TreeEntry } from "./types";
import type { BlobView, TreeView } from "./view";

export function TreeNav({ updateState, view }: StandardProps<TreeView | BlobView>) {
  const linkClassName = "link-body-emphasis fw-semibold text-decoration-none";
  const rootIcon = <i className="bi bi-house-door-fill" aria-label="root" />;
  return (
    <nav aria-label="tree-breadcrumbs">
      <ol className="breadcrumb p-3 bg-body-tertiary rounded-3">
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
        {view.model.type === "tree" && <li className="breadcrumb-item"></li>}
      </ol>
    </nav>
  );
}

export function Tree({ view, updateState }: StandardProps<TreeView>) {
  const directories = view.model.entries.filter((entry) => entry.entry_type === "Tree");
  const others = view.model.entries.filter((entry) => entry.entry_type !== "Tree");
  function BasicEntry({
    icon,
    ariaLabel,
    name,
    onClick,
  }: {
    icon: string;
    ariaLabel: string;
    name: string;
    onClick: () => void;
  }) {
    return (
      <a className="list-group-item list-group-item-action" href="#" onClick={onClick}>
        <div className="d-flex align-items-center">
          <div className="me-2">
            <i className={`text-body bi bi-${icon}`} aria-label={ariaLabel} />
          </div>
          <div>{name}</div>
        </div>
      </a>
    );
  }
  function Entry({ entry }: { entry: TreeEntry }) {
    let icon;
    let ariaLabel;
    switch (entry.entry_type) {
      case "Tree":
        icon = "folder-fill";
        ariaLabel = "subdirectory";
        break;
      case "File":
      case "Executable":
        icon = "file";
        ariaLabel = "file";
        break;
      case "Symlink":
        icon = "link-45deg";
        ariaLabel = "symlink";
        break;
      case "Commit":
        icon = "folder-symlink";
        ariaLabel = "submodule";
        break;
    }
    return (
      <BasicEntry
        name={entry.name}
        icon={icon}
        ariaLabel={ariaLabel}
        onClick={() => updateState(appendPath(entry.name))}
      />
    );
  }
  return (
    <div className="list-group">
      {directories.map((entry) => (
        <Entry entry={entry} key={entry.name} />
      ))}
      {others.map((entry) => (
        <Entry entry={entry} key={entry.name} />
      ))}
    </div>
  );
}
