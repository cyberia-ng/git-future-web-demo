import { WebDiff, WebRefName, type WebRepo } from "../pkg/rgit_web";
import { assertNever } from "./helpers/assert-never";
import {
  reset,
  setPath,
  type AppState,
  type CommitViewState,
  type FileBrowserState,
  type Mutator,
} from "./state";
import type { DiffEntry } from "./types/diff";
import { type Commit, type GitObject, type RefName, type TreeEntry } from "./types/git";

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
  diff?: Array<DiffEntry>;
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
  content: string | Uint8Array;
};

export async function resolveView(
  repoState: { name: string; repo: WebRepo } | null,
  state: AppState,
): Promise<DerivedView | Mutator<AppState>> {
  if (repoState === null) {
    if (state.type !== "initial") {
      return reset();
    } else {
      return emptyView;
    }
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
  let commit: Commit | undefined;
  switch (state.commit.type) {
    case "ref": {
      const webRef = await repo.lookup_ref(new WebRefName(state.commit.ref));
      commit = (await webRef.peel_to_commit())?.to_js();
      break;
    }
    case "detached": {
      commit = (await repo.lookup_object(state.commit.id)).to_js();
    }
  }
  const tree: GitObject = (await repo.lookup_object(commit!.tree)).to_js();

  let viewingObject: GitObject = tree;
  let pathComponent: string | undefined;
  for (let pathComponentIdx = 0; pathComponentIdx < state.path.length; pathComponentIdx++) {
    pathComponent = state.path[pathComponentIdx];
    if (viewingObject.type === "Tree") {
      const entry = viewingObject.entries.find((entry) => entry.name === pathComponent);
      if (entry === undefined) {
        return setPath(state.path.slice(0, pathComponentIdx));
      }
      viewingObject = (await repo.lookup_object(entry.id)).to_js();
    } else {
      break;
    }
  }
  switch (viewingObject.type) {
    case "Tree": {
      return {
        type: "file browser",
        refs,
        commit: commit!,
        inner: { type: "tree", entries: viewingObject.entries },
      };
    }
    case "Blob": {
      return {
        type: "file browser",
        refs,
        commit: commit!,
        inner: { type: "blob", content: viewingObject.data },
      };
    }
    default: {
      throw new Error("not implemented");
    }
  }
}

async function deriveCommitView(repo: WebRepo, state: CommitViewState): Promise<CommitView> {
  const commitHandle = (await repo.lookup_object(state.commitId)).commit();
  const commit: Commit = commitHandle.to_js();
  let diff: Array<DiffEntry> | undefined = undefined;
  if (commit.parents.length === 1) {
    const parentHandle = (await commitHandle.lookup_parents())[0]!;
    const tree = await commitHandle.lookup_tree();
    const parentTree = await parentHandle.lookup_tree();
    const diffHandle = await WebDiff.diff(parentTree, tree);
    diff = diffHandle.to_js();
  }
  return {
    type: "commit view",
    commit: commit,
    ...(diff === undefined ? {} : { diff }),
  };
}
