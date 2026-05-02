import type { ReactNode } from "react";
import { Folder, File, Link as LinkIcon, ExternalLink } from "react-feather";
import { assertString } from "../helpers/assert-string";
import type { StandardProps } from "../props";
import { type FileBrowserState, appendPath } from "../model/state";
import type { TreeView } from "../model/view-model";
import { Link } from "../link";
import type { TreeEntry } from "../../pkg/git_async_web";

export function Tree({ view, updateState }: StandardProps<FileBrowserState, TreeView>) {
  const directories = view.derived.entries.filter((entry) => entry.entry_type === "tree");
  const others = view.derived.entries.filter((entry) => entry.entry_type !== "tree");
  function Entry({ entry }: { entry: TreeEntry }) {
    let icon: ReactNode;
    switch (entry.entry_type) {
      case "tree":
        icon = <Folder aria-label="subdirectory" size={20} style={{ translate: "0 -0.1lh" }} />;
        break;
      case "file":
      case "executable":
        icon = <File aria-label="file" size={20} style={{ translate: "0 -0.1lh" }} />;
        break;
      case "symlink":
        icon = <LinkIcon aria-label="symlink" size={20} style={{ translate: "0 -0.1lh" }} />;
        break;
      case "commit":
        icon = <ExternalLink aria-label="submodule" size={20} style={{ translate: "0 -0.1lh" }} />;
        break;
    }
    const name = assertString(entry.name());
    return (
      <Link
        className="list-group-item list-group-item-action"
        onClick={() => updateState(appendPath(name))}
      >
        <div className="d-flex align-items-center">
          <div className="me-2">{icon}</div>
          <div>{name}</div>
        </div>
      </Link>
    );
  }
  return (
    <div className="list-group">
      {directories.map((entry) => (
        <Entry entry={entry} key={assertString(entry.name())} />
      ))}
      {others.map((entry) => (
        <Entry entry={entry} key={assertString(entry.name())} />
      ))}
    </div>
  );
}
