import type { AppState, StateTransform } from "./state";

export type UpdateState = (transformer: StateTransform) => void;

export type StandardProps<T> = {
  state: AppState;
  view: T;
  updateState: UpdateState;
};
