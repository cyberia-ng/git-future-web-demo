import {
  FullDiff,
  TreeDiff,
  type Commit,
  type GitObject,
  type RefName,
  type Repo,
  type TreeEntry,
} from "../../pkg/rgit_web";
import { assertNever } from "../helpers/assert-never";
import { refNameFromPlainObject } from "../ref";
import type { DiffWorkerHandle } from "../worker/handler";
import type { Effect } from "./effect";
import { receiveDiff, type EphemeralState } from "./ephemeral";
import {
  reset,
  setPath,
  type AppState,
  type CommitViewState,
  type FileBrowserState,
} from "./state";
import type { Mutator } from "./mutator";

export type ViewModel<S, D, E> = { state: S; derived: D; ephemeral: E };
export type DerivedView = EmptyView | RepoView;

export function viewModel<S, D, E>(state: S, derived: D, ephemeral: E): ViewModel<S, D, E> {
  return { state, derived, ephemeral };
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
  repoState: { name: string; repo: Repo; diffWorker: DiffWorkerHandle } | null,
  state: AppState,
): Promise<[DerivedView | Mutator<AppState>, (Effect<EphemeralState> | undefined)?]> {
  if (repoState === null) {
    if (state.type !== "initial") {
      return [reset()];
    } else {
      return [emptyView];
    }
  }
  const { name, repo, diffWorker } = repoState;
  switch (state.type) {
    case "initial":
      return [emptyView];
    case "file browser": {
      const fileBrowserView = await deriveFileBrowserView(repo, state);
      if (typeof fileBrowserView === "function") {
        return [fileBrowserView];
      }
      return [
        {
          type: "repo",
          name,
          inner: fileBrowserView,
        },
      ];
    }
    case "commit view": {
      const [commitView, effects] = await deriveCommitView(repo, diffWorker, state);
      return [
        {
          type: "repo",
          name,
          inner: commitView,
        },
        effects,
      ];
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

async function deriveCommitView(
  repo: Repo,
  diffWorker: DiffWorkerHandle,
  state: CommitViewState,
): Promise<[CommitView, (Effect<EphemeralState> | undefined)?]> {
  const commit = (await repo.lookup_object(state.commitId)).commit();
  let effect: Effect<EphemeralState> | undefined = undefined;
  if (commit.parents().length === 1) {
    const parent = (await commit.lookup_parents(repo))[0]!;
    const tree = commit.tree();
    const parentTree = parent.tree();
    effect = async (updateEphemeralState) => {
      updateEphemeralState((s) => {
        s.diff = { type: "loading", trees: [parentTree, tree] };
      });
      const diff = await diffWorker.diff([parentTree, tree]);
      updateEphemeralState(receiveDiff([parentTree, tree], diff));
    };
  }
  return [
    {
      type: "commit view",
      commit: commit,
    },
    effect,
  ];
}
