import type { StandardProps } from "./props";
import { appendPath, popPath } from "./state";
import type { TreeEntry } from "./types";
import type { TreeView } from "./view";

export function Tree({ view, updateState }: StandardProps<TreeView>) {
  const directories = view.entries.filter((entry) => entry.entry_type === "Tree");
  const others = view.entries.filter((entry) => entry.entry_type !== "Tree");
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
        icon = "folder";
        ariaLabel = "subdirectory";
        break;
      case "File":
      case "Executable":
        icon = "file";
        ariaLabel = "file";
        break;
      case "Symlink":
        icon = "folder-link-45deg";
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
      {!view.isRoot && (
        <BasicEntry
          name=".."
          icon=""
          ariaLabel="parent directory"
          onClick={() => updateState(popPath())}
        />
      )}
      {directories.map((entry) => (
        <Entry entry={entry} key={entry.name} />
      ))}
      {others.map((entry) => (
        <Entry entry={entry} key={entry.name} />
      ))}
    </div>
  );
}
