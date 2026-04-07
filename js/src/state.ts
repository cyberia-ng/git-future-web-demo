export type AppState = {
  path: string[];
};

export const initialAppState: AppState = {
  path: [],
};

export type StateTransform = (oldState: AppState) => AppState;

export const reset: StateTransform = () => initialAppState;

export function appendPath(component: string): StateTransform {
  return (oldState) => ({
    ...oldState,
    path: [...oldState.path, component],
  });
}

export function popPath(): StateTransform {
  return (oldState) => ({
    ...oldState,
    path: oldState.path.slice(0, oldState.path.length - 1),
  });
}
