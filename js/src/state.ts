export type AppState = {
  path: string[];
};

export const initialAppState: AppState = {
  path: [],
};

export type StateTransform = (oldState: AppState) => AppState;

export const reset: StateTransform = () => initialAppState;

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
  })
}
