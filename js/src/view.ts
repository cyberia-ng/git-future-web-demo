import type { WebRepo } from "../pkg/rgit_web";
import type { AppState } from "./state";
import type { GitObject, TreeEntry } from "./types";

export const initialView: View = { type: "empty" };

export type View = EmptyView | TreeView | BlobView;

export type EmptyView = {
  type: "empty";
};

export type TreeView = {
  type: "tree";
  isRoot: boolean;
  entries: TreeEntry[];
};

export type BlobView = {
  type: "blob";
  content: Uint8Array;
};

export async function resolveView(repo: WebRepo | null, state: AppState): Promise<View> {
  if (repo === null) {
    return initialView;
  }
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
      return { type: "tree", isRoot: state.path.length == 0, entries: viewingObject.body.entries };
    }
    case "Blob": {
      return { type: "blob", content: viewingObject.body.data };
    }
    default: {
      throw new Error("not implemented");
    }
  }
}
