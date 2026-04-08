import type { StandardProps } from "../props";
import { appendPath, type FileBrowserState } from "../state";
import type { TreeEntry } from "../types";
import { type TreeView } from "../view";

export function Tree({ view, updateState }: StandardProps<FileBrowserState, TreeView>) {
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
