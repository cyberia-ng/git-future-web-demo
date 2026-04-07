export type AppState = {
  path: string[];
};

export const initialAppState: AppState = {
  path: [],
};

export type StateTransform = (state: AppState) => AppState;

export function appendPath(component: string): StateTransform {
  return (state) => ({
    ...state,
    path: [...state.path, component],
  });
}

export function setPath(path: string[]): StateTransform {
  return (state) => ({
    ...state,
    path,
  });
}

export const emptyErrorState: ErrorState = {
  messages: [],
};

export type ErrorState = {
  messages: string[];
};

export type ErrorStateTransform = (state: ErrorState) => ErrorState;

export function addError(message: string): ErrorStateTransform {
  return (state) => ({
    ...state,
    messages: [...state.messages, message],
  });
}

export function dismissError(idx: number): ErrorStateTransform {
  return (state) => ({
    ...state,
    messages: [...state.messages.slice(0, idx), ...state.messages.slice(idx + 1)],
  });
}
