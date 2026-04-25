import type { RefNamePlainObject } from "../ref";
import type { Mutator } from "./mutator";

export type AppState = { type: "initial" } | FileBrowserState | CommitViewState;

export const initialAppState: AppState = {
  type: "initial",
};

export type FileBrowserState = {
  type: "file browser";
  commit: FileBrowserCommit;
  path: string[];
};

export type FileBrowserCommit =
  | { type: "ref"; ref: RefNamePlainObject }
  | { type: "detached"; id: string };

export const initialFileBrowserState: FileBrowserState = {
  type: "file browser",
  commit: { type: "ref", ref: { type: "head" } },
  path: [],
};

export type CommitViewState = {
  type: "commit view";
  commitId: string;
};

export function reset(): Mutator<AppState> {
  return () => initialAppState;
}

export function appendPath(component: string): Mutator<AppState> {
  return (draft) => {
    if (draft.type === "file browser") {
      draft.path.push(component);
    }
  };
}

export function setPath(path: string[]): Mutator<AppState> {
  return (draft) => {
    if (draft.type === "file browser") {
      draft.path = path;
    }
  };
}

export function browseCommit(id: string): Mutator<AppState> {
  return () => ({
    type: "file browser",
    commit: { type: "detached", id },
    path: [],
  });
}

export function setFileBrowserRef(ref: RefNamePlainObject): Mutator<AppState> {
  return (draft) => {
    if (draft.type === "file browser") {
      draft.commit = { type: "ref", ref };
    }
  };
}

export function viewCommit(id: string): Mutator<AppState> {
  return () => ({
    type: "commit view",
    commitId: id,
    showLargeDiff: false,
  });
}

export function toUrl(state: AppState): string {
  const components: string[] = [];
  switch (state.type) {
    case "initial":
      break;
    case "file browser": {
      components.push("browse");
      switch (state.commit.type) {
        case "ref": {
          components.push("ref");
          switch (state.commit.ref.type) {
            case "head": {
              components.push("");
              break;
            }
            case "ref": {
              components.push(state.commit.ref.name);
              break;
            }
          }
          break;
        }
        case "detached": {
          components.push("detached");
          components.push(state.commit.id);
          break;
        }
      }
      components.push(...state.path);
      break;
    }
    case "commit view": {
      components.push("commit");
      components.push(state.commitId);
      break;
    }
  }
  return components.map(encodeURIComponent).join("/");
}

export function fromUrl(url: string): AppState {
  const components = url.split("/").map(decodeURIComponent);
  switch (components.shift()) {
    case "browse": {
      const commitComponent = components.shift();
      let commit: FileBrowserCommit;
      switch (commitComponent) {
        case "ref": {
          const refComponent = components.shift();
          let ref: RefNamePlainObject;
          if (refComponent === "" || refComponent === undefined) {
            ref = { type: "head" };
          } else {
            ref = { type: "ref", name: refComponent };
          }
          commit = { type: "ref", ref };
          break;
        }
        case "detached": {
          commit = { type: "detached", id: components.shift() ?? "" };
          break;
        }
        default: {
          commit = { type: "ref", ref: { type: "head" } };
          break;
        }
      }
      const path = components;
      return {
        type: "file browser",
        commit,
        path,
      };
    }
    case "commit": {
      const commitId = components.shift() ?? "";
      return {
        type: "commit view",
        commitId,
      };
    }
    default: {
      return initialAppState;
    }
  }
}
