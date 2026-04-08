import type { WebRepo } from "../pkg/rgit_web";
import type { AppState } from "./state";
import type { GitObject, TreeEntry } from "./types";

export type ViewModel<S, M> = { state: S; model: M };
export type DerivedView = EmptyView | RepoView;

export function viewModel<S, M>(state: S, model: M): ViewModel<S, M> {
  return { state, model };
}

export type EmptyView = {
  type: "empty";
};

export const emptyView: EmptyView = { type: "empty" };

export type RepoView = {
  type: "repo";
  name: string;
  inner: FileBrowserView | { type: "something else" };
};

export type FileBrowserView = {
  type: "file browser";
  inner: TreeView | BlobView;
};

export type TreeView = {
  type: "tree";
  entries: TreeEntry[];
};

export type BlobView = {
  type: "blob";
  content: Uint8Array;
};

export async function resolveView(
  repoState: { name: string; repo: WebRepo } | null,
  state: AppState,
): Promise<DerivedView> {
  if (repoState === null) {
    return emptyView;
  }
  const { name, repo } = repoState;
  switch (state.type) {
    case "initial":
      return emptyView;
    case "file browser": {
      const head = await repo.head();
      const commit: GitObject = (await head.resolve_to_object()).to_js();
      if (commit.body.type !== "Commit") {
        throw new Error("HEAD did not point to a commit");
      }

      let viewingObject: GitObject = (await repo.lookup_object(commit.body.tree)).to_js();

      let workingPath = [...state.inner.path];
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
      switch (viewingObject.body.type) {
        case "Tree": {
          return {
            type: "repo",
            name,
            inner: {
              type: "file browser",
              inner: { type: "tree", entries: viewingObject.body.entries },
            },
          };
        }
        case "Blob": {
          return {
            type: "repo",
            name,
            inner: {
              type: "file browser",
              inner: { type: "blob", content: viewingObject.body.data },
            },
          };
        }
        default: {
          throw new Error("not implemented");
        }
      }
    }
  }
}
