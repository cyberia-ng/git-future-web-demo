import type { RefName } from "./types/git";

export type AppState = { type: "initial" } | FileBrowserState | CommitViewState;

export const initialAppState: AppState = {
  type: "initial",
};

export type FileBrowserState = {
  type: "file browser";
  commit: FileBrowserCommit;
  path: string[];
};

export type FileBrowserCommit = { type: "ref"; ref: RefName } | { type: "detached"; id: string };

export const initialFileBrowserState: FileBrowserState = {
  type: "file browser",
  commit: { type: "ref", ref: { type: "Head" } },
  path: [],
};

export type CommitViewState = {
  type: "commit view";
  commitId: string;
};

export type Mutator<State> = (draft: State) => State | undefined;

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
  return () => {
    return {
      type: "file browser",
      commit: { type: "detached", id },
      path: [],
    };
  };
}

export function setFileBrowserRef(ref: RefName): Mutator<AppState> {
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
  });
}

export const emptyErrorState: ErrorState = {
  messages: [],
};

export type ErrorState = {
  messages: string[];
};

export function resetErrors(): Mutator<ErrorState> {
  return (_) => emptyErrorState;
}

export function addError(message: string): Mutator<ErrorState> {
  return (draft) => {
    draft.messages.push(message);
  };
}

export function dismissError(idx: number): Mutator<ErrorState> {
  return (draft) => {
    draft.messages = [...draft.messages.slice(0, idx), ...draft.messages.slice(idx + 1)];
  };
}

export function toUrl(state: AppState): string {
  if (state.type === "initial") return "";
  return btoa(JSON.stringify(state));
}

export function fromUrl(url: string): AppState {
  if (url === "") {
    return initialAppState;
  }
  return JSON.parse(atob(url));
}
