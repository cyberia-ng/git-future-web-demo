import {
  Diff,
  type Commit,
  type GitObject,
  type RefName,
  type Repo,
  type TreeEntry,
} from "../pkg/rgit_web";
import { assertNever } from "./helpers/assert-never";
import { refNameFromPlainObject } from "./ref";
import {
  reset,
  setPath,
  type AppState,
  type CommitViewState,
  type FileBrowserState,
  type Mutator,
} from "./state";
// import type { DiffEntry } from "./types/diff";

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
  diff?: Diff;
};

export type FileBrowserView = {
  type: "file browser";
  refs: RefName[];
  commit: Commit | undefined;
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
  repoState: { name: string; repo: Repo } | null,
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
  repo: Repo,
  state: FileBrowserState,
): Promise<FileBrowserView | Mutator<AppState>> {
  const refs: RefName[] = await repo.ref_names();
  let commit: Commit | undefined;
  let viewingObject: GitObject | undefined;
  switch (state.commit.type) {
    case "ref": {
      const webRef = await repo.lookup_ref(refNameFromPlainObject(state.commit.ref));
      commit = await webRef.peel_to_commit(repo);
      viewingObject = (await webRef.peel_to_tree(repo))?.as_object();
      break;
    }
    case "detached": {
      commit = (await repo.lookup_object(state.commit.id)).commit();
      viewingObject = (await commit.lookup_tree(repo))?.as_object();
    }
  }

  let pathComponent: string | undefined;
  for (let pathComponentIdx = 0; pathComponentIdx < state.path.length; pathComponentIdx++) {
    pathComponent = state.path[pathComponentIdx];
    if (viewingObject?.object_type() === "tree") {
      const entry: TreeEntry | undefined = viewingObject
        .tree()
        .entries()
        .find((entry) => entry.name() === pathComponent);
      if (entry === undefined) {
        return setPath(state.path.slice(0, pathComponentIdx));
      }
      viewingObject = await repo.lookup_object(entry.id());
    } else {
      break;
    }
  }
  switch (viewingObject?.object_type()) {
    case "tree": {
      return {
        type: "file browser",
        refs,
        commit,
        inner: { type: "tree", entries: viewingObject.tree().entries() },
      };
    }
    case "blob": {
      return {
        type: "file browser",
        refs,
        commit,
        inner: { type: "blob", content: viewingObject.blob().data() },
      };
    }
    default: {
      throw new Error("not implemented");
    }
  }
}

async function deriveCommitView(repo: Repo, state: CommitViewState): Promise<CommitView> {
  const commit = (await repo.lookup_object(state.commitId)).commit();
  let diff: Diff | undefined = undefined;
  if (commit.parents().length === 1) {
    const parent = (await commit.lookup_parents(repo))[0]!;
    const tree = await commit.lookup_tree(repo);
    const parentTree = await parent.lookup_tree(repo);
    diff = await Diff.diff(repo, parentTree, tree);
  }
  return {
    type: "commit view",
    commit: commit,
    ...(diff === undefined ? {} : { diff }),
  };
}
