import type { RefName } from "./types";

export type AppState =
  | { type: "initial" }
  | {
    type: "file browser";
    inner: FileBrowserState;
  };

export const initialAppState: AppState = {
  type: "initial",
};

export type FileBrowserState = {
  ref: RefName;
  path: string[];
};

export const initialFileBrowserState: AppState = {
  type: "file browser",
  inner: {
    ref: { type: "Head" },
    path: [],
  },
};

export type Mutator<State> = (draft: State) => State | undefined;

export function reset(): Mutator<AppState> {
  return (_) => initialAppState;
}

export function appendPath(component: string): Mutator<AppState> {
  return (draft) => {
    if (draft.type === "file browser") {
      draft.inner.path.push(component);
    }
  };
}

export function setPath(path: string[]): Mutator<AppState> {
  return (draft) => {
    if (draft.type === "file browser") {
      draft.inner.path = path;
    }
  };
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
