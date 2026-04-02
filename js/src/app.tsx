import { useState } from "react";
import { WebObject, WebRef, WebRefName, WebRepo } from "../pkg/rgit_web";
import { Async } from "./async";

export function App() {
  const [repo, setRepo] = useState<WebRepo | null | Error>(null);
  async function openRepo() {
    const handle = await window.showDirectoryPicker();
    const repo = await WebRepo.construct(handle);
    setRepo(repo);
  }
  let content = null;
  if (repo !== null) {
    if (repo instanceof Error) {
      content = <div>Error: {repo.message}</div>;
    } else {
      content = (
        <>
          <div>
            <div>Refs:</div>
            <Refs repo={repo} />
          </div>
          <div>
            <div>Tree:</div>
            <Tree repo={repo} />
          </div>
        </>
      );
    }
  }
  return (
    <>
      <div>
        <button onClick={() => openRepo().catch(setRepo)}>Open</button>
      </div>
      {content}
    </>
  );
}

type RefName =
  | { type: "Branch"; value: Uint8Array }
  | { type: "Tag"; value: Uint8Array }
  | { type: "Remote"; value: Uint8Array }
  | { type: "Head" };
function Refs({ repo }: { repo: WebRepo }) {
  return (
    <Async
      repo={repo}
      component={async ({ repo }: { repo: WebRepo }) => {
        const refs: Array<WebRefName> = await repo.refs();
        const decoder = new TextDecoder();
        const names: Array<[string, string]> = refs
          .map((ref): RefName => ref.to_js())
          .map((name) => {
            switch (name.type) {
              case "Branch":
              case "Tag":
              case "Remote":
                return [name.type, decoder.decode(name.value)];
              case "Head":
                return [name.type, ""];
            }
          });
        return (
          <ul>
            {names.map(([type, name]) => (
              <li key={name}>
                {type}: {name}
              </li>
            ))}
          </ul>
        );
      }}
    />
  );
}

type GitObject =
  | {
    type: "Commit";
    value: {
      id: Uint8Array;
      author_name: Uint8Array;
      author_email: Uint8Array;
      author_date: string;
      committer_name: Uint8Array;
      committer_email: Uint8Array;
      commit_date: string;
      tree: Uint8Array;
      parents: Uint8Array[];
      message: Uint8Array;
    };
  }
  | {
    type: "Tag";
    value: unknown;
  }
  | {
    type: "Tree";
    value: {
      id: Uint8Array;
      entries: Array<{
        id: Uint8Array;
        name: Uint8Array;
        entry_type: "Tree" | "Blob" | "Symlink" | "Executable";
      }>;
    };
  }
  | {
    type: "Blob";
    value: unknown;
  };
function Tree({ repo }: { repo: WebRepo }) {
  return (
    <Async
      repo={repo}
      component={async ({ repo }: { repo: WebRepo }) => {
        const head = await repo.head();
        const commit = await head.resolve_to_object(repo);
        const commitJs: GitObject = commit.to_js();
        if (commitJs.type !== "Commit") {
          throw new Error("HEAD did not point to a commit");
        }
        const tree = await WebObject.lookup(repo, commitJs.value.tree);
        const treeJs: GitObject = tree.to_js();
        if (treeJs.type !== "Tree") {
          throw new Error("HEAD->tree was not a tree");
        }
        const decoder = new TextDecoder();
        const decodedEntries = treeJs.value.entries.map((entry) => ({
          ...entry,
          name: decoder.decode(entry.name),
        }));
        return (
          <ul>
            {decodedEntries.map((entry) => (
              <li key={entry.name}>
                {entry.entry_type}: {entry.name}
              </li>
            ))}
          </ul>
        );
      }}
    />
  );
}
