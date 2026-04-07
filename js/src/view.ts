import type { WebRepo } from "../pkg/rgit_web";
import type { AppState } from "./state";
import type { GitObject, TreeEntry } from "./types";

export const emptyView: View = { type: "empty" };

export type View = EmptyView | RepoView;

export type RepoView = {
  type: "repo";
  name: string;
  subView: TreeView | BlobView;
};

export type EmptyView = {
  type: "empty";
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
): Promise<View> {
  if (repoState === null) {
    return emptyView;
  }
  const { name, repo } = repoState;
  const head = await repo.head();
  const commit: GitObject = (await head.resolve_to_object()).to_js();
  if (commit.body.type !== "Commit") {
    throw new Error("HEAD did not point to a commit");
  }

  let viewingObject: GitObject = (await repo.lookup_object(commit.body.tree)).to_js();

  let workingPath = [...state.path];
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
      return { type: "repo", name, subView: { type: "tree", entries: viewingObject.body.entries } };
    }
    case "Blob": {
      return { type: "repo", name, subView: { type: "blob", content: viewingObject.body.data } };
    }
    default: {
      throw new Error("not implemented");
    }
  }
}
