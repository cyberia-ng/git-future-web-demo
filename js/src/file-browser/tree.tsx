import type { ReactNode } from "react";
import type { StandardProps } from "../props";
import { appendPath, type FileBrowserState } from "../state";
import { type TreeView } from "../view";
import { ExternalLink, File, Folder, Link } from "react-feather";
import type { TreeEntry } from "../types/git";
import { assertString } from "../helpers/assert-string";

export function Tree({ view, updateState }: StandardProps<FileBrowserState, TreeView>) {
  const directories = view.model.entries.filter((entry) => entry.entry_type === "Tree");
  const others = view.model.entries.filter((entry) => entry.entry_type !== "Tree");
  function Entry({ entry }: { entry: TreeEntry }) {
    let icon: ReactNode;
    switch (entry.entry_type) {
      case "Tree":
        icon = <Folder aria-label="subdirectory" size={20} style={{ translate: "0 -0.1lh" }} />;
        break;
      case "File":
      case "Executable":
        icon = <File aria-label="file" size={20} style={{ translate: "0 -0.1lh" }} />;
        break;
      case "Symlink":
        icon = <Link aria-label="symlink" size={20} style={{ translate: "0 -0.1lh" }} />;
        break;
      case "Commit":
        icon = <ExternalLink aria-label="submodule" size={20} style={{ translate: "0 -0.1lh" }} />;
        break;
    }
    const name = assertString(entry.name);
    return (
      <a
        className="list-group-item list-group-item-action"
        href="#"
        onClick={() => updateState(appendPath(name))}
      >
        <div className="d-flex align-items-center">
          <div className="me-2">{icon}</div>
          <div>{name}</div>
        </div>
      </a>
    );
  }
  return (
    <div className="list-group">
      {directories.map((entry) => (
        <Entry entry={entry} key={assertString(entry.name)} />
      ))}
      {others.map((entry) => (
        <Entry entry={entry} key={assertString(entry.name)} />
      ))}
    </div>
  );
}
