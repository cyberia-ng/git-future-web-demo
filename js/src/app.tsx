import { useState, type ReactNode } from "react";
import { WebRefName, WebRepo } from "../pkg/rgit_web";
import { Async } from "./async";

export function App() {
  const [repo, setRepo] = useState<WebRepo | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [path, setPath] = useState<string[]>([]);

  async function openRepo() {
    const handle = await window.showDirectoryPicker();
    const repo = await WebRepo.construct(handle);
    setRepo(repo);
  }
  async function closeRepo() {
    setRepo(null);
  }

  return (
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <header className="d-flex pb-3 mb-5 border-bottom">
        <div className="flex-grow-1">
          <h4 className="mb-0">rgit-web</h4>
        </div>
        <div>
          {repo === null ? (
            <button onClick={() => openRepo().catch(setRepo)} className="btn btn-primary">
              Open repo
            </button>
          ) : (
            <button onClick={() => closeRepo().catch(setError)} className="btn btn-secondary">
              Close repo
            </button>
          )}
        </div>
      </header>
      <main>{repo && <Async component={Repo} repo={repo} path={path} setPath={setPath} />}</main>
    </div>
  );
}

async function Repo({
  repo,
  path,
  setPath,
}: {
  repo: WebRepo;
  path: string[];
  setPath: (path: string[]) => void;
}) {
  const head = await repo.head();
  const commit = await head.resolve_to_object();
  const commitJs: GitObject = commit.to_js();
  if (commitJs.body.type !== "Commit") {
    throw new Error("HEAD did not point to a commit");
  }

  let viewingObject: GitObject = (await repo.lookup_object(commitJs.body.tree)).to_js();

  let workingPath = [...path];
  let pathComponent: string | undefined;
  while (workingPath.length !== 0) {
    pathComponent = workingPath.shift();
    if (viewingObject.body.type === "Tree") {
      const entry = viewingObject.body.entries.find((entry) => entry.name === pathComponent);
      if (entry === undefined) {
        throw new Error("Tree entry not found for path");
      }
      viewingObject = (await repo.lookup_object(entry.id)).to_js();
    } else {
      break;
    }
  }

  let component: ReactNode;
  switch (viewingObject.body.type) {
    case "Tree":
      component = (
        <Tree
          entries={viewingObject.body.entries}
          appendPath={(component: string) => setPath([...path, component])}
          popPath={() => setPath(path.slice(0, path.length - 1))}
          isRoot={path.length === 0}
        />
      );
      break;
    case "Blob":
      component = <>blob</>;
      break;
    case "Tag":
      component = <>tag</>;
      break;
    case "Commit":
      component = <>commit</>;
      break;
  }

  return <div>{component}</div>;
}

type GitObject = {
  id: string;
  body:
  | {
    type: "Commit";
    author_name: string;
    author_email: string;
    author_date: string;
    committer_name: string;
    committer_email: string;
    commit_date: string;
    tree: string;
    parents: string[];
    message: string;
  }
  | {
    type: "Tree";
    entries: Array<TreeEntry>;
  }
  | { type: "Tag" }
  | { type: "Blob" };
};

type TreeEntry = {
  id: string;
  name: string;
  entry_type: "Tree" | "Symlink" | "File" | "Executable" | "Commit";
};

function Tree({
  entries,
  appendPath,
  popPath,
  isRoot,
}: {
  entries: TreeEntry[];
  appendPath: (component: string) => void;
  popPath: () => void;
  isRoot: boolean;
}) {
  const directories = entries.filter((entry) => entry.entry_type === "Tree");
  const others = entries.filter((entry) => entry.entry_type !== "Tree");
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
        onClick={() => appendPath(entry.name)}
      />
    );
  }
  return (
    <div className="list-group">
      {!isRoot && (
        <BasicEntry name=".." icon="" ariaLabel="parent directory" onClick={() => popPath()} />
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

type RefName =
  | { type: "Branch"; value: string }
  | { type: "Tag"; value: string }
  | { type: "Remote"; value: string }
  | { type: "Head" };
function Refs({ repo }: { repo: WebRepo }) {
  return (
    <Async
      repo={repo}
      component={async ({ repo }: { repo: WebRepo }) => {
        const refs: Array<WebRefName> = await repo.refs();
        const names: Array<[string, string]> = refs
          .map((ref): RefName => ref.to_js())
          .map((name) => {
            switch (name.type) {
              case "Branch":
              case "Tag":
              case "Remote":
                return [name.type, name.value];
              case "Head":
                return [name.type, ""];
            }
          });
        return (
          <ul>
            {names.map(([type, name]) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        );
      }}
    />
  );
}
