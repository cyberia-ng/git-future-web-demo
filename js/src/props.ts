import type { StateTransform } from "./state";
import type { ViewModel } from "./view";

export type UpdateState = (transformer: StateTransform) => void;

export type StandardProps<T> = {
  view: ViewModel<T>;
  updateState: UpdateState;
};
