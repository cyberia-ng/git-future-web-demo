import { WebRefName, type WebRepo } from "../pkg/rgit_web";
import { assertNever } from "./assert-never";
import { fakeViewModel } from "./fake-view";
import type { UpdateState } from "./props";
import {
  setPath,
  type AppState,
  type CommitViewState,
  type FileBrowserState,
  type Mutator,
} from "./state";
import { commit, type Commit, type GitObject, type RefName, type TreeEntry } from "./types";

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
  inner: FileBrowserView | CommitView;
};

export type CommitView = {
  type: "commit view";
  commit: Commit;
};

export type FileBrowserView = {
  type: "file browser";
  refs: RefName[];
  commit: Commit;
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
): Promise<DerivedView | Mutator<AppState>> {
  if (repoState === null) {
    return emptyView;
  }
  const { name, repo } = repoState;
  switch (state.type) {
    case "initial":
      return emptyView;
    case "file browser": {
      const fileBrowserView = await deriveFileBrowserView(repo, state);
      if (typeof fileBrowserView === "function") {
        return fileBrowserView;
      }
      return {
        type: "repo",
        name,
        inner: fileBrowserView,
      };
    }
    case "commit view": {
      const commitView = await deriveCommitView(repo, state);
      return {
        type: "repo",
        name,
        inner: commitView,
      };
    }
  }
  assertNever(state);
}

async function deriveFileBrowserView(
  repo: WebRepo,
  state: FileBrowserState,
): Promise<FileBrowserView | Mutator<AppState>> {
  const refs: RefName[] = (await repo.ref_names()).map((n) => n.to_js());
  let objectId: string;
  switch (state.commit.type) {
    case "ref": {
      const webRef = await repo.lookup_ref(new WebRefName(state.commit.ref));
      objectId = await webRef.resolve_object_id();
      break;
    }
    case "detached": {
      objectId = state.commit.id;
    }
  }
  const commit: Commit | null = await peelToCommit(repo, objectId);
  const tree: GitObject = (await repo.lookup_object(commit.body.tree)).to_js();

  let viewingObject: GitObject = tree;
  let pathComponent: string | undefined;
  for (let pathComponentIdx = 0; pathComponentIdx < state.path.length; pathComponentIdx++) {
    pathComponent = state.path[pathComponentIdx];
    if (viewingObject.body.type === "Tree") {
      const entry = viewingObject.body.entries.find((entry) => entry.name === pathComponent);
      if (entry === undefined) {
        return setPath(state.path.slice(0, pathComponentIdx));
      }
      viewingObject = (await repo.lookup_object(entry.id)).to_js();
    } else {
      break;
    }
  }
  switch (viewingObject.body.type) {
    case "Tree": {
      return {
        type: "file browser",
        refs,
        commit,
        inner: { type: "tree", entries: viewingObject.body.entries },
      };
    }
    case "Blob": {
      return {
        type: "file browser",
        refs,
        commit,
        inner: { type: "blob", content: viewingObject.body.data },
      };
    }
    default: {
      throw new Error("not implemented");
    }
  }
}

async function deriveCommitView(repo: WebRepo, state: CommitViewState): Promise<CommitView> {
  const commit: Commit | null = await peelToCommit(repo, state.commitId);
  return {
    type: "commit view",
    commit,
  };
}

async function peelToCommit(repo: WebRepo, objectId: string): Promise<Commit> {
  const object: GitObject = (await repo.lookup_object(objectId)).to_js();
  switch (object.body.type) {
    case "Tree":
      throw new Error("Cannot peel a tree to a commit");
    case "Tag": {
      return peelToCommit(repo, object.body.target);
    }
    case "Commit": {
      return commit(object)!;
    }
    case "Blob": {
      throw new Error("Cannot peel a blob to a tree");
    }
  }
}
