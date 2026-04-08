import type { AppState, Mutator } from "./state";
import type { ViewModel } from "./view";

export type UpdateState = (mutator: Mutator<AppState>) => void;

export type StandardProps<S, M> = {
  view: ViewModel<S, M>;
  updateState: UpdateState;
};
